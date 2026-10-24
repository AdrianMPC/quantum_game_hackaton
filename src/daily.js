// Daily puzzle: same level for everyone on a given date, plus a local streak.
import { MOVES, STARTS, startCell, validateLevel } from './engine.js';

const LAUNCH = Date.UTC(2026, 9, 24); // puzzle #1

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const dayIndex = (key) => Math.round((Date.UTC(...key.split('-').map((n, i) => +n - (i === 1 ? 1 : 0))) - LAUNCH) / 86400000);
export const puzzleNumber = (key) => dayIndex(key) + 1;

// mulberry32 seeded from the date string: deterministic across browsers.
function rng(seedText) {
  let a = [...seedText].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0, 1779033703);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (r, list) => list[Math.floor(r() * list.length)];
const key = ([x, y]) => `${x},${y}`;

// Random 3-move route from a random corner, then random hidden walls until the
// engine's own validator accepts the level (unique solution, other starts blocked).
export function dailyLevel(dateKey) {
  const r = rng(dateKey);
  for (let attempt = 0; attempt < 200; attempt++) {
    const size = pick(r, [4, 5]);
    const correctStart = pick(r, STARTS);
    const route = [startCell(size, correctStart)];
    const targetSequence = [];
    for (let i = 0; i < 3; i++) {
      const [x, y] = route.at(-1);
      const options = Object.keys(MOVES).filter((m) => {
        const [nx, ny] = [x + MOVES[m][0], y + MOVES[m][1]];
        return nx >= 0 && ny >= 0 && nx < size && ny < size && !route.some((p) => key(p) === key([nx, ny]));
      });
      const m = pick(r, options);
      targetSequence.push(m);
      route.push([x + MOVES[m][0], y + MOVES[m][1]]);
    }
    const goal = route.at(-1);
    if (STARTS.some((s) => key(startCell(size, s)) === key(goal))) continue;

    const onRoute = new Set(route.slice(1).map((p, i) => [key(route[i]), key(p)].sort().join('|')));
    const edges = [];
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
      for (const n of [[x + 1, y], [x, y + 1]]) {
        if (n[0] < size && n[1] < size && !onRoute.has([key([x, y]), key(n)].sort().join('|'))) edges.push([[x, y], n]);
      }
    }
    for (let tries = 0; tries < 300; tries++) {
      const p = 0.15 + r() * 0.35;
      const walls = edges.filter(() => r() < p);
      const level = { id: `daily_${dateKey}`, title: `Reto diario #${puzzleNumber(dateKey)}`, size, correctStart, goal, targetSequence, walls };
      if (validateLevel(level).length === 0) return level;
    }
  }
  return null;
}

// Streak: consecutive local days with the daily puzzle solved.
export function recordSolve(state, dateKey, result) {
  const s = { streak: 0, best: 0, last: null, scores: {}, ...state };
  if (s.last === dateKey) return s; // replaying today changes nothing
  const yesterday = dayIndex(dateKey) - 1;
  s.streak = s.last !== null && dayIndex(s.last) === yesterday ? s.streak + 1 : 1;
  s.best = Math.max(s.best, s.streak);
  s.last = dateKey;
  s.scores = { ...s.scores, [dateKey]: result.score };
  return s;
}

// Streak shown before solving today: broken if the last solve is older than yesterday.
export const currentStreak = (state, dateKey) =>
  state?.last && dayIndex(dateKey) - dayIndex(state.last) <= 1 ? state.streak : 0;

const STORE = 'quantum-maze-daily';
export function loadStreak() {
  try { return JSON.parse(localStorage.getItem(STORE)) ?? {}; } catch { return {}; }
}
export function saveStreak(state) {
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* private mode: streak just won't persist */ }
}
