/* JET//Señal — música y efectos sintetizados con Web Audio. Composición original del juego.
   Fa# lidio, 72 BPM, 4/4. Nada de samples: todo sale de osciladores, ruido generado y una reverb por convolución
   calculada al vuelo.

   Temas
   · «Órbita quieta» (menú): Intro 4 · A 8 · A' 8 · B 8 · Puente 4 = 32 compases ≈ 107 s, tres variaciones por vuelta
     (instrumento que lleva la melodía, ritmo, voicing del pad y del bajo): el ciclo completo dura ≈ 5 min 20 s.
   · «Escucha» (juego): Intro 4 · A 8 · A' 8 · B 8 · Puente 4 · A'' 8 · Coda 2 = 42 compases ≈ 140 s, por capas que
     siguen la partida (base, reloj y arpegio, pulso y contracanto, hipótesis, evidencia) y tres variaciones por vuelta.
   · La «capa de evidencia» toca el registro de la partida: cada aceptada es un grado alto, cada rechazada uno bajo.

   Instrumentos: campana FM de vidrio, vidrio pulsado (marimba de vidrio), «voz de señal» con portamento y vibrato
   (tipo theremin), pad «horizonte» de sierras desafinadas en estéreo, bajo sub, bombo, tic de reloj, aro, maraca de
   ruido, estática de radio, chirridos y un morse que deletrea «JET».

   Mezcla: buses de música y efectos con su propia reverb (si la música está apagada no queda ni la cola), eco
   ping-pong de corchea con puntillo solo para la música, música ~7 dB debajo de los efectos, «ducking» breve en los
   veredictos, filtro de pausa, compresor de pegamento + limitador + recorte suave final (nunca satura).

   API (la usa app.js): SAudio.iniciar(), .prefs({musica,volMusica,efectos,volEfectos}), .tema('menu'|'juego'|null),
        .capas({uno,dos,hip}), .evidencia([1,0,...]), .sfx(nombre, arg), .suspender(), .reanudar(), .pulso(),
        .amortiguar(bool), .corriendo(), .renderWav(segundos, opciones) -> Promise<ArrayBuffer>. */
(function (G) {
  'use strict';
  const BPM = 72, NEGRA = 60 / BPM, COMPAS = NEGRA * 4, CORCHEA = NEGRA / 2, SEMI = NEGRA / 4;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // Fa# lidio: F# G# A# B# C# D# E#
  const ESCALA = [0, 2, 4, 6, 7, 9, 11];
  const grado = (g, oct) => 54 + ESCALA[((g % 7) + 7) % 7] + 12 * (Math.floor(g / 7) + (oct || 0)); // grado 0 = F#3
  const EN_ESCALA = new Set([6, 8, 10, 0, 1, 3, 5]); // clases de altura de F# lidio (F#=6 … E#=5)
  const ajustar = m => { m = Math.round(m); for (let d = 0; d < 3; d++) { if (EN_ESCALA.has(((m + d) % 12 + 12) % 12)) return m + d; if (EN_ESCALA.has(((m - d) % 12 + 12) % 12)) return m - d; } return m; };
  function azar(sem) { // mulberry32: la música es determinista (la misma vuelta suena igual, y la muestra WAV también)
    let a = sem >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // acordes: pad (cerrado), bajo, arpegio de 5
  const AC = {
    I: { pad: [54, 58, 61, 65, 72], bajo: 42, arp: [66, 70, 73, 77, 72] },   // Fa#maj7(#11)
    II: { pad: [56, 60, 63, 68], bajo: 44, arp: [68, 72, 75, 80, 63] },      // Sol# mayor (el II mayor lidio)
    vi: { pad: [51, 54, 58, 61], bajo: 39, arp: [63, 66, 70, 73, 61] },      // Re#m7
    Vs: { pad: [49, 54, 56, 61], bajo: 37, arp: [61, 66, 68, 73, 56] },      // Do#sus4
    iii: { pad: [58, 61, 65, 68], bajo: 46, arp: [70, 73, 77, 80, 65] },     // La#m7
    hip: { pad: [60, 63, 66, 70] }                                             // Si#ø7: la «pregunta» sostenida
  };
  const abrir = notas => notas.map((m, i) => (i === 1 ? m + 12 : m)).sort((a, b) => a - b); // voicing abierto (drop 2)

  // ---------- curva de recorte suave (techo 0,98) ----------
  function curvaRecorte() {
    const n = 2048, c = new Float32Array(n), u = 0.82, r = 0.16;
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1, ax = Math.abs(x);
      c[i] = Math.sign(x) * (ax <= u ? ax : u + r * Math.tanh((ax - u) / r));
    }
    return c;
  }
  // ---------- respuesta al impulso: primeras reflexiones + cola de 4,5 s que se oscurece ----------
  function respuesta(ctx, segundos, semilla) {
    const sr = ctx.sampleRate, len = Math.floor(sr * segundos), ir = ctx.createBuffer(2, len, sr), rnd = azar(semilla);
    const refl = [[0.011, 0.5], [0.019, 0.42], [0.027, 0.36], [0.041, 0.3], [0.053, 0.24], [0.071, 0.2]];
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const tt = i / sr, w = rnd() * 2 - 1;
        const k = 0.08 + 0.85 * Math.min(1, tt / segundos);   // la cola pierde agudos con el tiempo
        lp += (w - lp) * (1 - k);
        const env = Math.pow(1 - i / len, 2.2) * Math.exp(-tt / 1.25);
        d[i] = lp * env * clamp(tt / 0.012, 0, 1) * 0.9;
      }
      for (const [tt, a] of refl) { const i = Math.floor((tt + ch * 0.0037) * sr); if (i < len) d[i] += (ch ? -a : a) * (0.8 + rnd() * 0.4); }
    }
    return ir;
  }

  // equipos modestos (teléfonos de gama baja): una sierra por nota en el pad, reverb más corta, maraca en corcheas
  const LIGERO = (() => { try { return (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 2; } catch (e) { return false; } })();
  function Motor(ctx, destino, ligero) {
    const M = this, c = ctx;
    M.ctx = c; M.ligero = ligero == null ? LIGERO : !!ligero;
    const gan = v => { const g = c.createGain(); g.gain.value = v; return g; };
    M.gan = gan;
    M.panOk = typeof c.createStereoPanner === 'function';
    // cadena final: master → pegamento → limitador → recorte suave
    M.master = gan(1.15);
    const pega = c.createDynamicsCompressor();
    pega.threshold.value = -20; pega.ratio.value = 2.4; pega.knee.value = 10; pega.attack.value = 0.02; pega.release.value = 0.35;
    const lim = c.createDynamicsCompressor();
    lim.threshold.value = -4; lim.ratio.value = 20; lim.knee.value = 0; lim.attack.value = 0.0015; lim.release.value = 0.12;
    const rec = c.createWaveShaper(); rec.curve = curvaRecorte(); rec.oversample = '2x';
    M.master.connect(pega); pega.connect(lim); lim.connect(rec); rec.connect(destino || c.destination);
    M.lim = lim; M.rec = rec; // ganchos de prueba: medir la salida real
    // bus de música: volumen → filtro de pausa → ducking → master
    M.mus = gan(0.42);
    M.musLP = c.createBiquadFilter(); M.musLP.type = 'lowpass'; M.musLP.frequency.value = 18000; M.musLP.Q.value = 0.5;
    M.musPausa = gan(1);
    M.musDuck = gan(1);
    M.mus.connect(M.musLP); M.musLP.connect(M.musPausa); M.musPausa.connect(M.musDuck); M.musDuck.connect(M.master);
    // bus de efectos
    M.fx = gan(0.9); M.fx.connect(M.master);
    // una sola reverb compartida (la convolución es lo más caro del motor). Los envíos de cada bus pasan por un
    // espejo de su volumen: con la música apagada no queda ni la cola de la música.
    const conv = c.createConvolver(); conv.normalize = true; conv.buffer = respuesta(c, M.ligero ? 2.8 : 4.2, 12345);
    const pre = c.createDelay(0.1); pre.delayTime.value = 0.028;
    const revSal = gan(0.55);
    pre.connect(conv); conv.connect(revSal); revSal.connect(M.master);
    M.musRevEsp = gan(0.42); M.musRevPausa = gan(1); M.musRevEsp.connect(M.musRevPausa); M.musRevPausa.connect(pre);
    M.fxRevEsp = gan(0.9 * 0.8); M.fxRevEsp.connect(pre);
    M.musRev = gan(1.1); M.musRev.connect(M.musRevEsp);
    M.fxRev = gan(0.85); M.fxRev.connect(M.fxRevEsp);
    // eco ping-pong de corchea con puntillo, solo música
    M.musDel = (function () {
      const ent = gan(1), dI = c.createDelay(2), dD = c.createDelay(2);
      dI.delayTime.value = NEGRA * 0.75; dD.delayTime.value = NEGRA * 0.75;
      const fI = c.createBiquadFilter(), fD = c.createBiquadFilter(); fI.type = fD.type = 'lowpass'; fI.frequency.value = 2600; fD.frequency.value = 2200;
      const rI = gan(0.38), rD = gan(0.38), sal = gan(0.32);
      let pI = sal, pD = sal;
      if (M.panOk) { pI = c.createStereoPanner(); pI.pan.value = -0.75; pD = c.createStereoPanner(); pD.pan.value = 0.75; pI.connect(sal); pD.connect(sal); }
      ent.connect(dI); dI.connect(fI); fI.connect(pI); fI.connect(rI); rI.connect(dD);
      dD.connect(fD); fD.connect(pD); fD.connect(rD); rD.connect(dI);
      sal.connect(M.mus); const sr_ = gan(0.25); sal.connect(sr_); sr_.connect(M.musRev);
      return ent;
    })();
    M.fxB = { in: M.fx, rev: M.fxRev, del: null };
    // capas de la música (cada una con su seco, su envío a reverb y su envío a eco)
    M.capa = M.nuevasCapas(true);
    // ruidos
    const sr = c.sampleRate, rnd = azar(777);
    const nb = c.createBuffer(1, sr * 2, sr), nd = nb.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < nd.length; i++) { const w = rnd() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526; nd[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
    M.ruido = nb;
    const wb = c.createBuffer(1, sr, sr), wd = wb.getChannelData(0);
    for (let i = 0; i < wd.length; i++) wd[i] = rnd() * 2 - 1;
    M.blanco = wb;
    M.rndRuido = azar(4242);
    M.estatica = null;
  }
  const CAPAS = ['base', 'mel', 'uno', 'dos', 'hip', 'evid'];
  Motor.prototype = {
    nuevasCapas(abiertas) {
      const o = {};
      for (const n of CAPAS) {
        const v = abiertas && (n === 'base' || n === 'mel') ? 1 : 0;
        const L = { in: this.gan(v), rev: this.gan(v), del: this.gan(v), v };
        L.in.connect(this.mus); L.rev.connect(this.musRev); L.del.connect(this.musDel);
        o[n] = L;
      }
      return o;
    },
    nivel(L, v, t, tc) {
      const now = this.ctx.currentTime;
      for (const g of [L.in, L.rev, L.del]) {
        const p = g.gain;
        try { p.cancelScheduledValues(now); p.setValueAtTime(p.value, now); } catch (e) { /* nada */ }
        p.setTargetAtTime(v, Math.max(now, t), tc);
      }
      L.v = v;
    },
    // conecta la salida de una nota a una capa: seco + envíos, con paneo
    salida(g, L, envio, pan, eco) {
      const c = this.ctx;
      let n = g;
      if (pan && this.panOk) { const p = c.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); n = p; }
      n.connect(L.in);
      if (envio > 0) { const s = this.gan(envio); n.connect(s); s.connect(L.rev); }
      if (eco > 0 && L.del) { const d = this.gan(eco); n.connect(d); d.connect(L.del); }
    },
    // ---------- instrumentos ----------
    // campana FM de vidrio (portadora:moduladora 1:3,5, índice que decae)
    campana(m, t, vel, dur, L, envio, pan, eco) {
      const c = this.ctx, f = mtof(m);
      const car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain();
      car.frequency.value = f; mod.frequency.value = f * 3.5;
      const idx = f * clamp(2.6 - (m - 66) * 0.05, 0.9, 2.6) * vel; // las agudas, con menos índice: brillo sin dureza
      mg.gain.setValueAtTime(idx, t); mg.gain.exponentialRampToValueAtTime(f * 0.03 + 0.01, t + Math.min(dur, 1.1));
      mod.connect(mg); mg.connect(car.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2 * vel, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      car.connect(g);
      this.salida(g, L, envio == null ? 0.5 : envio, pan, eco);
      car.start(t); mod.start(t); car.stop(t + dur + 0.05); mod.stop(t + dur + 0.05);
    },
    // vidrio pulsado: fundamental + parcial 4 que se apaga rápido (marimba de vidrio)
    vidrio(m, t, vel, dur, L, envio, pan, eco) {
      const c = this.ctx, f = mtof(m);
      const o1 = c.createOscillator(), o2 = c.createOscillator(), g1 = c.createGain(), g2 = c.createGain(), g = c.createGain();
      o1.frequency.value = f; o2.frequency.value = f * 3.98; o1.type = 'sine'; o2.type = 'sine';
      g1.gain.value = 1;
      g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.45, t + 0.002); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.24 * vel, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o1.connect(g1); o2.connect(g2); g1.connect(g); g2.connect(g);
      this.salida(g, L, envio == null ? 0.35 : envio, pan, eco);
      o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + 0.15);
    },
    // voz de señal: seno + triángulo, portamento desde la nota anterior, vibrato que entra tarde
    voz(m, t, vel, dur, L, previa, pan) {
      const c = this.ctx, f = mtof(m);
      const o1 = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain(), lp = c.createBiquadFilter(), g = c.createGain();
      o1.type = 'sine'; o2.type = 'triangle'; g2.gain.value = 0.3;
      const ligada = previa != null && previa !== m;
      for (const o of [o1, o2]) {
        if (ligada) { o.frequency.setValueAtTime(mtof(previa), t); o.frequency.exponentialRampToValueAtTime(f, t + 0.13); } else o.frequency.setValueAtTime(f, t);
      }
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.1;
      lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(0, t + 0.45); lg.gain.linearRampToValueAtTime(16, t + 1.1);
      lfo.connect(lg); lg.connect(o1.detune); lg.connect(o2.detune);
      lp.type = 'lowpass'; lp.frequency.value = 2300; lp.Q.value = 0.8;
      const at = ligada ? 0.05 : 0.16, nivel = 0.075 * vel, fin = t + Math.max(dur, at + 0.1);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(nivel, t + at);
      g.gain.setValueAtTime(nivel, fin - 0.05); g.gain.linearRampToValueAtTime(nivel * 0.8, fin); g.gain.linearRampToValueAtTime(0.0001, fin + 0.4);
      o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g);
      this.salida(g, L, 0.6, pan, 0.22);
      const fin2 = fin + 0.45;
      o1.start(t); o2.start(t); lfo.start(t); o1.stop(fin2); o2.stop(fin2); lfo.stop(fin2);
    },
    // pad «horizonte»: sierras desafinadas ±7 cents, una a cada lado, filtro con LFO lento
    pad(notas, t, dur, vel, L, brillo) {
      const c = this.ctx;
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.05; lg.gain.value = 260; lfo.connect(lg);
      const g = c.createGain();
      const at = Math.min(1.6, dur * 0.4), rel = 1.8, nivel = 0.036 * vel;
      const nv = this.ligero ? nivel * 1.35 : nivel;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(nv, t + at); g.gain.setValueAtTime(nv, t + dur); g.gain.linearRampToValueAtTime(0.0001, t + dur + rel);
      const lados = [-7, 7].map((det, i) => {
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900 * (brillo || 1); lp.Q.value = 0.6;
        lg.connect(lp.frequency);
        let n = lp;
        if (this.panOk) { const p = c.createStereoPanner(); p.pan.value = i ? 0.45 : -0.45; lp.connect(p); n = p; }
        n.connect(g);
        return { lp, det };
      });
      this.salida(g, L, 0.7, 0, 0);
      notas.forEach((m, k) => {
        lados.forEach(({ lp, det }, j) => {
          if (this.ligero && (k + j) % 2) return; // ligero: una sierra por nota, alternando el lado
          const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det;
          o.connect(lp); o.start(t); o.stop(t + dur + rel + 0.1);
        });
      });
      lfo.start(t); lfo.stop(t + dur + rel + 0.1);
    },
    sub(m, t, dur, vel, L) {
      const c = this.ctx, g = c.createGain();
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m);
      const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = mtof(m); const g2 = c.createGain(); g2.gain.value = 0.2;
      const at = Math.min(0.25, dur * 0.3);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12 * vel, t + at); g.gain.setValueAtTime(0.12 * vel, t + Math.max(at, dur - 0.3)); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4);
      o.connect(g); o2.connect(g2); g2.connect(g);
      this.salida(g, L, 0, 0, 0);
      o.start(t); o2.start(t); o.stop(t + dur + 0.5); o2.stop(t + dur + 0.5);
    },
    bombo(t, vel, L) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(), o2 = c.createOscillator(), g2 = c.createGain();
      o.frequency.setValueAtTime(105, t); o.frequency.exponentialRampToValueAtTime(43, t + 0.16);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.33 * vel, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      // armónico corto para que se oiga en parlantes de teléfono
      o2.type = 'triangle'; o2.frequency.setValueAtTime(220, t); o2.frequency.exponentialRampToValueAtTime(90, t + 0.05);
      g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.1 * vel, t + 0.003); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      o.connect(g); o2.connect(g2); g2.connect(g);
      this.salida(g, L, 0.08, 0, 0);
      o.start(t); o2.start(t); o.stop(t + 0.45); o2.stop(t + 0.08);
    },
    ruidoCorto(t, dur, tipo, frec, q, vel, L, envio, pan) {
      const c = this.ctx, s = c.createBufferSource(); s.buffer = this.blanco;
      const f = c.createBiquadFilter(); f.type = tipo; f.frequency.value = frec; f.Q.value = q;
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vel), t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g);
      this.salida(g, L, envio || 0, pan || 0, 0);
      s.start(t, this.rndRuido() * 0.6); s.stop(t + dur + 0.02);
    },
    tic(t, vel, L) { this.ruidoCorto(t, 0.035, 'highpass', 6500, 0.7, 0.12 * vel, L, 0.2, 0); },
    aro(t, vel, L) { this.ruidoCorto(t, 0.14, 'bandpass', 1700, 6, 0.12 * vel, L, 0.4, -0.15); },
    maraca(t, vel, L) { this.ruidoCorto(t, 0.05, 'highpass', 8200, 0.9, 0.07 * vel, L, 0, 0); },
    iniciarEstatica(L) {
      const c = this.ctx;
      if (!this.estatica) {
        const s = c.createBufferSource(); s.buffer = this.ruido; s.loop = true;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 3;
        const g = this.gan(0.03);
        s.connect(f); f.connect(g); s.start();
        this.estatica = { s, f, g };
      }
      try { this.estatica.g.disconnect(); } catch (e) { /* nada */ }
      this.estatica.g.connect(L.in);
    },
    chirrido(t, L) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = 'sine'; o.frequency.setValueAtTime(2400, t); o.frequency.exponentialRampToValueAtTime(600, t + 0.9);
      f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.02, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
      o.connect(f); f.connect(g);
      this.salida(g, L, 0.6, 0.5, 0.3);
      o.start(t); o.stop(t + 1.05);
    },
    // morse de radio: «.» = 1 semicorchea, «-» = 3, espacio entre letras = 3
    morse(t, patron, m, vel, L, pan) {
      const c = this.ctx, f = mtof(m);
      const o = c.createOscillator(), g = c.createGain(), bp = c.createBiquadFilter();
      o.type = 'sine'; o.frequency.value = f; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 2;
      const u = SEMI * 0.62, nivel = 0.07 * vel;
      g.gain.setValueAtTime(0, t);
      let x = t;
      for (const ch of patron) {
        if (ch === ' ') { x += u * 2; continue; }
        const d = ch === '-' ? u * 3 : u;
        g.gain.setValueAtTime(0, x); g.gain.linearRampToValueAtTime(nivel, x + 0.006); g.gain.setValueAtTime(nivel, x + d - 0.008); g.gain.linearRampToValueAtTime(0, x + d);
        x += d + u;
      }
      o.connect(bp); bp.connect(g);
      this.salida(g, L, 0.55, pan, 0.35);
      o.start(t); o.stop(x + 0.05);
      return x;
    }
  };

  // ---------- composición ----------
  // Las frases son [negra desde el inicio de la sección, grado (0 = F#3, 7 = F#4, 14 = F#5), duración en negras].
  // MENÚ «Órbita quieta»
  const M_A = [[0, 11, 1], [1, 12, 0.5], [1.5, 14, 1], [2.5, 15, 0.5], [3, 17, 5], // la pregunta: sube a Si# y queda colgada
    [9, 15, 1], [10, 14, 0.5], [10.5, 12, 1.5], [12, 15, 4],
    [16, 11, 1], [17, 12, 0.5], [17.5, 14, 1], [18.5, 16, 0.5], [19, 18, 3], [22, 17, 2],
    [24, 16, 1.5], [25.5, 13, 0.5], [26, 11, 2], [28, 12, 1], [29, 15, 3]];
  const M_A2 = [[0, 13, 1], [1, 14, 0.5], [1.5, 16, 1], [2.5, 17, 0.5], [3, 18, 3], [6, 17, 0.5], [6.5, 16, 1.5], // la respuesta, una tercera arriba
    [8, 15, 0.5], [8.5, 17, 0.5], [9, 19, 1], [10, 18, 1], [11, 17, 1], [12, 15, 4],
    [16, 14, 2], [18, 16, 1], [19, 18, 1], [20, 21, 3], [23, 18, 1],
    [24, 17, 1], [25, 16, 1], [26, 13, 2], [28, 12, 0.5], [28.5, 11, 0.5], [29, 12, 3]];
  const M_B = [[0, 12, 3], [3, 13, 1], [4, 11, 4], [8, 10, 2], [10, 12, 2], [12, 15, 4], // la voz baja a casa
    [16, 14, 3], [19, 13, 1], [20, 11, 4], [24, 10, 2], [26, 9, 2], [28, 7, 4]];
  // JUEGO «Escucha»
  const J_LLAMADA = [[0, 14, 1], [1, 15, 0.5], [1.5, 17, 2.5], [8, 16, 1], [9, 14, 1], [10, 12, 2]];
  const J_LLAMADA2 = [[0, 16, 1], [1, 17, 0.5], [1.5, 18, 2.5], [8, 17, 1], [9, 15, 1], [10, 14, 2]];
  const J_RESP = [[16, 12, 0.5], [16.5, 13, 0.5], [17, 14, 1.5], [18.5, 12, 0.5], [19, 9, 3], [24, 11, 1], [25, 12, 1], [26, 15, 2], [28, 14, 4]];
  const J_RESP2 = [[16, 12, 0.5], [16.5, 13, 0.5], [17, 14, 1.5], [18.5, 16, 0.5], [19, 18, 3], [24, 17, 1], [25, 16, 1], [26, 15, 2], [28, 16, 4]];
  const J_B = [[0, 12, 3], [3, 10, 1], [4, 9, 4], [8, 8, 2], [10, 10, 2], [12, 12, 4],
    [16, 14, 3], [19, 13, 1], [20, 11, 4], [24, 9, 2], [26, 13, 2], [28, 15, 4]];
  // variación rítmica: las notas en tiempo fuerte (salvo la primera de cada compás) se corren media negra
  const sincopar = fr => fr.map(([b, g, d]) => (b % 4 !== 0 && b % 1 === 0 && d >= 1 ? [b + 0.5, g, d - 0.5] : [b, g, d]));
  const M_A_S = sincopar(M_A), M_A2_S = sincopar(M_A2);

  const MENU = {
    largo: 32,
    secc(n) { return n < 4 ? 'intro' : n < 12 ? 'A' : n < 20 ? 'A2' : n < 28 ? 'B' : 'puente'; },
    ini: { intro: 0, A: 4, A2: 12, B: 20, puente: 28 },
    acorde(n) {
      const s = this.secc(n);
      if (s === 'intro' || s === 'puente') return 'I';
      if (s === 'B') return ['vi', 'vi', 'II', 'II', 'Vs', 'Vs', 'I', 'I'][n - 20];
      return ['I', 'I', 'II', 'II', 'I', 'I', 'iii', 'II'][(n - 4) % 8];
    }
  };
  const JUEGO = {
    largo: 42,
    secc(n) { return n < 4 ? 'intro' : n < 12 ? 'A' : n < 20 ? 'A2' : n < 28 ? 'B' : n < 32 ? 'puente' : n < 40 ? 'A3' : 'coda'; },
    ini: { intro: 0, A: 4, A2: 12, B: 20, puente: 28, A3: 32, coda: 40 },
    acorde(n) {
      const s = this.secc(n);
      if (s === 'intro' || s === 'puente') return n % 2 ? 'II' : 'I';
      if (s === 'B') return ['vi', 'vi', 'II', 'II', 'Vs', 'Vs', 'iii', 'II'][n - 20];
      if (s === 'coda') return n === 40 ? 'Vs' : 'II';
      return ['I', 'I', 'II', 'II', 'vi', 'vi', 'II', 'I'][(n - this.ini[s]) % 8];
    }
  };

  // toca las notas de una frase que caen en el compás i de la sección
  function frase(fr, i, t, fn) {
    const a = i * 4, b = a + 4;
    for (let k = 0; k < fr.length; k++) { const x = fr[k]; if (x[0] >= a && x[0] < b) fn(x, t + (x[0] - a) * NEGRA, k > 0 ? fr[k - 1] : null); }
  }
  const panDe = m => clamp((m - 72) / 22, -0.55, 0.55);

  function programarCompas(M, tema, n, vuelta, t, est) {
    const D = tema === 'menu' ? MENU : JUEGO, enJuego = tema === 'juego';
    const secc = D.secc(n), i = n - D.ini[secc], nomAc = D.acorde(n), ac = AC[nomAc];
    const v = vuelta % 3;
    const C = M.capa, rnd = azar((enJuego ? 9001 : 4001) + vuelta * 131 + n * 7);
    const act = est.activas || { uno: 1, dos: 1, hip: 1 }; // las capas mudas no se programan (ahorra CPU en el teléfono)
    const hum = () => (rnd() - 0.5) * 0.012;             // ±6 ms
    const vh = x => x * (0.92 + rnd() * 0.16);            // ±8 % de velocidad

    // ---- pad: cada 2 compases (o cada compás si cambia el acorde)
    const prev = n > 0 ? D.acorde(n - 1) : null;
    if (n % 2 === 0 || prev !== nomAc) {
      const sig = D.acorde(n + 1 < D.largo ? n + 1 : 0);
      const dosC = n % 2 === 0 && sig === nomAc;
      const notas = v === 1 ? abrir(ac.pad) : ac.pad;
      const brillo = secc === 'B' ? 1.25 : secc === 'puente' ? 0.75 : 1;
      M.pad(notas, t, COMPAS * (dosC ? 2 : 1) - 0.05, secc === 'puente' || secc === 'intro' ? 0.7 : 1, C.base, brillo);
    }
    // ---- bajo sub
    const conBajo = enJuego ? secc !== 'intro' || i >= 2 : (secc === 'A2' || secc === 'B' || (secc === 'puente' && v === 2));
    if (conBajo) {
      if (secc === 'puente') M.sub(ac.bajo, t, COMPAS * 0.95, 0.6, C.base);
      else if (v === 1) { M.sub(ac.bajo, t, NEGRA * 1.5, 0.9, C.base); M.sub(ac.bajo + (n % 2 ? 7 : 0), t + NEGRA * 2.5, NEGRA * 1.3, 0.7, C.base); }
      else { M.sub(ac.bajo, t, NEGRA * 2.8, 0.9, C.base); M.sub(ac.bajo + (n % 4 === 3 ? 7 : 0), t + NEGRA * 3, NEGRA * 0.9, 0.6, C.base); }
    }

    if (!enJuego) {
      // ================= MENÚ =================
      if (secc === 'intro') {
        if (i === 2) M.morse(t + NEGRA, '.--- . -', 85, 0.8, C.mel, 0.35);           // J E T
        if (i === 3) M.campana(grado(15), t + NEGRA * 3, 0.5, 2.6, C.mel, 0.6, 0.2, 0.3);
      }
      if (secc === 'A') {
        if (v === 1) frase(M_A, i, t, ([, g, d], tt) => { M.vidrio(grado(g), tt + hum(), vh(0.9), Math.max(0.8, d * NEGRA * 1.2), C.mel, 0.4, panDe(grado(g)), 0.25); if (d >= 2) M.campana(grado(g) + 12, tt + 0.02, 0.35, d * NEGRA, C.mel, 0.6, -panDe(grado(g)), 0.3); });
        else frase(v === 2 ? M_A_S : M_A, i, t, ([, g, d], tt) => M.campana(grado(g), tt + hum(), vh(1), Math.max(1.2, d * NEGRA * 1.4), C.mel, 0.5, panDe(grado(g)), 0.28));
      }
      if (secc === 'A2') {
        if (v === 2) frase(M_A2, i, t, ([, g, d], tt, p) => { M.voz(grado(g), tt, 0.9, d * NEGRA, C.mel, p ? grado(p[1]) : null, 0.1); if (d >= 3) M.campana(grado(g) + 12, tt + NEGRA * 0.5, 0.3, 2.4, C.mel, 0.6, -0.3, 0.3); });
        else frase(v === 0 ? M_A2 : M_A2_S, i, t, ([, g, d], tt) => M.campana(grado(g), tt + hum(), vh(0.95), Math.max(1.2, d * NEGRA * 1.4), C.mel, 0.5, panDe(grado(g)), 0.28));
        if (v === 1 && i % 2 === 1) { // eco: el vidrio repite una octava abajo
          M.vidrio(ac.arp[i % 4 === 3 ? 2 : 1] - 12, t + NEGRA * 2.5, 0.35, 1.2, C.mel, 0.5, -0.4, 0.3);
        }
      }
      if (secc === 'B') {
        if (v === 2) {
          frase(M_B, i, t, ([, g, d], tt) => M.campana(grado(g) + 12, tt + hum(), vh(0.8), Math.max(1.4, d * NEGRA * 1.3), C.mel, 0.55, panDe(grado(g) + 12), 0.3));
          if (i % 2 === 0) M.voz(ac.pad[ac.pad.length - 1] + 12, t, 0.55, COMPAS * 2 - 0.3, C.mel, null, -0.2);
        } else frase(M_B, i, t, ([, g, d], tt, p) => M.voz(grado(g) + (v === 1 ? 12 : 0), tt, v === 1 ? 0.75 : 0.95, d * NEGRA, C.mel, p ? grado(p[1]) + (v === 1 ? 12 : 0) : null, 0.05));
        // arpegio de 5 corcheas contra el compás de 4 (polimetría)
        const forma = v === 1 ? [0, 2, 4, 1, 3] : v === 2 ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
        for (let k = 0; k < 8; k++) { const m = ac.arp[forma[(n * 8 + k) % 5]]; M.vidrio(m, t + k * CORCHEA + hum(), vh(0.42), 0.9, C.mel, 0.35, k % 2 ? 0.35 : -0.35, 0.18); }
      }
      if (secc === 'puente') {
        for (let k = 0; k < 3; k++) M.campana(84, t + k * NEGRA * 1.5 + hum(), 0.42 - k * 0.08, 2.6, C.mel, 0.7, (k - 1) * 0.4, 0.4);
        if (i === 1) M.morse(t + NEGRA, '.--- . -', 85, 0.7, C.mel, -0.35);
        if (i === 3) M.campana(grado(11), t + NEGRA * 3, 0.45, 2.4, C.mel, 0.6, 0, 0.3); // anacrusa de la vuelta
      }
    } else {
      // ================= JUEGO =================
      const ev = est.evidencia && est.evidencia.length ? est.evidencia.slice(-16) : null;
      // arpegio de 5 (capa uno): vidrio suave; en B y en el puente, más espaciado
      const forma = v === 1 ? [0, 2, 4, 1, 3] : v === 2 ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
      if (secc !== 'puente' && act.uno) {
        for (let k = 0; k < 8; k++) {
          if (secc === 'B' && k % 2) continue;
          const m = ac.arp[forma[(n * 8 + k) % 5]];
          M.vidrio(m, t + k * CORCHEA + hum(), vh(k % 2 ? 0.3 : 0.38), 0.85, C.uno, 0.3, k % 2 ? 0.4 : -0.4, 0.15);
        }
      }
      // tic de reloj (capa uno)
      if (act.uno) for (let k = 0; k < 8; k++) M.tic(t + k * CORCHEA + hum() * 0.5, k % 2 ? 0.5 : (k === 0 ? 1.1 : 0.85), C.uno, 0.25);
      // pulso y contracanto (capa dos)
      if (!act.dos) { /* capa muda */ } else if (secc !== 'puente') {
        const golpes = secc === 'B' ? [[0, 1]] : v === 1 ? [[0, 1], [1.75, 0.5], [2.5, 0.65]] : v === 2 ? [[0, 1], [2.5, 0.6], [3.5, 0.35]] : [[0, 1], [2.5, 0.6]];
        for (const [b, vel] of golpes) M.bombo(t + b * NEGRA, vel, C.dos);
        if (secc !== 'B') M.aro(t + NEGRA * 3, v === 2 ? 0.45 : 0.6, C.dos);
        for (let k = 0; k < 16; k++) { if (M.ligero && k % 2) continue; const acc = k % 4 === 2 ? 1 : k % 2 ? 0.45 : 0.7; M.maraca(t + k * SEMI + (k % 2 ? SEMI * 0.12 : 0) + hum() * 0.5, acc, C.dos, k % 2 ? 0.3 : -0.1); }
        if (n % 2 === 1 && secc !== 'coda') {
          const a1 = ac.arp[(1 + v) % 5] - 12, a2 = ac.arp[(2 + v) % 5] - 12;
          M.campana(a1, t + NEGRA * 1.5 + hum(), 0.42, 2, C.dos, 0.55, -0.35, 0.3);
          M.campana(a2, t + NEGRA * 2.5 + hum(), 0.34, 2, C.dos, 0.55, 0.35, 0.3);
        }
      } else {
        M.maraca(t + NEGRA * 2, 0.8, C.dos, 0); M.maraca(t + NEGRA * 3.5, 0.5, C.dos, 0.2);
      }
      // hipótesis: el acorde de la pregunta sostenido (Si#ø7)
      if (act.hip && n % 2 === 0) M.pad(AC.hip.pad, t, COMPAS * 2 - 0.05, 0.75, C.hip, 1.3);
      if (act.hip && n % 4 === 0) M.campana(84, t + NEGRA * 0.5, 0.25, 3.2, C.hip, 0.8, 0.45, 0.4);

      // melodía (capa mel)
      if (secc === 'intro') {
        if (i === 1) M.morse(t + NEGRA, '.--- . -', 85, 0.75, C.mel, 0.35);
        if (i === 3) M.campana(grado(14), t + NEGRA * 3, 0.45, 2.4, C.mel, 0.6, -0.2, 0.3);
      }
      if (secc === 'A' || secc === 'A2' || secc === 'A3') {
        const oct = secc === 'A3' ? 12 : 0;
        // primera mitad: la evidencia (si hay registro) o la llamada compuesta
        if (i < 4) {
          if (ev) {
            if (i === 0) {
              const altos = [73, 75, 77, 78], bajos = [54, 56, 58];
              let ia = 0, ir = 0;
              ev.forEach((a, k) => {
                const tt = t + NEGRA * 0.5 + k * NEGRA;
                if (a) M.campana(altos[ia++ % 4] + 12, tt, 0.42, 2.2, C.evid, 0.6, 0.3, 0.3);
                else M.vidrio(bajos[ir++ % 3] + 12, tt, 0.5, 1.1, C.evid, 0.45, -0.3, 0.2);
              });
            }
          } else {
            frase(secc === 'A2' ? J_LLAMADA2 : J_LLAMADA, i, t, ([, g, d], tt) => M.campana(grado(g), tt + hum(), vh(0.85), Math.max(1.2, d * NEGRA * 1.4), C.mel, 0.5, panDe(grado(g)), 0.3));
          }
        }
        // segunda mitad: la respuesta compuesta
        const resp = secc === 'A2' ? J_RESP2 : J_RESP;
        if (secc === 'A3' || (secc === 'A' && v === 1)) frase(resp, i, t, ([, g, d], tt) => { M.vidrio(grado(g) + oct, tt + hum(), vh(0.8), Math.max(0.9, d * NEGRA * 1.2), C.mel, 0.4, panDe(grado(g)), 0.25); M.campana(grado(g) + oct, tt + 0.015, 0.4, Math.max(1.2, d * NEGRA * 1.3), C.mel, 0.5, -panDe(grado(g)), 0.25); });
        else if (secc === 'A2' && v === 2) frase(resp, i, t, ([, g, d], tt, p) => M.voz(grado(g), tt, 0.85, d * NEGRA, C.mel, p && p[0] >= 16 ? grado(p[1]) : null, 0.1));
        else frase(resp, i, t, ([, g, d], tt) => M.campana(grado(g) + oct, tt + hum(), vh(0.9), Math.max(1.2, d * NEGRA * 1.4), C.mel, 0.5, panDe(grado(g)), 0.3));
        // voz lejana que sostiene en A' (vueltas impares)
        if (secc === 'A2' && vuelta % 2 === 1 && i % 4 === 0) M.voz(ac.pad[ac.pad.length - 1], t, 0.45, COMPAS * 3.5, C.mel, null, -0.35);
      }
      if (secc === 'B') {
        frase(J_B, i, t, ([, g, d], tt, p) => M.voz(grado(g) + (v === 2 ? 12 : 0), tt, v === 2 ? 0.75 : 0.95, d * NEGRA, C.mel, p ? grado(p[1]) + (v === 2 ? 12 : 0) : null, 0.05));
        if (v === 1 && i % 2 === 1) M.campana(ac.arp[3], t + NEGRA * 2, 0.35, 2.6, C.mel, 0.6, 0.4, 0.35);
      }
      if (secc === 'puente') {
        for (let k = 0; k < 3; k++) M.campana(84, t + k * NEGRA * 1.5 + hum(), 0.4 - k * 0.08, 2.6, C.mel, 0.7, (k - 1) * 0.4, 0.4);
        if (i === 0 || i === 2) M.morse(t + NEGRA * 2, i === 0 ? '.--- . -' : '... . -. .- .-..', 85, 0.6, C.mel, i ? -0.4 : 0.4); // JET · SENAL
      }
      if (secc === 'coda') {
        if (i === 0) [0, 1, 2, 3].forEach(k => M.campana(ac.arp[k], t + NEGRA * (1 + k * 0.75), 0.45, 2, C.mel, 0.55, (k - 1.5) * 0.3, 0.3));
        else { [68, 72, 75, 80, 84].forEach((m, k) => M.campana(m, t + k * CORCHEA, 0.4 + k * 0.04, 2.2, C.mel, 0.6, (k - 2) * 0.25, 0.3)); }
      }
    }
    // chirridos de radio cada 9-17 compases
    if (est.proxChirrido <= 0) { M.chirrido(t + NEGRA * (1 + (n % 3)), C.base); est.proxChirrido = 9 + ((n * 7 + vuelta * 3) % 9); }
    est.proxChirrido--;
    // la estática respira con la sección
    if (M.estatica) M.estatica.f.frequency.setTargetAtTime(900 + ((n * 37 + vuelta * 11) % 13) * 140, t, 1.2);
    if (M.estatica) M.estatica.g.gain.setTargetAtTime(secc === 'puente' ? 0.055 : 0.028, t, 1.5);
  }

  // ---------- reproductor en vivo ----------
  const A = {
    ctx: null, M: null, ok: false,
    pref: { musica: true, volMusica: 0.7, efectos: true, volEfectos: 0.8 },
    temaActual: null, compas: 0, vuelta: 0, proxT: 0, timer: null, inicioTema: 0, amort: false,
    est: { evidencia: [], proxChirrido: 11, activas: null }, capasObj: { uno: 0, dos: 0, hip: 0 }, ultimoSfx: {}
  };
  A.iniciar = function () {
    if (A.ctx) { if (A.ctx.state !== 'running' && !document.hidden) A.ctx.resume().catch(() => {}); return; }
    const AC_ = window.AudioContext || window.webkitAudioContext;
    if (!AC_) return;
    try {
      A.ctx = new AC_({ latencyHint: 'interactive' });
      A.M = new Motor(A.ctx);
      A.ok = true;
      A.aplicarPrefs(true);
      A.M.iniciarEstatica(A.M.capa.base);
      if (A.ctx.state !== 'running') A.ctx.resume().catch(() => {});
      if (A._temaPendiente !== undefined) { const t = A._temaPendiente; A._temaPendiente = undefined; A.tema(t); }
    } catch (e) { A.ok = false; }
  };
  A.aplicarPrefs = function (inmediato) {
    if (!A.ok) return;
    const t = A.ctx.currentTime, p = A.pref;
    const fija = (prm, v, tc) => { try { prm.cancelScheduledValues(t); prm.setValueAtTime(prm.value, t); } catch (e) { /* nada */ } if (inmediato) prm.setValueAtTime(v, t); else prm.setTargetAtTime(v, t, tc); };
    // curva de volumen perceptual (cuadrática): el control se siente parejo de 0 a 1
    const vm = p.musica ? 0.42 * p.volMusica * p.volMusica * 1.6 : 0, ve = p.efectos ? 0.9 * p.volEfectos * p.volEfectos * 1.4 : 0;
    fija(A.M.mus.gain, vm, 0.08); fija(A.M.musRevEsp.gain, vm, 0.08);
    fija(A.M.fx.gain, ve, 0.03); fija(A.M.fxRevEsp.gain, ve, 0.03);
  };
  A.prefs = function (p) { Object.assign(A.pref, p); A.aplicarPrefs(); };
  A.tema = function (nombre) {
    if (!A.ok) { A._temaPendiente = nombre; return; }
    if (nombre === A.temaActual) return;
    const ctx = A.ctx, t = ctx.currentTime, M = A.M;
    A.temaActual = nombre;
    clearInterval(A.timer); A.timer = null;
    // fundido de lo anterior: las notas ya programadas terminan su cola en las capas viejas, que se apagan
    const viejas = M.capa;
    for (const k in viejas) M.nivel(viejas[k], 0, t, nombre ? 0.5 : 0.25);
    setTimeout(() => { for (const k in viejas) for (const g of [viejas[k].in, viejas[k].rev, viejas[k].del]) { try { g.disconnect(); } catch (e) { /* nada */ } } }, 6000);
    M.capa = M.nuevasCapas(false);
    if (!nombre) { M.iniciarEstatica(M.capa.base); return; }
    M.nivel(M.capa.base, 1, t + 0.3, 0.6);
    M.nivel(M.capa.mel, 1, t + 0.3, 0.6);
    M.iniciarEstatica(M.capa.base);
    A.compas = 0; A.vuelta = 0; A.proxT = t + 0.5; A.inicioTema = A.proxT;
    A.est.proxChirrido = 11;
    A.aplicarCapas(true);
    A.timer = setInterval(A.bucle, 60);
    A.bucle();
  };
  A.bucle = function () {
    if (!A.ok || !A.temaActual) return;
    const ctx = A.ctx;
    if (ctx.state !== 'running') return;
    if (A.proxT < ctx.currentTime - 0.25) { // se atrasó (hilo trabado): realinear sin amontonar notas
      const saltos = Math.ceil((ctx.currentTime + 0.1 - A.proxT) / COMPAS);
      A.proxT += saltos * COMPAS; A.compas += saltos;
      const D = A.temaActual === 'menu' ? MENU : JUEGO;
      while (A.compas >= D.largo) { A.compas -= D.largo; A.vuelta++; }
    }
    while (A.proxT < ctx.currentTime + 0.4) {
      const D = A.temaActual === 'menu' ? MENU : JUEGO;
      // con la música apagada no se programa nada (ahorra batería), pero el tiempo sigue corriendo
      if (A.pref.musica && A.pref.volMusica > 0.001) {
        A.est.activas = A.temaActual === 'juego' ? A.capasObj : null;
        try { programarCompas(A.M, A.temaActual, A.compas, A.vuelta, A.proxT, A.est); } catch (e) { /* nunca romper el juego por la música */ }
      }
      A.compas++;
      if (A.compas >= D.largo) { A.compas = 0; A.vuelta++; }
      A.proxT += COMPAS;
    }
  };
  // las capas cambian en el próximo tiempo, con un fundido de ~1 compás
  A.capas = function (c) {
    const antes = JSON.stringify(A.capasObj);
    Object.assign(A.capasObj, { uno: c.uno != null ? !!c.uno : A.capasObj.uno, dos: c.dos != null ? !!c.dos : A.capasObj.dos, hip: c.hip != null ? !!c.hip : A.capasObj.hip });
    if (JSON.stringify(A.capasObj) !== antes) {
      A.aplicarCapas(false);
      // la hipótesis no espera al próximo par de compases: el acorde entra en el próximo tiempo
      if (A.ok && A.capasObj.hip && !JSON.parse(antes).hip && A.temaActual === 'juego' && A.ctx.state === 'running' && A.pref.musica) {
        const t = A.ctx.currentTime, P2 = COMPAS * 2, ph = ((t - A.inicioTema) % P2 + P2) % P2;
        const espera = NEGRA - (ph % NEGRA), resto = P2 - ph - espera;
        if (resto > NEGRA) try { A.M.pad(AC.hip.pad, t + espera, resto - 0.05, 0.75, A.M.capa.hip, 1.3); } catch (e) { /* nada */ }
      }
    }
  };
  A.aplicarCapas = function (inmediato) {
    if (!A.ok) return;
    const ctx = A.ctx, cap = A.M.capa, c = A.capasObj, juego = A.temaActual === 'juego';
    let t = ctx.currentTime, tc = 0.3;
    if (!inmediato && A.temaActual) {
      const ph = ((t - A.inicioTema) % NEGRA + NEGRA) % NEGRA;
      t = t + (NEGRA - ph); tc = COMPAS / 4;
    }
    A.M.nivel(cap.uno, juego && c.uno ? 0.9 : 0, t, tc);
    A.M.nivel(cap.dos, juego && c.dos ? (c.hip ? 0.5 : 1) : 0, t, tc);   // con la hipótesis abierta, el pulso baja 6 dB
    A.M.nivel(cap.hip, juego && c.hip ? 0.85 : 0, t, tc);
    A.M.nivel(cap.evid, juego ? 1 : 0, t, tc);
    A.M.nivel(cap.mel, A.temaActual ? (juego && c.hip ? 0.75 : 1) : 0, t, tc);
  };
  A.evidencia = function (arr) { A.est.evidencia = (arr || []).slice(); };
  A.suspender = function () { if (A.ok && A.ctx.state === 'running') A.ctx.suspend().catch(() => {}); };
  A.reanudar = function () { if (A.ok && A.ctx.state !== 'running' && !document.hidden) A.ctx.resume().catch(() => {}); };
  // pausa: la música se oye «del otro lado del vidrio» (filtro y −4 dB); no se corta
  A.amortiguar = function (on) {
    on = !!on;
    if (A.amort === on) return;
    A.amort = on;
    if (!A.ok) return;
    const t = A.ctx.currentTime, f = A.M.musLP.frequency, g = A.M.musPausa.gain, r = A.M.musRevPausa.gain;
    for (const p of [f, g, r]) { try { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); } catch (e) { /* nada */ } }
    f.setTargetAtTime(on ? 650 : 18000, t, on ? 0.12 : 0.2);
    g.setTargetAtTime(on ? 0.63 : 1, t, 0.15);
    r.setTargetAtTime(on ? 0.3 : 1, t, 0.15);
  };
  // ducking: los veredictos se oyen limpios sobre la música
  function agachar(M, prof, dur, t0) {
    const t = t0 == null ? M.ctx.currentTime : t0, g = M.musDuck.gain;
    try { g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); } catch (e) { /* nada */ }
    g.setTargetAtTime(prof, t, 0.03); g.setTargetAtTime(1, t + dur, 0.35);
  }
  A.pulso = function () {
    if (!A.ok || !A.temaActual || A.ctx.state !== 'running') return 0;
    const ph = ((A.ctx.currentTime + 0.03 - A.inicioTema) % NEGRA + NEGRA) % NEGRA / NEGRA;
    return Math.exp(-ph * 5) * (A.temaActual === 'juego' && A.capasObj.dos ? 1 : 0.55);
  };
  A.corriendo = () => A.ok && A.ctx.state === 'running';

  // ---------- efectos (todos en Fa# lidio) ----------
  const ALT_FORMA = [73, 75, 78]; // círculo C#5, triángulo D#5, cuadrado F#5
  function efecto(M, nombre, arg, t) {
    const L = M.fxB, c = M.ctx;
    switch (nombre) {
      case 'tic': { // tocar una pieza de la paleta: vidrio corto, altura por forma, una octava abajo si es pequeña
        const id = arg | 0, f = (id / 6) | 0, peq = id % 2, m = ALT_FORMA[f % 3] - (peq ? 12 : 0);
        M.vidrio(m, t, 0.7, 0.22, L, 0.12, (f - 1) * 0.25);
        M.ruidoCorto(t, 0.012, 'highpass', 5200, 0.7, 0.05, L, 0, (f - 1) * 0.25);
        break;
      }
      case 'encaja': { // la pieza entra en la ranura: clic con cuerpo + armónico de la pieza
        const id = arg | 0, f = (id / 6) | 0, peq = id % 2, m = ALT_FORMA[f % 3] + 12 - (peq ? 12 : 0);
        M.ruidoCorto(t, 0.03, 'bandpass', 2600, 2, 0.16, L, 0, 0);
        const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(mtof(54), t); o.frequency.exponentialRampToValueAtTime(mtof(42), t + 0.06);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
        o.connect(g); M.salida(g, L, 0, 0, 0); o.start(t); o.stop(t + 0.1);
        M.campana(m, t + 0.012, 0.32, 0.4, L, 0.2, (f - 1) * 0.2);
        break;
      }
      case 'quitar': { // el tic al revés: ataque lento, caída rápida, y la altura se hunde un poco
        const o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
        o.frequency.setValueAtTime(mtof(70), t); o.frequency.exponentialRampToValueAtTime(mtof(66), t + 0.09);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.13, t + 0.065); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.095);
        o.connect(g); M.salida(g, L, 0.15, 0, 0); o.start(t); o.stop(t + 0.11); break;
      }
      case 'reordenar': {
        const s = c.createBufferSource(); s.buffer = M.blanco; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 4;
        f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.12);
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
        s.connect(f); f.connect(g); M.salida(g, L, 0.1, 0, 0); s.start(t); s.stop(t + 0.15); break;
      }
      case 'lleno': for (let i = 0; i < 2; i++) { // dos pulsos sordos en Sol#2: nunca un «error» chillón
        const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(); o.type = 'triangle'; o.frequency.value = mtof(44);
        lp.type = 'lowpass'; lp.frequency.value = 420;
        const tt = t + i * 0.13; g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.38, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.11);
        o.connect(lp); lp.connect(g); M.salida(g, L, 0, 0, 0); o.start(tt); o.stop(tt + 0.13);
      } break;
      case 'enviar': {
        const s = c.createBufferSource(); s.buffer = M.blanco; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2;
        f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(5000, t + 0.3);
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        s.connect(f); f.connect(g); M.salida(g, L, 0.4, 0, 0); s.start(t); s.stop(t + 0.35);
        M.campana(78, t + 0.12, 0.6, 1.2, L, 0.4, 0.15); break;
      }
      case 'escaneo': { // la Sonda «lee» cada pieza: una campana por pieza, escala arriba desde Fa#4
        const k = Math.min(4, arg | 0);
        M.campana([66, 68, 70, 72, 73][k], t, 0.45, 0.6, L, 0.4, (k - 2) * 0.2);
        M.ruidoCorto(t, 0.02, 'bandpass', 4200, 3, 0.04, L, 0, (k - 2) * 0.2);
        break;
      }
      case 'acepta': // díada Fa#5 + La#5 con brillo y una cola en Do#6
        agachar(M, 0.55, 0.5, t);
        M.campana(78, t, 0.8, 1.6, L, 0.5, -0.15); M.campana(82, t + 0.01, 0.7, 1.6, L, 0.5, 0.15); M.campana(85, t + 0.16, 0.5, 2.2, L, 0.7, 0);
        M.sub(54, t, 0.5, 0.6, L);
        break;
      case 'rechaza': { // tritono que baja, Si#4 → Fa#4, con el filtro que se cierra
        agachar(M, 0.6, 0.55, t);
        for (const [m, dt] of [[72, 0], [66, 0.16]]) {
          const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(); o.type = 'triangle'; o.frequency.value = mtof(m);
          lp.type = 'lowpass'; lp.frequency.setValueAtTime(2400, t + dt); lp.frequency.exponentialRampToValueAtTime(300, t + dt + 0.4);
          g.gain.setValueAtTime(0.0001, t + dt); g.gain.exponentialRampToValueAtTime(0.2, t + dt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.5);
          o.connect(lp); lp.connect(g); M.salida(g, L, 0.3, dt ? -0.1 : 0.1, 0);
          o.start(t + dt); o.stop(t + dt + 0.55);
        }
        break;
      }
      case 'copiar': [78, 82, 85].forEach((m, i) => M.campana(m, t + i * 0.055, 0.45, 0.5, L, 0.3, (i - 1) * 0.3)); break;
      case 'panelAbre': case 'panelCierra': { // susurro de aire que sube o baja
        const s = c.createBufferSource(); s.buffer = M.ruido; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
        const a = nombre === 'panelAbre' ? 500 : 2600, b = nombre === 'panelAbre' ? 2600 : 500;
        f.frequency.setValueAtTime(a, t); f.frequency.exponentialRampToValueAtTime(b, t + 0.25);
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        s.connect(f); f.connect(g); M.salida(g, L, 0.2, 0, 0); s.start(t, M.rndRuido()); s.stop(t + 0.3); break;
      }
      case 'chip': { // nota de la escala según la fila: forma 1-3, color 4-6, tamaño 7-8
        const fila = (arg && arg.fila) | 0, i = (arg && arg.i) | 0;
        const g = fila === 0 ? i % 3 : fila === 1 ? 3 + (i % 3) : 6 + (i % 2);
        M.campana(grado(g, 1) + 12, t, 0.4, 0.5, L, 0.3, (fila - 1) * 0.25); break;
      }
      case 'coherente': M.campana(73, t, 0.5, 0.9, L, 0.4, -0.2); M.campana(78, t + 0.02, 0.45, 0.9, L, 0.4, 0.2); break;
      case 'transmitir': {
        const notas = (arg && arg.length ? arg : [66, 70, 73, 77]).slice(0, 8).map(ajustar);
        notas.forEach((m, i) => M.campana(m, t + i * 0.07, 0.4, 0.5, L, 0.4, (i / Math.max(1, notas.length - 1) - 0.5) * 0.6));
        efecto(M, 'enviar', null, t + notas.length * 0.07); break;
      }
      case 'contacto': { // acorde de resolución (Fa# mayor 9, sin el #11) + campanas que caen como lluvia
        agachar(M, 0.3, 1.2, t);
        M.pad([54, 58, 61, 68], t, 2.2, 1.6, L, 1.4);
        [42, 54].forEach(m => M.sub(m, t, 2, 0.9, L));
        const r = azar(7);
        for (let i = 0; i < 12; i++) { const m = grado(7 + ((r() * 9) | 0), 1); M.campana(m, t + 0.25 + i * 0.11 + r() * 0.05, 0.35, 1.6, L, 0.7, (r() - 0.5) * 1.2); }
        break;
      }
      case 'contra': { // golpe grave amortiguado + una sola campana Si# que queda sonando
        agachar(M, 0.5, 0.9, t);
        const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.3);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        o.connect(g); M.salida(g, L, 0.1, 0, 0); o.start(t); o.stop(t + 0.55);
        M.ruidoCorto(t, 0.25, 'lowpass', 500, 0.7, 0.2, L, 0.2, 0);
        M.campana(84, t + 0.2, 0.55, 3.2, L, 0.8, 0); break;
      }
      case 'onda': { const k = Math.min(2, arg | 0); M.campana([78, 82, 85][k], t, 0.55, 1.4, L, 0.5, (k - 1) * 0.3); break; }
      case 'fanfarria': [66, 70, 73, 78].forEach((m, i) => M.campana(m + 12, t + i * 0.13, 0.55, 1.6, L, 0.6, (i - 1.5) * 0.25)); M.pad([54, 61, 66, 70], t + 0.3, 1.6, 1.2, L, 1.3); break;
      case 'copiado': M.campana(90, t, 0.35, 0.18, L, 0.1, 0); M.campana(90, t + 0.09, 0.35, 0.18, L, 0.1, 0); break;
      case 'ui': M.ruidoCorto(t, 0.025, 'bandpass', 3200, 1.5, 0.05, L, 0.05, 0); M.vidrio(85, t, 0.18, 0.08, L, 0.05, 0); break;
      case 'seleccion': M.campana(85, t, 0.3, 0.25, L, 0.1, 0); break;
    }
  }
  A.sfx = function (nombre, arg) {
    if (!A.ok || !A.pref.efectos || A.pref.volEfectos <= 0.001 || A.ctx.state !== 'running') return;
    // un mismo efecto repetido en menos de 25 ms se toca una sola vez (toques dobles, rebotes)
    const ahora = A.ctx.currentTime, u = A.ultimoSfx[nombre] || -1;
    if (ahora - u < 0.025 && nombre !== 'escaneo') return;
    A.ultimoSfx[nombre] = ahora;
    try { efecto(A.M, nombre, arg, ahora + 0.005); } catch (e) { /* nunca romper el juego por un sonido */ }
  };

  // ---------- render sin conexión (muestra WAV y pruebas de mezcla) ----------
  // opciones: { tema:'juego'|'menu', desde: compás, vuelta, capas:{uno,dos,hip}, evidencia:[1,0..], sfx:[[seg,nombre,arg]],
  //             musica:0..1, efectos:0..1, normalizar:dBFS|null, crudo:true (devuelve el AudioBuffer) }
  A.renderWav = async function (segundos, opciones) {
    const o = opciones || {}, sr = 44100, OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const ctx = new OAC(2, Math.floor(sr * segundos), sr);
    const M = new Motor(ctx, null, !!o.ligero);
    const tema = o.tema === undefined ? 'juego' : o.tema, cap = o.capas || { uno: 1, dos: 1, hip: 0 };
    const vm = o.musica == null ? 0.7 : o.musica, ve = o.efectos == null ? 0.8 : o.efectos;
    M.mus.gain.value = M.musRevEsp.gain.value = 0.42 * vm * vm * 1.6; M.fx.gain.value = M.fxRevEsp.gain.value = 0.9 * ve * ve * 1.4;
    const fijar = (L, v) => { L.in.gain.value = v; L.rev.gain.value = v; L.del.gain.value = v; };
    const juego = tema === 'juego';
    fijar(M.capa.base, tema ? 1 : 0); fijar(M.capa.mel, tema ? (juego && cap.hip ? 0.75 : 1) : 0); fijar(M.capa.evid, juego ? 1 : 0);
    fijar(M.capa.uno, juego && cap.uno ? 0.9 : 0); fijar(M.capa.dos, juego && cap.dos ? (cap.hip ? 0.5 : 1) : 0); fijar(M.capa.hip, juego && cap.hip ? 0.85 : 0);
    M.iniciarEstatica(M.capa.base);
    if (tema) {
      const est = { evidencia: o.evidencia || [1, 0, 0, 1, 1, 0, 1], proxChirrido: 5, activas: juego ? cap : null };
      let t = 0.1, n = o.desde || 0, v = o.vuelta || 0;
      const D = tema === 'menu' ? MENU : JUEGO;
      while (t < segundos) { programarCompas(M, tema, n, v, t, est); n++; if (n >= D.largo) { n = 0; v++; } t += COMPAS; }
    }
    for (const [s, nombre, arg] of (o.sfx || [])) efecto(M, nombre, arg, s);
    const buf = await ctx.startRendering();
    if (o.crudo) return buf;
    const c0 = buf.getChannelData(0), c1 = buf.getChannelData(1), len = buf.length;
    let gan = 1;
    if (o.normalizar != null) { let pk = 0; for (let i = 0; i < len; i++) pk = Math.max(pk, Math.abs(c0[i]), Math.abs(c1[i])); if (pk > 0) gan = Math.pow(10, o.normalizar / 20) / pk; }
    // fundido de 1,5 s al final para que la muestra no se corte en seco
    const fin = Math.floor(sr * 1.5);
    const nCh = 2, out = new ArrayBuffer(44 + len * nCh * 2), dv = new DataView(out);
    const w = (p, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(p + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + len * nCh * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
    dv.setUint16(22, nCh, true); dv.setUint32(24, sr, true); dv.setUint32(28, sr * nCh * 2, true); dv.setUint16(32, nCh * 2, true); dv.setUint16(34, 16, true);
    w(36, 'data'); dv.setUint32(40, len * nCh * 2, true);
    let p = 44;
    for (let i = 0; i < len; i++) {
      const fade = i > len - fin ? (len - i) / fin : 1;
      for (const ch of [c0, c1]) { const s = clamp(ch[i] * gan * fade, -1, 1); dv.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7fff, true); p += 2; }
    }
    return out;
  };
  A._interno = { MENU, JUEGO, AC, grado, ajustar, programarCompas, Motor };
  G.SAudio = A;
})(typeof globalThis !== 'undefined' ? globalThis : this);
