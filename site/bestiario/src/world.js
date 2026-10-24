// El pueblo: plaza central (spawn) y cinco zonas unidas por caminos, tal como el
// esquema del cuaderno:
//
//                  Zona de pelea (N)
//                        |
//   Gimnasio (O) --- SPAWN --- Criaderos (E)
//                        |
//                    Tienda (S) -- Enfermería
//
// Ejes: x = este, z = sur (el norte es -z). La cámara mira siempre hacia el norte.
// Dirección de arte: pueblo sombrío al anochecer, piedra y madera oscuras, luz de
// faroles y brasas. Todo es geometría propia, sin modelos ni texturas de terceros.
import * as THREE from '../vendor/three.module.js';
import { THEMES, tintColor } from './themes.js';
import { weathered } from './weather.js';
import { SPECIES, ELEMENTS, NORTH_COUNT } from './species.js';
import { NPC_DEFS } from './npc.js';
import { L, bi, onLang } from './i18n.js';

export const BOUND = 70; // radio jugable
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Empuja un círculo (jugador, criatura) fuera de cajas y círculos sólidos.
export function resolveCircle(pos, radius, colliders, ignore = null) {
  for (let it = 0; it < 3; it++) {
    for (const b of colliders.boxes) {
      if (b.off) continue;
      const cx = clamp(pos.x, b.x0, b.x1), cz = clamp(pos.z, b.z0, b.z1);
      const dx = pos.x - cx, dz = pos.z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= radius * radius) continue;
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2), push = radius - d;
        pos.x += (dx / d) * push; pos.z += (dz / d) * push;
      } else { // el centro quedó dentro de la caja: salir por el lado más cercano
        const l = pos.x - b.x0 + radius, r = b.x1 - pos.x + radius;
        const t = pos.z - b.z0 + radius, bt = b.z1 - pos.z + radius;
        const m = Math.min(l, r, t, bt);
        if (m === l) pos.x -= l; else if (m === r) pos.x += r; else if (m === t) pos.z -= t; else pos.z += bt;
      }
    }
    for (const c of colliders.circles) {
      if (c === ignore || (ignore && c.owner === ignore)) continue; // `ignore` puede ser un círculo o el dueño de varios
      const dx = pos.x - c.x, dz = pos.z - c.z, rr = radius + c.r, d2 = dx * dx + dz * dz;
      if (d2 >= rr * rr) continue;
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2), push = rr - d;
        pos.x += (dx / d) * push; pos.z += (dz / d) * push;
      } else pos.x += rr;
    }
    const r = Math.hypot(pos.x, pos.z), lim = BOUND - radius;
    if (r > lim) { pos.x *= lim / r; pos.z *= lim / r; }
  }
}

// Une geometrías (con posición y normal) en una sola.
export function mergeParts(parts) {
  const items = parts.map((p) => {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    g.applyMatrix4(p.m);
    return g;
  });
  let n = 0;
  for (const g of items) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3);
  let o = 0;
  for (const g of items) {
    P.set(g.attributes.position.array, o * 3);
    N.set(g.attributes.normal.array, o * 3);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  return out;
}

// Paleta del pueblo
const STONE = 0x85858d, STONE_D = 0x62626b, STONE_L = 0xa2a2aa;
const WOOD = 0x6e5444, WOOD_D = 0x3f2f26, WOOD_L = 0x8c6f56;
const IRON = 0x3a3f47, IRON_L = 0x7c848f;
const BONE = 0xd8cfb8, EMBER = 0xff8a3a;

export function buildWorld(scene, theme = THEMES[0]) {
  const rnd = mulberry32(20261014);
  const R = (a, b) => a + (b - a) * rnd();
  const colliders = { circles: [], boxes: [] };
  const keepOut = []; // donde no crecen árboles ni rocas
  const zones = [];
  const repaints = [];   // letreros pintados con texto: se vuelven a pintar al cambiar de idioma
  onLang(() => { for (const f of repaints) f(); });
  const updaters = [];
  const stat = new THREE.Group(); // todo lo fijo: se fusiona por material al final
  const dyn = new THREE.Group();  // lo que se anima
  scene.add(stat, dyn);

  // ---------- utilidades de construcción ----------
  const mats = new Map();
  const M = (color, extra) => {
    const key = color + (extra ? JSON.stringify(extra) : '');
    let m = mats.get(key);
    if (!m) { m = new THREE.MeshStandardMaterial({ color: tintColor(color, theme), roughness: 0.92, metalness: 0, ...extra }); weathered(m, theme); mats.set(key, m); }
    return m;
  };
  const glow = (color, k = 1) => ({ emissive: color, emissiveIntensity: k });
  let curParent = stat; // donde van las piezas nuevas: lo fijo (stat) o el grupo de un edificio que se desvanece (ver beginFade)
  const put = (mesh, x, y, z, parent = curParent, flat = false) => {
    mesh.position.set(x, y, z);
    mesh.castShadow = !flat; mesh.receiveShadow = true;
    mesh.userData.flat = flat;
    parent.add(mesh);
    return mesh;
  };
  // y = base del objeto
  const box = (w, h, d, color, x, y, z, o = {}) => {
    const m = put(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(color, o.mat)), x, y + h / 2, z, o.parent, o.flat);
    if (o.ry) m.rotation.y = o.ry;
    return m;
  };
  const cyl = (rt, rb, h, color, x, y, z, o = {}) =>
    put(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg || 14), M(color, o.mat)), x, y + h / 2, z, o.parent, o.flat);
  const cylX = (r, len, color, x, y, z, o = {}) => { // cilindro tumbado a lo largo de x
    const g = new THREE.CylinderGeometry(r, r, len, o.seg || 14); g.rotateZ(Math.PI / 2);
    return put(new THREE.Mesh(g, M(color, o.mat)), x, y, z, o.parent);
  };
  const cylZ = (r, len, color, x, y, z, o = {}) => { // cilindro a lo largo de z
    const g = new THREE.CylinderGeometry(r, r, len, o.seg || 14); g.rotateX(Math.PI / 2);
    return put(new THREE.Mesh(g, M(color, o.mat)), x, y, z, o.parent);
  };
  const ball = (r, color, x, y, z, o = {}) => {
    const m = put(new THREE.Mesh(new THREE.SphereGeometry(r, o.w || 14, o.h || 10), M(color, o.mat)), x, y, z, o.parent);
    if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]);
    return m;
  };
  const cone = (r, h, color, x, y, z, o = {}) => {
    const m = put(new THREE.Mesh(new THREE.ConeGeometry(r, h, o.seg || 8), M(color, o.mat)), x, y + h / 2, z, o.parent);
    if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz;
    return m;
  };
  const group = (x, y, z, ry = 0) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; curParent.add(g); return g;
  };

  // Edificios que se vuelven translúcidos cuando se interponen entre la cámara y el jugador o quienes atienden en su zona
  // (así, al girar la cámara nunca tapan nada). beginFade() abre el grupo; endFade() lo fusiona por material y lo registra.
  const fades = [];
  const withParent = (P, fn) => { const old = curParent; curParent = P; fn(); curParent = old; };
  // kind 'roof': techo y adornos altos; se oculta del todo si el jugador está adentro. kind 'walls': paredes; solo se aclaran si tapan.
  // Las mallas con textura (letreros) no se fusionan porque mergeParts no copia UV: se quedan sueltas, cada una con su material propio.
  const endFade = (P, zoneId, kind, inner) => {
    curParent = stat;
    P.updateMatrixWorld(true);
    const meshes = []; P.traverse((o) => { if (o.isMesh) meshes.push(o); });
    const clones = new Map(), buckets = new Map(), loose = [];
    for (const o of meshes) {
      let c = clones.get(o.material);
      if (!c) { c = o.material.clone(); c.onBeforeCompile = o.material.onBeforeCompile; c.customProgramCacheKey = o.material.customProgramCacheKey; clones.set(o.material, c); }
      if (c.map) { o.material = c; loose.push(o); continue; }
      let b = buckets.get(c); if (!b) buckets.set(c, (b = []));
      b.push({ geo: o.geometry, m: o.matrixWorld.clone() });
    }
    P.clear();
    for (const [mat, parts] of buckets) {
      const mesh = new THREE.Mesh(mergeParts(parts), mat); mesh.castShadow = true; mesh.receiveShadow = true; P.add(mesh);
    }
    for (const o of loose) P.attach(o);
    const box = new THREE.Box3().setFromObject(P).expandByScalar(0.1);
    fades.push({ g: P, box, boxWide: box.clone().expandByScalar(0.6), kind, inner, mats: [...clones.values()], op: 1, zoneId, pts: NPC_DEFS.filter((n) => n.zone === zoneId).map((n) => new THREE.Vector3(n.x, 1.5, n.z)) });
  };
  // portones y carteles altos que podrían tapar al viajero: se construyen dentro de un grupo propio que se aclara solo si el rayo de la cámara toca sus piezas
  const fadeGroup = (zoneId, build, kind = 'walls') => { const G = new THREE.Group(); dyn.add(G); withParent(G, build); endFade(G, zoneId, kind, null); return G; };
  const _ray = new THREE.Ray(), _hit = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
  const blocks = (box, from, to) => { // ¿el segmento cámara → objetivo atraviesa la caja?
    _ray.origin.copy(from); _ray.direction.subVectors(to, from);
    const len = _ray.direction.length(); if (len < 1e-4) return false;
    _ray.direction.divideScalar(len);
    const p = _ray.intersectBox(box, _hit);
    return !!p && from.distanceTo(p) < len - 0.15;
  };
  const _rc = new THREE.Raycaster(), _rd = new THREE.Vector3();
  const blocksReal = (f, from, to) => { // ¿el segmento cámara → punto toca alguna pieza del grupo? (el rayo ignora si el grupo está oculto, así no parpadea)
    _rd.subVectors(to, from); const len = _rd.length(); if (len < 1e-4) return false;
    _rc.set(from, _rd.divideScalar(len)); _rc.near = 0; _rc.far = len - 0.15;
    return _rc.intersectObject(f.g, true).length > 0;
  };
  // puntos del viajero que no deben quedar tapados: cabeza, torso, cadera, los dos costados (a dos alturas) y, si camina, dónde estará en 0,25 s (así el grupo ya se está aclarando cuando llega el estorbo)
  const watch = Array.from({ length: 9 }, () => new THREE.Vector3());
  let watchN = 7, lpx = null, lpz = 0, svx = 0, svz = 0;
  const aimWatch = (dt, pp, camPos) => {
    if (lpx !== null && dt > 1e-4) {
      if (Math.hypot(pp.x - lpx, pp.z - lpz) > 2) svx = svz = 0;   // un salto (teletransporte, partida nueva) no cuenta como velocidad
      else { const k = Math.min(1, dt * 10); svx += ((pp.x - lpx) / dt - svx) * k; svz += ((pp.z - lpz) / dt - svz) * k; }
    }
    lpx = pp.x; lpz = pp.z;
    const sp = Math.hypot(svx, svz), cap = sp > 8 ? 8 / sp : 1;
    const dx = pp.z - camPos.z, dz = camPos.x - pp.x, dl = Math.hypot(dx, dz) || 1, sx = (dx / dl) * 0.4, sz = (dz / dl) * 0.4;   // perpendicular a la vista, 0,4 m
    watch[0].set(pp.x, 1.75, pp.z); watch[1].set(pp.x, 1.0, pp.z); watch[2].set(pp.x, 0.55, pp.z); watch[3].set(pp.x + sx, 1.0, pp.z + sz); watch[4].set(pp.x - sx, 1.0, pp.z - sz);
    watch[5].set(pp.x + sx, 0.55, pp.z + sz); watch[6].set(pp.x - sx, 0.55, pp.z - sz);
    watchN = 7;
    if (sp * cap > 0.6) { const ax = pp.x + svx * cap * 0.25, az = pp.z + svz * cap * 0.25; watch[7].set(ax, 1.75, az); watch[8].set(ax, 1.0, az); watchN = 9; }
  };
  const seesPlayer = (f, camPos) => { for (let i = 0; i < watchN; i++) if (blocksReal(f, camPos, watch[i])) return true; return false; };
  const addBox = (x0, x1, z0, z1) => colliders.boxes.push({ x0, x1, z0, z1 });
  const addCircle = (x, z, r) => { const c = { x, z, r }; colliders.circles.push(c); return c; };
  const keepRect = (x0, x1, z0, z1, m = 0) => keepOut.push({ x0: x0 - m, x1: x1 + m, z0: z0 - m, z1: z1 + m });
  const keepCircle = (x, z, r) => keepOut.push({ cx: x, cz: z, r });
  const isFree = (x, z, pad) => {
    for (const k of keepOut) {
      if (k.r !== undefined) { if (Math.hypot(x - k.cx, z - k.cz) < k.r + pad) return false; }
      else if (x > k.x0 - pad && x < k.x1 + pad && z > k.z0 - pad && z < k.z1 + pad) return false;
    }
    return true;
  };

  // llama parpadeante (dinámica)
  const flame = (x, y, z, s = 1) => {
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.28 * s, 0.85 * s, 7), new THREE.MeshBasicMaterial({ color: 0xff8a2a }));
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.15 * s, 0.5 * s, 6), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
    outer.position.set(x, y + 0.42 * s, z); inner.position.set(x, y + 0.3 * s, z);
    dyn.add(outer, inner);
    const ph = rnd() * 6;
    updaters.push((dt, t) => {
      const f = 1 + 0.2 * Math.sin(t * 9 + ph) + 0.08 * Math.sin(t * 23 + ph * 2);
      outer.scale.set(1 - (f - 1) * 0.4, f, 1 - (f - 1) * 0.4); inner.scale.set(1, f * 0.95, 1);
    });
  };
  const brazier = (x, z, h = 1.0) => {
    cyl(0.07, 0.1, h, IRON, x, 0, z, { seg: 6 });
    cyl(0.34, 0.2, 0.28, IRON, x, h, z, { seg: 8 });
    flame(x, h + 0.2, z, 0.9);
    addCircle(x, z, 0.3);
  };
  const lanternPost = (x, z) => {
    cyl(0.07, 0.1, 2.8, IRON, x, 0, z, { seg: 6 });
    box(0.5, 0.06, 0.5, IRON, x, 2.78, z);
    box(0.34, 0.42, 0.34, 0xffb35c, x, 2.9, z, { mat: glow(0xff8a2a, 1.4) });
    cone(0.34, 0.26, IRON, x, 3.32, z, { seg: 4 });
    addCircle(x, z, 0.25);
  };
  const skull = (x, y, z, sc = 1, o = {}) => { // cráneo con cuernos, mirando al sur
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(sc); curParent.add(g);
    ball(0.5, BONE, 0, 0, 0, { parent: g, s: [1, 0.9, 1.05] });
    box(0.5, 0.2, 0.5, BONE, 0, -0.62, 0.14, { parent: g });
    for (let i = -2; i <= 2; i++) cone(0.04, 0.12, 0xece4d0, i * 0.1, -0.5, 0.36, { parent: g, seg: 4 });
    for (const s of [-1, 1]) {
      ball(0.15, 0x120808, s * 0.2, 0.02, 0.38, { parent: g, mat: glow(0xff2a1a, 1.6) });
      cone(0.1, 0.95, 0xcfc4a8, s * 0.42, 0.28, -0.02, { parent: g, seg: 6, rz: -s * 1.0 });
    }
    cone(0.07, 0.16, 0x120808, 0, -0.18, 0.5, { parent: g, seg: 4, rx: Math.PI });
    void o;
  };
  const crackedEgg = (x, y, z, sc = 1, shell = 0x3a4a42) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(sc); curParent.add(g);
    ball(0.7, shell, 0, 0.6, 0, { parent: g, s: [0.78, 1.05, 0.78], w: 18, h: 14 });
    for (const [bx, by, bz, rz] of [[0.0, 0.85, 0.52, 0.4], [0.18, 0.55, 0.5, -0.5], [-0.2, 0.62, 0.5, 0.9], [0.05, 1.12, 0.38, -0.2]]) {
      box(0.07, 0.4, 0.05, EMBER, bx, by - 0.2, bz, { parent: g, mat: glow(EMBER, 1.6) }).rotation.z = rz;
    }
  };

  // ---------- suelo ----------
  {
    const SIZE = 300, SEG = 150;
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
    const G = theme.ground, dark = new THREE.Color(G.dark), mid = new THREE.Color(G.mid), light = new THREE.Color(G.light), ash = new THREE.Color(G.ash), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const n = 0.5 + 0.3 * Math.sin(x * 0.09 + 1.3) * Math.cos(z * 0.08 - 0.4) + 0.2 * Math.sin(x * 0.27 + z * 0.23 + 2.1);
      c.copy(dark).lerp(mid, clamp(n * 1.4, 0, 1)).lerp(light, clamp((n - 0.6) * 2, 0, 1));
      const a = Math.sin(x * 0.17 - 0.6) * Math.cos(z * 0.21 + 1.1);
      if (a > 0.5) c.lerp(ash, clamp((a - 0.5) * 1.6, 0, G.ashAmt)); // zonas de ceniza, barro o nieve sucia
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const cx = cv.getContext('2d');
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2200; i++) {
      const v = 150 + Math.floor(rnd() * 90);
      cx.fillStyle = `rgba(${v - 30},${v - 10},${v - 30},${0.3 + rnd() * 0.4})`;
      cx.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2, 2 + rnd() * 5);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(75, 75);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, map: tex, roughness: 1, metalness: 0 }));
    ground.receiveShadow = true; ground.userData.noBake = true;
    stat.add(ground);
  }

  // ---------- plaza central y caminos ----------
  const PATH = theme.path ? theme.path[0] : 0x93805e, PATH_EDGE = theme.path ? theme.path[1] : 0x6c5b42;
  const pathRect = (x0, x1, z0, z1) => {
    box(x1 - x0 + 0.7, 0.05, z1 - z0 + 0.7, PATH_EDGE, (x0 + x1) / 2, 0, (z0 + z1) / 2, { flat: true });
    box(x1 - x0, 0.07, z1 - z0, PATH, (x0 + x1) / 2, 0, (z0 + z1) / 2, { flat: true });
    keepRect(x0, x1, z0, z1, 3.4);
  };
  pathRect(-1.8, 1.8, -19.6, -8);   // norte: zona de pelea
  pathRect(-1.8, 1.8, 8, 26.8);     // sur: tienda
  pathRect(-25.4, -8, -1.8, 1.8);   // oeste: gimnasio
  pathRect(8, 20.6, -1.8, 1.8);     // este: criaderos
  pathRect(0, 19.5, 21.1, 24.1);    // de la tienda a la enfermería
  pathRect(16.5, 19.5, 21.1, 26.8);

  cyl(9.6, 9.6, 0.1, STONE_D, 0, 0, 0, { seg: 48, flat: true });
  cyl(9, 9, 0.14, 0x8e8e96, 0, 0, 0, { seg: 48, flat: true });
  keepCircle(0, 0, 11.5);
  {
    const ringGeo = (r0, r1, color, y) => {
      const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 64), M(color));
      m.rotation.x = -Math.PI / 2; return put(m, 0, y, 0, stat, true);
    };
    ringGeo(8.2, 8.55, 0x6c6c75, 0.15);
    ringGeo(4.6, 4.8, 0x74747d, 0.15);
    // emblema del punto de aparición: estrella de ocho puntas con runas
    const cv = document.createElement('canvas'); cv.width = cv.height = 512;
    const g = cv.getContext('2d'); g.translate(256, 256);
    g.fillStyle = '#5a5a63'; g.beginPath(); g.arc(0, 0, 254, 0, 7); g.fill();
    g.strokeStyle = '#a07a3a'; g.lineWidth = 12; g.beginPath(); g.arc(0, 0, 234, 0, 7); g.stroke();
    g.strokeStyle = '#7a7a84'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 206, 0, 7); g.stroke();
    g.fillStyle = '#8a8a94';
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.save(); g.rotate(a); g.fillRect(-4, -222, 8, i % 3 ? 10 : 18); g.restore(); }
    g.fillStyle = '#b4532a'; g.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 56 : (i % 4 === 0 ? 196 : 124);
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath(); g.fill();
    g.fillStyle = '#e0a04a'; g.beginPath(); g.arc(0, 0, 30, 0, 7); g.fill();
    g.fillStyle = '#5a5a63'; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill();
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const pad = new THREE.Mesh(new THREE.CircleGeometry(2.7, 48), new THREE.MeshStandardMaterial({ map: tex, emissive: 0x3a1a08, emissiveMap: tex, emissiveIntensity: 0.12, roughness: 0.9 }));
    pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.16, 0); pad.receiveShadow = true; pad.userData.noBake = true;
    stat.add(pad);
  }
  const bench = (x, z) => {
    const ry = Math.atan2(-x, -z), g = group(x, 0, z, ry);
    box(1.9, 0.1, 0.55, WOOD_L, 0, 0.45, 0, { parent: g });
    box(1.9, 0.5, 0.1, WOOD_L, 0, 0.7, -0.26, { parent: g });
    for (const s of [-0.8, 0.8]) box(0.1, 0.45, 0.5, IRON, s, 0, 0, { parent: g });
    for (const s of [-0.6, 0.6]) addCircle(x + Math.cos(ry) * s, z - Math.sin(ry) * s, 0.55);
  };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    lanternPost(sx * 7.6, sz * 7.6);
    bench(sx * 5.6, sz * 5.6);
  }
  // faroles a lo largo de los caminos
  for (const s of [-1, 1]) {
    lanternPost(s * 2.9, -14); lanternPost(s * 2.9, 14); lanternPost(-14, s * 2.9); lanternPost(14, s * 2.9);
  }

  // ---------- zonas (rótulos, avisos y anillos de entrada) ----------
  function addZone(def) {
    const rg = def.ring || { x: def.x, z: def.z, r: def.r };
    const col = new THREE.Color(def.css);
    const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7, depthWrite: false });
    const fillMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.14, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(rg.r - 0.24, rg.r, 56), ringMat);
    const fill = new THREE.Mesh(new THREE.CircleGeometry(rg.r - 0.24, 56), fillMat);
    ring.rotation.x = fill.rotation.x = -Math.PI / 2;
    ring.position.set(rg.x, 0.11, rg.z); fill.position.set(rg.x, 0.1, rg.z);
    dyn.add(ring, fill);
    def.fx = { ring, fill, ringMat, fillMat, active: 0 };
    zones.push(bi(def));
  }

  // =====================================================================
  //  ZONA DE PELEA (norte): arena circular con muro de púas y portón
  // =====================================================================
  {
    const cx = 0, cz = -30, RA = 11;
    keepCircle(cx, cz, 14.5);
    cyl(10.7, 10.7, 0.06, 0x9a8466, cx, 0, cz, { seg: 56, flat: true });
    const ringFlat = (r0, r1, color, y, x = cx, z = cz) => {
      const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 56), M(color));
      m.rotation.x = -Math.PI / 2; put(m, x, y, z, stat, true);
    };
    ringFlat(9.2, 9.5, 0x6c5844, 0.08);
    ringFlat(3.4, 3.7, 0x6c5844, 0.08);
    const stain = new THREE.Mesh(new THREE.CircleGeometry(3.3, 40), M(0x6a2c28));
    stain.rotation.x = -Math.PI / 2; put(stain, cx, 0.075, cz, stat, true);
    box(0.3, 0.02, 16, 0x6c5844, cx, 0.07, cz, { flat: true });
    box(16, 0.02, 0.3, 0x6c5844, cx, 0.07, cz, { flat: true });

    const N = 40;
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      if (Math.abs(th < Math.PI ? th : th - Math.PI * 2) < 0.24) continue; // portón al sur
      const x = cx + Math.sin(th) * RA, z = cz + Math.cos(th) * RA;
      box(2.0, 1.7, 0.95, STONE, x, 0, z, { ry: th });
      box(2.1, 0.16, 1.1, STONE_D, x, 1.7, z, { ry: th });
      for (const s of [-0.6, 0, 0.6]) cone(0.1, 0.55, IRON_L, x + Math.cos(th) * s, 1.86, z - Math.sin(th) * s, { seg: 5 });
      addCircle(x, z, 1.0);
    }
    // columnas del portón y dintel
    for (const s of [-1, 1]) {
      const th = s * 0.3, x = cx + Math.sin(th) * RA, z = cz + Math.cos(th) * RA;
      fadeGroup('pelea', () => { // cada columna se aclara sola si tapa al viajero (o a quien atiende)
        cyl(0.62, 0.74, 3.5, STONE, x, 0, z, { seg: 10 });
        cyl(0.8, 0.8, 0.25, STONE_L, x, 3.5, z, { seg: 10 });
        cone(0.14, 0.7, IRON_L, x, 3.78, z, { seg: 5 });
      });
      addCircle(x, z, 0.74);
      brazier(x, z + 1.15, 1.0);
    }
    fadeGroup('pelea', () => {
      box(RA * 0.62, 0.5, 0.7, IRON, cx, 3.0, cz + RA - 0.05);
      skull(cx, 4.3, cz + RA + 0.1, 1.25);
    });
    // antorchas dentro de la arena
    for (let k = 0; k < 6; k++) {
      const th = Math.PI * 0.35 + (k / 5) * Math.PI * 1.3;
      brazier(cx + Math.sin(th) * 8.3, cz + Math.cos(th) * 8.3, 1.4);
    }
    // estandartes rasgados sobre el muro
    for (let k = 0; k < 8; k++) {
      const th = 0.9 + k * 0.62, x = cx + Math.sin(th) * RA, z = cz + Math.cos(th) * RA;
      cyl(0.06, 0.06, 3.4, IRON, x, 1.5, z, { seg: 6 });
      box(0.08, 1.2, 0.7, k % 2 ? 0x233047 : 0x5a1a1f, x, 2.2, z, { ry: th + Math.PI / 2 });
    }
    addZone({
      id: 'pelea', name: 'Zona de pelea', desc: 'Combates por turnos contra rivales de la arena', css: '#ff5a3c',
      en: { name: 'Arena', desc: 'Turn-based battles against arena rivals' },
      x: cx, z: cz, r: 10, ring: { x: cx, z: cz + 8.6, r: 2.3 },
      label: { x: cx, y: 5.6, z: cz + RA + 0.5 },
    });
  }

  // =====================================================================
  //  utilidades de edificios
  // =====================================================================
  function gable(w, d, h, color, cx, baseY, cz, ridgeAlongX, overhang = 0.6) {
    const across = (ridgeAlongX ? d : w) / 2 + overhang, along = (ridgeAlongX ? w : d) + overhang * 2;
    const sh = new THREE.Shape();
    sh.moveTo(-across, 0); sh.lineTo(across, 0); sh.lineTo(0, h); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: along, bevelEnabled: false });
    g.translate(0, 0, -along / 2);
    const m = put(new THREE.Mesh(g, M(color)), cx, baseY, cz);
    if (ridgeAlongX) m.rotation.y = Math.PI / 2;
    return m;
  }
  // Edificio con interior: cuatro paredes (con un hueco de puerta en el lado norte 'n' o este 'e'), piso de tablones y techo.
  // Las paredes y el techo van en grupos aparte que se aclaran (ver endFade); el piso y lo de adentro quedan siempre a la vista.
  // Devuelve {W, R, inner, finish(zoneId)}: W = grupo de paredes, R = grupo del techo (para colgarle adornos con withParent).
  function house({ cx, cz, w, d, h = 3.4, wall, roof, roofH = 2.2, trim = WOOD_D, ridgeAlongX = true, windowsS = [], glowCol = 0xff9a4a, door = null, floor = 0x77593a }) {
    const W = new THREE.Group(), R = new THREE.Group(); dyn.add(W, R);
    const T = 0.4, x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    const inner = { x0: x0 + T, x1: x1 - T, z0: z0 + T, z1: z1 - T };
    const seg = (ax0, ax1, az0, az1) => { // tramo de pared con su zócalo y su colisión
      if (ax1 - ax0 < 0.05 || az1 - az0 < 0.05) return;
      box(ax1 - ax0, h, az1 - az0, wall, (ax0 + ax1) / 2, 0, (az0 + az1) / 2);
      box(ax1 - ax0 + 0.12, 0.5, az1 - az0 + 0.12, STONE_D, (ax0 + ax1) / 2, 0, (az0 + az1) / 2);
      addBox(ax0, ax1, az0, az1);
    };
    const dh = door ? (door.h || 2.7) : 0, dw = door ? (door.w || 2.4) : 0, off = door ? (door.off || 0) : 0;
    curParent = W;
    // norte
    if (door && door.side === 'n') {
      const a = cx + off - dw / 2, b = cx + off + dw / 2;
      seg(x0, a, z0, z0 + T); seg(b, x1, z0, z0 + T);
      box(dw, h - dh, T, wall, cx + off, dh, z0 + T / 2);
      for (const px of [a, b]) box(0.22, dh, T + 0.14, trim, px, 0, z0 + T / 2);
      box(dw + 0.44, 0.2, T + 0.14, trim, cx + off, dh - 0.02, z0 + T / 2);
    } else seg(x0, x1, z0, z0 + T);
    seg(x0, x1, z1 - T, z1);                                                  // sur
    seg(x0, x0 + T, z0 + T, z1 - T);                                          // oeste
    if (door && door.side === 'e') {                                          // este
      const a = cz + off - dw / 2, b = cz + off + dw / 2;
      seg(x1 - T, x1, z0 + T, a); seg(x1 - T, x1, b, z1 - T);
      box(T, h - dh, dw, wall, x1 - T / 2, dh, cz + off);
      for (const pz of [a, b]) box(T + 0.14, dh, 0.22, trim, x1 - T / 2, 0, pz);
      box(T + 0.14, 0.2, dw + 0.44, trim, x1 - T / 2, dh - 0.02, cz + off);
    } else seg(x1 - T, x1, z0 + T, z1 - T);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.4, h + 0.1, 0.4, trim, cx + (sx * w) / 2, 0, cz + (sz * d) / 2);
    for (const x of windowsS) { // ventanas del fondo (cara sur)
      box(1.7, 1.5, 0.16, trim, cx + x, 1.25, cz + d / 2 + 0.02);
      box(1.2, 1.0, 0.2, glowCol, cx + x, 1.5, cz + d / 2 + 0.04, { mat: glow(glowCol, 0.9) });
      box(0.08, 1.0, 0.22, trim, cx + x, 1.5, cz + d / 2 + 0.05);
    }
    curParent = R;
    box(w + 0.3, 0.2, d + 0.3, trim, cx, h - 0.1, cz); // viga bajo el techo
    gable(w, d, roofH, roof, cx, h, cz, ridgeAlongX);
    curParent = stat;
    // piso de tablones (siempre visible)
    const n = Math.round((d - 2 * T) / 0.5);
    for (let i = 0; i < n; i++) box(w - 2 * T, 0.09, (d - 2 * T) / n - 0.03, i % 2 ? floor : floor + 0x0a0805, cx, 0, z0 + T + ((i + 0.5) * (d - 2 * T)) / n, { flat: true });
    keepRect(x0, x1, z0, z1, 2.5);
    return {
      W, R, inner,
      finish(zoneId) { endFade(W, zoneId, 'walls', inner); endFade(R, zoneId, 'roof', inner); },
    };
  }

  // =====================================================================
  //  GIMNASIO (oeste)
  // =====================================================================
  // cartel de madera con texto que mira al norte (hacia quien llega); y = borde inferior del tablero
  const signBoard = (text, x, y, z, w = 2.6, o = {}) => {
    const h = o.h || 0.62;
    box(w, h, 0.1, o.bg || WOOD_D, x, y, z);
    if (o.posts !== false) for (const s of [-1, 1]) box(0.09, y + 0.05, 0.09, WOOD_D, x + s * (w / 2 - 0.12), 0, z + 0.02);
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = Math.round(512 * (h - 0.14) / (w - 0.2));
    const g = cv.getContext('2d');
    const paint = () => {
      const t = typeof text === 'function' ? text() : text;
      g.fillStyle = o.panel || '#2a2018'; g.fillRect(0, 0, cv.width, cv.height);
      let fs = 96; g.font = `800 ${fs}px system-ui, "Segoe UI", sans-serif`;
      while (g.measureText(t).width > cv.width - 40 && fs > 24) { fs -= 4; g.font = `800 ${fs}px system-ui, "Segoe UI", sans-serif`; }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = o.ink || '#f0d9a0'; g.fillText(t, cv.width / 2, cv.height / 2 + 4);
    };
    paint();
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    if (typeof text === 'function') repaints.push(() => { paint(); tex.needsUpdate = true; });
    const face = new THREE.MeshBasicMaterial({ map: tex });
    for (const side of [-1, 1]) { // legible desde el norte (quien llega) y desde el sur (la cámara alta)
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, h - 0.14), face);
      m.rotation.y = side < 0 ? Math.PI : 0; m.position.set(x, y + h / 2, z + side * 0.056); m.userData.noBake = true; curParent.add(m);
    }
    if (o.posts !== false) { addCircle(x - w / 2 + 0.12, z, 0.12); addCircle(x + w / 2 - 0.12, z, 0.12); }
  };
  // maniquí de madera con capa (escaparate de aspectos)
  const mannequin = (x, z, cloak, ry = 0) => {
    const g = group(x, 0, z, ry);
    cyl(0.05, 0.07, 1.25, WOOD_D, 0, 0, 0, { parent: g, seg: 6 });
    cyl(0.28, 0.22, 0.2, WOOD_D, 0, 0, 0, { parent: g, seg: 8 });
    cyl(0.2, 0.27, 0.9, cloak, 0, 0.55, 0, { parent: g, seg: 10 });
    ball(0.22, cloak, 0, 1.4, -0.02, { parent: g, s: [1.15, 0.7, 0.9] });
    ball(0.15, 0x7a6a56, 0, 1.68, 0, { parent: g });
    addCircle(x, z, 0.42);
  };
  const appleBall = (x, y, z, color) => { // manzana: esfera algo achatada con tallo y hoja
    ball(0.15, color, x, y, z, { w: 10, h: 8, s: [1, 0.9, 1], mat: glow(color, 0.22) });
    cyl(0.012, 0.012, 0.07, 0x4a3426, x, y + 0.12, z, { seg: 4 });
    ball(0.035, 0x4a7a3a, x + 0.04, y + 0.17, z, { w: 5, h: 4, s: [1.6, 0.4, 1] });
  };
  const dummy = (x, z, ry = 0) => {
    cyl(0.09, 0.12, 1.75, WOOD_D, x, 0, z, { seg: 8 });
    box(1.1, 0.14, 0.14, WOOD_D, x, 1.2, z, { ry });
    cyl(0.33, 0.36, 0.75, 0xb09a62, x, 0.55, z, { seg: 10 });
    ball(0.26, 0x9a8650, x, 1.78, z);
    const t = put(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 14), M(0x6a2020)), x, 0.95, z + 0.36);
    t.rotation.x = Math.PI / 2;
    cone(0.05, 0.3, IRON_L, x + 0.3, 1.1, z + 0.34, { seg: 4, rx: Math.PI / 2 }); // hoja clavada
    addCircle(x, z, 0.5);
  };
  {
    const cx = -31, cz = 0, w = 12, d = 11, h = 3.4, roofH = 2.4;
    const H = house({ cx, cz, w, d, h, wall: 0xa8a08a, roof: 0x3d4659, roofH, ridgeAlongX: true, windowsS: [-3.5, 0, 3.5], door: { side: 'e', w: 2.8, h: 2.9 }, floor: 0x6a5a48 });
    box(1.0, 0.18, 3.6, STONE_D, cx + w / 2 + 0.5, 0, cz);                  // escalón de la puerta (que está abierta)
    // pesa de hierro sobre el techo
    withParent(H.R, () => {
      const ry = h + roofH, sy = ry + 0.9;
      cylX(0.14, 3.6, IRON_L, cx, sy, cz);
      for (const s of [-1, 1]) {
        cylX(0.75, 0.32, IRON, cx + s * 1.4, sy, cz, { seg: 18 });
        cylX(0.55, 0.28, 0x3a3f48, cx + s * 1.75, sy, cz, { seg: 18 });
      }
      cyl(0.18, 0.18, 0.5, WOOD_D, cx, ry - 0.05, cz, { seg: 8 });
    });
    H.finish('gimnasio');
    brazier(cx + w / 2 + 0.9, cz - 2.6, 1.1); brazier(cx + w / 2 + 0.9, cz + 2.6, 1.1);
    // ---- interior: cuadrilátero de sparring, sacos, pesas, armas y mojones de los cuatro elementos
    {
      const rx = -32.0, rz = 0, rs = 2.3;                                      // centro y semilado del cuadrilátero
      box(rs * 2 + 0.4, 0.06, rs * 2 + 0.4, 0x5a4634, rx, 0, rz);
      box(rs * 2, 0.04, rs * 2, 0x8a2e2a, rx, 0.06, rz, { flat: true });
      box(rs * 0.9, 0.05, rs * 0.9, 0xc9c2ac, rx, 0.07, rz, { flat: true });
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cyl(0.09, 0.09, 1.5, IRON, rx + sx * rs, 0.06, rz + sz * rs, { seg: 8 });
      for (const y of [0.75, 1.05, 1.35]) {
        const col = y === 1.05 ? 0xe8e0c8 : 0xa02a2a;
        for (const sz of [-1, 1]) box(rs * 2, 0.05, 0.05, col, rx, y, rz + sz * rs);
        box(0.05, 0.05, rs * 2, col, rx - rs, y, rz);   // el lado este queda sin cuerdas: es la entrada
      }
      addBox(rx - rs - 0.1, rx + rs + 0.1, rz - rs - 0.1, rz - rs + 0.1); addBox(rx - rs - 0.1, rx + rs + 0.1, rz + rs - 0.1, rz + rs + 0.1); addBox(rx - rs - 0.1, rx - rs + 0.1, rz - rs, rz + rs);
      // sacos de arena sobre pedestal, a lo largo de la pared oeste
      for (const sz of [-3.4, 3.4]) { cyl(0.32, 0.36, 1.3, 0x6e4c3a, -36.0, 0.1, sz, { seg: 10 }); cyl(0.5, 0.55, 0.1, IRON, -36.0, 0, sz, { seg: 10 }); addCircle(-36.0, sz, 0.5); }
      // pared norte: estantes de armas de práctica; pared sur: banco de pesas y discos
      for (let k = 0; k < 4; k++) {
        const wx = -35.0 + k * 2.1;
        box(1.8, 0.1, 0.5, WOOD_D, wx, 0.65, -4.7); box(0.1, 1.4, 0.5, WOOD_D, wx - 0.9, 0, -4.7); box(0.1, 1.4, 0.5, WOOD_D, wx + 0.9, 0, -4.7);
        for (const s of [-0.5, 0, 0.5]) cylX(0.025, 1.0, WOOD_L, wx + s * 0.1, 0.85 + (k % 2) * 0.15, -4.65).rotation.z = 0.15 + s * 0.2;
        cyl(0.3, 0.3, 0.05, 0x6e503a, wx, 1.05, -4.62, { seg: 10 });
        addBox(wx - 0.95, wx + 0.95, -4.95, -4.45);
      }
      box(2.4, 0.9, 0.8, WOOD_D, -33.4, 0, 4.6); addBox(-34.6, -32.2, 4.2, 5.0);
      for (const s of [-0.8, 0.8]) { cylX(0.2, 0.1, IRON, -33.4 + s - 0.5, 1.1, 4.6); cylX(0.2, 0.1, IRON, -33.4 + s + 0.5, 1.1, 4.6); cylX(0.05, 1.3, IRON_L, -33.4 + s, 1.1, 4.6); }
      for (const [bx, bz] of [[-29.6, 4.6], [-28.5, 4.4]]) { cyl(0.34, 0.34, 0.1, IRON, bx, 0, bz, { seg: 12 }); cyl(0.26, 0.26, 0.1, IRON, bx, 0.1, bz, { seg: 12 }); addCircle(bx, bz, 0.4); }
      // los cuatro elementos: un mojón luminoso en cada rincón
      [[0xff6a30, -35.6, -4.4], [0x4aa8f0, -35.6, 4.4], [0xcfeaf6, -26.2, 4.4], [0xa8c050, -26.2, -4.4]].forEach(([col, px, pz]) => {
        cyl(0.2, 0.28, 0.8, STONE_D, px, 0, pz, { seg: 6 }); box(0.22, 0.22, 0.22, col, px, 0.85, pz, { mat: glow(col, 1.5) }); addCircle(px, pz, 0.3);
      });
    }
    // patio de entrenamiento
    keepRect(-27, -12, -12, 12);
    dummy(-17.5, -5.6); dummy(-17.5, 5.6, 0.5); dummy(-14.5, -6.8, -0.4);
    {
      const x = -21, z = 8.6;
      box(2.6, 0.9, 0.7, WOOD_D, x, 0, z); addBox(x - 1.3, x + 1.3, z - 0.35, z + 0.35);
      for (const s of [-0.7, 0.7]) {
        cylX(0.06, 1.0, IRON_L, x + s, 1.05, z);
        cylX(0.2, 0.1, IRON, x + s - 0.45, 1.05, z); cylX(0.2, 0.1, IRON, x + s + 0.45, 1.05, z);
      }
    }
    { // saco de arena colgante
      const x = -21, z = -8.6;
      for (const s of [-0.9, 0.9]) cyl(0.07, 0.07, 2.6, WOOD_D, x + s, 0, z, { seg: 6 });
      box(2.0, 0.12, 0.12, WOOD_D, x, 2.55, z);
      cyl(0.32, 0.32, 1.1, 0x6e4c3a, x, 0.9, z, { seg: 10 });
      cyl(0.02, 0.02, 0.6, IRON_L, x, 2.0, z, { seg: 4 });
      addCircle(x, z, 0.45); addCircle(x - 0.9, z, 0.15); addCircle(x + 0.9, z, 0.15);
    }
    for (const [bx, bz] of [[-24.4, -7.2], [-24.4, -8.5], [-24.4, 7.6]]) { cyl(0.5, 0.5, 0.95, 0x5e4534, bx, 0, bz, { seg: 12 }); cyl(0.52, 0.52, 0.08, IRON, bx, 0.25, bz, { seg: 12 }); addCircle(bx, bz, 0.5); }
    { // círculo de runas de los cuatro elementos (entrenamiento de magia)
      const rx = -21.6, rz = 4.8;
      const cv2 = document.createElement('canvas'); cv2.width = cv2.height = 512;
      const g = cv2.getContext('2d'); g.translate(256, 256);
      g.fillStyle = '#4a4650'; g.beginPath(); g.arc(0, 0, 254, 0, 7); g.fill();
      [['#c8502a', 0], ['#3a8fd0', 1], ['#c4e4f0', 2], ['#7a8a3a', 3]].forEach(([c, k]) => {
        g.fillStyle = c; g.globalAlpha = 0.62; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 214, k * Math.PI / 2 - Math.PI / 4, (k + 1) * Math.PI / 2 - Math.PI / 4); g.closePath(); g.fill();
      });
      g.globalAlpha = 1; g.strokeStyle = '#d8cfb8'; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 222, 0, 7); g.stroke();
      g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 90, 0, 7); g.stroke();
      for (let i = 0; i < 32; i++) { g.save(); g.rotate(i * Math.PI / 16); g.fillStyle = '#d8cfb8'; g.fillRect(-3, -246, 6, i % 2 ? 14 : 26); g.restore(); }
      const tex = new THREE.CanvasTexture(cv2); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const disk = new THREE.Mesh(new THREE.CircleGeometry(2.6, 40), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
      disk.rotation.x = -Math.PI / 2; disk.position.set(rx, 0.09, rz); disk.receiveShadow = true; disk.userData.noBake = true; stat.add(disk);
      [[0xff6a30, 0], [0x4aa8f0, 1], [0xcfeaf6, 2], [0xa8c050, 3]].forEach(([col, k]) => { // un mojón por elemento
        const a = k * Math.PI / 2 + Math.PI / 2, px = rx + Math.sin(a) * 2.9, pz = rz + Math.cos(a) * 2.9;
        cyl(0.2, 0.28, 0.9, STONE_D, px, 0, pz, { seg: 6 }); box(0.22, 0.22, 0.22, col, px, 0.95, pz, { mat: glow(col, 1.4) });
        addCircle(px, pz, 0.3);
      });
    }
    { // piedras de levantamiento sobre una plataforma de madera
      box(3.6, 0.14, 1.9, WOOD_D, -13.6, 0, 7.2, { flat: true });
      [[-14.6, 7.2, 0.34], [-13.6, 7.0, 0.46], [-12.5, 7.3, 0.58]].forEach(([sx, sz, sr]) => {
        ball(sr, 0x7d7b78, sx, 0.14 + sr * 0.85, sz, { s: [1, 0.85, 1], w: 8, h: 6 });
        cylX(0.03, sr * 1.3, IRON, sx, 0.14 + sr * 1.3, sz);
        addCircle(sx, sz, sr * 0.9);
      });
    }
    { // obstáculos: troncos bajos para saltar y un muro de trepar
      for (const hz of [-4.2, -6.0]) { cylX(0.16, 2.2, WOOD, -21.5, 0.38, hz); for (const s of [-0.9, 0.9]) box(0.14, 0.38, 0.14, WOOD_D, -21.5 + s, 0, hz); addBox(-22.6, -20.4, hz - 0.2, hz + 0.2); }
      box(2.6, 1.9, 0.3, WOOD, -13.4, 0, -9.6); for (const k of [0, 1, 2]) box(2.4, 0.07, 0.34, WOOD_D, -13.4, 0.55 + k * 0.5, -9.6);
      addBox(-14.7, -12.1, -9.75, -9.45);
    }
    fadeGroup('gimnasio', () => signBoard(() => L('GIMNASIO', 'GYM'), -22.4, 3.2, -3.2, 2.6, { bg: 0x3d4659, ink: '#f0c880' }));
    addZone({
      id: 'gimnasio', name: 'Gimnasio', desc: 'Entrena a tus criaturas', css: '#f0a23a',
      en: { name: 'Gym', desc: 'Train your creatures' },
      x: -29.5, z: 0, r: 7.4, ring: { x: -27.6, z: -0.4, r: 2.3 }, label: { x: cx, y: 8.2, z: cz },
    });
  }

  // =====================================================================
  //  CRIADEROS (este): una jaula por criatura a ambos lados de un pasillo largo
  // =====================================================================
  const PEN = { x0: 20, x1: 70.2, z0: -9, z1: 9 };   // x1: la fila norte suma 46,9 m de jaulas (las de alas miden su envergadura en el rugido + 0,4 m)
  const cages = [];
  {
    const { x0, x1, z0, z1 } = PEN;
    keepRect(x0 - 1, x1 + 2, z0 - 1, z1 + 1, 2);
    box(x1 - x0, 0.06, z1 - z0, 0x6e5a44, (x0 + x1) / 2, 0, (z0 + z1) / 2, { flat: true });
    for (let i = 0; i < 26; i++) { // manchas de paja y ceniza
      const m = new THREE.Mesh(new THREE.CircleGeometry(R(0.9, 1.9), 14), M(i % 3 ? 0x8a7a48 : 0x7a7872));
      m.rotation.x = -Math.PI / 2; put(m, R(x0 + 2, x1 - 2), 0.075, R(z0 + 2, z1 - 2), stat, true);
    }
    // valla perimetral de barrotes de hierro con pilares de piedra rematados en púa
    const fence = (ax, az, bx, bz) => {
      const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 3.2));
      const dx = (bx - ax) / len, dz = (bz - az) / len, alongX = Math.abs(dx) > 0.5;
      for (let i = 0; i <= n; i++) {
        const px = ax + dx * (len * i / n), pz = az + dz * (len * i / n);
        box(0.5, 2.1, 0.5, STONE, px, 0, pz); cone(0.2, 0.45, IRON_L, px, 2.1, pz, { seg: 4 });
      }
      const bars = Math.round(len / 0.5);
      for (let i = 1; i < bars; i++) {
        const px = ax + dx * (len * i / bars), pz = az + dz * (len * i / bars);
        cyl(0.035, 0.035, 1.8, IRON, px, 0, pz, { seg: 5 }); cone(0.06, 0.18, IRON_L, px, 1.8, pz, { seg: 4 });
      }
      const mx = (ax + bx) / 2, mz = (az + bz) / 2;
      for (const hy of [0.45, 1.3]) {
        if (alongX) box(len, 0.08, 0.08, IRON, mx, hy, mz); else box(0.08, 0.08, len, IRON, mx, hy, mz);
      }
      if (alongX) addBox(Math.min(ax, bx) - 0.25, Math.max(ax, bx) + 0.25, az - 0.25, az + 0.25);
      else addBox(ax - 0.25, ax + 0.25, Math.min(az, bz) - 0.25, Math.max(az, bz) + 0.25);
    };
    fence(x0, z0, x1, z0); fence(x0, z1, x1, z1); fence(x1, z0, x1, z1);
    fence(x0, z0, x0, -2.4); fence(x0, 2.4, x0, z1);
    // portón: pilares con brasero, dintel de hierro y huevo agrietado
    for (const sg of [-1, 1]) {
      fadeGroup('criaderos', () => {
        box(0.8, 3.0, 0.8, STONE, x0, 0, sg * 2.4); box(1.0, 0.2, 1.0, STONE_L, x0, 3.0, sg * 2.4);
        cone(0.2, 0.6, IRON_L, x0, 3.2, sg * 2.4, { seg: 4 });
        box(0.4, 0.5, 0.4, 0xffb35c, x0 - 0.6, 2.2, sg * 2.4, { mat: glow(0xff8a2a, 1.3) });
      });
      addCircle(x0, sg * 2.4, 0.5);
    }
    fadeGroup('criaderos', () => {
      box(0.3, 0.35, 5.2, IRON, x0, 2.7, 0);
      crackedEgg(x0 - 0.05, 3.0, 0, 0.95);
    });

    // ---- jaulas ----
    const FRONT = 2.9, GAPX = 0.2, DW = 1.5;
    const barsRun = (ax, az, bx, bz, h = 2.0, parent) => {
      const len = Math.hypot(bx - ax, bz - az), n = Math.max(2, Math.round(len / 0.42));
      const dx = (bx - ax) / len, dz = (bz - az) / len, alongX = Math.abs(dx) > 0.5;
      for (let i = 0; i <= n; i++) {
        const px = ax + dx * len * i / n, pz = az + dz * len * i / n;
        cyl(0.032, 0.032, h, IRON, px, 0, pz, { seg: 5, parent }); cone(0.05, 0.16, IRON_L, px, h, pz, { seg: 4, parent });
      }
      const mx = (ax + bx) / 2, mz = (az + bz) / 2;
      for (const hy of [0.3, h * 0.55, h - 0.08]) {
        if (alongX) box(len, 0.07, 0.07, IRON, mx, hy, mz, { parent }); else box(0.07, 0.07, len, IRON, mx, hy, mz, { parent });
      }
    };
    const floorLabel = (text, x, z, w = 3.2) => { // nombre pintado en el suelo de la jaula (se lee desde la cámara)
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
      const g = cv.getContext('2d');
      const paint = () => {
        const t = typeof text === 'function' ? text() : text;
        g.clearRect(0, 0, cv.width, cv.height);
        let fs = 70; g.font = `700 ${fs}px system-ui, "Segoe UI", sans-serif`;
        while (g.measureText(t).width > 480 && fs > 30) { fs -= 4; g.font = `700 ${fs}px system-ui, "Segoe UI", sans-serif`; }
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 12; g.strokeStyle = 'rgba(30,22,14,.85)'; g.strokeText(t, 256, 66);
        g.fillStyle = '#e6d9b8'; g.fillText(t, 256, 66);
      };
      paint();
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      if (typeof text === 'function') repaints.push(() => { paint(); tex.needsUpdate = true; });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, 0.135, z); m.userData.noBake = true; stat.add(m);
    };
    const eggTints = { fuego: 0x6a3a22, agua: 0x2a4f70, aire: 0x6a8290, tierra: 0x4a4a28 };
    const rows = [SPECIES.slice(0, NORTH_COUNT), SPECIES.slice(NORTH_COUNT)];
    const corners = [[], []];
    rows.forEach((list, ri) => {
      const row = ri === 0 ? -1 : 1;                       // -1 = norte, +1 = sur
      const zf = row * FRONT, zb = row > 0 ? z1 - 0.25 : z0 + 0.25;
      const zmin = Math.min(zf, zb), zmax = Math.max(zf, zb), zm = (zmin + zmax) / 2, inside = -row;
      let cursor = x0 + 0.65;
      list.forEach((sp, i) => {
        const cx0 = cursor, CW = i === list.length - 1 ? Math.max(sp.w, x1 - 0.5 - cx0) : sp.w, cx1 = cx0 + CW, cxm = (cx0 + cx1) / 2;   // la última jaula de cada fila llega hasta el cercado: sin huecos en el frente
        cursor = cx1 + GAPX;
        box(CW - 0.3, 0.05, zmax - zmin - 0.4, 0x6a5a3c, cxm, 0.06, zm, { flat: true });           // cama de paja
        // frente fijo + puerta que se abre
        const hingeX = cxm - DW / 2;
        barsRun(cx0, zf, hingeX, zf); barsRun(cxm + DW / 2, zf, cx1, zf);
        for (const sx of [-1, 1]) box(0.14, 2.3, 0.14, IRON, cxm + sx * (DW / 2), 0, zf);
        box(DW + 0.3, 0.12, 0.14, IRON, cxm, 2.3, zf);
        const door = new THREE.Group(); door.position.set(hingeX + 0.07, 0, zf); dyn.add(door);
        barsRun(0.05, 0, DW - 0.19, 0, 1.9, door);
        box(DW - 0.14, 0.08, 0.1, IRON, (DW - 0.14) / 2, 0.15, 0, { parent: door });
        box(0.2, 0.26, 0.12, 0xc99a3b, DW - 0.3, 1.0, 0, { parent: door });                         // candado
        addBox(cx0 - 0.1, hingeX, zf - 0.13, zf + 0.13); addBox(cxm + DW / 2, cx1 + 0.1, zf - 0.13, zf + 0.13);
        const doorBox = { x0: hingeX, x1: cxm + DW / 2, z0: zf - 0.13, z1: zf + 0.13, off: false }; colliders.boxes.push(doorBox);
        if (i < list.length - 1) { const dv = cx1 + GAPX / 2; barsRun(dv, zmin, dv, zmax, 2.0); addBox(dv - 0.12, dv + 0.12, zmin, zmax); }
        corners[ri].push(cx0 - GAPX / 2);
        // interior: nombre y, mientras no esté el modelo 3D, un nido con huevos del elemento
        floorLabel(() => sp.name.toUpperCase(), cxm, zf + inside * 0.95);
        if (!sp.model) {
          const nx = cxm, nz = zm + inside * 0.5;
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.3, 8, 18), M(0x6a5236)); ring.rotation.x = Math.PI / 2; put(ring, nx, 0.3, nz);
          cyl(0.95, 0.95, 0.12, 0x4e3d2c, nx, 0.06, nz, { seg: 16 });
          for (let e = 0; e < 3; e++) { const a = e * 2.1 + 0.5; ball(0.27, eggTints[sp.element], nx + Math.cos(a) * 0.34, 0.5, nz + Math.sin(a) * 0.34, { s: [1, 1.3, 1], w: 10, h: 8, mat: glow(ELEMENTS[sp.element].color, 0.45) }); }
          addCircle(nx, nz, 1.15);
        }
        cages.push({
          id: sp.id, species: sp, x: cxm, z: zm, facing: row, zf, doorX: cxm, doorBox, door, open: 0, hingeX, inward: -inside,
          x0: cx0 + 0.3, x1: cx1 - 0.3, z0: zmin + 0.3, z1: zmax - 0.3,
        });
      });
      corners[ri].push(cursor - GAPX / 2);
      for (const px of corners[ri]) { box(0.18, 2.3, 0.18, IRON, px, 0, zf); cone(0.12, 0.26, IRON_L, px, 2.3, zf, { seg: 4 }); }
    });
    addZone({
      id: 'criaderos', name: 'Criaderos', desc: 'Una jaula por criatura · cría y combina', css: '#5fd6a4',
      en: { name: 'Breeding Grounds', desc: 'One cage per creature · breed and combine' },
      x: 45.2, z: 0, r: 26.6, ring: { x: 22.7, z: 0, r: 2.1 },
      label: { x: x0, y: 5.2, z: 0 },
    });
  }

  // =====================================================================
  //  TIENDA (sur) y ENFERMERÍA (a su lado)
  // =====================================================================
  keepRect(-10, 10, 21, 27); keepRect(11, 25, 21, 27); // frente de la tienda y la enfermería
  const crate = (x, z, s = 1, ry = 0) => { box(s, s, s, 0x7a5c3c, x, 0, z, { ry }); addCircle(x, z, s * 0.62); };
  const bottle = (x, y, z, color) => {
    cyl(0.11, 0.13, 0.28, color, x, y, z, { seg: 8, mat: glow(color, 1.1) });
    cyl(0.05, 0.05, 0.12, 0x8a8272, x, y + 0.28, z, { seg: 6 });
  };
  const awning = (cx, cz, w, y, c1, c2, depth = 2.3) => {
    const g = new THREE.Group(); g.position.set(cx, y, cz); g.rotation.x = -0.22; curParent.add(g);
    const n = Math.round(w / 1.1);
    for (let i = 0; i < n; i++) box(w / n, 0.1, depth, i % 2 ? c2 : c1, -w / 2 + (i + 0.5) * (w / n), 0, -depth / 2, { parent: g });
  };
  const hangLantern = (x, y, z, col = 0xffb35c, k = 1.4) => {
    cyl(0.02, 0.02, 0.35, IRON, x, y + 0.2, z, { seg: 4 });
    box(0.26, 0.34, 0.26, col, x, y - 0.14, z, { mat: glow(col, k) });
  };
  {
    // ---------------- TIENDA: se entra por la puerta norte; mostrador del tendero al fondo, puestos a los lados ----------------
    const cx = 0, cz = 31, w = 13, d = 8, h = 3.0, roofH = 1.7;
    const H = house({ cx, cz, w, d, h, wall: 0x86694e, roof: 0x7a3a32, roofH, trim: WOOD_D, ridgeAlongX: true, windowsS: [-4.2, 4.2], door: { side: 'n', w: 2.6, h: 2.6 }, floor: 0x7a5a3c });
    withParent(H.R, () => { // toldo sobre la puerta y frasco gigante sobre el techo
      awning(cx, cz - d / 2 - 0.1, 4.6, 2.9, 0x8a2a2a, 0xcfc4a8, 1.7);
      const ry = h + roofH, fc = 0x7a4fd0;
      ball(0.95, fc, cx, ry + 1.3, cz, { mat: glow(fc, 0.9) });
      cyl(0.32, 0.4, 0.9, fc, cx, ry + 2.0, cz, { seg: 10, mat: glow(fc, 0.9) });
      cyl(0.4, 0.4, 0.3, WOOD_L, cx, ry + 2.85, cz, { seg: 10 });
    });
    H.finish('tienda');
    // fuera: farolillos junto a la puerta, cartel sobre el dintel y cajas
    for (const s of [-1, 1]) { cyl(0.09, 0.09, 2.7, WOOD_D, s * 2.55, 0, 25.9, { seg: 6 }); addCircle(s * 2.55, 25.9, 0.2); hangLantern(s * 2.55, 2.5, 25.5); }
    fadeGroup('tienda', () => signBoard(() => L('TIENDA', 'SHOP'), 0, 3.0, 26.7, 2.4, { posts: false, h: 0.55 }));
    crate(-8.4, 28.6); crate(-8.4, 29.9, 0.9, 0.3); crate(8.4, 28.8, 1.1, -0.2);
    for (const [bx, bz] of [[8.6, 26.0], [9.7, 27.0]]) { cyl(0.5, 0.5, 0.95, 0x5e4534, bx, 0, bz, { seg: 12 }); addCircle(bx, bz, 0.5); }

    // dentro: alfombra roja del acceso
    box(3.4, 0.015, 4.8, 0x7a2a28, 0, 0.09, 29.4, { flat: true });
    box(3.0, 0.015, 4.4, 0xa8482e, 0, 0.1, 29.4, { flat: true });
    // mostrador del tendero con libro de cuentas y balanza; él se para detrás
    box(4.8, 1.0, 0.9, WOOD, 0, 0, 30.4); box(5.1, 0.1, 1.1, WOOD_L, 0, 1.0, 30.4);
    addBox(-2.6, 2.6, 29.9, 30.9);
    box(0.5, 0.06, 0.36, 0x6a2a24, -1.5, 1.1, 30.4, { ry: 0.2 });
    cylX(0.02, 0.9, IRON_L, 1.3, 1.55, 30.4); cyl(0.02, 0.02, 0.45, IRON_L, 1.3, 1.1, 30.4, { seg: 4 });
    for (const s of [-1, 1]) cyl(0.17, 0.17, 0.03, IRON_L, 1.3 + s * 0.4, 1.12, 30.4, { seg: 10 });
    for (let i = 0; i < 4; i++) ball(0.09, [0xe0b040, 0xd0d0d8, 0xe0b040, 0xb87a40][i], -0.4 + i * 0.28, 1.17, 30.2 + (i % 2) * 0.2, { s: [1, 0.35, 1], w: 8, h: 5 }); // monedas
    // estanterías del fondo: frascos, tarros y libros
    for (const sx of [-4.1, 0, 4.1]) {
      box(3.7, 2.4, 0.5, WOOD_D, sx, 0, 34.35); addBox(sx - 1.85, sx + 1.85, 34.1, 34.6);
      for (const sy of [0.55, 1.2, 1.85]) box(3.6, 0.06, 0.52, WOOD, sx, sy, 34.08);
      for (const [row, sy] of [[0, 0.61], [1, 1.26], [2, 1.91]]) for (let i = 0; i < 7; i++) {
        const bx = sx - 1.55 + i * 0.52, col = [0x9b59d6, 0x4cc36a, 0x4a8fe0, 0xe0554a, 0xf0c040, 0xa8f0c8, 0xf06e96][(((i + row * 3 + Math.round(sx)) % 7) + 7) % 7];
        if ((i + row) % 3 === 2) box(0.34, 0.3, 0.28, [0x6a2a24, 0x2a4a5a, 0x5a4a2a][(i + row) % 3], bx, sy, 34.08);
        else bottle(bx, sy, 34.08, col);
      }
    }
    // puesto de manzanas (izquierda): cestas con una manzana de cada elemento
    box(3.2, 1.0, 1.1, WOOD, -4.4, 0, 28.9); box(3.5, 0.1, 1.3, WOOD_L, -4.4, 1.0, 28.9); addBox(-6.0, -2.8, 28.35, 29.45);
    [[0xd8402a, -5.4], [0x3a8fd0, -4.7], [0xdcecf4, -4.0], [0x8aa84a, -3.3]].forEach(([col, ax]) => {
      cyl(0.3, 0.24, 0.2, WOOD_L, ax, 1.1, 28.9, { seg: 10 });
      for (const [dx, dz, dy] of [[0, 0, 0.3], [0.13, 0.08, 0.2], [-0.12, 0.1, 0.2], [0.02, -0.13, 0.2]]) appleBall(ax + dx, 1.2 + dy + 0.05, 28.9 + dz, col);
    });
    signBoard(() => L('MANZANAS', 'APPLES'), -4.4, 1.1, 29.35, 2.4, { posts: false, h: 0.5 });
    // puesto de comida (derecha): pescado, carne y hogazas
    box(3.2, 1.0, 1.1, WOOD, 4.4, 0, 28.9); box(3.5, 0.1, 1.3, WOOD_L, 4.4, 1.0, 28.9); addBox(2.8, 6.0, 28.35, 29.45);
    for (let i = 0; i < 3; i++) {
      const fx = 3.5 + i * 0.95;
      if (i === 0) { for (const dz of [-0.2, 0.2]) { ball(0.17, 0xa8b4bc, fx, 1.2, 28.9 + dz, { s: [2.2, 0.55, 0.7] }); cone(0.1, 0.2, 0xa8b4bc, fx + 0.42, 1.1, 28.9 + dz, { seg: 4, rz: -Math.PI / 2 }); } }
      else if (i === 1) { cyl(0.025, 0.025, 0.6, IRON, fx, 1.1, 28.9, { seg: 5 }); for (const dy of [0.0, 0.18, 0.36]) ball(0.11, 0x8a3a2a, fx, 1.35 + dy, 28.9, { s: [1, 1.2, 1] }); }
      else { for (const dz of [-0.2, 0.18]) ball(0.2, 0xb88a4a, fx, 1.24, 28.9 + dz, { s: [1.6, 0.8, 1] }); }
    }
    signBoard(() => L('COMIDA', 'FOOD'), 4.4, 1.1, 29.35, 2.0, { posts: false, h: 0.5 });
    // rincón de aspectos (izquierda al fondo): maniquíes con las capas y estandartes con los colores de la piel del dragón
    signBoard(() => L('ASPECTOS', 'LOOKS'), -4.4, 1.9, 31.4, 2.4);
    [[-5.1, 32.7, 0x28345c], [-3.8, 33.2, 0x3f5a3a], [-2.6, 32.6, 0xa01e2a]].forEach(([mx, mz, col]) => mannequin(mx, mz, col, 0.15));
    [[0x7a2a26, -5.6], [0x405088, -4.9]].forEach(([col, bx]) => { cyl(0.035, 0.035, 2.4, IRON, bx, 0, 29.8, { seg: 5 }); box(0.5, 1.2, 0.05, col, bx, 0.9, 29.8); });
    // rincón de la derecha al fondo: barriles, sacos y cajas de mercancía
    for (const [bx, bz] of [[5.5, 33.7], [4.6, 34.0]]) { cyl(0.5, 0.5, 0.95, 0x5e4534, bx, 0, bz, { seg: 12 }); addCircle(bx, bz, 0.5); }
    crate(5.5, 32.3, 0.9, 0.2); crate(4.3, 32.6, 0.8, -0.3);
    for (const [sx, sz] of [[2.6, 33.5], [2.1, 32.6]]) { ball(0.4, 0xc9b890, sx, 0.3, sz, { s: [1, 0.8, 1.2] }); addCircle(sx, sz, 0.42); }
    lanternPost(-2.3, 33.4); lanternPost(2.3, 33.4);
    addZone({
      id: 'tienda', name: 'Tienda', desc: 'Comida, manzanas elementales y aspectos', css: '#e8c05a',
      en: { name: 'Shop', desc: 'Food, elemental apples and looks' },
      x: 0, z: 31, r: 5.6, ring: { x: 0, z: 28.6, r: 2.4 }, label: { x: 0, y: 8.6, z: cz },
    });
  }
  {
    // ---------------- ENFERMERÍA: mostrador de las doctoras, camas con convalecientes, armarios y el caldero del Dr. Cuervo ----------------
    const cx = 18, cz = 31, w = 9, d = 8, h = 3.0, roofH = 1.7;
    const H = house({ cx, cz, w, d, h, wall: 0xd2cebd, roof: 0x44726a, roofH, trim: 0x6a8078, ridgeAlongX: true, windowsS: [-2.5, 2.5], glowCol: 0x9fe8c0, door: { side: 'n', w: 2.4, h: 2.6 }, floor: 0xbab4a2 });
    withParent(H.R, () => {
      awning(cx, cz - d / 2 - 0.1, 4.2, 2.8, 0x44726a, 0xe0dccd, 1.6);
      const ry = h + roofH; // cruz roja sobre el techo (visible desde ambos lados)
      cylZ(1.75, 0.22, 0xc9c6bb, cx, ry + 2.2, cz + 0.2, { seg: 28 });
      for (const zz of [cz + 0.45, cz - 0.05]) {
        box(2.5, 0.8, 0.34, 0xb02a2a, cx, ry + 1.8, zz, { mat: glow(0x601010, 0.8) });
        box(0.8, 2.5, 0.34, 0xb02a2a, cx, ry + 0.95, zz, { mat: glow(0x601010, 0.8) });
      }
      cyl(0.14, 0.14, 1.3, 0x4a4f4c, cx, ry - 0.05, cz + 0.2, { seg: 6 });
    });
    H.finish('enfermeria');
    for (const s of [-1, 1]) { cyl(0.09, 0.09, 2.6, 0x5a6a65, cx + s * 2.2, 0, 25.9, { seg: 6 }); addCircle(cx + s * 2.2, 25.9, 0.2); hangLantern(cx + s * 2.2, 2.4, 25.5, 0xa8f0c8, 1.2); }
    fadeGroup('enfermeria', () => signBoard(() => L('ENFERMERÍA', 'INFIRMARY'), cx, 2.95, 26.7, 2.7, { posts: false, bg: 0x44726a, panel: '#e6e2d2', ink: '#2c5a50', h: 0.55 }));
    // dentro: mostrador de recepción (las doctoras se paran detrás), con carteles, libro y frascos
    box(4.4, 0.95, 0.8, 0xaaa595, 18.1, 0, 29.8); box(4.7, 0.08, 1.0, 0xd8d4c4, 18.1, 0.95, 29.8);
    addBox(15.9, 20.3, 29.35, 30.25);
    box(0.5, 0.05, 0.38, 0x6a2a24, 16.4, 1.03, 29.8, { ry: -0.2 });
    for (const [bx, col] of [[19.6, 0xf06e96], [19.9, 0xa8f0c8]]) bottle(bx, 1.03, 29.7, col);
    signBoard(() => L('CURAR', 'HEALING'), 17.0, 1.03, 30.15, 1.5, { posts: false, bg: 0x44726a, panel: '#e6e2d2', ink: '#2c5a50', h: 0.5 });
    signBoard(() => L('POCIONES', 'POTIONS'), 19.1, 1.03, 30.15, 1.7, { posts: false, bg: 0x44726a, panel: '#e6e2d2', ink: '#2c5a50', h: 0.5 });
    // camas contra la pared oeste; dos con un convaleciente bajo la manta (cabeza y cola asoman)
    [[28.3, 0x4a6a3a], [31.0, null], [33.7, 0x6a4a3a]].forEach(([bz, scale]) => {
      box(2.0, 0.35, 0.9, 0x4a4f58, 15.0, 0, bz); box(1.9, 0.18, 0.82, 0xb4b0a2, 15.0, 0.35, bz); box(0.42, 0.12, 0.55, 0xeeeadd, 14.35, 0.52, bz);
      addBox(14.0, 16.0, bz - 0.45, bz + 0.45);
      if (scale) {
        ball(0.34, 0x44726a, 15.35, 0.72, bz, { s: [2.0, 0.7, 1.25], w: 10, h: 8 });
        ball(0.16, scale, 14.55, 0.68, bz + 0.06, { s: [1.3, 0.95, 1], w: 8, h: 6 }); cone(0.045, 0.16, 0xd8cfb8, 14.5, 0.76, bz + 0.2, { seg: 4, rz: 0.5 });
        ball(0.09, 0xff9a3a, 14.43, 0.7, bz - 0.03, { w: 6, h: 4, mat: glow(0xff6a1a, 1.4) });
        cone(0.09, 0.5, scale, 16.2, 0.55, bz, { seg: 6, rz: -Math.PI / 2 });
      } else box(1.2, 0.14, 0.86, 0xd8d4c4, 15.35, 0.53, bz);
      cyl(0.025, 0.025, 1.9, IRON_L, 16.3, 0, bz + 0.62, { seg: 5 }); box(0.14, 0.22, 0.06, 0x9fe8c0, 16.3, 1.55, bz + 0.62, { mat: glow(0x9fe8c0, 1.2) });
    });
    // mesa de pociones del Dr. Cuervo con una botella de cada poción del catálogo, y su caldero burbujeante
    box(1.7, 0.95, 1.1, 0xaaa595, 21.2, 0, 31.4); addBox(20.35, 22.05, 30.85, 31.95);
    [0xe0554a, 0x8a8f96, 0x6ab4f0, 0x4cc36a, 0x9b59d6].forEach((col, i) => bottle(20.6 + (i % 3) * 0.5, 0.95, 31.15 + Math.floor(i / 3) * 0.5, col));
    cyl(0.62, 0.5, 0.75, 0x2a2c30, 21.3, 0, 33.4, { seg: 14 }); cyl(0.5, 0.5, 0.03, 0x4cc36a, 21.3, 0.74, 33.4, { seg: 14, mat: glow(0x4cc36a, 1.5) });
    for (let k = 0; k < 4; k++) ball(0.07 + (k % 2) * 0.03, 0x9ff0b0, 21.3 + Math.cos(k * 1.7) * 0.25, 0.95 + k * 0.12, 33.4 + Math.sin(k * 1.7) * 0.25, { w: 6, h: 5, mat: glow(0x9ff0b0, 1.2) });
    for (const a of [0, 2.1, 4.2]) cone(0.06, 0.45, IRON, 21.3 + Math.cos(a) * 0.55, 0, 33.4 + Math.sin(a) * 0.55, { seg: 4 });
    addCircle(21.3, 33.4, 0.7);
    // armarios de botiquines contra la pared sur (con cruz roja) y botiquines apilados junto a la puerta
    for (const ax of [16.2, 18.1, 20.0]) {
      box(1.7, 2.0, 0.5, 0xaaa595, ax, 0, 34.35); box(1.5, 1.5, 0.05, 0x9fe8c0, ax, 0.35, 34.08, { mat: glow(0x9fe8c0, 0.35) });
      box(0.4, 0.12, 0.06, 0xb02a2a, ax, 1.55, 34.05); box(0.12, 0.4, 0.06, 0xb02a2a, ax, 1.41, 34.05);
      addBox(ax - 0.85, ax + 0.85, 34.1, 34.6);
    }
    for (const [kx, kz, ky] of [[21.4, 28.3, 0], [21.4, 28.3, 0.62], [20.5, 28.1, 0]]) { box(0.9, 0.55, 0.6, 0xb4b0a2, kx, ky, kz); box(0.5, 0.1, 0.62, 0xa02424, kx, ky + 0.56, kz); }
    addCircle(21.4, 28.3, 0.6); addCircle(20.5, 28.1, 0.55);
    lanternPost(16.9, 33.2);
    addZone({
      id: 'enfermeria', name: 'Enfermería', desc: 'Doctores, pociones y botiquines', css: '#e0607f',
      en: { name: 'Infirmary', desc: 'Doctors, potions and first-aid kits' },
      x: 18, z: 31, r: 5, ring: { x: 18, z: 28.4, r: 2.3 }, label: { x: cx, y: 8.8, z: cz },
    });
  }

  // ---------- árboles muertos, pinos oscuros, rocas y hongos luminosos ----------
  {
    const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
    const pineGeo = mergeParts([
      { geo: new THREE.ConeGeometry(1.3, 2.6, 7), m: T(0, 2.1, 0) },
      { geo: new THREE.ConeGeometry(1.0, 2.2, 7), m: T(0, 3.5, 0) },
      { geo: new THREE.ConeGeometry(0.68, 1.9, 7), m: T(0, 4.7, 0) },
    ]);
    // árbol muerto: tronco retorcido con ramas desnudas
    const deadParts = [{ geo: new THREE.CylinderGeometry(0.12, 0.3, 3.6, 6), m: T(0, 1.8, 0) }];
    for (let k = 0; k < 6; k++) {
      const len = 1.3 - k * 0.1, yaw = k * 2.3, tilt = 0.9 - k * 0.04, y = 1.6 + k * 0.38;
      const m = T(0, y, 0).multiply(new THREE.Matrix4().makeRotationY(yaw)).multiply(new THREE.Matrix4().makeRotationZ(-tilt)).multiply(T(0, len / 2, 0));
      deadParts.push({ geo: new THREE.CylinderGeometry(0.03, 0.08, len, 5), m });
    }
    const deadGeo = mergeParts(deadParts);
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.8, 7); trunkGeo.translate(0, 0.9, 0);
    const trees = [];
    let tries = 0;
    while (trees.length < 260 && tries++ < 12000) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (BOUND - 1.5);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!isFree(x, z, 1.2)) continue;
      if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 3.6)) continue;
      trees.push({ x, z, s: R(0.85, 1.35), kind: rnd() < 1 - (theme.trees.deadRatio) ? 0 : 1, yaw: R(0, 6.28), solid: true });
    }
    for (const rr of [72, 75.4, 79]) {
      const n = Math.round((2 * Math.PI * rr) / 2.4);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + R(-0.04, 0.04) + rr, q = rr + R(-0.9, 0.9);
        const t = { x: Math.cos(a) * q, z: Math.sin(a) * q, s: R(1.3, 1.9), kind: rnd() < 1 - theme.trees.deadRatio * 0.6 ? 0 : 1, yaw: R(0, 6.28) };
        if (t.x > PEN.x0 && t.x < PEN.x1 + 3.4 && Math.abs(t.z) < PEN.z1 + 3.4) continue;   // el bosque de fondo no se mete en la valla de Criaderos
        trees.push(t);
      }
    }
    const pines = trees.filter((t) => t.kind === 0), deads = trees.filter((t) => t.kind === 1);
    const q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), m4 = new THREE.Matrix4(), c = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
    const mk = (geo, list, palette, flat) => {
      const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: flat, roughness: 0.92, metalness: 0 }), list.length);
      list.forEach((t, i) => {
        q.setFromAxisAngle(up, t.yaw); s.set(t.s, t.s * R(0.92, 1.15), t.s); p.set(t.x, 0, t.z);
        m4.compose(p, q, s); im.setMatrixAt(i, m4);
        c.setHex(palette[Math.floor(rnd() * palette.length)]); im.setColorAt(i, c);
      });
      im.castShadow = true; im.userData.noBake = true; stat.add(im);
    };
    mk(pineGeo, pines, theme.trees.pines, true);
    mk(deadGeo, deads, theme.trees.dead, false);
    const trunks = new THREE.InstancedMesh(trunkGeo, M(0x4a382a), pines.length);
    pines.forEach((t, i) => { s.set(t.s, t.s, t.s); p.set(t.x, 0, t.z); q.identity(); m4.compose(p, q, s); trunks.setMatrixAt(i, m4); });
    trunks.castShadow = true; trunks.userData.noBake = true; stat.add(trunks);
    for (const t of trees) if (t.solid) addCircle(t.x, t.z, 0.5 * t.s);

    // rocas grandes (sólidas)
    const rockGeo = new THREE.IcosahedronGeometry(1, 0);
    const rocks = [];
    tries = 0;
    while (rocks.length < 46 && tries++ < 6000) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (BOUND - 3);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!isFree(x, z, 1.6) || trees.some((t) => t.solid && Math.hypot(t.x - x, t.z - z) < 2.6)) continue;
      rocks.push({ x, z, s: R(0.7, 1.35) });
    }
    const rim = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.95, metalness: 0 }), rocks.length);
    rocks.forEach((rk, i) => {
      q.setFromAxisAngle(up, R(0, 6.28)); s.set(rk.s * R(1, 1.4), rk.s * R(0.6, 0.9), rk.s * R(1, 1.3)); p.set(rk.x, rk.s * 0.25, rk.z);
      m4.compose(p, q, s); rim.setMatrixAt(i, m4);
      c.setHex(theme.rock[i % theme.rock.length]); rim.setColorAt(i, c);
      addCircle(rk.x, rk.z, rk.s * 1.05);
    });
    rim.castShadow = true; rim.receiveShadow = true; rim.userData.noBake = true; stat.add(rim);

    // pasto seco y hongos luminosos (adorno sin colisión, a ras de suelo)
    const tuftGeo = mergeParts([
      { geo: new THREE.ConeGeometry(0.07, 0.5, 4), m: T(0, 0.25, 0) },
      { geo: new THREE.ConeGeometry(0.06, 0.4, 4), m: T(0.1, 0.2, 0.05).multiply(new THREE.Matrix4().makeRotationZ(-0.3)) },
      { geo: new THREE.ConeGeometry(0.06, 0.4, 4), m: T(-0.09, 0.2, -0.04).multiply(new THREE.Matrix4().makeRotationZ(0.3)) },
    ]);
    const shroomGeo = mergeParts([
      { geo: new THREE.CylinderGeometry(0.025, 0.035, 0.16, 5), m: T(0, 0.08, 0) },
      { geo: new THREE.SphereGeometry(0.1, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), m: T(0, 0.15, 0) },
    ]);
    const scatter = (geo, mat, n, palette, k0, k1) => {
      const im = new THREE.InstancedMesh(geo, mat, n);
      let i = 0, tr = 0;
      while (i < n && tr++ < n * 12) {
        const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (BOUND + 2);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (!isFree(x, z, 0.2)) continue;
        const k = R(k0, k1);
        q.setFromAxisAngle(up, R(0, 6.28)); s.set(k, k, k); p.set(x, 0, z);
        m4.compose(p, q, s); im.setMatrixAt(i, m4);
        c.setHex(palette[Math.floor(rnd() * palette.length)]); im.setColorAt(i, c); i++;
      }
      im.count = i; im.userData.noBake = true; stat.add(im);
    };
    scatter(tuftGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), 2000, theme.tuft, 0.9, 1.7);
    scatter(shroomGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), 520, theme.shroom, 0.9, 1.8);
  }

  // ---------- detalles propios de cada escenario ----------
  const ex = theme.extras || [];
  if (ex.includes('lava')) { // grietas y lagos de lava
    const core = new THREE.MeshBasicMaterial({ color: 0xff7a1a }), halo = new THREE.MeshBasicMaterial({ color: 0xff4a10, transparent: true, opacity: 0.28, depthWrite: false });
    const crack = (cx, cz, len, ang, w) => {
      const a = put(new THREE.Mesh(new THREE.BoxGeometry(len, 0.03, w), core), cx, 0.05, cz, stat, true); a.rotation.y = -ang;
      const b = put(new THREE.Mesh(new THREE.BoxGeometry(len + 0.3, 0.02, w * 3.4), halo), cx, 0.04, cz, stat, true); b.rotation.y = -ang;
    };
    let n = 0, tr = 0;
    while (n < 160 && tr++ < 6000) {
      const a0 = rnd() * 6.28, r0 = Math.sqrt(rnd()) * (BOUND + 8), x0 = Math.cos(a0) * r0, z0 = Math.sin(a0) * r0;
      if (!isFree(x0, z0, 2.5)) continue;
      let px = x0, pz = z0, ang = rnd() * 6.28;
      for (let k = 0, kk = Math.floor(R(3, 7)); k < kk; k++) {
        const len = R(1.5, 3.6), nx = px + Math.cos(ang) * len, nz = pz + Math.sin(ang) * len;
        if (isFree(nx, nz, 2.0)) crack((px + nx) / 2, (pz + nz) / 2, len, ang, R(0.12, 0.3));
        ang += R(-0.8, 0.8); px = nx; pz = nz;
      }
      n++;
    }
    for (const [lx, lz, lr] of [[-38, -14, 5], [36, -24, 4], [10, 40, 3.4], [-26, 36, 4.2]]) {
      if (Math.hypot(lx, lz) > BOUND - 2) continue;
      const rim = new THREE.Mesh(new THREE.CircleGeometry(lr * 1.25, 28), M(0x1a1514)); rim.rotation.x = -Math.PI / 2; put(rim, lx, 0.04, lz, stat, true);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(lr, 28), core); pool.rotation.x = -Math.PI / 2; put(pool, lx, 0.06, lz, stat, true);
      addCircle(lx, lz, lr * 1.05);
    }
  }
  if (ex.includes('pools')) { // charcos de agua oscura
    const water = new THREE.MeshStandardMaterial({ color: 0x1d2a1a, roughness: 0.04, metalness: 0.0 });
    let n = 0, tr = 0;
    while (n < 16 && tr++ < 1500) {
      const a = rnd() * 6.28, r = Math.sqrt(rnd()) * (BOUND - 3), x = Math.cos(a) * r, z = Math.sin(a) * r, pr = R(1.4, 4.2);
      if (!isFree(x, z, pr + 0.8)) continue;
      const mud = new THREE.Mesh(new THREE.CircleGeometry(pr * 1.22, 24), M(0x2d2616)); mud.rotation.x = -Math.PI / 2; put(mud, x, 0.04, z, stat, true);
      const w = new THREE.Mesh(new THREE.CircleGeometry(pr, 24), water); w.rotation.x = -Math.PI / 2; put(w, x, 0.06, z, stat, true);
      keepCircle(x, z, pr * 1.3); n++;
    }
  }
  if (ex.includes('banners')) { // estandartes rojos a lo largo de los caminos
    const spots = [[-3.2, -11.5, 0], [3.2, -11.5, 0], [-3.2, -17.5, 0], [3.2, -17.5, 0], [-3.2, 11.5, 0], [3.2, 11.5, 0], [-3.2, 18, 0], [3.2, 18, 0],
      [-11.5, -3.2, 1], [-11.5, 3.2, 1], [-18, -3.2, 1], [-18, 3.2, 1], [11.5, -3.2, 1], [11.5, 3.2, 1], [17, -3.2, 1], [17, 3.2, 1]];
    for (const [bx, bz, along] of spots) {
      cyl(0.07, 0.09, 4.4, IRON, bx, 0, bz, { seg: 6 });
      box(0.06, 0.22, 1.0, IRON, bx, 4.2, bz, { ry: along ? Math.PI / 2 : 0 });
      const side = bx < 0 || (along && bz < 0) ? 1 : -1;
      box(along ? 0.9 : 0.06, 2.0, along ? 0.06 : 0.9, 0x8a1c1c, bx, 2.1, bz, {});
      void side;
      addCircle(bx, bz, 0.25);
    }
  }

  // ---------- fusionar lo fijo por material (pocas llamadas de dibujo) ----------
  {
    stat.updateMatrixWorld(true);
    const buckets = new Map(), meshes = [];
    stat.traverse((o) => { if (o.isMesh && !o.userData.noBake && !o.isInstancedMesh) meshes.push(o); });
    for (const o of meshes) {
      const key = o.material.uuid + (o.userData.flat ? 'f' : 'c');
      let b = buckets.get(key);
      if (!b) { b = { material: o.material, flat: !!o.userData.flat, parts: [] }; buckets.set(key, b); }
      b.parts.push({ geo: o.geometry, m: o.matrixWorld.clone() });
    }
    for (const o of meshes) o.removeFromParent();
    for (const b of buckets.values()) {
      const mesh = new THREE.Mesh(mergeParts(b.parts), b.material);
      mesh.castShadow = !b.flat; mesh.receiveShadow = true; mesh.userData.merged = true;
      stat.add(mesh);
    }
  }

  return {
    colliders, zones, PEN, cages, fades, spawn: { x: 0, z: 1.5 },
    update(dt, t, activeId, pp, camPos) {
      for (const f of updaters) f(dt, t);
      if (pp && camPos) { // edificios que tapan al jugador (o a quien atiende en su zona) se vuelven translúcidos
        _b.set(pp.x, 1.0, pp.z);
        aimWatch(dt, pp, camPos);
        for (const f of fades) {
          const dist = f.box.distanceToPoint(_b);
          const inside = !!f.inner && pp.x > f.inner.x0 && pp.x < f.inner.x1 && pp.z > f.inner.z0 && pp.z < f.inner.z1;
          let hit = false;
          if (dist < 18) {
            // la caja del grupo solo filtra (incluye el frasco, la cruz o la pesa del techo): lo que decide es el rayo contra la malla real
            if (f.boxWide.containsPoint(camPos) || blocks(f.boxWide, camPos, _b) || (watchN > 7 && blocks(f.boxWide, camPos, watch[8]))) hit = seesPlayer(f, camPos);   // (la cámara en tercera persona puede quedar dentro de la caja, junto a la puerta)
            if (!hit && dist < 10) for (const q of f.pts) if (Math.hypot(pp.x - q.x, pp.z - q.z) < 10 && blocks(f.box, camPos, q) && blocksReal(f, camPos, q)) { hit = true; break; }
          }
          // el techo desaparece por completo cuando estás adentro; las paredes solo se aclaran si tapan la vista
          const want = f.kind === 'roof' ? (inside || hit ? 0 : 1) : (hit ? 0.14 : 1);
          f.op += (want - f.op) * Math.min(1, dt * (want < f.op ? 14 : 7));   // se aclara rápido y vuelve despacio
          f.g.visible = f.op > 0.03;
          const tr = f.op < 0.99;
          for (const m of f.mats) {
            m.opacity = f.op; m.depthWrite = f.op > 0.5;
            if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
          }
        }
      }
      if (pp) for (const c of cages) {
        const inside = pp.x > c.x0 - 0.4 && pp.x < c.x1 + 0.4 && (c.facing < 0 ? pp.z < c.zf + 0.5 : pp.z > c.zf - 0.5) && pp.z > c.z0 - 0.4 && pp.z < c.z1 + 0.4;
        const near = Math.abs(pp.x - c.doorX) < 1.3 && Math.abs(pp.z - c.zf) < 2.0;
        const target = (inside || near) ? 1 : 0;
        c.open += (target - c.open) * Math.min(1, dt * 5);
        c.door.position.x = c.hingeX + 0.07 + 1.4 * c.open; c.door.position.z = c.zf + c.inward * 0.28 * c.open;       // corre hacia un lado, por dentro de la jaula
        c.doorBox.off = c.open > 0.45;
      }
      for (const z of zones) {
        const fx = z.fx, on = z.id === activeId;
        fx.active += ((on ? 1 : 0) - fx.active) * Math.min(1, dt * 8);
        const pulse = 1 + 0.035 * Math.sin(t * 3 + z.x);
        fx.ring.scale.setScalar(pulse); fx.fill.scale.setScalar(pulse);
        fx.ringMat.opacity = 0.45 + 0.40 * fx.active;   // VIS-BESTIARIO-03: .45 inactivo / .85 activo, sin oscilación extra
        fx.fillMat.opacity = 0.06 + 0.12 * fx.active;
      }
    },
  };
}
