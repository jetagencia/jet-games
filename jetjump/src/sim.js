// JETJump — simulación de recorrido de salto (sin dependencias de render).
// Unidades SI: metros, segundos, radianes. Plano XZ, Y arriba.
// Dirección de un ángulo th: (cos th, sin th). th creciente = giro a la derecha.

export const G = 9.81;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const GAIT = { HALT: 0, WALK: 1, TROT: 2, CANTER: 3, GALLOP: 4 };
export const GAIT_NAMES = ['Parado', 'Paso', 'Trote', 'Galope', 'Galope largo'];

// Secuencia de apoyos por aire [MA, MD, PA, PD] (mano izq, mano der, pie izq, pie der), mano derecha.
const FOOT = {
  1: [0.25, 0.75, 0.0, 0.5],
  2: [0.0, 0.5, 0.5, 0.0],
  3: [0.28, 0.48, 0.0, 0.24],
  4: [0.42, 0.55, 0.0, 0.12],
};
export const DUTY = { 1: 0.62, 2: 0.42, 3: 0.40, 4: 0.30 };

export function footOffsets(gait, lead) {
  const o = FOOT[gait];
  if (!o) return null;
  if (lead > 0 || gait < 3) return o;
  return [o[1], o[0], o[3], o[2]];
}

export function strideFreq(g, v) {
  switch (g) {
    case 1: return 0.9 + 0.05 * v;
    case 2: return 1.3 + 0.04 * v;
    case 3: return 1.45 + 0.045 * v;
    case 4: return 1.7 + 0.045 * v;
    default: return 0;
  }
}

// "pace" 0..1 es la intención del jinete; se traduce a velocidad objetivo.
export function paceToSpeed(p, top) {
  const pts = [[0, 0], [0.1, 1.6], [0.25, 3.4], [0.38, 4.6], [0.8, 8.0], [1, top]];
  for (let i = 1; i < pts.length; i++) {
    if (p <= pts[i][0]) {
      const [p0, s0] = pts[i - 1], [p1, s1] = pts[i];
      return lerp(s0, s1, (p - p0) / (p1 - p0));
    }
  }
  return top;
}
export function speedToPace(v, top) {
  const pts = [[0, 0], [0.1, 1.6], [0.25, 3.4], [0.38, 4.6], [0.8, 8.0], [1, top]];
  for (let i = 1; i < pts.length; i++) {
    if (v <= pts[i][1]) {
      const [p0, s0] = pts[i - 1], [p1, s1] = pts[i];
      return lerp(p0, p1, (v - s0) / (s1 - s0));
    }
  }
  return 1;
}

// ---------------------------------------------------------------------------
// Solver balístico del salto.
// El centro de masa sigue una parábola; manos y pies se evalúan con el
// cabeceo (báscula) del caballo. Despegue largo => ápice temprano => pies bajos
// en la barra trasera. Despegue profundo => manos bajas en la barra delantera.
// ---------------------------------------------------------------------------
const Y0 = 1.12;

export function jumpProfile(v, H, tech) {
  const u = v * 0.84 + 0.7;
  const tUp = Math.sqrt(2 * H / G);
  const T = 2 * tUp;
  return { u, tUp, T, len: u * T, pitch: 0.26 + 0.12 * tech };
}

function comAt(x, u, H, tUp) {
  const dx = x / u - tUp;
  return Y0 + H - 0.5 * G * dx * dx;
}

export function evalClearance(prof, H, d, cosA, planes, tech) {
  const { u, tUp, T, pitch } = prof;
  const len = u * T;
  const dropF = 0.60 - 0.13 * tech;
  const dropH = 0.70 - 0.15 * tech;
  const res = [];
  let min = Infinity;
  for (const p of planes) {
    const X = (d + p.o) / cosA;
    const xf = X - 0.85;
    const pf = pitch * Math.cos(Math.PI * clamp(xf / len, 0, 1));
    const yF = comAt(xf, u, H, tUp) + 0.85 * Math.sin(pf) - dropF;
    const xh = X + 1.0;
    const ph = pitch * Math.cos(Math.PI * clamp(xh / len, 0, 1));
    const yH = comAt(xh, u, H, tUp) - 1.0 * Math.sin(ph) - dropH;
    const c = Math.min(yF, yH) - p.h;
    res.push({ c, front: yF - p.h, hind: yH - p.h, X });
    if (c < min) min = c;
  }
  return { min, planes: res };
}

export function maxRise(stats, v, power) {
  // Una potencia 1.0 con scope S permite pasar ~S metros con buena distancia.
  const imp = clamp(0.62 + 0.065 * v, 0.7, 1.12);
  return Math.max(0.3, (1.27 * stats.scope - 0.79) * imp * power);
}

export function solveJump({ v, d, cosA, planes, water, stats, power }) {
  const tech = stats.tech;
  const Hmax = maxRise(stats, v, power);
  const margin = 0.03 + 0.09 * stats.care;
  const isWet = (prof) => water ? (prof.len - 0.55) < (d + water.end) / cosA : false;
  let best = null;
  for (let H = 0.25; H <= Hmax + 1e-6; H += 0.01) {
    const prof = jumpProfile(v, H, tech);
    const ev = evalClearance(prof, H, d, cosA, planes, tech);
    const wet = isWet(prof);
    const score = ev.min - (wet ? 0.3 : 0);
    if (!best || score > best.score) best = { H, prof, ev, wet, score };
    if (ev.min >= margin && !wet) { best = { H, prof, ev, wet, score }; break; }
  }
  if (!best) {
    const H = 0.25, prof = jumpProfile(v, H, tech);
    best = { H, prof, ev: evalClearance(prof, H, d, cosA, planes, tech), wet: isWet(prof), score: 0 };
  }
  return { ...best, Hmax };
}

// Distancia de despegue ideal para una valla y velocidad.
export function idealTakeoff(planes, v, stats, power = 1) {
  let bestD = 2, bestC = -Infinity;
  for (let d = 0.5; d <= 3.8; d += 0.05) {
    const s = solveJump({ v, d, cosA: 1, planes, stats, power });
    // preferimos el despegue que deja más margen con potencia contenida
    const score = s.ev.min - 0.02 * Math.abs(d - 2);
    if (score > bestC) { bestC = score; bestD = d; }
  }
  return bestD;
}

// ---------------------------------------------------------------------------
// Ride: un binomio recorriendo una pista.
// ---------------------------------------------------------------------------
export class Ride {
  constructor(opts) {
    this.course = opts.course;
    this.els = opts.course.elements;
    this.horse = opts.horse;      // stats normalizados
    this.rider = opts.rider || { eye: 0.5, balance: 0.5, nerve: 0.5, turns: 0.5 };
    this.rng = opts.rng || Math.random;
    this.mode = opts.mode || 'A';  // 'A' tabla A, 'C' tabla C, 'train', 'power'
    this.assist = !!opts.assist;
    this.training = this.mode === 'train';
    this.countdown = this.training ? 0 : 45;

    const st = this.course.start;
    this.x = st.x - Math.cos(st.th) * 7; this.z = st.z - Math.sin(st.th) * 7;
    const A = this.course.arena;
    this.x = clamp(this.x, -A.w / 2 + 2.5, A.w / 2 - 2.5); this.z = clamp(this.z, -A.h / 2 + 2.5, A.h / 2 - 2.5);
    if (opts.startPos) { this.x = opts.startPos.x; this.z = opts.startPos.z; }
    this.heading = opts.startHeading ?? st.th;
    this.v = opts.startSpeed ?? 0;
    this.top = 9.4 + 2.6 * this.horse.speed;
    this.pace = speedToPace(this.v, this.top);
    this.gait = this.v > 4.2 ? 3 : this.v > 0.3 ? 1 : 0;
    this.phase = 0; this.strideScale = 1; this.omega = 0;
    this.lead = 1; this.wrongLeadT = 0;
    this.stamina = clamp(opts.fitness ?? 1, 0.3, 1);
    this.next = 0;
    this.jumpFaults = 0; this.disob = 0; this.time = 0; this.clock = 0;
    this.started = this.training; this.finished = false; this.elim = null;
    this.jump = null; this.refuse = null; this.lock = -1; this.askT = -99;
    this.y = Y0; this.pitch = 0; this.roll = 0;
    this.events = [];
    this.stats = { jumps: 0, rails: 0, perfect: 0, long: 0, deep: 0 };
    this.downEls = new Set();
    this.prevA = this.els.map(() => -Infinity);
    this.idealCache = new Map();
    this.feedback = null;
  }

  emit(type, data = {}) { this.events.push({ type, t: this.clock, ...data }); }
  dir() { return [Math.cos(this.heading), Math.sin(this.heading)]; }
  get timeFaults() {
    if (this.mode !== 'A' || !this.course.ta) return 0;
    return this.time > this.course.ta ? Math.ceil(this.time - this.course.ta - 1e-9) : 0;
  }
  get faults() { return this.jumpFaults + this.timeFaults; }
  // Tabla C: barras convertidas en segundos.
  get scoreTime() { return this.time + (this.mode === 'C' ? this.downEls.size * 4 : 0); }

  power() {
    const fat = 0.82 + 0.18 * this.stamina;
    return fat * (this.horse.form ?? 1);
  }

  ideal(E, v) {
    const key = E.idx * 100 + Math.round(v * 4);
    let r = this.idealCache.get(key);
    if (r === undefined) { r = idealTakeoff(E.planes, Math.max(v, 4), this.horse, this.power()); this.idealCache.set(key, r); }
    return r;
  }

  local(E, x = this.x, z = this.z) {
    const dx = x - E.x, dz = z - E.z;
    return { a: dx * E.n[0] + dz * E.n[1], b: dx * E.l[0] + dz * E.l[1] };
  }

  // Valla que el caballo tiene enfrente (la más cercana dentro del cono).
  candidate() {
    const [hx, hz] = this.dir();
    let best = null;
    for (const E of this.els) {
      const { a, b } = this.local(E);
      const d = -a;
      if (d < -0.3 || d > 16) continue;
      const cosA = hx * E.n[0] + hz * E.n[1];
      if (cosA < 0.45) continue;
      if (this.lock === E.idx && d < 7) continue;
      const lat = hx * E.l[0] + hz * E.l[1];
      const bp = b + lat / cosA * Math.max(d, 0);
      if (Math.abs(bp) > E.half + 1.6) continue;
      if (!best || d < best.d) best = { E, d, cosA, bp };
    }
    return best;
  }

  strideLen() {
    const f = strideFreq(Math.max(this.gait, 3), Math.max(this.v, 3));
    return Math.max(this.v, 3) / f;
  }

  // Info de aproximación para HUD / IA.
  approach() {
    if (this.jump || this.next >= this.els.length) return null;
    const E = this.els[this.next];
    const { a, b } = this.local(E);
    const d = -a;
    const [hx, hz] = this.dir();
    const cosA = hx * E.n[0] + hz * E.n[1];
    const L = this.strideLen();
    const ideal = this.ideal(E, this.v);
    const strides = (d - ideal) / L;
    return { E, d, b, cosA, L, ideal, strides };
  }

  step(dt, inp) {
    this.events.length = 0;
    if (this.finished || (this.elim && !this.training)) {
      this.groundMove(dt, { steer: 0, pace: -2 }, true);
      this.updatePose(dt);
      return;
    }
    this.clock += dt;
    if (!this.started && this.clock >= this.countdown) { this.started = true; this.emit('start', { late: true }); }
    if (this.started && !this.finished) this.time += dt;
    if (this.course.tl && this.time > this.course.tl && this.mode !== 'train') this.eliminate('Tiempo límite excedido');
    if (inp.jump) { this.askT = this.clock; }
    this.pace = clamp(this.pace + (inp.pace || 0) * dt * 0.55, 0, 1);
    if (inp.paceSet != null) this.pace = clamp(inp.paceSet, 0, 1);

    if (this.jump) this.stepJump(dt, inp);
    else this.stepGround(dt, inp);
    this.lines();
    this.updatePose(dt);
  }

  eliminate(reason) {
    if (this.elim || this.finished) return;
    if (this.training) { this.emit('feedback', { msg: reason, q: 'bad' }); return; }
    this.elim = reason;
    this.emit('elim', { reason });
  }

  stepGround(dt, inp) {
    if (this.refuse) {
      this.refuse.t -= dt;
      this.v = Math.max(0, this.v - 11 * dt);
      if (this.refuse.t <= 0) { this.refuse = null; this.pace = Math.min(this.pace, 0.12); }
      this.groundMove(dt, { steer: this.v < 1 ? inp.steer : 0, pace: 0 }, true);
      return;
    }
    this.groundMove(dt, inp, false);
  }

  groundMove(dt, inp, locked) {
    const h = this.horse;
    let target = locked ? (this.refuse ? 0 : Math.min(paceToSpeed(this.pace, this.top), this.v)) : paceToSpeed(this.pace, this.top);
    if (this.finished || this.elim) { target = Math.max(0, this.v - 2.5 * dt); this.pace = speedToPace(target, this.top); }
    const acc = (1.4 + 1.4 * h.ride) * (0.75 + 0.25 * this.stamina);
    const dec = 2.4 + 1.6 * h.ride;
    if (this.v < target) this.v = Math.min(target, this.v + acc * dt);
    else this.v = Math.max(target, this.v - dec * dt);

    // aire con histéresis
    const up = [0.25, 2.4, 4.3, 8.7], dn = [0.15, 2.0, 3.9, 8.3];
    let g = this.gait;
    while (g < 4 && this.v > up[g]) g++;
    while (g > 0 && this.v < dn[g - 1]) g--;
    if (g !== this.gait) { this.emit('gait', { from: this.gait, to: g }); this.gait = g; }

    // giro
    const steer = clamp(inp.steer || 0, -1, 1);
    let maxTurn;
    if (this.v < 0.4) maxTurn = 1.3;
    else {
      const rMin = Math.max(1.8, this.v * this.v / (5.0 + 2.0 * this.rider.turns + 1.0 * h.ride));
      maxTurn = Math.min(2.0, this.v / rMin);
    }
    let want = steer * maxTurn;
    if (this.gait >= 3 && Math.sign(steer) !== 0 && Math.sign(steer) !== this.lead && Math.abs(steer) > 0.25) {
      want *= 0.62;
      this.wrongLeadT += dt;
    } else this.wrongLeadT = Math.max(0, this.wrongLeadT - dt * 2);
    this.omega += (want - this.omega) * Math.min(1, dt * 7);
    this.heading += this.omega * dt;

    // movimiento con colisiones
    const [hx, hz] = this.dir();
    const nx = this.x + hx * this.v * dt, nz = this.z + hz * this.v * dt;
    this.moveTo(nx, nz, dt);

    // fase del tranco
    if (this.gait >= 1) {
      const f = strideFreq(this.gait, Math.max(this.v, 0.5)) / this.strideScale;
      const prev = this.phase;
      this.phase += f * dt;
      const offs = footOffsets(this.gait, this.lead);
      for (let leg = 0; leg < 4; leg++) {
        let o = offs[leg];
        if ((prev < o && this.phase >= o) || (prev < o + 1 && this.phase >= o + 1)) this.emit('hoof', { leg, gait: this.gait, v: this.v });
      }
      if (this.phase >= 1) { this.phase -= 1; this.onBoundary(); }
    }

    // energía
    const k = this.v / 7;
    if (this.gait >= 3) this.stamina -= k * k * 0.0035 * dt * (1.4 - 0.6 * h.stamina);
    else if (this.gait <= 1) this.stamina += 0.012 * dt;
    this.stamina = clamp(this.stamina, 0.2, 1);
  }

  moveTo(nx, nz, dt) {
    const R = 0.55;
    for (const E of this.els) {
      if (this.jump) break;
      const p0 = this.local(E), p1 = this.local(E, nx, nz);
      const a0 = E.spread + 0.35 + (E.water ? E.water.end - E.spread : 0);
      const inside = (p) => p.a > -0.4 && p.a < a0 && Math.abs(p.b) < E.half + 0.1;
      if (!inside(p0) && inside(p1)) {
        // choca contra la valla: frena y resbala a lo largo del obstáculo
        const approaching = p0.a <= -0.4;
        if (approaching && E.idx === this.next && this.v > 1.8 && this.lock !== E.idx && this.clock - (this.lastRefuseT || -9) > 3) this.doRefusal(E, 'Rehúse');
        const dx = nx - this.x, dz = nz - this.z;
        const along = dx * E.l[0] + dz * E.l[1];
        const side = Math.sign(p0.b || 1) * 0.4 * dt;
        nx = this.x + E.l[0] * (along + side); nz = this.z + E.l[1] * (along + side);
        this.v = Math.min(this.v, 1.2) * 0.9; this.omega *= 0.5;
        if (inside(this.local(E, nx, nz))) return;
      }
      // postes / alas
      for (const s of [-1, 1]) {
        for (const pl of E.planes) {
          const cx = E.x + E.n[0] * pl.o + E.l[0] * s * (E.half + 0.3);
          const cz = E.z + E.n[1] * pl.o + E.l[1] * s * (E.half + 0.3);
          const dx = nx - cx, dz = nz - cz, dd = Math.hypot(dx, dz);
          const rr = R + 0.35;
          if (dd < rr && dd > 1e-4) { nx = cx + dx / dd * rr; nz = cz + dz / dd * rr; this.v *= 0.97; }
        }
      }
    }
    const A = this.course.arena;
    const mx = A.w / 2 - 1.2, mz = A.h / 2 - 1.2;
    if (Math.abs(nx) > mx || Math.abs(nz) > mz) {
      nx = clamp(nx, -mx, mx); nz = clamp(nz, -mz, mz);
      this.v *= Math.pow(0.2, dt);
    }
    // detección de escape (run-out) en la valla siguiente
    if (this.next < this.els.length) {
      const E = this.els[this.next];
      const p0 = this.local(E), p1 = this.local(E, nx, nz);
      if (p0.a < 0 && p1.a >= 0 && Math.abs(p1.b) > E.half && Math.abs(p1.b) < E.half + 3.5 && this.v > 2 && this.lock !== E.idx) {
        this.doRefusal(E, 'Escape');
      }
    }
    this.x = nx; this.z = nz;
  }

  onBoundary() {
    this.strideScale = 1;
    this.emit('stride', { gait: this.gait, v: this.v });
    // cambio de pie en el aire
    if (this.wrongLeadT > 0.55 && this.gait >= 3) {
      const p = 0.55 + 0.4 * this.horse.ride;
      if (this.rng() < p) { this.lead = -this.lead; this.wrongLeadT = 0; this.emit('lead', { lead: this.lead }); }
      else this.wrongLeadT = 0.3;
    }
    if (this.lock >= 0) {
      const E = this.els[this.lock];
      const { a } = this.local(E);
      if (-a > 7 || a > 1) this.lock = -1;
    }
    this.jumpLogic();
  }

  jumpLogic() {
    if (this.gait < 2 || this.v < 2.5) return;
    const c = this.candidate();
    if (!c) return;
    const { E, d, cosA, bp } = c;
    const L = this.v / strideFreq(this.gait, this.v);
    const ideal = this.ideal(E, this.v);
    const strideT = 1 / strideFreq(this.gait, this.v);
    const age = this.clock - this.askT;
    const asked = age < strideT * 1.65;
    const nextD = d - L;
    const lined = Math.abs(bp) < E.half - 0.15;

    if (d >= 0.35 && d <= 3.75) {
      if (!lined) {
        if (E.idx === this.next && Math.abs(bp) < E.half + 1.6 && (asked || nextD < 0.5)) this.doRefusal(E, 'Escape');
        return;
      }
      // reticencia: valla muy grande para el caballo, sin impulso o mal ángulo
      const big = Math.max(0, E.h - this.horse.scope - 0.02) * 3;
      const slow = Math.max(0, 4.6 - this.v) * 0.18 * (E.h / 1.3);
      const angle = Math.max(0, 0.82 - cosA) * 2.2;
      const nerve = 0.5 * this.horse.bold + 0.5 * this.rider.nerve;
      const pRefuse = clamp(0.01 + big + slow + angle - 0.06 * nerve, 0, 0.85);
      if (asked) {
        if (this.rng() < pRefuse) { this.doRefusal(E, 'Rehúse'); return; }
        const support = age < strideT * 0.95 ? 1.04 : 0.95;
        this.takeoff(E, d, cosA, support, age < strideT * 0.95 ? 'ok' : 'early');
        return;
      }
      if (nextD < 0.45) {
        const pGo = clamp(0.25 + 0.6 * this.horse.bold - pRefuse * 1.5 + (this.assist ? 0.1 : 0), 0.05, 0.95);
        if (this.rng() < pGo) this.takeoff(E, d, cosA, 0.9, 'auto');
        else this.doRefusal(E, 'Rehúse');
        return;
      }
    } else if (d > -0.3 && d < 0.35 && lined) {
      this.doRefusal(E, 'Rehúse');
      return;
    }
    // ajuste del próximo tranco: el caballo "busca" la distancia
    if (d < 12 && d > ideal + 0.3 && lined) {
      const adj = 0.06 + 0.09 * this.horse.ride + 0.09 * this.rider.eye + (this.assist ? 0.05 : 0);
      const k = Math.max(1, Math.round((d - ideal) / L));
      this.strideScale = clamp((d - ideal) / (k * L), 1 - adj, 1 + adj);
    }
  }

  doRefusal(E, kind) {
    if (this.refuse || this.jump) return;
    this.refuse = { t: 0.9, kind };
    this.lock = E.idx; this.lastRefuseT = this.clock;
    this.omega = 0;
    if (E.idx !== this.next || !this.started) { this.emit('halt', { el: E.idx }); return; }
    this.disob++;
    this.stats.refusals = this.disob;
    if (this.mode !== 'train') {
      if (this.mode === 'A' || this.mode === 'power') this.jumpFaults += 4;
      else this.time += 6; // Tabla C: corrección de tiempo
    }
    this.emit('refusal', { kind, el: E.idx, n: this.disob });
    // combinación: hay que retomar desde el primer elemento
    if (E.comboPos > 0) {
      this.next = E.comboStart;
      this.lock = -1;
    }
    if (this.disob >= 2 && this.mode !== 'train') this.eliminate('Segunda desobediencia');
  }

  takeoff(E, d, cosA, support, how) {
    const power = this.power() * support;
    const sol = solveJump({ v: this.v, d, cosA, planes: E.planes, water: E.water, stats: this.horse, power });
    const [hx, hz] = this.dir();
    const knocks = [];
    let crash = false;
    sol.ev.planes.forEach((p, i) => {
      let down = false;
      const c = p.c + 0.02 * (this.rider.balance - 0.5);
      let pd = 0;
      if (c < 0.03) pd = Math.pow(clamp((0.03 - c) / 0.24, 0, 1), 1.3);
      if (c < 0.10) pd += 0.05 * (1 - this.horse.care);
      pd *= 1.1 - 0.4 * this.horse.care;
      down = this.rng() < pd;
      if (c < -0.7 && p.front < p.hind) crash = true;
      knocks.push({ plane: i, t: (p.X / sol.prof.u), c, down, front: p.front < p.hind, done: false });
    });
    const quality = d - this.ideal(E, this.v);
    const spot = Math.abs(quality) < 0.4 ? 'perfect' : quality > 0 ? 'long' : 'deep';
    this.stats.jumps++; this.stats[spot]++;
    this.jump = {
      E, t: 0, T: sol.prof.T, u: sol.prof.u, H: sol.H, tUp: sol.prof.tUp, pitchAmp: sol.prof.pitch,
      x0: this.x, z0: this.z, hx, hz, knocks, wet: sol.wet, crash: crash && this.rng() < 0.3, v0: this.v,
      d, ideal: d - quality, spot, how, landLead: this.lead, power,
    };
    this.refuse = null;
    this.strideScale = 1;
    this.stamina -= 0.012 + 0.02 * E.h;
    this.emit('takeoff', { el: E.idx, d, spot, how, ideal: d - quality, H: sol.H, h: E.h });
    if (E.idx !== this.next && !this.training) {
      this.wrongFence = true;
    }
  }

  stepJump(dt, inp) {
    const j = this.jump;
    j.t += dt;
    const s = Math.min(j.t, j.T);
    this.x = j.x0 + j.hx * j.u * s;
    this.z = j.z0 + j.hz * j.u * s;
    const dx = s - j.tUp;
    this.y = Y0 + j.H - 0.5 * G * dx * dx;
    if (Math.abs(inp.steer || 0) > 0.3) j.landLead = Math.sign(inp.steer);
    for (const k of j.knocks) {
      if (!k.done && j.t >= k.t) {
        k.done = true;
        if (k.down) {
          this.emit('knock', { el: j.E.idx, plane: k.plane, c: k.c, front: k.front });
          if (!this.downEls.has(j.E.idx)) {
            this.downEls.add(j.E.idx);
            this.stats.rails++;
            if (this.mode === 'A' || this.mode === 'power') this.jumpFaults += 4;
          }
        } else if (k.c < 0.07) this.emit('rub', { el: j.E.idx, plane: k.plane });
      }
    }
    if (j.t >= j.T) this.land();
  }

  land() {
    const j = this.jump;
    this.jump = null;
    this.y = Y0;
    this.v = j.v0 * 0.96;
    this.gait = this.v > 8.7 ? 4 : 3;
    this.phase = 0;
    if (j.landLead !== this.lead) { this.lead = j.landLead; this.emit('lead', { lead: this.lead, air: true }); }
    this.emit('land', { el: j.E.idx, v: this.v, spot: j.spot });
    if (j.wet) {
      this.emit('water', { el: j.E.idx });
      if (!this.downEls.has(j.E.idx)) {
        this.downEls.add(j.E.idx);
        if (this.mode === 'A' || this.mode === 'power') this.jumpFaults += 4;
      }
    }
    if (j.crash) {
      this.emit('fall', {});
      this.v = 0;
      this.eliminate('Caída');
      return;
    }
    if (this.wrongFence) { this.wrongFence = false; this.eliminate('Error de recorrido'); return; }
    if (j.E.idx === this.next || this.training) {
      this.next = this.training ? (j.E.idx + 1) % this.els.length : this.next + 1;
      this.lock = -1;
      this.emit('cleared', { el: j.E.idx, down: this.downEls.has(j.E.idx) });
    }
    this.onLandBoundary();
  }

  onLandBoundary() { this.jumpLogic(); }

  lines() {
    const crossed = (line, px, pz) => {
      const n = [Math.cos(line.th), Math.sin(line.th)];
      const a0 = (px - line.x) * n[0] + (pz - line.z) * n[1];
      const a1 = (this.x - line.x) * n[0] + (this.z - line.z) * n[1];
      const b = -(this.x - line.x) * n[1] + (this.z - line.z) * n[0];
      return a0 < 0 && a1 >= 0 && Math.abs(b) < line.half;
    };
    const px = this._px ?? this.x, pz = this._pz ?? this.z;
    if (!this.started && crossed(this.course.start, px, pz)) { this.started = true; this.emit('start', {}); }
    if (this.started && !this.finished && this.next >= this.els.length && !this.training && crossed(this.course.finish, px, pz)) {
      this.finished = true;
      this.emit('finish', { time: this.time, faults: this.faults });
    }
    this._px = this.x; this._pz = this.z;
  }

  updatePose(dt) {
    let pitch = 0, roll = 0;
    if (this.jump) {
      const j = this.jump;
      pitch = j.pitchAmp * Math.cos(Math.PI * Math.min(j.t / j.T, 1));
    } else {
      this.y += (Y0 - this.y) * Math.min(1, dt * 10);
      roll = -Math.atan(this.v * this.omega / G) * 0.6;
    }
    this.pitch += (pitch - this.pitch) * Math.min(1, dt * (this.jump ? 30 : 8));
    this.roll += (roll - this.roll) * Math.min(1, dt * 6);
  }
}

// ---------------------------------------------------------------------------
// Piloto automático: lo usan los rivales simulados, la demo del menú y los tests.
// ---------------------------------------------------------------------------
export class AutoRider {
  constructor(ride, skill = 0.7, rng = Math.random, opts = {}) {
    this.ride = ride; this.skill = skill; this.rng = rng;
    this.cruise = opts.cruise ?? 6.4;
    this.path = buildPath(ride.course);
    this.wp = 0; this.asked = -1;
    this.noise = 0;
    this.fixed = opts.fixed ?? true;
  }
  input(dt) {
    const r = this.ride;
    const inp = { steer: 0, pace: 0, jump: false, paceSet: null };
    // waypoint actual
    const P = this.path;
    let tgt = P[Math.min(this.wp, P.length - 1)];
    const elIdx = tgt.el;
    if (elIdx != null && r.next > elIdx && this.wp < P.length - 1) this.wp++;
    if (Math.hypot(tgt.x - r.x, tgt.z - r.z) < tgt.r && this.wp < P.length - 1) this.wp++;
    if (r.refuse || (r.lock >= 0 && r.lock === r.next)) {
      // tras un rehúse, volver al punto de aproximación
      const k = P.findIndex(p => p.el === r.next && p.kind === 'app');
      if (k >= 0) this.wp = Math.max(0, k - 1);
    }
    tgt = P[Math.min(this.wp, P.length - 1)];
    let look = P[Math.min(this.wp + 1, P.length - 1)];
    // si el objetivo está detrás de la próxima valla, rodearla por el lado más cercano
    if (r.next < r.els.length && (tgt.kind === 'pre' || tgt.kind === 'app') && tgt.el === r.next) {
      const E = r.els[r.next]; const lp = r.local(E);
      if (lp.a > -3 && Math.abs(lp.b) < E.half + 1.5) {
        const sgn = Math.sign(lp.b || 1);
        tgt = { x: E.x + E.l[0] * sgn * (E.half + 3.5) - E.n[0] * 1, z: E.z + E.l[1] * sgn * (E.half + 3.5) - E.n[1] * 1, r: 2, kind: 'detour' };
        look = tgt;
      }
    }
    const dist = Math.hypot(tgt.x - r.x, tgt.z - r.z);
    const w = clamp(1 - dist / 8, 0, 0.6);
    const ax = lerp(tgt.x, look.x, w), az = lerp(tgt.z, look.z, w);
    const want = Math.atan2(az - r.z, ax - r.x);
    const err = angDiff(r.heading, want);
    this.noise += ((this.rng() - 0.5) * 2 - this.noise) * dt * 2;
    inp.steer = clamp(err * 2.6 + this.noise * 0.15 * (1 - this.skill), -1, 1);

    let vT = this.cruise;
    const ap = r.approach();
    if (Math.abs(err) > 0.9) vT = Math.min(vT, 5.2);
    if (ap && ap.d > 0 && ap.d < 30 && ap.cosA > 0.8) {
      // elegir número de trancos que mantenga la cadencia más cercana al crucero
      const raw = (ap.d - ap.ideal) / ap.L;
      if (this.planEl !== r.next || this.planK == null) { this.planEl = r.next; this.planK = null; }
      if (raw >= 1.15) {
        let k = this.planK;
        if (k == null || Math.abs(raw - k) > 0.75) {
          let bestE = Infinity;
          for (const kk of [Math.floor(raw), Math.ceil(raw)]) {
            if (kk < 1) continue;
            const Lw = (ap.d - ap.ideal) / kk;
            const vW = 1.45 * Lw / Math.max(0.2, 1 - 0.045 * Lw);
            const e = Math.abs(vW - this.cruise);
            if (e < bestE) { bestE = e; k = kk; }
          }
          this.planK = k;
        }
        const Lw = (ap.d - ap.ideal) / k;
        vT = this.fixed ? this.cruise : 1.45 * Lw / Math.max(0.2, 1 - 0.045 * Lw);
      } else vT = this.lastVT ?? r.v;
      let bestV = vT;
      const errEye = (1 - this.skill) * 0.12;
      vT = clamp(bestV * (1 + (this.rng() - 0.5) * errEye), this.cruise - 1.3, this.cruise + 1.3);
      if (ap.E.water && ap.d < 24) vT = Math.max(vT, 7.6 + 0.8 * this.skill);
      this.lastVT = vT;
      for (const e of r.events) {
        if (e.type === 'stride' || e.type === 'land') {
          const dN = ap.d - ap.L * r.strideScale;
          if (Math.abs(dN - ap.ideal) < ap.L * 0.5 && dN > 0.3 && this.asked !== r.next) {
            this.askAt = r.clock + (0.3 + 0.3 * this.rng()) / strideFreq(Math.max(r.gait, 3), r.v);
            this.asked = r.next;
          }
        }
      }
    }
    if (this.askAt != null && r.clock >= this.askAt) {
      this.askAt = null;
      if (this.rng() < 0.9 + 0.1 * this.skill) inp.jump = true;
    }
    if (!r.started && r.clock < 30) vT = Math.min(vT, 6.0);
    inp.paceSet = speedToPace(vT, r.top);
    if (r.jump) this.asked = -1;
    return inp;
  }
}

export function buildPath(course) {
  const P = [];
  const st = course.start;
  P.push({ x: st.x, z: st.z, r: 3, kind: 'start' });
  const els = course.elements;
  for (let i = 0; i < els.length; i++) {
    const E = els[i];
    if (E.comboPos === 0) {
      P.push({ x: E.x - E.n[0] * 13, z: E.z - E.n[1] * 13, r: 4, el: i, kind: 'pre' });
      P.push({ x: E.x - E.n[0] * 7, z: E.z - E.n[1] * 7, r: 2.5, el: i, kind: 'app' });
    }
    P.push({ x: E.x + E.n[0] * (E.spread / 2), z: E.z + E.n[1] * (E.spread / 2), r: 1.5, el: i, kind: 'fence' });
    const last = i === els.length - 1 || els[i + 1].comboStart !== E.comboStart;
    if (last) P.push({ x: E.x + E.n[0] * (E.spread + 7), z: E.z + E.n[1] * (E.spread + 7), r: 3, kind: 'land' });
  }
  const fi = course.finish;
  P.push({ x: fi.x + Math.cos(fi.th) * 6, z: fi.z + Math.sin(fi.th) * 6, r: 3, kind: 'finish' });
  return P;
}

// Longitud del recorrido por la línea ideal (para el tiempo acordado).
export function pathLength(course) {
  const P = buildPath(course);
  let L = 0;
  for (let i = 1; i < P.length; i++) L += Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z);
  return L * 1.08;
}

// Simula un recorrido completo sin render. Devuelve el resultado.
export function simulateRound(course, horse, rider, skill, seed, mode = 'A', cruise) {
  const rng = mulberry32(seed);
  const ride = new Ride({ course, horse, rider, rng, mode });
  const ai = new AutoRider(ride, skill, rng, { cruise });
  const dt = 1 / 30;
  for (let i = 0; i < 30 * 400; i++) {
    ride.step(dt, ai.input(dt));
    if (ride.finished || ride.elim) break;
  }
  if (!ride.finished && !ride.elim) ride.elim = 'Retirado';
  return { faults: ride.faults, time: ride.time, scoreTime: ride.scoreTime, elim: ride.elim, rails: ride.stats.rails, refusals: ride.disob };
}
