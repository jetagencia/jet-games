/* JET//Telemetría — núcleo de audio: contexto, buses, reverb generada, limitador y preferencias.
   La música (src/musica.js) y los efectos (src/sfx.js) se cuelgan de aquí. Nada suena antes del primer gesto.
   cadena(ctx) arma la misma mezcla para el contexto en vivo y para el OfflineAudioContext de la muestra WAV:
   música ~7,5 dB por debajo de los efectos → bus maestro → compresor de pegamento → limitador → recorte suave. */
var AUDIO = (function () {
  'use strict';
  var ctx = null, C = null, noiseBuf = null;
  var prefs = { music: true, musicVol: 0.7, sfx: true, sfxVol: 0.85 };
  var MUS_REL = 0.8; // calibrado con AUDIO.pico: la música queda ~7 dB por debajo de los efectos de resultado
  var listeners = [];
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // Respuesta de sala generada: ruido estéreo con decaimiento exponencial, primeras reflexiones y cola oscura
  function crearIR(c, seg, decae) {
    var sr = c.sampleRate, n = Math.floor(sr * seg), b = c.createBuffer(2, n, sr), semilla = 1234567;
    function rnd() { semilla = (Math.imul(semilla, 1103515245) + 12345) & 0x7fffffff; return semilla / 0x3fffffff - 1; }
    for (var ch = 0; ch < 2; ch++) {
      var d = b.getChannelData(ch), lp = 0;
      for (var i = 0; i < n; i++) {
        var t = i / n, x = rnd();
        lp += (x - lp) * (0.55 - 0.45 * t);                 // cola que se oscurece
        var v = lp * Math.pow(1 - t, decae);
        if (i < sr * 0.01) v *= i / (sr * 0.01);
        d[i] = v;
      }
      [0.011, 0.019, 0.027, 0.041].forEach(function (s, k) { var j = Math.floor((s + ch * 0.003) * sr); if (j < n) d[j] += (k % 2 ? -0.5 : 0.6) * (1 - k * 0.18); });
    }
    return b;
  }
  function curvaRecorte() {
    var n = 2048, cu = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1, a = Math.abs(x); cu[i] = a < 0.85 ? x : Math.sign(x) * (0.85 + 0.15 * Math.tanh((a - 0.85) / 0.15)); }
    return cu;
  }
  function cadena(c, destino) {
    var o = {};
    o.master = c.createGain(); o.master.gain.value = 0.82;
    o.glue = c.createDynamicsCompressor();
    o.glue.threshold.value = -18; o.glue.knee.value = 10; o.glue.ratio.value = 2.2; o.glue.attack.value = 0.02; o.glue.release.value = 0.25;
    o.lim = c.createDynamicsCompressor();
    o.lim.threshold.value = -3; o.lim.knee.value = 0; o.lim.ratio.value = 20; o.lim.attack.value = 0.001; o.lim.release.value = 0.12;
    o.clip = c.createWaveShaper(); o.clip.curve = curvaRecorte(); o.clip.oversample = 'none';
    o.master.connect(o.glue); o.glue.connect(o.lim); o.lim.connect(o.clip); o.clip.connect(destino || c.destination);
    o.musBus = c.createGain(); o.sfxBus = c.createGain(); o.duck = c.createGain();
    o.musBus.connect(o.duck); o.duck.connect(o.master); o.sfxBus.connect(o.master);
    // reverb por convolución con respuesta generada, con paso alto para no embarrar los graves
    o.rev = c.createGain();
    var hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180;
    var conv = c.createConvolver(); conv.buffer = crearIR(c, 3.6, 2.8); // cola audible de ~4,5 s de sala; se recorta lo que queda bajo −45 dB para ahorrar CPU en teléfonos
    var ret = c.createGain(); ret.gain.value = 0.5;
    o.rev.connect(hp); hp.connect(conv); conv.connect(ret); ret.connect(o.master);
    // medidor de picos antes del limitador (para pruebas)
    o.an = c.createAnalyser(); o.an.fftSize = 2048; o.master.connect(o.an);
    return o;
  }
  function init() {
    if (ctx) { if (ctx.state !== 'running' && !document.hidden) ctx.resume().catch(function () {}); return true; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { ctx = new AC(); } catch (e2) { return false; } }
    C = cadena(ctx);
    aplicar(true);
    if (ctx.state !== 'running') ctx.resume().catch(function () {});
    listeners.forEach(function (f) { try { f(ctx); } catch (e) {} });
    return true;
  }
  function onReady(f) { listeners.push(f); if (ctx) f(ctx); }
  function aplicar(inmediato) {
    if (!ctx) return;
    var t = ctx.currentTime, mv = prefs.music ? prefs.musicVol * prefs.musicVol * MUS_REL : 0, sv = prefs.sfx ? prefs.sfxVol * prefs.sfxVol : 0; // curva cuadrática: el deslizador suena parejo
    if (inmediato) { C.musBus.gain.value = mv; C.sfxBus.gain.value = sv; return; }
    C.musBus.gain.cancelScheduledValues(t); C.musBus.gain.setTargetAtTime(mv, t, 0.08);
    C.sfxBus.gain.cancelScheduledValues(t); C.sfxBus.gain.setTargetAtTime(sv, t, 0.05);
  }
  function setPrefs(p) { for (var k in p) if (k in prefs) prefs[k] = p[k]; aplicar(false); }
  function suspend() { if (ctx && ctx.state === 'running') ctx.suspend().catch(function () {}); }
  function resume() { if (ctx && ctx.state !== 'running' && !document.hidden) ctx.resume().catch(function () {}); }
  // baja la música un momento para que un efecto importante se oiga limpio
  function agachar(db, seg) {
    if (!C) return; var t = ctx.currentTime, g = C.duck.gain, v = Math.pow(10, -(db || 5) / 20);
    g.cancelScheduledValues(t); g.setTargetAtTime(v, t, 0.03); g.setTargetAtTime(1, t + (seg || 0.6), 0.35);
  }
  function ruidoDe(c) {
    var n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), s = 98765;
    for (var i = 0; i < n; i++) { s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff; d[i] = s / 0x3fffffff - 1; }
    return b;
  }
  function ruido() { return noiseBuf || (noiseBuf = ruidoDe(ctx)); }
  // pico (dBFS) en la entrada del limitador durante ~ms: solo para pruebas automáticas
  function pico(ms) {
    return new Promise(function (res) {
      if (!C) return res(-Infinity);
      var a = C.an, buf = new Float32Array(a.fftSize), p = 0, t0 = performance.now();
      (function f() { a.getFloatTimeDomainData(buf); for (var i = 0; i < buf.length; i++) { var v = Math.abs(buf[i]); if (v > p) p = v; } if (performance.now() - t0 < ms) setTimeout(f, 20); else res(20 * Math.log10(p || 1e-9)); })();
    });
  }
  return {
    init: init, onReady: onReady, setPrefs: setPrefs, suspend: suspend, resume: resume, mtof: mtof, ruido: ruido, ruidoDe: ruidoDe, cadena: cadena, pico: pico, agachar: agachar, MUS_REL: MUS_REL,
    get ctx() { return ctx; }, get musBus() { return C && C.musBus; }, get sfxBus() { return C && C.sfxBus; }, get rev() { return C && C.rev; },
    get prefs() { return prefs; }, activo: function () { return !!ctx && ctx.state === 'running'; }
  };
})();
