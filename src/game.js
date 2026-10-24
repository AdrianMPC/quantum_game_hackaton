// Level state machine. No DOM: main.js calls these and re-renders.
import { STARTS, trace, match, score } from './engine.js';

export function createGame(level, defaults, now = Date.now) {
  const g = {
    level,
    scannerDurationMs: level.scannerDurationMs ?? defaults.scannerDurationMs,
    scoreConfig: { ...defaults.scoreConfig, ...level.scoreConfig },
    now,
  };
  reset(g);
  return g;
}

export function reset(g) {
  Object.assign(g, {
    status: 'READY', // READY | PLAYING | SCANNING | LEVEL_COMPLETED
    seq: Array(g.level.targetSequence.length).fill(null),
    rotation: 0, // quarter turns clockwise
    plays: 0,
    scans: 0,
    startedAt: g.now(),
    idealPaths: null, // start -> points, set by Play
    collisions: null, // start -> {points, blockedAt}, set by Scanner
    matchPct: null,
    message: '',
    result: null,
  });
}

// The selected start is whichever one the rotation puts at the bottom of the circle.
export const selectedStart = (g) => STARTS[(6 - g.rotation) % 4];

export function rotate(g) {
  if (g.status !== 'READY') return;
  g.rotation = (g.rotation + 1) % 4;
}

export function selectStart(g, start) {
  if (g.status !== 'READY') return;
  g.rotation = (6 - STARTS.indexOf(start)) % 4;
}

export function setMove(g, slot, move) {
  if (g.status !== 'READY') return;
  g.seq[slot] = move;
  g.idealPaths = null; // drawn rays belong to the previous sequence
  g.message = '';
}

export function play(g) {
  if (g.status !== 'READY') return;
  if (g.seq.includes(null)) {
    g.message = 'Completa todos los movimientos antes de pulsar Play.';
    return;
  }
  g.message = '';
  g.plays++;
  g.idealPaths = Object.fromEntries(STARTS.map((s) => [s, trace(g.level, s, g.seq, { ignoreWalls: true }).points]));
  g.matchPct = match(g.seq, g.level.targetSequence);
  const won = g.seq.join() === g.level.targetSequence.join() && selectedStart(g) === g.level.correctStart;
  if (won) {
    const seconds = Math.round((g.now() - g.startedAt) / 1000);
    g.status = 'LEVEL_COMPLETED';
    g.idealPaths = { [g.level.correctStart]: g.idealPaths[g.level.correctStart] };
    g.result = { seconds, plays: g.plays, scans: g.scans, score: score(g.scoreConfig, { seconds, plays: g.plays, scans: g.scans }) };
  } else {
    g.status = 'PLAYING';
  }
}

export function scan(g) {
  if (g.status !== 'READY') return;
  if (g.seq.includes(null)) {
    g.message = 'Completa todos los movimientos antes de usar Scanner.';
    return;
  }
  g.message = '';
  g.scans++;
  g.idealPaths = Object.fromEntries(STARTS.map((s) => [s, trace(g.level, s, g.seq, { ignoreWalls: true }).points]));
  g.matchPct = match(g.seq, g.level.targetSequence);
  g.collisions = Object.fromEntries(STARTS.map((s) => [s, trace(g.level, s, g.seq)]));
  g.status = 'SCANNING';
}

// End of the Play/Scanner animation. Scanner hints disappear (spec default).
export function settle(g) {
  if (g.status === 'SCANNING') g.collisions = null;
  if (g.status === 'PLAYING' || g.status === 'SCANNING') g.status = 'READY';
}
