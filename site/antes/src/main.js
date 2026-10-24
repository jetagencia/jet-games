// JET//Antes · juego. Reglas: src/reglas.js (copia literal del núcleo verificado del diseño).
import { compile, initState, derive, step } from './reglas.js';
import NIVELES from './niveles.js';
import { T } from './textos.js';
import { AUDIO } from './audio.js';
import { crearVista, miniatura, COLOR_ECO, COLOR_AURORA, easeOut } from './render.js';
import { fechaLocal, numeroReto, respaldo, generarDiario, sumarDias } from './diario.js';
import { drawAstro, setTS } from './astro.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const QS = new URLSearchParams(location.search);
const REDUCIDO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAX_COPIAS = 6;
const DEMO = new URLSearchParams(location.search).has('demo');
const POR_ID = Object.fromEntries(NIVELES.map((n) => [n.id, n]));

// ───────────────────────── guardado ─────────────────────────
const K = { prog: 'jet-antes:v1:progreso', aj: 'jet-antes:v1:ajustes', partida: 'jet-antes:v1:partida', diario: 'jet-antes:v1:diario', visto: 'jet-antes:v1:visto', met: 'jet-antes:v1:metricas' };
let puedeGuardar = true;
try { localStorage.setItem('jet-antes:test', '1'); localStorage.removeItem('jet-antes:test'); } catch { puedeGuardar = false; }
function leer(k, def) { try { const v = localStorage.getItem(k); if (v == null) return def; const j = JSON.parse(v); return (j && typeof j === 'object' && def && typeof def === 'object' && !Array.isArray(def)) ? Object.assign(structuredClone(def), j) : j; } catch { return def; } }
function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function borrar(k) { try { localStorage.removeItem(k); } catch {} }

// Idioma: uno solo para todo jetgames.fun (src/jet-idioma.js: ?lang > cookie jet_lang > navegador).
const AJ = leer(K.aj, { music: true, musicVol: 70, sfx: true, sfxVol: 85, vib: true, zurdo: false, vistaPrevia: true, velocidad: 'normal', hc: false, aurora: true, trail: true, largo: true });
(function migrarIdioma() { // una sola vez: el idioma que el juego guardaba por su cuenta pasa a la elección común
  const propio = AJ.lang; delete AJ.lang;
  let comun = /(?:^|;\s*)jet_lang=(es|en)(?![a-z])/.test(document.cookie);
  if (!comun) { try { comun = !!localStorage.getItem('jet_lang'); } catch {} }
  if (!comun && !QS.get('lang') && (propio === 'es' || propio === 'en')) window.JETIdioma.set(propio);
  if (propio !== undefined) guardar(K.aj, AJ); // el idioma ya no se guarda aquí
})();
Object.defineProperty(AJ, 'lang', { get: () => window.JETIdioma.get(), enumerable: false });
const PROG = leer(K.prog, { niveles: {}, saltos: {} });
const DIARIO = leer(K.diario, { dias: {}, racha: 0, mejorRacha: 0, ultimaFecha: null });
const VISTO = leer(K.visto, {});
const MET = leer(K.met, { acciones: 0, rechazos: 0, deshacer: 0, rebobinados: 0, pistas: 0, saltos: 0, primerAjaMs: null, inicioJugarMs: null });
const guardarProg = () => guardar(K.prog, PROG), guardarAj = () => guardar(K.aj, AJ), guardarVisto = () => guardar(K.visto, VISTO), guardarMet = () => guardar(K.met, MET);

// ───────────────────────── textos ─────────────────────────
const tx = (k, v = {}) => { let s = (T[AJ.lang] && T[AJ.lang][k]) ?? T.es[k] ?? k; for (const n in v) s = s.split('{' + n + '}').join(v[n]); return s; };
// fecha del reto en el idioma elegido («22 de octubre» / «October 22»), sin depender de la zona horaria
const fechaTxt = (f) => { try { const [a, m, d] = f.split('-').map(Number); return new Intl.DateTimeFormat(AJ.lang === 'es' ? 'es' : 'en', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(Date.UTC(a, m - 1, d)); } catch { return f; } };
const nombreNivel = (lv) => lv.diario ? tx('daily.today', { n: lv.reto, fecha: fechaTxt(lv.fecha) }) : lv.id + ' · ' + lv.nombre[AJ.lang];
function aplicarTextos() {
  document.documentElement.lang = AJ.lang;
  document.title = tx('meta.title');
  const md = $('#metaDesc'); if (md) md.setAttribute('content', tx('meta.desc'));
  pintarIdioma();
  $$('[data-t]').forEach((e) => { e.textContent = tx(e.dataset.t); });
  $$('[data-ta]').forEach((e) => { e.setAttribute('aria-label', tx(e.dataset.ta)); e.title = tx(e.dataset.ta); });
  $('#ctlTxt').textContent = tactil ? tx('how.ctlTouch') + ' ' + tx('how.ctlKeys') : tx('how.ctlKeys') + ' ' + tx('how.ctlTouch');
  $('#ladoKeys').innerHTML = AJ.lang === 'es'
    ? '<kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd> moverte<br><kbd>Espacio</kbd> esperar · <kbd>Z</kbd> deshacer<br><kbd>R</kbd> sostenida: rebobinar<br><kbd>Tab</kbd> ver el futuro · <kbd>P</kbd> pausa'
    : '<kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd> move<br><kbd>Space</kbd> wait · <kbd>Z</kbd> undo<br>Hold <kbd>R</kbd>: rewind<br><kbd>Tab</kbd> see the future · <kbd>P</kbd> pause';
  refrescarInicio();
  if (J) { hudNivel(); actualizarHud(); }
}

// ───────────────────────── dispositivo ─────────────────────────
let tactil = matchMedia('(pointer: coarse)').matches;
document.body.classList.toggle('tactil', tactil);
addEventListener('touchstart', () => { if (!tactil) { tactil = true; document.body.classList.add('tactil'); layout(); } }, { passive: true, capture: true });
const vibrar = (p) => { if (AJ.vib && navigator.vibrate) try { navigator.vibrate(p); } catch {} };
const fsAPI = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
const enFS = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function alternarFS() {
  try {
    if (enFS()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else { const el = document.documentElement; const r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' }); if (r && r.catch) r.catch(() => {}); }
  } catch {}
}
if (!fsAPI) { $('#bFullMenu').style.display = 'none'; $('#filaFull').style.display = 'none'; }
if (!navigator.vibrate) $('#filaVib').style.display = 'none';

// ───────────────────────── audio ─────────────────────────
function audioPrefs() { AUDIO.set({ music: AJ.music, musicVol: AJ.musicVol / 100, sfx: AJ.sfx, sfxVol: AJ.sfxVol / 100 }); AUDIO.largo(estrellasTotales() >= 90 && AJ.largo); }
function gesto() { if (AUDIO.init()) { audioPrefs(); AUDIO.reanudar(); } }
addEventListener('pointerdown', gesto, { capture: true }); addEventListener('keydown', gesto, { capture: true });
const sfx = (n, o) => AUDIO.sfx(n, o);

// ───────────────────────── progreso ─────────────────────────
const estrellasNivel = (id) => (PROG.niveles[id] && PROG.niveles[id].estrellas) || 0;
function estrellasTotales() { let s = 0; for (const n of NIVELES) s += estrellasNivel(n.id); return s; }
const hecho = (id) => !!(PROG.niveles[id] && PROG.niveles[id].hecho);
const saltado = (id) => !!(PROG.niveles[id] && PROG.niveles[id].saltado && !PROG.niveles[id].hecho);
const nivelesCap = (c) => NIVELES.filter((n) => n.cap === c);
const hechosCap = (c) => nivelesCap(c).filter((n) => hecho(n.id)).length;
let todoAbierto = false;
function capAbierto(c) { return todoAbierto || c === 1 || hechosCap(c - 1) >= 6; }
function nivelAbierto(id) {
  if (todoAbierto) return true;
  const n = POR_ID[id]; if (!capAbierto(n.cap)) return false;
  const lista = nivelesCap(n.cap); const i = lista.indexOf(n);
  return i === 0 || hecho(lista[i - 1].id) || saltado(lista[i - 1].id) || hecho(id);
}
function siguientePendiente() {
  for (const n of NIVELES) if (nivelAbierto(n.id) && !hecho(n.id) && !saltado(n.id)) return n;
  for (const n of NIVELES) if (nivelAbierto(n.id) && !hecho(n.id)) return n;
  return null;
}
const saltosUsados = (c) => PROG.saltos[c] || 0;

// ───────────────────────── vista y bucle de dibujo ─────────────────────────
const cv = $('#cv');
const V = crearVista(cv);
let J = null;          // partida en curso
let pantalla = 'inicio';
let fondo = null;      // escena viva del inicio
let ultimoT = performance.now();
let rectSala = { x: 0, y: 0, w: 100, h: 100 };

function layout() {
  const W = innerWidth, H = innerHeight;
  const vv = window.visualViewport; const vw = vv ? vv.width : W, vh = vv ? vv.height : H;
  const cs = getComputedStyle(document.documentElement);
  const sa = { t: parseFloat(cs.getPropertyValue('--sat')) || 0, b: parseFloat(cs.getPropertyValue('--sab')) || 0, l: parseFloat(cs.getPropertyValue('--sal')) || 0, r: parseFloat(cs.getPropertyValue('--sar')) || 0 };
  // los env() no se resuelven en getPropertyValue: los medimos con un elemento sonda
  const sonda = document.getElementById('sonda') || (() => { const d = document.createElement('div'); d.id = 'sonda'; d.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)'; document.body.appendChild(d); return d; })();
  const ps = getComputedStyle(sonda); sa.t = parseFloat(ps.paddingTop) || 0; sa.r = parseFloat(ps.paddingRight) || 0; sa.b = parseFloat(ps.paddingBottom) || 0; sa.l = parseFloat(ps.paddingLeft) || 0;
  const ancho = Math.min(W, vw), alto = Math.min(H, vh);
  const top = 56 + sa.t;
  const sala = $('#sala'), barra = $('#barra'), ctrl = $('#ctrl'), lado = $('#lado'), acc = $('#acc'), pad = $('#pad');
  const padSz = ancho < 360 ? 56 : (ancho >= 700 && alto >= 700 ? 68 : 64);
  document.documentElement.style.setProperty('--pad', padSz + 'px');
  const padW = padSz * 3 + 16;
  const modo = (ancho >= 900 && alto >= 560) ? 'ancho' : (ancho > alto ? 'horizontal' : 'vertical');
  document.body.dataset.modo = modo;
  const G = 16;
  const set = (el, o) => { for (const k in o) el.style[k] = typeof o[k] === 'number' ? o[k] + 'px' : o[k]; };
  lado.style.display = 'none'; acc.style.flexDirection = 'column'; ctrl.style.display = 'flex'; ctrl.style.flexDirection = ''; ctrl.style.alignItems = '';
  for (const b of ['#bDeshacer', '#bEsperar', '#bRebobinar']) $(b).style.width = '';
  if (modo === 'vertical') {
    const ctrlH = padW; const barraH = 56;
    const yCtrl = alto - sa.b - 12 - ctrlH;
    set(ctrl, { left: G + sa.l, right: G + sa.r, top: yCtrl, bottom: 'auto', width: 'auto', height: ctrlH });
    const accW = Math.max(88, Math.min(150, ancho - 2 * G - sa.l - sa.r - padW - 12));
    for (const b of ['#bDeshacer', '#bEsperar', '#bRebobinar']) $(b).style.width = accW + 'px';
    set(barra, { left: G + sa.l, right: G + sa.r, top: yCtrl - barraH - 8, height: barraH, width: 'auto' });
    rectSala = { x: G + sa.l, y: top + 30, w: ancho - 2 * G - sa.l - sa.r, h: yCtrl - barraH - 8 - top - 38 };
  } else if (modo === 'horizontal') {
    const colW = Math.max(110, Math.min(150, ancho * 0.16));
    const ctrlTop = top + 4;
    set(ctrl, { left: G + sa.l, right: G + sa.r, top: ctrlTop, bottom: 'auto', height: alto - ctrlTop - sa.b - 12, width: 'auto' });
    ctrl.style.alignItems = 'flex-end';
    for (const b of ['#bDeshacer', '#bEsperar', '#bRebobinar']) $(b).style.width = colW + 'px';
    document.documentElement.style.setProperty('--colw', colW + 'px');
    const izq = G + sa.l + colW + 16, der = ancho - (G + sa.r + padW + 16);
    const barraH = 48;
    set(barra, { left: izq, right: ancho - der, top: alto - sa.b - 10 - barraH, height: barraH, width: 'auto' });
    rectSala = { x: izq, y: top, w: der - izq, h: alto - sa.b - 10 - barraH - 8 - top };
  } else {
    const panel = 300; const xPanel = ancho - sa.r - G - panel;
    set(lado, { position: 'absolute', display: 'block', left: xPanel, top: top + 8, width: panel, zIndex: 6 });
    lado.style.display = 'block';
    set(ctrl, { left: xPanel, right: 'auto', width: panel, top: 'auto', bottom: sa.b + 18, height: 'auto' });
    ctrl.style.alignItems = 'flex-end';
    if (!tactil) { pad.style.display = 'none'; acc.style.flexDirection = 'column'; for (const b of ['#bDeshacer', '#bEsperar', '#bRebobinar']) $(b).style.width = panel + 'px'; }
    else { pad.style.display = ''; ctrl.style.flexDirection = 'column'; ctrl.style.alignItems = 'center'; acc.style.flexDirection = 'row'; for (const b of ['#bDeshacer', '#bEsperar', '#bRebobinar']) $(b).style.width = ((panel - 16) / 3) + 'px'; }
    const barraH = 56;
    set(barra, { left: G + sa.l, right: ancho - xPanel + 24, top: alto - sa.b - 18 - barraH, height: barraH, width: 'auto' });
    rectSala = { x: G + sa.l + 8, y: top + 8, w: xPanel - 24 - G - sa.l - 16, h: alto - sa.b - 18 - barraH - 16 - top - 8 };
  }
  if (modo !== 'ancho' || tactil) pad.style.display = '';
  set(sala, { left: rectSala.x, top: rectSala.y, width: rectSala.w, height: rectSala.h });
  // la línea de tiempo con su densidad de píxeles
  const tl = $('#tl'); const dpr = Math.min(3, devicePixelRatio || 1); tl.width = Math.max(10, Math.round(tl.clientWidth * dpr)); tl.height = Math.round(tl.clientHeight * dpr);
  ajustarVista();
  dibujarLinea();
}
function ajustarVista() {
  if (J) V.ajustar(J.lv, rectSala, { cap: J.lv.cap, permitirGiro: true, nPuertas: J.st.doors.length });
  else if (fondo) V.ajustar(fondo.lv, rectFondo(), { cap: fondo.lv.cap, nPuertas: fondo.st.doors.length });
  if (J) hudNivel();
}
function rectFondo() { const W = innerWidth, H = innerHeight; if (DEMO) return { x: W * 0.03, y: H * 0.34, w: W * 0.94, h: H * 0.62 }; return { x: -W * 0.1, y: H * 0.05, w: W * 1.2, h: H * 0.9 }; }
let pendienteLayout = 0;
function pedirLayout() { cancelAnimationFrame(pendienteLayout); pendienteLayout = requestAnimationFrame(() => { layout(); }); }
addEventListener('resize', pedirLayout);
addEventListener('orientationchange', () => { pedirLayout(); setTimeout(layout, 250); });
if (window.visualViewport) visualViewport.addEventListener('resize', pedirLayout);

// ───────────────────────── simulación de la partida ─────────────────────────
// J = { lv, st, recs:[], cur:'', hist:[paso], fut:[paso], fin, ... }; paso = { s, mov:Set, push:Set, bump:Set, desv:[] }
function nuevoJuego(lv) {
  const st = compile({ map: lv.mapa, N: lv.N, heavy: lv.heavy, lasers: lv.lasers, plats: lv.plats });
  return { lv, st, recs: [], cur: '', hist: null, fut: [], fin: false, inicio: Date.now(), reinicios: 0, vistaT: null, cola: [], anim: null, facing: [], usoVista: false, empujes: 0 };
}
const nA = () => J.recs.length + 1;
function accionesEn(t, cur) { const a = J.recs.map((r) => r[t] || 'W'); a.push(cur); return a; }
function pasoSim(s, n, acts, jugador) {
  const st = J.st, dv0 = derive(st, s, n);
  const r = step(st, s, n, acts, jugador, dv0);
  if (!r) return null;
  const mov = new Set(), push = new Set(), bump = new Set();
  for (let i = 0; i < n; i++) {
    if (s[i] < 0 || acts[i] === 'W' || acts[i] === undefined) continue;
    if (r.bumped.includes(i)) {
      const W = st.W, x = s[i] % W, y = (s[i] / W) | 0, d = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }[acts[i]];
      const c = (y + d[1]) * W + x + d[0]; const di = st.doorAt[c];
      const cajaDelante = (() => { for (let j = 0; j < st.boxes0.length; j++) if (s[n + j] === c) return true; return false; })();
      if ((di >= 0 && !dv0.open[di]) || cajaDelante) push.add(i); else bump.add(i);
    } else if (r.s[i] !== s[i]) mov.add(i);
  }
  return { s: r.s, win: r.win, mov, push, bump, desv: r.vanished, acts };
}
function simular() { // reconstruye la historia del bucle actual desde las grabaciones
  const n = nA(); const hist = [{ s: initState(J.st, n), mov: new Set(), push: new Set(), bump: new Set(), desv: [] }];
  let cur = '';
  for (let t = 0; t < J.cur.length; t++) {
    const p = pasoSim(hist[t].s, n, accionesEn(t, J.cur[t]), n - 1);
    if (!p) break; hist.push(p); cur += J.cur[t];
    if (p.win) break;
  }
  J.cur = cur; J.hist = hist;
  calcularFacing(); calcularFuturo();
}
function calcularFacing() {
  const n = nA(); J.facing = new Array(n).fill('D');
  for (let i = 0; i < n; i++) { const r = i < J.recs.length ? J.recs[i].slice(0, J.cur.length) : J.cur; for (const a of r) if (a !== 'W') J.facing[i] = a; }
}
// futuro si te quedas quieto (vista previa, flechas de los ecos, marcas de la línea de tiempo)
function calcularFuturo() {
  const n = nA(); let s = J.hist[J.hist.length - 1].s; const fut = []; let quitado = false;
  for (let t = J.cur.length; t < J.lv.N; t++) {
    let p = pasoSim(s, n, accionesEn(t, 'W'), n - 1);
    if (!p) { const s2 = s.slice(); s2[n - 1] = -1; quitado = true; p = pasoSim(s2, n, accionesEn(t, 'W'), n - 1); }
    if (!p) break; p.sinJugador = quitado; fut.push(p); s = p.s;
  }
  J.fut = fut;
}
function hacer(a, origen) {
  if (!J || J.fin || pausado() || J.modoRep) return;
  if (J.anim) { if (J.cola.length < 3) J.cola.push(a); return; }
  J.vistaT = null;
  const t = J.cur.length;
  if (t >= J.lv.N) { avisar(tx(nA() >= MAX_COPIAS ? 'why.max' : 'why.loopEnd'), 'mal'); return; }
  const n = nA(); const prev = J.hist[t];
  const p = pasoSim(prev.s, n, accionesEn(t, a), n - 1);
  MET.acciones++;
  if (!p) { rechazar(a, prev); return; }
  J.cur += a; J.hist.push(p);
  if (a !== 'W') J.facing[n - 1] = a;
  for (let i = 0; i < J.recs.length; i++) { const e = J.recs[i][t]; if (e && e !== 'W') J.facing[i] = e; }
  calcularFuturo();
  efectosDePaso(prev, p, a);
  J.anim = { tipo: 'paso', t0: performance.now(), dur: durPaso(), s0: prev.s, s1: p.s, mov: p.mov, push: p.push, bump: p.bump, desv: p.desv };
  guardarPartida();
  tutorialTrasPaso(prev, p, a);
  actualizarHud();
  if (p.win) { J.fin = true; J.anim.alTerminar = () => victoria(); }
  else if (J.cur.length >= J.lv.N) J.anim.alTerminar = () => finDeBucle();
}
const durPaso = () => AJ.velocidad === 'rapida' ? 90 : 160;
function rechazar(a, prev) {
  MET.rechazos++;
  const st = J.st, n = nA(), W = st.W; const yo = prev.s[n - 1];
  let motivo = 'why.laser', celda = yo;
  if (a !== 'W') {
    const d = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }[a]; const x = yo % W + d[0], y = ((yo / W) | 0) + d[1];
    celda = (x < 0 || y < 0 || x >= W || y >= st.H) ? -1 : y * W + x;
    // estado tras mover los ecos (para saber si «hay alguien ahí»)
    const pe = pasoSim(prev.s, n, accionesEn(J.cur.length, 'W'), n - 1);
    const s2 = pe ? pe.s : prev.s; const dv = derive(st, prev.s, n);
    if (celda < 0 || st.kind[celda] === 1) motivo = 'why.wall';
    else if (st.kind[celda] === 2 && dv.platAt[celda] < 0) motivo = 'why.void';
    else if (celda !== st.start && Array.from(s2.slice(0, n - 1)).includes(celda)) motivo = 'why.busy';
    else if (dv.beam[celda]) motivo = 'why.laser';
    else if (st.boxes0.some((_, j) => s2[n + j] === celda)) motivo = 'why.box';
  }
  avisar(tx(motivo), 'mal');
  sfx('rechazo'); vibrar(40);
  const fx = celda >= 0 ? celda : yo;
  J.flash = { x: fx % W, y: (fx / W) | 0, t0: performance.now() };
  J.sacudida = { t0: performance.now(), dx: a === 'L' ? -1 : a === 'R' ? 1 : 0, dy: a === 'U' ? -1 : a === 'D' ? 1 : 0 };
  if (V.rot && J.sacudida) { const { dx, dy } = J.sacudida; J.sacudida.dx = -dy; J.sacudida.dy = dx; }
}
function efectosDePaso(prev, p, a) {
  const st = J.st, n = nA(), W = st.W, jug = n - 1;
  const pan = (c) => c < 0 ? 0 : ((c % W) / Math.max(1, W - 1) - 0.5) * 1.2;
  const dv0 = derive(st, prev.s, n), dv1 = derive(st, p.s, n);
  if (a === 'W') sfx('esperar');
  else if (p.mov.has(jug)) { sfx('paso', { pan: pan(p.s[jug]) }); V.emitir(p.s[jug] % W, (p.s[jug] / W) | 0, 4, '#b5a8d8', { vel: 0.3, vida: 0.35, dy: 0.3, reducido: REDUCIDO }); }
  else if (p.push.has(jug)) { sfx('empujaPuerta', { pan: pan(prev.s[jug]) }); J.empujes++; }
  let ecoPaso = 0, ecoPan = 0; for (const i of p.mov) if (i !== jug) { ecoPaso++; ecoPan += pan(p.s[i]); }
  if (ecoPaso) sfx('paso', { eco: true, pan: ecoPan / ecoPaso });
  // recompensa de ★ 60: rastro de partículas de los ecos
  if (AJ.trail && estrellasTotales() >= 60) for (const i of p.mov) if (i !== jug && prev.s[i] >= 0) V.emitir(prev.s[i] % W, (prev.s[i] / W) | 0, 5, colEco(i), { vel: 0.25, vida: 0.7, r: 0.035, reducido: REDUCIDO });
  for (const i of p.push) if (i !== jug) { sfx('empujaPuerta', { eco: true, pan: pan(prev.s[i]) }); break; }
  // cajas
  const nb = st.boxes0.length;
  for (let j = 0; j < nb; j++) if (prev.s[n + j] !== p.s[n + j]) {
    const c = p.s[n + j]; const enCarga = st.heavy.some((h, k) => h && st.plates[k].includes(c));
    sfx(enCarga ? 'cajaCarga' : 'caja', { pan: pan(c) }); vibrar(12);
    const d = c - prev.s[n + j]; J.empujon = { t0: performance.now(), d: [Math.sign(d % W === 0 ? 0 : d), Math.abs(d) >= W ? Math.sign(d) : 0] };
  }
  // placas, puertas, láseres
  let placaOn = false, placaOff = false;
  for (let k = 0; k < 4; k++) { if (dv1.pk[k] && !dv0.pk[k]) placaOn = true; if (!dv1.pk[k] && dv0.pk[k]) placaOff = true; }
  if (placaOn) { sfx('placaOn'); vibrar(20); } else if (placaOff) sfx('placaOff');
  const cambios = [];
  st.doors.forEach((d, j) => { if (dv1.open[j] !== dv0.open[j]) cambios.push({ d, ab: !!dv1.open[j] }); });
  if (cambios.length) sfx(cambios.some((c) => c.ab) ? 'puertaAbre' : 'puertaCierra');
  const laserN = (dv) => st.emitters.filter((e) => !(e.off >= 0 && dv.pk[e.off])).length;
  const l0 = laserN(dv0), l1 = laserN(dv1); if (l1 < l0) sfx('laserOff'); else if (l1 > l0) sfx('laserOn');
  AUDIO.zumbido(l1);
  // plataformas
  const np = st.plats.length; let mueve = false; for (let j = 0; j < np; j++) if (prev.s[n + nb + j] !== p.s[n + nb + j]) mueve = true;
  if (mueve) { AUDIO.motor(true); setTimeout(() => AUDIO.motor(false), durPaso() + 40); }
  // ecos que se desvanecen
  for (const i of p.desv) { const c = prev.s[i]; const col = colEco(i); V.emitir(c % W, (c / W) | 0, 24, col, { sube: true, vida: 0.6, reducido: REDUCIDO }); sfx('desvanece', { pan: pan(c) }); anunciar(tx('a11y.vanish')); }
  // lector de pantalla: solo cambios relevantes
  let msg = tx('a11y.second', { t: J.cur.length, N: J.lv.N });
  for (const c of cambios) msg += ' ' + tx(c.ab ? 'a11y.doorOpen' : 'a11y.doorClosed', { d: 'ABCD'[c.d.key] });
  anunciar(msg);
  AUDIO.tension(J.lv.N - J.cur.length <= 3 && J.cur.length > 0);
}
const colEco = (i) => (AJ.aurora && estrellasTotales() >= 30 ? COLOR_AURORA : COLOR_ECO)[i % 6];
let vivoT = 0; function anunciar(s) { clearTimeout(vivoT); vivoT = setTimeout(() => { $('#vivo').textContent = s; }, 50); }

function deshacer() {
  if (!J || J.fin || pausado() || J.modoRep) return;
  if (J.anim) return;
  J.vistaT = null;
  if (J.cur.length > 0) { const prev = J.hist[J.hist.length - 1]; J.cur = J.cur.slice(0, -1); J.hist.pop(); calcularFacing(); calcularFuturo(); J.anim = { tipo: 'paso', t0: performance.now(), dur: durPaso() * 0.8, s0: prev.s, s1: J.hist[J.hist.length - 1].s, mov: prev.mov, push: new Set(), bump: new Set(), desv: [] }; sfx('ui'); }
  else if (J.recs.length > 0) { J.cur = J.recs.pop(); simular(); AUDIO.capas(nA()); sfx('rebobinar'); J.anim = { tipo: 'fundido', t0: performance.now(), dur: 260 }; }
  else return;
  MET.deshacer++; guardarPartida(); actualizarHud(); AUDIO.tension(false);
}
function rebobinar(auto) {
  if (!J || J.fin || pausado() || J.modoRep || J.anim) return;
  if (J.cur.length === 0) { avisar(tx('why.empty'), 'mal'); sfx('rechazo'); return; }
  if (nA() >= MAX_COPIAS) { avisar(tx('why.max'), 'mal'); sfx('rechazo'); return; }
  J.vistaT = null;
  const hist = J.hist.slice();
  J.anim = { tipo: 'rebobinar', t0: performance.now(), dur: REDUCIDO ? 250 : 900, hist };
  J.anim.alTerminar = () => {
    J.recs.push(J.cur); J.cur = ''; simular();
    AUDIO.capas(nA()); sfx('ecoNuevo', { k: nA() - 2 });
    const W = J.st.W; V.emitir(J.st.start % W, (J.st.start / W) | 0, 18, colEco(nA() - 2), { vida: 0.7, reducido: REDUCIDO });
    MET.rebobinados++; guardarPartida(); guardarMet(); actualizarHud();
    anunciar(tx('a11y.rewind', { k: nA() }));
    tutorialTrasRebobinar();
  };
  sfx('rebobinar'); AUDIO.rebobinado(); AUDIO.tension(false);
}
function finDeBucle() {
  if (nA() >= MAX_COPIAS) { avisar(tx('why.max'), 'mal'); return; }
  setTimeout(() => { if (J && !J.fin && !J.anim && J.cur.length >= J.lv.N && !pausado()) rebobinar(true); }, 260);
}
let confReinicio = 0;
function reiniciarNivel(confirmado) {
  if (!J) return;
  const n = J.recs.length + (J.cur.length ? 1 : 0);
  if (!confirmado && n > 0 && Date.now() - confReinicio > 4000) {
    confReinicio = Date.now(); $('#txtReiniciar').textContent = n > 1 ? tx('restart.confirm', { n }) : tx('restart.confirm1');
    avisar(n > 1 ? tx('restart.confirm', { n }) : tx('restart.confirm1'));
    setTimeout(() => { $('#txtReiniciar').textContent = tx('btn.restart'); }, 4000);
    return false;
  }
  confReinicio = 0; $('#txtReiniciar').textContent = tx('btn.restart');
  const reinicios = J.reinicios + 1, inicio = J.inicio;
  cargarNivel(J.lv, { reinicios, inicio });
  return true;
}

// ───────────────────────── carga de niveles ─────────────────────────
function cargarNivel(lv, o = {}) {
  // una repetición o solución en curso (p. ej. pausa automática → Reiniciar) no debe dejar los controles ocultos
  $('#modoRep').classList.remove('on'); $('#ctrl').style.visibility = '';
  J = nuevoJuego(lv);
  if (o.reinicios) J.reinicios = o.reinicios; if (o.inicio) J.inicio = o.inicio;
  if (o.recs) J.recs = o.recs.slice(0, MAX_COPIAS - 1);
  if (o.cur) J.cur = o.cur;
  simular();
  mostrarJuego();
  layout();
  V.puertas = []; V.laser = [];
  AUDIO.tema('juego'); AUDIO.capitulo(lv.cap || 5); AUDIO.capas(nA()); AUDIO.tension(false);
  AUDIO.zumbido(J.st.emitters.length ? 1 : 0);
  hudNivel(); actualizarHud(); guardarPartida();
  tutorialAlCargar();
  if (!lv.diario && lv.id.endsWith('-1') && !VISTO['log' + lv.cap] && !o.recs) { VISTO['log' + lv.cap] = 1; guardarVisto(); setTimeout(() => avisar('— ' + tx('log.' + lv.cap + '.in'), 'tut', 4200), 400); }
}
function guardarPartida() {
  if (!J) return;
  if (J.fin) { borrar(K.partida); return; }
  guardar(K.partida, { nivel: J.lv.id, grabaciones: J.recs, actual: J.cur, t: J.cur.length, reinicios: J.reinicios, inicio: J.inicio });
}
function hudNivel() {
  if (!J) return;
  $('#nomNivel').innerHTML = '';
  const s = document.createElement('span'); s.textContent = nombreNivel(J.lv);
  $('#nomNivel').appendChild(s);
  if (V.rot) { const r = document.createElement('i'); r.className = 'rot'; r.textContent = '⟳'; r.title = tx('hud.rotated'); $('#nomNivel').appendChild(r); }
}
function actualizarHud() {
  if (!J) return;
  const n = nA();
  const cop = $('#copias'); cop.innerHTML = '';
  for (let i = 0; i < n; i++) { const d = document.createElement('i'); d.style.background = i === n - 1 ? '#f5f0ff' : colEco(i); cop.appendChild(d); }
  const nn = document.createElement('span'); nn.textContent = ' ' + n; cop.appendChild(nn);
  cop.title = tx('hud.copies') + ': ' + n;
  const r = $('#reloj'); r.innerHTML = String(J.cur.length).padStart(2, '0') + '<span> / ' + String(J.lv.N).padStart(2, '0') + '</span>';
  r.classList.toggle('tens', J.lv.N - J.cur.length <= 3 && J.cur.length > 0);
  r.setAttribute('aria-label', tx('hud.second', { t: J.cur.length, N: J.lv.N }));
  $('#bDeshacer').disabled = J.cur.length === 0 && J.recs.length === 0;
  $('#bRebobinar').disabled = J.cur.length === 0 || n >= MAX_COPIAS;
  // panel lateral
  const l = $('#ladoCopias'); l.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div'); d.className = 'co' + (i === n - 1 ? ' yo' : '');
    const c = document.createElement('i'); c.style.background = i === n - 1 ? '#f5f0ff' : colEco(i); d.appendChild(c);
    const sp = document.createElement('span'); sp.textContent = tx('hud.copy', { k: i + 1 }) + (i === n - 1 ? ' · ' + tx('hud.you') : ' · ' + (J.recs[i].length) + ' s'); d.appendChild(sp); l.appendChild(d);
  }
  dibujarLinea();
}

// ───────────────────────── línea de tiempo ─────────────────────────
function dibujarLinea() {
  const tl = $('#tl'); if (!J || !tl.width) return;
  const c = tl.getContext('2d'), dpr = Math.min(3, devicePixelRatio || 1), W = tl.width / dpr, H = tl.height / dpr;
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  const N = J.lv.N, pad = 10, paso = (W - pad * 2) / N, t = J.cur.length;
  const filas = J.recs.length; const baseY = H - 14; const fh = Math.min(7, (baseY - 6) / Math.max(1, filas + 1));
  // fondo
  c.fillStyle = 'rgba(20,12,40,.7)'; c.beginPath(); c.roundRect ? c.roundRect(0, 0, W, H, 12) : c.rect(0, 0, W, H); c.fill();
  c.strokeStyle = 'rgba(245,240,255,.1)'; c.lineWidth = 1; c.stroke();
  // pasado
  c.fillStyle = 'rgba(0,242,207,.14)'; c.fillRect(pad, baseY - 4, paso * t, 8);
  // marcas
  for (let k = 0; k <= N; k++) { const x = pad + k * paso; c.fillStyle = k === N ? 'rgba(255,68,102,.8)' : 'rgba(181,168,216,.45)'; c.fillRect(x - 0.5, baseY - (k % 5 === 0 ? 6 : 3), 1, k % 5 === 0 ? 12 : 6); }
  // filas de ecos
  for (let i = 0; i < filas; i++) {
    const y = 6 + i * fh + fh / 2, col = colEco(i), r = J.recs[i];
    c.fillStyle = col; c.globalAlpha = 0.25; c.fillRect(pad, y - 0.5, paso * Math.min(N, r.length), 1); c.globalAlpha = 1;
    for (let k = 0; k < r.length; k++) {
      if (r[k] === 'W') continue;
      const x = pad + (k + 0.5) * paso;
      // ¿empuja? (pasado: historia; futuro: previsión)
      const h = k < t ? J.hist[k + 1] : J.fut[k - t];
      const empuja = h && (h.push.has(i) || h.bump.has(i));
      c.fillStyle = col; c.globalAlpha = k < t ? 0.55 : 1;
      c.beginPath(); c.arc(x, y, Math.max(1.6, fh * 0.32), 0, 7); c.fill();
      if (empuja) { c.fillRect(x - 0.6, y - fh * 0.5, 1.2, fh); }
      c.globalAlpha = 1;
    }
  }
  // cursor
  const xc = pad + t * paso; c.fillStyle = '#f5f0ff'; c.fillRect(xc - 1, 2, 2, H - 4);
  c.beginPath(); c.moveTo(xc - 5, H - 2); c.lineTo(xc + 5, H - 2); c.lineTo(xc, H - 8); c.closePath(); c.fill();
  if (J.vistaT != null) { const xv = pad + J.vistaT * paso; c.fillStyle = '#00f2cf'; c.fillRect(xv - 1, 2, 2, H - 4); c.beginPath(); c.arc(xv, 6, 4, 0, 7); c.fill(); }
}
function tlAPos(e) { const r = $('#tl').getBoundingClientRect(); const pad = 10; const paso = (r.width - pad * 2) / J.lv.N; return Math.max(0, Math.min(J.lv.N, Math.round((e.clientX - r.left - pad) / paso))); }
function fijarVista(tv) {
  if (!J) return; const t = J.cur.length;
  if (!AJ.vistaPrevia && tv != null && tv > t) { /* la vista previa sigue disponible al arrastrar aunque las flechas estén apagadas */ }
  J.vistaT = (tv == null || tv <= t) ? null : Math.min(tv, t + J.fut.length);
  if (J.vistaT != null && !J.usoVista) { J.usoVista = true; if (tutActual === 'tut.preview' || tutActual === 'tut.previewKeys') cerrarTut(); VISTO.vista = 1; guardarVisto(); }
  dibujarLinea();
}
(() => {
  const tl = $('#tl'); let arr = false;
  tl.addEventListener('pointerdown', (e) => { if (!J || J.fin) return; arr = true; tl.setPointerCapture(e.pointerId); fijarVista(tlAPos(e)); sfx('ui'); });
  tl.addEventListener('pointermove', (e) => { if (arr) fijarVista(tlAPos(e)); });
  const fin = () => { if (arr) { arr = false; fijarVista(null); } };
  tl.addEventListener('pointerup', fin); tl.addEventListener('pointercancel', fin);
  tl.addEventListener('wheel', (e) => { if (!J) return; e.preventDefault(); const t = J.cur.length; const v = (J.vistaT ?? t) + (e.deltaY > 0 ? 1 : -1); fijarVista(v); }, { passive: false });
})();

// ───────────────────────── fotograma ─────────────────────────
function fotograma(ahora) {
  requestAnimationFrame(fotograma);
  try { cuadro(ahora); } catch (e) { console.error(e); if (J && J.anim) { const A = J.anim; J.anim = null; if (A.alTerminar) try { A.alTerminar(); } catch {} } }
}
function cuadro(ahora) {
  ahora = Math.max(ahora, performance.now() - 1);
  const dt = Math.min(50, ahora - ultimoT); ultimoT = ahora;
  const tm = ahora / 1000;
  if (J && pantalla === 'juego') dibujarJuego(ahora, dt, tm);
  else if (fondo) dibujarFondo(ahora, dt, tm);
}
function frameBase(s0, s1, p, n, jugador, extra) {
  return Object.assign({ st: J.st, s0, s1, p, nA: n, jugador, dv: derive(J.st, s1, n), facing: J.facing, movio: [], empujo: [], cap: J.lv.cap || 0,
    copias: n, hc: AJ.hc, aurora: AJ.aurora && estrellasTotales() >= 30, trail: true, reducido: REDUCIDO }, extra);
}
function dibujarJuego(ahora, dt, tm) {
  const n = nA(); let f;
  const A = J.anim;
  if (J.modoRep) { f = frameRepeticion(ahora, dt, tm); }
  else if (A && A.tipo === 'rebobinar') {
    const q = q01((ahora - A.t0) / A.dur);
    // recorre la historia al revés a velocidad creciente
    const L = A.hist.length - 1; const pos = L * (1 - Math.pow(q, 1.6)); const i = Math.floor(pos), fr = pos - i;
    const a = A.hist[Math.min(L, i + 1)].s, b = A.hist[i].s;
    f = frameBase(a, b, 1 - fr, n, n - 1, { rebobinar: q, saturacion: 1 - Math.sin(q * Math.PI) * 0.9, movio: arr(n, true) });
    if (q >= 1) terminarAnim();
  } else if (A && A.tipo === 'paso') {
    const q = q01((ahora - A.t0) / A.dur); const p = easeOut(q);
    const mv = arr(n, false), em = arr(n, false); for (const i of A.mov) mv[i] = true; for (const i of A.push) em[i] = true;
    f = frameBase(A.s0, A.s1, p, n, n - 1, { movio: mv, empujo: em, chispa: A.bump });
    if (A.desv.length) f.ocultos = new Set(A.desv);
    if (A.push.size) f.temblor = puertasEmpujadas(A.s0, A.push);
    if (q >= 1) terminarAnim();
  } else {
    const h = J.hist[J.hist.length - 1];
    if (J.vistaT != null && J.fut[J.vistaT - J.cur.length - 1]) {
      const fs = J.fut[J.vistaT - J.cur.length - 1].s;
      f = frameBase(fs, fs, 1, n, n - 1, { vista: true });
      if (J.fut[J.vistaT - J.cur.length - 1].sinJugador) f.ocultos = new Set([n - 1]);
    } else f = frameBase(h.s, h.s, 1, n, n - 1, {});
    if (A && A.tipo === 'fundido') { if (ahora - A.t0 >= A.dur) terminarAnim(); }
    if (A && A.tipo === 'victoria') {
      const q = q01((ahora - A.t0) / A.dur);
      f.ganar = easeOut(q);
      if (!REDUCIDO) { const W = J.st.W; const [ex, ey] = V.centro(J.st.exit % W, (J.st.exit / W) | 0); f.zoom = { x: ex, y: ey, k: 1 + 0.12 * easeOut(q) }; }
      if (q >= 1) terminarAnim();
    }
    // flechas del próximo movimiento de cada eco
    if (AJ.vistaPrevia && J.vistaT == null && !J.fin) {
      const t = J.cur.length; const fl = [];
      for (let i = 0; i < J.recs.length; i++) {
        const a = J.recs[i][t]; if (!a || a === 'W' || h.s[i] < 0) continue;
        const fu = J.fut[0]; const falla = fu ? (fu.push.has(i) || fu.bump.has(i)) : false;
        fl.push({ i, x: h.s[i] % J.st.W, y: (h.s[i] / J.st.W) | 0, dir: a, falla });
      }
      f.flechas = fl;
    }
  }
  if (J.flash) { const q = (ahora - J.flash.t0) / 200; if (q >= 1) J.flash = null; else f.flash = Object.assign({}, J.flash, { p: q }); }
  if (J.sacudida && !REDUCIDO) { const q = (ahora - J.sacudida.t0) / 120; if (q >= 1) J.sacudida = null; else f.sacudida = { dx: J.sacudida.dx || 0.6, dy: J.sacudida.dy, p: q }; }
  if (J.empujon) { const q = (ahora - J.empujon.t0) / 140; if (q >= 1) J.empujon = null; else { const k = Math.sin(q * Math.PI); let [dx, dy] = J.empujon.d; if (V.rot) [dx, dy] = [-dy, dx]; f.empujon = [dx * k, dy * k]; } }
  f.dt = dt; f.tm = tm;
  V.dibujar(f);
}
const arr = (n, v) => new Array(n).fill(v);
const q01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
function puertasEmpujadas(s, push) {
  const st = J.st, W = st.W, res = new Set();
  for (const i of push) { const a = J.cur[J.cur.length - 1] && (i === nA() - 1 ? J.cur[J.cur.length - 1] : J.recs[i][J.cur.length - 1]); const d = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }[a]; if (!d) continue; const c = s[i] + d[0] + d[1] * W; if (st.doorAt[c] >= 0) res.add(st.doorAt[c]); }
  return res;
}
function terminarAnim() {
  const A = J.anim; J.anim = null;
  if (A && A.alTerminar) A.alTerminar();
  if (!J.anim && J.cola.length && !J.fin) { const a = J.cola.shift(); hacer(a); }
}

// ───────────────────────── victoria y resultado ─────────────────────────
function victoria() {
  const copias = nA(), seg = J.cur.length, lv = J.lv;
  borrar(K.partida);
  AUDIO.victoria(); AUDIO.zumbido(0); AUDIO.tension(false); vibrar([30, 40, 30]);
  const W = J.st.W; const ex = J.st.exit % W, ey = (J.st.exit / W) | 0;
  V.emitir(ex, ey, REDUCIDO ? 8 : 46, '#00f2cf', { vel: 1.4, vida: 1.1, r: 0.05 });
  anunciar(tx('a11y.win'));
  J.anim = { tipo: 'victoria', t0: performance.now(), dur: REDUCIDO ? 200 : 700 };
  J.anim.alTerminar = () => mostrarResultado(copias, seg);
  // todas las copias miran hacia la salida
  const h = J.hist[J.hist.length - 1];
  for (let i = 0; i < copias; i++) { const p = h.s[i]; if (p < 0) continue; const dx = ex - p % W, dy = ey - ((p / W) | 0); J.facing[i] = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : dy < 0 ? 'U' : J.facing[i]); }
  if (MET.primerAjaMs == null && lv.id === '1-2' && MET.inicioJugarMs) { MET.primerAjaMs = Date.now() - MET.inicioJugarMs; }
  guardarMet();
}
let ultimoRes = null;
function mostrarResultado(copias, seg) {
  const lv = J.lv;
  const e = 1 + (copias <= lv.copias ? 1 : 0) + (copias <= lv.copias && seg <= lv.seg ? 1 : 0);
  let record = false, nuevoCap = null, finJuego = false;
  if (lv.diario) {
    const prev = DIARIO.dias[lv.fecha];
    if (!prev) {
      const ayer = sumarDias(lv.fecha, -1);
      DIARIO.racha = DIARIO.ultimaFecha === ayer ? DIARIO.racha + 1 : (DIARIO.ultimaFecha === lv.fecha ? DIARIO.racha : 1);
      DIARIO.ultimaFecha = lv.fecha; DIARIO.mejorRacha = Math.max(DIARIO.mejorRacha, DIARIO.racha);
      DIARIO.dias[lv.fecha] = { estrellas: e, copias, seg, orden: J.recs.length + 1 };
      sfx('diario');
    }
    guardar(K.diario, DIARIO);
  } else {
    const prev = PROG.niveles[lv.id] || {};
    const capAntes = nivelesCap(lv.cap + 1).length ? capAbierto(lv.cap + 1) : true;
    const totalAntes = NIVELES.every((n) => hecho(n.id));
    record = !!prev.hecho && (copias < (prev.copias ?? 99) || seg < (prev.seg ?? 99) && copias <= (prev.copias ?? 99));
    PROG.niveles[lv.id] = { hecho: true, estrellas: Math.max(prev.estrellas || 0, e), copias: Math.min(prev.copias ?? 99, copias), seg: Math.min(prev.seg ?? 99, seg), saltado: false };
    guardarProg();
    if (!capAntes && capAbierto(lv.cap + 1)) nuevoCap = lv.cap + 1;
    if (lv.id === '5-8' && !totalAntes && !VISTO.final) finJuego = true;
    if (lv.id.endsWith('-8') && !VISTO['fin' + lv.cap]) { VISTO['fin' + lv.cap] = 1; guardarVisto(); ultimoRes = { finCap: lv.cap, nuevoCap }; }
    else ultimoRes = { nuevoCap };
    if (lv.id.startsWith('1-') && ['1-1', '1-2', '1-3', '1-4'].includes(lv.id)) { VISTO['tut' + lv.id] = 1; guardarVisto(); }
  }
  ultimoRes = Object.assign(ultimoRes || {}, { e, copias, seg, record, finJuego });
  cerrarTut();
  pintarResultado(lv, copias, seg, record);
  const stars = $$('#resStars svg'); stars.forEach((s) => s.classList.remove('on'));
  stars.forEach((s, i) => { if (i < e) setTimeout(() => { s.classList.add('on'); sfx('estrella', { i }); if (i === e - 1 && record) setTimeout(() => sfx('record'), 260); }, 380 + i * 220); });
  const sig = siguienteTrasResultado();
  const r0 = ultimoRes || {}; const haySig = !!(sig || lv.diario || r0.finJuego || r0.finCap || r0.nuevoCap); // el final y el cierre de capítulo siempre tienen su botón principal
  $('#rSiguiente').style.display = haySig ? '' : 'none';
  $('#rCaps').style.display = lv.diario ? 'none' : '';
  abrir('resultado');
  if (!tactil) setTimeout(() => (haySig ? $('#rSiguiente') : $('#rOtra')).focus({ preventScroll: true }), 50);
}
// textos del resultado (se repintan en vivo al cambiar de idioma)
function pintarResultado(lv, copias, seg, record) {
  $('#resTit').textContent = lv.diario ? tx('res.dailyClear') : tx('res.clear');
  $('#resSub').textContent = nombreNivel(lv);
  const metas = $('#resMetas'); metas.innerHTML = '';
  const meta = (txt, ok) => { const d = document.createElement('div'); d.className = 'meta ' + (ok ? 'ok' : 'no'); const a = document.createElement('span'); a.textContent = txt; const b = document.createElement('span'); b.className = 'v'; b.textContent = ok ? '✓' : '·'; d.append(a, b); metas.appendChild(d); };
  meta(tx('res.copies', { v: copias, obj: lv.copias }), copias <= lv.copias);
  meta(tx('res.seconds', { v: seg, obj: lv.seg }), copias <= lv.copias && seg <= lv.seg);
  let hint = '';
  if (copias > lv.copias) hint = tx(lv.copias === 1 ? 'res.hintCopies1' : 'res.hintCopies', { n: lv.copias }) + (lv.id === '1-4' ? '. ' + tx('res.tip14') : '');
  else if (seg > lv.seg) hint = tx('res.hintSeconds', { n: lv.seg });
  $('#resHint').textContent = hint; $('#resHint').style.display = hint ? '' : 'none';
  const bd = $('#resBadge'); bd.style.display = record ? '' : 'none'; bd.textContent = tx('res.record');
  $('#rSiguiente').textContent = lv.diario ? tx('btn.menu') : tx('btn.next');
}
function siguienteTrasResultado() {
  const lv = J.lv; if (lv.diario) return null;
  const i = NIVELES.indexOf(POR_ID[lv.id]);
  for (let k = i + 1; k < NIVELES.length; k++) if (nivelAbierto(NIVELES[k].id) && !hecho(NIVELES[k].id)) return NIVELES[k];
  const p = siguientePendiente(); return p;
}
function trasResultado() {
  cerrar('resultado');
  const r = ultimoRes || {};
  if (r.finJuego) { VISTO.final = 1; guardarVisto(); mostrarFinal(); return; }
  if (r.finCap) { mostrarFinCap(r.finCap); return; }
  if (r.nuevoCap) { mostrarFinCap(r.nuevoCap - 1, true); return; }
  if (J.lv.diario) { irInicio(); return; }
  const sig = siguienteTrasResultado();
  if (sig) cargarNivel(sig); else irCapitulos();
}

// ───────────────────────── repetición y solución ─────────────────────────
// Reproduce un bucle completo con todas las copias (resultado: 2×; pista nivel 3: 1×)
let repEtiqueta = null; // función: el rótulo se rehace al cambiar de idioma
function iniciarRepeticion(recs, vel, etiqueta, alTerminar) {
  repEtiqueta = typeof etiqueta === 'function' ? etiqueta : () => etiqueta;
  const st = J.st, n = recs.length;
  let s = initState(st, n); const frames = [{ s, mov: new Set(), push: new Set(), bump: new Set(), desv: [] }];
  const maxT = Math.max(...recs.map((r) => r.length));
  for (let t = 0; t < maxT; t++) {
    const acts = recs.map((r) => r[t] || 'W'); const p = pasoSimN(s, n, acts);
    if (!p) break; frames.push(p); s = p.s; if (p.win) break;
  }
  J.modoRep = { frames, k: 0, t0: performance.now(), dur: 160 / vel, n, facing: new Array(n).fill('D'), alTerminar, recs, vel };
  $('#repTxt').textContent = repEtiqueta(); $('#modoRep').classList.add('on');
  $('#ctrl').style.visibility = 'hidden';
}
function pasoSimN(s, n, acts) { // todas son ecos: nadie se rechaza
  const st = J.st, dv0 = derive(st, s, n);
  const r = step(st, s, n, acts, -1, dv0); if (!r) return null;
  const mov = new Set(), push = new Set(), bump = new Set();
  for (let i = 0; i < n; i++) { if (r.bumped.includes(i)) push.add(i); else if (r.s[i] !== s[i]) mov.add(i); }
  return { s: r.s, win: r.win, mov, push, bump, desv: r.vanished };
}
function frameRepeticion(ahora, dt, tm) {
  const R = J.modoRep; let q = (ahora - R.t0) / R.dur;
  if (q >= 1) {
    R.k++; R.t0 = ahora; q = 0;
    if (R.k >= R.frames.length - 1) { R.k = 0; R.t0 = ahora + 900; R.facing = new Array(R.n).fill('D'); }
    const p = R.frames[R.k + 1]; if (p) R.recs.forEach((r, i) => { const a = r[R.k]; if (a && a !== 'W') R.facing[i] = a; });
    if (p && p.mov.size) sfx('paso', { eco: true });
  }
  const a = R.frames[R.k], b = R.frames[Math.min(R.frames.length - 1, R.k + 1)];
  const p = easeOut(Math.max(0, Math.min(1, q)));
  const mv = arr(R.n, false); for (const i of b.mov) mv[i] = true; const em = arr(R.n, false); for (const i of b.push) em[i] = true;
  const f = { st: J.st, s0: a.s, s1: b.s, p, nA: R.n, jugador: R.n - 1, dv: derive(J.st, b.s, R.n), facing: R.facing, movio: mv, empujo: em, cap: J.lv.cap || 0, copias: R.n, hc: AJ.hc, aurora: AJ.aurora && estrellasTotales() >= 30, reducido: REDUCIDO };
  if (b.win && R.k === R.frames.length - 2) f.ganar = p;
  if (b.desv.length) f.ocultos = new Set(b.desv);
  return f;
}
function terminarRepeticion() {
  if (!J || !J.modoRep) return; const fn = J.modoRep.alTerminar; J.modoRep = null;
  $('#modoRep').classList.remove('on'); $('#ctrl').style.visibility = '';
  V.puertas = []; V.laser = [];
  if (fn) fn();
}

// ───────────────────────── pantallas ─────────────────────────
const OVS = ['pausa', 'pista', 'resultado', 'como', 'ajustes', 'diario', 'finCap', 'final'];
let pilaOv = [];
const OV_PAUSA = ['pausa', 'pista', 'como', 'ajustes'];
function atenuarAudio() { AUDIO.atenuar(pantalla === 'juego' && pilaOv.some((x) => OV_PAUSA.includes(x))); }
const focoPrevio = {};
function abrir(id) { const el = document.getElementById(id); if (!el.classList.contains('on')) focoPrevio[id] = document.activeElement; el.classList.add('on'); pilaOv = pilaOv.filter((x) => x !== id); pilaOv.push(id); atenuarAudio(); const b = el.querySelector('.btn.pri, .x, button'); if (b && !tactil) setTimeout(() => b.focus({ preventScroll: true }), 30); }
function cerrar(id) { const el = document.getElementById(id); const tenia = el.contains(document.activeElement); el.classList.remove('on'); pilaOv = pilaOv.filter((x) => x !== id); atenuarAudio();
  if (tenia && !tactil) { const sig = pilaOv.length ? document.getElementById(pilaOv[pilaOv.length - 1]) : null; const prev = focoPrevio[id]; if (sig) { const b = sig.querySelector('.btn.pri, .x, button'); if (b) b.focus({ preventScroll: true }); } else if (prev && prev.isConnected && prev.offsetParent !== null) prev.focus({ preventScroll: true }); else if (document.activeElement) document.activeElement.blur(); } }
// Tab no se escapa del panel abierto: recorre solo sus controles
addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || !pilaOv.length) return;
  const ov = document.getElementById(pilaOv[pilaOv.length - 1]);
  const fs = [...ov.querySelectorAll('button, a[href], input, summary')].filter((x) => !x.disabled && x.offsetParent !== null && x.getClientRects().length);
  if (!fs.length) return;
  const i = fs.indexOf(document.activeElement);
  if (i < 0) { e.preventDefault(); fs[e.shiftKey ? fs.length - 1 : 0].focus(); return; }
  if (!e.shiftKey && i === fs.length - 1) { e.preventDefault(); fs[0].focus(); }
  else if (e.shiftKey && i === 0) { e.preventDefault(); fs[fs.length - 1].focus(); }
}, true);
const abierto = (id) => document.getElementById(id).classList.contains('on');
const pausado = () => pilaOv.length > 0;
function mostrarScr(id) {
  pantalla = id;
  $$('.scr').forEach((s) => s.classList.toggle('on', s.id === id));
  $('#juego').classList.toggle('on', id === 'juego');
  $('#topMenu').style.display = id === 'juego' ? 'none' : ''; atenuarAudio();
  if (id !== 'juego') { AUDIO.tema('menu'); AUDIO.zumbido(0); AUDIO.motor(false); asegurarFondo(); }
}
function mostrarJuego() { mostrarScr('juego'); }
function asegurarFondo() {
  if (fondo) { V.ajustar(fondo.lv, rectFondo(), { cap: 4, nPuertas: fondo.st.doors.length }); return; }
  const lv = POR_ID[DEMO ? (QS.get('demo') || '3-4') : '4-5'] || POR_ID['4-5'];
  const st = compile({ map: lv.mapa, N: lv.N, heavy: lv.heavy, lasers: lv.lasers, plats: lv.plats });
  fondo = { lv, st, k: 0, t0: performance.now(), frames: null, facing: [] };
  const n = lv.solucion.length; let s = initState(st, n); const frames = [s];
  for (let t = 0; t < lv.N; t++) { const r = step(st, s, n, lv.solucion.map((x) => x[t] || 'W'), -1); if (!r) break; s = r.s; frames.push(s); if (r.win) break; }
  fondo.frames = frames; fondo.facing = new Array(n).fill('R');
  V.ajustar(lv, rectFondo(), { cap: 4, nPuertas: st.doors.length });
}
function dibujarFondo(ahora, dt, tm) {
  const F = fondo, n = F.lv.solucion.length, dur = 520;
  let q = (ahora - F.t0) / dur;
  if (q >= 1) { F.k++; F.t0 = ahora; q = 0; if (F.k >= F.frames.length - 1) { F.k = 0; F.t0 = ahora + 1400; F.facing.fill('R'); } else F.lv.solucion.forEach((r, i) => { const a = r[F.k]; if (a && a !== 'W') F.facing[i] = a; }); }
  const a = F.frames[F.k], b = F.frames[Math.min(F.frames.length - 1, F.k + 1)];
  const mv = arr(n, false); for (let i = 0; i < n; i++) mv[i] = a[i] !== b[i];
  const f = { st: F.st, s0: a, s1: b, p: easeOut(Math.max(0, Math.min(1, q))), nA: n, jugador: n - 1, dv: derive(F.st, b, n), facing: F.facing, movio: mv, empujo: [], cap: 4, copias: n, hc: false, aurora: false, reducido: REDUCIDO, tm, dt, alfaEcos: 0.9 };
  V.dibujar(f);
  if (DEMO) return;
  // velo para que el menú se lea
  const c = V.ctx; c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
  const k = pantalla === 'inicio' && !pilaOv.length ? 0 : 0.3;
  const g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, `rgba(5,1,8,${0.5 + k})`); g.addColorStop(0.5, `rgba(5,1,8,${0.7 + k * 0.8})`); g.addColorStop(1, `rgba(5,1,8,${0.55 + k})`);
  c.fillStyle = g; c.fillRect(0, 0, V.W, V.H);
}

function refrescarInicio() {
  const p = leer(K.partida, null);
  const sig = siguientePendiente();
  const algo = Object.keys(PROG.niveles).length > 0;
  const b = $('#bJugar');
  if (p && (POR_ID[p.nivel] || String(p.nivel) === 'D-' + fechaJuego())) b.textContent = tx('btn.continue', { nivel: String(p.nivel).startsWith('D-') ? tx('btn.daily') : p.nivel });
  else if (algo && sig) b.textContent = tx('btn.continue', { nivel: sig.id });
  else b.textContent = tx('btn.play');
  const tot = estrellasTotales();
  $('#estrellasTot').innerHTML = '<b>★</b> ' + tot + ' / 120';
  $('#rachaTot').textContent = rachaVigente() ? '🔥 ' + rachaVigente() : '';
  const hoy = fechaJuego(); const d = DIARIO.dias[hoy];
  $('#diarioInfo').textContent = d ? '✓ ' + tx('daily.played') : (rachaVigente() ? '🔥 ' + rachaVigente() : tx('daily.new'));
}
function rachaVigente() { const hoy = fechaJuego(); if (DIARIO.ultimaFecha === hoy || DIARIO.ultimaFecha === sumarDias(hoy, -1)) return DIARIO.racha; return 0; }
function irInicio() { J = null; pilaOv.slice().forEach(cerrar); mostrarScr('inicio'); refrescarInicio(); }

// capítulos
let capVista = null;
function irCapitulos(c) {
  if (J && !J.fin) guardarPartida();
  J = null; pilaOv.slice().forEach(cerrar); mostrarScr('capitulos');
  capVista = c || null; pintarCapitulos();
}
function pintarCapitulos() {
  const lista = $('#listaCaps'), vista = $('#vistaCap');
  $('#capStars').innerHTML = '<b>★</b> ' + estrellasTotales() + ' / 120';
  if (!capVista) {
    $('#capTit').textContent = tx('chap.title');
    lista.style.display = ''; vista.style.display = 'none'; lista.innerHTML = '';
    const caract = { 1: '1-5', 2: '2-7', 3: '3-4', 4: '4-5', 5: '5-8' };
    for (let c = 1; c <= 5; c++) {
      const ab = capAbierto(c); const b = document.createElement('button'); b.className = 'capc' + (ab ? '' : ' lock');
      const est = nivelesCap(c).reduce((a, n) => a + estrellasNivel(n.id), 0);
      const lvM = POR_ID[caract[c]];
      const cvm = document.createElement('canvas');
      b.innerHTML = `<span class="n"></span><span class="t"></span><span class="s"></span>`;
      b.querySelector('.n').textContent = tx('chap.of', { n: c });
      b.querySelector('.t').textContent = tx('ch.' + c);
      b.querySelector('.s').textContent = ab ? tx('chap.stars', { v: est, max: 24 }) : tx('lock.chapter', { n: 6, cap: tx('ch.' + (c - 1)) });
      b.insertBefore(cvm, b.firstChild);
      if (!ab) { const lk = document.createElement('span'); lk.className = 'lk'; lk.innerHTML = '<svg width="16" height="16" style="color:#b5a8d8"><use href="#i-lock"/></svg>'; b.appendChild(lk); }
      b.addEventListener('click', () => { if (!ab) { sfx('rechazo'); avisarMenu(tx('lock.chapter', { n: 6, cap: tx('ch.' + (c - 1)) })); return; } sfx('ui'); capVista = c; pintarCapitulos(); });
      lista.appendChild(b);
      requestAnimationFrame(() => { const w = cvm.clientWidth || 200; pintarMini(cvm, lvM, w, Math.round(w * 0.42), c); });
    }
  } else {
    const c = capVista;
    $('#capTit').textContent = tx('chap.of', { n: c }) + ' · ' + tx('ch.' + c);
    lista.style.display = 'none'; vista.style.display = '';
    const log = $('#capLog'); log.innerHTML = '<b></b><span></span>'; log.querySelector('b').textContent = tx('log.label'); log.querySelector('span').textContent = tx('log.' + c + '.in');
    const g = $('#gridNiv'); g.innerHTML = '';
    const pend = siguientePendiente();
    for (const n of nivelesCap(c)) {
      const ab = nivelAbierto(n.id); const b = document.createElement('button'); b.className = 'lvl' + (pend && pend.id === n.id ? ' cur' : '');
      if (!ab) b.disabled = true;
      const e = estrellasNivel(n.id);
      b.innerHTML = '<span class="id"></span><span class="nm"></span><span class="st"></span>';
      b.querySelector('.id').textContent = n.id; b.querySelector('.nm').textContent = n.nombre[AJ.lang];
      b.querySelector('.st').innerHTML = '<b>' + '★'.repeat(e) + '</b>' + '★'.repeat(3 - e);
      if (saltado(n.id)) { const t = document.createElement('span'); t.className = 'tagx'; t.textContent = tx('chap.skipped'); b.appendChild(t); }
      if (!ab) { const t = document.createElement('span'); t.className = 'tagx'; t.innerHTML = '<svg width="14" height="14"><use href="#i-lock"/></svg>'; b.appendChild(t); b.title = tx('lock.level'); }
      b.addEventListener('click', () => { sfx('ui'); const p = leer(K.partida, null); if (p && p.nivel === n.id) cargarNivel(n, { recs: p.grabaciones, cur: p.actual, reinicios: p.reinicios, inicio: p.inicio }); else cargarNivel(n); });
      g.appendChild(b);
    }
  }
}
function pintarMini(cvm, lv, w, h, cap) {
  miniatura(cvm, lv, w, h, cap, (Vm) => {
    const st = compile({ map: lv.mapa, N: lv.N, heavy: lv.heavy, lasers: lv.lasers, plats: lv.plats });
    const s = initState(st, 1); return { st, s0: s, s1: s, p: 1, nA: 1, jugador: -1, dv: derive(st, s, 1), facing: ['D'], movio: [], empujo: [], copias: 1, tm: 0, dt: 16, ocultos: new Set([0]) };
  });
}
$('#capVolver').addEventListener('click', () => { sfx('ui'); if (capVista) { capVista = null; pintarCapitulos(); } else irInicio(); });

// ───────────────────────── avisos y tutorial ─────────────────────────
let avisoT = 0, tutActual = null;
function avisar(txt, tipo = '', dur = 2200) {
  const el = $('#tostada'); el.textContent = txt; el.className = 'on ' + (tipo || '');
  clearTimeout(avisoT); if (tipo !== 'tut' || dur) avisoT = setTimeout(() => { el.className = ''; if (tipo === 'tut') tutActual = null; }, tipo === 'tut' && !dur ? 1e9 : dur);
}
function avisarMenu(txt) { const el = $('#tostada'); el.textContent = txt; el.className = 'on mal menu'; el.style.zIndex = 50; clearTimeout(avisoT); avisoT = setTimeout(() => { el.className = ''; el.style.zIndex = ''; }, 2200); }
function tut(clave, ms) { if (!J || J.fin) return; tutActual = clave; const el = $('#tostada'); el.textContent = tx(clave); el.className = 'on tut'; clearTimeout(avisoT); if (ms) avisoT = setTimeout(() => { if (tutActual === clave) cerrarTut(); }, ms); }
function cerrarTut() { tutActual = null; $('#tostada').className = ''; $('#pad').classList.remove('guia'); $('#bRebobinar').classList.remove('pulsa'); $('#reloj').classList.remove('brilla'); }
$('#tostada').addEventListener('click', () => { if (tutActual) cerrarTut(); });
const tutActivo = (id) => J && J.lv.id === id && !VISTO['tut' + id];
function tutorialAlCargar() {
  cerrarTut();
  if (tutActivo('1-1')) { setTimeout(() => { if (J && J.cur.length === 0) { tut(tactil ? 'tut.move' : 'tut.moveKeys'); if (tactil) $('#pad').classList.add('guia'); } }, 600); }
  if (tutActivo('1-3') && nA() > 1 && !VISTO.vista) tut(tactil ? 'tut.preview' : 'tut.previewKeys');
}
function tutorialTrasPaso(prev, p, a) {
  if (!J) return; const n = nA(), jug = n - 1, st = J.st;
  if (tutActivo('1-1')) { if (J.cur.length === 1) { $('#pad').classList.remove('guia'); tut('tut.second', 3200); $('#reloj').classList.add('brilla'); } }
  if (tutActivo('1-2') && n === 1) {
    const sobre = st.plates[0].includes(p.s[jug]), antes = st.plates[0].includes(prev.s[jug]);
    // el eco repite el bucle entero: el consejo es rebobinar SOBRE la placa, no después de bajarse
    if (sobre && !antes) {
      tut('tut.plate', 2200); J.pisoPlaca = true; const lvJ = J;
      setTimeout(() => { if (J === lvJ && nA() === 1 && !J.fin && st.plates[0].includes(J.hist[J.hist.length - 1].s[0])) { tut('tut.rewind'); $('#bRebobinar').classList.add('pulsa'); } }, 2300);
    }
    if (!sobre && antes && J.pisoPlaca) { $('#bRebobinar').classList.remove('pulsa'); tut('tut.back', 3200); }
  }
  if (tutActivo('1-2') && n === 2 && p.push.has(jug) && !st.plates[0].includes(p.s[0]) && tutActual !== 'tut.echoLeft') tut('tut.echoLeft', 4000);
  if (tutActivo('1-3') && n >= 2 && p.push.has(jug) && tutActual !== 'tut.push') tut('tut.push', 3600);
}
function tutorialTrasRebobinar() {
  if (tutActivo('1-2') && nA() === 2) { cerrarTut(); tut('tut.echo', 3000); MET.primerAja = true; }
  if (tutActivo('1-3') && nA() === 2 && !VISTO.vista) setTimeout(() => tut(tactil ? 'tut.preview' : 'tut.previewKeys'), 400);
  if (!VISTO.sostener && tactil && nA() === 2 && J.lv.id === '1-2') VISTO.sostener = 1;
}

// ───────────────────────── pausa, pista, saltar ─────────────────────────
function pausar(auto) {
  if (!J || pantalla !== 'juego' || abierto('resultado') || abierto('finCap') || abierto('final')) return;
  if (J.modoRep && !auto) return;
  if (abierto('pausa')) return;
  const puedeSaltar = !J.lv.diario && !hecho(J.lv.id) && (J.reinicios >= 3 || Date.now() - J.inicio > 5 * 60e3);
  $('#pSaltar').style.display = puedeSaltar ? '' : 'none'; $('#pSaltarConf').style.display = 'none';
  $('#pausaDonde').textContent = tx('pause.where', { nivel: nombreNivel(J.lv), k: nA(), t: J.cur.length, N: J.lv.N });
  $('#pPista').style.display = J.lv.diario ? 'none' : '';
  abrir('pausa'); sfx('ui');
}
function continuar() { cerrar('pausa'); AUDIO.reanudar(); }
$('#bPausa').addEventListener('click', () => pausar());
$('#pContinuar').addEventListener('click', () => { sfx('ui'); continuar(); });
$('#pReiniciar').addEventListener('click', () => { sfx('ui'); cerrar('pausa'); reiniciarNivel(true); });
$('#pComo').addEventListener('click', () => { sfx('ui'); abrirComo(); });
$('#pAjustes').addEventListener('click', () => { sfx('ui'); abrirAjustes(); });
$('#pSalir').addEventListener('click', () => { sfx('ui'); const c = J && J.lv.cap; irCapitulos(c || null); });
$('#pSaltar').addEventListener('click', () => {
  sfx('ui'); const c = J.lv.cap; const quedan = 1 - saltosUsados(c);
  $('#pSaltarTxt').textContent = quedan > 0 ? tx('skip.ask', { n: quedan }) : tx('skip.none');
  $('#pSaltarSi').style.display = quedan > 0 ? '' : 'none';
  $('#pSaltarConf').style.display = ''; $('#pSaltar').style.display = 'none';
});
$('#pSaltarNo').addEventListener('click', () => { sfx('ui'); $('#pSaltarConf').style.display = 'none'; $('#pSaltar').style.display = ''; });
$('#pSaltarSi').addEventListener('click', () => {
  const lv = J.lv; PROG.saltos[lv.cap] = saltosUsados(lv.cap) + 1;
  PROG.niveles[lv.id] = Object.assign(PROG.niveles[lv.id] || {}, { saltado: true }); guardarProg(); MET.saltos++; guardarMet();
  borrar(K.partida); cerrar('pausa'); const sig = siguientePendiente(); if (sig) cargarNivel(sig); else irCapitulos(lv.cap);
});
let pistaNivel = 0;
function abrirPista() {
  if (!J) return; pistaNivel = Math.max(1, pistaNivel); MET.pistas++; guardarMet();
  pintarPista(); cerrar('pausa'); abrir('pista');
}
function pintarPista() {
  const lv = J.lv, c = $('#pistaCuerpo'); c.innerHTML = '';
  const bloque = (tit, txt) => { const d = document.createElement('div'); d.className = 'pista'; const b = document.createElement('b'); b.textContent = tit; const p = document.createElement('p'); p.textContent = txt; d.append(b, p); c.appendChild(d); };
  bloque(tx('hint.lvl1'), lv.idea[AJ.lang]);
  if (pistaNivel >= 2) bloque(tx('hint.lvl2'), lv.pista2[AJ.lang]);
  const m = $('#pistaMas'); m.textContent = pistaNivel >= 2 ? tx('btn.showSolution') : tx('btn.moreHint');
}
$('#pPista').addEventListener('click', () => { sfx('ui'); pistaNivel = J && J._pistaDe === J.lv.id ? pistaNivel : 1; J._pistaDe = J.lv.id; abrirPista(); });
$('#pistaX').addEventListener('click', () => { sfx('ui'); cerrar('pista'); });
$('#pistaMas').addEventListener('click', () => {
  sfx('ui');
  if (pistaNivel < 2) { pistaNivel = 2; pintarPista(); return; }
  cerrar('pista');
  iniciarRepeticion(J.lv.solucion, 1, () => tx('hint.watching'), () => {});
});
$('#bFinRep').addEventListener('click', () => { sfx('ui'); const vuelve = J && J.fin; terminarRepeticion(); if (vuelve) abrir('resultado'); });

// ───────────────────────── resultado: botones ─────────────────────────
$('#rSiguiente').addEventListener('click', () => { sfx('ui'); trasResultado(); });
$('#rOtra').addEventListener('click', () => { sfx('ui'); cerrar('resultado'); cargarNivel(J.lv); });
$('#rCaps').addEventListener('click', () => { sfx('ui'); const r = ultimoRes || {}; if (r.finCap || r.nuevoCap || r.finJuego) { trasResultado(); return; } irCapitulos(J.lv.cap); });
$('#rRep').addEventListener('click', () => { sfx('ui'); cerrar('resultado'); const recs = J.recs.concat([J.cur]); iniciarRepeticion(recs, 2, () => tx('btn.replay') + ' · 2×', () => abrir('resultado')); });
$('#rCompartir').addEventListener('click', () => { sfx('ui'); compartir(textoCompartir(J.lv, ultimoRes)); });
function textoCompartir(lv, r) {
  const em = ['🟦', '🟪', '🟨', '🟥', '🟩', '🟧'];
  const k = r.copias; const rombos = Array.from({ length: k }, (_, i) => em[i % 6]).join('');
  const cab = lv.diario ? tx('share.daily', { n: lv.reto }) : tx('share.level', { nivel: lv.id + ' ' + lv.nombre[AJ.lang] });
  const cron = estrellasTotales() >= 120 ? ' · ' + tx('share.chronicler') : '';
  const racha = lv.diario && rachaVigente() ? '  🔥 ' + rachaVigente() : '';
  return `${cab}${cron}\n${rombos} ${k === 1 ? tx('share.copy1') : tx('share.copies', { k })} · ⏱ ${r.seg} s\n${'★'.repeat(r.e)}${'☆'.repeat(3 - r.e)}${racha}\njetgames.fun/antes/`;
}
async function compartir(texto) {
  try { if (navigator.share) { await navigator.share({ text: texto, url: 'https://jetgames.fun/antes/' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(texto); avisarMenu(tx('copied')); $('#tostada').classList.remove('mal'); }
  catch { const ta = document.createElement('textarea'); ta.value = texto; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); avisarMenu(tx('copied')); $('#tostada').classList.remove('mal'); } catch { avisarMenu(tx('shareFail')); } ta.remove(); }
}

// ───────────────────────── fin de capítulo y final ─────────────────────────
let finCapActual = null;
function mostrarFinCap(c, soloDesbloqueo, soloTextos) {
  finCapActual = [c, soloDesbloqueo];
  const sig = c + 1; const ab = sig <= 5 && capAbierto(sig);
  // a mitad de capítulo (6 de 8): se celebra el desbloqueo, pero el camino principal sigue en orden
  const pendiente = soloDesbloqueo ? nivelesCap(c).find((n) => !hecho(n.id) && nivelAbierto(n.id)) : null;
  const lg = $('#fcLog'); lg.innerHTML = '<b></b><span></span>'; lg.querySelector('b').textContent = tx('log.label');
  const pu = $('#fcPuerta'); pu.classList.remove('abre'); pu.style.display = sig <= 5 ? '' : 'none';
  if (pendiente && ab) {
    $('#fcKick').textContent = tx('end.unlocked');
    $('#fcTit').textContent = tx('ch.' + sig);
    lg.querySelector('span').textContent = tx('log.' + sig + '.in');
    $('#fcMeta').style.display = 'none';
    $('#fcNext').textContent = tx('chap.of', { n: sig });
    $('#fcSeguir').textContent = tx('btn.continueWith', { nivel: nombreNivel(pendiente) });
    $('#fcCaps').textContent = tx('btn.nextChapter', { cap: tx('ch.' + sig) });
  } else {
    $('#fcKick').textContent = tx('end.title');
    $('#fcTit').textContent = tx('chap.of', { n: c }) + ' · ' + tx('ch.' + c);
    lg.querySelector('span').textContent = tx('log.' + c + '.out');
    $('#fcMeta').style.display = '';
    $('#fcStars').textContent = '★ ' + nivelesCap(c).reduce((a, n) => a + estrellasNivel(n.id), 0) + ' / 24';
    $('#fcNext').textContent = ab ? tx('end.unlocked') + ' · ' + tx('ch.' + sig) : tx('lock.chapter', { n: 6, cap: tx('ch.' + c) });
    $('#fcSeguir').textContent = ab ? tx('btn.nextChapter', { cap: tx('ch.' + sig) }) : tx('btn.next');
    $('#fcCaps').textContent = tx('btn.chapters');
  }
  if (soloTextos) { if (ab) pu.classList.add('abre'); return; }
  abrir('finCap'); AUDIO.zumbido(0); AUDIO.finCapitulo(ab);
  if (ab) setTimeout(() => { pu.classList.add('abre'); sfx('capitulo'); }, 250);
  const irSig = () => { const n1 = nivelesCap(sig).find((n) => !hecho(n.id)) || POR_ID[sig + '-1']; cargarNivel(n1); };
  $('#fcSeguir').onclick = () => { sfx('ui'); cerrar('finCap'); if (pendiente && ab) cargarNivel(pendiente); else if (ab) irSig(); else { const s = siguientePendiente(); if (s) cargarNivel(s); else irCapitulos(); } };
  $('#fcCaps').onclick = () => { sfx('ui'); cerrar('finCap'); if (pendiente && ab) irSig(); else irCapitulos(); };
}
function mostrarFinal() {
  pilaOv.slice().forEach(cerrar); abrir('final'); AUDIO.tema(null); AUDIO.zumbido(0); sfx('final');
  $('#finalLog').textContent = tx('log.5.out');
  const cvf = $('#finalCv'); const c = cvf.getContext('2d'); const cred = $('#finalCred'); cred.classList.remove('on');
  let t0 = performance.now(); const dur = REDUCIDO ? 2500 : 12000;
  $('#final').onpointerdown = (e) => { if (!cred.classList.contains('on') && !e.target.closest('button')) t0 = Math.min(t0, performance.now() - dur * 0.93); };
  const ecos = []; for (let i = 0; i < 40; i++) ecos.push({ x: Math.random(), y: 0.25 + Math.random() * 0.6, t: i / 40 * 0.7, col: COLOR_ECO[i % 6], f: 'udlr'[i % 4] });
  function cuadro(ahora) {
    if (!abierto('final')) return;
    const dpr = Math.min(3, devicePixelRatio || 1), W = innerWidth, H = innerHeight; if (cvf.width !== Math.round(W * dpr)) { cvf.width = Math.round(W * dpr); cvf.height = Math.round(H * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#030006'; c.fillRect(0, 0, W, H);
    const q = q01((ahora - t0) / dur); const sz = Math.min(W, H) * 0.08; setTS(sz);
    for (const e of ecos) {
      const a = (q < e.t ? 0 : q < e.t + 0.15 ? (q - e.t) / 0.15 : Math.max(0, 1 - (q - e.t - 0.15) / 0.2)) * Math.min(1, (1 - q) / 0.12); if (a <= 0) continue;
      const x = e.x * W, y = e.y * H; const hg = c.createRadialGradient(x, y, 0, x, y, sz * 0.9); hg.addColorStop(0, e.col + '66'); hg.addColorStop(1, e.col + '00');
      c.save(); c.globalAlpha = a; c.fillStyle = hg; c.fillRect(x - sz, y - sz, sz * 2, sz * 2); c.globalAlpha = a * 0.55; drawAstro(c, x, y, e.f, 0, 0, 0, ahora / 1000, 0); c.restore();
    }
    // queda una sola copia, la tuya; se aparta cuando llegan los créditos
    const a2 = Math.min(1, Math.max(0, (q - 0.7) / 0.15)) * (1 - Math.min(1, Math.max(0, (q - 0.93) / 0.07)));
    if (a2 > 0) { c.save(); c.globalAlpha = a2; setTS(sz * 1.6); drawAstro(c, W / 2, H * 0.5, 'd', 0, 0, 0, ahora / 1000, 0); c.restore(); }
    if (q >= 1) cred.classList.add('on');
    requestAnimationFrame(cuadro);
  }
  requestAnimationFrame(cuadro);
}
$('#finalDiario').addEventListener('click', () => { sfx('ui'); cerrar('final'); abrirDiario(); });
$('#finalMenu').addEventListener('click', () => { sfx('ui'); cerrar('final'); irInicio(); });

// ───────────────────────── reto diario ─────────────────────────
let diarios = null, diarioHoy = null, diarioCargando = null;
async function cargarDiarios() {
  if (diarios) return diarios;
  try { const r = await fetch('diarios.json', { cache: 'no-cache' }); if (r.ok) diarios = await r.json(); } catch {}
  return diarios;
}
let fechaForzada = null;
const fechaJuego = () => fechaForzada || fechaLocal();
async function obtenerDiario(fecha) {
  const d = await cargarDiarios();
  if (d && d.dias && d.dias[fecha]) return d.dias[fecha];
  // generador en vivo en un Worker (misma especificación); si tarda demasiado, banco de respaldo
  return new Promise((ok) => {
    let listo = false; const fin = (lv) => { if (!listo) { listo = true; ok(lv); } };
    try {
      const w = new Worker(new URL('./diario-worker.js', import.meta.url), { type: 'module' });
      w.onmessage = (e) => { fin(e.data || respaldo(d && d.banco, fecha)); w.terminate(); };
      w.onerror = () => { fin(respaldo(d && d.banco, fecha)); w.terminate(); };
      w.postMessage({ fecha });
      setTimeout(() => { if (!listo) { fin(respaldo(d && d.banco, fecha)); w.terminate(); } }, 25000);
    } catch { fin(respaldo(d && d.banco, fecha)); }
  });
}
function pintarDiarioTextos() {
  const fecha = fechaJuego(); const hecho = DIARIO.dias[fecha];
  $('#diaNum').textContent = tx('daily.today', { n: numeroReto(fecha), fecha: fechaTxt(fecha) });
  const et = $('#diaRes .meta span'); if (et) et.textContent = tx('daily.result');
  $('#diaJugar').textContent = hecho ? tx('btn.retryDaily') : tx('btn.playDaily');
  if (diarioHoy && diarioHoy.fecha === fecha && $('#diaCarga').style.display === 'none') $('#diaGoal').textContent = tx('daily.goal', { k: diarioHoy.copias, t: diarioHoy.seg });
}
async function abrirDiario() {
  const fecha = fechaJuego(); abrir('diario');
  $('#diaNum').textContent = tx('daily.today', { n: numeroReto(fecha), fecha: fechaTxt(fecha) });
  $('#diaRacha').textContent = rachaVigente(); $('#diaMejor').textContent = DIARIO.mejorRacha;
  const hecho = DIARIO.dias[fecha];
  const res = $('#diaRes'); res.innerHTML = '';
  $('#diaCompartir').style.display = hecho ? '' : 'none';
  if (hecho) {
    const d = document.createElement('div'); d.className = 'meta ok'; d.style.marginBottom = '10px';
    const a = document.createElement('span'); a.textContent = tx('daily.result'); const b = document.createElement('span'); b.className = 'v'; b.textContent = '★'.repeat(hecho.estrellas) + ' · ' + (hecho.copias === 1 ? tx('share.copy1') : tx('share.copies', { k: hecho.copias })) + ' · ' + hecho.seg + ' s'; d.append(a, b); res.appendChild(d);
    const p = document.createElement('p'); p.className = 'note'; p.style.cssText = 'text-align:center;margin:0 0 12px'; res.appendChild(p);
    const tick = () => { if (!abierto('diario')) return; const ahora = new Date(); const m = new Date(ahora); m.setHours(24, 0, 0, 0); let s = Math.max(0, Math.floor((m - ahora) / 1000)); const hh = String(Math.floor(s / 3600)).padStart(2, '0'), mm = String(Math.floor(s / 60) % 60).padStart(2, '0'), ss = String(s % 60).padStart(2, '0'); p.textContent = tx('daily.done', { 'hh:mm:ss': hh + ':' + mm + ':' + ss }); setTimeout(tick, 1000); };
    tick();
    $('#diaJugar').textContent = tx('btn.retryDaily');
  } else $('#diaJugar').textContent = tx('btn.playDaily');
  $('#diaGoal').textContent = '';
  $('#diaJugar').disabled = true; $('#diaCarga').style.display = '';
  const lv = await (diarioCargando || (diarioCargando = obtenerDiario(fecha)));
  diarioCargando = null; diarioHoy = lv;
  $('#diaCarga').style.display = 'none'; $('#diaJugar').disabled = !lv;
  if (lv) $('#diaGoal').textContent = tx('daily.goal', { k: lv.copias, t: lv.seg });
}
$('#bDiario').addEventListener('click', () => { sfx('ui'); abrirDiario(); });
$('#diaX').addEventListener('click', () => { sfx('ui'); cerrar('diario'); });
$('#diaJugar').addEventListener('click', () => { if (!diarioHoy) return; sfx('ui'); cerrar('diario'); cargarNivel(diarioHoy); });
$('#diaCompartir').addEventListener('click', () => { const f = fechaJuego(); const h = DIARIO.dias[f]; if (!h || !diarioHoy) return; compartir(textoCompartir(diarioHoy, { copias: h.copias, seg: h.seg, e: h.estrellas })); });

// ───────────────────────── cómo jugar ─────────────────────────
const LAMINAS = [
  { mapa: ['#######', '#S...E#', '#######'], recs: [], cur: 'RRRR', n: 1 },
  { mapa: ['#######', '#.S..E#', '#######'], recs: ['RRR'], cur: 'L', n: 2, rebobina: true },
  { mapa: ['#########', '#a.S.A.E#', '#########'], recs: ['LLWWW'], cur: 'RRRR', n: 2 },
];
let comoAnim = 0;
function abrirComo() {
  abrir('como');
  const cont = $('#laminas'); cont.innerHTML = '';
  const vistas = LAMINAS.map((L, i) => {
    const d = document.createElement('div'); d.className = 'lamina'; const cvl = document.createElement('canvas'); const p = document.createElement('p');
    const b = document.createElement('b'); b.textContent = String(i + 1).padStart(2, '0'); const pt = document.createElement('span'); pt.dataset.t = 'how.' + (i + 1); pt.textContent = tx(pt.dataset.t); p.append(b, pt); d.append(cvl, p); cont.appendChild(d);
    return { L, cvl };
  });
  // elementos descubiertos
  const vistos = new Set(['start', 'exit', 'plate', 'door']);
  const maxCap = Math.max(1, ...NIVELES.filter((n) => hecho(n.id) || nivelAbierto(n.id)).map((n) => n.cap));
  if (maxCap >= 2) { vistos.add('box'); vistos.add('heavy'); } if (maxCap >= 3) vistos.add('laser'); if (maxCap >= 4) { vistos.add('void'); vistos.add('plat'); } if (maxCap >= 5) vistos.add('inverse');
  const els = $('#elsLista'); els.innerHTML = '';
  const EL = [['start', ['###', '#S#', '###']], ['exit', ['###', '#E#', '###']], ['plate', ['###', '#a#', '###']], ['door', ['###', '.A.', '###']], ['box', ['###', '#o#', '###']], ['heavy', ['###', '#b#', '###'], ['b']], ['laser', ['#v#', '#.#', '###']], ['void', ['###', '#_#', '###']], ['plat', ['###', '#_#', '###'], null, [{ path: [[1, 1]], plate: 'a' }]], ['inverse', ['###', '.W.', '###']]];
  for (const [k, mapa, heavy, plats] of EL) {
    if (!vistos.has(k)) continue;
    const r = document.createElement('div'); r.className = 'el'; const c = document.createElement('canvas'); const s = document.createElement('span'); s.dataset.t = 'el.' + k; s.textContent = tx(s.dataset.t); r.append(c, s); els.appendChild(r);
    const lv = { mapa, N: 1, heavy: heavy || undefined, plats: plats || undefined, lasers: {} };
    requestAnimationFrame(() => pintarMini(c, lv, 44 * 3, 44 * 3, 1));
    c.style.width = '44px'; c.style.height = '44px';
  }
  if (vistos.size < 10) { const p = document.createElement('p'); p.className = 'note'; p.dataset.t = 'how.elementsEmpty'; p.textContent = tx(p.dataset.t); els.appendChild(p); }
  // animación de las láminas
  cancelAnimationFrame(comoAnim);
  const t0 = performance.now();
  const loop = (ahora) => {
    if (!abierto('como')) return;
    for (const { L, cvl } of vistas) animarLamina(L, cvl, (ahora - t0) / 1000);
    comoAnim = requestAnimationFrame(loop);
  };
  requestAnimationFrame(() => { comoAnim = requestAnimationFrame(loop); });
}
function animarLamina(L, cvl, seg) {
  const w = cvl.clientWidth, h = cvl.clientHeight; if (!w) return;
  if (!L.V || L.w !== w) { L.V = crearVista(cvl); L.w = w; L.V.ajustar({ mapa: L.mapa, N: 9 }, { x: 8, y: 8, w: w - 16, h: h - 16 }, { cap: 1, ancho: w, alto: h, nPuertas: 1 }); L.st = compile({ map: L.mapa, N: 9 }); }
  const st = L.st; const paso = 0.55; const total = (L.rebobina ? L.recs[0].length + 2 : 0) + L.cur.length + 3;
  const k = (seg / paso) % total; const ki = Math.floor(k), fr = k - ki;
  // fase 1 (solo lámina 2): el primer intento, luego rebobinado; fase 2: el bucle con el eco
  let recs = L.recs, cur = L.cur, n = L.n, t = ki, rebob = 0;
  if (L.rebobina) { const r0 = L.recs[0].length; if (ki < r0 + 1) { recs = []; cur = L.recs[0]; n = 1; t = ki; } else if (ki < r0 + 2) { rebob = fr; recs = []; cur = L.recs[0]; n = 1; t = r0; } else { t = ki - r0 - 2; } }
  t = Math.min(t, cur.length);
  let s = initState(st, n), prev = s; const facing = new Array(n).fill('R');
  for (let i = 0; i < t; i++) { const acts = recs.map((r) => r[i] || 'W'); acts.push(cur[i] || 'W'); const r = step(st, s, n, acts, n - 1); if (!r) break; prev = s; s = r.s; acts.forEach((a, j) => { if (a !== 'W') facing[j] = a; }); }
  const moviendo = t > 0 && t <= cur.length && ki === t + (L.rebobina && n === 2 ? L.recs[0].length + 2 : 0);
  const p = moviendo ? easeOut(Math.min(1, fr * 2.2)) : 1;
  const V2 = L.V; const ctx2 = V2.ctx;
  V2.dibujar({ st, s0: moviendo ? prev : s, s1: s, p, nA: n, jugador: n - 1, dv: derive(st, s, n), facing, movio: new Array(n).fill(moviendo), empujo: [], cap: 1, copias: n, tm: seg, dt: 16, rebobinar: rebob || undefined, reducido: REDUCIDO, instantaneo: false });
  // reloj
  ctx2.setTransform(V2.dpr, 0, 0, V2.dpr, 0, 0); ctx2.fillStyle = 'rgba(245,240,255,.9)'; ctx2.font = '800 13px JetBrains Mono, monospace'; ctx2.textAlign = 'right'; ctx2.textBaseline = 'top';
  ctx2.fillText(String(t).padStart(2, '0') + ' s', w - 10, 8);
}
$('#bComo').addEventListener('click', () => { sfx('ui'); abrirComo(); });
$('#comoX').addEventListener('click', () => { sfx('ui'); cerrar('como'); });
$('#comoOk').addEventListener('click', () => { sfx('ui'); cerrar('como'); });

// ───────────────────────── ajustes ─────────────────────────
function abrirAjustes() { pintarAjustes(); abrir('ajustes'); setTimeout(avisoAudio, 450); }
// si el navegador mantiene el audio bloqueado, se dice cómo activarlo
function avisoAudio() { const el = $('#avisoAudio'); if (el) el.style.display = (AJ.music || AJ.sfx) && AUDIO.estado() !== 'running' ? '' : 'none'; }
function pintarAjustes() {
  const tg = (id, v, dis) => { const b = $(id); b.classList.toggle('on', !!v); b.setAttribute('aria-pressed', v ? 'true' : 'false'); b.disabled = !!dis; };
  const est = estrellasTotales();
  avisoAudio(); tg('#tgMus', AJ.music); tg('#tgSfx', AJ.sfx); tg('#tgVib', AJ.vib); tg('#tgFull', enFS()); tg('#tgZurdo', AJ.zurdo); tg('#tgPrev', AJ.vistaPrevia); tg('#tgHc', AJ.hc);
  tg('#tgAurora', AJ.aurora && est >= 30, est < 30); tg('#tgTrail', AJ.trail && est >= 60, est < 60); tg('#tgLargo', AJ.largo && est >= 90, est < 90);
  $('#lkAurora').textContent = est >= 30 ? '' : tx('set.unlockAt', { n: 30 }); $('#lkTrail').textContent = est >= 60 ? '' : tx('set.unlockAt', { n: 60 }); $('#lkLargo').textContent = est >= 90 ? '' : tx('set.unlockAt', { n: 90 });
  $('#volMus').value = AJ.musicVol; $('#volSfx').value = AJ.sfxVol;
  pintarIdioma();
  $$('#segVel button').forEach((b) => b.classList.toggle('on', b.dataset.v === AJ.velocidad));
  $('#sinGuardar').style.display = puedeGuardar ? 'none' : '';
  ['#volMus', '#volSfx'].forEach((s) => $(s).setAttribute('aria-label', tx('set.volume')));
}
function cambiar(k, v) { AJ[k] = v; guardarAj(); audioPrefs(); pintarAjustes(); sfx('toggle'); document.body.classList.toggle('zurdo', AJ.zurdo); document.body.classList.toggle('hc', AJ.hc); if (J) actualizarHud(); }
$('#tgMus').addEventListener('click', () => cambiar('music', !AJ.music));
$('#tgSfx').addEventListener('click', () => { AJ.sfx = !AJ.sfx; cambiar('sfx', AJ.sfx); });
$('#tgVib').addEventListener('click', () => { cambiar('vib', !AJ.vib); vibrar(20); });
$('#tgFull').addEventListener('click', () => { alternarFS(); sfx('toggle'); });
$('#tgZurdo').addEventListener('click', () => cambiar('zurdo', !AJ.zurdo));
$('#tgPrev').addEventListener('click', () => cambiar('vistaPrevia', !AJ.vistaPrevia));
$('#tgHc').addEventListener('click', () => cambiar('hc', !AJ.hc));
$('#tgAurora').addEventListener('click', () => cambiar('aurora', !AJ.aurora));
$('#tgTrail').addEventListener('click', () => cambiar('trail', !AJ.trail));
$('#tgLargo').addEventListener('click', () => cambiar('largo', !AJ.largo));
$('#volMus').addEventListener('input', (e) => { AJ.musicVol = +e.target.value; audioPrefs(); }); $('#volMus').addEventListener('change', guardarAj);
$('#volSfx').addEventListener('input', (e) => { AJ.sfxVol = +e.target.value; audioPrefs(); }); $('#volSfx').addEventListener('change', () => { guardarAj(); sfx('placaOn'); });
// Selector ES | EN (Ajustes e inicio): cambia el idioma de todo el sitio; el evento 'jet-idioma' repinta en vivo.
function pintarIdioma() { $$('.seg-lang button').forEach((b) => { const on = b.dataset.v === AJ.lang; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
$$('.seg-lang button').forEach((b) => b.addEventListener('click', () => { if (b.dataset.v !== AJ.lang) { window.JETIdioma.set(b.dataset.v); sfx('toggle'); } }));
addEventListener('jet-idioma', () => {
  aplicarTextos();
  if (abierto('ajustes')) pintarAjustes();
  if (pantalla === 'capitulos') pintarCapitulos();
  if (J && abierto('pausa')) $('#pausaDonde').textContent = tx('pause.where', { nivel: nombreNivel(J.lv), k: nA(), t: J.cur.length, N: J.lv.N });
  if (J && abierto('pista')) pintarPista();
  if (J && abierto('resultado') && ultimoRes) pintarResultado(J.lv, ultimoRes.copias, ultimoRes.seg, ultimoRes.record);
  if (abierto('finCap') && finCapActual) mostrarFinCap(finCapActual[0], finCapActual[1], true);
  if (abierto('final')) $('#finalLog').textContent = tx('log.5.out');
  if (abierto('diario')) pintarDiarioTextos();
  if (J && J.modoRep && repEtiqueta) $('#repTxt').textContent = repEtiqueta();
  if (J && tutActual) $('#tostada').textContent = tx(tutActual);
  else { clearTimeout(avisoT); const ts = $('#tostada'); ts.className = ''; ts.style.zIndex = ''; } // un aviso suelto en el idioma anterior se retira
  $('#vivo').textContent = ''; // el lector de pantalla no repite un anuncio viejo en el otro idioma
  if (J && $('#pSaltarConf').style.display !== 'none') { const q = 1 - saltosUsados(J.lv.cap); $('#pSaltarTxt').textContent = q > 0 ? tx('skip.ask', { n: q }) : tx('skip.none'); }
  if (J && Date.now() - confReinicio < 4000) { const n = J.recs.length + (J.cur.length ? 1 : 0); $('#txtReiniciar').textContent = n > 1 ? tx('restart.confirm', { n }) : tx('restart.confirm1'); }
  if (borrarArmado && Date.now() - borrarArmado < 4000) $('#bBorrar').textContent = tx('set.erase2');
});
$$('#segVel button').forEach((b) => b.addEventListener('click', () => cambiar('velocidad', b.dataset.v)));
let borrarArmado = 0;
$('#bBorrar').addEventListener('click', () => {
  const b = $('#bBorrar');
  if (Date.now() - borrarArmado < 4000) {
    for (const k of [K.prog, K.partida, K.diario, K.visto, K.met]) borrar(k);
    PROG.niveles = {}; PROG.saltos = {}; DIARIO.dias = {}; DIARIO.racha = 0; DIARIO.mejorRacha = 0; DIARIO.ultimaFecha = null; for (const k in VISTO) delete VISTO[k];
    borrarArmado = 0; b.classList.remove('armado'); b.textContent = tx('set.erased'); sfx('rechazo');
    setTimeout(() => { b.textContent = tx('set.erase'); }, 1800);
    cerrar('ajustes'); irInicio(); return;
  }
  borrarArmado = Date.now(); b.classList.add('armado'); b.textContent = tx('set.erase2'); sfx('ui');
  setTimeout(() => { if (Date.now() - borrarArmado >= 3900) { b.classList.remove('armado'); b.textContent = tx('set.erase'); } }, 4000);
});
$('#ajX').addEventListener('click', () => { sfx('ui'); cerrar('ajustes'); });
$('#bAjMenu').addEventListener('click', () => { sfx('ui'); abrirAjustes(); });
$('#bAjJuego').addEventListener('click', () => { sfx('ui'); if (J && !pausado()) pausar(); abrirAjustes(); });
$('#bFullMenu').addEventListener('click', () => { sfx('ui'); alternarFS(); });

// ───────────────────────── botones de inicio ─────────────────────────
$('#bJugar').addEventListener('click', async () => {
  sfx('ui'); if (MET.inicioJugarMs == null) { MET.inicioJugarMs = Date.now(); guardarMet(); }
  const p = leer(K.partida, null);
  if (p && await reanudarPartida(p)) return; // reanudarPartida es asíncrona: sin await, una partida vieja dejaba el botón sin efecto
  const sig = siguientePendiente() || NIVELES[0]; cargarNivel(sig);
});
$('#bCapitulos').addEventListener('click', () => { sfx('ui'); irCapitulos(); });
async function reanudarPartida(p, conPausa) {
  if (!p) return false;
  let lv = POR_ID[p.nivel];
  if (!lv && String(p.nivel).startsWith('D-')) { const f = p.nivel.slice(2); if (f !== fechaJuego()) { borrar(K.partida); return false; } lv = await obtenerDiario(f); diarioHoy = lv; }
  if (!lv) { borrar(K.partida); return false; }
  cargarNivel(lv, { recs: (p.grabaciones || []).filter((r) => typeof r === 'string' && /^[UDLRW]*$/.test(r)), cur: /^[UDLRW]*$/.test(p.actual || '') ? p.actual : '', reinicios: p.reinicios || 0, inicio: p.inicio || Date.now() });
  if (conPausa) { pausar(true); $('#pausaDonde').textContent = tx('resume.saved', { nivel: nombreNivel(lv), k: nA(), t: J.cur.length }); }
  return true;
}

// ───────────────────────── entrada: teclado ─────────────────────────
const TECLA = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R', W: 'U', S: 'D', A: 'L', D: 'R' };
const INV_ROT = { R: 'U', D: 'R', L: 'D', U: 'L' }; // pantalla → sala con la sala girada
const salaDir = (d) => V.rot ? INV_ROT[d] : d;
let sostR = null, sostT = null;
addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') { if (fsAPI && !e.repeat && !(e.target && e.target.tagName === 'INPUT')) alternarFS(); return; }
  if (pantalla !== 'juego' || !J) {
    if (e.key === 'Escape' && pilaOv.length) { const top = pilaOv[pilaOv.length - 1]; if (top !== 'final') { cerrar(top); e.preventDefault(); } }
    return;
  }
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    if (J.modoRep) { $('#bFinRep').click(); return; }
    const top = pilaOv[pilaOv.length - 1];
    if (!top) pausar(); else if (top === 'pausa') continuar(); else if (top !== 'resultado' && top !== 'finCap' && top !== 'final') { cerrar(top); }
    return;
  }
  if (pausado() || J.modoRep) return;
  if (TECLA[e.key]) { e.preventDefault(); hacer(salaDir(TECLA[e.key])); return; }
  if (e.key === ' ' || e.key === '.') { e.preventDefault(); if (!e.repeat || true) hacer('W'); return; }
  if ((e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') && !e.repeat) { e.preventDefault(); deshacer(); return; }
  if ((e.key === 'r' || e.key === 'R') && !e.repeat) { e.preventDefault(); iniciarSostener('r'); return; }
  if ((e.key === 't' || e.key === 'T') && !e.repeat) { e.preventDefault(); iniciarSostener('t'); return; }
  if (e.key === 'Tab') { e.preventDefault(); const t = J.cur.length; fijarVista((J.vistaT ?? t) + (e.shiftKey ? -1 : 1)); return; }
});
addEventListener('keyup', (e) => { if (e.key === 'r' || e.key === 'R') soltarSostener('r'); if (e.key === 't' || e.key === 'T') soltarSostener('t'); });
// sostener: rebobinar (350 ms) y reiniciar (600 ms)
let sost = null;
function iniciarSostener(tipo) {
  if (!J || J.fin || J.anim || pausado()) return;
  if (tipo === 'r' && (J.cur.length === 0 || nA() >= MAX_COPIAS)) { rebobinar(); return; }
  const dur = tipo === 'r' ? 350 : 600; const t0 = performance.now();
  sost = { tipo, t0, dur }; if (tipo === 'r') { sfx('carga'); $('#bRebobinar').classList.add('down'); }
  const ring = $('#bRebobinar .ring');
  const tick = () => {
    if (!sost || sost.t0 !== t0) { ring.style.transform = 'scaleX(0)'; return; }
    const q = Math.min(1, (performance.now() - t0) / dur);
    if (tipo === 'r') ring.style.transform = `scaleX(${q})`;
    if (q >= 1) { sost = null; ring.style.transform = 'scaleX(0)'; $('#bRebobinar').classList.remove('down'); if (tipo === 'r') rebobinar(); else reiniciarNivel(true); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function soltarSostener(tipo) { if (sost && sost.tipo === tipo) { const q = (performance.now() - sost.t0) / sost.dur; sost = null; if (tipo === 'r' && q < 1) AUDIO.cancelarCarga(); $('#bRebobinar').classList.remove('down'); if (tipo === 'r' && q < 1 && tactil) avisar(tx('tut.hold')); } }

// ───────────────────────── entrada: táctil y ratón ─────────────────────────
function botonRepetible(el, fn) {
  let t1 = 0, t2 = 0;
  const parar = () => { clearTimeout(t1); clearInterval(t2); el.classList.remove('down'); };
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.classList.add('down'); fn(); t1 = setTimeout(() => { t2 = setInterval(fn, 170); }, 300); try { el.setPointerCapture(e.pointerId); } catch {} });
  el.addEventListener('pointerup', parar); el.addEventListener('pointercancel', parar); el.addEventListener('lostpointercapture', parar);
  el.addEventListener('click', (e) => { if (e.detail === 0) fn(); }); // teclado (Enter/Espacio sobre el botón)
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}
$$('#pad [data-d]').forEach((b) => botonRepetible(b, () => hacer(salaDir(b.dataset.d))));
botonRepetible($('#bEsperar'), () => hacer('W'));
(() => { const b = $('#bDeshacer'); b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.classList.add('down'); deshacer(); }); const up = () => b.classList.remove('down'); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('click', (e) => { if (e.detail === 0) deshacer(); }); })();
(() => {
  const b = $('#bRebobinar');
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch {} iniciarSostener('r'); });
  b.addEventListener('pointerup', () => soltarSostener('r')); b.addEventListener('pointercancel', () => soltarSostener('r'));
  b.addEventListener('click', (e) => { if (e.detail === 0) rebobinar(); });
  b.addEventListener('contextmenu', (e) => e.preventDefault());
})();
$('#bReiniciar').addEventListener('click', () => reiniciarNivel(false));
// deslizar sobre la sala, tocar una casilla vecina o a tu astronauta
(() => {
  const s = $('#sala'); let ini = null;
  s.addEventListener('pointerdown', (e) => { if (!J || pausado()) return; ini = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, hecho: false }; try { s.setPointerCapture(e.pointerId); } catch {} });
  s.addEventListener('pointermove', (e) => {
    if (!ini || ini.hecho || e.pointerId !== ini.id) return;
    const dx = e.clientX - ini.x, dy = e.clientY - ini.y;
    if (Math.hypot(dx, dy) >= 24) { ini.hecho = true; const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'); hacer(salaDir(d)); }
  });
  s.addEventListener('pointerup', (e) => {
    if (!ini || e.pointerId !== ini.id) return; const i = ini; ini = null; if (i.hecho || !J || J.fin) return;
    if (J.modoRep) return;
    const c = V.celdaDePixel(e.clientX, e.clientY); if (!c) return;
    const yo = J.hist[J.hist.length - 1].s[nA() - 1]; const W = J.st.W; const yx = yo % W, yy = (yo / W) | 0;
    const dx = c[0] - yx, dy = c[1] - yy;
    if (dx === 0 && dy === 0) hacer('W');
    else if (Math.abs(dx) + Math.abs(dy) === 1) hacer(dx === 1 ? 'R' : dx === -1 ? 'L' : dy === 1 ? 'D' : 'U');
  });
  s.addEventListener('pointercancel', () => { ini = null; });
})();
addEventListener('contextmenu', (e) => { if (pantalla === 'juego') e.preventDefault(); });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

// ───────────────────────── ciclo de vida: pestaña, pantalla completa ─────────────────────────
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (J && pantalla === 'juego' && !J.fin) { guardarPartida(); pausar(true); } AUDIO.suspender(); }
  else { /* la pausa queda abierta y la música suena atenuada detrás; si el navegador exige un gesto, vuelve con el primer toque */ AUDIO.reanudar(); pedirLayout(); }
});
let estabaFS = enFS();
const alCambioFS = () => { const ahora = enFS(); if (estabaFS && !ahora && J && pantalla === 'juego' && !J.fin) pausar(true); estabaFS = ahora; if (abierto('ajustes')) pintarAjustes(); pedirLayout(); setTimeout(layout, 200); };
document.addEventListener('fullscreenchange', alCambioFS); document.addEventListener('webkitfullscreenchange', alCambioFS);
addEventListener('pagehide', () => { if (J && !J.fin) guardarPartida(); });

// botones de los overlays: Escape/fuera para cerrar lo cerrable
for (const id of ['como', 'ajustes', 'diario', 'pista']) document.getElementById(id).addEventListener('pointerdown', (e) => { if (e.target.id === id) { cerrar(id); } });

// ───────────────────────── gancho de pruebas ─────────────────────────
window.ANTES = {
  estado: () => J ? { nivel: J.lv.id, copia: nA(), segundo: J.cur.length, grabaciones: J.recs.slice(), actual: J.cur, fin: J.fin, N: J.lv.N, rot: V.rot, cs: V.cs, pantalla, overlays: pilaOv.slice(), anim: !!J.anim } : { pantalla, overlays: pilaOv.slice() },
  cargar: (id) => { const lv = POR_ID[id]; if (lv) { pilaOv.slice().forEach(cerrar); cargarNivel(lv); } return !!lv; },
  accion: (a) => { const antes = J ? J.cur.length + J.recs.length * 100 : 0; hacer(a); return J ? (J.cur.length + J.recs.length * 100) !== antes : false; },
  rebobinar: () => { rebobinar(); }, deshacer: () => deshacer(),
  simular: (id, recs) => { const lv = POR_ID[id] || (diarioHoy && diarioHoy.id === id ? diarioHoy : null); if (!lv) return null; const st = compile({ map: lv.mapa, N: lv.N, heavy: lv.heavy, lasers: lv.lasers, plats: lv.plats }); const prev = []; for (let k = 0; k < recs.length; k++) { let s = initState(st, k + 1); for (let t = 0; t < lv.N; t++) { const pa = recs[k][t]; if (pa === undefined) break; const acts = prev.map((r) => r[t] || 'W'); acts.push(pa); const r = step(st, s, k + 1, acts, k); if (!r) return { win: false, err: `bucle ${k + 1}, segundo ${t + 1}` }; s = r.s; if (r.win) return { win: true, copies: k + 1, t: t + 1 }; } prev.push(recs[k]); } return { win: false }; },
  resolver: (id) => { if (id) window.ANTES.cargar(id); if (!J) return; iniciarRepeticion(J.lv.solucion, 1, () => tx('hint.watching'), () => {}); },
  desbloquearTodo: () => { todoAbierto = true; if (pantalla === 'capitulos') pintarCapitulos(); },
  fecha: (f) => { fechaForzada = f; diarioHoy = null; refrescarInicio(); },
  diario: async (f) => obtenerDiario(f || fechaJuego()),
  generar: (f) => generarDiario(f),
  metricas: () => Object.assign({}, MET),
  niveles: () => NIVELES.map((n) => ({ id: n.id, solucion: n.solucion, copias: n.copias, seg: n.seg })),
  layout: () => layout(), vista: () => ({ rot: V.rot, cs: V.cs, ox: V.ox, oy: V.oy, GW: V.scr && V.scr.GW, GH: V.scr && V.scr.GH, sala: rectSala }),
  audio: () => AUDIO.estado(), sonido: () => AUDIO.diag(),
};

// ───────────────────────── arranque ─────────────────────────
document.body.classList.toggle('zurdo', AJ.zurdo); document.body.classList.toggle('hc', AJ.hc);
aplicarTextos();
layout();
requestAnimationFrame(fotograma);
(async () => {
  const qn = QS.get('nivel');
  if (QS.has('todo')) todoAbierto = true;
  if (DEMO) { mostrarScr('inicio'); $('#inicio').classList.remove('on'); $('#topMenu').style.display = 'none'; document.body.classList.add('demo'); const d = document.createElement('div'); d.className = 'demoTit'; d.innerHTML = '<h1 class="logo">JET<i>//</i>Antes</h1><p class="tag"></p>'; d.querySelector('.tag').textContent = tx('title.tag'); document.body.appendChild(d); return; }
  if (qn && POR_ID[qn]) { todoAbierto = todoAbierto || QS.has('todo'); cargarNivel(POR_ID[qn]); return; }
  const p = leer(K.partida, null);
  if (p && await reanudarPartida(p, true)) return;
  mostrarScr('inicio'); refrescarInicio();
})();
// sin conexión: aviso discreto (el juego no necesita red)
addEventListener('offline', () => avisarMenu(tx('offline')));
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
