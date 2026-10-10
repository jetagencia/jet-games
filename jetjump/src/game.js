// JETJump — partida: une simulación, mundo 3D, caballo, input, HUD y audio.
import * as THREE from 'three';
import { Ride, GAIT_NAMES, strideFreq, clamp } from './sim.js';
import { HorseModel, HorseGLB, loadHorseAsset } from './horse.js';
import { CAM_MODES } from './scene.js';
import { FENCE_NAMES } from './courses.js';

const $ = (id) => document.getElementById(id);

export class Input {
  constructor(settings) {
    this.settings = settings;
    this.steer = 0; this.stickPace = 0; this.btnPace = 0; this.jumpPulse = false; this.keys = {};
    this.stickActive = false; this.x0 = 0; this.y0 = 0; this.stickId = null;
    const zone = $('stick-zone');
    const onDown = (e) => { if (this.stickId != null) return; this.stickId = e.pointerId; this.x0 = e.clientX; this.y0 = e.clientY; this.stickActive = true; zone.setPointerCapture(e.pointerId); this.showStick(e.clientX, e.clientY, true); };
    const onMove = (e) => { if (e.pointerId !== this.stickId) return; const dx = (e.clientX - this.x0) / 70, dy = (this.y0 - e.clientY) / 90; const s = clamp(dx, -1, 1); this.steer = Math.sign(s) * Math.pow(Math.abs(s), 1.4) * (settings.invertStick ? -1 : 1); this.stickPace = clamp(dy, -1, 1); this.showStick(e.clientX, e.clientY, true); };
    const onUp = (e) => { if (e.pointerId !== this.stickId) return; this.stickId = null; this.stickActive = false; this.steer = 0; this.stickPace = 0; this.showStick(0, 0, false); };
    zone.addEventListener('pointerdown', onDown); zone.addEventListener('pointermove', onMove); zone.addEventListener('pointerup', onUp); zone.addEventListener('pointercancel', onUp);
    const hold = (id, v) => { const el = $(id); const dn = (e) => { e.preventDefault(); this.btnPace = v; el.classList.add('on'); }; const up = () => { if (this.btnPace === v) this.btnPace = 0; el.classList.remove('on'); }; el.addEventListener('pointerdown', dn); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up); };
    hold('pace-up', 1); hold('pace-down', -1);
    $('btn-jump').addEventListener('pointerdown', (e) => { e.preventDefault(); this.jumpPulse = true; $('btn-jump').classList.add('pressed'); setTimeout(() => $('btn-jump').classList.remove('pressed'), 120); });
    window.addEventListener('keydown', (e) => { if (e.repeat) return; this.keys[e.code] = true; if (e.code === 'Space' || e.code === 'Enter') { this.jumpPulse = true; e.preventDefault(); } });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    this.stickEl = $('stick');
  }
  showStick(x, y, on) {
    const el = this.stickEl; if (!el) return;
    el.style.opacity = on ? '1' : '0';
    if (on) { el.style.left = this.x0 + 'px'; el.style.top = this.y0 + 'px'; const dx = clamp(x - this.x0, -60, 60), dy = clamp(y - this.y0, -60, 60); el.querySelector('.knob').style.transform = `translate(${dx}px, ${dy}px)`; }
  }
  read() {
    const k = this.keys;
    let steer = this.steer, pace = this.btnPace || this.stickPace;
    if (k.ArrowLeft || k.KeyA) steer = -1; if (k.ArrowRight || k.KeyD) steer = 1;
    if (k.ArrowUp || k.KeyW) pace = 1; if (k.ArrowDown || k.KeyS) pace = -1;
    const jump = this.jumpPulse; this.jumpPulse = false;
    return { steer, pace, jump };
  }
}

export class Game {
  constructor({ world, audio, settings, music }) {
    this.world = world; this.audio = audio; this.settings = settings; this.music = music;
    this.buffer = []; this.replay = null; this.replayAt = 0;
    this.input = new Input(settings);
    this.horse = null; this.horseKey = '';
    this.running = false; this.paused = false;
    this.w = [0, 0, 0, 0]; this.jumpW = 0; this.refuseW = 0;
    this.ui = {
      fence: $('hud-fence'), fenceType: $('hud-fence-type'), dist: $('hud-dist'), strides: $('hud-strides'), time: $('hud-time'), ta: $('hud-ta'), faults: $('hud-faults'),
      speed: $('hud-speed'), gait: $('hud-gait'), toast: $('hud-toast'), meter: $('stride-meter'), minimap: $('minimap'), countdown: $('hud-countdown'), timebar: $('hud-timebar'), jumpBtn: $('btn-jump'), stamina: $('hud-stamina'),
    };
    this.meterCtx = this.ui.meter.getContext('2d'); this.mapCtx = this.ui.minimap.getContext('2d');
    this.toastT = 0; this.hudT = 0; this.mapT = 0;
    this.loop = this.loop.bind(this);
    $('btn-cam').addEventListener('click', () => this.cycleCam());
    window.addEventListener('resize', () => this.world.resize());
  }

  cycleCam() { this.world.camMode = CAM_MODES[(CAM_MODES.indexOf(this.world.camMode) + 1) % CAM_MODES.length]; this.audio.click(); this.toast(`Cámara: ${this.camName()}`, 1.2); }
  camName() { return ({ chase: 'seguimiento', far: 'lejana', onboard: 'a bordo', tv: 'TV', side: 'lateral', drone: 'dron', fence: 'valla' })[this.world.camMode] || this.world.camMode; }

  async ensureHorse(look) {
    const key = JSON.stringify(look) + (this.settings.horseModel || 'auto');
    if (this.horse && this.horseKey === key) return this.horse;
    if (this.horse) { this.world.scene.remove(this.horse.root); }
    let model = null;
    if ((this.settings.horseModel || 'auto') !== 'procedural') {
      const gltf = await loadHorseAsset(new URL('../assets/models/horse.glb', import.meta.url).href);
      if (gltf) model = new HorseGLB(gltf, look);
    }
    this.horse = model || new HorseModel(look); this.horseKey = key;
    this.world.scene.add(this.horse.root);
    return this.horse;
  }

  // cfg: {course, horseStats, horseLook, rider, mode, fitness, assist, title, onEnd, countdown}
  async start(cfg) {
    this.cfg = cfg;
    await this.world.assets;
    this.world.setCourse(cfg.course);
    await this.ensureHorse(cfg.horseLook);
    this.buffer.length = 0; this.replay = null; this.replayAt = 0; this.fenceFault = false;
    $('hud-replay').style.display = 'none';
    this.ride = new Ride({ course: cfg.course, horse: cfg.horseStats, rider: cfg.rider, mode: cfg.mode, assist: cfg.assist, fitness: cfg.fitness ?? 1 });
    if (cfg.countdown != null) this.ride.countdown = cfg.countdown;
    this.world.camMode = this.settings.cam || 'chase';
    const st = cfg.course.start;
    this.world.camPos.set(this.ride.x - Math.cos(st.th) * 8, 3, this.ride.z - Math.sin(st.th) * 8 + 2);
    this.world.camLook.set(this.ride.x, 1, this.ride.z);
    this.world.cheerLevel = 0;
    this.endAt = 0; this.ended = false; this.running = true; this.paused = false; this.last = performance.now();
    this.w = [0, 0, 0, 0]; this.jumpW = 0; this.refuseW = 0; this.lastSpotMsg = 0;
    this.ui.ta.textContent = cfg.course.ta && cfg.mode !== 'train' ? `TA ${cfg.course.ta}s` : '';
    $('hud-time').style.display = cfg.mode === 'train' ? 'none' : '';
    this.ui.faults.textContent = '0';
    $('hud-title').textContent = cfg.title || '';
    this.toast(cfg.mode === 'train' ? 'Entrenamiento libre: saltá en cualquier orden' : 'Campana: tenés 45 s para cruzar la salida', 3.5);
    if (cfg.mode !== 'train') this.audio.bell();
    this.audio.ambient(true, cfg.course.indoor);
    if (this.music) this.music.stop();
    if (cfg.mode !== 'train' && cfg.riderName) setTimeout(() => this.running && this.audio.say(`En pista, ${cfg.riderName}, con ${cfg.horseName || 'su caballo'}.`), 1200);
    this.pulseJump(false);
    document.body.classList.add('playing');
    requestAnimationFrame(this.loop);
  }

  stop() { this.running = false; if (this.replay) this.endReplay(); this.audio.ambient(false); this.audio.duck(false); document.body.classList.remove('playing'); document.body.classList.remove('replaying'); }
  pause(v) { this.paused = v; if (!v) this.last = performance.now(); }

  toast(msg, dur = 1.8, cls = '') {
    this.ui.toast.textContent = msg; this.ui.toast.className = 'toast show ' + cls; this.toastT = dur;
  }
  pulseJump(on) { this.ui.jumpBtn.classList.toggle('ready', on); }
  haptic(ms) { if (this.settings.haptics && navigator.vibrate) navigator.vibrate(ms); }

  loop(now) {
    if (!this.running) return;
    requestAnimationFrame(this.loop);
    let dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000)); this.last = now;
    if (this.paused) { this.world.render(); return; }
    if (this.replay) { this.stepReplay(dt); return; }
    if (this.replayAt && now >= this.replayAt) { this.replayAt = 0; this.startReplay(); return; }
    const ride = this.ride;
    const inp = this.input.read();
    // sub-pasos para estabilidad
    const steps = Math.max(1, Math.ceil(dt / (1 / 60)));
    const sdt = dt / steps;
    for (let i = 0; i < steps; i++) {
      ride.step(sdt, { steer: inp.steer, pace: inp.pace, jump: i === 0 && inp.jump });
      this.handleEvents(ride.events);
    }
    const pose = this.updateHorsePose(dt);
    this.record(now, pose);
    const eye = this.world.camMode === 'onboard' ? this.horse.rider.eyeCam.getWorldPosition(new THREE.Vector3()) : null;
    const apn = ride.approach();
    this.world.update(dt, { x: ride.x, y: ride.y - 1.12 + 1.1, z: ride.z, heading: ride.heading, v: ride.v, jumpW: this.jumpW, eye, nextE: apn ? apn.E : null });
    this.audio.update(dt, ride.v);
    this.updateHUD(dt);
    this.world.render();
    if (this.endAt > 0 && now >= this.endAt && !this.ended) { this.ended = true; this.finish(); }
  }

  finish() {
    const r = this.ride;
    const res = { faults: r.faults, jumpFaults: r.jumpFaults, timeFaults: r.timeFaults, time: r.time, elim: r.elim, scoreTime: r.scoreTime, stats: { ...r.stats, refusals: r.disob }, downEls: [...r.downEls] };
    this.stop();
    this.cfg.onEnd && this.cfg.onEnd(res);
  }

  handleEvents(events) {
    const r = this.ride, A = this.audio, W = this.world;
    for (const e of events) {
      switch (e.type) {
        case 'hoof': {
          const p = this.horse.hoofWorld(e.leg, new THREE.Vector3());
          A.hoof(e.gait, e.v); if (e.gait >= 2) W.dust(p, Math.min(1, e.v / 8));
          break;
        }
        case 'takeoff': {
          A.hup(); A.creak();
          this.lastSpot = e; this.fenceFault = false; this.replayE = r.els[e.el];
          break;
        }
        case 'stride': { if (e.gait >= 3) { A.strideBreath(e.v); if (Math.random() < 0.3) A.jingle(); } break; }
        case 'land': {
          A.thud(0.8); A.creak(); W.dust(new THREE.Vector3(r.x, 0, r.z), 1.3); this.haptic(20);
          if (this.replayE && this.wantReplay(this.replayE)) this.replayAt = performance.now() + 650;
          if (this.cfg.mode === 'train' || this.settings.assist) {
            const s = this.lastSpot;
            if (s) {
              const msg = s.spot === 'perfect' ? '✓ Distancia perfecta' : s.spot === 'long' ? `Largo (+${(s.d - s.ideal).toFixed(1)} m): acortá el tranco` : `Profundo (${(s.d - s.ideal).toFixed(1)} m): más impulso`;
              this.toast(msg, 1.6, s.spot === 'perfect' ? 'good' : 'warn');
            }
          }
          break;
        }
        case 'knock': {
          A.knock(); A.ooh(); W.knockRail(e.el, e.plane); W.shake = 0.25; this.haptic([30, 40, 30]); this.fenceFault = true;
          this.toast(`Barra ${r.course.elements[e.el].label} · 4 faltas`, 2, 'bad');
          break;
        }
        case 'rub': A.rub(); break;
        case 'water': { A.splash(); W.splash(new THREE.Vector3(r.x, 0, r.z)); this.toast('Pisó el agua · 4 faltas', 2, 'bad'); this.fenceFault = true; break; }
        case 'refusal': {
          A.snort(); A.ooh(); W.shake = 0.3; this.haptic(60);
          this.toast(e.n >= 2 ? `${e.kind}: segunda desobediencia` : `${e.kind} · 4 faltas`, 2.5, 'bad');
          if (e.n < 2) A.say(e.kind === 'Escape' ? 'Escape. Cuatro faltas.' : 'Rehúse. Cuatro faltas.');
          break;
        }
        case 'halt': A.snort(); break;
        case 'fall': { this.toast('Caída', 3, 'bad'); W.shake = 0.6; break; }
        case 'start': this.toast('¡En pista!', 1.2, 'good'); break;
        case 'cleared': {
          if (!e.down && this.cfg.mode !== 'train') A.cheer(0.25);
          break;
        }
        case 'finish': {
          const clear = r.faults === 0;
          A.cheer(clear ? 1 : r.faults <= 4 ? 0.5 : 0.25); W.cheer(clear ? 1 : 0.4); A.fanfare(clear);
          this.toast(clear ? '¡RECORRIDO LIMPIO!' : `Llegada · ${r.faults} faltas`, 3, clear ? 'good' : '');
          const tt = r.time.toFixed(2).replace('.', ' con ');
          A.say(clear ? `Sin faltas. ${tt} segundos.` : `${r.faults} faltas. ${tt} segundos.`, { force: true });
          this.endAt = performance.now() + 3200;
          break;
        }
        case 'elim': { this.toast(`Eliminado: ${e.reason}`, 3, 'bad'); A.fanfare(false); A.say(`Eliminado. ${e.reason}.`, { force: true }); this.endAt = performance.now() + 3200; break; }
      }
    }
  }

  updateHorsePose(dt) {
    const r = this.ride;
    const tgt = [0, 0, 0, 0]; if (r.gait >= 1) tgt[r.gait - 1] = 1;
    for (let i = 0; i < 4; i++) this.w[i] += (tgt[i] - this.w[i]) * Math.min(1, dt * 7);
    const jt = r.jump ? 1 : 0; this.jumpW += (jt - this.jumpW) * Math.min(1, dt * 16);
    this.refuseW += ((r.refuse ? 1 : 0) - this.refuseW) * Math.min(1, dt * 8);
    const ap = r.approach();
    const two = r.gait >= 3 ? 0.3 + (ap && ap.d < 12 ? 0.45 : 0) : 0;
    this.horse.root.position.set(r.x, 0, r.z);
    this.horse.root.rotation.y = -r.heading;
    const pose = {
      phase: r.phase, w: this.w.slice(), L: r.strideLen(), lead: r.lead, jumpT: r.jump ? r.jump.t / r.jump.T : -1, jumpW: this.jumpW,
      pitch: r.pitch, roll: r.roll, y: r.y, v: r.v, omega: r.omega, refuse: this.refuseW, approachTwo: two, x: r.x, z: r.z, heading: r.heading,
    };
    this.horse.update(pose, dt);
    return pose;
  }

  // ---- repetición en cámara lenta
  record(now, pose) {
    this.buffer.push({ t: now, pose, rails: this.world.railSnapshot() });
    if (this.buffer.length > 480) this.buffer.splice(0, this.buffer.length - 480);
  }
  wantReplay(E) {
    const mode = this.settings.replays || 'faults';
    if (mode === 'off' || this.cfg.mode === 'train' || this.replay) return false;
    if (mode === 'all') return true;
    return this.fenceFault;
  }
  startReplay() {
    const E = this.replayE; const now = performance.now();
    const frames = this.buffer.filter(f => f.t >= now - 3400);
    if (frames.length < 10) return;
    const P = new THREE.Vector3(E.x + E.n[0] * E.spread / 2, 0, E.z + E.n[1] * E.spread / 2);
    const az = Math.atan2(frames[0].pose.z - E.z, frames[0].pose.x - E.x) + 0.9;
    this.replay = { frames, t0: frames[0].t, clock: 0, speed: 0.33, wall: performance.now(), focus: P, az, live: this.world.railSnapshot(), prevCam: this.world.camMode };
    this.audio.whoosh(); this.audio.duck(true); if (this.music) this.music.play('replay');
    $('hud-replay').style.display = ''; document.body.classList.add('replaying');
  }
  stepReplay(dt) {
    const R = this.replay;
    R.clock = (performance.now() - R.wall) * R.speed;
    const tt = R.t0 + R.clock;
    let i = R.idx || 0; while (i < R.frames.length - 1 && R.frames[i + 1].t <= tt) i++; R.idx = i;
    const fr = R.frames[i];
    const p = fr.pose;
    this.horse.root.position.set(p.x, 0, p.z); this.horse.root.rotation.y = -p.heading;
    this.horse.update(p, dt * R.speed);
    this.world.railRestore(fr.rails);
    const T = R.clock / 1000;
    this.world.update(dt, { x: p.x, y: p.y - 1.12 + 1.1, z: p.z, heading: p.heading, v: p.v, jumpW: p.jumpW, replay: true, focus: R.focus, replayT: T, replayA: R.az });
    this.world.render();
    if (i >= R.frames.length - 1) this.endReplay();
  }
  endReplay() {
    const R = this.replay; if (!R) return;
    this.world.railRestore(R.live);
    this.replay = null; this.fenceFault = false;
    this.audio.duck(false); if (this.music) this.music.stop(0.6);
    $('hud-replay').style.display = 'none'; document.body.classList.remove('replaying');
    // restituir la pose en vivo y la cámara
    this.updateHorsePose(0.016);
    this.world.camMode = R.prevCam; this.last = performance.now();
  }

  updateHUD(dt) {
    const r = this.ride, U = this.ui;
    if (this.toastT > 0) { this.toastT -= dt; if (this.toastT <= 0) U.toast.classList.remove('show'); }
    this.hudT -= dt;
    const ap = r.approach();
    this.drawMeter(ap);
    // ventana de salto: resaltar el botón
    let ready = false;
    if (ap && r.gait >= 2 && !r.jump) { const dN = ap.d - ap.L * r.strideScale; ready = ap.d > ap.ideal && dN < ap.ideal + ap.L * 0.5 && ap.cosA > 0.6; }
    this.pulseJump(ready);
    if (this.hudT > 0) return;
    this.hudT = 0.1;
    if (ap) {
      U.fence.textContent = ap.E.label; U.fenceType.textContent = FENCE_NAMES[ap.E.type] + ` ${ap.E.h.toFixed(2)} m`;
      U.dist.textContent = `${Math.max(0, ap.d).toFixed(0)} m`;
      const n = Math.round(ap.strides); U.strides.textContent = ap.d < 40 && n >= 0 ? (n === 0 ? '¡ahora!' : `${n} tranco${n === 1 ? '' : 's'}`) : '';
    } else if (r.next >= r.els.length && !r.finished) { U.fence.textContent = '🏁'; U.fenceType.textContent = 'A la llegada'; U.dist.textContent = ''; U.strides.textContent = ''; }
    else { U.fence.textContent = '–'; U.fenceType.textContent = ''; U.dist.textContent = ''; U.strides.textContent = ''; }
    U.time.textContent = r.time.toFixed(1);
    const ta = r.course.ta;
    if (ta) { U.timebar.style.width = `${clamp(r.time / ta * 100, 0, 100)}%`; U.timebar.className = r.time > ta ? 'over' : r.time > ta * 0.85 ? 'warn' : ''; }
    U.faults.textContent = this.cfg.mode === 'C' ? `${r.scoreTime.toFixed(1)}s` : `${r.faults}`;
    U.speed.textContent = `${Math.round(r.v * 60)}`; U.gait.textContent = GAIT_NAMES[r.gait] + (r.gait >= 3 ? (r.lead > 0 ? ' · pie der.' : ' · pie izq.') : '');
    U.stamina.style.width = `${Math.round(r.stamina * 100)}%`;
    if (!r.started && r.countdown > 0) { const left = Math.max(0, r.countdown - r.clock); U.countdown.textContent = `Salida en ${left.toFixed(0)}s`; U.countdown.style.display = ''; } else U.countdown.style.display = 'none';
    this.mapT -= 0.1; if (this.mapT <= 0) { this.mapT = 0.15; this.drawMap(); }
  }

  drawMeter(ap) {
    const c = this.meterCtx, W = this.ui.meter.width, H = this.ui.meter.height;
    c.clearRect(0, 0, W, H);
    const show = ap && ap.d < 30 && ap.d > 0 && this.ride.gait >= 2 && !this.ride.jump;
    this.ui.meter.style.opacity = show ? '1' : '0.25';
    const cx = W / 2;
    // zonas
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, H * 0.35, W, H * 0.3);
    c.fillStyle = 'rgba(255,196,0,0.35)'; c.fillRect(cx - W * 0.3, H * 0.35, W * 0.6, H * 0.3);
    c.fillStyle = 'rgba(80,220,120,0.6)'; c.fillRect(cx - W * 0.12, H * 0.3, W * 0.24, H * 0.4);
    if (!show) return;
    let frac = ((ap.d - ap.ideal) / ap.L) % 1; if (frac < 0) frac += 1;
    const m = frac > 0.5 ? frac - 1 : frac; // -0.5..0.5 ; positivo = llega largo
    const x = cx + m * W * 0.9;
    c.fillStyle = Math.abs(m) < 0.12 ? '#6ef0a0' : Math.abs(m) < 0.3 ? '#ffd36b' : '#ff6b6b';
    c.beginPath(); c.moveTo(x, H * 0.1); c.lineTo(x + 7, H * 0.3); c.lineTo(x - 7, H * 0.3); c.closePath(); c.fill();
    c.fillRect(x - 1.5, H * 0.3, 3, H * 0.6);
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = '10px JetBrains Mono, monospace'; c.textAlign = 'center';
    c.fillText('corto', W * 0.12, H - 2); c.fillText('largo', W * 0.88, H - 2);
  }

  drawMap() {
    const c = this.mapCtx, W = this.ui.minimap.width, H = this.ui.minimap.height, r = this.ride, A = r.course.arena;
    const S = Math.min((W - 8) / A.w, (H - 8) / A.h);
    const X = (x) => W / 2 + x * S, Z = (z) => H / 2 + z * S;
    c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgba(20,32,74,0.55)'; c.fillRect(X(-A.w / 2), Z(-A.h / 2), A.w * S, A.h * S);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1; c.strokeRect(X(-A.w / 2), Z(-A.h / 2), A.w * S, A.h * S);
    for (const E of r.els) {
      const isNext = E.idx === r.next, done = E.idx < r.next;
      c.strokeStyle = isNext ? '#ffd36b' : done ? 'rgba(255,255,255,0.3)' : '#f3ead6'; c.lineWidth = isNext ? 3 : 2;
      c.beginPath(); c.moveTo(X(E.x - E.l[0] * E.half), Z(E.z - E.l[1] * E.half)); c.lineTo(X(E.x + E.l[0] * E.half), Z(E.z + E.l[1] * E.half)); c.stroke();
      if (E.comboPos === 0) { c.fillStyle = isNext ? '#ffd36b' : 'rgba(255,255,255,0.7)'; c.font = 'bold 9px Poppins, sans-serif'; c.textAlign = 'center'; c.fillText(E.num, X(E.x - E.n[0] * 2.2), Z(E.z - E.n[1] * 2.2) + 3); }
    }
    for (const [L, col] of [[r.course.start, '#6ef0a0'], [r.course.finish, '#ff6b6b']]) {
      c.strokeStyle = col; c.lineWidth = 2; c.beginPath();
      c.moveTo(X(L.x + Math.sin(L.th) * L.half), Z(L.z - Math.cos(L.th) * L.half)); c.lineTo(X(L.x - Math.sin(L.th) * L.half), Z(L.z + Math.cos(L.th) * L.half)); c.stroke();
    }
    // caballo
    c.save(); c.translate(X(r.x), Z(r.z)); c.rotate(r.heading);
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(7, 0); c.lineTo(-5, 4); c.lineTo(-3, 0); c.lineTo(-5, -4); c.closePath(); c.fill(); c.restore();
  }
}
