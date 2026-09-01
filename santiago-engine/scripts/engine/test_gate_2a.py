#!/usr/bin/env python3
"""Gate 2A python assertions."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    flags = (ROOT / "src/lib/city-graph/flags.ts").read_text()
    engine = json.loads((ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json").read_text())
    membership = json.loads((ROOT / "src/data/santiago/santiago_launch_runtime_membership.v0.1.json").read_text())
    contract = (ROOT / "docs/engine/ENGINE_V0_1_IMPLEMENTATION_CONTRACT.md").read_text()

    assert "PHYSICAL_ROUTE_GENERATION_ENABLED = false" in flags
    assert "PHYSICAL_LAYER_V0_1_READY = true" in flags
    assert "NODE_UTILITY_V0_1_READY = true" in flags
    assert "ROUTE_COMPOSER_READY = true" not in flags
    assert engine["nodeCount"] == 103
    assert membership["runtimeExcludedIds"] == ["STGO_23", "STGO_33"]
    assert "NODE VALUE" in contract
    assert "PAIR / EDGE VALUE" in contract or "PAIR / EDGE" in contract
    assert "Gate 2B" in contract
    assert (ROOT / "src/engine/scoring/constants.ts").exists()
    assert (ROOT / "src/engine/eligibility/evaluateNodeEligibility.ts").exists()
    assert (ROOT / "src/engine/candidates/buildCandidatePool.ts").exists()

    print("GATE_2A_PYTHON_TESTS=PASS")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print("GATE_2A_PYTHON_TESTS=FAIL", exc)
        raise SystemExit(1) from exc
