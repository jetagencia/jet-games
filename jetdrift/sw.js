// JETDrift v0.5 Service Worker
const CACHE_NAME = 'jetdrift-v0.5.0';
const ASSETS = ['./', './index.html', './manifest.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(()=>{})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(c => c || fetch(e.request).then(r => {
      const cp = r.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, cp)).catch(()=>{});
      return r;
    }).catch(() => caches.match('./index.html')))
  );
});
