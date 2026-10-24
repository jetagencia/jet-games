// JET//Estación Silencio · escenas de fondo: inicio, salas por módulo, Anillo (Hub) y cinemáticas.
'use strict';
const SC = (() => {
  const { COL, rrect, plate, text, glow, hexA, mix, fit } = DR;
  const RW = 2100, RH = 900;
  const PANELS = {
    prologo: [['p1', 420, 1], ['p2', 1050, 1], ['p3', 1680, 1]],
    observatorio: [['final', 1050, 1.25]],
  };
  for (const m of CORE.MODS) { const ids = CORE.MOD_PUZ[m]; PANELS[m] = [[ids[0], 300, 1], [ids[1], 680, 1], [ids[4], 1050, 1.22], [ids[2], 1420, 1], [ids[3], 1800, 1]]; }
  const dust = Array.from({ length: 70 }, (_, i) => ({ x: Math.random(), y: Math.random(), s: .5 + Math.random() * 1.6, v: .2 + Math.random() * .6, p: Math.random() * 6 }));
  const stars = Array.from({ length: 160 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 1.3 + .2, p: Math.random() * 6 }));
  const rm = () => document.documentElement.classList.contains('reduce');

  // ---------- Tierra ----------
  function earth(g, x, y, r, tm) {
    glow(g, x, y, r * 1.5, '#4da3ff', .6);
    g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
    const oc = g.createRadialGradient(x - r * .4, y - r * .4, r * .1, x, y, r); oc.addColorStop(0, '#3f8fe8'); oc.addColorStop(1, '#0b2a6a'); g.fillStyle = oc; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    const off = (tm * .02) % 1;
    for (let k = 0; k < 2; k++) [[.1, .3, .22, .12], [.45, .55, .16, .22], [.7, .25, .2, .1], [.3, .75, .12, .08], [.85, .65, .14, .16]].forEach(([u, v, a, b]) => { const cx = x - r + ((u + off + k) % 2 - .5) * 2 * r; g.fillStyle = '#3f9f6a'; g.beginPath(); g.ellipse(cx, y - r + v * 2 * r, a * r, b * r, .3, 0, 7); g.fill(); });
    g.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x - r + ((k * .23 + off * 1.4) % 1.2) * 2 * r, y - r * .6 + k * r * .3, r * .3, r * .04, -.2, 0, 7); g.fill(); }
    const sh = g.createLinearGradient(x - r, 0, x + r, 0); sh.addColorStop(0, 'rgba(0,0,10,0)'); sh.addColorStop(.6, 'rgba(0,0,10,.25)'); sh.addColorStop(1, 'rgba(0,0,10,.85)'); g.fillStyle = sh; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    g.restore();
  }
  function starfield(g, w, h, tm, a = 1) { for (const s of stars) { g.fillStyle = `rgba(230,235,255,${(0.4 + Math.sin(tm * 1.3 + s.p) * .25) * a})`; g.fillRect(s.x * w, s.y * h, s.s, s.s); } }
  function dustLayer(g, w, h, tm, col = '255,240,220') { if (rm()) return; for (const d of dust) { const x = (d.x * w + Math.sin(tm * .2 + d.p) * 20) % w, y = ((d.y * h - tm * d.v * 6) % h + h) % h; g.fillStyle = `rgba(${col},${.12 + .1 * Math.sin(tm + d.p)})`; g.beginPath(); g.arc(x, y, d.s, 0, 7); g.fill(); } }

  // ---------- inicio ----------
  function home(g, w, h, tm, opts = {}) {
    g.fillStyle = '#04010a'; g.fillRect(0, 0, w, h); starfield(g, w, h, tm);
    const land = w > h; const ex = land ? w * .2 : w * .82, ey = land ? h * .48 : h * .13, er = land ? Math.min(w, h) * .32 : w * .36;
    earth(g, ex, ey, er, tm);
    // marco del ventanal
    g.save(); g.strokeStyle = 'rgba(60,50,100,.55)'; g.lineWidth = Math.max(10, Math.min(w, h) * .025); DR.rrect(g, 8, 8, w - 16, h - 16, Math.min(w, h) * .12); g.stroke(); g.restore();
    // barrido de luz (ciclo 14 s)
    if (!rm()) { const p = (tm % 14) / 14; const lx = -w * .3 + p * w * 1.6; const lg = g.createLinearGradient(lx - 160, 0, lx + 160, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, 'rgba(180,200,255,.06)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; g.fillRect(0, 0, w, h); }
    // cápsula con el astronauta dormido
    let cx = land ? w * .43 : w * .4, cy = land ? h * .66 : h * .33, cr = land ? Math.min(w, h) * .17 : w * .24;
    if (!land && opts.cardTop > 0) { const t0 = 64, av = opts.cardTop - t0 - 10; if (cy + cr * 1.05 > opts.cardTop - 10) { cr = Math.max(40, Math.min(cr, av / 2.2)); cy = t0 + av / 2; } }
    g.fillStyle = 'rgba(20,12,40,.9)'; rrect(g, cx - cr * .85, cy - cr * 1.05, cr * 1.7, cr * 2.1, cr * .7); g.fill(); g.strokeStyle = 'rgba(160,170,210,.5)'; g.lineWidth = 3; g.stroke();
    const gl = g.createRadialGradient(cx, cy, 5, cx, cy, cr * 1.2); gl.addColorStop(0, 'rgba(90,140,255,.35)'); gl.addColorStop(1, 'rgba(90,140,255,0)'); g.fillStyle = gl; rrect(g, cx - cr * .75, cy - cr * .95, cr * 1.5, cr * 1.9, cr * .62); g.fill();
    TS = cr * .95; g.save(); g.translate(cx, cy + Math.sin(tm * .8) * cr * .03); g.rotate(Math.sin(tm * .5) * .04); drawAstro(g, 0, -cr * .06, 'd', 0, 0, 0, tm * .25, 0); g.restore();
    g.fillStyle = 'rgba(200,215,240,.1)'; rrect(g, cx - cr * .75, cy - cr * .95, cr * 1.5, cr * 1.9, cr * .62); g.fill();
    dustLayer(g, w, h, tm);
    const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, Math.max(w, h) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  }

  // ---------- salas ----------
  function prog(mod) { const ids = CORE.MOD_PUZ[mod] || []; return ids.length ? ids.filter(CORE.isSolved).length / ids.length : 0; }
  function camFor(mod, w, h, layout) {
    const top = layout.top, bot = layout.bot; const avail = h - top - bot; const s = avail / RH;
    const vw = RW * s; const pan = Math.max(0, vw - w);
    return { s, top, pan, ox: vw < w ? (w - vw) / 2 : 0 };
  }
  function room(g, w, h, tm, st) {
    const mod = st.mod, col = CORE.MOD_COL[mod] || '#9fb4ff'; const p = prog(mod); const cam = st.cam;
    const done = mod === 'observatorio' ? (CORE.isSolved('final') ? 1 : .3) : p;
    g.fillStyle = '#05020c'; g.fillRect(0, 0, w, h);
    const emerg = mod === 'energia' && !CORE.G.metas.energia ? '#ff4466' : col;
    g.save(); g.translate(cam.ox - st.px, cam.top); g.scale(cam.s, cam.s);
    const x0 = (st.px - cam.ox) / cam.s - 400, x1 = x0 + w / cam.s + 800;
    // pared
    // VIS-ESTACION-01 · materiales de estación: pared #101623→#151E2B, uniones #263343 α.45, suelo #0B1019; la luz propia (MOD_COL) y su relación con el progreso no cambian, sólo el cono ambiental baja de .28 a .16 máx.
    const wall = g.createLinearGradient(0, 0, 0, RH); wall.addColorStop(0, mix('#101623', '#1B2636', done * .5)); wall.addColorStop(1, mix('#151E2B', '#22303F', done * .4)); g.fillStyle = wall; g.fillRect(x0, 0, x1 - x0, RH);
    for (let x = Math.floor(x0 / 210) * 210; x < x1; x += 210) { g.fillStyle = 'rgba(38,51,67,.45)'; g.fillRect(x, 60, 4, 680); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 4, 60, 2, 680); for (let y = 120; y < 700; y += 140) { g.fillStyle = 'rgba(255,255,255,.04)'; g.beginPath(); g.arc(x + 20, y, 4, 0, 7); g.fill(); } }
    // techo y luces
    g.fillStyle = '#070B12'; g.fillRect(x0, 0, x1 - x0, 60); const nl = 6, lit = Math.round(done * nl) + 1;
    for (let i = 0; i < nl; i++) { const lx = 175 + i * 350, on = i < lit; g.fillStyle = on ? hexA(col, .95) : '#242B36'; rrect(g, lx - 70, 48, 140, 12, 6); g.fill(); if (on) { const cone = g.createLinearGradient(0, 60, 0, 760); cone.addColorStop(0, hexA(col, .10 + done * .06)); cone.addColorStop(1, hexA(col, 0)); g.fillStyle = cone; g.beginPath(); g.moveTo(lx - 70, 60); g.lineTo(lx + 70, 60); g.lineTo(lx + 230, 760); g.lineTo(lx - 230, 760); g.closePath(); g.fill(); } }
    // suelo
    g.fillStyle = '#0B1019'; g.fillRect(x0, 760, x1 - x0, RH - 760); g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 2; for (let x = Math.floor(x0 / 70) * 70; x < x1; x += 70) { g.beginPath(); g.moveTo(x, 760); g.lineTo(x - 40, RH); g.stroke(); } g.fillStyle = hexA(col, .35); g.fillRect(x0, 758, x1 - x0, 3);
    props(g, mod, tm, done, col);
    // paneles
    st.hot = [];
    (PANELS[mod] || []).forEach(([id, x, k]) => {
      const solved = CORE.isSolved(id), unl = CORE.puzzleUnlocked(id), meta = CORE.C.puzzles[id].meta; const pw = 210 * k, ph = 250 * k, y = 300 - (k - 1) * 120;
      const hov = st.hover === id; const sel = st.sel === id;
      // carcasa #26313D→#141E29, borde #556879, radio 12; luz superior izquierda y sombra suave debajo; halo de hover ≤ 10 px CSS (shadowBlur no escala con cam.s)
      g.save(); if (hov || sel) { g.shadowColor = col; g.shadowBlur = 10; } else { g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 10; g.shadowOffsetY = 6; }
      plate(g, x - pw / 2, y, pw, ph, { r: 12, top: '#26313D', bot: '#141E29', edge: solved ? hexA(col, .6) : '#556879' }); g.restore();
      // pantalla: negro #071016 + color de estado existente (no toda la tarjeta roja)
      const sx = x - pw * .38, sy = y + ph * .14, sw = pw * .76, sh = ph * .5; g.fillStyle = '#071016'; rrect(g, sx, sy, sw, sh, 10); g.fill(); g.fillStyle = solved ? hexA(col, .16) : unl ? 'rgba(255,68,102,.07)' : 'rgba(255,255,255,.02)'; rrect(g, sx, sy, sw, sh, 10); g.fill();
      if (solved) { g.strokeStyle = hexA(col, .9); g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 30; i++) { const xx = sx + 10 + i * (sw - 20) / 30; const yy = sy + sh / 2 + Math.sin(i * .6 + tm * 3) * sh * .18 * (1 - Math.abs(i - 15) / 18); i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); }
      else if (unl) { g.fillStyle = 'rgba(255,68,102,.4)'; for (let i = 0; i < 6; i++) g.fillRect(sx + 14 + i * (sw - 28) / 6, sy + sh * .5 + Math.sin(i * 1.7 + Math.floor(tm * 2)) * sh * .25, (sw - 28) / 9, 4); }
      else { text(g, '🔒', x, sy + sh / 2, { s: 40, c: '#555' }); }
      // LED de estado
      const led = solved ? col : unl ? '#ff4466' : '#3a3346'; const pulse = !solved && unl && !rm() ? .75 + .25 * Math.sin(tm * 4) : 1; g.globalAlpha = pulse; glow(g, x, y + ph * .78, Math.min(40, 12 / cam.s), led, .9); g.fillStyle = led; g.beginPath(); g.arc(x, y + ph * .78, 9, 0, 7); g.fill(); g.globalAlpha = 1; // LED: estado y punto iguales; halo ≤ 12 px CSS, pulso .75–1, estable con «reducir movimiento»
      if (meta) { const fr = [0, 1, 2, 3].map(f => CORE.isSolved(CORE.MOD_PUZ[mod][f])); fr.forEach((o, i) => { g.fillStyle = o ? DR.FRAG_COL[i] : 'rgba(255,255,255,.08)'; rrect(g, x - 70 + i * 37, y + ph * .86, 30, 16, 5); g.fill(); }); }
      st.hot.push({ id, x: x - pw / 2, y, w: pw, h: ph, cx: x });
    });
    // astronauta
    const ax = st.ax; TS = 110; const moving = Math.abs(st.ax - st.tx) > 2; drawAstro(g, ax, 690, st.face || 'r', st.ph, moving ? 1 : 0, 0, tm, mod === 'observatorio' && CORE.isSolved('final') ? (tm % 3) : 0);
    g.restore();
    // etiquetas de paneles (en pantalla, nítidas)
    // el rótulo no puede pisar al del panel vecino (≈370 unidades de sala): todos se achican al mismo tamaño
    // (el que necesita el más largo, mínimo 9 px) y, si aun así no entra, ese se recorta con «…»
    const labOf = (id) => { const P0 = CORE.C.puzzles[id]; return (P0.meta ? '◆ ' : '') + shortId(id) + ' ' + I18N.L2(P0.t).toUpperCase(); };
    const maxW = 370 * cam.s - 14; let fsAll = Math.max(10, Math.min(13, cam.s * 30));
    st.hot.forEach(hh => { const lb = labOf(hh.id); g.font = `700 ${fsAll}px ${COL.mono}`; while (fsAll > 9 && g.measureText(lb).width + 16 > maxW) { fsAll -= .5; g.font = `700 ${fsAll}px ${COL.mono}`; } });
    st.hot.forEach(hh => {
      const sxp = cam.ox - st.px + hh.cx * cam.s, syp = cam.top + hh.y * cam.s - 14; if (sxp < -100 || sxp > w + 100) return;
      let lab = labOf(hh.id); const fs = fsAll; g.font = `700 ${fs}px ${COL.mono}`;
      if (g.measureText(lab).width + 16 > maxW) { while (lab.length > 6 && g.measureText(lab + '…').width + 16 > maxW) lab = lab.slice(0, -1); lab = lab.trimEnd() + '…'; }
      const tw = g.measureText(lab).width + 16;
      g.fillStyle = 'rgba(8,4,18,.82)'; rrect(g, sxp - tw / 2, syp - fs - 4, tw, fs + 10, 6); g.fill(); g.strokeStyle = CORE.isSolved(hh.id) ? hexA(col, .7) : 'rgba(255,255,255,.12)'; g.stroke();
      text(g, lab, sxp, syp - fs / 2 + 1, { s: fs, w: 700, c: CORE.isSolved(hh.id) ? col : COL.ink });
    });
    // velo de emergencia
    if (done < 1) { g.fillStyle = hexA(emerg, (1 - done) * .06 * (0.7 + .3 * Math.sin(tm * 1.5))); g.fillRect(0, 0, w, h); }
    dustLayer(g, w, h, tm, mod === 'energia' && done < 1 ? '255,180,160' : '255,240,220');
  }
  function shortId(id) { return { p1: 'P1', p2: 'P2', p3: 'P3', final: '★' }[id] || id.toUpperCase().replace('O2-', 'O2·').replace('EN-', 'EN·').replace('CO-', 'CO·').replace('NA-', 'NA·').replace('AR-', 'AR·').replace('TR-', 'TR·').replace('·META', '').replace('-META', ''); }
  function props(g, mod, tm, p, col) {
    const R = rm();
    if (mod === 'oxigeno') {
      for (let i = 0; i < 9; i++) { const x = 60 + i * 240, y = 620; g.fillStyle = '#16302a'; rrect(g, x, y, 200, 40, 8); g.fill(); for (let k = 0; k < 6; k++) { const px = x + 20 + k * 32, hh = 30 + 40 * p * (.6 + .4 * Math.sin(i + k)); g.strokeStyle = mix('#5a4a2a', '#3fe0b0', p); g.lineWidth = 4; g.beginPath(); g.moveTo(px, y); g.quadraticCurveTo(px + (R ? 0 : Math.sin(tm + k) * 6), y - hh / 2, px + 4, y - hh); g.stroke(); } }
      ['#00f2cf', '#b46bff', '#ffb347', '#ff6fae'].forEach((c, i) => { g.strokeStyle = hexA(c, .25 + p * .5); g.lineWidth = 10; g.beginPath(); g.moveTo(0, 80 + i * 16); g.lineTo(RW, 80 + i * 16); g.stroke(); });
      for (let i = 0; i < 4; i++) { const x = 160 + i * 560; g.fillStyle = 'rgba(120,220,255,.08)'; rrect(g, x, 120, 34, 160, 17); g.fill(); if (p > 0 && !R) for (let k = 0; k < 5; k++) { g.strokeStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(x + 17 + Math.sin(tm * 2 + k) * 6, 270 - ((tm * 30 * p + k * 30) % 150), 3, 0, 7); g.stroke(); } }
    } else if (mod === 'energia') {
      const X = 1050, Y = 170, Rr = 110; g.fillStyle = '#1a1208'; g.beginPath(); g.arc(X, Y, Rr + 14, 0, 7); g.fill(); g.save(); g.translate(X, Y); g.rotate(R ? 0 : tm * p * 4); for (let k = 0; k < 6; k++) { g.rotate(Math.PI / 3); g.fillStyle = mix('#3a2a12', '#ffb347', p); g.beginPath(); g.ellipse(Rr * .5, 0, Rr * .5, Rr * .12, 0, 0, 7); g.fill(); } g.restore();
      for (let i = 0; i < 6; i++) { const y = 120 + i * 18; g.strokeStyle = '#2a2014'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, y); g.lineTo(RW, y); g.stroke(); if (p > i / 6) { g.strokeStyle = 'rgba(255,190,90,.6)'; g.lineWidth = 2; g.setLineDash([30, 60]); g.lineDashOffset = -tm * 200; g.beginPath(); g.moveTo(0, y); g.lineTo(RW, y); g.stroke(); g.setLineDash([]); } }
    } else if (mod === 'comunicaciones') {
      g.fillStyle = '#02040c'; rrect(g, 850, 70, 400, 150, 20); g.fill(); starfieldRect(g, 850, 70, 400, 150, tm); g.save(); g.translate(1050, 220); g.strokeStyle = '#8a92b0'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -100); g.stroke(); g.rotate(R ? 0 : Math.sin(tm * .3 * (p + .1)) * .6); g.beginPath(); g.ellipse(0, -110, 60, 18, 0, 0, Math.PI); g.stroke(); g.restore();
      for (let i = 0; i < 4; i++) { const x = 120 + i * 520; g.fillStyle = '#071a18'; rrect(g, x, 560, 160, 90, 8); g.fill(); g.strokeStyle = hexA('#00f2cf', .2 + p * .7); g.lineWidth = 2; g.beginPath(); for (let k = 0; k <= 40; k++) { const xx = x + 8 + k * 3.6, yy = 605 + Math.sin(k * .5 + tm * 4 + i) * 20 * p; k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); }
    } else if (mod === 'navegacion' || mod === 'observatorio') {
      g.save(); g.beginPath(); g.ellipse(1050, 140, 800, 220, 0, Math.PI, 0); g.closePath(); g.fillStyle = '#02040e'; g.fill(); g.clip(); g.translate(1050, 300); g.rotate(R ? 0 : tm * .01 * (p + .2)); for (let i = 0; i < 220; i++) { const a = i * 2.39996, r = Math.sqrt(i / 220) * 820; g.fillStyle = `rgba(220,230,255,${.3 + .5 * ((i * 7) % 10) / 10})`; g.fillRect(Math.cos(a) * r, Math.sin(a) * r, 2, 2); } g.restore();
      if (mod === 'observatorio') { g.fillStyle = '#141838'; rrect(g, 850, 560, 400, 70, 14); g.fill(); g.strokeStyle = hexA('#eef3ff', .4); g.stroke(); }
      else for (let i = 0; i < 2; i++) { const x = i ? 1700 : 400; g.fillStyle = '#2a2f40'; g.beginPath(); g.arc(x, 200, 74, 0, 7); g.fill(); g.fillStyle = '#01030c'; g.beginPath(); g.arc(x, 200, 60, 0, 7); g.fill(); starfieldRect(g, x - 60, 140, 120, 120, tm); }
    } else if (mod === 'archivo') {
      for (let i = 0; i < 6; i++) { const x = 40 + i * 360; g.fillStyle = '#20160c'; g.fillRect(x, 90, 300, 440); for (let r = 0; r < 4; r++) { g.fillStyle = '#3a2814'; g.fillRect(x, 90 + r * 110 + 100, 300, 10); const lit = p * 6 > i; for (let k = 0; k < 9; k++) { g.fillStyle = lit ? ['#c96', '#a85', '#d8a', '#7ab', '#cb6'][(k + r + i) % 5] : '#2a2018'; g.fillRect(x + 14 + k * 31, 90 + r * 110 + 30, 24, 70); } } }
      glow(g, 1050, 660, 260, '#ffd28a', .3 + p * .5);
    } else if (mod === 'tripulacion') {
      for (let i = 0; i < 7; i++) { const x = 60 + i * 290; g.fillStyle = '#1c1430'; rrect(g, x, 120, 240, 120, 10); g.fill(); g.fillStyle = '#2c2148'; g.fillRect(x + 10, 200, 220, 30); text(g, String(i + 1), x + 24, 140, { s: 22, w: 800, c: 'rgba(200,180,255,.5)' }); if (p * 7 > i) glow(g, x + 200, 150, 70, '#ffe6b0', .7); }
    } else if (mod === 'prologo') {
      const open = CORE.isSolved('p1'); g.fillStyle = '#141028'; rrect(g, 220, 460, 400, 240, 100); g.fill(); g.fillStyle = open ? 'rgba(90,140,255,.25)' : 'rgba(200,215,240,.5)'; rrect(g, 250, 480, 340, 200, 90); g.fill();
      if (CORE.isSolved('p2')) glow(g, 1050, 120, 500, '#fff1c0', .5);
    }
  }
  function starfieldRect(g, x, y, w, h, tm) { for (let i = 0; i < 30; i++) { const sx = x + ((i * 97) % 100) / 100 * w, sy = y + ((i * 61) % 100) / 100 * h; g.fillStyle = `rgba(230,235,255,${.4 + .3 * Math.sin(tm + i)})`; g.fillRect(sx, sy, 1.6, 1.6); } }

  // ---------- Anillo (Hub) ----------
  const ICON = {
    oxigeno: (g, s) => { g.beginPath(); g.arc(0, 0, s * .32, 0, 7); g.stroke(); g.beginPath(); g.arc(-s * .1, -s * .05, s * .1, 0, 7); g.stroke(); g.beginPath(); g.arc(s * .14, s * .1, s * .07, 0, 7); g.stroke(); },
    energia: (g, s) => { g.beginPath(); g.moveTo(s * .08, -s * .38); g.lineTo(-s * .18, s * .05); g.lineTo(0, s * .05); g.lineTo(-s * .08, s * .38); g.lineTo(s * .2, -s * .06); g.lineTo(0, -s * .06); g.closePath(); g.stroke(); },
    comunicaciones: (g, s) => { for (let k = 1; k <= 3; k++) { g.beginPath(); g.arc(-s * .2, s * .2, s * .14 * k, -Math.PI / 2, 0); g.stroke(); } },
    navegacion: (g, s) => { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? s * .14 : s * .36; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.stroke(); },
    archivo: (g, s) => { g.strokeRect(-s * .3, -s * .3, s * .6, s * .6); g.beginPath(); g.moveTo(-s * .3, -s * .1); g.lineTo(s * .3, -s * .1); g.moveTo(-s * .3, s * .1); g.lineTo(s * .3, s * .1); g.stroke(); },
    tripulacion: (g, s) => { g.beginPath(); g.arc(-s * .14, -s * .12, s * .1, 0, 7); g.arc(s * .14, -s * .12, s * .1, 0, 7); g.stroke(); g.beginPath(); g.arc(-s * .14, s * .25, s * .17, Math.PI, 0); g.stroke(); g.beginPath(); g.arc(s * .14, s * .25, s * .17, Math.PI, 0); g.stroke(); },
  };
  function hub(g, w, h, tm, st) {
    g.fillStyle = '#04010a'; g.fillRect(0, 0, w, h); starfield(g, w, h, tm, .7);
    const top = st.top, bot = st.bot; const X = w / 2, Y = top + (h - top - bot) / 2; const R = Math.min(w * .44, (h - top - bot) * .44); st.ring = { X, Y, R };
    const allLit = CORE.G.metas.energia; const pulse = .5 + .5 * Math.sin(tm * 2);
    // anillo (VIS-ESTACION-02): base #152333 con borde #52677E de 1 px; sectores y radios de impacto (.36/.45/1.0) intactos
    g.strokeStyle = allLit ? '#1B2C40' : '#152333'; g.lineWidth = R * .5; g.beginPath(); g.arc(X, Y, R * .72, 0, 7); g.stroke();
    g.strokeStyle = '#52677E'; g.lineWidth = 1; [R * .47, R * .97].forEach(rr => { g.beginPath(); g.arc(X, Y, rr, 0, 7); g.stroke(); });
    st.sectors = [];
    CORE.MODS.forEach((m, i) => {
      const a0 = -Math.PI / 2 - Math.PI / 6 + i * Math.PI / 3 + .03, a1 = a0 + Math.PI / 3 - .06, am = (a0 + a1) / 2; const unl = CORE.modUnlocked(m), done = CORE.G.metas[m], col = CORE.MOD_COL[m];
      const hov = st.hover === m;
      g.beginPath(); g.arc(X, Y, R * .97, a0, a1); g.arc(X, Y, R * .47, a1, a0, true); g.closePath();
      // bloqueado #101925/#344454 · disponible #253249/#9DAFCA (hover sólo +.06 de relleno y borde 2 px, sin pulso) · completo MOD_COL a .20 y borde 1.5 px
      g.fillStyle = done ? hexA(col, .20 + (hov ? .06 : 0)) : unl ? (hov ? '#2B3A54' : '#253249') : '#101925'; g.fill();
      g.strokeStyle = done ? col : unl ? '#9DAFCA' : '#344454'; g.lineWidth = hov ? 2 : done ? 1.5 : unl ? 1.5 : 1; g.stroke();
      if (done) { g.save(); g.clip(); glow(g, X + Math.cos(am) * R * .72, Y + Math.sin(am) * R * .72, R * .4, col, .35); g.restore(); }
      const ix = X + Math.cos(am) * R * .76, iy = Y + Math.sin(am) * R * .76; const s = R * .26;
      g.save(); g.translate(ix, iy - s * .25); g.strokeStyle = done ? col : unl ? '#e6dcff' : '#4a4458'; g.lineWidth = Math.min(2, Math.max(1.5, s * .07)); g.lineJoin = 'round'; g.lineCap = 'round'; ICON[m](g, s); g.restore();
      const fs = Math.max(12, Math.min(14, R * .075)); const nmM = I18N.t('m.' + m).toUpperCase(); text(g, nmM, ix, iy + s * .32, { s: fit(g, nmM, R * .44, fs, { w: 600, f: 'pop' }), w: 600, f: 'pop', c: done ? col : unl ? COL.ink : '#5a5468' });
      if (!unl) { const sl = '🔒 ' + I18N.t(m === 'energia' ? 'sealed.pressure' : 'sealed.power'); text(g, sl, ix, iy + s * .32 + fs * 1.3, { s: fit(g, sl, R * .44, fs * .82), c: '#6a6478' }); }
      else { const n = CORE.modProgress(m); g.lineWidth = 1; g.strokeStyle = 'rgba(157,175,202,.9)'; for (let k = 0; k < 4; k++) { g.fillStyle = CORE.isSolved(CORE.MOD_PUZ[m][k]) ? col : 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(ix - 22 + k * 11, iy + s * .32 + fs * 1.3, 3.2, 0, 7); g.fill(); g.stroke(); } g.fillStyle = done ? col : 'rgba(255,255,255,.12)'; g.save(); g.translate(ix + 26, iy + s * .32 + fs * 1.3); g.rotate(Math.PI / 4); g.fillRect(-3.5, -3.5, 7, 7); g.strokeRect(-3.5, -3.5, 7, 7); g.restore(); void n; }
      st.sectors.push({ m, a0, a1 });
    });
    // núcleo: observatorio
    const obs = CORE.modUnlocked('observatorio'); const cr = R * .36; g.fillStyle = obs ? '#141838' : '#0a0716'; g.beginPath(); g.arc(X, Y, cr, 0, 7); g.fill(); g.strokeStyle = obs ? '#eef3ff' : 'rgba(255,255,255,.1)'; g.lineWidth = 2; g.stroke(); if (obs) glow(g, X, Y, cr + 8, '#eef3ff', .15 + (rm() ? 0 : .05 * pulse)); // halo ≤ 8 px y alfa ≈ .15: no tapa los nombres // el borde se traza antes del halo: glow() abre un trazado nuevo de radio 1,6·cr y el stroke lo dibujaba como un aro blanco sobre los nombres
    g.save(); g.beginPath(); g.arc(X, Y, cr - 3, 0, 7); g.clip(); for (let i = 0; i < 40; i++) { const a = i * 2.4, r = Math.sqrt(i / 40) * cr; g.fillStyle = `rgba(230,235,255,${obs ? .7 : .15})`; g.fillRect(X + Math.cos(a + tm * .05) * r, Y + Math.sin(a + tm * .05) * r, 1.6, 1.6); } g.restore();
    text(g, I18N.t('m.observatorio').toUpperCase(), X, Y + cr * .55, { s: Math.max(9, R * .055), w: 700, c: obs ? '#eef3ff' : '#4a4458' });
    // astronauta flotando en el sector actual
    const cur = st.cur || 'oxigeno'; const ci = CORE.MODS.indexOf(cur); const am = ci >= 0 ? -Math.PI / 2 + ci * Math.PI / 3 : Math.PI / 2;
    const tx = X + Math.cos(am) * R * .4, ty = Y + Math.sin(am) * R * .4; st.astro ||= { x: tx, y: ty }; st.astro.x += (tx - st.astro.x) * .08; st.astro.y += (ty - st.astro.y) * .08;
    TS = Math.max(26, R * .14); drawAstro(g, st.astro.x, st.astro.y + Math.sin(tm * 1.5) * 4, 'd', 0, 0, 0, tm, 0);
    if (st.firstHint) { const a = -Math.PI / 2; const x = X + Math.cos(a) * R * 1.02, y = Y + Math.sin(a) * R * 1.02 - 6; const msg = I18N.t('hub.first'), o = { s: 11, c: '#e8fff8', bg: 'rgba(10,40,36,.92)' }; g.font = `700 11px ${DR.COL.mono}`; if (g.measureText(msg).width + 16 <= w - 24) DR.chip(g, msg, x, Math.max(top + 16, y - 10), o); else { const k = msg.indexOf('. ') + 1 || Math.ceil(msg.length / 2); const yy = Math.max(top + 28, y - 22); DR.chip(g, msg.slice(0, k).trim(), x, yy - 13, o); DR.chip(g, msg.slice(k).trim(), x, yy + 13, o); } }
  }
  function hubHit(st, x, y) { const r = st.ring; if (!r) return null; const d = Math.hypot(x - r.X, y - r.Y); if (d < r.R * .36) return 'observatorio'; if (d > r.R * 1.0 || d < r.R * .45) return null; let a = Math.atan2(y - r.Y, x - r.X); for (const s of st.sectors) { let aa = a; while (aa < s.a0) aa += Math.PI * 2; if (aa <= s.a1) return s.m; } return null; }

  // ---------- placa del traje (glifos de estrellas → letras) ----------
  function plateGlyph(g, ch, x, y, s, reveal, col) {
    const gl = CORE.C.glyph[ch]; if (!gl) return; const sc = s / 7;
    if (reveal > 0) { g.strokeStyle = hexA(col || COL.cy, Math.min(1, reveal)); g.lineWidth = Math.max(1.5, s * .06); g.beginPath(); gl.forEach(([gx, gy], i) => { const px = x - 2 * sc + gx * sc, py = y - 3 * sc + gy * sc; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke(); }
    gl.forEach(([gx, gy], i) => { const px = x - 2 * sc + gx * sc, py = y - 3 * sc + gy * sc; g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py, Math.max(1, s * .055 * (1.4 - i * .1)), 0, 7); g.fill(); });
  }
  return { RW, RH, PANELS, home, room, hub, hubHit, camFor, earth, starfield, dustLayer, plateGlyph, prog, shortId };
})();
window.SC = SC;
