/* JET//Balizas · orquestación: pantallas, vuelo, controles, selector de balizas, tutorial, resultado, votos, tabla, bitácora, archivo y ajustes. */
(function () {
'use strict';
const G = window.BalGen, Sm = window.BalSim, R = window.BalRender, A = window.BalAudio, I = window.BalI18n, N = window.BalNet;
const t = I.t, $ = id => document.getElementById(id);
const P = 'jet-balizas:';
const reducedMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
const qs = new URLSearchParams(location.search);

/* ---------------- almacenamiento ---------------- */
function ls(k, v) { try { if (v === undefined) { const s = localStorage.getItem(P + k); return s ? JSON.parse(s) : null; } localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { return null; } }
function lsDel(k) { try { localStorage.removeItem(P + k); } catch (e) {} }
const DEF_SET = { mus: 1, musV: 70, sfx: 1, sfxV: 85, vib: 1, ctl: 'thumbs', side: 'right', trails: null, mini: 0, shake: reducedMQ.matches ? 0 : 1, contrast: 0 };
const DEF_PROF = { tut: 0, tutStep: 0, streak: 0, best: 0, lastDay: null, guided: 0, rank: 0, haz: {}, flights: 0 };
const ST = {
  set: Object.assign({}, DEF_SET, ls('ajustes') || {}), prof: Object.assign({}, DEF_PROF, ls('perfil') || {}),
  today: null, day: null, dia: {}, scene: 'home', fl: null, touch: false, fsAPI: !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)
};
function saveSet() { ls('ajustes', ST.set); }
function saveProf() { ls('perfil', ST.prof); }
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function localDate(d) { d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function addDays(f, n) { const [y, m, d] = f.split('-').map(Number); const x = new Date(Date.UTC(y, m - 1, d + n)); return x.getUTCFullYear() + '-' + pad2(x.getUTCMonth() + 1) + '-' + pad2(x.getUTCDate()); }
function gameDate() { return ST.forceDate || localDate(); }
function dayKey(f) { return 'dia:' + f; }
function loadDay(f) { return Object.assign({ off: { status: 'none' }, votes: {}, bestFree: null, sent: 0 }, ls(dayKey(f)) || {}); }
function saveDay(f, d) { ls(dayKey(f), d); }
function cleanOld() { try { const lim = addDays(gameDate(), -9); for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.startsWith(P + 'dia:') && k.slice(P.length + 4) < lim) localStorage.removeItem(k); } } catch (e) {} }
function fmtDate(f, long) { const [y, m, d] = f.split('-').map(Number); return d + ' ' + I.t('months_s')[m - 1] + (long ? ' ' + y : ''); }
function fmtTime(s, tenths) { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return pad2(m) + ':' + (tenths ? (r < 10 ? '0' : '') + r.toFixed(1) : pad2(Math.floor(r))); }
function rankOf(g) { return g >= 1000 ? 4 : g >= 200 ? 3 : g >= 50 ? 2 : g >= 10 ? 1 : 0; }
const RANK_AT = [0, 10, 50, 200, 1000];
function vib(ms) { if (ST.set.vib && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }
function sfx(id, o) { A.sfxPlay(id, o); }

/* ---------------- idioma ---------------- */
// Uno solo para todo jetgames.fun: src/jet-idioma.js (?lang=es|en > cookie jet_lang de .jetgames.fun > navegador).
// Migración única: el idioma que este juego guardaba en sus ajustes pasa a JETIdioma (si el sitio aún no tiene elección) y se deja de usar.
(function migrarIdioma() {
  const viejo = ST.set.lang; if (viejo === undefined) return;
  delete ST.set.lang; saveSet();
  if (!window.JETIdioma || (viejo !== 'es' && viejo !== 'en')) return;
  let hay = /(?:^|;\s*)jet_lang=(es|en)\b/.test(document.cookie); try { hay = hay || !!localStorage.getItem('jet_lang'); } catch (e) {}
  if (!hay && !/[?&]lang=(es|en)\b/.test(location.search)) window.JETIdioma.set(viejo);
})();
I.lang = window.JETIdioma ? window.JETIdioma.get() : I.lang;
function tx(el, key, vars) { el.setAttribute('data-t', key); if (vars) el.setAttribute('data-tv', JSON.stringify(vars)); else el.removeAttribute('data-tv'); el.textContent = t(key, vars); }

/* ---------------- pantallas ---------------- */
const SCREENS = ['home', 'day', 'pause', 'result', 'rate', 'table', 'logs', 'arch', 'help', 'settings'];
let overlayStack = [];
function show(id, keepStack) {
  SCREENS.forEach(s => $(s).classList.toggle('on', s === id)); R.menuPos = null; setTimeout(menuShipPos, 0); setTimeout(syncOffline, 0);
  ST.scene = id === null ? 'flight' : id; document.body.classList.toggle('res', id === 'result' || id === 'rate');
  const inFlight = ST.scene === 'flight' || id === 'pause';
  $('back').classList.toggle('on', !inFlight);
  $('topR').style.display = (ST.scene === 'flight' || id === 'pause') ? 'none' : 'flex';
  $('fsBtn').style.display = ST.fsAPI && (id === 'home') ? '' : 'none';
  if (!keepStack) overlayStack = [];
  const el = id && $(id); if (el) { el.scrollTop = 0; const f = el.querySelector('.btn.pri:not([hidden])') || el.querySelector('.btn:not([hidden]), button:not([hidden])'); if (f && !ST.touch) setTimeout(() => { try { f.focus({ preventScroll: true }); } catch (e) {} }, 30); }
}
function openOver(id) { overlayStack.push(ST.scene); show(id, true); }
function closeOver() { const prev = overlayStack.pop(); if (prev === 'flight' || prev === 'pause') { show('pause'); return; } if (prev) show(prev, true); else goHome(); }
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { sfx('ui_back'); if (b.dataset.close === 'day') goHome(); else closeOver(); }));

/* ---------------- tamaño, pantalla completa, giro ---------------- */
let lastAspect = null;
function vp() { const v = window.visualViewport; return { w: Math.round(v ? v.width : innerWidth), h: Math.round(v ? v.height : innerHeight) }; }
function onResize() {
  const { w, h } = vp(); const flight = !!(ST.fl && !ST.fl.ended);
  R.resize(w, h, flight);
  const asp = w > h ? 'l' : 'p';
  if (ST.fl && !ST.fl.ended && ST.scene === 'flight' && !ST.fl.arriving && lastAspect && asp !== lastAspect) pauseFlight('rotate');
  lastAspect = asp; releaseStick(); layoutControls(); menuShipPos();
  if (ST.sel) positionSelector();
}
['resize', 'orientationchange'].forEach(e => window.addEventListener(e, () => { onResize(); setTimeout(onResize, 250); }));
if (window.visualViewport) visualViewport.addEventListener('resize', onResize);
function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function toggleFs() {
  try { if (isFs()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } else { const el = document.documentElement; const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } } catch (e) {}
}
['fullscreenchange', 'webkitfullscreenchange'].forEach(e => document.addEventListener(e, () => {
  setTimeout(onResize, 60); syncFsUI();
  if (!isFs() && ST.fl && !ST.fl.ended && ST.scene === 'flight') pauseFlight('fs');
}));
function syncFsUI() { $('fsTog').classList.toggle('on', isFs()); $('fsTog').setAttribute('aria-checked', isFs()); $('fsHome').textContent = t(isFs() ? 'exit_fullscreen' : 'fullscreen'); $('fsBtn').setAttribute('aria-label', t(isFs() ? 'exit_fullscreen' : 'fullscreen')); }
$('fsBtn').addEventListener('click', () => { sfx('ui_tap'); toggleFs(); });
$('fsHome').addEventListener('click', () => { sfx('ui_tap'); toggleFs(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (ST.fl && !ST.fl.ended && ST.scene === 'flight') pauseFlight('hidden'); saveFlight(); A.suspend(); A.loopsOff(); }
  else if (A.ac) A.resume();
});
window.addEventListener('pagehide', () => saveFlight());

/* ---------------- audio: arranca tras el primer gesto ---------------- */
function audioGesture() {
  if (!A.ac) { if (!A.init()) { $('noAudio').hidden = false; ['musTog', 'sfxTog'].forEach(i => $(i).disabled = true); ['musVol', 'sfxVol'].forEach(i => $(i).disabled = true); return; } applyAudio(); A.play(ST.scene === 'flight' ? 'juego' : 'faro'); }
  else A.resume();
}
['pointerdown', 'keydown', 'touchend'].forEach(e => window.addEventListener(e, audioGesture, { capture: true, passive: true }));
function applyAudio() { A.musOn = !!ST.set.mus; A.sfxOn = !!ST.set.sfx; A.mus = ST.set.musV / 100; A.sfx = ST.set.sfxV / 100; A.apply(); }

/* ---------------- red ---------------- */
N.loadQueue();
const PLAYER = N.id();
if (qs.has('offline')) N.base = null;
N.onstatus = v => syncOffline();
N.onflushed = (q, r, e) => {
  if (q.accion === 'vuelo' && q.body) { const d = loadDay(q.body.fecha); if (r) { d.sent = 1; d.serverRes = r; } else if (e && e.code === 'closed') { d.closedLate = 1; } saveDay(q.body.fecha, d); }
};
function syncOffline() { const off = !N.online || !N.base; const el = $('offline'); el.hidden = !(off && (ST.scene === 'home' || ST.scene === 'day')); el.textContent = t('offline'); $('dcBadge').hidden = !off; $('dcBadge').textContent = t('offline_badge'); $('dcBadge').className = 'badge warn'; }
async function fetchDia(f, quiet) {
  try { const r = await N.getRetry('dia', { fecha: f, jugador: PLAYER }); ST.dia[f] = r; ST.diaAt = Date.now();
    if (r.guiados_total != null) { const old = ST.prof.rank; ST.prof.guided = r.guiados_total; ST.prof.rank = rankOf(r.guiados_total); saveProf(); if (ST.prof.rank > old && !quiet) { sfx('rank_up'); toast(t('rank_up', { r: t('ranks')[ST.prof.rank] }), 'good', 2500); } }
    if (ST.fl && !ST.fl.ended && ST.fl.fecha === f && ST.fl.mode !== 'tutorial') { const fl = ST.fl, keep = {}; fl.beacons.forEach(b => { if (b.unfold != null) keep[b.id] = b.unfold; }); fl.beacons = visibleBeacons(fl); fl.beacons.forEach(b => { if (keep[b.id] != null) b.unfold = keep[b.id]; }); Sm.setBeacons(fl.S, fl.beacons.filter(b => !b.mine)); if (!fl.trails.some(x => !x.practice)) fl.trails = buildTrails(fl); }
    if (r.ya_volo && f === gameDate()) { const d = loadDay(f); if (d.off.status === 'none') { d.off.status = 'done'; d.off.remote = 1; saveDay(f, d); } }
    N.flush(); return r;
  } catch (e) { syncOffline(); return null; }
}

/* ---------------- INICIO ---------------- */
function goHome() {
  endFlightView(); ST.today = gameDate(); ST.day = loadDay(ST.today); show('home'); renderHome(); A.play('faro'); syncOffline();
  fetchDia(ST.today, true).then(() => { if (ST.scene === 'home') renderHome(); }).then(() => fetchDia(addDays(ST.today, -1), true)).then(() => { if (ST.scene === 'home') renderHome(); });
}
function renderHome() {
  const f = ST.today, d = ST.day = loadDay(f), di = G.dayIndex(f), r = ST.dia[f];
  $('homeKick').textContent = t('weekdays')[di] + ' · ' + t('days')[di];
  $('dcDate').textContent = t('day_card', { date: fmtDate(f) });
  $('dcStats').textContent = r ? dayStats(r.jugadores, r.balizas_total) : t('day_stats', { n: '–', b: '–' });
  // racha visible: si el último día jugado no fue hoy ni ayer, vuelve a 0
  const p = ST.prof; if (p.lastDay && p.lastDay !== f && p.lastDay !== addDays(f, -1)) { p.streak = 0; saveProf(); }
  $('streakN').textContent = p.streak; $('chipStreak').title = t('best_streak') + ': ' + p.best;
  const rk = p.rank; $('rankName').textContent = t('ranks')[rk]; ringStyle($('rankRing'), rk);
  const mb = $('mainBtn'); let main, sub = '';
  if (d.off.status === 'running') { main = 'continue_run'; sub = t('elapsed', { t: fmtTime((d.off.save && d.off.save.t || 0) + (d.off.save && d.off.save.pen || 0)) }); }
  else if (!p.tut) main = 'learn';
  else if (d.off.status === 'none') main = 'play_today';
  else main = 'free_flight';
  $('mainTxt').textContent = t(main); $('mainSub').textContent = sub; $('mainSub').hidden = !sub; mb.dataset.act = main;
  // resultado de hoy y guiados
  const mine = $('dcMine'), gd = $('dcGuided');
  if (d.off.status === 'done' || d.off.status === 'abandoned') {
    const res = d.off.result || {}; const srv = (r && r.vuelo) || d.serverRes || null;
    const pts = srv && srv.total != null ? srv.total : (res.flight != null ? res.flight : (srv ? srv.puntos_vuelo : null));
    const pos = r && r.puesto ? t('rank_pos', { p: r.puesto, n: r.jugadores }) : '';
    if (pts != null) { mine.hidden = false; mine.textContent = t('your_today', { pts: fmtNum(pts), pos }).replace(/ · $/, ''); } else mine.hidden = true;
  } else mine.hidden = true;
  const g = r && r.guia ? r.guia.guiados : null;
  const ry = ST.dia[addDays(f, -1)], gy = ry && ry.guia ? ry.guia.guiados : 0;
  if (g != null && (d.off.status === 'done' || d.off.status === 'abandoned') && g > 0) { gd.hidden = false; odometer($('dcOdo'), g); $('dcGuidedTxt').textContent = t(g === 1 ? 'guided_by1' : 'guided_by'); }
  else if (gy > 0) { gd.hidden = false; odometer($('dcOdo'), gy); $('dcGuidedTxt').textContent = t(gy === 1 ? 'guided_yest1' : 'guided_yest'); }
  else gd.hidden = true;
  tickNext(); requestAnimationFrame(menuShipPos);
}
function menuShipPos() {
  // zonas de interfaz que las balizas decorativas del fondo no deben tapar
  try { const sc = document.querySelector('.scr.on'); const els = sc ? [...sc.querySelectorAll('.home-l > *, .home-r > *, .foot > *, .card')] : []; els.push($('back'), $('topR'));
    R.menuAvoid = els.filter(e => e && e.getClientRects().length && getComputedStyle(e).display !== 'none').map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }).filter(q => q[2] > q[0]); } catch (e) { R.menuAvoid = []; }
  const { w, h } = vp(), u = Math.min(w, h) / 10; let best = { x: w / 2, y: h / 2, s: 0 };
  const el = ST.scene === 'home' ? document.querySelector('.home-grid') : null;
  if (!el) { R.menuPos = { x: w / 2, y: h * 0.5, s: 1.1 }; return; }
  const r = el.getBoundingClientRect(), top = r.top - 60, bot = h - r.bottom;
  const need = u * 2.2;
  if (bot >= need && bot >= top) best = { x: w / 2, y: r.bottom + bot * 0.44, s: Math.min(1.2, bot / need * 0.8) };
  else if (top >= need) best = { x: w / 2, y: 60 + top / 2, s: Math.min(1, top / (u * 2.8)) };
  else if (w > h) { const sideL = r.left, sideR = w - r.right; if (Math.max(sideL, sideR) > u * 2) best = { x: sideR > sideL ? r.right + sideR / 2 : sideL / 2, y: h * 0.55, s: 1 }; }
  R.menuPos = best;
}
function plural(n, k) { const w = t(k); return n + ' ' + w[n === 1 ? 0 : 1]; }
function dayStats(n, b) { return plural(n, 'u_astro') + ' · ' + plural(b, 'u_beacon'); }
function fmtNum(n) { return Math.round(n).toLocaleString(I.lang === 'es' ? 'es-ES' : 'en-US'); }
function ringStyle(el, rk) { if (rk === 4) { el.style.borderColor = 'transparent'; el.style.background = 'linear-gradient(#0a0418,#0a0418) padding-box,linear-gradient(135deg,#7700f4,#00f2cf) border-box'; } else { el.style.background = ''; el.style.borderColor = R.RANKCOL[rk]; } }
function odometer(el, n) { // cifras que ruedan, con tics suaves (máx. 20)
  const from = +el.dataset.v || 0; if (from === n) { el.textContent = n; return; } el.dataset.v = n; const t0 = performance.now(), dur = reducedMQ.matches ? 1 : 1200; let lastTick = from;
  (function step(now) { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = Math.round(from + (n - from) * e); el.textContent = v; if (v !== lastTick && v - from <= 20) { sfx('guided_tick'); lastTick = v; } if (k < 1) requestAnimationFrame(step); })(t0);
}
let nextTimer = null;
function tickNext() {
  clearTimeout(nextTimer); const now = new Date(), mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), s = Math.max(0, Math.floor((mid - now) / 1000));
  $('nextField').textContent = t('next_field', { hms: pad2(Math.floor(s / 3600)) + ':' + pad2(Math.floor(s / 60) % 60) + ':' + pad2(s % 60) });
  if (ST.scene === 'home' && localDate() !== ST.today && !ST.forceDate) { goHome(); return; }
  if (ST.scene === 'home') nextTimer = setTimeout(tickNext, 1000);
}
$('mainBtn').addEventListener('click', () => {
  sfx('ui_tap'); const a = $('mainBtn').dataset.act;
  if (a === 'learn') startTutorial();
  else if (a === 'continue_run') openDay('oficial', ST.today, true);
  else if (a === 'play_today') openDay('oficial', ST.today);
  else openDay('libre', ST.today);
});
$('howBtn').addEventListener('click', () => { sfx('ui_tap'); openHelp(); });
$('tableBtn').addEventListener('click', () => { sfx('ui_tap'); openTable(); });
$('logBtn').addEventListener('click', () => { sfx('ui_tap'); openLog(); });
$('archBtn').addEventListener('click', () => { sfx('ui_tap'); openArchive(); });
$('gearBtn').addEventListener('click', () => { sfx('ui_tap'); openSettings(); });

/* ---------------- campo y balizas visibles ---------------- */
const fieldCache = {};
function field(f) { if (f === 'tutorial') return G.tutorialField(); if (!fieldCache[f]) fieldCache[f] = G.generate(f); return fieldCache[f]; }
function visibleBeacons(fl) {
  const f = fl.f, r = fl.mode === 'tutorial' ? null : ST.dia[fl.fecha], list = [];
  if (fl.mode === 'tutorial') { f.practice.forEach((p, i) => list.push(Object.assign({ id: 't' + i, practice: !p.trap, rank: null }, p))); return list; }
  const real = r && r.balizas ? r.balizas.map(b => ({ id: b.id, x: b.x, y: b.y, s: b.s, d: b.d, rank: b.r, u: b.u, e: b.e, votes: 1 })) : [];
  real.forEach(b => list.push(b));
  // práctica: se apaga sola en cada bloque de 10 × 10 donde ya hay 2 balizas reales
  const blk = {}; real.forEach(b => { const k = Math.floor(b.x / 10) + ',' + Math.floor(b.y / 10); blk[k] = (blk[k] || 0) + 1; });
  f.practice.forEach((p, i) => { const k = Math.floor(p.x / 10) + ',' + Math.floor(p.y / 10); if ((blk[k] || 0) >= 2) return; list.push({ id: 'p' + i, x: p.x, y: p.y, s: p.s, d: p.d, practice: 1, rank: null }); });
  // tus balizas publicadas (vuelos libres): se ven, marcadas como tuyas
  if (fl.mode !== 'oficial' && r && r.mias) r.mias.forEach(b => list.push({ id: 'm' + b.id, sid: b.id, x: b.x, y: b.y, s: b.s, d: b.d, mine: 1, rank: ST.prof.rank }));
  return list;
}
function practiceCount(fl) { return visibleBeacons(fl).filter(b => b.practice).length; }

/* ---------------- ANTES DEL VUELO ---------------- */
function openDay(mode, fecha, resume, intro) {
  const f = field(fecha); if (!f) return;
  ST.pending = { mode, fecha, resume, intro }; paintDay(mode, fecha, resume, intro);
  show('day'); syncOffline();
  if (mode !== 'tutorial') fetchDia(fecha).then(rr => { if (ST.scene === 'day' && ST.pending && ST.pending.fecha === fecha && rr) { const n = rr.balizas ? rr.balizas.length : 0; $('dayFacts').firstChild.lastChild.innerHTML = '<b>' + t('beacons_avail') + '</b> · ' + t('beacons_avail_n', { n }); $('dayPractice').hidden = !(mode !== 'archivo' && n < 10); } });
}
function paintDay(mode, fecha, resume, intro) {
  const f = field(fecha); if (!f) return; const di = f.day;
  { const h = $('dayTitle'); h.textContent = mode === 'archivo' ? t('archive_flight', { d: fmtDate(fecha) }) : t('weekdays')[di]; const sm = document.createElement('small'); sm.textContent = t('days')[di]; h.appendChild(sm); }
  $('dayMode').textContent = t(mode === 'oficial' ? 'official' : mode === 'libre' ? 'free' : 'archive');
  const hz = $('hzChips'); hz.innerHTML = ''; [['hz_drift', f.drifts.length, '#b5a8d8'], ['hz_mines', f.mines.length, '#ff4466'], ['hz_wells', f.wells.length, '#a35cff'], ['hz_ion', f.ions.length, '#d9c2ff'], ['hz_cur', f.currents.length, '#78c8ff'], ['hz_cracks', f.shortcuts.some(s => s.fragile) ? 1 : 0, '#00f2cf']].forEach(h => { if (!h[1]) return; const s = document.createElement('span'); s.innerHTML = '<i style="background:' + h[2] + '"></i>' + t(h[0]); hz.appendChild(s); });
  const r = ST.dia[fecha];
  const facts = $('dayFacts'); facts.innerHTML = '';
  const fi = (svg, html) => { const li = document.createElement('li'); li.innerHTML = '<span class="fi">' + svg + '</span><span>' + html + '</span>'; facts.appendChild(li); };
  const nReal = r && r.balizas ? r.balizas.length : 0;
  fi(R.glyphSVG('flecha', 1), '<b>' + t('beacons_avail') + '</b> · ' + t('beacons_avail_n', { n: nReal }));
  if (mode === 'oficial') fi(R.glyphSVG('peligro', 0), t('your_beacons'));
  else fi(R.glyphSVG('tesoro', 0), mode === 'libre' ? t('free_note') : t('archive_note'));
  if (resume) fi(R.glyphSVG('atajo', 2), t('continue_run'));
  $('dayPractice').hidden = !(mode !== 'archivo' && nReal < 10);
  // estelas: apagadas en el primer vuelo, encendidas después (salvo que el jugador elija)
  const tr = ST.set.trails == null ? ST.prof.flights > 0 : !!ST.set.trails; setTog($('trailTog'), tr);
  // peligro nuevo de la semana (una vez por tipo)
  const nh = newHazard(f); $('dayHaz').hidden = !nh; if (nh) { $('hazTxt').textContent = t('new_hazard_' + nh); animHaz(nh); }
  $('dayKeys').hidden = ST.touch;
  $('takeoffBtn').textContent = resume ? t('continue_run') : intro ? t('play_today') : t('takeoff');
  $('dayIntro').hidden = !intro; if (intro) $('dayIntro').textContent = t('tut_6');
}
function newHazard(f) { const order = ['mines', 'wells', 'ion', 'cur', 'cracks'], has = { mines: f.mines.length, wells: f.wells.length, ion: f.ions.length, cur: f.currents.length, cracks: f.shortcuts.some(s => s.fragile) }; for (const k of order) if (has[k] && !ST.prof.haz[k]) return k; return null; }
let hazRaf = 0;
function animHaz(kind) {
  cancelAnimationFrame(hazRaf); const cv = $('hazCv'), c = cv.getContext('2d'), t0 = performance.now(); const dpr = Math.min(2, devicePixelRatio || 1); cv.width = 320 * dpr; cv.height = 120 * dpr;
  (function fr(now) {
    const s = ((now - t0) / 1000) % 2.4; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#0a0418'; c.fillRect(0, 0, 320, 120);
    const sx = 40 + s * 70, sy = 60;
    if (kind === 'mines') { const arm = s > 1.1; c.fillStyle = arm && Math.sin(s * 40) > 0 ? '#ff4466' : '#5a2340'; c.beginPath(); c.arc(200, 60, 10, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,68,102,.4)'; c.beginPath(); c.arc(200, 60, 44, 0, 7); c.stroke(); }
    if (kind === 'wells') { for (let i = 0; i < 30; i++) { const r = ((i * 0.37 + s * 0.4) % 1) * 46, a = i * 2.4 + s * 3; c.fillStyle = 'rgba(200,170,255,.8)'; c.fillRect(200 + Math.cos(a) * r, 60 + Math.sin(a) * r, 2, 2); } }
    if (kind === 'ion') { const g = c.createRadialGradient(200, 60, 0, 200, 60, 60); g.addColorStop(0, 'rgba(150,60,255,.5)'); g.addColorStop(1, 'rgba(150,60,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 320, 120); }
    if (kind === 'cur') { c.strokeStyle = 'rgba(120,200,255,.7)'; for (let i = 0; i < 12; i++) { const x = (i * 37 + s * 90) % 320, y = 30 + (i * 23) % 60; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 14, y); c.stroke(); } }
    if (kind === 'cracks') { c.fillStyle = '#170b2c'; c.fillRect(190, 20, 22, 80); c.strokeStyle = s > 1.4 ? 'rgba(0,242,207,.2)' : '#00f2cf'; c.beginPath(); c.moveTo(195, 30); c.lineTo(205, 50); c.lineTo(196, 70); c.lineTo(207, 90); c.stroke(); if (s > 1.4) { c.fillStyle = '#0a0418'; c.fillRect(190, 45, 22, 30); } }
    R.drawShip(c, Math.min(sx, kind === 'cracks' && s < 1.4 ? 170 : 400), sy + (kind === 'wells' ? Math.sin(s * 2) * 8 : 0), 0, 26, 0.6, 0, s, 1);
    if (ST.scene === 'day' && !$('dayHaz').hidden) hazRaf = requestAnimationFrame(fr);
  })(t0);
}
$('trailTog').addEventListener('click', () => { const v = !$('trailTog').classList.contains('on'); setTog($('trailTog'), v); ST.set.trails = v ? 1 : 0; saveSet(); setTog($('trailSet'), v); sfx('ui_toggle'); });
$('takeoffBtn').addEventListener('click', () => { sfx('ui_tap'); const p = ST.pending; if (p) { const nh = newHazard(field(p.fecha)); if (nh && p.mode !== 'tutorial') { ST.prof.haz[nh] = 1; saveProf(); } startFlight(p.mode, p.fecha, p.resume); } });

/* ---------------- VUELO ---------------- */
function startFlight(mode, fecha, resume) {
  const f = field(fecha); const d = mode === 'oficial' ? loadDay(fecha) : null;
  let S;
  if (mode === 'oficial' && resume && d.off.save) { try { S = Sm.restore(f, d.off.save); } catch (e) { S = null; } }
  if (!S) S = Sm.create(f, { mode: mode === 'tutorial' ? 'tutorial' : mode });
  const fl = ST.fl = { mode, fecha, f, S, paused: false, ended: false, count: 0, waves: [], tut: mode === 'tutorial' ? { step: Math.max(1, ST.prof.tutStep || 1), moved: 0, sub: 0 } : null, lastSave: 0, unfold: {}, radarSeen: {}, hullBeep: 0, rockCd: {}, fast: 0, t0: performance.now() };
  fl.beacons = visibleBeacons(fl); Sm.setBeacons(S, fl.beacons.filter(b => !b.mine));
  fl.trails = buildTrails(fl);
  if (mode === 'oficial' && !resume) {
    d.off = { status: 'running', save: null, t0: Date.now() }; saveDay(fecha, d);
    N.send('despegue', { fecha, jugador: PLAYER }, 'despegue:' + fecha).catch(() => {});
  }
  R.setField(S.f, S.ct); R.reveal = 0; R.zoomOut = 0; R.parts.length = 0;
  R.opts.contrast = ST.set.contrast; R.opts.shake = ST.set.shake; R.opts.reduced = reducedMQ.matches;
  $('hud').hidden = false; show(null); onResize(); layoutControls(); updateHud(true);
  $('mini').hidden = !ST.set.mini; $('hBeacWrap').hidden = $('beaconBtn').hidden = mode === 'archivo' || mode === 'libre';
  $('ghost').hidden = !(ST.touch && ST.prof.flights < 3 && mode !== 'archivo'); fl.ghost = !$('ghost').hidden; $('ghost').querySelector('span').hidden = mode === 'tutorial';
  A.play('juego'); A.final2 = 0;
  if (fl.tut) tutStep(fl.tut.step, true);
  countdown(resume ? 1.5 : 1.5);
}
function buildTrails(fl) {
  if (fl.mode === 'tutorial') return [];
  const on = ST.set.trails == null ? ST.prof.flights > 0 : !!ST.set.trails; if (!on) return [];
  const r = ST.dia[fl.fecha], out = [];
  if (r && r.estelas) r.estelas.slice(0, 3).forEach(e => { const pts = decodeRoute(e); if (pts && pts.length > 2) out.push({ pts: pts.map(p => [p[0] / 4, p[1] / 4]) }); });
  if (out.length < 3 && fl.f.trail.length) out.push({ pts: fl.f.trail, practice: 1 });
  return out;
}
function countdown(dur) {
  const fl = ST.fl; fl.count = dur; fl.countN = -1; $('count').hidden = false;
}
function endFlightView() { if (ST.fl) { ST.fl.ended = true; } $('beaconBtn').classList.remove('hint'); $('hud').hidden = true; closeSelector(true); A.loopsOff(); A.duck(0); R.reveal = 0; R.zoomOut = 0; $('cv').style.filter = ''; }
function pauseFlight(why) {
  const fl = ST.fl; if (!fl || fl.ended || fl.arriving || ST.scene !== 'flight') return;
  fl.paused = true; releaseStick(); closeSelector(true); A.loopsOff(); A.duck(1); saveFlight();
  $('restartBtn').hidden = !(fl.mode === 'libre' || fl.mode === 'archivo');
  const ab = $('abandonBtn'); ab.classList.remove('arm'); ab.hidden = fl.mode === 'tutorial' && fl.tut.step < 2;
  paintPause(fl);
  show('pause'); sfx('ui_back');
}
function paintPause(fl) {
  const ab = $('abandonBtn'); ab.textContent = fl.mode === 'tutorial' ? t('tut_skip') : t(ab.classList.contains('arm') ? 'abandon_confirm' : 'abandon');
  $('pauseInfo').textContent = (fl.mode === 'oficial' ? t('official') : fl.mode === 'libre' ? t('free') : fl.mode === 'tutorial' ? t('tut_title') : t('archive_flight', { d: fmtDate(fl.fecha) })) + ' · ' + fmtTime(fl.S.t + fl.S.pen, true);
}
function resumeFlight() { const fl = ST.fl; if (!fl) return; show(null); fl.paused = false; A.duck(0); A.resume(); countdown(1.5); sfx('ui_tap'); onResize(); }
$('pauseBtn').addEventListener('click', () => pauseFlight('btn'));
$('resumeBtn').addEventListener('click', resumeFlight);
$('restartBtn').addEventListener('click', () => { const fl = ST.fl; if (!fl) return; sfx('ui_tap'); startFlight(fl.mode, fl.fecha, false); });
$('pHow').addEventListener('click', () => { sfx('ui_tap'); openHelp(true); });
$('pSet').addEventListener('click', () => { sfx('ui_tap'); openSettings(true); });
let abTimer = 0;
$('abandonBtn').addEventListener('click', () => {
  const b = $('abandonBtn'), fl = ST.fl; if (!fl) return;
  if (fl.mode === 'tutorial') { finishTutorial(true); return; }
  if (!b.classList.contains('arm')) { b.classList.add('arm'); b.textContent = t('abandon_confirm'); sfx('ui_error'); clearTimeout(abTimer); abTimer = setTimeout(() => { b.classList.remove('arm'); b.textContent = t('abandon'); }, 3000); return; }
  clearTimeout(abTimer); b.classList.remove('arm'); abandonFlight();
});
function saveFlight() {
  const fl = ST.fl; if (!fl || fl.ended) return;
  if (fl.mode === 'oficial') { const d = loadDay(fl.fecha); if (d.off.status === 'running') { d.off.save = Sm.serialize(fl.S); saveDay(fl.fecha, d); } }
  if (fl.mode === 'tutorial') { ST.prof.tutStep = fl.tut.step; saveProf(); }
}

/* ---------------- bucle principal ---------------- */
let last = performance.now(), acc = 0, tclock = 0;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = (now - last) / 1000; last = now; if (dt > 0.25) dt = 0.25; if (dt < 0) dt = 0; tclock += dt;
  const fl = ST.fl;
  if (fl && !fl.ended) {
    pollGamepad(dt);
    const inp = readInput(dt);
    const running = !fl.paused && ST.scene === 'flight' && fl.count <= 0 && !document.hidden;
    if (fl.count > 0 && !fl.paused && ST.scene === 'flight') {
      fl.count -= dt; const n = Math.ceil(fl.count / 0.5);
      if (n !== fl.countN) { fl.countN = n; const el = $('count'); if (n > 0) { el.textContent = n; el.className = 'count'; sfx('countdown', { last: false }); } else { el.textContent = t('countdown_go'); el.className = 'count go'; sfx('countdown', { last: true }); setTimeout(() => { el.hidden = true; }, 380); } }
    }
    if (running) {
      acc += dt; let n = 0;
      while (acc >= Sm.DT && n < 40) { Sm.step(fl.S, inp); acc -= Sm.DT; n++; if (fl.S.done) break; }
      handleEvents(fl, dt);
      if (fl.S.rescue && fl.S.rescue.moved) { const n = Math.ceil((2.7 - fl.S.rescue.t) / 0.5); if (n !== fl.rescCount && n > 0) { fl.rescCount = n; const el = $('count'); el.textContent = n; el.className = 'count'; el.hidden = false; sfx('countdown', { last: false }); } }
      if (fl.tut) tutTick(fl);
      if (!fl.S.done && performance.now() - fl.lastSave > 2000) { fl.lastSave = performance.now(); saveFlight(); }
      if (fl.S.done && !fl.arriving) arrive();
    } else acc = 0;
    if (fl.arriving) { fl.arrT += dt; R.reveal = Math.min(1, fl.arrT / 2); R.zoomOut = Math.min(1, fl.arrT / 1.6) * 0.55; }
    // olas que despejan la niebla
    fl.waves.forEach(w => w.age += dt); fl.waves = fl.waves.filter(w => w.age < 1);
    // despliegue de balizas vistas
    for (const b of fl.beacons) { if (fl.unfold[b.id] != null && fl.unfold[b.id] < 1) { const k = fl.unfold[b.id] = Math.min(1, fl.unfold[b.id] + dt * 2.5), c1 = 1.70158, c3 = c1 + 1, e = 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); b.unfold = reducedMQ.matches ? 1 : 0.6 + 0.4 * e; } }
    const view = { beacons: fl.beacons.concat(fl.S.placed.map((b, i) => Object.assign({ id: 'own' + i, mine: 1, rank: ST.prof.rank }, b))), trails: fl.trails, thrust: fl.S.thrust * (running ? 1 : 0), clearWaves: fl.waves, practiceLabel: t('practice'), mineLabel: t('yours'), reduced: reducedMQ.matches };
    R.frame(fl.S, view, tclock, running ? dt : 0);
    if (running || fl.arriving) updateHud(); audioFlight(fl, running);
    if (ST.set.mini && !$('mini').hidden && Math.floor(tclock * 4) !== fl.miniT) { fl.miniT = Math.floor(tclock * 4); drawMini(fl); }
    if (ST.mapHeld) drawBigMap(fl);
  } else {
    if (ST.scene !== 'flight' && !(fl && fl.ended && (ST.scene === 'result' || ST.scene === 'rate'))) R.menu(tclock, dt);
    else if (fl) { const view = { beacons: fl.beacons, trails: [], thrust: 0, clearWaves: [], reduced: true }; R.reveal = 1; R.frame(fl.S, view, tclock, 0); }
  }
}

/* ---------------- eventos de la simulación ---------------- */
function panOf(x) { const S = ST.fl.S; return Math.max(-0.7, Math.min(0.7, (x - S.x) / 6)); }
function handleEvents(fl, dt) {
  const S = fl.S, evs = S.ev.splice(0);
  for (const e of evs) {
    switch (e.k) {
      case 'hit': { const amp = Math.min(8, 3 + e.n * 0.25); R.addShake(amp); R.addFlash(0.15 + e.n / 40); R.burst(e.x, e.y, 10 + e.n, '#ffb020', 3, 0.5, 0.06); vib(Math.min(60, 25 + e.n)); if (e.kind !== 'mine') sfx('hit', { pan: panOf(e.x), v: Math.min(1, 0.4 + e.n / 30) }); break; }
      case 'scrape': R.burst(e.x, e.y, 3, '#00f2cf', 1.6, 0.25, 0.04); sfx('scrape', { pan: panOf(e.x), v: Math.min(1, e.v / 2.2) }); break;
      case 'boom': R.burst(e.x, e.y, 40, '#ff4466', 6, 0.7, 0.1); R.burst(e.x, e.y, 20, '#ffb020', 4, 0.9, 0.07); R.addShake(8); sfx('mine_boom', { pan: panOf(e.x) }); break;
      case 'arm': sfx('mine_arm', { pan: panOf(fl.f.mines[e.i][0]) }); break;
      case 'rescue': $('cv').style.transition = 'filter .4s'; $('cv').style.filter = reducedMQ.matches ? '' : 'grayscale(.85) brightness(.8)'; sfx('rescue'); toast(t('rescue'), 'bad', 2600); vib(80); releaseStick(); closeSelector(true); break;
      case 'respawn': $('cv').style.filter = ''; fl.rescCount = -1; break;
      case 'control': { const el = $('count'); el.textContent = t('countdown_go'); el.className = 'count go'; el.hidden = false; sfx('countdown', { last: true }); setTimeout(() => { if (!ST.fl || !ST.fl.count || ST.fl.count <= 0) el.hidden = true; }, 380); break; }
      case 'treasure': { const tr = fl.f.treasures[e.i]; R.burst(tr[0], tr[1], 26, '#fdd835', 3.5, 0.8, 0.07); sfx('treasure', { pan: panOf(tr[0]) }); vib(20); popHud('hTre'); toast(t('treasure_got'), 'good', 1600); break; }
      case 'buoy': sfx('buoy', { pan: panOf(fl.f.buoys[e.i][0]) }); toast(t('buoy_on'), 'good', 1800); break;
      case 'crack': R.burst(e.x, e.y, 30, '#00f2cf', 4, 0.8, 0.07); R.chunks.clear(); sfx('crack', { pan: panOf(e.x) }); toast(t('crack_open'), 'good', 1800); break;
      case 'ion_in': A.ion = 1; toast(t('ion_in'), 'warn', 2000); break;
      case 'ion_out': A.ion = 0; break;
      case 'seen': { const b = e.b; fl.unfold[b.id] = 0; sfx('beacon_seen', { s: b.s, pan: panOf(b.x) }); break; }
      case 'place': break;
      case 'gate': sfx('gate'); vib([20, 40, 20]); break;
    }
  }
  // ping de radar al pasar el pulso por una baliza del anillo
  const pr = (S.t % 4) / 4 * Sm.K.RADAR, cyc = Math.floor(S.t / 4);
  if (!S.inIon) for (const b of fl.beacons) { const d = Math.hypot(b.x - S.x, b.y - S.y); if (d > Sm.clearR(S) && d < Sm.K.RADAR && Math.abs(pr - d) < 0.35 && fl.radarSeen[b.id] !== cyc) { fl.radarSeen[b.id] = cyc; sfx('beacon_radar', { pan: panOf(b.x) }); } }
  // roca cercana
  fl.f.drifts.forEach((d, i) => { const p = Sm.driftPos(d, S.t), dd = Math.hypot(p[0] - S.x, p[1] - S.y); if (dd < 1.9 && !(fl.rockCd[i] > S.t)) { fl.rockCd[i] = S.t + 1.5; sfx('rock_pass', { pan: panOf(p[0]) }); } });
  // partículas del motor
  if (S.thrust > 0.05 && !S.rescue && !reducedMQ.matches) { const n = Math.random() < S.thrust ? 1 : 0; for (let i = 0; i < n * 2; i++) { const a = S.ang + Math.PI + (Math.random() - 0.5) * 0.5, v = 2 + Math.random() * 2; R.parts.push({ x: S.x - Math.cos(S.ang) * 0.35, y: S.y - Math.sin(S.ang) * 0.35, vx: Math.cos(a) * v + S.vx * 0.5, vy: Math.sin(a) * v + S.vy * 0.5, life: 0.4, max: 0.4, col: '#00f2cf', size: 0.05 }); } }
  if (fl.ghost && S.thrust > 0.1) { fl.ghost = false; $('ghost').hidden = true; }
}
function audioFlight(fl, running) {
  if (!A.ok) return; const S = fl.S;
  if (!running) { A.loopsOff(); return; }
  A.loop('thrust', S.thrust * (S.rescue ? 0 : 1));
  let wl = 0, wp = 0; for (const w of fl.f.wells) { const d = Math.hypot(w[0] - S.x, w[1] - S.y); if (d < 5) { const v = 1 - d / 5; if (v > wl) { wl = v; wp = panOf(w[0]); } } } A.loop('well', wl, wp);
  let cu = 0; for (const c of fl.f.currents) { if (Math.hypot(c.x - S.x, c.y - S.y) < c.hl + 1) cu = 0.8; } A.loop('current', cu);
  A.loop('ion', S.inIon ? 1 : 0);
  // capas de intensidad
  const sp = Math.hypot(S.vx, S.vy); fl.fast = sp > 2 ? fl.fast + 1 / 60 : 0;
  let risk = S.inIon || cu > 0; if (!risk) { for (const m of fl.f.mines) if (Math.hypot(m[0] - S.x, m[1] - S.y) < 5) { risk = true; break; } }
  if (!risk) for (const d of fl.f.drifts) { const p = Sm.driftPos(d, S.t); if (Math.hypot(p[0] - S.x, p[1] - S.y) < 5) { risk = true; break; } }
  if (!risk) for (const w of fl.f.wells) if (Math.hypot(w[0] - S.x, w[1] - S.y) < 5) { risk = true; break; }
  const fin = S.y > fl.f.H * 0.8; A.final2 = S.y > fl.f.H - 14 ? 1 : 0;
  A.setIntensity([1, fl.fast > 2 || fl.layer1 ? 1 : 0, risk ? 1 : 0, fin ? 1 : 0]); if (fl.fast > 2) fl.layer1 = 1; if (sp < 0.5) fl.layer1 = 0;
  A.hullLow = S.hull < 30 ? 1 : 0;
  if (S.hull < 30 && S.t > fl.hullBeep) { fl.hullBeep = S.t + 3; sfx('hull_low'); }
}

/* ---------------- HUD ---------------- */
const hudLast = {};
function setText(id, v) { if (hudLast[id] !== v) { hudLast[id] = v; $(id).textContent = v; } }
function popHud(id) { const el = $(id); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
function updateHud(force) {
  const fl = ST.fl; if (!fl) return; const S = fl.S;
  setText('hTime', fmtTime(S.t + S.pen, true));
  const h = Math.round(S.hull); setText('hHull', h + '%'); $('hHull').classList.toggle('low', h < 30);
  setText('hTre', '◆ ' + S.tre.reduce((a, b) => a + b, 0) + '/' + S.tre.length);
  const left = Sm.K.MAX_BEACONS - S.placed.length; setText('hBeac', String(left)); setText('beaconN', String(left));
  const why = Sm.canPlace(S), bb = $('beaconBtn'); bb.classList.toggle('dim', !!why && why !== 'too_fast' || left <= 0);
  $('progDot').style.bottom = (Math.max(0, Math.min(1, S.y / S.f.H)) * 100).toFixed(1) + '%';
}
function drawMini(fl) { const c = $('mini').getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), cv = $('mini'); if (cv.width !== 84 * dpr) { cv.width = cv.height = 84 * dpr; } c.setTransform(dpr, 0, 0, dpr, 0, 0); const S = fl.S, span = 30; R.drawMap(c, S, S.f, 0, 0, 84, 84, { ship: 1, view: { x0: S.x - span / 2, x1: S.x + span / 2, y0: S.y - span / 2, y1: S.y + span / 2 }, gate: 1 }); }
function drawBigMap(fl) { const cv = $('mapBigCv'), S = fl.S, { w, h } = vp(), dpr = Math.min(2, devicePixelRatio || 1); const sc = Math.min(w * 0.92 / S.f.W, h * 0.84 / S.f.H); const cw = Math.round(S.f.W * sc), ch = Math.round(S.f.H * sc); if (cv.width !== cw * dpr) { cv.width = cw * dpr; cv.height = ch * dpr; cv.style.width = cw + 'px'; cv.style.height = ch + 'px'; } const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); R.drawMap(c, S, S.f, 0, 0, cw, ch, { ship: 1, route: S.samples, gate: 1, beacons: S.placed }); }
function showBigMap(v) { if (!ST.fl || ST.fl.ended) v = false; ST.mapHeld = v; $('mapBig').hidden = !v; }
$('mini').addEventListener('pointerdown', e => { e.preventDefault(); showBigMap(true); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => $('mini').addEventListener(ev, () => showBigMap(false)));

let toastT = 0;
function toast(msg, kind, ms) { const el = $('toast'); el.textContent = msg; el.className = 'toast on ' + (kind || ''); clearTimeout(toastT); toastT = setTimeout(() => { el.className = 'toast'; }, ms || 2000); }

/* ---------------- controles ---------------- */
const IN = { kx: 0, ky: 0, keys: {}, stick: null, one: new Map(), mouse: { l: 0, r: 0, x: 0, y: 0 }, brakeBtn: 0, brakeKey: 0, gp: { ax: 0, ay: 0, br: 0 } };
function layoutControls() {
  const ctl = $('ctl'); ctl.classList.toggle('nontouch', !ST.touch); ctl.classList.toggle('left', ST.set.side === 'left');
}
function readInput(dt) {
  const k = IN.keys, tx = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0), ty = (k.ArrowUp || k.KeyW ? 1 : 0) - (k.ArrowDown || k.KeyS ? 1 : 0);
  const sm = Math.min(1, dt / 0.12); IN.kx += (tx - IN.kx) * sm; IN.ky += (ty - IN.ky) * sm; if (!tx && Math.abs(IN.kx) < 0.02) IN.kx = 0; if (!ty && Math.abs(IN.ky) < 0.02) IN.ky = 0;
  let ax = IN.kx, ay = IN.ky, brake = IN.brakeBtn || IN.brakeKey || IN.mouse.r || IN.gp.br;
  if (IN.stick && IN.stick.on) { ax += IN.stick.vx; ay += IN.stick.vy; }
  const S = ST.fl.S, sq = R.W2S(S.x, S.y), toward = (x, y) => { const dx = (x - sq[0]) / R.ppc, dy = -(y - sq[1]) / R.ppc, d = Math.hypot(dx, dy); if (d < 0.15) return [0, 0]; const m = Math.min(1, d / 3); return [dx / d * m, dy / d * m]; };
  if (ST.set.ctl === 'one' && IN.one.size) { if (IN.one.size >= 2) brake = 1; else { const p = IN.one.values().next().value; const v = toward(p.x, p.y); ax += v[0]; ay += v[1]; } }
  if (IN.mouse.l) { const v = toward(IN.mouse.x, IN.mouse.y); ax += v[0]; ay += v[1]; }
  ax += IN.gp.ax; ay += IN.gp.ay;
  if (ST.auto) { const P = ST.fl.f.pilot; if (P && P.length) { let wi = ST.fl.autoWi || 1; while (wi < P.length - 1 && Math.hypot(P[wi][0] - S.x, P[wi][1] - S.y) < 0.9) wi++; ST.fl.autoWi = wi; const dx = P[wi][0] - S.x, dy = P[wi][1] - S.y, d = Math.hypot(dx, dy) || 1, vm = Math.min(ST.auto, 0.8 + d * 1.2), dvx = dx / d * vm - S.vx, dvy = dy / d * vm - S.vy, mm = Math.hypot(dvx, dvy); ax = mm > 0.1 ? dvx / Math.max(mm, 0.5) : 0; ay = mm > 0.1 ? dvy / Math.max(mm, 0.5) : 0; brake = Math.hypot(S.vx, S.vy) > vm + 0.6; } }
  if (ST.sel) { ax = 0; ay = 0; }
  if (ST.fl.S.rescue) { ax = ay = 0; brake = 0; }
  return { ax, ay, brake: !!brake };
}
function releaseStick() { IN.stick = null; $('stick').hidden = true; IN.one.clear(); IN.mouse.l = IN.mouse.r = 0; IN.brakeBtn = 0; $('brakeBtn').classList.remove('down'); }
const cv = $('cv');
function inFlightInput() { return ST.fl && !ST.fl.ended && ST.scene === 'flight' && !ST.fl.paused; }
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch' || e.pointerType === 'pen') { if (!ST.touch) { ST.touch = true; layoutControls(); } }
  if (!inFlightInput()) return;
  if (ST.sel) return; // el selector usa su propia capa
  e.preventDefault();
  if (e.pointerType === 'mouse') { IN.mouse.x = e.clientX; IN.mouse.y = e.clientY; if (e.button === 0) IN.mouse.l = 1; else if (e.button === 2) IN.mouse.r = 1; else if (e.button === 1) openSelector(null); try { cv.setPointerCapture(e.pointerId); } catch (er) {} return; }
  if (ST.set.ctl === 'one') { IN.one.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { cv.setPointerCapture(e.pointerId); } catch (er) {} return; }
  // la palanca nace donde apoyas el dedo, en cualquier parte del lienzo: los botones son elementos propios y no llegan aquí
  if (IN.stick && IN.stick.on) return;
  IN.stick = { id: e.pointerId, bx: e.clientX, by: e.clientY, vx: 0, vy: 0, on: true };
  const st = $('stick'); st.hidden = false; st.style.left = e.clientX + 'px'; st.style.top = e.clientY + 'px'; $('stickKnob').style.transform = '';
  try { cv.setPointerCapture(e.pointerId); } catch (er) {}
}, { passive: false });
cv.addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse') { IN.mouse.x = e.clientX; IN.mouse.y = e.clientY; return; }
  if (IN.one.has(e.pointerId)) { IN.one.set(e.pointerId, { x: e.clientX, y: e.clientY }); return; }
  const s = IN.stick; if (!s || s.id !== e.pointerId) return;
  let dx = e.clientX - s.bx, dy = e.clientY - s.by, d = Math.hypot(dx, dy); const MAX = 52;
  if (d > 56) { s.bx = e.clientX - dx / d * 56; s.by = e.clientY - dy / d * 56; dx = e.clientX - s.bx; dy = e.clientY - s.by; d = 56; const st = $('stick'); st.style.left = s.bx + 'px'; st.style.top = s.by + 'px'; }
  const m0 = Math.max(0, Math.min(1, (d - 8) / (MAX - 8))), m = 0.35 * m0 + 0.65 * m0 * m0;
  s.vx = d > 0 ? dx / d * m : 0; s.vy = d > 0 ? -dy / d * m : 0;
  $('stickKnob').style.transform = 'translate(' + (Math.min(d, MAX) * (d ? dx / d : 0)).toFixed(1) + 'px,' + (Math.min(d, MAX) * (d ? dy / d : 0)).toFixed(1) + 'px)';
});
function ptrEnd(e) {
  if (e.pointerType === 'mouse') { if (e.button === 0) IN.mouse.l = 0; if (e.button === 2) IN.mouse.r = 0; if (e.type === 'pointercancel') IN.mouse.l = IN.mouse.r = 0; return; }
  IN.one.delete(e.pointerId);
  if (IN.stick && IN.stick.id === e.pointerId) { IN.stick = null; $('stick').hidden = true; }
}
cv.addEventListener('pointerup', ptrEnd); cv.addEventListener('pointercancel', ptrEnd);
// botones táctiles
const brakeBtn = $('brakeBtn');
brakeBtn.addEventListener('pointerdown', e => { e.preventDefault(); ST.touch = e.pointerType !== 'mouse' || ST.touch; IN.brakeBtn = 1; brakeBtn.classList.add('down'); vib(8); sfx('brake'); try { brakeBtn.setPointerCapture(e.pointerId); } catch (er) {} });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => brakeBtn.addEventListener(ev, () => { IN.brakeBtn = 0; brakeBtn.classList.remove('down'); }));
const beaconBtn = $('beaconBtn');
beaconBtn.addEventListener('pointerdown', e => { e.preventDefault(); beaconBtn.classList.add('down'); vib(8); openSelector(e); });
['pointerup', 'pointercancel'].forEach(ev => beaconBtn.addEventListener(ev, () => beaconBtn.classList.remove('down')));
beaconBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSelector(null); } });
// teclado
const GAME_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyE', 'KeyB', 'KeyM', 'KeyP', 'Escape'];
window.addEventListener('keydown', e => {
  const fl = ST.fl, flying = fl && !fl.ended && ST.scene === 'flight';
  if (ST.dial && flying) { dialKey(e); return; }
  if (ST.sel && flying) { selKey(e); return; }
  if (flying) {
    if (GAME_KEYS.includes(e.code)) e.preventDefault();
    if (e.code === 'Escape' || e.code === 'KeyP') { if (!e.repeat) pauseFlight('key'); return; }
    if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') { if (!IN.brakeKey && !e.repeat) sfx('brake'); IN.brakeKey = 1; return; }
    if ((e.code === 'KeyE' || e.code === 'KeyB') && !e.repeat) { openSelector(null); return; }
    if (e.code === 'KeyM') { showBigMap(true); return; }
    IN.keys[e.code] = 1; return;
  }
  if (ST.scene === 'pause' && (e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) { e.preventDefault(); resumeFlight(); return; }
  if (e.code === 'Escape' && ['table', 'logs', 'arch', 'help', 'settings', 'day'].includes(ST.scene)) { e.preventDefault(); sfx('ui_back'); if (ST.scene === 'day') goHome(); else closeOver(); }
});
window.addEventListener('keyup', e => {
  IN.keys[e.code] = 0;
  if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') IN.brakeKey = 0;
  if (e.code === 'KeyM') showBigMap(false);
});
window.addEventListener('blur', () => { IN.keys = {}; IN.brakeKey = 0; releaseStick(); showBigMap(false); });
// mando (Gamepad API, sin prometerlo en la interfaz)
let gpPrev = {};
function pollGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : []; let gp = null; for (const p of pads) if (p) { gp = p; break; }
  if (!gp) { IN.gp.ax = IN.gp.ay = IN.gp.br = 0; return; }
  const dz = v => Math.abs(v) < 0.15 ? 0 : v; IN.gp.ax = dz(gp.axes[0] || 0); IN.gp.ay = -dz(gp.axes[1] || 0);
  const b = i => gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.4); IN.gp.br = b(7) ? 1 : 0;
  const press = i => b(i) && !gpPrev[i];
  if (ST.fl && !ST.fl.ended && ST.scene === 'flight') { if (press(0) && !ST.sel) openSelector(null); if (press(9)) pauseFlight('gp'); }
  else if (ST.scene === 'pause' && press(9)) resumeFlight();
  gpPrev = {}; gp.buttons.forEach((x, i) => gpPrev[i] = x.pressed);
}

/* ---------------- selector de balizas (4.3) ---------------- */
const ORDER = ['flecha', 'atajo', 'tesoro', 'peligro', 'noporaqui'];
const WHY_KEY = { too_fast: 'slow_to_mark', none_left: 'no_beacons_left', near_start: 'near_start', near_gate: 'near_gate', near_own: 'near_own', archive: 'archive_no_mark', free: 'free_no_mark', blocked: 'slow_to_mark' };
function openSelector(e) {
  const fl = ST.fl; if (!fl || fl.ended || fl.paused || fl.count > 0 || fl.S.rescue || ST.sel || ST.dial) return;
  const why = Sm.canPlace(fl.S);
  if (why) { const b = $('beaconBtn'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); sfx('ui_error'); toast(t(WHY_KEY[why] || 'slow_to_mark'), 'warn', 1500); vib(15); return; }
  fl.S.autoBrake = 1; sfx('beacon_open');
  const sel = $('sel'), c = $('selC'); c.innerHTML = '';
  ORDER.forEach((s, i) => { const b = document.createElement('button'); b.className = 'sym'; b.dataset.s = s; b.style.animationDelay = (i * 30) + 'ms'; b.setAttribute('aria-label', t('sym_' + s)); b.innerHTML = R.glyphSVG(s, 0) + '<span>' + t('sym_' + s) + '</span>' + (ST.touch ? '' : '<kbd>' + (i + 1) + '</kbd>'); if (fl.tut && fl.tut.step === 4 && s === 'noporaqui') b.classList.add('rec'); c.appendChild(b); });
  sel.hidden = false; document.body.classList.add('selecting'); ST.sel = { pid: e ? e.pointerId : null, hi: -1, sx: e ? e.clientX : 0, sy: e ? e.clientY : 0, moved: false };
  positionSelector();
  if (!e && !ST.touch) setTimeout(() => { const f = c.querySelector('.sym'); if (f) f.focus(); }, 20);
}
function positionSelector() {
  const S = ST.fl.S, q = R.W2S(S.x, S.y), { w, h } = vp(), rad = Math.min(w, h) < 500 ? 96 : 112;
  const cx = Math.max(rad + 40, Math.min(w - rad - 40, q[0])), cy = Math.max(rad + 90, Math.min(h - rad - 40, q[1]));
  const box = ST.sel ? $('selC') : null; if (!box) return; box.style.left = cx + 'px'; box.style.top = cy + 'px';
  box.querySelectorAll('.sym').forEach((b, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; b.style.left = (Math.cos(a) * rad) + 'px'; b.style.top = (Math.sin(a) * rad) + 'px'; });
}
function closeSelector(silent) { document.body.classList.remove('selecting'); if (ST.sel) { $('sel').hidden = true; ST.sel = null; } if (ST.dial) { $('dial').hidden = true; ST.dial = null; } if (ST.fl) ST.fl.S.autoBrake = 0; if (!silent) sfx('ui_back'); }
function selHi(i) { const els = $('selC').querySelectorAll('.sym'); els.forEach((b, k) => b.classList.toggle('hi', k === i)); if (ST.sel && ST.sel.hi !== i && i >= 0) sfx('beacon_pick', { s: ORDER[i] }); if (ST.sel) ST.sel.hi = i; }
function symAt(x, y) { let best = -1, bd = 70; $('selC').querySelectorAll('.sym').forEach((b, i) => { const r = b.getBoundingClientRect(), d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)); if (d < bd) { bd = d; best = i; } }); return best; }
$('sel').addEventListener('pointerdown', e => { if (!ST.sel) return; const i = symAt(e.clientX, e.clientY); if (i < 0) { closeSelector(); return; } e.preventDefault(); selHi(i); ST.sel.pid = e.pointerId; ST.sel.tap = true; });
window.addEventListener('pointermove', e => { if (!ST.sel || ST.sel.pid !== e.pointerId) return; if (Math.hypot(e.clientX - ST.sel.sx, e.clientY - ST.sel.sy) > 18) ST.sel.moved = true; const i = symAt(e.clientX, e.clientY); if (i !== ST.sel.hi) selHi(i); if (ST.dial && ST.dial.pid === e.pointerId) dialMove(e); });
window.addEventListener('pointerup', e => {
  if (ST.sel && ST.sel.pid === e.pointerId) { const i = ST.sel.hi; if (i >= 0 && (ST.sel.moved || ST.sel.tap)) { pickSymbol(ORDER[i]); return; } ST.sel.pid = null; }
});
$('selC').addEventListener('click', e => { const b = e.target.closest('.sym'); if (b && ST.sel && e.detail === 0) pickSymbol(b.dataset.s); }); // teclado (Enter sobre el botón)
function selKey(e) {
  e.preventDefault(); const n = ORDER.length;
  if (e.code === 'Escape') { closeSelector(); return; }
  if (/^Digit[1-5]$/.test(e.code)) { pickSymbol(ORDER[+e.code.slice(5) - 1]); return; }
  if (['ArrowRight', 'ArrowDown', 'KeyD', 'KeyS'].includes(e.code)) { const i = ((ST.sel.hi < 0 ? -1 : ST.sel.hi) + 1) % n; selHi(i); $('selC').children[i].focus(); }
  if (['ArrowLeft', 'ArrowUp', 'KeyA', 'KeyW'].includes(e.code)) { const i = ((ST.sel.hi < 0 ? 0 : ST.sel.hi) - 1 + n) % n; selHi(i); $('selC').children[i].focus(); }
  if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') { const i = ST.sel.hi >= 0 ? ST.sel.hi : ORDER.indexOf((document.activeElement && document.activeElement.dataset.s) || ''); if (i >= 0) pickSymbol(ORDER[i]); }
}
function pickSymbol(s) {
  const fl = ST.fl; if (!fl) return; $('sel').hidden = true; ST.sel = null; document.body.classList.remove('selecting');
  if (Sm.DIRECTIONAL[s]) openDial(s); else placeBeacon(s, 0);
}
// dial de orientación (8 direcciones)
function openDial(s) {
  const fl = ST.fl, S = fl.S, d0 = G.dirFrom(Math.cos(S.ang), Math.sin(S.ang));
  ST.dial = { s, dir: d0, pid: null }; const dl = $('dial'); dl.hidden = false; document.body.classList.add('selecting');
  const q = R.W2S(S.x, S.y), { w, h } = vp(), cx = Math.max(120, Math.min(w - 120, q[0])), cy = Math.max(170, Math.min(h - 120, q[1]));
  ST.dial.cx = cx; ST.dial.cy = cy;
  const ring = $('dialRing'); ring.style.left = cx + 'px'; ring.style.top = cy + 'px'; ring.innerHTML = '';
  for (let i = 0; i < 8; i++) { const v = G.dirVec(i), k = document.createElement('i'); k.style.transform = 'translate(' + (v[0] * 100).toFixed(1) + 'px,' + (-v[1] * 100).toFixed(1) + 'px)'; ring.appendChild(k); }
  const ok = $('dialOk'); ok.style.left = cx + 'px'; ok.style.top = cy + 'px';
  $('dialArrow').innerHTML = R.glyphSVG(s, 0); setDialDir(d0); sfx('beacon_pick', { s });
}
function setDialDir(d) { const D = ST.dial; if (!D) return; if (D.dir !== d) sfx('beacon_pick', { s: D.s }); D.dir = d; const v = G.dirVec(d), a = $('dialArrow'); a.style.left = (D.cx + v[0] * 64) + 'px'; a.style.top = (D.cy - v[1] * 64) + 'px'; a.style.transform = 'rotate(' + (d * 45) + 'deg)'; }
function dialMove(e) { const D = ST.dial; if (!D) return; const dx = e.clientX - D.cx, dy = -(e.clientY - D.cy); if (Math.hypot(dx, dy) > 24) setDialDir(G.dirFrom(dx, dy)); }
$('dial').addEventListener('pointerdown', e => { if (!ST.dial || e.target === $('dialOk')) return; e.preventDefault(); ST.dial.pid = e.pointerId; dialMove(e); });
$('dial').addEventListener('pointermove', e => { if (ST.dial && (ST.dial.pid === e.pointerId || e.pointerType === 'mouse')) dialMove(e); });
$('dial').addEventListener('pointerup', e => { if (ST.dial && ST.dial.pid === e.pointerId) placeBeacon(ST.dial.s, ST.dial.dir); });
$('dialOk').addEventListener('click', () => { if (ST.dial) placeBeacon(ST.dial.s, ST.dial.dir); });
function dialKey(e) {
  e.preventDefault(); const D = ST.dial;
  if (e.code === 'Escape') { closeSelector(); return; }
  if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') { placeBeacon(D.s, D.dir); return; }
  if (['ArrowRight', 'KeyD'].includes(e.code)) setDialDir((D.dir + 1) % 8);
  if (['ArrowLeft', 'KeyA'].includes(e.code)) setDialDir((D.dir + 7) % 8);
  if (['ArrowUp', 'KeyW'].includes(e.code)) setDialDir(0);
  if (['ArrowDown', 'KeyS'].includes(e.code)) setDialDir(4);
}
let undoT = 0, undoB = null;
function placeBeacon(s, dir) {
  const fl = ST.fl; closeSelector(true); if (!fl) return;
  const r = Sm.place(fl.S, s, dir);
  if (!r.ok) { sfx('ui_error'); toast(t(WHY_KEY[r.why] || 'slow_to_mark'), 'warn', 1500); return; }
  fl.waves.push({ x: r.b.x, y: r.b.y, age: 0 }); R.burst(r.b.x, r.b.y, 24, R.SYMCOL[s], 3, 0.8, 0.06); sfx('beacon_place'); vib(20); popHud('hBeac');
  undoB = r.b; const ub = $('undoBar'); ub.hidden = false; const ti = $('undoTimer'); ti.style.transition = 'none'; ti.style.transform = 'scaleX(1)'; void ti.offsetWidth; ti.style.transition = 'transform 5s linear'; ti.style.transform = 'scaleX(0)';
  clearTimeout(undoT); undoT = setTimeout(() => { ub.hidden = true; undoB = null; }, 5000);
  if (fl.tut && fl.tut.step === 4) { $('beaconBtn').classList.remove('hint'); tutStep(5); }
  saveFlight();
}
$('undoBtn').addEventListener('click', () => { const fl = ST.fl; if (fl && undoB && Sm.undo(fl.S, undoB)) { sfx('beacon_undo'); $('undoBar').hidden = true; undoB = null; clearTimeout(undoT); saveFlight(); } });

/* ---------------- TUTORIAL (6) ---------------- */
function startTutorial() { ST.prof.tutStep = Math.max(1, ST.prof.tutStep || 1); saveProf(); startFlight('tutorial', 'tutorial', false); }
function tutLine(key, ms) { const el = $('tutLine'); tutLine.key = key; el.hidden = !key; if (key) { el.textContent = t(key); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; } clearTimeout(tutLine.tm); if (ms) tutLine.tm = setTimeout(() => { if (ST.fl && ST.fl.tut) tutStep(ST.fl.tut.step, true); }, ms); }
function tutStep(n, silent) {
  const fl = ST.fl, T = fl.tut; T.step = n; T.sub = 0; ST.prof.tutStep = n; saveProf();
  if (!silent && n > 1) sfx('buoy');
  const keys = !ST.touch;
  if (n === 1) tutLine(keys ? 'tut_1k' : 'tut_1');
  if (n === 2) tutLine('tut_2');
  if (n === 3) tutLine('tut_3');
  if (n === 4) tutLine(null);
  if (n === 5) { if (silent) tutLine('tut_gate'); else tutLine('tut_4ok', 2600); }
  if (n === 6) tutLine(null);
  // reanudación: coloca la nave al inicio del paso
  if (silent && fl.S.t === 0) { const pos = { 2: [23.5, 19.5], 3: [29.5, 30], 4: [19.5, 45.5], 5: [19.5, 45.5] }[n]; if (pos) { fl.S.x = pos[0]; fl.S.y = pos[1]; Sm.explore(fl.S, true); } }
}
function tutTick(fl) {
  const T = fl.tut, S = fl.S, z = fl.f.zones, near = (p, r) => Math.hypot(S.x - p[0], S.y - p[1]) < r, sp = Math.hypot(S.vx, S.vy);
  if (T.step === 1) {
    if (T.sub === 0 && Math.hypot(S.x - fl.f.start[0], S.y - fl.f.start[1]) > 8) { T.sub = 1; tutLine(ST.touch ? 'tut_1b' : 'tut_1bk'); }
    else if (T.sub === 1 && sp < 1 && S.brake) { tutStep(2); }
    if (T.sub === 1 && S.y > 22) tutStep(2);
  } else if (T.step === 2) {
    if (near(z.s2dead, 3.6) && !T.dead) { T.dead = 1; tutLine('tut_2dead', 3000); }
    if (S.y > 33 && S.x > 24) tutStep(3);
  } else if (T.step === 3) {
    if (S.y > 44.5) tutStep(4);
  } else if (T.step === 4) {
    // en el callejón: el botón Baliza late para que el jugador haga el gesto real (abrir el selector solo cerraba el selector al frenar)
    if (S.x < 15 && S.y > 44 && S.y < 51) { if (!T.inAlcove) { T.inAlcove = 1; tutLine(ST.touch ? 'tut_4' : 'tut_4k'); } $('beaconBtn').classList.toggle('hint', sp <= Sm.K.MARK_V && !ST.sel && !ST.dial); }
    else if (T.inAlcove && S.x > 17) { T.inAlcove = 0; $('beaconBtn').classList.remove('hint'); }
  }
}
function finishTutorial(skipped) {
  ST.prof.tut = 1; ST.prof.tutStep = 0; saveProf(); endFlightView(); ST.fl = null;
  if (skipped) { goHome(); return; }
}

/* ---------------- LLEGADA Y RESULTADO (5.7) ---------------- */
function arrive() {
  const fl = ST.fl; fl.arriving = true; fl.arrT = 0; closeSelector(true); releaseStick(); $('undoBar').hidden = true; $('tutLine').hidden = true; $('ghost').hidden = true;
  A.loopsOff(); A.play('resultado');
  const S = fl.S, sc = Sm.score(S), d = fl.mode === 'oficial' ? loadDay(fl.fecha) : null;
  fl.score = sc;
  const followed = Object.keys(S.follow).filter(id => S.follow[id] === 1);
  const realIds = id => !String(id).startsWith('p') && !String(id).startsWith('t') && !String(id).startsWith('m');
  fl.guided = followed.filter(realIds).slice(0, 6);
  if (fl.mode === 'oficial') {
    d.off.status = 'done'; d.off.result = { flight: sc.flight, time: sc.time, hull: sc.hull, tre: sc.tre, seconds: sc.seconds, rescues: S.rescues, beacons: S.placed.map(b => b.s), par: fl.f.par }; d.off.save = null; d.off.placed = S.placed; saveDay(fl.fecha, d);
    const p = ST.prof; if (p.lastDay !== fl.fecha) { p.streak = (p.lastDay === addDays(fl.fecha, -1)) ? p.streak + 1 : 1; p.best = Math.max(p.best, p.streak); p.lastDay = fl.fecha; }
    p.flights++; saveProf();
    submitFlight(fl, 'completo');
  } else if (fl.mode === 'libre') { const dd = loadDay(fl.fecha); const prev = dd.bestFree; fl.pb = prev == null || sc.seconds < prev; if (fl.pb) dd.bestFree = sc.seconds; saveDay(fl.fecha, dd); ST.prof.flights++; saveProf(); }
  else if (fl.mode !== 'tutorial') { ST.prof.flights++; saveProf(); }
  setTimeout(() => showResult(fl), reducedMQ.matches ? 300 : 2100);
}
function abandonFlight() {
  const fl = ST.fl; if (!fl) return;
  if (fl.mode === 'oficial') { const d = loadDay(fl.fecha); d.off.status = 'abandoned'; d.off.result = { flight: 0, abandoned: 1, beacons: fl.S.placed.map(b => b.s) }; d.off.placed = fl.S.placed; d.off.save = null; saveDay(fl.fecha, d); fl.score = { flight: 0 }; fl.guided = []; submitFlight(fl, 'abandonado'); ST.prof.flights++; saveProf(); }
  endFlightView(); ST.fl = null; goHome();
}
function encodeRoute(samples) {
  if (!samples.length) return ''; const out = [samples[0][0] & 255, samples[0][0] >> 8 & 255, samples[0][1] & 255, samples[0][1] >> 8 & 255];
  for (let i = 1; i < samples.length; i++) { out.push((samples[i][0] - samples[i - 1][0]) & 255, (samples[i][1] - samples[i - 1][1]) & 255); }
  let s = ''; for (const b of out) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeRoute(str) {
  try { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/')); if (s.length < 4) return null; let x = s.charCodeAt(0) | s.charCodeAt(1) << 8, y = s.charCodeAt(2) | s.charCodeAt(3) << 8; const pts = [[x, y]];
    for (let i = 4; i + 1 < s.length; i += 2) { let dx = s.charCodeAt(i), dy = s.charCodeAt(i + 1); if (dx > 127) dx -= 256; if (dy > 127) dy -= 256; x += dx; y += dy; pts.push([x, y]); } return pts; } catch (e) { return null; }
}
function submitFlight(fl, estado) {
  const S = fl.S;
  const body = { fecha: fl.fecha, jugador: PLAYER, oficial: 1, estado, tiempo_ms: Math.round((S.t + S.pen) * 1000), casco: Math.round(S.hull), rescates: S.rescues, tesoros: S.tre.reduce((a, b) => a + b, 0), par: fl.f.par, version: G.VERSION, k: fl.f.k, alto: fl.f.H, ruta: encodeRoute(S.samples.slice(-2400)), balizas: S.placed.map(b => ({ x: b.x, y: b.y, s: b.s, d: b.d })), vistas: Object.keys(S.seen).filter(id => !isNaN(+id)).map(Number).slice(0, 60), guiadas: (fl.guided || []).map(Number), rango: ST.prof.rank };
  fl.sendP = N.send('vuelo', body, 'vuelo:' + fl.fecha).then(r => { const d = loadDay(fl.fecha); d.sent = 1; d.serverRes = r; saveDay(fl.fecha, d); fl.server = r; return r; })
    .catch(e => { fl.sendErr = e; if (e && e.code === 'closed') { const d = loadDay(fl.fecha); d.closedLate = 1; saveDay(fl.fecha, d); } if (e && e.code === 'rate_limited') toast(t('rate_limited'), 'warn', 2500); return null; });
}
function showResult(fl) {
  if (fl.mode === 'tutorial') { tutStep(5, true); openRate(fl); return; }
  endFlightView(); ST.fl = fl; fl.ended = true; R.reveal = 1; R.zoomOut = 0.55;
  const S = fl.S, sc = fl.score;
  const lines = $('resLines'); lines.innerHTML = '';
  const L = [[t('score_time'), fmtTime(sc.seconds, true) + ' · ' + t('par', { t: fmtTime(fl.f.par) }), sc.time], [t('score_hull'), Math.round(S.hull) + '%', sc.hull], [t('score_treasure'), S.tre.reduce((a, b) => a + b, 0) + '/' + S.tre.length, sc.tre]];
  const scoring = fl.mode === 'oficial';
  L.forEach(l => { const div = document.createElement('div'); div.innerHTML = '<span>' + l[0] + ' <small style="color:var(--dim)">' + l[1] + '</small></span><b>' + (scoring ? '0' : '') + '</b>'; div.dataset.v = scoring ? l[2] : ''; lines.appendChild(div); });
  if (scoring) { const tot = document.createElement('div'); tot.className = 'tot'; tot.innerHTML = '<span>' + t('score_flight') + '</span><b>0</b>'; tot.dataset.v = sc.flight; lines.appendChild(tot); const pend = document.createElement('div'); pend.className = 'pend'; pend.innerHTML = '<span>' + t('score_guide_pending') + '</span><b></b>'; lines.appendChild(pend); }
  else if (fl.mode === 'libre' && fl.pb) { const pb = document.createElement('div'); pb.className = 'tot'; pb.innerHTML = '<span>' + t('personal_best') + '</span><b>' + fmtTime(sc.seconds, true) + '</b>'; lines.appendChild(pb); }
  // desglose animado con tics
  const rows = [...lines.children]; rows.forEach((r, i) => setTimeout(() => { r.classList.add('on'); const v = +r.dataset.v; const b = r.querySelector('b'); if (r.dataset.v !== '' && !isNaN(v) && b) { const t0 = performance.now(), dur = reducedMQ.matches ? 1 : 600; let k0 = 0; (function st(now) { const k = Math.min(1, (now - t0) / dur); b.textContent = fmtNum(v * k); if (Math.floor(k * 8) > k0) { k0 = Math.floor(k * 8); sfx('score_tick', { i: i * 3 + k0 }); } if (k < 1) requestAnimationFrame(st); })(t0); } }, 250 + i * 420));
  $('resRank').hidden = fl.mode !== 'oficial'; fl.resDone = false; paintResText(fl);
  if (fl.mode === 'oficial') (fl.sendP || Promise.resolve(null)).then(r => { fl.resR = r; fl.resDone = true; if (ST.fl === fl) paintResText(fl); });
  // votar: candidatas = balizas reales vistas (no propias)
  fl.rateList = rateCandidates(fl);
  const canRate = fl.rateList.length > 0 && fl.mode !== 'archivo';
  $('rateBtn').hidden = !canRate; $('againBtn').hidden = !(fl.mode === 'libre' || fl.mode === 'archivo');
  if (!canRate && fl.mode !== 'oficial') { $('againBtn').classList.add('pri'); }
  $('shareBtn').hidden = fl.mode !== 'oficial';
  show('result');
  drawResultMap(fl);
}
// Textos del resultado (también al cambiar de idioma en vivo, sin repetir la animación)
function paintResText(fl) {
  const S = fl.S, sc = fl.score;
  $('resKick').textContent = fl.mode === 'oficial' ? t('official') + ' · ' + fmtDate(fl.fecha) : fl.mode === 'libre' ? t('free') : t('archive_flight', { d: fmtDate(fl.fecha) });
  $('resTitle').textContent = t('arrived');
  const lb = [t('score_time') + ' <small style="color:var(--dim)">' + fmtTime(sc.seconds, true) + ' · ' + t('par', { t: fmtTime(fl.f.par) }) + '</small>', t('score_hull') + ' <small style="color:var(--dim)">' + Math.round(S.hull) + '%</small>', t('score_treasure') + ' <small style="color:var(--dim)">' + S.tre.reduce((a, b) => a + b, 0) + '/' + S.tre.length + '</small>'];
  if (fl.mode === 'oficial') lb.push(t('score_flight'), t('score_guide_pending')); else if (fl.mode === 'libre' && fl.pb) lb.push(t('personal_best'));
  [...$('resLines').children].forEach((row, i) => { const sp = row.querySelector('span'); if (sp && lb[i] != null) sp.innerHTML = lb[i]; });
  let rank = '', note = ''; const r = fl.resR;
  if (fl.fecha !== gameDate() && fl.mode === 'oficial') note = t('new_field_now');
  if (fl.resDone) { if (r && r.puesto) rank = t('rank_pos', { p: r.puesto, n: r.total_jugadores || r.jugadores || r.puesto }); else if (fl.sendErr && fl.sendErr.code === 'closed') note = t('closed_round'); else if (fl.sendErr && fl.sendErr.queued) note = t('offline'); }
  $('resRank').textContent = rank; $('resNote').textContent = note;
}
function drawResultMap(fl) {
  const cv = $('resMap'), S = fl.S, f = S.f, dpr = Math.min(2, devicePixelRatio || 1), w = 120, h = Math.round(w * f.H / f.W);
  cv.width = w * dpr; cv.height = h * dpr; cv.style.height = 'auto'; const c = cv.getContext('2d'); const t0 = performance.now(), dur = reducedMQ.matches ? 1 : 1500;
  (function fr(now) { const k = Math.min(1, (now - t0) / dur); c.setTransform(dpr, 0, 0, dpr, 0, 0); R.drawMap(c, S, f, 0, 0, w, h, { all: 1, route: S.samples, progress: k, beacons: S.placed, gate: 1 }); if (k < 1 && ST.scene === 'result') requestAnimationFrame(fr); })(t0);
}
function rateCandidates(fl) {
  const S = fl.S, out = [];
  if (fl.mode === 'tutorial') { const b = fl.beacons.find(b => b.trap); if (b) out.push({ b, followed: !!S.follow[b.id], tut: 1 }); return out; }
  for (const id in S.seen) { const b = fl.beacons.find(q => String(q.id) === String(id)); if (!b || b.practice || b.mine) continue; out.push({ b, followed: S.follow[id] === 1, d: minDistToRoute(S, b) }); }
  out.sort((a, b) => (b.followed - a.followed) || (a.d - b.d)); return out.slice(0, 6);
}
function minDistToRoute(S, b) { let m = 1e9; for (const s of S.samples) { const d = Math.hypot(s[0] / 4 - b.x, s[1] / 4 - b.y); if (d < m) m = d; } return m; }
$('rateBtn').addEventListener('click', () => { sfx('ui_tap'); openRate(ST.fl); });
$('againBtn').addEventListener('click', () => { sfx('ui_tap'); const fl = ST.fl; startFlight(fl.mode, fl.fecha, false); });
$('resHome').addEventListener('click', () => { sfx('ui_back'); ST.fl = null; goHome(); });
$('resTable').addEventListener('click', () => { sfx('ui_tap'); openTable(true); });
$('shareBtn').addEventListener('click', () => { sfx('ui_tap'); share(ST.fl); });

/* ---------------- VALORAR (3.8, 5.8) ---------------- */
function openRate(fl) {
  if (fl.mode === 'tutorial') { endFlightView(); ST.fl = fl; fl.ended = true; R.reveal = 1; }
  const list = fl.rateList || rateCandidates(fl); fl.rateList = list; const box = $('rCards'); box.innerHTML = ''; const d = loadDay(fl.fecha);
  $('rateEnd').hidden = true; let voted = 0;
  if (fl.mode === 'tutorial') { const p = document.createElement('p'); p.className = 'note'; tx(p, 'tut_5'); box.appendChild(p); }
  list.forEach((it, i) => {
    const b = it.b, card = document.createElement('div'); card.className = 'rcard';
    card.innerHTML = '<canvas width="192" height="192"></canvas><div class="rc-b"><div class="rc-h">' + R.glyphSVG(b.s, b.d) + '<span data-t="sym_' + b.s + '">' + t('sym_' + b.s) + '</span></div><div class="rc-s">' + (it.followed ? '<span class="rc-f" data-t="you_followed">' + t('you_followed') + '</span>' : '&nbsp;') + '</div><div class="row"><button class="btn vote-up" data-t="useful">' + t('useful') + '</button><button class="btn vote-dn" data-t="misleading">' + t('misleading') + '</button></div></div>';
    box.appendChild(card);
    const c = card.querySelector('canvas').getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0); R.drawMap(c, fl.S, fl.S.f, 0, 0, 96, 96, { route: fl.S.samples, beacons: [b], view: { x0: b.x - 8, x1: b.x + 8, y0: b.y - 8, y1: b.y + 8 }, rock: 0 });
    const prev = d.votes[b.id]; if (prev === 1) card.querySelector('.vote-up').classList.add('sel'); if (prev === -1) card.querySelector('.vote-dn').classList.add('sel');
    const vote = (v) => {
      sfx(v > 0 ? 'vote_up' : 'vote_down'); vib(10); card.querySelector('.vote-up').classList.toggle('sel', v > 0); card.querySelector('.vote-dn').classList.toggle('sel', v < 0);
      if (!it.tut) { const dd = loadDay(fl.fecha); dd.votes[b.id] = v; saveDay(fl.fecha, dd); N.send('voto', { fecha: fl.fecha, jugador: PLAYER, baliza: +b.id, valor: v }, 'voto:' + fl.fecha + ':' + b.id).catch(e => { if (e && e.code === 'rate_limited') toast(t('rate_limited'), 'warn', 2500); }); }
      if (!card.dataset.v) { voted++; } card.dataset.v = v; tx($('rateProg'), 'of', { a: voted, b: list.length });
      setTimeout(() => { card.classList.add('out'); setTimeout(() => { card.style.display = 'none'; if (voted >= list.length) { $('rateEnd').hidden = false; if (it.tut) tutStep(6, true); } }, 280); }, 260);
    };
    card.querySelector('.vote-up').addEventListener('click', () => vote(1)); card.querySelector('.vote-dn').addEventListener('click', () => vote(-1));
  });
  tx($('rateProg'), 'of', { a: 0, b: list.length });
  $('rateSkip').hidden = fl.mode === 'tutorial';
  show('rate');
}
function rateClose() {
  const fl = ST.fl; sfx('ui_tap');
  if (fl && fl.mode === 'tutorial') { ST.prof.tut = 1; ST.prof.tutStep = 0; saveProf(); ST.fl = null; tutFinal(); return; }
  if (fl && fl.ended) show('result'); else goHome();
}
$('rateDone').addEventListener('click', rateClose); $('rateSkip').addEventListener('click', rateClose);
function tutFinal() { // paso 6: «Ahora el campo de hoy», con el botón para volarlo
  ST.today = gameDate(); openDay('oficial', ST.today, false, true); A.play('faro');
}

/* ---------------- COMPARTIR (11) ---------------- */
async function share(fl) {
  const d = loadDay(fl.fecha), res = d.off.result || {}, di = G.dayIndex(fl.fecha), em = { flecha: '➤', peligro: '⚠️', atajo: '⚡', tesoro: '💎', noporaqui: '⛔' };
  const r = ST.dia[fl.fecha] || {}, g = r.guia ? r.guia.guiados : 0;
  const lines = ['JET//Balizas · ' + fmtDate(fl.fecha) + ' · ' + t('weekdays')[di], '🛰️ ' + fmtTime(res.seconds || 0) + ' · ' + t('share_hull') + ' ' + Math.round((res.hull || 0) / 20) + ' % · ◆ ' + (res.tre ? res.tre / 400 : 0) + '/3'];
  if (res.beacons && res.beacons.length) lines.push('🔦 ' + t('share_beacons') + ': ' + res.beacons.map(s => em[s]).join(' '));
  if (g > 0) lines.push('🧑‍🚀 ' + (g === 1 ? t('share_guided1') : t('share_guided', { n: g })));
  lines.push('jetgames.fun/balizas');
  const text = lines.join('\n');
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); toast(t('copied'), 'good'); } catch (e) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast(t('copied'), 'good'); } catch (er) {} ta.remove(); }
}

/* ---------------- TABLA (5.9) ---------------- */
let tabDay = 'today';
function openTable(fromResult) { if (fromResult) openOver('table'); else openOver('table'); tabDay = 'today'; renderTable(); }
$('tabToday').addEventListener('click', () => { tabDay = 'today'; sfx('ui_toggle'); renderTable(); });
$('tabYest').addEventListener('click', () => { tabDay = 'yest'; sfx('ui_toggle'); renderTable(); });
async function renderTable() {
  $('tabToday').classList.toggle('on', tabDay === 'today'); $('tabYest').classList.toggle('on', tabDay === 'yest');
  const f = tabDay === 'today' ? gameDate() : addDays(gameDate(), -1), tb = $('tbl'), note = $('tabNote');
  tb.innerHTML = ''; for (let i = 0; i < 6; i++) { const s = document.createElement('div'); s.className = 'tr sk'; tb.appendChild(s); }
  note.hidden = true; $('tabState').textContent = '';
  let r = null; try { r = await N.getRetry('tabla', { fecha: f, jugador: PLAYER }); } catch (e) { r = null; }
  if (f !== (tabDay === 'today' ? gameDate() : addDays(gameDate(), -1))) return;
  tb.innerHTML = '';
  if (!r) { note.hidden = false; note.textContent = t('offline'); $('myAlias').textContent = ''; $('rerollBtn').hidden = true; return; }
  $('tabState').textContent = t(r.estado === 'cerrada' ? 'final' : 'live');
  if (!r.filas.length) { note.hidden = false; note.textContent = t(tabDay === 'yest' ? 'empty_table_y' : 'empty_table'); }
  else if (r.jugadores < 10) { note.hidden = false; note.textContent = t(tabDay === 'yest' ? 'few_players_y' : 'few_players'); }
  const head = document.createElement('div'); head.className = 'tr h'; head.innerHTML = '<span>' + t('col_pos') + '</span><span>' + t('col_astro') + '</span><span class="v">' + t('col_time') + '</span><span class="v">' + t('col_guided') + '</span><span class="v">' + t('col_total') + '</span>'; if (r.filas.length) tb.appendChild(head);
  const row = (x, cls) => { const d = document.createElement('div'); d.className = 'tr ' + (cls || ''); const ring = '<i style="' + (x.rank === 4 ? 'border-color:#00f2cf;box-shadow:0 0 0 1.5px #7700f4' : 'border-color:' + R.RANKCOL[x.rank || 0]) + '"></i>'; d.innerHTML = '<span class="n">' + x.p + '</span><span class="a">' + ring + '<span>' + (x.yo ? t('you') + ' · ' : '') + I.alias(x.alias_seed) + '</span></span><span class="v">' + fmtTime(x.tiempo_ms / 1000) + '</span><span class="v">' + x.guiados + '</span><span class="v">' + fmtNum(x.total) + '</span>'; tb.appendChild(d); };
  r.filas.forEach(x => row(x, (x.yo ? 'me ' : '') + (r.faro && r.faro.p === x.p ? 'faro' : '')));
  if (r.yo && !r.filas.some(x => x.yo)) row(r.yo, 'me');
  if (r.faro && r.faro.guiados > 0) { const fd = document.createElement('p'); fd.className = 'note'; fd.textContent = t('lighthouse_day') + ': ' + I.alias(r.faro.alias_seed) + ' · ' + r.faro.guiados + ' ' + t(r.faro.guiados === 1 ? 'guided1' : 'guided'); tb.appendChild(fd); }
  $('myAlias').textContent = t('you') + ': ' + I.alias(r.alias_seed || 0); $('rerollBtn').hidden = !(r.rerolls_left > 0); $('rerollBtn').textContent = t('reroll') + ' · ' + t('reroll_left', { n: r.rerolls_left });
}
$('rerollBtn').addEventListener('click', async () => { sfx('ui_tap'); try { await N.post('alias', { jugador: PLAYER, fecha: gameDate() }); renderTable(); } catch (e) { toast(t(e.code === 'rate_limited' ? 'rate_limited' : 'server_error'), 'warn'); } });

/* ---------------- BITÁCORA (5.10) ---------------- */
function openLog() { openOver('logs'); renderLog(); }
async function renderLog() {
  const list = $('logList'); list.innerHTML = '<div class="tr sk"></div><div class="tr sk"></div>';
  drawLogAstro(); setRank(ST.prof.guided);
  let r = null; try { r = await N.getRetry('bitacora', { jugador: PLAYER }); } catch (e) { r = null; }
  if (ST.scene !== 'logs' && overlayStack.indexOf('logs') < 0) return;
  list.innerHTML = '';
  let items = [];
  if (r) { ST.prof.guided = r.guiados_total; ST.prof.rank = rankOf(r.guiados_total); saveProf(); setRank(r.guiados_total); items = r.balizas.map(b => Object.assign({}, b)); }
  else { for (let i = 0; i < 8; i++) { const f = addDays(gameDate(), -i), d = ls(dayKey(f)); if (d && d.off && d.off.placed) d.off.placed.forEach(b => items.push({ fecha: f, x: b.x, y: b.y, s: b.s, d: b.d, g: null, u: null, e: null, oculta: 0 })); } }
  if (!items.length) { const p = document.createElement('p'); p.className = 'note'; p.textContent = t('log_empty'); list.appendChild(p); return; }
  items.forEach(b => {
    const el = document.createElement('button'); el.className = 'lrow'; const di = G.dayIndex(b.fecha);
    el.innerHTML = R.glyphSVG(b.s, b.d) + '<span class="lb">' + t('sym_' + b.s) + ' · ' + t('weekdays_s')[di] + ' ' + fmtDate(b.fecha) + '<small>' + (b.g != null ? b.g + ' ' + t(b.g === 1 ? 'guided1' : 'guided') + ' · ' + b.u + ' ' + t(b.u === 1 ? 'useful_n1' : 'useful_n') + ' · ' + b.e + ' ' + t(b.e === 1 ? 'misleading_n1' : 'misleading_n') : t('offline_badge')) + '</small></span><span class="st' + (b.oculta ? ' off' : '') + '">' + t(b.oculta ? 'hidden_by_votes' : 'visible') + '</span><canvas width="560" height="220"></canvas>';
    el.addEventListener('click', () => { sfx('ui_toggle'); el.classList.toggle('open'); if (el.classList.contains('open')) { const f = field(b.fecha), c = el.querySelector('canvas').getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0); R.drawMap(c, null, f, 0, 0, 280, 110, { all: 1, beacons: [b], view: { x0: b.x - 14, x1: b.x + 14, y0: b.y - 5.5, y1: b.y + 5.5 } }); } });
    list.appendChild(el);
  });
}
function setRank(g) { const rk = rankOf(g), nx = RANK_AT[rk + 1]; $('logRank').textContent = t('ranks')[rk]; $('logRankTxt').textContent = nx ? t('rank_progress', { r: t('ranks')[rk + 1], a: g, b: nx }) : t('rank_max', { r: t('ranks')[rk], a: g }); setTimeout(() => { $('logBar').style.width = (nx ? Math.min(100, (g - RANK_AT[rk]) / (nx - RANK_AT[rk]) * 100) : 100) + '%'; }, 60); }
function drawLogAstro() { const cv = $('logAstro'), c = cv.getContext('2d'), dpr = 2; cv.width = cv.height = 96 * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, 96, 96); const rk = ST.prof.rank; c.lineWidth = 4; if (rk === 4) { const g = c.createLinearGradient(0, 0, 96, 96); g.addColorStop(0, '#7700f4'); g.addColorStop(1, '#00f2cf'); c.strokeStyle = g; } else c.strokeStyle = R.RANKCOL[rk]; c.beginPath(); c.arc(48, 48, 44, 0, 7); c.stroke(); TS = 46; drawAstro(c, 48, 52, 'd', 0, false, 0, performance.now() / 1000, 0); }

/* ---------------- ARCHIVO (5.11) ---------------- */
function openArchive() { openOver('arch'); renderArchive(); }
function renderArchive() {
  const list = $('archList'); list.innerHTML = '';
  for (let i = 1; i <= 7; i++) {
    const f = addDays(gameDate(), -i), di = G.dayIndex(f), d = ls(dayKey(f)), played = d && d.off && (d.off.status === 'done' || d.off.status === 'abandoned');
    const b = document.createElement('button'); b.className = 'arow';
    b.innerHTML = '<b>' + t('weekdays')[di] + '</b><small>' + fmtDate(f) + ' · ' + t('days')[di] + '</small><span class="st' + (played ? '' : ' no') + '">' + t(played ? 'played' : 'not_played') + '</span>';
    b.addEventListener('click', () => { sfx('ui_tap'); overlayStack = []; openDay('archivo', f); });
    list.appendChild(b);
  }
}

/* ---------------- CÓMO JUGAR (5.12) ---------------- */
let helpRaf = 0;
function openHelp(fromPause) {
  openOver('help'); renderLegend();
  $('replayTut').hidden = !!fromPause;
  const cvs = [1, 2, 3].map(i => $('vg' + i)); const dpr = Math.min(2, devicePixelRatio || 1); cvs.forEach(c => { c.width = 300 * dpr; c.height = 190 * dpr; });
  const t0 = performance.now(); cancelAnimationFrame(helpRaf);
  (function fr(now) {
    const s = (now - t0) / 1000;
    cvs.forEach((cv, i) => { const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#0a0418'; c.fillRect(0, 0, 300, 190); vignette(i, c, s); });
    if (ST.scene === 'help') helpRaf = requestAnimationFrame(fr);
  })(t0);
}
function renderLegend() { const lg = $('legend'); lg.innerHTML = ''; ORDER.forEach(s => { const d = document.createElement('div'); d.innerHTML = R.glyphSVG(s, 0) + '<span>' + t('sym_' + s) + '</span>'; lg.appendChild(d); }); }
function vignette(i, c, s) {
  const u = s % 4;
  if (i === 0) { // inercia y freno
    const p = u < 2 ? u / 2 : 1, x = 40 + 200 * (1 - Math.pow(1 - p, 2)) + (u > 2 ? Math.min(20, (u - 2) * 30) * (1 - Math.min(1, (u - 2) / 0.8)) : 0);
    c.fillStyle = '#170b2c'; c.fillRect(268, 30, 30, 130); c.strokeStyle = 'rgba(119,0,244,.6)'; c.strokeRect(268, 30, 30, 130);
    R.drawShip(c, Math.min(x, 248), 95, 0, 34, u < 1.5 ? 0.8 : 0, u > 2 && u < 3, s, 1);
    c.strokeStyle = 'rgba(0,242,207,.5)'; c.lineWidth = 2; c.beginPath(); c.arc(60, 150, 22, 0, 7); c.stroke(); c.fillStyle = 'rgba(0,242,207,.5)'; c.beginPath(); c.arc(60 + (u < 1.5 ? 14 : 0), 150, 10, 0, 7); c.fill();
    c.fillStyle = u > 2 && u < 3 ? 'rgba(255,176,32,.9)' : 'rgba(245,240,255,.25)'; c.beginPath(); c.arc(240, 160, 16, 0, 7); c.fill();
  } else if (i === 1) { // niebla y baliza seguida
    const p = u / 4, sx = 50 + p * 190, sy = 150 - p * 100 + Math.sin(p * 6) * 6;
    c.fillStyle = '#170b2c'; c.fillRect(0, 0, 300, 40); c.fillRect(0, 160, 300, 30); c.fillRect(0, 40, 26, 120);
    R.drawBeacon(c, { s: 'flecha', d: 1, id: 3, rank: 1 }, 150, 90, 12, s, 1, false, 1);
    R.drawShip(c, sx, sy, Math.PI / 4, 26, 0.6, 0, s, 1);
    const g = c.createRadialGradient(sx, sy, 30, sx, sy, 90); g.addColorStop(0, 'rgba(10,4,24,0)'); g.addColorStop(1, 'rgba(10,4,24,.96)'); c.fillStyle = g; c.fillRect(0, 0, 300, 190);
  } else { // colocar baliza y guiados
    c.fillStyle = '#170b2c'; c.fillRect(0, 150, 300, 40);
    R.drawShip(c, 90, 100, Math.PI / 2, 30, 0, u < 1, s, 1);
    if (u > 1) { const k = Math.min(1, (u - 1) * 3); R.drawBeacon(c, { s: 'peligro', d: 0, id: 1, rank: 2 }, 150, 110, 13 * k, s, 1, false, 1); if (u < 1.6) { c.strokeStyle = 'rgba(0,242,207,' + (1.6 - u).toFixed(2) + ')'; c.beginPath(); c.arc(150, 110, (u - 1) * 120, 0, 7); c.stroke(); } }
    if (u > 1.8) { c.font = '700 22px "JetBrains Mono",monospace'; c.fillStyle = '#00f2cf'; c.textAlign = 'center'; c.fillText('+' + Math.min(14, Math.floor((u - 1.8) * 9)), 230, 70); TS = 34; drawAstro(c, 230, 120, 'd', 0, false, 0, s, 0); }
  }
}
$('replayTut').addEventListener('click', () => { sfx('ui_tap'); ST.prof.tutStep = 1; saveProf(); overlayStack = []; startTutorial(); });

/* ---------------- AJUSTES (5.13) ---------------- */
function setTog(el, v) { el.classList.toggle('on', !!v); el.setAttribute('aria-checked', !!v); }
function syncSettings() {
  const s = ST.set; setTog($('musTog'), s.mus); setTog($('sfxTog'), s.sfx); setTog($('vibTog'), s.vib); setTog($('trailSet'), s.trails == null ? ST.prof.flights > 0 : s.trails); setTog($('miniTog'), s.mini); setTog($('shakeTog'), s.shake); setTog($('contrastTog'), s.contrast);
  $('musVol').value = s.musV; $('sfxVol').value = s.sfxV;
  document.querySelectorAll('.langseg button').forEach(b => { b.classList.toggle('on', b.dataset.v === I.lang); b.setAttribute('aria-pressed', b.dataset.v === I.lang); });
  $('ctlSeg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === s.ctl));
  $('sideSeg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === s.side));
  $('fsRow').hidden = !ST.fsAPI; $('vibRow').hidden = !navigator.vibrate; syncFsUI();
  const rb = $('resetBtn'); rb.classList.remove('arm'); rb.textContent = t('reset_progress');
}
function openSettings(fromPause) { openOver('settings'); syncSettings(); }
function bindTog(id, key, after) { $(id).addEventListener('click', () => { ST.set[key] = ST.set[key] ? 0 : 1; if (key === 'trails') ST.set.trails = $(id).classList.contains('on') ? 0 : 1; saveSet(); syncSettings(); sfx('ui_toggle'); if (after) after(); }); }
bindTog('musTog', 'mus', applyAudio); bindTog('sfxTog', 'sfx', () => { applyAudio(); if (!ST.set.sfx) A.loopsOff(); });
bindTog('vibTog', 'vib', () => vib(15)); bindTog('trailSet', 'trails'); bindTog('miniTog', 'mini', () => { $('mini').hidden = !ST.set.mini; });
bindTog('shakeTog', 'shake', () => { R.opts.shake = ST.set.shake; }); bindTog('contrastTog', 'contrast', () => { R.opts.contrast = ST.set.contrast; });
$('musVol').addEventListener('input', e => { ST.set.musV = +e.target.value; applyAudio(); saveSet(); });
$('sfxVol').addEventListener('input', e => { ST.set.sfxV = +e.target.value; applyAudio(); saveSet(); });
$('sfxVol').addEventListener('change', () => sfx('ui_tap'));
$('fsTog').addEventListener('click', () => { sfx('ui_toggle'); toggleFs(); });
document.querySelectorAll('.langseg').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; sfx('ui_toggle'); if (window.JETIdioma) window.JETIdioma.set(b.dataset.v); else { I.lang = b.dataset.v; relang(); } }));
// Cambio de idioma en vivo: repinta todo lo visible y lo que queda debajo, sin tocar la partida.
window.addEventListener('jet-idioma', () => relang());
function relang() {
  if (window.JETIdioma) I.lang = window.JETIdioma.get();
  I.apply(); syncSettings(); syncOffline();
  const here = overlayStack.concat([ST.scene]), has = id => here.indexOf(id) >= 0;
  if (ST.today && has('home')) renderHome();
  if (ST.pending && has('day')) { const p = ST.pending; paintDay(p.mode, p.fecha, p.resume, p.intro); }
  const fl = ST.fl;
  if (fl && !fl.ended && fl.paused) paintPause(fl);
  if (tutLine.key && !$('tutLine').hidden) $('tutLine').textContent = t(tutLine.key);
  if (fl && fl.ended && fl.score && fl.mode !== 'tutorial' && has('result')) paintResText(fl);
  if (has('table')) renderTable();
  if (has('logs')) { setRank(ST.prof.guided); renderLog(); }
  if (has('arch')) renderArchive();
  if (has('help')) renderLegend();
}
$('ctlSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; ST.set.ctl = b.dataset.v; saveSet(); syncSettings(); sfx('ui_toggle'); });
$('sideSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; ST.set.side = b.dataset.v; saveSet(); syncSettings(); layoutControls(); sfx('ui_toggle'); });
let resetT = 0;
$('resetBtn').addEventListener('click', () => {
  const b = $('resetBtn');
  if (!b.classList.contains('arm')) { b.classList.add('arm'); b.textContent = t('reset_confirm'); sfx('ui_error'); clearTimeout(resetT); resetT = setTimeout(() => { b.classList.remove('arm'); b.textContent = t('reset_progress'); }, 3000); return; }
  clearTimeout(resetT);
  try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.startsWith(P) && k !== P + 'id' && k !== P + 'ajustes') localStorage.removeItem(k); } } catch (e) {}
  ST.prof = Object.assign({}, DEF_PROF); ST.fl = null; toast(t('reset_done'), 'good'); sfx('ui_back'); overlayStack = []; goHome();
});

/* ---------------- ganchos de prueba ---------------- */
window.BALIZAS = {
  estado: () => ({ scene: ST.scene, fecha: gameDate(), mode: ST.fl && ST.fl.mode, S: ST.fl ? { x: ST.fl.S.x, y: ST.fl.S.y, vx: ST.fl.S.vx, vy: ST.fl.S.vy, t: ST.fl.S.t, hull: ST.fl.S.hull, done: ST.fl.S.done, placed: ST.fl.S.placed.length, seen: Object.keys(ST.fl.S.seen).length, rescue: !!ST.fl.S.rescue } : null, paused: ST.fl ? ST.fl.paused : null, count: ST.fl ? ST.fl.count : null, prof: ST.prof, set: ST.set, online: N.online, queue: N.queue.length, ppc: R.ppc, w: R.w, h: R.h, lang: I.lang, tut: ST.fl && ST.fl.tut ? ST.fl.tut.step : null }),
  fecha: f => { ST.forceDate = f || null; goHome(); return gameDate(); },
  generar: f => { const x = G.generate(f || gameDate()); return x && { hash: x.hash, k: x.k, par: x.par, H: x.H, ms: x.ms, route: x.route, mines: x.mines.length, drifts: x.drifts.length, practice: x.practice.length }; },
  verificar: f => { const x = G.generate(f || gameDate()); return !!(x && x.ok); },
  teletransportar: (x, y) => { const S = ST.fl && ST.fl.S; if (!S) return false; S.x = x; S.y = y; S.vx = S.vy = 0; Sm.explore(S, true); return true; },
  paso: n => { const fl = ST.fl; if (!fl) return null; fl.count = 0; $('count').hidden = true; for (let i = 0; i < (n || 1); i++) Sm.step(fl.S, { ax: 0, ay: 0 }); handleEvents(fl, 0); return fl.S.t; },
  ponerBaliza: (s, d) => { const fl = ST.fl; if (!fl) return null; fl.S.vx = fl.S.vy = 0; const r = Sm.place(fl.S, s, d); if (r.ok) fl.waves.push({ x: r.b.x, y: r.b.y, age: 0 }); return r; },
  llegar: () => { const fl = ST.fl; if (!fl) return false; fl.count = 0; fl.S.x = fl.f.gate[0]; fl.S.y = fl.f.gate[1] - 1; fl.S.vx = 0; fl.S.vy = 1; return true; },
  servidor: u => { N.base = u === undefined ? 'api.php' : u; N.online = !!u; syncOffline(); return N.base; },
  abrir: s => { ({ inicio: goHome, tabla: openTable, bitacora: openLog, archivo: openArchive, ayuda: openHelp, ajustes: openSettings, tutorial: startTutorial, hoy: () => openDay('oficial', gameDate()), libre: () => openDay('libre', gameDate()) })[s](); },
  despegar: () => $('takeoffBtn').click(), pausa: () => pauseFlight('test'), continuar: () => resumeFlight(),
  piloto: v => { ST.auto = v === true ? 3.2 : (v || 0); return ST.auto; },
  campo: () => ST.fl && ST.fl.f, sim: () => ST.fl && ST.fl.S, R, A, N, ST
};

/* ---------------- arranque ---------------- */
function boot() {
  ST.touch = !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
  if (qs.get('fecha') && /^\d{4}-\d{2}-\d{2}$/.test(qs.get('fecha'))) ST.forceDate = qs.get('fecha');
  R.init(cv); I.apply(); cleanOld(); onResize(); layoutControls(); syncSettings();
  R.opts.reduced = reducedMQ.matches; R.opts.contrast = ST.set.contrast; R.opts.shake = ST.set.shake;
  if (!ST.fsAPI) $('fsHome').hidden = true;
  goHome();
  requestAnimationFrame(t0 => { last = t0; requestAnimationFrame(loop); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
})();
