/* JET//Balizas · red: api.php con cola sin conexión y reintentos (2, 5 y 15 s). */
(function () {
'use strict';
const N = { base: 'api.php', online: true, lastErr: '', queue: [] };
window.BalNet = N;
const QK = 'jet-balizas:cola';
function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
N.loadQueue = function () { N.queue = ls(QK) || []; };
N.saveQueue = function () { ls(QK, N.queue.slice(-60)); };
N.id = function () {
  let id = null; try { id = localStorage.getItem('jet-balizas:id'); } catch (e) {}
  if (!id || !/^[A-Za-z0-9_-]{22}$/.test(id)) {
    const b = new Uint8Array(16); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(b) : b.forEach((_, i) => b[i] = Math.random() * 256 | 0);
    id = btoa(String.fromCharCode.apply(null, b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    try { localStorage.setItem('jet-balizas:id', id); } catch (e) {}
  }
  return id;
};
async function req(method, accion, params, body, timeout) {
  if (!N.base) throw { code: 'offline' };
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, to = setTimeout(() => ctl && ctl.abort(), timeout || 8000);
  const q = new URLSearchParams(Object.assign({ accion }, params || {}));
  try {
    const r = await fetch(N.base + '?' + q.toString(), { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, cache: 'no-store', signal: ctl ? ctl.signal : undefined });
    let j = null; try { j = await r.json(); } catch (e) { throw { code: 'bad_json', status: r.status }; }
    if (!j || !j.ok) throw { code: (j && j.error) || 'server', status: r.status };
    N.setOnline(true); return j;
  } catch (e) {
    if (e && e.code && e.status && e.status < 500 && e.code !== 'bad_json') throw e; // error de la aplicación: el servidor sí respondió
    N.setOnline(false); throw e && e.code ? e : { code: 'offline' };
  } finally { clearTimeout(to); }
}
N.setOnline = function (v) { if (N.online !== v) { N.online = v; if (N.onstatus) N.onstatus(v); if (v) N.flush(); } };
N.get = (accion, params, timeout) => req('GET', accion, params, null, timeout);
N.post = (accion, body) => req('POST', accion, null, body);
// GET con reintentos automáticos (2, 5 y 15 s); tras eso, sin conexión
N.getRetry = async function (accion, params, onRetry) {
  const waits = [0, 2000, 5000, 15000];
  for (let i = 0; i < waits.length; i++) {
    if (waits[i]) { if (onRetry) onRetry(i); await new Promise(r => setTimeout(r, waits[i])); }
    try { return await N.get(accion, params); } catch (e) { if (e.code !== 'offline' && e.code !== 'server' && e.code !== 'bad_json') throw e; }
  }
  throw { code: 'offline' };
};
// POST que se encola si no hay señal (vuelos, votos)
N.send = async function (accion, body, key) {
  try { return await N.post(accion, body); }
  catch (e) {
    if (e.code === 'offline' || e.code === 'server' || e.code === 'bad_json') { N.queue = N.queue.filter(q => !key || q.key !== key); N.queue.push({ accion, body, key, t: Date.now() }); N.saveQueue(); e.queued = true; }
    throw e;
  }
};
let flushing = false;
N.flush = async function () {
  if (flushing || !N.queue.length || !N.base) return; flushing = true;
  try {
    while (N.queue.length) {
      const q = N.queue[0];
      try { const r = await N.post(q.accion, q.body); if (N.onflushed) N.onflushed(q, r, null); }
      catch (e) { if (e.code === 'offline' || e.code === 'server' || e.code === 'bad_json') break; if (N.onflushed) N.onflushed(q, null, e); }
      N.queue.shift(); N.saveQueue();
    }
  } finally { flushing = false; }
};
window.addEventListener('online', () => N.flush());
})();
