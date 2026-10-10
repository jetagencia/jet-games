// JETJump — persistencia local (perfil de carrera + ajustes).
import { genHorse, genStaff, uid } from './data.js';
import { mulberry32 } from './sim.js';

const KEY = 'jetjump.profile.v1';
const SKEY = 'jetjump.settings.v1';

export const DEFAULT_SETTINGS = {
  sound: true, haptics: true, assist: true, quality: 'high', cam: 'chase', invertStick: false, tutorialSeen: false, lefty: false,
};

export function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(SKEY) || '{}')) }; } catch { return { ...DEFAULT_SETTINGS }; }
}
export function saveSettings(s) { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch { /* sin storage */ } }

export function loadProfile() {
  try { const p = JSON.parse(localStorage.getItem(KEY) || 'null'); return p && p.version === 1 ? p : null; } catch { return null; }
}
export function saveProfile(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* sin storage */ } }
export function deleteProfile() { try { localStorage.removeItem(KEY); } catch { /* sin storage */ } }

export function newProfile(riderName) {
  const rng = mulberry32((Date.now() % 100000) + 17);
  const first = genHorse(rng, 0.38, { age: 7 });
  const second = genHorse(rng, 0.3, { age: 6 });
  first.fitness = 0.75; first.mood = 0.8;
  const p = {
    version: 1, id: uid(rng), created: Date.now(),
    name: riderName || 'Jinete',
    money: 60000, week: 1, year: 1,
    rider: { xp: 0, points: 0, skills: { eye: 0.35, balance: 0.35, nerve: 0.35, turns: 0.35 }, jacket: 0x14204a, starts: 0, wins: 0, clears: 0 },
    horses: [first, second],
    plan: { [first.id]: 'flat', [second.id]: 'flat' },
    staff: [genStaff(rng, 'groom', 1)],
    candidates: [], market: [], marketWeek: 0,
    bestTier: -1, results: [], log: [],
    records: { daily: {}, power: 0 },
    seed: Math.floor(rng() * 1e9),
  };
  return p;
}
