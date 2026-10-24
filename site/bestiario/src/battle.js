// Combate por turnos en la arena: motor (Battle), criaturas en escena y controles. El motor no toca el DOM ni Three.js:
// recibe la acción del jugador y devuelve la lista de sucesos de la ronda, que la interfaz reproduce con animaciones.
import * as THREE from '../vendor/three.module.js';
import { elementMul, MOVES, APPLE_MOVES, rewardFor, LEAGUE } from './battle-data.js';
import { Sound } from './audio.js';
import { STATUS, ITEM_INDEX, powersOf, elementName } from './catalog.js';
import { SPECIES, ELEMENTS } from './species.js';
import { spawnCreature } from './model3d.js';
import * as G from './state.js';
import { LOD, CALM } from './quality.js';
import { L, onLang } from './i18n.js';

const PS = () => L('PS', 'HP');

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// =============================================================== MOTOR ===============================================================
function fighterOf(c, side, enemy = false) {
  const sp = G.speciesOf(c.species), mv = MOVES[c.species] || { strike: L('Golpe', 'Strike'), special: L('Ataque elemental', 'Elemental attack'), traits: {} };
  const fm = G.formMul(c), st = Object.fromEntries(Object.entries(c.stats).map(([k, v]) => [k, v * fm]));   // las formas 2 y 3 dan +10 % y +15 % a las estadísticas
  const powers = new Set(powersOf(sp.element, c.apples || 0).map((p) => p.id));      // poderes permanentes por manzanas
  const traits = { ...(mv.traits || {}) };
  if (powers.has('temblor')) st.fuerza *= 1.15;
  if (powers.has('llamarada')) traits.elemBoost = (traits.elemBoost || 0) + 0.2;
  if (powers.has('alas-veloces')) traits.dodge = (traits.dodge || 0) + 0.1;
  if (powers.has('ojo-tormenta')) traits.crit = (traits.crit || 0) + 0.2;
  if (powers.has('marea-viva')) traits.regen = (traits.regen || 0) + 0.02;
  if (powers.has('raices')) traits.regen = (traits.regen || 0) + 0.015;
  return {
    side, c, sp, get name() { return c.name; }, element: sp.element, level: c.level, max: G.hpMax(c), hp: enemy ? G.hpMax(c) : c.hp,
    st, aff: c.aff, form: c.form || 'base', status: new Set(c.status || []), buffs: new Set((c.buffs || []).map((b) => b.id)),
    defend: false, skipNext: false, stunGrace: false, appleUses: 0, cd: 0, revived: false, traits, mv, enraged: false, powers,
  };
}

const APPLE_LIMIT = 3;   // manzanas ofensivas por combate (la dorada no cuenta)

export class Battle {
  // player: criatura del equipo; enemy: criatura efímera; rival: {tier, level, mul, species}; sparring: sin riesgo ni botín
  constructor({ player, enemy, rival, sparring = false, bag = {}, rnd = Math.random }) {
    this.rnd = rnd; this.rival = rival; this.sparring = sparring;
    this.p = fighterOf(player, 'p'); this.e = fighterOf(enemy, 'e', true);
    this.bag = { ...bag }; this.spent = {}; this.turn = 1; this.over = null;
    this.startHp = player.hp; this.startStatus = [...player.status];
  }
  other(f) { return f === this.p ? this.e : this.p; }
  use(id, n = 1) { this.bag[id] = (this.bag[id] || 0) - n; this.spent[id] = (this.spent[id] || 0) + n; }

  intro() {
    const r = this.rival, ev = [{ t: 'text', text: this.sparring ? L(`Práctica: ${this.p.name} contra el muñeco de combate.`, `Practice: ${this.p.name} against the training dummy.`) : r.intro || L(`${r.tier.name}: ${this.e.name} (nivel ${this.e.level}) quiere pelear.`, `${r.tier.name}: ${this.e.name} (level ${this.e.level}) wants to fight.`) }];
    if (this.p.buffs.size) ev.push({ t: 'text', text: L(`Efectos activos: ${[...this.p.buffs].map((b) => ITEM_INDEX.get(b).name).join(', ')}.`, `Active effects: ${[...this.p.buffs].map((b) => ITEM_INDEX.get(b).name).join(', ')}.`) });
    return ev;
  }

  // ---- daño
  hitChance(att, def, kind) {
    if (att.buffs.has('foco') && kind !== 'strike') return 1;
    const dodge = clamp((def.st.agilidad - att.st.agilidad) * 0.02, 0, 0.25) + (def.traits.dodge || 0) + (def.buffs.has('tormenta') ? 0.1 : 0) + 0.03;
    return clamp((kind === 'strike' ? 0.97 : kind === 'special' ? 0.93 : 1) - dodge, 0.35, 1);
  }
  damage(att, def, base, kind, opts = {}) {
    let d = base;
    if (att.buffs.has('furia')) d *= 1.2;
    if (att.status.has('miedo')) d *= 0.75;
    if (att.enraged) d *= 1.2;
    if (kind === 'strike') d *= 1 + (att.traits.strikeBoost || 0);
    if (kind === 'special') d *= 1 + (att.traits.elemBoost || 0);
    let mul = 1;
    if (opts.element) mul = elementMul(opts.element, def.element);
    d *= mul;
    if (!opts.pierce) {
      d *= 1 - (def.traits.armor || 0);
      if (def.powers.has('escudo-marea')) d *= 0.9;
      if (kind === 'strike' && def.powers.has('piel-roca')) d *= 0.9;
      if (def.buffs.has('piedra')) d *= 0.75;
      if (def.defend) d *= 0.4;
      if (kind === 'strike') d -= def.st.vitalidad * 0.35;
    }
    d *= 0.88 + this.rnd() * 0.24;
    const crit = !opts.noCrit && this.rnd() < (att.traits.crit || 0) + 0.06 + (att.buffs.has('foco') && kind === 'special' ? 0.25 : 0);
    if (crit) d *= 1.5;
    return { dmg: Math.max(1, Math.round(d)), crit, mul };
  }
  applyHit(def, dmg, ev, extra = {}) {
    def.hp = Math.max(0, def.hp - dmg);
    ev.push({ t: 'hit', who: def.side, dmg, hp: def.hp, max: def.max, ...extra });
    if (def.hp <= 0) this.checkKo(def, ev);
  }
  checkKo(f, ev) {
    if (f.hp > 0) return;
    if (f.traits.revive && !f.revived) { f.revived = true; f.hp = Math.round(f.max * (typeof f.traits.revive === 'number' ? f.traits.revive : 0.3)); f.status.clear(); ev.push({ t: 'heal', who: f.side, amount: f.hp, hp: f.hp, max: f.max, text: L(`¡${f.name} renace de sus cenizas!`, `${f.name} rises from its ashes!`) }); return; }
    ev.push({ t: 'ko', who: f.side });
    this.over = f.side === 'p' ? 'lose' : 'win';
  }
  addStatus(f, id, ev) {
    if (f.hp <= 0 || f.status.has(id)) return;
    f.status.add(id); ev.push({ t: 'status', who: f.side, id, on: true, text: L(`${f.name} sufre ${STATUS[id].name.toLowerCase()}.`, `${f.name} suffers ${STATUS[id].name.toLowerCase()}.`) });
  }

  // ---- acciones
  doStrike(att, ev) {
    const def = this.other(att), mv = att.mv;
    ev.push({ t: 'move', who: att.side, name: mv.strike, anim: 'attack' });
    const hits = att.traits.triple ? 3 : att.traits.double ? 2 : 1, part = att.traits.triple ? 0.45 : att.traits.double ? 0.6 : 1;
    for (let i = 0; i < hits; i++) {
      if (def.hp <= 0) break;
      if (this.rnd() > this.hitChance(att, def, 'strike')) { ev.push({ t: 'miss', who: def.side, text: L(`${def.name} esquiva.`, `${def.name} dodges.`) }); continue; }
      const base = (6 + att.st.fuerza * 1.7 + att.level * 1.2) * part;
      const { dmg, crit } = this.damage(att, def, base, 'strike');
      this.applyHit(def, dmg, ev, { crit });
      if (att.traits.venom && this.rnd() < att.traits.venom) this.addStatus(def, 'veneno', ev);
      if (def.powers.has('piel-ardiente') && att.hp > 0 && this.rnd() < 0.25) this.addStatus(att, 'quemadura', ev);
    }
  }
  doSpecial(att, ev) {
    const def = this.other(att), mv = att.mv;
    ev.push({ t: 'move', who: att.side, name: mv.special, anim: 'cast', element: att.element });
    att.cd = 3;
    if (this.rnd() > this.hitChance(att, def, 'special')) { ev.push({ t: 'miss', who: def.side, text: L(`${def.name} evita ${mv.special}.`, `${def.name} avoids ${mv.special}.`) }); return; }
    const base = 4 + att.st.magia * 2.5 + (att.aff[att.element] || 0) * 2.5 + att.level * 1.2;
    const { dmg, crit, mul } = this.damage(att, def, base, 'special', { element: att.element });
    this.applyHit(def, dmg, ev, { crit, mul });
    if (def.hp > 0 && att.powers.has('tiburon')) this.applyHit(def, Math.max(1, Math.round(def.max * 0.04)), ev, { label: 'tiburón' });
    if (def.hp > 0) {
      if (att.element === 'fuego' && this.rnd() < 0.25) this.addStatus(def, 'quemadura', ev);
      else if (att.element === 'tierra' && this.rnd() < 0.2) this.addStatus(def, 'miedo', ev);
      else if (att.element === 'aire' && !def.stunGrace && this.rnd() < 0.15) { def.skipNext = true; ev.push({ t: 'text', text: L(`${def.name} sufre aturdimiento.`, `${def.name} is stunned.`) }); }
      else if (att.traits.fear && this.rnd() < att.traits.fear) this.addStatus(def, 'miedo', ev);
    }
  }
  doDefend(att, ev) {
    att.defend = true; ev.push({ t: 'move', who: att.side, name: L('Defensa', 'Defend'), anim: 'guard' });
    const h = Math.max(1, Math.round(att.max * 0.04)); att.hp = Math.min(att.max, att.hp + h);
    ev.push({ t: 'heal', who: att.side, amount: h, hp: att.hp, max: att.max, text: L(`${att.name} se cubre.`, `${att.name} takes cover.`) });
  }
  doApple(att, id, ev) {
    const def = this.other(att), am = APPLE_MOVES[id], el = ITEM_INDEX.get(id).element;
    if (el && el !== att.element) { ev.push({ t: 'text', text: L(`${att.name} no puede usar la ${am.name.toLowerCase()}: es de ${el}.`, `${att.name} can’t use the ${am.name}: it is ${elementName(el).toLowerCase()}.`) }); return; }
    if (id !== 'manzana-dorada' && att.appleUses >= APPLE_LIMIT) { ev.push({ t: 'text', text: L(`${att.name} ya no puede lanzar más manzanas en este combate.`, `${att.name} can’t throw any more apples in this battle.`) }); return; }
    if (id !== 'manzana-dorada') att.appleUses++;
    this.use(id);
    ev.push({ t: 'move', who: att.side, name: am.name, anim: 'cast', element: ITEM_INDEX.get(id).element, apple: id });
    if (id === 'manzana-dorada') {
      att.hp = att.max; att.status.clear();
      ev.push({ t: 'heal', who: att.side, amount: att.max, hp: att.hp, max: att.max, text: L(`${att.name} recupera toda su vida.`, `${att.name} recovers all its health.`), clear: true }); return;
    }
    if (id === 'manzana-fuego') {
      const { dmg, mul } = this.damage(att, def, 30 + att.st.magia * 1.5, 'apple', { element: 'fuego', pierce: true, noCrit: true });
      this.applyHit(def, dmg, ev, { mul });
      if (def.hp > 0 && this.rnd() < 0.4) this.addStatus(def, 'quemadura', ev);
    } else if (id === 'manzana-agua') {
      this.applyHit(def, Math.max(12, Math.ceil(def.hp / 4)), ev, { label: 'tiburón' });
    } else if (id === 'manzana-aire') {
      this.applyHit(def, 50, ev, { label: 'viento' });
      if (def.hp > 0 && !def.stunGrace) { def.skipNext = true; ev.push({ t: 'text', text: L(`${def.name} pierde su próximo turno.`, `${def.name} loses its next turn.`) }); }
      else if (def.hp > 0) ev.push({ t: 'text', text: L(`${def.name} se mantiene firme: no se aturde otra vez seguida.`, `${def.name} stands firm: it can’t be stunned twice in a row.`) });
    } else if (id === 'manzana-tierra') {
      this.applyHit(def, 100, ev, { label: 'picos' });
    }
  }
  doItem(att, id, ev) {
    const it = ITEM_INDEX.get(id);
    this.use(id);
    ev.push({ t: 'move', who: att.side, name: it.name, anim: 'item' });
    if (it.kind === 'kit') { const h = Math.round(att.max * it.heal), real = Math.min(h, att.max - att.hp); att.hp += real; ev.push({ t: 'heal', who: att.side, amount: real, hp: att.hp, max: att.max, text: L(`${att.name} recupera ${real} PS.`, `${att.name} recovers ${real} HP.`) }); }
    else if (it.kind === 'potion') { att.buffs.add(id); ev.push({ t: 'text', text: `${att.name}: ${it.name}.` }); }
    else if (it.kind === 'cure') { att.status.delete(it.cures); ev.push({ t: 'status', who: att.side, id: it.cures, on: false, text: L(`${att.name} ya no tiene ${STATUS[it.cures].name.toLowerCase()}.`, `${att.name} is no longer affected by ${STATUS[it.cures].name.toLowerCase()}.`) }); }
  }

  // ---- IA del rival
  enemyChoice() {
    const e = this.e, boss = this.rival && (this.rival.tier.id === 'jefe' || this.rival.boss);
    if (boss && !e.enraged && e.hp < e.max * 0.35) { e.enraged = true; this.pendingText = L(`${e.name} se enfurece.`, `${e.name} flies into a rage.`); }
    if (e.hp < e.max * 0.3 && this.rnd() < 0.3) return { type: 'defend' };
    if (e.cd <= 0 && this.rnd() < (boss ? 0.6 : 0.42)) return { type: 'special' };
    return { type: 'strike' };
  }

  // ---- una ronda: el jugador elige; el rival responde; se resuelve por iniciativa
  act(action) {
    const ev = [];
    if (this.over) return { events: ev, over: this.over };
    const p = this.p, e = this.e;
    this.pendingText = null;
    p.defend = false; e.defend = false;   // la guardia de la ronda anterior termina aquí
    const ea = this.enemyChoice();
    if (this.pendingText) ev.push({ t: 'text', text: this.pendingText });
    if (action.type === 'flee') {
      const ok = this.sparring || this.rnd() < clamp(0.35 + (p.st.agilidad - e.st.agilidad) * 0.05, 0.15, 0.9);
      ev.push({ t: 'text', text: ok ? L(`${p.name} huye del combate.`, `${p.name} flees the battle.`) : L(`${p.name} no logra escapar.`, `${p.name} fails to escape.`) });
      if (ok) { this.over = 'fled'; return { events: ev, over: 'fled' }; }
      action = { type: 'none' };
    }
    const prio = (f, a) => (a.type === 'defend' ? 40 : a.type === 'item' ? 60 : 0) + f.st.agilidad + this.rnd() * 3 - (f.traits.slow ? 3 : 0) + (f.powers.has('rafaga') ? 3 : 0) + (f.buffs.has('tormenta') ? 50 : 0);
    const order = [[p, action, prio(p, action)], [e, ea, prio(e, ea)]].sort((a, b) => b[2] - a[2]);
    for (const [f, a] of order) {
      if (this.over) break;
      if (f.hp <= 0) continue;
      if (f.skipNext) {
        f.skipNext = false;
        if (f.powers.has('raices')) ev.push({ t: 'text', text: L(`${f.name} se aferra al suelo y no se aturde.`, `${f.name} holds fast to the ground and isn’t stunned.`) });
        else { ev.push({ t: 'text', text: L(`${f.name} pierde el turno por el aturdimiento.`, `${f.name} loses its turn to the stun.`) }); f.stunGrace = true; continue; }
      }
      f.defend = false; f.stunGrace = false;
      switch (a.type) {
        case 'strike': this.doStrike(f, ev); break;
        case 'special': this.doSpecial(f, ev); break;
        case 'defend': this.doDefend(f, ev); break;
        case 'apple': this.doApple(f, a.id, ev); break;
        case 'item': this.doItem(f, a.id, ev); break;
        default: break;
      }
    }
    // fin de ronda: estados, regeneración y esperas
    const alive = [p, e].filter((f) => f.hp > 0);
    for (const f of alive) {
      if (this.over) break;
      for (const [id, pct] of [['quemadura', 0.06], ['veneno', 0.05]]) if (f.status.has(id)) {
        const d = Math.max(1, Math.round(f.max * pct)); f.hp = Math.max(0, f.hp - d);
        ev.push({ t: 'tick', who: f.side, id, dmg: d, hp: f.hp, max: f.max });
      }
    }
    for (const f of [e, p]) if (!this.over && f.hp <= 0 && alive.includes(f)) this.checkKo(f, ev);   // si caen los dos a la vez, gana el jugador
    for (const f of alive) {
      if (this.over || f.hp <= 0) continue;
      if (f.hp > 0) {
        const reg = (f.buffs.has('savia') ? 0.05 : 0) + (f.traits.regen || 0);
        if (reg && f.hp < f.max) { const h = Math.min(f.max - f.hp, Math.max(1, Math.round(f.max * reg))); f.hp += h; ev.push({ t: 'heal', who: f.side, amount: h, hp: f.hp, max: f.max }); }
      }
      if (f.cd > 0) f.cd--;
      for (const [id, pr, txt] of [['miedo', 0.3, L('recupera el valor', 'regains its courage')], ['quemadura', 0.25, L('apaga las llamas', 'puts out the flames')], ['veneno', 0.25, L('elimina el veneno', 'shakes off the poison')]]) {
        if (f.status.has(id) && this.rnd() < pr) { f.status.delete(id); ev.push({ t: 'status', who: f.side, id, on: false, text: `${f.name} ${txt}.` }); }
      }
    }
    if (!this.over) this.turn++;
    if (!this.over && this.turn > 80) { this.over = 'fled'; ev.push({ t: 'text', text: L('El combate se alarga demasiado: los dos se retiran.', 'The battle drags on too long: both sides withdraw.') }); }
    if (this.over) ev.push({ t: 'end', result: this.over });
    return { events: ev, over: this.over };
  }

  result() {
    const win = this.over === 'win', rw = win && !this.sparring ? rewardFor({ ...this.rival, element: this.e.element }, this.rnd) : { coins: 0, xp: this.sparring && win && this.e.level <= 10 ? 20 + this.e.level * 4 : 0, drops: {} };
    return {
      win, fled: this.over === 'fled', sparring: this.sparring,
      hp: this.sparring ? this.startHp : this.p.hp, status: this.sparring ? this.startStatus : [...this.p.status],
      spent: { ...this.spent }, xp: rw.xp, coins: rw.coins, drops: rw.drops,
    };
  }
}

// ======================================================== ESCENA, INTERFAZ Y FLUJO ========================================================
const ARENA = { x: 0, z: -30 };
let speed = 1;   // 1 o 2: el botón «Velocidad» acorta las esperas entre sucesos
const wait = (ms) => new Promise((r) => setTimeout(r, ms / speed));
const css = (n) => '#' + n.toString(16).padStart(6, '0');

// criatura de repuesto (una masa con ojos) para las especies que todavía no tienen modelo 3D
function placeholderActor(sp, scene, x, z, yaw, scale = 1) {
  const col = new THREE.Color(ELEMENTS[sp.element].color).multiplyScalar(0.55);
  const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 });
  const holder = new THREE.Group(), root = new THREE.Group(); holder.add(root);
  const add = (geo, m, px, py, pz, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.scale.set(sx, sy, sz); o.castShadow = true; root.add(o); return o; };
  add(new THREE.SphereGeometry(1, 16, 12), mat, 0, 1.3, 0, 0.9, 0.8, 1.5);
  add(new THREE.SphereGeometry(0.55, 14, 10), mat, 0, 1.9, 1.5);
  for (const sx of [-1, 1]) {
    add(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: 0x200800, emissive: 0xff7a2a, emissiveIntensity: 2 }), sx * 0.22, 2.0, 1.95);
    for (const sz of [-0.8, 0.8]) add(new THREE.CylinderGeometry(0.22, 0.16, 1.0, 8), mat, sx * 0.55, 0.5, sz);
    add(new THREE.ConeGeometry(0.14, 0.6, 6), mat, sx * 0.3, 2.4, 1.3);
  }
  holder.scale.setScalar(scale); holder.position.set(x, 0, z); holder.rotation.y = yaw; scene.add(holder);
  let t = Math.random() * 6, pulse = 0;
  return {
    holder, root, x, z, placeholder: true,
    update(dt) { t += dt; root.position.y = Math.sin(t * 2) * 0.04; pulse = Math.max(0, pulse - dt * 2); root.scale.setScalar(1 + pulse * 0.12); },
    roar() { pulse = 1; },
    setSkin() {}, setTint() {},
  };
}

export function createBattle({ scene, camera, player, world, say, panels, goto }) {
  const lod = LOD;
  const el = document.createElement('div');
  el.id = 'battle'; el.setAttribute('data-ui', ''); el.hidden = true;
  el.innerHTML = `
    <div class="bt-hud">
      <div class="bt-top"><div class="bt-card p" id="bt-p"></div><div class="bt-vs">VS</div><div class="bt-card e" id="bt-e"></div></div>
      <div class="bt-row2"><div class="bt-log" id="bt-log" aria-live="polite"></div>
        <button class="bt-speed" id="bt-speed" data-a="speed" type="button" aria-pressed="false" aria-label="" title="">×1</button></div>
    </div>
    <div class="bt-fx" id="bt-fx"></div>
    <div class="bt-sub" id="bt-sub" hidden></div>
    <div class="bt-menu" id="bt-menu"></div>
    <div class="bt-end" id="bt-end" hidden></div>`;
  document.body.appendChild(el);
  const $ = (s) => el.querySelector(s);
  const state = { active: false, b: null, fighters: {}, busy: false, shake: { p: 0, e: 0 }, lunge: { p: 0, e: 0 }, t: 0, sub: null, cam: null, sep: 3.4, span: 12 };

  // ---- escena
  async function spawn(speciesId, side, creature) {
    const sp = G.speciesOf(speciesId), x = ARENA.x + (side === 'p' ? -state.sep : state.sep), z = ARENA.z, yaw = side === 'p' ? Math.PI / 2 : -Math.PI / 2;
    if (!sp.model) return placeholderActor(sp, scene, x, z, yaw, 1.1);
    const getMeta = (l) => fetch(`assets/${sp.model}-${l}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    let l = lod, meta = await getMeta(l); if (!meta && l === 'sd') { l = 'hd'; meta = await getMeta('hd'); }
    meta = { scale: sp.scale || 1, offsetZ: sp.offsetZ || 0, ...(meta || {}) };
    let scale = meta.scale;
    if (meta.size && !sp.scale) scale = clamp(3.7 / Math.max(meta.size.largo, meta.size.alto * 1.5, meta.size.ancho * 1.4), 0.25, 1.15);
    const skin = sp.skin || null;
    const a = await spawnCreature({ url: `assets/${sp.model}-${l}.glb`, scene, x, z, yaw, scale, offsetZ: meta.offsetZ, skin });
    if (creature && creature.form && creature.form !== 'base') a.setForm(creature.form);
    return a;
  }
  function clearScene() {
    for (const k of ['p', 'e']) { const a = state.fighters[k]; if (a) { scene.remove(a.holder); } }
    state.fighters = {};
  }
  const home = (k) => ({ x: ARENA.x + (k === 'p' ? -(state.sep - 0.4) : state.sep - 0.4), z: ARENA.z });
  // si un modelo no carga (red caída), el combate sigue con la criatura de repuesto en vez de quedarse bloqueado
  const safeSpawn = (id, side, c) => spawn(id, side, c).catch((e) => {
    console.warn('Modelo no disponible, se usa uno de repuesto:', id, e);
    return placeholderActor(G.speciesOf(id), scene, ARENA.x + (side === 'p' ? -state.sep : state.sep), ARENA.z, side === 'p' ? Math.PI / 2 : -Math.PI / 2, 1.1);
  });

  // ---- interfaz
  function cardHtml(f) {
    const pct = (f.hp / f.max) * 100;
    const all = [...[...f.status].map((s) => [`<span class="chip st" style="border-color:${STATUS[s].color};color:${STATUS[s].color}">${STATUS[s].name}</span>`, STATUS[s].name]),
      ...[...f.buffs].map((b) => [`<span class="chip">${ITEM_INDEX.get(b).name}</span>`, ITEM_INDEX.get(b).name]), ...(f.defend ? [[`<span class="chip">${L('Guardia', 'Guard')}</span>`, L('Guardia', 'Guard')]] : [])];
    const chips = all.slice(0, 2).map((x) => x[0]).join('') + (all.length > 2 ? `<span class="chip" title="${all.slice(2).map((x) => x[1]).join(', ')}">+${all.length - 2}</span>` : '');
    return `<b>${f.name} <em>${L('nv', 'lv')} ${f.level} · ${elementName(f.element)}</em></b><div class="bt-hp"><i style="width:${pct}%" class="${pct < 30 ? 'low' : ''}"></i></div><small>${Math.max(0, Math.round(f.hp))}/${f.max} ${PS()}</small><div class="chips">${chips}</div>`;
  }
  function refreshCards() { $('#bt-p').innerHTML = cardHtml(state.b.p); $('#bt-e').innerHTML = cardHtml(state.b.e); }
  // actualiza la barra de un luchador con un valor intermedio (para animar los golpes uno a uno)
  function setHp(side, hp) {
    const f = side === 'p' ? state.b.p : state.b.e, card = $('#bt-' + side);
    const pct = clamp((hp / f.max) * 100, 0, 100);
    const bar = card.querySelector('.bt-hp i'); bar.style.width = pct + '%'; bar.className = pct < 30 ? 'low' : '';
    card.querySelector('small').textContent = `${Math.max(0, Math.round(hp))}/${f.max} ${PS()}`;
  }
  const logLines = [];
  function log(text) { if (!text) return; logLines.push(text); while (logLines.length > 3) logLines.shift(); $('#bt-log').innerHTML = logLines.map((l, i) => `<div class="${i === logLines.length - 1 ? 'now' : ''}">${l}</div>`).join(''); }
  function floatText(side, text, cls = '') {
    const a = state.fighters[side]; if (!a) return;
    const v = new THREE.Vector3(a.holder.position.x, 2.6, a.holder.position.z).project(camera);
    const d = document.createElement('div'); d.className = 'bt-num ' + cls; d.textContent = text;
    d.style.left = ((v.x * 0.5 + 0.5) * innerWidth).toFixed(0) + 'px'; d.style.top = ((-v.y * 0.5 + 0.5) * innerHeight).toFixed(0) + 'px';
    $('#bt-fx').appendChild(d); setTimeout(() => d.remove(), 1300);
  }

  const appleOk = (b, id) => {   // ¿puede esta criatura lanzar esta manzana ahora mismo?
    const n = b.bag[id] || 0, el = ITEM_INDEX.get(id).element, gold = id === 'manzana-dorada';
    const noUse = gold && b.p.hp >= b.p.max && !b.p.status.size, capped = !gold && b.p.appleUses >= APPLE_LIMIT;
    return { ok: n > 0 && (!el || el === b.p.element) && !noUse && !capped, n, el, noUse, capped };
  };
  const itemUseless = (b, id) => { const it = ITEM_INDEX.get(id); return (it.kind === 'cure' && !b.p.status.has(it.cures)) || (it.kind === 'kit' && b.p.hp >= b.p.max) || (it.kind === 'potion' && b.p.buffs.has(id)); };
  const usableItems = (b) => Object.keys(b.bag).filter((id) => { const it = ITEM_INDEX.get(id); return it && ['kit', 'potion', 'cure'].includes(it.kind) && b.bag[id] > 0 && !itemUseless(b, id); });
  function menuHtml() {
    const b = state.b, p = b.p;
    const nApples = Object.keys(APPLE_MOVES).filter((id) => appleOk(b, id).ok).length, nItems = usableItems(b).length;
    return `<button data-a="strike"><b>${p.mv.strike}<kbd>1</kbd></b><small>${L('Golpe físico', 'Physical blow')}</small></button>
      <button data-a="special"${p.cd > 0 ? ' disabled' : ''}><b>${p.mv.special}<kbd>2</kbd></b><small>${p.cd > 0 ? L(`Recarga: ${p.cd} ${p.cd === 1 ? 'ronda' : 'rondas'}`, `Recharging: ${p.cd} ${p.cd === 1 ? 'round' : 'rounds'}`) : L(`${elementName(p.element)} · usa Magia`, `${elementName(p.element)} · uses Magic`)}</small></button>
      <button data-a="defend"><b>${L('Defender', 'Defend')}<kbd>3</kbd></b><small>${L('Reduce el daño y cura un 4 % de tus PS', 'Reduces damage and heals 4 % of your HP')}</small></button>
      <button data-a="apples"${nApples ? '' : ' disabled'}><b>${L('Manzanas', 'Apples')} <em>(${nApples})</em><kbd>4</kbd></b><small>${nApples ? L('Ataques y curas', 'Attacks and healing') : L('Ninguna que puedas usar', 'None you can use')}</small></button>
      <button data-a="items"${nItems ? '' : ' disabled'}><b>${L('Objetos', 'Items')} <em>(${nItems})</em><kbd>5</kbd></b><small>${nItems ? L('Curas y pociones', 'Healing and potions') : L('Ninguno que puedas usar', 'None you can use')}</small></button>
      <button data-a="flee"><b>${L('Huir', 'Flee')}<kbd>6</kbd></b><small>${L('Depende de la agilidad', 'Depends on agility')}</small></button>`;
  }
  function showMenu() { $('#bt-menu').innerHTML = menuHtml(); $('#bt-menu').classList.remove('off'); closeSub(); }
  function lockMenu() { $('#bt-menu').classList.add('off'); closeSub(); }
  function closeSub() { $('#bt-sub').hidden = true; state.sub = null; for (const x of el.querySelectorAll('#bt-menu .open')) x.classList.remove('open'); }
  function openSub(kind) {
    const b = state.b, rows = [];
    if (kind === 'apples') {
      for (const id of Object.keys(APPLE_MOVES)) {
        const { ok, n, el: elem, noUse, capped } = appleOk(b, id);   // las manzanas de un elemento solo las usan criaturas de ese elemento
        rows.push(`<button data-a="apple" data-id="${id}"${ok ? '' : ' disabled'}><b>${APPLE_MOVES[id].name} <em>× ${n}</em></b><small>${ok ? APPLE_MOVES[id].desc : !n ? L('No tienes.', 'You have none.') : noUse ? L('Ya tienes toda la vida y ningún estado.', 'You already have full health and no conditions.') : capped ? L(`Máximo ${APPLE_LIMIT} manzanas por combate.`, `Maximum ${APPLE_LIMIT} apples per battle.`) : L('Solo para criaturas de ' + elementName(elem).toLowerCase() + '.', 'Only for ' + elementName(elem).toLowerCase() + ' creatures.')}</small></button>`);
      }
    } else {
      for (const id of Object.keys(b.bag)) {
        const it = ITEM_INDEX.get(id); if (!it || !['kit', 'potion', 'cure'].includes(it.kind) || b.bag[id] <= 0) continue;
        rows.push(`<button data-a="item" data-id="${id}"${itemUseless(b, id) ? ' disabled' : ''}><b>${it.name} <em>× ${b.bag[id]}</em></b><small>${it.desc}</small></button>`);
      }
      if (!rows.length) rows.push(`<p class="none">${L('No tienes curas ni pociones. Hay en la Enfermería.', 'You have no healing items or potions. The Infirmary sells them.')}</p>`);
    }
    $('#bt-sub').innerHTML = rows.join('') + `<button data-a="back" class="back">${L('Volver', 'Back')} <kbd>Esc</kbd></button>`; $('#bt-sub').hidden = false; state.sub = kind;
    for (const x of el.querySelectorAll('#bt-menu .open')) x.classList.remove('open');
    const mb = el.querySelector(`#bt-menu [data-a="${kind}"]`); if (mb) mb.classList.add('open');
  }

  // ---- reproducción de los sucesos de una ronda
  async function playEvents(events) {
    const b = state.b;
    for (const ev of events) {
      const fx = state.fighters;
      switch (ev.t) {
        case 'text': log(ev.text); await wait(650); break;
        case 'move': {
          log(L(`${ev.who === 'p' ? b.p.name : b.e.name} usa ${ev.name}.`, `${ev.who === 'p' ? b.p.name : b.e.name} uses ${ev.name}.`));
          const a = fx[ev.who]; if (a && ev.anim !== 'item' && ev.anim !== 'guard') { a.roar(); state.lunge[ev.who] = ev.anim === 'attack' ? 1 : 0.35; }
          Sound.sfx(ev.anim === 'cast' && ev.element ? ev.element : ev.anim === 'attack' ? 'swing' : ev.anim === 'item' ? 'click' : ev.anim === 'cast' ? 'heal' : 'open');
          if (ev.element && ev.anim === 'cast') floatText(ev.who, '✦', 'cast');
          await wait(520); break;
        }
        case 'hit': {
          const side = ev.who; state.shake[side] = 1; setHp(side, ev.hp); Sound.sfx(ev.crit ? 'crit' : 'hit');
          floatText(side, `−${ev.dmg}`, ev.crit ? 'crit' : ev.mul > 1 ? 'good' : ev.mul < 1 ? 'weak' : '');
          if (ev.crit) log(L('¡Golpe crítico!', 'Critical hit!')); if (ev.mul > 1) log(L('¡Es muy eficaz!', 'It’s super effective!')); else if (ev.mul < 1) log(L('No es muy eficaz…', 'It’s not very effective…'));
          await wait(520); break;
        }
        case 'miss': Sound.sfx('miss'); floatText(ev.who, L('Falla', 'Miss'), 'miss'); log(ev.text); await wait(520); break;
        case 'heal': Sound.sfx('heal'); setHp(ev.who, ev.hp); floatText(ev.who, `+${ev.amount}`, 'heal'); if (ev.text) log(ev.text); await wait(520); break;
        case 'status': refreshCards(); setHp('p', b.p.hp); setHp('e', b.e.hp); if (ev.text) log(ev.text); await wait(450); break;
        case 'tick': state.shake[ev.who] = 0.5; setHp(ev.who, ev.hp); floatText(ev.who, `−${ev.dmg}`, 'tick'); log(L(`${ev.who === 'p' ? b.p.name : b.e.name} sufre ${STATUS[ev.id].name.toLowerCase()} (−${ev.dmg} PS).`, `${ev.who === 'p' ? b.p.name : b.e.name} suffers ${STATUS[ev.id].name.toLowerCase()} (−${ev.dmg} HP).`)); await wait(520); break;
        case 'ko': Sound.sfx('ko'); log(L(`${ev.who === 'p' ? b.p.name : b.e.name} queda fuera de combate.`, `${ev.who === 'p' ? b.p.name : b.e.name} is knocked out.`)); state.fighters[ev.who] && (state.fighters[ev.who].ko = 0.001); await wait(900); break;
        default: break;
      }
    }
  }

  async function doAction(action) {
    if (state.busy || !state.active) return;
    state.busy = true; lockMenu();
    const { events, over } = state.b.act(action);
    await playEvents(events);
    refreshCards();
    if (over) { await finish(over); return; }
    log(askLine());
    state.busy = false; showMenu();
  }
  const askLine = () => L(`¿Qué hará ${state.b.p.name}?`, `What will ${state.b.p.name} do?`);

  async function finish(over) {
    const b = state.b, res = b.result();
    const r = G.finishBattle(b.p.c.id, res);
    const isWin = over === 'win', fled = over === 'fled';
    const drops = Object.entries(res.drops).map(([id, n]) => `${ITEM_INDEX.get(id).name}${n > 1 ? ' ×' + n : ''}`);
    const lines = [];
    if (b.sparring) lines.push(isWin ? (res.xp ? L(`Práctica terminada: +${res.xp} XP.`, `Practice over: +${res.xp} XP.`) : L('Práctica terminada. Tu criatura ya supera al muñeco: no da experiencia.', 'Practice over. Your creature has outgrown the dummy: no experience.')) : fled ? L('Práctica abandonada.', 'Practice abandoned.') : L('El muñeco te ganó esta vez, sin consecuencias.', 'The dummy won this time, with no consequences.'));
    else if (isWin) { lines.push(L(`+${res.coins} monedas`, `+${res.coins} coins`), `+${res.xp} XP`); if (drops.length) lines.push(L(`Botín: ${drops.join(', ')}`, `Loot: ${drops.join(', ')}`)); }
    else if (fled) lines.push(L('Huiste: sin recompensa ni castigo.', 'You fled: no reward and no penalty.'));
    else lines.push(L(`${b.p.name} quedó fuera de combate. Llévala a la Enfermería.`, `${b.p.name} was knocked out. Take it to the Infirmary.`));
    let lg = { first: false };
    if (isWin && !b.sparring && b.rival && b.rival.league != null) {
      lg = G.leagueWin(b.rival.league, b.rival.rematch);
      if (lg.first) { const it = ITEM_INDEX.get(lg.item[0]); lines.push(`<b class="emb" style="--c:${LEAGUE[b.rival.league].color}">${lg.emblem} · ${lg.n}/${LEAGUE.length}</b>`, L(`Premio del maestro: +${lg.prize} monedas y ${it.name.toLowerCase()}${lg.item[1] > 1 ? ' ×' + lg.item[1] : ''}`, `Master’s prize: +${lg.prize} coins and ${it.name}${lg.item[1] > 1 ? ' ×' + lg.item[1] : ''}`)); }
    }
    if (r.levelUps) lines.push(L(`¡${b.p.name} sube a nivel ${b.p.c.level}!`, `${b.p.name} reaches level ${b.p.c.level}!`));
    if (r.evolved) lines.push(L(`Evoluciona: ${r.evolved}.`, `It evolves: ${r.evolved}.`));
    const after = [b.p.c.hp > 0 && !b.sparring ? L(`recupera toda su salud (${Math.round(b.p.c.hp)}/${b.p.max} PS)`, `recovers all its health (${Math.round(b.p.c.hp)}/${b.p.max} HP)`) : `${Math.max(0, Math.round(b.p.c.hp))}/${b.p.max} ${PS()}`, ...b.p.c.status.map((x) => STATUS[x].name.toLowerCase())];
    const hurt = !b.sparring ? `<p class="hurt">${b.p.name} · ${after.join(' · ')}</p>` : '';
    if (lg.champion) {
      const st = G.state().stats;
      lines.length = 0;
      lines.push(L(`Venciste a los ocho maestros de la Liga. ${b.p.name} y tú son leyenda en el pueblo.`, `You defeated all eight League masters. ${b.p.name} and you are legends in the village.`),
        L(`Combates ganados: ${st.wins} · huevos eclosionados: ${st.hatched} · Bestiario: ${G.dexCount()}/${SPECIES.length} especies`, `Battles won: ${st.wins} · eggs hatched: ${st.hatched} · Bestiary: ${G.dexCount()}/${SPECIES.length} species`),
        L(`+${lg.prize} monedas. El Bestiario sigue abierto: completa las ${SPECIES.length} especies y defiende tu corona en las revanchas.`, `+${lg.prize} coins. The Bestiary is still open: complete all ${SPECIES.length} species and defend your crown in rematches.`));
    }
    const btns = lg.champion ? `<button data-a="exit" class="big">${L('Seguir jugando', 'Keep playing')}</button>` : !isWin && !fled && !b.sparring
      ? `<button data-a="clinic" class="big">${L('Ir a la Enfermería', 'Go to the Infirmary')}</button><button data-a="exit">${L('Salir', 'Leave')}</button>`
      : `<button data-a="again">${b.sparring ? L('Otra práctica', 'Practice again') : L('Elegir otro rival', 'Choose another rival')}</button><button data-a="exit" class="big">${b.sparring ? L('Salir', 'Leave') : L('Seguir', 'Continue')}</button>`;
    const end = $('#bt-end');
    Sound.sfx(lg.champion ? 'champion' : isWin ? 'win' : fled ? 'swing' : 'lose');
    if (r.levelUps && !lg.champion) setTimeout(() => Sound.sfx('levelup'), 1300);
    end.innerHTML = `<div class="bt-endcard ${lg.champion ? 'win champ' : isWin ? 'win' : fled ? 'fled' : 'lose'}" role="dialog" aria-label="${L('Resultado del combate', 'Battle result')}"><h2>${lg.champion ? L('¡Campeón del Bestiario!', 'Bestiary Champion!') : isWin ? L('¡Victoria!', 'Victory!') : fled ? L('Huida', 'Escape') : L('Derrota', 'Defeat')}</h2>${lines.map((l) => `<p>${l}</p>`).join('')}${hurt}<div class="bt-endbtns">${btns}</div></div>`;
    end.hidden = false; lockMenu();
    state.busy = false;
  }

  // ---- inicio y fin
  async function start(creatureId, rival, sparring = false) {
    if (state.active) return;
    const c = G.state().roster.find((x) => x.id === creatureId);
    if (!c || G.isKo(c) || G.isResting(c)) { say(L('Esa criatura no puede pelear ahora.', 'That creature can’t fight right now.')); return; }
    const spId = sparring ? c.species : rival.species;
    const level = sparring ? c.level : rival.level;
    const enemy = G.enemyCreature(spId, level);
    if (!sparring) {
      enemy.apples = rival.apples != null ? rival.apples : rival.tier.id === 'jefe' ? 3 : rival.tier.id === 'dificil' ? 1 : 0;   // los rivales fuertes también han comido manzanas
      if (rival.beast) enemy.name = rival.beast;
      const tr = rival.tier.train || 0, cap = G.statCap(enemy);                           // y han entrenado: un tramo del camino hasta el tope
      for (const k of Object.keys(enemy.stats)) enemy.stats[k] = Math.round(enemy.stats[k] + (cap - enemy.stats[k]) * tr);
      if (rival.tier.id === 'facil' && c.level <= 4) for (const k of Object.keys(enemy.stats)) enemy.stats[k] = Math.max(1, Math.round(enemy.stats[k] * 0.75));   // el Aprendiz se lo pone fácil a quien empieza
      enemy.hp = G.hpMax(enemy);
    }
    if (sparring) { enemy.name = L('Muñeco de combate', 'Training dummy'); rival = { tier: { id: 'sparring', get name() { return L('Práctica', 'Practice'); }, color: '#f0a23a' }, level, mul: 0, species: spId }; }
    state.active = true; state.busy = true; logLines.length = 0; $('#bt-log').innerHTML = '';
    Sound.setMode('combate');
    document.body.classList.add('in-battle'); el.hidden = false; $('#bt-end').hidden = true; lockMenu();
    player.root.visible = false;
    state.b = new Battle({ player: c, enemy, rival, sparring, bag: G.state().bag });
    state.sep = innerWidth / innerHeight < 0.8 ? 2.6 : 3.4;   // en pantalla vertical los luchadores se juntan para que quepan
    refreshCards();
    state.cam = { t: 0 };
    log(L('Preparando la arena…', 'Preparing the arena…'));
    try {
      [state.fighters.p, state.fighters.e] = await Promise.all([safeSpawn(c.species, 'p', c), safeSpawn(spId, 'e', enemy)]);
      let half = 0;   // medio ancho que ocupan los dos para encuadrarlos
      for (const k of ['p', 'e']) { const a = state.fighters[k]; a.holder.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(a.holder); half = Math.max(half, Math.abs(bb.min.x - ARENA.x), Math.abs(bb.max.x - ARENA.x)); }
      state.span = half * 2 + 1;
      logLines.length = 0; $('#bt-log').innerHTML = '';
      for (const ev of state.b.intro()) { log(ev.text); await wait(700); }
      log(askLine());
      state.busy = false; showMenu();
    } catch (e) {   // sin salida no se queda a nadie: se cierra el combate limpio
      console.error(e); exit(true); say(L('No se pudo iniciar el combate. Inténtalo de nuevo.', 'The battle couldn’t start. Please try again.'));
    }
  }
  function exit(again = false) {
    clearScene(); state.active = false; state.b = null; el.hidden = true; $('#bt-end').hidden = true;
    document.body.classList.remove('in-battle'); player.root.visible = true; Sound.setMode('pueblo');
    if (!again) panels.render();
  }

  // ---- entrada
  function toggleSpeed() {
    speed = speed === 1 ? 2 : 1; const sb = $('#bt-speed');
    sb.textContent = `×${speed}`; sb.setAttribute('aria-pressed', String(speed === 2)); speedLabel();
  }
  function speedLabel() {
    const sb = $('#bt-speed');
    sb.setAttribute('aria-label', L(`Velocidad del combate: ${speed === 2 ? 'rápida' : 'normal'}`, `Battle speed: ${speed === 2 ? 'fast' : 'normal'}`)); sb.title = L('Velocidad (V)', 'Speed (V)');
  }
  speedLabel();
  // cambio de idioma en pleno combate: tarjetas, menú y botones se repintan; la partida y la ronda en curso siguen igual
  onLang(() => {
    speedLabel();
    if (!state.active || !state.b) return;
    refreshCards();
    if (!state.busy && $('#bt-end').hidden) { const sub = state.sub; logLines.length = 0; log(askLine()); showMenu(); if (sub) openSub(sub); }
  });
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    const a = b.dataset.a;
    if (a === 'strike' || a === 'special' || a === 'defend' || a === 'flee') doAction({ type: a });
    else if (a === 'apples' || a === 'items') { if (state.sub === a) closeSub(); else openSub(a); }
    else if (a === 'back') closeSub();
    else if (a === 'speed') toggleSpeed();
    else if (a === 'clinic') { exit(); if (goto) goto('enfermeria'); }
    else if (a === 'apple') doAction({ type: 'apple', id: b.dataset.id });
    else if (a === 'item') doAction({ type: 'item', id: b.dataset.id });
    else if (a === 'exit') exit();
    else if (a === 'again') { const last = state.last; exit(true); if (last && last.npc) panels.openNpc(last.npc, last.sparring ? L('¿Otra ronda?', 'Another round?') : L('¿Otra pelea?', 'Another fight?'), last.sparring ? 'sparring' : last.league ? 'liga' : 'pelear'); else if (last && last.league) panels.open('pelea', null, 'liga'); }
  });
  addEventListener('keydown', (e) => {
    if (!state.active || !el.querySelector('#bt-end').hidden) return;
    if (e.code === 'KeyV' && !e.repeat) { toggleSpeed(); return; }
    if (state.busy) return;
    if ((e.code === 'Escape' || e.code === 'Backspace') && state.sub) { e.preventDefault(); closeSub(); return; }
    const map = { Digit1: 'strike', Digit2: 'special', Digit3: 'defend', Digit4: 'apples', Digit5: 'items', Digit6: 'flee' };
    const a = map[e.code]; if (!a) return;
    const btn = el.querySelector(`#bt-menu [data-a="${a}"]`); if (btn && !btn.disabled) btn.click();
  });

  // ---- cuadro a cuadro: animaciones de ataque/golpe y cámara propia
  function update(dt) {
    if (!state.active) return;
    state.t += dt;
    for (const k of ['p', 'e']) {
      const a = state.fighters[k]; if (!a) continue;
      a.update(dt);
      const h = home(k), dir = k === 'p' ? 1 : -1;
      state.lunge[k] = Math.max(0, state.lunge[k] - dt * 2.2); state.shake[k] = Math.max(0, state.shake[k] - dt * 3);
      const lg = Math.sin(clamp(state.lunge[k], 0, 1) * Math.PI) * 1.8;
      const sh = CALM ? 0 : Math.sin(state.t * 60) * 0.18 * state.shake[k];
      a.holder.position.x = h.x + dir * lg; a.holder.position.z = h.z + sh;
      if (a.ko) { a.ko = Math.min(1, a.ko + dt * 1.2); a.holder.rotation.z = (k === 'p' ? 1 : -1) * 1.3 * a.ko; a.holder.position.y = -0.25 * a.ko; }
    }
  }
  // devuelve true si la cámara quedó controlada por el combate
  function applyCamera() {
    if (!state.active) return false;
    const a = innerWidth / innerHeight, sway = CALM ? 0 : Math.sin(state.t * 0.35) * 0.8;
    let back = a < 1 ? 10.4 : 9.0, h = a < 1 ? 8.4 : 6.9;
    const fov = a < 0.8 ? 66 : a < 1.3 ? 52 : 42, t = Math.tan((fov * Math.PI) / 360);
    const d0 = Math.hypot(back, h - 1.1), need = state.span / 2 / (t * a);   // distancia mínima para que quepan los dos luchadores a lo ancho
    if (need > d0) { const k = need / d0; back *= k; h = 1.1 + (h - 1.1) * k; }
    camera.fov = fov; camera.updateProjectionMatrix();
    camera.position.set(ARENA.x + sway, h, ARENA.z + back); camera.lookAt(ARENA.x, 1.1, ARENA.z);
    return true;
  }

  return {
    get active() { return state.active; },
    start: (id, rival, npc) => { state.last = { npc, sparring: false, league: !!rival && rival.league != null }; return start(id, rival, false); },
    startSparring: (id, npc) => { state.last = { npc, sparring: true }; return start(id, null, true); },
    update, applyCamera,
  };
}
