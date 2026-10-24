// Monedas sueltas por el pueblo: se recogen caminando sobre ellas y reaparecen a los cinco minutos.
// Hora de recogida de cada una se guarda en la partida (recargar la página no las devuelve).
// Diseño propio: moneda de oro con borde alto, perlas, rayos y un huevo agrietado en relieve (el relieve sale de un mapa de alturas
// dibujado en un canvas), canto estriado, brillo, destello que parpadea y una lluvia de chispas al recogerla.
import * as THREE from '../vendor/three.module.js';
import { mergeGeometries } from '../vendor/addons/utils/BufferGeometryUtils.js';
import { resolveCircle } from './world.js';
import * as G from './state.js';

// [x, z, valor]
const SPOTS = [
  [3.2, 3.0, 5], [-3.4, 3.4, 5], [3.8, -3.2, 5], [-3.0, -3.6, 5], [7.4, 0.2, 5], [-7.2, -0.4, 5], [0.4, 7.4, 5], [0.6, -7.6, 5],
  [0.5, -13, 5], [-1.0, -17, 10], [0.8, 13, 5], [-1.0, 17, 5], [-13, 1.0, 5], [-17, -1.0, 5], [13, -1.0, 5], [17, 1.2, 5],
  [25, 0.4, 5], [31, -0.4, 5], [37, 0.3, 5], [43, -0.4, 5], [49, 0.4, 5], [55, 0, 10],
  [-9, -10, 5], [9, 10, 5], [-11, 12, 5], [11, -12, 5], [-20, 9, 10], [-18, -12, 10], [20, -14, 5], [16, 14, 5],
  [-28, 3.2, 10], [-33.5, -3.4, 10],                   // gimnasio
  [-4.4, 27.9, 10], [5.2, 28.0, 5], [18, 27.9, 10],    // tienda y enfermería
  [0, -24, 10], [-6, -28, 5], [6, -28, 5],             // cerca de la zona de pelea
];

const R = 0.36, T = 0.09;          // radio y grosor de la moneda (m)
const FACE = 256;                  // lado de las texturas de la cara
const RESPAWN_MS = 300000;         // reaparece a los 5 minutos reales
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
const CRACK = [[-0.27, -0.02], [-0.15, 0.06], [-0.07, -0.06], [0.04, 0.07], [0.13, -0.05], [0.27, 0.03]];   // grieta del huevo

// altura (0..1) de la cara en el punto (x, y) de -1 a 1: campo hundido, borde alto, perlas, rayos y huevo agrietado
function heightAt(x, y) {
  const r = Math.hypot(x, y), a = Math.atan2(y, x);
  if (r >= 1) return 0.9;
  let h = 0.36;
  h = Math.max(h, 0.95 * smooth(0.86, 0.91, r));                                              // borde alto
  const N = 40, f = ((((a / (2 * Math.PI)) * N) % 1) + 1) % 1 - 0.5, bd = Math.hypot(f * 2 * Math.PI * 0.79 / N, r - 0.79);
  h = Math.max(h, 0.82 * (1 - smooth(0.02, 0.042, bd)));                                      // anillo de perlas
  const k = ((((a / (2 * Math.PI)) * 16) % 1) + 1) % 1 - 0.5;
  if (r > 0.6 && r < 0.72) h = Math.max(h, 0.64 * (1 - smooth(0.05, 0.12, Math.abs(k))) * smooth(0.6, 0.63, r) * (1 - smooth(0.69, 0.72, r)));   // 16 rayos
  const ey = y + 0.04, w = 0.27 * (1 + 0.26 * ey / 0.36), e = Math.hypot(x / w, ey / 0.36);   // huevo: más estrecho arriba
  const egg = 1 - smooth(0.9, 1.0, e);
  if (egg > 0) {
    let cd = 9; for (let i = 0; i < CRACK.length - 1; i++) cd = Math.min(cd, segDist(x, y, CRACK[i][0], CRACK[i][1], CRACK[i + 1][0], CRACK[i + 1][1]));
    const he = (0.66 + 0.3 * (1 - e * e)) * (1 - 0.8 * (1 - smooth(0.012, 0.034, cd)));
    h = h * (1 - egg) + he * egg;
  }
  return h;
}

function makeFaceTextures() {
  const H = new Float32Array(FACE * FACE);
  for (let j = 0; j < FACE; j++) for (let i = 0; i < FACE; i++) H[j * FACE + i] = heightAt(((i + 0.5) / FACE) * 2 - 1, ((j + 0.5) / FACE) * 2 - 1);
  const at = (i, j) => H[Math.min(FACE - 1, Math.max(0, j)) * FACE + Math.min(FACE - 1, Math.max(0, i))];
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = FACE; return c; };
  const cc = mk(), nc = mk(), cg = cc.getContext('2d'), ng = nc.getContext('2d');
  const ci = cg.createImageData(FACE, FACE), ni = ng.createImageData(FACE, FACE);
  for (let j = 0; j < FACE; j++) for (let i = 0; i < FACE; i++) {
    const h = at(i, j), o = (j * FACE + i) * 4;
    // normal: el eje Y de la textura mira hacia arriba, el del canvas hacia abajo
    let nx = -(at(i + 1, j) - at(i - 1, j)) * 5.5, ny = (at(i, j + 1) - at(i, j - 1)) * 5.5, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    ni.data[o] = (nx * 0.5 + 0.5) * 255; ni.data[o + 1] = (ny * 0.5 + 0.5) * 255; ni.data[o + 2] = (nz * 0.5 + 0.5) * 255; ni.data[o + 3] = 255;
    // color: oro oscuro en el fondo y claro en lo alto, con un poco de grano y el borde más oscuro
    const x = ((i + 0.5) / FACE) * 2 - 1, y = ((j + 0.5) / FACE) * 2 - 1, r = Math.hypot(x, y), t = smooth(0.3, 0.95, h);
    const grain = 1 + (Math.sin(i * 12.9898 + j * 78.233) * 43758.5453 % 1) * 0.05;
    const v = (0.9 + 0.1 * (1 - r)) * grain;
    ci.data[o] = Math.min(255, (208 + 60 * t) * v); ci.data[o + 1] = Math.min(255, (142 + 112 * t) * v); ci.data[o + 2] = Math.min(255, (38 + 74 * t) * v); ci.data[o + 3] = 255;
  }
  cg.putImageData(ci, 0, 0); ng.putImageData(ni, 0, 0);
  const col = new THREE.CanvasTexture(cc), nor = new THREE.CanvasTexture(nc);
  col.colorSpace = THREE.SRGBColorSpace; col.anisotropy = 4; nor.anisotropy = 4;
  for (const t of [col, nor]) { t.center.set(0.5, 0.5); t.rotation = -Math.PI / 2; }   // la cara de un cilindro vuelto de canto trae la textura girada 90°
  return { col, nor };
}
function makeEdgeNormal() {   // canto estriado: 64 acanaladuras verticales
  const c = document.createElement('canvas'); c.width = 256; c.height = 4; const g = c.getContext('2d'), im = g.createImageData(256, 4);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 256; i++) { const o = (j * 256 + i) * 4, s = -Math.cos((i / 256) * Math.PI * 2 * 64) * 0.7, l = Math.hypot(s, 1); im.data[o] = (s / l * 0.5 + 0.5) * 255; im.data[o + 1] = 128; im.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; im.data[o + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; return t;
}
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,214,110,.75)'); gr.addColorStop(0.35, 'rgba(255,190,60,.32)'); gr.addColorStop(1, 'rgba(255,170,40,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}
function starTexture() {   // destello de cuatro puntas
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.translate(64, 64); g.fillStyle = '#fff6c8';
  g.beginPath(); for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4, rr = k % 2 ? 9 : 62; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill();
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 26); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fill();
  return new THREE.CanvasTexture(c);
}

const easeOutBack = (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
const IDQ = new THREE.Quaternion();

export class Coins {
  constructor(scene, world, onCollect) {
    this.onCollect = onCollect;
    this.items = [];
    const pos = { x: 0, z: 0 };
    for (const [x, z, v] of SPOTS) { // si la posición cae sobre algo sólido, se corre; si hay que moverla mucho, se descarta
      pos.x = x; pos.z = z; resolveCircle(pos, 0.5, world.colliders);
      if (Math.hypot(pos.x - x, pos.z - z) > 0.8) continue;
      this.items.push({ x: pos.x, z: pos.z, v, key: `${x},${z}`, state: 'idle', pop: 1, tk: 0, ph: Math.random() * 6 });
    }
    const n = this.items.length, { col, nor } = makeFaceTextures();
    const gold = (o) => new THREE.MeshStandardMaterial({ metalness: 1, envMapIntensity: 1.5, ...o });
    const faceMat = gold({ color: 0xffffff, map: col, normalMap: nor, normalScale: new THREE.Vector2(1.5, 1.5), metalness: 0.7, roughness: 0.42, envMapIntensity: 1.15, emissive: 0xffffff, emissiveMap: col, emissiveIntensity: 0.14 });
    const edgeMat = gold({ color: 0xd9a22a, normalMap: makeEdgeNormal(), normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.42, emissive: 0x6a4207, emissiveIntensity: 0.35 });
    const rimMat = gold({ color: 0xffd86a, roughness: 0.22, emissive: 0x7a5008, emissiveIntensity: 0.3 });
    const body = new THREE.CylinderGeometry(R, R, T, 56, 1); body.rotateX(Math.PI / 2);          // grupos: canto, cara, reverso
    const tor = (z) => { const t = new THREE.TorusGeometry(R * 0.945, 0.017, 8, 56); t.translate(0, 0, z); return t; };
    const rims = mergeGeometries([tor(T / 2), tor(-T / 2)], false);
    this.body = new THREE.InstancedMesh(body, [edgeMat, faceMat, faceMat], n);
    this.rims = new THREE.InstancedMesh(rims, rimMat, n);
    const glowMat = new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, opacity: 0.8 });
    this.glow = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), glowMat, n); this.glow.renderOrder = 2;
    const starMat = new THREE.MeshBasicMaterial({ map: starTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.star = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), starMat, n); this.star.renderOrder = 3;
    const rich = new THREE.Color(1, 0.8, 0.52), plain = new THREE.Color(1, 1, 1);
    this.items.forEach((c, i) => { this.body.setColorAt(i, c.v >= 10 ? rich : plain); this.rims.setColorAt(i, c.v >= 10 ? rich : plain); });
    this.body.castShadow = this.rims.castShadow = true;
    // chispas al recoger una moneda
    const NS = 192; this.NS = NS;
    this.sp = { pos: new Float32Array(NS * 3), vel: new Float32Array(NS * 3), age: new Float32Array(NS).fill(9), life: new Float32Array(NS).fill(1), a: new Float32Array(NS).fill(1), next: 0 };
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(this.sp.pos, 3)); sg.setAttribute('aLife', new THREE.BufferAttribute(this.sp.a, 1));
    this.uPx = { value: 600 };
    const sm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uPx: this.uPx },
      vertexShader: 'attribute float aLife; uniform float uPx; varying float vL; void main(){ vL = aLife; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = 0.3 * (1.0 - aLife * 0.6) * uPx / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vL; void main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; float d = length(p); float core = smoothstep(1.0, 0.0, d); float star = max(0.0, 1.0 - abs(p.x * p.y) * 7.0) * smoothstep(1.0, 0.15, d); float a = (core * 0.55 + star * 0.7) * (1.0 - vL); gl_FragColor = vec4(vec3(1.0, 0.82, 0.3) * a, 1.0); }',
    });
    this.sparks = new THREE.Points(sg, sm); this.sparks.frustumCulled = false; this.sparks.renderOrder = 4;
    this.mesh = new THREE.Group(); this.mesh.add(this.body, this.rims, this.glow, this.star, this.sparks);
    for (const o of [this.body, this.rims, this.glow, this.star]) o.frustumCulled = false;
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.q2 = new THREE.Quaternion(); this.qr = new THREE.Quaternion(); this.s = new THREE.Vector3(); this.p = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0); this.zax = new THREE.Vector3(0, 0, 1); this.right = new THREE.Vector3(); this.vup = new THREE.Vector3(); this.p2 = new THREE.Vector3();
    scene.add(this.mesh);
    this.update(0, 0, null, null);
  }

  burst(c) {   // lluvia de chispas desde la moneda
    const sp = this.sp;
    for (let k = 0; k < 18; k++) {
      const i = sp.next; sp.next = (sp.next + 1) % this.NS;
      const a = Math.random() * Math.PI * 2, s = 1.2 + Math.random() * 2.2;
      sp.pos[i * 3] = c.x; sp.pos[i * 3 + 1] = 0.9; sp.pos[i * 3 + 2] = c.z;
      sp.vel[i * 3] = Math.cos(a) * s; sp.vel[i * 3 + 1] = 1.6 + Math.random() * 2.4; sp.vel[i * 3 + 2] = Math.sin(a) * s;
      sp.age[i] = 0; sp.life[i] = 0.45 + Math.random() * 0.4;
    }
  }

  update(dt, t, pp, cam) {
    const now = Date.now(), taken = G.coinTaken(), cq = cam ? cam.quaternion : IDQ;
    this.right.set(1, 0, 0).applyQuaternion(cq); this.vup.set(0, 1, 0).applyQuaternion(cq);
    this.items.forEach((c, i) => {
      if (c.state !== 'taking') {
        const free = !taken[c.key] || now - taken[c.key] >= RESPAWN_MS;
        if (free && c.state === 'gone') { c.state = 'idle'; c.pop = 0; }          // reaparece con un rebote
        else if (!free && c.state === 'idle') c.state = 'gone';                    // la recogió otra pestaña, o ya estaba recogida
        if (c.state === 'idle' && pp && Math.hypot(pp.x - c.x, pp.z - c.z) < 0.95) { c.state = 'taking'; c.tk = 0; taken[c.key] = now; this.onCollect(c.v); this.burst(c); }
      }
      const big = c.v >= 10 ? 1.28 : 1;
      let sc = 0, y = 0.82 + Math.sin(t * 2.2 + c.ph) * 0.1, spin = t * 2.4 + c.ph, ga = 1;
      if (c.state === 'idle') { c.pop = Math.min(1, c.pop + dt / 0.42); sc = easeOutBack(c.pop); }
      else if (c.state === 'taking') {   // sube girando, se agranda un instante y desaparece
        c.tk += dt; const u = Math.min(1, c.tk / 0.34);
        sc = (1 + 0.4 * Math.sin(u * Math.PI)) * (1 - u * u); y += u * 0.95; spin += u * u * 16; ga = 1 - u;
        if (u >= 1) c.state = 'gone';
      }
      const k = Math.max(1e-4, sc * big);
      this.q.setFromAxisAngle(this.up, spin); this.s.set(k, k, k); this.p.set(c.x, y, c.z);
      this.m.compose(this.p, this.q, this.s); this.body.setMatrixAt(i, this.m); this.rims.setMatrixAt(i, this.m);
      const gs = sc > 0.02 ? (c.v >= 10 ? 2.3 : 1.75) * (0.88 + 0.12 * Math.sin(t * 3 + c.ph)) * ga * Math.min(1, sc) : 1e-4;
      this.s.set(gs, gs, gs); this.m.compose(this.p, cq, this.s); this.glow.setMatrixAt(i, this.m);
      // destello: una estrella que se enciende un momento cada par de segundos en la esquina de la moneda
      const tw = Math.pow(Math.max(0, Math.sin(t * 1.6 + c.ph * 3)), 14), ss = c.state === 'idle' && c.pop > 0.9 ? Math.max(1e-4, 0.62 * big * tw) : 1e-4;
      this.p2.copy(this.p).addScaledVector(this.right, 0.2 * big).addScaledVector(this.vup, 0.22 * big);
      this.qr.setFromAxisAngle(this.zax, t * 0.7 + c.ph); this.q2.copy(cq).multiply(this.qr); this.s.set(ss, ss, ss);
      this.m.compose(this.p2, this.q2, this.s); this.star.setMatrixAt(i, this.m);
    });
    this.body.instanceMatrix.needsUpdate = this.rims.instanceMatrix.needsUpdate = this.glow.instanceMatrix.needsUpdate = this.star.instanceMatrix.needsUpdate = true;
    if (this.body.instanceColor) this.body.instanceColor.needsUpdate = this.rims.instanceColor.needsUpdate = true;
    // chispas
    const sp = this.sp; let any = false;
    for (let i = 0; i < this.NS; i++) {
      if (sp.age[i] >= sp.life[i]) { if (sp.a[i] < 1) { sp.a[i] = 1; any = true; } continue; }
      sp.age[i] += dt; sp.vel[i * 3 + 1] -= 6.5 * dt;
      sp.pos[i * 3] += sp.vel[i * 3] * dt; sp.pos[i * 3 + 1] += sp.vel[i * 3 + 1] * dt; sp.pos[i * 3 + 2] += sp.vel[i * 3 + 2] * dt;
      if (sp.pos[i * 3 + 1] < 0.1) { sp.pos[i * 3 + 1] = 0.1; sp.vel[i * 3 + 1] *= -0.3; }
      sp.a[i] = Math.min(1, sp.age[i] / sp.life[i]); any = true;
    }
    if (any) { this.sparks.geometry.attributes.position.needsUpdate = true; this.sparks.geometry.attributes.aLife.needsUpdate = true; }
    if (cam) this.uPx.value = innerHeight * Math.min(devicePixelRatio || 1, 2) / (2 * Math.tan((cam.fov * Math.PI) / 360));
  }
}
