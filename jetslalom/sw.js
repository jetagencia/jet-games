// JETSlalom Service Worker
const CACHE_NAME = 'jetslalom-v0.1.0';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(c => c || fetch(e.request).then(r => {
      const cp = r.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, cp));
      return r;
    }))
  );
});
