// ============================================================================
// Partitura y síntesis de la música original de Salchidrez: "Milonga del Salchicha"
// Se renderiza con tools/render-music.js y genera ../milonga.mp3.
// Trío de milonga: bandoneón, guitarra criolla y contrabajo.
// La guitarra y el contrabajo usan síntesis de cuerda pulsada (Karplus-Strong);
// el bandoneón, lengüetas desafinadas con formante y vibrato. Todo se renderiza
// con OfflineAudioContext (con reverb de sala). El final se suma al principio
// para que el loop no tenga costura.
// La menor / Do mayor, 2/4, 88 bpm, 32 compases.
// ============================================================================
const Milonga = (() => {
  const SR = 32000;
  const BPM = 88;
  const STEP = 60 / BPM / 4;     // semicorchea
  const BAR = STEP * 8;          // compás de 2/4
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  const CH = {
    Am: { root: 45, fifth: 52, gtr: [57, 60, 64, 69] },
    E7: { root: 40, fifth: 47, gtr: [56, 59, 62, 64] },
    A7: { root: 45, fifth: 52, gtr: [57, 61, 64, 67] },
    Dm: { root: 50, fifth: 45, gtr: [57, 62, 65, 69] },
    C:  { root: 48, fifth: 43, gtr: [55, 60, 64, 67] },
    G7: { root: 43, fifth: 50, gtr: [55, 59, 62, 65] },
    F:  { root: 41, fifth: 48, gtr: [57, 60, 65, 69] },
  };

  // Melodía del bandoneón: [paso, nota midi, duración en pasos] por compás de 2/4.
  // Las frases siguen el 3-3-2 de la milonga.
  const SONG = [
    // A
    ['Am', [[0, 76, 3], [3, 76, 3], [6, 74, 2]]],
    ['Am', [[0, 72, 3], [3, 71, 3], [6, 72, 2]]],
    ['Am', [[0, 69, 6], [6, 72, 2]]],
    ['E7', [[0, 71, 3], [3, 74, 3], [6, 77, 2]]],
    ['E7', [[0, 76, 3], [3, 74, 3], [6, 71, 2]]],
    ['E7', [[0, 68, 3], [3, 71, 3], [6, 74, 2]]],
    ['E7', [[0, 76, 8]]],
    ['Am', [[0, 72, 3], [3, 71, 3], [6, 69, 2]]],
    ['Am', [[0, 81, 3], [3, 79, 3], [6, 77, 2]]],
    ['A7', [[0, 76, 3], [3, 73, 3], [6, 76, 2]]],
    ['Dm', [[0, 77, 3], [3, 74, 3], [6, 77, 2]]],
    ['Dm', [[0, 81, 6], [6, 79, 2]]],
    ['Am', [[0, 77, 3], [3, 76, 3], [6, 72, 2]]],
    ['E7', [[0, 74, 3], [3, 71, 3], [6, 68, 2]]],
    ['Am', [[0, 69, 8]]],
    ['Am', [[4, 76, 2], [6, 79, 2]]],
    // B
    ['C',  [[0, 84, 3], [3, 84, 3], [6, 83, 2]]],
    ['C',  [[0, 79, 6], [6, 76, 2]]],
    ['G7', [[0, 77, 3], [3, 79, 3], [6, 83, 2]]],
    ['G7', [[0, 86, 6], [6, 83, 2]]],
    ['G7', [[0, 81, 3], [3, 79, 3], [6, 77, 2]]],
    ['G7', [[0, 74, 3], [3, 77, 3], [6, 79, 2]]],
    ['C',  [[0, 76, 8]]],
    ['E7', [[0, 80, 3], [3, 83, 3], [6, 86, 2]]],
    ['F',  [[0, 84, 3], [3, 81, 3], [6, 77, 2]]],
    ['F',  [[0, 81, 6], [6, 79, 2]]],
    ['C',  [[0, 79, 3], [3, 76, 3], [6, 72, 2]]],
    ['Am', [[0, 76, 6], [6, 72, 2]]],
    ['Dm', [[0, 74, 3], [3, 77, 3], [6, 81, 2]]],
    ['E7', [[0, 80, 3], [3, 77, 3], [6, 74, 2]]],
    ['Am', [[0, 72, 3], [3, 71, 3], [6, 69, 2]]],
    ['E7', [[0, 68, 4], [4, 71, 2], [6, 74, 2]]],
  ];
  const LOOP = SONG.length * BAR;
  const TAIL = 3;

  // Generador pseudoaleatorio con semilla: la música sale igual en cada render
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  // --- Cuerda pulsada (Karplus-Strong) -------------------------------------
  const ksCache = new Map();
  function ks(midi, kind) {
    const key = kind + midi;
    if (ksCache.has(key)) return ksCache.get(key);
    const f = hz(midi);
    const N = Math.max(2, Math.floor(SR / f - 0.5));
    const f0 = SR / (N + 0.5);
    const t60 = kind === 'bass' ? 1.6 : Math.max(0.9, 2.6 - (midi - 52) * 0.06);
    const len = Math.floor(SR * Math.min(t60 * 1.1, 3));
    const y = new Float32Array(len);
    // Excitación: ruido suavizado (más suave = cuerda de nylon / contrabajo)
    const ex = new Float32Array(N);
    for (let i = 0; i < N; i++) ex[i] = rnd() * 2 - 1;
    const passes = kind === 'bass' ? 6 : 2;
    for (let p = 0; p < passes; p++) for (let i = 1; i < N; i++) ex[i] = 0.5 * (ex[i] + ex[i - 1]);
    // Posición de la púa: filtro peine sobre la excitación
    const pick = Math.max(1, Math.floor(N * (kind === 'bass' ? 0.2 : 0.13)));
    for (let i = 0; i < N; i++) y[i] = ex[i] - (i >= pick ? ex[i - pick] : 0);
    const loss = Math.pow(0.001, 1 / (f0 * t60));
    for (let i = N; i < len; i++) {
      y[i] = loss * 0.5 * (y[i - N] + y[i - N - 1 < 0 ? 0 : i - N - 1]);
    }
    let peak = 0;
    for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(y[i]));
    const fade = Math.floor(SR * 0.05);
    for (let i = 0; i < len; i++) {
      y[i] /= peak || 1;
      if (i > len - fade) y[i] *= (len - i) / fade;
    }
    const out = { data: y, rate: f / f0 };
    ksCache.set(key, out);
    return out;
  }

  function playString(ctx, dest, midi, kind, t, vel) {
    const k = ks(midi, kind);
    const buf = ctx.createBuffer(1, k.data.length, SR);
    buf.copyToChannel(k.data, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = k.rate;
    const g = ctx.createGain();
    g.gain.value = vel;
    src.connect(g); g.connect(dest);
    src.start(Math.max(0, t));
  }

  // --- Bandoneón ------------------------------------------------------------
  let reedWave = null;
  function reed(ctx) {
    // Espectro de lengüeta: armónicos decrecientes con los pares más débiles
    const n = 24, re = new Float32Array(n), im = new Float32Array(n);
    for (let h = 1; h < n; h++) im[h] = (h % 2 ? 1 : 0.55) / Math.pow(h, 0.95);
    return ctx.createPeriodicWave(re, im);
  }
  function bandoneon(ctx, dest, midi, t, dur, vel) {
    t = Math.max(0, t);
    const f = hz(midi);
    const end = t + dur;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(vel, t + 0.05);
    env.gain.linearRampToValueAtTime(vel * 0.8, t + 0.18);
    env.gain.setValueAtTime(vel * 0.8, Math.max(t + 0.18, end - 0.02));
    env.gain.linearRampToValueAtTime(0.0001, end + 0.1);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = 0.6;
    const formant = ctx.createBiquadFilter();
    formant.type = 'peaking'; formant.frequency.value = 1150; formant.Q.value = 1.2; formant.gain.value = 6;
    lp.connect(formant); formant.connect(env); env.connect(dest);
    // Vibrato que entra de a poco en las notas largas
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.value = 5.3;
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(dur > 0.5 ? 9 : 2, t + Math.min(0.6, dur));
    lfo.connect(depth);
    // Dos lengüetas desafinadas apenas + una octava abajo suave (como el bandoneón real)
    for (const [mul, det, lvl] of [[1, 6, 0.5], [1, -6, 0.5], [0.5, 0, 0.22]]) {
      const o = ctx.createOscillator();
      o.setPeriodicWave(reedWave);
      o.frequency.value = f * mul;
      o.detune.value = det;
      depth.connect(o.detune);
      const g = ctx.createGain(); g.gain.value = lvl;
      o.connect(g); g.connect(lp);
      o.start(t); o.stop(end + 0.15);
    }
    lfo.start(t); lfo.stop(end + 0.15);
  }

  function impulse(ctx, secs) {
    const len = Math.floor(SR * secs);
    const buf = ctx.createBuffer(2, len, SR);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        lp = lp * 0.55 + (rnd() * 2 - 1) * 0.45;
        d[i] = lp * Math.pow(1 - i / len, 2.6);
      }
    }
    return buf;
  }

  // --- Arreglo ----------------------------------------------------------------
  async function renderSong() {
    seed = 7;
    const len = Math.ceil((LOOP + TAIL) * SR);
    const ctx = new OfflineAudioContext(2, len, SR);
    reedWave = reed(ctx);

    const master = ctx.createDynamicsCompressor();
    master.threshold.value = -16; master.ratio.value = 2.5; master.attack.value = 0.01; master.release.value = 0.2;
    master.connect(ctx.destination);
    const verb = ctx.createConvolver();
    verb.buffer = impulse(ctx, 2.2);
    const verbIn = ctx.createGain(); verbIn.gain.value = 1;
    const verbOut = ctx.createGain(); verbOut.gain.value = 0.35;
    verbIn.connect(verb); verb.connect(verbOut); verbOut.connect(master);

    const bus = (pan, dry, send, eq) => {
      const inp = ctx.createGain();
      let node = inp;
      for (const [type, freq, gain, q] of eq) {
        const f = ctx.createBiquadFilter();
        f.type = type; f.frequency.value = freq;
        if (gain !== undefined) f.gain.value = gain;
        if (q !== undefined) f.Q.value = q;
        node.connect(f); node = f;
      }
      const p = ctx.createStereoPanner(); p.pan.value = pan;
      const d = ctx.createGain(); d.gain.value = dry;
      const s = ctx.createGain(); s.gain.value = send;
      node.connect(p); p.connect(d); d.connect(master);
      p.connect(s); s.connect(verbIn);
      return inp;
    };
    const bandoBus = bus(0.18, 0.5, 0.32, [['highpass', 160], ['peaking', 3200, -3, 1]]);
    const guitarBus = bus(-0.3, 0.55, 0.22, [['highpass', 90], ['peaking', 200, 3, 1], ['peaking', 2600, 2, 1], ['lowpass', 5200]]);
    const bassBus = bus(0, 0.8, 0.06, [['lowpass', 900], ['peaking', 100, 4, 1]]);

    const human = () => (rnd() - 0.5) * 0.012;

    SONG.forEach(([chName, notes], bar) => {
      const ch = CH[chName];
      const t0 = bar * BAR;
      const partB = bar >= 16;

      // Contrabajo: 3-3-2
      playString(ctx, bassBus, ch.root - 12, 'bass', t0 + human(), 0.95);
      playString(ctx, bassBus, ch.fifth - 12, 'bass', t0 + 3 * STEP + human(), 0.65);
      playString(ctx, bassBus, ch.root - 12, 'bass', t0 + 6 * STEP + human(), 0.55);

      // Guitarra: rasguido hacia abajo en los acentos de la milonga
      const strums = partB ? [[0, 0.32], [3, 0.55], [6, 0.42]] : [[3, 0.45], [6, 0.35]];
      for (const [stp, vel] of strums) {
        const ts = t0 + stp * STEP + human();
        ch.gtr.forEach((m, i) => playString(ctx, guitarBus, m, 'gtr', ts + i * 0.014, vel * (0.85 + rnd() * 0.3)));
      }
      // Bordoneo de la guitarra en la parte A, entre notas largas
      if (!partB && notes.length === 1) {
        [ch.gtr[3], ch.gtr[2], ch.gtr[1]].forEach((m, i) =>
          playString(ctx, guitarBus, m + 12, 'gtr', t0 + (4 + i) * STEP + human(), 0.3));
      }

      // Bandoneón: melodía, con más fuelle en la parte B
      for (const [stp, m, d] of notes) {
        const accent = stp === 0 ? 1 : stp === 3 ? 0.85 : 0.75;
        bandoneon(ctx, bandoBus, m, t0 + stp * STEP + human(), d * STEP * 0.96, (partB ? 0.2 : 0.16) * accent);
      }
      // Mano izquierda del bandoneón: acorde sostenido suave en la parte B
      if (partB && (bar % 2 === 0)) {
        for (const m of ch.gtr.slice(0, 3)) bandoneon(ctx, bandoBus, m, t0, BAR * 1.9, 0.035);
      }
    });

    const rendered = await ctx.startRendering();
    // Loop sin costura: la cola del final se suma al principio
    const loopLen = Math.floor(LOOP * SR);
    const tail = rendered.length - loopLen;
    const out = new AudioBuffer({ numberOfChannels: 2, length: loopLen, sampleRate: SR });
    let peak = 0;
    const chans = [];
    for (let c = 0; c < 2; c++) {
      const src = rendered.getChannelData(c);
      const d = new Float32Array(loopLen);
      d.set(src.subarray(0, loopLen));
      for (let i = 0; i < tail; i++) d[i] += src[loopLen + i];
      for (let i = 0; i < loopLen; i++) peak = Math.max(peak, Math.abs(d[i]));
      chans.push(d);
    }
    const norm = peak > 0 ? 0.85 / peak : 1;
    chans.forEach((d, c) => { for (let i = 0; i < loopLen; i++) d[i] *= norm; out.copyToChannel(d, c); });
    return out;
  }

  return { render: renderSong, LOOP };
})();

if (typeof window !== 'undefined') window.Milonga = Milonga;
