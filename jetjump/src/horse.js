// JETJump — caballo y jinete procedurales.
// Torso y cuello/cabeza se modelan como campos de metaballs (marching cubes)
// y se congelan en geometría estática. Patas, cola y jinete son cadenas articuladas.
import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { footOffsets, DUTY } from './sim.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

export const COATS = {
  bay: { name: 'Zaino', body: 0x6b3a1e, points: 0x161010, mane: 0x120c0a, sheen: 0xc88a55 },
  darkbay: { name: 'Zaino oscuro', body: 0x3a2014, points: 0x0f0b0a, mane: 0x0b0807, sheen: 0x9a6a48 },
  chestnut: { name: 'Alazán', body: 0x9a4f22, points: 0x8a4219, mane: 0x7a3a18, sheen: 0xe0a070 },
  grey: { name: 'Tordillo', body: 0xb9b6b0, points: 0x6e6b68, mane: 0xd8d6d2, sheen: 0xffffff, dapple: true },
  black: { name: 'Moro', body: 0x16110f, points: 0x0c0a09, mane: 0x070606, sheen: 0x6b6b80 },
  palomino: { name: 'Palomino', body: 0xc8a060, points: 0xb08a50, mane: 0xf0e2c0, sheen: 0xfff0c8 },
};

// --- ruido 3D barato para moteado / variación de pelaje
function hash3(x, y, z) {
  let h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = smooth(xf), v = smooth(yf), w = smooth(zf);
  let r = 0;
  for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
    const k = hash3(xi + dx, yi + dy, zi + dz);
    r += k * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
  }
  return r;
}

// Construye una malla de metaballs y la congela.
function blobMesh(balls, center, S, res, material, colorFn) {
  const mc = new MarchingCubes(res, material, false, true, 90000);
  mc.isolation = 80;
  const sub = 12;
  mc.reset();
  for (const b of balls) {
    const r = (b[3] / S) * 0.88;
    const str = r * r * (80 + sub);
    const nx = (b[0] - center[0]) / S + 0.5, ny = (b[1] - center[1]) / S + 0.5, nz = (b[2] - center[2]) / S + 0.5;
    mc.addBall(nx, ny, nz, str, sub, b[4] || [1, 1, 1]);
  }
  mc.update();
  const n = mc.count;
  const src = mc.geometry;
  const pos = src.getAttribute('position').array.slice(0, n * 3);
  const nor = src.getAttribute('normal').array.slice(0, n * 3);
  const colA = src.getAttribute('color');
  const col = colA ? colA.array.slice(0, n * 3) : new Float32Array(n * 3).fill(1);
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3] * S / 2 + center[0], y = pos[i * 3 + 1] * S / 2 + center[1], z = pos[i * 3 + 2] * S / 2 + center[2];
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    if (colorFn) {
      const c = colorFn(x, y, z, col[i * 3], col[i * 3 + 1], col[i * 3 + 2]);
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const uv = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { uv[i * 2] = pos[i * 3] * 0.8 + pos[i * 3 + 2] * 0.3; uv[i * 2 + 1] = pos[i * 3 + 1] * 0.8; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeBoundingSphere();
  src.dispose();
  const m = new THREE.Mesh(g, material);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// segmento de miembro: torneado con perfil (radio arriba -> abajo), cuelga hacia -Y
function limbGeo(len, r0, r1, bulge = 0.12, seg = 14) {
  const pts = [];
  const N = 10;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    let r = lerp(r0, r1, t) * (1 + bulge * Math.sin(Math.PI * Math.min(1, t * 1.4)));
    pts.push(new THREE.Vector2(Math.max(0.001, r), -t * len));
  }
  pts.unshift(new THREE.Vector2(0.001, 0.0001));
  pts.push(new THREE.Vector2(0.001, -len));
  const g = new THREE.LatheGeometry(pts, seg);
  // aplanar levemente de lado (los miembros equinos son más profundos que anchos)
  g.scale(1, 1, 0.78);
  return g;
}

function makeJoint(parent, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

export class HorseModel {
  constructor(look = {}) {
    this.look = { coat: 'bay', blaze: false, socks: [0, 0, 0, 0], boots: 0x1b2340, pad: 0xf4f4f0, ...look };
    const coat = COATS[this.look.coat] || COATS.bay;
    this.coat = coat;
    this.root = new THREE.Group();
    this.body = new THREE.Group();     // se mueve con el galope
    this.root.add(this.body);

    const bodyCol = new THREE.Color(coat.body);
    const fur = furTexture();
    this.coatMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, vertexColors: true, roughness: 0.52, metalness: 0,
      sheen: 1.0, sheenRoughness: 0.38, sheenColor: new THREE.Color(coat.sheen).multiplyScalar(0.5),
      clearcoat: 0.12, clearcoatRoughness: 0.6, bumpMap: fur, bumpScale: 0.0035, envMapIntensity: 0.8,
    });
    const pointsMat = new THREE.MeshPhysicalMaterial({ color: coat.points, roughness: 0.5, sheen: 0.8, sheenRoughness: 0.4, sheenColor: new THREE.Color(coat.sheen).multiplyScalar(0.3) });
    const legUpperMat = new THREE.MeshPhysicalMaterial({ color: bodyCol.clone().lerp(new THREE.Color(coat.points), 0.25), roughness: 0.46, sheen: 1, sheenRoughness: 0.32, sheenColor: new THREE.Color(coat.sheen).multiplyScalar(0.5) });
    const whiteMat = new THREE.MeshPhysicalMaterial({ color: 0xf2efe8, roughness: 0.6, sheen: 0.6, sheenColor: 0xffffff });
    const hoofMat = new THREE.MeshStandardMaterial({ color: 0x2a2421, roughness: 0.45, metalness: 0.05 });
    const bootMat = new THREE.MeshStandardMaterial({ color: this.look.boots, roughness: 0.55 });
    const maneMat = new THREE.MeshStandardMaterial({ color: coat.mane, roughness: 0.75 });
    const leather = new THREE.MeshStandardMaterial({ color: 0x2b170c, roughness: 0.38, metalness: 0.05 });
    const steel = new THREE.MeshStandardMaterial({ color: 0xc8c8cc, roughness: 0.25, metalness: 1 });
    this.mats = { coat: this.coatMat, points: pointsMat, white: whiteMat, hoof: hoofMat, boot: bootMat, mane: maneMat, leather, steel };

    const bc = [bodyCol.r, bodyCol.g, bodyCol.b];
    const dapple = !!coat.dapple;
    const colorFn = (x, y, z, r, g, b) => {
      // variación sutil + moteado de tordillo + vientre más claro
      const n = vnoise(x * 6, y * 6, z * 6);
      let k = 0.92 + 0.16 * n;
      if (dapple) {
        const d = vnoise(x * 9 + 3, y * 9, z * 9);
        k *= d > 0.62 ? 1.12 : d < 0.35 ? 0.86 : 1.0;
      }
      if (y < 1.0) k *= 1.04;
      return [r * k, g * k, b * k];
    };

    // ---- TORSO
    const C = bc;
    const torsoBalls = [];
    // barril: cadena de esferas que se afina hacia el flanco
    for (let i = 0; i <= 6; i++) {
      const t = i / 6, x = lerp(-0.55, 0.45, t);
      const r = 0.255 + 0.03 * Math.sin(Math.PI * t) - 0.02 * (1 - t);
      torsoBalls.push([x, 1.24, 0, r, C]);
      torsoBalls.push([x, 1.07, 0, r * 0.78, C]);
      torsoBalls.push([x, 1.40, 0, r * 0.62, C]);
    }
    torsoBalls.push(
      // pecho y encuentros
      [0.6, 1.2, 0, 0.21, C], [0.68, 1.1, 0.1, 0.13, C], [0.68, 1.1, -0.1, 0.13, C], [0.62, 1.0, 0, 0.13, C],
      // paletas
      [0.45, 1.3, 0.18, 0.17, C], [0.45, 1.3, -0.18, 0.17, C],
      // cruz y lomo
      [0.42, 1.52, 0, 0.12, C], [0.3, 1.52, 0, 0.12, C], [0.1, 1.5, 0, 0.13, C], [-0.2, 1.5, 0, 0.14, C], [-0.45, 1.5, 0, 0.14, C],
      // grupa
      [-0.62, 1.44, 0.12, 0.19, C], [-0.62, 1.44, -0.12, 0.19, C], [-0.8, 1.38, 0.11, 0.17, C], [-0.8, 1.38, -0.11, 0.17, C],
      [-0.88, 1.47, 0, 0.1, C], [-0.72, 1.52, 0, 0.12, C],
      // muslos
      [-0.68, 1.12, 0.19, 0.15, C], [-0.68, 1.12, -0.19, 0.15, C], [-0.58, 1.0, 0.18, 0.11, C], [-0.58, 1.0, -0.18, 0.11, C],
      // brazos
      [0.5, 1.02, 0.17, 0.1, C], [0.5, 1.02, -0.17, 0.1, C],
      // base del cuello
      [0.62, 1.42, 0, 0.19, C],
    );
    this.torso = blobMesh(torsoBalls, [-0.05, 1.25, 0], 2.7, 72, this.coatMat, colorFn);
    this.body.add(this.torso);

    // ---- CUELLO + CABEZA (pivota en la base del cuello)
    this.neck = makeJoint(this.body, 0.58, 1.46, 0);
    const blazeW = this.look.blaze ? [0.95, 0.94, 0.9] : C;
    const neckBalls = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = lerp(0.02, 0.42, t), y = lerp(0.0, 0.42, t * (1.12 - 0.12 * t));
      const r = lerp(0.19, 0.105, t);
      neckBalls.push([x, y, 0, r, C]);
      neckBalls.push([x - 0.05 * (1 - t), y + r * 0.5, 0, r * 0.5, C]); // cresta
      neckBalls.push([x + 0.05, y - r * 0.5, 0, r * 0.55, C]); // garganta
    }
    neckBalls.push(
      [0.46, 0.5, 0, 0.09, C], [0.55, 0.45, 0, 0.095, blazeW], // nuca y frente
      [0.52, 0.36, 0.055, 0.085, C], [0.52, 0.36, -0.055, 0.085, C], // quijadas
      [0.6, 0.33, 0, 0.08, blazeW], [0.66, 0.27, 0, 0.072, blazeW], [0.73, 0.2, 0, 0.068, blazeW],
      [0.8, 0.12, 0, 0.064, blazeW], [0.86, 0.05, 0, 0.062, blazeW],
      [0.9, 0.0, 0.025, 0.055, blazeW], [0.9, 0.0, -0.025, 0.055, blazeW],
      [0.85, -0.05, 0, 0.05, C], [0.78, 0.0, 0, 0.055, C],
    );
    this.neckMesh = blobMesh(neckBalls, [0.42, 0.22, 0], 1.45, 60, this.coatMat, colorFn);
    this.neck.add(this.neckMesh);
    // ojos
    const eyeMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0605, roughness: 0.08, clearcoat: 1 });
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), eyeMat);
      e.position.set(0.58, 0.42, s * 0.078); this.neck.add(e);
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshStandardMaterial({ color: 0x120a08, roughness: 0.9 }));
      n.position.set(0.92, 0.02, s * 0.04); this.neck.add(n);
    }
    // orejas
    this.ears = [];
    for (const s of [-1, 1]) {
      const ear = new THREE.Group();
      ear.position.set(0.45, 0.56, s * 0.05);
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 10), this.mats.points.clone());
      m.material.color.set(coat.body).multiplyScalar(0.85);
      m.scale.set(1, 1, 0.55); m.position.y = 0.06; m.castShadow = true;
      ear.add(m); ear.rotation.z = -0.15; ear.rotation.x = s * 0.18;
      this.neck.add(ear); this.ears.push(ear);
    }
    // crin
    this.mane = [];
    for (let i = 0; i < 22; i++) {
      const t = i / 21;
      const x = lerp(0.42, -0.04, t), y = lerp(0.56, 0.2, t) + 0.04;
      const strand = new THREE.Group();
      strand.position.set(x, y, 0.03);
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16 + 0.06 * Math.sin(Math.PI * t), 0.018), maneMat);
      m.position.y = -0.08; m.castShadow = true;
      strand.add(m);
      strand.rotation.x = -0.75; strand.rotation.z = -0.25;
      this.neck.add(strand); this.mane.push(strand);
    }
    // copete
    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.05), maneMat);
    fore.position.set(0.56, 0.5, 0.02); fore.rotation.z = -1.1; this.neck.add(fore);

    // cabezada (cabezada, muserola, frontalera) y filete
    const strap = (a, b, w = 0.018) => {
      const len = a.distanceTo(b);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.012), leather);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      return m;
    };
    for (const s of [-1, 1]) {
      this.neck.add(strap(new THREE.Vector3(0.47, 0.52, s * 0.085), new THREE.Vector3(0.84, 0.06, s * 0.075)));
      this.neck.add(strap(new THREE.Vector3(0.47, 0.52, s * 0.085), new THREE.Vector3(0.46, 0.3, s * 0.1)));
    }
    const nose = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 20), leather);
    nose.position.set(0.8, 0.1, 0); nose.rotation.set(0, Math.PI / 2, 0.8); nose.scale.set(1, 0.85, 1);
    this.neck.add(nose);
    const brow = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.01, 6, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.3, metalness: 0.6 }));
    brow.position.set(0.52, 0.5, 0); brow.rotation.set(0, Math.PI / 2, -0.5);
    this.neck.add(brow);
    this.bit = new THREE.Object3D(); this.bit.position.set(0.86, 0.02, 0); this.neck.add(this.bit);
    for (const s of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 16), steel);
      ring.position.set(0.86, 0.02, s * 0.068); this.neck.add(ring);
    }

    // ---- MONTURA
    const saddle = new THREE.Group();
    this.backY = measureTop(this.torso.geometry, 0.1, 0.1, 0.06);
    saddle.position.set(0.1, this.backY - 0.01, 0);
    this.body.add(saddle);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.62, 1, 1, 8), new THREE.MeshStandardMaterial({ color: this.look.pad, roughness: 0.85 }));
    bendAround(pad.geometry, 0.38);
    pad.position.set(0.02, -0.02, 0); pad.castShadow = true; saddle.add(pad);
    const seatGeo = new THREE.SphereGeometry(0.25, 24, 14);
    seatGeo.scale(1.2, 0.32, 0.72);
    const seat = new THREE.Mesh(seatGeo, leather); seat.position.set(0, 0.03, 0); seat.castShadow = true; saddle.add(seat);
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), leather); pommel.scale.set(0.8, 0.7, 1.4); pommel.position.set(0.2, 0.08, 0); saddle.add(pommel);
    const cantle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), leather); cantle.scale.set(0.6, 0.9, 1.6); cantle.position.set(-0.23, 0.08, 0); saddle.add(cantle);
    for (const s of [-1, 1]) {
      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.015), leather);
      flap.position.set(0.08, -0.16, s * 0.3); flap.rotation.x = s * 0.22; flap.castShadow = true; saddle.add(flap);
    }
    // cincha
    const girth = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 6, 40), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 }));
    girth.position.set(0.3, 1.2, 0); girth.scale.set(0.78, 0.86, 0.78); girth.rotation.y = Math.PI / 2;
    this.body.add(girth);
    // estribos
    this.stirrups = [];
    for (const s of [-1, 1]) {
      const st = new THREE.Group();
      st.position.set(0.12, this.backY - 0.1, s * 0.27);
      const leatherStrap = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.5, 0.008), leather);
      leatherStrap.position.y = -0.25; st.add(leatherStrap);
      const iron = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 6, 14), steel);
      iron.position.y = -0.52; iron.rotation.y = Math.PI / 2; st.add(iron);
      this.body.add(st); this.stirrups.push(st);
    }

    // ---- PATAS  [MA, MD, PA, PD]
    this.legs = [];
    const mkLeg = (front, side, idx) => {
      const sock = this.look.socks[idx];
      const lowMat = sock ? whiteMat : pointsMat;
      const L = {};
      if (front) {
        L.root = makeJoint(this.body, 0.5, 1.22, side * 0.17);
        L.upper = makeJoint(L.root, 0, 0, 0);
        const ua = new THREE.Mesh(limbGeo(0.24, 0.12, 0.095, 0.1), this.coatMat === null ? legUpperMat : legUpperMat);
        ua.castShadow = true; L.upper.add(ua);
        L.mid = makeJoint(L.upper, 0, -0.22, 0);
        const fa = new THREE.Mesh(limbGeo(0.5, 0.088, 0.047, 0.18), legUpperMat); fa.castShadow = true; L.mid.add(fa);
        const knee = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), this.coat.points === this.coat.body ? legUpperMat : pointsMat);
        knee.scale.set(1.05, 1, 0.85); knee.position.y = -0.5; L.mid.add(knee);
        L.low = makeJoint(L.mid, 0, -0.5, 0);
        const cn = new THREE.Mesh(limbGeo(0.3, 0.04, 0.036, 0.0), lowMat); cn.castShadow = true; L.low.add(cn);
        const boot = new THREE.Mesh(limbGeo(0.22, 0.05, 0.05, 0), bootMat); boot.position.y = -0.06; boot.castShadow = true; L.low.add(boot);
        L.fet = makeJoint(L.low, 0, -0.3, 0);
        L.restP = 0.55;
      } else {
        L.root = makeJoint(this.body, -0.62, 1.26, side * 0.19);
        L.upper = makeJoint(L.root, 0, 0, 0);
        const th = new THREE.Mesh(limbGeo(0.32, 0.15, 0.11, 0.08), legUpperMat); th.castShadow = true; L.upper.add(th);
        L.mid = makeJoint(L.upper, 0, -0.3, 0);
        const ga = new THREE.Mesh(limbGeo(0.46, 0.105, 0.05, 0.15), legUpperMat); ga.castShadow = true; L.mid.add(ga);
        const hock = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), legUpperMat);
        hock.scale.set(1.3, 1, 0.8); hock.position.set(-0.02, -0.46, 0); L.mid.add(hock);
        L.low = makeJoint(L.mid, 0, -0.46, 0);
        const cn = new THREE.Mesh(limbGeo(0.36, 0.043, 0.037, 0.0), lowMat); cn.castShadow = true; L.low.add(cn);
        const boot = new THREE.Mesh(limbGeo(0.1, 0.052, 0.05, 0), bootMat); boot.position.y = -0.24; L.low.add(boot);
        L.fet = makeJoint(L.low, 0, -0.36, 0);
        L.restP = 0.62;
      }
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.047, 12, 10), lowMat); fl.scale.set(1, 1, 0.85); L.fet.add(fl);
      const ps = new THREE.Mesh(limbGeo(0.14, 0.036, 0.042, 0), lowMat); ps.castShadow = true; L.fet.add(ps);
      L.hoofJ = makeJoint(L.fet, 0, -0.14, 0);
      const hoofGeo = new THREE.CylinderGeometry(0.05, 0.066, 0.085, 16);
      hoofGeo.translate(0.012, -0.0425, 0);
      const hoof = new THREE.Mesh(hoofGeo, hoofMat); hoof.castShadow = true; L.hoofJ.add(hoof);
      L.front = front; L.side = side; L.idx = idx;
      L.hoofTip = new THREE.Object3D(); L.hoofTip.position.y = -0.085; L.hoofJ.add(L.hoofTip);
      return L;
    };
    this.legs = [mkLeg(true, -1, 0), mkLeg(true, 1, 1), mkLeg(false, -1, 2), mkLeg(false, 1, 3)];

    // ---- COLA
    this.tail = [];
    let parent = makeJoint(this.body, -0.93, 1.5, 0);
    this.tailRoot = parent;
    const tailMat = maneMat;
    for (let i = 0; i < 8; i++) {
      const len = i < 2 ? 0.1 : 0.11;
      const r0 = i < 2 ? 0.05 : 0.04 + i * 0.004, r1 = i < 2 ? 0.045 : 0.045 + i * 0.004;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, 8), i < 2 ? legUpperMat : tailMat);
      seg.geometry.translate(0, -len / 2, 0); seg.castShadow = true;
      parent.add(seg);
      const j = makeJoint(parent, 0, -len, 0);
      this.tail.push({ seg: parent, j, ang: 0, vel: 0 });
      parent = j;
    }
    this.tailState = this.tail.map(() => ({ a: 0, v: 0 }));

    this.reinL = this.makeRein(); this.reinR = this.makeRein();
    this.root.add(this.reinL, this.reinR);

    this.rider = new Rider(this.look.rider);
    this.body.add(this.rider.root);
    this.rider.root.position.set(0.08, this.backY + 0.06, 0);

    this.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.t = 0; this.headNod = 0; this.prevYaw = 0;
    this.tmpA = new THREE.Vector3(); this.tmpB = new THREE.Vector3();
  }

  makeRein() {
    const g = new THREE.CylinderGeometry(0.008, 0.008, 1, 5);
    g.translate(0, 0.5, 0);
    const m = new THREE.Mesh(g, this.mats.leather);
    m.castShadow = true;
    return m;
  }

  // pose: {phase, w:[paso, trote, galope, galope largo], L, lead, jumpT, jumpPhase, pitch, roll, y, v, omega, refuse, halt}
  update(pose, dt) {
    this.t += dt;
    const w = pose.w;
    const phase = pose.phase;
    const L = pose.L || 3;
    const moving = w[0] + w[1] + w[2] + w[3];
    const still = clamp(1 - moving, 0, 1);

    // ---- movimiento de cuerpo por aire
    const p2 = phase * TAU;
    let bob = 0, rock = 0, neckA = 0;
    bob += w[0] * (0.015 * Math.sin(p2 * 2));
    bob += w[1] * (0.045 * Math.cos(p2 * 2) );
    bob += w[2] * (0.065 * Math.sin(p2 - 0.6));
    bob += w[3] * (0.07 * Math.sin(p2 - 0.9));
    rock += w[2] * (0.07 * Math.cos(p2 - 0.3)) + w[3] * 0.06 * Math.cos(p2 - 0.5);
    neckA += w[0] * 0.06 * Math.sin(p2 * 2 + 1) + w[1] * 0.02 * Math.sin(p2 * 2) + w[2] * (-0.12 * Math.cos(p2 - 0.2)) + w[3] * (-0.14 * Math.cos(p2 - 0.4));

    const J = pose.jumpT;
    const inJump = J >= 0;
    const jw = pose.jumpW || 0;
    // respiración en parado
    const breathe = Math.sin(this.t * 1.6) * 0.004 * still;

    this.body.position.y = (pose.y - 1.12) * jw + bob * (1 - jw) + breathe;
    this.body.rotation.z = lerp(rock, pose.pitch, jw);
    this.body.rotation.x = pose.roll;

    // cuello: báscula en el salto, cabeza alta en rehúse, bajo al paso
    let neckZ = -0.05 + neckA - 0.08 * w[0] - 0.02 * still + 0.1 * (pose.refuse || 0);
    if (inJump) {
      const a = J < 0.15 ? lerp(0, -0.25, J / 0.15) : J < 0.6 ? -0.25 - 0.15 * Math.sin((J - 0.15) / 0.45 * Math.PI) : lerp(-0.25, 0.15, (J - 0.6) / 0.4);
      neckZ = lerp(neckZ, a, jw);
    }
    if (still > 0.5) neckZ += Math.sin(this.t * 0.4) * 0.05 * still;
    this.neck.rotation.z = neckZ;
    this.neck.rotation.y = clamp(-(pose.omega || 0) * 0.18, -0.25, 0.25);

    // orejas: atentas a la valla, giran al mover
    const earA = 0.15 + 0.25 * Math.sin(this.t * 0.7 + Math.sin(this.t * 0.31) * 3) * still - 0.25 * (pose.refuse || 0);
    this.ears[0].rotation.z = -earA; this.ears[1].rotation.z = -earA + 0.1 * Math.sin(this.t * 0.5);

    // ---- patas
    const gaits = [1, 2, 3, 4];
    for (const leg of this.legs) {
      let a = [0, 0, 0, 0, 0]; // upper, mid, low, fet, hoof
      // pose estática
      const rest = leg.front ? [0.06, -0.06, 0, leg.restP, -leg.restP] : [0.35, -0.75, 0.4, leg.restP, -leg.restP];
      for (let k = 0; k < 5; k++) a[k] = rest[k] * (still + moving * 0) ;
      let acc = [0, 0, 0, 0, 0];
      let wsum = still;
      for (let k = 0; k < 5; k++) acc[k] = rest[k] * still;
      for (let gi = 0; gi < 4; gi++) {
        const ww = w[gi];
        if (ww < 0.001) continue;
        const g = gaits[gi];
        const offs = footOffsets(g, pose.lead);
        const duty = DUTY[g];
        const q = ((phase - offs[leg.idx]) % 1 + 1) % 1;
        const pr = this.legPose(leg, q, duty, L, g, rest);
        for (let k = 0; k < 5; k++) acc[k] += pr[k] * ww;
        wsum += ww;
      }
      for (let k = 0; k < 5; k++) a[k] = acc[k] / Math.max(wsum, 1e-4);
      if (inJump && jw > 0) {
        const jp = this.jumpLegPose(leg, J, rest);
        for (let k = 0; k < 5; k++) a[k] = lerp(a[k], jp[k], jw);
      }
      if (pose.refuse > 0) {
        // frenada: manos adelante clavadas, pies debajo
        const r = pose.refuse;
        const rp = leg.front ? [0.45, 0.1, 0, 0.7, -0.7] : [0.75, -0.95, 0.35, 0.65, -0.65];
        for (let k = 0; k < 5; k++) a[k] = lerp(a[k], rp[k], r * 0.8);
      }
      leg.upper.rotation.z = a[0];
      leg.mid.rotation.z = a[1];
      leg.low.rotation.z = a[2];
      leg.fet.rotation.z = a[3];
      leg.hoofJ.rotation.z = a[4];
    }

    // ---- cola (péndulo amortiguado)
    const speed = pose.v || 0;
    const lift = clamp(speed / 10, 0, 1) * 0.6 + (inJump ? 0.5 * jw : 0);
    const targetBase = 0.25 + lift * 0.7;
    const yawRate = pose.omega || 0;
    for (let i = 0; i < this.tail.length; i++) {
      const s = this.tailState[i];
      const tgt = (i === 0 ? targetBase : -0.12 * lift) + (i > 1 ? -bob * 2.5 : 0);
      const k = 60 - i * 4, damp = 6;
      s.v += ((tgt - s.a) * k - s.v * damp) * dt;
      s.a += s.v * dt;
      this.tail[i].seg.rotation.z = (i === 0 ? -0.15 : 0) + s.a * (i === 0 ? 1 : 0.6);
      this.tail[i].seg.rotation.x = yawRate * 0.12 * (i / 8) + Math.sin(this.t * 1.3 + i * 0.6) * 0.03 * still;
    }
    // crin
    for (let i = 0; i < this.mane.length; i++) {
      this.mane[i].rotation.x = -0.9 - clamp(speed / 10, 0, 0.6) * 0.5 + Math.sin(phase * TAU + i * 0.4) * 0.12 * (1 - still);
      this.mane[i].rotation.z = -0.2 - clamp(speed / 10, 0, 1) * 0.6;
    }

    // ---- jinete
    this.rider.update(pose, dt, rock, bob);

    // ---- riendas: de las manos al filete
    this.root.updateMatrixWorld(true);
    for (const [rein, s] of [[this.reinL, -1], [this.reinR, 1]]) {
      const hand = this.rider.handWorld(s, this.tmpA);
      this.bit.getWorldPosition(this.tmpB);
      this.tmpB.addScaledVector(new THREE.Vector3(0, 0, s * 0.075).applyQuaternion(this.neck.getWorldQuaternion(new THREE.Quaternion())), 1);
      this.root.worldToLocal(hand); this.root.worldToLocal(this.tmpB);
      const d = this.tmpB.clone().sub(hand);
      rein.position.copy(hand);
      rein.scale.set(1, d.length(), 1);
      rein.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    }
    // estribos siguen las botas
    for (let i = 0; i < 2; i++) this.stirrups[i].rotation.z = this.rider.legSwing * 0.6;
  }

  legPose(leg, q, duty, L, g, rest) {
    const front = leg.front;
    const len = front ? 1.2 : 1.25;
    const A = clamp(duty * L * 0.5, 0.05, 0.85);
    const flexAmp = [0, 0.55, 0.95, 0.9, 1.05][g];
    let x, lift = 0, load = 0;
    if (q < duty) {
      const s = q / duty;
      x = lerp(A, -A, s);
      load = Math.sin(Math.PI * s);
    } else {
      const s = (q - duty) / (1 - duty);
      x = lerp(-A, A, smooth(s));
      lift = Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.15)), 1.1);
      if (s > 0.85) lift *= (1 - (s - 0.85) / 0.15) * 0.6 + 0.4 * (1 - (s - 0.85) / 0.15);
    }
    const ang = Math.atan2(x, len);
    const k = lift * flexAmp;
    if (front) {
      return [
        rest[0] + ang * 0.55 + k * 0.35,
        rest[1] + ang * 0.45 + k * 0.55,
        rest[2] - k * 1.7,
        rest[3] + load * 0.28 - k * 0.9,
        rest[4] - load * 0.2 + k * 0.25,
      ];
    }
    return [
      rest[0] + ang * 0.75 + k * 0.45,
      rest[1] - k * 0.55 + ang * 0.15,
      rest[2] + k * 1.0 - ang * 0.2,
      rest[3] + load * 0.3 - k * 0.8,
      rest[4] - load * 0.2 + k * 0.2,
    ];
  }

  jumpLegPose(leg, J, rest) {
    if (leg.front) {
      const fold = [rest[0] + 1.05, rest[1] + 1.15, -2.35, -0.6, 0.2];
      const reach = [rest[0] + 0.55, rest[1] + 0.05, -0.05, 0.25, -0.3];
      const push = [rest[0] + 0.2, rest[1] + 0.2, -0.6, 0.2, 0];
      if (J < 0.12) return mix5(push, fold, J / 0.12);
      if (J < 0.6) return fold;
      if (J < 0.9) return mix5(fold, reach, smooth((J - 0.6) / 0.3));
      return reach;
    }
    const pushH = [rest[0] - 0.9, rest[1] + 0.55, rest[2] - 0.3, 0.35, -0.25];
    const tuck = [rest[0] - 0.25, rest[1] - 0.55, rest[2] - 1.4, -0.45, 0.15];
    const land = [rest[0] + 0.55, rest[1] - 0.25, rest[2] + 0.15, 0.3, -0.3];
    if (J < 0.22) return mix5(pushH, tuck, smooth(J / 0.22));
    if (J < 0.68) return tuck;
    return mix5(tuck, land, smooth((J - 0.68) / 0.32));
  }

  hoofWorld(i, out) { return this.legs[i].hoofTip.getWorldPosition(out); }
}

// Pelo corto: rayado fino con dirección dominante, como bump.
function furTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512, l = 4 + Math.random() * 10, a = 0.35 + (Math.random() - 0.5) * 0.5;
    g.strokeStyle = `rgba(${Math.random() < 0.5 ? 60 : 200},${Math.random() < 0.5 ? 60 : 200},${Math.random() < 0.5 ? 60 : 200},0.25)`;
    g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6);
  return t;
}

function measureTop(geo, x0, dx, dz) {
  const p = geo.getAttribute('position');
  let m = -Infinity;
  for (let i = 0; i < p.count; i++) {
    if (Math.abs(p.getX(i) - x0) < dx && Math.abs(p.getZ(i)) < dz) m = Math.max(m, p.getY(i));
  }
  return m;
}

function mix5(a, b, t) { return a.map((v, i) => lerp(v, b[i], t)); }

function bendAround(geo, r) {
  const p = geo.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i);
    const a = z / r;
    p.setY(i, p.getY(i) + (Math.cos(a) - 1) * r);
    p.setZ(i, Math.sin(a) * r);
  }
  geo.computeVertexNormals();
}

// ---------------------------------------------------------------------------
export class Rider {
  constructor(look = {}) {
    this.look = { jacket: 0x14204a, breeches: 0xf5f3ee, helmet: 0x101418, skin: 0xd9a27e, collar: 0xffffff, ...look };
    const M = (c, r = 0.6, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
    const jacket = new THREE.MeshPhysicalMaterial({ color: this.look.jacket, roughness: 0.65, sheen: 0.6, sheenColor: 0x8899cc });
    const breeches = M(this.look.breeches, 0.7);
    const boots = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const helmet = new THREE.MeshPhysicalMaterial({ color: this.look.helmet, roughness: 0.35, clearcoat: 0.6 });
    const skin = M(this.look.skin, 0.7);
    const gloves = M(0x1a1a1a, 0.6);
    const cap = (r, len, mat) => { const g = new THREE.CapsuleGeometry(r, len, 6, 12); g.translate(0, -len / 2 - r * 0.2, 0); const m = new THREE.Mesh(g, mat); m.castShadow = true; return m; };
    const capUp = (r, len, mat) => { const g = new THREE.CapsuleGeometry(r, len, 6, 12); g.translate(0, len / 2 + r * 0.2, 0); const m = new THREE.Mesh(g, mat); m.castShadow = true; return m; };

    this.root = new THREE.Group();
    this.pelvis = new THREE.Group(); this.root.add(this.pelvis);
    const hips = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), breeches); hips.scale.set(1.0, 0.75, 1.15); hips.castShadow = true; this.pelvis.add(hips);
    this.torso = new THREE.Group(); this.torso.position.y = 0.05; this.pelvis.add(this.torso);
    const chest = capUp(0.15, 0.32, jacket); chest.scale.set(0.95, 1, 1.18); this.torso.add(chest);
    const tails = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.2, 14, 1, true), jacket); tails.position.set(-0.03, 0.0, 0); tails.material.side = THREE.DoubleSide; this.torso.add(tails);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.06, 12), M(this.look.collar, 0.5)); collar.position.y = 0.6; this.torso.add(collar);
    this.headJ = new THREE.Group(); this.headJ.position.y = 0.62; this.torso.add(this.headJ);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), skin); head.scale.set(1.05, 1.15, 0.95); head.position.y = 0.1; head.castShadow = true; this.headJ.add(head);
    const hel = new THREE.Mesh(new THREE.SphereGeometry(0.118, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), helmet); hel.position.y = 0.13; hel.castShadow = true; this.headJ.add(hel);
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 16, 1, false, -0.9, 1.8), helmet); visor.position.set(0.04, 0.12, 0); visor.rotation.z = -0.25; this.headJ.add(visor);
    this.eyeCam = new THREE.Object3D(); this.eyeCam.position.set(0.1, 0.12, 0); this.headJ.add(this.eyeCam);

    this.arms = []; this.legsR = [];
    for (const s of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(0.0, 0.5, s * 0.19); this.torso.add(sh);
      sh.add(cap(0.05, 0.22, jacket));
      const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
      el.add(cap(0.042, 0.2, jacket));
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), gloves); hand.position.y = -0.29; el.add(hand);
      const handPt = new THREE.Object3D(); handPt.position.y = -0.3; el.add(handPt);
      this.arms.push({ sh, el, handPt, s });

      const hip = new THREE.Group(); hip.position.set(0.02, -0.02, s * 0.12); this.pelvis.add(hip);
      const thigh = cap(0.075, 0.32, breeches); hip.add(thigh);
      const knee = new THREE.Group(); knee.position.y = -0.44; hip.add(knee);
      const shin = cap(0.055, 0.32, boots); knee.add(shin);
      const ankle = new THREE.Group(); ankle.position.y = -0.43; knee.add(ankle);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.08), boots); foot.position.set(0.06, -0.02, 0); ankle.add(foot);
      this.legsR.push({ hip, knee, ankle, s });
    }
    this.lean = 0; this.lift = 0; this.legSwing = 0; this.seatV = 0; this.seatY = 0;
    this.fall = 0;
  }

  handWorld(s, out) {
    const a = this.arms[s < 0 ? 0 : 1];
    return a.handPt.getWorldPosition(out);
  }

  update(pose, dt, rock, bob) {
    const J = pose.jumpT, jw = pose.jumpW || 0;
    // dos puntos: se levanta de la montura antes y durante el salto
    let two = 0;
    if (J >= 0) two = J < 0.1 ? J / 0.1 : J < 0.75 ? 1 : 1 - (J - 0.75) / 0.25 * 0.7;
    two = Math.max(two * jw, pose.approachTwo || 0);
    const w = pose.w;
    const cant = w[2] + w[3];
    // asiento con lag: absorbe el galope
    const tgt = -bob * 0.6;
    this.seatV += ((tgt - this.seatY) * 140 - this.seatV * 14) * dt;
    this.seatY += this.seatV * dt;
    // trote levantado
    const post = w[1] * Math.max(0, Math.sin(pose.phase * Math.PI * 4)) * 0.07;

    this.pelvis.position.set(-0.06 * two, 0.11 * two + this.seatY * (1 - two) + post, 0);
    const leanTgt = -0.12 - 0.12 * cant - 0.95 * two + (pose.refuse || 0) * 0.35 - rock * 0.5 * (1 - two) + (J >= 0 && J > 0.8 ? 0.25 * jw : 0);
    this.lean += (leanTgt - this.lean) * Math.min(1, dt * 12);
    this.torso.rotation.z = this.lean;
    this.torso.rotation.x = -(pose.roll || 0) * 0.6;
    this.headJ.rotation.z = -this.lean * 0.6 + 0.1;
    // brazos: manos bajas sobre la cruz; en el salto siguen la boca (cesión)
    for (const a of this.arms) {
      a.sh.rotation.z = 0.55 + 0.75 * two;
      a.el.rotation.z = 1.05 - 0.45 * two;
      a.sh.rotation.x = a.s * -0.12;
    }
    for (const l of this.legsR) {
      l.hip.rotation.z = 0.95 + 0.35 * two;
      l.knee.rotation.z = -1.55 - 0.45 * two;
      l.ankle.rotation.z = 0.55 + 0.15 * two;
      l.hip.rotation.x = l.s * 0.12;
    }
    this.legSwing = -0.05 * two;
  }
}
