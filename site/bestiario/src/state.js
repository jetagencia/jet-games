// Estado de la partida: monedas, mochila, huevos, aspectos y criaturas del jugador. Se guarda en el navegador.
// La partida empieza eligiendo uno de tres inicios (ver START_MODES en catalog.js).
import { ITEM_INDEX, FOOD, APPLES, POTIONS, KITS, CURES, TRAINING, STATUS, FORMS, POWERS, powersOf, formsOf, formInfo, formPrice, stageOf, offersOfDay } from './catalog.js';
import { SPECIES } from './species.js';
import { LEAGUE } from './battle-data.js';
import { L } from './i18n.js';

// nombre del elemento en minúscula para los mensajes (en español los ids ya son las palabras)
const elName = (id) => (id ? L(id, { fuego: 'fire', agua: 'water', aire: 'air', tierra: 'earth' }[id] || id) : '');

const KEY = 'criaturas.partida.v2';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } },
  set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch (e) { return false; } },
};
let saveWarned = false; const saveErrListeners = new Set();
export const onSaveError = (f) => { saveErrListeners.add(f); };

export const hasPower = (c, id) => !!c.apples && powersOf(speciesOf(c.species).element, c.apples).some((p) => p.id === id);
export const hpMax = (c) => Math.round((50 + c.stats.vitalidad * 9 + c.level * 8) * (hasPower(c, 'corazon-magma') ? 1.15 : 1));
export const MAX_LEVEL = 50;
export const xpNeed = (level) => (level >= MAX_LEVEL ? Infinity : 40 + level * 20 + Math.round(level * level * 1.8));
export const statCap = (c) => 12 + c.level * 2;
export const speciesOf = (id) => SPECIES.find((s) => s.id === id);
export const ROSTER_MAX = 16;
export const EGG_SLOTS = 4;
export const EGG_MS = 5 * 60 * 1000; // todos los huevos tardan 5 minutos en estar listos para eclosionar
export const FUSE_COST = 120;

const uid = () => 'c' + Date.now().toString(36) + Math.floor(Math.random() * 9999).toString(36);
const fail = (msg) => ({ ok: false, msg });
const NOCOINS = () => L('No te alcanzan las monedas.', 'You don’t have enough coins.');
const NOCRE = () => L('No encuentro a esa criatura.', 'I can’t find that creature.');
const good = (msg, extra = {}) => ({ ok: true, msg, ...extra });

// ---------- partida en blanco (mientras se elige el inicio) y los tres inicios ----------
function blank() {
  return {
    mode: null, coins: 0, bag: {}, eggs: [], roster: [],
    playerSkins: ['viajero'], playerSkin: 'viajero',
    flags: {}, formsUnlocked: {}, stats: { wins: 0, losses: 0, hatched: 0 }, offers: null,
    league: { beaten: 0, champion: 0 }, dex: {},   // Liga: maestros vencidos en orden (y cuándo se coronó); dex: especies que has tenido
  };
}

function levelUp(c) {
  c.level++; c.stats.fuerza++; c.stats.vitalidad++;
  if (c.level % 2 === 0) c.stats.agilidad++; else c.stats.magia++;
}

// criatura de una especie, ya con el nivel pedido (las estadísticas crecen como al subir de nivel)
function make(S, speciesId, level = 1, opts = {}) {
  const sp = speciesOf(speciesId);
  const c = { id: uid(), species: sp.id, name: opts.name || nameFor(S, sp), level: 1, xp: 0, hp: 0, stats: { ...sp.base }, aff: { fuego: 0, agua: 0, aire: 0, tierra: 0 }, buffs: [], status: [], rest: null, form: 'base', forms: ['base'], apples: 0 };
  c.aff[sp.element] = 1; bindName(c);
  while (c.level < level) levelUp(c);
  c.hp = Math.round(hpMax(c) * (opts.hpFrac === undefined ? 1 : opts.hpFrac));
  return c;
}
// Nombres: el de la especie (con II, III… si se repite) o un apodo fijo. Se guardan en el idioma en que nacieron, pero se
// muestran siempre en el idioma actual: bindName convierte c.name en un getter que traduce los nombres conocidos.
const NICK = { Ascua: 'Ember', Zarzal: 'Bramble', 'Nácar': 'Pearl', 'Ráfaga': 'Gust', 'Hollín': 'Soot', Fondo: 'Abyss', Cumbre: 'Summit', Morrena: 'Moraine', Brasanegra: 'Blackember', 'Muñeco de combate': 'Training dummy' };
export function localName(raw, speciesId) {
  if (typeof raw !== 'string') return raw;
  const m = raw.match(/^(.*?)((?: (?:II|III|IV|V|VI|VII|VIII|\d+))?)$/), base = m[1], suf = m[2];
  const sp = speciesOf(speciesId);
  if (sp && sp.i18n && (base === sp.i18n.es.name || base === sp.i18n.en.name)) return sp.name + suf;
  for (const es of Object.keys(NICK)) if (base === es || base === NICK[es]) return L(es, NICK[es]) + suf;
  return raw;
}
function bindName(c) {
  const d = Object.getOwnPropertyDescriptor(c, 'name'); if (d && d.get) return c;
  let raw = c.name;
  Object.defineProperty(c, 'name', { get: () => localName(raw, c.species), set: (v) => { raw = v; }, enumerable: true, configurable: true });
  return c;
}
function nameFor(S, sp) {
  const used = new Set(S.roster.map((c) => c.name));
  if (!used.has(sp.name)) return sp.name;
  for (const r of ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']) if (!used.has(`${sp.name} ${r}`)) return `${sp.name} ${r}`;
  return `${sp.name} ${S.roster.length + 1}`;
}

export const eggPrice = (sp) => Math.max(10, Math.round((sp.price * 0.25) / 5) * 5);
export const eggSlots = () => S.flags.slots || EGG_SLOTS;
export const hatchMs = () => EGG_MS;
const newEgg = (speciesId, msLeft = null) => { const total = EGG_MS; return { id: uid(), species: speciesId, total, hatchAt: Date.now() + (msLeft === null ? total : msLeft), notified: false }; };

function buildMode(id) {
  const S = blank(); S.mode = id;
  if (id === 'inicio') {                        // desde cero: pocas monedas, hay que comprar un huevo y esperar a que eclosione
    S.coins = 220; S.bag = { granos: 3, bayas: 1 };
  } else if (id === 'domador') {                // intermedio: un dragón joven, un huevo a medio incubar y algo de dinero
    S.coins = 900; S.bag = { granos: 4, bayas: 2, 'kit-s': 1, 'manzana-agua': 1 };   // la manzana de agua es para tu futuro unicornio
    const a = make(S, 'dragon', 4, { name: L('Ascua', 'Ember'), hpFrac: 0.7 }); S.roster.push(a);
    S.eggs.push(newEgg('unicornio', 120000));
  } else {                                      // maestro: equipo hecho, dos huevos listos para eclosionar y mucho dinero para comprar más
    S.coins = 6000; S.flags.slots = 6;
    S.bag = { carne: 5, medula: 3, corazon: 1, bayas: 6, 'kit-m': 2, 'kit-l': 1, furia: 2, piedra: 2, savia: 1, 'manzana-fuego': 1, 'manzana-agua': 1, 'manzana-aire': 1, 'manzana-tierra': 1, 'manzana-dorada': 1 };
    const a = make(S, 'dragon', 14, { name: L('Ascua', 'Ember') }); a.aff.fuego = 4; a.apples = 3; a.forms.push('ignea'); a.form = 'ignea'; S.roster.push(a);
    S.roster.push(make(S, 'cerbero', 10)); S.roster.push(make(S, 'grifo', 8)); S.roster.push(make(S, 'unicornio', 8));
    S.eggs.push(newEgg('pegaso', 0), newEgg('ogro', 0));
    S.playerSkins.push('ceniza', 'bosque');
  }
  for (const c of S.roster) S.dex[c.species] = true;
  return S;
}

// ---------- estado vivo ----------
const listeners = new Set();
// una partida guardada por una versión anterior puede traer campos que faltan o sobran: se normaliza al cargar
function migrate(s) {
  const d = blank();
  for (const k of Object.keys(d)) if (s[k] == null || (d[k] !== null && typeof s[k] !== typeof d[k])) s[k] = d[k];   // (el valor por defecto null, como `mode`, admite cualquier tipo: antes se borraba al cargar)
  if (typeof s.mode !== 'string' || !s.mode) s.mode = null;
  s.coins = Number.isFinite(+s.coins) ? Math.max(0, Math.floor(+s.coins)) : 0;
  s.roster = (Array.isArray(s.roster) ? s.roster : []).filter((c) => c && speciesOf(c.species));
  s.eggs = (Array.isArray(s.eggs) ? s.eggs : []).filter((e) => e && speciesOf(e.species));
  for (const id of Object.keys(s.bag)) if (!ITEM_INDEX.has(id) || !(s.bag[id] > 0)) delete s.bag[id];
  for (const c of s.roster) {
    c.stats = { fuerza: 1, vitalidad: 1, agilidad: 1, magia: 1, ...(c.stats || {}) };
    c.buffs = (c.buffs || []).filter((b) => b && ITEM_INDEX.has(b.id)); c.status = (c.status || []).filter((x) => STATUS[x]);
    c.aff = { fuego: 0, agua: 0, aire: 0, tierra: 0, ...(c.aff || {}) }; c.forms = Array.isArray(c.forms) && c.forms.length ? c.forms : ['base']; c.form = c.form || 'base'; c.apples = c.apples || 0; c.xp = c.xp || 0;
    c.level = Math.max(1, Math.min(MAX_LEVEL, Math.floor(+c.level) || 1));
    c.hp = Math.min(Math.max(0, Math.round(+c.hp) || 0), hpMax(c));
    bindName(c);
  }
  for (const e of s.eggs) { e.total = e.total || EGG_MS; e.hatchAt = Number.isFinite(+e.hatchAt) ? +e.hatchAt : Date.now(); }
  s.league = { beaten: 0, champion: 0, ...s.league }; s.league.beaten = Math.max(0, Math.min(LEAGUE.length, Math.floor(+s.league.beaten) || 0));
  for (const c of s.roster) s.dex[c.species] = true;   // las partidas de antes de la Liga cuentan lo que ya tienen
  for (const id of Object.keys(s.dex)) if (!speciesOf(id)) delete s.dex[id];
  return s;
}
let S = (() => { const s = store.get(); return s && s.mode && s.roster ? migrate(s) : blank(); })();
const save = () => {
  if (S.mode && !store.set(S) && !saveWarned) { saveWarned = true; for (const f of saveErrListeners) f(); }
  for (const f of listeners) f(S);
};
// con el juego abierto en dos pestañas, la que guardó último manda: la otra recarga su estado
if (typeof window !== 'undefined') window.addEventListener('storage', (e) => { if (e.key === KEY && e.newValue) { try { S = migrate(JSON.parse(e.newValue)); for (const f of listeners) f(S); } catch (err) { /* nada */ } } });
export const coinTaken = () => (S.flags.coinTaken = S.flags.coinTaken || {});   // cuándo se recogió cada moneda suelta
export const state = () => S;
export const hasGame = () => !!S.mode;
export const onChange = (f) => { listeners.add(f); return () => listeners.delete(f); };
export function startGame(modeId) { S = buildMode(modeId); save(); return S; }
export const reset = () => { S = blank(); try { localStorage.removeItem(KEY); } catch (e) { /* nada */ } for (const f of listeners) f(S); };

export function spend(n) { if (S.coins < n) return false; S.coins -= n; return true; }
export const have = (id) => S.bag[id] || 0;
const addBag = (id, n = 1) => { S.bag[id] = (S.bag[id] || 0) + n; if (S.bag[id] <= 0) delete S.bag[id]; };
export function addCoins(n) { S.coins += n; save(); }
export function addItem(id, n = 1) { addBag(id, n); save(); }
export function consumeItem(id, n = 1) { if (have(id) < n) return false; addBag(id, -n); save(); return true; }

export function buyItem(item, n = 1) {
  n = Math.floor(+n); if (!(n >= 1)) return fail(L('Cantidad no válida.', 'Invalid amount.'));
  const cost = item.price * n;
  if (!spend(cost)) return fail(NOCOINS());
  addBag(item.id, n); save();
  return good(L(`${n > 1 ? n + ' × ' : ''}${item.name} a la mochila.`, `${n > 1 ? n + ' × ' : ''}${item.name} added to your backpack.`));
}
export const sellPrice = (item) => Math.max(1, Math.floor(item.price * 0.5));
export function sellItem(id, n = 1) {
  n = Math.floor(+n); if (!(n >= 1)) return fail(L('Cantidad no válida.', 'Invalid amount.'));
  const it = ITEM_INDEX.get(id);
  if (!it || have(id) < n) return fail(L('No tienes eso para vender.', 'You don’t have that to sell.'));
  addBag(id, -n); S.coins += sellPrice(it) * n; save();
  return good(L(`Vendiste ${n > 1 ? n + ' × ' : ''}${it.name} por ${sellPrice(it) * n} monedas.`, `You sold ${n > 1 ? n + ' × ' : ''}${it.name} for ${sellPrice(it) * n} coins.`));
}

// ---------- ofertas del día ----------
export const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
export function todaysOffers() {
  const day = dayKey();
  if (!S.offers || S.offers.day !== day) S.offers = { day, bought: {} };
  return offersOfDay(day, [...FOOD, ...APPLES, ...POTIONS, ...KITS, ...CURES]).map((o) => ({ ...o, left: Math.max(0, o.stock - (S.offers.bought[o.id] || 0)) }));
}
export function buyOffer(id) {
  const o = todaysOffers().find((x) => x.id === id), it = ITEM_INDEX.get(id);
  if (!o || !it) return fail(L('Esa oferta ya no está.', 'That offer is gone.'));
  if (o.left <= 0) return fail(L('Se agotó la oferta de hoy.', 'Today’s offer is sold out.'));
  if (!spend(o.price)) return fail(NOCOINS());
  S.offers.bought[id] = (S.offers.bought[id] || 0) + 1; addBag(id, 1); save();
  return good(L(`${it.name} a la mochila (oferta).`, `${it.name} added to your backpack (offer).`));
}

// ---------- aspectos del viajero y de las criaturas ----------
export function buyPlayerSkin(skin) {
  if (S.playerSkins.includes(skin.id)) return fail(L('Ya la tienes.', 'You already have it.'));
  if (!spend(skin.price)) return fail(NOCOINS());
  S.playerSkins.push(skin.id); S.playerSkin = skin.id; save();
  return good(L(`${skin.name}: comprada y puesta.`, `${skin.name}: bought and equipped.`));
}
export function equipPlayerSkin(id) { if (!S.playerSkins.includes(id)) return fail(L('Aún no la tienes.', 'You don’t have it yet.')); S.playerSkin = id; save(); return good(L('Listo.', 'Done.')); }

// ---------- criaturas ----------
export const isKo = (c) => c.hp <= 0;
const restEnd = (c) => Math.min(c.rest.until, (c.rest.t0 || 0) + (c.rest.ms || 0) || c.rest.until);   // tope por si el reloj del sistema saltó
export const isResting = (c, now = Date.now()) => !!c.rest && restEnd(c) > now;
export const restLeft = (c, now = Date.now()) => (c.rest ? Math.max(0, restEnd(c) - now) : 0);
export function gainXp(c, xp) {
  c.xp += xp; let ups = 0;
  const before = stageOf(c.level).name;
  while (c.level < MAX_LEVEL && c.xp >= xpNeed(c.level)) { c.xp -= xpNeed(c.level); levelUp(c); ups++; }
  if (c.level >= MAX_LEVEL) c.xp = 0;
  if (ups) c.hp = Math.min(hpMax(c), c.hp + Math.round(hpMax(c) * 0.15));
  const after = stageOf(c.level).name;
  return { ups, evolved: before !== after ? after : null };
}

export const APPLE_MIN_LEVEL = [5, 8, 12, 16, 20];   // nivel que pide la manzana n.º 1 a 5 (poder permanente)
export const appleMinLevel = (c) => (c.apples || 0) >= APPLE_MIN_LEVEL.length ? null : APPLE_MIN_LEVEL[c.apples || 0];

export function useItem(itemId, creatureId) {
  const it = ITEM_INDEX.get(itemId), c = S.roster.find((x) => x.id === creatureId);
  if (!it || !c) return fail(L('Eso no se puede usar ahora.', 'That can’t be used right now.'));
  if (!have(itemId)) return fail(L('No te queda.', 'You have none left.'));
  let msg = '';
  if (it.kind === 'food') {
    if (isKo(c)) return fail(L(`${c.name} está inconsciente: llévala a la Enfermería.`, `${c.name} is unconscious: take it to the Infirmary.`));
    if (c.level >= MAX_LEVEL) return fail(L(`${c.name} ya está en el nivel máximo (${MAX_LEVEL}).`, `${c.name} is already at the max level (${MAX_LEVEL}).`));
    const r = gainXp(c, it.xp);
    msg = L(`${c.name} come con ganas: +${it.xp} XP.`, `${c.name} eats eagerly: +${it.xp} XP.`);
    if (r.ups) msg += L(` ¡Sube a nivel ${c.level}!`, ` Up to level ${c.level}!`);
    if (r.evolved) msg += L(` Evoluciona: ${r.evolved}.`, ` It evolves: ${r.evolved}.`);
  } else if (it.kind === 'apple') {
    const spc = speciesOf(c.species), el = spc.element;
    if (it.element && el !== it.element) return fail(L(`Esa manzana es de ${it.element}: solo sirve para criaturas de ${it.element}. ${c.name} es de ${el}.`, `That is a ${elName(it.element)} apple: it only works for ${elName(it.element)} creatures. ${c.name} is ${elName(el)}.`));
    const before = c.apples || 0;
    if (before >= APPLE_MIN_LEVEL.length) return fail(L(`${c.name} ya aprendió todos los poderes de su elemento.`, `${c.name} has already learned every power of its element.`));
    if (c.level < APPLE_MIN_LEVEL[before]) return fail(L(`${c.name} necesita nivel ${APPLE_MIN_LEVEL[before]} para comer esta manzana (tiene ${c.level}).`, `${c.name} needs level ${APPLE_MIN_LEVEL[before]} to eat this apple (it is level ${c.level}).`));
    if (it.element) c.aff[it.element]++; else for (const k of Object.keys(c.aff)) c.aff[k]++;
    c.apples = before + 1;
    const learned = powersOf(el, c.apples).filter((p) => !powersOf(el, before).some((q) => q.id === p.id));
    msg = L(`${c.name} come la ${it.name.toLowerCase()}: afinidad +1 para siempre.`, `${c.name} eats the ${it.name}: +1 affinity for good.`);
    if (learned.length) msg += L(` Aprende «${learned.map((p) => p.name).join('», «')}».`, ` It learns “${learned.map((p) => p.name).join('”, “')}”.`);
    if (!c.forms.includes(FORMS[el].v3.id)) { c.forms.push(FORMS[el].v3.id); c.form = FORMS[el].v3.id; msg += L(` ¡Nuevo aspecto: ${FORMS[el].v3.name.replace(/^Aspecto /, '')}!`, ` New look: ${FORMS[el].v3.name.replace(/ look$/, '')}!`); }
  } else if (it.kind === 'potion') {
    const b = c.buffs.find((x) => x.id === it.id);
    if (b) b.left = it.battles; else c.buffs.push({ id: it.id, left: it.battles });
    msg = L(`${c.name}: ${it.name} activa por ${it.battles} combates.`, `${c.name}: ${it.name} active for ${it.battles} battles.`);
  } else if (it.kind === 'cure') {
    if (!c.status.includes(it.cures)) return fail(L(`${c.name} no tiene ese estado.`, `${c.name} doesn’t have that condition.`));
    c.status = c.status.filter((x) => x !== it.cures); msg = L(`${c.name}: ${it.name}, curada.`, `${c.name}: ${it.name}, cured.`);
  } else if (it.kind === 'kit') {
    if (isKo(c)) return fail(L(`${c.name} está inconsciente: un botiquín no basta, necesita al doctor.`, `${c.name} is unconscious: a first-aid kit isn’t enough, it needs the doctor.`));
    const max = hpMax(c);
    if (c.hp >= max) return fail(L(`${c.name} no necesita curas.`, `${c.name} doesn’t need healing.`));
    c.hp = Math.min(max, c.hp + Math.round(max * it.heal)); msg = L(`${c.name} recupera salud: ${c.hp}/${max} PS.`, `${c.name} recovers health: ${c.hp}/${max} HP.`);
  }
  addBag(itemId, -1); save();
  return good(msg);
}

// ---------- Criaderos: huevos y combinación (las criaturas no se adoptan: se compran huevos y se eclosionan) ----------
export const owned = (speciesId) => S.roster.filter((c) => c.species === speciesId);
export function fuse(idA, idB) {
  const a = S.roster.find((c) => c.id === idA), b = S.roster.find((c) => c.id === idB);
  if (!a || !b || a === b) return fail(L('Elige dos criaturas distintas.', 'Choose two different creatures.'));
  if (a.species !== b.species) return fail(L('Solo se pueden combinar criaturas de la misma especie.', 'Only creatures of the same species can be combined.'));
  if (!spend(FUSE_COST)) return fail(NOCOINS());
  const keep = (a.level + (a.apples || 0) * 0.1) >= (b.level + (b.apples || 0) * 0.1) ? a : b, drop = keep === a ? b : a;
  keep.level = Math.min(MAX_LEVEL, Math.max(a.level, b.level) + 1 + Math.floor(Math.min(a.level, b.level) / 5));
  for (const k of Object.keys(keep.stats)) keep.stats[k] = Math.max(a.stats[k], b.stats[k]) + 1;
  for (const k of Object.keys(keep.aff)) keep.aff[k] = Math.max(a.aff[k], b.aff[k]);
  keep.apples = Math.max(a.apples || 0, b.apples || 0); keep.forms = [...new Set([...(a.forms || []), ...(b.forms || [])])];
  keep.xp = Math.max(a.xp, b.xp); keep.hp = hpMax(keep); keep.status = []; keep.rest = null;
  S.roster = S.roster.filter((c) => c !== drop); save();
  return good(L(`${keep.name} absorbe a ${drop.name} y sube al nivel ${keep.level}.`, `${keep.name} absorbs ${drop.name} and rises to level ${keep.level}.`));
}

// huevos: se compran en el Criadero, esperan 5 minutos en la incubadora (también con la pestaña cerrada) y luego se eclosionan
export function buyEgg(speciesId) {
  const sp = speciesOf(speciesId);
  if (!sp) return fail(L('Especie desconocida.', 'Unknown species.'));
  if (S.eggs.length >= eggSlots()) return fail(L(`Tu incubadora está llena (${eggSlots()} huevos). Eclosiona alguno primero.`, `Your incubator is full (${eggSlots()} eggs). Hatch one first.`));
  if (S.roster.length + S.eggs.length >= ROSTER_MAX) return fail(L(`Tu equipo está completo (${ROSTER_MAX} entre criaturas y huevos). Combina dos de la misma especie para liberar un hueco.`, `Your team is full (${ROSTER_MAX} creatures and eggs combined). Combine two of the same species to free up a slot.`));
  const p = eggPrice(sp);
  if (!spend(p)) return fail(NOCOINS());
  S.eggs.push(newEgg(speciesId)); save();
  return good(L(`Huevo de ${sp.name.toLowerCase()} a la incubadora. Estará listo en 5 minutos.`, `${sp.name} egg placed in the incubator. It will be ready in 5 minutes.`));
}
export const eggLeft = (e, now = Date.now()) => Math.min(e.total, Math.max(0, e.hatchAt - now));   // tope por si el reloj del sistema saltó
export const eggReady = (e, now = Date.now()) => eggLeft(e, now) <= 0;
// una manzana del mismo elemento (o la dorada) mantiene el huevo caliente: acorta la espera
export function warmEgg(eggId, appleId) {
  const e = S.eggs.find((x) => x.id === eggId), it = ITEM_INDEX.get(appleId), sp = e && speciesOf(e.species);
  if (!e || !it || it.kind !== 'apple') return fail(L('Eso no sirve para calentar un huevo.', 'That can’t warm an egg.'));
  if (eggReady(e)) return fail(L('Ese huevo ya está listo: eclosiónalo.', 'That egg is already ready: hatch it.'));
  if (!have(appleId)) return fail(L('No te queda esa manzana.', 'You have none of that apple left.'));
  if (it.element && it.element !== sp.element) return fail(L(`Ese huevo es de ${sp.element}: necesita una manzana de ${sp.element} o la dorada.`, `That is a ${elName(sp.element)} egg: it needs a ${elName(sp.element)} apple or the golden one.`));
  e.hatchAt -= Math.round(e.total * (it.element ? 0.4 : 0.6)); addBag(appleId, -1); save();
  return good(L(`El huevo se calienta: se adelanta ${it.element ? 2 : 3} minutos.`, `The egg warms up: ${it.element ? 2 : 3} minutes sooner.`));
}
// avisa (una sola vez) de los huevos que acaban de estar listos
export function tickEggs(now = Date.now()) {
  const ready = [];
  for (const e of S.eggs) if (eggReady(e, now) && !e.notified) { e.notified = true; ready.push(e); }
  if (ready.length) save();
  return ready;
}
// eclosiona un huevo listo: la criatura nace y queda lista para usar en tu equipo
export function hatchEgg(eggId) {
  const e = S.eggs.find((x) => x.id === eggId);
  if (!e) return fail(L('No encuentro ese huevo.', 'I can’t find that egg.'));
  if (!eggReady(e)) return fail(L('Todavía no está listo. Falta tiempo de incubación.', 'It isn’t ready yet. It needs more incubation time.'));
  if (S.roster.length >= ROSTER_MAX) return fail(L(`Tu equipo está completo (${ROSTER_MAX}).`, `Your team is full (${ROSTER_MAX}).`));
  const c = make(S, e.species, 1); S.roster.push(c); S.eggs = S.eggs.filter((x) => x !== e); S.stats.hatched++;
  const isNew = !S.dex[e.species]; S.dex[e.species] = true;
  let extra = isNew ? L(` Nueva especie en tu Bestiario (${dexCount()}/${SPECIES.length}).`, ` New species in your Bestiary (${dexCount()}/${SPECIES.length}).`) : '', dexDone = false;
  if (dexCount() >= SPECIES.length && !S.flags.dexDone) { S.flags.dexDone = true; dexDone = true; S.coins += DEX_PRIZE; addBag('manzana-dorada', 1); extra += L(` ¡Bestiario completo! Premio: ${DEX_PRIZE} monedas y una manzana dorada.`, ` Bestiary complete! Prize: ${DEX_PRIZE} coins and a golden apple.`); }
  save();
  return good(L(`¡Eclosionó ${c.name}! Ya está lista para entrenar y pelear.${extra}`, `${c.name} hatched! It’s ready to train and fight.${extra}`), { creature: c, isNew, dexDone });
}

// ---------- formas ----------
export const formMul = (c) => (c.form === 'base' || !c.form ? 1 : c.form === FORMS[speciesOf(c.species).element].v2.id ? 1.1 : 1.15);
export const unlockedForms = (c) => {
  const el = speciesOf(c.species).element, out = ['base'];
  if (S.formsUnlocked[el]) out.push(FORMS[el].v2.id);
  if ((c.forms || []).includes(FORMS[el].v3.id)) out.push(FORMS[el].v3.id);
  return out;
};
export const hasForm2 = (speciesId) => !!S.formsUnlocked[speciesOf(speciesId).element];
export function buyForm(speciesId) {
  const sp = speciesOf(speciesId);
  if (!sp) return fail(L('Especie desconocida.', 'Unknown species.'));
  if (S.formsUnlocked[sp.element]) return fail(L('Ya tienes ese aspecto.', 'You already have that look.'));
  const p = formPrice(sp);
  if (!spend(p)) return fail(NOCOINS());
  S.formsUnlocked[sp.element] = true; save();
  return good(L(`${FORMS[sp.element].v2.name} desbloqueado para todas las criaturas de ${sp.element}. Elígelo en la Mochila.`, `${FORMS[sp.element].v2.name} unlocked for all your ${elName(sp.element)} creatures. Choose it in the Backpack.`));
}
export function setForm(creatureId, formId) {
  const c = S.roster.find((x) => x.id === creatureId);
  if (!c) return fail(NOCRE());
  if (!unlockedForms(c).includes(formId)) return fail(L('Ese aspecto aún no lo tienes.', 'You don’t have that look yet.'));
  c.form = formId; save();
  return good(`${c.name}: ${formInfo(speciesOf(c.species).element, formId).name}.`);
}

// ---------- Enfermería ----------
export const healCost = (c) => Math.ceil((hpMax(c) - c.hp) * 0.4) + (isKo(c) ? 40 : 0) + 25 * c.status.length;
export function healCreature(id) {
  const c = S.roster.find((x) => x.id === id);
  if (!c) return fail(NOCRE());
  if (c.hp >= hpMax(c) && !c.status.length) return fail(L(`${c.name} ya está en perfecto estado.`, `${c.name} is already in perfect shape.`));
  const cost = healCost(c);
  if (!spend(cost)) return fail(NOCOINS());
  const wasKo = isKo(c);
  c.hp = hpMax(c); c.status = []; c.rest = null; save();
  return good(L(`${c.name} ${wasKo ? 'despierta y está' : 'sale'} como nueva (${cost} monedas).`, `${c.name} ${wasKo ? 'wakes up' : 'walks out'} as good as new (${cost} coins).`));
}
// internación: la criatura descansa gratis; mientras tanto no puede entrenar ni pelear
export const RESTS_MAX = 2;
export const restMs = (c) => Math.max(15000, Math.round((hpMax(c) - c.hp) * 700));
export function admit(id) {
  const c = S.roster.find((x) => x.id === id);
  if (!c) return fail(NOCRE());
  if (c.hp >= hpMax(c) && !c.status.length) return fail(L(`${c.name} no necesita descansar.`, `${c.name} doesn’t need to rest.`));
  if (isResting(c)) return fail(L(`${c.name} ya está en una camilla.`, `${c.name} is already on a cot.`));
  if (isKo(c)) return fail(L(`${c.name} está inconsciente: solo el doctor puede reanimarla.`, `${c.name} is unconscious: only the doctor can revive it.`));
  if (S.roster.filter((x) => isResting(x)).length >= RESTS_MAX) return fail(L(`Solo hay ${RESTS_MAX} camillas. Espera a que se libere una o paga al doctor.`, `There are only ${RESTS_MAX} cots. Wait for one to free up or pay the doctor.`));
  const ms = restMs(c); c.rest = { until: Date.now() + ms, t0: Date.now(), ms }; save();
  return good(L(`${c.name} descansa en la camilla durante ${Math.round(restMs(c) / 1000)} s.`, `${c.name} rests on the cot for ${Math.round(restMs(c) / 1000)} s.`));
}
export function tickRest(now = Date.now()) {
  const out = [];
  for (const c of S.roster) if (c.rest && !isResting(c, now)) { c.hp = hpMax(c); c.status = []; c.rest = null; out.push(c); }
  if (out.length) save();
  return out;
}
export function cureStatus(id, statusId, itemId, price = 0) {
  const c = S.roster.find((x) => x.id === id);
  if (!c || !c.status.includes(statusId)) return fail(L('No tiene ese estado.', 'It doesn’t have that condition.'));
  if (itemId) { if (!have(itemId)) return fail(L('No te queda.', 'You have none left.')); addBag(itemId, -1); }
  else if (price && !spend(price)) return fail(NOCOINS());
  c.status = c.status.filter((s) => s !== statusId); save();
  return good(L(`${c.name} ya no está afectada.`, `${c.name} is no longer affected.`));
}

// ---------- Gimnasio ----------
export const trainCost = (c, stat) => 30 + c.stats[stat] * 8;
// gain: cuánto sube la estadística (0, 1 o 2, según la nota del ejercicio); costMul: fracción del costo que se cobra
export function train(id, stat, gain = 1, costMul = 1) {
  const c = S.roster.find((x) => x.id === id), def = TRAINING.find((t) => t.id === stat);
  if (!c || !def) return fail(L('Entrenamiento desconocido.', 'Unknown training.'));
  const max = hpMax(c);
  if (isResting(c)) return fail(L(`${c.name} está descansando en la Enfermería.`, `${c.name} is resting in the Infirmary.`));
  if (c.stats[stat] >= statCap(c)) return fail(L(`${def.name} ya está al tope para su nivel (${statCap(c)}). Sube de nivel con comida.`, `${def.name} is already capped for its level (${statCap(c)}). Level up with food.`));
  if (c.hp < max * 0.35) return fail(L(`${c.name} está agotada. Llévala a la Enfermería.`, `${c.name} is exhausted. Take it to the Infirmary.`));
  const cost = Math.round(trainCost(c, stat) * costMul);
  if (!spend(cost)) return fail(NOCOINS());
  c.stats[stat] = Math.min(statCap(c), c.stats[stat] + gain); c.hp = Math.max(1, c.hp - Math.round(max * 0.12));
  const r = gainXp(c, 6 + gain * 5);
  save();
  return good(L(`${gain ? `${def.name} +${gain} (${c.stats[stat]}).` : 'Ejercicio flojo: sin mejora.'} Entrenar cansa a ${c.name}.${r.ups ? ` ¡Sube a nivel ${c.level}!` : ''}`, `${gain ? `${def.name} +${gain} (${c.stats[stat]}).` : 'Weak effort: no improvement.'} Training tires ${c.name} out.${r.ups ? ` Up to level ${c.level}!` : ''}`));
}

// ---------- Liga y Bestiario: la meta de la partida ----------
export const DEX_PRIZE = 1000;
export const dexCount = () => SPECIES.filter((s) => S.dex[s.id]).length;
export const leagueBeaten = () => S.league.beaten;
export const isChampion = () => !!S.league.champion;
// victoria contra un maestro de la Liga: la primera vez da su emblema, sus monedas y su objeto (el combate ya pagó su botín normal)
export function leagueWin(i, rematch = false) {
  const L = LEAGUE[i];
  if (!L || rematch || i !== S.league.beaten) return { first: false };
  S.league.beaten = i + 1; S.coins += L.prize; addBag(L.item[0], L.item[1]);
  const champion = S.league.beaten >= LEAGUE.length && !S.league.champion;
  if (champion) S.league.champion = Date.now();
  save();
  return { first: true, emblem: L.emblem, prize: L.prize, item: L.item, champion, n: S.league.beaten };
}

// rival efímero para el combate (no entra en el equipo)
export const enemyCreature = (speciesId, level) => { const c = make({ roster: [] }, speciesId, level); c.status = []; return c; };

// ---------- Pelea: el combate informa su resultado aquí ----------
// result: { hp, status: [ids], win: bool, xp, coins, drops: {itemId: n}, spent: {itemId: n} }
export function finishBattle(creatureId, result) {
  const c = S.roster.find((x) => x.id === creatureId);
  if (!c) return fail(L('La criatura ya no está en tu equipo.', 'That creature is no longer on your team.'));
  if (!result.sparring) for (const [id, n] of Object.entries(result.spent || {})) addBag(id, -n);   // en el sparring los objetos no se gastan
  if (result.sparring) { // el sparring no cuesta salud ni deja estados, y solo da experiencia
    const lvl = result.win ? gainXp(c, result.xp || 0) : null;
    save(); return good('', { levelUps: lvl ? lvl.ups : 0, evolved: lvl ? lvl.evolved : null });
  }
  c.hp = Math.max(0, Math.min(hpMax(c), Math.round(result.hp))); c.status = [...(result.status || [])];
  if (c.hp > 0) c.hp = hpMax(c);   // si no cae, la criatura recupera toda su salud al terminar (ganando o huyendo); los estados siguen hasta que se curen y, si cae, la reanima el doctor
  for (const b of c.buffs) b.left--; c.buffs = c.buffs.filter((b) => b.left > 0);
  let lvl = null;
  if (result.win) { S.stats.wins++; S.coins += result.coins || 0; for (const [id, n] of Object.entries(result.drops || {})) addBag(id, n); lvl = gainXp(c, result.xp || 0); }
  else if (!result.fled) S.stats.losses++;
  save();
  return good('', { levelUps: lvl ? lvl.ups : 0, evolved: lvl ? lvl.evolved : null });
}

export { POTIONS, FORMS, formsOf, formInfo, formPrice, STATUS };
