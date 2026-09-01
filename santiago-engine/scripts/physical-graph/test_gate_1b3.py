#!/usr/bin/env python3
"""Gate 1B.3 Python assertions."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
EDGES = ROOT / "src/data/santiago/santiago_physical_edges.v0.1.json"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"


def main() -> int:
    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    data = json.loads(EDGES.read_text(encoding="utf-8"))
    node_ids = {n["stgoId"] for n in engine["nodes"]}
    eligible = set(data["eligibleStgoIds"])

    assert data["schemaVersion"] == "santiago-physical-edges.v0.1"
    assert data["gate"] == "1B.3"
    assert data["physicalRouteGenerationEnabled"] is False
    assert data["referenceMatrixStatus"] == "REFERENCE_MATRIX_NOT_PRESENT"
    assert len(data["eligibleStgoIds"]) >= 27
    assert "STGO_05" not in eligible
    assert "STGO_23" not in eligible
    assert "STGO_33" not in eligible

    runtime = [e for e in data["edges"] if e["runtimeEligible"]]
    assert len(runtime) > 0
    assert data["counts"]["runtimeWalkEdges"] == len(runtime)

    for e in data["edges"]:
        assert e["fromPoiId"] in node_ids
        assert e["toPoiId"] in node_ids
        assert e["edgeId"]
        if e["runtimeEligible"]:
            assert e["fromPoiId"] in eligible
            assert e["toPoiId"] in eligible
            assert e["distanceM"] > 0
            assert e["durationS"] > 0
            assert e["physicalClassification"] in {"GREEN", "YELLOW"}

    assert "PHYSICAL_ROUTE_GENERATION_ENABLED = false" in FLAGS.read_text(encoding="utf-8")
    blob = json.dumps(data)
    assert "pk.ey" not in blob
    assert "MAPBOX_ACCESS_TOKEN" not in blob

    print("GATE_1B3_PYTHON_TESTS=PASS")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print("GATE_1B3_PYTHON_TESTS=FAIL", exc)
        raise SystemExit(1) from exc
