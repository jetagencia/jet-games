// JETJump — música original generativa (WebAudio, sin samples).
// Un secuenciador de semicorcheas con progresiones por estado de ánimo: menú, establo,
// previa, repetición, victoria y derrota. Todo pasa por una reverb de convolución generada.

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
// grados sobre una tónica: acordes como semitonos relativos
const CH = { I: [0, 4, 7], Im: [0, 3, 7], IV: [5, 9, 12], IVm: [5, 8, 12], V: [7, 11, 14], V7: [7, 11, 14, 17], vi: [9, 12, 16], VI: [8, 12, 15], ii: [2, 5, 9], iii: [4, 7, 11], bVII: [10, 14, 17], III: [3, 7, 10], iv: [5, 8, 12] };

const MOODS = {
  menu:     { bpm: 68, root: 62, prog: ['I', 'V', 'vi', 'IV'], pad: 0.16, pluck: 0.12, bass: 0.14, perc: 0, strings: 0.09, arp: 'up' },
  stable:   { bpm: 84, root: 67, prog: ['I', 'vi', 'IV', 'V'], pad: 0.08, pluck: 0.16, bass: 0.12, perc: 0.06, strings: 0.04, arp: 'updown' },
  preround: { bpm: 96, root: 57, prog: ['Im', 'VI', 'III', 'bVII'], pad: 0.12, pluck: 0.05, bass: 0.16, perc: 0.14, strings: 0.12, arp: 'pulse', timpani: true },
  replay:   { bpm: 60, root: 64, prog: ['I', 'IV', 'vi', 'V'], pad: 0.2, pluck: 0.04, bass: 0.08, perc: 0, strings: 0.14, arp: 'sparse' },
  win:      { bpm: 112, root: 62, prog: ['I', 'IV', 'V', 'I'], pad: 0.1, pluck: 0.1, bass: 0.16, perc: 0.16, strings: 0.2, arp: 'up', brass: true, timpani: true },
  lose:     { bpm: 58, root: 62, prog: ['Im', 'iv', 'VI', 'V'], pad: 0.18, pluck: 0.06, bass: 0.1, perc: 0, strings: 0.1, arp: 'sparse' },
};

export class Music {
  constructor(audio) {
    this.audio = audio; this.ctx = null; this.enabled = true; this.volume = 0.8;
    this.mood = null; this.timer = null; this.step = 0; this.nextT = 0; this.bus = null;
  }
  ensure() {
    if (this.bus) return true;
    if (!this.audio.ensure()) return false;
    const c = this.ctx = this.audio.ctx;
    this.bus = c.createGain(); this.bus.gain.value = 0;
    // reverb de convolución: impulso de ruido con decaimiento exponencial
    const len = c.sampleRate * 2.6, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4) * (i < 400 ? i / 400 : 1); }
    this.verb = c.createConvolver(); this.verb.buffer = ir;
    this.verbGain = c.createGain(); this.verbGain.gain.value = 0.35;
    this.dry = c.createGain(); this.dry.gain.value = 0.8;
    this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 9000;
    this.bus.connect(this.lp); this.lp.connect(this.dry); this.lp.connect(this.verb); this.verb.connect(this.verbGain);
    this.dry.connect(this.audio.master); this.verbGain.connect(this.audio.master);
    return true;
  }
  setEnabled(v) { this.enabled = v; if (this.bus) this.bus.gain.setTargetAtTime(v && this.mood ? this.volume : 0, this.ctx.currentTime, 0.4); }
  duck(on) { if (this.lp) this.lp.frequency.setTargetAtTime(on ? 900 : 9000, this.ctx.currentTime, 0.3); }

  play(mood) {
    if (!MOODS[mood]) return this.stop();
    if (!this.ensure()) return;
    if (this.mood === mood) return;
    this.mood = mood; this.M = MOODS[mood]; this.step = 0; this.bar = 0;
    this.nextT = this.ctx.currentTime + 0.1;
    this.bus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.bus.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime, 0.8);
    if (!this.timer) this.timer = setInterval(() => this.tick(), 60);
  }
  stop(fade = 1.2) {
    if (this.bus) this.bus.gain.setTargetAtTime(0, this.ctx.currentTime, fade / 3);
    this.mood = null;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  tick() {
    if (!this.mood) return;
    const c = this.ctx;
    const stepDur = 60 / this.M.bpm / 4;
    while (this.nextT < c.currentTime + 0.25) {
      this.schedule(this.step, this.nextT, stepDur);
      this.step++; this.nextT += stepDur;
    }
  }

  chordAt(step) {
    const M = this.M, bar = Math.floor(step / 16);
    const sym = M.prog[bar % M.prog.length];
    return CH[sym].map(s => M.root + s);
  }

  schedule(step, t, sd) {
    const M = this.M, s16 = step % 16, bar = Math.floor(step / 16);
    const chord = this.chordAt(step);
    const r = Math.sin(step * 12.9898 + bar * 78.233) * 43758.5453; const rnd = r - Math.floor(r);
    // pad: un acorde por compás
    if (s16 === 0 && M.pad) this.pad(chord, t, sd * 16, M.pad);
    // cuerdas: entra en el tercer tiempo con swell
    if (s16 === 8 && M.strings && (bar % 2 === 1 || M.brass)) this.strings(chord, t, sd * 8, M.strings);
    // bajo: raíz en 1 y 3, quinta ocasional
    if (M.bass && (s16 === 0 || s16 === 8 || (s16 === 14 && rnd > 0.5))) this.bass(NOTE(chord[0] - 24 + (s16 === 14 ? 7 : 0)), t, sd * (s16 === 14 ? 2 : 6), M.bass);
    // arpegio
    if (M.pluck) {
      const notes = [chord[0], chord[1], chord[2], chord[0] + 12, chord[1] + 12];
      let n = null;
      if (M.arp === 'up' && s16 % 2 === 0) n = notes[(s16 / 2) % notes.length];
      if (M.arp === 'updown' && s16 % 2 === 0) { const seq = [0, 1, 2, 3, 4, 3, 2, 1]; n = notes[seq[(s16 / 2) % 8]]; }
      if (M.arp === 'pulse' && s16 % 4 === 0) n = notes[(bar + s16 / 4) % 3];
      if (M.arp === 'sparse' && (s16 === 0 || s16 === 6 || s16 === 11) && rnd > 0.3) n = notes[Math.floor(rnd * 5)];
      if (n != null) this.pluck(NOTE(n + 12), t, sd * 3, M.pluck * (0.7 + 0.5 * rnd));
    }
    // percusión suave: shaker en contratiempos, bombo grave
    if (M.perc) {
      if (s16 % 4 === 2) this.shaker(t, M.perc * 0.5);
      if (s16 === 0 || s16 === 10) this.kick(t, M.perc);
    }
    if (M.timpani && (s16 === 0 || (s16 === 12 && bar % 2 === 1))) this.timpani(NOTE(chord[0] - 36), t, 0.22);
    if (M.brass && s16 === 0) this.brass(chord, t, sd * 10, 0.1);
    if (M.brass && bar % 4 === 3 && s16 >= 8 && s16 % 2 === 0) this.brass([chord[0] + 12], t, sd * 1.5, 0.08);
  }

  out(gain, t, dur, a = 0.01, rel = 0.3) {
    const g = this.ctx.createGain(); g.connect(this.bus);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + a); g.gain.setValueAtTime(gain, t + Math.max(a, dur - rel)); g.gain.linearRampToValueAtTime(0, t + dur + 0.02);
    return g;
  }
  pad(chord, t, dur, gain) {
    const c = this.ctx, g = this.out(gain, t, dur, dur * 0.3, dur * 0.4);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1400, t + dur * 0.5); f.frequency.linearRampToValueAtTime(600, t + dur); f.Q.value = 0.6;
    f.connect(g);
    for (const n of chord) for (const det of [-6, 5]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = NOTE(n); o.detune.value = det; o.connect(f); o.start(t); o.stop(t + dur + 0.1); }
  }
  strings(chord, t, dur, gain) {
    const c = this.ctx, g = this.out(gain, t, dur, dur * 0.5, dur * 0.3);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 0.5; f.connect(g);
    for (const n of chord) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = NOTE(n + 12); const lfo = c.createOscillator(); lfo.frequency.value = 5.5; const lg = c.createGain(); lg.gain.value = 3; lfo.connect(lg); lg.connect(o.detune); lfo.start(t); lfo.stop(t + dur); o.connect(f); o.start(t); o.stop(t + dur + 0.1); }
  }
  pluck(freq, t, dur, gain) {
    const c = this.ctx, g = this.out(gain, t, dur, 0.004, dur * 0.8);
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = freq;
    const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2; const g2 = c.createGain(); g2.gain.setValueAtTime(0.35, t); g2.gain.exponentialRampToValueAtTime(0.01, t + dur * 0.5);
    o.connect(g); o2.connect(g2); g2.connect(g); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  bass(freq, t, dur, gain) {
    const c = this.ctx, g = this.out(gain, t, dur, 0.01, dur * 0.5);
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
    const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq; const g2 = c.createGain(); g2.gain.value = 0.3;
    o.connect(g); o2.connect(g2); g2.connect(g); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  brass(chord, t, dur, gain) {
    const c = this.ctx, g = this.out(gain, t, dur, 0.06, dur * 0.4);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(600, t); f.frequency.linearRampToValueAtTime(2600, t + 0.12); f.frequency.linearRampToValueAtTime(1200, t + dur); f.connect(g);
    for (const n of chord) for (const det of [-4, 4]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = NOTE(n); o.detune.value = det; o.connect(f); o.start(t); o.stop(t + dur + 0.05); }
  }
  timpani(freq, t, gain) {
    const c = this.ctx, g = this.out(gain, t, 0.9, 0.005, 0.7);
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(freq * 1.5, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
    o.connect(g); o.start(t); o.stop(t + 1);
    const n = c.createBufferSource(); n.buffer = this.audio.noise; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300; const ng = this.out(gain * 0.5, t, 0.15, 0.002, 0.1); n.connect(f); f.connect(ng); n.start(t); n.stop(t + 0.2);
  }
  kick(t, gain) {
    const c = this.ctx, g = this.out(gain, t, 0.25, 0.003, 0.2);
    const o = c.createOscillator(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); o.connect(g); o.start(t); o.stop(t + 0.3);
  }
  shaker(t, gain) {
    const c = this.ctx, g = this.out(gain, t, 0.07, 0.003, 0.05);
    const n = c.createBufferSource(); n.buffer = this.audio.noise; n.playbackRate.value = 1.8; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000; n.connect(f); f.connect(g); n.start(t, Math.random()); n.stop(t + 0.1);
  }
}
