// Drawing only: reads game state, never changes it.
import { levelStarts, entryCell, entryAngle } from './engine.js';
import { selectedStart } from './game.js';

const NS = 'http://www.w3.org/2000/svg';
const R = 95; // distance from center to the start nodes
export const COLORS = { NORTH: '#3ef0ff', EAST: '#b05cff', SOUTH: '#ff4fd8', WEST: '#5b8cff', NE: '#ff8a3d', SW: '#7dffb2' };
export const LABELS = { NORTH: 'N', EAST: 'E', SOUTH: 'S', WEST: 'O', NE: 'NE', SW: 'SO' };
export const GLYPHS = { UP_LEFT: '↖', UP_RIGHT: '↗', DOWN_LEFT: '↙', DOWN_RIGHT: '↘' };

const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.appendChild(e);
  return e;
};

// Logical cell -> board coordinates before the 45° visual rotation.
function toXY(size, [x, y]) {
  const s = (2 * R) / ((size - 1) * Math.SQRT2);
  const c = (size - 1) / 2;
  return [(x - c) * s, (y - c) * s];
}
const pts = (size, cells) => cells.map((p) => toXY(size, p).join(',')).join(' ');

// Turn the board so the selected entry sits at the bottom (90° in SVG coordinates),
// choosing the equivalent angle closest to the current one so the turn is short.
function boardAngle(g, prev) {
  const a = 90 - entryAngle(g.level, selectedStart(g));
  return prev === undefined ? a : a + 360 * Math.round((prev - a) / 360);
}

export function renderBoard(svg, g, { onStart }) {
  const { size, goal } = g.level;
  // The board group persists across renders so its CSS rotation transition can animate.
  let board = svg.querySelector('.board');
  if (!board) {
    el('clipPath', { id: 'disc' }, el('defs', {}, svg)).appendChild(el('circle', { r: 120 }));
    el('circle', { r: 120, class: 'disc' }, svg);
    board = el('g', { class: 'board', 'clip-path': 'url(#disc)' }, svg);
  }
  const prev = board.dataset.angle === undefined ? undefined : +board.dataset.angle;
  const angle = boardAngle(g, prev);
  board.dataset.angle = angle;
  board.replaceChildren();
  svg.querySelector('.sweep')?.remove();
  board.style.setProperty('--angle', `${angle}deg`);

  // Roads along every grid connection. Walls stay hidden, so this never reveals the maze.
  const roads = el('g', { class: 'roads' }, board);
  for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
    const [x1, y1] = toXY(size, [x, y]);
    for (const [nx, ny] of [[x + 1, y], [x, y + 1]]) {
      if (nx >= size || ny >= size) continue;
      const [x2, y2] = toXY(size, [nx, ny]);
      el('line', { x1, y1, x2, y2, class: 'road' }, roads);
      el('line', { x1, y1, x2, y2, class: 'lane' }, roads);
    }
    el('circle', { cx: x1, cy: y1, r: 4, class: 'dot' }, roads);
  }

  const paths = g.idealPaths ?? {};
  for (const s of Object.keys(paths)) {
    const ideal = paths[s];
    const hit = g.collisions?.[s];
    const won = g.status === 'LEVEL_COMPLETED';
    const cls = won ? 'ray win' : g.status === 'PLAYING' ? 'ray drawing' : 'ray';
    if (hit && hit.blockedAt !== null) {
      // The ray runs into a wall halfway between two cells; the rest of the ideal route is faded.
      const [ax, ay] = toXY(size, ideal[hit.blockedAt]);
      const [bx, by] = toXY(size, ideal[hit.blockedAt + 1]);
      const [mx, my] = [(ax + bx) / 2, (ay + by) / 2];
      const solid = ideal.slice(0, hit.blockedAt + 1).map((p) => toXY(size, p).join(','));
      el('polyline', { points: [...solid, `${mx},${my}`].join(' '), class: cls, stroke: COLORS[s] }, board);
      el('polyline', { points: [`${mx},${my}`, ...pts(size, ideal.slice(hit.blockedAt + 1)).split(' ')].join(' '), class: 'ray ghost', stroke: COLORS[s] }, board);
      crash(board, mx, my, bx - ax, by - ay);
    } else {
      el('polyline', { points: pts(size, ideal), class: cls, stroke: won ? '#ffd76a' : COLORS[s], pathLength: 1 }, board);
    }
  }

  const [gx, gy] = toXY(size, goal);
  const goalG = el('g', { class: 'goal' }, board);
  el('circle', { cx: gx, cy: gy, r: 9 }, goalG);
  label(goalG, gx, gy, '★');

  const selected = selectedStart(g);
  for (const s of levelStarts(g.level)) {
    const [sx, sy] = toXY(size, entryCell(g.level, s));
    const node = el('g', { class: `start${s === selected ? ' selected' : ''}`, tabindex: 0, role: 'button', 'aria-label': `Inicio ${s}` }, board);
    if (s === selected) el('circle', { cx: sx, cy: sy, r: 15, class: 'halo', stroke: COLORS[s] }, node);
    el('circle', { cx: sx, cy: sy, r: s === selected ? 13 : 11, stroke: COLORS[s], fill: s === selected ? COLORS[s] : '#050409' }, node);
    label(node, sx, sy, LABELS[s]);
    node.addEventListener('click', () => onStart(s));
    node.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && onStart(s));
  }

  const held = g.level.scannerHold && g.collisions;
  if (g.status === 'SCANNING' || held) {
    const sweep = el('g', { class: held ? 'sweep loop' : 'sweep' }, svg);
    if (!held) sweep.style.animationDuration = `${g.scannerDurationMs}ms`;
    el('path', { d: 'M0 0 L0 -120 A120 120 0 0 1 60 -104 Z' }, sweep);
  }
  return angle;
}

// Wall segment across the road (perpendicular to travel), plus an impact flash.
function crash(parent, x, y, dx, dy) {
  const len = Math.hypot(dx, dy);
  const [px, py] = [(-dy / len) * 10, (dx / len) * 10];
  const g = el('g', { class: 'crash' }, parent);
  el('circle', { cx: x, cy: y, r: 6, class: 'impact' }, g);
  el('line', { x1: x - px, y1: y - py, x2: x + px, y2: y + py, class: 'wall' }, g);
}

// Text stays upright: .label counter-rotates by the board's --angle (style.css).
function label(parent, x, y, text) {
  el('text', { x, y, class: 'label' }, parent).textContent = text;
}

// Arrow glyphs turn with the board so a move always points the same way on the maze.
export function renderMoves(root, g, activeSlot, { onSlot }, boardTurn) {
  const turn = `rotate(${boardTurn - 45}deg)`;
  root.querySelectorAll('.moves span').forEach((s) => (s.style.transform = turn));
  const slots = root.querySelector('#slots');
  slots.replaceChildren(...g.seq.map((m, i) => {
    const b = document.createElement('button');
    b.className = `slot${i === activeSlot ? ' active' : ''}`;
    b.setAttribute('aria-label', `Movimiento ${i + 1}`);
    b.innerHTML = m ? `<span style="transform:${turn}">${GLYPHS[m]}</span>` : '_';
    b.onclick = () => onSlot(i);
    return b;
  }));
}
