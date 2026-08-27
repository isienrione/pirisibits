#!/usr/bin/env python3
"""Gate 1B.5 — Santiago physical graph V0.1 freeze validator."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
PROVIDER = ROOT / "src/data/santiago/santiago_physical_edges.v0.1.json"
EXT = ROOT / "src/data/santiago/santiago_physical_edges_stgo05_extension.v0.1.json"
ADJ_V01 = ROOT / "src/data/santiago/santiago_pedestrian_adjacency.v0.1.json"
ADJ_V02 = ROOT / "src/data/santiago/santiago_pedestrian_adjacency.v0.2.json"
MULTI_V02 = ROOT / "src/data/santiago/santiago_multimodal_graph.v0.2.json"
MULTI_V03 = ROOT / "src/data/santiago/santiago_multimodal_graph.v0.3.json"
MEMBERSHIP = ROOT / "src/data/santiago/santiago_launch_runtime_membership.v0.1.json"
FRICTION = ROOT / "src/data/santiago/qa/santiago_physical_friction_audit.v0.1.json"
QA = ROOT / "src/data/santiago/qa/santiago_physical_layer_e2e_qa.v0.1.json"
MANIFEST = ROOT / "src/data/santiago/santiago_physical_graph_manifest.v0.1.json"
STATIONS = ROOT / "src/data/santiago/transit/santiago_metro_stations.v0.2.json"
LINES = ROOT / "src/data/santiago/transit/santiago_metro_lines.v0.2.json"
TIMES = ROOT / "src/data/santiago/transit/santiago_metro_scheduled_times.v0.1.json"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"

OPERATIONAL = {"L1", "L2", "L3", "L4", "L4A", "L5", "L6"}


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def secret_leak(obj) -> bool:
    s = json.dumps(obj)
    return "pk.ey" in s or "MAPBOX_ACCESS_TOKEN" in s


def main() -> int:
    errors: list[str] = []
    required = [
        ENGINE,
        PROVIDER,
        EXT,
        ADJ_V01,
        ADJ_V02,
        MULTI_V02,
        MULTI_V03,
        MEMBERSHIP,
        FRICTION,
        QA,
        MANIFEST,
        STATIONS,
        LINES,
        TIMES,
        FLAGS,
    ]
    for p in required:
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")
    if errors:
        print("GATE_1B5_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    provider = json.loads(PROVIDER.read_text(encoding="utf-8"))
    ext = json.loads(EXT.read_text(encoding="utf-8"))
    adj_v01 = json.loads(ADJ_V01.read_text(encoding="utf-8"))
    adj = json.loads(ADJ_V02.read_text(encoding="utf-8"))
    multi_v02 = json.loads(MULTI_V02.read_text(encoding="utf-8"))
    multi = json.loads(MULTI_V03.read_text(encoding="utf-8"))
    membership = json.loads(MEMBERSHIP.read_text(encoding="utf-8"))
    friction = json.loads(FRICTION.read_text(encoding="utf-8"))
    qa = json.loads(QA.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    stations = json.loads(STATIONS.read_text(encoding="utf-8"))
    lines = json.loads(LINES.read_text(encoding="utf-8"))
    times = json.loads(TIMES.read_text(encoding="utf-8"))
    flags = FLAGS.read_text(encoding="utf-8")

    if engine.get("physicalLayerGate") != "1B.5":
        fail(errors, "engine physicalLayerGate must be 1B.5")
    if engine.get("physicalLayerV01Ready") is not True:
        fail(errors, "engine physicalLayerV01Ready must be true")
    if engine.get("gate") != "1B.2A":
        fail(errors, "engine curation gate marker must remain 1B.2A")
    launch = [n for n in engine["nodes"] if n.get("launchCorpus")]
    backlog = [n for n in engine["nodes"] if not n.get("launchCorpus")]
    if len(launch) != 30:
        fail(errors, "launch corpus size != 30")
    if len(backlog) != 73:
        fail(errors, "backlog size != 73")

    if provider.get("counts", {}).get("runtimeWalkEdges") != 598:
        fail(errors, "Gate 1B.3 provider runtime edges not preserved at 598")
    if provider.get("gate") != "1B.3":
        fail(errors, "provider edge gate must remain 1B.3")
    if "STGO_05" in (provider.get("eligibleStgoIds") or []):
        fail(errors, "Gate 1B.3 provider eligible set must not silently absorb STGO_05")

    # Membership dispositions
    if membership.get("runtimeReadyCount") != 27:
        fail(errors, f"runtimeReadyCount expected 27 got {membership.get('runtimeReadyCount')}")
    if membership.get("runtimeStagedCount") != 1:
        fail(errors, "runtimeStagedCount expected 1 (STGO_32)")
    if membership.get("runtimeExcludedCount") != 2:
        fail(errors, "runtimeExcludedCount expected 2")
    if membership.get("runtimeStagedIds") != ["STGO_32"]:
        fail(errors, "STGO_32 must be sole RUNTIME_STAGED")
    if set(membership.get("runtimeExcludedIds") or []) != {"STGO_23", "STGO_33"}:
        fail(errors, "excluded must be exactly STGO_23 and STGO_33")
    if "STGO_05" not in (membership.get("runtimeReadyIds") or []):
        fail(errors, "STGO_05 must be RUNTIME_READY")
    if len(membership.get("runtimeRoutingIds") or []) != 28:
        fail(errors, "runtime routing set must be 28 (27 ready + 1 staged)")

    by = {n["stgoId"]: n for n in engine["nodes"]}
    n05 = by["STGO_05"]
    if n05.get("launchRuntimeDisposition") != "RUNTIME_READY":
        fail(errors, "STGO_05 disposition must be RUNTIME_READY")
    if n05.get("launchPhysicalReadiness") != "READY_FOR_EDGE_GENERATION":
        fail(errors, "STGO_05 must be READY_FOR_EDGE_GENERATION")
    if n05.get("physicalRouteGenerationEligible") is not True:
        fail(errors, "STGO_05 must be edge-eligible")
    ep = n05.get("runtimePhysicalEndpoint") or {}
    if ep.get("pointId") != "terraza_neptuno":
        fail(errors, "STGO_05 runtime endpoint must be terraza_neptuno")
    roles = {p.get("id") for p in (n05.get("physicalPoints") or [])}
    if not {"cerro_poi", "terraza_neptuno", "castillo_hidalgo"}.issubset(roles):
        fail(errors, "STGO_05 must preserve complex POI points")
    if not (n05.get("curatorCuration") or {}).get("coordinateConflict"):
        fail(errors, "STGO_05 must retain hill @ conflict evidence")

    n23 = by["STGO_23"]
    if n23.get("launchRuntimeDisposition") != "RUNTIME_EXCLUDED_RESEARCH":
        fail(errors, "STGO_23 must be RUNTIME_EXCLUDED_RESEARCH")
    if n23.get("physicalRouteGenerationEligible") is not False:
        fail(errors, "STGO_23 must remain ineligible")

    n33 = by["STGO_33"]
    if n33.get("launchRuntimeDisposition") != "RUNTIME_EXCLUDED_SEMANTIC":
        fail(errors, "STGO_33 must be RUNTIME_EXCLUDED_SEMANTIC")
    if n33.get("physicalRouteGenerationEligible") is not False:
        fail(errors, "STGO_33 must remain ineligible")

    n32 = by["STGO_32"]
    if n32.get("launchRuntimeDisposition") != "RUNTIME_STAGED":
        fail(errors, "STGO_32 must be RUNTIME_STAGED")
    staging = n32.get("sanCristobalStaging") or {}
    if staging.get("routingEndpoint") != "funicular":
        fail(errors, "STGO_32 routing endpoint must be funicular")
    if staging.get("summitImplied") is True:
        fail(errors, "STGO_32 must not imply summit")

    # Extension edges
    if ext.get("gate") != "1B.5":
        fail(errors, "STGO_05 extension gate must be 1B.5")
    if not ext.get("runtimeEligibleCount"):
        fail(errors, "STGO_05 extension must produce runtime edges")
    for e in ext.get("edges") or []:
        if "STGO_05" not in (e.get("fromPoiId"), e.get("toPoiId")):
            fail(errors, f"{e.get('edgeId')}: extension edge without STGO_05")
        if e.get("provider") != "mapbox":
            fail(errors, f"{e.get('edgeId')}: extension must be mapbox")
        if e.get("runtimeEligible") and (e.get("distanceM", 0) <= 0 or e.get("durationS", 0) <= 0):
            fail(errors, f"{e.get('edgeId')}: non-positive provider cost")
        for forbidden in ("narrativeEdgeScore", "chronoWorth", "themes", "matchScore", "ArcState"):
            if forbidden in e:
                fail(errors, f"{e.get('edgeId')}: thematic field {forbidden}")

    # Sparse v0.2
    if adj.get("gate") != "1B.5":
        fail(errors, "adjacency v0.2 gate must be 1B.5")
    if adj.get("physicalRouteGenerationEnabled") is not False:
        fail(errors, "adjacency must keep route generation disabled")
    if set(adj.get("eligibleStgoIds") or []) != set(membership["runtimeRoutingIds"]):
        fail(errors, "adjacency eligible set must equal runtime routing membership")
    if adj["graphHealth"].get("connectedComponentCount") != 1:
        fail(errors, "sparse v0.2 not singly connected")
    if adj["graphHealth"].get("isolatedNodes"):
        fail(errors, f"isolated nodes: {adj['graphHealth']['isolatedNodes']}")
    if adj["graphHealth"].get("directedStronglyConnected") is not True:
        fail(errors, "sparse v0.2 not directed strongly connected")
    if adj["sparseOperationalEdgeCount"] >= adj["denseProviderRuntimeEdgeCount"]:
        fail(errors, "sparsification did not reduce vs dense combined runtime")
    if "STGO_05" not in adj.get("eligibleStgoIds", []):
        fail(errors, "STGO_05 missing from sparse eligible")
    for blocked in ("STGO_23", "STGO_33"):
        if blocked in adj.get("eligibleStgoIds", []):
            fail(errors, f"{blocked} must not be sparse-eligible")
        if any(blocked in (e["fromPoiId"], e["toPoiId"]) for e in adj["edges"]):
            fail(errors, f"{blocked} present in sparse adjacency")

    provider_ids = {e["edgeId"] for e in provider["edges"]}
    ext_ids = {e["edgeId"] for e in ext["edges"]}
    for e in adj["edges"]:
        pid = e.get("providerEdgeId")
        if pid not in provider_ids and pid not in ext_ids:
            fail(errors, f"sparse edge {e['edgeId']} missing provider/extension trace")
        if e.get("distanceM", 0) <= 0 or e.get("durationS", 0) <= 0:
            fail(errors, f"sparse edge {e['edgeId']} non-positive cost")

    # Preserve Gate 1B.4.1 transit
    line_ids = {l["lineId"] for l in lines["lines"]}
    if line_ids != OPERATIONAL:
        fail(errors, f"operational lines mismatch: {sorted(line_ids)}")
    if "L7" in line_ids:
        fail(errors, "runtime Metro contains L7")
    if multi.get("counts", {}).get("l7RuntimePresent") is not False:
        fail(errors, "l7RuntimePresent must be false")
    if multi.get("canonicalTransitSource") != "dtpm_gtfs":
        fail(errors, "canonical transit source must be dtpm_gtfs")
    if times.get("durationLabel") != "SCHEDULED_GTFS_DURATION":
        fail(errors, "scheduled times label broken")

    station_ids = {s["stationId"] for s in stations["stations"]}
    access = multi.get("poiMetroAccessEdges") or []
    if not any(e.get("stgoId") == "STGO_05" for e in access):
        fail(errors, "STGO_05 must have Metro access in multimodal v0.3")
    for blocked in ("STGO_23", "STGO_33"):
        if any(e.get("stgoId") == blocked for e in access):
            fail(errors, f"{blocked} must not have Metro access")
    for e in access:
        if e["stationId"] not in station_ids:
            fail(errors, f"access edge unreconciled station {e['stationId']}")
        if e.get("provider") != "mapbox":
            fail(errors, f"{e.get('edgeId')}: access must be mapbox")

    for e in multi.get("metroRideEdges") or []:
        if e.get("lineId") == "L7":
            fail(errors, "L7 ride edge in runtime graph")
        if e.get("scheduledDurationSeconds") is None:
            fail(errors, f"{e['edgeId']}: missing scheduled duration")
        if e.get("observedDurationSeconds") is not None:
            fail(errors, f"{e['edgeId']}: invented observed duration")

    for e in multi.get("metroTransferEdges") or []:
        if e.get("physicalTransferDurationSeconds") is not None:
            fail(errors, f"{e['edgeId']}: fabricated physical transfer duration")
        if e.get("enginePolicyTransferPenaltySeconds") is None:
            fail(errors, f"{e['edgeId']}: missing engine policy transfer penalty")

    # Multimodal v0.2 must remain the Gate 1B.4.1 artifact (no STGO_05 access)
    if any(e.get("stgoId") == "STGO_05" for e in multi_v02.get("poiMetroAccessEdges") or []):
        fail(errors, "multimodal v0.2 must not be mutated with STGO_05 access")
    if adj_v01.get("gate") != "1B.4" or adj_v01.get("schemaVersion") != "santiago-pedestrian-adjacency.v0.1":
        fail(errors, "adjacency v0.1 unexpectedly altered")

    if multi.get("thematicNarrativeUsed") is not False:
        fail(errors, "thematic/narrative used")
    if multi.get("physicalRouteGenerationEnabled") is not False:
        fail(errors, "multimodal enables route generation")
    if multi.get("physicalLayerV01Ready") is not True:
        fail(errors, "multimodal physicalLayerV01Ready must be true")

    # Friction audit honesty
    if friction.get("softFrictionUnknownCount", 0) <= 0:
        fail(errors, "soft friction UNKNOWN counts must remain explicit")
    if friction.get("hardAccessibilityUnknownCount", 0) <= 0:
        fail(errors, "hard accessibility UNKNOWN counts must remain explicit")

    # E2E QA
    routes = qa.get("routes") or multi.get("qaRoutes") or []
    if len(routes) < 8:
        fail(errors, "insufficient E2E QA routes")
    if any(not r.get("connected") for r in routes if r.get("origin") in membership["runtimeRoutingIds"]):
        fail(errors, "runtime QA route not connected")
    for r in routes:
        blob = json.dumps(r)
        for forbidden in ("narrativeScore", "chronoWorth", "themeScore", "ArcState"):
            if forbidden in blob:
                fail(errors, f"QA route introduces thematic field {forbidden}")

    # Manifest + flags
    if manifest.get("physicalLayerV01Ready") is not True:
        fail(errors, "manifest PHYSICAL_LAYER_V0_1_READY equivalent false")
    if manifest.get("featureFlags", {}).get("PHYSICAL_ROUTE_GENERATION_ENABLED") is not False:
        fail(errors, "manifest enables route generation")
    if manifest.get("featureFlags", {}).get("PHYSICAL_LAYER_V0_1_READY") is not True:
        fail(errors, "manifest PHYSICAL_LAYER_V0_1_READY must be true")
    if "PHYSICAL_ROUTE_GENERATION_ENABLED = false" not in flags:
        fail(errors, "flags.ts route generation not disabled")
    if "PHYSICAL_LAYER_V0_1_READY = true" not in flags:
        fail(errors, "flags.ts PHYSICAL_LAYER_V0_1_READY not true")
    if "MULTIMODAL_PHYSICAL_GRAPH_READY = true" not in flags:
        fail(errors, "flags.ts MULTIMODAL_PHYSICAL_GRAPH_READY not true")

    for blob in (engine, provider, ext, adj, multi, membership, friction, qa, manifest, stations, lines, times):
        if secret_leak(blob):
            fail(errors, "secret material in artifacts")

    if errors:
        print("GATE_1B5_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("GATE_1B5_VALIDATOR=PASS")
    print(
        "counts",
        json.dumps(
            {
                "runtimeReady": membership["runtimeReadyCount"],
                "staged": membership["runtimeStagedCount"],
                "excluded": membership["runtimeExcludedCount"],
                "sparse": adj["sparseOperationalEdgeCount"],
                "access": len(access),
                "providerPreserved": 598,
            }
        ),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
