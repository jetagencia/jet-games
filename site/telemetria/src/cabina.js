/* JET//Telemetría — dibujo en canvas: fondo de cabina, silueta de la nave y ventanilla del astronauta oficial.
   Barras, textos y botones van en el DOM (ui.js). Todo se redibuja desde el estado: un cambio de tamaño nunca pierde nada. */
var TS = 100; // tamaño del astronauta oficial (lo usa drawAstro)
var CABINA = (function () {
  'use strict';
  var DPR = function () { return Math.min(3, window.devicePixelRatio || 1); };
  var reducido = false;
  function ajustar(cv) {
    var r = cv.getBoundingClientRect(), d = DPR(), w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    return { w: r.width, h: r.height, d: d };
  }
  /* ---------- Estrellas ---------- */
  var estrellas = [];
  (function () { var r = NUCLEO.rngDe('estrellas'); for (var i = 0; i < 260; i++) estrellas.push({ x: r(), y: r(), z: 0.2 + r() * 0.8, b: r(), tw: r() * 6.28 }); })();
  function dibujarEstrellas(c, w, h, t, vel, alfa) {
    for (var i = 0; i < estrellas.length; i++) {
      var s = estrellas[i], x = ((s.x - (reducido ? 0 : t * vel * s.z * 0.004)) % 1 + 1) % 1, y = s.y;
      var a = (0.25 + 0.75 * s.b) * (reducido ? 1 : 0.75 + 0.25 * Math.sin(t * 1.3 + s.tw)) * alfa;
      c.fillStyle = 'rgba(' + (s.b > 0.85 ? '190,230,255' : s.b > 0.7 ? '255,226,200' : '235,230,255') + ',' + a.toFixed(3) + ')';
      var r = s.z * 1.4 + (s.b > 0.93 ? 0.6 : 0);
      c.fillRect(x * w, y * h, r, r);
    }
  }
  /* ---------- Tierra ---------- */
  var manchas = []; (function () { var r = NUCLEO.rngDe('tierra'); for (var i = 0; i < 14; i++) manchas.push({ a: r() * 6.28, d: r() * 0.75, s: 0.12 + r() * 0.22, e: 0.4 + r() * 0.6 }); })();
  function dibujarTierra(c, x, y, R, t) {
    var g = c.createRadialGradient(x, y, R * 0.9, x, y, R * 1.6);
    g.addColorStop(0, 'rgba(0,242,207,.22)'); g.addColorStop(1, 'rgba(0,242,207,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, R * 1.6, 0, 7); c.fill();
    c.save(); c.beginPath(); c.arc(x, y, R, 0, 7); c.clip();
    var o = c.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.1, x, y, R);
    o.addColorStop(0, '#2fa6e8'); o.addColorStop(0.6, '#1360b8'); o.addColorStop(1, '#0a2a6a');
    c.fillStyle = o; c.fillRect(x - R, y - R, R * 2, R * 2);
    var rot = reducido ? 0 : t * 0.01;
    c.fillStyle = 'rgba(70,160,110,.55)';
    manchas.forEach(function (m) {
      var px = x + Math.cos(m.a + rot) * m.d * R * 1.1, py = y + Math.sin(m.a * 1.7) * m.d * R * 0.8;
      c.beginPath(); c.ellipse(px, py, m.s * R, m.s * R * m.e, m.a, 0, 7); c.fill();
    });
    c.fillStyle = 'rgba(255,255,255,.28)';
    manchas.slice(0, 6).forEach(function (m, i) { c.beginPath(); c.ellipse(x + Math.cos(m.a * 2 + rot * 1.6) * R * 0.6, y + Math.sin(m.a + i) * R * 0.7, R * 0.3, R * 0.05, m.a, 0, 7); c.fill(); });
    var s = c.createLinearGradient(x - R, y - R, x + R * 0.6, y + R * 0.8);
    s.addColorStop(0, 'rgba(0,0,0,0)'); s.addColorStop(0.55, 'rgba(0,0,0,.1)'); s.addColorStop(1, 'rgba(3,0,12,.85)');
    c.fillStyle = s; c.fillRect(x - R, y - R, R * 2, R * 2);
    c.restore();
    c.strokeStyle = 'rgba(150,230,255,.5)'; c.lineWidth = Math.max(1, R * 0.03); c.beginPath(); c.arc(x, y, R, Math.PI * 0.85, Math.PI * 1.75); c.stroke();
  }

  /* ---------- Fondo (cabina) ---------- */
  // modo: 'inicio' | 'juego' | 'res'; luz: 'alarma' | 'ok' | 'peligro'; prog: 0..1 avance de la campaña
  function fondo(cv, t, modo, luz, prog, extra) {
    var m = ajustar(cv), c = cv.getContext('2d'), w = m.w, h = m.h;
    c.setTransform(m.d, 0, 0, m.d, 0, 0);
    c.fillStyle = '#050108'; c.fillRect(0, 0, w, h);
    var vg = c.createRadialGradient(w * 0.5, h * 0.3, 10, w * 0.5, h * 0.4, Math.max(w, h) * 0.8);
    vg.addColorStop(0, '#120830'); vg.addColorStop(1, '#050108');
    c.fillStyle = vg; c.fillRect(0, 0, w, h);
    if (modo === 'inicio' || modo === 'res') {
      // parabrisas
      var cx = w / 2, top = h * 0.07, bot = h * (w > h ? 0.62 : 0.56), ww = Math.min(w * 0.94, h * 1.9);
      c.save(); c.beginPath();
      c.moveTo(cx - ww * 0.5, bot); c.lineTo(cx - ww * 0.36, top); c.quadraticCurveTo(cx, top - h * 0.04, cx + ww * 0.36, top); c.lineTo(cx + ww * 0.5, bot); c.closePath();
      c.clip();
      var sky = c.createLinearGradient(0, top, 0, bot); sky.addColorStop(0, '#07031a'); sky.addColorStop(1, '#12072c');
      c.fillStyle = sky; c.fillRect(0, 0, w, h);
      dibujarEstrellas(c, w, h, t, 1, 1);
      var R = Math.min(w, h) * (0.06 + 0.14 * (prog || 0)) * (extra && extra.cerca ? 1.12 : 1);
      dibujarTierra(c, cx + ww * 0.22, top + (bot - top) * (w > h ? 0.42 : 0.2), R, t);
      c.restore();
      // marco del parabrisas
      c.strokeStyle = 'rgba(119,0,244,.45)'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(cx - ww * 0.5, bot); c.lineTo(cx - ww * 0.36, top); c.quadraticCurveTo(cx, top - h * 0.04, cx + ww * 0.36, top); c.lineTo(cx + ww * 0.5, bot); c.stroke();
      c.strokeStyle = 'rgba(245,240,255,.08)'; c.lineWidth = 8;
      c.beginPath(); c.moveTo(cx, top - h * 0.02); c.lineTo(cx, bot); c.stroke();
      // consola
      var cg = c.createLinearGradient(0, bot, 0, h); cg.addColorStop(0, '#1a0f33'); cg.addColorStop(1, '#07030f');
      c.fillStyle = cg; c.beginPath(); c.moveTo(0, bot + h * 0.04); c.quadraticCurveTo(cx, bot - h * 0.03, w, bot + h * 0.04); c.lineTo(w, h); c.lineTo(0, h); c.fill();
      c.strokeStyle = 'rgba(0,242,207,.25)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(0, bot + h * 0.04); c.quadraticCurveTo(cx, bot - h * 0.03, w, bot + h * 0.04); c.stroke();
      // luces de la consola
      var rr = NUCLEO.rngDe('consola');
      for (var i = 0; i < 46; i++) {
        var lx = rr() * w, ly = bot + h * 0.06 + rr() * h * 0.2, col = rr() > 0.82 ? '255,176,32' : rr() > 0.5 ? '0,242,207' : '119,0,244';
        var on = reducido ? 0.7 : 0.35 + 0.65 * (Math.sin(t * (0.6 + rr() * 2.5) + i) > 0 ? 1 : 0.25);
        c.fillStyle = 'rgba(' + col + ',' + (on * 0.8).toFixed(2) + ')'; c.fillRect(lx, ly, 3 + rr() * 6, 2);
      }
      // astronauta de espaldas
      var s = Math.min(w, h) * (w > h ? 0.2 : 0.32);
      // nunca encima del menú: en pantallas bajas se achica hasta caber debajo (antenas incluidas)
      if (extra && extra.libre > 0) s = Math.min(s, (h - extra.libre - 6) / 0.82);
      if (s >= 34) {
        TS = s; c.save();
        drawAstro(c, cx, h - s * 0.3, 'u', 0, 0, extra && extra.push || 0, t, 0);
        c.restore();
      }
    } else {
      // VIS-TELEMETRIA-03: en juego el fondo baja al plano de ambiente (estrellas al 35 % de su alpha de menú)
      dibujarEstrellas(c, w, h, t, 0.35, 0.35);
    }
    // luz ambiente: barrido de alarma ámbar o calma cian
    var col = luz === 'ok' ? '0,242,207' : luz === 'peligro' ? '255,68,102' : '255,176,32';
    var fase = reducido ? 0.5 : (Math.sin(t * Math.PI * 2 / 6) * 0.5 + 0.5);
    var inten = luz === 'ok' ? 0.06 : luz === 'peligro' ? 0.1 + 0.08 * fase : 0.04 + 0.08 * fase;
    var lg = c.createRadialGradient(w * (reducido ? 0.5 : 0.2 + 0.6 * fase), 0, 10, w * 0.5, 0, Math.max(w, h));
    lg.addColorStop(0, 'rgba(' + col + ',' + inten.toFixed(3) + ')'); lg.addColorStop(1, 'rgba(' + col + ',0)');
    c.fillStyle = lg; c.fillRect(0, 0, w, h);
  }

  /* ---------- Silueta de la nave ---------- */
  // Devuelve la caja de la nave y la posición de cada nodo (en px CSS relativos al canvas)
  function geometria(caso, w, h) {
    var ar = w / h < 1.7 ? 1.9 : 2.5, pad = Math.min(14, w * 0.04), bw = w - pad * 2, bh = bw / ar;
    if (bh > h - pad * 2) { bh = h - pad * 2; bw = bh * ar; }
    var bx = (w - bw) / 2, by = (h - bh) / 2, N = caso.N, pos = [];
    // de popa (izquierda) a proa (derecha), espaciado uniforme y en zigzag: nunca se pisan
    var orden = [];
    if (!caso.hayZonas) for (var i = 0; i < N; i++) orden.push(i);
    else [2, 1, 0].forEach(function (z) { caso.sis.forEach(function (s, q) { if (s.zona === z) orden.push(q); }); });
    var paso = 0.8 / N;
    orden.forEach(function (q, k) { pos[q] = { x: bx + bw * (0.1 + paso * (k + 0.5)), y: by + bh * (k % 2 ? 0.66 : 0.34) }; });
    var zonasX = [0, 1, 2].map(function (z) {
      var xs = orden.filter(function (q) { return caso.sis[q].zona === z; }).map(function (q) { return pos[q].x; });
      if (!xs.length) return { x0: 0, x1: 0 };
      return { x0: Math.min.apply(null, xs) - bw * paso / 2, x1: Math.max.apply(null, xs) + bw * paso / 2 };
    });
    var nodo = Math.max(26, Math.min(46, Math.min(bw * paso * 1.25, bh * 0.36)));
    return { bx: bx, by: by, bw: bw, bh: bh, pos: pos, zonasX: zonasX, nodo: nodo };
  }
  function casco(c, g) {
    var x = g.bx, y = g.by, w = g.bw, h = g.bh;
    c.beginPath();
    c.moveTo(x + w * 0.06, y + h * 0.22);
    c.lineTo(x + w * 0.7, y + h * 0.12);
    c.quadraticCurveTo(x + w * 0.98, y + h * 0.28, x + w, y + h * 0.5);
    c.quadraticCurveTo(x + w * 0.98, y + h * 0.72, x + w * 0.7, y + h * 0.88);
    c.lineTo(x + w * 0.06, y + h * 0.78);
    c.closePath();
  }
  // est: {sel:{T}, marg:[], rep, desc, luz, onda:{t0,q}, haz:{t0,q,T,tipo}, sacude}
  function nave(cv, caso, est, t) {
    var m = ajustar(cv), c = cv.getContext('2d'), w = m.w, h = m.h;
    c.setTransform(m.d, 0, 0, m.d, 0, 0); c.clearRect(0, 0, w, h);
    var g = geometria(caso, w, h);
    // anillos de radar de fondo (VIS-TELEMETRIA-03: rejilla alpha .06; los nodos son el contraste dominante)
    c.strokeStyle = 'rgba(119,0,244,.06)'; c.lineWidth = 1;
    for (var r = 1; r <= 3; r++) { c.beginPath(); c.ellipse(w / 2, h / 2, g.bw * 0.22 * r, g.bh * 0.3 * r, 0, 0, 7); c.stroke(); }
    // toberas
    var x = g.bx, y = g.by, bw = g.bw, bh = g.bh;
    c.fillStyle = '#1b1236'; c.strokeStyle = 'rgba(181,168,216,.35)'; c.lineWidth = 1.2;
    [0.34, 0.66].forEach(function (fy) { c.beginPath(); c.moveTo(x + bw * 0.07, y + bh * (fy - 0.1)); c.lineTo(x, y + bh * (fy - 0.15)); c.lineTo(x, y + bh * (fy + 0.15)); c.lineTo(x + bw * 0.07, y + bh * (fy + 0.1)); c.closePath(); c.fill(); c.stroke(); });
    if (!reducido && est.luz !== 'peligro') {
      [0.34, 0.66].forEach(function (fy) {
        var fl = c.createLinearGradient(x, 0, x - bw * 0.08, 0); fl.addColorStop(0, 'rgba(0,242,207,.5)'); fl.addColorStop(1, 'rgba(0,242,207,0)');
        c.fillStyle = fl; var j = 0.8 + 0.2 * Math.sin(t * 20 + fy * 9);
        c.beginPath(); c.moveTo(x, y + bh * (fy - 0.1)); c.lineTo(x - bw * 0.08 * j, y + bh * fy); c.lineTo(x, y + bh * (fy + 0.1)); c.fill();
      });
    }
    // casco
    var hg = c.createLinearGradient(0, y, 0, y + bh); hg.addColorStop(0, '#22163f'); hg.addColorStop(0.5, '#160d2c'); hg.addColorStop(1, '#0d0720');
    c.fillStyle = hg; casco(c, g); c.fill();
    // contorno 1.5 px neutro; el estado (aire, reparación) lo comunican la barra de aire, la onda y los nodos, no el casco
    c.strokeStyle = 'rgba(181,168,216,.5)'; c.lineWidth = 1.5; casco(c, g); c.stroke();
    // zonas
    if (caso.hayZonas) {
      c.save(); casco(c, g); c.clip();
      g.zonasX.forEach(function (zx, z) {
        var sel = est.sel && est.sel.T === 100 + z;
        c.fillStyle = sel ? 'rgba(0,242,207,.10)' : 'rgba(255,255,255,.015)'; c.fillRect(zx.x0, y, zx.x1 - zx.x0, bh);
        if (z > 0) { c.strokeStyle = 'rgba(181,168,216,.18)'; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(zx.x0, y); c.lineTo(zx.x0, y + bh); c.stroke(); c.setLineDash([]); }
        c.fillStyle = sel ? 'rgba(0,242,207,.9)' : 'rgba(181,168,216,.45)'; c.font = '700 ' + Math.max(9, Math.min(11, bh * 0.09)) + 'px "JetBrains Mono",monospace';
        c.textAlign = 'center'; c.fillText(T_(['zones'])[z], (zx.x0 + zx.x1) / 2, y + bh * 0.97 - 2);
      });
      c.restore();
    }
    // conductos entre nodos (cableado decorativo alpha .18: no debe parecer el resultado de un sensor)
    c.strokeStyle = 'rgba(119,0,244,.18)'; c.lineWidth = 1.5;
    var orden = g.pos.map(function (p, q) { return q; }).sort(function (a, b) { return g.pos[a].x - g.pos[b].x; });
    c.beginPath(); orden.forEach(function (q, k) { var p = g.pos[q]; if (k) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }); c.stroke();
    // onda de luz al reparar
    if (est.onda) {
      var e = (t - est.onda.t0) / 0.9;
      if (e >= 0 && e <= 1) {
        var p0 = g.pos[est.onda.q], rad = e * bw * 1.1, col = est.onda.ok ? '0,242,207' : '255,68,102';
        c.save(); casco(c, g); c.clip();
        var og = c.createRadialGradient(p0.x, p0.y, Math.max(0, rad - 30), p0.x, p0.y, rad);
        og.addColorStop(0, 'rgba(' + col + ',0)'); og.addColorStop(0.8, 'rgba(' + col + ',' + (0.35 * (1 - e)).toFixed(3) + ')'); og.addColorStop(1, 'rgba(' + col + ',0)');
        c.fillStyle = og; c.fillRect(x, y, bw, bh); c.restore();
      }
    }
    // haz del escaneo
    if (est.haz) {
      var k2 = (t - est.haz.t0) / 0.25;
      if (k2 >= 0 && k2 <= 1.6) {
        var objetivos = est.haz.T >= 100 ? caso.sis.map(function (s, q) { return s.zona === est.haz.T - 100 ? q : -1; }).filter(function (q) { return q >= 0; }) : [est.haz.T];
        var ox = w / 2, oy = h + 4, a = Math.min(1, k2), fade = k2 > 1 ? 1 - (k2 - 1) / 0.6 : 1;
        objetivos.forEach(function (q) {
          var p = g.pos[q], ex = ox + (p.x - ox) * a, ey = oy + (p.y - oy) * a;
          var lg = c.createLinearGradient(ox, oy, ex, ey); lg.addColorStop(0, 'rgba(0,242,207,0)'); lg.addColorStop(1, 'rgba(0,242,207,' + (0.85 * fade).toFixed(3) + ')');
          c.strokeStyle = lg; c.lineWidth = 2; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ex, ey); c.stroke();
          if (a >= 1) { c.strokeStyle = 'rgba(0,242,207,' + (0.6 * fade).toFixed(3) + ')'; c.beginPath(); c.arc(p.x, p.y, 14 + (k2 - 1) * 40, 0, 7); c.stroke(); }
        });
      }
    }
    return g;
  }

  /* ---------- Ventanilla del marcador ---------- */
  function ventanilla(cv, t, push, luz) {
    var m = ajustar(cv), c = cv.getContext('2d'), w = m.w, h = m.h;
    c.setTransform(m.d, 0, 0, m.d, 0, 0); c.clearRect(0, 0, w, h);
    var bg = c.createRadialGradient(w / 2, h * 0.3, 2, w / 2, h / 2, w);
    bg.addColorStop(0, luz === 'peligro' ? '#3a0a1c' : luz === 'ok' ? '#06302c' : '#1d1240'); bg.addColorStop(1, '#07030f');
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    TS = h * 0.62;
    drawAstro(c, w / 2, h * 0.55, 'd', 0, 0, push || 0, reducido ? 0 : t, 0);
    // reflejo de la alarma en el casco
    if (luz === 'peligro' && !reducido) { c.fillStyle = 'rgba(255,68,102,' + (0.12 + 0.1 * Math.sin(t * 6)).toFixed(3) + ')'; c.fillRect(0, 0, w, h); }
  }
  function T_(k) { return window.TXT ? window.TXT(k[0]) : ['PROA', 'CENTRO', 'POPA']; }
  return {
    fondo: fondo, nave: nave, geometria: geometria, ventanilla: ventanilla, ajustar: ajustar, dibujarTierra: dibujarTierra,
    set reducido(v) { reducido = !!v; }, get reducido() { return reducido; }
  };
})();
