// JET//Estación Silencio · enigmas: Prólogo, Oxígeno y Energía.
// Cada tipo expone: init(cx), tools(cx), tool(cx,id), draw(g,cx,t,dt), down/move/up(cx,x,y), key(cx,e), leave(cx).
'use strict';
window.PZ = window.PZ || {};
(() => {
  const { COL, RAINBOW, rrect, plate, text, fit, glow, hexA, bg, seg9, fuseShape, FRAG_COL } = DR;
  const t = (k, v) => I18N.t(k, v);
  const box = (w, h, asp, m = 14) => { let bw = w - 2 * m, bh = bw / asp; if (bh > h - 2 * m) { bh = h - 2 * m; bw = bh * asp; } return { x: (w - bw) / 2, y: (h - bh) / 2, w: bw, h: bh }; };
  const inR = (x, y, r) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  const RM = () => document.documentElement.classList.contains('reduce');

  // ================= P1 · Cápsula (vaho) =================
  PZ.fog = {
    init(cx) { const c = document.createElement('canvas'); c.width = 160; c.height = 100; const f = c.getContext('2d'); f.fillStyle = '#c9d6ea'; f.fillRect(0, 0, 160, 100); cx.fog = c; cx.fg = f; cx.wiped = 0; },
    draw(g, cx, tm, dt) {
      const { w, h } = cx; bg(g, w, h, '#1d2a5a');
      const B = box(w, h, 1.55, 18); cx.B = B;
      // marco de la cápsula
      // VIS-ESTACION-04 · sólo el borde de la cápsula: acero #B8C8D5→#708698 y sombra 8 px; espejo, vaho, cobertura y 6 s intactos
      g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 8; g.shadowOffsetY = 2; rrect(g, B.x - 10, B.y - 10, B.w + 20, B.h + 20, B.h * .32); const fr = g.createLinearGradient(0, B.y, 0, B.y + B.h); fr.addColorStop(0, '#B8C8D5'); fr.addColorStop(1, '#708698'); g.fillStyle = fr; g.fill(); g.restore();
      g.save(); rrect(g, B.x, B.y, B.w, B.h, B.h * .28); g.clip();
      const gr = g.createRadialGradient(B.x + B.w * .5, B.y + B.h * .55, 10, B.x + B.w * .5, B.y + B.h * .5, B.w * .6); gr.addColorStop(0, '#3a5fae'); gr.addColorStop(.6, '#152049'); gr.addColorStop(1, '#070a1c'); g.fillStyle = gr; g.fillRect(B.x, B.y, B.w, B.h);
      for (let i = 0; i < 26; i++) { const px = B.x + ((i * 97) % 100) / 100 * B.w, py = B.y + ((i * 53) % 100) / 100 * B.h; g.fillStyle = 'rgba(200,220,255,.35)'; g.beginPath(); g.arc(px, py + Math.sin(tm * .4 + i) * 3, 1.2, 0, 7); g.fill(); }
      // palabra escrita con el dedo desde dentro: espejada
      const word = cx.d.w; const sz = Math.min(B.h * .42, B.w * 1.5 / Math.max(3, word.length));
      g.save(); g.translate(B.x + B.w / 2, B.y + B.h / 2); g.scale(-1, 1); g.font = `800 ${sz}px ${COL.pop}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = sz * .09; g.strokeStyle = 'rgba(230,240,255,.55)'; g.lineJoin = 'round'; g.strokeText(word, 0, 0); g.fillStyle = 'rgba(120,160,230,.18)'; g.fillText(word, 0, 0); g.restore();
      // vaho que vuelve en 6 s
      cx.fg.globalCompositeOperation = 'source-over'; cx.fg.fillStyle = `rgba(201,214,234,${Math.min(1, dt / 6)})`; cx.fg.fillRect(0, 0, 160, 100);
      g.globalAlpha = .985; g.imageSmoothingEnabled = true; g.drawImage(cx.fog, B.x, B.y, B.w, B.h); g.globalAlpha = 1;
      // gotas de condensación
      for (let i = 0; i < 14; i++) { const px = B.x + ((i * 37 + 11) % 100) / 100 * B.w, py = B.y + ((i * 71 + 7) % 100) / 100 * B.h; g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(px, py, 2, 3, 0, 0, 7); g.fill(); }
      g.restore();
      // tornillos del marco
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const px = B.x + B.w / 2 + Math.cos(a) * (B.w / 2 + 4), py = B.y + B.h / 2 + Math.sin(a) * (B.h / 2 + 4); g.fillStyle = '#5b6386'; g.beginPath(); g.arc(Math.max(B.x - 4, Math.min(B.x + B.w + 4, px)), Math.max(B.y - 4, Math.min(B.y + B.h + 4, py)), 3, 0, 7); g.fill(); }
      if (cx.wiped < 30) { // demostración: un dedo que limpia
        const p = (tm * .5) % 1; const hx = B.x + B.w * (.25 + .5 * p), hy = B.y + B.h * (.55 + Math.sin(p * 6.28) * .08);
        g.globalAlpha = .85; g.fillStyle = '#fff'; g.beginPath(); g.arc(hx, hy, 11, 0, 7); g.fill(); g.globalAlpha = .35; g.beginPath(); g.arc(hx, hy, 20 + Math.sin(tm * 6) * 3, 0, 7); g.fill(); g.globalAlpha = 1;
        const tip = t('tour.p1'), ty = B.y + B.h + 32;
        if (ty <= h - 12) text(g, tip, w / 2, ty, { s: 13, c: COL.ink, f: 'pop', w: 500 });
        else { g.font = `500 13px ${COL.pop}`; const tw = Math.min(w - 24, g.measureText(tip).width + 28), py = B.y + B.h - 34; g.fillStyle = 'rgba(7,10,28,.82)'; rrect(g, w / 2 - tw / 2, py - 15, tw, 30, 15); g.fill(); text(g, tip, w / 2, py, { s: 13, c: COL.ink, f: 'pop', w: 500 }); }
      }
    },
    wipe(cx, x, y) { const B = cx.B; if (!B) return; const u = (x - B.x) / B.w * 160, v = (y - B.y) / B.h * 100; if (u < -10 || v < -10 || u > 170 || v > 110) return; const f = cx.fg; f.globalCompositeOperation = 'destination-out'; const gr = f.createRadialGradient(u, v, 0, u, v, 16); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); f.fillStyle = gr; f.beginPath(); f.arc(u, v, 16, 0, 7); f.fill(); cx.wiped++; },
    down(cx, x, y) { this.wipe(cx, x, y); }, move(cx, x, y, e, dn) { this.wipe(cx, x, y); }, hover(cx, x, y) { this.wipe(cx, x, y); },
    // PLAY-ESTACION-03 · equivalente con teclado: una pasada de limpieza por el centro del cristal (misma operación que el dedo; no invierte ni resuelve la inscripción; el vaho vuelve igual)
    a11y(cx, host) {
      host.innerHTML = `<button type="button" class="tool" data-k="wipe">${t('fog.kb')}</button>`;
      host.querySelector('[data-k=wipe]').onclick = () => { const B = cx.B; if (!B) return; for (const v of [34, 50, 66]) for (let u = 6; u <= 154; u += 7) this.wipe(cx, B.x + u / 160 * B.w, B.y + v / 100 * B.h); cx.sfx('key'); };
    },
  };

  // ================= P2 · Luces (interruptores) =================
  const SYM = (g, k, x, y, s, col, fill = true) => { g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); if (k === 0) g.arc(x, y, s * .5, 0, 7); else if (k === 1) { g.moveTo(x, y - s * .55); g.lineTo(x + s * .55, y + s * .42); g.lineTo(x - s * .55, y + s * .42); g.closePath(); } else g.rect(x - s * .45, y - s * .45, s * .9, s * .9); fill ? g.fill() : g.stroke(); };
  function maskSyms(g, m, x, y, s, col) { const ks = [0, 1, 2].filter(k => m >> k & 1); const W = ks.length * s * 1.15; ks.forEach((k, i) => SYM(g, k, x - W / 2 + s * .55 + i * s * 1.15, y, s, col)); return W; }
  PZ.switch = {
    init(cx) { cx.ui.sw ||= 0; cx.flash = 0; },
    draw(g, cx, tm) {
      const { w, h, d } = cx; bg(g, w, h, '#283050'); const sw = cx.ui.sw;
      // cartel de mantenimiento
      const sh = Math.max(64, h * .16); plate(g, 12, 10, w - 24, sh, { top: '#2a2410', bot: '#1a1606', edge: 'rgba(255,200,80,.35)' });
      text(g, t('sign.maint'), w / 2, 10 + sh * .26, { s: 11, c: '#ffd27a', w: 700, ls: 2 });
      const n = d.seq.length; const s = Math.min(22, (w - 60) / (n * 2.9)); let tw = 0; const parts = d.seq.map(m => ({ m, w: [0, 1, 2].filter(k => m >> k & 1).length * s * 1.15 })); tw = parts.reduce((a, p) => a + p.w, 0) + (n - 1) * s * 1.3;
      let px = w / 2 - tw / 2; parts.forEach((p, i) => { maskSyms(g, p.m, px + p.w / 2, 10 + sh * .64, s, '#ffe7a8'); px += p.w; if (i < n - 1) { text(g, '→', px + s * .65, 10 + sh * .64, { s: s * .8, c: '#a68b4a' }); px += s * 1.3; } });
      // techo con 7 tubos y pared con letras
      const top = 22 + sh, tubeY = top + 18, bh = h - top - 20; const swH = Math.min(118, bh * .34); const wallH = bh - swH - 40;
      const tw7 = (w - 30) / 7;
      for (let m = 1; m <= 7; m++) {
        const x = 15 + (m - 1) * tw7 + tw7 / 2, lit = sw === m;
        g.fillStyle = lit ? '#fff7d6' : '#2a2638'; rrect(g, x - tw7 * .38, tubeY, tw7 * .76, 9, 4); g.fill();
        if (lit) { glow(g, x, tubeY + 4, tw7 * .9, '#ffe9a0', 1); const cone = g.createLinearGradient(0, tubeY, 0, tubeY + wallH); cone.addColorStop(0, 'rgba(255,240,190,.28)'); cone.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = cone; g.beginPath(); g.moveTo(x - tw7 * .38, tubeY + 9); g.lineTo(x + tw7 * .38, tubeY + 9); g.lineTo(x + tw7 * .6, tubeY + wallH); g.lineTo(x - tw7 * .6, tubeY + wallH); g.closePath(); g.fill(); }
        const ly = tubeY + wallH * .62; const fs = Math.min(wallH * .42, tw7 * .8);
        if (lit) text(g, d.map[m], x, ly, { s: fs, w: 800, f: 'pop', c: '#fff4cf', glow: '#ffcf5a', gb: 18 });
        else { g.fillStyle = 'rgba(255,255,255,.035)'; rrect(g, x - fs * .4, ly - fs * .5, fs * .8, fs, 6); g.fill(); }
      }
      // interruptores
      const by = h - swH - 14; cx.hits = [];
      for (let k = 0; k < 3; k++) {
        const bw = Math.min(110, (w - 60) / 3), x = w / 2 + (k - 1) * (bw + 14) - bw / 2, on = sw >> k & 1;
        plate(g, x, by, bw, swH, { top: on ? '#22313F' : '#18232E', bot: '#0F171F', edge: '#6D8194', lw: 1.5, inner: true, glow: on ? COL.cy : null }); // VIS-04: carcasa carbón; el encendido conserva su halo (es estado)
        SYM(g, k, x + bw / 2, by + swH * .28, Math.min(26, swH * .24), on ? COL.cy : '#8b7fb0');
        const lx = x + bw / 2, ly = by + swH * .68; g.fillStyle = '#0a0612'; rrect(g, lx - 14, ly - 22, 28, 44, 10); g.fill();
        g.fillStyle = on ? COL.cy : '#5c5478'; rrect(g, lx - 10, on ? ly - 19 : ly + 1, 20, 18, 7); g.fill();
        cx.hits.push({ x, y: by, w: bw, h: swH, k });
      }
      if (cx.flash > 0) { g.fillStyle = `rgba(255,240,200,${cx.flash * .12})`; g.fillRect(0, 0, w, h); cx.flash = Math.max(0, cx.flash - .08); }
    },
    toggle(cx, k) { cx.ui.sw ^= (1 << k); cx.flash = 1; cx.sfx('toggle', cx.ui.sw >> k & 1); cx.vib(8); cx.save(); this.sync(cx); },
    down(cx, x, y) { const hh = (cx.hits || []).find(r => inR(x, y, r)); if (hh) this.toggle(cx, hh.k); },
    key(cx, e) { const k = '123'.indexOf(e.key); if (k >= 0) { this.toggle(cx, k); return true; } },
    // PLAY-ESTACION-03 · tres controles DOM sincronizados con los interruptores del lienzo (aria-pressed + estado en texto).
    // Sólo se expone la letra del tubo encendido por el estado actual; las combinaciones no visitadas no se revelan.
    a11y(cx, host) {
      cx.a11yHost = host;
      host.innerHTML = [0, 1, 2].map(k => `<button type="button" class="tool swb" data-k="${k}" aria-pressed="false"><span class="sym" aria-hidden="true">${['●', '▲', '■'][k]}</span>${t(['sw.circle', 'sw.tri', 'sw.sq'][k])} · <span class="st"></span></button>`).join('') + '<span class="ia-live" role="status" aria-live="polite"></span>';
      host.querySelectorAll('.swb').forEach(b => b.onclick = () => this.toggle(cx, +b.dataset.k));
      this.sync(cx);
    },
    sync(cx) {
      const host = cx.a11yHost; if (!host || !host.isConnected) return; const sw = cx.ui.sw;
      host.querySelectorAll('.swb').forEach(b => { const on = sw >> +b.dataset.k & 1; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.querySelector('.st').textContent = t(on ? 'sw.on' : 'sw.off'); });
      const live = host.querySelector('.ia-live'); if (live) live.textContent = sw ? `${t('sw.on')}: ${cx.d.map[sw] || ''}` : '';
    },
  };

  // ================= P3 · Compuerta (tres fuentes parciales, sala ancha) =================
  PZ.parts = {
    init(cx) { cx.ui.px ||= 0; cx.vx = 0; },
    tools() { return [{ id: 'l', label: '‹' }, { id: 'r', label: '›' }]; },
    tool(cx, id) { cx.ui.px += (id === 'l' ? -1 : 1) * cx.w * .6; cx.sfx('step'); },
    draw(g, cx, tm, dt) {
      const { w, h, d } = cx; const CW = Math.max(w * 2.6, 1100); cx.CW = CW;
      if (!cx.drag) { cx.ui.px += cx.vx * dt * 60; cx.vx *= Math.pow(.9, dt * 60); }
      cx.ui.px = Math.max(0, Math.min(CW - w, cx.ui.px)); const ox = -cx.ui.px;
      bg(g, w, h, '#1c2246');
      // pared con paneles
      g.save(); g.translate(ox, 0);
      for (let x = 0; x < CW; x += 160) { g.fillStyle = (x / 160) % 2 ? '#120c22' : '#150e28'; g.fillRect(x, 0, 160, h * .78); g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(x, 0, 2, h * .78); }
      g.fillStyle = '#0b0716'; g.fillRect(0, h * .78, CW, h * .22); g.fillStyle = 'rgba(0,242,207,.18)'; g.fillRect(0, h * .78, CW, 2);
      // compuerta en el centro de la sala
      const hx = CW * .5 - 70; plate(g, hx, h * .2, 140, h * .58, { top: '#18232E', bot: '#0F171F', edge: '#6D8194', lw: 1.5, inner: true }); text(g, '▮▮', hx + 70, h * .3, { s: 12, c: '#ff4466' });
      const word = d.w; const L = (s) => s;
      const [pSign, pPatch, pMug] = d.pos;
      // cartel institucional rayado
      { const cxp = CW * pSign, sw2 = Math.min(560, w * 1.1), sh2 = h * .2, x = cxp - sw2 / 2, y = h * .08; plate(g, x, y, sw2, sh2, { top: '#f2efe6', bot: '#d8d2c2', edge: 'rgba(0,0,0,.3)' }); text(g, t('p3.sign'), cxp, y + sh2 * .2, { s: Math.max(10, sh2 * .12), c: '#5a5040', w: 700, ls: 3 });
        const m = d.src[0]; const fs = Math.min(sh2 * .45, sw2 * .9 / word); for (let i = 0; i < word; i++) { const lx = cxp - (word - 1) / 2 * fs * .8 + i * fs * .8, ly = y + sh2 * .62; if (m[i] !== '_') text(g, m[i], lx, ly, { s: fs, w: 800, f: 'pop', c: '#2a2338' }); else { g.strokeStyle = 'rgba(90,70,60,.75)'; g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(lx - fs * .3 + k * 3, ly - fs * .32); g.lineTo(lx + fs * .25 + k * 2, ly + fs * .3 - k * 4); g.stroke(); } } } }
      // casillero con el parche del traje (letras pequeñas: hace falta acercar)
      { const cxp = CW * pPatch, x = cxp - 70, y = h * .3; plate(g, x, y, 140, h * .48, { top: '#18232E', bot: '#0F171F', edge: '#6D8194', lw: 1.5, inner: true }); g.fillStyle = '#e8ebf5'; rrect(g, x + 22, y + 26, 96, h * .4, 20); g.fill();
        const r = 26, py = y + 26 + h * .14; g.fillStyle = '#1b1240'; g.beginPath(); g.arc(cxp, py, r, 0, 7); g.fill(); g.strokeStyle = COL.cy; g.lineWidth = 2; g.stroke();
        text(g, t('p3.patch'), cxp, py - 11, { s: 6, c: COL.cy, w: 700 });
        const m = d.src[1]; text(g, [...m].map(c => c === '_' ? '·' : c).join(''), cxp, py + 4, { s: 7.5, c: '#fff', w: 800 }); }
      // taza con el logotipo
      { const cxp = CW * pMug, y = h * .52, mw = 70, mh = 74; g.fillStyle = '#3b2f5a'; g.fillRect(cxp - 120, y + mh, 240, 10); g.fillStyle = '#f0ecf7'; rrect(g, cxp - mw / 2, y, mw, mh, 10); g.fill(); g.strokeStyle = '#f0ecf7'; g.lineWidth = 8; g.beginPath(); g.arc(cxp + mw / 2, y + mh * .45, 16, -1.2, 1.2); g.stroke();
        text(g, t('p3.mug'), cxp, y + 14, { s: 7, c: '#7a6aa0', w: 700 }); const m = d.src[2]; text(g, [...m].map(c => c === '_' ? '_' : c).join(' '), cxp, y + mh * .55, { s: Math.min(10, 120 / word), c: '#2a1f4a', w: 800 }); }
      g.restore();
      // indicadores de desplazamiento
      const pr = cx.ui.px / (CW - w); g.fillStyle = 'rgba(255,255,255,.12)'; rrect(g, w * .3, h - 10, w * .4, 4, 2); g.fill(); g.fillStyle = COL.cy; rrect(g, w * .3 + pr * w * .4 * .75, h - 10, w * .4 * .25, 4, 2); g.fill();
      if (cx.ui.px < 20 && !cx.dragged) text(g, t('swipe') + '  ›', w / 2, h - 26, { s: 12, c: COL.dim, f: 'pop', w: 500 });
    },
    down(cx, x) { cx.drag = { x, px: cx.ui.px, lx: x }; cx.vx = 0; },
    move(cx, x, y, e, dn) { if (!cx.drag) return; cx.ui.px = cx.drag.px - (x - cx.drag.x); cx.vx = -(x - cx.drag.lx) * .5; cx.drag.lx = x; if (Math.abs(x - cx.drag.x) > 8) cx.dragged = true; },
    up(cx) { cx.drag = null; cx.save(); },
    key(cx, e) { if (e.key === 'ArrowLeft') { cx.ui.px -= 60; return true; } if (e.key === 'ArrowRight') { cx.ui.px += 60; return true; } },
  };

  // ================= O2·1 · Bombonas =================
  PZ.canisters = {
    init(cx) { cx.ui.sign ??= false; },
    tools(cx) { return [{ id: 'sign', label: t('t.sign'), on: cx.ui.sign }]; },
    tool(cx, id) { cx.ui.sign = !cx.ui.sign; cx.sfx('tap'); },
    draw(g, cx, tm) {
      const { w, h, d } = cx; bg(g, w, h, '#0f3a33'); const n = d.cans.length;
      const cw = Math.min(w / (n + .6), h * .36), gap = cw * .18, tot = n * cw + (n - 1) * gap, x0 = (w - tot) / 2, ch = Math.min(h * .62, cw * 2.3), y0 = h * .3;
      g.fillStyle = '#0c1d1a'; g.fillRect(0, y0 + ch, w, h - y0 - ch);
      d.cans.forEach(([sym, p], i) => {
        const x = x0 + i * (cw + gap); const gr = g.createLinearGradient(x, 0, x + cw, 0); gr.addColorStop(0, '#2f6f63'); gr.addColorStop(.45, '#7ee0c9'); gr.addColorStop(1, '#1f4a42');
        g.fillStyle = gr; rrect(g, x, y0, cw, ch, cw * .32); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.stroke();
        g.fillStyle = 'rgba(255,255,255,.85)'; rrect(g, x + cw * .14, y0 + ch * .38, cw * .72, ch * .3, 6); g.fill();
        text(g, sym, x + cw / 2, y0 + ch * .53, { s: Math.min(cw * .42, ch * .2), w: 800, f: 'pop', c: '#0e2c27' });
        // manómetro
        const gx = x + cw / 2, gy = y0 - cw * .28, R = cw * .34; g.fillStyle = '#0b1513'; g.beginPath(); g.arc(gx, gy, R + 4, 0, 7); g.fill(); g.fillStyle = '#e9f4ef'; g.beginPath(); g.arc(gx, gy, R, 0, 7); g.fill();
        g.fillStyle = '#5a6a66'; g.fillRect(gx - 3, gy + R, 6, cw * .12);
        for (let k = 1; k <= 5; k++) { const a = Math.PI * (0.8 + (k - 1) * 0.35); const tx = gx + Math.cos(a) * R * .72, ty = gy + Math.sin(a) * R * .72; text(g, String(k), tx, ty, { s: Math.max(9, R * .3), c: '#33413e', w: 700 }); g.strokeStyle = '#33413e'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(gx + Math.cos(a) * R * .9, gy + Math.sin(a) * R * .9); g.lineTo(gx + Math.cos(a) * R, gy + Math.sin(a) * R); g.stroke(); }
        const a = Math.PI * (0.8 + (p - 1) * 0.35) + Math.sin(tm * 3 + i) * 0.015; g.strokeStyle = '#d81b4a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + Math.cos(a) * R * .8, gy + Math.sin(a) * R * .8); g.stroke(); g.fillStyle = '#222'; g.beginPath(); g.arc(gx, gy, 3, 0, 7); g.fill();
      });
      if (cx.ui.sign) {
        const cols = w > h ? 6 : 4, rows = Math.ceil(d.table.length / cols); const bw = Math.min(88, (w - 30) / cols), bh = bw * .9; const tw = cols * bw, th = rows * bh + 30, x0b = (w - tw) / 2, y0b = (h - th) / 2;
        plate(g, x0b - 10, y0b - 6, tw + 20, th + 14, { top: '#12372E', bot: '#0A241F', edge: '#507D6C' }); text(g, t('sign.elements'), w / 2, y0b + 10, { s: 11, c: '#3fe0b0', w: 700, ls: 2 });
        d.table.forEach(([s, es, en, z], i) => { const x = x0b + (i % cols) * bw, y = y0b + 24 + Math.floor(i / cols) * bh; g.strokeStyle = 'rgba(63,224,176,.35)'; g.strokeRect(x + 3, y + 3, bw - 6, bh - 6); text(g, String(z), x + 9, y + 12, { s: 9, a: 'left', c: '#7ccfb8' }); text(g, s, x + bw / 2, y + bh * .45, { s: bw * .26, w: 800, f: 'pop' }); text(g, cx.lang === 'en' ? en : es, x + bw / 2, y + bh * .78, { s: Math.min(11, fit(g, cx.lang === 'en' ? en : es, bw - 10, 11)), c: COL.dim }); });
      }
    },
  };

  // ================= O2·2 · Hoja de riego (rejilla) =================
  const rot8 = (r, c, n) => { for (let i = 0; i < n; i++) [r, c] = [c, 7 - r]; return [r, c]; };
  PZ.grille = {
    init(cx) { cx.ui.r ??= 0; cx.ui.on ??= true; cx.ang = cx.ui.r * 90; },
    tools(cx) { return [{ id: 'rot', label: '↻ ' + t('t.rotate') }, { id: 'on', label: cx.ui.on ? (cx.lang === 'en' ? 'Remove grille' : 'Quitar rejilla') : (cx.lang === 'en' ? 'Place grille' : 'Poner rejilla') }]; },
    tool(cx, id) { if (id === 'rot') { cx.ui.r = (cx.ui.r + 1) % 4; cx.sfx('ratchet', cx.ui.r * 4); } else { cx.ui.on = !cx.ui.on; cx.sfx('tap'); cx.refreshTools(); } cx.save(); },
    draw(g, cx, tm, dt) {
      const { w, h, d } = cx; bg(g, w, h, '#123d35'); const S = Math.min(w - 28, h - 28), x0 = (w - S) / 2, y0 = (h - S) / 2, c = S / 8.6, ox = x0 + c * .3, oy = y0 + c * .3;
      cx.S = { x: x0, y: y0, w: S, h: S };
      plate(g, x0, y0, S, S, { top: '#efe8d6', bot: '#d9cfb6', edge: 'rgba(0,0,0,.25)', rivets: false });
      // muesca del marco
      const corner = (k) => [[x0, y0], [x0 + S, y0], [x0 + S, y0 + S], [x0, y0 + S]][k];
      const [fx, fy] = corner(d.k); g.fillStyle = '#0c6b5c'; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + (fx === x0 ? 1 : -1) * c * .8, fy); g.lineTo(fx, fy + (fy === y0 ? 1 : -1) * c * .8); g.closePath(); g.fill();
      const target = cx.ui.r * 90; let da = target - cx.ang; if (da > 180) da -= 360; if (da < -180) da += 360; cx.ang += da * Math.min(1, dt * 14); if (Math.abs(da) < .3) cx.ang = target;
      const holes = new Set(d.holes.map(([r, cc]) => { const [a, b] = rot8(r, cc, cx.ui.r); return a * 8 + b; }));
      const settled = Math.abs(cx.ang - target) < 1;
      for (let i = 0; i < 64; i++) { const r = Math.floor(i / 8), q = i % 8; text(g, d.g[i], ox + q * c + c / 2, oy + r * c + c / 2, { s: c * .5, w: 700, c: '#3a3226' }); }
      if (cx.ui.on) {
        g.save(); g.translate(x0 + S / 2, y0 + S / 2); g.rotate(cx.ang * Math.PI / 180); g.translate(-S / 2, -S / 2);
        const pg = g.createLinearGradient(0, 0, S, S); pg.addColorStop(0, 'rgba(52,62,80,.97)'); pg.addColorStop(1, 'rgba(30,36,50,.97)');
        g.fillStyle = pg; g.beginPath(); rrect(g, 2, 2, S - 4, S - 4, 8);
        for (const [r, q] of d.holes) { g.rect(c * .3 + q * c + c * .14, c * .3 + r * c + c * .14, c * .72, c * .72); }
        g.fill('evenodd');
        // muesca de la rejilla (su esquina superior izquierda)
        g.fillStyle = COL.cy; g.beginPath(); g.moveTo(2, 2); g.lineTo(c * .8, 2); g.lineTo(2, c * .8); g.closePath(); g.fill();
        for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(8 + i * S / 12, S - 12, S / 24, 4); }
        g.restore();
        if (settled && cx.ui.r === d.k) { g.save(); g.strokeStyle = COL.cy; g.shadowColor = COL.cy; g.shadowBlur = 16; g.lineWidth = 2; rrect(g, x0, y0, S, S, 8); g.stroke(); g.restore(); }
        if (settled) for (const i of holes) { const r = Math.floor(i / 8), q = i % 8; text(g, d.g[i], ox + q * c + c / 2, oy + r * c + c / 2, { s: c * .5, w: 800, c: '#101418' }); }
      }
    },
    down(cx, x, y) { if (cx.ui.on && inR(x, y, cx.S)) this.tool(cx, 'rot'); },
    key(cx, e) { if (e.key === 'r' || e.key === 'R' || e.key === 'ArrowRight') { this.tool(cx, 'rot'); return true; } },
  };

  // ================= O2·3 · Macetas a oscuras (linterna) =================
  PZ.pots = {
    init(cx) { cx.ui.lx ??= .5; cx.ui.ly ??= .45; },
    draw(g, cx, tm) {
      const { w, h, d } = cx; const n = d.pots.length; const two = w < h && n > 4; const cols = two ? Math.ceil(n / 2) : n, rows = two ? 2 : 1;
      g.fillStyle = '#0b1612'; g.fillRect(0, 0, w, h);
      const cw = w / cols, rh = h / rows;
      d.pots.forEach((p, i) => {
        const c = i % cols, r = Math.floor(i / cols), cxp = c * cw + cw / 2, base = r * rh + rh * .9, pw = Math.min(cw * .78, rh * .5), ph = pw * .62;
        // estante
        g.fillStyle = '#3a2a1c'; g.fillRect(c * cw + 4, base, cw - 8, 6);
        // planta (altura = h)
        const ph2 = (rh * .78 - ph) * p.h; g.strokeStyle = '#2f8a4a'; g.lineWidth = 3; g.beginPath(); g.moveTo(cxp, base - ph); g.lineTo(cxp, base - ph - ph2); g.stroke();
        for (let k = 1; k < 5; k++) { const ly = base - ph - ph2 * k / 5, s = (k % 2 ? 1 : -1); g.fillStyle = '#3fb562'; g.beginPath(); g.ellipse(cxp + s * pw * .16, ly, pw * .16, pw * .07, s * .5, 0, 7); g.fill(); }
        g.fillStyle = '#56d67a'; g.beginPath(); g.ellipse(cxp, base - ph - ph2, pw * .1, pw * .14, 0, 0, 7); g.fill();
        // maceta
        g.fillStyle = '#9c5a34'; g.beginPath(); g.moveTo(cxp - pw / 2, base - ph); g.lineTo(cxp + pw / 2, base - ph); g.lineTo(cxp + pw * .38, base); g.lineTo(cxp - pw * .38, base); g.closePath(); g.fill();
        g.fillStyle = '#b86d42'; g.fillRect(cxp - pw / 2 - 2, base - ph, pw + 4, ph * .2);
        text(g, String(p.n), cxp + pw * .26, base - ph * .45, { s: ph * .38, w: 800, f: 'pop', c: '#f6e2c4' });
        // etiqueta
        const lw = Math.min(pw * 1.05, cw - 8); const fs = fit(g, p.nm, lw - 10, 14, { f: 'pop', w: 600 }); g.fillStyle = '#efe6cf'; rrect(g, cxp - lw / 2, base - ph * .8, lw * .62, ph * .42, 4); g.fill();
        g.save(); g.translate(cxp - lw / 2 + lw * .31, base - ph * .59); text(g, p.nm, 0, 0, { s: Math.min(fs, (lw * .62 - 6) / p.nm.length * 1.7), f: 'pop', w: 600, c: '#3a2a12' }); g.restore();
      });
      // oscuridad con el cono de la linterna
      const lx = cx.ui.lx * w, ly = cx.ui.ly * h, R = Math.max(70, Math.min(w, h) * .19);
      const gr = g.createRadialGradient(lx, ly, R * .35, lx, ly, R); gr.addColorStop(0, 'rgba(2,3,6,0)'); gr.addColorStop(1, 'rgba(2,3,6,.975)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,240,200,.05)'; g.beginPath(); g.arc(lx, ly, R * .5, 0, 7); g.fill();
    },
    move(cx, x, y) { cx.ui.lx = Math.max(0, Math.min(1, x / cx.w)); cx.ui.ly = Math.max(0, Math.min(1, y / cx.h)); if (Math.random() < .15) cx.sfx('fluid', .1); },
    down(cx, x, y) { this.move(cx, x, y); },
    hover(cx, x, y) { this.move(cx, x, y); },
    key(cx, e) { const s = .04; if (e.key === 'ArrowLeft') cx.ui.lx -= s; else if (e.key === 'ArrowRight') cx.ui.lx += s; else if (e.key === 'ArrowUp') cx.ui.ly -= s; else if (e.key === 'ArrowDown') cx.ui.ly += s; else return; cx.ui.lx = Math.max(0, Math.min(1, cx.ui.lx)); cx.ui.ly = Math.max(0, Math.min(1, cx.ui.ly)); return true; },
  };

  // ================= O2·4 · Columna de burbujas =================
  PZ.bubbles = {
    init(cx) { cx.ui.lv ??= 0; cx.bub = []; cx.tilt = false; },
    tools(cx) { const tl = []; if (window.DeviceOrientationEvent && 'ontouchstart' in window) tl.push({ id: 'tilt', label: t('tilt.use'), on: cx.tilt }); return tl; },
    tool(cx, id) {
      if (id !== 'tilt') return;
      const go = () => { cx.tilt = !cx.tilt; cx.zero = null; cx.refreshTools(); if (cx.tilt && !cx.onOri) { cx.onOri = (e) => { if (!cx.tilt || e.beta == null) return; if (cx.zero == null) cx.zero = e.beta; const v = Math.max(0, Math.min(19, cx.ui.lv + (e.beta - cx.zero) * .02)); cx.ui.lv = v; }; addEventListener('deviceorientation', cx.onOri); } };
      if (typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') go(); }).catch(() => { }); else go();
    },
    leave(cx) { if (cx.onOri) removeEventListener('deviceorientation', cx.onOri); },
    draw(g, cx, tm, dt) {
      const { w, h, d } = cx; bg(g, w, h, '#0e3b44'); const N = 20; const land = w > h * 1.05;
      const th = h * .84, ty = h * .08, tw = Math.min(70, w * .16), tx = land ? w * .1 : w * .08; cx.T = { x: tx - 30, y: ty, w: tw + 70, h: th };
      // escala de letras
      const lv = cx.ui.lv; const ln = Math.round(lv); const near = Math.abs(lv - ln) < .3;
      for (let i = 0; i < N; i++) { const y = ty + th - (i + .5) / N * th; const isT = d.tg.includes(i); const here = near && ln === i; g.strokeStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(tx + tw, y); g.lineTo(tx + tw + 8, y); g.stroke(); text(g, d.scale[i], tx + tw + 22, y, { s: Math.min(16, th / N * .7), w: 800, c: here ? (isT ? COL.cy : '#fff') : 'rgba(181,168,216,.35)', glow: here && isT ? COL.cy : null }); }
      // tubo
      g.fillStyle = 'rgba(160,220,255,.08)'; rrect(g, tx, ty, tw, th, tw / 2); g.fill(); g.strokeStyle = 'rgba(200,240,255,.4)'; g.lineWidth = 2; g.stroke();
      const wy = ty + th - (lv + .5) / N * th; g.save(); rrect(g, tx, ty, tw, th, tw / 2); g.clip(); const wg = g.createLinearGradient(0, wy, 0, ty + th); wg.addColorStop(0, '#3fd0e0'); wg.addColorStop(1, '#0a5d78'); g.fillStyle = wg; g.fillRect(tx, wy, tw, ty + th - wy); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(tx, wy, tw, 2);
      if (Math.random() < dt * 6) cx.bub.push({ x: tx + tw * (.25 + Math.random() * .5), y: ty + th, r: 2 + Math.random() * 3 });
      cx.bub = cx.bub.filter(b => { if (near && d.tg.includes(ln) && b.y < wy + 14 && b.y > wy - 4) { b.y = wy + 6; b.stuck = true; } else b.y -= dt * 60 * (1 + b.r * .2); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.stroke(); return b.y > wy - 2 && b.y > ty; });
      if (near && d.tg.includes(ln)) { glow(g, tx + tw / 2, wy, tw, COL.cy, 1); }
      g.restore();
      // deslizador (arrastrar sobre el tubo o la escala)
      g.fillStyle = COL.cy; rrect(g, tx - 22, wy - 10, 16, 20, 5); g.fill(); text(g, '‹', tx - 14, wy, { s: 12, c: '#062', w: 800 });
      // lámina con los dibujos (frascos con agua a una altura)
      const n = d.tg.length; const cx0 = land ? w * .38 : tx + tw + 50, cw0 = w - cx0 - 14; const jw = Math.min(56, cw0 / n - 8), jh = land ? th * .7 : Math.min(th * .5, jw * 3.2);
      const cy0 = land ? ty + th * .15 : ty + th * .25; plate(g, cx0, cy0 - 26, cw0, jh + 60, { top: '#efe7d2', bot: '#ddd2b6', edge: 'rgba(0,0,0,.2)', rivets: false });
      d.tg.forEach((nIdx, i) => {
        const x = cx0 + 10 + i * (cw0 - 20) / n + ((cw0 - 20) / n - jw) / 2, y = cy0; g.strokeStyle = '#3a4a52'; g.lineWidth = 1.5; rrect(g, x, y, jw, jh, 6); g.stroke();
        const lvY = y + jh - (nIdx + .5) / N * jh; g.fillStyle = 'rgba(40,140,180,.45)'; g.fillRect(x + 1, lvY, jw - 2, y + jh - lvY - 1); g.strokeStyle = '#1a5d7a'; g.beginPath(); g.moveTo(x, lvY); g.lineTo(x + jw, lvY); g.stroke();
        g.strokeStyle = '#2f7a3e'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + jw / 2, y + jh - 4); g.lineTo(x + jw / 2, y - 12); g.stroke(); g.fillStyle = '#3c9a4e'; g.beginPath(); g.ellipse(x + jw / 2 - 6, y - 6, 6, 3, -.5, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + jw / 2 + 6, y - 12, 6, 3, .5, 0, 7); g.fill();
        text(g, String(i + 1), x + jw / 2, y + jh + 14, { s: 11, c: '#5a4a30', w: 700 });
      });
    },
    setLv(cx, y) { const T = cx.T; const v = (T.y + T.h - y) / T.h * 20 - .5; const nv = Math.max(0, Math.min(19, v)); if (Math.round(nv) !== Math.round(cx.ui.lv)) cx.sfx('fluid', nv / 19); cx.ui.lv = nv; },
    down(cx, x, y) { if (inR(x, y, cx.T)) { cx.dr = true; this.setLv(cx, y); } },
    move(cx, x, y) { if (cx.dr) this.setLv(cx, y); },
    up(cx) { cx.dr = false; const r = Math.round(cx.ui.lv); if (Math.abs(cx.ui.lv - r) < .45) cx.ui.lv = r; if (cx.d.tg.includes(Math.round(cx.ui.lv))) { cx.sfx('bubble'); cx.vib(10); } cx.save(); },
    key(cx, e) { if (e.key === 'ArrowUp') cx.ui.lv = Math.min(19, Math.round(cx.ui.lv) + (e.shiftKey ? 5 : 1)); else if (e.key === 'ArrowDown') cx.ui.lv = Math.max(0, Math.round(cx.ui.lv) - (e.shiftKey ? 5 : 1)); else return; cx.sfx('fluid', cx.ui.lv / 19); if (cx.d.tg.includes(cx.ui.lv)) cx.sfx('bubble'); return true; },
  };

  // ================= O2 meta · Respira (tuberías y flores) =================
  const SLOTS = [2, 0, 3, 1];
  PZ.pipes = {
    init(cx) { cx.bloomT = 0; },
    tools() { return [{ id: 'again', label: t('t.replay') }]; },
    tool(cx) { cx.bloomT = 0; cx.sfx('tap'); },
    draw(g, cx, tm, dt) {
      const { w, h, d } = cx; bg(g, w, h, '#0f3a33'); cx.bloomT += dt;
      // la tabla de 5×5 más las tomas (que sobresalen 0,73 celdas por lado) entra entera bajo las macetas
      const fh = Math.min(h * .24, 120); const c = Math.max(20, Math.min((w - 12) / 6.46, (h - fh - 32) / 6.46)), S = c * 5, bx = (w - S) / 2, by = fh + 26 + c * .73 + Math.max(0, (h - fh - 32 - c * 6.46) / 2);
      // flores (orden temporal)
      const fw = Math.min(70, w / 5);
      for (let i = 0; i < 4; i++) { const x = w / 2 + (i - 1.5) * fw * 1.3, y = fh; g.fillStyle = '#8a5432'; g.beginPath(); g.moveTo(x - 16, y); g.lineTo(x + 16, y); g.lineTo(x + 11, y + 20); g.lineTo(x - 11, y + 20); g.closePath(); g.fill(); g.strokeStyle = '#2f7a3e'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - fh * .5); g.stroke(); }
      for (let k = 0; k < 4; k++) {
        const st = 0.8 + k * 1.3, p = Math.max(0, Math.min(1, (cx.bloomT - st) / 0.6)); const slot = SLOTS[k], x = w / 2 + (slot - 1.5) * fw * 1.3, y = fh - fh * .5;
        if (p > 0) { const col = FRAG_COL[d.order[k]]; if (p < 1) glow(g, x, y, 40 * p, col, 1); for (let pt = 0; pt < 6; pt++) { const a = pt / 6 * 6.283 + tm * .2; g.fillStyle = col; g.beginPath(); g.ellipse(x + Math.cos(a) * 9 * p, y + Math.sin(a) * 9 * p, 8 * p, 4.5 * p, a, 0, 7); g.fill(); } g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(x, y, 4 * p, 0, 7); g.fill(); if (p > 0 && p < .2) cx.sfx('star', k * 2); }
        else { g.fillStyle = '#3c9a4e'; g.beginPath(); g.ellipse(x, y, 4, 7, 0, 0, 7); g.fill(); }
      }
      // tablero y tuberías
      plate(g, bx - 8, by - 8, S + 16, S + 16, { top: '#12372E', bot: '#0A241F', edge: '#507D6C' }); // VIS-04: soporte verde oscuro; 5×5, letras, conectores y floración intactos
      const cc = (i) => [bx + (i % 5) * c + c / 2, by + Math.floor(i / 5) * c + c / 2];
      const conn = d.pipes.map((p) => { const [sx, sy] = cc(p.start); const out = [[0, -1], [1, 0], [0, 1], [-1, 0]][p.side]; return [sx + out[0] * c * .95, sy + out[1] * c * .95]; });
      d.pipes.forEach((p, f) => {
        if (!cx.owned(f)) return; const col = FRAG_COL[f]; const [cnx, cny] = conn[f];
        g.save(); g.strokeStyle = col; g.lineWidth = c * .16; g.lineCap = 'round'; g.lineJoin = 'round'; g.globalAlpha = .85; g.beginPath(); g.moveTo(cnx, cny); p.path.forEach(i => { const [x, y] = cc(i); g.lineTo(x, y); }); g.stroke();
        g.setLineDash([c * .12, c * .22]); g.lineDashOffset = RM() ? 0 : -tm * 30; g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = c * .05; g.stroke(); g.restore(); // VIS-04: brillo de ruta .45; bajo «reducir movimiento» sólo se detiene el guion decorativo, no la floración
      });
      // las tomas van encima de su tubería, para que su letra se lea siempre
      d.pipes.forEach((p, f) => { const own = cx.owned(f), col = FRAG_COL[f]; const [cnx, cny] = conn[f]; g.fillStyle = own ? col : '#2a3a36'; g.beginPath(); g.arc(cnx, cny, c * .28, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.stroke(); text(g, 'ABCD'[f], cnx, cny + 1, { s: c * .28, w: 800, c: own ? '#06201a' : '#5c6f6a' }); });
      for (let i = 0; i < 25; i++) { const [x, y] = cc(i); g.fillStyle = '#0a1f1b'; g.beginPath(); g.arc(x, y, c * .3, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1.5; g.stroke(); text(g, d.board[i], x, y + 1, { s: c * .3, w: 800, c: '#e8fff8' }); }
    },
  };

  // ================= EN·1 · Rueda de cifrado =================
  PZ.wheel = {
    init(cx) { cx.ui.rot ??= 0; cx.ang = cx.ui.rot; },
    tools() { return [{ id: 'm', label: '‹' }, { id: 'p', label: '›' }]; },
    tool(cx, id) { this.step(cx, id === 'p' ? 1 : -1); },
    step(cx, s) { const n = cx.d.al.length; cx.ui.rot = ((cx.ui.rot + s) % n + n) % n; cx.sfx('ratchet', cx.ui.rot); cx.vib(4); cx.save(); },
    draw(g, cx, tm, dt) {
      const { w, h, d } = cx; bg(g, w, h, '#4a2a0a'); const n = d.al.length; const land = w > h;
      const topP = land ? 0 : Math.min(h * .36, 70 + Math.min(54, w * .8 / 4.5) * 1.9 + 40); const R = land ? Math.min(h * .44, w * .3) : Math.min(w * .43, (h - topP) * .45), cxw = land ? w * .34 : w / 2, cyw = land ? h / 2 : topP + (h - topP) / 2 + 6; cx.W = { x: cxw, y: cyw, R };
      let da = cx.ui.rot - cx.ang; if (da > n / 2) da -= n; if (da < -n / 2) da += n; cx.ang += da * Math.min(1, dt * 16); cx.ang = ((cx.ang % n) + n) % n;
      g.fillStyle = '#2E2B25'; g.beginPath(); g.arc(cxw, cyw, R + 8, 0, 7); g.fill(); g.strokeStyle = '#A6997D'; g.lineWidth = 1; g.stroke(); g.fillStyle = '#e9dcc0'; g.beginPath(); g.arc(cxw, cyw, R, 0, 7); g.fill();
      g.fillStyle = '#2b2214'; g.beginPath(); g.arc(cxw, cyw, R * .72, 0, 7); g.fill();
      const step = Math.PI * 2 / n;
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * step; text(g, d.al[i], cxw + Math.cos(a) * R * .86, cyw + Math.sin(a) * R * .86, { s: Math.min(R * .13, 18), w: 800, c: '#2a1f10' }); g.strokeStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.moveTo(cxw + Math.cos(a + step / 2) * R * .74, cyw + Math.sin(a + step / 2) * R * .74); g.lineTo(cxw + Math.cos(a + step / 2) * R, cyw + Math.sin(a + step / 2) * R); g.stroke(); }
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i + cx.ang) * step; text(g, d.al[i], cxw + Math.cos(a) * R * .6, cyw + Math.sin(a) * R * .6, { s: Math.min(R * .12, 16), w: 800, c: i === 0 ? COL.amber : '#f3e6c8' }); }
      g.fillStyle = '#ffb347'; g.beginPath(); g.moveTo(cxw, cyw - R - 10); g.lineTo(cxw - 7, cyw - R - 22); g.lineTo(cxw + 7, cyw - R - 22); g.closePath(); g.fill();
      g.fillStyle = '#3a2c18'; g.beginPath(); g.arc(cxw, cyw, R * .38, 0, 7); g.fill(); text(g, t('wheel.shift'), cxw, cyw - R * .1, { s: Math.max(9, R * .07), c: '#c9b48a' }); text(g, String(cx.ui.rot), cxw, cyw + R * .12, { s: R * .2, w: 800, c: COL.amber });
      // etiqueta cifrada y baterías
      // en horizontal, el panel (etiqueta + baterías) va en la franja libre a la derecha de la rueda
      const pl = cxw + R + 18, px = land ? (pl + w - 10) / 2 : w / 2, pw = land ? Math.max(120, w - 10 - pl) : w * .8;
      const bwL = Math.min(54, pw / 4.5, h * .36 / 1.9), py = land ? Math.max(10, h / 2 - (58 + bwL * 1.9) / 2) : 14;
      g.strokeStyle = '#d33'; g.lineWidth = 6; g.beginPath(); g.moveTo(px - pw / 2 - (land ? 4 : 20), py + 18); g.lineTo(px + pw / 2 + (land ? 4 : 20), py + 18); g.stroke();
      plate(g, px - pw * .4, py, pw * .8, 40, { top: '#f6f0dd', bot: '#e3d8bc', edge: 'rgba(0,0,0,.3)', rivets: false }); text(g, d.ct, px, py + 21, { s: Math.min(22, pw * .8 / d.ct.length * 1.3), w: 800, c: '#2a1f10', ls: 3 });
      const by = py + 58, bw = land ? bwL : Math.min(54, pw / 4.5, (topP - 82) / 1.9);
      d.bats.forEach((b, i) => { const x = px + (i - 1) * bw * 1.6 - bw / 2; g.fillStyle = '#222'; rrect(g, x, by, bw, bw * 1.9, 6); g.fill(); g.fillStyle = '#444'; g.fillRect(x + bw * .3, by - 6, bw * .4, 7); for (let k = 0; k < 5; k++) { g.fillStyle = k < b ? '#7dff9a' : 'rgba(255,255,255,.08)'; rrect(g, x + 5, by + bw * 1.9 - 8 - (k + 1) * (bw * 1.9 - 10) / 5, bw - 10, (bw * 1.9 - 10) / 5 - 4, 3); g.fill(); } });
    },
    angAt(cx, x, y) { return Math.atan2(y - cx.W.y, x - cx.W.x); },
    down(cx, x, y) { const W = cx.W; const r = Math.hypot(x - W.x, y - W.y); if (r < W.R * 1.05) { cx.drag = { a: this.angAt(cx, x, y), acc: 0 }; } },
    move(cx, x, y) { if (!cx.drag) return; const a = this.angAt(cx, x, y); let da = a - cx.drag.a; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; cx.drag.a = a; cx.drag.acc += da; const st = Math.PI * 2 / cx.d.al.length; while (cx.drag.acc > st / 2) { this.step(cx, 1); cx.drag.acc -= st; } while (cx.drag.acc < -st / 2) { this.step(cx, -1); cx.drag.acc += st; } },
    up(cx) { cx.drag = null; },
    key(cx, e) { if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { this.step(cx, e.shiftKey ? 5 : 1); return true; } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { this.step(cx, e.shiftKey ? -5 : -1); return true; } },
  };

  // ================= EN·2 · Tableros de carga =================
  function tap(st, c, rule, bolts) { if (bolts.includes(c)) return false; const r = Math.floor(c / 4), q = c % 4, tg = [c]; if (rule >= 2) { if (r > 0) tg.push(c - 4); if (r < 3) tg.push(c + 4); } if (rule >= 3) { if (q > 0) tg.push(c - 1); if (q < 3) tg.push(c + 1); } if (rule >= 5) { const k = { 0: 15, 15: 0, 3: 12, 12: 3 }; if (c in k) tg.push(k[c]); } for (const x of tg) if (!(rule >= 4 && bolts.includes(x))) st[x] ^= 1; return true; }
  PZ.boards = {
    init(cx) { cx.ui.b ||= cx.d.b.map(b => b.init); cx.ui.sel ??= 0; cx.pulse = [0, 0, 0, 0, 0]; },
    tools() { return [{ id: 'reset', label: t('t.reset') }]; },
    tool(cx) { cx.ui.b[cx.ui.sel] = cx.d.b[cx.ui.sel].init; cx.sfx('tap'); cx.save(); },
    solved(cx, i) { return !cx.ui.b[i].includes('0'); },
    draw(g, cx, tm, dt) {
      const { w, h, d } = cx; bg(g, w, h, '#3a1d08'); cx.hits = [];
      const tw = Math.min(84, (w - 30) / 5), th = tw * 1.15; const x0 = (w - tw * 5 - 4 * 6) / 2;
      d.b.forEach((b, i) => {
        const x = x0 + i * (tw + 6), y = 10, sel = cx.ui.sel === i, ok = this.solved(cx, i); plate(g, x, y, tw, th, { top: sel ? '#3a2a12' : '#2E2B25', bot: '#1E1C18', edge: '#A6997D', glow: sel ? COL.amber : ok ? '#7dff9a' : null, rivets: false });
        g.fillStyle = '#0a0703'; rrect(g, x + 8, y + 8, tw - 16, th * .44, 5); g.fill(); if (ok) text(g, b.L, x + tw / 2, y + 8 + th * .22, { s: th * .34, w: 800, c: '#7dff9a', glow: '#7dff9a' });
        const ms = (tw - 20) / 4; for (let c = 0; c < 16; c++) { g.fillStyle = cx.ui.b[i][c] === '1' ? COL.amber : 'rgba(255,255,255,.1)'; g.fillRect(x + 10 + (c % 4) * ms, y + th * .56 + Math.floor(c / 4) * ms * .82, ms - 2, ms * .82 - 2); }
        text(g, String(i + 1), x + tw - 10, y + 10, { s: 9, c: COL.dim });
        cx.hits.push({ x, y, w: tw, h: th, sel: i });
      });
      const i = cx.ui.sel, b = d.b[i]; const top = 20 + th + 12;
      // reglas como iconos acumulados
      const icon = (k, x, y, s) => { g.strokeStyle = COL.amber; g.fillStyle = COL.amber; g.lineWidth = 2; g.beginPath(); if (k === 1) { g.arc(x, y, s * .22, 0, 7); g.fill(); } else if (k === 2) { g.moveTo(x, y - s * .45); g.lineTo(x, y + s * .45); g.moveTo(x - s * .18, y - s * .27); g.lineTo(x, y - s * .45); g.lineTo(x + s * .18, y - s * .27); g.moveTo(x - s * .18, y + s * .27); g.lineTo(x, y + s * .45); g.lineTo(x + s * .18, y + s * .27); g.stroke(); } else if (k === 3) { g.moveTo(x - s * .45, y); g.lineTo(x + s * .45, y); g.moveTo(x - s * .27, y - s * .18); g.lineTo(x - s * .45, y); g.lineTo(x - s * .27, y + s * .18); g.moveTo(x + s * .27, y - s * .18); g.lineTo(x + s * .45, y); g.lineTo(x + s * .27, y + s * .18); g.stroke(); } else if (k === 4) { g.arc(x, y, s * .32, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x - s * .2, y); g.lineTo(x + s * .2, y); g.stroke(); } else { g.rect(x - s * .4, y - s * .4, s * .8, s * .8); g.stroke(); g.beginPath(); g.moveTo(x - s * .4, y - s * .4); g.lineTo(x + s * .4, y + s * .4); g.stroke(); } };
      const rs = 26, rw = b.rule * (rs + 70); let rx = w / 2 - Math.min(rw, w - 20) / 2;
      const compact = rw > w - 20;
      for (let k = 1; k <= b.rule; k++) { icon(k, rx + rs / 2, top + rs / 2, rs); if (!compact) text(g, t('rule.' + k), rx + rs + 4, top + rs / 2, { s: 10, a: 'left', c: '#e6c58f' }); rx += compact ? rs + 10 : rs + 70; }
      const S = Math.min(w - 40, h - top - rs - 30), bx = (w - S) / 2, by = top + rs + 14, c = S / 4; cx.B = { x: bx, y: by, c };
      const ok = this.solved(cx, i); plate(g, bx - 8, by - 8, S + 16, S + 16, { top: '#2E2B25', bot: '#1E1C18', edge: '#A6997D', glow: ok ? '#7dff9a' : null });
      for (let q = 0; q < 16; q++) { const x = bx + (q % 4) * c, y = by + Math.floor(q / 4) * c, on = cx.ui.b[i][q] === '1'; g.fillStyle = on ? (ok ? '#7dff9a' : COL.amber) : '#2a1e10'; rrect(g, x + 4, y + 4, c - 8, c - 8, 8); g.fill(); if (on) { g.save(); g.globalAlpha = .4; glow(g, x + c / 2, y + c / 2, c * .6, ok ? '#7dff9a' : COL.amber); g.restore(); } if (b.bolts.includes(q)) { g.fillStyle = '#9aa2b8'; g.beginPath(); g.arc(x + c / 2, y + c / 2, c * .16, 0, 7); g.fill(); g.strokeStyle = '#333'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + c / 2 - c * .1, y + c / 2); g.lineTo(x + c / 2 + c * .1, y + c / 2); g.stroke(); } }
    },
    down(cx, x, y) {
      const tb = (cx.hits || []).find(r => inR(x, y, r)); if (tb) { cx.ui.sel = tb.sel; cx.sfx('tap'); cx.save(); return; }
      const B = cx.B; if (!B) return; const q = Math.floor((x - B.x) / B.c), r = Math.floor((y - B.y) / B.c); if (q < 0 || q > 3 || r < 0 || r > 3) return;
      const i = cx.ui.sel, b = cx.d.b[i]; const st = [...cx.ui.b[i]].map(Number); const was = this.solved(cx, i); if (!tap(st, r * 4 + q, b.rule, b.bolts)) { cx.sfx('wrong'); return; }
      cx.ui.b[i] = st.join(''); cx.sfx('toggle', 1); cx.vib(6);
      if (!was && this.solved(cx, i)) { cx.sfx('mid'); cx.vib([20, 30, 20]); const nx = cx.d.b.findIndex((_, k) => !this.solved(cx, k)); if (nx >= 0) setTimeout(() => { if (cx.ui.sel === i) cx.ui.sel = nx; }, 900); }
      cx.save();
    },
    key(cx, e) { const k = '12345'.indexOf(e.key); if (k >= 0) { cx.ui.sel = k; return true; } },
  };

  // ================= EN·3 · Remaches (Braille) =================
  PZ.braille = {
    init(cx) { cx.ui.sign ??= false; cx.lp = null; cx.lastR = -1; },
    tools(cx) { return [{ id: 'sign', label: t('t.sign'), on: cx.ui.sign }]; },
    tool(cx) { cx.ui.sign = !cx.ui.sign; cx.sfx('tap'); },
    draw(g, cx, tm) {
      const { w, h, d } = cx; bg(g, w, h, '#3a1d08'); const word = [...d.w]; const n = word.length;
      const rows = (w < h && n > 5) ? 2 : 1, per = Math.ceil(n / rows);
      const unit = Math.min((w - 40) / (per * 3.4 + 2), (h - 40) / (rows * 4.6 + 1)); const gx = (w - (per * 3.4 + 2) * unit) / 2, gy = (h - (rows * 4.6 + 1) * unit) / 2;
      plate(g, gx - unit * .4, gy - unit * .4, (per * 3.4 + 2) * unit + unit * .8, (rows * 4.6 + 1) * unit + unit * .8, { top: '#1F262E', bot: '#141A20', edge: '#3C485C' }); // VIS-04: marco oscuro mate; puntos Braille intactos
      const L = cx.lp, R = Math.max(54, Math.min(w, h) * .16); cx.riv = [];
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / per), col = i % per; const ox = gx + unit * 1.3 + col * 3.4 * unit, oy = gy + unit * 1.1 + row * 4.6 * unit; const pat = C.braille[word[i]] || '';
        for (let k = 0; k < 6; k++) { const dx = k < 3 ? 0 : 1, dy = k % 3; const x = ox + dx * unit * 1.25, y = oy + dy * unit * 1.25; const up = pat.includes(String(k + 1)); cx.riv.push({ x, y, up });
          const li = L ? Math.max(0, 1 - Math.hypot(x - L.x, y - L.y) / R) : 0;
          g.fillStyle = '#6a707e'; g.beginPath(); g.arc(x, y, unit * .32, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x + unit * .06, y + unit * .07, unit * .3, 0, 7); g.fill(); g.fillStyle = '#7d8392'; g.beginPath(); g.arc(x, y, unit * .26, 0, 7); g.fill();
          if (up && li > 0) { const lx = L.x - x, ly = L.y - y, ll = Math.hypot(lx, ly) || 1; g.fillStyle = `rgba(0,0,0,${.5 * li})`; g.beginPath(); g.ellipse(x - lx / ll * unit * .2, y - ly / ll * unit * .2, unit * .36, unit * .36, 0, 0, 7); g.fill(); const gr = g.createRadialGradient(x + lx / ll * unit * .1, y + ly / ll * unit * .1, 0, x, y, unit * .36); gr.addColorStop(0, `rgba(255,250,235,${li})`); gr.addColorStop(1, `rgba(150,156,170,${li * .9})`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, unit * .34, 0, 7); g.fill(); }
        }
      }
      if (L) { const gr = g.createRadialGradient(L.x, L.y, 0, L.x, L.y, R); gr.addColorStop(0, 'rgba(255,240,200,.12)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.beginPath(); g.arc(L.x, L.y, R, 0, 7); g.fill(); }
      else text(g, cx.lang === 'en' ? 'Sweep the light over the casing' : 'Pasa la luz por la carcasa', w / 2, h - 18, { s: 12, c: COL.dim, f: 'pop', w: 500 });
      if (cx.ui.sign) signBraille(g, cx, w, h);
    },
    move(cx, x, y) { cx.lp = { x, y }; const hit = (cx.riv || []).findIndex(r => r.up && Math.hypot(r.x - x, r.y - y) < 10); if (hit >= 0 && hit !== cx.lastR) { cx.sfx('rivet'); cx.vib(8); } cx.lastR = hit; },
    down(cx, x, y) { this.move(cx, x, y); }, hover(cx, x, y) { this.move(cx, x, y); },
  };
  function signBraille(g, cx, w, h) {
    const al = cx.lang === 'en' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'; const cols = w > h ? 9 : 7, rows = Math.ceil(al.length / cols); const bw = Math.min(56, (w - 24) / cols), bh = bw * 1.15;
    const x0 = (w - cols * bw) / 2, y0 = Math.max(6, (h - rows * bh - 26) / 2); plate(g, x0 - 8, y0 - 4, cols * bw + 16, rows * bh + 30, { top: '#f2ecdb', bot: '#ddd3ba', edge: 'rgba(0,0,0,.3)' }); text(g, t('sign.braille'), w / 2, y0 + 10, { s: 10, c: '#5a4a2a', w: 700, ls: 2 });
    [...al].forEach((ch, i) => { const x = x0 + (i % cols) * bw, y = y0 + 22 + Math.floor(i / cols) * bh; const p = C.braille[ch]; for (let k = 0; k < 6; k++) { const dx = k < 3 ? 0 : 1, dy = k % 3; g.fillStyle = p.includes(String(k + 1)) ? '#2a1f10' : 'rgba(0,0,0,.12)'; g.beginPath(); g.arc(x + bw * .3 + dx * bw * .2, y + bh * .14 + dy * bh * .16, bw * .06, 0, 7); g.fill(); } text(g, ch, x + bw * .78, y + bh * .3, { s: bw * .26, w: 800, c: '#2a1f10' }); });
  }

  // ================= EN·4 · Capacitor (Morse) =================
  PZ.morse = {
    init(cx) { cx.ui.slow ??= false; cx.ui.sign ??= false; cx.ui.heard ??= false; cx.lit = 0; cx.shown = ''; cx.timers = []; },
    tools(cx) { return [{ id: 'play', label: '▶ ' + t('t.play') }, { id: 'slow', label: t('t.slow'), on: cx.ui.slow }, { id: 'sign', label: t('t.sign'), on: cx.ui.sign }]; },
    tool(cx, id) { if (id === 'play') this.play(cx); else { cx.ui[id] = !cx.ui[id]; cx.sfx('tap'); cx.save(); } },
    code(cx) { return [...cx.d.w].map(ch => C.morse[ch]); },
    play(cx) {
      this.leave(cx); const k = cx.ui.slow ? 1.67 : 1, U = 120 * k; let tt = 200; cx.shown = '';
      this.code(cx).forEach((cd, li) => { [...cd].forEach(s => { const dur = s === '.' ? U : U * 3; cx.timers.push(setTimeout(() => { cx.lit = performance.now() + dur; cx.sfx('morse', dur / 1000); cx.vib(dur); cx.shown += s === '.' ? '•' : '—'; }, tt)); tt += dur + U; }); tt += U * 4; cx.timers.push(setTimeout(() => { cx.shown += '  /  '; }, tt - U * 3)); });
      cx.timers.push(setTimeout(() => { cx.ui.heard = true; cx.save(); }, tt));
    },
    leave(cx) { (cx.timers || []).forEach(clearTimeout); cx.timers = []; },
    draw(g, cx, tm) {
      const { w, h } = cx; bg(g, w, h, '#3a1d08'); const lit = performance.now() < cx.lit;
      const R = Math.min(w, h) * .2, x = w / 2, y = h * .38;
      g.fillStyle = '#2b2f3a'; rrect(g, x - R * .9, y - R * 1.1, R * 1.8, R * 2.1, 18); g.fill(); g.fillStyle = '#d6dae6'; rrect(g, x - R * .7, y - R * .9, R * 1.4, R * 1.5, 14); g.fill(); text(g, '470 µF', x, y + R * .45, { s: Math.max(10, R * .14), c: '#3a3f4e' });
      for (let i = -1; i <= 1; i += 2) { g.fillStyle = '#9aa0b0'; g.fillRect(x + i * R * .35 - 3, y + R * 1, 6, R * .4); }
      if (lit) glow(g, x, y - R * .25, R * 2.4, '#fff1b8', 1);
      g.fillStyle = lit ? '#fff7d6' : '#4a3b20'; g.beginPath(); g.arc(x, y - R * .25, R * .28, 0, 7); g.fill();
      const strip = cx.ui.heard ? this.code(cx).map(c => c.replace(/\./g, '•').replace(/-/g, '—')).join('  /  ') : cx.shown;
      plate(g, 14, h - 78, w - 28, 62, { top: '#141018', bot: '#0b090f', rivets: false }); const fs = Math.min(20, fit(g, strip || '·', w - 50, 20));
      text(g, strip || (cx.lang === 'en' ? 'Press Play' : 'Pulsa Reproducir'), w / 2, h - 47, { s: fs, w: 700, c: strip ? '#ffe9a8' : COL.dim });
      if (cx.ui.sign) {
        const al = cx.lang === 'en' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'; const cols = w > h ? 7 : 4, rows = Math.ceil(al.length / cols); const bw = Math.min(110, (w - 24) / cols), bh = Math.min(30, (h - 60) / rows);
        const x0 = (w - cols * bw) / 2, y0 = Math.max(6, (h - rows * bh - 30) / 2); plate(g, x0 - 8, y0 - 4, cols * bw + 16, rows * bh + 32, { top: '#f2ecdb', bot: '#ddd3ba', edge: 'rgba(0,0,0,.3)' }); text(g, t('sign.morse'), w / 2, y0 + 10, { s: 10, c: '#5a4a2a', w: 700, ls: 2 });
        [...al].forEach((ch, i) => { const xx = x0 + (i % cols) * bw, yy = y0 + 26 + Math.floor(i / cols) * bh + bh / 2; text(g, ch, xx + 14, yy, { s: Math.min(15, bh * .6), w: 800, c: '#2a1f10' }); text(g, C.morse[ch].replace(/\./g, '•').replace(/-/g, '—'), xx + 28, yy, { s: Math.min(13, bh * .55), w: 700, c: '#5a3a10', a: 'left' }); });
      }
    },
    key(cx, e) { if (e.key === ' ') { this.play(cx); return true; } },
  };

  // ================= Meta EN · Cuadro principal (segmentos) =================
  PZ.segments = {
    init(cx) { cx.ui.ins ||= [false, false, false, false]; },
    tools() { return [{ id: 'reset', label: t('t.reset') }]; },
    tool(cx) { cx.ui.ins = [false, false, false, false]; cx.sfx('tap'); cx.save(); },
    draw(g, cx, tm) {
      const { w, h, d } = cx; bg(g, w, h, '#3a1d08'); const land = w > h;
      // 5 displays de ancho .9·dw separados 1,15·dw: el bloque mide 5,5·dw y la placa lo envuelve entero
      const dw = Math.min((w - 52) / 5.5, h * .3), dh = dw * 1.7, x0 = (w - dw * 5.5) / 2, y0 = land ? h * .1 : h * .12;
      plate(g, x0 - 14, y0 - 14, dw * 5.5 + 28, dh + 28, { top: '#141010', bot: '#0a0808' });
      const lit = [{}, {}, {}, {}, {}]; d.parts.forEach((p, f) => { if (cx.ui.ins[f]) p.forEach(([di, s]) => lit[di][s] = '#ffcc66'); });
      for (let i = 0; i < 5; i++) seg9(g, x0 + i * dw * 1.15, y0, dw * .9, dh, lit[i], '#ffcc66', 'rgba(255,255,255,.05)');
      // ranuras con forma
      const sy = y0 + dh + 50, sw = Math.min(90, (w - 40) / 4.4); cx.hits = [];
      for (let f = 0; f < 4; f++) {
        const x = w / 2 + (f - 1.5) * sw * 1.2 - sw / 2, own = cx.owned(f), ins = cx.ui.ins[f];
        plate(g, x, sy, sw, sw * 1.15, { top: ins ? '#3a2a12' : '#2E2B25', bot: '#1E1C18', edge: '#A6997D', glow: ins ? COL.amber : null });
        fuseShape(g, f, x + sw / 2, sy + sw * .45, sw * .55, ins ? COL.amber : 'rgba(255,255,255,.25)', ins);
        text(g, ins ? '◉' : own ? (cx.lang === 'en' ? 'insert' : 'insertar') : t('frag.missing'), x + sw / 2, sy + sw * .98, { s: 10, c: own ? (ins ? COL.amber : COL.ink) : COL.dim });
        cx.hits.push({ x, y: sy, w: sw, h: sw * 1.15, f });
      }
      if (!cx.ui.ins.some(Boolean)) text(g, t('fuse.insert'), w / 2, Math.min(h - 14, sy + sw * 1.15 + 22), { s: 12, c: COL.dim, f: 'pop', w: 500 });
    },
    down(cx, x, y) { const hh = (cx.hits || []).find(r => inR(x, y, r)); if (!hh) return; if (!cx.owned(hh.f)) { cx.sfx('wrong'); cx.toast(t('frag.missing')); return; } cx.ui.ins[hh.f] = !cx.ui.ins[hh.f]; cx.sfx(cx.ui.ins[hh.f] ? 'door' : 'tap'); cx.vib(15); cx.save(); },
  };
  window.PZU = { box, inR, SYM, maskSyms, signBraille };
})();
