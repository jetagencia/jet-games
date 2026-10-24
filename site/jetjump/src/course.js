// Recorridos. Coordenadas del juego: X este, Y arriba, Z sur. Pista de 96 × 64 m centrada en el origen;
// la tribuna está al norte (Z negativa) mirando a la pista.
// dir: rumbo de salto en grados (0 = hacia +X, 90 = hacia +Z). Altura en metros.

import { lang } from './text.js';

export const ARENA = { w: 96, h: 64 };

const PAL = {
  azul: ['#ffffff', '#1f4f9c'], rojo: ['#ffffff', '#c0272d'], verde: ['#ffffff', '#1f7a4c'],
  oro: ['#ffffff', '#d4a017'], negro: ['#ffffff', '#1d1d1d'], celeste: ['#ffffff', '#3b8fd9'],
};

export const COURSES = {
  clasico: {
    name: 'Clásico', ta: 72, height: 1.10,
    start: { x: -36, z: 22, dir: 0, half: 4 },
    finish: { x: 31, z: -15, dir: 335, half: 5 },
    fences: [
      { n: '1', type: 'vertical', x: -24, z: 22, dir: 0, h: 1.0, pal: PAL.verde, filler: 'planter' },
      { n: '2', type: 'oxer', x: 4, z: 24, dir: 0, h: 1.05, spread: 1.2, pal: PAL.azul },
      { n: '3', type: 'vertical', x: 34, z: 4, dir: 270, h: 1.10, pal: PAL.rojo, filler: 'gate' },
      { n: '4', type: 'wall', x: 22, z: -21, dir: 180, h: 1.05 },
      { n: '5', type: 'oxer', x: -6, z: -22, dir: 180, h: 1.10, spread: 1.3, pal: PAL.oro, filler: 'planter' },
      { n: '6', type: 'vertical', x: -36, z: -2, dir: 90, h: 1.10, pal: PAL.celeste },
      { n: '7', type: 'oxer', x: -10, z: 4, dir: 335, h: 1.15, spread: 1.3, pal: PAL.rojo },
      { n: '8', type: 'vertical', x: 16, z: -8, dir: 335, h: 1.15, pal: PAL.negro, filler: 'planter' },
    ],
  },
  practica: {
    name: 'Práctica', ta: 0, height: 0.9, training: true,
    start: { x: -33, z: 2, dir: 0, half: 6 },
    finish: null,
    // óvalo: dos vallas hacia el este por el centro y dos hacia el oeste por el norte
    fences: [
      { n: 'A', type: 'vertical', x: -18, z: 2, dir: 0, h: 0.8, pal: PAL.verde, filler: 'planter' },
      { n: 'B', type: 'oxer', x: 14, z: 2, dir: 0, h: 0.9, spread: 1.0, pal: PAL.azul },
      { n: 'C', type: 'vertical', x: 14, z: -18, dir: 180, h: 1.0, pal: PAL.rojo, filler: 'gate' },
      { n: 'D', type: 'wall', x: -18, z: -18, dir: 180, h: 0.9 },
    ],
  },
  // pista vacía: trabajo plano y galope de fondo
  libre: { name: 'Pista libre', ta: 0, height: 0, training: true, start: { x: -34, z: 24, dir: 0, half: 6 }, finish: null, fences: [] },
  // trazados de las ligas (la altura de cada concurso se aplica con eventCourse)
  lazo: {
    name: 'Lazo', ta: 74, height: 1.10,
    start: { x: -38, z: -22, dir: 0, half: 4 },
    finish: { x: 40, z: -8, dir: 0, half: 5 },
    fences: [
      { n: '1', type: 'vertical', x: -22, z: -22, dir: 0, h: 1.0, pal: PAL.verde, filler: 'planter' },
      { n: '2', type: 'oxer', x: 6, z: -22, dir: 0, h: 1.05, spread: 1.2, pal: PAL.azul },
      { n: '3', type: 'vertical', x: 34, z: 0, dir: 90, h: 1.10, pal: PAL.rojo, filler: 'gate' },
      { n: '4', type: 'wall', x: 14, z: 22, dir: 180, h: 1.05 },
      { n: '5', type: 'oxer', x: -12, z: 22, dir: 180, h: 1.10, spread: 1.3, pal: PAL.oro, filler: 'planter' },
      { n: '6', type: 'vertical', x: -34, z: 2, dir: 270, h: 1.10, pal: PAL.celeste },
      { n: '7', type: 'oxer', x: -14, z: -8, dir: 0, h: 1.15, spread: 1.3, pal: PAL.rojo },
      { n: '8', type: 'vertical', x: 14, z: -8, dir: 0, h: 1.15, pal: PAL.negro, filler: 'planter' },
    ],
  },
  diagonal: {
    name: 'Diagonales', ta: 72, height: 1.10,
    start: { x: -38, z: 24, dir: 0, half: 4 },
    finish: { x: 26, z: 20, dir: 15, half: 5 },
    fences: [
      { n: '1', type: 'vertical', x: -24, z: 24, dir: 0, h: 1.0, pal: PAL.azul, filler: 'gate' },
      { n: '2', type: 'oxer', x: 2, z: 24, dir: 0, h: 1.05, spread: 1.2, pal: PAL.verde, filler: 'planter' },
      { n: '3', type: 'vertical', x: 34, z: 6, dir: 270, h: 1.10, pal: PAL.oro },
      { n: '4', type: 'wall', x: 34, z: -16, dir: 270, h: 1.05 },
      { n: '5', type: 'oxer', x: 6, z: -27, dir: 180, h: 1.10, spread: 1.3, pal: PAL.rojo },
      { n: '6', type: 'vertical', x: -22, z: -27, dir: 180, h: 1.10, pal: PAL.negro, filler: 'planter' },
      { n: '7', type: 'oxer', x: -33, z: -6, dir: 90, h: 1.15, spread: 1.3, pal: PAL.celeste },
      { n: '8', type: 'vertical', x: -4, z: 12, dir: 15, h: 1.15, pal: PAL.rojo, filler: 'gate' },
    ],
  },
  serpiente: {
    name: 'Serpiente', ta: 72, height: 1.10,
    start: { x: -37, z: 0, dir: 0, half: 4 },
    finish: { x: -36, z: -22, dir: 270, half: 5 },
    fences: [
      { n: '1', type: 'vertical', x: -26, z: 0, dir: 0, h: 1.0, pal: PAL.rojo, filler: 'planter' },
      { n: '2', type: 'oxer', x: -4, z: -12, dir: 331, h: 1.05, spread: 1.2, pal: PAL.celeste },
      { n: '3', type: 'vertical', x: 14, z: -24, dir: 0, h: 1.10, pal: PAL.verde, filler: 'gate' },
      { n: '4', type: 'wall', x: 40, z: -4, dir: 90, h: 1.05 },
      { n: '5', type: 'oxer', x: 20, z: 16, dir: 150, h: 1.10, spread: 1.3, pal: PAL.azul, filler: 'planter' },
      { n: '6', type: 'vertical', x: -4, z: 24, dir: 180, h: 1.10, pal: PAL.oro },
      { n: '7', type: 'oxer', x: -24, z: 14, dir: 205, h: 1.15, spread: 1.3, pal: PAL.negro },
      { n: '8', type: 'vertical', x: -36, z: -8, dir: 270, h: 1.15, pal: PAL.verde, filler: 'planter' },
    ],
  },
};

// Recorrido de un concurso de liga: el trazado con todas las alturas llevadas a la del concurso (el
// obstáculo más alto del trazado queda a la altura anunciada; los demás conservan su escalonado).
export function eventCourse(E) {
  const base = COURSES[E.layout], top = Math.max(...base.fences.map((F) => F.h));
  const k = E.h / top;
  const c = { ...base, ta: E.ta, height: E.h, fences: base.fences.map((F) => ({ ...F, h: +(F.h * k).toFixed(2) })) };
  Object.defineProperty(c, 'name', { get: () => E.name, enumerable: true, configurable: true });   // en el idioma del momento
  return c;
}

// Trabajo plano: puertas de conos en serpentina por la pista (sin obstáculos)
export const CONE_GATES = [
  { x: -30, z: 18, dir: 0 }, { x: -12, z: 8, dir: 330 }, { x: 6, z: 0, dir: 0 }, { x: 24, z: 8, dir: 30 },
  { x: 36, z: 22, dir: 90 }, { x: 22, z: 26, dir: 180 }, { x: 4, z: 18, dir: 200 }, { x: -14, z: 22, dir: 160 },
  { x: -34, z: 6, dir: 250 }, { x: -24, z: -12, dir: 330 }, { x: 0, z: -20, dir: 0 }, { x: 28, z: -16, dir: 20 },
];
// Galope de fondo: vueltas por el borde de la pista (puntos de paso en sentido horario)
export const LAP = [{ x: -36, z: -24 }, { x: 36, z: -24 }, { x: 40, z: 0 }, { x: 36, z: 24 }, { x: -36, z: 24 }, { x: -40, z: 0 }];

// Construye datos derivados de cada valla: vectores de avance (f) y lateral (l), barras, alto total.
export function prepareCourse(def) {
  const fences = def.fences.map((F, i) => {
    const a = F.dir * Math.PI / 180;
    const f = { x: Math.cos(a), z: Math.sin(a) };            // sentido de salto
    const l = { x: -f.z, z: f.x };                           // lateral
    const width = F.width || 3.6;
    const spread = F.type === 'oxer' ? (F.spread || 1.2) : F.type === 'wall' ? 0.5 : 0.0;
    // barras: posición a lo largo (a), alto del centro (y)
    const rails = [];
    if (F.type === 'vertical') {
      const n = F.h > 1.05 ? 4 : 3;
      for (let k = 0; k < n; k++) rails.push({ a: 0, y: F.h - k * (F.h - 0.25) / (n - 0.5) });
    } else if (F.type === 'oxer') {
      for (let k = 0; k < 3; k++) rails.push({ a: -spread / 2, y: (F.h - 0.05) - k * 0.33 });
      for (let k = 0; k < 2; k++) rails.push({ a: spread / 2, y: F.h - k * 0.36 });
    }
    return { ...F, i, ang: a, f, l, width, half: width / 2, spread, rails, depth: spread + 0.3 };
  });
  const out = { ...def, fences };
  const nd = Object.getOwnPropertyDescriptor(def, 'name'); if (nd && nd.get) Object.defineProperty(out, 'name', nd);
  return out;
}
// nombres de los recorridos en inglés (getter: siguen al idioma elegido en vivo)
for (const [k, en] of Object.entries({ clasico: 'Classic', practica: 'Practice', libre: 'Open arena', lazo: 'Loop', diagonal: 'Diagonals', serpiente: 'Serpentine' })) {
  const c = COURSES[k]; if (!c) continue; const es = c.name;
  Object.defineProperty(c, 'name', { get: () => (lang() === 'en' ? en : es), enumerable: true, configurable: true });
}
