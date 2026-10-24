// Caballos del potrero y retratos para las fichas.
// Cada caballo del potrero es un clon de Henry (mismo esqueleto y mismas animaciones originales del autor:
// pastar, reposos y paso con giros) con su propio pelaje, marcas y forma de raza. Versión liviana: sin montura,
// sin mechones modelados (crin de tarjetas), sin IK. Caminan siempre hacia adelante describiendo curvas (nunca
// giran sobre una plataforma), a la velocidad del clip de paso para que los cascos no patinen, y se esquivan:
// ninguno atraviesa a otro, al caballo del jugador, el cerco ni el bebedero.
import * as THREE from 'three';
import { clone as skClone } from 'three/addons/utils/SkeletonUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { bayCoat, coatUniforms, applyCoat } from './horse.js';
import { setBreedShape } from './breed.js';

const WALK_V = 1.0;                  // m/s del clip de paso a velocidad 1 (horse.js WALK_STRIDE)
const TURN_MAX = 0.55;               // rad/s al paso: curvas de ~1,8 m de radio
const BODY = 0.78, RAD = 0.55;       // cada caballo: dos círculos (pecho y anca) a ±0,78 m del centro

// clon liviano con pelaje propio
export class PaddockHorse {
  constructor(src) {
    this.root = new THREE.Group();
    const model = this.model = skClone(src.model);
    this.root.add(model);
    this.U = coatUniforms(); this.maneMats = [];
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      const mn = o.material.name || '';
      if (/Saddle1|Bridle/.test(o.name) || /Strands/.test(o.name) || /^Braid/.test(mn)) { o.visible = false; return; }
      if (/Stallion_Hair/.test(o.name)) { o.visible = true; o.material = o.material.clone(); this.maneMats.push(o.material); }
      if (mn === 'Horse' && o.isSkinnedMesh) bayCoat(o, this.U);
    });
    this.mixer = new THREE.AnimationMixer(model);
    this.act = {};
    for (const n of ['idle', 'idle2', 'idle3', 'eat', 'walk', 'walk_l', 'walk_r']) {
      const c = src.clips[n]; if (!c) continue;
      const a = this.mixer.clipAction(c); a.play(); a.setEffectiveWeight(0); a.time = Math.random() * c.duration; this.act[n] = a;
    }
    this.w = {}; this.lean = 0; this.v = 0;
    this.pick = 'eat';
  }
  // apariencia: pelaje (career.js COATS), marcas, forma de la raza y tamaño
  look(coat, marks, shape, size = 1) {
    applyCoat(this.U, coat, marks);
    for (const m of this.maneMats) m.color.setRGB(...coat.mane);
    setBreedShape(this.model, shape || {});
    this.root.scale.setScalar(size || 1); this.size = size || 1;
  }
  // animación: reposo elegido o paso con giro (lean −1 izquierda … 1 derecha)
  animate(dt) {
    const A = this.act, walking = this.v > 0.05 || this.turning, k = 1 - Math.exp(-dt * 3);
    const tgt = {};
    if (walking) { const l = this.lean; tgt.walk = 1 - Math.abs(l); tgt.walk_l = Math.max(0, -l); tgt.walk_r = Math.max(0, l); }
    else tgt[this.pick] = 1;
    for (const n in A) {
      const was = this.w[n] || 0, want = tgt[n] || 0;
      if (want > 0 && was < 0.02 && n !== 'walk_l' && n !== 'walk_r' && !walking) A[n].time = 0;   // un reposo nuevo empieza desde su primer cuadro
      this.w[n] = was + (want - was) * k; A[n].setEffectiveWeight(this.w[n]);
    }
    const ts = this.turning ? 0.75 : Math.max(0.5, this.v / (WALK_V * this.size));
    for (const n of ['walk', 'walk_l', 'walk_r']) if (A[n]) A[n].timeScale = ts;
    this.mixer.update(dt);
  }
}

// el grupo del potrero: comportamiento, esquives y choques con el caballo del jugador
export class Herd {
  constructor(src, scene, ranch) {
    this.src = src; this.scene = scene; this.R = ranch; this.list = [];
    const P = ranch.paddock; this.box = { x0: P.x0 + 1.8, x1: P.x1 - 1.8, z0: P.z0 + 1.8, z1: P.z1 - 1.8 };
    this.seed = 1;
  }
  rnd() { this.seed = (this.seed * 16807) % 2147483647; return this.seed / 2147483647; }
  // horses: [{ key, coat, marks, shape, size }] — se reutilizan los clones existentes
  set(horses) {
    const key = horses.map((h) => h.key).join('|');
    if (key === this.key) { horses.forEach((h, i) => this.list[i] && this.list[i].look(h.coat, h.marks, h.shape, h.size)); return; }
    this.key = key;
    while (this.list.length > horses.length) { const H = this.list.pop(); this.scene.remove(H.root); }
    horses.forEach((h, i) => {
      let H = this.list[i];
      if (!H) { H = new PaddockHorse(this.src); this.list.push(H); this.scene.add(H.root); this.place(H, i); }
      H.look(h.coat, h.marks, h.shape, h.size); H.name = h.name;
    });
  }
  // lugar libre al azar dentro del potrero
  place(H, i, avoid = null) {
    for (let t = 0; t < 60; t++) {
      const x = this.box.x0 + this.rnd() * (this.box.x1 - this.box.x0), z = this.box.z0 + this.rnd() * (this.box.z1 - this.box.z0), h = this.rnd() * 6.28;
      if (avoid && Math.hypot(x - avoid.x, z - avoid.z) < avoid.r) continue;
      if (this.free(H, x, z, h, null, 2.2)) { H.x = x; H.z = z; H.h = h; break; }
      H.x = this.box.x0 + 3 + i * 4; H.z = this.box.z0 + 3; H.h = 0;
    }
    H.state = 'rest'; H.pick = this.rnd() < 0.6 ? 'eat' : 'idle'; H.t = 4 + this.rnd() * 10;
    this.pose(H);
  }
  pose(H) { H.root.position.set(H.x, 0, H.z); H.root.rotation.y = Math.PI / 2 - H.h; }
  // círculos de pecho y anca
  circles(x, z, h, s = 1) { const c = Math.cos(h) * BODY * s, d = Math.sin(h) * BODY * s; return [[x + c, z + d], [x - c, z - d]]; }
  // ¿cabe un caballo en (x, z, h)? margen extra en metros. others: obstáculos de afuera { x, z, h }
  free(H, x, z, h, others, margin = 0.3) {
    const me = this.circles(x, z, h, H.size || 1), r = RAD * (H.size || 1);
    for (const [cx, cz] of me) {
      if (cx < this.box.x0 - 1.2 || cx > this.box.x1 + 1.2 || cz < this.box.z0 - 1.2 || cz > this.box.z1 + 1.2) return false;   // el cerco (con lugar para la cabeza)
      const T = this.R.trough; if (Math.abs(cx - T.x) < 2.2 + r && Math.abs(cz - T.z) < 1.3 + r) return false;
    }
    const obst = [...this.list.filter((o) => o !== H && o.x != null).map((o) => ({ x: o.x, z: o.z, h: o.h, s: o.size || 1 })), ...(others || [])];
    for (const o of obst) for (const [ax, az] of me) for (const [bx, bz] of this.circles(o.x, o.z, o.h, o.s || 1)) if (Math.hypot(ax - bx, az - bz) < r + RAD * (o.s || 1) + margin) return false;
    return true;
  }
  update(dt, others = []) {
    for (const H of this.list) {
      H.t -= dt;
      H.turning = H.state === 'turn';
      if (H.state === 'turn') {
        // girar en el lugar hacia el destino (pasos de giro del autor), sin meterse en nada
        const want = Math.atan2(H.tz - H.z, H.tx - H.x); let d = want - H.h; d = Math.atan2(Math.sin(d), Math.cos(d));
        const dir = H.turnDir || Math.sign(d) || 1, nh = H.h + dir * 0.75 * dt;
        H.lean += (dir - H.lean) * (1 - Math.exp(-dt * 4)); H.v = 0;
        if (this.free(H, H.x, H.z, nh, others, 0.1)) H.h = nh;
        else if (!H.turnFlip) { H.turnDir = -dir; H.turnFlip = true; }
        else { H.state = 'rest'; H.pick = 'idle'; H.t = 2 + this.rnd() * 3; }
        if (Math.abs(d) < 0.25 || H.t <= 0) { H.state = 'walk'; H.t = 25; }
      } else if (H.state === 'rest') {
        H.v = Math.max(0, H.v - dt * 1.5);
        // si el caballo del jugador se acerca mucho, se aparta caminando
        const near = others.some((o) => Math.hypot(o.x - H.x, o.z - H.z) < 3.4);
        if (H.t <= 0 || near) this.newTarget(H, others, near);
      } else {
        // caminar hacia el destino describiendo una curva
        const want = Math.atan2(H.tz - H.z, H.tx - H.x); let d = want - H.h; d = Math.atan2(Math.sin(d), Math.cos(d));
        const w = Math.max(-TURN_MAX, Math.min(TURN_MAX, d * 1.4));
        H.v += ((Math.abs(d) > 2.2 ? 0.75 : 1.0) * WALK_V * H.size - H.v) * (1 - Math.exp(-dt * 2));
        const nh = H.h + w * dt, nx = H.x + Math.cos(nh) * H.v * dt, nz = H.z + Math.sin(nh) * H.v * dt;
        H.lean += (w / TURN_MAX - H.lean) * (1 - Math.exp(-dt * 4));
        if (this.free(H, nx, nz, nh, others, 0.15)) { H.x = nx; H.z = nz; H.h = nh; }
        else { H.state = 'rest'; H.v = 0; H.lean = 0; H.pick = 'idle2'; H.t = 1.5 + this.rnd() * 2.5; }   // algo en el camino: se detiene y después busca otro rumbo
        if (Math.hypot(H.tx - H.x, H.tz - H.z) < 1.2 || H.t <= 0) { H.state = 'rest'; H.lean = 0; H.pick = this.rnd() < 0.62 ? 'eat' : ['idle', 'idle2', 'idle3'][(this.rnd() * 3) | 0]; H.t = H.pick === 'eat' ? 7.6 * (1 + ((this.rnd() * 2) | 0)) : 5 + this.rnd() * 8; }
      }
      if (H.state === 'rest') H.lean += (0 - H.lean) * (1 - Math.exp(-dt * 4));
      this.pose(H); H.animate(dt);
    }
  }
  newTarget(H, others, away) {
    for (let t = 0; t < 24; t++) {
      let x, z;
      if (away && others.length) { const o = others[0], a = Math.atan2(H.z - o.z, H.x - o.x) + (this.rnd() - 0.5) * 1.6, d = 5 + this.rnd() * 5; x = H.x + Math.cos(a) * d; z = H.z + Math.sin(a) * d; }
      else if (t < 12) { const a = H.h + (this.rnd() - 0.5) * 2.4, d = 4 + this.rnd() * 10; x = H.x + Math.cos(a) * d; z = H.z + Math.sin(a) * d; }
      else { x = this.box.x0 + this.rnd() * (this.box.x1 - this.box.x0); z = this.box.z0 + this.rnd() * (this.box.z1 - this.box.z0); }
      x = Math.max(this.box.x0, Math.min(this.box.x1, x)); z = Math.max(this.box.z0, Math.min(this.box.z1, z));
      // el primer tramo tiene que estar libre
      const a0 = Math.atan2(z - H.z, x - H.x);
      if (this.free(H, H.x + Math.cos(a0) * 0.8, H.z + Math.sin(a0) * 0.8, a0, others, 0.25)) {
        H.tx = x; H.tz = z;
        const d = Math.atan2(Math.sin(a0 - H.h), Math.cos(a0 - H.h));
        if (Math.abs(d) > 0.7) { H.state = 'turn'; H.turnDir = Math.sign(d); H.turnFlip = false; H.t = 9; } else { H.state = 'walk'; H.t = 25; }
        return;
      }
    }
    H.t = 2 + this.rnd() * 3;   // sin salida por ahora: sigue en su lugar
  }
  // el caballo del jugador no atraviesa a los del potrero: si el paso lo mete en uno, no avanza
  // (si ya estaba encimado, puede alejarse: solo se frena lo que empeora el encimado)
  pen(x, z, h) {
    let m = 0; const me = this.circles(x, z, h);
    for (const H of this.list) for (const [ax, az] of me) for (const [bx, bz] of this.circles(H.x, H.z, H.h, H.size)) m = Math.max(m, RAD * (1 + H.size) + 0.05 - Math.hypot(ax - bx, az - bz));
    return m;
  }
  blocks(x, z, h, ox, oz, oh) { const n = this.pen(x, z, h); return n > 0 && (ox == null || n >= this.pen(ox, oz, oh ?? h) - 1e-4); }
  setVisible(on) { for (const H of this.list) H.root.visible = on; }
  // aparta a los que estén donde va a aparecer el caballo del jugador
  clearAround(x, z, r) { for (const H of this.list) if (Math.hypot(H.x - x, H.z - z) < r) this.place(H, 0, { x, z, r: r + 1 }); }
}

// retratos de tres cuartos para las fichas (tienda, cría, tus caballos): se dibujan una vez y se guardan
export class Portraits {
  constructor(renderer, src, env) {
    this.r = renderer; this.cache = new Map();
    const S = this.scene = new THREE.Scene();
    S.environment = env; S.environmentIntensity = 0.7;
    S.add(new THREE.HemisphereLight(0xeaf2ff, 0x6f6a58, 0.9));
    const key = new THREE.DirectionalLight(0xfff1dc, 2.6); key.position.set(-3, 5, 4); S.add(key);
    const rim = new THREE.DirectionalLight(0xdfe9ff, 1.1); rim.position.set(4, 3, -4); S.add(rim);
    // sombra suave al pie
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d');
    const gr = c.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.005; S.add(sh);
    this.H = new PaddockHorse(src); S.add(this.H.root);
    this.H.act.idle.setEffectiveWeight(1); this.H.act.idle.time = 0.5; this.H.act.idle.paused = true;
    this.cam = new THREE.PerspectiveCamera(30, 1.6, 0.1, 50);
    this.W = 480; this.Hh = 300;
    this.comp = new EffectComposer(renderer, new THREE.WebGLRenderTarget(this.W, this.Hh, { type: THREE.UnsignedByteType }));
    this.comp.renderToScreen = false; this.comp.setPixelRatio(1); this.comp.setSize(this.W, this.Hh);
    this.comp.addPass(new RenderPass(S, this.cam)); this.comp.addPass(new OutputPass());
    this.cv = document.createElement('canvas'); this.cv.width = this.W; this.cv.height = this.Hh;
  }
  // devuelve un dataURL (JPEG no: PNG con fondo transparente) del caballo d = { key, coat, marks, shape, size }
  get(d) {
    const k = `${d.key}|${JSON.stringify(d.marks || {})}|${JSON.stringify(d.shape || {})}|${d.size || 1}`;
    if (this.cache.has(k)) return this.cache.get(k);
    const H = this.H; H.look(d.coat, d.marks, d.shape, 1);
    H.mixer.update(0); H.root.updateMatrixWorld(true);
    // encuadre de tres cuartos, el caballo mirando a la izquierda del retrato; el tamaño se ve en la escala
    const s = d.size || 1; H.root.scale.setScalar(s);
    this.cam.position.set(2.9, 1.45, 3.5); this.cam.lookAt(0.05, 1.02, 0.15); this.cam.fov = 31; this.cam.updateProjectionMatrix();
    H.root.rotation.y = 0.15;
    const r = this.r, prevTarget = r.getRenderTarget(), prevClear = r.getClearAlpha(), prevColor = r.getClearColor(new THREE.Color());
    r.setClearColor(0x000000, 0);
    this.comp.render(0);
    const rt = this.comp.readBuffer, px = new Uint8Array(this.W * this.Hh * 4);
    r.readRenderTargetPixels(rt, 0, 0, this.W, this.Hh, px);
    r.setRenderTarget(prevTarget); r.setClearColor(prevColor, prevClear);
    const c = this.cv.getContext('2d'), img = c.createImageData(this.W, this.Hh);
    for (let y = 0; y < this.Hh; y++) img.data.set(px.subarray((this.Hh - 1 - y) * this.W * 4, (this.Hh - y) * this.W * 4), y * this.W * 4);   // de abajo arriba
    c.putImageData(img, 0, 0);
    const url = this.cv.toDataURL('image/png');
    this.cache.set(k, url);
    return url;
  }
}
