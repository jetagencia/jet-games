// JET//Caja Negra · generador pseudoaleatorio con semilla (mulberry32) y hash de cadena.
// Se carga en el navegador (window.CNX) y en Node (tools/validar.mjs) sin cambios.
(function (G) {
  'use strict';
  const CNX = G.CNX || (G.CNX = {});

  // Hash de cadena de 32 bits (FNV-1a con mezcla final). Estable entre navegadores y Node.
  function hash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }

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

  // Envoltorio cómodo: r.f() [0,1), r.i(a,b) entero inclusivo, r.pick(arr), r.shuffle(arr) (copia), r.chance(p)
  function RNG(seed) {
    const f = mulberry32(seed);
    const r = {
      seed: seed >>> 0,
      f,
      i(a, b) { return a + Math.floor(f() * (b - a + 1)); },
      pick(arr) { return arr[Math.floor(f() * arr.length)]; },
      chance(p) { return f() < p; },
      shuffle(arr) {
        const a = arr.slice();
        for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(f() * (k + 1)); const t = a[k]; a[k] = a[j]; a[j] = t; }
        return a;
      },
      sample(arr, n) { return r.shuffle(arr).slice(0, n); },
      weighted(items) { // [[valor, peso], ...]
        let tot = 0; for (const it of items) tot += it[1];
        let x = f() * tot;
        for (const it of items) { x -= it[1]; if (x < 0) return it[0]; }
        return items[items.length - 1][0];
      }
    };
    return r;
  }

  // Base 36 en mayúsculas, 4-6 caracteres, para los números de caso de práctica (P-7K2Q).
  function b36(n) { return (n >>> 0).toString(36).toUpperCase(); }
  function deB36(s) { const n = parseInt(String(s || '').trim(), 36); return Number.isFinite(n) ? (n >>> 0) : null; }

  CNX.hash = hash;
  CNX.mulberry32 = mulberry32;
  CNX.RNG = RNG;
  CNX.b36 = b36;
  CNX.deB36 = deB36;
})(typeof window !== 'undefined' ? window : globalThis);
