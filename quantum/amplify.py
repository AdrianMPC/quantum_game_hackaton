# /// script
# requires-python = ">=3.10,<3.14"
# dependencies = ["qiskit==2.6.1"]
# ///
"""Amplitude amplification over the gates of a level, simulated with Qiskit.

A level with N gates uses n = ceil(log2 N) qubits. State preparation A builds the
uniform superposition over exactly the N gates (|0>..|N-1>), so no measurement can
land on a non-existent gate. One iteration = oracle (phase -1 on the marked gate)
followed by the diffuser A (2|0><0| - I) A^dagger.

Writes quantum/amplify.json: for N in {2, 3, 4, 6} and every marked gate, exact
measurement probabilities after 0, 1 and 2 iterations, seeded sampled counts, and
the circuit drawing for one iteration.

Run: uv run quantum/amplify.py
"""

import json
import math
from pathlib import Path

import qiskit
from qiskit import QuantumCircuit
from qiskit.circuit.library import StatePreparation
from qiskit.primitives import StatevectorSampler
from qiskit.quantum_info import Statevector

SEED = 42
SHOTS = 1024
SIZES = [2, 3, 4, 6]  # gate counts used by the levels


def phase_flip(qc: QuantumCircuit, index: int, n: int) -> None:
    """Multiply the amplitude of basis state |index> by -1."""
    zeros = [q for q in range(n) if not (index >> q) & 1]  # qubit q holds bit q (little-endian)
    if zeros:
        qc.x(zeros)
    if n == 1:
        qc.z(0)
    else:
        qc.mcp(math.pi, list(range(n - 1)), n - 1)
    if zeros:
        qc.x(zeros)


def amplify(N: int, marked: int, iterations: int) -> QuantumCircuit:
    n = max(1, math.ceil(math.log2(N)))
    amps = [1 / math.sqrt(N) if i < N else 0 for i in range(2**n)]
    prep = StatePreparation(amps, label="A")
    qc = QuantumCircuit(n)
    qc.append(prep, range(n))  # uniform over the N gates
    for _ in range(iterations):
        qc.barrier()
        phase_flip(qc, marked, n)  # oracle
        qc.barrier()
        qc.append(prep.inverse(), range(n))  # diffuser: A (2|0><0| - I) A†
        phase_flip(qc, 0, n)
        qc.append(prep, range(n))
    return qc


def main() -> None:
    sampler = StatevectorSampler(seed=SEED)
    sizes = {}
    for N in SIZES:
        n = max(1, math.ceil(math.log2(N)))
        marked = {}
        for m in range(N):
            iters = []
            for k in range(3):
                qc = amplify(N, m, k)
                probs = Statevector.from_instruction(qc).probabilities()
                counts = sampler.run([qc.measure_all(inplace=False)], shots=SHOTS).result()[0].data.meas.get_counts()
                iters.append({
                    "probabilities": [round(float(probs[i]), 6) for i in range(N)],
                    "counts": [counts.get(format(i, f"0{n}b"), 0) for i in range(N)],
                })
            marked[str(m)] = {
                "bits": format(m, f"0{n}b"),
                "circuit": str(amplify(N, m, 1).draw(output="text", fold=-1)),
                "iterations": iters,
            }
        sizes[str(N)] = {"qubits": n, "marked": marked}

    out = {
        "qiskit": qiskit.__version__,
        "seed": SEED,
        "shots": SHOTS,
        "note": "Ideal (noiseless) simulation: Statevector for exact probabilities, StatevectorSampler for counts.",
        "sizes": sizes,
    }
    path = Path(__file__).with_name("amplify.json")
    path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {path} (qiskit {qiskit.__version__})")


if __name__ == "__main__":
    main()
