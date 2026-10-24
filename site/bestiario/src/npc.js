// Personal del pueblo: el tendero, los dos doctores y la entrenadora. Figuras de diseño propio armadas con formas
// simples (como el viajero, pero con rostro), con respiración, mirada hacia el jugador y un saludo al llegar.
import * as THREE from '../vendor/three.module.js';
import { biAll, onLang } from './i18n.js';

const mats = new Map();
const mat = (color, extra) => {
  const key = color + (extra ? JSON.stringify(extra) : '');
  let m = mats.get(key);
  if (!m) { m = new THREE.MeshLambertMaterial({ color, ...extra }); mats.set(key, m); }
  return m;
};
const glowMat = (color, k = 1.4) => new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: k });
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function add(parent, geo, m, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z); mesh.castShadow = true;
  parent.add(mesh); return mesh;
}

// cuerpo base: caderas en y=0.86; devuelve las articulaciones para animar
function base(o) {
  const skin = mat(o.skin), pants = mat(o.pants), boot = mat(o.boot || 0x3a2b22), shirt = mat(o.shirt);
  const s = o.s || 1, wide = o.wide || 1;
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body); body.scale.setScalar(s);
  const legs = [];
  for (const x of [-0.1, 0.1]) {
    const g = new THREE.Group(); g.position.set(x * wide, 0.86, 0); body.add(g);
    add(g, new THREE.CapsuleGeometry(0.088, 0.62, 3, 8), pants, 0, -0.4, 0);
    add(g, new THREE.BoxGeometry(0.17, 0.12, 0.3), boot, 0, -0.79, 0.045);
    legs.push(g);
  }
  const torso = new THREE.Group(); torso.position.y = 0.86; body.add(torso);
  add(torso, new THREE.CylinderGeometry(0.2 * wide, 0.17 * wide, 0.6, 12), shirt, 0, 0.3, 0);
  add(torso, new THREE.SphereGeometry(0.225 * wide, 12, 8), shirt, 0, 0.58, 0).scale.set(1.1, 0.5, 0.78);
  add(torso, new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), skin, 0, 0.68, 0);
  const head = new THREE.Group(); head.position.set(0, 0.84, 0); torso.add(head);
  add(head, new THREE.SphereGeometry(0.15, 16, 12), skin, 0, 0.1, 0).scale.set(0.92, 1.08, 0.98);
  add(head, new THREE.ConeGeometry(0.03, 0.08, 5), skin, 0, 0.07, 0.15).rotation.x = Math.PI / 2;           // nariz
  for (const x of [-1, 1]) {
    add(head, new THREE.SphereGeometry(0.02, 8, 6), mat(0x120c0a), x * 0.06, 0.12, 0.135);                  // ojos
    add(head, new THREE.BoxGeometry(0.06, 0.012, 0.02), mat(o.brow || 0x2a1e18), x * 0.06, 0.16, 0.14).rotation.z = -x * 0.14; // cejas
    add(head, new THREE.SphereGeometry(0.035, 8, 6), skin, x * 0.145, 0.09, 0).scale.set(0.5, 1, 0.8);     // orejas
  }
  add(head, new THREE.BoxGeometry(0.07, 0.012, 0.02), mat(0x3a1a14), 0, 0.01, 0.135);                         // boca
  const arms = [];
  for (const x of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(x * 0.255 * wide, 0.54, 0); torso.add(g);
    add(g, new THREE.CapsuleGeometry(0.058, 0.26, 3, 8), o.sleeves === false ? skin : shirt, 0, -0.17, 0);
    const el = new THREE.Group(); el.position.set(0, -0.34, 0); g.add(el);
    add(el, new THREE.CapsuleGeometry(0.05, 0.24, 3, 8), o.sleeves === false ? skin : shirt, 0, -0.15, 0);
    add(el, new THREE.SphereGeometry(0.052, 8, 6), mat(o.glove || o.skin), 0, -0.32, 0);
    g.userData.elbow = el;
    arms.push(g);
  }
  return { root, body, torso, head, legs, arms };
}

// ---- cada personaje
const BUILD = {
  tendero() {
    const f = base({ skin: 0xc9a07e, shirt: 0x5a4a38, pants: 0x3a3430, s: 1.0, wide: 1.12, brow: 0x8a8a84 });
    const { torso, head } = f;
    add(torso, new THREE.CylinderGeometry(0.235, 0.21, 0.5, 12, 1, false), mat(0xcfc4a8), 0, 0.22, 0.0).scale.set(1, 1, 1.12); // mandil
    add(torso, new THREE.BoxGeometry(0.34, 0.1, 0.04), mat(0x7a5c3c), 0, 0.5, 0.2);
    add(torso, new THREE.CylinderGeometry(0.215, 0.215, 0.07, 12), mat(0x46321f), 0, 0.02, 0);                              // cinto
    const pouch = add(torso, new THREE.SphereGeometry(0.07, 8, 6), mat(0x6e503a), 0.2, 0.0, 0.14); pouch.scale.set(1, 1.2, 0.9);
    add(head, new THREE.CylinderGeometry(0.28, 0.28, 0.025, 18), mat(0x4f3d36), 0, 0.22, 0);                                // sombrero
    add(head, new THREE.CylinderGeometry(0.15, 0.17, 0.17, 14), mat(0x4f3d36), 0, 0.31, 0);
    add(head, new THREE.CylinderGeometry(0.17, 0.17, 0.035, 14), mat(0x8a2a2a), 0, 0.26, 0);
    const beard = add(head, new THREE.ConeGeometry(0.115, 0.3, 10), mat(0xb4b2ac), 0, -0.07, 0.07); beard.rotation.x = 0.1;
    add(head, new THREE.SphereGeometry(0.1, 10, 8), mat(0xb4b2ac), 0, 0.03, 0.09).scale.set(1.1, 0.6, 0.7);                 // bigote
    for (const x of [-1, 1]) add(head, new THREE.TorusGeometry(0.036, 0.007, 5, 12), mat(0xc9a248), x * 0.062, 0.12, 0.15);  // anteojos
    // libro de cuentas en la mano izquierda
    const book = add(f.arms[0].userData.elbow, new THREE.BoxGeometry(0.2, 0.04, 0.27), mat(0x6a2a24), 0, -0.34, 0.12); book.rotation.x = -0.3;
    f.rest = [-0.7, 0.5, -0.5, 0.9];  // [brazo izq x, codo izq, brazo der x, codo der]
    return f;
  },
  doctora() {
    const f = base({ skin: 0xd8b494, shirt: 0xe4e2da, pants: 0x4a4f58, s: 0.98, boot: 0x2e2824 });
    const { torso, head } = f;
    add(torso, new THREE.ConeGeometry(0.4, 1.05, 14, 1, true), mat(0xe4e2da, { side: THREE.DoubleSide }), 0, -0.1, 0);       // bata larga
    add(torso, new THREE.CylinderGeometry(0.215, 0.215, 0.06, 12), mat(0x3a5c52), 0, 0.12, 0);
    add(torso, new THREE.TorusGeometry(0.1, 0.035, 6, 14), mat(0x3a8a6a), 0, 0.66, 0.02).rotation.x = Math.PI / 2;           // bufanda
    add(head, new THREE.SphereGeometry(0.158, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(0x3a2418), 0, 0.11, -0.012);   // pelo
    add(head, new THREE.SphereGeometry(0.075, 10, 8), mat(0x3a2418), 0, 0.12, -0.17);                                        // moño
    add(head, new THREE.CylinderGeometry(0.14, 0.15, 0.06, 14), mat(0xf0eee6), 0, 0.25, 0.02);                               // gorro
    add(head, new THREE.BoxGeometry(0.1, 0.03, 0.02), mat(0xb02a2a), 0, 0.26, 0.15);
    add(head, new THREE.BoxGeometry(0.03, 0.1, 0.02), mat(0xb02a2a), 0, 0.26, 0.15);
    // maletín con cruz
    const bag = add(f.arms[1].userData.elbow, new THREE.BoxGeometry(0.2, 0.16, 0.1), mat(0x5a3a28), 0, -0.4, 0.02);
    add(bag, new THREE.BoxGeometry(0.06, 0.02, 0.02), mat(0xb02a2a), 0, 0.0, 0.055); add(bag, new THREE.BoxGeometry(0.02, 0.06, 0.02), mat(0xb02a2a), 0, 0.0, 0.055);
    f.rest = [-0.12, 0.3, -0.1, 0.35];
    return f;
  },
  doctor() {
    const f = base({ skin: 0xb8906e, shirt: 0x2e2a2a, pants: 0x2a2a30, s: 1.06, wide: 1.04, glove: 0x1e1a18 });
    const { torso, head } = f;
    add(torso, new THREE.ConeGeometry(0.42, 1.15, 14, 1, true), mat(0x2e2420, { side: THREE.DoubleSide }), 0, -0.14, 0);      // gabán de cuero
    add(torso, new THREE.CylinderGeometry(0.235, 0.21, 0.52, 12), mat(0x8a7a62), 0, 0.2, 0).scale.set(1, 1, 1.1);            // mandil
    add(torso, new THREE.CylinderGeometry(0.22, 0.22, 0.06, 12), mat(0x1e1a18), 0, 0.06, 0);
    // máscara de pico (cuero con lentes de latón)
    add(head, new THREE.SphereGeometry(0.162, 14, 10), mat(0x3a2e26), 0, 0.1, 0.01).scale.set(0.98, 1.05, 1.0);
    const beak = add(head, new THREE.ConeGeometry(0.075, 0.4, 10), mat(0x3a2e26), 0, 0.045, 0.34); beak.rotation.x = Math.PI / 2 + 0.2;
    add(head, new THREE.ConeGeometry(0.03, 0.12, 6), mat(0x4a3c30), 0, 0.0, 0.5).rotation.x = Math.PI / 2 + 0.3;
    for (const x of [-1, 1]) {
      add(head, new THREE.TorusGeometry(0.045, 0.011, 6, 14), mat(0xb08a3a), x * 0.07, 0.13, 0.15);
      add(head, new THREE.CircleGeometry(0.04, 12), glowMat(0x9ff0c0, 1.1), x * 0.07, 0.13, 0.152);
    }
    add(head, new THREE.CylinderGeometry(0.26, 0.26, 0.025, 18), mat(0x1e1a18), 0, 0.22, 0);                                // sombrero
    add(head, new THREE.CylinderGeometry(0.14, 0.16, 0.15, 14), mat(0x1e1a18), 0, 0.3, 0);
    // bastón con farol verde
    const staff = add(f.arms[1].userData.elbow, new THREE.CylinderGeometry(0.018, 0.018, 1.7, 6), mat(0x4a3a2c), 0, -0.3, 0.06);
    add(staff, new THREE.BoxGeometry(0.12, 0.16, 0.12), glowMat(0x7af0a8, 1.6), 0, 0.82, 0);
    add(staff, new THREE.ConeGeometry(0.1, 0.1, 4), mat(0x2a2a2a), 0, 0.95, 0);
    f.rest = [-0.1, 0.25, -0.35, 0.4];
    return f;
  },
  arbitro() {
    const f = base({ skin: 0xa8795a, shirt: 0x3a2a2a, pants: 0x2a2a30, s: 1.1, wide: 1.2, boot: 0x1e1a18, glove: 0x2a2020, brow: 0x1a1210 });
    const { torso, head } = f;
    add(torso, new THREE.ConeGeometry(0.46, 1.1, 14, 1, true), mat(0x6a1e22, { side: THREE.DoubleSide }), 0, -0.14, -0.06);        // capa roja rasgada
    add(torso, new THREE.CylinderGeometry(0.25, 0.22, 0.34, 12), mat(0x5a5a62), 0, 0.42, 0);                                       // pechera de placas
    for (const x of [-1, 1]) add(torso, new THREE.SphereGeometry(0.17, 10, 8), mat(0x6a6a74), x * 0.3, 0.6, 0).scale.set(1, 0.7, 1); // hombreras
    add(torso, new THREE.CylinderGeometry(0.22, 0.22, 0.07, 12), mat(0x46321f), 0, 0.06, 0);
    add(head, new THREE.SphereGeometry(0.165, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(0x5a5a62), 0, 0.12, 0);               // yelmo
    for (const x of [-1, 1]) add(head, new THREE.ConeGeometry(0.05, 0.32, 6), mat(0xd8cfb8), x * 0.17, 0.26, 0).rotation.z = -x * 0.7; // cuernos
    add(head, new THREE.BoxGeometry(0.05, 0.14, 0.04), mat(0x5a5a62), 0, 0.08, 0.16);                                              // nasal
    // bandera de la arena en la mano derecha
    const pole = add(f.arms[1].userData.elbow, new THREE.CylinderGeometry(0.02, 0.02, 2.1, 6), mat(0x4a3a2c), 0, -0.2, 0.06);
    add(pole, new THREE.BoxGeometry(0.5, 0.7, 0.03), mat(0x8a1c1c), 0.26, 0.7, 0);
    f.rest = [-0.1, 0.25, -0.35, 0.4];
    return f;
  },
  entrenadora() {
    const f = base({ skin: 0xb27a56, shirt: 0x4a3e38, pants: 0x3a3a40, s: 1.04, wide: 1.2, sleeves: false, boot: 0x2e2420, brow: 0x1e1410 });
    const { torso, head } = f;
    add(torso, new THREE.CylinderGeometry(0.232, 0.2, 0.34, 12), mat(0x8a3a2a), 0, 0.46, 0);                                // túnica sin mangas
    add(torso, new THREE.CylinderGeometry(0.22, 0.22, 0.09, 12), mat(0x46321f), 0, 0.06, 0);
    add(torso, new THREE.BoxGeometry(0.14, 0.14, 0.04), mat(0xc9a248), 0, 0.06, 0.22);
    for (const g of f.arms) {                                                                                                  // vendas
      add(g.userData.elbow, new THREE.CylinderGeometry(0.058, 0.056, 0.16, 8), mat(0xd8cfb8), 0, -0.2, 0);
    }
    add(head, new THREE.SphereGeometry(0.155, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(0x2a1a12), 0, 0.12, -0.02);     // pelo corto
    add(head, new THREE.CapsuleGeometry(0.04, 0.2, 3, 6), mat(0x2a1a12), 0, 0.06, -0.19).rotation.x = 0.5;                   // cola
    add(head, new THREE.TorusGeometry(0.152, 0.018, 6, 20), mat(0xb02a2a), 0, 0.17, 0).rotation.x = Math.PI / 2 - 0.12;       // cinta
    add(head, new THREE.BoxGeometry(0.012, 0.1, 0.012), mat(0xc4806a), 0.05, 0.1, 0.14).rotation.z = 0.5;                    // cicatriz
    f.rest = [-0.25, 1.5, -0.25, 1.5];  // brazos en jarras
    return f;
  },
};

const ROLE_COLOR = { tendero: '#e8c05a', doctora: '#e0607f', doctor: '#e0607f', entrenadora: '#f0a23a', arbitro: '#ff5a3c' };

// rótulo con nombre y oficio; paint() lo vuelve a pintar (al cambiar de idioma cambia el oficio)
function paintTag(cv, name, title, css) {
  const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
  g.fillStyle = 'rgba(9,11,15,.82)'; g.beginPath(); g.roundRect(8, 8, 496, 124, 28); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = css; g.beginPath(); g.arc(44, 70, 12, 0, 7); g.fill();
  g.textBaseline = 'middle'; g.fillStyle = '#f2eee4'; g.font = '700 46px system-ui, "Segoe UI", sans-serif';
  g.fillText(name, 74, 52);
  g.fillStyle = 'rgba(242,238,228,.7)'; g.font = '500 34px system-ui, "Segoe UI", sans-serif';
  g.fillText(title, 74, 98);
}
function tagSprite(d, css) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 140;
  paintTag(cv, d.name, d.title, css);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  // tamaño constante en pantalla (sizeAttenuation falso): se ajusta cada cuadro en update()
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false }));
  sp.renderOrder = 20;
  sp.userData.repaint = () => { paintTag(cv, d.name, d.title, css); tex.needsUpdate = true; };
  return sp;
}

export const NPC_DEFS = biAll([
  { id: 'garrick', build: 'arbitro', zone: 'pelea', name: 'Garrick', title: 'Maestro de la arena', x: 0, z: -24.6, yaw: 0, tab: 'liga',
    lines: ['Aquí se pelea por turnos y con honor. Ocho maestros guardan la Liga; yo soy el último.', 'Los jefes pagan bien, pero no perdonan.', 'Cada emblema se gana en la arena. Ninguno se compra.'],
    en: { title: 'Master of the arena', lines: ['Here we fight in turns and with honor. Eight masters guard the League; I am the last.', 'Bosses pay well, but they show no mercy.', 'Every emblem is earned in the arena. None can be bought.'] } },
  { id: 'ildefonso', build: 'tendero', zone: 'tienda', name: 'Ildefonso', title: 'Tendero', x: 0, z: 31.6, yaw: Math.PI, tab: 'comida',
    lines: ['¡Pasa, pasa! Comida fresca, manzanas con rocío y aspectos para ti y tus criaturas.', 'Todo lo que tengo sale de caminos que ya no pisa nadie.'],
    en: { title: 'Shopkeeper', lines: ['Come in, come in! Fresh food, dewy apples and new looks for you and your creatures.', 'Everything I sell comes from roads nobody travels anymore.'] } },
  { id: 'vesper', build: 'doctora', zone: 'enfermeria', name: 'Dra. Vesper', title: 'Cura de criaturas', x: 17.0, z: 31.0, yaw: Math.PI, tab: 'curar',
    lines: ['Deja a tu criatura en la camilla. Yo me ocupo de las heridas.', 'Un botiquín a tiempo vale más que un héroe.'],
    en: { name: 'Dr. Vesper', title: 'Creature healer', lines: ['Leave your creature on the cot. I’ll take care of the wounds.', 'A first-aid kit in time is worth more than a hero.'] } },
  { id: 'cuervo', build: 'doctor', zone: 'enfermeria', name: 'Dr. Cuervo', title: 'Pociones y botiquines', x: 19.2, z: 31.0, yaw: Math.PI, tab: 'pociones',
    lines: ['Mis pociones duran varios combates, aunque pierdas. Elige con cuidado.', 'No te fíes de la máscara: yo sí curo.'],
    en: { name: 'Dr. Raven', title: 'Potions and first-aid kits', lines: ['My potions last several battles, even if you lose. Choose carefully.', 'Don’t trust the mask: I really do heal.'] } },
  { id: 'brenna', build: 'entrenadora', zone: 'gimnasio', name: 'Brenna', title: 'Entrenadora', x: -27.5, z: 1.9, yaw: Math.PI / 2, tab: 'entrenar',
    lines: ['Una criatura fuerte se hace con sudor, no con suerte.', 'Si se agota, a la Enfermería. Y no me la devuelvas sin comer.'],
    en: { title: 'Trainer', lines: ['A strong creature is made with sweat, not luck.', 'If it’s worn out, off to the Infirmary. And don’t bring it back to me unfed.'] } },
]);

export class Npcs {
  constructor(scene, world) {
    this.list = [];
    for (const d of NPC_DEFS) {
      const f = BUILD[d.build]();
      const root = f.root;
      root.position.set(d.x, 0, d.z); root.rotation.y = d.yaw;
      scene.add(root);
      const tag = tagSprite(d, ROLE_COLOR[d.build]);
      tag.position.set(0, 2.9, 0); root.add(tag);
      world.colliders.circles.push({ x: d.x, z: d.z, r: 0.5 });
      const n = { def: d, f, root, tag, yaw0: d.yaw, head: 0, greet: 0, ph: Math.random() * 6, near: false, say: 0 };
      this.list.push(n);
    }
    onLang(() => { for (const n of this.list) n.tag.userData.repaint(); });
  }

  // el más cercano que esté a la distancia de conversación
  nearest(pp, range = 4.4) {
    let best = null, bd = range;
    for (const n of this.list) {
      const d = Math.hypot(pp.x - n.def.x, pp.z - n.def.z);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  line(n) { n.say = (n.say + 1) % n.def.lines.length; return n.def.lines[n.say]; }

  update(dt, t, pp, camera) {
    // altura del rótulo en pantalla: ~5 % del alto, entre 34 y 52 px
    const px = Math.max(34, Math.min(52, innerHeight * 0.05)), k = (px / innerHeight) * 2 * Math.tan((camera.fov * Math.PI) / 360);
    for (const n of this.list) {
      n.tag.scale.set(k * 3.65, k, 1);
      const { f, def } = n;
      const dx = pp.x - def.x, dz = pp.z - def.z, d = Math.hypot(dx, dz);
      const near = d < 7;
      if (near && !n.near) n.greet = 1.8;                                       // saluda al verte llegar
      n.near = near;
      n.greet = Math.max(0, n.greet - dt);
      // gira el torso y la cabeza hacia el jugador, sin pasarse de ±70° ni de ±1.2 rad la cabeza
      const want = near ? wrap(Math.atan2(dx, dz) - def.yaw) : 0;
      const body = Math.max(-0.5, Math.min(0.5, want * 0.55));
      n.head += (Math.max(-1.0, Math.min(1.0, want - body)) - n.head) * Math.min(1, dt * 4);
      n.cur = (n.cur || 0) + (body - (n.cur || 0)) * Math.min(1, dt * 3);
      f.torso.rotation.y = n.cur; f.head.rotation.y = n.head;
      f.head.rotation.x = Math.sin(t * 0.7 + n.ph) * 0.03;
      f.torso.scale.y = 1 + Math.sin(t * 1.8 + n.ph) * 0.012;                    // respira
      f.body.position.y = 0;
      const [a0, e0, a1, e1] = f.rest;
      const sway = Math.sin(t * 1.1 + n.ph) * 0.03;
      f.arms[0].rotation.x = a0 + sway; f.arms[0].userData.elbow.rotation.x = -e0;
      let ax = a1 - sway, ex = e1;
      if (n.greet > 0) {                                                          // brazo derecho levantado, saludando
        const k = Math.min(1, n.greet * 3, (1.8 - n.greet) * 3 + 0.0001);
        ax = a1 + (-2.5 - a1) * k; ex = e1 + (0.5 - e1) * k + Math.sin(t * 9) * 0.35 * k;
        f.arms[1].rotation.z = -0.25 * k;
      } else f.arms[1].rotation.z = 0;
      f.arms[1].rotation.x = ax; f.arms[1].userData.elbow.rotation.x = -ex;
      f.arms[0].rotation.z = def.build === 'entrenadora' ? -0.5 : 0;           // en jarras: los codos hacia afuera
      if (def.build === 'entrenadora' && n.greet <= 0) f.arms[1].rotation.z = 0.5;
      // el rótulo se ve cuando estás cerca
      const op = Math.max(0, Math.min(1, (22 - d) / 8));
      n.tag.material.opacity = op; n.tag.visible = op > 0.02;
    }
  }
}
