/* JET//Balizas · física y reglas. Paso fijo 1/120 s, determinista por tiempo de vuelo t (pausa excluida).
   Sin DOM. Emite eventos en S.ev (los consume la interfaz: sonido, partículas, avisos). */
(function (root) {
'use strict';
const G = root.BalGen || (typeof require !== 'undefined' ? require('./gen.js') : null);
const W = 36, DT = 1 / 120;
const K = {
  R: 0.42, ACC: 10, VMAX: 6, FRIC: 0.9, BRAKE: 14, REST: 0.35, SAFE_V: 2.2, DMG_K: 7, DMG_MAX: 30,
  ROCK_DMG: 15, MINE_DMG: 25, MINE_ARM: 2.2, MINE_KILL: 1.6, MINE_T: 0.9, WELL_A: 4, CUR_A: 3, CRACK_V: 4, CRACK_DMG: 10,
  CLEAR: 4.5, CLEAR_ION: 2.5, RADAR: 7.5, BUOY_R: 1.5, GATE_R: 1.7, TREAS_R: 0.95, MARK_V: 1.5, RESCUE_PEN: 20, RESCUE_HULL: 60,
  MAX_BEACONS: 3, MIN_START: 6, MIN_GATE: 3, MIN_OWN: 2.5, SAMPLE: 0.25
};
const SYMS = ['flecha', 'peligro', 'atajo', 'tesoro', 'noporaqui'];
const DIRECTIONAL = { flecha: 1, atajo: 1, noporaqui: 1 };

function driftPos(d, t) { // ida y vuelta suavizada, sin trigonometría
  let u = t / d.per + d.ph; u -= Math.floor(u); const tri = u < 0.5 ? u * 2 : 2 - u * 2, s = tri * tri * (3 - 2 * tri);
  return [d.ax + (d.bx - d.ax) * s, d.ay + (d.by - d.ay) * s];
}

function create(f, opt) {
  opt = opt || {}; f = Object.assign({}, f, { g: new Uint8Array(f.g) }); // copia: las grietas rotas no tocan el campo original
  const S = {
    f, ct: G.contour(f.g, f.H), mode: opt.mode || 'oficial', t: 0, pen: 0, x: f.start[0], y: f.start[1], vx: 0, vy: 0, ang: Math.PI / 2,
    hull: 100, rescues: 0, tre: f.treasures.map(() => 0), buoy: -1, buoys: f.buoys.map(() => 0), placed: [], mines: f.mines.map(() => ({ arm: -1, gone: 0 })),
    explored: new Uint8Array(f.W * f.H), ev: [], thrust: 0, brake: 0, done: 0, rescue: null, hitCd: 0, driftCd: f.drifts.map(() => 0),
    samples: [], nextSample: 0, beacons: [], seen: {}, follow: {}, autoBrake: 0, inIon: 0, contact: 0, scrapeCd: 0, dmgLog: [], lastExplore: -1, gateOpen: 0, maxY: f.start[1]
  };
  explore(S, true);
  return S;
}
function setBeacons(S, list) { S.beacons = list || []; }

function clearR(S) { return S.inIon ? K.CLEAR_ION : K.CLEAR; }
function explore(S, force) {
  const f = S.f, r = clearR(S), r2 = r * r, x0 = Math.max(0, Math.floor(S.x - r)), x1 = Math.min(f.W - 1, Math.floor(S.x + r)), y0 = Math.max(0, Math.floor(S.y - r)), y1 = Math.min(f.H - 1, Math.floor(S.y + r));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const dx = x + 0.5 - S.x, dy = y + 0.5 - S.y; if (dx * dx + dy * dy <= r2) S.explored[y * f.W + x] = 1; }
}

function collide(S) {
  const ct = S.ct, R = K.R; let hit = null;
  const mi0 = Math.floor(S.x - 0.5) - 1, mj0 = Math.floor(S.y - 0.5) - 1;
  for (let it = 0; it < 2; it++) {
    for (let mj = mj0; mj <= mj0 + 2; mj++) for (let mi = mi0; mi <= mi0 + 2; mi++) {
      const b = ct.bucket[(mj + 1) * ct.MW + (mi + 1)]; if (!b) continue;
      for (const si of b) {
        const ax = ct.segs[si * 4], ay = ct.segs[si * 4 + 1], bx = ct.segs[si * 4 + 2], by = ct.segs[si * 4 + 3];
        const ex = bx - ax, ey = by - ay, L2 = ex * ex + ey * ey; let u = ((S.x - ax) * ex + (S.y - ay) * ey) / L2; u = u < 0 ? 0 : u > 1 ? 1 : u;
        const px = ax + ex * u, py = ay + ey * u; let nx = S.x - px, ny = S.y - py; const d2 = nx * nx + ny * ny;
        if (d2 >= R * R) continue;
        let d = Math.sqrt(d2);
        if (d < 1e-6) { nx = -ey; ny = ex; d = Math.sqrt(L2); nx /= d; ny /= d; d = 0; } else { nx /= d; ny /= d; }
        S.x += nx * (R - d); S.y += ny * (R - d);
        const vn = S.vx * nx + S.vy * ny;
        if (vn < 0) {
          S.vx -= (1 + K.REST) * vn * nx; S.vy -= (1 + K.REST) * vn * ny;
          S.vx *= 0.985; S.vy *= 0.985;
          if (!hit || -vn > hit.v) hit = { v: -vn, x: px, y: py, nx, ny };
        }
      }
    }
  }
  return hit;
}

function damage(S, n, kind, x, y) {
  if (S.rescue || S.done || n <= 0) return;
  S.hull = Math.max(0, S.hull - n); S.dmgLog.push([S.t, x, y, n, kind]);
  S.ev.push({ k: 'hit', n, kind, x, y });
  if (S.hull <= 0) startRescue(S);
}
function startRescue(S) {
  S.rescue = { t: 0 }; S.rescues++; S.ev.push({ k: 'rescue' });
}
function respawnPoint(S) { const f = S.f; return S.buoy >= 0 ? f.buoys[S.buoy] : f.start; }

function canPlace(S) {
  const f = S.f;
  if (S.mode === 'archivo') return 'archive';
  if (S.mode === 'libre') return 'free';
  if (S.placed.length >= K.MAX_BEACONS) return 'none_left';
  const sp = Math.sqrt(S.vx * S.vx + S.vy * S.vy); if (sp > K.MARK_V) return 'too_fast';
  const cx = Math.floor(S.x) + 0.5, cy = Math.floor(S.y) + 0.5;
  const d = (a, b) => Math.sqrt((cx - a) * (cx - a) + (cy - b) * (cy - b));
  if (d(f.start[0], f.start[1]) < K.MIN_START) return 'near_start';
  if (d(f.gate[0], f.gate[1]) < K.MIN_GATE) return 'near_gate';
  for (const p of S.placed) if (d(p.x, p.y) < K.MIN_OWN) return 'near_own';
  if (f.g[Math.floor(cy) * f.W + Math.floor(cx)] !== 0) return 'blocked';
  return '';
}
function place(S, s, dir) {
  const why = canPlace(S); if (why) return { ok: false, why };
  const b = { x: Math.floor(S.x) + 0.5, y: Math.floor(S.y) + 0.5, s, d: DIRECTIONAL[s] ? ((dir | 0) + 8) % 8 : 0, t: Math.round(S.t * 10) / 10, mine: 1 };
  S.placed.push(b); S.ev.push({ k: 'place', b });
  return { ok: true, b };
}
function undo(S, b) { const i = S.placed.indexOf(b); if (i >= 0) { S.placed.splice(i, 1); S.ev.push({ k: 'undo', b }); return true; } return false; }

// Reglas de «seguida» (DISENO 3.6)
function trackSeen(S) {
  const r = clearR(S);
  for (const b of S.beacons) {
    const dx = b.x - S.x, dy = b.y - S.y, d2 = dx * dx + dy * dy;
    if (!S.seen[b.id] && d2 <= r * r) {
      S.seen[b.id] = { t: S.t, x: S.x, y: S.y, dmg: 0 };
      S.ev.push({ k: 'seen', b });
    }
  }
  for (const id in S.seen) {
    const sn = S.seen[id]; if (S.follow[id] !== undefined || sn.fin) continue;
    const b = S.beacons.find(q => q.id == id); if (!b) continue;
    const el = S.t - sn.t, v = G.dirVec(b.d);
    if (b.s === 'flecha') {
      const dx = S.x - sn.x, dy = S.y - sn.y, L = Math.sqrt(dx * dx + dy * dy);
      if (L > 4 && (dx * v[0] + dy * v[1]) / L > 0.6428) S.follow[id] = 1; // cos 50°
      else if (el > 12) sn.fin = 1;
    } else if (b.s === 'atajo') {
      if (!sn.tx) { const tgt = targetCell(S.f, b); sn.tx = tgt[0]; sn.ty = tgt[1]; }
      const dx = S.x - sn.tx, dy = S.y - sn.ty; if (dx * dx + dy * dy < 0.9) S.follow[id] = 1; else if (el > 12) sn.fin = 1;
    } else if (b.s === 'peligro') {
      if (el > 12) { if (!sn.dmg) S.follow[id] = 1; sn.fin = 1; }
    } else if (b.s === 'noporaqui') {
      const px = S.x - b.x, py = S.y - b.y; if (px * v[0] + py * v[1] > 2) { sn.fin = 1; S.follow[id] = 0; }
      else if (el > 12) { S.follow[id] = 1; sn.fin = 1; }
    } else if (b.s === 'tesoro') {
      if (el > 30) sn.fin = 1;
    }
  }
}
function targetCell(f, b) {
  const v = G.dirVec(b.d), x = b.x + v[0] * 3, y = b.y + v[1] * 3;
  for (let r = 0; r <= 2; r++) for (let yy = Math.floor(y) - r; yy <= Math.floor(y) + r; yy++) for (let xx = Math.floor(x) - r; xx <= Math.floor(x) + r; xx++) if (xx >= 0 && yy >= 0 && xx < f.W && yy < f.H && f.g[yy * f.W + xx] === 0) return [xx + 0.5, yy + 0.5];
  return [x, y];
}

function step(S, inp) {
  const f = S.f; S.ev.length = S.ev.length > 200 ? 0 : S.ev.length;
  if (S.done) return;
  if (S.rescue) { // el dron remolca: el tiempo de vuelo no corre, la penalización se suma una vez
    S.rescue.t += DT;
    if (S.rescue.t >= 1.2 && !S.rescue.moved) { const p = respawnPoint(S); S.x = p[0]; S.y = p[1]; S.vx = S.vy = 0; S.hull = K.RESCUE_HULL; S.pen += K.RESCUE_PEN; S.rescue.moved = 1; S.ev.push({ k: 'respawn' }); explore(S, true); }
    if (S.rescue.t >= 2.7) { S.rescue = null; S.ev.push({ k: 'control' }); }
    return;
  }
  S.t += DT;
  let ax = inp ? inp.ax || 0 : 0, ay = inp ? inp.ay || 0 : 0; const am = Math.sqrt(ax * ax + ay * ay); if (am > 1) { ax /= am; ay /= am; }
  const brake = (inp && inp.brake) || S.autoBrake;
  S.thrust = Math.min(1, am); S.brake = brake ? 1 : 0;
  let vx = S.vx, vy = S.vy;
  if (!S.autoBrake) { vx += ax * K.ACC * DT; vy += ay * K.ACC * DT; }
  const sp = Math.sqrt(vx * vx + vy * vy);
  if (sp > 0) {
    const dec = (brake ? (S.autoBrake && !(inp && inp.brake) ? 5 : K.BRAKE) : (am < 0.05 ? K.FRIC : 0)) * DT;
    if (dec > 0) { const k = Math.max(0, sp - dec) / sp; vx *= k; vy *= k; }
  }
  // pozos de gravedad
  for (const w of f.wells) { const dx = w[0] - S.x, dy = w[1] - S.y, d = Math.sqrt(dx * dx + dy * dy); if (d < w[2] && d > 0.2) { const a = K.WELL_A * (1 - d / w[2]) * DT / d; vx += dx * a; vy += dy * a; } }
  // corrientes
  for (const c of f.currents) { const v = G.dirVec(c.d), rx = S.x - c.x, ry = S.y - c.y, al = rx * v[0] + ry * v[1], pe = -rx * v[1] + ry * v[0]; if (Math.abs(al) < c.hl && Math.abs(pe) < c.hw) { vx += v[0] * K.CUR_A * DT; vy += v[1] * K.CUR_A * DT; } }
  const sp2 = Math.sqrt(vx * vx + vy * vy), lim = am > 0.05 ? K.VMAX : K.VMAX + 0.5; if (sp2 > lim) { vx *= lim / sp2; vy *= lim / sp2; }
  S.vx = vx; S.vy = vy; S.x += vx * DT; S.y += vy * DT;
  if (am > 0.05) { const ta = Math.atan2(ay, ax); let da = ta - S.ang; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; const m = 9 * DT; S.ang += Math.max(-m, Math.min(m, da)); }
  // paredes
  const hit = collide(S);
  if (S.hitCd > 0) S.hitCd -= DT; if (S.scrapeCd > 0) S.scrapeCd -= DT;
  if (hit) {
    // grieta frágil cerca del contacto
    let cracked = false;
    if (hit.v > K.CRACK_V) {
      const cx = Math.floor(hit.x - hit.nx * 0.3), cy = Math.floor(hit.y - hit.ny * 0.3);
      for (let yy = cy - 1; yy <= cy + 1 && !cracked; yy++) for (let xx = cx - 1; xx <= cx + 1 && !cracked; xx++) {
        if (xx < 0 || yy < 0 || xx >= f.W || yy >= f.H || f.g[yy * f.W + xx] !== 2) continue;
        const ddx = xx + 0.5 - hit.x, ddy = yy + 0.5 - hit.y; if (ddx * ddx + ddy * ddy > 1.1) continue;
        f.g[yy * f.W + xx] = 0; S.ct = G.contour(f.g, f.H); cracked = true; S.broken = (S.broken || []).concat([yy * f.W + xx]);
        S.ev.push({ k: 'crack', x: xx + 0.5, y: yy + 0.5 }); damage(S, K.CRACK_DMG, 'crack', hit.x, hit.y);
      }
    }
    if (!cracked) {
      if (hit.v > K.SAFE_V && S.hitCd <= 0 && S.mode !== 'tutorial') { const n = Math.min(K.DMG_MAX, Math.round((hit.v - K.SAFE_V) * K.DMG_K)); S.hitCd = 0.25; damage(S, n, 'wall', hit.x, hit.y); }
      else if (hit.v > 0.35 && S.scrapeCd <= 0) { S.scrapeCd = 0.12; S.ev.push({ k: 'scrape', x: hit.x, y: hit.y, v: hit.v }); }
    }
  }
  // rocas a la deriva
  for (let i = 0; i < f.drifts.length; i++) {
    if (S.driftCd[i] > 0) { S.driftCd[i] -= DT; continue; }
    const d = f.drifts[i], p = driftPos(d, S.t), dx = S.x - p[0], dy = S.y - p[1], rr = d.r + K.R, d2 = dx * dx + dy * dy;
    if (d2 < rr * rr) { const L = Math.sqrt(d2) || 1; S.vx += dx / L * 4; S.vy += dy / L * 4; S.driftCd[i] = 1; damage(S, K.ROCK_DMG, 'rock', p[0], p[1]); markDanger(S, p[0], p[1]); }
  }
  // minas
  for (let i = 0; i < f.mines.length; i++) {
    const m = f.mines[i], st = S.mines[i]; if (st.gone) continue;
    const dx = S.x - m[0], dy = S.y - m[1], d = Math.sqrt(dx * dx + dy * dy);
    if (st.arm < 0) { if (d < K.MINE_ARM) { st.arm = S.t; S.ev.push({ k: 'arm', i }); } }
    else if (S.t - st.arm >= K.MINE_T) {
      if (d < K.MINE_KILL) { st.gone = 1; S.ev.push({ k: 'boom', i, x: m[0], y: m[1] }); const L = d || 1; S.vx += dx / L * 5; S.vy += dy / L * 5; damage(S, K.MINE_DMG, 'mine', m[0], m[1]); markDanger(S, m[0], m[1]); }
      else { st.arm = -1; S.ev.push({ k: 'disarm', i }); }
    }
  }
  // nubes iónicas
  let ion = 0; for (const c of f.ions) { const dx = S.x - c[0], dy = S.y - c[1]; if (dx * dx + dy * dy < c[2] * c[2]) ion = 1; }
  if (ion !== S.inIon) { S.inIon = ion; S.ev.push({ k: ion ? 'ion_in' : 'ion_out' }); }
  // tesoros, boyas, puerta
  for (let i = 0; i < f.treasures.length; i++) { if (S.tre[i]) continue; const t = f.treasures[i], dx = S.x - t[0], dy = S.y - t[1]; if (dx * dx + dy * dy < K.TREAS_R * K.TREAS_R * 1.6) { S.tre[i] = 1; S.ev.push({ k: 'treasure', i }); treasureFollow(S, t); } }
  for (let i = 0; i < f.buoys.length; i++) { const b = f.buoys[i], dx = S.x - b[0], dy = S.y - b[1]; if (dx * dx + dy * dy < K.BUOY_R * K.BUOY_R && S.buoy !== i) { if (!S.buoys[i]) S.ev.push({ k: 'buoy', i }); S.buoys[i] = 1; S.buoy = i; } }
  if (S.y > S.maxY) S.maxY = S.y;
  { const dx = S.x - f.gate[0], dy = S.y - f.gate[1]; if (dx * dx + dy * dy < K.GATE_R * K.GATE_R) { S.done = 1; S.ev.push({ k: 'gate' }); } }
  // muestras de ruta (cada 250 ms, a 1/4 de casilla)
  if (S.t >= S.nextSample) { S.samples.push([Math.round(S.x * 4), Math.round(S.y * 4)]); S.nextSample += K.SAMPLE; }
  // niebla y balizas vistas (a ~20 Hz basta)
  const tick = Math.floor(S.t * 20); if (tick !== S.lastExplore) { S.lastExplore = tick; explore(S); trackSeen(S); }
}
function markDanger(S, x, y) { for (const id in S.seen) { const b = S.beacons.find(q => q.id == id); if (b && b.s === 'peligro') { const dx = b.x - x, dy = b.y - y; if (dx * dx + dy * dy < 16 && S.t - S.seen[id].t <= 12) S.seen[id].dmg = 1; } } }
function treasureFollow(S, t) { for (const id in S.seen) { const b = S.beacons.find(q => q.id == id); if (b && b.s === 'tesoro' && S.t - S.seen[id].t <= 30) { const dx = b.x - t[0], dy = b.y - t[1]; if (dx * dx + dy * dy < 36) S.follow[id] = 1; } } }

function score(S) {
  const f = S.f, total = S.t + S.pen, tt = Math.round(5000 * Math.min(1.2, f.par / Math.max(1, total)));
  const hull = 20 * Math.round(S.hull), tre = 400 * S.tre.reduce((a, b) => a + b, 0);
  return { time: tt, hull, tre, flight: tt + hull + tre, seconds: total };
}
// Guardado compacto
function bitsToB64(u8) { const n = Math.ceil(u8.length / 8), b = new Uint8Array(n); for (let i = 0; i < u8.length; i++) if (u8[i]) b[i >> 3] |= 1 << (i & 7); let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(b[i]); return (typeof btoa !== 'undefined' ? btoa(s) : Buffer.from(s, 'binary').toString('base64')); }
function b64ToBits(str, len) { const s = typeof atob !== 'undefined' ? atob(str) : Buffer.from(str, 'base64').toString('binary'); const u = new Uint8Array(len); for (let i = 0; i < len; i++) u[i] = (s.charCodeAt(i >> 3) >> (i & 7)) & 1; return u; }
function serialize(S) {
  return { t: +S.t.toFixed(3), pen: S.pen, hull: S.hull, rescues: S.rescues, tre: S.tre, buoy: S.buoy, buoys: S.buoys, placed: S.placed, mines: S.mines.map(m => m.gone ? 1 : 0), broken: S.broken || [], seen: S.seen, follow: S.follow, samples: S.samples.slice(-2400), exp: bitsToB64(S.explored), maxY: S.maxY, mode: S.mode, pos: S.rescue ? null : [+S.x.toFixed(3), +S.y.toFixed(3), +S.ang.toFixed(3)] };
}
function restore(f, o) {
  const S = create(f, { mode: o.mode });
  (o.broken || []).forEach(i => { S.f.g[i] = 0; }); if ((o.broken || []).length) S.ct = G.contour(S.f.g, S.f.H);
  Object.assign(S, { t: o.t, pen: o.pen, hull: Math.max(1, o.hull), rescues: o.rescues, tre: o.tre, buoy: o.buoy, buoys: o.buoys || S.buoys, placed: o.placed || [], seen: o.seen || {}, follow: o.follow || {}, samples: o.samples || [], broken: o.broken || [], maxY: o.maxY || S.y });
  (o.mines || []).forEach((g, i) => { if (S.mines[i]) S.mines[i].gone = g; });
  S.explored = b64ToBits(o.exp, f.W * f.H); S.nextSample = S.t + K.SAMPLE;
  // se retoma en el punto exacto donde quedó la nave (parada); si no hay posición guardada o cae en roca, en la boya o la salida
  const q = o.pos, free = q && isFinite(q[0]) && isFinite(q[1]) && q[0] > 0 && q[1] > 0 && q[0] < f.W && q[1] < f.H && S.f.g[Math.floor(q[1]) * f.W + Math.floor(q[0])] === 0;
  if (free) { S.x = q[0]; S.y = q[1]; S.ang = isFinite(q[2]) ? q[2] : Math.PI / 2; } else { const p = respawnPoint(S); S.x = p[0]; S.y = p[1]; S.ang = Math.PI / 2; }
  S.vx = S.vy = 0;
  explore(S, true); return S;
}

const API = { K, DT, SYMS, DIRECTIONAL, create, step, setBeacons, canPlace, place, undo, score, driftPos, clearR, serialize, restore, targetCell, explore };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.BalSim = API;
})(typeof self !== 'undefined' ? self : this);
