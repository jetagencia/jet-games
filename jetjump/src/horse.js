// JETJump — caballo y jinete procedurales (v2).
// Tronco, cuello, cabeza y miembros se construyen por barrido de secciones elípticas
// a lo largo de curvas (loft), con proporciones de un caballo de salto de 1,68 m.
// Crin y cola son tarjetas de pelo con alfa. Las patas y la cola son cadenas articuladas.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { footOffsets, DUTY, strideFreq } from './sim.js';

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

function hash3(x, y, z) { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = smooth(x - xi), v = smooth(y - yi), w = smooth(z - zi);
  let r = 0;
  for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) r += hash3(xi + dx, yi + dy, zi + dz) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
  return r;
}

// ---------------------------------------------------------------------------
// Loft: barrido de secciones. Cada estación: { p: centro, t: tangente, w: semiancho (z),
// ht: semialto arriba, hb: semialto abajo, e: exponente de la superelipse, yOff, zOff }
// ---------------------------------------------------------------------------
function loft(stations, around = 28, closeStart = true, closeEnd = true) {
  const N = stations.length;
  const pos = [], uv = [], idx = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) {
    const S = stations[i];
    const t = S.t.clone().normalize();
    let yAxis = up.clone().sub(t.clone().multiplyScalar(up.dot(t)));
    if (yAxis.lengthSq() < 1e-6) yAxis = new THREE.Vector3(1, 0, 0);
    yAxis.normalize();
    const zAxis = new THREE.Vector3().crossVectors(t, yAxis).normalize();
    for (let j = 0; j <= around; j++) {
      const a = (j / around) * TAU;
      const c = Math.cos(a), s = Math.sin(a);
      const e = S.e || 2;
      const cc = Math.sign(c) * Math.pow(Math.abs(c), 2 / e), ss = Math.sign(s) * Math.pow(Math.abs(s), 2 / e);
      const h = ss >= 0 ? S.ht : S.hb;
      const y = ss * h + (S.yOff || 0), z = cc * S.w + (S.zOff || 0);
      const P = S.p.clone().addScaledVector(yAxis, y).addScaledVector(zAxis, z);
      pos.push(P.x, P.y, P.z); uv.push(i / (N - 1) * 3, j / around);
    }
  }
  const row = around + 1;
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < around; j++) {
    const a = i * row + j, b = a + 1, c = a + row, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  if (closeStart) { const c0 = pos.length / 3; const S = stations[0]; pos.push(S.p.x, S.p.y, S.p.z); uv.push(0, 0.5); for (let j = 0; j < around; j++) idx.push(c0, j + 1, j); }
  if (closeEnd) { const c1 = pos.length / 3; const S = stations[N - 1]; pos.push(S.p.x, S.p.y, S.p.z); uv.push(3, 0.5); const b = (N - 1) * row; for (let j = 0; j < around; j++) idx.push(c1, b + j, b + j + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Estaciones a lo largo de una curva Bezier cúbica, con parámetros interpolados por tramos.
function curveStations(p0, p1, p2, p3, params, n = 24) {
  const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = curve.getPoint(t), tg = curve.getTangent(t);
    const k = t * (params.length - 1), i0 = Math.floor(k), i1 = Math.min(params.length - 1, i0 + 1), f = k - i0;
    const A = params[i0], B = params[i1];
    const mix = (key, def = 0) => lerp(A[key] ?? def, B[key] ?? def, smooth(f));
    out.push({ p, t: tg, w: mix('w'), ht: mix('ht'), hb: mix('hb'), e: mix('e', 2), yOff: mix('yOff'), zOff: mix('zOff') });
  }
  return out;
}

function limbGeo(len, r0, r1, bulge = 0.12, seg = 16, flat = 0.78) {
  const pts = [new THREE.Vector2(0.001, 0.0001)];
  const N = 12;
  for (let i = 0; i <= N; i++) { const t = i / N; const r = lerp(r0, r1, t) * (1 + bulge * Math.sin(Math.PI * Math.min(1, t * 1.4))); pts.push(new THREE.Vector2(Math.max(0.001, r), -t * len)); }
  pts.push(new THREE.Vector2(0.001, -len));
  const g = new THREE.LatheGeometry(pts, seg); g.scale(1, 1, flat); g.computeVertexNormals(); return g;
}

function makeJoint(parent, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }

// Pelo corto: rayado fino con dirección dominante, como bump.
function furTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 12000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512, l = 5 + Math.random() * 12, a = 0.25 + (Math.random() - 0.5) * 0.4;
    const v = Math.random() < 0.5 ? 70 : 190;
    g.strokeStyle = `rgba(${v},${v},${v},0.22)`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); return t;
}
// Tarjeta de pelo: mechones verticales con alfa.
function hairTexture(color) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 256);
  const col = new THREE.Color(color);
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * 128, w = 1 + Math.random() * 2.5, len = 150 + Math.random() * 106;
    const k = 0.75 + Math.random() * 0.5;
    g.strokeStyle = `rgba(${Math.round(col.r * 255 * k)},${Math.round(col.g * 255 * k)},${Math.round(col.b * 255 * k)},${0.75 + Math.random() * 0.25})`;
    g.lineWidth = w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (Math.random() - 0.5) * 10, len * 0.4, x + (Math.random() - 0.5) * 20, len * 0.8, x + (Math.random() - 0.5) * 24, len); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function mix5(a, b, t) { return a.map((v, i) => lerp(v, b[i], t)); }

export class HorseModel {
  constructor(look = {}) {
    this.look = { coat: 'bay', blaze: false, socks: [0, 0, 0, 0], boots: 0x1b2340, pad: 0xf4f4f0, ...look };
    const coat = this.coat = COATS[this.look.coat] || COATS.bay;
    this.root = new THREE.Group();
    this.body = new THREE.Group(); this.root.add(this.body);

    const bodyCol = new THREE.Color(coat.body), pointsCol = new THREE.Color(coat.points);
    const fur = furTexture();
    this.coatMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, vertexColors: true, roughness: 0.5, metalness: 0,
      sheen: 1.0, sheenRoughness: 0.35, sheenColor: new THREE.Color(coat.sheen).multiplyScalar(0.5),
      clearcoat: 0.1, clearcoatRoughness: 0.6, bumpMap: fur, bumpScale: 0.003, envMapIntensity: 0.8,
    });
    const legMat = (sock) => new THREE.MeshPhysicalMaterial({ color: sock ? 0xf2efe8 : coat.points, roughness: 0.55, sheen: 0.8, sheenRoughness: 0.4, sheenColor: new THREE.Color(coat.sheen).multiplyScalar(0.35), bumpMap: fur, bumpScale: 0.002 });
    const upperLegMat = new THREE.MeshPhysicalMaterial({ color: bodyCol.clone().lerp(pointsCol, 0.2), roughness: 0.5, sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color(coat.sheen).multiplyScalar(0.45), bumpMap: fur, bumpScale: 0.003 });
    const hoofMat = new THREE.MeshStandardMaterial({ color: 0x2a2421, roughness: 0.4, metalness: 0.05 });
    const bootMat = new THREE.MeshStandardMaterial({ color: this.look.boots, roughness: 0.55 });
    const leather = new THREE.MeshStandardMaterial({ color: 0x2b170c, roughness: 0.38, metalness: 0.05 });
    const steel = new THREE.MeshStandardMaterial({ color: 0xc8c8cc, roughness: 0.25, metalness: 1 });
    const hairMat = new THREE.MeshStandardMaterial({ map: hairTexture(coat.mane), transparent: true, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.8 });
    this.mats = { coat: this.coatMat, hoof: hoofMat, boot: bootMat, leather, steel, hair: hairMat };

    const dapple = !!coat.dapple;
    const paint = (geo, base, opts = {}) => {
      const p = geo.getAttribute('position'), n = p.count, col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        let k = 0.93 + 0.14 * vnoise(x * 5, y * 5, z * 5);
        if (dapple) { const d = vnoise(x * 9 + 3, y * 9, z * 9); k *= d > 0.62 ? 1.1 : d < 0.35 ? 0.88 : 1; }
        let c = base;
        if (opts.belly && y < 1.0) k *= 1.05;
        if (opts.blaze && opts.blaze(x, y, z)) { c = new THREE.Color(0xf2eee6); k = 1; }
        if (opts.muzzle && opts.muzzle(x, y, z)) { c = c.clone().lerp(new THREE.Color(0x3a2a22), 0.6); }
        col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return geo;
    };
    const mesh = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; };

    // ---- TRONCO (de pecho a nalga). Cruz 1.63, grupa 1.62, línea inferior ~0.93.
    const T = [
      { x: 0.86, yc: 1.16, w: 0.10, ht: 0.14, hb: 0.14, e: 2.0 },
      { x: 0.80, yc: 1.18, w: 0.19, ht: 0.30, hb: 0.24, e: 2.1 },
      { x: 0.68, yc: 1.22, w: 0.27, ht: 0.38, hb: 0.28, e: 2.2 },
      { x: 0.52, yc: 1.24, w: 0.31, ht: 0.40, hb: 0.30, e: 2.3 },
      { x: 0.36, yc: 1.25, w: 0.33, ht: 0.37, hb: 0.32, e: 2.3 },
      { x: 0.18, yc: 1.24, w: 0.35, ht: 0.34, hb: 0.33, e: 2.4 },
      { x: 0.00, yc: 1.23, w: 0.355, ht: 0.34, hb: 0.33, e: 2.4 },
      { x: -0.18, yc: 1.23, w: 0.35, ht: 0.35, hb: 0.31, e: 2.3 },
      { x: -0.36, yc: 1.26, w: 0.335, ht: 0.36, hb: 0.27, e: 2.2 },
      { x: -0.52, yc: 1.31, w: 0.32, ht: 0.33, hb: 0.25, e: 2.2 },
      { x: -0.66, yc: 1.34, w: 0.30, ht: 0.29, hb: 0.24, e: 2.1 },
      { x: -0.80, yc: 1.36, w: 0.25, ht: 0.22, hb: 0.20, e: 2.0 },
      { x: -0.90, yc: 1.37, w: 0.17, ht: 0.14, hb: 0.13, e: 2.0 },
      { x: -0.95, yc: 1.38, w: 0.07, ht: 0.06, hb: 0.06, e: 2.0 },
    ];
    this.torsoStations = T;
    const torsoSt = T.map((s, i) => { const a = T[Math.max(i - 1, 0)], b = T[Math.min(i + 1, T.length - 1)]; return { p: new THREE.Vector3(s.x, s.yc, 0), t: new THREE.Vector3(-1, -(b.yc - a.yc) / ((a.x - b.x) || 1), 0), w: s.w, ht: s.ht, hb: s.hb, e: s.e }; });
    this.torso = mesh(paint(loft(torsoSt, 36), bodyCol, { belly: true }), this.coatMat);
    this.body.add(this.torso);
    // masas musculares: paleta, cadera, muslo y brazo
    const bulge = (x, y, z, sx, sy, sz, rz = 0) => { const g = new THREE.SphereGeometry(1, 20, 14); g.scale(sx, sy, sz); g.rotateZ(rz); g.translate(x, y, z); return mesh(paint(g, bodyCol), this.coatMat); };
    for (const s of [-1, 1]) {
      this.body.add(bulge(0.5, 1.24, s * 0.2, 0.2, 0.26, 0.135, 0.35));
      this.body.add(bulge(-0.6, 1.28, s * 0.22, 0.19, 0.2, 0.125, -0.2));
      this.body.add(bulge(-0.6, 1.03, s * 0.19, 0.16, 0.22, 0.1, 0.1));
      this.body.add(bulge(0.55, 1.03, s * 0.16, 0.11, 0.16, 0.085, 0));
    }

    // ---- CUELLO + CABEZA (pivota en la base del cuello)
    this.neck = makeJoint(this.body, 0.62, 1.42, 0);
    const neckSt = curveStations(new THREE.Vector3(-0.1, -0.05, 0), new THREE.Vector3(0.18, 0.08, 0), new THREE.Vector3(0.36, 0.3, 0), new THREE.Vector3(0.54, 0.46, 0),
      [{ w: 0.19, ht: 0.3, hb: 0.26, e: 2.2 }, { w: 0.16, ht: 0.24, hb: 0.2, e: 2.2 }, { w: 0.12, ht: 0.17, hb: 0.14, e: 2.1 }, { w: 0.09, ht: 0.12, hb: 0.1, e: 2.0 }], 18);
    const blazeFn = this.look.blaze ? (x, y) => x > 0.55 && Math.abs(y - (0.47 - (x - 0.55) * 1.0)) < 0.06 : null;
    this.neckMesh = mesh(paint(loft(neckSt, 28), bodyCol), this.coatMat);
    this.neck.add(this.neckMesh);
    const headSt = curveStations(new THREE.Vector3(0.5, 0.5, 0), new THREE.Vector3(0.64, 0.42, 0), new THREE.Vector3(0.82, 0.18, 0), new THREE.Vector3(1.02, -0.03, 0),
      [{ w: 0.095, ht: 0.1, hb: 0.11, e: 2.1 }, { w: 0.105, ht: 0.1, hb: 0.13, e: 2.2 }, { w: 0.08, ht: 0.075, hb: 0.1, e: 2.1 }, { w: 0.064, ht: 0.065, hb: 0.07, e: 2.0 }], 22);
    this.headMesh = mesh(paint(loft(headSt, 24), bodyCol, { blaze: blazeFn, muzzle: (x, y) => x > 0.94 && y < 0.03 }), this.coatMat);
    this.neck.add(this.headMesh);
    for (const s of [-1, 1]) this.neck.add(mesh(paint((() => { const g = new THREE.SphereGeometry(1, 16, 12); g.scale(0.11, 0.095, 0.05); g.rotateZ(0.5); g.translate(0.58, 0.33, s * 0.07); return g; })(), bodyCol), this.coatMat));
    this.neck.add(mesh(paint((() => { const g = new THREE.SphereGeometry(1, 16, 12); g.scale(0.085, 0.07, 0.1); g.translate(0.57, 0.46, 0); return g; })(), bodyCol, { blaze: blazeFn }), this.coatMat));
    const eyeMat = new THREE.MeshPhysicalMaterial({ color: 0x1a0d08, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05 });
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 10), eyeMat); e.position.set(0.63, 0.41, s * 0.095); this.neck.add(e);
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), upperLegMat); lid.position.set(0.63, 0.415, s * 0.093); lid.rotation.x = s * 0.6; this.neck.add(lid);
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshStandardMaterial({ color: 0x120a08, roughness: 0.9 })); n.position.set(0.995, 0.02, s * 0.045); n.scale.set(1, 1.4, 0.7); this.neck.add(n);
    }
    this.ears = [];
    for (const s of [-1, 1]) {
      const ear = new THREE.Group(); ear.position.set(0.5, 0.56, s * 0.055);
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.15, 10), upperLegMat); m.scale.set(1, 1, 0.55); m.position.y = 0.07; m.castShadow = true; ear.add(m);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.11, 8), new THREE.MeshStandardMaterial({ color: 0x2a1a14, roughness: 1 })); inner.scale.set(1, 1, 0.3); inner.position.set(0.012, 0.07, 0); ear.add(inner);
      ear.rotation.z = -0.1; ear.rotation.x = s * 0.25; this.neck.add(ear); this.ears.push(ear);
    }
    this.mane = [];
    for (let i = 0; i < 20; i++) {
      const t = i / 19;
      const pt = neckSt[Math.round(t * (neckSt.length - 1))];
      const strand = new THREE.Group();
      strand.position.set(pt.p.x - 0.01, pt.p.y + pt.ht * 0.9, 0.05);
      const h = 0.28 + 0.12 * Math.sin(Math.PI * t);
      const card = new THREE.Mesh(new THREE.PlaneGeometry(0.12, h), hairMat); card.position.set(0, -h / 2 + 0.03, 0); card.castShadow = true;
      strand.add(card);
      strand.rotation.x = -0.45 - 0.1 * Math.sin(i * 1.7); strand.rotation.z = 0.12 * Math.cos(i) - 0.25;
      this.neck.add(strand); this.mane.push(strand);
    }
    for (let i = 0; i < 2; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.2), hairMat); f.position.set(0.56 + i * 0.03, 0.38, (i - 0.5) * 0.04); f.rotation.set(0, Math.PI / 2 + (i - 0.5) * 0.3, -0.9); this.neck.add(f); }

    const strap = (a, b, w = 0.016) => { const len = a.distanceTo(b); const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.01), leather); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m; };
    for (const s of [-1, 1]) {
      this.neck.add(strap(new THREE.Vector3(0.52, 0.53, s * 0.09), new THREE.Vector3(0.95, 0.04, s * 0.072)));
      this.neck.add(strap(new THREE.Vector3(0.52, 0.53, s * 0.09), new THREE.Vector3(0.52, 0.28, s * 0.105)));
    }
    const nose = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.011, 6, 22), leather); nose.position.set(0.88, 0.1, 0); nose.rotation.set(0, Math.PI / 2, 0.85); nose.scale.set(1, 0.85, 1); this.neck.add(nose);
    const brow = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.01, 6, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.3, metalness: 0.6 })); brow.position.set(0.55, 0.52, 0); brow.rotation.set(0, Math.PI / 2, -0.5); this.neck.add(brow);
    this.bit = new THREE.Object3D(); this.bit.position.set(0.95, 0.01, 0); this.neck.add(this.bit);
    for (const s of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 16), steel); ring.position.set(0.95, 0.01, s * 0.07); this.neck.add(ring); }

    // ---- MONTURA
    this.backY = this.topAt(0.1);
    const saddle = new THREE.Group(); saddle.position.set(0.1, this.backY - 0.01, 0); this.body.add(saddle);
    const padGeo = new THREE.BoxGeometry(0.64, 0.02, 0.66, 1, 1, 10); bendAround(padGeo, 0.4);
    const pad = new THREE.Mesh(padGeo, new THREE.MeshStandardMaterial({ color: this.look.pad, roughness: 0.85 })); pad.position.set(0.02, -0.02, 0); pad.castShadow = true; saddle.add(pad);
    const seatGeo = new THREE.SphereGeometry(0.25, 24, 14); seatGeo.scale(1.2, 0.3, 0.72);
    const seat = new THREE.Mesh(seatGeo, leather); seat.position.set(0, 0.03, 0); seat.castShadow = true; saddle.add(seat);
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), leather); pommel.scale.set(0.8, 0.7, 1.4); pommel.position.set(0.2, 0.08, 0); saddle.add(pommel);
    const cantle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), leather); cantle.scale.set(0.6, 0.9, 1.6); cantle.position.set(-0.23, 0.08, 0); saddle.add(cantle);
    for (const s of [-1, 1]) { const flap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.015), leather); flap.position.set(0.08, -0.17, s * 0.32); flap.rotation.x = s * 0.22; flap.castShadow = true; saddle.add(flap); }
    const girth = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.028, 6, 40), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 })); girth.position.set(0.3, 1.22, 0); girth.scale.set(0.8, 0.86, 0.84); girth.rotation.y = Math.PI / 2; this.body.add(girth);
    this.stirrups = [];
    for (const s of [-1, 1]) {
      const st = new THREE.Group(); st.position.set(0.12, this.backY - 0.1, s * 0.28);
      const ls = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.5, 0.008), leather); ls.position.y = -0.25; st.add(ls);
      const iron = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 6, 14), steel); iron.position.y = -0.52; iron.rotation.y = Math.PI / 2; st.add(iron);
      this.body.add(st); this.stirrups.push(st);
    }

    // ---- PATAS [MA, MD, PA, PD]
    const mkLeg = (front, side, idx) => {
      const low = legMat(this.look.socks[idx]);
      const L = { front, side, idx };
      if (front) {
        L.root = makeJoint(this.body, 0.52, 1.27, side * 0.17);
        L.upper = makeJoint(L.root, 0, 0, 0);
        L.upper.add(mesh(limbGeo(0.26, 0.11, 0.085, 0.08), upperLegMat));
        L.mid = makeJoint(L.upper, 0, -0.245, 0);
        L.mid.add(mesh(limbGeo(0.5, 0.085, 0.046, 0.2, 16, 0.8), upperLegMat));
        const knee = mesh(new THREE.SphereGeometry(0.05, 12, 10), low); knee.scale.set(1.1, 1, 0.85); knee.position.y = -0.5; L.mid.add(knee);
        L.low = makeJoint(L.mid, 0, -0.5, 0);
        L.low.add(mesh(limbGeo(0.3, 0.04, 0.036, 0, 14, 0.75), low));
        const boot = mesh(limbGeo(0.21, 0.05, 0.05, 0, 14, 0.8), bootMat); boot.position.y = -0.06; L.low.add(boot);
        L.fet = makeJoint(L.low, 0, -0.3, 0); L.restP = 0.5;
      } else {
        L.root = makeJoint(this.body, -0.6, 1.36, side * 0.19);
        L.upper = makeJoint(L.root, 0, 0, 0);
        L.upper.add(mesh(limbGeo(0.32, 0.14, 0.1, 0.06), upperLegMat));
        L.mid = makeJoint(L.upper, 0, -0.3, 0);
        L.mid.add(mesh(limbGeo(0.46, 0.1, 0.048, 0.18, 16, 0.8), upperLegMat));
        const hock = mesh(new THREE.SphereGeometry(0.055, 12, 10), upperLegMat); hock.scale.set(1.35, 1, 0.8); hock.position.set(-0.02, -0.46, 0); L.mid.add(hock);
        L.low = makeJoint(L.mid, 0, -0.46, 0);
        L.low.add(mesh(limbGeo(0.36, 0.042, 0.037, 0, 14, 0.75), low));
        const boot = mesh(limbGeo(0.1, 0.05, 0.05, 0, 14, 0.8), bootMat); boot.position.y = -0.24; L.low.add(boot);
        L.fet = makeJoint(L.low, 0, -0.36, 0); L.restP = 0.58;
      }
      const fl = mesh(new THREE.SphereGeometry(0.046, 12, 10), low); fl.scale.set(1, 1, 0.85); L.fet.add(fl);
      L.fet.add(mesh(limbGeo(0.14, 0.036, 0.042, 0, 12), low));
      L.hoofJ = makeJoint(L.fet, 0, -0.14, 0);
      const hoofGeo = new THREE.CylinderGeometry(0.05, 0.066, 0.085, 18); hoofGeo.translate(0.012, -0.0425, 0);
      L.hoofJ.add(mesh(hoofGeo, hoofMat));
      L.hoofTip = new THREE.Object3D(); L.hoofTip.position.y = -0.085; L.hoofJ.add(L.hoofTip);
      return L;
    };
    this.legs = [mkLeg(true, -1, 0), mkLeg(true, 1, 1), mkLeg(false, -1, 2), mkLeg(false, 1, 3)];

    // ---- COLA: cadena articulada con tarjetas de pelo
    this.tail = [];
    let parent = makeJoint(this.body, -0.93, 1.44, 0);
    for (let i = 0; i < 7; i++) {
      const len = 0.12;
      if (i < 2) { const seg = mesh(new THREE.CylinderGeometry(0.045, 0.04, len, 10), upperLegMat); seg.geometry.translate(0, -len / 2, 0); parent.add(seg); }
      for (let k = 0; k < 3; k++) {
        const card = new THREE.Mesh(new THREE.PlaneGeometry(0.12 + i * 0.015, 0.3), hairMat); card.position.y = -0.12; card.rotation.y = k * Math.PI / 3; card.castShadow = true; parent.add(card);
      }
      const j = makeJoint(parent, 0, -len, 0);
      this.tail.push({ seg: parent, j });
      parent = j;
    }
    this.tailState = this.tail.map(() => ({ a: 0, v: 0 }));

    this.reinL = this.makeRein(); this.reinR = this.makeRein(); this.root.add(this.reinL, this.reinR);

    this.rider = new Rider(this.look.rider);
    this.body.add(this.rider.root);
    this.rider.root.position.set(0.08, this.backY + 0.05, 0);

    this.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.t = 0; this.tmpA = new THREE.Vector3(); this.tmpB = new THREE.Vector3(); this.tmpQ = new THREE.Quaternion();
  }

  topAt(x) {
    const T = this.torsoStations;
    for (let i = 0; i < T.length - 1; i++) if (x <= T[i].x && x >= T[i + 1].x) { const f = (T[i].x - x) / (T[i].x - T[i + 1].x); return lerp(T[i].yc + T[i].ht, T[i + 1].yc + T[i + 1].ht, f); }
    return 1.6;
  }

  makeRein() { const g = new THREE.CylinderGeometry(0.007, 0.007, 1, 5); g.translate(0, 0.5, 0); const m = new THREE.Mesh(g, this.mats.leather); m.castShadow = true; return m; }

  update(pose, dt) {
    this.t += dt;
    const w = pose.w, phase = pose.phase, L = pose.L || 3;
    const moving = w[0] + w[1] + w[2] + w[3];
    const still = clamp(1 - moving, 0, 1);
    const p2 = phase * TAU;
    let bob = 0, rock = 0, neckA = 0;
    bob += w[0] * (0.015 * Math.sin(p2 * 2)) + w[1] * (0.045 * Math.cos(p2 * 2)) + w[2] * (0.065 * Math.sin(p2 - 0.6)) + w[3] * (0.07 * Math.sin(p2 - 0.9));
    rock += w[2] * (0.07 * Math.cos(p2 - 0.3)) + w[3] * 0.06 * Math.cos(p2 - 0.5);
    neckA += w[0] * 0.06 * Math.sin(p2 * 2 + 1) + w[1] * 0.02 * Math.sin(p2 * 2) + w[2] * (-0.12 * Math.cos(p2 - 0.2)) + w[3] * (-0.14 * Math.cos(p2 - 0.4));
    const J = pose.jumpT, inJump = J >= 0, jw = pose.jumpW || 0;
    const breathe = Math.sin(this.t * 1.6) * 0.004 * still;
    this.body.position.y = (pose.y - 1.12) * jw + bob * (1 - jw) + breathe;
    this.body.rotation.z = lerp(rock, pose.pitch, jw);
    this.body.rotation.x = pose.roll;

    let neckZ = -0.08 + neckA - 0.1 * w[0] - 0.03 * still + 0.12 * (pose.refuse || 0) - 0.05 * (w[2] + w[3]);
    if (inJump) { const a = J < 0.15 ? lerp(0, -0.28, J / 0.15) : J < 0.6 ? -0.28 - 0.15 * Math.sin((J - 0.15) / 0.45 * Math.PI) : lerp(-0.28, 0.12, (J - 0.6) / 0.4); neckZ = lerp(neckZ, a, jw); }
    if (still > 0.5) neckZ += Math.sin(this.t * 0.4) * 0.05 * still;
    this.neck.rotation.z = neckZ;
    this.neck.rotation.y = clamp(-(pose.omega || 0) * 0.18, -0.25, 0.25);
    const earA = 0.15 + 0.25 * Math.sin(this.t * 0.7 + Math.sin(this.t * 0.31) * 3) * still - 0.3 * (pose.refuse || 0) - 0.15 * jw;
    this.ears[0].rotation.z = -earA; this.ears[1].rotation.z = -earA + 0.1 * Math.sin(this.t * 0.5);

    const gaits = [1, 2, 3, 4];
    for (const leg of this.legs) {
      const rest = leg.front ? [0.04, -0.04, 0, leg.restP, -leg.restP] : [0.3, -0.72, 0.42, leg.restP, -leg.restP];
      const acc = [0, 0, 0, 0, 0]; let wsum = still;
      for (let k = 0; k < 5; k++) acc[k] = rest[k] * still;
      for (let gi = 0; gi < 4; gi++) {
        const ww = w[gi]; if (ww < 0.001) continue;
        const g = gaits[gi], offs = footOffsets(g, pose.lead), duty = DUTY[g];
        const q = ((phase - offs[leg.idx]) % 1 + 1) % 1;
        const pr = this.legPose(leg, q, duty, L, g, rest);
        for (let k = 0; k < 5; k++) acc[k] += pr[k] * ww;
        wsum += ww;
      }
      let a = acc.map(v => v / Math.max(wsum, 1e-4));
      if (inJump && jw > 0) { const jp = this.jumpLegPose(leg, J, rest); a = a.map((v, k) => lerp(v, jp[k], jw)); }
      if (pose.refuse > 0) { const rp = leg.front ? [0.45, 0.1, 0, 0.7, -0.7] : [0.75, -0.95, 0.35, 0.65, -0.65]; a = a.map((v, k) => lerp(v, rp[k], pose.refuse * 0.8)); }
      leg.upper.rotation.z = a[0]; leg.mid.rotation.z = a[1]; leg.low.rotation.z = a[2]; leg.fet.rotation.z = a[3]; leg.hoofJ.rotation.z = a[4];
    }

    const speed = pose.v || 0;
    const lift = clamp(speed / 10, 0, 1) * 0.6 + (inJump ? 0.5 * jw : 0);
    const targetBase = 0.2 + lift * 0.7, yawRate = pose.omega || 0;
    for (let i = 0; i < this.tail.length; i++) {
      const s = this.tailState[i];
      const tgt = (i === 0 ? targetBase : -0.12 * lift) + (i > 1 ? -bob * 2.5 : 0);
      s.v += ((tgt - s.a) * (60 - i * 4) - s.v * 6) * dt; s.a += s.v * dt;
      this.tail[i].seg.rotation.z = (i === 0 ? -0.15 : 0) + s.a * (i === 0 ? 1 : 0.6);
      this.tail[i].seg.rotation.x = yawRate * 0.12 * (i / 8) + Math.sin(this.t * 1.3 + i * 0.6) * 0.03 * still;
    }
    for (let i = 0; i < this.mane.length; i++) {
      const sw = Math.sin(phase * TAU * 2 + i * 0.5) * 0.18 * clamp(speed / 6, 0, 1);
      this.mane[i].rotation.x = -0.45 - 0.1 * Math.sin(i * 1.7) - clamp(speed / 10, 0, 0.5) * 0.6 + sw * 0.5;
      this.mane[i].rotation.z = 0.12 * Math.cos(i) - 0.25 - clamp(speed / 10, 0, 1) * 0.5 + sw;
    }

    this.rider.update(pose, dt, rock, bob);

    this.root.updateMatrixWorld(true);
    const nq = this.neck.getWorldQuaternion(this.tmpQ);
    for (const [rein, s] of [[this.reinL, -1], [this.reinR, 1]]) {
      const hand = this.rider.handWorld(s, this.tmpA);
      this.bit.getWorldPosition(this.tmpB).add(new THREE.Vector3(0, 0, s * 0.07).applyQuaternion(nq));
      this.root.worldToLocal(hand); this.root.worldToLocal(this.tmpB);
      const d = this.tmpB.clone().sub(hand);
      rein.position.copy(hand); rein.scale.set(1, d.length(), 1);
      rein.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    }
    for (let i = 0; i < 2; i++) this.stirrups[i].rotation.z = this.rider.legSwing * 0.6;
  }

  legPose(leg, q, duty, L, g, rest) {
    const front = leg.front, len = front ? 1.2 : 1.25;
    const A = clamp(duty * L * 0.5, 0.05, 0.85);
    const flexAmp = [0, 0.55, 0.95, 0.9, 1.05][g];
    let x, lift = 0, load = 0;
    if (q < duty) { const s = q / duty; x = lerp(A, -A, s); load = Math.sin(Math.PI * s); }
    else { const s = (q - duty) / (1 - duty); x = lerp(-A, A, smooth(s)); lift = Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.15)), 1.1); if (s > 0.85) lift *= (1 - (s - 0.85) / 0.15) * 0.6 + 0.4 * (1 - (s - 0.85) / 0.15); }
    const ang = Math.atan2(x, len), k = lift * flexAmp;
    if (front) return [rest[0] + ang * 0.55 + k * 0.35, rest[1] + ang * 0.45 + k * 0.55, rest[2] - k * 1.7, rest[3] + load * 0.28 - k * 0.9, rest[4] - load * 0.2 + k * 0.25];
    return [rest[0] + ang * 0.75 + k * 0.45, rest[1] - k * 0.55 + ang * 0.15, rest[2] + k * 1.0 - ang * 0.2, rest[3] + load * 0.3 - k * 0.8, rest[4] - load * 0.2 + k * 0.2];
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

function bendAround(geo, r) {
  const p = geo.getAttribute('position');
  for (let i = 0; i < p.count; i++) { const z = p.getZ(i), a = z / r; p.setY(i, p.getY(i) + (Math.cos(a) - 1) * r); p.setZ(i, Math.sin(a) * r); }
  geo.computeVertexNormals();
}

// ---------------------------------------------------------------------------
export class Rider {
  constructor(look = {}) {
    this.look = { jacket: 0x14204a, breeches: 0xf5f3ee, helmet: 0x101418, skin: 0xd9a27e, collar: 0xffffff, hair: 0x3a2518, ...look };
    const M = (c, r = 0.6, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
    const jacket = new THREE.MeshPhysicalMaterial({ color: this.look.jacket, roughness: 0.7, sheen: 0.5, sheenColor: 0x8899cc });
    const breeches = M(this.look.breeches, 0.75);
    const boots = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.15 });
    const helmet = new THREE.MeshPhysicalMaterial({ color: this.look.helmet, roughness: 0.3, clearcoat: 0.7 });
    const skin = M(this.look.skin, 0.65);
    const gloves = M(0x1a1a1a, 0.6);
    const cap = (r, len, mat, sx = 1, sz = 1) => { const g = new THREE.CapsuleGeometry(r, len, 6, 14); g.translate(0, -len / 2 - r * 0.2, 0); g.scale(sx, 1, sz); const m = new THREE.Mesh(g, mat); m.castShadow = true; return m; };

    this.root = new THREE.Group();
    this.pelvis = new THREE.Group(); this.root.add(this.pelvis);
    const hips = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), breeches); hips.scale.set(1.0, 0.7, 1.2); hips.castShadow = true; this.pelvis.add(hips);
    this.torso = new THREE.Group(); this.torso.position.y = 0.05; this.pelvis.add(this.torso);
    const chestGeo = new THREE.CapsuleGeometry(0.14, 0.3, 8, 16); chestGeo.translate(0, 0.3, 0);
    { const p = chestGeo.getAttribute('position'); for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 0.82 + 0.4 * clamp((y - 0.1) / 0.4, 0, 1); p.setZ(i, p.getZ(i) * k); p.setX(i, p.getX(i) * (0.78 + 0.1 * clamp((y - 0.1) / 0.4, 0, 1))); } chestGeo.computeVertexNormals(); }
    const chest = new THREE.Mesh(chestGeo, jacket); chest.castShadow = true; this.torso.add(chest);
    const tailsMat = jacket.clone(); tailsMat.side = THREE.DoubleSide;
    const tails = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.18, 16, 1, true), tailsMat); tails.position.set(-0.03, 0.02, 0); this.torso.add(tails);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.07, 0.06, 12), M(this.look.collar, 0.5)); collar.position.y = 0.6; this.torso.add(collar);
    const bib = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.16), M(0xffffff, 0.6)); bib.position.set(0.15, 0.42, 0); bib.rotation.y = Math.PI / 2; this.torso.add(bib);
    this.headJ = new THREE.Group(); this.headJ.position.y = 0.62; this.torso.add(this.headJ);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.098, 18, 14), skin); head.scale.set(1.0, 1.18, 0.92); head.position.y = 0.1; head.castShadow = true; this.headJ.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), M(this.look.hair, 0.9)); hair.position.set(-0.01, 0.11, 0); hair.scale.set(1.02, 1.1, 0.95); this.headJ.add(hair);
    const hel = new THREE.Mesh(new THREE.SphereGeometry(0.118, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), helmet); hel.position.y = 0.135; hel.scale.set(1, 0.95, 1.02); hel.castShadow = true; this.headJ.add(hel);
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.01, 18, 1, false, -1.0, 2.0), helmet); visor.position.set(0.035, 0.125, 0); visor.rotation.z = -0.3; this.headJ.add(visor);
    const strapH = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.006, 6, 20, Math.PI), M(0x111111)); strapH.position.set(0, 0.09, 0); strapH.rotation.set(0, Math.PI / 2, Math.PI); this.headJ.add(strapH);
    this.eyeCam = new THREE.Object3D(); this.eyeCam.position.set(0.1, 0.12, 0); this.headJ.add(this.eyeCam);

    this.arms = []; this.legsR = [];
    for (const s of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(0.0, 0.5, s * 0.2); this.torso.add(sh);
      sh.add(cap(0.05, 0.22, jacket));
      const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
      el.add(cap(0.042, 0.2, jacket));
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), gloves); hand.position.y = -0.29; hand.scale.set(1, 1.2, 0.8); el.add(hand);
      const handPt = new THREE.Object3D(); handPt.position.y = -0.3; el.add(handPt);
      this.arms.push({ sh, el, handPt, s });
      const hip = new THREE.Group(); hip.position.set(0.02, -0.02, s * 0.12); this.pelvis.add(hip);
      hip.add(cap(0.075, 0.32, breeches, 1, 0.9));
      const knee = new THREE.Group(); knee.position.y = -0.44; hip.add(knee);
      knee.add(cap(0.056, 0.32, boots));
      const kneePad = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), breeches); knee.add(kneePad);
      const ankle = new THREE.Group(); ankle.position.y = -0.43; knee.add(ankle);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.08), boots); foot.position.set(0.06, -0.02, 0); ankle.add(foot);
      this.legsR.push({ hip, knee, ankle, s });
    }
    this.lean = 0; this.legSwing = 0; this.seatV = 0; this.seatY = 0;
  }

  handWorld(s, out) { return this.arms[s < 0 ? 0 : 1].handPt.getWorldPosition(out); }

  update(pose, dt, rock, bob) {
    const J = pose.jumpT, jw = pose.jumpW || 0;
    let two = 0;
    if (J >= 0) two = J < 0.1 ? J / 0.1 : J < 0.75 ? 1 : 1 - (J - 0.75) / 0.25 * 0.7;
    two = Math.max(two * jw, pose.approachTwo || 0);
    const w = pose.w, cant = w[2] + w[3];
    const tgt = -bob * 0.6;
    this.seatV += ((tgt - this.seatY) * 140 - this.seatV * 14) * dt; this.seatY += this.seatV * dt;
    const post = w[1] * Math.max(0, Math.sin(pose.phase * Math.PI * 4)) * 0.07;
    this.pelvis.position.set(-0.06 * two, 0.11 * two + this.seatY * (1 - two) + post, 0);
    const leanTgt = -0.12 - 0.12 * cant - 0.95 * two + (pose.refuse || 0) * 0.35 - rock * 0.5 * (1 - two) + (J >= 0 && J > 0.8 ? 0.25 * jw : 0);
    this.lean += (leanTgt - this.lean) * Math.min(1, dt * 12);
    this.torso.rotation.z = this.lean; this.torso.rotation.x = -(pose.roll || 0) * 0.6;
    this.headJ.rotation.z = -this.lean * 0.6 + 0.1;
    for (const a of this.arms) { a.sh.rotation.z = 0.55 + 0.75 * two; a.el.rotation.z = 1.05 - 0.45 * two; a.sh.rotation.x = a.s * -0.12; }
    for (const l of this.legsR) { l.hip.rotation.z = 0.95 + 0.35 * two; l.knee.rotation.z = -1.55 - 0.45 * two; l.ankle.rotation.z = 0.55 + 0.15 * two; l.hip.rotation.x = l.s * 0.12; }
    this.legSwing = -0.05 * two;
  }
}


// ---------------------------------------------------------------------------
// Caballo desde un GLB con esqueleto o morphs (modelo externo con licencia).
// Misma interfaz que HorseModel. Clips por nombre: idle / walk / trot / canter / gallop / jump.
// ---------------------------------------------------------------------------
const gltfCache = new Map();
export function loadHorseAsset(url) {
  if (!gltfCache.has(url)) gltfCache.set(url, new Promise((res) => new GLTFLoader().load(url, (g) => res(g), undefined, () => res(null))));
  return gltfCache.get(url);
}

export class HorseGLB {
  constructor(gltf, look = {}, cfg = {}) {
    this.look = look; this.isAsset = true;
    this.root = new THREE.Group(); this.body = new THREE.Group(); this.root.add(this.body);
    const model = this.model = gltf.scene;
    // orientar: glTF mira +Z por convención; el juego mira +X
    model.rotation.y = cfg.yaw ?? -Math.PI / 2;
    model.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = (cfg.height ?? 1.95) / Math.max(size.y, 1e-3);
    model.scale.setScalar(scale); model.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x + (cfg.offsetX ?? 0.05), -box.min.y, -c.z);
    const coat = COATS[look.coat] || COATS.bay;
    const smooth = cfg.smooth ?? true;
    const fur = furTexture();
    const bodyCol = new THREE.Color(coat.body), maneCol = new THREE.Color(coat.mane), pointsCol = new THREE.Color(coat.points);
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      if (!smooth) { if (o.material) o.material.envMapIntensity = 0.8; return; }
      // zonas de color: leer la paleta original por UV para distinguir crin/cola/cascos del cuerpo
      const srcMap = o.material && o.material.map;
      let sample = null;
      if (srcMap && srcMap.image && srcMap.image.width) {
        try { const c = document.createElement('canvas'); c.width = srcMap.image.width; c.height = srcMap.image.height; const g = c.getContext('2d'); g.drawImage(srcMap.image, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; sample = (u, v) => { const x = Math.min(c.width - 1, Math.max(0, Math.floor((u % 1 + 1) % 1 * c.width))), y = Math.min(c.height - 1, Math.max(0, Math.floor((1 - (v % 1 + 1) % 1) * c.height))); const i = (y * c.width + x) * 4; return (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255; }; } catch { sample = null; }
      }
      let geo = o.geometry;
      try { geo = BufferGeometryUtils.mergeVertices(geo, 1e-4); geo.computeVertexNormals(); } catch { /* geometría no fusionable */ }
      const pos = geo.getAttribute('position'), uv = geo.getAttribute('uv'), n = pos.count, col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        let c = bodyCol;
        if (sample && uv) { const l = sample(uv.getX(i), uv.getY(i)); if (l < 0.22) c = maneCol; else if (l < 0.4) c = pointsCol; }
        const k = 0.94 + 0.12 * vnoise(pos.getX(i) * 3, pos.getY(i) * 3, pos.getZ(i) * 3);
        col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      o.geometry = geo;
      o.material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.5, sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color(coat.sheen).multiplyScalar(0.5), clearcoat: 0.1, clearcoatRoughness: 0.6, bumpMap: fur, bumpScale: 0.004, envMapIntensity: 0.8 });
    });
    this.body.add(model);
    model.updateMatrixWorld(true);
    const bone = (re) => { let b = null; model.traverse((o) => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; };
    this.seatBone = bone(/spine_?3|spine_?4|spine\.?003/i);
    this.mouthBone = bone(/mouth|jaw|nose|head/i);
    const hoofNames = [/front.*foot.*l|front.*hoof.*l|foot_?l$|hoof_?l$/i, /front.*foot.*r|front.*hoof.*r/i, /back.*foot.*l|hind.*foot.*l|back.*hoof.*l/i, /back.*foot.*r|hind.*foot.*r|back.*hoof.*r/i];
    this.hooves = hoofNames.map((re) => bone(re)).filter(Boolean);
    // montura y cincha que siguen al lomo
    const leather = new THREE.MeshStandardMaterial({ color: 0x2b170c, roughness: 0.38, metalness: 0.05 });
    const steel = new THREE.MeshStandardMaterial({ color: 0xc8c8cc, roughness: 0.25, metalness: 1 });
    this.tack = new THREE.Group(); this.body.add(this.tack);
    const padGeo = new THREE.BoxGeometry(0.64, 0.02, 0.66, 1, 1, 10); bendAround(padGeo, 0.4);
    const pad = new THREE.Mesh(padGeo, new THREE.MeshStandardMaterial({ color: look.pad ?? 0xf4f4f0, roughness: 0.85 })); pad.position.set(0.02, -0.02, 0); pad.castShadow = true; this.tack.add(pad);
    const seatGeo = new THREE.SphereGeometry(0.25, 24, 14); seatGeo.scale(1.2, 0.3, 0.72);
    const seat = new THREE.Mesh(seatGeo, leather); seat.position.set(0, 0.03, 0); seat.castShadow = true; this.tack.add(seat);
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), leather); pommel.scale.set(0.8, 0.7, 1.4); pommel.position.set(0.2, 0.08, 0); this.tack.add(pommel);
    const cantle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), leather); cantle.scale.set(0.6, 0.9, 1.6); cantle.position.set(-0.23, 0.08, 0); this.tack.add(cantle);
    for (const sd of [-1, 1]) { const flap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.015), leather); flap.position.set(0.08, -0.17, sd * 0.32); flap.rotation.x = sd * 0.22; flap.castShadow = true; this.tack.add(flap); }
    const girth = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.028, 6, 40), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 })); girth.position.set(0.12, -0.42, 0); girth.scale.set(0.8, 0.86, 0.84); girth.rotation.y = Math.PI / 2; this.tack.add(girth);
    this.stirrups = [];
    for (const sd of [-1, 1]) { const st = new THREE.Group(); st.position.set(0.12, -0.08, sd * 0.28); const ls = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.5, 0.008), leather); ls.position.y = -0.25; st.add(ls); const iron = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 6, 14), steel); iron.position.y = -0.52; iron.rotation.y = Math.PI / 2; st.add(iron); this.tack.add(st); this.stirrups.push(st); }
    this.reinL = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 1, 5).translate(0, 0.5, 0), leather); this.reinR = this.reinL.clone(); this.root.add(this.reinL, this.reinR);
    this.tmpA = new THREE.Vector3(); this.tmpB = new THREE.Vector3(); this.tmpQ = new THREE.Quaternion();
    this.mixer = new THREE.AnimationMixer(model);
    const clips = gltf.animations || [];
    const find = (re) => clips.find((k) => re.test(k.name));
    const any = clips[0] || null;
    this.clips = {
      idle: find(/idle|stand|breath|rest/i) || null,
      walk: find(/walk/i) || any, trot: find(/trot/i) || find(/walk/i) || any,
      canter: find(/canter/i) || find(/run|gallop/i) || any, gallop: find(/gallop|run/i) || find(/canter/i) || any,
      jump: find(/jump|leap/i) || null,
    };
    this.actions = {};
    for (const [k, clip] of Object.entries(this.clips)) if (clip) { const a = this.mixer.clipAction(clip); a.play(); a.setEffectiveWeight(0); a.enabled = true; this.actions[k] = a; }
    this.hooves = [];
    model.traverse((o) => { if (o.isBone && /hoof|foot|toe/i.test(o.name)) this.hooves.push(o); });
    const top = box.max.y;
    this.backY = top * 0.86;
    this.rider = new Rider(look.rider);
    this.body.add(this.rider.root);
    this.rider.root.position.set(0.08, this.backY + 0.05, 0);
    this.followSeat();
    this.t = 0; this.tmp = new THREE.Vector3();
  }
  update(pose, dt) {
    this.t += dt;
    const w = pose.w, jw = pose.jumpW || 0;
    const still = clamp(1 - (w[0] + w[1] + w[2] + w[3]), 0, 1);
    const A = this.actions, C = this.clips;
    const set = (k, weight, time) => { const a = A[k]; if (!a) return; a.setEffectiveWeight(weight); if (time != null && C[k]) a.time = (time % 1) * C[k].duration; };
    const ph = pose.phase;
    set('idle', still * (1 - jw), (this.t * 0.25) % 1);
    set('walk', w[0] * (1 - jw), ph); set('trot', w[1] * (1 - jw), ph); set('canter', w[2] * (1 - jw), ph); set('gallop', w[3] * (1 - jw), ph);
    if (A.jump) set('jump', jw, pose.jumpT >= 0 ? pose.jumpT : 0);
    else if (A.canter) { const a = A.canter; a.setEffectiveWeight(Math.max(a.getEffectiveWeight(), jw)); }
    // si varios clips comparten el mismo clip, el peso se acumula: normalizar
    let sum = 0; for (const k in A) sum += A[k].getEffectiveWeight();
    if (sum > 1.001) for (const k in A) A[k].setEffectiveWeight(A[k].getEffectiveWeight() / sum);
    this.mixer.update(0);
    this.body.position.y = (pose.y - 1.12) * jw;
    this.body.rotation.z = pose.pitch * jw;
    this.body.rotation.x = pose.roll;
    this.followSeat();
    this.rider.update(pose, dt, 0, 0);
    this.root.updateMatrixWorld(true);
    if (this.mouthBone) {
      for (const [rein, sd] of [[this.reinL, -1], [this.reinR, 1]]) {
        const hand = this.rider.handWorld(sd, this.tmpA);
        this.mouthBone.getWorldPosition(this.tmpB).add(new THREE.Vector3(0, 0, sd * 0.07).applyQuaternion(this.root.getWorldQuaternion(this.tmpQ)));
        this.root.worldToLocal(hand); this.root.worldToLocal(this.tmpB);
        const d = this.tmpB.clone().sub(hand);
        rein.position.copy(hand); rein.scale.set(1, d.length(), 1);
        rein.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      }
    }
  }
  followSeat() {
    if (!this.seatBone) return;
    this.model.updateMatrixWorld(true);
    const wp = this.seatBone.getWorldPosition(this.tmpA); this.body.worldToLocal(wp);
    if (this.restSeat == null) {
      // medir el lomo en reposo: tope de la malla sobre el hueso del asiento
      this.restSeat = wp.clone();
      let top = -Infinity;
      this.model.traverse((o) => { if (!o.isMesh) return; const pz = o.geometry.getAttribute('position'); const v = new THREE.Vector3(); for (let i = 0; i < pz.count; i += 2) { v.fromBufferAttribute(pz, i); o.localToWorld(v); this.body.worldToLocal(v); if (Math.abs(v.x - wp.x) < 0.12 && Math.abs(v.z) < 0.08) top = Math.max(top, v.y); } });
      this.backTop = top > -Infinity ? top : wp.y + 0.12;
    }
    const dy = wp.y - this.restSeat.y, dx = wp.x - this.restSeat.x;
    this.tack.position.set(this.restSeat.x + 0.04 + dx, this.backTop - 0.03 + dy, 0);
    this.rider.root.position.set(this.restSeat.x + 0.08 + dx, this.backTop + 0.03 + dy, 0);
  }
  hoofWorld(i, out) {
    if (this.hooves.length >= 4) return this.hooves[i].getWorldPosition(out);
    const sx = i < 2 ? 0.45 : -0.6, sz = (i % 2 ? 1 : -1) * 0.18;
    return this.root.localToWorld(out.set(sx, 0.02, sz));
  }
}
