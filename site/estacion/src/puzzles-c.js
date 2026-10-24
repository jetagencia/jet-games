// JET//Estación Silencio · enigmas: Archivo (buscador), Tripulación (escenas), manifiesto y Carta estelar.
'use strict';
(() => {
  const { COL, RAINBOW, rrect, plate, text, fit, glow, bg, star } = DR;
  const { inR } = PZU;
  const t = (k, v) => I18N.t(k, v);
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ================= Archivo: motor de búsqueda (estilo «Her Story») =================
  const ARCH = {
    corpus(lang) {
      const C = CORE.C; const all = C.corpus.slice();
      for (const id of ['ar-1', 'ar-2', 'ar-3', 'ar-4', 'ar-meta']) all.push(...(CORE.variantOf(id).d.e || []));
      return all.filter(e => e[lang]).map(e => {
        const post = (C.posts[e.p] || [e.p, e.p])[lang === 'en' ? 1 : 0];
        const toks = new Set([...String(e[lang]).split(/[\s,.;:¿?¡!«»"()\-—]+/), ...post.split(/\s+/)].map(CORE.norm).filter(Boolean));
        toks.add(e.c); toks.add(String(+e.c));
        return { c: e.c, t: e.t, post, txt: e[lang], toks };
      }).sort((a, b) => (+a.c - +b.c) || a.t.localeCompare(b.t));
    },
    search(q, lang) {
      const terms = String(q).split(/\s+/).map(CORE.norm).filter(Boolean); if (!terms.length) return null;
      const isNum = (s) => /^\d+$/.test(s);
      return this.corpus(lang).filter(e => terms.every(term => { for (const tk of e.toks) { if (tk === term) return true; if (term.length >= 4 && tk.startsWith(term)) return true; if (isNum(term) && isNum(tk) && +term === +tk) return true; } return false; }));
    },
  };
  window.ARCH = ARCH;
  function terminal(cx, host) {
    const S = (CORE.G.ui.archive ||= { hist: [], q: '' });
    const root = document.createElement('div'); root.className = 'ar-term';
    root.innerHTML = `<form class="ar-form" autocomplete="off"><span class="ar-lupa" aria-hidden="true">⌕</span><input class="ar-in" type="search" enterkeyhint="search" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="60" aria-label="${esc(t('ar.search'))}" placeholder="${esc(t('ar.search'))}"><button class="btn sm cy" type="submit">${esc(t('ar.go'))}</button></form><div class="ar-hist" aria-label="${esc(t('ar.history'))}"></div><div class="ar-count" aria-live="polite"></div><div class="ar-res"></div>`;
    host.appendChild(root);
    const inp = root.querySelector('.ar-in'), res = root.querySelector('.ar-res'), cnt = root.querySelector('.ar-count'), hist = root.querySelector('.ar-hist');
    const render = () => {
      hist.innerHTML = S.hist.slice(-10).reverse().map(q => `<button type="button" class="chip">${esc(q)}</button>`).join('');
      hist.querySelectorAll('.chip').forEach(b => b.onclick = () => { inp.value = b.textContent; run(); });
      const r = S.q ? ARCH.search(S.q, cx.lang) : null;
      if (!r) { cnt.textContent = ''; res.innerHTML = `<p class="ar-empty">${esc(t('ar.empty'))}</p>`; return; }
      cnt.textContent = r.length ? (r.length > 5 ? t('ar.count', { n: r.length }) : t('ar.countFew', { n: r.length })) : t('ar.zero');
      res.innerHTML = r.slice(0, 5).map(e => `<article class="ar-e"><header><span>${t('ar.cycle')} ${e.c} · ${e.t}</span><b>${t('ar.sign')}: ${esc(e.post.toUpperCase())}</b></header><p>${esc(e.txt)}</p></article>`).join('');
    };
    const run = () => { const q = inp.value.trim().slice(0, 60); if (!q) return; S.q = q; S.hist = S.hist.filter(x => x !== q); S.hist.push(q); if (S.hist.length > 30) S.hist.shift(); cx.sfx('scan'); cx.save(); render(); res.scrollTop = 0; };
    root.querySelector('form').onsubmit = (e) => { e.preventDefault(); run(); inp.blur(); };
    inp.value = S.q || ''; render();
    return root;
  }
  PZ.archive = {
    dom: true,
    build(cx, host) {
      const q = document.createElement('div'); q.className = 'ar-q';
      q.innerHTML = `<span class="kick">TERMINAL · ${esc(cx.P.id.toUpperCase().replace('AR-', 'AR·'))}</span><p>${esc(I18N.L2(cx.P.q))}</p>` + (cx.P.id === 'ar-4' ? `<small>${esc(t('ar.posts'))}: ${Object.values(CORE.C.posts).map(p => esc(I18N.L2(p).toLowerCase())).join(' · ')}</small>` : '');
      host.appendChild(q); terminal(cx, host);
    },
  };
  PZ.shelves = {
    dom: true,
    build(cx, host) {
      const d = cx.d; const box = document.createElement('div'); box.className = 'shelves';
      const tags = [3, 7, 11, 13].map((n, f) => `<span class="tag ${cx.owned(f) ? 'on' : ''}">${cx.owned(f) ? String(n).padStart(2, '0') : '··'}</span>`).join('');
      box.innerHTML = `<div class="sh-tags"><span class="kick">${esc(cx.lang === 'en' ? 'Fragments' : 'Fragmentos')}</span>${tags}</div><div class="sh-grid">${[...d.plq].map((L, i) => `<div class="sh"><i>${String(i + 1).padStart(2, '0')}</i><b>${L}</b><span></span></div>`).join('')}</div>`;
      host.appendChild(box); terminal(cx, host);
    },
  };

  // ================= Tripulación =================
  const MUG = { violet: '#a46bff', amber: '#ffb347', green: '#4be37a' };
  function person(g, x, y, s, o) {
    // figura estilizada; o.holo: silueta holográfica, o.det: detalles visibles {hand,mug,boots,stripes}
    const holo = o.holo; const body = holo ? 'rgba(164,107,255,.28)' : '#d9dcea', edge = holo ? 'rgba(200,170,255,.6)' : 'rgba(0,0,0,.45)';
    g.save(); g.translate(x, y); g.lineWidth = 1.5; g.strokeStyle = edge;
    // piernas y botas
    g.fillStyle = body; rrect(g, -s * .2, s * .15, s * .16, s * .5, 4); g.fill(); g.stroke(); rrect(g, s * .04, s * .15, s * .16, s * .5, 4); g.fill(); g.stroke();
    const bt = o.det && o.det.boots; g.fillStyle = bt ? (bt === 'mag' ? '#3b4258' : '#7a6a58') : body; rrect(g, -s * .23, s * .58, s * .22, s * .12, 4); g.fill(); rrect(g, s * .01, s * .58, s * .22, s * .12, 4); g.fill();
    if (bt === 'mag') { g.fillStyle = COL.cy; g.shadowColor = COL.cy; g.shadowBlur = 10; g.fillRect(-s * .23, s * .68, s * .22, 3); g.fillRect(s * .01, s * .68, s * .22, 3); g.shadowBlur = 0; }
    // torso
    g.fillStyle = body; rrect(g, -s * .27, -s * .32, s * .54, s * .52, 10); g.fill(); g.stroke();
    // brazos (o.raise: 'L'|'R' brazo levantado, desde el punto de vista de la figura de frente → la izquierda queda a la derecha de quien mira)
    const side = o.raise ? (o.back ? (o.raise === 'L' ? -1 : 1) : (o.raise === 'L' ? 1 : -1)) : 0;
    [-1, 1].forEach(sg => { g.save(); g.translate(sg * s * .32, -s * .26); if (sg === side) g.rotate(sg * -2.4); g.fillStyle = body; rrect(g, -s * .07, 0, s * .14, s * .44, 5); g.fill(); g.stroke();
      if (o.det && o.det.stripes && (sg === side || !side)) { g.fillStyle = '#ffd34d'; for (let k = 0; k < o.det.stripes; k++) g.fillRect(-s * .07, s * .08 + k * s * .06, s * .14, s * .03); }
      if (sg === side && o.det && o.det.mug) { g.fillStyle = MUG[o.det.mug]; rrect(g, -s * .1, s * .42, s * .2, s * .17, 3); g.fill(); g.strokeStyle = MUG[o.det.mug]; g.lineWidth = 3; g.beginPath(); g.arc(s * .12, s * .5, s * .05, -1.4, 1.4); g.stroke(); }
      else if (sg === side) { g.fillStyle = '#ffd9b8'; g.beginPath(); g.arc(0, s * .47, s * .07, 0, 7); g.fill(); }
      g.restore(); });
    // cabeza
    g.fillStyle = holo ? 'rgba(164,107,255,.35)' : '#e8ebf5'; g.beginPath(); g.arc(0, -s * .5, s * .17, 0, 7); g.fill(); g.stroke();
    if (holo) { g.strokeStyle = 'rgba(200,170,255,.12)'; for (let k = -s * .7; k < s * .7; k += 4) { g.beginPath(); g.moveTo(-s * .35, k); g.lineTo(s * .35, k); g.stroke(); } }
    if (o.num != null) { text(g, String(o.num), 0, -s * .85, { s: Math.max(12, s * .2), w: 800, c: '#ffe08a', glow: '#000' }); }
    if (o.hl) { g.strokeStyle = COL.cy; g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); g.ellipse(0, s * .05, s * .5, s * .95, 0, 0, 7); g.stroke(); g.setLineDash([]); }
    g.restore();
  }
  function detailsBox(g, cx, x, y, w, det) {
    const L = cx.lang; const rows = Object.entries(det).map(([k, v]) => [t('tr.' + k), k === 'hand' ? t('tr.' + v) : k === 'mug' ? t('tr.' + v) : k === 'boots' ? t('tr.' + v) : String(v), k === 'mug' ? MUG[v] : null]);
    const h = 30 + rows.length * 24; plate(g, x, y, w, h, { top: '#171D29', bot: '#10151F', edge: 'rgba(0,242,207,.4)', rivets: false }); text(g, t('tr.seen').toUpperCase(), x + 12, y + 15, { s: 10, a: 'left', c: COL.cy, w: 700 });
    rows.forEach(([k, v, sw], i) => { const yy = y + 36 + i * 24; text(g, k, x + 12, yy, { s: 13, a: 'left', c: COL.dim }); text(g, v, x + w - 12, yy, { s: 14, a: 'right', w: 800, c: COL.ink }); if (sw) { g.fillStyle = sw; g.beginPath(); g.arc(x + w - 24 - g.measureText(v).width, yy, 6, 0, 7); g.fill(); } }); return h;
  }
  function fileOverlay(g, cx, w, h) {
    const C = CORE.C; const L = cx.lang; const rows = C.crew; const land = w > h;
    const rw = Math.min(w - 20, 640), rh = Math.min(land ? (h - 70) / 7 : 46, 52), x0 = (w - rw) / 2, y0 = Math.max(8, (h - rh * 7 - 46) / 2);
    plate(g, x0 - 6, y0 - 6, rw + 12, rh * 7 + 52, { top: '#efe8d6', bot: '#ddd2b6', edge: 'rgba(0,0,0,.35)' }); text(g, t('tr.file').toUpperCase(), w / 2, y0 + 12, { s: 11, c: '#4a3d22', w: 700, ls: 2 });
    const cols = [[t('tr.bunk'), .05], [cx.lang === 'en' ? 'Name' : 'Nombre', .2], [t('tr.hand'), .47], [t('tr.mug'), .6], [t('tr.boots'), .74], [t('tr.stripes'), .91]];
    cols.forEach(([s, f]) => text(g, s, x0 + rw * f, y0 + 32, { s: 10, c: '#6a5a3a', w: 700 }));
    const fs = Math.min(13, rh * .32);
    rows.forEach((c, i) => { const y = y0 + 44 + i * rh + rh / 2; if (i % 2) { g.fillStyle = 'rgba(0,0,0,.04)'; g.fillRect(x0, y - rh / 2, rw, rh); }
      text(g, String(c.bunk), x0 + rw * .05, y, { s: fs + 2, w: 800, c: '#2a1f10' }); text(g, c.first + ' ' + c.id, x0 + rw * .2, y - fs * .55, { s: Math.min(fs, fit(g, c.first + ' ' + c.id, rw * .27, fs, { f: 'pop' })), f: 'pop', w: 700, c: '#2a1f10' }); text(g, I18N.L2(c.role), x0 + rw * .2, y + fs * .65, { s: fs * .85, c: '#6a5a3a' });
      text(g, t('tr.' + c.hand), x0 + rw * .47, y, { s: fs, c: '#2a1f10', w: 700 }); g.fillStyle = MUG[c.mug]; g.beginPath(); g.arc(x0 + rw * .6 - 22, y, 6, 0, 7); g.fill(); text(g, t('tr.' + c.mug), x0 + rw * .6 + 6, y, { s: fs, c: '#2a1f10', w: 700 }); text(g, t('tr.' + c.boots), x0 + rw * .74, y, { s: fs, c: '#2a1f10', w: 700 }); text(g, '▮'.repeat(c.stripes), x0 + rw * .91, y, { s: fs, c: '#b8860b' }); });
    const y = y0 + 44 + 6 * rh + rh / 2; text(g, '7', x0 + rw * .05, y, { s: fs + 2, w: 800, c: '#8a7a5a' }); text(g, '— (' + t('tr.noplate') + ')', x0 + rw * .2, y, { s: fs, c: '#8a7a5a', a: 'left' });
  }
  PZ.scene = {
    init(cx) { cx.ui.file ??= false; },
    tools(cx) { return [{ id: 'file', label: t('t.file'), on: cx.ui.file }]; },
    tool(cx) { cx.ui.file = !cx.ui.file; cx.sfx('tap'); cx.save(); },
    draw(g, cx, tm) {
      const { w, h, d } = cx; bg(g, w, h, '#2a1450'); const C = CORE.C; const id = cx.P.id; const land = w > h;
      // marco de memoria holográfica
      g.strokeStyle = 'rgba(164,107,255,.35)'; g.lineWidth = 1; for (let y = 0; y < h; y += 3) { g.globalAlpha = .08 + .04 * Math.sin(y * .3 + tm * 4); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.globalAlpha = 1;
      const act = d.who != null ? C.crew[d.who] : null; const det = act ? Object.fromEntries(d.tr.map(k => [k, act[k]])) : null;
      const sceneH = land ? h : h * .7; const s = Math.min(sceneH * .42, w / 7.2);
      if (id === 'tr-1') {
        const ty = sceneH * .62; g.fillStyle = '#3a2a5a'; rrect(g, w * .08, ty, w * .84, sceneH * .1, 8); g.fill();
        for (let i = 0; i < 6; i++) { const x = w * .14 + i * w * .72 / 5; const me = i === d.seat.indexOf(0); person(g, x, ty - s * .3, s, { holo: !me, det: me ? det : null, raise: me ? act.hand : null, hl: me }); if (!me) { g.fillStyle = 'rgba(200,170,255,.3)'; rrect(g, x - 8, ty - 12, 16, 13, 3); g.fill(); } }
      } else if (id === 'tr-2') {
        // la alarma queda junto a la mano levantada (de frente, la mano derecha se ve a la izquierda de quien mira)
        const S2 = s * 1.4, px2 = w * .5, py2 = sceneH * .45, sd = act.hand === 'L' ? 1 : -1; const hx = px2 + sd * S2 * .62, hy = py2 - S2 * .62;
        g.fillStyle = '#0b0618'; g.fillRect(0, sceneH * .78, w, sceneH * .22); const ax = Math.max(8, Math.min(w - 48, hx + sd * 26 - 20)), ay = hy - 30; glow(g, ax + 20, ay + 27, 90, '#ff4466', .6 + Math.sin(tm * 8) * .3); g.fillStyle = '#ff4466'; rrect(g, ax, ay, 40, 54, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; rrect(g, ax + 12, ay + 14, 16, 22, 4); g.fill();
        person(g, px2, py2, S2, { holo: false, det, raise: act.hand, hl: true });
        g.fillStyle = 'rgba(5,2,12,.55)'; g.fillRect(0, 0, w, sceneH * .22); // la cara queda en sombra
      } else if (id === 'tr-3') {
        g.fillStyle = '#1a1030'; rrect(g, w * .82, sceneH * .15, w * .15, sceneH * .7, 14); g.fill(); g.strokeStyle = COL.cy; g.stroke(); text(g, '⟶', w * .89, sceneH * .5, { s: 22, c: COL.cy });
        d.order.forEach((ci, pos) => { const x = w * .76 - pos * w * .125; const me = pos === 5; person(g, x, sceneH * .5, s * .95, { holo: !me, back: true, det: me ? det : null, raise: me && det.hand ? act.hand : null, num: pos + 1, hl: me }); text(g, `→ ${d.seats[pos]}`, x, sceneH * .5 + s * .95 * .86, { s: Math.max(11, Math.min(14, s * .17)), c: '#d9c8ff', w: 800 }); });
        text(g, (cx.lang === 'en' ? 'Number above: boarding order · → seat' : 'Número arriba: orden de entrada · → asiento'), w / 2, sceneH * .16, { s: Math.min(12, w / 34), c: COL.dim, f: 'pop', w: 500 });
      } else if (id === 'tr-4') {
        // literas al fondo (1-6 con placa, 7 sin placa)
        for (let b = 0; b < 7; b++) { const x = w * .06 + b * w * .125, y = sceneH * .06; g.fillStyle = '#20143a'; rrect(g, x, y, w * .11, sceneH * .16, 4); g.fill(); text(g, String(b + 1), x + w * .055, y + sceneH * .05, { s: 11, c: COL.dim, w: 700 }); text(g, b < 6 ? C.crew[b].id : (d.clue === 'litera' ? '—' : ''), x + w * .055, y + sceneH * .11, { s: Math.max(7, Math.min(10, w * .016)), c: b < 6 ? '#cbb8ff' : '#ff8ab0', w: 700 }); if (b === 6 && d.clue === 'litera') glow(g, x + w * .055, y + sceneH * .08, 40, '#ff8ab0', .6); }
        // marco de la foto
        const fx = w * .08, fy = sceneH * .27, fw = w * .84, fh = sceneH * .5; g.fillStyle = '#f2efe6'; rrect(g, fx - 8, fy - 8, fw + 16, fh + 36, 6); g.fill(); g.fillStyle = '#2b1d4a'; g.fillRect(fx, fy, fw, fh);
        for (let i = 0; i < 6; i++) person(g, fx + fw * (.1 + i * .16), fy + fh * .55, Math.min(fh * .55, fw / 7.5), { holo: false });
        const cap = C.crew.map(c => c.id[0] + c.id.slice(1).toLowerCase()).join(' · '); text(g, cap, w / 2, fy + fh + 14, { s: Math.min(12, fit(g, cap, fw, 12)), c: '#3a2a10', w: 700 });
        if (d.clue === 'taza') { for (let k = 0; k < 7; k++) { g.fillStyle = k < 6 ? Object.values(MUG)[k % 3] : '#ddd'; rrect(g, fx + fw * .2 + k * 22, fy + fh * .9, 14, 12, 2); g.fill(); } }
        if (d.clue === 'sombra') { g.fillStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.ellipse(fx + fw * .5, fy + fh, fw * .12, fh * .08, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(fx + fw * .44, fy + fh); g.lineTo(fx + fw * .47, fy + fh * .82); g.lineTo(fx + fw * .53, fy + fh * .82); g.lineTo(fx + fw * .56, fy + fh); g.fill(); }
        // casco en el suelo con el reflejo del astronauta
        const hx = w * .85, hy = sceneH * .9, hr = Math.min(36, w * .06); g.fillStyle = '#e8ebf5'; g.beginPath(); g.arc(hx, hy, hr, Math.PI, 0); g.lineTo(hx + hr, hy + 6); g.lineTo(hx - hr, hy + 6); g.fill(); g.fillStyle = '#1b5a78'; g.beginPath(); g.ellipse(hx, hy - hr * .35, hr * .7, hr * .45, 0, 0, 7); g.fill();
        if (d.clue === 'visor' || true) { g.save(); g.beginPath(); g.ellipse(hx, hy - hr * .35, hr * .7, hr * .45, 0, 0, 7); g.clip(); g.globalAlpha = d.clue === 'visor' ? .8 : .35; const old = TS; TS = hr * .55; drawAstro(g, hx, hy - hr * .45, 'd', 0, 0, 0, tm, 0); TS = old; g.restore(); }
      }
      if (det && id !== 'tr-4') { const bw = Math.min(260, w - 24); detailsBox(g, cx, land ? w - bw - 12 : (w - bw) / 2, land ? 12 : sceneH + 6, bw, det); }
      if (id === 'tr-4') { const s2 = cx.lang === 'en' ? 'Seven bunks. Six people in the photo.' : 'Siete literas. Seis personas en la foto.'; text(g, s2, w / 2, Math.min(h - 14, sceneH + 20), { s: 13, f: 'pop', w: 500, c: COL.dim }); }
      if (cx.ui.file) fileOverlay(g, cx, w, h);
    },
  };
  PZ.manifest = {
    draw(g, cx, tm) {
      const { w, h, d } = cx; bg(g, w, h, '#2a1450'); const t3 = CORE.variantKey('tr-3'); const L = d.L[t3]; const land = w > h;
      text(g, cx.lang === 'en' ? 'ESCAPE POD MANIFEST' : 'MANIFIESTO DE LA CÁPSULA', w / 2, 22, { s: 11, c: '#cbb8ff', w: 700, ls: 2 });
      const cols = land ? 7 : 4, rows = land ? 1 : 2; const sw = Math.min(110, (w - 30) / cols - 10), sh = sw * 1.25; const x0 = (w - cols * (sw + 10)) / 2 + 5, y0 = (h - rows * (sh + 30)) / 2 + 10;
      for (let i = 0; i < 7; i++) {
        const seat = i + 1, fi = d.frag.indexOf(seat), own = fi >= 0 && cx.owned(fi); const x = x0 + (i % cols) * (sw + 10), y = y0 + Math.floor(i / cols) * (sh + 30);
        g.fillStyle = own ? '#2a1f4a' : '#1a1030'; rrect(g, x, y, sw, sh, 14); g.fill(); g.strokeStyle = own ? COL.cy : 'rgba(255,255,255,.12)'; g.lineWidth = own ? 2 : 1; g.stroke(); if (own) glow(g, x + sw / 2, y + sh / 2, sw * .8, COL.cy, .35);
        g.fillStyle = '#0e0820'; rrect(g, x + sw * .15, y + sh * .12, sw * .7, sh * .5, 10); g.fill(); text(g, L[i], x + sw / 2, y + sh * .37, { s: sw * .38, w: 800, f: 'pop', c: own ? '#fff' : 'rgba(220,210,255,.55)' });
        text(g, `${t('tr.seat')} ${seat}`, x + sw / 2, y + sh * .8, { s: Math.min(12, sw * .13), c: own ? COL.cy : COL.dim, w: 700 });
        if (fi >= 0 && !own) text(g, t('frag.missing'), x + sw / 2, y + sh + 12, { s: 10, c: COL.dim });
      }
    },
  };

  // ================= Meta final · Carta estelar =================
  const WP = { oxigeno: [18, 14], energia: [50, 9], comunicaciones: [82, 15], navegacion: [80, 46], archivo: [48, 52], tripulacion: [16, 45] };
  PZ.starchart = {
    init(cx) {
      cx.ui.pin ||= {}; cx.ui.lines ||= []; cx.ui.photo ??= false;
      const name = cx.d.name, order = CORE.prevLoopOrder(); const r = CORE.mulberry32((CORE.G.seed ^ 777) >>> 0);
      cx.order = order;
      cx.groups = order.map((mod, i) => { const ch = name[i]; const [wx, wy] = WP[mod]; const gl = CORE.C.glyph[ch]; const sc = 2.1; return { mod, col: '#e8eeff', p: gl.map(([x, y], j) => [wx - 4 * sc / 2 + x * sc + 5, wy - 6 * sc / 2 + y * sc, 1 + j * .55]) }; });
      cx.bgs = Array.from({ length: 60 }, () => [r() * 100, r() * 62, 4 + r() * 2]);
    },
    tools(cx) { return [{ id: 'photo', label: t('t.photometer'), on: cx.ui.photo }, { id: 'erase', label: t('t.erase') }]; },
    tool(cx, id) { if (id === 'photo') cx.ui.photo = !cx.ui.photo; else { cx.ui.lines = []; cx.sel = null; } cx.sfx('tap'); cx.save(); },
    draw(g, cx, tm) {
      const { w, h } = cx; bg(g, w, h, '#0B172B'); const bh = 54; // VIS-06: fondo azul negro; posiciones, glifos y conexiones intactos
      cx.groups.forEach(gr => gr.hidden = !cx.ui.pin[gr.mod]);
      STARS.starField(g, Object.assign(cx, { h: h - bh }), null, cx.groups, cx.bgs, { top: 0, tm }); cx.h = h;
      const P = cx.P;
      // línea de rumbo (aparece cuando están las seis)
      const all = CORE.MODS.every(m => cx.ui.pin[m]);
      if (all) { g.save(); g.setLineDash([6, 8]); g.lineDashOffset = -tm * 12; g.strokeStyle = 'rgba(0,242,207,.5)'; g.lineWidth = 2; g.beginPath(); cx.order.forEach((m, i) => { const [x, y] = P(WP[m][0] + 5, WP[m][1] + 3); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.restore(); const [sx, sy] = P(WP[cx.order[0]][0] + 5, WP[cx.order[0]][1] + 3); g.fillStyle = COL.cy; g.beginPath(); g.arc(sx, sy, 6, 0, 7); g.fill(); text(g, t('obs.course'), sx, sy - 14, { s: 10, c: COL.cy, w: 700 }); }
      CORE.MODS.forEach(m => { if (!cx.ui.pin[m]) return; const [x, y] = P(WP[m][0] - 2, WP[m][1] - 4); text(g, CORE.META_WORD[m], x, y, { s: 11, w: 800, c: '#ffe08a', a: 'left' }); });
      // palabras recuperadas para fijar
      cx.hits = []; const bw = Math.min(110, (w - 20) / 6 - 6); const y = h - bh + 8;
      CORE.MODS.forEach((m, i) => { const x = w / 2 + (i - 2.5) * (bw + 6) - bw / 2; const on = cx.ui.pin[m]; plate(g, x, y, bw, bh - 16, { r: 10, top: on ? '#2a2060' : '#0B172B', bot: '#08111F', edge: on ? '#ffe08a' : '#3F5879', rivets: false, glow: on ? '#ffe08a' : null, gb: 8 }); text(g, CORE.META_WORD[m], x + bw / 2, y + (bh - 16) / 2, { s: Math.min(14, bw * .16), w: 800, c: on ? '#ffe08a' : COL.ink }); cx.hits.push({ x, y, w: bw, h: bh - 16, m }); });
      if (!all && !Object.keys(cx.ui.pin).length) text(g, t('obs.tap'), w / 2, y - 16, { s: 12, c: COL.dim, f: 'pop', w: 500 });
    },
    down(cx, x, y) { const hh = (cx.hits || []).find(r => inR(x, y, r)); if (hh) { if (!cx.ui.pin[hh.m]) { cx.ui.pin[hh.m] = true; cx.sfx('glyph'); cx.vib(12); cx.save(); } return; } STARS.starTap(cx, cx.groups, x, y); },
  };
})();
