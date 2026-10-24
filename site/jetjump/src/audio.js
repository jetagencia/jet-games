// Sonido sintetizado: cascos en la arena sincronizados con la animación, barras, campana y público,
// y la música del juego («Potrero al alba», composición propia de JET//Jump, sintetizada en el navegador).
// Dos buses: efectos y música, cada uno con su volumen; todo se calla cuando la pestaña se oculta.

// ---------------------------------------------------------------- partitura
// 6/8 en re mayor, negra con puntillo = 58: aire de medio galope. Cada compás tiene 6 corcheas.
// Acordes: un nombre por compás o dos separados por «|» (medio compás cada uno); «/x» = bajo en x.
// Melodía: «nota:corcheas» («-» es silencio).
const SONG = {
  intro: { chords: ['D', 'G/D', 'D', 'Asus|A'], lead: ['-:6', '-:6', '-:6', '-:3 E4:1 F#4:1 G4:1'] },
  A: {
    chords: ['D', 'G/D', 'Bm', 'A', 'D', 'G', 'Em|A', 'D'],
    lead: ['A4:3 F#4:1 G4:1 A4:1', 'B4:2 A4:1 G4:3', 'F#4:2 E4:1 D4:1 F#4:1 B4:1', 'A4:5 -:1',
      'D5:3 C#5:1 B4:1 A4:1', 'B4:2 G4:1 E4:3', 'E4:1 G4:1 B4:1 A4:1 G4:1 E4:1', 'F#4:1 E4:1 D4:4'],
  },
  B: {
    chords: ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'A7'],
    lead: ['B4:3 C#5:1 D5:1 B4:1', 'D5:3 B4:3', 'A4:2 F#4:1 A4:2 D5:1', 'C#5:4 B4:1 A4:1',
      'B4:2 D5:1 F#5:3', 'E5:2 D5:1 B4:3', 'G4:1 B4:1 E5:1 D5:2 C#5:1', 'C#5:3 E5:3'],
  },
  C: {
    chords: ['G', 'A', 'F#m', 'Bm', 'G', 'A', 'G/B|A/C#', 'A'],
    lead: ['B4:6', 'C#5:3 E5:3', 'F#5:4 E5:1 C#5:1', 'D5:6', 'G5:3 F#5:1 E5:2', 'E5:3 C#5:3', 'B4:3 C#5:3', 'C#5:4 A4:2'],
  },
  tag: { chords: ['G', 'D'], lead: ['B4:3 A4:3', 'D5:6'] },
};
// arreglo: qué suena en cada parte (lead: instrumento; ctr: contracanto una tercera abajo; perc: patrón)
const FORM = [
  { s: 'intro', pad: 1, arp: 'soft', bass: 0, lead: 'flute', perc: 0 },
  { s: 'A', pad: 0, arp: 'a', bass: 1, lead: 'flute', perc: 'light' },
  { s: 'A', pad: 0, arp: 'a', bass: 1, lead: 'reed', ctr: 'pluck', perc: 'shaker' },
  { s: 'B', pad: 1, arp: 'b', bass: 1, lead: 'flute', perc: 'gallop' },
  { s: 'A', pad: 1, arp: 'a', bass: 1, lead: 'flute', ctr: 'reed', perc: 'gallop' },
  { s: 'C', pad: 1, arp: 0, bass: 'long', lead: 'bell', perc: 0 },
  { s: 'B', pad: 1, arp: 'b', bass: 1, lead: 'reed', ctr: 'flute', perc: 'gallop' },
  { s: 'A', pad: 0, arp: 'a', bass: 1, lead: 'flute', perc: 'shaker', grace: 1 },
  { s: 'tag', pad: 1, arp: 'soft', bass: 1, lead: 'flute', perc: 0 },
];
const LOOP_FROM = 1;                    // tras la coda se vuelve a la parte A (la intro suena una sola vez)
const EIGHTH = 60 / (58 * 3);
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const QUAL = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], sus: [0, 5, 7] };
const SCALE = [1, 2, 4, 6, 7, 9, 11];   // re mayor (do#, re, mi, fa#, sol, la, si)
const midiOf = (n) => { const m = /^([A-G])([#b]?)(\d)$/.exec(n); return m ? (+m[3] + 1) * 12 + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) : null; };
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function parseChord(s) {
  const [name, slash] = s.split('/');
  const m = /^([A-G][#b]?)(m|7|sus)?$/.exec(name);
  const pc = (PC[m[1][0]] + (m[1][1] === '#' ? 1 : m[1][1] === 'b' ? -1 : 0) + 12) % 12;
  let r = 48 + pc; if (r > 55) r -= 12;                                   // raíz entre sol2 y sol3
  const bpc = slash ? (PC[slash[0]] + (slash[1] === '#' ? 1 : 0)) % 12 : pc;
  let b = 48 + bpc; if (b > 55) b -= 12;
  return { r, iv: QUAL[m[2] || ''], bass: b };
}
function parseBar(str) { const out = []; let t = 0; for (const tok of str.trim().split(/\s+/)) { const [n, d] = tok.split(':'); out.push({ m: n === '-' ? null : midiOf(n), t, d: +d }); t += +d; } return out; }
const PARSED = Object.fromEntries(Object.entries(SONG).map(([k, v]) => [k, { chords: v.chords.map((c) => c.split('|').map(parseChord)), lead: v.lead.map(parseBar) }]));
// tercera diatónica por debajo (contracanto)
function thirdBelow(m) { let n = m, c = 0; while (c < 2) { n--; if (SCALE.includes((n + 120) % 12)) c++; } return n; }

export class Sound {
  constructor() {
    this.ctx = null; this.lite = false; this.on = true; this.musicOn = true; this.sfxVol = 0.9; this.musicVol = 0.6; this.mood = 'ranch';
    this.lastPh = 0; this.lastWalk = 0;
    this.pos = 0; this.bar = 0; this.loop = 0; this.nextT = 0; this.timer = 0;
    document.addEventListener('visibilitychange', () => this.visibility());
    addEventListener('pagehide', () => { try { this.ctx && this.ctx.suspend(); } catch {} });
  }
  ensure() {
    if (this.ctx && this.ctx.state === 'closed') { clearInterval(this.timer); this.ctx = null; this.mus = null; this.sends = null; }   // el sistema lo cerró: se arma de nuevo
    if (this.ctx) { if (this.ctx.state !== 'running' && !document.hidden && (this.on || this.musicOn)) this.wake(); return; }
    if (!this.on && !this.musicOn) return;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const ctx = this.ctx = new C();
    this.master = ctx.createGain(); this.master.gain.value = 1; this.master.connect(ctx.destination);
    this.sfx = ctx.createGain(); this.sfx.gain.value = this.on ? this.sfxVol : 0; this.sfx.connect(this.master);
    // música: bus propio con compresión suave y una sala (reverberación generada, sin muestras)
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25; comp.connect(this.master);
    this.mus = ctx.createGain(); this.mus.gain.value = 0; this.mus.connect(comp);
    this.rev = ctx.createConvolver(); this.rev.buffer = impulse(ctx, this.lite ? 1.1 : 1.8, 2.6);   // en calidad liviana, sala más corta
    const wet = ctx.createGain(); wet.gain.value = 0.55; this.rev.connect(wet).connect(this.mus);
    const n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.noise = b;
    // murmullo del público, constante y bajo (más presente en la pista que en el rancho)
    const src = ctx.createBufferSource(); src.buffer = b; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.6;
    this.crowdGain = ctx.createGain(); this.crowdGain.gain.value = this.mood === 'arena' ? 0.025 : 0.006;
    src.connect(bp).connect(this.crowdGain).connect(this.sfx); src.start();
    this.nextT = ctx.currentTime + 0.15;
    this.timer = setInterval(() => this.schedule(), 60);
    this.fade(2.5);
    if (document.hidden) ctx.suspend().catch(() => {});
  }
  visibility() {
    if (!this.ctx) return;
    if (document.hidden) this.ctx.suspend().catch(() => {});
    else if (this.on || this.musicOn) this.ctx.resume().catch(() => {});
  }
  // despertar el audio desde un gesto (tocar «Continuar», una tecla): al volver a la pestaña el teléfono
  // puede dejar el contexto «suspended» o «interrupted» (iOS) aunque el resume() sin gesto diga que no;
  // dentro del gesto se reanuda, se suelta un búfer mudo (iOS destraba la salida así) y la música
  // retoma el compás donde iba, con un fundido corto.
  wake() {
    if (!this.on && !this.musicOn) return;
    if (!this.ctx || this.ctx.state === 'closed') { this.ensure(); return; }
    const c = this.ctx;
    try { const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, c.sampleRate); s.connect(c.destination); s.start(); } catch {}
    const after = () => { if (c.state !== 'running') return; this.nextT = Math.max(this.nextT, c.currentTime + 0.05); this.fade(0.6); };
    if (c.state !== 'running') c.resume().then(after, () => {}); else after();
  }
  // ---------------------------------------------------------------- ajustes
  setOn(v) { this.on = v; if (this.sfx) this.sfx.gain.setTargetAtTime(v ? this.sfxVol : 0, this.ctx.currentTime, 0.05); if (v) this.ensure(); }
  setSfxVol(v) { this.sfxVol = v; if (this.sfx && this.on) this.sfx.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05); }
  setMusic(v) { this.musicOn = v; if (v) { this.ensure(); if (this.ctx) this.nextT = Math.max(this.nextT, this.ctx.currentTime + 0.1); } this.fade(v ? 1.5 : 0.4); }
  setMusicVol(v) { this.musicVol = v; this.fade(0.15); }
  // ánimo: «ranch» (menú, rancho, establo: tema completo) o «arena» (en pista: fondo tenue que deja oír los cascos)
  setMood(m) {
    if (m === this.mood) return; this.mood = m;
    if (!this.ctx) return;
    this.fade(m === 'arena' ? 1.2 : 2.5);
    this.crowdGain.gain.setTargetAtTime(m === 'arena' ? 0.025 : 0.006, this.ctx.currentTime, 0.6);
  }
  fade(sec) {
    if (!this.mus) return;
    const t = this.ctx.currentTime, g = this.musicOn ? this.musicVol * (this.mood === 'arena' ? 0.42 : 1) : 0;
    this.mus.gain.cancelScheduledValues(t); this.mus.gain.setValueAtTime(this.mus.gain.value, t); this.mus.gain.linearRampToValueAtTime(g, t + sec);
  }
  // ---------------------------------------------------------------- secuenciador (compás a compás, con anticipación)
  schedule() {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    if (!this.musicOn || this.musicVol <= 0) { this.nextT = c.currentTime + 0.1; return; }
    if (this.nextT < c.currentTime - 0.3) this.nextT = c.currentTime + 0.05;   // tras una pausa larga: se retoma sin amontonar notas
    this.advance(c.currentTime + 0.7);
  }
  // programa compases hasta el instante «limit» (también lo usan las pruebas con un contexto sin conexión)
  advance(limit) {
    while (this.nextT < limit) {
      const F = FORM[this.pos], S = PARSED[F.s];
      this.playBar(this.nextT, F, S, this.bar);
      this.nextT += EIGHTH * 6;
      if (++this.bar >= S.chords.length) { this.bar = 0; if (++this.pos >= FORM.length) { this.pos = LOOP_FROM; this.loop++; } }
    }
  }
  playBar(t0, F, S, bar) {
    const E = EIGHTH, ch = S.chords[bar], arena = this.mood === 'arena', odd = this.loop % 2 === 1;
    const chordAt = (i) => ch.length > 1 && i >= 3 ? ch[1] : ch[0];
    const tones = (C, base) => C.iv.map((x) => base + x);
    if (arena) {
      // en la pista: acordes largos y oscuros, latido de dos golpes y una campanita cada dos compases
      for (let h = 0; h < ch.length; h++) { const C = ch[h], d = E * 6 / ch.length; this.pad(t0 + h * d, tones(C, C.r + 12), d + 0.3, 0.05, 650); this.bass(t0 + h * d, C.bass, d * 0.9, 0.16); }
      this.drum(t0, 0.22); this.drum(t0 + E * 0.75, 0.12);
      if (bar % 2 === 1) this.chime(t0 + E * 3, ch[0].r + 24 + ch[0].iv[2], 0.035);
      return;
    }
    // colchón de cuerdas
    if (F.pad) for (let h = 0; h < ch.length; h++) { const C = ch[h], d = E * 6 / ch.length; this.pad(t0 + h * d, tones(C, C.r + 12), d + 0.25, F.s === 'C' ? 0.075 : 0.05, F.s === 'C' ? 1300 : 1000); }
    // bajo: fundamental en el 1 y quinta en el 4 (o notas largas en el puente)
    if (F.bass === 'long') for (let h = 0; h < ch.length; h++) { const C = ch[h], d = E * 6 / ch.length; this.bass(t0 + h * d, C.bass, d * 0.95, 0.2); }
    else if (F.bass) { const C1 = chordAt(0), C2 = chordAt(3); this.bass(t0, C1.bass, E * 2.6, 0.24); this.bass(t0 + E * 3, ch.length > 1 ? C2.bass : C2.r + 7 - (C2.r + 7 > 55 ? 12 : 0), E * 2.6, 0.18); }
    // guitarra arpegiada
    if (F.arp) {
      const pat = F.arp === 'b' ? [0, 3, 2, 4, 2, 3] : [0, 2, 3, 4, 3, 2];
      for (let i = 0; i < 6; i++) {
        if (F.arp === 'soft' && i % 2) continue;
        const C = chordAt(i), v = [C.r + 12, C.r + 12 + C.iv[1], C.r + 12 + C.iv[2], C.r + 24, C.r + 24 + C.iv[1]];
        this.pluck(t0 + i * E + (i ? 0.004 * Math.random() : 0), v[pat[i]], E * 2.2, (i === 0 ? 0.11 : i === 3 ? 0.085 : 0.065) * (F.arp === 'soft' ? 0.8 : 1));
      }
    }
    // melodía (instrumento alterno en cada vuelta) y contracanto
    const lead = odd && F.lead === 'flute' ? 'reed' : odd && F.lead === 'reed' ? 'flute' : F.lead;
    for (const N of S.lead[bar]) {
      if (N.m == null) continue;
      const t = t0 + N.t * E, d = N.d * E;
      if (F.grace && N.d >= 3 && bar % 2 === 0) this.voice(lead, t - 0.06, N.m + (SCALE.includes((N.m + 2) % 12) ? 2 : 1), 0.07, 0.05);
      this.voice(lead, t, N.m, d, lead === 'bell' ? 0.07 : 0.085);
      if (F.s === 'C' && lead === 'bell') this.pad(t, [N.m], d, 0.03, 2200);
      if (F.ctr) this.voice(F.ctr, t + 0.01, thirdBelow(N.m), d, 0.045);
    }
    // percusión: bombo de mano y sonajero; «gallop» marca el pulso de tres tiempos del galope
    if (F.perc === 'light') { this.drum(t0, 0.2); if (bar % 2) this.drum(t0 + E * 3, 0.12); }
    else if (F.perc === 'shaker') { this.drum(t0, 0.2); this.drum(t0 + E * 3, 0.14); for (let i = 0; i < 6; i++) this.shaker(t0 + i * E, i === 0 || i === 3 ? 0.05 : 0.025); }
    else if (F.perc === 'gallop') { this.drum(t0, 0.22); this.drum(t0 + E * 4, 0.1); this.drum(t0 + E * 5, 0.14); for (const i of [0, 1, 2, 3, 4, 5]) this.shaker(t0 + i * E, i === 2 || i === 5 ? 0.05 : 0.022); if (bar === 7) for (const i of [3, 4, 5]) this.rim(t0 + i * E, 0.05); }
  }
  // ---------------------------------------------------------------- instrumentos
  // envío a la sala por tres buses fijos (sin un nodo nuevo por nota: más liviano en teléfonos)
  out(node, send = 0.25) {
    node.connect(this.mus); if (!send) return;
    if (!this.sends) this.sends = [0.12, 0.25, 0.45].map((v) => { const g = this.ctx.createGain(); g.gain.value = v; g.connect(this.rev); return g; });
    node.connect(this.sends[send < 0.18 ? 0 : send < 0.38 ? 1 : 2]);
  }
  env(t, a, peak, d, rel) { const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(peak * 0.7, t + a, d * 0.5); g.gain.setTargetAtTime(0.0001, t + d, rel); return g; }
  osc(type, f, t, end, det = 0) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det; o.start(t); o.stop(end); return o; }
  voice(kind, t, m, d, vol) { if (kind === 'reed') this.reed(t, m, d, vol); else if (kind === 'bell') this.chime(t, m, vol * 1.2); else if (kind === 'pluck') this.pluck(t, m, d, vol * 1.3); else this.flute(t, m, d, vol); }
  flute(t, m, d, vol) {
    const c = this.ctx, f = hz(m), end = t + d + 0.5;
    const g = this.env(t, 0.06, vol, d, 0.12);
    const o1 = this.osc('sine', f, t, end), o2 = this.osc('triangle', f * 2, t, end), g2 = c.createGain(); g2.gain.value = 0.12;
    const lfo = this.osc('sine', 5.2, t, end), lg = c.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.4, d)); lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
    o1.connect(g); o2.connect(g2).connect(g); this.out(g, 0.35);
    // soplo: ruido breve en el ataque (se omite en calidad liviana)
    if (this.lite) return;
    const s = c.createBufferSource(); s.buffer = this.noise; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 2;
    const sg = c.createGain(); sg.gain.setValueAtTime(vol * 0.25, t); sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); s.connect(bp).connect(sg); this.out(sg, 0.2); s.start(t, Math.random(), 0.12);
  }
  reed(t, m, d, vol) {
    const c = this.ctx, f = hz(m), end = t + d + 0.5;
    const g = this.env(t, 0.035, vol * 0.8, d, 0.09);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(3200, f * 4); lp.Q.value = 1.4;
    const o = this.osc('square', f, t, end), o2 = this.osc('sawtooth', f, t, end, 6), g2 = c.createGain(); g2.gain.value = 0.4;
    const lfo = this.osc('sine', 4.8, t, end), lg = c.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.005, t + Math.min(0.5, d)); lfo.connect(lg); lg.connect(o.frequency);
    o.connect(lp); o2.connect(g2).connect(lp); lp.connect(g); this.out(g, 0.3);
  }
  pluck(t, m, d, vol) {
    const c = this.ctx, f = hz(m), end = t + d + 0.3;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.8; lp.frequency.setValueAtTime(Math.min(6000, f * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), t + 0.35);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.setTargetAtTime(0.0001, t + 0.01, Math.min(0.5, d * 0.35));
    this.osc('sawtooth', f, t, end).connect(lp); this.osc('triangle', f, t, end, -5).connect(lp);
    lp.connect(g); this.out(g, 0.22);
  }
  chime(t, m, vol) {
    const c = this.ctx, f = hz(m), end = t + 2.2;
    for (const [k, a, dec] of [[1, 1, 1.2], [2.76, 0.35, 0.5], [5.4, 0.12, 0.25]]) {
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * a, t + 0.004); g.gain.setTargetAtTime(0.0001, t + 0.01, dec * 0.45);
      this.osc('sine', f * k, t, end).connect(g); this.out(g, 0.45);
    }
  }
  pad(t, ms, d, vol, cut) {
    const c = this.ctx, end = t + d + 0.8;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; lp.Q.value = 0.5;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.5, d * 0.4)); g.gain.setTargetAtTime(0.0001, t + d - 0.1, 0.25);
    for (const m of ms) for (const det of this.lite ? [0] : [-7, 6]) this.osc('sawtooth', hz(m), t, end, det).connect(lp);
    lp.connect(g); this.out(g, 0.5);
  }
  bass(t, m, d, vol) {
    const c = this.ctx, f = hz(m), end = t + d + 0.3;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.setTargetAtTime(vol * 0.45, t + 0.02, 0.18); g.gain.setTargetAtTime(0.0001, t + d, 0.06);
    this.osc('triangle', f, t, end).connect(lp);
    const h = c.createGain(); h.gain.value = 0.25; this.osc('sawtooth', f * 2, t, end).connect(h).connect(lp);   // armónico para que se oiga en altavoces de teléfono
    lp.connect(g); this.out(g, 0.08);
  }
  drum(t, vol) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.18);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g); this.out(g, 0.12); o.start(t); o.stop(t + 0.35);
    this.noiseHit(t, 'bandpass', 900, 1, vol * 0.25, 0.04);
  }
  shaker(t, vol) { this.noiseHit(t, 'highpass', 6500, 0.7, vol, 0.05); }
  rim(t, vol) { this.noiseHit(t, 'bandpass', 2200, 3, vol, 0.04); }
  noiseHit(t, type, f, q, vol, dur) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl).connect(g); this.out(g, 0.1); s.start(t, Math.random() * 1.5, dur + 0.02);
  }
  // ---------------------------------------------------------------- efectos
  burst({ f = 180, q = 1, dur = 0.12, vol = 0.3, type = 'lowpass', at = 0 }) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime + at;
    const s = c.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = 0.7 + Math.random() * 0.3;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(fl).connect(g).connect(this.sfx); s.start(t, Math.random() * 1.5, dur + 0.05);
  }
  tone(f, dur, vol, type = 'sine', at = 0) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.sfx); o.start(t); o.stop(t + dur + 0.02);
  }
  hoof(vol) { this.burst({ f: 140 + Math.random() * 60, q: 0.8, dur: 0.09, vol: 0.32 * vol }); this.burst({ f: 1800, q: 0.7, dur: 0.04, vol: 0.05 * vol, type: 'bandpass' }); }
  // cascos: galope de tres tiempos según la fase del clip, paso de cuatro tiempos
  step(horse, v) {
    if (!this.ctx) return;
    const gal = horse.loco.gallop, walk = horse.loco.walk;
    const ph = horse.gallopPhase();
    if (gal > 0.4 && horse.mode === 'loco') for (const b of [0.44, 0.52, 0.72]) if (crossed(this.lastPh, ph, b)) this.hoof(Math.min(1, v / 6));
    this.lastPh = ph;
    const a = horse.act.walk, wp = (a.time % horse.clips.walk.duration) / horse.clips.walk.duration;
    if (walk > 0.4 && horse.mode === 'loco') for (const b of [0, 0.25, 0.5, 0.75]) if (crossed(this.lastWalk, wp, b)) this.hoof(0.45);
    this.lastWalk = wp;
  }
  takeoff() { this.burst({ f: 120, dur: 0.18, vol: 0.45 }); this.burst({ f: 300, dur: 0.25, vol: 0.06, type: 'bandpass', at: 0.05 }); }
  land() { this.burst({ f: 110, dur: 0.22, vol: 0.6 }); this.burst({ f: 140, dur: 0.15, vol: 0.4, at: 0.12 }); }
  knock() {
    // barra de madera que golpea el soporte y cae a la arena
    this.tone(520, 0.08, 0.25, 'triangle'); this.tone(380, 0.12, 0.18, 'triangle', 0.03);
    this.burst({ f: 2400, q: 2, dur: 0.06, vol: 0.18, type: 'bandpass' });
    this.burst({ f: 200, dur: 0.2, vol: 0.4, at: 0.45 }); this.tone(300, 0.1, 0.12, 'triangle', 0.47);
    this.crowd('ooh');
  }
  // campana de salida: re-la, la misma quinta que abre el tema
  bell() { for (const [f, a] of [[587.3, 0], [880, 0], [587.3, 0.5], [880, 0.5]]) this.tone(f, 1.1, 0.12, 'sine', a); }
  // fanfarria corta al terminar sin faltas, en la tonalidad del tema (va por el bus de efectos)
  fanfare() {
    if (!this.ctx || !this.on) return;
    for (const [m, at, d] of [[62, 0, 0.18], [66, 0.18, 0.18], [69, 0.36, 0.18], [74, 0.54, 0.9]]) {
      this.tone(hz(m), d + 0.25, 0.07, 'triangle', at); this.tone(hz(m) * 2, d * 0.6, 0.025, 'sine', at);
    }
  }
  crowd(kind) {
    if (!this.ctx) return;
    if (kind === 'ooh') { this.burst({ f: 420, q: 3, dur: 0.9, vol: 0.12, type: 'bandpass', at: 0.1 }); return; }
    // aplauso: muchas palmadas cortas al azar
    const n = kind === 'big' ? 160 : 60, len = kind === 'big' ? 3.5 : 1.6;
    for (let i = 0; i < n; i++) this.burst({ f: 1500 + Math.random() * 1500, q: 1.5, dur: 0.03, vol: 0.05 + Math.random() * 0.05, type: 'bandpass', at: Math.random() * len });
  }
}
function crossed(a, b, x) { return a <= b ? a < x && b >= x : (a < x || b >= x); }
function impulse(ctx, sec, decay) {
  const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
  return b;
}
