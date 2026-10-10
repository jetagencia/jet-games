// JETJump — diseño de pistas.
// Coordenadas de pista: x (este), z (sur). Ángulo en grados: 0 = este, 90 = sur.
import { pathLength } from './sim.js';

export const ARENA = { w: 90, h: 60 };

export const SCHEMES = ['red', 'blue', 'green', 'gold', 'navy', 'orange', 'teal', 'black'];

export const FENCE_NAMES = {
  v: 'Vertical', o: 'Oxer', t: 'Triple barra', w: 'Muro', l: 'Liverpool', water: 'Ría', g: 'Vertical con tranquera',
};

// Diseños base: el orden define el recorrido. combo: elementos con dist (m) desde el último plano anterior.
export const LAYOUTS = {
  clasico: {
    name: 'Clásico', arena: { w: 96, h: 64 },
    start: { x: -36, z: -24, deg: 0 },
    finish: { x: 24, z: 22, deg: 90 },
    fences: [
      { t: 'v', x: -22, z: -24, deg: 0 },
      { t: 'o', x: 0, z: -24, deg: 0 },
      { t: 't', x: 36, z: 0, deg: 90 },
      { t: 'g', x: 36, z: 16, deg: 90 },
      { combo: [{ t: 'o', x: 12, z: 26, deg: 180 }, { t: 'v', dist: 7.8 }] },
      { t: 'w', x: -38, z: 6, deg: 270 },
      { t: 'o', x: -16, z: -11, deg: 0 },
      { t: 'l', x: 4, z: -11, deg: 0 },
      { combo: [{ t: 'v', x: 24, z: 2, deg: 90 }, { t: 'o', dist: 7.8 }] },
    ],
    jumpoff: [0, 2, 3, 6, 8, 9, 10],
  },
  rio: {
    name: 'Gran Premio', arena: { w: 96, h: 64 },
    start: { x: -40, z: 24, deg: 270 },
    finish: { x: -26, z: 16, deg: 180 },
    fences: [
      { t: 'v', x: -40, z: 8, deg: 270 },
      { t: 'o', x: -20, z: -24, deg: 0 },
      { t: 'water', x: 4, z: -25, deg: 0 },
      { t: 'v', x: 38, z: -4, deg: 90 },
      { combo: [{ t: 'o', x: 16, z: 26, deg: 180 }, { t: 'v', dist: 7.9 }] },
      { t: 't', x: -16, z: 26, deg: 180 },
      { t: 'g', x: -30, z: 2, deg: 270 },
      { combo: [{ t: 'v', x: -12, z: -9, deg: 0 }, { t: 'o', dist: 10.8 }] },
      { t: 'w', x: 22, z: 2, deg: 60 },
      { combo: [{ t: 'o', x: 14, z: 15, deg: 180 }, { t: 'v', dist: 7.8 }, { t: 'o', dist: 10.7 }] },
    ],
    jumpoff: [0, 2, 3, 4, 5, 7, 10, 11, 12, 13],
  },
  indoor: {
    name: 'Indoor', arena: { w: 74, h: 44 }, indoor: true,
    start: { x: -28, z: -17, deg: 0 },
    finish: { x: 24, z: -6, deg: 0 },
    fences: [
      { t: 'o', x: -14, z: -17, deg: 0 },
      { t: 'v', x: 8, z: -17, deg: 0 },
      { t: 'w', x: 30, z: 1, deg: 90 },
      { t: 'o', x: 12, z: 17, deg: 180 },
      { t: 'g', x: -8, z: 17, deg: 180 },
      { t: 't', x: -30, z: 6, deg: 270 },
      { combo: [{ t: 'v', x: -12, z: -6, deg: 0 }, { t: 'o', dist: 7.7 }] },
      { t: 'l', x: 14, z: -6, deg: 0 },
    ],
    jumpoff: [0, 2, 3, 5, 6, 7, 8],
  },
};

function planesFor(t, h) {
  switch (t) {
    case 'o': { const s = Math.min(Math.max(h * 0.95 + 0.05, 1.0), 1.9); return { planes: [{ o: 0, h: h - 0.05 }, { o: s, h }], spread: s }; }
    case 't': { const s = Math.min(h + 0.45, 2.2); return { planes: [{ o: 0, h: h - 0.35 }, { o: s / 2, h: h - 0.15 }, { o: s, h }], spread: s }; }
    case 'w': return { planes: [{ o: 0.22, h }], spread: 0.45 };
    case 'l': return { planes: [{ o: 0.9, h }], spread: 1.8 };
    case 'water': { const w = Math.min(3.0 + (h - 1.2) * 2.5, 4.2); return { planes: [{ o: 0, h: 0.5 }], spread: 0.3, water: { start: 0.3, end: w } }; }
    default: return { planes: [{ o: 0, h }], spread: 0 };
  }
}

// Construye la pista final para una altura y velocidad (m/min).
export function buildCourse(layoutKey, { height = 1.3, speed = 375, jumpoff = false, seed = 1, power = null } = {}) {
  const L = LAYOUTS[layoutKey];
  const els = [];
  let num = 0;
  L.fences.forEach((f, fi) => {
    num++;
    const parts = f.combo || [f];
    const comboStart = els.length;
    let prev = null;
    parts.forEach((p, k) => {
      const th = ((p.deg ?? prev.deg) * Math.PI) / 180;
      const n = [Math.cos(th), Math.sin(th)];
      let x = p.x, z = p.z;
      if (prev) {
        const back = prev.spread + (prev.water ? prev.water.end - prev.spread : 0);
        x = prev.x + n[0] * (back + p.dist);
        z = prev.z + n[1] * (back + p.dist);
      }
      // las vallas de alturas mayores se arman un poco más bajas al principio
      let h = height;
      if (fi === 0) h = height - 0.1;
      if (p.t === 'water') h = height;
      if (p.t === 't') h = height + 0.03;
      const pl = planesFor(p.t, h);
      const E = {
        idx: els.length, layoutIdx: els.length, num, label: parts.length > 1 ? `${num}${'abc'[k]}` : `${num}`,
        type: p.t, x, z, th, deg: p.deg ?? prev.deg, n, l: [-n[1], n[0]], h, half: 1.75,
        planes: pl.planes, spread: pl.spread, water: pl.water || null,
        comboStart, comboPos: k, comboLen: parts.length,
        scheme: SCHEMES[(fi * 3 + seed) % SCHEMES.length],
      };
      els.push(E);
      prev = E;
    });
  });

  let elements = els;
  let start = { ...L.start }, finish = { ...L.finish };
  if (jumpoff && L.jumpoff) {
    elements = L.jumpoff.map(i => ({ ...els[i] }));
    // renumerar y reconstruir combinaciones
    let n = 0, lastNum = -1;
    elements.forEach((E, i) => {
      if (E.num !== lastNum) { n++; lastNum = E.num; E._newStart = i; }
      else E._newStart = elements[i - 1]._newStart;
      E.idx = i;
    });
    elements.forEach((E) => {
      const grp = elements.filter(o => o._newStart === E._newStart);
      E.comboStart = E._newStart; E.comboPos = grp.indexOf(E); E.comboLen = grp.length;
      const nn = elements.slice(0, E._newStart + 1).filter((o, j) => o._newStart === j).length;
      E.num = nn;
      E.label = grp.length > 1 ? `${nn}${'abc'[E.comboPos]}` : `${nn}`;
    });
    if (jumpoff) { elements.forEach(E => { E.h += 0.05; E.planes = E.planes.map(p => ({ ...p, h: p.h + 0.05 })); }); }
  }
  if (power != null) {
    // Potencia: un solo muro que sube en cada vuelta
    const pl = planesFor('w', power);
    const th = 0; const n = [1, 0];
    elements = [{ idx: 0, num: 1, label: '1', type: 'w', x: 0, z: 0, th, deg: 0, n, l: [0, 1], h: power, half: 1.75,
      planes: pl.planes, spread: pl.spread, water: null, comboStart: 0, comboPos: 0, comboLen: 1, scheme: 'red', bigWall: true }];
    start = { x: -22, z: 0, deg: 0 }; finish = { x: 14, z: 0, deg: 0 };
  }
  const mk = (s) => ({ x: s.x, z: s.z, th: (s.deg * Math.PI) / 180, half: 4 });
  const course = {
    layout: layoutKey, name: L.name, arena: L.arena || ARENA, indoor: !!L.indoor, elements, start: mk(start), finish: mk(finish),
    height, speed, jumpoff, power,
  };
  const len = pathLength(course);
  course.length = Math.round(len / 5) * 5;
  course.ta = power != null ? 0 : Math.ceil(course.length / (speed / 60));
  if (jumpoff) course.ta = Math.ceil(course.ta * 0.8);
  course.tl = power != null ? 120 : course.ta * 2;
  course.efforts = elements.length;
  return course;
}
