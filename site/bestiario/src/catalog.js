// Catálogo del pueblo (de las notas): la Tienda vende comida, manzanas elementales y skins; la Enfermería, pociones
// de efecto temporal y botiquines; el Gimnasio, entrenamiento. Los precios están en monedas.
// Todos los textos son bilingües (español neutro e inglés): `en` lleva la versión inglesa y bi() la elige según el idioma.
import { ELEMENTS } from './species.js';
import { L, bi, biAll, withProps } from './i18n.js';

export const FOOD = biAll([
  { id: 'granos', name: 'Granos de ceniza', price: 8, xp: 12, desc: 'Un puñado de grano tostado. Alimenta poco, pero nunca falta.',
    en: { name: 'Ash Grain', desc: 'A handful of toasted grain. Not very filling, but never in short supply.' } },
  { id: 'bayas', name: 'Bayas de ámbar', price: 12, xp: 18, desc: 'Dulces y pegajosas. Las criaturas jóvenes las devoran.',
    en: { name: 'Amber Berries', desc: 'Sweet and sticky. Young creatures gobble them up.' } },
  { id: 'pescado', name: 'Pescado plateado', price: 18, xp: 28, desc: 'Fresco del río. Muy buscado por las criaturas de agua.',
    en: { name: 'Silver Fish', desc: 'Fresh from the river. A favorite of water creatures.' } },
  { id: 'carne', name: 'Carne ahumada', price: 26, xp: 42, desc: 'Curada sobre brasas. Da fuerza y buen ánimo.',
    en: { name: 'Smoked Meat', desc: 'Cured over embers. Gives strength and good spirits.' } },
  { id: 'medula', name: 'Hueso de médula', price: 55, xp: 100, desc: 'Un hueso grueso y graso. Una comida de campeón.',
    en: { name: 'Marrow Bone', desc: 'A thick, rich bone. A meal fit for a champion.' } },
  { id: 'corazon', name: 'Corazón de brasa', price: 140, xp: 280, desc: 'Un manjar raro, aún caliente. Da mucha experiencia de golpe.',
    en: { name: 'Ember Heart', desc: 'A rare delicacy, still warm. Grants a lot of experience at once.' } },
]);

// una manzana por elemento: sube la afinidad de la criatura con ese elemento (más daño de ese elemento en combate)
export const APPLES = biAll([
  { id: 'manzana-fuego', element: 'fuego', name: 'Manzana de fuego', price: 45, desc: 'Piel roja y pulpa que arde. Para criaturas de fuego: poder permanente y +1 de afinidad.',
    en: { name: 'Fire Apple', desc: 'Red skin and burning flesh. For fire creatures: a permanent power and +1 affinity.' } },
  { id: 'manzana-agua', element: 'agua', name: 'Manzana de agua', price: 45, desc: 'Fría y jugosa, siempre con rocío. Para criaturas de agua: poder permanente y +1 de afinidad.',
    en: { name: 'Water Apple', desc: 'Cold and juicy, always dewy. For water creatures: a permanent power and +1 affinity.' } },
  { id: 'manzana-aire', element: 'aire', name: 'Manzana de aire', price: 45, desc: 'Ligera como una pluma. Para criaturas de aire: poder permanente y +1 de afinidad.',
    en: { name: 'Air Apple', desc: 'Light as a feather. For air creatures: a permanent power and +1 affinity.' } },
  { id: 'manzana-tierra', element: 'tierra', name: 'Manzana de tierra', price: 45, desc: 'Dura, verde y con sabor a raíz. Para criaturas de tierra: poder permanente y +1 de afinidad.',
    en: { name: 'Earth Apple', desc: 'Hard, green and tasting of roots. For earth creatures: a permanent power and +1 affinity.' } },
  { id: 'manzana-dorada', element: null, name: 'Manzana dorada', price: 260, desc: 'Una rareza que sirve a cualquier criatura: cuenta como manzana de su elemento y +1 de afinidad con los cuatro.',
    en: { name: 'Golden Apple', desc: 'A rarity that works for any creature: it counts as an apple of its element and gives +1 affinity with all four.' } },
]);

// skins del viajero: colores de capa, capucha y mantelete
export const PLAYER_SKINS = biAll([
  { id: 'viajero', name: 'Viajero', price: 0, cloak: 0x8a3f30, hood: 0x6a3026, mantle: 0x4f3d36, desc: 'La capa con la que llegaste.',
    en: { name: 'Traveler', desc: 'The cloak you arrived in.' } },
  { id: 'ceniza', name: 'Capa de ceniza', price: 120, cloak: 0x585b63, hood: 0x3e4047, mantle: 0x2e3036, desc: 'Gris humo, discreta.',
    en: { name: 'Ash Cloak', desc: 'Smoke grey, understated.' } },
  { id: 'bosque', name: 'Capa del bosque', price: 150, cloak: 0x3f5a3a, hood: 0x2c4129, mantle: 0x3a3426, desc: 'Verde musgo para pasar entre los árboles.',
    en: { name: 'Forest Cloak', desc: 'Moss green, for slipping between the trees.' } },
  { id: 'medianoche', name: 'Capa de medianoche', price: 220, cloak: 0x28345c, hood: 0x1c2444, mantle: 0x1c1d2e, desc: 'Azul profundo con bordes oscuros.',
    en: { name: 'Midnight Cloak', desc: 'Deep blue with dark trim.' } },
  { id: 'escarlata', name: 'Capa escarlata', price: 320, cloak: 0xa01e2a, hood: 0x7a141e, mantle: 0x2a1418, desc: 'Roja de gala. Se te ve desde lejos.',
    en: { name: 'Scarlet Cloak', desc: 'Ceremonial red. You can be seen from afar.' } },
]);

// skins de criaturas. El dragón tiene las suyas; el resto usa un tinte sobre su color base.
export const DRAGON_SKIN_SHOP = biAll([
  { id: 'ceniza', name: 'Ceniza', price: 0, swatch: 0x4a4c54, desc: 'La piel original.', en: { name: 'Ash', desc: 'The original hide.' } },
  { id: 'sangre', name: 'Sangre seca', price: 300, swatch: 0x7a2a26, desc: 'Escamas rojo oscuro y brasas doradas.', en: { name: 'Dried Blood', desc: 'Dark red scales and golden embers.' } },
  { id: 'abismo', name: 'Abismo', price: 340, swatch: 0x405088, desc: 'Azul de fondo de lago, con llama helada.', en: { name: 'Abyss', desc: 'Lake-bottom blue, with an icy flame.' } },
  { id: 'podrido', name: 'Pantano', price: 320, swatch: 0x7a8a56, desc: 'Verde enfermizo con un brillo ácido.', en: { name: 'Swamp', desc: 'Sickly green with an acid sheen.' } },
]);
export const TINT_SKINS = biAll([
  { id: 'base', name: 'Original', price: 0, tint: 0xffffff, swatch: 0xb8b0a4, desc: 'El color con que nació.', en: { name: 'Original', desc: 'The color it was born with.' } },
  { id: 'carbon', name: 'Carbón', price: 180, tint: 0x8a8a96, swatch: 0x4a4a54, desc: 'Más oscura y sobria.', en: { name: 'Charcoal', desc: 'Darker and more sober.' } },
  { id: 'escarcha', name: 'Escarcha', price: 220, tint: 0xa8c8ff, swatch: 0x9ec0f0, desc: 'Pálida, con reflejos fríos.', en: { name: 'Frost', desc: 'Pale, with cold highlights.' } },
  { id: 'ambar', name: 'Ámbar', price: 240, tint: 0xffc070, swatch: 0xe0a050, desc: 'Cálida, como cobre pulido.', en: { name: 'Amber', desc: 'Warm, like polished copper.' } },
]);

export const POTIONS = biAll([
  { id: 'furia', name: 'Poción de furia', price: 60, color: 0xe0554a, battles: 3, desc: 'Daño +20 % durante 3 combates.',
    en: { name: 'Fury Potion', desc: 'Damage +20 % for 3 battles.' } },
  { id: 'piedra', name: 'Piel de piedra', price: 60, color: 0x8a8f96, battles: 3, desc: 'Daño recibido −25 % durante 3 combates.',
    en: { name: 'Stoneskin', desc: 'Damage taken −25 % for 3 battles.' } },
  { id: 'tormenta', name: 'Pluma de tormenta', price: 50, color: 0x6ab4f0, battles: 3, desc: 'Tu criatura actúa primero y esquiva un 10 % más durante 3 combates.',
    en: { name: 'Storm Feather', desc: 'Your creature acts first and dodges 10 % more for 3 battles.' } },
  { id: 'savia', name: 'Savia verde', price: 70, color: 0x4cc36a, battles: 3, desc: 'Recupera el 5 % de los PS cada ronda durante 3 combates.',
    en: { name: 'Green Sap', desc: 'Restores 5 % of HP every round for 3 battles.' } },
  { id: 'foco', name: 'Elixir de puntería', price: 60, color: 0x9b59d6, battles: 2, desc: 'Tu ataque especial no falla y tiene +25 % de crítico durante 2 combates.',
    en: { name: 'Elixir of Aim', desc: 'Your special attack never misses and has +25 % critical chance for 2 battles.' } },
]);

export const KITS = biAll([
  { id: 'kit-s', name: 'Botiquín pequeño', price: 40, heal: 0.3, desc: 'Vendas y ungüento. Recupera el 30 % de los PS.',
    en: { name: 'Small First-Aid Kit', desc: 'Bandages and salve. Restores 30 % of HP.' } },
  { id: 'kit-m', name: 'Botiquín mediano', price: 80, heal: 0.6, desc: 'Con puntos y hierbas. Recupera el 60 % de los PS.',
    en: { name: 'Medium First-Aid Kit', desc: 'Stitches and herbs. Restores 60 % of HP.' } },
  { id: 'kit-l', name: 'Botiquín de campaña', price: 150, heal: 1, desc: 'Todo lo del doctor, en una caja. Recupera todos los PS.',
    en: { name: 'Field Kit', desc: 'Everything the doctor has, in one box. Restores all HP.' } },
]);


// formas de las criaturas: cada elemento tiene tres. La base se tiene al eclosionar; la 2 se compra en la Tienda (por especie);
// la 3 se consigue dándole a la criatura una manzana de su elemento.
export const FORMS = {
  fuego: { apple: 'manzana-fuego',
    v2: bi({ id: 'esqueleto', name: 'Aspecto esqueleto', desc: 'Solo huesos y brasas: la carne arde y queda el esqueleto, con ojos de fuego.',
      en: { name: 'Skeleton look', desc: 'Nothing but bones and embers: the flesh burns away and the skeleton remains, with eyes of fire.' } }),
    v3: bi({ id: 'ignea', name: 'Aspecto ígneo', desc: 'El cuerpo se vuelve magma: grietas incandescentes y un resplandor que ilumina el suelo.',
      en: { name: 'Igneous look', desc: 'The body turns to magma: glowing cracks and a radiance that lights up the ground.' } }) },
  aire: { apple: 'manzana-aire',
    v2: bi({ id: 'armadura', name: 'Aspecto acorazado', desc: 'Con armadura de acero: peto, yelmo y protecciones en las patas.',
      en: { name: 'Armored look', desc: 'Clad in steel armor: breastplate, helm and leg guards.' } }),
    v3: bi({ id: 'tormenta', name: 'Aspecto de tormenta', desc: 'Envuelta en una tormenta: tonos pálidos y relámpagos que recorren su cuerpo.',
      en: { name: 'Storm look', desc: 'Wrapped in a storm: pale tones and lightning crawling across its body.' } }) },
  tierra: { apple: 'manzana-tierra',
    v2: bi({ id: 'colosal', name: 'Aspecto colosal', desc: 'Más grande, y con su arma distintiva: cada criatura lleva la suya.',
      en: { name: 'Colossal look', desc: 'Bigger, and carrying its signature weapon: each creature has its own.' } }),
    v3: bi({ id: 'petrea', name: 'Aspecto pétreo', desc: 'La piel se endurece como roca cubierta de musgo y raíces.',
      en: { name: 'Stone look', desc: 'The skin hardens like rock covered in moss and roots.' } }) },
  agua: { apple: 'manzana-agua',
    v2: bi({ id: 'hielo', name: 'Aspecto de hielo', desc: 'Cuerpo de hielo translúcido, con escarcha y reflejos fríos.',
      en: { name: 'Ice look', desc: 'A body of translucent ice, with frost and cold highlights.' } }),
    v3: bi({ id: 'abismal', name: 'Aspecto abismal', desc: 'De las profundidades: piel azul marino con manchas luminosas.',
      en: { name: 'Abyssal look', desc: 'From the depths: navy-blue skin with glowing spots.' } }) },
};
export const FORM_BASE = bi({ id: 'base', name: 'Aspecto base', desc: 'Como nació.', en: { name: 'Base look', desc: 'As it was born.' } });
export const formsOf = (element) => [FORM_BASE, FORMS[element].v2, FORMS[element].v3];
export const formInfo = (element, id) => formsOf(element).find((f) => f.id === id) || FORM_BASE;
// la forma 2 se compra una vez por elemento y la comparten todas las criaturas de ese elemento
export const FORM_PRICE = { fuego: 250, agua: 200, aire: 200, tierra: 180 };
export const formBonusText = () => L('+10 % a fuerza, magia, agilidad y vitalidad en combate (el aspecto que dan las manzanas, +15 %; no se suman).',
  '+10 % to strength, magic, agility and vitality in battle (the look granted by apples gives +15 %; they don’t stack).');
export const formPrice = (sp) => FORM_PRICE[sp.element];


// poderes permanentes de las manzanas: cada manzana de su elemento que come una criatura de ese elemento cuenta; con la 1.ª, la 3.ª y la 5.ª
// aprende un poder para siempre (y con la 1.ª cambia de aspecto: forma 3). La manzana dorada cuenta como una más de su elemento.
export const POWERS = {
  fuego: biAll([
    { n: 1, id: 'piel-ardiente', name: 'Piel ardiente', desc: 'Quien le pega cuerpo a cuerpo tiene un 25 % de arder.', en: { name: 'Burning Skin', desc: 'Whoever strikes it in melee has a 25 % chance to catch fire.' } },
    { n: 3, id: 'llamarada', name: 'Llamarada', desc: '+20 % de daño en su ataque especial.', en: { name: 'Flare', desc: '+20 % damage on its special attack.' } },
    { n: 5, id: 'corazon-magma', name: 'Corazón de magma', desc: '+15 % de PS máximos.', en: { name: 'Magma Heart', desc: '+15 % max HP.' } } ]),
  agua: biAll([
    { n: 1, id: 'escudo-marea', name: 'Escudo de marea', desc: 'Recibe un 10 % menos de daño.', en: { name: 'Tide Shield', desc: 'Takes 10 % less damage.' } },
    { n: 3, id: 'marea-viva', name: 'Marea viva', desc: 'Recupera el 4 % de sus PS cada ronda.', en: { name: 'Living Tide', desc: 'Restores 4 % of its HP every round.' } },
    { n: 5, id: 'tiburon', name: 'Tiburón', desc: 'Su ataque especial quita además el 4 % de los PS del rival.', en: { name: 'Shark', desc: 'Its special attack also takes 4 % of the rival’s HP.' } } ]),
  aire: biAll([
    { n: 1, id: 'alas-veloces', name: 'Alas veloces', desc: '+10 % de probabilidad de esquivar.', en: { name: 'Swift Wings', desc: '+10 % chance to dodge.' } },
    { n: 3, id: 'rafaga', name: 'Ráfaga', desc: '+3 de iniciativa: casi siempre actúa primero.', en: { name: 'Gust', desc: '+3 initiative: it almost always acts first.' } },
    { n: 5, id: 'ojo-tormenta', name: 'Ojo de tormenta', desc: '+20 % de golpes críticos.', en: { name: 'Eye of the Storm', desc: '+20 % critical hits.' } } ]),
  tierra: biAll([
    { n: 1, id: 'piel-roca', name: 'Piel de roca', desc: 'Recibe un 10 % menos de daño de golpes físicos.', en: { name: 'Rock Skin', desc: 'Takes 10 % less damage from physical blows.' } },
    { n: 3, id: 'temblor', name: 'Temblor', desc: '+15 % de fuerza.', en: { name: 'Tremor', desc: '+15 % strength.' } },
    { n: 5, id: 'raices', name: 'Raíces', desc: 'Recupera el 3 % de sus PS cada ronda y no se aturde.', en: { name: 'Roots', desc: 'Restores 3 % of its HP every round and can’t be stunned.' } } ]),
};
export const powersOf = (element, apples) => POWERS[element].filter((p) => (apples || 0) >= p.n);
export const nextPower = (element, apples) => POWERS[element].find((p) => (apples || 0) < p.n) || null;

// estados que deja el combate: persisten hasta que los cure la Enfermería (o un objeto)
export const STATUS = {
  quemadura: bi({ name: 'Quemadura', desc: 'Pierde el 6 % de sus PS cada ronda.', color: '#ff7a3a', en: { name: 'Burn', desc: 'Loses 6 % of its HP every round.' } }),
  veneno: bi({ name: 'Veneno', desc: 'Pierde el 5 % de sus PS cada ronda.', color: '#9be04a', en: { name: 'Poison', desc: 'Loses 5 % of its HP every round.' } }),
  miedo: bi({ name: 'Miedo', desc: 'Su daño baja un 25 %.', color: '#b08aff', en: { name: 'Fear', desc: 'Its damage drops by 25 %.' } }),
};
export const CURES = biAll([
  { id: 'unguento', name: 'Ungüento de ceniza', price: 30, cures: 'quemadura', desc: 'Cura la quemadura.', en: { name: 'Ash Salve', desc: 'Cures burns.' } },
  { id: 'antidoto', name: 'Antídoto de raíz', price: 30, cures: 'veneno', desc: 'Cura el veneno.', en: { name: 'Root Antidote', desc: 'Cures poison.' } },
  { id: 'sales', name: 'Sales de coraje', price: 35, cures: 'miedo', desc: 'Le devuelve el valor.', en: { name: 'Courage Salts', desc: 'Restores its courage.' } },
]);

// los tres inicios de partida
export const START_MODES = biAll([
  { id: 'inicio', name: 'Primeros pasos', tag: 'Empiezas desde cero', color: '#5fd6a4',
    bullets: ['220 monedas y algo de comida', 'Sin criaturas: compras un huevo en Criaderos', 'El huevo tarda 5 minutos en eclosionar', 'Cría, alimenta y entrena a tu primera criatura'],
    en: { name: 'First Steps', tag: 'You start from scratch',
      bullets: ['220 coins and a little food', 'No creatures: you buy an egg at the Breeding Grounds', 'The egg takes 5 minutes to hatch', 'Raise, feed and train your first creature'] } },
  { id: 'domador', name: 'Domador', tag: 'Un buen punto medio', color: '#e8c05a',
    bullets: ['900 monedas, comida, un botiquín y una manzana', 'Ascua: un dragón joven (nivel 4), algo herido', 'Un huevo de unicornio ya incubando', 'Compra más huevos para ampliar tu equipo'],
    en: { name: 'Tamer', tag: 'A good middle ground',
      bullets: ['900 coins, food, a first-aid kit and an apple', 'Ember: a young dragon (level 4), slightly hurt', 'A unicorn egg already incubating', 'Buy more eggs to grow your team'] } },
  { id: 'maestro', name: 'Maestro del criadero', tag: 'Todo listo para jugar a lo grande', color: '#e0607f',
    bullets: ['6000 monedas y la mochila llena', 'Cuatro criaturas ya criadas (hasta nivel 14)', 'Dos huevos listos para eclosionar', 'Incubadora de 6 huevos: compra lo que quieras'],
    en: { name: 'Breeding Master', tag: 'Everything ready to play big',
      bullets: ['6000 coins and a full backpack', 'Four creatures already raised (up to level 14)', 'Two eggs ready to hatch', '6-egg incubator: buy whatever you like'] } },
]);

// ofertas del día en la Tienda: tres productos con 25 % de descuento y existencias limitadas, que cambian cada día
export function offersOfDay(dayKey, pool) {
  let h = 2166136261;
  for (let i = 0; i < dayKey.length; i++) { h ^= dayKey.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const items = [...pool], out = [];
  while (out.length < 3 && items.length) out.push(items.splice(Math.floor(rnd() * items.length), 1)[0]);
  return out.map((it) => ({ id: it.id, price: Math.max(1, Math.round(it.price * 0.75)), stock: 3 }));
}

export const TRAINING = biAll([
  { id: 'fuerza', name: 'Fuerza', place: 'Levantar piedras', desc: 'Más daño en cada golpe.', en: { name: 'Strength', place: 'Stone lifting', desc: 'More damage with every blow.' } },
  { id: 'vitalidad', name: 'Vitalidad', place: 'Carrera de obstáculos', desc: 'Más puntos de salud (PS).', en: { name: 'Vitality', place: 'Obstacle course', desc: 'More health points (HP).' } },
  { id: 'agilidad', name: 'Agilidad', place: 'Muñecos y esquivas', desc: 'Más probabilidad de esquivar y de actuar primero.', en: { name: 'Agility', place: 'Dummies and dodging', desc: 'Better odds of dodging and of acting first.' } },
  { id: 'magia', name: 'Magia', place: 'Círculo de runas', desc: 'Más poder en los ataques elementales.', en: { name: 'Magic', place: 'Rune circle', desc: 'More power in elemental attacks.' } },
]);

// etapas de evolución por nivel (en español, «Adulta» pasa a «Adulto» para las especies masculinas: ver stageName en panels.js)
export const STAGES = biAll([
  { from: 1, name: 'Cría', en: { name: 'Hatchling' } },
  { from: 8, name: 'Joven', en: { name: 'Juvenile' } },
  { from: 18, name: 'Adulta', en: { name: 'Adult' } },
  { from: 32, name: 'Ancestral', en: { name: 'Ancestral' } },
]);
export const stageOf = (level) => { let s = STAGES[0]; for (const x of STAGES) if (level >= x.from) s = x; return s; };

// índice de objetos por id; withProps conserva los textos bilingües (un objeto copiado con ... quedaría en un solo idioma)
export const ITEM_INDEX = (() => {
  const m = new Map();
  for (const f of FOOD) m.set(f.id, withProps(f, { kind: 'food' }));
  for (const a of APPLES) m.set(a.id, withProps(a, { kind: 'apple' }));
  for (const p of POTIONS) m.set(p.id, withProps(p, { kind: 'potion' }));
  for (const k of KITS) m.set(k.id, withProps(k, { kind: 'kit' }));
  for (const c of CURES) m.set(c.id, withProps(c, { kind: 'cure' }));
  return m;
})();

export const elementName = (e) => (e && ELEMENTS[e] ? ELEMENTS[e].name : L('Todos', 'All'));
export const elementColor = (e) => (e && ELEMENTS[e] ? '#' + ELEMENTS[e].color.toString(16).padStart(6, '0') : '#e8c05a');
