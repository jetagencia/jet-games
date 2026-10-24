/* JET//Balizas · generador del campo diario + verificador + contorno.
   Sin DOM: se usa en el navegador y en Node (pruebas de 400 fechas).
   Determinista: solo PRNG propio (mulberry32), enteros y operaciones IEEE exactas (+ - * / sqrt).
   Mundo: 36 columnas, y crece hacia el norte. Celda (x,y) ocupa [x,x+1]×[y,y+1]. g: 1 roca, 0 libre, 2 grieta frágil. */
(function (root) {
'use strict';
const W = 36, VERSION = 'v1';
// Lunes..Domingo (índice 0 = lunes). Ver DISENO.md 7.4 (cifras finales calibradas allí).
const DAYS = [
  { id: 'calma',      rows: 96,  loops: 2, dead: 4, drift: 6,  mines: 0,  wells: 0, ion: 0, cur: 0, cracks: 0, open: 1 },
  { id: 'minado',     rows: 108, loops: 2, dead: 5, drift: 6,  mines: 10, wells: 0, ion: 0, cur: 0, cracks: 0, open: 1 },
  { id: 'gravedad',   rows: 108, loops: 3, dead: 5, drift: 7,  mines: 8,  wells: 4, ion: 0, cur: 0, cracks: 0, open: 1 },
  { id: 'bruma',      rows: 120, loops: 3, dead: 6, drift: 7,  mines: 8,  wells: 3, ion: 4, cur: 0, cracks: 0, open: 1 },
  { id: 'corrientes', rows: 120, loops: 3, dead: 6, drift: 8,  mines: 9,  wells: 3, ion: 3, cur: 4, cracks: 0, open: 1 },
  { id: 'grietas',    rows: 132, loops: 3, dead: 6, drift: 8,  mines: 10, wells: 4, ion: 3, cur: 3, cracks: 3, open: 0 },
  { id: 'tormenta',   rows: 144, loops: 4, dead: 7, drift: 10, mines: 12, wells: 5, ion: 5, cur: 4, cracks: 2, open: 2 }
];
// Primer día de la semana en que aparece cada peligro (para «Nuevo: …»).
const HAZARD_DAY = { mines: 1, wells: 2, ion: 3, cur: 4, cracks: 5 };

function fnv(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function dayIndex(fecha) { const [y, m, d] = fecha.split('-').map(Number); const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return (dow + 6) % 7; }
const DIRS8 = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]]; // 0 = norte, horario
function dirVec(d) { const v = DIRS8[((d % 8) + 8) % 8]; const n = (v[0] && v[1]) ? Math.SQRT1_2 : 1; return [v[0] * n, v[1] * n]; }
function dirFrom(dx, dy) { // vector -> índice 0..7 (sin trigonometría)
  let best = 0, bd = -1e9;
  for (let i = 0; i < 8; i++) { const v = dirVec(i); const d = v[0] * dx + v[1] * dy; if (d > bd) { bd = d; best = i; } }
  return best;
}

/* ---------- Campo: utilidades de rejilla ---------- */
function makeGrid(H) { const g = new Uint8Array(W * H); g.fill(1); return g; }
function inb(x, y, H) { return x >= 0 && y >= 0 && x < W && y < H; }

function bfs(g, H, sx, sy, blocked) { // 4-conexo sobre celdas libres
  const dist = new Int32Array(W * H).fill(-1);
  const q = new Int32Array(W * H); let qh = 0, qt = 0;
  const s = sy * W + sx; if (g[s] !== 0 || (blocked && blocked[s])) return dist;
  dist[s] = 0; q[qt++] = s;
  while (qh < qt) {
    const c = q[qh++], cx = c % W, cy = (c / W) | 0, dc = dist[c] + 1;
    if (cx > 0) { const n = c - 1; if (dist[n] < 0 && g[n] === 0 && !(blocked && blocked[n])) { dist[n] = dc; q[qt++] = n; } }
    if (cx < W - 1) { const n = c + 1; if (dist[n] < 0 && g[n] === 0 && !(blocked && blocked[n])) { dist[n] = dc; q[qt++] = n; } }
    if (cy > 0) { const n = c - W; if (dist[n] < 0 && g[n] === 0 && !(blocked && blocked[n])) { dist[n] = dc; q[qt++] = n; } }
    if (cy < H - 1) { const n = c + W; if (dist[n] < 0 && g[n] === 0 && !(blocked && blocked[n])) { dist[n] = dc; q[qt++] = n; } }
  }
  return dist;
}
// Camino de celdas desde la meta hacia el origen siguiendo el gradiente de dist (4-conexo).
function backtrack(dist, H, tx, ty) {
  let c = ty * W + tx; if (dist[c] < 0) return null;
  const path = [c]; let lastDir = -1;
  while (dist[c] > 0) {
    const cx = c % W, cy = (c / W) | 0, cand = [];
    if (cy > 0) cand.push([c - W, 0]); if (cx < W - 1) cand.push([c + 1, 1]); if (cy < H - 1) cand.push([c + W, 2]); if (cx > 0) cand.push([c - 1, 3]);
    let nxt = -1;
    for (const [n, dd] of cand) if (dist[n] === dist[c] - 1) { if (nxt < 0 || dd === lastDir) { nxt = n; if (dd === lastDir) break; } }
    for (const [n, dd] of cand) if (n === nxt) lastDir = dd;
    c = nxt; path.push(c);
  }
  return path.reverse();
}
// Línea libre para la nave inflada (radio 0,42 + margen): muestrea cada 0,2 c y mira las 4 esquinas a ±0,46.
function clearLine(g, H, ax, ay, bx, by, rad) {
  const dx = bx - ax, dy = by - ay, L = Math.sqrt(dx * dx + dy * dy), n = Math.max(1, Math.ceil(L / 0.2));
  for (let i = 0; i <= n; i++) {
    const px = ax + dx * i / n, py = ay + dy * i / n;
    for (let k = 0; k < 4; k++) {
      const qx = Math.floor(px + ((k & 1) ? rad : -rad)), qy = Math.floor(py + ((k & 2) ? rad : -rad));
      if (!inb(qx, qy, H) || g[qy * W + qx] !== 0) return false;
    }
  }
  return true;
}
function pull(g, H, cells) { // tirón de cuerda sobre el camino de celdas → polilínea suave
  const pts = cells.map(c => [c % W + 0.5, ((c / W) | 0) + 0.5]);
  const out = [pts[0]]; let i = 0;
  while (i < pts.length - 1) {
    let j = Math.min(pts.length - 1, i + 40);
    while (j > i + 1 && !clearLine(g, H, pts[i][0], pts[i][1], pts[j][0], pts[j][1], 0.46)) j--;
    out.push(pts[j]); i = j;
  }
  return out;
}
function polyLen(p) { let s = 0; for (let i = 1; i < p.length; i++) { const dx = p[i][0] - p[i - 1][0], dy = p[i][1] - p[i - 1][1]; s += Math.sqrt(dx * dx + dy * dy); } return s; }
// Piloto verificador cinemático: velocidad máx. 4,5 c/s, frena antes de curvas. Devuelve segundos.
function pilotTime(poly) {
  if (poly.length < 2) return 0;
  const step = 0.25, pts = [];
  for (let i = 1; i < poly.length; i++) {
    const ax = poly[i - 1][0], ay = poly[i - 1][1], dx = poly[i][0] - ax, dy = poly[i][1] - ay, L = Math.sqrt(dx * dx + dy * dy), n = Math.max(1, Math.ceil(L / step));
    let lim = 4.5;
    if (i < poly.length - 1) { // ángulo en el vértice final
      const ex = poly[i + 1][0] - poly[i][0], ey = poly[i + 1][1] - poly[i][1], E = Math.sqrt(ex * ex + ey * ey) || 1;
      const cos = (dx * ex + dy * ey) / ((L || 1) * E); lim = 4.5 * Math.max(0.28, 0.5 + 0.5 * cos);
    } else lim = 2.5;
    for (let k = 1; k <= n; k++) pts.push({ d: L / n, lim: k === n ? lim : 4.5 });
  }
  const v = new Float64Array(pts.length + 1); v[0] = 0;
  for (let i = 0; i < pts.length; i++) v[i + 1] = Math.min(pts[i].lim, Math.sqrt(v[i] * v[i] + 2 * 7 * pts[i].d));
  for (let i = pts.length - 1; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] * v[i + 1] + 2 * 11 * pts[i].d));
  let t = 0; for (let i = 0; i < pts.length; i++) t += pts[i].d / Math.max(0.3, (v[i] + v[i + 1]) / 2);
  return t + 0.8; // despegue
}

/* ---------- Contorno (marching squares sobre centros de celda) ---------- */
// Devuelve segmentos [x1,y1,x2,y2,...] (Float32Array), cubetas por celda de marcha y lazos cerrados para dibujar.
function contour(g, H) {
  const solid = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 1 : (g[y * W + x] !== 0 ? 1 : 0);
  const MW = W + 1, MH = H + 1, segs = [], bucket = new Array(MW * MH);
  for (let j = -1; j < H; j++) for (let i = -1; i < W; i++) {
    const a = solid(i, j), b = solid(i + 1, j), c = solid(i + 1, j + 1), d = solid(i, j + 1);
    const code = a | (b << 1) | (c << 2) | (d << 3);
    if (code === 0 || code === 15) continue;
    const x0 = i + 0.5, y0 = j + 0.5;
    const mB = [x0 + 0.5, y0], mR = [x0 + 1, y0 + 0.5], mT = [x0 + 0.5, y0 + 1], mL = [x0, y0 + 0.5];
    // recorrido BL, mB, BR, mR, TR, mT, TL, mL ; segmentos = pares de puntos medios consecutivos
    const seq = [];
    const corners = [a, b, c, d], mids = [mB, mR, mT, mL];
    for (let k = 0; k < 4; k++) {
      const v = corners[k], nv = corners[(k + 1) % 4];
      if (v) seq.push(null); // vértice sólido
      if (v !== nv) seq.push(mids[k]);
    }
    const loc = [];
    for (let k = 0; k < seq.length; k++) {
      const p = seq[k], q = seq[(k + 1) % seq.length];
      if (p && q) { loc.push(segs.length / 4); segs.push(p[0], p[1], q[0], q[1]); }
    }
    bucket[(j + 1) * MW + (i + 1)] = loc;
  }
  return { segs: new Float32Array(segs), bucket, MW, MH };
}
// Encadena segmentos en lazos cerrados (para rellenar con suavizado de Chaikin).
function loops(ct) {
  const s = ct.segs, n = s.length / 4, key = (x, y) => Math.round(x * 2) + ',' + Math.round(y * 2);
  const start = new Map(); for (let i = 0; i < n; i++) start.set(key(s[i * 4], s[i * 4 + 1]), i);
  const used = new Uint8Array(n), out = [];
  for (let i = 0; i < n; i++) {
    if (used[i]) continue; const pts = []; let k = i, guard = 0;
    while (k !== undefined && !used[k] && guard++ < n + 2) { used[k] = 1; pts.push(s[k * 4], s[k * 4 + 1]); k = start.get(key(s[k * 4 + 2], s[k * 4 + 3])); }
    if (pts.length >= 6) out.push(pts);
  }
  return out;
}
function chaikin(pts, it) {
  let p = pts;
  for (let r = 0; r < it; r++) {
    const q = [], n = p.length / 2;
    for (let i = 0; i < n; i++) {
      const ax = p[i * 2], ay = p[i * 2 + 1], bx = p[((i + 1) % n) * 2], by = p[((i + 1) % n) * 2 + 1];
      q.push(ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25, ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75);
    }
    p = q;
  }
  return p;
}

/* ---------- Generador ---------- */
function build(seed, cfg, H) {
  const R = mulberry32(seed), ri = (a, b) => a + Math.floor(R() * (b - a + 1)), pick = a => a[Math.floor(R() * a.length)];
  const g = makeGrid(H), prot = new Uint8Array(W * H), N = H / 12;
  const free = (x, y, p) => { if (x < 1 || y < 1 || x > W - 2 || y > H - 2) return; g[y * W + x] = 0; if (p) prot[y * W + x] = 1; };
  const disc = (cx, cy, r, p) => { for (let y = Math.floor(cy - r) - 1; y <= cy + r + 1; y++) for (let x = Math.floor(cx - r) - 1; x <= cx + r + 1; x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx + dy * dy <= r * r) free(x, y, p); } };
  const seg = (ax, ay, bx, by, r) => { const dx = bx - ax, dy = by - ay, L = Math.sqrt(dx * dx + dy * dy), n = Math.max(1, Math.ceil(L / 0.35)); for (let i = 0; i <= n; i++) disc(ax + dx * i / n, ay + dy * i / n, r, true); };
  const room = (cx, cy, rx, ry) => { for (let y = Math.floor(cy - ry) - 1; y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx) - 1; x <= cx + rx + 1; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, e = dx * dx + dy * dy; if (e <= 1) free(x, y, e < 0.45); } };
  const curve = (a, b, r) => { // tramo con un punto medio desplazado (curva suave)
    const mx = (a[0] + b[0]) / 2 + (R() - 0.5) * 3, my = (a[1] + b[1]) / 2 + (R() - 0.5) * 2;
    const m = [Math.min(W - 3, Math.max(2.5, mx)), my]; seg(a[0], a[1], m[0], m[1], r); seg(m[0], m[1], b[0], b[1], r); return [a, m, b];
  };

  // 1-2) ruta principal sobre la retícula 4 × N de salas
  const nodes = []; let c = ri(1, 2), same = 0;
  for (let r = 0; r < N; r++) {
    const y0 = r * 12;
    const y = r === 0 ? 6.5 : (r === N - 1 ? H - 7.5 : y0 + ri(4, 8) + 0.5);
    nodes.push([c * 9 + ri(3, 5) + 0.5, y, r, c]);
    if (r < N - 1 && (same >= 1 || R() < 0.7)) {
      let d = c === 0 ? 1 : c === 3 ? -1 : (R() < 0.5 ? -1 : 1);
      if ((c === 0 || c === 3 || (c === 1 && d > 0) || (c === 2 && d < 0)) && R() < 0.45) d *= 2; // salto de dos columnas: zigzag ancho
      c += d; same = 0;
      nodes.push([c * 9 + ri(3, 5) + 0.5, Math.min(y0 + 10.5, y + ri(1, 3)), r, c]);
    } else same++;
  }
  const start = [nodes[0][0], 2.5], gate = [nodes[nodes.length - 1][0], H - 2.5];
  room(start[0], 4.5, 3.6, 3.2); room(gate[0], H - 4.5, 3.6, 3.2);
  seg(start[0], 3, nodes[0][0], nodes[0][1], 1.4); seg(gate[0], H - 3.5, nodes[nodes.length - 1][0], nodes[nodes.length - 1][1], 1.4);
  const mainPoly = [];
  for (let i = 0; i < nodes.length; i++) {
    room(nodes[i][0], nodes[i][1], ri(26, 40) / 10, ri(26, 44) / 10);
    if (i > 0) { const cv = curve(nodes[i - 1], nodes[i], ri(10, 16) / 10); if (i === 1) mainPoly.push(cv[0]); mainPoly.push(cv[1], cv[2]); }
  }

  // 3) lazos: alternativa segura y larga junto a un tramo rápido
  const loopsOut = [], usedNode = new Uint8Array(nodes.length);
  for (let L = 0, tries = 0; L < cfg.loops && tries < 40; tries++) {
    const i = ri(1, nodes.length - 4), j = Math.min(nodes.length - 2, i + ri(2, 4));
    if (j - i < 2) continue; let busy = false; for (let k = i; k <= j; k++) if (usedNode[k]) busy = true; if (busy) continue;
    let a = 99, b = -99; for (let k = i; k <= j; k++) { a = Math.min(a, nodes[k][0]); b = Math.max(b, nodes[k][0]); }
    const lg = a - 2, rg = W - 3 - b; const left = lg >= rg; const gap = left ? lg : rg;
    if (gap < 5) continue;
    const xs = left ? Math.max(2.5, a - Math.max(4.5, gap * 0.75)) : Math.min(W - 2.5, b + Math.max(4.5, gap * 0.75));
    const ni = nodes[i], nj = nodes[j], w1 = [xs, ni[1] + (nj[1] - ni[1]) * 0.22], w2 = [xs, ni[1] + (nj[1] - ni[1]) * 0.78];
    const loopPoly = [ni, w1, w2, nj];
    let mainLen = 0; for (let k = i + 1; k <= j; k++) { const dx = nodes[k][0] - nodes[k - 1][0], dy = nodes[k][1] - nodes[k - 1][1]; mainLen += Math.sqrt(dx * dx + dy * dy); }
    const lpl = polyLen(loopPoly), ratio = lpl / Math.max(1, mainLen);
    if (ratio < 1.35 || ratio > 2.6) continue;
    seg(ni[0], ni[1], w1[0], w1[1], 1.15); seg(w1[0], w1[1], w2[0], w2[1], 1.15); seg(w2[0], w2[1], nj[0], nj[1], 1.15);
    room(w1[0], w1[1], 2.4, 2.4); room(w2[0], w2[1], 2.4, 2.4);
    for (let k = i; k <= j; k++) usedNode[k] = 1;
    loopsOut.push({ i, j, w1, w2, ratio }); L++;
  }

  // 4) callejones (los primeros dos, tentadores: anchos y hacia el norte)
  const deads = [];
  const isRockArea = (cx, cy, r) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { if (!inb(x, y, H) || x < 1 || x > W - 2 || y < 1 || y > H - 2) return false; const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx + dy * dy <= r * r && g[y * W + x] === 0) return false; } return true; };
  for (let D = 0, tries = 0; D < cfg.dead && tries < 400; tries++) {
    const k = ri(1, nodes.length - 2), n = nodes[k], tempt = D < 2;
    const sx = R() < 0.5 ? -1 : 1, dx = sx * ri(6, 12), dy = tempt ? ri(4, 9) : ri(-3, 6);
    const tx = n[0] + dx, ty = n[1] + dy;
    if (tx < 3 || tx > W - 3 || ty < 8 || ty > H - 10) continue;
    const mx = (n[0] + tx) / 2, my = (n[1] + ty) / 2, dxl = tx - n[0], dyl = ty - n[1], len = Math.sqrt(dxl * dxl + dyl * dyl);
    const ex = n[0] + dxl * (3.2 / len), ey = n[1] + dyl * (3.2 / len); // fuera de la sala de origen
    if (!isRockArea(tx, ty, 3.4) || !isRockArea(mx, my, 2.2) || !isRockArea((ex + mx) / 2, (ey + my) / 2, 1.6)) continue;
    seg(n[0], n[1], tx, ty, tempt ? ri(14, 17) / 10 : ri(10, 13) / 10); room(tx, ty, ri(20, 28) / 10, ri(20, 28) / 10);
    deads.push({ k, from: [n[0], n[1]], to: [tx, ty], tempt, dir: dirFrom(dxl, dyl) }); D++;
  }

  // 7) tallado orgánico: flecos con ruido + autómata celular 4 pasadas, regla 5/4
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x; if (g[i] !== 1) continue;
    let nf = 0; for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) if (g[i + yy * W + xx] === 0) nf++;
    if (nf && R() < 0.42) g[i] = 3; // marca temporal
  }
  for (let i = 0; i < g.length; i++) if (g[i] === 3) g[i] = 0;
  const tmp = new Uint8Array(W * H);
  for (let pass = 0; pass < 4; pass++) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) { tmp[i] = 1; continue; }
      if (prot[i]) { tmp[i] = 0; continue; }
      let nr = 0; for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) if ((xx || yy) && g[i + yy * W + xx] !== 0) nr++;
      tmp[i] = g[i] ? (nr >= 4 ? 1 : 0) : (nr >= 5 ? 1 : 0);
    }
    g.set(tmp);
  }
  // celdas libres aisladas → roca; rellenar huecos de 1 celda sin salida
  const sx0 = Math.floor(start[0]), sy0 = Math.floor(start[1]), gx0 = Math.floor(gate[0]), gy0 = Math.floor(gate[1]);
  let dS = bfs(g, H, sx0, sy0);
  for (let i = 0; i < g.length; i++) if (g[i] === 0 && dS[i] < 0) g[i] = 1;
  if (dS[gy0 * W + gx0] < 0) return { ok: false, why: 'puerta' };

  // 5) atajos (abiertos y grietas): tramo recto de roca entre dos puntos lejanos por el camino
  const shortcuts = [], need = cfg.open + cfg.cracks;
  const nearSC = (x, y) => shortcuts.some(s => s.cells.some(c => { const dx = (c % W) - x, dy = ((c / W) | 0) - y; return dx * dx + dy * dy < 100; }));
  for (let s = 0; s < need; s++) {
    dS = bfs(g, H, sx0, sy0); let best = null;
    for (let y = 8; y < H - 8; y++) for (let x = 1; x < W - 1; x++) {
      const a = y * W + x; if (g[a] !== 0 || dS[a] < 0) continue;
      for (let dir = 0; dir < 4; dir++) {
        const ddx = [0, 1, 0, -1][dir], ddy = [1, 0, -1, 0][dir];
        let k = 1; const cells = [];
        while (k <= 9) { const xx = x + ddx * k, yy = y + ddy * k; if (xx < 1 || yy < 1 || xx > W - 2 || yy > H - 2) { k = 99; break; } const ci = yy * W + xx; if (g[ci] === 0) break; cells.push(ci); k++; }
        if (k > 9 || cells.length < 2) continue;
        const b = (y + ddy * k) * W + (x + ddx * k); if (dS[b] < 0) continue;
        const around = dS[b] - dS[a], saving = around - k;
        if (around < 2.4 * k || saving < 14) continue;
        if (nearSC(x, y)) continue;
        const sc = saving + (R() * 4);
        if (!best || sc > best.sc) best = { sc, cells, a, b, saving, around, k, dir };
      }
    }
    if (!best) break;
    const fragile = s >= cfg.open;
    best.cells.forEach((ci, idx) => { g[ci] = (fragile && idx === (best.cells.length >> 1)) ? 2 : 0; });
    shortcuts.push({ cells: best.cells, a: best.a, b: best.b, fragile, saving: best.saving, around: best.around, dir: [0, 2, 4, 6][best.dir] });
  }
  if (shortcuts.length < Math.max(1, cfg.open)) return { ok: false, why: 'atajo' };
  if (cfg.cracks && !shortcuts.some(s => s.fragile)) return { ok: false, why: 'grieta' };

  dS = bfs(g, H, sx0, sy0);
  const dG = bfs(g, H, gx0, gy0);
  const route = dS[gy0 * W + gx0];
  const near = (x, y, px, py, r) => { const dx = x - px, dy = y - py; return dx * dx + dy * dy < r * r; };

  // 9) boyas: cada ~24 filas, en cada tramo horizontal libre alcanzable de esa fila
  const buoys = [];
  for (let by = 24; by < H - 10; by += 24) {
    let x = 1;
    while (x < W - 1) {
      if (g[by * W + x] === 0 && dS[by * W + x] >= 0) {
        let x2 = x; while (x2 + 1 < W - 1 && g[by * W + x2 + 1] === 0) x2++;
        if (x2 - x >= 1) {
          const cx = Math.floor((x + x2) / 2), ci = by * W + cx;
          // solo si el tramo está en un camino que lleva a la puerta (descarta callejones)
          if (dG[ci] >= 0 && dS[ci] + dG[ci] <= route * 1.9 + 20) buoys.push([cx + 0.5, by + 0.5]);
        }
        x = x2 + 1;
      } else x++;
    }
  }
  const scCells = new Set(); shortcuts.forEach(s => { s.cells.forEach(c => scCells.add(c)); scCells.add(s.a); scCells.add(s.b); });
  const okSpot = (x, y, r) => { // celda libre con margen r de paredes y lejos de salida, puerta, boyas y atajos
    if (near(x, y, start[0], 4, 6.5) || near(x, y, gate[0], gate[1], 6.5)) return false;
    for (const b of buoys) if (near(x, y, b[0], b[1], 6)) return false;
    for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) { if (!inb(xx, yy, H) || g[yy * W + xx] !== 0) return false; if (scCells.has(yy * W + xx)) return false; }
    return dS[Math.floor(y) * W + Math.floor(x)] >= 0;
  };
  // puntos de la ruta principal (para repartir peligros)
  const along = [], fastSeg = new Uint8Array(nodes.length);
  loopsOut.forEach(l => { for (let k = l.i; k < l.j; k++) fastSeg[k] = 1; });
  for (let k = 0; k < nodes.length - 1; k++) for (let t = 1; t <= 4; t++) { const f = t / 5; along.push({ x: nodes[k][0] + (nodes[k + 1][0] - nodes[k][0]) * f, y: nodes[k][1] + (nodes[k + 1][1] - nodes[k][1]) * f, k, fast: fastSeg[k], dx: nodes[k + 1][0] - nodes[k][0], dy: nodes[k + 1][1] - nodes[k][1] }); }
  const pickAlong = (fastFirst) => { const f = along.filter(p => p.fast); return (fastFirst && f.length && R() < 0.65) ? pick(f) : pick(along); };

  // 6) tesoros: en callejones o lazos largos, nunca en la ruta principal
  const tCand = [];
  deads.forEach(d => tCand.push([Math.floor(d.to[0]) + 0.5, Math.floor(d.to[1]) + 0.5, 'dead']));
  loopsOut.forEach(l => tCand.push([Math.floor((l.w1[0] + l.w2[0]) / 2) + 0.5, Math.floor((l.w1[1] + l.w2[1]) / 2) + 0.5, 'loop']));
  for (let i = tCand.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = tCand[i]; tCand[i] = tCand[j]; tCand[j] = t; }
  const treasures = [];
  for (const t of tCand) { if (treasures.length >= 3) break; const ci = Math.floor(t[1]) * W + Math.floor(t[0]); if (g[ci] !== 0 || dS[ci] < 0) continue; if (treasures.some(o => near(o[0], o[1], t[0], t[1], 8))) continue; treasures.push([t[0], t[1], t[2]]); }
  if (treasures.length < 3) return { ok: false, why: 'tesoros' };

  // 8) peligros por presupuesto
  const mines = [], drifts = [], wells = [], ions = [], currents = [];
  const hazardNear = (x, y, r) => mines.some(m => near(x, y, m[0], m[1], r)) || wells.some(m => near(x, y, m[0], m[1], r)) || drifts.some(d => near(x, y, (d.ax + d.bx) / 2, (d.ay + d.by) / 2, r));
  const safeRoute = () => { // existe ruta sin entrar en el radio de ninguna mina (sin daño obligatorio)
    const blk = new Uint8Array(W * H);
    for (const m of mines) for (let y = Math.floor(m[1] - 3); y <= m[1] + 3; y++) for (let x = Math.floor(m[0] - 3); x <= m[0] + 3; x++) if (inb(x, y, H) && near(x + 0.5, y + 0.5, m[0], m[1], 2.05)) blk[y * W + x] = 1;
    const d = bfs(g, H, sx0, sy0, blk); return { ok: d[gy0 * W + gx0] >= 0, d, blk };
  };
  // rocas a la deriva: cruzan el pasillo perpendicularmente
  const makeDrift = (p) => {
    const L = Math.sqrt(p.dx * p.dx + p.dy * p.dy) || 1, nx = -p.dy / L, ny = p.dx / L;
    const reach = (sgn) => { let d = 0; while (d < 4.5) { const qx = p.x + nx * sgn * (d + 0.25), qy = p.y + ny * sgn * (d + 0.25); if (!inb(Math.floor(qx), Math.floor(qy), H) || g[Math.floor(qy) * W + Math.floor(qx)] !== 0) break; d += 0.25; } return Math.max(0, d - 0.75); };
    const r1 = reach(1), r2 = reach(-1); if (r1 + r2 < 1.6) return null;
    return { ax: p.x + nx * r1, ay: p.y + ny * r1, bx: p.x - nx * r2, by: p.y - ny * r2, per: ri(40, 90) / 10, ph: ri(0, 99) / 100, r: 0.5 };
  };
  // el tesoro más arriesgado: una roca a la deriva vigila el callejón del primero
  { const t = treasures.find(t => t[2] === 'dead'); if (t) { const d = deads.find(d => Math.floor(d.to[0]) + 0.5 === t[0] && Math.floor(d.to[1]) + 0.5 === t[1]); if (d) { const p = { x: d.from[0] + (d.to[0] - d.from[0]) * 0.62, y: d.from[1] + (d.to[1] - d.from[1]) * 0.62, dx: d.to[0] - d.from[0], dy: d.to[1] - d.from[1] }; const dr = makeDrift(p); if (dr && okSpot(p.x, p.y, 0)) { dr.guard = 1; drifts.push(dr); t[3] = 1; } } } }
  for (let n = 0, tries = 0; drifts.length < cfg.drift && tries < 200; tries++) { const p = pickAlong(true); if (!okSpot(p.x, p.y, 0) || hazardNear(p.x, p.y, 5)) continue; const dr = makeDrift(p); if (dr) drifts.push(dr); }
  for (let tries = 0; mines.length < cfg.mines && tries < 300; tries++) {
    const p = pickAlong(true), x = Math.floor(p.x + (R() - 0.5) * 4) + 0.5, y = Math.floor(p.y + (R() - 0.5) * 4) + 0.5;
    if (!okSpot(x, y, 1) || hazardNear(x, y, 3.4) || treasures.some(t => near(x, y, t[0], t[1], 3))) continue;
    mines.push([x, y]); if (!safeRoute().ok) mines.pop();
  }
  for (let tries = 0; wells.length < cfg.wells && tries < 200; tries++) {
    const p = R() < 0.5 ? pick(along) : (k => ({ x: nodes[k][0], y: nodes[k][1] }))(ri(2, nodes.length - 3));
    const x = Math.floor(p.x) + 0.5, y = Math.floor(p.y) + 0.5;
    if (!okSpot(x, y, 1) || hazardNear(x, y, 4) || wells.some(w => near(x, y, w[0], w[1], 9))) continue;
    wells.push([x, y, 3]);
  }
  for (let tries = 0; ions.length < cfg.ion && tries < 200; tries++) {
    const p = pick(along); if (near(p.x, p.y, start[0], 4, 9) || near(p.x, p.y, gate[0], gate[1], 8) || ions.some(o => near(p.x, p.y, o[0], o[1], 12))) continue;
    ions.push([p.x, p.y, ri(30, 42) / 10]);
  }
  for (let tries = 0; currents.length < cfg.cur && tries < 200; tries++) {
    const p = pick(along); if (!okSpot(p.x, p.y, 0) || currents.some(o => near(p.x, p.y, o.x, o.y, 12))) continue;
    const L = Math.sqrt(p.dx * p.dx + p.dy * p.dy) || 1; let d = dirFrom(-p.dy / L * (R() < 0.5 ? 1 : -1), p.dx / L); if (R() < 0.35) d = dirFrom(p.dx, p.dy);
    currents.push({ x: p.x, y: p.y, d, hl: 4, hw: 1.8, f: 3 });
  }
  const sr = safeRoute();
  if (!sr.ok) return { ok: false, why: 'minas' };

  // 7.5) piloto verificador: mejor ruta segura (atajos abiertos sí, grietas no)
  const pathCells = backtrack(sr.d, H, gx0, gy0);
  const pilot = pull(g, H, pathCells);
  const tPilot = pilotTime(pilot);
  const par = Math.round(tPilot * 1.35);
  const routeLen = polyLen(pilot);

  // 7.6) balizas de práctica (honestas)
  const practice = [];
  const farFrom = (x, y) => practice.every(p => !near(x, y, p.x, p.y, 5)) && !near(x, y, start[0], 4, 6) && !near(x, y, gate[0], gate[1], 3.5);
  const snap = (x, y) => { const cx = Math.floor(x), cy = Math.floor(y); for (let r = 0; r <= 2; r++) for (let yy = cy - r; yy <= cy + r; yy++) for (let xx = cx - r; xx <= cx + r; xx++) if (inb(xx, yy, H) && g[yy * W + xx] === 0 && dS[yy * W + xx] >= 0) return [xx + 0.5, yy + 0.5]; return null; };
  const add = (x, y, s, d) => { const p = snap(x, y); if (p && farFrom(p[0], p[1])) { practice.push({ x: p[0], y: p[1], s, d: d | 0 }); return true; } return false; };
  // atajo: en la boca, apuntando al paso
  shortcuts.forEach(s => { const a = dS[s.a] <= dS[s.b] ? s.a : s.b, other = a === s.a ? s.b : s.a; const ax = a % W + 0.5, ay = ((a / W) | 0) + 0.5, bx = other % W + 0.5, by = ((other / W) | 0) + 0.5; add(ax, ay, 'atajo', dirFrom(bx - ax, by - ay)); });
  // no por aquí en la boca de los 2 callejones más tentadores
  deads.filter(d => d.tempt).slice(0, 2).forEach(d => { const L = Math.sqrt((d.to[0] - d.from[0]) ** 2 + (d.to[1] - d.from[1]) ** 2); add(d.from[0] + (d.to[0] - d.from[0]) * 3.6 / L, d.from[1] + (d.to[1] - d.from[1]) * 3.6 / L, 'noporaqui', d.dir); });
  // flecha en las bifurcaciones hacia callejón, apuntando a la buena salida
  deads.forEach(d => { const k = d.k, nx = nodes[k + 1]; if (!nx) return; add(d.from[0], d.from[1], 'flecha', dirFrom(nx[0] - d.from[0], nx[1] - d.from[1])); });
  // peligro antes de tramos con 3 o más peligros
  loopsOut.forEach(l => { const a = nodes[l.i], b = nodes[l.i + 1]; let cnt = 0; mines.concat(drifts.map(d => [(d.ax + d.bx) / 2, (d.ay + d.by) / 2])).forEach(m => { for (let k = l.i; k <= l.j; k++) if (near(m[0], m[1], nodes[k][0], nodes[k][1], 6)) { cnt++; break; } }); if (cnt >= 2) add(a[0] + (b[0] - a[0]) * 0.15, a[1] + (b[1] - a[1]) * 0.15, 'peligro', 0); });
  // tesoro: a 3 c del desvío al tesoro más difícil
  { const t = treasures.find(t => t[3]) || treasures[0]; const d = deads.find(d => Math.floor(d.to[0]) + 0.5 === t[0] && Math.floor(d.to[1]) + 0.5 === t[1]); if (d) { const L = Math.sqrt((d.to[0] - d.from[0]) ** 2 + (d.to[1] - d.from[1]) ** 2); add(d.from[0] + (d.to[0] - d.from[0]) * 3 / L, d.from[1] + (d.to[1] - d.from[1]) * 3 / L, 'tesoro', 0); } }

  // estela de práctica: ruta del verificador con una variación lateral suave
  const trail = []; { const step = 0.6; let acc = 0; for (let i = 1; i < pilot.length; i++) { const a = pilot[i - 1], b = pilot[i], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy), n = Math.max(1, Math.ceil(L / step)); for (let k = 0; k < n; k++) { acc++; const f = k / n, off = ((acc * 2654435761 >>> 0) % 7 - 3) / 10 * 0.3 * (L > 2 ? 1 : 0); trail.push([a[0] + dx * f - dy / (L || 1) * off, a[1] + dy * f + dx / (L || 1) * off]); } } trail.push(pilot[pilot.length - 1]); }

  // verificaciones de aceptación (7.3)
  for (const t of treasures) { const ci = Math.floor(t[1]) * W + Math.floor(t[0]); if (dS[ci] < 0 || dG[ci] < 0) return { ok: false, why: 'tesoro aislado' }; }
  for (const b of buoys) if (dS[Math.floor(b[1]) * W + Math.floor(b[0])] < 0) return { ok: false, why: 'boya' };
  if (loopsOut.length < Math.min(cfg.loops, 1)) return { ok: false, why: 'lazos' };
  if (route < H * 1.15 || route > H * 3) return { ok: false, why: 'longitud ' + route };

  return {
    ok: true, W, H, g, start: [start[0], 3.5], gate, nodes: nodes.map(n => [n[0], n[1]]), loops: loopsOut, deads, shortcuts,
    buoys, treasures: treasures.map(t => [t[0], t[1]]), mines, drifts, wells, ions, currents, practice, trail, pilot, par, tPilot, route, routeLen
  };
}

function generate(fecha, opt) {
  const di = dayIndex(fecha), cfg = DAYS[di], H = cfg.rows, t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  for (let k = 0; k <= 60; k++) {
    const seed = fnv('JET-BALIZAS|' + fecha + '|' + VERSION + (k ? '|#' + k : ''));
    const f = build(seed, cfg, H);
    if (f.ok) {
      f.fecha = fecha; f.k = k; f.seed = seed; f.day = di; f.cfg = cfg; f.version = VERSION;
      f.ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
      f.hash = hashField(f);
      return f;
    }
    if (opt && opt.log) opt.log(fecha, k, f.why);
  }
  return null;
}
function hashField(f) { let h = 0x811c9dc5; for (let i = 0; i < f.g.length; i++) { h ^= f.g[i]; h = Math.imul(h, 0x01000193) >>> 0; } h ^= Math.round(f.par); h = Math.imul(h, 0x01000193) >>> 0; return (h >>> 0).toString(16); }

/* ---------- Campo de prácticas (tutorial, hecho a mano, 36 × 60) ---------- */
function tutorialField() {
  const H = 60, g = makeGrid(H);
  const free = (x, y) => { if (x < 1 || y < 1 || x > W - 2 || y > H - 2) return; g[y * W + x] = 0; };
  const disc = (cx, cy, r) => { for (let y = Math.floor(cy - r) - 1; y <= cy + r + 1; y++) for (let x = Math.floor(cx - r) - 1; x <= cx + r + 1; x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx + dy * dy <= r * r) free(x, y); } };
  const seg = (ax, ay, bx, by, r) => { const dx = bx - ax, dy = by - ay, L = Math.sqrt(dx * dx + dy * dy), n = Math.max(1, Math.ceil(L / 0.3)); for (let i = 0; i <= n; i++) disc(ax + dx * i / n, ay + dy * i / n, r); };
  // 1. pilotar: corredor ancho con curva, termina en una sala con pared suave delante
  disc(18, 4.5, 3.4); seg(18, 4, 18, 11, 2.1); seg(18, 11, 23, 17, 2.1); disc(23.5, 19.5, 3.2);
  // 2. bifurcación en Y: izquierda callejón (sin daño), derecha sigue
  seg(23.5, 20, 13, 29, 1.5); disc(11.5, 31, 2.6);
  seg(23.5, 20, 29, 28, 1.5); disc(29.5, 30, 2.6);
  // 3. franja con 3 minas y un rodeo
  seg(29.5, 30, 26, 37, 1.5); disc(24, 39.5, 3.6); seg(26, 37, 31.5, 39, 1.2); seg(31.5, 39, 27.5, 43, 1.2); seg(24, 39.5, 20, 44, 1.5);
  // 4. callejón que el jugador marca
  disc(19.5, 45.5, 2.8); seg(19.5, 45.5, 8.5, 47.5, 1.4); disc(7, 47.5, 2.2);
  // 5. pozo engañoso a la derecha + puerta
  seg(19.5, 45.5, 28, 50, 1.3); disc(29.5, 50.5, 2.4);
  seg(19.5, 45.5, 18, 52, 1.6); disc(18, 55.5, 3.2);
  const start = [18, 3.5], gate = [18, 57.5];
  return {
    ok: true, tutorial: true, W, H, g, start, gate, nodes: [], loops: [], deads: [], shortcuts: [], buoys: [[23.5, 19.5], [24.5, 40.5]], treasures: [[11.5, 31.5]],
    mines: [[23.5, 38.5], [25.5, 39.5], [21.5, 39.5]], drifts: [], wells: [[29.5, 50.5, 3]], ions: [], currents: [],
    practice: [{ x: 23.5, y: 22.5, s: 'flecha', d: 1, tut: 1 }, { x: 28.5, y: 33.5, s: 'peligro', d: 0, tut: 1 }, { x: 22.5, y: 47.5, s: 'flecha', d: 2, tut: 1, trap: 1 }],
    trail: [], pilot: [], par: 90, route: 80, fecha: 'tutorial', day: 0, cfg: DAYS[0], hash: 'tut',
    zones: { s2: [23.5, 22], s2dead: [11.5, 31], s3: [28.5, 33], s4: [12, 47.5], s5: [18, 54] }
  };
}

const API = { W, VERSION, DAYS, HAZARD_DAY, DIRS8, dirVec, dirFrom, fnv, mulberry32, dayIndex, generate, tutorialField, contour, loops, chaikin, bfs, polyLen, pilotTime };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.BalGen = API;
})(typeof self !== 'undefined' ? self : this);
