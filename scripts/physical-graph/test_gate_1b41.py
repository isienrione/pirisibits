#!/usr/bin/env python3
"""Gate 1B.4.1 Python assertions."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    stations = json.loads((ROOT / "src/data/santiago/transit/santiago_metro_stations.v0.2.json").read_text())
    lines = json.loads((ROOT / "src/data/santiago/transit/santiago_metro_lines.v0.2.json").read_text())
    times = json.loads((ROOT / "src/data/santiago/transit/santiago_metro_scheduled_times.v0.1.json").read_text())
    multi = json.loads((ROOT / "src/data/santiago/santiago_multimodal_graph.v0.2.json").read_text())
    engine = json.loads((ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json").read_text())
    flags = (ROOT / "src/lib/city-graph/flags.ts").read_text()

    assert engine["nodeCount"] == 103
    assert {l["lineId"] for l in lines["lines"]} == {"L1", "L2", "L3", "L4", "L4A", "L5", "L6"}
    assert "L7" not in {l["lineId"] for l in lines["lines"]}
    assert multi["counts"]["l7RuntimePresent"] is False
    assert multi["canonicalTransitSource"] == "dtpm_gtfs"
    assert times["durationLabel"] == "SCHEDULED_GTFS_DURATION"
    assert times["segmentCount"] > 100
    assert all(s["sampleCount"] >= 1 for s in times["segments"])
    assert all(e["scheduledDurationSeconds"] is not None for e in multi["metroRideEdges"])
    assert all(e["observedDurationSeconds"] is None for e in multi["metroRideEdges"])
    assert stations["stationCount"] == 126
    assert multi["physicalRouteGenerationEnabled"] is False
    assert "PHYSICAL_ROUTE_GENERATION_ENABLED = false" in flags
    assert "pk.ey" not in json.dumps(multi)

    print("GATE_1B41_PYTHON_TESTS=PASS")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print("GATE_1B41_PYTHON_TESTS=FAIL", exc)
        raise SystemExit(1) from exc
