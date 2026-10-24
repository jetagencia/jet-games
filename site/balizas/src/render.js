/* JET//Balizas · dibujo en lienzo: campo, niebla, balizas, nave, partículas, fondo de menú y mapas. */
(function () {
'use strict';
const G = window.BalGen, Sm = window.BalSim;
const SYMCOL = { flecha: '#00f2cf', peligro: '#ffb020', atajo: '#b47cff', tesoro: '#fdd835', noporaqui: '#ff4466' };
const RANKCOL = ['#ffffff', '#00f2cf', '#a35cff', '#fdd835', 'grad'];
// Glifos en caja unitaria [-1,1], y hacia abajo, «apuntan» al norte (se giran dir × 45°).
const GLYPH = {
  flecha: 'M0 -0.78 L0.74 0.06 L0.74 0.56 L0 -0.16 L-0.74 0.56 L-0.74 0.06 Z',
  atajo: 'M0 -0.86 L0.7 -0.2 L0.7 0.18 L0 -0.46 L-0.7 0.18 L-0.7 -0.2 Z M0 -0.12 L0.7 0.54 L0.7 0.88 L0 0.24 L-0.7 0.88 L-0.7 0.54 Z',
  peligro: 'M0 -0.84 L0.9 0.74 L-0.9 0.74 Z M-0.11 -0.32 L0.11 -0.32 L0.08 0.22 L-0.08 0.22 Z M-0.12 0.36 L0.12 0.36 L0.12 0.56 L-0.12 0.56 Z',
  tesoro: 'M0 -0.86 L0.62 -0.12 L0 0.86 L-0.62 -0.12 Z M-0.36 -0.12 L0.36 -0.12 L0 0.5 Z',
  noporaqui: 'M0 -0.74 A0.74 0.74 0 1 1 -0.0001 -0.74 Z M0 -0.5 A0.5 0.5 0 1 0 0.0001 -0.5 Z M-0.52 -0.12 L0.52 -0.12 L0.52 0.12 L-0.52 0.12 Z M-0.26 -0.82 L0 -1.08 L0.26 -0.82 Z'
};
const P2D = {}; for (const k in GLYPH) P2D[k] = new Path2D(GLYPH[k]);
function glyphSVG(s, dir, col) {
  const rot = (dir || 0) * 45;
  return '<svg viewBox="-1.15 -1.15 2.3 2.3" aria-hidden="true"><path fill-rule="evenodd" d="' + GLYPH[s] + '" fill="' + (col || SYMCOL[s]) + '" transform="rotate(' + rot + ')"/></svg>';
}

const R = {
  cv: null, cx: null, w: 0, h: 0, dpr: 1, ppc: 30, cam: { x: 18, y: 4, lx: 0, ly: 0 }, chunks: new Map(), chunkVer: 0, f: null, loopsS: null,
  fogCv: null, fogCx: null, expCv: null, expCx: null, expImg: null, expDirty: 1, noise: null, stars: null, parts: [], shake: 0, flash: 0, reveal: 0, zoomOut: 0, quality: 1, fpsAvg: 60, lowT: 0,
  opts: { contrast: 0, shake: 1, reduced: 0 }
};
window.BalRender = R; R.SYMCOL = SYMCOL; R.RANKCOL = RANKCOL; R.glyphSVG = glyphSVG; R.P2D = P2D;

R.init = function (cv) {
  R.cv = cv; R.cx = cv.getContext('2d', { alpha: false });
  R.fogCv = document.createElement('canvas'); R.fogCx = R.fogCv.getContext('2d');
  R.expCv = document.createElement('canvas'); R.expCx = R.expCv.getContext('2d');
  // ruido de niebla (tileable) y polvo de estrellas
  const n = document.createElement('canvas'); n.width = n.height = 128; const nc = n.getContext('2d'), id = nc.createImageData(128, 128);
  const rnd = G.mulberry32(77); const base = new Float32Array(16 * 16); for (let i = 0; i < base.length; i++) base[i] = rnd();
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    let v = 0, amp = 0.6, fr = 1; for (let o = 0; o < 3; o++) { const gx = x / 128 * 16 * fr, gy = y / 128 * 16 * fr, x0 = Math.floor(gx), y0 = Math.floor(gy), tx = gx - x0, ty = gy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const b = (a, c) => base[((c % 16 + 16) % 16) * 16 + ((a % 16 + 16) % 16)]; v += amp * ((b(x0, y0) * (1 - sx) + b(x0 + 1, y0) * sx) * (1 - sy) + (b(x0, y0 + 1) * (1 - sx) + b(x0 + 1, y0 + 1) * sx) * sy); amp *= 0.5; fr *= 2; }
    const i = (y * 128 + x) * 4, k = Math.max(0, Math.min(1, (v - 0.4) / 0.35)); id.data[i] = 96; id.data[i + 1] = 58; id.data[i + 2] = 168; id.data[i + 3] = Math.round(k * k * (3 - 2 * k) * 165);
  }
  nc.putImageData(id, 0, 0); R.noise = n;
  const s = document.createElement('canvas'); s.width = s.height = 512; const sc = s.getContext('2d'), r2 = G.mulberry32(9);
  for (let i = 0; i < 260; i++) { const a = r2(); sc.fillStyle = a < 0.1 ? 'rgba(0,242,207,.55)' : a < 0.2 ? 'rgba(180,124,255,.5)' : 'rgba(245,240,255,' + (0.2 + r2() * 0.5).toFixed(2) + ')'; const rr = r2() < 0.92 ? 0.7 + r2() * 0.8 : 1.6; sc.beginPath(); sc.arc(r2() * 512, r2() * 512, rr, 0, 7); sc.fill(); }
  R.stars = s;
};

R.resize = function (w, h, flight) {
  const dpr = Math.min(flight ? 2 : 3, window.devicePixelRatio || 1) * R.quality;
  R.w = w; R.h = h; R.dpr = dpr;
  R.cv.width = Math.round(w * dpr); R.cv.height = Math.round(h * dpr);
  // igualdad de visión: el círculo de radar (15 c) ocupa el 88 % del lado corto
  const ppc = 0.88 * Math.min(w, h) / 15;
  if (Math.abs(ppc - R.ppc) > 0.01 || R.chunkScale !== ppc * dpr) { R.ppc = ppc; R.chunks.clear(); R.chunkScale = ppc * dpr; }
  const fr = R.fogRes || 0.5; R.fogCv.width = Math.max(2, Math.round(w * fr)); R.fogCv.height = Math.max(2, Math.round(h * fr));
};

R.setField = function (f, ct) {
  R.f = f; R.chunks.clear(); R.chunkVer++; R.rebuildLoops(ct);
  R.expCv.width = f.W; R.expCv.height = f.H; R.expImg = R.expCx.createImageData(f.W, f.H); R.expDirty = 1;
};
R.rebuildLoops = function (ct) { R.loopsS = G.loops(ct).map(l => G.chaikin(l, 2)); R.chunks.clear(); };

// ---------- trozos de roca cacheados ----------
const CH = 8;
function chunk(ix, iy) {
  const key = ix + ',' + iy; let c = R.chunks.get(key); if (c) { R.chunks.delete(key); R.chunks.set(key, c); return c; }
  const sc = R.chunkScale, px = Math.ceil(CH * sc) + 2; c = document.createElement('canvas'); c.width = c.height = px;
  const x = c.getContext('2d'), f = R.f, x0 = ix * CH, y0 = iy * CH;
  // mundo → trozo: (wx - x0) * sc ; y invertida
  x.setTransform(sc, 0, 0, -sc, -x0 * sc + 1, (y0 + CH) * sc + 1);
  x.beginPath(); x.rect(-20, -20, f.W + 40, f.H + 40);
  for (const l of R.loopsS) { x.moveTo(l[0], l[1]); for (let i = 2; i < l.length; i += 2) x.lineTo(l[i], l[i + 1]); x.closePath(); }
  x.save(); x.clip('evenodd');
  x.fillStyle = '#24153f'; x.fillRect(x0 - 1, y0 - 1, CH + 2, CH + 2);
  // cráteres y vetas, deterministas por trozo
  const rnd = G.mulberry32((ix * 73856093) ^ (iy * 19349663) ^ 0x5bd1);
  // VIS-BALIZAS-01: vetas decorativas más tenues (mismas semillas, posiciones y conteos); la silueta y las grietas no cambian
  for (let i = 0; i < 14; i++) { const cx = x0 + rnd() * CH, cy = y0 + rnd() * CH, r = 0.15 + rnd() * 0.55; x.fillStyle = 'rgba(12,5,26,.5)'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.strokeStyle = 'rgba(180,140,255,.10)'; x.lineWidth = 0.05; x.beginPath(); x.arc(cx + 0.03, cy + 0.03, r, 2.2, 5.2); x.stroke(); }
  for (let i = 0; i < 26; i++) { x.fillStyle = 'rgba(180,140,255,' + (0.02 + rnd() * 0.03).toFixed(3) + ')'; x.fillRect(x0 + rnd() * CH, y0 + rnd() * CH, 0.06, 0.06); }
  // grietas frágiles: vetas cian
  for (let yy = y0; yy < y0 + CH; yy++) for (let xx = x0; xx < x0 + CH; xx++) {
    if (xx < 0 || yy < 0 || xx >= f.W || yy >= f.H || R.g[yy * f.W + xx] !== 2) continue;
    x.strokeStyle = 'rgba(0,242,207,.75)'; x.lineWidth = 0.07; x.beginPath(); const r3 = G.mulberry32(yy * 999 + xx);
    for (let k = 0; k < 4; k++) { let px = xx + 0.5, py = yy + 0.5; x.moveTo(px, py); for (let s = 0; s < 3; s++) { px += (r3() - 0.5) * 0.7; py += (r3() - 0.5) * 0.7; x.lineTo(px, py); } }
    x.stroke(); x.fillStyle = 'rgba(0,242,207,.12)'; x.fillRect(xx, yy, 1, 1);
  }
  x.restore();
  // borde interior violeta: una línea principal nítida y una segunda más tenue
  x.lineJoin = 'round'; x.strokeStyle = 'rgba(119,0,244,.60)'; x.lineWidth = 0.16;
  x.beginPath(); for (const l of R.loopsS) { x.moveTo(l[0], l[1]); for (let i = 2; i < l.length; i += 2) x.lineTo(l[i], l[i + 1]); x.closePath(); } x.stroke();
  x.strokeStyle = 'rgba(190,150,255,.22)'; x.lineWidth = 0.04; x.stroke();
  R.chunks.set(key, c); if (R.chunks.size > 70) R.chunks.delete(R.chunks.keys().next().value);
  return c;
}

// ---------- utilidades ----------
function W2S(wx, wy) { return [(wx - R.cam.x) * R.ppc + R.w / 2, R.camSY - (wy - R.cam.y) * R.ppc]; }
R.W2S = W2S;
function particle(o) { if (R.parts.length > 256) R.parts.shift(); R.parts.push(o); }
R.burst = function (x, y, n, col, sp, life, size) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = sp * (0.3 + Math.random()); particle({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, col, size: size || 0.08 }); } };
R.addShake = function (a) { if (R.opts.shake && !R.opts.reduced) R.shake = Math.max(R.shake, a); };
R.addFlash = function (a) { R.flash = Math.max(R.flash, a); };

function rankStroke(c, rank, x, y, r) {
  if (rank == null) return; c.lineWidth = Math.max(1.5, r * 0.16);
  if (rank === 4) { const g = c.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, '#7700f4'); g.addColorStop(1, '#00f2cf'); c.strokeStyle = g; } else c.strokeStyle = RANKCOL[rank] || '#fff';
  c.globalAlpha *= 0.85; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); c.globalAlpha /= 0.85;
}
// Pulso por símbolo (0..1 brillo)
function pulse(s, t, near) {
  if (R.opts.reduced) return 1; // VIS-BALIZAS-03: glifos y rangos estáticos con movimiento reducido
  if (s === 'flecha') { const u = t % 1.2; return u < 0.18 ? 1 - u / 0.18 * 0.6 : 0.4; }
  if (s === 'peligro') { const u = t % 1.4; return (u < 0.12 || (u > 0.24 && u < 0.36)) ? 1 : 0.35; }
  if (s === 'atajo') return 0.55 + 0.45 * Math.abs(Math.sin(t * 2.4));
  if (s === 'tesoro') return 0.5 + 0.5 * Math.sin(t * Math.PI);
  if (s === 'noporaqui') return near ? (Math.floor(t * 6) % 2 ? 1 : 0.3) : 0.9;
  return 1;
}
R.drawGlyph = function (c, s, x, y, size, dir, alpha, opt) {
  opt = opt || {}; c.save(); c.translate(x, y); c.rotate((dir || 0) * Math.PI / 4); c.scale(size, size); c.globalAlpha = alpha;
  if (R.opts.contrast || opt.contrast) { c.lineWidth = 0.26; c.strokeStyle = '#fff'; c.lineJoin = 'round'; c.stroke(P2D[s]); }
  c.fillStyle = opt.col || SYMCOL[s]; c.fill(P2D[s], 'evenodd'); c.restore();
};
// Baliza completa (mástil, luz, halo de rango, símbolo)
R.drawBeacon = function (c, b, sx, sy, sz, t, a, near, unfold) {
  const col = SYMCOL[b.s], p = pulse(b.s, t + (((+b.id || 0) + (b.x || 0) * 7 + (b.y || 0) * 3) % 7) * 0.13, near), k = unfold == null ? 1 : unfold;
  c.save(); c.globalAlpha = a;
  // halo de luz
  // VIS-BALIZAS-03: halo 2,2·sz y alpha .26·p; base y glifo conservan su tamaño
  const g = c.createRadialGradient(sx, sy, 0, sx, sy, sz * 2.2); g.addColorStop(0, hexA(col, 0.26 * p)); g.addColorStop(1, hexA(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(sx, sy, sz * 2.2, 0, 7); c.fill();
  // mástil y base
  c.strokeStyle = 'rgba(245,240,255,.55)'; c.lineWidth = Math.max(1.2, sz * 0.09); c.beginPath(); c.moveTo(sx, sy + sz * 0.9); c.lineTo(sx, sy + sz * 0.35); c.stroke();
  c.fillStyle = 'rgba(10,4,24,.82)'; c.beginPath(); c.arc(sx, sy, sz * 0.92 * k, 0, 7); c.fill();
  rankStroke(c, b.rank, sx, sy, sz * 0.98 * k);
  if (b.s === 'atajo') { c.strokeStyle = hexA(col, 0.9); c.lineWidth = sz * 0.1; c.beginPath(); const a0 = t * 3.2; c.arc(sx, sy, sz * 1.22, a0, a0 + 1.4); c.stroke(); }
  if (b.practice) { c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = Math.max(1.2, sz * 0.08); c.beginPath(); c.moveTo(sx, sy - sz * 1.42); c.lineTo(sx + sz * 1.42, sy); c.lineTo(sx, sy + sz * 1.42); c.lineTo(sx - sz * 1.42, sy); c.closePath(); c.stroke(); }
  c.restore();
  R.drawGlyph(c, b.s, sx, sy, sz * 0.62 * k, b.d, a * Math.max(0.8, 0.55 + 0.45 * p)); // el glifo es el elemento de mayor contraste (alpha mínimo .80)
  if (b.votes && (b.u + b.e) >= 3 && a > 0.5) { const tot = b.u + b.e, wv = sz * 1.8; c.save(); c.globalAlpha = a * 0.9; c.fillStyle = 'rgba(255,68,102,.85)'; c.fillRect(sx - wv / 2, sy + sz * 1.25, wv, 3); c.fillStyle = '#00f2cf'; c.fillRect(sx - wv / 2, sy + sz * 1.25, wv * b.u / tot, 3); c.restore(); }
};
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a.toFixed(3) + ')'; }
R.hexA = hexA;

// Nave: gota con dos aletas, cúpula con el astronauta oficial, foco frontal.
R.drawShip = function (c, x, y, ang, sz, thrust, brake, t, alpha) {
  c.save(); c.translate(x, y); c.rotate(-ang + Math.PI / 2); c.globalAlpha = alpha == null ? 1 : alpha;
  const s = sz; // ≈ diámetro de colisión en px
  // llama del motor
  if (thrust > 0.05) { const L = s * (0.5 + thrust * 0.9) * (0.85 + Math.random() * 0.3); const fg = c.createLinearGradient(0, s * 0.45, 0, s * 0.45 + L); fg.addColorStop(0, 'rgba(160,255,245,.95)'); fg.addColorStop(0.4, 'rgba(0,242,207,.7)'); fg.addColorStop(1, 'rgba(119,0,244,0)'); c.fillStyle = fg; c.beginPath(); c.moveTo(-s * 0.16, s * 0.42); c.quadraticCurveTo(0, s * 0.45 + L * 1.1, s * 0.16, s * 0.42); c.fill(); }
  // aletas
  c.fillStyle = '#7d86ad'; c.strokeStyle = 'rgba(10,5,18,.7)'; c.lineWidth = Math.max(1, s * 0.04);
  c.beginPath(); c.moveTo(-s * 0.3, s * 0.05); c.lineTo(-s * 0.62, s * 0.5); c.lineTo(-s * 0.22, s * 0.38); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(s * 0.3, s * 0.05); c.lineTo(s * 0.62, s * 0.5); c.lineTo(s * 0.22, s * 0.38); c.closePath(); c.fill(); c.stroke();
  // casco de la nave (gota)
  const hg = c.createLinearGradient(-s * 0.4, 0, s * 0.4, 0); hg.addColorStop(0, '#ffffff'); hg.addColorStop(1, '#bfc6de'); c.fillStyle = hg;
  c.beginPath(); c.moveTo(0, -s * 0.62); c.bezierCurveTo(s * 0.42, -s * 0.3, s * 0.42, s * 0.42, 0, s * 0.46); c.bezierCurveTo(-s * 0.42, s * 0.42, -s * 0.42, -s * 0.3, 0, -s * 0.62); c.fill(); c.stroke();
  c.strokeStyle = '#7700f4'; c.lineWidth = Math.max(1, s * 0.05); c.beginPath(); c.moveTo(-s * 0.3, s * 0.22); c.quadraticCurveTo(0, s * 0.3, s * 0.3, s * 0.22); c.stroke();
  // cúpula con el astronauta oficial
  c.fillStyle = 'rgba(20,10,46,.9)'; c.beginPath(); c.arc(0, -s * 0.12, s * 0.24, 0, 7); c.fill();
  c.save(); c.beginPath(); c.arc(0, -s * 0.12, s * 0.23, 0, 7); c.clip(); TS = s * 0.42; drawAstro(c, 0, -s * 0.1, 'd', 0, false, 0, t, 0); c.restore();
  const dg = c.createRadialGradient(-s * 0.08, -s * 0.22, 0, 0, -s * 0.12, s * 0.26); dg.addColorStop(0, 'rgba(255,255,255,.55)'); dg.addColorStop(0.5, 'rgba(95,255,240,.12)'); dg.addColorStop(1, 'rgba(0,242,207,.25)');
  c.fillStyle = dg; c.beginPath(); c.arc(0, -s * 0.12, s * 0.24, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,242,207,.8)'; c.lineWidth = Math.max(1, s * 0.035); c.stroke();
  if (brake) { c.fillStyle = 'rgba(255,176,32,.85)'; c.beginPath(); c.arc(-s * 0.36, -s * 0.05, s * 0.06, 0, 7); c.arc(s * 0.36, -s * 0.05, s * 0.06, 0, 7); c.fill(); }
  c.restore();
};

// ---------- cuadro del vuelo ----------
R.frame = function (S, view, t, dt) {
  const c = R.cx, f = S.f, dpr = R.dpr; R.g = f.g;
  if (R.ctVer !== S.ct) { R.ctVer = S.ct; R.rebuildLoops(S.ct); }
  // cámara
  const portrait = R.h > R.w, shipFrac = portrait ? 0.58 : 0.55;
  R.camSY = R.h * (1 - shipFrac);
  const sp = Math.sqrt(S.vx * S.vx + S.vy * S.vy), la = view.reduced ? 0 : 1.5;
  const tlx = sp > 0.2 ? S.vx / Math.max(sp, 3) * la : 0, tly = sp > 0.2 ? S.vy / Math.max(sp, 3) * la : 0;
  const k = 1 - Math.exp(-dt * 4); R.cam.lx += (tlx - R.cam.lx) * k; R.cam.ly += (tly - R.cam.ly) * k;
  let zoom = 1; if (R.zoomOut > 0) zoom = 1 - R.zoomOut * 0.55;
  const ppc0 = R.ppc; R.ppc = ppc0 * zoom;
  R.cam.x = S.x + R.cam.lx; R.cam.y = S.y + R.cam.ly;
  if (R.zoomOut > 0) { R.cam.x += (f.W / 2 - R.cam.x) * R.zoomOut; R.cam.y += (S.y - 6 - R.cam.y) * R.zoomOut * 0.6; }
  let shx = 0, shy = 0; if (R.shake > 0) { shx = (Math.random() - 0.5) * 2 * R.shake; shy = (Math.random() - 0.5) * 2 * R.shake; R.shake = Math.max(0, R.shake - dt * 40); }
  c.setTransform(dpr, 0, 0, dpr, shx * dpr, shy * dpr);
  // fondo
  c.fillStyle = '#04020a'; c.fillRect(-10, -10, R.w + 20, R.h + 20);
  // VIS-BALIZAS-02: estrellas de vuelo a .18/.28 (misma textura, densidad y parallax, siempre bajo la niebla)
  for (let L = 0; L < 2; L++) { const par = L ? 0.35 : 0.15, ox = -((R.cam.x * R.ppc * par) % 512 + 512) % 512, oy = ((R.cam.y * R.ppc * par) % 512 + 512) % 512; c.globalAlpha = L ? 0.28 : 0.18; for (let yy = oy - 512; yy < R.h; yy += 512) for (let xx = ox; xx < R.w; xx += 512) c.drawImage(R.stars, xx, yy); }
  c.globalAlpha = 1;
  // estelas (bajo la niebla)
  if (view.trails) for (const tr of view.trails) { c.strokeStyle = tr.practice ? 'rgba(245,240,255,.16)' : 'rgba(0,242,207,.2)'; c.lineWidth = 2; c.setLineDash(tr.practice ? [3, 7] : [6, 6]); c.beginPath(); tr.pts.forEach((p, i) => { const q = W2S(p[0], p[1]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke(); c.setLineDash([]); }
  // tu propia estela (suave, para leer por dónde viniste)
  if (S.samples.length > 1) { c.strokeStyle = 'rgba(0,242,207,.13)'; c.lineWidth = 1.5; c.beginPath(); const a = Math.max(0, S.samples.length - 240); for (let i = a; i < S.samples.length; i++) { const q = W2S(S.samples[i][0] / 4, S.samples[i][1] / 4); i > a ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.lineTo(...W2S(S.x, S.y)); c.stroke(); }
  // rocas
  const cs = R.ppc / ppc0; // durante el zoom de llegada se escalan los trozos
  const x0 = R.cam.x - R.w / 2 / R.ppc - 1, x1 = R.cam.x + R.w / 2 / R.ppc + 1, yT = R.cam.y + R.camSY / R.ppc + 1, yB = R.cam.y - (R.h - R.camSY) / R.ppc - 1;
  for (let iy = Math.floor(yB / CH); iy <= Math.floor(yT / CH); iy++) for (let ix = Math.floor(x0 / CH); ix <= Math.floor(x1 / CH); ix++) {
    if (iy < -1 || iy * CH > f.H + 8) continue;
    const ch = chunk(ix, iy), p = W2S(ix * CH, (iy + 1) * CH);
    c.drawImage(ch, p[0] - 1 / dpr * cs, p[1] - 1 / dpr * cs, ch.width / dpr * cs, ch.height / dpr * cs);
  }
  // canto de la roca iluminado por el foco de la nave (solo en el radio claro)
  { const mp = mapPath(f.g, f.H), q = W2S(S.x, S.y), rr = Sm.clearR(S) * R.ppc; c.save(); c.beginPath(); c.arc(q[0], q[1], rr, 0, 7); c.clip();
    c.setTransform(dpr * R.ppc, 0, 0, -dpr * R.ppc, dpr * (R.w / 2 - R.cam.x * R.ppc + shx), dpr * (R.camSY + R.cam.y * R.ppc + shy)); c.strokeStyle = 'rgba(0,242,207,.45)'; c.lineWidth = 1.3 / R.ppc; c.lineJoin = 'round'; c.stroke(mp.line); c.restore(); }
  // objetos del campo
  const cr = Sm.clearR(S), vis = (x, y) => { const dx = x - S.x, dy = y - S.y, d = Math.sqrt(dx * dx + dy * dy); return Math.max(0, Math.min(1, (cr + 0.35 - d) / 0.7)) * (R.reveal > 0 ? 1 : 1) ; };
  const anyVis = (x, y, r) => Math.abs(x - R.cam.x) < R.w / R.ppc / 2 + r && Math.abs(y - R.cam.y) < R.h / R.ppc + r;
  const pc = R.ppc;
  // corrientes
  for (const cu of f.currents) { if (!anyVis(cu.x, cu.y, 6)) continue; const a = Math.max(vis(cu.x, cu.y), R.reveal); if (a <= 0) continue; const v = G.dirVec(cu.d); c.save(); c.globalAlpha = 0.55 * a; c.strokeStyle = 'rgba(120,200,255,.55)'; c.lineWidth = 1.4;
    for (let i = 0; i < 18; i++) { const u = ((i * 0.618 + t * 0.35) % 1) * 2 - 1, w2 = ((i * 0.377) % 1) * 2 - 1, px = cu.x + v[0] * u * cu.hl - v[1] * w2 * cu.hw, py = cu.y + v[1] * u * cu.hl + v[0] * w2 * cu.hw, q = W2S(px, py); c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] + v[0] * pc * 0.55, q[1] - v[1] * pc * 0.55); c.stroke(); }
    c.restore(); }
  // pozos
  for (const w of f.wells) { if (!anyVis(w[0], w[1], 4)) continue; const a = Math.max(vis(w[0], w[1]) , R.reveal); if (a <= 0) continue; const q = W2S(w[0], w[1]); c.save(); c.globalAlpha = a;
    const gg = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], w[2] * pc); gg.addColorStop(0, 'rgba(10,0,30,.9)'); gg.addColorStop(0.25, 'rgba(119,0,244,.35)'); gg.addColorStop(1, 'rgba(119,0,244,0)'); c.fillStyle = gg; c.beginPath(); c.arc(q[0], q[1], w[2] * pc, 0, 7); c.fill();
    c.fillStyle = 'rgba(200,170,255,.8)'; for (let i = 0; i < 26; i++) { const r0 = ((i * 0.37 + t * 0.12) % 1), rr = w[2] * pc * (1 - r0), an = i * 2.4 + t * (1.2 + 2 * r0); c.globalAlpha = a * r0; c.fillRect(q[0] + Math.cos(an) * rr, q[1] + Math.sin(an) * rr, 2, 2); }
    c.restore(); }
  // nubes iónicas (también se ven un poco en el radar)
  for (const io of f.ions) { if (!anyVis(io[0], io[1], 5)) continue; const q = W2S(io[0], io[1]); c.save(); const gg = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], io[2] * pc); gg.addColorStop(0, 'rgba(150,60,255,.28)'); gg.addColorStop(1, 'rgba(150,60,255,0)'); c.fillStyle = gg; c.beginPath(); c.arc(q[0], q[1], io[2] * pc, 0, 7); c.fill();
    c.fillStyle = '#d9c2ff'; for (let i = 0; i < 6; i++) { if (Math.random() < 0.5) continue; const an = Math.random() * 6.28, rr = Math.random() * io[2] * pc; c.fillRect(q[0] + Math.cos(an) * rr, q[1] + Math.sin(an) * rr, 1.5, 1.5); } c.restore(); }
  // tesoros
  f.treasures.forEach((tr, i) => { if (S.tre[i] || !anyVis(tr[0], tr[1], 2)) return; const a = Math.max(vis(tr[0], tr[1]), R.reveal); if (a <= 0) return; const q = W2S(tr[0], tr[1] + Math.sin(t * 2 + i) * 0.08); const gg = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], pc * 1.2); gg.addColorStop(0, hexA('#fdd835', 0.45 * a)); gg.addColorStop(1, hexA('#fdd835', 0)); c.fillStyle = gg; c.beginPath(); c.arc(q[0], q[1], pc * 1.2, 0, 7); c.fill(); R.drawGlyph(c, 'tesoro', q[0], q[1], pc * 0.36, 0, a); });
  // boyas
  f.buoys.forEach((b, i) => { if (!anyVis(b[0], b[1], 2)) return; const a = Math.max(vis(b[0], b[1]) * 0.9, R.reveal * 0.6, S.buoys[i] ? 0.0 : 0); if (a <= 0) return; const q = W2S(b[0], b[1]), on = S.buoys[i]; c.save(); c.globalAlpha = a; c.strokeStyle = on ? '#00f2cf' : 'rgba(245,240,255,.5)'; c.lineWidth = 2; c.beginPath(); c.arc(q[0], q[1], pc * 0.45, 0, 7); c.stroke(); c.setLineDash([3, 4]); c.beginPath(); c.arc(q[0], q[1], pc * 0.8 + Math.sin(t * 2) * 2, 0, 7); c.stroke(); c.setLineDash([]); c.fillStyle = on ? '#00f2cf' : '#b5a8d8'; c.beginPath(); c.arc(q[0], q[1], pc * 0.14, 0, 7); c.fill(); c.restore(); });
  // minas
  f.mines.forEach((m, i) => { const st = S.mines[i]; if (st.gone || !anyVis(m[0], m[1], 3)) return; const a = Math.max(vis(m[0], m[1]), R.reveal * 0.8); if (a <= 0) return; const q = W2S(m[0], m[1]), arming = st.arm >= 0, ph = arming ? (S.t - st.arm) / Sm.K.MINE_T : 0;
    const blink = arming ? (Math.sin(ph * ph * 40) > 0 ? 1 : 0.3) : 0.35 + 0.35 * Math.sin(t * 3 + i);
    c.save(); c.globalAlpha = a; if (arming) { c.strokeStyle = 'rgba(255,68,102,' + (0.25 + ph * 0.5).toFixed(2) + ')'; c.lineWidth = 1.5; c.beginPath(); c.arc(q[0], q[1], Sm.K.MINE_KILL * pc, 0, 7); c.stroke(); }
    c.fillStyle = '#2a1830'; c.strokeStyle = '#6b5a7a'; c.lineWidth = 1.5; c.beginPath(); c.arc(q[0], q[1], pc * 0.34, 0, 7); c.fill(); c.stroke();
    for (let k2 = 0; k2 < 6; k2++) { const an = k2 * 1.047 + 0.3; c.beginPath(); c.moveTo(q[0] + Math.cos(an) * pc * 0.34, q[1] + Math.sin(an) * pc * 0.34); c.lineTo(q[0] + Math.cos(an) * pc * 0.48, q[1] + Math.sin(an) * pc * 0.48); c.stroke(); }
    const lg = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], pc * 0.7); lg.addColorStop(0, 'rgba(255,68,102,' + blink.toFixed(2) + ')'); lg.addColorStop(1, 'rgba(255,68,102,0)'); c.fillStyle = lg; c.beginPath(); c.arc(q[0], q[1], pc * 0.7, 0, 7); c.fill(); c.restore(); });
  // rocas a la deriva
  f.drifts.forEach((d) => { const p = Sm.driftPos(d, S.t); if (!anyVis(p[0], p[1], 2)) return; const a = Math.max(vis(p[0], p[1]), R.reveal * 0.8); if (a <= 0) return; const q = W2S(p[0], p[1]), p2 = Sm.driftPos(d, S.t - 0.25), q2 = W2S(p2[0], p2[1]);
    c.save(); c.globalAlpha = a; const tg = c.createLinearGradient(q2[0], q2[1], q[0], q[1]); tg.addColorStop(0, 'rgba(181,168,216,0)'); tg.addColorStop(1, 'rgba(181,168,216,.35)'); c.strokeStyle = tg; c.lineWidth = d.r * pc * 1.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(q2[0], q2[1]); c.lineTo(q[0], q[1]); c.stroke();
    c.translate(q[0], q[1]); c.rotate(S.t * 0.8 + d.ph * 6); c.fillStyle = '#3a2a52'; c.strokeStyle = '#8d6bd0'; c.lineWidth = 1.5; c.beginPath(); for (let k2 = 0; k2 < 7; k2++) { const an = k2 / 7 * 6.283, rr = d.r * pc * (0.82 + ((k2 * 37) % 5) * 0.06); k2 ? c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : c.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); } c.closePath(); c.fill(); c.stroke(); c.restore(); });
  // puerta norte (anillos)
  { const q = W2S(f.gate[0], f.gate[1]); if (q[1] > -R.h && q[1] < R.h * 2) { c.save(); for (let i = 0; i < 3; i++) { c.strokeStyle = hexA(i === 1 ? '#7700f4' : '#00f2cf', 0.7 - i * 0.15); c.lineWidth = 3 - i * 0.6; c.beginPath(); c.ellipse(q[0], q[1], pc * (1.6 + i * 0.35 + Math.sin(t * 2 + i) * 0.08), pc * (0.75 + i * 0.18), 0, 0, 7); c.stroke(); } c.restore(); } }
  // balizas (cuerpo; el símbolo se ve también dentro de la niebla iónica)
  const blist = view.beacons || [];
  // nave
  const shipQ = W2S(S.x, S.y), shipPx = Sm.K.R * 2 * pc * 1.45;
  if (!S.rescue || S.rescue.t < 1.2 || S.rescue.t > 1.25) {
    const ra = S.rescue ? (S.rescue.t < 1.2 ? 1 - S.rescue.t / 1.2 : Math.min(1, (S.rescue.t - 1.2) / 0.5)) : 1;
    // foco frontal
    c.save(); c.globalCompositeOperation = 'lighter'; const fx = Math.cos(S.ang), fy = Math.sin(S.ang), lx = shipQ[0] + fx * pc * 2.2, ly = shipQ[1] - fy * pc * 2.2; const lg = c.createRadialGradient(lx, ly, 0, lx, ly, pc * 2.6); lg.addColorStop(0, 'rgba(0,242,207,.10)'); lg.addColorStop(1, 'rgba(0,242,207,0)'); c.fillStyle = lg; c.beginPath(); c.arc(lx, ly, pc * 2.6, 0, 7); c.fill(); c.restore();
    R.drawShip(c, shipQ[0], shipQ[1], S.ang, shipPx, view.thrust || 0, S.brake, t, ra);
    if (S.rescue && S.rescue.t < 1.2) { // dron remolcador
      const dq = [shipQ[0] + 30 - S.rescue.t * 10, shipQ[1] - 40 + S.rescue.t * 20]; c.strokeStyle = 'rgba(253,216,53,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(dq[0], dq[1]); c.lineTo(shipQ[0], shipQ[1]); c.stroke(); c.fillStyle = '#fdd835'; c.fillRect(dq[0] - 7, dq[1] - 4, 14, 8); c.fillStyle = (Math.floor(t * 8) % 2) ? '#ff4466' : '#fff'; c.beginPath(); c.arc(dq[0], dq[1] - 6, 2.5, 0, 7); c.fill();
    }
  }
  // partículas
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = R.parts.length - 1; i >= 0; i--) { const p = R.parts[i]; p.life -= dt; if (p.life <= 0) { R.parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy *= 0.97; const q = W2S(p.x, p.y), a = p.life / p.max; c.globalAlpha = a; c.fillStyle = p.col; const s = Math.max(1.2, p.size * pc * (p.grow ? (1 + (1 - a) * p.grow) : 1)); c.beginPath(); c.arc(q[0], q[1], s, 0, 7); c.fill(); }
  c.restore(); c.globalAlpha = 1;

  // ---------- niebla ----------
  if (R.reveal < 1) {
    const fc = R.fogCx, fw = R.fogCv.width, fh = R.fogCv.height, fs = fw / R.w;
    fc.setTransform(1, 0, 0, 1, 0, 0); fc.globalCompositeOperation = 'source-over'; fc.globalAlpha = 1;
    fc.fillStyle = '#0d0619'; fc.fillRect(0, 0, fw, fh);
    // memoria del mapa explorado (35 % visible)
    if (S.lastExplore !== R.lastExp || R.expS !== S) { R.lastExp = S.lastExplore; R.expS = S; R.expDirty = 1; }
    if (R.expDirty) { const d = R.expImg.data, e = S.explored; for (let y = 0; y < f.H; y++) for (let x = 0; x < f.W; x++) { const i = ((f.H - 1 - y) * f.W + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = e[y * f.W + x] ? 120 : 0; } R.expCx.putImageData(R.expImg, 0, 0); R.expDirty = 0; }
    fc.globalCompositeOperation = 'destination-out'; fc.imageSmoothingEnabled = true;
    const tl = W2S(0, f.H); fc.drawImage(R.expCv, tl[0] * fs, tl[1] * fs, f.W * R.ppc * fs, f.H * R.ppc * fs);
    // círculo claro + anillo de radar
    const ion = S.inIon, rc = cr * R.ppc * fs, rr = Sm.K.RADAR * R.ppc * fs, sq = [shipQ[0] * fs, shipQ[1] * fs];
    const rg = fc.createRadialGradient(sq[0], sq[1], 0, sq[0], sq[1], ion ? rc * 1.15 : rr);
    if (ion) { rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(0.82, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); }
    else { const a = rc / rr; rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(a * 0.86, 'rgba(0,0,0,1)'); rg.addColorStop(Math.min(0.99, a * 1.04), 'rgba(0,0,0,.42)'); rg.addColorStop(0.93, 'rgba(0,0,0,.16)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); }
    fc.fillStyle = rg; fc.beginPath(); fc.arc(sq[0], sq[1], ion ? rc * 1.15 : rr, 0, 7); fc.fill();
    // onda de baliza: despeja 1 s
    if (view.clearWaves) for (const w of view.clearWaves) { const q = W2S(w.x, w.y), a = 1 - w.age; if (a <= 0) continue; const r3 = 3 * R.ppc * fs * Math.min(1, w.age * 3 + 0.3); const g3 = fc.createRadialGradient(q[0] * fs, q[1] * fs, 0, q[0] * fs, q[1] * fs, r3); g3.addColorStop(0, 'rgba(0,0,0,' + a.toFixed(2) + ')'); g3.addColorStop(1, 'rgba(0,0,0,0)'); fc.fillStyle = g3; fc.beginPath(); fc.arc(q[0] * fs, q[1] * fs, r3, 0, 7); fc.fill(); }
    // vida de la niebla: ruido que se desplaza
    fc.globalCompositeOperation = 'source-atop'; const nsz = 128 * 7 * fs * (R.ppc / 30); const td = R.opts.reduced ? 0 : t; // con movimiento reducido el ruido no se desplaza; cobertura y opacidad idénticas
    for (let L = 0; L < 2; L++) { fc.globalAlpha = L ? 0.32 : 0.4; const ox = ((td * (L ? 6 : -4) - R.cam.x * R.ppc * fs * 0.9) % nsz + nsz) % nsz - nsz, oy = ((td * (L ? -3 : 5) + R.cam.y * R.ppc * fs * 0.9) % nsz + nsz) % nsz - nsz; for (let yy = oy; yy < fh; yy += nsz) for (let xx = ox; xx < fw; xx += nsz) fc.drawImage(R.noise, xx, yy, nsz, nsz); }
    fc.globalAlpha = 1; fc.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1 - R.reveal; c.imageSmoothingEnabled = true; c.drawImage(R.fogCv, 0, 0, R.w, R.h); c.globalAlpha = 1;
  }
  // ---------- por encima de la niebla ----------
  // rayos de la puerta: dirección general, nunca la ruta
  { const q = W2S(f.gate[0], f.gate[1]); const gy = Math.max(-40, q[1]); c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createRadialGradient(q[0], gy, 0, q[0], gy, R.h * 0.45); gg.addColorStop(0, 'rgba(0,242,207,.09)'); gg.addColorStop(0.5, 'rgba(119,0,244,.03)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(0, 0, R.w, R.h);
    for (let i = 0; i < 3; i++) { const an = Math.PI / 2 + (i - 1) * 0.28 + Math.sin(t * 0.3 + i) * 0.05; c.strokeStyle = 'rgba(0,242,207,.028)'; c.lineWidth = 12; c.beginPath(); c.moveTo(q[0], gy); c.lineTo(q[0] + Math.cos(an) * R.h, gy + Math.sin(an) * R.h); c.stroke(); } c.restore(); }
  // las balizas son faros: su luz atraviesa la niebla
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const b of (view.beacons || [])) { if (!anyVis(b.x, b.y, 4)) continue; const d = Math.hypot(b.x - S.x, b.y - S.y); if (d > Sm.K.RADAR + 1 && !b.mine && R.reveal < 0.5) continue; const q = W2S(b.x, b.y), rr2 = pc * 1.9, p0 = pulse(b.s, t, false); const gl = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr2); gl.addColorStop(0, hexA(SYMCOL[b.s], 0.22 + 0.18 * p0)); gl.addColorStop(1, hexA(SYMCOL[b.s], 0)); c.fillStyle = gl; c.beginPath(); c.arc(q[0], q[1], rr2, 0, 7); c.fill(); }
  c.restore();
  if (R.reveal < 1) { const vg2 = c.createRadialGradient(R.w / 2, R.camSY, Math.min(R.w, R.h) * 0.42, R.w / 2, R.camSY, Math.max(R.w, R.h) * 0.85); vg2.addColorStop(0, 'rgba(4,1,10,0)'); vg2.addColorStop(1, 'rgba(4,1,10,' + (0.55 * (1 - R.reveal)).toFixed(2) + ')'); c.fillStyle = vg2; c.fillRect(0, 0, R.w, R.h); }
  // pulso de radar cada 4 s
  const pr = (S.t % 4) / 4; if (!S.inIon && R.reveal < 1) { c.strokeStyle = 'rgba(0,242,207,' + (0.22 * (1 - pr)).toFixed(3) + ')'; c.lineWidth = 1.5; c.beginPath(); c.arc(shipQ[0], shipQ[1], pr * Sm.K.RADAR * R.ppc, 0, 7); c.stroke(); }
  // balizas
  for (const b of blist) {
    if (!anyVis(b.x, b.y, 3)) continue;
    const dx = b.x - S.x, dy = b.y - S.y, d = Math.sqrt(dx * dx + dy * dy), q = W2S(b.x, b.y), seen = S.seen[b.id] || b.mine;
    if (d <= cr + 0.2 || R.reveal > 0.5 || (b.mine && d < Sm.K.RADAR)) {
      const un = b.unfold == null ? 1 : b.unfold; R.drawBeacon(c, b, q[0], q[1], pc * 0.6, t, 1, d < 3, un);
      if (b.practice && d < cr) { c.font = '600 ' + Math.max(10, pc * 0.3).toFixed(0) + 'px "JetBrains Mono",monospace'; c.textAlign = 'center'; c.fillStyle = 'rgba(245,240,255,.75)'; c.fillText(view.practiceLabel || '', q[0], q[1] + pc * 1.05); }
      if (b.mine) { c.font = '700 ' + Math.max(10, pc * 0.28).toFixed(0) + 'px "JetBrains Mono",monospace'; c.textAlign = 'center'; c.fillStyle = 'rgba(0,242,207,.85)'; c.fillText(view.mineLabel || '', q[0], q[1] - pc * 0.9); }
    } else if (d <= Sm.K.RADAR && !S.inIon) {
      const ping = pr * Sm.K.RADAR > d - 0.6 && pr * Sm.K.RADAR < d + 0.6; c.fillStyle = hexA(SYMCOL[b.s], ping ? 1 : 0.55 + 0.3 * Math.sin(t * 3 + b.x)); c.beginPath(); c.arc(q[0], q[1], ping ? 5 : 3.5, 0, 7); c.fill();
      if (R.opts.contrast) { c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke(); }
    } else if (S.inIon && d <= 6) { // las balizas son faros: dentro de la bruma se ven igual
      R.drawBeacon(c, b, q[0], q[1], pc * 0.5, t, 0.9, false, 1);
    }
  }
  // destello de daño (borde rojo) y desaturación de rescate
  if (R.flash > 0) { const a = Math.min(0.55, R.flash); const vg = c.createRadialGradient(R.w / 2, R.h / 2, Math.min(R.w, R.h) * 0.35, R.w / 2, R.h / 2, Math.max(R.w, R.h) * 0.75); vg.addColorStop(0, 'rgba(255,68,102,0)'); vg.addColorStop(1, 'rgba(255,68,102,' + a.toFixed(3) + ')'); c.fillStyle = vg; c.fillRect(0, 0, R.w, R.h); R.flash = Math.max(0, R.flash - dt * 1.6); }
  if (S.hull < 30 && !S.rescue) { const a = 0.08 + 0.06 * Math.sin(t * 4); const vg = c.createRadialGradient(R.w / 2, R.h / 2, Math.min(R.w, R.h) * 0.45, R.w / 2, R.h / 2, Math.max(R.w, R.h) * 0.8); vg.addColorStop(0, 'rgba(255,68,102,0)'); vg.addColorStop(1, 'rgba(255,68,102,' + a.toFixed(3) + ')'); c.fillStyle = vg; c.fillRect(0, 0, R.w, R.h); }
  R.ppc = ppc0;
  // rendimiento: si la media cae de 45 fps durante 3 s, niebla a 1/3
  if (dt > 0) { R.fpsAvg += (1 / dt - R.fpsAvg) * 0.05; if (R.fpsAvg < 45) { R.lowT += dt; if (R.lowT > 3 && R.fogRes !== 0.34) { R.fogRes = 0.34; R.resize(R.w, R.h, true); } } else R.lowT = 0; }
};

// ---------- mapa del campo (miniatura, mapa grande, llegada, tarjetas de voto, bitácora) ----------
const mapCache = new WeakMap();
function mapPath(g, H) { // Path2D en coordenadas de mundo (roca = rectángulo + lazos, regla par-impar)
  let m = mapCache.get(g); let zeros = 0; for (let i = 0; i < g.length; i++) if (g[i] === 0) zeros++;
  if (m && m.zeros === zeros) return m;
  const L = G.loops(G.contour(g, H)).map(l => G.chaikin(l, 2)), fill = new Path2D(), line = new Path2D();
  fill.rect(-40, -40, G.W + 80, H + 80);
  for (const l of L) { const p = new Path2D(); p.moveTo(l[0], l[1]); for (let i = 2; i < l.length; i += 2) p.lineTo(l[i], l[i + 1]); p.closePath(); fill.addPath(p); line.addPath(p); }
  m = { fill, line, zeros }; mapCache.set(g, m); return m;
}
R.mapPath = mapPath;
// VIS-BALIZAS-04: tokens compartidos del mapa (miniatura, mapa grande, resultado, tarjetas de voto, bitácora)
const MAP = { bg: '#05020b', rock: '#24153f', edge: 'rgba(119,0,244,.65)', route: '#00f2cf', ship: '#ffffff', shipEdge: 'rgba(5,1,8,.9)' };
R.MAP = MAP;
R.drawMap = function (c, S, f, x, y, w, h, opt) {
  opt = opt || {}; const g = S ? S.f.g : f.g, H = f.H, view = opt.view || { x0: 0, x1: f.W, y0: 0, y1: H };
  const s2 = Math.min(w / (view.x1 - view.x0), h / (view.y1 - view.y0)), ox = x + (w - (view.x1 - view.x0) * s2) / 2 - view.x0 * s2, oy = y + (h - (view.y1 - view.y0) * s2) / 2 + view.y1 * s2;
  const X = wx => ox + wx * s2, Y = wy => oy - wy * s2;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.fillStyle = MAP.bg; c.fillRect(x, y, w, h);
  const mp = mapPath(g, H);
  c.save(); c.transform(s2, 0, 0, -s2, ox, oy); c.fillStyle = MAP.rock; c.fill(mp.fill, 'evenodd'); c.strokeStyle = MAP.edge; c.lineWidth = Math.max(0.12, 1.4 / s2); c.lineJoin = 'round'; c.stroke(mp.line); c.restore();
  // niebla sobre lo no explorado
  if (!opt.all && S) {
    const mc = R.maskCv || (R.maskCv = document.createElement('canvas')); if (mc.width !== f.W || mc.height !== H) { mc.width = f.W; mc.height = H; }
    const mx = mc.getContext('2d'), id = mx.createImageData(f.W, H), d = id.data, e = S.explored;
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < f.W; xx++) { const i = ((H - 1 - yy) * f.W + xx) * 4; d[i] = 16; d[i + 1] = 8; d[i + 2] = 32; d[i + 3] = e[yy * f.W + xx] ? 0 : 240; }
    mx.putImageData(id, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(mc, X(0), Y(H), f.W * s2, H * s2);
  }
  // ruta: trazo sólido (sin desenfoque) de al menos 1,8 px; mismos puntos, sin suavizar
  if (opt.route && opt.route.length) { c.strokeStyle = MAP.route; c.lineWidth = Math.max(1.8, s2 * 0.3); c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); const n = Math.max(2, Math.floor(opt.route.length * (opt.progress == null ? 1 : opt.progress))); for (let i = 0; i < n && i < opt.route.length; i++) { const p = opt.route[i]; i ? c.lineTo(X(p[0] / 4), Y(p[1] / 4)) : c.moveTo(X(p[0] / 4), Y(p[1] / 4)); } c.stroke(); }
  if (opt.gate) { c.strokeStyle = MAP.route; c.lineWidth = 2; c.beginPath(); c.ellipse(X(f.gate[0]), Y(f.gate[1]), Math.max(4, s2 * 1.6), Math.max(2.5, s2 * 0.8), 0, 0, 7); c.stroke(); }
  if (opt.beacons) for (const b of opt.beacons) { const bx = X(b.x), by = Y(b.y), r = Math.max(7, s2 * 0.8); c.fillStyle = 'rgba(10,4,24,.85)'; c.beginPath(); c.arc(bx, by, r * 1.1, 0, 7); c.fill(); R.drawGlyph(c, b.s, bx, by, r * 0.8, b.d, 1); }
  // nave: punto blanco con contorno oscuro de 1 px (mismo radio, sin halo)
  if (opt.ship && S) { const sx = X(S.x), sy = Y(S.y); c.fillStyle = MAP.ship; c.beginPath(); c.arc(sx, sy, Math.max(3, s2 * 0.5), 0, 7); c.fill(); c.strokeStyle = MAP.shipEdge; c.lineWidth = 1; c.stroke(); }
  c.restore();
};

// ---------- fondo vivo del menú: niebla, 4 balizas a lo lejos y la nave flotando ----------
R.menu = function (t, dt) {
  const c = R.cx, w = R.w, h = R.h, dpr = R.dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0a0418'); bg.addColorStop(1, '#050108'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
  // VIS-BALIZAS-02: menú con estrellas .25/.40 y niebla .18; con movimiento reducido el tiempo decorativo queda fijo
  const td = R.opts.reduced ? 0 : t;
  for (let L = 0; L < 2; L++) { const ox = -((td * (L ? 9 : 4)) % 512), oy = ((td * (L ? 3 : 1.5)) % 512); c.globalAlpha = L ? 0.40 : 0.25; for (let yy = oy - 512; yy < h; yy += 512) for (let xx = ox; xx < w; xx += 512) c.drawImage(R.stars, xx, yy); }
  c.globalAlpha = 1;
  const u = Math.min(w, h) / 10, land = w > h * 1.15;
  const bx = [[0.07, 0.22, 'flecha', 1], [0.93, 0.15, 'atajo', 7], [0.08, 0.86, 'peligro', 0], [0.92, 0.82, 'tesoro', 0]];
  // niebla en capas
  c.save(); c.globalAlpha = 0.18; const nsz = 1100; for (let L = 0; L < 2; L++) { const ox = ((td * (L ? 7 : -5)) % nsz + nsz) % nsz - nsz, oy = ((td * (L ? -2 : 3)) % nsz + nsz) % nsz - nsz; for (let yy = oy; yy < h; yy += nsz) for (let xx = ox; xx < w; xx += nsz) c.drawImage(R.noise, xx, yy, nsz, nsz); } c.restore();
  // las balizas de fondo se apagan suavemente si caen debajo de un texto o botón (R.menuAvoid lo llena main.js)
  R.menuFade = R.menuFade || [1, 1, 1, 1];
  bx.forEach((b, i) => { const x = b[0] * w + Math.sin(td * 0.3 + i) * 6, y = b[1] * h + Math.cos(td * 0.25 + i) * 5, rr = u * 0.34 + 18;
    const hid = (R.menuAvoid || []).some(q => x + rr > q[0] && x - rr < q[2] && y + rr > q[1] && y - rr < q[3]);
    R.menuFade[i] += ((hid ? 0 : 1) - R.menuFade[i]) * Math.min(1, (dt || 0.016) * 6);
    if (R.menuFade[i] < 0.02) return; c.save(); c.globalAlpha = R.menuFade[i]; R.drawBeacon(c, { s: b[2], d: b[3], id: i + 1, rank: i % 5 }, x, y, u * 0.34, t, 0.95, false, 1); c.restore(); });
  // nave del astronauta
  const mp = R.menuPos || { x: w * 0.5, y: h * 0.5, s: 1 }, sx = mp.x, sy = mp.y + Math.sin(td * 1.1) * u * 0.08; const u2 = u * (mp.s || 1);
  if (R.menuShip !== false && mp.s > 0) { const a = Math.PI / 2 + Math.sin(td * 0.6) * 0.12; R.drawShip(c, sx, sy, a, u2 * 1.25, 0.35 + 0.15 * Math.sin(td * 3), 0, t, 1); if (!R.opts.reduced && Math.random() < 0.5) { R.menuParts = R.menuParts || []; R.menuParts.push({ x: sx - Math.cos(a) * u2 * 0.6, y: sy + u2 * 0.6, vx: (Math.random() - 0.5) * 20, vy: 40 + Math.random() * 30, l: 0.8 }); } }
  if (R.menuParts) { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = R.menuParts.length - 1; i >= 0; i--) { const p = R.menuParts[i]; p.l -= dt; if (p.l <= 0) { R.menuParts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; c.globalAlpha = p.l; c.fillStyle = '#00f2cf'; c.beginPath(); c.arc(p.x, p.y, 2, 0, 7); c.fill(); } c.restore(); c.globalAlpha = 1; }
  const vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75); vg.addColorStop(0, 'rgba(5,1,8,0)'); vg.addColorStop(1, 'rgba(5,1,8,.7)'); c.fillStyle = vg; c.fillRect(0, 0, w, h);
};
})();
