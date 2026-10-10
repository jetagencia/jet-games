// JETJump — audio procedural (WebAudio, sin assets).
// Cascos por aire y superficie, barra, agua, campana, público, respiración, viento.

export class GameAudio {
  constructor() {
    this.ctx = null; this.enabled = true; this.master = null; this.noise = null;
    this.crowdGain = null; this.windGain = null; this.indoor = false; this.cheerT = 0; this.voiceOn = true;
  }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = this.enabled ? 0.9 : 0; this.master.connect(ctx.destination);
    // ruido rosa en buffer
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    }
    this.noise = buf;
    this.bus = ctx.createDynamicsCompressor(); this.bus.threshold.value = -14; this.bus.ratio.value = 4; this.bus.connect(this.master);
    return true;
  }
  setEnabled(v) { this.enabled = v; if (this.master) this.master.gain.setTargetAtTime(v ? 0.9 : 0, this.ctx.currentTime, 0.05); }

  src(gain = 1, dest = this.bus) {
    const g = this.ctx.createGain(); g.gain.value = gain; g.connect(dest); return g;
  }
  noiseBurst({ gain = 0.5, dur = 0.08, f = 800, q = 1, type = 'bandpass', attack = 0.004, pitchEnv = 0, dest }) {
    const c = this.ctx, t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = 0.9 + Math.random() * 0.2;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    if (pitchEnv) { fl.frequency.setValueAtTime(f * (1 + pitchEnv), t); fl.frequency.exponentialRampToValueAtTime(f, t + dur); }
    const g = this.src(0, dest);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(fl); fl.connect(g); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  tone({ f = 440, gain = 0.3, dur = 0.3, type = 'sine', decay = 0.1, slide = 0, dest }) {
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
    const g = this.src(0, dest);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); o.start(t); o.stop(t + dur + 0.02);
  }

  // superficie: 'sand' (arena), 'grass'
  hoof(gait, v, surface = 'sand') {
    if (!this.ctx || !this.enabled) return;
    const hard = surface === 'sand' ? 0.35 : 0.2;
    const k = Math.min(1, 0.35 + v / 9);
    // golpe sordo + grano de arena
    this.tone({ f: 70 + Math.random() * 25, gain: 0.35 * k, dur: 0.09, type: 'sine', slide: 0.5 });
    this.noiseBurst({ gain: 0.22 * k * (1 + hard), dur: 0.06 + 0.02 * k, f: 500 + Math.random() * 300, q: 0.8, pitchEnv: 1.2 });
    if (gait >= 3 && Math.random() < 0.5) this.noiseBurst({ gain: 0.08 * k, dur: 0.12, f: 2200, q: 0.5, type: 'highpass', attack: 0.02 });
  }
  knock(strength = 1) {
    if (!this.ctx || !this.enabled) return;
    // madera: tono corto + ruido medio, dos golpes (barra y suelo)
    this.tone({ f: 180, gain: 0.5 * strength, dur: 0.12, type: 'triangle', slide: 0.6 });
    this.noiseBurst({ gain: 0.5 * strength, dur: 0.1, f: 1200, q: 2 });
    setTimeout(() => { if (this.ctx) { this.tone({ f: 120, gain: 0.35, dur: 0.18, type: 'triangle', slide: 0.5 }); this.noiseBurst({ gain: 0.3, dur: 0.14, f: 700, q: 1.5 }); } }, 380 + Math.random() * 150);
  }
  rub() { if (!this.ctx || !this.enabled) return; this.noiseBurst({ gain: 0.18, dur: 0.07, f: 1800, q: 3 }); }
  splash() {
    if (!this.ctx || !this.enabled) return;
    this.noiseBurst({ gain: 0.5, dur: 0.45, f: 1500, q: 0.4, type: 'highpass', attack: 0.02 });
    this.noiseBurst({ gain: 0.3, dur: 0.3, f: 400, q: 0.7, attack: 0.03 });
  }
  thud(k = 1) { if (!this.ctx || !this.enabled) return; this.tone({ f: 55, gain: 0.5 * k, dur: 0.16, type: 'sine', slide: 0.6 }); this.noiseBurst({ gain: 0.3 * k, dur: 0.1, f: 350, q: 0.6 }); }
  bell() {
    if (!this.ctx || !this.enabled) return;
    for (const [f, g] of [[1046, 0.3], [2093, 0.15], [1568, 0.1], [2637, 0.06]]) this.tone({ f, gain: g, dur: 1.6, type: 'sine' });
    this.tone({ f: 523, gain: 0.12, dur: 2.0, type: 'triangle' });
  }
  snort() {
    if (!this.ctx || !this.enabled) return;
    this.noiseBurst({ gain: 0.35, dur: 0.35, f: 900, q: 0.6, type: 'lowpass', attack: 0.03 });
    this.tone({ f: 160, gain: 0.08, dur: 0.3, type: 'sawtooth', slide: 0.6 });
  }
  breath() { if (!this.ctx || !this.enabled) return; this.noiseBurst({ gain: 0.08, dur: 0.5, f: 600, q: 0.5, type: 'lowpass', attack: 0.15 }); }
  hup() { if (!this.ctx || !this.enabled) return; this.noiseBurst({ gain: 0.12, dur: 0.12, f: 1500, q: 1.5, attack: 0.01 }); }
  click() { if (!this.ctx || !this.enabled) return; this.tone({ f: 1200, gain: 0.08, dur: 0.05, type: 'square' }); }
  fanfare(good) {
    if (!this.ctx || !this.enabled) return;
    const seq = good ? [523, 659, 784, 1046] : [392, 349];
    seq.forEach((f, i) => setTimeout(() => this.ctx && this.tone({ f, gain: 0.18, dur: 0.35, type: 'triangle' }), i * 110));
  }

  ambient(on, indoor = false) {
    if (!this.ctx) return;
    this.indoor = indoor;
    const c = this.ctx;
    if (on && !this.crowdGain) {
      const mk = (f, q, gain, type = 'bandpass') => {
        const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
        const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
        const g = this.src(0, this.master); s.connect(fl); fl.connect(g); s.start();
        g.gain.setTargetAtTime(gain, c.currentTime, 1.5);
        return { s, g, fl };
      };
      this.crowd = mk(indoor ? 500 : 650, 0.6, indoor ? 0.07 : 0.05);
      this.crowdGain = this.crowd.g;
      this.wind = mk(300, 0.4, indoor ? 0.0 : 0.035, 'lowpass');
      this.windGain = this.wind.g;
      this.murmur = setInterval(() => {
        if (!this.ctx || !this.enabled) return;
        if (Math.random() < 0.35) this.noiseBurst({ gain: 0.03 + Math.random() * 0.03, dur: 0.6 + Math.random(), f: 800 + Math.random() * 600, q: 1.2, attack: 0.3, dest: this.master });
      }, 1400);
    } else if (!on && this.crowdGain) {
      for (const n of [this.crowd, this.wind]) { n.g.gain.setTargetAtTime(0, c.currentTime, 0.4); setTimeout(() => { try { n.s.stop(); } catch { /* ya parado */ } }, 1500); }
      clearInterval(this.murmur);
      this.crowdGain = null; this.windGain = null;
    }
  }
  cheer(level = 1) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx, t = c.currentTime;
    if (this.crowdGain) {
      this.crowdGain.gain.cancelScheduledValues(t);
      this.crowdGain.gain.setTargetAtTime(0.05 + 0.3 * level, t, 0.25);
      this.crowdGain.gain.setTargetAtTime(this.indoor ? 0.07 : 0.05, t + 2.5 + level, 1.2);
    }
    // aplausos: ráfaga de clics
    const n = 40 + 60 * level;
    for (let i = 0; i < n; i++) {
      setTimeout(() => this.ctx && this.noiseBurst({ gain: 0.05 + Math.random() * 0.05, dur: 0.02, f: 2500 + Math.random() * 2000, q: 1, attack: 0.002, dest: this.master }), Math.random() * (1800 + 1500 * level));
    }
  }
  ooh() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    if (this.crowdGain) { this.crowdGain.gain.setTargetAtTime(0.22, t, 0.12); this.crowdGain.gain.setTargetAtTime(this.indoor ? 0.07 : 0.05, t + 1.0, 0.8); }
    this.tone({ f: 220, gain: 0.05, dur: 0.9, type: 'sawtooth', slide: 0.8, dest: this.master });
  }
  // Locutor con síntesis de voz del sistema (si hay voz en español).
  say(text, { force = false } = {}) {
    if (!this.voiceOn || !('speechSynthesis' in window)) return;
    try {
      const ss = window.speechSynthesis;
      if (ss.pending && !force) return;
      if (force) ss.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const voices = ss.getVoices();
      const v = voices.find(x => /^es[-_](AR|MX|US|419)/i.test(x.lang)) || voices.find(x => /^es/i.test(x.lang));
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'es-ES'; u.rate = 1.02; u.pitch = 0.95; u.volume = 0.9;
      ss.speak(u);
    } catch { /* sin voz */ }
  }
  strideBreath(v) { if (!this.ctx || !this.enabled) return; this.noiseBurst({ gain: 0.04 + Math.min(0.08, v * 0.01), dur: 0.22, f: 700, q: 0.7, type: 'lowpass', attack: 0.06 }); }
  creak() { if (!this.ctx || !this.enabled) return; this.noiseBurst({ gain: 0.06, dur: 0.09, f: 320, q: 4, attack: 0.01 }); setTimeout(() => this.ctx && this.noiseBurst({ gain: 0.04, dur: 0.07, f: 420, q: 4 }), 60); }
  jingle() { if (!this.ctx || !this.enabled) return; this.tone({ f: 3200 + Math.random() * 400, gain: 0.02, dur: 0.05, type: 'sine' }); this.tone({ f: 4300, gain: 0.012, dur: 0.04, type: 'sine' }); }
  whoosh() {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx, t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noise; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2600, t + 0.5); f.frequency.exponentialRampToValueAtTime(400, t + 1.1);
    const g = this.src(0, this.master); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.4); g.gain.linearRampToValueAtTime(0, t + 1.2);
    s.connect(f); f.connect(g); s.start(t); s.stop(t + 1.3);
  }
  duck(on) { if (this.master) this.master.gain.setTargetAtTime(this.enabled ? (on ? 0.45 : 0.9) : 0, this.ctx.currentTime, 0.25); }
  update(dt, speed) {
    if (this.windGain && !this.indoor) this.windGain.gain.setTargetAtTime(0.03 + Math.min(0.12, speed * 0.012), this.ctx.currentTime, 0.3);
  }
}
