/* JET//Telemetría — efectos sintetizados, afinados con Fa sostenido menor (DISENO.md §11.5).
   Todo nace de osciladores, ruido y filtros: nada de samples. Las alturas salen de la escala de la música
   (Fa♯ La Do♯ para lo bueno; Do♯-Re y Sol natural, la segunda menor frigia, para lo malo).
   Uso: SFX.play('alerta'); var h = SFX.play('mantener'); h.stop(); */
var SFX = (function () {
  'use strict';
  var A = AUDIO, DEST = null, DREV = null;
  // nivel de cada efecto (medido con AUDIO.pico): los de resultado ~ −12 dBFS, interfaz ~ −18, detalles ~ −26
  var NIV = { sel: 1, desel: 1, zona: 0.8, scan: 4, alerta: 4, normal: 4, bars: 3, tic: 5, mantener: 1.8, ok: 1.6, ko: 1, danio: 7, star: 4, panel: 3.5, ora: 9, tecla: 1.6, error: 2.2, boton: 1.4 };
  function m2f(m) { return A.mtof(m); }
  // ganancia que nace en 0: si la fuente arranca una muestra antes que la envolvente, no se escapa un chasquido a volumen 1
  function gz(c) { var g = c.createGain(); g.gain.value = 0; return g; }
  function paneo(dest, p) { var c = A.ctx; if (!c.createStereoPanner || !p) return dest; var s = c.createStereoPanner(); s.pan.value = p; s.connect(dest); return s; }
  function env(g, t, at, pk, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(pk, 0.0002), t + at);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(at + 0.005, dur));
  }
  function osc(tipo, f, t, dur, vol, dest, o) {
    o = o || {};
    var c = A.ctx, x = c.createOscillator(), g = gz(c);
    x.type = tipo; x.frequency.setValueAtTime(f, t);
    if (o.to) x.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur));
    if (o.det) x.detune.value = o.det;
    env(g, t, o.at || 0.004, vol, dur);
    x.connect(g); g.connect(paneo(dest || DEST, o.pan));
    if (o.rev) { var s = c.createGain(); s.gain.value = o.rev; g.connect(s); s.connect(DREV); }
    x.start(t); x.stop(t + dur + 0.05);
    return x;
  }
  function ruido(t, dur, vol, tipoF, f, q, dest, o) {
    o = o || {};
    var c = A.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = gz(c);
    s.buffer = A.ruido(); s.loop = true;
    fl.type = tipoF || 'bandpass'; fl.frequency.setValueAtTime(f || 2000, t); fl.Q.value = q || 1;
    if (o.fTo) fl.frequency.exponentialRampToValueAtTime(o.fTo, t + dur);
    env(g, t, o.at || 0.002, vol, dur);
    s.connect(fl); fl.connect(g); g.connect(paneo(dest || DEST, o.pan));
    if (o.rev) { var r = c.createGain(); r.gain.value = o.rev; g.connect(r); r.connect(DREV); }
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
    return s;
  }
  function campana(m, t, vol, dur, rev, pan) { // FM suave, relación 3,5 (la misma familia que la campana de la música)
    var c = A.ctx, f = m2f(m), car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = gz(c);
    car.frequency.value = f; mod.frequency.value = f * 3.5;
    mg.gain.setValueAtTime(f * 1.6, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dur);
    mod.connect(mg); mg.connect(car.frequency);
    env(g, t, 0.004, vol, dur);
    car.connect(g); g.connect(paneo(DEST, pan));
    if (rev) { var s = c.createGain(); s.gain.value = rev; g.connect(s); s.connect(DREV); }
    car.start(t); mod.start(t); car.stop(t + dur + 0.1); mod.stop(t + dur + 0.1);
  }
  // relé: chasquido de contacto + golpe sordo de la armadura
  function rele(t, vol, pan) {
    ruido(t, 0.012, vol, 'highpass', 3600, 0.8, null, { pan: pan });
    ruido(t + 0.002, 0.03, vol * 0.5, 'bandpass', 900, 3, null, { pan: pan });
  }
  var LIB = {
    sel: function (t) { rele(t, 0.2); osc('sine', m2f(78), t + 0.006, 0.09, 0.05, null, { rev: 0.12 }); },
    desel: function (t) { ruido(t, 0.012, 0.13, 'highpass', 2600, 0.7); osc('sine', m2f(73), t + 0.005, 0.06, 0.032); },
    zona: function (t) { [78, 81, 85].forEach(function (m, i) { rele(t + i * 0.055, 0.17, (i - 1) * 0.5); osc('sine', m2f(m), t + i * 0.055 + 0.006, 0.08, 0.042, null, { pan: (i - 1) * 0.5, rev: 0.12 }); }); },
    scan: function (t) { // barrido 1,2 → 2,4 kHz que cruza de izquierda a derecha
      osc('sine', 1200, t, 0.27, 0.085, null, { to: 2400, glide: 0.25, rev: 0.3, pan: -0.3, at: 0.02 });
      osc('sine', 600, t, 0.27, 0.03, null, { to: 1200, glide: 0.25, pan: 0.3, at: 0.02 });
      ruido(t, 0.25, 0.025, 'bandpass', 2000, 4, null, { fTo: 6000, at: 0.05 });
    },
    alerta: function (t) { // Do♯ → Re: la segunda menor frigia
      var c = A.ctx, fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 2400; fl.Q.value = 2; fl.connect(DEST);
      var r = c.createGain(); r.gain.value = 0.2; fl.connect(r); r.connect(DREV);
      osc('square', m2f(73), t, 0.13, 0.06, fl); osc('square', m2f(61), t, 0.13, 0.025, fl);
      osc('square', m2f(74), t + 0.15, 0.24, 0.065, fl); osc('square', m2f(62), t + 0.15, 0.24, 0.028, fl);
      A.agachar(3, 0.4);
    },
    normal: function (t) { [78, 81, 85].forEach(function (m, i) { campana(m, t + i * 0.014, 0.045, 0.6, 0.3, (i - 1) * 0.3); }); },
    bars: function (t, x) { x = Math.min(1, Math.max(0.05, x || 0.3)); ruido(t, 0.18 + x * 0.25, 0.025 + x * 0.06, 'bandpass', 900, 0.8, null, { fTo: 2600, at: 0.05 }); },
    tic: function (t, n) { // un tic mecánico por minuto de aire (máx. 12), el resto en un roce
      n = Math.max(1, n || 1); var k = Math.min(12, n);
      for (var i = 0; i < k; i++) { ruido(t + i * 0.032, 0.012, 0.13, 'bandpass', 4200, 6, null, { pan: 0.2 }); osc('square', 1800, t + i * 0.032, 0.008, 0.01); }
      if (n > 12) ruido(t + k * 0.032, 0.22, 0.05, 'bandpass', 3000, 2, null, { at: 0.03 });
    },
    mantener: function (t) { // sierra que sube por Fa♯ menor armónica en 700 ms, con chispas
      var c = A.ctx, o = c.createOscillator(), o2 = c.createOscillator(), fl = c.createBiquadFilter(), g = gz(c), sg = c.createGain();
      o.type = 'sawtooth'; o2.type = 'square'; o2.detune.value = 7;
      fl.type = 'lowpass'; fl.Q.value = 5; fl.frequency.setValueAtTime(500, t); fl.frequency.exponentialRampToValueAtTime(3600, t + 0.7);
      [54, 56, 57, 59, 61, 62, 65, 66].forEach(function (m, i) { o.frequency.setValueAtTime(m2f(m + 12), t + i * 0.0875); o2.frequency.setValueAtTime(m2f(m), t + i * 0.0875); });
      var g2 = c.createGain(); g2.gain.value = 0.35;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.05); g.gain.linearRampToValueAtTime(0.07, t + 0.68);
      o.connect(fl); o2.connect(g2); g2.connect(fl); fl.connect(g); g.connect(DEST); o.start(t); o2.start(t);
      sg.gain.value = 1; sg.connect(DEST);
      for (var i = 0; i < 11; i++) { var tt = t + 0.04 + i * 0.065 + Math.random() * 0.03; ruido(tt, 0.02, 0.03 + i * 0.006, 'highpass', 5000 + Math.random() * 3500, 1, sg, { pan: Math.random() * 1.2 - 0.6 }); }
      var parado = false;
      return { stop: function () {
        if (parado) return; parado = true;
        var n = c.currentTime; g.gain.cancelScheduledValues(n); g.gain.setTargetAtTime(0.0001, n, 0.025); sg.gain.cancelScheduledValues(n); sg.gain.setTargetAtTime(0, n, 0.01);
        try { o.stop(n + 0.2); o2.stop(n + 0.2); } catch (e) {}
      } };
    },
    ok: function (t) { // golpe grave + acorde de Fa♯ mayor + el sistema que se enciende
      A.agachar(6, 0.9);
      osc('sine', 92, t, 0.45, 0.32, null, { to: 46, glide: 0.35 });
      ruido(t, 0.05, 0.12, 'lowpass', 1200, 1);
      [66, 70, 73, 78].forEach(function (m, i) { campana(m, t + 0.04 + i * 0.035, 0.055, 1.2, 0.4, (i - 1.5) * 0.25); });
      var c = A.ctx, z = c.createOscillator(), zf = c.createBiquadFilter(), zg = gz(c);
      z.type = 'sawtooth'; z.frequency.setValueAtTime(m2f(30), t + 0.08); z.frequency.exponentialRampToValueAtTime(m2f(42), t + 0.5);
      zf.type = 'lowpass'; zf.frequency.setValueAtTime(120, t + 0.08); zf.frequency.exponentialRampToValueAtTime(1400, t + 0.6); zf.Q.value = 3;
      zg.gain.setValueAtTime(0.0001, t + 0.08); zg.gain.exponentialRampToValueAtTime(0.06, t + 0.4); zg.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      z.connect(zf); zf.connect(zg); zg.connect(DEST); z.start(t + 0.08); z.stop(t + 1.25);
    },
    ko: function (t) { // golpe metálico con resonador a 180 Hz, descarga y Sol grave (♭II)
      A.agachar(6, 1.0);
      ruido(t, 0.35, 0.3, 'bandpass', 180, 14); ruido(t, 0.3, 0.12, 'bandpass', 487, 18); ruido(t, 0.09, 0.22, 'highpass', 2500, 1);
      osc('sawtooth', 1400, t + 0.03, 0.2, 0.045, null, { to: 110, glide: 0.2 });
      for (var i = 0; i < 5; i++) ruido(t + 0.05 + i * 0.03 + Math.random() * 0.02, 0.015, 0.08, 'highpass', 6000, 1, null, { pan: Math.random() - 0.5 });
      osc('sine', m2f(43), t + 0.05, 1.0, 0.2, null, { rev: 0.3 }); osc('triangle', m2f(55), t + 0.05, 0.6, 0.04);
    },
    danio: function (t) { // chisporroteo con filtro aleatorio + caída de tono
      A.agachar(5, 0.9);
      for (var i = 0; i < 10; i++) ruido(t + i * 0.075 + Math.random() * 0.04, 0.03 + Math.random() * 0.04, 0.1 + Math.random() * 0.12, 'bandpass', 1500 + Math.random() * 5000, 3, null, { pan: Math.random() * 1.4 - 0.7 });
      osc('sawtooth', 900, t, 0.85, 0.045, null, { to: 60, glide: 0.8 });
      osc('square', m2f(67), t + 0.1, 0.5, 0.015, null, { to: m2f(55), glide: 0.5 });
    },
    star: function (t, i) { var m = [73, 78, 81][i || 0] + 12; campana(m, t, 0.065, 1.0, 0.45, (i - 1) * 0.3 || 0); osc('sine', m2f(m), t, 0.45, 0.025); },
    panel: function (t) { ruido(t, 0.18, 0.045, 'bandpass', 650, 0.6, null, { fTo: 1800, at: 0.05 }); },
    ora: function (t) { for (var i = 0; i < 3; i++) osc('square', m2f(90), t + i * 0.075, 0.035, 0.016, null, { pan: 0.25 }); },
    tecla: function (t) { ruido(t, 0.009, 0.045, 'highpass', 4500, 1); ruido(t, 0.012, 0.02, 'bandpass', 1300, 4); },
    error: function (t) { osc('triangle', m2f(55), t, 0.15, 0.08); osc('triangle', m2f(56), t + 0.012, 0.15, 0.055); },
    boton: function (t) { rele(t, 0.11); osc('sine', m2f(73), t + 0.004, 0.06, 0.028); }
  };
  var ultimo = {};
  function play(n, x) {
    if (!A.ctx || !A.prefs.sfx || document.hidden) return null;
    var c = A.ctx, now = performance.now();
    if ((n === 'tecla' || n === 'boton' || n === 'sel') && ultimo[n] && now - ultimo[n] < 40) return null; // sin metralleta
    ultimo[n] = now;
    var f = LIB[n]; if (!f) return null;
    try {
      var k = NIV[n] || 1;
      DEST = c.createGain(); DEST.gain.value = k; DEST.connect(A.sfxBus);
      DREV = c.createGain(); DREV.gain.value = k; DREV.connect(A.rev);
      return f(c.currentTime + 0.005, x) || null;
    } catch (e) { return null; }
  }
  return { play: play, LIB: LIB };
})();
