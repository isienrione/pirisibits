#!/usr/bin/env python3
"""Gate 1B.2A Python tests."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
RAW = ROOT / "src/data/santiago/curation/launch30_physical_review.raw.v0.1.json"
EXPECTED = [
    "STGO_01", "STGO_02", "STGO_03", "STGO_04", "STGO_05", "STGO_06", "STGO_07",
    "STGO_10", "STGO_11", "STGO_16", "STGO_18", "STGO_19", "STGO_20", "STGO_21",
    "STGO_22", "STGO_23", "STGO_24", "STGO_25", "STGO_26", "STGO_27", "STGO_28",
    "STGO_29", "STGO_32", "STGO_33", "STGO_34", "STGO_35", "STGO_48", "STGO_91",
    "STGO_92", "STGO_30",
]


def main() -> int:
    raw = json.loads(RAW.read_text(encoding="utf-8"))
    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    assert raw["recordCount"] == 30
    assert sorted(r["stgoId"] for r in raw["records"]) == sorted(EXPECTED)
    assert engine["nodeCount"] == 103
    assert len(engine["nodes"]) == 103
    assert engine["gate"] == "1B.2A"
    assert engine["physicalRouteGenerationEnabled"] is False
    launch = [n for n in engine["nodes"] if n["launchCorpus"]]
    assert len(launch) == 30
    assert sorted(n["stgoId"] for n in launch) == sorted(EXPECTED)
    assert all(n.get("curatorCuration") for n in launch)
    assert next(n for n in engine["nodes"] if n["stgoId"] == "STGO_23")["launchPhysicalReadiness"] == "UNRESOLVED_RESEARCH_REQUIRED"
    assert next(n for n in engine["nodes"] if n["stgoId"] == "STGO_33")["launchPhysicalReadiness"] == "NEEDS_SEMANTIC_REVIEW"
    assert len(next(n for n in engine["nodes"] if n["stgoId"] == "STGO_32")["accessPoints"]) >= 3
    assert all(n.get("curatorApproval") != "CURATOR_APPROVED" for n in engine["nodes"] if not n["launchCorpus"])
    assert "pk.ey" not in json.dumps(engine)
    print("GATE_1B2A_PYTHON_TESTS=PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
