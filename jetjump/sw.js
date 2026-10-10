// JETJump Service Worker
const CACHE_NAME = 'jetjump-v0.1.0';
const ASSETS = ['./', './index.html', './manifest.json',
  './src/ui.js', './src/game.js', './src/scene.js', './src/horse.js', './src/sim.js', './src/courses.js', './src/data.js', './src/save.js', './src/audio.js', './src/rivals-worker.js',
  './vendor/three.module.js', './vendor/addons/objects/MarchingCubes.js',
  './vendor/addons/postprocessing/EffectComposer.js', './vendor/addons/postprocessing/RenderPass.js', './vendor/addons/postprocessing/UnrealBloomPass.js', './vendor/addons/postprocessing/OutputPass.js',
  './vendor/addons/postprocessing/ShaderPass.js', './vendor/addons/postprocessing/Pass.js', './vendor/addons/postprocessing/MaskPass.js',
  './vendor/addons/shaders/LuminosityHighPassShader.js', './vendor/addons/shaders/CopyShader.js', './vendor/addons/shaders/OutputShader.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(c => c || fetch(e.request).then(r => {
      if (r.ok && new URL(e.request.url).origin === location.origin) { const cp = r.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, cp)); }
      return r;
    }))
  );
});
