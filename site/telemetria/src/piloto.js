/* JET//Telemetría — «Piloto automático»: expectimax sobre creencias con profundidad limitada (DISENO.md §3.7).
   Funciona en el worker, en el hilo principal (respaldo) y en Node (calibración). */
(function (root, factory) {
  var N = (typeof module === 'object' && module.exports) ? require('./nucleo.js') : root.NUCLEO;
  var m = factory(N);
  if (typeof module === 'object' && module.exports) module.exports = m; else root.PILOTO = m;
})(typeof self !== 'undefined' ? self : this, function (NUC) {
  'use strict';
  var PEN = 15, K = 6;

  function pAl(sen, pos, roto) { return roto ? 0.5 : (pos ? sen.sens : 1 - sen.espec); }
  function tMask(v, T) { return T >= 100 ? v.zonas[T - 100] : (1 << T); }

  function entropia(b) {
    var H = 0; for (var h = 0; h < b.hw.length; h++) { var w = b.hw[h]; if (w > 1e-15) H -= w * Math.log(w); } return H;
  }
  function margOrden(b, N) {
    var m = new Array(N).fill(0), i, h;
    for (h = 0; h < b.hw.length; h++) { var w = b.hw[h]; if (!w) continue; var mk = b.hm[h]; for (i = 0; i < N; i++) if (mk & (1 << i)) m[i] += w; }
    var ord = []; for (i = 0; i < N; i++) if (b.cand & (1 << i)) ord.push(i);
    ord.sort(function (x, y) { return (m[y] - m[x]) || (x - y); });
    return { m: m, ord: ord };
  }

  /* Hoja: aire esperado reparando en orden de sospecha sin leer más */
  function hoja(b, v) {
    var mo = margOrden(b, v.N), ord = mo.ord, val = 0, R = v.R, RR = v.R + v.Rx;
    for (var h = 0; h < b.hw.length; h++) {
      var w = b.hw[h]; if (!w) continue;
      var mk = b.hm[h], a = b.aire, res = -PEN;
      for (var q = 0; q < ord.length; q++) {
        var bit = 1 << ord[q];
        if (mk & bit) { a -= R; mk &= ~bit; if (a <= 0) { res = -PEN; break; } if (!mk) { res = a; break; } }
        else { a -= RR; if (a <= 0) { res = -PEN; break; } }
      }
      val += w * res;
    }
    return val;
  }

  function posterior(b, v, s, T, o) {
    var sen = v.sens[s], tm = tMask(v, T), n = b.hw.length, hw = new Array(n), tot = 0;
    for (var h = 0; h < n; h++) {
      var pa = pAl(sen, (b.hm[h] & tm) !== 0, sen.dudoso && b.hr[h] === 1);
      var w = b.hw[h] * (o === 'A' ? pa : 1 - pa); hw[h] = w; tot += w;
    }
    if (tot > 0) for (var g = 0; g < n; g++) hw[g] /= tot;
    return { hm: b.hm, hr: b.hr, hw: hw, aire: b.aire - sen.coste, cand: b.cand, p: tot };
  }
  function pA(b, v, s, T) {
    var sen = v.sens[s], tm = tMask(v, T), p = 0;
    for (var h = 0; h < b.hw.length; h++) { var w = b.hw[h]; if (w) p += w * pAl(sen, (b.hm[h] & tm) !== 0, sen.dudoso && b.hr[h] === 1); }
    return p;
  }

  function lecturasPosibles(b, v) {
    var out = [], H0 = entropia(b), mejorPorSensor = {};
    for (var s = 0; s < v.sens.length; s++) {
      var sen = v.sens[s]; if (sen.coste >= b.aire) continue;
      var Ts = [];
      if (sen.tipo === 'z') { if (v.hayZonas) for (var z = 0; z < 3; z++) if (v.zonas[z]) Ts.push(100 + z); }
      else for (var i = 0; i < v.N; i++) Ts.push(i);
      for (var t = 0; t < Ts.length; t++) {
        var T = Ts[t], p = pA(b, v, s, T);
        if (p < 1e-9 || p > 1 - 1e-9) continue;
        var ig = H0 - p * entropia(posterior(b, v, s, T, 'A')) - (1 - p) * entropia(posterior(b, v, s, T, 'N'));
        if (ig < 1e-7) continue;
        var r = { t: 'L', s: s, T: T, g: ig / sen.coste };
        out.push(r);
        if (!mejorPorSensor[s] || mejorPorSensor[s].g < r.g) mejorPorSensor[s] = r;
      }
    }
    out.sort(function (x, y) { return y.g - x.g; });
    var sel = out.slice(0, K);
    Object.keys(mejorPorSensor).forEach(function (s) { if (sel.indexOf(mejorPorSensor[s]) < 0) sel.push(mejorPorSensor[s]); });
    return sel;
  }
  function reparacionesPosibles(b, v) {
    var out = [];
    for (var i = 0; i < v.N; i++) if (b.cand & (1 << i)) {
      var p = 0, bit = 1 << i; for (var h = 0; h < b.hw.length; h++) if (b.hm[h] & bit) p += b.hw[h];
      if (p > 1e-10) out.push({ t: 'R', i: i, p: p });
    }
    return out;
  }

  function Q(b, v, a, d, memo, key) {
    if (a.t === 'R') {
      var bit = 1 << a.i, n = b.hw.length, p = 0, h;
      for (h = 0; h < n; h++) if (b.hm[h] & bit) p += b.hw[h];
      var val = 0;
      if (p > 1e-12) {
        var a1 = b.aire - v.R;
        if (a1 <= 0) val += p * -PEN;
        else {
          var hm = new Array(n), hw = new Array(n), quedan = false;
          for (h = 0; h < n; h++) { if (b.hm[h] & bit) { hm[h] = b.hm[h] & ~bit; hw[h] = b.hw[h] / p; if (hm[h] && hw[h] > 0) quedan = true; } else { hm[h] = b.hm[h]; hw[h] = 0; } }
          if (!quedan) val += p * a1;
          else val += p * V({ hm: hm, hr: b.hr, hw: hw, aire: a1, cand: b.cand & ~bit }, v, d - 1, memo, key + '|R' + a.i + '+');
        }
      }
      if (1 - p > 1e-12) {
        var a2 = b.aire - v.R - v.Rx;
        if (a2 <= 0) val += (1 - p) * -PEN;
        else {
          var hw2 = new Array(n);
          for (h = 0; h < n; h++) hw2[h] = (b.hm[h] & bit) ? 0 : b.hw[h] / (1 - p);
          val += (1 - p) * V({ hm: b.hm, hr: b.hr, hw: hw2, aire: a2, cand: b.cand & ~bit }, v, d - 1, memo, key + '|R' + a.i + '-');
        }
      }
      return val;
    }
    var sen = v.sens[a.s];
    if (b.aire - sen.coste <= 0) return -PEN;
    var pa = pA(b, v, a.s, a.T), q = 0, tk = '|L' + a.s + '.' + a.T;
    if (pa > 1e-12) q += pa * V(posterior(b, v, a.s, a.T, 'A'), v, d - 1, memo, key + tk + 'A');
    if (1 - pa > 1e-12) q += (1 - pa) * V(posterior(b, v, a.s, a.T, 'N'), v, d - 1, memo, key + tk + 'N');
    return q;
  }
  function V(b, v, d, memo, key) {
    if (d <= 0) return hoja(b, v);
    var mk = key.split('|').sort().join('|');
    if (memo && memo.has(mk)) return memo.get(mk);
    var acts = reparacionesPosibles(b, v).concat(lecturasPosibles(b, v)), best = -Infinity;
    for (var i = 0; i < acts.length; i++) { var q = Q(b, v, acts[i], d, memo, key); if (q > best) best = q; }
    if (best === -Infinity) best = hoja(b, v);
    if (memo) memo.set(mk, best);
    return best;
  }
  function raiz(v) { return { hm: v.hm, hr: v.hr, hw: v.hw, aire: v.aire, cand: v.cand }; }
  function profundidad(v) {
    var nf = 0; for (var h = 0; h < v.hw.length; h++) if (v.hw[h] > 0) { nf = NUC.bitcount(v.hm[h]); break; }
    var dud = v.sens.some(function (s) { return s.dudoso; });
    return (v.N <= 6 && nf <= 1 && !dud) ? 3 : 2;
  }

  /* Evalúa todas las acciones candidatas en la raíz. extra = acción del jugador (se evalúa aunque esté podada) */
  function evaluar(v, opts) {
    opts = opts || {};
    var t0 = Date.now(), d = opts.d || profundidad(v), memo = new Map(), b = raiz(v);
    var acts = reparacionesPosibles(b, v).concat(lecturasPosibles(b, v)), qs = [], best = null;
    for (var i = 0; i < acts.length; i++) {
      var a = acts[i], q = Q(b, v, a, d, memo, '');
      var ent = { a: a.t === 'R' ? { t: 'R', i: a.i } : { t: 'L', s: a.s, T: a.T }, q: q };
      qs.push(ent); if (!best || q > best.q + 1e-9) best = ent;
    }
    var res = { V: best ? best.q : hoja(b, v), best: best ? best.a : null, qs: qs, d: d, hoja: hoja(b, v) };
    if (opts.extra) {
      var ex = opts.extra, f = null;
      for (var j = 0; j < qs.length; j++) if (igual(qs[j].a, ex)) { f = qs[j].q; break; }
      res.qExtra = f !== null ? f : Q(b, v, ex, d, memo, '');
    }
    res.ms = Date.now() - t0;
    return res;
  }
  function igual(a, b) { return a.t === b.t && (a.t === 'R' ? a.i === b.i : (a.s === b.s && a.T === b.T)); }

  /* Análisis de una partida jugada: arrepentimiento por paso (para la Caja negra) */
  function analizarPaso(caso, acciones, t, opts) {
    var st = NUC.reproducir(caso, acciones.slice(0, t)), v = NUC.vistaPiloto(st), a = acciones[t];
    var ex = a.t === 'R' ? { t: 'R', i: a.i } : { t: 'L', s: a.s, T: a.T };
    var ev = evaluar(v, { extra: ex, d: opts && opts.d });
    return { t: t, V: ev.V, q: ev.qExtra, best: ev.best, hoja: ev.hoja, arrep: Math.max(0, ev.V - ev.qExtra), ms: ev.ms, d: ev.d };
  }
  function analizarInicio(caso, opts) {
    var st = NUC.nuevaPartida(caso), v = NUC.vistaPiloto(st), ev = evaluar(v, { d: opts && opts.d });
    return { V: ev.V, hoja: ev.hoja, best: ev.best, ms: ev.ms };
  }

  /* ---------- Simulación (calibración y pruebas) ---------- */
  function sortearMundo(caso, rng) {
    var N = caso.N, i, j, F;
    if (caso.nF === 2) {
      var pares = [], tot = 0;
      for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) { var w = caso.prior[i] * caso.prior[j]; pares.push([i, j, w]); tot += w; }
      var u = rng() * tot, acc = 0; F = [pares[pares.length - 1][0], pares[pares.length - 1][1]];
      for (i = 0; i < pares.length; i++) { acc += pares[i][2]; if (u < acc) { F = [pares[i][0], pares[i][1]]; break; } }
    } else {
      var u1 = rng(), a1 = 0; F = [N - 1];
      for (i = 0; i < N; i++) { a1 += caso.prior[i]; if (u1 < a1) { F = [i]; break; } }
    }
    var roto = false; caso.sensores.forEach(function (s) { if (s.dudoso) roto = rng() < s.pRoto; });
    return { F: F, roto: roto };
  }
  function elegir(st, estr, d) {
    var v = NUC.vistaPiloto(st);
    if (estr === 'piloto') return evaluar(v, { d: d }).best;
    var mo = margOrden(raiz(v), v.N);
    if (estr === 'ingenua') return { t: 'R', i: mo.ord[0] };
    // 'fiable': lee el más sospechoso con el sensor puntual más fiable hasta 90 %
    var top = mo.ord[0];
    if (mo.m[top] >= 0.9) return { t: 'R', i: top };
    var bs = -1, bq = -1;
    st.sens.forEach(function (s, q) { if (s.tipo === 'p') { var f = s.sens + s.espec - s.coste * 1e-3; if (f > bq) { bq = f; bs = q; } } });
    if (bs < 0 || st.sens[bs].coste >= st.aire) return { t: 'R', i: top };
    return { t: 'L', s: bs, T: top };
  }
  function jugar(caso, estr, d, mundo, semillaSim) {
    var c2 = Object.assign({}, caso, { F: mundo.F, roto: mundo.roto, semilla: (caso.semilla ^ semillaSim) >>> 0 });
    var st = NUC.nuevaPartida(c2), guard = 0, firma = [];
    while (!st.fin && guard++ < 80) {
      var a = elegir(st, estr, d);
      if (!a) break;
      var r = NUC.aplicar(st, a);
      if (!r) break;
      firma.push(a.t === 'R' ? 'R' + a.i : 'L' + a.s + '.' + a.T + r.o);
    }
    var usados = {}; st.acciones.forEach(function (x) { if (x.t === 'L') usados[x.s] = 1; });
    return { win: st.fin === 'win', aire: st.fin === 'win' ? st.aire : 0, firma: firma.join(','), usados: usados, pasos: st.acciones.length };
  }
  function simular(caso, n, estr, d, semillaBase) {
    var rng = NUC.rngDe('sim|' + caso.tpl + '|' + caso.semilla + '|' + (semillaBase || 0));
    var wins = 0, aire = 0, firmas = {}, uso = {}, res = [];
    for (var k = 0; k < n; k++) {
      var mundo = sortearMundo(caso, rng), r = jugar(caso, estr, d, mundo, (rng() * 4294967296) >>> 0);
      if (r.win) { wins++; firmas[r.firma] = (firmas[r.firma] || 0) + 1; }
      aire += r.aire;
      Object.keys(r.usados).forEach(function (s) { uso[s] = (uso[s] || 0) + 1; });
      res.push(r);
    }
    var maxF = 0; Object.keys(firmas).forEach(function (f) { if (firmas[f] > maxF) maxF = firmas[f]; });
    return { tv: wins / n, aireMedio: aire / n, firmaMax: maxF / n, uso: uso, n: n };
  }
  /* El caso concreto (F real de la semilla), con lecturas aleatorias distintas: cuántas gana el piloto */
  function simularEsteCaso(caso, n, d) {
    var rng = NUC.rngDe('este|' + caso.tpl + '|' + caso.semilla), w = 0;
    for (var k = 0; k < n; k++) if (jugar(caso, 'piloto', d, { F: caso.F, roto: caso.roto }, (rng() * 4294967296) >>> 0).win) w++;
    return w / n;
  }

  return { PEN: PEN, evaluar: evaluar, analizarPaso: analizarPaso, analizarInicio: analizarInicio, hoja: function (v) { return hoja(raiz(v), v); },
    profundidad: profundidad, simular: simular, simularEsteCaso: simularEsteCaso, jugar: jugar, igual: igual, margOrden: margOrden };
});
