// Prueba de humo: sirve ./site, abre cada juego, registra errores de consola y toma capturas.
// Uso: node site/_auditoria/herramientas/smoke.mjs [juego ...]   (sin args: todos)
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, resolve } from 'path';
const ROOT = resolve('site');
const OUT = resolve('site/_auditoria/_smoke'); mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wasm': 'application/wasm' };
const srv = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  // subdominios viejos: jetball.jetgames.fun → /jetball/
  let f = join(ROOT, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); res.end('404 ' + p); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise(r => srv.listen(8787, r));
const GAMES = process.argv.slice(2).length ? process.argv.slice(2) : ['', 'jetball', 'astro', 'rocket', 'slalom', 'flow', 'match', 'words', 'box', 'salchidrez', 'escudos', 'senal', 'antes', 'telemetria', 'portada', 'cajanegra', 'crater', 'frentes', 'balizas', 'estacion', 'raid', 'jetjump', 'bestiario'];
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const report = {};
for (const g of GAMES) {
  const name = g || 'home';
  const errors = [], warnings = [], failed = [];
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); else if (m.type() === 'warning') warnings.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + String(e).slice(0, 300)));
  page.on('requestfailed', r => failed.push(r.url().replace('http://localhost:8787', '')));
  page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().replace('http://localhost:8787', '')); });
  const t0 = Date.now();
  try {
    await page.goto(`http://localhost:8787/${g}${g ? '/' : ''}`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(OUT, `${name}-390.png`) });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(OUT, `${name}-1280.png`) });
    const a11y = await page.evaluate(() => ({ title: document.title, h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim()).slice(0, 3), buttons: document.querySelectorAll('button').length, emptyButtons: [...document.querySelectorAll('button')].filter(b => !b.textContent.trim() && !b.getAttribute('aria-label') && !b.getAttribute('aria-labelledby') && !b.title && !b.querySelector('img[alt],svg[aria-label],svg title')).length, dialogs: document.querySelectorAll('[role=dialog],dialog').length, lang: document.documentElement.lang }));
    report[name] = { ok: true, ms: Date.now() - t0, errors: [...new Set(errors)].slice(0, 12), failed: [...new Set(failed)].filter(u => !/\.(png|jpg|jpeg|webp|svg|mp3|ogg|glb|json|ico|woff2?)(\?|$)/.test(u)).slice(0, 12), missingAssets: [...new Set(failed)].filter(u => /\.(png|jpg|jpeg|webp|svg|mp3|ogg|glb|json|ico|woff2?)(\?|$)/.test(u)).length, ...a11y };
  } catch (e) { report[name] = { ok: false, error: String(e).slice(0, 300), errors: [...new Set(errors)].slice(0, 12) }; }
  await page.close();
  console.log(name.padEnd(12), report[name].ok ? 'OK ' : 'FAIL', (report[name].ms || '') + 'ms', 'errores:', (report[name].errors || []).length, 'faltan(js/css):', (report[name].failed || []).length, 'botones vacíos:', report[name].emptyButtons ?? '-');
  for (const e of (report[name].errors || []).slice(0, 4)) console.log('    ', e);
  for (const f of (report[name].failed || []).slice(0, 4)) console.log('     falta', f);
}
writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 1));
await browser.close(); srv.close();
