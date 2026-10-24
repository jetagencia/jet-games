/* JET//Balizas · música y efectos originales, sintetizados en el navegador (Web Audio, sin samples).
   Tonalidad: Si dórico (Si Do# Re Mi Fa# Sol# La). La sexta mayor (Sol#) es la luz dentro de la penumbra.
   Leitmotiv de baliza: Fa#5 → Si5 → La5.
   · «Faro»       (menú)      3/4, 78 BPM, 64 compases ≈ 148 s: Intro 8 · A 16 · B 16 · Puente 8 · A' 16.
   · «Paso Norte» (vuelo)     4/4, 92 BPM, 64 compases ≈ 167 s: Intro 8 · A 16 · A' 16 · B 16 · Puente 8,
                              en 4 capas por intensidad (Niebla, Rumbo, Riesgo, Final) con fundidos de 2 compases.
   · «Llegada»    (resultado) 3/4, 72 BPM, 48 compases = 120 s, el tema del menú llevado a Re mayor.
   Cada vuelta de un tema cambia detalles (arpegio, platillos, sonar, adornos) con un generador de la sesión.
   Mezcla: música 7 dB por debajo de los efectos → compresor (−14 dB, 3:1) → limitador (−2 dB) → recorte suave.
   API usada por main.js: init, apply, play, stop, setIntensity, suspend, resume, duck, sfxPlay, loop, loopsOff,
   y las propiedades mus, sfx, musOn, sfxOn, ion, hullLow, final2. Para pruebas: meter, stats, renderOffline, wav. */
(function () {
'use strict';

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const DB7 = Math.pow(10, -7 / 20);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- escala de Si dórico y desplazamiento diatónico ---------- */
const SCALE = [1, 2, 4, 6, 8, 9, 11]; // Do# Re Mi Fa# Sol# La Si
function dshift(m, k) { // mueve una nota k grados dentro de Si dórico
  const pc = ((m % 12) + 12) % 12, oct = Math.floor(m / 12); let i = SCALE.indexOf(pc); if (i < 0) return m + k * 2;
  let j = i + k, o = oct; while (j >= 7) { j -= 7; o++; } while (j < 0) { j += 7; o--; } return o * 12 + SCALE[j];
}

/* ---------- acordes: [bajo, voces del pad] ---------- */
const CH = {
  Bm9: [35, [62, 66, 69, 73]], Bsus2: [35, [61, 66, 71, 73]],
  E9: [40, [56, 59, 64, 66]], Esus2: [40, [59, 64, 66, 71]], EG: [44, [59, 64, 66, 71]],
  A9: [33, [57, 61, 64, 71]], Fm7: [42, [57, 61, 64, 66]], Fsus: [42, [59, 61, 66, 71]],
  D7: [38, [57, 62, 66, 73]], D9: [38, [61, 64, 66, 69]], Cm7: [37, [56, 59, 64, 68]], Gh7: [44, [59, 62, 66, 68]]
};

/* ---------- partituras (en semicorcheas: [inicio, nota MIDI, duración]) ---------- */
// «Faro», sección A (16 compases de 3/4 = 12 semicorcheas)
const FARO_A = [
  [[0, 78, 4], [4, 83, 4], [8, 81, 4]], [[0, 80, 4], [4, 78, 4], [8, 76, 4]], [[0, 74, 6], [6, 76, 2], [8, 78, 4]], [[0, 73, 12]],
  [[0, 78, 4], [4, 83, 4], [8, 85, 4]], [[0, 86, 6], [6, 85, 2], [8, 83, 4]], [[0, 81, 4], [4, 80, 4], [8, 76, 4]], [[0, 78, 12]],
  [[0, 71, 4], [4, 74, 4], [8, 78, 4]], [[0, 81, 8], [8, 80, 4]], [[0, 78, 4], [4, 76, 4], [8, 74, 4]], [[0, 76, 12]],
  [[0, 78, 4], [4, 83, 4], [8, 81, 4]], [[0, 80, 6], [6, 81, 2], [8, 83, 4]], [[0, 85, 4], [4, 81, 4], [8, 78, 4]], [[0, 83, 12]]];
const FARO_A_CH = ['Bm9', 'Bm9', 'E9', 'A9', 'Bm9', 'Bm9', 'E9', 'Fm7', 'D7', 'D7', 'Bm9', 'E9', 'Bm9', 'E9', 'Fm7', 'Bm9'];
// «Faro», sección B: la armonía se abre hacia Re mayor
const FARO_B = [
  [[0, 81, 6], [6, 78, 2], [8, 81, 4]], [[0, 85, 8], [8, 83, 4]], [[0, 80, 12]], [[0, 83, 4], [4, 81, 4], [8, 80, 4]],
  [[0, 76, 6], [6, 80, 2], [8, 83, 4]], [[0, 85, 12]], [[0, 83, 4], [4, 78, 4], [8, 76, 4]], [[0, 78, 12]],
  [[0, 86, 6], [6, 85, 2], [8, 81, 4]], [[0, 88, 8], [8, 85, 4]], [[0, 83, 12]], [[0, 86, 4], [4, 85, 4], [8, 83, 4]],
  [[0, 80, 8], [8, 78, 4]], [[0, 76, 4], [4, 78, 4], [8, 80, 4]], [[0, 81, 6], [6, 80, 2], [8, 78, 4]], [[0, 78, 12]]];
const FARO_B_CH = ['D7', 'D7', 'E9', 'E9', 'Cm7', 'Cm7', 'Fsus', 'Fm7', 'D7', 'A9', 'EG', 'Bm9', 'Gh7', 'E9', 'Fsus', 'Fm7'];
const FARO_P_CH = ['Esus2', 'Bsus2', 'Esus2', 'Bsus2', 'D7', 'A9', 'Fsus', 'Fm7'];
// «Llegada»: la A del menú, una tercera arriba dentro de la escala, sobre Re mayor
const RES_A_CH = ['D9', 'D9', 'A9', 'E9', 'D9', 'Bm9', 'E9', 'A9', 'D7', 'D7', 'Bm9', 'E9', 'D9', 'E9', 'A9', 'D9'];

// «Paso Norte»: melodía de la capa Final
const PN_A = [
  [[0, 78, 4], [4, 83, 4], [8, 81, 8]], [[8, 78, 4], [12, 81, 4]], [[0, 80, 6], [6, 81, 2], [8, 83, 8]], [[0, 85, 8], [8, 83, 4], [12, 81, 4]],
  [[0, 80, 8], [8, 76, 8]], [[0, 78, 4], [4, 80, 4], [8, 81, 4], [12, 83, 4]], [[0, 85, 12], [12, 81, 4]], [[0, 78, 16]],
  [[0, 78, 4], [4, 83, 4], [8, 86, 8]], [[0, 85, 4], [4, 83, 4], [8, 81, 8]], [[0, 81, 4], [4, 85, 4], [8, 88, 8]], [[0, 86, 8], [8, 85, 8]],
  [[0, 83, 6], [6, 80, 2], [8, 76, 8]], [[0, 78, 4], [4, 80, 4], [8, 83, 8]], [[0, 81, 8], [8, 80, 4], [12, 78, 4]], [[0, 78, 16]]];
const PN_A_CH = ['Bm9', 'Bm9', 'A9', 'A9', 'E9', 'E9', 'Fm7', 'Fm7'];
const PN_A2 = [PN_A[0], PN_A[1], PN_A[2], PN_A[3],
  [[0, 81, 8], [8, 78, 8]], [[0, 85, 4], [4, 83, 4], [8, 81, 8]], [[0, 80, 4], [4, 83, 4], [8, 88, 8]], [[0, 83, 8], [8, 85, 4], [12, 83, 4]],
  PN_A[8], PN_A[9], PN_A[10], PN_A[11],
  [[0, 81, 6], [6, 78, 2], [8, 74, 8]], [[0, 76, 4], [4, 78, 4], [8, 81, 8]], [[0, 80, 16]], [[0, 78, 8], [8, 83, 8]]];
const PN_A2_CH = ['Bm9', 'Bm9', 'A9', 'A9', 'D7', 'D7', 'E9', 'Fsus'];
const PN_B = [
  [[0, 81, 8], [8, 78, 4], [12, 81, 4]], [[0, 85, 12], [12, 86, 4]], [[0, 83, 8], [8, 80, 8]], [[0, 76, 4], [4, 78, 4], [8, 80, 4], [12, 83, 4]],
  [[0, 80, 8], [8, 76, 4], [12, 73, 4]], [[0, 76, 16]], [[0, 78, 4], [4, 83, 4], [8, 85, 4], [12, 83, 4]], [[0, 81, 16]],
  [[0, 86, 8], [8, 85, 4], [12, 81, 4]], [[0, 78, 8], [8, 81, 8]], [[0, 83, 4], [4, 80, 4], [8, 76, 8]], [[0, 78, 4], [4, 80, 4], [8, 83, 4], [12, 85, 4]],
  [[0, 80, 12], [12, 76, 4]], [[0, 78, 8], [8, 74, 8]], [[0, 76, 4], [4, 78, 4], [8, 83, 8]], [[0, 81, 8], [8, 78, 8]]];
const PN_B_CH = ['D7', 'D7', 'E9', 'E9', 'Cm7', 'Cm7', 'Fsus', 'Fm7', 'D7', 'D7', 'E9', 'E9', 'Cm7', 'Gh7', 'Fsus', 'Fm7'];
const PN_I_CH = ['Bm9', 'Bm9', 'A9', 'A9', 'Bm9', 'Bm9', 'Fsus', 'Fm7'];
const PN_P_CH = ['Bm9', 'Esus2', 'Bm9', 'Esus2', 'D7', 'Esus2', 'Fsus', 'Fm7'];
const PN_P_MEL = [[[0, 78, 4], [4, 73, 4], [8, 74, 8]], null, [[0, 78, 4], [4, 73, 4], [8, 76, 8]], null, null, null, [[0, 71, 16]], null];
// Cerca de la Puerta: el motivo llega a Re mayor
const PN_F = [[[0, 81, 4], [4, 86, 4], [8, 85, 8]], [[0, 88, 8], [8, 85, 8]], [[0, 83, 8], [8, 80, 8]], [[0, 81, 4], [4, 85, 4], [8, 90, 8]]];
const PN_F_CH = ['D9', 'A9', 'E9', 'D9'];
const MOTIF = [78, 83, 81];

/* ================= motor ================= */
function Engine(ac, cfg) {
  const E = this; E.ac = ac; E.cfg = cfg; E.loops = {}; E.theme = null; E.stats = { notes: 0, late: 0, maxLag: 0, ticks: 0 };
  E.rnd = mulberry32((cfg.seed >>> 0) || 1);
  E.now = () => (E.offT != null ? E.offT : ac.currentTime);
  // buses
  E.out = ac.createGain(); E.out.gain.value = 0.92;
  E.comp = ac.createDynamicsCompressor(); E.comp.threshold.value = -14; E.comp.ratio.value = 3; E.comp.knee.value = 6; E.comp.attack.value = 0.008; E.comp.release.value = 0.22;
  E.lim = ac.createDynamicsCompressor(); E.lim.threshold.value = -2; E.lim.ratio.value = 20; E.lim.knee.value = 0; E.lim.attack.value = 0.001; E.lim.release.value = 0.09;
  E.clip = ac.createWaveShaper(); { const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1, a = Math.abs(x); c[i] = a < 0.85 ? x : Math.sign(x) * (0.85 + 0.13 * Math.tanh((a - 0.85) / 0.13)); } E.clip.curve = c; E.clip.oversample = '2x'; }
  E.out.connect(E.comp); E.comp.connect(E.lim); E.lim.connect(E.clip); E.clip.connect(ac.destination);
  E.musBus = ac.createGain(); E.musBus.gain.value = 0;
  E.musLP = ac.createBiquadFilter(); E.musLP.type = 'lowpass'; E.musLP.frequency.value = 18000; E.musLP.Q.value = 0.5;
  E.duckG = ac.createGain(); E.musBus.connect(E.musLP); E.musLP.connect(E.duckG); E.duckG.connect(E.out);
  E.sfxBus = ac.createGain(); E.sfxBus.gain.value = 0; E.sfxBus.connect(E.out);
  // reverberación por convolución generada: una sala grande y oscura (música) y otra más corta (efectos)
  const mkIR = (sec, decay, damp) => { const len = Math.floor(ac.sampleRate * sec), ir = ac.createBuffer(2, len, ac.sampleRate), r = mulberry32(77 + Math.floor(sec * 10));
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { const k = i / len, e = Math.pow(1 - k, decay), dm = damp + (0.96 - damp) * k; lp = lp * dm + (r() * 2 - 1) * (1 - dm); d[i] = lp * e * (i < 90 ? i / 90 : 1) * 2.2; } } return ir; };
  E.rev = ac.createConvolver(); E.rev.buffer = mkIR(3.4, 2.4, 0.55); E.revIn = ac.createGain(); E.revIn.gain.value = 0.6; E.revIn.connect(E.rev); E.rev.connect(E.musBus);
  E.sRev = ac.createConvolver(); E.sRev.buffer = mkIR(1.8, 3, 0.45); E.sRevIn = ac.createGain(); E.sRevIn.gain.value = 0.4; E.sRevIn.connect(E.sRev); E.sRev.connect(E.sfxBus);
  // eco del sonar y de la voz principal (se reafina al tempo de cada tema)
  E.dly = ac.createDelay(2); E.dlyFb = ac.createGain(); E.dlyFb.gain.value = 0.36; E.dlyLP = ac.createBiquadFilter(); E.dlyLP.type = 'lowpass'; E.dlyLP.frequency.value = 2600;
  E.dly.connect(E.dlyLP); E.dlyLP.connect(E.dlyFb); E.dlyFb.connect(E.dly); E.dlyLP.connect(E.revIn); E.dlyLP.connect(E.musBus);
  // ruido blanco y rosa compartidos
  const nr = mulberry32(9), nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = nr() * 2 - 1; E.noise = nb;
  const pb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), pd = pb.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < pd.length; i++) { const w = nr() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526; pd[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; } E.pink = pb;
  E.sat = new Float32Array(256); for (let i = 0; i < 256; i++) E.sat[i] = Math.tanh((i / 128 - 1) * 1.8);
  // un bus por tema (para fundir al cambiar) y las 4 capas del tema de vuelo
  E.themeBus = {}; ['faro', 'juego', 'resultado'].forEach(k => { const g = ac.createGain(); g.gain.value = 0; g.connect(E.musBus); E.themeBus[k] = g; });
  E.lay = [0, 1, 2, 3].map(i => { const g = ac.createGain(); g.gain.value = i === 0 ? 1 : 0; g.connect(E.themeBus.juego); return g; });
  E.target = [1, 0, 0, 0]; E.layUntil = [1e9, 0, 0, 0];
}
const P = Engine.prototype;

P.apply = function () {
  const c = this.cfg, t = this.now();
  this.musBus.gain.setTargetAtTime(c.musOn ? c.mus * DB7 * 1.4 : 0, t, 0.08);
  this.sfxBus.gain.setTargetAtTime(c.sfxOn ? c.sfx : 0, t, 0.05);
};
P.duck = function (on) { const t = this.now(); this.duckG.gain.setTargetAtTime(on ? 0.5 : 1, t, on ? 0.12 : 0.3); this.ducked = !!on; };

/* ---------- instrumentos ---------- */
P.vca = function (dest, t, a, peak, d, sus, end, r) { // envolvente ADSR sobre un gain nuevo
  const g = this.ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(sus, t + a, d); g.gain.setTargetAtTime(0.0001, Math.max(end, t + a + 0.01), r); g.connect(dest); return g;
};
P.osc = function (type, f, t, end, dest, det) { const o = this.ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (det) o.detune.setValueAtTime(det, t); o.connect(dest); o.start(t); o.stop(end); this.stats.notes++; return o; };
// pad de dos sierras desafinadas ±6 cents tras paso bajo; bend = medio tono abajo (casco bajo)
P.pad = function (dest, t, notes, dur, vol, cut, bend) {
  const ac = this.ac, f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(cut * 0.7, t); f.frequency.linearRampToValueAtTime(cut, t + dur * 0.5); f.Q.value = 0.6;
  const g = this.vca(this.revIn, t, Math.min(1.6, dur * 0.3), vol, 0.8, vol * 0.85, t + dur * 0.92, dur * 0.18); f.connect(g); g.connect(dest);
  for (const m of notes) for (const c of [-6, 6]) { const o = this.osc('sawtooth', mtof(m), t, t + dur * 1.5, f, c); if (bend) { o.detune.setTargetAtTime(c - 100, t + dur * 0.15, 0.25); o.detune.setTargetAtTime(c, t + dur * 0.8, 0.2); } }
};
P.sub = function (dest, t, m, dur, vol) { const g = this.vca(dest, t, 0.35, vol, 0.6, vol * 0.8, t + dur, 0.35); this.osc('sine', mtof(m), t, t + dur + 1.6, g); };
// voz principal del menú: «ondas», seno cantado con portamento y vibrato retardado
P.ondas = function (dest, t, m, dur, vol, prev) {
  const ac = this.ac, fr = mtof(m), g = this.vca(dest, t, 0.06, vol, 0.3, vol * 0.78, t + dur * 0.95, 0.16);
  g.connect(this.revIn); g.connect(this.dly);
  const o1 = this.osc('sine', fr, t, t + dur + 1.2, g), tg = ac.createGain(); tg.gain.value = 0.22; tg.connect(g); const o2 = this.osc('triangle', fr, t, t + dur + 1.2, tg);
  if (prev && Math.abs(prev - m) <= 7) { [o1, o2].forEach(o => { o.frequency.setValueAtTime(mtof(prev), t); o.frequency.exponentialRampToValueAtTime(fr, t + 0.075); }); }
  const v = ac.createOscillator(), vg = ac.createGain(); v.frequency.value = 5.3; vg.gain.setValueAtTime(0, t); vg.gain.setValueAtTime(0, t + 0.28); vg.gain.linearRampToValueAtTime(fr * 0.0055, t + 0.7); v.connect(vg); vg.connect(o1.frequency); vg.connect(o2.frequency); v.start(t); v.stop(t + dur + 1.2);
};
// vidrio: parciales de barra (1 · 2,76 · 5,4 · 8,93), golpe limpio y cola larga
P.glass = function (dest, t, m, dur, vol, wet) {
  const fr = mtof(m), parts = [[1, 1, Math.max(1.2, dur * 1.4)], [2.76, 0.32, 0.55], [5.4, 0.12, 0.28], [8.93, 0.05, 0.14]];
  const ac = this.ac, g = ac.createGain(); g.gain.value = 1; g.connect(dest); if (wet !== false) { g.connect(this.revIn); g.connect(this.dly); }
  for (const [r, a, d] of parts) { if (fr * r > 16000) continue; const pg = ac.createGain(); pg.gain.setValueAtTime(0.0001, t); pg.gain.linearRampToValueAtTime(vol * a, t + 0.004); pg.gain.exponentialRampToValueAtTime(0.0001, t + d); pg.connect(g); this.osc('sine', fr * r, t, t + d + 0.05, pg); }
};
// caja de música giratoria (el haz del faro): seno + armónico dos octavas arriba que se apaga rápido
P.celesta = function (dest, t, m, vol) {
  const ac = this.ac, fr = mtof(m), g = ac.createGain(); g.connect(dest); g.connect(this.revIn);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1); this.osc('sine', fr, t, t + 1.15, g);
  const h = ac.createGain(); h.gain.setValueAtTime(vol * 0.35, t); h.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); h.connect(g); this.osc('sine', fr * 4, t, t + 0.2, h);
};
// chelo sintético para contracantos graves
P.cello = function (dest, t, m, dur, vol) {
  const ac = this.ac, f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 950; f.Q.value = 1.1;
  const g = this.vca(dest, t, 0.32, vol, 0.5, vol * 0.85, t + dur * 0.92, 0.3); f.connect(g); g.connect(this.revIn);
  const v = ac.createOscillator(), vg = ac.createGain(); v.frequency.value = 4.8; vg.gain.value = 7; v.connect(vg); v.start(t); v.stop(t + dur + 1.5);
  for (const c of [-4, 4]) { const o = this.osc('sawtooth', mtof(m), t, t + dur + 1.5, f, c); vg.connect(o.detune); }
};
// sirena de niebla del faro: quinta grave que se hincha
P.horn = function (dest, t, root, dur, vol) {
  const ac = this.ac, f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2.2; f.frequency.setValueAtTime(160, t); f.frequency.linearRampToValueAtTime(460, t + 0.9); f.frequency.setTargetAtTime(260, t + 1, 0.8);
  const g = this.vca(dest, t, 0.9, vol, 1.2, vol * 0.7, t + dur, 0.9); f.connect(g); g.connect(this.revIn);
  for (const [m, c] of [[root, -5], [root + 7, 5], [root + 12, 0]]) { const o = this.osc('sawtooth', mtof(m), t, t + dur + 4, f, c - 35); o.detune.linearRampToValueAtTime(c, t + 0.6); }
};
// ping del sonar con eco
P.sonar = function (dest, t, m, vol) { const g = this.ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1); g.connect(dest); g.connect(this.dly); g.connect(this.revIn); this.osc('sine', mtof(m), t, t + 1.2, g); };
// el haz del faro que barre de izquierda a derecha: ruido en banda con paneo
P.beam = function (dest, t, dur, vol) {
  const ac = this.ac, n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = this.noise; n.loop = true;
  f.type = 'bandpass'; f.Q.value = 2.5; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(2400, t + dur * 0.5); f.frequency.exponentialRampToValueAtTime(500, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f); f.connect(g);
  if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.setValueAtTime(-0.8, t); p.pan.linearRampToValueAtTime(0.8, t + dur); g.connect(p); p.connect(dest); p.connect(this.revIn); } else { g.connect(dest); }
  n.start(t, (t * 7.31) % 1.5); n.stop(t + dur + 0.05); this.stats.notes++;
};
P.pluck = function (dest, t, m, dur, vol, type, cut, att) {
  const ac = this.ac, f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.frequency.setValueAtTime(cut || 2400, t); f.frequency.exponentialRampToValueAtTime(320, t + dur);
  f.connect(g); g.connect(dest); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + (att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); this.osc(type || 'triangle', mtof(m), t, t + dur + 0.05, f);
};
P.bass = function (dest, t, m, dur, vol) {
  const ac = this.ac, ws = ac.createWaveShaper(), g = ac.createGain(), f = ac.createBiquadFilter(); ws.curve = this.sat; f.type = 'lowpass'; f.frequency.setValueAtTime(1300, t); f.frequency.exponentialRampToValueAtTime(380, t + dur);
  ws.connect(f); f.connect(g); g.connect(dest); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(vol * 0.45, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  this.osc('triangle', mtof(m), t, t + dur + 0.05, ws);
};
P.noiseHit = function (dest, t, dur, vol, type, freq, q, buf) {
  const ac = this.ac, n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = buf || this.noise; f.type = type; f.frequency.value = freq; f.Q.value = q || 0.8;
  if (dur > 0.35) n.loop = true; n.connect(f); f.connect(g); g.connect(dest); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.start(t, (t * 13.7) % 1.6); n.stop(t + dur + 0.05); this.stats.notes++; return f;
};
P.kick = function (dest, t, vol) { const g = this.ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32); g.connect(dest); const o = this.osc('sine', 130, t, t + 0.35, g); o.frequency.exponentialRampToValueAtTime(44, t + 0.16); this.noiseHit(dest, t, 0.012, vol * 0.25, 'highpass', 2500); };
P.rim = function (dest, t, vol) { this.noiseHit(dest, t, 0.07, vol, 'bandpass', 1900, 1.4); const g = this.ac.createGain(); g.gain.setValueAtTime(vol * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); g.connect(dest); g.connect(this.revIn); this.osc('triangle', mtof(80), t, t + 0.06, g); };
P.trem = function (dest, t, notes, dur, vol) {
  const ac = this.ac, g = ac.createGain(), am = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 3000;
  lfo.frequency.value = 9.2; lg.gain.value = 0.5; am.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain); f.connect(am); am.connect(g); g.connect(dest); g.connect(this.revIn);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  for (const m of notes) this.osc('sawtooth', mtof(m), t, t + dur + 0.1, f); lfo.start(t); lfo.stop(t + dur + 0.1);
};

/* ---------- secuenciador ---------- */
const THEMES = {
  faro: { bpm: 78, beats: 3, bars: 64 },
  juego: { bpm: 92, beats: 4, bars: 64 },
  resultado: { bpm: 72, beats: 3, bars: 48 }
};
P.play = function (name) {
  if (this.theme === name) return;
  const t = this.now(), old = this.theme;
  if (old) { const g = this.themeBus[old]; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.setTargetAtTime(0, t, 0.35); }
  this.theme = name; if (!name) return;
  const T = THEMES[name], g = this.themeBus[name]; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.setTargetAtTime(1, t + 0.05, name === 'resultado' ? 0.15 : 0.5);
  this.bar = 0; this.step = 0; this.lap = 0; this.prevLead = 0; this.padUntil = 0; this.sd = 60 / T.bpm / 4; this.spb = T.beats * 4; this.next = t + 0.12;
  this.dly.delayTime.setValueAtTime(this.sd * 6, t); // eco de tres corcheas
  this.newLap();
  if (name === 'juego') { this.target = [1, 0, 0, 0]; this.layUntil = [1e9, 0, 0, 0]; this.lay.forEach((l, i) => { l.gain.cancelScheduledValues(t); l.gain.setValueAtTime(i === 0 ? 1 : 0.0001, t); }); this.fin = 0; }
};
P.newLap = function () { // variación por vuelta, elegida con el generador de la sesión
  const r = this.rnd; this.v = { arp: Math.floor(r() * 3), inv: Math.floor(r() * 4), oct: r() < 0.5 ? 0 : 12, hat: Math.floor(r() * 4), sonar: [90, 95, 85][Math.floor(r() * 3)], orn: r() < 0.6, kick2: r() < 0.5, celPat: Math.floor(r() * 3), leadUp: r() < 0.5 };
};
P.setIntensity = function (arr) {
  const t = this.now(), bar = this.sd * this.spb || 2.6;
  for (let i = 1; i < 4; i++) { const on = arr[i] ? 1 : 0; if (on !== this.target[i]) { this.target[i] = on; this.lay[i].gain.setTargetAtTime(on ? 1 : 0.0001, t, bar * 0.66); } if (on) this.layUntil[i] = t + bar * 3; }
};
P.tick = function () {
  if (!this.theme) return; const ac = this.ac, now = this.now(); if (this.offT == null && ac.state !== 'running') return;
  this.stats.ticks++;
  const ion = this.cfg.ion ? 1 : 0; if (ion !== this._ion) { this._ion = ion; this.musLP.frequency.setTargetAtTime(ion ? 900 : 18000, now, 0.2); }
  if (this.next < now) { const lag = now - this.next; this.stats.late++; this.stats.maxLag = Math.max(this.stats.maxLag, lag); while (this.next < now + 0.02) this.adv(); }
  while (this.next < now + 0.3) { this.sched(this.next); this.adv(); }
  // chispas de la nube iónica dentro de la ventana de programación
  const L = this.loops.ion; if (L && L.lv > 0.05 && this.cfg.sfxOn) { if (!L.nt || L.nt < now) L.nt = now; while (L.nt < now + 0.3) { this.noiseHit(L.g, L.nt, 0.012 + this.rnd() * 0.025, 0.25 + 0.6 * this.rnd(), 'highpass', 4000 + this.rnd() * 4000, 1.5); L.nt += 0.03 + this.rnd() * 0.12; } }
  // apagar los bucles que llevan un rato en silencio
  for (const k in this.loops) { const l = this.loops[k]; if (l.lv <= 0.001 && l.off && now - l.off > 4) { (l.src || []).forEach(s => { try { s.stop(); } catch (e) {} }); try { l.g.disconnect(); } catch (e) {} delete this.loops[k]; } }
};
P.adv = function () { this.next += this.sd; this.step++; if (this.step >= this.spb) { this.step = 0; this.bar++; const T = THEMES[this.theme]; if (this.bar % T.bars === 0) { this.lap++; this.newLap(); } } };
P.sched = function (t) {
  if (this.theme === 'juego') return this.schedJuego(t);
  return this.schedFaro(t, this.theme === 'resultado');
};

// «Faro» y «Llegada» (3/4)
P.faroBar = function (bar, res) {
  const v = this.v;
  if (res) { // 48: A 16 · B 16 · A' 16
    const b = bar % 48;
    if (b < 16) return { ch: RES_A_CH[b], mel: FARO_A[b], sh: 2, lead: 'ondas', cel: 1 };
    if (b < 32) return { ch: FARO_B_CH[b - 16], mel: FARO_B[b - 16], sh: 0, lead: 'ondas', cel: 1, cello: 1 };
    return { ch: RES_A_CH[b - 32], mel: FARO_A[b - 32], sh: 2, lead: 'glass', cel: 1, cello: 1 };
  }
  const b = bar % 64;
  if (b < 8) return { ch: ['Bm9', 'Bm9', 'E9', 'A9'][b % 4], horn: b % 4 === 0, beam: b % 2 === 0, sonar: b % 2 === 1, cel: b >= 4 ? 0.5 : 0, padv: 0.034 + b * 0.002 };
  if (b < 24) return { ch: FARO_A_CH[b - 8], mel: FARO_A[b - 8], lead: 'ondas', cel: 1, beam: b % 4 === 0, sonar: b % 4 === 2 };
  if (b < 40) return { ch: FARO_B_CH[b - 24], mel: FARO_B[b - 24], lead: 'ondas', cel: 1, cello: 1, beam: b % 8 === 0 };
  if (b < 48) { const k = b - 40; return { ch: FARO_P_CH[k], horn: k === 0 || k === 4, beam: k % 2 === 0, sonar: true, bridge: 1, mel: k === 4 ? [[0, 90, 4], [4, 85, 4], [8, 86, 4]] : k === 6 ? [[0, 85, 12]] : null, lead: 'glass' }; }
  const k = b - 48; // A': la melodía sube al vidrio una octava arriba (primera mitad) y vuelve a la voz cantada
  return k < 8 ? { ch: FARO_A_CH[k], mel: FARO_A[k], lead: 'glass', up: 12, cel: 1, cello: 1, counter: 1 } : { ch: FARO_A_CH[k], mel: FARO_A[k], lead: 'ondas', cel: 1, cello: k >= 12 ? 1 : 0, sonar: k === 15 };
};
P.schedFaro = function (t, res) {
  const st = this.step, B = this.faroBar(this.bar, res), ch = CH[B.ch], g = this.themeBus[res ? 'resultado' : 'faro'], sd = this.sd, bar = sd * 12, v = this.v;
  if (st === 0) {
    if (!(this.padUntil > t + 0.01)) { const two = this.faroBar(this.bar + 1, res).ch === B.ch ? 2 : 1; this.pad(g, t, ch[1], bar * two * 1.02, B.padv || 0.03, B.bridge ? 800 : 1300); this.padUntil = t + bar * two; }
    this.sub(g, t, ch[0] + 12, bar * 0.95, 0.032);
    this.pluck(g, t, ch[0] + 24, bar * 0.9, 0.05, 'triangle', 900, 0.015);
    if (B.horn) this.horn(g, t, 35, bar * 1.6, 0.05);
    if (B.beam) this.beam(g, t + sd * 2, bar * 1.6, 0.018);
    if (B.sonar) this.sonar(g, t + sd * 4, v.sonar, 0.03);
    if (B.cello) this.cello(g, t, ch[1][this.bar % 2] - 12, bar * 0.95, 0.03);
    if (B.counter) this.ondas(g, t, ch[1][2] + 12, bar * 0.95, 0.028, 0);
  }
  // caja de música en giro: seis corcheas sobre las voces del acorde
  if (B.cel && st % 2 === 0) { const pats = [[0, 1, 2, 3, 2, 1], [0, 2, 1, 3, 1, 2], [3, 2, 1, 0, 1, 2]], idx = pats[v.celPat][st / 2], m = ch[1][idx] + 12 + (res ? 12 : 0); this.celesta(g, t, m, 0.034 * B.cel * (st === 0 ? 1.25 : 1)); }
  if (B.mel) for (const n of B.mel) if (n[0] === st) {
    let m = n[1]; if (B.sh) m = dshift(m, B.sh); m += B.up || 0; const dur = sd * n[2];
    if (B.lead === 'glass') this.glass(g, t, m, dur, B.bridge ? 0.035 : 0.055);
    else { this.ondas(g, t, m, dur, 0.075, this.prevLead); if (v.orn && n[2] >= 12 && st === 0 && !res) this.glass(g, t + sd * 8, dshift(m, 2), sd * 4, 0.018); }
    this.prevLead = m;
  }
};

// «Paso Norte» (4/4, capas)
P.pnBar = function (bar) {
  const b = bar % 64;
  if (this.cfg.final2) { return { ch: PN_F_CH[bar % 4], mel: PN_F[bar % 4], sec: 'F' }; }
  if (b < 8) return { ch: PN_I_CH[b], sec: 'I', horn: b === 0 || b === 4 };
  if (b < 24) return { ch: PN_A_CH[(b - 8) % 8], mel: PN_A[b - 8], sec: 'A' };
  if (b < 40) return { ch: PN_A2_CH[(b - 24) % 8], mel: PN_A2[b - 24], sec: 'A2' };
  if (b < 56) return { ch: PN_B_CH[b - 40], mel: PN_B[b - 40], sec: 'B' };
  return { ch: PN_P_CH[b - 56], mel: PN_P_MEL[b - 56], sec: 'P', bridge: 1, horn: b === 56 };
};
P.schedJuego = function (t) {
  const st = this.step, bar = this.bar, B = this.pnBar(bar), ch = CH[B.ch], L = this.lay, sd = this.sd, barLen = sd * 16, v = this.v, c = this.cfg, now = this.now();
  const on = i => i === 0 || this.target[i] || this.layUntil[i] > now;
  // capa 0 «Niebla»: pad, pedal de Si en el sub, sonar cada 2 compases
  if (st === 0) {
    const bend = !!c.hullLow && bar % 4 === 0;
    if (!(this.padUntil > t + 0.01) || bend) { const two = !bend && this.pnBar(bar + 1).ch === B.ch ? 2 : 1; this.pad(L[0], t, ch[1], barLen * two * 1.02, 0.032, this.target[2] ? 2400 : 950, bend); this.padUntil = t + barLen * two; }
    if (bar % 2 === 0) this.sub(L[0], t, B.sec === 'F' ? 38 : 35, barLen * 1.95, 0.03);
    if (bar % 2 === 0) this.sonar(L[0], t + sd * 2, B.sec === 'A2' ? 85 : v.sonar, 0.03);
    if (B.horn) this.horn(L[0], t, 35, barLen * 1.4, 0.045);
  }
  if (B.sec === 'I' && bar % 8 >= 4 && st % 4 === 2) this.celesta(L[0], t, ch[1][((st >> 2) + bar) % 4] + 12, 0.014);
  // capa 1 «Rumbo»: bajo pulsante y arpegio en semicorcheas
  if (on(1) && !B.bridge) {
    let hitB = false, dur = sd * 1.8, m = ch[0] + 12;
    if (B.sec === 'B') { hitB = st === 0 || st === 6 || st === 10; dur = sd * 3.6; }
    else { hitB = st % 2 === 0; if (st % 4 === 2 && B.sec !== 'I') m += 12; if (B.sec === 'A2' && st === 14) m = ch[0] + 19; }
    if (hitB && B.sec !== 'I') this.bass(L[1], t, m, dur, 0.1);
    const pats = [[0, 2, 1, 3], [0, 1, 2, 3, 2, 1], [3, 1, 2, 0]], pat = pats[(v.arp + (B.sec === 'A2' ? 1 : 0)) % 3], idx = (pat[st % pat.length] + v.inv) % 4;
    const am = ch[1][idx] + 12 + (st >= 8 && v.oct && B.sec !== 'I' ? 12 : 0);
    if (B.sec !== 'I' || st % 2 === 0) this.pluck(L[1], t, am, sd * 1.7, st % 4 === 0 ? 0.04 : 0.028, 'triangle', 3400);
  }
  // capa 2 «Riesgo»: bombo, aro afinado, platillo cerrado con acentos y trémolo Sol#–Re
  if (on(2) && !B.bridge) {
    if (st === 0 || st === 10 || (v.kick2 && st === 7)) this.kick(L[2], t, 0.26);
    if (st === 4 || st === 12) this.rim(L[2], t, 0.12);
    const hats = [[1, 0, .5, 0, .8, 0, .5, .3], [1, .3, .6, 0, 1, 0, .6, .4], [.8, 0, 1, 0, .8, .4, 1, 0], [1, .5, .5, .5, 1, .5, .5, 0]][v.hat], acc = hats[st % 8] * (((bar * 5 + st * 3 + this.lap) % 7) === 0 ? 1.6 : 1);
    if (acc > 0) this.noiseHit(L[2], t, st % 8 === 6 && v.hat === 2 ? 0.09 : 0.03, 0.035 * acc, 'highpass', 7600);
    if (st === 0 && bar % 2 === 0) this.trem(L[2], t, [68, 74], barLen * 2, 0.022);
  }
  // capa 3 «Final»: la melodía en vidrio, doblada por la voz cantada
  if (B.bridge && B.mel) { for (const n of B.mel) if (n[0] === st) this.glass(L[0], t, n[1], sd * n[2], 0.035); }
  else if (on(3) && B.mel) for (const n of B.mel) if (n[0] === st) { const d = sd * n[2]; this.glass(L[3], t, n[1], d, 0.06); this.ondas(L[3], t, n[1] - 12, d, 0.03, this.prevLead ? this.prevLead - 12 : 0); this.prevLead = n[1]; }
};

/* ---------- efectos (todos afinados a Si dórico cuando tienen altura) ---------- */
const BEACON_NOTES = { flecha: [78, 83], atajo: [83, 85], tesoro: [76, 80], peligro: [74, 80], noporaqui: [83, 82] };
P.dest = function (pan, rev) {
  const ac = this.ac, g = ac.createGain();
  if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = clamp(pan || 0, -0.7, 0.7); g.connect(p); p.connect(this.sfxBus); if (rev) p.connect(this.sRevIn); }
  else { g.connect(this.sfxBus); if (rev) g.connect(this.sRevIn); }
  return g;
};
P.tone = function (t, m, dur, vol, type, pan, rev, glide, att) {
  const o = this.ac.createOscillator(), g = this.ac.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(mtof(m), t); if (glide) o.frequency.exponentialRampToValueAtTime(mtof(m + glide), t + dur);
  o.connect(g); g.connect(this.dest(pan, rev)); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + (att || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.start(t); o.stop(t + dur + 0.05); this.stats.notes++;
};
P.sglass = function (t, m, dur, vol, pan) { const d = this.dest(pan, 1); this.glass(d, t, m, dur, vol, false); };
P.sfx = function (id, o) {
  const c = this.cfg; if (!c.sfxOn) return; o = o || {}; const t = (o.at != null ? o.at : this.now()) + 0.005, pan = o.pan || 0, v = o.v == null ? 1 : clamp(o.v, 0, 1);
  switch (id) {
    case 'ui_tap': this.tone(t, 90, 0.04, 0.1, 'sine'); this.noiseHit(this.dest(0), t, 0.006, 0.05, 'highpass', 6000); break;
    case 'ui_back': this.tone(t, 85, 0.08, 0.09, 'sine', 0, 0, -2); break;
    case 'ui_toggle': this.tone(t, 90, 0.035, 0.09); this.tone(t + 0.055, 95, 0.045, 0.09); break;
    case 'ui_error': { const d = this.dest(0), f = this.ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100; f.connect(d); [[62, 0, 0.12], [61, 0.11, 0.18]].forEach(([m, dt, du]) => { const g = this.ac.createGain(); g.gain.setValueAtTime(0.0001, t + dt); g.gain.linearRampToValueAtTime(0.14, t + dt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + du); g.connect(f); this.osc('triangle', mtof(m), t + dt, t + dt + du + 0.05, g); }); break; }
    case 'brake': { const f = this.noiseHit(this.dest(pan), t, 0.38, 0.1 * v, 'highpass', 3200, 0.9, this.pink); f.frequency.exponentialRampToValueAtTime(700, t + 0.35); this.tone(t, 47, 0.12, 0.08 * v, 'sine', pan, 0, -5); break; }
    case 'scrape': for (let i = 0; i < 4; i++) this.noiseHit(this.dest(pan), t + i * 0.018 + this.rnd() * 0.01, 0.022, (0.05 + this.rnd() * 0.03) * (0.4 + v), 'bandpass', 3200 + this.rnd() * 2400, 6); break;
    case 'hit': {
      const d = this.dest(pan), g = this.ac.createGain(); g.gain.setValueAtTime(0.55 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38); g.connect(d); const o2 = this.osc('sine', 100, t, t + 0.4, g); o2.frequency.exponentialRampToValueAtTime(38, t + 0.3);
      // chapa: FM inarmónica (Si3 · 1,41) que se apaga rápido
      const car = this.ac.createOscillator(), mod = this.ac.createOscillator(), mg = this.ac.createGain(), cg = this.ac.createGain(), dr = this.dest(pan, 1); car.frequency.value = mtof(59); mod.frequency.value = mtof(59) * 1.41; mg.gain.setValueAtTime(mtof(59) * 3, t); mg.gain.exponentialRampToValueAtTime(20, t + 0.4); mod.connect(mg); mg.connect(car.frequency); car.connect(cg); cg.connect(dr); cg.gain.setValueAtTime(0.09 * v, t); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); car.start(t); mod.start(t); car.stop(t + 0.55); mod.stop(t + 0.55);
      this.noiseHit(d, t, 0.16, 0.22 * v, 'lowpass', 1500); break; }
    case 'hull_low': this.tone(t, 80, 0.09, 0.06, 'sine'); this.tone(t, 80, 0.09, 0.02, 'triangle'); this.tone(t + 0.15, 80, 0.09, 0.06, 'sine'); break;
    case 'mine_arm': { const seq = [78, 78, 80, 80, 81, 81, 83, 83]; seq.forEach((m, i) => { const k = i / seq.length, tt = t + (1 - Math.pow(1 - k, 1.7)) * 0.85; this.tone(tt, m, 0.045, 0.07, 'square', pan); }); break; }
    case 'mine_boom': {
      const f = this.noiseHit(this.dest(pan, 1), t, 1.1, 0.5, 'lowpass', 2400, 0.7); f.frequency.exponentialRampToValueAtTime(160, t + 0.9);
      const g = this.ac.createGain(), d = this.dest(pan); g.gain.setValueAtTime(0.65, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); g.connect(d); const o2 = this.osc('sine', 72, t, t + 0.95, g); o2.frequency.exponentialRampToValueAtTime(30, t + 0.7);
      for (let i = 0; i < 6; i++) this.noiseHit(this.dest(pan + (this.rnd() - 0.5) * 0.6, 1), t + 0.15 + this.rnd() * 0.6, 0.02, 0.06, 'highpass', 3000); break; }
    case 'rock_pass': { const ac = this.ac, n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = this.pink; f.type = 'bandpass'; f.Q.value = 1.6; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1300, t + 0.2); f.frequency.exponentialRampToValueAtTime(400, t + 0.45);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48); n.connect(f); f.connect(g);
      if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.setValueAtTime(clamp(pan - 0.3, -0.8, 0.8), t); p.pan.linearRampToValueAtTime(clamp(pan + 0.3, -0.8, 0.8), t + 0.45); g.connect(p); p.connect(this.sfxBus); } else g.connect(this.sfxBus);
      n.start(t, this.rnd()); n.stop(t + 0.5); break; }
    case 'beacon_seen': { const n = BEACON_NOTES[o.s] || [78, 83]; this.sglass(t, n[0], 0.35, 0.08, pan); this.sglass(t + 0.16, n[1], 0.6, 0.08, pan); break; }
    case 'beacon_radar': this.tone(t, 95, 0.22, 0.02, 'sine', pan, 1); break;
    case 'beacon_open': this.tone(t, 66, 0.2, 0.07, 'sine', 0, 1, 12); this.noiseHit(this.dest(0), t, 0.18, 0.025, 'bandpass', 2400, 3); break;
    case 'beacon_pick': { const n = BEACON_NOTES[o.s] || [78]; this.tone(t, n[0] + 12, 0.05, 0.07, 'triangle'); break; }
    case 'beacon_place': { this.noiseHit(this.dest(0), t, 0.16, 0.24, 'lowpass', 420); const g = this.ac.createGain(); g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); g.connect(this.dest(0)); const o2 = this.osc('sine', mtof(47), t, t + 0.32, g); o2.frequency.exponentialRampToValueAtTime(mtof(35), t + 0.25);
      MOTIF.forEach((m, i) => this.sglass(t + 0.08 + i * 0.13, m, i === 2 ? 0.9 : 0.35, 0.085, 0)); break; }
    case 'beacon_undo': [81, 83, 78].forEach((m, i) => this.tone(t + i * 0.09, m, 0.12, 0.065, 'triangle')); break;
    case 'buoy': [71, 74, 78, 85].forEach((m, i) => this.sglass(t + i * 0.06, m, 0.5, 0.055, pan)); break;
    case 'treasure': [71, 74, 78, 81, 85, 88].forEach((m, i) => { this.tone(t + i * 0.055, m, 0.28, 0.07, 'triangle', pan, 1); }); this.sglass(t + 0.33, 95, 0.8, 0.04, pan); break;
    case 'rescue': { this.tone(t, 81, 0.17, 0.08, 'square'); this.tone(t + 0.2, 78, 0.17, 0.08, 'square'); this.tone(t + 0.4, 81, 0.17, 0.06, 'square'); this.tone(t + 0.6, 78, 0.3, 0.05, 'square', 0, 0, -12);
      const g = this.ac.createGain(), d = this.dest(0); g.gain.setValueAtTime(0.0001, t + 0.3); g.gain.linearRampToValueAtTime(0.06, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6); g.connect(d); const f = this.ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.connect(g); const o2 = this.osc('sawtooth', mtof(47), t + 0.3, t + 1.7, f); o2.frequency.exponentialRampToValueAtTime(mtof(35), t + 1.6); break; }
    case 'countdown': this.tone(t, o.last ? 83 : 78, o.last ? 0.32 : 0.08, 0.11, 'sine', 0, 1); if (o.last) this.tone(t, 71, 0.32, 0.05, 'triangle', 0, 1); break;
    case 'gate': { const f = this.noiseHit(this.dest(0, 1), t, 1.3, 0.07, 'highpass', 1500, 0.7); f.frequency.exponentialRampToValueAtTime(7000, t + 1.1);
      [74, 78, 81, 85, 88].forEach((m, i) => this.sglass(t + i * 0.085, m, 1.1, 0.065, (i - 2) * 0.15)); [81, 86, 85].forEach((m, i) => this.sglass(t + 0.55 + i * 0.16, m + 12, i === 2 ? 1.2 : 0.4, 0.05, 0)); break; }
    case 'score_tick': this.tone(t, dshift(78, Math.min(9, o.i || 0)), 0.045, 0.055, 'triangle'); break;
    case 'vote_up': this.tone(t, 78, 0.1, 0.08, 'triangle'); this.tone(t + 0.09, 83, 0.16, 0.08, 'triangle', 0, 1); break;
    case 'vote_down': this.tone(t, 74, 0.1, 0.08, 'triangle'); this.tone(t + 0.09, 71, 0.16, 0.08, 'triangle', 0, 1); break;
    case 'rank_up': [78, 83, 81, 86, 90].forEach((m, i) => this.sglass(t + i * 0.17, m, i === 4 ? 1.4 : 0.5, 0.08, 0)); this.tone(t + 0.68, 59, 1.2, 0.05, 'triangle', 0, 1); break;
    case 'guided_tick': this.tone(t, 95, 0.03, 0.035, 'sine'); break;
    case 'crack': { this.noiseHit(this.dest(pan, 1), t, 0.5, 0.32, 'bandpass', 1200, 1.2); for (let i = 0; i < 5; i++) this.sglass(t + 0.04 + i * 0.03, [97, 92, 95, 90, 93][i], 0.25, 0.02, pan); this.tone(t, 73, 0.45, 0.07, 'triangle', pan, 1, -12); break; }
  }
};
// bucles continuos: motor, pozo, corriente, iones
P.loop = function (id, level, pan) {
  const ac = this.ac, t = this.now(); let L = this.loops[id];
  if (!L) {
    if (level <= 0.001) return;
    L = this.loops[id] = { g: ac.createGain(), lv: 0 }; L.g.gain.value = 0;
    let dest = L.g; if (ac.createStereoPanner) { L.p = ac.createStereoPanner(); L.g.connect(L.p); L.p.connect(this.sfxBus); } else L.g.connect(this.sfxBus);
    if (id === 'thrust') { // ruido rosa filtrado + sierra en Si1 + silbido de turbina en Fa#4 (para que se oiga en altavoces de teléfono)
      const n = ac.createBufferSource(); n.buffer = this.pink; n.loop = true; L.f = ac.createBiquadFilter(); L.f.type = 'lowpass'; L.f.frequency.value = 400; n.connect(L.f); L.f.connect(dest);
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(35); const of = ac.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 240; const og = ac.createGain(); og.gain.value = 0.2; o.connect(of); of.connect(og); og.connect(dest);
      L.w = ac.createOscillator(); L.w.type = 'sine'; L.w.frequency.value = mtof(66); L.wg = ac.createGain(); L.wg.gain.value = 0.02; L.w.connect(L.wg); L.wg.connect(dest);
      n.start(t); o.start(t); L.w.start(t); L.src = [n, o, L.w];
    } else if (id === 'well') { // dos senos casi iguales que baten, en Si1 y en Fa#3
      L.src = [[35, 0], [35, 14], [54, 0], [54, 9]].map(([m, c]) => { const o = ac.createOscillator(); o.frequency.value = mtof(m); o.detune.value = c; const g = ac.createGain(); g.gain.value = m > 40 ? 0.35 : 1; o.connect(g); g.connect(dest); o.start(t); return o; });
    } else if (id === 'current') {
      const n = ac.createBufferSource(); n.buffer = this.noise; n.loop = true; L.f = ac.createBiquadFilter(); L.f.type = 'bandpass'; L.f.frequency.value = 600; L.f.Q.value = 2;
      const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.35; lg.gain.value = 300; lfo.connect(lg); lg.connect(L.f.frequency); n.connect(L.f); L.f.connect(dest); n.start(t); lfo.start(t); L.src = [n, lfo];
    } else if (id === 'ion') { L.src = []; }
  }
  const was = L.lv; L.lv = level; if (level <= 0.001 && was > 0.001) L.off = t; if (level > 0.001) L.off = 0;
  const base = { thrust: 0.2, well: 0.11, current: 0.09, ion: 0.16 }[id] || 0.1;
  L.g.gain.setTargetAtTime(this.cfg.sfxOn ? level * base : 0, t, 0.06);
  if (L.p && pan != null) L.p.pan.setTargetAtTime(clamp(pan, -0.7, 0.7), t, 0.1);
  if (id === 'thrust' && L.f) { L.f.frequency.setTargetAtTime(300 + level * 1600, t, 0.08); L.w.frequency.setTargetAtTime(mtof(66) * (1 + level * 0.06), t, 0.2); }
};
P.loopsOff = function () { for (const k in this.loops) this.loop(k, 0); };

/* ================= fachada pública (window.BalAudio) ================= */
const cfg = { mus: 0.8, sfx: 0.9, musOn: true, sfxOn: true, ion: 0, hullLow: 0, final2: 0, seed: (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0 };
const A = { ok: false, ac: null, E: null, want: null, cfg };
window.BalAudio = A;
['mus', 'sfx', 'musOn', 'sfxOn', 'ion', 'hullLow', 'final2'].forEach(k => Object.defineProperty(A, k, { get: () => cfg[k], set: v => { cfg[k] = v; }, enumerable: true }));
Object.defineProperty(A, 'theme', { get: () => (A.E ? A.E.theme : null) });
Object.defineProperty(A, 'stats', { get: () => (A.E ? A.E.stats : null) });

A.init = function () {
  if (A.ac) { if (A.ac.state !== 'running' && !document.hidden) A.ac.resume().catch(() => {}); return true; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  try { A.ac = new AC({ latencyHint: 'interactive' }); } catch (e) { try { A.ac = new AC(); } catch (e2) { return false; } }
  try { A.E = new Engine(A.ac, cfg); } catch (e) { A.ac = null; return false; }
  // desbloqueo en iOS: un búfer mudo dentro del gesto
  try { const b = A.ac.createBuffer(1, 1, 22050), s = A.ac.createBufferSource(); s.buffer = b; s.connect(A.ac.destination); s.start(0); } catch (e) {}
  if (A.ac.state !== 'running') A.ac.resume().catch(() => {});
  A.ok = true; A.apply();
  if (A.want) { A.E.play(A.want); A.want = null; }
  A.timer = setInterval(A.tick, 40);
  return true;
};
A.tick = function () { if (A.E) try { A.E.tick(); } catch (e) {} };
A.apply = function () { if (A.E) A.E.apply(); };
A.play = function (name) { if (!A.E) { A.want = name; return; } A.E.play(name); A.tick(); };
A.stop = function () { if (A.E) A.E.play(null); else A.want = null; };
A.setIntensity = function (arr) { if (A.E) A.E.setIntensity(arr); };
A.duck = function (on) { if (A.E) A.E.duck(on); };
A.suspend = function () { if (A.ac && A.ac.state === 'running') A.ac.suspend().catch(() => {}); };
A.resume = function () { if (A.ac && A.ac.state !== 'running' && A.ac.state !== 'closed') A.ac.resume().catch(() => {}); };
A.sfxPlay = function (id, o) { if (!A.E || A.ac.state !== 'running') return; try { A.E.sfx(id, o); } catch (e) {} };
A.loop = function (id, level, pan) { if (!A.E) return; try { A.E.loop(id, level, pan); } catch (e) {} };
A.loopsOff = function () { if (A.E) A.E.loopsOff(); };

/* ---------- herramientas de prueba ---------- */
// medidor de pico y nivel a la salida (tras el limitador)
A.meter = function () {
  if (!A.E) return null; if (!A._an) { A._an = A.ac.createAnalyser(); A._an.fftSize = 2048; A.E.clip.connect(A._an); A._buf = new Float32Array(2048); }
  A._an.getFloatTimeDomainData(A._buf); let pk = 0, s = 0; for (const x of A._buf) { const a = Math.abs(x); if (a > pk) pk = a; s += x * x; } return { peak: pk, rms: Math.sqrt(s / A._buf.length), state: A.ac.state, theme: A.E.theme };
};
// render sin tiempo real: script(t, E) se llama cada 50 ms de tiempo de audio para cambiar tema, capas y disparar efectos
A.renderOffline = function (dur, script, sr) {
  sr = sr || 44100; const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const oc = new OAC(2, Math.ceil(sr * dur), sr), c2 = Object.assign({}, cfg, { musOn: true, sfxOn: true, mus: 0.8, sfx: 0.9, ion: 0, hullLow: 0, final2: 0, seed: 20261022 });
  const E = new Engine(oc, c2); E.offT = 0; E.apply();
  for (let t = 0; t < dur; t += 0.05) { E.offT = t; script(t, E, c2); E.tick(); }
  return oc.startRendering();
};
// codifica un AudioBuffer a WAV PCM de 16 bits
A.wav = function (buf) {
  const ch = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate, out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); ws(8, 'WAVE'); ws(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true); out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); ws(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const d = []; for (let c = 0; c < ch; c++) d.push(buf.getChannelData(c)); let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = clamp(d[c][i], -1, 1); out.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
  return out.buffer;
};
A._Engine = Engine; A._dshift = dshift;
})();
