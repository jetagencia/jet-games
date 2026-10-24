// JET//Caja Negra · dibujo en Canvas 2D: fondo animado, caja negra del inicio, foto de cabina y telemetría.
// Todo propio. Los astronautas son el oficial de JET//Games (astronauta-oficial.js, drawAstro + rr) sin rediseñar:
// solo se escala y se le añade encima el parche numerado del brazo.
(function (G) {
  'use strict';
  const D = {};
  const DPR = () => Math.min(3, G.devicePixelRatio || 1);

  // ───────────── Iconos SVG propios ─────────────
  const ic = (p, vb) => '<svg viewBox="' + (vb || '0 0 24 24') + '" aria-hidden="true" focusable="false">' + p + '</svg>';
  D.ICON = {
    bitacora: ic('<rect x="5" y="3.5" width="14" height="17.5" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 3.5h6v3H9z" fill="currentColor"/><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'),
    foto: ic('<rect x="3" y="7" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 7l1.6-2.6h3.8L15.5 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="13.4" r="3.6" fill="none" stroke="currentColor" stroke-width="1.8"/>'),
    telemetria: ic('<path d="M3 19.5h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M3.5 15l4-4 3.5 3 3.2-6.5 3 4.5 3.3-2.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'),
    radio: ic('<circle cx="12" cy="13" r="2.2" fill="currentColor"/><path d="M8.2 9.2a5.4 5.4 0 0 0 0 7.6M15.8 9.2a5.4 5.4 0 0 1 0 7.6M5.4 6.4a9.4 9.4 0 0 0 0 13.2M18.6 6.4a9.4 9.4 0 0 1 0 13.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'),
    mantenimiento: ic('<path d="M14.6 4.2a4.6 4.6 0 0 0-5.3 6.2L4 15.7a2 2 0 0 0 2.8 2.8l5.3-5.3a4.6 4.6 0 0 0 6.2-5.3l-2.9 2.9-2.4-.5-.5-2.4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'),
    tripulacion: ic('<circle cx="9" cy="8.5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 19.5c.6-3.4 2.8-5.2 5.5-5.2s4.9 1.8 5.5 5.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16.5" cy="9.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 14.4c2.4 0 4 1.5 4.6 4.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'),
    persona: ic('<circle cx="12" cy="8" r="3.6" fill="currentColor"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6z" fill="currentColor"/>'),
    lugar: ic('<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" fill="currentColor"/><circle cx="12" cy="10" r="2.4" fill="#0a0418"/>'),
    hora: ic('<circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
    sistema: ic('<path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zm8 4.6v-2.4l-2.3-.5a6 6 0 0 0-.7-1.6l1.3-2-1.7-1.7-2 1.3a6 6 0 0 0-1.6-.7L12.5 3h-2.4l-.5 2.3a6 6 0 0 0-1.6.7l-2-1.3-1.7 1.7 1.3 2a6 6 0 0 0-.7 1.6L2.6 10.8v2.4l2.3.5a6 6 0 0 0 .7 1.6l-1.3 2 1.7 1.7 2-1.3a6 6 0 0 0 1.6.7l.5 2.3h2.4l.5-2.3a6 6 0 0 0 1.6-.7l2 1.3 1.7-1.7-1.3-2a6 6 0 0 0 .7-1.6z" fill="currentColor"/>'),
    accion: ic('<path d="M4 12h12.5M12.5 6.5L18 12l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
    causa: ic('<circle cx="10.5" cy="10.5" r="5.6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M14.8 14.8L20 20" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>'),
    consecuencia: ic('<path d="M12 3l7 2.8v5.4c0 4.6-3 8.3-7 9.8-4-1.5-7-5.2-7-9.8V5.8z" fill="currentColor"/>'),
    engranaje: ic('<path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zm8 4.6v-2.4l-2.3-.5a6 6 0 0 0-.7-1.6l1.3-2-1.7-1.7-2 1.3a6 6 0 0 0-1.6-.7L12.5 3h-2.4l-.5 2.3a6 6 0 0 0-1.6.7l-2-1.3-1.7 1.7 1.3 2a6 6 0 0 0-.7 1.6L2.6 10.8v2.4l2.3.5a6 6 0 0 0 .7 1.6l-1.3 2 1.7 1.7 2-1.3a6 6 0 0 0 1.6.7l.5 2.3h2.4l.5-2.3a6 6 0 0 0 1.6-.7l2 1.3 1.7-1.7-1.3-2a6 6 0 0 0 .7-1.6z" fill="currentColor"/>'),
    pausa: ic('<rect x="6.5" y="5" width="3.8" height="14" rx="1.2" fill="currentColor"/><rect x="13.7" y="5" width="3.8" height="14" rx="1.2" fill="currentColor"/>'),
    pantalla: ic('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
    salirPantalla: ic('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
    cerrar: ic('<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'),
    atras: ic('<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'),
    historial: ic('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 4.5v4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8v4.3l2.8 1.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
    compartir: ic('<circle cx="18" cy="5.5" r="2.6" fill="currentColor"/><circle cx="6" cy="12" r="2.6" fill="currentColor"/><circle cx="18" cy="18.5" r="2.6" fill="currentColor"/><path d="M8.3 10.8l7.4-4M8.3 13.2l7.4 4" stroke="currentColor" stroke-width="1.8"/>'),
    candado: ic('<rect x="5" y="10.5" width="14" height="10" rx="2.4" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.2"/>'),
    estrella: ic('<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="currentColor"/>'),
    play: ic('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>'),
    ojo: ic('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'),
    tabla: ic('<rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.5h17M3.5 14.5h17M10 4.5v15" stroke="currentColor" stroke-width="1.6"/>'),
    lupa: ic('<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15 15l5 5M8 10.5h5M10.5 8v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
    volumen: ic('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>'),
    carpeta: ic('<path d="M3 7.5a2 2 0 0 1 2-2h4.5l2 2.2H19a2 2 0 0 1 2 2v8.8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor"/>'),
    fuego: ic('<path d="M12.5 2.5c.6 3.2-1.8 4.6-3.1 6.6-1.4 2.1-1.7 4.7.1 6.6-1.7-.5-2.9-1.9-3.1-3.6-1.6 2.3-1.3 5.8 1.2 7.6 2.6 1.9 7.3 1.4 9.1-1.7 2.2-3.7.2-7.3-1.8-9.6.1 1.6-.4 3-1.6 3.8.9-3.6-.1-7.3-.8-9.7z" fill="currentColor"/>')
  };

  // ───────────── Fondo: polvo de estrellas y retícula técnica ─────────────
  D.fondo = function (cv, opts) {
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, raf = 0, ultimo = 0;
    const est = [];
    let s = 1234567;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 160; i++) est.push({ x: rnd(), y: rnd(), r: rnd() * 1.3 + 0.2, f: rnd() * 6.28, v: 0.4 + rnd() * 1.2 });
    function tam() {
      const d = DPR();
      w = G.innerWidth; h = G.innerHeight;
      cv.width = Math.round(w * d); cv.height = Math.round(h * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      dibujar(performance.now());
    }
    function dibujar(t) {
      const sec = t / 1000;
      ctx.fillStyle = '#050108'; ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w * 0.5, h * 0.18, 0, w * 0.5, h * 0.18, Math.max(w, h) * 0.9);
      g.addColorStop(0, 'rgba(119,0,244,.16)'); g.addColorStop(0.55, 'rgba(10,4,24,.4)'); g.addColorStop(1, 'rgba(5,1,8,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // retícula técnica (1 px/s)
      const paso = 48, off = opts.quieto() ? 0 : (sec % paso);
      ctx.strokeStyle = 'rgba(140,110,255,.055)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -paso + (off % paso); x < w + paso; x += paso) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, h); }
      for (let y = -paso + (off % paso); y < h + paso; y += paso) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(w, Math.round(y) + 0.5); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,242,207,.07)';
      for (let x = -paso + (off % paso); x < w + paso; x += paso * 4) for (let y = -paso + (off % paso); y < h + paso; y += paso * 4) ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      for (const e of est) {
        const a = opts.quieto() ? 0.55 : 0.35 + 0.35 * Math.sin(sec * e.v + e.f);
        ctx.fillStyle = 'rgba(245,240,255,' + a.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(e.x * w, e.y * h, e.r, 0, 6.283); ctx.fill();
      }
    }
    function bucle(t) {
      raf = 0;
      if (document.hidden) return;
      if (t - ultimo > 60) { dibujar(t); ultimo = t; }
      if (!opts.quieto()) raf = requestAnimationFrame(bucle);
    }
    return {
      tam,
      arrancar() { if (!raf) raf = requestAnimationFrame(bucle); },
      parar() { if (raf) cancelAnimationFrame(raf); raf = 0; },
      redibujar() { dibujar(performance.now()); }
    };
  };

  // ───────────── Caja negra en 3/4 (inicio) ─────────────
  function proyectar(p, ang, tilt, esc, cx, cy) {
    const ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(tilt), st = Math.sin(tilt);
    let x = p[0] * ca + p[2] * sa, z = -p[0] * sa + p[2] * ca, y = p[1];
    const y2 = y * ct - z * st, z2 = y * st + z * ct;
    const f = 4.2 / (4.2 + z2);
    return { x: cx + x * esc * f, y: cy + y2 * esc * f, z: z2 };
  }
  function bil(q, u, v) { // punto en un cuadrilátero (0..1, 0..1)
    const a = { x: q[0].x + (q[1].x - q[0].x) * u, y: q[0].y + (q[1].y - q[0].y) * u };
    const b = { x: q[3].x + (q[2].x - q[3].x) * u, y: q[3].y + (q[2].y - q[3].y) * u };
    return { x: a.x + (b.x - a.x) * v, y: a.y + (b.y - a.y) * v };
  }
  D.cajaNegra = function (ctx, w, h, t, opts) {
    opts = opts || {};
    const ang = opts.ang != null ? opts.ang : -0.62 + Math.sin(t * 0.00018) * 0.42;
    const tilt = (opts.tilt != null ? opts.tilt : 0.42);
    const esc = Math.min(w, h) * (opts.esc || 0.36);
    const cx = w / 2, cy = h / 2 + (opts.dy || 0);
    const A = 1.25, B = 0.82, C = 0.72; // medio ancho, medio alto, media profundidad
    const V = [[-A, -B, -C], [A, -B, -C], [A, B, -C], [-A, B, -C], [-A, -B, C], [A, -B, C], [A, B, C], [-A, B, C]].map((p) => proyectar(p, ang, tilt, esc, cx, cy));
    const caras = [
      { i: [4, 5, 6, 7], n: 'atras', base: '#110c22' },
      { i: [1, 0, 3, 2], n: 'frente', base: '#191233' },
      { i: [0, 4, 7, 3], n: 'izq', base: '#140e29' },
      { i: [5, 1, 2, 6], n: 'der', base: '#140e29' },
      { i: [0, 1, 5, 4], n: 'arriba', base: '#231a42' },
      { i: [7, 6, 2, 3], n: 'abajo', base: '#0b0817' }
    ];
    // sombra
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath(); ctx.ellipse(cx, cy + esc * 1.05, esc * 1.35, esc * 0.2, 0, 0, 6.283); ctx.fill();
    const halo = ctx.createRadialGradient(cx, cy, esc * 0.2, cx, cy, esc * 1.9);
    halo.addColorStop(0, 'rgba(0,242,207,.10)'); halo.addColorStop(1, 'rgba(0,242,207,0)');
    ctx.fillStyle = halo; ctx.fillRect(cx - esc * 2, cy - esc * 2, esc * 4, esc * 4);
    ctx.restore();
    const vis = caras.map((c) => {
      const q = c.i.map((k) => V[k]);
      const area = (q[1].x - q[0].x) * (q[2].y - q[0].y) - (q[1].y - q[0].y) * (q[2].x - q[0].x);
      return { c, q, area, z: q.reduce((a, p) => a + p.z, 0) / 4 };
    }).filter((f) => f.area < 0).sort((a, b) => b.z - a.z);
    for (const f of vis) {
      const q = f.q;
      ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y); for (let k = 1; k < 4; k++) ctx.lineTo(q[k].x, q[k].y); ctx.closePath();
      const gr = ctx.createLinearGradient(q[0].x, q[0].y, q[2].x, q[2].y);
      gr.addColorStop(0, f.c.base); gr.addColorStop(1, '#07050f');
      ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = 'rgba(119,0,244,.55)'; ctx.lineWidth = 1.4; ctx.stroke();
      // franjas cian
      ctx.strokeStyle = 'rgba(0,242,207,.75)'; ctx.lineWidth = Math.max(1.2, esc * 0.022);
      for (const v of [0.14, 0.86]) { const a = bil(q, 0.06, v), b = bil(q, 0.94, v); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      if (f.c.n === 'frente') {
        // sello violeta + rótulo
        ctx.beginPath();
        for (let k = 0; k <= 28; k++) { const a = (k / 28) * 6.283; const p = bil(q, 0.5 + Math.cos(a) * 0.17, 0.5 + Math.sin(a) * 0.26); if (k) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
        ctx.closePath();
        const sg = ctx.createRadialGradient(bil(q, 0.45, 0.42).x, bil(q, 0.45, 0.42).y, 1, bil(q, 0.5, 0.5).x, bil(q, 0.5, 0.5).y, esc * 0.4);
        sg.addColorStop(0, '#a64dff'); sg.addColorStop(1, '#4a00a0');
        ctx.fillStyle = sg; ctx.fill();
        ctx.strokeStyle = 'rgba(245,240,255,.5)'; ctx.lineWidth = 1; ctx.stroke();
        const c0 = bil(q, 0.5, 0.5);
        ctx.fillStyle = '#f5f0ff'; ctx.font = '800 ' + Math.round(esc * 0.13) + 'px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('//', c0.x, c0.y);
      }
      if (f.c.n === 'arriba') {
        // asa
        const a = bil(q, 0.32, 0.5), b = bil(q, 0.68, 0.5);
        ctx.strokeStyle = 'rgba(181,168,216,.55)'; ctx.lineWidth = esc * 0.05; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      // brillo especular
      const br = ctx.createLinearGradient(q[0].x, q[0].y, q[1].x, q[1].y);
      const ph = (Math.sin(t * 0.0006) + 1) / 2;
      br.addColorStop(Math.max(0, ph - 0.2), 'rgba(255,255,255,0)'); br.addColorStop(ph, 'rgba(255,255,255,.07)'); br.addColorStop(Math.min(1, ph + 0.2), 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y); for (let k = 1; k < 4; k++) ctx.lineTo(q[k].x, q[k].y); ctx.closePath();
      ctx.fillStyle = br; ctx.fill();
    }
  };

  // ───────────── Foto de la cámara interior ─────────────
  const COLOR_PARCHE = ['#00f2cf', '#ffd166', '#ff7aa2', '#8f6bff', '#9be564', '#4cc9f0', '#ff9f5a', '#f78bff', '#f5f0ff'];
  function rndSemilla(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

  // Dibuja la escena en un lienzo propio de 1200×900 (se cachea por caso).
  // opts.post=false devuelve solo la evidencia (sin acabado de cámara) para comparar que el acabado no borra nada.
  D.escenaFoto = function (datos, lang, opts) {
    const post = !(opts && opts.post === false);
    const W = 1200, H = 900;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const R = rndSemilla(datos.semilla);
    // pared
    let g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#221a3e'); g.addColorStop(0.62, '#171130'); g.addColorStop(1, '#0d0a1c');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // paneles de pared
    c.strokeStyle = 'rgba(181,168,216,.10)'; c.lineWidth = 2;
    for (let x = 0; x <= W; x += 150) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 610); c.stroke(); }
    c.beginPath(); c.moveTo(0, 300); c.lineTo(W, 300); c.stroke();
    for (let x = 75; x < W; x += 150) for (const y of [40, 270, 330, 580]) { c.fillStyle = 'rgba(181,168,216,.18)'; c.beginPath(); c.arc(x, y, 3, 0, 6.283); c.fill(); }
    // ventanal
    const vx = 400, vy = 70, vw = 400, vh = 210;
    c.save();
    rr(c, vx, vy, vw, vh, 60); c.clip();
    c.fillStyle = '#02010a'; c.fillRect(vx, vy, vw, vh);
    for (let i = 0; i < 70; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + R() * 0.7).toFixed(2) + ')'; c.fillRect(vx + R() * vw, vy + R() * vh, R() < 0.15 ? 2 : 1, R() < 0.15 ? 2 : 1); }
    if (datos.cuerpo === 'luna') {
      const lg = c.createRadialGradient(vx + 260, vy + 330, 40, vx + 260, vy + 380, 320);
      lg.addColorStop(0, '#d9d6e6'); lg.addColorStop(1, '#5d5975');
      c.fillStyle = lg; c.beginPath(); c.arc(vx + 230, vy + 420, 300, 0, 6.283); c.fill();
      for (let i = 0; i < 14; i++) { c.fillStyle = 'rgba(60,55,80,.35)'; c.beginPath(); c.arc(vx + 60 + R() * 330, vy + 140 + R() * 80, 4 + R() * 14, 0, 6.283); c.fill(); }
    } else {
      const eg = c.createRadialGradient(vx + 240, vy + 300, 30, vx + 220, vy + 380, 320);
      eg.addColorStop(0, '#5fb8ff'); eg.addColorStop(0.55, '#1d5fbf'); eg.addColorStop(1, '#0a1f4d');
      c.fillStyle = eg; c.beginPath(); c.arc(vx + 210, vy + 430, 310, 0, 6.283); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 7; c.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const yy = vy + 150 + R() * 70; const xx = vx + 20 + R() * 300; c.beginPath(); c.moveTo(xx, yy); c.quadraticCurveTo(xx + 40, yy - 8, xx + 80 + R() * 60, yy + 4); c.stroke(); }
      c.strokeStyle = 'rgba(120,200,255,.6)'; c.lineWidth = 6; c.beginPath(); c.arc(vx + 210, vy + 430, 312, 3.6, 5.9); c.stroke();
    }
    const vgl = c.createLinearGradient(vx, vy, vx + vw, vy + vh); vgl.addColorStop(0, 'rgba(255,255,255,.10)'); vgl.addColorStop(0.4, 'rgba(255,255,255,0)');
    c.fillStyle = vgl; c.fillRect(vx, vy, vw, vh);
    c.restore();
    c.strokeStyle = '#3a2f62'; c.lineWidth = 14; rr(c, vx, vy, vw, vh, 60); c.stroke();
    c.strokeStyle = 'rgba(0,242,207,.35)'; c.lineWidth = 2; rr(c, vx - 9, vy - 9, vw + 18, vh + 18, 66); c.stroke();
    // placa del módulo
    const placa = datos.placa[lang] || datos.placa.es;
    c.font = '700 30px JetBrains Mono, monospace';
    const pw = Math.max(230, c.measureText(placa).width + 56);
    rr(c, 60, 92, pw, 70, 10); c.fillStyle = '#0c0919'; c.fill(); c.strokeStyle = 'rgba(119,0,244,.8)'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#7700f4'; c.fillRect(60, 92, 10, 70);
    c.fillStyle = '#e9e2ff'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText(placa, 88, 128);
    // reloj de pared
    rr(c, 900, 92, 240, 96, 14); c.fillStyle = '#05040c'; c.fill(); c.strokeStyle = 'rgba(181,168,216,.4)'; c.lineWidth = 3; c.stroke();
    c.font = '700 64px JetBrains Mono, monospace'; c.textAlign = 'center';
    c.fillStyle = 'rgba(0,242,207,.12)'; c.fillText('88:88', 1020, 142);
    c.shadowColor = 'rgba(0,242,207,.8)'; c.shadowBlur = 16; c.fillStyle = '#00f2cf'; c.fillText(datos.reloj, 1020, 142); c.shadowBlur = 0;
    // luz de alarma
    if (datos.objetos.includes('alarma')) {
      const ag = c.createRadialGradient(330, 60, 2, 330, 60, 120); ag.addColorStop(0, 'rgba(255,68,102,.65)'); ag.addColorStop(1, 'rgba(255,68,102,0)');
      c.fillStyle = ag; c.fillRect(200, 0, 260, 200);
      c.fillStyle = '#ff4466'; rr(c, 312, 40, 36, 30, 8); c.fill();
    }
    // consolas
    g = c.createLinearGradient(0, 600, 0, H); g.addColorStop(0, '#2b2250'); g.addColorStop(1, '#130e26');
    c.fillStyle = g; c.fillRect(0, 610, W, H - 610);
    c.fillStyle = '#0e0a1d'; c.fillRect(0, 600, W, 14);
    for (let i = 0; i < 8; i++) {
      const x = 30 + i * 145;
      rr(c, x, 640, 120, 60, 8); c.fillStyle = '#0a0716'; c.fill();
      for (let k = 0; k < 6; k++) { c.fillStyle = ['#00f2cf', '#7700f4', '#ffd166', '#2a2148'][Math.floor(R() * 4)]; c.fillRect(x + 12 + k * 17, 656 + (k % 2) * 16, 10, 8); }
    }
    // armario del kit (junto a quien lo prepara)
    const n = datos.astronautas.length;
    const xs = [];
    for (let i = 0; i < n; i++) xs.push(170 + (i + 0.5) * (860 / n));
    const iKit = datos.astronautas.findIndex((a) => a.kit);
    const kx = Math.min(W - 150, Math.max(30, xs[iKit] + (iKit < n / 2 ? -150 : 70)));
    rr(c, kx, 330, 110, 170, 8); c.fillStyle = '#100c20'; c.fill(); c.strokeStyle = 'rgba(181,168,216,.45)'; c.lineWidth = 3; c.stroke();
    c.strokeStyle = 'rgba(181,168,216,.25)'; c.lineWidth = 2; for (const yy of [385, 440]) { c.beginPath(); c.moveTo(kx + 10, yy); c.lineTo(kx + 100, yy); c.stroke(); }
    // puerta abierta del armario
    c.fillStyle = '#2a2148'; c.beginPath(); c.moveTo(kx + 110, 330); c.lineTo(kx + 150, 316); c.lineTo(kx + 150, 512); c.lineTo(kx + 110, 500); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,242,207,.6)'; c.stroke();
    c.fillStyle = '#ffd166'; c.font = '700 20px JetBrains Mono, monospace'; c.textAlign = 'center'; c.fillText('KIT', kx + 55, 352);
    // asientos
    for (let i = 0; i < n; i++) { const x = xs[i]; c.fillStyle = '#1d1638'; rr(c, x - 60, 520, 120, 90, 18); c.fill(); c.fillStyle = '#28204a'; rr(c, x - 70, 590, 140, 22, 8); c.fill(); }
    // objetos sueltos
    if (datos.objetos.includes('casco')) { const x = 120 + R() * 80; c.fillStyle = '#d9deef'; c.beginPath(); c.arc(x, 760, 34, 0, 6.283); c.fill(); c.fillStyle = '#00b8c8'; c.beginPath(); c.ellipse(x + 6, 760, 22, 16, 0, 0, 6.283); c.fill(); }
    if (datos.objetos.includes('tableta')) { c.fillStyle = '#0b0817'; rr(c, 980, 646, 90, 56, 8); c.fill(); c.fillStyle = 'rgba(0,242,207,.55)'; rr(c, 988, 654, 74, 40, 4); c.fill(); }
    if (datos.objetos.includes('botiquin')) { c.fillStyle = '#e9e2ff'; rr(c, 1080, 520, 80, 60, 8); c.fill(); c.fillStyle = '#00b894'; c.fillRect(1113, 530, 14, 40); c.fillRect(1100, 543, 40, 14); }
    if (datos.objetos.includes('cable')) { c.strokeStyle = '#ffd166'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 820); c.bezierCurveTo(200, 760, 350, 880, 560, 800); c.stroke(); }
    // astronautas oficiales, con parche numerado en el brazo
    const TS0 = G.TS;
    G.TS = 190;
    datos.astronautas.forEach((a, i) => {
      const x = xs[i], y = 470;
      drawAstro(c, x, y, 'd', 0, 0, a.kit ? 0.5 : 0, i * 0.7, 0);
      const u = G.TS / 100;
      const bob = Math.sin(i * 0.7 * 2.2) * 1.1; // el mismo balanceo que aplica drawAstro en reposo
      const px = x + 21 * u, py = y + ((a.kit ? 21 : 9) + bob) * u, pr = 10 * u;
      c.fillStyle = COLOR_PARCHE[(a.parche - 1) % COLOR_PARCHE.length];
      c.beginPath(); c.arc(px, py, pr, 0, 6.283); c.fill();
      c.lineWidth = 2; c.strokeStyle = '#0a0418'; c.stroke();
      c.fillStyle = '#0a0418'; c.font = '800 ' + Math.round(pr * 1.35) + 'px JetBrains Mono, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(a.parche), px, py + 1);
    });
    G.TS = TS0;
    // Acabado de cámara (VIS-CAJA-02): óptica limpia que no altera lo fotografiado.
    // Usa un RNG visual propio (no consume el RNG de la evidencia): viñeta máxima .28, grano ±4, sin aberración cromática.
    if (post) {
      const RV = rndSemilla(((datos.semilla >>> 0) ^ 0x9e3779b9) >>> 0);
      const vg = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
      const img = c.getImageData(0, 0, W, H); const d = img.data;
      for (let i = 0; i < d.length; i += 4) { const n2 = (RV() - 0.5) * 8; d[i] += n2; d[i + 1] += n2; d[i + 2] += n2; }
      c.putImageData(img, 0, 0);
    }
    // Marca documental CAM 02 / REC (se conserva; el marco pierde peso decorativo)
    c.font = '700 24px JetBrains Mono, monospace'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillStyle = 'rgba(245,240,255,.85)'; c.fillText('CAM 02 · ' + datos.reloj + ':' + String(7 + (datos.semilla % 50)).padStart(2, '0'), 34, H - 30);
    c.fillStyle = '#ff4466'; c.beginPath(); c.arc(W - 120, H - 38, 9, 0, 6.283); c.fill();
    c.fillStyle = 'rgba(245,240,255,.85)'; c.fillText('REC', W - 102, H - 30);
    // marcas de esquina
    c.strokeStyle = 'rgba(245,240,255,.4)'; c.lineWidth = 2;
    for (const [x, y, sx, sy] of [[24, 24, 1, 1], [W - 24, 24, -1, 1], [24, H - 70, 1, -1], [W - 24, H - 70, -1, -1]]) { c.beginPath(); c.moveTo(x, y + sy * 40); c.lineTo(x, y); c.lineTo(x + sx * 40, y); c.stroke(); }
    return cv;
  };

  // Descripción textual generada SOLO con lo que se ve.
  D.describirFoto = function (datos, lang) {
    const n = datos.astronautas.length;
    const nums = datos.astronautas.map((a) => a.parche);
    const kit = datos.astronautas.find((a) => a.kit);
    const lista = (arr, y) => arr.length === 1 ? String(arr[0]) : arr.slice(0, -1).join(', ') + ' ' + y + ' ' + arr[arr.length - 1];
    const obj = { es: { casco: 'un casco en el suelo', alarma: 'la luz de alarma encendida', tableta: 'una tableta sobre la consola', botiquin: 'un botiquín en la pared', cable: 'un cable suelto' }, en: { casco: 'a helmet on the floor', alarma: 'the alarm light on', tableta: 'a tablet on the console', botiquin: 'a first aid kit on the wall', cable: 'a loose cable' } }[lang];
    const nombres = { es: ['', 'Un astronauta', 'Dos astronautas', 'Tres astronautas', 'Cuatro astronautas', 'Cinco astronautas', 'Seis astronautas'], en: ['', 'One astronaut', 'Two astronauts', 'Three astronauts', 'Four astronauts', 'Five astronauts', 'Six astronauts'] }[lang];
    const placa = datos.placa[lang];
    if (lang === 'es') {
      return 'Placa del módulo: ' + placa + '. Reloj de pared: ' + datos.reloj + '. ' + nombres[n] + ', con parches ' + lista(nums, 'y') + '. Quien lleva el parche ' + kit.parche + ' está junto al armario del kit de reparación, abierto. También se ve ' + lista(datos.objetos.map((o) => obj[o]), 'y') + '.';
    }
    return 'Module sign: ' + placa + '. Wall clock: ' + datos.reloj + '. ' + nombres[n] + ', wearing patches ' + lista(nums, 'and') + '. The one with patch ' + kit.parche + ' is next to the repair kit cabinet, which is open. Also visible: ' + lista(datos.objetos.map((o) => obj[o]), 'and') + '.';
  };

  // ───────────── Telemetría ─────────────
  function ruido(seed, lane, t) {
    let x = Math.imul((seed ^ (lane * 0x9E3779B1) ^ (t * 0x85ebca6b)) >>> 0, 0x27d4eb2d) >>> 0;
    x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d) >>> 0; x ^= x >>> 12;
    return ((x >>> 0) / 4294967296) - 0.5;
  }
  D.valorSerie = function (datos, i, t) {
    const s = datos.series[i];
    const C = G.CNX.mundo.CANALES[s.canal];
    let v = C.base + ruido(datos.semilla, i, t) * C.ruido * 2;
    if (s.ondula) v = C.base * (1 + 0.035 * Math.sin((t - datos.t0) * 0.33 + i)) + ruido(datos.semilla, i, t) * C.ruido;
    if (s.cambio != null && t >= s.cambio) {
      const k = Math.min(1, (t - s.cambio + 1) / (datos.rampa + 1));
      const fin = C.fallo + ruido(datos.semilla, i + 9, t) * C.ruido * 3;
      v = v + (fin - v) * (1 - Math.pow(1 - k, 2));
    }
    return v;
  };
  D.fmtValor = function (canal, v, lang) {
    const C = G.CNX.mundo.CANALES[canal];
    const txt = v.toFixed(C.dec);
    return (lang === 'es' ? txt.replace('.', ',') : txt) + (C.u === '%' && lang === 'es' ? ' %' : C.u === '%' ? '%' : ' ' + C.u);
  };
  const hhmm = (m) => { const h = Math.floor(m / 60) % 24, mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; };
  D.hhmm = hhmm;

  // Dibuja la gráfica en el lienzo (tamaño CSS w×h). cursor = minuto o null. etiquetas = [{txt}] por carril.
  D.telemetria = function (cv, datos, lang, cursor, etiquetas, marcadas) {
    const d = DPR();
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const c = cv.getContext('2d');
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, w, h);
    const W = G.CNX.mundo;
    const n = datos.series.length;
    const L = 12, Rm = 14, T = 8, Bm = 30;
    const laneH = (h - T - Bm) / n;
    const x = (t) => L + ((t - datos.t0) / (datos.t1 - datos.t0)) * (w - L - Rm);
    // Acabado técnico (VIS-CAJA-03): rejilla neutra a 1 px, curva sólida sin degradado ni relleno, rótulos 12 px mono.
    const ART = { rejMayor: 'rgba(96,117,138,.22)', rejMenor: 'rgba(96,117,138,.10)', texto: '#CBD7E1', curva: '#83E1D1', cursor: '#ffd166', tipBg: 'rgba(22,32,44,.98)', tipBorde: 'rgba(255,209,102,.7)' };
    // rejilla temporal
    c.font = '500 12px JetBrains Mono, monospace'; c.textBaseline = 'top'; c.textAlign = 'center';
    c.lineWidth = 1;
    for (let t = Math.ceil(datos.t0 / 5) * 5; t <= datos.t1; t += 5) {
      const X = Math.round(x(t)) + 0.5;
      c.strokeStyle = t % 10 === 0 ? ART.rejMayor : ART.rejMenor;
      c.beginPath(); c.moveTo(X, T); c.lineTo(X, h - Bm + 4); c.stroke();
      if (t % 10 === 0) { c.fillStyle = ART.texto; c.fillText(hhmm(t), X, h - Bm + 9); }
    }
    datos.series.forEach((s, i) => {
      const C = W.CANALES[s.canal];
      const y0 = T + i * laneH, y1 = y0 + laneH;
      if (i % 2) { c.fillStyle = 'rgba(255,255,255,.018)'; c.fillRect(L, y0 + 2, w - L - Rm, laneH - 4); }
      const lo = Math.min(C.base, C.fallo), hi = Math.max(C.base, C.fallo);
      const pad = (hi - lo) * 0.18;
      const top = y0 + 26, bot = y1 - 10;
      const Y = (v) => bot - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * (bot - top);
      // etiqueta del carril (el color de una marca del usuario sigue siendo su identidad)
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.font = '600 12px JetBrains Mono, monospace';
      const et = etiquetas[i];
      const marc = marcadas && marcadas[i];
      c.fillStyle = marc ? marc : ART.texto;
      c.fillText(et.toUpperCase(), L + 8, y0 + 8);
      c.fillStyle = ART.texto; c.globalAlpha = 0.8; c.textAlign = 'right'; c.font = '500 12px JetBrains Mono, monospace';
      c.fillText(C.u, w - Rm - 6, y0 + 8);
      c.globalAlpha = 1;
      // curva
      c.strokeStyle = ART.curva; c.lineWidth = 2; c.lineJoin = 'round';
      c.beginPath();
      for (let t = datos.t0; t <= datos.t1; t++) { const X = x(t), YY = Y(D.valorSerie(datos, i, t)); if (t === datos.t0) c.moveTo(X, YY); else c.lineTo(X, YY); }
      c.stroke();
    });
    if (cursor != null) {
      const X = Math.round(x(cursor)) + 0.5;
      c.strokeStyle = 'rgba(255,209,102,.9)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(X, T); c.lineTo(X, h - Bm + 4); c.stroke();
      c.font = '700 12px JetBrains Mono, monospace';
      const filas = [hhmm(cursor)].concat(datos.series.map((s, i) => D.fmtValor(s.canal, D.valorSerie(datos, i, cursor), lang)));
      const PX = 8, PY = 6, BH = 12 + PY * 2;
      datos.series.forEach((s, i) => {
        const C = W.CANALES[s.canal];
        const y0 = T + i * laneH, y1 = y0 + laneH;
        const lo = Math.min(C.base, C.fallo), hi = Math.max(C.base, C.fallo), pad = (hi - lo) * 0.18;
        const top = y0 + 26, bot = y1 - 10;
        const YY = bot - ((D.valorSerie(datos, i, cursor) - (lo - pad)) / (hi - lo + 2 * pad)) * (bot - top);
        // punto 4 px con centro oscuro 1.5 px
        c.fillStyle = ART.cursor; c.beginPath(); c.arc(X, YY, 4, 0, 6.283); c.fill();
        c.fillStyle = '#16202C'; c.beginPath(); c.arc(X, YY, 1.5, 0, 6.283); c.fill();
        const tx = filas[i + 1];
        const tw = c.measureText(tx).width + PX * 2;
        // clamp bidireccional dentro del carril: nunca fuera del ancho ni encima del rótulo del carril
        let bx = X + 10 + tw > w - Rm ? X - 10 - tw : X + 10;
        bx = Math.max(L, Math.min(w - Rm - tw, bx));
        const by = Math.max(y0 + 24, Math.min(y1 - 2 - BH, YY - BH / 2));
        c.fillStyle = ART.tipBg; rr(c, bx, by, tw, BH, 4); c.fill();
        c.strokeStyle = ART.tipBorde; c.lineWidth = 1; c.stroke();
        c.fillStyle = ART.cursor; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(tx, bx + PX, by + BH / 2);
      });
      // hora en el eje
      const tw = c.measureText(filas[0]).width + PX * 2;
      const bx = Math.min(w - Rm - tw, Math.max(L, X - tw / 2));
      c.fillStyle = ART.cursor; rr(c, bx, h - Bm + 4, tw, 22, 4); c.fill();
      c.fillStyle = '#1a1200'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(filas[0], bx + tw / 2, h - Bm + 15);
    }
    return { x, xinv: (px) => datos.t0 + ((px - L) / (w - L - Rm)) * (datos.t1 - datos.t0) };
  };

  D.COLOR_PARCHE = COLOR_PARCHE;
  G.CN_DIBUJO = D;
})(typeof window !== 'undefined' ? window : globalThis);
