/* JET//Telemetría — núcleo de reglas (sin DOM). Lo usan el juego, el worker del piloto y las herramientas de Node.
   Reglas: DISENO.md §3. Todo es determinista a partir de (plantilla, semilla, aire). */
(function (root, factory) {
  var m = factory();
  if (typeof module === 'object' && module.exports) module.exports = m; else root.NUCLEO = m;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Azar con semilla ---------- */
  function xmur3(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    return function () { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0; };
  }
  function mulberry32(a) {
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function rngDe(str) { return mulberry32(xmur3(str)()); }
  /* u en [0,1) para la k-ésima lectura del sensor s sobre el objetivo T */
  function hashLectura(semilla, s, T, k) { return mulberry32(xmur3('L|' + semilla + '|' + s + '|' + T + '|' + k)())(); }

  /* ---------- Catálogo ---------- */
  // zona: 0 Proa, 1 Centro, 2 Popa
  var SISTEMAS = [
    { k: 'prop', zona: 2 }, { k: 'nav', zona: 0 }, { k: 'radar', zona: 0 }, { k: 'energia', zona: 1 }, { k: 'refri', zona: 2 },
    { k: 'comms', zona: 0 }, { k: 'giro', zona: 1 }, { k: 'vital', zona: 1 }, { k: 'escudo', zona: 2 }, { k: 'acople', zona: 0 }
  ];
  var SENSORES = {
    SONDA: { sens: 0.9, espec: 0.9, coste: 4, tipo: 'p' },
    RAPIDO: { sens: 0.7, espec: 0.7, coste: 1, tipo: 'p' },
    ZONA: { sens: 0.85, espec: 0.85, coste: 3, tipo: 'z' },
    ALARMISTA: { sens: 1.0, espec: 0.7, coste: 2, tipo: 'p' },
    PRUDENTE: { sens: 0.6, espec: 1.0, coste: 2, tipo: 'p' }
  };
  var DANADO = 0.6;
  function zonaDe(cat, N) {
    if (N <= 5) return -1;
    if (N === 6 && cat === 5) return 1; // en N=6 Comunicaciones pasa al centro para tener 2/2/2
    return SISTEMAS[cat].zona;
  }

  /* ---------- Generador de casos ---------- */
  function shuffle(a, rng) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function generarCaso(tpl, semilla, aire) {
    semilla = semilla >>> 0;
    var rng = rngDe('caso|' + tpl.id + '|' + semilla);
    var N = tpl.N, i, j;
    // sistemas: los N primeros del catálogo, agrupados por zona y barajados dentro de cada zona
    var cats = []; for (i = 0; i < N; i++) cats.push(i);
    var orden;
    if (N <= 5) orden = shuffle(cats.slice(), rng);
    else {
      orden = [];
      for (var z = 0; z < 3; z++) orden = orden.concat(shuffle(cats.filter(function (c) { return zonaDe(c, N) === z; }), rng));
    }
    var sis = orden.map(function (c) { return { cat: c, k: SISTEMAS[c].k, zona: zonaDe(c, N) }; });
    // previas
    var prior = []; for (i = 0; i < N; i++) prior.push(1);
    var bitacora = [];
    if (tpl.bit) {
      var idx = shuffle(cats.slice(), rng).slice(0, tpl.bit);
      idx.forEach(function (ii) { var x = 2 + Math.floor(rng() * 3); prior[ii] = x; bitacora.push({ i: ii, veces: x }); });
    }
    prior = normalizarPrevia(prior);
    // averías reales (forzadas en el tutorial)
    var F = [];
    if (tpl.forzarF) {
      F = tpl.forzarF.map(function (k) { for (var q = 0; q < N; q++) if (sis[q].k === k) return q; return 0; });
    } else if (tpl.nF === 2) {
      var pares = [], tot = 0;
      for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) { var w = prior[i] * prior[j]; pares.push([i, j, w]); tot += w; }
      var u = rng() * tot, acc = 0, el = pares[pares.length - 1];
      for (i = 0; i < pares.length; i++) { acc += pares[i][2]; if (u < acc) { el = pares[i]; break; } }
      F = [el[0], el[1]];
    } else {
      var u1 = rng(), a1 = 0; F = [N - 1];
      for (i = 0; i < N; i++) { a1 += prior[i]; if (u1 < a1) { F = [i]; break; } }
    }
    // sensores
    var sensores = tpl.sens.map(function (k) {
      var b = SENSORES[k];
      return { k: k, sens: b.sens, espec: b.espec, coste: b.coste, tipo: b.tipo, dudoso: false, pRoto: 0 };
    });
    var roto = false;
    if (tpl.dudoso) {
      var ds = tpl.sens.indexOf(tpl.dudoso);
      sensores[ds].dudoso = true; sensores[ds].pRoto = tpl.pRoto || 0.5;
      roto = rng() < sensores[ds].pRoto;
    }
    var eventos = [];
    if (tpl.danio) eventos.push({ tras: tpl.danioTras || (2 + Math.floor(rng() * 3)), s: tpl.sens.indexOf(tpl.danio) });
    var zonas = [0, 0, 0];
    sis.forEach(function (s, q) { if (s.zona >= 0) zonas[s.zona] |= (1 << q); });
    var sintoma = Math.floor(rng() * 16);
    return {
      tpl: tpl.id, semilla: semilla, N: N, sis: sis, prior: prior, bitacora: bitacora, nF: F.length, F: F, roto: roto,
      sensores: sensores, eventos: eventos, zonas: zonas, aire0: aire || tpl.aire, R: tpl.R, Rx: tpl.Rx, sintoma: sintoma,
      hayZonas: N > 5
    };
  }
  function normalizarPrevia(p) {
    var s = 0, i; for (i = 0; i < p.length; i++) s += p[i];
    var q = p.map(function (x) { return x / s; });
    // tope 0,45 por sistema, repartiendo el exceso entre los demás
    for (var it = 0; it < 10; it++) {
      var exc = 0, libres = 0;
      for (i = 0; i < q.length; i++) { if (q[i] > 0.45) { exc += q[i] - 0.45; q[i] = 0.45; } else if (q[i] < 0.45) libres += q[i]; }
      if (exc < 1e-12) break;
      for (i = 0; i < q.length; i++) if (q[i] < 0.45) q[i] += exc * q[i] / libres;
    }
    return q;
  }

  /* ---------- Partida: estado, creencia y acciones ---------- */
  function mascaraObjetivo(caso, T) { return T >= 100 ? caso.zonas[T - 100] : (1 << T); }
  function bitcount(x) { x = x - ((x >> 1) & 0x55555555); x = (x & 0x33333333) + ((x >> 2) & 0x33333333); return (((x + (x >> 4)) & 0xF0F0F0F) * 0x1010101) >> 24; }

  function nuevaPartida(caso) {
    var hm = [], hr = [], hw = [], i, j, N = caso.N;
    var base = [];
    if (caso.nF === 2) { for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) base.push([(1 << i) | (1 << j), caso.prior[i] * caso.prior[j]]); }
    else for (i = 0; i < N; i++) base.push([1 << i, caso.prior[i]]);
    var ds = -1; caso.sensores.forEach(function (s, q) { if (s.dudoso) ds = q; });
    base.forEach(function (b) {
      if (ds >= 0) { var p = caso.sensores[ds].pRoto; hm.push(b[0]); hr.push(0); hw.push(b[1] * (1 - p)); hm.push(b[0]); hr.push(1); hw.push(b[1] * p); }
      else { hm.push(b[0]); hr.push(0); hw.push(b[1]); }
    });
    var st = {
      caso: caso, aire: caso.aire0, acciones: [], hm: hm, hr: hr, hw: hw, ds: ds,
      rep: 0, desc: 0, real: caso.F.reduce(function (a, f) { return a | (1 << f); }, 0),
      sens: caso.sensores.map(function (s) { return { sens: s.sens, espec: s.espec, coste: s.coste, tipo: s.tipo, dudoso: s.dudoso, danado: false }; }),
      nLect: 0, conteo: {}, fin: null
    };
    normalizar(st);
    return st;
  }
  function normalizar(st) {
    var s = 0, i; for (i = 0; i < st.hw.length; i++) s += st.hw[i];
    if (s > 0) for (i = 0; i < st.hw.length; i++) st.hw[i] /= s;
  }
  function marginales(st) {
    var N = st.caso.N, m = new Array(N).fill(0);
    for (var h = 0; h < st.hw.length; h++) { var w = st.hw[h]; if (!w) continue; var mk = st.hm[h]; for (var i = 0; i < N; i++) if (mk & (1 << i)) m[i] += w; }
    return m;
  }
  function confianzaSensor(st) { // P(sensor dudoso sano)
    if (st.ds < 0) return 1;
    var s = 0; for (var h = 0; h < st.hw.length; h++) if (!st.hr[h]) s += st.hw[h];
    return s;
  }
  function pAlerta(sen, positivo, roto) { return roto ? 0.5 : (positivo ? sen.sens : 1 - sen.espec); }
  function faltan(st) { return bitcount(st.real); }
  function candidatos(st) { var c = 0; for (var i = 0; i < st.caso.N; i++) if (!(st.rep & (1 << i)) && !(st.desc & (1 << i))) c |= (1 << i); return c; }
  function lecturaValida(st, s, T) {
    var sen = st.sens[s]; if (!sen) return false;
    if (sen.tipo === 'z') return T >= 100 && T <= 102 && st.caso.hayZonas && st.caso.zonas[T - 100] !== 0;
    return T >= 0 && T < st.caso.N;
  }
  function reparacionValida(st, i) { return i >= 0 && i < st.caso.N && !!(candidatos(st) & (1 << i)); }

  /* Aplica una acción {t:'L',s,T} o {t:'R',i}. Devuelve un registro con lo que pasó. Muta st. */
  function aplicar(st, a) {
    if (st.fin) return null;
    var caso = st.caso, rec;
    if (a.t === 'L') {
      if (!lecturaValida(st, a.s, a.T)) return null;
      var sen = st.sens[a.s], key = a.s + ':' + a.T, k = st.conteo[key] || 0;
      st.conteo[key] = k + 1;
      var tm = mascaraObjetivo(caso, a.T);
      var roto = sen.dudoso && caso.roto;
      var pr = pAlerta(sen, (st.real & tm) !== 0, roto);
      var u = hashLectura(caso.tpl + ':' + caso.semilla, a.s, a.T, k);
      var o = u < pr ? 'A' : 'N';
      // creencia
      for (var h = 0; h < st.hw.length; h++) {
        var pa = pAlerta(sen, (st.hm[h] & tm) !== 0, sen.dudoso && st.hr[h] === 1);
        st.hw[h] *= (o === 'A' ? pa : 1 - pa);
      }
      normalizar(st);
      st.aire -= sen.coste; st.nLect++;
      rec = { t: 'L', s: a.s, T: a.T, o: o, c: sen.coste, k: k, fiab: [sen.sens, sen.espec] };
      // evento de sobretensión
      caso.eventos.forEach(function (ev) {
        if (ev.tras === st.nLect && !st.sens[ev.s].danado) { var x = st.sens[ev.s]; x.danado = true; x.sens = DANADO; x.espec = DANADO; rec.danio = ev.s; }
      });
    } else if (a.t === 'R') {
      if (!reparacionValida(st, a.i)) return null;
      var bit = 1 << a.i, ok = (st.real & bit) !== 0, c = caso.R + (ok ? 0 : caso.Rx);
      for (var g = 0; g < st.hw.length; g++) {
        var tiene = (st.hm[g] & bit) !== 0;
        if (ok) { if (tiene) st.hm[g] &= ~bit; else st.hw[g] = 0; }
        else if (tiene) st.hw[g] = 0;
      }
      normalizar(st);
      if (ok) { st.real &= ~bit; st.rep |= bit; } else st.desc |= bit;
      st.aire -= c;
      rec = { t: 'R', i: a.i, ok: ok, c: c };
    } else return null;
    st.acciones.push(rec);
    if (st.aire <= 0) st.fin = 'lose';
    else if (st.real === 0) st.fin = 'win';
    return rec;
  }
  function reproducir(caso, acciones) {
    var st = nuevaPartida(caso);
    for (var i = 0; i < acciones.length; i++) { var a = acciones[i]; aplicar(st, a.t === 'L' ? { t: 'L', s: a.s, T: a.T } : { t: 'R', i: a.i }); }
    return st;
  }
  /* Instantánea liviana de la creencia para el piloto (sin referencias al caso real) */
  function vistaPiloto(st) {
    var c = st.caso;
    return {
      N: c.N, R: c.R, Rx: c.Rx, aire: st.aire, zonas: c.zonas.slice(), hayZonas: c.hayZonas,
      hm: st.hm.slice(), hr: st.hr.slice(), hw: st.hw.slice(), cand: candidatos(st),
      sens: st.sens.map(function (s) { return { sens: s.sens, espec: s.espec, coste: s.coste, tipo: s.tipo, dudoso: s.dudoso }; })
    };
  }

  /* ---------- Fechas del caso diario (medianoche local) ---------- */
  var DIA0 = Date.UTC(2026, 9, 22); // 2026-10-22 = caso #1
  function fechaLocal(d) { d = d || new Date(); var m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; }
  function numeroDiario(fecha) { var p = fecha.split('-').map(Number); return Math.round((Date.UTC(p[0], p[1] - 1, p[2]) - DIA0) / 86400000) + 1; }
  function diaSemana(fecha) { var p = fecha.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay(); }

  return {
    xmur3: xmur3, mulberry32: mulberry32, rngDe: rngDe, hashLectura: hashLectura,
    SISTEMAS: SISTEMAS, SENSORES: SENSORES, DANADO: DANADO,
    generarCaso: generarCaso, nuevaPartida: nuevaPartida, aplicar: aplicar, reproducir: reproducir,
    marginales: marginales, confianzaSensor: confianzaSensor, candidatos: candidatos, faltan: faltan,
    lecturaValida: lecturaValida, reparacionValida: reparacionValida, mascaraObjetivo: mascaraObjetivo,
    pAlerta: pAlerta, vistaPiloto: vistaPiloto, bitcount: bitcount,
    fechaLocal: fechaLocal, numeroDiario: numeroDiario, diaSemana: diaSemana
  };
});
