// Pure maze logic: no DOM, no state. Shared by the browser and node tests.

// Board-absolute moves on the logical grid. The grid is drawn rotated 45° clockwise,
// so each logical axis step appears as a diagonal on screen.
export const MOVES = {
  UP_LEFT: [-1, 0],
  UP_RIGHT: [0, -1],
  DOWN_LEFT: [0, 1],
  DOWN_RIGHT: [1, 0],
};

// Clockwise order; index matters for rotation (see game.js).
export const STARTS = ['NORTH', 'EAST', 'SOUTH', 'WEST'];

export function startCell(size, start) {
  const m = size - 1;
  return { NORTH: [0, 0], EAST: [m, 0], SOUTH: [m, m], WEST: [0, m] }[start];
}

const key = ([x, y]) => `${x},${y}`;
const edgeKey = (a, b) => [key(a), key(b)].sort().join('|');
const inside = (size, [x, y]) => x >= 0 && y >= 0 && x < size && y < size;
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

// Follow `seq` from `start`. With walls, stop at the first blocked connection
// (wall or grid boundary); blockedAt is the index of the move that failed.
export function trace(level, start, seq, { ignoreWalls = false } = {}) {
  const walls = new Set(level.walls.map(([a, b]) => edgeKey(a, b)));
  let cur = startCell(level.size, start);
  const points = [cur];
  for (let i = 0; i < seq.length; i++) {
    const [dx, dy] = MOVES[seq[i]];
    const next = [cur[0] + dx, cur[1] + dy];
    if (!ignoreWalls && (!inside(level.size, next) || walls.has(edgeKey(cur, next)))) {
      return { points, blockedAt: i, end: cur };
    }
    points.push(next);
    cur = next;
  }
  return { points, blockedAt: null, end: cur };
}

export function reachesGoal(level, start, seq) {
  const t = trace(level, start, seq);
  return t.blockedAt === null && same(t.end, level.goal);
}

function allSequences(len) {
  let seqs = [[]];
  for (let i = 0; i < len; i++) seqs = seqs.flatMap((s) => Object.keys(MOVES).map((m) => [...s, m]));
  return seqs;
}

// Returns a list of human-readable problems; empty means the level is playable.
export function validateLevel(level) {
  const errors = [];
  const L = level?.targetSequence?.length;
  if (!Number.isInteger(level?.size) || level.size < 2) errors.push('size debe ser un entero ≥ 2');
  if (!Array.isArray(level?.targetSequence) || L < 1 || L > 3) errors.push('targetSequence debe tener de 1 a 3 movimientos');
  else if (level.targetSequence.some((m) => !MOVES[m])) errors.push('targetSequence contiene movimientos desconocidos');
  if (!STARTS.includes(level?.correctStart)) errors.push(`correctStart desconocido: ${level?.correctStart}`);
  if (!Array.isArray(level?.goal) || !inside(level.size, level.goal)) errors.push('goal fuera del tablero');
  if (!Array.isArray(level?.walls)) errors.push('walls debe ser una lista');
  else for (const [a, b] of level.walls) {
    if (!a || !b || !inside(level.size, a) || !inside(level.size, b) || Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) {
      errors.push(`muro inválido: ${JSON.stringify([a, b])}`);
    }
  }
  if (errors.length) return errors;

  if (!reachesGoal(level, level.correctStart, level.targetSequence)) {
    errors.push('la secuencia objetivo no llega al destino desde el inicio correcto');
  }
  for (const s of STARTS) {
    if (s !== level.correctStart && trace(level, s, level.targetSequence).blockedAt === null) {
      errors.push(`el inicio ${s} no choca con ningún muro usando la secuencia objetivo`);
    }
  }
  for (const s of STARTS) for (const seq of allSequences(L)) {
    const isTarget = s === level.correctStart && seq.join() === level.targetSequence.join();
    if (!isTarget && reachesGoal(level, s, seq)) errors.push(`solución alternativa: ${s} + ${seq.join(', ')}`);
  }
  return errors;
}

// Sequence match: classical position-by-position comparison, not a probability.
export function match(input, target) {
  if (!target.length) return null;
  const hits = target.filter((m, i) => input[i] === m).length;
  return Math.round((hits / target.length) * 1000) / 10;
}

export function score(cfg, { seconds, plays, scans }) {
  return Math.max(0, Math.round(cfg.baseScore - seconds * cfg.timePenaltyPerSecond - plays * cfg.playPenalty - scans * cfg.scannerPenalty));
}
