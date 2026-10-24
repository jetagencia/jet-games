/* JET//Frentes · banda sonora y efectos. Composición original, sintetizada en vivo con Web Audio (DISENO §12).
   Nada de samples: osciladores, ruido, filtros, envolventes y una reverb por convolución generada aquí mismo.

   «Sala de mando nocturna». Mi menor eólico con giros dóricos (Do♯) y Mi mayor de llegada en la victoria.
   Motivo «la llamada del mando»: Mi4–Si4–Re5–Mi5 (corchea con puntillo, semicorchea, negra, blanca).

   PIEZAS
   · Mando (menú y despliegue), 84 BPM, 80 compases ≈ 3 min 48 s antes de repetirse:
       Intro 8 · A 16 · A′ 16 · B dórico 16 · Puente 8 · Vuelta 16. En cada vuelta completa rota el arpegio,
       la campana cambia de registro y la melodía se adorna o cambia de instrumento: la segunda vuelta nunca es igual.
       La llamada la dice la campana y la contesta el cuerno; en A′ el cuerno canta notas largas; en B aparece el Do♯.
   · Despliegue: la misma pieza, sin melodía, con capas que siguen a la reserva (1 pad+arpegio · 2 bajo ·
       3 charles y bombo · 4 «listo para lanzar»: cuerdas con la llamada y filtro abierto). Las capas entran y
       salen con fundidos de 1,5 s que empiezan siempre en un tiempo 1.
   · Batalla, 126 BPM, 32 compases (dos variantes de 16): impacto, timbales en Mi y Si, ostinato frigio
       Mi–Fa–Mi–Re en cuerdas, bajo en corcheas y la llamada convertida en tema de cuerno desde el primer compás
       (una batalla dura 3-4 compases: lo mejor va al principio).
   · Academia: versión de cámara a 72 BPM (pad, arpegio en corcheas con timbre de marimba, campana).
   · Cierre del resultado: la llamada completa en campana, cuerno y cuerdas; B7 → Mi mayor (≥ 50 %) o
       B7sus4 → Em(add9) (< 50 %). Luego vuelve el Mando desde la Intro.

   MEZCLA
   instrumentos → grupos (capas) → fundido de pieza → atenuación de pausa → filtro de pausa → volumen de música
   → paso alto 32 Hz → maestro; efectos → volumen de efectos (+ su propia reverb) → maestro → limitador.
   La música queda unos 7 dB por debajo de los efectos.

   API (window.FrentesAudio): init(), start(), song(name), stopSong(), setLayer(0..4), pause(bool), sfx(name, opts),
   result(win), suspend(), resume(), setMusic(on, vol), setSfx(on, vol), renderSample(segundos) → AudioBuffer,
   y para pruebas: ready, ctx, running, layer, song_, bar, stats(). */
(function () {
  'use strict';
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // ---------- azar con semilla (humanización reproducible) ----------
  let seed = 0x5eed;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
  const hum = (v) => v * (0.9 + 0.2 * rnd());          // velocidad humana
  const jit = () => (rnd() - 0.5) * 0.008;             // ±4 ms

  // ---------- armonía ----------
  const R = { C: 36, D: 38, E: 40, 'F#': 42, G: 43, A: 45, B: 47 };
  const CH = {
    'Em9': { r: R.E, n: [52, 55, 59, 66] }, 'Em': { r: R.E, n: [52, 55, 59, 64] }, 'Cmaj7': { r: R.C, n: [52, 55, 59, 60] },
    'Am7': { r: R.A, n: [52, 55, 57, 60] }, 'Am': { r: R.A, n: [52, 57, 60, 64] }, 'B7sus4': { r: R.B, n: [52, 54, 57, 59] }, 'B7': { r: R.B, n: [51, 54, 57, 59] },
    'G/D': { r: R.D, n: [50, 55, 59, 62] }, 'D6': { r: R.D, n: [50, 54, 57, 59] }, 'A': { r: R.A, n: [52, 57, 61, 64] },
    'C': { r: R.C, n: [52, 55, 60, 64] }, 'D': { r: R.D, n: [50, 54, 57, 62] }, 'Bm7': { r: R.B, n: [50, 54, 57, 59] },
    'Cmaj7#11': { r: R.C, n: [54, 55, 59, 64] }, 'D/C': { r: R.C, n: [50, 54, 57, 62] }, 'E': { r: R.E, n: [52, 56, 59, 64] }
  };
  // Mando: 80 compases
  const FORM = [];
  const push = (sec, arr) => arr.forEach((c, i) => FORM.push({ sec, c, i }));
  push('intro', Array(8).fill('Em9'));
  push('A', ['Em', 'Cmaj7', 'Am7', 'B7sus4', 'Em', 'Cmaj7', 'Am7', 'B7', 'Em', 'Cmaj7', 'Am7', 'B7sus4', 'Em', 'Cmaj7', 'Am7', 'B7']);
  push('A2', ['Em', 'G/D', 'Cmaj7', 'D6', 'Em', 'G/D', 'Cmaj7', 'D6', 'Em', 'G/D', 'Cmaj7', 'D6', 'Em', 'G/D', 'Cmaj7', 'B7']);
  push('B', ['Em', 'A', 'Em', 'A', 'C', 'D', 'Bm7', 'B7', 'Em', 'A', 'Em', 'A', 'C', 'D', 'Bm7', 'B7']);
  push('bridge', ['Cmaj7#11', 'D/C', 'Cmaj7#11', 'D/C', 'Cmaj7#11', 'D/C', 'Cmaj7#11', 'B7']);
  push('back', ['Em', 'Cmaj7', 'Am7', 'B7sus4', 'Em', 'Cmaj7', 'Am7', 'B7', 'Em', 'Cmaj7', 'Am7', 'B7sus4', 'Em', 'Cmaj7', 'B7', 'Em9']);
  const ARP = [[0, 2, 4, 5, 0, 2, 4, 5, 0, 2, 4, 5, 1, 3, 5, 7], [0, 4, 2, 5, 0, 4, 2, 5, 1, 4, 3, 6, 1, 4, 3, 6], [0, 2, 4, 6, 7, 6, 4, 2, 0, 3, 4, 7, 5, 4, 2, 1]];

  // ---------- melodías (semicorcheas: [paso, nota, duración]) ----------
  const MOTIF = [[0, 64, 3], [3, 71, 1], [4, 74, 4], [8, 76, 8]];
  // A: la campana llama (compás 0 de cada frase) y el cuerno contesta (compases 1-3)
  const A_MEL = [
    MOTIF, [[0, 79, 6], [6, 76, 2], [8, 74, 4], [12, 71, 4]], [[0, 72, 6], [6, 71, 2], [8, 69, 8]], [[0, 71, 4], [4, 69, 2], [6, 66, 2], [8, 64, 8]],
    MOTIF, [[0, 79, 4], [4, 81, 4], [8, 79, 4], [12, 76, 4]], [[0, 74, 6], [6, 72, 2], [8, 71, 8]], [[0, 71, 6], [6, 72, 2], [8, 75, 8]],
    MOTIF, [[0, 79, 6], [6, 76, 2], [8, 74, 4], [12, 71, 4]], [[0, 72, 6], [6, 71, 2], [8, 69, 4], [12, 71, 4]], [[0, 72, 4], [4, 71, 2], [6, 69, 2], [8, 66, 8]],
    MOTIF, [[0, 79, 4], [4, 81, 4], [8, 83, 4], [12, 79, 4]], [[0, 76, 6], [6, 74, 2], [8, 72, 8]], [[0, 78, 4], [4, 76, 4], [8, 75, 8]]
  ];
  // A′: el cuerno en notas largas; compases 8-11 solo contracanto de campana (respiro de textura)
  const A2_MEL = [
    [[0, 67, 12], [12, 71, 4]], [[0, 74, 8], [8, 71, 8]], [[0, 72, 6], [6, 71, 2], [8, 67, 8]], [[0, 69, 16]],
    [[0, 67, 12], [12, 71, 4]], [[0, 74, 6], [6, 76, 2], [8, 74, 8]], [[0, 76, 8], [8, 79, 8]], [[0, 78, 16]],
    null, null, null, null,
    [[0, 79, 8], [8, 76, 8]], [[0, 74, 8], [8, 78, 8]], [[0, 76, 6], [6, 74, 2], [8, 72, 8]], [[0, 71, 8], [8, 75, 8]]
  ];
  const COUNTER = [[0, 71, 2], [2, 69, 2], [4, 67, 4], [8, 66, 4], [12, 64, 4]];
  const COUNTER2 = [[0, 67, 3], [3, 69, 1], [4, 71, 4], [8, 74, 2], [10, 72, 2], [12, 71, 4]];
  // B dórico: el Do♯ del La mayor
  const B_MEL = [
    [[0, 71, 4], [4, 73, 4], [8, 76, 8]], [[0, 73, 6], [6, 71, 2], [8, 69, 8]], [[0, 67, 4], [4, 69, 4], [8, 71, 8]], [[0, 73, 12], [12, 76, 4]],
    [[0, 79, 8], [8, 76, 8]], [[0, 78, 8], [8, 74, 8]], [[0, 74, 4], [4, 73, 4], [8, 71, 8]], [[0, 71, 8], [8, 75, 8]]
  ];
  // Puente: campana suspendida sobre el Fa♯ (♯11)
  const BR_MEL = [[[0, 78, 6], [6, 76, 2], [8, 71, 8]], null, [[0, 79, 8], [8, 78, 8]], null, [[0, 83, 8], [8, 81, 4], [12, 79, 4]], null, [[0, 78, 16]], [[0, 71, 8], [8, 75, 8]]];
  // Batalla: la llamada hecha tema
  const BFORM = ['Em', 'Em', 'C', 'C', 'Am', 'Am', 'B7', 'B7', 'Em', 'Em', 'C', 'D', 'Am', 'B7sus4', 'B7', 'B7'];
  const OST = [64, 65, 64, 62];
  const B_HORN = [
    [[0, 64, 6], [6, 71, 2], [8, 74, 8]], [[0, 76, 12], [12, 74, 2], [14, 76, 2]], [[0, 76, 8], [8, 72, 4], [12, 74, 4]], [[0, 79, 16]],
    [[0, 76, 8], [8, 72, 8]], [[0, 71, 8], [8, 69, 8]], [[0, 71, 4], [4, 75, 4], [8, 78, 8]], [[0, 75, 8], [8, 71, 8]],
    [[0, 64, 6], [6, 71, 2], [8, 74, 8]], [[0, 76, 12], [12, 77, 2], [14, 76, 2]], [[0, 79, 8], [8, 76, 8]], [[0, 78, 8], [8, 74, 8]],
    [[0, 76, 8], [8, 72, 8]], [[0, 71, 8], [8, 76, 8]], [[0, 75, 16]], [[0, 78, 8], [8, 75, 8]]
  ];
  // tercera diatónica abajo en Mi eólico (para armonizar)
  const SCALE = [0, 2, 3, 5, 7, 8, 10];
  function dia(m, steps) {
    const pc = ((m - 64) % 12 + 12) % 12, oct = Math.floor((m - 64) / 12), i = SCALE.indexOf(pc);
    if (i < 0) return m - 4; // notas fuera de la escala (Re♯, Do♯, Fa natural): tercera mayor abajo
    const k = i + steps, o2 = Math.floor(k / 7), j = ((k % 7) + 7) % 7;
    return 64 + (oct + o2) * 12 + SCALE[j];
  }

  // ---------- recursos por contexto ----------
  const cache = new WeakMap();
  function res(c) {
    let r = cache.get(c); if (r) return r;
    r = {};
    let s = 777; const len = Math.floor(c.sampleRate * 1.5); r.noise = c.createBuffer(1, len, c.sampleRate);
    const d = r.noise.getChannelData(0); for (let i = 0; i < len; i++) { s = (s * 16807) % 2147483647; d[i] = s / 2147483647 * 2 - 1; }
    // pulso estrecho (12,5 %) para el arpegio «radar»
    const N = 32, re = new Float32Array(N), im = new Float32Array(N);
    for (let n = 1; n < N; n++) re[n] = 2 * Math.sin(Math.PI * n * 0.125) / (Math.PI * n);
    r.pulse = c.createPeriodicWave(re, im);
    cache.set(c, r); return r;
  }
  function makeImpulse(c, dur, decay, pre) {
    const len = Math.floor(c.sampleRate * dur), b = c.createBuffer(2, len, c.sampleRate);
    let sd = 12345; const rn = () => { sd = (sd * 1103515245 + 12345) & 0x7fffffff; return sd / 0x7fffffff * 2 - 1; };
    const p0 = Math.floor(c.sampleRate * (pre || 0.012));
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let lp = 0;
      for (let i = p0; i < len; i++) { const k = (i - p0) / (len - p0); lp += (rn() - lp) * (0.55 - 0.4 * k); d[i] = lp * Math.pow(1 - k, decay); }
    }
    return b;
  }

  // ---------- mezcla ----------
  function build(c) {
    const g = {}; res(c);
    g.limiter = c.createDynamicsCompressor(); g.limiter.threshold.value = -6; g.limiter.ratio.value = 20; g.limiter.attack.value = 0.003; g.limiter.release.value = 0.12; g.limiter.knee.value = 0;
    g.master = c.createGain(); g.master.gain.value = 1.4; g.master.connect(g.limiter); g.limiter.connect(c.destination);
    // música
    g.hp = c.createBiquadFilter(); g.hp.type = 'highpass'; g.hp.frequency.value = 32; g.hp.Q.value = 0.7; g.hp.connect(g.master);
    g.music = c.createGain(); g.music.gain.value = 0.0001; g.music.connect(g.hp);
    g.pauseLP = c.createBiquadFilter(); g.pauseLP.type = 'lowpass'; g.pauseLP.frequency.value = 18000; g.pauseLP.Q.value = 0.5; g.pauseLP.connect(g.music);
    g.duck = c.createGain(); g.duck.gain.value = 1; g.duck.connect(g.pauseLP);
    g.fade = c.createGain(); g.fade.gain.value = 1; g.fade.connect(g.duck);
    g.verb = c.createConvolver(); g.verb.buffer = makeImpulse(c, 2.6, 2.6);
    g.verbIn = c.createGain(); g.verbIn.gain.value = 0.5; g.verbIn.connect(g.verb);
    g.verbOut = c.createGain(); g.verbOut.gain.value = 0.6; g.verb.connect(g.verbOut); g.verbOut.connect(g.fade);
    g.delay = c.createDelay(2); g.delay.delayTime.value = 3 * 60 / 84 / 4;
    g.delayFb = c.createGain(); g.delayFb.gain.value = 0.35; g.delayLP = c.createBiquadFilter(); g.delayLP.type = 'lowpass'; g.delayLP.frequency.value = 2600;
    g.delayOut = c.createGain(); g.delayOut.gain.value = 0.36;
    g.delay.connect(g.delayLP); g.delayLP.connect(g.delayFb); g.delayFb.connect(g.delay); g.delayLP.connect(g.delayOut); g.delayOut.connect(g.fade); g.delayOut.connect(g.verbIn);
    // grupos (los de capa: arp, bass, perc, ready)
    const lev = { pad: 1, arp: 1, bass: 1, bell: 1, perc: 0.85, str: 1, lead: 0.8, ready: 1, amb: 1 };
    Object.keys(lev).forEach((k) => { const n = c.createGain(); n.gain.value = lev[k]; n.connect(g.fade); g[k] = n; g[k + 'Lev'] = lev[k]; });
    g.padFilter = c.createBiquadFilter(); g.padFilter.type = 'lowpass'; g.padFilter.frequency.value = 900; g.padFilter.Q.value = 0.6;
    g.padFilter.connect(g.pad); g.padFilter.connect(g.verbIn);
    g.lfo = c.createOscillator(); g.lfo.frequency.value = 0.07; g.lfoG = c.createGain(); g.lfoG.gain.value = 260; g.lfo.connect(g.lfoG); g.lfoG.connect(g.padFilter.frequency); g.lfo.start();
    g.arp.connect(g.delay); g.bell.connect(g.verbIn); g.str.connect(g.verbIn); g.lead.connect(g.verbIn); g.ready.connect(g.verbIn); g.amb.connect(g.verbIn);
    // efectos, con su propia reverb (suena aunque la música esté apagada)
    g.sfx = c.createGain(); g.sfx.gain.value = 0.0001; g.sfx.connect(g.master);
    g.sfxVerb = c.createGain(); g.sfxVerb.gain.value = 0.3; const sv = c.createConvolver(); sv.buffer = makeImpulse(c, 1.8, 3);
    const svo = c.createGain(); svo.gain.value = 0.7; g.sfxVerb.connect(sv); sv.connect(svo); svo.connect(g.sfx);
    return g;
  }

  // ---------- reparto del trabajo ----------
  // En vivo, las notas de un compás no se crean todas juntas: cada una se encola y se construye ~0,3 s antes
  // de sonar. Así el hilo principal nunca carga un compás entero de una vez (en un teléfono, 40-50 ms) y la
  // animación no da tirones. Fuera de línea (muestra WAV, pruebas) se construye en el acto.
  let liveCtx = null, direct = false; const Q = [];
  function later(fn) { return function (c, d, t) { if (c === liveCtx && !direct) { Q.push({ t, f: fn, a: arguments }); return; } return fn.apply(null, arguments); }; }
  function runQueue(now, ahead) {
    for (let i = 0; i < Q.length;) {
      const e = Q[i];
      if (e.t < now + ahead) { Q[i] = Q[Q.length - 1]; Q.pop(); if (e.t > now - 0.1) { try { e.f.apply(null, e.a); } catch (err) { barErrors++; } } }
      else i++;
    }
  }
  // ---------- instrumentos ----------
  function env(gn, t, a, d, peak, sus, rel, end) {
    gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(peak, t + a);
    gn.gain.setTargetAtTime(Math.max(0.0001, peak * sus), t + a, d / 3);
    gn.gain.setTargetAtTime(0.0001, Math.max(end, t + a), rel / 4);
  }
  function osc(c, type, f, t, stop) { const o = c.createOscillator(); if (typeof type === 'string') o.type = type; else o.setPeriodicWave(type); o.frequency.value = f; o.start(t); o.stop(stop); return o; }
  // Pad «nebulosa»: dos sierras ±7 cents por nota
  const pad = later(function (c, g, t, notes, dur, vel) {
    for (const m of notes) for (const det of [-7, 7]) {
      const o = osc(c, 'sawtooth', mtof(m), t, t + dur + 1.5); o.detune.value = det + (rnd() - 0.5) * 3;
      const a = c.createGain(); env(a, t, 1.2, 1.5, 0.062 * vel, 0.8, 1.2, t + dur);
      o.connect(a); a.connect(g.padFilter);
    }
  });
  // Arpegio «radar»: triangular + pulso estrecho, paso banda
  const pluck = later(function (c, dest, t, m, dur, vel, kind) {
    const f0 = mtof(m), end = t + dur + 0.4;
    const o = osc(c, 'triangle', f0, t, end);
    const o2 = osc(c, kind === 'soft' ? 'sine' : res(c).pulse, f0 * (kind === 'soft' ? 4 : 1), t, end); o2.detune.value = 4;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(Math.min(7000, f0 * 3), t); f.frequency.exponentialRampToValueAtTime(Math.min(5000, f0 * 1.3), t + dur); f.Q.value = 0.7;
    const a = c.createGain(); env(a, t, 0.003, dur * 0.6, 0.45 * vel, 0.12, 0.12, t + dur);
    const a2 = c.createGain(); a2.gain.setValueAtTime(kind === 'soft' ? 0.25 : 0.32, t); a2.gain.exponentialRampToValueAtTime(0.02, t + (kind === 'soft' ? 0.05 : dur));
    o.connect(a); o2.connect(a2); a2.connect(a); a.connect(f); f.connect(dest);
  });
  // Pluck corto para efectos (marimba de cristal)
  function blip(c, dest, t, m, dur, vel, bright) {
    const f0 = mtof(m), end = t + dur + 0.2;
    const o = osc(c, 'sine', f0, t, end), o2 = osc(c, 'triangle', f0 * 2, t, end), o3 = osc(c, 'sine', f0 * (bright ? 4.01 : 3), t, end);
    const a = c.createGain(); a.gain.setValueAtTime(0.0001, t); a.gain.linearRampToValueAtTime(0.2 * vel, t + 0.002); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const a2 = c.createGain(); a2.gain.setValueAtTime(0.35, t); a2.gain.exponentialRampToValueAtTime(0.01, t + dur * 0.5);
    const a3 = c.createGain(); a3.gain.setValueAtTime(bright ? 0.28 : 0.12, t); a3.gain.exponentialRampToValueAtTime(0.005, t + 0.03);
    o.connect(a); o2.connect(a2); a2.connect(a); o3.connect(a3); a3.connect(a); a.connect(dest);
  }
  // Bajo: seno + cuadrada a −18 dB, paso bajo 220 Hz
  const bass = later(function (c, g, t, m, dur, vel, dest) {
    const end = t + dur + 0.3;
    const o = osc(c, 'sine', mtof(m), t, end), q = osc(c, 'square', mtof(m), t, end);
    const qg = c.createGain(); qg.gain.value = 0.22;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(520, t); f.frequency.setTargetAtTime(300, t + 0.01, 0.06);
    const a = c.createGain(); env(a, t, 0.008, 0.4, 0.17 * vel, 0.55, 0.12, t + dur);
    o.connect(a); q.connect(qg); qg.connect(a); a.connect(f); f.connect(dest || g.bass);
  });
  // Campana FM 1:3,5, índice que decae
  const bell = later(function (c, dest, t, m, dur, vel) {
    const f0 = mtof(m), end = t + dur + 1.4;
    const car = osc(c, 'sine', f0, t, end), mod = osc(c, 'sine', f0 * 3.5, t, end);
    const mi = c.createGain(); mi.gain.setValueAtTime(f0 * 2.2, t); mi.gain.exponentialRampToValueAtTime(f0 * 0.06, t + Math.max(0.3, dur));
    mod.connect(mi); mi.connect(car.frequency);
    const a = c.createGain(); a.gain.setValueAtTime(0.0001, t); a.gain.linearRampToValueAtTime(0.3 * vel, t + 0.005); a.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.2);
    car.connect(a); a.connect(dest);
  });
  // Cuerno: dos sierras con filtro que se abre al atacar y vibrato que llega tarde
  const horn = later(function (c, dest, t, m, dur, vel) {
    const f0 = mtof(m), end = t + dur + 0.6;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 1.6;
    f.frequency.setValueAtTime(380, t); f.frequency.linearRampToValueAtTime(900 + 1700 * vel, t + 0.07); f.frequency.setTargetAtTime(700 + 800 * vel, t + 0.08, 0.25);
    const a = c.createGain(); env(a, t, 0.05, 0.4, 0.19 * vel, 0.75, 0.22, t + dur);
    const vib = osc(c, 'sine', 5.1, t, end), vg = c.createGain();
    vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(0, t + Math.min(0.3, dur * 0.5)); vg.gain.linearRampToValueAtTime(7, t + Math.min(0.7, dur)); vib.connect(vg);
    for (const det of [-5, 5]) { const o = osc(c, 'sawtooth', f0, t, end); o.detune.value = det; vg.connect(o.detune); o.connect(f); }
    f.connect(a); a.connect(dest);
  });
  // Cuerdas: tres sierras desafinadas, filtro con ataque lento
  const strings = later(function (c, dest, t, notes, dur, vel, attack, voices) {
    const at = attack || 0.35;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(450, t); f.frequency.linearRampToValueAtTime(2300, t + Math.max(0.05, at * 1.6)); f.Q.value = 0.5;
    const a = c.createGain(); env(a, t, at, 0.8, 0.07 * vel * (voices === 2 ? 1.2 : 1), 0.85, 0.5, t + dur);
    const dets = voices === 2 ? [-8, 8] : [-9, 0, 8];
    for (const m of notes) for (const det of dets) { const o = osc(c, 'sawtooth', mtof(m), t, t + dur + 0.65); o.detune.value = det; o.connect(f); }
    f.connect(a); a.connect(dest);
  });
  function noiseSrc(c, t, stop, off) { const n = c.createBufferSource(); n.buffer = res(c).noise; n.loop = true; n.start(t, off == null ? rnd() : off); n.stop(stop); return n; }
  const kick = later(function (c, dest, t, vel) {
    const o = osc(c, 'sine', 120, t, t + 0.4); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.16);
    const a = c.createGain(); a.gain.setValueAtTime(0.0001, t); a.gain.linearRampToValueAtTime(0.55 * vel, t + 0.003); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(a); a.connect(dest);
    const n = noiseSrc(c, t, t + 0.02), nf = c.createBiquadFilter(); nf.type = 'highpass'; nf.frequency.value = 2500; const na = c.createGain(); na.gain.setValueAtTime(0.05 * vel, t); na.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
    n.connect(nf); nf.connect(na); na.connect(dest);
  });
  const snare = later(function (c, dest, t, vel) {
    const n = noiseSrc(c, t, t + 0.25), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
    const a = c.createGain(); a.gain.setValueAtTime(0.0001, t); a.gain.linearRampToValueAtTime(0.22 * vel, t + 0.002); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
    n.connect(f); f.connect(a); a.connect(dest);
    const o = osc(c, 'triangle', 190, t, t + 0.15), b = c.createGain(); b.gain.setValueAtTime(0.13 * vel, t); b.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(b); b.connect(dest);
  });
  const hat = later(function (c, dest, t, vel, open) {
    const n = noiseSrc(c, t, t + 0.32), f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const a = c.createGain(); a.gain.setValueAtTime(0.0001, t); a.gain.linearRampToValueAtTime(0.11 * vel, t + 0.002); a.gain.exponentialRampToValueAtTime(0.0001, t + (open ? 0.26 : 0.045));
    n.connect(f); f.connect(a); a.connect(dest);
  });
  const timp = later(function (c, dest, t, m, vel) {
    const f0 = mtof(m);
    const o = osc(c, 'sine', f0, t, t + 1.3); o.frequency.setValueAtTime(f0 * 1.07, t); o.frequency.exponentialRampToValueAtTime(f0, t + 0.08);
    const o2 = osc(c, 'sine', f0 * 1.5, t, t + 1.3), o3 = osc(c, 'sine', f0 * 2.02, t, t + 0.6);
    const a = c.createGain(); a.gain.setValueAtTime(0.0001, t); a.gain.linearRampToValueAtTime(0.42 * vel, t + 0.005); a.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
    const a2 = c.createGain(); a2.gain.value = 0.24; const a3 = c.createGain(); a3.gain.setValueAtTime(0.12, t); a3.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    const n = noiseSrc(c, t, t + 0.1), nf = c.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 650; const na = c.createGain(); na.gain.setValueAtTime(0.2 * vel, t); na.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(a); o2.connect(a2); a2.connect(a); o3.connect(a3); a3.connect(a); a.connect(dest); n.connect(nf); nf.connect(na); na.connect(dest);
  });
  const tom = later(function (c, dest, t, m, vel) {
    const o = osc(c, 'sine', mtof(m), t, t + 0.45); o.frequency.setValueAtTime(mtof(m) * 1.5, t); o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.05);
    const a = c.createGain(); a.gain.setValueAtTime(0.0001, t); a.gain.linearRampToValueAtTime(0.32 * vel, t + 0.003); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(a); a.connect(dest);
  });
  const crash = later(function (c, dest, t, vel, len) {
    const L = len || 2.2, n = noiseSrc(c, t, t + L), f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3800;
    const f2 = c.createBiquadFilter(); f2.type = 'peaking'; f2.frequency.value = 6500; f2.gain.value = 5;
    const a = c.createGain(); a.gain.setValueAtTime(0.0001, t); a.gain.linearRampToValueAtTime(0.11 * vel, t + 0.004); a.gain.exponentialRampToValueAtTime(0.0001, t + L);
    n.connect(f); f.connect(f2); f2.connect(a); a.connect(dest);
  });
  // Aire que crece hacia el compás siguiente (platillo al revés)
  const swell = later(function (c, dest, t, dur, vel) {
    const n = noiseSrc(c, t, t + dur + 0.05), f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.9;
    f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(7500, t + dur);
    const a = c.createGain(); a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(0.07 * vel, t + dur * 0.97); a.gain.linearRampToValueAtTime(0.0001, t + dur + 0.04);
    n.connect(f); f.connect(a); a.connect(dest);
  });
  // Viento estelar y subgrave de la intro
  const drone = later(function (c, g, t, dur) {
    const o = osc(c, 'sine', mtof(28), t, t + dur + 1.5), a = c.createGain(); env(a, t, dur * 0.4, dur, 0.09, 0.9, 1.4, t + dur);
    o.connect(a); a.connect(g.amb);
    const n = noiseSrc(c, t, t + dur + 1.5), f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(380, t); f.frequency.linearRampToValueAtTime(760, t + dur * 0.5); f.frequency.linearRampToValueAtTime(420, t + dur);
    const na = c.createGain(); env(na, t, dur * 0.45, dur, 0.035, 0.9, 1.4, t + dur); n.connect(f); f.connect(na); na.connect(g.amb);
  });
  function playMel(c, inst, dest, t0, s16, mel, vel, tr, ornament) {
    if (!mel) return;
    for (const [s, m, d] of mel) {
      const t = t0 + s * s16 + jit(), dur = d * s16 * 0.95;
      if (ornament && d >= 8 && s > 0) inst(c, dest, t - s16 * 0.5, m + tr + (rnd() < 0.5 ? 2 : -1), s16 * 0.45, vel * 0.55);
      inst(c, dest, t, m + tr, dur, hum(vel));
    }
  }

  // ---------- capas ----------
  // 0 = solo pad · 1 = + arpegio · 2 = + bajo · 3 = + charles/bombo · 4 = listo (cuerdas, filtro abierto)
  function layerGains(g, song, L, t) {
    const dep = song === 'deploy', tc = dep ? 0.45 : 0.04;
    const tg = { arp: !dep || L >= 1, bass: !dep || L >= 2, perc: !dep || L >= 3, ready: dep && L >= 4 };
    for (const k in tg) { const p = g[k].gain; p.cancelScheduledValues(t); p.setTargetAtTime(tg[k] ? g[k + 'Lev'] : 0.0001, t, tc); }
    g.padFilter.frequency.cancelScheduledValues(t);
    g.padFilter.frequency.setTargetAtTime(dep && L >= 4 ? 2200 : song === 'battle' ? 1500 : song === 'acad' ? 760 : 900, t, dep ? 0.6 : 0.3);
    g.lead.gain.cancelScheduledValues(t); g.lead.gain.setTargetAtTime(dep ? 0.0001 : g.leadLev, t, dep ? 0.6 : 0.05);
  }
  function resetGains(g, t) { ['arp', 'bass', 'perc', 'lead'].forEach((k) => { const p = g[k].gain; p.cancelScheduledValues(t); p.setTargetAtTime(g[k + 'Lev'], t, 0.05); }); }

  // ---------- secuenciador ----------
  const SONGS = { menu: { bpm: 84, bars: FORM.length }, deploy: { bpm: 84, bars: FORM.length }, acad: { bpm: 72, bars: FORM.length }, battle: { bpm: 126, bars: 32 } };
  function schedBar(c, g, song, bar, t0, s16, lp, L) {
    if (song === 'battle') return schedBattleBar(c, g, bar, t0, s16, lp);
    const f = FORM[bar % FORM.length], ch = CH[f.c], sec = f.sec, bi = f.i;
    const deploy = song === 'deploy', acad = song === 'acad', full = !deploy && !acad;
    const barDur = s16 * 16, nxt = FORM[(bar + 1) % FORM.length];
    layerGains(g, song, L, t0);
    // pad (en B y el puente se abre un poco)
    pad(c, g, t0, ch.n, barDur * 1.02, sec === 'bridge' ? 1.15 : sec === 'B' ? 1.05 : 1);
    if (sec === 'intro' && bi % 4 === 0) drone(c, g, t0, barDur * 4);
    // arpegio (en la intro, a medio volumen; en la Academia, corcheas con timbre de marimba)
    if (sec !== 'bridge') {
      const ext = ch.n.concat(ch.n.map((x) => x + 12));
      const pat = ARP[(lp + (sec === 'A2' ? 1 : sec === 'B' ? 2 : 0)) % 3];
      const vel = sec === 'intro' ? 0.5 : sec === 'back' ? 0.85 : 0.78;
      for (let s = 0; s < 16; s++) {
        if (acad && s % 2) continue;
        if (sec === 'intro' && bi < 2 && s % 4) continue; // la intro arranca con pulsos de radar
        pluck(c, g.arp, t0 + s * s16 + jit() * 0.5, ext[pat[s] % ext.length] + 12, s16 * (acad ? 2.6 : 1.6), hum(vel * (s % 4 === 0 ? 1 : 0.7)), acad ? 'soft' : null);
      }
    } else if (bi % 2 === 0) {
      // el puente respira con ecos sueltos del radar
      [0, 6, 10].forEach((s, k) => pluck(c, g.arp, t0 + s * s16, ch.n[(k + lp) % 4] + 24, s16 * 3, 0.42, 'soft'));
    }
    // bajo
    if (!acad && sec !== 'intro' && sec !== 'bridge') {
      const r = ch.r; const pat = sec === 'back' ? [[0, r, 3], [3, r + 12, 1], [6, r, 2], [8, r, 3], [11, r + 12, 1], [14, r + 7, 2]]
        : sec === 'B' ? [[0, r, 4], [6, r, 2], [8, r + 7, 4], [12, r, 4]]
        : sec === 'A2' ? [[0, r, 8], [8, r, 4], [12, r + 7, 2], [14, r + 12, 2]]
        : [[0, r, 6], [6, r, 2], [8, r, 4], [12, r + 7, 4]];
      for (const [s, m, d] of pat) bass(c, g, t0 + s * s16, m, d * s16 * 0.95, hum(1));
    }
    if (acad && (sec === 'A' || sec === 'back') && bi % 2 === 0) bass(c, g, t0, ch.r + 12, barDur * 0.9, 0.55);
    // percusión: en el Mando, charles en B y todo en la Vuelta; en el despliegue la pone la capa 3
    const hats = !acad && (deploy || sec === 'B' || sec === 'back');
    if (hats) for (let s = 0; s < 16; s += 2) hat(c, g.perc, t0 + s * s16 + jit() * 0.4, hum(s % 4 === 2 ? 1 : 0.55), s === 14 && sec === 'back' && bi % 4 === 3);
    if (!acad && (deploy || sec === 'back')) { kick(c, g.perc, t0, 0.55); kick(c, g.perc, t0 + 8 * s16, 0.45); if (sec === 'back' && bi % 2) kick(c, g.perc, t0 + 14 * s16, 0.3); }
    if (full && sec === 'B' && bi >= 8) { snare(c, g.perc, t0 + 4 * s16, 0.28); snare(c, g.perc, t0 + 12 * s16, 0.32); if (bi === 15) for (let s = 12; s < 16; s++) snare(c, g.perc, t0 + s * s16, 0.18 + (s - 12) * 0.08); }
    if (full && sec === 'back' && bi % 4 === 3 && bi < 15) { tom(c, g.perc, t0 + 12 * s16, 52, 0.6); tom(c, g.perc, t0 + 13 * s16, 47, 0.6); tom(c, g.perc, t0 + 14 * s16, 43, 0.7); tom(c, g.perc, t0 + 15 * s16, 40, 0.75); }
    if (full && sec === 'back' && bi === 0) crash(c, g.perc, t0, 0.9);
    if (full && sec === 'B' && bi === 0) crash(c, g.perc, t0, 0.5, 1.6);
    // aire antes de cada sección nueva
    if (!acad && nxt.sec !== sec && nxt.sec !== 'bridge' && (!deploy || L >= 3)) swell(c, g.perc, t0 + 8 * s16, 8 * s16, nxt.sec === 'back' ? 1.2 : 0.8);
    if (full && sec === 'bridge' && bi === 7) for (let s = 8; s < 16; s++) snare(c, g.perc, t0 + s * s16, 0.1 + (s - 8) * 0.045);
    // ---- melodía ----
    const orn = lp >= 1;
    if (full) {
      if (sec === 'intro') {
        if (bi === 4) bell(c, g.bell, t0, 76 + (lp % 2 ? 12 : 0), s16 * 8, 0.5);
        if (bi === 6) { bell(c, g.bell, t0 + 8 * s16, 64, s16 * 3, 0.45); bell(c, g.bell, t0 + 11 * s16, 71, s16 * 5, 0.45); }
      } else if (sec === 'A' || sec === 'back') {
        const up = sec === 'back' ? 12 : 0, mel = A_MEL[bi];
        const swap = lp % 2 === 1 && bi >= 8; // segunda vuelta: el cuerno llama y la campana contesta
        if (bi % 4 === 0) {
          playMel(c, swap ? horn : bell, swap ? g.lead : g.bell, t0, s16, MOTIF, swap ? 0.85 : 0.95, swap ? 0 : up + (lp % 2 && sec === 'A' ? -12 : 0));
          if (sec === 'back') playMel(c, horn, g.lead, t0, s16, MOTIF, 0.6, 0);
        } else {
          playMel(c, swap ? bell : horn, swap ? g.bell : g.lead, t0, s16, mel, swap ? 0.75 : 0.8, swap ? 12 : 0, orn);
          if (sec === 'back') playMel(c, bell, g.bell, t0, s16, mel, 0.45, 12);
          if (sec === 'back' && bi >= 8) playMel(c, horn, g.lead, t0, s16, mel.map(([s, m, d]) => [s, dia(m, -2), d]), 0.45, 0);
        }
        if (sec === 'back' && bi === 15) bell(c, g.bell, t0, 88, s16 * 16, 0.4);
      } else if (sec === 'A2') {
        playMel(c, horn, g.lead, t0, s16, A2_MEL[bi], 0.7, lp % 2 && bi < 8 ? -12 : 0, orn);
        if (bi >= 8 && bi < 12 && bi % 2 === 0) playMel(c, bell, g.bell, t0, s16, lp % 2 ? COUNTER2 : COUNTER, 0.7, 0);
      } else if (sec === 'B') {
        const mel = B_MEL[bi % 8];
        if (bi < 8) playMel(c, horn, g.lead, t0, s16, mel, 0.78, 0, orn);
        else { playMel(c, horn, g.lead, t0, s16, mel, 0.6, 0, false); playMel(c, bell, g.bell, t0, s16, mel, 0.6, 12); }
        if (bi === 4 || bi === 12) strings(c, g.str, t0, ch.n.map((x) => x + 12), barDur * 1.9, 0.55, 0.9);
      } else if (sec === 'bridge') {
        playMel(c, bi === 7 ? horn : bell, bi === 7 ? g.lead : g.bell, t0, s16, BR_MEL[bi], bi === 7 ? 0.6 : 0.6, lp % 2 && bi < 7 ? -12 : 0);
      }
    } else if (acad) {
      if (sec === 'intro' && bi === 4) bell(c, g.bell, t0, 76, s16 * 8, 0.45);
      if ((sec === 'A' || sec === 'back') && bi % 4 === 0) playMel(c, bell, g.bell, t0, s16, MOTIF, 0.6, lp % 2 ? 12 : 0);
      if (sec === 'A2' && bi % 4 === 2) playMel(c, bell, g.bell, t0, s16, lp % 2 ? COUNTER2 : COUNTER, 0.55, 0);
      if (sec === 'B' && bi % 2 === 0) playMel(c, bell, g.bell, t0, s16, B_MEL[bi % 8], 0.5, 0);
      if (sec === 'bridge') playMel(c, bell, g.bell, t0, s16, BR_MEL[bi], 0.5, 0);
    } else {
      // despliegue: la llamada solo se insinúa (dos notas en el bajo) y, con la reserva en 0, en cuerdas
      if (sec === 'intro' && bi === 4) bell(c, g.bell, t0, 76, s16 * 8, 0.35);
      if (bi % 4 === 0 && L >= 2 && L < 4 && sec !== 'intro' && sec !== 'bridge') { bass(c, g, t0 + 12 * s16, 40, s16 * 3, 0.9); bass(c, g, t0 + 15 * s16, 47, s16, 0.9); }
      if (bi % 2 === 0) { strings(c, g.ready, t0, [64, 52], s16 * 3, 0.9, 0.06); strings(c, g.ready, t0 + 3 * s16, [71, 59], s16 * 12, 0.8, 0.12); }
      else strings(c, g.ready, t0, ch.n.map((x) => x + 12), barDur, 0.5, 0.6);
    }
  }
  function schedBattleBar(c, g, bar, t0, s16, lp) {
    const bi = bar % 16, name = BFORM[bi], ch = CH[name], v2 = (bar >= 16) !== (lp % 2 === 1);
    layerGains(g, 'battle', 4, t0);
    if (bar === 0) { crash(c, g.perc, t0, 1.1, 2.6); timp(c, g.perc, t0, 28, 1); strings(c, g.str, t0, [40, 47, 52], s16 * 10, 1.1, 0.02); }
    else if (bi === 0 || bi === 8) crash(c, g.perc, t0, 0.75);
    for (let b = 0; b < 4; b++) {
      const tb = t0 + b * 4 * s16;
      if (b % 2 === 0 || v2) kick(c, g.perc, tb, b === 0 ? 0.95 : 0.65);
      timp(c, g.perc, tb, b % 2 ? 35 : 28, b === 0 ? 0.75 : 0.38);
    }
    if (v2) { kick(c, g.perc, t0 + 14 * s16, 0.5); snare(c, g.perc, t0 + 4 * s16, 0.7); snare(c, g.perc, t0 + 12 * s16, 0.8); }
    if (bi % 4 === 3) {
      if (v2) for (let s = 12; s < 16; s++) snare(c, g.perc, t0 + s * s16, 0.35 + (s - 12) * 0.12);
      else { tom(c, g.perc, t0 + 12 * s16, 47, 0.7); tom(c, g.perc, t0 + 13 * s16, 45, 0.7); tom(c, g.perc, t0 + 14 * s16, 43, 0.8); tom(c, g.perc, t0 + 15 * s16, 40, 0.85); }
    }
    for (let s = 0; s < 16; s += 2) hat(c, g.perc, t0 + s * s16 + jit() * 0.3, hum(s % 4 === 2 ? 0.7 : 0.45), s === 14);
    for (let s = 0; s < 16; s += 2) bass(c, g, t0 + s * s16, ch.r + (v2 && s % 4 === 2 ? 12 : 0), s16 * 1.7, s % 8 === 0 ? 1 : 0.72);
    for (let s = 0; s < 16; s += 2) strings(c, g.str, t0 + s * s16, [OST[(s / 2) % 4] - (v2 ? 0 : 12)], s16 * 1.8, hum(0.72), 0.03, 2);
    pad(c, g, t0, ch.n, s16 * 16, 0.75);
    if (bi % 8 === 0) strings(c, g.str, t0, ch.n.map((x) => x + 12), s16 * 14, 0.55, 0.9);
    const mel = B_HORN[bi];
    playMel(c, horn, g.lead, t0, s16, mel, v2 ? 0.95 : 0.9, 0);
    if (v2) { playMel(c, bell, g.bell, t0, s16, mel, 0.5, 12); playMel(c, horn, g.lead, t0, s16, mel.map(([s, m, d]) => [s, dia(m, -2), d]), 0.5, 0); }
  }

  // ---------- estado del reproductor ----------
  let ctx = null, g = null, timer = null, cur = null, layer = 1, nextT = 0, step16 = 0, loops = 0, suspended = false, paused = false;
  let musicVol = 0.6, sfxVol = 0.8, musicOn = true, sfxOn = true;
  const MUSIC_SCALE = 0.55;
  let lastBar = -1, scheduledBars = 0, barErrors = 0, maxBarMs = 0, maxTickMs = 0, ticks = [];
  function tick() {
    if (!ctx || suspended || ctx.state !== 'running') return;
    const k0 = performance.now();
    if (Q.length) runQueue(ctx.currentTime, 0.28);
    if (!cur) { maxTickMs = Math.max(maxTickMs, performance.now() - k0); return; }
    const S = SONGS[cur.name], s16 = 60 / S.bpm / 4;
    // si el reloj se quedó atrás (pestaña dormida, equipo lento), retomar en el compás siguiente sin amontonar notas
    if (nextT < ctx.currentTime - 0.1) { const lag = ctx.currentTime - nextT; const skip = Math.ceil(lag / s16); step16 += skip; nextT += skip * s16; const r = step16 % 16; if (r) { step16 += 16 - r; nextT += (16 - r) * s16; } }
    while (nextT < ctx.currentTime + 0.45) {
      if (step16 % 16 === 0) {
        let bar = Math.floor(step16 / 16);
        if (bar >= S.bars) { step16 = 0; bar = 0; loops++; }
        const q0 = performance.now();
        // con la música apagada el reloj sigue, pero no se construye ninguna nota (ahorra batería en el teléfono)
        if (musicOn) { try { schedBar(ctx, g, cur.name, bar, nextT, s16, loops, layer); scheduledBars++; } catch (e) { barErrors++; } }
        lastBar = bar;
        maxBarMs = Math.max(maxBarMs, performance.now() - q0);
      }
      nextT += s16; step16++;
    }
    runQueue(ctx.currentTime, 0.28);
    const dk = performance.now() - k0; maxTickMs = Math.max(maxTickMs, dk); if (ticks.length < 400) ticks.push(+dk.toFixed(1));
  }
  function volTarget() { return musicOn ? musicVol * MUSIC_SCALE : 0.0001; }

  const API = {
    ready: false,
    init() {
      if (ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { ctx = new AC(); } catch (e2) { return false; } }
      g = build(ctx); liveCtx = ctx; API.ctx = ctx; API.ready = true;
      API.applyVol();
      return true;
    },
    start() { // tras el primer gesto
      if (!API.init()) return;
      if (ctx.state !== 'running' && !suspended) ctx.resume().catch(() => {});
      if (!timer) timer = setInterval(tick, 40);
    },
    applyVol() {
      if (!ctx) return; const t = ctx.currentTime;
      g.music.gain.cancelScheduledValues(t); g.music.gain.setTargetAtTime(volTarget(), t, 0.08);
      g.sfx.gain.cancelScheduledValues(t); g.sfx.gain.setTargetAtTime(sfxOn ? sfxVol : 0.0001, t, 0.03);
    },
    setMusic(on, vol) { musicOn = !!on; if (vol != null) musicVol = Math.max(0, Math.min(1, +vol || 0)); API.applyVol(); },
    setSfx(on, vol) { sfxOn = !!on; if (vol != null) sfxVol = Math.max(0, Math.min(1, +vol || 0)); API.applyVol(); },
    song(name) {
      if (!SONGS[name]) return;
      if (!ctx) API.init(); if (!ctx) return;
      if (cur && cur.name === name) return;
      const prev = cur; cur = { name };
      const t = ctx.currentTime;
      // menú y despliegue son la misma pieza: se sigue en el mismo compás y en el próximo tiempo 1 cambian las capas
      if (prev && (prev.name === 'menu' || prev.name === 'deploy') && (name === 'menu' || name === 'deploy')) return;
      const S = SONGS[name], s16 = 60 / S.bpm / 4;
      g.fade.gain.cancelScheduledValues(t);
      Q.length = 0;
      if (prev) {
        // de una pieza a otra: fundido corto y entrada limpia
        g.fade.gain.setValueAtTime(Math.max(0.0001, g.fade.gain.value), t);
        g.fade.gain.linearRampToValueAtTime(0.0001, t + 0.35);
        g.fade.gain.setValueAtTime(1, t + 0.42);
        g.delay.delayTime.setValueAtTime(3 * s16, t + 0.4); nextT = t + 0.45;
      } else {
        // desde el silencio o tras el cierre del resultado: la pieza entra por debajo de la cola, sin cortarla
        g.fade.gain.setValueAtTime(1, t); g.delay.delayTime.setValueAtTime(3 * s16, t); nextT = t + 0.08;
      }
      step16 = 0; loops = 0;
    },
    stopSong() { cur = null; Q.length = 0; if (ctx) { const t = ctx.currentTime; g.fade.gain.cancelScheduledValues(t); g.fade.gain.setTargetAtTime(0.0001, t, 0.2); } },
    setLayer(L) { layer = Math.max(0, Math.min(4, L | 0)); },
    // pausa: la música sigue, apagada y lejana, para que la vuelta no sea un corte
    pause(on) {
      on = !!on; if (on === paused) return; paused = on; if (!ctx) return;
      const t = ctx.currentTime;
      g.duck.gain.cancelScheduledValues(t); g.duck.gain.setTargetAtTime(on ? 0.45 : 1, t, on ? 0.12 : 0.25);
      g.pauseLP.frequency.cancelScheduledValues(t); g.pauseLP.frequency.setTargetAtTime(on ? 650 : 18000, t, on ? 0.12 : 0.3);
    },
    get paused() { return paused; },
    get layer() { return layer; },
    get song_() { return cur && cur.name; },
    get bar() { return lastBar; },
    // para pruebas: una copia de la salida final (después del limitador) como MediaStream
    tap() { if (!ctx) return null; if (!g.tap) { g.tap = ctx.createMediaStreamDestination(); g.limiter.connect(g.tap); } return g.tap.stream; },
    resetStats() { maxBarMs = 0; maxTickMs = 0; ticks = []; },
    stats() { return { scheduledBars, barErrors, maxBarMs: +maxBarMs.toFixed(1), maxTickMs: +maxTickMs.toFixed(1), p95: ticks.length ? ticks.slice().sort((a, b) => a - b)[Math.floor(ticks.length * 0.95)] : 0, queued: Q.length, loops, state: ctx && ctx.state, song: cur && cur.name, layer, paused }; },
    suspend() { suspended = true; if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {}); },
    resume() {
      suspended = false; if (!ctx) return;
      const go = () => { if (cur) nextT = Math.max(nextT, ctx.currentTime + 0.05); };
      if (ctx.state !== 'running') ctx.resume().then(go).catch(() => {}); else go();
    },
    get running() { return !!ctx && ctx.state === 'running'; },
    result(win) {
      if (!ctx || ctx.state !== 'running') { if (API.onIdle) setTimeout(API.onIdle, 0); return; }
      API.stopSong();
      const c = ctx, t = c.currentTime + 0.45, tail = stinger(c, g, t, win);
      g.fade.gain.cancelScheduledValues(c.currentTime); g.fade.gain.setTargetAtTime(0.0001, c.currentTime, 0.08); g.fade.gain.setValueAtTime(1, t - 0.02);
      resetGains(g, t - 0.05);
      setTimeout(() => { if (!cur) { if (API.onIdle) API.onIdle(); else API.song('menu'); } }, (tail - c.currentTime) * 1000);
    },
    sfx(name, o) {
      if (!ctx || !sfxOn || suspended || ctx.state !== 'running') return;
      direct = true; // los efectos responden al toque: se construyen en el acto
      try { sfxAt(ctx, g, name, o || {}, ctx.currentTime + 0.005); } catch (e) { /* un efecto fallido no rompe el juego */ }
      direct = false;
    },
    // Muestra para Julián (≈ 40 s): Intro → A del Mando con la llamada → despliegue con las capas 2-4 → lanzar →
    // batalla con tres revelados → cierre de victoria.
    async renderSample(seconds, opts) {
      const sr = 44100, OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const secs = seconds || 40, c = new OAC(2, Math.floor(sr * secs), sr), G2 = build(c);
      if (opts && opts.raw) { G2.limiter.threshold.value = 0; G2.limiter.ratio.value = 1; } // para medir la mezcla sin limitador
      G2.music.gain.value = 0.6 * MUSIC_SCALE; G2.sfx.gain.value = 0.8;
      const s = 60 / 84 / 4; let t = 0.05; seed = 0x5eed;
      const plan = [['menu', 6, 4], ['menu', 7, 4], ['menu', 8, 4], ['menu', 9, 4], ['menu', 10, 4], ['menu', 11, 4], ['deploy', 12, 2], ['deploy', 13, 3], ['deploy', 14, 4]];
      for (const [song, bar, L] of plan) { schedBar(c, G2, song, bar, t, s, 0, L); if (song === 'deploy') { sfxAt(c, G2, 'plus', { n: 20 + bar * 5 }, t + s * 4); sfxAt(c, G2, 'plus', { n: 25 + bar * 5 }, t + s * 10); } t += s * 16; }
      sfxAt(c, G2, 'full', {}, t - s * 6);
      sfxAt(c, G2, 'launch', {}, t - s * 2);
      const bs = 60 / 126 / 4;
      for (let b = 0; b < 3; b++) { schedBattleBar(c, G2, b, t, bs, 0); [0, 8].forEach((k, i) => { const w = (b * 2 + i) % 3 !== 1; sfxAt(c, G2, 'reveal', { win: w }, t + (k + 2) * bs); sfxAt(c, G2, w ? 'win' : 'tie', {}, t + (k + 2) * bs); }); t += bs * 16; }
      for (let k = 0; k < 8; k++) sfxAt(c, G2, 'tick', {}, t + k * 0.11);
      t += 0.95; sfxAt(c, G2, 'boom', {}, t); resetGains(G2, t);
      stinger(c, G2, t + 0.3, true); sfxAt(c, G2, 'medal', { lv: 3 }, t + 0.5);
      return c.startRendering();
    },
    // Para pruebas: renderiza «bars» compases de una pieza desde «from» (vuelta lp, capa L) y devuelve el AudioBuffer.
    async renderSong(name, from, bars, lp, L, opts) {
      const S = SONGS[name]; if (!S) return null;
      const sr = 22050, s16 = 60 / S.bpm / 4, secs = bars * 16 * s16 + 3;
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, c = new OAC(2, Math.floor(sr * secs), sr), G2 = build(c);
      if (opts && opts.raw) { G2.limiter.threshold.value = 0; G2.limiter.ratio.value = 1; }
      if (opts && opts.solo) { ['pad', 'arp', 'bass', 'bell', 'perc', 'str', 'lead', 'ready', 'amb'].forEach((k) => { if (k !== opts.solo) G2[k].disconnect(); }); if (opts.solo !== 'pad') G2.padFilter.disconnect(); }
      G2.music.gain.value = 0.6 * MUSIC_SCALE; let t = 0.05, errs = 0;
      for (let b = 0; b < bars; b++) { try { schedBar(c, G2, name, (from + b) % S.bars, t, s16, lp || 0, L == null ? 4 : L); } catch (e) { errs++; } t += 16 * s16; }
      const buf = await c.startRendering(); buf.errs = errs; return buf;
    }
  };

  // Cierre del resultado (devuelve el momento en que termina)
  function stinger(c, g, t, win) {
    const s = 60 / 84 / 4;
    playMel(c, bell, g.bell, t, s, MOTIF, 1, 12);
    playMel(c, horn, g.lead, t, s, MOTIF, 0.85, 0);
    for (const [st, m, d] of MOTIF) strings(c, g.str, t + st * s, [m - 12], d * s, 0.7, 0.05);
    timp(c, g.perc, t, 28, 0.7); kick(c, g.perc, t, 0.6);
    const t2 = t + 16 * s;
    if (win) {
      strings(c, g.str, t2, CH.B7.n, 8 * s, 0.9, 0.2); bass(c, g, t2, R.B, 8 * s, 1);
      for (let k = 0; k < 8; k++) timp(c, g.perc, t2 + 4 * s + k * s * 0.5, 35, 0.15 + k * 0.05);
      const t3 = t2 + 8 * s;
      strings(c, g.str, t3, CH.E.n.concat([68, 71]), 16 * s, 1, 0.3); bass(c, g, t3, R.E, 16 * s, 1); timp(c, g.perc, t3, 28, 0.9); crash(c, g.perc, t3, 0.8, 3);
      horn(c, g.lead, t3, 68, 14 * s, 0.75); horn(c, g.lead, t3, 64, 14 * s, 0.6);
      [76, 80, 83, 88].forEach((m, i) => bell(c, g.bell, t3 + i * s, m, 12 * s, 0.6));
      return t3 + 18 * s;
    }
    strings(c, g.str, t2, CH.B7sus4.n, 8 * s, 0.8, 0.3); bass(c, g, t2, R.B, 8 * s, 0.9);
    const t3 = t2 + 8 * s;
    pad(c, g, t3, CH.Em9.n, 16 * s, 1.1); bass(c, g, t3, R.E, 16 * s, 0.9); bell(c, g.bell, t3 + 4 * s, 78, 12 * s, 0.45);
    return t3 + 12 * s;
  }

  // ---------- efectos (afinados en Mi menor) ----------
  const PENT = [40, 43, 45, 47, 50]; // Mi menor pentatónica
  const pent = (i) => PENT[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5);
  function sfxAt(c, g, name, o, t) {
    const D = g.sfx, V = g.sfxVerb;
    switch (name) {
      case 'plus': case 'minus': {
        // la nota sube con las naves del planeta: dos octavas de pentatónica, de Mi4 a Mi6
        const k = Math.max(0, Math.min(10, Math.round((o.n || 0) / 10))), m = pent(k + 10) - (name === 'minus' ? 0 : 0);
        if (name === 'plus') blip(c, D, t, m, 0.09, 0.75, true);
        else { blip(c, D, t, pent(k + 9), 0.07, 0.5, false); }
        if (name === 'plus' && o.n && o.n % 10 === 0) bell(c, D, t + 0.012, m + 12, 0.14, 0.32);
        else if (name === 'plus' && o.n && o.n % 5 === 0) blip(c, D, t + 0.012, m + 19, 0.06, 0.3, false);
        break;
      }
      case 'max': {
        const o1 = osc(c, 'sine', 82, t, t + 0.26); o1.frequency.setValueAtTime(82, t); o1.frequency.exponentialRampToValueAtTime(41, t + 0.15);
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300; const a = c.createGain(); a.gain.setValueAtTime(0.5, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o1.connect(f); f.connect(a); a.connect(D); break;
      }
      case 'full': [64, 67, 71, 78, 83].forEach((m, i) => blip(c, i > 2 ? V : D, t + i * 0.045, m, 0.35, 0.6, i > 2)); [64, 67, 71, 78, 83].forEach((m, i) => blip(c, D, t + i * 0.045, m, 0.35, 0.5, false)); bell(c, V, t + 0.22, 88, 0.6, 0.35); break;
      case 'transfer': {
        const a0 = o.from || 64, b0 = o.to || 71;
        const os = osc(c, 'sine', mtof(a0 + 12), t, t + 0.13); os.frequency.setValueAtTime(mtof(a0 + 12), t); os.frequency.exponentialRampToValueAtTime(mtof(b0 + 12), t + 0.08);
        const ga = c.createGain(); ga.gain.setValueAtTime(0.0001, t); ga.gain.linearRampToValueAtTime(0.045, t + 0.01); ga.gain.exponentialRampToValueAtTime(0.0001, t + 0.11); os.connect(ga); ga.connect(D); break;
      }
      case 'launch': {
        const n = noiseSrc(c, t, t + 1.25), f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(260, t); f.frequency.exponentialRampToValueAtTime(5200, t + 0.9);
        const a = c.createGain(); a.gain.setValueAtTime(0.0001, t); a.gain.linearRampToValueAtTime(0.28, t + 0.6); a.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
        n.connect(f); f.connect(a); a.connect(D); a.connect(V);
        strings(c, D, t + 0.1, [40, 47, 52, 59], 1.0, 1.5, 0.12); timp(c, D, t + 0.1, 28, 0.6); break;
      }
      case 'win': [64, 71, 76].forEach((m, i) => bell(c, D, t + i * 0.065, m + 12, 0.2, 0.5)); break;
      case 'lose': { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.connect(D); blip(c, f, t, 47, 0.28, 0.9, false); blip(c, f, t + 0.01, 48, 0.28, 0.75, false); break; }
      case 'tie': bell(c, D, t, 71, 0.3, 0.42); bell(c, V, t + 0.19, 71, 0.2, 0.25); bell(c, V, t + 0.38, 71, 0.15, 0.12); break;
      case 'reveal': timp(c, D, t, o.win ? 35 : 28, 0.8); if (o.win) bell(c, D, t + 0.02, 76, 0.2, 0.28); break;
      case 'tick': blip(c, D, t, 88, 0.025, 0.3, false); break;
      case 'boom': timp(c, D, t, 28, 1); kick(c, D, t, 1); crash(c, V, t, 0.6, 1.6); break;
      case 'medal': {
        const lv = o.lv || 1;
        if (lv >= 3) [76, 80, 83, 88].forEach((m, i) => bell(c, D, t + i * 0.05, m, 0.6, 0.55));
        else bell(c, D, t, lv === 2 ? 76 : 71, 0.6, 0.7);
        bell(c, V, t, 64, 0.8, 0.3); break;
      }
      case 'streak': bell(c, D, t, 71, 0.15, 0.5); bell(c, D, t + 0.12, 76, 0.3, 0.6); break;
      case 'star': bell(c, D, t, [76, 79, 83][Math.min(2, o.i || 0)], 0.4, 0.65); blip(c, V, t, [76, 79, 83][Math.min(2, o.i || 0)] + 12, 0.2, 0.3, true); break;
      case 'click': blip(c, D, t, 76, 0.035, 0.32, false); break;
      case 'back': blip(c, D, t, 71, 0.035, 0.3, false); break;
      case 'toggle': blip(c, D, t, 79, 0.02, 0.3, true); blip(c, D, t + 0.045, 79, 0.02, 0.28, true); break;
      case 'error': [0, 0.13].forEach((d) => { const os = osc(c, 'square', mtof(36), t + d, t + d + 0.12); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; const a = c.createGain(); a.gain.setValueAtTime(0.0001, t + d); a.gain.linearRampToValueAtTime(0.18, t + d + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.1); os.connect(f); f.connect(a); a.connect(D); }); break;
      case 'copy': bell(c, D, t, 83, 0.12, 0.4); bell(c, V, t + 0.08, 83, 0.1, 0.18); break;
      case 'warn': blip(c, D, t, 59, 0.12, 0.5, false); blip(c, D, t + 0.09, 55, 0.14, 0.4, false); break;
      case 'whoosh': {
        const n = noiseSrc(c, t, t + 0.33), f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.5; f.frequency.setValueAtTime(800, t); f.frequency.exponentialRampToValueAtTime(2600, t + 0.25);
        const a = c.createGain(); a.gain.setValueAtTime(0.0001, t); a.gain.linearRampToValueAtTime(0.08, t + 0.08); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); n.connect(f); f.connect(a); a.connect(D); break;
      }
    }
  }
  window.FrentesAudio = API;
})();
