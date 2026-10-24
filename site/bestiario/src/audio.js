// Música y efectos de JET//Bestiario: todo sintetizado en el navegador con Web Audio (sin archivos ni samples ajenos).
// Dos piezas propias: «Faroles de ceniza» (el pueblo, re menor en 3/4, arpa, cuerda frotada y tambor de marco, con una
// sección C en modo frigio que pone la nota amenazante) y «Arena de brasas» (el combate, 4/4 a 138, ostinato de bajo,
// timbales de guerra y metales). Cada vuelta cambia la orquestación para que no se sienta repetida.
// Arranca con el primer gesto del usuario, se pausa con la pestaña oculta y recuerda volumen y silencio.

const KEY = 'criaturas.audio';
const DEF = { music: true, musicVol: 0.55, sfx: true, sfxVol: 0.8 };
const prefs = (() => { try { const p = { ...DEF, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; for (const k of ['musicVol', 'sfxVol']) p[k] = Math.max(0, Math.min(1, +p[k] || 0)); p.music = p.music !== false; p.sfx = p.sfx !== false; return p; } catch (e) { return { ...DEF }; } })();
const savePrefs = () => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) { /* sin almacenamiento */ } };

let ctx = null, master = null, musicBus = null, sfxBus = null, revIn = null, meter = null, unlocked = false;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC({ latencyHint: 'playback' }); } catch (e) { try { ctx = new AC(); } catch (e2) { return null; } }
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(comp); comp.connect(ctx.destination);
  meter = ctx.createAnalyser(); meter.fftSize = 512; comp.connect(meter);   // medidor de nivel (lo usan las pruebas automáticas)
  musicBus = ctx.createGain(); musicBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.connect(master);
  // reverberación de sala de piedra: ruido con caída exponencial, generado aquí mismo
  const len = Math.floor(ctx.sampleRate * 2.6), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  const conv = ctx.createConvolver(); conv.buffer = ir;
  revIn = ctx.createGain(); const revOut = ctx.createGain(); revOut.gain.value = 0.32;
  revIn.connect(conv); conv.connect(revOut); revOut.connect(master);
  applyVolumes();
  return ctx;
}
function applyVolumes() {
  if (!ctx) return;
  const t = ctx.currentTime;
  musicBus.gain.setTargetAtTime(prefs.music ? prefs.musicVol * 0.9 : 0, t, 0.08);
  sfxBus.gain.setTargetAtTime(prefs.sfx ? prefs.sfxVol : 0, t, 0.03);
}

// ---------------------------------------------------------------- voces ----------------------------------------------------------------
function out(node, bus, send = 0.25) {
  node.connect(bus);
  if (send > 0) { const s = ctx.createGain(); s.gain.value = send; node.connect(s); s.connect(revIn); }
}
// arpa / laúd: triángulo con un toque de cuadrada, filtro que se cierra
function pluck(bus, t, m, len, vol, o = {}) {
  const f = mtof(m), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(o.bright || 3200, t); lp.frequency.exponentialRampToValueAtTime(o.dark || 500, t + Math.max(0.2, len));
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.35);
  for (const [type, k, det] of [['triangle', 1, 0], ['square', 0.18, 4]]) {
    const os = ctx.createOscillator(), og = ctx.createGain(); os.type = type; os.frequency.value = f; os.detune.value = det; og.gain.value = k;
    os.connect(og); og.connect(lp); os.start(t); os.stop(t + len + 0.4);
  }
  lp.connect(g); out(g, bus, o.send ?? 0.3);
}
// cuerda frotada: dos sierras desafinadas, ataque lento y vibrato que entra tarde
function bow(bus, t, m, len, vol, o = {}) {
  const f = mtof(m), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = o.cut || 1700; lp.Q.value = 0.7;
  const a = Math.min(o.attack || 0.09, len * 0.4), r = Math.min(0.25, len * 0.4);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setValueAtTime(vol, t + len - r); g.gain.linearRampToValueAtTime(0.0001, t + len + 0.05);
  const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.2; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(o.vib ?? 9, t + Math.min(0.5, len)); vib.connect(vg);
  for (const det of [-6, 6]) {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = f; os.detune.value = det; vg.connect(os.detune);
    os.connect(lp); os.start(t); os.stop(t + len + 0.1);
  }
  vib.start(t); vib.stop(t + len + 0.1);
  lp.connect(g); out(g, bus, o.send ?? 0.35);
}
// colchón grave: triángulos lentos, casi un órgano de fuelle
function pad(bus, t, notes, len, vol, o = {}) {
  const g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = o.cut || 650;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + (o.attack || 0.8)); g.gain.setValueAtTime(vol, t + len - 0.6); g.gain.linearRampToValueAtTime(0.0001, t + len + 0.2);
  for (const m of notes) for (const det of [-5, 5]) {
    const os = ctx.createOscillator(); os.type = o.wave || 'triangle'; os.frequency.value = mtof(m); os.detune.value = det;
    os.connect(lp); os.start(t); os.stop(t + len + 0.3);
  }
  lp.connect(g); out(g, bus, o.send ?? 0.4);
}
// bajo con púa (combate)
function bass(bus, t, m, len, vol) {
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(), os = ctx.createOscillator(), sub = ctx.createOscillator();
  os.type = 'sawtooth'; os.frequency.value = mtof(m); sub.type = 'sine'; sub.frequency.value = mtof(m - 12);
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(220, t + len); lp.Q.value = 4;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.05);
  const sg = ctx.createGain(); sg.gain.value = 0.6; sub.connect(sg); sg.connect(g);
  os.connect(lp); lp.connect(g); out(g, bus, 0.05);
  os.start(t); sub.start(t); os.stop(t + len + 0.1); sub.stop(t + len + 0.1);
}
// metal: sierra brillante con la apertura del filtro de un cobre
function brass(bus, t, m, len, vol, o = {}) {
  const g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 1.5; lp.frequency.setValueAtTime(400, t); lp.frequency.linearRampToValueAtTime(o.cut || 2600, t + 0.06); lp.frequency.exponentialRampToValueAtTime((o.cut || 2600) * 0.5, t + len);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol * 0.8, t + Math.max(0.05, len - 0.08)); g.gain.linearRampToValueAtTime(0.0001, t + len + 0.06);
  for (const det of [-8, 0, 8]) { const os = ctx.createOscillator(); os.type = 'sawtooth'; os.frequency.value = mtof(m); os.detune.value = det; os.connect(lp); os.start(t); os.stop(t + len + 0.1); }
  lp.connect(g); out(g, bus, o.send ?? 0.22);
}
// campana grave (parciales inarmónicos): el toque de difuntos del pueblo
function bell(bus, t, m, len, vol, o = {}) {
  const f = mtof(m), g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  for (const [k, a] of [[1, 1], [2.01, 0.5], [2.76, 0.35], [5.4, 0.18], [0.5, 0.4]]) {
    const os = ctx.createOscillator(), og = ctx.createGain(); os.type = 'sine'; os.frequency.value = f * k; og.gain.value = a; os.connect(og); og.connect(g); os.start(t); os.stop(t + len + 0.05);
  }
  out(g, bus, o.send ?? 0.5);
}
let noiseBuf = null;
function noise(bus, t, len, vol, o = {}) {
  if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = noiseBuf; src.loop = true;
  f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f0 || 1500, t); if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + len); f.Q.value = o.q || 1;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(f); f.connect(g); out(g, bus, o.send ?? 0.1);
  src.start(t, Math.random() * 0.5); src.stop(t + len + 0.05);
}
// golpe con caída de tono: bombo, tambor de marco, timbal de guerra
function thump(bus, t, f0, f1, len, vol, o = {}) {
  const os = ctx.createOscillator(), g = ctx.createGain();
  os.type = 'sine'; os.frequency.setValueAtTime(f0, t); os.frequency.exponentialRampToValueAtTime(f1, t + len * 0.7);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  os.connect(g); out(g, bus, o.send ?? 0.12); os.start(t); os.stop(t + len + 0.05);
}

// --------------------------------------------------------------- partituras ---------------------------------------------------------------
// Acordes: fundamental (MIDI) para el arpegio y su tipo. Melodías: [posición en corcheas, nota MIDI, duración en corcheas].
const CH = { Dm: [50, 'm'], Bb: [46, 'M'], C: [48, 'M'], Gm: [55, 'm'], A: [45, 'M'], F: [53, 'M'], Eb: [51, 'M'], Am: [45, 'm'] };
const triad = (name) => { const [r, q] = CH[name]; return [r, r + (q === 'm' ? 3 : 4), r + 7]; };

// «Faroles de ceniza»: 3/4, seis corcheas por compás
const PUEBLO = {
  bpm: 92, eighths: 6,
  sections: {
    A: { ch: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Gm', 'A', 'A'],
      mel: [[[0, 69, 3], [3, 65, 1], [4, 67, 1], [5, 69, 1]], [[0, 74, 4], [4, 72, 1], [5, 69, 1]], [[0, 70, 2], [2, 69, 1], [3, 67, 3]], [[0, 67, 2], [2, 69, 1], [3, 72, 3]],
        [[0, 69, 3], [3, 74, 2], [5, 76, 1]], [[0, 77, 2], [2, 76, 1], [3, 74, 2], [5, 70, 1]], [[0, 69, 2], [2, 73, 2], [4, 76, 2]], [[0, 73, 6]]] },
    A2: { ch: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Gm', 'A', 'Dm'],
      mel: [[[0, 69, 3], [3, 65, 1], [4, 67, 1], [5, 69, 1]], [[0, 74, 4], [4, 72, 1], [5, 69, 1]], [[0, 70, 2], [2, 69, 1], [3, 67, 3]], [[0, 67, 2], [2, 69, 1], [3, 72, 3]],
        [[0, 69, 3], [3, 74, 2], [5, 76, 1]], [[0, 77, 2], [2, 76, 1], [3, 74, 2], [5, 70, 1]], [[0, 69, 2], [2, 76, 2], [4, 73, 2]], [[0, 74, 6]]] },
    B: { ch: ['F', 'C', 'Gm', 'Dm', 'Bb', 'F', 'Gm', 'A'],
      mel: [[[0, 72, 2], [2, 69, 1], [3, 72, 1], [4, 77, 2]], [[0, 76, 3], [3, 74, 1], [4, 72, 2]], [[0, 74, 2], [2, 70, 1], [3, 67, 3]], [[0, 69, 4], [4, 65, 2]],
        [[0, 65, 1], [1, 67, 1], [2, 70, 1], [3, 74, 3]], [[0, 72, 2], [2, 69, 2], [4, 65, 2]], [[0, 67, 2], [2, 70, 2], [4, 74, 2]], [[0, 76, 3], [3, 73, 3]]] },
    C: { ch: ['Dm', 'Eb', 'Dm', 'Eb', 'Bb', 'C', 'A', 'A'], dark: true,
      mel: [[], [[0, 63, 6]], [[0, 62, 3], [3, 65, 3]], [[0, 67, 2], [2, 63, 4]], [[0, 65, 6]], [[0, 67, 3], [3, 64, 3]], [[0, 61, 6]], []] },
  },
  order: ['A', 'A2', 'B', 'A2', 'C', 'B'],
};
// «Arena de brasas»: 4/4, ocho corcheas por compás
const COMBATE = {
  bpm: 138, eighths: 8,
  sections: {
    I: { ch: ['Dm', 'Dm', 'Bb', 'A'], mel: [[], [], [], []], intro: true },
    A: { ch: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Gm', 'Eb', 'A'],
      mel: [[[0, 74, 3], [3, 69, 1], [4, 74, 2], [6, 77, 2]], [[0, 76, 2], [2, 74, 2], [4, 73, 4]], [[0, 74, 2], [2, 77, 2], [4, 82, 4]], [[0, 81, 6], [6, 79, 1], [7, 77, 1]],
        [[0, 77, 3], [3, 76, 1], [4, 74, 4]], [[0, 79, 2], [2, 77, 2], [4, 74, 2], [6, 70, 2]], [[0, 75, 4], [4, 74, 2], [6, 72, 2]], [[0, 73, 8]]] },
    B: { ch: ['Gm', 'Gm', 'Dm', 'Dm', 'Eb', 'Eb', 'A', 'A'], stabs: true,
      mel: [[[0, 79, 1], [1, 79, 1], [2, 77, 1], [3, 79, 1], [4, 82, 2], [6, 81, 2]], [[0, 79, 6], [6, 74, 2]], [[0, 77, 1], [1, 77, 1], [2, 76, 1], [3, 77, 1], [4, 81, 2], [6, 79, 2]], [[0, 77, 6], [6, 69, 2]],
        [[0, 75, 2], [2, 79, 2], [4, 82, 4]], [[0, 79, 4], [4, 77, 2], [6, 75, 2]], [[0, 73, 2], [2, 76, 2], [4, 81, 4]], [[0, 79, 2], [2, 77, 2], [4, 76, 2], [6, 73, 2]]] },
    C: { ch: ['Dm', 'Eb', 'Dm', 'A'], mel: [[], [[0, 75, 8]], [], [[0, 73, 4], [4, 76, 4]]], breakdown: true },
  },
  order: ['I', 'A', 'B', 'A', 'C', 'B'],
  loopFrom: 1,
};
const TRACKS = { pueblo: PUEBLO, combate: COMBATE };

// pequeño generador determinista para las variaciones de cada vuelta
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

function renderPueblo(bus, t, e8, sec, bi, pass) {
  const S = PUEBLO.sections[sec], chord = S.ch[bi], tri = triad(chord), bar = e8 * 6;
  const v = pass % 3;                                      // 0: cuerda; 1: arpa aguda (caja de música); 2: cuerda con segunda voz
  // colchón cada dos compases (o cada compás si cambia el acorde)
  if (bi % 2 === 0 || S.ch[bi - 1] !== chord) pad(bus, t, [tri[0] - 12, tri[2] - 12], bar * (S.ch[bi + 1] === chord ? 2 : 1) + 0.1, S.dark ? 0.05 : 0.04, { cut: S.dark ? 420 : 650 });
  // arpegio: fundamental, quinta, octava, tercera arriba, octava, quinta
  const arp = [tri[0], tri[2], tri[0] + 12, tri[1] + 12, tri[0] + 12, tri[2]];
  for (let i = 0; i < 6; i++) {
    if (S.dark && i % 2 === 1 && rnd(bi, i + pass) < 0.6) continue;              // en la sección oscura el arpa respira
    pluck(bus, t + i * e8 + (i ? rnd(bi, i) * 0.012 : 0), arp[i], e8 * 1.6, (i === 0 ? 0.075 : 0.05) * (S.dark ? 0.8 : 1), { bright: S.dark ? 1800 : 3000 });
  }
  // tambor de marco en la cabeza del compás; en B también en la mitad; roce de cascabeles en A2 y B
  thump(bus, t, 110, 52, 0.45, S.dark ? 0.14 : 0.2);
  noise(bus, t, 0.12, 0.05, { f0: 900, q: 0.8 });
  if (sec === 'B' || (sec === 'A2' && pass > 0)) thump(bus, t + 3 * e8, 96, 50, 0.35, 0.1);
  if (sec !== 'C' && sec !== 'A' && !S.dark) for (const i of [2, 5]) noise(bus, t + i * e8, 0.05, 0.025, { type: 'highpass', f0: 6500, q: 0.5 });
  if (S.dark && (bi === 0 || bi === 4)) bell(bus, t, 38, 4.5, 0.09);
  // melodía
  for (const [p, m, d] of S.mel[bi]) {
    const tt = t + p * e8, len = d * e8;
    if (S.dark) { bow(bus, tt, m - 12, len, 0.06, { cut: 1100, wave: 'sawtooth', vib: 6 }); continue; }
    if (v === 1) { pluck(bus, tt, m + 12, len * 1.2, 0.05, { bright: 5200, dark: 1400, send: 0.45 }); continue; }
    if (d >= 3 && rnd(pass, bi * 7 + p) < 0.35) pluck(bus, tt - e8 * 0.25, m + 2, e8 * 0.3, 0.03);   // apoyatura de adorno, distinta cada vuelta
    bow(bus, tt, m, len, 0.055);
    if (v === 2 && bi >= 4) bow(bus, tt, m - (CH[chord][1] === 'm' ? 3 : 4), len, 0.032, { cut: 1300 });
  }
}

function renderCombate(bus, t, e8, sec, bi, pass) {
  const S = COMBATE.sections[sec], chord = S.ch[bi], [r] = CH[chord], tri = triad(chord);
  const root = r <= 47 ? r - 12 : r - 24;                // bajo en la octava 2
  // ostinato del bajo (en Dm asoma la segunda menor frigia)
  const pat = [0, 0, 12, 0, 0, chord === 'Dm' ? 1 : 0, 0, 7];
  if (!S.breakdown) for (let i = 0; i < 8; i++) bass(bus, t + i * e8, root + pat[i] + 12, e8 * 0.8, i % 4 === 0 ? 0.14 : 0.1);
  else if (bi % 2 === 0) bass(bus, t, root + 12, e8 * 6, 0.12);
  // batería: bombo, palmas de cuero, platillo cerrado y timbales al final del compás
  for (const i of S.breakdown ? [0] : [0, 3, 4]) thump(bus, t + i * e8, 140, 45, 0.3, 0.32);
  if (!S.breakdown && !S.intro) for (const i of [2, 6]) noise(bus, t + i * e8, 0.14, 0.12, { f0: 1800, q: 0.7, send: 0.18 });
  for (let i = 0; i < 8; i++) noise(bus, t + i * e8, 0.04, i % 2 ? 0.02 : 0.035, { type: 'highpass', f0: 7000 });
  if (S.breakdown || bi % 4 === 3) for (const [i, f] of [[5, 150], [6, 120], [7, 96]]) thump(bus, t + i * e8, f, f * 0.55, 0.3, 0.2);
  if (S.intro && bi === 0) bell(bus, t, 38, 3.5, 0.1);
  // golpes de metales en B
  if (S.stabs) for (const i of [0, 3]) for (const m of tri) brass(bus, t + i * e8, m + 12, e8 * 0.9, 0.022);
  // pedal de cuerdas en el corte
  if (S.breakdown) pad(bus, t, [tri[0], tri[1], tri[2]], e8 * 8, 0.05, { wave: 'sawtooth', cut: 900, attack: 0.3 });
  // melodía: metales; en la segunda vuelta de A, doblada a la octava grave
  for (const [p, m, d] of S.mel[bi]) {
    const tt = t + p * e8, len = d * e8 * 0.92;
    brass(bus, tt, m, len, 0.05);
    if (pass % 2 === 1 && sec === 'A') brass(bus, tt, m - 12, len, 0.03, { cut: 1500 });
  }
}

// ------------------------------------------------------------ secuenciador ------------------------------------------------------------
let mode = 'pueblo', seq = null, timer = 0;
function newSeq(id) {
  const tr = TRACKS[id], g = ctx.createGain(); g.gain.value = 0.0001; g.connect(musicBus);
  g.gain.setTargetAtTime(1, ctx.currentTime + 0.05, 0.25);
  return { id, tr, g, next: ctx.currentTime + 0.12, oi: 0, bi: 0, pass: 0 };
}
function pump() {
  if (!ctx || !seq || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  if (seq.next < now) seq.next = now + 0.05;                     // tras una pausa, se retoma sin amontonar compases
  while (seq.next < now + 0.35) {
    const tr = seq.tr, sec = tr.order[seq.oi], S = tr.sections[sec], e8 = 60 / tr.bpm / 2;
    (tr === PUEBLO ? renderPueblo : renderCombate)(seq.g, seq.next, e8, sec, seq.bi, seq.pass);
    seq.next += e8 * tr.eighths;
    if (++seq.bi >= S.ch.length) { seq.bi = 0; if (++seq.oi >= tr.order.length) { seq.oi = tr.loopFrom || 0; seq.pass++; } }
  }
}
function startMusic() {
  if (!ctx || !prefs.music || seq) return;
  seq = newSeq(mode);
  if (!timer) timer = setInterval(pump, 90);
  pump();
}
function stopMusic(fade = 0.4) {
  if (!seq) return;
  const g = seq.g, t = ctx.currentTime; seq = null;
  g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0.0001, t + fade);
  setTimeout(() => { try { g.disconnect(); } catch (e) { /* ya desconectado */ } }, (fade + 3.5) * 1000);
}

// --------------------------------------------------------------- efectos ---------------------------------------------------------------
const FX = {
  click: (t) => { const b = sfxBus; thump(b, t, 1400, 900, 0.05, 0.05, { send: 0 }); },
  open: (t) => noise(sfxBus, t, 0.22, 0.06, { f0: 500, f1: 2600, q: 1.2, attack: 0.05 }),
  coin: (t) => { bell(sfxBus, t, 91, 0.35, 0.05, { send: 0.2 }); bell(sfxBus, t + 0.07, 96, 0.5, 0.05, { send: 0.2 }); },
  ok: (t) => [81, 85, 88].forEach((m, i) => pluck(sfxBus, t + i * 0.06, m, 0.25, 0.07, { send: 0.2 })),
  error: (t) => { for (const [i, m] of [[0, 52], [1, 49]]) { const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'square'; os.frequency.value = mtof(m); g.gain.setValueAtTime(0.04, t + i * 0.11); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.11 + 0.1); os.connect(g); g.connect(sfxBus); os.start(t + i * 0.11); os.stop(t + i * 0.11 + 0.12); } },
  ready: (t) => [86, 81, 90].forEach((m, i) => bell(sfxBus, t + i * 0.16, m, 1.1, 0.06)),
  hatch: (t) => { for (let i = 0; i < 3; i++) noise(sfxBus, t + i * 0.13, 0.06, 0.14, { f0: 2500 + i * 600, q: 2 }); [74, 78, 81, 86, 90].forEach((m, i) => pluck(sfxBus, t + 0.45 + i * 0.07, m, 0.5, 0.07, { send: 0.45 })); },
  levelup: (t) => { [74, 78, 81, 86].forEach((m, i) => brass(sfxBus, t + i * 0.09, m, 0.16, 0.05)); for (const m of [74, 78, 81, 86]) brass(sfxBus, t + 0.4, m, 0.6, 0.035); },
  swing: (t) => noise(sfxBus, t, 0.2, 0.12, { f0: 2600, f1: 500, q: 1.4, attack: 0.03 }),
  hit: (t) => { thump(sfxBus, t, 150, 48, 0.28, 0.4); noise(sfxBus, t, 0.12, 0.18, { f0: 1200, q: 0.6 }); },
  crit: (t) => { FX.hit(t); bell(sfxBus, t + 0.02, 88, 0.6, 0.05); noise(sfxBus, t, 0.25, 0.12, { type: 'highpass', f0: 3000 }); },
  miss: (t) => noise(sfxBus, t, 0.25, 0.07, { f0: 4000, f1: 1500, q: 2, attack: 0.04 }),
  heal: (t) => [76, 81, 85, 88].forEach((m, i) => bell(sfxBus, t + i * 0.07, m, 0.7, 0.035)),
  ko: (t) => { thump(sfxBus, t, 90, 35, 0.9, 0.4); bow(sfxBus, t, 50, 0.9, 0.05, { cut: 800 }); bow(sfxBus, t + 0.25, 45, 1.1, 0.05, { cut: 700 }); },
  fuego: (t) => { noise(sfxBus, t, 0.6, 0.2, { type: 'lowpass', f0: 2400, f1: 300, q: 0.8, attack: 0.05 }); thump(sfxBus, t, 70, 40, 0.5, 0.25); },
  agua: (t) => { for (let i = 0; i < 5; i++) { const os = ctx.createOscillator(), g = ctx.createGain(), s = t + i * 0.06; os.type = 'sine'; os.frequency.setValueAtTime(900 + i * 140, s); os.frequency.exponentialRampToValueAtTime(260, s + 0.09); g.gain.setValueAtTime(0.06, s); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.1); os.connect(g); out(g, sfxBus, 0.3); os.start(s); os.stop(s + 0.12); } noise(sfxBus, t, 0.5, 0.08, { type: 'lowpass', f0: 1200, f1: 400 }); },
  aire: (t) => noise(sfxBus, t, 0.6, 0.16, { f0: 600, f1: 5000, q: 3, attack: 0.1 }),
  tierra: (t) => { thump(sfxBus, t, 60, 28, 0.8, 0.45); noise(sfxBus, t, 0.6, 0.18, { type: 'lowpass', f0: 500, f1: 120 }); },
  roar: (t) => {   // gruñido grave: sierra modulada en amplitud que cae de tono
    const os = ctx.createOscillator(), am = ctx.createOscillator(), amg = ctx.createGain(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    os.type = 'sawtooth'; os.frequency.setValueAtTime(95, t); os.frequency.exponentialRampToValueAtTime(52, t + 0.8);
    am.frequency.value = 23; amg.gain.value = 0.5; am.connect(amg); amg.connect(g.gain);
    lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 2;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.12); g.gain.linearRampToValueAtTime(0.0001, t + 0.9);
    os.connect(lp); lp.connect(g); out(g, sfxBus, 0.3); os.start(t); am.start(t); os.stop(t + 1); am.stop(t + 1);
    noise(sfxBus, t, 0.8, 0.05, { type: 'lowpass', f0: 700, f1: 200, attack: 0.1 });
  },
  win: (t) => { [62, 66, 69, 74].forEach((m, i) => brass(sfxBus, t + i * 0.12, m + 12, 0.2, 0.06)); for (const m of [62, 66, 69, 74]) brass(sfxBus, t + 0.55, m + 12, 1.3, 0.04); thump(sfxBus, t + 0.55, 130, 50, 0.6, 0.3); },
  lose: (t) => { [69, 65, 62, 61].forEach((m, i) => bow(sfxBus, t + i * 0.32, m, 0.5, 0.06, { cut: 1200 })); bell(sfxBus, t + 1.3, 38, 3, 0.1); },
  champion: (t) => {
    const seqN = [[0, 62], [0.15, 66], [0.3, 69], [0.45, 74], [0.75, 76], [0.9, 78], [1.05, 81], [1.35, 86]];
    for (const [d, m] of seqN) brass(sfxBus, t + d, m + 12, 0.22, 0.055);
    for (const m of [62, 66, 69, 74, 78]) brass(sfxBus, t + 1.7, m + 12, 2.2, 0.035);
    for (const d of [0, 0.75, 1.7]) thump(sfxBus, t + d, 120, 45, 0.6, 0.35);
    bell(sfxBus, t + 1.7, 50, 4, 0.12);
  },
};
let lastFx = {};
function sfx(name) {
  if (!ctx || !prefs.sfx || ctx.state !== 'running' || !FX[name]) return;
  const now = ctx.currentTime;
  if (lastFx[name] && now - lastFx[name] < 0.045) return;          // el mismo efecto dos veces en el mismo instante suena a error
  lastFx[name] = now;
  try { FX[name](now + 0.01); } catch (e) { /* un efecto fallido nunca rompe el juego */ }
}

// --------------------------------------------------------------- control ---------------------------------------------------------------
function unlock() {
  if (!ensure()) return;
  if (ctx.state === 'suspended' && !document.hidden) ctx.resume().catch(() => {});
  unlocked = true;
  startMusic();
}
if (typeof window !== 'undefined' && typeof document !== 'undefined') {   // (en Node, para las pruebas del motor de combate, no hay audio)
  ['pointerdown', 'keydown', 'touchend'].forEach((ev) => addEventListener(ev, unlock, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else if (unlocked) ctx.resume().then(() => pump()).catch(() => {});
  });
  addEventListener('pagehide', () => { if (ctx) ctx.suspend().catch(() => {}); });
}

export const Sound = {
  sfx,
  prefs: () => ({ ...prefs }),
  set(k, v) {
    prefs[k] = v; savePrefs(); applyVolumes();
    if (k === 'music') { if (v) startMusic(); else stopMusic(0.3); }
  },
  setMode(m) {
    if (m === mode) return; mode = m;
    if (!ctx || !prefs.music) return;
    stopMusic(m === 'combate' ? 0.35 : 0.9); startMusic();
  },
  get mode() { return mode; },
  get running() { return !!ctx && ctx.state === 'running'; },
  level() { if (!meter) return 0; const d = new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(d); let q = 0; for (const v of d) q += v * v; return Math.sqrt(q / d.length); },
};
if (typeof window !== 'undefined') window.__bestiarioSound = Sound;
