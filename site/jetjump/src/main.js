// JET//Jump — arranque, bucle, pantallas y HUD.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { COURSES, prepareCourse, ARENA } from './course.js';
import { World } from './world.js';
import { Horse } from './horse.js';
import { FenceKit, Fence } from './fences.js';
import { Ride, GEARS } from './ride.js';
import { Input } from './input.js';
import { ChaseCam, CAM_MODES, CAM_NAMES } from './camera.js';
import { Sound } from './audio.js';
import { Post } from './post.js';
import { Dust } from './dust.js';
import { T, fmt, TYPE, lang } from './text.js';
import { Ranch, relangSigns } from './ranch.js';
import { Stable } from './stable.js';
import { CareerUI } from './career-ui.js';
import { Herd, Portraits } from './herd.js';
import { COATS } from './career.js';
const VERSION = 20;

const $ = (id) => document.getElementById(id);
// textos fijos de index.html: data-i18n (texto), data-i18n-aria (aria-label), data-i18n-title (title)
function applyStatic() {
  const U = T.ui;
  document.title = U.docTitle;
  document.querySelector('meta[name=description]')?.setAttribute('content', U.docDesc);
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = U[el.dataset.i18n] ?? el.textContent;
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', U[el.dataset.i18nAria] ?? '');
  for (const el of document.querySelectorAll('[data-i18n-title]')) el.setAttribute('title', U[el.dataset.i18nTitle] ?? '');
  for (const b of document.querySelectorAll('[data-lang]')) b.setAttribute('aria-pressed', b.dataset.lang === lang() ? 'true' : 'false');
}
applyStatic();
// selector ES | EN (inicio y Ajustes): la elección vale para todo jetgames.fun (cookie jet_lang)
document.addEventListener('click', (e) => { const b = e.target.closest('[data-lang]'); if (b && window.JETIdioma) window.JETIdioma.set(b.dataset.lang); });
const store = { get(k, d) { try { const v = localStorage.getItem('jj-pro:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem('jj-pro:' + k, JSON.stringify(v)); } catch {} } };

// ---------------------------------------------------------------- calidad
const coarse = matchMedia('(pointer: coarse)').matches;
const settings = Object.assign({ quality: 'auto', sound: true, music: true, musicVol: 0.6, sfxVol: 0.9, assist: true, cam: 'chase', controls: 'auto', motion: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'normal' }, store.get('settings', {}));
function resolveQuality() {
  const q = settings.quality === 'auto' ? (coarse || (navigator.deviceMemory && navigator.deviceMemory <= 4) ? 'sd' : 'hd') : settings.quality;
  // si el vigilante ya tuvo que apagar los efectos en este equipo, se arranca sin ellos (sin tirones ni cartel)
  const post = settings.quality === 'auto' ? !store.get('nopost', false) : true;
  return q === 'hd' ? { hd: true, name: 'hd', shadow: 2048, pr: Math.min(devicePixelRatio, 1.75), post } : { hd: false, name: 'sd', shadow: 1024, pr: Math.min(devicePixelRatio, 1.5), post: false };
}
const quality = resolveQuality();

// ---------------------------------------------------------------- render
const canvas = $('c');
// estados de carga (loading / error / ready) viven en index.html (window.JJBoot); aquí sólo se informan
const Boot = window.JJBoot || { state: 'loading', progress() {}, fail() {}, ready() {}, relang() {} };
let renderer;
try {
  // el contexto WebGL se comprueba antes de pedir un solo recurso 3D: un fallo gráfico no es un fallo de red
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('WebGL context unavailable');
} catch (e) {
  Boot.fail('webgl', e && e.message || e);
  throw e;
}
// si la placa de video se queda sin memoria, se vuelve a cargar en calidad liviana
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); store.set('nopost', true); loadFail('lost', 'webglcontextlost'); });
renderer.setPixelRatio(quality.pr);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = quality.hd ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;

// ---------------------------------------------------------------- carga
const manager = new THREE.LoadingManager();
// un único estado de progreso: barra, aria-valuenow y texto salen del mismo par done/total (el total crece con recursos anidados);
// tras un fallo, los avances tardíos se ignoran y no pisan el mensaje de error
manager.onProgress = (_, done, total) => { Boot.progress(done, total); };
// kind: 'network' (descarga fallida confirmada) | 'webgl' | 'lost' | 'unknown'
function loadFail(kind, detail) { Boot.fail(kind, detail); }
const isNetErr = (e) => !!e && (e instanceof Response || e.type === 'error' || e.type === 'abort' || /fetch|network|404|Failed to load|Couldn't load|Could not load|HTTP/i.test(e.message || String(e)));
const gl = new GLTFLoader(manager), tl = new THREE.TextureLoader(manager), hl = new RGBELoader(manager);
const TL = (u) => tl.loadAsync(u);
let A;
try {
  const [horse, rider, helmet, venue, parts, skyHdr, skyJpg, sand, sandN, sandR, grass, grassN, crowd, trees, planter, brick, brickN, trees3d, crowd3d, clips] = await Promise.all([
    gl.loadAsync(`assets/horse/henry-${quality.hd ? 'hd5' : 'sd5'}.glb`), gl.loadAsync('assets/rider/rider15.glb'), gl.loadAsync('assets/rider/helmet1.glb'), gl.loadAsync('assets/venue/venue.glb'), gl.loadAsync('assets/venue/fence_parts.glb'),
    hl.loadAsync('assets/sky/sky-1k.hdr'), TL('assets/sky/sky.jpg'),
    TL('assets/tex/sand_diff.jpg'), TL('assets/tex/sand_nrm.jpg'), TL('assets/tex/sand_rough.jpg'), TL('assets/tex/grass.jpg'), TL('assets/tex/grass_nm.jpg'),
    TL('assets/tex/crowd_atlas.webp'), TL('assets/tex/trees_atlas.webp'), TL('assets/tex/planter.webp'), TL('assets/tex/brick.jpg'), TL('assets/tex/brick_bump.jpg'),
    gl.loadAsync('assets/trees/trees.glb'), quality.hd ? gl.loadAsync('assets/people/crowd.glb') : Promise.resolve(null),
    gl.loadAsync('assets/horse/henry-clips1.glb').catch(() => null),
  ]);
  A = { horse, rider, helmet, venue, parts, skyHdr, skyJpg, sand, sandN, sandR, grass, grassN, crowd, trees, planter, brick, brickN, trees3d, crowd3d, clips };
} catch (e) {
  loadFail(isNetErr(e) ? 'network' : 'unknown', e && (e.message || e.statusText || e.type) || e);
  throw e;
}
for (const t of [A.planter, A.brick]) t.colorSpace = THREE.SRGBColorSpace;
A.brick.wrapS = A.brick.wrapT = THREE.RepeatWrapping; A.brick.repeat.set(2, 0.6); A.brickN.wrapS = A.brickN.wrapT = THREE.RepeatWrapping; A.brickN.repeat.set(2, 0.6);

const world = new World(renderer, A, quality);
const S = world.scene;
const horse = new Horse(A.horse, A.rider, A.clips ? A.clips.animations : []);
horse.fitHelmet(A.helmet);
S.add(horse.root);
// rancho (centro del juego) y establo por dentro: escenas propias que comparten el renderer y el cielo
const ranch = new Ranch(renderer, A, quality, S.environment); ranch.resize(innerWidth, innerHeight);
const stable = new Stable(renderer, S.environment, quality); stable.resize(innerWidth, innerHeight);
// caballos del potrero (tus otros caballos y los pensionados) y retratos para las fichas (se crean al primer uso)
const herd = new Herd(horse, ranch.scene, ranch);
let portraits = null;
const getPortraits = () => (portraits = portraits || new Portraits(renderer, horse, S.environment));
const kit = new FenceKit(A.parts, { planter: A.planter, brick: A.brick, brickN: A.brickN });
const chase = new ChaseCam(innerWidth / innerHeight);
chase.mode = settings.cam; chase.resize(innerWidth, innerHeight); chase.reduced = settings.motion === 'reduced';
const sound = new Sound(); sound.lite = !quality.hd; sound.on = settings.sound; sound.musicOn = settings.music; sound.musicVol = settings.musicVol; sound.sfxVol = settings.sfxVol;
let post = quality.post ? new Post(renderer, S, chase.cam, quality) : null;
let slowT = 0;
const dust = new Dust(S); dust.setScale(innerHeight * quality.pr);
// un único evento de contacto por apoyo alimenta huella, polvo y sonido (mismo lugar y mismo instante)
horse.onContact = (c) => {
  const arena = state === 'play' || state === 'results';
  const sp = ride && arena ? Math.abs(ride.v) : ui && ui.roam ? Math.abs(ui.roam.v) : 0;
  if (arena) { world.hoofprint(c); dust.contact(c, sp); }
  if (arena || state === 'roam') sound.hoof(Math.min(1, (c.landing ? 1 : 0.35 + sp / 9) * (0.85 + Math.random() * 0.3)));
};
const _hv = [];

// ---------------------------------------------------------------- recorrido
let course = null, fences = [], ride = null, courseKey = 'clasico', extras = new THREE.Group(), marker = null, trainGoal = null, runOpts = {};
const bannerPaint = [];
S.add(extras);
function buildCourse(key) {
  courseKey = typeof key === 'string' ? key : null;
  for (const F of fences) S.remove(F.group);
  extras.clear(); trainGoal = null;
  course = prepareCourse(typeof key === 'string' ? COURSES[key] : key);
  fences = course.fences.map((F) => new Fence(F, kit, S));
  // líneas de salida y llegada: postes con cartel (el texto se repinta si cambia el idioma)
  const lineMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 });
  const banner = (key, col) => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const paint = () => { const x = cv.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, 256, 64); x.fillStyle = '#fff'; x.font = '800 34px Inter, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(T.hud[key], 128, 34); t.needsUpdate = true; };
    paint(); bannerPaint.push(paint);
    return new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide });
  };
  bannerPaint.length = 0;
  for (const [L, txt, col] of [[course.start, 'start', '#1f7a4c'], [course.finish, 'finishBanner', '#c0272d']]) {
    if (!L) continue;
    const a = L.dir * Math.PI / 180, lx = -Math.sin(a), lz = Math.cos(a);
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), lineMat(s > 0 ? 0xffffff : 0xc0272d));
      p.position.set(L.x + lx * L.half * s, 0.8, L.z + lz * L.half * s); p.castShadow = true; extras.add(p);
      const b = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.25), banner(txt, col));
      b.position.set(p.position.x, 1.75, p.position.z); b.rotation.y = Math.PI / 2 - a + Math.PI / 2; extras.add(b);
    }
  }
  // marcador de la valla siguiente
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false, transparent: true }));
  marker.userData.cv = cv; marker.scale.set(1.1, 1.1, 1); marker.renderOrder = 10; marker.visible = false; marker.layers.set(1); extras.add(marker);
}
function showCones(gates) {
  const cone = new THREE.ConeGeometry(0.2, 0.55, 14); cone.translate(0, 0.275, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.5 });
  const im = new THREE.InstancedMesh(cone, mat, gates.length * 2), m4 = new THREE.Matrix4();
  gates.forEach((G, i) => { const a = G.dir * Math.PI / 180, lx = -Math.sin(a), lz = Math.cos(a); for (const s of [0, 1]) { m4.makeTranslation(G.x + lx * 2.2 * (s ? 1 : -1), 0, G.z + lz * 2.2 * (s ? 1 : -1)); im.setMatrixAt(i * 2 + s, m4); } });
  im.castShadow = true; extras.add(im); extras.userData.gates = gates;
}
function coneTarget(i, pt) {
  const G = i >= 0 ? extras.userData.gates?.[i] : null;
  trainGoal = G ? { x: G.x, z: G.z, y: 1.6, label: String(i + 1) } : pt ? { x: pt.x, z: pt.z, y: 1.6, label: '↻' } : null;
}
function drawMarker(label) {
  const cv = marker.userData.cv, x = cv.getContext('2d');
  x.clearRect(0, 0, 128, 128);
  x.fillStyle = '#ecd598'; x.beginPath(); x.arc(64, 54, 40, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.moveTo(44, 86); x.lineTo(84, 86); x.lineTo(64, 116); x.fill();
  x.fillStyle = '#14231b'; x.font = '900 46px Inter, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, 64, 57);
  marker.material.map.needsUpdate = true; marker.userData.label = label;
}

// ---------------------------------------------------------------- estado
let state = 'menu', paused = false, menuT = 0;
// aprendizaje: las etiquetas de ayuda se retiran cuando el jugador ya giró, aumentó el ritmo y pidió un salto
const learned = { turn: false, faster: false, jump: false };
if (store.get('learned', false)) document.body.classList.add('learned');
function learn(k) {
  if (learned[k]) return; learned[k] = true;
  if (learned.turn && learned.faster && learned.jump) { store.set('learned', true); document.body.classList.add('learned'); }
}
const input = new Input({
  pref: settings.controls,
  onGear: (d) => { if (state === 'roam') { ui.roamGear(d); sound.ensure(); return; } if (ride && state === 'play' && !paused) { ride.shiftGear(d); updateGear(); sound.ensure(); if (d > 0) learn('faster'); } },
  onJump: () => { if (ride && state === 'play' && !paused) { ride.callJump(); sound.ensure(); } },
  onPause: () => { if (state === 'play') togglePause(); else if (state === 'roam') ui.endRoam(); },
  onCamera: () => { if (state === 'play') cycleCam(); },
  onRestart: () => { if (state === 'play' && !ui.run) confirmAsk('restart'); },     // en la carrera no se reinicia gratis
});
input.onLearn = (k) => learn(k);
input.onMode = () => keyHelp();
// cámara y pausa: pointerdown con el dedo (responde aunque el otro pulgar esté girando), click con ratón y teclado
for (const [id, fn] of [['btn-pause', () => togglePause(true)], ['btn-cam', () => cycleCam()]]) {
  let last = -1e9;
  $(id).addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; e.preventDefault(); last = performance.now(); if (state === 'play') fn(); });
  $(id).addEventListener('click', (e) => { if (performance.now() - last < 700) return; if (state === 'play') fn(); if (e.detail > 0) e.currentTarget.blur(); });
}
// la música y el sonido arrancan con el primer gesto (toque, clic o tecla), como piden los navegadores
// (en teléfonos el permiso de audio llega al soltar el dedo, por eso también pointerup y touchend)
for (const ev of ['pointerdown', 'pointerup', 'touchend', 'keydown']) addEventListener(ev, () => sound.ensure(), { passive: true });

function startGame(key) { startRun(key, {}); }
function startRun(def, opts = {}) {
  runOpts = opts; graceT = 2;
  buildCourse(def);
  // el caballo vuelve a la pista, montado, con el pelaje y el estado de cuidado de la carrera (o limpio)
  horse.moveTo(S); horse.showRider(true); horse.idleAlt = false;
  horse.setTack({ saddle: true, bridle: true, leather: opts.leather || [0.30, 0.17, 0.09] });
  horse.idleClip = null;
  horse.setCoat(opts.coat || COATS.zaino, opts.marks); horse.setBreed(opts.shape); horse.setCare(opts.care || { dirt: 0, sweat: 0, wet: 0 });
  ride = new Ride(course, fences, horse, { assist: settings.assist, mods: opts.mods });
  world.clearTracks();
  horse.mode = 'loco';
  chase.first = true;
  state = 'play'; paused = false; input.active = true; input.clear();
  msgLog.length = 0; cur = null; $('toast').className = '';
  for (const id of ['menu', 'hub', 'task', 'roam-bar', 'photo']) $(id).classList.add('hidden');
  $('hud').classList.remove('hidden', 'roam'); closeModal();
  $('hud').classList.toggle('train', !!course.training);
  $('conf').hidden = !ride.conf;
  $('h-ta').textContent = course.ta ? `${T.hud.time} · ${T.hud.limit(course.ta).toLowerCase()}` : '';
  $('h-pen-l').textContent = T.hud.penalty;
  updateGear(); camLabel(); keyHelp(); hud(0);
  $('hud').classList.toggle('nojump', !!opts.noJump);
  say(opts.noJump ? (input.mode === 'touch' ? T.msg.startTouchNoJump : T.msg.startKeysNoJump) : input.mode === 'touch' ? T.msg.startTouch : T.msg.startKeys, '', '', 1, 4);
  sound.ensure(); sound.bell();
}
function toMenu() {
  if (newVer > VERSION) { location.reload(); return; }      // hay una versión nueva: se carga al volver al menú
  state = 'menu'; ride = null; input.active = false; paused = false; input.clear();
  if (ui) { ui.run = null; ui.state = null; }
  for (const id of ['hud', 'hub', 'task', 'roam-bar', 'photo']) $(id).classList.add('hidden');
  $('menu').classList.remove('hidden'); closeModal(); marker.visible = false; world.guide(0, 0, 0, false);
  menuRanch(0, true);
  showBest();
  $('m-play').focus({ preventScroll: true });
}
function togglePause(force) {
  if (state !== 'play') return;
  paused = force ?? !paused;
  input.clear();
  if (paused) pauseMenu(); else { closeModal(); sound.wake(); }   // «Continuar» siempre despierta la música (al volver de otra pestaña el teléfono la deja callada)
}
function pauseMenu() {
  const tr = course.training, car = !!(ui && ui.run);
  const log = msgLog.length ? `<h3>${T.pause.log}</h3>${msgLog.slice(-4).map((m) => `<p>${m}</p>`).join('')}` : '';
  openModal(`<h2 id="modal-title">${T.pause.title}</h2>
    <div><div class="btns">
      <button class="btn primary" data-a="resume" data-autofocus><span>${T.pause.resume}</span><span aria-hidden="true">→</span></button>
      <button class="btn" data-a="help"><span>${T.pause.help}</span></button>
      <button class="btn" data-a="settings"><span>${T.pause.settings}</span></button>
    </div>${log}</div>
    <div><div class="sep"></div><div class="btns">
      ${car ? '' : `<button class="btn danger" data-a="ask-restart"><span>${tr ? T.pause.restartTrain : T.pause.restart}</span></button>`}
      <button class="btn danger" data-a="${car ? 'abandon' : 'ask-home'}"><span>${car ? (tr ? T.pause.endCareerTrain : T.pause.retire) : tr ? T.pause.endTrain : T.pause.home}</span></button>
    </div></div>`, 'split', { escape: () => togglePause(false), re: () => pauseMenu() });
}
// confirmación de acciones que pierden el intento (desde la partida; tras el resultado no se pregunta)
function confirmAsk(kind) {
  if (state !== 'play') return;
  if (!paused) { paused = true; input.clear(); }
  const R = kind === 'restart';
  openModal(`<h2 id="modal-title">${R ? T.pause.confirmRestart : T.pause.confirmHome}</h2>
    <p>${R ? T.pause.confirmRestartTxt : T.pause.confirmHomeTxt}</p>
    <div class="btns"><button class="btn primary" data-a="pause" data-autofocus><span>${T.pause.resume}</span></button>
    <button class="btn danger" data-a="${R ? 'restart' : 'menu'}"><span>${R ? T.pause.confirmYesRestart : T.pause.confirmYesHome}</span></button></div>`, '', { escape: () => pauseMenu() });
}
function camTarget() { if (!ride) return null; const F = ride.training ? ride.target() : fences[ride.next]; if (F) return { x: F.F.x, z: F.F.z }; const L = course.finish; return L && !ride.finished ? { x: L.x, z: L.z } : null; }
function setCam(m) { settings.cam = chase.mode = m; store.set('settings', settings); camLabel(); }
function cycleCam() { setCam(CAM_MODES[(CAM_MODES.indexOf(chase.mode) + 1) % CAM_MODES.length]); say(T.msg.view(T.cams[chase.mode]), '', '', 1, 1.5); }
function camLabel() { $('cam-cur').textContent = T.cams[chase.mode]; $('btn-cam').setAttribute('aria-label', `${T.actions.camera} (${T.cams[chase.mode]})`); }
function keyHelp() {
  $('keyhelp').innerHTML = `<span>${T.actions.turn} <kbd>A</kbd> <kbd>D</kbd></span><span>${T.actions.faster} <kbd>W</kbd></span><span>${T.actions.slower} <kbd>S</kbd></span><span>${T.actions.camera} <kbd>C</kbd></span><span>${T.actions.pause} <kbd>Esc</kbd></span>`;
  $('btn-jump').setAttribute('aria-keyshortcuts', input.mode === 'touch' ? '' : 'Space');
}

// ---------------------------------------------------------------- ventanas (diálogo accesible)
let modalOpts = null, modalOpener = null;
function openModal(html, cls = '', opts = {}) {
  const c = $('modal-card');
  if (!$('modal').classList.contains('open')) modalOpener = document.activeElement;
  c.className = 'card ' + cls; c.innerHTML = html; modalOpts = opts;
  $('modal').classList.add('open'); input.blocked = true;
  for (const id of ['menu', 'hud', 'hub', 'task', 'roam-bar', 'photo']) $(id).inert = true;
  const f = c.querySelector('[data-autofocus]') || c.querySelector('button,input,a');
  f?.focus({ preventScroll: true });
}
function closeModal() {
  if (!$('modal').classList.contains('open')) return;
  $('modal').classList.remove('open'); input.blocked = false; modalOpts = null;
  for (const id of ['menu', 'hud', 'hub', 'task', 'roam-bar', 'photo']) $(id).inert = false;
  if (modalOpener && modalOpener.isConnected && modalOpener.offsetParent) modalOpener.focus({ preventScroll: true });
  modalOpener = null;
}
// teclado dentro de la ventana: Tab y Mayús+Tab circulan por sus controles; Escape vuelve atrás sin salir del juego
$('modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); modalOpts?.escape ? modalOpts.escape() : closeModal(); return; }
  if (e.key !== 'Tab') return;
  const els = [...$('modal-card').querySelectorAll('button,a[href],input:not([disabled])')].filter((x) => x.offsetParent || x.type === 'radio');
  const radios = new Set(); const focusables = els.filter((x) => { if (x.type !== 'radio') return true; if (radios.has(x.name)) return false; radios.add(x.name); return true; });
  if (!focusables.length) return;
  const first = focusables[0], last = focusables[focusables.length - 1];
  const act = document.activeElement, inGroup = (el, x) => el && x && el.type === 'radio' && x.type === 'radio' && el.name === x.name;
  if (e.shiftKey && (act === first || inGroup(act, first))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (act === last || inGroup(act, last))) { e.preventDefault(); first.focus(); }
});
$('modal').addEventListener('click', (e) => {
  const b = e.target.closest('[data-a]');
  if (!b) { if (e.target.id === 'modal' && state === 'menu') closeModal(); return; }
  const a = b.dataset.a;
  if (ui.modalAction(a, b.dataset)) return;
  if (a === 'abandon') {
    // retirarse de un concurso pierde la inscripción: se confirma; un entrenamiento cuenta solo lo hecho
    if (!ride || ride.finished || ride.elim) { closeModal(); return; }
    if (ui.run && ui.run.kind === 'train') { paused = false; closeModal(); ui.run.score = ui.trainProgress(); endRun(); return; }
    openModal(`<h2 id="modal-title">${T.pause.retireAsk}</h2><p>${T.pause.retireTxt(ui.run ? ui.run.fee : 0)}</p>
      <div class="btns"><button class="btn primary" data-a="pause" data-autofocus><span>${T.pause.retireKeep}</span></button><button class="btn danger" data-a="abandon-ok"><span>${T.pause.retireYes}</span></button></div>`, '', { escape: () => pauseMenu() });
    return;
  }
  if (a === 'abandon-ok') { paused = false; closeModal(); if (ride && !ride.finished && !ride.elim && ui.run) { ride.elim = 'Retiro'; state = 'results'; input.active = false; input.clear(); ui.onRunEnd(ride, true); } return; }
  if (a === 'resume') togglePause(false);
  else if (a === 'pause') pauseMenu();
  else if (a === 'help') howTo(state === 'play');
  else if (a === 'settings') settingsMenu(true);
  else if (a === 'ask-restart') confirmAsk('restart');
  else if (a === 'ask-home') course.training ? toMenu() : confirmAsk('home');
  else if ((a === 'restart' || a === 'again') && !ui.run && courseKey) startGame(courseKey);
  else if (a === 'menu') toMenu();
  else if (a === 'close') { if (state === 'play' && paused) pauseMenu(); else closeModal(); }
});
// ajustes: selección directa (opciones visibles), se aplican y guardan al momento, sin recargar
function settingsMenu() {
  const radio = (name, cur, opts) => `<div class="opts">${opts.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}"${v === cur ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  const S2 = T.settings;
  const slider = (name, v, label) => { const p = Math.round(v * 100); return `<label class="vol"><span class="sr">${label}</span><input type="range" name="${name}" min="0" max="100" step="5" value="${p}" aria-label="${label}" aria-valuetext="${p} %"><output>${p} %</output></label>`; };
  openModal(`<h2 id="modal-title">${S2.title}</h2>
    <div>
      <fieldset class="set"><legend>${S2.lang}</legend><div class="langseg big" role="group" aria-label="${T.ui.langGroup}"><button type="button" data-lang="es" aria-pressed="${lang() === 'es'}">ES</button><button type="button" data-lang="en" aria-pressed="${lang() === 'en'}">EN</button></div><p class="note">${S2.langNote}</p></fieldset>
      <fieldset class="set"><legend>${S2.cam}</legend>${radio('cam', chase.mode, CAM_MODES.map((m) => [m, T.cams[m]]))}</fieldset>
      <fieldset class="set"><legend>${S2.quality}</legend>${radio('quality', settings.quality, [['auto', S2.qAuto], ['hd', S2.qHigh], ['sd', S2.qLow]])}<p class="note">${S2.qNote}</p></fieldset>
      <fieldset class="set"><legend>${S2.controls}</legend>${radio('controls', settings.controls, [['auto', S2.cAuto], ['keys', S2.cKeys], ['touch', S2.cTouch]])}</fieldset>
    </div><div>
      <fieldset class="set"><legend>${S2.music}</legend>${radio('music', settings.music ? 'on' : 'off', [['on', S2.onF], ['off', S2.offF]])}${slider('musicVol', settings.musicVol, S2.volume(S2.music))}</fieldset>
      <fieldset class="set"><legend>${S2.sound}</legend>${radio('sound', settings.sound ? 'on' : 'off', [['on', S2.on], ['off', S2.off]])}${slider('sfxVol', settings.sfxVol, S2.volume(S2.sound))}</fieldset>
      <fieldset class="set"><legend>${S2.assist}</legend>${radio('assist', settings.assist ? 'on' : 'off', [['on', S2.onF], ['off', S2.offF]])}<p class="note">${S2.assistInfo}</p></fieldset>
      <fieldset class="set"><legend>${S2.motion}</legend>${radio('motion', settings.motion, [['normal', S2.mNormal], ['reduced', S2.mReduced]])}</fieldset>
      ${canFull() ? `<fieldset class="set"><legend>${S2.full}</legend>${radio('full', document.fullscreenElement ? 'on' : 'off', [['on', S2.onF], ['off', S2.offF]])}</fieldset>` : ''}
      <p class="note">${S2.saved}</p>
      <div class="btns"><button class="btn primary" data-a="close"><span>${S2.back}</span></button></div>
    </div>`, 'split', { escape: () => (state === 'play' && paused ? pauseMenu() : closeModal()), re: () => settingsMenu(), settings: true });
  syncVol();
}
$('modal').addEventListener('change', (e) => {
  const el = e.target; if (el.type !== 'radio') return;
  const v = el.value;
  if (el.name === 'cam') setCam(v);
  else if (el.name === 'quality') applyQuality(v);
  else if (el.name === 'controls') { settings.controls = v; input.setPref(v); }
  else if (el.name === 'sound') { settings.sound = v === 'on'; sound.setOn(settings.sound); syncVol(); }
  else if (el.name === 'music') { settings.music = v === 'on'; sound.setMusic(settings.music); syncVol(); }
  else if (el.name === 'assist') { settings.assist = v === 'on'; if (ride) ride.assist = settings.assist; }
  else if (el.name === 'motion') { settings.motion = v; chase.reduced = v === 'reduced'; }
  else if (el.name === 'full') { setFull(v === 'on'); return; }
  store.set('settings', settings);
});
// pantalla completa (donde el navegador la permite y el juego no está ya instalado a pantalla completa);
// entrar, salir con Esc o girar el teléfono solo dispara «resize», que reacomoda lienzo, cámaras y efectos
function canFull() { return !!(document.fullscreenEnabled && document.documentElement.requestFullscreen) && (!!document.fullscreenElement || !matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches); }
function setFull(on) {
  const p = on ? (document.fullscreenElement ? null : document.documentElement.requestFullscreen({ navigationUI: 'hide' })) : (document.fullscreenElement ? document.exitFullscreen() : null);
  if (p) p.catch(() => syncFull());
}
function syncFull() { const on = !!document.fullscreenElement; for (const r of $('modal-card').querySelectorAll('input[name=full]')) r.checked = (r.value === 'on') === on; }
document.addEventListener('fullscreenchange', () => { syncFull(); dispatchEvent(new Event('resize')); });
// volúmenes: deslizadores que se aplican mientras se arrastran y se guardan al soltar
function syncVol() { for (const [n, on] of [['sfxVol', settings.sound], ['musicVol', settings.music]]) { const r = $('modal-card').querySelector(`input[name=${n}]`); if (r) { r.disabled = !on; r.closest('label').classList.toggle('off', !on); } } }
$('modal').addEventListener('input', (e) => {
  const el = e.target; if (el.type !== 'range') return;
  const v = +el.value / 100; settings[el.name] = v;
  if (el.name === 'musicVol') sound.setMusicVol(v); else if (el.name === 'sfxVol') { sound.setSfxVol(v); sound.ensure(); sound.hoof(0.8); }
  el.nextElementSibling.textContent = el.value + ' %'; el.setAttribute('aria-valuetext', el.value + ' %');
  store.set('settings', settings);
});
$('m-career').onclick = () => ui.enterRanch();
$('m-play').onclick = () => startGame('clasico');
$('m-train').onclick = () => startGame('practica');
$('m-how').onclick = () => howTo(false);
$('m-settings').onclick = () => settingsMenu();
function howTo(fromPause) {
  const touch = input.mode === 'touch', H = T.help;
  openModal(`<h2 id="modal-title">${H.title}</h2><div class="how">
    <p>${touch ? H.fasterTouch : H.fasterKeys}</p>
    <p>${touch ? H.slowerTouch : H.slowerKeys}</p>
    <p>${touch ? H.reverseTouch : H.reverseKeys}</p>
    <p>${touch ? H.turnTouch : H.turnKeys}</p>
    <p>${H.follow}</p>
    <p>${touch ? H.jumpTouch : H.jumpKeys} ${H.auto}</p>
    <p>${H.gallop}</p>
    <p>${H.goal}</p>
    <p>${H.scoring}</p>
    <p>${H.confidence}</p>
    <p>${H.refuse} ${H.oxer}</p>
    ${touch ? '' : `<p>${H.keys}</p>`}
  </div><div class="btns"><button class="btn primary" data-a="close" data-autofocus><span>${H.back}</span></button></div>`, 'wide', { escape: () => (fromPause ? pauseMenu() : closeModal()), re: () => howTo(fromPause) });
}
function showBest() {
  const b = store.get('best-clasico', null);
  $('m-best').textContent = b ? T.menu.best(b) : '';
}
// textos del inicio (una sola fuente: text.js)
function menuTexts() {
  $('m-eyebrow').textContent = T.menu.eyebrow; $('m-lead').textContent = T.menu.lead;
  $('m-career-t').textContent = T.menu.career; $('m-career-s').textContent = T.menu.careerSub;
  $('m-play-t').textContent = T.menu.play; $('m-play-s').textContent = T.menu.playSub(COURSES.clasico.fences.length, COURSES.clasico.ta);
  $('m-train-t').textContent = T.menu.train; $('m-train-s').textContent = T.menu.trainSub;
  $('m-how').textContent = T.menu.help; $('m-credits').textContent = T.menu.credits;
  $('m-settings').textContent = T.menu.settings; $('m-ver').textContent = T.menu.version(VERSION);
  $('m-credits').setAttribute('href', `credits.html?lang=${lang()}`);
  showBest();
}
menuTexts();

// ---------------------------------------------------------------- calidad sin recargar
function applyQuality(q) {
  settings.quality = q; store.set('settings', settings);
  if (q !== 'auto') store.set('nopost', false);
  const Q = resolveQuality();
  quality.pr = Q.pr; quality.post = Q.post; quality.shadow = Q.shadow;
  renderer.setPixelRatio(Q.pr); renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.type = Q.hd ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  const sun = world.sun; if (sun) { sun.shadow.mapSize.set(Q.shadow, Q.shadow); sun.shadow.map?.dispose(); sun.shadow.map = null; }
  if (Q.post && !post) { post = new Post(renderer, S, chase.cam, Q); post.setSize?.(innerWidth, innerHeight); }
  if (!Q.post && post) dropPost();
  dust.setScale(innerHeight * Q.pr);
  slowT = 0;
}
function dropPost() { try { post.composer?.dispose?.(); } catch {} post = null; }

// ---------------------------------------------------------------- HUD
// avisos: uno por vez, con prioridad (fin > penalización > recuperación > éxito > sistema)
let cur = null; const msgLog = [];
function say(title, sub = '', cls = '', prio = 2, sec) {
  if (cur && cur.t > 0 && prio < cur.prio) return;
  const d = sec ?? Math.min(2.5, Math.max(1.5, 1.2 + (title.length + sub.length) / 45));
  cur = { prio, t: d };
  $('toast-t').textContent = title; $('toast-s').textContent = sub; $('toast').className = 'show ' + cls;
  if (prio >= 2) { msgLog.push(sub ? `${title} ${sub}` : title); if (msgLog.length > 8) msgLog.shift(); }
}
const GAIT_V = GEARS.map((g) => g.v);
let gearShown = -1;
function updateGear() {
  if (!ride) return;
  gearShown = ride.gear;
}
// ritmo real (lo que hace el caballo) y objetivo (lo pedido) por separado
function gaitText(R) {
  const v = R.v, G = T.gait;
  if (v < -0.15) return G.reverse;
  if (Math.abs(v) < 0.25) return G.stopped;
  if (GAIT_V[R.gear] < v - 0.6 && R.gear <= 1) return G.braking;
  return v < 2.4 ? G.walk : v < 6.5 ? G.gallop : G.fast;
}
const mm = $('minimap').getContext('2d');
let rejectT = 0;
function hud(dt) {
  const R = ride;
  const F = R.training ? R.target() : fences[R.next];
  if (R.training && ui.run) { /* el entrenamiento escribe su objetivo (career-ui.js) */ }
  else if (R.training) {
    $('h-target').textContent = F ? T.hud.fenceTrain(F.F.n) : T.hud.freeTrain;
    $('h-sub').textContent = F ? `${TYPE[F.F.type]} · ${fmt.meters(F.F.h)}` : T.hud.freeTrainSub;
  } else if (F) {
    $('h-target').textContent = T.hud.fence(R.next + 1, fences.length);
    $('h-sub').textContent = `${TYPE[F.F.type]} · ${fmt.meters(F.F.h)}`;
  } else { $('h-target').textContent = T.hud.finish; $('h-sub').textContent = T.hud.finishSub; }
  $('h-time').textContent = fmt.secLive(R.time);
  $('h-faults').textContent = fmt.pts(R.faults);
  $('h-speed').textContent = Math.round(Math.abs(R.v) * 3.6);
  $('g-name').textContent = gaitText(R);
  const want = GAIT_V[R.gear], off = Math.abs(want - R.v) > 0.5 && !R.jump && !R.refuse && !R.finished && !R.elim;
  // el objetivo solo se muestra si difiere de lo que el caballo ya hace
  const gn = $('g-name').textContent, goalName = T.gearName[R.gear];
  $('g-obj').textContent = off && goalName !== gn && !(gn === T.gait.gallop && R.gear >= 3 && R.v > 2.4) ? T.hud.goal(goalName) : '';
  if (R.gear !== gearShown) updateGear();
  // indicador de salto: el estado sale de la lógica (ride.jumpUI), el nombre de la acción no cambia
  const js = R.jumpUI(), wrap = $('jump-wrap');
  $('jump-state').textContent = { none: '', prep: T.jump.prep, ready: T.jump.ready, requested: T.jump.requested, air: T.jump.air, land: '' }[js];
  wrap.classList.toggle('ready', js === 'ready'); wrap.classList.toggle('req', js === 'requested');
  $('btn-jump').setAttribute('aria-disabled', js === 'air' || js === 'land' ? 'true' : 'false');
  // al vencer, el aviso se retira también del árbol accesible (no se vuelve a anunciar)
  if (cur && cur.t > 0) { cur.t -= dt; if (cur.t <= 0) { $('toast').className = ''; setTimeout(() => { if (!cur || cur.t <= 0) { $('toast-t').textContent = ''; $('toast-s').textContent = ''; } }, 250); } }
  rejectT -= dt;
  // marcador y flecha hacia el siguiente obstáculo (o la llegada)
  let goal = trainGoal || (F ? { x: F.F.x, z: F.F.z, y: (F.F.type === 'wall' ? F.F.h + 0.6 : 1.7) + 0.9, label: F.F.n } : (!R.training && course.finish ? { x: course.finish.x, z: course.finish.z, y: 2.6, label: '⚑' } : null));
  if (R.conf) { const k = R.confRatio(); const b = $('conf-bar'); b.style.width = Math.round(k * 100) + '%'; b.className = k > 0.55 ? 'ok' : k > 0.3 ? 'warn' : 'bad'; }
  // lejos y sin alinear, el marcador señala la entrada del obstáculo (11 m delante, sobre su eje)
  if (F && !R.jump && !trainGoal) {
    const q = F.toLocal(R.x, R.z), cos = Math.cos(R.h) * F.F.f.x + Math.sin(R.h) * F.F.f.z;
    const aligned = q.a < -2 && cos > 0.85 && Math.abs(q.b) < F.F.half;
    if ((!aligned && q.a < 6 && Math.hypot(F.F.x - R.x, F.F.z - R.z) > 9) || q.a >= 6) goal = { ...goal, x: F.F.x - F.F.f.x * 11, z: F.F.z - F.F.f.z * 11, y: 1.6 };
  }
  marker.visible = !!goal && !R.jump && Math.hypot(goal.x - R.x, goal.z - R.z) > 7;
  if (goal) {
    if (marker.userData.label !== goal.label) { drawMarker(goal.label); $('arrow').setAttribute('aria-label', T.hud.next(goal.label)); }
    marker.position.set(goal.x, goal.y + (chase.reduced ? 0 : Math.sin(performance.now() / 300) * 0.12), goal.z);
    const p = new THREE.Vector3(goal.x, goal.y, goal.z).project(chase.cam);
    const offs = p.z > 1 || Math.abs(p.x) > 0.92 || Math.abs(p.y) > 0.9;
    const ar = $('arrow'); ar.style.display = offs ? 'block' : 'none';
    if (offs) {
      let x = p.x, y = p.y; if (p.z > 1) { x = -x; y = -y; }
      const k = 0.86 / Math.max(Math.abs(x), Math.abs(y), 0.0001); x *= k; y *= k;
      ar.style.left = ((x + 1) / 2 * innerWidth) + 'px'; ar.style.top = ((1 - y) / 2 * innerHeight) + 'px';
      ar.style.transform = `rotate(${Math.atan2(-y, x)}rad)`;
    }
  }
  // minimapa (en pantallas anchas)
  if (innerWidth > 560) {
    const W = 264, H = 180, sx = W / (ARENA.w + 8), sz = H / (ARENA.h + 8);
    const P = (x, z) => [W / 2 + x * sx, H / 2 + z * sz];
    mm.clearRect(0, 0, W, H); mm.fillStyle = '#0d241acc'; mm.beginPath(); mm.roundRect(0, 0, W, H, 18); mm.fill();
    mm.fillStyle = '#c9b48e33'; mm.fillRect(...P(-ARENA.w / 2, -ARENA.h / 2), ARENA.w * sx, ARENA.h * sz);
    fences.forEach((G) => {
      const D = G.F, [x, y] = P(D.x, D.z), dn = !R.training && fences.indexOf(G) < R.next, nx = G === F;
      mm.strokeStyle = nx ? '#ecd598' : dn ? '#f4ecdb44' : '#f4ecdbcc'; mm.lineWidth = nx ? 7 : 4;
      mm.beginPath(); mm.moveTo(x - D.l.x * D.half * sx, y - D.l.z * D.half * sz); mm.lineTo(x + D.l.x * D.half * sx, y + D.l.z * D.half * sz); mm.stroke();
    });
    const [hx, hy] = P(R.x, R.z);
    mm.fillStyle = '#5fd39a'; mm.beginPath(); mm.arc(hx, hy, 6, 0, Math.PI * 2); mm.fill();
    mm.strokeStyle = '#5fd39a'; mm.lineWidth = 3; mm.beginPath(); mm.moveTo(hx, hy); mm.lineTo(hx + Math.cos(R.h) * 14, hy + Math.sin(R.h) * 14); mm.stroke();
  }
}

// eventos del recorrido → avisos y sonido (una causa y una acción por aviso)
const DIST = { get perfect() { return [T.msg.jumpClean, 'good', T.msg.distGood]; }, get long() { return [T.msg.distLong, 'warn', '']; }, get deep() { return [T.msg.distDeep, 'warn', '']; } };
let tipShown = false;
function handleEvents() {
  const touch = input.mode === 'touch', M = T.msg;
  for (const e of ride.events.splice(0)) {
    if (e.type === 'takeoff') sound.takeoff();
    else if (e.type === 'land') {
      sound.land(); ui.trainEvent(e);
      if (e.clear) {
        sound.crowd('small'); cheer = Math.max(cheer, 0.5);
        if (e.grade === 'good') { const [t, c, s] = DIST[e.quality] || DIST.perfect; say(t, s, c, 2); }
        else if (e.grade === 'early') say(M.jumpEarly, '', 'warn', 2);
        else { say(M.jumpAuto, tipShown ? '' : touch ? M.tipTouch : M.tipKeys, '', 2, tipShown ? 1.6 : 3); tipShown = true; }
      }
    }
    else if (e.type === 'call') {
      if (e.grade === 'good' || e.grade === 'early') { learn('jump'); navigator.vibrate?.(e.grade === 'good' ? 18 : 8); }
      else if (rejectT <= 0) {
        rejectT = 1.2;
        say({ far: M.far, slow: M.slow, align: T.msg.why.off, none: M.noJump }[e.grade] || M.noJump, '', 'warn', 1, 1.6);
      }
    }
    else if (e.type === 'gear') updateGear();
    else if (e.type === 'slow') say(M.slow, touch ? M.slowTipTouch : M.slowTipKeys, 'warn', 3);
    else if (e.type === 'block') {
      sound.knock(); navigator.vibrate?.(40);
      say(e.what === 'cerco' ? M.fenceLimit : e.wrong ? M.wrongFence(e.next) : M.contact, touch ? M.recoverTouch : M.recoverKeys, 'bad', 3);
    }
    else if (e.type === 'knock') { sound.knock(); say(ride.training ? M.knockTrain : M.knock, '', 'bad', 4); }
    else if (e.type === 'refuse') say(e.faults ? M.refuse : M.refuseTrain, M.why[e.why] || M.why.other, 'bad', 4, 3);
    else if (e.type === 'start') say(M.go, '', '', 1, 1.2);
    else if (e.type === 'elim') { say(M.elim, '', 'bad', 5, 2.5); setTimeout(() => results(), 1600); }
    else if (e.type === 'finish') { sound.crowd(e.faults === 0 ? 'big' : 'small'); if (e.faults === 0) sound.fanfare(); cheer = e.faults === 0 ? 1 : 0.6; setTimeout(() => results(), 1400); }
  }
}
let cheer = 0, tvSign = 1;
// cámara TV: la dirección sigue a la pantalla (derecha en el pulgar = derecha en la imagen), con histéresis
function steerForScreen(s) {
  if (chase.mode !== 'tv' || !ride) { tvSign = 1; return s; }
  const e = chase.cam.matrixWorld.elements, rx = e[0], rz = e[2];
  const d = (-Math.sin(ride.h)) * rx + Math.cos(ride.h) * rz;
  if (d > 0.3) tvSign = 1; else if (d < -0.3) tvSign = -1;
  return s * tvSign;
}
function endRun() {
  if (state !== 'play') return;
  state = 'results'; input.active = false; input.clear();
  ui.onRunEnd(ride);
}
function results() {
  if (state !== 'play') return;
  if (ui.run) return endRun();
  state = 'results'; input.active = false; input.clear();
  const R = ride, ok = !R.elim, Rz = T.results;
  // mejor resultado: menos puntos y, a igualdad, menor tiempo (solo recorridos completos)
  let best = store.get('best-' + courseKey, null), isBest = false;
  if (ok && (!best || R.faults < best.faults || (R.faults === best.faults && R.time < best.time))) { best = { faults: R.faults, time: R.time }; store.set('best-' + courseKey, best); isBest = true; }
  const title = !ok ? Rz.stopped : R.faults === 0 ? Rz.clean : Rz.done;
  const lines = [];
  if (!ok) { lines.push(Rz.elimWhy); if (R.lastRefuse) lines.push(Rz.lastCause(Rz.causes[R.lastRefuse] || Rz.causes.other)); }
  lines.push(Rz.progress(Math.min(R.next, fences.length), fences.length));
  lines.push(Rz.breakdown(R.knocks, R.refusals, R.timeFaults || 0));
  if (R.timeFaults) lines.push(Rz.overTime(R.timeFaults, course.ta));
  if (R.stats.jumps) lines.push(Rz.distance(R.stats.perfect, R.stats.jumps));
  if (isBest) lines.push(`<b>${Rz.best}</b> ${Rz.bestRule}`);
  openModal(`<div class="eyebrow">${Rz.eyebrow(course.name)}</div><h2 id="modal-title">${title}</h2>
    <div class="score"><div role="group" aria-label="${Rz.penaltyFull(R.faults)}"><b>${fmt.points(R.faults)}</b><small>${Rz.penalty}</small></div><div role="group" aria-label="${Rz.timeFull(fmt.secFinal(R.time))}"><b>${fmt.secFinal(R.time)} s</b><small>${Rz.time}</small></div></div>
    ${lines.map((l) => `<p>${l}</p>`).join('')}
    <div class="btns"><button class="btn primary" data-a="again" data-autofocus><span>${Rz.retry}</span><span aria-hidden="true">↻</span></button><button class="btn" data-a="menu"><span>${Rz.home}</span></button></div>`, '', { escape: () => {} });
}

// ---------------------------------------------------------------- bucle
const clock = new THREE.Clock();
let graceT = 0;
function frame() {
  // a bajos fps la simulación no pierde tiempo (hasta 1/4 s por cuadro, en pasos de 1/60);
  // una pausa más larga (pestaña oculta, ventana inactiva) ya abre el menú de pausa
  const raw = clock.getDelta();
  graceT -= Math.min(raw, 0.25);
  // al cambiar de escena el primer cuadro compila sombreadores: no es un bloqueo del jugador
  if (raw > 1.5 && state === 'play' && !paused && graceT <= 0) { togglePause(true); return renderer.render(S, chase.cam); }   // bloqueo severo: pausa explícita
  const dt = Math.min(0.25, raw) * (window.__ts || 1);   // __ts: cámara lenta para la batería de pruebas
  sound.setMood(state === 'play' ? 'arena' : 'ranch');   // en pista la música se retira para dejar oír los cascos
  if (state === 'menu' || state === 'ranch') { if (state === 'menu') menuRanch(dt); else ui.ranchFrame(dt); renderer.render(ranch.scene, ranch.cam); return; }
  if (state === 'stable') { ui.stableFrame(dt); renderer.render(stable.scene, stable.cam); return; }
  if (state === 'roam') { ui.roamFrame(dt); renderer.render(ranch.scene, chase.cam); return; }
  if (state === 'photo') { ui.photoFrame(dt); renderer.render(ranch.scene, ui.photoCam.cam); return; }
  if (!ride) { menuRanch(dt); renderer.render(ranch.scene, ranch.cam); return; }
  {
    if (!paused) {
      const inp = input.read(dt); inp.steer = steerForScreen(inp.steer);
      // física en pasos fijos de 1/60 s: el resultado no depende de los cuadros por segundo del teléfono
      const steps = Math.min(15, Math.ceil(dt / (1 / 60) - 1e-6)), sub = dt / Math.max(1, steps);
      for (let k = 0; k < steps; k++) {
        if (state === 'play') ride.update(sub, inp); else ride.update(sub, { steer: 0 });
        placeHorse(sub);

      }
      for (const F of fences) F.update(dt);
      handleEvents();
      if (state === 'play' && ui.run && ui.run.kind === 'train') { const r = ui.trainFrame(ride, dt); if (r) { ui.run.score = r.score; endRun(); } }
    }
    chase.update(dt, ride, horse, camTarget());
    world.guide(ride.x, ride.z, ride.h, state === 'play' && !ride.jump && !ride.finished && !ride.elim && Math.abs(ride.v) > 0.5);
    world.follow(ride.x, ride.z);
    if (state === 'play') hud(dt);
  }
  cheer = Math.max(0, cheer - dt * 0.25);
  world.update(dt, cheer);
  dust.update(dt);
  if (post) {
    post.draw(dt);
    // vigilante: si el dispositivo no llega a 24 cuadros por segundo durante 6 s, se apagan los efectos de cine
    // la decisión se guarda: la próxima vez arranca liviano. En el menú se apaga sin cartel.
    if (settings.quality === 'auto') { slowT = dt > 1 / 24 ? slowT + dt : Math.max(0, slowT - dt * 2); if (slowT > 6) { dropPost(); store.set('nopost', true); if (state === 'play' && !(ride && ride.jump)) say(T.msg.quality, '', 'warn', 1, 2); } }
  } else renderer.render(S, chase.cam);
}
function placeHorse(dt) {
  horse.root.position.set(ride.x, 0, ride.z);
  horse.root.rotation.y = Math.PI / 2 - ride.h;
  horse.update(dt, ride.animState());
  world.hoofShadows(horse.hooves(_hv));
}
// menú: el rancho de fondo, con el caballo en el potrero
let menuIdleT = 0;
function menuRanch(dt, setup) {
  if (setup || horse.root.parent !== ranch.scene) {
    const h = ui && ui.p ? ui.p.horses.find((x) => x.id === ui.p.active) : null;
    horse.moveTo(ranch.scene); horse.showRider(false); horse.setTack({ saddle: false, bridle: false });
    horse.setCoat(COATS[h ? h.coat : 'zaino'], h && h.marks); horse.setBreed(h && h.shape); horse.setCare(h ? { dirt: h.dirt, sweat: h.sweat, wet: h.wet } : { dirt: 0, sweat: 0, wet: 0 });
    horse.root.position.set(24, 0, 9); horse.root.rotation.y = -0.9; ranch.camTo('home', 0.01); ranch.follow(10, 2);
  }
  menuIdleT -= dt; if (menuIdleT <= 0) { horse.idleAlt = !horse.idleAlt; menuIdleT = 8 + Math.random() * 6; }
  horse.update(dt, { v: 0, turn: 0, jump: null });
  herd.update(dt, [{ x: 24, z: 9, h: Math.PI / 2 + 0.9 }]);
  ranch.update(dt);
}
// (antes) menú: el caballo pasea al paso y la cámara gira lenta alrededor
// óvalo dentro de la pista, en una zona sin vallas (entre la salida y la valla 1): nunca sale ni atraviesa nada
const MENU_OVAL = { cx: -37, cz: 11, rx: 6.5, rz: 4.2 };
const menuRide = { x: -37 + 6.5, z: 11, h: Math.PI / 2, v: 1.5, jump: null, turn: 0, a: 0 };
function menuFrame(dt) {
  menuT += dt;
  const O = MENU_OVAL;
  const per = Math.hypot(O.rx, O.rz) * 1.0;                 // avance angular según la velocidad del paso
  menuRide.a += dt * menuRide.v / per;
  const nx = O.cx + Math.cos(menuRide.a) * O.rx, nz = O.cz + Math.sin(menuRide.a) * O.rz;
  menuRide.h = Math.atan2(nz - menuRide.z, nx - menuRide.x) || menuRide.h;
  menuRide.x = nx; menuRide.z = nz;
  horse.root.position.set(menuRide.x, 0, menuRide.z); horse.root.rotation.y = Math.PI / 2 - menuRide.h;
  horse.update(dt, { v: menuRide.v, turn: 0.15, jump: null });
  world.hoofShadows(horse.hooves(_hv));
  const a = menuT * 0.06 + 2.2, portrait = innerHeight > innerWidth && innerWidth < 700;
  const r = portrait ? 8.5 : 7.2;
  chase.cam.position.set(menuRide.x + Math.cos(a) * r, portrait ? 3.4 : 2.2, menuRide.z + Math.sin(a) * r);
  // en horizontal el caballo queda a la derecha del texto
  const side = portrait ? 0 : 1.6;
  // en vertical se mira por debajo del caballo para que quede arriba, lejos del título
  chase.cam.lookAt(menuRide.x - Math.sin(a) * side, portrait ? -1.6 : 1.25, menuRide.z + Math.cos(a) * side);
  world.follow(menuRide.x, menuRide.z);
}
addEventListener('resize', () => { renderer.setPixelRatio(Math.min(devicePixelRatio, quality.hd ? 1.75 : 1.5)); renderer.setSize(innerWidth, innerHeight); chase.resize(innerWidth, innerHeight); ranch.resize(innerWidth, innerHeight); stable.resize(innerWidth, innerHeight); if (post) post.setSize(innerWidth, innerHeight); dust.setScale(innerHeight * quality.pr); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play' && !paused) togglePause(true); });
// al cambiar de ventana (alt-tab) el recorrido se pausa: el caballo no sigue solo
addEventListener('blur', () => { if (state === 'play' && !paused && ride && !ride.finished && !ride.elim) togglePause(true); });

// cambio de idioma en vivo (evento de jet-idioma.js): todo se repinta al instante, sin recargar ni tocar la partida
addEventListener('jet-idioma', () => {
  applyStatic(); menuTexts(); relangSigns();
  Boot.relang();   // el cargador traduce el estado vigente (carga o error), nunca vuelve a «Cargando» sobre un error
  for (const p of bannerPaint) p();
  if (ride && state === 'play') { $('h-ta').textContent = course.ta ? `${T.hud.time} · ${T.hud.limit(course.ta).toLowerCase()}` : ''; $('h-pen-l').textContent = T.hud.penalty; camLabel(); keyHelp(); hud(0); if (marker) { const l = marker.userData.label; if (l) $('arrow').setAttribute('aria-label', T.hud.next(l)); } }
  ui && ui.relang();
  // la ventana abierta (Ajustes, pausa, ayuda, menú del rancho) se vuelve a pintar en el idioma nuevo
  if ($('modal').classList.contains('open') && modalOpts && modalOpts.re) { const sc = $('modal-card').scrollTop; const af = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.lang : null; modalOpts.re(); $('modal-card').scrollTop = sc; if (af) $('modal-card').querySelector(`[data-lang="${af}"]`)?.focus({ preventScroll: true }); }
});
let ui = null;
ui = new CareerUI({ $, canvas, renderer, ranch, stable, horse, chase, input, world, sound, herd, portraits: getPortraits, settingsMenu, howTo,
  setState: (s) => { state = s; if (s !== 'play') { ride = null; } }, startRun, toMenu, openModal, closeModal, say, showCones, coneTarget });
buildCourse('clasico');
menuRanch(0, true);
renderer.setAnimationLoop(frame);
// pre-compilar sombras y materiales antes de mostrar el menú
renderer.compile(S, chase.cam); renderer.compile(ranch.scene, ranch.cam);
Boot.ready();   // listo: el cargador sale del foco y del árbol accesible; los guardados no se tocan
$('menu').classList.remove('hidden'); showBest();
window.__jj = { ui, ranch, stable, startRun, say, sound, get settings() { return settings; }, get ride() { return ride; }, horse, cam: chase.cam, chase, scene: S, world, dust, get post() { return post; }, startGame, get state() { return state; }, fences: () => fences, setGear: (g) => { ride.setGear(g); updateGear(); } };
// actualizaciones: una pestaña que quedó abierta días no se entera sola de una versión nueva. Al volver a la
// pestaña (y cada media hora) se mira la versión publicada; en el menú se recarga sola, en el rancho se ofrece
// un botón (el progreso está guardado) y en plena pista se espera a terminar.
let newVer = 0;
async function checkUpdate() {
  if (['localhost', '127.0.0.1'].includes(location.hostname)) return;
  try {
    navigator.serviceWorker?.getRegistration().then((r) => r && r.update()).catch(() => {});
    const html = await (await fetch('./index.html', { cache: 'no-store' })).text();
    const v = +((html.match(/main\.js\?v=(\d+)/) || [])[1] || 0);
    if (v <= VERSION) return;
    newVer = v;
    if (state === 'menu' && !$('modal').classList.contains('open')) location.reload();
    else $('upd').hidden = false;
  } catch {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkUpdate(); });
setInterval(checkUpdate, 30 * 60 * 1000);
setTimeout(checkUpdate, 8000);
$('upd-go').onclick = () => { if (state !== 'play') location.reload(); };
if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) {
  // si llega una versión nueva mientras se está en el menú, se recarga sola (nunca en medio de un recorrido)
  const had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && state === 'menu') location.reload(); });
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
