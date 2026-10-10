// JETJump — interfaz: menú, carrera (establo), modos, pre-recorrido, resultados.
import { World } from './scene.js';
import { GameAudio } from './audio.js';
import { Music } from './music.js';
import { CAM_MODES, CAM_NAMES } from './scene.js';
import { Game } from './game.js';
import { buildCourse, LAYOUTS, FENCE_NAMES } from './courses.js';
import { mulberry32, clamp } from './sim.js';
import * as D from './data.js';
import { COATS } from './horse.js';
import { loadProfile, saveProfile, newProfile, deleteProfile, loadSettings, saveSettings } from './save.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
const lerp = (a, b, t) => a + (b - a) * t;

function bar(v, cls = '') { return `<div class="bar ${cls}"><i style="width:${Math.round(clamp(v, 0, 1) * 100)}%"></i></div>`; }
function stars(v) { const n = Math.round(clamp(v, 0, 1) * 5); return '★'.repeat(n) + '☆'.repeat(5 - n); }

export function courseSVG(course, { w = 520, h = 340, walk = false, pad = 14 } = {}) {
  const A = course.arena;
  const S = Math.min((w - 2 * pad) / A.w, (h - 2 * pad) / A.h);
  const X = (x) => w / 2 + x * S, Z = (z) => h / 2 + z * S;
  let s = `<svg viewBox="0 0 ${w} ${h}" class="course-map" xmlns="http://www.w3.org/2000/svg">`;
  s += `<rect x="${X(-A.w / 2)}" y="${Z(-A.h / 2)}" width="${A.w * S}" height="${A.h * S}" rx="6" fill="#c9ad7a" stroke="#f3ead6" stroke-width="2"/>`;
  const els = course.elements;
  for (let i = 0; i < els.length; i++) {
    const E = els[i];
    const col = E.type === 'water' ? '#1d6fb8' : E.type === 'w' ? '#a94438' : '#14204a';
    for (const p of E.planes) {
      const cx = E.x + E.n[0] * p.o, cz = E.z + E.n[1] * p.o;
      s += `<line x1="${X(cx - E.l[0] * E.half)}" y1="${Z(cz - E.l[1] * E.half)}" x2="${X(cx + E.l[0] * E.half)}" y2="${Z(cz + E.l[1] * E.half)}" stroke="${col}" stroke-width="3.5" stroke-linecap="round"/>`;
    }
    if (E.water) { const cx = E.x + E.n[0] * (E.water.end / 2), cz = E.z + E.n[1] * (E.water.end / 2); s += `<rect x="${X(cx) - E.water.end * S / 2}" y="${Z(cz) - E.half * S}" width="${E.water.end * S}" height="${2 * E.half * S}" fill="#1d6fb8" opacity="0.6" transform="rotate(${E.deg} ${X(cx)} ${Z(cz)})"/>`; }
    // flecha de sentido
    const ax = E.x - E.n[0] * 2.6, az = E.z - E.n[1] * 2.6;
    s += `<polygon points="${X(ax + E.n[0] * 1.2)},${Z(az + E.n[1] * 1.2)} ${X(ax - E.l[0] * 0.6)},${Z(az - E.l[1] * 0.6)} ${X(ax + E.l[0] * 0.6)},${Z(az + E.l[1] * 0.6)}" fill="#14204a" opacity="0.55"/>`;
    const lx = E.x + E.l[0] * (E.half + 1.6), lz = E.z + E.l[1] * (E.half + 1.6);
    s += `<circle cx="${X(lx)}" cy="${Z(lz)}" r="8" fill="#f3ead6"/><text x="${X(lx)}" y="${Z(lz) + 3.5}" font-size="9" font-weight="700" text-anchor="middle" fill="#14204a" font-family="Poppins,sans-serif">${E.label}</text>`;
    if (walk && E.comboPos > 0) {
      const P = els[i - 1];
      const back = P.spread + (P.water ? P.water.end - P.spread : 0);
      const dist = Math.hypot(E.x - P.x, E.z - P.z) - back;
      const k = Math.max(1, Math.round((dist - 3.6) / 3.5));
      const mx = (E.x + P.x) / 2 - E.l[0] * (E.half + 1.2), mz = (E.z + P.z) / 2 - E.l[1] * (E.half + 1.2);
      s += `<text x="${X(mx)}" y="${Z(mz) + 3}" font-size="8" text-anchor="middle" fill="#5a0f14" font-family="JetBrains Mono,monospace">${dist.toFixed(1)} m · ${k} tranco${k > 1 ? 's' : ''}</text>`;
    }
  }
  for (const [L, col, name] of [[course.start, '#2e7d32', 'S'], [course.finish, '#c62828', 'F']]) {
    s += `<line x1="${X(L.x + Math.sin(L.th) * L.half)}" y1="${Z(L.z - Math.cos(L.th) * L.half)}" x2="${X(L.x - Math.sin(L.th) * L.half)}" y2="${Z(L.z + Math.cos(L.th) * L.half)}" stroke="${col}" stroke-width="3" stroke-dasharray="4 3"/>`;
    s += `<text x="${X(L.x - Math.cos(L.th) * 2.5)}" y="${Z(L.z - Math.sin(L.th) * 2.5) + 3}" font-size="9" font-weight="700" text-anchor="middle" fill="${col}" font-family="Poppins,sans-serif">${name}</text>`;
  }
  return s + '</svg>';
}

export class App {
  constructor() {
    this.settings = loadSettings();
    this.profile = loadProfile();
    this.audio = new GameAudio();
    this.audio.voiceOn = this.settings.announcer !== false;
    this.music = new Music(this.audio); this.music.enabled = this.settings.music !== false;
    this.world = null; this.game = null;
    this.screen = $('screen'); this.modal = $('modal');
    this.worker = new Worker('./src/rivals-worker.js', { type: 'module' });
    this.pending = new Map(); this.reqId = 0;
    this.worker.onmessage = (e) => { const cb = this.pending.get(e.data.id); if (cb) { this.pending.delete(e.data.id); cb(e.data.results); } };
    document.body.addEventListener('pointerdown', () => { this.audio.ensure(); if (this.audio.ctx && !this.musicStarted) { this.musicStarted = true; if (this.screenMood) this.music.play(this.screenMood); } });
    this.screen.addEventListener('click', (e) => { const a = e.target.closest('[data-a]'); if (a) { this.audio.click(); this.action(a.dataset.a, a.dataset, a); } });
    this.modal.addEventListener('click', (e) => { const a = e.target.closest('[data-a]'); if (a) { this.audio.click(); this.action(a.dataset.a, a.dataset, a); } else if (e.target === this.modal) this.closeModal(); });
    this.screen.addEventListener('change', (e) => { const el = e.target; if (el.dataset.plan) { this.profile.plan[el.dataset.plan] = el.value; saveProfile(this.profile); } });
    $('btn-pause').addEventListener('click', () => this.pauseMenu());
    this.demo = D.demoHorses();
    this.showMenu();
  }

  ensureWorld() {
    if (this.world) return;
    this.world = new World($('game'), { quality: this.settings.quality, cam: this.settings.cam });
    this.game = new Game({ world: this.world, audio: this.audio, settings: this.settings, music: this.music });
  }
  simRivals(spec, rivals, mode) {
    return new Promise((res) => { const id = ++this.reqId; this.pending.set(id, res); this.worker.postMessage({ id, spec, rivals, mode }); });
  }
  show(html, cls = '') { this.screen.innerHTML = html; this.screen.className = 'screen ' + cls; this.screen.style.display = ''; this.screen.scrollTop = 0; }
  mood(m) { this.screenMood = m; if (this.audio.ctx) this.music.play(m); }
  hide() { this.screen.style.display = 'none'; }
  openModal(html) { this.modal.innerHTML = `<div class="modal-card">${html}</div>`; this.modal.style.display = 'flex'; }
  closeModal() { this.modal.style.display = 'none'; this.modal.innerHTML = ''; }
  save() { if (this.profile) saveProfile(this.profile); }

  // ------------------------------------------------------------ pantallas
  showMenu() {
    const p = this.profile;
    this.show(`
      <div class="menu">
        <div class="logo"><span class="jet">JET</span><span class="jump">Jump</span><div class="tag">Salto ecuestre · simulación</div></div>
        <div class="menu-grid">
          ${p ? `<button class="big primary" data-a="career"><b>Continuar carrera</b><small>${esc(p.name)} · Semana ${p.week}, año ${p.year} · ${D.fmtMoney(p.money)}</small></button>` : ''}
          <button class="big ${p ? '' : 'primary'}" data-a="newcareer"><b>${p ? 'Nueva carrera' : 'Carrera'}</b><small>Establo, cuidadores, caballos y jinete que evolucionan</small></button>
          <button class="big" data-a="quick" data-mode="A"><b>Concurso rápido</b><small>Tabla A con desempate contra rivales</small></button>
          <button class="big" data-a="quick" data-mode="C"><b>Contrarreloj</b><small>Tabla C: cada barra suma 4 segundos</small></button>
          <button class="big" data-a="quick" data-mode="power"><b>Potencia</b><small>El muro sube hasta que alguien falla</small></button>
          <button class="big" data-a="quick" data-mode="train"><b>Entrenamiento</b><small>Pista libre con asistente de distancias</small></button>
          <button class="big" data-a="daily"><b>Desafío del día</b><small>Misma pista para todos, un intento cuenta</small></button>
          <button class="big" data-a="settings"><b>Ajustes</b><small>Sonido, asistencia, cámara, calidad</small></button>
        </div>
        <div class="foot">JETCompany OÜ · v0.1 · reglamento FEI simplificado</div>
      </div>`, 'menu-screen');
    this.mood('menu');
  }

  action(a, d, el) {
    const P = this.profile;
    switch (a) {
      case 'menu': this.showMenu(); break;
      case 'career': this.showHub(); break;
      case 'newcareer': this.openModal(`<h2>Nueva carrera</h2><p>${P ? '<b>Esto borra la carrera actual.</b> ' : ''}Empezás con dos caballos, un caballerizo y €60.000.</p><label>Nombre del jinete<input id="rider-name" maxlength="24" placeholder="Tu nombre" value="${P ? '' : ''}"></label><div class="row"><button data-a="closemodal">Cancelar</button><button class="primary" data-a="createcareer">Empezar</button></div>`); setTimeout(() => $('rider-name').focus(), 50); break;
      case 'createcareer': { const name = ($('rider-name').value || 'Jinete').trim(); deleteProfile(); this.profile = newProfile(name); this.save(); this.closeModal(); this.showHub(); break; }
      case 'closemodal': this.closeModal(); break;
      case 'tab': this.showHub(d.tab); break;
      case 'horse': this.horseDetail(d.id); break;
      case 'sell': this.sellHorse(d.id); break;
      case 'buy': this.buyHorse(d.id); break;
      case 'hire': this.hire(d.id); break;
      case 'fire': this.fire(d.id); break;
      case 'skill': this.spendSkill(d.key); break;
      case 'jacket': P.rider.jacket = parseInt(d.c); this.save(); this.showHub('rider'); break;
      case 'week': this.advanceWeek(); break;
      case 'enter': this.pickHorseFor(+d.tier); break;
      case 'enterwith': this.closeModal(); this.enterShow(+d.tier, d.id); break;
      case 'quick': this.quickSetup(d.mode); break;
      case 'quickstart': this.quickStart(); break;
      case 'daily': this.dailySetup(); break;
      case 'dailystart': this.dailyStart(); break;
      case 'settings': this.settingsModal(); break;
      case 'set': {
        const k = d.k;
        if (k === 'quality' || k === 'cam' || k === 'replays' || k === 'horseModel') this.settings[k] = d.v; else this.settings[k] = !this.settings[k];
        saveSettings(this.settings);
        if (this.world && k === 'cam') this.world.camMode = this.settings.cam;
        if (k === 'sound') { this.audio.ensure(); this.audio.setEnabled(this.settings.sound); }
        if (k === 'music') { this.music.setEnabled(this.settings.music); if (this.settings.music && this.screenMood) this.music.play(this.screenMood); }
        if (k === 'announcer') this.audio.voiceOn = this.settings.announcer;
        this.settingsModal(this.settingsInGame); break;
      }
      case 'reset': deleteProfile(); this.profile = null; this.closeModal(); this.showMenu(); break;
      case 'walk': this.walk = !this.walk; this.preRound(this.pre); break;
      case 'go': this.closeModal(); this.hide(); this.startRide(this.pre); break;
      case 'tutorial-ok': this.settings.tutorialSeen = true; saveSettings(this.settings); this.closeModal(); this.game.pause(false); break;
      case 'resume': this.closeModal(); this.game.pause(false); break;
      case 'resume-settings': this.pauseMenu(); break;
      case 'cam': { this.world.camMode = CAM_MODES[(CAM_MODES.indexOf(this.world.camMode) + 1) % CAM_MODES.length]; this.pauseMenu(); break; }
      case 'settings-ingame': this.settingsModal(true); break;
      case 'quit': this.closeModal(); this.game.pause(false); this.game.ride.elim = this.game.ride.elim || 'Retirado'; this.game.endAt = performance.now() + 100; break;
      case 'results-back': this.afterResults(); break;
      case 'jo': this.closeModal(); this.startJumpOff(); break;
      case 'power-next': this.closeModal(); this.powerNext(); break;
      default: console.warn('acción desconocida', a);
    }
  }

  // ------------------------------------------------------------ carrera
  showHub(tab = 'horses') {
    const P = this.profile; if (!P) return this.showMenu();
    const lvl = D.riderLevel(P.rider.xp);
    const salaries = P.staff.reduce((s, x) => s + x.salary, 0), board = D.WEEK_BASE_COST * P.horses.length;
    const tabs = [['horses', 'Caballos'], ['staff', 'Personal'], ['shows', 'Concursos'], ['rider', 'Jinete'], ['market', 'Mercado'], ['log', 'Registro']];
    let body = '';
    if (tab === 'horses') {
      body = P.horses.map(h => this.horseCard(h, true)).join('') || '<p class="muted">No tenés caballos. Comprá uno en el mercado.</p>';
    } else if (tab === 'staff') {
      body = `<h3>Equipo</h3><div class="cards">${P.staff.map(s => this.staffCard(s, true)).join('') || '<p class="muted">Sin personal. Un caballerizo es lo primero.</p>'}</div>
        <h3>Candidatos <small class="muted">se renuevan cada 3 semanas</small></h3><div class="cards">${P.candidates.map(s => this.staffCard(s, false)).join('') || '<p class="muted">Nadie disponible esta semana.</p>'}</div>`;
    } else if (tab === 'shows') {
      body = `<div class="cards">` + D.TIERS.map((t, i) => {
        const locked = t.unlock > P.bestTier + 1;
        return `<div class="card tier ${locked ? 'locked' : ''}"><div class="card-h"><b>${t.name}</b><span class="chip">${LAYOUTS[t.layout].name}</span></div>
          <div class="muted">Inscripción ${D.fmtMoney(t.fee)} · 1º ${D.fmtMoney(t.prize[0])} · ${t.n} binomios · ${t.jumpoff ? 'con desempate' : 'sin desempate'}</div>
          ${locked ? `<div class="lock">🔒 Necesitás un top 5 en ${D.TIERS[t.unlock - 1].name}</div>` : `<button class="primary" data-a="enter" data-tier="${i}" ${P.money < t.fee ? 'disabled' : ''}>Inscribir</button>`}</div>`;
      }).join('') + '</div>';
    } else if (tab === 'rider') {
      const next = D.riderNextXp(lvl);
      body = `<div class="card"><div class="card-h"><b>${esc(P.name)}</b><span class="chip">Nivel ${lvl}</span></div>
        <div class="muted">XP ${P.rider.xp} / ${next}</div>${bar(P.rider.xp / next, 'gold')}
        <div class="muted">${P.rider.starts} salidas · ${P.rider.wins} victorias · ${P.rider.clears} recorridos limpios · Puntos disponibles: <b>${P.rider.points}</b></div></div>
        <div class="cards">${Object.entries(D.RIDER_SKILLS).map(([k, S]) => `<div class="card"><div class="card-h"><b>${S.name}</b><span>${Math.round(P.rider.skills[k] * 100)}</span></div>${bar(P.rider.skills[k])}<div class="muted">${S.desc}</div><button data-a="skill" data-key="${k}" ${P.rider.points > 0 && P.rider.skills[k] < 1 ? '' : 'disabled'}>+5 (1 punto)</button></div>`).join('')}</div>
        <h3>Chaqueta</h3><div class="swatches">${[0x14204a, 0x101010, 0x5a0f14, 0x1f3b2a, 0x3b2a6b, 0x7a3a0c, 0x2b5c8a].map(c => `<button class="swatch ${P.rider.jacket === c ? 'sel' : ''}" style="background:${hex(c)}" data-a="jacket" data-c="${c}"></button>`).join('')}</div>`;
    } else if (tab === 'market') {
      this.refreshMarket();
      body = `<h3>En venta</h3><div class="cards">${P.market.map(h => this.horseCard(h, false)).join('')}</div><h3>Vender</h3><div class="cards">${P.horses.map(h => `<div class="card"><div class="card-h"><b>${esc(h.name)}</b><span>${D.fmtMoney(h.value * 0.85)}</span></div><button data-a="sell" data-id="${h.id}" ${P.horses.length > 1 ? '' : 'disabled'}>Vender</button></div>`).join('')}</div>`;
    } else if (tab === 'log') {
      body = `<div class="log">${P.log.slice(-40).reverse().map(l => `<div>${esc(l)}</div>`).join('') || '<p class="muted">Todavía no pasó nada.</p>'}</div>`;
    }
    this.show(`
      <div class="hub">
        <header class="hub-h"><button class="icon" data-a="menu">‹</button>
          <div class="hub-title"><b>Establo ${esc(P.name)}</b><small>Semana ${P.week} · Año ${P.year}</small></div>
          <div class="money">${D.fmtMoney(P.money)}</div>
          <button class="icon" data-a="settings">⚙</button></header>
        <nav class="tabs">${tabs.map(([k, n]) => `<button class="${k === tab ? 'sel' : ''}" data-a="tab" data-tab="${k}">${n}</button>`).join('')}</nav>
        <div class="hub-body">${body}</div>
        <footer class="hub-f"><span class="muted">Gastos semanales: ${D.fmtMoney(salaries + board)}</span><button class="primary" data-a="week">Pasar semana ▶</button></footer>
      </div>`, 'hub-screen');
    this.mood('stable');
  }

  horseCard(h, own) {
    const P = this.profile, s = h.stats;
    const plan = own ? `<label class="plan">Plan semanal <select data-plan="${h.id}" ${h.injuredWeeks ? 'disabled' : ''}>${Object.entries(D.TRAININGS).map(([k, T]) => `<option value="${k}" ${(P.plan[h.id] || 'flat') === k ? 'selected' : ''}>${T.icon} ${T.name}</option>`).join('')}</select></label>` : `<div class="price">${D.fmtMoney(h.value)}</div><button class="primary" data-a="buy" data-id="${h.id}" ${P.money >= h.value ? '' : 'disabled'}>Comprar</button>`;
    return `<div class="card horse ${h.injuredWeeks ? 'injured' : ''}">
      <div class="card-h"><div class="coat" style="background:${hex(COATS[h.coat].body)}"></div><div><b>${esc(h.name)}</b><small>${D.BREEDS[h.breed].name} · ${h.age} años · ${h.sex} · ${COATS[h.coat].name}</small></div>${h.injuredWeeks ? `<span class="chip bad">Lesión ${h.injuredWeeks} sem.</span>` : ''}</div>
      <div class="stats">
        <div><span>Potencia</span>${bar((s.scope - 1.1) / 0.6)}<em>${s.scope.toFixed(2)} m</em></div>
        <div><span>Técnica</span>${bar(s.tech)}<em>${Math.round(s.tech * 100)}</em></div>
        <div><span>Cuidado</span>${bar(s.care)}<em>${Math.round(s.care * 100)}</em></div>
        <div><span>Velocidad</span>${bar(s.speed)}<em>${Math.round(s.speed * 100)}</em></div>
        <div><span>Manejo</span>${bar(s.ride)}<em>${Math.round(s.ride * 100)}</em></div>
        <div><span>Coraje</span>${bar(s.bold)}<em>${Math.round(s.bold * 100)}</em></div>
        <div><span>Fondo</span>${bar(s.stamina)}<em>${Math.round(s.stamina * 100)}</em></div>
      </div>
      <div class="state"><span>Forma ${bar(h.fitness, 'green')}</span><span>Ánimo ${bar(h.mood, 'gold')}</span><span>Salud ${bar(h.health, 'red')}</span></div>
      <div class="row">${plan}${own ? `<button data-a="horse" data-id="${h.id}">Ficha</button>` : ''}</div></div>`;
  }
  staffCard(s, own) {
    const R = D.STAFF_ROLES[s.role];
    const next = D.STAFF_XP_LEVELS[s.level] ?? null;
    return `<div class="card"><div class="card-h"><span class="icon-big">${R.icon}</span><div><b>${esc(s.name)}</b><small>${R.name} · ${D.STAFF_TITLES[s.level - 1]} (nivel ${s.level}) · ${s.trait}</small></div></div>
      <div class="muted">${R.effect}</div>
      ${own ? `<div class="muted">Experiencia ${s.xp}${next ? ' / ' + next : ' · máximo'} · ${s.weeks} semanas en el establo</div>${bar(next ? (s.xp - D.STAFF_XP_LEVELS[s.level - 1]) / (next - D.STAFF_XP_LEVELS[s.level - 1]) : 1, 'gold')}` : ''}
      <div class="row"><span class="price">${D.fmtMoney(s.salary)}/sem</span>${own ? `<button data-a="fire" data-id="${s.id}">Despedir</button>` : `<button class="primary" data-a="hire" data-id="${s.id}" ${this.profile.staff.some(x => x.role === s.role) ? 'disabled title="Ya tenés este rol"' : ''}>Contratar</button>`}</div></div>`;
  }
  horseDetail(id) {
    const h = this.profile.horses.find(x => x.id === id); if (!h) return;
    const rows = D.STAT_KEYS.map(k => { const v = h.stats[k], p = h.pot[k]; const n = k === 'scope' ? (x) => ((x - 1.1) / 0.6) : (x) => x; return `<div class="statrow"><span>${D.STAT_INFO[k].name}</span>${bar(n(v))}<em>${k === 'scope' ? v.toFixed(2) + ' m' : Math.round(v * 100)}</em><small class="muted">potencial ${stars(n(p))}</small><p class="muted">${D.STAT_INFO[k].desc}</p></div>`; }).join('');
    const hist = h.history.slice(-8).reverse().map(r => `<div>${esc(r)}</div>`).join('') || '<div class="muted">Sin concursos todavía.</div>';
    this.openModal(`<h2>${esc(h.name)}</h2><div class="muted">${D.BREEDS[h.breed].name} · ${h.age} años · ${h.sex} · ${COATS[h.coat].name} · valor ${D.fmtMoney(h.value)}</div>
      <div class="muted">${h.starts} salidas · ${h.wins} victorias · ${h.clears} limpios · ganancias ${D.fmtMoney(h.earnings)}</div>${rows}<h3>Historial</h3><div class="log">${hist}</div><div class="row"><button class="primary" data-a="closemodal">Cerrar</button></div>`);
  }
  sellHorse(id) { const P = this.profile; const i = P.horses.findIndex(h => h.id === id); if (i < 0 || P.horses.length <= 1) return; const h = P.horses[i]; P.money += Math.round(h.value * 0.85); P.horses.splice(i, 1); delete P.plan[id]; P.log.push(`Vendiste a ${h.name} por ${D.fmtMoney(h.value * 0.85)}.`); this.save(); this.showHub('market'); }
  buyHorse(id) { const P = this.profile; const i = P.market.findIndex(h => h.id === id); if (i < 0) return; const h = P.market[i]; if (P.money < h.value) return; P.money -= h.value; P.market.splice(i, 1); P.horses.push(h); P.plan[h.id] = 'flat'; P.log.push(`Compraste a ${h.name} por ${D.fmtMoney(h.value)}.`); this.save(); this.showHub('horses'); }
  refreshMarket() {
    const P = this.profile;
    if (P.market.length && P.week - P.marketWeek < 4) return;
    const rng = mulberry32(P.seed + P.week * 97);
    const q = clamp(0.25 + (P.bestTier + 1) * 0.1, 0.2, 0.95);
    P.market = Array.from({ length: 5 }, () => D.genHorse(rng, clamp(q + (rng() - 0.5) * 0.4, 0.1, 1)));
    P.marketWeek = P.week; this.save();
  }
  refreshCandidates() {
    const P = this.profile;
    const rng = mulberry32(P.seed + P.week * 131 + 5);
    const roles = Object.keys(D.STAFF_ROLES);
    P.candidates = Array.from({ length: 3 }, () => D.genStaff(rng, D.pick(rng, roles), 1 + (rng() < 0.3 ? 1 : 0) + (P.bestTier >= 3 && rng() < 0.3 ? 1 : 0)));
  }
  hire(id) { const P = this.profile; const i = P.candidates.findIndex(s => s.id === id); if (i < 0) return; const s = P.candidates[i]; if (P.staff.some(x => x.role === s.role)) return; P.candidates.splice(i, 1); P.staff.push(s); P.log.push(`Contrataste a ${s.name} (${D.STAFF_ROLES[s.role].short}).`); this.save(); this.showHub('staff'); }
  fire(id) { const P = this.profile; const i = P.staff.findIndex(s => s.id === id); if (i < 0) return; P.log.push(`${P.staff[i].name} dejó el establo.`); P.staff.splice(i, 1); this.save(); this.showHub('staff'); }
  spendSkill(k) { const P = this.profile; if (P.rider.points <= 0) return; P.rider.points--; P.rider.skills[k] = clamp(P.rider.skills[k] + 0.05, 0, 1); this.save(); this.showHub('rider'); }

  advanceWeek() {
    const P = this.profile; const rng = mulberry32(P.seed + P.week * 7919);
    const log = [];
    for (const h of P.horses) { log.push(...D.applyTraining(h, P.plan[h.id] || 'flat', P.staff, rng)); D.weeklyUpkeep(h, P.staff); h.value = D.horseValue(h); }
    for (const s of P.staff) {
      s.weeks++; s.xp += 10 + (s.level < 3 ? 4 : 0);
      const nl = D.staffLevelFor(s.xp);
      if (nl > s.level) { s.level = nl; s.salary = Math.round(D.STAFF_ROLES[s.role].salary * (1 + 0.35 * (nl - 1))); log.push(`⭐ ${s.name} ascendió a ${D.STAFF_TITLES[nl - 1]} (${D.STAFF_ROLES[s.role].short}).`); }
    }
    const cost = P.staff.reduce((s, x) => s + x.salary, 0) + D.WEEK_BASE_COST * P.horses.length;
    P.money -= cost; log.push(`Gastos de la semana: ${D.fmtMoney(cost)}.`);
    if (P.money < 0) log.push('⚠ Saldo negativo: vendé un caballo o ganá premios.');
    P.week++;
    if (P.week > 52) { P.week = 1; P.year++; D.ageHorses(P); log.push(`Año ${P.year}: los caballos cumplen años.`); }
    if (P.week % 3 === 1 || !P.candidates.length) this.refreshCandidates();
    P.log.push(...log); this.save();
    this.openModal(`<h2>Semana ${P.week - 1 || 52}</h2><div class="log">${log.map(l => `<div>${esc(l)}</div>`).join('')}</div><div class="row"><button class="primary" data-a="closemodal">Seguir</button></div>`);
    this.showHub('horses');
  }

  pickHorseFor(tier) {
    const P = this.profile, T = D.TIERS[tier];
    const ok = P.horses.filter(h => !h.injuredWeeks);
    this.openModal(`<h2>${T.name}</h2><p class="muted">Elegí el caballo. Inscripción ${D.fmtMoney(T.fee)}.</p><div class="cards">${ok.map(h => `<button class="pick" data-a="enterwith" data-tier="${tier}" data-id="${h.id}"><b>${esc(h.name)}</b><small>Potencia ${h.stats.scope.toFixed(2)} m · forma ${Math.round(h.fitness * 100)} · ánimo ${Math.round(h.mood * 100)}</small>${h.stats.scope < T.h + 0.05 ? '<em class="bad">Valla al límite de su potencia</em>' : ''}</button>`).join('') || '<p>Ningún caballo está en condiciones.</p>'}</div><div class="row"><button data-a="closemodal">Cancelar</button></div>`);
  }

  enterShow(tierIdx, horseId) {
    const P = this.profile, T = D.TIERS[tierIdx];
    const h = P.horses.find(x => x.id === horseId); if (!h || P.money < T.fee) return;
    P.money -= T.fee; this.save();
    const seed = P.seed + P.week * 31 + tierIdx * 7 + P.year * 1000;
    const rng = mulberry32(seed);
    const rivals = Array.from({ length: T.n - 1 }, (_, i) => { const r = D.genRival(rng, lerp(T.skill[0], T.skill[1], rng()), tierIdx); return { ...r, seed: seed + i * 13 }; });
    const course = buildCourse(T.layout, { height: T.h, speed: T.speed, seed });
    this.pre = {
      kind: 'career', tier: T, tierIdx, horse: h, course, spec: { layout: T.layout, opts: { height: T.h, speed: T.speed, seed } }, rivals, mode: 'A',
      title: T.name, prize: T.prize, jumpoff: T.jumpoff, seed,
    };
    this.preRound(this.pre);
  }

  // ------------------------------------------------------------ modos rápidos
  horseOptions(sel) {
    const own = this.profile ? this.profile.horses.filter(h => !h.injuredWeeks) : [];
    const list = [...own, ...this.demo];
    return list.map(h => `<option value="${h.id}" ${sel === h.id ? 'selected' : ''}>${esc(h.name)} · ${h.stats.scope.toFixed(2)} m ${own.includes(h) ? '(tuyo)' : '(demo)'}</option>`).join('');
  }
  findHorse(id) { return (this.profile ? this.profile.horses : []).concat(this.demo).find(h => h.id === id); }
  quickSetup(mode) {
    this.quick = this.quick || { layout: 'clasico', height: 1.3, horse: this.demo[1].id };
    this.quick.mode = mode;
    const names = { A: 'Concurso rápido', C: 'Contrarreloj', power: 'Potencia', train: 'Entrenamiento' };
    this.show(`<div class="setup"><header class="hub-h"><button class="icon" data-a="menu">‹</button><div class="hub-title"><b>${names[mode]}</b></div></header>
      <div class="form">
        <label>Caballo<select id="q-horse">${this.horseOptions(this.quick.horse)}</select></label>
        ${mode === 'power' ? '<p class="muted">Muro inicial 1.50 m, sube 10 cm por vuelta. Rivales eliminados al fallar.</p>' : `<label>Pista<select id="q-layout">${Object.entries(LAYOUTS).map(([k, L]) => `<option value="${k}" ${this.quick.layout === k ? 'selected' : ''}>${L.name}</option>`).join('')}</select></label>
        <label>Altura<select id="q-height">${[1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6].map(h => `<option value="${h}" ${Math.abs(this.quick.height - h) < 0.01 ? 'selected' : ''}>${h.toFixed(2)} m</option>`).join('')}</select></label>`}
        <button class="primary big" data-a="quickstart">Continuar</button></div></div>`, 'setup-screen');
  }
  quickStart() {
    const q = this.quick; q.horse = $('q-horse').value;
    if (q.mode !== 'power') { q.layout = $('q-layout').value; q.height = +$('q-height').value; }
    const h = this.findHorse(q.horse);
    const seed = Math.floor(Math.random() * 1e9);
    if (q.mode === 'power') { this.powerStart(h); return; }
    const course = buildCourse(q.layout, { height: q.height, speed: q.height >= 1.3 ? 375 : 350, seed });
    const rng = mulberry32(seed);
    const tierIdx = Math.round((q.height - 1.0) / 0.1);
    const rivals = q.mode === 'train' ? [] : Array.from({ length: 9 }, (_, i) => ({ ...D.genRival(rng, clamp(0.35 + tierIdx * 0.09 + (rng() - 0.5) * 0.2, 0.2, 0.98), tierIdx), seed: seed + i * 13 }));
    this.pre = { kind: 'quick', horse: h, course, spec: { layout: q.layout, opts: { height: q.height, speed: course.speed, seed } }, rivals, mode: q.mode, title: q.mode === 'C' ? 'Contrarreloj' : q.mode === 'train' ? 'Entrenamiento' : 'Concurso rápido', jumpoff: q.mode === 'A', seed };
    this.preRound(this.pre);
  }
  dailySetup() {
    const d = new Date(); const key = d.toISOString().slice(0, 10);
    const seed = [...key].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
    const rng = mulberry32(seed);
    const layout = D.pick(rng, Object.keys(LAYOUTS)); const height = [1.2, 1.3, 1.35, 1.4][Math.floor(rng() * 4)];
    const best = this.profile ? this.profile.records.daily[key] : null;
    this.daily = { key, seed, layout, height };
    this.show(`<div class="setup"><header class="hub-h"><button class="icon" data-a="menu">‹</button><div class="hub-title"><b>Desafío del día</b><small>${key}</small></div></header>
      <div class="form"><p>Pista <b>${LAYOUTS[layout].name}</b> a <b>${height.toFixed(2)} m</b>, Tabla A. Todos los jugadores corren la misma pista hoy.</p>
      ${best ? `<p class="muted">Tu mejor resultado hoy: ${best.faults} faltas en ${best.time.toFixed(2)} s</p>` : ''}
      <label>Caballo<select id="q-horse">${this.horseOptions(this.quick && this.quick.horse)}</select></label>
      <button class="primary big" data-a="dailystart">Continuar</button></div></div>`, 'setup-screen');
  }
  dailyStart() {
    const h = this.findHorse($('q-horse').value); const dd = this.daily;
    const course = buildCourse(dd.layout, { height: dd.height, speed: 375, seed: dd.seed });
    const rng = mulberry32(dd.seed + 1);
    const rivals = Array.from({ length: 11 }, (_, i) => ({ ...D.genRival(rng, 0.45 + rng() * 0.45, 3), seed: dd.seed + i * 17 }));
    this.pre = { kind: 'daily', horse: h, course, spec: { layout: dd.layout, opts: { height: dd.height, speed: 375, seed: dd.seed } }, rivals, mode: 'A', title: 'Desafío del día', jumpoff: false, seed: dd.seed, key: dd.key };
    this.preRound(this.pre);
  }

  // ------------------------------------------------------------ pre-recorrido
  preRound(pre) {
    const c = pre.course, h = pre.horse;
    const walk = !!this.walk;
    this.show(`<div class="pre"><header class="hub-h"><button class="icon" data-a="${pre.kind === 'career' ? 'career' : 'menu'}">‹</button><div class="hub-title"><b>${esc(pre.title)}</b><small>${LAYOUTS[c.layout].name} · ${esc(h.name)}</small></div><button class="icon" data-a="settings">⚙</button></header>
      <div class="pre-body"><div class="map-wrap">${courseSVG(c, { walk })}</div>
        <div class="pre-info">
          <div class="chips"><span class="chip">${c.elements.length} esfuerzos</span><span class="chip">${c.height.toFixed(2)} m</span><span class="chip">${c.length} m</span>${c.ta ? `<span class="chip">Tiempo acordado ${c.ta} s</span>` : ''}<span class="chip">${c.speed} m/min</span></div>
          <p class="muted">${pre.mode === 'C' ? 'Tabla C: gana el menor tiempo. Cada barra suma 4 s, un rehúse 6 s.' : pre.mode === 'train' ? 'Sin reloj ni faltas. Saltá lo que quieras, en el orden que quieras. El asistente te dice si la distancia fue larga o corta.' : 'Tabla A: 4 faltas por barra, pie en el agua o rehúse. Segundo rehúse: eliminado. Cada segundo por encima del tiempo acordado suma 1 falta.'}</p>
          <button data-a="walk">${walk ? 'Ocultar distancias' : 'Reconocer la pista (distancias)'}</button>
          <button class="primary big" data-a="go">Entrar a pista</button>
        </div></div></div>`, 'pre-screen');
    this.mood('preround');
  }

  startRide(pre) {
    this.ensureWorld();
    this.hide(); this.music.stop(); this.screenMood = null;
    const h = pre.horse;
    const staff = this.profile && pre.kind === 'career' ? this.profile.staff : [];
    const stats = D.effectiveHorse(h, staff);
    const rider = this.profile ? this.profile.rider.skills : { eye: 0.5, balance: 0.5, nerve: 0.5, turns: 0.5 };
    const look = { coat: h.coat, blaze: h.blaze, socks: h.socks, boots: h.bootsColor, pad: h.padColor, rider: { jacket: this.profile ? this.profile.rider.jacket : 0x14204a } };
    // rivales en paralelo
    if (pre.rivals.length && !pre.rivalResults) {
      const rivals = pre.rivals.map(r => ({ name: r.name, horseName: r.horse.name, horse: { ...r.horse.stats, form: 0.95 + 0.07 * Math.random() }, rider: r.rider, skill: r.skill, seed: r.seed, cruise: 5.4 + 1.0 * r.skill + 0.6 * r.horse.stats.speed }));
      pre.rivalPromise = this.simRivals(pre.spec, rivals, pre.mode === 'C' ? 'C' : 'A');
    }
    this.game.start({
      course: pre.course, horseStats: stats, horseLook: look, rider, mode: pre.mode, fitness: h.fitness, assist: this.settings.assist, title: pre.title,
      riderName: this.profile ? this.profile.name : 'el jinete', horseName: h.name,
      onEnd: (res) => this.onRoundEnd(res),
    });
    if (!this.settings.tutorialSeen) {
      this.game.pause(true);
      this.openModal(`<h2>Cómo se monta</h2><div class="tut">
        <div><b>Dirección</b><p>Arrastrá en la mitad izquierda de la pantalla. Hacia los costados gira; hacia arriba o abajo cambia el ritmo.</p></div>
        <div><b>Ritmo</b><p>Botones <b>+</b> (pierna) y <b>−</b> (rienda). Llegá a cada valla con el galope justo: el medidor inferior muestra si la distancia viene larga o corta.</p></div>
        <div><b>Salto</b><p>Cuando el botón <b>SALTAR</b> brilla, tocalo. Si no lo tocás, el caballo decide solo y a veces se planta.</p></div>
        <div><b>Teclado</b><p>A/D o flechas para girar, W/S ritmo, espacio salta.</p></div></div>
        <div class="row"><button class="primary" data-a="tutorial-ok">¡A pista!</button></div>`);
    }
  }

  pauseMenu() {
    if (!this.game || !this.game.running) return;
    this.game.pause(true);
    this.openModal(`<h2>Pausa</h2><div class="row col"><button class="primary" data-a="resume">Reanudar</button><button data-a="cam">Cámara: ${CAM_NAMES[this.world.camMode] || this.world.camMode}</button><button data-a="settings-ingame">Ajustes</button><button data-a="quit">Abandonar</button></div>`);
  }

  // ------------------------------------------------------------ resultados
  async onRoundEnd(res) {
    const pre = this.pre;
    if (pre.mode === 'train') { this.showMenu(); this.openModal(`<h2>Entrenamiento</h2><p>${res.stats.jumps} saltos · ${res.stats.perfect} con distancia perfecta · ${res.stats.long} largos · ${res.stats.deep} profundos · ${res.stats.rails} barras</p><div class="row"><button class="primary" data-a="closemodal">Cerrar</button></div>`); return; }
    if (pre.kind === 'power') { this.powerRound(res); return; }
    const rivals = pre.rivalResults || (pre.rivalPromise ? await pre.rivalPromise : []);
    pre.rivalResults = rivals;
    if (!pre.jo) {
      pre.r1 = { player: res, rivals };
      const table = this.rank(pre.mode, res, rivals);
      pre.table = table;
      const clears = table.filter(r => !r.elim && r.faults === 0);
      const playerClear = !res.elim && res.faults === 0;
      if (pre.jumpoff && playerClear && clears.length >= 2) {
        this.showMenu();
        this.openModal(`<h2>¡Desempate!</h2><p>${clears.length} binomios sin faltas. Pista acortada, barras 5 cm más altas, gana el más rápido sin faltas.</p><div class="row"><button class="primary" data-a="jo">Al desempate</button></div>`);
        return;
      }
    } else {
      pre.table = this.rankJO(pre.table, res, rivals);
    }
    this.showResults();
  }
  rank(mode, player, rivals) {
    const rows = rivals.map(r => ({ name: r.name, horse: r.horseName, faults: r.faults, time: r.time, score: r.scoreTime, elim: r.elim })).concat([{ name: this.profile ? this.profile.name : 'Vos', horse: this.pre.horse.name, faults: player.faults, time: player.time, score: player.scoreTime, elim: player.elim, me: true }]);
    const key = mode === 'C' ? (r) => [r.elim ? 1 : 0, r.score] : (r) => [r.elim ? 1 : 0, r.faults, r.time];
    rows.sort((a, b) => { const ka = key(a), kb = key(b); for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]; return 0; });
    rows.forEach((r, i) => r.pos = i + 1);
    return rows;
  }
  rankJO(table, player, rivals) {
    const jo = new Map(rivals.map(r => [r.name, r]));
    for (const r of table) {
      if (r.me) { r.jo = { faults: player.faults, time: player.time, elim: player.elim }; }
      else if (jo.has(r.name)) { const x = jo.get(r.name); r.jo = { faults: x.faults, time: x.time, elim: x.elim }; }
    }
    const inJO = table.filter(r => r.jo), rest = table.filter(r => !r.jo);
    inJO.sort((a, b) => (a.jo.elim ? 1 : 0) - (b.jo.elim ? 1 : 0) || a.jo.faults - b.jo.faults || a.jo.time - b.jo.time);
    const out = inJO.concat(rest); out.forEach((r, i) => r.pos = i + 1); return out;
  }
  startJumpOff() {
    const pre = this.pre;
    const course = buildCourse(pre.spec.layout, { ...pre.spec.opts, jumpoff: true });
    const clears = pre.table.filter(r => !r.me && !r.elim && r.faults === 0).map(r => r.name);
    const rivals = pre.rivals.filter(r => clears.includes(r.name)).map(r => ({ name: r.name, horseName: r.horse.name, horse: { ...r.horse.stats, form: 0.95 + 0.07 * Math.random() }, rider: r.rider, skill: r.skill, seed: r.seed + 999, cruise: 6.0 + 1.3 * r.skill + 0.8 * r.horse.stats.speed }));
    pre.jo = true; pre.course = course; pre.rivalResults = null;
    pre.rivalPromise = this.simRivals({ layout: pre.spec.layout, opts: { ...pre.spec.opts, jumpoff: true } }, rivals, 'A');
    pre.title = pre.title + ' · Desempate';
    this.hide();
    const h = pre.horse;
    const staff = this.profile && pre.kind === 'career' ? this.profile.staff : [];
    this.game.start({ course, horseStats: D.effectiveHorse(h, staff), horseLook: this.game.horse.look, rider: this.profile ? this.profile.rider.skills : { eye: 0.5, balance: 0.5, nerve: 0.5, turns: 0.5 }, mode: 'A', fitness: h.fitness * 0.95, assist: this.settings.assist, title: pre.title, countdown: 30, riderName: this.profile ? this.profile.name : 'el jinete', horseName: h.name, onEnd: (res) => this.onRoundEnd(res) });
    this.music.stop(); this.screenMood = null;
  }

  showResults() {
    const pre = this.pre, T = pre.table;
    const me = T.find(r => r.me);
    const prizes = pre.prize || [];
    const money = prizes[me.pos - 1] || 0;
    let award = '';
    if (pre.kind === 'career') award = this.applyCareer(me, money);
    if (pre.kind === 'daily' && this.profile) { const best = this.profile.records.daily[pre.key]; if (!best || me.faults < best.faults || (me.faults === best.faults && me.time < best.time)) this.profile.records.daily[pre.key] = { faults: me.faults, time: me.time }; this.save(); }
    const fmt = (r) => r.elim ? `<span class="bad">ELIM</span>` : pre.mode === 'C' ? `${r.score.toFixed(2)} s` : `${r.faults} / ${r.time.toFixed(2)} s`;
    const rows = T.map(r => `<tr class="${r.me ? 'me' : ''}"><td>${r.pos}</td><td>${esc(r.name)}<br><small>${esc(r.horse)}</small></td><td>${fmt(r)}</td>${pre.jo ? `<td>${r.jo ? (r.jo.elim ? '<span class="bad">ELIM</span>' : `${r.jo.faults} / ${r.jo.time.toFixed(2)} s`) : '–'}</td>` : ''}<td>${prizes[r.pos - 1] ? D.fmtMoney(prizes[r.pos - 1]) : ''}</td></tr>`).join('');
    const headline = me.elim ? `Eliminado: ${me.elim}` : me.pos === 1 ? '¡Victoria!' : me.pos <= 3 ? `¡Podio! ${me.pos}º puesto` : `${me.pos}º puesto`;
    this.screenMood = me.elim ? 'lose' : me.pos <= 3 ? 'win' : 'stable';
    this.show(`<div class="results"><header class="hub-h"><div class="hub-title"><b>${esc(pre.title)}</b><small>${headline}</small></div></header>
      <div class="results-body"><table><thead><tr><th>#</th><th>Binomio</th><th>${pre.mode === 'C' ? 'Tiempo' : 'Faltas / tiempo'}</th>${pre.jo ? '<th>Desempate</th>' : ''}<th>Premio</th></tr></thead><tbody>${rows}</tbody></table>
      ${award}</div>
      <footer class="hub-f"><button class="primary" data-a="results-back">${pre.kind === 'career' ? 'Volver al establo' : 'Menú'}</button></footer></div>`, 'results-screen');
    this.mood(this.screenMood);
    if (me.pos === 1 && !me.elim) this.audio.say(`${pre.title}: ganador, ${this.profile ? this.profile.name : 'el jinete'} con ${pre.horse.name}.`);
  }
  applyCareer(me, money) {
    const P = this.profile, pre = this.pre, h = pre.horse;
    const xp = 40 + Math.max(0, 6 - me.pos) * 25 + (!me.elim && me.faults === 0 ? 30 : 0) + pre.tierIdx * 10;
    const before = D.riderLevel(P.rider.xp);
    P.rider.xp += xp; P.rider.starts++; if (me.pos === 1) P.rider.wins++; if (!me.elim && me.faults === 0) P.rider.clears++;
    const after = D.riderLevel(P.rider.xp); P.rider.points += after - before;
    P.money += money;
    h.starts++; if (me.pos === 1) h.wins++; if (!me.elim && me.faults === 0) h.clears++; h.earnings += money; h.xp += xp;
    h.mood = clamp(h.mood + (me.pos <= 3 ? 0.05 : -0.04) - (me.elim ? 0.1 : 0), 0, 1); h.fitness = clamp(h.fitness - 0.03, 0, 1);
    h.history.push(`S${P.week}/A${P.year} ${pre.tier.name}: ${me.pos}º ${me.elim ? '(elim.)' : me.faults + ' faltas'}`);
    if (me.pos <= 5 && !me.elim) P.bestTier = Math.max(P.bestTier, pre.tierIdx);
    for (const s of P.staff) s.xp += 8;
    P.results.push({ week: P.week, year: P.year, tier: pre.tier.key, pos: me.pos, faults: me.faults, time: me.time, horse: h.name, money });
    P.log.push(`${pre.tier.name} con ${h.name}: ${me.pos}º puesto${money ? ', ' + D.fmtMoney(money) : ''}.`);
    this.save();
    return `<div class="award"><span>+${xp} XP jinete${after > before ? ` · ¡Nivel ${after}! +${after - before} punto` : ''}</span>${money ? `<span>+${D.fmtMoney(money)}</span>` : ''}${me.pos <= 5 && !me.elim && pre.tierIdx === P.bestTier && pre.tierIdx + 1 < D.TIERS.length ? `<span>Desbloqueado: ${D.TIERS[pre.tierIdx + 1].name}</span>` : ''}</div>`;
  }
  afterResults() { if (this.pre.kind === 'career') this.showHub('shows'); else this.showMenu(); }

  // ------------------------------------------------------------ potencia
  powerStart(h) {
    const rng = mulberry32(Math.floor(Math.random() * 1e9));
    const rivals = Array.from({ length: 6 }, () => D.genRival(rng, 0.6 + rng() * 0.35, 5)).map(r => ({ ...r, alive: true }));
    this.pre = { kind: 'power', horse: h, mode: 'power', title: 'Potencia', heights: [1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3], round: 0, rivals, rivalResults: [], log: [], rng };
    this.powerNext();
  }
  powerNext() {
    const pre = this.pre; const hgt = pre.heights[pre.round];
    pre.course = buildCourse('clasico', { height: hgt, power: hgt });
    pre.title = `Potencia · Muro ${hgt.toFixed(2)} m`;
    this.ensureWorld(); this.hide();
    const h = pre.horse;
    this.game.start({ course: pre.course, horseStats: D.effectiveHorse(h, []), horseLook: { coat: h.coat, blaze: h.blaze, socks: h.socks, boots: h.bootsColor, pad: h.padColor, rider: { jacket: this.profile ? this.profile.rider.jacket : 0x14204a } }, rider: this.profile ? this.profile.rider.skills : { eye: 0.5, balance: 0.5, nerve: 0.5, turns: 0.5 }, mode: 'power', fitness: h.fitness, assist: this.settings.assist, title: pre.title, countdown: 20, riderName: this.profile ? this.profile.name : 'el jinete', horseName: h.name, onEnd: (res) => this.onRoundEnd(res) });
    this.music.stop(); this.screenMood = null;
  }
  powerRound(res) {
    const pre = this.pre, hgt = pre.heights[pre.round];
    const playerClear = !res.elim && res.faults === 0;
    for (const r of pre.rivals) if (r.alive) { const p = clamp(0.5 + (r.horse.stats.scope + 0.08 * r.skill - hgt) / 0.25, 0.03, 0.97); r.alive = pre.rng() < p; if (!r.alive) r.outAt = hgt; }
    const alive = pre.rivals.filter(r => r.alive).length;
    pre.log.push(`${hgt.toFixed(2)} m: ${playerClear ? 'limpio' : 'falta'} · ${alive} rivales siguen`);
    if (this.profile && playerClear) { this.profile.records.power = Math.max(this.profile.records.power || 0, hgt); this.save(); }
    const last = pre.round >= pre.heights.length - 1;
    if (playerClear && alive > 0 && !last) { pre.round++; this.showMenu(); this.openModal(`<h2>Muro ${hgt.toFixed(2)} m superado</h2><p>${alive} rivales siguen en pie. Siguiente muro: ${pre.heights[pre.round].toFixed(2)} m.</p><div class="row"><button class="primary" data-a="power-next">Seguir</button></div>`); return; }
    const title = playerClear ? (alive === 0 ? '¡Ganaste la Potencia!' : '¡Muro máximo superado!') : `Eliminado en ${hgt.toFixed(2)} m`;
    const standing = pre.rivals.map(r => `<tr><td>${esc(r.name)}<br><small>${esc(r.horse.name)}</small></td><td>${r.alive ? 'sigue' : 'cayó en ' + r.outAt.toFixed(2) + ' m'}</td></tr>`).join('');
    this.show(`<div class="results"><header class="hub-h"><div class="hub-title"><b>Potencia</b><small>${title}</small></div></header><div class="results-body"><div class="log">${pre.log.map(l => `<div>${esc(l)}</div>`).join('')}</div><table><tbody>${standing}</tbody></table></div><footer class="hub-f"><button class="primary" data-a="menu">Menú</button></footer></div>`, 'results-screen');
    this.mood(playerClear ? 'win' : 'lose');
  }

  // ------------------------------------------------------------ ajustes
  settingsModal(inGame = false) {
    const s = this.settings; this.settingsInGame = inGame;
    const t = (k, label) => `<button class="toggle ${s[k] ? 'on' : ''}" data-a="set" data-k="${k}">${label}<i></i></button>`;
    this.openModal(`<h2>Ajustes</h2><div class="settings">
      ${t('sound', 'Efectos de sonido')}${t('music', 'Música')}${t('announcer', 'Locutor')}${t('haptics', 'Vibración')}${t('assist', 'Asistente de distancias')}${t('invertStick', 'Invertir dirección')}
      <div class="seg"><span>Repeticiones</span>${['all', 'faults', 'off'].map(q => `<button class="${(s.replays || 'faults') === q ? 'sel' : ''}" data-a="set" data-k="replays" data-v="${q}">${{ all: 'Todos los saltos', faults: 'Solo faltas', off: 'Nunca' }[q]}</button>`).join('')}</div>
      <div class="seg wrap"><span>Cámara</span>${CAM_MODES.map(q => `<button class="${s.cam === q ? 'sel' : ''}" data-a="set" data-k="cam" data-v="${q}">${CAM_NAMES[q]}</button>`).join('')}</div>
      <div class="seg"><span>Calidad</span>${['low', 'med', 'high'].map(q => `<button class="${s.quality === q ? 'sel' : ''}" data-a="set" data-k="quality" data-v="${q}">${{ low: 'Baja', med: 'Media', high: 'Alta' }[q]}</button>`).join('')}</div>
      <div class="seg"><span>Modelo de caballo</span>${['auto', 'procedural'].map(q => `<button class="${(s.horseModel || 'auto') === q ? 'sel' : ''}" data-a="set" data-k="horseModel" data-v="${q}">${{ auto: 'Archivo GLB si existe', procedural: 'Procedural' }[q]}</button>`).join('')}</div>
      <p class="muted">La calidad y el modelo se aplican al próximo recorrido. Colocá un caballo con esqueleto en <code>assets/models/horse.glb</code> para reemplazar el procedural.</p>
      ${this.profile && !inGame ? '<button class="danger" data-a="reset">Borrar carrera</button>' : ''}
      </div><div class="row"><button class="primary" data-a="${inGame ? 'resume-settings' : 'closemodal'}">Listo</button></div>`);
  }
}
