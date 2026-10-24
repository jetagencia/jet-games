/* JET//Frentes · juego: estado, pantallas, tablero, batalla, red y guardado. Gancho de pruebas: window.FRENTES */
(function () {
  'use strict';
  const C = window.FCore, A = window.FrentesAudio, R = window.FR, ACAD = window.ACADEMIA || [];
  const $ = (id) => document.getElementById(id);
  const VERSION = '1.1.1';
  const QS = new URLSearchParams(location.search);
  const TEST = QS.has('test'), DEMO = QS.has('demo');
  const API = 'api.php';
  const ANIM = TEST ? 0.05 : 1;

  // ---------- guardado (todo en try/catch: el juego funciona sin almacenamiento) ----------
  const PFX = 'jet-frentes:';
  const LS = {
    ok: true,
    get(k, def) { try { const v = localStorage.getItem(PFX + k); return v == null ? def : JSON.parse(v); } catch (e) { LS.ok = false; return def; } },
    set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) { LS.ok = false; } },
    del(k) { try { localStorage.removeItem(PFX + k); } catch (e) { /* nada */ } },
    keys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf(PFX) === 0) out.push(k.slice(PFX.length)); } } catch (e) { /* nada */ } return out; }
  };
  try { localStorage.setItem(PFX + 'probe', '1'); localStorage.removeItem(PFX + 'probe'); } catch (e) { LS.ok = false; }
  const pending = new Map(); let pendT = 0;
  function saveLater(k, v) { pending.set(k, v); clearTimeout(pendT); pendT = setTimeout(flushSaves, 250); }
  function flushSaves() { clearTimeout(pendT); pending.forEach((v, k) => LS.set(k, v)); pending.clear(); }

  // ---------- preferencias e idioma ----------
  const prefersReduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const P = Object.assign({ music: true, musicVol: 0.6, sfx: true, sfxVol: 0.8, vib: true, reduced: null, labHelp: true }, LS.get('prefs', {}));
  // idioma único del sitio (src/jet-idioma.js): ?lang > cookie jet_lang de .jetgames.fun / localStorage > navegador.
  // La preferencia propia vieja (prefs.lang) se migra una sola vez si todavía no hay elección común, y deja de usarse.
  const JI = window.JETIdioma || { get: () => 'es', set: () => {} };
  if (P.lang === 'es' || P.lang === 'en') {
    let comun = /(?:^|;\s*)jet_lang=(es|en)\b/.test(document.cookie);
    if (!comun) try { comun = /^(es|en)$/.test(localStorage.getItem('jet_lang') || ''); } catch (e) { /* nada */ }
    if (!comun) JI.set(P.lang);
  }
  if ('lang' in P) { delete P.lang; LS.set('prefs', P); }
  let LANG = JI.get() === 'en' ? 'en' : 'es';
  const reduced = () => (P.reduced == null ? prefersReduced : P.reduced);
  function t(k, vars) {
    let s = (window.T[LANG] && window.T[LANG][k] != null) ? window.T[LANG][k] : (window.T.es[k] != null ? window.T.es[k] : k);
    if (typeof s === 'string' && vars) s = s.replace(/\{([^}]+)\}/g, (m, n) => (vars[n] != null ? vars[n] : m));
    return s;
  }
  const tip = (k, vars) => t('tips')[k].replace(/\{([^}]+)\}/g, (m, n) => (vars[n] != null ? vars[n] : m));
  const fmtPct = (p, dec) => { const v = dec ? (Math.round(p * 10) / 10) : Math.round(p); return LANG === 'es' ? String(v).replace('.', ',') : String(v); };
  // Rendimiento = (victorias + 0,5 × empates) / rivales × 100 (core.evaluar). Un solo formato en resultado, análisis e historial:
  // una cifra decimal cuando no es entero, separador según idioma, sin el signo % dentro del valor.
  const fmtRend = (p) => fmtPct(p, 1);
  const plural = (n, one, many, key) => (n === 1 ? t(one) : t(many, { [key]: n }));
  const pctS = (p, dec) => fmtPct(p, dec) + (LANG === 'es' ? ' %' : '%');
  const pu = (v) => t(+v === 1 ? 'ptsOne' : 'ptsShort');
  const MONTHS = { es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'], en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] };
  const fmtDate = (f) => { const [y, m, d] = f.split('-').map(Number); return d + ' ' + MONTHS[LANG][m - 1]; };
  // nombres de planeta en el idioma activo (Cobalto/Cobalt, Dunas/Dunes, Eco/Echo); se leen por índice en cada repintado
  const PN = new Proxy(C.PLANETS, { get: (a, k) => { const loc = t('planets'); return (Array.isArray(loc) && typeof k === 'string' && /^\d+$/.test(k) && loc[k]) ? loc[k] : a[k]; } });

  // ---------- identidad anónima y fecha ----------
  let ANON = LS.get('id', null);
  if (!ANON || !/^[0-9a-f]{24}$/.test(ANON)) { const b = new Uint8Array(12); (window.crypto || window.msCrypto).getRandomValues(b); ANON = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join(''); LS.set('id', ANON); }
  let forcedDate = null, forceOffline = false;
  const today = () => forcedDate || C.localDate();

  // ---------- estado ----------
  const G = {
    day: today(), info: null, infoP: null, offline: false, badClock: false,
    base: 'home', overlays: [], sheet: null, bt: null, duel: null, quick: null, tut: null, mission: null, lab: null, paused: false
  };
  const B = { mode: null, n: 5, ids: [0, 1, 2, 3, 4], values: [3, 3, 3, 3, 3], ships: 100, x: [0, 0, 0, 0, 0], allow: false, scale: 100, rivals: null, sel: 0, undo: [], redo: [], lanes: [], shown: [0, 0, 0, 0, 0], fresh: [], intel: null, cfg: {} };

  // ---------- utilidades de interfaz ----------
  function vib(ms) { if (P.vib && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { /* nada */ } }
  function sfx(n, o) { A.sfx(n, o); }
  let toastT = 0;
  function toast(msg, btn, fn, ms) {
    const el = $('toast'); el.innerHTML = ''; el.classList.toggle('accion', !!btn); const s = document.createElement('span'); s.textContent = msg; el.appendChild(s);
    if (btn) { const b = document.createElement('button'); b.textContent = btn; b.onclick = () => { el.classList.remove('on'); fn(); }; el.appendChild(b); }
    el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), ms || 2600);
  }
  let bannerT = 0;
  function banner(msg, ok, ms) { const el = $('banner'); el.textContent = msg; el.classList.toggle('ok', !!ok); el.classList.add('on'); clearTimeout(bannerT); if (ms !== 0) bannerT = setTimeout(() => el.classList.remove('on'), ms || 4200); }
  function applyTexts() {
    document.documentElement.lang = LANG;
    document.title = t('docTitle');
    const md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute('content', t('metaDesc'));
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    document.querySelectorAll('[data-ta]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.ta)); el.title = t(el.dataset.ta); });
    document.querySelectorAll('[data-tl]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.tl)); });
    document.querySelectorAll('.lang-seg button').forEach((b) => { const on = b.dataset.l === LANG; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  }
  const val = (x) => (typeof x === 'function' ? x() : x); // textos que se recalculan al cambiar de idioma
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- pantallas ----------
  const OVERLAYS = ['sBrief', 'sResult', 'sAcad', 'sTrain', 'sHist', 'sHelp', 'sSet', 'sPause'];
  const SHEETS = ['shConfirm', 'shKeypad', 'shMsg'];
  const ACT = {};
  const FOCOS = 'button:not([disabled]):not([tabindex="-1"]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const visibleFoco = (n) => !!(n && n.isConnected && n !== document.body && n.offsetParent !== null && !n.closest('[inert]') && !n.closest('[hidden]'));
  function enfocar(n) { if (!n) return; if (!n.matches(FOCOS)) n.tabIndex = -1; try { n.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
  /* Sólo la capa superior (hoja > superposición > pantalla base) es operable; el resto queda inert. */
  function sincInert() {
    const top = topOv(), sheet = G.sheet;
    ['sHome', 'sBoard', 'back', 'topR', 'banner', 'toast'].forEach((id) => { const e = $(id); if (e) e.inert = !!top || !!sheet; });
    OVERLAYS.forEach((id) => { $(id).inert = (G.overlays.indexOf(id) >= 0 && id !== top) || !!sheet; });
    SHEETS.forEach((id) => { const s = $(id); if (!s.hidden) s.inert = id !== sheet; });
  }
  function setBase(b) {
    G.base = b;
    $('sHome').classList.toggle('on', b === 'home');
    $('sBoard').classList.toggle('on', b === 'board');
    R.boardMode = b === 'board';
    updateTop(); music();
    if (b === 'home') { renderHome(); LS.set('ui', null); }
    if (b === 'board') { relayout(); requestAnimationFrame(relayout); }
  }
  function openOv(id, opts) {
    opts = opts || {};
    if (G.overlays.indexOf(id) < 0) { G.overlays.push(id); ACT[id] = opts.activador || document.activeElement; }
    $(id).classList.add('on'); $(id).scrollTop = 0;
    updateTop(); music(); sincInert();
    // foco inicial: el título del diálogo (o el control indicado), con o sin pantalla táctil
    const f = (opts.foco && $(id).querySelector(opts.foco)) || $(id).querySelector('h2') || $(id).querySelector(FOCOS);
    if (f) setTimeout(() => { if (G.overlays.indexOf(id) >= 0) enfocar(f); }, 30);
  }
  function closeOv(id, opts) {
    opts = opts || {};
    id = id || G.overlays[G.overlays.length - 1]; if (!id) return;
    $(id).classList.remove('on'); $(id).inert = false; G.overlays = G.overlays.filter((x) => x !== id);
    if (id === 'sHelp') stopHelp();
    if (id === 'sPause') resumeGame();
    updateTop(); music(); sincInert();
    if (opts.sinFoco) return;
    const a = ACT[id]; delete ACT[id];
    if (visibleFoco(a)) { enfocar(a); return; }
    const top = topOv();
    if (top) { enfocar($(top).querySelector('h2') || $(top).querySelector(FOCOS)); return; }
    if (G.base === 'board' && B.lanes.length) { try { B.lanes[B.sel].el.focus({ preventScroll: true }); } catch (e) { /* nada */ } return; }
    enfocar($('hLogo'));
  }
  // Cerrar todo al cambiar de flujo: no equivale a reanudar, pero la nueva sesión no hereda la pausa de la anterior.
  function closeAllOv() { if (G.overlays.indexOf('sPause') >= 0) G.paused = false; G.overlays.slice().forEach((id) => { $(id).classList.remove('on'); $(id).inert = false; }); G.overlays = []; stopHelp(); updateTop(); sincInert(); }
  const topOv = () => G.overlays[G.overlays.length - 1];
  function updateTop() {
    const onBoard = G.base === 'board' && !G.overlays.length;
    $('bPause').hidden = !onBoard;
    $('bBrief').hidden = !(onBoard && (B.mode === 'daily'));
    $('bGear').hidden = topOv() === 'sSet';
  }
  // Hojas inferiores (RSP-FRENTES-01): cerradas = hidden + inert; abiertas, sólo sus controles son alcanzables.
  function openSheet(id, opts) {
    opts = opts || {};
    if (G.sheet && G.sheet !== id) { const o = $(G.sheet); clearTimeout(o._hideT); o.classList.remove('on'); o.inert = true; o.hidden = true; } else if (!G.sheet) G.sheetAct = document.activeElement;
    G.sheet = id; const s = $(id); clearTimeout(s._hideT);
    s.hidden = false; s.inert = false; void s.offsetWidth; // posición inicial un frame, luego la transición
    s.classList.add('on'); $('sheetBg').classList.add('on'); sincInert();
    const f = (opts.foco && s.querySelector(opts.foco)) || s.querySelector('.btn.pri') || s.querySelector('h3') || s.querySelector(FOCOS);
    if (f) setTimeout(() => { if (G.sheet === id) enfocar(f); }, 40);
  }
  function closeSheet(opts) {
    opts = opts || {};
    if (!G.sheet) return; const s = $(G.sheet); const id = G.sheet; G.sheet = null;
    s.inert = true; s.classList.remove('on'); $('sheetBg').classList.remove('on');
    const ocultar = () => { if (G.sheet !== id) s.hidden = true; };
    if (reduced()) ocultar(); else s._hideT = setTimeout(ocultar, 320);
    sincInert();
    const a = G.sheetAct; G.sheetAct = null;
    if (!opts.sinFoco && visibleFoco(a)) enfocar(a);
    if (id === 'shMsg' && G.msgClose) { const f = G.msgClose; G.msgClose = null; f(); }
  }
  function message(title, text, buttons, opts) {
    opts = opts || {};
    // título, texto, etiquetas y extra pueden ser funciones: así la hoja se repinta en el otro idioma sin cerrarse
    const paint = (again) => {
      $('msgT').textContent = val(title) || ''; $('msgP').textContent = val(text) || '';
      $('msgX').innerHTML = ''; const ex = typeof opts.extra === 'function' ? opts.extra(!!again) : opts.extra; if (ex) $('msgX').appendChild(ex);
      const bb = $('msgB'); bb.innerHTML = '';
      (buttons || [{ label: () => t('ok'), pri: true }]).forEach((b, i) => { const x = el('button', 'btn' + (b.pri ? ' pri' : '') + (b.cls ? ' ' + b.cls : '')); if (i === 0) x.id = 'msgB0'; x.textContent = val(b.label); x.onclick = () => { sfx('click'); G.msgClose = null; closeSheet(); if (b.fn) b.fn(); }; bb.appendChild(x); });
    };
    paint(false); G.msgPaint = paint;
    G.msgClose = opts.onClose || null; G.msgHop = opts.hop || 0;
    $('msgCmd').style.display = opts.noCmd ? 'none' : '';
    $('shMsg').setAttribute('role', opts.alert ? 'alertdialog' : 'dialog');
    openSheet('shMsg', { foco: opts.focoPrimero ? '#msgB0' : null });
  }
  A.onIdle = () => { G.resultPlaying = false; music(); };
  function music() {
    if (!A.ready) return;
    // en la pausa la música sigue, apagada y lejana; no cambia de pieza
    const pz = G.overlays.indexOf('sPause') >= 0; A.pause(pz);
    if (pz && A.song_) return;
    if (G.bt && !G.bt.done) return A.song('battle');
    if (G.resultPlaying) return;
    const ov = topOv();
    if (G.base === 'board' && !ov) { if (B.mode === 'acad' || B.mode === 'tut') A.song('acad'); else A.song('deploy'); return; }
    A.song(B.mode === 'acad' && G.base === 'board' ? 'acad' : 'menu');
  }

  // ---------- red ----------
  async function api(path, opts, ms) {
    if (forceOffline || (navigator.onLine === false && !TEST)) throw Object.assign(new Error('offline'), { offline: true });
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const to = setTimeout(() => ctl && ctl.abort(), ms || 6000);
    try {
      const r = await fetch(API + path, Object.assign({ cache: 'no-store', signal: ctl && ctl.signal }, opts || {}));
      let j = null; try { j = await r.json(); } catch (e) { j = null; }
      if (!r.ok) { const e = new Error((j && j.error) || ('http' + r.status)); e.status = r.status; e.body = j; throw e; }
      return j;
    } catch (e) { if (e.name === 'AbortError' || e instanceof TypeError) e.offline = true; throw e; } finally { clearTimeout(to); }
  }
  function localInfo(d) {
    const fl = C.flotaPracticaDia(d, 200);
    return { d, num: C.frontNum(d), valores: C.valores(d), valoresAyer: C.valores(C.addDays(d, -1)), intel: C.intel(fl), flota: { reales: 0, practica: 200 }, yaJugaste: null, defensaAyer: null, local: true };
  }
  function loadInfo(force) {
    const d = G.day;
    if (G.info && G.info.d === d && !force && !G.info.local) return Promise.resolve(G.info);
    if (G.infoP && !force) return G.infoP;
    G.infoP = api('?a=dia&d=' + d + '&id=' + ANON, null, 6000).then((j) => {
      G.offline = false; G.badClock = false;
      // valores locales y del servidor deben coincidir; si no, mandan los del servidor
      G.info = j;
      if (j.yaJugaste && !getRec(d)) { saveRecFromServer(j.yaJugaste); }
      if (j.defensaAyer) { const y = getRec(C.addDays(d, -1)); if (y) { y.def = j.defensaAyer; y.def.t = Date.now(); putRec(y); } }
      return j;
    }).catch((e) => {
      if (e.status === 409) { G.badClock = true; banner(t('badClock'), false, 6000); }
      else if (e.status === 429) banner(t('tooMany'));
      else G.offline = true;
      G.info = localInfo(d); return G.info;
    }).finally(() => { G.infoP = null; if (G.base === 'home') renderHome(); });
    return G.infoP;
  }
  async function flushQueue() {
    const q = LS.get('cola', null); if (!q) return;
    if (q.d !== today() && C.dayNum(today()) - C.dayNum(q.d) > 1) { LS.del('cola'); return; }
    try {
      const j = await api('?a=jugar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ d: q.d, id: ANON, x: q.x }) }, 8000);
      LS.del('cola'); saveRecFromServer(j); toast(t('gotReal'), null, null, 3500);
      if (topOv() === 'sResult' && G.resultRec && G.resultRec.d === q.d) showResult(getRec(q.d), { fresh: false });
      if (G.base === 'home') renderHome();
    } catch (e) { if (e.status === 400 || e.status === 409) LS.del('cola'); }
  }

  // ---------- registros de días ----------
  const getRec = (d) => LS.get('dia:' + d, null);
  function putRec(r) {
    LS.set('dia:' + r.d, r);
    let h = LS.get('historial', []); if (h.indexOf(r.d) < 0) { h.push(r.d); h.sort().reverse(); }
    if (h.length > 60) { h.slice(60).forEach((d) => LS.del('dia:' + d)); h = h.slice(0, 60); }
    LS.set('historial', h);
    // solo se conserva la flota comprimida de los dos últimos días (espacio)
    h.slice(2).forEach((d) => { const o = LS.get('dia:' + d, null); if (o && o.flota) { delete o.flota; LS.set('dia:' + d, o); } });
  }
  function saveRecFromServer(j) {
    const old = getRec(j.d) || {};
    const r = { d: j.d, num: j.num, x: j.jugada, valores: j.valores, res: j.resultado, mejor: j.mejor, flota: j.flota, offline: false, def: old.def || null, sh: old.sh || 0 };
    putRec(r); LS.del('borrador:' + j.d); return r;
  }
  function history() { return LS.get('historial', []).map(getRec).filter((r) => r && r.x); }
  function streakInfo() {
    const recs = history(); const set = new Set(recs.map((r) => r.d));
    let cur = 0, d = today(); if (!set.has(d)) d = C.addDays(d, -1);
    while (set.has(d)) { cur++; d = C.addDays(d, -1); }
    let best = 0, run = 0, prev = null;
    recs.map((r) => r.d).sort().forEach((x) => { run = prev && C.dayNum(x) - C.dayNum(prev) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = x; });
    return { cur, best: Math.max(best, cur) };
  }
  function medalOf(r) { return r && r.res ? C.medalla(r.res.pct, r.mejor ? r.mejor.pct : null) : 0; }
  // estrellas y fallos en 'academia'; el último despliegue de cada misión aparte, para que el guardado diferido no pise las estrellas
  function acadState() { const s = Object.assign({ stars: {}, fails: {} }, LS.get('academia', {})); s.last = LS.get('academia-ult', {}); return s; }
  function acadSave(s) { const o = { stars: s.stars, fails: s.fails }; LS.set('academia', o); }
  function acadStars() { const s = acadState().stars; let n = 0; for (const k in s) n += s[k]; return n; }
  function merits() {
    let m = 0;
    for (const r of history()) { const md = medalOf(r); m += md >= 4 ? C.medalla(r.res.pct, null) + 2 : md; if (r.def && r.def.pct != null && r.def.pct >= 50) m++; }
    return m + acadStars();
  }

  // ---------- inicio ----------
  function countdown() { const n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1); const s = Math.max(0, Math.floor((m - n) / 1000)); const p = (x) => String(x).padStart(2, '0'); return p(Math.floor(s / 3600)) + ':' + p(Math.floor(s / 60) % 60) + ':' + p(s % 60); }
  function renderHome() {
    const d = G.day, num = C.frontNum(d), rec = getRec(d), tut = LS.get('tutorial', {});
    $('hKick').textContent = (num >= 1 ? t('frontNum', { n: num }) + ' · ' : '') + fmtDate(d);
    let label;
    if (!tut.done && !rec) label = t('start'); else if (rec && rec.x) label = t('seeResult'); else label = t('play');
    if (num < 1) label = t('quick');
    $('bMainT').textContent = label;
    $('hCount').innerHTML = rec && rec.x ? esc(t('nextFront', { t: '' })) + '<b>' + countdown() + '</b>' : (num < 1 ? esc(t('firstFront', { t: '' })) + '<b>' + countdown() + '</b>' : '');
    // defensa de ayer
    const y = getRec(C.addDays(d, -1)); const dc = $('hDef');
    if (y && y.x) {
      dc.hidden = false;
      if (y.def && y.def.pct != null && y.def.M > 0) dc.innerHTML = '<span class="kick">' + esc(t('defenseKick')) + '</span>' + esc(t('defense', { p: '§', n: y.def.M })).replace('§', '<b>' + fmtPct(y.def.pct) + '</b>');
      else dc.innerHTML = '<span class="kick">' + esc(t('defenseKick')) + '</span>' + esc(t('defenseNone'));
    } else dc.hidden = true;
    // estado
    const st = streakInfo(), mer = merits(), rk = C.rango(mer); const yMed = y ? medalOf(y) : 0;
    const chips = [];
    if (rec && rec.res) chips.push('<span class="chip today">⚔️ ' + esc(t('todayChip', { p: pctS(rec.res.pct) })) + '</span>');
    chips.push('<span class="chip">🔥 ' + esc(st.cur === 1 ? t('streakDay') : t('streakDays', { n: st.cur })) + '</span>');
    chips.push('<span class="chip">★ ' + esc(t('ranks')[rk]) + '</span>');
    if (yMed && !(rec && rec.res)) chips.push('<span class="chip">' + ['', '🥉', '🥈', '🥇', '🎖️'][yMed] + ' ' + esc(t('medals')[yMed]) + '</span>');
    $('hStatus').innerHTML = chips.join('');
    $('hAcadStars').textContent = acadStars() + '/90 ★';
    buildHomeStage();
  }
  function buildHomeStage() {
    const st = $('hStage'); const info = G.info && G.info.d === G.day ? G.info : null; const v = info ? info.valores : C.valores(G.day);
    if (!st.children.length) for (let i = 0; i < 5; i++) { const s = el('div', 'hslot'); s.dataset.i = i; st.appendChild(s); const lb = el('div', 'hval'); lb.dataset.i = i; st.appendChild(lb); }
    st.querySelectorAll('.hval').forEach((lb) => { const i = +lb.dataset.i; lb.innerHTML = esc(PN[i]) + '<br><b>' + v[i] + '</b> ' + pu(v[i]); });
    layoutHome();
  }
  function layoutHome() {
    const st = $('hStage'); const w = st.clientWidth, h = st.clientHeight; if (!w) return;
    const v = (G.info && G.info.d === G.day ? G.info.valores : C.valores(G.day));
    const col = w / 5, base = Math.max(10, Math.min(col * 0.3, h * 0.2, 56));
    st.querySelectorAll('.hslot').forEach((s) => {
      const i = +s.dataset.i, k = i - 2, x = col * (i + 0.5), y = Math.min(h * 0.4 + k * k * Math.min(h * 0.05, 12), h - base * 1.35 - 46);
      const r = base * (0.75 + 0.08 * v[i]);
      s.style.left = x + 'px'; s.style.top = y + 'px'; s.dataset.r = r; s.dataset.rx = col / 2 - 2;
      const lb = st.querySelector('.hval[data-i="' + i + '"]'); lb.style.left = x + 'px'; lb.style.top = (y + base * 1.35 + 10) + 'px';
    });
  }

  // ---------- informe del día ----------
  function commanderTip(info) {
    const v = info.valores, va = info.valoresAyer, I = info.intel; const opts = [];
    let di = -1, dd = 0; for (let p = 0; p < 5; p++) { const dlt = va[p] - v[p]; if (dlt > dd || (dlt === dd && di >= 0 && I.media[p] > I.media[di])) { dd = dlt; di = p; } }
    if (di >= 0 && dd >= 2) opts.push(tip('drop', { pl: PN[di], m: fmtPct(I.media[di], 1), v: v[di] }));
    let ri = -1, rr = 0; for (let p = 0; p < 5; p++) { const dlt = v[p] - va[p]; if (dlt > rr) { rr = dlt; ri = p; } }
    if (ri >= 0 && rr >= 2) opts.push(tip('rise', { pl: PN[ri], a: va[ri], v: v[ri], m: fmtPct(I.media[ri], 1) }));
    let ei = 0; for (let p = 1; p < 5; p++) if (I.vacio[p] > I.vacio[ei]) ei = p;
    if (I.vacio[ei] >= 15) opts.push(tip('empty', { p: I.vacio[ei], pl: PN[ei] }));
    opts.push(tip('round', {})); opts.push(tip('eight', {}));
    const k = C.hash32(info.d + '|tip') % Math.min(opts.length, 3);
    return opts[k];
  }
  function compLine(fl) {
    if (!fl) return '';
    if (fl.reales >= 200 || (fl.reales && !fl.practica)) return esc(t('fleetReal', { n: '§' })).replace('§', '<b>' + fl.reales + '</b>');
    if (fl.reales > 0) return esc(t(fl.reales === 1 ? 'fleetMixed1' : 'fleetMixed', { r: '§', p: '¤' })).replace('§', '<b>' + fl.reales + '</b>').replace('¤', '<b>' + fl.practica + '</b>');
    return esc(t('fleetPractice'));
  }
  function renderBrief(info, fromBoard) {
    $('brT').textContent = t('frontNum', { n: info.num }).replace('FRENTE', 'Frente').replace('FRONT', 'Front');
    const g = $('brGrid'); g.innerHTML = '';
    for (let p = 0; p < 5; p++) {
      const d = info.valores[p] - info.valoresAyer[p];
      const arrow = d > 0 ? '<span class="up">▲ +' + d + '</span>' : d < 0 ? '<span class="dn">▼ ' + d + '</span>' : '<span>=</span>';
      const c = el('div', 'brc');
      c.innerHTML = '<canvas></canvas><div class="nm">' + esc(PN[p]) + '</div><div class="now">' + info.valores[p] + '<small>' + pu(info.valores[p]) + '</small></div>' +
        '<div class="was"><s>' + info.valoresAyer[p] + '</s> ' + arrow + '</div>' +
        '<div class="bar"><i style="width:' + Math.min(100, info.intel.media[p] / 60 * 100) + '%"></i></div>' +
        '<div class="st"><em>' + esc(t('avg')) + '</em>' + fmtPct(info.intel.media[p], 1) + '</div><div class="st"><em>' + esc(t('emptyShort')) + '</em>' + info.intel.vacio[p] + (LANG === 'es' ? ' %' : '%') + '</div>';
      g.appendChild(c); R.planetIcon(c.querySelector('canvas'), p, c.querySelector('canvas').clientWidth || 40);
    }
    $('brComp').innerHTML = compLine(info.flota) + (G.offline ? '<br>' + esc(t('offline')) : '') + '<br><span class="ley"><i class="sw bar"></i>' + esc(t('avgLegend')) + ' · ' + esc(t('emptyLegend')) + ' (%)</span>';
    $('brTipT').textContent = commanderTip(info);
    $('bToDeploy').querySelector('span').textContent = fromBoard ? t('continue') : t('toDeploy');
    G.briefFromBoard = !!fromBoard;
  }
  async function openBrief(fromBoard) {
    let info = G.info && G.info.d === G.day ? G.info : null;
    if (!info) { $('brGrid').innerHTML = '<div class="loading" style="grid-column:1/6"><div class="spin"></div></div>'; $('brTipT').textContent = ''; $('brComp').textContent = t('loading'); openOv('sBrief'); info = await loadInfo(); }
    if (G.offline) banner(t('offline'), false, 4500);
    renderBrief(info, fromBoard);
    if (topOv() !== 'sBrief') openOv('sBrief');
  }

  // ---------- tablero ----------
  function laneHTML() {
    return '<div class="lres"></div><div class="lplanet"></div><div class="lname"></div><div class="lval"></div><div class="lriv"></div>' +
      '<div class="lcol"><div class="lfill"></div><div class="lmark"></div><button class="lrest" type="button"></button></div><button class="lnum" type="button">0</button>' +
      '<div class="lpm"><button class="lm" type="button" aria-label="−1"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg></button><button class="lp" type="button" aria-label="+1"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg></button></div><div class="lmarg"></div>';
  }
  function boardSetup(cfg) {
    B.cfg = cfg; B.mode = cfg.mode; B.n = cfg.values.length; B.ids = cfg.ids || [0, 1, 2, 3, 4].slice(0, B.n);
    B.values = cfg.values.slice(); B.ships = cfg.ships; B.allow = !!cfg.allowReserve; B.scale = cfg.scale || cfg.ships;
    B.x = (cfg.x && cfg.x.length === B.n ? cfg.x.slice() : new Array(B.n).fill(0));
    if (B.x.reduce((a, b) => a + b, 0) > B.ships) B.x = new Array(B.n).fill(0);
    B.rivals = cfg.rivals || null; B.hideRivals = !!cfg.hideRivals; B.intel = cfg.intel || null; B.sel = Math.min(B.sel, B.n - 1); B.undo = []; B.redo = [];
    B.shown = B.x.slice(); B.fresh = new Array(B.n).fill(null); B.locked = false;
    const L = $('lanes'); L.innerHTML = ''; B.lanes = [];
    for (let i = 0; i < B.n; i++) {
      const ln = el('div', 'lane', laneHTML()); ln.dataset.p = i; ln.tabIndex = 0; ln.setAttribute('role', 'slider'); ln.setAttribute('aria-valuemin', '0');
      L.appendChild(ln);
      const q = (s) => ln.querySelector(s);
      const o = { el: ln, res: q('.lres'), planet: q('.lplanet'), name: q('.lname'), val: q('.lval'), riv: q('.lriv'), col: q('.lcol'), fill: q('.lfill'), mark: q('.lmark'), num: q('.lnum'), minus: q('.lm'), plus: q('.lp'), marg: q('.lmarg'), rest: q('.lrest') };
      o.name.textContent = PN[B.ids[i]];
      B.lanes.push(o); bindLane(i, o);
    }
    $('sBoard').classList.remove('battle', 'locked', 'm-daily', 'm-lab', 'm-quick', 'm-duel', 'm-acad', 'm-tut'); $('sBoard').classList.add('m-' + cfg.mode);
    $('bTitle').textContent = val(cfg.title) || '';
    $('toolsX').innerHTML = ''; (cfg.tools || []).forEach((b) => $('toolsX').appendChild(b));
    $('bClear').hidden = !!cfg.noClear; $('bUndo').hidden = $('bRedo').hidden = !!cfg.noUndo;
    $('resv').hidden = !!cfg.noReserve;
    G.paused = false; // una partida nueva nunca hereda la pausa de la anterior (PLAY-FRENTES-01)
    renderBanner(); renderSideBrief(); relayout(); updateBoard(true);
    if ((cfg.mode === 'daily' || cfg.mode === 'quick') && !B.x.some((v) => v) && !LS.get('hintDrag', 0)) { LS.set('hintDrag', 1); setTimeout(() => { if (G.base === 'board' && !G.overlays.length) toast(t('dragHelp'), null, null, 5000); }, 700); }
  }
  function reserve() { let s = 0; for (const v of B.x) s += v; return B.ships - s; }
  const maxFor = (p) => B.x[p] + reserve();
  function snapshot() { B.undo.push(B.x.slice()); if (B.undo.length > 50) B.undo.shift(); B.redo = []; }
  let lastSnd = 0;
  function setVal(p, v, o) {
    o = o || {}; if (B.locked) return false;
    const mx = maxFor(p); let hitMax = false;
    if (v > mx) { v = mx; hitMax = true; }
    v = Math.max(0, Math.round(v));
    const old = B.x[p];
    if (v === old) { if (hitMax) bump(); return false; }
    if (o.snap) snapshot();
    const resBefore = reserve();
    B.x[p] = v;
    if (v > old) { B.fresh[p] = { t: R.t, n: Math.min(8, v - old) }; }
    const now = performance.now();
    if (now - lastSnd > 28 && !o.silent) {
      lastSnd = now; sfx(v > old ? 'plus' : 'minus', { n: v });
      if (Math.floor(v / 10) !== Math.floor(old / 10)) vib(8);
    }
    if (hitMax) bump();
    const lane = B.lanes[p]; lane.num.classList.remove('pop'); void lane.num.offsetWidth; lane.num.classList.add('pop'); setTimeout(() => lane.num.classList.remove('pop'), 90);
    if (resBefore > 0 && reserve() === 0 && !B.allow) { sfx('full'); vib(12); }
    updateBoard(); return true;
  }
  function bump() { const now = performance.now(); if (now - (bump.t || 0) < 300) return; bump.t = now; sfx('max'); const r = $('resv'); r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash');
    // qué pasa al sumar sin reserva: la política vigente no quita naves de otro planeta por sí sola
    if (reserve() === 0 && !B.allow && now - (bump.msgT || 0) > 4000) { bump.msgT = now; toast(t('noReserve'), null, null, 3000); } }
  function selectLane(p, quiet) {
    if (p < 0 || p >= B.n) return; B.sel = p;
    B.lanes.forEach((o, i) => o.el.classList.toggle('sel', i === p));
    if (!quiet) { try { B.lanes[p].el.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
  }
  function updateBoard(first) {
    const res = reserve(), scale = B.scale;
    for (let i = 0; i < B.n; i++) {
      const o = B.lanes[i], v = B.x[i];
      o.fill.style.height = Math.min(100, v / scale * 100) + '%';
      o.fill.style.setProperty('--seg', ((scale <= 30 ? 1 : 10) / scale * 100) + '%');
      o.num.textContent = v;
      const pv = B.values[i];
      let vh = pv + ' ' + pu(pv);
      if (B.mode === 'daily' && G.info && G.info.valoresAyer) { const d = pv - G.info.valoresAyer[i]; if (d) vh += ' <span class="' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '▲' : '▼') + '</span>'; }
      if (o._vh !== vh) { o.val.innerHTML = vh; o._vh = vh; }
      o.el.setAttribute('aria-valuemax', String(maxFor(i))); o.el.setAttribute('aria-valuenow', String(v));
      const pl = PN[B.ids[i]];
      o.el.setAttribute('aria-label', t('a11yLane', { pl, v: pv, vu: t(+pv === 1 ? 'unitPt' : 'unitPts'), n: v, nu: t(+v === 1 ? 'unitShip' : 'unitShips') }) + ' · ' + (res === 1 ? t('reserve1') : t('reserveN', { n: res })));
      o.val.title = pv === 1 ? t('value1') : t('valuePts', { puntos: pv });
      o.num.setAttribute('aria-label', t('shipsOn', { planeta: pl }) + ': ' + v); o.plus.setAttribute('aria-label', t('addShip', { planeta: pl })); o.minus.setAttribute('aria-label', t('removeShip', { planeta: pl }));
      o.rest.textContent = $('lanes').classList.contains('narrow') ? '+' + res : t('restHere'); o.rest.setAttribute('aria-label', t('reserveTo', { planeta: pl })); o.rest.classList.toggle('can', res > 0 && !B.locked && !B.cfg.noRest);
      o.minus.disabled = v <= 0; o.plus.disabled = res <= 0;
      // marca de la media de ayer
      if (B.intel && B.intel.media) { o.mark.classList.add('on'); o.mark.style.bottom = Math.min(100, B.intel.media[i] / scale * 100) + '%'; } else o.mark.classList.remove('on');
      // rivales visibles (academia, tutorial)
      if (B.rivals) {
        if (first || o.riv.children.length !== B.rivals.length) { o.riv.innerHTML = ''; B.rivals.forEach(() => o.riv.appendChild(el('span', 'rchip'))); }
        B.rivals.forEach((r, k) => { const c = o.riv.children[k]; if (B.hideRivals) { c.className = 'rchip hid'; c.textContent = '?'; return; } const tight = B.rivals.length >= 3 && $('lanes').classList.contains('narrow');
          c.textContent = (B.rivals.length > 1 && !tight ? 'R' + (k + 1) + ' ' : '') + r[i]; c.title = t('rival', { n: k + 1 }) + ': ' + r[i]; c.className = 'rchip' + (v > r[i] ? ' beat' : v === r[i] ? ' tie' : ''); });
      } else if (o.riv.children.length) o.riv.innerHTML = '';
    }
    $('resvN').textContent = res;
    $('resvFill').style.width = (res / B.ships * 100) + '%';
    $('resv').classList.toggle('zero', res === 0);
    $('resv').setAttribute('aria-label', res === 1 ? t('reserve1') : t('reserveN', { n: res }));
    { const used = B.ships - res; $('resvTot').textContent = used === 1 ? t('assigned1') : t('assignedN', { n: used }); }
    selectLane(B.sel, true);
    $('bUndo').disabled = !B.undo.length; $('bRedo').disabled = !B.redo.length; $('bClear').disabled = res === B.ships;
    updateLaunch();
    if (B.cfg.onChange) B.cfg.onChange();
    if (!B.allow && (B.mode === 'daily' || B.mode === 'quick' || B.mode === 'duel')) A.setLayer(res === 0 ? 4 : res <= 33 ? 3 : res <= 66 ? 2 : 1);
    else if (B.mode === 'lab') A.setLayer(3);
    if (B.mode === 'daily') saveLater('borrador:' + G.day, B.x.slice());
    if (B.mode === 'acad' && G.mission) { const u = LS.get('academia-ult', {}); u[G.mission.id] = B.x.slice(); saveLater('academia-ult', u); }
  }
  function updateLaunch() {
    const b = $('bLaunch'), res = reserve(), lab = B.cfg.launch;
    if (G.bt && !G.bt.done) { b.hidden = false; b.classList.remove('ready'); $('bLaunchT').textContent = t('tapFaster'); return; }
    if (!lab) { b.hidden = true; return; } b.hidden = false;
    const ready = lab.ready ? lab.ready() : res === 0;
    b.classList.toggle('ready', ready);
    $('bLaunchT').textContent = ready || !lab.missing ? val(lab.label) : (res === 1 ? t('missing1') : t('missing', { n: res }));
  }
  function relayout() {
    R.resize();
    if (G.base === 'home') layoutHome();
    if (!B.lanes.length) return;
    // en horizontal la banda (comandante, objetivos) va en el panel lateral para no quitar alto a las columnas
    const side = window.innerWidth > window.innerHeight && window.innerWidth >= 640, bb = $('bBanner');
    if (side && bb.parentElement !== $('bSide')) $('bSide').insertBefore(bb, $('bSide').firstChild);
    else if (!side && bb.parentElement !== $('sBoard')) $('sBoard').insertBefore(bb, $('sBoard').querySelector('.bmain'));
    const L = $('lanes'); const w = L.clientWidth / B.n, h = L.clientHeight;
    L.classList.toggle('narrow', w < 100);
    L.classList.toggle('short', h < 430);
    let base = Math.max(12, Math.min(w * 0.27, h * 0.075, 58));
    const setPh = () => { const ph = Math.round(base * (0.75 + 0.08 * 7) * 2 + 10); B.lanes.forEach((o) => { o.planet.style.height = ph + 'px'; }); };
    setPh();
    // si el contenido no entra en el alto disponible, se achican los planetas (nunca los botones)
    if (B.rivals) updateBoard();
    for (let k = 0; k < 4; k++) { const over = L.scrollHeight - L.clientHeight; if (over <= 1 || base <= 10) break; base = Math.max(10, base - over / 2.62 - 1); setPh(); }
    B.base = base;
  }
  // gestos en un carril
  function bindLane(i, o) {
    // arrastre vertical en la columna o el planeta
    const startDrag = (e) => {
      if (B.locked || e.button > 0) return;
      e.preventDefault(); selectLane(i, true); unlockAudio();
      // la barra sigue al dedo: píxeles por nave según el alto real de la columna (10 naves en el tutorial, 100 en el frente)
      const pps = (o.col.clientHeight || 400) / Math.max(1, B.scale || B.ships || 100), slow = Math.max(2.5, Math.min(60, pps * 1.13));
      const st = { id: e.pointerId, y: e.clientY, ly: e.clientY, lt: performance.now(), acc: 0, v0: B.x[i], snap: false, slow, fast: slow * 0.43 };
      try { o.el.setPointerCapture(e.pointerId); } catch (er) { /* nada */ }
      const mv = (ev) => {
        if (ev.pointerId !== st.id) return;
        const now = performance.now(), dy = st.ly - ev.clientY, dt = Math.max(1, now - st.lt), sp = Math.abs(dy) / dt * 1000;
        st.acc += dy / (sp > 600 ? st.fast : st.slow); st.ly = ev.clientY; st.lt = now;
        const target = Math.round(st.v0 + st.acc);
        if (target !== B.x[i]) { if (!st.snap) { snapshot(); st.snap = true; } setVal(i, target); if (B.x[i] !== target) { st.v0 = B.x[i]; st.acc = 0; } }
      };
      const up = (ev) => { if (ev.pointerId !== st.id) return; o.el.removeEventListener('pointermove', mv); o.el.removeEventListener('pointerup', up); o.el.removeEventListener('pointercancel', up); };
      o.el.addEventListener('pointermove', mv); o.el.addEventListener('pointerup', up); o.el.addEventListener('pointercancel', up);
    };
    o.col.addEventListener('pointerdown', startDrag);
    o.planet.addEventListener('pointerdown', startDrag);
    // botones ± con repetición
    const hold = (btn, d) => {
      let tm = 0, t0 = 0, active = false;
      const step = (first) => { const ok = setVal(i, B.x[i] + d, { snap: first }); return ok; };
      const loop = () => { if (!active) return; step(false); const el2 = performance.now() - t0; tm = setTimeout(loop, el2 > 800 ? 50 : 166); };
      btn.addEventListener('pointerdown', (e) => {
        if (B.locked || e.button > 0) return; e.preventDefault(); unlockAudio(); selectLane(i, true);
        active = true; t0 = performance.now(); btn.classList.add('hold'); step(true); tm = setTimeout(loop, 380);
        try { btn.setPointerCapture(e.pointerId); } catch (er) { /* nada */ }
      });
      const stop = () => { active = false; clearTimeout(tm); btn.classList.remove('hold'); };
      btn.addEventListener('pointerup', stop); btn.addEventListener('pointercancel', stop); btn.addEventListener('lostpointercapture', stop);
      btn.addEventListener('click', (e) => { if (e.detail === 0) step(true); }); // teclado
    };
    hold(o.plus, 1); hold(o.minus, -1);
    o.rest.addEventListener('pointerdown', (e) => e.stopPropagation());
    o.rest.addEventListener('click', () => { if (reserve() > 0) { setVal(i, B.x[i] + reserve(), { snap: true }); } });
    // número: toque = seleccionar, doble toque = teclado numérico, arrastrar = transferir
    let lastTap = 0;
    o.num.addEventListener('pointerdown', (e) => {
      if (B.locked || e.button > 0) return; e.preventDefault(); unlockAudio(); selectLane(i, true);
      const st = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, pill: null, target: -1, tm: 0, rate: 60, snap: false };
      try { o.num.setPointerCapture(e.pointerId); } catch (er) { /* nada */ }
      const tick = () => {
        if (st.target < 0 || B.x[i] <= 0) { st.tm = 0; return; }
        if (!st.snap) { snapshot(); st.snap = true; }
        B.x[i]--; B.x[st.target]++; B.fresh[st.target] = { t: R.t, n: 1 };
        sfx('transfer', { from: 52 + i * 3, to: 52 + st.target * 3 }); if (B.x[st.target] % 10 === 0) vib(8);
        updateBoard(); st.pill.textContent = B.x[i];
        st.rate = Math.max(15, st.rate * 0.88); st.tm = setTimeout(tick, st.rate);
      };
      const mv = (ev) => {
        if (ev.pointerId !== st.id) return;
        if (!st.moved && Math.hypot(ev.clientX - st.x, ev.clientY - st.y) > 9) {
          st.moved = true; st.pill = el('div', 'dragpill'); st.pill.textContent = B.x[i]; document.body.appendChild(st.pill); o.num.classList.add('drag');
        }
        if (!st.moved) return;
        st.pill.style.left = ev.clientX + 'px'; st.pill.style.top = ev.clientY + 'px';
        const under = document.elementFromPoint(ev.clientX, ev.clientY); const ln = under && under.closest ? under.closest('.lane') : null;
        const q = ln ? +ln.dataset.p : -1;
        if (q !== st.target) {
          B.lanes.forEach((x) => x.el.classList.remove('droptarget'));
          st.target = q === i ? -1 : q; clearTimeout(st.tm); st.tm = 0; st.rate = 60;
          if (st.target >= 0) { B.lanes[st.target].el.classList.add('droptarget'); st.tm = setTimeout(tick, 60); }
        }
      };
      const up = (ev) => {
        if (ev.pointerId !== st.id) return;
        o.num.removeEventListener('pointermove', mv); o.num.removeEventListener('pointerup', up); o.num.removeEventListener('pointercancel', up);
        clearTimeout(st.tm); B.lanes.forEach((x) => x.el.classList.remove('droptarget')); o.num.classList.remove('drag');
        if (st.pill) st.pill.remove();
        if (!st.moved && ev.type === 'pointerup') { const now = performance.now(); if (now - lastTap < 320) { lastTap = 0; openKeypad(i); } else lastTap = now; }
      };
      o.num.addEventListener('pointermove', mv); o.num.addEventListener('pointerup', up); o.num.addEventListener('pointercancel', up);
    });
    o.num.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); openKeypad(i); } });
    o.el.addEventListener('wheel', (e) => { if (B.locked || G.overlays.length) return; e.preventDefault(); const d = (e.deltaY < 0 ? 1 : -1) * (e.shiftKey ? 10 : 1); selectLane(i, true); setVal(i, B.x[i] + d, { snap: true }); }, { passive: false });
    o.el.addEventListener('focus', () => selectLane(i, true));
    o.el.addEventListener('mouseenter', () => { if (B.mode === 'daily' && B.intel && !G.bt) { o.res.innerHTML = '<span>' + esc(t('avg')) + ' ' + fmtPct(B.intel.media[i]) + ' · ' + esc(t('emptyShort')) + ' ' + pctS(B.intel.vacio[i]) + '</span>'; } });
    o.el.addEventListener('mouseleave', () => { if (B.mode === 'daily' && !G.bt) o.res.innerHTML = ''; });
  }
  function undo() { if (!B.undo.length || B.locked) return; B.redo.push(B.x.slice()); B.x = B.undo.pop(); sfx('back'); updateBoard(); }
  function redo() { if (!B.redo.length || B.locked) return; B.undo.push(B.x.slice()); B.x = B.redo.pop(); sfx('click'); updateBoard(); }
  function clearBoard() {
    if (B.locked || reserve() === B.ships) return; snapshot(); B.x = new Array(B.n).fill(0); sfx('whoosh'); updateBoard();
    toast(t('cleared'), t('undoShort'), undo, 4000);
  }
  // teclado numérico propio
  let kp = null;
  function openKeypad(p) {
    if (B.locked) return; kp = { p, s: '', max: maxFor(p) };
    $('kpT').textContent = t('keypadT', { pl: PN[B.ids[p]] }); $('kpMax').textContent = t('keypadMax', { n: kp.max });
    $('kpVal').textContent = B.x[p]; openSheet('shKeypad'); sfx('click');
  }
  function kpKey(k) {
    if (!kp) return;
    if (k === '⌫') kp.s = kp.s.slice(0, -1); else if (k === 'C') kp.s = ''; else if (kp.s.length < 3) kp.s = (kp.s + k).replace(/^0+(\d)/, '$1');
    let v = kp.s === '' ? 0 : +kp.s; if (v > kp.max) { v = kp.max; kp.s = String(v); bump(); }
    $('kpVal').textContent = kp.s === '' ? '0' : kp.s; sfx('click');
  }
  function kpOk() { if (!kp) return; const v = kp.s === '' ? B.x[kp.p] : +kp.s; const p = kp.p; kp = null; closeSheet(); setVal(p, v, { snap: true }); selectLane(p); }
  (function buildKeys() { const k = $('kpKeys'); ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].forEach((x) => { const b = el('button'); b.type = 'button'; b.textContent = x; b.onclick = () => kpKey(x); k.appendChild(b); }); })();

  // panel de banda superior y resumen lateral
  function renderBanner() { const bb = $('bBanner'); bb.innerHTML = ''; if (B.cfg.banner) B.cfg.banner(bb); }
  function renderSideBrief() {
    const sb = $('sbrief'); sb.innerHTML = '';
    if (B.mode !== 'daily' && B.mode !== 'quick') return;
    const info = B.mode === 'daily' ? G.info : G.quick && G.quick.info; if (!info) return;
    sb.appendChild(el('div', 'sb-t', esc(B.mode === 'daily' ? t('briefKick') : t('roundCode', { c: 'R-' + G.quick.code }))));
    sb.appendChild(el('div', 'sb-row sb-h', '<span></span><span></span><span>' + esc(t('avg')) + '</span><span>' + esc(t('emptyShort')) + '</span>'));
    for (let p = 0; p < 5; p++) {
      const r = el('div', 'sb-row'); const d = info.valores[p] - info.valoresAyer[p];
      r.innerHTML = '<canvas></canvas><span>' + esc(PN[p]) + ' <b>' + info.valores[p] + '</b> <span class="d">' + (B.mode === 'daily' ? '(' + info.valoresAyer[p] + (d > 0 ? ' ▲' : d < 0 ? ' ▼' : '') + ')' : '') + '</span></span><span class="d n">' + fmtPct(info.intel.media[p], 1) + '</span><span class="d n">' + pctS(info.intel.vacio[p]) + '</span>';
      sb.appendChild(r); R.planetIcon(r.querySelector('canvas'), p, 22);
    }
    sb.appendChild(el('div', 'sb-ley', '<span><i class="sw dash"></i>' + esc(t('avgLegend')) + '</span><span>' + esc(t('emptyLegend')) + ' (%)</span>'));
    sb.appendChild(el('div', 'sb-comp', B.mode === 'daily' ? compLine(info.flota) : esc(t('comparedPractice', { rivales: 200 }))));
    // el consejo del Comandante también en el panel lateral (escritorio y tablet): llena el hueco y orienta sin abrir el informe
    if (B.mode === 'daily' && info.valoresAyer && info.intel) sb.appendChild(el('div', 'sb-tip', '<div class="kick">' + esc(t('tipTitle')) + '</div><p>' + esc(commanderTip(info)) + '</p>'));
  }

  // ---------- vista para el lienzo ----------
  function slotFromEl(e, r) { const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, r }; }
  R.view = function () {
    if (DEMO && G.demoView) return G.demoView();
    const tt = R.t;
    if (G.base === 'home' && !G.overlays.length) {
      const st = $('hStage'); const v = (G.info && G.info.d === G.day) ? G.info : null; const slots = [];
      st.querySelectorAll('.hslot').forEach((s) => { const i = +s.dataset.i; const sl = slotFromEl(s, +s.dataset.r || 20); sl.idx = i; sl.maxRx = +s.dataset.rx || 30; sl.shown = v ? Math.min(60, Math.round(v.intel.media[i])) : 12; sl.col = '#ff6f8f'; slots.push(sl); });
      return { slots };
    }
    if (G.base === 'board') {
      const slots = []; const base = B.base || 24; const resv = $('resv').getBoundingClientRect(); const from = { x: resv.left + 40, y: resv.top + 10 };
      for (let i = 0; i < B.n; i++) {
        const o = B.lanes[i]; if (!o) continue;
        const r = base * (0.75 + 0.08 * B.values[i]);
        const sl = slotFromEl(o.planet, r); sl.idx = B.ids[i]; sl.sel = i === B.sel && !G.bt; sl.maxRx = o.el.clientWidth / 2 - 3;
        // naves mostradas: alcanzan al valor real con suavidad
        const tgt = B.x[i] * (B.ships >= 100 ? 1 : Math.min(4, 100 / B.ships) * 0.5); B.shown[i] += (tgt - B.shown[i]) * 0.35; if (Math.abs(tgt - B.shown[i]) < 0.5) B.shown[i] = tgt;
        sl.shown = B.shown[i]; sl.fresh = B.fresh[i] && (tt - B.fresh[i].t < 0.2) ? B.fresh[i] : null; sl.from = from;
        if (G.bt && G.bt.lanes[i] && G.bt.lanes[i].won != null) sl.won = G.bt.lanes[i].won;
        slots.push(sl);
      }
      let battle = null, zoom = 1;
      if (G.bt) {
        battle = G.bt.lanes.map((L, i) => { const c = B.lanes[i].col.getBoundingClientRect(); L.col = { x: c.left, y: c.top, w: c.width, h: c.height }; return L; });
        zoom = G.bt.zoom || 1;
      }
      return { slots, battle, zoom };
    }
    return null;
  };

  // ---------- modos de juego ----------
  function startDaily() {
    if (C.frontNum(G.day) < 1) return openTrain();
    const rec = getRec(G.day);
    if (rec && rec.x) return showResult(rec, { fresh: false });
    if (!LS.get('tutorial', {}).done) return startTutorial(1);
    openBrief(false);
  }
  function enterDailyBoard() {
    const info = G.info && G.info.d === G.day ? G.info : localInfo(G.day);
    const draft = LS.get('borrador:' + G.day, null);
    closeAllOv();
    boardSetup({
      mode: 'daily', values: info.valores, ships: 100, scale: 100, x: draft, intel: info.intel,
      title: () => t('frontNum', { n: info.num }) + ' · ' + fmtDate(G.day),
      launch: { label: () => t('launch'), missing: true },
      banner: G.offline ? (bb) => { bb.appendChild(el('div', 'bb-lab', '<span>' + esc(t('offline')) + '</span>')); } : null
    });
    setBase('board'); LS.set('ui', { s: 'daily', d: G.day });
    if (!B.x.some((v) => v)) setTimeout(() => { $('sBoard').classList.add('breathe'); setTimeout(() => $('sBoard').classList.remove('breathe'), 2600); }, 300);
  }
  function onLaunch() {
    unlockAudio();
    if (G.bt && !G.bt.done) return speedUp();
    const cfg = B.cfg.launch; if (!cfg || B.locked) return;
    const ready = cfg.ready ? cfg.ready() : reserve() === 0;
    if (!ready) { sfx('warn'); bump(); const b = $('bLaunch'); b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge'); $('sBoard').classList.add('breathe'); setTimeout(() => $('sBoard').classList.remove('breathe'), 2500); return; }
    if (cfg.go) return cfg.go();
    if (B.mode === 'daily') {
      if (today() !== G.day) return newDaySheet();
      $('cfT').textContent = t('confirmT'); $('cfQ').textContent = t('confirmQ');
      const m = $('cfMini'); m.innerHTML = '';
      for (let p = 0; p < 5; p++) { const d = el('div', '', '<canvas></canvas><b>' + B.x[p] + '</b><small>' + B.values[p] + ' ' + pu(B.values[p]) + '</small>'); m.appendChild(d); R.planetIcon(d.querySelector('canvas'), p, 26); }
      $('bCfGo').disabled = false; openSheet('shConfirm'); sfx('click');
    }
  }
  async function confirmLaunch() {
    const b = $('bCfGo'); if (b.disabled) return; b.disabled = true; closeSheet();
    const d = G.day, x = B.x.slice(); flushSaves();
    // contador anónimo: si ayer se compartió el resultado, se avisa con esta jugada (sin datos personales)
    const yr = getRec(C.addDays(d, -1)); const sh = yr && yr.sh && !yr.shSent ? 1 : 0; if (sh) { yr.shSent = 1; putRec(yr); }
    sfx('launch'); vib(20);
    const p = api('?a=jugar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ d, id: ANON, x, sh }) }, 8000)
      .then((j) => { const r = saveRecFromServer(j); if (j.repetida) toast(t('already')); return r; })
      .catch((e) => {
        if (e.status === 409 && e.body && e.body.error === 'reloj') G.badClock = true;
        else if (e.status === 400) { /* jugada inválida: no debería pasar */ }
        else LS.set('cola', { d, x });
        if (e.status === 429) banner(t('tooMany')); else if (!G.badClock) banner(t('serverErr'), false, 5000); else banner(t('badClock'), false, 6000);
        const fl = C.flotaPracticaDia(d, 200), v = C.valores(d), ev = C.evaluar(x, fl, v), m = C.mejor(fl, v, { ms: 300, seed: d });
        const r = { d, num: C.frontNum(d), x, valores: v, res: { pct: ev.pct, ganados: ev.w, empates: ev.d, perdidos: ev.l, N: ev.N, reales: 0, practica: 200, planetas: ev.pl.map((q) => ({ gane: q.gane, empate: q.empate, perdi: q.perdi, p95: q.p95 })) }, mejor: { x: m.x, pct: m.pct }, flota: C.fleetToB64(fl), offline: true, def: null };
        putRec(r); LS.del('borrador:' + d); return r;
      });
    LS.set('ui', { s: 'result', d });
    runBattle({ wait: p, speed: 1, kind: 'fleet' }).then(() => showResult(getRec(d), { fresh: true }));
  }

  // ---------- batalla ----------
  function laneBattleData(rec, fleet) {
    return B.x.map((x, i) => { const h = C.histogram(fleet, i); let mx = 1; for (let s = 0; s <= 100; s++) mx = Math.max(mx, h[s]); return { hist: h, x, scale: 100, maxH: mx, arrive: 0, reveal: 0, pGane: rec.res.planetas[i].gane / rec.res.N * 100, res: null, won: null }; });
  }
  function runBattle(o) {
    return new Promise((resolve) => {
      B.locked = true; $('sBoard').classList.add('battle');
      const bt = G.bt = { phase: 'launch', t: 0, i: 0, speed: 1, lanes: B.x.map(() => ({ hist: null })), done: false, o, resolve, zoom: 1, waitT: 0 };
      if (o.kind === 'duel') { bt.lanes = B.x.map(() => ({ hist: null, won: null })); }
      updateTop(); music(); updateLaunch();
      B.lanes.forEach((L) => { L.res.innerHTML = ''; L.res.className = 'lres'; });
      // estelas desde la reserva hacia cada planeta
      const rs = $('resv').getBoundingClientRect();
      if (!reduced()) B.lanes.forEach((L, i) => { if (B.x[i]) { const b = L.planet.getBoundingClientRect(); R.trail({ x: rs.left + 30, y: rs.top + 10 }, { x: b.left + b.width / 2, y: b.top + b.height / 2 }); } });
      if (o.wait) o.wait.then((rec) => { bt.rec = rec; }).catch(() => { bt.rec = null; });
      else bt.rec = o.rec || true;
      flashScreen();
    });
  }
  function flashScreen() { const f = $('flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 60); }
  function battleStep(dt) {
    const bt = G.bt; if (!bt || bt.done || G.paused) return;
    const fast = reduced() ? 3.5 : 1;
    dt *= bt.speed * fast / ANIM;
    bt.t += dt;
    const o = bt.o, PH = { launch: o.kind === 'quick' ? 0.25 : 0.8, arrive: o.kind === 'quick' ? 0.25 : 0.8, reveal: o.kind === 'quick' ? 0.2 : 0.9 };
    bt.zoom = bt.phase === 'launch' && !reduced() ? 1 + 0.03 * Math.sin(Math.min(1, bt.t / PH.launch) * Math.PI) : 1;
    if (bt.phase === 'launch' && bt.t >= PH.launch) { bt.phase = 'contact'; bt.t = 0; }
    if (bt.phase === 'contact') {
      if (bt.rec) {
        if (o.kind === 'fleet' || o.kind === 'quick') {
          const rec = bt.rec; const fl = o.kind === 'quick' ? G.quick.fleet : (rec.flota ? C.fleetFromB64(rec.flota) : C.flotaPracticaDia(rec.d, 200));
          bt.lanes = laneBattleData(rec, fl); bt.recData = rec;
        }
        bt.phase = 'arrive'; bt.t = 0; $('bBanner').innerHTML = ''; if (B.cfg.banner) B.cfg.banner($('bBanner'));
      } else {
        bt.waitT += dt / (bt.speed * fast / ANIM);
        if (bt.waitT > 0.4 && !bt.showedWait) { bt.showedWait = true; $('bBanner').innerHTML = ''; $('bBanner').appendChild(el('div', 'bb-lab', '<span>' + esc(t('contacting')) + '</span><span class="spin"></span>')); }
        if (bt.waitT > 9) { bt.rec = null; bt.phase = 'done'; }
      }
    }
    if (bt.phase === 'arrive') {
      const k = Math.min(1, bt.t / PH.arrive); bt.lanes.forEach((L) => { L.arrive = 1 - Math.pow(1 - k, 3); });
      if (k >= 1) { bt.phase = 'reveal'; bt.t = 0; bt.i = 0; }
    }
    if (bt.phase === 'reveal') {
      const L = bt.lanes[bt.i], lane = B.lanes[bt.i];
      if (o.kind === 'duel') {
        if (!L.done) {
          L.done = true; const me = B.x[bt.i], ri = o.rival[bt.i];
          L.won = me > ri ? 1 : me < ri ? -1 : 0;
          lane.res.className = 'lres duel ' + (L.won > 0 ? 'w' : L.won < 0 ? 'l' : 't');
          lane.res.innerHTML = '<b>' + me + '</b><span>–</span><i>' + ri + '</i>';
          if (B.rivals) B.hideRivals = false;
          if (B.rivals) updateBoard();
          sfx(L.won > 0 ? 'win' : L.won < 0 ? 'lose' : 'tie'); sfx('reveal', { win: L.won > 0 }); vib(L.won ? 10 : 0);
          if (o.onReveal) o.onReveal(bt.i, L.won);
        }
      } else {
        L.reveal = Math.min(1, bt.t / (PH.reveal * 0.45));
        if (!L.done && L.reveal >= 1) {
          L.done = true; const pg = L.pGane; L.won = pg >= 60 ? 1 : pg < 30 ? -1 : 0;
          lane.res.className = 'lres ' + (pg >= 60 ? 'w' : pg < 30 ? 'l' : 't');
          lane.res.innerHTML = '<b>' + fmtPct(pg) + (LANG === 'es' ? ' %' : '%') + '</b>';
          sfx('reveal', { win: pg >= 50 }); sfx(pg >= 60 ? 'win' : pg < 30 ? 'lose' : 'tie');
        }
      }
      if (bt.t >= PH.reveal) { bt.t = 0; bt.i++; if (bt.i >= bt.lanes.length) { bt.phase = 'hold'; } }
    }
    if (bt.phase === 'hold' && bt.t >= (o.kind === 'quick' ? 0.2 : 0.7)) bt.phase = 'done';
    if (bt.phase === 'done') finishBattle();
  }
  function finishBattle() {
    const bt = G.bt; if (!bt || bt.done) return; bt.done = true;
    const res = bt.resolve; G.bt = null; B.locked = false;
    $('sBoard').classList.remove('battle'); updateTop(); updateLaunch(); setTimeout(music, 0); // si sigue un resultado, la batalla suena durante la cuenta
    res(bt);
  }
  function speedUp() { if (G.bt && !G.bt.done) { G.bt.speed = 3; } }

  // ---------- resultado ----------
  function ringSVG(frac, col, inner) {
    const r = 17, c = 2 * Math.PI * r;
    return '<svg viewBox="0 0 40 40"><circle class="ring-bg" cx="20" cy="20" r="' + r + '"/><circle class="ring-fg" cx="20" cy="20" r="' + r + '" stroke="' + col + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '" data-off="' + (c * (1 - Math.max(0, Math.min(1, frac)))).toFixed(1) + '"/>' + (inner || '') + '</svg>';
  }
  function showResult(rec, o) {
    if (!rec) return goHome();
    o = o || {}; G.resultRec = rec; G.resultMode = o.mode || 'daily';
    const quick = G.resultMode === 'quick';
    const pct = rec.res.pct, N = rec.res.N, best = rec.mejor;
    $('rsKick').textContent = quick ? t('quickPractice') + ' · ' + t('roundCode', { c: rec.code }) : t('frontNum', { n: rec.num }) + ' · ' + fmtDate(rec.d);
    $('rsCd').innerHTML = !quick && !o.fresh && rec.d === today() ? esc(t('nextFront', { t: countdown() })) : '';
    // rendimiento = (victorias + 0,5 × empates) / N × 100, con el mismo formato que el análisis
    const headTpl = quick ? t('headlineQuick', { p: '§' }) : t('headline', { p: '§' });
    $('rsHead').innerHTML = esc(headTpl).replace(/§\s?%?/, '<span class="n" id="rsNum">' + (o.fresh ? '0' : fmtRend(pct)) + '%</span>');
    $('rsWdl').textContent = [plural(rec.res.ganados, 'win1', 'wins', 'victorias'), plural(rec.res.empates, 'draw1', 'draws', 'empates'), plural(rec.res.perdidos, 'loss1', 'losses', 'derrotas')].join(' · ');
    $('rsRule').textContent = t('perfRule');
    let note = '';
    if (quick || rec.offline || !rec.res.reales) note = esc(N === 1 ? t('comparedPractice1') : t('comparedPractice', { rivales: N })) + (rec.offline ? '<br>' + esc(t('offlineRes')) : '');
    else { const fl = { reales: rec.res.reales, practica: rec.res.practica }; note = compLine(fl) + '<br>' + esc(t('comparedReal', { rivales: N })); }
    $('rsNote').innerHTML = note;
    // insignias
    const md = quick ? C.medalla(pct, null) : medalOf(rec), st = streakInfo(), mer = merits(), rk = C.rango(mer);
    const medalCol = ['#5b5275', '#d58b4a', '#cfd6e6', '#fdd835', '#00f2cf'][md];
    const nextR = C.RANKS[rk + 1];
    let bh = '<div class="badge">' + ringSVG(pct / 100, medalCol, '<g class="coin"><circle cx="20" cy="20" r="9" fill="' + medalCol + '" opacity=".9"/><text x="20" y="24" text-anchor="middle" font-size="11" font-weight="800" fill="#120a24" font-family="JetBrains Mono">' + ['–', 'B', 'P', 'O', '★'][md] + '</text></g>') + '<div><span class="kick">' + esc(t('medalKick')) + '</span><b>' + esc(t('medals')[md]) + '</b></div></div>';
    if (!quick) {
      bh += '<div class="badge">' + ringSVG(Math.min(1, st.cur / 7), '#ff8a3d', '<text x="20" y="25" text-anchor="middle" font-size="14">🔥</text>') + '<div><span class="kick">' + esc(t('streakKick')) + '</span><b>' + esc(st.cur === 1 ? t('streakDay') : t('streakDays', { n: st.cur })) + '</b></div></div>';
      bh += '<div class="badge">' + ringSVG(nextR ? (mer - C.RANKS[rk]) / (nextR - C.RANKS[rk]) : 1, '#7700f4', '<text x="20" y="25" text-anchor="middle" font-size="13" fill="#c9a2ff">★</text>') + '<div><span class="kick">' + esc(t('rankKick')) + '</span><b>' + esc(t('ranks')[rk]) + '</b></div></div>';
    } else {
      const q = LS.get('rapida', { best: 0, n: 0 });
      bh += '<div class="badge">' + ringSVG(q.best / 100, '#00f2cf', '') + '<div><span class="kick">' + esc(t('record', { p: fmtPct(q.best) })) + '</span><b>' + (rec.newRecord ? esc(t('newRecord')) : '#' + q.n) + '</b></div></div>';
    }
    // criterios de medalla: la regla vigente (Math.round del rendimiento; 50/75/90; Mando perfecto sólo con mejor reparto evaluado)
    bh += '<div class="badge info"><button type="button" class="btn sm" id="bMedalInfo" aria-expanded="false" aria-controls="rsMedalInfo"><span>' + esc(t('medalCriteria')) + '</span></button><p id="rsMedalInfo" hidden>' + esc(t('medalRounded')) + ' ' + esc(t('medalThresholds')) + (quick ? '' : ' ' + esc(t('perfectCommand'))) + '</p></div>';
    $('rsBadges').innerHTML = bh;
    $('bMedalInfo').onclick = () => { const p = $('rsMedalInfo'); p.hidden = !p.hidden; $('bMedalInfo').setAttribute('aria-expanded', !p.hidden); sfx('click'); };
    $('rsLey').innerHTML = '<span><i class="sw line"></i>' + esc(t('ownFleet')) + '</span><span><i class="sw bars"></i>' + esc(t('rivalDist')) + '</span>';
    // por planeta
    const fleet = rec.flota ? C.fleetFromB64(rec.flota) : (quick ? G.quick.fleet : null);
    const pl = $('rsPlanets'); pl.innerHTML = '';
    for (let p = 0; p < 5; p++) {
      const q = rec.res.planetas[p], pg = q.gane / N * 100;
      const mk = pg >= 60 ? '<span class="mk" style="color:var(--cyan)">✓</span>' : pg < 30 ? '<span class="mk" style="color:var(--pink)">✗</span>' : '<span class="mk">=</span>';
      const row = el('div', 'rp', '<canvas class="ic"></canvas><div><div class="nm">' + mk + esc(PN[p]) + ' <small>' + esc(rec.valores[p] === 1 ? t('value1') : t('valuePts', { puntos: rec.valores[p] })) + ' · ' + esc(rec.x[p] === 1 ? t('planetShip1', { planeta: t('ownFleet') }) : t('planetShips', { planeta: t('ownFleet'), naves: rec.x[p] })) + '</small></div>' +
        '<div class="ds">' + esc(t('planetBeat', { p: '§' })).replace('§', '<b>' + fmtPct(pg) + '</b>') + '</div><div class="hint">' + esc(t('p95', { n: q.p95 })) + '</div></div>' + (fleet ? '<canvas class="h"></canvas>' : ''));
      pl.appendChild(row);
      R.planetIcon(row.querySelector('canvas.ic'), p, 34);
      if (fleet) requestAnimationFrame(() => R.miniHist(row.querySelector('canvas.h'), C.histogram(fleet, p), rec.x[p], 100, { p95: q.p95 }));
    }
    // mejor jugada
    const bb = $('rsBest');
    if (best) {
      const diff = best.pct - pct;
      const txt = diff > 0.05 ? esc(t('best', { p: '§' })).replace('§', '<b>' + fmtRend(best.pct) + '</b>') : diff < -0.05 ? esc(t('bestBeaten')) : esc(t('bestSame'));
      const lista = best.x.map((n, i) => esc(n === 1 ? t('planetShip1', { planeta: PN[i] }) : t('planetShips', { planeta: PN[i], naves: n }))).join(' · ');
      bb.innerHTML = '<div><div class="kick">' + esc(t('bestKick')) + '</div><p>' + txt + '</p><div class="mini">' + lista + '</div></div><canvas></canvas>';
      const lb = el('button', 'btn'); lb.innerHTML = '<span>' + esc(t('tryLab')) + '</span>'; lb.onclick = () => { sfx('click'); openLab(rec, quick, true); }; bb.appendChild(lb);
      requestAnimationFrame(() => R.miniBars(bb.querySelector('canvas'), rec.x, best.x, Math.max(...rec.x, ...best.x)));
      bb.hidden = false;
    } else bb.hidden = true;
    $('rsDef').textContent = quick ? '' : (rec.d === today() ? t('defTomorrow', { n: rec.num + 1 }) : (rec.def && rec.def.M ? t('defense', { p: fmtPct(rec.def.pct), n: rec.def.M }).replace(/ (Hasta ahora|So far)\.$/, '') : ''));
    // botones
    const bt = $('rsBtns'); bt.innerHTML = '';
    const mk = (lab, cls, fn) => { const b = el('button', 'btn' + (cls ? ' ' + cls : '')); b.innerHTML = '<span>' + esc(lab) + '</span>'; b.onclick = () => { sfx('click'); fn(); }; bt.appendChild(b); return b; };
    // acciones primarias: analizar y jugar otra ronda; compartir queda como acción secundaria y deliberada
    if (quick) { mk(t('anotherRound'), 'pri', () => startQuick()); mk(t('analyze'), '', () => openLab(rec, true)); mk(t('share'), '', () => share(rec, true)); mk(t('home'), '', goHome); }
    else { mk(t('analyze'), 'pri', () => openLab(rec, false)); mk(t('share'), '', () => share(rec)); mk(t('train'), '', () => openTrain()); mk(t('home'), '', goHome); }
    if (o.repaint) { requestAnimationFrame(() => document.querySelectorAll('#rsBadges .ring-fg').forEach((c) => { c.style.strokeDashoffset = c.dataset.off; })); return; } // cambio de idioma: solo repinta, no toca pantallas ni animaciones
    if (o.fresh) G.resultPlaying = true; // la música de batalla sigue durante la cuenta y luego suena el cierre
    closeAllOv(); if (G.base !== 'home') setBase('home');
    openOv('sResult');
    if (!quick) LS.set('ui', { s: 'result', d: rec.d });
    // animaciones
    const hop = pct >= 50; G.cmdHop = hop ? 0.01 : 0;
    setTimeout(() => document.querySelectorAll('#rsBadges .ring-fg').forEach((c) => { c.style.strokeDashoffset = c.dataset.off; }), 60);
    if (o.fresh) {
      const numEl = $('rsNum'); const t0 = performance.now(), D = (reduced() ? 400 : 1600) * ANIM; let lastTick = -3;
      const roll = (now) => {
        const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3), v = pct * e;
        numEl.textContent = (k < 1 ? fmtPct(v) : fmtRend(pct)) + '%';
        if (v - lastTick >= 3) { lastTick = v; sfx('tick'); }
        if (k < 1) requestAnimationFrame(roll);
        else {
          sfx('boom'); A.result(pct >= 50);
          setTimeout(() => { if (md) sfx('medal', { lv: md }); }, 500);
          if (!quick && st.cur > 1) setTimeout(() => sfx('streak'), 1100);
          if (pct >= 90) R.starRain();
          vib(pct >= 50 ? [12, 60, 18] : 20);
        }
      };
      requestAnimationFrame(roll);
    }
  }
  function shareText(rec, quick) {
    const p = fmtRend(rec.res.pct), sq = rec.res.planetas.map((q) => { const g = q.gane / rec.res.N * 100; return g >= 60 ? '🟩' : g >= 30 ? '🟨' : '🟥'; }).join('');
    const md = quick ? C.medalla(rec.res.pct, null) : medalOf(rec); const me = ['', ' 🥉', ' 🥈', ' 🥇', ' 🎖️'][md];
    if (quick) return 'JET//Frentes ⚔️\n' + t('shareQuick', { c: rec.code, p }) + me + '\n' + sq + '\nhttps://jetgames.fun/frentes/';
    const st = streakInfo().cur;
    return 'JET//Frentes #' + rec.num + ' ⚔️\n' + t('shareText', { p }) + me + '\n' + sq + '\n🔥 ' + (st === 1 ? t('shareDay') : t('shareDays', { n: st })) + '\nhttps://jetgames.fun/frentes/';
  }
  async function share(rec, quick) {
    const txt = shareText(rec, quick);
    // rec.sh se marca sólo cuando compartir o copiar realmente ocurrió (no al intentarlo)
    const hecho = () => { if (!quick && !rec.sh) { rec.sh = 1; putRec(rec); } };
    const touch = matchMedia('(pointer:coarse)').matches;
    if (navigator.share && touch) { try { await navigator.share({ text: txt }); hecho(); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    let ok = false;
    try { await navigator.clipboard.writeText(txt); ok = true; } catch (e) { ok = false; }
    if (ok) { hecho(); sfx('copy'); toast(t('copied')); return; }
    // Sin portapapeles: texto íntegro, seleccionable y persistente hasta que el jugador cierre; sin reevaluar ni reenviar nada.
    const extra = () => { const ta = el('textarea', 'copiaMano'); ta.readOnly = true; ta.value = txt; ta.setAttribute('aria-label', t('share')); ta.rows = 5; return ta; };
    message(() => t('share'), () => t('copyFailed'), [
      { label: () => t('copyText'), pri: true, fn: null, keep: true },
      { label: () => t('close') }
    ], { extra, noCmd: true });
    const bCopiar = $('msgB0');
    if (bCopiar) bCopiar.onclick = async () => {
      const ta = $('msgX').querySelector('textarea'); if (!ta) return; ta.focus(); ta.select(); let ok2 = false;
      try { ok2 = document.execCommand('copy'); } catch (e) { ok2 = false; }
      if (!ok2) { try { await navigator.clipboard.writeText(txt); ok2 = true; } catch (e) { ok2 = false; } }
      if (ok2) { hecho(); sfx('copy'); toast(t('copied')); }
    };
    setTimeout(() => { const ta = $('msgX').querySelector('textarea'); if (ta) { ta.focus(); ta.select(); } }, 80);
  }

  // ---------- análisis ----------
  function openLab(rec, quick, loadBest) {
    const fleet = rec.flota ? C.fleetFromB64(rec.flota) : quick ? G.quick.fleet : C.flotaPracticaDia(rec.d, 200);
    const v = rec.valores;
    G.lab = { rec, quick, fleet, v };
    const tools = [];
    const mk = (key, fn) => { const b = el('button', 'btn'); b.dataset.t = key; b.textContent = t(key); b.onclick = () => { sfx('click'); fn(); }; return b; };
    tools.push(mk('loadMine', () => { snapshot(); B.x = rec.x.slice(); updateBoard(); }));
    if (rec.mejor) tools.push(mk('loadBest', () => { snapshot(); B.x = rec.mejor.x.slice(); updateBoard(); }));
    closeAllOv();
    const labKey = quick ? 'labBanner' : 'labDaily'; // práctica ≠ jugada oficial
    boardSetup({
      mode: 'lab', values: v, ships: 100, scale: 100, x: loadBest && rec.mejor ? rec.mejor.x : rec.x, allowReserve: true,
      title: () => t(labKey), tools,
      launch: { label: () => t('close'), ready: () => true, go: () => { showResult(rec, { fresh: false, mode: quick ? 'quick' : 'daily' }); } },
      banner: (bb) => { const d = el('div', 'bb-lab'); d.innerHTML = '<span>' + esc(t(labKey)) + '</span><span>' + esc(t('labLive')) + ' <b class="grad" id="labPct">–</b></span>'; bb.appendChild(d); },
      onChange: labUpdate
    });
    setBase('board'); labUpdate();
    if (!quick) LS.set('ui', { s: 'lab', d: rec.d });
  }
  let labRaf = 0;
  function labUpdate() {
    if (!G.lab || B.mode !== 'lab') return;
    cancelAnimationFrame(labRaf);
    labRaf = requestAnimationFrame(() => {
      const L = G.lab, used = B.x.reduce((a, b) => a + b, 0), res = 100 - used;
      const ev = C.evaluar(B.x, L.fleet, L.v); const e = $('labPct'); if (e) e.textContent = fmtRend(ev.pct) + '%';
      if (!P.labHelp) { B.lanes.forEach((o) => { o.marg.textContent = ''; }); return; }
      const m = C.marginales(B.x.slice(), L.fleet, L.v, res);
      B.lanes.forEach((o, i) => {
        const d = m[i].d, s = (d > 0 ? '+' : '') + fmtPct(d, 1) + (LANG === 'es' ? ' %' : '%');
        o.marg.textContent = res > 0 ? t('marginal', { p: s }) : (m[i].from >= 0 ? t('marginal', { p: s }) + ' ←' + PN[m[i].from].slice(0, 3) : '');
        o.marg.title = res > 0 ? '' : (m[i].from >= 0 ? t('marginalFrom', { pl: PN[m[i].from], p: s }) : '');
        o.marg.classList.toggle('neg', d <= 0);
      });
    });
  }

  // ---------- ronda rápida ----------
  function startQuick(code) {
    const r = C.mulberry32((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    code = code || C.randomCode(r);
    const v = C.valoresAleatorios(code, 0); let va = C.valoresAleatorios(code, 1);
    const fleet = C.flotaPractica('R|' + code, 200, v, va);
    G.quick = { code, v, fleet, info: { valores: v, valoresAyer: va, intel: C.intel(fleet) } };
    closeAllOv();
    boardSetup({
      mode: 'quick', values: v, ships: 100, scale: 100, intel: G.quick.info.intel,
      title: () => t('quickPractice') + ' · ' + t('roundCode', { c: 'R-' + code }),
      launch: { label: () => t('launch'), missing: true, go: launchQuick },
      banner: null
    });
    setBase('board');
  }
  function launchQuick() {
    const x = B.x.slice(), q = G.quick; sfx('launch'); vib(15);
    const ev = C.evaluar(x, q.fleet, q.v), m = C.mejor(q.fleet, q.v, { ms: 300, seed: q.code });
    const rec = { d: today(), code: 'R-' + q.code, num: 0, x, valores: q.v, res: { pct: ev.pct, ganados: ev.w, empates: ev.d, perdidos: ev.l, N: ev.N, reales: 0, practica: 200, planetas: ev.pl.map((p) => ({ gane: p.gane, empate: p.empate, perdi: p.perdi, p95: p.p95 })) }, mejor: { x: m.x, pct: m.pct } };
    const st = LS.get('rapida', { best: 0, n: 0 }); st.n++; if (ev.pct > st.best) { rec.newRecord = st.n > 1; st.best = Math.round(ev.pct * 10) / 10; } LS.set('rapida', st);
    runBattle({ rec, kind: 'quick' }).then(() => showResult(rec, { fresh: true, mode: 'quick' }));
  }

  // ---------- duelo ----------
  function startDuel(style) {
    unlockAudio();
    const series = $('tSeries').classList.contains('on');
    if (!G.duel || G.duel.style !== style || !G.duel.series || G.duel.over) G.duel = { style, series: series ? { a: 0, b: 0 } : null, over: false };
    else if (!series) G.duel.series = null;
    const r = C.mulberry32((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    const code = C.randomCode(r); const v = C.valoresAleatorios(code, 0);
    const real = style === 'desconocido' ? C.STYLE_KEYS[Math.floor(r() * 3)] : style;
    const rival = C.STYLES[real](v, r, 100);
    G.duel.cur = { v, rival, real, code, a: 0, b: 0 };
    closeAllOv();
    boardSetup({
      mode: 'duel', values: v, ships: 100, scale: 100,
      title: () => t('duel') + ' · ' + t('styles')[style],
      launch: { label: () => t('launch'), missing: true, go: launchDuel },
      banner: (bb) => { const d = el('div', 'bb-lab'); const s = G.duel.series; d.innerHTML = '<span>' + esc(t('duelVs', { s: t('styles')[style] })) + (s ? ' · ' + esc(t('seriesScore', { a: s.a, b: s.b })) : '') + '</span><span id="duelLive">' + esc(t('liveScore', { a: G.duel.cur.a, b: G.duel.cur.b })) + '</span>'; bb.appendChild(d); }
    });
    setBase('board');
  }
  function launchDuel() {
    const D = G.duel.cur; sfx('launch'); vib(15);
    runBattle({ kind: 'duel', rival: D.rival, onReveal: (i, won) => { if (won > 0) D.a += D.v[i]; else if (won < 0) D.b += D.v[i]; const e = $('duelLive'); if (e) e.textContent = t('liveScore', { a: D.a, b: D.b }); } })
      .then(() => duelResult());
  }
  function duelResult() {
    const D = G.duel.cur, s = G.duel.series; const r = D.a > D.b ? 1 : D.a < D.b ? -1 : 0;
    if (s) { if (r > 0) s.a++; else if (r < 0) s.b++; }
    const done = s && (s.a >= 3 || s.b >= 3); if (done) G.duel.over = true;
    const xs = B.x.slice(), style = G.duel.style, sa = s ? s.a : 0, sb = s ? s.b : 0;
    const extra = () => {
      const x = el('div');
      x.innerHTML = '<div class="bigscore"><span class="a">' + D.a + '</span> – <span class="b">' + D.b + '</span></div>' +
        xs.map((v, i) => { const w = v > D.rival[i] ? 'w' : v < D.rival[i] ? 'l' : 't'; return '<div class="duelrow"><span>' + esc(PN[i]) + ' · ' + D.v[i] + ' ' + pu(D.v[i]) + '</span><span class="' + w + '">' + v + ' – ' + D.rival[i] + '</span></div>'; }).join('') +
        (style === 'desconocido' ? '<p style="margin:10px 0 0;text-align:center">' + esc(t('rivalWas', { s: t('styles')[D.real].toLowerCase() })) + '</p>' : '') +
        (s ? '<p style="margin:8px 0 0;text-align:center;font-family:JetBrains Mono,monospace;font-weight:700">' + esc(t('seriesScore', { a: sa, b: sb })) + '</p>' : '');
      return x;
    };
    const title = () => (done ? (sa > sb ? t('seriesWin') : t('seriesLose')) : r > 0 ? t('duelWin') : r < 0 ? t('duelLose') : t('duelTie'));
    if (r > 0) { A.result(true); } else A.result(false);
    message(title, '', [{ label: () => (done || !s ? t('anotherDuel') : t('next')), pri: true, fn: () => { if (done) G.duel.over = true; startDuel(G.duel.style); } }, { label: () => t('training'), fn: () => { goHome(); openTrain(); } }, { label: () => t('home'), fn: goHome }], { extra, hop: r > 0 ? 0.01 : 0 });
  }
  function openTrain() {
    if (G.base === 'board') setBase('home');
    renderTrain(); openOv('sTrain');
  }
  function renderTrain() {
    const q = LS.get('rapida', { best: 0, n: 0 });
    $('trRec').textContent = q.n ? t('record', { p: fmtPct(q.best) }) : '';
    const st = $('trStyles'); st.innerHTML = '';
    ['agresivo', 'equilibrado', 'sorpresa', 'desconocido'].forEach((k) => { const b = el('button', 'opt'); b.innerHTML = '<b>' + esc(t('styles')[k]) + '</b><span>' + esc(t('styleDesc')[k]) + '</span>'; b.onclick = () => { sfx('click'); startDuel(k); }; st.appendChild(b); });
  }

  // ---------- academia ----------
  function openAcad() {
    if (G.base === 'board') setBase('home');
    renderAcad(); openOv('sAcad');
  }
  function renderAcad() {
    const s = acadState(), list = $('acList'); list.innerHTML = '';
    const total = acadStars(); $('acStars').textContent = total + '/90 ★';
    let firstOpen = null;
    for (let sec = 1; sec <= 3; sec++) {
      const ms = ACAD.filter((m) => m.sector === sec); const secStars = (n) => ACAD.filter((m) => m.sector === n).reduce((a, m) => a + (s.stars[m.id] || 0), 0);
      const need = sec === 1 ? 0 : sec === 2 ? Math.max(0, 12 - secStars(1)) : Math.max(0, 30 - total);
      const h = el('div', 'sector', '<b>' + esc(t('sector', { n: sec })) + ' · ' + esc(t('sectors')[sec - 1]) + '</b><span>' + esc(t('ofStars', { a: secStars(sec), b: 30 })) + '</span>');
      list.appendChild(h);
      if (need > 0) list.appendChild(el('p', 'locknote', '🔒 ' + esc(t('sectorLocked', { n: need }))));
      const g = el('div', 'mgrid'); list.appendChild(g);
      ms.forEach((m, k) => {
        const b = el('button', 'mt'); const n = s.stars[m.id] || 0;
        b.innerHTML = (k + 1) + '<span class="st">' + '<b>' + '★'.repeat(n) + '</b>' + '★'.repeat(3 - n) + '</span>';
        b.setAttribute('aria-label', t('mission', { id: m.id }) + ' · ' + m.name[LANG] + ' · ' + n + '★');
        b.title = m.name[LANG];
        if (need > 0) b.disabled = true; else if (!n && !firstOpen) { firstOpen = b; b.classList.add('cur'); }
        b.onclick = () => { sfx('click'); startMission(m.id); };
        g.appendChild(b);
      });
    }
  }
  function startMission(id) {
    const m = ACAD.find((q) => q.id === id); if (!m) return;
    const idx = ACAD.indexOf(m); const s = acadState();
    G.mission = m; G.missionFails = s.fails[id] || 0;
    const ids = []; for (let i = 0; i < m.planets; i++) ids.push((idx + i) % 5);
    closeAllOv();
    boardSetup({
      mode: 'acad', ids, values: m.values, ships: m.ships, scale: m.ships, x: s.last[id], allowReserve: true, rivals: m.rivals,
      title: () => t('mission', { id }) + ' · ' + m.name[LANG],
      launch: { label: () => t('check'), ready: () => B.x.some((v) => v), go: checkMission },
      banner: (bb) => {
        const d = el('div', 'obj');
        d.innerHTML = '<div><span class="kick">' + esc(t('mission', { id })) + ' · ' + esc(m.name[LANG]) + '</span><div>' + esc(m.rivals.length > 1 ? t('beatAll', { n: m.rivals.length }) : t('beatOne')) + (m.lesson ? ' <small>· ' + esc(m.lesson[LANG]) + '</small>' : '') + '</div></div><small>' + esc(t(window.innerWidth < 600 ? 'starsShort' : 'starsHow', { a: m.star2, b: m.minShips })) + '</small>';
        bb.appendChild(d);
      }
    });
    setBase('board'); LS.set('ui', { s: 'acad', id });
  }
  function starsSVG(n, on) { let h = ''; for (let i = 0; i < 3; i++) h += '<svg viewBox="0 0 24 24" data-i="' + i + '"' + (on && i < n ? ' class="on"' : '') + '><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="#fdd835"/></svg>'; return '<div class="mstars">' + h + '</div>'; }
  function checkMission() {
    const m = G.mission, x = B.x.slice(), stars = C.estrellas(m, x), s = acadState();
    const used = x.reduce((a, b) => a + b, 0);
    const extra = (again) => { const e = el('div'); e.innerHTML = (stars ? starsSVG(stars, again) : '') + m.rivals.map((y, k) => { const d = C.duel(x, y, m.values); const c = d.r > 0 ? 'w' : d.r < 0 ? 'l' : 't'; return '<div class="duelrow"><span>' + esc(t('rival', { n: k + 1 })) + ' · ' + y.join('·') + '</span><span class="' + c + '">' + d.a + ' – ' + d.b + ' · ' + esc(d.r > 0 ? t('youWin') : d.r < 0 ? t('youLose') : t('youTie')) + '</span></div>'; }).join('') +
      '<p style="margin:10px 0 0;text-align:center;font-family:JetBrains Mono,monospace;font-size:13px">' + esc(t('usedShips', { n: used })) + ' · ' + esc(t('starsHow', { a: m.star2, b: m.minShips })) + '</p>'; return e; };
    const idx = ACAD.indexOf(m), next = ACAD[idx + 1];
    if (stars) {
      if (stars > (s.stars[m.id] || 0)) s.stars[m.id] = stars; s.fails[m.id] = 0; acadSave(s);
      for (let i = 0; i < stars; i++) setTimeout(() => { sfx('star', { i }); const sv = document.querySelector('#msgX .mstars svg[data-i="' + i + '"]'); if (sv) sv.classList.add('on'); }, 350 + i * 260);
      A.result(true); vib([10, 40, 10]);
      const btns = [];
      if (next && unlocked(next)) btns.push({ label: () => t('next'), pri: true, fn: () => startMission(next.id) });
      btns.push({ label: () => t('repeat'), pri: !btns.length, fn: () => { closeSheet(); } });
      btns.push({ label: () => t('academy'), fn: () => { goHome(); openAcad(); } });
      message(() => t('missionWon'), () => (stars === 3 ? '' : t('starsHow', { a: m.star2, b: m.minShips })), btns, { extra, hop: 0.01 });
      if (!next) toast(t('allDone'), null, null, 4000);
    } else {
      s.fails[m.id] = (s.fails[m.id] || 0) + 1; acadSave(s); sfx('lose'); vib(25);
      const btns = [{ label: () => t('retry'), pri: true, fn: () => {} }];
      if (s.fails[m.id] >= 3) btns.push({ label: () => t('hint'), fn: () => { const T = m.values.reduce((a, b) => a + b, 0), hp = PN[B.ids[m.hintPlanet]]; message(() => t('hint'), () => t('hint1', { pl: hp }) + ' ' + t('hint2', { n: Math.floor(T / 2) + 1, t: T }), [{ label: () => t('ok'), pri: true }]); } });
      btns.push({ label: () => t('academy'), fn: () => { goHome(); openAcad(); } });
      message(() => t('missionLost'), () => t('missionLostSub'), btns, { extra });
    }
  }
  function unlocked(m) { const s = acadState(); if (m.sector === 1) return true; const s1 = ACAD.filter((q) => q.sector === 1).reduce((a, q) => a + (s.stars[q.id] || 0), 0); if (m.sector === 2) return s1 >= 12; return acadStars() >= 30; }

  // ---------- tutorial ----------
  function bubble(bb, text, btn) {
    const d = el('div', 'bubble'); d.innerHTML = '<canvas class="cmd"></canvas><div style="flex:1"><span class="kick">' + esc(G.tut && G.tut.done ? t('tutCompleted') : t('tutStep', { n: G.tut.step })) + ' · ' + esc(t('commander')) + '</span><p></p></div>';
    d.querySelector('p').textContent = val(text); bb.appendChild(d);
    const btns = Array.isArray(btn) ? btn : (btn ? [btn] : []);
    if (btns.length) { const w = el('div', 'bubble-btns'); btns.forEach((x) => { const b = el('button', 'btn' + (x.pri ? ' pri' : '')); b.textContent = val(x.label); b.onclick = () => { sfx('click'); x.fn(); }; w.appendChild(b); }); d.appendChild(w); }
    G.bubbleCv = d.querySelector('canvas');
  }
  function setBubble(text, btn) { const bb = $('bBanner'); bb.innerHTML = ''; bubble(bb, text, btn); if (G.tut) G.tut.bub = [text, btn]; }
  function startTutorial(step) {
    G.tut = { step: step || 1, sub: 0 }; closeAllOv();
    const skip = el('button', 'btn'); skip.dataset.t = 'skipTut'; skip.textContent = t('skipTut'); skip.onclick = () => { sfx('back'); finishTutorial(false); };
    if (G.tut.step === 1) {
      G.tut.rival = [4];
      boardSetup({ mode: 'tut', ids: [2], values: [3], ships: 10, scale: 10, allowReserve: true, rivals: [[4]], title: () => t('tutStep', { n: 1 }), noClear: true, noRest: true, launch: null, tools: [skip],
        banner: (bb) => bubble(bb, () => t('t1')), onChange: tutCheck1 });
    } else if (G.tut.step === 2) {
      boardSetup({ mode: 'tut', ids: [0, 1, 2], values: [1, 2, 3], ships: 10, scale: 10, allowReserve: true, rivals: [[3, 3, 4]], title: () => t('tutStep', { n: 2 }), tools: [skip],
        launch: { label: () => t('check'), ready: () => B.x.some((v) => v), go: tutCheck2 }, banner: (bb) => bubble(bb, () => t('t2')) });
    } else {
      const v = C.valores(G.day); const r = C.rngFor('tut|' + G.day);
      G.tut.rival = C.rivalAgresivo(v, r, 100);
      boardSetup({ mode: 'tut', values: v, ships: 100, scale: 100, rivals: [G.tut.rival], hideRivals: true, title: () => t('tutStep', { n: 3 }), tools: [skip],
        launch: { label: () => t('launch'), missing: true, go: tutLaunch3 }, banner: (bb) => bubble(bb, () => t('t3')) });
    }
    setBase('board'); LS.set('ui', { s: 'tut', step: G.tut.step });
  }
  function tutCheck1() {
    if (!G.tut || G.tut.step !== 1 || G.tut.wait) return;
    const x = B.x[0], r = B.rivals[0][0];
    if (x > r) {
      G.tut.wait = true; sfx('win'); vib(10);
      if (r === 4) {
        setBubble(() => t('t1ok')); const tu = G.tut;
        setTimeout(() => {
          if (G.tut !== tu || tu.step !== 1) return;
          // el rival sube a 7: primero se anuncia (con la espera activa, para que el redibujado no lo pise) y después
          // se evalúa lo que ya hay; si arrastró la columna entera (más de 7), se resuelve sin tocar nada más
          B.rivals = [[7]]; setBubble(() => t('rivalShows', { n: 7 }) + '. ' + t('t1')); updateBoard(true);
          setTimeout(() => { if (G.tut !== tu || tu.step !== 1) return; tu.wait = false; tutCheck1(); }, (B.x[0] > 7 ? 1100 : 0) * ANIM + 1);
        }, 1300 * ANIM + 1);
      }
      else { setBubble(() => t('t1ok2'), { label: () => t('continue'), pri: true, fn: () => startTutorial(2) }); }
    } else if (x === r) setBubble(() => t('t1tie'));
  }
  function tutCheck2() {
    const x = B.x.slice(), d = C.duel(x, [3, 3, 4], [1, 2, 3]);
    if (d.r > 0) { sfx('win'); A.result(true); setBubble(() => t('t2ok'), { label: () => t('continue'), pri: true, fn: () => startTutorial(3) }); }
    else { sfx('lose'); const even = x.every((v) => v > 0) && Math.max(...x) - Math.min(...x) <= 2; setBubble(() => (even ? t('t2even') : t('t2lose'))); }
  }
  function tutLaunch3() {
    sfx('launch'); const rv = G.tut.rival, v = B.values; let a = 0, b = 0;
    runBattle({ kind: 'duel', rival: rv, onReveal: (i, won) => { if (won > 0) a += v[i]; else if (won < 0) b += v[i]; } }).then(() => {
      if (!G.tut) return;
      const win = a > b; A.result(win); G.tut.done = true;
      // estado «Tutorial completado»: el despliegue terminó, no se puede relanzar ni saltar; destinos explícitos y separados
      B.cfg.launch = null; updateLaunch(); $('toolsX').innerHTML = ''; $('bTitle').textContent = t('tutCompleted');
      setBubble(() => (win ? t('t3win') : t('t3lose')) + t('t3end'), [
        { label: () => t('todayFront'), pri: true, fn: () => finishTutorial(true) },
        { label: () => t('practiceRound'), fn: () => { finishTutorial(false); startQuick(); } },
        { label: () => t('home'), fn: () => finishTutorial(false) }
      ]);
      B.locked = true; $('sBoard').classList.add('locked');
    });
  }
  // «Ver el frente de hoy» sólo abre el informe del día; no confirma ni publica ninguna jugada.
  function finishTutorial(go) {
    LS.set('tutorial', { done: true }); G.tut = null; toast(t('tutDone'));
    if (go && C.frontNum(G.day) >= 1 && !(getRec(G.day) || {}).x) { goHome(); openBrief(false); } else goHome();
  }

  // ---------- historial ----------
  function openHist() { renderHist(); openOv('sHist'); }
  function renderHist() {
    const recs = history(), st = streakInfo(); const s = $('hiStats'), L = $('hiList'); s.innerHTML = ''; L.innerHTML = '';
    if (!recs.length) {
      const e = el('div', 'empty'); e.innerHTML = '<canvas class="cmd big" id="hiCmd" style="margin:0 auto 8px;display:block"></canvas>' + esc(t('historyEmpty'));
      const b = el('button', 'btn pri'); b.textContent = t('play'); b.onclick = () => { closeOv('sHist'); startDaily(); }; e.appendChild(b); L.appendChild(e);
    } else {
      const atk = recs.map((r) => r.res.pct), last = (n) => recs.filter((r) => C.dayNum(today()) - C.dayNum(r.d) < n).map((r) => r.res.pct);
      const avg = (a) => a.length ? pctS(a.reduce((x, y) => x + y, 0) / a.length) : '–';
      const defs = recs.filter((r) => r.def && r.def.pct != null).map((r) => r.def.pct);
      const pw = [0, 0, 0, 0, 0]; recs.forEach((r) => r.res.planetas.forEach((q, i) => { pw[i] += q.gane / r.res.N; }));
      const strong = pw.indexOf(Math.max(...pw));
      [[recs.length, t('stDays')], [st.cur, t('stStreak')], [st.best, t('stBestStreak')], [pctS(Math.max(...atk)), t('stBest')], [avg(last(7)), t('stAvg7')], [avg(last(30)), t('stAvg30')], [avg(defs), t('stDef')], [PN[strong], t('stStrong')]]
        .forEach(([v, l]) => s.appendChild(el('div', 'stat', '<b>' + esc(v) + '</b><span>' + esc(l) + '</span>')));
      recs.forEach((r) => {
        const b = el('button', 'hrow'); const md = medalOf(r);
        b.innerHTML = '<span class="md">' + (['–', '🥉', '🥈', '🥇', '🎖️'][md]) + '</span><span class="d">#' + r.num + '<small>' + fmtDate(r.d) + '</small></span><span class="v">' + fmtRend(r.res.pct) + '%<small>' + esc(t('attack')) + '</small></span><span class="v">' + (r.def && r.def.pct != null ? fmtRend(r.def.pct) + '%' : '–') + '<small>' + esc(t('defenseCol')) + '</small></span><canvas></canvas>';
        b.onclick = () => { sfx('click'); showResult(r, { fresh: false }); };
        L.appendChild(b); requestAnimationFrame(() => R.miniBars(b.querySelector('canvas'), r.x, null, Math.max(...r.x)));
      });
    }
  }

  // ---------- cómo jugar ----------
  let helpI = 0, helpRaf = 0, helpT0 = 0;
  function openHelp() { helpI = 0; renderHelp(); openOv('sHelp'); helpT0 = performance.now(); loopHelp(); }
  function renderHelp() {
    $('heText').textContent = t(['h1', 'h2', 'h3', 'h4'][helpI]);
    $('heDots').innerHTML = [0, 1, 2, 3].map((i) => '<i class="' + (i === helpI ? 'on' : '') + '"></i>').join('');
    $('bHeNext').textContent = helpI < 3 ? t('next') : t('gotIt'); $('bHePrev').disabled = helpI === 0;
    const ex = $('heExtra'); if (ex) ex.remove();
    if (helpI === 3 && !(G.base === 'board' && B.mode === 'tut')) { const b = el('button', 'btn'); b.id = 'heExtra'; b.textContent = t('practiceTut'); b.onclick = () => { sfx('click'); closeAllOv(); startTutorial(1); }; $('sHelp').querySelector('.card').appendChild(b); }
    helpT0 = performance.now();
  }
  function loopHelp() { cancelAnimationFrame(helpRaf); const f = (now) => { if (topOv() !== 'sHelp') return; R.drawHelp($('helpCv'), helpI, (now - helpT0) / 1000); helpRaf = requestAnimationFrame(f); }; helpRaf = requestAnimationFrame(f); }
  function stopHelp() { cancelAnimationFrame(helpRaf); }
  function helpGo(d) { const n = Math.max(0, Math.min(3, helpI + d)); if (n === helpI) { if (d > 0) closeOv('sHelp'); return; } helpI = n; sfx('whoosh'); renderHelp(); }

  // ---------- ajustes ----------
  function savePrefs() { LS.set('prefs', P); }
  function renderSettings() {
    $('rMus').value = Math.round(P.musicVol * 100); $('rSfx').value = Math.round(P.sfxVol * 100);
    $('tMus').classList.toggle('on', P.music); $('tSfx').classList.toggle('on', P.sfx); $('tVib').classList.toggle('on', P.vib); $('tRed').classList.toggle('on', reduced()); $('tLab').classList.toggle('on', P.labHelp);
    ['tMus', 'tSfx', 'tVib', 'tRed', 'tLab'].forEach((id) => $(id).setAttribute('aria-checked', $(id).classList.contains('on')));
    $('seId').textContent = t('id') + ' #' + ANON.slice(0, 4) + '…'; $('seVer').textContent = t('version') + ' ' + VERSION;
    $('seWarn').hidden = LS.ok; fsLabels();
    $('bTutAgain').parentElement.querySelector('#bFs2').hidden = !fsAvailable();
  }
  function openSettings() { renderSettings(); openOv('sSet'); }
  function applyAudioPrefs() { A.setMusic(P.music, P.musicVol); A.setSfx(P.sfx, P.sfxVol); }
  function applyReduced() { R.reduced = reduced(); document.documentElement.classList.toggle('nomo', reduced()); }
  function resetProgress() {
    sfx('warn');
    message(() => t('resetTitle', { juego: 'JET//Frentes' }), () => t('resetBody', { 'datos concretos': t('resetData') }), [
      { label: () => t('cancel'), pri: false },
      { label: () => t('resetAll'), cls: 'danger', fn: () => {
        LS.keys().forEach((k) => { if (k !== 'id' && k !== 'prefs') LS.del(k); }); // idioma y audio no se prometen: se conservan
        G.info = null; sfx('error'); closeAllOv(); goHome(); loadInfo(true);
        message(() => t('resetDone'), '', [{ label: () => t('ok'), pri: true }], { noCmd: true });
      } }
    ], { noCmd: true, alert: true, focoPrimero: true });
  }

  // ---------- pantalla completa ----------
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const fsAvailable = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  function toggleFs() {
    unlockAudio();
    try {
      if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else { const d = document.documentElement; const p = (d.requestFullscreen || d.webkitRequestFullscreen).call(d, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); }
    } catch (e) { /* nada */ }
  }
  function fsLabels() { const on = !!fsEl(); $('bFsT').textContent = on ? t('exitFullscreen') : t('fullscreen'); $('bFs2T').textContent = on ? t('exitFullscreen') : t('fullscreen'); $('bFs').hidden = !fsAvailable(); }

  // ---------- pausa, foco y cambios de tamaño ----------
  function pauseGame(auto) {
    if (G.overlays.indexOf('sPause') >= 0) return;
    G.paused = true;
    const enBatalla = !!(G.bt && !G.bt.done);
    $('paNote').hidden = !enBatalla;
    $('bPResult').hidden = !(enBatalla && G.bt.rec); // sólo si el resultado ya está calculado
    openOv('sPause'); if (!auto) sfx('back');
  }
  function resumeGame() { G.paused = false; unlockAudio(); if (G.base === 'board') try { B.lanes[B.sel].el.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
  // Salir de una partida cierra la pausa de verdad: la siguiente sesión arranca con el estado limpio.
  function goHome() { closeSheet({ sinFoco: true }); closeAllOv(); G.paused = false; G.bt = null; B.locked = false; $('sBoard').classList.remove('battle', 'locked'); B.mode = null; setBase('home'); }
  function newDaySheet() {
    const old = G.day; const nd = today(); const rec = getRec(old);
    G.day = nd; G.info = null; loadInfo(true);
    const txt = () => (rec && rec.x ? t('newDayPlayed', { n: C.frontNum(nd) }) : t('newDay', { n: C.frontNum(nd), m: C.frontNum(old) }));
    message(txt, '', [{ label: () => t('goNew', { n: C.frontNum(nd) }), pri: true, fn: () => { goHome(); startDaily(); } }]);
  }
  function checkDay() {
    if (today() === G.day) return;
    if (G.base === 'board' && B.mode === 'daily' && !G.bt) return newDaySheet();
    if (G.bt) return; // se resuelve al terminar
    G.day = today(); G.info = null; loadInfo(true); if (G.base === 'home') renderHome();
  }
  let rsT = 0;
  function onResize() { cancelAnimationFrame(rsT); rsT = requestAnimationFrame(() => { relayout(); fsLabels(); }); }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 120));
  if (window.visualViewport) visualViewport.addEventListener('resize', onResize);
  ['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => document.addEventListener(ev, () => { onResize(); fsLabels(); if (!fsEl() && G.bt && !G.bt.done) pauseGame(true); }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { flushSaves(); A.suspend(); if (G.bt && !G.bt.done) pauseGame(true); }
    else { A.resume(); checkDay(); if (G.base === 'home') { loadInfo(true); } flushQueue(); }
  });
  window.addEventListener('pagehide', flushSaves);
  window.addEventListener('focus', checkDay);
  window.addEventListener('online', () => { flushQueue(); if (G.offline) { G.info = null; loadInfo(true).then(() => { if (!G.offline) banner(t('online'), true, 2000); }); } });
  window.addEventListener('mousemove', (e) => { R.mx = e.clientX / window.innerWidth - 0.5; R.my = e.clientY / window.innerHeight - 0.5; }, { passive: true });

  // ---------- audio tras el primer gesto ----------
  let audioOn = false;
  function unlockAudio() { if (!audioOn) { audioOn = true; A.start(); applyAudioPrefs(); music(); } else if (!A.running && !document.hidden) A.resume(); }
  ['pointerdown', 'keydown', 'touchend'].forEach((ev) => window.addEventListener(ev, unlockAudio, { capture: true, passive: true }));

  // ---------- teclado ----------
  document.addEventListener('keydown', (e) => {
    const k = e.key, mod = e.ctrlKey || e.metaKey;
    if (G.sheet === 'shKeypad') { if (/^\d$/.test(k)) { kpKey(k); e.preventDefault(); } else if (k === 'Backspace') { kpKey('⌫'); e.preventDefault(); } else if (k === 'Enter') { kpOk(); e.preventDefault(); } else if (k === 'Escape') { kp = null; closeSheet(); } return; }
    if (G.sheet) { if (k === 'Escape') closeSheet(); return; }
    const enBoton = e.target && e.target.closest && e.target.closest('button,a[href],summary,[role="button"],[role="switch"],input,textarea,select');
    if ((k === 'Enter' || k === ' ') && enBoton) return;
    if (k === 'Escape' || (k === 'p' || k === 'P') && !mod) {
      if (G.overlays.length) { if (topOv() === 'sPause') closeOv('sPause'); else if (topOv() !== 'sHome') { sfx('back'); closeOv(); } return; }
      if (G.base === 'board') { pauseGame(); return; }
    }
    if (k === '?' && !G.overlays.length) { openHelp(); return; }
    if (topOv() === 'sHelp') { if (k === 'ArrowRight') helpGo(1); if (k === 'ArrowLeft') helpGo(-1); return; }
    if (G.overlays.length || G.base !== 'board') return;
    if (G.bt) { if (k === ' ' || k === 'Enter') { e.preventDefault(); speedUp(); } return; }
    if (e.target && e.target.closest && e.target.closest('input,textarea,select')) return;
    if (B.locked) return;
    const p = B.sel;
    if (/^[1-5]$/.test(k) && +k <= B.n && !G.typing) { selectLane(+k - 1); e.preventDefault(); return; }
    const L = k.toLowerCase(); if ('abcde'.indexOf(L) >= 0 && L.length === 1 && !mod && 'abcde'.indexOf(L) < B.n) { selectLane('abcde'.indexOf(L)); return; }
    if (k === 'ArrowLeft') { selectLane((p - 1 + B.n) % B.n); e.preventDefault(); }
    else if (k === 'ArrowRight') { selectLane((p + 1) % B.n); e.preventDefault(); }
    else if (k === 'Tab' && !e.altKey) { if (document.activeElement && document.activeElement.classList.contains('lane')) { const n = p + (e.shiftKey ? -1 : 1); if (n >= 0 && n < B.n) { selectLane(n); e.preventDefault(); } } }
    else if (k === 'ArrowUp') { setVal(p, B.x[p] + (e.shiftKey ? 10 : 1), { snap: true }); e.preventDefault(); }
    else if (k === 'ArrowDown') { setVal(p, B.x[p] - (e.shiftKey ? 10 : 1), { snap: true }); e.preventDefault(); }
    else if (k === 'PageUp') { setVal(p, B.x[p] + 10, { snap: true }); e.preventDefault(); }
    else if (k === 'PageDown') { setVal(p, B.x[p] - 10, { snap: true }); e.preventDefault(); }
    else if (k === 'Home') { setVal(p, 0, { snap: true }); e.preventDefault(); }
    else if (k === 'End') { setVal(p, maxFor(p), { snap: true }); e.preventDefault(); }
    else if (mod && (L === 'z') && !e.shiftKey) { undo(); e.preventDefault(); }
    else if (mod && (L === 'y' || (L === 'z' && e.shiftKey))) { redo(); e.preventDefault(); }
    else if (k === '#') { openKeypad(p); e.preventDefault(); }
    else if (k === 'Enter') { if (document.activeElement && document.activeElement.tagName === 'BUTTON') return; e.preventDefault(); onLaunch(); }
  });

  // ---------- enlaces de botones ----------
  function on(id, fn, snd) { $(id).addEventListener('click', (e) => { if (snd !== false) sfx(snd || 'click'); fn(e); }); }
  on('bMain', () => { if (C.frontNum(G.day) < 1) return startQuick(); startDaily(); });
  on('bAcad', openAcad); on('bTrain', openTrain); on('bHist', openHist); on('bHelp', openHelp); on('bSet2', openSettings); on('bFs', toggleFs); on('bFs2', toggleFs);
  on('bGear', openSettings); on('bPause', () => pauseGame(), false); on('bBrief', () => openBrief(true));
  on('bToDeploy', () => { if (G.briefFromBoard) closeOv('sBrief'); else enterDailyBoard(); });
  $('resv').addEventListener('click', () => { if (B.locked || !B.lanes.length) return; const sb = $('sBoard'); sb.classList.remove('breathe'); void sb.offsetWidth; sb.classList.add('breathe'); setTimeout(() => sb.classList.remove('breathe'), 2500); sfx('click'); });
  on('bUndo', undo, false); on('bRedo', redo, false); on('bClear', clearBoard, false); on('bLaunch', onLaunch, false);
  on('bCfGo', confirmLaunch, false); on('bCfNo', closeSheet, 'back'); on('bKpOk', kpOk, false); on('bKpNo', () => { kp = null; closeSheet(); }, 'back');
  $('sBoard').addEventListener('pointerdown', (e) => { if (G.bt && !G.bt.done && !e.target.closest('#topR')) speedUp(); });
  $('sheetBg').addEventListener('click', () => { if (G.sheet === 'shKeypad') kp = null; closeSheet(); });
  on('bResume', () => closeOv('sPause')); on('bPHelp', openHelp); on('bPSet', openSettings); on('bPMenu', () => { flushSaves(); goHome(); });
  // «Ver resultado»: acelera la animación hasta el final con la evaluación ya calculada; no fabrica resultados.
  on('bPResult', () => { if (G.bt && !G.bt.done && G.bt.rec) G.bt.speed = 60; closeOv('sPause'); });
  on('bQuick', () => startQuick()); on('tSeries', () => { $('tSeries').classList.toggle('on'); $('tSeries').setAttribute('aria-checked', $('tSeries').classList.contains('on')); }, 'toggle');
  on('bHePrev', () => helpGo(-1), false); on('bHeNext', () => helpGo(1), false);
  on('bTutAgain', () => { closeAllOv(); startTutorial(1); });
  on('bReset', resetProgress, false);
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { sfx('back'); const s = b.closest('.scr'); if (s.id === 'sResult') LS.set('ui', null); closeOv(s.id); }));
  // deslizar en Cómo jugar
  (function () { let sx = null; const s = $('heSlides'); s.addEventListener('pointerdown', (e) => { sx = e.clientX; }); s.addEventListener('pointerup', (e) => { if (sx == null) return; const d = e.clientX - sx; sx = null; if (Math.abs(d) > 40) helpGo(d < 0 ? 1 : -1); }); })();
  // ajustes
  const tog = (id, key, fn) => on(id, () => { P[key] = !P[key]; savePrefs(); renderSettings(); if (fn) fn(); }, 'toggle');
  tog('tMus', 'music', applyAudioPrefs); tog('tSfx', 'sfx', applyAudioPrefs); tog('tVib', 'vib', () => vib(15)); tog('tLab', 'labHelp', labUpdate);
  on('tRed', () => { P.reduced = !reduced(); savePrefs(); applyReduced(); renderSettings(); }, 'toggle');
  $('rMus').addEventListener('input', (e) => { P.musicVol = e.target.value / 100; P.music = true; applyAudioPrefs(); renderSettings(); saveLater('prefs', P); });
  $('rSfx').addEventListener('input', (e) => { P.sfxVol = e.target.value / 100; P.sfx = true; applyAudioPrefs(); renderSettings(); saveLater('prefs', P); });
  $('rSfx').addEventListener('change', () => sfx('plus', { n: 50 }));
  // selector ES | EN (Ajustes e inicio): la elección vale para todo jetgames.fun (JETIdioma); el repintado llega por el evento 'jet-idioma'
  document.querySelectorAll('.lang-seg button').forEach((b) => b.addEventListener('click', () => { if (b.dataset.l === LANG) return; sfx('toggle'); JI.set(b.dataset.l); }));
  window.addEventListener('jet-idioma', (e) => { const l = e && e.detail === 'en' ? 'en' : 'es'; if (l === LANG) return; LANG = l; applyTexts(); fsLabels(); refreshAll(); });
  // repinta en el otro idioma lo que esté a la vista, sin cambiar de pantalla ni tocar la partida
  function refreshAll() {
    if (G.base === 'home') renderHome();
    if (G.base === 'board' && B.mode) {
      if (!(G.bt && !G.bt.done)) updateBoard(); else updateLaunch();
      if (B.mode === 'tut' && G.tut && G.tut.bub) setBubble(G.tut.bub[0], G.tut.bub[1]); else if (!(G.bt && !G.bt.done)) renderBanner();
      B.lanes.forEach((o, i) => { o.name.textContent = PN[B.ids[i]]; });
      renderSideBrief(); $('bTitle').textContent = val(B.cfg.title) || ''; labUpdate();
    }
    if (G.overlays.indexOf('sResult') >= 0 && G.resultRec) showResult(G.resultRec, { fresh: false, mode: G.resultMode, repaint: true });
    if (G.overlays.indexOf('sBrief') >= 0 && G.info) renderBrief(G.info, G.briefFromBoard);
    if (G.overlays.indexOf('sAcad') >= 0) renderAcad();
    if (G.overlays.indexOf('sTrain') >= 0) renderTrain();
    if (G.overlays.indexOf('sHist') >= 0) renderHist();
    if (G.overlays.indexOf('sHelp') >= 0) { const h0 = helpT0; renderHelp(); helpT0 = h0; }
    if (G.overlays.indexOf('sSet') >= 0) renderSettings();
    if (G.sheet === 'shMsg' && G.msgPaint) G.msgPaint(true);
    if (G.sheet === 'shKeypad' && kp) { $('kpT').textContent = t('keypadT', { pl: PN[B.ids[kp.p]] }); $('kpMax').textContent = t('keypadMax', { n: kp.max }); }
  }

  // ---------- bucle principal ----------
  let lastF = 0;
  function frame(now) {
    const dt = Math.min(0.05, lastF ? (now - lastF) / 1000 : 0.016); lastF = now;
    battleStep(dt);
    R.frame(now);
    // comandantes (astronauta oficial)
    const tt = R.t;
    if (G.bubbleCv && G.bubbleCv.isConnected) R.drawCommander(G.bubbleCv, tt, 0);
    if (G.overlays.indexOf('sBrief') >= 0) R.drawCommander($('brCmd'), tt, 0);
    if (G.overlays.indexOf('sResult') >= 0) { if (G.cmdHop) G.cmdHop += dt; if (G.cmdHop > 1.6) G.cmdHop = 0.01; R.drawCommander($('rsCmd'), tt, G.cmdHop); }
    if (G.sheet === 'shMsg') { if (G.msgHop) G.msgHop += dt; if (G.msgHop > 1.6) G.msgHop = 0.01; R.drawCommander($('msgCmd'), tt, G.msgHop || 0); }
    const hc = $('hiCmd'); if (hc && G.overlays.indexOf('sHist') >= 0) R.drawCommander(hc, tt, 0);
    requestAnimationFrame(frame);
  }
  // cuenta atrás del resultado
  setInterval(() => { if (topOv() === 'sResult' && G.resultRec && G.resultRec.d === today() && G.resultMode === 'daily' && !G.resultPlaying) $('rsCd').textContent = t('nextFront', { t: countdown() }); if (G.base === 'home' && !G.overlays.length) { const rec = getRec(G.day); if (rec && rec.x || C.frontNum(G.day) < 1) $('hCount').innerHTML = esc(rec && rec.x ? t('nextFront', { t: '' }) : t('firstFront', { t: '' })) + '<b>' + countdown() + '</b>'; } }, 1000);

  // ---------- defensa de días anteriores (resultado final) ----------
  async function refreshDefenses() {
    for (const k of [2, 3]) {
      const d = C.addDays(G.day, -k), r = getRec(d);
      if (!r || !r.x || r.offline || (r.def && r.def.final)) continue;
      try { const j = await api('?a=defensa&d=' + d + '&id=' + ANON, null, 6000); if (j && j.defensa) { r.def = j.defensa; r.def.final = true; putRec(r); } } catch (e) { break; }
    }
  }

  // ---------- arranque ----------
  function boot() {
    R.cv = $('cv'); R.ctx = R.cv.getContext('2d'); applyReduced(); R.resize();
    const ui = LS.get('ui', null); // se lee antes de pintar el inicio (que lo limpia)
    applyTexts(); fsLabels(); setBase('home');
    requestAnimationFrame(frame);
    loadInfo().then(() => { renderHome(); refreshDefenses(); flushQueue(); });
    // limpiar borradores viejos
    LS.keys().forEach((k) => { if (k.indexOf('borrador:') === 0) { const d = k.slice(9); if (C.dayNum(G.day) - C.dayNum(d) > 1) LS.del(k); } });
    // volver a la pantalla en la que estaba
    if (ui && !DEMO) {
      if (ui.s === 'daily' && ui.d === G.day && !(getRec(G.day) || {}).x) loadInfo().then(enterDailyBoard);
      else if ((ui.s === 'result' || ui.s === 'lab') && getRec(ui.d)) { const r = getRec(ui.d); if (ui.s === 'lab') openLab(r, false); else showResult(r, { fresh: false }); }
      else if (ui.s === 'acad' && ACAD.find((m) => m.id === ui.id)) startMission(ui.id);
      else if (ui.s === 'tut') startTutorial(ui.step || 1);
    }
    if (TEST) { const acc = ACAD.map((m) => C.resolverMision(m, 1)); window.FRENTES.academiaOK = acc.every((r, i) => r.count > 0 && r.min === ACAD[i].minShips); }
    if (window.__frCargaLista) window.__frCargaLista();
    if (DEMO) demo();
  }
  // captura para la portada (?demo): planetas con enjambres cian y la nube rosa a medio revelar
  function demo() {
    $('back').style.display = 'none'; $('topR').style.display = 'none'; document.body.classList.add('demo');
    const v = C.valores(G.day), fl = C.flotaPracticaDia(G.day, 200), x = C.mejor(fl, v, { ms: 400, seed: G.day }).x; // jugada real de experto: el % del titular es el verdadero
    boardSetup({ mode: 'daily', values: v, ships: 100, scale: 100, x, title: '', launch: null, noReserve: true });
    $('bSide').style.display = 'none'; setBase('board'); B.locked = true; $('sBoard').classList.add('battle');
    const ev = C.evaluar(x, fl, v);
    const lanes = laneBattleData({ res: { planetas: ev.pl, N: ev.N } }, fl);
    lanes.forEach((L, i) => { L.arrive = 1; L.reveal = i < 3 ? 1 : i === 3 ? 0.55 : 0; if (i < 3) { const pg = L.pGane; B.lanes[i].res.className = 'lres ' + (pg >= 60 ? 'w' : pg < 30 ? 'l' : 't'); B.lanes[i].res.innerHTML = '<b>' + pctS(pg) + '</b>'; } });
    B.lanes.forEach((o) => o.el.classList.remove('sel')); requestAnimationFrame(() => { relayout(); B.lanes.forEach((o) => o.el.classList.remove('sel')); });
    G.bt = { lanes, done: false, phase: 'demo', o: {} };
    const h = el('div'); h.style.cssText = 'position:fixed;left:0;right:0;top:4%;text-align:center;z-index:50;font:800 30px Poppins;letter-spacing:-.02em;color:#fff;text-shadow:0 4px 30px rgba(0,0,0,.8)';
    h.innerHTML = 'JET<i style="font-style:normal;color:#00f2cf">//</i>Frentes · <span style="background:linear-gradient(135deg,#7700f4,#00f2cf);-webkit-background-clip:text;background-clip:text;color:transparent">' + esc(pctS(ev.pct)) + '</span>';
    document.body.appendChild(h);
    battleStep = () => {};
  }

  // ---------- gancho de pruebas ----------
  window.FRENTES = {
    get state() { return { base: G.base, overlays: G.overlays.slice(), sheet: G.sheet, mode: B.mode, x: B.x.slice(), values: B.values.slice(), reserve: reserve(), day: G.day, offline: G.offline, battle: !!G.bt, paused: G.paused, info: G.info, lang: LANG, tut: G.tut && G.tut.step, mission: G.mission && G.mission.id }; },
    fecha: today, valores: (f) => C.valores(f || G.day),
    setX(x) { if (!B.lanes.length) return false; snapshot(); B.x = x.slice(0, B.n); updateBoard(); return true; },
    lanzar() { if (B.mode === 'daily') { onLaunch(); if (G.sheet === 'shConfirm') confirmLaunch(); } else onLaunch(); },
    simular(n, seed) { return C.flotaPractica(seed || 'sim', n || 200, C.valores(G.day), C.valores(C.addDays(G.day, -1))); },
    evaluar: (x, fl, v) => C.evaluar(x, fl, v || C.valores(G.day)), mejor: (fl, v) => C.mejor(fl, v || C.valores(G.day)),
    academia: { verificar: () => ACAD.map((m) => ({ id: m.id, ok: C.resolverMision(m, 1).min === m.minShips })) },
    irA(s) { const m = { home: goHome, brief: () => openBrief(false), deploy: enterDailyBoard, acad: openAcad, train: openTrain, hist: openHist, help: openHelp, settings: openSettings, quick: () => startQuick('7F3A'), tut: () => startTutorial(1), pause: () => pauseGame() }; if (m[s]) m[s](); },
    forzarSinConexion(b) { forceOffline = !!b; G.info = null; return loadInfo(true); },
    forzarFecha(f) { forcedDate = f; checkDay(); },
    startMission, startDuel, startQuick, showResult, getRec, speedUp, finish: () => { if (G.bt) { G.bt.phase = 'done'; } }, LS, B, G, audio: A, anon: ANON
  };
  boot();
})();
