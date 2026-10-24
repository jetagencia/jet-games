// JET//Antes · generador del reto diario (DISENO.md 9.2).
// Determinista: depende solo de la fecha (semilla) y de contadores, nunca del reloj.
// Lo usan el juego (Web Worker, src/diario-worker.js) y la herramienta tools/generar-diarios.mjs,
// que precalcula diarios.json. Las dos vías dan la misma sala para la misma fecha.
import { compile, solveK } from './reglas.js';

export const VERSION_GEN = 1;
export const CAP_DIARIO = 2e5; // tope de estados del buscador (igual en el Worker y en la herramienta)
export const FECHA_RETO_1 = '2026-10-22'; // día de lanzamiento: Reto #1

export function hash32(str) { // FNV-1a de 32 bits
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Fecha del juego: fecha LOCAL del jugador (nunca UTC).
export function fechaLocal(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function diaNum(f) { const [y, m, d] = f.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); }
export function numeroReto(f) { return diaNum(f) - diaNum(FECHA_RETO_1) + 1; }
export function diaSemana(f) { const [y, m, d] = f.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); } // 0 = domingo
export function sumarDias(f, n) {
  const [y, m, d] = f.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + n));
  const p = (k) => String(k).padStart(2, '0');
  return t.getUTCFullYear() + '-' + p(t.getUTCMonth() + 1) + '-' + p(t.getUTCDate());
}

// ── Plantillas de sala (6). Se pueden reflejar en horizontal según la semilla. ──
const PLANTILLAS = [
  { id: 'pasillo', mapa: [
    '#############',
    '#############',
    '#S.........E#',
    '#############',
    '#############'] },
  { id: 'L', mapa: [
    '############',
    '############',
    '#S.......###',
    '########.###',
    '########.###',
    '########..E#',
    '############'] },
  { id: 'U', mapa: [
    '############',
    '############',
    '#S........##',
    '#########.##',
    '#E........##',
    '############',
    '############'] },
  { id: 'camaras', mapa: [
    '#############',
    '#...#####...#',
    '#S.........E#',
    '#...#####...#',
    '#############'] },
  { id: 'anillo', mapa: [
    '#############',
    '#####...#####',
    '#S...#.#...E#',
    '#####...#####',
    '#############'] },
  { id: 'cruce', mapa: [
    '#############',
    '######.######',
    '######.######',
    '#S..........E',
    '######.######',
    '######.######',
    '#############'] },
];

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const EMIT_CH = { '1,0': '>', '-1,0': '<', '0,1': 'v', '0,-1': '^' };

function bfsPath(g, W, H, s, e) {
  const prev = new Int32Array(W * H).fill(-2); prev[s] = -1; const q = [s];
  while (q.length) {
    const c = q.shift(); if (c === e) break;
    const x = c % W, y = (c / W) | 0;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx; if (g[n] === '#' || prev[n] !== -2) continue;
      prev[n] = c; q.push(n);
    }
  }
  if (prev[e] === -2) return null;
  const p = []; for (let c = e; c !== -1; c = prev[c]) p.push(c); return p.reverse();
}
function conectado(g, W, H, s, e, sin) { const h = g.slice(); h[sin] = '#'; return !!bfsPath(h, W, H, s, e); }

// Intenta armar una sala con los mecanismos pedidos. Devuelve el nivel o null.
function armar(rng, tipos) {
  const pl = PLANTILLAS[Math.floor(rng() * PLANTILLAS.length)];
  const espejo = rng() < 0.5;
  let filas = pl.mapa.map((r) => espejo ? r.split('').reverse().join('') : r);
  const H = filas.length, W = filas[0].length;
  const g = filas.join('').split('');
  const s = g.indexOf('S'), e = g.indexOf('E');
  const camino = bfsPath(g, W, H, s, e);
  if (!camino) return null;
  const enCamino = new Set(camino);
  // celdas de corte: las que, si se tapan, separan S de E
  const corte = camino.filter((c, i) => i > 1 && i < camino.length - 1 && !conectado(g, W, H, s, e, c));
  const usadas = new Set([s, e]);
  const libre = (c) => !usadas.has(c);
  const vecinoUsado = (c) => DIRS.some(([dx, dy]) => { const x = c % W + dx, y = ((c / W) | 0) + dy; return x >= 0 && y >= 0 && x < W && y < H && usadas.has(y * W + x) && y * W + x !== s && y * W + x !== e; });
  const pick = (arr) => arr.length ? arr[Math.floor(rng() * arr.length)] : -1;
  // nichos: pared vecina (perpendicular) de una celda de camino, con profundidad 1 o 2
  function nicho(prof) {
    const cands = [];
    for (const c of camino) {
      if (c === s || c === e || usadas.has(c)) continue;
      const x = c % W, y = (c / W) | 0;
      for (const [dx, dy] of DIRS) {
        const ok = []; let bien = true;
        for (let k = 1; k <= prof; k++) {
          const nx = x + dx * k, ny = y + dy * k;
          if (nx <= 0 || ny <= 0 || nx >= W - 1 || ny >= H - 1) { bien = false; break; }
          const n = ny * W + nx; if (g[n] !== '#' || usadas.has(n)) { bien = false; break; }
          // las paredes a los lados del nicho tienen que seguir siendo pared (sin abrir atajos)
          for (const [ex, ey] of DIRS) { const mx = nx + ex, my = ny + ey; if (mx === x + dx * (k - 1) && my === y + dy * (k - 1)) continue; const m = my * W + mx; if (g[m] !== '#' && !(k < prof && mx === x + dx * (k + 1) && my === y + dy * (k + 1))) bien = false; }
          ok.push(n);
        }
        if (bien) cands.push({ base: c, celdas: ok, dx, dy });
      }
    }
    return cands;
  }
  // placa en una celda libre fuera del camino (cámaras) o en un nicho nuevo
  function placa() {
    const fuera = [];
    for (let i = 0; i < g.length; i++) if (g[i] === '.' && !enCamino.has(i) && libre(i)) fuera.push(i);
    if (fuera.length && rng() < 0.5) { const c = pick(fuera); usadas.add(c); return c; }
    const prof = rng() < 0.6 ? 1 : 2;
    const n = pick(nicho(prof)); if (!n || n === -1) return -1;
    for (const c of n.celdas) { g[c] = '.'; usadas.add(c); }
    usadas.add(n.base);
    return n.celdas[n.celdas.length - 1];
  }
  const compuerta = () => { const c = pick(corte.filter((c) => libre(c) && !vecinoUsado(c))); if (c >= 0) usadas.add(c); return c; };
  const letras = 'abcd'; let li = 0;
  const heavy = [], lasers = {}, plats = [], mecs = [];
  for (const tipo of tipos) {
    const L = letras[li++];
    if (tipo === 'puerta') {
      const d = compuerta(); if (d < 0) return null;
      const p = placa(); if (p < 0) return null;
      g[d] = L.toUpperCase(); g[p] = L; mecs.push({ tipo, celdas: [d, p] });
    } else if (tipo === 'inversa') {
      const d1 = compuerta(); if (d1 < 0) return null;
      const d2 = compuerta(); if (d2 < 0) return null;
      const p = placa(); if (p < 0) return null;
      const [a1, a2] = rng() < 0.5 ? [d1, d2] : [d2, d1];
      g[a1] = L.toUpperCase(); g[a2] = 'WXYZ'[letras.indexOf(L)]; g[p] = L; mecs.push({ tipo, celdas: [a1, a2, p] });
    } else if (tipo === 'carga') {
      const d = compuerta(); if (d < 0) return null;
      const n = pick(nicho(2)); if (!n || n === -1) return null;
      for (const c of n.celdas) { g[c] = '.'; usadas.add(c); } usadas.add(n.base);
      g[n.celdas[0]] = 'o'; g[n.celdas[1]] = L; heavy.push(L);
      g[d] = L.toUpperCase(); mecs.push({ tipo, celdas: [d, ...n.celdas] });
    } else if (tipo === 'laser') {
      const cands = [];
      for (const c of corte) {
        if (!libre(c) || vecinoUsado(c)) continue;
        const x = c % W, y = (c / W) | 0;
        for (const [dx, dy] of DIRS) {
          const wx = x - dx, wy = y - dy; if (wx <= 0 || wy <= 0 || wx >= W - 1 || wy >= H - 1) continue;
          const w = wy * W + wx; if (g[w] !== '#' || usadas.has(w)) continue;
          if (enCamino.has(c + dx) && dx !== 0) continue; // el rayo cruza el pasillo, no lo recorre
          if (dy !== 0 && enCamino.has(c + dy * W)) continue;
          cands.push({ c, w, dx, dy });
        }
      }
      const k = pick(cands); if (!k || k === -1) return null;
      usadas.add(k.c); usadas.add(k.w);
      const p = placa(); if (p < 0) return null;
      g[k.w] = EMIT_CH[k.dx + ',' + k.dy]; g[p] = L;
      lasers[(k.w % W) + ',' + ((k.w / W) | 0)] = L; mecs.push({ tipo, celdas: [k.w, p] });
    } else if (tipo === 'plataforma') {
      // hueco de 2 o 3 celdas de corte seguidas en línea recta
      const largo = rng() < 0.5 ? 2 : 3; const cands = [];
      for (let i = 2; i + largo < camino.length - 1; i++) {
        const tramo = camino.slice(i, i + largo);
        if (!tramo.every((c) => corte.includes(c) && libre(c))) continue;
        const d = tramo[1] - tramo[0]; if (!tramo.every((c, j) => j === 0 || c - tramo[j - 1] === d)) continue;
        if (Math.abs(d) !== 1 && Math.abs(d) !== W) continue;
        cands.push(tramo);
      }
      const tramo = pick(cands); if (!tramo || tramo === -1) return null;
      for (const c of tramo) { usadas.add(c); g[c] = '_'; }
      const p = placa(); if (p < 0) return null;
      g[p] = L;
      plats.push({ path: tramo.map((c) => [c % W, (c / W) | 0]), plate: L }); mecs.push({ tipo, celdas: tramo.concat([p]) });
    }
  }
  const mapa = []; for (let y = 0; y < H; y++) mapa.push(g.slice(y * W, y * W + W).join(''));
  const lv = { mapa, N: 20, plantilla: pl.id + (espejo ? '~' : '') };
  if (heavy.length) lv.heavy = heavy;
  if (Object.keys(lasers).length) lv.lasers = lasers;
  if (plats.length) lv.plats = plats;
  lv._mecs = mecs;
  return lv;
}

function aReglas(lv) { return { map: lv.mapa, N: lv.N, heavy: lv.heavy, lasers: lv.lasers, plats: lv.plats }; }

// Menor número de copias (hasta kmax) y segundo mínimo. null si no se puede; {overflow} si desborda.
function minimo(lv, kmax, cap) {
  for (let k = 1; k <= kmax; k++) {
    const r = solveK(aReglas(lv), k, k >= 3 ? cap / 4 : cap); // con 3 copias el árbol crece 25 veces: tope menor
    if (r && r.overflow) return { overflow: true };
    if (r) return { k: r.copies, t: r.t, path: r.path };
  }
  return null;
}

// Quita un mecanismo (vuelve suelo sus celdas; el emisor vuelve pared).
function sinMecanismo(lv, m) {
  const W = lv.mapa[0].length; const g = lv.mapa.join('').split('');
  const r = JSON.parse(JSON.stringify({ heavy: lv.heavy, lasers: lv.lasers, plats: lv.plats }));
  for (const c of m.celdas) {
    const ch = g[c];
    if ('>v<^'.includes(ch)) { g[c] = '#'; if (r.lasers) delete r.lasers[(c % W) + ',' + ((c / W) | 0)]; }
    else g[c] = '.';
  }
  if (m.tipo === 'plataforma' && r.plats) r.plats = r.plats.filter((p) => !(p.path[0][0] === m.celdas[0] % W && p.path[0][1] === ((m.celdas[0] / W) | 0)));
  const mapa = []; for (let y = 0; y < lv.mapa.length; y++) mapa.push(g.slice(y * W, y * W + W).join(''));
  return { mapa, N: lv.N, heavy: r.heavy, lasers: r.lasers, plats: r.plats };
}

const TIPOS = ['puerta', 'inversa', 'carga', 'laser', 'plataforma'];

// Genera el reto de una fecha. opts.cap = tope de estados (2e6 según diseño).
export function generarDiario(fecha, opts = {}) {
  const cap = opts.cap || CAP_DIARIO;
  const rng = mulberry32(hash32('antes:' + fecha));
  const dow = diaSemana(fecha); const nMec = (dow === 1 || dow === 2) ? 2 : 3;
  for (let intento = 0; intento < 400; intento++) {
    // mecanismos: uno por categoría, en el orden que da la semilla
    const bolsa = TIPOS.slice(); const tipos = [];
    while (tipos.length < nMec) tipos.push(bolsa.splice(Math.floor(rng() * bolsa.length), 1)[0]);
    const lv = armar(rng, tipos);
    if (!lv) continue;
    const st = opts.stats; const t0 = st ? Date.now() : 0;
    const m = minimo(lv, 3, cap);
    if (st) { st.tMin = (st.tMin || 0) + Date.now() - t0; const r = !m ? 'sin' : m.overflow ? 'desborda' : m.k === 1 ? 'k1' : 'ok'; st[r] = (st[r] || 0) + 1; }
    if (!m || m.overflow || m.k === 1) continue;
    const t1 = st ? Date.now() : 0;
    let todos = true;
    for (const mec of lv._mecs) {
      const sm = minimo(sinMecanismo(lv, mec), m.k, cap);
      if (sm && !sm.overflow && sm.k === m.k && sm.t === m.t) { todos = false; break; }
    }
    if (st) { st.tNec = (st.tNec || 0) + Date.now() - t1; if (!todos) st.sobra = (st.sobra || 0) + 1; }
    if (!todos) continue;
    const N = m.t + 1;
    const fin = { id: 'D-' + fecha, cap: 0, diario: true, fecha, reto: numeroReto(fecha), nombre: { es: 'Reto #' + numeroReto(fecha), en: 'Daily #' + numeroReto(fecha) },
      N, mapa: lv.mapa, copias: m.k, seg: m.t, solucion: m.path, plantilla: lv.plantilla, mecanismos: tipos, intento, gen: VERSION_GEN };
    if (lv.heavy) fin.heavy = lv.heavy; if (lv.lasers) fin.lasers = lv.lasers; if (lv.plats) fin.plats = lv.plats;
    return fin;
  }
  return null;
}

// Banco de respaldo: si la generación falla, se elige uno por semilla.
export function respaldo(banco, fecha) {
  if (!banco || !banco.length) return null;
  const b = banco[hash32('antes-banco:' + fecha) % banco.length];
  return Object.assign({}, b, { id: 'D-' + fecha, fecha, reto: numeroReto(fecha), nombre: { es: 'Reto #' + numeroReto(fecha), en: 'Daily #' + numeroReto(fecha) }, respaldo: true });
}
