# /// script
# requires-python = ">=3.10,<3.14"
# dependencies = ["qiskit==2.6.1"]
# ///
"""Amplitude amplification over the 4 maze starts (2 qubits), simulated with Qiskit.

Each start is a basis state; the level's correct start is the marked state.
Writes quantum/amplify.json with exact measurement probabilities after 0, 1 and 2
amplification iterations, seeded sampled counts, and the circuit drawing.

Run: uv run quantum/amplify.py
"""

import json
from pathlib import Path

import qiskit
from qiskit import QuantumCircuit
from qiskit.primitives import StatevectorSampler
from qiskit.quantum_info import Statevector

SEED = 42
SHOTS = 1024
# Bitstrings in Qiskit print order (qubit 1, qubit 0).
STARTS = {"NORTH": "00", "EAST": "01", "SOUTH": "10", "WEST": "11"}
BY_BITS = {b: s for s, b in STARTS.items()}


def flip_zeros(qc: QuantumCircuit, bits: str) -> None:
    # bits[-1] is qubit 0 (Qiskit little-endian).
    for q, b in enumerate(reversed(bits)):
        if b == "0":
            qc.x(q)


def amplify(bits: str, iterations: int) -> QuantumCircuit:
    qc = QuantumCircuit(2)
    qc.h([0, 1])  # uniform superposition: 25% each start
    for _ in range(iterations):
        qc.barrier()
        flip_zeros(qc, bits)  # oracle: phase -1 on the marked start
        qc.cz(0, 1)
        flip_zeros(qc, bits)
        qc.barrier()
        qc.h([0, 1])  # diffuser: reflection about the mean amplitude
        qc.x([0, 1])
        qc.cz(0, 1)
        qc.x([0, 1])
        qc.h([0, 1])
    return qc


def by_start(d: dict) -> dict:
    return {BY_BITS[b]: d.get(b, 0) for b in sorted(BY_BITS)}


def main() -> None:
    sampler = StatevectorSampler(seed=SEED)
    marked = {}
    for start, bits in STARTS.items():
        iters = []
        for k in range(3):
            qc = amplify(bits, k)
            probs = Statevector.from_instruction(qc).probabilities_dict()
            measured = qc.measure_all(inplace=False)
            counts = sampler.run([measured], shots=SHOTS).result()[0].data.meas.get_counts()
            iters.append({
                "probabilities": {s: round(p, 6) for s, p in by_start(probs).items()},
                "counts": by_start(counts),
            })
        marked[start] = {"bits": bits, "circuit": str(amplify(bits, 1).draw(output="text")), "iterations": iters}

    out = {
        "qiskit": qiskit.__version__,
        "seed": SEED,
        "shots": SHOTS,
        "note": "Ideal (noiseless) simulation: Statevector for exact probabilities, StatevectorSampler for counts.",
        "marked": marked,
    }
    path = Path(__file__).with_name("amplify.json")
    path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {path} (qiskit {qiskit.__version__})")


if __name__ == "__main__":
    main()
