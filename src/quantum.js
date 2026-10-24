// «¿Y si fuera cuántico?» panel. Separate from the puzzle score (spec §3):
// classical random guessing vs amplitude-amplification probabilities precomputed with Qiskit
// (quantum/amplify.py) for the number of gates in the level.
import { COLORS, LABELS } from './render.js';

const TRIALS = 1000;
const pct = (p) => `${String(Math.round(p * 1000) / 10).replace('.', ',')} %`;

// Blind classical search: open gates in a random order (Fisher–Yates) until hitting the marked one.
function sampleClassical(N, marked) {
  const hist = Array(N).fill(0);
  for (let t = 0; t < TRIALS; t++) {
    const order = [...Array(N).keys()];
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    hist[order.indexOf(marked)]++;
  }
  const mean = hist.reduce((a, n, i) => a + n * (i + 1), 0) / TRIALS;
  return { hist, mean };
}

const bars = (rows) =>
  `<div class="bars">${rows
    .map(({ name, value, text, color }) => `<div class="bar"><span>${name}</span><i style="width:${(value * 100).toFixed(1)}%;background:${color}"></i><b>${text}</b></div>`)
    .join('')}</div>`;

// What each iteration does, written from the actual probabilities.
function stepText(N, probs, k) {
  if (k === 0) return `Superposición uniforme: ${pct(1 / N)} por compuerta. Medir ahora es igual que adivinar al azar.`;
  const p = probs[k];
  if (p <= probs[0] + 1e-6) {
    return N === 2
      ? `Con solo 2 compuertas la amplificación no ayuda: sigue en ${pct(p)}. Lo cuántico no siempre gana.`
      : `Te pasaste: la amplificación es una rotación; girar de más baja la probabilidad a ${pct(p)}.`;
  }
  if (p < probs[k - 1]) return `Te pasaste: la amplificación es una rotación del estado; girar de más baja la probabilidad a ${pct(p)}.`;
  return `${k} iteración${k > 1 ? 'es' : ''}: el oráculo invierte el signo de la compuerta correcta y el difusor amplifica su amplitud. Probabilidad de acertar: ${pct(p)}.`;
}

// The player's own run vs the classical average vs the best amplification result.
function versus(N, best, result) {
  const avg = (N + 1) / 2;
  const rows = [
    { name: 'Tú (clásico)', n: result.plays, note: `${result.plays} Play · ${result.startsTried} de ${N} compuertas probadas` },
    { name: 'Azar clásico', n: avg, note: `${String(avg).replace('.', ',')} consultas en promedio` },
    { name: 'Cuántico', n: best.k || 1, note: best.k ? `${best.k} iteración${best.k > 1 ? 'es' : ''} · ${pct(best.p)} de acierto` : `sin mejora · ${pct(best.p)}` },
  ];
  const max = Math.max(...rows.map((r) => r.n));
  return `<div class="versus">
    <h4>Tu partida vs cuántico</h4>
    ${bars(rows.map((r, i) => ({ name: r.name, value: r.n / max, text: r.note, color: ['#3ef0ff', '#8a80a8', '#ffd76a'][i] })))}
    <p class="muted small">Cada Play es una consulta «¿es esta compuerta y esta secuencia?». La parte cuántica solo busca la compuerta
      entre ${N}; tú además tenías que descubrir la secuencia.</p>
  </div>`;
}

// gates: the level's gate names in order; marked: the correct gate's name.
export function renderQuantum(root, data, gates, marked, result) {
  const N = gates.length;
  const size = data?.sizes?.[N];
  if (!size) {
    root.innerHTML = N < 2 ? '' : '<p class="muted">Datos cuánticos no disponibles para este nivel.</p>';
    return;
  }
  const mi = gates.indexOf(marked);
  const m = size.marked[mi];
  const probs = m.iterations.map((it) => it.probabilities[mi]);
  const bestK = probs.indexOf(Math.max(...probs));
  const best = { k: probs[bestK] > probs[0] + 1e-6 ? bestK : 0, p: probs[bestK] };
  let step = best.k || 1;

  root.innerHTML = `<details><summary><h3>✦ ¿Y si fuera cuántico? ✦</h3></summary>
    <p>La compuerta correcta era <b>${LABELS[marked] ?? marked}</b>. Imagina que solo puedes preguntar «¿es esta?» a una caja negra.</p>
    ${result ? versus(N, best, result) : ''}
    <div class="cols">
      <div>
        <h4>Clásico: muestreo al azar</h4>
        <p class="muted">Probar compuertas en orden aleatorio. El número de intentos sigue una distribución uniforme en 1–${N}: media (N+1)/2 = ${String((N + 1) / 2).replace('.', ',')}.</p>
        <button data-act="sample">Adivinar al azar ×${TRIALS}</button>
        <div data-out="classical"></div>
      </div>
      <div>
        <h4>Cuántico: amplificación de amplitud con ${size.qubits} qubit${size.qubits > 1 ? 's' : ''}</h4>
        <p class="muted">Cada compuerta es un estado de la base (${gates.map((g, i) => `|${size.marked[i].bits}⟩`).join(' ')}). La medición sigue la regla de Born: probabilidad = |amplitud|².</p>
        <div class="stepper" role="group" aria-label="Iteraciones de amplificación">
          ${[0, 1, 2].map((k) => `<button data-step="${k}">${k} iter.</button>`).join('')}
        </div>
        <div data-out="quantum"></div>
      </div>
    </div>
    <details><summary>Ver circuito Qiskit (1 iteración)</summary><pre>${m.circuit}</pre></details>
    <p class="muted small">Probabilidad de medición — simulación ideal sin ruido con Qiskit ${data.qiskit}
      (Statevector; conteos con StatevectorSampler, ${data.shots} disparos, semilla ${data.seed}).
      Con tan pocas compuertas no hay ventaja práctica: el objetivo es ver cómo un algoritmo cuántico reforma una distribución.</p></details>`;

  const showQuantum = () => {
    const it = m.iterations[step];
    root.querySelectorAll('[data-step]').forEach((b) => b.classList.toggle('active', +b.dataset.step === step));
    root.querySelector('[data-out="quantum"]').innerHTML =
      bars(gates.map((g, i) => ({
        name: `${LABELS[g] ?? g} |${size.marked[i].bits}⟩`,
        value: it.probabilities[i],
        text: `${pct(it.probabilities[i])} · ${it.counts[i]}/${data.shots}`,
        color: g === marked ? '#ffd76a' : COLORS[g] ?? '#8a80a8',
      }))) + `<p>${stepText(N, probs, step)}</p>`;
  };

  root.querySelectorAll('[data-step]').forEach((b) => (b.onclick = () => { step = +b.dataset.step; showQuantum(); }));
  root.querySelector('[data-act="sample"]').onclick = () => {
    const { hist, mean } = sampleClassical(N, mi);
    root.querySelector('[data-out="classical"]').innerHTML =
      bars(hist.map((n, i) => ({ name: `${i + 1} intento${i ? 's' : ''}`, value: n / TRIALS, text: `${n}`, color: '#8a80a8' }))) +
      `<p>Media observada: <b>${mean.toFixed(2)}</b> intentos (teórica ${String((N + 1) / 2).replace('.', ',')}).</p>`;
  };
  showQuantum();
}
