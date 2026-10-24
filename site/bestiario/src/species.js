// Criaturas del juego (de las notas de Julián): una jaula por especie en Criaderos.
// element: fuego | agua | aire | tierra. w = ancho de la jaula en metros (las de alas miden envergadura del rugido + 0,4 m). nudge = [m hacia el este, m hacia el fondo] que se corre la criatura
// dentro de su jaula para que el rugido no se salga de las barras. model: nombre del modelo 3D cuando ya existe.
// price = valor de la especie (su huevo cuesta el 25 %); base = estadísticas de una cría (fuerza, vitalidad, agilidad, magia); desc = ficha del criadero.
// plural / genero (m|f): para escribir bien «tus dragones», «dos quimeras», «alimentarla».
import { bi, biAll } from './i18n.js';

export const ELEMENTS = {
  fuego: bi({ name: 'Fuego', color: 0xe0502a, en: { name: 'Fire' } }),
  agua: bi({ name: 'Agua', color: 0x3a8fd0, en: { name: 'Water' } }),
  aire: bi({ name: 'Aire', color: 0xb8dff0, en: { name: 'Air' } }),
  tierra: bi({ name: 'Tierra', color: 0x8a7a3a, en: { name: 'Earth' } }),
};

// Orden de las jaulas: fila norte y fila sur del pasillo.
export const SPECIES = [
  // norte: fuego, agua y aire
  { id: 'dragon', name: 'Dragón', plural: 'dragones', genero: 'm', element: 'fuego', w: 4.6, model: 'dragon', scale: 0.3, skin: 'ceniza', offsetZ: 1.4,
    collide: [[4.6, 0.7], [3.0, 0.6], [1.0, 1.0], [-1.0, 0.9], [-3.5, 0.6], [-6, 0.4], [-8, 0.3]],  // círculos de colisión a lo largo del cuerpo (unidades del modelo)
    price: 2000, base: { fuerza: 8, vitalidad: 7, agilidad: 5, magia: 8 },
    desc: 'Reptil alado de ceniza y brasa. Duerme sobre su propio calor y despierta con hambre. El más temido del criadero.', en: { name: 'Dragon', plural: 'dragons', desc: 'A winged reptile of ash and embers. It sleeps on its own heat and wakes up hungry. The most feared beast in the breeding grounds.' } },
  { id: 'fenix', name: 'Fénix', plural: 'fénix', genero: 'm', element: 'fuego', w: 4.2, model: 'fenix',
    price: 1600, base: { fuerza: 5, vitalidad: 6, agilidad: 8, magia: 8 },
    desc: 'Rapaz de plumas encendidas posada sobre un tronco calcinado. Si cae en combate, arde y regresa una vez por pelea.', en: { name: 'Phoenix', plural: 'phoenixes', desc: 'A raptor with blazing feathers perched on a charred trunk. If it falls in battle, it burns and returns once per fight.' } },
  { id: 'felino', name: 'Gato de brasa', plural: 'gatos de brasa', genero: 'm', element: 'fuego', w: 4.4, model: 'felino',      // nombre provisional (la nota original es de una franquicia ajena)
    price: 450, base: { fuerza: 6, vitalidad: 5, agilidad: 9, magia: 5 },
    desc: 'Felino de ceniza con vetas de magma. Acecha agazapado y deja huellas que humean.', en: { name: 'Ember Cat', plural: 'ember cats', desc: 'An ash-grey feline veined with magma. It stalks low to the ground and leaves smoking pawprints.' } },
  { id: 'quimera', name: 'Quimera', plural: 'quimeras', genero: 'f', element: 'fuego', w: 5.0, model: 'quimera',
    price: 1400, base: { fuerza: 8, vitalidad: 8, agilidad: 6, magia: 7 },
    desc: 'Tres bestias en una: león, cabra y serpiente. Cada cabeza muerde por su cuenta y ninguna obedece a las otras.', en: { name: 'Chimera', plural: 'chimeras', desc: 'Three beasts in one: lion, goat and serpent. Each head bites on its own and none obeys the others.' } },
  { id: 'cerbero', name: 'Cerbero', plural: 'cerberos', genero: 'm', element: 'fuego', w: 4.8, model: 'cerbero',
    price: 1100, base: { fuerza: 9, vitalidad: 9, agilidad: 6, magia: 5 },
    desc: 'Mastín de tres cabezas, con grilletes rotos al cuello. Guarda las puertas: nada entra ni sale sin su permiso.', en: { name: 'Cerberus', plural: 'cerberi', desc: 'A three-headed mastiff with broken shackles around its necks. It guards the gates: nothing goes in or out without its leave.' } },
  { id: 'serpiente-aguila-fuego', name: 'Serpiente águila de fuego', plural: 'serpientes águila de fuego', genero: 'f', element: 'fuego', w: 6.3, nudge: [-0.45, 0], model: 'serpiente-aguila-fuego',
    price: 1000, base: { fuerza: 7, vitalidad: 7, agilidad: 7, magia: 8 },
    desc: 'Serpiente colosal de escamas de ceniza y brasa, con rostro de águila. Sus alas terminan en llamas y su vientre arde.', en: { name: 'Fire Eagle Serpent', plural: 'fire eagle serpents', desc: 'A colossal serpent with scales of ash and embers and the face of an eagle. Its wings end in flames and its belly burns.' } },
  { id: 'serpiente-aguila', name: 'Serpiente águila de agua', plural: 'serpientes águila de agua', genero: 'f', element: 'agua', w: 5.9, nudge: [-0.41, 0], model: 'serpiente-aguila',
    price: 900, base: { fuerza: 6, vitalidad: 7, agilidad: 7, magia: 8 },
    desc: 'Serpiente colosal con rostro de águila. Se enrosca en el agua y ataca desde lo alto con las alas abiertas.', en: { name: 'Water Eagle Serpent', plural: 'water eagle serpents', desc: 'A colossal serpent with the face of an eagle. It coils in the water and strikes from above with its wings spread wide.' } },
  { id: 'unicornio', name: 'Unicornio', plural: 'unicornios', genero: 'm', element: 'agua', w: 4.6, model: 'unicornio',
    price: 750, base: { fuerza: 5, vitalidad: 6, agilidad: 8, magia: 9 },
    desc: 'Bestia esbelta de cuerno de nácar. Ni dulce ni mansa: cura a quien aprecia y atraviesa a quien no.', en: { name: 'Unicorn', plural: 'unicorns', desc: 'A slender beast with a horn of mother-of-pearl. Neither sweet nor tame: it heals those it values and impales those it does not.' } },
  { id: 'pegaso', name: 'Pegaso', plural: 'pegasos', genero: 'm', element: 'aire', w: 7.1, model: 'pegaso',
    price: 800, base: { fuerza: 6, vitalidad: 6, agilidad: 10, magia: 6 },
    desc: 'Corcel de tormenta con alas de plumas desiguales. Rara vez baja a tierra, y cuando lo hace, relincha al cielo.', en: { name: 'Pegasus', plural: 'pegasi', desc: 'A storm steed with ragged feathered wings. It rarely touches the ground, and when it does, it neighs at the sky.' } },
  // sur: aire y tierra
  { id: 'hipogrifo', name: 'Hipogrifo', plural: 'hipogrifos', genero: 'm', element: 'aire', w: 6.9, model: 'hipogrifo',
    price: 700, base: { fuerza: 6, vitalidad: 6, agilidad: 9, magia: 5 },
    desc: 'Mitad rapaz, mitad corcel. Orgulloso: solo sirve a quien lo saluda con respeto.', en: { name: 'Hippogriff', plural: 'hippogriffs', desc: 'Half raptor, half steed. Proud: it only serves those who greet it with respect.' } },
  { id: 'grifo', name: 'Grifo', plural: 'grifos', genero: 'm', element: 'aire', w: 6.3, model: 'grifo',
    price: 850, base: { fuerza: 9, vitalidad: 7, agilidad: 7, magia: 5 },
    desc: 'Rey de las cumbres: pico ganchudo, garras de águila y cuerpo de felino. Defiende su territorio hasta el final.', en: { name: 'Griffin', plural: 'griffins', desc: 'King of the peaks: hooked beak, eagle talons and a feline body. It defends its territory to the very end.' } },
  { id: 'duende', name: 'Duende', plural: 'duendes', genero: 'm', element: 'tierra', w: 3.6, model: 'duende',
    price: 250, base: { fuerza: 4, vitalidad: 4, agilidad: 10, magia: 8 },
    desc: 'Criatura de raíz y corteza, con hongos en la espalda. Roba lo que brilla y lo esconde bajo la tierra.', en: { name: 'Goblin', plural: 'goblins', desc: 'A creature of root and bark, with mushrooms on its back. It steals anything that shines and hides it underground.' } },
  { id: 'ogro', name: 'Ogro', plural: 'ogros', genero: 'm', element: 'tierra', w: 5.2, model: 'ogro',
    price: 500, base: { fuerza: 10, vitalidad: 9, agilidad: 4, magia: 3 },
    desc: 'Bruto encorvado de colmillos curvos y piel curtida. Pega primero y nunca pregunta.', en: { name: 'Ogre', plural: 'ogres', desc: 'A hunched brute with curved tusks and leathery skin. It hits first and never asks.' } },
  { id: 'ciclope', name: 'Cíclope', plural: 'cíclopes', genero: 'm', element: 'tierra', w: 5.6, nudge: [0, 0.35], model: 'ciclope',
    price: 900, base: { fuerza: 10, vitalidad: 9, agilidad: 4, magia: 4 },
    desc: 'Gigante de un solo ojo y piel de ceniza. Marca su cuerpo con cicatrices rituales, una por cada derrota ajena.', en: { name: 'Cyclops', plural: 'cyclopes', desc: 'A one-eyed giant with ash-grey skin. It marks its body with ritual scars, one for every foe it has beaten.' } },
  { id: 'gigante', name: 'Gigante', plural: 'gigantes', genero: 'm', element: 'tierra', w: 7.0, model: 'gigante',
    price: 1500, base: { fuerza: 12, vitalidad: 12, agilidad: 2, magia: 4 },
    desc: 'Coloso de montaña cubierto de musgo y liquen. Cada paso suyo se siente como un temblor.', en: { name: 'Giant', plural: 'giants', desc: 'A mountain colossus covered in moss and lichen. Every step it takes feels like an earthquake.' } },
  { id: 'orcos', name: 'Horda de orcos', plural: 'hordas de orcos', genero: 'f', element: 'tierra', w: 6.0, model: 'orcos',
    price: 600, base: { fuerza: 8, vitalidad: 7, agilidad: 6, magia: 3 },
    desc: 'Tres guerreros que pelean como uno solo. Aunque caiga uno, los otros no huyen.', en: { name: 'Orc Horde', plural: 'orc hordes', desc: 'Three warriors who fight as one. Even if one falls, the others never run.' } },
  { id: 'minotauro', name: 'Minotauro', plural: 'minotauros', genero: 'm', element: 'tierra', w: 5.0, model: 'minotauro',
    price: 800, base: { fuerza: 10, vitalidad: 8, agilidad: 6, magia: 3 },
    desc: 'Bestia del laberinto: cabeza de toro, un cuerno roto y grilletes de hierro. Embiste sin parar y no conoce la salida.', en: { name: 'Minotaur', plural: 'minotaurs', desc: 'Beast of the labyrinth: a bull’s head, one broken horn and iron shackles. It charges without stopping and never finds the way out.' } },
];
biAll(SPECIES);
export const NORTH_COUNT = 9;
