// Establo por dentro: el mundo del cuidador. Pasillo amplio con boxes a los lados; el caballo atado con dos
// cabestros en el centro; su box con cama de paja, pesebre y balde; al fondo, la zona de lavado.
// Tareas jugables (todas con el caballo y sus clips originales; nada de poses por código):
//  cepillar (el barro se va donde pasa el cepillo), cascos (minijuego del casco por dentro), ración, agua
//  (llenar el balde hasta la marca), limpiar el box (estiércol y cama nueva), ducha (la manguera moja y
//  quita el sudor) y ensillar (montura, cincha ajustada y cabezada, en orden).
import * as THREE from 'three';
import { planks, straw, pavers, sign } from './tex.js';

const AISLE = { x0: -12, x1: 12, z0: -3, z1: 3 };      // pasillo
const STALL = { x0: -2, x1: 2, z0: -7.2, z1: -3 };     // box del caballo (al norte, en el centro)
export const HORSE_POS = new THREE.Vector3(0, 0, 0.2); // el caballo mira hacia +X

export class Stable {
  constructor(renderer, envTex, quality) {
    this.q = quality;
    const S = this.scene = new THREE.Scene();
    S.background = new THREE.Color(0x2a2118);
    S.environment = envTex; S.environmentIntensity = 0.28;
    S.fog = new THREE.Fog(0x3a2d20, 18, 40);
    // luz: el sol entra por el portón del extremo este; faroles cálidos colgados del techo
    const sun = this.sun = new THREE.DirectionalLight(0xfff0dc, 2.2);
    sun.position.set(14, 9, 3); sun.target.position.set(0, 0, 0); sun.castShadow = true;
    sun.shadow.mapSize.set(quality.shadow, quality.shadow);
    Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04;
    S.add(sun, sun.target);
    S.add(new THREE.HemisphereLight(0xf4efe6, 0x4a3a2c, 0.5));
    for (const x of [-6, 0, 6]) { const l = new THREE.PointLight(0xffd6a6, 4, 9, 1.6); l.position.set(x, 3.4, 0); S.add(l); }
    this.build();
    this.cam = new THREE.PerspectiveCamera(55, 1, 0.05, 80); this.cam.layers.enable(1);
    this.orbitA = 2.2; this.view = 'groom'; this.camGoal = null; this.camT = 1;
    this.look = new THREE.Vector3(0, 1.15, 0.2);
    this.particles = new Spray(S);
    this.t = 0; this.idleT = 0;
  }

  // ---------------------------------------------------------------- construcción
  build() {
    const S = this.scene;
    const wood = planks({ base: [150, 104, 66], boards: 9, seed: 12 });
    const woodDark = planks({ base: [96, 62, 38], boards: 9, seed: 14, vertical: false });
    const mat = (P, w, h, extra = {}) => { const m = P.map.clone(), n = P.normal.clone(); m.needsUpdate = n.needsUpdate = true; m.repeat.set(w / 2.4, h / 2.4); n.repeat.set(w / 2.4, h / 2.4); return new THREE.MeshStandardMaterial({ map: m, normalMap: n, roughness: 0.85, ...extra }); };
    const box = (w, h, d, m, x, y, z, cast = true) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = cast; b.receiveShadow = true; S.add(b); return b; };
    const iron = new THREE.MeshStandardMaterial({ color: 0x2a2b2d, metalness: 0.75, roughness: 0.4 });
    // piso del pasillo
    const pv = pavers(); const pm = pv.map.clone(), pn = pv.normal.clone(); pm.needsUpdate = pn.needsUpdate = true; pm.repeat.set(20, 5); pn.repeat.set(20, 5);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 6), new THREE.MeshStandardMaterial({ map: pm, normalMap: pn, roughness: 0.85, color: 0x9a9088 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; S.add(floor);
    // muros exteriores y techo
    box(24, 0.3, 15, mat(wood, 24, 15), 0, 5.6, 0, false);                          // cielorraso
    for (const z of [-7.4, 7.4]) box(24, 5.6, 0.3, mat(wood, 24, 5.6), 0, 2.8, z, false);
    box(0.3, 5.6, 15, mat(wood, 15, 5.6), -12, 2.8, 0, false);
    // vigas
    for (let x = -10; x <= 10; x += 4) box(0.25, 0.35, 15, mat(woodDark, 0.5, 15), x, 5.3, 0);
    box(24, 0.3, 0.3, mat(woodDark, 24, 0.5), 0, 5.2, 0);
    // portón este abierto: luz de día
    const out = document.createElement('canvas'); out.width = 256; out.height = 256; const ox = out.getContext('2d');
    let gg = ox.createLinearGradient(0, 0, 0, 256); gg.addColorStop(0, '#cfe4f5'); gg.addColorStop(0.55, '#f4f1e4'); gg.addColorStop(0.6, '#9fbf6a'); gg.addColorStop(1, '#c7c09a'); ox.fillStyle = gg; ox.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 14; i++) { ox.fillStyle = `rgba(${70 + Math.random() * 30},${100 + Math.random() * 40},${50 + Math.random() * 20},0.9)`; ox.beginPath(); ox.ellipse(Math.random() * 256, 130 + Math.random() * 12, 14 + Math.random() * 18, 18 + Math.random() * 14, 0, 0, 7); ox.fill(); }
    const outT = new THREE.CanvasTexture(out); outT.colorSpace = THREE.SRGBColorSpace;
    const day = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: outT, color: 0xfff4e4 }));
    day.position.set(12.05, 2.1, 0); day.rotation.y = -Math.PI / 2; S.add(day);
    for (const z of [-4.5, 4.5]) box(0.3, 5.6, 6, mat(wood, 6, 5.6), 12, 2.8, z, false);
    box(0.3, 1.5, 4.2, mat(wood, 4.2, 1.5), 12, 4.85, 0, false);
    // boxes a ambos lados: frente con tabla abajo y barrotes arriba; separaciones de madera
    const bars = (x0, x1, z) => {
      const n = Math.round((x1 - x0) / 0.12);
      const g = new THREE.CylinderGeometry(0.012, 0.012, 1.1, 6), im = new THREE.InstancedMesh(g, iron, n), m4 = new THREE.Matrix4();
      for (let i = 0; i < n; i++) { m4.makeTranslation(x0 + (i + 0.5) * (x1 - x0) / n, 1.85, z); im.setMatrixAt(i, m4); }
      im.castShadow = true; S.add(im);
      box(x1 - x0, 0.06, 0.08, iron, (x0 + x1) / 2, 2.42, z); box(x1 - x0, 0.06, 0.08, iron, (x0 + x1) / 2, 1.3, z);
    };
    for (const side of [-1, 1]) {
      const zf = side * 3;
      for (const [x0, x1] of [[-12, -6.1], [-6, -2.1], [-2, 2], [2.1, 6], [6.1, 12]]) {
        const mine = side < 0 && x0 === -2;
        if (mine) {
          // nuestro box: puerta corrida abierta, se ve la cama de paja
          box(0.6, 1.28, 0.08, mat(wood, 0.6, 1.28), x0 + 0.3, 0.64, zf); box(0.6, 1.28, 0.08, mat(wood, 0.6, 1.28), x1 - 0.3, 0.64, zf);
          box(1.3, 2.5, 0.06, mat(wood, 1.3, 2.5), x1 + 0.5, 1.25, zf + side * 0.12);   // puerta corrida a un lado
          box(4.0, 0.12, 0.12, iron, 0, 2.55, zf);
        } else {
          box(x1 - x0, 1.28, 0.1, mat(wood, x1 - x0, 1.28), (x0 + x1) / 2, 0.64, zf);
          bars(x0 + 0.05, x1 - 0.05, zf);
        }
        box(0.14, 2.6, 0.14, mat(woodDark, 0.3, 2.6), x0, 1.3, zf);
        box(0.14, 2.6, 0.14, mat(woodDark, 0.3, 2.6), x1, 1.3, zf);
      }
      for (const x of [-6.05, -2.05, 2.05, 6.05]) box(0.1, 2.5, 4.3, mat(wood, 4.3, 2.5), x, 1.25, side * 5.2, true);
      // cartelitos con nombres en cada box
      [[-9, 'Brisa'], [-4, 'Zafiro'], [4, 'Malbec'], [9, 'Cumbre']].forEach(([x, n]) => {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.18), new THREE.MeshStandardMaterial({ map: sign(n, { w: 256, h: 64, bg: '#2f2418' }), roughness: 0.7 }));
        p.position.set(x, 2.7, zf - side * 0.07); p.rotation.y = side < 0 ? 0 : Math.PI; S.add(p);
      });
    }
    // cama de los boxes vecinos (paja oscura) y la nuestra (cambia con la tarea)
    const st = straw(), stm = (rep, tint) => { const m = st.map.clone(), n = st.normal.clone(); m.needsUpdate = n.needsUpdate = true; m.repeat.set(rep, rep); n.repeat.set(rep, rep); return new THREE.MeshStandardMaterial({ map: m, normalMap: n, roughness: 1, color: tint }); };
    for (const side of [-1, 1]) for (const [x0, x1] of [[-12, -6.1], [-6, -2.1], [-2, 2], [2.1, 6], [6.1, 12]]) {
      if (side < 0 && x0 === -2) continue;
      const b = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 4.2), stm(2, 0x9a8a6a)); b.rotation.x = -Math.PI / 2; b.position.set((x0 + x1) / 2, 0.02, side * 5.15); b.receiveShadow = true; S.add(b);
    }
    this.bedMat = stm(2, 0xffffff);
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(4, 4.2), this.bedMat); bed.rotation.x = -Math.PI / 2; bed.position.set(0, 0.025, -5.15); bed.receiveShadow = true; S.add(bed);
    // pesebre en la esquina del box, balde colgado y red de heno
    const manger = new THREE.Group(); manger.position.set(-1.5, 0, -6.7); S.add(manger);
    const mm = new THREE.MeshStandardMaterial({ color: 0x3f4a52, roughness: 0.5, metalness: 0.4 });
    const mb = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.32, 20, 1, true), mm); mb.material.side = THREE.DoubleSide; mb.position.y = 1.0; manger.add(mb);
    const mbot = new THREE.Mesh(new THREE.CircleGeometry(0.32, 20), mm); mbot.rotation.x = -Math.PI / 2; mbot.position.y = 0.85; manger.add(mbot);
    this.feed = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.3, 0.12, 20), new THREE.MeshStandardMaterial({ map: st.map, color: 0xc8b070, roughness: 1 }));
    this.feed.position.y = 0.92; manger.add(this.feed); this.manger = manger;
    const brk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.4), iron); brk.position.set(0, 0.95, -0.3); manger.add(brk);
    const bucket = new THREE.Group(); bucket.position.set(1.5, 0, -6.85); S.add(bucket);
    { const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 12, Math.PI), iron); hook.position.set(0, 1.2, -0.18); bucket.add(hook);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.006, 6, 24, Math.PI), iron); handle.position.set(0, 1.13, 0); handle.rotation.x = -0.4; bucket.add(handle); }
    const bm = new THREE.MeshStandardMaterial({ color: 0x1f5fa8, roughness: 0.45 });
    const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.36, 20, 1, true), bm); bk.material.side = THREE.DoubleSide; bk.position.y = 0.95; bucket.add(bk);
    const bb = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), bm); bb.rotation.x = -Math.PI / 2; bb.position.y = 0.775; bucket.add(bb);
    // marca de llenado (línea blanca por dentro)
    const mark = new THREE.Mesh(new THREE.TorusGeometry(0.188, 0.006, 4, 32), new THREE.MeshBasicMaterial({ color: 0xffffff })); mark.rotation.x = Math.PI / 2; mark.position.y = 1.07; bucket.add(mark);
    this.water = new THREE.Mesh(new THREE.CircleGeometry(0.19, 24), new THREE.MeshStandardMaterial({ color: 0x5a8fa0, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.85 }));
    this.water.rotation.x = -Math.PI / 2; bucket.add(this.water); this.bucket = bucket;
    // red de heno colgada
    const hayRack = new THREE.Group(); hayRack.position.set(0, 0, -6.95); S.add(hayRack);
    for (const [w, h, d, x, y, z, r] of [[1.0, 0.06, 0.06, 0, 1.1, 0.2, 0], [1.0, 0.06, 0.06, 0, 1.6, 0.32, 0], [0.06, 0.6, 0.06, -0.48, 1.35, 0.26, -0.2], [0.06, 0.6, 0.06, 0.48, 1.35, 0.26, -0.2]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(woodDark, 0.5, 0.5)); b.position.set(x, y, z); b.rotation.x = r; b.castShadow = true; hayRack.add(b);
    }
    for (let k = 0; k < 7; k++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 5), mat(woodDark, 0.2, 0.5)); s.position.set(-0.42 + k * 0.14, 1.35, 0.26); s.rotation.x = -0.2; hayRack.add(s); }
    const hayLoad = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.25), new THREE.MeshStandardMaterial({ map: straw().map, color: 0xb9a25e, roughness: 1 })); hayLoad.position.set(0, 1.42, 0.12); hayLoad.castShadow = true; hayRack.add(hayLoad);
    // estiércol (montoncitos sobre la paja)
    this.piles = [];
    const pileMat = new THREE.MeshStandardMaterial({ color: 0x4a3a22, roughness: 0.9 });
    const spots = [[-0.8, -4.4], [0.7, -5.6], [-0.3, -6.1], [0.9, -4.6], [-1.0, -5.4], [0.2, -5.0]];
    for (const [x, z] of spots) {
      const g = new THREE.Group(); g.position.set(x, 0.03, z);
      for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07 + Math.random() * 0.03, 10, 8), pileMat); b.scale.y = 0.75; b.position.set((Math.random() - 0.5) * 0.18, 0.05 + (k > 2 ? 0.06 : 0), (Math.random() - 0.5) * 0.18); b.castShadow = true; g.add(b); }
      // área de toque más grande que el montón (invisible: el rayo la encuentra igual)
      const hit = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), pileMat); hit.visible = false; hit.position.y = 0.1; g.add(hit);
      g.userData.pile = true; S.add(g); this.piles.push(g);
    }
    // arcón de cuidado con cepillos y estante con la montura
    const trunk = new THREE.Group(); trunk.position.set(-3.2, 0, 2.2); S.add(trunk);
    const tb = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.55), new THREE.MeshStandardMaterial({ color: 0x14204a, roughness: 0.5 })); tb.position.y = 0.28; tb.castShadow = true; trunk.add(tb);
    const brushM = new THREE.MeshStandardMaterial({ color: 0x8a5a33, roughness: 0.6 }), bristle = new THREE.MeshStandardMaterial({ color: 0x2a221c, roughness: 1 });
    for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.09), brushM); b.position.set(-0.3 + k * 0.28, 0.58, 0); trunk.add(b); const s = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.08), bristle); s.position.set(-0.3 + k * 0.28, 0.54, 0); trunk.add(s); }
    const rack = new THREE.Group(); rack.position.set(3.6, 0, 2.85); S.add(rack);
    const rb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.5), mat(woodDark, 0.5, 1.2)); rb.position.y = 0.6; rack.add(rb);
    this.saddleOnRack = new THREE.Group(); rack.add(this.saddleOnRack);
    const sadM = new THREE.MeshPhysicalMaterial({ color: 0x3a2214, roughness: 0.55, clearcoat: 0.2 });
    const seat = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.36, 6, 12), sadM); seat.rotation.z = Math.PI / 2; seat.scale.set(1, 1, 1.6); seat.position.set(0, 1.28, -0.05); this.saddleOnRack.add(seat);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.03), sadM); flap.position.set(0, 1.08, 0.22); this.saddleOnRack.add(flap);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.02), new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.9 })); pad.position.set(0, 1.0, 0.25); this.saddleOnRack.add(pad);
    // cabezada colgada
    this.bridleOnHook = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 6, 24), sadM); this.bridleOnHook.position.set(4.3, 1.7, 2.9); S.add(this.bridleOnHook);
    // zona de lavado al oeste: canilla y manguera enrollada
    const reel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 24), new THREE.MeshStandardMaterial({ color: 0x2f7a3a, roughness: 0.5 })); reel.position.set(-11.8, 1.2, 1.5); reel.rotation.y = Math.PI / 2; S.add(reel);
    const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), iron); tap.rotation.z = Math.PI / 2; tap.position.set(-11.75, 1.0, 2.1); S.add(tap);
    const drain = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x222, roughness: 0.4, metalness: 0.6 })); drain.rotation.x = -Math.PI / 2; drain.position.set(-1.6, 0.006, 1.2); S.add(drain);
    // cabestros: de las argollas de los postes a la cabezada (se actualizan por cuadro)
    const rope = new THREE.MeshStandardMaterial({ color: 0x1d2a4a, roughness: 0.75 });
    this.ties = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 6), rope); m.castShadow = true; S.add(m); return m; });
    this.tieAnchors = [new THREE.Vector3(2.5, 1.75, -2.95), new THREE.Vector3(2.5, 1.75, 2.95)];
    for (const a of this.tieAnchors) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 12), iron); r.position.copy(a); S.add(r); }
  }

  // ---------------------------------------------------------------- estado desde el perfil
  enter(horse, h, leather) {
    this.horse = horse;
    horse.moveTo(this.scene);
    horse.root.position.copy(HORSE_POS); horse.root.rotation.y = Math.PI / 2;      // como en la pista: π/2 − rumbo, rumbo 0 → mira +X
    horse.showRider(false);
    horse.setTack({ saddle: !!h.tack.saddled, bridle: true, leather });
    horse.idleAlt = false;
    this.saddleOnRack.visible = !h.tack.saddled; this.bridleOnHook.visible = false;
    horse.update(1 / 60, { v: 0, turn: 0, jump: null });
    this.piles.forEach((p, i) => { p.visible = i < (h.manure || 0); });
    this.setBedding(h.bedding ?? 1);
    this.setWater(h.needs.agua / 100);
    this.setFeed(h.needs.comida > 70 ? 1 : 0);
    this.setView('groom', true);
  }
  setBedding(k) { this.bedding = k; this.bedMat.color.setRGB(0.55 + 0.45 * k, 0.5 + 0.45 * k, 0.38 + 0.4 * k); }
  setWater(k) { this.waterK = k; this.water.position.y = 0.78 + 0.34 * Math.max(0.02, Math.min(1.08, k)); this.water.visible = k > 0.02; }
  setFeed(k) { this.feed.visible = k > 0; this.feed.scale.y = Math.max(0.2, k); }

  // ---------------------------------------------------------------- cámara
  resize(w, h) { this.cam.aspect = w / h; this.cam.fov = h > w ? 66 : 52; this.cam.updateProjectionMatrix(); this.portrait = h > w; }
  viewPose(name) {
    const H = HORSE_POS;
    if (name === 'groom') { const a = this.orbitA, rx = 3.3, rz = 2.25; return [[H.x + Math.cos(a) * rx, 1.75, H.z + Math.sin(a) * rz], [H.x, 1.05, H.z]]; }
    if (name === 'stall') return this.portrait ? [[0.05, 3.7, -1.3], [0, 0, -5.3]] : [[1.3, 2.3, -1.9], [0.5, 0.3, -5.3]];
    if (name === 'manger') return [[-0.4, 1.75, -4.9], [-1.4, 0.95, -6.7]];
    if (name === 'bucket') return [[0.9, 1.6, -5.4], [1.5, 0.95, -6.85]];
    if (name === 'tack') return [[0.2, 1.7, 3.0], [0.1, 1.25, 0.2]];
    if (name.startsWith('hoof')) {
      const i = +name.slice(4), p = this.horse.hooves()[i], side = i % 2 ? 1 : -1;         // mirando a +X, la izquierda del caballo es −Z
      return [[p.x + (i < 2 ? 0.55 : -0.55), 0.55, p.z + side * 0.85], [p.x, 0.12, p.z]];
    }
    return [[4, 2, 3], [0, 1, 0]];
  }
  setView(name, now) {
    this.view = name; const pose = this.viewPose(name);
    if (now) { this.cam.position.set(...pose[0]); this.look.set(...pose[1]); this.camT = 1; this.camGoal = null; }
    else { this.camFrom = [this.cam.position.clone(), this.look.clone()]; this.camGoal = pose; this.camT = 0; }
  }
  orbit(d) { this.orbitA += d; if (this.view === 'groom') { const p = this.viewPose('groom'); this.cam.position.set(...p[0]); } }

  // ---------------------------------------------------------------- por cuadro
  update(dt) {
    this.t += dt;
    const H = this.horse;
    if (H) {
      // de vez en cuando cambia de postura (clip «idle2»)
      this.idleT -= dt; if (this.idleT <= 0) { H.idleAlt = !H.idleAlt; this.idleT = 7 + Math.random() * 8; }
      H.update(dt, { v: 0, turn: 0, jump: null });
      H.dryCare(dt, 0.008); H.flushCare();
      // cabestros a la cabezada
      // argollas de la cabezada a los lados de la quijada; cada cabestro con una leve caída en el medio
      const bit = H.bones.BN_BT_Lip_028 || H.bones.BN_Head_00_016, hp = new THREE.Vector3(); bit.getWorldPosition(hp);
      const seg = (m, a, b) => { m.position.copy(a).lerp(b, 0.5); m.scale.y = a.distanceTo(b); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); };
      this.tieAnchors.forEach((a, i) => {
        const b = hp.clone().add(new THREE.Vector3(-0.12, 0.02, i ? 0.07 : -0.07)), mid = a.clone().lerp(b, 0.5); mid.y -= 0.08;
        seg(this.ties[i * 2], a, mid); seg(this.ties[i * 2 + 1], mid, b);
      });
    }
    if (this.camGoal && this.camT < 1) {
      this.camT = Math.min(1, this.camT + dt / 0.9); const k = this.camT * this.camT * (3 - 2 * this.camT);
      this.cam.position.lerpVectors(this.camFrom[0], new THREE.Vector3(...this.camGoal[0]), k);
      this.look.lerpVectors(this.camFrom[1], new THREE.Vector3(...this.camGoal[1]), k);
    }
    this.cam.lookAt(this.look);
    this.particles.update(dt);
  }

  // ---------------------------------------------------------------- interacción
  raycast(nx, ny, objs) {
    this.ray = this.ray || new THREE.Raycaster();
    this.ray.setFromCamera({ x: nx, y: ny }, this.cam);
    return this.ray.intersectObjects(objs, true)[0] || null;
  }
  hitHorse(nx, ny) { const h = this.raycast(nx, ny, [this.horse.coatMesh]); return h && h.object === this.horse.coatMesh ? h : null; }
  hitPile(nx, ny) { const h = this.raycast(nx, ny, this.piles.filter((p) => p.visible)); if (!h) return null; let o = h.object; while (o && !o.userData.pile) o = o.parent; return o; }
  // polvo del cepillo o agua de la manguera hacia el punto tocado
  dust(p, n = 3) { this.particles.burst(p, n, 0xb79d78, 0.5, 0.8); }
  spray(from, to) { this.particles.stream(from, to, 0xcfe6f0); }
}

// partículas simples (polvo, agua, paja)
class Spray {
  constructor(S) {
    const N = this.N = 400;
    this.pos = new Float32Array(N * 3); this.vel = new Float32Array(N * 3); this.life = new Float32Array(N); this.col = new Float32Array(N * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false }));
    this.pts.frustumCulled = false; S.add(this.pts); this.i = 0;
  }
  emit(p, v, c, life) {
    const i = this.i = (this.i + 1) % this.N; this.pos.set([p.x, p.y, p.z], i * 3); this.vel.set([v.x, v.y, v.z], i * 3);
    const C = new THREE.Color(c); this.col.set([C.r, C.g, C.b], i * 3); this.life[i] = life;
  }
  burst(p, n, c, speed, life) { for (let k = 0; k < n; k++) this.emit(p, new THREE.Vector3((Math.random() - 0.5) * speed, Math.random() * speed * 0.6, (Math.random() - 0.5) * speed), c, life * (0.6 + Math.random() * 0.6)); }
  stream(a, b, c) {
    const d = b.clone().sub(a), L = d.length(); d.normalize();
    for (let k = 0; k < 4; k++) { const v = d.clone().multiplyScalar(L / 0.35).add(new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6 + 0.6, (Math.random() - 0.5) * 0.6)); this.emit(a, v, c, 0.35 + Math.random() * 0.1); }
  }
  update(dt) {
    for (let i = 0; i < this.N; i++) {
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -99; continue; }
      this.life[i] -= dt; this.vel[i * 3 + 1] -= 4 * dt;
      for (let a = 0; a < 3; a++) this.pos[i * 3 + a] += this.vel[i * 3 + a] * dt;
      if (this.pos[i * 3 + 1] < 0.01) { this.pos[i * 3 + 1] = 0.01; this.vel[i * 3] *= 0.3; this.vel[i * 3 + 2] *= 0.3; this.vel[i * 3 + 1] = 0; }
    }
    this.pts.geometry.attributes.position.needsUpdate = true; this.pts.geometry.attributes.color.needsUpdate = true;
  }
}
