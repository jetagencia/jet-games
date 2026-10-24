// Física y reglas del recorrido. Coordenadas: rumbo h, avance f = (cos h, sin h); h creciente = giro a la derecha.
import { ARENA } from './course.js';

export const GEARS = [
  { name: 'Atrás', v: -0.9 },
  { name: 'Alto', v: 0 },
  { name: 'Paso', v: 1.6 },
  { name: 'Galope', v: 5.6 },
  { name: 'Galope largo', v: 7.3 },
];
const GEAR_STOP = 1;
const TAKEOFF_CLIP = 0.5;          // segundos del clip «jump» desde su inicio hasta la batida (a velocidad 1)

export class Ride {
  constructor(course, fences, horse, opts = {}) {
    this.C = course; this.fences = fences; this.horse = horse;
    this.assist = opts.assist !== false;
    this.training = !!course.training;
    const st = course.start;
    const a = st.dir * Math.PI / 180;
    this.x = st.x - Math.cos(a) * 6; this.z = st.z - Math.sin(a) * 6; this.h = a;
    this.v = 0; this.gear = GEAR_STOP; this.w = 0; this.steer = 0;
    this.next = 0; this.faults = 0; this.refusals = 0; this.time = 0;
    this.started = this.training; this.finished = false; this.elim = null;
    this.jump = null; this.refuse = null; this.events = [];
    this.lastPhase = 0; this.cleared = new Set(); this.knockedSet = new Set();
    this.stats = { perfect: 0, long: 0, deep: 0, jumps: 0 };
    this.log = [];
    this.clk = 0;                  // reloj propio (corre siempre, también antes de la salida)
    this.call = null;              // pedido de salto del jugador { grade, fence, t }
    this.cue = null;               // para el HUD: cuántos trancos faltan para la batida ideal
    this.refuseCool = null;        // tras un rehúse, la misma valla no vuelve a rehusar enseguida
    this.blockT = -9; this.slowT = -9; this.gearT = -9;
    this.knocks = 0; this.lastRefuse = null;          // para el desglose del resultado
    // carrera: atributos del caballo, habilidades del jinete y confianza (sin carrera, todo neutro)
    const M = this.mods = opts.mods || null;
    this.conf = M && M.conf ? { v: M.conf.max * M.conf.start, max: M.conf.max, low: false } : null;
  }
  // velocidad objetivo de cada marcha: el galope depende del atributo Velocidad y del cansancio
  gearV(g) {
    const v = GEARS[g].v, M = this.mods;
    if (!M || g < 3) return v;
    const tired = this.started && this.C.fences.length ? Math.max(0, this.next / this.C.fences.length - 0.5) * 0.06 * (M.fatigue ?? 0.5) : 0;
    return v * (M.speedK || 1) * (1 - tired);
  }
  // confianza: baja en los giros cerrados al galope, en las malas batidas, derribos y rehúses; sube con
  // los saltos limpios y el galope recto. Si queda baja, el caballo puede rehusar y salta con menos margen.
  confAdd(d) {
    const C = this.conf; if (!C) return;
    if (d < 0) d *= this.mods.conf.hitK || 1; else d *= this.mods.conf.regen || 1;
    C.v = clamp(C.v + d, 0, C.max);
  }
  confRatio() { return this.conf ? this.conf.v / this.conf.max : 1; }
  emit(type, data = {}) { this.events.push({ type, ...data }); }
  shiftGear(d) {
    if (this.jump && this.jump.phase !== 'land') return;
    let g = this.gear + d;
    if (d > 0 && this.gear === GEAR_STOP) g = 3;          // desde parado, + va directo a galope (el paso se pide con −)
    if (d < 0 && this.gear === GEAR_STOP && Math.abs(this.v) > 0.3) g = GEAR_STOP;   // atrás solo con el caballo quieto
    this.gear = Math.max(0, Math.min(GEARS.length - 1, g));
    this.gearT = this.clk;
  }
  // el jugador pide el salto (botón SALTO o Espacio). En el último tranco: salto amplio; antes: temprano.
  callJump() {
    const J = this.jump;
    if (J && J.phase === 'approach') { if (!this.call || this.call.fence !== J.fence) { this.call = { grade: 'good', fence: J.fence, t: this.clk }; this.emit('call', { grade: 'good' }); } return; }
    if (J) return;
    const c = this.cue;
    if (!c) { this.emit('call', { grade: this.noJumpReason() }); return; }
    if (this.call && this.call.fence === c.fence) return;
    const win = 1.05 * (this.mods?.window || 1);
    const grade = c.k <= win ? 'good' : c.k <= 3 ? 'early' : null;
    if (!grade) { this.emit('call', { grade: 'far' }); return; }
    this.call = { grade, fence: c.fence, t: this.clk };
    this.emit('call', { grade });
  }
  setGear(g) { this.gear = Math.max(0, Math.min(GEARS.length - 1, g)); }

  // fence objetivo: la siguiente del recorrido (en entrenamiento, la que tenga adelante)
  target() {
    if (this.training) {
      let best = null, bd = 1e9;
      for (const F of this.fences) {
        const q = F.toLocal(this.x, this.z);
        const cos = Math.cos(this.h) * F.F.f.x + Math.sin(this.h) * F.F.f.z;
        if (q.a < 0 && q.a > -30 && cos > 0.5 && Math.abs(q.b) < F.F.half + 6 && -q.a < bd) { bd = -q.a; best = F; }
      }
      return best;
    }
    return this.fences[this.next] || null;
  }

  update(dt, input) {
    this.clk += dt;
    if (this.finished || this.elim) { this.v *= Math.exp(-dt * 2); this.move(dt); return; }
    if (this.started && !this.finished) this.time += dt;
    // dirección: ayuda opcional que alinea suavemente con la valla siguiente
    let steer = input.steer;
    const T = this.target();
    if (this.assist && T && !this.jump && !this.refuse && this.v > 3) {
      const q = T.toLocal(this.x, this.z);
      const cos = Math.cos(this.h) * T.F.f.x + Math.sin(this.h) * T.F.f.z;
      if (q.a < -2 && q.a > -22 && cos > 0.82 && Math.abs(q.b) < T.F.half + 1.2) {
        // apuntar a un punto de la línea central de la valla, delante de ella
        const back = Math.max(1, -q.a * 0.35);
        const want = Math.atan2(T.F.z - T.F.f.z * back - this.z, T.F.x - T.F.f.x * back - this.x);
        const err = angDiff(this.h, want);
        const k = Math.abs(err) > 0.6 ? 0 : Math.abs(input.steer) > 0.2 ? 0.25 : 1;
        steer = clamp(steer + clamp(err * 2.2, -0.7, 0.7) * k, -1, 1);
      }
    }
    // giro: más cerrado cuanto más lento
    const av = Math.abs(this.v);
    const wMax = (av < 0.4 ? 1.1 : clamp(1.75 - 0.13 * av, 0.78, 1.6)) * (this.mods?.turnK || 1);
    const air = this.jump && this.jump.phase === 'air';
    const wTarget = air ? 0 : steer * wMax;
    // respuesta rápida al girar y más rápida aún al soltar (sin sobregiro)
    const kw = Math.abs(wTarget) < Math.abs(this.w) ? 18 : 11;
    this.w += (wTarget - this.w) * (1 - Math.exp(-dt * kw));
    this.h += this.w * dt;
    this.turn = this.w / Math.max(0.5, wMax);
    if (this.conf && this.started && !this.finished) {
      const tw = Math.abs(this.w);
      // el giro cuenta respecto del máximo de ese caballo (la habilidad Giros no castiga la confianza)
      const rel = tw / Math.max(0.5, wMax);
      if (av > 4 && rel > 0.5 && !air) this.confAdd(-(rel - 0.5) * 13 * dt * (this.mods.conf.turnDrain || 1));
      else if (av > 3 && rel < 0.25 && !this.jump) this.confAdd(0.9 * dt);
    }

    // velocidad
    let vT = this.gearV(this.gear);
    if (this.refuse) vT = 0;
    if (this.jump && this.jump.phase !== 'land') vT = this.v;      // el salto conserva la velocidad
    const acc = vT > this.v ? (this.v < 2 ? 1.6 : 2.2) : (this.refuse ? 7 : 3.2);
    this.v += clamp(vT - this.v, -acc * dt, acc * dt);

    // salto / rehúse
    if (this.refuse) {
      this.refuse.t += dt;
      if (this.refuse.t > 1.8) {
        // queda parado (salvo que el jugador haya pedido otra marcha durante el rehúse) y la misma valla
        // no rehúsa de nuevo hasta que se aleje o pasen 3 s
        if (!(this.gearT > this.clk - this.refuse.t)) this.gear = GEAR_STOP;
        this.refuseCool = { fence: this.refuse.fence, until: this.clk + 3 };
        this.refuse = null; this.emit('gear');
      }
    } else if (this.jump) this.stepJump(dt);
    else this.considerJump(T);

    this.move(dt);
    this.lines();
  }

  considerJump(T) {
    // la batida solo puede ocurrir al cerrar un tranco de galope
    const ph = this.horse.gallopPhase();
    const wrapped = ph < this.lastPhase; this.lastPhase = ph;
    if (!T) return;
    const F = T.F, q = T.toLocal(this.x, this.z);
    // pasada de largo: cruzó el plano del obstáculo por fuera, sin saltarlo, yendo hacia adelante
    // (se arma al estar delante del obstáculo y se dispara al quedar detrás, cerca de él)
    if (this.passT !== T) { this.passT = T; this.passArmed = false; }
    if (q.a < -F.spread / 2 - 0.5 && q.a > -25) this.passArmed = true;
    else if (q.a > F.spread / 2 + 0.3) {
      if (this.passArmed && !this.training && Math.abs(q.b) < F.half + 8 && this.v > 1) { this.passArmed = false; this.doRefuse(T, 'Rehúse', 'runout'); return; }
      this.passArmed = false;
    }
    const fx = Math.cos(this.h), fz = Math.sin(this.h);
    const cos = fx * F.f.x + fz * F.f.z;
    const front = -F.spread / 2;
    const cool = !!this.refuseCool && this.refuseCool.fence === T && (this.clk < this.refuseCool.until || q.a > front - 5);
    if (this.refuseCool && !cool) this.refuseCool = null;
    if (q.a > front || cos <= 0.2) { this.cue = null; return; }
    const dFront = (front - q.a) / Math.max(0.3, cos);
    const sinA = fx * F.l.x + fz * F.l.z;                     // deriva lateral por metro
    const bAt = q.b + sinA * dFront;                           // dónde cruza la línea de la valla
    const inside = Math.abs(bAt) < F.half - 0.3;
    const near = Math.abs(bAt) < F.half + 1.4;
    const ok = inside && cos > 0.77 && this.v > 3.6;
    // contacto sin salto: el caballo frena (rehúse); nunca atraviesa la valla
    if (near && dFront < 2.6 && !ok && this.v > 0.4 && cos > 0.5 && !cool) {
      // al paso no hay rehúse: el caballo se detiene frente a la valla y se avisa que hace falta galope
      if (this.v < 3) { this.slowT = this.clk; if (this.gear !== GEAR_STOP) { this.gear = GEAR_STOP; this.emit('gear'); } this.doRefuse(T, 'Rehúse', 'slow'); return; }
      this.doRefuse(T, cos <= 0.77 ? 'Desvío' : !inside ? 'Fuera del centro' : 'Rehúse', cos <= 0.77 ? 'side' : !inside ? 'off' : 'other'); return;
    }
    if (!ok || dFront > 16) { this.horse.strideAdjust = 1; this.cue = null; return; }
    const airT = 0.84;
    const L = this.v * airT;
    // planos de la valla: barras de arriba (vertical/oxer) o remate del muro
    const planes = F.type === 'wall' ? [{ a: -0.25, top: F.h }, { a: 0.25, top: F.h }] : uniquePlanes(F.rails);
    const plan = this.horse.planJump(L, planes);
    const ideal = plan.d;
    const dNow = dFront - this.v * TAKEOFF_CLIP;               // batida si arranca el salto en este tranco
    const stride = this.v * this.horse.gallopCycle();          // metros por tranco
    // ajuste de los últimos trancos (como un caballo experimentado): alarga o acorta para llegar justo
    const toStart = dNow - ideal;                              // metros hasta el inicio ideal del salto
    if (toStart > 0.3 && toStart < 14) {
      const left = (1 - ph) * stride;                          // lo que falta del tranco actual
      const n = Math.max(0, Math.round((toStart - left) / stride));
      const r = toStart / Math.max(0.3, (1 - ph) + n) / stride;
      const lim = this.assist ? 0.18 : 0.12;
      this.horse.strideAdjust = 1 / clamp(r, 1 - lim, 1 + lim);
    } else this.horse.strideAdjust = 1;
    this.cue = { fence: T, k: (dNow - ideal) / Math.max(0.5, stride) + 0.5 };   // trancos hasta la batida
    if (!(wrapped && dNow - ideal < stride * 0.5) && !(dNow - ideal < -stride * 0.5)) return;
    this.cue = null;
    // corrección asistida: el clip se acelera o frena un poco para acercarse al punto ideal
    const e = dNow - ideal, corr = this.assist ? 0.75 : 0.5;
    const eRes = e - clamp(e, -corr, corr);
    const takeoffDist = ideal + eRes;
    // demasiado encima de la valla para despegar: el caballo rehúsa
    if (takeoffDist < 0.45 || plan.need(takeoffDist) > 1.4) { this.log.push({ deep: F.n, e: +e.toFixed(2), takeoffDist: +takeoffDist.toFixed(2), need: +plan.need(takeoffDist).toFixed(2), bAt: +bAt.toFixed(2), cos: +cos.toFixed(2) }); this.doRefuse(T, 'Rehúse', 'deep'); return; }
    const toTakeoff = Math.max(0.22, (dFront - takeoffDist) / this.v);
    const quality = Math.abs(eRes) < 0.3 ? 'perfect' : eRes > 0 ? 'long' : 'deep';
    // con poca confianza el caballo puede negarse (más si la batida no es buena); el coraje lo compensa
    if (this.conf) {
      const r = this.confRatio(), bold = this.mods.conf.bold ?? 0.5;
      const p = r < 0.4 ? (0.4 - r) / 0.4 * (1 - 0.6 * bold) * (quality === 'perfect' ? 0.55 : 0.9) : 0;
      if (p > 0 && Math.random() < p) { this.doRefuse(T, 'Rehúse', 'confidence'); return; }
    }
    // altura: la que pide el punto ideal, más un margen que depende de la velocidad y el ángulo
    let margin = 0.09;
    if (this.v > 6.6) margin -= 0.11 * (this.v - 6.6);          // a galope largo el salto se aplana
    if (this.v < 4.8) margin -= 0.16 * (4.8 - this.v);
    if (cos < 0.95) margin -= 0.6 * (0.95 - cos);
    margin -= 0.1 * Math.abs(eRes);                              // batida fuera de distancia
    if (this.mods) {
      const M = this.mods;
      margin += M.apexBonus || 0;
      // por encima de lo que el caballo salta con comodidad, el margen cae rápido
      if (M.salto) margin -= Math.max(0, F.h - M.salto) * 0.9;
      if (this.conf) margin -= 0.12 * Math.max(0, 0.5 - this.confRatio()) * 2;
    }
    margin += (Math.random() - 0.5) * 0.04;
    const apex = Math.min(1.6, plan.apex + margin);
    this.horse.strideAdjust = 1;
    this.jump = { phase: 'approach', fence: T, toTakeoff, airT, apex, t: 0, quality, eRes };
    this.log.push({ n: F.n, q: quality, e: +e.toFixed(2), eRes: +eRes.toFixed(2), ideal: +ideal.toFixed(2), need: +plan.apex.toFixed(2), apex: +apex.toFixed(2), v: +this.v.toFixed(2), cos: +cos.toFixed(3), bAt: +bAt.toFixed(2) });
    this.stats.jumps++; this.stats[quality]++;
    this.emit('approach', { quality, fence: F.n });
  }

  stepJump(dt) {
    const J = this.jump, F = J.fence;
    if (J.phase === 'approach') {
      J.toTakeoff -= dt;
      if (J.toTakeoff <= 0) {
        // el pedido del jugador define la altura: en el último tranco, salto amplio; temprano, justo; sin pedir, bajo
        const c = this.call && this.call.fence === F ? this.call.grade : 'none';
        J.grade = c; J.apex = Math.min(1.6, J.apex + (c === 'good' ? 0.05 : c === 'early' ? -0.015 : (this.assist ? -0.03 : -0.06)));
        J.phase = 'air'; J.t = 0; this.emit('takeoff', { fence: F.F.n, grade: c });
      }
    } else if (J.phase === 'air') {
      J.t += dt;
      const hit = F.checkHooves(this.horse.hooves(), { x: Math.cos(this.h), z: Math.sin(this.h) });
      if (hit && !F.faulted) { F.faulted = true; this.confAdd(-12); if (!this.training) { this.faults += 4; this.knocks++; } this.emit('knock', { fence: F.F.n }); const L = this.log[this.log.length - 1]; if (L) { L.hitK = +(J.t / J.airT).toFixed(2); L.hooves = this.horse.hooves().map((p) => { const q = F.toLocal(p.x, p.z); return [+q.a.toFixed(2), +p.y.toFixed(2)]; }); } }
      if (J.t >= J.airT) {
        J.phase = 'land'; J.t = 0; this.v *= 0.93;
        // solo cuenta si el caballo pasó de verdad por encima: del otro lado del plano trasero y entre los parantes
        const q = F.toLocal(this.x, this.z), crossed = q.a > F.F.spread / 2 - 0.2 && Math.abs(q.b) < F.F.half + 0.5;
        this.emit('land', { fence: F.F.n, clear: !F.faulted && crossed, grade: J.grade, quality: J.quality });
        if (!crossed) { this.log.push({ notCrossed: F.F.n, a: +q.a.toFixed(2), b: +q.b.toFixed(2) }); return; }
        if (!this.training && this.fences[this.next] === F) { this.next++; }
        if (!F.faulted) { this.emit('clear', { fence: F.F.n }); this.confAdd(J.quality === 'perfect' ? 8 : 4); }
        if (J.quality !== 'perfect') this.confAdd(-5);
      }
    } else {
      J.t += dt;
      if (J.t > this.horse.landDuration()) this.jump = null;
    }
  }

  // por qué no hay salto disponible ahora: sin obstáculo adelante, lejos, lento o desalineado
  noJumpReason() {
    const T = this.target();
    if (!T) return 'none';
    const q = T.toLocal(this.x, this.z), cos = Math.cos(this.h) * T.F.f.x + Math.sin(this.h) * T.F.f.z;
    const d = -q.a;
    if (d < 0 || d > 40 || cos < 0.3) return 'none';
    if (this.v < 3.6) return 'slow';
    if (cos < 0.77 || Math.abs(q.b) > T.F.half - 0.3) return 'align';
    return 'far';
  }
  // estado del indicador de salto para la interfaz (sale de la lógica, no del color)
  jumpUI() {
    const J = this.jump;
    if (J) return J.phase === 'approach' ? (this.call && this.call.fence === J.fence ? 'requested' : 'ready') : J.phase === 'air' ? 'air' : 'land';
    const c = this.cue;
    if (!c) return 'none';
    if (this.call && this.call.fence === c.fence) return 'requested';
    return c.k <= 1.05 * (this.mods?.window || 1) ? 'ready' : 'prep';
  }

  doRefuse(T, kind, why = 'other') {
    this.refuse = { t: 0, fence: T };
    // tras un rehúse la confianza cae, pero no a cero: el jinete la reconstruye tomando distancia
    if (this.conf) this.conf.v = Math.min(this.conf.v, Math.max(this.conf.max * 0.32, this.conf.v - 22 * (this.mods.conf.hitK || 1)));
    this.jump = null; this.cue = null; this.call = null; this.lastRefuse = why;
    if (this.training) { this.emit('refuse', { kind, why, fence: T.F.n, faults: 0 }); return; }
    this.log.push({ refuse: kind, n: T.F.n, v: +this.v.toFixed(2), x: +this.x.toFixed(1), z: +this.z.toFixed(1) });
    this.refusals++;
    if (this.refusals >= 2) { this.elim = 'Segundo rehúse'; this.emit('elim', { reason: this.elim }); }
    else { this.faults += 4; this.emit('refuse', { kind, why, fence: T.F.n, faults: 4 }); }
  }

  move(dt) {
    const fx = Math.cos(this.h), fz = Math.sin(this.h);
    let nx = this.x + fx * this.v * dt, nz = this.z + fz * this.v * dt;
    // vallas sólidas en tierra: no se atraviesan (salvo la que se está saltando)
    const skip = this.jump ? this.jump.fence : null;
    for (const F of this.fences) {
      if (F === skip) continue;
      const q = F.toLocal(nx, nz), D = F.F;
      const ha = D.spread / 2 + 1.5, hb = D.half + 0.9;
      if (Math.abs(q.a) < ha && Math.abs(q.b) < hb) {
        // empujar hacia afuera por el lado más cercano; frenar solo si avanza contra la valla
        const pa = ha - Math.abs(q.a), pb = hb - Math.abs(q.b);
        let nxv, nzv;
        if (pa < pb) { const s = Math.sign(q.a) || -1; nxv = D.f.x * s; nzv = D.f.z * s; nx += nxv * pa; nz += nzv * pa; }
        else { const s = Math.sign(q.b) || 1; nxv = D.l.x * s; nzv = D.l.z * s; nx += nxv * pb; nz += nzv * pb; }
        const dot = (fx * nxv + fz * nzv) * Math.sign(this.v || 1);
        // de frente: se detiene (y se avisa); rozando: se desliza por el costado sin perder el galope
        if (-dot > 0.55) { this.bump('valla', F); this.v *= 1 - 0.25 * (-dot); }
      }
    }
    // cerco de la pista
    const mx = ARENA.w / 2 - 1.4, mz = ARENA.h / 2 - 1.4;
    if (Math.abs(nx) > mx || Math.abs(nz) > mz) {
      const n = Math.abs(nx) > mx ? { x: -Math.sign(nx), z: 0 } : { x: 0, z: -Math.sign(nz) };
      const dot = (fx * n.x + fz * n.z) * Math.sign(this.v || 1);
      this.v *= Math.exp(-dt * 6 * Math.max(0, -dot));
      if (-dot > 0.55) this.bump('cerco');
      nx = clamp(nx, -mx, mx); nz = clamp(nz, -mz, mz);
    }
    this.px = this.x; this.pz = this.z; this.x = nx; this.z = nz;
  }

  // choque de frente contra una valla o el cerco: el caballo se detiene y se avisa
  bump(what, F) {
    if (Math.abs(this.v) > 1.2 && this.clk - this.blockT > 1.5) {
      this.blockT = this.clk; this.gear = GEAR_STOP;
      const wrong = what === 'valla' && !this.training && F !== this.fences[this.next];
      const cool = this.refuseCool && this.refuseCool.fence === F && this.clk < this.refuseCool.until;
      this.confAdd(-10);
      if (what === 'valla' && !wrong && !this.training && !this.refuse && !cool && this.v > 0) { this.emit('gear'); this.doRefuse(F, 'Rehúse', 'contact'); return; }
      this.emit('block', { what, wrong, fence: F ? F.F.n : null, next: this.fences[this.next] ? this.fences[this.next].F.n : null });
      this.emit('gear');
    }
  }

  // líneas de salida y llegada
  lines() {
    const cross = (L, wide) => {
      if (!L) return false;
      const a = L.dir * Math.PI / 180, fx = Math.cos(a), fz = Math.sin(a);
      const s0 = (this.px - L.x) * fx + (this.pz - L.z) * fz, s1 = (this.x - L.x) * fx + (this.z - L.z) * fz;
      const lat = -(this.x - L.x) * fz + (this.z - L.z) * fx;
      return s0 < 0 && s1 >= 0 && Math.abs(lat) < (wide ? L.half + 25 : L.half);
    };
    if (!this.started && (cross(this.C.start, true) || this.next > 0)) { this.started = true; this.emit('start'); }
    if (this.started && !this.finished && this.next >= this.fences.length && cross(this.C.finish)) {
      this.finished = true;
      const over = this.C.ta ? Math.max(0, Math.ceil(this.time - this.C.ta)) : 0;
      this.timeFaults = over; this.faults += over;
      this.emit('finish', { time: this.time, faults: this.faults, timeFaults: over });
    }
  }

  // estado para la animación del caballo
  animState() {
    const J = this.jump;
    let jump = null;
    if (J) jump = J.phase === 'approach' ? { phase: 'approach', toTakeoff: J.toTakeoff } : J.phase === 'air' ? { phase: 'air', t: J.t, airT: J.airT, apex: J.apex } : { phase: 'land', t: J.t };
    return { v: this.v, turn: this.turn || 0, jump, stopping: !!this.refuse && this.refuse.t < 1.6 };
  }
}

function uniquePlanes(rails) {
  const m = new Map();
  for (const R of rails) { const k = R.a.toFixed(2); m.set(k, Math.max(m.get(k) || 0, R.y + 0.05)); }
  return [...m].map(([a, top]) => ({ a: +a, top }));
}
export function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
export function angDiff(a, b) { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
