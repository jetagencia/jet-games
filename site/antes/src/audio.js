// JET//Antes · música y efectos. Todo sintetizado con Web Audio: sin samples, sin melodías ajenas.
// Composición original para este juego (DISENO.md 13): Fa# dórico, 84 BPM, 4/4 con arpegio en
// semicorcheas de tresillo («reloj que gira»). Dos temas:
//   «Órbita lenta» (menú): Intro 8 · A 16 · A' 16 · B 16 (Re lidio) · Puente 8 · A'' 16 = 80 compases ≈ 3 min 49 s.
//     Versión larga (★ 90): + C 16 (coro) + Coda 8 = 104 compases ≈ 4 min 57 s.
//   «Bucle» (juego): A 16 · A' 16 · B 16 · Puente 8 · A'' 16 = 72 compases ≈ 3 min 26 s, con capas que entran
//     con cada copia (siempre en el compás siguiente, con fundido de un compás) y un color por capítulo.
// Cada vuelta cambia el timbre de la campana, el dibujo del arpegio y el registro del pad.
// El motor es una fábrica (motor(ctx)) para poder renderizar la muestra WAV con OfflineAudioContext.
// API pública estable (AUDIO.*): init, estado, suspender, reanudar, set, tema, capas, capitulo, tension, largo,
// rebobinado, victoria, finCapitulo, final, atenuar, sfx, cancelarCarga, zumbido, motor, parar, muestra.

const BPM = 84, BEAT = 60 / BPM, STEP = BEAT / 6, SPB = 24, BAR = BEAT * 4;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const KOFS = [0, 0, -2, 1, 3, 0]; // transposición por capítulo: Muelle Fa#, Bodega Mi, Laboratorio Sol, Montacargas La, Núcleo Fa#
function hash(n) { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; }

// ───────────────────────── armonía ─────────────────────────
// b = bajo; v = voces del pad (4 notas, registro medio). Todo en Fa# dórico salvo el puente y B (Re lidio).
const CH = {
  i9: { b: 42, v: [57, 61, 64, 68] },   // Fa#m9
  IV: { b: 42, v: [59, 63, 66, 73] },   // Si(add9)/Fa# — el Re# dórico
  III: { b: 45, v: [56, 61, 64, 69] },  // Lamaj7
  ii: { b: 44, v: [59, 63, 66, 68] },   // Sol#m7
  Vs: { b: 49, v: [61, 66, 68, 73] },   // Do#sus4
  VII: { b: 40, v: [56, 59, 63, 66] },  // Mimaj9 (sin fundamental)
  v: { b: 49, v: [56, 59, 64, 68] },    // Do#m7
  bVI: { b: 38, v: [57, 61, 66, 68] },  // Remaj7#11
  Ely: { b: 38, v: [56, 59, 64, 71] },  // Mi/Re (II lidio)
  iv: { b: 47, v: [59, 62, 66, 73] },   // Sim(add9)
  V7s: { b: 49, v: [59, 66, 68, 73] },  // Do#7sus4
};
const H4 = (a, b, c, d) => [a, b, c, d];
const hA = H4(['i9'], ['IV'], ['III'], ['ii', 'Vs']);
const hAv = H4(['v'], ['IV'], ['III'], ['ii', 'Vs']);
const hAc = H4(['i9'], ['IV'], ['VII'], ['Vs']);
const hAc2 = H4(['i9'], ['VII'], ['IV'], ['Vs']);
const hB1 = H4(['bVI'], ['Ely'], ['bVI'], ['Ely']);
const hB2 = H4(['iv'], ['v'], ['bVI'], ['Vs']);
const hB3 = H4(['iv'], ['v'], ['bVI'], ['V7s']);
const hP = H4(['bVI'], ['Vs'], ['iv'], ['V7s']);
const hC1 = H4(['VII'], ['III'], ['IV'], ['i9']);
const hC2 = H4(['v'], ['VII'], ['III'], ['Vs']);

// ───────────────────────── melodías (campana) ─────────────────────────
// «tiempo:nota:duración» en negras, dentro de una frase de 4 compases. El motivo es Fa#–La–Do#–Si–Sol#.
const MEL = {
  // «Órbita lenta»
  MA1: '0:78:1 1:81:1 2:85:1.5 3.5:83:.5 4:80:2.5 6.5:78:.5 7:80:1 8:81:3 11:80:.5 11.5:76:.5 12:78:2 14:80:2',
  MA2: '0:78:1 1:81:1 2:85:1 3:88:1 4:87:2.5 6.5:85:.5 7:83:1 8:81:1.5 9.5:83:.5 10:85:2 12:83:1.5 13.5:81:.5 14:80:2',
  MA3: '0:78:.5 .5:80:.5 1:81:1 2:85:1 3:88:.5 3.5:85:.5 4:83:2 6:80:1 7:83:1 8:81:2 10:76:1 11:80:1 12:78:3 15:73:1',
  MA4: '0:85:1 1:83:.5 1.5:81:.5 2:78:2 4:75:2 6:78:1 7:80:1 8:81:1 9:80:1 10:76:1 11:73:1 12:80:4',
  MI1: '0:78:1 1:75:1 2:71:1.5 3.5:73:.5 4:75:2.5 6.5:78:.5 7:80:1 8:81:2 10:85:1 11:83:1 12:80:2 14:78:1 15:80:1',
  MB1: '0:81:2 2:80:1 3:78:1 4:80:3 7:83:1 8:81:2 10:78:1 11:76:1 12:73:2 14:76:2',
  MB2: '0:86:1.5 1.5:85:.5 2:81:2 4:80:1 5:83:1 6:88:2 8:86:2 10:85:1 11:83:1 12:80:4',
  MB3: '0:83:1 1:85:1 2:86:2 4:88:2 6:85:2 8:81:1 9:85:1 10:88:1 11:92:1 12:90:2 14:85:2',
  MP: '0:85:3 3:81:1 4:80:4 8:78:3 11:76:1 12:78:4',
  MC1: '0:80:2 2:83:1 3:87:1 4:85:3 7:81:1 8:83:2 10:87:1 11:85:1 12:81:4',
  MC2: '0:80:1 1:83:1 2:88:2 4:87:2 6:83:2 8:85:2 10:81:1 11:80:1 12:78:4',
  // «Bucle»: figuras más cortas y rítmicas, como piezas de un mecanismo
  GA1: '0:78:.5 .5:81:.5 1:85:1 2.5:83:.5 3:80:1 4:78:.5 4.5:83:.5 5:87:1.5 7:85:1 8:81:.5 8.5:85:.5 9:88:1 10.5:85:.5 11:81:1 12:80:2 14:83:1 15:80:1',
  GA2: '0:85:1.5 1.5:83:.5 2:81:1 3:78:1 4:75:2 6:78:.5 6.5:80:.5 7:83:1 8:81:1.5 9.5:80:.5 10:76:2 12:80:3',
  GA3: '0:78:.5 .5:75:.5 1:71:1 2.5:73:.5 3:76:1 4:75:.5 4.5:78:.5 5:83:1.5 7:80:1 8:81:.5 8.5:76:.5 9:73:1 10.5:76:.5 11:81:1 12:80:2 14:78:1 15:80:1',
  GB1: '0:81:.5 .5:85:.5 1:88:1 2:86:1 3:85:1 4:83:.5 4.5:80:.5 5:76:2 7:80:1 8:81:.5 8.5:85:.5 9:90:1.5 10.5:88:.5 11:85:1 12:83:2 14:80:2',
  GB2: '0:86:1 1:85:.5 1.5:83:.5 2:81:2 4:80:1 5:83:1 6:85:2 8:86:1 9:88:1 10:90:1 11:88:1 12:85:4',
  GP: '0:73:4 4:80:4 8:78:4 12:73:2 14:80:2',
};
const PARSE = {};
for (const k in MEL) PARSE[k] = MEL[k].trim().split(/\s+/).map((tk) => tk.split(':').map(Number));
const M = (k, sube = 0) => ({ k, sube });

function seccion(nombre, armonia, frases) {
  return armonia.map((ch, i) => {
    const f = frases[Math.floor(i / 4)]; const mel = [];
    if (f) for (const [p, m, d] of PARSE[f.k]) if (Math.floor(p / 4) === i % 4) mel.push([Math.round((p - (i % 4) * 4) * 6), m + f.sube, d]);
    return { sec: nombre, i, n: armonia.length, ch, mel };
  });
}
const rep = (...hs) => hs.flat();
const S = {
  intro: seccion('intro', rep(H4(['i9'], ['i9'], ['IV'], ['IV']), H4(['III'], ['III'], ['ii'], ['Vs'])), []),
  A: seccion('A', rep(hA, hA, hA, hAc), [M('MA1'), null, M('MA2'), M('MA4')]),
  A2: seccion('A2', rep(hA, hAv, hA, hAc2), [M('MA1', 12), M('MA3', 12), M('MA2', 12), M('MA4')]),
  B: seccion('B', rep(hB1, hB2, hB1, hB3), [M('MB1'), M('MB2'), M('MB1', 12), M('MB3')]),
  P: seccion('puente', rep(hP, hP), [M('MP'), null]),
  A3: seccion('A3', rep(hA, hA, hAv, H4(['i9'], ['IV'], ['VII'], ['V7s'])), [M('MI1'), M('MA2'), M('MI1', 12), M('MA4')]),
  C: seccion('C', rep(hC1, hC1, hC2, hC2), [M('MC1'), M('MC1', 12), M('MC2'), M('MC2', 12)]),
  coda: seccion('coda', rep(H4(['i9'], ['IV'], ['i9'], ['IV']), H4(['III'], ['ii'], ['IV'], ['Vs'])), [M('MA4'), null]),
  gA: seccion('A', rep(hA, hA, hA, hAc), [M('GA1'), M('GA2'), M('GA1'), M('GA2')]),
  gA2: seccion('A2', rep(hA, hAv, hA, hAc2), [M('GA2'), M('GA1', 12), M('GA2'), M('GA1')]),
  gB: seccion('B', rep(hB1, hB2, hB1, hB3), [M('GB1'), M('GB2'), M('GB1', 12), M('GB2')]),
  gP: seccion('puente', rep(hP, hP), [M('GP'), M('GP', 12)]),
  gA3: seccion('A3', rep(hA, hA, hAv, H4(['i9'], ['IV'], ['VII'], ['V7s'])), [M('GA3'), M('GA1'), M('GA3', 12), M('GA2')]),
};
const FORMAS = {
  menu: [...S.intro, ...S.A, ...S.A2, ...S.B, ...S.P, ...S.A3],
  menuLargo: [...S.intro, ...S.A, ...S.A2, ...S.B, ...S.P, ...S.A3, ...S.C, ...S.coda],
  juego: [...S.gA, ...S.gA2, ...S.gB, ...S.gP, ...S.gA3],
};
const MOTIVO = [66, 69, 73, 71, 68];
const PAT = [[0, 1, 2, 3, 2, 1], [0, 2, 1, 3, 1, 2], [3, 2, 1, 0, 1, 2]];
const CAPAS = ['pad', 'bass', 'tick', 'arp', 'bell', 'perc', 'counter', 'tape', 'choir', 'spark', 'fija'];
const ENVIO = { pad: 0.32, bass: 0.04, tick: 0.12, arp: 0.22, bell: 0.55, perc: 0.08, counter: 0.25, tape: 0.65, choir: 0.5, spark: 0.7, fija: 0.45 };
const NOTA_ECO = [78, 81, 85, 88, 92, 95]; // Fa#5 La5 Do#6 Mi6 Sol#6 Si6
// etapa de ganancia (medida con la muestra renderizada; ver LEEME): música ≈ −22 dBFS RMS, efectos con picos de −10 a −4 dBFS
const MUS_G = 3.2, SFX_G = 2.4, TEMA_G = { menu: 1.9, juego: 1 };

function impulso(ac, seg, oscuro) {
  const sr = ac.sampleRate, n = Math.floor(sr * seg), pre = Math.floor(sr * 0.022);
  const b = ac.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch); let lp = 0;
    // primeras reflexiones (distintas en cada canal para dar anchura)
    for (let r = 0; r < 7; r++) { const i = pre + Math.floor(sr * (0.006 + 0.011 * r + 0.004 * ((r * 7 + ch * 3) % 5))); if (i < n) d[i] += (r % 2 ? -1 : 1) * 0.5 * Math.pow(0.78, r); }
    for (let i = pre; i < n; i++) {
      const x = (i - pre) / (n - pre);
      const c = 0.85 - (0.85 - oscuro) * Math.sqrt(x); // la cola se oscurece con el tiempo
      lp += c * ((Math.random() * 2 - 1) - lp);
      d[i] += lp * Math.pow(1 - x, 1.6) * Math.exp(-2.4 * x) * Math.min(1, (i - pre) / (sr * 0.03));
    }
  }
  return b;
}

// ───────────────────────── motor ─────────────────────────
function motor(ac) {
  const E = { ac, tema: null, forma: FORMAS.menu, capas: 1, capasPend: false, cap: 1, capPend: null, kofs: 0, tension: false, post: false, step: 0, nextT: 0, secAnt: null, obj: {} };
  const noise = (() => { const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();
  const brown = (() => { const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; } return b; })();
  const panner = (p) => { if (!ac.createStereoPanner) return ac.createGain(); const n = ac.createStereoPanner(); n.pan.value = Math.max(-1, Math.min(1, p)); return n; };

  // ── buses ──
  const master = ac.createGain(); master.gain.value = 0.82;
  const lim = ac.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.14;
  master.connect(lim); lim.connect(ac.destination);
  // medidor de salida (diagnóstico y pruebas): lo que de verdad llega a los altavoces
  const medidor = ac.createAnalyser(); medidor.fftSize = 2048; lim.connect(medidor); E.medidor = medidor;
  // música: capas → suma → filtro de rebobinado → filtro de pausa → compuerta → volumen
  const musSum = ac.createGain();
  const revM = ac.createConvolver(); revM.buffer = impulso(ac, 4.2, 0.08); const revMout = ac.createGain(); revMout.gain.value = 0.85; revM.connect(revMout); revMout.connect(musSum);
  const musFilt = ac.createBiquadFilter(); musFilt.type = 'lowpass'; musFilt.frequency.value = 16000; musFilt.Q.value = 0.6;
  const duckF = ac.createBiquadFilter(); duckF.type = 'lowpass'; duckF.frequency.value = 18000; duckF.Q.value = 0.4;
  const duck = ac.createGain(); const gate = ac.createGain(); const musVol = ac.createGain(); musVol.gain.value = 0;
  const temaG = ac.createGain(); E.temaG = temaG;
  musSum.connect(temaG); temaG.connect(musFilt); musFilt.connect(duckF); duckF.connect(duck); duck.connect(gate); gate.connect(musVol); musVol.connect(master);
  // efectos: voces → suma (+ reverb corta) → volumen
  const sfxSum = ac.createGain(); const sfxVol = ac.createGain(); sfxVol.gain.value = 0;
  const revS = ac.createConvolver(); revS.buffer = impulso(ac, 2.2, 0.12); const revSin = ac.createGain(); revSin.gain.value = 1; revSin.connect(revS); const revSout = ac.createGain(); revSout.gain.value = 0.5; revS.connect(revSout); revSout.connect(sfxSum);
  sfxSum.connect(sfxVol); sfxVol.connect(master);
  E.musVol = musVol; E.sfxVol = sfxVol; E.MUS_G = MUS_G; E.SFX_G = SFX_G; E.duck = duck; E.duckF = duckF;

  const L = {};
  for (const k of CAPAS) { const g = ac.createGain(); g.gain.value = k === 'fija' ? 1 : 0; g.connect(musSum); const s = ac.createGain(); s.gain.value = ENVIO[k]; g.connect(s); s.connect(revM); L[k] = g; E.obj[k] = k === 'fija' ? 1 : 0; }
  // arpegio: eco ping-pong en corchea con puntillo
  const arpIn = ac.createGain(); arpIn.connect(L.arp);
  const dL = ac.createDelay(2), dR = ac.createDelay(2), fbL = ac.createGain(), fbR = ac.createGain(), dlpf = ac.createBiquadFilter();
  dL.delayTime.value = BEAT * 0.75; dR.delayTime.value = BEAT * 0.75; fbL.gain.value = 0.3; fbR.gain.value = 0.3; dlpf.type = 'lowpass'; dlpf.frequency.value = 3200;
  const pL = panner(-0.7), pR = panner(0.7), dOut = ac.createGain(); dOut.gain.value = 0.42;
  arpIn.connect(dlpf); dlpf.connect(dL); dL.connect(fbL); fbL.connect(dR); dR.connect(fbR); fbR.connect(dL);
  dL.connect(pL); dR.connect(pR); pL.connect(dOut); pR.connect(dOut); dOut.connect(L.arp);
  E.fb = [fbL, fbR, dL, dR];
  // entrada del pad (se aparta un poco durante la tensión para que el semitono no sea estridente)
  const padIn = ac.createGain(); padIn.connect(L.pad);
  // desafinación global del pad (tensión de fin de bucle: sube un semitono)
  let padDet = null;
  if (ac.createConstantSource) { padDet = ac.createConstantSource(); padDet.offset.value = 0; padDet.start(); }

  // ── envolventes y voces ──
  function adsr(g, t, a, peak, d, sus, dur, r) {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), t + a + d);
    g.gain.setValueAtTime(Math.max(0.0001, peak * sus), t + Math.max(a + d, dur)); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + d, dur) + r);
    return t + Math.max(a + d, dur) + r;
  }
  function osc(tipo, f, t, fin) { const o = ac.createOscillator(); o.type = tipo; o.frequency.value = f; o.start(t); o.stop(fin + 0.05); return o; }

  function pad(notas, t, dur, corte, ancho, vel = 1, out = padIn) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = corte; f.Q.value = 0.8;
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.05 + 0.02 * hash(Math.round(t * 10)); lg.gain.value = corte * 0.33; lfo.connect(lg); lg.connect(f.frequency);
    const g = ac.createGain(); const fin = adsr(g, t, 0.85, 0.05 * vel, 0.6, 0.78, dur, 1.6);
    f.connect(g); g.connect(out);
    notas.forEach((m, j) => {
      for (const s of [-1, 1]) {
        const o = osc('sawtooth', mtof(m), t, fin); o.detune.value = s * 7 + (j - 1.5) * 1.5; if (padDet) padDet.connect(o.detune);
        const p = panner(s * ancho * (0.4 + j * 0.15)); o.connect(p); p.connect(f);
      }
    });
    lfo.start(t); lfo.stop(fin + 0.05);
  }
  function cinta(m, t, dur, vol = 0.07, out = L.tape) {
    // nota del pad al revés: crece despacio y se corta en seco, con «wow» de cinta
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(2400, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.96); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    const w = ac.createOscillator(), wg = ac.createGain(); w.frequency.value = 0.8; wg.gain.value = 9; w.connect(wg);
    for (const det of [-5, 5]) { const o = osc(det < 0 ? 'sawtooth' : 'triangle', mtof(m), t, t + dur); o.detune.value = det; wg.connect(o.detune); o.connect(f); }
    w.start(t); w.stop(t + dur + 0.05);
    f.connect(g); g.connect(out);
  }
  function bajo(m, t, dur, vel, sub) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(E.cap === 2 ? 260 : 520, t); f.frequency.exponentialRampToValueAtTime(E.cap === 2 ? 140 : 220, t + dur); f.Q.value = 2;
    const g = ac.createGain(); const fin = adsr(g, t, 0.008, 0.3 * vel, 0.18, 0.55, dur * 0.85, 0.12);
    const o = osc('sine', mtof(m), t, fin); const o2 = osc('sawtooth', mtof(m), t, fin); o2.detune.value = 4;
    const g2 = ac.createGain(); g2.gain.value = 0.22; o2.connect(g2); g2.connect(f); o.connect(f);
    if (sub) { const o3 = osc('sine', mtof(m - 12), t, fin); const g3 = ac.createGain(); g3.gain.value = 0.55; o3.connect(g3); g3.connect(f); }
    f.connect(g); g.connect(L.bass);
  }
  function tic(t, v) {
    const s = ac.createBufferSource(); s.buffer = noise; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6500;
    const f2 = ac.createBiquadFilter(); f2.type = 'peaking'; f2.frequency.value = 9500; f2.gain.value = 6;
    const g = ac.createGain(); g.gain.setValueAtTime(0.16 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    s.connect(f); f.connect(f2); f2.connect(g); g.connect(L.tick); s.start(t, hash(Math.round(t * 1000)) * 1.5); s.stop(t + 0.04);
  }
  function pluck(m, t, pan, v) {
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.085 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    const o = osc('triangle', mtof(m), t, t + 0.27); const o2 = osc('sine', mtof(m + 12), t, t + 0.1);
    const g2 = ac.createGain(); g2.gain.setValueAtTime(0.35, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08); o2.connect(g2); g2.connect(g);
    let n = g;
    if (E.cap === 3 && E.tema === 'juego') { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 9; const c = 1400 + 1800 * (0.5 + 0.5 * Math.sin(t * 0.7)); f.frequency.setValueAtTime(c * 1.8, t); f.frequency.exponentialRampToValueAtTime(c * 0.4, t + 0.22); g.connect(f); n = f; }
    o.connect(g); const p = panner(pan); n.connect(p); p.connect(arpIn);
  }
  const TIMBRES = [{ r: 3.5, i: 2.2, d: 1 }, { r: 1, i: 1.6, d: 0.8, oct: true }, { r: 7, i: 0.9, d: 1.25 }];
  function campana(m, t, dur, timbre, out, vol = 0.11, pan = 0.28) {
    const T = TIMBRES[timbre % 3]; const fr = mtof(m); dur *= T.d;
    const car = osc('sine', fr, t, t + dur), mod = osc('sine', fr * T.r, t, t + dur), mg = ac.createGain();
    mg.gain.setValueAtTime(fr * T.i, t); mg.gain.exponentialRampToValueAtTime(fr * 0.04, t + dur * 0.7);
    mod.connect(mg); mg.connect(car.frequency);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    car.connect(g);
    if (T.oct) { const c2 = osc('sine', fr * 2.001, t, t + dur * 0.5); const g2 = ac.createGain(); g2.gain.setValueAtTime(0.25, t); g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.5); c2.connect(g2); g2.connect(g); }
    const p = panner(pan); g.connect(p); p.connect(out || L.bell);
  }
  function bombo(t, v = 1) {
    const o = osc('sine', 110, t, t + 0.4); o.frequency.setValueAtTime(115, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.16);
    const g = ac.createGain(); g.gain.setValueAtTime(0.42 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36); o.connect(g); g.connect(L.perc);
  }
  function madera(t, v = 1) {
    const s = ac.createBufferSource(); s.buffer = noise; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = E.cap === 2 && E.tema === 'juego' ? 820 : 1480; f.Q.value = 16;
    const g = ac.createGain(); g.gain.setValueAtTime(0.55 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    s.connect(f); f.connect(g); g.connect(L.perc); s.start(t, hash(Math.round(t * 777)) * 1.5); s.stop(t + 0.1);
  }
  function arena(t, v) {
    const s = ac.createBufferSource(); s.buffer = noise; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 8500;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 * v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    const p = panner(0.35); s.connect(f); f.connect(g); g.connect(p); p.connect(L.perc); s.start(t, hash(Math.round(t * 333)) * 1.5); s.stop(t + 0.08);
  }
  function contracanto(m, t, dur) {
    const o = osc('square', mtof(m), t, t + dur + 0.7); const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 1.5;
    const v = ac.createOscillator(), vg = ac.createGain(); v.frequency.value = 4.6; vg.gain.value = 6; v.connect(vg); vg.connect(o.detune); v.start(t + 0.4); v.stop(t + dur + 0.75);
    const g = ac.createGain(); adsr(g, t, 0.25, 0.045, 0.4, 0.7, dur, 0.5);
    o.connect(f); f.connect(g); const p = panner(-0.25); g.connect(p); p.connect(L.counter);
  }
  const VOCAL = [[800, 1150, 2900], [500, 900, 2400], [400, 1700, 2600]];
  function coro(notas, t, dur, vocal) {
    const F = VOCAL[vocal % 3]; const sum = ac.createGain(); sum.gain.value = 1;
    const out = ac.createGain(); adsr(out, t, 1.3, 0.06, 0.5, 0.85, dur, 1.4);
    F.forEach((fq, j) => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fq; b.Q.value = 9 + j * 2; const bg = ac.createGain(); bg.gain.value = [1, 0.55, 0.22][j]; sum.connect(b); b.connect(bg); bg.connect(out); });
    for (const m of notas) for (const det of [-9, 9]) { const o = osc('sawtooth', mtof(m), t, t + dur + 1.5); o.detune.value = det; const vb = ac.createOscillator(), vg = ac.createGain(); vb.frequency.value = 5 + hash(m) ; vg.gain.value = 7; vb.connect(vg); vg.connect(o.detune); vb.start(t); vb.stop(t + dur + 1.5); o.connect(sum); }
    const p = panner(0.1); out.connect(p); p.connect(L.choir);
  }
  function chispa(m, t) { campana(m, t, 1.6, 2, L.spark, 0.035, hash(Math.round(t * 99)) * 1.2 - 0.6); }

  function sostener(p, t, previsto) {
    if (p.cancelAndHoldAtTime) { try { p.cancelAndHoldAtTime(t); return; } catch {} }
    p.cancelScheduledValues(t); p.setValueAtTime(previsto, t);
  }
  // ── capas: objetivo según tema, sección, copias y capítulo ──
  function objetivo(sec) {
    const o = {}; for (const k of CAPAS) o[k] = 0; o.fija = 1;
    if (E.tema === 'menu') {
      const T = {
        intro: { pad: 0.6, tape: 0.55, spark: 0.6 },
        A: { pad: 0.52, arp: 0.26, bell: 0.55, tape: 0.35, spark: 0.3 },
        A2: { pad: 0.46, arp: 0.3, bell: 0.48, bass: 0.5, tape: 0.3, spark: 0.2 },
        B: { pad: 0.55, arp: 0.3, bell: 0.52, bass: 0.48, counter: 0.3, tape: 0.3 },
        puente: { pad: 0.4, bell: 0.6, tape: 0.6, spark: 0.55 },
        A3: { pad: 0.46, arp: 0.32, bell: 0.52, bass: 0.52, tick: 0.3, perc: 0.38, counter: 0.3, tape: 0.3 },
        C: { pad: 0.48, choir: 0.42, arp: 0.24, bell: 0.48, bass: 0.45, tape: 0.35 },
        coda: { pad: 0.55, tape: 0.55, spark: 0.5, bell: 0.35 },
      }[sec] || {};
      Object.assign(o, T);
    } else if (E.tema === 'juego') {
      if (E.post) Object.assign(o, { pad: 0.42, tape: 0.4, spark: 0.45 });
      else {
        const c = E.capas;
        Object.assign(o, { pad: sec === 'B' ? 0.5 : 0.44, bass: 0.5, tick: 0.42, tape: 0.22 });
        if (c >= 2) o.arp = 0.3;
        if (c >= 3) o.bell = 0.5;
        if (c >= 4) { o.perc = 0.42; o.counter = 0.3; }
        if (E.cap === 5 && c >= 2) o.choir = 0.3;
        if (sec === 'puente') { o.arp = 0; o.perc *= 0.4; o.tape = 0.5; o.spark = 0.4; o.bass *= 0.7; }
      }
    }
    return o;
  }
  E.aplicarCapas = function (t, dur, sec) {
    if (!sec) sec = E.forma[Math.floor(E.step / SPB) % E.forma.length].sec; const o = objetivo(sec);
    for (const k of CAPAS) { sostener(L[k].gain, t, E.obj[k]); L[k].gain.linearRampToValueAtTime(o[k], t + dur); E.obj[k] = o[k]; }
  };
  E.silenciarCapas = function (t, tau) { for (const k of CAPAS) { if (k === 'fija') continue; sostener(L[k].gain, t, E.obj[k]); L[k].gain.setTargetAtTime(0, t, tau); E.obj[k] = 0; } };
  E.capaFija = L.fija;

  // ── un paso de la grilla (semicorchea de tresillo) ──
  E.paso = function (s, t, mudo) {
    const F = E.forma, barAbs = Math.floor(s / SPB), inBar = s % SPB, bar = F[barAbs % F.length], vuelta = Math.floor(barAbs / F.length);
    if (inBar === 0) {
      if (E.capPend != null) { E.cap = E.capPend; E.kofs = KOFS[E.cap] || 0; E.capPend = null; }
      if (bar.sec !== E.secAnt || E.capasPend) { const primera = E.secAnt == null; E.secAnt = bar.sec; E.capasPend = false; E.aplicarCapas(t, primera ? 0.8 : BAR, bar.sec); }
    }
    if (mudo) return;
    const O = E.obj, sec = bar.sec, k = E.tema === 'juego' ? E.kofs : 0;
    const half = bar.ch.length === 2 && inBar >= 12, ch = CH[bar.ch[half ? 1 : 0]], beat = Math.floor(inBar / 6);
    const juego = E.tema === 'juego';
    // pad
    if (O.pad > 0 && (inBar === 0 || (inBar === 12 && bar.ch.length === 2))) {
      let v = ch.v.map((m) => m + k); if (vuelta % 2 === 1) v = [v[0], v[1], v[2], v[3] + 12];
      const corte = (sec === 'B' || sec === 'C' ? 1300 : sec === 'intro' || sec === 'puente' ? 700 : 950) * (juego && E.cap === 4 ? 1.7 : 1);
      pad(v, t, (bar.ch.length === 2 ? 12 : 24) * STEP, corte, juego && E.cap === 4 ? 1 : 0.7, sec === 'intro' && bar.i === 0 ? 0.8 : 1);
    }
    // cinta invertida: cada dos compases, una nota del acorde que crece hacia el tiempo 3
    if (O.tape > 0 && inBar === 0 && bar.i % 2 === 1) cinta(ch.v[(bar.i + vuelta) % 4] + 12 + k, t, BEAT * 2);
    if (O.tape > 0 && sec === 'puente' && bar.i >= 4 && inBar === 12) cinta(MOTIVO[bar.i - 4] + 12 + k, t, BEAT * 2, 0.06);
    // chispas: notas altas sueltas, deterministas
    if (O.spark > 0 && (inBar === 9 || inBar === 15) && hash(s * 7 + vuelta) < 0.35) chispa(ch.v[Math.floor(hash(s) * 4)] + 24 + k, t);
    // bajo pulsante en negras
    if (O.bass > 0 && inBar % 6 === 0 && sec !== 'intro') {
      const r = ch.b + k; const vel = [1, 0.62, 0.82, 0.62][beat];
      let m = r; if (beat === 3 && (sec === 'A2' || sec === 'A3' || sec === 'B') && hash(barAbs) < 0.6) m = r + 7; if (beat === 2 && sec === 'C') m = r + 12;
      bajo(m, t, BEAT * 0.92, vel, juego && E.cap === 2);
    }
    // reloj: «tic» en cada tiempo; con tensión, en corcheas
    if (O.tick > 0 && (inBar % 6 === 0 || (E.tension && juego && inBar % 3 === 0))) tic(t, inBar === 0 ? 1 : inBar % 6 === 0 ? 0.75 : 0.5);
    // arpegio de reloj
    if (O.arp > 0 && sec !== 'puente' && sec !== 'intro' && sec !== 'coda') {
      const pat = PAT[(vuelta + (sec === 'B' ? 1 : 0)) % 3];
      const lift = (beat === 2 && (sec === 'A2' || sec === 'A3' || sec === 'B')) || (beat === 3 && sec === 'C') ? 12 : 0;
      const m = ch.v[pat[inBar % 6]] + 12 + lift + k;
      const acc = inBar % 6 === 0 ? 1 : 0.55 + 0.25 * hash(s * 3);
      pluck(m, t + (inBar % 2 ? STEP * 0.04 : 0), inBar % 2 ? -0.55 : -0.05, acc);
    }
    // campana con la melodía
    if (O.bell > 0) for (const [p, m, d] of bar.mel) if (p === inBar) campana(m + k, t, Math.max(1.3, d * BEAT * 1.7), vuelta + (juego ? E.cap : 0), null, sec === 'puente' ? 0.12 : 0.105);
    // percusión
    if (O.perc > 0) {
      if (inBar === 0 || inBar === 12) bombo(t, inBar === 0 ? 1 : 0.8);
      if (inBar === 18) madera(t);
      if (inBar === 21 && hash(barAbs * 5) < 0.4) madera(t, 0.45);
      if ((inBar % 6 === 2 || inBar % 6 === 4) && hash(s * 11) < 0.8) arena(t, inBar % 6 === 4 ? 1 : 0.6);
    }
    // contracanto grave: notas guía del acorde
    if (O.counter > 0 && (inBar === 0 || (inBar === 12 && bar.ch.length === 2))) contracanto(ch.v[1] - 12 + k, t, (bar.ch.length === 2 ? 2 : 3.6) * BEAT);
    // coro de formantes (Núcleo y sección C)
    if (O.choir > 0 && inBar === 0) coro([ch.v[0] + k, ch.v[2] + k], t, BAR * 0.95, barAbs);
  };

  // ── momentos ──
  E.rebobinado = function (t, tVuelta) {
    const f = musFilt.frequency; f.cancelScheduledValues(t); f.setValueAtTime(Math.min(16000, f.value || 16000), t);
    f.exponentialRampToValueAtTime(300, t + 0.6);
    const gg = gate.gain; gg.cancelScheduledValues(t); gg.setValueAtTime(1, t); gg.setValueAtTime(1, t + 0.72); gg.linearRampToValueAtTime(0.0001, t + 0.75);
    gg.setValueAtTime(0.0001, tVuelta); gg.linearRampToValueAtTime(1, tVuelta + 0.05);
    f.setValueAtTime(300, tVuelta); f.exponentialRampToValueAtTime(16000, tVuelta + 0.5);
    // la cinta invertida baja una octava
    const k = E.tema === 'juego' ? E.kofs : 0;
    const o = osc('sawtooth', mtof(78 + k), t, t + 0.75), o2 = osc('triangle', mtof(66 + k), t, t + 0.75);
    o.frequency.setValueAtTime(mtof(78 + k), t); o.frequency.exponentialRampToValueAtTime(mtof(66 + k), t + 0.72);
    o2.frequency.setValueAtTime(mtof(66 + k), t); o2.frequency.exponentialRampToValueAtTime(mtof(54 + k), t + 0.72);
    const lf = ac.createBiquadFilter(); lf.type = 'lowpass'; lf.frequency.value = 1800;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.6); g.gain.linearRampToValueAtTime(0.0001, t + 0.74);
    o.connect(lf); o2.connect(lf); lf.connect(g); g.connect(L.fija);
  };
  E.victoria = function (t) {
    const k = E.tema === 'juego' ? E.kofs : 0;
    E.silenciarCapas(t, 0.25);
    const out = sfxSum; const g0 = ac.createGain(); g0.gain.value = 0.7; g0.connect(out); g0.connect(revSin);
    // Do#sus4 → Fa# MAYOR: la primera vez que la tónica suena plena (tercera de picardía)
    const padV = (notas, t0, dur, vol) => { const g = ac.createGain(); const fin = adsr(g, t0, 0.18, vol, 0.5, 0.7, dur, 1.4); const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t0); f.frequency.exponentialRampToValueAtTime(2600, t0 + 0.8); f.connect(g); g.connect(g0); for (const m of notas) for (const d of [-6, 6]) { const o = osc('sawtooth', mtof(m), t0, fin); o.detune.value = d; o.connect(f); } };
    padV([61 + k, 66 + k, 68 + k, 73 + k], t, 0.75, 0.035);
    MOTIVO.forEach((m, i) => campana(m + 12 + k, t + i * 0.14, 1.1, 0, g0, 0.09, 0.2));
    const tR = t + 0.85;
    padV([58 + k, 61 + k, 66 + k, 70 + k, 73 + k], tR, 1.9, 0.045);
    [66, 70, 73, 78].forEach((m, i) => campana(m + 12 + k, tR + i * 0.11, 2.4, 0, g0, 0.1, -0.3 + i * 0.2));
    const b = ac.createGain(); adsr(b, tR, 0.02, 0.25, 0.4, 0.5, 1.6, 1); const ob = osc('sine', mtof(42 + k), tR, tR + 3); ob.connect(b); b.connect(g0);
  };
  // versión extendida del motivo (fin de capítulo ~14 s; final del juego ~20 s, sobre el pad solo)
  E.estrofa = function (t, tipo) {
    const out = ac.createGain(); out.gain.value = 0.72; out.connect(L.fija); E.silenciarCapas(t, 0.4);
    E.temaG.gain.setTargetAtTime(1, t, 0.1);
    const k = 0;
    if (tipo === 'final') {
      const prog = ['i9', 'IV', 'III', 'Vs', 'i9', 'IV', 'bVI', 'Vs'];
      prog.forEach((c, i) => pad(CH[c].v.map((m) => m + k), t + i * BAR * 0.75, BAR * 0.75, 800, 0.8, 0.9, out));
      // el motivo, nota a nota, devuelto por la cinta invertida
      MOTIVO.forEach((m, i) => { const ti = t + 1.2 + i * 2.4; campana(m + 12, ti, 2.6, i % 3, out, 0.1, -0.3 + i * 0.15); cinta(m + 12, ti + 0.6, 1.8, 0.05, out); });
      // resolución a Fa# mayor
      const tf = t + prog.length * BAR * 0.75;
      pad([58, 61, 66, 70, 73], tf, 3.5, 1100, 1, 0.7, out);
      [66, 70, 73, 78, 82].forEach((m, i) => campana(m + 12, tf + 0.2 + i * 0.32, 3.2, 0, out, 0.085, -0.4 + i * 0.2));
      const b = ac.createGain(); adsr(b, tf, 0.6, 0.14, 1, 0.7, 3, 2.5); const ob = osc("sine", mtof(42), tf, tf + 6); ob.connect(b); b.connect(out);
      return tf + 6 - t;
    }
    // fin de capítulo: motivo ampliado sobre i9 – IV – III – ii – Vs, sin resolver (la historia sigue)
    const prog = ['i9', 'IV', 'III', 'ii', 'Vs'];
    prog.forEach((c, i) => pad(CH[c].v, t + i * BAR * 0.95, BAR * 0.95, 900, 0.8, 1, out));
    const mel = [[0, 78], [1, 81], [2, 85], [3.5, 83], [4, 80], [6, 78], [8, 81], [9, 85], [10, 88], [11, 87], [12, 85], [14, 83], [16, 80]];
    mel.forEach(([b, m], i) => campana(m, t + 0.6 + b * BEAT * 0.95, 2, i < 7 ? 0 : 1, out, 0.1, 0.25));
    [3, 7, 11].forEach((b, i) => cinta(CH[prog[i]].v[3] + 12, t + b * BEAT, BEAT * 2, 0.05, out));
    return prog.length * BAR * 0.95 + 1.5;
  };

  // ── efectos ──
  // equilibrio medido por efecto (render de cada uno contra la música a −21 dBFS RMS)
  const GAN = { paso: 3.5, esperar: 2, empujaPuerta: 1.2, puertaAbre: 3, puertaCierra: 3, placaOn: 2.5, placaOff: 2.5, caja: 1.2, laserOff: 2.8, laserOn: 2.8, desvanece: 2.5, carga: 2.2, ecoNuevo: 1.8, estrella: 1.4, record: 1.4, ui: 2.2, toggle: 2.5 };
  function salida(pan, eco, gan = 1) {
    const g = ac.createGain(); g.gain.value = (eco ? 0.5 : 1) * gan; // ecos −6 dB respecto de los tuyos
    const p = panner(Math.max(-0.6, Math.min(0.6, pan || 0))); g.connect(p); p.connect(sfxSum); return g;
  }
  function tono(m, t, dur, tipo, vol, out, glide, a = 0.005) {
    const o = osc(tipo, mtof(m), t, t + dur); o.frequency.setValueAtTime(mtof(m), t); if (glide != null) o.frequency.exponentialRampToValueAtTime(mtof(glide), t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); return { o, g };
  }
  function ruido(t, dur, tipo, freq, q, vol, out, f2, buf) {
    const s = ac.createBufferSource(); s.buffer = buf || noise; const f = ac.createBiquadFilter(); f.type = tipo; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.03);
  }
  const bellS = (m, t, dur, vol, out, timbre = 0) => { const g = ac.createGain(); g.gain.value = 1; g.connect(out); const r = ac.createGain(); r.gain.value = 0.6; g.connect(r); r.connect(revSin); campana(m, t, dur, timbre, g, vol, 0); };
  let carga = null;
  E.sfx = function (n, o, t) {
    const out = salida(o.pan, o.eco, GAN[n] || 1), k = E.tema === 'juego' ? E.kofs : 0;
    switch (n) {
      case 'paso':
        ruido(t, o.eco ? 0.045 : 0.06, 'bandpass', o.eco ? 1500 : 2400, o.eco ? 5 : 3, o.eco ? 0.12 : 0.17, out);
        tono(85 + k, t, 0.05, 'sine', o.eco ? 0.012 : 0.022, out); break;
      case 'esperar': tono(78 + k, t, 0.045, 'sine', 0.07, out); ruido(t, 0.025, 'highpass', 6500, 1, 0.05, out); break;
      case 'rechazo': tono(42 + k, t, 0.13, 'sine', 0.36, out, 30 + k, 0.004); ruido(t, 0.06, 'lowpass', 380, 1, 0.14, out); break;
      case 'empujaPuerta': {
        tono(49 + k, t, 0.15, 'triangle', 0.24, out, 46 + k, 0.003); ruido(t, 0.09, 'bandpass', 950, 7, 0.16, out);
        // la hoja vibra: parcial inarmónica con trémolo
        const { g } = tono(61 + k, t + 0.01, 0.3, 'sine', 0.05, out); const tr = ac.createOscillator(), tg = ac.createGain(); tr.frequency.value = 28; tg.gain.value = 0.035; tr.connect(tg); tg.connect(g.gain); tr.start(t); tr.stop(t + 0.33);
        const p2 = tono(61 + k, t + 0.01, 0.25, 'sine', 0.025, out); p2.o.frequency.value = mtof(61 + k) * 2.76; break;
      }
      case 'puertaAbre': ruido(t, 0.19, 'bandpass', 500, 4, 0.11, out, 2400); tono(71 + k, t + 0.03, 0.09, 'sine', 0.05, out); tono(75 + k, t + 0.1, 0.12, 'sine', 0.055, out); break;
      case 'puertaCierra': ruido(t, 0.19, 'bandpass', 2400, 4, 0.11, out, 500); tono(75 + k, t + 0.03, 0.09, 'sine', 0.05, out); tono(71 + k, t + 0.1, 0.12, 'sine', 0.05, out); ruido(t + 0.17, 0.05, 'lowpass', 600, 1, 0.1, out); break;
      case 'placaOn': tono(73 + k, t, 0.09, 'triangle', 0.08, out); tono(78 + k, t + 0.06, 0.12, 'triangle', 0.085, out); ruido(t, 0.03, 'lowpass', 900, 1, 0.06, out); break;
      case 'placaOff': tono(78 + k, t, 0.08, 'triangle', 0.06, out); tono(73 + k, t + 0.06, 0.1, 'triangle', 0.06, out); break;
      case 'caja': ruido(t, 0.15, 'lowpass', 520, 0.8, 0.5, out, 260, brown); tono(37 + k, t, 0.1, 'sine', 0.1, out); break;
      case 'cajaCarga': tono(54 + k, t, 0.28, 'sine', 0.32, out, 50 + k, 0.003); tono(61 + k, t + 0.02, 0.26, 'triangle', 0.07, out); tono(66 + k, t + 0.02, 0.26, 'triangle', 0.045, out); ruido(t, 0.09, 'lowpass', 300, 1, 0.28, out); break;
      case 'laserOff': { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; f.connect(out); tono(57 + k, t, 0.16, 'sawtooth', 0.06, f, 45 + k); break; }
      case 'laserOn': { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; f.connect(out); tono(45 + k, t, 0.16, 'sawtooth', 0.06, f, 57 + k); break; }
      case 'desvanece':
        // brillo granular que baja de Do#6 a Fa#5
        for (let i = 0; i < 16; i++) { const q = i / 15; const m = 85 + k - 7 * q + (Math.random() - 0.5) * 0.6; tono(m, t + q * 0.5 + Math.random() * 0.03, 0.09, 'sine', 0.035 * (1 - q * 0.6), out); }
        ruido(t, 0.55, 'bandpass', 7000, 6, 0.03, out, 3000); break;
      case 'carga': {
        const a = tono(54 + k, t, 0.38, 'triangle', 0.075, out, 66 + k, 0.02); const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 6; f.frequency.setValueAtTime(800, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.35);
        const s = ac.createBufferSource(); s.buffer = noise; const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.04, t + 0.34); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 0.4);
        carga = [a.g, g]; break;
      }
      case 'rebobinar':
        ruido(t, 0.9, 'bandpass', 3200, 2.2, 0.17, out, 180);
        tono(66 + k, t, 0.9, 'sawtooth', 0.035, out, 54 + k, 0.3);
        tono(42 + k, t + 0.46, 0.13, 'sine', 0.32, out); tono(42 + k, t + 0.68, 0.13, 'sine', 0.24, out); break;
      case 'ecoNuevo': bellS(NOTA_ECO[(o.k || 0) % 6] + k, t, 0.9, 0.11, out); break;
      case 'estrella': bellS([85, 88, 90][o.i || 0] + k, t, 0.6, 0.13, out); break;
      case 'record': bellS(93 + k, t, 0.5, 0.11, out, 2); bellS(97 + k, t + 0.12, 0.7, 0.11, out, 2); break;
      case 'ui': tono(83, t, 0.03, 'sine', 0.055, out); ruido(t, 0.012, 'highpass', 5000, 1, 0.025, out); break;
      case 'toggle': tono(83, t, 0.028, 'sine', 0.055, out); tono(76, t + 0.045, 0.028, 'sine', 0.055, out); break;
      case 'capitulo':
        // compuerta: servo grave que sube, golpe de cierre y la fanfarria corta del motivo
        ruido(t, 0.65, 'bandpass', 220, 3, 0.2, out, 1600); tono(30, t, 0.6, 'sawtooth', 0.04, out, 42);
        ruido(t + 0.62, 0.12, 'lowpass', 400, 1, 0.3, out); tono(42, t + 0.62, 0.25, 'sine', 0.28, out, 36);
        MOTIVO.forEach((m, i) => bellS(m + 12, t + 0.75 + i * 0.16, 1.1, 0.1, out));
        bellS(78 + 12, t + 0.75 + 5 * 0.16, 1.4, 0.09, out, 1); break;
      case 'diario':
        MOTIVO.forEach((m, i) => bellS(m + 12, t + i * 0.13, 0.9, 0.1, out));
        [90, 93, 97].forEach((m, i) => bellS(m, t + 0.8 + i * 0.12, 0.8, 0.08, out, 2)); break;
    }
  };
  E.cancelarCarga = function (t) { if (!carga) return; for (const g of carga) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.setTargetAtTime(0.0001, t, 0.02); } carga = null; };

  // continuos: láser (La2, trémolo 12 Hz, ~−24 dB) y motor de plataformas (Fa#1)
  let hum = null, mot = null; E.humObj = 0; E.humN = 0;
  E.zumbido = function (n, t, mute) {
    if (!hum) {
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(45 + E.kofs);
      const o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = mtof(57 + E.kofs); o2.detune.value = 6;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 480; f.Q.value = 3;
      const tr = ac.createOscillator(), tg = ac.createGain(); tr.frequency.value = 12; tg.gain.value = 0.35;
      const am = ac.createGain(); am.gain.value = 0.65; const g = ac.createGain(); g.gain.value = 0; const g2 = ac.createGain(); g2.gain.value = 0.3;
      tr.connect(tg); tg.connect(am.gain); o.connect(f); o2.connect(g2); g2.connect(f); f.connect(am); am.connect(g); g.connect(sfxSum); o.start(); o2.start(); tr.start();
      hum = { g, o, o2 };
    }
    hum.o.frequency.setTargetAtTime(mtof(45 + E.kofs), t, 0.05); hum.o2.frequency.setTargetAtTime(mtof(57 + E.kofs), t, 0.05);
    E.humN = n; E.humObj = n > 0 ? Math.min(0.07, 0.045 + n * 0.008) : 0;
    hum.g.gain.setTargetAtTime(mute ? 0 : E.humObj, t, 0.12);
  };
  E.motor = function (on, t) {
    if (!mot) {
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(30);
      const v = ac.createOscillator(), vg = ac.createGain(); v.frequency.value = 6; vg.gain.value = 2.5; v.connect(vg); vg.connect(o.frequency);
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220; f.Q.value = 2; const g = ac.createGain(); g.gain.value = 0;
      o.connect(f); f.connect(g); g.connect(sfxSum); o.start(); v.start(); mot = g;
    }
    mot.gain.setTargetAtTime(on ? 0.13 : 0, t, on ? 0.03 : 0.06);
  };
  E.tensionPad = function (on, t) { sostener(padIn.gain, t, on ? 1 : 0.55); padIn.gain.linearRampToValueAtTime(on ? 0.55 : 1, t + (on ? 0.6 : 0.4)); if (padDet) { padDet.offset.cancelScheduledValues(t); padDet.offset.setValueAtTime(padDet.offset.value, t); padDet.offset.linearRampToValueAtTime(on ? 100 : 0, t + (on ? 0.9 : 0.4)); } };
  E.capituloColor = function (t) { const largo = E.cap === 4 && E.tema === 'juego'; for (const n of E.fb.slice(0, 2)) n.gain.setTargetAtTime(largo ? 0.46 : 0.3, t, 0.3); for (const d of E.fb.slice(2)) d.delayTime.setTargetAtTime(BEAT * (largo ? 1.5 : 0.75), t, 0.2); };
  return E;
}

// ───────────────────────── capa en vivo ─────────────────────────
const A = {};
let ac = null, E = null, sched = null, token = 0;
let pref = { music: true, musicVol: 0.7, sfx: true, sfxVol: 0.85 };
let temaQuerido = null, largo = false, capasQ = 1, capQ = 1, tensionQ = false, atenuado = false, finalT = 0;
const posGuardada = {};
const formaDe = (t) => (t === 'menu' ? (largo ? 'menuLargo' : 'menu') : t);

A.init = function () {
  if (ac) { if (ac.state !== 'running') ac.resume().catch(() => {}); return true; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  try { ac = new AC({ latencyHint: 'interactive' }); } catch { try { ac = new AC(); } catch { return false; } }
  E = motor(ac);
  // desbloqueo en iOS antiguos: un búfer vacío dentro del gesto
  try { const b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(0); } catch {}
  if (ac.state !== 'running') ac.resume().catch(() => {});
  aplicarVol(true);
  E.capas = capasQ; E.cap = capQ; E.kofs = KOFS[capQ] || 0; E.tension = tensionQ;
  if (temaQuerido) arrancar(temaQuerido);
  return true;
};
A.estado = () => (ac ? ac.state : 'none');
A.suspender = () => { if (ac && ac.state === 'running') ac.suspend().catch(() => {}); };
A.reanudar = () => { if (ac && ac.state !== 'running') ac.resume().catch(() => {}); };
A.set = function (p) { Object.assign(pref, p); aplicarVol(false); };
function aplicarVol(ya) {
  if (!ac) return; const t = ac.currentTime, tau = ya ? 0.01 : 0.06;
  // música ~7 dB por debajo de los efectos (0,45 ≈ −7 dB)
  E.musVol.gain.setTargetAtTime(pref.music ? pref.musicVol * pref.musicVol * MUS_G : 0, t, tau);
  E.sfxVol.gain.setTargetAtTime(pref.sfx ? pref.sfxVol * pref.sfxVol * SFX_G : 0, t, tau);
}

function programar() {
  if (!ac || !E || !E.tema) return;
  if (ac.state !== 'running') return;
  const now = ac.currentTime;
  if (E.nextT < now - 0.05) { const salto = Math.ceil((now + 0.05 - E.nextT) / STEP); E.step += salto; E.nextT += salto * STEP; }
  while (E.nextT < now + 0.2) { E.paso(E.step, E.nextT, !pref.music); E.nextT += STEP; E.step++; }
}
function guardarPos() {
  if (!E || !E.tema) return; const F = E.forma, bar = Math.floor(E.step / SPB), b = F[bar % F.length];
  posGuardada[formaDe(E.tema)] = (bar - b.i) * SPB;
}
function arrancar(t) {
  if (!ac || !E) return;
  E.tema = t; E.forma = FORMAS[formaDe(t)]; E.step = posGuardada[formaDe(t)] || 0; E.nextT = ac.currentTime + 0.06; E.secAnt = null; E.post = false;
  E.capituloColor(ac.currentTime); E.temaG.gain.setTargetAtTime(TEMA_G[t] || 1, ac.currentTime, 0.05);
  if (!sched) sched = setInterval(programar, 25);
  programar();
}
A.tema = function (t) {
  if (t === temaQuerido) return;
  temaQuerido = t; const mio = ++token;
  if (t !== null) finalT = 0;
  if (!ac || !E) return;
  if (E.tema) { guardarPos(); E.silenciarCapas(ac.currentTime, 0.18); E.tema = null; }
  if (t) setTimeout(() => { if (mio === token && temaQuerido === t) arrancar(t); }, 380);
};
A.capas = function (n) { capasQ = n; if (!E) return; if (E.capas !== n || E.post) { E.capas = n; E.post = false; E.capasPend = true; } };
A.capitulo = function (c) { capQ = c || 1; if (!E) return; if (E.tema === 'juego' && E.cap !== capQ) E.capPend = capQ; else { E.cap = capQ; E.kofs = KOFS[capQ] || 0; } if (ac) E.capituloColor(ac.currentTime); };
A.tension = function (on) { on = !!on; if (on === tensionQ) return; tensionQ = on; if (!E) return; E.tension = on; E.tensionPad(on && E.tema === 'juego', ac.currentTime); };
A.largo = function (on) { largo = !!on; };
A.atenuar = function (on) {
  on = !!on; if (on === atenuado) return; atenuado = on; if (!E) return; const t = ac.currentTime;
  E.duck.gain.setTargetAtTime(on ? 0.5 : 1, t, 0.15); E.duckF.frequency.setTargetAtTime(on ? 1400 : 18000, t, 0.15);
  E.zumbido(E.humN, t, on || !pref.sfx);
};
A.rebobinado = function () {
  if (!E || ac.state !== 'running') return; const t = ac.currentTime;
  // la música vuelve en el siguiente tiempo del compás, tras al menos 150 ms de silencio
  const desde = t + 0.9; let s = E.step, tt = E.nextT; while (tt < desde || s % 6 !== 0) { s++; tt += STEP; }
  E.rebobinado(t, tt); E.tension = false; E.tensionPad(false, t);
};
A.victoria = function () { if (!E || ac.state !== 'running') return; const t = ac.currentTime + 0.02; if (pref.sfx) E.victoria(t); else E.silenciarCapas(t, 0.25); E.tension = false; tensionQ = false; E.tensionPad(false, t); setTimeout(() => { if (E.tema === 'juego') { E.post = true; E.aplicarCapas(ac.currentTime, BAR); } }, 3600); };
A.finCapitulo = function (abre) { A.tema(null); if (!E || ac.state !== 'running') return; E.estrofa(ac.currentTime + (abre ? 2.4 : 0.4), 'capitulo'); };
A.final = function () {
  A.tema(null); if (!E || ac.state !== 'running') return;
  const d = E.estrofa(ac.currentTime + 0.3, 'final'); const mio = token; finalT = Date.now();
  // terminada la pieza, vuelve «Órbita lenta» desde la intro para los créditos
  setTimeout(() => { if (mio === token && temaQuerido === null && finalT) { posGuardada.menu = 0; posGuardada.menuLargo = 0; A.tema('menu'); } }, (d + 0.6) * 1000);
};

A.sfx = function (n, o = {}) {
  if (n === 'final') { A.final(); return; }
  if (!ac || !E || !pref.sfx || ac.state === 'closed') return;
  E.sfx(n, o, ac.currentTime + 0.005);
};
A.cancelarCarga = () => { if (E) E.cancelarCarga(ac.currentTime); };
A.zumbido = function (n) { if (!E) return; E.zumbido(n, ac.currentTime, !pref.sfx || atenuado); };
A.motor = function (on) { if (!E) return; E.motor(on && pref.sfx, ac.currentTime); };
A.parar = () => { if (!E) return; E.zumbido(0, ac.currentTime, true); E.motor(false, ac.currentTime); };

// diagnóstico para pruebas: estado del motor y nivel real de salida en dBFS (RMS y pico de los últimos ~46 ms)
A.diag = function () {
  if (!E) return { estado: A.estado() };
  const b = new Float32Array(E.medidor.fftSize); E.medidor.getFloatTimeDomainData(b); let s = 0, p = 0; for (const x of b) { s += x * x; p = Math.max(p, Math.abs(x)); }
  const db = (v) => +(20 * Math.log10(v + 1e-9)).toFixed(1);
  const F = E.forma, bar = Math.floor(E.step / SPB);
  return { estado: ac.state, tema: E.tema, querido: temaQuerido, seccion: E.tema ? F[bar % F.length].sec : null, compas: bar, capas: E.capas, cap: E.cap, kofs: E.kofs, post: E.post, tension: E.tension, atenuado,
    capasObj: Object.fromEntries(Object.entries(E.obj).filter(([, v]) => v > 0)), musVol: +E.musVol.gain.value.toFixed(3), sfxVol: +E.sfxVol.gain.value.toFixed(3), duck: +E.duck.gain.value.toFixed(2), rms: db(Math.sqrt(s / b.length)), pico: db(p) };
};

// ───────────────────────── muestra para escuchar (WAV) ─────────────────────────
// Renderiza sin tiempo real: «Bucle» con las copias entrando una a una, un rebobinado, la tensión final y la victoria.
// tipo 'juego' (≈ 38 s) o 'menu' (desde A, ≈ 40 s). Devuelve { sr, L, R, pico, rms }.
A.muestra = async function (tipo = 'juego', seg = 38, op = {}) {
  const sr = 44100, oc = new OfflineAudioContext(2, Math.ceil(sr * seg), sr), X = motor(oc);
  X.musVol.gain.value = op.mus === 0 ? 0 : 0.7 * 0.7 * MUS_G; X.sfxVol.gain.value = op.sfx === 0 ? 0 : 0.85 * 0.85 * SFX_G;
  const t0 = 0.05; X.temaG.gain.value = TEMA_G[tipo] || 1;
  if (tipo === 'efectos') {
    // todos los efectos, uno por segundo, para medirlos
    const N = ['paso', 'esperar', 'rechazo', 'empujaPuerta', 'puertaAbre', 'puertaCierra', 'placaOn', 'placaOff', 'caja', 'cajaCarga', 'laserOff', 'laserOn', 'desvanece', 'carga', 'rebobinar', 'ecoNuevo', 'estrella', 'record', 'ui', 'toggle', 'capitulo', 'diario'];
    N.forEach((n, i) => X.sfx(n, { k: 2, i: 2 }, t0 + i * 1.5));
    X.victoria(t0 + N.length * 1.5);
  } else if (tipo === 'menu') {
    X.tema = 'menu'; X.forma = FORMAS.menu; X.step = 8 * SPB - 2 * SPB; // dos compases de intro y entra A
    for (let t = t0; t < seg - 0.3; t += STEP) { X.paso(X.step, t); X.step++; }
    X.silenciarCapas(seg - 3, 0.6);
  } else {
    X.tema = 'juego'; X.forma = FORMAS.juego; X.cap = 1; X.kofs = 0; X.capas = 1; X.step = 0;
    const plan = { 2: 2, 4: 3, 7: 4 }; // compás → copias
    const acc = [[0.4, 'paso'], [1.1, 'paso'], [1.8, 'esperar'], [2.5, 'placaOn'], [2.6, 'puertaAbre'], [3.6, 'paso'], [4.3, 'caja'], [5.0, 'rechazo'], [5.7, 'paso']];
    let rebobinoEn = null;
    for (let s = 0, t = t0; t < 34.2; s++, t += STEP) {
      const bar = Math.floor(s / SPB), inBar = s % SPB;
      if (inBar === 0 && plan[bar]) { X.capas = plan[bar]; X.capasPend = true; }
      // un rebobinado a mitad del compás 6 (la música se apaga y vuelve en tiempo fuerte)
      if (bar === 6 && inBar === 6) { X.sfx('rebobinar', {}, t); let s2 = s, t2 = t; while (t2 < t + 0.9 || s2 % 6 !== 0) { s2++; t2 += STEP; } X.rebobinado(t, t2); rebobinoEn = t; }
      if (bar === 6 && inBar === 18) { X.sfx('ecoNuevo', { k: 2 }, t + 0.4); }
      if (bar === 11 && inBar === 0) { X.tension = true; X.tensionPad(true, t); }
      X.paso(s, t);
      X.step = s;
    }
    for (let c = 0; c < 4; c++) for (const [dt, n] of acc) X.sfx(n, { pan: Math.sin(dt * 3) * 0.5, eco: c > 0 && n === 'paso' }, t0 + c * BAR * 2.5 + dt * 0.9 + (c ? 0.2 : 0));
    X.sfx('ecoNuevo', { k: 0 }, t0 + 2 * BAR - 0.4); X.sfx('ecoNuevo', { k: 1 }, t0 + 4 * BAR - 0.4);
    X.sfx('desvanece', { pan: 0.3 }, t0 + 9.3 * BAR); X.sfx('cajaCarga', {}, t0 + 8.2 * BAR); X.sfx('laserOff', {}, t0 + 8.6 * BAR); X.sfx('puertaAbre', {}, t0 + 11.7 * BAR);
    X.victoria(34.3);
    void rebobinoEn;
  }
  const buf = await oc.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  let pico = 0, sum = 0; for (let i = 0; i < L.length; i++) { const a = Math.abs(L[i]), b = Math.abs(R[i]); if (a > pico) pico = a; if (b > pico) pico = b; sum += L[i] * L[i] + R[i] * R[i]; }
  return { sr, L, R, pico, rms: Math.sqrt(sum / (2 * L.length)) };
};

export const AUDIO = A;
