// Menús del pueblo: Tienda, Enfermería, Gimnasio y la Mochila. Una sola ventana con pestañas; todo el texto sale del catálogo.
import { FOOD, APPLES, PLAYER_SKINS, POTIONS, KITS, CURES, TRAINING, STATUS, START_MODES, ITEM_INDEX, FORMS, formBonusText, POWERS, powersOf, nextPower, formsOf, formInfo, formPrice, stageOf, elementName, elementColor } from './catalog.js';
import { createPreview } from './preview.js';
import { SPECIES, ELEMENTS } from './species.js';
import * as G from './state.js';
import { TIERS, rivalsFor, rewardFor, elementMul, LEAGUE, leagueRival } from './battle-data.js';
import { Sound } from './audio.js';
import { QUALITY_PREF } from './quality.js';
import { L, isEn, lang, setLang, onLang } from './i18n.js';
const L_ = L;   // alias para las funciones donde `L` es un maestro de la Liga

const css = (n) => '#' + n.toString(16).padStart(6, '0');
const $ = (id) => document.getElementById(id);

// ---------- iconos (SVG propios) ----------
const ICON = {
  apple: (c) => `<svg viewBox="0 0 40 40"><path d="M20 13c-6-4-14 0-13 9 1 8 7 14 13 12 6 2 12-4 13-12 1-9-7-13-13-9z" fill="${c}"/><path d="M20 13c0-4 2-7 6-8-1 4-2 6-6 8z" fill="#4a7a3a"/><path d="M12 21c1-3 3-4 5-4" stroke="rgba(255,255,255,.5)" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
  granos: () => `<svg viewBox="0 0 40 40"><g fill="#c9a248"><ellipse cx="14" cy="24" rx="4" ry="7" transform="rotate(-25 14 24)"/><ellipse cx="22" cy="20" rx="4" ry="7" transform="rotate(10 22 20)"/><ellipse cx="28" cy="27" rx="4" ry="7" transform="rotate(30 28 27)"/></g></svg>`,
  bayas: () => `<svg viewBox="0 0 40 40"><g fill="#8a3a6a"><circle cx="14" cy="24" r="6"/><circle cx="25" cy="22" r="6"/><circle cx="19" cy="13" r="6"/></g><path d="M19 7c1-3 4-4 6-3" stroke="#4a7a3a" stroke-width="2.5" fill="none"/></svg>`,
  pescado: () => `<svg viewBox="0 0 40 40"><ellipse cx="18" cy="20" rx="12" ry="7" fill="#9fb2bd"/><path d="M29 20l8-7v14z" fill="#8aa0ac"/><circle cx="11" cy="18" r="1.6" fill="#1a1a1a"/></svg>`,
  carne: () => `<svg viewBox="0 0 40 40"><path d="M10 28c-4-8 2-16 11-16 7 0 11 5 9 11-2 6-14 9-20 5z" fill="#9a3a2a"/><rect x="26" y="26" width="10" height="4" rx="2" fill="#e4dcc4" transform="rotate(40 31 28)"/></svg>`,
  medula: () => `<svg viewBox="0 0 40 40"><path d="M8 14a4 4 0 1 1 5 5l12 12a4 4 0 1 1 5-5L18 14a4 4 0 0 1-10 0z" fill="#e4dcc4"/></svg>`,
  corazon: () => `<svg viewBox="0 0 40 40"><path d="M20 35C6 25 5 14 12 10c4-2 7 0 8 3 1-3 4-5 8-3 7 4 6 15-8 25z" fill="#d8402a"/><path d="M20 35C6 25 5 14 12 10" stroke="#ff9a3a" stroke-width="2" fill="none" opacity=".7"/></svg>`,
  potion: (c) => `<svg viewBox="0 0 40 40"><path d="M16 5h8v7l7 14c1 5-2 9-7 9h-8c-5 0-8-4-7-9l7-14z" fill="rgba(255,255,255,.22)" stroke="rgba(255,255,255,.55)" stroke-width="1.5"/><path d="M11 25h18l2 2c1 5-2 8-7 8h-8c-5 0-8-3-7-8z" fill="${c}"/><rect x="15" y="3" width="10" height="5" rx="1.5" fill="#8a6a42"/></svg>`,
  kit: () => `<svg viewBox="0 0 40 40"><rect x="5" y="12" width="30" height="22" rx="4" fill="#c9c6bb"/><rect x="14" y="7" width="12" height="7" rx="2" fill="none" stroke="#8a8a84" stroke-width="2.5"/><path d="M17 18h6v4h4v6h-4v4h-6v-4h-4v-6h4z" transform="translate(0 -3) scale(1 .95)" fill="#b02a2a"/></svg>`,
  cloak: (c) => `<svg viewBox="0 0 40 40"><path d="M20 4c-6 0-9 5-9 10 0 3-4 6-6 18h30c-2-12-6-15-6-18 0-5-3-10-9-10z" fill="${c}"/><path d="M20 4c-3 0-5 3-5 7 0 3 2 4 5 4s5-1 5-4c0-4-2-7-5-7z" fill="rgba(0,0,0,.45)"/></svg>`,
  beast: (c) => `<svg viewBox="0 0 40 40"><path d="M4 28c4-2 6-8 10-12l4-8 3 6c4-1 8 1 10 5l5 3-6 2c-2 4-6 6-10 6-5 0-9-1-16-2z" fill="${c}"/><circle cx="24" cy="15" r="1.6" fill="#ffb34a"/></svg>`,
  egg: (c, ready) => `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="22" rx="11" ry="14" fill="${c}"/><ellipse cx="16" cy="16" rx="3.5" ry="5" fill="rgba(255,255,255,.25)" transform="rotate(20 16 16)"/>${ready ? '<path d="M12 20l5 3-3 4 6 2-2 5" stroke="#ffd27a" stroke-width="2" fill="none" stroke-linecap="round"/>' : ''}</svg>`,
  cure: (c) => `<svg viewBox="0 0 40 40"><rect x="12" y="14" width="16" height="20" rx="4" fill="${c}"/><rect x="15" y="8" width="10" height="7" rx="2" fill="#8a6a42"/><path d="M20 20v8M16 24h8" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  coin: () => `<svg viewBox="0 0 24 24"><defs><linearGradient id="cg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#f2b92b"/><stop offset="1" stop-color="#a8680c"/></linearGradient><linearGradient id="cg2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#c4860f"/><stop offset="1" stop-color="#f6c845"/></linearGradient></defs><circle cx="12" cy="12" r="11.2" fill="url(#cg1)"/><circle cx="12" cy="12" r="11.2" fill="none" stroke="#6e4306" stroke-width=".9"/><circle cx="12" cy="12" r="9.2" fill="none" stroke="#fff6c4" stroke-opacity=".85" stroke-width=".9" stroke-dasharray="1.1 1.25"/><circle cx="12" cy="12" r="7.6" fill="url(#cg2)" stroke="#8a5408" stroke-width=".5"/><path d="M12 4.9c2.7 0 4.4 3.1 4.4 6.1 0 3.1-1.9 5.6-4.4 5.6s-4.4-2.5-4.4-5.6c0-3 1.7-6.1 4.4-6.1z" fill="#ffe688" stroke="#8a5408" stroke-width=".5"/><path d="M7.9 11.2l2 1.4 1.1-1.7 1.6 1.8 1.3-1.4 1.2.9" fill="none" stroke="#7a4806" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"/><path d="M9.3 7.5c.5-.9 1.3-1.4 2.2-1.5" fill="none" stroke="#fffbe6" stroke-width=".9" stroke-linecap="round"/></svg>`,
};
const iconFor = (it) => {
  if (it.kind === 'apple') return ICON.apple(it.element ? css(ELEMENTS[it.element].color) : '#e0b040');
  if (it.kind === 'food') return (ICON[it.id] || ICON.granos)();
  if (it.kind === 'potion') return ICON.potion(css(it.color));
  if (it.kind === 'kit') return ICON.kit();
  if (it.kind === 'cure') return ICON.cure(css(STATUS[it.cures].color));
  return '';
};

// ---------- ventana ----------
const fmtTime = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
// cuenta regresiva que solo cambia su texto cada segundo (el menú no se vuelve a pintar entero)
const clock = (until, prefix = '', cls = 'val') => `<span class="${cls}" data-until="${until}" data-prefix="${prefix}" style="font-size:15px">${prefix}${fmtTime(until - Date.now())}</span>`;
const FORM_LABEL = { base: 'Base', esqueleto: 'Esqueleto', ignea: 'Ígneo', armadura: 'Acorazado', tormenta: 'Tormenta', colosal: 'Colosal', petrea: 'Pétreo', hielo: 'Hielo', abismal: 'Abismal' };
const FORM_LABEL_EN = { base: 'Base', esqueleto: 'Skeleton', ignea: 'Igneous', armadura: 'Armored', tormenta: 'Storm', colosal: 'Colossal', petrea: 'Stone', hielo: 'Ice', abismal: 'Abyssal' };
const formLabel = (f) => (isEn() ? FORM_LABEL_EN : FORM_LABEL)[f.id] || f.name;
const stageName = (c) => { const st = stageOf(c.level); return !isEn() && st.from === 18 && G.speciesOf(c.species).genero === 'm' ? 'Adulto' : st.name; };
const cageOf = (sp) => L(`Jaula ${sp.genero === 'f' ? 'de la' : 'del'} ${sp.name.toLowerCase()}`, `${sp.name} cage`);
const NV = () => L('Nv.', 'Lv.'), PS = () => L('PS', 'HP');
const eggOf = (sp) => L(`Huevo de ${sp.name.toLowerCase()}`, `${sp.name} egg`);
const coinsW = (n) => L(n === 1 ? 'moneda' : 'monedas', n === 1 ? 'coin' : 'coins');
const haveTxt = (n) => (n ? L(` · tienes ${n}`, ` · you have ${n}`) : '');
const coarse = matchMedia('(pointer: coarse)').matches;
const shortScreen = () => matchMedia('(max-height: 460px)').matches;

export function createPanels({ say, onSkins, onNewGame, onFeed, themeEnv }) {
  const preview = createPreview(themeEnv);
  let pv = { species: 'dragon', form: 'base' };   // criatura y forma de la vista previa 3D
  const modal = $('modal'), card = $('mcard'), tabsEl = $('mtabs'), body = $('mbody'), msg = $('mmsg');
  const coinsEl = $('coins'), coinsN = $('coins-n');
  coinsEl.querySelector('.ic').innerHTML = ICON.coin();
  let ctx = null;       // {kind: 'tienda' | 'enfermeria' | 'gimnasio' | 'criadero' | 'mochila' | 'inicio', npc, species, tab}
  let sel = 0;          // criatura elegida (mochila, gimnasio)
  let skinTab = 'viajero';
  let confirmNew = false;
  let confirmKey = null, confirmT = 0;   // botón de compra que espera su segundo toque
  const applyConfirm = () => { if (!confirmKey) return; for (const x of body.querySelectorAll('[data-confirm]')) if (x.dataset.act + ':' + (x.dataset.id || '') === confirmKey) { x.textContent = x.dataset.ctext || L('Confirmar', 'Confirm'); x.classList.add('warn'); } };
  let leadOpen = false, pointerDown = false, lastMg = 0, opener = null, replacing = false;
  let pendingStart = null;   // inicio elegido que espera la confirmación de reemplazar la partida actual (SRC-BE01)
  let pendingFuse = null;    // par de criaturas que espera la confirmación de fusión (SRC-BE02)
  const lossText = () => { const nR = S().roster.length; return L(`${nR} ${nR === 1 ? 'criatura' : 'criaturas'}, ${S().coins} monedas, tus emblemas y todos los objetos`, `${nR} ${nR === 1 ? 'creature' : 'creatures'}, ${S().coins} coins, your emblems and every item`); };
  const focusAuto = () => { const f = body.querySelector('[data-autofocus]'); if (f) f.focus({ preventScroll: true }); };
  let mg = null;        // ejercicio de entrenamiento en curso
  const hooks = {};     // sparring(creatureId): lo conecta el módulo de combate

  const S = () => G.state();
  const creature = () => (S().roster.length ? S().roster[Math.min(sel, S().roster.length - 1)] : null);
  let msgT = 0;   // en pantallas bajas el mensaje se apaga solo (ahí cada fila cuenta)
  const autoClear = () => { clearTimeout(msgT); if (shortScreen()) msgT = setTimeout(() => { msg.textContent = ''; }, 4500); };
  const flash = (text, ok = true) => { msg.textContent = text; msg.className = (ok ? 'ok' : 'bad') + ' flash'; autoClear(); };
  const done = (r) => { flash(r.msg, r.ok); if (r.ok) say(r.msg); Sound.sfx(r.ok ? 'ok' : 'error'); return r; };

  const bar = (v, max, cls = '') => `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100)).toFixed(0)}%"></i></div>`;
  const price = (n) => `<span class="pr"><span class="coin">${ICON.coin()}</span>${n}</span>`;
  const row = (icon, title, sub, right, extra = '') => `<div class="row ${extra}"><div class="ic">${icon}</div><div class="tx"><b>${title}</b><small>${sub}</small></div><div class="rt">${right}</div></div>`;
  const buyBtn = (id, item, label = L('Comprar', 'Buy')) => `<button data-act="buy" data-id="${id}"${S().coins < item.price ? ' class="poor"' : ''}>${label}</button>`;
  // en pantallas bajas las explicaciones se pliegan (no se pierden); los avisos de «no hay nada aquí» siempre se ven
  const lead = (t) => shortScreen() ? `<details class="lead"${leadOpen ? ' open' : ''}><summary>${L('¿Cómo funciona?', 'How does it work?')}</summary>${t}</details>` : `<p class="lead">${t}</p>`;
  const empty = (t) => `<p class="lead empty">${t}</p>`;
  const noCreatures = () => empty(L('Aún no tienes criaturas. Compra un huevo en <b>Criaderos</b>: tarda 5 minutos en eclosionar y lo abres desde Mochila › Huevos.', 'You don’t have any creatures yet. Buy an egg at the <b>Breeding Grounds</b>: it takes 5 minutes to hatch and you open it from Backpack › Eggs.'));
  const have = (id) => G.have(id);

  // ----- una tarjeta por criatura (salud, nivel, estadísticas, estados). `compact`: una sola fila, para las pantallas donde manda la acción.
  function creatureCard(c, withActions = '', compact = false) {
    const sp = G.speciesOf(c.species), max = G.hpMax(c), ko = G.isKo(c), resting = G.isResting(c);
    const buffs = c.buffs.map((b) => `<span class="chip" title="${L('Efecto de poción', 'Potion effect')}">${ITEM_INDEX.get(b.id).name} · ${b.left} ${L(b.left === 1 ? 'combate' : 'combates', b.left === 1 ? 'battle' : 'battles')}</span>`).join('');
    const stat = c.status.map((x) => `<span class="chip st" style="border-color:${STATUS[x].color};color:${STATUS[x].color}">${STATUS[x].name}</span>`).join('');
    const aff = Object.entries(c.aff).filter(([, v]) => v > 0).map(([k, v]) => `<span class="chip" title="${L(`Afinidad con el elemento ${elementName(k).toLowerCase()}`, `${elementName(k)} affinity`)}" style="border-color:${elementColor(k)}">${L(`Afinidad ${elementName(k).toLowerCase()}`, `${elementName(k)} affinity`)} ${v}</span>`).join('');
    const flag = ko ? '<span class="chip st" style="border-color:#ff6a4c;color:#ff6a4c">' + L('Inconsciente', 'Unconscious') + '</span>' : resting ? `<span class="chip st" style="border-color:#6ab4f0;color:#6ab4f0">${L('En camilla', 'On a cot')} · ${clock(c.rest.until, '', 'tm')}</span>` : '';
    const sname = c.name === sp.name ? '' : sp.name + ' · ';
    const icon = `<div class="ic">${ICON.beast(css(ELEMENTS[sp.element].color))}</div>`;
    const hpRow = `<div class="hp">${bar(c.hp, max, c.hp < max * 0.35 ? 'low' : '')}<span>${c.hp}/${max} ${PS()}</span></div>`;
    if (compact) return `<div class="cc compact">${icon}<div class="tx"><b>${c.name} <em>${sname}${NV()} ${c.level}</em></b>${hpRow}<div class="chips">${flag}${stat}</div></div>${withActions}</div>`;
    return `<div class="cc">${icon}<div class="tx">
      <b>${c.name} <em>${sname}${stageName(c)} · ${NV()} ${c.level}</em></b>
      ${hpRow}
      <div class="hp xp">${bar(c.xp, G.xpNeed(c.level), 'xp')}<span>${c.xp}/${G.xpNeed(c.level)} XP</span></div>
      <div class="stats">${TRAINING.map((t) => `<span>${t.name} <b>${c.stats[t.id]}</b></span>`).join('')}</div>
      <div class="chips">${flag}${stat}${aff}${buffs}</div>${powerLine(c)}${formChips(c)}</div>${withActions}</div>`;
  }
  // poderes permanentes de las manzanas de su elemento y cuánto falta para el próximo
  function powerLine(c) {
    if (!c.id || String(c.id).startsWith('sp:')) return '';
    const el = G.speciesOf(c.species).element, got = powersOf(el, c.apples), nx = nextPower(el, c.apples);
    const chips = got.map((p) => `<span class="chip pw" title="${p.desc}" style="border-color:${elementColor(el)}">${p.name}</span>`).join('');
    const en = elementName(el), hint = nx ? L(`Manzanas de ${el}: ${c.apples || 0}. Con ${nx.n} aprende «${nx.name}».`, `${en} apples: ${c.apples || 0}. At ${nx.n} it learns “${nx.name}”.`) : L(`Manzanas de ${el}: ${c.apples}. Aprendió todos los poderes.`, `${en} apples: ${c.apples}. It has learned every power.`);
    return `<div class="chips">${chips}</div><small class="pwhint">${hint}</small>`;
  }
  // formas de una criatura: la base, la 2 (si la especie la tiene) y la 3 (si ya recibió su manzana); la activa va marcada
  function formChips(c) {
    if (!c.id || String(c.id).startsWith('sp:') || !c.forms) return '';
    const el = G.speciesOf(c.species).element, un = G.unlockedForms(c);
    if (un.length < 2) return '';   // con un solo aspecto no hay nada que elegir
    return `<div class="chips forms"><span class="pwhint" style="display:inline;margin:0 4px 0 0">${L('Aspecto', 'Look')}</span>${formsOf(el).map((f) => un.includes(f.id) ? `<button data-act="setform" data-id="${c.id}|${f.id}" class="chip-b${c.form === f.id ? ' sel' : ''}" style="--c:${css(ELEMENTS[el].color)}">${formLabel(f)}</button>` : '').join('')}</div>`;
  }
  // fichas de criaturas del equipo para elegir (gimnasio, mochila)
  function picker(extra = '') {
    const R = S().roster; if (R.length < 2) return '';
    const cur = creature();
    return `<div class="chipsel">${R.map((c, i) => `<button data-act="selc" data-id="${i}" class="chip-b${c === cur ? ' sel' : ''}" style="--c:${css(ELEMENTS[G.speciesOf(c.species).element].color)}">${c.name} · ${NV()} ${c.level}</button>`).join('')}${extra}</div>`;
  }

  // =============================== TIENDA ===============================
  const tiendaTabs = () => [['comida', L('Comida', 'Food')], ['manzanas', L('Manzanas', 'Apples')], ['ofertas', L('Ofertas', 'Offers')], ['aspectos', L('Aspectos', 'Looks')], ['vender', L('Vender', 'Sell')]];
  function viewComida() {
    return lead(L('La comida da experiencia: con la suficiente, la criatura sube de nivel y cambia de etapa. Se le da en su jaula (Criaderos › Alimentar).', 'Food gives experience: with enough of it, a creature levels up and reaches a new stage. You feed it in its cage (Breeding Grounds › Feed).')) + FOOD.map((f) =>
      row(iconFor({ ...f, kind: 'food' }), f.name, `${f.desc} <i>+${f.xp} XP</i>${haveTxt(have(f.id))}`, price(f.price) + buyBtn(f.id, f))).join('');
  }
  function viewManzanas() {
    return lead(L('Cada manzana es de un elemento y solo la come una criatura de ese elemento. La primera, la tercera y la quinta enseñan un poder permanente. Todas suben la afinidad, y la primera también cambia el aspecto. En combate se lanzan como ataque y calientan los huevos del mismo elemento. La dorada sirve para cualquiera.', 'Each apple belongs to an element and only a creature of that element will eat it. The first, third and fifth teach a permanent power. They all raise affinity, and the first also changes the creature’s look. In battle they are thrown as attacks, and they warm eggs of the same element. The golden one works for anyone.')) + APPLES.map((a) =>
      row(iconFor({ ...a, kind: 'apple' }), a.name, `${a.desc}${a.element ? ` <i>${L('Poderes', 'Powers')}: ${POWERS[a.element].map((p) => `${L(`${p.n}.ª`, ['1st', '2nd', '3rd', '4th', '5th'][p.n - 1])} ${p.name}`).join(' · ')}.</i>` : ''}${haveTxt(have(a.id))}`, price(a.price) + buyBtn(a.id, a), a.element ? '' : 'gold')).join('');
  }
  function viewOfertas() {
    const offers = G.todaysOffers();
    return lead(L('Ildefonso rebaja tres productos cada día (−25 %), con existencias limitadas. Mañana habrá otros.', 'Ildefonso marks down three products every day (−25 %), while stocks last. Tomorrow there will be others.')) + offers.map((o) => {
      const it = ITEM_INDEX.get(o.id), btn = o.left <= 0 ? `<button class="on" disabled>${L('Agotado', 'Sold out')}</button>` : `<span class="was">${it.price}</span>${price(o.price)}<button data-act="buyOffer" data-id="${o.id}"${S().coins < o.price ? ' class="poor"' : ''}>${L('Comprar', 'Buy')}</button>`;
      return row(iconFor(it), `${it.name} <em>${L(`quedan ${o.left}`, `${o.left} left`)}</em>`, it.desc + (it.xp ? ` +${it.xp} XP.` : ''), btn, 'gold');
    }).join('');
  }
  function viewAspectos() {
    const sub = `<div class="sub"><button data-act="skintab" data-id="viajero"${skinTab === 'viajero' ? ' class="sel"' : ''}>${L('Tu viajero', 'Your traveler')}</button><button data-act="skintab" data-id="criaturas"${skinTab === 'criaturas' ? ' class="sel"' : ''}>${L('Criaturas', 'Creatures')}</button></div>`;
    if (skinTab === 'viajero') {
      return sub + PLAYER_SKINS.map((k) => {
        const own = S().playerSkins.includes(k.id), on = S().playerSkin === k.id;
        const btn = on ? `<button class="on" disabled>${L('Puesta', 'Equipped')}</button>` : own ? `<button data-act="equipP" data-id="${k.id}">${L('Ponerla', 'Wear it')}</button>` : price(k.price) + `<button data-act="buyP" data-id="${k.id}"${S().coins < k.price ? ' class="poor"' : ''}>${L('Comprar', 'Buy')}</button>`;
        return row(ICON.cloak(css(k.cloak)), k.name, k.desc, btn);
      }).join('');
    }
    return sub + viewFormas();
  }
  // vista previa 3D con fichas de aspecto (base y los dos del elemento)
  function previewBlock(sp, tag = false) {
    const chips = formsOf(sp.element).map((f) => `<button data-act="pvform" data-id="${f.id}" class="chip-b${pv.form === f.id ? ' sel' : ''}" style="--c:${css(ELEMENTS[sp.element].color)}">${formLabel(f)}</button>`).join('');
    return `<div class="pv" id="pv-slot">${sp.model ? '' : `<p class="pvnote">${L('Modelo 3D en preparación', '3D model in progress')}</p>`}${tag && sp.model ? `<span class="pvtag">${L('Vista previa: no cuenta como compra', 'Preview: this is not a purchase')}</span>` : ''}</div><div class="chipsel pvchips">${chips}</div>`;
  }
  function viewFormas() {
    const sp = SPECIES.find((s) => s.id === pv.species) || SPECIES[0], F = FORMS[sp.element], pr = formPrice(sp), has = G.hasForm2(sp.id);
    const chips = SPECIES.map((s) => `<button data-act="pvsp" data-id="${s.id}" class="chip-b${pv.species === s.id ? ' sel' : ''}" style="--c:${css(ELEMENTS[s.element].color)}">${s.name}</button>`).join('');
    const mates = SPECIES.filter((s) => s.element === sp.element).map((s) => s.name).join(', ');
    const mine = G.owned(sp.id).filter((c) => (c.forms || []).includes(F.v3.id)).length, el = elementName(sp.element).toLowerCase();
    return `<div class="asp"><div class="asp-l"><div class="chipsel scroll">${chips}</div>${previewBlock(sp, true)}</div><div class="asp-r">` +
      row(ICON.beast(css(ELEMENTS[sp.element].color)), `${F.v2.name} <em>${has ? L('tuyo', 'yours') : L('en venta', 'for sale')}</em>`, `${F.v2.desc} ${L(`Se compra una vez y lo pueden llevar todas tus criaturas de ${el}; se elige en su ficha (Mochila › Criaturas).`, `Buy it once and all your ${el} creatures can wear it; choose it on their card (Backpack › Creatures).`)}`, has ? `<button class="on" disabled>${L('Desbloqueado', 'Unlocked')}</button>` : price(pr) + `<button data-act="buyForm" data-confirm="1" data-id="${sp.id}"${S().coins < pr ? ' class="poor"' : ''}>${L('Comprar', 'Buy')}</button>`) +
      row(ICON.apple(css(ELEMENTS[sp.element].color)), `${F.v3.name} <em>${L('con manzana', 'with an apple')}</em>`, `${F.v3.desc} ${L(`Se consigue dándole una <strong>${ITEM_INDEX.get(F.apple).name.toLowerCase()}</strong> a cada criatura de ${el} en su jaula (Criaderos › Alimentar).`, `You get it by giving a <strong>${ITEM_INDEX.get(F.apple).name}</strong> to each ${el} creature in its cage (Breeding Grounds › Feed).`)}${mine ? L(` Tienes ${mine} de esta especie con este aspecto.`, ` You have ${mine} of this species with this look.`) : ''}`, `<button class="on" disabled>${L('No se vende', 'Not for sale')}</button>`) +
      lead(L(`Los aspectos son de cada elemento: los comparten todas las criaturas de ${el} (${mates}) y no sirven en otros elementos. Bono de los aspectos: ${formBonusText()}`, `Looks belong to an element: all ${el} creatures share them (${mates}) and they don’t work for other elements. Look bonus: ${formBonusText()}`)) + '</div></div>';
  }
  function viewVender() {
    const ids = Object.keys(S().bag).filter((id) => ITEM_INDEX.has(id));
    if (!ids.length) return lead(L('No tienes nada para vender. Ildefonso paga la mitad de lo que cuesta cada cosa.', 'You have nothing to sell. Ildefonso pays half of what each thing costs.'));
    return lead(L('Ildefonso paga la mitad del precio de lista por lo que le traigas.', 'Ildefonso pays half the list price for whatever you bring him.')) + ids.map((id) => {
      const it = ITEM_INDEX.get(id), n = S().bag[id], p = G.sellPrice(it);
      return row(iconFor(it), `${it.name} <em>× ${n}</em>`, it.desc, price(p) + `<button data-act="sell" data-id="${id}|1">${L('Vender 1', 'Sell 1')}</button>` + (n > 1 ? `<button data-act="sell" data-confirm="1" data-ctext="${L('Confirmar', 'Confirm')}: +${p * n}" data-id="${id}|${n}" class="alt">${L(`Vender los ${n}`, `Sell all ${n}`)} (+${p * n})</button>` : ''));
    }).join('');
  }

  // ============================= ENFERMERÍA =============================
  const enfTabs = () => [['curar', L('Curar', 'Heal')], ['camillas', L('Camillas', 'Cots')], ['estados', L('Estados', 'Conditions')], ['pociones', L('Pociones', 'Potions')], ['botiquines', L('Botiquines', 'Kits')]];
  function viewCurar() {
    if (!S().roster.length) return noCreatures();
    return lead(L('La Dra. Vesper cura las heridas y quita todos los estados (25 monedas por estado). Reanimar a una criatura inconsciente cuesta 40 más. Cuanto más maltrecha llegue, más cuesta.', 'Dr. Vesper heals wounds and clears every condition (25 coins per condition). Reviving an unconscious creature costs 40 more. The more battered it arrives, the more it costs.')) + S().roster.map((c) => {
      const need = c.hp < G.hpMax(c) || c.status.length, ko = G.isKo(c);
      const btn = !need ? `<button class="on" disabled>${L('En perfecto estado', 'In perfect shape')}</button>` : price(G.healCost(c)) + `<button data-act="heal" data-id="${c.id}"${S().coins < G.healCost(c) ? ' class="poor"' : ''}>${ko ? L('Reanimar', 'Revive') : L('Curar', 'Heal')}</button>`;
      return creatureCard(c, `<div class="rt">${btn}</div>`, true);
    }).join('');
  }
  function viewCamillas() {
    if (!S().roster.length) return noCreatures();
    return lead(L(`Si no tienes prisa, deja a tu criatura descansar en una camilla: es gratis, pero tarda más cuanto más herida esté, y solo hay ${G.RESTS_MAX} camillas. Mientras descansa no puede entrenar ni pelear. Una criatura inconsciente solo la reanima el doctor.`, `If you’re in no hurry, let your creature rest on a cot: it’s free, but it takes longer the more hurt it is, and there are only ${G.RESTS_MAX} cots. While it rests it can’t train or fight. Only the doctor can revive an unconscious creature.`)) + S().roster.map((c) => {
      const need = c.hp < G.hpMax(c) || c.status.length, resting = G.isResting(c);
      const btn = resting ? clock(c.rest.until, L('Listo en ', 'Ready in ')) : need ? `<span class="was" style="text-decoration:none">${L('Tarda', 'Takes')} ${fmtTime(G.restMs(c))}</span><button data-act="admit" data-id="${c.id}">${L('Poner en camilla', 'Put on a cot')}</button>` : `<button class="on" disabled>${L('No necesita', 'Not needed')}</button>`;
      return creatureCard(c, `<div class="rt">${btn}</div>`, true);
    }).join('');
  }
  function viewEstados() {
    const sick = S().roster.filter((c) => c.status.length);
    const info = '<div class="chips" style="margin:2px 2px 10px">' + Object.values(STATUS).map((s) => `<span class="chip st" style="border-color:${s.color};color:${s.color}" title="${s.desc}">${s.name}. ${s.desc}</span>`).join('') + '</div>';
    if (!S().roster.length) return noCreatures();
    if (!sick.length) return info + lead(L('Ninguna de tus criaturas tiene estados. Los deja el combate: quemaduras, veneno y miedo.', 'None of your creatures has a condition. Battles leave them behind: burns, poison and fear.'));
    return info + lead(L('El doctor quita un estado por 25 monedas. Si tienes el objeto indicado, úsalo gratis.', 'The doctor removes a condition for 25 coins. If you have the right item, use it for free.')) + sick.map((c) => c.status.map((x) => {
      const cure = CURES.find((k) => k.cures === x), has = cure && have(cure.id);
      const right = (has ? `<button data-act="cureItem" data-id="${c.id}|${x}|${cure.id}" class="alt">${L(`Usar ${cure.name.split(' ')[0].toLowerCase()}`, `Use ${cure.name.split(' ').pop().toLowerCase()}`)} (${have(cure.id)})</button>` : '') + price(25) + `<button data-act="cureDoc" data-id="${c.id}|${x}"${S().coins < 25 ? ' class="poor"' : ''}>${L('Curar', 'Cure')}</button>`;
      return row(ICON.beast(css(ELEMENTS[G.speciesOf(c.species).element].color)), `${c.name}: ${STATUS[x].name}`, STATUS[x].desc, right);
    }).join('')).join('');
  }
  function viewPociones() {
    return lead(L('Efecto temporal: dura varios combates. Se toman desde la Mochila antes de pelear.', 'Temporary effect: it lasts several battles. Drink them from the Backpack before a fight.')) + POTIONS.map((p) =>
      row(iconFor({ ...p, kind: 'potion' }), p.name, `${p.desc}${haveTxt(have(p.id))}`, price(p.price) + buyBtn(p.id, p))).join('');
  }
  function viewBotiquines() {
    return lead(L('Curas rápidas, sin pasar por el doctor: úsalas desde la mochila o en pleno combate.', 'Quick healing without seeing the doctor: use them from the backpack or in the middle of a battle.')) + KITS.map((k) =>
      row(iconFor({ ...k, kind: 'kit' }), k.name, `${k.desc}${haveTxt(have(k.id))}`, price(k.price) + buyBtn(k.id, k))).join('') +
      CURES.map((k) => row(ICON.cure(css(STATUS[k.cures].color)), k.name, `${k.desc}${haveTxt(have(k.id))}`, price(k.price) + buyBtn(k.id, k))).join('');
  }

  // ============================== GIMNASIO ==============================
  const gymTabs = () => [['entrenar', L('Entrenar', 'Train')], ['sparring', L('Práctica', 'Practice')], ['consejos', L('Consejos', 'Tips')]];
  function viewEntrenar() {
    const c = creature(); if (!c) return noCreatures();
    const max = G.hpMax(c), cap = G.statCap(c), resting = G.isResting(c);
    return picker() + lead(L('Cada ejercicio es un reto: detén la marca en la zona verde. Perfecto: +2. Bien: +1. Flojo: +0 y cuesta la mitad. Entrenar cansa; si su salud baja del 35 %, llévala a la Enfermería.', 'Every exercise is a challenge: stop the marker in the green zone. Perfect: +2. Good: +1. Weak: +0 and it costs half. Training is tiring; if its health drops below 35 %, take it to the Infirmary.')) + creatureCard(c, '', true) +
      TRAINING.map((tr) => {
        const v = c.stats[tr.id], capped = v >= cap, tired = c.hp < max * 0.35, cost = G.trainCost(c, tr.id);
        const btn = resting ? `<button class="on" disabled>${L('En camilla', 'On a cot')}</button>` : capped ? `<button class="on" disabled>${L('Al tope', 'Maxed')}</button>` : tired ? `<button class="on" disabled>${L('Agotada', 'Exhausted')}</button>` : price(cost) + `<button data-act="train" data-id="${tr.id}"${S().coins < cost ? ' class="poor"' : ''}>${L('Entrenar', 'Train')}</button>`;
        return `<div class="row"><div class="tx"><b>${tr.name} <em>${tr.place}</em></b><small>${tr.desc}</small>${bar(v, cap, 'stat')}</div><div class="rt"><span class="val">${v}<small>/${cap}</small></span>${btn}</div></div>`;
      }).join('');
  }
  function viewSparring() {
    const c = creature(); if (!c) return noCreatures();
    const ready = !G.isKo(c) && !G.isResting(c);
    return picker() + lead(L('Brenna te presta un muñeco de combate: peleas sin riesgo (tu criatura no pierde salud ni gana estados, y no gastas objetos) y ganas experiencia hasta el nivel 10. Sirve para practicar rondas, manzanas y objetos.', 'Brenna lends you a training dummy: you fight with no risk (your creature loses no health, gets no conditions and you use up no items) and you earn experience up to level 10. Good for practicing rounds, apples and items.')) + creatureCard(c, '', true) +
      row(ICON.beast('#b09a62'), L('Muñeco de combate', 'Training dummy'), L('Aguanta golpes, devuelve algunos y no se cansa. Nivel parecido al de tu criatura.', 'It takes hits, returns a few and never tires. Its level is close to your creature’s.'), ready ? `<button data-act="spar" data-id="${c.id}">${L('Empezar práctica', 'Start practice')}</button>` : `<button class="on" disabled>${L('No puede pelear', 'Can’t fight')}</button>`);
  }
  function viewConsejos() {
    if (isEn()) return `<div class="tips"><p><b>Elements.</b> Fire, water, air and earth. Each apple raises your creature’s affinity with one of them and, in battle, is thrown as an attack.</p>
      <p><b>Level and stage.</b> Feed it in its cage: when it levels up, strength and vitality grow, and at certain levels it evolves (Hatchling, Juvenile, Adult, Ancestral).</p>
      <p><b>HP.</b> Health points: when they reach zero, the creature is knocked out.</p>
      <p><b>Training cap.</b> Each stat can reach 12 + 2 × level. To go past the cap, level up.</p>
      <p><b>Fatigue.</b> Training costs health. Heal it at the Infirmary, leave it on a cot or use a first-aid kit.</p></div>`;
    return `<div class="tips"><p><b>Elementos.</b> Fuego, agua, aire y tierra. Cada manzana sube la afinidad de tu criatura con uno de ellos y, en combate, se lanza como ataque.</p>
      <p><b>Nivel y etapa.</b> Aliméntala en su jaula: al subir de nivel crecen la fuerza y la vitalidad, y en ciertos niveles evoluciona (Cría, Joven, Adulto o Adulta, Ancestral).</p>
      <p><b>PS.</b> Son los puntos de salud: cuando llegan a cero, la criatura queda fuera de combate.</p>
      <p><b>Tope de entrenamiento.</b> Cada estadística puede llegar a 12 + 2 × nivel. Para pasar el tope, sube de nivel.</p>
      <p><b>Cansancio.</b> Entrenar resta salud. Cúrala en la Enfermería, déjala en una camilla o usa un botiquín.</p></div>`;
  }
  // ejercicio: una marca va y viene; hay que detenerla en la zona verde
  function startMinigame(stat) {
    const c = creature(); if (!c) return;
    if (S().coins < G.trainCost(c, stat)) { flash(L('No te alcanzan las monedas para este ejercicio.', 'You don’t have enough coins for this exercise.'), false); return; }
    mg = { stat, id: c.id, p: 0, dir: 1, last: performance.now(), raf: 0 };
    const tick = (t) => {
      if (!mg) return;
      const dt = Math.min(0.05, (t - mg.last) / 1000); mg.last = t;
      mg.p += mg.dir * dt / 1.1; if (mg.p > 1) { mg.p = 1; mg.dir = -1; } else if (mg.p < 0) { mg.p = 0; mg.dir = 1; }
      const m = document.getElementById('mgm'); if (m) m.style.left = (mg.p * 100).toFixed(1) + '%';
      mg.raf = requestAnimationFrame(tick);
    };
    mg.raf = requestAnimationFrame(tick);
    render();
  }
  function stopMinigame() {
    if (!mg) return;
    const d = Math.abs(mg.p - 0.5), m = mg; cancelAnimationFrame(m.raf); mg = null;
    lastMg = performance.now();
    const grade = d <= 0.07 ? 'perfecto' : d <= 0.14 ? 'bien' : 'flojo';
    const r = G.train(m.id, m.stat, grade === 'perfecto' ? 2 : grade === 'bien' ? 1 : 0, grade === 'flojo' ? 0.5 : 1);
    done({ ok: r.ok, msg: r.ok ? `${grade === 'perfecto' ? L('¡Perfecto! ', 'Perfect! ') : grade === 'bien' ? L('Bien. ', 'Good. ') : ''}${r.msg}` : r.msg });
    render();
  }
  function viewMinigame() {
    const tr = TRAINING.find((t) => t.id === mg.stat);
    return `<div class="mg"><b>${tr.name}: ${tr.place}</b><small>${coarse ? L('Toca la barra o «¡Ya!»', 'Tap the bar or “Now!”') : L('Pulsa «¡Ya!», haz clic en la barra o usa Espacio', 'Press “Now!”, click the bar or use Space')} ${L('cuando la marca esté en la zona verde.', 'when the marker is in the green zone.')}</small>
      <div class="mgbar" data-act="mgstop"><div class="mgzone"><div class="mgperf"></div></div><div class="mgmark" id="mgm" style="left:${(mg.p * 100).toFixed(1)}%"></div></div>
      <p class="mgkey">${L('Centro +2 · Verde +1 · Fuera +0 (cuesta la mitad)', 'Center +2 · Green +1 · Outside +0 (costs half)')}</p>
      <div class="mgbtns"><button data-act="mgstop" class="big">${L('¡Ya!', 'Now!')}</button><button data-act="mgcancel" class="alt">${L('Cancelar', 'Cancel')}</button></div></div>`;
  }

  // ============================ CRIADERO (jaulas) ============================
  const critTabs = () => [['ficha', L('Ficha', 'Profile')], ['alimentar', L('Alimentar', 'Feed')], ['huevo', L('Huevo', 'Egg')], ['combinar', L('Combinar', 'Combine')]];
  let feedSel = 0;      // criatura elegida para alimentar dentro de la jaula
  function viewFicha() {
    const sp = ctx.species, mine = G.owned(sp.id), el = elementName(sp.element).toLowerCase();
    const bars = TRAINING.map(({ id: k, name: n }) => `<div class="hp"><span style="min-width:74px;text-align:left">${n}</span>${bar(sp.base[k], 12, 'stat')}<span style="min-width:24px">${sp.base[k]}</span></div>`).join('');
    const head = previewBlock(sp) + `<div class="cc"><div class="ic">${ICON.beast(css(ELEMENTS[sp.element].color))}</div><div class="tx"><b>${sp.name} <em>${L(`Elemento ${el}`, `${elementName(sp.element)} element`)}</em></b><small>${sp.desc}</small>${bars}</div></div>`;
    const list = mine.length ? mine.map((c) => creatureCard(c)).join('') : empty(L(`Aún no tienes ${sp.genero === 'f' ? 'ninguna' : 'ninguno'} de esta especie. Compra su huevo en la pestaña «Huevo».`, 'You don’t have any of this species yet. Buy its egg in the “Egg” tab.'));
    return head + lead(L('Estadísticas base de una cría, en una escala de 0 a 12.', 'Base stats of a hatchling, on a scale from 0 to 12.')) + (mine.length ? `<h4 class="sec">${L(`Tus ${sp.plural}`, `Your ${sp.plural}`)}</h4>` : '') + list;
  }
  // Alimentar: la comida y las manzanas se dan en la jaula de la criatura (no desde la Mochila)
  function viewAlimentar() {
    const sp = ctx.species, mine = G.owned(sp.id);
    if (!mine.length) return empty(L(`Todavía no tienes ninguna criatura de esta especie. Compra su huevo en la pestaña «Huevo», espera 5 minutos y ábrelo desde la Mochila. Después podrás alimentar${sp.genero === 'f' ? 'la' : 'lo'} aquí.`, 'You don’t have any creature of this species yet. Buy its egg in the “Egg” tab, wait 5 minutes and open it from the Backpack. Then you can feed it here.'));
    const c = mine[Math.min(feedSel, mine.length - 1)];
    const pick = mine.length > 1 ? `<div class="chipsel">${mine.map((x, i) => `<button data-act="feedsel" data-id="${i}" class="chip-b${x === c ? ' sel' : ''}" style="--c:${css(ELEMENTS[sp.element].color)}">${x.name} · ${NV()} ${x.level}</button>`).join('')}</div>` : '';
    const el = sp.element, nx = nextPower(el, c.apples), ko = G.isKo(c);
    const foods = FOOD.map((f) => { const n = have(f.id), maxed = c.level >= G.MAX_LEVEL; return row(iconFor({ ...f, kind: 'food' }), `${f.name} <em>× ${n}</em>`, `${f.desc} <i>+${f.xp} XP</i>`, n && !ko && !maxed ? `<button data-act="feed" data-id="${c.id}|${f.id}">${L('Dar 1', 'Give 1')}</button>${n > 1 ? `<button data-act="feedn" data-id="${c.id}|${f.id}|${Math.min(5, n)}" class="alt">${L('Dar', 'Give')} ${Math.min(5, n)}</button>` : ''}` : `<button class="on" disabled>${ko ? L('Inconsciente', 'Unconscious') : maxed ? L('Nivel máximo', 'Max level') : L('No tienes', 'None')}</button>`); }).join('');
    const minLv = G.appleMinLevel(c);
    const apples = APPLES.filter((a) => !a.element || a.element === el).map((a) => { const n = have(a.id); const eln = elementName(el).toLowerCase(), sub = (a.element ? L(`Aprende un poder permanente${nx ? ` (próximo: «${nx.name}»)` : ''} y gana +1 de afinidad.${c.forms.includes(FORMS[el].v3.id) ? '' : ` Es la primera: su aspecto cambia a ${formLabel(FORMS[el].v3).toLowerCase()}.`}`, `It learns a permanent power${nx ? ` (next: “${nx.name}”)` : ''} and gains +1 affinity.${c.forms.includes(FORMS[el].v3.id) ? '' : ` It’s the first one: its look changes to ${formLabel(FORMS[el].v3).toLowerCase()}.`}`) : L(`Cuenta como manzana de ${el}: poder permanente y +1 de afinidad con los cuatro elementos.`, `Counts as a ${eln} apple: a permanent power and +1 affinity with all four elements.`)) + (minLv === null ? L(' Ya aprendió todos los poderes.', ' It has already learned every power.') : L(` Pide nivel ${minLv} (tiene ${c.level}).`, ` Requires level ${minLv} (it is level ${c.level}).`)); const can = n && minLv !== null && c.level >= minLv; return row(iconFor({ ...a, kind: 'apple' }), `${a.name} <em>× ${n}</em>`, sub, can ? `<button data-act="feed" data-id="${c.id}|${a.id}">${L('Dar 1', 'Give 1')}</button>` : `<button class="on" disabled>${!n ? L('No tienes', 'None') : minLv === null ? L('Sin efecto', 'No effect') : L('Nivel ', 'Level ') + minLv}</button>`, a.element ? '' : 'gold'); }).join('');
    return pick + creatureCard(c) + lead(L('La comida da experiencia y hace subir de nivel. Las manzanas especiales solo las come una criatura de su mismo elemento. Los dos se compran en la Tienda.', 'Food gives experience and levels the creature up. Special apples are only eaten by a creature of the same element. Both are sold at the Shop.')) + `<h4 class="sec">${L('Comida', 'Food')}</h4>${foods}<h4 class="sec">${L(`Manzanas de ${el} y la dorada`, `${elementName(el)} apples and the golden one`)}</h4>${apples}`;
  }
  function viewHuevo() {
    const sp = ctx.species, p = G.eggPrice(sp), full = S().eggs.length >= G.eggSlots(), poor = S().coins < p;
    const btn = full ? `<button class="on" disabled>${L('Incubadora llena', 'Incubator full')}</button>` : `<button data-act="buyEgg" data-confirm="1" data-id="${sp.id}"${poor ? ' class="poor"' : ''}>${L('Comprar huevo', 'Buy egg')}</button>`;
    const mine = S().eggs.filter((e) => e.species === sp.id);
    return lead(L(`Las criaturas no se adoptan: compras su huevo, queda en la incubadora (tu Mochila) y en 5 minutos puedes eclosionarlo. Al nacer, queda lista para usar. Incubadora: ${S().eggs.length}/${G.eggSlots()}.`, `Creatures aren’t adopted: you buy their egg, it goes into the incubator (your Backpack) and in 5 minutes you can hatch it. Once born, it’s ready to use. Incubator: ${S().eggs.length}/${G.eggSlots()}.`)) +
      row(ICON.egg(css(ELEMENTS[sp.element].color)), eggOf(sp), L(`Elemento ${elementName(sp.element).toLowerCase()}. Una manzana de su elemento (o la dorada) lo calienta y acorta la espera.`, `${elementName(sp.element)} element. An apple of its element (or the golden one) warms it and shortens the wait.`), price(p) + btn) +
      (mine.length ? lead(L('En tu incubadora:', 'In your incubator:')) + mine.map(eggRow).join('') : '');
  }
  function viewCombinar() {
    const sp = ctx.species, mine = G.owned(sp.id);
    if (mine.length < 2) return empty(L(`Para combinar necesitas dos ${sp.plural} en tu equipo. Se fusionan en ${sp.genero === 'f' ? 'una sola, de mayor nivel' : 'uno solo, de mayor nivel'} y con lo mejor de cada ${sp.genero === 'f' ? 'una' : 'uno'}.`, `To combine you need two ${sp.plural} on your team. They merge into a single one of a higher level, with the best of each.`));
    const pairs = [];
    for (let i = 0; i < mine.length; i++) for (let j = i + 1; j < mine.length; j++) pairs.push([mine[i], mine[j]]);
    return lead(L(`Combinar cuesta ${G.FUSE_COST} monedas: se queda la criatura de más nivel (o con más manzanas), conserva lo mejor de las dos (estadísticas, manzanas, poderes y aspectos), sube de nivel (más cuanto más fuerte sea la absorbida) y gana +1 en cada estadística. La absorbida desaparece.`, `Combining costs ${G.FUSE_COST} coins: the higher-level creature (or the one with more apples) stays, keeps the best of both (stats, apples, powers and looks), levels up (more the stronger the absorbed one is) and gains +1 in every stat. The absorbed one disappears.`)) + pairs.map(([a, b]) => {
      const keep = (a.level + (a.apples || 0) * 0.1) >= (b.level + (b.apples || 0) * 0.1) ? a : b, gone = keep === a ? b : a;
      const nl = Math.min(G.MAX_LEVEL, Math.max(a.level, b.level) + 1 + Math.floor(Math.min(a.level, b.level) / 5));
      const pid = `${a.id}|${b.id}`;
      if (pendingFuse === pid) {
        const cost = L(`${G.FUSE_COST} monedas`, `${G.FUSE_COST} coins`);
        return row(ICON.beast(css(ELEMENTS[sp.element].color)), L('Fusionar criaturas', 'Fuse creatures'), `${L(`${keep.name} se conserva. ${gone.name} desaparecerá.`, `${keep.name} will be kept. ${gone.name} will disappear.`)}<br>${L(`Nivel: ${keep.level} → ${nl}`, `Level: ${keep.level} → ${nl}`)} · ${L(`Costo: ${cost}`, `Cost: ${cost}`)}`, `<button data-act="fusecancel" class="alt" data-autofocus>${L('Cancelar', 'Cancel')}</button><button data-act="fuseok" class="danger" data-id="${pid}"${S().coins < G.FUSE_COST ? ' disabled' : ''}>${L(`Fusionar y consumir ${gone.name}`, `Fuse and consume ${gone.name}`)}</button>`, 'gold');
      }
      return row(ICON.beast(css(ELEMENTS[sp.element].color)), `${keep.name} + ${gone.name}`, L(`${keep.name} absorbe a ${gone.name}, que desaparece. Nivel ${keep.level} → ${nl}.`, `${keep.name} absorbs ${gone.name}, who disappears. Level ${keep.level} → ${nl}.`), price(G.FUSE_COST) + `<button data-act="fuse" data-id="${pid}"${S().coins < G.FUSE_COST ? ' class="poor"' : ''}>${L('Fusionar criaturas', 'Fuse creatures')}</button>`);
    }).join('');
  }

  // ============================ ZONA DE PELEA ============================
  const peleaTabs = () => [['liga', L('Liga', 'League')], ['pelear', L('Rivales del día', 'Today’s rivals')], ['reglas', L('Reglas', 'Rules')]];
  const advChip = (mul) => (mul > 1 ? `<span class="chip st" style="border-color:#7af0a8;color:#7af0a8">${L('Ventaja ×1,5', 'Advantage ×1.5')}</span>` : mul < 1 ? `<span class="chip st" style="border-color:#ff8a6a;color:#ff8a6a">${L('Desventaja ×0,7', 'Disadvantage ×0.7')}</span>` : `<span class="chip">${L('Neutral', 'Neutral')}</span>`);
  // emblemas de la Liga: vencidos, el siguiente y los que faltan
  const emblems = () => `<div class="embs" aria-label="${L(`Emblemas de la Liga: ${G.leagueBeaten()} de ${LEAGUE.length}`, `League emblems: ${G.leagueBeaten()} of ${LEAGUE.length}`)}">${LEAGUE.map((L, i) => `<span class="emb-d${i < G.leagueBeaten() ? ' got' : i === G.leagueBeaten() ? ' next' : ''}${L.boss ? ' crown' : ''}" style="--c:${L.color}" title="${L.emblem}${i < G.leagueBeaten() ? L_(' (conseguido)', ' (earned)') : ''}">${L.boss ? '♛' : i + 1}</span>`).join('')}</div>`;
  function viewLiga() {
    const c = creature(), beaten = G.leagueBeaten(), champ = G.isChampion();
    const can = c && !G.isKo(c) && !G.isResting(c), why = !c ? L_('Sin criatura', 'No creature') : G.isKo(c) ? L_('Inconsciente', 'Unconscious') : G.isResting(c) ? L_('En camilla', 'On a cot') : '';
    const myEl = c && G.speciesOf(c.species).element;
    const intro = champ ? lead(L_('Eres <b>Campeón del Bestiario</b>. Las revanchas se ajustan al nivel de tu criatura y pagan su botín; los maestros vuelven con una manzana más.', 'You are the <b>Bestiary Champion</b>. Rematches adjust to your creature’s level and pay out their loot; the masters come back with one more apple.'))
      : lead(L_(`La meta del pueblo: vence a los ${LEAGUE.length} maestros en orden. Cada uno entrega su emblema y un premio; quien vence a Garrick se corona Campeón del Bestiario. Su nivel no cambia: alimenta y entrena a tu criatura antes de retarlos.`, `The village’s goal: defeat the ${LEAGUE.length} masters in order. Each one hands over an emblem and a prize; whoever beats Garrick is crowned Bestiary Champion. Their levels don’t change: feed and train your creature before you challenge them.`));
    const head = emblems() + intro + (c ? picker() + creatureCard(c, '', true) : noCreatures());
    return head + LEAGUE.map((L, i) => {
      const sp = G.speciesOf(L.species), won = i < beaten, next = i === beaten, mul = myEl ? elementMul(myEl, sp.element) : 1;
      const adv = !c ? '' : advChip(mul);
      const lvlWarn = next && c && c.level < L.level ? `<span class="chip st" style="border-color:#f0a23a;color:#f0a23a">${L_(`Tu criatura: nivel ${c.level}`, `Your creature: level ${c.level}`)}</span>` : '';
      const item = ITEM_INDEX.get(L.item[0]);
      let btn;
      if (won) btn = `<span class="tag ok">✓ ${L_('Vencido', 'Beaten')}</span>` + (can ? `<button data-act="fightL" data-id="${i}|1" class="alt">${L_('Revancha', 'Rematch')}</button>` : '');
      else if (next) btn = can ? `<button data-act="fightL" data-id="${i}|0"${c.level < L.level - 2 ? ' class="poor"' : ''}>${L_('Retar', 'Challenge')}</button>` : `<button class="on" disabled>${why}</button>`;
      else btn = `<button class="on" disabled>${L_('Vence a', 'Beat')} ${LEAGUE[i - 1].name.split(' ')[0]}</button>`;
      const sub = L_(`${L.beast}: ${sp.name.toLowerCase()} de ${elementName(sp.element).toLowerCase()}, nivel ${L.level}. ${L.emblem} y ${L.prize} monedas, más ${item.name.toLowerCase()}${L.item[1] > 1 ? ' ×' + L.item[1] : ''}.${next ? ` <i>«${L.line}»</i>` : ''}`, `${L.beast}: ${elementName(sp.element).toLowerCase()} ${sp.name}, level ${L.level}. ${L.emblem} and ${L.prize} coins, plus ${item.name}${L.item[1] > 1 ? ' ×' + L.item[1] : ''}.${next ? ` <i>“${L.line}”</i>` : ''}`);
      return `<div class="row lg${next ? ' gold' : ''}${i > beaten ? ' dim' : ''}"><div class="ic"><span class="emb-d big${won ? ' got' : ''}${L.boss ? ' crown' : ''}" style="--c:${L.color}">${L.boss ? '♛' : i + 1}</span></div><div class="tx"><b>${L.name} <em>${L.title}</em></b><small>${sub}</small><div class="chips">${adv}${lvlWarn}</div></div><div class="rt">${btn}</div></div>`;
    }).join('');
  }
  function viewPelear() {
    const c = creature(); if (!c) return noCreatures();
    const can = !G.isKo(c) && !G.isResting(c), why = G.isKo(c) ? L('Inconsciente', 'Unconscious') : G.isResting(c) ? L('En camilla', 'On a cot') : '';
    const ids = SPECIES.filter((s) => s.model).map((s) => s.id);
    const rivals = rivalsFor(c.level, G.dayKey(), ids);
    const myEl = G.speciesOf(c.species).element, beats = Object.keys(ELEMENTS).filter((e) => elementMul(myEl, e) > 1).map((e) => elementName(e).toLowerCase()).join(L(' y ', ' and '));
    return picker() + creatureCard(c, '', true) + lead(L(`Elige un rival. Cambian cada día; cuanto más difícil, mejor el botín (los difíciles y los jefes también han comido manzanas y tienen poderes). Si tu criatura no cae, recupera toda su salud al terminar; si pierdes, queda inconsciente y la Enfermería la reanima. Tu criatura es de ${elementName(myEl).toLowerCase()} y vence a ${beats}.`, `Choose a rival. They change every day; the harder they are, the better the loot (the tough ones and the bosses have also eaten apples and have powers). If your creature doesn’t fall, it recovers all its health at the end; if you lose, it is knocked out and the Infirmary revives it. Your creature is ${elementName(myEl).toLowerCase()} and beats ${beats}.`)) +
      rivals.map((r, i) => {
        const sp = G.speciesOf(r.species), rw = rewardFor({ ...r, element: sp.element }, () => 0.5), mul = elementMul(myEl, sp.element);
        const adv = advChip(mul);
        const btn = can ? `<button data-act="fight" data-id="${i}">${L('Pelear', 'Fight')}</button>` : `<button class="on" disabled>${why}</button>`;
        return `<div class="row ${i === 3 ? 'gold' : ''}"><div class="ic">${ICON.beast(css(ELEMENTS[sp.element].color))}</div><div class="tx"><b>${r.tier.name}: ${sp.name} <em>${L('nivel', 'level')} ${r.level}</em></b><small>${L(`Elemento ${elementName(sp.element).toLowerCase()} · botín aprox. ${rw.coins} monedas y ${rw.xp} XP`, `${elementName(sp.element)} element · loot approx. ${rw.coins} coins and ${rw.xp} XP`)}</small><div class="chips">${adv}</div></div><div class="rt">${btn}</div></div>`;
      }).join('');
  }
  function viewReglas() {
    if (isEn()) return `<div class="tips"><p><b>Rounds.</b> Each round you choose an action and the rival chooses another; the more agile one acts first. Defending, using an item or fleeing take priority. Keys 1 to 6 choose the menu actions.</p>
      <p><b>Elements.</b> Fire beats air, air beats earth, earth beats water and water beats fire. This affects the special attack and the fireball (×1.5 with the advantage, ×0.7 against it); physical blows don’t change.</p>
      <p><b>Apples.</b> They are thrown as attacks: fire = fireball (may burn); water = shark pool (1/4 of the remaining health); air = wind that takes 50 and costs a turn; earth = spikes that take 100; golden = full heal.</p>
      <p><b>Conditions.</b> Burns and poison take HP every round and last after the fight; fear lowers damage. The Infirmary cures them.</p>
      <p><b>Potions.</b> The ones you drink before fighting last several battles. There are five: fury, stoneskin, storm feather, sap and aim.</p>
      <p><b>League.</b> Eight masters with fixed levels. Beating each one for the first time grants their emblem and a prize; rematches pay the normal loot.</p></div>`;
    return `<div class="tips"><p><b>Rondas.</b> En cada ronda eliges una acción y el rival otra; actúa primero el más ágil. Defender, usar un objeto o huir tienen prioridad. Los atajos 1 a 6 eligen las acciones del menú.</p>
      <p><b>Elementos.</b> Fuego vence a aire, aire a tierra, tierra a agua y agua a fuego. Afecta al ataque especial y a la bola de fuego (×1,5 con ventaja, ×0,7 en contra); los golpes físicos no cambian.</p>
      <p><b>Manzanas.</b> Se lanzan como ataque: fuego = bola de fuego (puede quemar); agua = charco con tiburón (1/4 de la vida restante); aire = viento que quita 50 y hace perder un turno; tierra = picos que quitan 100; dorada = cura total.</p>
      <p><b>Estados.</b> Quemadura y veneno quitan PS cada ronda y siguen después de la pelea; miedo baja el daño. La Enfermería los cura.</p>
      <p><b>Pociones.</b> Las que tomas antes de pelear duran varios combates. Hay cinco: furia, piel de piedra, pluma de tormenta, savia y puntería.</p>
      <p><b>Liga.</b> Ocho maestros con nivel fijo. Ganarles por primera vez da su emblema y un premio; las revanchas pagan el botín normal.</p></div>`;
  }

  // ================================ MOCHILA ================================
  const bagTabs = () => [['criaturas', L('Criaturas', 'Creatures')], ['objetos', L('Objetos', 'Items')], ['huevos', L('Huevos', 'Eggs')], ['progreso', L('Progreso', 'Progress')]];
  function viewCriaturas() {
    if (!S().roster.length) return noCreatures();
    const act = Math.min(sel, S().roster.length - 1);
    return lead(L('La criatura activa es la que usan el Gimnasio, la Zona de pelea y los objetos de la mochila.', 'The active creature is the one used by the Gym, the Arena and the items in your backpack.')) + S().roster.map((c, i) => creatureCard(c, `<div class="rt">${i === act ? `<span class="tag">${L('Activa', 'Active')}</span>` : `<button data-act="selc" data-id="${i}">${L('Hacer activa', 'Make active')}</button>`}</div>`)).join('');
  }
  function viewObjetos() {
    const ids = Object.keys(S().bag).filter((id) => ITEM_INDEX.has(id));
    if (!ids.length) return empty(L('La mochila está vacía. Pasa por la Tienda o por la Enfermería.', 'Your backpack is empty. Stop by the Shop or the Infirmary.'));
    const inCage = (id) => ['food', 'apple'].includes(ITEM_INDEX.get(id).kind);   // la comida y las manzanas se dan en la jaula
    const usable = ids.filter((id) => !inCage(id)), cage = ids.filter(inCage), c = creature();
    const itemRow = (id, right, extra = '') => { const it = ITEM_INDEX.get(id); return row(iconFor(it), `${it.name} <em>× ${S().bag[id]}</em>`, it.desc + (it.xp ? ` +${it.xp} XP.` : ''), right, extra); };
    let out = lead(L('La comida y las manzanas se dan en la jaula de cada criatura (Criaderos › Alimentar). Aquí se usan las curas y las pociones.', 'Food and apples are given in each creature’s cage (Breeding Grounds › Feed). Healing items and potions are used here.'));
    if (usable.length) out += picker() + (c ? `<p class="lead">${L(`Se usan sobre <b>${c.name}</b>`, `Used on <b>${c.name}</b>`)} (${c.hp}/${G.hpMax(c)} ${PS()}).</p>` : noCreatures()) + usable.map((id) => itemRow(id, c ? `<button data-act="use" data-id="${id}">${L('Usar', 'Use')}</button>` : '')).join('');
    if (cage.length) out += `<h4 class="sec">${L('Para dar en la jaula', 'To give in the cage')}</h4>` + cage.map((id) => itemRow(id, '', 'dim')).join('');
    return out;
  }
  function eggRow(e) {
    const sp = G.speciesOf(e.species), left = G.eggLeft(e), ready = left <= 0;
    const apples = APPLES.filter((a) => have(a.id) && (!a.element || a.element === sp.element));
    const right = ready ? `<button data-act="hatch" data-id="${e.id}" class="big">${L('Eclosionar', 'Hatch')}</button>` :
      apples.map((a) => `<button data-act="warm" data-id="${e.id}|${a.id}" class="alt">${a.element ? L('Calentar', 'Warm') : L('Dorada', 'Golden')} (${have(a.id)})</button>`).join('') + clock(e.hatchAt);
    return `<div class="row"><div class="ic">${ICON.egg(css(ELEMENTS[sp.element].color), ready)}</div><div class="tx"><b>${eggOf(sp)}${ready ? ` <em>${L('¡listo!', 'ready!')}</em>` : ''}</b><small>${ready ? L('Ya puede eclosionar: tu criatura nacerá lista para entrenar y pelear.', 'It can hatch now: your creature will be born ready to train and fight.') : L('Se está incubando.', 'Incubating.')}</small>${bar(e.total - left, e.total, ready ? 'stat' : 'xp')}</div><div class="rt">${right}</div></div>`;
  }
  function viewHuevos() {
    const eggs = S().eggs;
    if (!eggs.length) return empty(L(`Tu incubadora está vacía (0/${G.eggSlots()}). Cada jaula de Criaderos vende el huevo de su especie; tarda 5 minutos en estar listo.`, `Your incubator is empty (0/${G.eggSlots()}). Each cage at the Breeding Grounds sells its species’ egg; it takes 5 minutes to be ready.`));
    return lead(L(`Incubadora: ${eggs.length}/${G.eggSlots()}. Cuando un huevo esté listo, eclosiónalo. Una manzana de su elemento (o la dorada) acorta la espera.`, `Incubator: ${eggs.length}/${G.eggSlots()}. When an egg is ready, hatch it. An apple of its element (or the golden one) shortens the wait.`)) + eggs.map(eggRow).join('');
  }
  // Progreso: la meta (Liga) y el Bestiario (todas las especies)
  function viewProgreso() {
    const st = S().stats, beaten = G.leagueBeaten(), n = G.dexCount(), next = LEAGUE[beaten];
    const goal = G.isChampion() ? L('<b>Campeón del Bestiario.</b> Ya tienes la corona: defiéndela en las revanchas y completa el Bestiario.', '<b>Bestiary Champion.</b> The crown is yours: defend it in rematches and complete the Bestiary.')
      : L(`<b>Próximo maestro:</b> ${next.name}, ${next.title} (${G.speciesOf(next.species).name.toLowerCase()}, nivel ${next.level}). Rétalo en la Zona de pelea, pestaña Liga.`, `<b>Next master:</b> ${next.name}, ${next.title} (${G.speciesOf(next.species).name}, level ${next.level}). Challenge them in the Arena, League tab.`);
    const dex = SPECIES.map((sp) => { const got = !!S().dex[sp.id]; return `<span class="dex${got ? ' got' : ''}" style="--c:${css(ELEMENTS[sp.element].color)}">${got ? '✓ ' : ''}${sp.name}</span>`; }).join('');
    return `<h4 class="sec">${L(`Liga del Bestiario · ${beaten}/${LEAGUE.length} emblemas`, `Bestiary League · ${beaten}/${LEAGUE.length} emblems`)}</h4>` + emblems() + `<p class="lead">${goal}</p>` +
      `<h4 class="sec">${L(`Bestiario · ${n}/${SPECIES.length} especies`, `Bestiary · ${n}/${SPECIES.length} species`)}</h4><div class="dexes">${dex}</div>` +
      lead(S().flags.dexDone ? L('Bestiario completo: ya cobraste el premio.', 'Bestiary complete: you’ve already claimed the prize.') : L(`Cada especie nueva que eclosiones cuenta. Al completar las ${SPECIES.length}: ${G.DEX_PRIZE} monedas y una manzana dorada.`, `Every new species you hatch counts. Complete all ${SPECIES.length}: ${G.DEX_PRIZE} coins and a golden apple.`)) +
      `<h4 class="sec">${L('Tu historia', 'Your story')}</h4>` + row(ICON.beast('#e8c05a'), `${L('Inicio', 'Start')}: ${(START_MODES.find((x) => x.id === S().mode) || { name: '—' }).name}`, L(`Combates ganados ${st.wins} · perdidos ${st.losses} · huevos eclosionados ${st.hatched}`, `Battles won ${st.wins} · lost ${st.losses} · eggs hatched ${st.hatched}`), '');
  }

  // ================================ MENÚ (pausa): ajustes, cómo jugar y partida ================================
  const menuTabs = () => [['ajustes', L('Ajustes', 'Settings')], ['ayuda', L('Cómo jugar', 'How to play')], ['partida', L('Partida', 'Game')]];
  const toggle = (key, on, label) => `<button data-act="setp" data-id="${key}" class="tgl${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="${label}"><i></i><span>${on ? L('Sí', 'On') : L('No', 'Off')}</span></button>`;
  const slider = (key, v, label) => `<input class="vol" type="range" min="0" max="100" step="5" value="${Math.round(v * 100)}" data-vol="${key}" aria-label="${label}">`;
  function viewAjustes() {
    const P = Sound.prefs(), q = QUALITY_PREF();
    const qb = (id, name) => `<button data-act="quality" data-id="${id}" class="chip-b${q === id ? ' sel' : ''}" style="--c:#9fd0ff">${name}</button>`;
    const lb = (id, name, full) => `<button data-act="lang" data-id="${id}" lang="${id}" aria-label="${full}" aria-pressed="${lang() === id}"${lang() === id ? ' class="sel"' : ''}>${name}</button>`;
    return `<div class="row"><div class="tx"><b>${L('Idioma', 'Language')}</b><small>${L('Vale para todos los juegos de JET//Games.', 'Applies to every game on JET//Games.')}</small></div><div class="rt"><div class="langseg" role="group" aria-label="${L('Idioma', 'Language')}">${lb('es', 'ES', 'Español')}${lb('en', 'EN', 'English')}</div></div></div>` +
      `<div class="row"><div class="tx"><b>${L('Música', 'Music')}</b><small>${L('Composición original: una pieza para el pueblo y otra para la arena.', 'Original score: one piece for the village and another for the arena.')}</small>${slider('musicVol', P.musicVol, L('Volumen de la música', 'Music volume'))}</div><div class="rt">${toggle('music', P.music, L('Música', 'Music'))}</div></div>` +
      `<div class="row"><div class="tx"><b>${L('Efectos de sonido', 'Sound effects')}</b><small>${L('Monedas, golpes, rugidos y huevos.', 'Coins, hits, roars and eggs.')}</small>${slider('sfxVol', P.sfxVol, L('Volumen de los efectos', 'Effects volume'))}</div><div class="rt">${toggle('sfx', P.sfx, L('Efectos de sonido', 'Sound effects'))}</div></div>` +
      `<div class="row"><div class="tx"><b>${L('Calidad gráfica', 'Graphics quality')}</b><small>${L('Automática elige según tu equipo. Baja va más fluida en teléfonos; alta muestra modelos y sombras más finos. Cambiarla recarga el juego; tu partida se conserva.', 'Automatic picks based on your device. Low runs more smoothly on phones; high shows finer models and shadows. Changing it reloads the game; your progress is kept.')}</small><div class="chipsel" style="margin-top:8px">${qb('auto', L('Automática', 'Automatic'))}${qb('baja', L('Baja', 'Low'))}${qb('alta', L('Alta', 'High'))}</div></div></div>` +
      lead(L('Todo se guarda en este dispositivo. La vista de cámara se cambia con el botón del ojo y el escenario con el de la montaña.', 'Everything is saved on this device. Change the camera view with the eye button and the scenery with the mountain button.'));
  }
  function viewAyuda() {
    if (isEn()) {
      const controlsEn = coarse
        ? '<p><b>Move.</b> Drag your finger across the screen: a joystick appears where you touch. <b>Camera.</b> The ↺ ↻ buttons rotate it; a second finger works too. <b>Talk or open a cage.</b> Walk up and tap the button that appears at the bottom. <b>Backpack.</b> The coins button.</p>'
        : '<p><b>Move.</b> WASD or arrow keys; Shift to run. You can also drag with the mouse. <b>Talk or open a cage.</b> Space or Enter. <b>Backpack.</b> B. <b>View.</b> C switches the camera; Q / E rotate it; the mouse wheel zooms in and out. <b>Full screen.</b> F. <b>Menu.</b> Esc. <b>Battle.</b> Keys 1 to 6; V speeds it up.</p>';
      return `<div class="tips"><p><b>The goal.</b> Become the Bestiary Champion: defeat the ${LEAGUE.length} League masters in the Arena, north of the village. And complete the Bestiary with all ${SPECIES.length} species.</p>
      <p><b>1. Eggs.</b> At the Breeding Grounds, to the east, each cage sells its species’ egg. It takes 5 minutes to incubate, even with the game closed. Open it from the Backpack.</p>
      <p><b>2. Raising.</b> Feed your creature in its cage: food gives experience and levels. Apples of its element teach it powers and change its look.</p>
      <p><b>3. Gym.</b> To the west. Stop the marker in the green zone to raise strength, vitality, agility or magic. Practice with the dummy has no risk.</p>
      <p><b>4. Battle.</b> Turn-based. Fire beats air, air beats earth, earth beats water and water beats fire. Today’s rivals give coins so you can keep growing.</p>
      <p><b>5. Infirmary and Shop.</b> To the south. Heal wounds and conditions; buy food, potions, apples and looks. Loose coins around the village reappear over time.</p>
      <p><b>Combine.</b> Two creatures of the same species merge into a stronger one, from their cage.</p></div>
      <h4 class="sec">Controls</h4><div class="tips">${controlsEn}</div>`;
    }
    const controls = coarse
      ? '<p><b>Mover.</b> Arrastra el dedo por la pantalla: aparece un joystick donde lo apoyas. <b>Cámara.</b> Los botones ↺ ↻ de abajo la giran; con un segundo dedo también. <b>Hablar o abrir una jaula.</b> Acércate y toca el botón que aparece abajo. <b>Mochila.</b> El botón de las monedas.</p>'
      : '<p><b>Mover.</b> WASD o flechas; Mayús para correr. También puedes arrastrar con el ratón. <b>Hablar o abrir una jaula.</b> Espacio o Intro. <b>Mochila.</b> B. <b>Vista.</b> C cambia la cámara; Q / E giran; la rueda acerca y aleja. <b>Pantalla completa.</b> F. <b>Menú.</b> Esc. <b>Combate.</b> Teclas 1 a 6; V acelera.</p>';
    return `<div class="tips"><p><b>La meta.</b> Conviértete en Campeón del Bestiario: vence a los ${LEAGUE.length} maestros de la Liga en la Zona de pelea, al norte del pueblo. Y completa el Bestiario con las ${SPECIES.length} especies.</p>
      <p><b>1. Huevos.</b> En Criaderos, al este, cada jaula vende el huevo de su especie. Tarda 5 minutos en incubarse, también con el juego cerrado. Ábrelo desde la Mochila.</p>
      <p><b>2. Crianza.</b> Alimenta a tu criatura en su jaula: la comida da experiencia y nivel. Las manzanas de su elemento le enseñan poderes y cambian su aspecto.</p>
      <p><b>3. Gimnasio.</b> Al oeste. Detén la marca en la zona verde para subir fuerza, vitalidad, agilidad o magia. La Práctica con el muñeco no tiene riesgo.</p>
      <p><b>4. Combate.</b> Por turnos. Fuego vence a aire, aire a tierra, tierra a agua y agua a fuego. Los rivales del día dan monedas para seguir creciendo.</p>
      <p><b>5. Enfermería y Tienda.</b> Al sur. Cura heridas y estados; compra comida, pociones, manzanas y aspectos. Las monedas sueltas del pueblo vuelven a aparecer con el tiempo.</p>
      <p><b>Combinar.</b> Dos criaturas de la misma especie se fusionan en una más fuerte, desde su jaula.</p></div>
      <h4 class="sec">Controles</h4><div class="tips">${controls}</div>`;
  }
  const exitRow = () => `<div class="row"><div class="tx"><b>${L('Salir a JET//Games', 'Back to JET//Games')}</b><small>${L('Tu partida queda guardada en este dispositivo para cuando vuelvas.', 'Your game stays saved on this device for when you come back.')}</small></div><div class="rt"><a class="btnlink" href="https://jetgames.fun/" target="_top" rel="noopener">‹ JET//Games</a></div></div>`;
  function viewPartida() {
    const m = START_MODES.find((x) => x.id === S().mode);
    const modesTxt = L('Elige entre Primeros pasos, Domador o Maestro del criadero.', 'Choose First Steps, Tamer or Breeding Master.');
    if (!G.hasGame()) return lead(L('Aún no has empezado una partida.', 'You haven’t started a game yet.')) + `<div class="row"><div class="tx"><b>${L('Empezar', 'Start')}</b><small>${modesTxt}</small></div><div class="rt"><button data-act="newgo">${L('Elegir inicio', 'Choose a start')}</button></div></div>` + exitRow();
    const nR = S().roster.length, loss = L(`${nR} ${nR === 1 ? 'criatura' : 'criaturas'}, ${S().coins} monedas, tus emblemas y todos los objetos`, `${nR} ${nR === 1 ? 'creature' : 'creatures'}, ${S().coins} coins, your emblems and every item`);
    return row(ICON.beast(m ? m.color : '#888'), `${L('Inicio', 'Start')}: ${m ? m.name : '—'}`, L(`Emblemas ${G.leagueBeaten()}/${LEAGUE.length} · Bestiario ${G.dexCount()}/${SPECIES.length} · ${S().stats.wins} combates ganados`, `Emblems ${G.leagueBeaten()}/${LEAGUE.length} · Bestiary ${G.dexCount()}/${SPECIES.length} · ${S().stats.wins} battles won`), '') +
      lead(L('La partida se guarda sola en este dispositivo después de cada acción. Puedes empezar otra desde cero con cualquiera de los tres inicios.', 'Your game saves itself on this device after every action. You can start a new one from scratch with any of the three starts.')) +
      `<div class="row"><div class="tx"><b>${L('Empezar otra partida', 'Start another game')}</b><small>${modesTxt} ${L(`Tu partida actual (${loss}) no se borra hasta que confirmes el nuevo inicio.`, `Your current game (${loss}) isn’t deleted until you confirm the new start.`)}</small></div><div class="rt"><button data-act="newgo">${L('Nueva partida', 'New game')}</button></div></div>` + exitRow();
  }

  // ============================ ELECCIÓN DE INICIO ============================
  function viewInicio() {
    const warn = replacing && G.hasGame() ? `<p class="lead empty">${L('Elige un inicio. Antes de reemplazar tu partida actual se pedirá confirmación; si te arrepientes, vuelve a tu partida.', 'Choose a start. You will be asked to confirm before your current game is replaced; if you change your mind, go back to your game.')}</p>` : '';
    if (pendingStart && G.hasGame()) {
      const pm = START_MODES.find((x) => x.id === pendingStart);
      return `<div class="row gold"><div class="tx"><b>${L('Reemplazar partida actual', 'Replace current game')}</b><small>${L(`Nuevo inicio: ${pm ? pm.name : pendingStart}. Se perderán ${lossText()}. Esta acción no se puede deshacer.`, `New start: ${pm ? pm.name : pendingStart}. You’ll lose ${lossText()}. This cannot be undone.`)}</small></div><div class="rt"><button data-act="startcancel" class="alt" data-autofocus>${L('Cancelar', 'Cancel')}</button><button data-act="startok" class="danger" data-id="${pendingStart}">${L('Borrar y empezar', 'Delete and start')}</button></div></div>`;
    }
    return lead(L(`Tu meta: vencer a los ${LEAGUE.length} maestros de la Liga y coronarte Campeón del Bestiario. Las criaturas nacen de huevos que se compran en Criaderos y tardan 5 minutos en eclosionar.`, `Your goal: defeat the ${LEAGUE.length} League masters and be crowned Bestiary Champion. Creatures hatch from eggs bought at the Breeding Grounds, which take 5 minutes to hatch.`)) + warn +
      `<div class="modes">${START_MODES.map((m) => `<div class="mode" style="--c:${m.color}"><h3>${m.name}</h3><small>${m.tag}</small><ul>${m.bullets.map((b) => `<li>${b}</li>`).join('')}</ul><button data-act="startmode" data-id="${m.id}">${L('Empezar', 'Start')}</button></div>`).join('')}</div>` +
      (G.hasGame() ? `<div class="backgame"><button data-act="backgame">${L('Volver a mi partida', 'Back to my game')}</button></div>` : '');
  }

  const VIEWS = {
    tienda: { title: () => L('Tienda', 'Shop'), css: '#e8c05a', tabs: tiendaTabs, view: { comida: viewComida, manzanas: viewManzanas, ofertas: viewOfertas, aspectos: viewAspectos, vender: viewVender } },
    enfermeria: { title: () => L('Enfermería', 'Infirmary'), css: '#e0607f', tabs: enfTabs, view: { curar: viewCurar, camillas: viewCamillas, estados: viewEstados, pociones: viewPociones, botiquines: viewBotiquines } },
    gimnasio: { title: () => L('Gimnasio', 'Gym'), css: '#f0a23a', tabs: gymTabs, view: { entrenar: viewEntrenar, sparring: viewSparring, consejos: viewConsejos } },
    criadero: { title: () => L('Criadero', 'Breeding Grounds'), css: '#5fd6a4', tabs: critTabs, view: { ficha: viewFicha, alimentar: viewAlimentar, huevo: viewHuevo, combinar: viewCombinar } },
    mochila: { title: () => L('Mochila', 'Backpack'), css: '#9fd0ff', tabs: bagTabs, view: { criaturas: viewCriaturas, objetos: viewObjetos, huevos: viewHuevos, progreso: viewProgreso } },
    menu: { title: () => L('Menú', 'Menu'), css: '#b98cff', tabs: menuTabs, view: { ajustes: viewAjustes, ayuda: viewAyuda, partida: viewPartida } },
    pelea: { title: () => L('Zona de pelea', 'Arena'), css: '#ff5a3c', tabs: peleaTabs, view: { liga: viewLiga, pelear: viewPelear, reglas: viewReglas } },
    inicio: { title: () => (replacing && G.hasGame() ? L('Elegir nueva partida', 'Choose a new game') : L('JET//Bestiario', 'JET//Bestiary')), css: '#e8c05a', tabs: () => [], view: { inicio: viewInicio } },
  };
  const canClose = () => !(ctx && ctx.kind === 'inicio' && !G.hasGame());

  function render() {
    coinsN.textContent = S().coins; updateBadge();
    if (!ctx) return;
    const V = VIEWS[ctx.kind];
    // el foco del teclado y el desplazamiento sobreviven al repintado
    const ae = document.activeElement, keep = ae && modal.contains(ae) && ae.dataset && ae.dataset.act ? { act: ae.dataset.act, id: ae.dataset.id || '' } : null, tabX = tabsEl.scrollLeft;
    const title = ctx.kind === 'criadero' && ctx.species ? cageOf(ctx.species) : V.title();
    $('mtitle').textContent = title; $('mdot').style.background = V.css; $('mdot').style.color = V.css;
    $('mwho').textContent = ctx.kind === 'inicio' ? '' : ctx.kind === 'menu' ? L('Juego en pausa', 'Game paused') : ctx.npc ? `${ctx.npc.def.name} · ${ctx.npc.def.title}` : ctx.species ? L(`${ctx.species.name} · elemento ${elementName(ctx.species.element).toLowerCase()}`, `${ctx.species.name} · ${elementName(ctx.species.element).toLowerCase()} element`) : ctx.kind === 'mochila' ? L('Tus cosas', 'Your things') : ctx.kind === 'pelea' ? L('Garrick · Maestro de la arena', 'Garrick · Master of the arena') : '';
    $('mcoins').innerHTML = `${price(S().coins)}`;
    $('mclose').style.display = canClose() ? '' : 'none';
    tabsEl.innerHTML = V.tabs().map(([id, name]) => `<button role="tab" aria-selected="${ctx.tab === id}" data-act="tab" data-id="${id}"${ctx.tab === id ? ' class="sel"' : ''}>${name}${tabBadge(ctx.kind, id)}</button>`).join('');
    tabsEl.scrollLeft = tabX;
    const st = tabsEl.querySelector('.sel');   // la pestaña activa siempre queda a la vista
    if (st) { const l = st.offsetLeft, r = l + st.offsetWidth; if (r > tabsEl.scrollLeft + tabsEl.clientWidth) tabsEl.scrollLeft = r - tabsEl.clientWidth + 8; else if (l < tabsEl.scrollLeft) tabsEl.scrollLeft = Math.max(0, l - 8); }
    const top = body.scrollTop;
    body.innerHTML = mg ? viewMinigame() : (V.view[ctx.tab] || (() => ''))();
    body.scrollTop = top;
    applyConfirm();
    mountPreview();
    if (keep) { const n = [...modal.querySelectorAll('[data-act]')].find((x) => x.dataset.act === keep.act && (x.dataset.id || '') === keep.id && !x.disabled); if (n) n.focus({ preventScroll: true }); }
  }
  // insignia en el botón de monedas: huevos listos para eclosionar
  const badgeEl = $('coins-badge');
  function updateBadge() {
    const n = S().eggs.filter((e) => G.eggReady(e)).length;
    badgeEl.hidden = !n; badgeEl.textContent = n || '';
    coinsEl.setAttribute('aria-label', L(`Mochila y monedas (B)${n ? `: ${n} ${n === 1 ? 'huevo listo' : 'huevos listos'}` : ''}`, `Backpack and coins (B)${n ? `: ${n} ${n === 1 ? 'egg ready' : 'eggs ready'}` : ''}`));
  }
  function mountPreview() {
    const slot = document.getElementById('pv-slot');
    if (!slot) { preview.stop(); return; }
    const sp = SPECIES.find((s) => s.id === (ctx.kind === 'criadero' ? ctx.species.id : pv.species));
    if (ctx.kind === 'criadero' && pv.species !== sp.id) pv = { species: sp.id, form: 'base' };
    if (sp.model) preview.show(slot, sp.id, pv.form); else preview.stop();
  }
  // numerito en las pestañas: huevos listos para eclosionar
  function tabBadge(kind, id) {
    if (kind === 'mochila' && id === 'huevos') { const n = S().eggs.filter((e) => G.eggReady(e)).length; return n ? ` <span class="badge">${n}</span>` : ''; }
    return '';
  }

  function open(kind, npc = null, tab = null, species = null) {
    if (mg) { cancelAnimationFrame(mg.raf); mg = null; }
    ctx = { kind, npc, species, tab: tab || VIEWS[kind].tabs()[0]?.[0] || kind };
    confirmNew = false; pendingStart = null; pendingFuse = null;
    modal.hidden = false; document.body.classList.add('modal-open'); Sound.sfx('open');
    msg.textContent = npc ? npc.line : ''; msg.className = 'say'; autoClear();
    card.style.setProperty('--accent', VIEWS[kind].css);
    opener = document.activeElement;
    setInert(true);
    render(); body.scrollTop = 0;
    const f = tabsEl.querySelector('.sel'); if (f) f.focus({ preventScroll: true });
  }
  function close() {
    if (!ctx || !canClose()) return;
    if (mg) { cancelAnimationFrame(mg.raf); mg = null; }
    ctx = null; modal.hidden = true; document.body.classList.remove('modal-open'); preview.stop();
    setInert(false); replacing = false; pendingStart = null; pendingFuse = null;
    if (opener && opener.isConnected && opener.getClientRects().length) { try { opener.focus({ preventScroll: true }); } catch (e) { /* sin foco */ } }
    opener = null;
  }
  // mientras hay un menú abierto, lo de detrás no recibe foco ni toques
  const BG = ['labels', 'zone', 'rot', 'coins', 'goal', 'act', 'esc', 'esc-panel', 'cam', 'cam-panel', 'fs', 'hint', 'menu', 'title'].map($);
  function setInert(on) { for (const x of BG) if (x) { if (on) x.setAttribute('inert', ''); else x.removeAttribute('inert'); } if (hooks.afterInert) hooks.afterInert(); }

  modal.addEventListener('pointerdown', (e) => { if (e.target === modal) close(); });
  $('mclose').addEventListener('click', close);
  addEventListener('keydown', (e) => {
    if (e.code === 'Escape') { if (mg) { cancelAnimationFrame(mg.raf); mg = null; render(); } else if (ctx) close(); else if (hooks.escMenu) hooks.escMenu(); }
    if ((e.code === 'Space' || e.code === 'Enter') && mg && !(e.target.dataset && e.target.dataset.act === 'mgcancel')) { e.preventDefault(); stopMinigame(); }
  });
  modal.addEventListener('pointerdown', () => { pointerDown = true; }, true);
  addEventListener('pointerup', () => { pointerDown = false; }, true);
  addEventListener('pointercancel', () => { pointerDown = false; }, true);
  body.addEventListener('toggle', (e) => { if (e.target.matches && e.target.matches('details.lead')) leadOpen = e.target.open; }, true);
  addEventListener('resize', () => { if (ctx && !mg) render(); });   // al girar la pantalla se vuelve a elegir entre explicación abierta o plegada

  // acciones de los botones (delegación)
  modal.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    if (performance.now() - lastMg < 350) return;   // el toque que detuvo el ejercicio no vale como otro clic
    const id = b.dataset.id || '';
    if (b.dataset.confirm) {   // compras caras: el primer toque pide confirmación y el segundo las ejecuta
      const key = b.dataset.act + ':' + id;
      if (confirmKey !== key) { confirmKey = key; clearTimeout(confirmT); confirmT = setTimeout(() => { confirmKey = null; render(); }, 3500); applyConfirm(); return; }
      confirmKey = null; clearTimeout(confirmT);
    }
    switch (b.dataset.act) {
      case 'lang': setLang(id); break;   // el evento 'jet-idioma' repinta todo (ver onLang al final)
      case 'tab': ctx.tab = id; msg.textContent = ''; msg.className = ''; Sound.sfx('click'); render(); break;
      case 'setp': Sound.set(id, !Sound.prefs()[id]); Sound.sfx('click'); render(); break;
      case 'quality': if (QUALITY_PREF() !== id) { try { localStorage.setItem('criaturas.calidad', id); } catch (err) { /* sin almacenamiento */ } const u = new URL(location.href); u.searchParams.delete('calidad'); location.href = u.toString(); } break;
      case 'fightL': { const c = creature(); if (!c || !hooks.fight) break; const [i, rm] = id.split('|'); const r = leagueRival(+i, c.level, rm === '1'); const nn = ctx.npc; close(); hooks.fight(c.id, r, nn); break; }
      case 'buy': done(G.buyItem(ITEM_INDEX.get(id))); break;
      case 'buyOffer': done(G.buyOffer(id)); break;
      case 'sell': { const [i, n] = id.split('|'); done(G.sellItem(i, +n)); break; }
      case 'skintab': skinTab = id; render(); break;
      case 'buyP': { const r = done(G.buyPlayerSkin(PLAYER_SKINS.find((k) => k.id === id))); if (r.ok) onSkins(); break; }
      case 'equipP': done(G.equipPlayerSkin(id)); onSkins(); break;
      case 'heal': done(G.healCreature(id)); break;
      case 'admit': done(G.admit(id)); break;
      case 'cureDoc': { const [c, st] = id.split('|'); done(G.cureStatus(c, st, null, 25)); break; }
      case 'cureItem': { const [c, st, it] = id.split('|'); done(G.cureStatus(c, st, it)); break; }
      case 'selc': sel = +id; render(); break;
      case 'train': startMinigame(id); break;
      case 'mgstop': stopMinigame(); break;
      case 'mgcancel': if (mg) { cancelAnimationFrame(mg.raf); mg = null; render(); } break;
      case 'spar': if (hooks.sparring) { const nn = ctx.npc; close(); hooks.sparring(id, nn); } else flash(L('La práctica se abre en cuanto esté listo el combate.', 'Practice opens as soon as the battle is ready.'), false); break;
      case 'fight': { const c = creature(); if (!c || !hooks.fight) break; const ids = SPECIES.filter((s) => s.model).map((s) => s.id); const r = rivalsFor(c.level, G.dayKey(), ids)[+id]; const nn = ctx.npc; close(); hooks.fight(c.id, r, nn); break; }
      case 'pvform': pv = { ...pv, form: id }; render(); break;
      case 'pvsp': pv = { species: id, form: 'base' }; render(); break;
      case 'buyForm': { const r = done(G.buyForm(id)); if (r.ok) onSkins(); break; }
      case 'setform': { const [cid, fm] = id.split('|'); const r = done(G.setForm(cid, fm)); if (r.ok) onSkins(); break; }
      case 'feedsel': feedSel = +id; render(); break;
      case 'feedn': { const [cid, iid, cnt] = id.split('|'); let last = null, ok = 0; for (let k = 0; k < +cnt; k++) { const r = G.useItem(iid, cid); if (!r.ok) { if (!ok) last = r; break; } last = r; ok++; } if (last) { done(ok > 1 ? { ok: true, msg: `${L(`${ok} comidas seguidas.`, `${ok} meals in a row.`)} ${last.msg}` } : last); if (ok) { onSkins(); if (onFeed) onFeed(ctx.species.id); } } break; }
      case 'feed': { const [cid, iid] = id.split('|'); const r = done(G.useItem(iid, cid)); if (r.ok) { onSkins(); if (onFeed) onFeed(ctx.species.id); } break; }
      case 'buyEgg': done(G.buyEgg(id)); break;
      case 'warm': { const [eg, ap] = id.split('|'); done(G.warmEgg(eg, ap)); break; }
      case 'hatch': { const r = done(G.hatchEgg(id)); if (r.ok) { Sound.sfx('hatch'); sel = S().roster.findIndex((c) => c === r.creature); } break; }
      case 'fuse': pendingFuse = id; Sound.sfx('click'); render(); focusAuto(); break;
      case 'fusecancel': pendingFuse = null; render(); break;
      case 'fuseok': { if (pendingFuse !== id) break; pendingFuse = null; b.disabled = true; const [a, c2] = id.split('|'); done(G.fuse(a, c2)); render(); break; }
      case 'use': { const c = creature(); if (!c) { flash(L('Primero necesitas una criatura.', 'You need a creature first.'), false); break; } done(G.useItem(id, c.id)); break; }
      case 'newask': confirmNew = true; render(); break;
      case 'newno': confirmNew = false; render(); break;
      case 'newgo': confirmNew = false; replacing = true; open('inicio'); replacing = true; render(); break;   // la partida actual no se borra hasta elegir un inicio
      case 'backgame': close(); break;
      case 'startmode': if (G.hasGame()) { pendingStart = id; Sound.sfx('click'); render(); focusAuto(); break; }   // con progreso: confirmar antes de reemplazar
        pendingStart = null; G.startGame(id); onNewGame(); ctx = { ...ctx, kind: 'mochila' }; close(); Sound.sfx('ok'); say(L(`Partida nueva: ${START_MODES.find((m) => m.id === id).name}.`, `New game: ${START_MODES.find((m) => m.id === id).name}.`)); break;
      case 'startcancel': pendingStart = null; render(); break;
      case 'startok': { if (pendingStart !== id) break; pendingStart = null; b.disabled = true; G.startGame(id); onNewGame(); ctx = { ...ctx, kind: 'mochila' }; close(); Sound.sfx('ok'); say(L(`Partida nueva: ${START_MODES.find((m) => m.id === id).name}.`, `New game: ${START_MODES.find((m) => m.id === id).name}.`)); break; }
    }
  });

  modal.addEventListener('input', (e) => { const k = e.target.dataset && e.target.dataset.vol; if (k) Sound.set(k, +e.target.value / 100); });
  modal.addEventListener('change', (e) => { if (e.target.dataset && e.target.dataset.vol) Sound.sfx(e.target.dataset.vol === 'sfxVol' ? 'coin' : 'click'); });
  G.onChange(() => { if (!mg) render(); else coinsN.textContent = S().coins; });
  const locked = () => !!(hooks.locked && hooks.locked());   // con un combate en marcha no se abre la Mochila
  coinsEl.addEventListener('click', () => { if (locked()) return; if (ctx && ctx.kind === 'mochila') close(); else if (!ctx) open('mochila'); });
  addEventListener('keydown', (e) => { if (e.code === 'KeyB' && !e.repeat && !e.ctrlKey && !e.metaKey) { if (locked()) return; if (ctx && ctx.kind === 'mochila') close(); else if (!ctx && G.hasGame()) open('mochila'); } });
  // cuentas regresivas vivas (huevos y camillas): cambian solo su texto, para no perder clics ni el foco; se repinta cuando algo termina
  setInterval(() => {
    updateBadge();
    if (!ctx || mg) return;
    let expired = false;
    for (const x of body.querySelectorAll('[data-until]')) { const ms = +x.dataset.until - Date.now(); x.textContent = (x.dataset.prefix || '') + fmtTime(ms); if (ms <= 0) expired = true; }
    if (expired && !pointerDown) render();
  }, 1000);
  render();
  // cambio de idioma en vivo: se repinta la ventana abierta tal como está (pestaña, criatura elegida, ejercicio en curso)
  onLang(() => {
    render();
    if (ctx && ctx.npc && msg.classList.contains('say')) msg.textContent = ctx.npc.def.lines[ctx.npc.say] || '';
  });

  return {
    isOpen: () => !!ctx,
    open, close, render, hooks,
    openNpc(npc, line, tab) { npc.line = line; open(npc.def.zone, npc, tab || npc.def.tab); },
    hasGame: () => G.hasGame(),
    openCage(species) { open('criadero', null, 'ficha', species); },
    openInicio() { open('inicio'); },
    openBag(tab) { open('mochila', null, tab || 'criaturas'); },
    openMenu(tab) { open('menu', null, tab || 'ajustes'); },
    newGame() { if (G.hasGame()) { replacing = true; open('inicio'); replacing = true; render(); } else open('inicio'); },
  };
}
