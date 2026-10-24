import { bi, biAll, L as L_ } from './i18n.js';

// Datos del combate por turnos: nombres de ataques, rasgos de cada especie, ventajas entre elementos y rivales de la arena.

// ciclo de elementos: cada uno vence al siguiente (×1,5) y pierde contra el anterior (×0,7)
export const BEATS = { fuego: 'aire', aire: 'tierra', tierra: 'agua', agua: 'fuego' };
export function elementMul(att, def) {
  if (!att || !def || att === def) return 1;
  if (BEATS[att] === def) return 1.5;
  if (BEATS[def] === att) return 0.7;
  return 1;
}

// nombre del golpe y del ataque elemental de cada especie, más sus rasgos (ver Battle en battle.js)
export const MOVES = {
  dragon: { strike: 'Zarpazo', special: 'Llamarada', en: { strike: 'Claw Swipe', special: 'Flame Burst' }, traits: { elemBoost: 0.4, crit: 0.1 } },
  fenix: { strike: 'Picotazo', special: 'Plumas ardientes', en: { strike: 'Peck', special: 'Burning Plumes' }, traits: { revive: 0.15 } },
  felino: { strike: 'Zarpazo', special: 'Aliento de brasa', en: { strike: 'Claw Swipe', special: 'Ember Breath' }, traits: { crit: 0.2 } },
  quimera: { strike: 'Triple embestida', special: 'Fuego de la quimera', en: { strike: 'Triple Charge', special: 'Chimera Fire' }, traits: { double: true } },
  cerbero: { strike: 'Triple mordida', special: 'Aullido ardiente', en: { strike: 'Triple Bite', special: 'Blazing Howl' }, traits: { triple: true } },
  'serpiente-aguila': { strike: 'Mordisco', special: 'Marejada', en: { strike: 'Bite', special: 'Tidal Surge' }, traits: { venom: 0.25 } },
  'serpiente-aguila-fuego': { strike: 'Mordisco ardiente', special: 'Aliento de brasa', en: { strike: 'Searing Bite', special: 'Ember Breath' }, traits: { venom: 0.12, elemBoost: 0.1 } },
  unicornio: { strike: 'Cornada', special: 'Luz de nácar', en: { strike: 'Horn Thrust', special: 'Pearl Light' }, traits: { regen: 0.025 } },
  pegaso: { strike: 'Coz', special: 'Tormenta', en: { strike: 'Hind Kick', special: 'Storm' }, traits: { dodge: 0.1, elemBoost: 0.08 } },
  hipogrifo: { strike: 'Garra', special: 'Ráfaga', en: { strike: 'Talon', special: 'Gust' }, traits: { dodge: 0.12, crit: 0.08 } },
  grifo: { strike: 'Garra', special: 'Vendaval', en: { strike: 'Talon', special: 'Gale' }, traits: { dodge: 0.08, crit: 0.1 } },
  duende: { strike: 'Puñalada', special: 'Raíces trepadoras', en: { strike: 'Stab', special: 'Creeping Roots' }, traits: { dodge: 0.12, crit: 0.12 } },
  ogro: { strike: 'Mazazo', special: 'Temblor', en: { strike: 'Club Smash', special: 'Quake' }, traits: { armor: 0.18 } },
  minotauro: { strike: 'Hachazo', special: 'Estampida', en: { strike: 'Axe Blow', special: 'Stampede' }, traits: { strikeBoost: 0.15, crit: 0.12 } },
  ciclope: { strike: 'Martillazo', special: 'Mirada de piedra', en: { strike: 'Hammer Blow', special: 'Stone Gaze' }, traits: { armor: 0.15, fear: 0.25 } },
  gigante: { strike: 'Pisotón', special: 'Avalancha', en: { strike: 'Stomp', special: 'Avalanche' }, traits: { armor: 0.15, slow: true } },
  orcos: { strike: 'Carga de la horda', special: 'Grito de guerra', en: { strike: 'Horde Charge', special: 'War Cry' }, traits: { strikeBoost: 0.2, armor: 0.1 } },
};
for (const k of Object.keys(MOVES)) bi(MOVES[k]);

// manzanas lanzables en combate (de las notas): fuego = bola de fuego; agua = charco con tiburón (1/4 de la vida restante);
// aire = bola que quita 50 y hace perder un turno; tierra = picos que quitan 100; dorada = cura total.
export const APPLE_MOVES = {
  'manzana-fuego': { name: 'Bola de fuego', desc: 'Daño de fuego y 40 % de quemar.', en: { name: 'Fireball', desc: 'Fire damage and a 40 % chance to burn.' } },
  'manzana-agua': { name: 'Charco con tiburón', desc: 'Quita 1/4 de la vida restante del rival.', en: { name: 'Shark Pool', desc: 'Takes 1/4 of the rival’s remaining health.' } },
  'manzana-aire': { name: 'Bola de viento', desc: 'Quita 50 y el rival pierde un turno.', en: { name: 'Wind Ball', desc: 'Takes 50 and the rival loses a turn.' } },
  'manzana-tierra': { name: 'Picos de tierra', desc: 'Quitan 100 de golpe.', en: { name: 'Earth Spikes', desc: 'Take 100 in one blow.' } },
  'manzana-dorada': { name: 'Brillo dorado', desc: 'Curas toda tu vida y los estados.', en: { name: 'Golden Glow', desc: 'Restores all your health and clears every condition.' } },
};
for (const k of Object.keys(APPLE_MOVES)) bi(APPLE_MOVES[k]);

// rivales de la arena: cuatro dificultades respecto al nivel de tu criatura
export const TIERS = [
  { id: 'facil', name: 'Aprendiz', en: { name: 'Apprentice' }, dLevel: -2, mul: 0.8, xpMul: 0.7, train: 0, color: '#5fd6a4' },
  { id: 'parejo', name: 'Retador', en: { name: 'Challenger' }, dLevel: 0, mul: 1.0, xpMul: 1, train: 0.1, color: '#e8c05a' },
  { id: 'dificil', name: 'Veterano', en: { name: 'Veteran' }, dLevel: 3, mul: 1.5, xpMul: 1.25, train: 0.25, color: '#f0a23a' },
  { id: 'jefe', name: 'Jefe de la arena', en: { name: 'Arena Boss' }, dLevel: 6, mul: 2.2, xpMul: 1.6, train: 0.45, color: '#e0607f' },
];
biAll(TIERS);

function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// los rivales cambian cada día; la especie sale de una lista fija barajada por la fecha
export function rivalsFor(playerLevel, dayKey, speciesIds) {
  return TIERS.map((t, i) => {
    const sid = speciesIds[hash(`${dayKey}|${t.id}`) % speciesIds.length];
    return { tier: t, species: sid, level: Math.max(1, playerLevel + t.dLevel), mul: t.mul, slot: i };
  });
}

// recompensas de una victoria
export function rewardFor(rival, rnd = Math.random) {
  const L = rival.level, m = rival.mul;
  const drops = {};
  const r = rnd();
  if (r < 0.3 + (rival.tier.id === 'jefe' || rival.boss ? 0.3 : 0)) drops[['granos', 'bayas', 'pescado', 'carne', 'medula'][Math.min(4, Math.floor(rnd() * (2 + m * 1.2)))]] = 1;
  if (rnd() < (rival.tier.id === 'jefe' || rival.boss ? 0.45 : 0.12)) drops['manzana-' + (rival.element || 'fuego')] = 1;
  return { coins: Math.round((18 + L * 10) * m * (0.85 + rnd() * 0.3)), xp: Math.round((22 + L * 12) * (rival.tier.xpMul || 1)), drops };
}

// ---------------------------------------------------------------- Liga del Bestiario ----------------------------------------------------------------
// La meta de la partida: ocho maestros en orden, cada uno con su criatura y su emblema. Quien vence a Garrick, el último,
// es Campeón del Bestiario. Niveles fijos (la primera vez); las revanchas se ajustan a tu criatura. `train`: tramo del camino
// hasta el tope de entrenamiento; `apples`: manzanas comidas (poderes); `prize`: monedas y objeto de la primera victoria.
export const LEAGUE = [
  { id: 'lia', name: 'Lía Cardo', title: 'la jardinera', species: 'duende', beast: 'Zarzal', level: 3, apples: 0, train: 0.05, prize: 120, item: ['kit-s', 2], emblem: 'Emblema de raíz', color: '#8a7a3a',
    line: 'Mi duende parece pequeño. Por eso nadie lo ve venir.',
    en: { title: 'the gardener', beast: 'Bramble', emblem: 'Root Emblem', line: 'My goblin looks small. That’s why no one sees it coming.' } },
  { id: 'tome', name: 'Tomé Salitre', title: 'el barquero', species: 'unicornio', beast: 'Nácar', level: 6, apples: 0, train: 0.1, prize: 200, item: ['carne', 3], emblem: 'Emblema de marea', color: '#3a8fd0',
    line: 'El río se lleva a los que pelean con prisa.',
    en: { title: 'the boatman', beast: 'Pearl', emblem: 'Tide Emblem', line: 'The river carries off those who fight in a hurry.' } },
  { id: 'nadia', name: 'Nadia Vela', title: 'la cetrera', species: 'hipogrifo', beast: 'Ráfaga', level: 9, apples: 1, train: 0.15, prize: 300, item: ['furia', 1], emblem: 'Emblema de pluma', color: '#b8dff0',
    line: 'Ráfaga no espera turno. Tú tampoco deberías.',
    en: { title: 'the falconer', beast: 'Gust', emblem: 'Feather Emblem', line: 'Gust doesn’t wait its turn. Neither should you.' } },
  { id: 'osvaldo', name: 'Osvaldo Brasa', title: 'el herrero', species: 'felino', beast: 'Hollín', level: 12, apples: 1, train: 0.2, prize: 420, item: ['medula', 2], emblem: 'Emblema de yunque', color: '#e0502a',
    line: 'Lo forjé en mi fragua. No se enfría nunca.',
    en: { title: 'the blacksmith', beast: 'Soot', emblem: 'Anvil Emblem', line: 'I forged it in my smithy. It never cools down.' } },
  { id: 'irene', name: 'Irene Hondo', title: 'la buzo', species: 'serpiente-aguila', beast: 'Fondo', level: 15, apples: 2, train: 0.25, prize: 560, item: ['kit-m', 2], emblem: 'Emblema de abismo', color: '#2a6fb0',
    line: 'Abajo del lago no llega la luz. Fondo nació ahí.',
    en: { title: 'the diver', beast: 'Abyss', emblem: 'Abyss Emblem', line: 'Light never reaches the bottom of the lake. Abyss was born there.' } },
  { id: 'ciro', name: 'Ciro Ventisca', title: 'el pastor de nubes', species: 'grifo', beast: 'Cumbre', level: 18, apples: 3, train: 0.3, prize: 720, item: ['manzana-dorada', 1], emblem: 'Emblema de tormenta', color: '#9ec8e0',
    line: 'Desde la cumbre todo se ve pequeño. Hasta tu criatura.',
    en: { title: 'the cloud shepherd', beast: 'Summit', emblem: 'Storm Emblem', line: 'From the summit everything looks small. Even your creature.' } },
  { id: 'hugo', name: 'Hugo Peñasco', title: 'el cantero', species: 'gigante', beast: 'Morrena', level: 21, apples: 3, train: 0.35, prize: 900, item: ['corazon', 1], emblem: 'Emblema de montaña', color: '#7a6a3a',
    line: 'Morrena no corre. No le hace falta.',
    en: { title: 'the stonecutter', beast: 'Moraine', emblem: 'Mountain Emblem', line: 'Moraine doesn’t run. It doesn’t need to.' } },
  { id: 'garrick', name: 'Garrick', title: 'maestro de la arena', species: 'dragon', beast: 'Brasanegra', level: 24, apples: 4, train: 0.4, prize: 1500, item: ['corazon', 2], emblem: 'Corona del Bestiario', color: '#e8c05a', boss: true,
    line: 'Llegaste hasta mí. Ahora demuestra que no fue suerte.',
    en: { title: 'master of the arena', beast: 'Blackember', emblem: 'Bestiary Crown', line: 'You made it all the way to me. Now prove it wasn’t luck.' } },
];
biAll(LEAGUE);
// rival de la Liga listo para el combate. Revancha: se ajusta al nivel de tu criatura (nunca por debajo del original).
export function leagueRival(i, playerLevel, rematch = false) {
  const Lg = LEAGUE[i]; if (!Lg) return null;
  const level = rematch ? Math.max(Lg.level, playerLevel + (Lg.boss ? 4 : 2)) : Lg.level;
  return {
    tier: { id: 'liga', name: Lg.name, color: Lg.color, train: Lg.train, xpMul: 1.4 }, species: Lg.species, level, mul: 1.3 + i * 0.12, slot: 10 + i,
    league: i, rematch, boss: !!Lg.boss, apples: rematch ? Math.min(5, Lg.apples + 1) : Lg.apples, beast: Lg.beast,
    get intro() { return L_(`${Lg.name}, ${Lg.title}, envía a ${Lg.beast} (nivel ${level}).`, `${Lg.name}, ${Lg.title}, sends out ${Lg.beast} (level ${level}).`); },
  };
}
