// JETDrift v0.4 — Entry point
// Bootstrap engine + theme + mode selector + game loop.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { Input } from './core/input.js';
import { Audio } from './core/audio.js';
import { Save } from './core/save.js';
import { Hovercraft } from './shared/hovercraft.js';
import { DunesTheme } from './themes/dunes.js';
import { SpireTheme } from './themes/spire.js';
import { CarreraMode } from './modes/carrera.js';
import { PaseoMode } from './modes/paseo.js';
import { StubMode } from './modes/stub.js';

// ============================================================================
// GLOBAL STATE
// ============================================================================
const state = {
  renderer: null,
  scene: null,
  camera: null,
  composer: null,
  bloomPass: null,
  clock: new THREE.Clock(),
  W: window.innerWidth,
  H: window.innerHeight,
  dpr: Math.min(window.devicePixelRatio || 1, 2),

  themeName: 'dunes',
  modeName: null,
  theme: null,         // active Theme instance
  mode: null,          // active Mode instance
  hovercraft: null,
  input: null,
  audio: null,
  save: null,

  paused: false,
  running: false,
};

// ============================================================================
// THREE INIT
// ============================================================================
function initRenderer() {
  const canvas = document.getElementById('render-canvas');
  state.renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
  });
  state.renderer.setPixelRatio(state.dpr);
  state.renderer.setSize(state.W, state.H, false);
  state.renderer.outputColorSpace = THREE.SRGBColorSpace;
  state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  state.renderer.toneMappingExposure = 1.0;
  state.renderer.shadowMap.enabled = false;

  state.scene = new THREE.Scene();
  state.camera = new THREE.PerspectiveCamera(58, state.W / state.H, 0.1, 600);
  state.camera.position.set(0, 6, 10);

  // Composer for bloom (subtle, not aggressive)
  state.composer = new EffectComposer(state.renderer);
  state.composer.addPass(new RenderPass(state.scene, state.camera));
  state.bloomPass = new UnrealBloomPass(new THREE.Vector2(state.W, state.H), 0.45, 0.6, 0.75);
  state.composer.addPass(state.bloomPass);
  state.composer.addPass(new OutputPass());

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
}

function onResize() {
  state.W = window.innerWidth;
  state.H = window.innerHeight;
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.renderer.setPixelRatio(state.dpr);
  state.renderer.setSize(state.W, state.H, false);
  state.composer.setSize(state.W, state.H);
  state.bloomPass.setSize(state.W, state.H);
  state.camera.aspect = state.W / state.H;
  state.camera.updateProjectionMatrix();
}

// ============================================================================
// THEME / MODE LOADING
// ============================================================================
function loadTheme(name) {
  // Cleanup old theme
  if (state.theme) {
    state.theme.dispose(state.scene);
    state.theme = null;
  }
  document.body.classList.remove('theme-dunes', 'theme-spire');
  document.body.classList.add('theme-' + name);

  if (name === 'dunes') state.theme = new DunesTheme();
  else if (name === 'spire') state.theme = new SpireTheme();
  else throw new Error('Unknown theme ' + name);

  state.theme.build(state.scene);
  // Theme-specific bloom intensity
  state.bloomPass.strength = state.theme.bloomStrength ?? 0.45;
  state.bloomPass.radius = state.theme.bloomRadius ?? 0.6;
  state.bloomPass.threshold = state.theme.bloomThreshold ?? 0.75;

  state.themeName = name;
}

function loadMode(name) {
  // Cleanup old mode
  if (state.mode) {
    state.mode.dispose(state.scene);
    state.mode = null;
  }
  if (name === 'carrera') state.mode = new CarreraMode();
  else if (name === 'paseo') state.mode = new PaseoMode();
  else state.mode = new StubMode(name);

  state.mode.build(state.scene, state.theme);
  state.modeName = name;

  // Spawn hovercraft at mode's start point
  if (!state.hovercraft) {
    state.hovercraft = new Hovercraft(state.scene, state.theme);
  } else {
    state.hovercraft.attach(state.scene, state.theme);
  }
  state.hovercraft.respawn(state.mode.spawnPoint());
}

// ============================================================================
// MENU / UI WIRING
// ============================================================================
function setupMenuUI() {
  // Theme chips
  document.querySelectorAll('.theme-chip').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.theme-chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      const t = el.dataset.theme;
      // Live preview switch in menu (we rebuild theme but no mode active)
      previewTheme(t);
    });
  });

  // Mode cards
  document.querySelectorAll('.mode-card').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (el.classList.contains('locked')) return;
      const mode = el.dataset.mode;
      startGame(mode);
    });
  });

  // Pause btn
  document.getElementById('btn-pause').addEventListener('click', () => {
    if (state.running && !state.paused) pauseGame();
  });
  document.getElementById('btn-resume').addEventListener('click', () => resumeGame());
  document.getElementById('btn-pause-to-menu').addEventListener('click', () => backToMenu());
  document.getElementById('btn-replay').addEventListener('click', () => {
    document.getElementById('overlay-win').classList.remove('show');
    startGame(state.modeName);
  });
  document.getElementById('btn-back-to-menu').addEventListener('click', () => {
    document.getElementById('overlay-win').classList.remove('show');
    backToMenu();
  });
}

function previewTheme(name) {
  // Cambia el theme del fondo inmediatamente
  loadTheme(name);
  // Si no hay mode activo, ponemos un "showcase" del theme — la cámara orbita
  if (!state.mode) {
    state.camera.position.set(0, 8, 18);
    state.camera.lookAt(0, 1, 0);
  }
}

function startGame(modeName) {
  document.getElementById('menu-intro').classList.remove('show');
  document.getElementById('overlay-pause').classList.remove('show');
  // Theme actual sale del active chip
  const activeChip = document.querySelector('.theme-chip.active');
  const themeName = activeChip ? activeChip.dataset.theme : 'dunes';
  if (themeName !== state.themeName) loadTheme(themeName);
  loadMode(modeName);
  state.audio.startTheme(themeName);
  state.audio.startMode(modeName);
  state.running = true;
  state.paused = false;

  // Hint
  const hint = document.getElementById('hint');
  hint.style.opacity = '1';
  setTimeout(() => { hint.style.opacity = '0'; }, 4500);
}

function pauseGame() {
  state.paused = true;
  document.getElementById('overlay-pause').classList.add('show');
  state.audio.pauseAll();
}
function resumeGame() {
  state.paused = false;
  document.getElementById('overlay-pause').classList.remove('show');
  state.audio.resumeAll();
}
function backToMenu() {
  state.running = false;
  state.paused = false;
  state.audio.stopAll();
  if (state.mode) { state.mode.dispose(state.scene); state.mode = null; }
  state.modeName = null;
  document.getElementById('overlay-pause').classList.remove('show');
  document.getElementById('overlay-win').classList.remove('show');
  document.getElementById('menu-intro').classList.add('show');
}

// ============================================================================
// GAME LOOP
// ============================================================================
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, state.clock.getDelta());

  // Theme always updates (sky animation, etc.) even in menu
  if (state.theme) state.theme.update(dt, state);

  if (state.running && !state.paused) {
    if (state.input) state.input.update(dt);
    if (state.hovercraft) state.hovercraft.update(dt, state.input, state);
    if (state.mode) {
      const events = state.mode.update(dt, state.hovercraft, state);
      handleModeEvents(events);
    }
    updateCamera(dt);
    updateHUD();
  } else {
    // Menu — orbit camera around theme showcase
    if (state.theme && !state.running) {
      const t = performance.now() * 0.0001;
      state.camera.position.x = Math.sin(t) * 22;
      state.camera.position.z = Math.cos(t) * 22;
      state.camera.position.y = 7 + Math.sin(t * 2) * 1.2;
      state.camera.lookAt(0, 2, 0);
    }
  }

  state.composer.render();
}

function handleModeEvents(events) {
  if (!events) return;
  if (events.win) {
    state.running = false;
    document.getElementById('win-time').textContent = events.win.time;
    document.getElementById('win-best').textContent = events.win.best || '--:--';
    document.getElementById('overlay-win').classList.add('show');
    state.audio.playFanfare();
  }
  if (events.checkpoint) {
    state.audio.playPickup();
    if (navigator.vibrate) navigator.vibrate(15);
  }
}

// ============================================================================
// CAMERA — 3rd person follow with smoothing
// ============================================================================
const camTarget = new THREE.Vector3();
const camOffset = new THREE.Vector3();
function updateCamera(dt) {
  if (!state.hovercraft) return;
  const h = state.hovercraft;
  // Position camera behind+above hovercraft based on its heading
  const camDist = 9;
  const camHeight = 4.5;
  const cs = Math.cos(h.yaw), sn = Math.sin(h.yaw);
  const targetX = h.position.x - sn * camDist;
  const targetZ = h.position.z + cs * camDist;
  const targetY = h.position.y + camHeight;

  // Smooth lerp
  state.camera.position.x += (targetX - state.camera.position.x) * Math.min(1, dt * 5.5);
  state.camera.position.z += (targetZ - state.camera.position.z) * Math.min(1, dt * 5.5);
  state.camera.position.y += (targetY - state.camera.position.y) * Math.min(1, dt * 4);

  // Look at point slightly above hovercraft
  camTarget.set(h.position.x, h.position.y + 1.2, h.position.z);
  state.camera.lookAt(camTarget);
}

// ============================================================================
// HUD
// ============================================================================
function updateHUD() {
  if (!state.mode) return;
  const hud = state.mode.getHUD ? state.mode.getHUD() : null;
  if (!hud) return;
  if (hud.left) {
    document.getElementById('hud-left-label').textContent = hud.left.label;
    document.getElementById('hud-left-value').textContent = hud.left.value;
  }
  if (hud.right) {
    document.getElementById('hud-right-label').textContent = hud.right.label;
    document.getElementById('hud-right-value').textContent = hud.right.value;
    document.getElementById('hud-pill-right').style.display = '';
  } else {
    document.getElementById('hud-pill-right').style.display = 'none';
  }
}

// ============================================================================
// LOADING ANIMATION
// ============================================================================
function fakeLoading(callback) {
  const bar = document.getElementById('loading-bar');
  let p = 0;
  const tick = () => {
    p += 8 + Math.random() * 14;
    if (p > 100) p = 100;
    bar.style.width = p + '%';
    if (p < 100) setTimeout(tick, 90);
    else {
      setTimeout(() => {
        document.getElementById('loading').classList.add('hide');
        callback();
      }, 250);
    }
  };
  tick();
}

// ============================================================================
// BOOT
// ============================================================================
async function boot() {
  initRenderer();
  state.input = new Input();
  state.audio = new Audio();
  state.save = new Save();
  setupMenuUI();
  // Load default theme for menu showcase
  loadTheme('dunes');
  // Ensure audio context warmed up (must be after user interaction usually)
  document.addEventListener('pointerdown', () => state.audio.ensure(), { once: true });
  // Start render loop
  animate();
  // Hide loading screen after a short pause for polish
  fakeLoading(() => {});
}

boot();

// Service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
