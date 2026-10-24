// Wiring: load data, validate levels, connect DOM events to game.js, re-render.
import { validateLevel } from './engine.js';
import * as game from './game.js';
import { renderBoard, renderMoves } from './render.js';
import { renderGrover } from './grover.js';
import * as daily from './daily.js';

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

let mode = 'levels'; // 'levels' | 'daily'
let index = 0;
let today = daily.todayKey();
let streakState = daily.loadStreak();
let g;
let activeSlot = 0;

function start(level) {
  g = game.createGame(level, levelData.defaults);
  activeSlot = 0;
  render();
}

function load(i) {
  mode = 'levels';
  index = i;
  start(levels[index]);
}

function loadDaily() {
  today = daily.todayKey();
  const level = daily.dailyLevel(today);
  if (!level) {
    $('message').textContent = 'No se pudo generar el reto de hoy.';
    return;
  }
  mode = 'daily';
  start(level);
  if (streakState.last === today) {
    g.message = 'Ya resolviste el reto de hoy. Puedes repetirlo; la racha no cambia. ¡Vuelve mañana!';
    render();
  }
}

function render() {
  renderBoard($('board'), g, { onStart: (s) => { game.selectStart(g, s); render(); } });
  renderMoves(document.body, g, activeSlot, { onSlot: (i) => { activeSlot = i; render(); } });
  $('level-num').textContent = mode === 'daily' ? 'diario' : `${index + 1}/${levels.length}`;
  $('level-title').textContent = g.level.title;
  $('plays').textContent = g.plays;
  $('scans').textContent = g.scans;
  $('message').textContent = g.message;
  $('streak').textContent = daily.currentStreak(streakState, today);
  $('mode-levels').classList.toggle('active', mode === 'levels');
  $('mode-daily').classList.toggle('active', mode === 'daily');
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

// activeSlot === null means the sequence was just completed: the next arrow starts a new one.
document.querySelectorAll('[data-move]').forEach((b) => (b.onclick = () => {
  if (activeSlot === null) {
    g.seq.forEach((_, i) => game.setMove(g, i, null));
    activeSlot = 0;
  }
  game.setMove(g, activeSlot, b.dataset.move);
  activeSlot = activeSlot + 1 < g.seq.length ? activeSlot + 1 : null;
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
$('mode-levels').onclick = () => load(index);
$('mode-daily').onclick = () => loadDaily();

function showWin() {
  const r = g.result;
  $('win-score').textContent = r.score;
  $('win-stats').innerHTML = [['⏱ Tiempo', `${r.seconds}s`], ['▶ Play', r.plays], ['◎ Scanner', r.scans]]
    .map(([k, v]) => `<div class="tile"><b>${v}</b><span>${k}</span></div>`).join('');
  $('win-daily').hidden = mode !== 'daily';
  $('share-msg').textContent = '';
  if (mode === 'daily') {
    streakState = daily.recordSolve(streakState, today, r);
    daily.saveStreak(streakState);
    $('win-streak').innerHTML = `🔥 Racha: <b>${streakState.streak}</b> día${streakState.streak === 1 ? '' : 's'} · Mejor: ${streakState.best} · Nuevo reto mañana`;
    $('win-next').textContent = 'Ir a los niveles';
  } else {
    $('win-next').textContent = index + 1 < levels.length ? 'Siguiente nivel' : 'Volver al nivel 1';
  }
  renderGrover($('grover'), groverData, g.level.correctStart);
  render();
  $('win').showModal();
}
$('win-retry').onclick = () => { $('win').close(); mode === 'daily' ? loadDaily() : load(index); };
$('win-next').onclick = () => { $('win').close(); load(mode === 'daily' ? index : (index + 1) % levels.length); };

$('share').onclick = async () => {
  const r = g.result;
  const text = `Quantum Maze · ${g.level.title}\n🔥 Racha ${streakState.streak} · ⏱ ${r.seconds}s · ▶ ${r.plays} · ◎ ${r.scans}\nPuntuación ${r.score}\n${location.origin}`;
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); $('share-msg').textContent = '¡Copiado!'; }
  } catch {
    $('share-msg').textContent = 'No se pudo compartir.';
  }
};

if (levels.length) load(0);
else $('message').textContent = 'No hay niveles válidos para jugar.';
