/* JET//Frentes · lienzo: fondo, planetas, enjambres, batalla y animaciones de Cómo jugar.
   La interfaz vive en el DOM; el lienzo dibuja debajo, en las posiciones que el DOM marca (data-slot). */
var TS = 48; // tamaño del astronauta oficial (lo usa drawAstro)
(function () {
  'use strict';
  const PCOL = [
    { base: '#6b2bd9', hi: '#c9a2ff', lo: '#2d0b6b', glow: 'rgba(160,100,255,', name: 'Aria' },
    { base: '#8fe3ee', hi: '#f1feff', lo: '#2d7f99', glow: 'rgba(150,240,255,', name: 'Boreal' },
    { base: '#2f62d6', hi: '#8fb4ff', lo: '#0e2363', glow: 'rgba(90,140,255,', name: 'Cobalto' },
    { base: '#d99a3a', hi: '#ffd98a', lo: '#6e3a0c', glow: 'rgba(255,190,100,', name: 'Dunas' },
    { base: '#22ae95', hi: '#9ff5e2', lo: '#0b4b44', glow: 'rgba(80,240,200,', name: 'Eco' }
  ];
  const CY = '#00f2cf', PK = '#ff4466', WH = '#f5f0ff';
  const R = { cv: null, ctx: null, w: 0, h: 0, dpr: 1, t: 0, reduced: false, mx: 0, my: 0, view: null, fx: [], stars: null, bg: null, strips: {}, shades: {} };
  window.FR = R;
  R.PCOL = PCOL;

  function seeded(s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  R.resize = function () {
    const cv = R.cv; if (!cv) return;
    R.dpr = Math.min(2, window.devicePixelRatio || 1);
    const vv = window.visualViewport; const w = Math.round(window.innerWidth), h = Math.round(window.innerHeight);
    R.w = w; R.h = h; cv.width = Math.round(w * R.dpr); cv.height = Math.round(h * R.dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    R.bg = null;
  };
  function buildBg() {
    const c = document.createElement('canvas'); c.width = Math.max(1, R.w * R.dpr); c.height = Math.max(1, R.h * R.dpr);
    const g = c.getContext('2d'); g.scale(R.dpr, R.dpr);
    const W = R.w, H = R.h;
    const grd = g.createRadialGradient(W * 0.3, H * 0.15, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.9);
    grd.addColorStop(0, '#140830'); grd.addColorStop(0.5, '#0a0418'); grd.addColorStop(1, '#050108');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    // nebulosa violeta muy tenue
    const r = seeded(4242);
    for (let i = 0; i < 9; i++) {
      const x = r() * W, y = r() * H, rad = (0.2 + r() * 0.35) * Math.max(W, H);
      const ng = g.createRadialGradient(x, y, 0, x, y, rad);
      const col = i % 3 === 0 ? '0,242,207' : '119,0,244';
      ng.addColorStop(0, 'rgba(' + col + ',' + (i % 3 === 0 ? 0.025 : 0.06) + ')'); ng.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = ng; g.fillRect(0, 0, W, H);
    }
    R.bg = c;
    const n = Math.round(W * H / 2600); R.stars = [];
    for (let i = 0; i < n; i++) R.stars.push({ x: r() * W, y: r() * H, z: 0.2 + r() * 0.8, p: r() * 6.28, s: r() < 0.08 ? 1.6 : 0.8 + r() * 0.6 });
  }
  // ---------- planetas ----------
  function strip(idx, r) {
    const key = idx + ':' + r; if (R.strips[key]) return R.strips[key];
    const S = Math.max(4, Math.round(r * R.dpr)), W = S * 4, H = S * 2;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const P = PCOL[idx], rnd = seeded(1000 + idx * 77);
    g.fillStyle = P.base; g.fillRect(0, 0, W, H);
    const wrap = (fn) => { fn(0); fn(-W); fn(W); };
    if (idx === 0) { // bandas de gas
      for (let i = 0; i < 14; i++) { const y = rnd() * H, hh = H * (0.03 + rnd() * 0.09); g.fillStyle = [P.hi, P.lo, '#9b5cff', '#4a1a9e'][i % 4]; g.globalAlpha = 0.25 + rnd() * 0.35; g.beginPath(); for (let x = 0; x <= W; x += W / 32) g.lineTo(x, y + Math.sin(x / W * 6.28 * 2 + i) * hh * 0.4); for (let x = W; x >= 0; x -= W / 32) g.lineTo(x, y + hh + Math.sin(x / W * 6.28 * 2 + i + 1) * hh * 0.4); g.fill(); }
      g.globalAlpha = 0.5; g.fillStyle = '#e0c6ff'; g.beginPath(); g.ellipse(W * 0.3, H * 0.62, S * 0.22, S * 0.11, 0, 0, 7); g.fill();
    } else if (idx === 1) { // hielo con casquetes
      for (let i = 0; i < 40; i++) { g.globalAlpha = 0.18 + rnd() * 0.2; g.strokeStyle = rnd() < 0.5 ? '#ffffff' : '#5fc6d8'; g.lineWidth = S * 0.02 + rnd() * S * 0.03; const x = rnd() * W, y = H * 0.2 + rnd() * H * 0.6; wrap((o) => { g.beginPath(); g.moveTo(x + o, y); g.lineTo(x + o + S * (0.3 + rnd() * 0.6), y + (rnd() - 0.5) * S * 0.3); g.stroke(); }); }
      g.globalAlpha = 0.95; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H * 0.13); g.fillRect(0, H * 0.88, W, H * 0.12);
      g.globalAlpha = 0.5; g.fillRect(0, H * 0.13, W, H * 0.05);
    } else if (idx === 2) { // roca y cráteres
      for (let i = 0; i < 60; i++) { g.globalAlpha = 0.25; g.fillStyle = rnd() < 0.5 ? P.lo : P.hi; const x = rnd() * W, y = rnd() * H, rr = S * (0.05 + rnd() * 0.25); wrap((o) => { g.beginPath(); g.ellipse(x + o, y, rr * 1.4, rr, 0, 0, 7); g.fill(); }); }
      for (let i = 0; i < 26; i++) { const x = rnd() * W, y = H * 0.15 + rnd() * H * 0.7, rr = S * (0.03 + rnd() * 0.09); wrap((o) => { g.globalAlpha = 0.55; g.fillStyle = '#132c75'; g.beginPath(); g.arc(x + o, y, rr, 0, 7); g.fill(); g.globalAlpha = 0.35; g.strokeStyle = '#9fc0ff'; g.lineWidth = Math.max(1, rr * 0.25); g.beginPath(); g.arc(x + o - rr * 0.15, y - rr * 0.15, rr, 3.6, 5.6); g.stroke(); }); }
    } else if (idx === 3) { // desierto con tormentas
      for (let i = 0; i < 18; i++) { const y = rnd() * H; g.globalAlpha = 0.2 + rnd() * 0.25; g.fillStyle = i % 2 ? P.hi : P.lo; g.fillRect(0, y, W, H * (0.02 + rnd() * 0.06)); }
      for (let i = 0; i < 5; i++) { const x = rnd() * W, y = H * 0.3 + rnd() * H * 0.4; wrap((o) => { g.globalAlpha = 0.45; g.strokeStyle = '#fff1c9'; g.lineWidth = S * 0.03; g.beginPath(); for (let a = 0; a < 12; a += 0.3) g.lineTo(x + o + Math.cos(a) * a * S * 0.025, y + Math.sin(a) * a * S * 0.016); g.stroke(); }); }
    } else { // océano verde azulado con nubes
      for (let i = 0; i < 12; i++) { g.globalAlpha = 0.35; g.fillStyle = '#137a6a'; const x = rnd() * W, y = H * 0.2 + rnd() * H * 0.6; wrap((o) => { g.beginPath(); g.ellipse(x + o, y, S * (0.2 + rnd() * 0.4), S * (0.1 + rnd() * 0.2), rnd(), 0, 7); g.fill(); }); }
      for (let i = 0; i < 26; i++) { g.globalAlpha = 0.35 + rnd() * 0.3; g.fillStyle = '#ffffff'; const x = rnd() * W, y = rnd() * H; wrap((o) => { g.beginPath(); g.ellipse(x + o, y, S * (0.1 + rnd() * 0.3), S * 0.035, 0, 0, 7); g.fill(); }); }
    }
    g.globalAlpha = 1;
    R.strips[key] = c; return c;
  }
  function shade(idx, r) {
    const key = idx + ':' + r; if (R.shades[key]) return R.shades[key];
    const S = Math.max(4, Math.round(r * R.dpr)), pad = Math.round(S * 0.5), D = S * 2 + pad * 2;
    const c = document.createElement('canvas'); c.width = D; c.height = D; const g = c.getContext('2d'); const cx = D / 2;
    // luz de un sol arriba a la izquierda
    const sg = g.createRadialGradient(cx - S * 0.45, cx - S * 0.5, S * 0.1, cx, cx, S * 1.05);
    sg.addColorStop(0, 'rgba(255,255,255,0.28)'); sg.addColorStop(0.45, 'rgba(255,255,255,0)'); sg.addColorStop(0.75, 'rgba(5,1,12,0.45)'); sg.addColorStop(1, 'rgba(5,1,12,0.88)');
    g.fillStyle = sg; g.beginPath(); g.arc(cx, cx, S, 0, Math.PI * 2); g.fill();
    // atmósfera
    const ag = g.createRadialGradient(cx, cx, S * 0.92, cx, cx, S * 1.32);
    ag.addColorStop(0, PCOL[idx].glow + '0.55)'); ag.addColorStop(1, PCOL[idx].glow + '0)');
    g.fillStyle = ag; g.beginPath(); g.arc(cx, cx, S * 1.32, 0, Math.PI * 2); g.moveTo(cx + S * 0.96, cx); g.arc(cx, cx, S * 0.96, Math.PI * 2, 0, true); g.fill();
    R.shades[key] = c; return c;
  }
  R.drawPlanet = function (g, idx, x, y, r, t, alpha) {
    r = Math.max(4, Math.round(r));
    const st = strip(idx, r), sh = shade(idx, r), S = st.height / 2, W = st.width;
    const period = [52, 64, 44, 70, 58][idx];
    const off = R.reduced ? W * 0.3 : ((t / period) * W) % W;
    g.save(); if (alpha != null) g.globalAlpha = alpha;
    if (idx === 4) drawRing(g, x, y, r, true);
    g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
    const sc = r / S, x0 = x - r - off * sc;
    g.drawImage(st, x0, y - r, W * sc + 0.6, r * 2);
    g.drawImage(st, x0 + W * sc - 0.4, y - r, W * sc + 0.6, r * 2);
    g.restore();
    const rr = r * (sh.width / 2) / S;
    g.drawImage(sh, x - rr, y - rr, rr * 2, rr * 2);
    if (idx === 4) drawRing(g, x, y, r, false);
    g.restore();
  };
  function drawRing(g, x, y, r, back) {
    g.save(); g.translate(x, y); g.rotate(-0.32);
    g.strokeStyle = 'rgba(190,255,240,0.55)'; g.lineWidth = Math.max(1.2, r * 0.12);
    g.beginPath(); g.ellipse(0, 0, r * 1.7, r * 0.42, 0, back ? Math.PI : 0, back ? Math.PI * 2 : Math.PI); g.stroke();
    g.strokeStyle = 'rgba(120,230,210,0.35)'; g.lineWidth = Math.max(1, r * 0.06);
    g.beginPath(); g.ellipse(0, 0, r * 1.95, r * 0.5, 0, back ? Math.PI : 0, back ? Math.PI * 2 : Math.PI); g.stroke();
    g.restore();
  }
  // ---------- enjambres ----------
  function chevron(g, x, y, a, s, col, alpha) {
    g.save(); g.translate(x, y); g.rotate(a); g.globalAlpha = alpha; g.fillStyle = col;
    g.beginPath(); g.moveTo(s, 0); g.lineTo(-s, -s * 0.8); g.lineTo(-s * 0.45, 0); g.lineTo(-s, s * 0.8); g.closePath(); g.fill(); g.restore();
  }
  // dibuja la parte de atrás (back=true) o de delante del enjambre
  R.drawSwarm = function (g, sl, t, back, col) {
    const n = Math.round(sl.shown || 0); if (n <= 0) return;
    const caps = [16, 26, 36, 60]; let k = 0, left = n, ring = 0;
    const maxRx = sl.maxRx || sl.r * 2.2;
    while (left > 0 && ring < 4) {
      const cnt = Math.min(caps[ring], left);
      const rx = Math.min(maxRx, sl.r * (1.32 + ring * 0.24)), ry = rx * 0.36;
      const sp = (R.reduced ? 0 : 0.35 / (1 + ring * 0.4)) * (ring % 2 ? -1 : 1);
      for (let j = 0; j < cnt; j++) {
        const a = t * sp + j / cnt * Math.PI * 2 + ring * 0.7;
        const s = Math.sin(a), c = Math.cos(a);
        if ((s < 0) !== back) continue;
        const x = sl.x + c * rx, y = sl.y + s * ry - ring * 1.2;
        const dir = Math.atan2(c * ry * (sp >= 0 ? 1 : -1), -s * rx * (sp >= 0 ? 1 : -1));
        const fresh = sl.fresh && k >= n - sl.fresh.n ? Math.max(0, 1 - (R.t - sl.fresh.t) / 0.18) : 0;
        const fx = fresh ? x + (sl.from.x - x) * fresh : x, fy = fresh ? y + (sl.from.y - y) * fresh : y;
        chevron(g, fx, fy, dir, Math.max(1.6, Math.min(3.2, sl.r * 0.1)), col || CY, back ? 0.45 : 0.95);
        k++;
      }
      left -= cnt; ring++;
    }
  };
  // ---------- batalla ----------
  function drawBattleLane(g, L, t) {
    const c = L.col; if (!c || !L.hist) return;
    const scale = L.scale || 100, maxH = L.maxH || 1, x = L.x;
    const rowH = c.h / (scale + 1);
    const arrive = L.arrive == null ? 1 : L.arrive, rf = L.reveal || 0;
    const cut = x * rf; // filas por debajo de cut ya se tiñeron
    for (let s = 0; s <= scale; s++) {
      const h = L.hist[s]; if (!h) continue;
      const wv = Math.pow(h / maxH, 0.55) * c.w * 0.92 * arrive;
      const y = c.y + c.h - (s + 1) * rowH;
      let col = PK, a = 0.78;
      if (rf > 0) { if (s < x && s < cut) { col = CY; a = 0.85; } else if (s === x && rf >= 1) { col = WH; a = 0.9; } }
      g.globalAlpha = a * arrive; g.fillStyle = col;
      g.fillRect(c.x + (c.w - wv) / 2, y, wv, Math.max(1, rowH - (rowH > 3 ? 1 : 0)));
    }
    g.globalAlpha = 1;
    if (rf > 0 || L.showMark) {
      const y = c.y + c.h - (x + 0.5) * rowH;
      g.save(); g.shadowColor = CY; g.shadowBlur = 10; g.strokeStyle = CY; g.lineWidth = 2;
      g.beginPath(); g.moveTo(c.x - 4, y); g.lineTo(c.x + c.w + 4, y); g.stroke(); g.restore();
      if (rf > 0 && rf < 1 && !R.reduced && Math.random() < 0.6) R.spark(c.x + Math.random() * c.w, c.y + c.h - cut * rowH, CY);
    }
  }
  R.spark = function (x, y, col, big) {
    if (R.fx.length > 260) return;
    const a = Math.random() * 6.28, v = (big ? 120 : 40) + Math.random() * (big ? 220 : 80);
    R.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (big ? 60 : 20), life: 0, max: 0.4 + Math.random() * (big ? 1.0 : 0.4), col, s: big ? 2.6 : 1.6 });
  };
  R.starRain = function () {
    if (R.reduced) return;
    for (let i = 0; i < 90; i++) R.fx.push({ x: Math.random() * R.w, y: -20 - Math.random() * R.h * 0.4, vx: (Math.random() - 0.5) * 30, vy: 160 + Math.random() * 260, life: 0, max: 1.2 + Math.random() * 0.8, col: Math.random() < 0.5 ? CY : '#a774ff', s: 2 + Math.random() * 2, star: true });
  };
  R.trail = function (from, to, col) {
    if (R.reduced) return;
    for (let i = 0; i < 14; i++) { const k = i / 14; R.fx.push({ x: from.x, y: from.y, tx: to.x + (Math.random() - 0.5) * 20, ty: to.y + (Math.random() - 0.5) * 10, life: -k * 0.25, max: 0.55, col: col || CY, s: 2, path: true }); }
  };
  function drawFx(g, dt) {
    for (let i = R.fx.length - 1; i >= 0; i--) {
      const p = R.fx[i]; p.life += dt;
      if (p.life > p.max) { R.fx.splice(i, 1); continue; }
      if (p.life < 0) continue;
      const k = p.life / p.max;
      if (p.path) { const e = 1 - Math.pow(1 - k, 3); const x = p.x + (p.tx - p.x) * e, y = p.y + (p.ty - p.y) * e - Math.sin(e * Math.PI) * 40; g.globalAlpha = 1 - k * 0.6; g.fillStyle = p.col; g.beginPath(); g.arc(x, y, p.s, 0, 7); g.fill(); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; if (!p.star) p.vy += 140 * dt;
      g.globalAlpha = 1 - k; g.fillStyle = p.col;
      if (p.star) { g.save(); g.translate(p.x, p.y); g.rotate(p.life * 3); g.beginPath(); for (let j = 0; j < 5; j++) { const a = j * 1.2566 - 1.57; g.lineTo(Math.cos(a) * p.s * 1.6, Math.sin(a) * p.s * 1.6); const b = a + 0.628; g.lineTo(Math.cos(b) * p.s * 0.6, Math.sin(b) * p.s * 0.6); } g.fill(); g.restore(); }
      else { g.beginPath(); g.arc(p.x, p.y, p.s * (1 - k * 0.5), 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
  }
  // ---------- cuadro ----------
  let last = 0;
  R.frame = function (now) {
    const g = R.ctx; if (!g) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    if (!R.paused) R.t += dt;
    const t = R.t;
    if (!R.bg || R.bg.width !== Math.round(R.w * R.dpr)) buildBg();
    g.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
    // fondo con paralaje leve
    const px = R.reduced ? 0 : R.mx * 6, py = R.reduced ? 0 : R.my * 6;
    g.drawImage(R.bg, 0, 0, R.w, R.h);
    g.fillStyle = '#ffffff';
    for (const s of R.stars) {
      const tw = R.reduced ? 0.7 : 0.45 + 0.4 * Math.sin(t * (0.6 + s.z) + s.p);
      g.globalAlpha = tw * s.z; const x = (s.x + px * s.z + R.w) % R.w, y = (s.y + py * s.z + R.h) % R.h;
      g.fillRect(x, y, s.s, s.s);
    }
    g.globalAlpha = 1;
    const v = R.view && R.view();
    if (v) {
      const zoom = v.zoom || 1;
      if (zoom !== 1) { g.translate(R.w / 2, R.h / 2); g.scale(zoom, zoom); g.translate(-R.w / 2, -R.h / 2); }
      const slots = v.slots || [];
      for (const sl of slots) if (sl.r > 2) R.drawSwarm(g, sl, t, true, sl.col);
      for (const sl of slots) if (sl.r > 2) {
        if (sl.sel) { g.save(); g.globalAlpha = 0.5 + 0.25 * Math.sin(t * 4); g.strokeStyle = CY; g.lineWidth = 1.5; g.setLineDash([3, 4]); g.beginPath(); g.arc(sl.x, sl.y, sl.r + 6, 0, 7); g.stroke(); g.restore(); }
        if (sl.won != null) { g.save(); g.globalAlpha = 0.6; g.shadowBlur = 20; g.shadowColor = sl.won > 0 ? CY : sl.won < 0 ? PK : WH; g.fillStyle = 'rgba(0,0,0,0)'; g.strokeStyle = g.shadowColor; g.lineWidth = 2; g.beginPath(); g.arc(sl.x, sl.y, sl.r + 3, 0, 7); g.stroke(); g.restore(); }
        R.drawPlanet(g, sl.idx, sl.x, sl.y, sl.r, t + sl.idx * 13, sl.alpha);
      }
      for (const sl of slots) if (sl.r > 2) R.drawSwarm(g, sl, t, false, sl.col);
      if (v.battle) for (const L of v.battle) drawBattleLane(g, L, t);
      if (zoom !== 1) g.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
    }
    drawFx(g, dt);
  };
  // ---------- mini lienzos ----------
  R.miniHist = function (cv, hist, x, scale, opts) {
    const d = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || 120, h = cv.clientHeight || 40;
    cv.width = Math.round(w * d); cv.height = Math.round(h * d); const g = cv.getContext('2d'); g.scale(d, d);
    g.clearRect(0, 0, w, h);
    scale = scale || 100; let maxH = 1; const B = 50, bins = new Array(B).fill(0);
    for (let s = 0; s <= scale; s++) { const b = Math.min(B - 1, Math.floor(s / (scale + 1) * B)); bins[b] += hist[s] || 0; }
    for (const q of bins) maxH = Math.max(maxH, q);
    const bw = w / B, xb = Math.floor(x / (scale + 1) * B);
    for (let b = 0; b < B; b++) {
      const hh = bins[b] / maxH * (h - 6); if (!hh) continue;
      g.fillStyle = b < xb ? CY : b === xb ? WH : PK; g.globalAlpha = b < xb ? 0.85 : b === xb ? 0.9 : 0.6;
      g.fillRect(b * bw + 0.5, h - hh, Math.max(1, bw - 1), hh);
    }
    g.globalAlpha = 1; g.fillStyle = CY; g.fillRect((x + 0.5) / (scale + 1) * w - 1, 0, 2, h);
    if (opts && opts.p95 != null) { g.strokeStyle = 'rgba(245,240,255,.55)'; g.setLineDash([2, 3]); g.beginPath(); const px = (opts.p95 + 0.5) / (scale + 1) * w; g.moveTo(px, 0); g.lineTo(px, h); g.stroke(); }
  };
  R.miniBars = function (cv, x, best, scale) {
    const d = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || 60, h = cv.clientHeight || 24;
    cv.width = Math.round(w * d); cv.height = Math.round(h * d); const g = cv.getContext('2d'); g.scale(d, d);
    const n = x.length, gap = 3, bw = (w - gap * (n - 1)) / n; scale = scale || Math.max(1, ...x, ...(best || []));
    for (let i = 0; i < n; i++) {
      const hh = x[i] / scale * h; g.fillStyle = PCOL[i].base; g.globalAlpha = 0.95; g.fillRect(i * (bw + gap), h - hh, bw, Math.max(hh, x[i] ? 1.5 : 0));
      if (best) { const bh = best[i] / scale * h; g.globalAlpha = 1; g.strokeStyle = CY; g.lineWidth = 1.5; g.strokeRect(i * (bw + gap) + 0.75, h - bh + 0.75, bw - 1.5, Math.max(0, bh - 1.5)); }
    }
    g.globalAlpha = 1;
  };
  R.planetIcon = function (cv, idx, size) {
    const d = Math.min(2, window.devicePixelRatio || 1); size = size || cv.clientWidth || 28;
    cv.width = Math.round(size * d); cv.height = Math.round(size * d); const g = cv.getContext('2d'); g.scale(d, d);
    R.drawPlanet(g, idx, size / 2, size / 2, size * (idx === 4 ? 0.3 : 0.4), 3 + idx * 9);
  };
  // Comandante: astronauta oficial, de frente, con saludo opcional
  R.drawCommander = function (cv, t, hop) {
    const d = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || 56, h = cv.clientHeight || 56;
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    TS = h * 0.62; if (typeof drawAstro === 'function') drawAstro(g, w / 2, h * 0.47, 'd', 0, 0, 0, t, hop || 0);
  };
  // ---------- Cómo jugar: cuatro láminas animadas ----------
  R.drawHelp = function (cv, slide, t) {
    const d = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || 320, h = cv.clientHeight || 180;
    if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = '#07040d'; g.fillRect(0, 0, w, h);
    const lane = w / 5, py = h * 0.2, pr = Math.min(lane * 0.22, h * 0.1);
    const mono = (s, x, y, col, sz, al) => { g.font = '700 ' + (sz || 12) + 'px "JetBrains Mono",monospace'; g.textAlign = al || 'center'; g.fillStyle = col; g.fillText(s, x, y); };
    if (slide === 0) {
      const target = [12, 31, 36, 0, 21], k = Math.min(1, (t % 5) / 3.2);
      for (let i = 0; i < 5; i++) {
        const cx = lane * (i + 0.5); R.drawPlanet(g, i, cx, py, pr, t + i * 9);
        const n = Math.round(target[i] * Math.min(1, Math.max(0, k * 1.6 - i * 0.12)));
        const colH = h * 0.5, cw = lane * 0.42, y0 = h * 0.86;
        g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(cx - cw / 2, y0 - colH, cw, colH);
        const fh = n / 40 * colH; const gr = g.createLinearGradient(0, y0 - fh, 0, y0); gr.addColorStop(0, CY); gr.addColorStop(1, '#7700f4');
        g.fillStyle = gr; g.fillRect(cx - cw / 2, y0 - fh, cw, fh);
        mono(String(n), cx, h * 0.97, WH, 12);
      }
      const used = target.reduce((a, b) => a + b, 0) * Math.min(1, k * 1.2);
      const L = (document.documentElement.lang === 'en' ? 'en' : 'es'); const rl = ((window.T && T[L] && T[L].reserve) || 'RESERVA') + ' ';
      mono(rl + String(Math.max(0, 100 - Math.round(used))), w - 8, 16, CY, 11, 'right');
    } else if (slide === 1) {
      const ph = Math.floor(t / 2.6) % 2; const cx1 = w * 0.3, cx2 = w * 0.7;
      [[21, 20], [20, 20]].forEach((p, j) => {
        const cx = j ? cx2 : cx1; const on = j === ph;
        g.globalAlpha = on ? 1 : 0.35;
        R.drawPlanet(g, 2, cx, h * 0.3, h * 0.13, t);
        mono(p[0] + '', cx - w * 0.09, h * 0.7, CY, 22); mono('vs', cx, h * 0.7, '#b5a8d8', 12); mono(p[1] + '', cx + w * 0.09, h * 0.7, PK, 22);
        const res = p[0] > p[1];
        g.strokeStyle = res ? CY : WH; g.lineWidth = 2; g.beginPath(); g.arc(cx, h * 0.3, h * 0.13 + 5, 0, 7); g.stroke();
        mono(res ? '✓' : '=', cx, h * 0.92, res ? CY : WH, 18);
        g.globalAlpha = 1;
      });
    } else if (slide === 2) {
      const vals = [5, 1, 4, 2, 3], mine = [0, 0, 1, 1, 1]; const k = Math.floor((t % 6) / 0.9);
      let a = 0, b = 0;
      for (let i = 0; i < 5; i++) {
        const cx = lane * (i + 0.5), show = i < k;
        R.drawPlanet(g, i, cx, h * 0.34, pr * 1.1, t + i * 7, show ? 1 : 0.5);
        mono(vals[i] + ' PTS', cx, h * 0.62, '#b5a8d8', 10);
        if (show) { if (mine[i]) a += vals[i]; else b += vals[i]; mono(mine[i] ? '✓' : '✗', cx, h * 0.12 + 4, mine[i] ? CY : PK, 15); g.strokeStyle = mine[i] ? CY : PK; g.lineWidth = 2; g.beginPath(); g.arc(cx, h * 0.34, pr * 1.1 + 4, 0, 7); g.stroke(); }
      }
      mono(a + '', w * 0.38, h * 0.88, CY, 22); mono('–', w * 0.5, h * 0.88, '#b5a8d8', 18); mono(b + '', w * 0.62, h * 0.88, PK, 22);
    } else {
      const N = 60, k = Math.min(1, (t % 6) / 3.5), wins = Math.round(N * 0.73 * k);
      for (let i = 0; i < N; i++) {
        const a = -Math.PI * 0.95 + i / (N - 1) * Math.PI * 0.9, rr = h * 0.62;
        const x = w / 2 + Math.cos(a) * rr * 1.25, y = h * 0.9 + Math.sin(a) * rr;
        chevron(g, x, y, a + Math.PI, 3.2, i < wins ? CY : PK, 0.9);
      }
      chevron(g, w / 2, h * 0.86, -Math.PI / 2, 7, CY, 1);
      mono(Math.round(73 * k) + (document.documentElement.lang === 'en' ? '%' : ' %'), w / 2, h * 0.62, WH, 26);
    }
  };
})();
