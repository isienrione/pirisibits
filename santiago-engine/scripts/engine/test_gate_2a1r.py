#!/usr/bin/env python3
"""Gate 2A.1R python assertions."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    flags = (ROOT / "src/lib/city-graph/flags.ts").read_text()
    source = json.loads((ROOT / "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json").read_text())
    semantic = json.loads((ROOT / "src/data/santiago/santiago_semantic_calibration.v0.1.json").read_text())
    launch = json.loads(
        (ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json").read_text()
    )
    assert len(source["nodes"]) == 103
    assert semantic["recordCount"] == 103
    assert launch["recordCount"] == 30
    assert launch["demoNameMatches"] == 0
    assert launch["binarySyntheticReplaced"] == 30
    assert "EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY = true" in flags
    assert "EDITORIAL_CALIBRATION_CURATOR_APPROVED = false" in flags
    assert (ROOT / "docs/engine/gate-2a1-editorial-calibration.html").exists()
    assert (ROOT / "docs/engine/GATE_2A1R_SOURCE_RESTORATION_REPORT.md").exists()
    print("GATE_2A1R_PYTHON_TESTS=PASS")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print("GATE_2A1R_PYTHON_TESTS=FAIL", exc)
        raise SystemExit(1) from exc
