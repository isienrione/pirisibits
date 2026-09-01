#!/usr/bin/env python3
"""Gate 2A.1 python assertions."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    flags = (ROOT / "src/lib/city-graph/flags.ts").read_text()
    cal = json.loads(
        (ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json").read_text()
    )
    assert "EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY = true" in flags
    assert "EDITORIAL_CALIBRATION_CURATOR_APPROVED = false" in flags
    assert "PHYSICAL_ROUTE_GENERATION_ENABLED = false" in flags
    assert cal["curatorApproved"] is False
    assert cal["recordCount"] == 30
    assert "T2" in cal["canonicalTaxonomy"]
    assert all(r["chronoWorth"]["approved"] is None for r in cal["records"])
    assert all(r["visitTime"]["includesTravelTime"] is False for r in cal["records"])
    assert (ROOT / "docs/engine/gate-2a1-editorial-calibration.html").exists()
    assert (ROOT / "docs/engine/GATE_2A1_EDITORIAL_CALIBRATION_REPORT.md").exists()
    assert (ROOT / "src/engine/semanticTypes.ts").exists()
    assert (ROOT / "src/engine/loadCalibration.ts").exists()
    print("GATE_2A1_PYTHON_TESTS=PASS")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print("GATE_2A1_PYTHON_TESTS=FAIL", exc)
        raise SystemExit(1) from exc
