// Texturas generadas en el navegador (sin descargas): madera, tejas, paja, ripio, adoquín y flores.
// Cada una devuelve { map, normal } con el mapa de normales calculado desde la altura.
import * as THREE from 'three';

function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// mapa de normales desde un lienzo de altura (canal rojo)
function normalFrom(hc, strength = 2) {
  const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const out = canvas(w, h), ctx = out.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const n = new THREE.Vector3(-dx, -dy, 1).normalize(), i = (y * w + x) * 4;
    d[i] = (n.x * 0.5 + 0.5) * 255; d[i + 1] = (n.y * 0.5 + 0.5) * 255; d[i + 2] = (n.z * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0); return out;
}
function tex(c, srgb, rep = [1, 1]) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
const cache = {};
function once(key, fn) { return cache[key] || (cache[key] = fn()); }

// tablas verticales (o horizontales) con veta, nudos y juntas; color base en rgb 0–255
export function planks({ base = [150, 92, 58], boards = 8, vertical = true, seed = 3, batten = false, size = 512 } = {}) {
  return once(`planks${base}${boards}${vertical}${seed}${batten}`, () => {
    const R = rng(seed), c = canvas(size, size), x = c.getContext('2d'), hc = canvas(size, size), hx = hc.getContext('2d');
    const bw = size / boards;
    hx.fillStyle = '#808080'; hx.fillRect(0, 0, size, size);
    for (let b = 0; b < boards; b++) {
      const tone = 0.82 + R() * 0.3, x0 = b * bw;
      const col = base.map((v) => Math.min(255, v * tone));
      x.fillStyle = `rgb(${col})`; x.fillRect(x0, 0, bw, size);
      // veta: líneas finas onduladas a lo largo de la tabla
      for (let k = 0; k < 26; k++) {
        const gx = x0 + R() * bw, a = 0.05 + R() * 0.12, dark = R() < 0.6;
        x.strokeStyle = dark ? `rgba(40,20,10,${a})` : `rgba(255,230,200,${a * 0.6})`; x.lineWidth = 0.6 + R() * 1.4;
        x.beginPath(); for (let y = 0; y <= size; y += 16) x.lineTo(gx + Math.sin(y * 0.02 + k) * (2 + R() * 2), y); x.stroke();
      }
      // nudos
      if (R() < 0.6) { const ny = R() * size, nx = x0 + bw * (0.3 + R() * 0.4); const g = x.createRadialGradient(nx, ny, 1, nx, ny, 7 + R() * 6); g.addColorStop(0, 'rgba(50,25,12,0.75)'); g.addColorStop(1, 'rgba(50,25,12,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(nx, ny, 6, 12, 0, 0, 7); x.fill(); }
      // junta entre tablas
      x.fillStyle = 'rgba(25,14,8,0.85)'; x.fillRect(x0, 0, 2, size);
      hx.fillStyle = '#333'; hx.fillRect(x0, 0, 3, size);
      if (batten) { hx.fillStyle = '#d0d0d0'; hx.fillRect(x0 - 5, 0, 9, size); x.fillStyle = `rgba(${base.map((v) => v * 1.05)},1)`; x.fillRect(x0 - 5, 0, 9, size); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(x0 + 4, 0, 2, size); }
    }
    // suciedad suave abajo
    const g = x.createLinearGradient(0, size, 0, size * 0.75); g.addColorStop(0, 'rgba(40,28,18,0.25)'); g.addColorStop(1, 'rgba(40,28,18,0)'); x.fillStyle = g; x.fillRect(0, 0, size, size);
    let cc = c, hh = hc;
    if (!vertical) { cc = rot(c); hh = rot(hc); }
    return { map: tex(cc, true), normal: tex(normalFrom(hh, 3)) };
  });
}
function rot(c) { const o = canvas(c.height, c.width), x = o.getContext('2d'); x.translate(o.width, 0); x.rotate(Math.PI / 2); x.drawImage(c, 0, 0); return o; }

// tejas de pizarra en hileras escalonadas
export function shingles({ base = [70, 74, 80], seed = 5 } = {}) {
  return once(`shingles${base}`, () => {
    const R = rng(seed), S = 512, c = canvas(S, S), x = c.getContext('2d'), hc = canvas(S, S), hx = hc.getContext('2d');
    const rowH = 32, w = 42;
    for (let r = 0; r < S / rowH; r++) {
      const off = (r % 2) * w / 2;
      for (let k = -1; k < S / w + 1; k++) {
        const t = 0.8 + R() * 0.35, x0 = k * w + off, y0 = r * rowH;
        x.fillStyle = `rgb(${base.map((v) => v * t)})`; x.fillRect(x0 + 1, y0, w - 2, rowH + 6);
        const g = hx.createLinearGradient(0, y0, 0, y0 + rowH); g.addColorStop(0, '#555'); g.addColorStop(1, '#bbb');
        hx.fillStyle = g; hx.fillRect(x0 + 1, y0, w - 2, rowH);
        x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(x0 + 1, y0 + rowH - 3, w - 2, 3);
      }
    }
    return { map: tex(c, true), normal: tex(normalFrom(hc, 4)) };
  });
}

// paja de la cama del box: briznas cruzadas
export function straw({ seed = 9, base = [205, 170, 105] } = {}) {
  return once(`straw${base}`, () => {
    const R = rng(seed), S = 512, c = canvas(S, S), x = c.getContext('2d'), hc = canvas(S, S), hx = hc.getContext('2d');
    x.fillStyle = `rgb(${base.map((v) => v * 0.55)})`; x.fillRect(0, 0, S, S); hx.fillStyle = '#222'; hx.fillRect(0, 0, S, S);
    for (let i = 0; i < 2600; i++) {
      const px = R() * S, py = R() * S, a = R() * Math.PI, L = 14 + R() * 34, t = 0.6 + R() * 0.55;
      x.strokeStyle = `rgb(${base.map((v) => Math.min(255, v * t))})`; x.lineWidth = 1 + R() * 2;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke();
      hx.strokeStyle = `rgb(${(110 + i / 2600 * 140) | 0},0,0)`; hx.lineWidth = 2; hx.beginPath(); hx.moveTo(px, py); hx.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); hx.stroke();
    }
    return { map: tex(c, true), normal: tex(normalFrom(hc, 2.5)) };
  });
}

// ripio claro de los caminos
export function gravel({ seed = 13 } = {}) {
  return once('gravel', () => {
    const R = rng(seed), S = 512, c = canvas(S, S), x = c.getContext('2d'), hc = canvas(S, S), hx = hc.getContext('2d');
    x.fillStyle = '#a99c86'; x.fillRect(0, 0, S, S); hx.fillStyle = '#444'; hx.fillRect(0, 0, S, S);
    for (let i = 0; i < 5200; i++) {
      const px = R() * S, py = R() * S, r = 1.5 + R() * 4.5, t = 0.7 + R() * 0.5;
      x.fillStyle = `rgb(${[178, 166, 145].map((v) => Math.min(255, v * t))})`; x.beginPath(); x.ellipse(px, py, r, r * (0.6 + R() * 0.4), R() * 3, 0, 7); x.fill();
      const g = hx.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, '#fff'); g.addColorStop(1, '#444'); hx.fillStyle = g; hx.beginPath(); hx.arc(px, py, r, 0, 7); hx.fill();
    }
    return { map: tex(c, true), normal: tex(normalFrom(hc, 3)) };
  });
}

// adoquín de goma/ladrillo del pasillo del establo
export function pavers({ seed = 17 } = {}) {
  return once('pavers', () => {
    const R = rng(seed), S = 512, c = canvas(S, S), x = c.getContext('2d'), hc = canvas(S, S), hx = hc.getContext('2d');
    x.fillStyle = '#3d3632'; x.fillRect(0, 0, S, S); hx.fillStyle = '#222'; hx.fillRect(0, 0, S, S);
    const bw = 64, bh = 32;
    for (let r = 0; r < S / bh; r++) for (let k = -1; k < S / bw + 1; k++) {
      const x0 = k * bw + (r % 2) * bw / 2, y0 = r * bh, t = 0.85 + R() * 0.3;
      x.fillStyle = `rgb(${[118, 108, 100].map((v) => v * t)})`; x.fillRect(x0 + 2, y0 + 2, bw - 4, bh - 4);
      for (let i = 0; i < 18; i++) { x.fillStyle = `rgba(0,0,0,${R() * 0.12})`; x.fillRect(x0 + 2 + R() * (bw - 6), y0 + 2 + R() * (bh - 6), 3, 3); }
      hx.fillStyle = '#c8c8c8'; hx.fillRect(x0 + 3, y0 + 3, bw - 6, bh - 6);
    }
    return { map: tex(c, true), normal: tex(normalFrom(hc, 3)) };
  });
}

// flores: atlas de 4 tipos (margaritas, amapolas, lavanda, flores amarillas) sobre fondo transparente
export function flowers() {
  return once('flowers', () => {
    const S = 256, c = canvas(S * 4, S), x = c.getContext('2d'), R = rng(21);
    const kinds = [
      { petal: '#fbfaf4', core: '#f2c12e', n: 9, r: 26 }, { petal: '#e8442f', core: '#2a1a12', n: 5, r: 30 },
      { petal: '#9b7fd6', core: '#7c5fc4', n: 0, r: 0 }, { petal: '#f7d23a', core: '#d98f1c', n: 7, r: 22 },
    ];
    kinds.forEach((K, i) => {
      x.save(); x.translate(i * S, 0);
      // tallos y hojas
      for (let s = 0; s < 6; s++) {
        const bx = 40 + R() * 176, top = 40 + R() * 90;
        x.strokeStyle = '#3f6b2a'; x.lineWidth = 4; x.beginPath(); x.moveTo(bx, S); x.quadraticCurveTo(bx + (R() - 0.5) * 30, (S + top) / 2, bx + (R() - 0.5) * 20, top); x.stroke();
        x.fillStyle = '#4d7f30'; x.beginPath(); x.ellipse(bx + 8, S - 40 - R() * 40, 5, 16, 0.6, 0, 7); x.fill();
        const fx = bx + (R() - 0.5) * 20, fy = top;
        if (K.n === 0) { for (let k = 0; k < 9; k++) { x.fillStyle = k % 2 ? K.petal : K.core; x.beginPath(); x.ellipse(fx, fy + k * 7, 7, 6, 0, 0, 7); x.fill(); } }
        else {
          x.fillStyle = K.petal;
          for (let k = 0; k < K.n; k++) { const a = k / K.n * Math.PI * 2; x.beginPath(); x.ellipse(fx + Math.cos(a) * K.r * 0.5, fy + Math.sin(a) * K.r * 0.5, K.r * 0.45, K.r * 0.22, a, 0, 7); x.fill(); }
          x.fillStyle = K.core; x.beginPath(); x.arc(fx, fy, K.r * 0.25, 0, 7); x.fill();
        }
      }
      x.restore();
    });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  });
}

// mata de pasto alto (tarjeta con transparencia)
export function grassTuft() {
  return once('tuft', () => {
    const S = 256, c = canvas(S, S), x = c.getContext('2d'), R = rng(31);
    // briznas con degradado: base oscura, punta clara y algo amarillenta; las del centro, más altas
    for (let i = 0; i < 110; i++) {
      const bx = 128 + (R() - 0.5) * 220 * Math.sqrt(R()), h = (90 + R() * 150) * (1 - Math.abs(bx - 128) / 200), lean = (bx - 128) * 0.35 + (R() - 0.5) * 50, t = 0.75 + R() * 0.45;
      const g = x.createLinearGradient(0, S, 0, S - h);
      g.addColorStop(0, `rgb(${[52, 82, 30].map((v) => v * t)})`); g.addColorStop(0.6, `rgb(${[110, 150, 62].map((v) => Math.min(255, v * t))})`); g.addColorStop(1, `rgb(${[178, 190, 104].map((v) => Math.min(255, v * t))})`);
      x.strokeStyle = g; x.lineWidth = 2 + R() * 3;
      x.beginPath(); x.moveTo(bx, S); x.quadraticCurveTo(bx + lean * 0.3, S - h * 0.6, bx + lean, S - h); x.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  });
}

// cartel de madera con texto pintado
export function sign(text, { w = 512, h = 128, bg = '#6b4428', fg = '#f4ecdb' } = {}) {
  const c = canvas(w, h), x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(30,15,5,${Math.random() * 0.2})`; x.beginPath(); x.moveTo(0, Math.random() * h); x.lineTo(w, Math.random() * h); x.stroke(); }
  x.strokeStyle = '#3a2412'; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10);
  x.fillStyle = fg; x.font = `700 ${Math.round(h * 0.46)}px "Playfair Display", Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
