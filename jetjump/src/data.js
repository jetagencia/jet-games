// JETJump — datos de progresión: caballos, jinetes, cuidadores, concursos, economía.
import { mulberry32, clamp } from './sim.js';

export const HORSE_NAMES = ['Cumbre', 'Lucero', 'Tormenta', 'Zafiro', 'Brisa', 'Candela', 'Relámpago', 'Malbec', 'Pampa', 'Quimera',
  'Sauce', 'Alba', 'Diamante', 'Fuego', 'Halcón', 'Índigo', 'Jacarandá', 'Luna', 'Mistral', 'Nube', 'Ónix', 'Pícaro', 'Quebracho',
  'Rayo', 'Salvaje', 'Trueno', 'Valiente', 'Zorzal', 'Ámbar', 'Cometa', 'Dalia', 'Estrella', 'Gaucho', 'Jazmín', 'Kaiser', 'Nácar'];
export const HORSE_SUFFIX = ['', '', 'del Sur', 'de Olivos', 'Z', 'van de Beek', 'du Pré', 'von Falk', 'de la Sierra', 'del Plata', 'de Muze', 'Royal'];
export const FIRST_NAMES = ['Martín', 'Lucía', 'Santiago', 'Valentina', 'Nicolás', 'Camila', 'Tomás', 'Sofía', 'Lars', 'Emma', 'Pieter', 'Chloé',
  'Hugo', 'Ana', 'Jonas', 'Marie', 'Bruno', 'Julia', 'Kevin', 'Laura', 'Mateo', 'Paula', 'Daniel', 'Inés', 'Felipe', 'Carla', 'Simon', 'Nora'];
export const LAST_NAMES = ['Pérez', 'Fernández', 'García', 'López', 'Vermeulen', 'Janssen', 'Dubois', 'Müller', 'Schmidt', 'Rossi', 'Silva',
  'Whitaker', 'Costa', 'Lambert', 'Beerbaum', 'Andrade', 'Moreno', 'Ortiz', 'Haas', 'Nilsson', 'Duarte', 'Romero'];

export const COAT_KEYS = ['bay', 'darkbay', 'chestnut', 'grey', 'black', 'palomino'];

export const BREEDS = {
  kwpn: { name: 'KWPN', scope: [1.4, 1.72], tech: [0.5, 0.95], care: [0.5, 0.9], speed: [0.45, 0.85], ride: [0.4, 0.85], bold: [0.45, 0.9], stamina: [0.5, 0.85], price: 1.15 },
  selle: { name: 'Selle Français', scope: [1.4, 1.72], tech: [0.45, 0.9], care: [0.45, 0.9], speed: [0.5, 0.95], ride: [0.4, 0.8], bold: [0.5, 0.95], stamina: [0.5, 0.9], price: 1.1 },
  holst: { name: 'Holsteiner', scope: [1.45, 1.72], tech: [0.5, 0.95], care: [0.55, 0.95], speed: [0.35, 0.75], ride: [0.4, 0.8], bold: [0.5, 0.9], stamina: [0.5, 0.85], price: 1.2 },
  bwp: { name: 'BWP', scope: [1.4, 1.7], tech: [0.5, 0.9], care: [0.5, 0.9], speed: [0.45, 0.9], ride: [0.45, 0.85], bold: [0.45, 0.9], stamina: [0.5, 0.85], price: 1.05 },
  sa: { name: 'Silla Argentino', scope: [1.3, 1.65], tech: [0.4, 0.85], care: [0.45, 0.85], speed: [0.5, 0.9], ride: [0.5, 0.9], bold: [0.5, 0.95], stamina: [0.6, 0.95], price: 0.8 },
  psi: { name: 'Pura Sangre', scope: [1.25, 1.6], tech: [0.35, 0.8], care: [0.35, 0.8], speed: [0.7, 1.0], ride: [0.3, 0.7], bold: [0.5, 0.9], stamina: [0.7, 1.0], price: 0.6 },
};

export const STAT_KEYS = ['scope', 'tech', 'care', 'speed', 'ride', 'bold', 'stamina'];
export const STAT_INFO = {
  scope: { name: 'Potencia', desc: 'Altura y anchura que puede saltar con comodidad.', unit: 'm' },
  tech: { name: 'Técnica', desc: 'Pliega manos y pies; pasa limpio aunque la distancia no sea perfecta.' },
  care: { name: 'Cuidado', desc: 'Respeto por la barra: toca menos y no tira si roza.' },
  speed: { name: 'Velocidad', desc: 'Galope de crucero y punta. Decide los desempates.' },
  ride: { name: 'Manejo', desc: 'Responde a la rienda, acorta y alarga el tranco, gira cerrado.' },
  bold: { name: 'Coraje', desc: 'Menos rehúses ante vallas grandes, rías y ángulos.' },
  stamina: { name: 'Fondo', desc: 'Mantiene la potencia hasta la última valla.' },
};

export const RIDER_SKILLS = {
  eye: { name: 'Ojo', desc: 'El caballo encuentra la distancia con más margen. Ampliá la ventana de salto.' },
  balance: { name: 'Equilibrio', desc: 'Menos interferencia en el aire: menos barras con distancias imperfectas.' },
  nerve: { name: 'Temple', desc: 'Transmite confianza: menos rehúses.' },
  turns: { name: 'Giros', desc: 'Giros más cerrados y cambios de pie seguros. Clave contra el reloj.' },
};

export const STAFF_ROLES = {
  groom: { name: 'Caballerizo/a', short: 'Caballerizo', salary: 420, effect: 'Bienestar y recuperación semanal de los caballos.', icon: '🧹' },
  trainer: { name: 'Entrenador/a', short: 'Entrenador', salary: 760, effect: 'Rendimiento de cada sesión de entrenamiento.', icon: '🎯' },
  vet: { name: 'Veterinario/a', short: 'Veterinaria', salary: 640, effect: 'Salud, menos lesiones, recuperación más rápida.', icon: '🩺' },
  farrier: { name: 'Herrador/a', short: 'Herrador', salary: 380, effect: 'Más cuidado en la barra y tracción en los giros.', icon: '🔨' },
  nutri: { name: 'Nutricionista', short: 'Nutricionista', salary: 480, effect: 'Fondo y forma física al final del recorrido.', icon: '🥕' },
};
export const STAFF_XP_LEVELS = [0, 120, 300, 600, 1000];
export const STAFF_TITLES = ['Aprendiz', 'Oficial', 'Experto', 'Maestro', 'Leyenda'];

export const TIERS = [
  { key: 'escuela', name: 'Escuela 1.00', h: 1.0, speed: 325, fee: 80, prize: [600, 400, 250, 150, 80], n: 8, skill: [0.3, 0.55], layout: 'indoor', jumpoff: false, unlock: 0 },
  { key: 'local', name: 'Local 1.10', h: 1.1, speed: 350, fee: 150, prize: [1500, 1000, 600, 350, 200], n: 10, skill: [0.4, 0.65], layout: 'clasico', jumpoff: true, unlock: 0 },
  { key: 'regional', name: 'Regional 1.20', h: 1.2, speed: 350, fee: 250, prize: [3000, 2000, 1200, 700, 400], n: 12, skill: [0.5, 0.72], layout: 'clasico', jumpoff: true, unlock: 1 },
  { key: 'nacional', name: 'Nacional 1.30', h: 1.3, speed: 375, fee: 400, prize: [6000, 4000, 2500, 1500, 800], n: 12, skill: [0.55, 0.8], layout: 'rio', jumpoff: true, unlock: 2 },
  { key: 'csi2', name: 'CSI2* 1.40', h: 1.4, speed: 375, fee: 800, prize: [15000, 10000, 6000, 3500, 2000], n: 14, skill: [0.65, 0.86], layout: 'indoor', jumpoff: true, unlock: 3 },
  { key: 'csi4', name: 'CSI4* 1.50', h: 1.5, speed: 375, fee: 1500, prize: [40000, 25000, 15000, 9000, 5000], n: 14, skill: [0.72, 0.92], layout: 'clasico', jumpoff: true, unlock: 4 },
  { key: 'gp', name: 'Gran Premio 1.60', h: 1.6, speed: 400, fee: 3000, prize: [120000, 70000, 40000, 25000, 15000], n: 16, skill: [0.8, 0.98], layout: 'rio', jumpoff: true, unlock: 5 },
];

export const WEEK_BASE_COST = 350; // pensión por caballo

export function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function rr(rng, [a, b]) { return a + (b - a) * rng(); }

let nextId = 1;
export function uid(rng) { return Math.floor((rng ? rng() : Math.random()) * 1e9).toString(36) + (nextId++).toString(36); }

// Genera un caballo. quality 0..1 orienta el nivel (0 = escuela, 1 = Gran Premio).
export function genHorse(rng, quality = 0.4, opts = {}) {
  const breedKey = opts.breed || pick(rng, Object.keys(BREEDS));
  const B = BREEDS[breedKey];
  const age = opts.age ?? Math.floor(5 + rng() * 8);
  const stats = {}, pot = {};
  for (const k of STAT_KEYS) {
    const q = clamp(quality + (rng() - 0.5) * 0.35, 0, 1);
    pot[k] = B[k][0] + (B[k][1] - B[k][0]) * clamp(q + 0.12 + rng() * 0.15, 0, 1);
    const dev = clamp((age - 4) / 6, 0.45, 1); // los jóvenes todavía no llegaron a su potencial
    stats[k] = B[k][0] + (pot[k] - B[k][0]) * dev * (0.85 + 0.15 * rng());
  }
  const sex = pick(rng, ['yegua', 'castrado', 'castrado', 'padrillo']);
  const coat = pick(rng, COAT_KEYS);
  const h = {
    id: uid(rng), name: `${pick(rng, HORSE_NAMES)} ${pick(rng, HORSE_SUFFIX)}`.trim(),
    breed: breedKey, age, sex, coat, blaze: rng() < 0.4, socks: [0, 0, 0, 0].map(() => (rng() < 0.3 ? 1 : 0)),
    stats, pot, fitness: 0.6 + 0.3 * rng(), mood: 0.6 + 0.3 * rng(), health: 1, injuredWeeks: 0,
    xp: 0, starts: 0, wins: 0, clears: 0, earnings: 0, history: [],
    bootsColor: pick(rng, [0x1b2340, 0x111111, 0x5a2d0c, 0xf0ede6]),
    padColor: pick(rng, [0xf4f4f0, 0x14204a, 0x1f3b2a, 0x5a0f14]),
  };
  h.value = horseValue(h);
  return h;
}

export function horseValue(h) {
  const B = BREEDS[h.breed];
  const s = h.stats;
  const lvl = (s.scope - 1.2) / 0.5 * 0.45 + (s.tech + s.care + s.ride + s.bold) / 4 * 0.4 + (s.speed + s.stamina) / 2 * 0.15;
  const agePen = h.age <= 8 ? 1 + (8 - h.age) * 0.06 : h.age <= 12 ? 1 : 1 - (h.age - 12) * 0.12;
  const v = 8000 + Math.pow(Math.max(lvl, 0), 2.6) * 600000;
  return Math.round(v * B.price * Math.max(0.25, agePen) / 100) * 100;
}

export function genPerson(rng) { return `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`; }

export function genStaff(rng, role, level = 1) {
  const R = STAFF_ROLES[role];
  return {
    id: uid(rng), name: genPerson(rng), role, level, xp: STAFF_XP_LEVELS[level - 1],
    salary: Math.round(R.salary * (1 + 0.35 * (level - 1))), weeks: 0,
    trait: pick(rng, ['paciente', 'metódico', 'exigente', 'intuitivo', 'cálido', 'veterano', 'ambicioso']),
  };
}

export function staffLevelFor(xp) { let l = 1; for (let i = 1; i < STAFF_XP_LEVELS.length; i++) if (xp >= STAFF_XP_LEVELS[i]) l = i + 1; return l; }

export function genRival(rng, skill, tierIdx) {
  const q = clamp(tierIdx / 6 + (rng() - 0.5) * 0.2, 0, 1);
  const horse = genHorse(rng, q, { age: Math.floor(7 + rng() * 6) });
  return { name: genPerson(rng), skill, horse, rider: { eye: skill, balance: skill, nerve: skill, turns: skill } };
}

// Stats efectivas para la simulación (caballo + personal + estado).
export function effectiveHorse(h, staff = []) {
  const lvl = (role) => { const s = staff.find(x => x.role === role); return s ? s.level : 0; };
  const s = { ...h.stats };
  s.care = clamp(s.care + 0.02 * lvl('farrier'), 0, 1);
  s.stamina = clamp(s.stamina + 0.03 * lvl('nutri'), 0, 1);
  s.form = clamp(0.84 + 0.14 * h.mood + 0.012 * lvl('nutri') - (1 - h.health) * 0.2, 0.6, 1.02);
  s.fitness = h.fitness;
  return s;
}

export function riderLevel(xp) { return Math.floor(Math.sqrt(xp / 100)) + 1; }
export function riderNextXp(level) { return level * level * 100; }

export const TRAININGS = {
  rest: { name: 'Descanso', desc: 'Recupera bienestar y salud. Pierde un poco de forma.', icon: '🌿' },
  flat: { name: 'Trabajo plano', desc: 'Manejo y forma física. Suave para el caballo.', icon: '🏇', gains: { ride: 0.012, stamina: 0.004 }, fit: 0.05, mood: 0.0, risk: 0.005 },
  grid: { name: 'Gimnasia (líneas)', desc: 'Técnica y cuidado en la barra. Exige concentración.', icon: '🪜', gains: { tech: 0.012, care: 0.01 }, fit: 0.03, mood: -0.03, risk: 0.01 },
  course: { name: 'Recorrido', desc: 'Coraje y potencia. Cansa y gasta.', icon: '🏁', gains: { scope: 0.006, bold: 0.012 }, fit: 0.02, mood: -0.05, risk: 0.02 },
  gallop: { name: 'Galope de campo', desc: 'Velocidad y fondo. Levanta el ánimo.', icon: '🌄', gains: { speed: 0.01, stamina: 0.012 }, fit: 0.08, mood: 0.04, risk: 0.012 },
};

export function applyTraining(h, key, staff, rng) {
  const T = TRAININGS[key];
  const trainerL = (staff.find(s => s.role === 'trainer') || { level: 0 }).level;
  const vetL = (staff.find(s => s.role === 'vet') || { level: 0 }).level;
  const groomL = (staff.find(s => s.role === 'groom') || { level: 0 }).level;
  const log = [];
  if (key === 'rest' || h.injuredWeeks > 0) {
    h.mood = clamp(h.mood + 0.1 + 0.04 * groomL, 0, 1);
    h.health = clamp(h.health + 0.08 + 0.05 * vetL, 0, 1);
    h.fitness = clamp(h.fitness - 0.04 + 0.01 * groomL, 0, 1);
    if (h.injuredWeeks > 0) { h.injuredWeeks--; log.push(`${h.name}: en recuperación (${h.injuredWeeks} sem.)`); }
    return log;
  }
  const ageK = h.age <= 7 ? 1.2 : h.age <= 11 ? 1 : h.age <= 14 ? 0.6 : 0.3;
  const yield_ = (1 + 0.25 * trainerL) * ageK * (0.7 + 0.5 * h.mood) * (0.8 + 0.3 * h.health);
  for (const [k, g] of Object.entries(T.gains)) {
    const room = Math.max(0, h.pot[k] - h.stats[k]);
    const gain = Math.min(room, g * yield_ * (0.7 + 0.6 * rng()));
    h.stats[k] += gain;
    if (gain > 0.002) log.push(`${h.name}: +${(gain * (k === 'scope' ? 100 : 100)).toFixed(1)} ${STAT_INFO[k].name}`);
  }
  h.fitness = clamp(h.fitness + T.fit * (0.8 + 0.3 * trainerL * 0.2), 0, 1);
  h.mood = clamp(h.mood + T.mood + 0.03 * groomL, 0, 1);
  const risk = T.risk * (1 - 0.15 * vetL) * (1.6 - h.fitness) * (1.4 - h.health);
  if (rng() < risk) { h.injuredWeeks = 1 + Math.floor(rng() * 3); h.health = clamp(h.health - 0.25, 0.3, 1); log.push(`⚠ ${h.name} se lastimó: ${h.injuredWeeks} semanas de reposo.`); }
  return log;
}

export function weeklyUpkeep(h, staff) {
  const groomL = (staff.find(s => s.role === 'groom') || { level: 0 }).level;
  h.mood = clamp(h.mood - 0.03 + 0.015 * groomL, 0, 1);
  h.fitness = clamp(h.fitness - 0.015, 0, 1);
}

export function ageHorses(profile) {
  for (const h of profile.horses) {
    h.age++;
    if (h.age >= 13) for (const k of STAT_KEYS) h.stats[k] = Math.max(0, h.stats[k] - (k === 'scope' ? 0.015 : 0.02));
    h.value = horseValue(h);
  }
}

export function fmtMoney(v) { return '€' + Math.round(v).toLocaleString('es-AR'); }

export function demoHorses() {
  const rng = mulberry32(777);
  const a = genHorse(rng, 0.45, { breed: 'sa', age: 9 }); a.name = 'Lucero del Sur'; a.coat = 'bay'; a.blaze = true; a.socks = [0, 1, 0, 1];
  const b = genHorse(rng, 0.7, { breed: 'kwpn', age: 10 }); b.name = 'Quimera Z'; b.coat = 'grey'; b.blaze = false;
  const c = genHorse(rng, 0.95, { breed: 'holst', age: 11 }); c.name = 'Tormenta van de Beek'; c.coat = 'darkbay'; c.socks = [1, 1, 0, 0];
  for (const h of [a, b, c]) { h.fitness = 0.9; h.mood = 0.9; h.value = horseValue(h); }
  return [a, b, c];
}
