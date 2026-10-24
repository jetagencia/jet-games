// JET//Caja Negra · música original y efectos, todo sintetizado con Web Audio (sin samples ni melodías ajenas).
// Compositor: agente 3 de 5 (2026-10-22). Concepto: «sala de análisis a las tres de la mañana».
//
// Tonalidad: Re menor, con color dórico (Si natural) en la sección B; el caso resuelto cierra en Re mayor.
// Motivo «telemetría» (corto-corto-largo, como un acuse de recibo): La4 – Do5 – Re5; en B se invierte.
//
// Temas
//  · «Archivo» (inicio y menús, 76 BPM, 4/4, recto): intro 4 · A 8 · A' 8 · B 8 · puente 4 · A grave con
//    chelo 8 · coda 4 = 44 compases ≈ 139 s. Vuelta 2: voicings abiertos y chelo en el puente.
//    Vuelta 3: entra el pulso de datos al 30 % y el chelo dobla la B. Ciclo completo ≈ 7 min sin repetirse igual.
//  · «Reconstrucción» (partida, 88 BPM, swing 55 %): intro 4 · A 8 · A' 8 · B 8 · puente 4 · A'' 8 ·
//    B' 8 · vuelta 4 = 52 compases ≈ 142 s. Por vuelta cambian la octava de la melodía, el patrón del
//    pulso (3), el ostinato y el relleno de escobillas (4), y entra el chelo.
//    Capas: 0 = sala + pad + bajo + piano escaso · 1 (≥ 50 % de huecos) = pulso de datos + ostinato ·
//    2 (tras un envío con 1-2 errores) = escobillas, bombo y aro. Todo cambio de capa entra en el compás siguiente.
//
// Instrumentos: pad «sala» (3 sierras ±7 cents, paso bajo con LFO), piano eléctrico FM (dos moduladoras),
// bajo triángulo + seno sub, pulso de datos (seno corto en paso banda 2 kHz, en estéreo alterno),
// chelo sintético (sierra + triángulo con vibrato tardío), escobillas/bombo/aro de ruido, tono de sala
// (ruido rosa grave) y textura de radio. Reverb por convolución generada (música 3,2 s; efectos 1,3 s).
// Mezcla: música ≈ −7 dB bajo los efectos, compresor-limitador (−6 dB, 12:1, 3 ms) y recorte suave final.
//
// El mismo motor sirve en vivo (AudioContext) y para exportar una muestra (OfflineAudioContext).
(function (G) {
  'use strict';

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function prng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // ───────────── Armonía ─────────────
  // Voicings del pad sin fundamental (la pone el bajo), entre Re3 y La4.
  const PAD = {
    Dm9: [53, 57, 60, 64], 'Dm9/C': [53, 57, 62, 64], Bbmaj7: [50, 53, 57, 60], Gm9: [53, 57, 58, 62],
    A7sus4: [52, 55, 57, 62], A7: [52, 55, 57, 61], 'Fmaj7/C': [53, 60, 64, 69], Asus4: [52, 57, 62, 64],
    G9: [53, 57, 59, 62], G13: [53, 57, 59, 64], Em7b5: [52, 55, 58, 62], A7b9: [55, 58, 61, 64],
    'Bbmaj7#11': [50, 57, 60, 64], Cadd9: [52, 55, 60, 62], Dped: [50, 57, 62, 64],
    T1: [52, 57, 58, 64], T2: [52, 55, 58, 61] // tensión: La pedal con Si bemol (b9) que sube un semitono sobre el La
  };
  const RAIZ = { Dm9: 38, 'Dm9/C': 36, Bbmaj7: 34, Gm9: 31, A7sus4: 33, A7: 33, 'Fmaj7/C': 36, Asus4: 33, G9: 31, G13: 31, Em7b5: 40, A7b9: 33, 'Bbmaj7#11': 34, Cadd9: 36, Dped: 38, T1: 33, T2: 33 };
  // Un acorde por compás.
  const SEC = {
    intro: ['Dm9', 'Dm9', 'Bbmaj7', 'Asus4'],
    A: ['Dm9', 'Dm9', 'Bbmaj7', 'Bbmaj7', 'Gm9', 'Gm9', 'A7sus4', 'A7'],
    A2: ['Dm9', 'Dm9', 'Fmaj7/C', 'Fmaj7/C', 'Bbmaj7', 'Bbmaj7', 'Asus4', 'A7'],
    B: ['Dm9', 'G9', 'Dm9', 'G13', 'Em7b5', 'A7b9', 'Dm9', 'A7b9'],
    puente: ['Bbmaj7#11', 'Cadd9', 'Bbmaj7#11', 'Dped'],
    A3: ['Dm9', 'Dm9/C', 'Bbmaj7', 'Bbmaj7', 'Gm9', 'Gm9', 'A7sus4', 'A7'],
    B2: ['Dm9', 'G9', 'Dm9', 'G13', 'Bbmaj7#11', 'A7b9', 'Dm9', 'A7b9'],
    coda: ['Dm9', 'Bbmaj7', 'Asus4', 'Dped'],
    vuelta: ['Bbmaj7', 'Cadd9', 'Asus4', 'A7']
  };
  SEC.Av = SEC.A; SEC.introJ = SEC.intro; SEC.puenteJ = SEC.puente;

  // Melodías del piano FM: [tiempo en negras dentro de la sección, nota MIDI, duración en negras]
  const MELM = { // «Archivo»: frases con aire, que dejan leer
    intro: [[4, 69, 0.5], [4.5, 72, 0.5], [5, 74, 3], [10, 81, 0.5], [10.5, 79, 0.5], [11, 76, 1]],
    A: [[0, 69, 0.5], [0.5, 72, 0.5], [1, 74, 2.5], [6, 77, 0.5], [6.5, 76, 0.5], [7, 74, 1],
      [8, 74, 0.5], [8.5, 77, 0.5], [9, 81, 2], [12.5, 79, 0.5], [13, 77, 1], [14, 76, 2],
      [16, 67, 0.5], [16.5, 70, 0.5], [17, 72, 2.5], [22, 74, 0.5], [22.5, 72, 0.5], [23, 70, 1],
      [24, 69, 2], [26, 74, 1], [27, 76, 1], [28, 73, 2], [30, 76, 0.5], [30.5, 79, 1.5]],
    A2: [[0, 69, 0.5], [0.5, 72, 0.5], [1, 74, 1.5], [2.5, 76, 0.5], [3, 77, 1], [4, 76, 1], [5, 74, 3],
      [8, 72, 0.5], [8.5, 76, 0.5], [9, 77, 2.5], [12, 79, 0.5], [12.5, 81, 1.5], [14, 77, 2],
      [16, 81, 1], [17, 79, 0.5], [17.5, 77, 0.5], [18, 74, 2], [21, 70, 0.5], [21.5, 72, 0.5], [22, 74, 2],
      [24, 76, 1.5], [25.5, 74, 0.5], [26, 74, 2], [28, 73, 1], [29, 76, 1], [30, 69, 2]],
    B: [[0, 74, 0.5], [0.5, 72, 0.5], [1, 69, 2.5], [5, 71, 0.5], [5.5, 74, 0.5], [6, 77, 2],
      [8, 76, 1], [9, 74, 1], [10, 72, 1], [11, 69, 1], [12, 71, 1], [13, 76, 3],
      [16, 74, 0.5], [16.5, 72, 0.5], [17, 70, 2.5], [20, 70, 1], [21, 69, 1], [22, 73, 2],
      [24, 74, 0.5], [24.5, 72, 0.5], [25, 69, 1], [26, 77, 2], [28, 76, 1], [29, 73, 1], [30, 70, 1], [31, 67, 1]],
    puente: [[0, 69, 0.5], [0.5, 72, 0.5], [1, 74, 3], [4, 74, 1], [5, 76, 1], [6, 79, 2], [8, 76, 0.5], [8.5, 74, 0.5], [9, 81, 3], [12, 74, 4]],
    coda: [[0, 69, 0.5], [0.5, 72, 0.5], [1, 74, 3], [4, 77, 0.5], [4.5, 76, 0.5], [5, 74, 3], [8, 72, 1], [9, 69, 3], [12, 62, 4]]
  };
  MELM.Av = MELM.A.map(([p, n, d]) => [p, n - 12, d]); // la A vuelve una octava abajo, con el chelo encima

  const MELJ = { // «Reconstrucción»: más rítmica, con síncopas que el swing redondea
    introJ: [[8, 69, 0.5], [8.5, 72, 0.5], [9, 74, 3]],
    A: [[0, 69, 0.5], [0.5, 72, 0.5], [1, 74, 2], [5.5, 77, 0.5], [6, 76, 0.5], [6.5, 74, 1.5],
      [8, 70, 0.5], [8.5, 74, 0.5], [9, 77, 2], [13, 76, 0.5], [13.5, 74, 0.5], [14, 72, 2],
      [16, 70, 0.5], [16.5, 74, 0.5], [17, 72, 1], [18, 70, 1], [19, 69, 1], [21, 67, 1], [22, 70, 2],
      [24, 74, 1], [25, 76, 0.5], [25.5, 74, 0.5], [26, 74, 2], [28, 73, 1.5], [29.5, 69, 0.5], [30, 76, 2]],
    A2: [[0, 74, 0.5], [0.5, 77, 0.5], [1, 81, 2], [5, 79, 0.5], [5.5, 77, 0.5], [6, 76, 2],
      [8, 72, 1], [9, 77, 0.5], [9.5, 76, 0.5], [10, 72, 2], [13, 69, 0.5], [13.5, 72, 0.5], [14, 74, 2],
      [16, 77, 1.5], [17.5, 76, 0.5], [18, 74, 1], [19, 72, 1], [20, 74, 3],
      [24, 69, 0.5], [24.5, 72, 0.5], [25, 74, 2.5], [28, 73, 2], [30.5, 64, 0.5], [31, 69, 1]],
    B: [[0, 74, 0.5], [0.5, 72, 0.5], [1, 69, 2], [4, 71, 0.5], [4.5, 74, 0.5], [5, 76, 1], [6, 74, 2],
      [8, 77, 0.5], [8.5, 76, 0.5], [9, 74, 1], [10, 72, 2], [12, 71, 1], [13, 76, 1], [14, 79, 2],
      [16, 79, 0.5], [16.5, 77, 0.5], [17, 74, 1], [18, 70, 2], [20, 73, 1], [21, 70, 1], [22, 67, 2],
      [24, 74, 0.5], [24.5, 72, 0.5], [25, 69, 2.5], [29, 76, 0.5], [29.5, 73, 0.5], [30, 69, 2]],
    puenteJ: [[0, 81, 0.5], [0.5, 79, 0.5], [1, 76, 3], [4, 74, 0.5], [4.5, 76, 0.5], [5, 79, 3], [8, 76, 1], [9, 74, 1], [10, 69, 2], [12, 74, 4]],
    A3: [[0, 57, 0.5], [0.5, 60, 0.5], [1, 62, 2], [3.5, 69, 0.5], [4, 72, 0.5], [4.5, 74, 2.5],
      [8, 70, 0.5], [8.5, 74, 0.5], [9, 77, 2], [12, 76, 1], [13, 72, 1], [14, 74, 2],
      [16, 67, 0.5], [16.5, 70, 0.5], [17, 74, 2], [20, 72, 0.5], [20.5, 70, 0.5], [21, 69, 2],
      [24, 69, 1], [25, 74, 1], [26, 76, 2], [28, 73, 1], [29, 76, 1], [30, 79, 1], [31, 81, 1]],
    B2: [[0, 86, 0.5], [0.5, 84, 0.5], [1, 81, 3], [5, 83, 0.5], [5.5, 81, 0.5], [6, 79, 2],
      [8, 77, 1], [9, 76, 1], [10, 74, 2], [12, 76, 0.5], [12.5, 79, 0.5], [13, 83, 3],
      [16, 81, 1], [17, 76, 1], [18, 74, 2], [20, 73, 1], [21, 76, 1], [22, 70, 2],
      [24, 74, 0.5], [24.5, 72, 0.5], [25, 69, 3], [28, 67, 0.5], [28.5, 70, 0.5], [29, 73, 1], [30, 76, 2]],
    vuelta: [[0, 74, 1], [1, 77, 1], [2, 81, 2], [4, 79, 1], [5, 76, 1], [6, 74, 2], [8, 69, 0.5], [8.5, 72, 0.5], [9, 74, 3], [12, 73, 2], [14, 76, 1], [15, 69, 1]]
  };

  // Chelo (contracanto grave, notas largas)
  const CHELO = {
    Av: [[0, 65, 4], [4, 64, 4], [8, 62, 4], [12, 65, 4], [16, 62, 4], [20, 58, 4], [24, 62, 4], [28, 61, 4]],
    puente: [[0, 65, 4], [4, 67, 4], [8, 64, 4], [12, 62, 4]],
    B: [[0, 65, 4], [4, 62, 2], [6, 59, 2], [8, 60, 4], [12, 59, 4], [16, 58, 4], [20, 61, 4], [24, 62, 4], [28, 58, 2], [30, 61, 2]],
    A3: [[0, 65, 8], [8, 65, 4], [12, 64, 4], [16, 62, 8], [24, 62, 4], [28, 61, 4]],
    B2: [[0, 62, 4], [4, 62, 4], [8, 65, 4], [12, 64, 4], [16, 62, 4], [20, 61, 4], [24, 65, 4], [28, 64, 4]],
    A: [[0, 62, 8], [8, 62, 8], [16, 62, 4], [20, 58, 4], [24, 57, 8]]
  };

  // Ostinato del piano (capa 1 de la partida): índices del voicing del pad, en corcheas.
  const ARP = {
    A: [0, 2, 1, 3, 2, 1, 3, 2], A2: [0, 1, 2, 3, 1, 2, 3, 1], B: [3, 2, 1, 0, 2, 1, 0, 1],
    puenteJ: [0, -1, 2, -1, 3, -1, 2, -1], A3: [0, 2, 3, 2, 1, 3, 2, 1], B2: [0, 3, 2, 3, 1, 3, 2, 3], vuelta: [3, 1, 2, 0, 3, 1, 2, 1]
  };
  // Pulso de datos: semicorcheas.
  const PULSOS = ['1011101110111010', '1010101110101011', '1101101011011010'];

  const FORMA = {
    menu: { bpm: 76, swing: 0.5, sec: ['intro', 'A', 'A2', 'B', 'puente', 'Av', 'coda'], mel: MELM },
    juego: { bpm: 88, swing: 0.55, sec: ['introJ', 'A', 'A2', 'B', 'puenteJ', 'A3', 'B2', 'vuelta'], mel: MELJ }
  };
  const ESCALA = [57, 58, 60, 62, 64, 65, 67, 69, 70, 72, 74, 76, 77, 79, 81]; // Re menor natural, La3–La5

  function motor(ctx) {
    const M = {};
    M._t = null; // reloj forzado (solo al exportar)
    const ahora = () => (M._t != null ? M._t : ctx.currentTime);
    const vivo = !(typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext);
    const hayPan = typeof ctx.createStereoPanner === 'function';
    const panear = (dest, p) => { if (!hayPan || !p) return dest; const s = ctx.createStereoPanner(); s.pan.value = Math.max(-1, Math.min(1, p)); s.connect(dest); return s; };

    // ── Cadena maestra: compresor-limitador y recorte suave
    const master = ctx.createGain(); master.gain.value = 1;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -6; comp.ratio.value = 12; comp.attack.value = 0.003; comp.release.value = 0.18; comp.knee.value = 2;
    const recorte = ctx.createWaveShaper();
    { const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.abs(x) < 0.85 ? x : Math.sign(x) * (0.85 + 0.15 * Math.tanh((Math.abs(x) - 0.85) / 0.15)); } recorte.curve = c; }
    master.connect(comp); comp.connect(recorte);
    const salida = ctx.createGain(); salida.gain.value = 1; recorte.connect(salida); salida.connect(ctx.destination);
    if (vivo && ctx.createAnalyser) { M.medidor = ctx.createAnalyser(); M.medidor.fftSize = 2048; salida.connect(M.medidor); }

    // ── Música: entrada → volumen → filtro de pausa → atenuación de pausa → «duck» → master
    const musIn = ctx.createGain(); musIn.gain.value = 1;
    const musVol = ctx.createGain(); musVol.gain.value = 0.0001;
    const musFiltro = ctx.createBiquadFilter(); musFiltro.type = 'lowpass'; musFiltro.frequency.value = 20000; musFiltro.Q.value = 0.4;
    const musPausa = ctx.createGain(); musPausa.gain.value = 1;
    const musDuck = ctx.createGain(); musDuck.gain.value = 1;
    musIn.connect(musVol); musVol.connect(musFiltro); musFiltro.connect(musPausa); musPausa.connect(musDuck); musDuck.connect(master);
    // ── Efectos
    const sfxVol = ctx.createGain(); sfxVol.gain.value = 1.28; sfxVol.connect(master);
    let sfxDest = sfxVol; // destino de los efectos en curso (cada efecto lleva su ganancia)

    // Reverbs por convolución con impulsos generados (ruido con caída exponencial), una para cada bus:
    // así, con la música apagada, no queda ni su cola.
    function impulso(seg, caida, semilla) {
      const sr = ctx.sampleRate, len = Math.floor(sr * seg), b = ctx.createBuffer(2, len, sr);
      let s = semilla >>> 0;
      for (let ch = 0; ch < 2; ch++) {
        const d = b.getChannelData(ch); let lp = 0;
        for (let i = 0; i < len; i++) {
          s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
          const w = (s / 4294967296) * 2 - 1; lp += (w - lp) * (0.55 - 0.4 * i / len); // se oscurece al apagarse
          const pre = i < sr * 0.012 ? i / (sr * 0.012) : 1;
          d[i] = lp * pre * Math.pow(1 - i / len, caida);
        }
      }
      return b;
    }
    const revMus = ctx.createConvolver(); revMus.buffer = impulso(3.2, 3.2, 987654321);
    const revMusRet = ctx.createGain(); revMusRet.gain.value = 0.55; revMus.connect(revMusRet); revMusRet.connect(musIn);
    const revSfx = ctx.createConvolver(); revSfx.buffer = impulso(1.3, 2.6, 192837465);
    const revSfxRet = ctx.createGain(); revSfxRet.gain.value = 0.5; revSfx.connect(revSfxRet); revSfxRet.connect(sfxVol);

    // ruido reutilizable
    const ruidoBuf = (() => { const len = ctx.sampleRate * 2; const b = ctx.createBuffer(1, len, ctx.sampleRate); const d = b.getChannelData(0); let s = 1234567; for (let i = 0; i < len; i++) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; d[i] = (s / 4294967296) * 2 - 1; } return b; })();
    const rosaBuf = (() => { const len = ctx.sampleRate * 3; const b = ctx.createBuffer(1, len, ctx.sampleRate); const d = b.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0, s = 7654321; for (let i = 0; i < len; i++) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; const w = (s / 4294967296) * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18; } const f = Math.floor(ctx.sampleRate * 0.05); for (let i = 0; i < f; i++) { const k = i / f; d[len - f + i] = d[len - f + i] * (1 - k) + d[i] * k; } return b; })();
    let semRuido = 1;
    const desfase = () => { semRuido = (semRuido * 16807) % 2147483647; return (semRuido / 2147483647) * 1.5; };

    // ───────────── Instrumentos ─────────────
    // destino: { dry, rev } (rev = envío a reverb, opcional)
    function conectar(nodo, dst, envio, pan) {
      nodo.connect(pan ? panear(dst.dry, pan) : dst.dry);
      if (dst.rev && envio) { const e = ctx.createGain(); e.gain.value = envio; nodo.connect(e); e.connect(dst.rev); }
    }
    // congela un parámetro en su valor en el instante t (exacto también al programar a futuro)
    function sostener(p, t) { if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); } }
    function pad(I, notas, t, dur, vel) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 0.6;
      I.lfoG.connect(f.frequency);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 1.8); g.gain.setValueAtTime(vel, t + Math.max(1.85, dur - 0.1)); g.gain.linearRampToValueAtTime(0, t + dur + 1.9);
      f.connect(g); conectar(g, { dry: I.bus.pad, rev: I.rev }, 0.7);
      const fin = t + dur + 2;
      notas.forEach((n, k) => {
        const p = panear(f, (k - (notas.length - 1) / 2) * 0.28);
        for (const det of [-7, 0, 7]) {
          const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(n); o.detune.value = det + (I.rnd() - 0.5) * 2;
          const og = ctx.createGain(); og.gain.value = 0.16 / notas.length; o.connect(og); og.connect(p); o.start(t); o.stop(fin);
        }
      });
      setTimeout0(() => { try { I.lfoG.disconnect(f.frequency); } catch (e) { /* */ } }, fin);
    }
    // Piano eléctrico FM: portadora seno, moduladora ×2 (cuerpo) y ×14 (púa breve).
    function ep(n, t, dur, vel, dst, pan) {
      const fr = mtof(n);
      const car = ctx.createOscillator(); car.type = 'sine'; car.frequency.value = fr;
      const m1 = ctx.createOscillator(); m1.type = 'sine'; m1.frequency.value = fr * 2;
      const g1 = ctx.createGain(); const brillo = 0.6 + vel * 4;
      g1.gain.setValueAtTime(fr * 1.5 * Math.min(1.6, brillo), t); g1.gain.exponentialRampToValueAtTime(fr * 0.1, t + 1.1);
      m1.connect(g1); g1.connect(car.frequency);
      let m2 = null;
      if (fr * 14 < 16000) {
        m2 = ctx.createOscillator(); m2.type = 'sine'; m2.frequency.value = fr * 14;
        const g2 = ctx.createGain(); g2.gain.setValueAtTime(fr * 0.9, t); g2.gain.exponentialRampToValueAtTime(fr * 0.01, t + 0.06);
        m2.connect(g2); g2.connect(car.frequency);
      }
      const corta = dst.cola != null; // notas breves (ostinato, rasgueos): cola corta, menos nodos vivos a la vez
      const larga = corta ? Math.max(0.12, dur) : Math.max(0.8, dur), cola = corta ? dst.cola : 1.1;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.006);
      if (corta) g.gain.exponentialRampToValueAtTime(vel * 0.35, t + larga);
      else { g.gain.exponentialRampToValueAtTime(vel * 0.4, t + 0.5); g.gain.exponentialRampToValueAtTime(vel * 0.18, t + larga); }
      g.gain.exponentialRampToValueAtTime(0.0001, t + larga + cola);
      car.connect(g); conectar(g, dst, dst.envio != null ? dst.envio : 0.55, pan);
      const fin = t + larga + cola + 0.1;
      car.start(t); m1.start(t); car.stop(fin); m1.stop(fin); if (m2) { m2.start(t); m2.stop(t + 0.1); }
    }
    function bajo(I, n, t, dur, vel) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 1.2;
      f.frequency.setValueAtTime(720, t); f.frequency.exponentialRampToValueAtTime(380, t + 0.25);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.025); g.gain.setTargetAtTime(vel * 0.7, t + 0.05, 0.4); g.gain.setValueAtTime(vel * 0.6, t + Math.max(0.06, dur - 0.06)); g.gain.linearRampToValueAtTime(0, t + dur);
      const o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = mtof(n + 12);
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = mtof(n);
      const g2 = ctx.createGain(); g2.gain.value = 0.6;
      o1.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(I.bus.bajo);
      o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    }
    function pulso(I, n, t, vel, pan) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(n);
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2000; f.Q.value = 2.5;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
      o.connect(f); f.connect(g); g.connect(panear(I.bus.pulso, pan));
      o.start(t); o.stop(t + 0.1);
    }
    function chelo(I, n, t, dur, vel) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1150; f.Q.value = 0.8;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.35); g.gain.setTargetAtTime(vel * 0.8, t + 0.4, 0.8); g.gain.setValueAtTime(vel * 0.75, t + Math.max(0.5, dur - 0.15)); g.gain.linearRampToValueAtTime(0, t + dur + 0.6);
      const vib = ctx.createOscillator(); vib.frequency.value = 4.8; const vg = ctx.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(7, t + 0.9); vib.connect(vg);
      const fin = t + dur + 0.7;
      [['sawtooth', 0.5, -4], ['triangle', 0.7, 4]].forEach(([tipo, a, det]) => { const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = mtof(n); o.detune.value = det; vg.connect(o.detune); const og = ctx.createGain(); og.gain.value = a; o.connect(og); og.connect(f); o.start(t); o.stop(fin); });
      f.connect(g); conectar(g, { dry: I.bus.chelo, rev: I.rev }, 0.6, -0.22);
      vib.start(t); vib.stop(fin);
    }
    function ruido(t, dur, tipo, fr, q, vel, dest, ataque) {
      const s = ctx.createBufferSource(); s.buffer = tipo === 'rosa' ? rosaBuf : ruidoBuf; s.loop = true;
      const f = ctx.createBiquadFilter(); f.type = tipo === 'alto' ? 'highpass' : 'bandpass'; f.frequency.value = fr; f.Q.value = q || 1;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + (ataque || 0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(dest);
      s.start(t, desfase()); s.stop(t + dur + 0.05);
      return f;
    }
    function bombo(I, t, vel) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(118, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.16);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      o.connect(g); g.connect(I.bus.perc); o.start(t); o.stop(t + 0.45);
      ruido(t, 0.02, 'blanco', 1800, 1, vel * 0.12, I.bus.perc); // pegada, para que se oiga en altavoces de teléfono
    }
    function escobilla(I, t, dur, vel) {
      if (!I.esc) { // una sola fuente de ruido por tema, con envolvente por golpe
        const s = ctx.createBufferSource(); s.buffer = ruidoBuf; s.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 6200; f.Q.value = 0.7;
        I.esc = ctx.createGain(); I.esc.gain.value = 0;
        s.connect(f); f.connect(I.esc); I.esc.connect(panear(I.bus.perc, 0.12)); s.start(t, desfase()); I.fuentes.push(s);
      }
      const g = I.esc.gain; g.setValueAtTime(0, t); g.linearRampToValueAtTime(vel, t + 0.025); g.exponentialRampToValueAtTime(0.0001, t + dur); g.setValueAtTime(0, t + dur + 0.001);
    }
    function aro(I, t, vel, pan) {
      ruido(t, 0.045, 'blanco', 3100, 2.2, vel, panear(I.bus.perc, pan));
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 410;
      const g = ctx.createGain(); g.gain.setValueAtTime(vel * 0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g); g.connect(I.bus.perc); o.start(t); o.stop(t + 0.06);
    }
    // limpieza diferida según el reloj del contexto (en vivo); al exportar no hace falta
    function setTimeout0(fn, tCtx) { if (!vivo) return; setTimeout(fn, Math.max(0, (tCtx - ctx.currentTime) * 1000 + 300)); }

    // ───────────── Instancias de tema ─────────────
    // Cada tema que suena es una instancia con sus propios buses: al cambiar de tema se funde entera
    // (incluidas las notas ya programadas) sin cortar nada ni dejar restos del anterior.
    let cur = null, capa = 0, volMus = 0.0001;
    const viejas = [];
    function crearInst(nombre, t0) {
      const form = FORMA[nombre];
      const I = { nombre, form, secIdx: 0, compas: 0, vuelta: 0, tSig: t0, pedal: 0, rnd: prng(nombre === 'menu' ? 76 : 88), bus: {} };
      I.raiz = ctx.createGain(); I.raiz.gain.setValueAtTime(0, t0); I.raiz.gain.linearRampToValueAtTime(1, t0 + 1.0);
      I.raiz.connect(musIn);
      I.envio = ctx.createGain(); I.envio.gain.setValueAtTime(0, t0); I.envio.gain.linearRampToValueAtTime(1, t0 + 1.0);
      I.envio.connect(revMus);
      I.rev = I.envio;
      const niveles = { pad: 2.5, bajo: 0.3, piano: 2.2, chelo: 1.4, pulso: nombre === 'menu' ? 4 : 0, arp: 0, perc: 0, sala: 1 };
      const solo = M._solo; // pruebas: escuchar un instrumento suelto
      for (const k in niveles) { const b = ctx.createGain(); b.gain.value = solo && !solo.includes(k) ? 0 : niveles[k]; b.connect(I.raiz); I.bus[k] = b; }
      // LFO lento del filtro del pad (uno por instancia)
      I.lfo = ctx.createOscillator(); I.lfo.frequency.value = 0.05; I.lfoG = ctx.createGain(); I.lfoG.gain.value = 280; I.lfo.connect(I.lfoG); I.lfo.start(t0);
      // tono de sala: ruido rosa grave casi inaudible, da «aire» de habitación
      const s = ctx.createBufferSource(); s.buffer = rosaBuf; s.loop = true;
      const sf = ctx.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 420;
      const sg = ctx.createGain(); sg.gain.value = 0.028;
      s.connect(sf); sf.connect(sg); sg.connect(I.bus.sala); s.start(t0, desfase());
      I.fuentes = [s, I.lfo];
      if (nombre === 'juego') aplicarCapa(I, capa, t0, 0.01);
      return I;
    }
    function soltar(I, t, seg) {
      if (!I) return;
      for (const g of [I.raiz.gain, I.envio.gain]) { sostener(g, t); g.linearRampToValueAtTime(0, t + seg); }
      for (const f of I.fuentes) { try { f.stop(t + seg + 0.05); } catch (e) { /* */ } }
      I.muerta = true;
      viejas.push(I);
      setTimeout0(() => { try { I.raiz.disconnect(); I.envio.disconnect(); } catch (e) { /* */ } const k = viejas.indexOf(I); if (k >= 0) viejas.splice(k, 1); }, t + seg + 3.5);
    }
    function aplicarCapa(I, n, t, rampa) {
      const fijar = (g, v, r) => { sostener(g.gain, t); g.gain.linearRampToValueAtTime(v, t + r); };
      const r1 = rampa != null ? rampa : 4, r2 = rampa != null ? rampa : 2;
      I.hasta1 = n >= 1 ? Infinity : Math.min(I.hasta1 == null ? 0 : I.hasta1, t + r1);
      I.hasta2 = n >= 2 ? Infinity : Math.min(I.hasta2 == null ? 0 : I.hasta2, t + r2);
      const ok = (k) => !M._solo || M._solo.includes(k);
      fijar(I.bus.pulso, n >= 1 && ok('pulso') ? 4 : 0, r1);
      fijar(I.bus.arp, n >= 1 && ok('arp') ? 2.5 : 0, r1);
      fijar(I.bus.perc, n >= 2 && ok('perc') ? 1.5 : 0, r2);
    }

    // ───────────── Secuenciador ─────────────
    function siguienteAcorde(I) {
      const sec = SEC[I.form.sec[I.secIdx]];
      if (I.compas + 1 < sec.length) return sec[I.compas + 1];
      return SEC[I.form.sec[(I.secIdx + 1) % I.form.sec.length]][0];
    }
    function programarCompas(I) {
      const t = I.tSig, form = I.form, menu = I.nombre === 'menu';
      const nombreSec = form.sec[I.secIdx], sec = SEC[nombreSec], c = I.compas;
      const b = 60 / form.bpm, sw = (form.swing - 0.5) * b; // retraso de las corcheas a contratiempo
      const v = I.vuelta % 3;
      const hum = () => (I.rnd() - 0.5) * 0.012;
      let acorde = sec[c];
      // tensión tras 1-2 errores: dos compases con La pedal y Si bemol encima, después vuelve
      let voz = PAD[acorde], raiz = RAIZ[acorde];
      if (I.pedal > 0) { const k = I.pedal === 2 ? 'T1' : 'T2'; voz = PAD[k]; raiz = 33; acorde = k; I.pedal--; }
      if (v === 1) voz = voz.map((n, i) => (i === 1 ? n + 12 : n)); // voicing abierto
      pad(I, voz, t, b * 4, menu ? 0.5 : 0.44);

      // ── Bajo
      if (menu) {
        bajo(I, raiz, t, b * 2, 0.34);
        bajo(I, c % 2 ? raiz + 7 : raiz, t + b * 2, b * 2, 0.27);
      } else {
        const sig = RAIZ[siguienteAcorde(I)] || 38;
        bajo(I, raiz, t, b * 1.4, 0.36);
        bajo(I, raiz, t + b * 1.5 + sw, b * 0.45, 0.2);
        bajo(I, raiz + 7, t + b * 2, b * 1.4, 0.28);
        const ap = sig !== raiz ? (sig > raiz ? sig - 1 : sig + 1) : raiz + 12; // nota de paso cromática al acorde siguiente
        bajo(I, I.pedal > 0 ? raiz : ap, t + b * 3.5 + sw, b * 0.45, 0.22);
      }

      // ── Melodía del piano (con variación por vuelta)
      let mel = form.mel[nombreSec] || [];
      let oct = 0;
      if (!menu) {
        if (v === 1 && (nombreSec === 'A' || nombreSec === 'A2')) oct = -12;
        if (v === 2 && (nombreSec === 'B' || nombreSec === 'puenteJ')) oct = 12;
      } else if (v === 1 && nombreSec === 'A2') oct = 12;
      const velMel = menu ? 0.15 : 0.13;
      const ini = c * 4, fin = ini + 4;
      for (const [pos, n, d] of mel) if (pos >= ini && pos < fin) {
        let nn = n + oct; if (nn > 88) nn -= 12;
        const off = (pos % 1 === 0.5) ? sw : 0;
        const acento = pos % 4 === 0 ? 1.08 : pos % 1 === 0.5 ? 0.88 : 1;
        ep(nn, t + (pos - ini) * b + off + hum(), d * b, velMel * acento * (0.93 + I.rnd() * 0.14), { dry: I.bus.piano, rev: I.rev, envio: 0.6 }, (nn - 72) / 40);
      }
      // ── Acordes sueltos del piano (escasos), rasgueados
      const comp = menu ? (c % 2 === 1 ? [2.5] : []) : (c % 2 === 1 ? [1.5] : (c % 4 === 2 ? [3.5] : []));
      for (const pos of comp) voz.slice(1).forEach((n, k) => ep(n + 12, t + pos * b + (pos % 1 ? sw : 0) + k * 0.022, b, menu ? 0.04 : 0.035, { dry: I.bus.piano, rev: I.rev, envio: 0.7, cola: 0.9 }, 0.15 - k * 0.1));

      // ── Chelo
      let lineaChelo = null;
      if (menu) { if (nombreSec === 'Av') lineaChelo = CHELO.Av; else if (nombreSec === 'puente' && v >= 1) lineaChelo = CHELO.puente; else if (nombreSec === 'B' && v === 2) lineaChelo = CHELO.B; }
      else { if (nombreSec === 'A3' && v >= 1) lineaChelo = CHELO.A3; else if (nombreSec === 'B2' && v >= 1) lineaChelo = CHELO.B2; else if (nombreSec === 'A' && v === 2) lineaChelo = CHELO.A; }
      if (lineaChelo) for (const [pos, n, d] of lineaChelo) if (pos >= ini && pos < fin) chelo(I, n, t + (pos - ini) * b, d * b, 0.075);

      // ── Pulso de datos (capa 1; en el menú, solo en la tercera vuelta y al 30 %)
      const capa1 = !menu && t < I.hasta1, capa2 = !menu && t < I.hasta2;
      const pulsoOn = menu ? v === 2 : capa1;
      if (pulsoOn) {
        const pat = PULSOS[(v + I.secIdx) % PULSOS.length];
        const base = PAD[acorde] || voz;
        for (let i = 0; i < 16; i++) if (pat[i] === '1') {
          const off = i % 2 ? sw * 0.5 : 0;
          pulso(I, base[(i + c) % base.length] + 24, t + i * b / 4 + off, (i % 4 === 0 ? 0.085 : 0.048) * (menu ? 0.3 : 1), i % 2 ? 0.35 : -0.35);
        }
      }
      // ── Ostinato (capa 1 de la partida)
      if (capa1) {
        const pat = ARP[nombreSec];
        if (pat) {
          const notas = PAD[acorde] || voz;
          const shift = v === 2 ? 12 : 0;
          for (let i = 0; i < 8; i++) { const k = pat[i]; if (k < 0) continue; ep(notas[k % notas.length] + 12 + shift - (v === 1 ? 12 : 0), t + i * b / 2 + (i % 2 ? sw : 0), b * 0.45, (i % 2 ? 0.032 : 0.042), { dry: I.bus.arp, rev: I.rev, envio: 0.5, cola: 0.35 }, 0.3); }
        }
      }
      // ── Percusión (capa 2 de la partida): bombo, escobillas, aro; relleno distinto cada 8 compases
      if (capa2) {
        bombo(I, t, 0.5); bombo(I, t + b * 2.5, 0.3);
        if (c % 2 === 1) bombo(I, t + b * 3.5 + sw, 0.22);
        for (let i = 0; i < 8; i++) escobilla(I, t + i * b / 2 + (i % 2 ? sw : 0), i % 2 ? 0.16 : 0.26, i % 2 ? 0.05 : 0.085);
        aro(I, t + b, 0.11, 0.1); aro(I, t + b * 3, 0.11, 0.1);
        if (c === sec.length - 1) {
          const tipo = (I.secIdx + v) % 4;
          if (tipo === 0) for (let i = 0; i < 3; i++) aro(I, t + b * 3 + i * b / 3, 0.07 + i * 0.015, -0.3 + i * 0.3);
          else if (tipo === 1) { bombo(I, t + b * 3, 0.3); bombo(I, t + b * 3.5 + sw, 0.34); ruido(t + b * 3, b, 'blanco', 6200, 0.7, 0.09, I.bus.perc, 0.03); }
          else if (tipo === 2) for (let i = 0; i < 4; i++) aro(I, t + b * 3 + i * b / 4, 0.09 - i * 0.012, 0.3 - i * 0.2);
          else { const f = ruido(t + b * 2.5, b * 1.6, 'blanco', 4000, 0.6, 0.06, I.bus.perc, b * 1.2); f.frequency.setValueAtTime(3000, t + b * 2.5); f.frequency.exponentialRampToValueAtTime(8000, t + b * 4); }
        }
      }
      // avanzar
      I.tSig += b * 4;
      I.compas++;
      if (I.compas >= sec.length) { I.compas = 0; I.secIdx++; if (I.secIdx >= form.sec.length) { I.secIdx = 0; I.vuelta++; } }
    }
    let timer = 0;
    const LOOK = 0.35;
    function tick() {
      const I = cur; if (!I) return;
      const t = ctx.currentTime;
      if (I.tSig < t - 0.05) I.tSig = t + 0.05; // el hilo principal se trabó: retomar sin amontonar compases
      while (I.tSig < t + LOOK) programarCompas(I);
    }
    M.programarHasta = function (tFin) { while (cur && cur.tSig < tFin) programarCompas(cur); };

    // ───────────── Control ─────────────
    M.tema = function (nombre) {
      if ((cur ? cur.nombre : null) === nombre) return;
      const t = ahora();
      if (cur) soltar(cur, t, nombre ? 1.4 : 0.8);
      cur = null;
      if (!nombre) return;
      if (nombre === 'juego') capa = 0; // cada partida arranca sin capas; el juego fija la suya enseguida y entra en el compás siguiente
      cur = crearInst(nombre, t + 0.06);
      if (vivo) { if (!timer) timer = setInterval(tick, 60); tick(); }
    };
    M.temaActual = () => (cur ? cur.nombre : null);
    M.info = () => (cur ? { tema: cur.nombre, seccion: cur.form.sec[cur.secIdx], compas: cur.compas, vuelta: cur.vuelta, capa, bpm: cur.form.bpm } : { tema: null, capa });
    M.capa = function (n) {
      if (n === capa) return;
      capa = n;
      if (cur && cur.nombre === 'juego') aplicarCapa(cur, n, Math.max(ahora(), cur.tSig)); // entra en el compás siguiente
    };
    M.capaActual = () => capa;
    M.tension = function () { if (cur) cur.pedal = 2; };
    M.duck = function (db, seg) {
      const t = ahora(), v = Math.pow(10, -db / 20), g = musDuck.gain;
      sostener(g, t); g.linearRampToValueAtTime(v, t + 0.06); g.setValueAtTime(v, t + seg * 0.6); g.linearRampToValueAtTime(1, t + seg);
    };
    M.pausa = function (on) {
      const t = ahora();
      const f = musFiltro.frequency; sostener(f, t); f.exponentialRampToValueAtTime(on ? 500 : 20000, t + 0.45);
      const g = musPausa.gain; sostener(g, t); g.linearRampToValueAtTime(on ? 0.4 : 1, t + 0.45); // −8 dB
    };
    // textura de radio: ruido rosa en banda 300-3.000 Hz con chisporroteo, solo con el registro de radio abierto
    let radioSrc = null, radioG = null;
    M.radio = function (on) {
      const t = ahora();
      if (on && !radioSrc) {
        radioSrc = ctx.createBufferSource(); radioSrc.buffer = rosaBuf; radioSrc.loop = true;
        const f1 = ctx.createBiquadFilter(); f1.type = 'highpass'; f1.frequency.value = 300;
        const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 3000;
        const trem = ctx.createOscillator(); trem.frequency.value = 0.31; const tg = ctx.createGain(); tg.gain.value = 0.02; trem.connect(tg);
        radioG = ctx.createGain(); radioG.gain.setValueAtTime(0, t); radioG.gain.linearRampToValueAtTime(0.07, t + 0.4); tg.connect(radioG.gain);
        radioSrc.connect(f1); f1.connect(f2); f2.connect(radioG); radioG.connect(musIn); radioSrc.start(t, desfase()); trem.start(t);
        radioSrc._trem = trem;
      } else if (!on && radioSrc) {
        const s = radioSrc, g = radioG; radioSrc = null; radioG = null;
        sostener(g.gain, t); g.gain.linearRampToValueAtTime(0, t + 0.4);
        s.stop(t + 0.45); s._trem.stop(t + 0.45);
      }
    };
    M.fundir = function (seg) { if (cur) soltar(cur, ahora(), seg); cur = null; };
    M.volumenes = function (o) {
      const t = ahora();
      volMus = o.musica ? 0.5 * o.volMusica * o.volMusica : 0.0001;
      const vs = o.efectos ? 2 * o.volEfectos * o.volEfectos : 0.0001; // +6 dB: los efectos mandan sobre la música
      sostener(musVol.gain, t); musVol.gain.linearRampToValueAtTime(Math.max(0.0001, volMus), t + 0.15);
      sostener(sfxVol.gain, t); sfxVol.gain.linearRampToValueAtTime(Math.max(0.0001, vs), t + 0.05);
    };

    // ───────────── Momentos musicales ─────────────
    const dSfx = { dry: sfxVol, rev: revSfx, envio: 0.5 };
    function padSfx(notas, t, dur, vel, dest) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(700, t); f.frequency.exponentialRampToValueAtTime(2200, t + dur * 0.4);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.5); g.gain.setValueAtTime(vel, t + dur * 0.6); g.gain.linearRampToValueAtTime(0, t + dur);
      f.connect(g); g.connect(dest || sfxVol); const e = ctx.createGain(); e.gain.value = 0.6; g.connect(e); e.connect(revSfx);
      notas.forEach((n, k) => { const p = panear(f, (k / Math.max(1, notas.length - 1) - 0.5) * 0.6); for (const det of [-6, 6]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(n); o.detune.value = det; const og = ctx.createGain(); og.gain.value = 0.05; o.connect(og); og.connect(p); o.start(t); o.stop(t + dur + 0.1); } });
    }
    M.resuelto = function () {
      M.fundir(0.6);
      const t = ahora() + 0.5;
      // fanfarria en Re mayor: el motivo se abre (La-Re-Fa#-La) y el pad se ilumina
      [69, 74, 78, 81].forEach((n, i) => ep(n, t + i * 0.15, 0.9, 0.13, dSfx, -0.3 + i * 0.2));
      ep(86, t + 0.62, 1.8, 0.085, dSfx, 0.25); ep(90, t + 0.62, 1.8, 0.045, dSfx, 0.35);
      bajoSfx(38, t + 0.05, 3.2, 0.2);
      padSfx([50, 54, 57, 62, 66], t + 0.1, 3.8, 0.36);
    };
    function bajoSfx(n, t, dur, vel) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(n);
      const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = mtof(n + 12);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const g2 = ctx.createGain(); g2.gain.value = 0.35; o2.connect(g2); g2.connect(g);
      o.connect(g); g.connect(sfxVol); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    }
    M.rendido = function () {
      M.fundir(0.8);
      const t = ahora() + 0.45;
      padSfx([50, 53, 57, 64], t, 3.2, 0.32);
      bajoSfx(38, t, 3, 0.15);
      ep(74, t + 0.3, 2, 0.06, dSfx, 0); ep(69, t + 0.9, 2, 0.05, dSfx, 0.2);
    };
    M.stinger = function () {
      const t = ahora();
      M.fundir(0.35);
      // golpe grave en Re + cierre metálico + respiración de pad
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(73.4, t); o.frequency.exponentialRampToValueAtTime(38, t + 1.2);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.33, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      o.connect(g); g.connect(sfxVol); o.start(t); o.stop(t + 1.9);
      const e = ctx.createGain(); e.gain.value = 0.4; g.connect(e); e.connect(revSfx);
      ruido(t, 0.1, 'blanco', 4200, 3, 0.18, sfxVol);
      metal(t + 0.07, 0.12);
      padSfx([50, 57, 62, 64], t + 0.25, 2.2, 0.28);
    };
    // cierre metálico: parciales inarmónicos cortos
    function metal(t, vel) {
      [1, 2.76, 5.4, 8.93].forEach((r, i) => tono(null, t, 0.25 - i * 0.04, vel / (i + 1.5), 'sine', sfxVol, 620 * r));
      ruido(t, 0.18, 'blanco', 2400, 6, vel * 0.8, sfxVol);
    }
    function tono(n, t, dur, vel, tipo, dest, hz) {
      const o = ctx.createOscillator(); o.type = tipo || 'sine'; o.frequency.value = hz || mtof(n);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest || sfxDest); o.start(t); o.stop(t + dur + 0.02);
      return o;
    }

    // ───────────── Efectos (afinados en Re menor) ─────────────
    const NOTAS_MARCA = [62, 64, 65, 69, 72, 74]; // Re, Mi, Fa, La, Do, Re+8va, uno por color de marcador
    const ult = {};
    // ganancia por efecto (dB medidos con renderizar: los de manipulación quedan ~8-10 dB sobre la música)
    const GAN = { registro: 2, hueco: 1.8, tic: 1.6, levantar: 1.8, transicion: 1.6, pausa: 1.6, boton: 0.8, noSostiene: 0.7, sello: 0.6, obturador: 0.8, insignia: 0.8 };
    M.sfx = function (n, arg) {
      const t = ahora() + 0.005;
      // los efectos que se repiten muy seguido (tics de telemetría, rueda) no se apilan
      if (vivo) { const lim = n === 'tic' ? 0.035 : 0.025; if (ult[n] && ctx.currentTime - ult[n] < lim) return; ult[n] = ctx.currentTime; }
      const D = ctx.createGain(); D.gain.value = GAN[n] || 1; D.connect(sfxVol); sfxDest = D;
      const dS = { dry: D, rev: revSfx, envio: 0.5 };
      setTimeout0(() => { try { D.disconnect(); } catch (e) { /* */ } }, t + 4);
      switch (n) {
        case 'boton': ruido(t, 0.012, 'alto', 3800, 0.9, 0.16, D); tono(86, t, 0.07, 0.02); break;
        case 'registro': { const f = ruido(t, 0.15, 'blanco', 2000, 1.4, 0.12, panear(D, 0.15), 0.025); f.frequency.setValueAtTime(2000, t); f.frequency.exponentialRampToValueAtTime(5000, t + 0.14); ruido(t + 0.11, 0.02, 'alto', 3000, 1, 0.05, D); break; }
        case 'obturador': ruido(t, 0.02, 'alto', 2600, 1, 0.3, D); tono(null, t, 0.03, 0.05, 'square', D, 1900); ruido(t + 0.075, 0.025, 'alto', 2100, 1, 0.24, D); ruido(t + 0.015, 0.2, 'blanco', 900, 0.7, 0.07, D, 0.03); break;
        case 'radio': { const f = ruido(t, 0.26, 'rosa', 800, 0.7, 0.32, D, 0.015); f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(1800, t + 0.22); tono(81, t + 0.18, 0.06, 0.025, 'sine'); break; }
        case 'tic': { const k = Math.round(Math.max(0, Math.min(1, arg == null ? 0.5 : arg)) * (ESCALA.length - 1)); tono(ESCALA[k], t, 0.045, 0.05, 'triangle'); ruido(t, 0.008, 'alto', 6000, 1, 0.03, D); break; }
        case 'marca': ep(NOTAS_MARCA[(arg || 0) % 6] + 12, t, 0.5, 0.2, dS, 0.1); break;
        case 'desmarca': ep(NOTAS_MARCA[(arg || 0) % 6], t, 0.3, 0.1, dS, -0.1); tono(NOTAS_MARCA[(arg || 0) % 6] - 12, t + 0.04, 0.12, 0.03, 'sine'); break;
        case 'hueco': tono(74, t, 0.05, 0.08, 'triangle'); ruido(t, 0.015, 'alto', 5000, 1, 0.06, D); break;
        case 'levantar': { const f = ruido(t, 0.12, 'blanco', 900, 1.2, 0.08, D, 0.03); f.frequency.exponentialRampToValueAtTime(3000, t + 0.11); tono(81, t + 0.02, 0.06, 0.015, 'sine'); break; }
        case 'colocar': ep(69, t, 0.12, 0.15, dS, -0.12); ep(74, t + 0.012, 0.12, 0.12, dS, 0.12); ruido(t, 0.015, 'alto', 4200, 1, 0.13, D); tono(null, t, 0.03, 0.06, 'sine', D, 180); break;
        case 'quitar': ep(74, t, 0.1, 0.11, dS, 0.1); ep(69, t + 0.06, 0.1, 0.11, dS, -0.1); break;
        case 'noEncaja': tono(53, t, 0.07, 0.11, 'triangle'); tono(53, t + 0.1, 0.07, 0.09, 'triangle'); break;
        case 'faltan': tono(45, t, 0.09, 0.14, 'triangle'); ruido(t, 0.02, 'blanco', 600, 1, 0.05, D); break;
        case 'escaneo': {
          ruido(t, 0.025, 'alto', 1500, 1, 0.28, D); // relé
          const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 110; // La2, zumbido del escáner
          const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.6); f.Q.value = 6;
          const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.08, t + 0.05); g.gain.setValueAtTime(0.08, t + 0.5); g.gain.linearRampToValueAtTime(0, t + 0.64);
          o.connect(f); f.connect(g); g.connect(D); o.start(t); o.stop(t + 0.66);
          const n2 = Math.max(1, Math.min(14, arg || 8));
          for (let i = 0; i < n2; i++) tono(81, t + 0.04 + i * (0.56 / n2), 0.03, 0.035, 'square', panear(D, (i / Math.max(1, n2 - 1) - 0.5) * 0.7));
          break;
        }
        case 'errores': { if ((arg || 1) >= 2) { tono(53, t, 0.26, 0.2, 'triangle'); tono(41, t, 0.26, 0.08, 'sine'); tono(50, t + 0.28, 0.34, 0.2, 'triangle'); tono(38, t + 0.28, 0.34, 0.08, 'sine'); } else { tono(50, t, 0.34, 0.2, 'triangle'); tono(38, t, 0.34, 0.08, 'sine'); } break; }
        case 'noSostiene': {
          const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(mtof(51), t); o.frequency.linearRampToValueAtTime(mtof(50), t + 0.4);
          const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(mtof(39), t); o2.frequency.linearRampToValueAtTime(mtof(38), t + 0.4);
          const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(300, t + 0.4);
          const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.26, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
          o.connect(f); o2.connect(f); f.connect(g); g.connect(D); o.start(t); o2.start(t); o.stop(t + 0.5); o2.stop(t + 0.5);
          break;
        }
        case 'sello': {
          const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.2);
          const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.7, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
          o.connect(g); g.connect(D); o.start(t); o.stop(t + 0.55);
          ruido(t, 0.16, 'blanco', 1800, 0.8, 0.26, D);
          ruido(t + 0.03, 0.3, 'blanco', 3500, 0.5, 0.05, D, 0.02); // el papel
          break;
        }
        case 'estrella': ep([81, 86, 90][(arg || 0) % 3], t, 0.8, 0.17, dS, -0.3 + ((arg || 0) % 3) * 0.3); ruido(t, 0.05, 'alto', 9000, 1, 0.03, D); break;
        case 'insignia': [74, 78, 81, 86].forEach((m, i) => ep(m, t + i * 0.07, 0.35, 0.14, dS, -0.3 + i * 0.2)); ruido(t + 0.25, 0.4, 'alto', 7000, 1, 0.045, D); break;
        case 'racha': ruido(t, 0.08, 'alto', 8000, 1, 0.1, D); ep(86, t + 0.04, 0.4, 0.14, dS, 0.2); break;
        case 'pausa': { const f = ruido(t, 0.3, 'blanco', arg ? 3000 : 500, 0.7, 0.06, D, 0.05); f.frequency.exponentialRampToValueAtTime(arg ? 400 : 4000, t + 0.28); break; }
        case 'copiado': ruido(t, 0.015, 'alto', 3000, 1, 0.14, D); tono(86, t, 0.05, 0.02); ruido(t + 0.08, 0.015, 'alto', 3600, 1, 0.14, D); tono(93, t + 0.08, 0.05, 0.02); break;
        case 'transicion': { const f = ruido(t, 0.22, 'blanco', 700, 0.8, 0.05, D, 0.06); f.frequency.exponentialRampToValueAtTime(2600, t + 0.2); break; }
        case 'escuchar': {
          // la grabación: chasquido, ruido de canal y pitidos de telemetría (sin voz); 2,8 s
          ruido(t, 0.03, 'alto', 2000, 1, 0.18, D);
          const f = ruido(t + 0.02, 2.8, 'rosa', 1500, 0.6, 0.16, D, 0.08);
          f.frequency.setValueAtTime(1500, t + 1.2); f.frequency.linearRampToValueAtTime(1100, t + 1.5); f.frequency.linearRampToValueAtTime(1600, t + 2);
          const seq = [0.2, 0.36, 0.48, 1.0, 1.15, 1.3, 1.9, 2.25, 2.37];
          seq.forEach((d, i) => tono(i % 3 === 2 ? 81 : 86, t + d, i % 3 === 2 ? 0.16 : 0.07, 0.05, 'sine'));
          tono(93, t + 2.65, 0.16, 0.04, 'sine');
          ruido(t + 2.82, 0.03, 'alto', 2000, 1, 0.14, D);
          break;
        }
      }
      sfxDest = sfxVol;
    };
    M.parar = function () { clearInterval(timer); timer = 0; if (cur) soltar(cur, ahora(), 0.3); cur = null; };
    M.ctx = ctx;
    return M;
  }

  // ───────────── Interfaz pública ─────────────
  const AU = { listo: false, prefs: { musica: true, volMusica: 0.7, efectos: true, volEfectos: 0.8 } };
  let ctx = null, M = null, temaDeseado = null, capaDeseada = 0, radioDeseada = false;
  function reanudarCtx() { if (ctx && ctx.state !== 'running' && ctx.state !== 'closed' && !document.hidden) { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } }
  AU.iniciar = function () {
    if (ctx) { reanudarCtx(); return; }
    const AC2 = G.AudioContext || G.webkitAudioContext;
    if (!AC2) return;
    try { ctx = new AC2({ latencyHint: 'interactive' }); } catch (e) { try { ctx = new AC2(); } catch (e2) { return; } }
    M = motor(ctx);
    M.volumenes(AU.prefs);
    M.capa(capaDeseada);
    AU.listo = true;
    if (temaDeseado && AU.prefs.musica) M.tema(temaDeseado);
    if (radioDeseada && AU.prefs.musica) M.radio(true);
    reanudarCtx();
  };
  AU.tema = function (n) { temaDeseado = n; if (M && AU.prefs.musica) M.tema(n); };
  AU.capa = function (n) { capaDeseada = n; if (M) M.capa(n); };
  AU.tension = () => M && M.tension();
  AU.duck = (db, s) => M && M.duck(db, s);
  AU.pausa = (on) => M && M.pausa(on);
  AU.radio = (on) => { radioDeseada = !!on; if (M && (AU.prefs.musica || !on)) M.radio(!!on); };
  AU.resuelto = () => { temaDeseado = null; if (M) M.resuelto(); };
  AU.rendido = () => { temaDeseado = null; if (M) M.rendido(); };
  AU.stinger = () => { temaDeseado = null; if (M) M.stinger(); };
  AU.sfx = (n, a) => { if (M && AU.prefs.efectos && ctx.state === 'running') M.sfx(n, a); };
  AU.volumenes = function (p) {
    const antes = AU.prefs.musica;
    Object.assign(AU.prefs, p);
    if (!M) return;
    M.volumenes(AU.prefs);
    // con la música apagada no se programa nada (ahorra batería); al encenderla vuelve el tema que toca
    if (antes && !AU.prefs.musica) { M.tema(null); M.radio(false); }
    else if (!antes && AU.prefs.musica) { if (temaDeseado) M.tema(temaDeseado); if (radioDeseada) M.radio(true); }
  };
  AU.suspender = () => { if (ctx && ctx.state === 'running') { const p = ctx.suspend(); if (p && p.catch) p.catch(() => {}); } };
  AU.reanudar = reanudarCtx;
  AU.estado = () => (ctx ? ctx.state : 'sin-iniciar');
  AU.contexto = () => ctx;
  AU.temaActual = () => (M ? M.temaActual() : null);
  AU.info = () => Object.assign({ estado: AU.estado(), temaDeseado, prefs: Object.assign({}, AU.prefs) }, M ? M.info() : {});
  // Nivel de salida en vivo (dBFS), para pruebas: pico y RMS de los últimos ~46 ms.
  AU.nivel = function () {
    if (!M || !M.medidor) return null;
    const a = new Float32Array(M.medidor.fftSize); M.medidor.getFloatTimeDomainData(a);
    let pk = 0, s = 0; for (const v of a) { const x = Math.abs(v); if (x > pk) pk = x; s += v * v; }
    const db = (x) => (x > 0 ? Math.round(20 * Math.log10(x) * 10) / 10 : -Infinity);
    return { pico: db(pk), rms: db(Math.sqrt(s / a.length)) };
  };

  // Render fuera de línea con un guion [{t, a:'tema'|'capa'|'tension'|'stinger'|'resuelto'|'rendido'|'pausa'|'sfx'|'radio'|'duck', n, x}].
  AU.renderizar = async function (seg, guion, prefs) {
    const sr = 44100;
    const oc = new OfflineAudioContext(2, Math.floor(sr * seg), sr);
    const m = motor(oc);
    m._t = 0; m._solo = (prefs && prefs.solo) || null;
    m.volumenes(Object.assign({ musica: true, volMusica: 0.8, efectos: true, volEfectos: 0.8 }, prefs || {}));
    const pasos = (guion || []).slice().sort((x, y) => x.t - y.t);
    // se programa por tramos de medio segundo, igual que en vivo (si no, el grafo carga toda la pieza a la vez)
    const PASO = 0.5; let k = 0;
    const tramo = (tt) => {
      while (k < pasos.length && pasos[k].t < tt + PASO) {
        const p = pasos[k++];
        m._t = null; m.programarHasta(p.t); m._t = p.t;
        if (p.a === 'tema') m.tema(p.n);
        else if (p.a === 'capa') m.capa(p.n);
        else if (p.a === 'sfx') m.sfx(p.n, p.x);
        else if (typeof m[p.a] === 'function') m[p.a](p.n, p.x);
      }
      m._t = null; m.programarHasta(tt + PASO + 0.4);
    };
    tramo(0);
    for (let tt = PASO; tt < seg - 0.01; tt += PASO) { const x = tt; oc.suspend(x).then(() => { tramo(x); oc.resume(); }); }
    const buf = await oc.startRendering();
    return { wav: wav(buf), stats: estadisticas(buf) };
  };
  // Muestra para Julián (38 s): «Archivo» en el inicio, apertura del expediente y «Reconstrucción»
  // con la capa 1 (pulso de datos y ostinato) entrando a mitad.
  AU.guionMuestra = [
    { t: 0.05, a: 'tema', n: 'menu' },
    { t: 17.0, a: 'stinger' }, { t: 17.0, a: 'sfx', n: 'sello' },
    { t: 19.6, a: 'tema', n: 'juego' },
    { t: 27.8, a: 'capa', n: 1 }
  ];
  AU.exportarMuestra = async function (seg) { const r = await AU.renderizar(seg || 38, AU.guionMuestra); return r.wav; };
  function estadisticas(buf) {
    const n = buf.length, sr = buf.sampleRate, L = buf.getChannelData(0), R = buf.getChannelData(1);
    let pk = 0, clip = 0, s = 0, silMax = 0, sil = 0, nan = 0;
    const win = Math.floor(sr * 0.05);
    let ws = 0, wn = 0;
    const rmsSeg = [];
    let acc = 0, accN = 0;
    for (let i = 0; i < n; i++) {
      const a = L[i], b = R[i];
      if (a !== a || b !== b) { nan++; continue; }
      const x = Math.max(Math.abs(a), Math.abs(b));
      if (x > pk) pk = x; if (x >= 0.999) clip++;
      s += a * a + b * b;
      ws += x; wn++;
      if (wn === win) { if (ws / wn < 0.0005) sil++; else { if (sil > silMax) silMax = sil; sil = 0; } ws = 0; wn = 0; }
      acc += a * a + b * b; accN += 2;
      if (accN >= sr * 2) { rmsSeg.push(Math.round(10 * Math.log10(acc / accN) * 10) / 10); acc = 0; accN = 0; }
    }
    if (sil > silMax) silMax = sil;
    return { seg: n / sr, picoDb: Math.round(20 * Math.log10(pk || 1e-9) * 10) / 10, rmsDb: Math.round(10 * Math.log10(s / (2 * n) || 1e-12) * 10) / 10, muestrasRecortadas: clip, silencioMaxSeg: silMax * 0.05, nan, rmsPorSegundo: rmsSeg };
  }
  function wav(buf) {
    const n = buf.length, ch = buf.numberOfChannels, sr = buf.sampleRate;
    const out = new DataView(new ArrayBuffer(44 + n * ch * 2));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true); out.setUint32(24, sr, true);
    out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * ch * 2, true);
    const datos = []; for (let c = 0; c < ch; c++) datos.push(buf.getChannelData(c));
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, datos[c][i] || 0)); out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
    let bin = ''; const u8 = new Uint8Array(out.buffer);
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  G.CN_AUDIO = AU;
})(typeof window !== 'undefined' ? window : globalThis);
