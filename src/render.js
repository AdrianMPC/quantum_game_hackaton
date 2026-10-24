// Drawing only: reads game state, never changes it.
import { STARTS, startCell } from './engine.js';
import { selectedStart } from './game.js';

const NS = 'http://www.w3.org/2000/svg';
const R = 95; // distance from center to the start nodes
export const COLORS = { NORTH: '#4fd1ff', EAST: '#b18cff', SOUTH: '#ff7ab6', WEST: '#7dffb2' };
export const LABELS = { NORTH: 'N', EAST: 'E', SOUTH: 'S', WEST: 'O' };
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

export const boardAngle = (g) => 45 + 90 * g.rotation;

export function renderBoard(svg, g, { onStart }) {
  const { size, goal } = g.level;
  const angle = boardAngle(g);
  // The board group persists across renders so its CSS rotation transition can animate.
  let board = svg.querySelector('.board');
  if (!board) {
    el('clipPath', { id: 'disc' }, el('defs', {}, svg)).appendChild(el('circle', { r: 120 }));
    el('circle', { r: 120, class: 'disc' }, svg);
    board = el('g', { class: 'board', 'clip-path': 'url(#disc)' }, svg);
  }
  board.replaceChildren();
  svg.querySelector('.sweep')?.remove();
  board.style.setProperty('--angle', `${angle}deg`);

  for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
    const [cx, cy] = toXY(size, [x, y]);
    el('circle', { cx, cy, r: 1.6, class: 'dot' }, board);
  }

  const paths = g.idealPaths ?? {};
  for (const s of Object.keys(paths)) {
    const ideal = paths[s];
    const hit = g.collisions?.[s];
    const won = g.status === 'LEVEL_COMPLETED';
    const cls = won ? 'ray win' : g.status === 'PLAYING' ? 'ray drawing' : 'ray';
    if (hit && hit.blockedAt !== null) {
      // Reachable part solid, the rest of the ideal route faded, wall marked between the cells.
      el('polyline', { points: pts(size, ideal.slice(0, hit.blockedAt + 1)), class: cls, stroke: COLORS[s] }, board);
      el('polyline', { points: pts(size, ideal.slice(hit.blockedAt)), class: 'ray ghost', stroke: COLORS[s] }, board);
      const [ax, ay] = toXY(size, ideal[hit.blockedAt]);
      const [bx, by] = toXY(size, ideal[hit.blockedAt + 1]);
      el('circle', { cx: (ax + bx) / 2, cy: (ay + by) / 2, r: 5, class: 'hit' }, board);
    } else {
      el('polyline', { points: pts(size, ideal), class: cls, stroke: won ? '#ffd76a' : COLORS[s], pathLength: 1 }, board);
    }
  }

  const [gx, gy] = toXY(size, goal);
  const goalG = el('g', { class: 'goal' }, board);
  el('circle', { cx: gx, cy: gy, r: 9 }, goalG);
  label(goalG, gx, gy, '★');

  const selected = selectedStart(g);
  for (const s of STARTS) {
    const [sx, sy] = toXY(size, startCell(size, s));
    const node = el('g', { class: `start${s === selected ? ' selected' : ''}`, tabindex: 0, role: 'button', 'aria-label': `Inicio ${s}` }, board);
    el('circle', { cx: sx, cy: sy, r: 11, stroke: COLORS[s] }, node);
    label(node, sx, sy, LABELS[s]);
    node.addEventListener('click', () => onStart(s));
    node.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && onStart(s));
  }

  if (g.status === 'SCANNING') {
    const sweep = el('g', { class: 'sweep' }, svg);
    sweep.style.animationDuration = `${g.scannerDurationMs}ms`;
    el('path', { d: 'M0 0 L0 -120 A120 120 0 0 1 60 -104 Z' }, sweep);
  }
}

// Text stays upright: .label counter-rotates by the board's --angle (style.css).
function label(parent, x, y, text) {
  el('text', { x, y, class: 'label' }, parent).textContent = text;
}

// Arrow glyphs turn with the board so a move always points the same way on the maze.
export function renderMoves(root, g, activeSlot, { onSlot }) {
  const turn = `rotate(${90 * g.rotation}deg)`;
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
