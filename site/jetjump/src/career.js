// JET//Jump — carrera: rancho, monedas, caballos, jinete y cuidador (lógica pura, sin gráficos).
// Referente pedido por Julián (15-10-2026): Rival Stars Horse Racing — rancho como centro, ligas de salto con
// reputación y clasificatorio, confianza del caballo; acá además el cuidador es un rol jugable.
// Una sola moneda que se gana jugando (sin esperas en tiempo real ni compras con dinero).
// v2 (revisión de abogado del diablo): tareas por caballo, días con costo (pensión, energía, repetir rinde
// la mitad), el cuidado pesa en el salto, reputación más exigente y rivales según el largo del recorrido.

import { L, bi, lang, dec } from './text.js';

const KEY = 'jj-pro:career';
export const VERSION = 3;

// ---------------------------------------------------------------- pelajes (el modelo es siempre Henry; el
// pelaje lo pinta el shader del caballo, ver horse.js setCoat)
export const COATS = {
  zaino: { name: 'Zaino', body: [0.235, 0.105, 0.045], points: [0.07, 0.05, 0.04], mane: [0.07, 0.05, 0.038], pinto: 0, dapple: 0 },
  alazan: { name: 'Alazán', body: [0.36, 0.13, 0.04], points: [0.30, 0.11, 0.035], mane: [0.30, 0.12, 0.05], pinto: 0, dapple: 0 },
  negro: { name: 'Negro', body: [0.028, 0.024, 0.022], points: [0.02, 0.018, 0.017], mane: [0.02, 0.018, 0.017], pinto: 0, dapple: 0 },
  tordillo: { name: 'Tordo', body: [0.62, 0.62, 0.63], points: [0.22, 0.22, 0.23], mane: [0.55, 0.55, 0.56], pinto: 0, dapple: 1 },
  palomino: { name: 'Palomino', body: [0.66, 0.44, 0.17], points: [0.55, 0.36, 0.14], mane: [0.86, 0.80, 0.66], pinto: 0, dapple: 0 },
  overo: { name: 'Pinto', body: [0.235, 0.105, 0.045], points: [0.07, 0.05, 0.04], mane: [0.07, 0.05, 0.038], pinto: 1, dapple: 0 },
  // v16: más pelajes (con raya de mula, rosillos, manta appaloosa)
  zainoOscuro: { name: 'Zaino oscuro', body: [0.11, 0.05, 0.026], points: [0.04, 0.032, 0.026], mane: [0.04, 0.032, 0.026] },
  alazanTostado: { name: 'Alazán tostado', body: [0.19, 0.07, 0.026], points: [0.16, 0.058, 0.022], mane: [0.15, 0.06, 0.026] },
  tordoBlanco: { name: 'Tordo blanco', body: [0.80, 0.80, 0.79], points: [0.5, 0.5, 0.51], mane: [0.78, 0.77, 0.75], dapple: 0.3 },
  bayo: { name: 'Bayo', body: [0.6, 0.4, 0.16], points: [0.05, 0.04, 0.035], mane: [0.05, 0.04, 0.035], dorsal: 0.6 },
  gateado: { name: 'Gateado', body: [0.36, 0.26, 0.15], points: [0.06, 0.045, 0.035], mane: [0.06, 0.045, 0.035], dorsal: 1 },
  rosillo: { name: 'Rosillo', body: [0.34, 0.13, 0.055], points: [0.2, 0.08, 0.035], mane: [0.24, 0.1, 0.04], roan: 0.85 },
  moro: { name: 'Moro', body: [0.05, 0.046, 0.045], points: [0.028, 0.025, 0.024], mane: [0.028, 0.025, 0.024], roan: 0.9 },
  appaloosa: { name: 'Appaloosa', body: [0.2, 0.09, 0.04], points: [0.05, 0.04, 0.035], mane: [0.06, 0.045, 0.035], appy: 1 },
  isabelino: { name: 'Isabelino', body: [0.84, 0.74, 0.57], points: [0.76, 0.66, 0.5], mane: [0.92, 0.88, 0.78], paleHooves: true },
  pintoNegro: { name: 'Pinto negro', body: [0.03, 0.026, 0.024], points: [0.022, 0.02, 0.019], mane: [0.022, 0.02, 0.019], pinto: 1 },
};

// ---------------------------------------------------------------- atributos del caballo (0–100, salvo Salto en m)
export const STATS = {
  salto: { name: 'Salto', desc: 'Altura que puede saltar con margen. Define a qué concursos puede ir.' },
  tecnica: { name: 'Técnica', desc: 'Pliega manos y pies: menos derribos y una ventana de salto más amplia.' },
  velocidad: { name: 'Velocidad', desc: 'Galope más rápido: mejores tiempos.' },
  agilidad: { name: 'Agilidad', desc: 'Giros más cerrados y menos pérdida de confianza en las curvas.' },
  resistencia: { name: 'Resistencia', desc: 'Más confianza acumulada y menos cansancio al final del recorrido.' },
  coraje: { name: 'Coraje', desc: 'Menos rehúses cuando la confianza baja.' },
};
export const STAT_KEYS = ['salto', 'tecnica', 'velocidad', 'agilidad', 'resistencia', 'coraje'];

// necesidades (0–100): las atiende el cuidador
export const NEEDS = {
  energia: { name: 'Energía' }, animo: { name: 'Ánimo' }, salud: { name: 'Salud' },
  limpieza: { name: 'Limpieza' }, comida: { name: 'Comida' }, agua: { name: 'Agua' },
};

// ---------------------------------------------------------------- ligas de salto
// Cuatro ligas (como en el referente): cada recorrido da reputación; con la reputación pedida se abre el
// clasificatorio, y ganarlo da el pase a la liga siguiente.
export const LEAGUES = [
  { key: 'club', name: 'Club', fee: 20, prize: 120, rep: 150, rivals: [0.05, 0.4],
    events: [
      { key: 'club1', name: 'Iniciación', layout: 'clasico', h: 0.90, ta: 76 },
      { key: 'club2', name: 'Copa del Club', layout: 'lazo', h: 0.95, ta: 74 },
      { key: 'club3', name: 'Premio Primavera', layout: 'clasico', h: 1.00, ta: 72 },
    ], qual: { key: 'clubQ', name: 'Clasificatorio Club', layout: 'lazo', h: 1.05, ta: 70 } },
  { key: 'nacional', name: 'Nacional', fee: 60, prize: 360, rep: 240, rivals: [0.3, 0.6],
    events: [
      { key: 'nac1', name: 'Copa Regional', layout: 'diagonal', h: 1.10, ta: 72 },
      { key: 'nac2', name: 'Copa de Otoño', layout: 'clasico', h: 1.15, ta: 70 },
      { key: 'nac3', name: 'Trofeo Nacional', layout: 'lazo', h: 1.20, ta: 70 },
    ], qual: { key: 'nacQ', name: 'Clasificatorio Nacional', layout: 'diagonal', h: 1.25, ta: 68 } },
  { key: 'patrocinada', name: 'Patrocinada', fee: 200, prize: 600, rep: 330, rivals: [0.40, 0.72],
    events: [
      { key: 'pat1', name: 'Copa Patrocinadores', layout: 'serpiente', h: 1.30, ta: 70 },
      { key: 'pat2', name: 'Derby de Verano', layout: 'diagonal', h: 1.35, ta: 68 },
      { key: 'pat3', name: 'Premio Internacional', layout: 'clasico', h: 1.40, ta: 66 },
    ], qual: { key: 'patQ', name: 'Clasificatorio Patrocinada', layout: 'serpiente', h: 1.45, ta: 66 } },
  { key: 'gp', name: 'Gran Premio', fee: 500, prize: 1300, rep: 0, rivals: [0.52, 0.85],
    events: [
      { key: 'gp1', name: 'Gran Premio de la Ciudad', layout: 'lazo', h: 1.50, ta: 66 },
      { key: 'gp2', name: 'Gran Premio de las Naciones', layout: 'serpiente', h: 1.55, ta: 64 },
      { key: 'gp3', name: 'Gran Premio Final', layout: 'diagonal', h: 1.60, ta: 64 },
    ], qual: null },
];
export const PRIZE_SPLIT = [1, 0.6, 0.45, 0.3, 0.2];
export const ELIGIBLE_MARGIN = 0.08;           // el caballo puede ir a un concurso si salta hasta 8 cm menos
export const MAX_SHOWS_DAY = 3;                // por caballo
export function leagueOf(evKey) { for (const L of LEAGUES) { if (L.events.some((e) => e.key === evKey) || (L.qual && L.qual.key === evKey)) return L; } return null; }
export function eventDef(evKey) { for (const L of LEAGUES) { const e = L.events.find((x) => x.key === evKey) || (L.qual && L.qual.key === evKey ? L.qual : null); if (e) return e; } return null; }
export function eligible(h, E) { return h.stats.salto >= E.h - ELIGIBLE_MARGIN; }

// ---------------------------------------------------------------- entrenamientos (jugables, ver career-ui.js)
export const TRAININGS = {
  plano: { name: 'Trabajo en plano', desc: 'Pasa por las puertas de conos en orden.', stats: { agilidad: 3, resistencia: 1 }, energy: 15, unlock: null },
  gimnasia: { name: 'Gimnasia', desc: 'Salta los obstáculos de práctica sin derribos.', stats: { tecnica: 3, coraje: 1 }, energy: 20, unlock: 'gimnasio' },
  galope: { name: 'Galope de fondo', desc: 'Da dos vueltas a la pista sin dejar de galopar.', stats: { velocidad: 2, resistencia: 2 }, energy: 20, unlock: null },
  altura: { name: 'Salto en altura', desc: 'Salta obstáculos a la altura máxima de tu caballo.', stats: { salto: 0.02, coraje: 2 }, energy: 20, unlock: 'gimnasio' },
};

// ---------------------------------------------------------------- tareas del cuidador (por caballo y por día)
export const TASKS = {
  limpiarBox: { name: 'Limpiar el box', desc: 'Retira el estiércol y pon cama nueva.', reward: 6, xp: 8 },
  agua: { name: 'Agua fresca', desc: 'Llena el balde hasta la marca.', reward: 4, xp: 5 },
  comida: { name: 'Ración', desc: 'Prepara la ración: heno y, si tienes, avena o un premio.', reward: 5, xp: 6 },
  cepillar: { name: 'Cepillar', desc: 'Quita el barro y el polvo del pelaje.', reward: 8, xp: 10 },
  cascos: { name: 'Limpiar los cascos', desc: 'Saca piedras y barro de los cuatro cascos.', reward: 6, xp: 8 },
  duchar: { name: 'Ducha', desc: 'Después del esfuerzo, quita el sudor con agua.', reward: 6, xp: 8 },
  ensillar: { name: 'Ensillar', desc: 'Pon la mantilla y la montura, y ajusta la cincha.', reward: 3, xp: 4 },
};
export const GROOM_LEVELS = [0, 60, 160, 320, 560, 900];
export const GROOM_TITLES = ['Aprendiz', 'Ayudante', 'Cuidador', 'Cuidador experto', 'Jefe de cuadra', 'Maestro de cuadra'];

// ---------------------------------------------------------------- jinete
export const SKILLS = {
  ojo: { name: 'Ojo', desc: 'Ventana de salto más amplia: «Salta ahora» aparece antes y dura más.' },
  equilibrio: { name: 'Equilibrio', desc: 'Más margen sobre las barras: menos derribos.' },
  temple: { name: 'Temple', desc: 'Transmite calma: la confianza del caballo baja menos.' },
  giros: { name: 'Giros', desc: 'Giros más cerrados al galope.' },
};
export function riderLevel(xp) { return Math.floor(Math.sqrt(xp / 80)) + 1; }
export function riderNext(level) { return level * level * 80; }

// ---------------------------------------------------------------- tienda y mejoras del rancho
export const SHOP = {
  // herramientas del cuidador y servicios
  cepilloBlando: { cat: 'cuidador', name: 'Cepillo ancho', price: 40, desc: 'Cepillo más ancho: limpias más rápido.' },
  rasqueta: { cat: 'cuidador', name: 'Rasqueta de goma', price: 60, desc: 'Quita más barro en cada pasada.' },
  champu: { cat: 'cuidador', name: 'Champú (5 duchas)', price: 30, desc: 'La ducha sube más el ánimo.', stack: 5 },
  limpiacascos: { cat: 'cuidador', name: 'Limpiacascos de acero', price: 50, desc: 'Cada pasada saca más barro.' },
  manta: { cat: 'cuidador', name: 'Manta de establo', price: 120, desc: 'De noche el caballo se ensucia la mitad.' },
  veterinario: { cat: 'cuidador', name: 'Visita del veterinario', price: 60, desc: 'Revisa al caballo activo: +40 de salud.', service: true },
  // comida
  zanahorias: { cat: 'comida', name: 'Zanahorias (5)', price: 10, desc: 'Premio en la ración: +ánimo y +vínculo.', stack: 5 },
  avena: { cat: 'comida', name: 'Avena premium (5)', price: 45, desc: 'La ración devuelve más energía.', stack: 5 },
  suplemento: { cat: 'comida', name: 'Suplemento mineral (5)', price: 70, desc: 'Cada ración suma salud.', stack: 5 },
  // equipo del caballo (cuenta en el concurso)
  protectores: { cat: 'equipo', name: 'Protectores de tendones', price: 200, desc: '+12 de técnica en el concurso: menos derribos.' },
  monturaPro: { cat: 'equipo', name: 'Montura de salto profesional', price: 600, desc: '+6 de agilidad, giros más cerrados y +10 de confianza inicial.' },
  cueroNegro: { cat: 'equipo', name: 'Cuero negro', price: 90, desc: 'Montura y cabezada negras (cosmético).', look: { leather: [0.045, 0.04, 0.035] } },
  cueroHabano: { cat: 'equipo', name: 'Cuero habano', price: 90, desc: 'Montura y cabezada color habano (cosmético).', look: { leather: [0.48, 0.27, 0.13] } },
  // mejoras del rancho
  boxAmplio: { cat: 'rancho', name: 'Box amplio', price: 300, desc: 'De noche el caballo recupera +15 de energía.' },
  gimnasio: { cat: 'rancho', name: 'Pista de gimnasia', price: 400, desc: 'Habilita los entrenamientos de Gimnasia y Salto en altura.' },
  duchaCaliente: { cat: 'rancho', name: 'Ducha de agua tibia', price: 250, desc: 'La ducha suma salud y más ánimo.' },
  bebedero: { cat: 'rancho', name: 'Bebedero automático', price: 350, desc: 'El agua del box no baja de 50 durante la noche.' },
  pistaPro: { cat: 'rancho', name: 'Pista de arena profesional', price: 1500, desc: 'Los entrenamientos rinden un 20 % más.' },
  caminador: { cat: 'rancho', name: 'Caminador', price: 1200, desc: 'De noche todos los caballos recuperan +8 de energía.' },
  haras: { cat: 'rancho', name: 'Yeguada (criadero)', price: 1500, desc: 'Habilita la cría: cruza tus yeguas con sementales.' },
};
export const LEATHER_DEFAULT = [0.30, 0.17, 0.09];
export const BOARD_LEAGUE = [10, 20, 35, 60];   // pensión diaria por caballo, según la liga (sube con el nivel del rancho)
export function board(p) { return BOARD_LEAGUE[p.league] * p.horses.length; }

// ---------------------------------------------------------------- razas (un solo modelo: forma y tamaño, ver breed.js)
// salto: rango del salto potencial; bias: multiplicador de los demás potenciales; k: precio relativo
export const BREEDS = {
  sillaArg: { name: 'Silla Argentino', shape: { heavy: 0.15 }, size: 1.0, salto: [1.25, 1.62], bias: { resistencia: 1.05, coraje: 1.05 }, coats: ['zaino', 'alazan', 'zainoOscuro', 'tordillo', 'negro', 'overo'], k: 1, desc: 'Deportivo argentino: equilibrado y valiente.' },
  kwpn: { name: 'KWPN', shape: { heavy: 0.1 }, size: 1.02, salto: [1.3, 1.66], bias: { tecnica: 1.08, agilidad: 1.05 }, coats: ['zaino', 'zainoOscuro', 'alazan', 'negro', 'tordillo'], k: 1.1, desc: 'Caballo de deporte holandés: técnica y elasticidad.' },
  holsteiner: { name: 'Holsteiner', shape: { heavy: 0.22 }, size: 1.03, salto: [1.3, 1.68], bias: { coraje: 1.1, resistencia: 1.05, velocidad: 0.95 }, coats: ['zaino', 'tordillo', 'zainoOscuro', 'negro'], k: 1.1, desc: 'Potente y con mucho coraje frente a los obstáculos.' },
  selle: { name: 'Selle Français', shape: { heavy: 0.05 }, size: 1.01, salto: [1.3, 1.68], bias: { velocidad: 1.08, agilidad: 1.05 }, coats: ['alazan', 'zaino', 'alazanTostado', 'palomino'], k: 1.1, desc: 'Rápido y ágil, criado para el salto.' },
  hanover: { name: 'Hannoveriano', shape: { heavy: 0.18 }, size: 1.03, salto: [1.28, 1.64], bias: { tecnica: 1.08, resistencia: 1.05 }, coats: ['zaino', 'negro', 'alazan', 'zainoOscuro'], k: 1.05, desc: 'Elegante y regular: pocas faltas.' },
  psi: { name: 'Pura Sangre', shape: { fine: 0.5 }, size: 1.0, salto: [1.15, 1.45], bias: { velocidad: 1.18, agilidad: 1.05, tecnica: 0.92, coraje: 0.95 }, coats: ['zaino', 'alazan', 'zainoOscuro', 'negro', 'tordillo'], k: 0.9, desc: 'El más veloz: gana tiempo en el galope.' },
  arabe: { name: 'Árabe', shape: { fine: 1 }, size: 0.93, salto: [1.05, 1.35], bias: { resistencia: 1.2, agilidad: 1.12, velocidad: 1.05, tecnica: 0.95, coraje: 0.92 }, coats: ['tordoBlanco', 'tordillo', 'alazan', 'zaino', 'negro', 'rosillo'], k: 1.6, desc: 'Fino y resistente, de cabeza pequeña. Gira muy bien.' },
  percheron: { name: 'Percherón', shape: { heavy: 1 }, size: 1.08, salto: [0.95, 1.2], bias: { coraje: 1.2, resistencia: 1.12, velocidad: 0.78, agilidad: 0.8, tecnica: 0.92 }, coats: ['negro', 'tordillo', 'tordoBlanco'], k: 1.3, desc: 'Caballo de tiro: enorme, tranquilo y muy valiente. Salta poco.' },
  frison: { name: 'Frisón', shape: { heavy: 0.65 }, size: 1.04, salto: [1.0, 1.28], bias: { coraje: 1.1, resistencia: 1.05, velocidad: 0.88, agilidad: 0.9 }, coats: ['negro'], k: 2.2, desc: 'Negro azabache y majestuoso.' },
  criollo: { name: 'Criollo', shape: { heavy: 0.4 }, size: 0.93, salto: [1.0, 1.3], bias: { resistencia: 1.22, coraje: 1.15, agilidad: 1.05, velocidad: 0.92 }, coats: ['gateado', 'bayo', 'moro', 'rosillo', 'overo', 'zaino', 'isabelino', 'pintoNegro'], k: 1.1, desc: 'Rústico y resistente: el caballo de campo argentino.' },
  cuarto: { name: 'Cuarto de Milla', shape: { heavy: 0.35 }, size: 0.97, salto: [1.05, 1.35], bias: { agilidad: 1.15, velocidad: 1.08, resistencia: 0.92 }, coats: ['alazan', 'alazanTostado', 'bayo', 'palomino', 'rosillo', 'moro'], k: 1.1, desc: 'Arranque explosivo y giros cerrados.' },
  andaluz: { name: 'Andaluz', shape: { heavy: 0.3 }, size: 1.0, salto: [1.1, 1.4], bias: { tecnica: 1.12, agilidad: 1.08, coraje: 1.05 }, coats: ['tordillo', 'tordoBlanco', 'negro', 'zaino'], k: 1.5, desc: 'Noble y armonioso, de mucha técnica.' },
  appaloosa: { name: 'Appaloosa', shape: { heavy: 0.2 }, size: 0.98, salto: [1.05, 1.38], bias: { resistencia: 1.08, coraje: 1.05 }, coats: ['appaloosa'], k: 1.3, desc: 'Con su manta de lunares, inconfundible.' },
};
const BREED_BY_NAME = Object.fromEntries(Object.entries(BREEDS).map(([k, B]) => [B.name, k]));
const BREED_ES_NAME = Object.fromEntries(Object.entries(BREEDS).map(([k, B]) => [k, B.name]));
// en español siempre (lo que se guarda en el perfil)
function breedNameEs(h) { return h.breedName || BREED_ES_NAME[h.bk] || h.breed || ''; }
export function breedName(h) { return crossName(h.breedName) || BREEDS[h.bk]?.name || crossName(h.breed) || ''; }
// apariencia para el modelo (potrero, retratos, caballo activo)
export function looks(h) { return { key: `${h.id}|${h.coat}`, name: h.name, coat: COATS[h.coat] || COATS.zaino, marks: h.marks || {}, shape: h.shape || {}, size: h.size || 1 }; }
export function marksText(h) {
  const m = h.marks || {}, s = m.socks || [], n = s.filter((x) => x > 0).length, out = [];
  if (m.blaze === 1) out.push(L('estrella', 'star')); else if (m.blaze === 2) out.push(L('estrella con lista', 'star and stripe')); else if (m.blaze === 3) out.push(L('cara blanca', 'blaze'));
  if (n) out.push(lang() === 'en' ? (n === 4 ? 'four white socks' : n === 1 ? 'one white sock' : `${['', '', 'two', 'three'][n]} white socks`) : (n === 4 ? 'cuatro medias blancas' : n === 1 ? 'una media blanca' : `${['', '', 'dos', 'tres'][n]} medias blancas`));
  return out.join(L(' y ', ' and '));
}

const NAMES = ['Brisa', 'Lucero', 'Tango', 'Morena', 'Indio', 'Canela', 'Pampero', 'Alma', 'Tormenta', 'Nube', 'Gitana', 'Malbec', 'Duende', 'Estrella',
  'Rayo', 'Sombra', 'Chispa', 'Bonita', 'Cacique', 'Princesa', 'Cielo', 'Trueno', 'Luna Nueva', 'Gaucho', 'Perla', 'Salamanca', 'Ceibo', 'Bandido',
  'Paloma', 'Furia', 'Huella', 'Quimera', 'Coral', 'Fénix', 'Rosa', 'Titán', 'Azúcar', 'Lobo', 'Tala', 'Mística', 'Ombú', 'Victoria', 'Charrúa', 'Jazmín'];
function rngSeed(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function pickName(p, R) { const used = new Set(p.horses.map((h) => h.name)); const free = NAMES.filter((n) => !used.has(n)); return free.length ? free[(R() * free.length) | 0] : `${L('Potro', 'Foal')} ${p.day}`; }
function randMarks(R, heavySocks = 0) {
  const socks = [0, 0, 0, 0].map((_, i) => (R() < (i < 2 ? 0.22 : 0.32) + heavySocks ? [0.05, 0.1, 0.16][(R() * 3) | 0] : 0));
  const b = R(); return { socks, blaze: b < 0.5 ? 0 : b < 0.68 ? 1 : b < 0.85 ? 2 : 3 };
}
// valor de un caballo: el salto potencial manda (crece rápido arriba de 1,5 m), después el salto actual y el resto
export function valueOf(h) {
  const B = BREEDS[h.bk] || { k: 1 }, P = h.pot, avg = (P.tecnica + P.velocidad + P.agilidad + P.resistencia + P.coraje) / 5;
  let v = 150 + 700 * Math.exp(14 * (P.salto - 1.53)) + Math.max(0, h.stats.salto - 1.0) * 900 + Math.max(0, avg - 60) * 12;
  v *= (B.k || 1) * (h.age > 12 ? 0.7 : h.age < 6 ? 1.1 : 1);
  return Math.round(v / 10) * 10;
}
export function sellValue(h) { return Math.round(valueOf(h) * 0.55 / 10) * 10; }
// un caballo nuevo de una raza y un nivel (0 Club … 3 Gran Premio)
function genHorse(p, R, bk, tier, id) {
  const B = BREEDS[bk], q = Math.min(1, (tier + R() * 1.2) / 4.2);
  const potS = +(B.salto[0] + (B.salto[1] - B.salto[0]) * q).toFixed(2), age = 4 + ((R() * 8) | 0);
  const pot = { salto: potS }, stats = {};
  for (const s of ['tecnica', 'velocidad', 'agilidad', 'resistencia', 'coraje']) pot[s] = Math.round(clamp((62 + tier * 7 + R() * 10) * (B.bias[s] || 1), 40, 98));
  stats.salto = +Math.max(0.9, potS - (0.12 + R() * 0.2) * (age < 6 ? 1.3 : 1)).toFixed(2);
  for (const s of ['tecnica', 'velocidad', 'agilidad', 'resistencia', 'coraje']) stats[s] = Math.round(pot[s] * (0.55 + R() * 0.15 + Math.min(0.1, (age - 4) * 0.02)));
  const sx = R(), coat = B.coats[(R() * B.coats.length) | 0];
  const h = { id, name: pickName(p, R), bk, breed: B.name, coat, marks: randMarks(R, bk === 'percheron' || bk === 'frison' ? -0.15 : 0), shape: { ...B.shape }, size: B.size,
    age, sex: sx < 0.4 ? 'yegua' : sx < 0.75 ? 'castrado' : 'semental', stats, pot, league: Math.min(3, tier) };
  h.price = Math.round(valueOf(h) * (0.9 + R() * 0.2) / 10) * 10;
  return h;
}
// caballos destacados (siempre a la venta, por liga) y el mercado del día (cambia cada mañana)
export const MARKET = [
  { id: 'luna', name: 'Luna', bk: 'kwpn', coat: 'tordillo', marks: { socks: [0, 0, 0.1, 0], blaze: 1 }, age: 8, sex: 'yegua', price: 700, league: 0,
    stats: { salto: 1.22, tecnica: 52, velocidad: 46, agilidad: 58, resistencia: 50, coraje: 48 }, pot: { salto: 1.53, tecnica: 80, velocidad: 70, agilidad: 82, resistencia: 75, coraje: 72 } },
  { id: 'canela', name: 'Canela', bk: 'sillaArg', coat: 'alazan', marks: { socks: [0.1, 0.1, 0, 0], blaze: 3 }, age: 7, sex: 'yegua', price: 1600, league: 1,
    stats: { salto: 1.32, tecnica: 55, velocidad: 64, agilidad: 60, resistencia: 66, coraje: 58 }, pot: { salto: 1.56, tecnica: 82, velocidad: 88, agilidad: 84, resistencia: 86, coraje: 80 } },
  { id: 'dorado', name: 'Dorado', bk: 'selle', coat: 'palomino', marks: { socks: [0.1, 0.1, 0.1, 0.1], blaze: 2 }, age: 6, sex: 'semental', price: 2400, league: 1,
    stats: { salto: 1.28, tecnica: 50, velocidad: 70, agilidad: 64, resistencia: 56, coraje: 62 }, pot: { salto: 1.62, tecnica: 86, velocidad: 92, agilidad: 88, resistencia: 84, coraje: 86 } },
  { id: 'onix', name: 'Ónix', bk: 'holsteiner', coat: 'negro', marks: { socks: [0, 0, 0, 0], blaze: 1 }, age: 9, sex: 'castrado', price: 6000, league: 2,
    stats: { salto: 1.45, tecnica: 66, velocidad: 58, agilidad: 56, resistencia: 70, coraje: 70 }, pot: { salto: 1.66, tecnica: 90, velocidad: 78, agilidad: 80, resistencia: 90, coraje: 90 } },
  { id: 'pampa', name: 'Pampa', bk: 'sillaArg', coat: 'overo', marks: { socks: [0, 0, 0, 0], blaze: 0 }, age: 10, sex: 'castrado', price: 10000, league: 3,
    stats: { salto: 1.55, tecnica: 74, velocidad: 72, agilidad: 70, resistencia: 76, coraje: 78 }, pot: { salto: 1.70, tecnica: 94, velocidad: 90, agilidad: 90, resistencia: 92, coraje: 94 } },
];
for (const M of MARKET) { const B = BREEDS[M.bk]; Object.defineProperty(M, 'breed', { get: () => B.name, enumerable: true, configurable: true }); M.shape = { ...B.shape }; M.size = B.size; }
// seis ofertas por día: dos de tu liga, dos más baratas, una de la liga siguiente (para soñar) y una raza especial
const SPECIAL = ['percheron', 'arabe', 'frison', 'criollo', 'cuarto', 'andaluz', 'appaloosa', 'psi'];
export function marketToday(p) {
  p.market = p.market && p.market.day === p.day ? p.market : { day: p.day, bought: [] };
  const R = rngSeed(p.day * 7919 + 13 + p.league * 101), keys = Object.keys(BREEDS), out = [];
  const tiers = [p.league, p.league, Math.max(0, p.league - 1), Math.max(0, p.league - 1), Math.min(3, p.league + 1), -1];
  const ghost = { ...p, horses: [...p.horses] };
  tiers.forEach((tier, i) => {
    const bk = tier < 0 ? SPECIAL[(R() * SPECIAL.length) | 0] : keys[(R() * keys.length) | 0];
    const h = genHorse(ghost, R, bk, tier < 0 ? p.league : tier, `m${p.day}-${i}`);
    ghost.horses.push(h); out.push(h);
  });
  return out.filter((h) => !p.market.bought.includes(h.id));
}
export function offerOf(p, id) { return MARKET.find((x) => x.id === id) || marketToday(p).find((x) => x.id === id) || null; }

// ---------------------------------------------------------------- establo: boxes, mozo de cuadra
export const BOX_PRICES = [0, 0, 0, 700, 1200, 2000, 3200, 5000];   // precio del box siguiente según cuántos hay
export const BOX_MAX = 8;
export function boxPrice(p) { return BOX_PRICES[p.boxes] || 0; }
export function freeBoxes(p) { return p.boxes - p.horses.length - (p.breeding || []).length; }
export function buyBox(p) { const c = boxPrice(p); if (p.boxes >= BOX_MAX || p.coins < c) return false; p.coins -= c; p.boxes++; addLog(p, bi(`Ampliaste el establo: ${p.boxes} boxes.`, `You expanded the stable: ${p.boxes} stalls.`)); return true; }
export const MOZO_WAGE = 12;                     // por día y por cada caballo que no es el activo
export function mozoWage(p) { return p.staff && p.staff.mozo ? MOZO_WAGE * Math.max(0, p.horses.length - 1) : 0; }

// ---------------------------------------------------------------- cría
// sementales de la cabaña vecina (se pagan por servicio); se abren por liga
export const STUDS = [
  { id: 'st-gaucho', name: 'Gaucho Viejo', bk: 'criollo', coat: 'gateado', marks: { socks: [0, 0, 0, 0], blaze: 0 }, fee: 250, league: 0, pot: { salto: 1.32, tecnica: 70, velocidad: 72, agilidad: 84, resistencia: 95, coraje: 92 } },
  { id: 'st-goliat', name: 'Goliat', bk: 'percheron', coat: 'tordillo', marks: { socks: [0, 0, 0, 0], blaze: 1 }, fee: 300, league: 0, pot: { salto: 1.2, tecnica: 68, velocidad: 60, agilidad: 62, resistencia: 92, coraje: 97 } },
  { id: 'st-sultan', name: 'Sultán', bk: 'arabe', coat: 'tordoBlanco', marks: { socks: [0, 0, 0, 0], blaze: 1 }, fee: 600, league: 0, pot: { salto: 1.36, tecnica: 76, velocidad: 86, agilidad: 92, resistencia: 97, coraje: 74 } },
  { id: 'st-tormenta', name: 'Huracán', bk: 'psi', coat: 'zainoOscuro', marks: { socks: [0, 0, 0.1, 0], blaze: 2 }, fee: 900, league: 1, pot: { salto: 1.48, tecnica: 76, velocidad: 97, agilidad: 86, resistencia: 84, coraje: 78 } },
  { id: 'st-bandolero', name: 'Bandolero', bk: 'andaluz', coat: 'tordillo', marks: { socks: [0, 0, 0, 0], blaze: 0 }, fee: 1200, league: 1, pot: { salto: 1.46, tecnica: 92, velocidad: 80, agilidad: 90, resistencia: 84, coraje: 86 } },
  { id: 'st-fantasma', name: 'Fantasma', bk: 'frison', coat: 'negro', marks: { socks: [0, 0, 0, 0], blaze: 0 }, fee: 1500, league: 1, pot: { salto: 1.34, tecnica: 82, velocidad: 76, agilidad: 78, resistencia: 88, coraje: 92 } },
  { id: 'st-quidam', name: 'Quidam', bk: 'holsteiner', coat: 'zaino', marks: { socks: [0.1, 0.1, 0.16, 0.16], blaze: 3 }, fee: 2500, league: 2, pot: { salto: 1.7, tecnica: 93, velocidad: 86, agilidad: 88, resistencia: 92, coraje: 96 } },
  { id: 'st-diamante', name: 'Diamante', bk: 'kwpn', coat: 'negro', marks: { socks: [0, 0, 0.05, 0], blaze: 1 }, fee: 4000, league: 3, pot: { salto: 1.76, tecnica: 96, velocidad: 90, agilidad: 94, resistencia: 90, coraje: 92 } },
];
for (const S of STUDS) { const B = BREEDS[S.bk]; Object.defineProperty(S, 'breed', { get: () => B.name, enumerable: true, configurable: true }); S.shape = { ...B.shape }; S.size = B.size; S.sex = 'semental'; S.stats = { ...S.pot }; S.age = 10; }
export const BREED_DAYS = 3, MARE_REST = 5, OWN_SIRE_FEE = 80;
export function sireOf(p, id) { const own = p.horses.find((h) => h.id === id && h.sex === 'semental'); return own ? { ...own, fee: OWN_SIRE_FEE, own: true } : STUDS.find((s) => s.id === id) || null; }
// por qué no se puede cruzar (o '')
export function breedCheck(p, mareId, sireId) {
  if (!p.owned.haras) return L('Primero construye la yeguada (Tienda, sección Rancho).', 'First build the stud farm (Shop, Ranch section).');
  const m = p.horses.find((h) => h.id === mareId), s = sireOf(p, sireId);
  if (!m || m.sex !== 'yegua') return L('Elige una de tus yeguas.', 'Pick one of your mares.');
  if (!s) return L('Elige un semental.', 'Pick a stallion.');
  if (s.league > p.league) return L(`${s.name} se abre en la liga ${LEAGUES[s.league].name}.`, `${s.name} unlocks in the ${LEAGUES[s.league].name} league.`);
  if (m.age < 4) return L(`${m.name} todavía es muy joven.`, `${m.name} is still too young.`);
  if ((p.breeding || []).some((b) => b.mare === m.id)) return L(`${m.name} ya espera un potrillo.`, `${m.name} is already expecting a foal.`);
  if ((m.bredDay ?? -99) + MARE_REST > p.day) return L(`${m.name} descansa hasta el día ${m.bredDay + MARE_REST}.`, `${m.name} is resting until day ${m.bredDay + MARE_REST}.`);
  if (freeBoxes(p) < 1) return L('No hay box libre para el potrillo: amplía el establo.', 'There is no free stall for the foal: expand the stable.');
  if (p.coins < s.fee) return L(`El servicio cuesta ${s.fee} monedas.`, `The breeding fee is ${s.fee} coins.`);
  return '';
}
// lo que se puede esperar del potrillo (salto potencial)
export function foalRange(p, mareId, sireId) {
  const m = p.horses.find((h) => h.id === mareId), s = sireOf(p, sireId); if (!m || !s) return null;
  const avg = (m.pot.salto + s.pot.salto) / 2;
  return { lo: +Math.max(0.95, avg * 0.975).toFixed(2), hi: +Math.min(1.8, avg * 1.035).toFixed(2), cruza: m.bk !== s.bk };
}
export function startBreeding(p, mareId, sireId) {
  if (breedCheck(p, mareId, sireId)) return false;
  const m = p.horses.find((h) => h.id === mareId), s = sireOf(p, sireId);
  p.coins -= s.fee; m.bredDay = p.day;
  p.breeding = p.breeding || [];
  p.breeding.push({ mare: m.id, mareName: m.name, sire: s.id, sireName: s.name, due: p.day + BREED_DAYS, seed: (p.day * 131 + p.breeding.length * 17 + m.id.length * 7) >>> 0 });
  addLog(p, bi(`${m.name} × ${s.name}: el potrillo llega el día ${p.day + BREED_DAYS}.`, `${m.name} × ${s.name}: the foal arrives on day ${p.day + BREED_DAYS}.`));
  return true;
}
function makeFoal(p, b) {
  const R = rngSeed(b.seed + 1), m = p.horses.find((h) => h.id === b.mare) || p.horses[0], s = sireOf(p, b.sire) || STUDS[0];
  const same = m.bk && m.bk === s.bk, bk = same ? m.bk : 'cruza';
  const pot = {}, stats = {};
  pot.salto = +Math.min(1.8, ((m.pot.salto + s.pot.salto) / 2) * (0.975 + R() * 0.06)).toFixed(2);
  for (const k of ['tecnica', 'velocidad', 'agilidad', 'resistencia', 'coraje']) pot[k] = Math.round(clamp(((m.pot[k] + s.pot[k]) / 2) * (0.97 + R() * 0.09), 40, 99));
  stats.salto = +Math.max(0.9, pot.salto - 0.42 + R() * 0.08).toFixed(2);
  for (const k of ['tecnica', 'velocidad', 'agilidad', 'resistencia', 'coraje']) stats[k] = Math.round(pot[k] * (0.45 + R() * 0.1));
  const shape = { heavy: +(((m.shape?.heavy || 0) + (s.shape?.heavy || 0)) / 2).toFixed(2), fine: +(((m.shape?.fine || 0) + (s.shape?.fine || 0)) / 2).toFixed(2) };
  const cr = R(), coat = cr < 0.45 ? m.coat : cr < 0.9 ? s.coat : (BREEDS[m.bk] || BREEDS.sillaArg).coats[(R() * (BREEDS[m.bk] || BREEDS.sillaArg).coats.length) | 0];
  const ms = m.marks?.socks || [0, 0, 0, 0], ss = s.marks?.socks || [0, 0, 0, 0], rm = randMarks(R);
  const marks = { socks: [0, 1, 2, 3].map((i) => { const r = R(); return r < 0.4 ? ms[i] : r < 0.8 ? ss[i] : rm.socks[i]; }), blaze: R() < 0.4 ? (m.marks?.blaze || 0) : R() < 0.7 ? (s.marks?.blaze || 0) : rm.blaze };
  const id = `f${p.day}-${(R() * 1e6) | 0}`;
  return newHorse({ id, name: pickName(p, R), bk, breed: same ? BREED_ES_NAME[bk] : 'Cruza', breedName: same ? undefined : `Cruza ${breedNameEs(m)} × ${breedNameEs(s)}`,
    coat, marks, shape, size: +(((m.size || 1) + (s.size || 1)) / 2).toFixed(2), age: 3, sex: R() < 0.5 ? 'yegua' : 'semental', stats, pot },
  { bond: 30, needs: { energia: 90, animo: 85, salud: 100, limpieza: 70, comida: 70, agua: 70 }, dirt: 0.25, born: p.day, parents: `${m.name} × ${s.name}` });
}
// venta y nombre
export function canSell(p, id) {
  const h = p.horses.find((x) => x.id === id); if (!h) return L('No está en tu establo.', 'It is not in your stable.');
  if (h.id === 'henry') return L('Henry es de la familia: no se vende.', 'Henry is family: he is not for sale.');
  if ((p.breeding || []).some((b) => b.mare === id)) return L(`${h.name} espera un potrillo.`, `${h.name} is expecting a foal.`);
  return '';
}
export function sellHorse(p, id) {
  if (canSell(p, id)) return 0;
  const h = p.horses.find((x) => x.id === id), v = sellValue(h);
  p.horses = p.horses.filter((x) => x.id !== id); delete p.tasks[id];
  if (p.active === id) p.active = p.horses[0].id;
  p.coins += v; addLog(p, bi(`Vendiste a ${h.name} por ${v} monedas.`, `You sold ${h.name} for ${v} coins.`));
  return v;
}
export function renameHorse(p, id, name) {
  const h = p.horses.find((x) => x.id === id), n = String(name || '').replace(/\s+/g, ' ').trim();
  if (!h || n.length < 2 || n.length > 16) return L('El nombre debe tener entre 2 y 16 letras.', 'The name must be 2 to 16 characters long.');
  if (p.horses.some((x) => x.id !== id && x.name.toLowerCase() === n.toLowerCase())) return L('Ya tienes un caballo con ese nombre.', 'You already have a horse with that name.');
  h.name = n; return '';
}
// caballos en pensión (de vecinos): le dan vida al potrero cuando tienes pocos
export const BOARDERS = [
  { id: 'b-tango', name: 'Tango', bk: 'criollo', coat: 'gateado', marks: { socks: [0, 0, 0.05, 0], blaze: 0 } },
  { id: 'b-morena', name: 'Morena', bk: 'percheron', coat: 'tordoBlanco', marks: { socks: [0, 0, 0, 0], blaze: 0 } },
];
for (const B of BOARDERS) { B.shape = { ...BREEDS[B.bk].shape }; B.size = BREEDS[B.bk].size; }

// ---------------------------------------------------------------- inglés (22-10-2026)
// Las tablas guardan el español; acá cada nombre y descripción pasa a ser un getter que devuelve el texto
// del idioma actual (JETIdioma). Así el cambio de idioma en vivo no necesita recargar nada.
// los dos idiomas de un nombre de tabla (para el registro, que guarda ambos)
const both = (o, f = 'name') => (o && o['_' + f]) || { es: o ? o[f] : '', en: o ? o[f] : '' };
function loc(tbl, en) {
  for (const [k, o] of Object.entries(en)) {
    const t = tbl[k]; if (!t) continue;
    for (const [f, v] of Object.entries(o)) {
      const es = t[f];
      Object.defineProperty(t, f, { get: () => (lang() === 'en' ? v : es), enumerable: true, configurable: true });
      Object.defineProperty(t, '_' + f, { value: { es, en: v }, enumerable: false, configurable: true });
    }
  }
}
loc(COATS, {
  zaino: { name: 'Bay' }, alazan: { name: 'Chestnut' }, negro: { name: 'Black' }, tordillo: { name: 'Grey' }, palomino: { name: 'Palomino' },
  overo: { name: 'Pinto' }, zainoOscuro: { name: 'Dark bay' }, alazanTostado: { name: 'Liver chestnut' }, tordoBlanco: { name: 'White grey' },
  bayo: { name: 'Buckskin' }, gateado: { name: 'Dun' }, rosillo: { name: 'Red roan' }, moro: { name: 'Blue roan' }, appaloosa: { name: 'Appaloosa' },
  isabelino: { name: 'Cremello' }, pintoNegro: { name: 'Black pinto' },
});
loc(STATS, {
  salto: { name: 'Jumping', desc: 'How high it can jump with room to spare. It decides which shows it can enter.' },
  tecnica: { name: 'Technique', desc: 'Tucks its legs neatly: fewer knockdowns and a wider jump window.' },
  velocidad: { name: 'Speed', desc: 'A faster canter: better times.' },
  agilidad: { name: 'Agility', desc: 'Tighter turns and less confidence lost on the bends.' },
  resistencia: { name: 'Stamina', desc: 'More confidence in reserve and less fatigue at the end of the round.' },
  coraje: { name: 'Courage', desc: 'Fewer refusals when confidence drops.' },
});
loc(NEEDS, { energia: { name: 'Energy' }, animo: { name: 'Mood' }, salud: { name: 'Health' }, limpieza: { name: 'Cleanliness' }, comida: { name: 'Food' }, agua: { name: 'Water' } });
loc(Object.fromEntries(LEAGUES.map((Lg) => [Lg.key, Lg])), { club: { name: 'Club' }, nacional: { name: 'National' }, patrocinada: { name: 'Sponsored' }, gp: { name: 'Grand Prix' } });
{
  const EV = {
    club1: 'Debut', club2: 'Club Cup', club3: 'Spring Prize', clubQ: 'Club Qualifier',
    nac1: 'Regional Cup', nac2: 'Autumn Cup', nac3: 'National Trophy', nacQ: 'National Qualifier',
    pat1: 'Sponsors Cup', pat2: 'Summer Derby', pat3: 'International Prize', patQ: 'Sponsored Qualifier',
    gp1: 'City Grand Prix', gp2: 'Nations Grand Prix', gp3: 'Grand Prix Final',
  };
  const all = {}; for (const Lg of LEAGUES) for (const E of [...Lg.events, ...(Lg.qual ? [Lg.qual] : [])]) all[E.key] = E;
  loc(all, Object.fromEntries(Object.entries(EV).map(([k, v]) => [k, { name: v }])));
}
loc(TRAININGS, {
  plano: { name: 'Flatwork', desc: 'Ride through the cone gates in order.' },
  gimnasia: { name: 'Gymnastics', desc: 'Jump the practice fences without knockdowns.' },
  galope: { name: 'Endurance canter', desc: 'Ride two laps of the arena without breaking the canter.' },
  altura: { name: 'High jump', desc: 'Jump fences at your horse’s maximum height.' },
});
loc(TASKS, {
  limpiarBox: { name: 'Muck out the stall', desc: 'Remove the manure and lay fresh bedding.' },
  agua: { name: 'Fresh water', desc: 'Fill the bucket up to the line.' },
  comida: { name: 'Feed', desc: 'Prepare the feed: hay and, if you have them, oats or a treat.' },
  cepillar: { name: 'Brush', desc: 'Remove the mud and dust from the coat.' },
  cascos: { name: 'Pick out the hooves', desc: 'Remove stones and mud from all four hooves.' },
  duchar: { name: 'Shower', desc: 'After the effort, rinse off the sweat with water.' },
  ensillar: { name: 'Tack up', desc: 'Put on the saddle pad and the saddle, and tighten the girth.' },
});
loc(SKILLS, {
  ojo: { name: 'Eye', desc: 'Wider jump window: “Jump now” appears earlier and lasts longer.' },
  equilibrio: { name: 'Balance', desc: 'More clearance over the rails: fewer knockdowns.' },
  temple: { name: 'Composure', desc: 'Keeps the horse calm: its confidence drops less.' },
  giros: { name: 'Turning', desc: 'Tighter turns at the canter.' },
});
loc(SHOP, {
  cepilloBlando: { name: 'Wide brush', desc: 'A wider brush: you clean faster.' },
  rasqueta: { name: 'Rubber curry comb', desc: 'Removes more mud with every stroke.' },
  champu: { name: 'Shampoo (5 showers)', desc: 'The shower lifts the mood more.' },
  limpiacascos: { name: 'Steel hoof pick', desc: 'Every stroke removes more mud.' },
  manta: { name: 'Stable blanket', desc: 'At night the horse gets half as dirty.' },
  veterinario: { name: 'Vet visit', desc: 'Checks your active horse: +40 health.' },
  zanahorias: { name: 'Carrots (5)', desc: 'A treat in the feed: +mood and +bond.' },
  avena: { name: 'Premium oats (5)', desc: 'The feed restores more energy.' },
  suplemento: { name: 'Mineral supplement (5)', desc: 'Every feed adds health.' },
  protectores: { name: 'Tendon boots', desc: '+12 technique at shows: fewer knockdowns.' },
  monturaPro: { name: 'Pro jumping saddle', desc: '+6 agility, tighter turns and +10 starting confidence.' },
  cueroNegro: { name: 'Black leather', desc: 'Black saddle and bridle (cosmetic).' },
  cueroHabano: { name: 'Havana leather', desc: 'Havana brown saddle and bridle (cosmetic).' },
  boxAmplio: { name: 'Large stall', desc: 'At night the horse recovers +15 energy.' },
  gimnasio: { name: 'Gymnastics arena', desc: 'Unlocks the Gymnastics and High jump training sessions.' },
  duchaCaliente: { name: 'Warm-water shower', desc: 'The shower adds health and more mood.' },
  bebedero: { name: 'Automatic waterer', desc: 'Stall water never drops below 50 overnight.' },
  pistaPro: { name: 'Pro sand arena', desc: 'Training sessions are 20% more effective.' },
  caminador: { name: 'Horse walker', desc: 'At night every horse recovers +8 energy.' },
  haras: { name: 'Stud farm (breeding barn)', desc: 'Unlocks breeding: cross your mares with stallions.' },
});
loc(BREEDS, {
  sillaArg: { name: 'Argentine Warmblood', desc: 'Argentine sport horse: balanced and brave.' },
  kwpn: { desc: 'Dutch sport horse: technique and elasticity.' },
  holsteiner: { desc: 'Powerful and very brave in front of the fences.' },
  selle: { desc: 'Fast and agile, bred for jumping.' },
  hanover: { name: 'Hanoverian', desc: 'Elegant and consistent: few faults.' },
  psi: { name: 'Thoroughbred', desc: 'The fastest: it gains time at the canter.' },
  arabe: { name: 'Arabian', desc: 'Fine and hardy, with a small head. It turns very well.' },
  percheron: { name: 'Percheron', desc: 'Draft horse: huge, calm and very brave. It does not jump high.' },
  frison: { name: 'Friesian', desc: 'Jet black and majestic.' },
  criollo: { name: 'Criollo', desc: 'Rugged and hardy: the Argentine ranch horse.' },
  cuarto: { name: 'Quarter Horse', desc: 'Explosive starts and tight turns.' },
  andaluz: { name: 'Andalusian', desc: 'Noble and harmonious, with great technique.' },
  appaloosa: { desc: 'Unmistakable, with its spotted blanket.' },
});
const GROOM_TITLES_EN = ['Apprentice', 'Helper', 'Groom', 'Expert groom', 'Head groom', 'Master groom'];
export function groomTitle(lv) { return (lang() === 'en' ? GROOM_TITLES_EN : GROOM_TITLES)[lv] || ''; }
const SEX = { yegua: ['yegua', 'mare'], castrado: ['castrado', 'gelding'], semental: ['semental', 'stallion'] };
export function sexName(s) { const v = SEX[s]; return v ? L(v[0], v[1]) : s || ''; }
// nombres de raza en español → inglés, para las cruzas guardadas como texto («Cruza Árabe × Criollo»)
const BREED_EN = Object.fromEntries(Object.keys(BREEDS).map((k) => [BREED_ES_NAME[k], k]));
function crossName(s) {
  if (lang() !== 'en' || typeof s !== 'string') return s;
  return s.replace(/^Cruza\b/, 'Cross').split(' × ').map((part) => {
    const pre = part.startsWith('Cross ') ? 'Cross ' : '', n = pre ? part.slice(6) : part, k = BREED_EN[n];
    return pre + (k ? BREEDS[k].name : n === 'Cruza' ? 'Cross' : n);
  }).join(' × ');
}

// ---------------------------------------------------------------- utilidades
export const clamp = (x, a = 0, b = 100) => (x < a ? a : x > b ? b : x);
// concordancia con el sexo del caballo: g(h, 'cansado', 'cansada')
export function g(h, m, f) { return h && h.sex === 'yegua' ? f : m; }
export function horseOf(p, id = p.active) { return p.horses.find((h) => h.id === id) || p.horses[0]; }
export function has(p, item) { return !!p.owned[item] || (p.inv[item] || 0) > 0; }
export function addLog(p, t) { p.log.push({ day: p.day, t }); if (p.log.length > 60) p.log.shift(); }
export function tasksOf(p, h = horseOf(p)) { return (p.tasks[h.id] = p.tasks[h.id] || {}); }
// por qué una tarea no está disponible ahora (o '' si se puede hacer)
export function taskLock(h, k) {
  if (k === 'duchar' && h.sweat < 0.05) return L('Solo después de un concurso o un entrenamiento.', 'Only after a show or a training session.');
  if (k === 'ensillar' && h.tack.saddled) return L(`Ya está ${g(h, 'ensillado', 'ensillada')}.`, 'Already tacked up.');
  return '';
}
// tareas que quedan hoy con ese caballo (la misma cuenta para la insignia y el objetivo)
export function pendingTasks(p, h = horseOf(p)) { const d = tasksOf(p, h); return Object.keys(TASKS).filter((k) => !d[k] && !taskLock(h, k)); }
// lista con «y»: a, b y c
export function careLeft(p, h = horseOf(p)) { return pendingTasks(p, h).filter((k) => k !== 'ensillar'); }
export function list(a) { return a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')}${L(' y ', ' and ')}${a[a.length - 1]}`; }
// la limpieza (necesidad) sale del barro y el sudor que se ven en el pelaje
export function updateLimpieza(h) { h.needs.limpieza = Math.round(clamp(100 - h.dirt * 75 - h.sweat * 30)); }

// ---------------------------------------------------------------- perfil
function newHorse(M, extra = {}) {
  const B = BREEDS[M.bk] || {};
  return { id: M.id, name: M.name, coat: M.coat, bk: M.bk, breed: M.breed || B.name, breedName: M.breedName, marks: M.marks || { socks: [0, 0, 0, 0], blaze: 0 },
    shape: { ...(M.shape || B.shape || {}) }, size: M.size || B.size || 1, age: M.age, sex: M.sex, stats: { ...M.stats }, pot: { ...M.pot },
    needs: { energia: 80, animo: 65, salud: 95, limpieza: 60, comida: 60, agua: 60 }, bond: 5, tack: { saddled: false },
    dirt: 0.4, sweat: 0, wet: 0, hooves: [0.5, 0.5, 0.5, 0.5], manure: 0, bedding: 1, trainedToday: {}, showsToday: 0, history: [], ...extra };
}
function henry() {
  return newHorse({ id: 'henry', name: 'Henry', coat: 'zaino', bk: 'sillaArg', breed: 'Silla Argentino', age: 9, sex: 'castrado',
    stats: { salto: 1.10, tecnica: 42, velocidad: 45, agilidad: 44, resistencia: 46, coraje: 45 },
    pot: { salto: 1.48, tecnica: 82, velocidad: 78, agilidad: 80, resistencia: 82, coraje: 80 } },
  { needs: { energia: 85, animo: 70, salud: 90, limpieza: 35, comida: 45, agua: 40 }, bond: 20, dirt: 0.75, hooves: [0.8, 0.7, 0.9, 0.6], manure: 4, bedding: 0.35 });
}
export function newProfile() {
  return {
    version: VERSION, created: Date.now(), coins: 300, day: 1, rep: {}, stars: {}, league: 0, qualified: [], today: { shows: {} },
    rider: { name: '', xp: 0, points: 0, skills: { ojo: 0, equilibrio: 0, temple: 0, giros: 0 }, starts: 0, wins: 0, clears: 0 },
    groom: { xp: 0, total: 0 }, tasks: {}, leather: null,
    horses: [henry()], active: 'henry',
    inv: { zanahorias: 3 }, owned: {}, log: [{ day: 1, t: bi('Llegaste al rancho con Henry. Está sucio y tiene hambre: empieza por el establo.', 'You arrived at the ranch with Henry. He is dirty and hungry: start at the stable.') }],
    pending: null, boxes: 3, staff: { mozo: false }, breeding: [], market: null,
  };
}
// guardado: se valida y se completa lo que falte (un perfil roto no debe romper el juego)
export function load() {
  let p = null;
  try { p = JSON.parse(localStorage.getItem(KEY)); } catch { p = null; }
  if (!p || typeof p !== 'object' || !Array.isArray(p.horses)) return null;
  p.horses = p.horses.filter((h) => h && typeof h === 'object' && h.id && h.name);
  if (!p.horses.length) return null;
  const base = newProfile();
  for (const k of Object.keys(base)) if (p[k] == null) p[k] = base[k];
  p.rider = { ...base.rider, ...p.rider, skills: { ...base.rider.skills, ...(p.rider.skills || {}) } };
  p.groom = { ...base.groom, ...p.groom }; p.today = { shows: {}, ...p.today }; p.today.shows = p.today.shows || {};
  for (const k of ['rep', 'stars', 'tasks', 'inv', 'owned']) if (typeof p[k] !== 'object') p[k] = base[k];
  if (!Array.isArray(p.qualified)) p.qualified = [];
  if (p.version === 1) { p.tasks = { [p.active]: (p.groom && p.groom.tasksToday) || {} }; if (p.groom) delete p.groom.tasksToday; p.today = { shows: {} }; p.version = VERSION;
    if (p.owned.cueroHavana) { p.owned.cueroHabano = true; delete p.owned.cueroHavana; }
    if (!p.leather) p.leather = p.horses.find((h) => h.tack && h.tack.leather)?.tack.leather || null; }
  if (p.version === 2) p.version = VERSION;
  p.boxes = Math.max(3, p.boxes || 0, p.horses.length); p.staff = { mozo: false, ...(p.staff || {}) }; if (!Array.isArray(p.breeding)) p.breeding = [];
  for (const h of p.horses) {
    // razas (v3): los caballos de antes toman la suya por el nombre
    if (!h.bk) { const M = MARKET.find((x) => x.id === h.id); h.bk = M ? M.bk : BREED_BY_NAME[h.breed] || 'sillaArg'; if (M && !h.marks) h.marks = M.marks; }
    if (!h.marks) h.marks = { socks: [0, 0, 0, 0], blaze: 0 };
    if (!h.shape) h.shape = { ...(BREEDS[h.bk]?.shape || {}) }; if (!h.size) h.size = BREEDS[h.bk]?.size || 1;
    h.trainedToday = h.trainedToday || {}; h.tack = h.tack || { saddled: false }; if (!Array.isArray(h.hooves)) h.hooves = [0.5, 0.5, 0.5, 0.5]; h.history = h.history || []; h.showsToday = h.showsToday || 0;
    h.needs = { ...base.horses[0].needs, ...(h.needs || {}) }; h.stats = { ...base.horses[0].stats, ...(h.stats || {}) }; h.pot = { ...base.horses[0].pot, ...(h.pot || {}) };
    for (const k of ['dirt', 'sweat', 'wet']) if (!(h[k] >= 0)) h[k] = 0;
  }
  if (!p.horses.some((h) => h.id === p.active)) p.active = p.horses[0].id;
  p.qualified = [...new Set(p.qualified)];
  if (!(p.coins >= 0)) p.coins = 0;
  return p;
}
export function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} }
export function reset() { try { localStorage.removeItem(KEY); } catch {} }

// ---------------------------------------------------------------- estado del caballo
// Forma: cuánto rinde hoy (0,70–1,05) según las necesidades; el descuido se nota en la pista
export function form(h) {
  const N = h.needs;
  const k = (N.energia * 0.3 + N.animo * 0.15 + N.salud * 0.25 + N.comida * 0.15 + N.agua * 0.15) / 100;
  return 0.7 + 0.35 * k;
}
export function formWord(f) { return f >= 0.98 ? L('Excelente', 'Excellent') : f >= 0.9 ? L('Buena', 'Good') : f >= 0.8 ? L('Regular', 'Fair') : L('Mala', 'Poor'); }
export function readiness(h) {
  const N = h.needs, issues = [];
  if (N.energia < 30) issues.push(L(`está ${g(h, 'cansado', 'cansada')}`, 'is tired'));
  if (N.salud < 40) issues.push(L(`no está ${g(h, 'sano', 'sana')}`, 'is not healthy'));
  if (N.comida < 20) issues.push(L('tiene hambre', 'is hungry'));
  if (N.agua < 20) issues.push(L('tiene sed', 'is thirsty'));
  return issues;
}
// motivo por el que no puede ir a un concurso (o null)
export function cantCompete(p, h, E) {
  const L = leagueOf(E.key);
  const t = (es, en) => (lang() === 'en' ? en : es);    // (L es la liga en esta función)
  if (!eligible(h, E)) return t(`Necesita salto de ${fmtStat('salto', E.h - ELIGIBLE_MARGIN)} (${h.name}: ${fmtStat('salto', h.stats.salto)}).`, `Needs ${fmtStat('salto', E.h - ELIGIBLE_MARGIN)} jumping (${h.name}: ${fmtStat('salto', h.stats.salto)}).`);
  if (h.needs.salud < 40) return t(`${h.name} no está ${g(h, 'sano', 'sana')}: llama al veterinario (Tienda).`, `${h.name} is not healthy: call the vet (Shop).`);
  if (h.needs.energia < 25) return t(`${h.name} está ${g(h, 'agotado', 'agotada')}: que descanse (termina el día).`, `${h.name} is exhausted: let ${g(h, 'him', 'her')} rest (end the day).`);
  if ((h.showsToday || 0) >= MAX_SHOWS_DAY) return t(`${h.name} ya compitió ${MAX_SHOWS_DAY} veces hoy.`, `${h.name} has already competed ${MAX_SHOWS_DAY} times today.`);
  if (p.coins < L.fee) return t(`La inscripción cuesta ${L.fee} monedas.`, `The entry fee is ${L.fee} coins.`);
  return null;
}
// Confianza inicial (0–100 de su máximo): vínculo, ánimo, limpieza, comida y equipo
export function confidenceStart(p, h) {
  const N = h.needs;
  let c = 45 + h.bond * 0.25 + (N.animo - 50) * 0.2 + (N.limpieza - 50) * 0.12;
  if (N.comida < 20 || N.agua < 20) c -= 15;
  if (p.owned.monturaPro) c += 10;
  return clamp(c, 20, 100);
}

// Modificadores que recibe el recorrido (ride.js). Sin carrera (concurso rápido) todos son neutros.
export function rideMods(p, h) {
  const S = h.stats, sk = p.rider.skills, f = form(h);
  const u = (v) => (v - 50) / 50;                              // −1 … +1 alrededor de 50
  const tec = S.tecnica + (p.owned.protectores ? 12 : 0), agi = S.agilidad + (p.owned.monturaPro ? 6 : 0);
  return {
    career: true,
    salto: S.salto,
    speedK: 1 + 0.10 * u(S.velocidad) + 0.3 * (f - 0.95),
    turnK: 1 + 0.08 * u(agi) + 0.03 * sk.giros + (p.owned.monturaPro ? 0.04 : 0),
    window: 1 + 0.15 * u(tec) + 0.08 * sk.ojo,                  // ventana de «Salta ahora»
    apexBonus: 0.06 * u(tec) + 0.012 * sk.equilibrio + 0.3 * (f - 0.95),
    form: f,
    conf: {
      max: 100 + 0.4 * (S.resistencia - 50),
      start: confidenceStart(p, h) / 100,
      turnDrain: (1.15 - 0.35 * (agi / 100)) * (1 - 0.08 * sk.temple),
      hitK: 1 - 0.1 * sk.temple,
      regen: 1 + h.bond / 100,
      bold: S.coraje / 100,
    },
    fatigue: 1 - 0.5 * (S.resistencia / 100),
  };
}

// ---------------------------------------------------------------- rivales y resultado de un concurso
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const RIVAL_NAMES = ['Lucía Ortiz', 'Martín Ferrer', 'Sofía Lambert', 'Tomás Janssen', 'Valentina Rossi', 'Hugo Dubois', 'Camila Silva', 'Pieter Haas',
  'Inés Moreno', 'Jonas Berg', 'Paula Duarte', 'Felipe Costa', 'Nora Nilsson', 'Bruno Andrade', 'Emma Calloway', 'Simón Romero'];
const RIVAL_HORSES = ['Cumbre', 'Zafiro', 'Brisa', 'Malbec', 'Quimera', 'Sauce', 'Halcón', 'Índigo', 'Mistral', 'Trueno', 'Cometa', 'Ámbar', 'Gaucho', 'Estrella', 'Nácar', 'Rayo'];
// largo aproximado del recorrido (salida → obstáculos → llegada), para tiempos de rivales creíbles
export function courseLength(def) {
  const a = def.start.dir * Math.PI / 180; let x = def.start.x - Math.cos(a) * 6, z = def.start.z - Math.sin(a) * 6, L = 0;
  for (const F of def.fences) { L += Math.hypot(F.x - x, F.z - z); x = F.x; z = F.z; }
  if (def.finish) L += Math.hypot(def.finish.x - x, def.finish.z - z);
  return L;
}
export function rivalsFor(p, evKey, len) {
  let hs = 0; for (const c of evKey) hs = (hs * 31 + c.charCodeAt(0)) >>> 0;
  const L = leagueOf(evKey), R = rng(p.day * 977 + hs + (p.rider.starts || 0) * 17);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const sk = L.rivals[0] + (L.rivals[1] - L.rivals[0]) * R();
    let faults = 0; for (let k = 0; k < 3; k++) if (R() > 0.55 + sk * 0.42) faults += 4;
    const time = len * 1.12 / (4.6 + 1.8 * sk) + R() * 6 - 1.5;          // un principiante limpio gana en el Club; el Gran Premio pide un recorrido rápido
    out.push({ name: RIVAL_NAMES[(i * 5 + p.day + evKey.length) % RIVAL_NAMES.length], horse: RIVAL_HORSES[(i * 3 + p.day) % RIVAL_HORSES.length], faults, time, elim: R() < 0.06 * (1 - sk) });
  }
  return out;
}
export function stars(res) { if (res.elim) return 0; if (res.faults === 0) return 3; if (res.faults <= 4) return 2; return 1; }
// el concurso queda registrado al pagar: si se recarga a mitad del recorrido, cuenta como retiro
export function beginShow(p, evKey) { const L = leagueOf(evKey); p.coins -= L.fee; p.pending = { key: evKey, day: p.day, horse: p.active }; }
export function settlePending(p) {
  if (!p.pending) return null;
  const key = p.pending.key, h = horseOf(p, p.pending.horse);
  p.pending = null; h.needs.energia = clamp(h.needs.energia - 15); h.needs.animo = clamp(h.needs.animo - 12); h.showsToday = (h.showsToday || 0) + 1;
  p.today = p.today || { shows: {} }; p.today.shows[key] = (p.today.shows[key] || 0) + 1;
  p.rider.starts++;
  const ev = both(eventDef(key));
  addLog(p, bi(`${ev.es || 'Concurso'}: retiro (se cerró el juego durante el recorrido).`, `${ev.en || 'Show'}: withdrawn (the game was closed during the round).`));
  return key;
}

// Aplica el resultado de un concurso al perfil. res: { faults, time, elim, retired }
export function applyShow(p, evKey, res, rivals) {
  const L = leagueOf(evKey), E = eventDef(evKey), h = horseOf(p), isQ = !!(L.qual && L.qual.key === evKey);
  p.pending = null;
  const me = { name: p.rider.name, horse: h.name, faults: res.faults, time: res.time, elim: res.elim, me: true };
  const table = [...rivals, me].sort((a, b) => (a.elim - b.elim) || (a.faults - b.faults) || (a.time - b.time));
  const pos = table.indexOf(me) + 1;
  const st = stars(res);
  // el mismo concurso repetido el mismo día rinde la mitad (premio, reputación y experiencia)
  p.today = p.today || { shows: {} };
  const again = (p.today.shows[evKey] || 0) > 0, k = again ? 0.5 : 1;
  p.today.shows[evKey] = (p.today.shows[evKey] || 0) + 1;
  const prize = !res.elim && pos <= 5 ? Math.round(L.prize * PRIZE_SPLIT[pos - 1] * (res.faults === 0 ? 1.2 : 1) * k) : 0;
  const repGain = res.retired ? 0 : Math.round(([0, 8, 16, 24][st] + (pos === 1 && !res.elim ? 10 : pos <= 3 && !res.elim ? 5 : 0)) * k);
  const best = p.stars[evKey] || 0; if (st > best) p.stars[evKey] = st;
  p.rep[L.key] = (p.rep[L.key] || 0) + repGain;
  p.coins += prize;
  const xp = res.retired ? 0 : Math.round((30 + st * 15 + Math.max(0, 6 - pos) * 6 + LEAGUES.indexOf(L) * 15) * k);
  const lvl0 = riderLevel(p.rider.xp); p.rider.xp += xp; const lvl1 = riderLevel(p.rider.xp);
  if (lvl1 > lvl0) p.rider.points += lvl1 - lvl0;
  p.rider.starts++; if (pos === 1 && !res.elim) p.rider.wins++; if (res.faults === 0 && !res.elim) p.rider.clears++;
  let promoted = false;
  if (isQ && pos === 1 && !res.elim) { const i = LEAGUES.indexOf(L); if (p.league === i && i < LEAGUES.length - 1) { p.league = i + 1; promoted = true; } if (!p.qualified.includes(L.key)) p.qualified.push(L.key); }
  // el esfuerzo se nota: cansancio, sudor, sed; el ánimo depende del resultado
  const N = h.needs;
  N.energia = clamp(N.energia - (res.retired ? 15 : 24)); N.agua = clamp(N.agua - (res.retired ? 12 : 30)); N.comida = clamp(N.comida - (res.retired ? 6 : 18));
  N.animo = clamp(N.animo + (pos <= 3 && !res.elim ? 8 : res.elim ? -12 : -3));
  if (!res.retired) { h.sweat = Math.min(1, h.sweat + 0.8); h.dirt = Math.min(1, h.dirt + 0.25); } updateLimpieza(h);
  h.bond = clamp(h.bond + (res.elim ? 0 : 0.5));
  h.showsToday = (h.showsToday || 0) + 1;
  const T = tasksOf(p, h); delete T.ensillar; if (!res.retired) { delete T.duchar; delete T.cepillar; }   // después del esfuerzo se desensilla y hay que volver a cuidarlo
  h.tack.saddled = false;
  h.history.push({ day: p.day, ev: evKey, pos, faults: res.faults, time: +res.time.toFixed(2) });
  const en = both(E), ln = both(LEAGUES[p.league]);
  addLog(p, bi(`${en.es}: ${res.retired ? 'retiro' : res.elim ? 'eliminado' : `${pos}.º puesto`}${prize ? `, ${prize} monedas` : ''}.`,
    `${en.en}: ${res.retired ? 'withdrawn' : res.elim ? 'eliminated' : `${ordEn(pos)} place`}${prize ? `, ${prize} coins` : ''}.`));
  if (promoted) addLog(p, bi(`¡Clasificaste a la liga ${ln.es}!`, `You qualified for the ${ln.en} league!`));
  return { table, pos, st, prize, repGain, xp, levelUp: lvl1 > lvl0, promoted, qual: isQ, again };
}

// ---------------------------------------------------------------- entrenamiento
export function applyTraining(p, key, score) {
  // score 0–1: qué tan bien salió la sesión
  const T = TRAININGS[key], h = horseOf(p), out = [], effort = score;
  if (h.trainedToday[key]) score *= 0.35;              // repetir el mismo trabajo el mismo día rinde poco
  const ageK = h.age <= 7 ? 1.2 : h.age <= 11 ? 1 : 0.6;
  const k = score * ageK * (0.7 + 0.3 * form(h) / 1.05) * (0.85 + h.bond / 400) * (p.owned.pistaPro ? 1.2 : 1);
  for (const [s, gn] of Object.entries(T.stats)) {
    const room = Math.max(0, h.pot[s] - h.stats[s]);
    const gain = Math.min(room, gn * k);
    h.stats[s] = +(h.stats[s] + gain).toFixed(s === 'salto' ? 3 : 2);
    if (gain > (s === 'salto' ? 0.002 : 0.2)) out.push({ s, gain });
  }
  const used = score > 0 ? 1 : 0.5;
  h.needs.energia = clamp(h.needs.energia - T.energy * used); h.needs.agua = clamp(h.needs.agua - 12 * used);
  if (effort > 0.3) { h.sweat = Math.min(1, h.sweat + 0.45); delete tasksOf(p, h).duchar; }
  h.dirt = Math.min(1, h.dirt + 0.12 * used); updateLimpieza(h);
  h.bond = clamp(h.bond + 1 * score);
  h.trainedToday[key] = true;
  const xp = Math.round(12 * score + (score > 0 ? 4 : 0)); const lvl0 = riderLevel(p.rider.xp); p.rider.xp += xp; const lvl1 = riderLevel(p.rider.xp);
  if (lvl1 > lvl0) p.rider.points += lvl1 - lvl0;
  return { gains: out, xp, levelUp: lvl1 > lvl0, sweaty: effort > 0.3 };
}

// ---------------------------------------------------------------- cuidador
export function groomLevel(xp) { let l = 0; for (let i = 0; i < GROOM_LEVELS.length; i++) if (xp >= GROOM_LEVELS[i]) l = i; return l; }
// cada tarea cuenta una vez por caballo y por día (la ducha y el cepillado vuelven a abrirse tras competir)
export function completeTask(p, key, quality = 1, extra = {}) {
  const T = TASKS[key], h = horseOf(p), N = h.needs, done = tasksOf(p, h);
  if (done[key]) return null;
  done[key] = true;
  const lv = groomLevel(p.groom.xp);
  if (key === 'duchar') h.showers = (h.showers || 0) + 1;
  const unpaid = key === 'duchar' && h.showers > 2;
  const reward = unpaid ? 0 : Math.round(T.reward * (1 + 0.15 * lv) * quality);
  const xp = unpaid ? 0 : Math.round(T.xp * quality);
  p.coins += reward; const g0 = groomLevel(p.groom.xp); p.groom.xp += xp; p.groom.total++;
  if (key === 'cepillar') { N.animo = clamp(N.animo + 6); h.bond = clamp(h.bond + 2); }
  if (key === 'cascos') { N.salud = clamp(N.salud + 6); h.bond = clamp(h.bond + 1); h.hooves = [0, 0, 0, 0]; }
  if (key === 'agua') N.agua = 100;
  if (key === 'comida') {
    const r = extra.ration || {};
    N.comida = clamp(N.comida + 60 * quality); N.energia = clamp(N.energia + 5);
    if (r.zanahorias) { N.animo = clamp(N.animo + 8); h.bond = clamp(h.bond + 3); }
    if (r.avena) N.energia = clamp(N.energia + 12);
    if (r.suplemento) N.salud = clamp(N.salud + 8);
  }
  if (key === 'limpiarBox') { N.salud = clamp(N.salud + 4); N.animo = clamp(N.animo + 5); h.manure = 0; h.bedding = 1; }
  if (key === 'duchar') { N.animo = clamp(N.animo + (p.owned.duchaCaliente ? 10 : 4) + (extra.shampoo ? 6 : 0)); if (p.owned.duchaCaliente) N.salud = clamp(N.salud + 4); h.bond = clamp(h.bond + 1); }
  if (key === 'ensillar') h.tack.saddled = true;
  updateLimpieza(h);
  return { reward, xp, levelUp: groomLevel(p.groom.xp) > g0 };
}

// ---------------------------------------------------------------- fin del día
// devuelve el resumen de la noche: pensión y cambios de cada caballo
export function endDay(p) {
  const report = { board: 0, unpaid: 0, horses: [], births: [], wage: 0, mozo: [] };
  // el mozo de cuadra atiende a los caballos que no son el activo: ración, agua y box
  const wage = mozoWage(p);
  if (wage) for (const h of p.horses) {
    if (h.id === p.active) continue;
    const d = tasksOf(p, h); let did = false;
    if (!d.comida) { h.needs.comida = clamp(h.needs.comida + 60); h.needs.energia = clamp(h.needs.energia + 5); d.comida = true; did = true; }
    if (!d.agua) { h.needs.agua = 100; d.agua = true; did = true; }
    if (!d.limpiarBox) { h.manure = 0; h.bedding = 1; d.limpiarBox = true; did = true; }
    if (did) report.mozo.push(h.name);
  }
  const bd = board(p) + wage, paid = Math.min(p.coins, bd); report.wage = wage;
  p.coins -= paid; report.board = paid; report.unpaid = bd - paid;
  for (const h of p.horses) {
    const N = h.needs, before = { ...N };
    const done = p.tasks[h.id] || {};
    const fed = !!done.comida || N.comida > 40, watered = !!done.agua || N.agua > 40, cleanBox = !!done.limpiarBox || h.manure === 0;
    N.energia = clamp(N.energia + 52 + (p.owned.caminador ? 8 : 0) + (p.owned.boxAmplio ? 15 : 0) + (fed ? 10 : -10) + (cleanBox ? 5 : 0));
    N.comida = clamp(N.comida - 45); N.agua = p.owned.bebedero ? Math.max(50, N.agua - 50) : clamp(N.agua - 50);
    N.salud = clamp(N.salud + (fed && watered && cleanBox ? 3 : -8));
    N.animo = clamp(N.animo + (fed && watered ? 2 : -10) + (cleanBox ? 3 : -5) - (report.unpaid ? 5 : 0));
    h.manure = Math.min(6, (h.manure || 0) + 3); h.bedding = Math.max(0.2, (h.bedding ?? 1) - 0.35);
    h.dirt = Math.min(1, h.dirt + (p.owned.manta ? 0.12 : 0.25)); h.sweat = 0; h.wet = 0;
    h.hooves = (h.hooves || [0, 0, 0, 0]).map((v) => Math.min(1, v + 0.35));
    updateLimpieza(h);
    h.tack.saddled = false; h.trainedToday = {}; h.showsToday = 0; h.showers = 0;
    h.age += 1 / 120;                                      // cada 120 días, un año
    report.horses.push({ name: h.name, sex: h.sex, before, after: { ...N }, fed, watered, cleanBox });
  }
  p.day++; p.tasks = {}; p.today = { shows: {} };
  // nacimientos: el potrillo llega al establo a la mañana
  for (const b of [...(p.breeding || [])]) if (b.due <= p.day) {
    const f = makeFoal(p, b); p.horses.push(f); p.breeding = p.breeding.filter((x) => x !== b);
    report.births.push({ name: f.name, id: f.id, sex: f.sex, parents: f.parents, breed: breedName(f) });
    addLog(p, bi(`Nació ${f.name} (${f.parents}).`, `${f.name} was born (${f.parents}).`));
  }
  addLog(p, bi(`Pensión: ${paid} monedas.${report.unpaid ? ' No alcanzó para pagarla toda.' : ''}`, `Board: ${paid} coins.${report.unpaid ? ' There was not enough to pay all of it.' : ''}`));
  return report;
}

export function buy(p, item) {
  const I = SHOP[item]; if (!I || p.coins < I.price) return false;
  if (!I.stack && !I.service && p.owned[item]) return false;
  p.coins -= I.price;
  if (I.service) { const h = horseOf(p); h.needs.salud = clamp(h.needs.salud + 40); addLog(p, bi(`El veterinario revisó a ${h.name}.`, `The vet checked ${h.name}.`)); return true; }
  if (I.stack) p.inv[item] = (p.inv[item] || 0) + I.stack; else p.owned[item] = true;
  if (I.look && I.look.leather) p.leather = I.look.leather;
  const iname = both(I);
  addLog(p, bi(`Compraste: ${iname.es}.`, `You bought: ${iname.en}.`));
  return true;
}
export function buyHorse(p, id) {
  const M = offerOf(p, id); if (!M || p.coins < M.price || p.horses.some((h) => h.id === id) || M.league > p.league || freeBoxes(p) < 1) return false;
  if (!MARKET.includes(M)) { p.market.bought.push(id); if (p.horses.some((h) => h.name === M.name)) M.name = pickName(p, rngSeed(p.day * 31 + id.length)); }
  p.coins -= M.price;
  p.horses.push(newHorse(M));
  const cn = both(COATS[M.coat]), bn = both(BREEDS[M.bk]);
  addLog(p, bi(`Compraste a ${M.name} (${cn.es.toLowerCase()}, ${bn.es || M.breed}).`, `You bought ${M.name} (${cn.en.toLowerCase()}, ${bn.en || M.breed}).`));
  return true;
}
export function buyReason(p, M) {
  if (p.horses.some((h) => h.id === M.id)) return L('En tu establo', 'In your stable');
  if (M.league > p.league) return L(`Desde la liga ${LEAGUES[M.league].name}`, `From the ${LEAGUES[M.league].name} league`);
  if (freeBoxes(p) < 1) return L('Sin box libre', 'No free stall');
  return '';
}
export function spendSkill(p, k) { if (p.rider.points <= 0 || p.rider.skills[k] >= 5) return false; p.rider.points--; p.rider.skills[k]++; return true; }
export function fmtStat(k, v) { return k === 'salto' ? `${dec(v, 2)} m` : `${Math.round(v)}`; }
// 1st, 2nd, 3rd, 4th… (puesto en inglés)
export function ordEn(n) { const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'; return n + s; }
export function ordinal(n) { return lang() === 'en' ? ordEn(n) : `${n}.º`; }

// próximo objetivo para el jugador (chip del rancho)
export function nextGoal(p) {
  const h = horseOf(p), L = LEAGUES[p.league];
  const care = careLeft(p, h);
  const t = (es, en) => (lang() === 'en' ? en : es);    // (L es la liga en esta función)
  const left = care.length === 1 ? t('queda 1 tarea', '1 task left') : t(`quedan ${care.length} tareas`, `${care.length} tasks left`);
  if (h.needs.salud < 40) return p.coins >= SHOP.veterinario.price ? { text: t(`Llamar al veterinario: ${h.name} no está ${g(h, 'sano', 'sana')}`, `Call the vet: ${h.name} is not healthy`), go: 'tienda:cuidador' } : { text: t(`Cuidar a ${h.name} para que recupere la salud`, `Look after ${h.name} to restore ${g(h, 'his', 'her')} health`), go: 'establo' };
  if (care.length && !p.rider.starts) return { text: t(`Cuidar a ${h.name}: ${left}`, `Look after ${h.name}: ${left}`), go: 'establo' };
  if (!p.rider.starts) return h.tack.saddled ? { text: t(`Inscribirse en ${LEAGUES[0].events[0].name} (liga Club)`, `Enter the ${LEAGUES[0].events[0].name} (Club league)`), go: 'concursos' } : { text: t(`Ensillar a ${h.name} y competir`, `Tack up ${h.name} and compete`), go: 'ensillar' };
  if (care.length) return { text: t(`Cuidar a ${h.name}: ${left}`, `Look after ${h.name}: ${left}`), go: 'establo' };
  if (L.qual) {
    const rep = p.rep[L.key] || 0, need = fmtStat('salto', L.qual.h - ELIGIBLE_MARGIN);
    if (!eligible(h, L.qual)) {
      if (!p.owned.gimnasio) return { text: t(`Comprar la pista de gimnasia para entrenar el salto (el ${L.qual.name} pide ${need})`, `Buy the gymnastics arena to train jumping (the ${L.qual.name} requires ${need})`), go: 'tienda:rancho' };
      if (h.pot.salto < L.qual.h - ELIGIBLE_MARGIN) return { text: t(`${h.name} no llega al ${L.qual.name}: busca otro caballo en la Tienda`, `${h.name} cannot reach the ${L.qual.name}: look for another horse in the Shop`), go: 'tienda:caballos' };
      if (rep >= L.rep) return { text: t(`Entrenar el salto: el ${L.qual.name} pide ${need}`, `Train jumping: the ${L.qual.name} requires ${need}`), go: 'entrenar' };
    }
    if (rep < L.rep) return { text: t(`Sumar reputación en la liga ${L.name} (${rep} de ${L.rep})`, `Earn reputation in the ${L.name} league (${rep} of ${L.rep})`), go: 'concursos' };
    return { text: t(`Ganar el ${L.qual.name} para subir de liga`, `Win the ${L.qual.name} to move up a league`), go: 'concursos' };
  }
  return { text: t('Ganar los Grandes Premios', 'Win the Grand Prix shows'), go: 'concursos' };
}
