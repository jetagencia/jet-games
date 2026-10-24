// JET//Caja Negra · vista de los registros (ficha, bitácora, radio, telemetría, foto, mantenimiento)
// y sus gestos: pellizco/rueda/doble toque en la foto, cursor de lectura en la telemetría.
(function (G) {
  'use strict';
  const DB = () => G.CN_DIBUJO;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Convierte el texto con marcas de entidad en HTML con <span class="ent">.
  function ents(str) {
    let out = '';
    const re = /\u0001([^\u0002]*)\u0002([^\u0003]*)\u0003/g;
    let i = 0, m;
    while ((m = re.exec(str))) {
      out += esc(str.slice(i, m.index));
      if (m[1] === 'ileg') out += '<span class="ileg" aria-label="' + esc(m[2]) + '">' + esc(m[2]) + '</span>';
      else out += '<span class="ent" role="button" tabindex="0" data-e="' + esc(m[1]) + '">' + esc(m[2]) + '</span>';
      i = re.lastIndex;
    }
    return out + esc(str.slice(i));
  }
  const plano = (s) => String(s).replace(/\u0001[^\u0002]*\u0002/g, '').replace(/\u0003/g, '');

  // Entidades que aparecen en cada registro (para el punto de la pestaña).
  function entidadesPorRegistro(caso) {
    const W = G.CNX.mundo;
    return caso.registros.map((r) => {
      const s = new Set();
      const scan = (str) => { if (!str) return; const re = /\u0001([^\u0002]*)\u0002/g; let m; while ((m = re.exec(str))) s.add(m[1]); };
      for (const lang of ['es']) {
        scan(r.meta[lang]);
        for (const l of r.lineas) { scan(l.txt[lang]); if (l.quien) scan(l.quien[lang]); }
      }
      if (r.tipo === 'telemetria') r.datos.series.forEach((x) => s.add('m:' + x.mod));
      if (r.tipo === 'foto') { r.datos.astronautas.forEach((a) => s.add('pa:' + a.parche)); r.claims.forEach((c) => s.add('m:' + c.mod)); s.add('t:' + r.datos.reloj); }
      return s;
    });
  }

  function cuerpoTexto(r, L, t, resaltar) {
    const W = G.CNX.mundo;
    const rs = resaltar || [];
    const cls = (i) => (rs.includes(i) ? ' resalta' : '');
    let h = '';
    if (r.tipo === 'tripulacion') {
      r.lineas.forEach((l, i) => {
        const p = l.txt[L].split(' · ');
        const c = l.claims[0];
        const col = DB().COLOR_PARCHE[(c.parche - 1) % 9];
        h += '<div class="crew linea' + cls(i) + '" data-l="' + i + '"><span class="cs">' + ents(p[0]) + '</span><span class="nom">' + ents(p[1]) + '</span><span class="rol">' + ents(p[2]) + '</span><span class="pa"><i style="background:' + col + '" aria-hidden="true">' + c.parche + '</i>' + ents(p[3]) + '</span></div>';
      });
    } else if (r.tipo === 'mantenimiento') {
      r.lineas.forEach((l, i) => {
        const cab = l.txt[L].split(' — ')[0];
        const partes = cab.split(' · ');
        const campos = l.campos ? l.campos.map((c) => c.v[L]) : l.txt[L].split(' — ')[1].split(' · ');
        h += '<div class="mant linea' + cls(i) + '" data-l="' + i + '" style="display:block"><div class="eq">' + ents(partes[0]) + '<small>' + partes.slice(1).map(ents).join(' · ') + '</small></div><div class="campos">' + campos.map((c) => '<span class="campo">' + ents(c) + '</span>').join('') + '</div></div>';
      });
    } else {
      r.lineas.forEach((l, i) => {
        h += '<div class="linea' + (l.control ? ' ctrl' : '') + cls(i) + '" data-l="' + i + '"><span class="h">' + (l.hora ? esc(l.hora) : '—') + '</span><span class="tx">' + (l.quien ? '<span class="q">' + ents(l.quien[L]) + ':</span>' : '') + ents(l.txt[L]) + '</span></div>';
      });
    }
    return h;
  }

  // ───────────── Foto: zoom 1×-4×, arrastre, pellizco, rueda, doble toque ─────────────
  function montarFoto(cv, datos, L, est, cb) {
    let escena = null;
    const obtener = () => { if (!escena || escena._lang !== L) { escena = DB().escenaFoto(datos, L); escena._lang = L; } return escena; };
    function base() {
      const w = cv.clientWidth, h = cv.clientHeight;
      const s = Math.min(w / 1200, h / 900);
      return { w, h, s, ox: (w - 1200 * s) / 2, oy: (h - 900 * s) / 2 };
    }
    function limitar() {
      est.z = Math.max(1, Math.min(4, est.z));
      const m = 0.5 / est.z;
      est.x = Math.max(m, Math.min(1 - m, est.x));
      est.y = Math.max(m, Math.min(1 - m, est.y));
    }
    function dibujar() {
      const d = Math.min(3, G.devicePixelRatio || 1);
      const w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
      const c = cv.getContext('2d');
      c.setTransform(d, 0, 0, d, 0, 0);
      c.fillStyle = '#07040f'; c.fillRect(0, 0, w, h);
      limitar();
      const b = base();
      const S = b.s * est.z;
      const cx = w / 2 - (est.x * 1200) * S, cy = h / 2 - (est.y * 900) * S;
      c.imageSmoothingQuality = 'high';
      c.drawImage(obtener(), cx, cy, 1200 * S, 900 * S);
      if (cb.dibujado) cb.dibujado(est.z);
    }
    function zoomEn(px, py, nz) {
      const w = cv.clientWidth, h = cv.clientHeight, b = base();
      const S = b.s * est.z;
      const sx = est.x + (px - w / 2) / (1200 * S), sy = est.y + (py - h / 2) / (900 * S);
      const z0 = est.z;
      est.z = Math.max(1, Math.min(4, nz));
      const S2 = b.s * est.z;
      est.x = sx - (px - w / 2) / (1200 * S2); est.y = sy - (py - h / 2) / (900 * S2);
      limitar(); dibujar();
      if (est.z !== z0 && cb.zoom) cb.zoom(est.z);
    }
    const ptrs = new Map();
    let pinch = null, ultimoToque = 0, arrastre = null;
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      if (ptrs.size === 2) {
        const [a, b2] = [...ptrs.values()];
        pinch = { d: Math.hypot(a.x - b2.x, a.y - b2.y), z: est.z };
        arrastre = null;
      } else {
        arrastre = { x: e.offsetX, y: e.offsetY, ex: est.x, ey: est.y };
        const ahora = performance.now();
        if (ahora - ultimoToque < 300) { zoomEn(e.offsetX, e.offsetY, est.z > 1.2 ? 1 : 2.5); ultimoToque = 0; arrastre = null; }
        else ultimoToque = ahora;
      }
    });
    cv.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      if (pinch && ptrs.size === 2) {
        const [a, b2] = [...ptrs.values()];
        const d = Math.hypot(a.x - b2.x, a.y - b2.y);
        zoomEn((a.x + b2.x) / 2, (a.y + b2.y) / 2, pinch.z * (d / Math.max(10, pinch.d)));
      } else if (arrastre && est.z > 1) {
        const b = base(), S = b.s * est.z;
        est.x = arrastre.ex - (e.offsetX - arrastre.x) / (1200 * S);
        est.y = arrastre.ey - (e.offsetY - arrastre.y) / (900 * S);
        dibujar();
      }
    });
    const fin = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) { arrastre = null; if (cb.cambio) cb.cambio(); } };
    cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); zoomEn(e.offsetX, e.offsetY, est.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); if (cb.cambio) cb.cambio(); }, { passive: false });
    return {
      dibujar,
      zoom(f) { const w = cv.clientWidth, h = cv.clientHeight; if (f === 0) { est.z = 1; est.x = 0.5; est.y = 0.5; dibujar(); if (cb.zoom) cb.zoom(1); } else zoomEn(w / 2, h / 2, est.z * f); if (cb.cambio) cb.cambio(); }
    };
  }

  // ───────────── Telemetría: cursor de lectura ─────────────
  function montarTel(cv, datos, L, api) {
    let geo = null;
    function dibujar() {
      geo = DB().telemetria(cv, datos, L, api.cursor(), api.etiquetas(), api.colores());
    }
    function mover(e) {
      if (!geo) return;
      const t = Math.round(geo.xinv(e.offsetX));
      const tc = Math.max(datos.t0, Math.min(datos.t1, t));
      if (tc !== api.cursor()) { api.setCursor(tc); dibujar(); }
    }
    let activo = false;
    cv.addEventListener('pointerdown', (e) => { activo = true; cv.setPointerCapture(e.pointerId); mover(e); });
    cv.addEventListener('pointermove', (e) => { if (activo || e.pointerType === 'mouse') mover(e); });
    const fin = () => { activo = false; if (api.fin) api.fin(); };
    cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
    cv.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault(); e.stopPropagation();
        const c = api.cursor() == null ? Math.round((datos.t0 + datos.t1) / 2) : api.cursor() + (e.key === 'ArrowLeft' ? -1 : 1);
        api.setCursor(Math.max(datos.t0, Math.min(datos.t1, c))); dibujar(); if (api.fin) api.fin();
      }
    });
    return { dibujar };
  }

  function tablaTel(datos, L, etiquetas) {
    const D = DB();
    let h = '<table class="tabla"><thead><tr><th>' + (L === 'es' ? 'Hora' : 'Time') + '</th>' + etiquetas.map((e) => '<th>' + esc(e) + '</th>').join('') + '</tr></thead><tbody>';
    for (let t = datos.t0; t <= datos.t1; t++) h += '<tr><td>' + D.hhmm(t) + '</td>' + datos.series.map((s, i) => '<td>' + D.fmtValor(s.canal, D.valorSerie(datos, i, t), L) + '</td>').join('') + '</tr>';
    return h + '</tbody></table>';
  }

  G.CN_REG = { esc, ents, plano, entidadesPorRegistro, cuerpoTexto, montarFoto, montarTel, tablaTel };
})(typeof window !== 'undefined' ? window : globalThis);
