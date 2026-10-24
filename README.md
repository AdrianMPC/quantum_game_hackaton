# Quantum Maze

EdTech prototype for the Qiskit Fall Fest 2026 hackathon (IEEE CS PUCP challenge).

A deduction puzzle on a circular board with a hidden maze. Players work out which of four starts, combined with a short
sequence of moves, reaches the goal. After each level, a separate panel compares **classical random sampling**
(statistics/Monte Carlo) with **amplitude amplification** over the same four candidates, simulated with Qiskit.

Concept mapping: a probability distribution over candidates. Blind classical search over N gates samples uniformly,
so the number of tries is uniform on 1–N with mean (N+1)/2. In the quantum version the N gates are basis states of
ceil(log2 N) qubits, prepared in a uniform superposition over exactly those N states. The measurement distribution
follows the Born rule, and each amplification iteration (oracle + diffuser) rotates it: P(k) = sin²((2k+1)·asin(1/√N)).
With 4 gates one iteration gives 100%; with 3 gates 92.6%; with 6 gates 90.7% (and 74.3% after overshooting to 2);
with 2 gates it stays at 50%, so amplification does not help there. The tests check the Qiskit output against this formula.

## Run

Static site with no build step and no runtime dependencies.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
npm test                      # node --test (Node 22+)
uv run quantum/amplify.py     # regenerate quantum/amplify.json with Qiskit
```

## Structure

| Path | Role |
| --- | --- |
| `levels.json` | Level data (grid size, walls, goal, correct start, target sequence) and scoring parameters |
| `src/engine.js` | Pure logic: moves, path tracing, level validation (including solution uniqueness), match %, score |
| `src/game.js` | Level state machine (READY / PLAYING / SCANNING / LEVEL_COMPLETED), no DOM |
| `src/render.js` | SVG board, rays, scanner sweep; draws state, holds no rules |
| `src/daily.js` | Daily puzzle generated from the date (same for everyone, validated by the engine) and the local streak |
| `src/quantum.js` | "¿Y si fuera cuántico?" panel: classical sampler + amplification distributions |
| `src/main.js` | Loads data, validates levels, wires events |
| `quantum/amplify.py` | Qiskit script that produces `quantum/amplify.json` |
| `test/engine.test.js` | Validates every level, scoring, game rules, quantum output |

Adding a level means adding an object to `levels.json`. `validateLevel` rejects levels where another start or
sequence also reaches the goal, or where a wrong start never hits a wall. Invalid levels are reported in the UI and skipped.

## Reproducibility

- Qiskit 2.6.1 (pinned in the script header), Python 3.13 via `uv`, seed 42, 1024 shots.
- Exact probabilities come from `Statevector`; sampled counts come from `StatevectorSampler(seed=42)`.
- Re-running the script gives a byte-identical `amplify.json`.

## Honest limitations

- The maze puzzle is classical. The four rays are a visual analogy, computed one by one; they are not superposition
  and show no quantum advantage.
- The % next to the moves is a sequence match (position-by-position comparison with the solution), not a probability. Its tooltip says so.
- The quantum panel is an ideal, noiseless simulation of 4 candidates. At N = 4 there is no practical advantage. The point
  is to see how an algorithm reshapes a measurement distribution. The real speedup is quadratic (O(√N) vs O(N)) and
  only matters at large N.
- The daily streak lives in `localStorage`: it is per browser, and clearing site data resets it.
- Not included yet: real IBM hardware runs (a noisy vs ideal comparison), more hand-made levels.
