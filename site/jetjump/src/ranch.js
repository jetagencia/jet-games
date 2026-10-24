// Rancho: el centro del juego (como en el referente que pidió Julián). Mundo soleado con establo, guadarnés,
// potrero, pista de entrenamiento y el camión para ir a los concursos. También es el lugar del paseo libre:
// el caballo, sin jinete, recorre el predio.
import * as THREE from 'three';
import { planks, shingles, gravel, flowers, grassTuft, sign } from './tex.js';
import { L, lang } from './text.js';

const SUN = new THREE.Vector3(0.45, 0.78, 0.43).normalize();
export const SPOTS = {
  establo: { label: 'Establo', sub: 'Cuidador', pos: [0, 4.2, -11.4], cam: [[6, 3.2, 9], [0, 2.4, -12]] },
  potrero: { label: 'Potrero', sub: 'Paseo libre', pos: [24, 3.2, 9], cam: [[2, 4.5, 30], [24, 1.2, 8]] },
  pista: { label: 'Pista', sub: 'Entrenar', pos: [-29, 2.2, 11], cam: [[-12, 6, 34], [-29, 0.5, 10]] },
  camion: { label: 'Concursos', sub: 'Ligas de salto', pos: [-6, 4.4, 18], cam: [[8, 3.5, 32], [-6, 1.8, 18]] },
  guadarnes: { label: 'Guadarnés', sub: 'Tienda', pos: [-17, 3.6, -11], cam: [[-6, 3, 4], [-17, 1.8, -13]] },
};
// carteles de los puntos del rancho en inglés (getters: cambian en vivo con el idioma)
for (const [k, [label, sub]] of Object.entries({ establo: ['Stable', 'Groom'], potrero: ['Paddock', 'Free roam'], pista: ['Arena', 'Train'], camion: ['Shows', 'Show jumping leagues'], guadarnes: ['Tack room', 'Shop'] })) {
  const S = SPOTS[k], es = { label: S.label, sub: S.sub };
  Object.defineProperty(S, 'label', { get: () => (lang() === 'en' ? label : es.label), enumerable: true });
  Object.defineProperty(S, 'sub', { get: () => (lang() === 'en' ? sub : es.sub), enumerable: true });
}
// letreros 3D con texto: se vuelven a pintar al cambiar de idioma (relangSigns)
const SIGNS = [];
function langSign(es, en, opts) { const m = { es, en, opts, tex: sign(L(es, en), opts) }; SIGNS.push(m); return m; }
export function relangSigns() {
  for (const s of SIGNS) { const t = sign(L(s.es, s.en), s.opts); for (const mat of s.mats || []) { mat.map = t; mat.needsUpdate = true; } s.tex.dispose(); s.tex = t; }
}
function signMat(es, en, opts, extra) { const s = langSign(es, en, opts); const mat = new THREE.MeshStandardMaterial({ map: s.tex, ...extra }); (s.mats = s.mats || []).push(mat); return mat; }
const HOME_CAM = [[24, 7.5, 34], [0, 1.8, -6]];
const HOME_CAM_P = [[22, 10, 44], [14, 1.2, 0]];      // vertical: establo arriba y el caballo en el potrero

export class Ranch {
  constructor(renderer, A, quality, envTex) {
    this.q = quality; this.assets = A;
    const S = this.scene = new THREE.Scene();
    A.skyJpg.mapping = THREE.EquirectangularReflectionMapping;
    S.background = A.skyJpg; S.backgroundIntensity = 1.08;
    S.environment = envTex; S.environmentIntensity = 0.55;
    S.fog = new THREE.Fog(0xcfe0ee, 120, 360);
    const sun = this.sun = new THREE.DirectionalLight(0xfff0d6, 2.7);
    sun.castShadow = true; sun.shadow.mapSize.set(quality.shadow, quality.shadow);
    Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 220 });
    sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.05;
    sun.position.copy(SUN).multiplyScalar(110); S.add(sun, sun.target);
    S.add(new THREE.HemisphereLight(0xd8e8ff, 0x7d9a52, 0.4));
    this.wind = { value: 0 };
    this.colliders = [];      // cajas { x0, x1, z0, z1 } y segmentos { a, b, r } para el paseo libre
    this.buildGround(A);
    this.buildBarn();
    this.buildShed();
    this.buildPaddock();
    this.buildArena();
    this.buildTruck();
    this.buildProps();
    this.buildTrees(A);
    this.buildPlants();
    this.buildHills();
    this.cam = new THREE.PerspectiveCamera(42, 1, 0.1, 900); this.cam.layers.enable(1);
    this.camFrom = null; this.camT = 1; this.camGoal = HOME_CAM; this.setCamNow(HOME_CAM);
    this.t = 0;
  }

  // ---------------------------------------------------------------- terreno
  buildGround(A) {
    const S = this.scene;
    const g = A.grass.clone(); g.needsUpdate = true; g.wrapS = g.wrapT = THREE.RepeatWrapping; g.repeat.set(160, 160); g.colorSpace = THREE.SRGBColorSpace; g.anisotropy = 8;
    const gn = A.grassN.clone(); gn.needsUpdate = true; gn.wrapS = gn.wrapT = THREE.RepeatWrapping; gn.repeat.set(160, 160);
    const mat = new THREE.MeshStandardMaterial({ map: g, normalMap: gn, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 1, color: 0xa4c47e });
    // variación de color a gran escala: el pasto no se ve repetido ni plano
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vW;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvW = (modelMatrix * vec4(position, 1.0)).xz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vW;').replace('#include <map_fragment>', `#include <map_fragment>
        float n = sin(vW.x * 0.045 + sin(vW.y * 0.031) * 2.0) * 0.5 + sin(vW.y * 0.06 + vW.x * 0.013) * 0.5;
        diffuseColor.rgb *= vec3(0.92 + 0.1 * n, 0.95 + 0.06 * n, 0.86);`);
    };
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), mat);
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
    // ripio: explanada frente al establo y caminos
    const gr = gravel();
    const path = (x, z, w, d, rot = 0) => {
      const m = gr.map.clone(), n = gr.normal.clone(); m.needsUpdate = n.needsUpdate = true; m.repeat.set(w / 2.5, d / 2.5); n.repeat.set(w / 2.5, d / 2.5);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: m, normalMap: n, roughness: 0.95, color: 0xa39582 }));
      p.rotation.x = -Math.PI / 2; p.rotation.z = rot; p.position.set(x, 0.012, z); p.receiveShadow = true; S.add(p);
    };
    path(0, -5, 30, 14);                      // explanada
    path(-6, 9, 5, 16);                       // hacia el camión
    path(6.5, -2, 6, 3.2);                    // hacia el potrero
    path(-15, 4, 4, 14);                      // hacia la pista
  }

  // ---------------------------------------------------------------- establo
  buildBarn() {
    const S = this.scene, g = new THREE.Group(); g.position.set(0, 0, -18); S.add(g);
    const W = 26, D = 12, H = 5, RIDGE = 9;
    const red = planks({ base: [158, 52, 40], boards: 10, batten: true, seed: 4 });
    const wallMat = (w, h) => { const m = red.map.clone(), n = red.normal.clone(); m.needsUpdate = n.needsUpdate = true; m.repeat.set(w / 3.2, h / 3.2); n.repeat.set(w / 3.2, h / 3.2); return new THREE.MeshStandardMaterial({ map: m, normalMap: n, roughness: 0.82 }); };
    const white = new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.6 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 1 });
    const box = (w, h, d, mat, x, y, z, parent = g) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
    // muros
    box(W, H, 0.3, wallMat(W, H), 0, H / 2, D / 2);
    box(W, H, 0.3, wallMat(W, H), 0, H / 2, -D / 2);
    box(0.3, H, D, wallMat(D, H), -W / 2, H / 2, 0);
    box(0.3, H, D, wallMat(D, H), W / 2, H / 2, 0);
    // hastiales (triángulos de los extremos)
    for (const s of [-1, 1]) {
      const sh = new THREE.Shape(); sh.moveTo(-D / 2, 0); sh.lineTo(D / 2, 0); sh.lineTo(0, RIDGE - H); sh.closePath();
      const geo = new THREE.ShapeGeometry(sh); const m = new THREE.Mesh(geo, wallMat(D, RIDGE - H)); m.material.side = THREE.DoubleSide;
      m.rotation.y = Math.PI / 2; m.position.set(s * (W / 2 + 0.01), H, 0); m.castShadow = true; g.add(m);
      // uv del hastial: las tablas en vertical
      const uv = geo.attributes.uv, P = geo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (P.getX(i) + D / 2) / 3.2, P.getY(i) / 3.2);
    }
    // techo a dos aguas
    const sh = shingles(), roofLen = W + 1.2, slope = Math.hypot(D / 2 + 0.8, RIDGE - H + 0.4);
    for (const s of [-1, 1]) {
      const m = sh.map.clone(), n = sh.normal.clone(); m.needsUpdate = n.needsUpdate = true; m.repeat.set(roofLen / 3, slope / 3); n.repeat.set(roofLen / 3, slope / 3);
      const roof = box(roofLen, 0.22, slope, new THREE.MeshStandardMaterial({ map: m, normalMap: n, roughness: 0.75 }), 0, 0, 0);
      const ang = Math.atan2(RIDGE - H + 0.4, D / 2 + 0.8);
      roof.rotation.x = s * ang; roof.position.set(0, (RIDGE + H - 0.4) / 2 + 0.1, s * (D / 2 + 0.8) / 2);
    }
    box(roofLen, 0.3, 0.3, white, 0, RIDGE + 0.15, 0);
    // molduras blancas: esquinas y aleros
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.32, H, 0.32, white, sx * W / 2, H / 2, sz * D / 2);
    for (const sz of [-1, 1]) box(W + 0.4, 0.28, 0.34, white, 0, H, sz * (D / 2 + 0.02));
    // frente (+Z del grupo): puertas de box holandesas con cruz blanca y portón corredizo
    const doorRed = new THREE.MeshStandardMaterial({ color: 0x8e2a1f, roughness: 0.7 });
    const front = D / 2 + 0.16;
    const xBrace = (w, h, x, y) => {
      box(w, h, 0.08, doorRed, x, y, front);
      for (const [ww, hh, dx, dy] of [[w, 0.14, 0, h / 2 - 0.07], [w, 0.14, 0, -h / 2 + 0.07], [0.14, h, -w / 2 + 0.07, 0], [0.14, h, w / 2 - 0.07, 0]]) box(ww, hh, 0.1, white, x + dx, y + dy, front + 0.02);
      const L = Math.hypot(w, h) - 0.2;
      for (const s of [-1, 1]) { const b = box(L, 0.13, 0.06, white, x, y, front + 0.05); b.rotation.z = s * Math.atan2(h, w); }
    };
    for (const x of [-9.5, -5.5, 5.5, 9.5]) {
      box(1.4, 1.25, 0.02, dark, x, 1.95, front);                     // mitad de arriba abierta: interior oscuro
      xBrace(1.4, 1.25, x, 0.66);                                  // mitad de abajo cerrada
      box(1.75, 0.14, 0.2, white, x, 2.68, front); box(0.12, 2.65, 0.2, white, x - 0.82, 1.32, front); box(0.12, 2.65, 0.2, white, x + 0.82, 1.32, front);
      // farolito sobre cada puerta
      box(0.18, 0.26, 0.18, new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.4, metalness: 0.6 }), x, 3.15, front + 0.14);
    }
    // portón central corredizo (abierto a la mitad: se ve el pasillo)
    box(2.0, 3.9, 0.02, dark, -0.95, 1.95, front);                     // la mitad abierta del portón
    xBrace(2.1, 3.8, 1.25, 1.95);
    box(5.6, 0.16, 0.2, new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.4 }), 0.8, 4.05, front + 0.12);   // riel
    // puerta del pajar
    xBrace(1.8, 1.6, 0, 6.6);
    // cartel
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.05), signMat('Establo JET', 'JET Stable', { w: 512, h: 128 }, { roughness: 0.8 }));
    sg.position.set(0, 4.3, front + 0.06); sg.scale.setScalar(0.82); g.add(sg);
    // cúpula con veleta
    const cup = new THREE.Group(); cup.position.set(0, RIDGE, 0); g.add(cup);
    box(1.8, 1.4, 1.8, white, 0, 0.7, 0, cup);
    box(1.2, 0.8, 1.84, dark, 0, 0.75, 0, cup); box(1.84, 0.8, 1.2, dark, 0, 0.75, 0, cup);      // persianas
    const cr = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.1, 4), new THREE.MeshStandardMaterial({ color: 0x4a4f56, roughness: 0.6 })); cr.rotation.y = Math.PI / 4; cr.position.y = 1.95; cr.castShadow = true; cup.add(cr);
    const iron = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, metalness: 0.8, roughness: 0.3 });
    box(0.05, 0.75, 0.05, iron, 0, 2.75, 0, cup);
    // veleta: flecha con cola (gira con el viento; una barra cruzada parecía una cruz)
    const vane = new THREE.Group(); vane.position.y = 3.05; cup.add(vane); this.vane = vane;
    vane.add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.9), iron));
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 4), iron); head.rotation.x = Math.PI / 2; head.position.z = 0.5; vane.add(head);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.22), iron); tail.position.z = -0.4; vane.add(tail);
    this.colliders.push({ x0: -W / 2 - 0.6, x1: W / 2 + 0.6, z0: -18 - D / 2 - 0.6, z1: -18 + D / 2 + 0.8 });
    this.barn = g;
  }

  // guadarnés: galpón de madera natural adosado al establo
  buildShed() {
    const S = this.scene, g = new THREE.Group(); g.position.set(-17.5, 0, -16.5); S.add(g);
    const wood = planks({ base: [168, 122, 78], boards: 7, seed: 8 });
    const mat = (w, h) => { const m = wood.map.clone(), n = wood.normal.clone(); m.needsUpdate = n.needsUpdate = true; m.repeat.set(w / 2.6, h / 2.6); n.repeat.set(w / 2.6, h / 2.6); return new THREE.MeshStandardMaterial({ map: m, normalMap: n, roughness: 0.85 }); };
    const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
    box(9, 3.4, 7, mat(9, 3.4), 0, 1.7, 0);
    const roof = box(10, 0.18, 8, new THREE.MeshStandardMaterial({ color: 0x5b6168, roughness: 0.55, metalness: 0.4 }), 0, 3.8, 0); roof.rotation.x = -0.12;
    const white = new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.6 });
    box(1.5, 2.4, 0.08, new THREE.MeshStandardMaterial({ color: 0x2f4a3a, roughness: 0.6 }), 0, 1.2, 3.52);
    box(1.75, 0.14, 0.14, white, 0, 2.45, 3.55);
    // ventana con monturas a la vista
    box(1.6, 1.0, 0.08, new THREE.MeshStandardMaterial({ color: 0x0e0c0a, roughness: 0.2, metalness: 0.2 }), 2.8, 1.8, 3.52);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), signMat('Guadarnés', 'Tack room', { w: 512, h: 128, bg: '#2f4a3a' }, { roughness: 0.8 }));
    sg.position.set(0, 2.95, 3.6); g.add(sg);
    this.colliders.push({ x0: -22.5, x1: -12.5, z0: -20.5, z1: -12.4 });
  }

  // ---------------------------------------------------------------- potrero (cerco blanco de tres tablas)
  fence(points, { gate = null, mat } = {}) {
    const S = this.scene;
    mat = mat || new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.55 });
    const posts = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [x1, z1] = points[i], [x2, z2] = points[i + 1], L = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.round(L / 2.6));
      for (let k = 0; k <= n; k++) posts.push([x1 + (x2 - x1) * k / n, z1 + (z2 - z1) * k / n]);
      let segs = [[x1, z1, x2, z2]];
      if (gate && gate.i === i) {
        const t0 = gate.t - gate.w / 2 / L, t1 = gate.t + gate.w / 2 / L;
        segs = [[x1, z1, x1 + (x2 - x1) * t0, z1 + (z2 - z1) * t0], [x1 + (x2 - x1) * t1, z1 + (z2 - z1) * t1, x2, z2]];
      }
      for (const [a, b, c, d] of segs) {
        const l = Math.hypot(c - a, d - b);
        for (const y of [0.45, 0.9, 1.35]) {
          const r = new THREE.Mesh(new THREE.BoxGeometry(l, 0.15, 0.05), mat);
          r.position.set((a + c) / 2, y, (b + d) / 2); r.rotation.y = -Math.atan2(d - b, c - a); r.castShadow = r.receiveShadow = true; S.add(r);
        }
        this.colliders.push({ a: new THREE.Vector2(a, b), b: new THREE.Vector2(c, d), r: 0.9 });
      }
    }
    const pg = new THREE.BoxGeometry(0.14, 1.55, 0.14); pg.translate(0, 0.77, 0);
    const P = new THREE.InstancedMesh(pg, mat, posts.length), m4 = new THREE.Matrix4();
    posts.forEach(([x, z], i) => { m4.makeTranslation(x, 0, z); P.setMatrixAt(i, m4); });
    P.castShadow = true; P.receiveShadow = true; S.add(P);
  }
  buildPaddock() {
    this.fence([[8, -4], [46, -4], [46, 30], [8, 30], [8, -4]], { gate: { i: 3, t: 0.82, w: 4 } });
    // bebedero
    const S = this.scene, tr = new THREE.Group(); tr.position.set(40, 0, 22); S.add(tr);
    // batea de chapa galvanizada sobre el pasto, con borde enrollado y agua
    const steel = new THREE.MeshStandardMaterial({ color: 0xa7adb2, metalness: 0.7, roughness: 0.42 });
    const wall = (w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), steel); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; tr.add(b); };
    wall(2.4, 0.06, 0.8, 0, 0.03, 0);                                            // fondo
    wall(2.4, 0.6, 0.04, 0, 0.3, 0.38); wall(2.4, 0.6, 0.04, 0, 0.3, -0.38);     // lados largos
    wall(0.04, 0.6, 0.8, 1.18, 0.3, 0); wall(0.04, 0.6, 0.8, -1.18, 0.3, 0);     // cabeceras
    for (const z of [0.38, -0.38]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.42, 10), steel); r.rotation.z = Math.PI / 2; r.position.set(0, 0.6, z); tr.add(r); }
    for (const x of [1.18, -1.18]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 10), steel); r.rotation.x = Math.PI / 2; r.position.set(x, 0.6, 0); tr.add(r); }
    const water = new THREE.Mesh(new THREE.PlaneGeometry(2.34, 0.74), new THREE.MeshStandardMaterial({ color: 0x2f5a66, roughness: 0.04, metalness: 0.3, transparent: true, opacity: 0.88 }));
    water.rotation.x = -Math.PI / 2; water.position.y = 0.5; tr.add(water);
    this.trough = new THREE.Vector3(40, 0, 22);
    // marcador del bebedero para el paseo libre (gota que flota)
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d');
    x.fillStyle = '#0d241acc'; x.beginPath(); x.arc(64, 54, 42, 0, 7); x.fill(); x.beginPath(); x.moveTo(44, 86); x.lineTo(84, 86); x.lineTo(64, 116); x.fill();
    x.fillStyle = '#7cc8ec'; x.beginPath(); x.moveTo(64, 26); x.bezierCurveTo(86, 54, 84, 78, 64, 78); x.bezierCurveTo(44, 78, 42, 54, 64, 26); x.fill();
    const tm = new THREE.CanvasTexture(cv); tm.colorSpace = THREE.SRGBColorSpace;
    this.troughMark = new THREE.Sprite(new THREE.SpriteMaterial({ map: tm, depthTest: false, transparent: true })); this.troughMark.scale.set(1.4, 1.4, 1);
    this.troughMark.position.set(40, 2.4, 22); this.troughMark.renderOrder = 10; this.troughMark.visible = false; this.troughMark.layers.set(1); S.add(this.troughMark);
    this.colliders.push({ x0: 38.4, x1: 41.6, z0: 21, z1: 23 });
    this.paddock = { x0: 9.5, x1: 44.5, z0: -2.5, z1: 28.5 };
  }

  // ---------------------------------------------------------------- pista de entrenamiento
  buildArena() {
    const S = this.scene;
    const A = this.assets, rp = (tx, x, y, srgb) => { const c = tx.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(x, y); c.anisotropy = 8; if (srgb) c.colorSpace = THREE.SRGBColorSpace; return c; };
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), A.sand ? new THREE.MeshStandardMaterial({ map: rp(A.sand, 6, 4.4, true), normalMap: rp(A.sandN, 6, 4.4), roughness: 1, color: 0xe6d3b3 }) : new THREE.MeshStandardMaterial({ color: 0xd8c09a, roughness: 1 }));
    sand.rotation.x = -Math.PI / 2; sand.position.set(-29, 0.02, 11); sand.receiveShadow = true; S.add(sand);
    this.fence([[-44, 0], [-14, 0], [-14, 22], [-44, 22], [-44, 0]], { gate: { i: 0, t: 0.92, w: 3.5 } });
    // obstáculos de práctica: dos verticales bajos y barras en el suelo
    this.jumps = new THREE.Group(); S.add(this.jumps);
    const white = new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.55 });
    const stripe = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 16; const x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#fff' : '#c0272d'; x.fillRect(i * 32, 0, 32, 16); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }); })();
    const jump = (x, z, rot, h, n) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; this.jumps.add(g);
      for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.5, 0.16), white); p.position.set(s * 1.7, 0.75, 0); p.castShadow = true; g.add(p); }
      for (let k = 0; k < n; k++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 10), stripe); r.rotation.z = Math.PI / 2; r.position.y = h - k * 0.3; r.castShadow = true; g.add(r); }
    };
    jump(-34, 6, 0, 0.8, 2); jump(-24, 16, 0, 0.9, 3);
    for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 10), stripe); r.rotation.z = Math.PI / 2; r.rotation.y = Math.PI / 2; r.position.set(-20 + k * 1.3, 0.07, 6); r.castShadow = true; this.jumps.add(r); }
  }

  // ---------------------------------------------------------------- camión de caballos (concursos)
  buildTruck() {
    const S = this.scene, g = new THREE.Group(); g.position.set(-6, 0, 19); g.rotation.y = 0.18; S.add(g);
    const white = new THREE.MeshPhysicalMaterial({ color: 0xf4f2ec, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.18 });
    const navy = new THREE.MeshPhysicalMaterial({ color: 0x14204a, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.18 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xd4b26a, roughness: 0.35, metalness: 0.6 });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x0e1820, roughness: 0.05, metalness: 0.2, clearcoat: 1 });
    const black = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.7 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.2, metalness: 1 });
    const add = (geo, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    // caja con bordes redondeados: rectángulo redondeado (ancho × alto) extruido a lo largo
    const rounded = (w0, h0, d, r) => {
      const bs = r * 0.6, w = w0 - 2 * bs, h = h0 - 2 * bs;        // el bisel suma bs por lado: el contorno final mide w0 × h0
      const s = new THREE.Shape(), x = -w / 2 + r, y = -h / 2 + r, W = w - 2 * r, H = h - 2 * r;
      s.moveTo(x, y - r); s.lineTo(x + W, y - r); s.quadraticCurveTo(x + W + r, y - r, x + W + r, y); s.lineTo(x + W + r, y + H);
      s.quadraticCurveTo(x + W + r, y + H + r, x + W, y + H + r); s.lineTo(x, y + H + r); s.quadraticCurveTo(x - r, y + H + r, x - r, y + H); s.lineTo(x - r, y); s.quadraticCurveTo(x - r, y - r, x, y - r);
      const geo = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelSize: bs, bevelThickness: r, bevelSegments: 3, curveSegments: 6 });
      geo.translate(0, 0, -(d - 2 * r) / 2); return geo;
      // (bevelSize = bs)
    };
    // chasis y caja de los caballos
    add(new THREE.BoxGeometry(2.1, 0.35, 8.6), black, 0, 0.72, 0);
    add(rounded(2.55, 2.9, 7.0, 0.22), white, 0, 2.4, -1.2);
    add(new THREE.BoxGeometry(2.58, 0.34, 6.9), navy, 0, 1.25, -1.2);                 // franja baja
    add(new THREE.BoxGeometry(2.58, 0.06, 6.9), gold, 0, 1.45, -1.2);                 // filete dorado
    // ventanitas de los caballos con barrotes, a cada lado
    for (const s of [-1, 1]) for (const z of [-3.6, -1.7, 0.2]) {
      add(new THREE.BoxGeometry(0.03, 0.55, 1.0), glass, s * 1.29, 3.1, z);
      for (let k = 0; k < 5; k++) add(new THREE.BoxGeometry(0.035, 0.55, 0.025), chrome, s * 1.305, 3.1, z - 0.4 + k * 0.2);
    }
    // rampa lateral (lado izquierdo), con bisagras
    add(new THREE.BoxGeometry(0.05, 1.9, 2.2), navy, -1.3, 2.1, -1.2);
    for (const z of [-2.2, -0.2]) add(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), chrome, -1.33, 1.2, z).rotation.x = Math.PI / 2;
    // cabina: perfil lateral (parabrisas inclinado) extruido a lo ancho
    const p = new THREE.Shape(); p.moveTo(0, 0.9); p.lineTo(2.05, 0.9); p.lineTo(2.12, 1.65); p.lineTo(1.75, 2.6); p.lineTo(1.5, 3.1); p.lineTo(0, 3.1); p.closePath();
    const cab = new THREE.ExtrudeGeometry(p, { depth: 2.3, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 });
    cab.translate(0, 0, -1.15); cab.rotateY(-Math.PI / 2);   // el perfil (x = adelante) pasa a +Z
    add(cab, white, 0, 0, 2.45);
    // parabrisas y ventanas de la cabina
    const ws = add(new THREE.PlaneGeometry(2.1, 0.92), glass, 0, 2.12, 4.47); ws.rotation.x = -0.37;
    for (const s of [-1, 1]) { const w = add(new THREE.PlaneGeometry(1.2, 0.75), glass, s * 1.235, 2.25, 3.25, s * Math.PI / 2); w.material = glass; }
    // parrilla, faros y paragolpes
    add(new THREE.BoxGeometry(1.5, 0.45, 0.04), black, 0, 1.3, 4.6);
    for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(1.45, 0.025, 0.05), chrome, 0, 1.13 + k * 0.11, 4.62);
    for (const s of [-1, 1]) { const l = add(new THREE.BoxGeometry(0.42, 0.18, 0.05), new THREE.MeshStandardMaterial({ color: 0xfff6dd, emissive: 0xfff2cc, emissiveIntensity: 0.6 }), s * 0.95, 1.32, 4.6); }
    add(new THREE.BoxGeometry(2.45, 0.3, 0.25), black, 0, 0.8, 4.62);
    for (const s of [-1, 1]) { add(new THREE.BoxGeometry(0.06, 0.32, 0.18), black, s * 1.42, 2.55, 3.95); add(new THREE.BoxGeometry(0.4, 0.04, 0.04), black, s * 1.27, 2.55, 3.95); }   // espejos
    add(new THREE.BoxGeometry(2.4, 0.3, 0.06), navy, 0, 2.95, 4.12).rotation.x = -0.38;   // visera
    // ruedas con llanta
    for (const [x, z] of [[-1.12, 3.4], [1.12, 3.4], [-1.12, -2.6], [1.12, -2.6], [-1.12, -3.9], [1.12, -3.9]]) {
      const w = add(new THREE.CylinderGeometry(0.52, 0.52, 0.38, 24), black, x, 0.52, z); w.rotation.z = Math.PI / 2;
      const rim = add(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 18), chrome, x, 0.52, z); rim.rotation.z = Math.PI / 2;
    }
    // letreros a los dos lados
    for (const s of [-1, 1]) {
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 0.62), signMat('JET//Jump · Concursos', 'JET//Jump · Shows', { w: 768, h: 112, bg: '#14204a' }, { roughness: 0.5 }));
      sg.rotation.y = s * Math.PI / 2; sg.position.set(s * 1.3, 2.45, s < 0 ? 1.15 : -1.2); sg.scale.setScalar(s < 0 ? 0.55 : 1); g.add(sg);
    }
    this.colliders.push({ x0: -8.4, x1: -3.6, z0: 14.0, z1: 24.6 });
  }

  // fardos, barriles y macetas
  buildProps() {
    const S = this.scene;
    const hay = new THREE.MeshStandardMaterial({ color: 0xd8b56a, roughness: 1 });
    const bale = (x, z, r = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.55), hay); b.position.set(x, 0.25, z); b.rotation.y = r; b.castShadow = b.receiveShadow = true; S.add(b); return b; };
    bale(14, -10.6); bale(15.2, -10.7, 0.1); bale(14.6, -10.5).position.y = 0.75;
    const round = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.3, 24), hay); round.rotation.z = Math.PI / 2; round.position.set(16, 0.85, -8.5); round.castShadow = true; S.add(round);
    const barrel = new THREE.MeshStandardMaterial({ color: 0x6b4428, roughness: 0.8 });
    for (const [x, z] of [[-12, -10.3], [-11.2, -10.1]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.9, 16), barrel); b.position.set(x, 0.45, z); b.castShadow = true; S.add(b); }
    // macetas con flores junto a la entrada
    for (const x of [-3, 3]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.5, 14), new THREE.MeshStandardMaterial({ color: 0xa65a3a, roughness: 0.9 })); p.position.set(x, 0.25, -11.2); p.castShadow = true; S.add(p); }
    this.colliders.push({ x0: 13, x1: 17, z0: -11.5, z1: -7.5 });
  }

  // árboles 3D del juego (_tools/jetjump-pro/build_trees.py), en un anillo alrededor del predio
  buildTrees(A) {
    const S = this.scene, gltf = A.trees3d; if (!gltf) return;
    const variants = [];
    for (let k = 0; k < 3; k++) { const bark = gltf.scene.getObjectByName(`Tree${k}_bark`), leaves = gltf.scene.getObjectByName(`Tree${k}_leaves`); if (bark && leaves) variants.push({ bark, leaves }); }
    if (!variants.length) return;
    let s = 3; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const pts = [];
    for (let i = 0; i < (this.q.hd ? 70 : 40); i++) { const a = R() * Math.PI * 2, r = 70 + R() * 70; const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.8 - 10; if (x > 0 && x < 70 && z > 25) continue; pts.push([x, z, 0.9 + R() * 0.5]); }
    for (const p of [[-30, -34, 1.2], [-6, -38, 1.3], [18, -36, 1.1], [34, -28, 1.2], [56, 4, 1.1], [54, 26, 1.0], [-52, 10, 1.1], [-50, 30, 1.2]]) pts.push(p);
    const leafMat = new THREE.MeshStandardMaterial({ map: variants[0].leaves.material.map, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.75, color: 0xe2ecc8 });
    leafMat.map.colorSpace = THREE.SRGBColorSpace;
    const wind = this.wind;
    leafMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = wind;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 wpos = instanceMatrix * vec4(position, 1.0);
        float ph = uWind * 1.3 + wpos.x * 0.21 + wpos.z * 0.17 + position.y * 0.5;
        transformed.x += sin(ph) * 0.06 * position.y; transformed.z += cos(ph * 0.8) * 0.045 * position.y;`);
    };
    const barkMat = variants[0].bark.material;
    variants.forEach((v, k) => {
      const mine = pts.filter((_, i) => i % variants.length === k);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), pos = new THREE.Vector3();
      for (const [geo, mat] of [[v.bark.geometry, barkMat], [v.leaves.geometry, leafMat]]) {
        const mesh = new THREE.InstancedMesh(geo, mat, mine.length);
        mine.forEach(([x, z, sz], i) => { q.setFromAxisAngle(up, i * 2.399 + k); m4.compose(pos.set(x, 0, z), q, sc.setScalar(2.2 * sz)); mesh.setMatrixAt(i, m4); });
        mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; if (mat === leafMat) mesh.layers.set(1); S.add(mesh);
      }
    });
    for (const [x, z] of pts) if (Math.hypot(x, z) < 70) this.colliders.push({ a: new THREE.Vector2(x, z), b: new THREE.Vector2(x, z), r: 1.6 });
  }

  // pasto alto y flores (tarjetas cruzadas instanciadas que se mecen con el viento)
  buildPlants() {
    const S = this.scene, wind = this.wind;
    let s = 11; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const free = (x, z) => {
      if (x > -16 && x < 16 && z > -26 && z < 3) return false;          // establo y explanada
      if (x > -24 && x < -10 && z > -22 && z < -10) return false;       // guadarnés
      if (x > -45 && x < -13 && z > -1 && z < 23) return false;         // pista
      if (x > -10 && x < -2 && z > 0 && z < 26) return false;           // camino y camión
      if (x > -18 && x < -12 && z > -4 && z < 12) return false;
      return true;
    };
    const sway = (mat, amp) => {
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uWind = wind;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', `#include <begin_vertex>
          vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float ph = uWind * 1.7 + wp.x * 0.35 + wp.z * 0.27;
          transformed.x += sin(ph) * ${amp} * uv.y; transformed.z += cos(ph * 0.7) * ${amp * 0.7} * uv.y;`);
      };
    };
    const card = (w, h) => { const a = new THREE.PlaneGeometry(w, h); a.translate(0, h / 2, 0); const b = a.clone(); b.rotateY(Math.PI / 2); const geo = mergeTwo(a, b); return geo; };
    // pasto alto: en franjas junto a los cercos, al pie de los edificios y de los árboles, y en el campo lejano
    const nT = this.q.hd ? 2200 : 900, tuftMat = new THREE.MeshStandardMaterial({ map: grassTuft(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
    sway(tuftMat, 0.12);
    const tufts = new THREE.InstancedMesh(card(0.8, 0.55), tuftMat, nT), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), pos = new THREE.Vector3();
    const segs = this.colliders.filter((c) => c.a && c.a.distanceTo(c.b) > 0.1), trees = this.colliders.filter((c) => c.a && c.a.distanceTo(c.b) < 0.1);
    let n = 0, guard = 0;
    while (n < nT && guard++ < nT * 20) {
      let x, z; const r = R();
      if (r < 0.55 && segs.length) {
        const S2 = segs[(R() * segs.length) | 0], k = R(), side = R() < 0.5 ? -1 : 1, d = 0.15 + R() * 0.6;
        const dx = S2.b.x - S2.a.x, dz = S2.b.y - S2.a.y, L = Math.hypot(dx, dz); x = S2.a.x + dx * k - dz / L * d * side; z = S2.a.y + dz * k + dx / L * d * side;
      } else if (r < 0.7 && trees.length) { const T2 = trees[(R() * trees.length) | 0], a = R() * 6.28, d = 0.8 + R() * 1.8; x = T2.a.x + Math.cos(a) * d; z = T2.a.y + Math.sin(a) * d; }
      else { const a = R() * 6.28, d = 48 + R() * 60; x = Math.cos(a) * d; z = Math.sin(a) * d * 0.8; }
      if (!free(x, z)) continue;
      q.setFromAxisAngle(up, R() * 6.28); m4.compose(pos.set(x, 0, z), q, sc.set(0.8 + R() * 0.5, 0.6 + R() * 0.7, 0.8 + R() * 0.5)); tufts.setMatrixAt(n++, m4);
    }
    tufts.count = n; tufts.receiveShadow = true; tufts.frustumCulled = false; tufts.layers.set(1); S.add(tufts);
    // flores en manchones
    const nF = this.q.hd ? 900 : 380, fMat = new THREE.MeshStandardMaterial({ map: flowers(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 });
    sway(fMat, 0.06);
    fMat.onBeforeCompile = ((prev) => (sh) => { prev(sh); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aKind;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvMapUv = vec2((aKind + uv.x) / 4.0, uv.y);'); })(fMat.onBeforeCompile);
    const fGeo = card(0.6, 0.6), kinds = new Float32Array(nF);
    const fl = new THREE.InstancedMesh(fGeo, fMat, nF);
    const patches = Array.from({ length: 26 }, () => { let x, z; do { x = -60 + R() * 120; z = -45 + R() * 95; } while (!free(x, z)); return [x, z, R() * 4 | 0]; });
    n = 0;
    while (n < nF) {
      const [px, pz, kind] = patches[n % patches.length], a = R() * 6.28, r = Math.sqrt(R()) * 4.5;
      const x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r; if (!free(x, z)) { n++; continue; }
      q.setFromAxisAngle(up, R() * 6.28); m4.compose(pos.set(x, 0, z), q, sc.setScalar(0.7 + R() * 0.6)); fl.setMatrixAt(n, m4); kinds[n] = R() < 0.8 ? kind : (R() * 4) | 0; n++;
    }
    fGeo.setAttribute('aKind', new THREE.InstancedBufferAttribute(kinds, 1));
    fl.frustumCulled = false; fl.layers.set(1); S.add(fl);
  }

  // colinas lejanas
  buildHills() {
    const S = this.scene, mat = new THREE.MeshStandardMaterial({ color: 0x7fa45a, roughness: 1 });
    for (const [x, z, sx, sy, sz] of [[-220, -260, 180, 40, 90], [60, -300, 220, 55, 100], [300, -120, 120, 35, 160], [-320, 60, 120, 30, 200], [180, 260, 200, 35, 90]]) {
      const h = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mat); h.scale.set(sx, sy, sz); h.position.set(x, -sy * 0.15, z); S.add(h);
    }
  }

  // ---------------------------------------------------------------- cámara
  setCamNow(goal) { const [p, l] = goal; this.camGoal = goal; this.cam.position.set(...p); this.look = new THREE.Vector3(...l); this.cam.lookAt(this.look); this.camT = 1; }
  camTo(spot, dur = 1.4) {
    const goal = spot === 'home' ? (this.portrait ? HOME_CAM_P : HOME_CAM) : (SPOTS[spot]?.cam || spot);
    this.camFrom = [this.cam.position.clone(), this.look.clone()]; this.camGoal = goal; this.camT = 0; this.camDur = dur;
  }
  resize(w, h) { this.portrait = h > w; this.cam.aspect = w / h; this.cam.fov = h > w ? 58 : 42; this.cam.updateProjectionMatrix(); }
  update(dt) {
    this.t += dt; this.wind.value += dt;
    if (this.vane) this.vane.rotation.y = 0.6 + Math.sin(this.t * 0.2) * 0.4;
    if (this.troughMark && this.troughMark.visible) this.troughMark.position.y = 2.4 + Math.sin(this.t * 3) * 0.12;
    if (this.camT < 1 && this.camFrom) {
      this.camT = Math.min(1, this.camT + dt / this.camDur);
      const k = this.camT * this.camT * (3 - 2 * this.camT);
      this.cam.position.lerpVectors(this.camFrom[0], new THREE.Vector3(...this.camGoal[0]), k);
      this.look.lerpVectors(this.camFrom[1], new THREE.Vector3(...this.camGoal[1]), k);
    } else {
      // deriva suave alrededor del encuadre (la escena respira)
      const [p] = this.camGoal; this.cam.position.set(p[0] + Math.sin(this.t * 0.07) * 1.2, p[1] + Math.sin(this.t * 0.11) * 0.2, p[2] + Math.cos(this.t * 0.06) * 1.0);
    }
    this.cam.lookAt(this.look);
  }
  showTroughMarker(on) { if (this.troughMark) this.troughMark.visible = on; }
  // proyección de los carteles 3D a la pantalla
  spotScreen(key, w, h) {
    const v = new THREE.Vector3(...SPOTS[key].pos).project(this.cam);
    return { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h, on: v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 };
  }

  // ---------------------------------------------------------------- paseo libre: colisiones del predio
  collide(x, z) {
    let nx = x, nz = z;
    for (const C of this.colliders) {
      if (C.a) {
        const ab = new THREE.Vector2().subVectors(C.b, C.a), L2 = ab.lengthSq();
        const t = L2 > 0 ? Math.max(0, Math.min(1, ((nx - C.a.x) * ab.x + (nz - C.a.y) * ab.y) / L2)) : 0;
        const px = C.a.x + ab.x * t, pz = C.a.y + ab.y * t, d = Math.hypot(nx - px, nz - pz);
        if (d < C.r) { const k = (C.r - d) / Math.max(1e-4, d); nx += (nx - px) * k; nz += (nz - pz) * k; }
      } else if (nx > C.x0 && nx < C.x1 && nz > C.z0 && nz < C.z1) {
        const dl = nx - C.x0, dr = C.x1 - nx, dt = nz - C.z0, db = C.z1 - nz, m = Math.min(dl, dr, dt, db);
        if (m === dl) nx = C.x0; else if (m === dr) nx = C.x1; else if (m === dt) nz = C.z0; else nz = C.z1;
      }
    }
    // límite del predio
    nx = Math.max(-90, Math.min(90, nx)); nz = Math.max(-60, Math.min(80, nz));
    return [nx, nz];
  }
  follow(x, z) {
    const s = this.sun; s.target.position.set(x, 0, z); s.position.set(x + SUN.x * 110, SUN.y * 110, z + SUN.z * 110); s.target.updateMatrixWorld();
  }
}

function mergeTwo(a, b) {
  const g = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) {
    const A = a.attributes[name].array, B = b.attributes[name].array, out = new Float32Array(A.length + B.length);
    out.set(A); out.set(B, A.length); g.setAttribute(name, new THREE.BufferAttribute(out, a.attributes[name].itemSize));
  }
  const n = a.attributes.position.count, ia = a.index.array, ib = b.index.array, idx = new Uint16Array(ia.length + ib.length);
  idx.set(ia); for (let i = 0; i < ib.length; i++) idx[ia.length + i] = ib[i] + n;
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}
