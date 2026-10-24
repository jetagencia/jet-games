/* JET//Words — música original y efectos, sintetizados en el navegador (Web Audio).
   Composición propia para «pensar»: re mayor con colores de si menor, 74 BPM,
   piano eléctrico de FM suave, bajo redondo, colchón lejano, kalimba que
   improvisa sobre motivos y escobillas muy bajas. Forma A · B · A' · C (respiro),
   y cada vuelta cambia la semilla de la melodía: no se repite igual.
   Sin archivos de audio ni material de terceros.
   API: JWAudio.unlock(), .setMusic(on), .setMusicVol(v), .setSfx(on), .setSfxVol(v), .sfx(nombre, arg)
*/
(function () {
  'use strict';
  const BPM = 74, SPB = 60 / BPM, STEP = SPB / 4;           // semicorchea
  const A4 = 440, mtof = m => A4 * Math.pow(2, (m - 69) / 12);
  let ctx = null, master, musicBus, sfxBus, rev, revIn, comp, unlocked = false;
  let musicOn = true, musicVol = 0.55, sfxOn = true, sfxVol = 0.8;
  let timer = null, nextTime = 0, step = 0, cycle = 0, playing = false;

  // ---------- armonía (MIDI) ----------
  // Cada acorde: [bajo, voces del piano] y escala para la melodía.
  const D = 62;
  const CH = {
    Dmaj9:  { b: 38, v: [54, 57, 61, 64], sc: [62, 64, 66, 69, 71, 73] },
    Bm9:    { b: 35, v: [50, 54, 57, 61], sc: [61, 62, 66, 69, 71, 74] },
    Gmaj7:  { b: 43, v: [54, 59, 62, 66], sc: [62, 66, 67, 69, 71, 74] },
    A7sus:  { b: 45, v: [55, 59, 62, 64], sc: [62, 64, 67, 69, 71, 76] },
    Em9:    { b: 40, v: [55, 59, 62, 66], sc: [62, 64, 66, 67, 71, 74] },
    Fsm7:   { b: 42, v: [52, 57, 61, 64], sc: [61, 64, 66, 69, 73, 76] },
    Gmaj9:  { b: 43, v: [57, 59, 62, 66], sc: [62, 66, 67, 69, 71, 74] },
    Gm6:    { b: 43, v: [52, 58, 62, 64], sc: [62, 64, 67, 70, 74, 76] },
    DF:     { b: 42, v: [54, 57, 61, 62], sc: [61, 62, 64, 66, 69, 73] },
    Bm7:    { b: 35, v: [50, 54, 57, 62], sc: [59, 62, 64, 66, 69, 71] },
    Em7:    { b: 40, v: [50, 55, 59, 62], sc: [62, 64, 67, 69, 71, 74] },
    A13:    { b: 45, v: [55, 59, 61, 66], sc: [61, 64, 66, 69, 71, 73] },
  };
  const SECTIONS = [
    { n: 'A',  bars: ['Dmaj9', 'Bm9', 'Gmaj7', 'A7sus', 'Dmaj9', 'Bm9', 'Gmaj7', 'A7sus'], mel: 0.55, drums: 1, arp: 'up' },
    { n: 'B',  bars: ['Em9', 'Fsm7', 'Gmaj9', 'Gm6', 'DF', 'Bm7', 'Em7', 'A13'], mel: 0.7, drums: 2, arp: 'wave' },
    { n: "A'", bars: ['Dmaj9', 'Bm9', 'Gmaj7', 'A7sus', 'Gmaj9', 'Gm6', 'Dmaj9', 'A13'], mel: 0.8, drums: 2, arp: 'down' },
    { n: 'C',  bars: ['Gmaj9', 'Dmaj9', 'Em9', 'A7sus'], mel: 0.3, drums: 0, arp: 'pad' },
  ];
  const BAR_STEPS = 16;
  const FORM = []; SECTIONS.forEach((s, si) => s.bars.forEach((c, bi) => FORM.push({ si, bi, c })));

  // ---------- azar con semilla (la melodía cambia por vuelta) ----------
  let seed = 7;
  const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
  // motivos rítmicos (en semicorcheas, dentro de un compás) — se eligen por sección y vuelta
  const RHY = [[0, 6, 10], [2, 6, 8, 12], [0, 4, 10, 14], [4, 7, 12], [0, 3, 8], [6, 10, 12, 14], [0, 8, 11]];
  let motif = { A: null, B: null, "A'": null, C: null };
  function newMotifs() {
    for (const k in motif) motif[k] = { r: RHY[Math.floor(rnd() * RHY.length)], c: [Math.floor(rnd() * 6), Math.floor(rnd() * 6), Math.floor(rnd() * 6), Math.floor(rnd() * 6)] };
  }

  // ---------- grafo ----------
  function build() {
    master = ctx.createGain(); master.gain.value = 1;
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? musicVol * 0.7 : 0; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? sfxVol * 0.6 : 0; sfxBus.connect(master);
    // reverberación: respuesta de impulso generada (ruido con caída), sin archivos
    rev = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 3.2), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    rev.buffer = ir;
    revIn = ctx.createGain(); revIn.gain.value = 0.9;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
    revIn.connect(lp); lp.connect(rev); rev.connect(musicBus);
  }
  function out(node, wet, bus) { node.connect(bus || musicBus); if (wet) { const s = ctx.createGain(); s.gain.value = wet; node.connect(s); s.connect(revIn); } }

  // ---------- voces ----------
  function ep(t, m, dur, vel) {            // piano eléctrico: FM sine, campana suave
    const f = mtof(m), car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    car.type = 'sine'; mod.type = 'sine'; car.frequency.value = f; mod.frequency.value = f * 1; car.detune.value = (Math.random() - 0.5) * 6;
    mg.gain.setValueAtTime(f * 1.4, t); mg.gain.exponentialRampToValueAtTime(f * 0.08, t + 0.6);
    mod.connect(mg); mg.connect(car.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.11 * vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.045 * vel, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.8);
    car.connect(g); out(g, 0.35);
    car.start(t); mod.start(t); car.stop(t + dur + 0.9); mod.stop(t + dur + 0.9);
  }
  function bass(t, m, dur) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m);
    lp.type = 'lowpass'; lp.frequency.value = 420;
    const g2 = ctx.createGain(); g2.gain.value = 0.35; o2.connect(g2); g2.connect(lp); o.connect(lp);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + 0.03); g.gain.exponentialRampToValueAtTime(0.09, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
    lp.connect(g); out(g, 0.05);
    o.start(t); o2.start(t); o.stop(t + dur + 0.2); o2.stop(t + dur + 0.2);
  }
  function pad(t, ms, dur, vol) {
    const lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(700, t); lp.frequency.linearRampToValueAtTime(1300, t + dur / 2); lp.frequency.linearRampToValueAtTime(800, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 1.2); g.gain.setValueAtTime(vol, t + dur - 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.4);
    lp.connect(g); out(g, 0.8);
    ms.forEach(m => [-8, 7].forEach(dt => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; const og = ctx.createGain(); og.gain.value = 0.18 / ms.length; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 1.5); }));
  }
  function kalimba(t, m, vel, bus, wet) {   // nota de la melodía y de los efectos
    const f = mtof(m), o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = 'sine'; o2.type = 'sine'; o.frequency.value = f; o2.frequency.value = f * 4.02;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16 * vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    g2.gain.setValueAtTime(0.05 * vel, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); o2.connect(g2); g2.connect(g); out(g, wet == null ? 0.45 : wet, bus);
    o.start(t); o2.start(t); o.stop(t + 1.4); o2.stop(t + 0.2);
  }
  let noiseBuf = null;
  function noise() { if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } const s = ctx.createBufferSource(); s.buffer = noiseBuf; return s; }
  function brush(t, vol, dur, freq, bus) {
    const s = noise(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = 'bandpass'; bp.frequency.value = freq || 6500; bp.Q.value = 0.8;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.09));
    s.connect(bp); bp.connect(g); out(g, 0.1, bus);
    s.start(t, Math.random() * 0.5); s.stop(t + (dur || 0.09) + 0.02);
  }
  function softKick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g); out(g, 0); o.start(t); o.stop(t + 0.4);
  }

  // ---------- secuenciador ----------
  function schedStep(t, s) {
    const total = FORM.length * BAR_STEPS, pos = s % total, barIx = Math.floor(pos / BAR_STEPS), st = pos % BAR_STEPS;
    if (pos === 0) { cycle++; seed = (cycle * 2654435761) >>> 0 || 7; newMotifs(); }
    const fb = FORM[barIx], sec = SECTIONS[fb.si], ch = CH[fb.c];
    const last = fb.bi === sec.bars.length - 1;
    // piano eléctrico
    if (sec.arp === 'pad') {
      if (st === 0) { pad(t, ch.v, BAR_STEPS * STEP, 0.07); ch.v.forEach((m, i) => ep(t + i * 0.05, m, 2.4, 0.5)); }
    } else {
      if (st === 0) ch.v.forEach((m, i) => ep(t + i * 0.022, m, 1.6, 0.75));
      const pat = sec.arp === 'up' ? [6, 10, 14] : sec.arp === 'down' ? [6, 9, 12] : [4, 10, 13];
      const ix = pat.indexOf(st);
      if (ix >= 0) { const vv = sec.arp === 'down' ? ch.v.slice().reverse() : ch.v; ep(t, vv[(ix + fb.bi) % vv.length] + (ix === 2 && cycle % 2 ? 12 : 0), 0.9, 0.42); }
      if (st === 0 && fb.bi % 4 === 0) pad(t, [ch.v[0], ch.v[2]], BAR_STEPS * STEP * 2, 0.045);
    }
    // bajo
    if (st === 0) bass(t, ch.b, sec.drums ? SPB * 2.2 : SPB * 3.5);
    if (sec.drums && st === 10) bass(t, ch.b + (fb.bi % 2 ? 7 : 12), SPB * 1.1);
    if (sec.drums === 2 && st === 14 && !last) bass(t, ch.b + 7, SPB * 0.4);
    // escobillas y pulso
    if (sec.drums) {
      if (st % 4 === 2) brush(t, 0.035 + (st === 6 || st === 14 ? 0.015 : 0), 0.08);
      if (sec.drums === 2 && st % 2 === 1 && rnd() < 0.35) brush(t, 0.012, 0.05, 8000);
      if (st === 0 || (sec.drums === 2 && st === 9)) softKick(t);
      if (st === 8) brush(t, 0.05, 0.22, 2400);
    }
    // melodía: motivo de la sección + variaciones; descansa en el último compás de cada frase
    const mo = motif[sec.n];
    if (mo && !(last && st > 8)) {
      const k = mo.r.indexOf(st);
      if (k >= 0 && rnd() < sec.mel + (fb.bi % 2 ? -0.1 : 0.1)) {
        const vary = (fb.bi >= 4 && rnd() < 0.5) ? 1 : 0;
        let deg = (mo.c[k % 4] + vary + (fb.bi % 2)) % ch.sc.length;
        let m = ch.sc[deg] + (sec.n === 'C' ? 12 : 0);
        kalimba(t + (rnd() - 0.5) * 0.012, m, 0.55 + rnd() * 0.25);
        if (sec.n === "A'" && rnd() < 0.25) kalimba(t + STEP * 2, ch.sc[(deg + 2) % ch.sc.length], 0.35);
      }
    }
  }
  function tick() {
    if (!ctx) return;
    while (nextTime < ctx.currentTime + 0.25) { schedStep(nextTime, step); step++; nextTime += STEP; }
  }
  function startMusic() {
    if (!ctx || playing || !musicOn || document.hidden) return;
    playing = true; nextTime = ctx.currentTime + 0.12;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(0.0001, ctx.currentTime); musicBus.gain.linearRampToValueAtTime(musicVol * 0.7, ctx.currentTime + 2.5);
    timer = setInterval(tick, 40); tick();
  }
  function stopMusic(fade) {
    if (!playing) return;
    playing = false; clearInterval(timer); timer = null;
    if (ctx) { const t = ctx.currentTime; musicBus.gain.cancelScheduledValues(t); musicBus.gain.setValueAtTime(musicBus.gain.value, t); musicBus.gain.linearRampToValueAtTime(0.0001, t + (fade || 0.4)); }
  }

  // ---------- efectos (afinados en re mayor, como la música) ----------
  const SFX = {
    key() { brush(ctx.currentTime, 0.05 + Math.random() * 0.02, 0.03, 3200 + Math.random() * 800, sfxBus); },
    del() { brush(ctx.currentTime, 0.05, 0.05, 1600, sfxBus); },
    tile(r, i) { const t = ctx.currentTime; const m = r === 'correct' ? [74, 76, 78, 81, 83][i] : r === 'present' ? [69, 71, 69, 71, 73][i] : 62; kalimba(t, m, r === 'absent' ? 0.35 : 0.7, sfxBus, 0.2); },
    bad() { const t = ctx.currentTime; kalimba(t, 58, 0.5, sfxBus, 0.1); kalimba(t + 0.09, 57, 0.45, sfxBus, 0.1); },
    win() { const t = ctx.currentTime; [74, 78, 81, 86, 88, 93].forEach((m, i) => kalimba(t + i * 0.09, m, 0.65, sfxBus, 0.5)); },
    lose() { const t = ctx.currentTime; [69, 66, 62, 59].forEach((m, i) => kalimba(t + i * 0.16, m, 0.5, sfxBus, 0.5)); },
    ui() { kalimba(ctx.currentTime, 81, 0.35, sfxBus, 0.3); },
  };

  function unlock() {
    if (unlocked && ctx) { if (ctx.state === 'suspended' && !document.hidden) ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ctx = new AC(); } catch (e) { return; }
    unlocked = true; build(); newMotifs();
    if (ctx.state === 'suspended') ctx.resume();
    startMusic();
  }
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { stopMusic(0.1); ctx.suspend && ctx.suspend(); }
    else { ctx.resume && ctx.resume(); startMusic(); }
  });

  window.JWAudio = {
    unlock,
    get ready() { return !!ctx; },
    setMusic(on) { musicOn = !!on; if (!ctx) return; if (musicOn) startMusic(); else stopMusic(0.5); },
    setMusicVol(v) { musicVol = Math.max(0, Math.min(1, v)); if (ctx && playing) { musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setTargetAtTime(musicVol * 0.7, ctx.currentTime, 0.05); } },
    setSfx(on) { sfxOn = !!on; if (ctx) sfxBus.gain.value = sfxOn ? sfxVol * 0.6 : 0; },
    setSfxVol(v) { sfxVol = Math.max(0, Math.min(1, v)); if (ctx) sfxBus.gain.value = sfxOn ? sfxVol * 0.6 : 0; },
    sfx(name, a, b) { if (!ctx || !sfxOn || ctx.state !== 'running' || !SFX[name]) return; try { SFX[name](a, b); } catch (e) {} },
    get playing() { return playing; },
    get section() { if (!ctx) return null; const p = (step % (FORM.length * BAR_STEPS)); return SECTIONS[FORM[Math.floor(p / BAR_STEPS)].si].n; },
  };
})();
