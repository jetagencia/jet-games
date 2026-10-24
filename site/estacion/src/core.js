// JET//Estación Silencio · núcleo: normalización, hashes, verificación, semilla, guardado.
'use strict';
const C = window.CONTENT;
const MODS = ['oxigeno', 'energia', 'comunicaciones', 'navegacion', 'archivo', 'tripulacion'];
const MOD_PUZ = {
  prologo: ['p1', 'p2', 'p3'],
  oxigeno: ['o2-1', 'o2-2', 'o2-3', 'o2-4', 'o2-meta'], energia: ['en-1', 'en-2', 'en-3', 'en-4', 'en-meta'],
  comunicaciones: ['co-1', 'co-2', 'co-3', 'co-4', 'co-meta'], navegacion: ['na-1', 'na-2', 'na-3', 'na-4', 'na-meta'],
  archivo: ['ar-1', 'ar-2', 'ar-3', 'ar-4', 'ar-meta'], tripulacion: ['tr-1', 'tr-2', 'tr-3', 'tr-4', 'tr-meta'],
  observatorio: ['final'],
};
const META_OF = { oxigeno: 'o2-meta', energia: 'en-meta', comunicaciones: 'co-meta', navegacion: 'na-meta', archivo: 'ar-meta', tripulacion: 'tr-meta' };
const META_WORD = { oxigeno: 'VEGA', energia: 'TITAN', comunicaciones: 'LYRA', navegacion: 'ORION', archivo: 'ATLAS', tripulacion: 'NOVA' };
const MOD_COL = { prologo: '#9fb4ff', oxigeno: '#3fe0b0', energia: '#ffb347', comunicaciones: '#00f2cf', navegacion: '#5b8cff', archivo: '#ffd28a', tripulacion: '#a46bff', observatorio: '#eef3ff' };
const NAMES = ['ALEXIS', 'ADRIAN', 'MARTIN', 'ISABEL', 'SAMUEL'];
const CODE_AL = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const KEY = 'jet-estacion:v1:';

function norm(s) {
  s = String(s || '').normalize('NFC').replace(/[ñÑ]/g, '\u0001');
  s = s.normalize('NFD').replace(/\p{M}/gu, '').replace(/\u0001/g, 'Ñ');
  return s.toLocaleUpperCase('es').replace(/[^A-Z0-9Ñ]/g, '').slice(0, 24);
}
function hstr(s) { let h = 2166136261 >>> 0; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffleR(r, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------- semilla ↔ código de partida (6 caracteres, 30 bits) ----------
function codeOf(seed) { let s = ''; let x = seed >>> 0; for (let i = 0; i < 6; i++) { s = CODE_AL[x & 31] + s; x >>>= 5; } return s; }
function seedOf(code) { code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (code.length !== 6) return null; let x = 0; for (const ch of code) { const i = CODE_AL.indexOf(ch); if (i < 0) return null; x = (x << 5 | i) >>> 0; } return x >>> 0; }
function newSeed() { const a = new Uint32Array(1); try { crypto.getRandomValues(a); } catch (e) { a[0] = Math.random() * 2 ** 32; } return a[0] & 0x3fffffff; }

// ---------- hashes PBKDF2 (WebCrypto, asíncrono, con caché) ----------
const HC = new Map(); const enc = new TextEncoder();
const CRYPTO_OK = !!(window.crypto && crypto.subtle && window.isSecureContext !== false);
async function H(x, salt) {
  const k = salt + '|' + x; if (HC.has(k)) return HC.get(k);
  const km = await crypto.subtle.importKey('raw', enc.encode(x), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: C.iter, hash: 'SHA-256' }, km, 128);
  const hex = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  HC.set(k, hex); return hex;
}
async function deob(b64, salt) {
  const k = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode('obf:' + salt)));
  const b = Uint8Array.from(atob(b64), c => c.charCodeAt(0)); for (let i = 0; i < b.length; i++) b[i] ^= k[i % 32];
  return new TextDecoder().decode(b);
}
async function decryptRec(packed, key, recId) {
  try {
    const [iv, ct] = packed.split('.').map(s => Uint8Array.from(atob(s), c => c.charCodeAt(0)));
    const km = await crypto.subtle.importKey('raw', enc.encode(norm(key)), 'PBKDF2', false, ['deriveKey']);
    const k = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('jet-estacion:rec:' + recId), iterations: C.iter, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k, ct));
  } catch (e) { return null; }
}

// ---------- almacenamiento seguro ----------
let STORAGE_OK = true;
function lsGet(k, d) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : d; } catch (e) { STORAGE_OK = false; return d; } }
function lsSet(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); return true; } catch (e) { STORAGE_OK = false; return false; } }
function lsDel(k) { try { localStorage.removeItem(KEY + k); } catch (e) { } }
try { localStorage.setItem(KEY + 'probe', '1'); localStorage.removeItem(KEY + 'probe'); } catch (e) { STORAGE_OK = false; }

// ---------- modelo de partida ----------
function freshGame(seed) {
  seed = seed >>> 0;
  return { v: 1, seed, code: codeOf(seed), startedAt: Date.now(), activeMs: 0, room: 'prologo', open: null,
    pz: {}, frags: {}, metas: {}, plate: [], rec: {}, notes: {}, clips: [], ui: {}, introSeen: false, freeHintUsed: false,
    finished: false, finishedAt: 0, hintsUsed: 0, sessions: 1 };
}
let G = null;      // partida
const P = Object.assign({ music: 1, mv: 0.7, sfx: 1, sv: 0.9, amb: 1, vib: 1, lang: null, a11yAudio: 0, reduce: null, big: 0, contrast: 0, murmur: 0.6 }, lsGet('prefs', {}));
const DAILY = Object.assign({ lastSolved: '', streak: 0, best: 0, today: null }, lsGet('daily', {}));
const REC = Object.assign({ bestStars: 0, bestTimeMs: 0, completions: 0 }, lsGet('records', {}));
function saveGame() { if (G) lsSet('save', G); }
function savePrefs() { lsSet('prefs', P); }
function saveDaily() { lsSet('daily', DAILY); }
function saveRecords() { lsSet('records', REC); }
function loadGame() {
  const s = lsGet('save', null);
  if (!s) return null;
  if (s.v !== 1) { try { localStorage.setItem(KEY + 'save.old', JSON.stringify(s)); } catch (e) { } return null; }
  return s;
}

// ---------- variantes por semilla ----------
function variantKey(id) {
  const P0 = C.puzzles[id]; const ks = Object.keys(P0.v);
  if (G && G.ui && G.ui._force && G.ui._force[id]) return G.ui._force[id];
  return ks[Math.floor(mulberry32((G.seed ^ hstr(id)) >>> 0)() * ks.length)];
}
function variantOf(id) { return C.puzzles[id].v[variantKey(id)]; }
function dataOf(id, lang) { const d = variantOf(id).d; return d[lang] ? Object.assign({}, d, d[lang]) : d; }
function saltOf(id) { return `jet-estacion:${id}:${variantKey(id)}`; }
// Orden de reparación del bucle anterior: Oxígeno y Energía primero, luego los otros cuatro en un orden por semilla
function prevLoopOrder() { const r = mulberry32((G.seed ^ 0x9e3779b9) >>> 0); return ['oxigeno', 'energia', ...shuffleR(r, ['comunicaciones', 'navegacion', 'archivo', 'tripulacion'])]; }
function nameOfGame() { return C.puzzles.final.v[variantKey('final')].d.name; }

// ---------- estado de enigmas ----------
function pz(id) { return G.pz[id] || (G.pz[id] = { st: 'open', stars: 3, hints: 0, att: [], at: 0, helped: false, offerAt: 0, active: 0 }); }
function isSolved(id) { return !!(G && G.pz[id] && G.pz[id].st === 'solved'); }
function modOf(id) { return C.puzzles[id].mod; }
function modUnlocked(m) {
  if (m === 'prologo') return true;
  if (!isSolved('p3')) return false;
  if (m === 'oxigeno') return true;
  if (m === 'energia') return !!G.metas.oxigeno;
  if (m === 'observatorio') return MODS.every(x => G.metas[x]);
  return !!G.metas.energia;
}
function puzzleUnlocked(id) {
  if (id === 'p2') return isSolved('p1');
  if (id === 'p3') return isSolved('p2');
  return modUnlocked(modOf(id));
}
function modProgress(m) { const ids = MOD_PUZ[m]; return ids.filter(isSolved).length; }
function totalStars() { let s = 0; for (const id in G.pz) if (G.pz[id].st === 'solved') s += G.pz[id].stars; return s; }
function modulesDone() { return MODS.filter(m => G.metas[m]).length; }
function currentModuleIndex() { return Math.min(6, modulesDone() + 1); }

// ---------- verificación ----------
const VERDICT_WAIT = 350;
async function verify(id, input, opts = {}) {
  const n = norm(input);
  if (!n) return { r: 'empty' };
  const st = opts.daily ? opts.daily : pz(id);
  if (st.att.some(a => a.w === n && a.r !== 'mid')) return { r: 'repeat', n };
  const V = opts.daily ? opts.v : variantOf(id), salt = opts.daily ? opts.salt : saltOf(id);
  const h = await H(n, salt);
  if (V.ok.includes(h)) return { r: 'ok', n };
  if (!opts.daily) {
    const room = MOD_PUZ[modOf(id)].filter(x => x !== id);
    for (const o of room) { const ho = await H(n, saltOf(o)); if (variantOf(o).ok.includes(ho)) return { r: 'other', n }; }
  }
  const mid = V.mid.find(m => m[0] === h); if (mid) return { r: 'mid', n, msg: mid[1] };
  const tr = V.trap.find(m => m[0] === h); if (tr) return { r: 'trap', n, msg: tr[1] };
  if (n.length >= 4) {
    if (V.near.includes(h)) return { r: 'near', n };
    const dels = [...new Set([...n].map((_, i) => n.slice(0, i) + n.slice(i + 1)))];
    for (const d of dels) { const hd = await H(d, salt); if (V.ok.includes(hd) || V.near.includes(hd)) return { r: 'near', n }; }
  }
  // N ↔ Ñ
  if (/[NÑ]/.test(n)) {
    const idx = [...n].map((c, i) => (c === 'N' || c === 'Ñ') ? i : -1).filter(i => i >= 0).slice(0, 4);
    for (let m = 1; m < (1 << idx.length); m++) { const a = [...n]; idx.forEach((i, j) => { if (m >> j & 1) a[i] = a[i] === 'N' ? 'Ñ' : 'N'; }); if (V.ok.includes(await H(a.join(''), salt))) return { r: 'enie', n }; }
  }
  return { r: 'wrong', n };
}
async function solutionOf(id, lang) { const V = variantOf(id); return deob(V.sol[lang] || V.sol.es, saltOf(id)); }

// ---------- código de rescate ----------
function b64u(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
function rescueCode() {
  const g = Object.assign({}, G, { clips: [] });
  const body = b64u(JSON.stringify(g)); const sum = (hstr(body) % 1048576).toString(36).toUpperCase().padStart(4, '0');
  return 'ES1-' + sum + '-' + body;
}
function parseRescue(code) {
  try {
    code = String(code || '').trim().replace(/\s+/g, '');
    const m = /^ES1-([0-9A-Z]{4})-([A-Za-z0-9_-]+)$/.exec(code); if (!m) return null;
    if ((hstr(m[2]) % 1048576).toString(36).toUpperCase().padStart(4, '0') !== m[1]) return null;
    const g = JSON.parse(unb64u(m[2])); if (!g || g.v !== 1 || typeof g.seed !== 'number' || !g.pz) return null;
    return g;
  } catch (e) { return null; }
}

// ---------- fecha local del reto diario ----------
function localDate(d = new Date()) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dailyIndex(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number); const day = Math.floor(Date.UTC(y, m - 1, d) / 864e5);
  const block = Math.floor(day / 30), pos = day % 30;
  return shuffleR(mulberry32((block * 2654435761) >>> 0), [...Array(30).keys()])[pos];
}
function prevDate(s) { const [y, m, d] = s.split('-').map(Number); const t = new Date(y, m - 1, d - 1); return localDate(t); }

window.CORE = { C, MODS, MOD_PUZ, META_OF, META_WORD, MOD_COL, NAMES, norm, hstr, mulberry32, shuffleR, codeOf, seedOf, newSeed, H, deob, decryptRec, CRYPTO_OK,
  get STORAGE_OK() { return STORAGE_OK; }, lsGet, lsSet, lsDel, freshGame, get G() { return G; }, set G(v) { G = v; }, P, DAILY, REC, saveGame, savePrefs, saveDaily, saveRecords, loadGame,
  variantKey, variantOf, dataOf, saltOf, prevLoopOrder, nameOfGame, pz, isSolved, modOf, modUnlocked, puzzleUnlocked, modProgress, totalStars, modulesDone, currentModuleIndex,
  verify, VERDICT_WAIT, solutionOf, rescueCode, parseRescue, localDate, dailyIndex, prevDate };
