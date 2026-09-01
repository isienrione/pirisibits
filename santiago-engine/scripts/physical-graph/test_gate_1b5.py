#!/usr/bin/env python3
"""Gate 1B.5 Python assertions."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    engine = json.loads((ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json").read_text())
    provider = json.loads((ROOT / "src/data/santiago/santiago_physical_edges.v0.1.json").read_text())
    membership = json.loads((ROOT / "src/data/santiago/santiago_launch_runtime_membership.v0.1.json").read_text())
    adj = json.loads((ROOT / "src/data/santiago/santiago_pedestrian_adjacency.v0.2.json").read_text())
    multi = json.loads((ROOT / "src/data/santiago/santiago_multimodal_graph.v0.3.json").read_text())
    manifest = json.loads((ROOT / "src/data/santiago/santiago_physical_graph_manifest.v0.1.json").read_text())
    flags = (ROOT / "src/lib/city-graph/flags.ts").read_text()

    assert engine["nodeCount"] == 103
    assert engine["gate"] == "1B.2A"
    assert engine["physicalLayerGate"] == "1B.5"
    assert engine["physicalLayerV01Ready"] is True
    assert sum(1 for n in engine["nodes"] if n.get("launchCorpus")) == 30
    assert sum(1 for n in engine["nodes"] if not n.get("launchCorpus")) == 73
    assert provider["counts"]["runtimeWalkEdges"] == 598
    assert membership["runtimeReadyCount"] == 27
    assert membership["runtimeStagedCount"] == 1
    assert membership["runtimeExcludedCount"] == 2
    assert "STGO_05" in membership["runtimeReadyIds"]
    assert membership["runtimeStagedIds"] == ["STGO_32"]
    assert set(membership["runtimeExcludedIds"]) == {"STGO_23", "STGO_33"}
    assert adj["graphHealth"]["connectedComponentCount"] == 1
    assert adj["graphHealth"]["directedStronglyConnected"] is True
    assert not adj["graphHealth"]["isolatedNodes"]
    assert "STGO_05" in adj["eligibleStgoIds"]
    assert multi["physicalLayerV01Ready"] is True
    assert multi["physicalRouteGenerationEnabled"] is False
    assert multi["thematicNarrativeUsed"] is False
    assert multi["canonicalTransitSource"] == "dtpm_gtfs"
    assert multi["counts"]["l7RuntimePresent"] is False
    assert any(e.get("stgoId") == "STGO_05" for e in multi["poiMetroAccessEdges"])
    assert not any(e.get("stgoId") == "STGO_23" for e in multi["poiMetroAccessEdges"])
    assert manifest["featureFlags"]["PHYSICAL_LAYER_V0_1_READY"] is True
    assert manifest["featureFlags"]["PHYSICAL_ROUTE_GENERATION_ENABLED"] is False
    assert "PHYSICAL_ROUTE_GENERATION_ENABLED = false" in flags
    assert "PHYSICAL_LAYER_V0_1_READY = true" in flags
    assert "pk.ey" not in json.dumps(multi)
    assert "pk.ey" not in json.dumps(adj)

    n05 = next(n for n in engine["nodes"] if n["stgoId"] == "STGO_05")
    assert n05["runtimePhysicalEndpoint"]["pointId"] == "terraza_neptuno"
    assert n05["launchRuntimeDisposition"] == "RUNTIME_READY"

    print("GATE_1B5_PYTHON_TESTS=PASS")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print("GATE_1B5_PYTHON_TESTS=FAIL", exc)
        raise SystemExit(1) from exc
