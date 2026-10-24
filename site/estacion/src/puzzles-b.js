// JET//Estación Silencio · enigmas: Comunicaciones y Navegación.
'use strict';
(() => {
  const { COL, RAINBOW, rrect, plate, text, fit, glow, bg, font5, star, picto } = DR;
  const { inR } = PZU;
  const t = (k, v) => I18N.t(k, v);
  const HUMF = [62, 69, 72, 71].map(m => 440 * Math.pow(2, (m - 69) / 12));
  const KEYF = [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19].map(s => 440 * Math.pow(2, (57 + s - 69) / 12));

  // ================= CO·1 · Espectro =================
  PZ.spectro = {
    init(cx) { cx.ui.f ??= .82; cx.img = null; cx.key = ''; cx.play = -1; },
    tools() { return [{ id: 'play', label: '▶ ' + t('t.play') }]; },
    tool(cx) { cx.play = 0; cx.sfx('static', 2.2); },
    build(cx, W, H) {
      const d = cx.d; const cols = Math.max(120, [...d.w].length * 7 + 10), rows = 72; const c = document.createElement('canvas'); c.width = cols; c.height = rows; const g = c.getContext('2d'); const im = g.createImageData(cols, rows);
      const r = CORE.mulberry32(d.seed); const noise = Array.from({ length: cols * rows }, () => r());
      const sig = new Float32Array(cols * rows); const lo = d.band[0], hi = d.band[1];
      const y0 = Math.round((1 - hi) * rows), hh = Math.round((hi - lo) * rows); const px = Math.max(1, Math.floor(hh / 7));
      [...d.w].forEach((ch, i) => { const b = DR.FONT5[ch]; if (!b) return; for (let k = 0; k < 35; k++) if (b[k] === '1') { const x0 = 5 + i * 7 + (k % 5), yy = y0 + Math.floor(k / 5) * px; for (let q = 0; q < px; q++) sig[(yy + q) * cols + x0] = 1; } });
      const f = cx.ui.f, wd = .3, wlo = f - wd / 2, whi = f + wd / 2; const ov = Math.max(0, Math.min(hi, whi) - Math.max(lo, wlo)) / (hi - lo);
      for (let y = 0; y < rows; y++) { const fr = 1 - y / rows; const inW = fr >= wlo && fr <= whi; for (let x = 0; x < cols; x++) { const i = y * cols + x; const nz = noise[i] * (0.95 - 0.8 * ov); let v = (sig[i] * 0.85 + nz * 0.9); v *= inW ? 1 : 0.12; const k = Math.min(1, v); im.data[i * 4] = 20 + k * 40; im.data[i * 4 + 1] = 30 + k * 225; im.data[i * 4 + 2] = 60 + k * 170; im.data[i * 4 + 3] = 255; } }
      g.putImageData(im, 0, 0); cx.img = c;
    },
    draw(g, cx, tm, dt) {
      const { w, h } = cx; bg(g, w, h, '#063a36'); const key = cx.ui.f.toFixed(3); if (key !== cx.key) { this.build(cx); cx.key = key; }
      const sx = 46, sy = 16, sw = w - sx - 60, sh = h - 70; cx.F = { x: w - 54, y: sy, w: 48, h: sh };
      plate(g, sx - 6, sy - 6, sw + 12, sh + 12, { top: '#06100f', bot: '#030807', rivets: false }); g.imageSmoothingEnabled = false; g.drawImage(cx.img, sx, sy, sw, sh); g.imageSmoothingEnabled = true;
      text(g, 'Hz', sx - 22, sy + 8, { s: 10, c: COL.dim }); text(g, cx.lang === 'en' ? 'time →' : 'tiempo →', sx + sw - 30, sy + sh + 16, { s: 10, c: COL.dim });
      // filtro de banda (deslizador vertical a la derecha)
      const F = cx.F; g.fillStyle = 'rgba(255,255,255,.06)'; rrect(g, F.x + 16, F.y, 16, F.h, 8); g.fill();
      const cy = F.y + (1 - cx.ui.f) * F.h, bh = .3 * F.h; g.fillStyle = 'rgba(0,242,207,.25)'; rrect(g, F.x + 8, cy - bh / 2, 32, bh, 8); g.fill(); g.strokeStyle = COL.cy; g.lineWidth = 2; g.stroke();
      g.fillStyle = 'rgba(0,242,207,.08)'; g.fillRect(sx, cy - bh / 2 * (sh / F.h), sw, bh * (sh / F.h));
      text(g, cx.lang === 'en' ? 'FILTER' : 'FILTRO', F.x + 24, F.y + F.h + 14, { s: 9, c: COL.cy, w: 700 });
      if (cx.play >= 0) { cx.play += dt / 2.2; const x = sx + sw * cx.play; g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(x, sy); g.lineTo(x, sy + sh); g.stroke(); if (cx.play > 1) cx.play = -1; }
    },
    setF(cx, y) { const F = cx.F; cx.ui.f = Math.max(.15, Math.min(.85, 1 - (y - F.y) / F.h)); if (Math.random() < .3) cx.sfx('static', .08); },
    down(cx, x, y) { if (x > cx.F.x - 20) { cx.drag = 1; this.setF(cx, y); } },
    move(cx, x, y) { if (cx.drag) this.setF(cx, y); }, up(cx) { cx.drag = 0; cx.save(); },
    key(cx, e) { if (e.key === 'ArrowUp') cx.ui.f = Math.min(.85, cx.ui.f + (e.shiftKey ? .1 : .01)); else if (e.key === 'ArrowDown') cx.ui.f = Math.max(.15, cx.ui.f - (e.shiftKey ? .1 : .01)); else return; return true; },
  };

  // ================= CO·2 · Teclado de tonos =================
  PZ.keypad = {
    init(cx) { cx.hl = -1; cx.hlT = 0; cx.cur = -1; cx.timers = []; },
    tools() { return [{ id: 'play', label: '▶ ' + t('t.play') }]; },
    tool(cx) { this.play(cx); },
    leave(cx) { (cx.timers || []).forEach(clearTimeout); cx.timers = []; },
    play(cx) { this.leave(cx); let tt = 150; cx.d.seq.forEach(([k, n], gi) => { for (let r = 0; r < n; r++) { cx.timers.push(setTimeout(() => { cx.cur = gi; cx.sfx('tone', KEYF[cx.d.pitch[k]]); cx.pulse = performance.now(); }, tt)); tt += 320; } tt += 520; }); cx.timers.push(setTimeout(() => cx.cur = -1, tt)); },
    draw(g, cx, tm) {
      const { w, h, d } = cx; bg(g, w, h, '#063a36'); const land = w > h; cx.hits = [];
      // secuencia (barras + repeticiones), siempre visible
      const sq = d.seq, sh = land ? h * .3 : h * .22, sx0 = 14, sw = land ? w * .42 : w - 28, sy0 = land ? (h - sh) / 2 : 10; plate(g, sx0, sy0, sw, sh, { top: '#06201d', bot: '#03100e', rivets: false });
      text(g, cx.lang === 'en' ? 'SEQUENCE' : 'SECUENCIA', sx0 + 12, sy0 + 14, { s: 10, a: 'left', c: COL.cy, w: 700, ls: 1 });
      // teclado 3×4 (se calcula antes para que secuencia y teclas compartan la misma escala de altura)
      const kx = land ? w * .5 : 14, ky = land ? 10 : sh + 22, kw = land ? w * .5 - 14 : w - 28, kh = h - ky - 10; const bw = kw / 3, bh = kh / 4;
      const U = Math.max(3, Math.min(sh - 50, bh - 22) / 12); // una altura de tono = un segmento, igual en los dos paneles
      const meter = (x, base, wd, lv, col) => { if (U < 6) { g.fillStyle = col; rrect(g, x, base - lv * U, wd, lv * U, 2); g.fill(); return; } for (let k = 0; k < lv; k++) { g.fillStyle = col; rrect(g, x, base - (k + 1) * U + 1, wd, U - 2, Math.min(3, U / 3)); g.fill(); } };
      const gw = Math.min(56, (sw - 20) / sq.length);
      sq.forEach(([k, n], i) => { const x = sx0 + 10 + i * gw + gw / 2, base = sy0 + sh - 22; const on = cx.cur === i; meter(x - gw * .28, base, gw * .56, d.pitch[k] + 1, on ? COL.cy : 'rgba(0,242,207,.5)'); for (let r = 0; r < n; r++) { g.fillStyle = on ? '#fff' : COL.dim; g.beginPath(); g.arc(x - (n - 1) * 5 + r * 10, base + 10, 3.2, 0, 7); g.fill(); } });
      d.keys.forEach((ks, i) => { const x = kx + (i % 3) * bw, y = ky + Math.floor(i / 3) * bh; const on = cx.hl === i && performance.now() - cx.hlT < 400; plate(g, x + 3, y + 3, bw - 6, bh - 6, { top: on ? '#0b4a42' : '#0c1c1a', bot: '#071110', rivets: false, glow: on ? COL.cy : null });
        text(g, ks.split('').join(' '), x + bw * .42, y + bh / 2, { s: Math.min(22, bh * .3, bw * .17), w: 800, c: COL.ink }); meter(x + bw - 24, y + bh - 10, 12, d.pitch[i] + 1, on ? COL.cy : 'rgba(0,242,207,.45)');
        cx.hits.push({ x, y, w: bw, h: bh, i }); });
    },
    down(cx, x, y) { const k = (cx.hits || []).find(r => inR(x, y, r)); if (k) { cx.hl = k.i; cx.hlT = performance.now(); cx.sfx('tone', KEYF[cx.d.pitch[k.i]]); cx.vib(6); } },
  };

  // ================= CO·3 · Dial =================
  PZ.dial = {
    init(cx) { cx.ui.f ??= 88.2; cx.ui.found ||= []; cx.lock = null; cx.tick = 0; },
    num(cx, n) { return (cx.lang === 'en' ? ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'] : ['UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO'])[n - 1]; },
    draw(g, cx, tm, dt) {
      const { w, h, d } = cx; bg(g, w, h, '#063a36'); const f = cx.ui.f;
      const st = d.st.find(s => Math.abs(s.f - f) < .12) || null;
      if (st !== cx.lock) { cx.lock = st; if (st) { cx.sfx('tone', 880); cx.vib(12); if (!cx.ui.found.includes(st.f)) { cx.ui.found.push(st.f); cx.save(); } } }
      cx.tick += dt; if (!st && cx.tick > .45 && cx.moving) { cx.tick = 0; cx.sfx('static', .3); } if (st && cx.tick > .9) { cx.tick = 0; cx.sfx('tone', 660); }
      // lectura de frecuencia
      plate(g, w / 2 - 110, 12, 220, 70, { top: '#03120f', bot: '#020807' }); text(g, f.toFixed(1), w / 2 - 12, 47, { s: 34, w: 800, c: st ? COL.cy : '#7ab' }); text(g, 'MHz', w / 2 + 70, 52, { s: 12, c: COL.dim });
      // escala del dial
      const dx = 24, dw = w - 48, dy = h * .34, dh = 54; cx.D = { x: dx, y: dy - 30, w: dw, h: dh + 60 };
      plate(g, dx - 6, dy - 6, dw + 12, dh + 12, { top: '#d9cfae', bot: '#c2b58c', edge: 'rgba(0,0,0,.4)', rivets: false });
      for (let m = 88; m <= 108; m += 0.5) { const x = dx + (m - 88) / 20 * dw, big = m % 2 === 0; g.strokeStyle = '#3a2e18'; g.lineWidth = big ? 2 : 1; g.beginPath(); g.moveTo(x, dy + dh); g.lineTo(x, dy + dh - (big ? 18 : 9)); g.stroke(); if (big && (w > 500 || m % 4 === 0)) text(g, String(m), x, dy + 14, { s: 11, c: '#3a2e18', w: 700 }); }
      const nx = dx + (f - 88) / 20 * dw; g.strokeStyle = '#d81b4a'; g.lineWidth = 3; g.beginPath(); g.moveTo(nx, dy - 8); g.lineTo(nx, dy + dh + 8); g.stroke(); g.fillStyle = '#d81b4a'; g.beginPath(); g.arc(nx, dy + dh + 12, 7, 0, 7); g.fill();
      // subtítulo de la baliza
      const by = dy + dh + 40; plate(g, 16, by, w - 32, 70, { top: '#06201d', bot: '#03100e', rivets: false });
      if (st) { const s = `«${st.w}… ${this.num(cx, st.n)}»`; text(g, s, w / 2, by + 30, { s: Math.min(24, fit(g, s, w - 60, 24)), w: 800, c: '#e8fff8' }); text(g, `[${cx.lang === 'en' ? 'tonal voice' : 'voz tonal'} · ${st.n}]`, w / 2, by + 54, { s: 11, c: COL.dim }); for (let k = 0; k < 18; k++) { const bh = 6 + Math.abs(Math.sin(tm * 9 + k)) * 18; g.fillStyle = 'rgba(0,242,207,.35)'; g.fillRect(24 + k * 6, by + 35 - bh / 2, 3, bh); } }
      else text(g, t('dial.static'), w / 2, by + 35, { s: 15, c: COL.dim });
      // balizas captadas
      const fy = by + 84; if (cx.ui.found.length && fy < h - 20) { text(g, cx.lang === 'en' ? 'BEACONS FOUND' : 'BALIZAS CAPTADAS', 18, fy, { s: 10, a: 'left', c: COL.cy, w: 700 }); cx.ui.found.slice().sort((a, b) => a - b).forEach((fr, i) => { const s = d.st.find(x => x.f === fr); const col = Math.floor(i / 3), row = i % 3; const yy = fy + 18 + row * 20; if (yy < h - 6) text(g, `${fr.toFixed(1)}  ${s.w} · ${s.n}`, 18 + col * Math.max(150, w / 3), yy, { s: 12, a: 'left', c: COL.ink }); }); }
    },
    setF(cx, x) { const D = cx.D; cx.ui.f = Math.round(Math.max(88, Math.min(108, 88 + (x - D.x) / D.w * 20)) * 10) / 10; },
    down(cx, x, y) { if (inR(x, y, cx.D)) { cx.drag = 1; cx.moving = 1; this.setF(cx, x); } },
    move(cx, x) { if (cx.drag) this.setF(cx, x); }, up(cx) { cx.drag = 0; cx.moving = 0; cx.save(); },
    key(cx, e) { if (e.key === 'ArrowRight') cx.ui.f = Math.min(108, Math.round((cx.ui.f + (e.shiftKey ? 1 : .1)) * 10) / 10); else if (e.key === 'ArrowLeft') cx.ui.f = Math.max(88, Math.round((cx.ui.f - (e.shiftKey ? 1 : .1)) * 10) / 10); else return; cx.moving = 1; setTimeout(() => cx.moving = 0, 300); return true; },
  };

  // ================= CO·4 · Ecos (rebus sonoro) =================
  PZ.echoes = {
    init(cx) { cx.cur = -1; cx.timers = []; cx.ui.show ??= false; },
    tools(cx) { return [{ id: 'play', label: '▶ ' + t('t.play') }, { id: 'show', label: t('t.sound'), on: cx.ui.show || CORE.P.a11yAudio }]; },
    tool(cx, id) { if (id === 'play') this.play(cx); else { cx.ui.show = !cx.ui.show; cx.sfx('tap'); cx.save(); } },
    leave(cx) { (cx.timers || []).forEach(clearTimeout); cx.timers = []; },
    play(cx) { this.leave(cx); cx.d.seq.forEach((s, i) => cx.timers.push(setTimeout(() => { cx.cur = i; cx.sfx('echo', s); cx.vib(10); }, 200 + i * 1250))); cx.timers.push(setTimeout(() => { cx.cur = -1; cx.ui.heard = true; cx.save(); }, 200 + cx.d.seq.length * 1250)); },
    draw(g, cx, tm) {
      const { w, h, d } = cx; bg(g, w, h, '#063a36'); const land = w > h; const show = cx.ui.show || CORE.P.a11yAudio;
      // panel de pictogramas
      const cols = land ? 5 : 5, rows = 2; const pw = land ? w * .55 : w - 28, ph = land ? h - 30 : h * .46; const px = 14, py = land ? 15 : h - ph - 12;
      plate(g, px, py, pw, ph, { top: '#efe8d6', bot: '#d8cfb6', edge: 'rgba(0,0,0,.3)' }); text(g, t('sign.pictos'), px + pw / 2, py + 14, { s: 10, c: '#4a3d22', w: 700, ls: 2 });
      const cw = (pw - 20) / cols, chh = (ph - 34) / rows; const curS = cx.cur >= 0 ? d.seq[cx.cur] : -1;
      d.leg.forEach((L, i) => { const x = px + 10 + (i % cols) * cw, y = py + 28 + Math.floor(i / cols) * chh; const on = curS === i; if (on) { g.fillStyle = 'rgba(0,242,207,.35)'; rrect(g, x + 2, y + 2, cw - 4, chh - 4, 8); g.fill(); }
        picto(g, i, x + cw / 2, y + chh * .38, Math.min(cw, chh) * .5, on ? '#004d44' : '#3a3020'); text(g, L, x + cw / 2, y + chh * .82, { s: Math.min(20, chh * .24), w: 800, c: '#1a140a' }); });
      // línea de tiempo
      const tx = land ? px + pw + 16 : 14, tw = land ? w - tx - 14 : w - 28, ty = land ? 20 : 16, th = land ? h - 40 : h - ph - 46; const n = d.seq.length;
      plate(g, tx, ty, tw, th, { top: '#06201d', bot: '#03100e', rivets: false });
      const sw2 = Math.min(64, (tw - 20) / n); const yy = ty + th / 2;
      d.seq.forEach((s, i) => { const x = tx + tw / 2 + (i - (n - 1) / 2) * sw2; const on = cx.cur === i; g.fillStyle = on ? COL.cy : 'rgba(255,255,255,.08)'; rrect(g, x - sw2 * .4, yy - sw2 * .4, sw2 * .8, sw2 * .8, 8); g.fill(); text(g, String(i + 1), x, yy - sw2 * .55, { s: 10, c: COL.dim });
        if (show && (cx.ui.heard || cx.cur >= i)) { picto(g, s, x, yy, sw2 * .5, on ? '#003' : COL.ink); text(g, '[' + t('sounds')[s] + ']', x, yy + sw2 * .62, { s: Math.min(10, sw2 * .2), c: COL.dim }); } });
      if (!cx.ui.heard && cx.cur < 0) text(g, cx.lang === 'en' ? 'Press Play' : 'Pulsa Reproducir', tx + tw / 2, ty + th - 14, { s: 12, c: COL.dim, f: 'pop', w: 500 });
    },
    key(cx, e) { if (e.key === ' ') { this.play(cx); return true; } },
  };

  // ================= Meta CO · La lira =================
  PZ.lyre = {
    init(cx) { cx.bars = {}; cx.humT = -9; },
    tools() { return [{ id: 'hum', label: '♪ ' + t('t.hum') }]; },
    tool(cx) { cx.humT = performance.now(); AU.hum(2); },
    draw(g, cx, tm) {
      const { w, h, d } = cx; bg(g, w, h, '#063a36'); const n = 8;
      // tarareo dibujado (alternativa visual permanente)
      const hw = Math.min(200, w * .45); plate(g, w - hw - 12, 10, hw, 74, { top: '#06201d', bot: '#03100e', rivets: false }); text(g, t('log.hum').toUpperCase(), w - hw, 22, { s: 9, a: 'left', c: COL.cy, w: 700 });
      const since = (performance.now() - cx.humT) / 1000; [0, 0.7, 1.4, 3.2].forEach((tt, i) => { const on = since > tt && since < tt + .7; const bh = 10 + (HUMF[i] - 280) / 260 * 40; const x = w - hw - 12 + 22 + i * (hw - 44) / 3; g.fillStyle = on ? '#fff' : COL.cy; rrect(g, x - 9, 76 - bh, 18, bh, 4); g.fill(); });
      // lira
      const lx = w * .1, lw = w * .8, top = 104, bot = h - 70; g.strokeStyle = '#c99a4a'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(lx, bot); g.quadraticCurveTo(lx - 20, top + 40, lx + 30, top); g.lineTo(lx + lw - 30, top); g.quadraticCurveTo(lx + lw + 20, top + 40, lx + lw, bot); g.stroke(); g.fillStyle = '#8a5e26'; rrect(g, lx - 6, bot - 4, lw + 12, 26, 8); g.fill();
      cx.hits = [];
      d.str.forEach((s, i) => {
        const x = lx + 26 + i * (lw - 52) / (n - 1); const tuned = s.n >= 0 && cx.owned(s.f); const b = cx.bars[i]; const age = b ? (performance.now() - b) / 1000 : 9; const vib = age < 1.2 ? Math.sin(age * 90) * 3 * (1 - age / 1.2) : 0;
        g.strokeStyle = tuned ? '#f6e3a8' : '#6b6050'; g.lineWidth = tuned ? 2.5 : 1.6; g.beginPath(); g.moveTo(x, top + 6); g.quadraticCurveTo(x + vib, (top + bot) / 2, x, bot - 4); g.stroke();
        plate(g, x - 17, bot + 26, 34, 34, { top: '#efe2c0', bot: '#d6c49a', rivets: false, edge: 'rgba(0,0,0,.3)' }); text(g, s.L, x, bot + 44, { s: 18, w: 800, c: '#3a2a10' });
        if (age < 2) { const bh = tuned ? 10 + (HUMF[s.n] - 280) / 260 * 40 : 6; g.globalAlpha = 1 - age / 2; g.fillStyle = tuned ? COL.cy : '#777'; rrect(g, x - 7, top + 60 - bh, 14, bh, 3); g.fill(); g.globalAlpha = 1; if (!tuned) text(g, t('lyre.muted'), x, top + 72, { s: 9, c: COL.dim }); }
        cx.hits.push({ x: x - Math.min(22, (lw - 52) / 14), y: top, w: Math.min(44, (lw - 52) / 7), h: bot - top + 70, i });
      });
    },
    pluck(cx, i) { const s = cx.d.str[i]; const tuned = s.n >= 0 && cx.owned(s.f); cx.bars[i] = performance.now(); cx.sfx('lyre', { f: tuned ? HUMF[s.n] : 110 + i * 7, muted: !tuned }); cx.vib(8); },
    down(cx, x, y) { const k = (cx.hits || []).find(r => inR(x, y, r)); if (k) { this.pluck(cx, k.i); cx.last = k.i; } },
    move(cx, x, y, e, dn) { if (!dn) return; const k = (cx.hits || []).find(r => inR(x, y, r)); if (k && k.i !== cx.last) { this.pluck(cx, k.i); cx.last = k.i; } },
    up(cx) { cx.last = -1; },
    key(cx, e) { const k = '12345678'.indexOf(e.key); if (k >= 0) { this.pluck(cx, k); return true; } },
  };

  // ================= Estrellas: utilidades comunes (NA·1 y Carta estelar) =================
  function starField(g, cx, field, groups, bgStars, opts) {
    const { w, h } = cx; const top = opts.top || 0; const W = 100, H = opts.H || 62; const sc = Math.min((w - 20) / W, (h - top - 14) / H); const ox = (w - W * sc) / 2, oy = top + (h - top - H * sc) / 2;
    const P = (x, y) => [ox + x * sc, oy + y * sc]; cx.P = P; cx.sc = sc;
    g.fillStyle = '#02030a'; rrect(g, ox - 6, oy - 6, W * sc + 12, H * sc + 12, 14); g.fill();
    bgStars.forEach(([x, y, m], i) => { const [a, b] = P(x, y); g.fillStyle = `rgba(220,225,255,${0.25 + Math.sin(i * 7.1 + opts.tm) * .08})`; g.beginPath(); g.arc(a, b, Math.max(.6, (6.5 - m) * .45), 0, 7); g.fill(); });
    // trazos del jugador
    (cx.ui.lines || []).forEach(([g1, i1, g2, i2]) => { const s1 = groups[g1] && groups[g1].p[i1], s2 = groups[g2] && groups[g2].p[i2]; if (!s1 || !s2) return; const [a, b] = P(s1[0], s1[1]), [c, d] = P(s2[0], s2[1]); g.strokeStyle = DR.hexA(groups[g1].col, .8); g.lineWidth = 2; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
    groups.forEach((gr, gi) => { if (gr.hidden) return; gr.p.forEach(([x, y, m], pi) => { const [a, b] = P(x, y); const r = Math.max(1.4, (3.4 - (m - 1) * .52)) * Math.min(1.6, sc / 3.2); const sel = cx.sel && cx.sel[0] === gi && cx.sel[1] === pi; star(g, a, b, r, gr.col, Math.max(.4, 1 - (m - 1) * .14)); if (sel) { g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.arc(a, b, r + 7, 0, 7); g.stroke(); } if (cx.ui.photo) text(g, m.toFixed(1), a + r + 9, b - 8, { s: 9, c: '#dfe6ff', w: 700 }); }); });
  }
  function starTap(cx, groups, x, y) {
    let best = null, bd = 26; groups.forEach((gr, gi) => { if (gr.hidden) return; gr.p.forEach(([sx, sy], pi) => { const [a, b] = cx.P(sx, sy); const dd = Math.hypot(a - x, b - y); if (dd < bd) { bd = dd; best = [gi, pi]; } }); });
    if (!best) { cx.sel = null; return; }
    cx.ui.lines ||= [];
    if (cx.sel && cx.sel[0] === best[0] && !(cx.sel[1] === best[1])) { cx.ui.lines.push([cx.sel[0], cx.sel[1], best[0], best[1]]); cx.sfx('star', best[1] * 2); cx.vib(6); }
    else cx.sfx('star', 0);
    cx.sel = best; cx.save();
  }
  window.STARS = { starField, starTap };

  // ================= NA·1 · Rumbo trazado =================
  PZ.stars = {
    init(cx) { cx.ui.photo ??= false; cx.ui.lines ||= []; cx.sel = null; },
    tools(cx) { return [{ id: 'photo', label: t('t.photometer'), on: cx.ui.photo }, { id: 'erase', label: t('t.erase') }]; },
    tool(cx, id) { if (id === 'photo') cx.ui.photo = !cx.ui.photo; else { cx.ui.lines = []; cx.sel = null; } cx.sfx('tap'); cx.save(); },
    draw(g, cx, tm) {
      const { w, h, d } = cx; bg(g, w, h, '#0e1c4a'); const top = 54;
      plate(g, 10, 6, w - 20, 42, { top: '#101a3a', bot: '#0a1028', rivets: false }); const rs = Math.min(13, fit(g, t('sign.rule'), w * .62, 13, { f: 'pop' })); text(g, t('sign.rule'), 20, 27, { s: rs, a: 'left', f: 'pop', w: 500, c: COL.ink });
      const rw = Math.min(150, w * .3); RAINBOW.forEach((c, i) => { g.fillStyle = c; rrect(g, w - 18 - rw + i * rw / 7, 16, rw / 7 - 3, 10, 3); g.fill(); }); text(g, '1 → 7', w - 18 - rw / 2, 38, { s: 9, c: COL.dim });
      const groups = d.g.map(gr => ({ col: RAINBOW[gr.c], p: gr.p }));
      starField(g, cx, null, groups, d.bg, { top, tm });
      cx.groups = groups;
    },
    down(cx, x, y) { starTap(cx, cx.groups, x, y); },
  };

  // ================= NA·2 · Catálogo =================
  PZ.catalog = {
    init(cx) { cx.ui.fi ??= 0; },
    tools() { return [{ id: 'prev', label: '‹' }, { id: 'next', label: '›' }]; },
    tool(cx, id) { const n = cx.d.focus.length; cx.ui.fi = (cx.ui.fi + (id === 'next' ? 1 : n - 1)) % n; cx.sfx('ratchet', cx.ui.fi * 3); cx.save(); },
    draw(g, cx, tm) {
      const { w, h, d } = cx; bg(g, w, h, '#0e1c4a'); const land = w > h;
      // tabla
      const tw = land ? w * .52 : w - 24, th = land ? h - 24 : h * .52, tx = 12, ty = 12; plate(g, tx, ty, tw, th, { top: '#0c1430', bot: '#070c1e' }); text(g, t('catalog'), tx + 14, ty + 16, { s: 10, a: 'left', c: '#8fb0ff', w: 700, ls: 2 });
      const rh = (th - 46) / 8; const c1 = tx + 18, c2 = tx + tw * .22, c3 = tx + tw - 30;
      text(g, t('num'), c1, ty + 36, { s: 10, a: 'left', c: COL.dim }); text(g, cx.lang === 'en' ? 'NAME' : 'NOMBRE', c2, ty + 36, { s: 10, a: 'left', c: COL.dim }); text(g, t('mag'), c3, ty + 36, { s: 10, c: COL.dim });
      d.stars.forEach((s, i) => { const y = ty + 46 + i * rh + rh / 2; if (i % 2) { g.fillStyle = 'rgba(255,255,255,.03)'; g.fillRect(tx + 6, y - rh / 2, tw - 12, rh); } const fs = Math.min(16, rh * .5); text(g, String(s.no), c1, y, { s: fs, a: 'left', c: '#cfe0ff', w: 700 }); text(g, s.nm, c2, y, { s: Math.min(fs, fit(g, s.nm, c3 - c2 - 26, fs, { f: 'pop' })), a: 'left', f: 'pop', w: 600, c: COL.ink }); text(g, String(s.m), c3, y, { s: fs, c: '#ffe08a', w: 800 }); });
      // telescopio
      const vx = land ? tx + tw + 14 : 12, vy = land ? 12 : ty + th + 12, vw = land ? w - vx - 12 : w - 24, vh = land ? h - 24 : h - vy - 12; plate(g, vx, vy, vw, vh, { top: '#0c1430', bot: '#070c1e' });
      const R = Math.min(vw, vh - 40) * .38, cxv = vx + vw / 2, cyv = vy + 20 + R + 6; cx.V = { x: vx, y: vy, w: vw, h: vh };
      g.save(); g.beginPath(); g.arc(cxv, cyv, R, 0, 7); g.clip(); g.fillStyle = '#01030a'; g.fillRect(cxv - R, cyv - R, 2 * R, 2 * R); const r = CORE.mulberry32(cx.ui.fi * 77 + 3); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(220,230,255,.5)'; g.beginPath(); g.arc(cxv - R + r() * 2 * R, cyv - R + r() * 2 * R, r() * 1.2, 0, 7); g.fill(); } star(g, cxv, cyv, 6 + Math.sin(tm * 3) * .6, '#bcd2ff'); g.restore();
      g.strokeStyle = 'rgba(143,176,255,.5)'; g.lineWidth = 2; g.beginPath(); g.arc(cxv, cyv, R, 0, 7); g.stroke(); g.beginPath(); g.moveTo(cxv - R, cyv); g.lineTo(cxv - 12, cyv); g.moveTo(cxv + 12, cyv); g.lineTo(cxv + R, cyv); g.moveTo(cxv, cyv - R); g.lineTo(cxv, cyv - 12); g.moveTo(cxv, cyv + 12); g.lineTo(cxv, cyv + R); g.stroke();
      const n = d.focus.length; text(g, `${t('focus')} ${cx.ui.fi + 1}/${n} · ${t('num')} ${d.focus[cx.ui.fi]}`, cxv, Math.min(vy + vh - 14, cyv + R + 20), { s: 14, w: 800, c: '#ffe08a' });
      for (let i = 0; i < n; i++) { g.fillStyle = i === cx.ui.fi ? '#ffe08a' : 'rgba(255,255,255,.2)'; g.beginPath(); g.arc(cxv + (i - (n - 1) / 2) * 12, vy + 12, 3, 0, 7); g.fill(); }
    },
    down(cx, x, y) { if (inR(x, y, cx.V)) this.tool(cx, 'next'); },
    key(cx, e) { if (e.key === 'ArrowRight') { this.tool(cx, 'next'); return true; } if (e.key === 'ArrowLeft') { this.tool(cx, 'prev'); return true; } },
  };

  // ================= NA·3 · Carta giratoria =================
  PZ.chart = {
    init(cx) { cx.ui.a ??= 0; cx.ang = cx.ui.a; },
    tools() { return [{ id: 'm', label: '↺' }, { id: 'p', label: '↻' }]; },
    tool(cx, id) { this.step(cx, id === 'p' ? 5 : -5); },
    step(cx, s) { cx.ui.a = ((cx.ui.a + s) % 360 + 360) % 360; cx.sfx('ratchet', (cx.ui.a / 5) % 20); cx.save(); },
    draw(g, cx, tm, dt) {
      const { w, h, d } = cx; bg(g, w, h, '#0e1c4a'); const R = Math.min(w, h) * .42, X = w / 2, Y = h / 2; cx.C = { X, Y, R };
      let da = cx.ui.a - cx.ang; if (da > 180) da -= 360; if (da < -180) da += 360; cx.ang = (cx.ang + da * Math.min(1, dt * 14) + 360) % 360;
      const pos = (a, r) => [X + Math.cos(a * Math.PI / 180) * r * R, Y + Math.sin(a * Math.PI / 180) * r * R];
      g.fillStyle = '#02040e'; g.beginPath(); g.arc(X, Y, R, 0, 7); g.fill();
      d.dome.forEach(s => { const [a, b] = pos(s.a, s.r); g.fillStyle = 'rgba(220,230,255,.8)'; g.beginPath(); g.arc(a, b, 1.6, 0, 7); g.fill(); });
      const [gx, gy] = pos(d.g0, 1.06); g.fillStyle = COL.cy; g.beginPath(); g.moveTo(gx, gy - 8); g.lineTo(gx + 7, gy); g.lineTo(gx, gy + 8); g.lineTo(gx - 7, gy); g.closePath(); g.fill();
      // carta transparente con agujeros
      const A = cx.ang; g.save(); g.beginPath(); g.arc(X, Y, R * .98, 0, 7); const holes = d.holes.map(hh => pos(hh.a + A, hh.r)); holes.forEach(([a, b]) => { g.moveTo(a + R * .065, b); g.arc(a, b, R * .065, 0, 7, true); }); g.fillStyle = 'rgba(70,30,140,.9)'; g.fill('evenodd'); g.restore();
      g.strokeStyle = 'rgba(180,140,255,.5)'; g.lineWidth = 1; for (let k = 1; k < 4; k++) { g.beginPath(); g.arc(X, Y, R * k / 4, 0, 7); g.stroke(); } for (let k = 0; k < 12; k++) { const [a, b] = pos(A + k * 30, .98); g.beginPath(); g.moveTo(X, Y); g.lineTo(a, b); g.stroke(); }
      holes.forEach(([a, b]) => { g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(a, b, R * .065, 0, 7); g.stroke(); });
      // estrellas que asoman por los agujeros
      d.dome.forEach(s => { const [a, b] = pos(s.a, s.r); if (holes.some(([hx, hy]) => Math.hypot(hx - a, hy - b) < R * .06)) { star(g, a, b, 2.4, '#dbe6ff'); text(g, s.L, a, b - R * .045 - 4, { s: Math.max(11, R * .055), w: 800, c: '#fff', glow: '#7aa2ff' }); } });
      const [cgx, cgy] = pos(A, 1.06); const al = Math.abs(((A - d.g0) % 360 + 540) % 360 - 180) < 1; g.fillStyle = al ? '#fff' : '#b46bff'; g.beginPath(); g.arc(cgx, cgy, 7, 0, 7); g.fill(); if (al) glow(g, cgx, cgy, 30, COL.cy, 1);
      text(g, (cx.ui.a) + '°', X, Y + R + 18 > h - 4 ? h - 10 : Y + R + 18, { s: 11, c: COL.dim });
    },
    down(cx, x, y) { const C2 = cx.C; if (Math.hypot(x - C2.X, y - C2.Y) < C2.R * 1.1) cx.drag = { a: Math.atan2(y - C2.Y, x - C2.X) * 180 / Math.PI, acc: 0 }; },
    move(cx, x, y) { if (!cx.drag) return; const C2 = cx.C; const a = Math.atan2(y - C2.Y, x - C2.X) * 180 / Math.PI; let da = a - cx.drag.a; if (da > 180) da -= 360; if (da < -180) da += 360; cx.drag.a = a; cx.drag.acc += da; while (cx.drag.acc > 2.5) { this.step(cx, 5); cx.drag.acc -= 5; } while (cx.drag.acc < -2.5) { this.step(cx, -5); cx.drag.acc += 5; } },
    up(cx) { cx.drag = null; },
    key(cx, e) { if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { this.step(cx, e.shiftKey ? 30 : 5); return true; } if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { this.step(cx, e.shiftKey ? -30 : -5); return true; } },
  };

  // ================= NA·4 · Dos ventanas (paralaje) =================
  PZ.parallax = {
    init(cx) { cx.ui.blink ??= false; },
    tools(cx) { return [{ id: 'blink', label: cx.lang === 'en' ? 'Blink' : 'Parpadeo', on: cx.ui.blink }]; },
    tool(cx) { cx.ui.blink = !cx.ui.blink; cx.sfx('tap'); cx.save(); },
    win(g, cx, X, Y, R, right, label) {
      g.fillStyle = '#2a2f40'; g.beginPath(); g.arc(X, Y, R + 10, 0, 7); g.fill(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; g.fillStyle = '#5b6386'; g.beginPath(); g.arc(X + Math.cos(a) * (R + 5), Y + Math.sin(a) * (R + 5), 2.5, 0, 7); g.fill(); }
      g.save(); g.beginPath(); g.arc(X, Y, R, 0, 7); g.clip(); g.fillStyle = '#01030c'; g.fillRect(X - R, Y - R, 2 * R, 2 * R);
      cx.d.s.forEach(s => { const x = X - R + (s.x + (right ? s.dx : 0)) * 2 * R, y = Y - R + (s.y + (right ? s.dy : 0)) * 2 * R; star(g, x, y, 2.2, '#dfe8ff'); text(g, s.L, x + 7, y - 7, { s: Math.max(8, R * .07), w: 700, c: '#b9c8ee' }); });
      g.restore(); text(g, label, X, Y + R + 22, { s: 11, c: COL.dim, w: 700 });
    },
    draw(g, cx, tm) {
      const { w, h } = cx; bg(g, w, h, '#0e1c4a'); const land = w > h;
      if (cx.ui.blink) { const R = Math.min(w, h - 40) * .44; const right = Math.floor(tm * 1.6) % 2 === 1; this.win(g, cx, w / 2, h / 2 - 10, R, right, right ? (cx.lang === 'en' ? 'RIGHT' : 'DERECHA') : (cx.lang === 'en' ? 'LEFT' : 'IZQUIERDA')); return; }
      if (land) { const R = Math.min(w * .23 - 16, h / 2 - 30); this.win(g, cx, w * .27, h / 2 - 8, R, false, cx.lang === 'en' ? 'LEFT' : 'IZQUIERDA'); this.win(g, cx, w * .73, h / 2 - 8, R, true, cx.lang === 'en' ? 'RIGHT' : 'DERECHA'); }
      else { const R = Math.min(w / 2 - 20, h / 4.4 - 14); this.win(g, cx, w / 2, h * .25 - 6, R, false, cx.lang === 'en' ? 'LEFT' : 'IZQUIERDA'); this.win(g, cx, w / 2, h * .75 - 16, R, true, cx.lang === 'en' ? 'RIGHT' : 'DERECHA'); }
    },
  };

  // ================= Meta NA · Destino (Atlas) =================
  PZ.atlas = {
    init(cx) { cx.ui.r ??= 0; cx.ui.m ??= false; cx.ui.atlas ??= false; },
    tools(cx) { return [{ id: 'rot', label: '↻ 90°' }, { id: 'mir', label: '⇋ ' + t('t.mirror'), on: cx.ui.m }, { id: 'atlas', label: t('t.atlas'), on: cx.ui.atlas }]; },
    tool(cx, id) { if (id === 'rot') cx.ui.r = (cx.ui.r + 1) % 4; else if (id === 'mir') cx.ui.m = !cx.ui.m; else cx.ui.atlas = !cx.ui.atlas; cx.sfx('ratchet', cx.ui.r * 5); cx.save(); },
    draw(g, cx, tm) {
      const { w, h, d } = cx; bg(g, w, h, '#0e1c4a');
      const R = Math.min(w, h - 40) * .44, X = w / 2, Y = h / 2 + 10; g.fillStyle = '#02040e'; g.beginPath(); g.arc(X, Y, R, 0, 7); g.fill(); g.strokeStyle = 'rgba(91,140,255,.4)'; g.lineWidth = 2; g.stroke();
      const r = CORE.mulberry32(1234); for (let i = 0; i < 90; i++) { const a = r() * 6.283, rr2 = Math.sqrt(r()) * R; g.fillStyle = 'rgba(200,210,255,.35)'; g.beginPath(); g.arc(X + Math.cos(a) * rr2, Y + Math.sin(a) * rr2, r() * 1.2, 0, 7); g.fill(); }
      plate(g, 10, 6, w - 20, 30, { top: '#101a3a', bot: '#0a1028', rivets: false }); text(g, t('sign.outside'), w / 2, 21, { s: Math.min(13, fit(g, t('sign.outside'), w - 40, 13, { f: 'pop' })), f: 'pop', w: 500, c: '#cfe0ff' });
      const sc = R / 4.6; d.pts.forEach(([x, y], i) => { let px = x, py = y; if (cx.ui.m) px = -px; for (let k = 0; k < cx.ui.r; k++) [px, py] = [-py, px]; const isFrag = d.frag.includes(i); const vis = !isFrag || cx.owned(d.frag.indexOf(i)); if (!vis) return; star(g, X + px * sc, Y + py * sc, isFrag ? 4 : 5.5, isFrag ? COL.cy : '#fff3c8'); });
      if (cx.ui.atlas) {
        const cols = w > h ? 4 : 2, rows = 8 / cols; const bw = (w - 30) / cols, bh = Math.min((h - 60) / rows, bw * 1.1); const x0 = (w - cols * bw) / 2, y0 = 44;
        plate(g, x0 - 8, y0 - 6, cols * bw + 16, rows * bh + 12, { top: '#0c1430', bot: '#070c1e' });
        d.atlas.forEach((c2, i) => { const x = x0 + (i % cols) * bw, y = y0 + Math.floor(i / cols) * bh; const s = Math.min(bw, bh - 22) / 7; const ox = x + bw / 2 - 2.2 * s, oy = y + 6 + (bh - 22) / 2 - 3 * s;
          g.strokeStyle = 'rgba(143,176,255,.35)'; g.lineWidth = 1; g.beginPath(); [[0, 2], [2, 3], [3, 4], [4, 1], [2, 5], [4, 6]].forEach(([a, b]) => { g.moveTo(ox + c2.p[a][0] * s, oy + c2.p[a][1] * s); g.lineTo(ox + c2.p[b][0] * s, oy + c2.p[b][1] * s); }); g.stroke();
          c2.p.forEach(([px, py]) => star(g, ox + px * s, oy + py * s, 2.4, '#dfe8ff')); text(g, I18N.L2(c2.n).toUpperCase(), x + bw / 2, y + bh - 10, { s: 11, w: 700, c: '#8fb0ff' }); });
      }
    },
  };
})();
