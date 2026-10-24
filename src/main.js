// Wiring: load data, validate levels, connect DOM events to game.js, re-render.
import { validateLevel } from './engine.js';
import * as game from './game.js';
import { renderBoard, renderMoves, LABELS } from './render.js';
import { renderGrover } from './grover.js';

const PLAY_ANIMATION_MS = 900;
const $ = (id) => document.getElementById(id);

const levelData = await fetch('levels.json').then((r) => r.json());
const groverData = await fetch('quantum/grover.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);

// Invalid levels are reported and skipped; the rest stay playable.
const problems = [];
const levels = levelData.levels.filter((lvl) => {
  const errors = validateLevel(lvl);
  if (errors.length) {
    console.error(`Nivel ${lvl?.id} inválido:`, errors);
    problems.push(`${lvl?.id}: ${errors.join('; ')}`);
  }
  return !errors.length;
});
if (problems.length) {
  $('config-error').hidden = false;
  $('config-error').textContent = `Configuración de nivel inválida (omitido): ${problems.join(' | ')}`;
}

let index = 0;
let g;
let activeSlot = 0;

function load(i) {
  index = i;
  g = game.createGame(levels[index], levelData.defaults);
  activeSlot = 0;
  render();
}

function render() {
  renderBoard($('board'), g, { onStart: (s) => { game.selectStart(g, s); render(); } });
  renderMoves(document.body, g, activeSlot, { onSlot: (i) => { activeSlot = i; render(); } });
  $('level-num').textContent = `${index + 1}/${levels.length}`;
  $('level-title').textContent = g.level.title;
  $('plays').textContent = g.plays;
  $('scans').textContent = g.scans;
  $('match').textContent = g.matchPct === null ? '–' : `${g.matchPct} %`;
  $('selected').textContent = LABELS[game.selectedStart(g)];
  $('message').textContent = g.message;
  const busy = g.status !== 'READY';
  document.querySelectorAll('.controls button').forEach((b) => (b.disabled = busy));
}

function tick() {
  if (g && g.status !== 'LEVEL_COMPLETED') $('time').textContent = Math.floor((Date.now() - g.startedAt) / 1000);
}
setInterval(tick, 250);

function settleAfter(ms) {
  setTimeout(() => { game.settle(g); render(); }, ms);
}

document.querySelectorAll('[data-move]').forEach((b) => (b.onclick = () => {
  game.setMove(g, activeSlot, b.dataset.move);
  activeSlot = Math.min(activeSlot + 1, g.seq.length - 1);
  render();
}));

$('play').onclick = () => {
  game.play(g);
  render();
  if (g.status === 'PLAYING') settleAfter(PLAY_ANIMATION_MS);
  if (g.status === 'LEVEL_COMPLETED') setTimeout(showWin, PLAY_ANIMATION_MS);
};
$('scan').onclick = () => {
  game.scan(g);
  render();
  if (g.status === 'SCANNING') settleAfter(g.scannerDurationMs);
};
$('rotate').onclick = () => { game.rotate(g); render(); };
$('reset').onclick = () => { game.reset(g); activeSlot = 0; render(); };

function showWin() {
  const r = g.result;
  $('win-score').textContent = r.score;
  $('win-stats').innerHTML = [['⏱ Tiempo', `${r.seconds}s`], ['▶ Play', r.plays], ['◎ Scanner', r.scans]]
    .map(([k, v]) => `<div class="tile"><b>${v}</b><span>${k}</span></div>`).join('');
  $('win-next').textContent = index + 1 < levels.length ? 'Siguiente nivel' : 'Volver al nivel 1';
  renderGrover($('grover'), groverData, g.level.correctStart);
  $('win').showModal();
}
$('win-retry').onclick = () => { $('win').close(); load(index); };
$('win-next').onclick = () => { $('win').close(); load((index + 1) % levels.length); };

if (levels.length) load(0);
else $('message').textContent = 'No hay niveles válidos para jugar.';
