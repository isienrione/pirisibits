#!/usr/bin/env python3
"""Gate 1B.4.1 — official DTPM GTFS transit correction validator."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
PROVIDER = ROOT / "src/data/santiago/santiago_physical_edges.v0.1.json"
STATIONS = ROOT / "src/data/santiago/transit/santiago_metro_stations.v0.2.json"
LINES = ROOT / "src/data/santiago/transit/santiago_metro_lines.v0.2.json"
TIMES = ROOT / "src/data/santiago/transit/santiago_metro_scheduled_times.v0.1.json"
MULTI = ROOT / "src/data/santiago/santiago_multimodal_graph.v0.2.json"
META = ROOT / "src/data/santiago/transit/santiago_gtfs_feed_provenance.v0.1.json"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"

OPERATIONAL = {"L1", "L2", "L3", "L4", "L4A", "L5", "L6"}


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def main() -> int:
    errors: list[str] = []
    for p in (ENGINE, PROVIDER, STATIONS, LINES, TIMES, MULTI, META, FLAGS):
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")
    if errors:
        print("GATE_1B41_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    provider = json.loads(PROVIDER.read_text(encoding="utf-8"))
    stations = json.loads(STATIONS.read_text(encoding="utf-8"))
    lines = json.loads(LINES.read_text(encoding="utf-8"))
    times = json.loads(TIMES.read_text(encoding="utf-8"))
    multi = json.loads(MULTI.read_text(encoding="utf-8"))
    meta = json.loads(META.read_text(encoding="utf-8"))
    flags = FLAGS.read_text(encoding="utf-8")

    if engine.get("nodeCount") != 103:
        fail(errors, "103-node inventory broken")
    if provider.get("counts", {}).get("runtimeWalkEdges") != 598:
        fail(errors, "Gate 1B.3 provider edges not preserved")

    if meta.get("agencyId") != "M":
        fail(errors, "GTFS Metro agency_id must be M")
    if not str(meta.get("sourceUrl", "")).startswith("https://www.dtpm.cl/"):
        fail(errors, "GTFS source must be official DTPM URL")

    line_ids = {l["lineId"] for l in lines["lines"]}
    if line_ids != OPERATIONAL:
        fail(errors, f"operational lines mismatch: {sorted(line_ids)}")
    if "L7" in line_ids:
        fail(errors, "runtime Metro contains L7")
    if multi.get("counts", {}).get("l7RuntimePresent") is not False:
        fail(errors, "l7RuntimePresent must be false")

    station_ids = {s["stationId"] for s in stations["stations"]}
    seen_gtfs = set()
    for s in stations["stations"]:
        if s.get("provenance") != "dtpm_gtfs":
            fail(errors, f"{s['stationId']}: missing official provenance")
        if not s.get("gtfsStopId"):
            fail(errors, f"{s['stationId']}: missing gtfsStopId")
        if s["gtfsStopId"] in seen_gtfs:
            fail(errors, f"duplicate conceptual station for gtfsStopId {s['gtfsStopId']}")
        seen_gtfs.add(s["gtfsStopId"])
        if "L7" in (s.get("lines") or []):
            fail(errors, f"{s['stationId']} lists L7")

    for line in lines["lines"]:
        for sid in line.get("stationOrder") or []:
            if sid not in station_ids:
                fail(errors, f"line {line['lineId']} dangling station {sid}")
        if line.get("runtimeOperational") is not True:
            fail(errors, f"{line['lineId']} not marked operational")

    for seg in times.get("segments") or []:
        if seg.get("durationLabel") != "SCHEDULED_GTFS_DURATION":
            fail(errors, f"{seg['segmentId']}: bad duration label")
        if seg.get("sampleCount", 0) < 1:
            fail(errors, f"{seg['segmentId']}: no GTFS evidence")
        if seg.get("notRealtime") is not True:
            fail(errors, f"{seg['segmentId']}: must declare notRealtime")

    for e in multi.get("metroRideEdges") or []:
        if e.get("lineId") == "L7":
            fail(errors, "L7 ride edge in runtime graph")
        if e.get("scheduledDurationSeconds") is None:
            fail(errors, f"{e['edgeId']}: missing scheduled duration")
        if e.get("observedDurationSeconds") is not None:
            fail(errors, f"{e['edgeId']}: invented observed duration")
        if e.get("enginePolicyHopCostSeconds") not in (None, 0):
            # hop fallback must not masquerade when scheduled exists
            if e.get("durationLabel") == "SCHEDULED_GTFS_DURATION" and e.get("enginePolicyHopCostSeconds"):
                fail(errors, f"{e['edgeId']}: heuristic hop stored alongside scheduled duration")

    for e in multi.get("metroTransferEdges") or []:
        if e.get("physicalTransferDurationSeconds") is not None and e.get("observedDurationSeconds") is not None:
            pass
        if e.get("physicalTransferDurationSeconds") is not None:
            # only allowed with provenance — currently must be null
            fail(errors, f"{e['edgeId']}: fabricated physical transfer duration")
        if e.get("enginePolicyTransferPenaltySeconds") is None:
            fail(errors, f"{e['edgeId']}: missing engine policy transfer penalty")

    for e in multi.get("poiMetroAccessEdges") or []:
        if e["stationId"] not in station_ids:
            fail(errors, f"access edge unreconciled station {e['stationId']}")
        if e.get("runtimePreferred") and e.get("verificationState") == "REVIEW_REQUIRED":
            fail(errors, f"{e['edgeId']}: review-required marked runtime")

    for blocked in ("STGO_05", "STGO_23", "STGO_33"):
        if any(e.get("stgoId") == blocked for e in multi.get("poiMetroAccessEdges") or []):
            fail(errors, f"{blocked} gained metro access")

    if multi.get("thematicNarrativeUsed") is not False:
        fail(errors, "thematic/narrative used")
    if "PHYSICAL_ROUTE_GENERATION_ENABLED = false" not in flags:
        fail(errors, "route generation not disabled")
    if multi.get("physicalRouteGenerationEnabled") is not False:
        fail(errors, "multi file enables route generation")

    # OSM must not be canonical
    if multi.get("canonicalTransitSource") != "dtpm_gtfs":
        fail(errors, "canonical transit source must be dtpm_gtfs")

    for blob in (stations, lines, times, multi, meta):
        s = json.dumps(blob)
        if "pk.ey" in s or "MAPBOX_ACCESS_TOKEN" in s:
            fail(errors, "secret material in artifacts")

    if errors:
        print("GATE_1B41_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("GATE_1B41_VALIDATOR=PASS")
    print("counts", json.dumps(multi.get("counts")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
