// JET//Antes · dibujo de la sala (Canvas 2D). Vista cenital con falsa perspectiva (DISENO.md 12).
// Trabaja en «coordenadas de pantalla»: si la sala se gira 90° (salas anchas en vertical), se gira el
// mapa y todo se dibuja ya girado, así el astronauta nunca queda de costado.
import { drawAstro, setTS, rr } from './astro.js';

export const COLOR_ECO = ['#00f2cf', '#a46bff', '#fdd835', '#ff7ab8', '#5cffa8', '#ffa34d'];
export const COLOR_AURORA = ['#7dffe6', '#ff9df0', '#9fd0ff', '#ffe08a', '#b6ff9d', '#d7b0ff'];
export const ACENTO_CAP = ['#00f2cf', '#00f2cf', '#ffb547', '#ff4466', '#5cffa8', '#a46bff'];
const COLOR_PLACA = ['#36d6ff', '#ffb547', '#c58cff', '#8dff6a'];
const LETRA = 'ABCD';
const ROT_DIR = { U: 'R', R: 'D', D: 'L', L: 'U', W: 'W' }; // sala → pantalla, giro horario
const DIRV = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
const EMV = { '>': [1, 0], '<': [-1, 0], 'v': [0, 1], '^': [0, -1] };

function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function hashCell(i, k) { let h = (i * 374761393 + k * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export const easeOut = (p) => 1 - Math.pow(1 - p, 3);

// Gira un nivel 90° en sentido horario (para dibujar). Devuelve funciones de conversión.
function prepararPantalla(lv, rot) {
  const H = lv.mapa.length, W = lv.mapa[0].length;
  if (!rot) return { mapa: lv.mapa, GW: W, GH: H, toS: (x, y) => [x, y], dir: (d) => d, W, H };
  const rotCh = { '>': 'v', 'v': '<', '<': '^', '^': '>' };
  const mapa = [];
  for (let sy = 0; sy < W; sy++) { let fila = ''; for (let sx = 0; sx < H; sx++) { const ch = lv.mapa[H - 1 - sx][sy]; fila += rotCh[ch] || ch; } mapa.push(fila); }
  return { mapa, GW: H, GH: W, toS: (x, y) => [H - 1 - y, x], dir: (d) => ROT_DIR[d] || d, W, H };
}

export function crearVista(cv) {
  const ctx = cv.getContext('2d');
  const V = { cv, ctx, cs: 32, ox: 0, oy: 0, rot: false, dpr: 1, lv: null, scr: null, estatico: null, puertas: [], laser: [], parts: [], t0: performance.now(), opts: {} };

  V.ajustar = function (lv, rect, o = {}) {
    V.lv = lv; V.opts = o;
    const H = lv.mapa.length, W = lv.mapa[0].length;
    const fit = (gw, gh) => Math.floor(Math.min(rect.w / gw, rect.h / gh));
    let cs = fit(W, H), rot = false;
    if (o.permitirGiro && W >= 14 && rect.h > rect.w) { const cr = fit(H, W); if (cr > cs * 1.25) { cs = cr; rot = true; } }
    cs = Math.max(14, Math.min(96, cs));
    V.rot = rot; V.cs = cs; V.scr = prepararPantalla(lv, rot);
    V.ox = Math.round(rect.x + (rect.w - V.scr.GW * cs) / 2); V.oy = Math.round(rect.y + (rect.h - V.scr.GH * cs) / 2);
    V.dpr = Math.min(3, window.devicePixelRatio || 1);
    V.W = o.ancho ?? cv.clientWidth; V.H = o.alto ?? cv.clientHeight;
    const cw = Math.round(V.W * V.dpr), ch = Math.round(V.H * V.dpr);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    V.parts = [];
    V.compilarEstatico(o.cap || 0);
    if (V.puertas.length !== (o.nPuertas || 0)) V.puertas = new Array(o.nPuertas || 0).fill(0);
    return V;
  };
  // centro en píxeles de una celda de la sala (x, y pueden ser fraccionarios)
  V.centro = function (x, y) { const [sx, sy] = V.scr.toS(x, y); return [V.ox + (sx + 0.5) * V.cs, V.oy + (sy + 0.5) * V.cs]; };
  V.celdaDePixel = function (px, py) {
    const sx = Math.floor((px - V.ox) / V.cs), sy = Math.floor((py - V.oy) / V.cs);
    if (sx < 0 || sy < 0 || sx >= V.scr.GW || sy >= V.scr.GH) return null;
    if (!V.rot) return [sx, sy];
    return [sy, V.scr.H - 1 - sx];
  };

  // ── capa estática: suelo, paredes, vacío, rieles, emisores, cables ──
  V.compilarEstatico = function (cap) {
    const { mapa, GW, GH } = V.scr, cs = V.cs, dpr = V.dpr;
    const oc = V.estatico || document.createElement('canvas');
    oc.width = Math.max(1, Math.ceil((GW * cs + 4) * dpr)); oc.height = Math.max(1, Math.ceil((GH * cs + 4) * dpr));
    const c = oc.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, GW * cs + 4, GH * cs + 4);
    const acento = ACENTO_CAP[cap] || ACENTO_CAP[0];
    const k = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH) ? '#' : mapa[y][x];
    const esMuro = (ch) => ch === '#' || !!EMV[ch];
    const front = Math.max(3, Math.round(cs * 0.14));
    // suelo y vacío
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const ch = k(x, y), px = x * cs, py = y * cs;
      if (esMuro(ch)) continue;
      if (ch === '_') {
        const g = c.createLinearGradient(px, py, px, py + cs); g.addColorStop(0, '#020006'); g.addColorStop(1, '#07031a'); c.fillStyle = g; c.fillRect(px, py, cs, cs);
        for (let s = 0; s < 6; s++) { const r = hashCell(y * GW + x, s); c.fillStyle = `rgba(220,210,255,${0.25 + 0.6 * hashCell(y * GW + x, s + 9)})`; c.fillRect(px + r * cs, py + hashCell(y * GW + x, s + 3) * cs, 1.1, 1.1); }
        continue;
      }
      c.fillStyle = '#120a26'; c.fillRect(px, py, cs, cs);
      // VIS-ANTES-01: en casillas chicas (cs < 24) el suelo lleva una sola junta de 1 px; sin remaches ni patrones
      if (cs < 24) { c.strokeStyle = 'rgba(255,255,255,.10)'; c.lineWidth = 1; c.strokeRect(px + 0.5, py + 0.5, cs - 1, cs - 1); continue; }
      // panel con juntas y remaches; variación de patrón por capítulo
      c.strokeStyle = '#1c1238'; c.lineWidth = Math.max(1, cs * 0.035); c.strokeRect(px + 1, py + 1, cs - 2, cs - 2);
      c.fillStyle = 'rgba(255,255,255,.035)'; c.fillRect(px + 2, py + 2, cs - 4, cs * 0.18);
      const pat = cap % 3;
      c.strokeStyle = 'rgba(40,26,80,.8)'; c.lineWidth = 1;
      if (pat === 1) { c.beginPath(); c.moveTo(px + cs / 2, py + 3); c.lineTo(px + cs / 2, py + cs - 3); c.stroke(); }
      else if (pat === 2) { c.beginPath(); c.moveTo(px + 3, py + cs / 2); c.lineTo(px + cs - 3, py + cs / 2); c.stroke(); }
      c.fillStyle = 'rgba(90,70,150,.55)'; const rv = Math.max(1, cs * 0.035);
      for (const [ax, ay] of [[0.14, 0.14], [0.86, 0.14], [0.14, 0.86], [0.86, 0.86]]) { c.beginPath(); c.arc(px + ax * cs, py + ay * cs, rv, 0, 7); c.fill(); }
      if (hashCell(y * GW + x, 77) < 0.12) { c.fillStyle = hexA(acento, 0.06); c.fillRect(px + 3, py + 3, cs - 6, cs - 6); }
    }
    // bordes del vacío: rejilla de seguridad
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      if (k(x, y) !== '_') continue; const px = x * cs, py = y * cs;
      c.strokeStyle = 'rgba(253,216,53,.55)'; c.lineWidth = Math.max(1.5, cs * 0.05); c.setLineDash([cs * 0.12, cs * 0.1]);
      const lado = (dx, dy, x1, y1, x2, y2) => { const n = k(x + dx, y + dy); if (n !== '_' && !esMuro(n)) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); } };
      lado(0, -1, px, py + 1, px + cs, py + 1); lado(0, 1, px, py + cs - 1, px + cs, py + cs - 1); lado(-1, 0, px + 1, py, px + 1, py + cs); lado(1, 0, px + cs - 1, py, px + cs - 1, py + cs);
      c.setLineDash([]);
    }
    // rieles de plataformas
    for (const p of V.lv.plats || []) {
      c.strokeStyle = 'rgba(181,168,216,.55)'; c.lineWidth = Math.max(1.5, cs * 0.05); c.setLineDash([cs * 0.08, cs * 0.12]);
      c.beginPath(); p.path.forEach(([x, y], i) => { const [sx, sy] = V.scr.toS(x, y); const X = (sx + 0.5) * cs, Y = (sy + 0.5) * cs; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); c.setLineDash([]);
      for (const [x, y] of p.path) { const [sx, sy] = V.scr.toS(x, y); c.fillStyle = 'rgba(181,168,216,.6)'; c.beginPath(); c.arc((sx + 0.5) * cs, (sy + 0.5) * cs, cs * 0.05, 0, 7); c.fill(); }
    }
    // cables placa → lo que controla (apagados)
    V.cables = calcularCables();
    for (const cb of V.cables) dibujarCable(c, cb, 0.25, false, 0);
    // paredes: cara superior clara + frente oscuro (diorama)
    const cerca = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const n = k(x + dx, y + dy); if (!esMuro(n) && !(x + dx < 0 || y + dy < 0 || x + dx >= GW || y + dy >= GH)) return true; } return false; };
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const ch = k(x, y); if (!esMuro(ch)) continue;
      const px = x * cs, py = y * cs;
      if (!cerca(x, y) && !EMV[ch]) { // casco exterior: oscuro, para que la sala se lea por su forma
        c.fillStyle = '#0d0820'; c.fillRect(px, py, cs, cs); c.strokeStyle = 'rgba(255,255,255,.025)'; c.lineWidth = 1; c.strokeRect(px + 0.5, py + 0.5, cs - 1, cs - 1); continue;
      }
      const abajo = !esMuro(k(x, y + 1)) && y + 1 < GH;
      const g = c.createLinearGradient(px, py, px, py + cs); g.addColorStop(0, '#271c4b'); g.addColorStop(1, '#1d1539');
      c.fillStyle = g; c.fillRect(px, py, cs, cs - (abajo ? front : 0));
      c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(px, py, cs, 1.5);
      // borde hacia el suelo
      c.fillStyle = hexA(acento, 0.14);
      if (!esMuro(k(x, y - 1)) && y > 0) c.fillRect(px, py, cs, 1.5);
      if (!esMuro(k(x - 1, y)) && x > 0) c.fillRect(px, py, 1.5, cs);
      if (!esMuro(k(x + 1, y)) && x < GW - 1) c.fillRect(px + cs - 1.5, py, 1.5, cs);
      if (abajo) { const gf = c.createLinearGradient(0, py + cs - front, 0, py + cs); gf.addColorStop(0, '#120c26'); gf.addColorStop(1, '#0a0618'); c.fillStyle = gf; c.fillRect(px, py + cs - front, cs, front); c.fillStyle = hexA(acento, 0.25); c.fillRect(px, py + cs - front, cs, 1); }
      // detalle de paneles en paredes grandes
      if (hashCell(y * GW + x, 5) < 0.18 && !EMV[ch]) { c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1; c.strokeRect(px + cs * 0.2, py + cs * 0.2, cs * 0.6, cs * 0.45); }
      if (EMV[ch]) dibujarEmisor(c, px, py, cs, EMV[ch]);
    }
    // sombra interior de las paredes sobre el suelo
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      if (esMuro(k(x, y)) || k(x, y) === '_') continue;
      if (esMuro(k(x, y - 1))) { const g = c.createLinearGradient(0, y * cs, 0, y * cs + cs * 0.2); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x * cs, y * cs, cs, cs * 0.2); }
    }
    V.estatico = oc;
  };
  function calcularCables() {
    const lv = V.lv, res = []; const H = lv.mapa.length, W = lv.mapa[0].length;
    const placas = [[], [], [], []], destinos = [[], [], [], []];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = lv.mapa[y][x];
      if (/[a-d]/.test(ch)) placas[ch.charCodeAt(0) - 97].push([x, y]);
      if (/[A-D]/.test(ch)) destinos[ch.charCodeAt(0) - 65].push([x, y]);
      if (/[WXYZ]/.test(ch)) destinos['WXYZ'.indexOf(ch)].push([x, y]);
    }
    for (const key in lv.lasers || {}) { const [x, y] = key.split(',').map(Number); destinos['abcd'.indexOf(lv.lasers[key])].push([x, y]); }
    for (const p of lv.plats || []) destinos['abcd'.indexOf(p.plate)].push(p.path[0]);
    for (let k = 0; k < 4; k++) for (const p of placas[k]) for (const d of destinos[k]) {
      const [ax, ay] = V.scr.toS(p[0], p[1]), [bx, by] = V.scr.toS(d[0], d[1]);
      res.push({ k, pts: [[ax, ay], [bx, ay], [bx, by]] });
    }
    return res;
  }
  // VIS-ANTES-03: cable apagado 1,5 px alpha .25; encendido 2 px con halo acotado; pulso viajero solo 250 ms tras cambiar de estado
  function dibujarCable(c, cb, a, on, tm, pulso) {
    const cs = V.cs, col = COLOR_PLACA[cb.k];
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = hexA(col, a); c.lineWidth = on ? 2 : 1.5;
    if (on) { c.shadowColor = col; c.shadowBlur = Math.min(6, cs * 0.15); }
    c.beginPath(); cb.pts.forEach(([x, y], i) => { const X = (x + 0.5) * cs, Y = (y + 0.5) * cs; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke();
    if (on && pulso) { c.setLineDash([cs * 0.12, cs * 0.3]); c.lineDashOffset = -tm * cs * 2; c.strokeStyle = `rgba(255,255,255,${0.75 * pulso})`; c.lineWidth = 1; c.shadowBlur = 0; c.stroke(); }
    c.restore();
  }
  function dibujarEmisor(c, px, py, cs, [dx, dy]) {
    const cx = px + cs / 2 + dx * cs * 0.22, cy = py + cs / 2 + dy * cs * 0.22 - (dy === 0 ? cs * 0.05 : 0);
    c.fillStyle = '#3a2a66'; rr(c, px + cs * 0.18, py + cs * 0.14, cs * 0.64, cs * 0.6, cs * 0.12); c.fill();
    c.fillStyle = '#160d30'; c.beginPath(); c.arc(cx, cy, cs * 0.17, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,68,102,.6)'; c.lineWidth = 1.5; c.stroke();
  }

  // ── fotograma ──
  // f: { st, s0, s1, p, nA, jugador, dv, facing[], movio[], empujo[], tm, ecos:[colores], flechas[], flash, sacudida,
  //      ganar (0..1), rebobinar (0..1), vista (bool), copias, ocultos:Set, hc, trail, reducido }
  V.dibujar = function (f) {
    const c = ctx, cs = V.cs, dpr = V.dpr, W = V.W, H = V.H;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    const st = f.st, lv = V.lv, tm = f.tm;
    let sx = 0, sy = 0;
    if (f.sacudida && !f.reducido) { sx = f.sacudida.dx * Math.sin(f.sacudida.p * Math.PI * 4) * 4 * (1 - f.sacudida.p); sy = f.sacudida.dy * Math.sin(f.sacudida.p * Math.PI * 4) * 4 * (1 - f.sacudida.p); }
    if (f.empujon && !f.reducido) { sx += f.empujon[0]; sy += f.empujon[1]; }
    c.save(); c.translate(sx, sy);
    if (f.zoom && f.zoom.k !== 1) { c.translate(f.zoom.x, f.zoom.y); c.scale(f.zoom.k, f.zoom.k); c.translate(-f.zoom.x, -f.zoom.y); }
    // halo de la sala
    const g = c.createRadialGradient(V.ox + V.scr.GW * cs / 2, V.oy + V.scr.GH * cs / 2, 0, V.ox + V.scr.GW * cs / 2, V.oy + V.scr.GH * cs / 2, Math.max(V.scr.GW, V.scr.GH) * cs * 0.8);
    g.addColorStop(0, hexA(ACENTO_CAP[f.cap || 0], 0.07)); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(V.ox - cs * 4, V.oy - cs * 4, V.scr.GW * cs + cs * 8, V.scr.GH * cs + cs * 8);
    c.drawImage(V.estatico, V.ox, V.oy, V.estatico.width / dpr, V.estatico.height / dpr);
    const dv = f.dv, pk = dv.pk;
    // cables encendidos (el pulso viajero dura 250 ms desde el cambio de estado de su placa)
    if (!V.pkPrev) { V.pkPrev = pk.slice(); V.pkT = [-9, -9, -9, -9]; }
    for (let k = 0; k < 4; k++) if (!!pk[k] !== !!V.pkPrev[k]) { V.pkPrev[k] = !!pk[k]; V.pkT[k] = tm; }
    for (const cb of V.cables) if (pk[cb.k]) { const dtp = tm - V.pkT[cb.k]; const pulso = f.reducido || f.instantaneo ? 0 : Math.max(0, 1 - dtp / 0.25); dibujarCable(c, Object.assign({}, cb, { pts: cb.pts.map(([x, y]) => [x + V.ox / cs, y + V.oy / cs]) }), 0.65, true, tm, pulso); }
    // placas
    for (let k = 0; k < 4; k++) for (const ci of st.plates[k]) placa(c, ci, k, pk[k], st.heavy[k], tm);
    // salida y cápsula
    salidaDib(c, st.exit, tm, f.ganar || 0);
    capsula(c, st.start, f.copias || 1, tm);
    // plataformas (interpoladas)
    const nb = st.boxes0.length;
    st.plats.forEach((p, j) => {
      const a = f.s0[f.nA + nb + j], b = f.s1[f.nA + nb + j];
      const ia = p.cells[a], ib = p.cells[b];
      const [x0, y0] = [ia % st.W, (ia / st.W) | 0], [x1, y1] = [ib % st.W, (ib / st.W) | 0];
      const x = x0 + (x1 - x0) * f.p, y = y0 + (y1 - y0) * f.p;
      plataforma(c, x, y, a !== b, pk[p.key], tm);
    });
    // puertas (animadas hacia su estado)
    st.doors.forEach((d, j) => {
      const target = dv.open[j] ? 1 : 0; const cur = V.puertas[j] ?? target;
      V.puertas[j] = f.instantaneo ? target : cur + (target - cur) * Math.min(1, (f.dt || 16) / (f.reducido ? 60 : 90));
      puerta(c, d, V.puertas[j], f.temblor && f.temblor.has(j) ? Math.sin(tm * 80) * 2 : 0);
    });
    // rayos
    rayos(c, st, dv, tm, f);
    // cajas
    for (let j = 0; j < nb; j++) {
      const a = f.s0[f.nA + j], b = f.s1[f.nA + j];
      const [x0, y0] = [a % st.W, (a / st.W) | 0], [x1, y1] = [b % st.W, (b / st.W) | 0];
      caja(c, x0 + (x1 - x0) * f.p, y0 + (y1 - y0) * f.p, st.heavy.some((h, k) => h && st.plates[k].includes(b)));
    }
    // destello de rechazo
    if (f.flash) { const [cx, cy] = V.centro(f.flash.x, f.flash.y); c.fillStyle = `rgba(255,68,102,${0.45 * (1 - f.flash.p)})`; rr(c, cx - cs / 2 + 2, cy - cs / 2 + 2, cs - 4, cs - 4, cs * 0.12); c.fill(); }
    // astronautas ordenados por y de pantalla
    const lista = [];
    for (let i = 0; i < f.nA; i++) {
      if (f.ocultos && f.ocultos.has(i)) continue;
      const a = f.s0[i], b = f.s1[i]; if (a < 0 && b < 0) continue;
      const pa = a < 0 ? b : a, pb = b < 0 ? a : b;
      const [x0, y0] = [pa % st.W, (pa / st.W) | 0], [x1, y1] = [pb % st.W, (pb / st.W) | 0];
      const x = x0 + (x1 - x0) * f.p, y = y0 + (y1 - y0) * f.p;
      const [px, py] = V.centro(x, y);
      lista.push({ i, px, py, x0, y0, x1, y1, desv: b < 0 && a >= 0 });
    }
    lista.sort((u, v) => u.py - v.py);
    setTS(cs * 0.82);
    const insignias = []; // VIS-ANTES-02: los números se dibujan después de todas las siluetas
    for (const L of lista) {
      if (L.desv) continue; // se dibuja como partículas
      const esJ = L.i === f.jugador;
      const fc = V.scr.dir(f.facing[L.i] || 'D').toLowerCase();
      const mov = f.movio[L.i] && f.p < 1 ? 1 : 0, ph = mov ? f.p * Math.PI * 2 : 0;
      const push = f.empujo[L.i] ? Math.sin(Math.min(1, f.p) * Math.PI) : 0;
      // estela: una silueta (cs < 28) o dos (cs >= 28); ninguna con movimiento reducido
      if (!esJ && f.trail !== false && mov && !f.reducido) { const nS = cs < 28 ? 1 : 2; for (let s = 1; s <= nS; s++) {
        const q = Math.max(0, f.p - s * 0.12); const [qx, qy] = V.centro(L.x0 + (L.x1 - L.x0) * q, L.y0 + (L.y1 - L.y0) * q);
        astroEco(c, qx, qy, fc, ph, mov, push, tm, L.i, f, [0.10, 0.06][s - 1] / 0.55);
      } }
      if (esJ) {
        const hg = c.createRadialGradient(L.px, L.py + cs * 0.3, 0, L.px, L.py + cs * 0.3, cs * 0.5);
        hg.addColorStop(0, 'rgba(255,255,255,.22)'); hg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = hg; c.fillRect(L.px - cs * 0.6, L.py - cs * 0.3, cs * 1.2, cs * 1.2);
        c.save(); if (f.saturacion != null && c.filter !== undefined) c.filter = `saturate(${f.saturacion})`;
        drawAstro(c, L.px, L.py + cs * 0.82 * 0.06, fc, ph, mov, push, tm, 0); c.restore();
      } else { astroEco(c, L.px, L.py, fc, ph, mov, push, tm, L.i, f, 1); insignias.push([L.px, L.py, L.i]); }
      if (f.chispa && f.chispa.has(L.i) && f.p < 1) { c.fillStyle = `rgba(255,220,120,${1 - f.p})`; for (let s = 0; s < 5; s++) { const an = s * 1.3 + tm * 9; c.beginPath(); c.arc(L.px + Math.cos(an) * cs * 0.22, L.py - cs * 0.42 + Math.sin(an) * cs * 0.1, cs * 0.03, 0, 7); c.fill(); } }
    }
    for (const [bx, by, i] of insignias) insignia(c, bx, by, i, f);
    // flechas del próximo movimiento de cada eco
    if (f.flechas) for (const fl of f.flechas) flecha(c, fl, tm, f);
    // partículas
    particulas(c, f.dt || 16);
    c.restore();
    // efecto de rebobinado
    if (f.rebobinar) {
      const r = f.rebobinar; c.save();
      c.fillStyle = `rgba(30,10,70,${0.35 * Math.sin(r * Math.PI)})`; c.fillRect(0, 0, W, H);
      if (!f.reducido) { c.globalAlpha = 0.25 * Math.sin(r * Math.PI); c.fillStyle = '#00f2cf'; for (let yy = 0; yy < H; yy += 6) { const off = Math.sin(yy * 0.05 + tm * 20) * 10 * Math.sin(r * Math.PI); c.fillRect(off, yy, W, 1); } }
      c.restore();
    }
    // VIS-ANTES-04: marco estático de guiones y rótulo «Vista» fuera de la sala mientras se inspecciona otro turno
    if (f.vista) { c.save(); c.strokeStyle = 'rgba(0,242,207,.55)'; c.lineWidth = 2; c.setLineDash([8, 6]); c.strokeRect(V.ox - 6, V.oy - 6, V.scr.GW * cs + 12, V.scr.GH * cs + 12); c.setLineDash([]);
      if (f.vistaRotulo) { c.font = '700 11px JetBrains Mono, monospace'; const tw = c.measureText(f.vistaRotulo).width + 10; const lx = V.ox + V.scr.GW * cs + 6 - tw, ly = Math.max(2, V.oy - 6 - 18); c.fillStyle = 'rgba(5,1,8,.88)'; if (c.roundRect) { c.beginPath(); c.roundRect(lx, ly, tw, 16, 4); c.fill(); } else c.fillRect(lx, ly, tw, 16); c.fillStyle = '#00f2cf'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(f.vistaRotulo, lx + 5, ly + 8.5); }
      c.restore(); }
  };

  const ecoCv = document.createElement('canvas'); const ecoCtx = ecoCv.getContext('2d');
  function astroEco(c, px, py, fc, ph, mov, push, tm, i, f, alphaMul) {
    const cs = V.cs, size = Math.ceil(cs * 1.5), dpr = V.dpr;
    if (ecoCv.width !== size * dpr) { ecoCv.width = size * dpr; ecoCv.height = size * dpr; }
    const e = ecoCtx; e.setTransform(dpr, 0, 0, dpr, 0, 0); e.clearRect(0, 0, size, size); e.globalCompositeOperation = 'source-over';
    drawAstro(e, size / 2, size / 2 + cs * 0.82 * 0.06, fc, ph, mov, push, tm + i * 0.7, 0);
    const col = (f.aurora ? COLOR_AURORA : COLOR_ECO)[i % 6];
    e.globalCompositeOperation = 'source-atop'; e.globalAlpha = 0.45; e.fillStyle = col; e.fillRect(0, 0, size, size); e.globalAlpha = 1;
    if (f.hc) patron(e, i, size, col);
    if (!f.reducido && cs >= 28) { e.fillStyle = 'rgba(5,1,8,.35)'; const off = (tm * 18) % 4; for (let y = off; y < size; y += 4) e.fillRect(0, y, size, 1); }
    e.globalCompositeOperation = 'source-over';
    c.save(); c.globalAlpha = Math.min(1, (f.hc ? 0.7 : 0.55) * alphaMul * (f.alfaEcos ?? 1)); c.drawImage(ecoCv, px - size / 2, py - size / 2, size, size); c.restore();
  }
  // insignia numerada del eco: diámetro mínimo 12 px (14–18 px con cs >= 32), borde oscuro de 1 px, número con contraste >= 4.5:1
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
  function insignia(c, px, py, i, f) {
    const cs = V.cs, col = (f.aurora ? COLOR_AURORA : COLOR_ECO)[i % 6];
    const r = cs >= 32 ? Math.max(7, Math.min(9, cs * 0.14)) : 6;
    const bx = px + cs * 0.26, by = py - cs * 0.36;
    c.save(); c.fillStyle = col; c.beginPath(); c.arc(bx, by, r, 0, 7); c.fill();
    c.strokeStyle = f.hc ? '#fff' : 'rgba(5,1,8,.9)'; c.lineWidth = f.hc ? 1.5 : 1; c.stroke();
    const oscuro = (lum(col) + 0.05) / (lum('#050108') + 0.05) >= 4.5; c.fillStyle = oscuro ? '#050108' : '#f5f0ff';
    c.font = `800 ${Math.round(r * 1.3)}px JetBrains Mono, monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), bx, by + 0.5); c.restore();
  }
  function patron(e, i, size, col) {
    e.save(); e.globalAlpha = 0.8; e.strokeStyle = '#ffffff'; e.fillStyle = '#ffffff'; e.lineWidth = 1.4;
    const k = i % 6;
    if (k === 1) for (let x = -size; x < size * 2; x += 5) { e.beginPath(); e.moveTo(x, 0); e.lineTo(x, size); e.stroke(); }
    if (k === 2) for (let x = 2; x < size; x += 6) for (let y = 2; y < size; y += 6) { e.beginPath(); e.arc(x, y, 1.2, 0, 7); e.fill(); }
    if (k === 3) for (let x = 0; x < size; x += 6) for (let y = 0; y < size; y += 6) if (((x + y) / 6) % 2 === 0) e.fillRect(x, y, 3, 3);
    if (k === 4) for (let y = 0; y < size; y += 6) { e.beginPath(); for (let x = 0; x <= size; x += 3) e.lineTo(x, y + Math.sin(x * 0.5) * 1.5); e.stroke(); }
    if (k === 5) for (let x = -size; x < size * 2; x += 6) { e.beginPath(); e.moveTo(x, 0); e.lineTo(x + size, size); e.stroke(); }
    e.restore();
  }
  function placa(c, ci, k, on, heavy, tm) {
    const W = V.lv.mapa[0].length;
    const [cx, cy0] = V.centro(ci % W, (ci / W) | 0); const cs = V.cs; const cy = cy0 + (on ? 2 : 0);
    const col = COLOR_PLACA[k], s = cs * 0.66;
    if (heavy) { // marco de rayas amarillas y negras
      c.save(); c.beginPath(); rr(c, cx - s / 2 - cs * 0.08, cy - s / 2 - cs * 0.08, s + cs * 0.16, s + cs * 0.16, cs * 0.1); c.clip();
      c.fillStyle = '#111'; c.fillRect(cx - cs / 2, cy - cs / 2, cs, cs); c.strokeStyle = '#fdd835'; c.lineWidth = cs * 0.07;
      for (let d = -cs; d < cs; d += cs * 0.2) { c.beginPath(); c.moveTo(cx + d - cs / 2, cy - cs / 2); c.lineTo(cx + d + cs / 2, cy + cs / 2); c.stroke(); }
      c.restore();
    }
    c.fillStyle = on ? hexA(col, 0.32) : '#0b0619'; rr(c, cx - s / 2, cy - s / 2, s, s, cs * 0.1); c.fill();
    c.strokeStyle = hexA(col, on ? 0.95 : 0.45); c.lineWidth = Math.max(1.5, cs * 0.045); c.stroke();
    if (on) { c.save(); c.shadowColor = col; c.shadowBlur = Math.min(6, cs * 0.15); c.strokeStyle = hexA(col, 0.6); c.stroke(); c.restore(); }
    forma(c, k, cx, cy, cs * 0.17, on ? col : hexA(col, 0.6), on);
  }
  function forma(c, k, cx, cy, r, col, lleno) {
    c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = Math.max(1.5, r * 0.28); c.beginPath();
    if (k === 0) c.rect(cx - r, cy - r, r * 2, r * 2);
    else if (k === 1) c.arc(cx, cy, r * 1.1, 0, 7);
    else if (k === 2) { c.moveTo(cx, cy - r * 1.2); c.lineTo(cx + r * 1.15, cy + r * 0.9); c.lineTo(cx - r * 1.15, cy + r * 0.9); c.closePath(); }
    else { c.moveTo(cx, cy - r * 1.3); c.lineTo(cx + r * 1.2, cy); c.lineTo(cx, cy + r * 1.3); c.lineTo(cx - r * 1.2, cy); c.closePath(); }
    lleno ? c.fill() : c.stroke(); c.restore();
  }
  function puerta(c, d, abierta, temblor) {
    const W = V.lv.mapa[0].length; const x = d.i % W, y = (d.i / W) | 0;
    const [cx, cy] = V.centro(x, y); const cs = V.cs;
    // orientación en pantalla: si a izquierda y derecha hay pared, el paso es vertical
    const [gx, gy] = V.scr.toS(x, y); const m = V.scr.mapa;
    const muro = (xx, yy) => yy < 0 || xx < 0 || yy >= V.scr.GH || xx >= V.scr.GW || m[yy][xx] === '#' || !!EMV[m[yy][xx]];
    const vert = !muro(gx, gy - 1) || !muro(gx, gy + 1), hor = !muro(gx - 1, gy) || !muro(gx + 1, gy);
    const pasoVertical = vert && hor ? (!muro(gx, gy - 1) && !muro(gx, gy + 1)) && !(!muro(gx - 1, gy) && !muro(gx + 1, gy)) : vert;
    const col = COLOR_PLACA[d.key];
    c.save(); c.translate(cx + (pasoVertical ? temblor : 0), cy + (pasoVertical ? 0 : temblor));
    if (pasoVertical) c.rotate(Math.PI / 2);
    // marco
    c.fillStyle = '#2b1f52'; c.fillRect(-cs / 2, -cs / 2, cs, cs * 0.1); c.fillRect(-cs / 2, cs * 0.4, cs, cs * 0.1);
    const ab = easeOut(Math.max(0, Math.min(1, abierta))); const hoja = cs * 0.42 * (1 - ab);
    if (hoja > 0.5) {
      for (const sg of [-1, 1]) {
        const hy = sg < 0 ? -cs * 0.4 : cs * 0.4 - hoja;
        const g = c.createLinearGradient(0, hy, 0, hy + hoja); g.addColorStop(0, '#4b3a86'); g.addColorStop(1, '#2e2260');
        c.fillStyle = g; c.fillRect(-cs * 0.44, hy, cs * 0.88, hoja);
        c.fillStyle = hexA(col, 0.9); c.fillRect(-cs * 0.44, sg < 0 ? hy + hoja - 2 : hy, cs * 0.88, 2);
      }
    }
    c.restore();
    // ícono de su placa (con aro tachado si es inversa)
    if (ab < 0.9) {
      c.save(); c.globalAlpha = 1 - ab;
      forma(c, d.key, cx, cy, cs * 0.12, col, false);
      if (d.inv) { c.strokeStyle = '#f5f0ff'; c.lineWidth = Math.max(1.2, cs * 0.035); c.beginPath(); c.arc(cx, cy, cs * 0.24, 0, 7); c.moveTo(cx - cs * 0.17, cy + cs * 0.17); c.lineTo(cx + cs * 0.17, cy - cs * 0.17); c.stroke(); }
      c.restore();
    } else if (d.inv) { c.save(); c.globalAlpha = 0.5; c.strokeStyle = hexA(col, 0.7); c.lineWidth = 1.2; c.beginPath(); c.arc(cx, cy, cs * 0.24, 0, 7); c.stroke(); c.restore(); }
  }
  function rayos(c, st, dv, tm, f) {
    const cs = V.cs;
    st.emitters.forEach((e, j) => {
      // longitud del rayo encendido, con retracción animada de 120 ms
      let n = 0; let x = e.x + e.dx, y = e.y + e.dy;
      while (x >= 0 && y >= 0 && x < st.W && y < st.H && dv.beam[y * st.W + x]) { n++; x += e.dx; y += e.dy; }
      const on = n > 0 || !(e.off >= 0 && dv.pk[e.off]);
      const prev = V.laser[j] ?? n; const L = f.instantaneo ? n : prev + (n - prev) * Math.min(1, (f.dt || 16) / 40);
      V.laser[j] = L;
      const [ex, ey] = V.centro(e.x, e.y);
      // lente que late
      const pul = on ? 0.7 + 0.3 * Math.sin(tm * 6 + j) : 0.15;
      const [lx, ly] = V.centro(e.x + e.dx * 0.32, e.y + e.dy * 0.32);
      c.save(); c.fillStyle = `rgba(255,68,102,${pul})`; c.shadowColor = '#ff4466'; c.shadowBlur = on ? cs * 0.4 : 0; c.beginPath(); c.arc(lx, ly, cs * 0.1, 0, 7); c.fill(); c.restore();
      if (L < 0.05) return;
      const [tx, ty] = V.centro(e.x + e.dx * (L + 0.5), e.y + e.dy * (L + 0.5));
      c.save(); c.lineCap = 'butt'; c.globalCompositeOperation = 'lighter';
      const lay = [[cs * 0.42, 'rgba(255,40,80,.16)'], [cs * 0.18, 'rgba(255,68,102,.75)'], [Math.max(1.5, cs * 0.06), 'rgba(255,240,245,.95)']];
      for (const [w, col] of lay) { c.strokeStyle = col; c.lineWidth = w * (1 + 0.08 * Math.sin(tm * 30 + j)); c.beginPath(); c.moveTo(lx, ly); c.lineTo(tx, ty); c.stroke(); }
      // partículas que corren por el rayo
      if (!f.reducido) { c.fillStyle = 'rgba(255,220,230,.9)'; const len = Math.hypot(tx - lx, ty - ly); for (let s = 0; s < Math.max(2, L * 2); s++) { const q = ((tm * 1.6 + s / Math.max(2, L * 2)) % 1); c.fillRect(lx + (tx - lx) * q - 1, ly + (ty - ly) * q - 1, 2, 2); } }
      // chispas donde choca
      if (L >= n - 0.05 && !f.reducido) { c.fillStyle = 'rgba(255,200,120,.9)'; for (let s = 0; s < 4; s++) { const an = tm * 13 + s * 1.7; c.beginPath(); c.arc(tx + Math.cos(an) * cs * 0.1 - e.dx * cs * 0.05, ty + Math.sin(an) * cs * 0.1 - e.dy * cs * 0.05, cs * 0.025, 0, 7); c.fill(); } }
      c.restore();
    });
  }
  function caja(c, x, y, sobreCarga) {
    const [cx, cy] = V.centro(x, y); const cs = V.cs, s = cs * 0.8;
    c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, cx - s / 2 + 2, cy - s / 2 + 5, s, s, cs * 0.08); c.fill();
    const g = c.createLinearGradient(cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2); g.addColorStop(0, '#d79a3c'); g.addColorStop(1, '#8a5420');
    c.fillStyle = g; rr(c, cx - s / 2, cy - s / 2, s, s, cs * 0.08); c.fill();
    c.strokeStyle = 'rgba(40,20,5,.7)'; c.lineWidth = Math.max(1, cs * 0.03); c.stroke();
    // nervaduras y esquinas reforzadas
    c.strokeStyle = 'rgba(70,35,8,.5)'; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(cx - s / 2 + k * s / 4, cy - s / 2 + 3); c.lineTo(cx - s / 2 + k * s / 4, cy + s / 2 - 3); c.stroke(); }
    c.fillStyle = '#5a3412'; const q = s * 0.2; for (const [ax, ay] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.fillRect(cx + ax * s / 2 - (ax > 0 ? q : 0), cy + ay * s / 2 - (ay > 0 ? q : 0), q, q);
    c.fillStyle = sobreCarga ? '#00f2cf' : 'rgba(255,240,220,.85)'; c.font = `800 ${Math.round(s * 0.36)}px JetBrains Mono, monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('//', cx, cy + 1);
  }
  function plataforma(c, x, y, moviendo, activa, tm) {
    const [cx, cy] = V.centro(x, y); const cs = V.cs, s = cs * 0.92;
    const g = c.createLinearGradient(cx, cy - s / 2, cx, cy + s / 2); g.addColorStop(0, '#5d5684'); g.addColorStop(1, '#3a345c');
    c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, cx - s / 2, cy - s / 2 + 4, s, s, cs * 0.1); c.fill();
    c.fillStyle = g; rr(c, cx - s / 2, cy - s / 2, s, s, cs * 0.1); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; c.strokeRect(cx - s * 0.36, cy - s * 0.36, s * 0.72, s * 0.72);
    const on = activa ? (moviendo ? (Math.sin(tm * 18) > 0) : true) : false;
    const lc = on ? '#5cffa8' : 'rgba(92,255,168,.25)';
    c.fillStyle = lc; for (const [ax, ay] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { c.beginPath(); c.arc(cx + ax * s * 0.4, cy + ay * s * 0.4, cs * 0.04, 0, 7); c.fill(); }
  }
  function salidaDib(c, ci, tm, ganar) {
    const W = V.lv.mapa[0].length; const [cx, cy] = V.centro(ci % W, (ci / W) | 0); const cs = V.cs, r = cs * 0.4;
    c.save();
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, r * 1.4); g.addColorStop(0, 'rgba(0,242,207,.25)'); g.addColorStop(1, 'rgba(0,242,207,0)'); c.fillStyle = g; c.fillRect(cx - cs, cy - cs, cs * 2, cs * 2);
    c.fillStyle = '#0d1630'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
    // iris
    const ab = ganar; const n = 6;
    c.save(); c.beginPath(); c.arc(cx, cy, r * 0.86, 0, 7); c.clip();
    c.fillStyle = '#04020a'; c.beginPath(); c.arc(cx, cy, r * 0.86 * ab, 0, 7); c.fill();
    for (let k = 0; k < n; k++) { const an = k / n * Math.PI * 2 + tm * 0.2 + ab * 1.2; c.fillStyle = k % 2 ? '#22405e' : '#1b3350'; c.beginPath(); c.moveTo(cx + Math.cos(an) * r * ab * 0.9, cy + Math.sin(an) * r * ab * 0.9); c.arc(cx, cy, r, an, an + Math.PI * 2 / n + 0.02); c.closePath(); c.fill(); }
    c.restore();
    c.strokeStyle = '#00f2cf'; c.lineWidth = Math.max(1.5, cs * 0.06); c.setLineDash([r * 0.5, r * 0.25]); c.lineDashOffset = -tm * r * 0.8;
    c.shadowColor = '#00f2cf'; c.shadowBlur = cs * 0.25; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke();
    c.restore();
  }
  function capsula(c, ci, copias, tm) {
    const W = V.lv.mapa[0].length; const [cx, cy] = V.centro(ci % W, (ci / W) | 0); const cs = V.cs;
    c.save();
    c.fillStyle = 'rgba(164,107,255,.12)'; c.beginPath(); c.arc(cx, cy + cs * 0.1, cs * 0.44, Math.PI, 0); c.lineTo(cx + cs * 0.44, cy + cs * 0.38); c.lineTo(cx - cs * 0.44, cy + cs * 0.38); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(200,180,255,.5)'; c.lineWidth = Math.max(1, cs * 0.035); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(cx, cy + cs * 0.1, cs * 0.34, Math.PI * 1.15, Math.PI * 1.45); c.stroke();
    c.fillStyle = 'rgba(245,240,255,.85)'; c.font = `800 ${Math.round(cs * 0.26)}px JetBrains Mono, monospace`; c.textAlign = 'right'; c.textBaseline = 'top';
    c.fillText(String(copias), cx + cs * 0.47, cy - cs * 0.48);
    c.restore();
  }
  function flecha(c, fl, tm, f) {
    const cs = V.cs; const [px, py] = V.centro(fl.x, fl.y); const d = DIRV[V.scr.dir(fl.dir)];
    const col = (f.aurora ? COLOR_AURORA : COLOR_ECO)[fl.i % 6];
    const ax = px + d[0] * cs * 0.5, ay = py + d[1] * cs * 0.5; const a = 0.55 + 0.25 * Math.sin(tm * 4);
    c.save(); c.translate(ax, ay); c.rotate(Math.atan2(d[1], d[0])); c.globalAlpha = a;
    c.fillStyle = col; c.beginPath(); c.moveTo(cs * 0.12, 0); c.lineTo(-cs * 0.06, -cs * 0.1); c.lineTo(-cs * 0.06, cs * 0.1); c.closePath(); c.fill();
    c.restore();
    if (fl.falla) { c.save(); c.globalAlpha = a; c.strokeStyle = '#ff4466'; c.lineWidth = Math.max(1.5, cs * 0.04); const bx = ax + d[0] * cs * 0.16, by = ay + d[1] * cs * 0.16, r = cs * 0.06; c.beginPath(); c.moveTo(bx - r, by - r); c.lineTo(bx + r, by + r); c.moveTo(bx + r, by - r); c.lineTo(bx - r, by + r); c.stroke(); c.restore(); }
  }
  // ── partículas ──
  V.emitir = function (x, y, n, col, o = {}) {
    if (o.reducido) n = Math.ceil(n / 4);
    const [px, py] = V.centro(x, y); const cs = V.cs;
    for (let k = 0; k < n; k++) {
      const an = Math.random() * Math.PI * 2, sp = (o.vel || 1) * cs * (0.4 + Math.random() * 1.2);
      V.parts.push({ x: px + (Math.random() - 0.5) * cs * (o.disp || 0.3), y: py + (o.dy || 0) * cs + (Math.random() - 0.5) * cs * (o.disp || 0.3), vx: Math.cos(an) * sp, vy: Math.sin(an) * sp + (o.sube ? -cs * 1.2 : 0), vida: 0, max: (o.vida || 0.6) * (0.7 + Math.random() * 0.6), col, r: (o.r || 0.04) * cs * (0.6 + Math.random()) });
    }
    if (V.parts.length > 600) V.parts.splice(0, V.parts.length - 600);
  };
  function particulas(c, dt) {
    const s = dt / 1000;
    c.save(); c.globalCompositeOperation = 'lighter';
    V.parts = V.parts.filter((p) => { p.vida += s; if (p.vida >= p.max) return false; p.x += p.vx * s; p.y += p.vy * s; p.vx *= 0.94; p.vy *= 0.94; const a = 1 - p.vida / p.max; c.fillStyle = hexA(p.col, a); c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); return true; });
    c.restore();
  }
  return V;
}

// Miniatura de un nivel en su estado inicial (lista de capítulos, cómo jugar)
export function miniatura(cv, lv, w, h, cap, frame) {
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  const V = crearVista(cv); V.ajustar(lv, { x: 2, y: 2, w: w - 4, h: h - 4 }, { cap, ancho: w, alto: h, nPuertas: 0 });
  if (frame) V.dibujar(Object.assign({ instantaneo: true, cap }, frame(V)));
  return V;
}
