// Escenarios del pueblo: cada tema cambia paleta, suelo, luz, niebla, vegetación y detalles.
// Todos son de diseño propio. El mundo (world.js) los recibe como parámetro.
import * as THREE from '../vendor/three.module.js';
import { biAll } from './i18n.js';

const tmp = new THREE.Color(), hsl = {};
const cl = (v, a, b) => (v < a ? a : v > b ? b : v);

// transforma un color de construcción según el tema (matiz, saturación, luminosidad, tinte)
export function tintColor(hex, theme) {
  const t = theme.tint;
  if (!t) return hex;
  tmp.setHex(hex); tmp.getHSL(hsl);
  hsl.h = (hsl.h + (t.hue || 0) + 1) % 1; hsl.s = cl(hsl.s * (t.sat ?? 1), 0, 1); hsl.l = cl(hsl.l * (t.light ?? 1) + (t.lift || 0), 0, 1);
  tmp.setHSL(hsl.h, hsl.s, hsl.l);
  if (t.mul) { tmp.r *= t.mul[0]; tmp.g *= t.mul[1]; tmp.b *= t.mul[2]; }
  return tmp.getHex();
}

export const THEMES = [
  {
    id: 'ceniza', name: 'Aldea de ceniza',
    desc: 'Día nublado y apagado. Piedra y madera gastadas, suelo de pasto seco y ceniza, caminos de tierra.',
    sky: 0xaab6b6, fog: [0xa6afb0, 55, 130], hemi: [0xe2eaf2, 0x7a826c, 1.5], sun: [0xfff0dc, 2.6], sunPos: [-18, 30, 16], exposure: 1.0,
    env: { top: 0xc6d2de, horizon: 0x9aa3a8, ground: 0x4a4a44, key: 0xfff0dc, keyPower: 6 },
    ground: { dark: 0x3f4a37, mid: 0x546042, light: 0x6b7853, ash: 0x7d7a6e, ashAmt: 0.6 },
    tint: { sat: 0.85, light: 1.0 }, cover: { color: 0x8a877e, amount: 0.22 }, dirt: { color: 0x2f2a24, amount: 0.35 },
    trees: { pines: [0x24452f, 0x2c5238, 0x1f3d2b], dead: [0x4a3d32, 0x3d3228, 0x5a4c40], deadRatio: 0.45 },
    rock: [0x6a6a70, 0x7a7a82, 0x5a5a62], tuft: [0x6a6e46, 0x7a7648, 0x5a6a40], shroom: [0x8affd0, 0x9ab8ff], extras: [],
    en: { name: 'Ash Village', desc: 'An overcast, muted day. Worn stone and timber, dry grass and ash underfoot, dirt roads.' },
  },
  {
    id: 'fortaleza', name: 'Fortaleza de piedra',
    desc: 'Frío y severo. Grava gris azulada, piedra clara con escarcha, luz fría y estandartes rojos a lo largo de los caminos.',
    sky: 0xa4b0c0, fog: [0x9aa6b6, 45, 125], hemi: [0xdde6f4, 0x6a7078, 1.5], sun: [0xe8f0ff, 2.4], sunPos: [-18, 30, 16], exposure: 1.0,
    env: { top: 0xbcc8dc, horizon: 0x9aa4b4, ground: 0x44484e, key: 0xe8f0ff, keyPower: 6 },
    ground: { dark: 0x3b4247, mid: 0x4a5359, light: 0x5b666c, ash: 0x6a737a, ashAmt: 0.5 },
    tint: { sat: 0.55, light: 1.0, mul: [0.92, 0.98, 1.1] }, cover: { color: 0xb8c4d0, amount: 0.3 }, dirt: { color: 0x24282c, amount: 0.4 },
    trees: { pines: [0x1f3a38, 0x264644, 0x1a3230], dead: [0x4a4a4e, 0x3e3e42], deadRatio: 0.3 },
    rock: [0x6a727c, 0x7a828c, 0x5a626c], tuft: [0x5a6a64, 0x6a7a74], shroom: [0x9ab8ff, 0xbfd0ff], extras: ['banners'],
    en: { name: 'Stone Fortress', desc: 'Cold and stern. Blue-grey gravel, pale frosted stone, cold light and red banners along the roads.' },
  },
  {
    id: 'pantano', name: 'Pantano maldito',
    desc: 'Aire pesado y verdoso. Barro, musgo sobre todas las superficies, charcos oscuros, árboles muertos y niebla espesa.',
    sky: 0x9aa070, fog: [0x8c9a62, 22, 85], hemi: [0xe0e8b0, 0x4a5030, 1.4], sun: [0xf0e8b0, 1.9], sunPos: [-14, 24, 14], exposure: 1.0,
    env: { top: 0xb0b888, horizon: 0x8a9462, ground: 0x3a4026, key: 0xf0e8b0, keyPower: 5 },
    ground: { dark: 0x2a3220, mid: 0x3d4a2a, light: 0x56683a, ash: 0x4a3f2a, ashAmt: 0.7 },
    tint: { hue: 0.02, sat: 1.0, light: 0.92, mul: [1.0, 1.04, 0.85] }, cover: { color: 0x5a7a30, amount: 0.38 }, dirt: { color: 0x1f2410, amount: 0.5 },
    trees: { pines: [0x2f4a28, 0x3a5a2c, 0x26401f], dead: [0x4a4030, 0x3a3324, 0x544a38], deadRatio: 0.7 },
    rock: [0x5a6050, 0x6a7058, 0x4a5040], tuft: [0x5a7a30, 0x6a8a38, 0x4a6a28], shroom: [0xc8ff3a, 0x9aff5a], extras: ['pools'],
    en: { name: 'Cursed Swamp', desc: 'Heavy, greenish air. Mud, moss on every surface, dark pools, dead trees and thick fog.' },
  },
  {
    id: 'volcanico', name: 'Páramo volcánico',
    desc: 'Roca negra y ceniza bajo un cielo de humo rojizo. Grietas de lava en el suelo, árboles calcinados y luz baja y anaranjada.',
    sky: 0x6a3a2c, fog: [0x6a382a, 25, 95], hemi: [0xffd2b4, 0x4a2c20, 1.5], sun: [0xffb078, 2.7], sunPos: [-26, 16, 10], exposure: 1.05,
    env: { top: 0x8a4a30, horizon: 0xa8603a, ground: 0x2a1a14, key: 0xffa060, keyPower: 8 },
    ground: { dark: 0x1b1818, mid: 0x2a2424, light: 0x3b3331, ash: 0x4a4340, ashAmt: 0.8 },
    tint: { sat: 0.8, light: 0.95, mul: [1.06, 0.95, 0.9] }, cover: { color: 0x5a534e, amount: 0.4 }, dirt: { color: 0x140e0c, amount: 0.5 },
    trees: { pines: [0x2a2623, 0x211e1c, 0x332e2a], dead: [0x1c1917, 0x26211e, 0x141210], deadRatio: 0.8 },
    rock: [0x2e2a2a, 0x3a3434, 0x242020], tuft: [0x4a3a2a, 0x5a4430, 0x3a2c20], shroom: [0xff7a2a, 0xffa040], extras: ['lava'],
    en: { name: 'Volcanic Wasteland', desc: 'Black rock and ash under a reddish, smoky sky. Lava cracks in the ground, charred trees and low orange light.' },
  },
  {
    id: 'nevado', name: 'Páramo helado',
    desc: 'Nieve profunda y cielo blanco. Todo lo horizontal queda cubierto, pinos escarchados, rocas azuladas y luz clara y fría.',
    sky: 0xcfdbe6, fog: [0xc6d4e0, 35, 115], hemi: [0xeaf2fa, 0x9aa8b8, 1.8], sun: [0xfff6e6, 2.3], sunPos: [-18, 30, 16], exposure: 1.0,
    env: { top: 0xd8e6f4, horizon: 0xc0ccd8, ground: 0x9aa4ae, key: 0xfff6e6, keyPower: 5 },
    ground: { dark: 0xc2cfdc, mid: 0xdce6f0, light: 0xf0f5fa, ash: 0xaab6c4, ashAmt: 0.5 },
    tint: { sat: 0.7, light: 1.05, mul: [0.96, 1.0, 1.08] }, cover: { color: 0xf4f8fc, amount: 0.95 }, dirt: { color: 0x6a645e, amount: 0.15 },
    trees: { pines: [0x3a5a58, 0x45706a, 0x30504c], dead: [0x6a6258, 0x5a5248, 0x7a7268], deadRatio: 0.35 },
    rock: [0x8a929c, 0x9aa2ac, 0x7a828c], tuft: [0xcfd8e0, 0xb8c4cc], shroom: [0x9fe8ff, 0xbfd8ff], extras: [],
    en: { name: 'Frozen Wasteland', desc: 'Deep snow and a white sky. Everything flat lies buried, frosted pines, bluish rocks and clear, cold light.' },
  },
];
biAll(THEMES);

// luces, niebla y fondo de un tema (el entorno de reflejos lo arma quien llama con makeEnv)
export function lightScene(scene, theme, { shadow = 2048, area = 27 } = {}) {
  scene.background = new THREE.Color(theme.sky);
  scene.fog = new THREE.Fog(theme.fog[0], theme.fog[1], theme.fog[2]);
  const hemi = new THREE.HemisphereLight(theme.hemi[0], theme.hemi[1], theme.hemi[2]);
  const sun = new THREE.DirectionalLight(theme.sun[0], theme.sun[1]);
  sun.position.set(...theme.sunPos); sun.castShadow = true; sun.shadow.mapSize.set(shadow, shadow);
  Object.assign(sun.shadow.camera, { left: -area, right: area, top: area, bottom: -area, near: 1, far: 140 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
  scene.add(hemi, sun, sun.target);
  return { hemi, sun };
}
