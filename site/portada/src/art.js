/* JET//Portada · arte: íconos de sección, viñetas en semitono, miniaturas de tapas y astronauta. */
(function (G) {
'use strict';
const SEC_COLOR = { POL: '#7700f4', ECO: '#009e8a', DEP: '#ff7a2e', CIE: '#3d6bff', CUL: '#d1309f', SOC: '#22a35a', CLI: '#e0a800', PUB: '#7d7690', EXC: '#c99a1a' };
// íconos (24×24, trazo)
const ICON = {
  POL: '<path d="M5 10h14l-1.6-3.2H6.6z"/><path d="M8 10v10h8V10"/><path d="M6 20h12"/><path d="M12 6.8V3.5"/><circle cx="12" cy="3" r="1"/>',
  ECO: '<path d="M4 20h16"/><path d="M5 16l4.5-5 3.5 3 6-7"/><path d="M15 7h4v4"/>',
  DEP: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5.2a2.8 2.8 0 0 0 3 3.6"/><path d="M16 6h2.8a2.8 2.8 0 0 1-3 3.6"/><path d="M12 13v4"/><path d="M8.5 20.5h7l-1-3.5h-5z"/>',
  CIE: '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>',
  CUL: '<path d="M3.5 5.5c3-1.4 6-1.4 9 0v5a4.5 4.5 0 0 1-9 0z"/><path d="M6 9h.01M10 9h.01"/><path d="M6.2 12.2c1.2 1 2.4 1 3.6 0"/><path d="M14 8.6c2.2-.5 4.4-.2 6.5.9v4.6a4.4 4.4 0 0 1-7.6 3"/><path d="M15.8 12h.01M18.8 12.8h.01"/>',
  SOC: '<circle cx="8.5" cy="8" r="3"/><path d="M3 20c0-3.4 2.5-5.6 5.5-5.6S14 16.6 14 20"/><circle cx="16.5" cy="9" r="2.5"/><path d="M15.5 14.6c3.2-.3 5.5 1.6 5.5 5.4"/>',
  CLI: '<circle cx="15" cy="9" r="4.5"/><path d="M11.5 12.5L4 20"/><path d="M12.8 15.2L8 20"/><path d="M9 9.8L3.5 15"/>',
  PUB: '<path d="M3.5 10v4h3l7 4.5v-13L6.5 10z"/><path d="M17 9.5a3.5 3.5 0 0 1 0 5"/><path d="M19.5 7a7 7 0 0 1 0 10"/>',
  EXC: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>'
};
function iconSVG(sec, cls) { return '<svg class="' + (cls || 'ic') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[sec] || ICON.PUB) + '</svg>'; }

function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function gray(v) { v = Math.round(v); return 'rgb(' + v + ',' + v + ',' + v + ')'; }

// ---------- viñetas en escala de grises (se pasan a semitono) ----------
function scene(c, id, w, h) {
  const g = (y0, a, b) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, gray(a)); gr.addColorStop(1, gray(b)); return gr; };
  c.fillStyle = g(0, 120, 210); c.fillRect(0, 0, w, h);
  const s = Math.min(w, h), cx = w / 2, cy = h / 2;
  const stars = n => { c.fillStyle = gray(250); for (let i = 0; i < n; i++) { const x = (i * 97.3 % 1) * w, y = (i * 53.7 % 1) * h * 0.5; c.fillRect((i * 0.6180339 % 1) * w, (i * 0.4142 % 1) * h * 0.55, s * 0.02, s * 0.02); } };
  c.lineCap = 'round'; c.lineJoin = 'round';
  switch (id) {
    case 0: { // atril con orador
      c.fillStyle = g(0, 60, 110); c.fillRect(0, 0, w, h);
      for (let i = 0; i < 6; i++) { c.fillStyle = gray(i % 2 ? 80 : 95); c.fillRect(i * w / 6, 0, w / 12, h); }
      c.fillStyle = gray(25); c.beginPath(); c.arc(cx, cy - s * 0.12, s * 0.13, 0, 7); c.fill();
      rr(c, cx - s * 0.2, cy, s * 0.4, s * 0.4, s * 0.08); c.fill();
      c.fillStyle = gray(200); c.beginPath(); c.moveTo(cx - s * 0.28, cy + s * 0.12); c.lineTo(cx + s * 0.28, cy + s * 0.12); c.lineTo(cx + s * 0.2, h); c.lineTo(cx - s * 0.2, h); c.fill();
      c.strokeStyle = gray(30); c.lineWidth = s * 0.03; c.beginPath(); c.moveTo(cx, cy + s * 0.12); c.lineTo(cx + s * 0.05, cy - s * 0.02); c.stroke();
      break; }
    case 1: { // cúpula
      c.fillStyle = g(0, 20, 70); c.fillRect(0, 0, w, h); stars(30);
      c.fillStyle = gray(150); c.fillRect(0, h * 0.78, w, h);
      const R = s * 0.42; const gr = c.createRadialGradient(cx - R * 0.3, h * 0.78 - R * 0.6, R * 0.1, cx, h * 0.78, R); gr.addColorStop(0, gray(250)); gr.addColorStop(1, gray(120));
      c.fillStyle = gr; c.beginPath(); c.arc(cx, h * 0.8, R, Math.PI, 0); c.fill();
      c.strokeStyle = gray(60); c.lineWidth = s * 0.012; for (let i = 1; i < 4; i++) { c.beginPath(); c.ellipse(cx, h * 0.8, R * i / 4, R, 0, Math.PI, 0); c.stroke(); }
      c.fillStyle = gray(40); [0.2, 0.33, 0.62, 0.75].forEach((f, i) => c.fillRect(w * f, h * 0.8 - s * (0.1 + i % 2 * 0.07), s * 0.06, s * 0.3));
      break; }
    case 2: { // gente
      c.fillStyle = g(0, 200, 150); c.fillRect(0, 0, w, h);
      for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) {
        const x = (i + (row % 2) * 0.5) * w / 5.2 - s * 0.05, y = h * (0.45 + row * 0.2), v = 40 + row * 50;
        c.fillStyle = gray(v); c.beginPath(); c.arc(x, y, s * 0.07, 0, 7); c.fill(); rr(c, x - s * 0.11, y + s * 0.07, s * 0.22, s * 0.3, s * 0.08); c.fill();
      }
      break; }
    case 3: { // gráfico
      c.fillStyle = gray(235); c.fillRect(0, 0, w, h);
      c.strokeStyle = gray(170); c.lineWidth = s * 0.01; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(0, h * i / 5); c.lineTo(w, h * i / 5); c.stroke(); }
      for (let i = 0; i < 6; i++) { c.fillStyle = gray(150 - i * 12); const bh = h * (0.2 + i * 0.1); c.fillRect(w * (0.08 + i * 0.15), h - bh, w * 0.09, bh); }
      c.strokeStyle = gray(10); c.lineWidth = s * 0.05; c.beginPath(); c.moveTo(w * 0.05, h * 0.8); c.lineTo(w * 0.35, h * 0.55); c.lineTo(w * 0.55, h * 0.65); c.lineTo(w * 0.92, h * 0.15); c.stroke();
      break; }
    case 4: { // monedas
      c.fillStyle = g(0, 90, 180); c.fillRect(0, 0, w, h);
      for (let st = 0; st < 3; st++) for (let i = 0; i < 5 + st * 2; i++) {
        const x = w * (0.25 + st * 0.25), y = h * 0.85 - i * s * 0.07;
        c.fillStyle = gray(90 + (i % 2) * 40); c.beginPath(); c.ellipse(x, y, s * 0.13, s * 0.05, 0, 0, 7); c.fill();
        c.fillStyle = gray(230); c.beginPath(); c.ellipse(x, y - s * 0.015, s * 0.12, s * 0.04, 0, 0, 7); c.fill();
      }
      break; }
    case 5: { // mercado
      c.fillStyle = g(0, 30, 90); c.fillRect(0, 0, w, h); stars(20);
      for (let i = 0; i < 3; i++) { const x = w * (0.04 + i * 0.33), ww = w * 0.3;
        for (let k = 0; k < 5; k++) { c.fillStyle = gray(k % 2 ? 240 : 60); c.fillRect(x + k * ww / 5, h * 0.35, ww / 5, h * 0.12); }
        c.fillStyle = gray(170); c.fillRect(x, h * 0.47, ww, h * 0.4); c.fillStyle = gray(110); c.fillRect(x + ww * 0.1, h * 0.55, ww * 0.8, h * 0.1); }
      break; }
    case 6: { // copa
      c.fillStyle = g(0, 50, 120); c.fillRect(0, 0, w, h);
      for (let i = 0; i < 14; i++) { c.strokeStyle = gray(170); c.lineWidth = s * 0.012; const a = i / 14 * Math.PI * 2; c.beginPath(); c.moveTo(cx + Math.cos(a) * s * 0.3, cy + Math.sin(a) * s * 0.3); c.lineTo(cx + Math.cos(a) * s * 0.6, cy + Math.sin(a) * s * 0.6); c.stroke(); }
      const gr = c.createLinearGradient(cx - s * 0.2, 0, cx + s * 0.2, 0); gr.addColorStop(0, gray(120)); gr.addColorStop(0.4, gray(255)); gr.addColorStop(1, gray(90));
      c.fillStyle = gr; c.beginPath(); c.moveTo(cx - s * 0.22, cy - s * 0.3); c.lineTo(cx + s * 0.22, cy - s * 0.3); c.quadraticCurveTo(cx + s * 0.2, cy + s * 0.05, cx, cy + s * 0.1); c.quadraticCurveTo(cx - s * 0.2, cy + s * 0.05, cx - s * 0.22, cy - s * 0.3); c.fill();
      c.strokeStyle = gray(200); c.lineWidth = s * 0.04; c.beginPath(); c.arc(cx - s * 0.24, cy - s * 0.17, s * 0.09, Math.PI * 0.5, Math.PI * 1.5); c.stroke(); c.beginPath(); c.arc(cx + s * 0.24, cy - s * 0.17, s * 0.09, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
      c.fillStyle = gray(160); c.fillRect(cx - s * 0.04, cy + s * 0.1, s * 0.08, s * 0.14); c.fillRect(cx - s * 0.14, cy + s * 0.24, s * 0.28, s * 0.08);
      break; }
    case 7: { // astronauta oficial
      c.fillStyle = g(0, 30, 110); c.fillRect(0, 0, w, h); stars(26);
      if (typeof G.drawAstro === 'function') { const old = G.TS; G.TS = s * 0.62; G.drawAstro(c, cx, cy + s * 0.08, 'd', 0, 0, 0, 0.3, 0); G.TS = old; }
      break; }
    case 8: { // estadio y pelota
      c.fillStyle = g(0, 40, 100); c.fillRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) { c.fillStyle = gray(70 + i * 25); c.beginPath(); c.ellipse(cx, h * 1.2, w * (0.95 - i * 0.12), h * (0.9 - i * 0.12), 0, Math.PI, 0); c.fill(); }
      c.fillStyle = gray(250); c.beginPath(); c.arc(cx, cy, s * 0.18, 0, 7); c.fill();
      c.fillStyle = gray(30); c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; c.lineTo(cx + Math.cos(a) * s * 0.07, cy + Math.sin(a) * s * 0.07); } c.fill();
      break; }
    case 9: { // ciclista en el cráter
      c.fillStyle = g(0, 200, 120); c.fillRect(0, 0, w, h);
      c.fillStyle = gray(90); c.beginPath(); c.moveTo(0, h); c.quadraticCurveTo(w * 0.5, h * 0.2, w, h); c.fill();
      c.strokeStyle = gray(15); c.lineWidth = s * 0.03;
      const bx = cx, by = h * 0.55;
      c.beginPath(); c.arc(bx - s * 0.15, by, s * 0.1, 0, 7); c.stroke(); c.beginPath(); c.arc(bx + s * 0.15, by - s * 0.05, s * 0.1, 0, 7); c.stroke();
      c.beginPath(); c.moveTo(bx - s * 0.15, by); c.lineTo(bx, by - s * 0.05); c.lineTo(bx + s * 0.15, by - s * 0.05); c.moveTo(bx, by - s * 0.05); c.lineTo(bx - s * 0.04, by - s * 0.2); c.lineTo(bx + s * 0.1, by - s * 0.2); c.stroke();
      c.fillStyle = gray(15); c.beginPath(); c.arc(bx + s * 0.02, by - s * 0.36, s * 0.07, 0, 7); c.fill();
      break; }
    case 10: { // telescopio
      c.fillStyle = g(0, 10, 60); c.fillRect(0, 0, w, h); stars(40);
      c.save(); c.translate(cx, cy + s * 0.05); c.rotate(-0.6);
      const gr = c.createLinearGradient(0, -s * 0.08, 0, s * 0.08); gr.addColorStop(0, gray(250)); gr.addColorStop(1, gray(120));
      c.fillStyle = gr; rr(c, -s * 0.3, -s * 0.08, s * 0.6, s * 0.16, s * 0.04); c.fill(); c.fillStyle = gray(60); c.fillRect(s * 0.26, -s * 0.1, s * 0.06, s * 0.2); c.restore();
      c.strokeStyle = gray(190); c.lineWidth = s * 0.03; c.beginPath(); c.moveTo(cx, cy + s * 0.08); c.lineTo(cx - s * 0.18, h * 0.95); c.moveTo(cx, cy + s * 0.08); c.lineTo(cx + s * 0.18, h * 0.95); c.moveTo(cx, cy + s * 0.08); c.lineTo(cx, h * 0.95); c.stroke();
      break; }
    case 11: { // planeta con anillos
      c.fillStyle = g(0, 15, 50); c.fillRect(0, 0, w, h); stars(36);
      const R = s * 0.26, gr = c.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.1, cx, cy, R); gr.addColorStop(0, gray(255)); gr.addColorStop(1, gray(80));
      c.strokeStyle = gray(200); c.lineWidth = s * 0.035; c.beginPath(); c.ellipse(cx, cy, R * 1.8, R * 0.45, -0.3, Math.PI, Math.PI * 2); c.stroke();
      c.fillStyle = gr; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
      c.beginPath(); c.ellipse(cx, cy, R * 1.8, R * 0.45, -0.3, 0, Math.PI); c.stroke();
      break; }
    case 12: { // cohete
      c.fillStyle = g(0, 20, 90); c.fillRect(0, 0, w, h); stars(30);
      c.save(); c.translate(cx, cy); c.rotate(0.5);
      c.fillStyle = gray(240); c.beginPath(); c.moveTo(0, -s * 0.38); c.quadraticCurveTo(s * 0.14, -s * 0.15, s * 0.1, s * 0.18); c.lineTo(-s * 0.1, s * 0.18); c.quadraticCurveTo(-s * 0.14, -s * 0.15, 0, -s * 0.38); c.fill();
      c.fillStyle = gray(60); c.beginPath(); c.arc(0, -s * 0.1, s * 0.05, 0, 7); c.fill();
      c.fillStyle = gray(130); c.beginPath(); c.moveTo(-s * 0.1, s * 0.05); c.lineTo(-s * 0.2, s * 0.24); c.lineTo(-s * 0.1, s * 0.18); c.fill(); c.beginPath(); c.moveTo(s * 0.1, s * 0.05); c.lineTo(s * 0.2, s * 0.24); c.lineTo(s * 0.1, s * 0.18); c.fill();
      const fl = c.createLinearGradient(0, s * 0.18, 0, s * 0.5); fl.addColorStop(0, gray(255)); fl.addColorStop(1, gray(40));
      c.fillStyle = fl; c.beginPath(); c.moveTo(-s * 0.07, s * 0.19); c.quadraticCurveTo(0, s * 0.6, s * 0.07, s * 0.19); c.fill(); c.restore();
      break; }
    case 13: { // cometa y meteoritos
      c.fillStyle = g(0, 15, 60); c.fillRect(0, 0, w, h); stars(30);
      for (let i = 0; i < 4; i++) {
        const x = w * (0.75 - i * 0.18), y = h * (0.25 + i * 0.16), L = s * (0.55 - i * 0.08);
        const gr = c.createLinearGradient(x, y, x - L, y - L * 0.5); gr.addColorStop(0, gray(255)); gr.addColorStop(1, 'rgba(255,255,255,0)');
        c.strokeStyle = gr; c.lineWidth = s * (0.07 - i * 0.012); c.beginPath(); c.moveTo(x, y); c.lineTo(x - L, y - L * 0.5); c.stroke();
        c.fillStyle = gray(255); c.beginPath(); c.arc(x, y, s * (0.05 - i * 0.008), 0, 7); c.fill();
      }
      break; }
    case 14: { // vaca con casco
      c.fillStyle = g(0, 25, 80); c.fillRect(0, 0, w, h); stars(24);
      c.fillStyle = gray(245); rr(c, cx - s * 0.3, cy - s * 0.05, s * 0.48, s * 0.28, s * 0.1); c.fill();
      c.fillStyle = gray(30); c.beginPath(); c.arc(cx - s * 0.15, cy + s * 0.05, s * 0.07, 0, 7); c.fill(); c.beginPath(); c.arc(cx + s * 0.02, cy + s * 0.12, s * 0.05, 0, 7); c.fill();
      c.fillStyle = gray(245); [-0.22, -0.08, 0.06, 0.14].forEach(f => c.fillRect(cx + s * f, cy + s * 0.2, s * 0.05, s * 0.14));
      c.fillStyle = gray(225); rr(c, cx + s * 0.14, cy - s * 0.17, s * 0.2, s * 0.17, s * 0.06); c.fill();
      c.fillStyle = gray(120); c.fillRect(cx + s * 0.27, cy - s * 0.08, s * 0.07, s * 0.06);
      c.strokeStyle = gray(255); c.lineWidth = s * 0.02; c.beginPath(); c.arc(cx + s * 0.24, cy - s * 0.09, s * 0.17, 0, 7); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(cx + s * 0.24, cy - s * 0.09, s * 0.17, 0, 7); c.fill();
      break; }
    default: { // 15 máscaras de teatro
      c.fillStyle = g(0, 40, 110); c.fillRect(0, 0, w, h);
      const mask = (x, y, rot, smile, v) => {
        c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = gray(v); c.beginPath(); c.moveTo(-s * 0.16, -s * 0.18); c.quadraticCurveTo(0, -s * 0.24, s * 0.16, -s * 0.18); c.quadraticCurveTo(s * 0.17, s * 0.15, 0, s * 0.22); c.quadraticCurveTo(-s * 0.17, s * 0.15, -s * 0.16, -s * 0.18); c.fill();
        c.fillStyle = gray(20); c.beginPath(); c.ellipse(-s * 0.07, -s * 0.06, s * 0.035, s * 0.022, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(s * 0.07, -s * 0.06, s * 0.035, s * 0.022, 0, 0, 7); c.fill();
        c.strokeStyle = gray(20); c.lineWidth = s * 0.025; c.beginPath(); if (smile) c.arc(0, s * 0.04, s * 0.08, 0.2, Math.PI - 0.2); else c.arc(0, s * 0.16, s * 0.08, Math.PI + 0.3, -0.3); c.stroke(); c.restore();
      };
      mask(cx - s * 0.13, cy, -0.25, true, 245); mask(cx + s * 0.15, cy + s * 0.05, 0.25, false, 170);
    }
  }
}

const cache = new Map();
/** Dibuja la viñeta `id` en semitono sobre un canvas de w×h píxeles de backing (ya multiplicados por dpr).
 *  VIS-PORTADA-03: el paso se calcula en píxeles CSS (clamp(min(anchoCSS, altoCSS)/30, 1.5, 3)) y después se multiplica por dpr,
 *  así la misma foto se reconoce igual a DPR 1/2/3. Con lado corto < 48 px CSS se usa una versión de tres tonos planos de la
 *  misma escena (sin puntos más grandes que sus rasgos). La clave de caché incluye dpr y paso. La ilustración (p.ill) no cambia. */
function halftone(cv, id, ink, paper, dpr) {
  const w = cv.width, h = cv.height; if (!w || !h) return;
  dpr = dpr || 1;
  const wCss = w / dpr, hCss = h / dpr, minCss = Math.min(wCss, hCss);
  const stepCss = Math.max(1.5, Math.min(3, minCss / 30)), step = stepCss * dpr, flat = minCss < 48;
  const key = id + ':' + w + 'x' + h + ':' + ink + paper + ':' + dpr + ':' + step.toFixed(2) + (flat ? ':f' : '');
  const c = cv.getContext('2d');
  const hit = cache.get(key);
  if (hit) { c.clearRect(0, 0, w, h); c.drawImage(hit, 0, 0); return; }
  const sw = Math.ceil(w / step) + 1, sh = Math.ceil(h / step) + 1;
  const src = document.createElement('canvas'); src.width = Math.max(40, Math.min(400, sw * 2)); src.height = Math.max(40, Math.round(src.width * h / w));
  const sc = src.getContext('2d'); scene(sc, id, src.width, src.height);
  let data; try { data = sc.getImageData(0, 0, src.width, src.height).data; } catch (e) { data = null; }
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const o = out.getContext('2d');
  o.fillStyle = paper || '#f2ecdf'; o.fillRect(0, 0, w, h);
  const lum = (x, y) => { if (!data) return 0.5; const sx = Math.min(src.width - 1, Math.floor(x / w * src.width)), sy = Math.min(src.height - 1, Math.floor(y / h * src.height)); const k = (sy * src.width + sx) * 4; return (data[k] * 0.3 + data[k + 1] * 0.59 + data[k + 2] * 0.11) / 255; };
  if (flat) {
    // tres tonos planos: celdas de 2 px CSS, tinta plena / media / papel
    const cs = 2 * dpr;
    for (let y = 0; y < h; y += cs) for (let x = 0; x < w; x += cs) {
      const L = lum(x + cs / 2, y + cs / 2);
      if (L < 0.38) { o.globalAlpha = 1; } else if (L < 0.7) { o.globalAlpha = 0.45; } else continue;
      o.fillStyle = ink || '#16111f'; o.fillRect(x, y, cs + 0.5, cs + 0.5);
    }
    o.globalAlpha = 1;
  } else {
    o.fillStyle = ink || '#16111f';
    for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) {
      const x = i * step + (j % 2 ? step / 2 : 0), y = j * step;
      const rad = step * 0.62 * Math.sqrt(Math.max(0, 1 - lum(x, y)));
      if (rad > 0.25) { o.beginPath(); o.arc(x, y, rad, 0, 6.283); o.fill(); }
    }
  }
  if (cache.size > 160) cache.delete(cache.keys().next().value);
  cache.set(key, out);
  c.clearRect(0, 0, w, h); c.drawImage(out, 0, 0);
}

// ---------- miniatura de una tapa (canvas) ----------
function mini(c, ed, pos, x0, y0, W, opts) {
  opts = opts || {};
  const K = G.PortadaCore; if (!ed) return 0;
  const C = ed.C, F = ed.F, pad = Math.max(3, W * 0.04), cell = (W - pad * 2) / C, mast = Math.max(8, cell * 0.7), H = mast + cell * F + pad * 2;
  c.save();
  c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = W * 0.06; c.shadowOffsetY = W * 0.02;
  c.fillStyle = '#f2ecdf'; rr(c, x0, y0, W, H, Math.max(2, W * 0.015)); c.fill(); c.shadowColor = 'transparent';
  c.fillStyle = '#16111f'; c.font = '800 ' + Math.max(5, mast * 0.55) + 'px Poppins, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(opts.title || 'El Eco Orbital', x0 + W / 2, y0 + pad + mast * 0.42);
  c.fillRect(x0 + pad, y0 + pad + mast * 0.86, W - pad * 2, Math.max(0.6, cell * 0.025));
  const gx = x0 + pad, gy = y0 + pad + mast;
  // celdas vacías
  const g = K.gridOf(ed, pos || {});
  c.strokeStyle = 'rgba(22,17,31,.18)'; c.lineWidth = Math.max(0.5, cell * 0.02); c.setLineDash([cell * 0.08, cell * 0.08]);
  for (let i = 0; i < g.length; i++) if (g[i] < 0) { const x = i % C, y = Math.floor(i / C); c.strokeRect(gx + x * cell + cell * 0.08, gy + y * cell + cell * 0.08, cell * 0.84, cell * 0.84); }
  c.setLineDash([]);
  for (const k in (pos || {})) {
    const p = ed.pieces[k], q = pos[k]; if (!p || !q) continue;
    const d = K.dims(p, q.r), x = gx + q.x * cell + cell * 0.05, y = gy + q.y * cell + cell * 0.05, w = d.w * cell - cell * 0.1, h = d.h * cell - cell * 0.1;
    const col = SEC_COLOR[p.sec] || SEC_COLOR.PUB;
    if (p.t === 'foto') {
      const tmp = document.createElement('canvas'); tmp.width = Math.max(8, Math.round(w)); tmp.height = Math.max(8, Math.round(h)); halftone(tmp, p.ill, '#16111f', '#e9e2d2'); c.drawImage(tmp, x, y, w, h);
    } else if (p.t === 'pub' || p.t === 'clas') {
      c.fillStyle = '#e4ddcc'; c.fillRect(x, y, w, h); c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.strokeStyle = 'rgba(22,17,31,.22)'; c.lineWidth = Math.max(0.6, cell * 0.05);
      for (let t = -h; t < w; t += cell * 0.22) { c.beginPath(); c.moveTo(x + t, y + h); c.lineTo(x + t + h, y); c.stroke(); } c.restore();
      c.strokeStyle = '#16111f'; c.lineWidth = Math.max(0.6, cell * 0.03); c.strokeRect(x, y, w, h);
    } else if (p.t === 'excl') {
      const gr = c.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#f6d77a'); gr.addColorStop(0.5, '#fff3c4'); gr.addColorStop(1, '#c99a1a'); c.fillStyle = gr; c.fillRect(x, y, w, h);
    } else {
      c.fillStyle = '#fbf7ee'; c.fillRect(x, y, w, h);
      c.fillStyle = col; c.fillRect(x, y, w, Math.max(1, cell * 0.08));
      c.fillStyle = 'rgba(22,17,31,.85)';
      const lh = p.t === 'tit' ? cell * 0.2 : cell * 0.12; let yy = y + cell * 0.18;
      const lines = p.t === 'tit' ? 2 : p.t === 'breve' ? 2 : Math.floor((h - cell * 0.2) / (lh * 1.7));
      for (let i = 0; i < lines && yy + lh < y + h; i++) { const lw = (p.t === 'tit' || i === 0) ? w * 0.86 : w * (0.62 + ((i * 37) % 30) / 100); c.globalAlpha = (p.t === 'tit' || i === 0) ? 0.9 : 0.35; c.fillRect(x + cell * 0.08, yy, lw - cell * 0.08, lh * (p.t === 'tit' ? 1 : 0.7)); yy += lh * 1.7; }
      c.globalAlpha = 1;
    }
  }
  if (opts.stamp) {
    c.save(); c.translate(x0 + W * 0.54, y0 + H * 0.6); c.rotate(-0.22);
    const col = opts.stamp === 'gold' ? '#c99a1a' : opts.stamp === 'sold' ? '#d22a4a' : '#5b5470';
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = Math.max(1, W * 0.012); c.globalAlpha = 0.85;
    const txt = opts.stampText || '', fs = Math.max(6, Math.min(W * 0.075, W * 0.78 / (txt.length * 0.62 + 1))); c.font = '900 ' + fs + 'px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const tw = c.measureText(txt).width + fs; c.strokeRect(-tw / 2, -fs * 0.8, tw, fs * 1.6); c.fillText(txt, 0, 0); c.restore();
  }
  c.restore();
  return H;
}

G.PortadaArt = { SEC_COLOR, ICON, iconSVG, halftone, mini, scene, rr };
})(typeof window !== 'undefined' ? window : globalThis);
