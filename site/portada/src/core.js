/* JET//Portada · núcleo: reglas, puntuación, generador y solucionadores. Sin DOM: corre igual en el navegador y en Node (pruebas). */
(function (G) {
'use strict';

const SECS = ['POL', 'ECO', 'DEP', 'CIE', 'CUL', 'SOC', 'CLI'];
const TEXT = { tit: 1, nota: 1, col: 1, breve: 1 };
const BASE = { tit3x1: 5, tit4x1: 7, nota2x2: 4, nota2x3: 6, col1x2: 2, col1x3: 3, breve1x1: 1, foto2x1: 1, foto2x2: 2, pub2x1: 3, clas1x1: 1, excl2x2: 10 };
const ED_SIZES = [[4, 5], [5, 6], [6, 7]];
const DIFF = {
  b: { m: [0.55, 0.58, 0.62], dis: [1, 2], pub: [1, 1, 1], foto: [1, 2, 3], dens: 0 },
  r: { m: [0.70, 0.70, 0.75], dis: [2, 3], pub: [1, 2, 2], foto: [1, 2, 3], dens: 1 },
  j: { m: [0.76, 0.77, 0.79], dis: [3, 4], pub: [2, 2, 3], foto: [1, 2, 3], dens: 2 }
};
// Reglas de redacción. rar: c común, e especial, r rara. u: condición de desbloqueo (null = de entrada).
const RULES = [
  { id: 'cobertura', rar: 'c', g: '+5', u: null },
  { id: 'propia', rar: 'c', g: 'DEP', u: null },
  { id: 'pieimp', rar: 'c', g: '▁+2', u: null },
  { id: 'limpia', rar: 'c', g: '+10%', u: null },
  { id: 'racimo', rar: 'c', g: '▪▪', u: null },
  { id: 'divulga', rar: 'c', g: 'CIE', u: null },
  { id: 'agenda', rar: 'c', g: 'SOC', u: null },
  { id: 'esquinas', rar: 'c', g: '⌜×1,5', u: null },
  { id: 'columnistas', rar: 'c', g: '▮+1', u: null },
  { id: 'ampliada', rar: 'c', g: '4', u: null },
  { id: 'fotoper', rar: 'e', g: '◩×1,5', u: null },
  { id: 'catastrofe', rar: 'e', g: '×3', u: null },
  { id: 'patrocinio', rar: 'e', g: 'PUB+3', u: null },
  { id: 'diversidad', rar: 'e', g: '+2/§', u: null },
  { id: 'doble', rar: 'e', g: '×2', u: { golds: 1 } },
  { id: 'exclusiva', rar: 'e', g: '★10', u: { rank: 1 } },
  { id: 'climaport', rar: 'e', g: 'CLI×2', u: { runs: 3 } },
  { id: 'contrapunto', rar: 'e', g: '−3→0', u: { printed: 10 } },
  { id: 'nocturna', rar: 'e', g: '☾', u: { nightJ: 1 } },
  { id: 'aficion', rar: 'e', g: '+5', u: { streak: 3 } },
  { id: 'historica', rar: 'r', g: '×1,25', u: { rank: 2 } },
  { id: 'archivo', rar: 'r', g: '+3', u: { golds: 3 } },
  { id: 'rotativa', rar: 'r', g: '×1,2', u: { streak: 7 } },
  { id: 'cierre', rar: 'r', g: '+1', u: { runJ: 1 } },
  { id: 'angular', rar: 'r', g: '◢◣', u: { rank: 3 } },
  { id: 'linea', rar: 'r', g: '§×1,5', u: { printed: 30 } }
];
const RULE = {}; RULES.forEach(r => { RULE[r.id] = r; });
const BASE_RULES = RULES.filter(r => !r.u).map(r => r.id);
const RANKS = [0, 150, 600, 1800, 4500, 10000];
// pasos de mejora de la tapa del jefe (calibrados con tests/generador.test.mjs)
const BOSS_IT = { b: [600, 900, 1200], r: [1200, 1700, 2300], j: [1400, 2000, 2600] };

// ---------- azar con semilla ----------
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(str) { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return h >>> 0; }
function rngFor() { return mulberry32(hash(Array.prototype.join.call(arguments, '|'))); }
function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
function pick(r, a) { return a[Math.floor(r() * a.length)]; }
function shuffle(r, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

// ---------- geometría ----------
const isPub = p => p.t === 'pub' || p.t === 'clas';
const isText = p => !!TEXT[p.t];
function dims(p, r) { return r ? { w: p.h, h: p.w } : { w: p.w, h: p.h }; }
function canRotate(p) { return p.t === 'pub' && p.w !== p.h; }
function gridOf(ed, pos) {
  const C = ed.C, g = new Int16Array(C * ed.F).fill(-1);
  for (const k in pos) {
    const p = ed.pieces[k], q = pos[k]; if (!p || !q) continue;
    const d = dims(p, q.r);
    for (let y = q.y; y < q.y + d.h; y++) for (let x = q.x; x < q.x + d.w; x++) g[y * C + x] = p.ix;
  }
  return g;
}
function canPlace(ed, pos, ix, x, y, r, g) {
  const p = ed.pieces[ix], d = dims(p, r);
  if (x < 0 || y < 0 || x + d.w > ed.C || y + d.h > ed.F) return false;
  g = g || gridOf(ed, pos);
  for (let yy = y; yy < y + d.h; yy++) for (let xx = x; xx < x + d.w; xx++) { const o = g[yy * ed.C + xx]; if (o !== -1 && o !== ix) return false; }
  return true;
}
function validSpots(ed, pos, ix, r) {
  const g = gridOf(ed, pos), out = [], p = ed.pieces[ix], d = dims(p, r);
  for (let y = 0; y + d.h <= ed.F; y++) for (let x = 0; x + d.w <= ed.C; x++) if (canPlace(ed, pos, ix, x, y, r, g)) out.push([x, y]);
  return out;
}
function fitsAnywhere(ed, pos, ix) {
  const p = ed.pieces[ix];
  if (validSpots(ed, pos, ix, 0).length) return true;
  return canRotate(p) && validSpots(ed, pos, ix, 1).length > 0;
}

// ---------- puntuación ----------
const PAIRS = { 'ECO|POL': 'ctx', 'CIE|CLI': 'expl', 'CIE|CUL': 'curi', 'CUL|SOC': 'agenda', 'DEP|SOC': 'aficion' };
function asSet(rules) {
  if (!rules) return {};
  if (Array.isArray(rules)) { const o = {}; rules.forEach(x => { o[typeof x === 'string' ? x : x.id] = true; }); return o; }
  return rules;
}

/** Calcula la tirada de una tapa. ctx = { rules, lineSec, rotBonus } */
function score(ed, pos, ctx) {
  ctx = ctx || {};
  const R = asSet(ctx.rules), C = ed.C, F = ed.F, P = ed.pieces;
  const g = gridOf(ed, pos);
  const placed = Object.keys(pos).map(Number).filter(i => P[i] && pos[i]);
  const nb = new Map(), adj = {};
  placed.forEach(i => { adj[i] = new Set(); });
  function seg(a, b, mx, my, diag) {
    if (a === b || a < 0 || b < 0) return;
    const k = a < b ? a * 1024 + b : b * 1024 + a;
    let e = nb.get(k);
    if (!e) { e = { a: Math.min(a, b), b: Math.max(a, b), sx: 0, sy: 0, n: 0, diag: !!diag }; nb.set(k, e); adj[a].add(b); adj[b].add(a); }
    if (!diag || e.diag) { e.sx += mx; e.sy += my; e.n++; }
    if (!diag && e.diag) { e.diag = false; e.sx = mx; e.sy = my; e.n = 1; }
  }
  for (let y = 0; y < F; y++) for (let x = 0; x < C; x++) {
    const a = g[y * C + x]; if (a < 0) continue;
    if (x + 1 < C) seg(a, g[y * C + x + 1], x + 1, y + 0.5);
    if (y + 1 < F) seg(a, g[(y + 1) * C + x], x + 0.5, y + 1);
  }
  if (R.angular) {
    placed.forEach(i => {
      const p = P[i], q = pos[i], d = dims(p, q.r);
      if (p.t !== 'foto' || d.w !== 2 || d.h !== 2) return;
      [[q.x - 1, q.y - 1, q.x, q.y], [q.x + 2, q.y - 1, q.x + 2, q.y], [q.x - 1, q.y + 2, q.x, q.y + 2], [q.x + 2, q.y + 2, q.x + 2, q.y + 2]].forEach(c => {
        if (c[0] < 0 || c[1] < 0 || c[0] >= C || c[1] >= F) return;
        const b = g[c[1] * C + c[0]]; if (b >= 0 && b !== i) seg(i, b, c[2], c[3], true);
      });
    });
  }
  const bottom = i => pos[i].y + dims(P[i], pos[i].r).h - 1;
  const cab = i => P[i].t === 'tit' && pos[i].y === 0;
  const ownPhotoAdj = i => { for (const b of adj[i]) if (P[b].t === 'foto' && P[b].story === i) return true; return false; };

  // multiplicadores por pieza
  const pieces = {};
  let sumPieces = 0, extras = 0;
  placed.forEach(i => {
    const p = P[i], q = pos[i], d = dims(p, q.r), m = [], ex = [];
    if (cab(i)) m.push(['cab', R.catastrofe ? 3 : 2]);
    if (isText(p)) {
      let own = false, other = false;
      for (const b of adj[i]) if (P[b].t === 'foto') { if (P[b].story === i) own = true; else other = true; }
      if (own) m.push(['foto', 2]);
      if (R.fotoper && other) m.push(['fper', 1.5]);
    }
    if (p.sec && p.sec === ed.theme) m.push(['tema', R.doble ? 2 : 1.5]);
    if (R.esquinas) {
      const xs = [q.x, q.x + d.w - 1], ys = [q.y, q.y + d.h - 1];
      if ((xs[0] === 0 || xs[1] === C - 1) && (ys[0] === 0 || ys[1] === F - 1)) m.push(['esq', 1.5]);
    }
    if (R.climaport && p.sec === 'CLI' && q.y === 0) m.push(['clim', 2]);
    if (R.linea && ctx.lineSec && p.sec === ctx.lineSec) m.push(['lin', 1.5]);
    let f = 1; m.forEach(x => { f *= x[1]; });
    const val = Math.ceil(p.base * f - 1e-9);
    if (isPub(p)) {
      if (R.pieimp && bottom(i) === F - 1) ex.push(['pieimp', 2]);
      if (R.patrocinio) ex.push(['patro+', 3]);
    }
    if (R.columnistas && p.t === 'col') {
      const s = new Set(); for (const b of adj[i]) if (P[b].sec) s.add(P[b].sec);
      if (s.size) ex.push(['colum', s.size]);
    }
    const exv = ex.reduce((a, x) => a + x[1], 0);
    pieces[i] = { base: p.base, mults: m, f, val, extra: ex, total: val + exv };
    sumPieces += val; extras += exv;
  });

  // pares
  const pairs = []; let sumPairs = 0, rep = 0;
  nb.forEach(e => {
    const A = P[e.a], B = P[e.b], parts = [];
    if (A.t === 'excl' || B.t === 'excl') { /* la exclusiva no da ni recibe */ }
    else {
      const pa = isPub(A), pb = isPub(B);
      if (pa && pb) { /* nada */ }
      else if (pa || pb) {
        const Pi = pa ? e.a : e.b, O = pa ? B : A;
        if (R.patrocinio && O.sec === 'POL') parts.push(['patro', -4]);
        else if (O.t === 'tit') parts.push(['ruido', -3]);
        else if (bottom(Pi) === F - 1) parts.push(['pie', 0]);
        else parts.push(['distr', -1]);
      } else if ((A.t === 'foto' && A.story === e.b) || (B.t === 'foto' && B.story === e.a)) {
        parts.push(['story', 0]);
        if (R.archivo) parts.push(['archivo', 3]);
      } else if (A.sec === B.sec) {
        if (A.sec === 'DEP' && R.propia) parts.push(['propia', 2]);
        else if (A.sec === 'SOC' && R.agenda) parts.push(['agsoc', 0]);
        else if (R.contrapunto && (ownPhotoAdj(e.a) || ownPhotoAdj(e.b))) parts.push(['contra', 0]);
        else { parts.push(['rep', -3]); rep++; }
      } else {
        const key = A.sec < B.sec ? A.sec + '|' + B.sec : B.sec + '|' + A.sec, c = PAIRS[key];
        if (c === 'ctx') parts.push(['ctx', R.cobertura ? 5 : 3]);
        else if (c === 'expl') parts.push(['expl', R.divulga ? 5 : 3]);
        else if (c === 'curi') parts.push(['curi', R.divulga ? 4 : 2]);
        else if (c === 'agenda') parts.push(['agenda', 2]);
        else if (c === 'aficion') parts.push(['aficion', R.aficion ? 5 : 2]);
      }
      if (R.racimo && A.t === 'breve' && B.t === 'breve') parts.push(['racimo', 2]);
      if (R.catastrofe) { if (cab(e.a)) parts.push(['catas', -2]); if (cab(e.b)) parts.push(['catas', -2]); }
    }
    const v = parts.reduce((a, x) => a + x[1], 0);
    sumPairs += v;
    pairs.push({ a: e.a, b: e.b, v, parts, code: parts.length ? parts[0][0] : null, x: e.sx / e.n, y: e.sy / e.n, diag: e.diag });
  });

  // global
  let holes = 0; for (let i = 0; i < g.length; i++) if (g[i] < 0) holes++;
  const glob = [];
  const holePen = R.nocturna ? 0 : holes * 2;
  if (R.diversidad) { const s = new Set(); placed.forEach(i => { if (P[i].sec) s.add(P[i].sec); }); if (s.size) glob.push(['divers', 2 * s.size]); }
  if (R.cierre) { const left = P.length - placed.length; if (left) glob.push(['cierre', left]); }
  const gsum = glob.reduce((a, x) => a + x[1], 0);
  const sub = sumPieces + extras + sumPairs + gsum - holePen;
  const gm = [];
  if (R.limpia && holes === 0) gm.push(['limpia', 1.1]);
  if (R.historica && rep === 0 && placed.length) gm.push(['hist', 1.25]);
  if (ctx.rotBonus) gm.push(['rotat', 1.2]);
  let f = 1; gm.forEach(x => { f *= x[1]; });
  const raw = sub * (sub > 0 ? f : 1);
  const total = Math.max(0, Math.ceil(raw - 1e-9));
  return { total, raw, sub, pieces, pairs, holes, holePen, glob, gm, rep, sumPieces, extras, sumPairs, adj };
}

// ---------- generador ----------
const SHAPES = { '1x1': 1, '1x2': 1, '1x3': 1, '2x1': 1, '2x2': 1, '2x3': 1, '3x1': 1, '4x1': 1 };
const STOP = { '1x1': 1, '1x2': 0.5, '1x3': 0.62, '2x1': 0.5, '2x2': 0.72, '2x3': 0.92, '3x1': 0.55, '4x1': 0.5 };

function guillotine(r, x, y, w, h, out) {
  const key = w + 'x' + h;
  if (SHAPES[key] && r() < STOP[key]) { out.push({ x, y, w, h }); return; }
  let vert;
  if (w === 1) vert = false; else if (h === 1) vert = true;
  else vert = r() < (w >= h ? 0.66 : 0.34);
  if (vert) {
    let c = ri(r, 1, w - 1);
    if (w >= 4 && r() < 0.5) c = r() < 0.5 ? 2 : w - 2;
    guillotine(r, x, y, c, h, out); guillotine(r, x + c, y, w - c, h, out);
  } else {
    const c = ri(r, 1, h - 1);
    guillotine(r, x, y, w, c, out); guillotine(r, x, y + c, w, h - c, out);
  }
}
function touching(a, b) {
  const hx = a.x < b.x + b.w && b.x < a.x + a.w, vy = a.y < b.y + b.h && b.y < a.y + a.h;
  return (hx && (a.y + a.h === b.y || b.y + b.h === a.y)) || (vy && (a.x + a.w === b.x || b.x + b.w === a.x));
}

function tryTiling(r, C, F, fq, pq) {
  const L = [];
  // fila 0: titulares
  if (C === 3) L.push({ x: 0, y: 0, w: 3, h: 1, t: 'tit' });
  else if (C === 4) { if (r() < 0.6) L.push({ x: 0, y: 0, w: 4, h: 1, t: 'tit' }); else { const left = r() < 0.5; L.push({ x: left ? 0 : 1, y: 0, w: 3, h: 1, t: 'tit' }, { x: left ? 3 : 0, y: 0, w: 1, h: 1, t: '?' }); } }
  else if (C === 5) { const v = r(); if (v < 0.45) { const left = r() < 0.5; L.push({ x: left ? 0 : 1, y: 0, w: 4, h: 1, t: 'tit' }, { x: left ? 4 : 0, y: 0, w: 1, h: 1, t: '?' }); } else { const left = r() < 0.5; L.push({ x: left ? 0 : 2, y: 0, w: 3, h: 1, t: 'tit' }, { x: left ? 3 : 0, y: 0, w: 2, h: 1, t: '?' }); } }
  else { const v = r(); if (v < 0.5) L.push({ x: 0, y: 0, w: 3, h: 1, t: 'tit' }, { x: 3, y: 0, w: 3, h: 1, t: 'tit' }); else { const left = r() < 0.5; L.push({ x: left ? 0 : 2, y: 0, w: 4, h: 1, t: 'tit' }, { x: left ? 4 : 0, y: 0, w: 2, h: 1, t: '?' }); } }
  const body = []; guillotine(r, 0, 1, C, F - 1, body);
  body.forEach(b => { b.t = '?'; L.push(b); });
  // publicidades: 2x1 / 1x2 del cuerpo, prefiriendo la última fila
  const shapeOf = b => b.w + 'x' + b.h;
  let pubs = 0;
  const pubC = shuffle(r, L.filter(b => b.t === '?' && b.y > 0 && (shapeOf(b) === '2x1' || shapeOf(b) === '1x2'))).sort((a, b) => (b.y + b.h) - (a.y + a.h));
  for (const b of pubC) { if (pubs >= pq) break; if (r() < 0.85) { b.t = 'pub'; pubs++; } }
  if (pubs < pq) for (const b of shuffle(r, L.filter(b => b.t === '?' && b.y > 0 && shapeOf(b) === '1x1'))) { if (pubs >= pq) break; b.t = 'clas'; pubs++; }
  // provisionalmente, lo que es texto
  L.forEach(b => {
    if (b.t !== '?') return;
    const s = shapeOf(b);
    if (s === '1x1') b.t = 'breve'; else if (s === '1x2' || s === '1x3') b.t = 'col'; else if (s === '2x3') b.t = 'nota'; else if (s === '3x1' || s === '4x1') b.t = 'tit';
  });
  // fotos: 2x1 y 2x2 junto a un texto sin foto
  let fotos = 0;
  const fc = shuffle(r, L.filter(b => b.t === '?' || (b.t === undefined)));
  const storied = new Set();
  const textish = b => b.t === 'tit' || b.t === 'nota' || b.t === 'col' || b.t === 'breve' || (b.t === '?' && shapeOf(b) === '2x2');
  fc.sort((a, b) => (shapeOf(a) === '2x1' && a.y === 0 ? -1 : 0) - (shapeOf(b) === '2x1' && b.y === 0 ? -1 : 0));
  for (const b of fc) {
    if (fotos >= fq) break;
    if (storied.has(b)) continue;
    const cands = L.filter(o => o !== b && textish(o) && !storied.has(o) && touching(o, b));
    if (!cands.length) continue;
    cands.sort((u, v) => (BASE[(v.t === '?' ? 'nota' : v.t) + shapeOf(v)] || 0) - (BASE[(u.t === '?' ? 'nota' : u.t) + shapeOf(u)] || 0));
    const o = cands[0];
    if (o.t === '?') o.t = 'nota';
    b.t = 'foto'; b.story = o; storied.add(o); fotos++;
  }
  // el resto
  const out = [];
  L.forEach(b => {
    if (b.t === '?') {
      const s = shapeOf(b);
      if (s === '2x2') b.t = 'nota';
      else if (s === '2x1') { out.push({ x: b.x, y: b.y, w: 1, h: 1, t: 'breve' }, { x: b.x + 1, y: b.y, w: 1, h: 1, t: 'breve' }); return; }
    }
    out.push(b);
  });
  // una foto cuya historia quedó partida no puede pasar: se valida
  for (const b of out) if (b.t === 'foto' && out.indexOf(b.story) < 0) return null;
  const breves = out.filter(b => b.t === 'breve').length;
  const q = Math.abs(fotos - fq) * 3 + Math.abs(pubs - pq) * 3 + Math.max(0, breves - Math.floor(out.length * 0.25)) * 2 + (out.filter(b => b.t === 'nota').length ? 0 : 2);
  return { L: out, q };
}

function makePiece(ix, t, w, h) {
  const key = t + w + 'x' + h;
  return { ix, t, w, h, base: BASE[key], sec: null, story: -1, tx: 0, sl: null, ill: 0 };
}

function contentPools() { return G.PortadaContent || null; }
function poolSize(kind, sec) {
  const C = contentPools(); if (!C) return 20;
  if (kind === 'pub') return C.pub.length; if (kind === 'clas') return C.clas.length;
  if (kind === 'foto') return C.foto[sec].length;
  return C.text[kind][sec].length;
}
function slotSizes() { const C = contentPools(); return C ? C.slotSizes() : { l: 7, p: 6, e: 3, o: 4 }; }

function assignTexts(ed, seed, k) {
  const used = {};
  const SZ = slotSizes();
  ed.pieces.forEach(p => {
    const kind = p.t === 'foto' ? 'foto' : p.t === 'pub' ? 'pub' : p.t === 'clas' ? 'clas' : p.t === 'excl' ? null : p.t;
    if (!kind) return;
    const sec = (kind === 'pub' || kind === 'clas') ? 'PUB' : p.sec;
    const key = kind + '|' + sec, n = poolSize(kind, sec);
    const perm = shuffle(rngFor('tx', seed, key), Array.from({ length: n }, (_, i) => i));
    used[key] = (used[key] || 0);
    // cada edición usa su tercio de la lista (k−1, k+2, k+5…); si se acaba, toma desde el final hacia atrás,
    // donde casi nunca llegan las otras ediciones (evita repetir epígrafes entre ediciones de la misma partida)
    const res = (k - 1) % 3, u = used[key], own = Math.ceil((n - res) / 3);
    let ti;
    if (u < own) ti = res + 3 * u;
    else { const rest = []; for (let i = n - 1; i >= 0; i--) if (i % 3 !== res) rest.push(i); ti = rest.length ? rest[(u - own) % rest.length] : res; }
    p.tx = perm[ti]; used[key]++;
    const r = rngFor('sl', seed, k, p.ix);
    p.sl = { l: Math.floor(r() * SZ.l), p: Math.floor(r() * SZ.p), e: Math.floor(r() * SZ.e), o: Math.floor(r() * SZ.o), n: 2 + Math.floor(r() * 97) };
    if (kind === 'foto') { const C = contentPools(); const ills = C ? C.ill[p.sec] : [0]; p.ill = ills[Math.floor(r() * ills.length)]; }
  });
}

/** Genera la edición k (1..3) de una partida. */
function genEdition(seed, k, diff) {
  const cfg = DIFF[diff] || DIFF.r, size = ED_SIZES[k - 1], C = size[0], F = size[1];
  const r = rngFor('portada', seed, k, diff);
  let best = null;
  for (let at = 0; at < 50; at++) {
    const t = tryTiling(r, C, F, cfg.foto[k - 1], cfg.pub[k - 1]);
    if (!t) continue;
    if (!best || t.q < best.q) best = t;
    if (t.q === 0) break;
  }
  // piezas de la tapa del jefe
  const leaves = best.L;
  const pieces = [], boss = {};
  const idx = new Map();
  leaves.forEach((b, i) => {
    let t = b.t, w = b.w, h = b.h, rot = 0;
    if (t === 'pub' && w === 1 && h === 2) { w = 2; h = 1; rot = 1; }
    const p = makePiece(i, t, w, h); pieces.push(p); idx.set(b, i);
    boss[i] = { x: b.x, y: b.y, r: rot };
  });
  leaves.forEach((b, i) => { if (b.t === 'foto') pieces[i].story = idx.get(b.story); });
  const ed = { k, C, F, pieces, boss, theme: null, seed, diff };
  // secciones por búsqueda local
  const texts = pieces.filter(isText);
  const syncPhotos = () => pieces.forEach(p => { if (p.t === 'foto') p.sec = pieces[p.story].sec; });
  texts.forEach(p => { p.sec = pick(r, SECS); });
  syncPhotos();
  let cur = score(ed, boss, {}).total;
  const steps = cfg.dens === 2 ? 120 : 200;
  for (let s = 0; s < steps; s++) {
    const p = pick(r, texts), old = p.sec, ns = pick(r, SECS);
    if (ns === old) continue;
    p.sec = ns; syncPhotos();
    const v = score(ed, boss, {}).total;
    if (v >= cur) cur = v; else { p.sec = old; syncPhotos(); }
  }
  let distinct = new Set(texts.map(p => p.sec));
  let guard = 0;
  while (distinct.size < 3 && guard++ < 40) { const p = pick(r, texts); p.sec = pick(r, SECS.filter(s => !distinct.has(s))); syncPhotos(); distinct = new Set(texts.map(p => p.sec)); }
  // tema del día
  const cnt = {}; pieces.forEach(p => { if (p.sec) cnt[p.sec] = (cnt[p.sec] || 0) + 1; });
  let cand = SECS.filter(s => cnt[s] >= 2);
  if (!cand.length) { const a = texts[0], b = texts[texts.length - 1]; b.sec = a.sec; syncPhotos(); cand = [a.sec]; }
  ed.theme = pick(r, cand);
  // distractores
  const nDis = ri(r, cfg.dis[0], cfg.dis[1]);
  const area = C * F; let trayArea = area;
  const present = SECS.filter(s => cnt[s]);
  const disShapes = [['nota', 2, 2], ['col', 1, 2], ['col', 1, 3], ['breve', 1, 1], ['tit', 3, 1], ['pub', 2, 1], ['nota', 2, 3], ['col', 1, 2]];
  for (let d = 0; d < nDis || (trayArea < area * 1.15 && d < nDis + 2); d++) {
    let sh;
    if (d === 0) sh = pick(r, C >= 4 ? [['nota', 2, 3], ['tit', 4, 1], ['nota', 2, 2]] : [['nota', 2, 2]]);
    else sh = pick(r, disShapes);
    if (trayArea + sh[1] * sh[2] > area * 1.32) sh = pick(r, [['breve', 1, 1], ['col', 1, 2]]);
    if (sh[0] === 'tit' && sh[1] > C) sh = ['tit', 3, 1];
    const p = makePiece(pieces.length, sh[0], sh[1], sh[2]);
    if (p.t !== 'pub') {
      if (d === 0) p.sec = r() < 0.6 ? ed.theme : pick(r, SECS);
      else p.sec = cfg.dens === 2 && r() < 0.7 ? pick(r, present) : cfg.dens === 0 && r() < 0.6 ? pick(r, SECS.filter(s => !cnt[s]).concat(SECS)) : pick(r, SECS);
    }
    p.dis = 1;
    pieces.push(p); trayArea += sh[1] * sh[2];
  }
  // orden de la mesa: barajar índices (que no delaten la solución) y ordenar por tamaño
  const order = shuffle(r, pieces.map((p, i) => i)).sort((a, b) => (pieces[b].w * pieces[b].h) - (pieces[a].w * pieces[a].h) || (pieces[b].base - pieces[a].base));
  const remap = {}; order.forEach((old, ni) => { remap[old] = ni; });
  const np = order.map((old, ni) => { const p = pieces[old]; p.ix = ni; return p; });
  np.forEach(p => { if (p.t === 'foto') p.story = remap[p.story]; });
  const nb = {}; for (const k2 in boss) nb[remap[k2]] = boss[k2];
  ed.pieces = np; ed.boss = nb;
  assignTexts(ed, seed, k);
  const it = BOSS_IT[diff] ? BOSS_IT[diff][k - 1] : 0;
  ed.tiling = ed.boss;
  if (it) ed.boss = annealCore(ed, {}, ed.boss, r, 0, it).pos;
  return ed;
}

/** Añade la pieza dorada de «Exclusiva». */
function addExclusive(ed) {
  if (ed.pieces.some(p => p.t === 'excl')) return ed;
  const p = makePiece(ed.pieces.length, 'excl', 2, 2); p.sec = null;
  ed.pieces.push(p); return ed;
}

/** Tutorial: ediciones fijas. */
function tutorialEdition(n) {
  let ed;
  if (n === 1) {
    const P = [makePiece(0, 'tit', 3, 1), makePiece(1, 'foto', 2, 2), makePiece(2, 'col', 1, 2)];
    P[0].sec = 'CIE'; P[1].sec = 'CIE'; P[1].story = 0; P[2].sec = 'CUL';
    ed = { k: 1, C: 3, F: 3, pieces: P, boss: { 0: { x: 0, y: 0, r: 0 }, 1: { x: 0, y: 1, r: 0 }, 2: { x: 2, y: 1, r: 0 } }, theme: null, seed: 'TUTOR1', diff: 'b', tut: 1 };
  } else {
    const P = [makePiece(0, 'nota', 2, 3), makePiece(1, 'tit', 3, 1), makePiece(2, 'col', 1, 3), makePiece(3, 'col', 1, 3)];
    P[0].sec = 'DEP'; P[1].sec = 'ECO'; P[2].sec = 'SOC'; P[3].sec = 'DEP';
    ed = { k: 2, C: 3, F: 4, pieces: P, boss: { 1: { x: 0, y: 0, r: 0 }, 0: { x: 0, y: 1, r: 0 }, 2: { x: 2, y: 1, r: 0 } }, theme: null, seed: 'TUTOR2', diff: 'b', tut: 2 };
  }
  assignTexts(ed, 'TUTOR', n);
  ed.pieces.forEach(p => { p.tut = n; });
  return ed;
}

// ---------- solucionadores (pruebas y gancho) ----------
function greedy(ed, ctx, startPos) {
  const pos = Object.assign({}, startPos || {});
  let cur = score(ed, pos, ctx).raw;
  for (let guard = 0; guard < 80; guard++) {
    let best = null;
    for (const p of ed.pieces) {
      if (pos[p.ix]) continue;
      for (const r of canRotate(p) ? [0, 1] : [0]) {
        for (const s of validSpots(ed, pos, p.ix, r)) {
          pos[p.ix] = { x: s[0], y: s[1], r };
          const v = score(ed, pos, ctx).raw;
          delete pos[p.ix];
          if (!best || v > best.v) best = { ix: p.ix, x: s[0], y: s[1], r, v };
        }
      }
    }
    if (!best || best.v <= cur) break;
    pos[best.ix] = { x: best.x, y: best.y, r: best.r }; cur = best.v;
  }
  return { pos, total: score(ed, pos, ctx).total };
}
function annealCore(ed, ctx, start, r, ms, iters) {
  let pos = Object.assign({}, start), cur = score(ed, pos, ctx).raw, best = { pos: Object.assign({}, pos), total: cur };
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const t0 = now(), T0 = 4, T1 = 0.15;
  for (let it = 0; ; it++) {
    let frac;
    if (iters) { if (it >= iters) break; frac = it / iters; }
    else { const el = now() - t0; if (el > ms) break; frac = el / ms; }
    const T = T0 * Math.pow(T1 / T0, frac);
    const np = Object.assign({}, pos), mv = r();
    const placedK = Object.keys(np).map(Number), un = ed.pieces.filter(p => !np[p.ix]);
    if (mv < 0.15 && placedK.length) { delete np[pick(r, placedK)]; }
    else if (mv < 0.5 && placedK.length) { const i = pick(r, placedK), p = ed.pieces[i]; const rr = canRotate(p) && r() < 0.3 ? 1 - np[i].r : np[i].r; delete np[i]; const s = validSpots(ed, np, i, rr); if (!s.length) continue; const c = pick(r, s); np[i] = { x: c[0], y: c[1], r: rr }; }
    else if (mv < 0.75 && un.length) { const p = pick(r, un), rr = canRotate(p) && r() < 0.5 ? 1 : 0; const s = validSpots(ed, np, p.ix, rr); if (!s.length) continue; const c = pick(r, s); np[p.ix] = { x: c[0], y: c[1], r: rr }; }
    else if (placedK.length >= 2) {
      const a = pick(r, placedK), b = pick(r, placedK); if (a === b) continue;
      const A = ed.pieces[a], B = ed.pieces[b], da = dims(A, np[a].r), db = dims(B, np[b].r);
      if (da.w === db.w && da.h === db.h) { const t = np[a]; np[a] = { x: np[b].x, y: np[b].y, r: np[a].r }; np[b] = { x: t.x, y: t.y, r: np[b].r }; }
      else if (un.length) {
        // cambiar una pieza puesta por una de la mesa del mismo tamaño
        const c = un.filter(p => { const d = dims(p, 0); return (d.w === da.w && d.h === da.h) || (canRotate(p) && d.h === da.w && d.w === da.h); });
        if (!c.length) continue; const p = pick(r, c), d0 = dims(p, 0); const q = np[a]; delete np[a]; np[p.ix] = { x: q.x, y: q.y, r: (d0.w === da.w && d0.h === da.h) ? 0 : 1 };
      } else continue;
    } else continue;
    const v = score(ed, np, ctx).raw;
    if (v >= cur || r() < Math.exp((v - cur) / T)) { pos = np; cur = v; if (v > best.total) best = { pos: Object.assign({}, np), total: v }; }
  }
  best.total = score(ed, best.pos, ctx).total;
  return best;
}
function anneal(ed, ctx, ms, seed) {
  const r = rngFor('anneal', seed || 'x', ed.seed, ed.k);
  const g0 = greedy(ed, ctx);
  return annealCore(ed, ctx, g0.pos, r, ms, 0);
}
// ---------- partida ----------
function goalFor(ed, J, picks) {
  const cfg = DIFF[ed.diff] || DIFF.r, m = cfg.m[ed.k - 1];
  const night = (picks || []).some(p => p.id === 'nocturna');
  return Math.max(1, Math.ceil(J * m * (night ? 1.1 : 1) - 1e-9));
}
function ctxFor(picks, k) {
  const rules = {}; let lineSec = null, rot = false;
  (picks || []).forEach(p => { if (p.ed <= k) { rules[p.id] = true; if (p.id === 'linea') lineSec = p.sec; } if (p.id === 'rotativa' && p.ed === k - 1) rot = true; });
  // «Rotativa doble» se aplica a la edición siguiente, no a la de la elección
  if (rules.rotativa) delete rules.rotativa;
  return { rules, lineSec, rotBonus: rot };
}
function editionFor(run, k) {
  const ed = run.mode === 'tut' ? tutorialEdition(k) : genEdition(run.seed, k, run.diff);
  if ((run.picks || []).some(p => p.id === 'exclusiva' && p.ed <= k)) addExclusive(ed);
  return ed;
}
function stars(total, goal, J) { return total >= J ? 3 : total >= Math.ceil(J * 0.9 - 1e-9) ? 2 : total >= goal ? 1 : 0; }

function offers(run, k, unlocked) {
  const pool0 = run.mode === 'daily' ? BASE_RULES.slice() : (unlocked && unlocked.length ? unlocked.slice() : BASE_RULES.slice());
  const taken = new Set((run.picks || []).map(p => p.id));
  let pool = pool0.filter(id => RULE[id] && !taken.has(id));
  if (k === 1) pool = pool.filter(id => RULE[id].rar === 'c');
  if (k === 3) pool = pool.filter(id => id !== 'rotativa' && id !== 'ampliada');
  const n = (run.picks || []).some(p => p.id === 'ampliada') ? 4 : 3;
  const r = rngFor('offer', run.seed, run.diff, k);
  // orden sembrado del catálogo completo (independiente de lo ya elegido)
  const all = shuffle(r, RULES.map(x => x.id)).map(id => ({ id, key: Math.pow(r(), 1 / ({ c: 65, e: 28, r: 7 }[RULE[id].rar])) }));
  all.sort((a, b) => b.key - a.key);
  const out = [];
  for (const o of all) { if (out.length >= n) break; if (pool.indexOf(o.id) >= 0) out.push(o.id); }
  return out;
}

function rankOf(total) { let r = 0; for (let i = 0; i < RANKS.length; i++) if (total >= RANKS[i]) r = i; return r; }
function unlockedRules(pr) {
  const out = [];
  RULES.forEach(x => {
    if (!x.u) { out.push(x.id); return; }
    const u = x.u, rk = rankOf(pr.total || 0);
    if ((u.golds && (pr.golds || 0) >= u.golds) || (u.rank && rk >= u.rank) || (u.runs && (pr.runs || 0) >= u.runs) || (u.printed && (pr.printed || 0) >= u.printed) || (u.streak && (pr.bestStreak || 0) >= u.streak) || (u.nightJ && pr.nightJ) || (u.runJ && pr.runJ)) out.push(x.id);
  });
  return out;
}

// ---------- fechas ----------
function localDay(d) { d = d || new Date(); const z = n => (n < 10 ? '0' : '') + n; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
function dailyNumber(day) { const a = day.split('-').map(Number); const t = Date.UTC(a[0], a[1] - 1, a[2]); return Math.round((t - Date.UTC(2026, 9, 22)) / 86400000) + 1; }
function dailySeed(day) { return 'D' + day; }
function codeFrom(r) { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; let s = ''; for (let i = 0; i < 6; i++) s += A[Math.floor(r() * A.length)]; return s; }

G.PortadaCore = {
  SECS, TEXT, BASE, ED_SIZES, DIFF, RULES, RULE, BASE_RULES, RANKS,
  mulberry32, hash, rngFor, shuffle, pick, isPub, isText, dims, canRotate, gridOf, canPlace, validSpots, fitsAnywhere,
  score, genEdition, tutorialEdition, addExclusive, editionFor, greedy, anneal, goalFor, ctxFor, stars, offers, rankOf, unlockedRules,
  localDay, dailyNumber, dailySeed, codeFrom
};
})(typeof window !== 'undefined' ? window : globalThis);
