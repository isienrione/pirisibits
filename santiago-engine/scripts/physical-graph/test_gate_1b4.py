#!/usr/bin/env python3
"""Gate 1B.4 Python assertions."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    engine = json.loads((ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json").read_text())
    provider = json.loads((ROOT / "src/data/santiago/santiago_physical_edges.v0.1.json").read_text())
    adj = json.loads((ROOT / "src/data/santiago/santiago_pedestrian_adjacency.v0.1.json").read_text())
    stations = json.loads((ROOT / "src/data/santiago/transit/santiago_metro_stations.v0.1.json").read_text())
    lines = json.loads((ROOT / "src/data/santiago/transit/santiago_metro_lines.v0.1.json").read_text())
    multi = json.loads((ROOT / "src/data/santiago/santiago_multimodal_graph.v0.1.json").read_text())
    flags = (ROOT / "src/lib/city-graph/flags.ts").read_text()

    assert engine["nodeCount"] == 103
    assert provider["counts"]["runtimeWalkEdges"] == 598
    assert adj["sparseOperationalEdgeCount"] < 598
    assert adj["graphHealth"]["connectedComponentCount"] == 1
    assert adj["graphHealth"]["isolatedNodes"] == []
    assert stations["stationCount"] > 50
    assert lines["lineCount"] >= 7
    assert multi["thematicNarrativeUsed"] is False
    assert multi["physicalRouteGenerationEnabled"] is False
    assert multi["sanCristobalStaging"]["routingEndpoint"] == "funicular"
    for blocked in ("STGO_05", "STGO_23", "STGO_33"):
        assert blocked not in adj["eligibleStgoIds"]
    for e in multi["metroRideEdges"]:
        assert e["observedDurationSeconds"] is None
    for e in multi["metroTransferEdges"]:
        assert e["observedDurationSeconds"] is None
    assert "PHYSICAL_ROUTE_GENERATION_ENABLED = false" in flags
    assert "pk.ey" not in json.dumps(multi)

    print("GATE_1B4_PYTHON_TESTS=PASS")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print("GATE_1B4_PYTHON_TESTS=FAIL", exc)
        raise SystemExit(1) from exc
