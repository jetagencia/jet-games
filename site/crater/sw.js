/* JET//Cráter · service worker: red primero, caché como respaldo para jugar sin conexión.
   Subir CACHE_NAME en cada publicación. La API nunca se guarda en caché. */
const CACHE_NAME='jet-crater-v7';
const BASE=['./','index.html','manifest.json','icon-192.png','icon-512.png','src/jet-idioma.js?v=1','src/estilo.css?v=6','src/bancos.js?v=1','src/horno.js?v=1','src/gen.js?v=1','src/textos.js?v=3','src/audio.js?v=3','src/mapa.js?v=1','src/estado.js?v=1','src/red.js?v=2','src/ui.js?v=6'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(BASE)).then(()=>self.skipWaiting()).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('jet-crater-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.endsWith('api.php'))return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,cp));}return r;}).catch(()=>caches.match(e.request,{ignoreSearch:false}).then(r=>r||caches.match('index.html'))));
});
