// Vista previa 3D de una criatura (con cualquiera de sus formas) dentro de los menús, con su propio lienzo.
import * as THREE from '../vendor/three.module.js';
import { spawnCreature } from './model3d.js';
import { makeEnv } from './env.js';
import { SPECIES } from './species.js';
import * as G from './state.js';
import { LOD, DPR_MAX } from './quality.js';

export function createPreview(themeEnv) {
  let canvas = null;   // un lienzo nuevo en cada init(): el de un contexto liberado ya no sirve
  let renderer = null, scene = null, camera = null;
  let actor = null, token = 0, raf = 0, last = 0, spin = 0, cur = { id: null, form: null }, ro = null, idleT = 0;

  function init() {
    if (renderer) return;
    canvas = document.createElement('canvas'); canvas.className = 'pv-canvas';
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, DPR_MAX));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    scene = new THREE.Scene();
    scene.environment = makeEnv(renderer, themeEnv);
    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x403830, 0.9));
    const key = new THREE.DirectionalLight(0xfff0dc, 2.2); key.position.set(-4, 7, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fb7ff, 1.1); rim.position.set(5, 3, -6); scene.add(rim);
    camera = new THREE.PerspectiveCamera(32, 1.6, 0.1, 100);
  }

  function fit(slot) {
    const w = Math.max(160, slot.clientWidth || 320), h = Math.max(120, slot.clientHeight || 200);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  async function load(speciesId) {
    const sp = SPECIES.find((s) => s.id === speciesId);
    if (actor) { scene.remove(actor.holder); actor = null; }
    if (!sp || !sp.model) return null;
    const my = ++token;
    const getMeta = (l) => fetch(`assets/${sp.model}-${l}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const lod = LOD;
    let l = lod, meta = await getMeta(l); if (!meta && l === 'sd') { l = 'hd'; meta = await getMeta('hd'); }
    meta = { scale: sp.scale || 1, offsetZ: sp.offsetZ || 0, ...(meta || {}) };
    const skin = sp.skin || null;
    const a = await spawnCreature({ url: `assets/${sp.model}-${l}.glb`, scene: null, x: 0, z: 0, yaw: 0, scale: meta.scale, offsetZ: meta.offsetZ, skin });
    if (my !== token) return null; // se pidió otra criatura mientras cargaba
    a.metaSize = meta.size || null; actor = a; scene.add(a.holder);
    return a;
  }

  function frame() {
    const h = actor.holder, ry = h.rotation.y; h.rotation.y = 0; h.position.set(0, 0, 0);
    const k = h.scale.x, sz = actor.metaSize; let r, cy;
    if (sz) { r = Math.max(0.8, 0.5 * Math.hypot(sz.ancho, sz.largo, sz.alto) * k); cy = sz.alto * k * 0.45; }
    else { h.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(h), c = box.getCenter(new THREE.Vector3()); r = Math.max(1, box.getSize(new THREE.Vector3()).length() * 0.5); cy = c.y; h.position.x -= c.x; h.position.z -= c.z; }
    h.rotation.y = ry;
    const d = (r / Math.sin((camera.fov * Math.PI) / 360)) * 0.62;
    camera.position.set(0, cy + r * 0.3, d); camera.lookAt(0, cy, 0);
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (!actor) { renderer.clear(); return; }
    spin += dt * 0.5; actor.holder.rotation.y = spin; actor.update(dt);
    renderer.render(scene, camera);
  }

  return {
    get canvas() { return canvas; },
    // monta el lienzo dentro de `slot` y muestra a la criatura en la forma pedida
    async show(slot, speciesId, form) {
      clearTimeout(idleT);
      init(); slot.appendChild(canvas); fit(slot);
      if (ro) ro.disconnect();
      if (window.ResizeObserver) { ro = new ResizeObserver(() => { if (renderer) fit(slot); }); ro.observe(slot); }   // al girar la pantalla el lienzo se reajusta
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
      if (cur.id !== speciesId || !actor) {
        cur = { id: speciesId, form: null };
        const a = await load(speciesId);
        if (a) { a.setForm(form || 'base'); frame(); cur.form = form || 'base'; }
        return;
      }
      if (cur.form !== (form || 'base')) { actor.setForm(form || 'base'); frame(); cur.form = form || 'base'; }
    },
    stop() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (ro) { ro.disconnect(); ro = null; }
      // con el menú cerrado un rato se libera el segundo contexto WebGL (los móviles limitan cuántos se pueden tener)
      clearTimeout(idleT);
      idleT = setTimeout(() => { if (renderer && !raf) { if (actor) { scene.remove(actor.holder); actor = null; } renderer.dispose(); renderer.forceContextLoss(); renderer = null; scene = null; camera = null; cur = { id: null, form: null }; } }, 20000);
    },
    forget() { cur = { id: null, form: null }; },
  };
}
