// Level state machine. No DOM: main.js calls these and re-renders.
import { levelStarts, entryAngle, trace, match, score } from './engine.js';

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
    // Selected entry: the board turns so it sits at the bottom. SOUTH if present, else the first.
    selected: levelStarts(g.level).includes('SOUTH') ? 'SOUTH' : levelStarts(g.level)[0],
    plays: 0,
    triedStarts: [], // distinct starts the player has tested with Play
    scans: 0,
    startedAt: g.now(),
    idealPaths: null, // start -> points, set by Play
    collisions: null, // start -> {points, blockedAt}, set by Scanner
    matchPct: null,
    message: '',
    result: null,
  });
}

export const selectedStart = (g) => g.selected;

// Next entry going around the circle, so the board turns clockwise.
export function rotate(g) {
  if (g.status !== 'READY') return;
  const order = [...levelStarts(g.level)].sort((a, b) => entryAngle(g.level, b) - entryAngle(g.level, a));
  g.selected = order[(order.indexOf(g.selected) + 1) % order.length];
}

export function selectStart(g, start) {
  if (g.status !== 'READY' || !levelStarts(g.level).includes(start)) return;
  g.selected = start;
}

export function setMove(g, slot, move) {
  if (g.status !== 'READY') return;
  g.seq[slot] = move;
  g.idealPaths = null; // drawn rays belong to the previous sequence
  g.collisions = null;
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
  if (!g.triedStarts.includes(selectedStart(g))) g.triedStarts.push(selectedStart(g));
  g.idealPaths = Object.fromEntries(levelStarts(g.level).map((s) => [s, trace(g.level, s, g.seq, { ignoreWalls: true }).points]));
  g.matchPct = match(g.seq, g.level.targetSequence);
  const won = g.seq.join() === g.level.targetSequence.join() && selectedStart(g) === g.level.correctStart;
  if (won) {
    const seconds = Math.round((g.now() - g.startedAt) / 1000);
    g.status = 'LEVEL_COMPLETED';
    g.idealPaths = { [g.level.correctStart]: g.idealPaths[g.level.correctStart] };
    g.result = { seconds, plays: g.plays, scans: g.scans, startsTried: g.triedStarts.length, score: score(g.scoreConfig, { seconds, plays: g.plays, scans: g.scans }) };
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
  g.idealPaths = Object.fromEntries(levelStarts(g.level).map((s) => [s, trace(g.level, s, g.seq, { ignoreWalls: true }).points]));
  g.matchPct = match(g.seq, g.level.targetSequence);
  g.collisions = Object.fromEntries(levelStarts(g.level).map((s) => [s, trace(g.level, s, g.seq)]));
  // scannerHold (level option): hints stay on screen and the player can keep going.
  if (!g.level.scannerHold) g.status = 'SCANNING';
}

// End of the Play/Scanner animation. Scanner hints disappear (spec default).
export function settle(g) {
  if (g.status === 'SCANNING') g.collisions = null;
  if (g.status === 'PLAYING' || g.status === 'SCANNING') g.status = 'READY';
}
