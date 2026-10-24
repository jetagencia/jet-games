/* JET//Señal — aplicación: pantallas, partida, panel de formular, veredicto, tutorial, guardado y ciclo de vida. */
(function () {
  'use strict';
  const R = window.Reglas, V = window.Verif, P = window.Piezas, S = window.Sonda, A = window.SAudio, TT = window.SENAL_T;
  const EPOCH = '2026-10-22';
  const PRE = 'jet-senal:v1:';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const ahora = () => performance.now();
  const qs = new URLSearchParams(location.search);
  const DEMO = qs.has('demo'); // escena de la portada: no lee ni escribe nada del jugador

  // ---------- almacenamiento ----------
  let hayGuardado = true;
  try { localStorage.setItem(PRE + '_t', '1'); localStorage.removeItem(PRE + '_t'); } catch (e) { hayGuardado = false; }
  const st = {
    get(k, d) { if (DEMO && k !== 'ajustes') return d; try { const v = localStorage.getItem(PRE + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { if (DEMO) return; try { localStorage.setItem(PRE + k, JSON.stringify(v)); } catch (e) { hayGuardado = false; } },
    del(k) { if (DEMO) return; try { localStorage.removeItem(PRE + k); } catch (e) { /* nada */ } },
    claves() { const o = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf(PRE) === 0) o.push(k.slice(PRE.length)); } } catch (e) { /* nada */ } return o; }
  };

  // ---------- ajustes e idioma ----------
  const reducidoSO = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // El idioma es el de todo jetgames.fun (src/jet-idioma.js): ?lang > cookie jet_lang / localStorage > navegador.
  const JI = window.JETIdioma;
  const aj = Object.assign({ musica: true, volMusica: 0.7, efectos: true, volEfectos: 0.8, vibracion: true, letras: false, movReducido: reducidoSO, atajos: false }, st.get('ajustes', {}));
  if ('idioma' in aj) {
    // Migración única: el idioma que el juego guardaba por su cuenta pasa a la elección común,
    // salvo que ya haya una elección del sitio (cookie o localStorage) o un ?lang en la dirección.
    let comun = false;
    try { comun = /(?:^|;\s*)jet_lang=(es|en)\b/.test(document.cookie) || /^(es|en)$/.test(localStorage.getItem('jet_lang') || ''); } catch (e) { /* nada */ }
    if (!comun && !qs.get('lang') && (aj.idioma === 'es' || aj.idioma === 'en') && JI) JI.set(aj.idioma);
    delete aj.idioma;
    if (!DEMO) st.set('ajustes', aj);
  }
  const guardarAjustes = () => st.set('ajustes', aj);
  const lang = () => (JI && JI.get() === 'en') ? 'en' : 'es';
  function t(k, vars) {
    let s = TT[lang()][k];
    if (s == null) s = TT.es[k];
    if (s == null) return k;
    if (vars && vars.p != null && vars.pw == null) vars = Object.assign({ pw: TT[lang()][vars.p === 1 ? 'pulsoS' : 'pulsoP'] }, vars);
    if (typeof s === 'string' && vars) s = s.replace(/\{([^{}]+)\}/g, (m, x) => vars[x] != null ? vars[x] : m);
    return s;
  }
  const marcado = s => esc(s).replace(/\u0001/g, '<b>').replace(/\u0002/g, '</b>');
  function aplicarIdioma() {
    document.documentElement.lang = lang();
    document.title = t('docTitulo');
    $$('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
    $$('[data-ta]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.ta)); if (!el.classList.contains('seg')) el.title = t(el.dataset.ta); });
    const j = document.getElementById('juego'); if (j) j.setAttribute('aria-label', 'JET//' + t('titulo'));
    $$('.seg-idioma button[data-lang]').forEach(b => { const on = b.dataset.lang === lang(); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  }
  let letrasDefs = null;
  function aplicarAjustes() {
    document.body.classList.toggle('letras', !!aj.letras);
    if (letrasDefs !== !!aj.letras) {
      letrasDefs = !!aj.letras;
      const v = document.getElementById('pzDefs'); if (v) v.remove();
      document.body.insertAdjacentHTML('afterbegin', P.defs(letrasDefs));
      if (el && el.paleta && el.paleta.children.length) { renderPaleta(); renderBandeja(); renderRegistro(); }
    }
    document.body.classList.toggle('reducido', !!aj.movReducido);
    // PLAY-SENAL-05: ayuda compacta junto a la bandeja + tecla visible sobre cada pieza
    document.body.classList.toggle('atajos-on', !!aj.atajos);
    if (el && el.btnAtajos) { el.btnAtajos.setAttribute('aria-expanded', aj.atajos ? 'true' : 'false'); el.btnAtajos.classList.toggle('on', !!aj.atajos); }
    if (el && el.ayudaBand) el.ayudaBand.hidden = !aj.atajos;
    A.prefs({ musica: aj.musica, volMusica: aj.volMusica, efectos: aj.efectos, volEfectos: aj.volEfectos });
  }
  const vibrar = p => { if (aj.vibracion && navigator.vibrate) try { navigator.vibrate(p); } catch (e) { /* nada */ } };

  // ---------- fechas ----------
  let fechaForzada = /^\d{4}-\d{2}-\d{2}$/.test(qs.get('fecha') || '') ? qs.get('fecha') : null;
  const pad = n => (n < 10 ? '0' : '') + n;
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const hoy = () => fechaForzada || ymd(new Date());
  const partesF = f => f.split('-').map(Number);
  function diasEntre(a, b) { const [y1, m1, d1] = partesF(a), [y2, m2, d2] = partesF(b); return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5); }
  const numDe = f => diasEntre(EPOCH, f) + 1;
  function fechaDeNum(n) { const [y, m, d] = partesF(EPOCH); const x = new Date(Date.UTC(y, m - 1, d + n - 1)); return x.getUTCFullYear() + '-' + pad(x.getUTCMonth() + 1) + '-' + pad(x.getUTCDate()); }
  const ayerDe = f => { const [y, m, d] = partesF(f); const x = new Date(Date.UTC(y, m - 1, d - 1)); return x.getUTCFullYear() + '-' + pad(x.getUTCMonth() + 1) + '-' + pad(x.getUTCDate()); };
  const dowDe = f => { const [y, m, d] = partesF(f); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
  function fechaCorta(f) { const [, m, d] = partesF(f); return t('dias')[dowDe(f)] + ' ' + d + ' ' + t('meses')[m - 1]; }
  function faltaMedianoche() {
    const d = new Date(), m = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    const s = Math.max(0, Math.floor((m - d) / 1000));
    return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
  }

  // ---------- contenido: banco y calendario ----------
  let BANCO = null, CAL = null;
  function banco() {
    if (BANCO) return BANCO;
    BANCO = [[], [], [], [], [], []];
    try {
      window.SENAL_BANCO.niveles.forEach((s, i) => {
        if (!s) return;
        for (const e of s.split(';')) { const [code, par, ga, gr] = e.split(','); BANCO[i].push({ code, par: +par, ga: R.textoAFila(ga), gr: R.textoAFila(gr), nivel: i + 1 }); }
      });
    } catch (e) { /* banco ausente: se usa el de reserva */ }
    if (!BANCO.some(a => a.length)) BANCO[0].push({ code: 'HAY:c', par: 6, ga: [8, 1], gr: [12, 17], nivel: 1 });
    return BANCO;
  }
  function calendario() {
    if (CAL) return CAL;
    try {
      const bin = atob(window.SENAL_CAL.d), k = 'jet//senal', b = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i) ^ k.charCodeAt(i % k.length);
      CAL = JSON.parse(new TextDecoder().decode(b)).map(e => ({ code: e[0], ga: R.textoAFila(e[1]), gr: R.textoAFila(e[2]), par: e[3], nivel: e[4] }));
    } catch (e) { CAL = []; }
    return CAL;
  }
  function senalDe(fecha) {
    const n = numDe(fecha), cal = calendario();
    if (n >= 1 && n <= cal.length) return Object.assign({ n, fecha }, cal[n - 1]);
    // fuera del calendario: del banco, con semilla de la fecha
    const rnd = V.mulberry32(V.hashStr('senal:' + fecha));
    const niv = { 1: [1, 2, 3], 2: [2, 3], 3: [3], 4: [3, 4], 5: [4], 6: [5], 0: [4, 5] }[dowDe(fecha)];
    const nv = niv[(rnd() * niv.length) | 0];
    const b = banco(), lista = b[nv - 1].length ? b[nv - 1] : b.flat();
    const e = lista[(rnd() * lista.length) | 0];
    return Object.assign({ n: Math.max(1, n), fecha }, e);
  }
  const XK = 'sonda-jet';
  const ofus = s => { let o = ''; for (let i = 0; i < s.length; i++) o += String.fromCharCode(s.charCodeAt(i) ^ XK.charCodeAt(i % XK.length)); return btoa(o); };
  const desofus = s => { try { const b = atob(s); let o = ''; for (let i = 0; i < b.length; i++) o += String.fromCharCode(b.charCodeAt(i) ^ XK.charCodeAt(i % XK.length)); return o; } catch (e) { return 'HAY:c'; } };

  // partida guardada: se valida antes de usarla (una clave corrupta o de otra versión nunca rompe la pantalla)
  function valida(p) {
    try {
      if (!p || typeof p !== 'object' || typeof p.rx !== 'string' || !Array.isArray(p.registro) || p.registro.length < 2) return null;
      if (['jugando', 'resuelta', 'rendida'].indexOf(p.estado) < 0) return null;
      const code = desofus(p.rx); R.compilar(code); if (!R.texto(code, 'es')) return null;
      const fila = f => Array.isArray(f) && f.length >= 1 && f.length <= 5 && f.every(x => Number.isInteger(x) && x >= 0 && x < 18);
      if (!p.registro.every(e => e && fila(e.p) && (e.a === 0 || e.a === 1))) return null;
      if (!Array.isArray(p.bandeja) || p.bandeja.length > 5 || !p.bandeja.every(x => Number.isInteger(x) && x >= 0 && x < 18)) p.bandeja = [];
      if (typeof p.sel !== 'number' || p.sel >= p.bandeja.length) p.sel = -1;
      p.fallos = Math.max(0, p.fallos | 0); p.tiempo = Math.max(0, +p.tiempo || 0); p.par = clamp(+p.par || 8, 1, 30);
      if (typeof p.seq !== 'string') p.seq = '';
      if (p.borrador && !(p.borrador.c && Array.isArray(p.borrador.c) && p.borrador.c.length >= 1 && p.borrador.c.length <= 2)) p.borrador = null;
      return p;
    } catch (e) { return null; }
  }
  const leerPartida = k => valida(st.get(k, null));

  // ---------- perfil y estadísticas ----------
  const perfil = Object.assign({ id: Math.random().toString(36).slice(2, 10), creado: Date.now(), tutorial: null, tutPaso: 0, nivelPractica: 1, contadorPractica: 0, vistas: [], familias: {}, todo: false, avisoFichas: false, ultimaFam: null }, st.get('perfil', {}));
  const stats = Object.assign({ diarias: { jugadas: 0, resueltas: 0, racha: 0, rachaMax: 0, ultimaResuelta: null, distribucion: [0, 0, 0, 0], sumaPulsos: 0, sumaPar: 0 }, practica: { resueltas: 0, porRango: [0, 0, 0, 0, 0, 0] } }, st.get('stats', {}));
  const guardarPerfil = () => st.set('perfil', perfil);
  const guardarStats = () => st.set('stats', stats);
  if (!st.get('perfil', null)) guardarPerfil();
  const rango = () => clamp(Math.floor(perfil.nivelPractica), 1, 6);
  const nombreRango = r => t('rango', { r, nombre: t('rangos')[r - 1] });
  function rachaEfectiva() {
    const u = stats.diarias.ultimaResuelta; if (!u) return 0;
    const h = hoy();
    return (u === h || u === ayerDe(h)) ? stats.diarias.racha : 0;
  }
  // presentación progresiva de familias
  const BASE_FAM = ['existencia', 'posicion', 'cantidad', 'vecindad'];
  function familiasAbiertas() {
    if (perfil.todo) return R.FAMILIAS.slice();
    const f = BASE_FAM.slice();
    if (stats.practica.resueltas >= 2 || stats.diarias.resueltas >= 1) f.push('igualdad', 'comparacion', 'orden');
    if (rango() >= 4 || stats.diarias.resueltas >= 3) f.push('simetria', 'combinadas');
    return f;
  }
  function reglaAbierta(code, fams) {
    const r = R.leer(code);
    if (r.op) return fams.includes('combinadas') && fams.includes(R.MOLDES[r.a.m].fam) && fams.includes(R.MOLDES[r.b.m].fam);
    return fams.includes(R.MOLDES[r.m].fam);
  }

  // ---------- partida ----------
  let partida = null, fnSecreta = null, codeSecreta = null;
  const enviadas = p => p.registro.filter(e => e.t === 'e').length;
  const COSTO_FALLO = 2; // pulsos que suma una comprobación de regla rechazada (regla vigente, no se modifica)
  const pulsosDe = p => enviadas(p) + COSTO_FALLO * p.fallos;
  const claveDe = p => p.modo === 'practica' ? 'practica' : p.modo === 'tutorial' ? 'tutorial' : 'diario:' + p.fecha;
  function crearPartida(o) {
    return {
      v: 1, modo: o.modo, n: o.n || 0, fecha: o.fecha || null, nivel: o.nivel || 0, tut: o.tut == null ? null : o.tut,
      rx: ofus(o.code), par: o.par || 8, registro: [{ p: o.ga.slice(), a: 1, t: 'r' }, { p: o.gr.slice(), a: 0, t: 'r' }],
      bandeja: [], sel: -1, borrador: null, fallos: 0, seq: '', inicio: Date.now(), tiempo: 0, estado: 'jugando', version: null, rangoAntes: rango()
    };
  }
  function activar(p) {
    partida = p; codeSecreta = desofus(p.rx); fnSecreta = R.compilar(codeSecreta);
    st.set('activa', claveDe(p));
  }
  let tGuardar = 0;
  function guardar() { clearTimeout(tGuardar); tGuardar = setTimeout(guardarYa, 300); }
  function guardarYa() { clearTimeout(tGuardar); if (partida) { acumularTiempo(); st.set(claveDe(partida), partida); } }
  let tActivo = 0;
  function acumularTiempo() { if (tActivo && partida && partida.estado === 'jugando') { partida.tiempo += Date.now() - tActivo; tActivo = Date.now(); } }
  const cronometro = on => { acumularTiempo(); tActivo = on ? Date.now() : 0; };

  // ---------- elementos ----------
  const el = {
    inicio: $('#inicio'), juego: $('#juego'), cvFondo: $('#cvFondo'), cvSonda: $('#cvSonda'), listaA: $('#listaA'), listaR: $('#listaR'),
    cntA: $('#cntA'), cntR: $('#cntR'), bandeja: $('#bandeja'), paleta: $('#paleta'), panel: $('#panel'), velo: $('#velo'), modal: $('#modal'),
    toast: $('#toast'), hudN: $('#hudN'), hudTitulo: $('#hudTitulo'), hudDelta: $('#hudDelta'), btnEnviar: $('#btnEnviar'), btnFormular: $('#btnFormular'),
    btnVaciar: $('#btnVaciar'), btnPausa: $('#btnPausa'), btnFs: $('#btnFs'), btnAjustes: $('#btnAjustes'), menuTarj: $('#menuTarj'),
    globo: $('#globo'), globoTxt: $('#globoTxt'), globoBtn: $('#globoBtn'), saltar: $('#btnSaltarTut'), vuelo: $('#vuelo'), vivo: $('#sondaVivo'),
    zSonda: $('#zSonda'), cvResAstro: $('#cvResAstro'), btnAtajos: $('#btnAtajos'), ayudaBand: $('#ayudaBand'), hudLbl: $('#hudLbl'), hudTotal: $('#hudTotal'), hudR: $('#hudR'),
    back: $('#back'), barraDer: $('#barraDer')
  };

  let pantalla = 'inicio', ocupado = false, panelAbierto = false;
  const sonda = S.crearSonda(), sondaIni = S.crearSonda();
  const cielo = S.crearCielo(160, 31);

  // ---------- toast ----------
  let tToast = 0;
  function toast(msg, tipo, ms) {
    el.toast.textContent = msg; el.toast.className = 'on' + (tipo ? ' ' + tipo : '');
    if (pantalla === 'juego' && !panelAbierto && el.velo.hidden) { const r = el.bandeja.getBoundingClientRect(); el.toast.style.top = Math.max(60, r.top - 54) + 'px'; }
    else if (!el.velo.hidden) {
      // con una tarjeta abierta, el aviso va justo encima de ella (o debajo) para no tapar su título
      const r = el.modal.getBoundingClientRect();
      el.toast.style.top = r.top >= 56 ? Math.round(r.top - 46) + 'px' : r.bottom + 50 <= innerHeight ? Math.round(r.bottom + 8) + 'px' : '';
    } else el.toast.style.top = '';
    clearTimeout(tToast); tToast = setTimeout(() => { el.toast.className = ''; }, ms || 1800);
  }

  // ---------- disposición ----------
  let horiz = false;
  function layout() {
    const vv = window.visualViewport;
    const W = Math.min(1280, Math.round(vv ? vv.width : innerWidth)), H = Math.round(vv ? vv.height : innerHeight);
    horiz = W / H > 1.15;
    el.juego.classList.toggle('horiz', horiz);
    const root = document.documentElement.style;
    const gp = W < 360 ? 5 : 6;
    let pal, slot, mini, hS;
    if (!horiz) {
      const disp = W - 24;
      pal = clamp(Math.floor((disp - 5 * gp) / 6), 40, Math.min(66, Math.floor(H * 0.085)));
      slot = clamp(Math.floor((disp - 4 * gp - 14) / 5), 44, Math.min(68, Math.floor(H * 0.09)));
      mini = clamp(Math.floor((W / 2 - 58) / 5.4), 15, 28);
      // PLAY-SENAL-01: la Sonda decorativa cede altura a las tarjetas de muestras (antes 16 % / máx. 170 px)
      hS = panelAbierto ? 58 : clamp(Math.round(H * 0.14), 64, 140);
    } else {
      const hAv = H - 72;
      pal = clamp(Math.floor(Math.min((hAv - 5 * gp) / 6, (W * 0.3 - 2 * gp) / 3)), 38, W > 1200 ? 84 : 72);
      slot = clamp(Math.floor((W * 0.32 - 4 * gp - 16) / 5), 40, 72);
      mini = clamp(Math.floor((W * 0.38 / 2 - 58) / 5.4), 15, W >= 1200 && H >= 700 ? 34 : 28);
      hS = panelAbierto ? 52 : clamp(Math.round(H * 0.13), 56, 100);
    }
    root.setProperty('--pal', pal + 'px'); root.setProperty('--slot', slot + 'px'); root.setProperty('--mini', mini + 'px');
    root.setProperty('--gp', gp + 'px'); root.setProperty('--hSonda', hS + 'px');
    // VIS-SENAL-01: con miniaturas de hasta 28 px se usa la variante de detalle de los símbolos
    const chico = mini <= 28;
    if (chico !== miniChico) { miniChico = chico; if (partida && el.listaA.children.length) renderRegistro(); }
    // paleta: vertical 6×3 (filas = color), horizontal 3×6 (columnas = color)
    for (const b of el.paleta.children) {
      const id = +b.dataset.id, f = R.PF[id], c = R.PC[id], tm = R.PT[id], k = f * 2 + tm;
      if (horiz) { b.style.gridRow = String(k + 1); b.style.gridColumn = String(c + 1); }
      else { b.style.gridRow = String(c + 1); b.style.gridColumn = String(k + 1); }
    }
    posicionarGlobo();
    cajaIni = null;
    if (pantalla === 'inicio') dibujarFondo(true);
  }
  let rafLayout = 0, miniChico = true;
  const pedirLayout = () => { cancelAnimationFrame(rafLayout); rafLayout = requestAnimationFrame(layout); };

  // ---------- paleta ----------
  const TECLAS = [['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY'], ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH'], ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN']];
  const teclaDe = id => TECLAS[R.PC[id]][R.PF[id] * 2 + R.PT[id]];
  function renderPaleta() {
    let h = '';
    for (let c = 0; c < 3; c++) for (let f = 0; f < 3; f++) for (let tm = 0; tm < 2; tm++) {
      const id = R.idDe(f, c, tm);
      h += '<button class="pz" type="button" data-id="' + id + '" aria-label="' + esc(P.nombre(id, lang(), TT[lang()])) + '">' + P.svg(id) + '<span class="kbd">' + teclaDe(id).slice(3) + '</span></button>';
    }
    el.paleta.innerHTML = h;
    layout();
  }

  // ---------- bandeja ----------
  function renderBandeja() {
    if (!partida) return;
    const b = partida.bandeja;
    let h = '';
    for (let i = 0; i < 5; i++) {
      const id = b[i];
      const lleno = id != null, sel = partida.sel === i && lleno;
      // PLAY-SENAL-05 / VIS-SENAL-03: nombre accesible de acción por casilla; número de posición siempre visible en cápsula
      const d = lleno ? P.nombre(id, lang(), TT[lang()]) : '';
      const aria = lleno ? t(sel ? 'ranuraSel' : 'ranuraLlena', { i: i + 1, d }) : t('ranuraVacia', { i: i + 1 });
      h += '<button class="ranura' + (lleno ? ' llena' : '') + (sel ? ' sel' : '') + '" type="button" data-i="' + i + '" aria-label="' + esc(aria) + '"' + (lleno ? ' aria-pressed="' + sel + '"' : '') + '>' + (lleno ? P.svg(id) : '') + '<span class="idx" aria-hidden="true">' + (i + 1) + '</span></button>';
    }
    if (!b.length) h += '<div class="band-hint">' + esc(t('armaMuestra')) + '</div>';
    el.bandeja.innerHTML = h;
    el.btnEnviar.classList.toggle('off', !b.length);
    el.btnEnviar.setAttribute('aria-disabled', b.length ? 'false' : 'true');
    el.btnVaciar.disabled = !b.length;
  }
  function animarEncaje(i) { const r = el.bandeja.children[i]; if (r) { r.classList.remove('encaja'); void r.offsetWidth; r.classList.add('encaja'); } }
  function cambioBandeja(i) { renderBandeja(); if (i != null) animarEncaje(i); guardar(); Tut.evento('bandeja'); }
  function agregarPieza(id, origen) {
    if (!jugable()) return;
    if (!Tut.permite('paleta', id)) return Tut.rechazo();
    const b = partida.bandeja;
    if (partida.sel >= 0 && partida.sel < b.length) {
      if (b[partida.sel] === id) return;
      b[partida.sel] = id; A.sfx('encaja', id); vibrar(10);
      cambioBandeja(partida.sel);
      volar(origen, el.bandeja.children[partida.sel], id); return;
    }
    if (b.length >= 5) {
      const r = el.bandeja.children[4]; if (r) { r.classList.remove('tiembla'); void r.offsetWidth; r.classList.add('tiembla'); }
      A.sfx('lleno'); return;
    }
    b.push(id); A.sfx('tic', id); vibrar(10);
    cambioBandeja(b.length - 1);
    volar(origen, el.bandeja.children[b.length - 1], id);
    setTimeout(() => A.sfx('encaja', id), aj.movReducido ? 0 : 150);
  }
  function insertarPieza(id, pos) {
    if (!jugable()) return;
    if (!Tut.permite('paleta', id)) return Tut.rechazo();
    const b = partida.bandeja;
    if (b.length >= 5) { A.sfx('lleno'); return; }
    pos = clamp(pos, 0, b.length);
    b.splice(pos, 0, id); partida.sel = -1; A.sfx('encaja', id); vibrar(10);
    cambioBandeja(pos);
  }
  function quitarPieza(i) {
    if (!jugable() || i < 0 || i >= partida.bandeja.length) return;
    if (!Tut.permite('bandeja')) return Tut.rechazo();
    partida.bandeja.splice(i, 1); partida.sel = -1; A.sfx('quitar');
    cambioBandeja(null);
  }
  function moverPieza(de, a) {
    const b = partida.bandeja; a = clamp(a, 0, b.length - 1);
    if (de === a) return;
    const [x] = b.splice(de, 1); b.splice(a, 0, x);
    partida.sel = a; A.sfx('reordenar');
    cambioBandeja(a);
  }
  function seleccionar(i) {
    if (!jugable()) return;
    if (!Tut.permite('bandeja')) return Tut.rechazo();
    if (i >= partida.bandeja.length) { partida.sel = -1; renderBandeja(); return; }
    if (partida.sel === i) { quitarPieza(i); return; }
    partida.sel = i; A.sfx('seleccion'); renderBandeja();
  }
  function vaciar() {
    if (!jugable() || !partida.bandeja.length) return;
    if (!Tut.permite('vaciar')) return Tut.rechazo();
    partida.bandeja = []; partida.sel = -1; A.sfx('quitar'); cambioBandeja(null);
  }
  const jugable = () => partida && partida.estado === 'jugando' && pantalla === 'juego' && !ocupado && el.velo.hidden;
  // VIS-SENAL-02/04: el contraejemplo recién recibido queda resaltado de forma estática hasta la siguiente acción
  const limpiarContra = () => $$('.tarj.nuevo-contra').forEach(n => n.classList.remove('nuevo-contra'));

  // vuelo de una pieza (180 ms)
  function volar(origen, destino, id) {
    if (!origen || !destino || aj.movReducido) return;
    const a = origen.getBoundingClientRect(), b = destino.getBoundingClientRect();
    if (!a.width || !b.width) return;
    const d = document.createElement('div'); d.className = 'vuela'; d.innerHTML = P.svg(id);
    const s = Math.min(a.width, b.width) * 0.86;
    d.style.width = s + 'px'; d.style.height = s + 'px';
    el.vuelo.appendChild(d);
    const x0 = a.left + a.width / 2 - s / 2, y0 = a.top + a.height / 2 - s / 2, x1 = b.left + b.width / 2 - s / 2, y1 = b.top + b.height / 2 - s / 2;
    const an = d.animate([{ transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.9)', opacity: 1 }, { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(1)', opacity: 1 }], { duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' });
    const sv = destino.querySelector('.pz-svg') || destino;
    sv.style.visibility = 'hidden';
    const fin = () => { d.remove(); sv.style.visibility = ''; };
    an.onfinish = fin; setTimeout(fin, 260);
  }

  // ---------- gestos: tocar y arrastrar ----------
  let gesto = null;
  function slotEn(x, y) {
    const rs = Array.from(el.bandeja.children).filter(n => n.classList.contains('ranura'));
    for (let i = 0; i < rs.length; i++) { const r = rs[i].getBoundingClientRect(); if (x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 14 && y <= r.bottom + 14) return i; }
    return -1;
  }
  function dentroBandeja(x, y) { const r = el.bandeja.getBoundingClientRect(); return x >= r.left - 20 && x <= r.right + 20 && y >= r.top - 30 && y <= r.bottom + 30; }
  function iniciarGesto(e, origen, tgt) {
    if (e.button != null && e.button > 0) return;
    if (!jugable()) return;
    tgt.classList.add('hunde');
    gesto = { x0: e.clientX, y0: e.clientY, origen, arr: false, tgt, pid: e.pointerId, fantasma: null };
    try { tgt.setPointerCapture(e.pointerId); } catch (er) { /* nada */ }
  }
  function moverGesto(e) {
    const g = gesto; if (!g || e.pointerId !== g.pid) return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (!g.arr && dx * dx + dy * dy > 64) {
      g.arr = true;
      const id = g.origen.tipo === 'paleta' ? g.origen.id : partida.bandeja[g.origen.i];
      if (id == null) { g.arr = false; return; }
      g.fantasma = document.createElement('div'); g.fantasma.className = 'fantasma'; g.fantasma.innerHTML = P.svg(id);
      document.body.appendChild(g.fantasma);
      if (g.origen.tipo === 'bandeja') { const r = el.bandeja.children[g.origen.i]; if (r) r.style.opacity = '.3'; }
    }
    if (g.arr) {
      g.fantasma.style.left = e.clientX + 'px'; g.fantasma.style.top = e.clientY + 'px';
      const k = slotEn(e.clientX, e.clientY);
      $$('.ranura.destino').forEach(n => n.classList.remove('destino'));
      if (k >= 0 && el.bandeja.children[k]) el.bandeja.children[k].classList.add('destino');
    }
  }
  function finGesto(e, cancelado) {
    const g = gesto; if (!g || (e && e.pointerId !== g.pid)) return;
    gesto = null; g.tgt.classList.remove('hunde');
    $$('.ranura.destino').forEach(n => n.classList.remove('destino'));
    if (g.fantasma) g.fantasma.remove();
    if (g.origen.tipo === 'bandeja') { const r = el.bandeja.children[g.origen.i]; if (r) r.style.opacity = ''; }
    if (cancelado) return;
    if (!g.arr) { // toque
      if (g.origen.tipo === 'paleta') agregarPieza(g.origen.id, g.tgt);
      else seleccionar(g.origen.i);
      return;
    }
    const k = slotEn(e.clientX, e.clientY);
    if (g.origen.tipo === 'paleta') { if (k >= 0) insertarPieza(g.origen.id, k); return; }
    if (k >= 0) moverPieza(g.origen.i, k);
    else if (!dentroBandeja(e.clientX, e.clientY)) quitarPieza(g.origen.i);
  }
  el.paleta.addEventListener('pointerdown', e => { const b = e.target.closest('.pz'); if (!b) return; e.preventDefault(); iniciarGesto(e, { tipo: 'paleta', id: +b.dataset.id }, b); });
  el.bandeja.addEventListener('pointerdown', e => { const b = e.target.closest('.ranura'); if (!b) return; e.preventDefault(); iniciarGesto(e, { tipo: 'bandeja', i: +b.dataset.i }, b); });
  document.addEventListener('pointermove', moverGesto, { passive: true });
  document.addEventListener('pointerup', e => finGesto(e, false));
  document.addEventListener('pointercancel', e => finGesto(e, true));
  el.bandeja.addEventListener('contextmenu', e => { const b = e.target.closest('.ranura'); e.preventDefault(); if (b && jugable()) quitarPieza(+b.dataset.i); });
  el.paleta.addEventListener('contextmenu', e => e.preventDefault());
  // teclado sobre botones de la paleta/bandeja (Intro/Espacio)
  el.paleta.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.pz')) { e.preventDefault(); e.stopPropagation(); agregarPieza(+e.target.closest('.pz').dataset.id, e.target.closest('.pz')); } });
  el.bandeja.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.ranura')) { e.preventDefault(); e.stopPropagation(); seleccionar(+e.target.closest('.ranura').dataset.i); } });
  // tocar fuera deselecciona
  document.addEventListener('pointerdown', e => {
    if (!partida || partida.sel < 0 || pantalla !== 'juego') return;
    if (e.target.closest('#bandeja,#paleta')) return;
    partida.sel = -1; renderBandeja();
  }, true);

  // ---------- registro ----------
  // filaHTML(ids, mini): la variante mini (VIS-SENAL-01) se usa en registro, ejemplos y resultado, donde el render es <= 28 px
  function filaHTML(ids, mini) { return ids.map(id => (mini ? P.svgMini(id) : P.svg(id))).join(''); }
  function tarjHTML(e, i, marcas) {
    let cls = 'tarj' + (e.t === 'r' ? ' regalo' : '') + (e.t === 'c' ? ' contra' : '');
    // VIS-SENAL-02: tres columnas estables (índice · secuencia · veredicto); la caja del veredicto existe siempre
    let marca = '<span class="marca" aria-hidden="true"></span>';
    if (marcas) { const ok = marcas[i]; marca = '<span class="marca ' + (ok ? 'si' : 'no') + '">' + (ok ? '✓' : '✗') + '</span>'; if (!ok) cls += ' contra-d'; }
    // PLAY-SENAL-03: los ejemplos de regalo se rotulan «Ejemplo inicial» (visible y accesible) y conservan su número único
    const tipo = e.t === 'r' ? t('ejemploInicial') : e.t === 'c' ? t('contraejemplo') : t('enviada', { i: i + 1 });
    const lbl = '#' + (i + 1) + ' · ' + tipo + ': ' + e.p.map(id => P.nombre(id, lang(), TT[lang()])).join(', ');
    return '<div class="' + cls + '" data-i="' + i + '" role="button" tabindex="-1" aria-label="' + esc(lbl) + '"><span class="num">#' + (i + 1) + '</span><span class="fila">' + filaHTML(e.p, miniChico) + (e.t === 'r' ? '<span class="etq" aria-hidden="true">' + esc(t('ejemploInicial')) + '</span>' : '') + '</span>' + (e.t === 'c' ? '<span class="rombo" aria-hidden="true">◆</span>' : '') + marca + '</div>';
  }
  let marcasCoh = null, tNueva = 0;
  function renderRegistro(nuevo) {
    if (!partida) return;
    const reg = partida.registro;
    let ha = '', hr = '', na = 0, nr = 0;
    for (let i = reg.length - 1; i >= 0; i--) {
      const h = tarjHTML(reg[i], i, marcasCoh);
      if (reg[i].a) { ha += h; na++; } else { hr += h; nr++; }
    }
    el.listaA.innerHTML = ha; el.listaR.innerHTML = hr;
    el.cntA.textContent = na; el.cntR.textContent = nr;
    if (nuevo != null) {
      // VIS-SENAL-02/04: inserción de 220 ms (<= 6 px) y marca lateral de 2 px durante 700 ms
      const n = tarjetaDe(nuevo); if (n) { n.classList.add('entra', 'nueva'); const lista = n.parentElement; if (lista) lista.scrollTop = 0; clearTimeout(tNueva); tNueva = setTimeout(() => n.classList.remove('nueva'), 700); }
    }
    actualizarHud();
  }
  const tarjetaDe = i => document.querySelector('.tarj[data-i="' + i + '"]');
  function actualizarHud(animar) {
    if (!partida) return;
    const n = enviadas(partida);
    if (el.hudN.textContent !== String(n)) {
      el.hudN.textContent = n;
      if (animar !== false) { el.hudN.classList.remove('gira'); void el.hudN.offsetWidth; el.hudN.classList.add('gira'); }
    }
    // PLAY-SENAL-03: «Pruebas enviadas: {n}» (sin contar ejemplos iniciales ni contraejemplos) y «Muestras analizadas: {n}» (todo el registro)
    el.hudLbl.textContent = t('pruebasEnviadas', { n: '' }).replace(/\s+$/, '');
    el.hudTotal.textContent = t('muestrasAnalizadas', { n: partida.registro.length });
    el.hudR.setAttribute('aria-label', t('pruebasEnviadas', { n }) + ' · ' + t('muestrasAnalizadas', { n: partida.registro.length }));
    let tit;
    if (partida.modo === 'tutorial') tit = t('tutorialN', { i: (partida.tut || 0) + 1 });
    else if (partida.modo === 'practica') tit = t('practicaR', { r: partida.rangoAntes || rango() });
    else if (partida.fecha === hoy()) tit = t('senalN', { n: partida.n });
    else tit = t('archivoN', { n: partida.n });
    el.hudTitulo.textContent = tit;
    // formular se ilumina desde la 4.ª muestra, nunca antes de la 2.ª
    el.btnFormular.classList.toggle('lista', n >= 4);
    el.btnFormular.disabled = false;
    // capas musicales
    const acc = partida.registro.filter(e => e.a).length, rej = partida.registro.length - acc;
    A.capas({ uno: n >= 1, dos: n >= 4 || (acc >= 3 && rej >= 3), hip: panelAbierto });
    A.evidencia(partida.registro.filter(e => e.t !== 'r').map(e => e.a));
  }
  // menú de tarjeta
  let menuDe = -1, ultimoToqueTarj = { i: -1, t: 0 };
  function abrirMenuTarj(i, nodo) {
    menuDe = i;
    const hay = partida.bandeja.length > 0;
    el.menuTarj.innerHTML = '<button type="button" class="pri" data-m="copiar">⧉ ' + esc(hay ? t('reemplazar') : t('copiar')) + '</button><button type="button" data-m="grande">⤢ ' + esc(t('verGrande')) + '</button>';
    el.menuTarj.hidden = false;
    const r = nodo.getBoundingClientRect(), m = el.menuTarj.getBoundingClientRect();
    let x = r.left + r.width / 2 - m.width / 2, y = r.bottom + 6;
    if (y + m.height > innerHeight - 8) y = r.top - m.height - 6;
    x = clamp(x, 8, innerWidth - m.width - 8); y = clamp(y, 8, innerHeight - m.height - 8);
    el.menuTarj.style.left = x + 'px'; el.menuTarj.style.top = y + 'px';
    el.menuTarj.querySelector('button').focus({ preventScroll: true });
    A.sfx('ui');
  }
  const cerrarMenuTarj = () => { el.menuTarj.hidden = true; menuDe = -1; };
  el.menuTarj.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const i = menuDe; cerrarMenuTarj();
    if (b.dataset.m === 'copiar') copiar(i);
    else verGrande(i);
  });
  document.addEventListener('pointerdown', e => { if (!el.menuTarj.hidden && !e.target.closest('#menuTarj') && !e.target.closest('.tarj')) cerrarMenuTarj(); }, true);
  function clickTarjeta(e) {
    const n = e.target.closest('.tarj'); if (!n || !partida) return;
    const i = +n.dataset.i;
    if (pantalla !== 'juego' || !el.velo.hidden || ocupado) return;
    if (panelAbierto) { verGrande(i); return; }
    if (!Tut.permite('tarjeta', i)) return Tut.rechazo();
    const tt = Date.now();
    if (ultimoToqueTarj.i === i && tt - ultimoToqueTarj.t < 320) { cerrarMenuTarj(); ultimoToqueTarj.i = -1; copiar(i); return; }
    ultimoToqueTarj = { i, t: tt };
    if (menuDe === i) { cerrarMenuTarj(); return; }
    abrirMenuTarj(i, n);
  }
  el.listaA.addEventListener('click', clickTarjeta); el.listaR.addEventListener('click', clickTarjeta);
  function copiar(i) {
    if (!partida || partida.estado !== 'jugando') return;
    if (!Tut.permite('copiar', i)) return Tut.rechazo();
    const e = partida.registro[i]; if (!e) return;
    partida.bandeja = e.p.slice(); partida.sel = -1;
    A.sfx('copiar'); vibrar(10);
    renderBandeja();
    const n = tarjetaDe(i);
    if (n && !aj.movReducido) {
      const piezas = n.querySelectorAll('.pz-svg');
      piezas.forEach((s, k) => { const dst = el.bandeja.children[k]; if (dst) volar(s, dst, e.p[k]); });
    }
    guardar(); Tut.evento('copiar', i); Tut.evento('bandeja');
  }
  function verGrande(i) {
    const e = partida.registro[i]; if (!e) return;
    const est = e.a ? '<span style="color:var(--cyan)">✓ ' + esc(t('aceptadas')) + '</span>' : '<span style="color:#ff8fa3">✗ ' + esc(t('rechazadas')) + '</span>';
    abrirModal('<div class="m-top"><h2>#' + (i + 1) + (e.t === 'c' ? ' ◆' : '') + '</h2><button class="x" type="button" data-cerrar aria-label="' + esc(t('cerrar')) + '">✕</button></div>' +
      '<p class="kick" style="text-align:center">' + est + (e.t === 'r' ? ' · ' + esc(t('ejemploInicial')) : e.t === 'c' ? ' · ' + esc(t('contraejemplo')) : '') + '</p>' +
      '<div class="grande-fila">' + filaHTML(e.p) + '</div><p class="grande-nombres">' + e.p.map(id => esc(P.nombre(id, lang(), TT[lang()]))).join(' · ') + '</p>' +
      '<div class="m-btns" style="margin-top:14px">' + (partida.estado === 'jugando' && !panelAbierto ? '<button class="btn-pri" type="button" data-copiar="' + i + '">' + esc(partida.bandeja.length ? t('reemplazar') : t('copiar')) + '</button>' : '') + '</div>', { volver: 'juego' });
    const b = el.modal.querySelector('[data-copiar]');
    if (b) b.onclick = () => { cerrarModal(); copiar(i); };
  }

  // ---------- envío ----------
  async function enviar() {
    if (!jugable()) return;
    const ids = partida.bandeja.slice();
    if (!ids.length) { A.sfx('lleno'); toast(t('bandejaVacia')); return; }
    if (!Tut.permite('enviar', ids)) return Tut.rechazo();
    const dup = partida.registro.findIndex(e => e.p.length === ids.length && e.p.every((x, k) => x === ids[k]));
    if (dup >= 0) {
      const n = tarjetaDe(dup); if (n) { n.scrollIntoView({ block: 'nearest' }); n.classList.remove('parpadea'); void n.offsetWidth; n.classList.add('parpadea'); }
      A.sfx('lleno'); toast(t('yaConoces')); return;
    }
    limpiarContra();
    ocupado = true; partida.sel = -1;
    const acepta = fnSecreta(ids, ids.length);
    if (!el.globo.hidden && !horiz) el.globo.classList.add('transparente');
    A.sfx('enviar'); vibrar(8);
    // vuelo de la fila hacia la Sonda
    const centro = centroSonda();
    if (!aj.movReducido) {
      const ranuras = Array.from(el.bandeja.children).slice(0, ids.length);
      ranuras.forEach((r, k) => {
        const a = r.getBoundingClientRect(), s = a.width * 0.8;
        const d = document.createElement('div'); d.className = 'vuela'; d.innerHTML = P.svg(ids[k]); d.style.width = s + 'px'; d.style.height = s + 'px';
        el.vuelo.appendChild(d);
        const x0 = a.left + a.width / 2 - s / 2, y0 = a.top + a.height / 2 - s / 2;
        d.animate([{ transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(1)', opacity: 1 }, { transform: 'translate(' + (centro.x - s / 2) + 'px,' + (centro.y - s / 2) + 'px) scale(.25)', opacity: 0.1 }], { duration: 320 + k * 30, easing: 'cubic-bezier(.5,0,.7,.4)', fill: 'forwards' }).onfinish = () => d.remove();
        setTimeout(() => d.remove(), 600);
      });
    }
    await espera(aj.movReducido ? 60 : 260);
    S.poner(sonda, 'escaneando', ahora());
    const paso = 700 / ids.length;
    ids.forEach((id, k) => setTimeout(() => A.sfx('escaneo', k), k * paso));
    await espera(aj.movReducido ? 300 : 720);
    S.poner(sonda, acepta ? 'acepta' : 'rechaza', ahora());
    A.sfx(acepta ? 'acepta' : 'rechaza');
    vibrar(acepta ? 25 : [15, 40, 15]);
    partida.registro.push({ p: ids, a: acepta ? 1 : 0, t: 'e' });
    partida.seq += acepta ? 'A' : 'R';
    el.vivo.textContent = t(acepta ? 'aceptada' : 'rechazada');
    renderRegistro(partida.registro.length - 1);
    renderBandeja();
    guardar();
    ocupado = false;
    setTimeout(() => el.globo.classList.remove('transparente'), aj.movReducido ? 500 : 1100);
    setTimeout(() => { if (sonda.estado === 'acepta' || sonda.estado === 'rechaza') S.poner(sonda, 'reposo', ahora()); }, 1100);
    Tut.evento('enviado', acepta);
  }
  function centroSonda() {
    const r = el.cvSonda.getBoundingClientRect();
    if (!r.width) return { x: innerWidth / 2, y: 80 };
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 + 6 };
  }

  // ---------- panel de formular ----------
  const HUECOS = { HAY: ['P'], NING: ['P'], TODAS: ['P'], PRIM: ['P'], ULT: ['P'], TOT: ['N'], CANT: ['N', 'P'], PAR: ['P', 'PAR'], MAS: ['P', 'Q'], IGU: ['P', 'Q'], JUNTO: ['P', 'Q'], NJUNTO: ['P', 'Q'], ANTES: ['P', 'Q'], VIG: ['A'], VDIS: ['A'], MISMO: ['A'], DIST: ['A'], EXT: ['A'], ESPEJO: ['A'] };
  const EJEMPLO = { HAY: 'HAY:c', NING: 'NING:t', TODAS: 'TODAS:G', PRIM: 'PRIM:a', ULT: 'ULT:s', TOT: 'TOT:=2', CANT: 'CANT:=2:v', PAR: 'PAR:c:odd', MAS: 'MAS:G:P', IGU: 'IGU:o:s', JUNTO: 'JUNTO:v:a', NJUNTO: 'NJUNTO:c:c', ANTES: 'ANTES:t:o', VIG: 'VIG:color', VDIS: 'VDIS:forma', MISMO: 'MISMO:tam', DIST: 'DIST:color', EXT: 'EXT:forma', ESPEJO: 'ESPEJO:color' };
  const FAM_PANEL = ['existencia', 'posicion', 'cantidad', 'comparacion', 'vecindad', 'orden', 'igualdad', 'simetria'];
  const clVacia = () => ({ m: null, p: { f: -1, c: -1, t: -1 }, q: { f: -1, c: -1, t: -1 }, cmp: null, n: null, par: null, a: null, neg: false });
  const nuevoBorrador = () => ({ c: [clVacia()], op: '&', act: null, fam: 'existencia', eligiendo: 0, info: null });
  function clCompleta(cl) {
    if (!cl || !cl.m) return false;
    for (const h of HUECOS[cl.m]) {
      if (h === 'N' && (cl.cmp == null || cl.n == null)) return false;
      if (h === 'PAR' && !cl.par) return false;
      if (h === 'A' && !cl.a) return false;
    }
    return true;
  }
  function clAST(cl) {
    const r = { m: cl.m, neg: !!cl.neg };
    for (const h of HUECOS[cl.m]) {
      if (h === 'P') r.p = Object.assign({}, cl.p);
      if (h === 'Q') r.q = Object.assign({}, cl.q);
      if (h === 'N') { r.cmp = cl.cmp || '>='; r.n = clamp(cl.n || 1, 1, cl.m === 'CANT' ? 4 : 5); }
      if (h === 'PAR') r.par = cl.par || 'even';
      if (h === 'A') r.a = cl.a || 'forma';
    }
    return r;
  }
  const borr = () => partida && partida.borrador;
  function borradorCompleto() { const b = borr(); return b && clCompleta(b.c[0]) && (b.c.length < 2 || clCompleta(b.c[1])); }
  function borradorAST() {
    const b = borr(); const a = clAST(b.c[0]);
    if (b.c.length > 1 && b.c[1].m) return { op: b.op, a, b: clAST(b.c[1]) };
    return a;
  }
  function borradorDesde(code) {
    const r = R.leer(code), b = nuevoBorrador();
    const aCl = s => { const cl = clVacia(); cl.m = s.m; cl.neg = !!s.neg; if (s.p) cl.p = Object.assign({}, s.p); if (s.q) cl.q = Object.assign({}, s.q); if (s.cmp) { cl.cmp = s.cmp; cl.n = s.n; } if (s.par) cl.par = s.par; if (s.a) cl.a = s.a; return cl; };
    if (r.op) { b.c = [aCl(r.a), aCl(r.b)]; b.op = r.op; } else b.c = [aCl(r)];
    b.eligiendo = -1; b.fam = R.MOLDES[b.c[0].m].fam;
    return b;
  }
  // ejemplos mínimos por molde (✓ y ✗ que difieren en una pieza)
  const _ejemplos = {};
  function ejemploDe(m) {
    if (_ejemplos[m]) return _ejemplos[m];
    const f = R.compilar(EJEMPLO[m]), rnd = V.mulberry32(V.hashStr('ej:' + m));
    let res = null;
    for (let k = 0; k < 400 && !res; k++) {
      const L = 3, a = []; for (let i = 0; i < L; i++) a.push((rnd() * 18) | 0);
      const va = f(a, L);
      for (let pos = 0; pos < L && !res; pos++) for (let p = 0; p < 18 && !res; p++) {
        if (p === a[pos]) continue; const b = a.slice(); b[pos] = p;
        if (f(b, L) !== va) res = va ? { si: a, no: b } : { si: b, no: a };
      }
    }
    _ejemplos[m] = res || { si: [1], no: [2] };
    return _ejemplos[m];
  }
  function abrirPanel() {
    if (!jugable() || panelAbierto) return;
    if (!Tut.permite('formular')) return Tut.rechazo();
    if (!partida.borrador) partida.borrador = nuevoBorrador();
    panelAbierto = true; cerrarMenuTarj(); limpiarContra();
    el.juego.classList.add('formulando'); el.panel.hidden = false;
    A.sfx('panelAbre');
    renderPanel(); layout();
    A.capas({ hip: true });
    Tut.evento('panel');
  }
  function cerrarPanel(sonido) {
    if (!panelAbierto) return;
    if (!Tut.permite('cerrarPanel')) return Tut.rechazo();
    panelAbierto = false; marcasCoh = null;
    el.juego.classList.remove('formulando'); el.panel.hidden = true;
    if (sonido !== false) A.sfx('panelCierra');
    renderRegistro(); layout(); guardar();
    A.capas({ hip: false });
    Tut.evento('panelCerrado');
  }
  function fraseHTML(cl, k) {
    const ast = clAST(cl), txt = R.texto(ast, lang(), true);
    const huecos = HUECOS[cl.m];
    let out = '', hi = 0, i = 0;
    while (i < txt.length) {
      const a = txt.indexOf('\u0001', i);
      if (a < 0) { out += esc(txt.slice(i)); break; }
      out += esc(txt.slice(i, a));
      const b = txt.indexOf('\u0002', a);
      const seg = txt.slice(a + 1, b), tipo = huecos[hi];
      const vacio = (tipo === 'A' && !cl.a) || (tipo === 'N' && (cl.cmp == null || cl.n == null)) || (tipo === 'PAR' && !cl.par);
      const act = partida.borrador.act && partida.borrador.act.k === k && partida.borrador.act.h === hi;
      out += '<button type="button" class="hueco' + (vacio ? ' vacio' : '') + (act ? ' act' : '') + '" data-k="' + k + '" data-h="' + hi + '">' + (vacio ? esc(t('huecoVacio')) + ' ' + esc(tipo === 'A' ? t('atributo').toLowerCase() : tipo === 'N' ? t('cantidad').toLowerCase() : t('paridad').toLowerCase()) : esc(seg)) + '</button>';
      hi++; i = b + 1;
    }
    return out;
  }
  function chipsHTML(cl, k, h) {
    const tipo = HUECOS[cl.m][h];
    const chip = (on, data, cont, aria) => '<button type="button" class="chip' + (on ? ' on' : '') + '" ' + data + (aria ? ' aria-label="' + esc(aria) + '"' : '') + ' aria-pressed="' + (on ? 'true' : 'false') + '">' + cont + '</button>';
    let s = '';
    if (tipo === 'P' || tipo === 'Q') {
      const p = tipo === 'P' ? cl.p : cl.q;
      const N = TT[lang()];
      const cualq = '<span class="ic-cual" aria-hidden="true">—</span><span>' + esc(t('cualq')) + '</span>';
      s += '<div class="chips-fila"><span class="rot">' + esc(t('forma')) + '</span><div class="chips-g">' + chip(p.f < 0, 'data-ch="f" data-v="-1"', cualq, t('forma') + ': ' + t('cualq'));
      for (let f = 0; f < 3; f++) s += chip(p.f === f, 'data-ch="f" data-v="' + f + '"', P.icono('icF' + f) + '<span>' + esc(N.formasN[f]) + '</span>');
      s += '</div></div><div class="chips-fila"><span class="rot">' + esc(t('color')) + '</span><div class="chips-g">' + chip(p.c < 0, 'data-ch="c" data-v="-1"', cualq, t('color') + ': ' + t('cualq'));
      for (let c = 0; c < 3; c++) s += chip(p.c === c, 'data-ch="c" data-v="' + c + '"', P.icono('icC' + c) + '<span>' + esc(N.coloresN[c]) + '</span>');
      s += '</div></div><div class="chips-fila"><span class="rot">' + esc(t('tamano')) + '</span><div class="chips-g">' + chip(p.t < 0, 'data-ch="t" data-v="-1"', cualq, t('tamano') + ': ' + t('cualq'));
      for (let tm = 0; tm < 2; tm++) s += chip(p.t === tm, 'data-ch="t" data-v="' + tm + '"', P.icono('icT' + tm) + '<span>' + esc(N.tamsN[tm]) + '</span>');
      s += '</div></div>';
    } else if (tipo === 'N') {
      s += '<div class="chips-fila"><div class="chips-g plano">';
      for (const c of R.CMPS) s += chip(cl.cmp === c, 'data-ch="cmp" data-v="' + c + '"', '<span>' + esc(t('cmp')[c]) + '</span>');
      s += '</div></div><div class="chips-fila"><div class="chips-g plano">';
      const max = cl.m === 'CANT' ? 4 : 5;
      for (let n = 1; n <= max; n++) s += chip(cl.n === n, 'data-ch="n" data-v="' + n + '"', '<b class="num">' + n + '</b>');
      s += '</div></div>';
    } else if (tipo === 'PAR') {
      s += '<div class="chips-fila"><div class="chips-g plano">' + chip(cl.par === 'even', 'data-ch="par" data-v="even"', '<span>' + esc(t('par').even) + '</span>') + chip(cl.par === 'odd', 'data-ch="par" data-v="odd"', '<span>' + esc(t('par').odd) + '</span>') + '</div></div>';
    } else if (tipo === 'A') {
      s += '<div class="chips-fila"><div class="chips-g plano">';
      for (const a of R.ATRS) s += chip(cl.a === a, 'data-ch="a" data-v="' + a + '"', '<span>' + esc(t('atr')[a]) + '</span>');
      s += '</div></div>';
    }
    return '<div class="chips-zona" data-k="' + k + '" data-h="' + h + '">' + s + '</div>';
  }
  function moldesHTML(k) {
    const b = partida.borrador, fams = familiasPanel();
    // PLAY-SENAL-02: lista de categorías con nombre, en dos filas si hace falta; las bloqueadas llevan aria-disabled y explican el requisito real
    let s = '<div class="tabs" role="tablist" aria-label="' + esc(t('categoriasReglas')) + '">';
    for (const f of FAM_PANEL) {
      const ab = fams.includes(f);
      const req = (f === 'simetria' || f === 'combinadas') ? t('reqComb') : t('reqBase');
      const bloq = ab ? '' : t('catBloqueada', { 'categoría': t('familias')[f], requisito: req });
      s += '<button type="button" role="tab" class="tab' + (b.fam === f ? ' on' : '') + (ab ? '' : ' bloq') + '" data-fam="' + f + '" aria-selected="' + (b.fam === f) + '"' + (ab ? '' : ' aria-disabled="true" title="' + esc(bloq) + '" aria-label="' + esc(bloq) + '"') + '>' + (ab ? '' : '<span aria-hidden="true">🔒 </span>') + esc(t('familias')[f]) + '</button>';
    }
    s += '</div><div class="moldes">';
    const ab = fams.includes(b.fam);
    for (const m of R.ORDEN_MOLDES) {
      if (R.MOLDES[m].fam !== b.fam) continue;
      const ej = ejemploDe(m);
      const lc = TT[lang()].letraChica[m];
      s += '<div class="molde' + (ab ? '' : ' bloq') + '" role="button" tabindex="0" data-m="' + m + '" data-k="' + k + '"><span class="fr">' + esc(t('moldeGen')[m]) + '</span>' +
        (lc && ab ? '<button type="button" class="info" data-info="' + m + '" aria-label="i">i</button>' : '<span></span>') +
        (ab ? '<span class="ej"><span>' + esc(t('ejemplo', { r: R.texto(EJEMPLO[m], lang()) })) + '</span><span class="ok">✓<span class="mini">' + filaHTML(ej.si, true) + '</span></span><span class="no">✗<span class="mini">' + filaHTML(ej.no, true) + '</span></span></span>' : '<span class="lck">' + esc(b.fam === 'simetria' ? t('candadoComb') : t('candado')) + '</span>') +
        (b.info === m ? '<p class="letra-chica">' + esc(lc) + '</p>' : '') + '</div>';
    }
    return s + '</div>';
  }
  function familiasPanel() {
    if (partida && partida.modo === 'tutorial') return BASE_FAM;
    return familiasAbiertas();
  }
  function coherencia() {
    if (!borradorCompleto()) return null;
    const f = R.compilar(borradorAST());
    return partida.registro.map(e => (f(e.p, e.p.length) ? 1 : 0) === e.a);
  }
  function renderPanel() {
    if (!panelAbierto) return;
    const b = partida.borrador;
    let cuerpo = '';
    if (perfil.avisoFichas && partida.modo !== 'tutorial') { cuerpo += '<p class="aviso-fichas">' + esc(t('nuevasFichas')) + '</p>'; perfil.avisoFichas = false; guardarPerfil(); }
    const comb = familiasPanel().includes('combinadas');
    b.c.forEach((cl, k) => {
      if (k === 1) cuerpo += '<div class="conector"><button type="button" class="chip' + (b.op === '&' ? ' on' : '') + '" data-op="&">' + esc(t('y')) + '</button><button type="button" class="chip' + (b.op === '|' ? ' on' : '') + '" data-op="|">' + esc(t('o')) + '</button></div>';
      if (b.eligiendo === k || !cl.m) { cuerpo += '<div class="claus">' + moldesHTML(k) + (k === 1 ? '<button type="button" class="lnk" data-quitar>' + esc(t('quitarCond')) + '</button>' : '') + '</div>'; return; }
      cuerpo += '<div class="claus"><div class="claus-top"><button type="button" class="chip-no' + (cl.neg ? ' on' : '') + '" data-neg="' + k + '" aria-pressed="' + cl.neg + '">' + esc(t('noChip')) + '</button><button type="button" class="lnk" data-cambiar="' + k + '">' + esc(t('cambiarMolde')) + '</button>' + (k === 1 ? '<button type="button" class="lnk" data-quitar>' + esc(t('quitarCond')) + '</button>' : '') + '</div>' +
        '<p class="frase">' + fraseHTML(cl, k) + '</p>' + (b.act && b.act.k === k ? chipsHTML(cl, k, b.act.h) : '') + '</div>';
    });
    if (b.c.length === 1 && b.c[0].m && b.eligiendo !== 0 && comb) cuerpo += '<button type="button" class="btn-sec chico" data-mascond style="width:100%">' + esc(t('masCond')) + '</button>';
    // estado y coherencia
    const coh = coherencia();
    marcasCoh = coh;
    let estado = '', cls = '', puede = false;
    if (!b.c[0].m || (b.c[1] && !b.c[1].m)) estado = t('eligeMolde');
    else if (!coh) estado = t('completa');
    else {
      const malos = coh.map((ok, i) => ok ? -1 : i).filter(i => i >= 0);
      if (!malos.length) { estado = partida.registro.length === 1 ? t('coherente1') : t('coherente', { m: partida.registro.length }); cls = 'ok'; puede = true; }
      else { estado = malos.length === 1 ? t('contradiceN', { i: malos[0] + 1 }) : t('contradice', { k: malos.length }) + ': ' + malos.slice(0, 4).map(i => '#' + (i + 1)).join(', ') + (malos.length > 4 ? '…' : ''); cls = 'mal'; }
    }
    // SRC-SE01: la comprobación de la regla anuncia su costo real antes de actuar (COSTO_FALLO pulsos sólo si la Sonda la rechaza)
    el.panel.innerHTML = '<div class="pn-cab"><h3>' + esc(t('formular')) + '</h3><button class="x" type="button" data-cerrarpanel aria-label="' + esc(t('cerrar')) + '">✕</button></div>' +
      '<div class="pn-cuerpo">' + cuerpo + '</div>' +
      '<div class="pn-pie"><p class="pn-estado ' + cls + '" aria-live="polite">' + esc(estado) + (puede ? '<br><span class="pn-costo">' + esc(t('costoComprobar', { c: COSTO_FALLO })) + '</span>' : '') + '</p><button type="button" class="btn-pri' + (puede ? '' : ' off') + '" data-transmitir aria-disabled="' + (!puede) + '">' + esc(t('transmitir')) + '</button></div>';
    const antes = panelEstadoPrevio;
    panelEstadoPrevio = cls;
    if (cls === 'ok' && antes !== 'ok') A.sfx('coherente');
    renderRegistro();
    if (cls === 'mal') {
      const i = coh.findIndex(ok => !ok); const n = tarjetaDe(i); if (n) n.scrollIntoView({ block: 'nearest', behavior: aj.movReducido ? 'auto' : 'smooth' });
    }
    // PLAY-SENAL-02: desplazar lo mínimo para que la categoría activa quede completa (nearest), nunca llevarla a un extremo
    const tab = el.panel.querySelector('.tab.on');
    if (tab) tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    Tut.foco();
  }
  let panelEstadoPrevio = '';
  el.panel.addEventListener('click', e => {
    if (!partida || !panelAbierto || ocupado) return;
    const b = partida.borrador, tg = e.target;
    let x;
    if (tg.closest('[data-cerrarpanel]')) { cerrarPanel(); return; }
    if ((x = tg.closest('[data-transmitir]'))) {
      if (!Tut.permite('transmitir')) return Tut.rechazo();
      if (x.classList.contains('off')) { A.sfx('lleno'); return; }
      transmitir(); return;
    }
    if ((x = tg.closest('[data-info]'))) { e.stopPropagation(); b.info = b.info === x.dataset.info ? null : x.dataset.info; A.sfx('ui'); renderPanel(); return; }
    if ((x = tg.closest('[data-fam]'))) {
      if (!Tut.permite('tab', x.dataset.fam)) return Tut.rechazo();
      if (x.getAttribute('aria-disabled') === 'true') { A.sfx('lleno'); toast(x.getAttribute('aria-label'), null, 2600); return; }
      b.fam = x.dataset.fam; b.info = null; A.sfx('ui'); renderPanel(); return;
    }
    if ((x = tg.closest('.molde'))) {
      if (x.classList.contains('bloq')) { A.sfx('lleno'); return; }
      const m = x.dataset.m, k = +x.dataset.k;
      if (!Tut.permite('molde', m)) return Tut.rechazo();
      const cl = b.c[k]; const viejo = cl.m;
      cl.m = m; if (viejo !== m) { const neg = cl.neg; Object.assign(cl, clVacia(), { m, neg }); }
      b.eligiendo = -1; b.act = { k, h: 0 }; A.sfx('chip', { fila: 0, i: 0 });
      renderPanel(); guardar(); Tut.evento('molde', m); return;
    }
    if ((x = tg.closest('.hueco'))) { if (!Tut.permite('hueco')) return Tut.rechazo(); const k = +x.dataset.k, h = +x.dataset.h; b.act = (b.act && b.act.k === k && b.act.h === h) ? null : { k, h }; A.sfx('ui'); renderPanel(); return; }
    if ((x = tg.closest('[data-ch]'))) {
      const zona = x.closest('.chips-zona'), k = +zona.dataset.k, h = +zona.dataset.h, cl = b.c[k], tipo = HUECOS[cl.m][h];
      if (!Tut.permite('chip', x.dataset.ch + ':' + x.dataset.v)) return Tut.rechazo();
      const ch = x.dataset.ch, v = x.dataset.v;
      let fila = 0, idx = 0;
      if (ch === 'f' || ch === 'c' || ch === 't') { const p = tipo === 'Q' ? cl.q : cl.p; p[ch] = +v; fila = ch === 'f' ? 0 : ch === 'c' ? 1 : 2; idx = +v + 1; }
      else if (ch === 'cmp') { cl.cmp = v; fila = 0; idx = R.CMPS.indexOf(v); }
      else if (ch === 'n') { cl.n = +v; fila = 1; idx = +v; }
      else if (ch === 'par') { cl.par = v; fila = 2; idx = v === 'odd' ? 1 : 0; }
      else if (ch === 'a') { cl.a = v; fila = 1; idx = R.ATRS.indexOf(v); }
      A.sfx('chip', { fila, i: idx }); vibrar(6);
      // avanzar al siguiente hueco vacío en los de elección única
      if (ch === 'a' || ch === 'par' || (ch === 'n' && cl.cmp) || (ch === 'cmp' && cl.n)) {
        const hs = HUECOS[cl.m]; let sig = null;
        for (let j = 0; j < hs.length; j++) { const tp = hs[j]; if ((tp === 'A' && !cl.a) || (tp === 'N' && (cl.cmp == null || cl.n == null)) || (tp === 'PAR' && !cl.par)) { sig = j; break; } }
        if (sig != null) b.act = { k, h: sig };
      }
      renderPanel(); guardar(); Tut.evento('borrador'); return;
    }
    if ((x = tg.closest('[data-neg]'))) { if (!Tut.permite('neg')) return Tut.rechazo(); const cl = b.c[+x.dataset.neg]; cl.neg = !cl.neg; A.sfx('chip', { fila: 2, i: cl.neg ? 1 : 0 }); renderPanel(); guardar(); Tut.evento('borrador'); return; }
    if ((x = tg.closest('[data-cambiar]'))) { if (!Tut.permite('cambiar')) return Tut.rechazo(); const k = +x.dataset.cambiar; b.eligiendo = k; b.fam = R.MOLDES[b.c[k].m].fam; b.act = null; A.sfx('ui'); renderPanel(); return; }
    if (tg.closest('[data-mascond]')) { b.c.push(clVacia()); b.eligiendo = 1; b.fam = 'existencia'; b.act = null; A.sfx('ui'); renderPanel(); return; }
    if (tg.closest('[data-quitar]')) { b.c.length = 1; b.eligiendo = b.c[0].m ? -1 : 0; b.act = null; A.sfx('quitar'); renderPanel(); guardar(); return; }
    if ((x = tg.closest('[data-op]'))) { b.op = x.dataset.op; A.sfx('chip', { fila: 1, i: b.op === '&' ? 0 : 1 }); renderPanel(); guardar(); return; }
  });
  el.panel.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('molde')) { e.preventDefault(); e.target.click(); } });

  // ---------- verificación ----------
  let worker = null, wid = 0;
  const pend = {};
  function crearWorker() {
    try {
      worker = new Worker('src/worker.js?v=2');
      worker.onmessage = e => {
        const d = e.data, p = pend[d.id]; if (!p) return;
        if (d.progreso != null && !d.fin) { p.prog(d.progreso); return; }
        delete pend[d.id]; clearTimeout(p.to);
        if (d.error) p.local(); else p.res(d);
      };
      worker.onerror = () => { worker = null; for (const k in pend) { const p = pend[k]; delete pend[k]; clearTimeout(p.to); p.local(); } };
    } catch (e) { worker = null; }
  }
  function verificarLocal(jug, sec, registro, prog) {
    return new Promise(res => {
      const fa = R.compilar(jug), fb = R.compilar(sec), bz = V.crearBarrido(fa, fb, 64);
      const paso = () => {
        const t0 = ahora();
        while (ahora() - t0 < 10) if (bz.paso(20000)) break;
        prog(bz.progreso);
        if (!bz.terminado) { setTimeout(paso, 0); return; }
        if (!bz.candidatas.length) res({ equivalentes: true });
        else { const c = V.elegirContra(bz.candidatas, registro); res({ equivalentes: false, contra: c, acepta: fb(c, c.length) }); }
      };
      paso();
    });
  }
  function verificar(jug, sec, registro, prog) {
    return new Promise(res => {
      const local = () => verificarLocal(jug, sec, registro, prog).then(res);
      if (!worker) { local(); return; }
      const id = ++wid;
      pend[id] = { res, prog, local, to: setTimeout(() => { if (pend[id]) { delete pend[id]; local(); } }, 9000) };
      worker.postMessage({ id, jugador: jug, secreta: sec, registro });
    });
  }

  // ---------- transmitir y veredicto ----------
  async function transmitir() {
    if (!partida || ocupado || !borradorCompleto()) return;
    const coh = coherencia(); if (!coh || coh.some(ok => !ok)) return;
    const code = R.codificar(borradorAST());
    ocupado = true; limpiarContra();
    const notas = [];
    partida.borrador.c.forEach(cl => { if (cl.p) notas.push(66 + Math.max(0, cl.p.f) * 2, 70 + Math.max(0, cl.p.c) * 2); if (cl.neg) notas.push(72); });
    A.sfx('transmitir', notas);
    // la frase se compacta y vuela hacia la Sonda
    const fr = el.panel.querySelector('.frase');
    if (fr && !aj.movReducido) {
      const r = fr.getBoundingClientRect(), d = document.createElement('div'); d.className = 'tira';
      d.textContent = R.texto(code, lang()); document.body.appendChild(d);
      d.style.left = r.left + 'px'; d.style.top = r.top + 'px';
      const c = centroSonda();
      d.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(' + (c.x - r.left - 40) + 'px,' + (c.y - r.top - 16) + 'px) scale(.25)', opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.5,0,.7,.4)', fill: 'forwards' }).onfinish = () => d.remove();
      setTimeout(() => d.remove(), 800);
    }
    panelAbierto = false; marcasCoh = null;
    el.juego.classList.remove('formulando'); el.panel.hidden = true; layout(); renderRegistro();
    A.capas({ hip: false });
    S.poner(sonda, 'transmite', ahora());
    el.vivo.textContent = t('transmitiendo');
    const t0 = ahora();
    const res = await verificar(code, codeSecreta, partida.registro.map(e => e.p), p => { sonda.progreso = p; });
    const resto = (aj.movReducido ? 600 : 1600) - (ahora() - t0);
    if (resto > 0) await espera(resto);
    if (res.equivalentes) await acierto(code);
    else fallo(res.contra, res.acepta);
  }
  async function acierto(code) {
    partida.estado = 'resuelta'; partida.version = code; cronometro(false);
    S.poner(sonda, 'contacto', ahora());
    A.sfx('contacto'); vibrar([30, 60, 30]);
    A.tema(null);
    el.vivo.textContent = t('contacto');
    // ola del registro (de abajo arriba)
    const tarj = $$('.tarj').reverse();
    tarj.forEach((n, k) => setTimeout(() => { n.classList.remove('ola'); void n.offsetWidth; n.classList.add('ola'); }, k * 40));
    const info = registrarResultado();
    guardarYa();
    Tut.evento('contacto');
    if (Tut.activo) { ocupado = false; return; }
    await esperaOToque(1800);
    ocupado = false;
    mostrarResultado(info);
  }
  function esperaOToque(ms) {
    return new Promise(res => {
      let hecho = false;
      const fin = () => { if (hecho) return; hecho = true; document.removeEventListener('pointerdown', fin, true); document.removeEventListener('keydown', fin, true); res(); };
      setTimeout(() => { document.addEventListener('pointerdown', fin, true); document.addEventListener('keydown', fin, true); }, 250);
      setTimeout(fin, ms);
    });
  }
  function fallo(contra, acepta) {
    partida.fallos++; partida.seq += 'X';
    partida.registro.push({ p: contra, a: acepta ? 1 : 0, t: 'c' });
    S.poner(sonda, 'falla', ahora());
    A.sfx('contra'); vibrar([40, 30, 40]);
    toast(t('contra'), 'rojo', 2600);
    el.vivo.textContent = t('contra');
    el.hudDelta.textContent = '+' + COSTO_FALLO; el.hudDelta.classList.remove('ve'); void el.hudDelta.offsetWidth; el.hudDelta.classList.add('ve');
    renderRegistro(partida.registro.length - 1);
    // VIS-SENAL-02/04: marco discontinuo estático (sin halo de 3 s) hasta la siguiente acción
    const n = tarjetaDe(partida.registro.length - 1); if (n) { n.classList.add('nuevo-contra'); n.scrollIntoView({ block: 'nearest' }); }
    guardar();
    ocupado = false;
    setTimeout(() => { if (sonda.estado === 'falla') S.poner(sonda, 'reposo', ahora()); }, 1400);
    Tut.evento('fallo');
  }
  function calificacion(p, par) { return p <= par - 2 ? 0 : p <= par ? 1 : p <= par + 4 ? 2 : 3; }
  function registrarResultado() {
    const p = partida, out = { famNueva: null, rangoNuevo: null, racha: null };
    const fam = R.familia(R.leer(codeSecreta));
    if (p.estado === 'resuelta' && !perfil.familias[fam]) { perfil.familias[fam] = true; if (p.modo !== 'tutorial') out.famNueva = fam; }
    if (p.modo === 'tutorial') { guardarPerfil(); return out; }
    const pul = pulsosDe(p), cal = calificacion(pul, p.par);
    if (p.modo === 'practica') {
      const antes = rango();
      if (p.estado === 'resuelta') { perfil.nivelPractica = clamp(perfil.nivelPractica + [0.35, 0.25, 0.15, 0.05][cal], 1, 6.99); stats.practica.resueltas++; stats.practica.porRango[clamp(p.rangoAntes || antes, 1, 6) - 1]++; }
      else perfil.nivelPractica = clamp(perfil.nivelPractica - 0.3, 1, 6.99);
      perfil.contadorPractica++;
      perfil.vistas = (perfil.vistas || []).concat(codeSecreta).slice(-50);
      perfil.ultimaFam = fam;
      if (rango() > antes) out.rangoNuevo = rango();
      st.del('practica');
    } else {
      const d = stats.diarias;
      if (p.estado === 'resuelta') {
        d.resueltas++; d.distribucion[cal]++; d.sumaPulsos += pul; d.sumaPar += p.par;
        if (p.fecha === hoy()) {
          d.racha = (d.ultimaResuelta === ayerDe(p.fecha)) ? d.racha + 1 : (d.ultimaResuelta === p.fecha ? d.racha : 1);
          d.ultimaResuelta = p.fecha; d.rachaMax = Math.max(d.rachaMax, d.racha); out.racha = d.racha;
        }
      } else if (p.fecha === hoy()) { d.racha = 0; }
      p.resueltaEl = hoy();
    }
    const abiertasAntes = familiasAbiertas().length;
    guardarPerfil(); guardarStats();
    if (familiasAbiertas().length > abiertasAntes) { perfil.avisoFichas = true; guardarPerfil(); }
    return out;
  }

  // ---------- modales ----------
  // RSP-MODALS-01: una sola superposición (#velo/#modal). Al abrir se guarda el activador, el resto de la página queda
  // inerte, el diálogo recibe nombre (aria-labelledby) y foco inicial, Tab/Shift+Tab circulan dentro y al cerrar el foco
  // vuelve al activador si sigue visible (o al primer control lógico de la pantalla revelada).
  let modalVolver = null, onCerrarModal = null, modalActivador = null, reabriendo = false;
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const visibleEl = n => !!n && n.isConnected && !n.closest('[hidden]') && n.getClientRects().length > 0;
  const focusables = raiz => Array.from(raiz.querySelectorAll(FOCUSABLE)).filter(n => visibleEl(n) && n.getAttribute('aria-hidden') !== 'true');
  const capasFondo = () => [el.inicio, el.juego, el.back, el.barraDer, el.globo, el.menuTarj].filter(Boolean);
  function abrirModal(html, o) {
    o = o || {};
    cerrarMenuTarj();
    if (el.velo.hidden && !reabriendo) modalActivador = (document.activeElement && document.activeElement !== document.body) ? document.activeElement : null;
    el.modal.className = 'card' + (o.ancha ? ' ancha' : '') + (o.clase ? ' ' + o.clase : '');
    el.modal.innerHTML = html;
    el.modal.setAttribute('role', o.alerta ? 'alertdialog' : 'dialog');
    const tit = el.modal.querySelector('h2,h3');
    if (tit) { if (!tit.id) tit.id = 'modalTitulo'; el.modal.setAttribute('aria-labelledby', tit.id); } else el.modal.removeAttribute('aria-labelledby');
    capasFondo().forEach(n => { n.inert = true; });
    el.velo.hidden = false;
    modalVolver = o.volver || null; onCerrarModal = o.alCerrar || null;
    el.modal.scrollTop = 0;
    // foco inicial sin condicionarlo al tipo de puntero: en confirmaciones destructivas, el control de cancelar (o.foco)
    const f = (o.foco && el.modal.querySelector(o.foco)) || el.modal.querySelector('.btn-pri,[data-cerrar],button,[href],textarea') || el.modal;
    f.focus({ preventScroll: true });
    if (pantalla === 'juego') cronometro(false);
  }
  function restaurarFoco(act) {
    if (act && visibleEl(act) && !act.closest('[inert]')) { act.focus({ preventScroll: true }); return; }
    // el activador desapareció: primer control lógico de la pantalla revelada
    const dest = pantalla === 'juego' ? (panelAbierto ? el.panel.querySelector('button') : el.btnPausa) : $('#btnPrincipal');
    if (dest && visibleEl(dest)) dest.focus({ preventScroll: true });
  }
  function cerrarModal() {
    if (el.velo.hidden) return;
    const act = modalActivador;
    el.velo.hidden = true; el.modal.innerHTML = '';
    capasFondo().forEach(n => { n.inert = false; });
    A.amortiguar(false);
    el.cvResAstro.hidden = true; resAstroOn = false;
    clearInterval(tCuenta); detenerComo();
    const cb = onCerrarModal; onCerrarModal = null;
    if (pantalla === 'juego' && partida && partida.estado === 'jugando') cronometro(true);
    if (cb) { reabriendo = true; try { cb(); } finally { reabriendo = false; } }
    if (el.velo.hidden) { modalActivador = null; restaurarFoco(act); }
  }
  el.velo.addEventListener('click', e => {
    if (e.target === el.velo) { if (modalVolver !== 'bloquear') cerrarModal(); return; }
    if (e.target.closest('[data-cerrar]')) { A.sfx('ui'); cerrarModal(); }
  });
  // ciclo de Tab dentro del diálogo (aria-modal no sustituye el control de foco)
  el.velo.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || el.velo.hidden) return;
    const f = focusables(el.modal);
    if (!f.length) { e.preventDefault(); el.modal.focus(); return; }
    const first = f[0], last = f[f.length - 1], act = document.activeElement;
    if (e.shiftKey && (act === first || act === el.modal || !el.modal.contains(act))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (act === last || !el.modal.contains(act))) { e.preventDefault(); first.focus(); }
  });

  // pausa
  function abrirPausa() {
    if (pantalla !== 'juego' || !partida) return;
    if (!el.velo.hidden) return;
    if (panelAbierto && Tut.activo) { /* el tutorial mantiene el panel */ }
    const jug = partida.estado === 'jugando';
    A.amortiguar(true);
    abrirModal('<div class="m-top"><h2>' + esc(t('pausa')) + '</h2></div>' +
      '<div class="m-btns"><button class="btn-pri" type="button" data-p="seguir">' + esc(t('reanudar')) + '</button>' +
      '<div class="m-fila"><button class="btn-sec" type="button" data-p="como">' + esc(t('comoJugar')) + '</button><button class="btn-sec" type="button" data-p="ajustes">' + esc(t('ajustes')) + '</button></div>' +
      (jug && partida.modo !== 'tutorial' ? '<button class="btn-sec peligro" type="button" data-p="rendirse">' + esc(t('rendirse')) + '</button>' : '') +
      (partida.modo === 'tutorial' ? '<button class="btn-sec" type="button" data-p="saltar">' + esc(t('saltarTut')) + '</button>' : '') +
      '<button class="btn-sec" type="button" data-p="inicio">' + esc(t('inicio')) + '</button></div>', { volver: 'juego' });
    el.modal.onclick = e => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      const a = b.dataset.p; A.sfx('ui');
      if (a === 'seguir') cerrarModal();
      else if (a === 'como') abrirComo(abrirPausa);
      else if (a === 'ajustes') abrirAjustes(abrirPausa);
      else if (a === 'rendirse') abrirRendirse();
      else if (a === 'saltar') Tut.saltar();
      else if (a === 'inicio') { cerrarModal(); irInicio(); }
    };
  }
  function abrirRendirse() {
    // SRC-SE02: aviso antes de revelar; el efecto sobre la racha sólo se menciona en el reto diario de hoy
    const diaria = partida.modo !== 'practica' && partida.modo !== 'tutorial' && partida.fecha === hoy();
    abrirModal('<div class="m-top"><h2>' + esc(t('rendirseQ')) + '</h2></div><p class="texto" style="margin-bottom:16px">' + esc(t('rendirseP')) + (diaria ? ' ' + esc(t('rendirseD')) : '') + '</p>' +
      '<div class="m-btns"><button class="btn-pri" type="button" data-r="seguir">' + esc(t('seguir')) + '</button><button class="btn-sec peligro" type="button" data-r="ver">' + esc(t('verRegla')) + '</button></div>', { volver: 'juego', alerta: true, foco: '[data-r="seguir"]' });
    el.modal.onclick = e => {
      const b = e.target.closest('[data-r]'); if (!b) return;
      if (b.dataset.r === 'seguir') { A.sfx('ui'); cerrarModal(); return; }
      if (!partida || partida.estado !== 'jugando') return; // se revela una sola vez
      cerrarModal();
      if (panelAbierto) cerrarPanel(false);
      partida.estado = 'rendida'; cronometro(false);
      const info = registrarResultado(); guardarYa();
      A.tema('menu');
      mostrarResultado(info);
    };
  }

  // resultado
  let tCuenta = 0, resAstroOn = false;
  function ondasSVG(n, tenue) {
    let s = '';
    for (let i = 0; i < 3; i++) s += '<svg class="' + (tenue && i === 0 ? 'tenue' : '') + '" data-o="' + i + '" viewBox="0 0 54 30" aria-hidden="true"><path d="M2 15 Q 8.5 3 15 15 T 28 15 T 41 15 T 52 15" fill="none" stroke="' + (i < n || (tenue && i === 0) ? '#00f2cf' : '#5b5275') + '" stroke-width="3.2" stroke-linecap="round"/></svg>';
    return s;
  }
  function ejemplosRegistro() {
    const reg = partida.registro;
    const a = [...reg].reverse().find(e => e.a) || reg[0], r = [...reg].reverse().find(e => !e.a) || reg[1];
    return '<div class="res-ejs"><span class="ok">✓<span class="mini">' + filaHTML(a.p, true) + '</span></span><span class="no">✗<span class="mini">' + filaHTML(r.p, true) + '</span></span></div>';
  }
  function mostrarResultado(info) {
    info = info || {};
    const p = partida, ok = p.estado === 'resuelta', pul = pulsosDe(p), cal = calificacion(pul, p.par);
    const tut = p.modo === 'tutorial', prac = p.modo === 'practica', diariaHoy = !prac && !tut && p.fecha === hoy();
    let h = '<div class="res-izq"><p class="kick" style="text-align:center;margin-bottom:6px">' + esc(el.hudTitulo.textContent) + '</p>';
    h += '<h2 class="res-t' + (ok ? ' ok' : '') + '">' + esc(ok ? t('contacto') : t('sinContacto')) + '</h2>';
    h += '<div class="res-regla"><span class="kick">' + esc(t('laRegla')) + '</span><p>' + marcado(R.texto(codeSecreta, lang(), true)) + '</p>' + ejemplosRegistro();
    if (ok && p.version && R.normal(p.version) !== R.normal(codeSecreta)) h += '<p class="tuversion">' + esc(t('tuVersion', { r: '«' + R.texto(p.version, lang()) + '»' })) + '</p>';
    h += '</div></div><div class="res-der">';
    if (ok && !tut) {
      h += '<div class="ondas">' + ondasSVG(3 - cal, cal === 3) + '</div><p class="califica">' + esc(t('calif')[cal]) + '</p>';
      // SRC-SE01: pulsos y objetivo (par) como líneas separadas, con la unidad definida
      h += '<div class="lineas"><div><span>' + esc(t('pulsosLbl')) + '</span><b>' + esc(t('pulsosDe', { p: pul })) + '</b></div><div><span>' + esc(t('objetivoPulsos', { par: p.par })) + '</span><b>' + (pul <= p.par ? '✓' : '+' + (pul - p.par)) + '</b></div><div><span>' + esc(t('muestrasEnv')) + '</span><b>' + enviadas(p) + '</b></div>' + (p.fallos ? '<div><span>' + esc(t('fallos')) + '</span><b>' + p.fallos + '</b></div>' : '') + '<div><span>' + esc(t('tiempo')) + '</span><b>' + fmtTiempo(p.tiempo) + '</b></div></div>';
      h += '<p class="texto dim" style="font-size:12px;margin-top:-6px">' + esc(t('pulsoDef')) + '</p>';
    }
    if (info.racha) h += '<span class="sello">' + esc(info.racha === 1 ? t('rachaSube1') : t('rachaSube', { d: info.racha })) + '</span>';
    if (info.rangoNuevo) h += '<span class="sello">' + esc(t('rangoNuevo', { r: nombreRango(info.rangoNuevo) })) + '</span>';
    if (info.famNueva) h += '<span class="sello">' + esc(t('patronNuevo', { f: t('familias')[info.famNueva] })) + '</span>';
    h += '<div class="m-btns">';
    // SRC-SE02 / SRC-G03: «Nueva práctica» genera una regla nueva (jugarPractica(true)); «Volver al menú» es el menú del juego.
    // No existe un manejador para repetir la misma señal, así que no se anuncia «Repetir esta señal».
    if (tut) h += '<button class="btn-pri" type="button" data-z="tutSig">' + esc(t('siguiente')) + '</button>';
    else if (prac) h += '<button class="btn-pri" type="button" data-z="siguiente">' + esc(t('nuevaPractica')) + '</button><div class="m-fila"><button class="btn-sec" type="button" data-z="compartir">' + esc(t('compartir')) + '</button><button class="btn-sec" type="button" data-z="inicio">' + esc(t('inicio')) + '</button></div>';
    else h += '<button class="btn-pri" type="button" data-z="compartir">' + esc(t('compartir')) + '</button><div class="m-fila"><button class="btn-sec" type="button" data-z="inicio">' + esc(t('inicio')) + '</button><button class="btn-sec" type="button" data-z="practica">' + esc(t('nuevaPractica')) + '</button></div>';
    if (diariaHoy || (!prac && !tut)) h += '<p class="cuenta" id="cuenta"></p>';
    h += '</div></div>';
    abrirModal(h, { volver: 'bloquear', clase: 'res' });
    // ondas animadas
    if (ok && !tut) {
      const os = el.modal.querySelectorAll('.ondas svg');
      const n = 3 - cal;
      os.forEach((s, i) => setTimeout(() => { s.classList.add('on'); if (i < n) A.sfx('onda', i); }, 280 + i * 120));
      if (cal === 3) setTimeout(() => os[0].classList.add('on'), 280);
    }
    if (info.racha > 1 || info.rangoNuevo) setTimeout(() => A.sfx('fanfarria'), 700);
    const cuenta = $('#cuenta');
    if (cuenta) { const f = () => { cuenta.textContent = t('proxima', { t: faltaMedianoche() }); }; f(); tCuenta = setInterval(f, 1000); }
    el.modal.onclick = e => {
      const b = e.target.closest('[data-z]'); if (!b) return;
      const a = b.dataset.z; A.sfx('ui');
      if (a === 'compartir') compartir(p);
      else if (a === 'inicio') { cerrarModal(); irInicio(); }
      else if (a === 'practica' || a === 'siguiente') { cerrarModal(); jugarPractica(true); }
      else if (a === 'tutSig') { cerrarModal(); Tut.siguienteRegla(); }
    };
    // astronauta saludando
    if (!tut) iniciarResAstro();
    setTimeout(() => { if (!el.velo.hidden && pantalla === 'juego') A.tema('menu'); }, aj.movReducido ? 200 : 6600);
  }
  function fmtTiempo(ms) { const s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + pad(s % 60); }
  function iniciarResAstro() {
    // en pantallas anchas, abajo a la izquierda; en teléfono, dentro de la tarjeta para no tapar botones
    let cv = el.cvResAstro;
    if (innerWidth < 900 || innerHeight < 600) {
      (el.modal.querySelector('.res-izq') || el.modal).insertAdjacentHTML('afterbegin', '<canvas class="res-astro" aria-hidden="true"></canvas>');
      el.modal.classList.add('con-astro');
      cv = el.modal.querySelector('.res-astro');
    } else cv.hidden = false;
    resAstroOn = true;
    const t0 = ahora();
    const loop = () => {
      if (!resAstroOn) return;
      const { c, w, h } = S.ajustarLienzo(cv);
      c.clearRect(0, 0, w, h);
      const tt = (ahora() - t0) / 1000;
      S.astronauta(c, w / 2, h * 0.52, Math.min(w, h) * 0.62, 'r', tt, aj.movReducido ? 0 : (tt % 3.2 < 1.6 ? tt % 3.2 : 0));
      requestAnimationFrame(loop);
    };
    loop();
  }
  function textoCompartir(p) {
    const pul = pulsosDe(p), cal = calificacion(pul, p.par), ok = p.estado === 'resuelta';
    let cab;
    if (p.modo === 'practica') cab = t('sharePract', { r: p.rangoAntes || rango(), p: pul, par: p.par });
    else cab = t(p.fecha === hoy() ? 'shareCab' : 'shareArch', { n: p.n, p: pul, par: p.par });
    if (ok) cab += ' ' + '〰️'.repeat(3 - cal);
    const seq = Array.from(p.seq).map(c => c === 'A' ? '🟢' : c === 'R' ? '🔴' : '◆').join('');
    const fin = ok ? '📡 ' + t('shareIntento', { o: t('ordinales')[Math.min(9, p.fallos)] }) : t('shareSin');
    return cab + '\n' + (seq || '—') + '\n' + fin + '\njetgames.fun/senal';
  }
  // SRC-G06: compartir sólo por acción del jugador; cancelar el diálogo nativo no muestra nada; éxito sólo tras confirmar el copiado;
  // si no se puede copiar, el texto íntegro queda seleccionable en un textarea (patrón de referencia) con «Copiar texto» y «Cerrar».
  async function compartir(p) {
    const txt = textoCompartir(p);
    try {
      const tactil = window.matchMedia && matchMedia('(pointer: coarse)').matches;
      if (navigator.share && tactil) { await navigator.share({ text: txt }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(txt); A.sfx('copiado'); toast(t('copiado'), 'cian', 1600); return; } catch (e) { /* sigue */ }
    const enRes = !el.velo.hidden && el.modal.classList.contains('res') && partida === p;
    abrirModal('<div class="m-top"><h2>' + esc(t('compartir')) + '</h2><button class="x" type="button" data-cerrar aria-label="' + esc(t('cerrar')) + '">✕</button></div>' +
      '<p class="texto dim" id="compartirAviso" style="margin-bottom:8px">' + esc(t('copiaFallo')) + '</p>' +
      '<textarea readonly aria-labelledby="modalTitulo" style="width:100%;min-height:140px;background:#0a0418;color:#fff;border:1px solid var(--line);border-radius:12px;padding:10px;font:14px JetBrains Mono,monospace;user-select:text;-webkit-user-select:text">' + esc(txt) + '</textarea>' +
      '<div class="m-fila" style="margin-top:12px"><button class="btn-pri" type="button" data-copiar-txt>' + esc(t('copiarTexto')) + '</button><button class="btn-sec" type="button" data-cerrar>' + esc(t('cerrar')) + '</button></div>', { alCerrar: enRes ? () => mostrarResultado({}) : null, foco: 'textarea' });
    const ta = el.modal.querySelector('textarea'); ta.select();
    el.modal.onclick = async e => {
      if (!e.target.closest('[data-copiar-txt]')) return;
      ta.focus(); ta.select();
      let ok = false;
      try { await navigator.clipboard.writeText(txt); ok = true; } catch (err) { try { ok = document.execCommand && document.execCommand('copy'); } catch (er) { ok = false; } }
      if (ok) { A.sfx('copiado'); toast(t('copiado'), 'cian', 1600); } else { toast(t('copiaFallo'), 'rojo', 2600); }
    };
  }

  // ajustes
  function abrirAjustes(volverA) {
    A.amortiguar(false); // en Ajustes la música se oye tal cual, para regular el volumen de verdad
    const tog = (k, on) => '<button type="button" class="tog' + (on ? ' on' : '') + '" data-tog="' + k + '" role="switch" aria-checked="' + !!on + '" aria-label="' + esc(t(k)) + '"></button>';
    const fsOk = puedeFs();
    let h = '<div class="m-top"><h2>' + esc(t('ajustes')) + '</h2><button class="x" type="button" data-cerrar aria-label="' + esc(t('cerrar')) + '">✕</button></div>';
    h += '<p class="set-grupo">' + esc(t('sonido')) + '</p>';
    h += '<div class="set"><span class="lbl">' + esc(t('musica')) + '</span><input type="range" min="0" max="1" step="0.05" value="' + aj.volMusica + '" data-vol="volMusica" aria-label="' + esc(t('musica') + ' · ' + t('volumen')) + '">' + tog('musica', aj.musica) + '</div>';
    h += '<div class="set"><span class="lbl">' + esc(t('efectos')) + '</span><input type="range" min="0" max="1" step="0.05" value="' + aj.volEfectos + '" data-vol="volEfectos" aria-label="' + esc(t('efectos') + ' · ' + t('volumen')) + '">' + tog('efectos', aj.efectos) + '</div>';
    if (navigator.vibrate) h += '<div class="set"><span class="lbl">' + esc(t('vibracion')) + '</span>' + tog('vibracion', aj.vibracion) + '</div>';
    h += '<p class="set-grupo">' + esc(t('idioma')) + '</p><div class="set"><span class="lbl">' + esc(t('idioma')) + '</span><div class="seg seg-idioma" role="group" aria-label="' + esc(t('idioma')) + '"><button type="button" data-lang="es" lang="es" aria-label="Español" aria-pressed="' + (lang() === 'es') + '" class="' + (lang() === 'es' ? 'on' : '') + '">ES</button><button type="button" data-lang="en" lang="en" aria-label="English" aria-pressed="' + (lang() === 'en') + '" class="' + (lang() === 'en' ? 'on' : '') + '">EN</button></div></div>';
    if (fsOk) h += '<div class="set"><span class="lbl">' + esc(t('pantalla')) + '</span>' + tog('fs', !!fsEl()) + '</div>';
    h += '<p class="set-grupo">' + esc(t('accesibilidad')) + '</p>';
    h += '<div class="set"><span class="lbl">' + esc(t('letras')) + '</span>' + tog('letras', aj.letras) + '</div>';
    h += '<div class="set"><span class="lbl">' + esc(t('movReducido')) + '</span>' + tog('movReducido', aj.movReducido) + '</div>';
    h += '<p class="set-grupo">' + esc(t('progreso')) + '</p><button type="button" class="btn-sec peligro" data-borrar style="width:100%">' + esc(t('borrarTodo')) + '</button>';
    h += '<p class="texto dim atajos" style="font-size:12px;margin-top:14px">' + esc(t('atajos')) + '</p>';
    abrirModal(h, { volver: pantalla, alCerrar: volverA || null });
    el.modal.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tog) {
        const k = b.dataset.tog;
        if (k === 'fs') { alternarFs(); setTimeout(() => { b.classList.toggle('on', !!fsEl()); b.setAttribute('aria-checked', !!fsEl()); }, 250); A.sfx('ui'); return; }
        aj[k] = !aj[k]; b.classList.toggle('on', aj[k]); b.setAttribute('aria-checked', aj[k]);
        guardarAjustes(); aplicarAjustes(); A.sfx('ui');
        if (k === 'vibracion' && aj.vibracion) vibrar(20);
        return;
      }
      if (b.dataset.lang) {
        A.sfx('ui');
        if (b.dataset.lang !== lang()) { JI.set(b.dataset.lang); abrirAjustes(volverA); }
        return;
      }
      if (b.dataset.borrar != null) { abrirConfirmarBorrado(volverA); return; }
    };
    el.modal.oninput = e => {
      const r = e.target.closest('[data-vol]'); if (!r) return;
      aj[r.dataset.vol] = +r.value; guardarAjustes(); aplicarAjustes();
    };
    el.modal.onchange = e => { const r = e.target.closest('[data-vol]'); if (r && r.dataset.vol === 'volEfectos') A.sfx('acepta'); };
  }
  // SRC-G04: confirmación explícita (sin doble toque), Cancelar con el foco inicial, botón peligro «Borrar progreso»,
  // enumeración de lo que se borra. Los ajustes (audio, letras, movimiento) y el idioma del sitio se conservan.
  function abrirConfirmarBorrado(volverA) {
    abrirModal('<div class="m-top"><h2>' + esc(t('borrarQ', { juego: 'JET//' + t('titulo') })) + '</h2></div>' +
      '<p class="texto" style="margin-bottom:16px">' + esc(t('borrarCuerpo', { datos: t('borrarDatos') })) + '</p>' +
      '<div class="m-btns"><button class="btn-sec" type="button" data-cancelar>' + esc(t('cancelar')) + '</button><button class="btn-sec peligro" type="button" data-confirmar-borrado>' + esc(t('borrarTodo')) + '</button></div>',
      { volver: pantalla, alerta: true, foco: '[data-cancelar]', alCerrar: () => abrirAjustes(volverA) });
    el.modal.onclick = e => {
      if (e.target.closest('[data-cancelar]')) { A.sfx('ui'); cerrarModal(); return; }
      if (e.target.closest('[data-confirmar-borrado]')) { onCerrarModal = null; borrarTodo(); }
    };
  }
  function borrarTodo() {
    for (const k of st.claves()) if (k !== 'ajustes') st.del(k);
    location.reload();
  }

  // cómo jugar (tres láminas animadas)
  let comoTimers = [], comoIdx = 0;
  function detenerComo() { comoTimers.forEach(clearTimeout); comoTimers = []; }
  function abrirComo(volverA) {
    comoIdx = 0;
    const h = '<div class="m-top"><h2>' + esc(t('comoJugar')) + '</h2><button class="x" type="button" data-cerrar aria-label="' + esc(t('cerrar')) + '">✕</button></div>' +
      '<div class="como-esc" id="comoEsc"></div><h3 class="como-t" id="comoT"></h3><p class="como-d" id="comoD"></p><div class="puntos" id="comoP"><i></i><i></i><i></i></div>' +
      '<div class="m-fila"><button class="btn-sec" type="button" data-c="ant">' + esc(t('anterior')) + '</button><button class="btn-pri" type="button" data-c="sig">' + esc(t('siguiente')) + '</button></div>' +
      '<button class="btn-sec chico" type="button" data-c="tut" style="width:100%;margin-top:10px">' + esc(t('tutOtra')) + '</button>';
    abrirModal(h, { volver: pantalla, alCerrar: volverA || null });
    el.modal.onclick = e => {
      const b = e.target.closest('[data-c]'); if (!b) return;
      A.sfx('ui');
      if (b.dataset.c === 'sig') { if (comoIdx >= 2) { cerrarModal(); return; } comoIdx++; laminaComo(); }
      else if (b.dataset.c === 'ant') { if (comoIdx > 0) { comoIdx--; laminaComo(); } }
      else if (b.dataset.c === 'tut') { onCerrarModal = null; cerrarModal(); Tut.empezar(0); }
    };
    laminaComo();
  }
  function laminaComo() {
    detenerComo();
    const esc_ = $('#comoEsc'); if (!esc_) return;
    $('#comoT').textContent = t('como' + (comoIdx + 1));
    $('#comoD').textContent = t('como' + (comoIdx + 1) + 'b');
    $$('#comoP i').forEach((n, i) => n.classList.toggle('on', i === comoIdx));
    const sig = el.modal.querySelector('[data-c="sig"]'); if (sig) sig.textContent = comoIdx >= 2 ? t('listo') : t('siguiente');
    const ant = el.modal.querySelector('[data-c="ant"]'); if (ant) ant.disabled = comoIdx === 0;
    const T_ = (ms, f) => comoTimers.push(setTimeout(f, ms));
    const cols = '<div class="ce-col a"><h4>' + esc(t('aceptadas')) + '</h4></div><div class="ce-col r"><h4>' + esc(t('rechazadas')) + '</h4></div>';
    if (comoIdx === 0) {
      esc_.innerHTML = '<div class="ce-sonda" id="ceS"></div>' + cols + '<div class="ce-vuela" id="ceV"></div>';
      const filas = [[8, 1], [12, 17]], ok = [1, 0];
      const ciclo = (k) => {
        const v = $('#ceV'), s = $('#ceS'); if (!v) return;
        v.innerHTML = filaHTML(filas[k % 2], true); v.style.transition = 'none'; v.style.left = '50%'; v.style.top = '140px'; v.style.transform = 'translateX(-50%)'; v.style.opacity = '1';
        s.className = 'ce-sonda';
        T_(80, () => { v.style.transition = ''; v.style.top = '28px'; v.style.opacity = '.2'; });
        T_(750, () => { s.className = 'ce-sonda ' + (ok[k % 2] ? 'si' : 'no'); A.sfx(ok[k % 2] ? 'acepta' : 'rechaza'); });
        T_(1300, () => {
          v.style.opacity = '0';
          const col = esc_.querySelector(ok[k % 2] ? '.ce-col.a' : '.ce-col.r');
          if (col.querySelectorAll('.ce-fila').length > 2) col.querySelector('.ce-fila').remove();
          col.insertAdjacentHTML('beforeend', '<div class="ce-fila">' + filaHTML(filas[k % 2], true) + '</div>');
        });
        T_(2300, () => ciclo(k + 1));
      };
      ciclo(0);
    } else if (comoIdx === 1) {
      esc_.innerHTML = '<div class="ce-sonda" id="ceS"></div>' + cols;
      const base = [12, 3, 17];
      const ciclo = () => {
        const a = esc_.querySelector('.ce-col.a'), r = esc_.querySelector('.ce-col.r'), s = $('#ceS');
        if (!a) return;
        a.innerHTML = '<h4>' + esc(t('aceptadas')) + '</h4>'; r.innerHTML = '<h4>' + esc(t('rechazadas')) + '</h4><div class="ce-fila" id="ceBase">' + filaHTML(base, true) + '</div>';
        s.className = 'ce-sonda';
        T_(700, () => { const b = $('#ceBase'); if (b) b.children[1].classList.add('ce-cambio'); });
        T_(1500, () => { const b = $('#ceBase'); if (!b) return; const n = base.slice(); n[1] = 9; a.insertAdjacentHTML('beforeend', '<div class="ce-fila" style="opacity:.25" id="ceNueva">' + filaHTML(n, true) + '</div>'); const nn = $('#ceNueva'); nn.children[1].classList.add('ce-cambio'); });
        T_(2100, () => { s.className = 'ce-sonda si'; A.sfx('acepta'); const nn = $('#ceNueva'); if (nn) nn.style.opacity = '1'; });
        T_(4200, ciclo);
      };
      ciclo();
    } else {
      esc_.innerHTML = '<div class="ce-sonda" id="ceS" style="top:auto;bottom:12px;left:auto;right:12px;margin:0;width:44px;height:44px"></div><p class="ce-frase" id="ceF"></p>' + cols.replace(/ce-col a/, 'ce-col a" style="width:36%;height:86px;bottom:12px;right:auto').replace(/ce-col r/, 'ce-col r" style="width:36%;height:86px;bottom:12px;left:42%;right:auto');
      const ciclo = () => {
        const f = $('#ceF'), a = esc_.querySelector('.ce-col.a'), r = esc_.querySelector('.ce-col.r'), s = $('#ceS'); if (!f) return;
        f.innerHTML = ''; s.className = 'ce-sonda';
        a.innerHTML = '<h4>' + esc(t('aceptadas')) + '</h4><div class="ce-fila">' + filaHTML([8, 1], true) + '<span class="ce-marca">✓</span></div><div class="ce-fila">' + filaHTML([16, 9, 4], true) + '<span class="ce-marca">✓</span></div>';
        r.innerHTML = '<h4>' + esc(t('rechazadas')) + '</h4><div class="ce-fila">' + filaHTML([12, 17], true) + '<span class="ce-marca">✓</span></div>';
        T_(400, () => { f.innerHTML = marcado(R.texto('HAY:c', lang(), true)); A.sfx('chip', { fila: 1, i: 2 }); });
        T_(1300, () => { esc_.querySelectorAll('.ce-marca').forEach(m => m.classList.add('on')); A.sfx('coherente'); });
        T_(2300, () => { s.className = 'ce-sonda si'; A.sfx('acepta'); f.innerHTML = '<b>' + esc(t('contacto')) + '</b>'; });
        T_(4400, ciclo);
      };
      ciclo();
    }
  }

  // archivo
  function abrirArchivo() {
    const h0 = hoy(), nHoy = numDe(h0);
    let h = '<div class="m-top"><h2>' + esc(t('archivo')) + '</h2><button class="x" type="button" data-cerrar aria-label="' + esc(t('cerrar')) + '">✕</button></div>';
    if (nHoy <= 1) {
      h += '<div style="text-align:center;padding:20px 6px"><canvas id="cvArchVacio" style="width:120px;height:120px"></canvas><p class="texto dim" style="margin-top:10px">' + esc(t('archivoVacio')) + '</p></div>';
      abrirModal(h, { volver: pantalla });
      const cv = $('#cvArchVacio'); const s = S.crearSonda(); const { c } = S.ajustarLienzo(cv); S.dibujar(c, s, 60, 60, 44, ahora(), 0, true, true);
      return;
    }
    h += '<p class="arch-nota">' + esc(t('archivoNota')) + '</p>';
    const ancho = innerWidth >= 700;
    const items = [];
    for (let n = nHoy; n >= 1; n--) {
      const f = fechaDeNum(n), g = leerPartida('diario:' + f);
      let est = t('sinJugar'), cls = '';
      if (g) { if (g.estado === 'resuelta') { est = t('resuelta', { p: pulsosDe(g) }) + ' ✓'; cls = 'ok'; } else if (g.estado === 'rendida') { est = t('rendidaCorta'); } else { est = enviadas(g) === 1 ? t('enCurso1') : t('enCurso', { m: enviadas(g) }); cls = 'cur'; } }
      items.push({ n, f, est, cls, g });
    }
    if (ancho) {
      // calendario por mes
      const porMes = {};
      for (const it of items) { const k = it.f.slice(0, 7); (porMes[k] = porMes[k] || []).push(it); }
      for (const k of Object.keys(porMes).sort().reverse()) {
        const [y, m] = k.split('-').map(Number);
        h += '<p class="cal-mes">' + esc(t('mesesL')[m - 1]) + ' ' + y + '</p><div class="cal">';
        for (let d = 0; d < 7; d++) h += '<div class="d cab">' + esc(t('dias')[(d + 1) % 7]) + '</div>';
        const primer = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(), dias = new Date(Date.UTC(y, m, 0)).getUTCDate();
        for (let i = 0; i < (primer + 6) % 7; i++) h += '<div class="d vacio"></div>';
        for (let d = 1; d <= dias; d++) {
          const f = y + '-' + pad(m) + '-' + pad(d), it = porMes[k].find(x => x.f === f);
          if (!it) h += '<div class="d vacio" style="visibility:visible;opacity:.25">' + d + '</div>';
          else h += '<button type="button" class="d ' + it.cls + '" data-f="' + f + '" aria-label="#' + it.n + ' · ' + esc(fechaCorta(f)) + ' · ' + esc(it.est) + '">' + d + '<small>#' + it.n + (it.cls === 'ok' ? ' ✓' : '') + '</small></button>';
        }
        h += '</div>';
      }
    } else {
      h += '<div class="arch-lista">';
      for (const it of items) h += '<button type="button" class="arch-it" data-f="' + it.f + '"><span class="n">#' + it.n + '</span><span class="f">' + esc(it.f === h0 ? t('hoy') : fechaCorta(it.f)) + '</span><span class="e ' + it.cls + '">' + esc(it.est) + '</span></button>';
      h += '</div>';
    }
    abrirModal(h, { volver: pantalla, ancha: ancho });
    el.modal.onclick = e => { const b = e.target.closest('[data-f]'); if (!b) return; A.sfx('ui'); cerrarModal(); jugarDiaria(b.dataset.f); };
  }

  // estadísticas
  function abrirStats() {
    const d = stats.diarias;
    let h = '<div class="m-top"><h2>' + esc(t('estadisticas')) + '</h2><button class="x" type="button" data-cerrar aria-label="' + esc(t('cerrar')) + '">✕</button></div>';
    if (!d.resueltas && !stats.practica.resueltas) {
      h += '<div style="text-align:center;padding:16px 6px"><p class="texto dim" style="margin-bottom:14px">' + esc(t('statsVacio')) + '</p><button class="btn-pri" type="button" data-s="diaria" style="width:100%">' + esc(t('irDiaria')) + '</button></div>';
    } else {
      const pct = d.jugadas ? Math.round(d.resueltas / d.jugadas * 100) : 0;
      const prom = d.resueltas ? (d.sumaPulsos - d.sumaPar) / d.resueltas : 0;
      h += '<div class="kpis"><div class="kpi"><b>' + d.jugadas + '</b><span>' + esc(t('sJugadas')) + '</span></div><div class="kpi"><b>' + pct + '%</b><span>' + esc(t('sResueltas')) + '</span></div><div class="kpi"><b>' + (prom > 0 ? '+' : '') + prom.toFixed(1) + '</b><span>' + esc(t('sPromedio')) + '</span></div>' +
        '<div class="kpi"><b>' + rachaEfectiva() + '</b><span>' + esc(t('sRacha')) + '</span></div><div class="kpi"><b>' + d.rachaMax + '</b><span>' + esc(t('sRachaMax')) + '</span></div><div class="kpi"><b>R' + rango() + '</b><span>' + esc(t('rangos')[rango() - 1]) + '</span></div></div>';
      const mx = Math.max(1, ...d.distribucion);
      h += '<p class="sec-t">' + esc(t('sDistrib')) + '</p><div class="barras">';
      d.distribucion.forEach((v, i) => { h += '<div class="barra"><span>' + esc(t('calif')[i]) + '</span><span class="b"><i style="width:' + (v / mx * 100) + '%"></i></span><em>' + v + '</em></div>'; });
      h += '</div>';
      const mp = Math.max(1, ...stats.practica.porRango);
      h += '<p class="sec-t">' + esc(t('sPracticaR')) + '</p><div class="barras">';
      stats.practica.porRango.forEach((v, i) => { h += '<div class="barra"><span>R' + (i + 1) + ' · ' + esc(t('rangos')[i]) + '</span><span class="b"><i style="width:' + (v / mp * 100) + '%"></i></span><em>' + v + '</em></div>'; });
      h += '</div>';
    }
    const ICO = { existencia: '◉', posicion: '⇤', cantidad: '#', comparacion: '⚖', vecindad: '⋈', orden: '→', igualdad: '≡', simetria: '⇋', combinadas: '∧' };
    h += '<p class="sec-t">' + esc(t('sCatalogo')) + '</p><p class="texto dim" style="font-size:12.5px;margin-bottom:8px">' + esc(t('sCatalogoD')) + '</p><div class="catalogo">';
    for (const f of R.FAMILIAS) h += '<div class="fam' + (perfil.familias[f] ? ' on' : '') + '"><span class="ico" aria-hidden="true">' + ICO[f] + '</span>' + esc(t('familias')[f]) + '</div>';
    h += '</div>';
    abrirModal(h, { volver: pantalla, ancha: innerWidth >= 700 });
    el.modal.onclick = e => { if (e.target.closest('[data-s]')) { cerrarModal(); jugarDiaria(hoy()); } };
  }

  // ---------- pantalla completa ----------
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const puedeFs = () => !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen) && !/iPhone|iPod/.test(navigator.userAgent);
  function alternarFs() {
    try {
      if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else { const r = document.documentElement; const f = r.requestFullscreen || r.webkitRequestFullscreen; const p = f.call(r, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); }
    } catch (e) { /* nada */ }
  }
  el.btnFs.addEventListener('click', () => { A.sfx('ui'); alternarFs(); });
  function actualizarBtnFs() {
    el.btnFs.hidden = !puedeFs() || pantalla !== 'inicio';
    el.btnFs.setAttribute('aria-label', fsEl() ? t('salirPantalla') : t('pantallaCompleta'));
  }

  // ---------- navegación entre pantallas ----------
  function mostrar(nombre) {
    pantalla = nombre;
    el.inicio.classList.toggle('on', nombre === 'inicio');
    el.juego.classList.toggle('on', nombre === 'juego');
    el.btnPausa.hidden = nombre !== 'juego';
    actualizarBtnFs();
    if (nombre === 'inicio') { st.del('activa'); cronometro(false); A.tema('menu'); iniciarFondo(); }
    else { detenerFondo(); A.tema('juego'); }
    layout();
  }
  // RSP-MODALS-01: si el foco quedó en el cuerpo (el activador desapareció con el cambio de pantalla), va al primer control lógico
  const focoPerdido = () => !document.activeElement || document.activeElement === document.body || !visibleEl(document.activeElement);
  function irInicio() {
    guardarYa();
    if (panelAbierto) { panelAbierto = false; el.juego.classList.remove('formulando'); el.panel.hidden = true; marcasCoh = null; }
    Tut.ocultar();
    partida = null;
    renderInicio(); mostrar('inicio');
    if (focoPerdido()) { const b = $('#btnPrincipal'); if (b && visibleEl(b)) b.focus({ preventScroll: true }); }
  }
  function entrarJuego(p, pausar) {
    activar(p);
    panelAbierto = false; marcasCoh = null; el.juego.classList.remove('formulando'); el.panel.hidden = true;
    S.poner(sonda, 'reposo', ahora()); sonda.progreso = -1;
    mostrar('juego');
    renderBandeja(); renderRegistro(); actualizarHud(false);
    if (focoPerdido()) el.juego.focus({ preventScroll: true });
    guardar();
    if (p.estado !== 'jugando') { mostrarResultado({}); return; }
    if (pausar) abrirPausa(); else cronometro(true);
  }
  function jugarDiaria(fecha) {
    const clave = 'diario:' + fecha;
    let p = leerPartida(clave);
    if (!p || !p.rx) {
      const s = senalDe(fecha);
      p = crearPartida({ modo: fecha === hoy() ? 'diaria' : 'archivo', n: s.n, fecha, code: s.code, par: s.par, ga: s.ga, gr: s.gr, nivel: s.nivel });
      stats.diarias.jugadas++; guardarStats();
    }
    p.modo = fecha === hoy() ? 'diaria' : 'archivo';
    // la diaria puede usar cualquier molde: se abren todas las fichas
    if (!perfil.todo) {
      const antes = familiasAbiertas().length; perfil.todo = true;
      if (R.FAMILIAS.length > antes) perfil.avisoFichas = true;
      guardarPerfil();
    }
    entrarJuego(p);
  }
  function elegirPractica() {
    const b = banco(), fams = familiasAbiertas(), vistas = new Set(perfil.vistas || []);
    const rnd = V.mulberry32(V.hashStr(perfil.id + ':' + perfil.contadorPractica));
    const base = clamp(Math.round(perfil.nivelPractica + (rnd() - 0.5)), 1, 6);
    const orden = [base, base - 1, base + 1, base - 2, base + 2, 1, 2, 3, 4, 5, 6].filter(n => n >= 1 && n <= 6);
    for (const relajar of [0, 1, 2]) {
      for (const nv of orden) {
        const c = b[nv - 1].filter(e => reglaAbierta(e.code, fams) && (relajar >= 2 || !vistas.has(e.code)) && (relajar >= 1 || R.familia(R.leer(e.code)) !== perfil.ultimaFam));
        if (c.length) return c[(rnd() * c.length) | 0];
      }
    }
    return b.flat()[0];
  }
  function jugarPractica(nueva) {
    let p = nueva ? null : leerPartida('practica');
    if (!p || !p.rx || p.estado !== 'jugando') {
      const e = qs.get('regla') ? { code: R.normal(qs.get('regla')), par: 8, ga: [], gr: [], nivel: 0 } : elegirPractica();
      if (!e.ga.length) { const g = regalosRapidos(e.code); e.ga = g[0]; e.gr = g[1]; }
      p = crearPartida({ modo: 'practica', code: e.code, par: e.par, ga: e.ga, gr: e.gr, nivel: e.nivel });
    }
    entrarJuego(p);
  }
  function regalosRapidos(code) { // para ?regla=: una aceptada y una rechazada cortas
    const f = R.compilar(code), rnd = V.mulberry32(V.hashStr('r:' + code));
    let a = null, r = null;
    for (let k = 0; k < 5000 && (!a || !r); k++) { const L = 2 + ((rnd() * 3) | 0), s = []; for (let i = 0; i < L; i++) s.push((rnd() * 18) | 0); if (f(s, L)) { if (!a) a = s; } else if (!r && (!a || s.length !== a.length || s[0] !== a[0])) r = s; }
    return [a || [0], r || [1]];
  }

  // ---------- inicio ----------
  // tutorial a medias: la partida guardada o la regla siguiente a la última resuelta
  function tutPendiente() {
    if (perfil.tutorial != null) return null;
    const p = leerPartida('tutorial');
    if (p && p.rx && p.modo === 'tutorial' && p.estado === 'jugando') return { r: clamp(p.tut || 0, 0, 2), p };
    const r = clamp(perfil.tutPaso || 0, 0, 2);
    return r > 0 ? { r, p: null } : null;
  }
  function renderInicio() {
    const btn = $('#btnPrincipal'), bt = btn.querySelector('.bp-t'), bs = btn.querySelector('.bp-s');
    const nuevo = perfil.tutorial == null;
    const h0 = hoy(), s = numDe(h0), g = leerPartida('diario:' + h0);
    const racha = rachaEfectiva();
    btn.hidden = false;
    $('#rachaIni').hidden = nuevo || racha < 1;
    $('#rachaIni b').textContent = racha === 1 ? t('racha1') : t('racha', { d: racha });
    $('#rangoIni').textContent = nombreRango(rango()).replace(' · ', '\n');
    const th = $('#tarjetaHoy');
    th.hidden = true;
    $$('.ini-sec .btn-sec').forEach(b => { b.hidden = nuevo && b.dataset.acc !== 'como'; });
    if (nuevo) {
      const tp = tutPendiente();
      // SRC-G03: «Continuar partida» sólo cuando hay un tutorial guardado que se recupera; si sólo falta avanzar, «Continuar»
      bt.textContent = tp ? (tp.p ? t('continuarPartida') : t('continuar')) : t('empezar');
      bs.textContent = tp ? t('tutorialN', { i: tp.r + 1 }) : t('empezarSub');
      btn.dataset.acc = 'tutorial';
    }
    else if (g && g.estado !== 'jugando') {
      bt.textContent = t('practica'); bs.textContent = nombreRango(rango()); btn.dataset.acc = 'practica';
      th.hidden = false;
      th.querySelector('b').textContent = t('diaria', { n: Math.max(1, s) });
      th.querySelector('span').textContent = g.estado === 'resuelta' ? t('resuelta', { p: pulsosDe(g) }) + ' ✓' : t('rendidaCorta');
      $$('.ini-sec .btn-sec').forEach(b => { if (b.dataset.acc === 'practica') b.hidden = true; });
    } else {
      bt.textContent = t('diaria', { n: Math.max(1, s) });
      bs.textContent = g ? (enviadas(g) === 1 ? t('enCurso1') : t('enCurso', { m: enviadas(g) })) : t('nueva');
      btn.dataset.acc = 'diaria';
    }
    $('#avisoGuardado').hidden = hayGuardado;
    const sec = $$('.ini-sec .btn-sec'), vis = sec.filter(b => !b.hidden);
    sec.forEach(b => b.classList.remove('span2'));
    if (vis.length % 2) vis[vis.length - 1].classList.add('span2');
    $('.ini-sec').style.setProperty('--n', Math.max(1, vis.length));
    cajaIni = null;
  }
  el.inicio.addEventListener('click', e => {
    const b = e.target.closest('[data-acc]'); if (!b) return;
    const a = b.dataset.acc; A.sfx('ui');
    if (a === 'tutorial') { const tp = tutPendiente(); if (tp && tp.p) Tut.retomar(tp.p); else Tut.empezar(tp ? tp.r : 0); }
    else if (a === 'diaria') jugarDiaria(hoy());
    else if (a === 'practica') jugarPractica(false);
    else if (a === 'archivo') abrirArchivo();
    else if (a === 'stats') abrirStats();
    else if (a === 'como') abrirComo();
    else if (a === 'verHoy') { const g = leerPartida('diario:' + hoy()); if (g) entrarJuego(g); }
    else if (a === 'compartirHoy') { const g = leerPartida('diario:' + hoy()); if (g) compartir(g); }
  });

  // ---------- fondo animado y Sonda ----------
  let rafFondo = 0, rafJuego = 0, tPrev = ahora();
  function iniciarFondo() { cancelAnimationFrame(rafFondo); const loop = () => { dibujarFondo(); rafFondo = requestAnimationFrame(loop); }; loop(); }
  function detenerFondo() { cancelAnimationFrame(rafFondo); }
  let cajaIni = null;
  function dibujarFondo() {
    const { c, w, h } = S.ajustarLienzo(el.cvFondo);
    const tt = ahora();
    c.clearRect(0, 0, w, h);
    S.dibujarCielo(c, cielo, w, h, tt, tt * 0.00002, 0);
    S.actualizar(sondaIni, 1 / 60, tt, aj.movReducido);
    const land = w / h > 1.15 && h < 560;
    let R0 = land ? Math.min(h * 0.42, w * 0.22) : Math.min(w * 0.46, h * 0.3);
    let cx = land ? w * 0.27 : w / 2, cy = land ? h * 0.56 : h * 0.46, alfa = land ? 0.36 : 0.42;
    if (!land) {
      // centrada en el hueco entre el lema y los botones, para no pasar por encima del texto
      if (!cajaIni) { const a = $('.ini-cab').getBoundingClientRect(), b = $('.ini-acc').getBoundingClientRect(); cajaIni = { a: a.bottom, b: b.top }; }
      const hueco = cajaIni.b - cajaIni.a;
      if (hueco > 80) { cy = cajaIni.a + hueco / 2; R0 = clamp(hueco / 2 - 6, 70, Math.min(w * 0.46, h * 0.34)); }
      else alfa = 0.2; // sin hueco queda detrás de los botones: más tenue
    }
    c.globalAlpha = alfa;
    S.dibujar(c, sondaIni, cx, cy, R0, tt, A.pulso() * 0.6 + 0.2 * (0.5 + 0.5 * Math.sin(tt / 1400)), aj.movReducido);
    c.globalAlpha = 1;
  }
  function bucleJuego() {
    const tt = ahora(), dt = Math.min(0.05, (tt - tPrev) / 1000); tPrev = tt;
    if (pantalla === 'juego') {
      el.juego.classList.toggle('hud-oculto', !el.globo.hidden && !horiz && !panelAbierto);
      const { c, w, h } = S.ajustarLienzo(el.cvSonda);
      c.clearRect(0, 0, w, h);
      S.actualizar(sonda, dt, tt, aj.movReducido);
      const Rr = Math.max(14, Math.min(h * 0.44, w * 0.3));
      S.dibujar(c, sonda, w / 2, h / 2 + 4, Rr, tt, A.pulso(), aj.movReducido, Rr < 30);
    }
    rafJuego = requestAnimationFrame(bucleJuego);
  }

  // ---------- teclado ----------
  document.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    A.iniciar();
    const code = e.code;
    if (code === 'Escape') {
      if (!el.menuTarj.hidden) { cerrarMenuTarj(); return; }
      if (!el.velo.hidden) { if (modalVolver !== 'bloquear') cerrarModal(); return; }
      if (panelAbierto) { cerrarPanel(); return; }
      if (pantalla === 'juego') abrirPausa();
      return;
    }
    if (code === 'KeyM') { const on = !(aj.musica || aj.efectos); aj.musica = on; aj.efectos = on; guardarAjustes(); aplicarAjustes(); toast((on ? '♪ ' : '✕ ') + t('sonido')); return; }
    if (!el.velo.hidden || pantalla !== 'juego' || !partida) {
      if (e.key === '?' && el.velo.hidden) abrirComo();
      return;
    }
    if (code === 'KeyP') { abrirPausa(); return; }
    if (e.key === '?') { abrirComo(); return; }
    if (panelAbierto) return;
    if (e.target && e.target.closest && e.target.closest('.lista')) {
      if (code === 'ArrowUp' || code === 'ArrowDown') { e.preventDefault(); navRegistro(e.target.closest('.lista'), code === 'ArrowDown' ? 1 : -1); return; }
      if (code === 'Enter' && e.target.classList.contains('tarj')) { e.preventDefault(); copiar(+e.target.dataset.i); return; }
    }
    for (let c = 0; c < 3; c++) { const k = TECLAS[c].indexOf(code); if (k >= 0 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); const id = R.idDe(k >> 1, c, k & 1); agregarPieza(id, el.paleta.querySelector('[data-id="' + id + '"]')); return; } }
    if (code === 'Enter' || code === 'NumpadEnter') { if (e.target && e.target.tagName === 'BUTTON' && !e.target.closest('#paleta,#bandeja')) return; e.preventDefault(); enviar(); return; }
    if (code === 'KeyL') { abrirPanel(); return; }
    if (code === 'Backspace') { e.preventDefault(); const i = partida.sel >= 0 ? partida.sel : partida.bandeja.length - 1; quitarPieza(i); return; }
    if (code === 'Delete') { vaciar(); return; }
    if (code === 'ArrowLeft' || code === 'ArrowRight') {
      const n = partida.bandeja.length; if (!n) return;
      e.preventDefault();
      const d = code === 'ArrowRight' ? 1 : -1;
      if (e.shiftKey && partida.sel >= 0) { moverPieza(partida.sel, clamp(partida.sel + d, 0, n - 1)); return; }
      partida.sel = partida.sel < 0 ? (d > 0 ? 0 : n - 1) : clamp(partida.sel + d, 0, n - 1);
      A.sfx('seleccion'); renderBandeja();
    }
  });
  function navRegistro(lista, d) {
    const ts = Array.from(lista.querySelectorAll('.tarj'));
    if (!ts.length) return;
    let i = ts.findIndex(n => n.classList.contains('foco-k'));
    ts.forEach(n => n.classList.remove('foco-k'));
    i = clamp(i + d, 0, ts.length - 1);
    ts[i].classList.add('foco-k'); ts[i].tabIndex = 0; ts[i].focus(); ts[i].scrollIntoView({ block: 'nearest' });
  }

  // botones fijos
  el.btnEnviar.addEventListener('click', () => enviar());
  el.btnFormular.addEventListener('click', () => { if (panelAbierto) cerrarPanel(); else abrirPanel(); });
  el.btnVaciar.addEventListener('click', () => vaciar());
  el.btnPausa.addEventListener('click', () => { A.sfx('ui'); if (el.velo.hidden) abrirPausa(); });
  el.btnAjustes.addEventListener('click', () => {
    A.sfx('ui');
    if (!el.velo.hidden) { if (modalVolver === 'bloquear') return; cerrarModal(); }
    abrirAjustes(null);
    modalActivador = el.btnAjustes;
  });
  // PLAY-SENAL-05: ayuda compacta junto a la bandeja (cómo agregar, reemplazar y quitar) y teclas sobre las piezas
  el.btnAtajos.addEventListener('click', () => { A.sfx('ui'); aj.atajos = !aj.atajos; guardarAjustes(); aplicarAjustes(); pedirLayout(); });

  // ---------- tutorial ----------
  const Tut = {
    activo: false, r: 0, paso: 0, envios: 0, tGlobo: 0,
    REGLAS: [
      { code: 'HAY:c', ga: ['ocG', 'tvP'], gr: ['svG', 'oaP'], par: 5 },
      { code: 'PRIM:G', ga: ['taG', 'ocP'], gr: ['ocP', 'taG'], par: 6 },
      { code: 'JUNTO:v:a', ga: ['ocG', 'tvG', 'saP'], gr: ['svP', 'ocG', 'oaG'], par: 8 }
    ],
    empezar(r) {
      const d = this.REGLAS[r];
      const p = crearPartida({ modo: 'tutorial', tut: r, code: d.code, par: d.par, ga: d.ga.map(R.piezaDe), gr: d.gr.map(R.piezaDe) });
      this.activo = true; this.r = r; this.paso = 0; this.envios = 0;
      perfil.tutPaso = r; guardarPerfil();
      entrarJuego(p);
      
      if (r === 0) this.ir(0);
      else if (r === 1) this.globo(t('tut11'), null, 0, true);
      else this.globo(t('tut13'), null, 7000, true);
      this.foco();
    },
    retomar(p) { this.activo = true; this.r = p.tut || 0; this.paso = this.r === 0 ? 0 : 99; this.envios = enviadas(p); entrarJuego(p);  if (this.r === 0) { this.reconstruirPaso(); } else this.globo(t(this.r === 1 ? 'tut11' : 'tut13'), null, 6000); this.foco(); },
    reconstruirPaso() {
      // a partir del estado de la partida, el paso razonable del tutorial 1
      const env = partida.registro.filter(e => e.t === 'e');
      if (env.length >= 2) this.ir(6); else if (env.length === 1) this.ir(5); else if (partida.bandeja.length) this.ir(partida.bandeja.some(id => R.PC[id] === 1) ? 3 : 2); else this.ir(0);
    },
    ir(paso) {
      this.paso = paso;
      let txt = { 0: 'tut1', 1: 'tut2', 2: 'tut3', 3: 'tut4', 4: 'tut5', 5: 'tut6', 6: 'tut7', 7: 'tut8', 8: 'tut9', 9: 'tut10' }[paso];
      // PLAY-SENAL-01: la frase «cambiaste una sola característica» sólo si la última muestra difiere del ejemplo rechazado en una pieza y cambió la respuesta
      if (paso === 4) txt = this.unaCaracteristica() ? 'unaCaracteristica' : 'tut5b';
      const conBoton = paso === 0 || paso === 4;
      this.globo(t(txt), conBoton ? t('siguiente') : null, 0, paso === 0);
      this.foco();
    },
    unaCaracteristica() {
      if (!partida) return false;
      const env = partida.registro.filter(e => e.t === 'e'); const u = env[env.length - 1], base = partida.registro[1];
      if (!u || !base || u.p.length !== base.p.length || u.a === base.a) return false;
      return u.p.filter((id, k) => id !== base.p[k]).length === 1;
    },
    globo(txt, boton, ms, conSaltar) {
      el.globo.hidden = false; el.globoTxt.textContent = txt;
      el.saltar.hidden = !conSaltar;
      el.globoBtn.hidden = !boton; if (boton) { el.globoBtn.textContent = boton; }
      clearTimeout(this.tGlobo);
      if (ms) this.tGlobo = setTimeout(() => { if (this.activo && this.r > 0) el.globo.hidden = true; }, ms);
      posicionarGlobo(); requestAnimationFrame(posicionarGlobo); iniciarAstroGlobo();
      el.globo.animate([{ transform: 'translateY(6px)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'ease-out' });
    },
    ocultar() { this.activo = false; el.globo.hidden = true; el.saltar.hidden = true; this.limpiarFoco(); el.juego.classList.remove('tut'); },
    refrescar() {
      if (!this.activo) return;
      if (this.r === 0 && this.paso < 99) this.ir(this.paso);
      else if (this.r > 0 && !el.globo.hidden) { el.globoTxt.textContent = t(this.r === 1 ? 'tut11' : 'tut13'); posicionarGlobo(); }
    },
    rechazo() { A.sfx('lleno'); const g = el.globo; if (!g.hidden) g.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], { duration: 220 }); },
    limpiarFoco() { $$('.foco').forEach(n => { n.classList.remove('foco'); n.removeAttribute('data-guia'); }); $$('.zona.apagada').forEach(n => n.classList.remove('apagada')); },
    foco() {
      this.limpiarFoco();
      if (!this.activo || this.r !== 0) { el.juego.classList.remove('tut'); return; }
      el.juego.classList.add('tut');
      const ap = (...ids) => ids.forEach(i => { const n = $(i); if (n) n.classList.add('apagada'); });
      // PLAY-SENAL-04: la guía es un contorno discontinuo ámbar con rótulo («Siguiente paso» / «Elegí esta opción»),
      // distinto del borde sólido cian de la selección y del anillo de foco del teclado
      const f = (n, guia) => { if (!n) return; n.classList.add('foco'); if (guia) n.setAttribute('data-guia', t(guia)); if (n.closest('#panel')) n.scrollIntoView({ block: 'nearest', inline: 'nearest' }); };
      switch (this.paso) {
        case 0: ap('#zBandeja', '#zPaleta', '#zAcciones'); break;
        case 1: ap('#zBandeja', '#zPaleta', '#zAcciones'); f(tarjetaDe(1), 'siguientePaso'); break;
        case 2: ap('#zAcciones'); f(el.bandeja, 'siguientePaso'); $$('#paleta .pz').forEach(b => { if (R.PC[+b.dataset.id] === 1) f(b); }); break;
        case 3: f(el.btnEnviar, 'siguientePaso'); break;
        case 4: ap('#zBandeja', '#zPaleta', '#zAcciones'); break;
        case 6: ap('#zBandeja', '#zPaleta'); f(el.btnFormular, 'siguientePaso'); break;
        case 7: f(el.panel.querySelector('.molde[data-m="HAY"]'), 'elegiOpcion'); break;
        case 8: {
          const cl = partida.borrador && partida.borrador.c[0];
          const ch = el.panel.querySelector('[data-ch="c"][data-v="1"]');
          if (ch) f(ch, 'elegiOpcion'); else f(el.panel.querySelector('.hueco'), 'siguientePaso');
          if (cl && cl.p.c === 1) f(el.panel.querySelector('[data-transmitir]'), 'siguientePaso');
          break;
        }
        case 9: f(el.panel.querySelector('[data-transmitir]'), 'siguientePaso'); break;
      }
    },
    permite(acc, d) {
      if (!this.activo || this.r !== 0) return true;
      switch (this.paso) {
        case 0: case 4: return false;
        case 1: return (acc === 'tarjeta' || acc === 'copiar') && d === 1;
        case 2: return acc === 'paleta' || acc === 'bandeja';
        case 3: return acc === 'paleta' || acc === 'bandeja' || acc === 'enviar';
        case 5: if (acc === 'enviar' && d.some(id => R.PC[id] === 1)) { this.globo(t('tut6b')); return false; } return acc !== 'formular';
        case 6: return acc === 'formular' || acc === 'tarjeta';
        case 7: return (acc === 'molde' && d === 'HAY') || (acc === 'tab' && d === 'existencia');
        case 8: case 9: return acc === 'hueco' || acc === 'chip' || acc === 'transmitir' || acc === 'neg' || (acc === 'tab' && d === 'existencia') || (acc === 'molde' && d === 'HAY');
      }
      return true;
    },
    evento(ev, d) {
      if (!this.activo || !partida || partida.modo !== 'tutorial') return;
      if (this.r === 0) {
        const p = this.paso;
        if (p === 1 && ev === 'copiar' && d === 1) this.ir(2);
        else if (p === 2 && ev === 'bandeja' && partida.bandeja.some(id => R.PC[id] === 1)) this.ir(3);
        else if (p === 3 && ev === 'bandeja' && !partida.bandeja.some(id => R.PC[id] === 1)) this.ir(2);
        else if (p === 3 && ev === 'enviado') this.ir(4);
        else if (p === 5 && ev === 'enviado') this.ir(6);
        else if (p === 6 && ev === 'panel') { partida.borrador.fam = 'existencia'; partida.borrador.eligiendo = partida.borrador.c[0].m ? -1 : 0; renderPanel(); this.ir(partida.borrador.c[0].m === 'HAY' ? 8 : 7); }
        else if (p === 7 && ev === 'molde') this.ir(8);
        else if ((p === 8 || p === 9) && ev === 'borrador') { const ok = borradorCompleto() && R.normal(R.codificar(borradorAST())) === 'HAY:c'; if (ok && p === 8) this.ir(9); else if (!ok && p === 9) this.ir(8); else this.foco(); }
        else if ((p === 7 || p === 8 || p === 9) && ev === 'panelCerrado') this.ir(6);
        else if (ev === 'contacto') this.fin();
        if (ev === 'panel' || ev === 'molde' || ev === 'borrador') this.foco();
      } else {
        if (ev === 'enviado') {
          this.envios++;
          if (this.r === 1 && this.envios === 4) this.globo(t('tutPista1'), null, 8000);
          if (this.r === 1 && this.envios === 7) this.globo(t('tutPista2'), null, 8000);
        }
        if (ev === 'fallo') this.globo(t('tut12'), null, 9000);
        if (ev === 'contacto') this.fin();
      }
    },
    fin() {
      el.globo.hidden = true; this.limpiarFoco(); el.juego.classList.remove('tut');
      st.del('tutorial');
      if (this.r < 2) { perfil.tutPaso = this.r + 1; guardarPerfil(); }
      setTimeout(() => {
        if (this.r < 2) mostrarResultado({});
        else { perfil.tutorial = 'hecho'; guardarPerfil(); this.globo(t('tut14'), t('listo')); this.paso = 100; el.saltar.hidden = true; }
      }, aj.movReducido ? 300 : 1500);
    },
    siguienteRegla() { el.globo.hidden = true; this.empezar(this.r + 1); },
    boton() {
      if (this.paso === 0) this.ir(1);
      else if (this.paso === 4) this.ir(5);
      else if (this.paso === 100) { this.ocultar(); irInicio(); A.sfx('fanfarria'); }
    },
    saltar() {
      perfil.tutorial = perfil.tutorial || 'saltado'; guardarPerfil(); st.del('tutorial');
      this.ocultar(); cerrarModal(); irInicio();
    }
  };
  el.globoBtn.addEventListener('click', () => { A.sfx('ui'); Tut.boton(); });
  el.saltar.addEventListener('click', () => { A.sfx('ui'); Tut.saltar(); });
  function posicionarGlobo() {
    if (el.globo.hidden) return;
    const abajo = horiz && panelAbierto;
    el.globo.classList.toggle('abajo', abajo);
    if (horiz && !panelAbierto) {
      // PLAY-SENAL-01: en horizontal la guía va sobre la bandeja (columna central), junto al control que explica
      const r = $('#zBandeja').getBoundingClientRect(), h = el.globo.offsetHeight || 80;
      el.globo.style.top = Math.max(56, Math.round(r.top - h - 6)) + 'px'; el.globo.style.left = Math.round(r.left) + 'px'; el.globo.style.width = Math.round(r.width) + 'px';
    } else if (abajo) {
      // formulando en horizontal: abajo de la columna del registro, sin tapar el panel
      const r = $('#zRegistro').getBoundingClientRect();
      el.globo.style.top = ''; el.globo.style.left = Math.round(r.left) + 'px'; el.globo.style.width = Math.round(r.width) + 'px';
    } else if (panelAbierto) {
      // formulando en vertical: sobre la parte baja del registro, sin tapar el panel
      const r = $('#zRegistro').getBoundingClientRect(), h = el.globo.offsetHeight || 80;
      el.globo.style.top = Math.max(56, r.bottom - h - 4) + 'px';
      el.globo.style.left = ''; el.globo.style.width = '';
    } else {
      const r = el.zSonda.getBoundingClientRect();
      el.globo.style.top = Math.max(56, r.top - 4) + 'px';
      el.globo.style.left = ''; el.globo.style.width = '';
    }
  }
  let astroGloboOn = false;
  function iniciarAstroGlobo() {
    if (astroGloboOn) return;
    astroGloboOn = true;
    const cv = $('#cvAstro'), t0 = ahora();
    const loop = () => {
      if (el.globo.hidden) { astroGloboOn = false; return; }
      const { c, w, h } = S.ajustarLienzo(cv);
      c.clearRect(0, 0, w, h);
      S.astronauta(c, w / 2, h * 0.58, Math.min(w, h) * 0.62, 'r', (ahora() - t0) / 1000, 0);
      requestAnimationFrame(loop);
    };
    loop();
  }

  // ---------- ciclo de vida ----------
  function alOcultar() {
    guardarYa();
    if (pantalla === 'juego' && partida && partida.estado === 'jugando' && el.velo.hidden && !ocupado) abrirPausa();
    cronometro(false);
    A.suspender();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) alOcultar();
    else { A.reanudar(); pedirLayout(); }
  });
  window.addEventListener('pagehide', guardarYa);
  window.addEventListener('blur', () => guardarYa());
  const alCambiarFs = () => {
    actualizarBtnFs(); pedirLayout(); setTimeout(layout, 250);
    if (!fsEl() && pantalla === 'juego' && partida && partida.estado === 'jugando' && el.velo.hidden && !ocupado) abrirPausa();
  };
  document.addEventListener('fullscreenchange', alCambiarFs);
  document.addEventListener('webkitfullscreenchange', alCambiarFs);
  window.addEventListener('resize', pedirLayout);
  window.addEventListener('orientationchange', () => { pedirLayout(); setTimeout(layout, 300); });
  if (window.visualViewport) visualViewport.addEventListener('resize', pedirLayout);
  // audio tras el primer gesto
  const primerGesto = () => { A.iniciar(); A.reanudar(); };
  document.addEventListener('pointerdown', primerGesto, true);
  document.addEventListener('touchend', primerGesto, true);

  // ---------- modo demo (captura de la portada) ----------
  function demo() {
    document.body.classList.add('demo');
    const ids = s => s.map(R.piezaDe);
    const p = crearPartida({ modo: 'diaria', n: 1, fecha: hoy(), code: 'JUNTO:v:a', par: 9, ga: ids(['ocG', 'tvG', 'saP']), gr: ids(['svP', 'ocG', 'oaG']), nivel: 3 });
    const fr = R.compilar('JUNTO:v:a');
    const add = (s, tp) => { const x = ids(s); p.registro.push({ p: x, a: fr(x, x.length) ? 1 : 0, t: tp || 'e' }); };
    add(['svP', 'oaG', 'ocG']); add(['scP', 'oaG', 'ocG']); add(['tvP', 'saG']); add(['tcP', 'saG']);
    add(['saG', 'tcG', 'ovP'], 'c'); add(['oaP', 'ovG', 'ocP', 'scG']); add(['ovG', 'ocP', 'taP']); add(['ovG', 'taP']);
    add(['tvG', 'tvP', 'scG']); add(['saP', 'tvG']);
    p.seq = 'ARARXAARRA'; p.bandeja = ids(['ovP', 'taG', 'scP']);
    perfil.tutorial = perfil.tutorial || 'hecho';
    entrarJuego(p);
    el.saltar.hidden = true;
    setTimeout(() => {
      S.poner(sonda, 'acepta', ahora());
      sonda.abierto = 0.9; sonda.nucleo = [0, 242, 207];
      const c = centroSonda(), d = document.createElement('div'); d.className = 'vuela';
      d.innerHTML = filaHTML(ids(['ovP', 'taG', 'scP'])); const s = 30;
      d.style.cssText = 'width:' + s * 3 + 'px;height:' + s + 'px;transform:translate(' + (c.x - 130) + 'px,' + (c.y + 60) + 'px) rotate(-8deg);opacity:.9';
      el.vuelo.appendChild(d);
    }, 400);
  }

  // ---------- gancho de pruebas ----------
  window.SENAL = {
    estado: () => ({ pantalla, partida: partida ? JSON.parse(JSON.stringify(partida)) : null, secreta: codeSecreta, panelAbierto, ocupado, horiz, modal: !el.velo.hidden, tutorial: { activo: Tut.activo, r: Tut.r, paso: Tut.paso }, perfil: JSON.parse(JSON.stringify(perfil)), stats: JSON.parse(JSON.stringify(stats)), ajustes: Object.assign({}, aj) }),
    nuevaPartida(o) {
      o = o || {};
      if (o.modo === 'diaria') { jugarDiaria(o.fecha || hoy()); return this.estado(); }
      const code = R.normal(o.regla || elegirPractica().code), g = regalosRapidos(code);
      const p = crearPartida({ modo: o.modo === 'tutorial' ? 'tutorial' : 'practica', code, par: o.par || 8, ga: o.ga || g[0], gr: o.gr || g[1], tut: o.tut });
      entrarJuego(p); return this.estado();
    },
    async enviar(ids) { if (ids) { partida.bandeja = ids.slice(); partida.sel = -1; renderBandeja(); } await enviar(); await espera(50); return partida.registro[partida.registro.length - 1]; },
    async formular(code) {
      if (!panelAbierto) abrirPanel();
      partida.borrador = borradorDesde(code); renderPanel();
      const coh = coherencia(); if (!coh || coh.some(x => !x)) return { coherente: false, coh };
      const antes = partida.fallos;
      await transmitir();
      return { coherente: true, acierto: partida.estado === 'resuelta', fallo: partida.fallos > antes, contra: partida.fallos > antes ? partida.registro[partida.registro.length - 1] : null };
    },
    copiar: i => copiar(i),
    abrirPanel, cerrarPanel, abrirPausa, cerrarModal, abrirAjustes, abrirArchivo, abrirStats, abrirComo, irInicio, jugarDiaria, jugarPractica,
    evaluar: (code, ids) => R.evaluar(code, ids),
    equivalentes: (a, b) => V.equivalentes(a, b),
    contraejemplo: (a, b, registro) => V.comparar(a, b, registro || []).contra,
    get banco() { return banco(); }, get calendario() { return calendario(); },
    fechaJuego: () => hoy(), forzarFecha: f => { fechaForzada = f; renderInicio(); },
    saltarTutorial: () => Tut.saltar(), tutorial: Tut, textoCompartir: () => partida && textoCompartir(partida),
    audio: A, layout
  };

  // ---------- idioma en vivo ----------
  // Repinta todo lo visible sin tocar la partida: textos fijos, paleta, bandeja, registro, HUD, panel, inicio y tutorial.
  function repintarIdioma() {
    el.vivo.textContent = ''; // el último aviso leído quedó en el idioma anterior
    aplicarIdioma(); renderPaleta(); renderBandeja(); renderRegistro(); actualizarHud(false);
    if (panelAbierto) renderPanel();
    renderInicio(); Tut.refrescar();
  }
  window.addEventListener('jet-idioma', repintarIdioma);
  el.inicio.addEventListener('click', e => {
    const b = e.target.closest('.ini-idioma button[data-lang]'); if (!b) return;
    e.stopPropagation(); A.sfx('ui'); JI.set(b.dataset.lang);
  }, true);

  // ---------- arranque ----------
  aplicarIdioma(); aplicarAjustes();
  renderPaleta(); renderInicio(); layout();
  crearWorker();
  rafJuego = requestAnimationFrame(bucleJuego);
  const arrancar = () => {
    if (qs.has('demo')) { demo(); return; }
    const activa = st.get('activa', null);
    if (activa) {
      const p = typeof activa === 'string' ? leerPartida(activa) : null;
      if (p && p.rx && p.estado === 'jugando') {
        if (p.modo === 'tutorial') { Tut.retomar(p); abrirPausa(); return; }
        entrarJuego(p, true); return;
      }
    }
    if (qs.get('regla')) { perfil.tutorial = perfil.tutorial || 'saltado'; jugarPractica(true); return; }
    mostrar('inicio');
  };
  arrancar();
  setTimeout(() => { el.btnFs.hidden = !puedeFs() || pantalla !== 'inicio'; }, 0);
  // SRC-G05: el juego quedó listo; el estado de carga del HTML pasa a «listo» (loading/error/ready excluyentes)
  if (window.JETCarga) window.JETCarga.listo();
})();
