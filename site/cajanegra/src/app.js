// JET//Caja Negra · aplicación: pantallas, partida, verificación, guardado, tutorial, ajustes, pantalla completa.
(function () {
  'use strict';
  const W = window, CNX = W.CNX, TT = W.CN_T, DB = W.CN_DIBUJO, AU = W.CN_AUDIO, RG = W.CN_REG;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = RG.esc, ents = RG.ents;
  const ICON = DB.ICON;
  const CATS = CNX.gen.CATS;
  const params = new URLSearchParams(location.search);
  const DEBUG = params.get('debug') === '1';
  const PRE = 'jet-cajanegra:';

  // ───────────── Guardado (todo en try/catch) ─────────────
  let hayLS = true;
  try { localStorage.setItem(PRE + 't', '1'); localStorage.removeItem(PRE + 't'); } catch (e) { hayLS = false; }
  function lsGet(k, d) { try { const v = localStorage.getItem(PRE + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(PRE + k, JSON.stringify(v)); } catch (e) { /* sin guardado */ } }
  if (lsGet('v', null) == null) lsSet('v', 1);

  const AJ_DEF = { musica: true, volMusica: 0.7, efectos: true, volEfectos: 0.8, vibracion: true, cronometro: true, textoGrande: false, altoContraste: false, movimiento: false };
  let AJ = Object.assign({}, AJ_DEF, lsGet('ajustes', {}));
  let TUT = Object.assign({ t1: false, t2: false, t3: false, saltado: false }, lsGet('tutorial', {}));
  let DIARIO = lsGet('diario', {});
  let CAMP = lsGet('campana', {});
  const ST_DEF = { jugados: 0, resueltos: 0, primer: 0, sumaEnv: 0, sumaT: 0, hist: [0, 0, 0, 0, 0], racha: 0, rachaMax: 0, ultimoDiario: null, puntos: 0, insignias: {}, tres: 0, rendidos: 0, vioCadena: false };
  let ST = Object.assign({}, ST_DEF, lsGet('stats', {}));
  let PART = Object.assign({ actual: null, p: {} }, lsGet('partida', {}));
  const guardarAj = () => lsSet('ajustes', AJ);
  const guardarTodo = () => { lsSet('tutorial', TUT); lsSet('diario', DIARIO); lsSet('campana', CAMP); lsSet('stats', ST); };

  // ───────────── Idioma ─────────────
  // Una sola elección para todo jetgames.fun: _shared/jet-idioma.js (?lang > cookie jet_lang / localStorage > navegador).
  // Migración única: si este juego guardaba su propio idioma y el sitio todavía no tiene elección, se pasa a JETIdioma.
  const JI = W.JETIdioma || { get: () => 'es', set: () => {} };
  if (AJ.idioma === 'es' || AJ.idioma === 'en') {
    let haySitio = /(?:^|;\s*)jet_lang=(es|en)\b/.test(document.cookie);
    if (!haySitio) { try { haySitio = /^(es|en)$/.test(localStorage.getItem('jet_lang') || ''); } catch (e) { /* nada */ } }
    if (!haySitio && !params.get('lang')) JI.set(AJ.idioma);
  }
  if ('idioma' in AJ) { delete AJ.idioma; guardarAj(); }
  let L = JI.get() === 'en' ? 'en' : 'es';
  const mqRaton = W.matchMedia ? W.matchMedia('(hover: hover) and (pointer: fine)') : null;
  const mqTactil = W.matchMedia ? W.matchMedia('(any-pointer: coarse)') : null;
  const conRaton = () => !!(mqRaton && mqRaton.matches) && !(mqTactil && mqTactil.matches);
  function t(k, v) {
    // Con ratón (sin pantalla táctil) se dice «haz clic» / «click» en vez de «toca» / «tap».
    if (conRaton() && TT[L] && TT[L][k + '.pc'] != null) k += '.pc';
    let s = (TT[L] && TT[L][k] != null) ? TT[L][k] : (TT.es[k] != null ? TT.es[k] : k);
    if (v) for (const x in v) s = s.split('{' + x + '}').join(v[x]);
    return s;
  }
  const tituloJuego = () => 'JET<i>//</i>' + t('titulo.a') + ' ' + t('titulo.b');

  // ───────────── Estado de ejecución ─────────────
  const G = {
    pantalla: 'inicio', ref: null, caso: null, P: null, activo: null, mano: null, bancoAbierto: false, verTodas: false,
    layout: 'port', pausado: false, ocupado: false, apertura: false, foto: { z: 1, x: 0.5, y: 0.5 }, descFoto: false, tablaTel: false,
    regEnts: [], fotoCtl: null, telCtl: null, split: null, tut: null, fechaForzada: null, estabaFS: false, focoFicha: -1
  };
  try { const s = sessionStorage.getItem(PRE + 'split'); if (s) G.split = JSON.parse(s); } catch (e) { /* */ }
  const CACHE = {};
  const quieto = () => AJ.movimiento || W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fechaJuego = () => G.fechaForzada || CNX.cal.fechaLocal();
  const tutorialHecho = () => TUT.saltado || TUT.t3;
  const vibrar = (p) => { if (AJ.vibracion && navigator.vibrate) try { navigator.vibrate(p); } catch (e) { /* */ } };
  const sfx = (n, a) => AU.sfx(n, a);

  function keyRef(r) { return r.modo + ':' + (r.fecha || r.i || r.semilla || r.n || 0) + ':' + (r.dif || ''); }
  function casoDe(ref) {
    const k = keyRef(ref);
    if (CACHE[k]) return CACHE[k];
    let c = null;
    if (ref.modo === 'diario') c = CNX.cal.casoDiario(ref.fecha);
    else if (ref.modo === 'campana') c = CNX.campana.casoCampana(ref.i);
    else if (ref.modo === 'practica') { c = CNX.gen.generar({ semilla: ref.semilla, dif: ref.dif }); if (c) c.id = 'p' + ref.semilla; }
    else if (ref.modo === 'tutorial') c = CNX.campana.tutorial(ref.n);
    CACHE[k] = c;
    return c;
  }
  function nombreCaso(ref, caso) {
    if (ref.modo === 'diario') return t('modo.diario', { n: caso.num });
    if (ref.modo === 'campana') return t('modo.campana', { n: ref.i + 1, t: caso.titulo[L] });
    if (ref.modo === 'practica') return t('modo.practica', { id: CNX.b36(ref.semilla) });
    return t('modo.tutorial', { n: ref.n, t: caso.titulo[L] });
  }
  const idsHuecos = (caso) => Object.keys(caso.huecos).sort((a, b) => +a.slice(1) - +b.slice(1));
  const llenos = (P, caso) => idsHuecos(caso).filter((h) => P.huecos[h] != null).length;

  // ───────────── Utilidades de interfaz ─────────────
  let toastT = 0;
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 1600); }
  function anunciar(msg) { const v = $('#vivo'); v.textContent = ''; setTimeout(() => { v.textContent = msg; }, 30); }
  function fmtT(ms) { const s = Math.floor(ms / 1000); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(ss).padStart(2, '0'); }
  function cuentaAtras() { const ms = CNX.cal.msHastaMedianoche(); const s = Math.floor(ms / 1000); return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((x) => String(x).padStart(2, '0')).join(':'); }
  function rango(p) { const R = CNX.mundo.RANGOS; let i = 0; for (let k = 0; k < R.length; k++) if (p >= R[k].min) i = k; return { i, nombre: t('rango.' + i), sig: R[i + 1] || null, min: R[i].min }; }
  function rachaVigente() { const hoy = fechaJuego(); if (!ST.ultimoDiario) return 0; return (ST.ultimoDiario === hoy || ST.ultimoDiario === CNX.cal.sumarDias(hoy, -1)) ? ST.racha : 0; }

  // ───────────── Pantalla completa ─────────────
  const esIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const fsOK = !esIOS && !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  const enFS = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function alternarFS() {
    try {
      if (enFS()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else { const el = document.documentElement; const r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' }); if (r && r.catch) r.catch(() => {}); }
    } catch (e) { /* */ }
  }
  function alCambiarFS() {
    pintarBotonesFS();
    // Salir de pantalla completa a mitad de partida pausa, salvo que se haga desde Ajustes (ahí el reloj ya está quieto).
    if (G.estabaFS && !enFS() && G.pantalla === 'juego' && partidaViva() && !ajustesAbiertos()) pausar(true);
    G.estabaFS = enFS();
    relayout();
  }
  document.addEventListener('fullscreenchange', alCambiarFS);
  document.addEventListener('webkitfullscreenchange', alCambiarFS);
  function pintarBotonesFS() {
    const b = $('#bFS');
    b.hidden = !fsOK;
    b.innerHTML = enFS() ? ICON.salirPantalla : ICON.pantalla;
    b.setAttribute('aria-label', enFS() ? t('btn.salirPantalla') : t('btn.pantalla'));
    b.title = b.getAttribute('aria-label');
  }

  // ───────────── Pantallas ─────────────
  function irA(nombre, opts) {
    opts = opts || {};
    cerrarGlobo();
    $$('.scr').forEach((s) => s.classList.remove('on'));
    const jg = $('#sJuego');
    jg.classList.toggle('on', nombre === 'juego');
    jg.setAttribute('aria-hidden', nombre === 'juego' ? 'false' : 'true');
    document.body.classList.toggle('enJuego', nombre === 'juego');
    const prev = G.pantalla;
    G.pantalla = nombre;
    if (prev !== nombre && prev && nombre !== 'juego') sfx('transicion');
    if (nombre === 'inicio') renderInicio();
    else if (nombre === 'campana') renderCampana();
    else if (nombre === 'practica') renderPractica();
    else if (nombre === 'stats') renderStats();
    else if (nombre === 'ayuda') renderAyuda();
    else if (nombre === 'resultado') renderResultado(opts.info);
    const id = { inicio: 'sInicio', campana: 'sCampana', practica: 'sPractica', stats: 'sStats', ayuda: 'sAyuda', resultado: 'sResultado' }[nombre];
    if (id) { const el = $('#' + id); el.classList.add('on'); el.scrollTop = 0; }
    if (nombre !== 'juego' && nombre !== 'resultado') AU.tema('menu');
    if (nombre === 'juego') AU.tema('juego');
    animarCaja(nombre === 'inicio');
  }

  // ── Inicio
  let cajaRaf = 0;
  function animarCaja(on) {
    cancelAnimationFrame(cajaRaf); cajaRaf = 0;
    if (!on) return;
    const cv = $('#cajaCv');
    if (!cv) return;
    const paso = (ts) => {
      if (G.pantalla !== 'inicio' || !cv.isConnected) return;
      const d = Math.min(3, W.devicePixelRatio || 1);
      const w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
      const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
      DB.cajaNegra(c, w, h, quieto() ? 0 : ts, { esc: 0.3, ang: quieto() ? -0.62 : null });
      if (!quieto() && !document.hidden) cajaRaf = requestAnimationFrame(paso);
    };
    cajaRaf = requestAnimationFrame(paso);
  }
  function partidaPendiente() {
    const k = PART.actual;
    const P = k && PART.p[k];
    if (!P || P.resuelto || P.rendido) return null;
    if (P.ref.modo === 'diario' && Math.abs(CNX.cal.diasEntre(P.ref.fecha, fechaJuego())) > 1) return null;
    const caso = casoDe(P.ref);
    if (!caso) return null;
    return { P, caso };
  }
  function renderInicio() {
    const hoy = fechaJuego();
    const num = CNX.cal.numCaso(hoy);
    const d = DIARIO[hoy];
    const tut = tutorialHecho();
    const pend = partidaPendiente();
    const opD = CNX.cal.opcionesDiario(hoy);
    const rg = rango(ST.puntos);
    const racha = rachaVigente();
    const camHechos = Object.keys(CAMP).filter((k) => CAMP[k] && CAMP[k].estrellas).length;
    let h = '<div class="hoja inicio"><div class="card"><div class="colA"><div class="kick" style="text-align:center">' + t('kick') + '</div><canvas id="cajaCv" aria-hidden="true"></canvas></div><div class="colB">';
    h += '<h1 class="logo">' + tituloJuego() + '</h1><p class="lema">' + t('lema') + '</p>';
    const pendHoy = pend && pend.P.ref.modo === 'diario' && pend.P.ref.fecha === hoy;
    if (pend && !(pend.P.ref.modo === 'diario' && d) && !(pendHoy && tut)) {
      h += '<button class="continuar" id="iCont">' + ICON.play + '<span>' + esc(t('btn.continuarPartida', { caso: nombreCaso(pend.P.ref, pend.caso), a: llenos(pend.P, pend.caso), b: idsHuecos(pend.caso).length })) + '</span></button>';
    }
    if (!tut) {
      h += '<button class="btn pri" id="iEmpezar">' + t('btn.empezar') + '<small>' + t('btn.empezarSub') + '</small></button>';
    } else if (!d) {
      if (pendHoy) h += '<button class="btn pri" id="iDiario">' + esc(t('btn.diarioSigue', { n: num })) + '<small>' + esc(t('btn.diarioSigueSub', { a: llenos(pend.P, pend.caso), b: idsHuecos(pend.caso).length, dif: t('dif.' + opD.dif) })) + '</small></button>';
      else h += '<button class="btn pri" id="iDiario">' + esc(t('btn.diario', { n: num })) + '<small>' + esc(t('btn.diarioSub', { dif: t('dif.' + opD.dif) })) + '</small></button>';
    } else {
      h += '<div class="estadoDia"><span id="iCuenta">' + esc(t(d.rendido ? 'btn.diarioRendido' : 'btn.diarioResuelto', { t: cuentaAtras() })) + '</span><button class="btn borde" id="iVer">' + t('btn.diarioHecho') + '</button></div>';
    }
    const cand = tut ? '' : '<span class="candado">' + ICON.candado + '</span>';
    const sub = (x) => (tut ? x : t('inicio.bloqueado'));
    h += '<div class="fila">';
    h += '<button class="btn ' + (tut && d ? 'pri' : 'sec') + '" id="iCampana"' + (tut ? '' : ' disabled') + '>' + cand + t('btn.campana') + '<small>' + esc(sub(t('btn.campanaSub', { a: camHechos, b: 24 }))) + '</small></button>';
    h += '<button class="btn sec" id="iPractica"' + (tut ? '' : ' disabled') + '>' + cand + t('btn.practica') + '<small>' + esc(sub(t('btn.practicaSub'))) + '</small></button>';
    h += '</div><div class="terciarios"><button class="txtbtn" id="iAyuda">' + t('btn.comoJugar') + '</button><button class="txtbtn" id="iStats">' + t('btn.estadisticas') + '</button>' + '<div class="seg segIdioma" role="group" aria-label="' + esc(t('aj.idioma')) + '"><button id="iEs" lang="es" aria-pressed="' + (L === 'es') + '">ES</button><button id="iEn" lang="en" aria-pressed="' + (L === 'en') + '">EN</button></div></div>';
    h += '<div class="pie-inicio"><span class="racha">' + ICON.fuego + t('inicio.racha') + ' <b>' + (racha === 1 ? t('inicio.dia') : t('inicio.dias', { n: racha })) + '</b></span><span>' + t('inicio.rango') + ' <b>' + esc(rg.nombre) + '</b></span></div>';
    if (!hayLS) h += '<p class="aviso">' + t('aviso.sinGuardado') + '</p>';
    h += '</div></div></div>';
    const el = $('#sInicio');
    el.innerHTML = h;
    const on = (id, fn) => { const b = $('#' + id, el); if (b) b.addEventListener('click', () => { sfx('boton'); fn(); }); };
    on('iCont', () => continuarPartida(pend.P));
    on('iEmpezar', () => empezarTutorial());
    on('iDiario', () => empezar({ modo: 'diario', fecha: hoy }));
    on('iVer', () => verInformeDiario(hoy));
    on('iCampana', () => irA('campana'));
    on('iPractica', () => irA('practica'));
    on('iAyuda', () => { ayudaVuelta = 'inicio'; irA('ayuda'); });
    on('iStats', () => irA('stats'));
    { const bE = $('#iEs', el), bN = $('#iEn', el); if (bE) bE.addEventListener('click', () => cambiarIdioma('es')); if (bN) bN.addEventListener('click', () => cambiarIdioma('en')); }
    on('iFS', () => { alternarFS(); });
    animarCaja(true);
  }

  // ── Campaña
  function campanaDisponible(i) { return i === 0 || !!(CAMP['c' + String(i).padStart(2, '0')] && CAMP['c' + String(i).padStart(2, '0')].estrellas); }
  function renderCampana() {
    const C = CNX.campana;
    let abierta = 0;
    for (let i = 0; i < 24; i++) if (campanaDisponible(i)) abierta = Math.floor(i / 6);
    let h = '<div class="hoja ancha"><div class="cab"><h2>' + t('camp.titulo') + '</h2><button class="x" data-volver aria-label="' + t('btn.volver') + '">' + ICON.cerrar + '</button></div>';
    C.CARPETAS.forEach((cp, f) => {
      const hechos = [0, 1, 2, 3, 4, 5].filter((k) => CAMP['c' + String(f * 6 + k + 1).padStart(2, '0')] && CAMP['c' + String(f * 6 + k + 1).padStart(2, '0')].estrellas).length;
      h += '<div class="carpeta' + (f === abierta ? ' abierta' : '') + '"><button class="cabC" aria-expanded="' + (f === abierta) + '">' + ICON.carpeta + '<span><b>' + esc(t('camp.carpeta', { n: f + 1 }) + ' · ' + cp.titulo[L]) + '</b><small>' + hechos + '/6</small></span><span class="prog">' + (hechos === 6 ? '✓' : '') + '</span></button><div class="cuerpoC"><p class="intro">' + esc(f === 0 && hechos === 0 ? t('camp.vacio') : cp.intro[L]) + '</p><div class="casos">';
      for (let k = 0; k < 6; k++) {
        const i = f * 6 + k;
        const r = CAMP['c' + String(i + 1).padStart(2, '0')];
        const disp = campanaDisponible(i);
        const hecho = r && r.estrellas;
        h += '<button class="casoF' + (hecho ? ' hecho' : disp ? ' disp' : '') + '" data-i="' + i + '"' + (disp ? '' : ' disabled aria-label="' + t('camp.bloqueado') + '"') + '><span class="n">' + String(i + 1).padStart(2, '0') + '</span><span class="t">' + esc(C.CASOS[i].titulo[L]) + '</span>' + (hecho ? '<span class="st">' + '★'.repeat(r.estrellas) + '<span style="opacity:.3">' + '★'.repeat(3 - r.estrellas) + '</span></span>' : '') + (disp ? '' : ICON.candado) + '</button>';
      }
      h += '</div>' + (hechos === 6 ? '<p class="cierreC">' + esc(cp.cierre[L]) + '</p>' : '') + '</div></div>';
    });
    h += '</div>';
    const el = $('#sCampana'); el.innerHTML = h;
    $$('.cabC', el).forEach((b) => b.addEventListener('click', () => { const c = b.parentElement; c.classList.toggle('abierta'); b.setAttribute('aria-expanded', c.classList.contains('abierta')); sfx('registro'); }));
    $$('.casoF', el).forEach((b) => b.addEventListener('click', () => { sfx('boton'); empezar({ modo: 'campana', i: +b.dataset.i }); }));
    $('[data-volver]', el).addEventListener('click', () => irA('inicio'));
  }

  // ── Práctica
  function renderPractica() {
    const P = PART.p.practica;
    let h = '<div class="hoja"><div class="cab"><h2>' + t('prac.titulo') + '</h2><button class="x" data-volver aria-label="' + t('btn.volver') + '">' + ICON.cerrar + '</button></div><div class="prac">';
    if (P && !P.resuelto && !P.rendido) h += '<button class="continuar" id="pCont">' + ICON.play + '<span>' + esc(t('prac.continuar', { id: CNX.b36(P.ref.semilla) })) + '</span></button>';
    const info = [[6, 4], ['8-9', 5], ['10-12', 6]];
    for (let d = 1; d <= 3; d++) h += '<div class="pracT"><div class="info"><b>' + t('dif.' + d) + '</b><small>' + esc(t('prac.info', { h: info[d - 1][0], r: info[d - 1][1] })) + '</small></div><button class="btn ' + (d === 2 ? 'pri' : 'sec') + '" data-d="' + d + '" style="min-height:52px;font-size:15px">' + t('prac.nuevo') + '</button></div>';
    h += '</div><p class="nota">' + t('prac.nota') + '</p></div>';
    const el = $('#sPractica'); el.innerHTML = h;
    $$('[data-d]', el).forEach((b) => b.addEventListener('click', () => { sfx('boton'); empezar({ modo: 'practica', dif: +b.dataset.d, semilla: Math.floor(Math.random() * 60466175) + 1 }); }));
    const c = $('#pCont', el); if (c) c.addEventListener('click', () => continuarPartida(P));
    $('[data-volver]', el).addEventListener('click', () => irA('inicio'));
  }

  // ── Estadísticas
  const INSIGNIAS = ['primerLimpio', 'sinDudas', 'oidoFino', 'ojo', 'curvas', 'planes', 'archivo', 'tutorial', 'diez', 'constancia', 'dificil', 'firma'];
  function renderStats() {
    const rg = rango(ST.puntos);
    const pct = ST.resueltos ? Math.round((ST.primer / ST.resueltos) * 100) : 0;
    const med = ST.resueltos ? (ST.sumaEnv / ST.resueltos).toFixed(1).replace('.', L === 'es' ? ',' : '.') : '—';
    const tmed = ST.resueltos ? fmtT(ST.sumaT / ST.resueltos) : '—';
    let h = '<div class="hoja"><div class="cab"><h2>' + t('st.titulo') + '</h2><button class="x" data-volver aria-label="' + t('btn.volver') + '">' + ICON.cerrar + '</button></div><div class="card">';
    if (!ST.resueltos) h += '<p class="nota" style="margin:0 0 14px">' + t('st.vacio') + '</p>';
    h += '<div class="cifras">' + [[ST.resueltos, 'st.resueltos'], [pct + '%', 'st.primero'], [med, 'st.envios'], [tmed, 'st.tiempo'], [rachaVigente(), 'st.racha'], [ST.rachaMax, 'st.rachaMax']].map(([v, k]) => '<div class="cifra"><b>' + esc(String(v)) + '</b><small>' + t(k) + '</small></div>').join('') + '</div>';
    const mx = Math.max(1, ...ST.hist);
    h += '<div class="secT">' + t('st.hist') + '</div><div class="histo">' + ST.hist.map((n, i) => '<div><span>' + (i === 4 ? '5+' : i + 1) + '</span><i style="width:' + Math.max(8, (n / mx) * 100) + '%">' + n + '</i></div>').join('') + '</div>';
    h += '<div class="secT">' + t('st.rango') + ' · ' + esc(rg.nombre) + '</div><div class="rangoBar"><i style="width:' + (rg.sig ? Math.min(100, ((ST.puntos - rg.min) / (rg.sig.min - rg.min)) * 100) : 100) + '%"></i></div><p class="nota" style="margin:4px 0 0;text-align:left">' + (rg.sig ? esc(t('st.siguiente', { p: rg.sig.min - ST.puntos, r: t('rango.' + (rg.i + 1)) })) : t('st.maximo')) + ' · ' + ST.puntos + ' pts</p>';
    h += '<div class="secT">' + t('st.insignias') + '</div><div class="insignias">' + INSIGNIAS.map((k) => '<div class="ins' + (ST.insignias[k] ? ' si' : '') + '">' + ICON.estrella + '<span><b>' + t('ins.' + k) + '</b><small>' + t('ins.' + k + '.d') + '</small></span></div>').join('') + '</div>';
    h += '</div></div>';
    const el = $('#sStats'); el.innerHTML = h;
    $('[data-volver]', el).addEventListener('click', () => irA('inicio'));
  }

  // ── Cómo jugar (láminas animadas)
  let ayudaT = 0, ayudaI = 0, ayudaVuelta = 'inicio';
  function renderAyuda() {
    let h = '<div class="hoja ayuda"><div class="cab"><h2>' + t('ayuda.titulo') + '</h2><button class="x" data-volver aria-label="' + t('btn.volver') + '">' + ICON.cerrar + '</button></div><div class="laminas" id="lams"><div class="tira" id="tira">';
    h += '<div class="lamina lam1"><p>' + t('ayuda.l1') + '</p><div class="escena"><div class="miniReg" style="left:0;top:4%"><b>' + t('reg.radio').toUpperCase() + '</b>14:29 <span class="ent mkA">ALBA-3</span>: …<br>14:33 ALBA-1: …</div><div class="miniReg" style="right:0;top:34%"><b>' + t('reg.tripulacion').toUpperCase() + '</b>ALBA-1 · Irene Sato<br><span class="ent mkA">ALBA-3</span> · Tomás Okafor</div><div class="dedo"></div></div></div>';
    h += '<div class="lamina lam2"><p>' + t('ayuda.l2') + '</p><div class="escena"><div class="miniInf">' + (L === 'es' ? 'A las 14:31, ' : 'At 14:31, ') + '<span class="miniHueco"></span>' + (L === 'es' ? ' abrió la esclusa B.' : ' opened airlock B.') + '</div><div class="miniBank"><span class="miniFicha ok">Lena Varga</span><span class="miniFicha">Irene Sato</span><span class="miniFicha">Tomás Okafor</span></div><div class="dedo"></div></div></div>';
    h += '<div class="lamina lam3"><p>' + t('ayuda.l3') + '</p><div class="escena"><div class="miniBanda am">' + t('ver.errores2') + '</div><div class="miniBanda ro">' + t('ver.noSostiene') + '</div></div></div>';
    h += '</div></div><div class="puntos" id="ptos">' + [0, 1, 2].map((i) => '<button aria-label="' + (i + 1) + '/3"></button>').join('') + '</div>';
    h += '<p class="ayudaTxt">' + t('ayuda.estrellas') + '</p><button class="btn pri" id="aPract">' + t('ayuda.practicar') + '</button><p class="tecla">' + t('ayuda.teclado') + '</p></div>';
    const el = $('#sAyuda'); el.innerHTML = h;
    const ir = (i) => { ayudaI = (i + 3) % 3; $('#tira', el).style.transform = 'translateX(' + (-ayudaI * 100) + '%)'; $$('#ptos button', el).forEach((b, k) => b.classList.toggle('on', k === ayudaI)); $$('.lamina', el).forEach((l, k) => { l.style.visibility = k === ayudaI ? 'visible' : 'hidden'; }); reiniciar(); };
    const reiniciar = () => { clearInterval(ayudaT); ayudaT = setInterval(() => { if (G.pantalla !== 'ayuda') return clearInterval(ayudaT); ir(ayudaI + 1); }, 4000); };
    $$('#ptos button', el).forEach((b, k) => b.addEventListener('click', () => ir(k)));
    let x0 = null;
    const lams = $('#lams', el);
    lams.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    lams.addEventListener('pointerup', (e) => { if (x0 != null && Math.abs(e.clientX - x0) > 40) ir(ayudaI + (e.clientX < x0 ? 1 : -1)); x0 = null; });
    $('#aPract', el).addEventListener('click', () => { sfx('boton'); empezar({ modo: 'tutorial', n: 1 }, { repaso: true }); });
    $('[data-volver]', el).addEventListener('click', () => { clearInterval(ayudaT); if (ayudaVuelta === 'juego' && G.P) { irA('juego'); pausar(true); } else irA('inicio'); });
    ir(0);
  }

  // ───────────── Ajustes ─────────────
  let borrarT = 0;
  function abrirAjustes() {
    const el = $('#sAjustes');
    const tog = (id, on, lab) => '<button class="tog" id="' + id + '" role="switch" aria-checked="' + !!on + '" aria-label="' + esc(lab) + '"></button>';
    let h = '<div class="card"><div class="cab"><h2>' + t('aj.titulo') + '</h2><button class="x" id="ajX" aria-label="' + t('btn.cerrar') + '">' + ICON.cerrar + '</button></div>';
    h += '<div class="set"><label for="rMus">' + t('aj.musica') + '</label><input type="range" id="rMus" min="0" max="100" value="' + Math.round(AJ.volMusica * 100) + '">' + tog('tMus', AJ.musica, t('aj.musica')) + '</div>';
    h += '<div class="set"><label for="rSfx">' + t('aj.efectos') + '</label><input type="range" id="rSfx" min="0" max="100" value="' + Math.round(AJ.volEfectos * 100) + '">' + tog('tSfx', AJ.efectos, t('aj.efectos')) + '</div>';
    h += '<div class="set"><span class="lab">' + t('aj.vibracion') + '</span>' + tog('tVib', AJ.vibracion, t('aj.vibracion')) + '</div>';
    h += '<div class="set"><span class="lab">' + t('aj.idioma') + '</span><div class="seg" role="group" aria-label="' + esc(t('aj.idioma')) + '"><button id="lEs" lang="es" aria-pressed="' + (L === 'es') + '">ES</button><button id="lEn" lang="en" aria-pressed="' + (L === 'en') + '">EN</button></div></div>';
    if (fsOK) h += '<div class="set"><span class="lab">' + t('aj.pantalla') + '</span>' + tog('tFS', enFS(), t('aj.pantalla')) + '</div>';
    h += '<div class="set"><span class="lab">' + t('aj.crono') + '</span>' + tog('tCro', AJ.cronometro, t('aj.crono')) + '</div>';
    h += '<div class="set"><span class="lab">' + t('aj.textoGrande') + '</span>' + tog('tTG', AJ.textoGrande, t('aj.textoGrande')) + '</div>';
    h += '<div class="set"><span class="lab">' + t('aj.contraste') + '</span>' + tog('tAC', AJ.altoContraste, t('aj.contraste')) + '</div>';
    h += '<div class="set"><span class="lab">' + t('aj.movimiento') + '</span>' + tog('tMov', AJ.movimiento, t('aj.movimiento')) + '</div>';
    h += '<button class="btn peligro" id="ajBorrar" style="margin-top:14px">' + t('aj.borrar') + '</button></div>';
    el.innerHTML = h;
    el.classList.add('on');
    const cambia = () => { guardarAj(); AU.volumenes({ musica: AJ.musica, volMusica: AJ.volMusica, efectos: AJ.efectos, volEfectos: AJ.volEfectos }); aplicarClases(); };
    const sw = (id, k, extra) => { const b = $('#' + id, el); if (!b) return; b.addEventListener('click', () => { AJ[k] = !AJ[k]; b.setAttribute('aria-checked', AJ[k]); cambia(); sfx('boton'); if (extra) extra(); }); };
    sw('tMus', 'musica'); sw('tSfx', 'efectos'); sw('tVib', 'vibracion', () => vibrar(15)); sw('tCro', 'cronometro', pintarCrono); sw('tTG', 'textoGrande', relayout); sw('tAC', 'altoContraste'); sw('tMov', 'movimiento');
    $('#rMus', el).addEventListener('input', (e) => { AJ.volMusica = e.target.value / 100; AJ.musica = true; $('#tMus', el).setAttribute('aria-checked', 'true'); cambia(); });
    $('#rSfx', el).addEventListener('input', (e) => { AJ.volEfectos = e.target.value / 100; AJ.efectos = true; $('#tSfx', el).setAttribute('aria-checked', 'true'); cambia(); });
    $('#rSfx', el).addEventListener('change', () => sfx('colocar'));
    const fsB = $('#tFS', el); if (fsB) fsB.addEventListener('click', () => { alternarFS(); setTimeout(() => fsB.setAttribute('aria-checked', enFS()), 300); });
    $('#lEs', el).addEventListener('click', () => cambiarIdioma('es'));
    $('#lEn', el).addEventListener('click', () => cambiarIdioma('en'));
    const bb = $('#ajBorrar', el);
    bb.addEventListener('click', () => {
      if (!bb.classList.contains('armado')) {
        bb.classList.add('armado'); bb.textContent = t('aj.borrarConfirma'); vibrar(20); sfx('faltan');
        clearTimeout(borrarT); borrarT = setTimeout(() => { bb.classList.remove('armado'); bb.textContent = t('aj.borrar'); }, 4000);
      } else {
        clearTimeout(borrarT);
        borrarProgreso();
        bb.classList.remove('armado'); bb.textContent = t('aj.borrar');
        toast(t('aj.borrado'));
      }
    });
    $('#ajX', el).addEventListener('click', cerrarAjustes);
    el.onclick = (e) => { if (e.target === el) cerrarAjustes(); };
    setTimeout(() => $('#ajX', el).focus(), 50);
  }
  const ajustesAbiertos = () => $('#sAjustes').classList.contains('on');
  function cerrarAjustes() {
    $('#sAjustes').classList.remove('on'); sfx('boton');
    if (G.pantalla === 'inicio') { renderInicio(); const b = $('#bAj'); if (b) b.focus({ preventScroll: true }); }
    else if ($('#pausa').classList.contains('on')) { const b = $('#pCont'); if (b) b.focus({ preventScroll: true }); }
    else if (G.pantalla === 'juego') { const b = $('#jAj'); if (b) b.focus({ preventScroll: true }); }
  }
  function borrarProgreso() {
    TUT = { t1: false, t2: false, t3: false, saltado: false }; DIARIO = {}; CAMP = {}; ST = JSON.parse(JSON.stringify(ST_DEF)); PART = { actual: null, p: {} };
    guardarTodo(); lsSet('partida', PART);
    G.P = null; G.caso = null; G.ultimoInfo = null;
    if (G.pausado) { G.pausado = false; AU.pausa(false); }
    $('#pausa').classList.remove('on');
    if (G.pantalla !== 'inicio') { cerrarAjustes(); irA('inicio'); } else renderInicio();
  }
  // Cambiar desde el juego: JETIdioma lo guarda para todo el sitio y avisa con 'jet-idioma'.
  function cambiarIdioma(l) {
    if (l !== 'es' && l !== 'en') return;
    if (l === L) return;
    sfx('boton');
    if (JI.get() !== l) JI.set(l);
    if (l !== L) aplicarIdioma(l);
  }
  W.addEventListener('jet-idioma', (e) => { const l = e && e.detail; if ((l === 'es' || l === 'en') && l !== L) aplicarIdioma(l); });
  // Repinta todo en vivo sin recargar ni perder la partida.
  function aplicarIdioma(l) {
    L = l;
    traducirFijos();
    if (ajustesAbiertos()) abrirAjustes();
    if (G.pantalla === 'juego') renderJuego(true);
    else if (G.pantalla === 'resultado' && G.ultimoInfo) renderResultado(G.ultimoInfo);
    else irA(G.pantalla);
    if (G.pausado) mostrarPausa();
  }
  function aplicarClases() {
    const r = document.documentElement;
    r.classList.toggle('grande', !!AJ.textoGrande);
    r.classList.toggle('contraste', !!AJ.altoContraste);
    r.classList.toggle('quieto', !!AJ.movimiento);
    if (fondo) { if (quieto()) { fondo.parar(); fondo.redibujar(); } else fondo.arrancar(); }
  }
  function traducirFijos() {
    document.documentElement.lang = L;
    document.title = t('doc.titulo');
    { const md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute('content', t('doc.desc')); }
    $('#back').setAttribute('aria-label', t('volver'));
    $('#bAj').innerHTML = ICON.engranaje; $('#bAj').setAttribute('aria-label', t('btn.ajustes')); $('#bAj').title = t('btn.ajustes');
    pintarBotonesFS();
  }

  // ───────────── Partida ─────────────
  function nuevaPartida(ref, caso) {
    const huecos = {}; for (const h of idsHuecos(caso)) huecos[h] = null;
    return { ref, id: caso.id, huecos, dudas: [], marcas: [], envios: [], tiempoMs: 0, reg: 0, scrollReg: 0, scrollInf: 0, activo: null, zoom: { z: 1, x: 0.5, y: 0.5 }, cursor: null, banda: null, resuelto: false, rendido: false };
  }
  let guardaT = 0;
  function guardarPartida(ya) {
    if (!G.P) return;
    const P = G.P;
    P.activo = G.activo; P.zoom = Object.assign({}, G.foto);
    const rb = $('#regBody'); if (rb) P.scrollReg = rb.scrollTop;
    const ib = $('#infBody'); if (ib) P.scrollInf = ib.scrollTop;
    const hacer = () => { PART.p[P.ref.modo] = P; PART.actual = P.ref.modo; lsSet('partida', PART); };
    clearTimeout(guardaT);
    if (ya) hacer(); else guardaT = setTimeout(hacer, 300);
  }
  const partidaViva = () => G.P && !G.P.resuelto && !G.P.rendido;

  function empezar(ref, opts) {
    opts = opts || {};
    AU.iniciar();
    const caso = casoDe(ref);
    if (!caso) { toast('—'); return; }
    let P = PART.p[ref.modo];
    const mismo = P && P.id === caso.id && keyRef(P.ref) === keyRef(ref);
    if (ref.modo === 'diario' && DIARIO[ref.fecha]) { verInformeDiario(ref.fecha); return; }
    if (!mismo || P.resuelto || P.rendido) P = nuevaPartida(ref, caso);
    if (G.pausado) { G.pausado = false; AU.pausa(false); }
    $('#pausa').classList.remove('on');
    ayudaVuelta = 'inicio';
    G.ref = ref; G.caso = caso; G.P = P;
    G.activo = P.activo && P.huecos[P.activo] == null ? P.activo : null; G.mano = null; G.verTodas = false; G.bancoAbierto = false; G.descFoto = false; G.tablaTel = false; G.focoFicha = -1;
    G.foto = Object.assign({ z: 1, x: 0.5, y: 0.5 }, P.zoom);
    G.tut = ref.modo === 'tutorial' ? { n: ref.n, paso: 'inicio', repaso: !!opts.repaso } : null;
    if (G.tut) prepararTutorial();
    guardarPartida(true);
    const arrancar = () => { irA('juego'); renderJuego(); G.pausado = false; capaPorProgreso(true); tutorial('inicio'); };
    if (mismo && llenos(P, caso) + P.envios.length > 0) arrancar();
    else mostrarApertura(caso, ref, arrancar);
  }
  function continuarPartida(P) { empezar(P.ref); }
  function empezarTutorial() {
    const n = !TUT.t1 ? 1 : !TUT.t2 ? 2 : 3;
    empezar({ modo: 'tutorial', n });
  }
  function verInformeDiario(fecha) {
    const ref = { modo: 'diario', fecha };
    const caso = casoDe(ref);
    let P = PART.p.diario;
    if (!P || P.id !== caso.id) { P = nuevaPartida(ref, caso); const r = DIARIO[fecha] || {}; P.resuelto = !!r.resuelto; P.rendido = !!r.rendido; P.tiempoMs = r.tiempoMs || 0; P.envios = (r.hist || []).map((k) => ({ k })); for (const h in caso.huecos) P.huecos[h] = caso.huecos[h].valor; }
    G.ref = ref; G.caso = caso; G.P = P;
    const r = DIARIO[fecha] || {};
    irA('resultado', { info: { caso, P, ref, estrellas: r.estrellas || 0, puntos: null, logros: [], rendido: !!r.rendido, revisita: true } });
  }

  // ── Apertura del expediente (2,5 s, se salta con un toque)
  function mostrarApertura(caso, ref, cb) {
    const el = $('#apertura');
    G.apertura = true;
    el.innerHTML = '<div class="cajaA"><div class="mitad sup"></div><div class="mitad inf"></div><div class="brillo"></div><div class="sello">//</div></div><div class="ficha"><div class="kick">' + esc(t('ap.expediente', { n: caso.numIncidente })) + '</div><h3>' + esc(nombreCaso(ref, caso)) + '</h3><dl><dt>' + t('ap.nave') + '</dt><dd>' + esc(caso.nave + ' · ' + caso.tipoNave[L]) + '</dd><dt>' + t('ap.fecha') + '</dt><dd>' + caso.diaMision + '</dd><dt>' + t('ap.hora') + '</dt><dd>' + esc(caso.horaIncidente) + ' UTC</dd><dt>' + t('ap.resumen') + '</dt><dd>' + esc((caso.intro && caso.intro[L]) || caso.resumen[L]) + '</dd></dl></div><div class="saltar">' + t('ap.saltar') + '</div>';
    void el.offsetWidth;
    el.classList.add('on');
    AU.stinger(); sfx('sello');
    let hecho = false;
    const cerrar = () => { if (hecho) return; hecho = true; clearTimeout(tm); el.classList.remove('on'); G.apertura = false; cb(); };
    const tm = setTimeout(cerrar, quieto() ? 1400 : 2600);
    el.onclick = () => { if (performance.now() - t0 > 250) cerrar(); };
    const t0 = performance.now();
  }

  // ───────────── Juego: render ─────────────
  function decidirLayout() {
    const w = W.innerWidth, h = W.innerHeight;
    if (w >= 900 && h >= 500) return 'wide';
    if (w > h) return 'land';
    return 'port';
  }
  function renderJuego(conservar) {
    const caso = G.caso, P = G.P;
    const el = $('#sJuego');
    const sr = conservar ? { r: ($('#regBody') || {}).scrollTop, i: ($('#infBody') || {}).scrollTop } : { r: P.scrollReg, i: P.scrollInf };
    G.regEnts = RG.entidadesPorRegistro(caso);
    const tabs = caso.registros.map((r, i) => '<button class="tab" role="tab" data-r="' + i + '" aria-selected="' + (P.reg === i) + '" aria-label="' + esc(t('reg.' + r.tipo)) + ' ' + (i + 1) + '">' + ICON[r.tipo] + '<span class="lbl">' + t('reg.' + r.tipo) + '</span><span class="num">' + (i + 1) + '</span><span class="punto"></span></button>').join('');
    el.innerHTML =
      '<header class="barra"><button class="ibtn" id="jMenu" aria-label="' + t('juego.menu') + '">' + ICON.atras + '</button><div class="nomCaso"><b>' + esc(nombreCaso(G.ref, caso)) + '</b><small>' + esc(caso.nave + ' · ' + caso.incidente[L]) + '</small></div><span class="crono" id="crono" aria-label="' + t('juego.tiempo') + '"></span><button class="ibtn" id="jPausa" aria-label="' + t('juego.pausa') + '">' + ICON.pausa + '</button><button class="ibtn" id="jAj" aria-label="' + t('juego.ajustes') + '">' + ICON.engranaje + '</button></header>' +
      '<nav class="pest" role="tablist" aria-label="' + t('juego.registros') + '">' + tabs + '</nav>' +
      '<section class="visor" id="visor"></section>' +
      '<div class="asa" id="asa" role="separator" aria-orientation="horizontal"><i></i></div>' +
      '<section class="informe" id="informe" aria-label="' + t('juego.informe') + '"><div class="infCab"><b>' + t('juego.informe') + '</b><button class="chipBtn" id="jHist">' + ICON.historial + '<span>' + P.envios.length + '</span><span class="sr">' + t('juego.historial') + '</span></button></div><div class="marcados" id="marcados"></div><div class="infBody" id="infBody"></div><div class="escaner" id="escaner"></div><div class="selloG" id="selloG"></div></section>' +
      '<section class="banco" id="banco" aria-label="' + esc(t('juego.bancoNombre')) + '"><div class="bancoCab"><b id="bancoTit"></b><button class="chipBtn" id="jTodas"></button><button class="x cerrarB" id="jCerrarB" aria-label="' + t('btn.cerrar') + '">' + ICON.cerrar + '</button></div><div class="bancoBody" id="bancoBody"></div></section>' +
      '<footer class="pie"><button class="bancoBtn" id="jBanco" aria-expanded="false"></button><button class="verificar" id="verificar"></button></footer>';
    relayout(true);
    renderVisor(false);
    renderInforme();
    renderBanco();
    pintarMarcas();
    pintarCrono();
    const rb = $('#regBody'); if (rb && sr.r) rb.scrollTop = sr.r;
    const ib = $('#infBody'); if (ib && sr.i) ib.scrollTop = sr.i;
    if (P.activo && P.huecos[P.activo] == null && !conservar) setActivo(P.activo, true);
    else if (G.activo) setActivo(G.activo, true);
  }

  function pintarCrono() {
    const c = $('#crono'); if (!c || !G.P) return;
    c.hidden = !AJ.cronometro;
    c.textContent = fmtT(G.P.tiempoMs);
  }

  // ── Registro abierto
  function renderVisor(anim) {
    const caso = G.caso, P = G.P;
    const r = caso.registros[P.reg];
    const v = $('#visor');
    if (G.fotoCtl) G.fotoCtl = null;
    AU.radio(r.tipo === 'radio');
    let acc = '';
    if (r.tipo === 'radio') acc = '<button class="chipBtn" id="jEsc">' + ICON.volumen + t('juego.escuchar') + '</button>';
    if (r.tipo === 'foto') acc = '<button class="chipBtn" id="jDesc" aria-pressed="' + G.descFoto + '">' + ICON.ojo + '<span>' + (G.descFoto ? t('juego.ocultarDesc') : t('juego.describir')) + '</span></button>';
    if (r.tipo === 'telemetria') acc = '<button class="chipBtn" id="jTabla" aria-pressed="' + G.tablaTel + '">' + (G.tablaTel ? ICON.telemetria : ICON.tabla) + '<span>' + (G.tablaTel ? t('juego.grafica') : t('juego.tabla')) + '</span></button>';
    let h = '<div class="regCab">' + ICON[r.tipo] + '<div class="tt"><b>' + (P.reg + 1) + ' · ' + t('reg.' + r.tipo) + '</b><small>' + ents(r.meta[L]) + '</small></div><div class="acc">' + acc + '</div></div>';
    if (r.tipo === 'foto') {
      h += '<div class="fotoCaja"><canvas class="fotoCv' + (anim ? ' flash' : '') + '" id="fotoCv" tabindex="0" aria-label="' + t('reg.foto') + '"></canvas><span class="zoomNiv" id="zoomNiv">' + (L === 'es' ? '1,0×' : '1.0×') + '</span><div class="zoomCtl"><button id="zMenos" aria-label="' + esc(t('juego.alejar')) + '" title="' + esc(t('juego.alejar')) + '">−</button><button id="zMas" aria-label="' + esc(t('juego.acercar')) + '" title="' + esc(t('juego.acercar')) + '">+</button></div></div>' + (G.descFoto ? '<div class="desc">' + esc(DB.describirFoto(r.datos, L)) + '</div>' : '');
    } else if (r.tipo === 'telemetria') {
      const et = etiquetasTel(r);
      h += '<div class="telCaja">' + (G.tablaTel ? '<div class="regBody" id="regBody">' + RG.tablaTel(r.datos, L, et) + '</div>' : '<canvas class="telCv" id="telCv" tabindex="0" aria-label="' + t('tel.cursor') + '"></canvas>') + '<div class="telLeyenda">' + r.datos.series.map((s) => '<span>' + esc(CNX.mundo.CANALES[s.canal][L]) + ' · ' + ents(CNX.TX.ayudantes(L).mN(s.mod)) + '</span>').join('') + '</div></div>';
    } else {
      h += '<div class="regBody' + (anim ? ' anim' : '') + '" id="regBody">' + RG.cuerpoTexto(r, L, t) + '</div>';
    }
    v.innerHTML = h;
    $$('.tab').forEach((b) => b.setAttribute('aria-selected', +b.dataset.r === P.reg));
    const tabAct = $('.tab[data-r="' + P.reg + '"]'); if (tabAct && tabAct.scrollIntoView) tabAct.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (r.tipo === 'foto') {
      const cv = $('#fotoCv');
      G.fotoCtl = RG.montarFoto(cv, r.datos, L, G.foto, {
        dibujado: (z) => { const n = $('#zoomNiv'); if (n) n.textContent = z.toFixed(1).replace('.', L === 'es' ? ',' : '.') + '×'; },
        zoom: () => tutorial('zoom'),
        cambio: () => guardarPartida()
      });
      requestAnimationFrame(() => G.fotoCtl && G.fotoCtl.dibujar());
      $('#zMas').onclick = () => { G.fotoCtl.zoom(1.5); sfx('tic', 0.8); };
      $('#zMenos').onclick = () => { G.fotoCtl.zoom(1 / 1.5); sfx('tic', 0.3); };
      $('#jDesc').onclick = () => { G.descFoto = !G.descFoto; sfx('boton'); renderVisor(false); };
    }
    if (r.tipo === 'telemetria') {
      $('#jTabla').onclick = () => { G.tablaTel = !G.tablaTel; sfx('boton'); renderVisor(false); };
      const cv = $('#telCv');
      if (cv) {
        let ultimo = null;
        G.telCtl = RG.montarTel(cv, r.datos, L, {
          cursor: () => G.P.cursor,
          setCursor: (m) => { G.P.cursor = m; if (m !== ultimo) { const s = r.datos.series[0]; const C = CNX.mundo.CANALES[s.canal]; const v2 = DB.valorSerie(r.datos, 0, m); sfx('tic', Math.max(0, Math.min(1, (v2 - Math.min(C.base, C.fallo)) / Math.abs(C.fallo - C.base)))); ultimo = m; } },
          etiquetas: () => etiquetasTel(r),
          colores: () => r.datos.series.map((s) => colorMarca('m:' + s.mod)),
          fin: () => { guardarPartida(); tutorial('cursor'); }
        });
        requestAnimationFrame(() => G.telCtl && G.telCtl.dibujar());
      }
    } else G.telCtl = null;
    if (r.tipo === 'radio') $('#jEsc').onclick = () => { AU.iniciar(); sfx('escuchar'); };
    const rb = $('#regBody'); if (rb) rb.addEventListener('scroll', () => { guardarPartida(); posicionarGlobo(); }, { passive: true });
    pintarMarcas();
  }
  function etiquetasTel(r) { const M = CNX.mundo; return r.datos.series.map((s) => M.CANALES[s.canal][L] + ' · ' + (L === 'es' ? M.MODULOS[s.mod].es : M.MODULOS[s.mod].enN)); }

  function abrirRegistro(i, anim) {
    const n = G.caso.registros.length;
    i = ((i % n) + n) % n;
    if (G.P.reg === i) return;
    G.P.reg = i;
    const tipo = G.caso.registros[i].tipo;
    sfx(tipo === 'foto' ? 'obturador' : tipo === 'radio' ? 'radio' : 'registro');
    renderVisor(anim !== false);
    $('#regBody') && ($('#regBody').scrollTop = 0);
    guardarPartida();
    tutorial('registro');
    if (G.layout === 'port' && G.bancoAbierto) {/* el banco se queda abierto */}
  }

  // ── Informe
  function textoFicha(cat, valor) { return CNX.gen.textoValor(cat, valor, L); }
  function htmlHueco(h, opts) {
    const caso = G.caso, P = G.P;
    const hu = caso.huecos[h];
    const v = opts && opts.valor !== undefined ? opts.valor : P.huecos[h];
    const n = +h.slice(1);
    const lleno = v != null;
    const cls = ['hueco', 'c-' + hu.cat];
    if (lleno) cls.push('lleno');
    if (!opts && G.activo === h) cls.push('act');
    if (!opts && P.dudas.includes(h)) cls.push('duda');
    if (!opts && G.mano && !lleno && fichaDe(G.mano).cat === hu.cat) cls.push('late');
    if (opts && opts.clase) cls.push(opts.clase);
    const lab = lleno ? t('juego.huecoLleno', { n, c: t('cat.' + hu.cat), v: textoFicha(hu.cat, v) }) : t('juego.hueco', { n, c: t('cat.' + hu.cat) });
    return '<button class="' + cls.join(' ') + '" data-h="' + h + '" aria-label="' + esc(lab) + '"' + (opts ? ' tabindex="-1"' : '') + '>' + ICON[hu.cat] + (lleno ? '<span>' + esc(textoFicha(hu.cat, v)) + '</span>' : '<span class="ph">' + t('cat.' + hu.cat) + '</span>') + '</button>';
  }
  function htmlInforme(opts) {
    // La puntuación que sigue a un hueco va pegada a él (sin «.» huérfano al principio de un renglón).
    const frase = (partes) => {
      let out = '';
      for (let i = 0; i < partes.length; i++) {
        const x = partes[i];
        if (typeof x === 'string') { out += esc(x); continue; }
        const hb = htmlHueco(x.h, opts && opts(x.h));
        const sig = partes[i + 1];
        const m = typeof sig === 'string' ? sig.match(/^[.,;:)»?!]+/) : null;
        if (m) { out += '<span class="nw">' + hb + esc(m[0]) + '</span>'; partes = partes.slice(); partes[i + 1] = sig.slice(m[0].length); }
        else out += hb;
      }
      return out;
    };
    return G.caso.informe.map((p) => '<p>' + p.map((s) => frase(s[L])).join(' ') + '</p>').join('');
  }
  function renderInforme() {
    const P = G.P, caso = G.caso;
    const ib = $('#infBody'); if (!ib) return;
    const st = ib.scrollTop;
    let h = htmlInforme();
    if (P.banda) h += htmlBanda(P.banda);
    const fallidos = P.envios.filter((e) => e.k > 0).length;
    if (fallidos >= 3 && !caso.tutorial) h += '<button class="rendirse" id="jRendirse">' + t('juego.rendirse') + '</button>';
    ib.innerHTML = h;
    ib.scrollTop = st;
    const vb = $('#verificar');
    const faltan = idsHuecos(caso).length - llenos(P, caso);
    vb.textContent = faltan ? (faltan === 1 ? t('juego.falta1') : t('juego.faltan', { n: faltan })) : t('juego.verificar');
    vb.classList.toggle('listo', !faltan);
    const hb = $('#jHist span'); if (hb) hb.textContent = P.envios.length;
  }
  function htmlBanda(b) {
    if (b.tenue) return '<div class="banda tenue">' + (b.k >= 3 ? t('ver.ultimoMuchos') : b.k === 1 ? t('ver.ultimo1') : t('ver.ultimo', { n: b.k })) + '</div>';
    if (b.k === 0) return '<div class="banda cy">' + t('ver.resuelto') + '</div>';
    if (b.k >= 3) return '<div class="banda ro">' + t('ver.noSostiene') + '</div>';
    return '<div class="banda am">' + (b.k === 1 ? t('ver.errores1') : t('ver.errores2')) + '</div>';
  }

  // ── Banco
  function fichaDe(id) { return G.caso.banco.find((f) => f.id === id); }
  function usados(cat, valor) { const c = G.caso; let n = 0; for (const h in c.huecos) if (c.huecos[h].cat === cat && G.P.huecos[h] === valor) n++; return n; }
  function restantes(f) { return f.n - usados(f.cat, f.valor); }
  function renderBanco() {
    const caso = G.caso, P = G.P;
    const body = $('#bancoBody'); if (!body) return;
    const st = body.scrollTop;
    const catAct = G.activo ? caso.huecos[G.activo].cat : (G.mano ? fichaDe(G.mano).cat : null);
    const soloAct = G.layout === 'port' && catAct && !G.verTodas;
    const total = caso.banco.reduce((a, f) => a + restantes(f), 0);
    let h = '';
    const orden = catAct ? [catAct].concat(CATS.filter((c) => c !== catAct)) : CATS;
    for (const cat of orden) {
      const fs = caso.banco.filter((f) => f.cat === cat);
      if (!fs.length) continue;
      if (soloAct && cat !== catAct) continue;
      h += '<div class="grupo c-' + cat + (catAct && cat !== catAct ? ' tenue' : '') + '" data-cat="' + cat + '"><h4>' + ICON[cat] + t('cat.' + cat) + '</h4><div class="fichas">';
      for (const f of fs) {
        const r = restantes(f);
        h += '<button class="ficha c-' + cat + (r <= 0 ? ' agotada' : '') + (G.mano === f.id ? ' mano' : '') + '" data-f="' + f.id + '"' + (r <= 0 ? ' aria-disabled="true" tabindex="-1"' : '') + '>' + ICON[cat] + '<span>' + esc(f.txt[L]) + '</span>' + (f.n > 1 ? '<span class="cnt">×' + Math.max(0, r) + '</span>' : '') + '</button>';
      }
      h += '</div></div>';
    }
    body.innerHTML = h;
    body.scrollTop = catAct && catAct !== G.ultimaCatBanco ? 0 : st;
    G.ultimaCatBanco = catAct;
    $('#bancoTit').textContent = t('juego.banco', { n: total });
    const todas = $('#jTodas');
    todas.style.display = G.layout === 'port' && catAct ? '' : 'none';
    todas.textContent = G.verTodas ? t('juego.soloCat', { c: t('cat.' + (catAct || 'persona')) }) : t('juego.verTodas');
    const bb = $('#jBanco');
    bb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' + esc(t('juego.banco', { n: total }));
    bb.setAttribute('aria-expanded', G.bancoAbierto);
    $('#banco').classList.toggle('abierta', G.bancoAbierto);
  }
  function abrirBanco(on) {
    if (G.layout !== 'port') { G.bancoAbierto = false; return; }
    if (G.bancoAbierto === on) return;
    G.bancoAbierto = on;
    $('#banco').classList.toggle('abierta', on);
    $('#jBanco').setAttribute('aria-expanded', on);
    sfx('registro');
    if (on) { const ib = $('#infBody'); const a = G.activo && $('.hueco[data-h="' + G.activo + '"]'); if (a && ib) { const r = a.getBoundingClientRect(), bb = $('#banco').getBoundingClientRect(); if (r.bottom > bb.top - 8) ib.scrollBy({ top: r.bottom - bb.top + 40, behavior: quieto() ? 'auto' : 'smooth' }); } }
  }

  // ── Marcas
  function colorMarca(e) { const m = G.P && G.P.marcas.find((x) => x.e === e); return m ? getComputedStyle(document.documentElement).getPropertyValue('--m' + m.c).trim() : null; }
  function pintarMarcas() {
    const P = G.P; if (!P) return;
    const mapa = {}; for (const m of P.marcas) mapa[m.e] = m.c;
    $$('.ent').forEach((s) => { const c = mapa[s.dataset.e]; s.classList.remove('mk', 'mk0', 'mk1', 'mk2', 'mk3', 'mk4', 'mk5'); if (c != null) s.classList.add('mk', 'mk' + c); s.setAttribute('aria-pressed', c != null); });
    $$('.tab').forEach((b) => { const i = +b.dataset.r; b.classList.toggle('conMarca', P.marcas.some((m) => G.regEnts[i] && G.regEnts[i].has(m.e))); });
    const mc = $('#marcados');
    if (mc) {
      if (!P.marcas.length) mc.innerHTML = '<span class="vacio">' + t('juego.sinMarcas') + '</span>';
      else mc.innerHTML = '<span class="sr">' + t('juego.marcados') + '</span>' + P.marcas.map((m) => '<button class="mchip" data-e="' + esc(m.e) + '"><i style="background:var(--m' + m.c + ')"></i>' + esc(textoEntidad(m.e)) + '<span class="xx" aria-hidden="true">×</span></button>').join('');
    }
    if (G.telCtl) G.telCtl.dibujar();
  }
  function textoEntidad(e) {
    const el = $('.ent[data-e="' + CSS.escape(e) + '"]');
    if (el) return el.textContent;
    const [k, v] = [e.slice(0, e.indexOf(':')), e.slice(e.indexOf(':') + 1)];
    const M = CNX.mundo;
    if (k === 'm') return L === 'es' ? M.MODULOS[v].es : M.MODULOS[v].enN;
    if (k === 's') return M.SISTEMAS[v][L === 'es' ? 'es' : 'en'];
    if (k === 'pa') return (L === 'es' ? 'parche ' : 'patch ') + v;
    if (k === 'r') return M.ROLES[v][L === 'es' ? 'mN' : 'enN'];
    return v;
  }
  function marcar(e, ev) {
    const P = G.P;
    const i = P.marcas.findIndex((m) => m.e === e);
    if (i >= 0) { const c = P.marcas[i].c; P.marcas.splice(i, 1); sfx('desmarca', c); }
    else {
      if (P.marcas.length >= 6) { P.marcas.shift(); toast(t('juego.marcaMax')); }
      const usadosC = P.marcas.map((m) => m.c);
      let c = 0; while (usadosC.includes(c)) c++;
      P.marcas.push({ e, c });
      sfx('marca', c);
      if (ev && !quieto()) { const o = document.createElement('div'); o.className = 'onda'; o.style.left = ev.clientX + 'px'; o.style.top = ev.clientY + 'px'; document.body.appendChild(o); setTimeout(() => o.remove(), 300); }
      setTimeout(() => {
        $$('.ent[data-e="' + CSS.escape(e) + '"]').forEach((s) => { s.classList.remove('destello'); void s.offsetWidth; s.classList.add('destello'); });
        $$('.tab').forEach((b) => { const k = +b.dataset.r; if (k !== P.reg && G.regEnts[k] && G.regEnts[k].has(e)) { b.classList.remove('late'); void b.offsetWidth; b.classList.add('late'); } });
      }, 20);
    }
    pintarMarcas();
    guardarPartida();
    tutorial('marca', e);
  }

  // ── Huecos y fichas
  function setActivo(h, silencio) {
    G.activo = h;
    if (h) G.mano = null;
    $$('#infBody .hueco').forEach((b) => b.classList.toggle('act', b.dataset.h === h));
    $$('#infBody .hueco').forEach((b) => b.classList.remove('late'));
    renderBanco();
    if (h && !silencio) { sfx('hueco'); abrirBanco(true); }
    if (h) { const b = $('.hueco[data-h="' + h + '"]'); if (b && !silencio) b.scrollIntoView({ block: 'nearest', behavior: quieto() ? 'auto' : 'smooth' }); }
    G.focoFicha = -1;
    tutorial('activo', h);
  }
  function tocarHueco(h) {
    if (G.ocupado || !partidaViva()) return;
    const P = G.P, cat = G.caso.huecos[h].cat;
    if (G.mano) {
      const f = fichaDe(G.mano);
      if (f.cat === cat) { colocar(h, f.valor, $('.ficha[data-f="' + f.id + '"]')); return; }
      noEncaja(h); return;
    }
    if (P.huecos[h] != null) { quitar(h); setActivo(h, true); abrirBanco(true); renderBanco(); return; }
    setActivo(G.activo === h && G.layout !== 'port' ? null : h);
  }
  function tocarFicha(fid) {
    if (G.ocupado || !partidaViva()) return;
    const f = fichaDe(fid);
    if (restantes(f) <= 0) return;
    if (G.activo && G.caso.huecos[G.activo].cat === f.cat) { colocar(G.activo, f.valor, $('.ficha[data-f="' + fid + '"]')); return; }
    // ficha a la mano: los huecos de su categoría laten
    G.activo = null;
    G.mano = G.mano === fid ? null : fid;
    sfx(G.mano ? 'levantar' : 'quitar');
    $$('#infBody .hueco').forEach((b) => { b.classList.remove('act'); b.classList.toggle('late', !!G.mano && G.caso.huecos[b.dataset.h].cat === f.cat && G.P.huecos[b.dataset.h] == null); });
    renderBanco();
    if (G.mano) { toast(t('juego.mano', { c: t('cat.' + f.cat) })); if (G.layout === 'port') abrirBanco(false); }
  }
  function noEncaja(h) {
    sfx('noEncaja'); vibrar(10); toast(t('juego.noEncaja'));
    const b = $('.hueco[data-h="' + h + '"]'); if (b) { b.classList.remove('temblor'); void b.offsetWidth; b.classList.add('temblor'); }
  }
  function volar(desde, hasta) {
    if (!desde || !hasta || quieto()) return;
    const a = desde.getBoundingClientRect(), b = hasta.getBoundingClientRect();
    const g = desde.cloneNode(true);
    g.classList.remove('mano', 'foco');
    Object.assign(g.style, { position: 'fixed', left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', margin: 0, zIndex: 95, pointerEvents: 'none', transition: 'transform .18s cubic-bezier(.2,.8,.2,1), opacity .18s' });
    document.body.appendChild(g);
    requestAnimationFrame(() => { g.style.transform = 'translate(' + (b.left + b.width / 2 - a.left - a.width / 2) + 'px,' + (b.top + b.height / 2 - a.top - a.height / 2) + 'px) scale(.85)'; g.style.opacity = '.2'; });
    setTimeout(() => g.remove(), 220);
  }
  function colocar(h, valor, desde) {
    const P = G.P;
    if (!partidaViva()) return false;
    const hu = G.caso.huecos[h];
    const f = G.caso.banco.find((x) => x.cat === hu.cat && x.valor === valor);
    if (!f) return false;
    if (P.huecos[h] === valor) return true;
    if (P.huecos[h] == null && restantes(f) <= 0) return false;
    if (P.huecos[h] != null && restantes(f) <= 0) return false;
    P.huecos[h] = valor;
    G.mano = null;
    if (P.banda && !P.banda.tenue) P.banda.tenue = true;
    sfx('colocar');
    renderInforme();
    const hb = $('.hueco[data-h="' + h + '"]');
    volar(desde, hb);
    if (hb && !quieto()) { hb.classList.add('pop'); }
    // siguiente hueco vacío
    const ids = idsHuecos(G.caso);
    const sig = ids.slice(ids.indexOf(h) + 1).concat(ids.slice(0, ids.indexOf(h))).find((x) => P.huecos[x] == null);
    if (sig) setActivo(sig, true); else { setActivo(null, true); abrirBanco(false); }
    if (!sig) { const vb = $('#verificar'); if (vb && G.layout === 'port') vb.focus({ preventScroll: true }); }
    renderBanco();
    capaPorProgreso();
    guardarPartida();
    tutorial('colocado', h);
    return true;
  }
  function quitar(h) {
    const P = G.P;
    if (P.huecos[h] == null) return;
    P.huecos[h] = null;
    P.dudas = P.dudas.filter((x) => x !== h);
    if (P.banda && !P.banda.tenue) P.banda.tenue = true;
    sfx('quitar');
    renderInforme(); renderBanco(); capaPorProgreso(); guardarPartida();
  }
  function capaPorProgreso(inicial) {
    const P = G.P; if (!P) return;
    const pct = llenos(P, G.caso) / idsHuecos(G.caso).length;
    const fallo = P.envios.some((e) => e.k >= 1 && e.k <= 2);
    AU.capa(fallo ? 2 : pct >= 0.5 ? 1 : 0);
  }

  // Menú de hueco lleno (mantener pulsado 450 ms)
  function abrirMenuHueco(h, x, y) {
    const m = $('#menuHueco');
    const duda = G.P.dudas.includes(h);
    m.innerHTML = '<button data-a="q">' + t('juego.quitar') + '</button><button data-a="d">' + (duda ? t('juego.quitarDuda') : t('juego.duda')) + '</button>';
    m.classList.add('on');
    const r = m.getBoundingClientRect();
    m.style.left = Math.min(W.innerWidth - r.width - 8, Math.max(8, x - r.width / 2)) + 'px';
    m.style.top = Math.min(W.innerHeight - r.height - 8, Math.max(8, y - r.height - 14)) + 'px';
    m.onclick = (e) => {
      const a = e.target.dataset.a; if (!a) return;
      if (a === 'q') quitar(h);
      else { G.P.dudas = duda ? G.P.dudas.filter((x) => x !== h) : G.P.dudas.concat([h]); sfx('boton'); renderInforme(); guardarPartida(); }
      cerrarMenuHueco();
    };
    $('button', m).focus();
    vibrar(12);
  }
  function cerrarMenuHueco() { $('#menuHueco').classList.remove('on'); }

  // ───────────── Verificación ─────────────
  function verificar() {
    const P = G.P, caso = G.caso;
    if (G.ocupado || !partidaViva()) return null;
    const ids = idsHuecos(caso);
    const vacios = ids.filter((h) => P.huecos[h] == null);
    if (vacios.length) {
      sfx('faltan');
      setActivo(vacios[0], true);
      const b = $('.hueco[data-h="' + vacios[0] + '"]');
      if (b) { b.scrollIntoView({ block: 'center', behavior: quieto() ? 'auto' : 'smooth' }); b.classList.remove('temblor'); void b.offsetWidth; b.classList.add('temblor'); }
      abrirBanco(true);
      return { faltan: vacios.length };
    }
    const clave = ids.map((h) => P.huecos[h]).join('\u0001');
    const prev = P.envios.find((e) => e.clave === clave);
    if (prev) { toast(t('ver.repetido')); P.banda = { k: prev.k, tenue: false }; renderInforme(); anunciar(t('ver.repetido')); return { k: prev.k, repetido: true }; }
    const k = ids.filter((h) => P.huecos[h] !== caso.huecos[h].valor).length;
    P.envios.push({ clave, k, t: P.tiempoMs });
    if (k === 0) { P.resuelto = true; }
    guardarPartida(true);
    G.ocupado = true;
    setActivo(null, true); abrirBanco(false);
    const ib = $('#infBody');
    const dur = quieto() ? 0 : 620;
    if (dur) { const e = $('#escaner'); e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); sfx('escaneo', ids.length); }
    setTimeout(() => {
      $('#escaner').classList.remove('on');
      if (k === 0) {
        P.banda = { k: 0, tenue: false };
        renderInforme();
        const hs = $$('#infBody .hueco');
        hs.forEach((b, i) => setTimeout(() => { b.classList.add('ok', 'cascada'); }, quieto() ? 0 : i * 60));
        const s = $('#selloG'); s.textContent = L === 'es' ? 'RESUELTO' : 'SOLVED'; s.classList.remove('gris', 'on'); void s.offsetWidth;
        setTimeout(() => { s.classList.add('on'); sfx('sello'); particulas(s); }, quieto() ? 0 : hs.length * 60 + 80);
        vibrar([15, 40, 15, 40, 60]);
        AU.resuelto();
        anunciar(t('ver.resuelto'));
        setTimeout(() => { G.ocupado = false; finalizar(false); }, quieto() ? 900 : 1700 + hs.length * 60);
      } else {
        P.banda = { k, tenue: false };
        renderInforme();
        if (k <= 2) { sfx('errores', k); vibrar(20); AU.tension(); AU.capa(2); }
        else { sfx('noSostiene'); vibrar([30, 40, 30]); AU.duck(4, 1.5); if (!quieto()) { ib.classList.remove('sacude'); void ib.offsetWidth; ib.classList.add('sacude'); } }
        anunciar(k >= 3 ? t('ver.noSostiene') : k === 1 ? t('ver.errores1') : t('ver.errores2'));
        const bd = $('#infBody .banda'); if (bd) bd.scrollIntoView({ block: 'nearest', behavior: quieto() ? 'auto' : 'smooth' });
        G.ocupado = false;
        tutorial('verificado', k);
      }
      guardarPartida(true);
    }, dur);
    return { k };
  }
  function particulas(el) {
    if (quieto()) return;
    const host = $('#informe'); const r = el.getBoundingClientRect(), hr = host.getBoundingClientRect();
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('i'); p.className = 'particula';
      const x = r.left - hr.left + r.width / 2, y = r.top - hr.top + r.height / 2;
      p.style.left = x + 'px'; p.style.top = y + 'px';
      host.appendChild(p);
      const a = Math.random() * 6.283, d = 40 + Math.random() * 90;
      p.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + Math.cos(a) * d + 'px,' + Math.sin(a) * d + 'px) scale(.2)', opacity: 0 }], { duration: 650 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => p.remove();
    }
  }
  function rendirse() {
    dialogo(t('juego.rendirseConfirma'), t('juego.si'), t('juego.no'), () => {
      G.P.rendido = true; guardarPartida(true);
      AU.rendido();
      finalizar(true);
    });
  }
  function dialogo(txt, si, no, cb) {
    const d = $('#dialogo');
    d.innerHTML = '<div class="card"><p>' + esc(txt) + '</p><button class="btn pri" id="dSi" style="min-height:54px;font-size:16px">' + esc(si) + '</button><button class="btn" id="dNo">' + esc(no) + '</button></div>';
    d.classList.add('on');
    const cerrar = () => d.classList.remove('on');
    $('#dSi', d).onclick = () => { cerrar(); sfx('boton'); cb(); };
    $('#dNo', d).onclick = () => { cerrar(); sfx('boton'); };
    d.onclick = (e) => { if (e.target === d) cerrar(); };
    setTimeout(() => $('#dNo', d).focus(), 30);
  }
  function abrirHistorial() {
    const P = G.P, d = $('#historial');
    let h = '<div class="card"><div class="cab"><h2>' + t('juego.historial') + '</h2><button class="x" id="hX" aria-label="' + t('btn.cerrar') + '">' + ICON.cerrar + '</button></div>';
    if (!P.envios.length) h += '<p class="nota" style="margin:0">' + t('juego.sinEnvios') + '</p>';
    else h += '<div class="listaEnv">' + P.envios.map((e, i) => '<div class="env"><span class="cua k' + Math.min(3, e.k) + '"></span><span>' + t('ver.envio', { n: i + 1 }) + '</span><small>' + t('ver.k' + Math.min(3, e.k)) + (e.t != null ? ' · ' + fmtT(e.t) : '') + '</small></div>').join('') + '</div>';
    h += '</div>';
    d.innerHTML = h; d.classList.add('on'); sfx('boton');
    $('#hX', d).onclick = () => d.classList.remove('on');
    d.onclick = (e) => { if (e.target === d) d.classList.remove('on'); };
    setTimeout(() => $('#hX', d).focus(), 30);
  }

  // ───────────── Fin de caso y resultado ─────────────
  function registrar(caso, P, rendido) {
    const ref = P.ref;
    const env = P.envios.length;
    const est = rendido ? 0 : env <= 2 ? 3 : env <= 4 ? 2 : 1;
    const out = { estrellas: est, envios: env, tiempoMs: P.tiempoMs, puntos: 0, logros: [], rendido, rachaCorta: false };
    const insignia = (k) => { if (!ST.insignias[k]) { ST.insignias[k] = Date.now(); out.logros.push(t('res.insignia', { i: t('ins.' + k) })); } };
    if (ref.modo === 'tutorial') {
      if (!rendido) TUT['t' + ref.n] = true;
      if (ref.n === 3 && !rendido) insignia('tutorial');
      guardarTodo();
      return out;
    }
    ST.jugados++;
    if (!rendido) { ST.resueltos++; if (env === 1) ST.primer++; ST.sumaEnv += env; ST.sumaT += P.tiempoMs; ST.hist[Math.min(env, 5) - 1]++; if (est === 3) ST.tres++; }
    else ST.rendidos++;
    const base = ref.modo === 'diario' ? Math.round((caso.D || 20) * 1.5) : [10, 20, 35][caso.dif - 1];
    const pts = Math.round(base * [0, 0.4, 0.7, 1][est]);
    const r0 = rango(ST.puntos).i;
    ST.puntos += pts; out.puntos = pts;
    const r1 = rango(ST.puntos);
    if (r1.i > r0) out.logros.push(t('res.subeRango', { r: r1.nombre }));
    if (ref.modo === 'diario') {
      DIARIO[ref.fecha] = { resuelto: !rendido, rendido, envios: env, hist: P.envios.map((e) => e.k), tiempoMs: P.tiempoMs, estrellas: est, D: caso.D };
      const ks = Object.keys(DIARIO).sort(); while (ks.length > 400) delete DIARIO[ks.shift()];
      if (!rendido) {
        if (Math.abs(CNX.cal.diasEntre(ref.fecha, CNX.cal.fechaLocal())) <= 1 || G.fechaForzada) {
          if (ST.ultimoDiario === CNX.cal.sumarDias(ref.fecha, -1)) ST.racha++;
          else if (ST.ultimoDiario !== ref.fecha) ST.racha = 1;
          ST.ultimoDiario = ref.fecha;
          ST.rachaMax = Math.max(ST.rachaMax, ST.racha);
          out.racha = ST.racha;
        }
        if (ST.racha >= 3) insignia('constancia');
        if (ST.racha >= 7) insignia('sinDudas');
      } else { ST.racha = 0; out.rachaCorta = true; out.racha = 0; }
    }
    if (ref.modo === 'campana' && !rendido) {
      const k = 'c' + String(ref.i + 1).padStart(2, '0');
      const ant = CAMP[k];
      // La carpeta se celebra solo la vez que se completa, no al rejugar uno de sus casos.
      const carpetaLlena = () => [0, 1, 2, 3, 4, 5].every((x) => { const c = CAMP['c' + String(Math.floor(ref.i / 6) * 6 + x + 1).padStart(2, '0')]; return c && c.estrellas; });
      const llenaAntes = carpetaLlena();
      if (!ant || !ant.estrellas || est > ant.estrellas || (est === ant.estrellas && env < ant.envios)) CAMP[k] = { estrellas: est, envios: env, tiempoMs: P.tiempoMs };
      if (!llenaAntes && carpetaLlena()) out.carpeta = Math.floor(ref.i / 6);
      if (Object.keys(CAMP).filter((x) => CAMP[x].estrellas).length >= 24) insignia('archivo');
    }
    if (!rendido) {
      const claves = Object.values(caso.huecos).map((h) => h.clave);
      if (env === 1) insignia('primerLimpio');
      if (caso.meta && caso.meta.via === 'ELI' && claves.includes('actor')) insignia('oidoFino');
      if (claves.includes('reparador')) insignia('ojo');
      if (claves.includes('horaFallo') && caso.meta && !caso.meta.horaLit) insignia('curvas');
      if (caso.meta && caso.meta.con && claves.includes('horaAccion')) insignia('planes');
      if (ST.resueltos >= 10) insignia('diez');
      if (caso.dif === 3) insignia('dificil');
      if (ST.tres >= 10) insignia('firma');
    }
    guardarTodo();
    return out;
  }
  function finalizar(rendido) {
    const caso = G.caso, P = G.P;
    const info = registrar(caso, P, rendido);
    Object.assign(info, { caso, P, ref: G.ref });
    guardarPartida(true);
    cerrarGlobo();
    irA('resultado', { info });
    setTimeout(() => { if (G.pantalla === 'resultado') AU.tema('menu'); }, rendido ? 3200 : 4300);
  }

  function renderResultado(info) {
    G.ultimoInfo = info;
    const { caso, P, ref } = info;
    const rendido = info.rendido;
    const primeraVez = !ST.vioCadena;
    const opts = (h) => {
      const correcto = caso.huecos[h].valor;
      if (rendido) return { valor: correcto, clase: P.huecos[h] === correcto ? 'ok' : 'mal' };
      return { valor: correcto, clase: 'ok' };
    };
    let izq = '<div class="infRes" id="infRes">' + htmlInforme(opts) + '<div class="selloG' + (rendido ? ' gris' : '') + (info.revisita ? '' : ' on') + '" style="' + (info.revisita ? 'opacity:1' : '') + '">' + (rendido ? (L === 'es' ? 'ARCHIVADO' : 'FILED') : (L === 'es' ? 'RESUELTO' : 'SOLVED')) + '</div></div>';
    if (rendido) izq += '<p class="nota" style="margin:0">' + t('res.tusRespuestas') + '</p>';
    let h = '<div class="res"><div>' + izq + '</div><div class="datosRes"><div class="card">';
    h += '<p class="resT">' + (rendido ? t('res.rendido') : ref.modo === 'tutorial' && ref.n === 1 ? t('res.primerInforme') : t('ver.resuelto')) + '</p><p class="resS">' + esc(nombreCaso(ref, caso)) + '</p>';
    if (ref.modo !== 'tutorial') h += '<div class="estrellas" id="estrellas">' + [0, 1, 2].map(() => ICON.estrella).join('') + '</div>';
    h += '<div class="lineas"><div><span>' + t('res.envios') + '</span><b>' + P.envios.length + '</b></div><div><span>' + t('res.tiempo') + '</span><b>' + fmtT(P.tiempoMs) + '</b></div>';
    if (ref.modo === 'diario') h += '<div><span>' + t('res.racha') + '</span><b>' + (rendido ? 0 : rachaVigente()) + '</b></div>';
    if (info.puntos != null && ref.modo !== 'tutorial') h += '<div><span>' + t('res.puntos') + '</span><b>+' + info.puntos + '</b></div>';
    h += '</div>';
    if (ref.modo !== 'tutorial') { const rg = rango(ST.puntos); h += '<div style="display:flex;justify-content:space-between;font:600 12px JetBrains Mono,monospace;color:var(--dim)"><span>' + esc(rg.nombre) + '</span><span>' + ST.puntos + ' pts</span></div><div class="rangoBar"><i id="rBar" style="width:0"></i></div>'; }
    if (info.rachaCorta) h += '<p class="nota" style="margin:6px 0 10px">' + t('res.rachaCorta') + '</p>';
    const logros = (info.logros || []).slice();
    if (info.carpeta != null) logros.push(t('res.campanaFin') + ': ' + CNX.campana.CARPETAS[info.carpeta].titulo[L]);
    if (logros.length) h += '<div class="logros">' + logros.map((x, i) => '<div class="logro" style="animation-delay:' + (0.9 + i * 0.15) + 's">' + ICON.estrella + esc(x) + '</div>').join('') + '</div>';
    if (info.carpeta != null) h += '<p class="nota" style="text-align:left;margin:0 0 12px">' + esc(CNX.campana.CARPETAS[info.carpeta].cierre[L]) + '</p>';
    if (ref.modo === 'tutorial' && ref.n === 2 && !rendido && P.envios.length === 1) h += '<p class="nota" style="text-align:left;margin:0 0 12px">' + t('tut.reglaPerfecta') + '</p>';
    if (ref.modo === 'tutorial' && ref.n === 3) h += '<p class="nota" style="margin:0 0 12px;color:var(--cyan)">' + t('tut.listo') + '</p>';
    if (ref.modo === 'diario') h += '<p class="proximo" id="rCuenta">' + esc(t('res.proximo', { t: cuentaAtras() })) + '</p>';
    // «Cómo se sabía» va después de las acciones: «Otro caso» y «Compartir» quedan a la vista sin desplazarse.
    let cad = '';
    if (caso.cadena && caso.cadena.length) {
      cad += '<div class="cadena' + (primeraVez || rendido ? ' abierta' : '') + '" id="cadena"><button aria-expanded="' + (primeraVez || rendido) + '">' + t('res.comoSeSabia') + '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button><div class="pasos">' + caso.cadena.map((p, i) => {
        const tipos = Array.from(new Set(p.srcs.map((s) => caso.registros[s[0]].tipo)));
        return '<button class="paso" data-p="' + i + '" aria-label="' + esc(t('res.verRegistro')) + '"><span class="nn">' + (i + 1) + '</span><span class="ics">' + tipos.map((x) => ICON[x]).join('') + '</span><span>' + esc(p.txt[L]) + '</span></button>';
      }).join('') + '<p class="nota" style="margin:6px 0 0;font-size:12px">' + t('res.tocaPaso') + '</p></div></div>';
      ST.vioCadena = true; lsSet('stats', ST);
    }
    // botones según modo
    if (ref.modo === 'diario') {
      h += '<button class="btn pri" id="rComp">' + t('res.compartir') + '</button><div class="fila"><button class="btn sec" id="rCamp">' + t('btn.campana') + '</button><button class="btn sec" id="rPrac">' + t('btn.practica') + '</button></div>';
    } else if (ref.modo === 'campana') {
      if (ref.i < 23 && campanaDisponible(ref.i + 1)) h += '<button class="btn pri" id="rSig">' + t('res.siguiente') + '</button>';
      h += '<button class="btn sec" id="rComp">' + t('res.compartir') + '</button>';
    } else if (ref.modo === 'practica') {
      h += '<button class="btn pri" id="rOtro">' + t('res.otro') + '</button><button class="btn sec" id="rComp">' + t('res.compartir') + '</button>';
    } else {
      if (ref.n < 3) h += '<button class="btn pri" id="rTut">' + t('tut.siguiente') + '</button>';
      else h += '<button class="btn pri" id="rDia">' + t('tut.empezarDiario') + '</button>';
    }
    h += '<button class="btn" id="rIni">' + t('res.inicio') + '</button>' + cad + '</div></div></div>';
    const el = $('#sResultado'); el.innerHTML = h;
    const on = (id, fn) => { const b = $('#' + id, el); if (b) b.addEventListener('click', () => { sfx('boton'); fn(); }); };
    on('rComp', () => compartir(info));
    on('rCamp', () => irA('campana'));
    on('rPrac', () => irA('practica'));
    on('rSig', () => empezar({ modo: 'campana', i: ref.i + 1 }));
    on('rOtro', () => empezar({ modo: 'practica', dif: ref.dif, semilla: Math.floor(Math.random() * 60466175) + 1 }));
    on('rTut', () => empezar({ modo: 'tutorial', n: ref.n + 1 }));
    on('rDia', () => empezar({ modo: 'diario', fecha: fechaJuego() }));
    on('rIni', () => irA('inicio'));
    const cd = $('#cadena', el);
    if (cd) {
      $('button', cd).addEventListener('click', () => { cd.classList.toggle('abierta'); $('button', cd).setAttribute('aria-expanded', cd.classList.contains('abierta')); sfx('registro'); });
      $$('.paso', cd).forEach((b) => b.addEventListener('click', () => abrirLupa(caso.cadena[+b.dataset.p])));
    }
    // estrellas una a una
    const ests = $$('#estrellas svg', el);
    if (!info.revisita) {
      ests.forEach((s, i) => { if (i < info.estrellas) setTimeout(() => { s.classList.add('on'); sfx('estrella', i); }, (quieto() ? 0 : 900) + i * 220); });
      if (info.logros && info.logros.length) setTimeout(() => sfx('insignia'), 1600);
    } else ests.forEach((s, i) => s.classList.toggle('on', i < info.estrellas));
    const bar = $('#rBar', el);
    if (bar) { const rg = rango(ST.puntos); setTimeout(() => { bar.style.width = (rg.sig ? Math.min(100, ((ST.puntos - rg.min) / (rg.sig.min - rg.min)) * 100) : 100) + '%'; }, 300); }
  }

  function abrirLupa(paso) {
    const caso = G.caso;
    const d = $('#lupa');
    const porReg = {};
    for (const [r, l] of paso.srcs) (porReg[r] = porReg[r] || []).push(l);
    let h = '<div class="card"><div class="cab"><h2 style="font-size:18px">' + t('res.comoSeSabia') + '</h2><button class="x" id="lX" aria-label="' + t('btn.cerrar') + '">' + ICON.cerrar + '</button></div><div class="regBody" style="padding:0">';
    h += '<p style="font-size:14.5px;line-height:1.5;margin:0 0 12px">' + esc(paso.txt[L]) + '</p>';
    for (const ri of Object.keys(porReg).map(Number).sort((a, b) => a - b)) {
      const r = caso.registros[ri];
      h += '<div class="regCab" style="padding:10px 0 6px">' + ICON[r.tipo] + '<div class="tt"><b>' + (ri + 1) + ' · ' + t('reg.' + r.tipo) + '</b><small>' + ents(r.meta[L]) + '</small></div></div>';
      if (r.tipo === 'foto') h += '<canvas class="lupaFoto" data-r="' + ri + '" style="width:100%;aspect-ratio:4/3;border-radius:12px;display:block"></canvas><p class="nota" style="text-align:left">' + esc(DB.describirFoto(r.datos, L)) + '</p>';
      else if (r.tipo === 'telemetria') h += '<canvas class="lupaTel" data-r="' + ri + '" style="width:100%;height:' + (r.datos.series.length * 70 + 40) + 'px;display:block"></canvas>';
      else h += RG.cuerpoTexto(r, L, t, porReg[ri]);
    }
    h += '</div></div>';
    d.innerHTML = h; d.classList.add('on'); sfx('registro');
    requestAnimationFrame(() => {
      $$('.lupaFoto', d).forEach((cv) => { const r = caso.registros[+cv.dataset.r]; RG.montarFoto(cv, r.datos, L, { z: 1, x: 0.5, y: 0.5 }, {}).dibujar(); });
      $$('.lupaTel', d).forEach((cv) => { const r = caso.registros[+cv.dataset.r]; const ch = r.datos.series.find((s) => s.cambio != null); DB.telemetria(cv, r.datos, L, ch ? ch.cambio : null, etiquetasTel(r), null); });
      const res = $('.resalta', d); if (res) res.scrollIntoView({ block: 'center' });
    });
    $('#lX', d).onclick = () => d.classList.remove('on');
    d.onclick = (e) => { if (e.target === d) d.classList.remove('on'); };
  }

  function textoCompartir(info) {
    const { caso, P, ref } = info;
    const est = info.estrellas;
    const env = P.envios.length;
    const sq = P.envios.map((e) => (e.k === 0 ? '🟩' : e.k === 1 ? '🟨' : e.k === 2 ? '🟧' : '⬛'));
    if (info.rendido) sq.push('⬜');
    let fila = sq.length > 8 ? sq.slice(-8).join('') + ' +' + (sq.length - 8) : sq.join('');
    const estr = info.rendido ? '' : ' · ' + '★'.repeat(est) + '☆'.repeat(3 - est);
    const tit = t('compartir.titulo');
    let cab;
    let url = 'https://jetgames.fun/cajanegra/';
    if (ref.modo === 'diario') cab = tit + ' #' + caso.num + estr;
    else if (ref.modo === 'campana') cab = tit + ' · ' + t('camp.caso', { n: ref.i + 1 }) + estr;
    else { cab = tit + ' · P-' + CNX.b36(ref.semilla) + estr; url += '?caso=' + CNX.b36(ref.semilla) + '&d=' + ref.dif; }
    const lineas = [cab, fila + '  ' + (env === 1 ? t('compartir.envio1') : t('compartir.envios', { n: env })) + ' · ' + fmtT(P.tiempoMs)];
    if (ref.modo === 'diario' && rachaVigente() > 0) lineas.push('🔥 ' + rachaVigente());
    lineas.push(url);
    return { texto: lineas.join('\n'), url };
  }
  function compartir(info) {
    const { texto } = textoCompartir(info);
    const copiar = () => {
      const ok = () => { toast(t('res.copiado')); sfx('copiado'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(ok, manual);
      else manual();
    };
    const manual = () => {
      const d = $('#dialogo');
      d.innerHTML = '<div class="card"><p>' + t('res.copiaMano') + '</p><textarea class="copiaMano" readonly>' + esc(texto) + '</textarea><button class="btn" id="dNo">' + t('btn.cerrar') + '</button></div>';
      d.classList.add('on');
      const ta = $('textarea', d); ta.focus(); ta.select();
      $('#dNo', d).onclick = () => d.classList.remove('on');
    };
    if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) navigator.share({ text: texto }).then(() => sfx('copiado'), (e) => { if (!e || e.name !== 'AbortError') copiar(); });
    else copiar();
  }

  // ───────────── Pausa ─────────────
  function pausar(on, auto) {
    if (G.pantalla !== 'juego') return;
    if (on === G.pausado) { if (on) mostrarPausa(); return; }
    G.pausado = on;
    AU.pausa(on);
    sfx('pausa', on);
    if (on) { mostrarPausa(); guardarPartida(true); cerrarMenuHueco(); }
    else { $('#pausa').classList.remove('on'); tutorial('reanudar'); }
  }
  function mostrarPausa() {
    const p = $('#pausa');
    p.innerHTML = '<div class="card"><div class="kick" style="text-align:center">' + esc(nombreCaso(G.ref, G.caso)) + '</div><h2>' + t('pausa.titulo') + '</h2><p>' + t('pausa.guardado') + '</p><button class="btn pri" id="pCont" style="min-height:60px">' + t('pausa.continuar') + '</button><div class="fila"><button class="btn sec" id="pAyuda">' + t('btn.comoJugar') + '</button><button class="btn sec" id="pAj">' + t('btn.ajustes') + '</button></div><button class="btn" id="pIni">' + t('pausa.inicio') + '</button></div>';
    p.classList.add('on');
    $('#pCont', p).onclick = () => { AU.iniciar(); AU.reanudar(); pausar(false); };
    $('#pAyuda', p).onclick = () => { sfx('boton'); ayudaVuelta = 'juego'; p.classList.remove('on'); irA('ayuda'); };
    $('#pAj', p).onclick = () => { sfx('boton'); abrirAjustes(); };
    $('#pIni', p).onclick = () => { sfx('boton'); guardarPartida(true); p.classList.remove('on'); G.pausado = false; AU.pausa(false); irA('inicio'); };
    setTimeout(() => $('#pCont', p).focus(), 30);
  }

  // ───────────── Tutorial ─────────────
  let globoObj = null;
  function prepararTutorial() {
    const tu = G.tut, caso = G.caso;
    if (tu.n === 2) G.P.reg = Math.max(0, caso.registros.findIndex((r) => r.tipo === 'radio'));
    if (tu.n === 3 && G.P.envios.length === 0 && G.P.cursor == null) G.P.reg = Math.max(0, caso.registros.findIndex((r) => r.tipo === 'telemetria'));
  }
  function globo(sel, txt, opts) {
    opts = opts || {};
    const g = $('#globo');
    g.innerHTML = esc(txt) + (opts.saltar ? '<button class="saltar" id="gSaltar">' + t('tut.saltar') + '</button>' : '') + (opts.sig ? '<br><button class="sig" id="gSig">' + t('tut.siguiente') + '</button>' : '');
    g.classList.add('on');
    globoObj = { sel, opts };
    if (opts.saltar) $('#gSaltar').onclick = () => { TUT.saltado = true; guardarTodo(); cerrarGlobo(); G.tut = null; sfx('boton'); irA('inicio'); };
    if (opts.sig) $('#gSig').onclick = () => { cerrarGlobo(); };
    posicionarGlobo();
  }
  function posicionarGlobo() {
    if (!globoObj) return;
    const g = $('#globo');
    $$('.foco-tut').forEach((x) => x.classList.remove('foco-tut'));
    const tgt = typeof globoObj.sel === 'function' ? globoObj.sel() : $(globoObj.sel);
    if (!tgt || !tgt.getBoundingClientRect().width) { g.style.left = '12px'; g.style.top = (W.innerHeight - g.offsetHeight - 90) + 'px'; g.className = 'on'; return; }
    tgt.classList.add('foco-tut');
    if (tgt.classList.contains('tab') && tgt.scrollIntoView) tgt.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const r = tgt.getBoundingClientRect();
    const gw = g.offsetWidth, gh = g.offsetHeight;
    let left = Math.min(W.innerWidth - gw - 12, Math.max(12, r.left + r.width / 2 - gw / 2));
    const abajo = r.bottom + gh + 16 < W.innerHeight;
    const top = abajo ? r.bottom + 12 : Math.max(8, r.top - gh - 12);
    g.style.left = left + 'px'; g.style.top = top + 'px';
    g.className = 'on ' + (abajo ? 'abajo' : 'arriba');
    g.style.setProperty('--fx', Math.max(14, Math.min(gw - 14, r.left + r.width / 2 - left)) + 'px');
  }
  function cerrarGlobo() { globoObj = null; $('#globo').className = ''; $$('.foco-tut').forEach((x) => x.classList.remove('foco-tut')); }
  function tutorial(ev, arg) {
    const tu = G.tut;
    if (!tu || G.pantalla !== 'juego') return;
    const caso = G.caso, P = G.P;
    const todosLlenos = () => llenos(P, caso) === idsHuecos(caso).length;
    if (tu.n === 1) {
      if (ev === 'inicio' && P.huecos.H1 == null) globo('.hueco[data-h="H1"]', t('tut.tocaHueco'), { saltar: !tu.repaso && !TUT.t1 });
      else if (ev === 'activo' && arg === 'H1' && tu.paso !== 'banco') { tu.paso = 'banco'; setTimeout(() => globo(() => $('.grupo.c-persona .ficha') || $('.ficha'), t('tut.eligeQuien')), 280); }
      else if (ev === 'colocado') { if (todosLlenos()) globo('#verificar', t('tut.verifica')); else cerrarGlobo(); }
      else if (ev === 'verificado') cerrarGlobo();
    } else if (tu.n === 2) {
      const actorCs = caso.tripulacion.find((c) => c.nombre === caso.huecos[Object.keys(caso.huecos).find((h) => caso.huecos[h].clave === 'actor')].valor).cs;
      const e = 'cs:' + actorCs;
      if (ev === 'inicio' && !P.marcas.some((m) => m.e === e)) { tu.paso = 'marca'; globo(() => $('#regBody .ent[data-e="' + e + '"]'), t('tut.marca', { x: actorCs })); }
      else if (ev === 'registro' && tu.paso === 'marca') posicionarGlobo();
      else if (ev === 'marca' && arg === e && tu.paso === 'marca') { tu.paso = 'hecho'; globo(() => $('.tab.conMarca:not([aria-selected=true])') || $('#marcados'), t('tut.marcaBien', { x: actorCs }), { sig: true }); setTimeout(() => { if (globoObj && globoObj.opts.sig) cerrarGlobo(); }, 4500); }
      else if (ev === 'verificado' && arg > 0) globo('#infBody .banda', t('tut.regla'), { sig: true });
      // Los globos informativos no estorban: tocar un hueco o colocar una ficha los cierra.
      else if ((ev === 'activo' || ev === 'colocado') && globoObj && globoObj.opts.sig) cerrarGlobo();
    } else if (tu.n === 3) {
      if (ev === 'inicio' && P.cursor == null) { tu.paso = 'curva'; globo('#telCv', t('tut.curva')); }
      else if (ev === 'cursor' && tu.paso === 'curva') { tu.paso = 'foto'; const i = caso.registros.findIndex((r) => r.tipo === 'foto'); globo('.tab[data-r="' + i + '"]', t('tut.abreFoto')); }
      else if (ev === 'registro' && tu.paso === 'foto' && caso.registros[P.reg].tipo === 'foto') { tu.paso = 'zoom'; setTimeout(() => globo('#fotoCv', t('tut.pellizca')), 120); }
      else if (ev === 'zoom' && tu.paso === 'zoom') { tu.paso = 'hecho'; cerrarGlobo(); }
      else if (ev === 'registro' && tu.paso === 'curva') posicionarGlobo();
    }
  }

  // ───────────── Disposición (giro, pantalla completa, teclado virtual) ─────────────
  let rafLayout = 0;
  function relayout(ya) {
    const hacer = () => {
      rafLayout = 0;
      if (fondo) fondo.tam();
      const jg = $('#sJuego');
      const nuevo = decidirLayout();
      if (nuevo !== G.layout || !jg.classList.contains(nuevo)) {
        jg.classList.remove('port', 'land', 'wide');
        jg.classList.add(nuevo);
        const cambio = G.layout !== nuevo;
        G.layout = nuevo;
        if (nuevo !== 'port') G.bancoAbierto = false;
        if (cambio && G.pantalla === 'juego') renderBanco();
      }
      if (G.layout === 'port') {
        const s = G.split || (W.innerHeight < 700 ? [1, 1] : [1.05, 0.95]);
        jg.style.setProperty('--rReg', s[0] + 'fr'); jg.style.setProperty('--rInf', s[1] + 'fr');
      }
      if (G.pantalla === 'juego') {
        if (G.fotoCtl) G.fotoCtl.dibujar();
        if (G.telCtl) G.telCtl.dibujar();
      }
      if (G.pantalla === 'inicio') animarCaja(true);
      posicionarGlobo();
      cerrarMenuHueco();
    };
    if (ya === true) hacer();
    else if (!rafLayout) rafLayout = requestAnimationFrame(hacer);
  }
  W.addEventListener('resize', () => relayout());
  W.addEventListener('orientationchange', () => setTimeout(() => relayout(), 120));
  if (W.visualViewport) W.visualViewport.addEventListener('resize', () => relayout());

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      AU.suspender();
      if (G.pantalla === 'juego' && partidaViva() && !G.ocupado) pausar(true, true);
      guardarPartida(true);
      if (fondo) fondo.parar();
    } else {
      if (!G.pausado || G.pantalla !== 'juego') AU.reanudar();
      if (fondo && !quieto()) fondo.arrancar();
      if (G.pantalla === 'inicio') animarCaja(true);
    }
  });
  W.addEventListener('pagehide', () => guardarPartida(true));

  // Cronómetro: solo cuenta en juego, sin pausa, con la pestaña visible.
  let tPrev = performance.now(), ultimoGuardado = 0;
  setInterval(() => {
    const ahora = performance.now();
    const dt = Math.min(1000, ahora - tPrev); tPrev = ahora;
    if (G.pantalla === 'juego' && partidaViva() && !G.pausado && !document.hidden && !G.apertura && !G.ocupado && !ajustesAbiertos()) {
      const antes = Math.floor(G.P.tiempoMs / 1000);
      G.P.tiempoMs += dt;
      if (Math.floor(G.P.tiempoMs / 1000) !== antes) pintarCrono();
      if (ahora - ultimoGuardado > 5000) { ultimoGuardado = ahora; guardarPartida(); }
    }
    if (G.pantalla === 'inicio') { const c = $('#iCuenta'); const d = DIARIO[fechaJuego()]; if (c && d) c.textContent = t(d.rendido ? 'btn.diarioRendido' : 'btn.diarioResuelto', { t: cuentaAtras() }); if (c && !d) renderInicio(); }
    if (G.pantalla === 'resultado') { const c = $('#rCuenta'); if (c) c.textContent = t('res.proximo', { t: cuentaAtras() }); }
  }, 250);

  // ───────────── Eventos del juego (delegados) ─────────────
  const jg = $('#sJuego');
  let lp = null, drag = null, suprimirClick = false;
  jg.addEventListener('click', (e) => {
    if (suprimirClick) { suprimirClick = false; return; }
    const x = e.target.closest('button, .ent');
    if (!x) { if (G.mano && !e.target.closest('.banco')) { G.mano = null; renderBanco(); $$('#infBody .hueco').forEach((b) => b.classList.remove('late')); } return; }
    AU.iniciar();
    if (x.classList.contains('ent')) { marcar(x.dataset.e, e); return; }
    if (x.classList.contains('tab')) { abrirRegistro(+x.dataset.r); return; }
    if (x.classList.contains('hueco')) { tocarHueco(x.dataset.h); return; }
    if (x.classList.contains('ficha')) { tocarFicha(x.dataset.f); return; }
    if (x.classList.contains('mchip')) { marcar(x.dataset.e); return; }
    switch (x.id) {
      case 'verificar': verificar(); break;
      case 'jBanco': abrirBanco(!G.bancoAbierto); break;
      case 'jCerrarB': abrirBanco(false); setActivo(null, true); break;
      case 'jTodas': G.verTodas = !G.verTodas; sfx('boton'); renderBanco(); break;
      case 'jHist': abrirHistorial(); break;
      case 'jRendirse': rendirse(); break;
      case 'jPausa': case 'jMenu': pausar(true); break;
      case 'jAj': sfx('boton'); abrirAjustes(); break;
    }
  });
  jg.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('ent')) { e.preventDefault(); marcar(e.target.dataset.e); } });
  // mantener pulsado un hueco lleno + arrastrar fichas
  jg.addEventListener('pointerdown', (e) => {
    const hb = e.target.closest('.hueco');
    if (hb && G.P && G.P.huecos[hb.dataset.h] != null && partidaViva()) {
      lp = { h: hb.dataset.h, x: e.clientX, y: e.clientY, t: setTimeout(() => { suprimirClick = true; abrirMenuHueco(lp.h, lp.x, lp.y); lp = null; }, 450) };
    }
    const fb = e.target.closest('.ficha');
    if (fb && !fb.classList.contains('agotada') && partidaViva() && !G.ocupado) {
      drag = { fid: fb.dataset.f, el: fb, x: e.clientX, y: e.clientY, activo: false, t0: performance.now(), touch: e.pointerType !== 'mouse', id: e.pointerId, listo: e.pointerType === 'mouse' };
      if (drag.touch) drag.tm = setTimeout(() => { if (drag && !drag.activo) { drag.listo = true; fb.classList.add('mano'); vibrar(8); } }, 170);
    }
    if (e.target.closest('.asa')) iniciarSplit(e);
  });
  W.addEventListener('pointermove', (e) => {
    if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 8) { clearTimeout(lp.t); lp = null; }
    if (!drag || e.pointerId !== drag.id) return;
    const d = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
    if (!drag.activo) {
      if (d < 8) return;
      if (!drag.listo) { clearTimeout(drag.tm); drag = null; return; } // era un desplazamiento del banco
      drag.activo = true;
      const f = fichaDe(drag.fid);
      const fa = $('#fantasma');
      fa.innerHTML = drag.el.outerHTML; fa.classList.add('on');
      $$('#infBody .hueco').forEach((b) => b.classList.toggle('late', G.caso.huecos[b.dataset.h].cat === f.cat));
      sfx('levantar');
      if (G.layout === 'port') { G.bancoAbierto = false; $('#banco').classList.remove('abierta'); }
    }
    const fa = $('#fantasma');
    fa.style.left = e.clientX + 'px'; fa.style.top = e.clientY + 'px';
    const sob = document.elementFromPoint(e.clientX, e.clientY);
    const hb = sob && sob.closest('.hueco');
    $$('#infBody .hueco').forEach((b) => b.classList.toggle('act', b === hb && G.caso.huecos[b.dataset.h].cat === fichaDe(drag.fid).cat));
  });
  const finDrag = (e) => {
    if (lp) { clearTimeout(lp.t); lp = null; }
    if (!drag || (e && e.pointerId !== drag.id)) return;
    clearTimeout(drag.tm);
    const dr = drag; drag = null;
    dr.el.classList.remove('mano');
    if (!dr.activo) return;
    suprimirClick = true; setTimeout(() => { suprimirClick = false; }, 60);
    $('#fantasma').classList.remove('on');
    $$('#infBody .hueco').forEach((b) => b.classList.remove('late', 'act'));
    if (!e || e.type === 'pointercancel') return;
    const sob = document.elementFromPoint(e.clientX, e.clientY);
    const hb = sob && sob.closest('.hueco');
    const f = fichaDe(dr.fid);
    if (hb) { if (G.caso.huecos[hb.dataset.h].cat === f.cat) colocar(hb.dataset.h, f.valor, null); else noEncaja(hb.dataset.h); }
    else renderBanco();
  };
  W.addEventListener('pointerup', finDrag);
  W.addEventListener('pointercancel', finDrag);
  document.addEventListener('touchmove', (e) => { if (drag && drag.listo) e.preventDefault(); }, { passive: false });
  document.addEventListener('pointerdown', (e) => { AU.iniciar(); if (!e.target.closest('#menuHueco')) cerrarMenuHueco(); }, true);
  document.addEventListener('keydown', () => AU.iniciar(), true);

  // Separador arrastrable (vertical)
  function iniciarSplit(e) {
    if (G.layout !== 'port') return;
    const asa = $('#asa'); asa.classList.add('arr');
    const v = $('#visor').getBoundingClientRect(), inf = $('#informe').getBoundingClientRect();
    const total = v.height + inf.height, top = v.top;
    const mover = (ev) => {
      const r = Math.max(0.25, Math.min(0.75, (ev.clientY - top) / total));
      G.split = [+(r * 2).toFixed(3), +((1 - r) * 2).toFixed(3)];
      jg.style.setProperty('--rReg', G.split[0] + 'fr'); jg.style.setProperty('--rInf', G.split[1] + 'fr');
      if (G.fotoCtl) G.fotoCtl.dibujar(); if (G.telCtl) G.telCtl.dibujar();
    };
    const fin = () => { asa.classList.remove('arr'); W.removeEventListener('pointermove', mover); W.removeEventListener('pointerup', fin); try { sessionStorage.setItem(PRE + 'split', JSON.stringify(G.split)); } catch (er) { /* */ } };
    W.addEventListener('pointermove', mover); W.addEventListener('pointerup', fin);
  }

  // ───────────── Teclado ─────────────
  document.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'Escape') {
      if ($('#menuHueco').classList.contains('on')) { cerrarMenuHueco(); return; }
      for (const id of ['dialogo', 'historial', 'lupa']) if ($('#' + id).classList.contains('on')) { $('#' + id).classList.remove('on'); return; }
      if ($('#sAjustes').classList.contains('on')) { cerrarAjustes(); return; }
    }
    if (G.pantalla !== 'juego' || G.apertura) {
      if (G.apertura && (k === 'Enter' || k === ' ' || k === 'Escape')) $('#apertura').click();
      return;
    }
    if ($('.capa.on:not(#pausa)')) return;
    if (G.pausado) { if (k === 'Escape' || k === 'p' || k === 'P') { e.preventDefault(); pausar(false); } return; }
    const P = G.P, caso = G.caso;
    if (k === 'Escape' || k === 'p' || k === 'P') { e.preventDefault(); if (G.bancoAbierto) { abrirBanco(false); return; } pausar(true); return; }
    if (!partidaViva()) return;
    const ids = idsHuecos(caso);
    if (k === 'Tab') {
      e.preventDefault();
      const i = G.activo ? ids.indexOf(G.activo) : -1;
      const n = e.shiftKey ? (i <= 0 ? ids.length - 1 : i - 1) : (i + 1) % ids.length;
      setActivo(ids[n]);
      const b = $('.hueco[data-h="' + ids[n] + '"]'); if (b) b.focus({ preventScroll: true });
      return;
    }
    if ((k === 'v' || k === 'V') || (k === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); verificar(); return; }
    if (k === 'h' || k === 'H') { abrirHistorial(); return; }
    if (/^[1-6]$/.test(k)) { if (+k <= caso.registros.length) abrirRegistro(+k - 1); return; }
    if (k === '[' || k === ']') { abrirRegistro(P.reg + (k === ']' ? 1 : -1)); return; }
    if ((k === 'm' || k === 'M') && document.activeElement && document.activeElement.classList.contains('ent')) { marcar(document.activeElement.dataset.e); return; }
    if ((k === '+' || k === '=' || k === '-' || k === '0') && G.fotoCtl) { G.fotoCtl.zoom(k === '0' ? 0 : k === '-' ? 1 / 1.5 : 1.5); return; }
    if ((k === 'Delete' || k === 'Backspace') && G.activo) { e.preventDefault(); quitar(G.activo); return; }
    if (G.activo && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k) && document.activeElement !== $('#telCv')) {
      e.preventDefault();
      const fs = $$('#bancoBody .grupo[data-cat="' + caso.huecos[G.activo].cat + '"] .ficha:not(.agotada)');
      if (!fs.length) return;
      G.focoFicha = G.focoFicha < 0 ? 0 : (G.focoFicha + (k === 'ArrowLeft' || k === 'ArrowUp' ? -1 : 1) + fs.length) % fs.length;
      fs.forEach((f, i) => f.classList.toggle('foco', i === G.focoFicha));
      fs[G.focoFicha].scrollIntoView({ block: 'nearest' });
      sfx('tic', G.focoFicha / fs.length);
      return;
    }
    if ((k === 'Enter' || k === ' ') && G.activo && G.focoFicha >= 0) {
      const f = $$('#bancoBody .grupo[data-cat="' + caso.huecos[G.activo].cat + '"] .ficha:not(.agotada)')[G.focoFicha];
      if (f) { e.preventDefault(); const h = G.activo; tocarFicha(f.dataset.f); const nb = $('.hueco[data-h="' + (G.activo || h) + '"]'); if (nb) nb.focus({ preventScroll: true }); }
    }
  });

  // ───────────── Gancho de pruebas ─────────────
  W.CAJANEGRA = {
    estado() {
      const P = G.P;
      return {
        pantalla: G.pantalla, modo: P && P.ref.modo, idCaso: G.caso && G.caso.id, huecos: P ? Object.assign({}, P.huecos) : null, envios: P ? P.envios.length : 0,
        historialK: P ? P.envios.map((e) => e.k) : [], registroAbierto: P ? P.reg : null, zoomFoto: Object.assign({}, G.foto), cursorTelemetria: P ? P.cursor : null,
        scrollInforme: ($('#infBody') || {}).scrollTop || 0, scrollRegistro: ($('#regBody') || {}).scrollTop || 0, activo: G.activo, mano: G.mano, layout: G.layout,
        pausado: G.pausado, bancoAbierto: G.bancoAbierto, tiempoMs: P ? Math.round(P.tiempoMs) : 0, idioma: L, banda: P ? P.banda : null, marcas: P ? P.marcas.map((m) => m.e) : [],
        resuelto: P ? P.resuelto : false, rendido: P ? P.rendido : false, pantallaCompleta: enFS(), audio: AU.estado(), tema: AU.temaActual()
      };
    },
    generar(x, dif) { if (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)) return CNX.cal.casoDiario(x); return CNX.gen.generar({ semilla: x >>> 0, dif: dif || 2 }); },
    validarCaso: (c) => CNX.validarCaso(c || G.caso),
    solucion() { if (!DEBUG || !G.caso) return null; const o = {}; for (const h in G.caso.huecos) o[h] = G.caso.huecos[h].valor; return o; },
    caso: () => G.caso,
    colocar(h, v) { if (!G.caso || !G.caso.huecos[h]) return false; const f = fichaDe(v); return colocar(h, f ? f.valor : v, null); },
    vaciar(h) { quitar(h); return true; },
    verificar: () => verificar(),
    abrirRegistro: (i) => { abrirRegistro(i); return G.P.reg; },
    marcar: (e) => { marcar(e); return G.P.marcas.map((m) => m.e); },
    irA: (p) => irA(p),
    empezar: (modo, arg, dif) => {
      if (modo === 'diario') empezar({ modo, fecha: arg || fechaJuego() });
      else if (modo === 'campana') empezar({ modo, i: arg || 0 });
      else if (modo === 'practica') empezar({ modo, semilla: arg || 12345, dif: dif || 2 });
      else empezar({ modo: 'tutorial', n: arg || 1 });
    },
    saltarApertura: () => { if (G.apertura) $('#apertura').click(); },
    pausar: () => pausar(true), continuar: () => pausar(false),
    forzarFecha(f) { if (!DEBUG) return false; G.fechaForzada = f; if (G.pantalla === 'inicio') renderInicio(); return true; },
    saltarTutorial() { TUT.saltado = true; guardarTodo(); if (G.pantalla === 'inicio') renderInicio(); },
    exportarMuestra: (s) => AU.exportarMuestra(s),
    textoCompartir: () => G.ultimoInfo ? textoCompartir(G.ultimoInfo).texto : null,
    idioma: (l) => cambiarIdioma(l)
  };

  // ───────────── Arranque ─────────────
  let fondo = null;
  try { fondo = DB.fondo($('#fondo'), { quieto }); fondo.tam(); if (!quieto()) fondo.arrancar(); } catch (e) { fondo = null; }
  AU.volumenes({ musica: AJ.musica, volMusica: AJ.volMusica, efectos: AJ.efectos, volEfectos: AJ.volEfectos });
  aplicarClases();
  traducirFijos();
  $('#bFS').addEventListener('click', () => { AU.iniciar(); alternarFS(); });
  $('#bAj').addEventListener('click', () => { AU.iniciar(); sfx('boton'); abrirAjustes(); });
  relayout(true);
  // ?caso=XXXX&d=2 abre un caso de práctica compartido
  const cp = params.get('caso');
  const sem = cp ? CNX.deB36(cp) : null;
  irA('inicio');
  if (sem) { const d = Math.max(1, Math.min(3, +params.get('d') || 2)); setTimeout(() => empezar({ modo: 'practica', semilla: sem, dif: d }), 50); }
})();
