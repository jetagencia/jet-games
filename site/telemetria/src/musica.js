/* JET//Telemetría — música original sintetizada con Web Audio (compositor, 2026-10-22).
   Dirección: DISENO.md §11. Fa sostenido menor con sombra frigia (Sol natural = ♭II); picardía a Fa♯ mayor solo al ganar.

   «Deriva» (menú): 66 BPM, 4/4. Intro 4 · A 8 · A′ 8 · B 8 · A″ 8 = 36 compases ≈ 131 s antes de repetirse.
     Pad de sierras desafinadas ±6 cents con filtro que respira, campana FM (relación 3,5) con pocas notas y mucho aire,
     sonar en Do♯6 con eco largo, bajo de sinusoide muy suave y zumbido de casco. Cada vuelta cambia timbre y registro.
   «Telemetría» (juego): 84 BPM, 7/8 agrupado 2+2+3. Intro 4 · A 16 · A′ 16 · B 16 · Puente 8 · A″ 16 = 76 compases ≈ 190 s.
     L0 base (siempre): pad grave, sonar en el tiempo 1, ventilación filtrada, destellos de telemetría y la melodía de «sonda».
     L1 pulso (tras la primera lectura): bajo 2+2+3 con saturación suave, tic de relé y charles de ruido.
     L2 arpegio (sospecha > 50 %): semicorcheas de triángulo, el filtro se abre con la sospecha máxima.
     L3 peligro (aire < 30 %): cuerdas en racimo Fa♯-Sol con trémolo + latido doble (va por fuera del filtro de decisión).
     Decisión (mientras se mantiene Reparar): todo pasa por un paso bajo a 400 Hz y queda el latido.
   API estable: MUSICA.tema('menu'|'juego'|null), MUSICA.capas({pulso, arpegio:0..1, peligro, decision}),
   MUSICA.remate('win'|'lose'|'cap'), MUSICA.respirar(bool), MUSICA.muestra(seg, 'juego'|'menu') → Promise<ArrayBuffer WAV>. */
var MUSICA = (function () {
  'use strict';
  var A = AUDIO;
  var EM = 60 / 66 / 2, EJ = 60 / 84 / 2;        // corchea del menú y del juego (s)
  var PM = 8, PJ = 7;                            // corcheas por compás
  // ganancia que nace en 0: si la fuente arranca una muestra antes que la envolvente, no se escapa un chasquido a volumen 1
  function gz(c) { var g = c.createGain(); g.gain.value = 0; return g; }

  /* ================= Partitura ================= */
  // Acordes: b = bajo, v = voces del pad, v2 = segunda mitad (suspensión que resuelve)
  var M_A = [{ b: 42, v: [57, 61, 66, 69] },               // Fa♯m
             { b: 42, v: [57, 62, 64, 65] },               // Rem(add9)/Fa♯
             { b: 47, v: [54, 59, 62, 66] },               // Sim
             { b: 49, v: [54, 56, 61, 66], v2: [53, 56, 61, 65] }]; // Do♯sus4 → Do♯
  var M_B = [{ b: 50, v: [57, 61, 62, 66] },               // Re maj7
             { b: 43, v: [55, 59, 62, 67] },               // Sol (♭II, sombra frigia)
             { b: 42, v: [56, 57, 61, 66] },               // Fa♯m(add9)
             { b: 49, v: [53, 59, 61, 65], v2: [53, 56, 59, 65] }]; // Do♯7
  var J_A = [{ b: 42, v: [49, 54, 57, 61] },               // Fa♯m
             { b: 40, v: [49, 54, 57, 61] },               // Fa♯m/Mi
             { b: 38, v: [49, 54, 57, 62] },               // Re maj7
             { b: 37, v: [50, 53, 56, 59] }];              // Do♯7(♭9)
  var J_B = [{ b: 43, v: [50, 55, 59, 62] },               // Sol (♭II)
             { b: 42, v: [49, 54, 57, 61] },               // Fa♯m
             { b: 40, v: [47, 52, 56, 59] },               // Mi
             { b: 37, v: [49, 54, 56, 61] }];              // Do♯sus4

  // Melodías: [inicio, nota MIDI, duración]. Menú en negras (se pasa a corcheas); juego en corcheas del 7/8.
  function aCorcheas(l) { return l.map(function (e) { return [Math.round(e[0] * 2), e[1], e[2] * 2]; }); }
  var MEL_M = {
    A: aCorcheas([[1, 73, 2], [3, 76, 1], [4, 78, 1.5], [5.5, 76, 0.5], [6, 73, 2],
      [9, 76, 1], [10, 74, 2], [12, 69, 3],
      [17, 71, 1], [18, 74, 1], [19, 78, 2.5], [22, 76, 1], [23, 74, 1],
      [24, 73, 3], [27, 78, 1], [29, 77, 2], [31, 73, 1]]),
    A2: aCorcheas([[0.5, 73, 1.5], [2, 76, 0.5], [2.5, 78, 1.5], [5, 80, 1], [6, 81, 2],
      [9, 81, 1], [10, 77, 1], [11, 76, 1], [12, 74, 2], [14, 69, 2],
      [16, 71, 1], [17.5, 74, 1], [18.5, 78, 1.5], [20, 83, 2], [23, 81, 1],
      [24, 80, 2], [26, 78, 2], [28, 77, 3], [31, 73, 1]]),
    B: aCorcheas([[0, 69, 3], [3, 73, 1], [4, 76, 4],
      [8, 74, 2], [10, 71, 2], [12, 67, 4],
      [16, 69, 2], [18, 68, 1], [19, 66, 1], [20, 64, 4],
      [24, 65, 2], [26, 68, 2], [28, 73, 3.5]]),
    A3: aCorcheas([[1, 73, 2], [4, 78, 2], [10, 76, 2], [12, 74, 1], [17, 71, 2], [22, 78, 2], [24, 73, 4], [29, 77, 2.5]])
  };
  var MEL_J = {
    // A′: el motivo de la sonda (Do♯-Mi-Fa♯) en 16 compases, cuatro frases que no se copian
    A2: [[0, 73, 3], [3, 76, 2], [5, 78, 2], [7, 81, 4], [11, 80, 1], [12, 78, 2], [14, 78, 2], [16, 76, 2], [18, 73, 3], [21, 74, 2], [23, 73, 2], [25, 77, 3],
      [28, 73, 2], [30, 76, 2], [32, 81, 3], [35, 83, 3], [38, 81, 2], [40, 80, 2], [42, 78, 4], [46, 81, 3], [49, 80, 2], [51, 77, 2], [53, 74, 3],
      [57, 73, 2], [59, 76, 2], [61, 78, 3], [64, 81, 4], [68, 80, 1], [69, 78, 2], [71, 76, 2], [73, 73, 2], [75, 74, 2], [77, 73, 2], [79, 77, 4],
      [84, 78, 2], [86, 76, 1], [87, 73, 4], [91, 76, 2], [93, 78, 2], [95, 77, 2], [97, 73, 4], [101, 73, 11]],
    // B: contramelodía grave y lenta sobre Sol-Fa♯m-Mi-Do♯sus4 (dos pasadas distintas)
    B: [[0, 74, 3], [3, 79, 4], [7, 78, 3], [10, 73, 4], [14, 76, 2], [16, 71, 2], [18, 68, 3], [21, 73, 7],
      [28, 74, 2], [30, 79, 2], [32, 83, 3], [35, 81, 4], [39, 76, 3], [42, 73, 2], [44, 71, 3], [47, 73, 2], [49, 78, 5],
      [56, 79, 5], [61, 78, 2], [63, 73, 7], [70, 71, 4], [74, 68, 3], [77, 73, 7],
      [84, 74, 3], [87, 79, 4], [91, 81, 3], [94, 78, 4], [98, 76, 3], [101, 77, 4], [105, 73, 7]],
    // Puente: solo fragmentos del motivo, cada vez más arriba
    P: [[0, 73, 3], [14, 76, 3], [28, 78, 3], [42, 81, 2], [44, 80, 2], [46, 79, 3]],
    // A″: la misma idea, más lírica y en notas largas
    A3: [[0, 69, 5], [5, 71, 2], [7, 73, 7], [14, 74, 3], [17, 73, 2], [19, 71, 2], [21, 73, 4], [25, 77, 3],
      [28, 78, 5], [33, 76, 2], [35, 73, 4], [39, 71, 3], [42, 69, 3], [45, 71, 2], [47, 73, 2], [49, 73, 7],
      [56, 73, 3], [59, 76, 2], [61, 78, 2], [63, 81, 5], [68, 80, 2], [70, 78, 4], [74, 76, 3], [77, 74, 3], [80, 73, 2], [82, 77, 2],
      [84, 78, 7], [91, 76, 3], [94, 73, 4], [98, 74, 2], [100, 73, 12]]
  };
  function indexar(m) { var o = {}; for (var k in m) { o[k] = {}; m[k].forEach(function (e) { (o[k][e[0]] = o[k][e[0]] || []).push(e); }); } return o; }
  var IMEL_M = indexar(MEL_M), IMEL_J = indexar(MEL_J);
  var ARP = { A: [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 4, 2], A2: [3, 2, 1, 0, 1, 2, 3, 4, 4, 3, 2, 1, 2, 3],
    B: [0, 2, 4, 2, 1, 3, 5, 3, 0, 2, 4, 5, 4, 2], P: [0, -1, 2, -1, 1, -1, 3, -1, 0, -1, 2, -1, 4, -1], A3: [0, 1, 2, 4, 1, 2, 3, 5, 2, 3, 4, 6, 5, 3] };

  function secMenu(bar) { var b = bar % 36; return b < 4 ? ['i', b] : b < 12 ? ['A', b - 4] : b < 20 ? ['A2', b - 12] : b < 28 ? ['B', b - 20] : ['A3', b - 28]; }
  function secJuego(bar) { var b = bar % 76; return b < 4 ? ['i', b] : b < 20 ? ['A', b - 4] : b < 36 ? ['A2', b - 20] : b < 52 ? ['B', b - 36] : b < 60 ? ['P', b - 52] : ['A3', b - 60]; }
  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ================= Motor (vale para el contexto en vivo y para el offline) ================= */
  function Motor(c, salida, rev, ruidoBuf) {
    var M = { c: c };
    var mtof = A.mtof;
    var sat = c.createWaveShaper(); (function () { var n = 1024, cu = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1; cu[i] = Math.tanh(2.2 * x) / Math.tanh(2.2); } sat.curve = cu; })();
    M.filt = c.createBiquadFilter(); M.filt.type = 'lowpass'; M.filt.frequency.value = 18000; M.filt.Q.value = 0.9;
    M.filt.connect(salida);
    var paneo = !!c.createStereoPanner;
    // paneos compartidos (uno por destino y posición, redondeada a 0,1): crear un panoramizador por nota sale caro en teléfonos
    function pan(dest, p) {
      if (!paneo || !p) return dest;
      var k = Math.round(Math.max(-1, Math.min(1, p)) * 10) / 10; if (!k) return dest;
      var mp = dest.__pan || (dest.__pan = {});
      if (!mp[k]) { var s = c.createStereoPanner(); s.pan.value = k; s.connect(dest); mp[k] = s; }
      return mp[k];
    }
    // rampa lineal desde el valor que tenga el parámetro en t (sin filtros que se recalculen para siempre)
    function rampa(prm, v, t, d) {
      if (prm.cancelAndHoldAtTime) prm.cancelAndHoldAtTime(t); else { prm.cancelScheduledValues(t); prm.setValueAtTime(prm.value, t); }
      prm.linearRampToValueAtTime(v, t + d);
    }
    M.rampa = rampa;
    function envio(nodo, x, dest) { if (!x) return; var s = c.createGain(); s.gain.value = x; nodo.connect(s); s.connect(dest || rev); }
    function eco(tiempo, fb, corte) { // línea de eco con filtro en el lazo
      var i = c.createGain(), d = c.createDelay(3), f = c.createBiquadFilter(), g = c.createGain(), o = c.createGain();
      d.delayTime.value = tiempo; f.type = 'lowpass'; f.frequency.value = corte; g.gain.value = fb; o.gain.value = 0.8;
      i.connect(d); d.connect(f); f.connect(g); g.connect(d); f.connect(o); envio(f, 0.35);
      return { i: i, o: o };
    }
    // Temas: cada uno con su salida para poder cruzarlos sin que se pisen
    var T = {};
    ['menu', 'juego'].forEach(function (n) {
      var t = { out: c.createGain() }; t.out.gain.value = 0; t.out.connect(M.filt);
      t.eco = eco(n === 'menu' ? EM * 3 : EJ * 3, n === 'menu' ? 0.42 : 0.36, n === 'menu' ? 2400 : 2800); t.eco.o.connect(t.out);
      T[n] = t;
    });
    var L = {}; // capas del juego
    ['base', 'pulso', 'arp', 'peligro', 'mel'].forEach(function (k) { var g = c.createGain(); g.gain.value = (k === 'base' || k === 'mel') ? 1 : 0; g.connect(T.juego.out); L[k] = g; });
    L.arpF = c.createBiquadFilter(); L.arpF.type = 'lowpass'; L.arpF.frequency.value = 900; L.arpF.Q.value = 4; L.arpF.connect(L.arp);
    L.bajo = c.createGain(); L.bajo.gain.value = 0.9; L.satOut = c.createGain(); L.satOut.gain.value = 0.16; L.bajo.connect(sat); sat.connect(L.satOut); L.satOut.connect(L.pulso);
    L.latido = c.createGain(); L.latido.gain.value = 0; L.latido.connect(salida); // fuera del filtro de decisión
    M.T = T; M.L = L;
    M.objetivo = { pulso: 0, arp: 0, peligro: 0, latido: 0, mel: 1 };

    /* ---------- Instrumentos ---------- */
    function voz(tipo, f, t, dur, vol, dest, at, rel, det) {
      var o = c.createOscillator(), g = gz(c);
      o.type = tipo; o.frequency.value = f; if (det) o.detune.value = det;
      at = Math.min(at || 0.01, dur * 0.5); rel = Math.min(rel || 0.1, dur - at);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + at);
      g.gain.setValueAtTime(vol, t + dur - rel); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
      return o;
    }
    // Pad de dos sierras desafinadas ±6 cents por voz, paso bajo que respira
    M.pad = function (notas, t, dur, vol, dest, f0, f1, brillo) {
      var f = dest.__padF;
      if (!f) { f = dest.__padF = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.8; f.frequency.value = f0; f.connect(dest); envio(f, 0.45); }
      f.frequency.linearRampToValueAtTime(f0, t + 0.05); f.frequency.linearRampToValueAtTime(f1, t + Math.min(dur * 0.55, dur - 0.9));
      notas.forEach(function (m, k) {
        var p = pan(f, (k % 2 ? 0.5 : -0.5) * (0.3 + k / notas.length));
        voz('sawtooth', mtof(m), t, dur, vol, p, dur * 0.32, dur * 0.42, -6);
        voz('sawtooth', mtof(m), t, dur, vol, p, dur * 0.32, dur * 0.42, 6);
        if (brillo) voz('triangle', mtof(m + 12), t, dur, vol * brillo, p, dur * 0.4, dur * 0.4, 3);
      });
    };
    // Campana FM: portadora + moduladora a 3,5 (o 2,5 en las vueltas impares), índice que cae, brillo según intensidad
    M.campana = function (m, t, vol, dur, dest, relac, ecoEnv, revEnv) {
      var f = mtof(m), car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = gz(c), sh = c.createOscillator(), sg = gz(c);
      car.frequency.value = f; mod.frequency.value = f * (relac || 3.5); sh.frequency.value = f * 2; sh.detune.value = 4;
      mg.gain.setValueAtTime(f * 1.3, t); mg.gain.exponentialRampToValueAtTime(f * 0.04, t + dur * 0.8);
      mod.connect(mg); mg.connect(car.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(vol * 0.35, t + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(vol * 0.18, t + 0.01); sg.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.5);
      car.connect(g); sh.connect(sg); sg.connect(g); g.connect(dest);
      envio(g, revEnv == null ? 0.55 : revEnv); if (ecoEnv) envio(g, ecoEnv, ecoEnv > 0 && M._eco);
      car.start(t); mod.start(t); sh.start(t); car.stop(t + dur + 0.05); mod.stop(t + dur + 0.05); sh.stop(t + dur * 0.5 + 0.05);
    };
    // Sonar: Do♯6 con una caída mínima de afinación, chasquido de transductor y eco largo
    M.sonar = function (t, vol, dest, ecoIn, m) {
      var f = mtof(m || 85), o = c.createOscillator(), g = gz(c);
      o.frequency.setValueAtTime(f * 1.003, t); o.frequency.exponentialRampToValueAtTime(f * 0.992, t + 1.6);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(vol * 0.3, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
      o.connect(g); g.connect(dest); envio(g, 0.6); envio(g, 0.55, ecoIn);
      o.start(t); o.stop(t + 2);
      M.ruido(t, 0.012, vol * 0.5, 'bandpass', 4200, 2, dest);
    };
    M.ruido = function (t, dur, vol, tipo, f, q, dest, fTo, panv) {
      var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = gz(c);
      s.buffer = ruidoBuf; s.loop = true; fl.type = tipo || 'highpass'; fl.Q.value = q || 0.7;
      if (fTo) { fl.frequency.setValueAtTime(f, t); fl.frequency.exponentialRampToValueAtTime(fTo, t + dur); } else fl.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.004, dur / 3) + (fTo ? dur * 0.85 : 0)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + (fTo ? dur * 0.1 : 0));
      s.connect(fl); fl.connect(g); g.connect(panv != null ? pan(dest, panv) : dest);
      s.start(t, (t * 7.31) % 1.5); s.stop(t + dur * 1.2 + 0.03);
    };
    // Bajo: sinusoide + triángulo a la octava (para que se oiga en altavoces de teléfono) saturados suavemente
    M.bajo = function (m, t, dur, vol) {
      voz('sine', mtof(m), t, dur, vol, L.bajo, 0.006, Math.min(0.25, dur * 0.5));
      voz('triangle', mtof(m + 12), t, dur * 0.6, vol * 0.32, L.bajo, 0.004, dur * 0.3);
      M.ruido(t, 0.018, vol * 0.25, 'lowpass', 900, 1, L.pulso);
    };
    M.latido = function (t, vol) { // «lub-dub»
      [[0, 1], [0.17, 0.62]].forEach(function (p) {
        var o = c.createOscillator(), g = gz(c), tt = t + p[0];
        o.frequency.setValueAtTime(96, tt); o.frequency.exponentialRampToValueAtTime(46, tt + 0.11);
        g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(vol * p[1], tt + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.32);
        o.connect(g); g.connect(L.latido); o.start(tt); o.stop(tt + 0.36);
        var o2 = c.createOscillator(), g2 = gz(c); o2.type = 'triangle'; o2.frequency.setValueAtTime(190, tt); o2.frequency.exponentialRampToValueAtTime(92, tt + 0.08);
        g2.gain.setValueAtTime(0.0001, tt); g2.gain.exponentialRampToValueAtTime(vol * p[1] * 0.3, tt + 0.004); g2.gain.exponentialRampToValueAtTime(0.0001, tt + 0.12);
        o2.connect(g2); g2.connect(L.latido); o2.start(tt); o2.stop(tt + 0.14);
      });
    };
    M.cuerdas = function (notas, t, dur, vol) { // racimo con trémolo a 7 Hz
      var tr = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(), f = c.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 1600; f.Q.value = 1.2;
      lfo.frequency.value = 7; lg.gain.value = 0.45; tr.gain.value = 0.55; lfo.connect(lg); lg.connect(tr.gain);
      f.connect(tr); tr.connect(L.peligro); envio(tr, 0.5);
      notas.forEach(function (m, k) { voz('sawtooth', mtof(m), t, dur, vol, pan(f, k ? 0.4 : -0.4), dur * 0.35, dur * 0.4, k ? 5 : -5); voz('sawtooth', mtof(m), t, dur, vol * 0.7, f, dur * 0.35, dur * 0.4, k ? -9 : 9); });
      lfo.start(t); lfo.stop(t + dur + 0.05);
    };
    // Sonda: voz principal del juego (seno + triángulo, vibrato que llega tarde, portamento corto)
    var ultLead = null;
    M.sonda = function (m, t, dur, vol) {
      var f = mtof(m), o = c.createOscillator(), o2 = c.createOscillator(), g = gz(c), fl = c.createBiquadFilter(), vib = c.createOscillator(), vg = c.createGain();
      var desde = ultLead && Math.abs(ultLead - m) <= 5 ? mtof(ultLead) : f; ultLead = m;
      o.frequency.setValueAtTime(desde, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.045);
      o2.type = 'triangle'; o2.frequency.setValueAtTime(desde * 2, t); o2.frequency.exponentialRampToValueAtTime(f * 2, t + 0.045);
      vib.frequency.value = 5.2; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.007, t + Math.min(0.6, dur * 0.6)); vib.connect(vg); vg.connect(o.frequency);
      fl.type = 'lowpass'; fl.frequency.value = 2600; fl.Q.value = 0.6;
      var g2 = c.createGain(); g2.gain.value = 0.22;
      o.connect(fl); o2.connect(g2); g2.connect(fl); fl.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol, t + Math.max(0.04, dur - 0.18)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
      g.connect(L.mel); envio(g, 0.35); envio(g, 0.32, T.juego.eco.i);
      [o, o2, vib].forEach(function (x) { x.start(t); x.stop(t + dur + 0.1); });
    };
    M.destello = function (m, t, vol, p) { // telemetría: pitidos cortos repartidos en el estéreo
      var o = c.createOscillator(), g = gz(c); o.frequency.value = mtof(m);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      o.connect(g); g.connect(pan(L.base, p)); envio(g, 0.4, T.juego.eco.i); o.start(t); o.stop(t + 0.09);
    };
    M.subida = function (t, dur, dest, vol) { M.ruido(t, dur, vol, 'bandpass', 300, 1.6, dest, 4200); };
    M.caida = function (t, dest, vol) { var o = c.createOscillator(), g = gz(c); o.frequency.setValueAtTime(62, t); o.frequency.exponentialRampToValueAtTime(34, t + 1.6); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 2); o.connect(g); g.connect(dest); o.start(t); o.stop(t + 2.1); };
    // Ambiente continuo de la nave: ventilación (juego) y zumbido del casco (menú)
    M.ambiente = function (n, t) {
      var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      s.buffer = ruidoBuf; s.loop = true; f.type = 'lowpass'; f.frequency.value = n === 'juego' ? 420 : 260; f.Q.value = 0.9;
      lfo.frequency.value = n === 'juego' ? 0.11 : 0.06; lg.gain.value = n === 'juego' ? 140 : 90; lfo.connect(lg); lg.connect(f.frequency);
      g.gain.value = n === 'juego' ? 0.05 : 0.035; s.connect(f); f.connect(g); g.connect(n === 'juego' ? L.base : T.menu.out);
      var h = c.createOscillator(), hg = c.createGain(); h.frequency.value = mtof(30); hg.gain.value = n === 'juego' ? 0.012 : 0.016; h.connect(hg); hg.connect(n === 'juego' ? L.base : T.menu.out); // Fa♯1, zumbido eléctrico
      s.start(t); lfo.start(t); h.start(t);
      return function (t2) { try { s.stop(t2); lfo.stop(t2); h.stop(t2); } catch (e) {} };
    };

    /* ---------- Compases ---------- */
    M.compasMenu = function (t, bar) {
      var s = secMenu(bar), sec = s[0], b = s[1], vuelta = Math.floor(bar / 36), out = T.menu.out, ecoI = T.menu.eco.i;
      var prog = sec === 'B' ? M_B : M_A, ac = sec === 'i' ? M_A[0] : prog[Math.floor(b / 2) % 4], v = (b % 2 && ac.v2) ? ac.v2 : ac.v;
      var barDur = EM * PM, relac = vuelta % 2 ? 2.5 : 3.5;
      M._eco = ecoI;
      // pad: cada compás, con colas que se solapan
      M.pad(v, t, barDur + 1.6, sec === 'i' ? 0.015 + 0.004 * b : 0.025, out, 520, sec === 'B' ? 1100 : 1500, sec === 'A3' ? 0.25 : 0);
      if (b % 2 === 0 && sec !== 'i') { voz('sine', A.mtof(ac.b), t, barDur * 2, 0.1, out, 0.8, 1.5); voz('triangle', A.mtof(ac.b + 12), t, barDur * 2, 0.018, out, 1, 1.5); }
      // sonar: cada 2 compases en el 1; en B se corre al 3 de los compases impares
      if (sec === 'B') { if (b % 2) M.sonar(t + EM * 4, 0.07, out, ecoI); }
      else if (b % 2 === 0) M.sonar(t, sec === 'i' ? 0.05 : 0.07, out, ecoI);
      // melodía de campana
      var mel = IMEL_M[sec];
      if (mel) for (var k = 0; k < PM; k++) {
        var ev = mel[b * PM + k]; if (!ev) continue;
        ev.forEach(function (e) {
          var m = e[1] + (vuelta % 2 && sec === 'A' && b >= 4 ? 12 : 0) + (vuelta % 2 && sec === 'B' ? -12 : 0);
          M.campana(m, t + k * EM, sec === 'B' ? 0.075 : 0.065, Math.max(1.6, e[2] * EM * 1.6), out, relac, 0.22);
        });
      }
      // A″: respuesta grave a la melodía; B: armónicos de cristal muy suaves
      if (sec === 'A3' && b % 2 === 1) M.campana(v[0] + 12, t + EM * 5, 0.045, 2.8, out, 2, 0.3);
      if (sec === 'B' && b % 4 === 2) M.campana(ac.v[3] + 24, t + EM * 2, 0.02, 3, out, 1.5, 0.4, 0.8);
      if (b === (sec === 'i' ? 3 : 7) || (sec === 'B' && b === 7)) M.subida(t + barDur * 0.25, barDur * 0.75, out, 0.02);
      if (b === 0 && sec !== 'i') M.caida(t, out, 0.12);
    };
    M.compasJuego = function (t, bar, cap) {
      var s = secJuego(bar), sec = s[0], b = s[1], vuelta = Math.floor(bar / 76), r = rng(bar * 977 + vuelta * 131 + 7);
      var ac = sec === 'i' ? J_A[0] : sec === 'B' ? J_B[b % 4] : sec === 'P' ? (b >= 6 ? (b === 6 ? J_B[3] : J_A[3]) : (b % 2 ? J_A[3] : J_B[0])) : J_A[b % 4];
      var barDur = EJ * PJ, base = L.base, ecoI = T.juego.eco.i;
      M._eco = ecoI;
      var vivo = function (k) { return M.objetivo[k] > 0 || L[k].gain.value > 0.003; };
      // L0 · pad grave + quinta + color del acorde
      var pv = [ac.b + 12, ac.b + 19].concat(ac.v.slice(1));
      M.pad(pv, t, barDur + 0.9, sec === 'P' ? 0.017 : 0.02, base, 380, sec === 'B' ? 1300 : 1000, 0);
      // sonar en el 1 (en el puente, cada dos compases y una quinta arriba en el último)
      if (sec !== 'P' || b % 2 === 0) M.sonar(t, sec === 'i' ? 0.04 : 0.05, base, ecoI, sec === 'P' && b === 6 ? 92 : 85);
      // destellos de telemetría (A y B), con semilla por compás: nunca el mismo dibujo dos veces
      if (sec === 'A' || sec === 'B' || (sec === 'i' && b > 1)) for (var k = 0; k < PJ; k++) if (r() < (sec === 'A' ? 0.2 : 0.13)) {
        var tonos = sec === 'B' ? [86, 91, 93, 98] : [85, 88, 90, 92, 97];
        M.destello(tonos[Math.floor(r() * tonos.length)], t + k * EJ + (r() < 0.3 ? EJ / 2 : 0), 0.016, r() * 1.4 - 0.7);
      }
      if (b === 0 && sec !== 'i') M.caida(t, base, 0.14);
      var finSec = (sec === 'i' && b === 3) || (sec === 'A' && b === 15) || (sec === 'A2' && b === 15) || (sec === 'B' && b === 15) || (sec === 'P' && b === 7) || (sec === 'A3' && b === 15);
      if (finSec) M.subida(t + barDur * 0.3, barDur * 0.7, base, 0.03);
      // L1 · pulso 2+2+3
      if (vivo('pulso') && sec !== 'i') {
        var medio = sec === 'P' && b < 6;
        [[0, 1.7], [2, 1.7], [4, 2.8]].forEach(function (p, j) {
          if (medio && j) return;
          var m = ac.b + (j === 2 && (sec === 'B' ? b % 2 : b % 4 === 3) ? 7 : 0);
          M.bajo(m, t + p[0] * EJ, EJ * (medio ? 6.5 : p[1]), 0.24);
        });
        if ((sec === 'A2' || sec === 'A3') && !medio) M.bajo(ac.b + 12, t + 6 * EJ, EJ * 0.8, 0.1);
        for (var h = 0; h < PJ; h++) {
          var acc = h === 0 || h === 2 || h === 4;
          if (medio && h % 2) continue;
          M.ruido(t + h * EJ, 0.035, acc ? 0.05 : 0.026, 'highpass', 7500, 0.7, L.pulso, null, h % 2 ? 0.25 : -0.15);
          if ((sec === 'A2' || sec === 'B' || sec === 'A3') && (h === 5 || h === 6)) M.ruido(t + h * EJ + EJ / 2, 0.02, 0.018, 'highpass', 8500, 0.7, L.pulso, null, 0.3);
        }
        M.ruido(t + 4 * EJ, 0.03, 0.06, 'bandpass', 1900, 7, L.pulso, null, -0.2); // tic de relé al empezar el grupo de 3
        if (sec === 'P' && b >= 6) for (var q = 0; q < PJ * 2; q++) M.ruido(t + q * EJ / 2, 0.02, 0.012 + q * 0.0018, 'highpass', 6000, 0.7, L.pulso);
      }
      // L2 · arpegio de semicorcheas
      if (vivo('arp') && sec !== 'i') {
        var pat = ARP[sec] || ARP.A, sem = EJ / 2, tn = ac.v.slice().sort(function (x, y) { return x - y; });
        for (var a = 0; a < PJ * 2; a++) {
          var ix = pat[(a + (vuelta % 2 ? 2 : 0)) % pat.length]; if (ix < 0) continue;
          var nm = (ix < 4 ? tn[ix] : tn[ix - 4] + 12) + 12;
          voz('triangle', A.mtof(nm), t + a * sem, sem * 0.92, (a === 0 || a === 4 || a === 8) ? 0.085 : 0.058, pan(L.arpF, (a % 4 - 1.5) * 0.25), 0.004, sem * 0.5);
        }
      }
      // L3 · peligro: cuerdas en racimo y latido (el latido también suena durante la decisión)
      if (vivo('peligro') && b % 2 === 0) M.cuerdas(sec === 'B' ? [67, 68] : [66, 67], t, barDur * 2 + 0.4, 0.024);
      if (vivo('latido')) { M.latido(t, 0.42); M.latido(t + 4 * EJ, 0.32); }
      // melodía de la sonda
      var mel = IMEL_J[sec];
      if (mel) for (var k2 = 0; k2 < PJ; k2++) {
        var ev = mel[b * PJ + k2]; if (!ev) continue;
        ev.forEach(function (e) {
          var m = e[1] + (vuelta % 2 && sec === 'A2' && b >= 8 ? -12 : 0) + (vuelta % 2 && sec === 'A3' && b < 8 ? 12 : 0);
          M.sonda(m, t + k2 * EJ, e[2] * EJ * 0.96, sec === 'B' ? 0.06 : 0.05);
        });
      }
    };

    /* ---------- Capas ---------- */
    M.fijarCapas = function (cap, t, enJuego, rapido) {
      var tc = rapido ? 0.05 : 0.6, o = M.objetivo, dec = !!cap.decision && enJuego;
      o.pulso = enJuego && cap.pulso ? 1 : 0;
      o.arp = enJuego && cap.arpegio > 0.5 ? 1 : 0;
      o.peligro = enJuego && cap.peligro ? 1 : 0;
      o.latido = enJuego && (cap.peligro || cap.decision) ? (dec ? 0.9 : 0.75) : 0;
      o.mel = 1;
      ['pulso', 'arp', 'peligro', 'mel', 'latido'].forEach(function (k) { L[k].gain.cancelScheduledValues(t); L[k].gain.setTargetAtTime(o[k], t, k === 'latido' ? 0.15 : tc); });
      rampa(L.arpF.frequency, 500 + Math.min(1, Math.max(0, cap.arpegio || 0)) * 3800, t, 1.2);
      rampa(M.filt.frequency, dec ? 400 : 18000, t, dec ? 0.18 : 0.6);
    };
    return M;
  }

  /* ================= Vivo ================= */
  var M = null, tema = null, pedido = null, timer = null, prox = 0, compas = 0, temaSonando = null, pararAmb = null, inicioPend = null;
  var cap = { pulso: 0, arpegio: 0, peligro: 0, decision: 0 }, bloqueoHasta = 0, respiro = null;
  function preparar() {
    if (M) return true;
    if (!A.ctx) return false;
    M = Motor(A.ctx, A.musBus, A.rev, A.ruido());
    return true;
  }
  function durCompas(n) { return n === 'menu' ? EM * PM : EJ * PJ; }
  function bucle() {
    if (!M || !temaSonando) return;
    var c = M.c, ahora = c.currentTime;
    if (c.state !== 'running') return;
    if (prox < ahora - 0.05) { var d = durCompas(temaSonando); prox += Math.ceil((ahora - prox) / d) * d; } // tras una suspensión larga: no recuperar compases viejos
    var mudo = !A.prefs.music || A.prefs.musicVol < 0.02; // música apagada: el reloj sigue, pero no se crea ni un nodo
    while (prox < ahora + 0.3) {
      if (mudo) { prox += durCompas(temaSonando); compas++; continue; }
      try { if (temaSonando === 'menu') M.compasMenu(prox, compas); else M.compasJuego(prox, compas, cap); } catch (e) {}
      prox += durCompas(temaSonando); compas++;
    }
  }
  function arrancar(nombre) {
    if (!preparar()) { pedido = nombre; return; }
    if (nombre === tema) return;
    var c = M.c, t = c.currentTime;
    tema = nombre;
    clearTimeout(inicioPend); inicioPend = null;
    // fundido de salida del tema anterior (sus colas de reverb y eco se apagan solas)
    if (temaSonando) {
      var viejo = M.T[temaSonando].out; viejo.gain.cancelScheduledValues(t); viejo.gain.setTargetAtTime(0, t, 0.35);
      if (pararAmb) { pararAmb(t + 2); pararAmb = null; }
      temaSonando = null; clearInterval(timer); timer = null;
    }
    M.fijarCapas(cap, t, false, true);
    if (!nombre) return;
    var espera = Math.max(0.45, bloqueoHasta - t - 0.6);
    inicioPend = setTimeout(function () {
      inicioPend = null;
      if (tema !== nombre || !M) return;
      var t0 = M.c.currentTime + 0.08, o = M.T[nombre].out;
      temaSonando = nombre; compas = 0; prox = t0;
      o.gain.cancelScheduledValues(t0); o.gain.setValueAtTime(0.0001, t0); o.gain.linearRampToValueAtTime(1, t0 + 2.5);
      pararAmb = M.ambiente(nombre, t0);
      M.fijarCapas(cap, t0, nombre === 'juego', true);
      clearInterval(timer); timer = setInterval(bucle, 50); bucle();
    }, espera * 1000);
  }
  function remate(tipo) {
    if (!preparar()) return;
    var c = M.c, t = c.currentTime + 0.05, d = c.createGain(); d.gain.value = 1; d.connect(A.musBus);
    var rv = c.createGain(); rv.gain.value = 0.55; d.connect(rv); rv.connect(A.rev);
    var dur = tipo === 'lose' ? 4.2 : tipo === 'cap' ? 6.2 : 3.4;
    bloqueoHasta = c.currentTime + dur;
    if (temaSonando) { var o = M.T[temaSonando].out; o.gain.cancelScheduledValues(c.currentTime); o.gain.setTargetAtTime(tipo === 'lose' ? 0.0 : 0.12, c.currentTime, tipo === 'lose' ? 0.6 : 0.15); }
    M.fijarCapas({ pulso: 0, arpegio: 0, peligro: 0, decision: 0 }, c.currentTime, true, false);
    if (tipo === 'win' || tipo === 'cap') {
      var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(4500, t + 1.6); f.connect(d);
      M.pad([49, 53, 56, 59, 62], t, 1.0, 0.02, f, 700, 1400, 0);                // Do♯7(♭9)
      M.pad([42, 54, 58, 61, 66, 70], t + 0.9, dur - 0.9, 0.019, f, 900, 3600, 0.3); // Fa♯ mayor: la picardía
      voz2('sine', 30, t + 0.9, dur - 0.9, 0.09, d);
      [73, 78, 82, 85].forEach(function (m, i) { M.campana(m, t + 0.9 + i * 0.12, 0.06, 2.4, d, 3.5, 0, 0.6); });
      M.sonar(t + 0.9, 0.06, d, rv, 85);
      if (tipo === 'cap') { // motivo de A, ahora en mayor
        [[73, 2.4], [77, 2.75], [78, 3.1], [82, 3.6], [85, 4.1], [90, 4.6]].forEach(function (p) { M.campana(p[0], t + p[1], 0.055, 2.6, d, 3.5, 0, 0.7); });
        M.pad([47, 59, 63, 66, 71], t + 3.4, 2.8, 0.014, f, 1200, 3000, 0.2);
      }
    } else {
      [42, 49, 54, 57].forEach(function (m) {
        [-7, 7].forEach(function (det) {
          var o = c.createOscillator(), g = gz(c), f2 = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = A.mtof(m);
          o.detune.setValueAtTime(det, t); o.detune.linearRampToValueAtTime(det - 50, t + 3);
          f2.type = 'lowpass'; f2.frequency.setValueAtTime(1400, t); f2.frequency.exponentialRampToValueAtTime(180, t + 3.6);
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.018, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.9);
          o.connect(f2); f2.connect(g); g.connect(d); o.start(t); o.stop(t + 4);
        });
      });
      var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.connect(d);
      M.sonar(t + 1.4, 0.05, lp, rv, 85);
    }
    setTimeout(function () {
      if (!M) return;
      if (temaSonando) { var o = M.T[temaSonando].out; o.gain.cancelScheduledValues(M.c.currentTime); o.gain.setTargetAtTime(1, M.c.currentTime, 1.2); M.fijarCapas(cap, M.c.currentTime, temaSonando === 'juego', false); }
    }, dur * 1000);
    function voz2(tipo, m, tt, du, vol, dest) { var o = c.createOscillator(), g = gz(c); o.type = tipo; o.frequency.value = A.mtof(m); g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(vol, tt + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, tt + du); o.connect(g); g.connect(dest); o.start(tt); o.stop(tt + du + 0.05); }
  }
  // Respiración en el casco (aire < 20 %): ciclos de 4 s, inhalar 1,5 s / exhalar 2,5 s, por el bus de efectos
  function respirar(on) {
    if (!preparar()) return;
    var c = M.c;
    if (on && !respiro) {
      var s = c.createBufferSource(), f = c.createBiquadFilter(), f2 = c.createBiquadFilter(), g = c.createGain();
      s.buffer = A.ruido(); s.loop = true; f.type = 'bandpass'; f.Q.value = 0.9; f2.type = 'highpass'; f2.frequency.value = 250;
      g.gain.value = 0.0001; s.connect(f2); f2.connect(f); f.connect(g); g.connect(A.sfxBus); s.start();
      var r = { s: s, g: g, f: f, hasta: c.currentTime + 0.1, iv: null };
      var ciclo = function () {
        if (!respiro) return;
        while (r.hasta < c.currentTime + 4.5) {
          var t = Math.max(r.hasta, c.currentTime + 0.02);
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 1.2); g.gain.exponentialRampToValueAtTime(0.004, t + 1.6);
          g.gain.exponentialRampToValueAtTime(0.038, t + 2.0); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.9);
          f.frequency.setValueAtTime(700, t); f.frequency.exponentialRampToValueAtTime(1500, t + 1.4); f.frequency.setValueAtTime(1100, t + 1.6); f.frequency.exponentialRampToValueAtTime(520, t + 3.8);
          r.hasta = t + 4;
        }
      };
      respiro = r; ciclo(); r.iv = setInterval(ciclo, 1000);
    } else if (!on && respiro) {
      var x = respiro; respiro = null; clearInterval(x.iv);
      x.g.gain.cancelScheduledValues(c.currentTime); x.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.25);
      setTimeout(function () { try { x.s.stop(); } catch (e) {} }, 1500);
    }
  }

  /* ================= Muestra WAV (OfflineAudioContext) ================= */
  // guion por defecto (juego): L0 → L1 a los 6 s → L2 a los 13 s (filtro abriéndose) → L3 a los 21 s → decisión 28-30 s → victoria 31 s
  function muestra(seg, cual, guionPropio) {
    seg = seg || 35; cual = cual || 'juego';
    var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, sr = 44100;
    var oc = new OAC(2, Math.ceil(sr * seg), sr), C = A.cadena(oc);
    C.musBus.gain.value = 1; C.sfxBus.gain.value = 1;
    var mo = Motor(oc, C.musBus, C.rev, A.ruidoDe(oc));
    var o = mo.T[cual].out; o.gain.setValueAtTime(0.0001, 0); o.gain.linearRampToValueAtTime(1, 1.5);
    mo.ambiente(cual, 0);
    var guion = guionPropio || (cual === 'juego' ? [[0, { pulso: 0, arpegio: 0.2, peligro: 0, decision: 0 }], [6, { pulso: 1, arpegio: 0.3 }], [13, { arpegio: 0.55 }], [17, { arpegio: 0.8 }], [21, { peligro: 1, arpegio: 0.95 }], [28, { decision: 1 }], [30.2, { decision: 0 }]] : [[0, {}]]);
    var capT = { pulso: 0, arpegio: 0, peligro: 0, decision: 0 };
    function capEn(t) { var x = {}; for (var k in capT) x[k] = 0; guion.forEach(function (g) { if (g[0] <= t) for (var k in g[1]) x[k] = g[1][k]; }); return x; }
    guion.forEach(function (g) { mo.fijarCapas(capEn(g[0]), g[0], cual === 'juego', g[0] === 0); });
    var d = cual === 'menu' ? EM * PM : EJ * PJ, inicio = cual === 'juego' ? 18 : 2, fin = cual === 'juego' && !guionPropio ? 31 : seg;
    for (var k = 0, t = 0.05; t < fin; k++, t += d) {
      if (cual === 'menu') mo.compasMenu(t, inicio + k);
      else {
        // los nodos de capa no cambian de valor en el render: el «vivo» se decide con el guion
        var cp = capEn(t); mo.objetivo.pulso = cp.pulso; mo.objetivo.arp = cp.arpegio > 0.5 ? 1 : 0; mo.objetivo.peligro = cp.peligro; mo.objetivo.latido = cp.peligro || cp.decision ? 1 : 0;
        mo.compasJuego(t, inicio + k, cp);
      }
    }
    if (cual === 'juego' && !guionPropio) { // remate de victoria al final
      var t2 = fin + 0.1, dd = oc.createGain(); dd.connect(C.musBus); var rv = oc.createGain(); rv.gain.value = 0.55; dd.connect(rv); rv.connect(C.rev);
      o.gain.setTargetAtTime(0.1, fin - 0.2, 0.15); mo.fijarCapas({}, fin - 0.2, true, false);
      var f = oc.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(600, t2); f.frequency.exponentialRampToValueAtTime(4500, t2 + 1.6); f.connect(dd);
      mo.pad([49, 53, 56, 59, 62], t2, 1.0, 0.02, f, 700, 1400, 0);
      mo.pad([42, 54, 58, 61, 66, 70], t2 + 0.9, seg - t2 - 1, 0.019, f, 900, 3600, 0.3);
      [73, 78, 82, 85].forEach(function (m, i) { mo.campana(m, t2 + 0.9 + i * 0.12, 0.06, 2.4, dd, 3.5, 0, 0.6); });
      mo.sonar(t2 + 0.9, 0.06, dd, rv, 85);
    } else {
      C.master.gain.setValueAtTime(0.82, seg - 3); C.master.gain.linearRampToValueAtTime(0.0001, seg - 0.1);
    }
    return oc.startRendering().then(function (buf) { return wav(buf); });
  }
  function wav(buf) {
    var ch = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate, L0 = buf.getChannelData(0), R0 = buf.getChannelData(ch > 1 ? 1 : 0);
    var pico = 0, i; for (i = 0; i < n; i++) { pico = Math.max(pico, Math.abs(L0[i]), Math.abs(R0[i])); }
    var gan = pico > 0 ? Math.min(4, 0.89 / pico) : 1; // normalizado a −1 dBFS para escuchar
    var ab = new ArrayBuffer(44 + n * 4), v = new DataView(ab);
    function str(o, s) { for (var k = 0; k < s.length; k++) v.setUint8(o + k, s.charCodeAt(k)); }
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 4, true);
    for (i = 0; i < n; i++) { v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L0[i] * gan)) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R0[i] * gan)) * 32767, true); }
    return { wav: ab, picoDb: 20 * Math.log10(pico || 1e-9), ganancia: gan };
  }

  A.onReady(function () { if (pedido !== null) { var p = pedido; pedido = null; arrancar(p); } });
  return {
    tema: function (n) { if (!A.ctx) { pedido = n; return; } arrancar(n); },
    capas: function (o) {
      var antes = cap.decision; for (var k in o) cap[k] = o[k];
      if (!M) return;
      M.fijarCapas(cap, M.c.currentTime, temaSonando === 'juego', !!cap.decision !== !!antes);
    },
    remate: remate, respirar: respirar, muestra: muestra, _Motor: Motor,
    get actual() { return tema; }, get sonando() { return temaSonando; }, get compas() { return compas; }
  };
})();
