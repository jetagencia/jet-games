// Interfaz de la carrera: rancho (pestañas Caballo, Jinete, Cuidador, Concursos, Tienda), tareas del establo,
// paseo libre con modo foto, entrenamientos y resultados de las ligas. La lógica de números está en career.js.
// v2 (15-10-2026, revisión de abogado del diablo): objetivo siguiente e insignias, Esc en todas las pantallas,
// confirmaciones de compras y retiros, resumen de la noche, tareas por caballo, concordancia con yeguas.
import * as THREE from 'three';
import * as C from './career.js';
import { SPOTS } from './ranch.js';
import { COURSES, eventCourse, CONE_GATES, LAP } from './course.js';
import { GEARS } from './ride.js';
import { L as tr, tx, dec, T as TT } from './text.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const COIN = '<svg class="coin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#e8b93c" stroke="#a87a17" stroke-width="2"/><circle cx="12" cy="12" r="6" fill="none" stroke="#a87a17" stroke-width="1.5"/></svg>';
const STAR = (on) => `<span class="star${on ? ' on' : ''}" aria-hidden="true">★</span>`;
const pct = (v) => Math.round(Math.max(0, Math.min(100, v)));
const lvlOf = (v) => (v >= 60 ? 'ok' : v >= 30 ? 'warn' : 'bad');
const m2 = (v) => dec(v, 2);

export class CareerUI {
  constructor(ctx) {
    this.x = ctx; this.$ = ctx.$;
    this.p = C.load();
    this.tab = null; this.shopCat = 'cuidador';
    this.state = null;                       // ranch | stable | roam | photo (las demás las maneja main.js)
    this.buildDom();
  }
  save() { C.save(this.p); }
  get h() { return C.horseOf(this.p); }
  get done() { return C.tasksOf(this.p, this.h); }
  careStamp() { const h = this.h; return `${h.id}|${this.p.day}|${h.history.length}|${Object.keys(h.trainedToday).length}`; }
  // apariencia del caballo activo (pelaje, marcas y forma de la raza)
  applyLook() { const H = this.x.horse, h = this.h; H.setCoat(C.COATS[h.coat] || C.COATS.zaino, h.marks); H.setBreed(h.shape); }
  // potrero: tus otros caballos y, si son pocos, dos pensionados de los vecinos
  syncHerd() {
    const p = this.p, list = p.horses.filter((h) => h.id !== p.active).slice(0, 5).map(C.looks);
    for (const B of C.BOARDERS) if (list.length < 2) list.push(C.looks(B));
    this.x.herd.set(list);
  }
  hline(h) { const a = Math.floor(h.age); return `${(C.COATS[h.coat] || C.COATS.zaino).name} · ${esc(C.breedName(h))} · ${tr(`${a} años`, `${a} years old`)} · ${C.sexName(h.sex)}`; }
  // retratos: <img> que se completan de a uno por cuadro (no traban el panel)
  por(h, cls = '') {
    const L = C.looks(h), k = L.key + JSON.stringify(L.marks) + JSON.stringify(L.shape) + L.size;
    (this.porData = this.porData || new Map()).set(k, L);
    return `<img class="por ${cls}" data-pk="${esc(k)}" alt="" aria-hidden="true">`;
  }
  fillPortraits() {
    if (this.porRaf) return;
    const step = () => {
      this.porRaf = null;
      const img = document.querySelector('img.por[data-pk]:not([src])'); if (!img) return;
      const L = this.porData.get(img.dataset.pk);
      if (L) { try { img.src = this.x.portraits().get(L); } catch (e) { console.warn('retrato', e); img.removeAttribute('data-pk'); } } else img.removeAttribute('data-pk');
      this.porRaf = requestAnimationFrame(step);
    };
    this.porRaf = requestAnimationFrame(step);
  }
  statGrid(h) { return `<div class="sgrid">${C.STAT_KEYS.map((k) => `<div><small>${C.STATS[k].name}</small><b>${C.fmtStat(k, h.stats[k])}</b><em>${tr('potencial', 'potential')} ${C.fmtStat(k, h.pot[k])}</em></div>`).join('')}</div>`; }
  loadCare(force) { const h = this.h; this.x.horse.setCare({ dirt: h.dirt, sweat: h.sweat, wet: h.wet }, force ? null : this.careStamp()); }

  // ---------------------------------------------------------------- DOM fijo
  buildDom() {
    const $ = this.$;
    const spots = $('hub-spots');
    for (const [k] of Object.entries(SPOTS)) {
      const b = document.createElement('button'); b.className = 'spot'; b.dataset.spot = k; spots.appendChild(b);
    }
    this.spotTexts();
    $('hub').addEventListener('click', (e) => {
      const b = e.target.closest('[data-spot],[data-tab],[data-a]'); if (!b || b.disabled) return;
      if (b.dataset.spot) this.spot(b.dataset.spot);
      else if (b.dataset.tab) this.openTab(b.dataset.tab === this.tab ? null : b.dataset.tab);
      else this.action(b.dataset.a, b.dataset);
    });
    $('task').addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b && !b.disabled) this.taskAction(b.dataset.a, b.dataset); });
    $('roam-bar').addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) this.action(b.dataset.a, b.dataset); });
    $('photo').addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) this.action(b.dataset.a, b.dataset); });
    // botones de mantener pulsado (agua, cama)
    const hold = (on) => (e) => { const b = e.target.closest('[data-hold]'); if (on && (!b || b.disabled)) return; if (on) e.preventDefault(); this.holding = on ? b.dataset.hold : null; };
    $('task').addEventListener('pointerdown', hold(true)); for (const ev of ['pointerup', 'pointercancel']) $('task').addEventListener(ev, hold(false), true);
    $('task').addEventListener('pointerleave', (e) => { if (e.target.closest && e.target.closest('[data-hold]')) this.holding = null; }, true);
    // puntero sobre el lienzo: cepillar, duchar, recoger estiércol, girar y acercar la cámara de fotos
    const cv = this.x.canvas;
    cv.addEventListener('pointerdown', (e) => this.pointer('down', e));
    cv.addEventListener('pointermove', (e) => this.pointer('move', e));
    for (const ev of ['pointerup', 'pointercancel']) cv.addEventListener(ev, (e) => this.pointer('up', e));
    cv.addEventListener('wheel', (e) => { if (this.state === 'photo') { this.photoCam.dist = Math.max(1.6, Math.min(14, this.photoCam.dist * (e.deltaY > 0 ? 1.1 : 0.9))); e.preventDefault(); } }, { passive: false });
    // Escape: cierra el panel, sale del establo o del modo foto (sin ventana abierta)
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || this.$('modal').classList.contains('open') || performance.now() - (this.roamEndAt || 0) < 150) return;
      if (this.state === 'ranch' && this.tab) { this.openTab(null); e.preventDefault(); }
      else if (this.state === 'stable') { this.leaveStable(); e.preventDefault(); }
      else if (this.state === 'photo') { this.endPhoto(); e.preventDefault(); }
    });
  }

  spotTexts() { for (const b of this.$('hub-spots').children) { const S = SPOTS[b.dataset.spot]; b.innerHTML = `<b>${S.label}</b><small>${S.sub}</small>`; } }
  // cambio de idioma en vivo (evento 'jet-idioma', lo llama main.js): se repinta lo visible sin perder nada
  relang() {
    this.spotTexts();
    if (!this.p) return;
    this.renderTop();
    if (this.state === 'ranch') { if (this.tab) this.refresh(); }
    else if (this.state === 'stable' && this.task) {
      const k = this.task, d = this.done[k], lock = this.taskLocked(k);
      this.renderTaskList(); this.$('task-title').textContent = C.TASKS[k].name;
      if (d) { this.$('task-tip').textContent = tr('Hecha hoy. Puedes elegir otra tarea.', 'Done today. You can pick another task.'); if (!C.careLeft(this.p).length) this.allDone(); }
      else if (lock) this.$('task-tip').textContent = lock;
      else this.taskTip();
    } else if (this.state === 'roam') { this.roamIntro(); this.lastKmh = -1; }   // -1: el próximo cuadro repinta la marcha
    else if (this.state === 'photo') this.photoTip();
  }
  // consejo de la tarea en curso según cómo va (mismos textos que al empezarla)
  taskTip() {
    const k = this.task, $ = this.$, sub = this.sub || {}, tip = $('task-tip');
    if (k === 'cepillar') tip.textContent = tr('Arrastra el cepillo sobre el caballo. Gira para ver el otro lado.', 'Drag the brush over the horse. Turn the view to see the other side.');
    else if (k === 'duchar') tip.textContent = tr('Arrastra la manguera sobre el cuello, la zona de la montura y entre las patas.', 'Drag the hose over the neck, the saddle area and between the legs.');
    else if (k === 'cascos') { if (sub.hoof >= 0 && sub.hoof < 4) { tip.textContent = this.hoofTip(sub.hoof); $('hoof-n').textContent = tr(`${sub.hoof + 1} de 4`, `${sub.hoof + 1} of 4`); } }
    else if (k === 'comida') this.renderRation();
    else if (k === 'agua') { tip.textContent = tr('Mantén pulsado para llenar el balde y suelta en la marca blanca. Si se desborda, se moja la cama.', 'Press and hold to fill the bucket and let go at the white line. If it overflows, the bedding gets wet.'); const b = $('task-tools').querySelector('[data-hold=water] span'); if (b) b.textContent = tr('Mantén pulsado para llenar', 'Press and hold to fill'); }
    else if (k === 'limpiarBox') {
      tip.textContent = sub.left ? tr(`Toca cada montón de estiércol para sacarlo (${sub.left}).`, `Tap each pile of manure to remove it (${sub.left}).`) : tr('Ahora esparce paja nueva.', 'Now spread fresh straw.');
      const b = $('task-tools').querySelector('[data-hold=bed] span'); if (b) b.textContent = sub.left ? tr('Primero retira el estiércol', 'Remove the manure first') : tr('Mantén pulsado para esparcir paja', 'Press and hold to spread straw');
    } else if (k === 'ensillar') this.renderTack();
  }
  hoofTip(i) {
    const names = tr(['de la mano izquierda', 'de la mano derecha', 'del pie izquierdo', 'del pie derecho'], ['Front left', 'Front right', 'Hind left', 'Hind right']);
    return tr(`Casco ${names[i]}: raspa el barro y quita las piedras.`, `${names[i]} hoof: scrape off the mud and remove the stones.`);
  }

  // ---------------------------------------------------------------- rancho
  enterRanch() {
    if (!this.p) { this.p = C.newProfile(); this.save(); this.firstTime = true; }
    const $ = this.$, p = this.p;
    this.state = 'ranch'; this.x.setState('ranch');
    for (const id of ['menu', 'hud', 'task', 'photo', 'roam-bar']) $(id).classList.add('hidden');
    $('hoof').classList.add('hidden');
    $('hub').classList.remove('hidden'); document.body.classList.remove('in-task');
    const H = this.x.horse, h = this.h;
    H.moveTo(this.x.ranch.scene); H.showRider(false); H.setTack({ saddle: false, bridle: false });
    this.applyLook(); this.loadCare(); this.syncHerd(); this.x.herd.setVisible(true);
    H.root.position.set(24, 0, 9); H.root.rotation.y = -0.9; H.idleAlt = true; H.idleClip = 'idle2';
    this.x.ranch.camTo('home', 0.01); this.x.ranch.follow(10, 2);
    // un concurso que quedó a medias (se cerró el juego en la pista) cuenta como retiro
    const lost = C.settlePending(p); if (lost) { this.save(); setTimeout(() => this.toast(tr('Concurso anterior: retiro', 'Previous show: withdrawn'), 'warn', tr('Se cerró el juego durante el recorrido; la inscripción no se devuelve.', 'The game was closed during the round; the entry fee is not refunded.')), 400); }
    this.renderTop(); this.openTab(this.tab);
    if (this.firstTime) { this.firstTime = false; this.intro(); }
  }
  intro() {
    this.x.openModal(tr(`<div class="eyebrow">Tu rancho</div><h2 id="modal-title">Te damos la bienvenida al Establo JET</h2>
      <p>Heredaste un rancho y a <b>Henry</b>, un zaino de nueve años con mucho que dar. Cuídalo, entrénalo y llévalo de la liga Club al Gran Premio.</p>
      <ul class="intro"><li><b>Cuidador</b>: las tareas del establo dan monedas y mejoran su confianza.</li><li><b>Caballo</b>: su estado, sus atributos, entrenar y el paseo libre.</li><li><b>Concursos</b>: las ligas de salto.</li><li><b>Jinete</b>: tus habilidades. <b>Tienda</b>: equipo, mejoras del rancho, caballos de muchas razas (cambian cada día) y la yeguada para criar.</li></ul>
      <p>Henry está sucio y tiene hambre: empieza por el establo.</p>
      <div class="btns"><button class="btn primary" data-a="go-stable" data-autofocus><span>Ir al establo</span><span aria-hidden="true">→</span></button><button class="btn" data-a="close"><span>Explorar el rancho</span></button></div>`,
    `<div class="eyebrow">Your ranch</div><h2 id="modal-title">Welcome to the JET Stable</h2>
      <p>You inherited a ranch and <b>Henry</b>, a nine-year-old bay with a lot to give. Care for him, train him and take him from the Club league to the Grand Prix.</p>
      <ul class="intro"><li><b>Groom</b>: stable chores earn coins and build his confidence.</li><li><b>Horse</b>: his condition, his attributes, training and free roaming.</li><li><b>Shows</b>: the show jumping leagues.</li><li><b>Rider</b>: your skills. <b>Shop</b>: equipment, ranch upgrades, horses of many breeds (they change every day) and the stud farm for breeding.</li></ul>
      <p>Henry is dirty and hungry: start at the stable.</p>
      <div class="btns"><button class="btn primary" data-a="go-stable" data-autofocus><span>Go to the stable</span><span aria-hidden="true">→</span></button><button class="btn" data-a="close"><span>Explore the ranch</span></button></div>`));
  }
  renderTop() {
    const p = this.p, L = C.LEAGUES[p.league], $ = this.$;
    const t = tr;
    $('hub-day').innerHTML = `${t('Día', 'Day')} ${p.day}<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.5 3a8.5 8.5 0 1 0 6.4 14.1A7 7 0 0 1 14.5 3z"/></svg>`; $('hub-day').title = t('Terminar el día', 'End the day');
    $('hub-coins').innerHTML = `${COIN}<b>${p.coins}</b><span class="vh"> ${t('monedas', 'coins')}</span>`;
    $('hub-rep').textContent = L.qual ? t(`Liga ${L.name} · reputación ${Math.min(L.rep, p.rep[L.key] || 0)} de ${L.rep}`, `${L.name} league · reputation ${Math.min(L.rep, p.rep[L.key] || 0)} of ${L.rep}`) : t(`Liga ${L.name}`, `${L.name} league`);
    const G = C.nextGoal(p), goal = $('hub-goal');
    goal.innerHTML = `<small>${t('Siguiente', 'Next')}</small><b>${esc(G.text)}</b>`; goal.dataset.go = G.go;
    // insignias: puntos de habilidad, tareas pendientes, clasificatorio abierto
    const pending = C.careLeft(p).length;
    const qualOpen = L.qual && (p.rep[L.key] || 0) >= L.rep;
    const badge = { jinete: p.rider.points, cuidador: pending, concursos: qualOpen ? '!' : 0 };
    for (const b of $('hub-tabs').querySelectorAll('[data-tab]')) { const n = badge[b.dataset.tab]; let s = b.querySelector('.badge'); if (n) { if (!s) { s = document.createElement('span'); s.className = 'badge'; b.appendChild(s); } s.textContent = n; } else if (s) s.remove(); }
  }
  // carteles: siguen a los edificios en la pantalla, sin taparse entre sí ni salirse del borde
  ranchFrame(dt) {
    const R = this.x.ranch, H = this.x.horse;
    H.update(dt, { v: 0, turn: 0, jump: null });
    // reposos del autor y ratos de pastar (un ciclo completo del clip «eat» son 7,7 s)
    this.idleT = (this.idleT || 0) - dt; if (this.idleT <= 0) { const o = ['idle2', 'idle3', 'eat', 'eat']; H.idleClip = o[(Math.random() * o.length) | 0]; this.idleT = H.idleClip === 'eat' ? 15.3 : 8 + Math.random() * 6; }
    this.x.herd.update(dt, [{ x: H.root.position.x, z: H.root.position.z, h: Math.PI / 2 - H.root.rotation.y }]);
    R.update(dt);
    const w = innerWidth, hh = innerHeight, placed = [], top = (this.$('hub').querySelector('.hub-top')?.getBoundingClientRect().bottom || 50) + 6;
    for (const b of this.$('hub-spots').children) {
      const s = R.spotScreen(b.dataset.spot, w, hh);
      b.style.display = s.on && !this.tab ? '' : 'none';
      if (b.style.display) continue;
      const bw = b.offsetWidth || 110, bh = (b.offsetHeight || 44) + 6;
      let x = Math.max(bw / 2 + 6, Math.min(w - bw / 2 - 6, s.x)), y = Math.max(bh + top, Math.min(hh - 90, s.y));
      for (let k = 0; k < 5; k++) {
        const hit = placed.find((r) => Math.abs(r.x - x) < (r.w + bw) / 2 + 4 && Math.abs(r.y - y) < bh);
        if (!hit) break;
        y = hit.y - bh; if (y < bh + top) { y = hit.y; x = hit.x + (x >= hit.x ? 1 : -1) * ((hit.w + bw) / 2 + 6); }
      }
      placed.push({ x, y, w: bw });
      b.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    }
  }
  spot(k) {
    if (k === 'establo') return this.enterStable();
    if (k === 'potrero') return this.startRoam();
    if (k === 'pista') return this.openTab('entrenar');
    if (k === 'camion') return this.openTab('concursos');
    if (k === 'guadarnes') return this.openTab('tienda');
  }
  openTab(t) {
    this.tab = t; const $ = this.$, P = $('hub-panel');
    for (const b of $('hub-tabs').querySelectorAll('[data-tab]')) b.setAttribute('aria-pressed', b.dataset.tab === t || (t === 'entrenar' && b.dataset.tab === 'caballo') ? 'true' : 'false');
    $('hub').classList.toggle('panel-open', !!t);
    if (!t) { P.classList.remove('open'); this.x.ranch.camTo('home'); return; }
    P.classList.add('open');
    const cams = { caballo: [[30, 2.6, 16], [24, 1.2, 9]], entrenar: SPOTS.pista.cam, jinete: SPOTS.camion.cam, cuidador: SPOTS.establo.cam, concursos: SPOTS.camion.cam, tienda: SPOTS.guadarnes.cam };
    this.x.ranch.camTo(cams[t] || 'home');
    $('hub-panel-body').innerHTML = this['panel_' + t]();
    $('hub-panel-body').scrollTop = 0; this.fillPortraits();
  }
  refresh() { this.renderTop(); if (this.tab) { const b = this.$('hub-panel-body'), s = b.scrollTop; b.innerHTML = this['panel_' + this.tab](); b.scrollTop = s; this.fillPortraits(); } this.save(); }

  // ---------------------------------------------------------------- paneles
  bar(v, max = 100, cls) { return `<i class="bar ${cls || lvlOf(v / max * 100)}"><b style="width:${pct(v / max * 100)}%"></b></i>`; }
  panel_caballo() {
    const p = this.p, h = this.h, N = h.needs, f = C.form(h);
    const needs = Object.entries(C.NEEDS).map(([k, D]) => `<div class="need"><span>${D.name}</span>${this.bar(N[k])}<em>${pct(N[k])}</em></div>`).join('');
    const stats = C.STAT_KEYS.map((k) => {
      const v = h.stats[k], pot = h.pot[k], sal = k === 'salto';
      const vv = sal ? (v - 0.9) / 0.9 * 100 : v, pp = sal ? (pot - 0.9) / 0.9 * 100 : pot;
      return `<details class="stat"><summary><span>${C.STATS[k].name}</span><i class="bar stat"><b style="width:${pct(vv)}%"></b><u style="left:${pct(pp)}%"></u></i><em>${C.fmtStat(k, v)}</em></summary><p>${C.STATS[k].desc} ${tr('Potencial', 'Potential')}: ${C.fmtStat(k, pot)}.</p></details>`;
    }).join('');
    const issues = C.readiness(h);
    const pend = p.breeding || [];
    const foals = pend.length ? ` · ${tr(pend.length === 1 ? 'un potrillo en camino' : `${pend.length} potrillos en camino`, pend.length === 1 ? 'one foal on the way' : `${pend.length} foals on the way`)}` : '';
    const others = `<h3>${tr('Tus caballos', 'Your horses')} <small>(${tr(`${p.horses.length} de ${p.boxes} boxes`, `${p.horses.length} of ${p.boxes} stalls`)}${foals})</small></h3>
      <div class="hlist">${p.horses.map((x) => `<div class="hcard${x.id === p.active ? ' sel' : ''}">${this.por(x)}<div><b>${esc(x.name)}</b><small>${this.hline(x)}</small><small class="gain">${tr('Salto', 'Jumping')} ${C.fmtStat('salto', x.stats.salto)} · ${tr('potencial', 'potential')} ${C.fmtStat('salto', x.pot.salto)}</small></div>
        <div class="hbtns">${x.id === p.active ? `<span class="lock">${tr('Activo', 'Active')}</span>` : `<button class="btn sm primary" data-a="pick-horse" data-id="${x.id}"><span>${tr('Elegir', 'Choose')}</span></button>`}<button class="btn sm" data-a="horse-info" data-id="${x.id}"><span>${tr('Ficha', 'Profile')}</span></button></div></div>`).join('')}</div>
      <p class="note">${tr('Más caballos en la Tienda (sección Caballos, cambia cada día) o criando en la yeguada (sección Cría).', 'More horses in the Shop (Horses section, it changes every day) or by breeding at the stud farm (Breeding section).')}</p>`;
    return `<div class="eyebrow">${tr('Caballo', 'Horse')}</div><h2>${esc(h.name)}</h2>
      <p class="meta">${this.hline(h)}</p>
      ${issues.length ? `<p class="warn">${tr(`Hoy ${issues.join(', ')}.`, `Today ${esc(h.name)} ${C.list(issues)}.`)}</p>` : ''}
      <div class="btns two"><button class="btn primary" data-a="roam"><span>${tr('Paseo libre', 'Free roam')}<small>${tr('Suelto por el rancho: +ánimo, +vínculo', 'Loose around the ranch: +mood, +bond')}</small></span></button>
      <button class="btn" data-a="tab" data-t="entrenar"><span>${tr('Entrenar', 'Train')}<small>${tr('Sube sus atributos en la pista', 'Raise its attributes in the arena')}</small></span></button></div>
      <div class="hero"><div><small>${tr('Forma de hoy', 'Today’s form')}</small><b>${C.formWord(f)}</b></div><div><small>${tr('Confianza inicial', 'Starting confidence')}</small><b>${Math.round(C.confidenceStart(p, h))} %</b></div><div><small>${tr('Vínculo', 'Bond')}</small><b>${pct(h.bond)}</b></div></div>
      <p class="note">${tr('La forma sale de la energía, la salud, el ánimo, la comida y el agua: con mala forma galopa más lento y salta con menos margen. La confianza inicial sube con el vínculo, el ánimo y la limpieza; si baja mucho en el recorrido, puede rehusar.', 'Form comes from energy, health, mood, food and water: in poor form the horse canters slower and jumps with less clearance. Starting confidence rises with bond, mood and cleanliness; if it drops too much during the round, the horse may refuse.')}</p>
      <h3>${tr('Estado', 'Condition')}</h3><div class="needs">${needs}</div>
      <h3>${tr('Atributos', 'Attributes')} <small>${tr('(toca uno para ver qué hace; la marca es su potencial)', '(tap one to see what it does; the mark is its potential)')}</small></h3><div class="stats">${stats}</div>${others}`;
  }
  panel_entrenar() {
    const p = this.p, h = this.h;
    const cards = Object.entries(C.TRAININGS).map(([k, T]) => {
      const locked = T.unlock && !p.owned[T.unlock], done = h.trainedToday[k], tired = h.needs.energia < T.energy;
      const gains = Object.entries(T.stats).map(([s, gn]) => `${C.STATS[s].name.toLowerCase()} ${s === 'salto' ? `+${Math.round(gn * 100)} cm` : `+${gn}`}`).join(', ');
      return `<div class="card2${locked ? ' locked' : ''}"><div><b>${T.name}</b><small>${T.desc}</small><small class="gain">${tr('Hasta', 'Up to')} ${gains} · ${tr('energía', 'energy')} −${T.energy}${done ? tr(' · ya entrenado hoy: rinde menos', ' · already trained today: less effective') : ''}</small></div>
        ${locked ? `<span class="lock">${tr(`Requiere ${C.SHOP[T.unlock].name} (Tienda)`, `Requires ${C.SHOP[T.unlock].name} (Shop)`)}</span>` : tired ? `<span class="lock">${tr('Le falta energía', 'Not enough energy')}</span>` : `<button class="btn primary sm" data-a="train" data-k="${k}"><span>${tr('Entrenar', 'Train')}</span></button>`}</div>`;
    }).join('');
    return `<div class="eyebrow">${tr('Pista de entrenamiento', 'Training arena')}</div><h2>${tr(`Entrenar a ${esc(h.name)}`, `Train ${esc(h.name)}`)}</h2>
      <p>${tr('Cada sesión se juega en la pista. Cuanto mejor la hagas, más suben sus atributos (hasta su potencial). Energía de hoy:', 'Each session is played in the arena. The better you do, the more its attributes rise (up to its potential). Energy today:')} <b>${pct(h.needs.energia)}</b>.</p>
      <div class="cards">${cards}</div>`;
  }
  panel_jinete() {
    const R = this.p.rider, lv = C.riderLevel(R.xp), next = C.riderNext(lv), prev = lv > 1 ? C.riderNext(lv - 1) : 0;
    const sk = Object.entries(C.SKILLS).map(([k, S]) => `<div class="skill"><div><b>${S.name}</b> <span class="pips" aria-label="${tr(`${R.skills[k]} de 5`, `${R.skills[k]} of 5`)}">${[0, 1, 2, 3, 4].map((i) => `<i class="${i < R.skills[k] ? 'on' : ''}"></i>`).join('')}</span><small>${S.desc}</small></div>
      <button class="btn sm${R.points ? ' primary' : ''}" data-a="skill" data-k="${k}" ${R.points < 1 || R.skills[k] >= 5 ? 'disabled' : ''} aria-label="${tr(`Mejorar ${S.name}`, `Improve ${S.name}`)}"><span>+</span></button></div>`).join('');
    const log = this.p.log.slice(-8).reverse().map((l) => `<p class="log"><small>${tr('Día', 'Day')} ${l.day}</small> ${esc(tx(l.t))}</p>`).join('');
    const pts = R.points;
    return `<div class="eyebrow">${tr('Jinete', 'Rider')}</div><h2>${tr('Nivel', 'Level')} ${lv}</h2>
      <div class="kv"><span>${tr('Experiencia', 'Experience')}</span>${this.bar(R.xp - prev, Math.max(1, next - prev), 'xp')}<em>${R.xp} / ${next}</em></div>
      <p class="meta">${tr(`Concursos: ${R.starts} · Victorias: ${R.wins} · Recorridos sin penalizaciones: ${R.clears}`, `Shows: ${R.starts} · Wins: ${R.wins} · Clear rounds: ${R.clears}`)}</p>
      <h3>${tr('Habilidades', 'Skills')}</h3>${pts ? `<p class="ok"><b>${tr(`Tienes ${pts} punto${pts > 1 ? 's' : ''} para repartir.`, `You have ${pts} point${pts > 1 ? 's' : ''} to spend.`)}</b></p>` : `<p class="note">${tr('Cada nivel de jinete da un punto de habilidad. La experiencia se gana en concursos y entrenamientos.', 'Each rider level gives you a skill point. You earn experience at shows and training sessions.')}</p>`}<div class="skills">${sk}</div>
      <h3>${tr('Registro', 'Log')}</h3>${log}`;
  }
  panel_cuidador() {
    const g = this.p.groom, lv = C.groomLevel(g.xp), next = C.GROOM_LEVELS[lv + 1] ?? g.xp, h = this.h, done = this.done;
    const tasks = Object.entries(C.TASKS).map(([k, T]) => { const d = done[k], off = !d && this.taskLocked(k);
      return `<div class="task${d ? ' done' : off ? ' off' : ''}"><span class="chk" aria-hidden="true">${d ? '✓' : ''}</span><div><b>${T.name}</b><small>${off || T.desc}</small></div><em>${d ? tr('Hecha', 'Done') : off ? '' : `${COIN}${Math.round(T.reward * (1 + 0.15 * lv))}`}</em></div>`; }).join('');
    return `<div class="eyebrow">${tr('Cuidador', 'Groom')}</div><h2>${C.groomTitle(lv)}</h2>
      <div class="btns"><button class="btn primary" data-a="stable"><span>${tr('Ir al establo', 'Go to the stable')}</span><span aria-hidden="true">→</span></button></div>
      <div class="kv"><span>${tr('Experiencia', 'Experience')}</span>${this.bar(g.xp - C.GROOM_LEVELS[lv], Math.max(1, next - C.GROOM_LEVELS[lv]), 'xp')}<em>${g.xp} / ${next}</em></div>
      <p>${tr(`Tareas de hoy con ${esc(h.name)}: dan monedas y experiencia, y mejoran su ánimo, su salud y su confianza. Con más nivel, cada tarea paga más.`, `Today’s chores with ${esc(h.name)}: they earn coins and experience, and improve mood, health and confidence. The higher your level, the more each chore pays.`)}</p>
      <div class="tasks">${tasks}</div>`;
  }
  panel_concursos() {
    const p = this.p, h = this.h;
    // recomendado: el clasificatorio si está abierto; si no, el primer concurso posible sin tres estrellas
    const cur = C.LEAGUES[p.league], qOpen = cur.qual && (p.rep[cur.key] || 0) >= cur.rep;
    const curList = [...(qOpen ? [cur.qual] : []), ...cur.events];
    const ok = (E) => !C.cantCompete(p, h, E);
    const rec = (curList.find((E) => ok(E) && (p.stars[E.key] || 0) < 3) || curList.find(ok))?.key;
    const lg = C.LEAGUES.map((L, i) => {
      const lname = (Lg) => tr(`Liga ${Lg.name}`, `${Lg.name} league`);
      if (i > p.league) return `<div class="league locked"><b>${lname(L)}</b><small>${tr(`Gana el clasificatorio de la liga ${C.LEAGUES[i - 1].name} para entrar.`, `Win the ${C.LEAGUES[i - 1].name} league qualifier to get in.`)}</small></div>`;
      const rep = p.rep[L.key] || 0;
      const ev = (E, q) => {
        const st = p.stars[E.key] || 0, open = !q || rep >= L.rep, why = open && C.cantCompete(p, h, E), again = (p.today?.shows?.[E.key] || 0) > 0;
        return `<div class="event${q ? ' qual' : ''}${open ? '' : ' locked'}"><div><b>${E.name}</b><small>${tr('Hasta', 'Up to')} ${m2(E.h)} m · <span class="nw">${tr('inscripción', 'entry')} ${COIN}${L.fee}</span> · <span class="nw">${tr('premio', 'prize')} ${COIN}${L.prize}</span>${again ? tr(' · ya participaste hoy: paga la mitad', ' · already entered today: half rewards') : ''}</small>
          <span class="stars" aria-label="${tr(`${st} de 3 estrellas`, `${st} of 3 stars`)}">${[1, 2, 3].map((s) => STAR(s <= st)).join('')}</span></div>
          ${!open ? `<span class="lock">${tr(`Reputación ${rep} de ${L.rep}`, `Reputation ${rep} of ${L.rep}`)}</span>` : why ? `<span class="lock">${esc(why)}</span>` : `<button class="btn sm${E.key === rec ? ' primary' : ''}" data-a="event" data-k="${E.key}"><span>${tr('Inscribirse', 'Enter')}</span></button>`}</div>`;
      };
      return `<div class="league${i === p.league ? ' cur' : ''}"><div class="lh"><b>${lname(L)}</b>${L.qual ? `<span>${tr(`Reputación ${Math.min(rep, L.rep)} de ${L.rep}`, `Reputation ${Math.min(rep, L.rep)} of ${L.rep}`)}</span>${this.bar(rep, L.rep, 'xp')}` : ''}</div>
        ${L.events.map((E) => ev(E, false)).join('')}${L.qual ? ev(L.qual, true) : ''}</div>`;
    }).join('');
    const tack = h.tack.saddled ? tr(C.g(h, 'ensillado', 'ensillada'), 'tacked up') : tr('sin ensillar', 'not tacked up');
    return `<div class="eyebrow">${tr('Concursos', 'Shows')}</div><h2>${tr('Ligas de salto', 'Show jumping leagues')}</h2>
      <p>${tr('Cada recorrido da reputación: más con menos penalizaciones y mejor puesto. Con la reputación de la liga se abre el clasificatorio; ganarlo te pasa a la liga siguiente. Repetir un concurso el mismo día paga la mitad.', 'Every round earns reputation: more with fewer faults and a better placing. With enough league reputation the qualifier opens; winning it moves you up to the next league. Repeating a show on the same day pays half.')}</p>
      <p class="meta">${esc(h.name)}: ${tr('salto', 'jumping')} ${C.fmtStat('salto', h.stats.salto)} · ${tr('energía', 'energy')} ${pct(h.needs.energia)} · ${tack} · ${tr('concursos hoy', 'shows today')}: ${h.showsToday || 0} ${tr('de', 'of')} ${C.MAX_SHOWS_DAY}</p>${lg}`;
  }
  panel_tienda() {
    const p = this.p, cats = [['cuidador', tr('Cuidador', 'Groom')], ['comida', tr('Comida', 'Feed')], ['equipo', tr('Equipo', 'Gear')], ['rancho', tr('Rancho', 'Ranch')], ['caballos', tr('Caballos', 'Horses')], ['cria', tr('Cría', 'Breeding')]];
    const tabs = `<div class="seg" role="tablist">${cats.map(([k, n]) => `<button role="tab" aria-selected="${k === this.shopCat}" data-a="shopcat" data-k="${k}">${n}</button>`).join('')}</div>`;
    const price = (n, a, k) => p.coins >= n ? `<button class="btn sm price" data-a="${a}" data-k="${k}"><span>${COIN}${n}</span></button>` : `<span class="lock">${COIN}${n}<br>${tr(`te faltan ${n - p.coins}`, `${n - p.coins} short`)}</span>`;
    let items;
    if (this.shopCat === 'caballos') {
      const card = (M) => { const why = C.buyReason(p, M);
        return `<button class="hcard buy${why ? ' locked' : ''}" data-a="horse-offer" data-k="${M.id}">${this.por(M)}<div><b>${esc(M.name)}</b><small>${this.hline(M)}</small><small class="gain">${tr('Salto', 'Jumping')} ${C.fmtStat('salto', M.stats.salto)} · ${tr('potencial', 'potential')} ${C.fmtStat('salto', M.pot.salto)}</small></div>
          <span class="${why ? 'lock' : 'pricetag'}">${why ? esc(why) : `${COIN}${M.price}`}</span></button>`; };
      const today = C.marketToday(p), feat = C.MARKET.filter((M) => M.league <= p.league + 1);
      items = `<h3>${tr('Mercado de hoy', 'Today’s market')} <small>${tr('(cambia cada mañana)', '(changes every morning)')}</small></h3><div class="hlist">${today.map(card).join('') || `<p class="note">${tr('Ya compraste todo lo de hoy.', 'You already bought everything on offer today.')}</p>`}</div>
        <h3>${tr('Destacados', 'Featured')}</h3><div class="hlist">${feat.map(card).join('')}</div>
        <p class="note">${tr(`Boxes ocupados: ${p.horses.length + (p.breeding || []).length} de ${p.boxes}.`, `Stalls in use: ${p.horses.length + (p.breeding || []).length} of ${p.boxes}.`)}${C.freeBoxes(p) < 1 ? tr(' Para otro caballo, amplía el establo (sección Rancho).', ' For another horse, expand the stable (Ranch section).') : ''} ${tr(`Cada caballo suma ${C.BOARD_LEAGUE[p.league]} monedas de pensión por día.`, `Each horse adds ${C.BOARD_LEAGUE[p.league]} coins of board per day.`)}</p>`;
    } else if (this.shopCat === 'cria') {
      items = this.criaHtml();
    } else {
      items = Object.entries(C.SHOP).filter(([, I]) => I.cat === this.shopCat).map(([k, I]) => {
        const own = !I.stack && !I.service && p.owned[k], n = p.inv[k] || 0;
        const use = own && I.look ? (String(p.leather) === String(I.look.leather) ? `<span class="lock">${tr('En uso', 'In use')}</span>` : `<button class="btn sm" data-a="leather" data-k="${k}"><span>${tr('Usar', 'Use')}</span></button>`) : null;
        return `<div class="card2"><div><b>${I.name}</b><small>${I.desc}${I.stack && n ? tr(` · tienes ${n}`, ` · you have ${n}`) : ''}</small></div>
          ${use || (own ? `<span class="lock">${tr('Comprado', 'Bought')}</span>` : price(I.price, 'buy', k))}</div>`;
      }).join('');
      if (this.shopCat === 'rancho') items = `<div class="card2"><div><b>${tr('Ampliar el establo', 'Expand the stable')}</b><small>${tr(`Un box más para otro caballo o un potrillo. Tienes ${p.boxes} de ${C.BOX_MAX}.`, `One more stall for another horse or a foal. You have ${p.boxes} of ${C.BOX_MAX}.`)}</small></div>${p.boxes >= C.BOX_MAX ? `<span class="lock">${tr('Completo', 'Full')}</span>` : price(C.boxPrice(p), 'buybox', 'box')}</div>
        <div class="card2"><div><b>${tr('Mozo de cuadra', 'Stable hand')}</b><small>${tr(`Cada noche da la ración, el agua y limpia el box de tus otros caballos (al activo lo cuidas tú). Cobra ${C.MOZO_WAGE} monedas por caballo y por día.`, `Every night they feed and water your other horses and muck out their stalls (you look after the active one). Paid ${C.MOZO_WAGE} coins per horse per day.`)}</small></div>${p.staff.mozo ? `<button class="btn sm" data-a="mozo"><span>${tr('Dar de baja', 'Let go')}</span></button>` : `<button class="btn sm primary" data-a="mozo"><span>${tr('Contratar', 'Hire')}</span></button>`}</div>` + items;
      if (this.shopCat === 'equipo' && p.leather) items += `<div class="card2"><div><b>${tr('Cuero marrón', 'Brown leather')}</b><small>${tr('El de siempre.', 'The original one.')}</small></div><button class="btn sm" data-a="leather" data-k=""><span>${tr('Usar', 'Use')}</span></button></div>`;
    }
    return `<div class="eyebrow">${tr('Guadarnés', 'Tack room')}</div><h2>${tr('Tienda', 'Shop')}</h2>${tabs}<div class="cards">${items}</div>`;
  }

  // cría: elegir yegua y padrillo (tuyo o de la cabaña vecina), ver qué se puede esperar y cruzar
  criaHtml() {
    const p = this.p;
    if (!p.owned.haras) { const I = C.SHOP.haras; return `<div class="card2"><div><b>${I.name}</b><small>${I.desc} ${tr(`El potrillo nace a los ${C.BREED_DAYS} días, ya domado, con tres años, y hereda lo mejor (o no tanto) de sus padres.`, `The foal is born after ${C.BREED_DAYS} days, already broken in, three years old, and inherits the best (or not quite) of its parents.`)}</small></div>${p.coins >= I.price ? `<button class="btn sm price" data-a="buy" data-k="haras"><span>${COIN}${I.price}</span></button>` : `<span class="lock">${COIN}${I.price}<br>${tr(`te faltan ${I.price - p.coins}`, `${I.price - p.coins} short`)}</span>`}</div>`; }
    const mares = p.horses.filter((h) => h.sex === 'yegua');
    if (!mares.length) return `<p class="note">${tr('Para criar necesitas una yegua: búscala en la sección Caballos.', 'To breed you need a mare: look for one in the Horses section.')}</p>`;
    if (!mares.some((m) => m.id === this.criaMare)) this.criaMare = mares[0].id;
    const sires = [...p.horses.filter((h) => h.sex === 'semental').map((h) => ({ ...h, fee: C.OWN_SIRE_FEE, own: true, league: 0 })), ...C.STUDS];
    if (!sires.some((s) => s.id === this.criaSire)) this.criaSire = sires[0].id;
    const chip = (h, sel, a, extra = '') => `<button class="hcard pickc${sel ? ' sel' : ''}${h.league > p.league ? ' locked' : ''}" data-a="${a}" data-id="${h.id}" aria-pressed="${sel}">${this.por(h)}<div><b>${esc(h.name)}</b><small>${esc(C.breedName(h))} · ${(C.COATS[h.coat] || C.COATS.zaino).name}</small><small class="gain">${tr('Salto potencial', 'Jumping potential')} ${C.fmtStat('salto', h.pot.salto)}${extra}</small></div></button>`;
    const why = C.breedCheck(p, this.criaMare, this.criaSire), R = C.foalRange(p, this.criaMare, this.criaSire), S = C.sireOf(p, this.criaSire);
    const pend = (p.breeding || []).map((b) => `<p class="log"><small>${tr('Día', 'Day')} ${b.due}</small> ${tr('Potrillo de', 'Foal of')} ${esc(b.mareName)} × ${esc(b.sireName)}</p>`).join('');
    return `<h3>${tr('Yegua', 'Mare')}</h3><div class="hlist">${mares.map((m) => chip(m, m.id === this.criaMare, 'cria-mare')).join('')}</div>
      <h3>${tr('Semental', 'Stallion')}</h3><div class="hlist">${sires.map((s) => chip(s, s.id === this.criaSire, 'cria-sire', s.own ? tr(' · tuyo', ' · yours') : s.league > p.league ? tr(` · desde la liga ${C.LEAGUES[s.league].name}`, ` · from the ${C.LEAGUES[s.league].name} league`) : tr(` · servicio ${s.fee}`, ` · fee ${s.fee}`))).join('')}</div>
      ${R ? `<div class="foal"><b>${tr('Lo que se puede esperar', 'What to expect')}</b><small>${tr(`Salto potencial entre ${C.fmtStat('salto', R.lo)} y ${C.fmtStat('salto', R.hi)}${R.cruza ? '. Al ser una cruza, mezcla la forma y el tamaño de las dos razas' : ''}. Nace a los ${C.BREED_DAYS} días y ocupa un box.`, `Jumping potential between ${C.fmtStat('salto', R.lo)} and ${C.fmtStat('salto', R.hi)}${R.cruza ? '. As a crossbreed, it mixes the build and size of both breeds' : ''}. Born after ${C.BREED_DAYS} days; it takes up a stall.`)}</small></div>` : ''}
      <div class="btns">${why ? `<p class="note warn">${esc(why)}</p>` : `<button class="btn primary" data-a="cria-go"><span>${tr('Cruzar', 'Breed')} · ${COIN}${S.fee}</span></button>`}</div>
      ${pend ? `<h3>${tr('En la yeguada', 'At the stud farm')}</h3>${pend}` : ''}`;
  }
  // ficha de un caballo tuyo: retrato grande, atributos, nombre y venta
  horseInfo(id) {
    const p = this.p, h = p.horses.find((x) => x.id === id); if (!h) return;
    const why = C.canSell(p, id), marks = C.marksText(h);
    this.x.openModal(`<div class="hsheet">${this.por(h, 'big')}<div><div class="eyebrow">${esc(C.breedName(h))}</div><h2 id="modal-title">${esc(h.name)}</h2>
      <p class="meta">${this.hline(h)}${h.parents ? ` · ${tr(`${C.g(h, 'hijo', 'hija')} de`, `${C.g(h, 'son', 'daughter')} of`)} ${esc(h.parents)}` : ''}</p>${marks ? `<p class="note">${tr('Marcas', 'Markings')}: ${marks}.</p>` : ''}${this.statGrid(h)}</div></div>
      <div class="btns"><button class="btn" data-a="rename" data-id="${id}"><span>${tr('Cambiar el nombre', 'Rename')}</span></button>${why ? `<p class="note">${esc(why)}</p>` : `<button class="btn danger" data-a="sell" data-id="${id}"><span>${tr('Vender', 'Sell')} · ${COIN}${C.sellValue(h)}</span></button>`}<button class="btn primary" data-a="close" data-autofocus><span>${tr('Cerrar', 'Close')}</span></button></div>`, 'hmodal');
    this.fillPortraits();
  }
  askRename(id) {
    const h = this.p.horses.find((x) => x.id === id); if (!h) return;
    this.x.openModal(`<h2 id="modal-title">${tr(`Nombre de ${C.g(h, 'tu caballo', 'tu yegua')}`, `Your ${C.g(h, 'horse', 'mare')}’s name`)}</h2>
      <label class="field"><span>${tr('Nombre', 'Name')}</span><input id="rn-in" maxlength="16" autocomplete="off" value="${esc(h.name)}" data-autofocus></label><p class="note warn" id="rn-err"></p>
      <div class="btns"><button class="btn primary" data-a="rename-ok" data-id="${id}"><span>${tr('Guardar', 'Save')}</span></button><button class="btn" data-a="close"><span>${tr('Cancelar', 'Cancel')}</span></button></div>`);
    const inp = this.$('rn-in'); if (inp) { inp.select(); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.modalAction('rename-ok', { id }); } }); }
  }

  // ---------------------------------------------------------------- acciones del rancho
  action(a, d) {
    const p = this.p;
    if (a === 'tab') this.openTab(d.t);
    else if (a === 'goal') {
      const go = this.$('hub-goal').dataset.go;
      if (go === 'establo') this.enterStable(); else if (go === 'ensillar') this.enterStable('ensillar');
      else if (go.startsWith('tienda:')) { this.shopCat = go.slice(7); this.openTab('tienda'); } else this.openTab(go);
    }
    else if (a === 'hubmenu') this.x.openModal(`<h2 id="modal-title">${tr('Menú', 'Menu')}</h2>
      <div class="btns"><button class="btn" data-a="settings" data-autofocus><span>${tr('Ajustes', 'Settings')}</span></button><button class="btn" data-a="help"><span>${tr('Controles y reglas', 'Controls and rules')}</span></button>
      <button class="btn" data-a="home"><span>${tr('Menú principal', 'Main menu')}<small>${tr('Tu rancho queda guardado.', 'Your ranch is saved.')}</small></span></button><a class="btn" href="https://jetgames.fun/"><span>‹ JET//Games<small>${tr('Más juegos. Tu rancho queda guardado.', 'More games. Your ranch is saved.')}</small></span></a><button class="btn primary" data-a="close"><span>${tr('Volver al rancho', 'Back to the ranch')}</span></button></div>`, '', { re: () => this.action('hubmenu', {}) });
    else if (a === 'close-panel') this.openTab(null);
    else if (a === 'stable') this.enterStable();
    else if (a === 'roam') this.startRoam();
    else if (a === 'train') this.startTraining(d.k);
    else if (a === 'event') this.enterEvent(d.k);
    else if (a === 'skill') { if (C.spendSkill(p, d.k)) { this.toast(`${C.SKILLS[d.k].name}: ${tr('nivel', 'level')} ${p.rider.skills[d.k]}`, 'good'); this.refresh(); } }
    else if (a === 'shopcat') { this.shopCat = d.k; this.refresh(); }
    else if (a === 'buy') this.askBuy(d.k);
    else if (a === 'buyhorse') this.askBuyHorse(d.k);
    else if (a === 'leather') { p.leather = d.k ? C.SHOP[d.k].look.leather : null; this.toast(tr('Cuero cambiado', 'Leather changed'), 'good'); this.refresh(); }
    else if (a === 'pick-horse') { if (p.active !== d.id) { p.active = d.id; const h = this.h; this.applyLook(); this.loadCare(true); this.syncHerd(); this.toast(tr(`${h.name} es ahora tu caballo activo`, `${h.name} is now your active horse`), 'good'); this.refresh(); } }
    else if (a === 'horse-info') this.horseInfo(d.id);
    else if (a === 'horse-offer') this.askBuyHorse(d.k);
    else if (a === 'buybox') { if (C.buyBox(p)) { this.toast(tr(`Establo ampliado: ${p.boxes} boxes`, `Stable expanded: ${p.boxes} stalls`), 'good'); this.refresh(); } }
    else if (a === 'mozo') { p.staff.mozo = !p.staff.mozo; this.toast(p.staff.mozo ? tr('Contrataste un mozo de cuadra', 'You hired a stable hand') : tr('El mozo de cuadra ya no trabaja en el rancho', 'The stable hand no longer works at the ranch'), 'good', p.staff.mozo ? tr('Desde esta noche atiende a tus otros caballos.', 'Starting tonight, they look after your other horses.') : ''); this.refresh(); }
    else if (a === 'cria-mare') { this.criaMare = d.id; this.refresh(); }
    else if (a === 'cria-sire') { this.criaSire = d.id; this.refresh(); }
    else if (a === 'cria-go') { const m = p.horses.find((x) => x.id === this.criaMare), s = C.sireOf(p, this.criaSire); if (C.startBreeding(p, this.criaMare, this.criaSire)) { this.toast(`${m.name} × ${s.name}`, 'good', tr(`El potrillo llega en ${C.BREED_DAYS} días.`, `The foal arrives in ${C.BREED_DAYS} days.`)); this.refresh(); } }
    else if (a === 'endday') this.endDayAsk();
    else if (a === 'endday-ok') this.endDayDo();
    else if (a === 'home') { this.x.closeModal(); this.leaveTo('menu'); }
    else if (a === 'roam-end') this.endRoam();
    else if (a === 'photo') this.startPhoto();
    else if (a === 'photo-shot') this.takePhoto();
    else if (a === 'photo-end') this.endPhoto();
  }
  askBuy(k) {
    const I = C.SHOP[k], p = this.p;
    const go = () => { if (C.buy(p, k)) { this.toast(I.service ? tr(`El veterinario revisó a ${this.h.name}: +40 de salud`, `The vet checked ${this.h.name}: +40 health`) : tr(`Compraste: ${I.name}`, `You bought: ${I.name}`), 'good'); this.refresh(); } };
    if (I.price < 200) return go();
    this.confirmBuy = go;
    this.x.openModal(`<h2 id="modal-title">${tr(`¿Comprar ${esc(I.name.toLowerCase())}?`, `Buy ${esc(I.name.toLowerCase())}?`)}</h2><p>${I.desc}</p><p>${tr('Precio', 'Price')}: ${COIN}<b>${I.price}</b> · ${tr('te quedan', 'you will have')} ${COIN}${p.coins - I.price}${tr('.', ' left.')}</p>
      <div class="btns"><button class="btn primary" data-a="buy-ok" data-autofocus><span>${tr('Comprar', 'Buy')}</span></button><button class="btn" data-a="close"><span>${tr('Cancelar', 'Cancel')}</span></button></div>`);
  }
  askBuyHorse(id) {
    const p = this.p, M = C.offerOf(p, id); if (!M) return;
    const why = C.buyReason(p, M) || (p.coins < M.price ? tr(`Te faltan ${M.price - p.coins} monedas`, `You are ${M.price - p.coins} coins short`) : ''), marks = C.marksText(M), B = C.BREEDS[M.bk];
    this.confirmBuy = () => { const name = M.name; if (C.buyHorse(p, id)) { const h = p.horses[p.horses.length - 1]; this.toast(tr(`¡${h.name || name} llegó al establo!`, `${h.name || name} has arrived at the stable!`), 'good', h.sex === 'yegua' ? tr('Está en el potrero. Elígela en la pestaña Caballo.', 'She is in the paddock. Choose her in the Horse tab.') : tr('Está en el potrero. Elígelo en la pestaña Caballo.', 'He is in the paddock. Choose him in the Horse tab.')); this.syncHerd(); this.refresh(); } };
    this.x.openModal(`<div class="hsheet">${this.por(M, 'big')}<div><div class="eyebrow">${esc(C.breedName(M))}</div><h2 id="modal-title">${esc(M.name)}</h2>
      <p class="meta">${this.hline(M)}</p>${B ? `<p class="note">${esc(B.desc)}${marks ? ` ${tr('Marcas', 'Markings')}: ${marks}.` : ''}</p>` : ''}${this.statGrid(M)}</div></div>
      <p>${tr('Precio', 'Price')}: ${COIN}<b>${M.price}</b>${why ? '' : ` · ${tr('te quedan', 'you will have')} ${COIN}${p.coins - M.price}${tr('', ' left')}`}. ${tr(`Pensión: ${C.BOARD_LEAGUE[p.league]} monedas por día.`, `Board: ${C.BOARD_LEAGUE[p.league]} coins per day.`)}</p>
      <div class="btns">${why ? `<p class="note warn">${esc(why)}.</p>` : `<button class="btn primary" data-a="buy-ok" data-autofocus><span>${tr('Comprar', 'Buy')}</span></button>`}<button class="btn" data-a="close" ${why ? 'data-autofocus' : ''}><span>${why ? tr('Cerrar', 'Close') : tr('Cancelar', 'Cancel')}</span></button></div>`, 'hmodal');
    this.fillPortraits();
  }
  endDayAsk() {
    const p = this.p, NOUN = { comida: tr('la ración', 'feed'), agua: tr('el agua', 'water'), limpiarBox: tr('la limpieza del box', 'stall cleaning') };
    const cared = (h) => p.staff.mozo && h.id !== p.active;      // el mozo los atiende de noche
    const lack = p.horses.filter((h) => !cared(h)).map((h) => { const d = C.tasksOf(p, h); return [h, ['comida', 'agua', 'limpiarBox'].filter((k) => !d[k] && (k === 'limpiarBox' ? h.manure > 0 : h.needs[k] <= 40)).map((k) => NOUN[k])]; }).filter(([, m]) => m.length);
    const miss = lack.length, many = p.horses.length > 1;
    const sweaty = p.horses.filter((h) => h.sweat >= 0.05 && !C.tasksOf(p, h).duchar).map((h) => esc(h.name));
    const ok = many ? tr('Los caballos están atendidos. Mañana tendrán la energía recuperada.', 'The horses are looked after. Tomorrow their energy will be restored.') : tr(`${esc(this.h.name)} está ${C.g(this.h, 'atendido', 'atendida')}. Mañana tendrá la energía recuperada.`, `${esc(this.h.name)} is looked after. Tomorrow ${C.g(this.h, 'his', 'her')} energy will be restored.`);
    this.x.openModal(`<h2 id="modal-title">${tr(`¿Terminar el día ${p.day}?`, `End day ${p.day}?`)}</h2>
      ${miss ? lack.map(([h, m]) => `<p class="warn">${tr(`Falta con ${esc(h.name)}`, `Still missing for ${esc(h.name)}`)}: ${C.list(m)}.</p>`).join('') + `<p>${tr('Sin comida, sin agua o con el box sucio, mañana tendrán menos energía, ánimo y salud.', 'Without food, without water or with a dirty stall, tomorrow they will have less energy, mood and health.')}</p>` : `<p>${ok}</p>`}
      ${sweaty.length ? `<p class="note">${C.list(sweaty)} ${sweaty.length > 1 ? tr('siguen sudados', 'are still sweaty') : tr('sigue con sudor', 'is still sweaty')}${tr(': una ducha antes de la noche les sube el ánimo.', ': a shower before nightfall lifts their mood.')}</p>` : ''}
      ${p.staff.mozo && p.horses.length > 1 ? `<p class="note">${tr('El mozo de cuadra atiende esta noche a tus otros caballos.', 'Tonight the stable hand looks after your other horses.')}</p>` : ''}
      <p class="note">${tr('Pensión de la noche', 'Tonight’s board')}: ${COIN}${C.board(p)}${C.mozoWage(p) ? ` · ${tr('mozo', 'stable hand')}: ${COIN}${C.mozoWage(p)}` : ''}.</p>
      <div class="btns">${miss ? `<button class="btn primary" data-a="close" data-autofocus><span>${tr('Seguir en el rancho', 'Stay at the ranch')}</span></button><button class="btn" data-a="endday-ok"><span>${tr('Terminar el día igual', 'End the day anyway')}</span></button>` : `<button class="btn primary" data-a="endday-ok" data-autofocus><span>${tr('Terminar el día', 'End the day')}</span></button><button class="btn" data-a="close"><span>${tr('Seguir en el rancho', 'Stay at the ranch')}</span></button>`}</div>`);
  }
  endDayDo() {
    const p = this.p, rep = C.endDay(p); this.save(); this.loadCare(true);
    const names = ['energia', 'salud', 'animo', 'comida', 'agua'];
    const rows = rep.horses.map((H) => `<p><b>${esc(H.name)}</b>: ${names.map((k) => { const d = Math.round(H.after[k] - H.before[k]); return d ? `${C.NEEDS[k].name.toLowerCase()} ${d > 0 ? '+' : '−'}${Math.abs(d)}` : ''; }).filter(Boolean).join(' · ')}${H.fed && H.watered ? '' : ` <span class="warn">(${!H.fed && !H.watered ? tr('pasó hambre y sed', 'went hungry and thirsty') : !H.fed ? tr('pasó hambre', 'went hungry') : tr('pasó sed', 'went thirsty')})</span>`}</p>`).join('');
    const births = rep.births.map((b) => { const f = p.horses.find((x) => x.id === b.id); return f ? `<div class="hcard birth">${this.por(f)}<div><b>${tr(`¡Nació ${esc(f.name)}!`, `${esc(f.name)} was born!`)}</b><small>${esc(C.breedName(f))} · ${f.sex === 'yegua' ? tr('potranca', 'filly') : tr('potro', 'colt')} ${tr('de', 'of')} ${esc(b.parents)}</small><small class="gain">${tr('Salto potencial', 'Jumping potential')} ${C.fmtStat('salto', f.pot.salto)}</small></div><button class="btn sm" data-a="rename" data-id="${f.id}"><span>${tr('Ponle nombre', 'Name it')}</span></button></div>` : ''; }).join('');
    if (rep.births.length) this.syncHerd();
    const night = p.horses.length > 1 ? tr('Durante la noche los caballos descansaron y se ensuciaron un poco', 'During the night the horses rested and got a little dirty') : tr(`Durante la noche ${esc(this.h.name)} descansó y se ensució un poco`, `During the night ${esc(this.h.name)} rested and got a little dirty`);
    this.x.openModal(`<div class="eyebrow">${tr('Amanece', 'Sunrise')}</div><h2 id="modal-title">${tr('Día', 'Day')} ${p.day}</h2>${births}${rows}${rep.mozo.length ? `<p class="note">${tr(`El mozo atendió a ${esc(C.list(rep.mozo))}.`, `The stable hand looked after ${esc(C.list(rep.mozo))}.`)}</p>` : ''}
      <p class="note">${night}${tr('; la comida y el agua bajan cada noche.', '; food and water go down every night.')} ${tr(`Pensión${rep.wage ? ' y mozo' : ''}`, `Board${rep.wage ? ' and stable hand' : ''}`)}: ${COIN}${rep.board}${rep.unpaid ? tr(` (faltaron ${rep.unpaid}: bajó el ánimo)`, ` (${rep.unpaid} short: mood dropped)`) : ''}.</p>
      <div class="btns"><button class="btn primary" data-a="close" data-autofocus><span>${tr('Empezar el día', 'Start the day')}</span></button></div>`, rep.births.length ? 'hmodal' : '');
    this.fillPortraits();
    this.refresh();
  }
  leaveTo(st) {
    for (const id of ['hub', 'task', 'photo', 'roam-bar']) this.$(id).classList.add('hidden');
    this.$('hoof').classList.add('hidden'); this.$('hud').classList.remove('roam'); document.body.classList.remove('in-task');
    this.state = null;
    if (st === 'menu') this.x.toMenu();
  }
  toast(t, cls = '', sub = '') {
    const el = this.$('hub-toast'); el.innerHTML = `<b>${esc(t)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}`; el.className = 'show ' + cls;
    clearTimeout(this.toastT); this.toastT = setTimeout(() => { el.className = ''; }, 2800);
  }

  // ---------------------------------------------------------------- establo y tareas del cuidador
  taskLocked(k) { return C.taskLock(this.h, k); }
  enterStable(task) {
    const $ = this.$, h = this.h, S = this.x.stable; this.x.horse.idleClip = null;
    this.state = 'stable'; this.x.setState('stable');
    $('hub').classList.add('hidden'); $('task').classList.remove('hidden'); document.body.classList.add('in-task');
    S.enter(this.x.horse, h, this.p.leather || C.LEATHER_DEFAULT);
    this.loadCare();
    if (!S.compiled) { S.compiled = true; this.x.renderer.compile(S.scene, S.cam); }
    this.care0 = { dirt: h.dirt, sweat: h.sweat, l0: this.x.horse.careLevel(0), s0: this.x.horse.careLevel(1) };
    this.task = null; this.renderTaskList();
    this.setTask(task || this.suggestTask());
  }
  suggestTask() { const d = this.done; return Object.keys(C.TASKS).find((k) => !d[k] && !this.taskLocked(k)) || 'cepillar'; }
  renderTaskList() {
    const d = this.done;
    this.$('task-list').innerHTML = Object.entries(C.TASKS).map(([k, T]) => { const lock = !d[k] && this.taskLocked(k); return `<button class="tl${d[k] ? ' done' : ''}${lock ? ' off' : ''}${this.task === k ? ' cur' : ''}" data-a="task" data-k="${k}" ${this.task === k ? 'aria-current="true"' : ''}><span class="chk" aria-hidden="true">${d[k] ? '✓' : ''}</span>${T.name}</button>`; }).join('');
    this.$('task-coins').innerHTML = `${COIN}<b>${this.p.coins}</b>`;
    const L = this.$('task-list'), cur = L.querySelector('.cur'); if (cur && L.scrollWidth > L.clientWidth) L.scrollLeft = Math.max(0, cur.offsetLeft - 8);
  }
  setTask(k) {
    const S = this.x.stable, $ = this.$, T = C.TASKS[k], lock = this.taskLocked(k), d = this.done[k];
    clearTimeout(this.nextT); clearTimeout(this.hoofT);
    this.task = k; this.prog = 0; this.sub = {}; this.holding = null;
    $('task-title').textContent = T.name; $('task-tip').textContent = d ? tr('Hecha hoy. Puedes elegir otra tarea.', 'Done today. You can pick another task.') : lock || T.desc;
    $('task-tools').innerHTML = ''; $('hoof').classList.add('hidden');
    const view = { cepillar: 'groom', duchar: 'groom', cascos: 'hoof0', comida: 'manger', agua: 'bucket', limpiarBox: 'stall', ensillar: 'tack' }[k];
    S.setView(view);
    const tools = $('task-tools');
    const orbit = `<button class="btn sm" data-a="orbit" data-d="-0.6" aria-label="${tr('Girar a la izquierda', 'Turn left')}"><span>◀</span></button><button class="btn sm" data-a="orbit" data-d="0.6" aria-label="${tr('Girar a la derecha', 'Turn right')}"><span>▶</span></button>`;
    if (d) { this.prog = 1; if (k === 'cepillar' || k === 'duchar') tools.innerHTML = orbit; if (!C.careLeft(this.p).length) { this.renderTaskList(); this.updateProg(); this.allDone(); return; } }
    else if (lock) { this.prog = 0; }
    else if (k === 'cepillar') { tools.innerHTML = orbit; this.taskTip(); this.sub.l0 = Math.max(0.02, this.x.horse.careLevel(0)); }
    else if (k === 'duchar') { tools.innerHTML = orbit; this.taskTip(); this.sub.s0 = Math.max(0.01, this.x.horse.careLevel(1)); }
    else if (k === 'cascos') { this.sub.hoof = 0; this.openHoof(0); }
    else if (k === 'comida') { this.sub.r = { heno: 2, avena: 0, zanahorias: 0, suplemento: 0 }; this.renderRation(); }
    else if (k === 'agua') { this.sub.level = Math.min(0.5, this.h.needs.agua / 200); S.setWater(this.sub.level); tools.innerHTML = '<div class="gauge" aria-hidden="true"><i id="g-water"></i><u></u></div><button class="btn primary hold" data-hold="water"><span></span></button>'; this.taskTip(); }
    else if (k === 'limpiarBox') { this.sub.left = S.piles.filter((x) => x.visible).length; this.sub.total = Math.max(1, this.sub.left); tools.innerHTML = `<button class="btn primary hold" data-hold="bed" ${this.sub.left ? 'disabled' : ''}><span></span></button>`; this.taskTip(); if (!this.sub.left) $('task-tip').textContent = tr('No hay estiércol. Esparce paja nueva.', 'There is no manure. Spread fresh straw.'); }
    else if (k === 'ensillar') { this.sub.step = 0; this.sub.tight = 0; this.renderTack(); }
    this.renderTaskList(); this.updateProg();
  }
  updateProg() { this.$('task-prog').style.width = pct(this.prog * 100) + '%'; }
  taskAction(a, d) {
    const S = this.x.stable;
    if (a === 'task') this.setTask(d.k);
    else if (a === 'orbit') S.orbit(+d.d);
    else if (a === 'back') this.leaveStable();
    else if (a === 'ration') {
      const r = this.sub.r, inv = this.p.inv, max = { heno: 3, avena: Math.min(2, inv.avena || 0), zanahorias: Math.min(2, inv.zanahorias || 0), suplemento: Math.min(1, inv.suplemento || 0) };
      r[d.k] = Math.max(0, Math.min(max[d.k], r[d.k] + +d.d)); this.renderRation();
    }
    else if (a === 'serve') this.serveRation();
    else if (a === 'tack') this.tackStep(d.k);
  }
  finishTask(quality = 1, msg, extra) {
    const k = this.task, p = this.p;
    const r = C.completeTask(p, k, quality, extra);
    if (!r) return;
    this.syncCare(); this.save();
    this.toast(msg || tr(`${C.TASKS[k].name}: ¡hecho!`, `${C.TASKS[k].name}: done!`), 'good', tr(`+${r.reward} monedas · +${r.xp} de experiencia${r.levelUp ? ' · ¡subiste de nivel como cuidador!' : ''}`, `+${r.reward} coins · +${r.xp} experience${r.levelUp ? ' · you leveled up as a groom!' : ''}`));
    this.prog = 1; this.updateProg(); this.renderTaskList();
    if (k !== 'cepillar' && k !== 'duchar') this.$('task-tools').innerHTML = '';
    // tras ensillar para un concurso pendiente, se ofrece ir directo
    if (k === 'ensillar' && this.pendingEvent) {
      const key = this.pendingEvent, h = this.h; this.pendingEvent = null;
      setTimeout(() => { if (this.state === 'stable') this.x.openModal(`<h2 id="modal-title">${tr(`${C.g(h, 'Listo', 'Lista')} para competir`, 'Ready to compete')}</h2><p>${tr(`${esc(h.name)} está ${C.g(h, 'ensillado', 'ensillada')}. ¿Vas a ${esc(C.eventDef(key).name)}?`, `${esc(h.name)} is tacked up. Heading to the ${esc(C.eventDef(key).name)}?`)}</p>
        <div class="btns"><button class="btn primary" data-a="to-event" data-k="${key}" data-autofocus><span>${tr('Ir al concurso', 'Go to the show')}</span></button><button class="btn" data-a="close"><span>${tr('Seguir en el establo', 'Stay in the stable')}</span></button></div>`); }, 900);
      return;
    }
    this.nextT = setTimeout(() => { if (this.state === 'stable' && this.task === k) { const n = this.suggestTask(); if (!C.careLeft(this.p).length) this.allDone(); else if (n !== k && !this.done[n]) this.setTask(n); } }, 1800);
  }
  allDone() {
    if (C.careLeft(this.p).length) return;
    const h = this.h;
    this.$('task-tools').innerHTML = `<div class="alldone"><div><b>${tr(`Todo listo con ${esc(h.name)}`, `All done with ${esc(h.name)}`)}</b><small>${h.tack.saddled ? tr('Está ' + C.g(h, 'ensillado', 'ensillada') + ': puedes ir a un concurso.', 'Tacked up: you can go to a show.') : tr('Puedes ensillar para competir o volver mañana.', 'You can tack up to compete or come back tomorrow.')}</small></div>${h.tack.saddled ? '' : `<button class="btn sm" data-a="task" data-k="ensillar"><span>${tr('Ensillar', 'Tack up')}</span></button>`}<button class="btn primary sm" data-a="back"><span>${tr('Volver al rancho', 'Back to the ranch')}</span></button></div>`;
  }
  // guarda en el perfil el barro y el sudor que quedaron (proporción respecto de cómo entró)
  syncCare() {
    const H = this.x.horse, h = this.h, c = this.care0; if (!c) return;
    h.dirt = c.l0 > 0.001 ? Math.max(0, c.dirt * H.careLevel(0) / c.l0) : 0;
    h.sweat = c.s0 > 0.001 ? Math.max(0, c.sweat * H.careLevel(1) / c.s0) : 0;
    h.wet = H.careLevel(2);
    C.updateLimpieza(h);
  }
  leaveStable() { clearTimeout(this.nextT); clearTimeout(this.hoofT); this.syncCare(); this.h.wet = 0; this.pendingEvent = null; this.save(); this.$('task').classList.add('hidden'); this.$('hoof').classList.add('hidden'); this.enterRanch(); }

  stableFrame(dt) {
    const S = this.x.stable, k = this.task, done = this.done;
    S.update(dt);
    if (k === 'agua' && this.holding === 'water' && !done.agua) {
      this.sub.level += dt * 0.28; S.setWater(this.sub.level);
      S.particles.stream(new THREE.Vector3(1.5, 1.7, -6.85), new THREE.Vector3(1.5, 0.8 + 0.34 * this.sub.level, -6.85), 0xbfe3f0);
      const gw = this.$('g-water'); if (gw) gw.style.height = pct(this.sub.level / 1.1 * 100) + '%';
      if (this.sub.level > 1.03) { this.holding = null; this.sub.level = 0.6; S.setWater(0.6); S.particles.burst(new THREE.Vector3(1.5, 1.1, -6.6), 30, 0xbfe3f0, 1.5, 0.8); this.toast(tr('Se desbordó', 'It overflowed'), 'warn', tr('Vuelve a llenar hasta la marca.', 'Fill it up to the line again.')); this.sub.spilt = true; }
      this.prog = Math.min(1, this.sub.level / 0.88); this.updateProg();
    } else if (k === 'agua' && !this.holding && this.sub.level >= 0.82 && this.sub.level <= 1.03 && !done.agua) this.finishTask(this.sub.spilt ? 0.8 : 1, tr('Balde lleno', 'Bucket full'));
    if (k === 'limpiarBox' && this.holding === 'bed' && !this.sub.left && !done.limpiarBox) {
      S.setBedding(Math.min(1, S.bedding + dt * 0.45)); S.particles.burst(new THREE.Vector3((Math.random() - 0.5) * 3, 0.6, -5.2 + (Math.random() - 0.5) * 3), 2, 0xd9c27a, 0.8, 0.6);
      this.prog = 0.5 + S.bedding * 0.5; this.updateProg();
      if (S.bedding >= 1) { this.holding = null; this.finishTask(1, tr('Box limpio', 'Clean stall')); }
    }
    if (k === 'ensillar' && this.sub.step === 1) {
      this.sub.ph = (this.sub.ph || 0) + dt * 1.7; const v = (Math.sin(this.sub.ph) + 1) / 2; this.sub.needle = v;
      const n = this.$('g-cinch'); if (n) n.style.left = pct(v * 100) + '%';
    }
    if ((k === 'cepillar' || k === 'duchar') && this.brushHit) { this.applyBrush(this.brushHit); this.brushHit = null; }
  }
  pointer(type, e) {
    if (type === 'down' && (this.state === 'photo' || this.state === 'stable')) try { this.x.canvas.setPointerCapture(e.pointerId); } catch {}
    if (this.state === 'photo') return this.photoPointer(type, e);
    if (this.state !== 'stable') return;
    const S = this.x.stable, r = this.x.canvas.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width * 2 - 1, ny = -((e.clientY - r.top) / r.height * 2 - 1);
    const k = this.task, done = this.done[k];
    if (type === 'up') { this.drag = null; return; }
    if (type === 'down') { this.drag = { x: e.clientX, on: false }; }
    if (k === 'limpiarBox' && type === 'down' && !done) {
      const pile = S.hitPile(nx, ny);
      if (pile) {
        pile.visible = false; S.particles.burst(pile.position.clone().setY(0.15), 18, 0x5a4428, 1.0, 0.7); this.sub.left--; this.h.manure = this.sub.left;
        this.prog = 0.5 * (1 - this.sub.left / this.sub.total); this.updateProg();
        this.$('task-tip').textContent = this.sub.left ? tr(`Quedan ${this.sub.left}.`, `${this.sub.left} left.`) : tr('Ahora esparce paja nueva.', 'Now spread fresh straw.');
        if (!this.sub.left) { const b = this.$('task-tools').querySelector('[data-hold]'); if (b) { b.disabled = false; b.querySelector('span').textContent = tr('Mantén pulsado para esparcir paja', 'Press and hold to spread straw'); } }
      }
      return;
    }
    if (k !== 'cepillar' && k !== 'duchar') return;
    if (!this.drag) return;
    const hit = done ? null : S.hitHorse(nx, ny);
    if (hit) { this.drag.on = true; this.brushHit = hit; }
    else if (type === 'move' && !this.drag.on) { S.orbit((e.clientX - this.drag.x) * -0.008); this.drag.x = e.clientX; }
  }
  applyBrush(hit) {
    const H = this.x.horse, S = this.x.stable, p = this.p, k = this.task;
    if (k === 'cepillar') {
      const rad = p.owned.cepilloBlando ? 0.15 : 0.11, amt = p.owned.rasqueta ? -0.5 : -0.3;
      if (H.paintCare(hit, rad, amt, [0]) > 0.5) S.dust(hit.point, 3);
      const lv = H.careLevel(0); this.prog = Math.min(1, 1 - lv / this.sub.l0 + 0.05); this.updateProg();
      if (this.prog >= 0.9 && !this.sub.done) { this.sub.done = true; this.finishTask(1, tr('Pelo limpio y brillante', 'Clean, shiny coat')); }
    } else {
      const nozzle = S.cam.position.clone().add(new THREE.Vector3(0, -0.5, 0)).add(new THREE.Vector3().subVectors(hit.point, S.cam.position).normalize().multiplyScalar(0.6));
      S.spray(nozzle, hit.point);
      H.paintCare(hit, 0.16, -0.45, [1]); H.paintCare(hit, 0.16, -0.18, [0]); H.paintCare(hit, 0.2, 0.7, [2]);
      const lv = H.careLevel(1); this.prog = Math.min(1, 1 - lv / this.sub.s0 + 0.05); this.updateProg();
      if (this.prog >= 0.85 && !this.sub.done) { this.sub.done = true; const sh = (p.inv.champu || 0) > 0; if (sh) p.inv.champu--; this.finishTask(1, sh ? tr('Ducha con champú', 'Shower with shampoo') : tr('Ducha lista', 'Shower done'), { shampoo: sh }); }
    }
  }
  // ración: heno, avena, zanahorias y suplemento (los tres últimos, de la tienda)
  renderRation() {
    const r = this.sub.r, inv = this.p.inv;
    const lim = { heno: 3, avena: Math.min(2, inv.avena || 0), zanahorias: Math.min(2, inv.zanahorias || 0), suplemento: Math.min(1, inv.suplemento || 0) };
    const row = (k, name, have) => `<div class="rrow"><span>${name}${have != null ? ` <small>(${tr('tienes', 'you have')} ${have})</small>` : ''}</span><button class="btn sm" data-a="ration" data-k="${k}" data-d="-1" aria-label="${tr('Menos', 'Less')} ${name}" ${r[k] <= 0 ? 'disabled' : ''}><span>−</span></button><b>${r[k]}</b><button class="btn sm" data-a="ration" data-k="${k}" data-d="1" aria-label="${tr('Más', 'More')} ${name}" ${r[k] >= lim[k] ? 'disabled' : ''}><span>+</span></button></div>`;
    this.$('task-tools').innerHTML = `<div class="ration">${row('heno', tr('Heno (porciones)', 'Hay (portions)'))}${row('avena', tr('Avena premium', 'Premium oats'), inv.avena || 0)}${row('zanahorias', tr('Zanahorias', 'Carrots'), inv.zanahorias || 0)}${row('suplemento', tr('Suplemento', 'Supplement'), inv.suplemento || 0)}
      <button class="btn primary" data-a="serve"><span>${tr('Servir la ración', 'Serve the feed')}</span></button></div>`;
    this.$('task-tip').textContent = tr('Lo ideal: dos porciones de heno. La avena da energía después de trabajar; las zanahorias suben el ánimo y el vínculo. Avena, zanahorias y suplemento se compran en la Tienda.', 'Ideally: two portions of hay. Oats give energy after work; carrots lift mood and bond. Oats, carrots and supplements are sold in the Shop.');
  }
  serveRation() {
    const r = this.sub.r, p = this.p, h = this.h, S = this.x.stable;
    if (this.done.comida) return;
    if (!r.heno) { this.toast(tr('Falta el heno', 'Hay is missing'), 'warn', tr('La base de la ración es el heno.', 'Hay is the base of the feed.')); return; }
    let q = 1 - 0.18 * Math.abs(r.heno - 2); if (r.avena && h.needs.energia > 75) q -= 0.1;
    for (const k of ['avena', 'zanahorias', 'suplemento']) p.inv[k] = Math.max(0, (p.inv[k] || 0) - r[k]);
    S.setFeed(Math.min(1, 0.4 + r.heno * 0.25)); S.particles.burst(new THREE.Vector3(-1.5, 1.05, -6.7), 20, 0xd9c27a, 0.8, 0.8);
    this.$('task-tools').innerHTML = '';
    this.finishTask(Math.max(0.6, q), r.heno === 2 ? tr('Ración ideal', 'Perfect feed') : tr('Ración servida', 'Feed served'), { ration: { zanahorias: r.zanahorias > 0, avena: r.avena > 0, suplemento: r.suplemento > 0 } });
  }
  // ensillar: montura (con mantilla) y después ajustar la cincha en la zona verde
  renderTack() {
    const s = this.sub.step;
    this.$('task-tools').innerHTML = s === 0
      ? `<div class="tack"><button class="btn primary" data-a="tack" data-k="montura"><span>${tr('Poner mantilla y montura', 'Put on pad and saddle')}</span></button><button class="btn" data-a="tack" data-k="cincha"><span>${tr('Ajustar la cincha', 'Tighten the girth')}</span></button></div>`
      : `<div class="tack"><div class="cinch" aria-hidden="true"><i></i><u id="g-cinch"></u></div><button class="btn primary" data-a="tack" data-k="ajustar"><span>${tr(`Ajustar (${this.sub.tight} de 3)`, `Tighten (${this.sub.tight} of 3)`)}</span></button></div>`;
    this.$('task-tip').textContent = s === 0 ? tr('Primero la mantilla y la montura; después se ajusta la cincha.', 'First the saddle pad and the saddle; then tighten the girth.') : tr('Toca «Ajustar» cuando la aguja esté en la zona verde. Tres ajustes, sin apretar de golpe.', 'Tap “Tighten” when the needle is in the green zone. Three steps, never all at once.');
  }
  tackStep(k) {
    const H = this.x.horse, S = this.x.stable;
    if (this.done.ensillar) return;
    if (this.sub.step === 0) {
      if (k === 'cincha') { this.toast(tr('Primero la montura', 'Saddle first'), 'warn'); return; }
      S.saddleOnRack.visible = false; H.setTack({ saddle: true, bridle: true, leather: this.p.leather || C.LEATHER_DEFAULT }); this.sub.step = 1; this.prog = 0.4; this.updateProg(); this.renderTack();
    } else if (k === 'ajustar') {
      const v = this.sub.needle;
      if (v > 0.37 && v < 0.65) { this.sub.tight++; this.prog = 0.4 + this.sub.tight * 0.2; this.updateProg(); navigator.vibrate?.(15); if (this.sub.tight >= 3) { this.$('task-tools').innerHTML = ''; this.finishTask(this.sub.miss ? 0.8 : 1, tr(C.g(this.h, 'Ensillado', 'Ensillada'), 'Tacked up')); return; } }
      else { this.sub.miss = true; this.toast(v >= 0.65 ? tr('Demasiado apretada: espera la zona verde', 'Too tight: wait for the green zone') : tr('Todavía floja: espera la zona verde', 'Still loose: wait for the green zone'), 'warn'); }
      this.renderTack();
    }
  }
  // cascos: el casco por dentro, con barro y piedras; el limpiacascos raspa donde pasa
  openHoof(i) {
    const $ = this.$, S = this.x.stable;
    if (this.state !== 'stable' || this.task !== 'cascos' || !(i >= 0)) return;
    this.sub.advancing = false;
    if (i > 3) { $('hoof').classList.add('hidden'); this.finishTask(1, tr('Cascos limpios', 'Clean hooves')); return; }
    this.sub.hoof = i; S.setView('hoof' + i);
    $('task-tip').textContent = this.hoofTip(i);
    const cv = $('hoof-cv'), mud = this.sub.mud = this.sub.mud || document.createElement('canvas');
    cv.width = mud.width = 300; cv.height = mud.height = 300;
    const m = mud.getContext('2d'); m.clearRect(0, 0, 300, 300);
    const dirt = Math.max(0.35, this.h.hooves?.[i] ?? 0.7);
    for (let k = 0; k < 70 * dirt; k++) { const a = Math.random() * 6.28, d = Math.random() * 100; m.fillStyle = `rgb(${80 + Math.random() * 30},${60 + Math.random() * 20},${40 + Math.random() * 15})`; m.beginPath(); m.ellipse(150 + Math.cos(a) * d * 0.8, 150 + Math.sin(a) * d, 14 + Math.random() * 18, 10 + Math.random() * 14, a, 0, 7); m.fill(); }
    this.sub.stones = Array.from({ length: 2 + Math.floor(Math.random() * 2) }, () => ({ x: 115 + Math.random() * 70, y: 120 + Math.random() * 80, on: true }));
    this.sub.mud0 = this.mudLeft();
    $('hoof').classList.remove('hidden'); $('hoof-n').textContent = tr(`${i + 1} de 4`, `${i + 1} of 4`);
    this.drawHoof();
    if (!this.hoofBound) {
      this.hoofBound = true;
      let down = false;
      const at = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 300, (e.clientY - r.top) / r.height * 300]; };
      cv.addEventListener('pointerdown', (e) => { down = true; cv.setPointerCapture(e.pointerId); const [x, y] = at(e); this.scrape(x, y, true); });
      cv.addEventListener('pointermove', (e) => { if (!down) return; const [x, y] = at(e); this.scrape(x, y, false); });
      for (const ev of ['pointerup', 'pointercancel']) cv.addEventListener(ev, () => { down = false; });
    }
  }
  mudLeft() { const d = this.sub.mud.getContext('2d').getImageData(0, 0, 300, 300).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 40) n++; return n; }
  scrape(x, y, tap) {
    if (this.task !== 'cascos' || this.sub.advancing || !this.sub.mud) return;
    const m = this.sub.mud.getContext('2d'); m.globalCompositeOperation = 'destination-out';
    m.beginPath(); m.arc(x, y, this.p.owned.limpiacascos ? 22 : 15, 0, 7); m.fill(); m.globalCompositeOperation = 'source-over';
    if (tap) for (const s of this.sub.stones) if (s.on && Math.hypot(s.x - x, s.y - y) < 20) { s.on = false; navigator.vibrate?.(12); }
    this.drawHoof();
    this.sub.sc = (this.sub.sc || 0) + 1;
    if (this.sub.sc % 6 === 0 || tap) {
      const left = this.mudLeft() / Math.max(1, this.sub.mud0), stones = this.sub.stones.filter((s) => s.on).length;
      this.prog = (this.sub.hoof + Math.min(1, (1 - left) * 1.1) * (stones ? 0.8 : 1)) / 4; this.updateProg();
      if (stones && left < 0.12) this.$('task-tip').textContent = tr(`Quedan ${stones} ${stones > 1 ? 'piedras' : 'piedra'}: tócalas para sacarlas.`, `${stones} ${stones > 1 ? 'stones' : 'stone'} left: tap to remove ${stones > 1 ? 'them' : 'it'}.`);
      if (left < 0.12 && !stones) { this.sub.advancing = true; const next = this.sub.hoof + 1; this.hoofT = setTimeout(() => this.openHoof(next), 300); }
    }
  }
  drawHoof() {
    const x = this.$('hoof-cv').getContext('2d');
    x.clearRect(0, 0, 300, 300);
    x.fillStyle = '#3b2a1e'; x.beginPath(); x.ellipse(150, 150, 118, 128, 0, 0, 7); x.fill();                // pared del casco
    x.fillStyle = '#d9c8a8'; x.beginPath(); x.ellipse(150, 150, 96, 108, 0, 0, 7); x.fill();                 // suela
    x.strokeStyle = '#9aa1a8'; x.lineWidth = 20; x.beginPath(); x.ellipse(150, 146, 104, 116, 0, Math.PI * 0.82, Math.PI * 2.18); x.stroke();   // herradura
    for (let k = 0; k < 8; k++) { const a = Math.PI * (0.95 + k * 0.155); x.fillStyle = '#5d646b'; x.beginPath(); x.arc(150 + Math.cos(a) * 104, 146 + Math.sin(a) * 116, 3.5, 0, 7); x.fill(); }   // clavos
    x.fillStyle = '#b89a78'; x.beginPath(); x.moveTo(150, 120); x.lineTo(118, 250); x.lineTo(182, 250); x.closePath(); x.fill();   // ranilla
    x.drawImage(this.sub.mud, 0, 0);
    for (const s of this.sub.stones) if (s.on) { x.fillStyle = '#8c8f93'; x.beginPath(); x.ellipse(s.x, s.y, 9, 7, s.x, 0, 7); x.fill(); x.fillStyle = '#c5c8cc'; x.beginPath(); x.arc(s.x - 2, s.y - 2, 2.5, 0, 7); x.fill(); }
  }

  // ---------------------------------------------------------------- paseo libre (jugar como el caballo)
  startRoam() {
    const $ = this.$, H = this.x.horse, h = this.h, R = this.x.ranch;
    this.state = 'roam'; this.x.setState('roam');
    $('hub').classList.add('hidden'); $('roam-bar').classList.remove('hidden');
    $('hud').classList.remove('hidden'); $('hud').classList.add('roam');
    H.moveTo(R.scene); H.showRider(false); H.setTack({ saddle: false, bridle: false }); H.idleAlt = false; H.idleClip = null;
    this.x.herd.clearAround(20, 6, 5);
    this.lastKmh = -1;
    this.roam = { x: 20, z: 6, h: Math.PI / 2 - 0.4, v: 0, gear: 1, w: 0, turn: 0, jump: null, t: 0, gain: 0 };
    this.x.chase.first = true; this.x.input.active = true; this.x.input.clear();
    const thirsty = h.drankDay !== this.p.day; R.showTroughMarker(thirsty);
    const touch = document.body.classList.contains('touch');
    this.roamIntro();
  }
  roamIntro() {
    const h = this.h, touch = document.body.classList.contains('touch'), thirsty = h.drankDay !== this.p.day;
    if (this.roam && this.roam.drank) return this.roamMsg(tr('Sigue paseando o vuelve al rancho cuando quieras.', 'Keep roaming or head back to the ranch whenever you like.'));
    this.roamMsg(tr(`Paseo libre con ${h.name}. ${touch ? 'Gira con el control izquierdo; + y − cambian el ritmo.' : 'Gira con A y D; W y S cambian el ritmo.'}${thirsty ? ' Ve al bebedero del potrero a beber.' : ''}`,
      `Free roam with ${h.name}. ${touch ? 'Turn with the left control; + and − change the pace.' : 'Turn with A and D; W and S change the pace.'}${thirsty ? ' Head to the paddock trough for a drink.' : ''}`));
  }
  roamMsg(t) { this.$('roam-msg').textContent = t; }
  roamGear(d) { const r = this.roam; if (!r) return; let g = r.gear + d; if (d > 0 && r.gear === 1) g = 2; r.gear = Math.max(0, Math.min(4, g)); }
  roamFrame(dt) {
    const r = this.roam, H = this.x.horse, R = this.x.ranch, inp = this.x.input.read(dt), h = this.h;
    const av = Math.abs(r.v), wMax = av < 0.4 ? 1.1 : Math.max(0.78, Math.min(1.6, 1.75 - 0.13 * av));
    const h0 = r.h;
    r.w += (inp.steer * wMax - r.w) * (1 - Math.exp(-dt * 11)); r.h += r.w * dt; r.turn = r.w / Math.max(0.5, wMax);
    if (this.x.herd.blocks(r.x, r.z, r.h, r.x, r.z, h0)) { r.h = h0; r.w = 0; }      // girando no se mete en otro caballo
    const vT = GEARS[r.gear].v; r.v += Math.max(-3.2 * dt, Math.min(2.2 * dt, vT - r.v));
    const nx = r.x + Math.cos(r.h) * r.v * dt, nz = r.z + Math.sin(r.h) * r.v * dt;
    const [cx, cz] = R.collide(nx, nz); if (Math.hypot(cx - nx, cz - nz) > 0.01 && r.v > 2) r.v *= 0.96;
    // los caballos del potrero no se atraviesan: si el paso lo mete en uno, se frena
    if (this.x.herd.blocks(cx, cz, r.h, r.x, r.z, r.h)) { r.v *= 0.2; } else { r.x = cx; r.z = cz; }
    this.x.herd.update(dt, [{ x: r.x, z: r.z, h: r.h }]);
    // indicador de marcha y velocidad (el del concurso lo actualiza main.js)
    const kmh = Math.round(Math.abs(r.v) * 3.6), av2 = Math.abs(r.v);
    if (kmh !== this.lastKmh) { this.lastKmh = kmh; this.$('h-speed').textContent = kmh; const G = TT.gait; this.$('g-name').textContent = r.v < -0.2 ? G.reverse : av2 < 0.25 ? G.stopped : av2 < 2.4 ? G.walk : av2 < 6.5 ? G.gallop : G.fast; this.$('g-obj').textContent = ''; }
    H.root.position.set(r.x, 0, r.z); H.root.rotation.y = Math.PI / 2 - r.h;
    H.update(dt, { v: r.v, turn: r.turn, jump: null });
    this.x.chase.update(dt, r, H, null);
    R.follow(r.x, r.z); R.update(dt);
    // el paseo levanta el ánimo y el vínculo (con tope por día); se informa al terminar
    if (Math.abs(r.v) > 0.5) r.t += dt;
    if (h.roamDay !== this.p.day) { h.roamDay = this.p.day; h.roamGain = 0; }
    if (r.t > 15 && (h.roamGain || 0) < 6) { r.t = 0; h.roamGain++; r.gain++; h.needs.animo = C.clamp(h.needs.animo + 4); h.bond = C.clamp(h.bond + 0.8); this.save(); }
    // beber: con la cabeza junto a la batea y el caballo quieto (una vez por día)
    const hx = r.x + Math.cos(r.h) * 1.1, hz = r.z + Math.sin(r.h) * 1.1;
    if (h.drankDay !== this.p.day && Math.hypot(hx - R.trough.x, hz - R.trough.z) < 2.2 && av < 0.4) {
      h.drankDay = this.p.day; h.needs.agua = C.clamp(h.needs.agua + 35); this.save(); R.showTroughMarker(false);
      r.drank = true; this.toast(tr('Agua fresca', 'Fresh water'), 'good', tr(`${h.name} bebió en el bebedero: +35 de agua.`, `${h.name} drank at the trough: +35 water.`)); this.roamIntro();
    }
  }
  endRoam() {
    const r = this.roam;
    this.x.input.active = false; this.$('roam-bar').classList.add('hidden'); this.$('hud').classList.add('hidden'); this.$('hud').classList.remove('roam');
    this.x.ranch.showTroughMarker(false);
    this.roam = null; this.roamEndAt = performance.now(); this.enterRanch();
    if (r && r.gain) this.toast(tr('Buen paseo', 'Nice ride'), 'good', tr(`${this.h.name}: +${r.gain * 4} de ánimo y +${Math.round(r.gain * 0.8)} de vínculo.`, `${this.h.name}: +${r.gain * 4} mood and +${Math.round(r.gain * 0.8)} bond.`));
  }

  // ---------------------------------------------------------------- modo foto
  startPhoto() {
    const H = this.x.horse;
    this.photoFrom = this.state;
    this.state = 'photo'; this.x.setState('photo');
    this.x.input.active = false;
    for (const id of ['hub', 'roam-bar', 'hud']) this.$(id).classList.add('hidden');
    this.$('photo').classList.remove('hidden');
    this.photoTip();
    this.photoCam = { yaw: -(H.root.rotation.y) + 0.9, pitch: 0.18, dist: 5.5, cam: new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 900), ptr: new Map() };
    this.photoCam.cam.layers.enable(1);
  }
  photoTip() { this.$('ph-tip').textContent = document.body.classList.contains('touch') ? tr('Arrastra para girar la cámara · pellizca para acercar', 'Drag to rotate the camera · pinch to zoom') : tr('Arrastra para girar la cámara · rueda del ratón para acercar', 'Drag to rotate the camera · mouse wheel to zoom'); }
  photoFrame(dt) {
    const H = this.x.horse, R = this.x.ranch, P = this.photoCam, c = P.cam, t = H.root.position;
    H.update(dt, { v: 0, turn: 0, jump: null }); R.update(dt);
    this.x.herd.update(dt, [{ x: t.x, z: t.z, h: Math.PI / 2 - H.root.rotation.y }]);
    c.aspect = innerWidth / innerHeight; c.updateProjectionMatrix();
    c.position.set(t.x + Math.cos(P.yaw) * Math.cos(P.pitch) * P.dist, 1.1 + Math.sin(P.pitch) * P.dist, t.z + Math.sin(P.yaw) * Math.cos(P.pitch) * P.dist);
    c.lookAt(t.x, 1.1, t.z);
  }
  photoPointer(type, e) {
    const P = this.photoCam, M = P.ptr;
    if (type === 'down') M.set(e.pointerId, { x: e.clientX, y: e.clientY });
    else if (type === 'up') { M.delete(e.pointerId); P.pinch = null; }
    else if (M.has(e.pointerId)) {
      const prev = M.get(e.pointerId); M.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (M.size >= 2) {
        // pellizco: la distancia entre los dos dedos acerca o aleja
        const [a, b] = [...M.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (P.pinch) P.dist = Math.max(1.6, Math.min(14, P.dist * P.pinch / d)); P.pinch = d;
      } else { P.yaw += (e.clientX - prev.x) * 0.008; P.pitch = Math.max(-0.05, Math.min(1.2, P.pitch + (e.clientY - prev.y) * 0.005)); }
    }
  }
  takePhoto() {
    const r = this.x.renderer; r.render(this.x.ranch.scene, this.photoCam.cam);
    const url = this.x.canvas.toDataURL('image/jpeg', 0.92), name = `jetjump-${this.h.name.toLowerCase()}-dia${this.p.day}.jpg`;
    const fl = this.$('photo-flash'); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
    const download = () => { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); this.toast(tr('Foto guardada', 'Photo saved'), 'good', tr('Está en la carpeta de descargas.', 'It is in your downloads folder.')); };
    let file = null;
    if (document.body.classList.contains('touch') && navigator.canShare) {
      try { const bin = atob(url.split(',')[1]), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); file = new File([u8], name, { type: 'image/jpeg' }); if (!navigator.canShare({ files: [file] })) file = null; } catch { file = null; }
    }
    if (file) { navigator.share({ files: [file], title: tr(`${this.h.name} en el rancho`, `${this.h.name} at the ranch`) }).then(() => this.toast(tr('Foto lista', 'Photo ready'), 'good')).catch((e) => { if (e && e.name !== 'AbortError') download(); }); }
    else download();
  }
  endPhoto() {
    this.$('photo').classList.add('hidden');
    if (this.photoFrom === 'roam' && this.roam) { this.state = 'roam'; this.x.setState('roam'); this.$('roam-bar').classList.remove('hidden'); this.$('hud').classList.remove('hidden'); this.x.input.active = true; this.x.chase.first = true; }
    else this.enterRanch();
  }

  // ---------------------------------------------------------------- concursos de liga
  enterEvent(key) {
    const p = this.p, h = this.h, L = C.leagueOf(key), E = C.eventDef(key);
    const why = C.cantCompete(p, h, E);
    if (why) { this.toast(tr('No puede competir', 'Cannot compete'), 'warn', why); return false; }
    const issues = C.readiness(h);
    const warn = issues.length ? `<p class="warn">${tr(`Atención: ${esc(h.name)} ${issues.join(', ')}. Rendirá menos.`, `Heads up: ${esc(h.name)} ${C.list(issues)}. ${C.g(h, 'He', 'She')} will perform worse.`)}</p>` : '';
    const dirty = h.needs.limpieza < 50 ? `<p class="warn">${tr(`Está ${C.g(h, 'sucio', 'sucia')}: empieza con menos confianza. ${C.g(h, 'Cepíllalo', 'Cepíllala')} antes en el establo.`, `${C.g(h, 'He', 'She')} is dirty: starts with less confidence. Brush ${C.g(h, 'him', 'her')} in the stable first.`)}</p>` : '';
    if (!h.tack.saddled) {
      this.pendingEvent = key;
      this.x.openModal(`<h2 id="modal-title">${tr(`${esc(h.name)} no está ${C.g(h, 'ensillado', 'ensillada')}`, `${esc(h.name)} is not tacked up`)}</h2><p>${tr(`Para ir a ${esc(E.name)} hay que ensillar en el establo.`, `To go to the ${esc(E.name)} you need to tack up in the stable.`)}</p>${warn}
        <div class="btns"><button class="btn primary" data-a="go-tack" data-autofocus><span>${tr('Ensillar en el establo', 'Tack up in the stable')}</span></button><button class="btn" data-a="cancel-event"><span>${tr('Cancelar', 'Cancel')}</span></button></div>`);
      return true;
    }
    const again = (p.today?.shows?.[key] || 0) > 0;
    this.x.openModal(`<div class="eyebrow">${tr(`Liga ${L.name}`, `${L.name} league`)}</div><h2 id="modal-title">${esc(E.name)}</h2>
      <p>${tr(`8 obstáculos, el más alto de ${m2(E.h)} m. Límite de tiempo: ${E.ta} s. Contra 7 binomios.`, `8 fences, the highest at ${m2(E.h)} m. Time limit: ${E.ta} s. Against 7 horse-and-rider pairs.`)}</p>
      <p>${tr('Inscripción', 'Entry fee')}: ${COIN}<b>${L.fee}</b> · ${tr('Premio al 1.º', '1st place prize')}: ${COIN}<b>${L.prize}</b> ${tr('(+20 % sin penalizaciones)', '(+20% for a clear round)')}${again ? tr('. Ya participaste hoy en este concurso: premio, reputación y experiencia a la mitad.', '. You already entered this show today: half prize, reputation and experience.') : '.'}</p>${warn}${dirty}
      <p class="meta">${tr('Confianza inicial', 'Starting confidence')}: ${Math.round(C.confidenceStart(p, h))} % · ${tr('Forma', 'Form')}: ${C.formWord(C.form(h)).toLowerCase()}</p>
      <div class="btns"><button class="btn primary" data-a="go-event" data-k="${key}" data-autofocus><span>${tr('Pagar e ir a la pista', 'Pay and go to the arena')}</span><span aria-hidden="true">→</span></button><button class="btn" data-a="cancel-event"><span>${tr('Cancelar', 'Cancel')}</span></button></div>`);
    return true;
  }
  modalAction(a, d) {
    if (a === 'go-stable') { this.x.closeModal(); this.enterStable(); return true; }
    if (a === 'go-tack') { this.x.closeModal(); this.enterStable('ensillar'); return true; }
    if (a === 'go-event') { this.x.closeModal(); this.goEvent(d.k); return true; }
    if (a === 'to-event') { this.x.closeModal(); this.leaveStable(); this.enterEvent(d.k); return true; }
    if (a === 'cancel-event') { this.pendingEvent = null; this.x.closeModal(); if (this.state !== 'ranch' && this.state !== 'stable') this.enterRanch(); return true; }
    if (a === 'rename') { this.askRename(d.id); return true; }
    if (a === 'rename-ok') {
      const inp = this.$('rn-in'), err = C.renameHorse(this.p, d.id, inp ? inp.value : '');
      if (err) { const e = this.$('rn-err'); if (e) e.textContent = err; return true; }
      this.save(); this.x.closeModal(); this.toast(tr('Nombre guardado', 'Name saved'), 'good'); this.refresh(); return true;
    }
    if (a === 'sell') {
      const h = this.p.horses.find((x) => x.id === d.id); if (!h) return true;
      this.x.openModal(`<h2 id="modal-title">${tr(`¿Vender a ${esc(h.name)}?`, `Sell ${esc(h.name)}?`)}</h2><p>${tr('Recibes', 'You receive')} ${COIN}<b>${C.sellValue(h)}</b>. ${tr('No se puede deshacer.', 'This cannot be undone.')}</p>
        <div class="btns"><button class="btn danger" data-a="sell-ok" data-id="${h.id}"><span>${tr('Vender', 'Sell')}</span></button><button class="btn primary" data-a="close" data-autofocus><span>${tr('Cancelar', 'Cancel')}</span></button></div>`);
      return true;
    }
    if (a === 'sell-ok') {
      const h = this.p.horses.find((x) => x.id === d.id), name = h ? h.name : '', was = this.p.active, v = C.sellHorse(this.p, d.id);
      this.x.closeModal();
      if (v) { if (was !== this.p.active) { this.applyLook(); this.loadCare(true); } this.syncHerd(); this.toast(tr(`Vendiste a ${name}`, `You sold ${name}`), 'good', tr(`+${v} monedas`, `+${v} coins`)); this.refresh(); }
      return true;
    }
    if (a === 'horse-info') { this.horseInfo(d.id); return true; }
    if (a === 'buy-ok') { this.x.closeModal(); const f = this.confirmBuy; this.confirmBuy = null; if (f) f(); return true; }
    if (a === 'endday-ok') { this.x.closeModal(); this.endDayDo(); return true; }
    if (a === 'home') { this.action(a, d); return true; }
    if (a === 'back-ranch') { this.x.closeModal(); this.enterRanch(); return true; }
    if (a === 'train-again') { this.x.closeModal(); this.enterRanch(); this.startTraining(d.k); return true; }
    if (a === 'event-again') {
      const why = C.cantCompete(this.p, this.h, C.eventDef(d.k));
      if (why) { this.toast(tr('No puede competir', 'Cannot compete'), 'warn', why); return true; }
      this.x.closeModal(); this.enterRanch(); this.enterEvent(d.k); return true;
    }
    return false;
  }
  goEvent(key) {
    const p = this.p, h = this.h, L = C.leagueOf(key), E = C.eventDef(key);
    if (C.cantCompete(p, h, E)) return;
    C.beginShow(p, key); this.save();
    this.leaveTo(null);
    const def = eventCourse(E);
    this.run = { kind: 'event', key, fee: L.fee, rivals: C.rivalsFor(p, key, C.courseLength(def)) };
    this.x.startRun(def, { mods: C.rideMods(p, h), coat: C.COATS[h.coat], marks: h.marks, shape: h.shape, care: { dirt: h.dirt, sweat: h.sweat, wet: h.wet }, leather: p.leather || C.LEATHER_DEFAULT, label: tr(`Liga ${L.name}`, `${L.name} league`) });
  }
  // fin de un recorrido de carrera (concurso o entrenamiento): main.js llama acá en lugar de su resultado
  onRunEnd(R, retired) {
    const run = this.run; if (!run) return false;
    this.run = null;
    if (run.kind === 'train') { this.trainEnd(R, run); return true; }
    const p = this.p, h = this.h, res = { faults: R.faults, time: R.time, elim: !!R.elim, retired: !!retired };
    const out = C.applyShow(p, run.key, res, run.rivals); this.save();
    const E = C.eventDef(run.key), L = C.leagueOf(run.key);
    // tabla corta: los cinco primeros y tu fila si quedaste más abajo
    const myI = out.table.findIndex((t) => t.me), show = out.table.map((t, i) => [t, i]).filter(([, i]) => i < 5 || i === myI);
    const rows = show.map(([t, i]) => `<tr class="${t.me ? 'me' : ''}"><td>${i + 1}</td><td>${esc(t.me ? tr('Tú', 'You') : t.name)}<small>${esc(t.horse)}</small></td><td>${t.elim ? 'Elim.' : t.faults}</td><td>${t.elim ? '—' : m2(t.time)}</td></tr>`).join('');
    const title = res.retired ? tr('Te retiraste', 'You withdrew') : res.elim ? tr('Eliminación', 'Eliminated') : out.pos === 1 ? tr('¡Ganaste!', 'You won!') : tr(`${out.pos}.º puesto`, `${C.ordEn(out.pos)} place`);
    const chips = [out.prize ? `<span class="rchip">${COIN}+${out.prize}</span>` : '', out.repGain ? `<span class="rchip">${tr(`+${out.repGain} de reputación`, `+${out.repGain} reputation`)}</span>` : '', out.xp ? `<span class="rchip">${tr(`+${out.xp} de experiencia`, `+${out.xp} experience`)}</span>` : ''].join('');
    const more = [];
    if (out.levelUp) more.push(`<p class="ok">${tr('<b>¡Subiste de nivel!</b> Tienes un punto de habilidad para repartir en Jinete.', '<b>You leveled up!</b> You have a skill point to spend in Rider.')}</p>`);
    if (out.promoted) more.push(`<p class="ok"><b>${tr(`¡Clasificaste a la liga ${C.LEAGUES[p.league].name}!`, `You qualified for the ${C.LEAGUES[p.league].name} league!`)}</b></p>`);
    else if (out.qual && !res.elim && out.pos > 1) more.push(`<p>${tr('Para pasar de liga hay que ganar el clasificatorio.', 'To move up a league you must win the qualifier.')}</p>`);
    if (!out.prize && !res.retired && !res.elim) more.push(`<p class="note">${tr('Sin premio: solo cobran los cinco primeros.', 'No prize: only the top five are paid.')}</p>`);
    if (out.again) more.push(`<p class="note">${tr('Este concurso ya lo corriste hoy: premio, reputación y experiencia a la mitad.', 'You already rode this show today: half prize, reputation and experience.')}</p>`);
    if (!res.retired) more.push(`<p>${tr(`${esc(h.name)} volvió ${C.g(h, 'sudado', 'sudada')}: ${C.g(h, 'dúchalo', 'dúchala')} en el establo.`, `${esc(h.name)} came back sweaty: give ${C.g(h, 'him', 'her')} a shower in the stable.`)}</p>`);
    const canAgain = !C.cantCompete(p, h, E);
    this.x.openModal(`<div class="eyebrow">${tr(`Liga ${L.name}`, `${L.name} league`)} · ${esc(E.name)}</div><h2 id="modal-title">${title}</h2>
      <div class="stars big" aria-label="${tr(`${out.st} de 3 estrellas`, `${out.st} of 3 stars`)}">${[1, 2, 3].map((s) => STAR(s <= out.st)).join('')}</div>
      <table class="rank"><thead><tr><th>#</th><th>${tr('Binomio', 'Rider and horse')}</th><th>${tr('Penalización', 'Faults')}</th><th>${tr('Tiempo', 'Time')}</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="rchips">${chips}</div>${more.join('')}
      <div class="btns sticky"><button class="btn primary" data-a="back-ranch" data-autofocus><span>${tr('Volver al rancho', 'Back to the ranch')}</span></button>${canAgain ? `<button class="btn" data-a="event-again" data-k="${run.key}"><span>${tr('Volver a inscribirse', 'Enter again')} · ${COIN}${L.fee}</span></button>` : ''}</div>`, 'results', { escape: () => { this.x.closeModal(); this.enterRanch(); } });
    return true;
  }

  // ---------------------------------------------------------------- entrenamientos
  startTraining(k) {
    const p = this.p, h = this.h, T = C.TRAININGS[k];
    if (T.unlock && !p.owned[T.unlock]) { this.toast(tr('Falta la pista de gimnasia', 'You need the gymnastics arena'), 'warn', tr('Se compra en la Tienda, sección Rancho.', 'Buy it in the Shop, Ranch section.')); return; }
    if (h.needs.energia < T.energy) { this.toast(tr(`${h.name} está ${C.g(h, 'cansado', 'cansada')}`, `${h.name} is tired`), 'warn', tr('Que descanse: termina el día.', 'Let it rest: end the day.')); return; }
    this.leaveTo(null);
    let course;
    if (k === 'plano' || k === 'galope') course = COURSES.libre;
    else if (k === 'gimnasia') course = COURSES.practica;
    else { const top = Math.min(1.6, h.stats.salto + 0.05), base = COURSES.practica, mx = Math.max(...base.fences.map((F) => F.h)); course = { ...base, fences: base.fences.map((F) => ({ ...F, h: +(F.h * top / mx).toFixed(2) })) }; }
    this.run = { kind: 'train', key: k, gate: 0, laps: 0, wp: 0, gallopT: 0, t: 0, clean: 0, jumps: 0, target: { plano: CONE_GATES.length, galope: 2, gimnasia: 6, altura: 5 }[k] };
    this.x.startRun(course, { mods: { ...C.rideMods(p, h), conf: null }, coat: C.COATS[h.coat], marks: h.marks, shape: h.shape, care: { dirt: h.dirt, sweat: h.sweat, wet: h.wet }, leather: p.leather || C.LEATHER_DEFAULT, training: k, label: T.name, noJump: k === 'plano' || k === 'galope' });
    if (k === 'plano') this.x.showCones(CONE_GATES);
  }
  // progreso parcial de un entrenamiento (al abandonarlo cuenta lo hecho, no un mínimo regalado)
  trainProgress() {
    const run = this.run; if (!run) return 0;
    if (run.key === 'plano') return Math.min(1, run.gate / CONE_GATES.length) * 0.8;
    if (run.key === 'galope') return Math.min(1, (run.laps + run.wp / LAP.length) / 2) * Math.min(1, run.gallopT / Math.max(1, run.t) + 0.15) * 0.8;
    return Math.min(1, run.clean / run.target) * 0.8;
  }
  // objetivo de cada entrenamiento, por cuadro (main.js lo llama durante el recorrido)
  trainFrame(R, dt) {
    const run = this.run; if (!run || run.kind !== 'train') return null;
    run.t += dt;
    let label = '', sub = '';
    if (run.key === 'plano') {
      const G = CONE_GATES[run.gate];
      // cruce entre el cuadro anterior y este (la física avanza en varios pasos por cuadro)
      if (G && run.lx != null) {
        const a = G.dir * Math.PI / 180, fx = Math.cos(a), fz = Math.sin(a);
        const s0 = (run.lx - G.x) * fx + (run.lz - G.z) * fz, s1 = (R.x - G.x) * fx + (R.z - G.z) * fz, lat = -(R.x - G.x) * fz + (R.z - G.z) * fx;
        if (s0 < 0 && s1 >= 0 && Math.abs(lat) < 2.2) { run.gate++; this.x.say(tr(`Puerta ${run.gate} de ${CONE_GATES.length}`, `Gate ${run.gate} of ${CONE_GATES.length}`), '', 'good', 1, 0.9); }
      }
      run.lx = R.x; run.lz = R.z;
      this.x.coneTarget(run.gate);
      label = tr(`Puertas: ${run.gate} de ${CONE_GATES.length}`, `Gates: ${run.gate} of ${CONE_GATES.length}`); sub = `${tr('Pasa por las puertas de conos en orden', 'Ride through the cone gates in order')} · ${Math.max(0, Math.ceil(150 - run.t))} s`;
      if (run.gate >= CONE_GATES.length || run.t > 150) return { score: Math.min(1, run.gate / CONE_GATES.length) * (run.t < 110 ? 1 : 0.85) };
    } else if (run.key === 'galope') {
      const W = LAP[run.wp]; if (Math.hypot(R.x - W.x, R.z - W.z) < 7) { run.wp = (run.wp + 1) % LAP.length; if (run.wp === 0) { run.laps++; this.x.say(tr(`Vuelta ${run.laps}`, `Lap ${run.laps}`), '', 'good', 1, 1); } }
      if (R.v > 4.5) run.gallopT += dt;
      this.x.coneTarget(-1, LAP[run.wp]);
      label = tr(`Vueltas: ${run.laps} de 2`, `Laps: ${run.laps} of 2`); sub = tr(`Al galope: ${Math.round(run.gallopT)} s · quedan ${Math.max(0, Math.ceil(160 - run.t))} s`, `Cantering: ${Math.round(run.gallopT)} s · ${Math.max(0, Math.ceil(160 - run.t))} s left`);
      if (run.laps >= 2 || run.t > 160) return { score: Math.min(1, (run.laps + run.wp / LAP.length) / 2) * Math.min(1, run.gallopT / Math.max(1, run.t) + 0.15) };
    } else {
      label = tr(`Saltos sin derribo: ${run.clean} de ${run.target}`, `Clear jumps: ${run.clean} of ${run.target}`); sub = `${run.key === 'altura' ? tr('Obstáculos a la altura máxima de tu caballo', 'Fences at your horse’s maximum height') : tr('Salta los obstáculos de práctica', 'Jump the practice fences')} · ${Math.max(0, Math.ceil(170 - run.t))} s`;
      if (run.clean >= run.target || run.jumps >= run.target + 4 || run.t > 170) return { score: Math.min(1, run.clean / run.target) };
    }
    this.x.$('h-target').textContent = label; this.x.$('h-sub').textContent = sub;
    return null;
  }
  trainEvent(e) { const run = this.run; if (!run || run.kind !== 'train') return; if (e.type === 'land') { run.jumps++; if (e.clear) run.clean++; } }
  trainEnd(R, run) {
    const out = C.applyTraining(this.p, run.key, run.score ?? 0); this.save();
    const T = C.TRAININGS[run.key], h = this.h;
    const gains = out.gains.length ? out.gains.map((x) => `<li><b>${C.STATS[x.s].name}</b> +${x.s === 'salto' ? `${Math.round(x.gain * 100)} cm` : dec(x.gain, 1)}</li>`).join('') : `<li>${tr('Sin mejoras esta vez: la sesión fue corta o ya está cerca de su potencial.', 'No improvement this time: the session was short or it is already close to its potential.')}</li>`;
    this.x.openModal(`<div class="eyebrow">${tr('Entrenamiento', 'Training')}</div><h2 id="modal-title">${T.name}: ${Math.round((run.score ?? 0) * 100)} %</h2>
      <ul class="gains">${gains}</ul><p>${tr(`+${out.xp} de experiencia de jinete${out.levelUp ? ' · <b>¡subiste de nivel!</b> Tienes un punto de habilidad en Jinete' : ''}.`, `+${out.xp} rider experience${out.levelUp ? ' · <b>you leveled up!</b> You have a skill point in Rider' : ''}.`)}${out.sweaty ? tr(` ${esc(h.name)} quedó ${C.g(h, 'sudado', 'sudada')}: dale una ducha en el establo.`, ` ${esc(h.name)} is sweaty: give ${C.g(h, 'him', 'her')} a shower in the stable.`) : ''}</p>
      <p class="note">${tr(`Energía de ${esc(h.name)}`, `${esc(h.name)}’s energy`)}: ${pct(h.needs.energia)}.${h.trainedToday[run.key] ? tr(' Repetir el mismo trabajo hoy rinde menos.', ' Repeating the same work today is less effective.') : ''}</p>
      <div class="btns"><button class="btn primary" data-a="back-ranch" data-autofocus><span>${tr('Volver al rancho', 'Back to the ranch')}</span></button>${h.needs.energia >= T.energy ? `<button class="btn" data-a="train-again" data-k="${run.key}"><span>${tr('Entrenar otra vez', 'Train again')}</span></button>` : ''}</div>`, '', { escape: () => { this.x.closeModal(); this.enterRanch(); } });
  }
}
