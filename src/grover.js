// «¿Y si fuera cuántico?» panel. Separate from the puzzle score (spec §3):
// classical random guessing vs Grover measurement probabilities precomputed with Qiskit.
import { STARTS } from './engine.js';
import { COLORS, LABELS } from './render.js';

const TRIALS = 1000;

const STEP_TEXT = [
  'Superposición uniforme (H en ambos qubits): 25 % por inicio. Medir ahora es igual que adivinar al azar.',
  'Una iteración: el oráculo invierte el signo del inicio correcto y el difusor refleja las amplitudes sobre su media. Con 4 candidatos, la probabilidad llega a 100 %.',
  'Dos iteraciones: te pasaste. Grover es una rotación del vector de estado; girar de más baja la probabilidad a 25 %. No es "probar todo a la vez".',
];

// Blind classical search: open starts in a random order (Fisher–Yates) until hitting the marked one.
function sampleClassical(marked) {
  const hist = [0, 0, 0, 0];
  for (let t = 0; t < TRIALS; t++) {
    const order = [...STARTS];
    for (let i = order.length - 1; i > 0; i--) {
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

export function renderGrover(root, data, marked) {
  if (!data) {
    root.innerHTML = '<p class="muted">Datos cuánticos no disponibles (falta quantum/grover.json).</p>';
    return;
  }
  const m = data.marked[marked];
  let step = 1;

  root.innerHTML = `
    <h3>¿Y si fuera cuántico?</h3>
    <p>El inicio correcto era <b>${LABELS[marked]}</b>. Imagina que solo puedes preguntar «¿es este?» a una caja negra.</p>
    <div class="cols">
      <div>
        <h4>Clásico: muestreo al azar</h4>
        <p class="muted">Probar inicios en orden aleatorio. El número de intentos sigue una distribución uniforme en 1–4: media (N+1)/2 = 2,5.</p>
        <button data-act="sample">Adivinar al azar ×${TRIALS}</button>
        <div data-out="classical"></div>
      </div>
      <div>
        <h4>Cuántico: Grover con 2 qubits</h4>
        <p class="muted">4 inicios = 4 estados |00⟩ |01⟩ |10⟩ |11⟩. La medición sigue la regla de Born: probabilidad = |amplitud|².</p>
        <div class="stepper" role="group" aria-label="Iteraciones de Grover">
          ${[0, 1, 2].map((k) => `<button data-step="${k}">${k} iter.</button>`).join('')}
        </div>
        <div data-out="quantum"></div>
      </div>
    </div>
    <details><summary>Ver circuito Qiskit (1 iteración)</summary><pre>${m.circuit}</pre></details>
    <p class="muted small">Probabilidad de medición — simulación ideal sin ruido con Qiskit ${data.qiskit}
      (Statevector; conteos con StatevectorSampler, ${data.shots} disparos, semilla ${data.seed}).
      Con 4 candidatos no hay ventaja práctica: el objetivo es ver cómo un algoritmo cuántico reforma una distribución.</p>`;

  const showQuantum = () => {
    const it = m.iterations[step];
    root.querySelectorAll('[data-step]').forEach((b) => b.classList.toggle('active', +b.dataset.step === step));
    root.querySelector('[data-out="quantum"]').innerHTML =
      bars(STARTS.map((s) => ({
        name: `${LABELS[s]} |${data.marked[s].bits}⟩`,
        value: it.probabilities[s],
        text: `${Math.round(it.probabilities[s] * 100)} % · ${it.counts[s]}/${data.shots}`,
        color: s === marked ? '#ffd76a' : COLORS[s],
      }))) + `<p>${STEP_TEXT[step]}</p>`;
  };

  root.querySelectorAll('[data-step]').forEach((b) => (b.onclick = () => { step = +b.dataset.step; showQuantum(); }));
  root.querySelector('[data-act="sample"]').onclick = () => {
    const { hist, mean } = sampleClassical(marked);
    root.querySelector('[data-out="classical"]').innerHTML =
      bars(hist.map((n, i) => ({ name: `${i + 1} intento${i ? 's' : ''}`, value: n / TRIALS, text: `${n}`, color: '#8aa0c8' }))) +
      `<p>Media observada: <b>${mean.toFixed(2)}</b> intentos (teórica 2,5). Grover: 1 consulta al oráculo y luego medir.</p>`;
  };
  showQuantum();
}
