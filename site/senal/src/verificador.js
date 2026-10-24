/* JET//Señal — verificador de equivalencia: barrido del universo (2.000.718 muestras),
   contraejemplo determinista, batería fija y utilidades de azar con semilla.
   Script clásico: navegador, Worker (importScripts) y Node. Requiere reglas.js antes. */
(function (G) {
  'use strict';
  const R = G.Reglas;

  // ---------- azar con semilla ----------
  function mulberry32(a) {
    a = a >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) { // FNV-1a 32
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }

  const TOTAL = 18 + 324 + 5832 + 104976 + 1889568; // 2.000.718

  // ---------- barrido por tramos ----------
  // Recorre el universo por longitud y luego en orden lexicográfico (dígitos base 18).
  // Se detiene en la primera longitud con discrepancias, juntando hasta `max` candidatas.
  function crearBarrido(fa, fb, max) {
    max = max || 64;
    const s = new Uint8Array(5);
    let L = 1, hechos = 0, fin = false;
    const cands = [];
    s.fill(0);
    function paso(presupuesto) {
      if (fin) return true;
      let n = 0;
      while (n < presupuesto) {
        // evaluar la muestra actual
        if (fa(s, L) !== fb(s, L)) {
          cands.push(Array.from(s.subarray(0, L)));
          if (cands.length >= max) { fin = true; return true; }
        }
        n++; hechos++;
        // incremento en el sitio (el último dígito es el menos significativo)
        let i = L - 1;
        while (i >= 0) { if (++s[i] < 18) break; s[i] = 0; i--; }
        if (i < 0) { // terminó esta longitud
          if (cands.length) { fin = true; return true; }
          L++; s.fill(0);
          if (L > 5) { fin = true; return true; }
        }
      }
      return false;
    }
    return {
      paso,
      get progreso() { return Math.min(1, hechos / TOTAL); },
      get hechos() { return hechos; },
      get candidatas() { return cands; },
      get terminado() { return fin; }
    };
  }

  // distancia de edición (Levenshtein) entre filas cortas
  function edicion(a, b) {
    const m = a.length, n = b.length;
    let prev = new Array(n + 1), cur = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      const t = prev; prev = cur; cur = t;
    }
    return prev[n];
  }

  // elige, entre candidatas de la misma longitud mínima (en orden de enumeración),
  // la más cercana a cualquier muestra del registro; desempate por orden.
  function elegirContra(cands, registro) {
    if (!cands.length) return null;
    let mejor = null, md = 1e9;
    for (const c of cands) {
      let d = 1e9;
      for (const r of registro) { const e = edicion(c, r); if (e < d) d = e; }
      if (!registro.length) d = 0;
      if (d < md) { md = d; mejor = c; }
    }
    return mejor;
  }

  // versión síncrona completa (pruebas y herramientas)
  function comparar(codeA, codeB, registro) {
    const fa = R.compilar(codeA), fb = R.compilar(codeB);
    const bz = crearBarrido(fa, fb, 64);
    while (!bz.paso(1e6)) { /* sigue */ }
    if (!bz.candidatas.length) return { equivalentes: true, contra: null };
    const c = elegirContra(bz.candidatas, registro || []);
    return { equivalentes: false, contra: c, aceptaSecreta: fb(c, c.length) };
  }
  const equivalentes = (a, b) => comparar(a, b, []).equivalentes;

  // ---------- batería fija de 4.096 muestras ----------
  let _bat = null;
  function bateria() {
    if (_bat) return _bat;
    const out = [], vistos = new Set();
    const add = a => { const k = a.join(','); if (!vistos.has(k) && out.length < 4096) { vistos.add(k); out.push(a); } };
    for (let a = 0; a < 18; a++) add([a]);
    for (let a = 0; a < 18; a++) for (let b = 0; b < 18; b++) add([a, b]);
    for (let a = 0; a < 18; a++) for (let L = 3; L <= 5; L++) add(new Array(L).fill(a)); // idénticas
    const rnd = mulberry32(20261022);
    const pick = () => (rnd() * 18) | 0;
    for (let i = 0; i < 300; i++) { // palíndromos
      const L = 3 + ((rnd() * 3) | 0), h = [];
      for (let j = 0; j < Math.ceil(L / 2); j++) h.push(pick());
      const a = h.slice(); for (let j = L - Math.ceil(L / 2) - 1; j >= 0; j--) a.push(h[j]);
      add(a);
    }
    for (let i = 0; i < 300; i++) { // alternancias
      const L = 3 + ((rnd() * 3) | 0), x = pick(), y = pick(), a = [];
      for (let j = 0; j < L; j++) a.push(j % 2 ? y : x);
      add(a);
    }
    while (out.length < 4096) {
      const L = 3 + ((rnd() * 3) | 0), a = [];
      for (let j = 0; j < L; j++) a.push(pick());
      add(a);
    }
    _bat = out;
    return out;
  }
  function firma(code) {
    const f = R.compilar(code), bat = bateria(), w = new Uint32Array(128);
    for (let i = 0; i < bat.length; i++) if (f(bat[i], bat[i].length)) w[i >> 5] |= 1 << (i & 31);
    return w;
  }

  G.Verif = { mulberry32, hashStr, TOTAL, crearBarrido, edicion, elegirContra, comparar, equivalentes, bateria, firma };
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this));
