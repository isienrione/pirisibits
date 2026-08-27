#!/usr/bin/env python3
"""Gate 1B.4 — multimodal physical graph validators."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
PROVIDER = ROOT / "src/data/santiago/santiago_physical_edges.v0.1.json"
ADJ = ROOT / "src/data/santiago/santiago_pedestrian_adjacency.v0.1.json"
STATIONS = ROOT / "src/data/santiago/transit/santiago_metro_stations.v0.1.json"
LINES = ROOT / "src/data/santiago/transit/santiago_metro_lines.v0.1.json"
MULTI = ROOT / "src/data/santiago/santiago_multimodal_graph.v0.1.json"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def main() -> int:
    errors: list[str] = []
    for p in (ENGINE, PROVIDER, ADJ, STATIONS, LINES, MULTI, FLAGS):
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")
    if errors:
        print("GATE_1B4_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    provider = json.loads(PROVIDER.read_text(encoding="utf-8"))
    adj = json.loads(ADJ.read_text(encoding="utf-8"))
    stations = json.loads(STATIONS.read_text(encoding="utf-8"))
    lines = json.loads(LINES.read_text(encoding="utf-8"))
    multi = json.loads(MULTI.read_text(encoding="utf-8"))
    flags = FLAGS.read_text(encoding="utf-8")

    if engine.get("nodeCount") != 103 or len(engine.get("nodes") or []) != 103:
        fail(errors, "103-node inventory broken")
    if sum(1 for n in engine["nodes"] if n.get("launchCorpus")) != 30:
        fail(errors, "launch corpus size != 30")
    if sum(1 for n in engine["nodes"] if not n.get("launchCorpus")) != 73:
        fail(errors, "backlog size != 73")

    if provider.get("counts", {}).get("runtimeWalkEdges") != 598:
        fail(errors, "Gate 1B.3 provider runtime edges not preserved at 598")

    provider_ids = {e["edgeId"] for e in provider["edges"]}
    for e in adj["edges"]:
        if e["providerEdgeId"] not in provider_ids:
            fail(errors, f"sparse edge {e['edgeId']} missing Gate 1B.3 provider trace")
        if e.get("distanceM", 0) <= 0 or e.get("durationS", 0) <= 0:
            fail(errors, f"sparse edge {e['edgeId']} non-positive provider cost")

    if adj["sparseOperationalEdgeCount"] >= adj["denseProviderRuntimeEdgeCount"]:
        fail(errors, "sparsification did not reduce edge count")
    if adj["graphHealth"].get("connectedComponentCount") != 1:
        fail(errors, "sparse graph not singly connected")
    if adj["graphHealth"].get("isolatedNodes"):
        fail(errors, f"isolated eligible nodes: {adj['graphHealth']['isolatedNodes']}")
    if adj["graphHealth"].get("directedStronglyConnected") is False:
        fail(errors, "sparse graph not directed strongly connected among eligible nodes")

    station_ids = {s["stationId"] for s in stations["stations"]}
    for s in stations["stations"]:
        if s.get("provenance") != "openstreetmap":
            fail(errors, f"{s['stationId']}: missing OSM provenance")
        if s.get("lat") is None or s.get("lng") is None:
            fail(errors, f"{s['stationId']}: missing coordinates")
        if s.get("accessibility") != "UNKNOWN":
            fail(errors, f"{s['stationId']}: accessibility must be UNKNOWN without evidence")

    for line in lines["lines"]:
        for sid in line.get("stationOrder") or []:
            if sid not in station_ids:
                fail(errors, f"line {line['lineId']} references missing station {sid}")

    for e in multi.get("metroRideEdges") or []:
        if e["fromStationId"] not in station_ids or e["toStationId"] not in station_ids:
            fail(errors, f"ride edge dangling: {e['edgeId']}")
        if e.get("observedDurationSeconds") is not None:
            fail(errors, f"{e['edgeId']}: invented observed metro duration")
        if "enginePolicyHopCostSeconds" not in e:
            fail(errors, f"{e['edgeId']}: missing engine policy hop cost")

    for e in multi.get("metroTransferEdges") or []:
        if e["stationId"] not in station_ids:
            fail(errors, f"transfer dangling station {e['stationId']}")
        if e.get("observedDurationSeconds") is not None:
            fail(errors, f"{e['edgeId']}: invented observed transfer duration")

    for e in multi.get("poiMetroAccessEdges") or []:
        if e["stationId"] not in station_ids:
            fail(errors, f"access edge bad station {e['stationId']}")
        if e["stgoId"] not in set(provider["eligibleStgoIds"]):
            fail(errors, f"access edge for non-eligible {e['stgoId']}")
        if e.get("provider") != "mapbox":
            fail(errors, f"{e['edgeId']}: access must be mapbox-backed")

    for blocked in ("STGO_05", "STGO_23", "STGO_33"):
        if blocked in adj.get("eligibleStgoIds", []):
            fail(errors, f"{blocked} must remain non-eligible")
        if any(blocked in (e["fromPoiId"], e["toPoiId"]) for e in adj["edges"]):
            fail(errors, f"{blocked} present in sparse adjacency")
        if any(e.get("stgoId") == blocked for e in multi.get("poiMetroAccessEdges") or []):
            fail(errors, f"{blocked} has metro access edge")

    staging = multi.get("sanCristobalStaging") or {}
    if staging.get("routingEndpoint") != "funicular":
        fail(errors, "STGO_32 must route to funicular endpoint")

    if multi.get("thematicNarrativeUsed") is not False:
        fail(errors, "thematic/narrative must not be used")
    if multi.get("physicalRouteGenerationEnabled") is not False:
        fail(errors, "physical route generation must stay false")
    if "PHYSICAL_ROUTE_GENERATION_ENABLED = false" not in flags:
        fail(errors, "flags.ts PHYSICAL_ROUTE_GENERATION_ENABLED not false")

    for blob in (adj, stations, lines, multi, provider):
        s = json.dumps(blob)
        if "pk.ey" in s or "MAPBOX_ACCESS_TOKEN" in s:
            fail(errors, "secret material in artifacts")

    if errors:
        print("GATE_1B4_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("GATE_1B4_VALIDATOR=PASS")
    print("counts", json.dumps(multi.get("counts")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
