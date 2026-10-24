/* JET//Telemetría — interfaz, flujo de pantallas, guardado y gancho de pruebas window.TELEMETRIA. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var QS = new URLSearchParams(location.search);
  var DEBUG = QS.has('debug');
  var CD = window.CAMPANA_DATOS || { casos: {}, diario: {}, practica: {} };

  /* ================= Guardado ================= */
  var PFX = 'jet-telemetria:';
  var LSOK = (function () { try { localStorage.setItem(PFX + 't', '1'); localStorage.removeItem(PFX + 't'); return true; } catch (e) { return false; } })();
  function lget(k, d) { try { var v = localStorage.getItem(PFX + k); if (!v) return d; var o = JSON.parse(v); return (o && typeof o === 'object') ? o : d; } catch (e) { return d; } }
  function lset(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) {} }
  function ldel(k) { try { localStorage.removeItem(PFX + k); } catch (e) {} }

  // PLAY-TELEMETRIA-01: los porcentajes se muestran por defecto (una preferencia guardada sigue mandando)
  var PDEF = { v: 1, music: true, musicVol: 0.7, sfx: true, sfxVol: 0.85, vib: true, lang: null, pct: true, ora: true, rm: null, hc: false, dbl: false };
  // Umbrales vigentes (ui.js 839) y regla de apertura de capítulos (capAbierto): se leen desde acá para que texto y cálculo nunca diverjan
  var UMBRAL_EST = { 2: 80, 3: 95 }, GANAR_PARA_ABRIR = 4, MAX_EST_PISTA = 2;
  var P = Object.assign({}, PDEF, lget('prefs', {}));
  /* Idioma: una sola elección para todo jetgames.fun (src/jet-idioma.js). El idioma propio que guardaba este juego
     (P.lang) se migró a jet_lang en index.html y ya no se usa. */
  var L = window.JETIdioma ? JETIdioma.get() : ((navigator.language || 'es').toLowerCase().indexOf('es') === 0 ? 'es' : 'en');
  if (P.lang != null) { P.lang = null; lset('prefs', P); }
  function cambiarIdioma(l) { if (window.JETIdioma) JETIdioma.set(l); else if (l !== L) window.dispatchEvent(new CustomEvent('jet-idioma', { detail: l })); }
  function guardarPrefs() { lset('prefs', P); }
  function t(k, v) {
    var s = T[L][k]; if (s === undefined) s = T.es[k];
    if (typeof s === 'string' && v) s = s.replace(/\{([^{}]+)\}/g, function (m, x) { return v[x] != null ? v[x] : m; });
    return s;
  }
  window.TXT = function (k) { return T[L][k]; };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pct(x) { return Math.round(x * 100) + (L === 'es' ? ' %' : '%'); }
  function rmActivo() { return P.rm === null ? !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) : !!P.rm; }

  var PR = Object.assign({ v: 1, est: {}, estV: {}, prec: {}, int: {}, tut3: false, vet: false, jugado: false }, lget('progreso', {}));
  if (!PR.int || typeof PR.int !== 'object') PR.int = {};
  function guardarPR() { lset('progreso', PR); }
  var DI = Object.assign({ v: 1, fecha: null, empezado: false, terminado: false, res: null, racha: 0, ultimo: null, acc: null, pista: false }, lget('diario', {}));
  function guardarDI() { lset('diario', DI); }

  /* ================= Utilidades de juego ================= */
  var ICO = {
    prop: '<path d="M3 9h8l7-4v14l-7-4H3z"/><path d="M19 9.5h2.5M19 12h3M19 14.5h2.5"/>',
    nav: '<circle cx="12" cy="12" r="9"/><path d="M12 5.5l2.4 6.5L12 18.5 9.6 12z"/>',
    radar: '<path d="M4 14a9 9 0 0 0 10-10z"/><path d="M9 9l6-6M8.5 14.5 6 21h7"/>',
    energia: '<path d="M13 2 5 14h6l-1 8 8-12h-6z"/>',
    refri: '<path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/><path d="M9 3.5l3 2 3-2M9 20.5l3-2 3 2"/>',
    comms: '<circle cx="12" cy="12" r="1.8"/><path d="M8 8a5.5 5.5 0 0 0 0 8M16 8a5.5 5.5 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>',
    giro: '<ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="4" ry="9"/><circle cx="12" cy="12" r="1.4"/>',
    vital: '<path d="M5 13a7 7 0 0 1 14 0v4a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/><path d="M8.5 12h7v2.5a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2z"/>',
    escudo: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    acople: '<path d="M12 3v8M9 4h6"/><path d="M12 11a5 5 0 1 1-5 5"/>'
  };
  function svg(k, cls) { return '<svg viewBox="0 0 24 24"' + (cls ? ' class="' + cls + '"' : '') + ' aria-hidden="true">' + (ICO[k] || '') + '</svg>'; }
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#ffb020" stroke="#ffcf6a" stroke-width=".8"/></svg>';
  function nombreSis(caso, q) { return t('sys')[caso.sis[q].k]; }
  function nombreObj(caso, T) { return T >= 100 ? t('zoneNames')[T - 100] : nombreSis(caso, T); }
  function nomSen(k) { return t('sen')[k]; }
  function vib(p) { if (P.vib && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} }
  function sfx(n, x) { return SFX.play(n, x); }
  function descCampana(id) {
    var d = CD.casos[id], tpl = CASOS.porId[id];
    var s0 = d ? d[0] : (NUCLEO.xmur3('fallback|' + id)() >>> 0), a = d ? d[1] : tpl.aire;
    return { modo: 'campana', id: id, tpl: id, s: semillaIntento(tpl, s0, a, (PR.int && PR.int[id]) || 0), a: a };
  }
  /* Cada intento nuevo de un caso de campaña es otra avería con la misma plantilla y el mismo aire calibrado
     (la dificultad se calibró sobre averías sorteadas, no sobre la semilla). Así «Otra vez» o «Reiniciar» no dejan
     jugar sabiendo la respuesta ni repetir lecturas gratis. El primer intento es siempre el caso curado. */
  function semillaIntento(tpl, s0, a, n) {
    if (!n || tpl.tut === 1 || tpl.tut === 2) return s0;
    for (var k = 0; k < 40; k++) {
      var s = NUCLEO.xmur3('intento|' + tpl.id + '|' + s0 + '|' + n + '|' + k)() >>> 0, c = NUCLEO.generarCaso(tpl, s, a);
      if (!c.bitacora.length) return s;
      var mn = Math.min.apply(null, c.prior), mx = Math.max.apply(null, c.prior);
      if (tpl.enganio ? !c.F.some(function (f) { return c.prior[f] >= mx - 1e-12; }) : !c.F.some(function (f) { return c.prior[f] <= mn + 1e-12; })) return s;
    }
    return s0;
  }
  function airePlantilla(id) { var d = CD.casos[id]; return d ? d[1] : CASOS.porId[id].aire; }
  function hoy() { return NUCLEO.fechaLocal(); }
  function ayer(f) { var p = f.split('-').map(Number); return NUCLEO.fechaLocal(new Date(p[0], p[1] - 1, p[2] - 1)); }
  function syncDiario() { var h = hoy(); if (DI.fecha !== h) { DI.fecha = h; DI.empezado = false; DI.terminado = false; DI.res = null; DI.acc = null; DI.pista = false; guardarDI(); } }
  function rachaVis() { if (!DI.ultimo) return 0; var h = hoy(); return (DI.ultimo === h || DI.ultimo === ayer(h)) ? DI.racha : 0; }
  function descDiario(f) {
    var wd = NUCLEO.diaSemana(f), tpl = CASOS.DIARIO[wd], pool = (CD.diario && CD.diario[tpl.id]) || [], num = NUCLEO.numeroDiario(f);
    var e = pool.length ? pool[((Math.floor((num - 1) / 7) % pool.length) + pool.length) % pool.length] : [NUCLEO.xmur3('telemetria:' + f)() >>> 0, tpl.aire];
    return { modo: 'diario', id: 'D' + num, tpl: tpl.id, s: e[0], a: e[1], num: num, fecha: f };
  }
  function ganados(cap) { return CASOS.capitulo(cap).filter(function (x) { return (PR.est[x.id] || 0) > 0; }).length; }
  function capAbierto(cap) { return cap === 1 || (cap === 9 ? ganados(8) >= GANAR_PARA_ABRIR : ganados(cap - 1) >= GANAR_PARA_ABRIR); }
  function vetAbierto() { return ganados(4) >= 4; }
  function estrellasTot() { var s = 0; for (var k in PR.est) s += PR.est[k] || 0; return s; }
  function capActual() { for (var c = 8; c >= 1; c--) if (capAbierto(c)) return c; return 1; }
  function progresoRuta() { var n = 0; for (var c = 2; c <= 9; c++) if (capAbierto(c)) n++; return n / 8; }
  function siguienteId() {
    var lista = CASOS.CAMPANA;
    for (var i = 0; i < lista.length; i++) { var x = lista[i]; if (capAbierto(x.cap) && !(PR.est[x.id] > 0)) return x.id; }
    for (var j = 0; j < lista.length; j++) { var y = lista[j]; if (capAbierto(y.cap) && (PR.est[y.id] || 0) < 3) return y.id; }
    return 'F';
  }
  function etiquetaCaso(desc) {
    if (desc.modo === 'diario') return t('dailyLabel', { n: desc.num });
    if (desc.modo === 'practica' || desc.modo === 'prueba') return t('practiceLabel');
    return t('caseLabel', { c: desc.id === 'F' ? t('finalCase').toUpperCase() : desc.id });
  }
  function partidaGuardada() {
    var p = lget('partida', null);
    if (!p || !p.desc || !CASOS.porId[p.desc.tpl] || !Array.isArray(p.acc)) return null;
    if (p.desc.modo === 'diario') return null; // el diario se guarda aparte (DI.acc): nunca pisa ni lo pisa otra partida
    return p;
  }

  /* ================= Audio: arranque tras el primer gesto ================= */
  function audioGesto() {
    AUDIO.init(); AUDIO.resume();
    AUDIO.setPrefs({ music: P.music, musicVol: P.musicVol, sfx: P.sfx, sfxVol: P.sfxVol });
  }
  ['pointerdown', 'keydown', 'touchend'].forEach(function (ev) { window.addEventListener(ev, audioGesto, { passive: true, capture: true }); });

  /* ================= Preferencias visuales ================= */
  function aplicarPrefs() {
    var b = document.body;
    b.classList.toggle('pct', !!P.pct); b.classList.toggle('hc', !!P.hc); b.classList.toggle('rm', rmActivo());
    CABINA.reducido = rmActivo();
    document.documentElement.lang = L;
    AUDIO.setPrefs({ music: P.music, musicVol: P.musicVol, sfx: P.sfx, sfxVol: P.sfxVol });
    $$('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); });
    $$('[data-ta]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-ta'))); el.title = t(el.getAttribute('data-ta')); });
    $('#bAjustes').setAttribute('aria-label', t('settings'));
    $('#bPausa').setAttribute('aria-label', t('pause'));
    $('#bFs').setAttribute('aria-label', enFS() ? t('exitFullscreen') : t('fullscreen'));
    $('#back').setAttribute('aria-label', t('back'));
    $('#bLog').setAttribute('aria-label', t('log')); $('#bPista').setAttribute('aria-label', t('hint'));
    $('#s-inicio').setAttribute('aria-label', t('title'));
    $('#gAire').title = t('airRule');
    document.title = t('title') + ' · ' + t('tagline').replace(/\.$/, '');
  }

  /* ================= Pantalla completa y disposición ================= */
  var FS_OK = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  function enFS() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function alternarFS() {
    try {
      if (enFS()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
      else { var el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen; if (rq) { var r = rq.call(el, { navigationUI: 'hide' }); if (r && r.catch) r.catch(function () {}); } }
    } catch (e) {}
  }
  var layout = '', estabaFS = false;
  function relayout() {
    var vv = window.visualViewport, w = vv ? vv.width : innerWidth, h = vv ? vv.height : innerHeight;
    document.documentElement.style.setProperty('--vh', Math.round(h) + 'px');
    var lay = w > h * 1.05 ? (h < 560 ? 's' : 'l') : 'p';
    var b = document.body;
    if (lay !== layout) { b.classList.remove('lay-p', 'lay-l', 'lay-s'); b.classList.add('lay-' + lay); layout = lay; }
    b.classList.toggle('desk', lay === 'l' && w >= 1280 && h >= 700);
    if (G) G.geoKey = '';
    if (b.classList.contains('desk')) cerrarHoja();
    if (G) $$('#filas .fila').forEach(ajustarProbable);
    dibujar(true);
  }
  ['resize', 'orientationchange'].forEach(function (e) { window.addEventListener(e, function () { relayout(); setTimeout(relayout, 250); }); });
  if (window.visualViewport) visualViewport.addEventListener('resize', relayout);
  function onFS() {
    var ahora = enFS();
    relayout();
    $('#bFs').setAttribute('aria-label', ahora ? t('exitFullscreen') : t('fullscreen'));
    $('#bFs').innerHTML = ahora ? '<svg viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
    if (estabaFS && !ahora && pantalla === 'juego' && G && !G.st.fin) pausar();
    estabaFS = ahora;
    if (pantalla === 'inicio') renderInicio();
    if ($('#ov-ajustes').classList.contains('on')) renderAjustes();
  }
  document.addEventListener('fullscreenchange', onFS); document.addEventListener('webkitfullscreenchange', onFS);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { AUDIO.suspend(); if (pantalla === 'juego' && G && !G.st.fin) { if (G.hold) finMantener(false); pausar(); } }
    else { relayout(); AUDIO.resume(); }
  });
  window.addEventListener('pagehide', function () { if (G && pantalla === 'juego') guardar(); });

  /* ================= Pantallas ================= */
  var pantalla = null, ovAbierto = null, volverAjustes = null;
  function mostrar(id) {
    $$('.scr').forEach(function (s) { s.classList.toggle('on', s.id === 's-' + id); });
    pantalla = id;
    $('#bPausa').hidden = id !== 'juego';
    $('#bFs').hidden = !(FS_OK && id === 'inicio');
    $('#hdrMid').innerHTML = id === 'juego' && G ? esc(etiquetaCaso(G.desc)) + (G.vet ? ' · <b>' + esc(t('veteran').toUpperCase()) + '</b>' : '') : '';
    if (id !== 'juego') { cerrarHoja(); MUSICA.respirar(false); }
    MUSICA.tema(id === 'juego' ? 'juego' : 'menu');
    var s = $('#s-' + id); if (s) s.scrollTop = 0;
    // RSP-MODALS-01: si el foco quedó en el cuerpo (el control anterior desapareció), va al primer control lógico de la pantalla revelada,
    // sin condicionarlo al tipo de puntero (un táctil puede tener teclado)
    setTimeout(function () { var f = $('#s-' + id + ' [data-foco]') || $('#s-' + id + ' .btn.pri, #s-' + id + ' button'); if (f && (document.activeElement === document.body || !visibleEl(document.activeElement))) f.focus({ preventScroll: true }); }, 60);
    dibujar(true);
  }
  /* ---------- RSP-MODALS-01: superposiciones con activador, fondo inerte, nombre, ciclo de Tab y retorno de foco ---------- */
  var ovPila = []; // una entrada por capa abierta: { id, act (elemento activador), actId }
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function visibleEl(n) { return !!n && n.isConnected && !n.closest('[hidden]') && n.getClientRects().length > 0 && !n.closest('[inert]'); }
  function focusables(raiz) { return $$(FOCUSABLE, raiz).filter(function (n) { return visibleEl(n) && n.getAttribute('aria-hidden') !== 'true'; }); }
  function fondoInerte() {
    var on = !!ovAbierto, hoja = $('#sheet').classList.contains('on');
    ['#hdr', '#s-inicio', '#s-mapa', '#s-practica', '#s-brief', '#s-juego', '#s-res', '#carga'].forEach(function (s) { var e = $(s); if (e) e.inert = on || hoja; });
    $('#sheet').inert = on; // la hoja del registro queda detrás de pausa/ajustes
  }
  function nombrarDialogo(ov) {
    var h = $('h2,h3', ov); if (!h) { ov.removeAttribute('aria-labelledby'); return; }
    if (!h.id) h.id = ov.id + '-t';
    ov.setAttribute('aria-labelledby', h.id);
  }
  function abrirOv(id, activador) {
    var act = activador || document.activeElement, ov = $('#ov-' + id);
    var top = ovPila[ovPila.length - 1];
    // se reabre la misma capa (Ajustes vuelve a Pausa): se conserva su activador original
    if (!top || top.id !== id) ovPila.push({ id: id, act: (act && act !== document.body && !ov.contains(act)) ? act : null, actId: act && act.id });
    $$('.ov').forEach(function (o) { o.classList.toggle('on', o.id === 'ov-' + id); });
    ovAbierto = id; sfx('panel');
    nombrarDialogo(ov); fondoInerte();
    setTimeout(function () {
      if (ovAbierto !== id || ov.contains(document.activeElement)) return;
      var f = $('[data-foco]', ov) || $('.btn.pri', ov) || $('button', ov) || ov;
      if (f === ov) ov.tabIndex = -1;
      f.focus({ preventScroll: true });
    }, 40);
  }
  function cerrarOv() {
    if (!ovAbierto) return;
    var e = ovPila.pop();
    $$('.ov').forEach(function (o) { o.classList.remove('on'); }); ovAbierto = null; sfx('panel');
    fondoInerte();
    // el foco vuelve al activador en el siguiente tick: quien cierra puede reabrir otra capa (Ajustes → Pausa)
    setTimeout(function () {
      if (!e) return;
      if (ovAbierto) { var b = e.actId && $('#' + e.actId); if (b && visibleEl(b) && $('#ov-' + ovAbierto).contains(b)) b.focus({ preventScroll: true }); return; }
      var dest = (e.act && visibleEl(e.act)) ? e.act : (e.actId && visibleEl($('#' + e.actId)) ? $('#' + e.actId) : null);
      if (dest) dest.focus({ preventScroll: true });
      else if (pantalla) { var f = $('#s-' + pantalla + ' .btn.pri, #s-' + pantalla + ' button'); if (f && visibleEl(f)) f.focus({ preventScroll: true }); }
    }, 0);
  }
  // Tab y Shift+Tab recorren sólo la capa superior (aria-modal no reemplaza el control de foco)
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var capa = ovAbierto ? $('#ov-' + ovAbierto) : ($('#sheet').classList.contains('on') ? $('#sheet') : null);
    if (!capa) return;
    var f = focusables(capa);
    if (!f.length) { e.preventDefault(); return; }
    var first = f[0], last = f[f.length - 1], act = document.activeElement;
    if (e.shiftKey && (act === first || !capa.contains(act))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (act === last || !capa.contains(act))) { e.preventDefault(); first.focus(); }
  }, true);
  // confirmación explícita y cancelable (SRC-G04): Cancelar con el foco inicial, botón peligro aparte
  function confirmar(o) {
    var ov = $('#ov-confirm');
    ov.innerHTML = '<div class="card"><h2 style="font-size:20px;font-weight:700">' + esc(o.titulo) + '</h2><p class="muted" style="margin:10px 0 16px;font-size:14.5px;line-height:1.45">' + esc(o.texto) + '</p>' +
      '<div class="row2"><button class="btn" id="cfNo" type="button" data-foco>' + esc(t('cancel')) + '</button><button class="btn red" id="cfSi" type="button">' + esc(o.boton) + '</button></div></div>';
    abrirOv('confirm');
    $('#cfNo').onclick = function () { sfx('boton'); cerrarOv(); if (o.cancelar) o.cancelar(); };
    $('#cfSi').onclick = function () { sfx('boton'); cerrarOv(); o.ok(); };
  }
  function toast(msg, ms) { var el = $('#toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toast.tm); toast.tm = setTimeout(function () { el.classList.remove('on'); }, ms || 2200); }
  function anunciar(msg) { var a = $('#aria'); a.textContent = ''; setTimeout(function () { a.textContent = msg; }, 30); }

  /* ================= Inicio ================= */
  function renderInicio() {
    syncDiario();
    var p = partidaGuardada(), prim, primSub = '';
    if (p) { var c0 = NUCLEO.reproducir(NUCLEO.generarCaso(CASOS.porId[p.desc.tpl], p.desc.s, p.desc.a), p.acc); prim = t('continueCase', { c: p.desc.modo === 'diario' ? '#' + p.desc.num : (p.desc.modo === 'campana' ? (p.desc.id === 'F' ? t('finalCase') : p.desc.id) : '') }).replace(/\s+$/, ''); primSub = t('continueAir', { a: Math.max(0, c0.aire) }); }
    else if (!PR.jugado) prim = t('start');
    else { var nx = siguienteId(); prim = t('campaignNext'); primSub = t('caseN', { c: nx === 'F' ? t('finalCase') : nx }); }
    var dnum = NUCLEO.numeroDiario(hoy()), lockD = !PR.tut3 && !DI.empezado && !DI.ultimo, r = rachaVis();
    var dTag = DI.terminado ? '<span class="tg">✓ ' + esc(t('dailyDoneShort')) + '</span>' : '<span class="tg pend">● ' + esc(DI.empezado ? t('resume') : t('dailyPending')) + '</span>';
    var html = '<div class="ini"><div class="hero">' +
      '<div class="kick">' + esc(L === 'es' ? 'Thriller de cabina' : 'Cockpit thriller') + '</div>' +
      '<h1 class="logo" style="margin-top:10px">JET<i>//</i>' + esc(t('title').split('//')[1]) + '</h1>' +
      '<p class="sub">' + esc(t('tagline')) + '</p></div>' +
      '<div class="menu">' +
      '<button class="btn pri big" id="iPri" type="button">' + esc(prim) + (primSub ? '<small>' + esc(primSub) + '</small>' : '') + '</button>' +
      '<button class="btn dailyb' + (lockD ? ' lock' : '') + '" id="iDia" type="button"><span class="l"><span>' + esc(t('daily', { n: dnum })) + '</span>' + (lockD ? '<span class="lockt">🔒 ' + esc(t('lockedDaily')) + '</span>' : '') + '</span><span class="r">' + (lockD ? '' : dTag + (r ? '<span class="tg pend">🔥 ' + r + '</span>' : '')) + '</span></button>' +
      '<div class="row2"><button class="btn' + (lockD ? ' lock' : '') + '" id="iPra" type="button">' + esc(t('practice')) + (lockD ? ' 🔒' : '') + '</button><button class="btn" id="iMap" type="button">' + esc(t('map')) + '</button></div>' +
      '<div class="row2"><button class="btn" id="iHow" type="button">' + esc(t('how')) + '</button><button class="btn" id="iSet" type="button">' + esc(t('settings')) + '</button></div>' +
      '</div>' +
      '<div class="prog"><span><b>★</b> ' + estrellasTot() + ' / 147</span><span>' + esc(t('chapter', { n: capActual() })) + '</span></div>' +
      segIdioma('iEs', 'iEn', 'langini') +
      '</div>';
    $('#s-inicio').innerHTML = html;
    $('#iPri').onclick = function () { sfx('boton'); if (p) reanudar(p); else if (!PR.jugado) iniciarBrief(descCampana('1-1')); else iniciarBrief(descCampana(siguienteId())); };
    $('#iDia').onclick = function () { if (lockD) { sfx('error'); toast(t('lockedDaily')); return; } sfx('boton'); abrirDiario(); };
    $('#iPra').onclick = function () { if (lockD) { sfx('error'); toast(t('lockedPractice')); return; } sfx('boton'); renderPractica(); mostrar('practica'); };
    $('#iMap').onclick = function () { sfx('boton'); renderMapa(); mostrar('mapa'); };
    $('#iHow').onclick = function () { sfx('boton'); abrirComo(); };
    $('#iSet').onclick = function () { sfx('boton'); abrirAjustes(null); };
    $('#iEs').onclick = function () { cambiarIdioma('es'); }; $('#iEn').onclick = function () { cambiarIdioma('en'); };
  }
  /* Selector ES | EN común a todo jetgames.fun: el mismo en el inicio y en Ajustes. */
  function segIdioma(idEs, idEn, cls) {
    return '<div class="seg' + (cls ? ' ' + cls : '') + '" role="group" aria-label="' + esc(t('language')) + '"><button type="button" id="' + idEs + '" lang="es" aria-pressed="' + (L === 'es') + '" aria-label="Español">ES</button><button type="button" id="' + idEn + '" lang="en" aria-pressed="' + (L === 'en') + '" aria-label="English">EN</button></div>';
  }

  /* ================= Mapa ================= */
  function renderMapa() {
    var cur = siguienteId(), html = '<div class="mapa"><div class="cab"><h2>' + esc(t('mapTitle')) + '</h2><span class="st">★ ' + esc(t('mapSub', { s: estrellasTot(), t: 147 })) + '</span>';
    var va = vetAbierto();
    html += '<div class="vetsw"><span>' + esc(t('veteran')) + '<small>' + esc(va ? t('veteranDesc') : t('veteranLocked')) + '</small></span><button class="tog" id="mVet" role="switch" aria-checked="' + (va && PR.vet) + '" aria-label="' + esc(t('veteran')) + '"' + (va ? '' : ' disabled') + '></button></div>';
    html += '<button class="btn" id="mHome" type="button" style="width:auto;min-height:44px;margin:0">' + esc(t('home')) + '</button></div><div class="ruta">';
    for (var c = 1; c <= 9; c++) {
      var ab = capAbierto(c), lista = c === 9 ? [CASOS.porId.F] : CASOS.capitulo(c);
      html += '<div class="est' + (ab ? '' : ' lock') + (c === 9 ? ' fin' : '') + '"><h3><span>' + (c === 9 ? 'FINAL' : (L === 'es' ? 'CAP ' : 'CH ') + c) + '</span>' + esc(t('caps')[c - 1]) + '</h3>';
      // PLAY-TELEMETRIA-06: requisito legible, con la cantidad real de la regla de apertura
      if (!ab) html += '<div class="lk">🔒 ' + esc(t(c === 9 ? 'lockedFinal' : 'locked', { cantidad: GANAR_PARA_ABRIR })) + '</div>';
      html += '<div class="casos">';
      lista.forEach(function (x) {
        var e = (PR.vet && va ? PR.estV[x.id] : PR.est[x.id]) || 0, st = '';
        for (var k = 0; k < 3; k++) st += k < e ? '<b>★</b>' : '★';
        html += '<button class="cb' + (x.id === cur ? ' cur' : '') + '" type="button" data-id="' + x.id + '"' + (ab ? '' : ' disabled') + ' aria-label="' + esc(t('caseN', { c: x.id === 'F' ? t('finalCase') : x.id })) + ', ' + esc(t('earnedStars', { estrellas: e })) + '">' + (x.id === 'F' ? esc(t('finalCase')) : x.n) + '<span class="s" aria-hidden="true">' + st + '</span></button>';
      });
      html += '</div></div>';
    }
    html += '</div><div class="tierra"><canvas id="mTierra" width="112" height="112"></canvas><span>' + esc(L === 'es' ? 'TIERRA' : 'EARTH') + ' · ' + pct(progresoRuta()) + '</span></div></div>';
    $('#s-mapa').innerHTML = html;
    $$('#s-mapa .cb').forEach(function (b) { b.onclick = function () { sfx('boton'); iniciarBrief(descCampana(b.getAttribute('data-id'))); }; });
    $('#mHome').onclick = function () { sfx('boton'); renderInicio(); mostrar('inicio'); };
    var mv = $('#mVet'); if (mv) mv.onclick = function () { if (!va) return; PR.vet = !PR.vet; guardarPR(); sfx('sel'); renderMapa(); };
    var tc = $('#mTierra'); if (tc) { var cx = tc.getContext('2d'); CABINA.dibujarTierra(cx, 56, 56, 30, 0); }
  }

  /* ================= Práctica ================= */
  function renderPractica() {
    var html = '<div class="card"><div class="top"><h2>' + esc(t('practiceTitle')) + '</h2><button class="x" id="pX" type="button" aria-label="' + esc(t('close')) + '">×</button></div><p class="muted" style="font-size:14px">' + esc(t('practiceDesc')) + '</p><div class="plist">';
    var hay = false;
    for (var c = 1; c <= 8; c++) if (capAbierto(c)) { hay = true; html += '<button class="btn" type="button" data-c="' + c + '"><span>' + esc(t('chapter', { n: c })) + ' · ' + esc(t('caps')[c - 1]) + '</span><small>›</small></button>'; }
    if (!hay) html += '<p class="vacio">' + esc(t('practiceEmpty')) + '</p>';
    html += '</div></div>';
    $('#s-practica').innerHTML = html;
    $('#pX').onclick = function () { sfx('boton'); renderInicio(); mostrar('inicio'); };
    $$('#s-practica [data-c]').forEach(function (b) { b.onclick = function () { sfx('boton'); iniciarBrief(descPractica(+b.getAttribute('data-c'))); }; });
  }
  function descPractica(cap) {
    var pool = (CD.practica && CD.practica[cap]) || [], e;
    if (pool.length) e = pool[Math.floor(Math.random() * pool.length)];
    else { var tpls = CASOS.capitulo(cap).filter(function (x) { return !x.tut || x.tut === 3; }); var tp = tpls[Math.floor(Math.random() * tpls.length)]; e = [tp.id, (Math.random() * 4294967296) >>> 0, tp.aire]; }
    return { modo: 'practica', id: 'P', tpl: e[0], s: e[1], a: e[2], cap: cap };
  }

  /* ================= Caso diario ================= */
  function abrirDiario() {
    syncDiario();
    if (DI.terminado) { renderDiarioHecho(); abrirOv('diario'); return; }
    var d = descDiario(hoy()), acc = Array.isArray(DI.acc) ? DI.acc : null;
    if (!acc) { var pv = lget('partida', null); if (pv && pv.desc && pv.desc.modo === 'diario' && pv.desc.fecha === hoy() && Array.isArray(pv.acc)) { acc = pv.acc; DI.pista = !!pv.pista; ldel('partida'); } } // partidas de la versión anterior
    if (DI.empezado) { iniciarJuego(d, acc || [], { pista: DI.pista }); return; } // retoma con sus lecturas: un solo intento real
    iniciarBrief(d);
  }
  function cuentaAtras() {
    var n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1), s = Math.max(0, Math.floor((m - n) / 1000));
    var h = Math.floor(s / 3600), mi = Math.floor(s % 3600 / 60), se = s % 60;
    return (h < 10 ? '0' : '') + h + ':' + (mi < 10 ? '0' : '') + mi + ':' + (se < 10 ? '0' : '') + se;
  }
  function renderDiarioHecho() {
    var r = DI.res || {};
    var html = '<div class="card"><div class="top"><h2>' + esc(t('daily', { n: NUCLEO.numeroDiario(hoy()) })) + '</h2><button class="x" id="dX" type="button" aria-label="' + esc(t('close')) + '">×</button></div>' +
      '<p class="muted" style="font-size:14.5px">' + esc(t('dailyDone', { t: '' }).replace(/\s*$/, '')) + '</p><div class="cuenta" id="dCta">' + cuentaAtras() + '</div>' +
      '<div class="lineas"><div><span>' + esc(r.fin === 'win' ? t('win') : t('lose')) + '</span><b class="' + (r.fin === 'win' ? 'pos' : 'neg') + '">' + esc(t('air')) + ' ' + (r.aire || 0) + '/' + (r.aire0 || 0) + '</b></div>' +
      (r.prec != null ? '<div><span>' + esc(t('accuracy')) + '</span><b>' + r.prec + '/100</b></div>' : '') +
      '<div><span>' + esc(t('streak', { n: '' }).trim()) + '</span><b>🔥 ' + rachaVis() + '</b></div></div>' +
      '<div class="res-btns"><button class="btn pri" id="dSh" type="button">' + esc(t('share')) + '</button><button class="btn" id="dPr" type="button">' + esc(t('practiceThis')) + '</button></div></div>';
    $('#ov-diario').innerHTML = html;
    $('#dX').onclick = cerrarOv;
    $('#dSh').onclick = function () { compartir(r.texto || ''); };
    $('#dPr').onclick = function () { cerrarOv(); var d = descDiario(hoy()); d.modo = 'practica'; d.id = 'P'; iniciarBrief(d); };
    clearInterval(renderDiarioHecho.tm);
    renderDiarioHecho.tm = setInterval(function () { var el = $('#dCta'); if (!el || ovAbierto !== 'diario') { clearInterval(renderDiarioHecho.tm); return; } el.textContent = cuentaAtras(); if (DI.fecha !== hoy()) { clearInterval(renderDiarioHecho.tm); cerrarOv(); renderInicio(); } }, 1000);
  }

  /* ================= Briefing ================= */
  var brief = null;
  function iniciarBrief(desc) {
    if (brief) clearInterval(brief.tm);
    var tpl = CASOS.porId[desc.tpl], caso = NUCLEO.generarCaso(tpl, desc.s, desc.a);
    var head = desc.modo === 'diario' ? t('briefDaily', { n: desc.num }) : (desc.modo === 'campana' ? t('briefCase', { c: desc.id === 'F' ? t('finalCase').toUpperCase() : desc.id }) : t('briefPractice'));
    var segs = [];
    function add(cls, txt) { segs.push({ c: cls, t: txt }); }
    add('h', head + '\n');
    if (desc.modo === 'campana') add('k', t('chapter', { n: Math.min(tpl.cap, 8) }) + ' · ' + t('caps')[tpl.cap - 1] + '\n');
    if (desc.modo !== 'campana' && desc.modo !== 'diario') add('k', t('seed', { s: desc.s }) + '\n');
    add('', '\n' + t('symptom').toUpperCase() + ': '); add('w', t('sintomas')[caso.sintoma] + '\n');
    add('', t('faults', { n: caso.nF }) + '\n');
    add('', t('airStart').toUpperCase() + ': '); add('w', caso.aire0 + ' MIN\n');
    add('k', t('airRule') + '\n');
    // SRC-TE01: dos costes TOTALES alternativos (caso.R / caso.R + caso.Rx), nunca el error como «minutos adicionales»
    add('', t('repairCost').toUpperCase() + ': '); add('', t('repairCostBrief', { coste_acierto: caso.R, coste_error: caso.R + caso.Rx }) + '\n');
    add('', t('systems').toUpperCase() + ' (' + caso.N + '): '); add('k', caso.sis.map(function (s, q) { return nombreSis(caso, q); }).join(' · ') + '\n');
    if (caso.bitacora.length) { add('', '\n' + t('logbook').toUpperCase() + '\n'); caso.bitacora.forEach(function (b) { add('w', '· ' + t('logbookLine', { s: nombreSis(caso, b.i), n: b.veces }) + '\n'); }); }
    caso.sensores.forEach(function (s) { if (s.dudoso) add('w', '\n⚠ ' + t('doubtful', { s: nomSen(s.k) }) + '\n'); });
    var nuevo = tpl.nuevo && desc.modo === 'campana' ? '<div class="nuevo"><b>' + esc(t('newTag')) + '</b><span>' + esc(t('newBox')[tpl.nuevo]) + '</span></div>' : '';
    if (desc.luego === 'diario') nuevo = '<div class="nuevo"><b>' + esc(t('newTag')) + '</b><span>' + esc(t('express')) + '</span></div>' + nuevo;
    var sens = '<div class="brief-sens">' + caso.sensores.map(function (s) {
      var d = s.k === 'ALARMISTA' ? t('jumpy') : s.k === 'PRUDENTE' ? t('cautious') : s.k === 'ZONA' ? t('zoneDesc') + ' ' + t('reliab', { k: L === 'es' ? '8,5' : '8.5' }) + '.' : t('reliab', { k: Math.round(s.sens * 10) }) + '.';
      return '<div class="bsen"><b>' + esc(nomSen(s.k)) + (s.dudoso ? ' · <span style="color:var(--amb)">' + esc(t('doubtfulTag')) + '</span>' : '') + '</b><span class="c">' + s.coste + ' MIN</span><span class="d">' + esc(d) + '</span></div>';
    }).join('') + '</div>';
    $('#s-brief').innerHTML = '<div class="card"><div class="tele" id="tele" aria-live="off"></div>' + nuevo + sens +
      '<div class="res-btns"><button class="btn pri big" id="bEntrar" type="button">' + esc(t('enter')) + '</button><button class="btn" id="bVolver" type="button">' + esc(desc.modo === 'campana' ? t('map') : t('home')) + '</button></div></div>';
    var total = segs.reduce(function (a, s) { return a + s.t.length; }, 0);
    brief = { segs: segs, p: rmActivo() ? total : 0, total: total, desc: desc };
    pintarTele();
    var b0 = brief;
    b0.tm = setInterval(function () {
      if (brief !== b0 || pantalla !== 'brief') { clearInterval(b0.tm); return; }
      if (brief.p >= brief.total) { clearInterval(brief.tm); pintarTele(); return; }
      brief.p += 1; if (brief.p % 2 === 0) sfx('tecla'); pintarTele();
    }, 25);
    $('#tele').onclick = function () { if (brief) { brief.p = brief.total; pintarTele(); } };
    $('#bEntrar').onclick = function () { sfx('boton'); clearInterval(brief && brief.tm); iniciarJuego(desc, [], {}); };
    $('#bVolver').onclick = function () { sfx('boton'); clearInterval(brief && brief.tm); if (desc.modo === 'campana') { renderMapa(); mostrar('mapa'); } else { renderInicio(); mostrar('inicio'); } };
    mostrar('brief');
    var tl = $('#tele'); tl.setAttribute('aria-label', segs.map(function (s) { return s.t; }).join(' '));
  }
  function pintarTele() {
    if (!brief) return;
    var out = '', left = brief.p;
    for (var i = 0; i < brief.segs.length && left > 0; i++) { var s = brief.segs[i], tx = s.t.slice(0, left); left -= s.t.length; out += s.c ? '<span class="' + s.c + '">' + esc(tx) + '</span>' : esc(tx); }
    if (brief.p < brief.total) out += '<span class="cur"></span>';
    var el = $('#tele'); if (el) el.innerHTML = out;
  }

  /* ================= Partida ================= */
  var G = null;
  function iniciarJuego(desc, acc, extra) {
    var tpl = CASOS.porId[desc.tpl], caso = NUCLEO.generarCaso(tpl, desc.s, desc.a);
    var st = NUCLEO.reproducir(caso, acc || []);
    G = { desc: desc, tpl: tpl, caso: caso, st: st, sel: null, bloq: false, pista: !!extra.pista, tutStep: extra.tutStep || 0, oraLow: !!extra.oraLow,
      vet: desc.modo === 'campana' && PR.vet && vetAbierto(), an: {}, ini: null, quick: false, shown: null, geoKey: '', haz: null, onda: null, push: 0, luzOk: 0, hold: null, prevS: -1 };
    if (desc.modo === 'diario' && !DI.empezado) { DI.empezado = true; guardarDI(); }
    if (desc.modo === 'campana' && !(acc && acc.length)) { PR.int[desc.id] = ((PR.int[desc.id]) || 0) + 1; guardarPR(); }
    if (!PR.jugado) { PR.jugado = true; guardarPR(); }
    if (!LSOK && !iniciarJuego.avisado) { iniciarJuego.avisado = true; setTimeout(function () { toast(t('noSave'), 3500); }, 600); }
    G.ini = wCall({ cmd: 'inicio', tpl: desc.tpl, s: desc.s, a: desc.a });
    for (var k = 0; k < st.acciones.length; k++) analizarFondo(k);
    construirJuego();
    mostrar('juego');
    guardar();
    // copiloto al empezar
    var d = tutDef();
    if (d) oraDecir(t(d[Math.min(G.tutStep, d.length - 1)].say), { tut: true });
    else if (tpl.nuevo && desc.modo === 'campana' && !st.acciones.length) oraDecir(t('oraNew')[tpl.nuevo]);
    else ocultarOra();
    tutResaltar();
    if (st.fin) setTimeout(terminar, 300);
  }
  function reanudar(p) { iniciarJuego(p.desc, p.acc, p); }
  function accMin(st) { return st.acciones.map(function (a) { return a.t === 'L' ? { t: 'L', s: a.s, T: a.T } : { t: 'R', i: a.i }; }); }
  function guardar() {
    if (!G) return;
    if (G.desc.modo === 'diario') { if (G.desc.fecha === DI.fecha) { DI.acc = accMin(G.st); DI.pista = !!G.pista; guardarDI(); } return; }
    if (G.st.fin) return;
    lset('partida', { v: 1, desc: G.desc, acc: accMin(G.st), pista: G.pista, tutStep: G.tutStep, oraLow: G.oraLow, t: Date.now() });
  }

  function construirJuego() {
    var c = G.caso, st = G.st;
    G.geoKey = ''; // nodos nuevos: que el bucle los vuelva a colocar sobre la silueta (si no, quedan apilados arriba a la izquierda)
    $('#nodos').innerHTML = c.sis.map(function (s, q) { return '<button class="nodo" type="button" data-i="' + q + '" aria-label="' + esc(nombreSis(c, q)) + '"><i class="halo"></i>' + svg(s.k) + '</button>'; }).join('');
    var zs = $('#zonas'); zs.hidden = !c.hayZonas;
    zs.innerHTML = c.hayZonas ? [2, 1, 0].filter(function (z) { return c.zonas[z]; }).map(function (z) { return '<button class="zb" type="button" data-z="' + z + '">' + esc(t('zones')[z]) + '<span class="chips"></span></button>'; }).join('') : '';
    // PLAY-TELEMETRIA-07: selección exclusiva como radiogroup (un solo sistema anunciado como seleccionado)
    $('#filas').innerHTML = c.sis.map(function (s, q) {
      return '<div class="fila" role="radio" aria-checked="false" tabindex="0" data-i="' + q + '"><span class="ico">' + svg(s.k) + '</span><span class="nom"><span class="nt">' + esc(nombreSis(c, q)) + '</span></span>' +
        '<span class="barra"><i class="gh"></i><i class="f"></i><i class="pv a"></i><i class="pv n"></i></span><span class="st" hidden></span><span class="chips"></span><span class="pct"></span><span class="lamp"></span></div>';
    }).join('');
    $('#sensores').innerHTML = st.sens.map(function (s, q) {
      var k = c.sensores[q].k;
      return '<button class="sen" type="button" data-s="' + q + '"><span class="n"><span>' + esc(t('senShort')[k]) + '</span><i>' + s.coste + ' MIN</i></span><span class="dw"></span><span class="d"></span></button>';
    }).join('');
    $('#filas').setAttribute('role', 'radiogroup'); $('#filas').setAttribute('aria-label', t('selectSystem'));
    G.shown = NUCLEO.marginales(st);
    $('#bPista').classList.toggle('used', G.pista);
    document.body.classList.toggle('vet', G.vet);
    var tpl = G.tpl;
    $('#bPista').hidden = !!(tpl.tut === 1 || tpl.tut === 2);
    pintar(false);
    renderLog();
  }
  function dots(x, cls, lb) {
    var n = x * 10, h = '<span class="dots' + (cls ? ' ' + cls : '') + '">' + (lb ? '<span class="lb">' + lb + '</span>' : '');
    for (var i = 0; i < 10; i++) h += '<u class="' + (n >= i + 1 - 1e-9 ? 'on' : (n > i + 0.25 ? 'half' : '')) + '"></u>';
    return h + '</span>';
  }
  function aplicaSensor(s, sel) { if (!sel) return false; var tp = G.st.sens[s].tipo; return tp === 'z' ? sel.T >= 100 : sel.T < 100; }

  function pintar(anim) {
    if (!G) return;
    var st = G.st, c = G.caso, m = NUCLEO.marginales(st), cand = NUCLEO.candidatos(st), top = -1, tv = -1, i;
    for (i = 0; i < c.N; i++) if (((cand >> i) & 1) && m[i] > tv) { tv = m[i]; top = i; }
    var lect = st.acciones.filter(function (a) { return a.t === 'L'; });
    var zSel = G.sel && G.sel.T >= 100 ? G.sel.T - 100 : -1;
    $$('#filas .fila').forEach(function (f) {
      var q = +f.getAttribute('data-i'), rep = (st.rep >> q) & 1, desc = (st.desc >> q) & 1, v = m[q];
      f.classList.toggle('rep', !!rep); f.classList.toggle('desc', !!desc);
      f.classList.toggle('sel', !!(G.sel && G.sel.T === q));
      f.classList.toggle('zon', zSel >= 0 && c.sis[q].zona === zSel);
      f.classList.toggle('top', q === top && tv >= 0.5 && !rep);
      var bar = $('.barra', f), fi = $('.f', bar), gh = $('.gh', bar), stEl = $('.st', f);
      bar.hidden = !!(rep || desc); stEl.hidden = !(rep || desc);
      stEl.textContent = rep ? '✓ ' + t('repaired') : desc ? '✕ ' + t('discarded') : '';
      var old = G.shown ? G.shown[q] : v;
      if (anim && Math.abs(old - v) > 0.004 && !rmActivo()) {
        gh.style.transition = 'none'; gh.style.width = (old * 100) + '%'; gh.style.opacity = '1';
        void gh.offsetWidth; gh.style.transition = '';
        setTimeout(function () { gh.style.opacity = '0'; }, 350); // VIS-TELEMETRIA-02: fantasma anterior de 350 ms
        if (v - old > 0.25) { fi.classList.remove('flash'); void fi.offsetWidth; fi.classList.add('flash'); }
      }
      fi.style.width = (v * 100).toFixed(2) + '%';
      var nom = $('.nom', f), em = $('em', nom);
      // VIS-TELEMETRIA-01: el estado «top» (ya expuesto por la barra ámbar) se rotula «Mayor probabilidad»; PROBABLE queda para >= 80 % sin ser el máximo
      var esTop = q === top && tv >= 0.5 && !rep, lik = esTop || (v >= 0.8 && !rep && !desc);
      var emTxt = esTop ? t('highestProb') : t('likely');
      if (lik && !em) { nom.insertAdjacentHTML('beforeend', '<em>' + esc(emTxt) + '</em>'); em = $('em', nom); }
      if (!lik && em) { em.remove(); em = null; }
      if (em && em.textContent !== emTxt) em.textContent = emTxt;
      if (!!lik !== !!em || (em && em.dataset.t !== emTxt)) { if (em) em.dataset.t = emTxt; ajustarProbable(f); }
      $('.pct', f).textContent = (rep || desc) ? '' : pct(v);
      var mis = lect.filter(function (a) { return a.T === q; }), n = G.vet ? 6 : 3;
      var ch = $('.chips', f), html = mis.slice(-n).map(function (a, k, arr) { return '<span class="chip ' + a.o + (anim && k === arr.length - 1 && a === lect[lect.length - 1] ? ' nw' : '') + '">' + (a.o === 'A' ? '▲' : '○') + '</span>'; }).join('');
      if (ch.innerHTML !== html) ch.innerHTML = html;
      // PLAY-TELEMETRIA-01: probabilidad acumulada (según las lecturas) separada de la última lectura; en Veterano no se anuncia la probabilidad oculta
      var ult = mis.length ? mis[mis.length - 1] : null;
      var estadoTxt = rep ? t('repaired') : desc ? t('discarded') : (G.vet ? '' : t('readingProb', { porcentaje: Math.round(v * 100) }) + (esTop ? '. ' + t('highestProb') : ''));
      f.setAttribute('aria-label', nombreSis(c, q) + (estadoTxt ? '. ' + estadoTxt : '') + (ult ? '. ' + t('lastReading', { resultado: ult.o === 'A' ? t('alert') : t('normal') }) : ''));
      f.setAttribute('aria-checked', !!(G.sel && G.sel.T === q));
    });
    G.shown = m.slice();
    $$('#nodos .nodo').forEach(function (b) {
      var q = +b.getAttribute('data-i'), rep = (st.rep >> q) & 1, desc = (st.desc >> q) & 1;
      b.classList.toggle('sel', !!(G.sel && G.sel.T === q)); b.classList.toggle('rep', !!rep); b.classList.toggle('desc', !!desc);
      b.classList.toggle('top', q === top && tv >= 0.5 && !rep);
      b.setAttribute('aria-pressed', !!(G.sel && G.sel.T === q));
      $('.halo', b).style.setProperty('--s', (rep || desc) ? 0 : (m[q] * 0.85).toFixed(3));
    });
    $$('#zonas .zb').forEach(function (b) {
      var z = +b.getAttribute('data-z'); b.classList.toggle('sel', zSel === z);
      var mis = lect.filter(function (a) { return a.T === 100 + z; }).slice(-3);
      var html = mis.map(function (a) { return '<span class="chip ' + a.o + '">' + (a.o === 'A' ? '▲' : '○') + '</span>'; }).join('');
      var ch = $('.chips', b); if (ch.innerHTML !== html) ch.innerHTML = html;
      b.setAttribute('aria-pressed', zSel === z);
    });
    // aire
    var fr = Math.max(0, st.aire) / c.aire0, ga = $('#gAire');
    ga.classList.toggle('mid', fr < 0.4 && fr >= 0.2); ga.classList.toggle('low', fr < 0.2);
    $('#aireBar .f').style.width = (Math.min(1, fr) * 100).toFixed(1) + '%';
    $('#aireBar').setAttribute('aria-valuenow', Math.max(0, st.aire)); $('#aireBar').setAttribute('aria-valuemax', c.aire0);
    $('#aireBar').setAttribute('aria-label', t('air') + ' ' + Math.max(0, st.aire) + ' ' + t('minShort'));
    if (!G.tk) $('#aireV').textContent = Math.max(0, st.aire);
    // sensores
    $$('#sensores .sen').forEach(function (b) {
      var q = +b.getAttribute('data-s'), s = st.sens[q], k = c.sensores[q].k, ok = aplicaSensor(q, G.sel);
      b.classList.toggle('ok', ok && !st.fin); b.classList.toggle('na', !!G.sel && !ok);
      b.classList.toggle('cara', s.coste >= st.aire); b.classList.toggle('danado', !!s.danado);
      var dw = $('.dw', b), html = '';
      if (s.sens !== s.espec) html = dots(s.sens, 'a', '▲') + dots(s.espec, '', '○');
      else html = dots(s.sens, '', '');
      if (s.danado) html += '<span class="tag">' + esc(t('damagedTag')) + '</span>';
      if (s.dudoso) { var cf = NUCLEO.confianzaSensor(st); html += '<span class="tag dud">' + esc(t('doubtfulTag')) + '</span><span class="trust" title="' + esc(t('trust')) + '"><i style="width:' + (cf * 100).toFixed(0) + '%"></i></span>'; }
      if (dw.innerHTML !== html) dw.innerHTML = html;
      var d = k === 'ALARMISTA' ? t('jumpy') : k === 'PRUDENTE' ? t('cautious') : k === 'ZONA' ? t('zoneDesc') : t('reliab', { k: Math.round(s.sens * 10) });
      $('.d', b).textContent = d;
      // SRC-TE01: coste del sensor vigente y motivo real de deshabilitación (sin revelar la avería)
      b.setAttribute('aria-label', nomSen(k) + '. ' + t('measure', { c: s.coste }) + '. ' + d + (s.danado ? ' ' + t('damagedTag') : '') + (s.coste >= st.aire ? '. ' + t('insufficient') : (G.sel && !ok ? '. ' + (s.tipo === 'z' ? t('sensorWrongZone') : t('sensorWrongPoint')) : '')));
    });
    // objetivo seleccionado (PLAY-TELEMETRIA-02)
    var selInfo = $('#selInfo');
    var selTxt = !G.sel ? t('selectSystem') : G.sel.T >= 100 ? t('selectedTarget', { objetivo: t('zoneNames')[G.sel.T - 100] }) : t('selectedSystem', { sistema: nombreSis(c, G.sel.T) });
    if (selInfo.textContent !== selTxt) selInfo.textContent = selTxt;
    selInfo.classList.toggle('vacio2', !G.sel);
    // reparar — PLAY-TELEMETRIA-03/04 · SRC-TE01: los dos costes TOTALES alternativos (acierto = caso.R; error = caso.R + caso.Rx, se resta una sola vez)
    // y los dos saldos hipotéticos, calculados sólo con el aire visible y los costes del caso: nunca se consulta st.real.
    var selSis = G.sel && G.sel.T < 100 ? G.sel.T : -1, valido = selSis >= 0 && ((cand >> selSis) & 1);
    var costeOk = c.R, costeErr = c.R + c.Rx, aireOk = Math.max(0, st.aire - costeOk), aireErr = Math.max(0, st.aire - costeErr);
    var riesgo = valido && st.aire <= costeOk; // cualquier rama pública agota el aire
    var bR = $('#bRep');
    bR.classList.toggle('off', !valido); bR.classList.toggle('warn', riesgo);
    var repL = esc(valido ? t('repairTarget', { sistema: nombreSis(c, selSis) }) : t('repair'));
    var repS = !valido ? esc(t('pickRepair')) : G.armado ? esc(t('repairDouble')) : esc(P.dbl ? t('repairDouble') : t('holdConfirm'));
    if ($('#repL').innerHTML !== repL) $('#repL').innerHTML = repL;
    if ($('#repS').innerHTML !== repS) $('#repS').innerHTML = repS;
    var repInfo = $('#repInfo'), infoTxt = '', infoHtml = '';
    if (valido && !st.fin) {
      var tC = t('repairCosts', { coste_acierto: costeOk, coste_error: costeErr }), tS = t('airScenarios', { aire_final_acierto: aireOk, aire_final_error: aireErr }) + (riesgo ? ' ' + t('airRiskEven') : '');
      infoTxt = tC + ' ' + tS;
      // en teléfonos verticales bajos la segunda frase se oculta visualmente (CSS .ri-s); el nombre accesible de Reparar la conserva íntegra
      infoHtml = '<span class="ri-c">' + esc(tC) + '</span> <span class="ri-s">' + esc(tS) + '</span>';
    }
    repInfo.hidden = !infoTxt; repInfo.classList.toggle('riesgo', riesgo);
    if (repInfo.dataset.txt !== infoTxt) { repInfo.dataset.txt = infoTxt; repInfo.innerHTML = infoHtml; }
    bR.setAttribute('aria-label', (valido ? t('repairTarget', { sistema: nombreSis(c, selSis) }) : t('repair')) + '. ' + (valido ? infoTxt + ' ' : '') + $('#repS').textContent);
    // información de la nave
    var nRep = NUCLEO.bitcount(st.rep);
    $('#naveInfo').innerHTML = c.nF === 2 ? esc(t('faultsLeft', { n: 2, r: nRep })) : esc(t('faults', { n: 1 }));
    // música y luz
    var maxM = tv < 0 ? 0 : tv;
    MUSICA.capas({ pulso: st.acciones.length > 0 ? 1 : 0, arpegio: maxM, peligro: fr < 0.3 ? 1 : 0 });
    MUSICA.respirar(fr < 0.2 && !st.fin && pantalla === 'juego');
  }
  /* si el nombre del sistema no entra junto a la etiqueta PROBABLE, la etiqueta pasa a ser un punto ámbar: el nombre nunca se corta por ella */
  function ajustarProbable(f) {
    var n = $('.nom', f), nt = n && $('.nt', n); if (!nt) return;
    n.classList.remove('dot');
    if ($('em', n) && nt.scrollWidth > nt.clientWidth + 1) n.classList.add('dot');
  }
  function lampara(T, o) {
    var objetivos = T >= 100 ? G.caso.sis.map(function (s, q) { return s.zona === T - 100 ? q : -1; }).filter(function (q) { return q >= 0; }) : [T];
    objetivos.forEach(function (q) {
      var f = $('#filas .fila[data-i="' + q + '"]'), l = f && $('.lamp', f);
      if (l) { l.className = 'lamp ' + o; l.textContent = o === 'A' ? '▲ ' + t('alert') : '○ ' + t('normal'); void l.offsetWidth; l.classList.add('on'); setTimeout(function () { l.classList.remove('on'); }, 1000); }
      var n = $('#nodos .nodo[data-i="' + q + '"]'); if (n) { n.classList.add('lamp-' + o); setTimeout(function () { n.classList.remove('lamp-' + o); }, 1100); }
    });
    if (T >= 100) { var zb = $('#zonas .zb[data-z="' + (T - 100) + '"]'); if (zb) { zb.classList.add('tiembla'); setTimeout(function () { zb.classList.remove('tiembla'); }, 340); } }
    if (T < 100) { var fl = $('#filas .fila[data-i="' + T + '"]'); if (fl && fl.scrollIntoView) fl.scrollIntoView({ block: 'nearest', behavior: rmActivo() ? 'auto' : 'smooth' }); }
  }
  function tickAire(desde, hasta) {
    var n = Math.max(0, Math.round(desde - hasta));
    sfx('tic', n);
    var el = $('#aireV'), gh = $('#aireBar .gh'), c = G.caso;
    gh.style.transition = 'none'; gh.style.width = (Math.max(0, desde) / c.aire0 * 100) + '%'; gh.style.opacity = '1'; void gh.offsetWidth; gh.style.transition = '';
    setTimeout(function () { gh.style.opacity = '0'; }, 450);
    clearInterval(G.tk); G.tk = null;
    if (rmActivo() || n === 0) { el.textContent = Math.max(0, hasta); return; }
    var v = desde;
    G.tk = setInterval(function () { v--; if (v <= hasta) { v = hasta; clearInterval(G.tk); G.tk = null; } el.textContent = Math.max(0, v); }, 30);
  }
  function tiembla(el) { if (!el) return; el.classList.remove('tiembla'); void el.offsetWidth; el.classList.add('tiembla'); setTimeout(function () { el.classList.remove('tiembla'); }, 340); }

  /* ---------- Acciones del jugador ---------- */
  function seleccionar(T) {
    if (!G || G.bloq || G.st.fin) return;
    var d = tutDef(), libre = !d || d[Math.min(G.tutStep, d.length - 1)].libre;
    if (G.sel && G.sel.T === T) {
      if (!libre) return;
      G.sel = null; sfx('desel');
    } else {
      if (!tutPermite({ k: 'sel', T: T })) return;
      G.sel = { T: T }; sfx(T >= 100 ? 'zona' : 'sel'); vib(8);
      tutAvanzar({ k: 'sel', T: T });
    }
    limpiarPrev(); pintar(false); tutResaltar();
  }
  function leer(s) {
    if (!G || G.bloq || G.st.fin) return;
    var sen = G.st.sens[s], el = $('#sensores .sen[data-s="' + s + '"]');
    if (!sen) return;
    if (!G.sel) { tiembla(el); sfx('error'); avisoBreve(sen.tipo === 'z' ? t('pickZone') : t('chooseTarget')); return; }
    var T = G.sel.T;
    if (sen.tipo === 'z' && T < 100) { tiembla(el); sfx('error'); avisoBreve(t('sensorWrongZone')); return; }
    if (sen.tipo === 'p' && T >= 100) { tiembla(el); sfx('error'); avisoBreve(t('sensorWrongPoint')); return; }
    if (!tutPermite({ k: 'read', s: s, T: T })) return;
    limpiarPrev();
    var aire0 = G.st.aire, rec = NUCLEO.aplicar(G.st, { t: 'L', s: s, T: T });
    if (!rec) return;
    guardar(); analizarFondo(G.st.acciones.length - 1);
    G.bloq = true; sfx('scan'); vib(15); G.haz = { t0: tNow, T: T }; G.push = 1;
    var g = G;
    setTimeout(function () {
      if (G !== g) return;
      lampara(T, rec.o); sfx(rec.o === 'A' ? 'alerta' : 'normal'); if (rec.o === 'A') vib(30);
      var prev = G.shown.slice(); pintar(true);
      var dm = 0; G.shown.forEach(function (v, q) { dm = Math.max(dm, Math.abs(v - prev[q])); });
      setTimeout(function () { sfx('bars', dm); }, 60);
      tickAire(aire0, G.st.aire); renderLog();
      var m = NUCLEO.marginales(G.st);
      anunciar(t(T < 100 ? 'ariaRead' : 'ariaReadZone', { x: nomSen(G.caso.sensores[s].k), s: nombreObj(G.caso, T), o: rec.o === 'A' ? t('alert') : t('normal'), p: T < 100 ? pct(m[T]) : '' }));
    }, 250);
    setTimeout(function () {
      if (G !== g) return;
      G.bloq = false; G.push = 0;
      if (rec.danio != null) eventoDanio(rec.danio);
      else if (!tutAvanzar({ k: 'read', s: s, T: T }) && (G.oraTipo === 'aviso' || G.oraTipo === 'baja')) ocultarOra();
      comprobarFin();
    }, 620);
  }
  function eventoDanio(s) {
    var el = $('#sensores .sen[data-s="' + s + '"]');
    if (el) { el.classList.remove('chispa'); void el.offsetWidth; el.classList.add('chispa'); }
    sfx('danio'); vib([40, 30, 40]);
    oraDecir(t('damaged', { s: nomSen(G.caso.sensores[s].k) }), { ev: true });
    pintar(false);
  }
  function reparar(i) {
    if (!G || G.bloq || G.st.fin) return;
    var c = G.caso, st = G.st;
    if (!NUCLEO.reparacionValida(st, i)) return;
    if (!tutPermite({ k: 'rep', i: i })) return;
    var m = NUCLEO.marginales(st);
    if (!G.tpl.tut && P.ora && !G.oraLow && m[i] < 0.2) { G.oraLow = true; guardar(); oraDecir(t('oraLow', { s: nombreSis(c, i) }), { tipo: 'baja' }); return; }
    var aire0 = st.aire, rec = NUCLEO.aplicar(st, { t: 'R', i: i });
    if (!rec) return;
    guardar(); analizarFondo(st.acciones.length - 1); if (G.oraTipo === 'baja') ocultarOra();
    G.bloq = true; G.onda = { t0: tNow, q: i, ok: rec.ok };
    var fl = $('#flash');
    if (rec.ok) { sfx('ok'); vib(25); fl.className = 'okf'; G.luzOk = tNow; anunciar(t('ariaRepairOk', { s: nombreSis(c, i) })); }
    else {
      sfx('ko'); vib([60, 40, 60]); fl.className = 'on';
      if (!rmActivo()) { var j = $('#s-juego'); j.classList.remove('sacude'); void j.offsetWidth; j.classList.add('sacude'); }
      anunciar(t('ariaRepairKo', { s: nombreSis(c, i), d: rec.c }));
    }
    requestAnimationFrame(function () { requestAnimationFrame(function () { fl.className = ''; }); });
    if (G.sel && G.sel.T === i) G.sel = null;
    pintar(true); tickAire(aire0, st.aire); renderLog(); tutAvanzar({ k: 'rep', i: i });
    var g = G;
    setTimeout(function () { if (G !== g) return; G.bloq = false; $('#s-juego').classList.remove('sacude'); comprobarFin(); }, 700);
  }
  function comprobarFin() { if (G && G.st.fin && !G.terminado) { G.terminado = true; G.bloq = true; setTimeout(terminar, 450); } }

  /* ---------- Mantener para reparar ---------- */
  var HOLD = 700;
  function puedeReparar() {
    if (!G || G.bloq || G.st.fin) return -1;
    if (!G.sel || G.sel.T >= 100) return -1;
    return NUCLEO.reparacionValida(G.st, G.sel.T) ? G.sel.T : -1;
  }
  function inicioMantener() {
    if (G && G.hold) return;
    var i = puedeReparar();
    if (i < 0) { if (G && !G.bloq && !G.st.fin) { tiembla($('#bRep')); sfx('error'); avisoBreve(t('pickRepair')); } return; }
    if (P.dbl) {
      if (G.armado && performance.now() - G.armado < 1500) { G.armado = 0; reparar(i); return; }
      G.armado = performance.now(); sfx('sel'); pintar(false);
      setTimeout(function () { if (G && G.armado && performance.now() - G.armado >= 1500) { G.armado = 0; pintar(false); } }, 1600);
      return;
    }
    G.hold = { t0: performance.now(), i: i, snd: sfx('mantener') };
    $('#bRep').classList.add('hold');
    MUSICA.capas({ decision: 1 });
    var fg = $('#bRep .fg'), fh = $('#bRep .fillh');
    (function paso() {
      if (!G || !G.hold) return;
      var p = Math.min(1, (performance.now() - G.hold.t0) / HOLD);
      fg.style.strokeDashoffset = (94.25 * (1 - p)).toFixed(2); fh.style.transform = 'scaleX(' + p.toFixed(3) + ')';
      if (p >= 1) { finMantener(true); return; }
      G.hold.raf = requestAnimationFrame(paso);
    })();
  }
  function finMantener(completo) {
    if (!G || !G.hold) return;
    var h = G.hold; G.hold = null;
    cancelAnimationFrame(h.raf);
    $('#bRep').classList.remove('hold');
    if (!completo && performance.now() - h.t0 < HOLD * 0.6 && !G.st.fin) { avisoBreve(t('repairHoldTip')); vib(8); }
    if (h.snd) h.snd.stop();
    MUSICA.capas({ decision: 0 });
    $('#bRep .fg').style.strokeDashoffset = '94.25'; $('#bRep .fillh').style.transform = 'scaleX(0)';
    if (completo) reparar(h.i);
  }

  /* ---------- Vista previa de una lectura ---------- */
  function previsualizar(s) {
    if (!G || G.bloq || G.st.fin || !G.sel || !aplicaSensor(s, G.sel) || G.vet) return;
    var st = G.st, sen = st.sens[s], T = G.sel.T, tm = NUCLEO.mascaraObjetivo(G.caso, T), N = G.caso.N;
    var res = { A: new Array(N).fill(0), N: new Array(N).fill(0) }, tot = { A: 0, N: 0 };
    for (var h = 0; h < st.hw.length; h++) {
      var w = st.hw[h]; if (!w) continue;
      var pa = NUCLEO.pAlerta(sen, (st.hm[h] & tm) !== 0, sen.dudoso && st.hr[h] === 1);
      tot.A += w * pa; tot.N += w * (1 - pa);
      for (var q = 0; q < N; q++) if (st.hm[h] & (1 << q)) { res.A[q] += w * pa; res.N[q] += w * (1 - pa); }
    }
    G.prevS = s;
    $$('#filas .fila').forEach(function (f) {
      var q = +f.getAttribute('data-i'), dentro = (tm >> q) & 1;
      f.classList.toggle('prev', !!dentro && tot.A > 0 && tot.N > 0);
      if (dentro) {
        $('.pv.a', f).style.left = 'calc(' + (tot.A ? res.A[q] / tot.A * 100 : 0).toFixed(1) + '% - 1px)';
        $('.pv.n', f).style.left = 'calc(' + (tot.N ? res.N[q] / tot.N * 100 : 0).toFixed(1) + '% - 1px)';
      }
    });
  }
  function limpiarPrev() { if (G) G.prevS = -1; $$('#filas .fila.prev').forEach(function (f) { f.classList.remove('prev'); }); }

  /* ---------- Copiloto ORA ---------- */
  function oraDecir(txt, o) {
    o = o || {};
    if (!o.tut && !o.ev && !o.forzar && !P.ora) return;
    var el = $('#ora'), tt = $('#oraT'), b = $('#oraB'), todo = $('#oraTodo');
    el.hidden = false; el.classList.toggle('ev', !!o.ev);
    G && (G.oraTipo = o.tipo || (o.tut ? 'tut' : 'msg'));
    clearInterval(oraDecir.tm);
    b.hidden = !o.btn;
    if (o.btn) { b.textContent = o.btn.label; b.onclick = function () { sfx('boton'); o.btn.fn(); }; }
    // PLAY-TELEMETRIA-02: la animación nunca obliga a esperar; «Mostrar todo» (o tocar el texto) revela el consejo completo
    var completar = function () { clearInterval(oraDecir.tm); tt.textContent = txt; todo.hidden = true; };
    if (rmActivo()) { tt.textContent = txt; todo.hidden = true; }
    else { var k = 0; tt.textContent = ''; todo.hidden = false; oraDecir.tm = setInterval(function () { k += 2; tt.textContent = txt.slice(0, k); if (k >= txt.length) completar(); }, 22); }
    todo.onclick = function () { sfx('boton'); completar(); };
    tt.onclick = completar;
    sfx('ora');
    anunciar(t('ora') + ': ' + txt);
  }
  function ocultarOra() { clearInterval(oraDecir.tm); $('#ora').hidden = true; $('#oraTodo').hidden = true; if (G) G.oraTipo = null; }
  function avisoBreve(txt) {
    var d = tutDef(); if (d && !d[Math.min(G.tutStep, d.length - 1)].libre) return;
    oraDecir(txt, { forzar: true, tipo: 'aviso' });
    clearTimeout(avisoBreve.tm);
    avisoBreve.tm = setTimeout(function () { if (G && G.oraTipo === 'aviso') ocultarOra(); }, 2600);
  }

  /* ---------- Tutorial (casos 1-1 a 1-3) ---------- */
  function idxSis(k) { for (var q = 0; q < G.caso.N; q++) if (G.caso.sis[q].k === k) return q; return -1; }
  function tutDef() {
    if (!G || !G.tpl.tut) return null;
    var r = idxSis('radar');
    var esRadar = function (a) { return a.k === 'sel' && a.T === r; };
    var leeRadar = function (a) { return a.k === 'read' && a.s === 0 && a.T === r; };
    if (G.tpl.tut === 1) return [
      { say: 'ora1', ok: esRadar, next: esRadar },
      { say: 'ora2', ok: function (a) { return leeRadar(a) || esRadar(a); }, next: leeRadar },
      { say: 'ora3', ok: function (a) { return leeRadar(a) || esRadar(a); }, next: leeRadar },
      { say: P.dbl ? 'ora4b' : 'ora4', ok: function (a) { return (a.k === 'rep' && a.i === r) || esRadar(a); }, next: function (a) { return a.k === 'rep'; } }
    ];
    if (G.tpl.tut === 2) return [
      { say: 'oraT2a', ok: function (a) { return esRadar(a) || leeRadar(a); }, next: leeRadar },
      { say: 'oraT2b', ok: function (a) { return esRadar(a) || leeRadar(a); }, next: leeRadar },
      { say: 'oraT2c', libre: true }
    ];
    return [{ say: 'oraT3', libre: true }];
  }
  function tutPermite(a) {
    var d = tutDef(); if (!d) return true;
    var s = d[Math.min(G.tutStep, d.length - 1)];
    if (s.libre || s.ok(a)) return true;
    sfx('error'); oraDecir(t(s.say), { tut: true });
    tiembla($('#ora'));
    return false;
  }
  function tutAvanzar(a) {
    var d = tutDef(); if (!d) return false;
    var s = d[G.tutStep]; if (!s || s.libre || !s.next(a)) return false;
    G.tutStep++; guardar();
    var n = d[G.tutStep]; if (n && !G.st.fin) oraDecir(t(n.say), { tut: true });
    tutResaltar();
    return true;
  }
  function tutResaltar() {
    $$('.pulse').forEach(function (e) { e.classList.remove('pulse'); });
    var d = tutDef(); if (!d) return;
    var s = d[Math.min(G.tutStep, d.length - 1)]; if (s.libre) return;
    var r = idxSis('radar');
    if ((G.tpl.tut === 1 && G.tutStep === 0) || (G.tpl.tut === 2 && (!G.sel || G.sel.T !== r))) { $$('#filas .fila[data-i="' + r + '"], #nodos .nodo[data-i="' + r + '"]').forEach(function (e) { e.classList.add('pulse'); }); return; }
    if (G.tpl.tut === 1 && G.tutStep === 3) { $('#bRep').classList.add('pulse'); return; }
    var sb = $('#sensores .sen[data-s="0"]'); if (sb) sb.classList.add('pulse');
  }

  /* ---------- Pista ---------- */
  function pista() {
    if (!G || G.bloq || G.st.fin || G.tpl.tut === 1 || G.tpl.tut === 2) return;
    if (!G.pista) { oraDecir(t('hintCost'), { forzar: true, btn: { label: t('hintShow'), fn: darPista } }); return; }
    darPista();
  }
  function darPista() {
    G.pista = true; guardar(); $('#bPista').classList.add('used');
    oraDecir(t('thinking'), { forzar: true });
    var g = G, n = G.st.acciones.length;
    wCall({ cmd: 'mejor', tpl: G.desc.tpl, s: G.desc.s, a: G.desc.a, acciones: accMin(G.st) }).then(function (r) {
      if (G !== g || G.st.acciones.length !== n || !r || !r.best) return;
      var b = r.best, c = G.caso, txt;
      if (b.t === 'R') txt = t('hintRepair', { s: nombreSis(c, b.i) });
      else if (b.T >= 100) txt = t('hintReadZone', { s: t('zoneNames')[b.T - 100] });
      else txt = t('hintRead', { s: nombreSis(c, b.T), x: t('senCon')[c.sensores[b.s].k] });
      oraDecir(txt, { forzar: true });
      var objetivo = b.t === 'R' ? b.i : b.T;
      var el = objetivo >= 100 ? $('#zonas .zb[data-z="' + (objetivo - 100) + '"]') : $('#filas .fila[data-i="' + objetivo + '"]');
      if (el) { el.classList.add('pulse'); setTimeout(function () { el.classList.remove('pulse'); }, 2600); }
    });
  }

  /* ---------- Registro ---------- */
  function renderLog() {
    if (!G) return;
    var c = G.caso, html = '';
    G.st.acciones.forEach(function (a, k) {
      if (a.t === 'L') html += '<div class="le"><span class="n">' + (k + 1) + '</span><span>' + esc(t('senShort')[c.sensores[a.s].k]) + ' → ' + esc(nombreObj(c, a.T)) + '</span><span class="r ' + a.o + '">' + (a.o === 'A' ? '▲ ' + esc(t('alert')) : '○ ' + esc(t('normal'))) + '</span><span class="c">−' + a.c + ' ' + esc(t('minShort')) + (a.danio != null ? ' · ⚡ ' + esc(t('damaged', { s: nomSen(c.sensores[a.danio].k) })) : '') + '</span></div>';
      else html += '<div class="le"><span class="n">' + (k + 1) + '</span><span>' + esc(t('actRepair', { s: nombreSis(c, a.i) })) + '</span><span class="r ' + (a.ok ? 'ok' : 'ko') + '">' + (a.ok ? '✓ ' + esc(t('repaired')) : '✕ ' + esc(t('discarded'))) + '</span><span class="c">−' + a.c + ' ' + esc(t('minShort')) + '</span></div>';
    });
    if (!html) html = '<p class="vacio">' + esc(t('logEmpty')) + '</p>';
    $('#logSheet').innerHTML = html; $('#logInline').innerHTML = html;
    var li = $('#logInline'); li.scrollTop = li.scrollHeight;
  }
  // PLAY-TELEMETRIA-07: la hoja del registro gestiona su foco, vuelve inerte el fondo y devuelve el foco a quien la abrió
  var hojaAct = null;
  function abrirHoja() {
    renderLog(); hojaAct = document.activeElement;
    $('#sheet').classList.add('on'); sfx('panel'); var l = $('#logSheet'); l.scrollTop = l.scrollHeight;
    $('#bLog').setAttribute('aria-expanded', 'true');
    fondoInerte();
    setTimeout(function () { $('#sheetX').focus({ preventScroll: true }); }, 40);
  }
  function cerrarHoja() {
    var s = $('#sheet'); if (!s.classList.contains('on')) return;
    s.classList.remove('on'); sfx('panel');
    $('#bLog').setAttribute('aria-expanded', 'false');
    fondoInerte();
    var a = hojaAct; hojaAct = null;
    if (a && visibleEl(a)) a.focus({ preventScroll: true }); else if (visibleEl($('#bLog'))) $('#bLog').focus({ preventScroll: true });
  }

  /* ---------- Pausa ---------- */
  function pausar() {
    if (!G || pantalla !== 'juego' || G.st.fin) return;
    if (G.hold) finMantener(false);
    limpiarPrev(); cerrarHoja();
    var dia = G.desc.modo === 'diario';
    $('#ov-pausa').innerHTML = '<div class="card pz"><h2>' + esc(t('pause').toUpperCase()) + '</h2><p class="info">' + esc(etiquetaCaso(G.desc)) + ' · ' + esc(t('air')) + ' ' + Math.max(0, G.st.aire) + ' ' + esc(t('min')) + '</p>' +
      '<div class="stack"><button class="btn pri big" id="pzC" type="button">' + esc(t('resume')) + '</button>' +
      (dia ? '' : '<button class="btn" id="pzR" type="button">' + esc(t('restart')) + '</button>') +
      '<button class="btn" id="pzA" type="button">' + esc(t('settings')) + '</button>' +
      '<button class="btn" id="pzS" type="button">' + esc(t('quit')) + '</button><p class="muted" style="text-align:center;font-size:12.5px">' + esc(t('quitNote')) + '</p></div></div>';
    abrirOv('pausa');
    MUSICA.capas({ decision: 1 });
    $('#pzC').onclick = continuar;
    // SRC-G03/G04: reiniciar pierde el intento actual → confirmación explícita y cancelable, sin doble toque temporal
    if ($('#pzR')) $('#pzR').onclick = function () {
      sfx('boton');
      confirmar({ titulo: t('restart'), texto: t('restartSure'), boton: t('restart'),
        ok: function () { ovPila.length = 0; MUSICA.capas({ decision: 0 }); var d = G.desc.modo === 'campana' ? descCampana(G.desc.id) : G.desc; G = null; ldel('partida'); iniciarJuego(d, [], {}); },
        cancelar: function () { pausar(); } });
    };
    $('#pzA').onclick = function () { abrirAjustes('pausa'); };
    $('#pzS').onclick = function () { guardar(); cerrarOv(); MUSICA.capas({ decision: 0 }); MUSICA.respirar(false); G = null; renderInicio(); mostrar('inicio'); };
  }
  function continuar() { cerrarOv(); audioGesto(); MUSICA.capas({ decision: 0 }); if (G) pintar(false); }

  /* ---------- Fin y Caja negra ---------- */
  function terminar() {
    if (!G) return;
    var st = G.st, desc = G.desc, win = st.fin === 'win', g = G;
    if (desc.modo !== 'diario') ldel('partida'); MUSICA.respirar(false);
    MUSICA.remate(win ? 'win' : 'lose');
    vib(win ? [20, 30, 50] : [80, 50, 120]);
    G.res = { fin: st.fin, aire: Math.max(0, st.aire), aire0: G.caso.aire0, prec: null, est: win ? 1 : 0, E: null, Lo: null, U: null, pasos: [], quick: false };
    var tut = G.tpl.tut === 1 || G.tpl.tut === 2;
    if (tut) G.res.est = win ? 3 : 0;
    registrarProgreso(G, true);
    if (G.tpl.tut === 3 || desc.id === '1-3') { PR.tut3 = true; guardarPR(); }
    renderRes();
    mostrar('res');
    if (!tut) {
      Promise.all([G.ini].concat(st.acciones.map(function (a, k) { return analizarFondo(k); }))).then(function (r) {
        if (G !== g) return;
        var ini = r[0], pasos = r.slice(1);
        if (!ini || pasos.some(function (x) { return !x; })) return;
        var arr = pasos.reduce(function (s, p) { return s + p.arrep; }, 0);
        var norm = Math.max(8, ini.V - ini.hoja);
        var prec = Math.max(0, Math.min(100, Math.round(100 * (1 - arr / norm))));
        var E = Math.round(ini.esperado != null ? ini.esperado : Math.max(0, ini.V)), Lo = Math.round(arr), U = G.res.aire - (E - Lo);
        // Regla vigente (decisión 6): victoria → 3 con prec >= 95, 2 con prec >= 80, 1 en el resto; derrota → 0; pista limita a 2 (Math.min), no resta una
        var est = win ? (prec >= UMBRAL_EST[3] ? 3 : prec >= UMBRAL_EST[2] ? 2 : 1) : 0;
        if (G.pista) est = Math.min(est, MAX_EST_PISTA);
        Object.assign(G.res, { prec: prec, E: E, Lo: Lo, U: U, est: est, pasos: pasos, quick: G.quick });
        registrarProgreso(G, false);
        renderRes(true);
      });
    }
  }
  function registrarProgreso(g, provisional) {
    var r = g.res, d = g.desc;
    if (d.modo === 'campana') {
      PR.est[d.id] = Math.max(PR.est[d.id] || 0, r.est); // una victoria en modo Veterano también abre capítulos
      if (g.vet) PR.estV[d.id] = Math.max(PR.estV[d.id] || 0, r.est);
      if (r.prec != null) PR.prec[d.id] = Math.max(PR.prec[d.id] || 0, r.prec);
      guardarPR();
    } else if (d.modo === 'diario') {
      syncDiario();
      if (provisional && !DI.terminado) {
        DI.racha = DI.ultimo === ayer(d.fecha) ? (DI.racha || 0) + 1 : (DI.ultimo === d.fecha ? DI.racha : 1);
        DI.ultimo = d.fecha; DI.terminado = true;
      }
      DI.res = { fin: r.fin, aire: r.aire, aire0: r.aire0, prec: r.prec, est: r.est, texto: textoCompartir(g) };
      guardarDI();
    }
  }
  function textoCompartir(g) {
    var em = '', ult = {}, c = g.caso;
    g.st.acciones.forEach(function (a) {
      if (a.t === 'L') { em += (ult[a.T] && ult[a.T] !== a.o) ? '🟨' : '📡'; ult[a.T] = a.o; }
      else em += a.ok ? '🔧✅' : '🔧💥';
    });
    if (g.st.fin === 'lose') em += '💀';
    var r = g.res, st = '';
    for (var k = 0; k < 3; k++) st += k < r.est ? '★' : '☆';
    var cab = g.desc.modo === 'diario' ? t('title') + ' · ' + t('shareCase') + ' #' + g.desc.num + ' 🛰️' : t('title') + ' · ' + etiquetaCaso(g.desc) + ' 🛰️';
    var lin = t('shareAir') + ' ' + r.aire + '/' + r.aire0 + (r.prec != null ? ' · ' + t('shareAcc') + ' ' + r.prec + (L === 'es' ? ' %' : '%') : '') + ' · ' + st;
    var url = 'https://jetgames.fun/telemetria/' + (g.desc.modo === 'diario' ? '?diario' : '');
    return cab + '\n' + em + '\n' + lin + (g.desc.modo === 'diario' && rachaVis() ? '\n' + t('shareStreak') + ' 🔥' + rachaVis() : '') + '\n' + url;
  }
  // SRC-G06: compartir sólo por acción del jugador; cancelar el diálogo nativo no muestra nada; éxito sólo tras confirmar el copiado;
  // si no se puede copiar, el texto íntegro queda seleccionable (patrón de Señal) con «Copiar texto» y «Cerrar».
  function compartir(txt) {
    sfx('boton');
    var activador = document.activeElement; // la copia clásica mueve el foco a un textarea temporal: el retorno debe ir al botón real
    var copiarClasico = function () {
      var ta = document.createElement('textarea'), ok = false;
      ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); return ok;
    };
    var copiar = function () {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast(t('copied')); }, function () { if (copiarClasico()) toast(t('copied')); else mostrarTexto(); });
      else if (copiarClasico()) toast(t('copied'));
      else mostrarTexto();
    };
    function mostrarTexto() {
      var ov = $('#ov-copiar');
      if (!ov) { ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'ov-copiar'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); document.body.appendChild(ov); ov.addEventListener('click', function (e) { if (e.target === ov) $('#cpX').click(); }); }
      var volver = ovAbierto;
      ov.innerHTML = '<div class="card"><div class="top"><h2 id="cpH">' + esc(t('share')) + '</h2><button class="x" id="cpX" type="button" aria-label="' + esc(t('close')) + '">×</button></div>' +
        '<p class="muted" style="font-size:14px">' + esc(t('copyFail')) + '</p><textarea id="cpT" class="cpt" readonly rows="6" aria-labelledby="cpH" data-foco>' + esc(txt) + '</textarea>' +
        '<div class="row2" style="margin-top:12px"><button class="btn pri" id="cpC" type="button">' + esc(t('copyText')) + '</button><button class="btn" id="cpX2" type="button">' + esc(t('close')) + '</button></div></div>';
      abrirOv('copiar', activador);
      var cerrar = function () { cerrarOv(); if (volver === 'diario') { renderDiarioHecho(); abrirOv('diario'); } };
      $('#cpX').onclick = cerrar; $('#cpX2').onclick = cerrar;
      var area = $('#cpT'); setTimeout(function () { area.focus(); area.select(); }, 60);
      $('#cpC').onclick = function () {
        area.focus(); area.select();
        var fin = function (ok) { if (ok) toast(t('copied')); else toast(t('copyFail'), 3000); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { fin(true); }, function () { fin(copiarClasico()); });
        else fin(copiarClasico());
      };
    }
    if (navigator.share) navigator.share({ text: txt }).catch(function (e) { if (!e || e.name !== 'AbortError') copiar(); });
    else copiar();
  }
  function comentario(g, k) {
    var p = g.res.pasos[k], a = g.st.acciones[k], c = g.caso;
    if (!p) return '';
    var d = Math.round(p.arrep * 10) / 10, dTxt = (L === 'es' ? String(d).replace('.', ',') : String(d));
    var b = p.best;
    if (p.arrep < 0.5 || !b) return (b && NUCLEO && b.t === a.t && (a.t === 'R' ? b.i === a.i : (b.s === a.s && b.T === a.T))) ? t('cGood') : t('cClose');
    var stp = NUCLEO.reproducir(c, accMin(g.st).slice(0, k)), m = NUCLEO.marginales(stp);
    if (a.t === 'L' && b.t === 'R') return t('cReadInstead', { p: pct(m[b.i]), s: nombreSis(c, b.i), d: dTxt });
    if (a.t === 'R' && b.t === 'L') return t('cRepairEarly', { s: nombreObj(c, b.T), x: t('senCon')[c.sensores[b.s].k], d: dTxt });
    if (a.t === 'L') return t('cBetterRead', { x: nomSen(c.sensores[b.s].k), s: nombreObj(c, b.T), d: dTxt });
    return t('cOtherRepair', { s: nombreSis(c, b.i), p: pct(m[b.i]), d: dTxt });
  }
  /* icono plano de cada paso de la repetición: lectura (color del resultado) o reparación (bien/mal) */
  function icoPaso(a) {
    var lect = '<circle cx="6" cy="18" r="1.7"/><path d="M6 12.5a5.5 5.5 0 0 1 5.5 5.5M6 7a11 11 0 0 1 11 11"/>';
    var llave = '<path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L4 17l3 3 5.5-5.5a4 4 0 0 0 5.2-5.2l-2.6 2.6-2.4-.6-.6-2.4z"/>';
    var cls = a.t === 'L' ? (a.o === 'A' ? 'ia' : 'in') : (a.ok ? 'iok' : 'iko');
    return '<svg class="ip ' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + (a.t === 'L' ? lect : llave + (a.ok ? '' : '<path d="M16 16l5 5M21 16l-5 5"/>')) + '</svg>';
  }
  function accTexto(c, a) { return a.t === 'L' ? t('actRead', { x: t('senShort')[c.sensores[a.s].k], s: nombreObj(c, a.T) }) : t('actRepair', { s: nombreSis(c, a.i) }); }
  function renderRes(actualizar) {
    var g = G, r = g.res, c = g.caso, win = r.fin === 'win', tut = g.tpl.tut === 1 || g.tpl.tut === 2;
    var rotos = c.F.map(function (q) { return nombreSis(c, q); });
    var circ = 238.76, prec = r.prec;
    // PLAY-TELEMETRIA-04: reparación correcta seguida de agotamiento del aire (precedencia vigente de NUCLEO.aplicar: aire <= 0 antes que real === 0)
    var ultima = g.st.acciones[g.st.acciones.length - 1];
    var subExtra = (!win && ultima && ultima.t === 'R' && ultima.ok) ? ' · ' + t('repairNoAir', { sistema: nombreSis(c, ultima.i) }) : '';
    var html = '<div class="card wide"><div class="kick" style="text-align:center">' + esc(etiquetaCaso(g.desc)) + '</div>' +
      '<h2 class="res-h ' + (win ? 'win' : 'lose') + '" style="margin-top:6px" id="resT">' + esc(win ? t('win') : t('lose')) + '</h2>' +
      '<p class="res-sub">' + esc(rotos.length > 1 ? t('wereBroken', { s: rotos.join(' · ') }) : t('wasBroken', { s: rotos[0] })) + esc(subExtra) + (win && g.desc.id === 'F' ? ' · ' + esc(t('homeArrived')) : '') + '</p>' +
      '<div class="res-main"><div class="res-air"><b id="rAir">' + (actualizar ? r.aire : 0) + '</b><span>' + esc(t('finalAir').toUpperCase()) + ' · ' + esc(t('min')) + '</span></div>' +
      // PLAY-TELEMETRIA-06: estrellas reales del resultado, visibles y accesibles; mientras el análisis está pendiente no se anuncian como definitivas
      '<div class="stars-w"><div class="stars" id="rStars" role="img" aria-label="' + esc(t('earnedStars', { estrellas: r.est })) + '">' + STAR + STAR + STAR + '</div><p class="stars-txt" id="rStarsTxt">' + esc(t('earnedStars', { estrellas: r.est })) + (!tut && prec == null ? ' · ' + esc(t('decScorePending')) : '') + '</p></div>' +
      (tut ? '' : '<div class="acc" role="img" aria-label="' + esc(prec == null ? t('decScorePending') : t('decScore', { prec: prec })) + '"><svg viewBox="0 0 86 86" aria-hidden="true"><circle class="bgc" cx="43" cy="43" r="38"/><circle class="fg" id="rRing" cx="43" cy="43" r="38" stroke-dasharray="' + circ + '" stroke-dashoffset="' + circ + '"/></svg><b aria-hidden="true">' + (prec == null ? '…' : prec) + '</b><small aria-hidden="true">' + esc(t('accuracy').toUpperCase()) + '</small></div>') + '</div>';
    if (!win && prec != null && prec >= 95) html += '<span class="badge">' + esc(t('unluckyBadge')) + '</span>';
    // explicación de la métrica y de los umbrales reales (rama tutorial 1/2 aparte)
    html += '<div class="est-ayuda">';
    if (tut) html += '<p>' + esc(t('tutStars')) + '</p>';
    else {
      html += '<p><b>' + esc(prec == null ? t('decScorePending') : t('decScore', { prec: prec })) + '</b> ' + esc(t('decScoreHelp')) + '</p>';
      html += '<ul><li>' + esc(t('oneStar')) + '</li><li>' + esc(t('starThreshold', { objetivo: 2, umbral_precision: UMBRAL_EST[2] })) + '</li>' +
        (g.pista ? '<li>' + esc(t('hintCost')) + '</li>' : '<li>' + esc(t('starThreshold', { objetivo: 3, umbral_precision: UMBRAL_EST[3] })) + '</li>') + '</ul>';
    }
    html += '</div>';
    if (!tut) {
      html += '<div class="lineas">';
      if (prec == null) html += '<div><span class="calc">' + esc(t('decScorePending')) + '</span></div>';
      else {
        html += '<div><span>' + esc(t('ref')) + '</span><b>' + r.E + ' ' + esc(t('minShort')) + '</b></div>' +
          '<div><span>' + esc(t('lostDec')) + '</span><b class="' + (r.Lo > 0 ? 'neg' : '') + '">' + (r.Lo > 0 ? '−' : '') + r.Lo + ' ' + esc(t('minShort')) + '</b></div>' +
          '<div><span>' + esc(r.U >= 0 ? t('luck') : t('badLuck')) + '</span><b class="' + (r.U >= 0 ? 'pos' : 'neg') + '">' + (r.U >= 0 ? '+' : '−') + Math.abs(r.U) + ' ' + esc(t('minShort')) + '</b></div>';
        if (r.quick) html += '<div><span class="calc">' + esc(t('quick')) + '</span></div>';
      }
      html += '</div>';
      // SRC-TE02: «Ver análisis de decisiones» despliega la repetición comentada (estimación, no certeza)
      if (prec != null && g.st.acciones.length) {
        html += '<button class="btn" id="rAna" type="button" aria-expanded="' + (!!r.anaAbierto) + '" aria-controls="rRepl">' + esc(t('analysis')) + '</button>' +
          '<div class="repl" id="rRepl"' + (r.anaAbierto ? '' : ' hidden') + '><h4>' + esc(t('replay').toUpperCase()) + '</h4><p class="h">' + esc(t('replayHint')) + '</p><div class="tl" id="rTl">' +
          g.st.acciones.map(function (a, k) { var p = r.pasos[k]; var ab = a.t === 'L' ? (a.T >= 100 ? t('zones')[a.T - 100].slice(0, 3) : nombreSis(c, a.T).slice(0, 3).toUpperCase()) : nombreSis(c, a.i).slice(0, 3).toUpperCase(); return '<button class="tc' + (p && p.arrep > 2 ? ' warn' : '') + '" type="button" data-k="' + k + '" aria-label="' + esc(accTexto(c, a)) + '">' + icoPaso(a) + '' + esc(ab) + '</button>'; }).join('') +
          '</div><div class="det" id="rDet"></div></div>';
      }
      if (g.desc.id === '1-3' && prec != null && r.pasos.some(function (p, k) { return g.st.acciones[k].t === 'L' && p.arrep > 2; })) html += '<div class="ora" style="margin-top:12px"><b>ORA</b><span class="t">' + esc(t('oraRisk')) + '</span></div>';
    }
    // botones — PLAY-TELEMETRIA-05 / SRC-TE02: en derrota, «Reintentar caso» es la acción primaria y enfocada; en victoria, «Siguiente caso».
    // «Elegir otro caso» (campaña) lleva al mapa; «Volver al menú» siempre disponible. El caso fallido nunca se presenta como superado.
    var d = g.desc, nx = null;
    if (d.modo === 'campana') {
      var i = CASOS.CAMPANA.findIndex(function (x) { return x.id === d.id; }), sig = CASOS.CAMPANA[i + 1];
      if (sig && capAbierto(sig.cap)) nx = sig.id;
    }
    var puedeRepetir = d.modo !== 'diario';
    html += '<div class="res-btns">';
    if (!win && puedeRepetir) {
      html += '<button class="btn pri big" id="rAgain" type="button" data-foco>' + esc(t('retry')) + '</button>';
      if (d.luego === 'diario') html += '<button class="btn" id="rNext" type="button">' + esc(t('dailyShort')) + '</button>';
      else if (d.modo === 'campana') html += '<div class="row2"><button class="btn" id="rMap2" type="button">' + esc(t('otherCase')) + '</button><button class="btn" id="rShare2" type="button">' + esc(t('share')) + '</button></div>';
      else html += '<div class="row2"><button class="btn" id="rNext" type="button">' + esc(t('next')) + '</button><button class="btn" id="rShare2" type="button">' + esc(t('share')) + '</button></div>';
      html += '<button class="btn" id="rHome" type="button">' + esc(t('home')) + '</button>';
    } else {
      if (d.luego === 'diario') html += '<button class="btn pri big" id="rNext" type="button" data-foco>' + esc(t('dailyShort')) + '</button>';
      else if (d.modo === 'campana') html += nx ? '<button class="btn pri big" id="rNext" type="button" data-foco>' + esc(t('next')) + '<small>' + esc(t('caseN', { c: nx === 'F' ? t('finalCase') : nx })) + '</small></button>' : '<button class="btn pri big" id="rMap" type="button" data-foco>' + esc(t('campaign2')) + '</button>';
      else if (d.modo === 'practica' || d.modo === 'prueba') html += '<button class="btn pri big" id="rNext" type="button" data-foco>' + esc(t('next')) + '</button>';
      else html += '<button class="btn pri big" id="rShare" type="button" data-foco>' + esc(t('share')) + '</button>';
      if (d.modo === 'diario') html += '<div class="row2"><button class="btn" id="rPrac" type="button">' + esc(t('practiceThis')) + '</button><button class="btn" id="rHome" type="button">' + esc(t('home')) + '</button></div><p class="muted" style="text-align:center;font-size:13px">' + esc(t('dailyDone', { t: cuentaAtras() })) + '</p>';
      else html += '<div class="row2"><button class="btn" id="rAgain" type="button">' + esc(t('replayCase')) + '</button><button class="btn" id="rShare2" type="button">' + esc(t('share')) + '</button></div>' +
        (d.modo === 'campana' && !nx ? '<button class="btn" id="rHome" type="button">' + esc(t('home')) + '</button>' : '<div class="row2"><button class="btn" id="rMap2" type="button">' + esc(t('campaign2')) + '</button><button class="btn" id="rHome" type="button">' + esc(t('home')) + '</button></div>');
    }
    html += '</div></div>';
    $('#s-res').innerHTML = html;
    var on = function (id, f) { var e = $('#' + id); if (e) e.onclick = function () { sfx('boton'); f(); }; };
    on('rNext', function () {
      if (d.luego === 'diario') { G = null; abrirDiario(); return; }
      if (d.modo === 'campana') iniciarBrief(descCampana(nx)); else iniciarBrief(descPractica(d.cap || Math.min(8, CASOS.porId[d.tpl].cap)));
    });
    on('rMap', function () { renderMapa(); mostrar('mapa'); });
    on('rMap2', function () { renderMapa(); mostrar('mapa'); });
    on('rHome', function () { G = null; renderInicio(); mostrar('inicio'); });
    on('rAgain', function () { var dd = d.modo === 'campana' ? descCampana(d.id) : Object.assign({}, d); G = null; iniciarJuego(dd, [], {}); });
    on('rShare', function () { compartir(textoCompartir(g)); });
    on('rShare2', function () { compartir(textoCompartir(g)); });
    on('rPrac', function () { var dd = Object.assign({}, d, { modo: 'practica', id: 'P' }); G = null; iniciarBrief(dd); });
    on('rAna', function () { var b = $('#rAna'), p = $('#rRepl'); r.anaAbierto = !r.anaAbierto; b.setAttribute('aria-expanded', r.anaAbierto); p.hidden = !r.anaAbierto; if (r.anaAbierto) p.scrollIntoView({ block: 'nearest', behavior: rmActivo() ? 'auto' : 'smooth' }); });
    $$('#rTl .tc').forEach(function (b) { b.onclick = function () { verPaso(+b.getAttribute('data-k')); }; });
    // animaciones de entrada
    var stars = $$('#rStars svg');
    var base = actualizar ? 0 : 500;
    if (!actualizar) {
      var el = $('#rAir'), v = 0, obj = r.aire;
      var iv = setInterval(function () { v = Math.min(obj, v + Math.max(1, Math.ceil(obj / 20))); if (el.isConnected) el.textContent = v; if (v >= obj) clearInterval(iv); }, 40);
    }
    var ya = Math.min(r.vistas || 0, r.est);
    stars.forEach(function (s, k) {
      if (k < ya) s.classList.add('on');
      else if (k < r.est) setTimeout(function () { if (!s.isConnected) return; s.classList.add('on'); if (k >= (r.vistas || 0)) { r.vistas = k + 1; sfx('star', k); } }, base + (k - ya) * 380);
    });
    var ring = $('#rRing');
    if (ring && prec != null) setTimeout(function () { ring.style.strokeDashoffset = (circ * (1 - prec / 100)).toFixed(1); }, 80);
    if ($('#rDet')) verPaso(g.st.acciones.length ? (function () { var w = 0, wi = 0; r.pasos.forEach(function (p, k) { if (p && p.arrep > w) { w = p.arrep; wi = k; } }); return wi; })() : 0);
  }
  function verPaso(k) {
    var g = G; if (!g || !g.res || !g.res.pasos[k]) return;
    $$('#rTl .tc').forEach(function (b) { b.classList.toggle('sel', +b.getAttribute('data-k') === k); });
    var c = g.caso, stp = NUCLEO.reproducir(c, accMin(g.st).slice(0, k)), m = NUCLEO.marginales(stp), p = g.res.pasos[k], a = g.st.acciones[k];
    var orden = m.map(function (v, q) { return q; }).sort(function (x, y) { return m[y] - m[x]; }).slice(0, Math.min(5, c.N));
    var html = orden.map(function (q) { return '<div class="mb"><span>' + esc(nombreSis(c, q)) + '</span><span class="barra"><i class="f" style="width:' + (m[q] * 100).toFixed(1) + '%"></i></span><i>' + pct(m[q]) + '</i></div>'; }).join('');
    html += '<div class="yo"><b>' + esc(t('youDid').toUpperCase()) + '</b><span>' + esc(accTexto(c, a)) + (a.t === 'L' ? ' · ' + (a.o === 'A' ? '▲ ' + t('alert') : '○ ' + t('normal')) : '') + '</span>' +
      '<b>' + esc(t('pilotWould').toUpperCase()) + '</b><span>' + esc(p.best ? accTexto(c, p.best) : '—') + '</span></div><p class="cm">' + esc(comentario(g, k)) + '</p>';
    $('#rDet').innerHTML = html;
  }

  /* ================= Piloto: worker con respaldo ================= */
  // dos workers: uno para el análisis de fondo (Caja negra) y otro para las pistas, que nunca esperan en cola
  var W = null, W2 = null, wq = {}, wid = 0, wFail = false;
  var PERF = [];
  function crearW() {
    var w = new Worker('src/piloto.worker.js');
    w.onmessage = function (e) { var cb = wq[e.data.id]; delete wq[e.data.id]; if (cb) cb(e.data); };
    w.onerror = function () { wFail = true; Object.keys(wq).forEach(function (k) { var cb = wq[k]; delete wq[k]; cb({ ok: false }); }); };
    return w;
  }
  try { W = crearW(); W2 = crearW(); } catch (e) { wFail = true; }
  function local(msg) {
    var caso = NUCLEO.generarCaso(CASOS.porId[msg.tpl], msg.s, msg.a);
    if (G && G.desc.tpl === msg.tpl && G.desc.s === msg.s) G.quick = true;
    if (msg.cmd === 'paso') return PILOTO.analizarPaso(caso, msg.acciones, msg.t, { d: 1 });
    if (msg.cmd === 'inicio') { var r0 = PILOTO.analizarInicio(caso, { d: 1 }); r0.esperado = PILOTO.simular(caso, 30, 'piloto', 1, 7).aireMedio; return r0; }
    var st = NUCLEO.reproducir(caso, msg.acciones), r = PILOTO.evaluar(NUCLEO.vistaPiloto(st), { d: 1 }); return { best: r.best, V: r.V, ms: r.ms };
  }
  function wCall(msg) {
    return new Promise(function (res) {
      var hecho = false, fin = function (r) { if (hecho) return; hecho = true; if (r && r.ms != null) { PERF.push(r.ms); if (PERF.length > 200) PERF.shift(); } res(r); };
      if (!W || wFail) { setTimeout(function () { try { fin(local(msg)); } catch (e) { fin(null); } }, 0); return; }
      var id = ++wid; msg.id = id;
      wq[id] = function (d) { if (d.ok) fin(d.r); else { try { fin(local(msg)); } catch (e) { fin(null); } } };
      (msg.cmd === 'mejor' ? W2 : W).postMessage(msg);
      setTimeout(function () { if (wq[id]) { delete wq[id]; try { fin(local(msg)); } catch (e) { fin(null); } } }, 9000);
    });
  }
  function analizarFondo(k) {
    if (!G) return Promise.resolve(null);
    if (!G.an[k]) G.an[k] = wCall({ cmd: 'paso', tpl: G.desc.tpl, s: G.desc.s, a: G.desc.a, acciones: accMin(G.st).slice(0, k + 1), t: k });
    return G.an[k];
  }

  /* ================= Ajustes ================= */
  function abrirAjustes(desde) { volverAjustes = desde; renderAjustes(); abrirOv('ajustes'); }
  function tog(id, on, label, sub) { return '<div class="set"><span class="lb">' + esc(label) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span><button class="tog" id="' + id + '" type="button" role="switch" aria-checked="' + !!on + '" aria-label="' + esc(label) + '"></button></div>'; }
  function renderAjustes() {
    var html = '<div class="card"><div class="top"><h2>' + esc(t('settings')) + '</h2><button class="x" id="aX" type="button" aria-label="' + esc(t('close')) + '">×</button></div>' +
      '<div class="set"><span class="lb">' + esc(t('music')) + '</span><input type="range" id="aMv" min="0" max="1" step="0.05" value="' + P.musicVol + '" aria-label="' + esc(t('music') + ' · ' + t('volume')) + '"><button class="tog" id="aM" type="button" role="switch" aria-checked="' + P.music + '" aria-label="' + esc(t('music')) + '"></button></div>' +
      '<div class="set"><span class="lb">' + esc(t('sfx')) + '</span><input type="range" id="aSv" min="0" max="1" step="0.05" value="' + P.sfxVol + '" aria-label="' + esc(t('sfx') + ' · ' + t('volume')) + '"><button class="tog" id="aS" type="button" role="switch" aria-checked="' + P.sfx + '" aria-label="' + esc(t('sfx')) + '"></button></div>' +
      (navigator.vibrate ? tog('aV', P.vib, t('vibration')) : '') +
      '<div class="set"><span class="lb">' + esc(t('language')) + '</span>' + segIdioma('aEs', 'aEn') + '</div>' +
      (FS_OK ? '<div class="set"><span class="lb">' + esc(t('fullscreen')) + '</span><button class="tog" id="aF" type="button" role="switch" aria-checked="' + enFS() + '" aria-label="' + esc(t('fullscreen')) + '"></button></div>' : '') +
      tog('aP', P.pct, t('percents')) + tog('aO', P.ora, t('copilot')) + tog('aR', rmActivo(), t('reducedMotion')) + tog('aH', P.hc, t('contrast')) + tog('aD', P.dbl, t('doubleTap')) +
      '<div class="set" style="border:0;padding-top:16px"><button class="btn red" id="aB" type="button">' + esc(t('erase')) + '</button></div></div>';
    $('#ov-ajustes').innerHTML = html;
    var cerrar = function () { guardarPrefs(); cerrarOv(); if (volverAjustes === 'pausa') pausar(); };
    $('#aX').onclick = cerrar;
    var sw = function (id, f) { var e = $('#' + id); if (e) e.onclick = function () { f(); guardarPrefs(); aplicarPrefs(); sfx('sel'); e.setAttribute('aria-checked', e.getAttribute('aria-checked') !== 'true'); if (G) pintar(false); }; };
    sw('aM', function () { P.music = !P.music; }); sw('aS', function () { P.sfx = !P.sfx; }); sw('aV', function () { P.vib = !P.vib; if (P.vib) vib(20); });
    sw('aP', function () { P.pct = !P.pct; }); sw('aO', function () { P.ora = !P.ora; if (!P.ora && G && G.oraTipo !== 'tut') ocultarOra(); });
    sw('aR', function () { P.rm = !rmActivo(); }); sw('aH', function () { P.hc = !P.hc; });
    sw('aD', function () { P.dbl = !P.dbl; if (G) { G.armado = 0; var d = tutDef(); if (d && G.tpl.tut === 1 && G.tutStep === 3) oraDecir(t(P.dbl ? 'ora4b' : 'ora4'), { tut: true }); } });
    if ($('#aF')) $('#aF').onclick = function () { alternarFS(); };
    $('#aMv').oninput = function (e) { P.musicVol = +e.target.value; AUDIO.setPrefs({ musicVol: P.musicVol }); };
    $('#aSv').oninput = function (e) { P.sfxVol = +e.target.value; AUDIO.setPrefs({ sfxVol: P.sfxVol }); };
    $('#aSv').onchange = function () { guardarPrefs(); sfx('alerta'); }; $('#aMv').onchange = guardarPrefs;
    $('#aEs').onclick = function () { cambiarIdioma('es'); }; $('#aEn').onclick = function () { cambiarIdioma('en'); };
    // SRC-G04: confirmación explícita (sin doble toque ni pulsación larga), Cancelar enfocado, enumeración de lo que se borra.
    // Las preferencias (audio, porcentajes, contraste…) y el idioma del sitio no se tocan: borrarTodo sólo elimina progreso, diario y partida.
    var bB = $('#aB');
    bB.onclick = function () {
      sfx('boton');
      var volver = volverAjustes;
      confirmar({ titulo: t('eraseTitle', { juego: t('title') }), texto: t('eraseBody', { datos: t('eraseData') }), boton: t('erase'),
        ok: function () { borrarTodo(); },
        cancelar: function () { abrirAjustes(volver); } });
    };
  }
  function borrarTodo() {
    ldel('progreso'); ldel('diario'); ldel('partida');
    PR = { v: 1, est: {}, estV: {}, prec: {}, int: {}, tut3: false, vet: false, jugado: false };
    DI = { v: 1, fecha: null, empezado: false, terminado: false, res: null, racha: 0, ultimo: null };
    G = null; ovPila.length = 0; cerrarOv(); $$('.ov').forEach(function (o) { o.classList.remove('on'); }); ovAbierto = null; fondoInerte(); toast(t('erased')); sfx('ko'); renderInicio(); mostrar('inicio');
  }
  /* Cambio de idioma en vivo (desde el inicio, Ajustes o window.JETIdioma.set): repinta todo sin tocar la partida. */
  window.addEventListener('jet-idioma', function (e) {
    var l = e && e.detail; if ((l !== 'es' && l !== 'en') || l === L) return;
    L = l; aplicarPrefs(); sfx('sel'); refrescarTodo();
    if (ovAbierto === 'ajustes') renderAjustes();
    else if (ovAbierto === 'como') renderComo();
    else if (ovAbierto === 'diario' && DI.terminado) renderDiarioHecho();
    if (G) { try { renderLog(); } catch (er) {} }
    if (ovAbierto !== 'ajustes' && $('#ov-ajustes').innerHTML) { try { renderAjustes(); } catch (er) {} } // cerrado pero ya pintado: que no quede en el idioma anterior
    anunciar(t('language') + ': ' + (L === 'es' ? 'Español' : 'English'));
  });
  function refrescarTodo() {
    if (pantalla === 'inicio') renderInicio();
    else if (pantalla === 'mapa') renderMapa();
    else if (pantalla === 'practica') renderPractica();
    else if (pantalla === 'brief' && brief) iniciarBrief(brief.desc);
    else if (pantalla === 'juego' && G) { construirJuego(); var d = tutDef(); if (d) oraDecir(t(d[Math.min(G.tutStep, d.length - 1)].say), { tut: true }); else ocultarOra(); mostrar('juego'); }
    else if (pantalla === 'res' && G && G.res) renderRes(true);
    // la partida en segundo plano (pantalla de inicio, mapa…) también cambia de idioma, aunque no se vea
    if (G && pantalla !== 'juego' && pantalla !== 'res') { try { construirJuego(); } catch (er) {} }
    if (ovAbierto === 'pausa') pausar();
  }

  /* ================= Cómo jugar ================= */
  var como = { i: 0 };
  function abrirComo() { como.i = 0; como.prev = 0; renderComo(); abrirOv('como'); }
  function filaMini(nom, v, k, chips) { return '<div class="fila' + (k ? ' ' + k : '') + '"><span class="ico">' + svg(nom) + '</span><span class="nom">' + esc(t('sys')[nom]) + '</span><span class="barra"><i class="f" style="width:' + (v * 100) + '%"></i></span><span class="chips">' + (chips || '') + '</span></div>'; }
  function renderComo() {
    var sl = [
      { h: t('how1t'), p: t('how1'), m: ['radar', 'nav', 'energia', 'acople'].map(function (k) { return filaMini(k, 0.25); }).join('') },
      { h: t('how2t'), p: t('how2'), m: '<div id="cm2">' + filaMini('radar', 0.25, 'sel') + filaMini('nav', 0.25) + filaMini('energia', 0.25) + filaMini('acople', 0.25) + '</div><div class="act"><button class="btn pri" id="cmLeer" type="button" style="width:auto">📡 ' + esc(t('how2b')) + '</button></div>' },
      { h: t('how3t'), p: t('how3'), m: '<div class="lamps" id="cmL">' + new Array(10).join('<i></i>') + '<i></i></div><div class="lamps-l"><span>▲ ' + esc(t('alert')) + '</span><span>' + esc(t('reliab', { k: 9 })) + '</span></div>' },
      { h: t('how4t'), p: t('how4'), m: filaMini('radar', 0.96, 'sel top') + '<div class="act" style="margin-top:6px"><button class="rep" id="cmRep" type="button" style="min-width:220px"><i class="fillh"></i><svg class="ring" viewBox="0 0 36 36"><circle class="bgc" cx="18" cy="18" r="15"/><circle class="fg" cx="18" cy="18" r="15"/></svg><span class="rl"><b>' + esc(t('repair').toUpperCase()) + '</b><small>' + esc(t('repairHold')) + '</small></span></button></div>' }
    ];
    var html = '<div class="card how"><div class="top"><h2>' + esc(t('howTitle')) + '</h2><button class="x" id="cX" type="button" aria-label="' + esc(t('close')) + '">×</button></div><div class="slides-w"><div class="slides" id="cS" style="transform:translateX(' + (-(como.prev != null ? como.prev : como.i) * 100) + '%)">' +
      sl.map(function (s, k) { return '<div class="slide"' + (k !== como.i ? ' inert aria-hidden="true"' : '') + '><h3>' + (k + 1) + '. ' + esc(s.h) + '</h3><p>' + esc(s.p) + '</p><div class="mini">' + s.m + '</div></div>'; }).join('') + '</div></div>' +
      '<div class="dotsnav">' + sl.map(function (s, k) { return '<button type="button" data-k="' + k + '" aria-label="' + (k + 1) + '" aria-current="' + (k === como.i) + '"></button>'; }).join('') + '</div>' +
      '<div class="row2"><button class="btn" id="cP" type="button"' + (como.i === 0 ? ' disabled' : '') + '>' + esc(t('howPrev')) + '</button>' +
      (como.i < 3 ? '<button class="btn pri" id="cN" type="button">' + esc(t('howNext')) + '</button>' : '<button class="btn pri" id="cJ" type="button">' + esc(t('howPlay')) + '</button>') + '</div></div>';
    $('#ov-como').innerHTML = html;
    if (como.prev != null && como.prev !== como.i) { var cs0 = $('#cS'); void cs0.offsetWidth; cs0.style.transform = 'translateX(' + (-como.i * 100) + '%)'; }
    como.prev = como.i;
    var ir = function (k) { k = Math.max(0, Math.min(3, k)); if (k === como.i) return; var foco = document.activeElement && document.activeElement.id; como.prev = como.i; como.i = k; sfx('panel'); renderComo(); var fb = foco && $('#' + foco); if (!fb || fb.disabled) fb = $('#cN') || $('#cJ'); if (fb && !matchMedia('(pointer:coarse)').matches) fb.focus({ preventScroll: true }); };
    $('#cX').onclick = cerrarOv;
    if ($('#cP')) $('#cP').onclick = function () { ir(como.i - 1); };
    if ($('#cN')) $('#cN').onclick = function () { ir(como.i + 1); };
    if ($('#cJ')) $('#cJ').onclick = function () { cerrarOv(); if (G && pantalla === 'juego') return; iniciarBrief(descCampana('1-1')); };
    $$('#ov-como .dotsnav button').forEach(function (b) { b.onclick = function () { ir(+b.getAttribute('data-k')); }; });
    var sx = null, s = $('#cS');
    s.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    s.addEventListener('pointerup', function (e) { if (sx == null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) ir(como.i + (dx < 0 ? 1 : -1)); });
    // escenas vivas
    if (como.i === 1) {
      var n = 0;
      $('#cmLeer').onclick = function () {
        var vals = n === 0 ? [0.75, 0.083, 0.083, 0.083] : n === 1 ? [0.964, 0.012, 0.012, 0.012] : [0.25, 0.25, 0.25, 0.25];
        sfx(n < 2 ? 'scan' : 'desel'); var nn = n;
        setTimeout(function () { if (nn < 2) sfx('alerta'); $$('#cm2 .fila').forEach(function (f, k) { $('.f', f).style.width = (vals[k] * 100) + '%'; if (k === 0) $('.chips', f).innerHTML = nn === 0 ? '<span class="chip A nw">▲</span>' : nn === 1 ? '<span class="chip A">▲</span><span class="chip A nw">▲</span>' : ''; }); }, 250);
        n = (n + 1) % 3;
      };
    }
    if (como.i === 2) {
      var ls = $$('#cmL i'), k2 = 0, mentira = 6;
      clearInterval(renderComo.tm);
      renderComo.tm = setInterval(function () {
        if (!$('#cmL') || ovAbierto !== 'como' || como.i !== 2) { clearInterval(renderComo.tm); return; }
        if (k2 >= 10) { ls.forEach(function (l) { l.className = ''; l.textContent = ''; }); k2 = 0; mentira = (mentira + 3) % 10; return; }
        var l = ls[k2]; if (k2 === mentira) { l.className = 'L'; l.textContent = '○'; sfx('normal'); } else { l.className = 'A'; l.textContent = '▲'; if (k2 % 3 === 0) sfx('tecla'); }
        k2++;
      }, 420);
    }
    if (como.i === 3) {
      var b = $('#cmRep'), h = null, snd = null;
      var ini = function (e) { e.preventDefault(); if (h) return; var t0 = performance.now(); snd = sfx('mantener'); (function f() { var p = Math.min(1, (performance.now() - t0) / HOLD); $('.fg', b).style.strokeDashoffset = 94.25 * (1 - p); $('.fillh', b).style.transform = 'scaleX(' + p + ')'; if (p >= 1) { h = null; if (snd) snd.stop(); sfx('ok'); $('small', b).textContent = t('how4ok'); setTimeout(function () { if (b.isConnected) { $('small', b).textContent = t('repairHold'); $('.fg', b).style.strokeDashoffset = 94.25; $('.fillh', b).style.transform = 'scaleX(0)'; } }, 1400); return; } h = requestAnimationFrame(f); })(); };
      var fin = function () { if (h) { cancelAnimationFrame(h); h = null; if (snd) snd.stop(); $('.fg', b).style.strokeDashoffset = 94.25; $('.fillh', b).style.transform = 'scaleX(0)'; } };
      b.addEventListener('pointerdown', ini); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, fin); });
      b.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) ini(e); });
      b.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') fin(); });
    }
  }

  /* ================= Eventos de la partida ================= */
  $('#nodos').addEventListener('click', function (e) { var b = e.target.closest('.nodo'); if (b) seleccionar(+b.getAttribute('data-i')); });
  $('#filas').addEventListener('click', function (e) { var f = e.target.closest('.fila'); if (f) seleccionar(+f.getAttribute('data-i')); });
  $('#filas').addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('fila')) { e.preventDefault(); seleccionar(+e.target.getAttribute('data-i')); } });
  $('#zonas').addEventListener('click', function (e) { var b = e.target.closest('.zb'); if (b) seleccionar(100 + +b.getAttribute('data-z')); });
  (function () {
    var sens = $('#sensores'), lp = null, lpS = -1, saltar = false;
    sens.addEventListener('click', function (e) { var b = e.target.closest('.sen'); if (!b) return; if (saltar) { saltar = false; return; } leer(+b.getAttribute('data-s')); });
    sens.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('.sen'); if (!b || e.pointerType === 'mouse') return;
      lpS = +b.getAttribute('data-s'); clearTimeout(lp);
      lp = setTimeout(function () { previsualizar(lpS); if (G && G.prevS === lpS) { saltar = true; vib(10); } }, 350);
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) { sens.addEventListener(ev, function (e) { clearTimeout(lp); if (e.pointerType !== 'mouse' && G && G.prevS >= 0) limpiarPrev(); }); });
    sens.addEventListener('pointerover', function (e) { var b = e.target.closest('.sen'); if (b && e.pointerType === 'mouse') previsualizar(+b.getAttribute('data-s')); });
    sens.addEventListener('pointerout', function (e) { var b = e.target.closest('.sen'); if (b && e.pointerType === 'mouse' && (!e.relatedTarget || !b.contains(e.relatedTarget))) limpiarPrev(); });
    sens.addEventListener('focusin', function (e) { var b = e.target.closest('.sen'); if (b && b.matches(':focus-visible')) previsualizar(+b.getAttribute('data-s')); });
    sens.addEventListener('focusout', limpiarPrev);
    sens.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  })();
  (function () {
    var b = $('#bRep');
    b.addEventListener('pointerdown', function (e) { if (e.button && e.button !== 0) return; e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} inicioMantener(); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { b.addEventListener(ev, function () { finMantener(false); }); });
    b.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); inicioMantener(); } });
    b.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') finMantener(false); });
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  })();
  $('#bLog').onclick = function () { if ($('#sheet').classList.contains('on')) cerrarHoja(); else abrirHoja(); };
  $('#sheetX').onclick = cerrarHoja;
  $('#bPista').onclick = pista;
  $('#oraX').onclick = function () { var d = tutDef(); if (d && !d[Math.min(G.tutStep, d.length - 1)].libre) { tiembla($('#ora')); return; } ocultarOra(); };
  $('#bPausa').onclick = function () { sfx('boton'); pausar(); };
  $('#bAjustes').onclick = function () { sfx('boton'); if (pantalla === 'juego' && G && !G.st.fin) { pausar(); abrirAjustes('pausa'); } else abrirAjustes(null); };
  $('#bFs').onclick = alternarFS;
  $('#back').addEventListener('click', function () { if (G && pantalla === 'juego') guardar(); });
  // la confirmación (alertdialog) no se cierra tocando el fondo: sólo Cancelar o Escape
  $$('.ov').forEach(function (o) { o.addEventListener('click', function (e) { if (e.target !== o) return; if (ovAbierto === 'pausa') continuar(); else if (ovAbierto === 'ajustes') $('#aX').click(); else if (ovAbierto === 'confirm') { var c = $('#cfNo'); if (c) c.click(); } else cerrarOv(); }); });
  // RSP-GLOBAL-01: sin bloqueos globales de doble clic ni de gesto de zoom; el control de puntero queda sólo en Reparar (.rep) y el rango

  /* ================= Teclado ================= */
  var sensKeys = ['q', 'w', 'e', 'a', 's'];
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key.toLowerCase();
    if (k === 'm') { P.music = P.sfx = !(P.music || P.sfx); guardarPrefs(); aplicarPrefs(); toast((P.music ? '🔊 ' : '🔇 ') + t('music') + ' / ' + t('sfx')); return; }
    if (ovAbierto) {
      if (k === 'escape') { e.preventDefault(); if (ovAbierto === 'pausa') continuar(); else if (ovAbierto === 'ajustes') $('#aX').click(); else if (ovAbierto === 'copiar') $('#cpX').click(); else if (ovAbierto === 'confirm') { var cn = $('#cfNo'); if (cn) cn.click(); } else cerrarOv(); }
      else if (ovAbierto === 'como' && (k === 'arrowright' || k === 'arrowleft')) { var bt = $(k === 'arrowright' ? '#cN' : '#cP'); if (bt && !bt.disabled) bt.click(); }
      return;
    }
    if (pantalla === 'juego' && G) {
      // con la hoja del registro abierta, el fondo es inerte: ninguna tecla de la cabina actúa detrás
      if ($('#sheet').classList.contains('on')) { if (k === 'escape' || k === 'l') { e.preventDefault(); cerrarHoja(); } return; }
      if (k === 'escape' || k === 'p') { e.preventDefault(); pausar(); return; }
      if (G.st.fin) return;
      if (/^[0-9]$/.test(k)) { var n = k === '0' ? 9 : +k - 1; if (n < G.caso.N) seleccionar(n); return; }
      if (k === 'z' || k === 'x' || k === 'c') { var z = [2, 1, 0]['zxc'.indexOf(k)]; /* de izquierda a derecha, como en pantalla: Popa, Centro, Proa */ if (G.caso.hayZonas && G.caso.zonas[z]) seleccionar(100 + z); return; }
      var si = sensKeys.indexOf(k); if (si >= 0 && e.target.tagName !== 'INPUT') { if (si < G.st.sens.length && !e.repeat) leer(si); return; }
      if (k === 'r' && !e.repeat) { inicioMantener(); return; }
      if (k === 'l') { $('#bLog').click(); return; }
      if (k === 'h') { pista(); return; }
      if (k.indexOf('arrow') === 0) {
        e.preventDefault();
        var cur = G.sel && G.sel.T < 100 ? G.sel.T : -1, d = (k === 'arrowdown' || k === 'arrowright') ? 1 : -1;
        var nx = cur < 0 ? (d > 0 ? 0 : G.caso.N - 1) : (cur + d + G.caso.N) % G.caso.N;
        seleccionar(nx); var f = $('#filas .fila[data-i="' + nx + '"]'); if (f) f.scrollIntoView({ block: 'nearest' });
        return;
      }
      return;
    }
    if (k === 'escape') {
      if (pantalla === 'mapa' || pantalla === 'practica') { renderInicio(); mostrar('inicio'); }
      else if (pantalla === 'brief') $('#bVolver').click();
      else if (pantalla === 'res') { var h = $('#rHome'); if (h) h.click(); }
      return;
    }
    // PLAY-TELEMETRIA-05: en el resultado, Enter sólo actúa sobre el botón enfocado (nunca avanza de caso por un atajo global)
    if (k === 'enter' && document.activeElement === document.body && pantalla !== 'res') { var p = $('#s-' + pantalla + ' .btn.pri'); if (p) { e.preventDefault(); p.click(); } }
  });
  document.addEventListener('keyup', function (e) { if (e.key.toLowerCase() === 'r' && pantalla === 'juego') finMantener(false); });

  /* ================= Dibujo ================= */
  var tNow = 0, ultimoBg = 0;
  function libreAstro() { if (pantalla !== 'inicio') return 0; var pr = $('#s-inicio .prog'); return pr ? pr.getBoundingClientRect().bottom : 0; }
  function dibujar(forzar) {
    var bg = $('#bg');
    var modo = pantalla === 'juego' ? 'juego' : (pantalla === 'inicio' || pantalla === 'res') ? 'inicio' : 'juego';
    var luz = 'alarma', fr = 1;
    if (G && (pantalla === 'juego' || pantalla === 'res')) {
      fr = Math.max(0, G.st.aire) / G.caso.aire0;
      luz = G.st.fin === 'win' ? 'ok' : (G.st.fin === 'lose' || fr < 0.2) ? 'peligro' : (tNow - G.luzOk < 1.4 ? 'ok' : 'alarma');
    } else if (pantalla !== 'inicio') luz = 'calma';
    if (forzar || tNow - ultimoBg > (pantalla === 'juego' ? 1 / 30 : 0)) {
      ultimoBg = tNow;
      CABINA.fondo(bg, tNow, modo, luz === 'calma' ? 'ok' : luz, progresoRuta(), { cerca: pantalla === 'res' && G && G.st.fin === 'win', push: 0, libre: libreAstro() });
    }
    if (pantalla === 'juego' && G) {
      var geo = CABINA.nave($('#cvNave'), G.caso, { sel: G.sel, luz: luz, onda: G.onda, haz: G.haz }, tNow);
      var key = geo.pos.map(function (p) { return Math.round(p.x) + ',' + Math.round(p.y); }).join('|');
      if (key !== G.geoKey) {
        G.geoKey = key;
        var nd = $('#nodos'), mini = geo.nodo < 40; // nave llena: los nodos solo informan, se toca en la lista (filas de 46 px)
        nd.style.setProperty('--nd', Math.round(geo.nodo) + 'px'); nd.classList.toggle('llena', mini);
        $$('.nodo', nd).forEach(function (b) { b.tabIndex = mini ? -1 : 0; if (mini) b.setAttribute('aria-hidden', 'true'); else b.removeAttribute('aria-hidden'); });
        $$('#nodos .nodo').forEach(function (b) { var q = +b.getAttribute('data-i'), p = geo.pos[q]; if (p) { b.style.left = p.x + 'px'; b.style.top = p.y + 'px'; } });
      }
      CABINA.ventanilla($('#cvWin'), tNow, G.push, luz);
    }
  }
  function bucle(ts) { tNow = ts / 1000; if (!document.hidden) dibujar(false); requestAnimationFrame(bucle); }

  /* ================= Gancho de pruebas ================= */
  window.TELEMETRIA = {
    estado: function () {
      return {
        pantalla: pantalla, overlay: ovAbierto, layout: layout, fs: enFS(),
        caso: G ? { desc: G.desc, N: G.caso.N, nF: G.caso.nF, sis: G.caso.sis.map(function (s) { return s.k; }), sensores: G.caso.sensores.map(function (s) { return s.k; }), R: G.caso.R, Rx: G.caso.Rx, aire0: G.caso.aire0 } : null,
        aire: G ? G.st.aire : null, acciones: G ? G.st.acciones.slice() : [], creencia: G ? NUCLEO.marginales(G.st) : null, sel: G ? G.sel : null,
        fin: G ? G.st.fin : null, bloq: G ? G.bloq : null, tutStep: G ? G.tutStep : null, res: G && G.res ? Object.assign({}, G.res, { pasos: G.res.pasos.length }) : null,
        progreso: PR, diario: DI, prefs: P, lang: L
      };
    },
    seleccionar: seleccionar,
    leer: function (s, T) { if (T != null && G && (!G.sel || G.sel.T !== T)) seleccionar(T); leer(s); },
    reparar: function (i) { if (G && (!G.sel || G.sel.T !== i)) seleccionar(i); var b = G; if (puedeReparar() >= 0) reparar(i); return b; },
    piloto: function () { if (!G) return Promise.resolve(null); return wCall({ cmd: 'mejor', tpl: G.desc.tpl, s: G.desc.s, a: G.desc.a, acciones: accMin(G.st) }); },
    cargar: function (o) {
      o = o || {};
      if (o.diario) { abrirDiario(); return; }
      var id = o.caso || o.plantilla || '1-1', tpl = CASOS.porId[id]; if (!tpl) return false;
      var d = o.semilla != null ? { modo: 'prueba', id: 'P', tpl: id, s: o.semilla >>> 0, a: o.aire || airePlantilla(id) } : descCampana(id);
      if (o.brief) iniciarBrief(d); else iniciarJuego(d, [], {});
      return true;
    },
    saltar: function (n) {
      if (n === 'mapa') { renderMapa(); mostrar('mapa'); } else if (n === 'practica') { renderPractica(); mostrar('practica'); }
      else if (n === 'ajustes') abrirAjustes(null); else if (n === 'como') abrirComo(); else if (n === 'pausa') pausar(); else if (n === 'diario') abrirDiario();
      else { cerrarOv(); renderInicio(); mostrar('inicio'); }
    },
    get perf() { return { ms: PERF.slice(), worker: !!W && !wFail }; },
    verdad: function () { return DEBUG && G ? { F: G.caso.F.map(function (q) { return G.caso.sis[q].k; }), roto: G.caso.roto } : null; },
    reiniciarProgreso: function () { borrarTodo(); },
    ganarCapitulos: DEBUG ? function (n) { for (var c = 1; c <= n; c++) CASOS.capitulo(c).forEach(function (x) { PR.est[x.id] = 3; }); PR.tut3 = true; PR.jugado = true; guardarPR(); renderInicio(); } : undefined,
    alternarFS: alternarFS, pausar: pausar, continuar: continuar
  };

  /* ================= Arranque ================= */
  aplicarPrefs();
  relayout();
  syncDiario();
  renderInicio();
  mostrar('inicio');
  requestAnimationFrame(bucle);
  (function rutasURL() {
    var cs = QS.get('caso'), sm = QS.get('semilla');
    if (cs && CASOS.porId[cs]) {
      var tpl = CASOS.porId[cs], sOk = sm != null && /^\d{1,10}$/.test(sm) && +sm <= 4294967295;
      iniciarBrief(sOk ? { modo: 'prueba', id: 'P', tpl: cs, s: +sm >>> 0, a: airePlantilla(cs) } : Object.assign(descCampana(cs), { modo: 'prueba', id: cs }));
      return;
    }
    if (QS.has('diario')) {
      if (PR.tut3) abrirDiario();
      else iniciarBrief(Object.assign(descCampana('1-1'), { luego: 'diario' }));
      return;
    }
    var p = partidaGuardada();
    if (p && QS.has('continuar')) reanudar(p);
  })();
  // SRC-G05: el juego quedó listo; el estado de carga del HTML pasa a «listo» (loading/error/ready excluyentes)
  if (window.JETCarga) window.JETCarga.listo();
})();
