// JET//Estación Silencio · interfaz: flujo de pantallas, salas, Anillo, inspector, barra de respuesta, ayudas y bucle.
'use strict';
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const CO = CORE, C = CO.C, Pf = CO.P;
  const t = (k, v) => I18N.t(k, v), L2 = (p) => I18N.L2(p);
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const Q = new URLSearchParams(location.search);
  const DEBUG = Q.has('debug'), DEMO = Q.has('demo');
  const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const FS_OK = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen) && !IOS;

  const APP = { scr: 'boot', mod: null, insp: null, cx: null, R: null, paused: false, daily: null, busy: false, cool: 0, wrongs: [], tm: 0, last: performance.now(),
    rs: { px: 0, ax: 150, tx: 150, ph: 0, face: 'r', sel: null, hover: null, pending: null, hot: [] }, hs: { cur: 'oxigeno' }, zoom: { z: 1, x: 0, y: 0 }, stack: [], dailyMs: 0, perf: { verify: [] } };
  window.APP = APP;
  const cv = $('#cv'), g = cv.getContext('2d'), icv = $('#iCv'), ig = icv.getContext('2d');
  let W = innerWidth, H = innerHeight, DPR = 1, IW = 0, IH = 0;

  // ================= idioma y preferencias =================
  // Idioma único del sitio (src/jet-idioma.js): ?lang > cookie jet_lang de .jetgames.fun / localStorage > navegador.
  function initLang() {
    if (Pf.lang === 'es' || Pf.lang === 'en') { // migración única del idioma propio de versiones anteriores
      let saved = /(?:^|;\s*)jet_lang=(es|en)\b/.test(document.cookie); try { saved = saved || !!localStorage.getItem('jet_lang'); } catch (e) { }
      if (!saved && !/[?&]lang=(es|en)\b/.test(location.search)) JETIdioma.set(Pf.lang);
    }
    if ('lang' in Pf) { delete Pf.lang; CO.savePrefs(); }
    I18N.setLang(JETIdioma.get()); applyTexts();
  }
  // Cambio en vivo: repinta todo lo visible sin cerrar la partida ni perder lo escrito.
  function onLang() {
    if (I18N.LANG === JETIdioma.get()) return;
    I18N.setLang(JETIdioma.get()); applyTexts();
    if (DEMO) return;
    const open = APP.stack.filter(e => e.isConnected && !e.classList.contains('out') && e._re).map(e => { const c = e.querySelector('.card'); return { e, re: e._re, top: c ? c.scrollTop : 0 }; });
    refreshAfterLang(); const hc = document.querySelector(".home .hcard"); if (hc) hc.style.animation = "none";
    open.forEach(o => { APP.stack = APP.stack.filter(x => x !== o.e); o.e.remove(); });
    open.forEach(o => { o.re(); const n = APP.stack[APP.stack.length - 1]; const c = n && n.querySelector('.card'); if (c) { c.style.animation = 'none'; c.scrollTop = o.top; } });
    refreshFSButtons();
  }
  addEventListener('jet-idioma', onLang);
  const LANG_SEG = () => `<div class="seg lang" role="group" aria-label="${t('s.lang')}"><button type="button" data-l="es" class="${I18N.LANG === 'es' ? 'on' : ''}" aria-pressed="${I18N.LANG === 'es'}" lang="es">ES</button><button type="button" data-l="en" class="${I18N.LANG === 'en' ? 'on' : ''}" aria-pressed="${I18N.LANG === 'en'}" lang="en">EN</button></div>`;
  const bindLang = (el) => el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => JETIdioma.set(b.dataset.l));
  function applyTexts() {
    document.querySelectorAll('[data-t]').forEach(e => e.textContent = t(e.dataset.t));
    document.querySelectorAll('[data-a]').forEach(e => { e.setAttribute('aria-label', t(e.dataset.a)); if (!e.title || !/^(Alt|P)/.test(e.title)) e.title = t(e.dataset.a); });
    $('#ans').placeholder = t('answer.placeholder'); $('#offerBtn').textContent = '💡 ' + t('hint.offer');
    document.title = t('title') + (I18N.LANG === 'en' ? ' · Escape room in 34 puzzles' : ' · Escape room en 34 enigmas');
    const md = document.querySelector('meta[name=description]'); if (md) md.content = I18N.LANG === 'en' ? 'You wake up on a drifting station and do not remember your name. An escape room in 34 puzzles for phone, tablet and computer.' : 'Despiertas en una estación a la deriva y no recuerdas tu nombre. Un escape room de 34 enigmas para teléfono, tablet y computadora.';
  }
  function applyA11y() {
    const reduce = Pf.reduce == null ? matchMedia('(prefers-reduced-motion: reduce)').matches : !!Pf.reduce;
    document.documentElement.classList.toggle('reduce', reduce); document.documentElement.classList.toggle('big', !!Pf.big); document.documentElement.classList.toggle('contrast', !!Pf.contrast);
  }

  // ================= tamaños, giro y pantalla completa =================
  function layout() {
    const vv = window.visualViewport; W = innerWidth; H = innerHeight; DPR = Math.min(3, window.devicePixelRatio || 1);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    const land = W > H * 1.05 && W >= 560; document.body.classList.toggle('land', land); document.body.classList.toggle('short', H < 500);
    let kb = 0; if (vv && document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) kb = Math.max(0, innerHeight - vv.height - vv.offsetTop);
    if (kb < 90) kb = 0; document.documentElement.style.setProperty('--kb', kb + 'px'); document.body.classList.toggle('kb', kb > 0);
    document.documentElement.style.setProperty('--topH', (land && H < 500) ? '44px' : '56px');
    sizeInsp(); drawPlate(); renderEnum();
  }
  function sizeInsp() { const st = $('#iStage'); if (!st || $('#insp').hidden) return; IW = st.clientWidth; IH = st.clientHeight; icv.width = Math.max(1, Math.round(IW * DPR)); icv.height = Math.max(1, Math.round(IH * DPR)); clampZoom(); }
  ['resize', 'orientationchange'].forEach(e => addEventListener(e, () => setTimeout(layout, e === 'orientationchange' ? 250 : 0)));
  if (window.visualViewport) visualViewport.addEventListener('resize', layout);
  function isFS() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function toggleFS() { try { if (isFS()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else { const el = document.documentElement; (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' }); } } catch (e) { } }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => { setTimeout(layout, 120); if (!isFS() && inGame() && !APP.paused) pause(); refreshFSButtons(); }));
  function refreshFSButtons() { const on = isFS(), lb = on ? t('fullscreen.exit') : t('fullscreen'); document.querySelectorAll('[data-fs]').forEach(b => { if (b.classList.contains('tog')) { b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); return; } const s = b.querySelector('.lbl'); if (s) { s.textContent = lb; b.setAttribute('aria-label', lb); b.title = lb; } else b.textContent = lb; }); }
  const FS_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  const inGame = () => ['room', 'hub'].includes(APP.scr) || APP.insp;

  // ================= utilidades =================
  function fmtTime(ms) { const m = Math.round(ms / 60000); if (m < 1) return '<1 ' + t('mins'); if (m < 60) return m + ' ' + t('mins'); return Math.floor(m / 60) + ' ' + t('h') + ' ' + String(m % 60) + ' ' + t('mins'); }
  let saveTimer = 0; function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(() => CO.saveGame(), 400); }
  function toast(msg, kind = '', o = {}) {
    const box = $('#toasts'); const el = document.createElement('div'); el.className = 'toast ' + kind; el.innerHTML = `<span>${esc(msg)}</span>`;
    if (o.action) { const b = document.createElement('button'); b.className = 'chip'; b.textContent = o.action.label; b.onclick = () => { o.action.fn(); el.remove(); }; el.appendChild(b); }
    box.appendChild(el); while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, o.ms || 2600);
  }
  // ---------- pantallas apiladas como diálogos (RSP-MODALS-01) ----------
  // Cada capa de la pila guarda su activador, recibe role/aria-modal/aria-labelledby, vuelve inerte al fondo
  // (#insp, cabecera, lista de paneles…) y a las capas inferiores, enfoca su primer control útil y, al cerrar,
  // devuelve el foco al activador si sigue visible. El ciclo Tab se contiene en el teclado (ver addEventListener('keydown')).
  const BASE_INERT = ['#insp', '#top', '#roomList', '#roomPan', '#hubBar', '#plateBar', '#bGear', '#back'];
  const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
  const visible = (el) => !!el && el.isConnected && !el.closest('[hidden]') && !el.closest('[inert]') && el.getClientRects().length > 0;
  const focusables = (root) => [...root.querySelectorAll(FOCUSABLE)].filter(visible);
  let dlgN = 0;
  function liveStack() { return APP.stack.filter(e => e.isConnected && !e.classList.contains('out')); }
  function syncInert() {
    const live = liveStack(); const topEl = live[live.length - 1]; const modal = live.some(e => !e.classList.contains('home'));
    BASE_INERT.forEach(s => { const el = $(s); if (el) el.inert = modal; });
    live.forEach(e => { e.inert = e !== topEl; });
  }
  function focusFirst(el) { const card = el.querySelector('.card') || el; const pref = card.querySelector('[data-focus]'); const f = (pref && visible(pref) && !pref.disabled) ? pref : focusables(card).find(x => !x.classList.contains('x')) || focusables(card)[0]; (f || card).focus({ preventScroll: true }); }
  function screen(html, cls = 'veil', opener) {
    const el = document.createElement('div'); el.className = 'scr ' + cls; el.innerHTML = html; $('#layer').appendChild(el); APP.stack.push(el);
    el._opener = opener || document.activeElement;
    const card = el.querySelector('.card');
    if (card && !el.classList.contains('home')) {
      card.setAttribute('role', el.classList.contains('confirm') ? 'alertdialog' : 'dialog'); card.setAttribute('aria-modal', 'true');
      const hd = card.querySelector('h1,h2,h3,.big-t,.kick'); if (hd) { if (!hd.id) hd.id = 'dlg-t' + (++dlgN); card.setAttribute('aria-labelledby', hd.id); }
      if (!card.hasAttribute('tabindex')) card.tabIndex = -1;
    }
    syncInert();
    el.addEventListener('click', (e) => { const b = e.target.closest('button,a'); if (b && !b.classList.contains('nosfx')) AU.sfx('tap'); });
    if (!el.classList.contains('home') && card) requestAnimationFrame(() => { if (el.isConnected && !el.contains(document.activeElement)) focusFirst(el); });
    return el;
  }
  function closeScreen(el) {
    if (!el || !el.isConnected) return; const op = el._opener; APP.stack = APP.stack.filter(x => x !== el); el.classList.add('out'); el.inert = true; syncInert();
    setTimeout(() => el.remove(), 200);
    if (op && op !== document.body && visible(op) && !op.disabled) { op.focus({ preventScroll: true }); return; }
    const tp = top(); if (tp) { focusFirst(tp); return; }
    if (APP.insp) { const a = $('#ans'); (a.disabled ? $('#iClose') : a).focus({ preventScroll: true }); }
  }
  function closeAll() { APP.stack.slice().forEach(closeScreen); }
  function top() { return APP.stack[APP.stack.length - 1]; }
  // Confirmación explícita (alertdialog): foco inicial en Cancelar, botón de peligro con verbo concreto, enumera lo que cambia.
  function confirmDlg(o) {
    const el = screen(`<div class="card" style="max-width:420px"><div class="head"><h2>${esc(o.title)}</h2></div>${o.body ? `<p class="cf-body">${esc(o.body)}</p>` : ''}${o.keep ? `<p class="cf-keep">${esc(o.keep)}</p>` : ''}${o.backup ? `<button class="btn" type="button" data-k="bk">${t('s.copyRescue')}</button>` : ''}<div class="row cf-row"><button class="btn" type="button" data-k="no" data-focus>${t('cancel')}</button><button class="btn ${o.danger ? 'danger strong' : 'pri'}" type="button" data-k="yes">${esc(o.ok)}</button></div></div>`, 'veil confirm', o.opener);
    el.querySelector('[data-k=no]').onclick = () => closeScreen(el);
    el.querySelector('[data-k=yes]').onclick = () => { closeScreen(el); o.onOk(); };
    const bk = el.querySelector('[data-k=bk]'); if (bk) bk.onclick = () => copyOrShow(CO.rescueCode(), t('s.codeCopied'), bk);
    el.addEventListener('click', (e) => { if (e.target === el) closeScreen(el); });
    return el;
  }
  // ---------- compartir / copiar (SRC-G06) ----------
  // copyText devuelve true sólo con copia confirmada; si falla, un diálogo persistente muestra el texto para copiarlo a mano.
  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) { try { await navigator.clipboard.writeText(text); return true; } catch (e) { } }
    const prev = document.activeElement; const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy') === true; } catch (e) { ok = false; } ta.remove(); if (prev && prev.focus) prev.focus({ preventScroll: true }); return ok;
  }
  function showCopyFallback(text, opener) {
    const el = screen(`<div class="card" style="max-width:460px"><div class="head"><h2>${t('share')}</h2><button class="x" type="button" data-k="x" aria-label="${t('close')}">×</button></div><p class="cf-body">${t('share.fail')}</p><textarea class="sf-ta" readonly aria-label="${t('share')}"></textarea><div class="row cf-row"><button class="btn" type="button" data-k="x2">${t('close')}</button><button class="btn pri" type="button" data-k="cp" data-focus>${t('share.copy')}</button></div></div>`, 'veil', opener);
    const ta = el.querySelector('textarea'); ta.value = text;
    el.querySelector('[data-k=x]').onclick = el.querySelector('[data-k=x2]').onclick = () => closeScreen(el);
    el.querySelector('[data-k=cp]').onclick = async () => { ta.focus(); ta.select(); const ok = await copyText(text); if (ok) { toast(t('share.copied'), 'ok'); closeScreen(el); } else { ta.focus(); ta.select(); } };
    return el;
  }
  async function copyOrShow(text, okMsg, opener) { if (await copyText(text)) toast(okMsg, 'ok'); else showCopyFallback(text, opener); }
  function share(text, opener) {
    if (navigator.share) { navigator.share({ text }).catch((err) => { if (err && err.name === 'AbortError') return; copyOrShow(text, t('share.copied'), opener); }); return; }
    copyOrShow(text, t('share.copied'), opener);
  }
  function fade(fn, ms = 320) { const f = $('#fade'); f.classList.add('on'); setTimeout(() => { fn(); requestAnimationFrame(() => f.classList.remove('on')); }, ms); }
  function door(fn) { if (document.documentElement.classList.contains('reduce')) return fade(fn, 150); const d = document.createElement('div'); d.className = 'door'; d.innerHTML = '<i></i><i></i>'; d.classList.add('open'); document.body.appendChild(d); requestAnimationFrame(() => { d.classList.remove('open'); AU.sfx('door'); setTimeout(() => { fn(); requestAnimationFrame(() => { d.classList.add('open'); setTimeout(() => d.remove(), 400); }); }, 340); }); }

  // ================= partida =================
  function newGame(seed) { CO.G = CO.freshGame(seed == null ? CO.newSeed() : seed); CO.saveGame(); }
  function solvedCount(mod) { return (CO.MOD_PUZ[mod] || []).filter(CO.isSolved).length; }
  function musicFor() {
    if (APP.scr === 'home' || APP.scr === 'dailyHome') AU.music('menu', 3);
    else if (APP.scr === 'hub') AU.music('hub', 2 + Math.min(3, CO.modulesDone()));
    else if (APP.scr === 'room') AU.music(APP.mod === 'observatorio' ? 'observatorio' : APP.mod, 1 + solvedCount(APP.mod));
  }
  function setGameChrome(on) {
    document.body.classList.toggle('ingame', on); $('#top').hidden = !on; document.body.classList.toggle('inhub', on && APP.scr === 'hub');
    $('#roomList').hidden = !(on && APP.scr === 'room'); $('#hubBar').hidden = !(on && APP.scr === 'hub'); if (!(on && APP.scr === 'room')) $('#roomPan').hidden = true;
    $('#plateBar').hidden = !(on && APP.scr === 'hub' && CO.isSolved('p3'));
    $('#bRing').hidden = !(APP.scr === 'room' && CO.isSolved('p3')); document.body.classList.toggle('ringon', !$('#bRing').hidden && on);
    $('#bMap').hidden = !CO.isSolved('p3');
    $('#roomTitle').textContent = APP.scr === 'hub' ? (I18N.LANG === 'en' ? 'RING' : 'ANILLO') : APP.scr === 'room' ? t('m.' + APP.mod) : '';
    document.documentElement.style.setProperty('--mod', CO.MOD_COL[APP.mod] || '#9fb4ff');
    $('#logDot').classList.toggle('on', Object.values(CO.G ? CO.G.rec : {}).includes('new'));
    $('#hubStars').textContent = CO.G ? '★ ' + CO.totalStars() : '';
  }
  function enterRoom(mod, opts = {}) {
    closeAll(); APP.scr = 'room'; APP.mod = mod; CO.G.room = mod; saveSoon();
    const rs = APP.rs; rs.sel = null; rs.pending = null; rs.ax = rs.tx = opts.ax || 160; rs.face = 'r'; rs.px = 0;
    AU.key(mod); AU.ambience(mod, solvedCount(mod)); musicFor(); setGameChrome(true); renderRoomList();
    if (opts.open) setTimeout(() => selectPanel(opts.open, true), 250);
  }
  function goHub() { closeInsp(true); closeAll(); APP.scr = 'hub'; APP.mod = null; CO.G.room = 'hub'; saveSoon(); AU.key('prologo'); AU.ambience('hub', 0); musicFor(); setGameChrome(true); drawPlate();
    if (!CO.G.ui._hubSeen) { APP.hs.firstHint = true; CO.G.ui._hubSeen = 1; setTimeout(() => APP.hs.firstHint = false, 5000); } }
  function goHome() { closeInsp(true); closeAll(); APP.scr = 'home'; setGameChrome(false); AU.ambience(null); musicFor(); showHome(); }

  // ================= lista de paneles =================
  function renderRoomList() {
    const nav = $('#roomList'); if (APP.scr !== 'room') { nav.hidden = true; return; } nav.hidden = !!APP.insp;
    const ids = (SC.PANELS[APP.mod] || []).map(p => p[0]).sort((a, b) => (C.puzzles[a].meta ? 1 : 0) - (C.puzzles[b].meta ? 1 : 0));
    nav.innerHTML = ids.map(id => {
      const P0 = C.puzzles[id], ok = CO.isSolved(id), unl = CO.puzzleUnlocked(id); const st = CO.G.pz[id];
      const right = ok ? '★'.repeat(st.stars) + '☆'.repeat(3 - st.stars) : P0.meta && P0.mod !== 'observatorio' ? `<span class="frs">${[0, 1, 2, 3].map(f => `<i style="background:${CO.isSolved(CO.MOD_PUZ[APP.mod][f]) ? DR.FRAG_COL[f] : ''}"></i>`).join('')}</span>` : '';
      // estado por texto e icono, derivado del estado real (PLAY-ESTACION-07 / VIS-ESTACION-06): resuelto ✓, bloqueado 🔒, disponible punto fijo
      const state = ok ? (st.stars === 1 ? t('pc.solved1') : t('pc.solved', { estrellas: st.stars })) : unl ? t('pc.avail') : t('puz.locked');
      const name = t('pc.name', { 'número': SC.shortId(id), nombre: L2(P0.t) }) + ' · ' + state;
      const cur = APP.rs.sel === id;
      return `<button class="pc ${ok ? 'ok' : ''} ${unl ? '' : 'lock'} ${P0.meta ? 'meta' : ''}" data-id="${id}" type="button" aria-label="${esc(name)}"${cur ? ' aria-current="true"' : ''}><i class="led" aria-hidden="true"><svg class="ck" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg><svg class="lk" viewBox="0 0 24 24"><rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/></svg></i><span class="tx"><b>${SC.shortId(id)}${P0.meta ? ' · META' : ''}</b><span class="nm">${esc(L2(P0.t))}</span><span class="pcs">${esc(state)}</span></span><span class="st" aria-hidden="true">${right}</span></button>`;
    }).join('');
    nav.querySelectorAll('.pc').forEach(b => b.onclick = () => { AU.sfx('tap'); selectPanel(b.dataset.id); });
  }
  function selectPanel(id, auto) {
    if (!CO.puzzleUnlocked(id)) { toast(t('puz.locked'), 'warn'); AU.sfx('wrong'); return; }
    const pnl = (SC.PANELS[APP.mod] || []).find(p => p[0] === id); if (!pnl) return;
    const rs = APP.rs; rs.sel = id; rs.tx = pnl[1] + (rs.ax < pnl[1] ? -170 : 170); rs.face = rs.tx > rs.ax ? 'r' : 'l'; rs.pending = id;
    if (document.documentElement.classList.contains('reduce') || Math.abs(rs.tx - rs.ax) < 5) { rs.ax = rs.tx; }
    rs.walkV = Math.max(400, Math.abs(rs.tx - rs.ax) / 0.6);
  }

  // ================= placa del traje =================
  function plateLetters() { const name = CO.nameOfGame(), order = CO.prevLoopOrder(); return CO.G.plate.map(m => name[order.indexOf(m)]); }
  function drawPlate() {
    const pc = $('#plateCv'); if (!pc || !CO.G) return; const w = 180, h = 24, d = Math.min(3, window.devicePixelRatio || 1); pc.width = w * d; pc.height = h * d; const p = pc.getContext('2d'); p.setTransform(d, 0, 0, d, 0, 0); p.clearRect(0, 0, w, h);
    const L = plateLetters(); const fin = CO.isSolved('final');
    for (let i = 0; i < 6; i++) { const x = 14 + i * 30; if (L[i]) SC.plateGlyph(p, L[i], x, 12, 20, fin ? 1 : 0, '#00f2cf'); else { p.strokeStyle = 'rgba(181,168,216,.35)'; p.strokeRect(x - 8, 3, 16, 18); } }
    $('#plateMiss').style.display = fin ? 'none' : '';
  }

  // ================= inspector =================
  function resolveData(V) { const d = V.d; const L = I18N.LANG; return d[L] ? Object.assign({}, d, d[L]) : d; }
  function openInsp(id, o = {}) {
    if (APP.insp) closeInsp(true);
    const daily = o.daily; const P0 = daily ? dailyPuzzle(daily) : C.puzzles[id]; const V = daily ? daily : CO.variantOf(id);
    const R = PZ[daily ? daily.type : P0.type]; if (!R) return;
    const ui = daily ? (APP.dailyUI ||= {}) : (CO.G.ui[id] ||= {});
    const cx = { id: daily ? 'daily' : id, P: P0, V, d: resolveData(V), lang: I18N.LANG, ui, daily: !!daily, w: 1, h: 1,
      owned: (f) => { if (daily) return true; const mod = P0.mod; return CO.isSolved(CO.MOD_PUZ[mod][f]); },
      sfx: (n, a) => AU.sfx(n, a), vib: (p) => AU.vibrate(p), save: () => saveSoon(), toast: (m, k) => toast(m, k), refreshTools: () => renderTools() };
    APP.insp = daily ? 'daily' : id; APP.cx = cx; APP.R = R; APP.zoom = { z: 1, x: 0, y: 0 };
    const el = $('#insp'); el.hidden = false; $('#roomList').hidden = true;
    $('#iTitle').textContent = L2(P0.t);
    $('#iTag').textContent = daily ? t('daily.title') + ' · ' + new Date().toLocaleDateString(I18N.LANG === 'en' ? 'en-GB' : 'es', { day: 'numeric', month: 'short' }).replace('.', '') : (P0.meta ? (P0.mod === 'observatorio' ? t('m.observatorio') : '◆ ' + t('m.' + P0.mod) + ' · META') : SC.shortId(id) + ' · ' + t('m.' + P0.mod));
    $('#iAmb').textContent = L2(P0.amb); $('#iQ').textContent = '› ' + L2(P0.q);
    const dom = $('#iDom'); dom.innerHTML = ''; icv.style.display = R.dom ? 'none' : 'block';
    if (R.dom) R.build(cx, dom);
    if (R.init) R.init(cx);
    renderTools(); renderHints(); renderAtt(); setAnsStatus('');
    const a11y = $('#iA11y'); a11y.innerHTML = ''; if (R.a11y) R.a11y(cx, a11y); // PLAY-ESTACION-03 · controles DOM sincronizados con el lienzo
    const solved = !daily && CO.isSolved(id); const st = daily ? APP.dstate : CO.pz(id);
    $('#iStamp').textContent = t('puz.solved') + (solved && st.helped ? ' · ' + t('puz.helped') : ''); $('#iStamp').classList.toggle('on', !!solved);
    const ans = $('#ans'); ans.value = solved ? (st.ans || '') : (o.keep || ui.draft || ''); ans.disabled = !!solved; $('#send').disabled = !!solved; $('#hintBtn').disabled = !!solved; $('#enie').hidden = I18N.LANG !== 'es';
    $('#bar').className = ''; $('#offer').hidden = true; removeSuccess();
    if (!daily) { CO.G.open = id; saveSoon(); }
    AU.sfx('open'); AU.inspector(true);
    APP.inspOpener = o.opener || document.activeElement;
    requestAnimationFrame(() => { layout(); if (!solved && matchMedia('(pointer:fine)').matches && !R.dom) ans.focus({ preventScroll: true }); else $('#iTitle').focus({ preventScroll: true }); });
    if (id === 'p1' && !CO.G.ui._barTip) { CO.G.ui._barTip = 1; setTimeout(() => { if (APP.insp === 'p1') toast(t('tour.bar'), '', { ms: 4200 }); }, 2500); }
  }
  function closeInsp(silent) {
    if (!APP.insp) return; const R = APP.R; if (R && R.leave) R.leave(APP.cx);
    const closedId = APP.insp;
    $('#insp').hidden = true; APP.insp = null; APP.cx = null; APP.R = null; removeSuccess(); $('#iA11y').innerHTML = '';
    AU.inspector(false); if (!silent) AU.sfx('close');
    if (CO.G) { CO.G.open = null; saveSoon(); }
    if (APP.scr === 'room') { APP.rs.sel = null; renderRoomList(); $('#roomList').hidden = false; }
    // retorno de foco: tarjeta del enigma recién cerrado, luego su activador, luego la cabecera (nunca .blur())
    const back = $(`#roomList .pc[data-id="${closedId}"]`) || (visible(APP.inspOpener) ? APP.inspOpener : null) || (!$('#top').hidden ? $('#bPause') : null);
    if (back && !top()) back.focus({ preventScroll: true }); APP.inspOpener = null;
    if (APP.daily && APP.scr === 'dailyHome') showDaily();
  }
  function renderTools() {
    const box = $('#iTools'); const cx = APP.cx, R = APP.R; if (!cx) return; const tl = (R.tools && R.tools(cx)) || [];
    box.innerHTML = tl.map(x => `<button type="button" class="tool ${x.on ? 'on' : ''}" data-id="${x.id}" aria-pressed="${x.on ? 'true' : 'false'}">${esc(x.label)}</button>`).join('');
    box.querySelectorAll('.tool').forEach(b => b.onclick = () => { R.tool(cx, b.dataset.id); renderTools(); });
  }
  function renderHints() {
    const box = $('#iHints'); const cx = APP.cx; if (!cx) return; const st = cx.daily ? APP.dstate : CO.pz(cx.id); const P0 = cx.P;
    let h = ''; if (st.hints >= 1) h += `<div class="hint"><b>${t('hint.nudge')}</b>${esc(L2(P0.h[0]))}</div>`; if (st.hints >= 2) h += `<div class="hint"><b>${t('hint.method')}</b>${esc(L2(P0.h[1]))}</div>`;
    if (!cx.daily && st.solT != null && st.hints < 3) h += `<div class="hint" id="solWait"><b>${t('hint.solution')}</b><span class="sw"></span><div class="wait"><i></i></div></div>`;
    box.innerHTML = h; tickSol();
  }
  function renderAtt() {
    const box = $('#iAtt'); const cx = APP.cx; if (!cx) return; const st = cx.daily ? APP.dstate : CO.pz(cx.id); const a = st.att.slice(-6);
    if (W <= 340 && a.length) { box.innerHTML = `<span style="text-decoration:none">${t('puz.attempts', { n: st.att.length })}</span>`; return; }
    box.innerHTML = a.map(x => `<span class="${x.r === 'mid' ? 'mid' : x.r === 'near' ? 'near' : ''}">${esc(x.w)}</span>`).join('');
  }
  // Estado de comprobación junto al campo (PLAY-ESTACION-02): un mensaje, anunciado una vez por aria-live; se limpia antes de reasignar para que un mismo texto vuelva a anunciarse.
  function setAnsStatus(msg, kind = '') { const s = $('#ansStatus'); if (!s) return; s.textContent = ''; s.className = 'ans-status ' + kind; if (msg) requestAnimationFrame(() => { s.textContent = msg; }); }
  function ansLen() { const cx = APP.cx; return cx && cx.V && cx.V.len ? (cx.V.len[I18N.LANG] || cx.V.len.es) : 0; }
  function renderEnum() {
    const cx = APP.cx; const box = $('#enum'); const fmt = $('#answerFormat'); if (!cx) { box.innerHTML = ''; if (fmt) fmt.textContent = ''; return; }
    if (!cx.V || !cx.V.len) { box.innerHTML = ''; if (fmt) fmt.textContent = ''; return; }
    const n = cx.V.len[I18N.LANG] || cx.V.len.es; const v = CO.norm($('#ans').value);
    // indicación textual de longitud (orientativa; no valida ni bloquea el envío)
    if (fmt) fmt.textContent = t('answer.format', { formato: n === 1 ? t('answer.letter1') : t('answer.letters', { cantidad: n }) }); const fit = Math.floor((Math.min(W, document.body.classList.contains('land') ? W * .4 : W) - 40) / 17);
    if (n > fit) { box.innerHTML = `<em>(${n}) · ${v.length}/${n}</em>`; return; }
    let h = ''; for (let i = 0; i < Math.max(n, v.length); i++) h += `<i class="${i < v.length ? (i < n ? 'f' : 'f x') : ''}">${v[i] || ''}</i>`; box.innerHTML = h + `<em>(${n})</em>`;
  }

  // ---------- zoom y punteros del escenario ----------
  function clampZoom() { const z = APP.zoom; z.z = Math.max(1, Math.min(4, z.z)); z.x = Math.min(0, Math.max(IW - IW * z.z, z.x)); z.y = Math.min(0, Math.max(IH - IH * z.z, z.y)); const tag = $('#iZoom'); tag.textContent = z.z.toFixed(1) + '×'; tag.classList.toggle('on', z.z > 1.01); }
  function toLocal(e) { const r = icv.getBoundingClientRect(), z = APP.zoom; return [((e.clientX - r.left) - z.x) / z.z, ((e.clientY - r.top) - z.y) / z.z, e.clientX - r.left, e.clientY - r.top]; }
  const ptr = new Map(); let pinch = null, lp = null, lastTap = { t: 0, x: 0, y: 0 }, pressed = false;
  icv.addEventListener('pointerdown', (e) => {
    if (!APP.cx) return; AU.unlock(); icv.setPointerCapture(e.pointerId); const [x, y, sx, sy] = toLocal(e); ptr.set(e.pointerId, { sx, sy });
    if (ptr.size === 2) { if (APP.R.up) APP.R.up(APP.cx, x, y, e); pressed = false; clearTimeout(lp); const [a, b] = [...ptr.values()]; pinch = { d: Math.hypot(a.sx - b.sx, a.sy - b.sy), z: APP.zoom.z, mx: (a.sx + b.sx) / 2, my: (a.sy + b.sy) / 2, ox: APP.zoom.x, oy: APP.zoom.y }; return; }
    const now = performance.now(); if (now - lastTap.t < 300 && Math.hypot(sx - lastTap.x, sy - lastTap.y) < 24 && e.pointerType === 'touch') { const z = APP.zoom; if (z.z > 1.2) { z.z = 1; z.x = 0; z.y = 0; } else { z.z = 2; z.x = -sx; z.y = -sy; } clampZoom(); lastTap.t = 0; return; }
    lastTap = { t: now, x: sx, y: sy };
    pressed = true; APP.cx._sx = sx; APP.cx._sy = sy; if (APP.R.down) APP.R.down(APP.cx, x, y, e);
    clearTimeout(lp); lp = setTimeout(() => { if (pressed && !APP.cx.drag && !APP.cx.dr && !APP.cx.daily) clip(sx, sy); }, 520);
  });
  icv.addEventListener('pointermove', (e) => {
    if (!APP.cx) return; const [x, y, sx, sy] = toLocal(e); if (ptr.has(e.pointerId)) ptr.set(e.pointerId, { sx, sy });
    if (pinch && ptr.size >= 2) { const [a, b] = [...ptr.values()]; const d = Math.hypot(a.sx - b.sx, a.sy - b.sy); const z = APP.zoom; const nz = Math.max(1, Math.min(4, pinch.z * d / pinch.d)); const mx = (a.sx + b.sx) / 2, my = (a.sy + b.sy) / 2; z.x = mx - (pinch.mx - pinch.ox) * nz / pinch.z; z.y = my - (pinch.my - pinch.oy) * nz / pinch.z; z.z = nz; clampZoom(); return; }
    if (pressed) { if (Math.hypot(sx - APP.cx._sx, sy - APP.cx._sy) > 9) clearTimeout(lp); if (APP.R.move) APP.R.move(APP.cx, x, y, e, true); }
    else if (e.pointerType === 'mouse' && APP.R.hover) APP.R.hover(APP.cx, x, y);
  });
  const pUp = (e) => { if (!APP.cx) return; ptr.delete(e.pointerId); clearTimeout(lp); if (pinch) { if (ptr.size < 2) pinch = null; return; } if (pressed) { pressed = false; const [x, y] = toLocal(e); if (APP.R.up) APP.R.up(APP.cx, x, y, e); } };
  icv.addEventListener('pointerup', pUp); icv.addEventListener('pointercancel', pUp);
  icv.addEventListener('wheel', (e) => { if (!APP.cx) return; e.preventDefault(); const [, , sx, sy] = toLocal(e); const z = APP.zoom; const nz = Math.max(1, Math.min(4, z.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); z.x = sx - (sx - z.x) * nz / z.z; z.y = sy - (sy - z.y) * nz / z.z; z.z = nz; clampZoom(); }, { passive: false });
  icv.addEventListener('contextmenu', (e) => { e.preventDefault(); if (APP.cx && !APP.cx.daily) { const [, , sx, sy] = toLocal(e); clip(sx, sy); } });
  function clip(sx, sy) {
    try { const S = 220, c = document.createElement('canvas'); c.width = 160; c.height = 160; const cc = c.getContext('2d'); const x0 = Math.max(0, Math.min(IW - S, sx - S / 2)), y0 = Math.max(0, Math.min(IH - S, sy - S / 2));
      cc.drawImage(icv, x0 * DPR, y0 * DPR, S * DPR, S * DPR, 0, 0, 160, 160); const img = c.toDataURL('image/jpeg', .72);
      CO.G.clips.push({ p: APP.cx.id, img, at: Date.now() }); while (CO.G.clips.length > 30) CO.G.clips.shift(); saveSoon(); AU.sfx('shutter'); AU.vibrate(15); toast(t('notebook.saved'), 'ok');
    } catch (e) { }
  }
  // deslizar hacia abajo la cabecera para cerrar (vertical)
  (() => { let sy = null; const hd = $('.i-head'); hd.addEventListener('pointerdown', e => { if (!document.body.classList.contains('land')) sy = e.clientY; }); hd.addEventListener('pointerup', e => { if (sy != null && e.clientY - sy > 80) closeInsp(); sy = null; }); })();
  $('#iClose').onclick = () => closeInsp();

  // ---------- barra de respuesta ----------
  const ans = $('#ans');
  ans.addEventListener('input', () => { if (ans.value.length > 32) ans.value = ans.value.slice(0, 32); renderEnum(); AU.sfx('key'); $('#bar').classList.remove('mid'); if (APP.cx) { APP.cx.ui.draft = ans.value; saveSoon(); } }); // el borrador sobrevive a una recarga
  ans.addEventListener('focus', () => setTimeout(layout, 300)); ans.addEventListener('blur', () => setTimeout(layout, 300));
  $('#enie').onclick = () => { const s = ans.selectionStart ?? ans.value.length; ans.value = ans.value.slice(0, s) + 'Ñ' + ans.value.slice(ans.selectionEnd ?? s); ans.focus(); ans.setSelectionRange(s + 1, s + 1); renderEnum(); AU.sfx('key'); };
  $('#bar').addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  $('#hintBtn').onclick = () => openHints();
  $('#offerBtn').onclick = () => { $('#offer').hidden = true; openHints(); };
  function barAnim(cls) { const b = $('#bar'); b.classList.remove('shake', 'nearly', 'mid'); void b.offsetWidth; b.classList.add(cls); if (cls !== 'mid') setTimeout(() => b.classList.remove(cls), 300); }
  async function submit(text) {
    const cx = APP.cx; if (!cx || APP.busy) return; if (performance.now() < APP.cool) { toast(t('v.cooldown'), 'warn'); return; }
    const val = text != null ? text : ans.value; if (text != null) ans.value = text;
    const n = CO.norm(val); if (!n) { barAnim('shake'); const L = ansLen(); if (L) setAnsStatus(L === 1 ? t('answer.lenHelp1') : t('answer.lenHelp', { cantidad: L }), 'warn'); return null; }
    if (val.replace(/\s/g, '').length > 24) toast(t('v.long'), 'warn');
    APP.busy = true; $('#bar').classList.add('busy'); $('#send').disabled = true; AU.sfx('scan'); const t0 = performance.now();
    let r; try { r = cx.daily ? await CO.verify(null, val, { daily: APP.dstate, v: cx.V, salt: `jet-estacion:daily:${cx.V.i}` }) : await CO.verify(cx.id, val); } catch (e) { r = { r: 'wrong', n }; }
    const took = performance.now() - t0; APP.perf.verify.push(Math.round(took)); if (took < CO.VERDICT_WAIT) await new Promise(res => setTimeout(res, CO.VERDICT_WAIT - took));
    APP.busy = false; $('#bar').classList.remove('busy'); $('#send').disabled = false;
    if (!APP.cx || APP.cx !== cx) return r;
    const st = cx.daily ? APP.dstate : CO.pz(cx.id); const push = (w, rr) => { st.att.push({ w, r: rr }); if (st.att.length > 40) st.att.shift(); renderAtt(); };
    // Cada veredicto conserva su mensaje específico; además queda escrito junto al campo (#ansStatus) y el foco vuelve al campo sin borrar lo escrito.
    let msg = '', kind = '';
    switch (r.r) {
      case 'ok': setAnsStatus(cx.daily ? t('v.okA') : t('v.repaired'), 'ok'); onSolved(cx, r.n); break;
      case 'mid': push(r.n, 'mid'); msg = r.msg && C.traps[r.msg] ? L2(C.traps[r.msg]) : t('v.mid'); kind = 'ok'; toast(msg, 'ok'); AU.sfx('mid'); AU.peekLayer(); AU.vibrate(12); barAnim('mid'); st.offerAt = st.active; break;
      case 'trap': push(r.n, 'wrong'); msg = L2(C.traps[r.msg] || ['', '']) || t('v.wrong'); kind = 'warn'; toast(msg, 'warn'); AU.sfx('trap'); barAnim('shake'); AU.vibrate([20, 40, 20]); noteWrong(); break;
      case 'near': case 'enie': push(r.n, 'near'); msg = t(r.r === 'enie' ? 'v.near.enie' : 'v.near'); kind = 'warn'; toast(msg, 'warn'); AU.sfx('near'); barAnim('nearly'); AU.vibrate(12); break;
      case 'other': push(r.n, 'wrong'); msg = t('v.other'); kind = 'warn'; toast(msg, 'warn'); AU.sfx('trap'); barAnim('nearly'); break;
      case 'repeat': msg = t('v.repeat'); toast(msg); AU.sfx('near'); break;
      default: push(r.n, 'wrong'); msg = t('v.wrongA'); kind = 'bad'; toast(t('v.wrong'), 'bad'); AU.sfx('wrong'); barAnim('shake'); AU.vibrate([20, 40, 20]); noteWrong();
    }
    if (r.r !== 'ok') { setAnsStatus(msg, kind); saveSoon(); if (cx.daily) saveDailyState(); if (!ans.disabled && APP.cx === cx && !top()) ans.focus({ preventScroll: true }); }
    return r;
  }
  function noteWrong() {
    const now = performance.now(); APP.wrongs = APP.wrongs.filter(x => now - x < 60000); APP.wrongs.push(now);
    if (APP.wrongs.length >= 6) { APP.wrongs = []; APP.cool = now + 10000; AU.sfx('cooldown'); toast(t('v.cooldown'), 'warn', { ms: 4000 }); const s = $('#send'); s.classList.add('cool'); s.disabled = true; const tick = () => { const p = 1 - (APP.cool - performance.now()) / 10000; s.style.setProperty('--p', Math.min(100, p * 100) + '%'); if (p < 1) requestAnimationFrame(tick); else { s.classList.remove('cool'); s.disabled = false; } }; tick(); setTimeout(() => { if (APP.cx) $('#offer').hidden = false; }, 600); }
  }

  // ---------- resolución ----------
  function onSolved(cx, n) {
    $('#toasts').innerHTML = '';
    if (cx.daily) return dailySolved(cx);
    const id = cx.id, P0 = cx.P, st = CO.pz(id), G = CO.G;
    const paid = Math.max(0, st.hints - (st.freeHint ? 1 : 0)); st.st = 'solved'; st.stars = Math.max(0, 3 - paid); st.ans = n; st.solvedAt = Date.now(); st.solT = null;
    const rid = 'rec-' + id; if (C.rec[rid] && !G.rec[rid]) G.rec[rid] = 'new';
    ans.disabled = true; $('#send').disabled = true; $('#hintBtn').disabled = true; $('#offer').hidden = true;
    $('#iStamp').textContent = t('puz.solved') + (st.helped ? ' · ' + t('puz.helped') : ''); $('#iStamp').classList.add('on');
    AU.sfx('ok'); AU.vibrate(30); flashStage(); if (C.rec[rid]) setTimeout(() => AU.sfx('rec'), 900);
    AU.setLayers(1 + solvedCount(P0.mod)); AU.ambience(P0.mod, solvedCount(P0.mod));
    CO.saveGame(); setGameChrome(true);
    if (P0.meta && P0.mod !== 'observatorio') {
      G.metas[P0.mod] = true; if (!G.plate.includes(P0.mod)) G.plate.push(P0.mod);
      CO.MOD_PUZ[P0.mod].slice(0, 4).forEach(f => { if (!CO.isSolved(f)) { const s = CO.pz(f); s.st = 'solved'; s.stars = 0; s.helped = true; s.solvedAt = Date.now(); s.ans = ''; } });
      CO.saveGame(); setTimeout(() => { closeInsp(true); showRestored(P0.mod); }, 1400); return;
    }
    if (id === 'final') { setTimeout(() => { closeInsp(true); finale(n); }, 1200); return; }
    showSuccess(cx, st);
  }
  function flashStage() { const s = $('#iStage'); s.animate([{ boxShadow: '0 0 0 0 rgba(0,242,207,0)' }, { boxShadow: '0 0 0 4px rgba(0,242,207,.9), 0 0 60px rgba(0,242,207,.6)' }, { boxShadow: '0 0 0 0 rgba(0,242,207,0)' }], { duration: 900 }); }
  function removeSuccess() { const s = $('#succ'); if (s) s.remove(); }
  function showSuccess(cx, st) {
    const P0 = cx.P; const f = P0.frag; const box = document.createElement('div'); box.id = 'succ'; box.className = 'succ';
    const frag = f != null ? fragHTML(P0.mod, f) : '';
    // PLAY-ESTACION-05: estrellas obtenidas y pistas usadas explícitas; PLAY-ESTACION-04: leer transcripción separado de reproducir, con icono propio.
    const hasRec = !!C.rec['rec-' + cx.id]; const starsTxt = t('stars.earned', { obtenidas: st.stars, 'máximo': 3 });
    box.innerHTML = `<div class="card" style="max-width:380px;text-align:center" role="group" aria-labelledby="succK"><span class="kick" id="succK">${t('v.ok')}</span><div role="img" aria-label="${esc(starsTxt)}" style="font-size:30px;color:#ffd34d;letter-spacing:6px;margin:8px 0">${'★'.repeat(st.stars)}<span style="opacity:.25">${'★'.repeat(3 - st.stars)}</span></div><p class="succ-meta">${esc(starsTxt)} · ${esc(t('hint.used', { cantidad: st.hints || 0 }))}</p>${frag ? `<div class="fragline">${frag}<span>${t('frag.got')}</span></div>` : ''}<div class="succ-acts">${hasRec ? `<button class="btn sm" type="button" data-k="read"><svg class="ico ln" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h9l4 4v12H6z M9 12h7M9 16h7"/></svg>${t('log.read')}</button><button class="btn sm" type="button" data-k="rec"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>${t('log.listen')}</button>` : ''}<button class="btn sm pri" type="button" data-k="ok">${cx.id === 'p3' ? t('open.hatch') : t('back.room')}</button></div></div>`;
    Object.assign(box.style, { position: 'absolute', inset: '0', display: 'grid', placeItems: 'center', background: 'rgba(5,1,8,.55)', zIndex: 5, padding: '12px', overflowY: 'auto' });
    $('#iStage').appendChild(box); if (f != null) AU.sfx('frag');
    box.querySelector('[data-k=ok]').onclick = () => { AU.sfx('tap'); afterSolvedClose(cx.id); };
    const rb = box.querySelector('[data-k=rec]'); if (rb) rb.onclick = () => { AU.sfx('tap'); openLog('rec-' + cx.id); };
    const rd = box.querySelector('[data-k=read]'); if (rd) rd.onclick = () => { AU.sfx('tap'); openLog('rec-' + cx.id, { read: true }); };
    setTimeout(() => { const b = box.querySelector('[data-k=ok]'); if (b) b.focus({ preventScroll: true }); }, 100);
  }
  function fragHTML(mod, f) {
    const col = DR.FRAG_COL[f];
    const ic = { oxigeno: `<svg viewBox="0 0 40 20"><rect x="2" y="6" width="36" height="8" rx="4" fill="${col}"/><text x="20" y="13" font-size="7" text-anchor="middle" fill="#012" font-family="monospace" font-weight="700">${'ABCD'[f]}</text></svg>`,
      energia: `<svg viewBox="0 0 40 40"><g transform="translate(20 20)" fill="#ffb347">${['<path d="M2-14 -6 2H0L-3 14 7-2H1Z"/>', '<polygon points="12,0 6,10 -6,10 -12,0 -6,-10 6,-10"/>', '<path fill-rule="evenodd" d="M-12 0a12 12 0 1 0 24 0a12 12 0 1 0-24 0M-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0"/>', '<path d="M-4-12H4V-4H12V4H4V12H-4V4H-12V-4H-4Z"/>'][f]}</g></svg>`,
      comunicaciones: `<svg viewBox="0 0 40 40"><path d="M20 4V36" stroke="#f6e3a8" stroke-width="2.5"/><circle cx="20" cy="36" r="3" fill="#00f2cf"/></svg>`,
      navegacion: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="none" stroke="#5b8cff" stroke-width="2"/><circle cx="${12 + f * 5}" cy="${14 + f * 3}" r="3" fill="#00f2cf"/></svg>`,
      archivo: `<svg viewBox="0 0 44 24"><rect x="2" y="3" width="40" height="18" rx="4" fill="none" stroke="#ffd28a" stroke-width="2"/><text x="22" y="17" font-size="11" text-anchor="middle" fill="#ffd28a" font-family="monospace" font-weight="700">${['03', '07', '11', '13'][f]}</text></svg>`,
      tripulacion: `<svg viewBox="0 0 40 40"><rect x="10" y="6" width="20" height="24" rx="5" fill="#a46bff"/><rect x="8" y="28" width="24" height="6" rx="3" fill="#6b3fc0"/><text x="20" y="23" font-size="12" text-anchor="middle" fill="#fff" font-family="monospace" font-weight="700">${[2, 5, 1, 7][f]}</text></svg>` }[mod] || '';
    return `<i class="frag">${ic}</i>`;
  }
  function afterSolvedClose(id) {
    closeInsp();
    if (id === 'p1' || id === 'p2') { const nx = id === 'p1' ? 'p2' : 'p3'; setTimeout(() => selectPanel(nx), 500); }
    else if (id === 'p3') { setTimeout(() => { toast(t('log.new'), 'ok', { action: { label: t('log.play'), fn: () => openLog('rec-p3') } }); door(goHub); }, 300); }
    else if (APP.scr === 'room' && CO.MOD_PUZ[APP.mod].slice(0, 4).every(CO.isSolved) && !CO.isSolved(CO.META_OF[APP.mod])) { setTimeout(() => toast(I18N.LANG === 'en' ? 'All four fragments: the central panel is ready.' : 'Los cuatro fragmentos: el panel central está listo.', 'ok', { ms: 3600 }), 400); }
  }

  // ---------- ayudas ----------
  function openHints() {
    const cx = APP.cx; if (!cx) return; const daily = cx.daily; const st = daily ? APP.dstate : CO.pz(cx.id); const P0 = cx.P;
    const free = !daily && cx.id === 'p3' && !CO.G.freeHintUsed;
    const n = daily ? 2 : 3; const keys = ['hint.nudge', 'hint.method', 'hint.solution'];
    // Etiquetas por acción (SRC-ES01 / PLAY-ESTACION-05): pista, método y solución son acciones distintas; «−1 estrella en este enigma»
    // sólo cuando esa ayuda produce el decremento real (rama de campaña: paid = hints − freeHint); la gratuita sólo en p3 elegible;
    // el diario no usa estrellas, así que no se le muestra coste alguno.
    const label = (i) => i === 0 ? (free ? t('hint.revealFree') : daily ? t('hint.revealHint') : t('hint.revealPaid')) : i === 1 ? t('hint.revealMethod') + (daily ? '' : ' · −1 ★') : t('hint.prepSol', { segundos: 60 });
    const effect = (i) => daily ? '' : (i === 0 && free ? t('hint.free') : t('hint.effect'));
    const el = screen(`<div class="card sheet"><div class="head"><h2>${t('hints')}</h2><button class="x" type="button" data-k="x" aria-label="${t('close.hints')}">×</button></div><div class="steps">${keys.slice(0, n).map((k, i) => {
      const done = st.hints > i; const can = st.hints === i; const txt = i < 2 ? L2(P0.h[i]) : '';
      return `<div class="step ${done ? 'done' : ''}"><span class="n" aria-hidden="true">${i + 1}</span><div class="b"><b>${t(k)}</b>${done ? `<p>${esc(txt || t('hint.ready'))}</p>` : (can && effect(i) ? `<p class="fx">${esc(effect(i))}</p>` : '')}${i === 2 && st.solT != null && !done ? `<div class="wait"><i id="hw"></i></div>` : ''}</div><div class="act">${done ? `<span class="done-tag">${t('hint.done')}</span>` : can ? (i === 2 && st.solT != null ? `<button class="btn sm" type="button" data-k="cancel">${t('hint.cancel')}</button>` : `<button class="btn sm cy" type="button" data-k="r${i}">${label(i)}</button>`) : `<small style="color:#8f84ad;font-size:11px">${t('hint.locked')}</small>`}</div></div>`;
    }).join('')}</div></div>`, 'veil sheet');
    el.querySelector('[data-k=x]').onclick = () => closeScreen(el); el._re = openHints;
    el.addEventListener('click', (e) => { if (e.target === el) closeScreen(el); });
    const act = (i) => {
      if (i < 2) { st.hints = i + 1; if (i === 0 && free) { st.freeHint = true; CO.G.freeHintUsed = true; } if (!daily) { st.helped = st.helped || false; CO.G.hintsUsed++; } else saveDailyState(); AU.sfx('hint'); st.offerAt = st.active || 0; saveSoon(); closeScreen(el); renderHints(); }
      else { st.solT = 60000; saveSoon(); closeScreen(el); renderHints(); AU.sfx('hint'); }
    };
    el.querySelectorAll('[data-k^=r]').forEach(b => b.onclick = () => act(+b.dataset.k.slice(1)));
    const c = el.querySelector('[data-k=cancel]'); if (c) c.onclick = () => { st.solT = null; saveSoon(); closeScreen(el); renderHints(); };
  }
  async function solutionReady(cx) { const st = CO.pz(cx.id); st.solT = null; st.hints = 3; st.helped = true; CO.G.hintsUsed++; const s = await CO.solutionOf(cx.id, I18N.LANG); if (APP.cx === cx) { ans.value = s; renderEnum(); ans.focus({ preventScroll: true }); } toast(t('hint.ready'), 'ok', { ms: 3800 }); AU.sfx('hint'); renderHints(); saveSoon(); }
  function tickSol() { const cx = APP.cx; if (!cx || cx.daily) return; const st = CO.pz(cx.id); const box = $('#solWait'); if (!box || st.solT == null) return; box.querySelector('.sw').textContent = t('hint.wait', { s: Math.ceil(st.solT / 1000) }); box.querySelector('.wait i').style.width = (100 - st.solT / 600) + '%'; const hw = $('#hw'); if (hw) hw.style.width = (100 - st.solT / 600) + '%'; }

  // ================= sala y Anillo: entrada =================
  let down = null;
  cv.addEventListener('pointerdown', (e) => { AU.unlock(); if (APP.insp) return; down = { x: e.clientX, y: e.clientY, px: APP.rs.px, moved: false }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (APP.scr === 'room' && !down && e.pointerType === 'mouse') { APP.rs.hover = hitRoom(e.clientX, e.clientY); cv.style.cursor = APP.rs.hover ? 'pointer' : 'default'; }
    if (APP.scr === 'hub' && e.pointerType === 'mouse') { APP.hs.hover = SC.hubHit(APP.hs, e.clientX, e.clientY); cv.style.cursor = APP.hs.hover ? 'pointer' : 'default'; }
    if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 8) down.moved = true; if (APP.scr === 'room' && down.moved) { APP.rs.px = Math.max(0, Math.min(APP.cam ? APP.cam.pan : 0, down.px - dx)); APP.rs.follow = false; }
  });
  cv.addEventListener('pointerup', (e) => {
    if (!down) return; const moved = down.moved; down = null; if (moved) return;
    if (APP.scr === 'room') { const id = hitRoom(e.clientX, e.clientY); if (id) { AU.sfx('tap'); selectPanel(id); } }
    else if (APP.scr === 'hub') { const m = SC.hubHit(APP.hs, e.clientX, e.clientY); if (m) travel(m); }
  });
  cv.addEventListener('pointercancel', () => down = null);
  function hitRoom(x, y) { const cam = APP.cam; if (!cam) return null; const wx = (x - cam.ox + APP.rs.px) / cam.s, wy = (y - cam.top) / cam.s; const h = (APP.rs.hot || []).find(r => wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h); return h ? h.id : null; }
  function travel(m) {
    if (!CO.modUnlocked(m)) { AU.sfx('wrong'); toast(m === 'observatorio' ? t('sealed.core') : (m === 'energia' ? t('sealed.pressure') : t('sealed.power')), 'warn'); return; }
    AU.sfx('tap'); APP.hs.cur = m; setTimeout(() => door(() => enterRoom(m)), document.documentElement.classList.contains('reduce') ? 0 : 450);
  }
  $('#bRing').onclick = () => { AU.sfx('tap'); door(goHub); };
  $('#bPause').onclick = () => pause();
  $('#bGear').onclick = () => { AU.sfx('tap'); showSettings(); };
  $('#bNote').onclick = $('#hNote').onclick = () => { AU.sfx('tap'); openNotebook(); };
  $('#bLog').onclick = $('#hLog').onclick = () => { AU.sfx('tap'); openLog(); };
  $('#bMap').onclick = () => { AU.sfx('tap'); openMap(); };

  // ================= pantallas =================
  function statusLine() {
    const G = CO.G; if (!G) return ''; const s = CO.totalStars(), tt = fmtTime(G.activeMs);
    if (G.finished) return t('status.done', { s }); if (!CO.isSolved('p3')) return t('status.pro', { s, t: tt }); return t('status', { n: CO.currentModuleIndex(), s, t: tt });
  }
  function showHome() {
    closeAll(); APP.scr = 'home'; setGameChrome(false); const G = CO.G; const today = CO.localDate(); const dDone = CO.DAILY.today && CO.DAILY.today.date === today && CO.DAILY.today.solved;
    if (!CO.CRYPTO_OK) { const el = screen(`<div class="hcard card" style="margin:auto"><h1 class="logo" style="font-size:36px">JET<i>//</i>${t('titleA')}<small>${t('titleB')}</small></h1><p style="margin:16px 0;color:var(--dim)">${t('err.crypto')}</p><a class="btn pri" href="https://jetgames.fun/estacion/">jetgames.fun/estacion</a></div>`, 'home'); return el; }
    const el = screen(`<div class="hcard">
      <h1 class="logo">JET<i>//</i>${esc(t('titleA'))}<small>${esc(t('titleB'))}</small></h1>
      <p class="sub">${t('subtitle')}</p>
      <button class="btn pri big" type="button" data-k="go">${G ? (G.finished ? t('cta.continue') : t('cta.continue')) : t('cta.first')}${G ? `<small>${esc(statusLine())}</small>` : ''}</button>
      ${G && G.finished ? `<div class="row"><button class="btn" type="button" data-k="newplus">${t('cta.newplus')}</button><button class="btn" type="button" data-k="ending">${t('replayEnd')}</button></div>` : ''}
      <div class="sec">
        <button class="btn wide" type="button" data-k="daily">${!dDone ? '<i class="daily-dot"></i>' : ''}${t('daily')}${CO.DAILY.streak ? ` <span class="streak">🔥 ${CO.DAILY.streak}</span>` : ''}</button>
        <button class="btn" type="button" data-k="how">${t('how')}</button><button class="btn" type="button" data-k="set">${t('settings')}</button>
        ${FS_OK ? `<button class="btn wide fsb" type="button" data-k="fs" data-fs aria-label="${isFS() ? t('fullscreen.exit') : t('fullscreen')}">${FS_IC}<span class="lbl">${isFS() ? t('fullscreen.exit') : t('fullscreen')}</span></button>` : ''}
      </div><div class="hlang">${LANG_SEG()}</div></div>`, 'home');
    bindLang(el);
    el.querySelector('[data-k=go]').onclick = () => { AU.unlock(); if (!CO.G) { const sd = Q.get('seed') ? CO.seedOf(Q.get('seed')) : null; newGame(sd); intro(); } else resume(); };
    const np = el.querySelector('[data-k=newplus]'); if (np) np.onclick = () => confirmNewGame(null, np);
    const en = el.querySelector('[data-k=ending]'); if (en) en.onclick = () => finale(CO.nameOfGame(), true);
    el.querySelector('[data-k=daily]').onclick = () => showDaily();
    el.querySelector('[data-k=how]').onclick = () => showHow();
    el.querySelector('[data-k=set]').onclick = () => showSettings();
    const fs = el.querySelector('[data-k=fs]'); if (fs) fs.onclick = () => toggleFS();
    if (!CO.STORAGE_OK) toast(t('err.storage'), 'warn', { ms: 8000 });
    setTimeout(() => { const b = el.querySelector('[data-k=go]'); if (b && el.isConnected && !top().contains(document.activeElement) && !document.activeElement.closest('#bGear,#back')) b.focus({ preventScroll: true }); }, 200);
    musicFor(); return el;
  }
  function resume() {
    const G = CO.G; G.sessions = (G.sessions || 0) + 1;
    if (!G.introSeen) return intro();
    if (G.room === 'hub' || !G.room) return door(goHub);
    const open = G.open; door(() => { enterRoom(G.room === 'prologo' && !CO.isSolved('p3') ? 'prologo' : G.room); if (open && CO.puzzleUnlocked(open)) setTimeout(() => openInsp(open), 380); else if (G.room === 'prologo') { const nx = ['p1', 'p2', 'p3'].find(x => !CO.isSolved(x)); if (nx) setTimeout(() => selectPanel(nx), 400); } });
  }
  // ---------- cinemática de despertar ----------
  function intro() {
    closeAll(); APP.scr = 'intro'; APP.introT = 0; setGameChrome(false); AU.ambience('prologo', 0); AU.music('prologo', 0);
    const el = screen(`<div class="cine"><div class="type" aria-live="polite"></div><div class="line2">${esc(t('intro.2'))}</div><button class="skip" type="button">${t('skip')}</button></div>`, 'solid');
    el.style.background = 'transparent'; const ty = el.querySelector('.type'), l2 = el.querySelector('.line2'), sk = el.querySelector('.skip');
    const full = t('intro.1').replace(/ · /g, '\n'); let i = 0, done = false; const timers = [];
    const fin = () => { if (done) return; done = true; timers.forEach(clearTimeout); CO.G.introSeen = true; CO.saveGame(); closeScreen(el); fade(() => enterRoom('prologo', { open: 'p1', ax: 600 })); };
    const typeNext = () => { if (done) return; ty.textContent = full.slice(0, ++i); if (full[i - 1] && full[i - 1] !== ' ') AU.sfx('key'); if (i < full.length) timers.push(setTimeout(typeNext, document.documentElement.classList.contains('reduce') ? 10 : 55)); else { timers.push(setTimeout(() => { l2.classList.add('on'); AU.hum(1); }, 1600)); timers.push(setTimeout(fin, 9000)); } };
    timers.push(setTimeout(typeNext, 2400)); timers.push(setTimeout(() => sk.classList.add('on'), 2000));
    const beat = () => { if (done) return; AU.sfx('echo', 8); timers.push(setTimeout(beat, 1700)); }; timers.push(setTimeout(beat, 600));
    sk.onclick = fin; APP.introSkip = fin;
  }
  // ---------- pausa ----------
  function pause() {
    if (APP.paused || !CO.G) return; APP.paused = true; CO.saveGame(); AU.pauseMix(true);
    const el = screen(`<div class="card" style="max-width:380px"><div class="head"><h2>${t('pause')}</h2></div><p class="kick" style="margin-bottom:14px;color:var(--dim)">${esc(statusLine())}</p>
      <button class="btn pri" type="button" data-k="c" data-focus>${t('pause.continue')}</button><button class="btn" type="button" data-k="how">${t('how')}</button><button class="btn" type="button" data-k="set">${t('settings')}</button><button class="btn" type="button" data-k="share">${t('restored.share')}</button><button class="btn" type="button" data-k="home">${t('pause.home')}</button></div>`);
    el.dataset.pause = 1; el._re = () => { APP.paused = false; pause(); };
    const cont = () => { APP.paused = false; AU.unlock(); AU.resume(); AU.pauseMix(false); closeScreen(el); };
    el.querySelector('[data-k=c]').onclick = cont; el.querySelector('[data-k=how]').onclick = () => showHow(); el.querySelector('[data-k=set]').onclick = () => showSettings();
    el.querySelector('[data-k=share]').onclick = (e) => share(shareProgress(), e.currentTarget); el.querySelector('[data-k=home]').onclick = () => { APP.paused = false; AU.resume(); AU.pauseMix(false); goHome(); };
    APP.pauseEl = el; APP.resumeFn = cont;
    setTimeout(() => el.querySelector('[data-k=c]').focus({ preventScroll: true }), 60);
  }
  function shareProgress() { const n = CO.modulesDone(); const dots = CO.MODS.map(m => CO.G.metas[m] ? (CO.MOD_PUZ[m].some(id => CO.G.pz[id] && CO.G.pz[id].hints >= 3) ? '🟡' : '🟢') : '⚫').join(''); return `${t('title')}\n${I18N.LANG === 'en' ? 'Modules' : 'Módulos'} ${n}/6 · ★ ${CO.totalStars()}\n${dots} ${fmtTime(CO.G.activeMs)}\nhttps://jetgames.fun/estacion/`; }
  // ---------- ajustes ----------
  function showSettings() {
    const G = CO.G;
    // Cada interruptor lleva aria-labelledby a su etiqueta visible y cada deslizador el nombre de su canal (PLAY-ESTACION-06 / SRC-G03).
    const tog = (k, on) => `<button class="tog ${on ? 'on' : ''}" type="button" role="switch" aria-checked="${on ? 'true' : 'false'}" aria-labelledby="lb-${k}" data-tog="${k}"></button>`;
    const row = (k, label, ctl) => `<div class="set"><span class="lb" id="lb-${k}">${label}</span>${ctl}</div>`;
    const el = screen(`<div class="card"><div class="head"><h2>${t('settings')}</h2><button class="x" type="button" data-k="x" aria-label="${t('close')}">×</button></div>
      <div class="sect">${t('s.sound')}</div>
      ${row('music', t('s.music'), `<input type="range" min="0" max="1" step=".05" value="${Pf.mv}" data-r="mv" aria-label="${t('s.musicVol')}">` + tog('music', Pf.music))}
      ${row('sfx', t('s.sfx'), `<input type="range" min="0" max="1" step=".05" value="${Pf.sv}" data-r="sv" aria-label="${t('s.sfxVol')}">` + tog('sfx', Pf.sfx))}
      ${row('amb', t('s.amb'), tog('amb', Pf.amb))}
      <div class="set"><label class="lb" for="r-murmur">${t('s.murmur')}</label><input type="range" id="r-murmur" min="0" max="1" step=".05" value="${Pf.murmur}" data-r="murmur"></div>
      ${navigator.vibrate && !IOS ? row('vib', t('s.vib'), tog('vib', Pf.vib)) : ''}
      <div class="set"><span class="lb">${t('s.lang')}</span>${LANG_SEG()}</div>
      ${FS_OK ? row('fs', t('fullscreen'), `<button class="tog ${isFS() ? 'on' : ''}" type="button" role="switch" aria-checked="${isFS() ? 'true' : 'false'}" aria-labelledby="lb-fs" data-k="fs" data-fs></button>`) : ''}
      <div class="sect">${t('s.a11y')}</div>
      ${row('a11yAudio', t('a11y.audio'), tog('a11yAudio', Pf.a11yAudio))}
      ${row('reduce', t('a11y.reduce'), tog('reduce', document.documentElement.classList.contains('reduce')))}
      ${row('big', t('a11y.big'), tog('big', Pf.big))}
      ${row('contrast', t('a11y.contrast'), tog('contrast', Pf.contrast))}
      <div class="sect">${t('s.game')}</div>
      ${G ? `<div class="set"><span class="lb">${t('s.code')}</span><span class="code">${G.code}</span></div>
      <div class="sect">${t('s.backup')}</div><button class="btn" type="button" data-k="copy">${t('s.copyRescue')}</button>` : ''}
      <details><summary class="btn" style="list-style:none">${t('s.pasteRescue')}</summary><textarea class="resc" aria-label="${t('s.pasteRescue')}" placeholder="${t('s.rescuePh')}"></textarea><button class="btn" type="button" data-k="load">${t('s.load')}</button></details>
      <details><summary class="btn" style="list-style:none">${t('s.new')}</summary><p style="font-size:13px;color:var(--dim);margin:6px 0">${t('s.newCode')}</p><input class="codein" maxlength="6" placeholder="ABC234" autocapitalize="characters" aria-label="${t('s.newCode')}"><button class="btn danger" type="button" data-k="new">${t('s.new')}</button></details>
      <button class="btn danger" type="button" data-k="wipe">${t('s.wipe')}</button>
      </div>`);
    el.querySelector('[data-k=x]').onclick = () => closeScreen(el);
    el.querySelectorAll('[data-tog]').forEach(b => b.onclick = () => { const k = b.dataset.tog; const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-checked', on); if (k === 'reduce') Pf.reduce = on ? 1 : 0; else Pf[k] = on ? 1 : 0; CO.savePrefs(); AU.applyPrefs(); applyA11y(); if (k === 'music' && on) { AU.unlock(); musicFor(); } if (APP.cx) renderTools(); });
    el.querySelectorAll('[data-r]').forEach(r => r.oninput = () => { Pf[r.dataset.r] = +r.value; CO.savePrefs(); AU.applyPrefs(); });
    bindLang(el); el._re = showSettings;
    const fs = el.querySelector('[data-k=fs]'); if (fs) fs.onclick = () => toggleFS();
    const cp = el.querySelector('[data-k=copy]'); if (cp) cp.onclick = () => copyOrShow(CO.rescueCode(), t('s.codeCopied'), cp);
    // SRC-ES02: la copia de seguridad se valida antes de tocar nada; una inválida no borra. Reemplazar o empezar de nuevo pide confirmación explícita y enumera qué se conserva y qué cambia.
    const ld = el.querySelector('[data-k=load]'); ld.onclick = () => { const g2 = CO.parseRescue(el.querySelector('.resc').value); if (!g2) { toast(t('err.rescue'), 'bad'); return; } const apply = () => { CO.G = g2; CO.saveGame(); toast(t('s.loaded'), 'ok'); goHome(); }; if (!CO.G) return apply(); confirmDlg({ title: t('replace.title'), body: t('effect', { conservado: t('restore.keep'), cambiado: t('restore.change') }), keep: t('backup.first'), backup: true, ok: t('confirm.replace'), onOk: apply, opener: ld }); };
    const nw = el.querySelector('[data-k=new]'); nw.onclick = () => { const c = el.querySelector('.codein').value.trim(); let sd = null; if (c) { sd = CO.seedOf(c); if (sd == null) { toast(t('err.code'), 'bad'); return; } } confirmNewGame(sd, nw); };
    const wp = el.querySelector('[data-k=wipe]'); wp.onclick = () => confirmDlg({ title: t('wipe.title', { juego: t('title') }), body: t('wipe.body', { 'datos concretos': t('wipe.data') }), keep: t('wipe.keep'), backup: !!CO.G, ok: t('wipe.do'), danger: true, opener: wp, onOk: () => { ['save', 'daily', 'records'].forEach(CO.lsDel); CO.G = null; Object.assign(CO.DAILY, { lastSolved: '', streak: 0, best: 0, today: null }); toast(t('s.wiped'), 'ok'); goHome(); } });
  }
  // Nueva partida (+): si hay progreso, confirma y explica qué conserva (ajustes, diario, récords) y qué cambia (toda la partida, semilla nueva).
  function confirmNewGame(sd, opener) {
    const go = () => { newGame(sd); closeAll(); intro(); };
    if (!CO.G) return go();
    confirmDlg({ title: t('replace.title'), body: t('effect', { conservado: t('new.keep'), cambiado: t('new.change') }), keep: t('backup.first'), backup: true, ok: t('confirm.replace'), onOk: go, opener });
  }
  function refreshAfterLang() {
    if (APP.scr === 'home') { showHome(); }
    setGameChrome(['room', 'hub'].includes(APP.scr)); renderRoomList();
    if (APP.insp && APP.insp !== 'daily') { const id = APP.insp; const keep = ans.value; closeInsp(true); openInsp(id, { keep }); }
    else if (APP.insp === 'daily') { const d = APP.daily, keep = ans.value; APP.daily = null; closeInsp(true); APP.daily = d; if (d) openInsp(null, { daily: d, keep }); }
    if (APP.scr === 'dailyHome' && !APP.insp) showDaily();
  }
  // ---------- cómo jugar ----------
  function showHow(start) {
    let i = start || 0; const el = screen(`<div class="card how"><div class="head"><h2>${t('how')}</h2><button class="x" type="button" data-k="x" aria-label="${t('close')}">×</button></div><canvas></canvas><h3></h3><p></p><div class="vb"></div><div class="dots">${'<i></i>'.repeat(4)}</div><div class="row"><button class="btn" type="button" data-k="b">${t('back')}</button><button class="btn pri" type="button" data-k="n">${t('next')}</button></div></div>`);
    const c = el.querySelector('canvas'), hg = c.getContext('2d'), h3 = el.querySelector('h3'), p = el.querySelector('p'), vb = el.querySelector('.vb');
    const fog = document.createElement('canvas'); fog.width = 120; fog.height = 75; const fg = fog.getContext('2d'); const resetFog = () => { fg.globalCompositeOperation = 'source-over'; fg.fillStyle = '#c9d6ea'; fg.fillRect(0, 0, 120, 75); }; resetFog();
    let demo = { v: '', verdict: null, vt: 0 }; let raf = 0, alive = true;
    const word = I18N.LANG === 'en' ? 'AIR' : 'AIRE';
    const draw = (tm) => {
      if (!alive) return; const w = c.clientWidth, h = c.clientHeight, d = Math.min(2, devicePixelRatio || 1); if (c.width !== Math.round(w * d)) { c.width = w * d; c.height = h * d; } hg.setTransform(d, 0, 0, d, 0, 0); DR.bg(hg, w, h);
      if (i === 0) { DR.text(hg, word, w / 2, h / 2, { s: h * .3, w: 800, f: 'pop', c: '#cfe0ff' }); fg.globalCompositeOperation = 'source-over'; fg.fillStyle = 'rgba(201,214,234,.006)'; fg.fillRect(0, 0, 120, 75); hg.globalAlpha = .93; hg.drawImage(fog, 0, 0, w, h); hg.globalAlpha = 1; }
      else if (i === 1) { DR.plate(hg, w * .1, h * .3, w * .8, h * .4, {}); DR.text(hg, demo.verdict === 'ok' ? '✓ ' + t('v.ok').toUpperCase() : (demo.v || '…'), w / 2, h / 2, { s: Math.min(24, h * .12), w: 800, c: demo.verdict === 'ok' ? '#00f2cf' : '#fff', glow: demo.verdict === 'ok' ? '#00f2cf' : null }); }
      else if (i === 2) { const v = demo.verdict, a = Math.max(0, 1 - (performance.now() - demo.vt) / 1500); const col = { ok: '#00f2cf', mid: '#00f2cf', near: '#ffd34d', wrong: '#ff4466' }[v] || '#555'; DR.plate(hg, w * .1, h * .35, w * .8, h * .3, { glow: v ? col : null }); const dx = v === 'wrong' ? Math.sin(performance.now() / 20) * 6 * a : v === 'near' ? Math.sin(performance.now() / 60) * 3 * a : 0; DR.text(hg, v ? t({ ok: 'v.ok', mid: 'v.mid', near: 'v.near', wrong: 'v.wrong' }[v]) : '—', w / 2 + dx, h / 2, { s: Math.min(16, w / 26), w: 700, c: col, f: 'pop' }); }
      else { [t('hint.nudge'), t('hint.method'), t('hint.solution')].forEach((s, k) => { const y = h * (.25 + k * .25); DR.plate(hg, w * .12, y - 18, w * .76, 36, { rivets: false }); DR.text(hg, (k + 1) + '. ' + s, w * .18, y, { s: 14, a: 'left', f: 'pop', w: 600 }); DR.text(hg, '−1 ★', w * .82, y, { s: 13, a: 'right', c: '#ffd34d', w: 700 }); }); DR.iconBulb(hg, w * .5, h * .1, 26, '#ffd34d'); }
      raf = requestAnimationFrame(draw);
    };
    const wipe = (e) => { if (i !== 0) return; const r = c.getBoundingClientRect(); const u = (e.clientX - r.left) / r.width * 120, v = (e.clientY - r.top) / r.height * 75; fg.globalCompositeOperation = 'destination-out'; fg.beginPath(); fg.arc(u, v, 12, 0, 7); fg.fill(); };
    c.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'mouse') wipe(e); }); c.addEventListener('pointerdown', wipe);
    const go = () => {
      h3.textContent = t('how.' + (i + 1) + 't'); p.textContent = t('how.' + (i + 1)); el.querySelectorAll('.dots i').forEach((d, k) => d.classList.toggle('on', k === i));
      el.querySelector('[data-k=b]').disabled = i === 0; el.querySelector('[data-k=n]').textContent = i === 3 ? t('play') : t('next'); demo = { v: '', verdict: null, vt: 0 }; resetFog();
      vb.innerHTML = i === 1 ? `<input class="codein" style="grid-column:1/-1;margin:0" placeholder="${t('how.try')}" maxlength="10"><button type="button" class="send" style="grid-column:1/-1">${t('answer.send')}</button>` : i === 2 ? ['ok', 'mid', 'near', 'wrong'].map(k => `<button type="button" data-v="${k}">${t('how.' + k)}</button>`).join('') : '';
      vb.style.display = 'grid';
      if (i === 1) { const inp = vb.querySelector('input'); inp.oninput = () => { demo.v = inp.value.toUpperCase(); demo.verdict = null; AU.sfx('key'); }; vb.querySelector('button').onclick = () => { const ok = CO.norm(inp.value) === word; demo.verdict = ok ? 'ok' : 'wrong'; AU.sfx(ok ? 'ok' : 'wrong'); }; }
      if (i === 2) vb.querySelectorAll('button').forEach(b => b.onclick = () => { demo.verdict = b.dataset.v; demo.vt = performance.now(); AU.sfx(b.dataset.v === 'ok' ? 'ok' : b.dataset.v); });
    };
    el.querySelector('[data-k=b]').onclick = () => { i = Math.max(0, i - 1); go(); };
    el.querySelector('[data-k=n]').onclick = () => { if (i === 3) { close(); return; } i++; go(); };
    const close = () => { alive = false; cancelAnimationFrame(raf); closeScreen(el); };
    el.querySelector('[data-k=x]').onclick = close; go(); raf = requestAnimationFrame(draw); el._re = () => { alive = false; cancelAnimationFrame(raf); showHow(i); };
  }
  // ---------- cuaderno ----------
  function openNotebook(tab0) {
    const G = CO.G; if (!G) return; const mod = APP.mod || (G.room !== 'hub' ? G.room : 'prologo') || 'prologo'; let tab = tab0 === 'clips' ? 'clips' : 'notes';
    const el = screen(`<div class="card wide"><div class="head"><h2 tabindex="-1">${t('notebook')} · <span style="color:var(--mod)">${t('m.' + mod)}</span></h2><button class="x" type="button" data-k="x" aria-label="${t('close.notebook')}">×</button></div><div class="tabs" role="tablist"><button type="button" role="tab" data-tab="notes">${t('notebook.notes')}</button><button type="button" role="tab" data-tab="clips">${t('notebook.clips')} (${G.clips.length})</button></div><div class="nb"></div></div>`);
    const nb = el.querySelector('.nb'); let deb = 0;
    const render = () => {
      el.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('on', b.dataset.tab === tab); b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false'); });
      if (tab === 'notes') { nb.innerHTML = `<textarea class="notes" maxlength="4000" placeholder="${esc(t('notebook.ph'))}"></textarea>`; const ta = nb.querySelector('textarea'); ta.value = G.notes[mod] || ''; ta.oninput = () => { clearTimeout(deb); deb = setTimeout(() => { G.notes[mod] = ta.value.slice(0, 4000); CO.saveGame(); }, 1000); }; }
      else if (!G.clips.length) nb.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24"><path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/></svg>${t('notebook.empty')}</div>`;
      else { // RSP-ESTACION-01 · tarjeta no interactiva con dos botones hermanos (abrir / eliminar) y visor como diálogo con cierre explícito
        const ctxOf = (c) => C.puzzles[c.p] ? SC.shortId(c.p) + ' · ' + L2(C.puzzles[c.p].t) : SC.shortId(c.p);
        nb.innerHTML = `<div class="clips">${G.clips.map((c, i) => `<div class="clip"><button type="button" class="clip-open" data-i="${i}" aria-label="${esc(t('clip.open', { contexto: ctxOf(c) }))}"><img alt="" src="${c.img}"><small aria-hidden="true">${esc(SC.shortId(c.p))}</small></button><button type="button" class="clip-delete" data-del="${i}" aria-label="${esc(t('clip.del', { contexto: ctxOf(c) }))}">×</button></div>`).join('')}</div>`;
        nb.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const i = +b.dataset.del; G.clips.splice(i, 1); CO.saveGame(); render(); const opens = nb.querySelectorAll('.clip-open'); const nx = opens[Math.min(i, opens.length - 1)]; (nx || el.querySelector('h2')).focus({ preventScroll: true }); });
        nb.querySelectorAll('.clip-open').forEach(b => b.onclick = () => { const c = G.clips[+b.dataset.i]; if (!c) return; const title = t('clip.title', { contexto: ctxOf(c) }); const v = screen(`<div class="card viewer" style="max-width:560px"><div class="head"><h2>${esc(title)}</h2><button class="x" type="button" data-k="x" aria-label="${t('close')}">×</button></div><img alt="${esc(title)}" src="${c.img}"></div>`, 'veil', b); v.querySelector('[data-k=x]').onclick = () => closeScreen(v); v.addEventListener('click', (e) => { if (e.target === v) closeScreen(v); }); }); }
    };
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    el._re = () => { const ta = nb.querySelector('textarea'); if (ta) { clearTimeout(deb); G.notes[mod] = ta.value.slice(0, 4000); CO.saveGame(); } openNotebook(tab); };
    el.querySelector('[data-k=x]').onclick = () => { if (tab === 'notes') { const ta = nb.querySelector('textarea'); if (ta) { G.notes[mod] = ta.value.slice(0, 4000); CO.saveGame(); } } closeScreen(el); };
    render();
  }
  // ---------- bitácora ----------
  const REC_ORDER = ['p1', 'p2', 'p3', ...CO.MODS.flatMap(m => CO.MOD_PUZ[m]), 'final'].map(x => 'rec-' + x);
  function recModule(rid) { const id = rid.slice(4); return C.puzzles[id] ? C.puzzles[id].mod : 'prologo'; }
  async function recText(rid) {
    const R = C.rec[rid]; const L = I18N.LANG;
    if (R.tx) return L2(R.tx);
    if (rid === 'rec-final') { const nm = CO.nameOfGame(); return await CO.decryptRec(R.enc[nm][L], nm, rid); }
    const mod = recModule(rid); let s = await CO.decryptRec(R.enc[L], CO.META_WORD[mod], rid); if (s == null) return '…';
    if (rid === 'rec-ar-meta') { const order = CO.prevLoopOrder(); const list = order.map((m, i) => `${L2(C.modnames[m])}, ${I18N.LANG === 'en' ? 'cycle' : 'ciclo'} 0${391 + i * 4}`).join('; '); s = s.replace('{ORDEN}', list).replace('{ORDER}', list); }
    return s;
  }
  // nombre para mostrar: en español lleva su tilde (Adrián, Martín); la respuesta se sigue escribiendo sin ella
  function dispName() { const nm = CO.nameOfGame(), N = nm[0] + nm.slice(1).toLowerCase(); return I18N.LANG === 'es' ? ({ ADRIAN: 'Adrián', MARTIN: 'Martín' }[nm] || N) : N; }
  function recSigned(rid) { const R = C.rec[rid]; if (rid === 'rec-final' || (rid === 'rec-p1' && CO.G.finished)) return dispName(); return L2(R.by); }
  let playing = null;
  function stopPlay() { if (playing) { playing.stop(); playing = null; } }
  // PLAY-ESTACION-04: «Leer transcripción» (opts.read) muestra el texto completo sin audio ni animación; Reproducir/Detener reinicia desde el principio (no hay pausa real).
  const ICO_PLAY = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>', ICO_STOP = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';
  async function player(host, rid, auto, opts = {}) {
    stopPlay(); const txt = await recText(rid); const words = txt.split(/\s+/); const R = C.rec[rid];
    host.innerHTML = `<div class="player"><div class="meta">${esc(recSigned(rid))} · ${I18N.LANG === 'en' ? 'Cycle' : 'Ciclo'} ${esc(R.c)}</div><canvas aria-hidden="true"></canvas><div class="tr ${opts.read ? 'read' : ''}">${words.map(w => `<span class="${opts.read ? 'on' : ''}">${esc(w)}</span> `).join('')}</div><div class="humbars" aria-hidden="true"><em>${t('log.hum')}</em>${[62, 69, 72, 71].map(m => `<i style="height:${10 + (m - 60) * 2}px"></i>`).join('')}</div><div class="row" style="margin-top:10px"><button class="btn sm cy" type="button" data-k="pl">${ICO_PLAY}${t('log.play')}</button>${opts.read ? '' : `<button class="btn sm" type="button" data-k="rd">${t('log.read')}</button>`}</div></div>`;
    const spans = [...host.querySelectorAll('.tr span')], cnv = host.querySelector('canvas'), cg = cnv.getContext('2d'); const btn = host.querySelector('[data-k=pl]');
    const rd = host.querySelector('[data-k=rd]'); if (rd) rd.onclick = () => { stop(); spans.forEach(s => s.classList.add('on')); rd.remove(); if (CO.G.rec[rid] === 'new') { CO.G.rec[rid] = 'heard'; saveSoon(); setGameChrome(['room', 'hub'].includes(APP.scr)); } };
    if (opts.read && CO.G.rec[rid] === 'new') { CO.G.rec[rid] = 'heard'; saveSoon(); setGameChrome(['room', 'hub'].includes(APP.scr)); }
    let on = false, idx = 0, tmr = 0, raf = 0, amp = 0;
    const draw = () => { const w = cnv.clientWidth, h = cnv.clientHeight, d = Math.min(2, devicePixelRatio || 1); if (cnv.width !== Math.round(w * d)) { cnv.width = w * d; cnv.height = h * d; } cg.setTransform(d, 0, 0, d, 0, 0); cg.clearRect(0, 0, w, h); amp *= .9; cg.strokeStyle = '#00f2cf'; cg.lineWidth = 2; cg.beginPath(); for (let x = 0; x < w; x += 3) { const y = h / 2 + Math.sin(x * .09 + performance.now() / 120) * (2 + amp * 16) * Math.sin(x / w * Math.PI); x ? cg.lineTo(x, y) : cg.moveTo(x, y); } cg.stroke(); if (host.isConnected) raf = requestAnimationFrame(draw); };
    const step = () => { if (!on) return; if (idx < spans.length) { spans[idx].classList.add('on'); AU.syllable(); amp = 1; const w = spans[idx].textContent; idx++; tmr = setTimeout(step, 130 + w.length * 38 + (/[.,:;?]$/.test(w) ? 260 : 0)); } else { AU.murmurStop(); const tb = REC_ORDER.indexOf(rid) % 4; const d = AU.hum(tb); tmr = setTimeout(() => { on = false; btn.innerHTML = ICO_PLAY + t('log.play'); }, d * 1000); CO.G.rec[rid] = 'heard'; saveSoon(); setGameChrome(['room', 'hub'].includes(APP.scr)); } };
    const start = () => { AU.unlock(); on = true; idx = 0; spans.forEach(s => s.classList.remove('on')); AU.murmurStart(); btn.innerHTML = ICO_STOP + t('log.stop'); step(); };
    const stop = () => { on = false; clearTimeout(tmr); AU.murmurStop(); btn.innerHTML = ICO_PLAY + t('log.play'); };
    btn.onclick = () => on ? stop() : start(); draw(); playing = { stop: () => { stop(); cancelAnimationFrame(raf); } };
    if (auto) setTimeout(start, 400);
  }
  function openLog(focus, opts = {}) {
    const G = CO.G; if (!G) return; const have = REC_ORDER.filter(r => G.rec[r]);
    const el = screen(`<div class="card wide"><div class="head"><h2>${t('log')}</h2><button class="x" type="button" data-k="x" aria-label="${t('close.log')}">×</button></div><div class="pl"></div><div class="recs"></div></div>`);
    const list = el.querySelector('.recs'), pl = el.querySelector('.pl');
    if (!have.length) list.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="11" rx="2"/><circle cx="8" cy="12.5" r="2"/><circle cx="16" cy="12.5" r="2"/></svg>${t('log.empty')}</div>`;
    else { let html = '', last = ''; for (const r of REC_ORDER) { if (!G.rec[r]) continue; const m = recModule(r); if (m !== last) { html += `<div class="recg">${t('m.' + m)}</div>`; last = m; } const R = C.rec[r]; html += `<button class="rec" type="button" data-r="${r}"><span><span class="m">${I18N.LANG === 'en' ? 'Cycle' : 'Ciclo'} ${esc(R.c)} · ${esc(recSigned(r))}</span><b>${esc(L2((C.puzzles[r.slice(4)] || { t: ['', ''] }).t))}</b></span>${G.rec[r] === 'new' ? `<span class="new">${I18N.LANG === 'en' ? 'NEW' : 'NUEVA'}</span>` : ''}</button>`; } list.innerHTML = html; }
    list.querySelectorAll('.rec').forEach(b => b.onclick = () => { player(pl, b.dataset.r, true); pl.scrollIntoView({ behavior: 'smooth' }); const n = b.querySelector('.new'); if (n) n.remove(); });
    el.querySelector('[data-k=x]').onclick = () => { stopPlay(); closeScreen(el); }; el._re = () => { stopPlay(); openLog(); };
    if (focus && G.rec[focus]) player(pl, focus, !opts.read, opts);
  }
  // ---------- mapa ----------
  function openMap() {
    const el = screen(`<div class="card"><div class="head"><h2>${t('map')}</h2><button class="x" type="button" data-k="x" aria-label="${t('close')}">×</button></div><div class="mapg">${CO.MODS.map(m => `<button type="button" data-m="${m}" class="${APP.mod === m ? 'cur' : ''}" ${CO.modUnlocked(m) ? '' : 'disabled'}><b style="color:${CO.MOD_COL[m]}">${t('m.' + m)}</b><small>${CO.G.metas[m] ? t('restored') : CO.modUnlocked(m) ? CO.modProgress(m) + '/5' : t(m === 'energia' ? 'sealed.pressure' : 'sealed.power')}</small></button>`).join('')}<button type="button" class="obs" data-m="observatorio" ${CO.modUnlocked('observatorio') ? '' : 'disabled'}><b>${t('m.observatorio')}</b><small>${CO.modUnlocked('observatorio') ? '' : t('sealed.core')}</small></button><button type="button" class="obs" data-m="hub"><b>${I18N.LANG === 'en' ? 'Ring' : 'Anillo'}</b></button></div></div>`);
    el.querySelector('[data-k=x]').onclick = () => closeScreen(el); el._re = openMap;
    el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { closeScreen(el); closeInsp(true); const m = b.dataset.m; door(() => m === 'hub' ? goHub() : enterRoom(m)); });
  }
  // ---------- módulo restaurado ----------
  function showRestored(mod) {
    AU.sfx('restored'); AU.setLayers(5); AU.vibrate([30, 60, 30]); const L = plateLetters(); const ch = L[L.length - 1];
    const el = screen(`<div class="card restored" style="text-align:center"><span class="kick">${t('restored')}</span><h2 style="font-size:28px;margin:6px 0;color:${CO.MOD_COL[mod]}">${t('m.' + mod)}</h2><canvas class="glyph"></canvas><p style="font:700 12px 'JetBrains Mono',monospace;color:var(--dim);letter-spacing:.14em">${t('plate')} · ${CO.G.plate.length}/6</p><div class="pl" style="text-align:left;margin-top:12px"></div><button class="btn pri" type="button" data-k="hub">${t('restored.back')}</button><button class="btn" type="button" data-k="share">${t('restored.share')}</button></div>`);
    const c = el.querySelector('canvas'), cg = c.getContext('2d'); const d = Math.min(2, devicePixelRatio || 1); c.width = 120 * d; c.height = 120 * d; cg.setTransform(d, 0, 0, d, 0, 0); let t0 = performance.now();
    const anim = () => { if (!el.isConnected) return; const p = Math.min(1, (performance.now() - t0) / 1600); cg.clearRect(0, 0, 120, 120); DR.glow(cg, 60, 60, 60 * p, CO.MOD_COL[mod], .8); SC.plateGlyph(cg, ch, 60, 60, 80, 0); requestAnimationFrame(anim); }; anim(); setTimeout(() => AU.sfx('glyph'), 700);
    player(el.querySelector('.pl'), 'rec-' + CO.META_OF[mod], true);
    el.querySelector('[data-k=hub]').onclick = () => { stopPlay(); closeScreen(el); door(goHub); };
    el.querySelector('[data-k=share]').onclick = (e) => share(shareProgress(), e.currentTarget);
    if (mod === 'energia') setTimeout(() => toast(I18N.LANG === 'en' ? 'Four rooms open, in any order.' : 'Se abren cuatro salas, en el orden que quieras.', 'ok', { ms: 4000 }), 1200);
    if (CO.MODS.every(m => CO.G.metas[m])) setTimeout(() => toast(I18N.LANG === 'en' ? 'The observatory at the core is open.' : 'El observatorio del núcleo está abierto.', 'ok', { ms: 4500 }), 2400);
  }
  // ---------- final ----------
  async function finale(name, replay) {
    const G = CO.G; closeAll(); APP.scr = 'final'; APP.finalT = 0; setGameChrome(false); AU.ambience(null); AU.music('final', 5);
    if (!replay) { G.finished = true; G.finishedAt = Date.now(); const stars = CO.totalStars(); const R = CO.REC; APP.newRecord = stars > R.bestStars || (stars === R.bestStars && (!R.bestTimeMs || G.activeMs < R.bestTimeMs)); R.bestStars = Math.max(R.bestStars, stars); if (!R.bestTimeMs || G.activeMs < R.bestTimeMs) R.bestTimeMs = G.activeMs; R.completions++; CO.saveRecords(); CO.saveGame(); }
    const nm = CO.nameOfGame(), Nm = dispName();
    // 1) la placa se completa letra por letra con el tarareo armonizado
    const el = screen(`<div class="cine"><span class="kick">${t('plate')}</span><canvas style="width:min(90vw,520px);height:120px;margin:16px 0"></canvas><div class="line2">${esc(Nm)}</div><button class="skip on" type="button">${t('skip')}</button></div>`, 'solid');
    const c = el.querySelector('canvas'), cg = c.getContext('2d'); const d = Math.min(2, devicePixelRatio || 1); const t0 = performance.now(); AU.hum(0, true);
    const anim = () => { if (!el.isConnected) return; const w = c.clientWidth, h = c.clientHeight; if (c.width !== Math.round(w * d)) { c.width = w * d; c.height = h * d; } cg.setTransform(d, 0, 0, d, 0, 0); cg.clearRect(0, 0, w, h); const k = (performance.now() - t0) / 1000; for (let i = 0; i < 6; i++) { const p = Math.max(0, Math.min(1, (k - 1 - i * .12) / .5)); SC.plateGlyph(cg, nm[i], w / 2 + (i - 2.5) * Math.min(80, w / 6.5), h / 2, Math.min(70, w / 8), p, '#00f2cf'); if (p > 0 && p < .1) AU.sfx('letter', i * 2); } requestAnimationFrame(anim); }; anim();
    setTimeout(() => el.querySelector('.line2').classList.add('on'), 2200);
    const step2 = () => { if (!el.isConnected) return; closeScreen(el); finalRec(Nm); };
    el.querySelector('.skip').onclick = step2; setTimeout(step2, 6500);
  }
  function finalRec(Nm) {
    const el = screen(`<div class="card wide"><span class="kick">${t('log.new')}</span><div class="pl" style="margin-top:10px"></div><button class="btn pri" type="button" data-k="go">${t('next')}</button></div>`, 'solid');
    if (!CO.G.rec['rec-final']) CO.G.rec['rec-final'] = 'new'; player(el.querySelector('.pl'), 'rec-final', true);
    el.querySelector('[data-k=go]').onclick = () => { stopPlay(); closeScreen(el); finalCine(Nm); };
  }
  function finalCine(Nm) {
    APP.scr = 'finalCine'; APP.finalT = 0;
    const el = screen(`<div class="cine" style="justify-content:flex-end;padding-bottom:12vh"><div class="type"></div><button class="skip" type="button">${t('skip')}</button></div>`, '');
    el.style.background = 'transparent'; const ty = el.querySelector('.type'); const full = t('end.cine', { n: Nm.toUpperCase() }).replace(/ · /g, '\n'); let i = 0, done = false;
    const tp = () => { if (done) return; ty.textContent = full.slice(0, ++i); if (i < full.length) setTimeout(tp, 60); }; setTimeout(tp, 3000);
    const sk = el.querySelector('.skip'); setTimeout(() => sk.classList.add('on'), 2000);
    const end = () => { if (done) return; done = true; closeScreen(el); credits(Nm); }; sk.onclick = end; setTimeout(end, 25000);
  }
  function credits(Nm) {
    APP.scr = 'credits';
    const el = screen(`<div class="cine"><div class="credits"><b>${t('title')}</b>${t('credits.1')}<b>${t('credits.2')}</b>JET//Games<b>${t('credits.3')}</b>${I18N.LANG === 'en' ? 'Synthesized with Web Audio, no samples' : 'Sintetizada con Web Audio, sin muestras'}<b>${t('credits.4')}</b>${esc(Nm)}<b style="margin-top:40px;font-size:24px;color:var(--cy)">${t('end.thanks')}</b></div><button class="skip on" type="button">${t('skip')}</button></div>`, 'solid');
    const cr = el.querySelector('.credits'); cr.animate([{ transform: 'translateY(40vh)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: .25 }, { transform: 'translateY(0)', opacity: 1, offset: .8 }, { transform: 'translateY(-10vh)', opacity: 0 }], { duration: 20000, fill: 'forwards' });
    let done = false; const end = () => { if (done) return; done = true; closeScreen(el); epilogue(Nm); }; el.querySelector('.skip').onclick = end; setTimeout(end, 20000);
  }
  function epilogue(Nm) {
    APP.scr = 'home';
    const el = screen(`<div class="card" style="text-align:center"><span class="kick">${t('log')}</span><div class="pl" style="text-align:left;margin:10px 0"></div><p style="font-size:17px;font-weight:600;margin:12px 0 18px">${t('end.line')}</p><button class="btn pri" type="button" data-k="res">${I18N.LANG === 'en' ? 'See result' : 'Ver resultado'}</button><button class="btn" type="button" data-k="np">${t('cta.newplus')}</button></div>`, 'veil');
    player(el.querySelector('.pl'), 'rec-p1', false);
    el.querySelector('[data-k=res]').onclick = () => { stopPlay(); closeScreen(el); result(); };
    const np = el.querySelector('[data-k=np]'); np.onclick = () => { stopPlay(); confirmNewGame(null, np); };
  }
  function rankOf(s) { return s >= 95 ? 1 : s >= 80 ? 2 : s >= 55 ? 3 : 4; }
  function result() {
    const G = CO.G; const s = CO.totalStars(); const clean = Object.values(G.pz).filter(x => x.st === 'solved' && !x.hints).length; const nm = CO.nameOfGame();
    const txt = `${t('title')} · ${I18N.LANG === 'en' ? 'STATION RESTORED' : 'ESTACIÓN RESTAURADA'}\n★ ${s}/102 · ${t('rank.' + rankOf(s))} · ${fmtTime(G.activeMs)} · ${G.hintsUsed} ${I18N.LANG === 'en' ? (G.hintsUsed === 1 ? 'hint' : 'hints') : (G.hintsUsed === 1 ? 'ayuda' : 'ayudas')}\n${CO.MODS.map(m => CO.MOD_PUZ[m].some(id => G.pz[id] && G.pz[id].hints >= 3) ? '🟡' : '🟢').join('')}✨\nhttps://jetgames.fun/estacion/`;
    const el = screen(`<div class="card"><p class="big-t">${t('res.title')}</p><p class="rank">${t('rank.' + rankOf(s)).toUpperCase()}</p>${APP.newRecord ? `<p style="text-align:center;color:#ffd34d;font-weight:700;margin-top:6px">${t('res.record')}</p>` : ''}<div class="lines"><div><span>${t('res.name')}</span><b>${esc(dispName())}</b></div><div><span>${t('res.stars')}</span><b>★ ${s}/102</b></div><div><span>${t('res.time')}</span><b>${fmtTime(G.activeMs)}</b></div><div><span>${t('res.hints')}</span><b>${G.hintsUsed}</b></div><div><span>${t('res.clean')}</span><b>${clean}</b></div></div><button class="btn pri" type="button" data-k="sh">${t('share')}</button><button class="btn" type="button" data-k="np">${t('cta.newplus')}</button><button class="btn" type="button" data-k="home">${t('pause.home')}</button></div>`);
    el.querySelector('[data-k=sh]').onclick = (e) => share(txt, e.currentTarget); const np = el.querySelector('[data-k=np]'); np.onclick = () => confirmNewGame(null, np); el.querySelector('[data-k=home]').onclick = () => goHome();
  }

  // ================= transmisión del día =================
  const DAILY_HINT_FROM = { wheel: 'en-1', braille: 'en-3', morse: 'en-4', catalog: 'na-2' };
  function dailyPuzzle(item) { const base = C.puzzles[DAILY_HINT_FROM[item.type]]; return { id: 'daily', mod: 'daily', type: item.type, meta: false, t: base.t, amb: [I18N.T.es['daily.sub'], I18N.T.en['daily.sub']], q: base.q, h: base.h }; }
  function todayItem() { const d = CO.localDate(); return C.daily[CO.dailyIndex(d)]; }
  function loadDailyState() { const d = CO.localDate(); const D = CO.DAILY; if (!D.today || D.today.date !== d) D.today = { date: d, att: [], hints: 0, solved: false, ms: 0, ui: {} }; APP.dstate = D.today; APP.dailyUI = D.today.ui; return D.today; }
  function saveDailyState() { CO.saveDaily(); }
  function showDaily() {
    closeAll(); APP.scr = 'dailyHome'; setGameChrome(false); musicFor(); const st = loadDailyState(); const D = CO.DAILY;
    const now = new Date(), mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); const left = mid - now; const hh = Math.floor(left / 3600000), mm = Math.floor(left % 3600000 / 60000);
    const el = screen(`<div class="card" style="text-align:center"><div class="head"><h2 style="text-align:left">${t('daily.title')}</h2><button class="x" type="button" data-k="x" aria-label="${t('close')}">×</button></div><p class="kick">${st.date}</p><p style="color:var(--dim);margin:8px 0 16px">${t('daily.sub')}</p>
      ${st.solved ? `<p class="big-t" style="color:var(--cy)">📡 ${t('daily.done')}</p><div class="lines"><div><span>${t('daily.time')}</span><b>${fmtTime(st.ms) === '0 ' + t('mins') ? '<1 ' + t('mins') : fmtTime(st.ms)}</b></div><div><span>${t('daily.att')}</span><b>${st.att.length + 1}</b></div><div><span>${t('daily.hints')}</span><b>${st.hints}</b></div><div><span>${t('daily.streak', { n: '' }).trim()}</span><b>🔥 ${D.streak}</b></div></div><p class="kick" style="color:var(--dim)">${t('daily.next', { h: hh, m: mm })}</p><button class="btn pri" type="button" data-k="sh" style="margin-top:14px">${t('share')}</button><button class="btn" type="button" data-k="go">${t('daily.again')}</button>`
        : `<p class="streak" style="font-size:16px;margin-bottom:14px">🔥 ${t('daily.streak', { n: D.streak })} · ${t('daily.best', { n: D.best })}</p><button class="btn pri big" type="button" data-k="go">${I18N.LANG === 'en' ? 'Receive transmission' : 'Recibir transmisión'}</button>`}
      <button class="btn" type="button" data-k="home">${t('pause.home')}</button></div>`);
    el.querySelector('[data-k=x]').onclick = () => goHome(); el.querySelector('[data-k=home]').onclick = () => goHome();
    el.querySelector('[data-k=go]').onclick = () => { AU.unlock(); closeScreen(el); APP.daily = todayItem(); openInsp(null, { daily: APP.daily }); if (st.solved) { ans.value = CO.C.daily ? '' : ''; } };
    const sh = el.querySelector('[data-k=sh]'); if (sh) sh.onclick = (e) => share(`${t('title')} · ${I18N.LANG === 'en' ? 'Transmission' : 'Transmisión'} ${st.date}\n📡 ${I18N.LANG === 'en' ? 'Received in' : 'Recibida en'} ${Math.max(1, Math.round(st.ms / 60000))} ${t('mins')} · ${st.att.length + 1} ${I18N.LANG === 'en' ? (st.att.length ? 'attempts' : 'attempt') : (st.att.length ? 'intentos' : 'intento')} · ${st.hints ? st.hints + ' ' + (I18N.LANG === 'en' ? (st.hints > 1 ? 'hints' : 'hint') : (st.hints > 1 ? 'ayudas' : 'ayuda')) : (I18N.LANG === 'en' ? 'no hints' : 'sin ayudas')}\n🔥 ${I18N.LANG === 'en' ? 'Streak' : 'Racha'} ${D.streak}\nhttps://jetgames.fun/estacion/`, e.currentTarget);
  }
  function dailySolved(cx) {
    const D = CO.DAILY, st = APP.dstate; if (!st.solved) { st.solved = true; const today = st.date; D.streak = D.lastSolved === CO.prevDate(today) ? D.streak + 1 : (D.lastSolved === today ? D.streak : 1); D.lastSolved = today; D.best = Math.max(D.best, D.streak); CO.saveDaily(); }
    AU.sfx('ok'); AU.vibrate(30); flashStage(); $('#iStamp').textContent = t('daily.done').toUpperCase(); $('#iStamp').classList.add('on'); ans.disabled = true;
    setTimeout(() => { closeInsp(true); APP.daily = null; showDaily(); }, 1500);
  }

  // ================= teclado =================
  addEventListener('keydown', (e) => {
    AU.unlock(); const tag = (document.activeElement || {}).tagName; const inOther = /INPUT|TEXTAREA|SELECT/.test(tag) && document.activeElement !== ans;
    // RSP-MODALS-01 · ciclo Tab contenido en la capa superior (la pantalla de inicio no es un diálogo)
    if (e.key === 'Tab') { const tp = top(); if (tp && !tp.classList.contains('home')) { const f = focusables(tp); if (!f.length) { e.preventDefault(); return; } const i = f.indexOf(document.activeElement); if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); } } return; }
    // RSP-NATIVE-KEYS-01 · Enter/Espacio sobre un control activan ese control, nunca una acción del juego
    const onCtl = e.target && e.target.closest && e.target.closest('button,a[href],input,textarea,select,summary');
    if (onCtl && (e.key === 'Enter' || e.key === ' ') && e.target !== ans) return;
    if (e.altKey && !e.ctrlKey && !e.metaKey) { const k = e.key.toLowerCase(); if (CO.G && inGame()) { if (k === 'n') { e.preventDefault(); openNotebook(); } else if (k === 'b') { e.preventDefault(); openLog(); } else if (k === 'm' && CO.isSolved('p3')) { e.preventDefault(); openMap(); } else if (k === 'h' && APP.cx) { e.preventDefault(); openHints(); } } return; }
    if (e.key === 'Escape') {
      if (APP.scr === 'intro' && APP.introSkip) { APP.introSkip(); return; }
      const tp = top(); if (tp) { if (tp.dataset.pause) APP.resumeFn(); else { const x = tp.querySelector('[data-k=x]'); if (x) x.click(); else if (APP.scr !== 'final' && APP.scr !== 'finalCine' && APP.scr !== 'credits') closeScreen(tp); } return; }
      if (APP.insp) { if (ans.value && !ans.disabled) { ans.value = ''; renderEnum(); } else closeInsp(); return; }
      if (inGame()) pause(); return;
    }
    if (inOther || top()) return;
    if (APP.insp && APP.cx) {
      const typing = document.activeElement === ans;
      if (!typing && APP.R.key && APP.R.key(APP.cx, e)) { e.preventDefault(); return; }
      if (typing && !ans.value && /^Arrow/.test(e.key) && APP.R.key && APP.R.key(APP.cx, e)) { e.preventDefault(); return; }
      if (!typing && e.key.length === 1 && /[\p{L}\p{N}]/u.test(e.key) && !e.ctrlKey && !e.metaKey && !ans.disabled) { ans.focus({ preventScroll: true }); }
      return;
    }
    if ((e.key === 'p' || e.key === 'P') && inGame()) pause();
    if (APP.scr === 'room' && !APP.insp && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !onCtl) { e.preventDefault(); panRoom(e.key === 'ArrowLeft' ? -1 : 1); }
  });
  // PLAY-ESTACION-07 · la vista de la sala se puede desplazar con controles visibles y flechas, además del arrastre
  function panRoom(dir) { const cam = APP.cam; if (!cam || cam.pan <= 0) return; APP.rs.px = Math.max(0, Math.min(cam.pan, APP.rs.px + dir * W * .5)); APP.rs.follow = false; }
  $('#rpL').onclick = () => panRoom(-1); $('#rpR').onclick = () => panRoom(1);
  function syncRoomPan() { const cam = APP.cam; const show = APP.scr === 'room' && !APP.insp && !!cam && cam.pan > 0; const rp = $('#roomPan'); if (rp.hidden === show) rp.hidden = !show; if (show) { $('#rpL').disabled = APP.rs.px <= 1; $('#rpR').disabled = APP.rs.px >= cam.pan - 1; } }

  // ================= visibilidad =================
  document.addEventListener('visibilitychange', () => { if (document.hidden) { CO.saveGame(); AU.suspend(); if (inGame() && !APP.paused && CO.G) pause(); } else { if (!inGame()) AU.resume(); } });
  addEventListener('pagehide', () => { CO.saveGame(); if (APP.dstate) CO.saveDaily(); });
  addEventListener('pointerdown', () => AU.unlock(), { capture: true });

  // ================= bucle =================
  function frame(now) {
    const dt = Math.min(.1, (now - APP.last) / 1000); APP.last = now; APP.tm += dt; const tm = APP.tm;
    const nb = !(['home', 'dailyHome'].includes(APP.scr) && !APP.insp) || DEMO; if (nb !== APP._nb) { APP._nb = nb; document.body.classList.toggle('noback', nb); }
    const G = CO.G; const active = !APP.paused && !document.hidden && G && (inGame());
    if (active) { G.activeMs += dt * 1000; if (APP.cx && !APP.cx.daily) { const st = CO.pz(APP.cx.id); if (st.st !== 'solved') { st.active = (st.active || 0) + dt * 1000; const free = APP.cx.id === 'p3' && !G.freeHintUsed; const lim = free ? 90000 : 240000; if (st.active - (st.offerAt || 0) > lim && st.hints < 3 && $('#offer').hidden) { st.offerAt = st.active; $('#offer').hidden = false; setTimeout(() => $('#offer').hidden = true, 12000); } if (st.solT != null) { st.solT -= dt * 1000; tickSol(); if (st.solT <= 0) solutionReady(APP.cx); } } } }
    if (APP.cx && APP.cx.daily && !APP.paused && !document.hidden && APP.dstate && !APP.dstate.solved) APP.dstate.ms += dt * 1000;
    if (G && active && Math.floor(G.activeMs / 15000) !== Math.floor((G.activeMs - dt * 1000) / 15000)) saveSoon();
    // fondo
    const portraitInsp = APP.insp && !document.body.classList.contains('land');
    if (!portraitInsp || (APP.frameN = (APP.frameN || 0) + 1) % 20 === 0) {
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (APP.scr === 'room') {
        const listH = $('#roomList').hidden ? 0 : $('#roomList').offsetHeight; const topH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topH')) + 8 + (parseFloat(getComputedStyle($('#top')).paddingTop) || 0) - 6;
        const cam = SC.camFor(APP.mod, W, H, { top: topH, bot: Math.max(listH - 24, 8) }); APP.cam = cam; const rs = APP.rs;
        if (rs.ax !== rs.tx) { const v = rs.walkV || 600; const dd = rs.tx - rs.ax; const stp = Math.sign(dd) * Math.min(Math.abs(dd), v * dt); rs.ax += stp; rs.ph += dt * 12; rs.face = dd > 0 ? 'r' : 'l'; if (Math.floor(rs.ph / Math.PI) !== Math.floor((rs.ph - dt * 12) / Math.PI)) AU.sfx('step'); rs.follow = true; }
        else if (rs.pending) { const id = rs.pending; rs.pending = null; openInsp(id); }
        if (rs.follow !== false && cam.pan > 0) { const want = Math.max(0, Math.min(cam.pan, rs.ax * cam.s - W / 2)); rs.px += (want - rs.px) * Math.min(1, dt * 4); }
        rs.px = Math.max(0, Math.min(cam.pan, rs.px)); syncRoomPan();
        SC.room(g, W, H, tm, { mod: APP.mod, cam, px: rs.px, ax: rs.ax, tx: rs.tx, ph: rs.ph, face: rs.face, sel: rs.sel, hover: rs.hover, get hot() { return rs.hot; }, set hot(v) { rs.hot = v; } });
      } else if (APP.scr === 'hub') { const land = document.body.classList.contains('land'); const topH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topH')) + (land ? 6 : 50); APP.hs.top = topH; APP.hs.bot = land ? 10 : 80; SC.hub(g, W, H, tm, APP.hs); }
      else if (APP.scr === 'intro') { APP.introT += dt; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); const p = Math.min(1, Math.max(0, (APP.introT - 6) / 10)); if (p > 0) { DR.glow(g, W / 2, H / 2, Math.min(W, H) * .6 * p, '#5a8cff', p * .8); g.fillStyle = `rgba(200,215,240,${p * .15})`; DR.rrect(g, W * .2, H * .25, W * .6, H * .5, Math.min(W, H) * .2); g.fill(); } }
      else if (APP.scr === 'finalCine') { APP.finalT += dt; const k = Math.min(1, APP.finalT / 20); g.fillStyle = '#04010a'; g.fillRect(0, 0, W, H); SC.starfield(g, W, H, tm); SC.earth(g, W / 2, H * .45, Math.min(W, H) * (.12 + .3 * k), tm); for (let i = 0; i < 6; i++) { const on = APP.finalT > 2 + i * 1.5; const a = -Math.PI / 2 + i * Math.PI / 3; DR.glow(g, W / 2 + Math.cos(a) * Math.min(W, H) * .42, H * .45 + Math.sin(a) * Math.min(W, H) * .42, on ? 40 : 0, CO.MOD_COL[CO.MODS[i]], on ? 1 : 0); } TS = Math.min(W, H) * .1; drawAstro(g, W * (.2 + .25 * k), H * (.78 - .1 * k), 'u', 0, 0, 0, tm, APP.finalT > 18 ? (APP.finalT % 2) : 0); }
      else { const hc = APP.scr === 'home' && document.querySelector('.home .hcard'); SC.home(g, W, H, tm, { cardTop: hc ? hc.getBoundingClientRect().top : 0 }); }
    }
    // inspector
    if (APP.cx && !APP.R.dom) { if (icv.width !== Math.round(IW * DPR) || IW === 0) sizeInsp(); const z = APP.zoom; ig.setTransform(DPR * z.z, 0, 0, DPR * z.z, DPR * z.x, DPR * z.y); APP.cx.w = IW; APP.cx.h = IH; try { APP.R.draw(ig, APP.cx, tm, dt); } catch (err) { console.warn(err); } }
    requestAnimationFrame(frame);
  }

  // ================= gancho de pruebas window.ESTACION =================
  window.ESTACION = {
    get state() { return CO.G; }, get seed() { return CO.G && CO.G.seed; }, app: APP,
    goto(room) { if (room === 'hub') goHub(); else if (room === 'home') goHome(); else enterRoom(room); },
    open(id) { openInsp(id); }, submit: (text) => submit(text), close: () => closeInsp(), variant: (id) => CO.variantKey(id),
    setVariant(id, v) { if (!DEBUG) return false; (CO.G.ui._force ||= {})[id] = v; return true; },
    solveAll(mod) { if (!DEBUG) return false; for (const id of CO.MOD_PUZ[mod]) { const s = CO.pz(id); s.st = 'solved'; s.stars = 3; s.ans = '·'; s.solvedAt = Date.now(); CO.G.rec['rec-' + id] ||= 'new'; } if (mod === 'prologo') CO.G.introSeen = true; else if (CO.META_OF[mod]) { CO.G.metas[mod] = true; if (!CO.G.plate.includes(mod)) CO.G.plate.push(mod); } CO.saveGame(); return true; },
    newGame(code) { newGame(code ? CO.seedOf(code) : null); CO.G.introSeen = true; CO.saveGame(); },
    hintsTime(ms) { if (APP.cx && !APP.cx.daily) { const s = CO.pz(APP.cx.id); s.active = (s.active || 0) + ms; if (s.solT != null) s.solT -= ms; } },
    get audio() { return { ctx: AU.ctx && AU.ctx.state, theme: AU.theme, layers: AU.layers, started: AU.started }; },
    get perf() { return { verifyMs: APP.perf.verify.slice(-20) }; }, pause, daily: () => showDaily(), home: () => goHome(), lang: (l) => JETIdioma.set(l),
  };

  // ================= arranque =================
  function boot() {
    initLang(); applyA11y(); AU.applyPrefs(); layout(); refreshFSButtons();
    if (DEMO) { CO.G = CO.freshGame(seedFromQ() || 12345); ['p1', 'p2', 'p3'].forEach(id => CO.pz(id).st = 'solved'); CO.G.metas.oxigeno = CO.G.metas.energia = true; ['na-1', 'na-2', 'na-3', 'na-4'].forEach(id => { const s = CO.pz(id); s.st = 'solved'; s.stars = 3; }); APP.scr = 'room'; APP.mod = 'navegacion'; APP.rs.ax = APP.rs.tx = 1050 + 180; APP.rs.face = 'l'; document.body.classList.add('demo'); $('#back').style.display = 'none'; $('#bGear').style.display = 'none'; requestAnimationFrame(frame); return; }
    CO.G = CO.loadGame(); if (CO.G && Q.get('seed') && CO.seedOf(Q.get('seed')) != null && CO.seedOf(Q.get('seed')) !== CO.G.seed) { /* se respeta la partida guardada; el código se usa al crear una nueva */ }
    showHome(); requestAnimationFrame(frame);
    if (window.__estacionCarga) window.__estacionCarga.listo(); // SRC-G05
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
  }
  function seedFromQ() { const s = Q.get('seed'); return s ? CO.seedOf(s) : null; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
