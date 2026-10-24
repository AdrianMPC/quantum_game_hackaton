import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validateLevel, match, score, STARTS, levelStarts } from '../src/engine.js';
import { dailyLevel, recordSolve, currentStreak, todayKey, puzzleNumber } from '../src/daily.js';
import { createGame, setMove, play, scan, settle, rotate, selectStart, reset, selectedStart } from '../src/game.js';

const data = JSON.parse(readFileSync(new URL('../levels.json', import.meta.url)));
const lengths = data.levels.map((l) => l.targetSequence.length);

test('four levels with 2, 3, 4 and 6 entries, each valid with a unique solution', () => {
  assert.deepEqual(lengths, [1, 2, 3, 3]);
  assert.deepEqual(data.levels.map((l) => (l.starts ?? STARTS).length), [2, 3, 4, 6]);
  for (const level of data.levels) assert.deepEqual(validateLevel(level), [], level.id);
});

test('tutorial: one entry, two routes; the scripted wrong route crashes, the right one wins', () => {
  const t = data.tutorial;
  assert.deepEqual(validateLevel(t), []);
  assert.deepEqual(t.starts, ['SOUTH']);
  const g = createGame(t, data.defaults);
  rotate(g); // only one entry: rotating keeps it selected
  assert.equal(selectedStart(g), 'SOUTH');
  ['UP_RIGHT', 'UP_LEFT'].forEach((m, i) => setMove(g, i, m)); // tutorial's first try
  play(g);
  assert.equal(g.status, 'PLAYING');
  assert.equal(Object.keys(g.idealPaths).length, 1);
  settle(g);
  scan(g);
  assert.equal(g.collisions.SOUTH.blockedAt, 1); // crashes on the second move
  settle(g);
  ['UP_LEFT', 'UP_RIGHT'].forEach((m, i) => setMove(g, i, m));
  play(g);
  assert.equal(g.status, 'LEVEL_COMPLETED');
});

test('broken level reports errors without throwing', () => {
  const lvl1 = data.levels[0];
  assert.ok(validateLevel({ ...data.levels[2], walls: [] }).some((e) => e.includes('solución alternativa')));
  assert.ok(validateLevel({ ...lvl1, starts: ['NORTH', 'NOPE'] }).length > 0);
  assert.ok(validateLevel({ ...lvl1, goal: [9, 9] }).length > 0);
  assert.ok(validateLevel({ ...lvl1, targetSequence: ['UP_LEFT', 'UP_LEFT', 'UP_LEFT', 'UP_LEFT'] }).length > 0);
  assert.ok(validateLevel(null).length > 0);
});

test('match follows spec example', () => {
  assert.equal(match(['UP_LEFT', 'DOWN_LEFT', 'DOWN_RIGHT'], ['UP_LEFT', 'UP_RIGHT', 'DOWN_RIGHT']), 66.7);
  assert.equal(match([], []), null);
});

test('score clamps at zero', () => {
  const cfg = data.defaults.scoreConfig;
  assert.equal(score(cfg, { seconds: 10, plays: 2, scans: 1 }), 1000 - 20 - 50 - 10);
  assert.equal(score(cfg, { seconds: 10_000, plays: 0, scans: 0 }), 0);
});

function solve(level, now) {
  const g = createGame(level, data.defaults, now);
  level.targetSequence.forEach((m, i) => setMove(g, i, m));
  selectStart(g, level.correctStart);
  return g;
}

test('only correct sequence + start wins, regardless of rotation history', () => {
  for (const level of data.levels) {
    for (const s of levelStarts(level)) {
      const g = solve(level);
      selectStart(g, s);
      play(g);
      assert.equal(g.status === 'LEVEL_COMPLETED', s === level.correctStart, `${level.id} ${s}`);
    }
    const g = solve(level);
    levelStarts(level).forEach(() => rotate(g)); // full turn: same selection, same outcome
    assert.equal(selectedStart(g), level.correctStart);
    play(g);
    assert.equal(g.status, 'LEVEL_COMPLETED');
    assert.deepEqual(Object.keys(g.idealPaths), [level.correctStart]);
  }
});

test('counters increment once per action; incomplete sequence is rejected; reset clears', () => {
  const level = data.levels[2];
  let t = 0;
  const g = createGame(level, data.defaults, () => t);
  play(g);
  assert.equal(g.plays, 0);
  assert.ok(g.message);
  ['UP_LEFT', 'UP_LEFT', 'UP_LEFT'].forEach((m, i) => setMove(g, i, m));
  play(g);
  play(g); // ignored while animating
  assert.equal(g.plays, 1);
  settle(g);
  scan(g);
  assert.equal(g.scans, 1);
  assert.equal(Object.keys(g.collisions).length, 4);
  settle(g);
  assert.equal(g.collisions, null);
  t = 30_000;
  setMove(g, 1, 'UP_RIGHT');
  selectStart(g, level.correctStart);
  play(g);
  assert.equal(g.status, 'LEVEL_COMPLETED');
  // First Play used the default start (SOUTH, which is also correct here), so one distinct start.
  assert.deepEqual(g.result, { seconds: 30, plays: 2, scans: 1, startsTried: 1, score: 1000 - 60 - 50 - 10 });
  reset(g);
  assert.deepEqual([g.plays, g.scans, g.selected, g.status, g.seq], [0, 0, 'SOUTH', 'READY', [null, null, null]]);
});

test('daily puzzle: valid every day for a year and identical for the same date', () => {
  for (let i = 0; i < 366; i++) {
    const k = todayKey(new Date(2026, 9, 24 + i));
    const lvl = dailyLevel(k);
    assert.ok(lvl, k);
    assert.deepEqual(validateLevel(lvl), [], k);
  }
  assert.deepEqual(dailyLevel('2026-11-03'), dailyLevel('2026-11-03'));
  assert.notDeepEqual(dailyLevel('2026-11-03'), dailyLevel('2026-11-04'));
  assert.equal(puzzleNumber('2026-10-24'), 1);
});

test('streak: consecutive days grow, replay is a no-op, a gap resets', () => {
  let s = recordSolve({}, '2026-10-30', { score: 900 });
  s = recordSolve(s, '2026-10-31', { score: 800 });
  s = recordSolve(s, '2026-11-01', { score: 700 }); // month boundary
  assert.equal(s.streak, 3);
  assert.equal(recordSolve(s, '2026-11-01', { score: 1 }).streak, 3);
  assert.equal(currentStreak(s, '2026-11-02'), 3); // not played yet today: still alive
  assert.equal(currentStreak(s, '2026-11-03'), 0); // missed a day
  s = recordSolve(s, '2026-11-03', { score: 500 });
  assert.deepEqual([s.streak, s.best], [1, 3]);
});

test('amplify.json matches theory: P(k) = sin²((2k+1)·asin(1/√N)) for every N and marked gate', () => {
  const q = JSON.parse(readFileSync(new URL('../quantum/amplify.json', import.meta.url)));
  for (const N of [2, 3, 4, 6]) {
    const th = Math.asin(1 / Math.sqrt(N));
    for (let m = 0; m < N; m++) {
      q.sizes[N].marked[m].iterations.forEach((it, k) => {
        assert.ok(Math.abs(it.probabilities[m] - Math.sin((2 * k + 1) * th) ** 2) < 1e-5, `N=${N} m=${m} k=${k}`);
        assert.equal(it.counts.reduce((a, b) => a + b, 0), q.shots); // no shot lands outside the N gates
      });
    }
  }
  // Every level (and the daily puzzle) has data for its gate count.
  for (const lvl of data.levels) assert.ok(q.sizes[levelStarts(lvl).length], lvl.id);
});
