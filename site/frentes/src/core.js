/* JET//Frentes · núcleo de reglas (sin DOM). Mismo algoritmo que api.php: cualquier cambio aquí
   se replica allí y se comprueba con tests/paridad.mjs. Funciona en el navegador (window.FCore)
   y en Node (require). */
(function (root) {
  'use strict';
  const EPOCH = '2026-10-22';            // frente #1 (ver LEEME.md: se adelantó un día para abrir el día de la publicación)
  const NP = 5, SHIPS = 100, TOTAL = 15;
  const PROFILES = [[1,2,3,4,5],[1,1,3,4,6],[2,2,3,3,5],[1,2,2,3,7],[1,3,3,4,4],[2,2,2,4,5],
    [1,1,2,5,6],[1,2,4,4,4],[1,1,1,5,7],[2,3,3,3,4],[1,2,3,3,6],[1,1,4,4,5]];
  const PLANETS = ['Aria', 'Boreal', 'Cobalto', 'Dunas', 'Eco'];

  // ---------- azar con semilla ----------
  function hash32(s) {
    let h = 0x811c9dc5;
    const str = unescape(encodeURIComponent(String(s)));   // bytes UTF-8
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rngFor = (s) => mulberry32(hash32(s));

  // ---------- fechas ----------
  function dayNum(f) { const [y, m, d] = f.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); }
  function fromDayNum(n) { const d = new Date(n * 86400000); return d.toISOString().slice(0, 10); }
  function addDays(f, n) { return fromDayNum(dayNum(f) + n); }
  function localDate(now) { const d = now || new Date(); const p = (x) => String(x).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function frontNum(f) { return dayNum(f) - dayNum(EPOCH) + 1; }
  const validDate = (f) => typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f) && fromDayNum(dayNum(f)) === f;

  // ---------- valores del día ----------
  function valoresIntento(f, k) {
    const r = rngFor('frentes|' + f + '|' + k);
    const p = PROFILES[Math.floor(r() * PROFILES.length)].slice();
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
    return p;
  }
  function maxIdx(v) { let b = 0; for (let i = 1; i < v.length; i++) if (v[i] > v[b]) b = i; return b; }
  function cumple(prev, cur) {
    let n = 0; for (let i = 0; i < NP; i++) if (Math.abs(cur[i] - prev[i]) >= 2) n++;
    return n >= 2 && maxIdx(cur) !== maxIdx(prev);
  }
  const vCache = new Map();
  // Día cero = EPOCH−1 (intento 0). Desde ahí la cadena: primer intento k que cumple las dos reglas.
  function valores(f) {
    if (vCache.has(f)) return vCache.get(f).slice();
    const z = dayNum(EPOCH) - 1, n = dayNum(f);
    if (n <= z) { const v = valoresIntento(f, 0); vCache.set(f, v); return v.slice(); }
    let last = null, from = n;
    while (from > z && !vCache.has(fromDayNum(from - 1))) from--;
    if (from <= z) { from = z + 1; last = valoresIntento(fromDayNum(z), 0); vCache.set(fromDayNum(z), last); }
    else last = vCache.get(fromDayNum(from - 1));
    for (let d = from; d <= n; d++) {
      const fd = fromDayNum(d); let v = null;
      for (let k = 0; k < 400; k++) { const c = valoresIntento(fd, k); if (cumple(last, c)) { v = c; break; } }
      if (!v) v = valoresIntento(fd, 0);
      vCache.set(fd, v); last = v;
    }
    return vCache.get(f).slice();
  }
  function valoresAleatorios(code, k) { return valoresIntento('R|' + code, k || 0); }

  // ---------- reparto por mayor resto ----------
  function alloc(total, w) {
    let s = 0; for (const x of w) s += x;
    const n = w.length, out = new Array(n).fill(0);
    if (s <= 0) { out[0] = total; return out; }
    const fr = []; let used = 0;
    for (let i = 0; i < n; i++) { const raw = total * w[i] / s; out[i] = Math.floor(raw); used += out[i]; fr.push([raw - out[i], i]); }
    fr.sort((a, b) => (b[0] - a[0]) || (a[1] - b[1]));
    for (let k = 0; k < total - used; k++) out[fr[k % n][1]]++;
    return out;
  }

  // ---------- rivales de práctica ----------
  function orderByValue(v, r) {
    const keys = v.map((x, i) => [x + r() * 0.5, i]);
    keys.sort((a, b) => (b[0] - a[0]) || (a[1] - b[1]));
    return keys.map((k) => k[1]);
  }
  function rivalAgresivo(v, r, ships) {
    ships = ships || SHIPS; const n = v.length, tot = v.reduce((a, b) => a + b, 0);
    const ord = orderByValue(v, r); const pick = []; let s = 0;
    for (const i of ord) { if (s > tot / 2) break; pick.push(i); s += v[i]; }
    if (r() < 0.3 && pick.length < n) pick.push(ord[pick.length]);
    const w = new Array(n).fill(0);
    for (const i of pick) w[i] = v[i] * (0.8 + r() * 0.45);
    return alloc(ships, w);
  }
  function rivalEquilibrado(v, r, ships) {
    ships = ships || SHIPS; const n = v.length;
    const base = Math.min(4, Math.floor(ships / n / 2));
    const w = v.map((x) => x * (0.7 + r() * 0.6));
    const a = alloc(ships - base * n, w);
    return a.map((x) => x + base);
  }
  function rivalSorpresa(v, r, ships) {
    ships = ships || SHIPS; const n = v.length, tot = v.reduce((a, b) => a + b, 0);
    const top = maxIdx(v); const out = new Array(n).fill(0);
    out[top] = Math.min(Math.floor(r() * 7), Math.floor(ships / 8));
    const others = []; for (let i = 0; i < n; i++) if (i !== top) others.push(i);
    for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = others[i]; others[i] = others[j]; others[j] = t; }
    const sub = []; let s = 0;
    for (const i of others) { if (s > tot / 2) break; sub.push(i); s += v[i]; }
    let left = ships - out[top];
    for (const i of others) if (sub.indexOf(i) < 0) { const d = Math.min(left, Math.floor(r() * 4)); out[i] = d; left -= d; }
    const w = new Array(n).fill(0); for (const i of sub) w[i] = v[i] * (0.8 + r() * 0.45);
    const a = alloc(left, w);
    for (let i = 0; i < n; i++) out[i] += a[i];
    return out;
  }
  const STYLES = { agresivo: rivalAgresivo, equilibrado: rivalEquilibrado, sorpresa: rivalSorpresa };
  const STYLE_KEYS = ['agresivo', 'equilibrado', 'sorpresa'];
  // Flota de práctica: 35 % Agresivo, 40 % Equilibrado, 25 % Sorpresa; la mitad de cada estilo
  // calcula con vAyer («sombra de ayer»). Devuelve Uint8Array de n×5.
  function flotaPractica(seed, n, vHoy, vAyer) {
    const r = rngFor('frentes-flota|' + seed);
    const out = new Uint8Array(n * NP);
    const na = Math.round(n * 0.35), ne = Math.round(n * 0.75);
    for (let i = 0; i < n; i++) {
      const st = i < na ? rivalAgresivo : i < ne ? rivalEquilibrado : rivalSorpresa;
      const v = (i % 2 === 1) ? vAyer : vHoy;
      const x = st(v, r, SHIPS);
      for (let p = 0; p < NP; p++) out[i * NP + p] = x[p];
    }
    return out;
  }
  // Rivales de práctica que completan la flota que atacan los jugadores del día fAtaque: representan a los
  // jugadores de ayer; la mitad calcula con los valores de hoy y la otra mitad con los de ayer (calibrado en §9.5).
  function flotaPracticaDia(fAtaque, n) {
    const full = flotaPractica(addDays(fAtaque, -1), 200, valores(fAtaque), valores(addDays(fAtaque, -1)));
    if (n >= 200) return full;
    const r = rngFor('frentes-mezcla|' + fAtaque); const idx = []; for (let i = 0; i < 200; i++) idx.push(i);
    for (let i = 199; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    const out = new Uint8Array(Math.max(0, n) * NP);
    for (let k = 0; k < n; k++) for (let p = 0; p < NP; p++) out[k * NP + p] = full[idx[k] * NP + p];
    return out;
  }
  function fleetChecksum(fl) { let h = 0x811c9dc5; for (let i = 0; i < fl.length; i++) { h ^= fl[i]; h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }

  // ---------- duelo y evaluación ----------
  function duel(x, y, v) {
    let a = 0, b = 0;
    for (let p = 0; p < v.length; p++) { if (x[p] > y[p]) a += v[p]; else if (y[p] > x[p]) b += v[p]; }
    return { a, b, r: a > b ? 1 : a < b ? -1 : 0 };
  }
  // flota: Uint8Array plana de N×np
  function score(x, fl, v, np) {
    np = np || NP; const N = fl.length / np; let s2 = 0;
    for (let j = 0, o = 0; j < N; j++, o += np) {
      let d = 0;
      for (let p = 0; p < np; p++) { const y = fl[o + p], xp = x[p]; if (xp > y) d += v[p]; else if (y > xp) d -= v[p]; }
      s2 += d > 0 ? 2 : d === 0 ? 1 : 0;
    }
    return s2; // en medios duelos
  }
  function evaluar(x, fl, v, np) {
    np = np || NP; const N = fl.length / np;
    let w = 0, d = 0, l = 0;
    const pl = []; for (let p = 0; p < np; p++) pl.push({ gane: 0, empate: 0, perdi: 0 });
    for (let j = 0, o = 0; j < N; j++, o += np) {
      let s = 0;
      for (let p = 0; p < np; p++) {
        const y = fl[o + p], xp = x[p];
        if (xp > y) { s += v[p]; pl[p].gane++; } else if (y > xp) { s -= v[p]; pl[p].perdi++; } else pl[p].empate++;
      }
      if (s > 0) w++; else if (s < 0) l++; else d++;
    }
    for (let p = 0; p < np; p++) {
      const col = []; for (let j = 0; j < N; j++) col.push(fl[j * np + p]);
      col.sort((a, b) => a - b);
      pl[p].p95 = N ? Math.min(SHIPS, col[Math.max(0, Math.ceil(0.95 * N) - 1)] + 1) : 1;
      pl[p].pGane = N ? pl[p].gane / N * 100 : 0;
    }
    const pct = N ? (w + 0.5 * d) / N * 100 : 0;
    return { w, d, l, N, pct, pl };
  }
  function intel(fl, np) {
    np = np || NP; const N = fl.length / np; const media = [], mediana = [], vacio = [];
    for (let p = 0; p < np; p++) {
      const col = []; let s = 0, z = 0;
      for (let j = 0; j < N; j++) { const y = fl[j * np + p]; col.push(y); s += y; if (y === 0) z++; }
      col.sort((a, b) => a - b);
      media.push(N ? Math.round(s / N * 10) / 10 : 0);
      mediana.push(N ? (N % 2 ? col[(N - 1) / 2] : (col[N / 2 - 1] + col[N / 2]) / 2) : 0);
      vacio.push(N ? Math.round(z / N * 100) : 0);
    }
    return { media, mediana, vacio };
  }
  function histogram(fl, p, np) {
    np = np || NP; const N = fl.length / np; const h = new Uint16Array(SHIPS + 1);
    for (let j = 0; j < N; j++) h[fl[j * np + p]]++;
    return h;
  }

  // ---------- mejor jugada encontrada ----------
  function dpStart(fl, v, ships) {
    const N = fl.length / NP; const g = [];
    for (let p = 0; p < NP; p++) {
      const h = new Float64Array(ships + 2); for (let j = 0; j < N; j++) { const y = fl[j * NP + p]; if (y <= ships) h[y]++; }
      const c = new Float64Array(ships + 1); let acc = 0;
      for (let s = 0; s <= ships; s++) { c[s] = v[p] * acc / Math.max(1, N); acc += h[s]; }
      g.push(c);
    }
    // dp[p][t]
    let best = new Float64Array(ships + 1).fill(-1e9); best[0] = 0; const choice = [];
    for (let p = 0; p < NP; p++) {
      const nb = new Float64Array(ships + 1).fill(-1e9), ch = new Int16Array(ships + 1);
      for (let t = 0; t <= ships; t++) for (let s = 0; s <= t; s++) {
        const val = best[t - s] + g[p][s]; if (val > nb[t] + 1e-12) { nb[t] = val; ch[t] = s; }
      }
      choice.push(ch); best = nb;
    }
    const x = new Array(NP).fill(0); let t = ships;
    for (let p = NP - 1; p >= 0; p--) { x[p] = choice[p][t]; t -= x[p]; }
    return x;
  }
  const KS = [1, 2, 3, 5, 8, 13];
  function localSearch(x, fl, v, deadline, cap) {
    let cur = score(x, fl, v), evals = 0, improved = true;
    while (improved && evals < cap.n && Date.now() < deadline) {
      improved = false;
      outer: for (const k of KS) for (let a = 0; a < NP; a++) {
        if (x[a] < k) continue;
        for (let b = 0; b < NP; b++) {
          if (b === a) continue;
          x[a] -= k; x[b] += k; const s = score(x, fl, v); evals++; cap.n--;
          if (s > cur) { cur = s; improved = true; break outer; }
          x[a] += k; x[b] -= k;
          if (cap.n <= 0) break outer;
        }
      }
    }
    return cur;
  }
  function mejor(fl, v, opts) {
    opts = opts || {}; const budget = opts.ms || 300, seed = opts.seed || 'mejor';
    const deadline = Date.now() + budget, cap = { n: opts.maxEvals || 6000 };
    const N = fl.length / NP;
    if (!N) return { x: [20, 20, 20, 20, 20], pct: 0 };
    const start = dpStart(fl, v, SHIPS);
    let bx = start.slice(), bs = localSearch(bx, fl, v, deadline, cap);
    const r = rngFor('frentes-mejor|' + seed);
    for (let k = 0; k < 6 && Date.now() < deadline && cap.n > 0; k++) {
      const x = start.slice();
      for (let m = 0; m < 6; m++) { const a = Math.floor(r() * NP), b = Math.floor(r() * NP); const q = Math.min(x[a], 1 + Math.floor(r() * 10)); x[a] -= q; x[b] += q; }
      const s = localSearch(x, fl, v, deadline, cap);
      if (s > bs) { bs = s; bx = x; }
    }
    return { x: bx, pct: bs / 2 / N * 100 };
  }
  // Valor marginal de +1 nave en cada planeta (para el Análisis)
  function marginales(x, fl, v, reserve) {
    const base = score(x, fl, v), N = fl.length / NP, out = [];
    for (let p = 0; p < NP; p++) {
      if (reserve > 0) { x[p]++; const s = score(x, fl, v); x[p]--; out.push({ d: (s - base) / 2 / N * 100, from: -1 }); }
      else {
        let best = null;
        for (let q = 0; q < NP; q++) {
          if (q === p || x[q] === 0) continue;
          x[p]++; x[q]--; const s = score(x, fl, v); x[p]--; x[q]++;
          if (!best || s > best.s) best = { s, q };
        }
        out.push(best ? { d: (best.s - base) / 2 / N * 100, from: best.q } : { d: 0, from: -1 });
      }
    }
    return out;
  }

  // ---------- Academia ----------
  // Recorre todas las composiciones con Σ ≤ ships; devuelve soluciones que vencen a todos los rivales.
  function resolverMision(m, limit) {
    const n = m.planets, v = m.values, R = m.rivals; let count = 0, min = Infinity, total = 0; const minSols = [];
    const x = new Array(n).fill(0);
    (function rec(p, left) {
      if (p === n) {
        total++;
        for (const y of R) if (duel(x, y, v).r !== 1) return;
        count++; const used = m.ships - left;
        if (used < min) { min = used; minSols.length = 0; }
        if (used === min && minSols.length < (limit || 50)) minSols.push(x.slice());
        return;
      }
      for (let s = 0; s <= left; s++) { x[p] = s; rec(p + 1, left - s); }
      x[p] = 0;
    })(0, m.ships);
    return { count, total, min: count ? min : null, minSols, density: count / total };
  }
  function estrellas(m, x) {
    const used = x.reduce((a, b) => a + b, 0);
    for (const y of m.rivals) if (duel(x, y, m.values).r !== 1) return 0;
    if (used <= m.minShips) return 3;
    if (used <= m.star2) return 2;
    return 1;
  }

  // ---------- metajuego ----------
  const RANKS = [0, 5, 15, 35, 70, 120, 200];
  function rango(meritos) { let r = 0; for (let i = 0; i < RANKS.length; i++) if (meritos >= RANKS[i]) r = i; return r; }
  function medalla(pct, bestPct) {
    if (bestPct != null && pct > bestPct + 1e-9) return 4;
    // umbrales sobre el % que ve el jugador (redondeado): «50 %» en el titular siempre da bronce
    const q = Math.round(pct);
    return q >= 90 ? 3 : q >= 75 ? 2 : q >= 50 ? 1 : 0;
  }
  // flota comprimida <-> base64
  function fleetToB64(fl) { let s = ''; for (let i = 0; i < fl.length; i++) s += String.fromCharCode(fl[i]); return typeof btoa === 'function' ? btoa(s) : Buffer.from(fl).toString('base64'); }
  function fleetFromB64(b) {
    const s = typeof atob === 'function' ? atob(b) : Buffer.from(b, 'base64').toString('binary');
    const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = Math.min(SHIPS, s.charCodeAt(i)); return out;
  }
  function randomCode(r) { const a = '0123456789ABCDEF'; let s = ''; for (let i = 0; i < 4; i++) s += a[Math.floor(r() * 16)]; return s; }

  const FCore = { EPOCH, NP, SHIPS, TOTAL, PROFILES, PLANETS, hash32, mulberry32, rngFor, dayNum, fromDayNum, addDays, localDate, frontNum, validDate,
    valoresIntento, valores, valoresAleatorios, cumple, maxIdx, alloc, STYLES, STYLE_KEYS, rivalAgresivo, rivalEquilibrado, rivalSorpresa, flotaPractica, flotaPracticaDia, fleetChecksum,
    duel, score, evaluar, intel, histogram, mejor, marginales, resolverMision, estrellas, RANKS, rango, medalla, fleetToB64, fleetFromB64, randomCode };
  if (typeof module !== 'undefined' && module.exports) module.exports = FCore; else root.FCore = FCore;
})(typeof window !== 'undefined' ? window : globalThis);
