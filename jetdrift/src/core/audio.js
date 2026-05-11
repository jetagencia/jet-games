// JETDrift — Audio layer (procedural Web Audio)
// Engine hum + ambient pad + arpeggio + SFX
// Theme-specific harmony.

export class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.engine = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.padOscs = [];
    this.padGain = null;
    this.arpTimeout = null;
    this.muted = false;
  }

  ensure() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
    } catch(e) { this.ctx = null; }
  }

  startTheme(themeName) {
    this.ensure();
    if (!this.ctx) return;
    this._startEngine();
    this._startPad(themeName);
    this._startArp(themeName);
  }

  startMode(modeName) {
    // Por ahora la música depende del theme; el modo modula intensidad
    // (futuro: cada modo tiene su propia variación)
  }

  pauseAll() {
    if (!this.master) return;
    this.master.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
  }
  resumeAll() {
    if (!this.master) return;
    this.master.gain.exponentialRampToValueAtTime(0.55, this.ctx.currentTime + 0.2);
  }
  stopAll() {
    if (this.engine) { try { this.engine.stop(); } catch(e){} this.engine = null; }
    for (const o of this.padOscs) { try { o.stop(); } catch(e){} }
    this.padOscs = [];
    if (this.arpTimeout) { clearTimeout(this.arpTimeout); this.arpTimeout = null; }
  }

  // ============================================================
  // ENGINE HUM
  // ============================================================
  _startEngine() {
    if (this.engine) return;
    this.engine = this.ctx.createOscillator();
    this.engine.type = 'sawtooth';
    this.engine.frequency.value = 60;
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 250;
    this.engineFilter.Q.value = 1.4;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engine.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.master);
    this.engine.start();
  }
  setEngineLevel(speed01) {
    if (!this.engineGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.engineGain.gain.cancelScheduledValues(t);
    this.engineGain.gain.linearRampToValueAtTime(0.04 + speed01 * 0.08, t + 0.05);
    if (this.engine) {
      this.engine.frequency.cancelScheduledValues(t);
      this.engine.frequency.linearRampToValueAtTime(55 + speed01 * 100, t + 0.05);
    }
  }

  // ============================================================
  // PAD (ambient drone)
  // ============================================================
  _startPad(themeName) {
    // Stop existing
    for (const o of this.padOscs) { try { o.stop(); } catch(e){} }
    this.padOscs = [];

    // Tonality per theme
    let freqs;
    if (themeName === 'dunes') {
      // D minor pentatonic feel: D2 (73.4), F2 (87.3), A2 (110), D3 (146.8)
      freqs = [73.42, 110.0, 146.83, 220.0];
    } else {
      // Spire — F# minor 7 chord: F#2 (92.5), A2 (110), C#3 (138.6), E3 (164.8)
      freqs = [92.5, 110.0, 138.6, 164.81];
    }

    this.padGain = this.ctx.createGain();
    this.padGain.gain.value = 0.18;
    this.padGain.connect(this.master);

    for (const f of freqs) {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      // Detune slightly for chorus
      o.detune.value = (Math.random() - 0.5) * 12;
      const og = this.ctx.createGain();
      og.gain.value = 0.5;
      o.connect(og);
      og.connect(this.padGain);
      o.start();
      this.padOscs.push(o);
    }
  }

  // ============================================================
  // ARPEGGIO (slow melodic loop)
  // ============================================================
  _startArp(themeName) {
    if (this.arpTimeout) { clearTimeout(this.arpTimeout); this.arpTimeout = null; }

    const notes = themeName === 'dunes'
      ? [293.66, 349.23, 440.0, 587.33, 440.0, 349.23]   // D-F-A-D-A-F (D minor pent)
      : [369.99, 440.0, 554.37, 659.25, 554.37, 440.0];  // F#-A-C#-E (F#m7)

    const interval = themeName === 'dunes' ? 850 : 1100;
    let idx = 0;

    const tick = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      o.type = themeName === 'dunes' ? 'triangle' : 'sine';
      o.frequency.value = notes[idx % notes.length];
      idx++;
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 1800;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (interval / 1000) * 1.3);
      o.connect(filt); filt.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + (interval / 1000) * 1.5);
      this.arpTimeout = setTimeout(tick, interval);
    };
    tick();
  }

  // ============================================================
  // SFX
  // ============================================================
  playPickup() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(523.25, t);
    o.frequency.exponentialRampToValueAtTime(1046.5, t + 0.13);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.2);
  }

  playFanfare() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 659, 783, 1047].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'triangle'; o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.25, t + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.55);
      o.connect(g); g.connect(this.master);
      o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.6);
    });
  }

  playWhoosh() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.value = 1200;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    noise.connect(filt); filt.connect(g); g.connect(this.master);
    noise.start(t);
    filt.frequency.setValueAtTime(2500, t);
    filt.frequency.exponentialRampToValueAtTime(400, t + 0.5);
  }
}
