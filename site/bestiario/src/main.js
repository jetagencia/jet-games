import * as THREE from '../vendor/three.module.js';
import { buildWorld, clamp } from './world.js';
import { Player } from './player.js';
import { THEMES, lightScene } from './themes.js';
import { makeEnv } from './env.js';
import { spawnCreature } from './model3d.js';
import { Input } from './input.js';
import { Npcs } from './npc.js';
import { Coins } from './pickups.js';
import { createBattle } from './battle.js';
import { createPanels } from './panels.js';
import * as G from './state.js';
import { PLAYER_SKINS } from './catalog.js';
import { LOW, LOD, DPR_MAX, CALM } from './quality.js';
import { ELEMENTS, SPECIES } from './species.js';
import { LEAGUE } from './battle-data.js';
import { Sound } from './audio.js';
import { L, bi, onLang } from './i18n.js';

const $ = (id) => document.getElementById(id);
const coarse = matchMedia('(pointer: coarse)').matches;

// ---------- render ----------
const canvas = $('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW, powerPreference: 'high-performance' });
} catch (e) {   // sin WebGL no hay juego: se dice con claridad en vez de dejar la pantalla negra (el texto lo pone el estado de arranque de index.html)
  if (window.__bootFail) window.__bootFail('webgl', String(e && e.message || e));
  throw e;
}
let pixelRatio = Math.min(devicePixelRatio || 1, DPR_MAX);
renderer.setPixelRatio(pixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// escenario elegido por el jugador (?escenario=id, o el último que usó)
const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } } };
const wantTheme = new URLSearchParams(location.search).get('escenario') || store.get('criaturas.escenario');
const theme = THEMES.find((t) => t.id === wantTheme) || THEMES[0];
renderer.toneMappingExposure = theme.exposure;

const scene = new THREE.Scene();
scene.environment = makeEnv(renderer, theme.env);
const { sun } = lightScene(scene, theme, { shadow: LOW ? 1024 : 2048, area: 27 });
if (LOW) sun.shadow.autoUpdate = false;   // calidad baja: la sombra se redibuja un cuadro sí y otro no (ver render)

const FOV = 38, PITCH = (58 * Math.PI) / 180;
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 260);
let camDist = 20;

// ---------- juego ----------
const world = buildWorld(scene, theme);
const player = new Player(scene, world);
const input = new Input($('stick'));
const npcs = new Npcs(scene, world);
let coinMsgT = 0, coinAcc = 0;
const coins = new Coins(scene, world, (v) => { G.addCoins(v); Sound.sfx('coin'); coinAcc += v; clearTimeout(coinMsgT); coinMsgT = setTimeout(() => { say(L(`+${coinAcc} monedas`, `+${coinAcc} coins`)); coinAcc = 0; }, 160); });
const actors = [];
// aspectos comprados en la tienda: el viajero y cada criatura de su jaula
const formFor = (a) => { const mine = G.owned(a.cage.species.id)[0]; a.setForm(mine ? mine.form || 'base' : 'base'); };   // los aspectos de las criaturas son sus formas; la jaula muestra la de tu criatura de esa especie
function applySkins() {
  const ps = PLAYER_SKINS.find((s) => s.id === G.state().playerSkin) || PLAYER_SKINS[0];
  player.setSkin(ps);
  for (const a of actors) formFor(a);
}
applySkins();
const creatures = [];   // (el dragón procedural de pruebas ya no se usa)

// criaturas 3D: una por jaula en cuanto su modelo existe (el resto muestra su nido con huevos). Se cargan por cercanía y de una en una,
// para no descargar decenas de megas antes de poder jugar; la jaula más cercana va primero.
const jaulaDe = (sp) => `${sp.genero === 'f' ? 'de la' : 'del'} ${sp.name.toLowerCase()}`;   // («la jaula del dragón»; en inglés: «the Dragon cage»)
// la portada ya pidió el fénix desde index.html (window.__pre): se usa esa descarga en lugar de repetirla
const takePre = (u) => { const P = window.__pre, p = P && P[u]; if (p) delete P[u]; return p || Promise.reject(new Error('sin precarga')); };
const metaOf = (c, lod) => { const u = `assets/${c.species.model}-${lod}.json`; return takePre(u).catch(() => fetch(u).then((r) => (r.ok ? r.json() : null))).catch(() => null); };
async function loadCage(c) {
  const yaw = c.facing < 0 ? 0 : Math.PI;
  // datos del modelo (escala, desplazamiento, círculos de colisión) junto al GLB; los de species.js sirven de respaldo.
  // En teléfonos se prefiere la versión liviana (sd); si todavía no existe, se usa la completa (hd).
  let lod = LOD, meta = await metaOf(c, lod);
  if (!meta && lod === 'sd') { lod = 'hd'; meta = await metaOf(c, 'hd'); }
  const m = { scale: c.species.scale || 1, offsetZ: c.species.offsetZ || 0, collide: c.species.collide || [], ...(meta || {}) };
  const inward = Math.sign((c.z0 + c.z1) / 2 - c.zf) || 1, [nudgeX = 0, nudgeBack = 0] = c.species.nudge || [];   // nudge: se corre dentro de la jaula para que el rugido (alas, garrote) no se salga de las barras
  const ax = c.x + nudgeX, az = c.z + inward * nudgeBack;
  const a = await spawnCreature({ url: `assets/${c.species.model}-${lod}.glb`, scene, x: ax, z: az, yaw, scale: m.scale, offsetZ: m.offsetZ, skin: c.species.skin || null });
  a.cage = c; actors.push(a); formFor(a);
  if (c === titleCage) document.body.classList.add('hero-on');
  for (const [dz, r, dx = 0] of m.collide) { // la criatura es sólida: no se la puede atravesar (dx = desplazamiento lateral, para grupos)
    const lz = (dz + m.offsetZ) * m.scale, lx = dx * m.scale;
    const cx = ax + Math.sin(yaw) * lz + Math.cos(yaw) * lx, cz = az + Math.cos(yaw) * lz - Math.sin(yaw) * lx, rr = r * m.scale;
    // el pasillo de la puerta queda libre: una criatura grande no puede cerrar la entrada de su propia jaula
    if (cx + rr > c.doorX - 0.85 && cx - rr < c.doorX + 0.85 && inward * (cz - c.zf) - rr < 2.4) continue;
    world.colliders.circles.push({ x: cx, z: cz, r: rr });
  }
}
const cageQueue = [], cageSeen = new Map(); let cageBusy = false;   // cageSeen: id -> hora desde la que se puede reintentar (0 = cargada o en cola)
async function pumpCages() {
  if (cageBusy) return; cageBusy = true;
  while (cageQueue.length) {
    const c = cageQueue.shift();
    try { await loadCage(c); } catch (e) { console.warn('No se pudo cargar', c.species.id, e); cageSeen.set(c.id, Date.now() + 8000); if (c === titleCage) document.body.classList.add('hero-on'); }
    await new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 400 }) : setTimeout(r, 60)));
  }
  cageBusy = false;
}
function streamCages() {
  const all = CAMS[camIdx].id === 'mapa', onTitle = titleOn && titleCage;
  for (const c of world.cages) {
    if (!c.species.model) continue;
    const t = cageSeen.get(c.id); if (t === 0 || (t && Date.now() < t)) continue;
    // bajo la portada solo se ve el fénix: va primero y solo (en calidad baja, sus vecinas esperan a que empiece la partida)
    const want = onTitle ? (c === titleCage || (!LOW && Math.hypot(titleCage.x - c.x, titleCage.z - c.z) < 9)) : all || Math.hypot(player.pos.x - c.x, player.pos.z - c.z) < (LOW ? 30 : 36);
    if (want) { cageSeen.set(c.id, 0); cageQueue.push(c); }
  }
  const ref = onTitle ? titleCage : player.pos;   // lo más cercano a lo que se mira, primero
  cageQueue.sort((p, q) => Math.hypot(ref.x - p.x, ref.z - p.z) - Math.hypot(ref.x - q.x, ref.z - q.z));
  pumpCages();
}

// ---------- interfaz ----------
const hint = $('hint');
const paintHint = () => { hint.textContent = coarse ? L('Arrastra el dedo para moverte. Acércate a un letrero para entrar.', 'Drag your finger to move. Walk up to a sign to go in.') : L('WASD o flechas para moverte · Mayús para correr · Espacio para hablar · B mochila · C vista · Q / E para girar · Esc menú', 'WASD or arrow keys to move · Shift to run · Space to talk · B backpack · C view · Q / E to rotate · Esc menu'); };
paintHint();
const zoneEl = $('zone');
let activeId = null, moveTime = 0;

const labelsEl = $('labels');
const labels = world.zones.map((z) => {
  const el = document.createElement('div');
  el.className = 'lbl';
  el.innerHTML = `<span class="arr">▲</span><i style="background:${z.css}"></i><span class="nm"></span><span class="dist"></span>`;
  el.querySelector('.nm').textContent = z.name;
  labelsEl.appendChild(el);
  return { el, arr: el.querySelector('.arr'), dist: el.querySelector('.dist'), v: new THREE.Vector3() };
});

function setZone(z) {
  activeId = z ? z.id : null;
  if (z) {
    $('zone-name').textContent = z.name;
    $('zone-desc').textContent = z.desc;
    $('zone-dot').style.background = z.css; $('zone-dot').style.color = z.css;
    $('zone-soon').style.display = z.soon ? '' : 'none';
  }
  zoneEl.classList.toggle('show', !!z);
  clearTimeout(zoneT);
  if (z && (innerWidth <= 560 || innerHeight <= 460)) zoneT = setTimeout(() => zoneEl.classList.remove('show'), 3500);   // en teléfono la tarjeta no tapa el objetivo más que un momento
}
let zoneT = 0;

function updateZone() {
  let best = null, bd = Infinity;
  for (const z of world.zones) {
    const d = Math.hypot(player.pos.x - z.x, player.pos.z - z.z) - z.r;
    if (d < 0 && d < bd) { bd = d; best = z; }
  }
  if ((best ? best.id : null) !== activeId) { setZone(best); updateGoal(); }
}

// rectángulos del HUD que los rótulos no deben tapar (se miden de vez en cuando; el HUD es fijo)
let reserved = [], reservedAge = 99;
function measureReserved() {
  reserved = [];
  for (const id of ['coins', 'goal', 'act']) { const el = $(id); if (el && !el.hidden && (id !== 'act' || el.classList.contains('show'))) { const r = el.getBoundingClientRect(); if (r.width) reserved.push([r.left - 4, r.top - 4, r.right + 4, r.bottom + 4]); } }
  reservedAge = 0;
}
const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
function updateLabels() {
  const W = innerWidth, H = innerHeight, actOn = actBtn.classList.contains('show');
  if (++reservedAge > 30) measureReserved();
  const mx = 74, mt = (W <= 560 && !goalEl.hidden) ? 150 : 116, mb = actOn ? 132 : 78;
  const cx = W / 2, cy = H / 2, hw = W / 2 - mx, hh = Math.max(20, Math.min(cy - mt, H - mb - cy));
  const placed = [...reserved, [W - 176, H - 90, W, H]];
  const gz = goal && goal.zone;
  const order = world.zones.map((z, i) => ({ z, i, d: Math.hypot(player.pos.x - z.x, player.pos.z - z.z) })).sort((p, q) => (q.z.id === gz) - (p.z.id === gz) || p.d - q.d);   // el destino del objetivo y las cercanas mandan: la más lejana cede si dos se pisan
  for (const { z, i, d } of order) {
    const L = labels[i], v = L.v;
    v.set(z.label.x, z.label.y, z.label.z).project(camera);
    let px = (v.x * 0.5 + 0.5) * W, py = (-v.y * 0.5 + 0.5) * H;
    const behind = v.z > 1;
    let edge = behind || Math.abs(px - cx) > hw || py < mt || py > H - mb;
    if (edge) {
      let dx = px - cx, dy = py - cy;
      if (behind) { dx = -dx; dy = -dy; }
      if (!dx && !dy) dy = -1;
      const k = Math.min(hw / (Math.abs(dx) || 1e-6), hh / (Math.abs(dy) || 1e-6));
      px = cx + dx * k; py = cy + dy * k;
      L.arr.style.transform = `rotate(${Math.atan2(dx, -dy)}rad)`;
      L.dist.textContent = `${Math.max(1, Math.round(d))} m`;
    }
    L.el.classList.toggle('edge', edge);
    L.el.classList.toggle('goal', z.id === gz);
    if (z.id === gz && goalArr) goalArr.style.transform = `rotate(${Math.atan2(px - cx, cy - py)}rad)`;   // la flecha del objetivo apunta al rótulo de su destino
    const wk = edge ? 'we' : 'wi', lw = L[wk] || (L[wk] = L.el.offsetWidth);   // ancho medido una vez por estado (medir en cada cuadro forzaría el diseño)
    if (lw) px = Math.min(Math.max(px, lw / 2 + 6), W - lw / 2 - 6);   // nunca cortado por el borde
    L.el.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -50%)`;
    const w = z.name.length * 8.6 + 40 + (edge ? 60 : 0), rect = [px - w / 2, py - 14, px + w / 2, py + 14];
    const clash = z.id !== activeId && z.id !== gz && placed.some((p) => hit(p, rect));
    if (!clash && z.id !== activeId) placed.push(rect);
    L.el.style.opacity = z.id === activeId || clash ? '0' : '1';
  }
}
// destaca un rótulo de zona unos segundos (el objetivo guiado y el «Ir a la Enfermería» del combate lo usan)
function pulseZone(zoneId) {
  const i = world.zones.findIndex((z) => z.id === zoneId); if (i < 0) return;
  const z = world.zones[i], el = labels[i].el;
  el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); setTimeout(() => el.classList.remove('pulse'), 4200);
  const m = Math.max(1, Math.round(Math.hypot(player.pos.x - z.x, player.pos.z - z.z)));
  say(L(`${z.name}: a ${m} m`, `${z.name}: ${m} m away`));
}

// ---------- cámaras ----------
// Cinco vistas: cenital (clásica), isométrica, tercera persona, primera persona y mapa. Se cambia con el botón o con la tecla C.
const CAMS = [
  { id: 'cenital', name: 'Cenital', desc: coarse ? 'Vista alta. Gira con los botones ↺ ↻ o con un segundo dedo.' : 'Vista alta. Gira con Q / E o arrastrando con el botón derecho.', fov: 38,
    en: { name: 'Overhead', desc: coarse ? 'High view. Rotate with the ↺ ↻ buttons or with a second finger.' : 'High view. Rotate with Q / E or by dragging with the right button.' } },
  { id: 'isometrica', name: 'Isométrica', desc: coarse ? 'En diagonal, como un tablero. Gira con ↺ ↻.' : 'En diagonal, como un tablero. Gira con Q / E.', fov: 30,
    en: { name: 'Isometric', desc: coarse ? 'At an angle, like a game board. Rotate with ↺ ↻.' : 'At an angle, like a game board. Rotate with Q / E.' } },
  { id: 'tercera', name: 'Tercera persona', desc: coarse ? 'Detrás del viajero. Arrastra con el dedo derecho para girar.' : 'Detrás del viajero. Arrastra para girar.', fov: 58, look: true,
    en: { name: 'Third person', desc: coarse ? 'Behind the traveler. Drag with your right finger to turn.' : 'Behind the traveler. Drag to turn.' } },
  { id: 'primera', name: 'Primera persona', desc: coarse ? 'Con los ojos del viajero. Arrastra con el dedo derecho para mirar.' : 'Con los ojos del viajero. Arrastra para mirar.', fov: 74, look: true,
    en: { name: 'First person', desc: coarse ? 'Through the traveler’s eyes. Drag with your right finger to look around.' : 'Through the traveler’s eyes. Drag to look around.' } },
  { id: 'mapa', name: 'Mapa', desc: coarse ? 'Todo el pueblo desde arriba. Gira con ↺ ↻.' : 'Todo el pueblo desde arriba. Gira con Q / E.', fov: 38,
    en: { name: 'Map', desc: coarse ? 'The whole village from above. Rotate with ↺ ↻.' : 'The whole village from above. Rotate with Q / E.' } },
].map(bi);
const wantCam = new URLSearchParams(location.search).get('camara') || store.get('criaturas.camara');
let camIdx = Math.max(0, CAMS.findIndex((c) => c.id === wantCam));
let viewYaw = Math.PI, pitchTP = 0.3, pitchFP = 0.0, zoom = 1;
let rotBtn = 0;                                 // botones de giro de la esquina: -1 izquierda, +1 derecha
const needle = $('needle');
function defaultYaw() { const id = CAMS[camIdx].id; return id === 'isometrica' ? (3 * Math.PI) / 4 : id === 'tercera' || id === 'primera' ? player.yaw : Math.PI; }
const fogBase = [scene.fog.near, scene.fog.far];
const toast = $('toast'); let toastT = 0;
function say(text) { toast.textContent = text; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 3000); }

// ---------- menús del pueblo y personal ----------
const panels = createPanels({ say, themeEnv: theme.env, onSkins: () => applySkins(), onFeed: (speciesId) => { const a = actors.find((x) => x.cage.species.id === speciesId); if (a) { a.roar(); Sound.sfx('roar'); } }, onNewGame: () => { applySkins(); player.pos.x = world.spawn.x; player.pos.z = world.spawn.z; player.vx = player.vz = 0; player.sync(); } });
const battle = createBattle({ scene, camera, player, world, say, panels, goto: (zoneId) => pulseZone(zoneId) });
panels.hooks.locked = () => battle.active;   // con un combate en marcha no se abre la Mochila
panels.hooks.sparring = (id, npc) => battle.startSparring(id, npc);
panels.hooks.fight = (id, rival, npc) => battle.start(id, rival, npc);
let wasBattle = false;
G.onSaveError(() => say(L('No se puede guardar en este navegador: tu progreso se perderá al cerrar la página.', 'This browser can’t save: your progress will be lost when you close the page.')));
// huevos y camillas avanzan con el reloj real, incluso con el juego en segundo plano
const keyB = coarse ? '' : ' (B)';
setInterval(() => {
  if (!G.hasGame()) return;
  const ready = G.tickEggs();
  if (ready.length) Sound.sfx('ready');
  if (ready.length === 1) say(L(`¡Tu huevo de ${G.speciesOf(ready[0].species).name.toLowerCase()} está listo para eclosionar! Abre la Mochila${keyB}.`, `Your ${G.speciesOf(ready[0].species).name} egg is ready to hatch! Open the Backpack${keyB}.`));
  else if (ready.length > 1) say(L(`${ready.length} huevos listos para eclosionar. Abre la Mochila${keyB}.`, `${ready.length} eggs ready to hatch. Open the Backpack${keyB}.`));
  for (const c of G.tickRest()) say(L(`${c.name} salió de la camilla, como nueva.`, `${c.name} is off the cot, as good as new.`));
  updateGoal();
}, 1000);

// objetivo guiado: una línea que dice qué hacer ahora; al tocarla se destaca el lugar
const goalEl = $('goal'), goalText = $('goal-text'), goalArr = $('goal-arr');
let goal = null;
function computeGoal() {
  const S = G.state(), ready = S.eggs.filter((e) => G.eggReady(e));
  if (ready.length) return { text: ready.length > 1 ? L(`${ready.length} huevos listos: ábrelos en la Mochila`, `${ready.length} eggs ready: open them in the Backpack`) : L('Tu huevo está listo: ábrelo en la Mochila', 'Your egg is ready: open it in the Backpack'), bag: 'huevos' };
  if (!S.roster.length) {
    if (!S.eggs.length) return { text: L('Compra tu primer huevo en Criaderos', 'Buy your first egg at the Breeding Grounds'), zone: 'criaderos', here: L('Ponte frente a una jaula, toca «Abrir jaula» y compra su huevo', 'Stand in front of a cage, tap “Open cage” and buy its egg') };
    const left = Math.min(...S.eggs.map((e) => G.eggLeft(e))), s = Math.ceil(left / 1000), t = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    return { text: L(`Tu huevo estará listo en ${t}. Mientras tanto, recoge monedas`, `Your egg will be ready in ${t}. Meanwhile, collect coins`) };
  }
  const hurt = S.roster.find((c) => G.isKo(c) || c.hp < G.hpMax(c) * 0.5);
  if (hurt) return { text: L(`Cura a ${hurt.name} en la Enfermería`, `Heal ${hurt.name} at the Infirmary`), zone: 'enfermeria', here: L(`Habla con la Dra. Vesper para curar a ${hurt.name}`, `Talk to Dr. Vesper to heal ${hurt.name}`) };
  const fought = S.stats.wins + S.stats.losses > 0;
  if (!fought && S.roster.length <= 2 && S.roster[0].level <= 3) return { text: L(`Alimenta a ${S.roster[0].name} en su jaula de Criaderos`, `Feed ${S.roster[0].name} in its cage at the Breeding Grounds`), zone: 'criaderos', here: L(`Abre la jaula ${jaulaDe(G.speciesOf(S.roster[0].species))} y elige Alimentar`, `Open the ${G.speciesOf(S.roster[0].species).name} cage and choose Feed`) };
  if (!fought && S.roster.every((c) => c.level <= 8)) return { text: L('Pon a prueba a tu criatura en la Zona de pelea', 'Test your creature in the Arena'), zone: 'pelea', here: L('Habla con Garrick y elige un rival', 'Talk to Garrick and choose a rival') };
  const Lg = LEAGUE[G.leagueBeaten()], best = Math.max(...S.roster.map((c) => c.level));
  if (Lg) return best >= Lg.level - 1 ? { text: L(`Liga: reta a ${Lg.name} (nivel ${Lg.level}) en la Zona de pelea`, `League: challenge ${Lg.name} (level ${Lg.level}) in the Arena`), zone: 'pelea', here: L(`Habla con Garrick y reta a ${Lg.name}`, `Talk to Garrick and challenge ${Lg.name}`) } : { text: L(`Liga: sube una criatura al nivel ${Lg.level - 1} para retar a ${Lg.name}`, `League: raise a creature to level ${Lg.level - 1} to challenge ${Lg.name}`), zone: 'criaderos', here: L('Abre la jaula de tu criatura y aliméntala; los rivales de Garrick también dan experiencia', 'Open your creature’s cage and feed it; Garrick’s rivals also give experience') };
  if (G.dexCount() < SPECIES.length) return { text: L(`Bestiario: ${G.dexCount()}/${SPECIES.length} especies. Busca huevos nuevos en Criaderos`, `Bestiary: ${G.dexCount()}/${SPECIES.length} species. Look for new eggs at the Breeding Grounds`), zone: 'criaderos', here: L('Las jaulas con huevo a la venta muestran su precio en el botón «Abrir jaula»', 'Cages with an egg for sale show its price on the “Open cage” button') };
  return null;
}
function updateGoal() {
  const g = G.hasGame() && !battle.active ? computeGoal() : null;
  goal = g;
  if (!g) { goalEl.hidden = true; reservedAge = 99; return; }
  const zn = g.zone && world.zones.find((z) => z.id === g.zone), arrived = !!zn && activeId === zn.id;
  goalText.textContent = !zn ? g.text : arrived && g.here ? g.here : `${g.text} (${Math.max(1, Math.round(Math.hypot(player.pos.x - zn.x, player.pos.z - zn.z)))} m)`;
  goalEl.classList.toggle('nav', !!zn && !arrived);   // con destino lejos: flecha que apunta hacia él (la gira updateLabels)
  if (goalEl.hidden) { goalEl.hidden = false; reservedAge = 99; }
}
goalEl.addEventListener('click', () => { if (!goal) return; if (goal.bag) panels.openBag(goal.bag); else if (goal.zone) pulseZone(goal.zone); });
G.onChange(updateGoal);
const actBtn = $('act');
let actTarget = null; // {kind: 'npc', npc} | {kind: 'cage', cage}
function talk() {
  if (!actTarget || panels.isOpen()) return;
  input.reset();
  if (actTarget.kind === 'npc') panels.openNpc(actTarget.npc, npcs.line(actTarget.npc));
  else panels.openCage(actTarget.cage.species);
}
actBtn.addEventListener('click', talk);
addEventListener('keydown', (e) => { if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat && !e.ctrlKey && !e.metaKey && actTarget && !panels.isOpen() && !titleOn && !battle.active && !(e.target && e.target.closest && e.target.closest('button, a, input, select, textarea, [contenteditable=true], [role=button]'))) { e.preventDefault(); talk(); } });
// la jaula más cercana: estando dentro de ella o frente a su puerta
function nearestCage() {
  const p = player.pos; let best = null, bd = Infinity;
  for (const c of world.cages) {
    const inside = p.x > c.x0 - 0.3 && p.x < c.x1 + 0.3 && p.z > c.z0 - 0.3 && p.z < c.z1 + 0.3;
    const d = Math.hypot(p.x - c.doorX, p.z - c.zf);
    if ((inside || d < 3.3) && d < bd) { bd = d; best = c; }
  }
  return best;
}
function updateAct() {
  let t = null;
  if (!panels.isOpen() && !battle.active) {
    const n = npcs.nearest(player.pos);
    if (n) t = { kind: 'npc', npc: n, key: n.def.id };
    else { const c = nearestCage(); if (c) t = { kind: 'cage', cage: c, key: c.id }; }
  }
  const same = (t && actTarget && t.key === actTarget.key) || (!t && !actTarget);
  if (same) return;
  actTarget = t;
  if (t) {
    if (t.kind === 'npc') {
      const zn = world.zones.find((z) => z.id === t.npc.def.zone);
      $('act-text').textContent = L(`Hablar con ${t.npc.def.name} (${zn.name})`, `Talk to ${t.npc.def.name} (${zn.name})`);
      actBtn.querySelector('.dotz').style.background = zn.css;
    } else {
      const sp = t.cage.species;
      const egg = G.owned(sp.id).length || !G.hasGame() ? '' : L(` · huevo ${G.eggPrice(sp)}`, ` · egg ${G.eggPrice(sp)}`);
      $('act-text').textContent = L(`Abrir jaula ${jaulaDe(sp)}${egg}`, `Open ${sp.name} cage${egg}`);
      actBtn.querySelector('.dotz').style.background = '#' + ELEMENTS[t.cage.species.element].color.toString(16).padStart(6, '0');
    }
  }
  actBtn.classList.toggle('show', !!t); document.body.classList.toggle('has-act', !!t); reservedAge = 99;   // los rótulos esquivan el botón donde esté
}

// en pantalla vertical las vistas en primera y tercera persona fijan un ángulo horizontal mínimo (el fov de three es vertical)
function camFov(c) {
  if (!c.look || camera.aspect >= 1) return c.fov;
  const h = ((c.id === 'primera' ? 85 : 70) * Math.PI) / 180;
  return Math.min(100, (2 * Math.atan(Math.tan(h / 2) / camera.aspect) * 180) / Math.PI);
}
function fitCamera() {
  const W = innerWidth, H = innerHeight, a = W / H, t = Math.tan((FOV * Math.PI) / 360);
  const needW = 11.5, needH = 15.5; // metros de suelo que siempre deben verse
  const dW = needW / (2 * t * a), dH = (needH * Math.sin(PITCH)) / (2 * t);
  camDist = clamp(Math.max(dW, dH), 14, 40);
  camera.aspect = a; camera.fov = camFov(CAMS[camIdx]); camera.updateProjectionMatrix();
}
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  fitCamera();
}
let resizeRaf = 0;
const scheduleResize = () => { cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(() => { resize(); measureReserved(); }); };   // un solo ajuste por giro de pantalla
addEventListener('resize', scheduleResize);
if (window.visualViewport) visualViewport.addEventListener('resize', scheduleResize);
addEventListener('orientationchange', () => setTimeout(scheduleResize, 200));
addEventListener('wheel', (e) => { if (e.target.closest && e.target.closest('[data-ui]')) return; zoom = clamp(zoom * (1 + Math.sign(e.deltaY) * 0.08), 0.5, 2.2); }, { passive: true });

function setCamera(i, announce = true) {
  camIdx = (i + CAMS.length) % CAMS.length;
  const c = CAMS[camIdx];
  store.set('criaturas.camara', c.id);
  camera.fov = camFov(c); camera.near = { primera: 0.08, tercera: 0.4, mapa: 25 }[c.id] || 1.5; camera.far = c.id === 'mapa' ? 800 : 260; camera.updateProjectionMatrix();
  player.root.visible = c.id !== 'primera';
  input.lookMode = !!c.look;
  scene.fog.near = c.id === 'mapa' ? 1e5 : fogBase[0]; scene.fog.far = c.id === 'mapa' ? 2e5 : fogBase[1];   // el mapa se ve entero, sin niebla
  viewYaw = defaultYaw();                            // tercera y primera miran hacia donde mira el viajero; las altas, al norte o en diagonal
  document.querySelectorAll('#cam-panel button').forEach((b, k) => b.classList.toggle('sel', k === camIdx));
  if (announce) say(L(`Cámara: ${c.name}`, `Camera: ${c.name}`));
}
resize();

const focus = new THREE.Vector3(player.pos.x, 0, player.pos.z);
const fwd = new THREE.Vector3();
const MAP_C = { x: 22, z: 4 }, MAP_W = 116, MAP_D = 84;   // el pueblo mide unos 109 × 78 m (del Gimnasio al fondo de Criaderos); el mapa sigue un 30 % al viajero, por eso el centro va corrido al este
// la cámara en tercera persona no atraviesa vallas, árboles ni rocas (las paredes de los edificios se aclaran solas, no cuentan)
const bld = world.fades.map((f) => f.box);
const inBuilding = (b) => { if (b._bld === undefined) { const x = (b.x0 + b.x1) / 2, z = (b.z0 + b.z1) / 2; b._bld = bld.some((q) => x >= q.min.x - 0.1 && x <= q.max.x + 0.1 && z >= q.min.z - 0.1 && z <= q.max.z + 0.1); } return b._bld; };
function camBlocked(x, z) {
  for (const b of world.colliders.boxes) if (!b.off && x > b.x0 - 0.3 && x < b.x1 + 0.3 && z > b.z0 - 0.3 && z < b.z1 + 0.3 && !inBuilding(b)) return true;
  for (const c of world.colliders.circles) { const dx = x - c.x, dz = z - c.z, rr = c.r + 0.3; if (dx * dx + dz * dz < rr * rr) return true; }
  return false;
}
function updateCamera(dt, snap) {
  // el combate trae su propia cámara: no hereda el plano cercano (25 m) ni la falta de niebla del Mapa, que dejaban la arena y las criaturas fuera de vista
  if (battle.active && !wasBattle) { camera.near = 1.5; camera.far = 260; scene.fog.near = fogBase[0]; scene.fog.far = fogBase[1]; }
  if (battle.applyCamera()) { wasBattle = true; return; }
  if (wasBattle) { wasBattle = false; setCamera(camIdx, false); }
  if (titleOn && titleCage) {   // portada: plano de la jaula del fénix, con un paneo lento
    const c = titleCage, out = -Math.sign(c.facing || 1), sw = CALM ? 0 : Math.sin(time * 0.09) * 3.2;
    camera.fov = 44; camera.near = 0.5; camera.far = 260; camera.updateProjectionMatrix();
    const wide = camera.aspect > 1.15, sx = wide ? -out * 2.6 : 0;   // en pantalla ancha la tarjeta va a la izquierda y el dragón a la derecha; en vertical, el dragón arriba
    // desde arriba de la verja, en tres cuartos: las barras no tapan al dragón
    // pantallas muy apaisadas (teléfono en horizontal): el plano se corre para que el fénix quede a la derecha de la tarjeta
    const d = wide ? Math.min(2.5, Math.max(0, (camera.aspect - 1.78) * 5)) : 0, dx = -out * 0.85 * d, dz = -out * 0.53 * d;
    if (wide) { camera.position.set(c.x - out * 5.0 + sw + dx, 6.6, c.zf + out * 4.6 + dz); camera.lookAt(c.x - out * 2.0 + sw * 0.2 + dx, 0.2, c.z - out * 0.2 + dz); }
    else { camera.position.set(c.x - out * 1.6 + sw * 0.4, 7.0, c.zf + out * 6.4); camera.lookAt(c.x - out * 0.3, -1.6, c.z - out * 0.2); }
    sun.target.position.set(c.x, 0, c.z); sun.position.set(c.x + theme.sunPos[0], theme.sunPos[1], c.z + theme.sunPos[2]);
    titleCam = true; return;
  }
  if (titleCam) { titleCam = false; setCamera(camIdx, false); snap = true; }
  const k = snap ? 1 : 1 - Math.exp(-dt * 6);
  const id = CAMS[camIdx].id;
  const tx = id === 'mapa' ? MAP_C.x + (player.pos.x - MAP_C.x) * 0.3 : player.pos.x + player.vx * 0.28, tz = id === 'mapa' ? MAP_C.z + (player.pos.z - MAP_C.z) * 0.3 : player.pos.z + player.vz * 0.28;
  focus.x += (tx - focus.x) * k; focus.z += (tz - focus.z) * k;
  fwd.set(Math.sin(viewYaw), 0, Math.cos(viewYaw));
  if (id === 'cenital') {
    const d = camDist * zoom;
    camera.position.set(focus.x - fwd.x * Math.cos(PITCH) * d, Math.sin(PITCH) * d, focus.z - fwd.z * Math.cos(PITCH) * d); camera.lookAt(focus.x, 0.6, focus.z);
  } else if (id === 'isometrica') {
    const d = camDist * zoom * 1.1, p = 0.62;
    camera.position.set(focus.x - fwd.x * d * Math.cos(p), Math.sin(p) * d, focus.z - fwd.z * d * Math.cos(p)); camera.lookAt(focus.x, 0.6, focus.z);
  } else if (id === 'tercera') {
    const d = 6.4 * zoom, e = pitchTP, ox = -fwd.x * d * Math.cos(e), oz = -fwd.z * d * Math.cos(e);
    let k = 1;
    for (let q = 0.2; q <= 1.001; q += 0.1) if (camBlocked(player.pos.x + ox * q, player.pos.z + oz * q)) { k = Math.max(0.18, q - 0.1); break; }   // se acerca al viajero si algo se interpone
    camera.position.set(player.pos.x + ox * k, 1.5 + d * Math.sin(e), player.pos.z + oz * k);
    camera.lookAt(player.pos.x + fwd.x * 1.8, 1.25, player.pos.z + fwd.z * 1.8);
  } else if (id === 'primera') {
    const bob = CALM ? 0 : Math.sin(player.phase * 1.0) * 0.035 * Math.min(1, player.speed / 5), y = 1.5 + bob, cp = Math.cos(pitchFP);
    camera.position.set(player.pos.x, y, player.pos.z);
    camera.lookAt(player.pos.x + fwd.x * cp * 4, y + Math.sin(pitchFP) * 4, player.pos.z + fwd.z * cp * 4);
  } else { // mapa
    const t = Math.tan((camera.fov * Math.PI) / 360), th = viewYaw - Math.PI, c = Math.abs(Math.cos(th)), sn = Math.abs(Math.sin(th));
    const needW = c * MAP_W + sn * MAP_D, needH = sn * MAP_W + c * MAP_D;   // lo que ocupa el pueblo a lo ancho y a lo alto según el giro
    const d = Math.max(needH / (2 * t), needW / (2 * t * camera.aspect)) * zoom;
    camera.position.set(focus.x - fwd.x * 7, d, focus.z - fwd.z * 7); camera.lookAt(focus.x, 0, focus.z);
  }
  // la luz y su sombra siguen al viajero (encajadas en la rejilla para que no tiemble)
  const sx = Math.round(player.pos.x * 2) / 2, sz = Math.round(player.pos.z * 2) / 2;
  sun.target.position.set(sx, 0, sz);
  sun.position.set(sx + theme.sunPos[0], theme.sunPos[1], sz + theme.sunPos[2]);
}

// ---------- bucle ----------
let time = 0;
function tick(dt) {
  time += dt;
  const paused = panels.isOpen() || battle.active || titleOn;  // con un menú, un combate o la portada abiertos el viajero espera
  const raw = paused ? { x: 0, y: 0, mag: 0, run: false, turn: 0 } : input.read(), look = input.takeLook();
  // en todas las vistas se puede girar la cámara: Q/E, botones de la esquina, clic derecho (o un segundo dedo) y, en tercera y primera, arrastrar
  viewYaw -= look.x * 0.0055 + (raw.turn + rotBtn) * dt * 1.9 + (titleOn && !CALM ? dt * 0.06 : 0);   // bajo la portada, la cámara gira despacio
  if (CAMS[camIdx].look) {
    if (CAMS[camIdx].id === 'primera') pitchFP = clamp(pitchFP - look.y * 0.004, -1.2, 1.2);
    else pitchTP = clamp(pitchTP + look.y * 0.004, 0.05, 1.25);
  }
  needle.style.transform = `rotate(${viewYaw - Math.PI}rad)`;
  const cy = Math.cos(viewYaw), sy = Math.sin(viewYaw);       // «arriba» de la pantalla = hacia donde mira la cámara
  const mv = input.override ? raw : { x: -cy * raw.x - sy * raw.y, y: sy * raw.x - cy * raw.y, mag: raw.mag, run: raw.run };
  player.update(dt, mv, time);
  for (const c of creatures) c.update(dt, time, player);
  updateZone();
  npcs.update(dt, time, player.pos, camera);
  coins.update(dt, time, paused ? null : player.pos, camera);
  battle.update(dt);
  for (const n of npcs.list) n.root.visible = !battle.active;
  coins.mesh.visible = !battle.active;
  updateAct();
  world.update(dt, time, activeId, player.pos, camera.position);
  const mapCam = CAMS[camIdx].id === 'mapa';
  for (const a of actors) {
    const dist = Math.hypot(player.pos.x - a.x, player.pos.z - a.z);
    if (battle.active || (!mapCam && dist > 70 && !(titleOn && titleCage && Math.hypot(titleCage.x - a.x, titleCage.z - a.z) < 20))) continue;   // las criaturas que no se ven no se animan
    a.update(dt);
    if (a.cool <= 0 && dist < 5.5) { a.roar(); a.cool = 9 + Math.random() * 6; if (!paused && !titleOn) Sound.sfx('roar'); }
  }
  updateCamera(dt, false);
  if (mv.mag > 0) { moveTime += dt; if (moveTime > 0.6) hint.classList.add('off'); }
}
let shadowTick = 0;
function render() {
  if (!titleOn) updateLabels();
  if (LOW) sun.shadow.needsUpdate = (shadowTick++ & 1) === 0;   // la sombra de un cuadro atrás no se nota a 30 cuadros o más; ahorra ≈ 6 % del cuadro (medido con SwiftShader)
  renderer.render(scene, camera);
}

const fpsEl = $('fps');
const showFps = new URLSearchParams(location.search).has('fps');
if (showFps) fpsEl.style.display = 'block';
let last = performance.now(), acc = 0, frames = 0;
// resolución adaptable: si más de la mitad de los últimos 90 cuadros tardaron más de 33 ms, se baja la densidad de píxeles (nunca de 1)
let slowFrames = 0, countFrames = 0;
function adaptResolution(raw) {
  if (raw > 1 / 30) slowFrames++;
  if (++countFrames < 90) return;
  if (slowFrames > 54 && pixelRatio > 1) { pixelRatio = Math.max(1, pixelRatio - 0.25); renderer.setPixelRatio(pixelRatio); resize(); }
  slowFrames = countFrames = 0;
}
function frame(now) {
  const raw = (now - last) / 1000, dt = Math.min(0.05, raw);
  last = now;
  adaptResolution(raw);
  tick(dt);
  render();
  if (showFps) { acc += dt; frames++; if (acc >= 0.5) { fpsEl.textContent = `${Math.round(frames / acc)} fps`; acc = 0; frames = 0; } }
  requestAnimationFrame(frame);
}
updateCamera(0, true);
render();
measureReserved(); updateGoal();
document.body.classList.add('ready');
if (window.__bootReady) window.__bootReady();   // listo: el cargador sale del árbol accesible y el HUD recupera el foco (la portada vuelve a aislarlo)
setTimeout(() => { const b = $('boot'); if (b) b.remove(); }, 900);
requestAnimationFrame((n) => { last = n; frame(n); });

// ---------- menú de cámaras ----------
{
  const btn = $('cam'), panel = $('cam-panel');
  CAMS.forEach((c, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem');
    b.innerHTML = '<b></b><small></small>'; b.querySelector('b').textContent = c.name; b.querySelector('small').textContent = c.desc;
    b.addEventListener('click', () => { setCamera(i); panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); });
    panel.appendChild(b);
  });
  btn.addEventListener('click', () => { panel.hidden = !panel.hidden; btn.setAttribute('aria-expanded', String(!panel.hidden)); });
  addEventListener('pointerdown', (e) => { if (!panel.hidden && !e.target.closest('[data-ui]')) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); } }, true);
  addEventListener('keydown', (e) => { if (e.code === 'KeyC' && !e.repeat && !e.ctrlKey && !e.metaKey && !panels.isOpen() && !battle.active) setCamera(camIdx + 1); if (e.code === 'Escape') panel.hidden = true; });
  setCamera(camIdx, false);
}

// ---------- botones de giro de cámara ----------
{
  const hold = (el, dir) => {
    const stop = () => { if (rotBtn === dir) rotBtn = 0; };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); rotBtn = dir; try { el.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ } });
    el.addEventListener('pointerup', stop); el.addEventListener('pointercancel', stop); el.addEventListener('lostpointercapture', stop);
  };
  hold($('rot-l'), -1); hold($('rot-r'), 1);
  $('compass').addEventListener('click', () => { viewYaw = defaultYaw(); say(L('Cámara: vista original', 'Camera: original view')); });
}

// ---------- selector de escenario ----------
{
  const btn = $('esc'), panel = $('esc-panel');
  $('esc-name').textContent = theme.name;
  for (const t of THEMES) {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'menuitem');
    if (t.id === theme.id) b.classList.add('sel');
    const [r, g, bl] = [(t.ground.mid >> 16) & 255, (t.ground.mid >> 8) & 255, t.ground.mid & 255];
    b.innerHTML = '<i style="background:rgb(' + r + ',' + g + ',' + bl + ')"></i><span><b></b><small></small></span>';
    b.querySelector('b').textContent = t.name; b.querySelector('small').textContent = t.desc;
    b.addEventListener('click', () => {
      if (t.id === theme.id) { panel.hidden = true; return; }
      store.set('criaturas.escenario', t.id);
      const u = new URL(location.href); u.searchParams.delete('escenario'); location.href = u.toString();
    });
    panel.appendChild(b);
  }
  const foot = document.createElement('div'); foot.className = 'foot'; panel.appendChild(foot);
  const paintEsc = () => {
    $('esc-name').textContent = theme.name;
    panel.querySelectorAll('button').forEach((b, i) => { b.querySelector('b').textContent = THEMES[i].name; b.querySelector('small').textContent = THEMES[i].desc; });
    foot.textContent = L('Cambiar de escenario recarga el juego. Tu partida se conserva.', 'Changing the scenery reloads the game. Your progress is kept.');
  };
  paintEsc(); onLang(paintEsc);
  const close = () => { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', () => { panel.hidden = !panel.hidden; btn.setAttribute('aria-expanded', String(!panel.hidden)); });
  addEventListener('pointerdown', (e) => { if (!panel.hidden && !e.target.closest('[data-ui]')) close(); }, true);
  addEventListener('keydown', (e) => { if (e.code === 'Escape') close(); });
}

// ---------- pantalla completa ----------
const fs = $('fs');
if (document.fullscreenEnabled) {
  fs.classList.add('ok');
  const toggle = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); };
  fs.addEventListener('click', toggle);
  addEventListener('keydown', (e) => { if (e.code === 'KeyF' && !e.repeat && !e.ctrlKey && !e.metaKey && !panels.isOpen() && !battle.active) toggle(); });
}

// ---------- portada (menú de inicio) y botón de menú ----------
// La portada aparece al abrir el juego: Continuar / Jugar, Nueva partida, Cómo jugar y Ajustes. Su primer toque arranca la música.
var titleOn = true, titleCam = false;
var titleCage = world.cages.find((c) => c.species.id === 'fenix') || world.cages[0] || null;   // la portada mira al fénix (y al dragón y al gato de brasa, sus vecinos)
// Controles del mundo (no la portada): inertes mientras la portada, un panel o un combate estén activos. Cerrar un panel con la
// portada aún abierta no debe devolverles el foco; panels.setInert avisa por hooks.afterInert y se vuelve a calcular aquí.
const WORLD_UI = ['labels', 'zone', 'rot', 'coins', 'goal', 'act', 'esc', 'esc-panel', 'cam', 'cam-panel', 'fs', 'hint', 'menu', 'toast'].map($);
function syncWorldInert() {
  const worldDisabled = titleOn || panels.isOpen() || battle.active;
  for (const x of WORLD_UI) if (x) { if (worldDisabled) x.setAttribute('inert', ''); else x.removeAttribute('inert'); }
  const t = $('title'); if (t) { if (panels.isOpen()) t.setAttribute('inert', ''); else t.removeAttribute('inert'); }
}
panels.hooks.afterInert = syncWorldInert;
function showTitle(on) {
  titleOn = on; const t = $('title'); t.hidden = !on; document.body.classList.toggle('title-on', on);
  syncWorldInert();
  if (on) {
    paintTitle();
    if (!coarse) setTimeout(() => { if (titleOn) $('t-play').focus({ preventScroll: true }); }, 60);
  } else { updateGoal(); measureReserved(); if (!panels.isOpen() && !coarse) { const c = $('gl'); if (c && !(document.activeElement && document.activeElement !== document.body && document.activeElement.closest('[data-ui]'))) c.focus({ preventScroll: true }); } }
}
function paintTitle() {
  const has = G.hasGame();
  {
    $('t-play').textContent = has ? L('Continuar partida', 'Continue game') : L('Jugar', 'Play');   // SRC-G03: «Continuar partida» recupera el guardado
    $('t-new').hidden = !has;
    const beaten = G.leagueBeaten();
    $('tprog').innerHTML = has ? `<span>${G.isChampion() ? L('♛ Campeón del Bestiario', '♛ Bestiary Champion') : `${L('Liga', 'League')} ${beaten}/${LEAGUE.length}`}</span><span>${L('Bestiario', 'Bestiary')} ${G.dexCount()}/${SPECIES.length}</span><span>${G.state().coins} ${L('monedas', 'coins')}</span>` : '';
    $('tprog').hidden = !has;
  }
}
$('t-play').addEventListener('click', () => { Sound.sfx('ok'); showTitle(false); if (!G.hasGame()) panels.openInicio(); });
$('t-new').addEventListener('click', () => { Sound.sfx('click'); showTitle(false); panels.newGame(); });
$('t-help').addEventListener('click', () => { Sound.sfx('click'); panels.openMenu('ayuda'); });
$('t-set').addEventListener('click', () => { Sound.sfx('click'); panels.openMenu('ajustes'); });
$('menu').addEventListener('click', () => { if (!battle.active && !panels.isOpen()) panels.openMenu(); });
// en la portada, Intro o Espacio juegan aunque el foco no esté en el botón (por ejemplo, tras hacer clic en la escena)
addEventListener('keydown', (e) => { if (titleOn && !panels.isOpen() && (e.code === 'Enter' || e.code === 'Space') && !e.repeat && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('button, a'))) { e.preventDefault(); $('t-play').click(); } });
// Esc sin nada abierto: abre el menú (pausa)
panels.hooks.escMenu = () => { if (titleOn || battle.active || !$('cam-panel').hidden || !$('esc-panel').hidden) return; panels.openMenu(); };
// ---------- idioma (común a todo jetgames.fun): el selector ES | EN de la portada y el de Ajustes cambian todo en vivo ----------
// Al cambiar, se repinta lo que ya está en pantalla sin recargar ni tocar la partida: rótulos de zona, objetivo, botón de acción,
// pista, cámaras y portada. Menús, combate, carteles 3D y personal se repintan solos (cada módulo escucha 'jet-idioma').
for (const b of document.querySelectorAll('#t-lang [data-lang]')) b.addEventListener('click', () => { Sound.sfx('click'); window.JETIdioma.set(b.dataset.lang); });
onLang(() => {
  paintHint();
  labels.forEach((Lb, i) => { Lb.el.querySelector('.nm').textContent = world.zones[i].name; Lb.wi = Lb.we = 0; });
  const z = world.zones.find((x) => x.id === activeId); if (z) { $('zone-name').textContent = z.name; $('zone-desc').textContent = z.desc; }
  document.querySelectorAll('#cam-panel button').forEach((b, k) => { b.querySelector('b').textContent = CAMS[k].name; b.querySelector('small').textContent = CAMS[k].desc; });
  actTarget = null; updateAct(); updateGoal(); measureReserved();
  if (titleOn) paintTitle();
});
const noTitle = new URLSearchParams(location.search).has('sinportada');
showTitle(!noTitle);
streamCages(); setInterval(streamCages, 700);   // después de la portada: así sabe que lo primero es el fénix

// ---------- gancho para pruebas ----------
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || new URLSearchParams(location.search).has('debug')) window.CRIA = {
  THREE, scene, camera, renderer, world, player, creatures, input, theme, actors, setCamera, cams: CAMS, camIndex: () => camIdx,
  npcs, panels, G, coins, battle, Sound, showTitle, titleOn: () => titleOn,
  zone: () => activeId,
  // avanza `seconds` de juego empujando en la dirección (mx, mz); mz>0 = sur
  step(seconds, mx = 0, mz = 0, run = false) {
    input.override = { x: mx, y: mz, run };
    for (let i = 0, n = Math.round(seconds * 60); i < n; i++) tick(1 / 60);
    input.override = null;
    render();
    return { x: +player.pos.x.toFixed(2), z: +player.pos.z.toFixed(2), zone: activeId };
  },
  teleport(x, z) {
    player.pos.x = x; player.pos.z = z; player.vx = player.vz = 0;
    for (let i = 0; i < 30; i++) updateCamera(1 / 60, true);
    player.sync(); updateZone(); render();
  },
};
