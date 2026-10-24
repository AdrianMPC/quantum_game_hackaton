# Quantum Maze

EdTech prototype for the Qiskit Fall Fest 2026 hackathon (IEEE CS PUCP challenge).

A deduction puzzle on a circular board with a hidden maze. Players work out which of four starts, combined with a short
sequence of moves, reaches the goal. After each level, a separate panel compares **classical random sampling**
(statistics/Monte Carlo) with **Grover's algorithm** over the same four candidates, simulated with Qiskit.

Concept mapping: a probability distribution over candidates. Blind classical search samples uniformly, so the
number of tries is uniform on 1–4 with mean (N+1)/2 = 2.5. In the quantum version, the four starts are the basis
states of 2 qubits. The measurement distribution follows the Born rule, and one Grover iteration (oracle + diffuser)
reshapes it from 25% each to 100% on the marked start. A second iteration overshoots back to 25%.

## Run

Static site with no build step and no runtime dependencies.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
npm test                      # node --test (Node 22+)
uv run quantum/grover.py      # regenerate quantum/grover.json with Qiskit
```

## Structure

| Path | Role |
| --- | --- |
| `levels.json` | Level data (grid size, walls, goal, correct start, target sequence) and scoring parameters |
| `src/engine.js` | Pure logic: moves, path tracing, level validation (including solution uniqueness), match %, score |
| `src/game.js` | Level state machine (READY / PLAYING / SCANNING / LEVEL_COMPLETED), no DOM |
| `src/render.js` | SVG board, rays, scanner sweep; draws state, holds no rules |
| `src/daily.js` | Daily puzzle generated from the date (same for everyone, validated by the engine) and the local streak |
| `src/grover.js` | "¿Y si fuera cuántico?" panel: classical sampler + Grover distributions |
| `src/main.js` | Loads data, validates levels, wires events |
| `quantum/grover.py` | Qiskit script that produces `quantum/grover.json` |
| `test/engine.test.js` | Validates every level, scoring, game rules, Grover output |

Adding a level means adding an object to `levels.json`. `validateLevel` rejects levels where another start or
sequence also reaches the goal, or where a wrong start never hits a wall. Invalid levels are reported in the UI and skipped.

## Reproducibility

- Qiskit 2.6.1 (pinned in the script header), Python 3.13 via `uv`, seed 42, 1024 shots.
- Exact probabilities come from `Statevector`; sampled counts come from `StatevectorSampler(seed=42)`.
- Re-running the script gives a byte-identical `grover.json`.

## Honest limitations

- The maze puzzle is classical. The four rays are a visual analogy, computed one by one; they are not superposition
  and show no quantum advantage.
- The % next to the moves is a sequence match (position-by-position comparison with the solution), not a probability. Its tooltip says so.
- The Grover panel is an ideal, noiseless simulation of 4 candidates. At N = 4 there is no practical advantage. The point
  is to see how an algorithm reshapes a measurement distribution. The real speedup is quadratic (O(√N) vs O(N)) and
  only matters at large N.
- The daily streak lives in `localStorage`: it is per browser, and clearing site data resets it.
- Not included yet: real IBM hardware runs (a noisy vs ideal comparison), more hand-made levels.
