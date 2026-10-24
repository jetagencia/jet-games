/* JET//Portada · interfaz: pantallas, tapa, arrastre, teclado, rotativa, guardado. */
var TS = 60; // tamaño global que usa el astronauta oficial
(function () {
'use strict';
const K = window.PortadaCore, CT = window.PortadaContent, TT = window.PortadaT, A = window.PortadaArt, AU = window.PortadaAudio;
const $ = id => document.getElementById(id);
const VER = 1;
const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const QS = new URLSearchParams(location.search);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ───────────── guardado ─────────────
let canStore = true;
try { localStorage.setItem('jet-portada:t', '1'); localStorage.removeItem('jet-portada:t'); } catch (e) { canStore = false; }
function sget(k) { if (!canStore) return null; try { const v = localStorage.getItem('jet-portada:' + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function sset(k, v) { if (!canStore) return; try { localStorage.setItem('jet-portada:' + k, JSON.stringify(v)); } catch (e) { } }
function sdel(k) { try { localStorage.removeItem('jet-portada:' + k); } catch (e) { } }

const DEF_SET = { v: VER, music: true, mv: 0.7, sfx: true, sv: 0.85, vib: true, tags: true, contrast: false };
const DEF_PROG = { v: VER, tut: false, total: 0, runs: 0, printed: 0, golds: 0, best: { daily: 0, b: 0, r: 0, j: 0 }, streak: 0, bestStreak: 0, lastDay: null, nightJ: false, runJ: false, seen: [], newR: [] };
let badSave = false;
function loadObj(k, def) { const o = sget(k); if (!o) return JSON.parse(JSON.stringify(def)); if (o.v !== VER) { badSave = true; return JSON.parse(JSON.stringify(def)); } return Object.assign(JSON.parse(JSON.stringify(def)), o); }
const S = {
  set: loadObj('settings', DEF_SET), prog: loadObj('progress', DEF_PROG),
  run: null, ed: null, ctx: null, J: 0, goal: 0, sc: null, shown: 0,
  stack: [], mode: 'port', cell: 40, ts: 0.6, els: {}, trot: {}, sel: -1, drag: null, kb: null, tut: null, press: null, freeDiff: 'r', elsKey: ''
};
// progreso saneado: un campo roto nunca impide arrancar
['total', 'runs', 'printed', 'golds', 'streak', 'bestStreak'].forEach(k => { if (!Number.isFinite(S.prog[k]) || S.prog[k] < 0) S.prog[k] = 0; });
if (!S.prog.best || typeof S.prog.best !== 'object') S.prog.best = {};
['daily', 'b', 'r', 'j'].forEach(k => { if (!Number.isFinite(S.prog.best[k])) S.prog.best[k] = 0; });
if (!Array.isArray(S.prog.newR)) S.prog.newR = [];
if (typeof S.prog.lastDay !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(S.prog.lastDay)) S.prog.lastDay = null;
if (!Array.isArray(S.prog.seen) || !S.prog.seen.length) S.prog.seen = K.unlockedRules(S.prog);
['music', 'sfx', 'vib', 'tags', 'contrast'].forEach(k => { if (typeof S.set[k] !== 'boolean') S.set[k] = DEF_SET[k]; });
['mv', 'sv'].forEach(k => { if (!Number.isFinite(S.set[k])) S.set[k] = DEF_SET[k]; S.set[k] = clamp(S.set[k], 0, 1); });
// idioma: único para todo jetgames.fun (src/jet-idioma.js: ?lang > cookie jet_lang/localStorage > navegador).
// Migración única: el idioma que Portada guardaba en sus ajustes pasa a JETIdioma si el sitio aún no tiene elección.
const JI = window.JETIdioma;
if (S.set.lang === 'es' || S.set.lang === 'en') {
  let hayEleccion = /(?:^|;\s*)jet_lang=(es|en)\b/.test(document.cookie);
  if (!hayEleccion) { try { hayEleccion = /^(es|en)$/.test(localStorage.getItem('jet_lang') || ''); } catch (e) { } }
  if (!hayEleccion && !/[?&]lang=(es|en)\b/.test(location.search)) JI.set(S.set.lang);
}
if ('lang' in S.set) { delete S.set.lang; sset('settings', S.set); }
let LANG = JI.get() === 'en' ? 'en' : 'es';
function L() { return TT[LANG]; }
function tr(k, v) { let s = L()[k]; if (s == null) s = TT.es[k] != null ? TT.es[k] : k; if (typeof s !== 'string') return s; if (v) for (const x in v) s = s.split('{' + x + '}').join(v[x]); return s; }
function fmt(n) { return LANG === 'es' ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function today() { return QS.get('date') && /^\d{4}-\d{2}-\d{2}$/.test(QS.get('date')) ? QS.get('date') : K.localDay(); }
function saveSet() { sset('settings', S.set); }
function saveProg() { sset('progress', S.prog); }
let saveT = 0;
function saveRun(now) {
  if (!S.run || S.run.demo) return;
  const k = 'run-' + S.run.mode;
  const doIt = () => { const r = Object.assign({}, S.run); if (r.hist && r.hist.length > 100) r.hist = r.hist.slice(-100); sset(k, r); };
  clearTimeout(saveT); if (now) doIt(); else saveT = setTimeout(doIt, 300);
}

// ───────────── audio y vibración ─────────────
function applyAudioPrefs() { AU.setPrefs({ music: S.set.music, mv: S.set.mv, sfx: S.set.sfx, sv: S.set.sv, vibration: S.set.vib }); }
function vibe(p) { if (S.set.vib) AU.vibe(p); }
function sfx(n, a) { AU.sfx(n, a); }
let audioOn = false;
function gesture() { AU.init(); if (!audioOn && AU.ready) { audioOn = true; applyAudioPrefs(); AU.setScene(S.scene || 'menu'); } else AU.resume(); }
window.addEventListener('pointerdown', gesture, true);
window.addEventListener('keydown', gesture, true);
S.scene = 'menu';
function scene(s) { S.scene = s; if (AU.ready) AU.setScene(s); }

// ───────────── textos fijos ─────────────
function applyLang() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = tr(el.dataset.t); });
  document.querySelectorAll('[data-ta]').forEach(el => { el.setAttribute('aria-label', tr(el.dataset.ta)); });
  document.querySelectorAll('[data-tp]').forEach(el => { el.setAttribute('placeholder', tr(el.dataset.tp)); });
  document.title = 'JET//Portada · ' + tr('doc_title');
  $('mName').textContent = L().paper; $('mYear').textContent = L().year; $('mPrice').textContent = L().price;
  $('mDate').textContent = L().date_fmt(new Date());
}
// Cambiar idioma = avisar al sitio; el repintado lo hace el evento 'jet-idioma' (también si cambia desde otra pestaña de jetgames.fun).
function setLang(l) { JI.set(l === 'en' ? 'en' : 'es'); }
function syncLangSegs() { document.querySelectorAll('.seg[data-lang]').forEach(g => g.querySelectorAll('button').forEach(b => { const on = b.dataset.l === LANG; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); })); }
function repaintLang(l) {
  l = l === 'en' ? 'en' : 'es'; if (l === LANG) { syncLangSegs(); return; }
  LANG = l; applyLang(); syncLangSegs();
  S.els = {}; S.elsKey = '';
  if (S.ed && $('game').hidden === false) { buildEls(); renderAll(); }
  S.stack.slice().forEach(refreshScreen);
  if (!$('tut').hidden && tutLast) { clearInterval(typeT); $('tutTxt').textContent = tr(tutLast[0]) + (tutLast[1] ? ' ' + tr(tutLast[1]) : ''); positionTut(); }
  if (S.stack[S.stack.length - 1] === 'sModal') closeModal();
}
window.addEventListener('jet-idioma', e => repaintLang(e.detail));
// Otra pestaña de jetgames.fun cambió el idioma: localStorage avisa con 'storage' (mismo origen); la cookie del sitio
// (que también escriben los juegos de otros subdominios) se relee al volver a esta pestaña. Misma prioridad que JETIdioma.
function idiomaGuardado() { const m = document.cookie.match(/(?:^|;\s*)jet_lang=(es|en)\b/); if (m) return m[1]; try { const v = localStorage.getItem('jet_lang'); return v === 'es' || v === 'en' ? v : null; } catch (e) { return null; } }
window.addEventListener('storage', e => { if (e.key === 'jet_lang' && (e.newValue === 'es' || e.newValue === 'en')) JI.set(e.newValue); });
document.addEventListener('visibilitychange', () => { if (document.hidden) return; const g = idiomaGuardado(); if (g && g !== JI.get()) JI.set(g); });

// ───────────── utilidades de interfaz ─────────────
let toastT = 0;
function toast(msg, ms) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms || 2400); }
function starSVG(on) { return '<svg class="' + (on ? 'on' : '') + '" viewBox="0 0 24 24"><path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="' + (on ? '#f2c14e' : '#fff') + '"/></svg>'; }
function glyph(id) { let g = K.RULE[id].g.replace(/\b(POL|ECO|DEP|CIE|CUL|SOC|CLI|PUB)\b/g, m => L().code[m]); if (LANG === 'en') g = g.replace(/(\d),(\d)/g, '$1.$2'); return g; }
function secOf(p) { return p.t === 'pub' || p.t === 'clas' ? 'PUB' : p.t === 'excl' ? 'EXC' : p.sec; }
function ptext(p) { return CT.pieceText(p, LANG); }
function shortT(p) { const t = ptext(p).h; return t.length > 46 ? t.slice(0, 44) + '…' : t; }
const SCREENS = ['sTitle', 'sFree', 'sRules', 'sIntro', 'sEd', 'sFinal', 'sPause', 'sHelp', 'sSet', 'sArch', 'sView', 'sModal'];
function show(id, keep) {
  if (!keep) S.stack = [];
  SCREENS.forEach(s => $(s).classList.toggle('on', s === id));
  if (id) { if (S.stack[S.stack.length - 1] !== id) S.stack.push(id); refreshScreen(id); }
  updateChrome();
  const sc = $(id); if (sc) { sc.scrollTop = 0; const f = sc.querySelector('.btn.pri:not([disabled]),.btn,.x'); if (f && matchMedia('(hover:hover)').matches) setTimeout(() => { try { f.focus({ preventScroll: true }); } catch (e) { } }, 30); }
}
function push(id) { show(id, true); }
function back() {
  S.stack.pop(); const prev = S.stack[S.stack.length - 1];
  SCREENS.forEach(s => $(s).classList.toggle('on', s === prev));
  if (prev) refreshScreen(prev);
  updateChrome();
  if (!prev && S.run && S.run.phase === 'play') { AU.duck(false); }
}
function hideAll() { S.stack = []; SCREENS.forEach(s => $(s).classList.remove('on')); updateChrome(); }
function updateChrome() {
  const top = S.stack[S.stack.length - 1], inGame = !$('game').hidden;
  $('bPause').hidden = !(inGame && S.run && S.run.phase === 'play' && !top);
  $('bg').style.display = top === 'sTitle' || top === 'sFree' ? '' : 'none';
  if (top === 'sTitle') startBg(); else stopBg();
  if (inGame && !top) placeChrome(); else resetChrome();
  $('tut').style.visibility = top ? 'hidden' : '';
}
function refreshScreen(id) {
  if (id === 'sTitle') renderTitle(); else if (id === 'sFree') renderFree(); else if (id === 'sSet') renderSettings();
  else if (id === 'sHelp') renderHelp(); else if (id === 'sArch') renderArchive(); else if (id === 'sRules') renderRules();
  else if (id === 'sEd') renderEdResult(); else if (id === 'sFinal') renderFinal(); else if (id === 'sPause') renderPause();
}
function modal(html, bind) { $('modalCard').innerHTML = html; if (bind) bind($('modalCard')); push('sModal'); }
function closeModal() { if (S.stack[S.stack.length - 1] === 'sModal') back(); }

// ───────────── disposición ─────────────
function insets() { const p = $('probe') || (() => { const d = document.createElement('div'); d.id = 'probe'; d.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)'; document.body.appendChild(d); return d; })(); const cs = getComputedStyle(p); return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 }; }
function box(el, x, y, w, h) { const s = $(el).style; s.left = Math.round(x) + 'px'; s.top = Math.round(y) + 'px'; s.width = Math.max(0, Math.round(w)) + 'px'; s.height = Math.max(0, Math.round(h)) + 'px'; }
function paperMetrics(cell) { const pad = clamp(cell * 0.16, 6, 16), mast = clamp(cell * 0.85, 34, 78); return { pad, mast }; }
function fitCell(aw, ah, C, F, cap) {
  let cell = Math.min(aw / (C + 0.4), ah / (F + 1.3));
  for (let i = 0; i < 3; i++) { const m = paperMetrics(cell); cell = Math.min((aw - 2 * m.pad) / C, (ah - 2 * m.pad - m.mast - 4) / F); }
  return Math.max(16, Math.min(cap || 999, Math.floor(cell)));
}
let lay = {};
function layout() {
  const W = window.innerWidth, H = window.innerHeight, I = insets();
  const mode = (W >= 900 && H >= 600) ? 'wide' : (W > H ? 'land' : 'port');
  S.mode = mode; document.body.classList.remove('port', 'land', 'wide'); document.body.classList.add(mode);
  if (!S.ed) return;
  if (S.ctx && S.run) renderChips();
  const C = S.ed.C, F = S.ed.F, g = 8;
  S.trayRow = false;
  const TR = S.run && S.run.mode === 'tut' ? 96 : 0; lay.tr = TR;
  let cell, tw, th;
  if (mode === 'port') {
    const top = I.t + 10, y1 = top + 44 + 8;
    const short = H < 720; S.compactChips = short;
    box('score', 12 + I.l, y1, W - 24 - I.l - I.r, 44);
    if (short) { const br = 10 + I.l + $('back').offsetWidth, tl = W - I.r - 10 - 96; box('chips', br + 6, top + 6, Math.max(0, tl - br - 12), 34); }
    else box('chips', 10 + I.l, y1 + 48, W - 20 - I.l - I.r, 32);
    const barH = short ? 50 : 54, barY = H - I.b - 8 - barH;
    box('bar', 10 + I.l, barY, W - 20 - I.l - I.r, barH);
    const trayH = short ? clamp(H * 0.16, 84, 120) : clamp(H * 0.2, 104, 196), trayY = barY - g - trayH;
    box('trayBox', 10 + I.l, trayY, W - 20 - I.l - I.r, trayH);
    const py = y1 + 44 + (short ? 4 : 38), ph = trayY - g - py - TR, pw = W - 12 - I.l - I.r;
    box('paperBox', 6 + I.l, py, pw, ph);
    cell = fitCell(pw, ph, C, F);
    $('side').style.display = 'none';
    S.ts = Math.min(0.72, (trayH - 34) / (3 * cell));
    $('bar').classList.toggle('compact', W < 420);
  } else if (mode === 'land') {
    S.compactChips = false;
    const colW = clamp(W * 0.38, 250, 430), x0 = W - I.r - 8 - colW, top = I.t + 8;
    const pw = x0 - g - 8 - I.l, ph = H - I.t - I.b - 16;
    box('paperBox', 8 + I.l, top, pw, ph);
    cell = fitCell(pw, ph, C, F);
    lay.backX = x0; lay.backY = top;
    box('score', x0, top + 50, colW, 44);
    box('chips', x0, top + 96, colW, 32);
    const barH = 50, barY = H - I.b - 8 - barH;
    box('bar', x0, barY, colW, barH);
    const trayH = barY - g - (top + 134 + TR);
    box('trayBox', x0, top + 134 + TR, colW, trayH);
    $('side').style.display = 'none';
    // teléfono acostado: la mesa cabe en una sola fila; se desliza de lado como en vertical (sin filas medio vacías)
    S.trayRow = trayH < 300;
    S.ts = S.trayRow ? clamp((trayH - 30 - 18) / (3 * cell), 0.35, 0.85) : Math.min(0.85, (colW - 34) / (trayMaxW() * cell + 4));
    $('bar').classList.toggle('compact', colW < 400);
  } else {
    S.compactChips = false;
    const trayW = clamp(W * 0.23, 230, 360), sideW = clamp(W * 0.2, 240, 320), top = I.t + 66;
    const barH = 56, barY = H - I.b - 12 - barH;
    let pw = W - trayW - sideW - 4 * 16 - I.l - I.r, ph = barY - 12 - top - TR;
    let px = 16 + I.l + trayW + 16;
    if (S.run && S.run.demo) { pw = W * 0.5; ph = H * 0.92; px = W * 0.05; }
    box('paperBox', px, S.run && S.run.demo ? H * 0.04 : top, pw, ph);
    cell = fitCell(pw, ph, C, F, 156);
    box('trayBox', 16 + I.l, top, trayW, H - I.b - 12 - top);
    const sx = W - I.r - 16 - sideW;
    box('score', sx, top, sideW, 76);
    box('chips', sx, top + 84, sideW, 32);
    $('chips').style.height = 'auto';
    $('side').style.display = '';
    box('side', sx, top + 84 + chipsH(), sideW, H - I.b - 12 - (top + 84 + chipsH()));
    const bw = Math.min(pw, 620);
    box('bar', px + (pw - bw) / 2, barY, bw, barH);
    S.ts = Math.min(0.95, (trayW - 30) / (trayMaxW() * cell + 4));
    $('bar').classList.remove('compact');
  }
  $('score').classList.toggle('stack', mode === 'wide');
  document.body.classList.toggle('trayrow', !!S.trayRow);
  const m = paperMetrics(cell);
  document.documentElement.style.setProperty('--tagf', clamp(cell * 0.18, 8, 11) + 'px');
  $('mast').classList.toggle('slim', m.mast < 56);
  const P = $('paper'); P.style.padding = m.pad + 'px'; P.style.width = (C * cell + 2 * m.pad) + 'px';
  // el sello de la rotativa siempre cabe dentro de la portada (PORTADA DE ORO es largo)
  const sl = Math.max(tr('gold').length, tr('sold_out').length, tr('recycled').length);
  $('stamp').style.fontSize = clamp((C * cell) * 0.84 / (sl * 0.66 + 1.5), 14, 46) + 'px';
  const mast = $('mast'); mast.style.height = m.mast + 'px';
  $('mName').style.fontSize = clamp(m.mast * (m.mast < 56 ? 0.62 : 0.5), 15, 42) + 'px';
  const mf = clamp(m.mast * 0.15, 8, 11) + 'px'; mast.querySelectorAll('.m-top,.m-bot').forEach(e => { e.style.fontSize = mf; });
  const B = $('board'); B.style.width = C * cell + 'px'; B.style.height = F * cell + 'px';
  $('cells').style.backgroundSize = cell + 'px ' + cell + 'px'; $('cells').style.backgroundPosition = (cell / 2) + 'px ' + (cell / 2) + 'px';
  $('cells').style.backgroundImage = 'radial-gradient(circle at center, rgba(22,17,31,.22) 1px, transparent 1.6px)';
  const changed = cell !== S.cell; S.cell = cell;
  if (changed || S.elsKey !== keyEls()) buildEls();
  renderAll();
  placeChrome();
  if (S.tut) positionTut();
}
function trayMaxW() { let m = 2; S.ed.pieces.forEach(p => { if (!S.run.pos[p.ix]) m = Math.max(m, K.dims(p, S.trot[p.ix] || 0).w); }); return m; }
function chipsH() { const c = $('chips'); return Math.max(32, c.scrollHeight) + 8; }
function placeChrome() {
  const b = $('back'), t = $('tr');
  if ($('game').hidden || S.stack.length) { resetChrome(); return; }
  if (S.mode === 'land') { b.style.left = lay.backX + 'px'; b.style.top = lay.backY + 'px'; t.style.right = ''; }
  else resetChrome();
}
function resetChrome() { $('back').style.left = ''; $('back').style.top = ''; }

// ───────────── piezas (DOM) ─────────────
function keyEls() { return LANG + '|' + S.cell + '|' + (S.ed ? S.ed.seed + S.ed.k + S.ed.pieces.length : ''); }
function pieceEl(p) {
  const el = document.createElement('div');
  const sec = secOf(p);
  el.className = 'pc t-' + p.t + ' s-' + sec; el.dataset.ix = p.ix; el.tabIndex = 0; el.setAttribute('role', 'button');
  el.style.setProperty('--sc', A.SEC_COLOR[sec]);
  const tx = ptext(p), code = L().code[sec];
  const tag = '<div class="sec">' + A.iconSVG(sec) + '<span>' + code + '</span></div>';
  let h = '';
  if (p.t === 'foto') h = '<div class="in"><canvas></canvas><div class="cap">' + esc(tx.h) + '</div></div>';
  else if (p.t === 'pub' || p.t === 'clas') h = '<div class="in"><div class="pubb">' + tag + '<div class="h">' + esc(tx.h) + '</div></div></div>';
  else if (p.t === 'excl') h = '<div class="in"><div class="sec">' + A.iconSVG('EXC') + '<span>★</span></div><div class="h">' + esc(tx.h) + '</div><div class="d">' + esc(tx.d) + '</div></div>';
  else if (p.t === 'breve') h = '<div class="in">' + tag + '<div class="f">' + esc(tx.f || '') + '</div><div class="h">' + esc(tx.h) + '</div></div>';
  else h = '<div class="in">' + tag + '<div class="h">' + esc(tx.h) + '</div>' + (tx.d ? '<div class="d">' + esc(tx.d) + '</div>' : '') + '</div>';
  el.innerHTML = h + '<div class="st"></div>';
  el.setAttribute('aria-label', L().types[p.t] + ' · ' + (L().secs[sec] || '') + ' · ' + tx.h);
  return el;
}
let meas = null;
function sizeEl(el, p, r) {
  const d = K.dims(p, r), c = S.cell;
  el.style.width = d.w * c + 'px'; el.style.height = d.h * c + 'px'; el.dataset.r = r ? 1 : 0;
  el.classList.toggle('flat', d.w > d.h); // piezas apaisadas: los sellos ×2 en fila, sobre el rótulo, sin tapar el titular
  if (!meas) { meas = document.createElement('div'); meas.style.cssText = 'position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none'; document.body.appendChild(meas); }
  const par = el.parentNode, nx = el.nextSibling;
  if (!el.isConnected || el.getClientRects().length === 0) meas.appendChild(el);
  fitEl(el, p, d, c);
  if (par && el.parentNode !== par) par.insertBefore(el, nx);
}
function fitEl(el, p, d, c) {
  const inn = el.querySelector('.in'), h = el.querySelector('.h'), dd = el.querySelector('.d'), sec = el.querySelector('.sec'), f = el.querySelector('.f');
  if (sec) sec.style.fontSize = clamp(c * 0.13, 8.5, 12) + 'px';
  if (p.t === 'foto') {
    const cv = el.querySelector('canvas'), dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = Math.round(d.w * c * dpr); cv.height = Math.round(d.h * c * dpr);
    A.halftone(cv, p.ill, '#16111f', '#e9e2d2');
    const cap = el.querySelector('.cap'); cap.style.fontSize = clamp(c * 0.13, 8.5, 12) + 'px';
    return;
  }
  let start, min, ds = 0;
  if (p.t === 'tit') { start = Math.min(32, c * 0.4); min = 9; }
  else if (p.t === 'nota') { start = Math.min(24, c * 0.27); min = 10; ds = clamp(c * 0.165, 9.5, 15); }
  else if (p.t === 'col') { start = Math.min(18, c * 0.22); min = 8; ds = clamp(c * 0.15, 9, 13); }
  else if (p.t === 'breve') { start = clamp(c * 0.15, 8.5, 13); min = 8; if (f) f.style.fontSize = clamp(c * 0.34, 12, 32) + 'px'; }
  else if (p.t === 'pub') { start = Math.min(20, c * 0.2); min = 8.5; }
  else if (p.t === 'clas') { start = Math.min(13, c * 0.14); min = 8; }
  else { start = clamp(c * 0.3, 12, 30); min = 10; ds = clamp(c * 0.15, 9, 14); }
  const host = p.t === 'pub' || p.t === 'clas' ? el.querySelector('.pubb') : inn;
  if (dd) dd.style.display = 'none';
  h.style.display = ''; h.style.webkitLineClamp = ''; h.style.maxHeight = '';
  let s = start; h.style.fontSize = s + 'px';
  h.style.overflowWrap = 'normal';
  if (f) { let fs = parseFloat(f.style.fontSize); while (f.scrollWidth > f.clientWidth + 1 && fs > 10) { fs -= 1; f.style.fontSize = fs + 'px'; } }
  // también el ancho del contenedor: en una publicidad vertical una palabra larga ensanchaba el titular y se salía por los costados
  const over = () => host.scrollHeight > host.clientHeight + 1 || inn.scrollHeight > inn.clientHeight + 1 || h.scrollWidth > h.clientWidth + 1 || host.scrollWidth > host.clientWidth + 1;
  while (over() && s > min) { s -= 0.5; h.style.fontSize = s + 'px'; }
  if (h.scrollWidth > h.clientWidth + 1 || host.scrollWidth > host.clientWidth + 1) h.style.overflowWrap = 'anywhere';
  if (over()) { const lh = s * 1.12, avail = host.clientHeight - (sec ? sec.offsetHeight + 3 : 0) - (f ? f.offsetHeight : 0) - 4; const n = Math.max(1, Math.floor(avail / lh)); h.style.display = '-webkit-box'; h.style.webkitBoxOrient = 'vertical'; h.style.webkitLineClamp = n; h.style.overflow = 'hidden'; }
  if (dd) {
    dd.style.display = ''; dd.style.fontSize = ds + 'px';
    let n = 6; dd.style.webkitLineClamp = n;
    while (over() && n > 0) { n--; dd.style.webkitLineClamp = n; if (n === 0) dd.style.display = 'none'; }
  }
}
function buildEls() {
  S.els = {}; S.elsKey = keyEls();
  $('pieces').innerHTML = ''; $('tray').innerHTML = '';
  if (!S.ed) return;
  S.ed.pieces.forEach(p => { const el = pieceEl(p); S.els[p.ix] = el; const q = S.run.pos[p.ix]; sizeEl(el, p, q ? q.r : (S.trot[p.ix] || 0)); });
}

// ───────────── puntuación y dibujo ─────────────
function rescore() { S.sc = K.score(S.ed, S.run.pos, S.ctx); return S.sc; }
function renderAll() { if (!S.ed) return; rescore(); renderBoard(); renderTray(); renderTags(); renderHUD(); renderChips(); renderPairTable(); }
function renderBoard() {
  const host = $('pieces'), c = S.cell;
  S.ed.pieces.forEach(p => {
    const el = S.els[p.ix], q = S.run.pos[p.ix];
    if (!el) return;
    if (q) {
      if (S.drag && S.drag.started && S.drag.ix === p.ix) return;
      if (+el.dataset.r !== (q.r ? 1 : 0)) sizeEl(el, p, q.r);
      el.style.transform = ''; el.style.left = q.x * c + 'px'; el.style.top = q.y * c + 'px';
      el.classList.remove('nofit', 'src');
      if (el.parentNode !== host) host.appendChild(el);
      const pc = S.sc.pieces[p.ix], st = el.querySelector('.st');
      st.innerHTML = pc ? pc.mults.map(m => '<i class="' + (m[0] === 'cab' || m[0] === 'foto' || m[0] === 'tema' ? m[0] : 'mx') + '" title="' + esc(L().m[m[0]] || '') + '">×' + String(m[1]).replace('.', LANG === 'es' ? ',' : '.') + '</i>').join('') : '';
      el.classList.toggle('sel', S.sel === p.ix);
    }
  });
}
function renderTray() {
  if (S.mode !== 'port' && !S.trayRow) { const tb = $('trayBox').clientWidth; if (tb) S.ts = Math.min(S.mode === 'wide' ? 0.95 : 0.85, (tb - 34) / (trayMaxW() * S.cell + 4)); }
  const tray = $('tray'), c = S.cell, ts = S.ts;
  const un = S.ed.pieces.filter(p => !S.run.pos[p.ix]);
  const wraps = {};
  tray.querySelectorAll('.ti').forEach(w => { wraps[w.dataset.ix] = w; });
  un.forEach(p => {
    let w = wraps[p.ix];
    if (!w) { w = document.createElement('div'); w.className = 'ti'; w.dataset.ix = p.ix; w.setAttribute('role', 'listitem'); }
    delete wraps[p.ix];
    const r = S.trot[p.ix] || 0, d = K.dims(p, r), el = S.els[p.ix];
    if (+el.dataset.r !== r) sizeEl(el, p, r);
    w.style.width = d.w * c * ts + 'px'; w.style.height = d.h * c * ts + 'px';
    if (!(S.drag && S.drag.started && S.drag.ix === p.ix)) {
      el.style.left = '0'; el.style.top = '0'; el.style.transform = 'scale(' + ts + ')'; el.classList.remove('sel');
      if (el.parentNode !== w) w.appendChild(el);
      const nf = !K.fitsAnywhere(S.ed, S.run.pos, p.ix);
      el.classList.toggle('nofit', nf); el.dataset.nofit = tr('no_fit');
    }
    w.classList.toggle('sel', S.sel === p.ix);
    tray.appendChild(w);
  });
  for (const k in wraps) wraps[k].remove();
  let em = tray.querySelector('.empty');
  if (!un.length) { if (!em) { em = document.createElement('div'); em.className = 'empty'; tray.appendChild(em); } em.textContent = S.sc.holes ? tr('holes', { n: S.sc.holes }) : tr('full'); }
  else if (em) em.remove();
  $('trayN').textContent = un.length === 1 ? tr('left1') : tr('left', { n: un.length });
}
function tagHTML(pr, cls) {
  const v = pr.v, c = S.cell, cl = v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu';
  const name = pr.parts.map(x => L().pairs[x[0]]).filter(Boolean).join(' · ');
  return '<span class="tag ' + cl + ' ' + (cls || '') + '" data-a="' + pr.a + '" data-b="' + pr.b + '" style="left:' + (pr.x * c) + 'px;top:' + (pr.y * c) + 'px" title="' + esc(name) + '">' + (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + '</span>';
}
let prevTags = new Set();
function renderTags(preview) {
  const t = $('tags'); const sc = preview || S.sc; let h = '';
  const now = new Set();
  sc.pairs.forEach(pr => {
    if (pr.v === 0) return;
    const key = pr.a + '-' + pr.b + ':' + pr.v; now.add(key);
    const involved = preview && S.drag && (pr.a === preview.ix || pr.b === preview.ix);
    const isNew = !preview && !prevTags.has(key);
    h += tagHTML(pr, (involved ? 'pv ' : '') + (isNew ? (pr.v > 0 ? 'new' : 'newneg') : ''));
  });
  t.innerHTML = h;
  t.classList.toggle('off', !S.set.tags);
  if (!preview) prevTags = now;
}
let rollT = 0;
function setScore(v, delta) {
  const n = $('scN');
  const from = S.shown; S.shown = v;
  cancelAnimationFrame(rollT);
  if (RM || from === v) n.textContent = fmt(v);
  else { const t0 = performance.now(); const step = () => { const k = Math.min(1, (performance.now() - t0) / 250); n.textContent = fmt(Math.round(from + (v - from) * (1 - Math.pow(1 - k, 3)))); if (k < 1) rollT = requestAnimationFrame(step); }; step(); }
  n.classList.toggle('up', delta > 0); n.classList.toggle('down', delta < 0);
  const d = $('scD'); d.textContent = delta ? (delta > 0 ? '+' : '−') + Math.abs(delta) : ''; d.className = 'sc-d ' + (delta > 0 ? 'pos' : delta < 0 ? 'neg' : '');
}
let wasMet = false, wasGold = false;
function renderHUD(previewTotal) {
  const total = previewTotal != null ? previewTotal : S.sc.total, k = S.run.k;
  const isTut = S.run.mode === 'tut';
  $('edLbl').innerHTML = isTut ? (LANG === 'es' ? 'PRÁCTICA' : 'PRACTICE') + '<b>' + k + '/3</b>' : (LANG === 'es' ? 'EDICIÓN' : 'EDITION') + '<b>' + k + '/3</b>';
  setScore(total, previewTotal != null ? previewTotal - S.sc.total : 0);
  const bar = $('scBar'), goal = S.goal || 1;
  $('scFill').style.width = Math.min(100, total / goal * 100) + '%';
  $('scGoal').textContent = isTut && !S.goal ? '' : tr('goal') + ' ' + fmt(goal);
  $('scGoalMark').style.display = isTut && !S.goal ? 'none' : '';
  const met = S.sc.total >= goal && S.goal > 0, gold = S.sc.total >= S.J && S.J > 0;
  bar.classList.toggle('met', total >= goal && S.goal > 0); bar.classList.toggle('gold', previewTotal == null && gold);
  const pb = $('bPrint'); pb.classList.toggle('met', met && !gold); pb.classList.toggle('gold', gold);
  if (previewTotal == null) {
    if (met && !wasMet) { sfx('goal'); bar.classList.remove('flash'); void bar.offsetWidth; bar.classList.add('flash'); vibe(12); }
    if (gold && !wasGold) { sfx('gold'); vibe([30, 40, 60]); }
    wasMet = met; wasGold = gold;
    const filled = S.ed.C * S.ed.F - S.sc.holes;
    const noGoal = !(S.goal > 0); // práctica sin meta: el tema entra con la tapa completa
    AU.setLayers({ l2: filled >= S.ed.C * S.ed.F * 0.4 ? 1 : 0, l3: met || (noGoal && S.sc.holes === 0) ? 1 : 0, l4: gold || (S.sc.total >= S.J * 0.9 && met) ? 1 : 0 });
  }
  $('bUndo').disabled = !S.run.hist.length; $('bRedo').disabled = !S.run.fut.length;
  const selP = S.sel >= 0 ? S.ed.pieces[S.sel] : S.drag && S.drag.started ? S.ed.pieces[S.drag.ix] : null;
  $('bRot').hidden = !(selP && K.canRotate(selP));
  const msg = $('msg'), un = S.ed.pieces.filter(p => !S.run.pos[p.ix]).length;
  msg.className = '';
  if (S.sel >= 0 && !S.drag) msg.textContent = tr('sel_hint');
  else if (S.sc.holes === 0) { msg.textContent = tr('full'); msg.className = 'ok'; }
  else if (!un || !S.ed.pieces.some(p => !S.run.pos[p.ix] && K.fitsAnywhere(S.ed, S.run.pos, p.ix))) { msg.textContent = S.sc.holes === 1 ? tr('hole1') : tr('holes', { n: S.sc.holes }); msg.className = 'warn'; }
  else msg.textContent = '';
}
function renderChips() {
  const c = $('chips'), ed = S.ed; let h = '';
  if (ed.theme) h += '<button class="chip theme" style="color:' + A.SEC_COLOR[ed.theme] + '" data-chip="theme">' + A.iconSVG(ed.theme) + '<span style="color:var(--ink)">' + esc(L().secs[ed.theme]) + ' ×' + (S.ctx.rules.doble ? '2' : (LANG === 'es' ? '1,5' : '1.5')) + '</span></button>';
  const picks = (S.run.picks || []).filter(p => p.ed <= S.run.k);
  if (S.compactChips) { const roomy = c.clientWidth >= 84; c.innerHTML = '<button class="chip rule" data-chip="rules" style="max-width:100%" aria-label="' + esc(tr('rules_n', { n: picks.length })) + '">' + (ed.theme ? '<span style="color:' + A.SEC_COLOR[ed.theme] + '">' + A.iconSVG(ed.theme) + '</span>' + (roomy ? esc(L().code[ed.theme]) : '') : '') + ' <b>§' + picks.length + '</b></button>'; return; }
  if (false) h += '<button class="chip rule" data-chip="rules"><b>§</b>' + esc(tr('rules_n', { n: picks.length })) + '</button>';
  else picks.forEach(p => { const r = L().rules[p.id]; h += '<button class="chip rule" data-chip="' + p.id + '"><b>' + esc(glyph(p.id)) + '</b>' + esc(r[0]) + (p.sec ? ' · ' + L().code[p.sec] : '') + '</button>'; });
  c.innerHTML = h;
}
function renderPairTable(hl) {
  if (S.mode !== 'wide') return;
  const rows = L().table_rows, codes = ['ctx', 'expl', 'curi', 'agenda', 'aficion', 'rep', 'ruido', 'distr', 'holes'];
  $('pairT').innerHTML = '<table class="ptab">' + rows.map((r, i) => '<tr class="' + (hl && hl.has(codes[i]) ? 'on' : '') + '"><td>' + esc(r[0]) + '</td><td class="' + (r[1][0] === '+' ? 'p' : 'n') + '">' + r[1] + '</td><td>' + esc(r[2]) + '</td></tr>').join('') + '</table>' + rulesSummary();
}
function rulesSummary() {
  const picks = (S.run.picks || []).filter(p => p.ed <= S.run.k);
  if (!picks.length) return '<div class="side-t" style="margin-top:14px">' + esc(tr('rules_n', { n: 0 })) + '</div><p class="note small" style="text-align:left">' + esc(tr('no_rules')) + '</p>';
  return '<div class="side-t" style="margin-top:14px">' + esc(tr('rules_n', { n: picks.length })) + '</div>' + picks.map(p => '<p class="note small" style="text-align:left;margin:4px 0"><b style="color:var(--ink)">' + esc(L().rules[p.id][0]) + '.</b> ' + esc(L().rules[p.id][1]) + '</p>').join('');
}

// ───────────── jugadas ─────────────
function commit(newPos, opts) {
  opts = opts || {};
  const old = S.run.pos;
  S.run.hist.push(old); if (S.run.hist.length > 100) S.run.hist.shift();
  S.run.fut = [];
  S.run.pos = newPos;
  const before = S.sc;
  renderAll();
  saveRun();
  if (opts.ix != null) afterPlace(opts.ix, before);
  tutCheck();
}
function afterPlace(ix, before) {
  const el = S.els[ix]; if (!el) return;
  const placed = !!S.run.pos[ix];
  if (!placed) return;
  el.classList.remove('snap'); void el.offsetWidth; if (!RM) el.classList.add('snap');
  dust(el);
  const delta = S.sc.total - before.total;
  sfx('drop', delta > 0 ? 1 : delta < 0 ? -1 : 0); vibe(8);
  const bm = (before.pieces[ix] || { mults: [] }).mults.length, am = S.sc.pieces[ix].mults.length;
  if (am > bm) setTimeout(() => { sfx('mult'); vibe(12); }, 90);
  const pv = S.sc.pairs.filter(p => (p.a === ix || p.b === ix) && p.v !== 0);
  pv.slice(0, 3).forEach((p, i) => setTimeout(() => sfx(p.v > 0 ? 'pairPos' : 'pairNeg', p.v), 140 + i * 90));
  if (S.sc.holes === 0 && before.holes > 0) setTimeout(() => sfx('full'), 300);
}
function dust(el) {
  if (RM) return; const r = el.getBoundingClientRect(), fx = $('fx');
  for (let i = 0; i < 6; i++) { const d = document.createElement('i'); d.className = 'dust'; const x = r.left + (i % 2 ? r.width : 0), y = r.top + r.height * Math.random(); d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.setProperty('--dx', (i % 2 ? 1 : -1) * (8 + Math.random() * 14) + 'px'); d.style.setProperty('--dy', (Math.random() * 16 - 8) + 'px'); fx.appendChild(d); setTimeout(() => d.remove(), 520); }
}
function undo() { if (!S.run || S.run.phase !== 'play' || !S.run.hist.length) return; S.run.fut.push(S.run.pos); S.run.pos = S.run.hist.pop(); S.sel = -1; renderAll(); saveRun(); sfx('undo'); }
function redo() { if (!S.run || S.run.phase !== 'play' || !S.run.fut.length) return; S.run.hist.push(S.run.pos); S.run.pos = S.run.fut.pop(); S.sel = -1; renderAll(); saveRun(); sfx('redo'); }
function without(pos, ix) { const o = Object.assign({}, pos); delete o[ix]; return o; }
function placeAt(ix, x, y, r) {
  if (!K.canPlace(S.ed, without(S.run.pos, ix), ix, x, y, r)) return false;
  const np = without(S.run.pos, ix); np[ix] = { x, y, r: r ? 1 : 0 }; commit(np, { ix }); return true;
}
function nearestSpot(ix, cx, cy, r) {
  const base = without(S.run.pos, ix); let best = null;
  [r, K.canRotate(S.ed.pieces[ix]) ? 1 - r : -1].forEach(rr => { if (rr < 0) return; K.validSpots(S.ed, base, ix, rr).forEach(s => { const d = Math.hypot(s[0] - cx, s[1] - cy) + (rr !== r ? 0.5 : 0); if (!best || d < best.d) best = { x: s[0], y: s[1], r: rr, d }; }); });
  return best;
}
function removeToTray(ix) { if (!S.run.pos[ix]) return; S.trot[ix] = S.run.pos[ix].r || 0; commit(without(S.run.pos, ix)); sfx('tick'); }
function select(ix) {
  S.sel = S.sel === ix ? -1 : ix;
  if (S.sel >= 0) sfx('ui');
  renderBoard(); renderTray(); renderHUD();
}
function rotateSel() {
  const ix = S.drag && S.drag.started ? S.drag.ix : S.kb ? S.kb.ix : S.sel; if (ix < 0 || ix == null) return;
  const p = S.ed.pieces[ix]; if (!K.canRotate(p)) return;
  sfx('rotate');
  if (S.drag && S.drag.started) { S.drag.rot = 1 - S.drag.rot; const el = S.drag.el; sizeEl(el, p, S.drag.rot); S.drag.gx = Math.min(S.drag.gx, parseFloat(el.style.width) - 4); S.drag.gy = Math.min(S.drag.gy, parseFloat(el.style.height) - 4); updateDrag(); return; }
  if (S.kb) { S.kb.r = 1 - S.kb.r; kbPreview(); return; }
  const q = S.run.pos[ix];
  if (q) { const s = nearestSpot(ix, q.x, q.y, 1 - q.r); if (s && s.r === 1 - q.r) placeAt(ix, s.x, s.y, s.r); else sfx('invalid'); }
  else { S.trot[ix] = 1 - (S.trot[ix] || 0); sizeEl(S.els[ix], p, S.trot[ix]); renderTray(); renderHUD(); }
}

// ───────────── arrastre ─────────────
function boardRect() { return $('board').getBoundingClientRect(); }
function onDown(e) {
  if (!S.run || S.run.phase !== 'play' || S.press || S.stack.length) return;
  if (e.button > 0 && e.pointerType === 'mouse') { if (e.button === 2 && S.drag && S.drag.started) { e.preventDefault(); rotateSel(); } return; }
  if (S.drag) { if (S.drag.started && e.pointerId !== S.drag.pid && e.pointerType === 'touch') { rotateSel(); } return; }
  const el = e.target.closest('.pc');
  const onBoard = e.target.closest('#board');
  if (!el) { if (onBoard) S.btap = { x: e.clientX, y: e.clientY, pid: e.pointerId }; return; }
  e.preventDefault();
  const ix = +el.dataset.ix, r = el.getBoundingClientRect(), placed = !!S.run.pos[ix];
  S.drag = { pid: e.pointerId, ix, from: placed ? 'board' : 'tray', sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, started: false, touch: e.pointerType !== 'mouse', fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height, rot: placed ? S.run.pos[ix].r : (S.trot[ix] || 0), vx: 0, lt: performance.now() };
  S.drag.lp = setTimeout(() => { const d = S.drag; if (d && !d.started) { d.lpFired = true; S.drag = null; vibe(10); showDetail(ix); } }, 450);
}
function onMove(e) {
  const d = S.drag; if (!d || e.pointerId !== d.pid) return;
  if (!d.started) { if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < (d.touch ? 9 : 5)) return; clearTimeout(d.lp); beginDrag(); }
  const t = performance.now(); d.vx = d.vx * 0.7 + 0.3 * (e.clientX - d.x) / Math.max(8, t - d.lt); d.lt = t;
  d.x = e.clientX; d.y = e.clientY; updateDrag();
}
function onUp(e) {
  if (S.btap && e.pointerId === S.btap.pid) { const b = S.btap; S.btap = null; if (Math.hypot(e.clientX - b.x, e.clientY - b.y) < 10 && !S.drag) boardTap(e.clientX, e.clientY); }
  const d = S.drag; if (!d || e.pointerId !== d.pid) return;
  clearTimeout(d.lp);
  if (!d.started) { S.drag = null; if (!d.lpFired) tapPiece(d.ix, e.clientX, e.clientY); return; }
  endDrag(e.type !== 'pointercancel');
}
function tapPiece(ix, x, y) {
  if (S.sel >= 0 && S.sel !== ix && S.run.pos[ix]) { const br = boardRect(); const cx = Math.floor((x - br.left) / S.cell), cy = Math.floor((y - br.top) / S.cell); const s = nearestSpot(S.sel, cx, cy, S.run.pos[S.sel] ? S.run.pos[S.sel].r : (S.trot[S.sel] || 0)); if (s && s.d <= 1.6) { const k = S.sel; S.sel = -1; placeAt(k, s.x, s.y, s.r); return; } }
  if (S.sel >= 0 && S.sel !== ix && !S.run.pos[ix] && S.run.pos[S.sel]) { const k = S.sel; S.sel = -1; removeToTray(k); }
  select(ix);
}
function boardTap(x, y) {
  if (S.sel < 0) return;
  const br = boardRect(), cx = Math.floor((x - br.left) / S.cell), cy = Math.floor((y - br.top) / S.cell);
  const ix = S.sel, r = S.run.pos[ix] ? S.run.pos[ix].r : (S.trot[ix] || 0);
  let s = K.canPlace(S.ed, without(S.run.pos, ix), ix, cx, cy, r) ? { x: cx, y: cy, r } : nearestSpot(ix, cx, cy, r);
  if (!s) { sfx('invalid'); vibe([20, 30, 20]); return; }
  S.sel = -1; placeAt(ix, s.x, s.y, s.r);
}
function beginDrag() {
  const d = S.drag, p = S.ed.pieces[d.ix], el = S.els[d.ix];
  d.started = true; S.sel = -1;
  d.origin = el.getBoundingClientRect();
  d.base = without(S.run.pos, d.ix);
  d.el = el;
  const wrap = el.parentNode && el.parentNode.classList && el.parentNode.classList.contains('ti') ? el.parentNode : null;
  if (wrap) wrap.style.visibility = 'hidden';
  d.wrap = wrap;
  if (+el.dataset.r !== (d.rot ? 1 : 0)) sizeEl(el, p, d.rot);
  $('dragLayer').appendChild(el);
  el.style.left = '0'; el.style.top = '0';
  const w = parseFloat(el.style.width), h = parseFloat(el.style.height);
  d.gx = d.fx * w; d.gy = d.fy * h;
  d.lift = d.touch ? S.cell * 0.9 : 0;
  d.anchor = null;
  el.classList.remove('sel', 'snap');
  sfx('pick'); vibe(6);
  $('tags').classList.add('dim');
  renderHUD(S.sc.total);
  updateDrag();
}
function updateDrag() {
  const d = S.drag; if (!d || !d.started) return;
  const p = S.ed.pieces[d.ix], el = d.el, c = S.cell;
  const left = d.x - d.gx, top = d.y - d.gy - d.lift;
  const tilt = RM ? 0 : clamp(d.vx * 6, -6, 6) + 2;
  el.style.transform = 'translate(' + left + 'px,' + top + 'px) rotate(' + tilt + 'deg) scale(1.03)';
  const br = boardRect(), dm = K.dims(p, d.rot);
  let bx = (left - br.left) / c, by = (top - br.top) / c;
  // cerca de los bordes, la pieza se acerca a la tapa (imán generoso)
  if (bx < 0 && bx > -1.6) bx = Math.max(bx, -0.55); if (by < 0 && by > -1.6) by = Math.max(by, -0.55);
  const mx = S.ed.C - dm.w, my = S.ed.F - dm.h; if (bx > mx && bx < mx + 1.6) bx = Math.min(bx, mx + 0.55); if (by > my && by < my + 1.6) by = Math.min(by, my + 0.55);
  let best = null;
  for (let yy = Math.floor(by) - 1; yy <= Math.ceil(by) + 1; yy++) for (let xx = Math.floor(bx) - 1; xx <= Math.ceil(bx) + 1; xx++) {
    if (!K.canPlace(S.ed, d.base, d.ix, xx, yy, d.rot)) continue;
    const dist = Math.hypot(xx - bx, yy - by); if (dist <= 0.62 && (!best || dist < best.dist)) best = { x: xx, y: yy, dist, ok: true };
  }
  const cxp = left + dm.w * c / 2, cyp = top + dm.h * c / 2;
  const inside = cxp > br.left && cxp < br.right && cyp > br.top && cyp < br.bottom;
  if (!best && inside) best = { x: clamp(Math.round(bx), 0, S.ed.C - dm.w), y: clamp(Math.round(by), 0, S.ed.F - dm.h), ok: false };
  const key = best ? best.x + ',' + best.y + ',' + d.rot + ',' + best.ok : 'none';
  if (key !== d.akey) {
    d.akey = key; d.anchor = best;
    if (best && best.ok) sfx('tick');
    showPreview(d.ix, best, d.rot);
  }
}
function showPreview(ix, a, r) {
  const g = $('ghost'), c = S.cell, p = S.ed.pieces[ix], dm = K.dims(p, r);
  if (!a) { g.innerHTML = ''; renderTags(); $('tags').classList.add('dim'); renderHUD(K.score(S.ed, without(S.run.pos, ix), S.ctx).total); renderPairTable(); return; }
  let mHTML = '', sc2 = null;
  if (a.ok) {
    const np = without(S.run.pos, ix); np[ix] = { x: a.x, y: a.y, r }; sc2 = K.score(S.ed, np, S.ctx); sc2.ix = ix;
    const pm = sc2.pieces[ix]; if (pm && pm.mults.length) mHTML = '<div class="gm">' + pm.mults.map(m => '<i>' + esc(L().m[m[0]]) + ' ×' + String(m[1]).replace('.', LANG === 'es' ? ',' : '.') + '</i>').join('') + '</div>';
  }
  g.innerHTML = '<div class="gh' + (a.ok ? '' : ' bad') + '" style="left:' + a.x * c + 'px;top:' + a.y * c + 'px;width:' + dm.w * c + 'px;height:' + dm.h * c + 'px">' + mHTML + '</div>';
  if (sc2) {
    renderTags(sc2); $('tags').classList.add('dim'); renderHUD(sc2.total);
    const hl = new Set(); sc2.pairs.forEach(pr => { if (pr.a === ix || pr.b === ix) pr.parts.forEach(x => hl.add(x[0])); }); if (sc2.holes) hl.add('holes'); renderPairTable(hl);
  } else { renderTags(); renderHUD(K.score(S.ed, without(S.run.pos, ix), S.ctx).total); }
}
function clearPreview() { $('ghost').innerHTML = ''; $('tags').classList.remove('dim'); }
function endDrag(ok) {
  const d = S.drag; S.drag = null; if (!d) return;
  const el = d.el, a = d.anchor;
  clearPreview();
  if (ok && a && a.ok) {
    const np = without(S.run.pos, d.ix); np[d.ix] = { x: a.x, y: a.y, r: d.rot ? 1 : 0 };
    el.style.transform = ''; if (d.wrap) d.wrap.style.visibility = '';
    commit(np, { ix: d.ix });
    return;
  }
  const br = boardRect(), overBoard = d.x > br.left && d.x < br.right && d.y > br.top && d.y < br.bottom;
  if (ok && d.from === 'board' && !overBoard) {
    if (d.wrap) d.wrap.style.visibility = '';
    S.trot[d.ix] = d.rot; el.style.transform = '';
    commit(without(S.run.pos, d.ix)); sfx('tick');
    return;
  }
  // vuelve a su lugar
  sfx('invalid'); vibe([20, 30, 20]);
  const o = d.origin;
  if (!RM) { el.classList.add('back'); el.style.transform = 'translate(' + o.left + 'px,' + o.top + 'px) scale(' + (o.width / parseFloat(el.style.width)) + ')'; }
  setTimeout(() => { el.classList.remove('back'); if (d.wrap) d.wrap.style.visibility = ''; if (d.from === 'tray' && +el.dataset.r !== (S.trot[d.ix] || 0)) sizeEl(el, S.ed.pieces[d.ix], S.trot[d.ix] || 0); renderAll(); }, RM ? 0 : 230);
}
function cancelDrag() {
  if (S.drag && S.drag.started) { const d = S.drag; S.drag = null; clearPreview(); if (d.wrap) d.wrap.style.visibility = ''; d.el.style.transform = ''; d.el.classList.remove('back'); if (d.from === 'tray') sizeEl(d.el, S.ed.pieces[d.ix], S.trot[d.ix] || 0); renderAll(); }
  else if (S.drag) { clearTimeout(S.drag.lp); S.drag = null; }
}
window.addEventListener('pointerdown', onDown, { passive: false });
window.addEventListener('pointermove', onMove, { passive: true });
window.addEventListener('pointerup', onUp);
window.addEventListener('pointercancel', e => { if (S.drag && e.pointerId === S.drag.pid) { if (S.drag.started) cancelDrag(); else { clearTimeout(S.drag.lp); S.drag = null; } } });
window.addEventListener('wheel', e => { if (S.drag && S.drag.started) { e.preventDefault(); rotateSel(); } }, { passive: false });
window.addEventListener('contextmenu', e => {
  if (!S.run || S.run.phase !== 'play') return;
  const el = e.target.closest && e.target.closest('#pieces .pc');
  if (S.drag && S.drag.started) { e.preventDefault(); return; }
  if (el) { e.preventDefault(); removeToTray(+el.dataset.ix); }
});
// pasar el mouse: resaltar vecinos
$('pieces').addEventListener('pointerover', e => {
  if (e.pointerType !== 'mouse' || S.drag) return; const el = e.target.closest('.pc'); if (!el) return; const ix = +el.dataset.ix;
  const t = $('tags'); t.classList.add('dim'); t.querySelectorAll('.tag').forEach(g => g.classList.toggle('hi', +g.dataset.a === ix || +g.dataset.b === ix));
});
$('pieces').addEventListener('pointerout', e => { if (e.pointerType !== 'mouse' || S.drag) return; const t = $('tags'); t.classList.remove('dim'); t.querySelectorAll('.tag.hi').forEach(g => g.classList.remove('hi')); });
$('trayBox').addEventListener('pointerup', e => { if (S.sel >= 0 && S.run && S.run.pos[S.sel] && !e.target.closest('.pc') && !S.drag) { const k = S.sel; S.sel = -1; removeToTray(k); } });

// ───────────── teclado ─────────────
function kbStart(ix) {
  const q = S.run.pos[ix], r = q ? q.r : (S.trot[ix] || 0);
  let x = q ? q.x : 0, y = q ? q.y : 0;
  if (!q) { const s = nearestSpot(ix, 0, 0, r); if (s) { x = s.x; y = s.y; } }
  S.kb = { ix, x, y, r }; sfx('pick'); kbPreview();
}
function kbPreview() {
  const k = S.kb, p = S.ed.pieces[k.ix], dm = K.dims(p, k.r);
  k.x = clamp(k.x, 0, S.ed.C - dm.w); k.y = clamp(k.y, 0, S.ed.F - dm.h);
  const ok = K.canPlace(S.ed, without(S.run.pos, k.ix), k.ix, k.x, k.y, k.r);
  showPreview(k.ix, { x: k.x, y: k.y, ok }, k.r);
}
function kbDrop() {
  const k = S.kb; if (!k) return;
  if (placeAt(k.ix, k.x, k.y, k.r)) { S.kb = null; clearPreview(); setTimeout(() => { const el = S.els[k.ix]; if (el) el.focus({ preventScroll: true }); }, 0); }
  else { sfx('invalid'); vibe([20, 30, 20]); }
}
document.addEventListener('keydown', e => {
  const top = S.stack[S.stack.length - 1];
  if (top) {
    if (e.key === 'Escape') { e.preventDefault(); if (top === 'sPause') resumePlay(); else if (top === 'sIntro') introDone(); else if (S.stack.length > 1 || (top !== 'sTitle' && top !== 'sRules' && top !== 'sEd' && top !== 'sFinal')) { if (top === 'sModal' || S.stack.length > 1) back(); } }
    else if (top === 'sIntro' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); introDone(); }
    else if (top === 'sPause' && (e.key === 'p' || e.key === 'P')) resumePlay();
    return;
  }
  if (!S.run || S.run.phase !== 'play' || $('game').hidden) return;
  if (S.press) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); S.press.speed = 3; } return; }
  const f = document.activeElement, fix = f && f.classList && f.classList.contains('pc') ? +f.dataset.ix : -1;
  const k = e.key, ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && k === 'Enter') { e.preventDefault(); onPrint(); return; }
  if (k === 'Escape') { e.preventDefault(); if (S.kb) { S.kb = null; clearPreview(); renderAll(); } else if (S.sel >= 0) select(S.sel); else pause(); return; }
  if (k === 'p' || k === 'P') { pause(); return; }
  if ((k === 'z' || k === 'Z') && !e.shiftKey) { e.preventDefault(); undo(); return; }
  if (k === 'y' || k === 'Y' || ((k === 'z' || k === 'Z') && e.shiftKey)) { e.preventDefault(); redo(); return; }
  if (k === 'r' || k === 'R') { if (fix >= 0 && !S.kb) S.sel = fix; rotateSel(); return; }
  if (S.kb) {
    const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
    if (mv) { e.preventDefault(); S.kb.x += mv[0]; S.kb.y += mv[1]; sfx('tick'); kbPreview(); return; }
    if (k === 'Enter' || k === ' ') { e.preventDefault(); kbDrop(); return; }
    if (k === 'Tab') { e.preventDefault(); return; }
  }
  if (fix >= 0) {
    if (k === 'Enter' || k === ' ') { e.preventDefault(); kbStart(fix); return; }
    if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); removeToTray(fix); return; }
    if (k === 'i' || k === 'I') { showDetail(fix); return; }
  }
});

// ───────────── detalle de pieza ─────────────
function showDetail(ix) {
  const p = S.ed.pieces[ix], tx = ptext(p), sec = secOf(p), pc = S.sc.pieces[ix];
  let h = '<div class="top"><span class="det-sec" style="--sc:' + A.SEC_COLOR[sec] + '">' + A.iconSVG(sec) + esc(L().types[p.t]) + ' · ' + esc(L().secs[sec] || '') + '</span><span style="flex:1"></span><button class="x" data-close aria-label="' + esc(tr('close')) + '">✕</button></div>';
  h += '<div class="det-h">' + esc((tx.f ? tx.f + ' · ' : '') + tx.h) + '</div>';
  if (tx.d) h += '<div class="det-d">' + esc(tx.d) + '</div>';
  if (p.t === 'foto') h += '<div class="det-d">' + esc(tr('photo_of', { t: shortT(S.ed.pieces[p.story]) })) + '</div>';
  h += '<div class="lines"><div><span>' + esc(tr('base')) + '</span><b>' + p.base + '</b></div>';
  if (pc) {
    pc.mults.forEach(m => { h += '<div><span>' + esc(L().m[m[0]]) + '</span><b class="p">×' + String(m[1]).replace('.', LANG === 'es' ? ',' : '.') + '</b></div>'; });
    pc.extra.forEach(x => { h += '<div><span>' + esc(L().glob[x[0]] || x[0]) + '</span><b class="p">+' + x[1] + '</b></div>'; });
    S.sc.pairs.filter(pr => pr.a === ix || pr.b === ix).forEach(pr => { const o = S.ed.pieces[pr.a === ix ? pr.b : pr.a]; pr.parts.forEach(x => { h += '<div><span>' + esc(L().pairs[x[0]] || x[0]) + ' · ' + esc(L().code[secOf(o)]) + '</span><b class="' + (x[1] > 0 ? 'p' : x[1] < 0 ? 'n' : '') + '">' + (x[1] > 0 ? '+' : x[1] < 0 ? '−' : '') + Math.abs(x[1]) + '</b></div>'; }); });
    h += '<div><span><b>' + esc(tr('value')) + '</b></span><b>' + pc.total + '</b></div>';
  } else h += '<div><span>' + esc(tr('not_placed')) + '</span><b>—</b></div>';
  h += '</div>';
  if (S.run.pos[ix] && S.run.phase === 'play') h += '<button class="btn" data-rm>' + esc(tr('remove')) + '</button>';
  h += '<button class="btn pri" data-close>' + esc(tr('close')) + '</button>';
  modal(h, c => { c.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal); const rm = c.querySelector('[data-rm]'); if (rm) rm.onclick = () => { closeModal(); removeToTray(ix); }; });
}

// ───────────── partida ─────────────
function edFor(run, k) {
  if (run.mode === 'tut' && k === 3) { const ed = K.genEdition('TUTOR3', 1, 'b'); if ((run.picks || []).some(p => p.id === 'exclusiva')) K.addExclusive(ed); return ed; }
  return K.editionFor(run, k);
}
function loadEdition() {
  const run = S.run;
  S.ed = edFor(run, run.k); S.ctx = K.ctxFor(run.picks, run.k);
  S.J = K.score(S.ed, S.ed.boss, S.ctx).total;
  S.goal = run.mode === 'tut' ? 0 : K.goalFor(S.ed, S.J, run.picks);
  S.trot = run.trot || {}; run.trot = S.trot; S.sel = -1; S.kb = null;
  // posiciones guardadas inválidas: se descartan sin romper
  for (const k in run.pos) { const p = S.ed.pieces[k], q = run.pos[k]; if (!p || !q || !K.canPlace(S.ed, without(run.pos, k), +k, q.x, q.y, q.r)) delete run.pos[k]; }
  wasMet = false; wasGold = false;
  rescore(); wasMet = S.sc.total >= S.goal && S.goal > 0; wasGold = S.sc.total >= S.J;
  S.shown = S.sc.total; prevTags = new Set(S.sc.pairs.map(p => p.a + '-' + p.b + ':' + p.v));
  $('mNum').textContent = run.mode === 'daily' ? (LANG === 'es' ? 'Nº ' : 'No. ') + K.dailyNumber(run.day) : run.mode === 'free' ? run.seed : (LANG === 'es' ? 'Práctica' : 'Practice');
}
function newRun(o) {
  const run = { v: VER, mode: o.mode, seed: o.seed, diff: o.diff || 'r', day: o.day || null, practice: !!o.practice, k: 1, phase: 'rules', picks: [], pos: {}, hist: [], fut: [], res: [], trot: {}, offers: null };
  if (run.mode === 'tut') run.phase = 'play';
  S.run = run; S.elsKey = '';
  saveRun(true);
  goPhase(true);
}
function goPhase(fresh) {
  const run = S.run; if (!run) return;
  if (run.phase === 'press') {
    // la rotativa ya había arrancado (recarga o pestaña cerrada): se cierra la impresión con la misma portada, sin dejar esquivar el resultado
    loadEdition(); showGame(true); hideAll(); S.elsKey = ''; layout(); scene('game');
    const sc = rescore(), fail = run.mode !== 'tut' && sc.total < S.goal;
    finishPrint(sc, fail ? 'rec' : sc.total >= S.J ? 'gold' : 'sold');
    return;
  }
  if (run.phase === 'rules') {
    if (!run.offers) run.offers = run.mode === 'tut' ? ['limpia', 'cobertura'] : K.offers(run, run.k, K.unlockedRules(S.prog));
    saveRun(true); scene('rules'); showGame(false); show('sRules');
  } else if (run.phase === 'play') { startEdition(fresh); }
  else if (run.phase === 'result') { loadEdition(); showGame(true); buildEls(); layout(); scene('game'); show('sEd'); }
  else if (run.phase === 'final') { scene('menu'); showGame(false); show('sFinal'); }
}
function showGame(on) { $('game').hidden = !on; if (on) document.body.classList.add('ingame'); else document.body.classList.remove('ingame'); updateChrome(); }
function startEdition(fresh) {
  loadEdition();
  showGame(true); hideAll();
  S.elsKey = ''; layout();
  scene('game');
  if (fresh) showIntro(); else if (S.run.mode === 'tut') tutStart();
  updateChrome();
}
function showIntro() {
  const ed = S.ed, run = S.run, th = ed.theme;
  let h = '<div class="n">' + esc(run.mode === 'tut' ? tr('tut_x', { k: run.k }) : tr('edition_x', { k: run.k })) + '</div><h2>' + esc(tr('size', { c: ed.C, f: ed.F })) + '</h2>';
  if (th) h += '<div class="th" style="--sc:' + A.SEC_COLOR[th] + '">' + A.iconSVG(th) + esc(tr('theme')) + ': ' + esc(L().secs[th]) + '</div>';
  if (S.goal) h += '<div class="gl">' + esc(tr('goal')) + ' <b>' + fmt(S.goal) + '</b> ' + esc(tr('unit')) + '</div>';
  h += '<div class="tap">' + esc(tr('tap_skip')) + '</div>';
  $('introBox').innerHTML = h;
  push('sIntro'); sfx('print');
  clearTimeout(S.introT); S.introT = setTimeout(introDone, 1700);
}
function introDone() { clearTimeout(S.introT); if (S.stack[S.stack.length - 1] === 'sIntro') { back(); hideAll(); } updateChrome(); if (S.run && S.run.mode === 'tut') tutStart(); }
$('sIntro').addEventListener('click', introDone);
function pause(vis) {
  if (!S.run || S.run.phase !== 'play' || S.stack.length) return;
  cancelDrag(); S.kb = null; clearPreview();
  S.pauseVis = !!vis; push('sPause'); AU.duck(true); saveRun(true);
}
function renderPause() { $('pauseNote').textContent = S.pauseVis ? tr('paused_vis') : ''; const b = $('bRestart'); b.classList.remove('danger', 'armed'); b.textContent = tr('restart_ed'); }
function resumePlay() { if (S.stack[S.stack.length - 1] === 'sPause') { hideAll(); AU.duck(false); AU.resume(); } }

// ───────────── imprimir y rotativa ─────────────
function onPrint() {
  if (!S.run || S.run.phase !== 'play' || S.press) return;
  cancelDrag(); S.kb = null; clearPreview(); S.sel = -1;
  sfx('uiPri');
  if (S.run.mode !== 'tut' && S.sc.total < S.goal) {
    modal('<div class="top"><h2>' + esc(tr('below_goal_t')) + '</h2></div><p class="note">' + esc(S.run.mode === 'free' ? tr('below_goal_free') : tr('below_goal')) + '</p><p class="res-g"><span>' + esc(tr('copies')) + ' <b>' + fmt(S.sc.total) + '</b></span><span>' + esc(tr('goal')) + ' <b>' + fmt(S.goal) + '</b></span></p><button class="btn pri" data-k>' + esc(tr('keep_editing')) + '</button><button class="btn" data-p>' + esc(tr('print_anyway')) + '</button>',
      c => { c.querySelector('[data-k]').onclick = closeModal; c.querySelector('[data-p]').onclick = () => { closeModal(); doPrint(); }; });
    return;
  }
  doPrint();
}
function doPrint() {
  const run = S.run; run.phase = 'press'; saveRun(true);
  if (S.tut) tutHide();
  updateChrome();
  const sc = rescore(), ed = S.ed, c = S.cell;
  const items = Object.keys(run.pos).map(Number).sort((a, b) => run.pos[a].y - run.pos[b].y || run.pos[a].x - run.pos[b].x);
  const pr = $('press'), roller = $('roller'), stamp = $('stamp');
  pr.hidden = false; stamp.className = ''; stamp.textContent = '';
  const fail = run.mode !== 'tut' && sc.total < S.goal, gold = sc.total >= S.J;
  const kind = fail ? 'rec' : gold ? 'gold' : 'sold';
  sfx('print'); AU.press(true); vibe(15);
  const D = RM ? 500 : (run.mode === 'tut' ? 1600 : 2500), boardH = ed.F * c;
  const P = { t0: performance.now(), el: 0, speed: 1, last: performance.now(), i: 0, acc: 0, pairsDone: false, stage: 0 };
  S.press = P;
  pr.onclick = () => { if (P.stage < 2) P.speed = P.speed > 1 ? 50 : 3; };
  setScore(0, 0); S.shown = 0;
  const step = () => {
    if (S.press !== P) return;
    const now = performance.now(); P.el += (now - P.last) * P.speed; P.last = now;
    if (P.stage === 0) {
      const k = Math.min(1, P.el / D), y = k * (boardH + 20) - 10;
      roller.style.opacity = RM ? 0 : 1; roller.style.top = ($('mast').offsetHeight + parseFloat($('paper').style.padding) + y - 11) + 'px';
      while (P.i < items.length) {
        const ix = items[P.i], q = run.pos[ix]; if (q.y * c > y) break;
        const el = S.els[ix], pv = sc.pieces[ix];
        el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
        P.acc += pv.total; setScore(P.acc, 0); S.shown = P.acc;
        floatNum(el, '+' + pv.total, 'pos'); sfx('count', Math.min(14, P.i)); P.i++;
      }
      if (k >= 1) { P.stage = 1; P.el = 0; roller.style.opacity = 0; }
    } else if (P.stage === 1) {
      // pares, reglas y huecos
      const rest = sc.total - P.acc;
      const tags = $('tags').querySelectorAll('.tag');
      tags.forEach((t, i) => setTimeout(() => { t.classList.add('hi'); setTimeout(() => t.classList.remove('hi'), 200); }, Math.min(900, i * 60) / P.speed));
      if (sc.sumPairs) sfx(sc.sumPairs > 0 ? 'pairPos' : 'pairNeg', 3);
      setTimeout(() => { if (S.press !== P) return; setScore(sc.total, 0); S.shown = sc.total; }, 300 / P.speed);
      P.stage = 2; P.el = 0; void rest;
    } else if (P.stage === 2) {
      if (P.el > 700) {
        P.stage = 3; P.el = 0;
        stamp.textContent = tr(kind === 'rec' ? 'recycled' : kind === 'gold' ? 'gold' : 'sold_out');
        stamp.className = kind + ' on';
        AU.press(false);
        sfx(kind === 'rec' ? 'stampRec' : kind === 'gold' ? 'stampGold' : 'stampSold');
        vibe(kind === 'gold' ? [30, 40, 60] : kind === 'rec' ? [40] : [20]);
        if (kind === 'gold' && !RM) { const f = document.createElement('div'); f.className = 'foil'; $('paper').appendChild(f); setTimeout(() => f.remove(), 1300); confetti(); }
      }
    } else if (P.stage === 3) {
      if (P.el > (RM ? 500 : 1300)) { finishPrint(sc, kind); return; }
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function floatNum(el, txt, cls) {
  const r = el.getBoundingClientRect(), f = document.createElement('div');
  f.className = 'fnum ' + (cls || ''); f.textContent = txt; f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + r.height / 2) + 'px';
  $('fx').appendChild(f); setTimeout(() => f.remove(), 950);
}
function confetti() {
  const fx = $('fx'), cols = ['#f2c14e', '#00f2cf', '#7700f4', '#ff4466', '#fff'], r = $('paper').getBoundingClientRect();
  for (let i = 0; i < 46; i++) { const d = document.createElement('i'); d.className = 'conf'; d.style.left = (r.left + r.width / 2) + 'px'; d.style.top = (r.top + r.height * 0.4) + 'px'; d.style.background = cols[i % cols.length]; d.style.setProperty('--dx', (Math.random() * 2 - 1) * r.width * 0.8 + 'px'); d.style.setProperty('--dy', (Math.random() * 0.9 + 0.1) * r.height * 0.8 + 'px'); d.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg'); fx.appendChild(d); setTimeout(() => d.remove(), 1500); }
}
function finishPrint(sc, kind) {
  const run = S.run; S.press = null;
  const pr = $('press'); pr.hidden = true; pr.onclick = null; $('stamp').className = '';
  const res = { k: run.k, total: sc.total, J: S.J, goal: S.goal, stars: run.mode === 'tut' ? (sc.total >= S.J ? 3 : sc.total >= S.J * 0.9 ? 2 : 1) : K.stars(sc.total, S.goal, S.J), pos: JSON.parse(JSON.stringify(run.pos)), theme: S.ed.theme, kind, holes: sc.holes, failed: kind === 'rec' };
  run.res[run.k - 1] = res; run.phase = 'result';
  // progreso
  const P = S.prog;
  if (run.mode !== 'tut') {
    P.printed++; P.total += sc.total; if (res.stars === 3) P.golds++;
    if (run.diff === 'j' && sc.holes === 0) P.nightJ = true;
    archiveAdd(res);
  }
  saveProg(); saveRun(true);
  scene('game'); AU.duck(false);
  show('sEd');
}
function archiveAdd(res) {
  const run = S.run; if (run.practice) return;
  let a = sget('archive'); if (!Array.isArray(a)) a = []; a.unshift({ v: VER, d: K.localDay(), mode: run.mode, seed: run.seed, diff: run.diff, k: run.k, picks: run.picks.filter(p => p.ed <= run.k), pos: res.pos, total: res.total, stars: res.stars, n: run.mode === 'daily' ? K.dailyNumber(run.day) : run.seed, kind: res.kind });
  sset('archive', a.slice(0, 30));
}
function bossDiff(res) {
  const ed = S.ed, ctx = S.ctx, me = K.score(ed, res.pos, ctx), bo = K.score(ed, ed.boss, ctx);
  if (me.total > bo.total) return { full: tr('diff_none') };
  if (me.total === bo.total) return { full: tr('diff_tie') };
  let best = null;
  ed.pieces.forEach(p => {
    const b = bo.pieces[p.ix] ? bo.pieces[p.ix].total : 0, m = me.pieces[p.ix] ? me.pieces[p.ix].total : 0;
    if (b - m > 0 && (!best || b - m > best.v)) best = { p, v: b - m };
  });
  if (!best) return tr('diff_pairs', { v: Math.max(1, bo.total - me.total) });
  const p = best.p, bm = bo.pieces[p.ix].mults.map(x => x[0]), mm = me.pieces[p.ix] ? me.pieces[p.ix].mults.map(x => x[0]) : null;
  if (!mm) return tr('diff_left', { t: shortT(p), v: best.v });
  if (bm.indexOf('cab') >= 0 && mm.indexOf('cab') < 0) return tr('diff_cab', { t: shortT(p) });
  if (bm.indexOf('foto') >= 0 && mm.indexOf('foto') < 0) return tr('diff_foto', { t: shortT(p) });
  return tr('diff_left', { t: shortT(p), v: best.v });
}
function renderEdResult() {
  const run = S.run, res = run.res[run.k - 1]; if (!res || !S.ed) return;
  const isT = run.mode === 'tut';
  const kind = res.kind, lbl = kind === 'rec' ? 'recycled' : kind === 'gold' ? 'gold' : 'sold_out';
  let h = '<div class="res-k">' + esc(isT ? tr('tut_x', { k: run.k }) : tr('ed_result', { k: run.k }) + ' · ' + tr('size', { c: S.ed.C, f: S.ed.F })) + '</div>';
  h += '<span class="res-stamp ' + kind + '">' + esc(tr(lbl)) + '</span>';
  h += '<div class="res-n">' + fmt(res.total) + '<small>' + esc(tr('unit')) + '</small></div>';
  h += '<div class="res-g">' + (isT ? '' : '<span>' + esc(tr('goal')) + ' <b>' + fmt(res.goal) + '</b></span>') + '<span>' + esc(tr('chief')) + ' <b>' + fmt(res.J) + '</b></span></div>';
  h += '<div class="stars" aria-label="' + esc(tr('stars_lbl', { n: res.stars })) + '">' + [1, 2, 3].map(i => starSVG(false)).join('') + '</div>';
  h += '<div class="cmp"><figure><canvas id="cmpA"></canvas><figcaption><b>' + esc(tr('your_page')) + '</b><span class="fc-n">' + fmt(res.total) + '</span></figcaption></figure><figure><canvas id="cmpB"></canvas><figcaption>' + esc(tr('boss_page')) + '<span class="fc-n">' + fmt(res.J) + '</span></figcaption></figure></div>';
  const bd = bossDiff(res);
  h += '<div class="dnote">' + esc(typeof bd === 'string' ? tr('diff_note', { t: bd }) : bd.full) + '</div>';
  const sc = K.score(S.ed, res.pos, S.ctx);
  const rulesV = sc.extras + sc.glob.reduce((a, x) => a + x[1], 0);
  h += '<div class="lines"><div><span>' + esc(tr('pieces')) + '</span><b>' + sc.sumPieces + '</b></div><div><span>' + esc(tr('effects')) + '</span><b class="' + (sc.sumPairs >= 0 ? 'p' : 'n') + '">' + (sc.sumPairs >= 0 ? '+' : '−') + Math.abs(sc.sumPairs) + '</b></div>' + (rulesV ? '<div><span>' + esc(tr('rules_n', { n: (run.picks || []).filter(p => p.ed <= run.k).length })) + '</span><b class="p">+' + rulesV + '</b></div>' : '') + (sc.gm.length ? '<div><span>' + sc.gm.map(x => esc(L().glob[x[0]] || x[0])).join(' · ') + '</span><b class="p">×' + sc.gm.reduce((a, x) => a * x[1], 1).toFixed(2).replace('.', LANG === 'es' ? ',' : '.') + '</b></div>' : '') + (sc.holePen ? '<div><span>' + esc(L().glob.holes) + ' (' + sc.holes + ')</span><b class="n">−' + sc.holePen + '</b></div>' : '') + '</div>';
  const last = run.k === 3 || res.failed;
  if (res.failed && run.mode === 'free') h += '<div class="acts"><div class="row"><button class="btn pri" id="bRedoEd">' + esc(tr('redo_ed')) + '</button></div><button class="btn" id="bNext">' + esc(tr('final_btn')) + '</button></div>';
  else h += '<div class="acts"><button class="btn pri" id="bNext">' + esc(last ? tr('final_btn') : tr('next_ed')) + '</button></div>';
  $('edCard').innerHTML = h;
  // estrellas animadas
  const st = $('edCard').querySelectorAll('.stars svg');
  st.forEach((s, i) => setTimeout(() => { if (i < res.stars) { s.classList.add('on'); s.querySelector('path').setAttribute('fill', '#f2c14e'); sfx('count', 4 + i * 2); } }, 250 + i * 260));
  drawMini($('cmpA'), S.ed, res.pos, kind === 'gold' ? 'gold' : kind === 'sold' ? 'sold' : 'rec');
  drawMini($('cmpB'), S.ed, S.ed.boss, null);
  $('bNext').onclick = () => { sfx('uiPri'); nextAfterResult(res); };
  const rd = $('bRedoEd'); if (rd) rd.onclick = () => { sfx('uiPri'); run.res.splice(run.k - 1, 1); run.pos = {}; run.hist = []; run.fut = []; run.phase = 'play'; saveRun(true); startEdition(true); };
}
function LAND_SHORT() { return matchMedia('(orientation:landscape) and (max-height:520px)').matches; }
function drawMini(cv, ed, pos, stamp) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), ratio = (ed.F + 0.7) / ed.C + 0.12;
  // alto máximo ~34 % de la pantalla: en escritorio bajo o teléfono acostado el botón «Siguiente» queda a la vista
  const W = Math.max(96, Math.min(300, cv.parentNode.clientWidth || 200, (window.innerHeight * (LAND_SHORT() ? 0.6 : 0.34)) / ratio));
  const H = W * ratio;
  cv.style.maxWidth = Math.round(W) + 'px'; cv.style.margin = '0 auto';
  cv.width = Math.round(W * dpr) + 20; cv.height = Math.round(H * dpr) + 24; cv.style.aspectRatio = cv.width + '/' + cv.height;
  const c = cv.getContext('2d'); c.scale(dpr, dpr);
  A.mini(c, ed, pos, 6, 6, W - 4, { title: L().paper, stamp, stampText: stamp ? tr(stamp === 'gold' ? 'gold' : stamp === 'sold' ? 'sold_out' : 'recycled') : '' });
}
function nextAfterResult(res) {
  const run = S.run;
  if (res.failed || run.k >= 3) { run.phase = 'final'; run.stopped = !!res.failed; saveRun(true); finalize(); goPhase(); return; }
  run.k++; run.pos = {}; run.hist = []; run.fut = []; run.trot = {}; run.offers = null;
  run.phase = run.mode === 'tut' && run.k === 2 ? 'play' : 'rules';
  saveRun(true); goPhase(true);
}

// ───────────── reglas ─────────────
let pickSel = -1, pickSec = null;
function renderRules() {
  const run = S.run; if (!run) return;
  const nx = edFor(run, run.k);
  $('rulesKick').textContent = (run.mode === 'tut' ? tr('tut_x', { k: run.k }) : tr('edition_x', { k: run.k })) + ' · ' + tr('size', { c: nx.C, f: nx.F }) + (nx.theme ? ' · ' + tr('theme') + ': ' + L().secs[nx.theme] : '');
  const seen = new Set(S.prog.seen || []);
  pickSel = -1; pickSec = null;
  $('cards').innerHTML = run.offers.map((id, i) => {
    const r = K.RULE[id], t = L().rules[id];
    return '<button class="rcard ' + r.rar + '" data-i="' + i + '" aria-pressed="false">' + (seen.has(id) ? '' : '<span class="nw">' + esc(tr('new_badge')) + '</span>') + '<span class="g">' + esc(glyph(id)) + '</span><b>' + esc(t[0]) + '</b><p>' + esc(t[1]) + '</p><span class="rar">' + esc(tr('rar_' + r.rar)) + '</span></button>';
  }).join('');
  $('secPick').hidden = true; $('bChoose').disabled = true;
  $('cards').querySelectorAll('.rcard').forEach(b => b.onclick = () => {
    const i = +b.dataset.i;
    if (pickSel === i && run.offers[i] !== 'linea') { choose(); return; }
    pickSel = i; sfx('card');
    $('cards').querySelectorAll('.rcard').forEach(x => { const on = +x.dataset.i === i; x.classList.toggle('on', on); x.classList.toggle('flip', on && !RM); x.setAttribute('aria-pressed', on); });
    const lin = run.offers[i] === 'linea';
    $('secPick').hidden = !lin;
    if (lin) $('secPick').innerHTML = K.SECS.map(s => '<button data-s="' + s + '" style="--sc:' + A.SEC_COLOR[s] + '">' + A.iconSVG(s) + esc(L().secs[s]) + '</button>').join('');
    $('secPick').querySelectorAll('button').forEach(sb => sb.onclick = () => { pickSec = sb.dataset.s; sfx('ui'); $('secPick').querySelectorAll('button').forEach(z => z.classList.toggle('on', z === sb)); $('bChoose').disabled = false; });
    $('bChoose').disabled = lin && !pickSec;
  });
  drawRulesBg();
}
function choose() {
  const run = S.run; if (pickSel < 0) return;
  const id = run.offers[pickSel]; if (id === 'linea' && !pickSec) return;
  sfx('cardOk'); vibe(10);
  run.picks.push({ id, ed: run.k, sec: id === 'linea' ? pickSec : undefined });
  if (S.prog.seen.indexOf(id) < 0) S.prog.seen.push(id);
  run.offers.forEach(o => { if (S.prog.seen.indexOf(o) < 0) S.prog.seen.push(o); });
  saveProg();
  run.phase = 'play'; run.pos = {}; run.hist = []; run.fut = []; run.offers = null; saveRun(true);
  startEdition(true);
}
$('bChoose').onclick = choose;
function drawRulesBg() {
  const cv = $('rulesBg'), dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const ed = edFor(S.run, S.run.k), cell = Math.min(W / 22, 40);
  c.clearRect(0, 0, W, H);
  if (W < 900 || H < 640) return;
  // la mesa de la próxima edición, en miniatura, al pie
  let x = 20, y = H - cell * 3.6; const pos = {};
  c.globalAlpha = 0.9;
  ed.pieces.forEach(p => {
    const w = p.w * cell, h = p.h * cell;
    if (x + w > W - 20) { x = 20; y += cell * 3.3; }
    const sec = secOf(p); c.fillStyle = p.t === 'foto' ? '#cfc6b2' : p.t === 'excl' ? '#f2c14e' : '#f2ecdf'; A.rr(c, x, y, w - 6, h - 6, 4); c.fill();
    c.fillStyle = A.SEC_COLOR[sec]; c.fillRect(x, y, w - 6, 5);
    x += w + 8;
  });
  void pos;
  if (ed.theme) { c.globalAlpha = 1; c.fillStyle = A.SEC_COLOR[ed.theme]; c.font = '700 13px "JetBrains Mono", monospace'; c.fillText(tr('next_table', { k: S.run.k }) + ' · ' + tr('theme') + ': ' + L().secs[ed.theme], 20, H - cell * 3.6 - 14); }
}

// ───────────── final ─────────────
function finalize() {
  const run = S.run; if (run.counted) return; run.counted = true;
  const P = S.prog, before = K.unlockedRules(P), rk0 = K.rankOf(P.total);
  const total = run.res.reduce((a, r) => a + (r ? r.total : 0), 0);
  run.totalAll = total;
  if (run.mode === 'tut') { P.tut = true; }
  else {
    P.runs++;
    const key = run.mode === 'daily' ? 'daily' : run.diff;
    run.record = total > (P.best[key] || 0) && !run.practice; if (run.record) P.best[key] = total;
    if (run.diff === 'j' && run.res.length === 3 && !run.stopped) P.runJ = true;
    if (run.mode === 'daily' && !run.practice) {
      const d = run.day;
      if (P.lastDay !== d) { const y = new Date(); const prev = K.localDay(new Date(new Date(d + 'T12:00:00').getTime() - 86400000)); P.streak = P.lastDay === prev ? P.streak + 1 : 1; P.lastDay = d; P.bestStreak = Math.max(P.bestStreak, P.streak); void y; }
      sset('daily:' + d, { v: VER, total, res: run.res.map(r => r ? { total: r.total, stars: r.stars, kind: r.kind } : null), n: K.dailyNumber(d), stopped: !!run.stopped, streak: P.streak });
    }
  }
  const after = K.unlockedRules(P); run.unlocked = after.filter(x => before.indexOf(x) < 0);
  run.rankUp = K.rankOf(P.total) > rk0 ? K.rankOf(P.total) : 0;
  saveProg(); saveRun(true);
}
function renderFinal() {
  const run = S.run; if (!run) return;
  finalize();
  const isT = run.mode === 'tut', P = S.prog;
  let h = '';
  if (isT) {
    h += '<canvas class="fin-cv" id="finCv"></canvas><div class="res-n" style="font-size:30px;font-family:Poppins">' + esc(tr('tut_end')) + '</div><p class="note" style="margin-top:8px">' + esc(tr('tagline')) + '</p><button class="btn pri" id="fHome">' + esc(tr('start')) + '</button>';
    $('finCard').innerHTML = h;
  } else {
    h += '<div class="res-k">' + esc(run.stopped ? tr('press_stopped') : tr('final')) + (run.mode === 'daily' ? ' · ' + (LANG === 'es' ? 'Nº ' : 'No. ') + K.dailyNumber(run.day) : '') + '</div>';
    h += '<canvas class="fin-cv" id="finCv"></canvas>';
    h += '<div class="res-n" id="finN">0<small>' + esc(tr('total')) + ' · ' + esc(tr('unit')) + '</small></div>';
    if (run.record) h += '<p style="text-align:center;margin:4px 0"><span class="badge">' + esc(tr('new_record')) + '</span></p>';
    h += '<div class="fin-eds">' + [0, 1, 2].map(i => { const r = run.res[i]; return '<div>' + esc(tr('ed_short', { k: i + 1 })) + '<b>' + (r ? fmt(r.total) : '—') + '</b><span class="s">' + (r ? '★'.repeat(r.stars) + '<span style="opacity:.22">' + '★'.repeat(3 - r.stars) + '</span>' : '') + '</span></div>'; }).join('') + '</div>';
    const rk = K.rankOf(P.total), nx = K.RANKS[rk + 1], cur = K.RANKS[rk];
    h += '<div class="rankbar">' + (run.rankUp ? '<span class="badge">' + esc(tr('rank_up')) + '</span> ' : '') + esc(tr('rank')) + ': <b style="color:var(--ink)">' + esc(L().rank_names[rk]) + '</b>' + (nx ? ' · ' + fmt(P.total) + '/' + fmt(nx) : '') + '<div class="rb"><i style="width:' + (nx ? ((P.total - cur) / (nx - cur) * 100) : 100) + '%"></i></div></div>';
    if (run.unlocked && run.unlocked.length) h += '<div class="side-t">' + esc(tr('unlocked')) + '</div><div class="unl">' + run.unlocked.map(id => '<span class="chip rule"><b>' + esc(glyph(id)) + '</b>' + esc(L().rules[id][0]) + '</span>').join('') + '</div>';
    if (run.mode === 'free') h += '<div class="side-t" style="text-align:center">' + esc(tr('edition_code')) + '</div><div class="codebox">' + esc(run.seed) + '</div>';
    const daily = run.mode === 'daily';
    h += '<div class="acts">';
    if (daily && !run.practice) h += '<button class="btn pri" id="fShare">' + esc(tr('share')) + '</button><div class="row"><button class="btn" id="fAgain">' + esc(tr('free')) + '</button>';
    else h += '<button class="btn pri" id="fAgain">' + esc(tr('again')) + '</button><div class="row"><button class="btn" id="fShare">' + esc(tr('share')) + '</button>';
    h += '<button class="btn" id="fHome">' + esc(tr('home')) + '</button></div></div>';
    $('finCard').innerHTML = h;
    const total = run.totalAll || 0, n = $('finN'), t0 = performance.now();
    const roll = () => { const k = Math.min(1, (performance.now() - t0) / 1100); n.firstChild.nodeValue = fmt(Math.round(total * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(roll); else if (run.record || run.rankUp) sfx('record'); };
    RM ? (n.firstChild.nodeValue = fmt(total)) : roll();
    $('fShare').onclick = () => share(shareText(run));
    $('fAgain').onclick = () => { sfx('uiPri'); clearRun(); if (run.mode === 'daily' && !run.practice) { show('sFree'); } else if (run.mode === 'free') newRun({ mode: 'free', seed: K.codeFrom(K.mulberry32(Date.now() >>> 0)), diff: run.diff }); else startDaily(true); };
  }
  $('fHome').onclick = () => { sfx('ui'); clearRun(); goTitle(); };
  drawFinal();
}
function drawFinal() {
  const cv = $('finCv'); if (!cv) return;
  const run = S.run, dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.min(520, ($('finCard').clientWidth || 360) - 40, window.innerHeight * (LAND_SHORT() ? 0.7 : 0.36) / 0.62, LAND_SHORT() ? ($('finCard').clientWidth - 70) / 2 : 9999), H = W * 0.62;
  cv.style.maxWidth = Math.round(W) + 'px';
  cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const eds = [0, 1, 2].map(i => run.res[i] ? { ed: edFor(run, i + 1), r: run.res[i] } : null).filter(Boolean);
  const mw = W * 0.3;
  eds.forEach((e, i) => {
    const n = eds.length, ang = (i - (n - 1) / 2) * 0.18, x = W / 2 + (i - (n - 1) / 2) * mw * 0.62;
    c.save(); c.translate(x, H * 0.08); c.rotate(ang);
    A.mini(c, e.ed, e.r.pos, -mw / 2, 0, mw, { title: L().paper, stamp: e.r.kind === 'gold' ? 'gold' : e.r.kind === 'sold' ? 'sold' : 'rec', stampText: tr(e.r.kind === 'gold' ? 'gold' : e.r.kind === 'sold' ? 'sold_out' : 'recycled') });
    c.restore();
  });
  const old = window.TS; window.TS = H * 0.42; drawAstro(c, W / 2, H * 0.74, 'd', 0, 0, 0.6, performance.now() / 1000, 0); window.TS = old;
}
function shareText(run) {
  const lines = [];
  if (run.mode === 'daily') lines.push(tr('share_l1', { n: K.dailyNumber(run.day) })); else lines.push(tr('share_free', { c: run.seed }));
  lines.push(tr('share_copies', { v: fmt(run.totalAll || 0) }));
  lines.push([0, 1, 2].map(i => { const r = run.res[i]; return 'E' + (i + 1) + ' ' + (r ? '⭐'.repeat(Math.max(0, r.stars)) || '♻️' : '—'); }).join('  '));
  const g = run.res.filter(r => r && r.stars === 3).length;
  lines.push(tr('share_gold', { g }) + (run.mode === 'daily' && S.prog.streak ? ' · ' + tr('share_streak', { s: S.prog.streak }) : ''));
  return lines.join('\n');
}
function share(text, noUrl) {
  const url = 'https://jetgames.fun/portada/', full = text + '\n' + url;
  const fallback = () => {
    const done = () => { sfx('copied'); toast(tr('copied')); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(full).then(done, manual); else manual();
  };
  const manual = () => modal('<div class="top"><h2>' + esc(tr('share')) + '</h2><button class="x" data-c>✕</button></div><p class="note">' + esc(tr('share_fail')) + '</p><textarea class="shtxt" readonly>' + esc(full) + '</textarea><button class="btn pri" data-c>' + esc(tr('close')) + '</button>', c => { c.querySelectorAll('[data-c]').forEach(b => b.onclick = closeModal); const ta = c.querySelector('textarea'); ta.focus(); ta.select(); });
  if (navigator.share) navigator.share({ text, url }).then(() => sfx('copied'), e => { if (!e || e.name !== 'AbortError') fallback(); });
  else fallback();
  void noUrl;
}
function clearRun() { if (S.run) sdel('run-' + S.run.mode); S.run = null; S.ed = null; S.press = null; tutHide(); showGame(false); }

// ───────────── inicio ─────────────
function goTitle() { tutHide(); showGame(false); scene('menu'); show('sTitle'); }
function savedRun(mode) {
  const r = sget('run-' + mode); if (!r) return null;
  const okRun = r && typeof r === 'object' && r.v === VER && typeof r.seed === 'string' && r.seed && Array.isArray(r.res) && r.mode === mode &&
    [1, 2, 3].indexOf(r.k) >= 0 && ['rules', 'play', 'press', 'result', 'final'].indexOf(r.phase) >= 0 && (r.diff in K.DIFF) &&
    r.pos && typeof r.pos === 'object' && !Array.isArray(r.pos) && (r.picks == null || Array.isArray(r.picks));
  if (!okRun) { sdel('run-' + mode); badSave = true; return null; }
  // campos auxiliares: se reponen si faltan, nunca rompen
  if (!Array.isArray(r.picks)) r.picks = []; r.picks = r.picks.filter(p => p && K.RULE[p.id]);
  if (!Array.isArray(r.hist)) r.hist = []; if (!Array.isArray(r.fut)) r.fut = [];
  if (!r.trot || typeof r.trot !== 'object') r.trot = {};
  if (r.offers != null && !(Array.isArray(r.offers) && r.offers.every(id => K.RULE[id]))) r.offers = null;
  for (const k in r.pos) { const q = r.pos[k]; if (!q || typeof q !== 'object' || !Number.isInteger(q.x) || !Number.isInteger(q.y)) delete r.pos[k]; }
  if (r.phase === 'result' && !r.res[r.k - 1]) r.phase = 'play';
  if (mode === 'daily' && r.day !== today()) { sdel('run-' + mode); return null; }
  return r;
}
function dailyDone(day) { const d = sget('daily:' + day); if (!d || typeof d !== 'object' || !Number.isFinite(d.total)) return null; if (!Array.isArray(d.res)) d.res = []; if (!Number.isFinite(d.n)) d.n = K.dailyNumber(day); return d; }
function renderTitle() {
  const P = S.prog, day = today(), n = K.dailyNumber(day), done = dailyDone(day);
  const fr = savedRun('free'), tu = savedRun('tut');
  const res = fr && fr.phase !== 'final' ? fr : null;
  $('bResume').hidden = !res;
  if (res) { $('resT').textContent = tr('resume'); $('resD').textContent = tr('resume_d', { k: res.k, m: tr('mode_free') + ' · ' + tr('diff_' + res.diff) }); }
  const mainT = $('mainT'), mainS = $('mainS');
  if (!P.tut) { mainT.textContent = tr('first_day'); mainS.textContent = tu ? tr('resume_d', { k: tu.k, m: tr('mode_tut') }) : tr('learn_min'); }
  else if (done) { mainT.textContent = tr('daily_done'); mainS.textContent = tr('played_today', { v: fmt(done.total), s: (done.res || []).map(r => r ? '★'.repeat(r.stars) : '—').join(' ') }) + ' · ' + tr('next_in', { h: countdown() }); }
  else { const dr = savedRun('daily'); mainT.textContent = tr('play_daily', { n }); mainS.textContent = dr && !dr.practice && dr.phase !== 'final' ? tr('resume_d', { k: dr.k, m: tr('mode_daily') }) : tr('daily_sub'); }
  // progreso
  const rk = K.rankOf(P.total), nx = K.RANKS[rk + 1], cur = K.RANKS[rk];
  const best = Math.max(P.best.daily || 0, P.best.b || 0, P.best.r || 0, P.best.j || 0);
  $('prog').innerHTML = '<div class="pg"><b>🔥 ' + P.streak + '</b><span>' + esc(tr('streak')) + '</span></div><div class="pg rk"><b>' + esc(L().rank_names[rk]) + '</b><div class="rb"><i style="width:' + (nx ? clamp((P.total - cur) / (nx - cur) * 100, 2, 100) : 100) + '%"></i></div></div><div class="pg"><b>' + fmt(best) + '</b><span>' + esc(tr('record')) + '</span></div>';
  // botón de saltar el tutorial
  let sk = $('skipLnk');
  if (!P.tut) { if (!sk) { sk = document.createElement('button'); sk.id = 'skipLnk'; sk.className = 'lnk'; sk.style.cssText = 'display:block;margin:-4px auto 6px'; $('bMain').after(sk); sk.onclick = () => { S.prog.tut = true; saveProg(); sdel('run-tut'); sfx('ui'); renderTitle(); }; } sk.textContent = tr('skip_tut'); }
  else if (sk) sk.remove();
  $('bFsT').hidden = !fsAvail();
  $('bFsT').querySelector('span').textContent = isFs() ? tr('exit_fullscreen') : tr('fullscreen');
  if (badSave) { badSave = false; setTimeout(() => toast(tr('bad_save'), 3200), 300); }
}
function countdown() { const d = new Date(), t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1), ms = t - d; return tr('countdown', { h: Math.floor(ms / 3600000), m: Math.floor(ms / 60000) % 60 }); }
function startDaily(practice) { const day = today(); newRun({ mode: 'daily', seed: K.dailySeed(day), diff: 'r', day, practice }); }
$('bMain').onclick = () => {
  sfx('uiPri');
  if (!S.prog.tut) { const tu = savedRun('tut'); if (tu) { S.run = tu; goPhase(false); } else newRun({ mode: 'tut', seed: 'TUTOR', diff: 'b' }); return; }
  const day = today(), done = dailyDone(day);
  if (done) {
    const r = done.res || [];
    modal('<div class="top"><h2>' + esc(tr('share_l1', { n: done.n })) + '</h2><button class="x" data-c aria-label="' + esc(tr('close')) + '">✕</button></div><div class="res-n">' + fmt(done.total) + '<small>' + esc(tr('unit')) + '</small></div><div class="fin-eds">' + [0, 1, 2].map(i => '<div>E' + (i + 1) + '<b>' + (r[i] ? fmt(r[i].total) : '—') + '</b><span class="s">' + (r[i] ? '★'.repeat(r[i].stars) : '') + '</span></div>').join('') + '</div><p class="note">' + esc(tr('next_in', { h: countdown() })) + '</p><button class="btn pri" data-s>' + esc(tr('share')) + '</button><button class="btn" data-p>' + esc(tr('daily_practice')) + '</button>',
      c => {
        c.querySelectorAll('[data-c]').forEach(b => b.onclick = closeModal);
        c.querySelector('[data-s]').onclick = () => { const fake = { mode: 'daily', day, totalAll: done.total, res: r, seed: '' }; share(shareText(fake)); };
        c.querySelector('[data-p]').onclick = () => { closeModal(); startDaily(true); };
      });
    return;
  }
  const dr = savedRun('daily');
  if (dr && dr.phase !== 'final') { S.run = dr; goPhase(false); } else startDaily(false);
};
$('bResume').onclick = () => { const r = savedRun('free'); if (r) { sfx('uiPri'); S.run = r; goPhase(false); } };
$('bFree').onclick = () => { sfx('ui'); push('sFree'); };
$('bHow').onclick = () => { sfx('ui'); push('sHelp'); };
$('bArch').onclick = () => { sfx('ui'); push('sArch'); };
$('bSet').onclick = () => { sfx('ui'); push('sSet'); };
$('bFsT').onclick = () => { sfx('ui'); fsToggle(); };
$('bGear').onclick = () => { sfx('ui'); if (S.run && S.run.phase === 'play' && !S.stack.length) { cancelDrag(); AU.duck(true); } push('sSet'); };
$('bPause').onclick = () => { sfx('ui'); pause(); };
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => { sfx('ui'); back(); if (!S.stack.length && S.run && S.run.phase === 'play') AU.duck(false); });
$('bUndo').onclick = undo; $('bRedo').onclick = redo; $('bRot').onclick = rotateSel; $('bPrint').onclick = onPrint;
$('chips').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return; sfx('ui');
  const id = b.dataset.chip;
  if (id === 'theme') toast(tr('theme') + ': ' + L().secs[S.ed.theme] + ' ×' + (S.ctx.rules.doble ? '2' : (LANG === 'es' ? '1,5' : '1.5')), 2600);
  else if (id === 'rules') modal('<div class="top"><h2>' + esc(tr('rules_n', { n: S.run.picks.filter(p => p.ed <= S.run.k).length })) + '</h2><button class="x" data-c>✕</button></div>' + (S.ed.theme ? '<p class="note" style="text-align:left"><b style="color:var(--ink)">' + esc(tr('theme')) + ':</b> ' + esc(L().secs[S.ed.theme]) + ' ×' + (S.ctx.rules.doble ? '2' : (LANG === 'es' ? '1,5' : '1.5')) + '</p>' : '') + rulesSummary() + '<button class="btn pri" data-c style="margin-top:12px">' + esc(tr('close')) + '</button>', c => c.querySelectorAll('[data-c]').forEach(x => x.onclick = closeModal));
  else if (L().rules[id]) toast(L().rules[id][0] + ': ' + L().rules[id][1], 3600);
});
$('bCont').onclick = () => { sfx('uiPri'); resumePlay(); };
$('bRestart').onclick = () => {
  const b = $('bRestart');
  if (!b.classList.contains('armed')) { b.classList.add('danger', 'armed'); b.textContent = tr('restart_sure'); sfx('ui'); clearTimeout(b._t); b._t = setTimeout(() => { b.classList.remove('danger', 'armed'); b.textContent = tr('restart_ed'); }, 4000); return; }
  sfx('undo'); S.run.hist.push(S.run.pos); S.run.pos = {}; S.run.fut = []; S.run.trot = {}; S.trot = S.run.trot; saveRun(true); hideAll(); AU.duck(false); buildEls(); renderAll();
};
$('bHowP').onclick = () => { sfx('ui'); push('sHelp'); };
$('bSetP').onclick = () => { sfx('ui'); push('sSet'); };
$('bHome').onclick = () => { sfx('ui'); saveRun(true); AU.duck(false); S.run = null; S.ed = null; goTitle(); };
$('back').addEventListener('click', e => {
  if (S.run && S.run.phase === 'play' && !$('game').hidden) {
    e.preventDefault(); cancelDrag(); saveRun(true);
    modal('<div class="top"><h2>' + esc(tr('leave_t')) + '</h2></div><p class="note">' + esc(tr('leave')) + '</p><button class="btn pri" data-s>' + esc(tr('stay')) + '</button><button class="btn" data-l>' + esc(tr('leave_yes')) + '</button>', c => {
      c.querySelector('[data-s]').onclick = closeModal; c.querySelector('[data-l]').onclick = () => { saveRun(true); location.href = 'https://jetgames.fun/'; };
    });
  }
});

// ───────────── modo libre ─────────────
function renderFree() {
  const P = S.prog;
  $('diffs').innerHTML = ['b', 'r', 'j'].map(d => '<button class="diff" role="radio" aria-checked="' + (S.freeDiff === d) + '" data-d="' + d + '"><div><b>' + esc(tr('diff_' + d)) + '</b><span>' + esc(tr('diff_' + d + '_d')) + '</span></div><em>' + esc(tr('best')) + '<br>' + fmt(P.best[d] || 0) + '</em></button>').join('');
  $('diffs').querySelectorAll('.diff').forEach(b => b.onclick = () => { S.freeDiff = b.dataset.d; sfx('ui'); renderFree(); });
}
$('code').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6); });
$('bNewRun').onclick = () => {
  sfx('uiPri');
  const code = $('code').value.trim();
  const seed = /^[A-Z]{6}$/.test(code) ? code : K.codeFrom(K.mulberry32((Date.now() ^ (Math.random() * 1e9)) >>> 0));
  sdel('run-free'); newRun({ mode: 'free', seed, diff: S.freeDiff });
};

// ───────────── ajustes ─────────────
function setTog(id, on) { $(id).setAttribute('aria-checked', on ? 'true' : 'false'); }
function renderSettings() {
  setTog('tMusic', S.set.music); setTog('tSfx', S.set.sfx); setTog('tVib', S.set.vib); setTog('tTags', S.set.tags); setTog('tCon', S.set.contrast); setTog('tFs', isFs());
  $('vMusic').value = Math.round(S.set.mv * 100); $('vSfx').value = Math.round(S.set.sv * 100);
  syncLangSegs();
  $('fsRow').hidden = !fsAvail();
  const e = $('bErase'); e.classList.remove('armed'); e.textContent = tr('erase');
}
function togSet(key, id, after) { $(id).onclick = () => { S.set[key] = !S.set[key]; saveSet(); setTog(id, S.set[key]); sfx('ui'); if (after) after(); }; }
togSet('music', 'tMusic', applyAudioPrefs); togSet('sfx', 'tSfx', applyAudioPrefs); togSet('vib', 'tVib', () => { applyAudioPrefs(); vibe(20); });
togSet('tags', 'tTags', () => { if (S.ed) renderTags(); }); togSet('contrast', 'tCon', () => document.body.classList.toggle('contrast', S.set.contrast));
$('vMusic').oninput = e => { S.set.mv = e.target.value / 100; if (!S.set.music) { S.set.music = true; setTog('tMusic', true); } applyAudioPrefs(); saveSet(); };
$('vSfx').oninput = e => { S.set.sv = e.target.value / 100; if (!S.set.sfx) { S.set.sfx = true; setTog('tSfx', true); } applyAudioPrefs(); saveSet(); };
$('vSfx').onchange = () => sfx('pairPos', 3);
document.querySelectorAll('.seg[data-lang]').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; sfx('ui'); setLang(b.dataset.l); }));
$('tFs').onclick = () => { sfx('ui'); fsToggle(); };
$('bErase').onclick = () => {
  const e = $('bErase');
  if (!e.classList.contains('armed')) { e.classList.add('armed'); e.textContent = tr('erase_sure'); sfx('ui'); clearTimeout(e._t); e._t = setTimeout(() => { e.classList.remove('armed'); e.textContent = tr('erase'); }, 4000); return; }
  try { Object.keys(localStorage).filter(k => k.indexOf('jet-portada:') === 0 && k !== 'jet-portada:settings').forEach(k => localStorage.removeItem(k)); } catch (err) { }
  S.prog = JSON.parse(JSON.stringify(DEF_PROG)); S.prog.seen = K.unlockedRules(S.prog); saveProg();
  S.run = null; S.ed = null; showGame(false); toast(tr('erased')); sfx('undo'); goTitle();
};

// ───────────── pantalla completa ─────────────
function fsAvail() { const d = document.documentElement; return !!(d.requestFullscreen || d.webkitRequestFullscreen) && (document.fullscreenEnabled !== false || document.webkitFullscreenEnabled); }
function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function fsToggle() {
  try {
    if (isFs()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else { const d = document.documentElement, f = d.requestFullscreen || d.webkitRequestFullscreen; const p = f.call(d, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => { }); }
  } catch (e) { }
}
let relayT = 0;
function relayout() {
  cancelDrag(); if (S.kb) { S.kb = null; clearPreview(); }
  cancelAnimationFrame(relayT);
  relayT = requestAnimationFrame(() => {
    layout();
    const top = S.stack[S.stack.length - 1];
    if (top === 'sSet') renderSettings(); if (top === 'sTitle') renderTitle(); if (top === 'sRules') drawRulesBg();
    if (top === 'sEd') renderEdResult(); if (top === 'sFinal') drawFinal();
    sizeBg();
  });
}
['resize', 'orientationchange', 'fullscreenchange', 'webkitfullscreenchange'].forEach(ev => window.addEventListener(ev, relayout));
document.addEventListener('fullscreenchange', relayout); document.addEventListener('webkitfullscreenchange', relayout);
if (window.visualViewport) visualViewport.addEventListener('resize', relayout);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelDrag(); saveRun(true); AU.suspend();
    if (S.press) { /* la rotativa termina sola al volver */ }
    else if (S.run && S.run.phase === 'play' && !$('game').hidden && !S.stack.length) pause(true);
  } else { if (S.stack[S.stack.length - 1] !== 'sPause') AU.resume(); }
});
window.addEventListener('pagehide', () => saveRun(true));

// ───────────── tutorial ─────────────
let typeT = 0;
let tutLast = null;
function tutSay(key, extra) {
  const box = $('tut'); box.hidden = false; tutLast = [key, extra];
  const txt = tr(key) + (extra ? ' ' + tr(extra) : '');
  const el = $('tutTxt'); clearInterval(typeT);
  if (RM) el.textContent = txt;
  else { let i = 0; el.textContent = ''; typeT = setInterval(() => { i += 2; el.textContent = txt.slice(0, i); if (i % 6 === 0) sfx('type'); if (i >= txt.length) clearInterval(typeT); }, 26); }
  positionTut(); drawTutAstro();
}
function drawTutAstro() { const cv = $('tutAstro'), c = cv.getContext('2d'); c.clearRect(0, 0, 120, 120); const old = window.TS; window.TS = 66; drawAstro(c, 60, 66, 'd', 0, 0, 0, performance.now() / 1000, 0); window.TS = old; }
function positionTut() {
  const t = $('tut'); if (t.hidden) return;
  const I = insets(), st = t.style;
  const pb = $('paperBox').getBoundingClientRect(), tb = $('trayBox').getBoundingClientRect();
  st.bottom = ''; st.maxHeight = '92px';
  if (S.mode === 'port') { st.left = (10 + I.l) + 'px'; st.right = (10 + I.r) + 'px'; st.top = (pb.bottom + 2) + 'px'; }
  else if (S.mode === 'land') { st.left = tb.left + 'px'; st.right = (window.innerWidth - tb.right) + 'px'; st.top = (tb.top - 94) + 'px'; }
  else { st.left = (pb.left + 10) + 'px'; st.right = (window.innerWidth - pb.right + 10) + 'px'; st.top = (pb.bottom + 2) + 'px'; }
}
function tutHide() { $('tut').hidden = true; clearInterval(typeT); clearHL(); S.tut = null; }
// «Saltar el tutorial» desde el globo: marca el tutorial como hecho y vuelve al inicio con la diaria
$('tutSkip').onclick = () => { if (!S.run || S.run.mode !== 'tut' || S.press) return; sfx('ui'); cancelDrag(); S.prog.tut = true; saveProg(); clearRun(); goTitle(); };
function clearHL() { $('cells').innerHTML = ''; document.querySelectorAll('.ti.tutHL').forEach(e => e.classList.remove('tutHL')); }
function hlCells(x, y, w, h) { const c = S.cell; $('cells').innerHTML = '<div class="hc" style="left:' + x * c + 'px;top:' + y * c + 'px;width:' + w * c + 'px;height:' + h * c + 'px"></div>'; }
function tutStart() {
  if (!S.run || S.run.mode !== 'tut') return;
  const k = S.run.k; S.tut = { k, step: 0 };
  if (k === 1) tutCheck(); else if (k === 2) tutSay('tut_4'); else tutSay('tut_5');
}
function tutCheck() {
  const t = S.tut; if (!t || !S.run || S.run.mode !== 'tut') return;
  clearHL();
  if (t.k === 1) {
    const pos = S.run.pos, tit = pos[0], foto = pos[1];
    if (!tit || tit.y !== 0) { if (t.step !== 1) { t.step = 1; tutSay('tut_1', 'tut_tap'); } hlCells(0, 0, 3, 1); return; }
    const adj = S.sc.adj[1] && S.sc.adj[1].has(0);
    if (!foto || !adj) { if (t.step !== 2) { t.step = 2; tutSay('tut_1b', 'tut_2'); } if (!foto) hlCells(0, 1, 2, 2); return; }
    if (t.step !== 3) { t.step = 3; tutSay('tut_2b', 'tut_3'); }
  } else if (t.k === 2) {
    if (S.sc.holes === 0 && t.step !== 1) { t.step = 1; tutSay('tut_4b'); }
  }
}

// ───────────── cómo jugar ─────────────
let helpRAF = 0, helpI = 0;
function renderHelp() {
  const keys = ['help_1', 'help_2', 'help_3', 'help_4'];
  $('hcar').innerHTML = keys.map((k, i) => '<div class="hc"><canvas data-i="' + i + '"></canvas><div class="n">' + (i + 1) + ' / 4</div><p>' + esc(tr(k)) + '</p></div>').join('');
  $('hdots').innerHTML = keys.map((k, i) => '<button data-i="' + i + '" aria-label="' + (i + 1) + '"></button>').join('');
  $('helpTable').innerHTML = '<table class="ptab">' + L().table_rows.map(r => '<tr><td>' + esc(r[0]) + '</td><td class="' + (r[1][0] === '+' ? 'p' : 'n') + '">' + r[1] + '</td><td>' + esc(r[2]) + '</td></tr>').join('') + '</table>';
  const car = $('hcar');
  const setDot = () => { helpI = Math.round(car.scrollLeft / Math.max(1, car.clientWidth)); $('hdots').querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === helpI)); };
  car.onscroll = setDot; setDot();
  $('hdots').querySelectorAll('button').forEach(b => b.onclick = () => { car.scrollTo({ left: +b.dataset.i * car.clientWidth, behavior: RM ? 'auto' : 'smooth' }); });
  cancelAnimationFrame(helpRAF);
  const loop = () => { if (S.stack[S.stack.length - 1] !== 'sHelp') return; car.querySelectorAll('canvas').forEach(cv => helpDraw(cv, +cv.dataset.i, performance.now() / 1000)); helpRAF = requestAnimationFrame(loop); };
  loop();
}
$('bPractice').onclick = () => { sfx('uiPri'); sdel('run-tut'); S.stack = []; newRun({ mode: 'tut', seed: 'TUTOR', diff: 'b' }); };
function helpDraw(cv, i, t) {
  const r = cv.getBoundingClientRect(); if (!r.width) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = r.width, H = r.height;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  const cs = Math.min(W / 7, H / 5.2), ox = W / 2 - cs * 1.5, oy = H / 2 - cs * 1.6;
  const paper = (C, F) => { c.fillStyle = '#f2ecdf'; A.rr(c, ox - 8, oy - 8, C * cs + 16, F * cs + 16, 6); c.fill(); c.strokeStyle = 'rgba(22,17,31,.18)'; c.setLineDash([3, 3]); for (let y = 0; y < F; y++) for (let x = 0; x < C; x++) c.strokeRect(ox + x * cs + 3, oy + y * cs + 3, cs - 6, cs - 6); c.setLineDash([]); };
  const block = (x, y, w, h, sec, kind) => { c.fillStyle = kind === 'foto' ? '#cfc6b2' : '#fbf7ee'; A.rr(c, x + 2, y + 2, w - 4, h - 4, 3); c.fill(); c.strokeStyle = 'rgba(22,17,31,.25)'; c.stroke(); if (kind === 'foto') { c.fillStyle = 'rgba(22,17,31,.35)'; for (let a = 0; a < 18; a++) { c.beginPath(); c.arc(x + 8 + (a % 6) * (w - 14) / 5, y + 8 + Math.floor(a / 6) * (h - 14) / 2, 2 + (a % 3), 0, 7); c.fill(); } } else { c.fillStyle = A.SEC_COLOR[sec]; c.fillRect(x + 4, y + 4, w - 8, 4); c.fillStyle = 'rgba(22,17,31,.75)'; c.fillRect(x + 6, y + 12, (w - 12) * 0.8, Math.max(3, cs * 0.12)); c.fillStyle = 'rgba(22,17,31,.25)'; for (let l = 0; l < 3 && 22 + l * 9 < h - 6; l++) c.fillRect(x + 6, y + 22 + l * 9, (w - 12) * (0.7 - l * 0.1), 3); } };
  const tag = (x, y, txt, pos) => { c.font = '800 ' + Math.max(10, cs * 0.24) + 'px "JetBrains Mono", monospace'; const w = c.measureText(txt).width + 10; c.fillStyle = pos ? '#0fbf9f' : '#ff4466'; A.rr(c, x - w / 2, y - 9, w, 18, 9); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke(); c.lineWidth = 1; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x, y + 1); };
  const ease = k => k < 0 ? 0 : k > 1 ? 1 : 1 - Math.pow(1 - k, 3);
  const ph = (t % 4) / 4;
  if (i === 0) {
    paper(3, 3); block(ox, oy, cs * 3, cs, 'CIE'); block(ox, oy + cs, cs * 2, cs * 2, 'CIE', 'foto');
    const k = ease(ph * 1.6 - 0.2), sx = W - cs * 1.4, sy = H - cs * 0.5;
    const x = sx + (ox + cs * 2 - sx) * k, y = sy + (oy + cs - sy) * k; block(x, y, cs, cs * 2, 'CUL');
    if (k < 1) { c.fillStyle = '#ff4466'; c.font = '800 13px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.fillText('−2 −2', ox + cs * 2.5, oy + cs * 2.1); }
  } else if (i === 1) {
    paper(3, 3); const a = ph < 0.5;
    block(ox, oy, cs * 2, cs * 2, a ? 'POL' : 'DEP'); block(ox + cs * 2, oy, cs, cs * 2, a ? 'ECO' : 'DEP');
    tag(ox + cs * 2, oy + cs, a ? '+3' : '−3', a);
  } else if (i === 2) {
    paper(3, 3); const k = ease(ph * 2), y = oy + cs * 2 - cs * 2 * k;
    block(ox, oy + cs, cs * 2, cs * 2, 'CIE', 'foto'); block(ox, y, cs * 3, cs, 'CIE');
    if (k >= 1) { c.save(); c.translate(ox + cs * 2.6, oy + cs * 0.2); c.rotate(-0.15); c.fillStyle = '#7700f4'; A.rr(c, -18, -10, 36, 20, 4); c.fill(); c.fillStyle = '#fff'; c.font = '800 12px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('×2', 0, 0); c.restore(); c.save(); c.translate(ox + cs * 2.6, oy + cs * 0.75); c.rotate(-0.1); c.fillStyle = '#0a7d6c'; A.rr(c, -18, -10, 36, 20, 4); c.fill(); c.fillStyle = '#fff'; c.fillText('×2', 0, 0); c.restore(); }
  } else {
    const n = 3, cw = Math.min(W / 4.2, H * 0.55), chh = cw * 1.35;
    for (let j = 0; j < n; j++) { const x = W / 2 + (j - 1) * (cw + 10) - cw / 2, y = H / 2 - chh / 2 - (Math.floor(ph * 3) === j ? 8 : 0); const g = c.createLinearGradient(x, y, x + cw, y + chh); g.addColorStop(0, '#1d1238'); g.addColorStop(1, '#120a26'); c.fillStyle = g; A.rr(c, x, y, cw, chh, 10); c.fill(); c.strokeStyle = Math.floor(ph * 3) === j ? '#00f2cf' : 'rgba(255,255,255,.25)'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#00f2cf'; c.font = '800 ' + cw * 0.22 + 'px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.fillText(['+5', '×3', '+10%'][j], x + cw / 2, y + chh * 0.42); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + cw * 0.2, y + chh * 0.6, cw * 0.6, 4); c.fillRect(x + cw * 0.25, y + chh * 0.7, cw * 0.5, 4); }
  }
}

// ───────────── hemeroteca ─────────────
function renderArchive() {
  let a = sget('archive'); if (!Array.isArray(a)) a = [];
  a = a.filter(e => e && typeof e === 'object' && typeof e.seed === 'string' && [1, 2, 3].indexOf(e.k) >= 0 && (e.diff in K.DIFF) && e.pos && typeof e.pos === 'object' && Number.isFinite(e.total));
  const g = $('archGrid');
  if (!a.length) {
    g.className = ''; g.innerHTML = '<div class="aempty"><canvas id="archAstro" width="280" height="280"></canvas><p class="note">' + esc(tr('archive_empty')) + '</p><button class="btn pri" id="archStart">' + esc(tr('start')) + '</button></div>';
    const c = $('archAstro').getContext('2d'); c.fillStyle = '#f2ecdf'; A.rr(c, 150, 120, 90, 110, 6); c.fill(); c.fillStyle = '#16111f'; c.fillRect(160, 135, 70, 6); const old = window.TS; window.TS = 150; drawAstro(c, 120, 160, 'd', 0, 0, 0.6, 0, 0); window.TS = old;
    $('archStart').onclick = () => { sfx('uiPri'); S.stack = []; $('bMain').click(); };
    return;
  }
  g.className = 'agrid';
  g.innerHTML = a.map((e, i) => '<button class="arch" data-i="' + i + '"><canvas></canvas><span>' + esc(e.mode === 'daily' ? (LANG === 'es' ? 'Nº ' : 'No. ') + e.n : e.n) + ' · E' + e.k + '<br><b>' + fmt(e.total) + '</b> ' + '★'.repeat(e.stars) + '<br>' + esc(e.d) + '</span></button>').join('');
  g.querySelectorAll('.arch').forEach(b => {
    const e = a[+b.dataset.i]; let ed;
    try { ed = K.editionFor({ mode: e.mode, seed: e.seed, diff: e.diff, picks: e.picks }, e.k); } catch (err) { b.remove(); return; }
    const cv = b.querySelector('canvas'); const W = 150, dpr = Math.min(2, window.devicePixelRatio || 1), H = W * ((ed.F + 0.7) / ed.C) + 22;
    cv.width = (W + 12) * dpr; cv.height = (H + 12) * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
    A.mini(c, ed, e.pos, 6, 6, W, { title: L().paper, stamp: e.kind === 'gold' ? 'gold' : e.kind === 'sold' ? 'sold' : 'rec', stampText: tr(e.kind === 'gold' ? 'gold' : e.kind === 'sold' ? 'sold_out' : 'recycled') });
    b.onclick = () => { sfx('ui'); openView(e, ed); };
  });
}
function openView(e, ed) {
  push('sView');
  $('viewT').textContent = (e.mode === 'daily' ? tr('share_l1', { n: e.n }) : tr('share_free', { c: e.n })) + ' · E' + e.k;
  const vp = $('viewPaper'), W = Math.min(innerWidth - 40, 860), H = innerHeight - 220;
  const cell = Math.max(30, Math.floor(Math.min((W - 30) / ed.C, (H - 70) / ed.F)));
  // usa las mismas piezas del juego, en modo lectura
  const keep = { cell: S.cell, ed: S.ed };
  S.cell = cell;
  const m = paperMetrics(cell);
  vp.style.padding = m.pad + 'px';
  vp.innerHTML = '<div style="text-align:center;font-weight:900;font-size:' + clamp(m.mast * 0.5, 15, 42) + 'px;color:#16111f;border-bottom:3px double #16111f;margin-bottom:4px;height:' + m.mast + 'px;display:flex;align-items:center;justify-content:center">' + esc(L().paper) + '</div><div class="vb" style="position:relative;width:' + ed.C * cell + 'px;height:' + ed.F * cell + 'px"></div>';
  const vb = vp.querySelector('.vb');
  const ctx = K.ctxFor(e.picks, e.k), sc = K.score(ed, e.pos, ctx);
  for (const k in e.pos) { const p = ed.pieces[k], q = e.pos[k]; if (!p) continue; const el = pieceEl(p); el.tabIndex = -1; el.style.cursor = 'default'; vb.appendChild(el); sizeEl(el, p, q.r); el.style.left = q.x * cell + 'px'; el.style.top = q.y * cell + 'px'; const pc = sc.pieces[k]; if (pc) { el.classList.toggle('flat', K.dims(p, q.r).w > K.dims(p, q.r).h); el.querySelector('.st').innerHTML = pc.mults.map(mm => '<i class="' + (mm[0] === 'cab' || mm[0] === 'foto' || mm[0] === 'tema' ? mm[0] : 'mx') + '" title="' + esc(L().m[mm[0]] || '') + '">×' + String(mm[1]).replace('.', LANG === 'es' ? ',' : '.') + '</i>').join(''); } }
  S.cell = keep.cell;
  $('bViewShare').onclick = () => share((e.mode === 'daily' ? tr('share_l1', { n: e.n }) : tr('share_free', { c: e.n })) + ' · E' + e.k + '\n' + tr('share_copies', { v: fmt(e.total) }) + ' ' + '⭐'.repeat(e.stars));
}

// ───────────── fondo animado del inicio ─────────────
let bgRAF = 0, bgEd = null, bgT0 = 0;
function sizeBg() { const cv = $('bg'), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
function startBg() {
  if (bgRAF) return; if (!bgEd) { bgEd = K.genEdition('PORTADA', 2, 'r'); bgT0 = performance.now(); }
  sizeBg();
  const keys = Object.keys(bgEd.boss).map(Number).sort((a, b) => bgEd.boss[a].y - bgEd.boss[b].y || bgEd.boss[a].x - bgEd.boss[b].x);
  const loop = () => {
    const cv = $('bg'), c = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    const t = (performance.now() - bgT0) / 1000, per = 0.7, cyc = keys.length * per + 4, ct = RM ? 999 : t % cyc;
    const pw = Math.min(W * (W > 900 ? 0.34 : 0.78), H * 0.62), cx = W > 900 ? W * 0.2 : W / 2, cy = H * 0.5;
    const pos = {}; keys.forEach((k, i) => { if (ct > i * per + 0.35) pos[k] = bgEd.boss[k]; });
    c.save(); c.globalAlpha = W > 900 ? 0.75 : 0.32; c.translate(cx, cy); c.rotate(-0.05);
    const h = A.mini(c, bgEd, pos, -pw / 2, -pw * 0.65, pw, { title: L().paper });
    // pieza que cae
    const i = Math.floor(ct / per); if (i < keys.length && !RM) { const k = keys[i], q = bgEd.boss[k], p = bgEd.pieces[k], d = K.dims(p, q.r), cell = (pw - Math.max(3, pw * 0.04) * 2) / bgEd.C, f = (ct - i * per) / 0.35; if (f < 1) { c.globalAlpha *= f; c.fillStyle = '#fbf7ee'; const pad = Math.max(3, pw * 0.04), mast = Math.max(8, cell * 0.7); c.fillRect(-pw / 2 + pad + q.x * cell, -pw * 0.65 + pad + mast + q.y * cell - (1 - f) * 40, d.w * cell, d.h * cell); } }
    void h; c.restore();
    if (ct > cyc - 0.6 && !RM) { c.fillStyle = 'rgba(5,1,8,' + ((ct - cyc + 0.6) / 0.6 * 0.8) + ')'; c.fillRect(0, 0, W, H); }
    bgRAF = RM ? 0 : requestAnimationFrame(loop);
  };
  loop();
}
function stopBg() { cancelAnimationFrame(bgRAF); bgRAF = 0; }

// ───────────── gancho de pruebas ─────────────
window.PORTADA = {
  get state() { return { run: S.run, ed: S.ed && { k: S.ed.k, C: S.ed.C, F: S.ed.F, theme: S.ed.theme, pieces: S.ed.pieces.map(p => ({ ix: p.ix, t: p.t, w: p.w, h: p.h, sec: p.sec, base: p.base, story: p.story })) }, mode: S.mode, cell: S.cell, J: S.J, goal: S.goal, screen: S.stack[S.stack.length - 1] || null, lang: LANG }; },
  score: () => S.sc, place: (ix, x, y, r) => placeAt(ix, x, y, r || 0), remove: removeToTray, undo, redo, print: () => onPrint(), doPrint,
  pickRule: i => { pickSel = i; if (S.run.offers[i] === 'linea') pickSec = 'CIE'; choose(); },
  newRun: o => newRun(Object.assign({ mode: 'free', seed: 'ABCDEF', diff: 'r' }, o || {})), boss: () => S.ed && S.ed.boss,
  solveGreedy: () => K.greedy(S.ed, S.ctx), solveAnneal: ms => K.anneal(S.ed, S.ctx, ms || 500, 'hook'),
  applyBoss: () => { commit(JSON.parse(JSON.stringify(S.ed.boss))); }, apply: pos => commit(JSON.parse(JSON.stringify(pos))),
  setLang, audio: AU, next: () => { const r = S.run.res[S.run.k - 1]; if (r) nextAfterResult(r); }, introDone, pause, resume: resumePlay, title: goTitle, show, core: K, S
};

// ───────────── arranque ─────────────
function boot() {
  document.body.classList.toggle('contrast', !!S.set.contrast);
  applyLang(); syncLangSegs(); applyAudioPrefs(); layout();
  if (!canStore) setTimeout(() => toast(tr('no_storage'), 3200), 600);
  if (QS.has('demo')) { demo(); return; }
  if (QS.get('seed') && /^[A-Za-z]{6}$/.test(QS.get('seed'))) { sdel('run-free'); newRun({ mode: 'free', seed: QS.get('seed').toUpperCase(), diff: 'r' }); return; }
  goTitle();
}
function demo() {
  // ?demo (cuadro de la tarjeta de la portada): edición 2, piezas grandes y legibles en miniatura; ?demo=3 / ?demo=1 y &dseed= para comparar
  const dk = [1, 2, 3].indexOf(+QS.get('demo')) >= 0 ? +QS.get('demo') : 2, dseed = /^[A-Z]{3,8}$/.test(QS.get('dseed') || '') ? QS.get('dseed') : 'PORTADA';
  S.run = { v: VER, mode: 'free', seed: dseed, diff: 'r', k: dk, phase: 'play', picks: [{ id: 'esquinas', ed: 1 }, { id: 'diversidad', ed: 2 }, { id: 'doble', ed: 3 }].slice(0, dk), pos: {}, hist: [], fut: [], res: [], trot: {}, demo: true };
  loadEdition(); S.run.pos = JSON.parse(JSON.stringify(S.ed.boss));
  showGame(true); hideAll(); S.elsKey = ''; layout();
  const st = $('stamp'); $('press').hidden = false; st.textContent = tr('gold'); st.className = 'gold on';
  document.body.classList.add('demo');
  const d = document.createElement('div'); d.id = 'demoLogo'; d.innerHTML = '<div class="kick">' + esc(tr('kick')) + '</div><div class="logo">JET<i>//</i>Portada</div><p class="sub">' + esc(tr('tagline')) + '</p><div class="chip theme" style="color:#f2c14e;display:inline-flex">★ ' + esc(tr('gold')) + ' · ' + fmt(S.sc.total) + ' ' + esc(tr('unit')) + '</div>'; document.body.appendChild(d);
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { S.elsKey = ''; if (S.ed && !$('game').hidden) layout(); });
boot();
})();
