// JET//Estación Silencio · ayudantes de dibujo compartidos (Canvas 2D).
'use strict';
const DR = (() => {
  const COL = { bg: '#050108', bg2: '#0a0418', ink: '#f5f0ff', dim: '#b5a8d8', cy: '#00f2cf', vi: '#7700f4', red: '#ff4466', amber: '#ffb347', mono: "'JetBrains Mono',ui-monospace,monospace", pop: "Poppins,system-ui,sans-serif" };
  // VIS-ESTACION-03 · tokens decorativos (opt-in por función): fondo, tinta, marcos. No tocan RAINBOW/FRAG_COL/FONT5 ni colores de señales.
  const ART = { bg: '#090F18', ink: '#EDF4F8', dim: '#B3C1CF', plateTop: '#253240', plateBot: '#15202C', edge: '#52677A', gridA: 0.025 };
  const RAINBOW = ['#ff4d5e', '#ff9a3d', '#ffe14d', '#4be37a', '#2fe6f0', '#4d7dff', '#b46bff'];
  const FONT5 = { A: '01110100011000111111100011000110001', B: '11110100011000111110100011000111110', C: '01111100001000010000100001000001111', D: '11110100011000110001100011000111110', E: '11111100001000011110100001000011111', F: '11111100001000011110100001000010000', G: '01111100001000010011100011000101111', H: '10001100011000111111100011000110001', I: '01110001000010000100001000010001110', J: '00111000100001000010000101001001100', K: '10001100101010011000101001001010001', L: '10000100001000010000100001000011111', M: '10001110111010110101100011000110001', N: '10001110011010110011100011000110001', Ñ: '01110000001000111001101011001110001', O: '01110100011000110001100011000101110', P: '11110100011000111110100001000010000', Q: '01110100011000110001101011001001101', R: '11110100011000111110101001001010001', S: '01111100001000001110000010000111110', T: '11111001000010000100001000010000100', U: '10001100011000110001100011000101110', V: '10001100011000110001100010101000100', W: '10001100011000110101101011010101010', X: '10001100010101000100010101000110001', Y: '10001100010101000100001000010000100', Z: '11111000010001000100010001000011111' };
  function rrect(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  // plate: carcasa exterior #253240→#15202C, borde #52677A de 1 px (o.lw), reflejo superior .10; o.inner añade sombra interna de 2 px.
  function plate(g, x, y, w, h, o = {}) {
    const r = o.r ?? 10; const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, o.top || ART.plateTop); gr.addColorStop(1, o.bot || ART.plateBot);
    g.fillStyle = gr; rrect(g, x, y, w, h, r); g.fill();
    g.strokeStyle = o.edge || ART.edge; g.lineWidth = o.lw || 1; g.stroke();
    if (o.reflect !== false && h > 10) { g.save(); rrect(g, x, y, w, h, r); g.clip(); g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(x + 1, y + 1, w - 2, 1); g.restore(); }
    if (o.inner) { g.save(); rrect(g, x, y, w, h, r); g.clip(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 4; rrect(g, x, y, w, h, r); g.stroke(); g.restore(); }
    if (o.glow) { g.save(); g.shadowColor = o.glow; g.shadowBlur = o.gb || 18; g.strokeStyle = o.glow; g.globalAlpha = 0.6; rrect(g, x, y, w, h, r); g.stroke(); g.restore(); }
    if (o.rivets !== false) { const m = Math.min(9, r); [[x + m, y + m], [x + w - m, y + m], [x + m, y + h - m], [x + w - m, y + h - m]].forEach(([a, b]) => { g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.arc(a, b, 2.2, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(a + .6, b + .6, 1.2, 0, 7); g.fill(); }); }
  }
  function text(g, s, x, y, o = {}) {
    g.font = `${o.w || 600} ${o.s || 14}px ${o.f === 'pop' ? COL.pop : COL.mono}`; g.fillStyle = o.c || COL.ink; g.textAlign = o.a || 'center'; g.textBaseline = o.b || 'middle';
    if (o.ls) { try { g.letterSpacing = o.ls + 'px'; } catch (e) { } }
    if (o.glow) { g.save(); g.shadowColor = o.glow; g.shadowBlur = o.gb || 12; g.fillText(s, x, y); g.restore(); } else g.fillText(s, x, y);
    if (o.ls) { try { g.letterSpacing = '0px'; } catch (e) { } }
  }
  function fit(g, s, maxW, size, o = {}) { let z = size; g.font = `${o.w || 600} ${z}px ${o.f === 'pop' ? COL.pop : COL.mono}`; while (z > 8 && g.measureText(s).width > maxW) { z -= 1; g.font = `${o.w || 600} ${z}px ${o.f === 'pop' ? COL.pop : COL.mono}`; } return z; }
  function glow(g, x, y, r, col, a = 1) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, hexA(col, 0.55 * a)); gr.addColorStop(1, hexA(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  function hexA(hex, a) { if (hex.startsWith('rgba')) return hex; const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
  function mix(h1, h2, t) { const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16); const c = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); return `rgb(${c(16)},${c(8)},${c(0)})`; }
  function grid(g, w, h, step = 28, a = ART.gridA) { g.strokeStyle = `rgba(160,140,255,${a})`; g.lineWidth = 1; g.beginPath(); for (let x = (w % step) / 2; x < w; x += step) { g.moveTo(x + .5, 0); g.lineTo(x + .5, h); } for (let y = (h % step) / 2; y < h; y += step) { g.moveTo(0, y + .5); g.lineTo(w, y + .5); } g.stroke(); }
  function bg(g, w, h, tint) { g.fillStyle = ART.bg; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(w * .5, h * .4, 10, w * .5, h * .5, Math.max(w, h) * .75); gr.addColorStop(0, hexA(tint || '#2a1458', 0.35)); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); grid(g, w, h); }
  function font5(g, ch, x, y, px, col) { const b = FONT5[ch]; if (!b) return; g.fillStyle = col; for (let i = 0; i < 35; i++) if (b[i] === '1') g.fillRect(x + (i % 5) * px, y + Math.floor(i / 5) * px, px * 0.9, px * 0.9); }
  // display de 9 segmentos (a b c d e f g + h i verticales centrales)
  function seg9(g, x, y, w, h, on, colOn, colOff) {
    const t = Math.max(3, w * 0.12), m = t * 0.6; const S = {
      a: [x + m, y, w - 2 * m, t], d: [x + m, y + h - t, w - 2 * m, t], g: [x + m, y + h / 2 - t / 2, w - 2 * m, t],
      f: [x, y + m, t, h / 2 - m * 1.2], e: [x, y + h / 2 + m * .2, t, h / 2 - m * 1.2], b: [x + w - t, y + m, t, h / 2 - m * 1.2], c: [x + w - t, y + h / 2 + m * .2, t, h / 2 - m * 1.2],
      h: [x + w / 2 - t / 2, y + m, t, h / 2 - m * 1.2], i: [x + w / 2 - t / 2, y + h / 2 + m * .2, t, h / 2 - m * 1.2] };
    for (const k in S) { const [a, b, c, d] = S[k]; const lit = on[k]; g.fillStyle = lit ? lit : colOff; if (lit) { g.save(); g.shadowColor = lit; g.shadowBlur = 12; } rrect(g, a, b, c, d, t / 2); g.fill(); if (lit) g.restore(); }
  }
  function star(g, x, y, r, col, a = 1) { g.save(); g.globalAlpha = a; glow(g, x, y, r * 3.2, col, 0.9); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r * 0.55, 0, 7); g.fill(); g.fillStyle = col; g.globalAlpha = a * 0.8; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); }
  function chip(g, s, x, y, o = {}) { const sz = o.s || 12; g.font = `700 ${sz}px ${COL.mono}`; const w = g.measureText(s).width + sz * 1.4, h = sz * 2; plate(g, x - (o.a === 'left' ? 0 : w / 2), y - h / 2, w, h, { r: h / 2, rivets: false, top: o.bg || 'rgba(20,10,40,.9)', bot: o.bg || 'rgba(20,10,40,.9)', edge: o.edge || 'rgba(0,242,207,.35)' }); text(g, s, x + (o.a === 'left' ? w / 2 : 0), y + 0.5, { s: sz, w: 700, c: o.c || COL.cy }); return w; }
  function iconBulb(g, x, y, s, col) { g.strokeStyle = col; g.lineWidth = s * .09; g.beginPath(); g.arc(x, y - s * .1, s * .3, Math.PI * .8, Math.PI * 2.2); g.lineTo(x + s * .13, y + s * .3); g.lineTo(x - s * .13, y + s * .3); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(x - s * .12, y + s * .42); g.lineTo(x + s * .12, y + s * .42); g.stroke(); }
  // pictogramas de sonidos de la estación (10)
  function picto(g, i, x, y, s, col) {
    g.save(); g.translate(x, y); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = Math.max(1.5, s * 0.08); g.lineCap = 'round'; g.lineJoin = 'round';
    const k = s / 2; g.beginPath();
    switch (i) {
      case 0: g.rect(-k * .5, -k * .8, k, k * 1.6); g.moveTo(k * .25, 0); g.arc(k * .25, 0, k * .08, 0, 7); g.stroke(); break; // puerta
      case 1: g.moveTo(0, -k * .8); g.quadraticCurveTo(k * .55, 0, 0, k * .55); g.quadraticCurveTo(-k * .55, 0, 0, -k * .8); g.fill(); break; // gota
      case 2: g.moveTo(-k * .8, 0); g.lineTo(-k * .4, 0); g.lineTo(-k * .25, -k * .6); g.lineTo(k * .05, k * .6); g.lineTo(k * .25, 0); g.lineTo(k * .8, 0); g.stroke(); break; // pitido
      case 3: for (let j = 0; j < 3; j++) { g.moveTo(-k * .8, -k * .4 + j * k * .4); g.bezierCurveTo(-k * .2, -k * .7 + j * k * .4, k * .2, -k * .1 + j * k * .4, k * .8, -k * .4 + j * k * .4); } g.stroke(); break; // viento
      case 4: g.ellipse(-k * .3, k * .2, k * .2, k * .35, -.2, 0, 7); g.fill(); g.beginPath(); g.ellipse(k * .3, -k * .3, k * .2, k * .35, -.2, 0, 7); g.fill(); break; // pasos
      case 5: g.moveTo(-k * .55, k * .45); g.quadraticCurveTo(-k * .5, -k * .7, 0, -k * .7); g.quadraticCurveTo(k * .5, -k * .7, k * .55, k * .45); g.closePath(); g.stroke(); g.beginPath(); g.arc(0, k * .6, k * .12, 0, 7); g.fill(); break; // campana
      case 6: g.rect(-k * .6, -k * .4, k * 1.2, k * .8); g.moveTo(-k * .3, -k * .4); g.lineTo(-k * .3, -k * .75); g.moveTo(k * .3, -k * .4); g.lineTo(k * .3, -k * .75); g.moveTo(-k * .3, 0); g.lineTo(k * .2, -k * .2); g.stroke(); break; // relé
      case 7: for (let j = -1; j <= 1; j++) { g.moveTo(j * k * .4, k * .7); g.bezierCurveTo(j * k * .4 - k * .25, k * .2, j * k * .4 + k * .25, -k * .2, j * k * .4, -k * .75); } g.stroke(); break; // vapor
      case 8: g.moveTo(0, k * .7); g.bezierCurveTo(-k * 1.1, -k * .1, -k * .45, -k * .9, 0, -k * .35); g.bezierCurveTo(k * .45, -k * .9, k * 1.1, -k * .1, 0, k * .7); g.fill(); break; // latido
      case 9: g.moveTo(-k * .5, -k * .7); g.lineTo(k * .5, -k * .7); g.lineTo(k * .3, 0); g.lineTo(0, k * .1); g.lineTo(-k * .3, 0); g.closePath(); g.moveTo(0, k * .1); g.lineTo(0, k * .6); g.moveTo(-k * .3, k * .65); g.lineTo(k * .3, k * .65); g.stroke(); break; // copa de cristal
    }
    g.restore();
  }
  // formas de fusible (meta de Energía)
  function fuseShape(g, kind, x, y, s, col, fill) {
    g.save(); g.translate(x, y); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = Math.max(2, s * .1); g.lineJoin = 'round'; g.beginPath();
    if (kind === 0) { g.moveTo(s * .1, -s * .5); g.lineTo(-s * .25, s * .05); g.lineTo(0, s * .05); g.lineTo(-s * .1, s * .5); g.lineTo(s * .28, -s * .08); g.lineTo(0, -s * .08); g.closePath(); }
    else if (kind === 1) { for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; g.lineTo(Math.cos(a) * s * .45, Math.sin(a) * s * .45); } g.closePath(); }
    else if (kind === 2) { g.arc(0, 0, s * .42, 0, Math.PI * 2); g.moveTo(s * .2, 0); g.arc(0, 0, s * .2, 0, Math.PI * 2, true); }
    else { const a = s * .14, b = s * .45; g.moveTo(-a, -b); g.lineTo(a, -b); g.lineTo(a, -a); g.lineTo(b, -a); g.lineTo(b, a); g.lineTo(a, a); g.lineTo(a, b); g.lineTo(-a, b); g.lineTo(-a, a); g.lineTo(-b, a); g.lineTo(-b, -a); g.lineTo(-a, -a); g.closePath(); }
    if (fill) g.fill('evenodd'); else g.stroke();
    g.restore();
  }
  const FRAG_COL = ['#00f2cf', '#b46bff', '#ffb347', '#ff6fae'];
  return { COL, ART, RAINBOW, FONT5, rrect, plate, text, fit, glow, hexA, mix, grid, bg, font5, seg9, star, chip, iconBulb, picto, fuseShape, FRAG_COL };
})();
window.DR = DR;
