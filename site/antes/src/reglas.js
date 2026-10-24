// JET//Antes · núcleo de reglas rápido (misma semántica que sim.mjs, estado = solo posiciones).
// Estado: Int16Array [pos de cada astronauta (-1 = desvanecido)] + [pos de cada caja] + [índice de cada plataforma].
const DX = { U: 0, D: 0, L: -1, R: 1, W: 0 }, DY = { U: -1, D: 1, L: 0, R: 0, W: 0 };
const EMIT = { '>': [1, 0], '<': [-1, 0], '^': [0, -1], 'v': [0, 1] };
const FLOOR = 0, WALL = 1, VOID = 2, EXIT = 3;

export function compile(lv) {
  const H = lv.map.length, W = lv.map[0].length, n = W * H;
  const st = { W, H, n, kind: new Uint8Array(n), plateKey: new Int8Array(n).fill(-1), doorAt: new Int8Array(n).fill(-1),
    doors: [], emitters: [], heavy: [false, false, false, false], plates: [[], [], [], []], start: -1, exit: -1, boxes0: [], plats: [] };
  for (const h of lv.heavy || []) st.heavy['abcd'.indexOf(h)] = true;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, ch = lv.map[y][x];
    if (ch === '#') st.kind[i] = WALL;
    else if (EMIT[ch]) { st.kind[i] = WALL; const off = (lv.lasers || {})[x + ',' + y]; st.emitters.push({ x, y, dx: EMIT[ch][0], dy: EMIT[ch][1], off: off ? 'abcd'.indexOf(off) : -1 }); }
    else if (ch === '_') st.kind[i] = VOID;
    else if (ch === 'E') { st.kind[i] = EXIT; st.exit = i; }
    else {
      st.kind[i] = FLOOR;
      if (ch === 'S') st.start = i;
      if (ch === 'o') st.boxes0.push(i);
      if (/[a-d]/.test(ch)) { const k = ch.charCodeAt(0) - 97; st.plateKey[i] = k; st.plates[k].push(i); }
      if (/[A-D]/.test(ch)) { st.doorAt[i] = st.doors.length; st.doors.push({ i, key: ch.charCodeAt(0) - 65, inv: false }); }
      if (/[WXYZ]/.test(ch)) { st.doorAt[i] = st.doors.length; st.doors.push({ i, key: 'WXYZ'.indexOf(ch), inv: true }); }
    }
  }
  for (const p of lv.plats || []) st.plats.push({ cells: p.path.map(([x, y]) => y * W + x), key: 'abcd'.indexOf(p.plate) });
  return st;
}

export function initState(st, nA) {
  const s = new Int16Array(nA + st.boxes0.length + st.plats.length);
  for (let i = 0; i < nA; i++) s[i] = st.start;
  st.boxes0.forEach((b, j) => s[nA + j] = b);
  return s;
}

function astroAt(st, s, nA, c) { if (c === st.start) return -1; for (let i = 0; i < nA; i++) if (s[i] === c) return i; return -1; }
function boxAt(st, s, nA, c) { const nb = st.boxes0.length; for (let j = 0; j < nb; j++) if (s[nA + j] === c) return j; return -1; }
function pressed(st, s, nA, k) {
  for (const c of st.plates[k]) { if ((!st.heavy[k] && astroAt(st, s, nA, c) >= 0) || boxAt(st, s, nA, c) >= 0) return true; }
  return false;
}
// Deriva puertas, rayos y plataformas de un estado.
export function derive(st, s, nA) {
  const pk = [pressed(st, s, nA, 0), pressed(st, s, nA, 1), pressed(st, s, nA, 2), pressed(st, s, nA, 3)];
  const open = new Uint8Array(st.doors.length);
  st.doors.forEach((d, j) => { const want = d.inv ? !pk[d.key] : pk[d.key]; open[j] = (want || astroAt(st, s, nA, d.i) >= 0 || boxAt(st, s, nA, d.i) >= 0) ? 1 : 0; });
  const platAt = new Int8Array(st.n).fill(-1);
  const nb = st.boxes0.length;
  st.plats.forEach((p, j) => { platAt[p.cells[s[nA + nb + j]]] = j; });
  const beam = new Uint8Array(st.n);
  for (const e of st.emitters) {
    if (e.off >= 0 && pk[e.off]) continue;
    let x = e.x + e.dx, y = e.y + e.dy;
    while (x >= 0 && y >= 0 && x < st.W && y < st.H) {
      const c = y * st.W + x;
      if (st.kind[c] === WALL) break;
      const di = st.doorAt[c]; if (di >= 0 && !open[di]) break;
      if (boxAt(st, s, nA, c) >= 0) break;
      beam[c] = 1; x += e.dx; y += e.dy;
    }
  }
  return { pk, open, beam, platAt };
}

function blocked(st, dv, c) { // celda donde no se puede entrar (sin contar puertas cerradas, astronautas ni cajas)
  const k = st.kind[c];
  if (k === WALL) return true;
  if (k === VOID && dv.platAt[c] < 0) return true;
  return false;
}

// Un segundo. acts: string con una letra por astronauta (ecos primero, el jugador en playerIdx).
// Devuelve { s, win, bumped, vanished } o null si la acción del jugador se rechaza.
export function step(st, s0, nA, acts, playerIdx, dv0) {
  const s = s0.slice(); const W = st.W;
  let dv = dv0 || derive(st, s0, nA);
  const bumped = [];
  for (let i = 0; i < nA; i++) {
    if (s[i] < 0) continue;
    const a = acts[i] || 'W'; if (a === 'W') continue;
    const x = s[i] % W, y = (s[i] / W) | 0, nx = x + DX[a], ny = y + DY[a];
    let res;
    if (nx < 0 || ny < 0 || nx >= W || ny >= st.H) res = false;
    else {
      const c = ny * W + nx; const di = st.doorAt[c];
      if (di >= 0 && !dv.open[di]) res = 'push';
      else if (blocked(st, dv, c) || astroAt(st, s, nA, c) >= 0 || dv.beam[c]) res = false;
      else {
        const bj = boxAt(st, s, nA, c);
        if (bj >= 0) {
          const bx = nx + DX[a], by = ny + DY[a];
          if (bx < 0 || by < 0 || bx >= W || by >= st.H) res = false;
          else {
            const bc = by * W + bx; const dib = st.doorAt[bc];
            if (dib >= 0 && !dv.open[dib]) res = 'push';
            else if (blocked(st, dv, bc) || astroAt(st, s, nA, bc) >= 0 || boxAt(st, s, nA, bc) >= 0 || st.kind[bc] === EXIT || bc === st.start) res = false;
            else { s[nA + bj] = bc; s[i] = c; res = true; }
          }
        } else { s[i] = c; res = true; }
      }
    }
    if (res === 'push') { bumped.push(i); continue; }
    if (!res) { if (i === playerIdx) return null; bumped.push(i); }
  }
  // plataformas
  dv = derive(st, s, nA);
  const nb = st.boxes0.length;
  st.plats.forEach((p, j) => {
    const cur = s[nA + nb + j]; const nxt = dv.pk[p.key] ? Math.min(cur + 1, p.cells.length - 1) : Math.max(cur - 1, 0);
    if (nxt === cur) return;
    const from = p.cells[cur], to = p.cells[nxt];
    const ai = astroAt(st, s, nA, from); if (ai >= 0) s[ai] = to;
    const bj = boxAt(st, s, nA, from); if (bj >= 0) s[nA + bj] = to;
    s[nA + nb + j] = nxt;
  });
  if (st.plats.length) dv = derive(st, s, nA);
  const vanished = [];
  for (let i = 0; i < nA; i++) {
    if (s[i] >= 0 && s[i] !== st.start && dv.beam[s[i]]) { if (i === playerIdx) return null; s[i] = -1; vanished.push(i); }
  }
  let win = false; for (let i = 0; i < nA; i++) if (s[i] === st.exit) win = true;
  return { s, win, bumped, vanished };
}

// Juega una solución (lista de grabaciones). Devuelve { win, copies, t, total } o { win:false, err }.
export function play(lv, loops) {
  const st = compile(lv); const recs = []; let total = 0;
  for (let k = 0; k < loops.length; k++) {
    let s = initState(st, k + 1); const rec = [];
    for (let t = 0; t < lv.N; t++) {
      const pa = loops[k][t]; if (pa === undefined) break;
      const acts = recs.map(r => r[t] || 'W'); acts.push(pa);
      const r = step(st, s, k + 1, acts, k);
      if (!r) return { win: false, err: `bucle ${k + 1}, segundo ${t + 1}: acción rechazada` };
      s = r.s; rec.push(pa); total++;
      if (r.win) return { win: true, copies: k + 1, t: t + 1, total };
    }
    recs.push(rec.join(''));
  }
  return { win: false, err: 'no llega a la salida' };
}

// Búsqueda exhaustiva sincronizada con k copias (ver DISENO.md 8.5).
export function solveK(lv, k, cap = 5e6) {
  const st = compile(lv); const N = lv.N; const A = 'UDLRW';
  let frontier = [{ ws: Array.from({ length: k }, (_, j) => initState(st, j + 1)), path: Array(k).fill('') }];
  let states = 0;
  for (let t = 0; t < N; t++) {
    const seen = new Set(); const nf = []; let win = null;
    for (const node of frontier) {
      const acts = new Array(k); const nws = new Array(k);
      const dvs = node.ws.map((w, j) => derive(st, w, j + 1));
      const rec = (j) => {
        if (win) return;
        if (j === k) {
          let key = ''; for (const w of nws) key += String.fromCharCode.apply(null, w) + '|';
          if (seen.has(key)) return; seen.add(key); states++;
          nf.push({ ws: nws.slice(), path: node.path.map((p, i) => p + acts[i]) });
          return;
        }
        for (const a of A) {
          acts[j] = a;
          const r = step(st, node.ws[j], j + 1, acts, j, dvs[j]);
          if (!r) continue;
          if (r.win) { win = { copies: j + 1, t: t + 1, path: node.path.slice(0, j + 1).map((p, i) => p + acts[i]) }; return; }
          nws[j] = r.s; rec(j + 1);
        }
      };
      rec(0);
      if (win) return { ...win, states };
      if (states > cap) return { overflow: true, states };
    }
    frontier = nf;
  }
  return null;
}
