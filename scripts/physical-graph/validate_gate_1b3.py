#!/usr/bin/env python3
"""Gate 1B.3 — pedestrian edge graph integrity validator."""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
EDGES = ROOT / "src/data/santiago/santiago_physical_edges.v0.1.json"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def main() -> int:
    errors: list[str] = []
    for p in (ENGINE, EDGES, FLAGS):
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")

    if errors:
        print("GATE_1B3_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    data = json.loads(EDGES.read_text(encoding="utf-8"))
    node_ids = {n["stgoId"] for n in engine["nodes"]}
    edges = data.get("edges") or []
    eligible = set(data.get("eligibleStgoIds") or [])

    if data.get("gate") != "1B.3":
        fail(errors, "edge file gate must be 1B.3")
    if data.get("physicalRouteGenerationEnabled") is not False:
        fail(errors, "physicalRouteGenerationEnabled must be false in edge file")
    if "PHYSICAL_ROUTE_GENERATION_ENABLED = false" not in FLAGS.read_text(encoding="utf-8"):
        fail(errors, "flags.ts route generation not disabled")

    seen_ids: set[str] = set()
    runtime = [e for e in edges if e.get("runtimeEligible")]

    for e in edges:
        eid = e.get("edgeId")
        if not eid or eid in seen_ids:
            fail(errors, f"duplicate or missing edgeId: {eid}")
        seen_ids.add(eid)

        for field in ("fromPoiId", "toPoiId"):
            if e.get(field) not in node_ids:
                fail(errors, f"{eid}: endpoint {field}={e.get(field)} not in 103-node inventory")

        if e.get("runtimeEligible"):
            if e["fromPoiId"] not in eligible or e["toPoiId"] not in eligible:
                fail(errors, f"{eid}: runtime edge involves non-eligible node")
            if e.get("mode") != "WALK":
                fail(errors, f"{eid}: runtime edge mode must be WALK")

        if e["fromPoiId"] == e["toPoiId"] and e.get("provenance", {}).get("routingStatus") == "OK":
            fail(errors, f"{eid}: self-edge with provider OK")

        if e.get("provenance", {}).get("routingStatus") == "OK":
            if e.get("distanceM", 0) <= 0 or e.get("durationS", 0) <= 0:
                fail(errors, f"{eid}: non-positive provider distance/duration")
            if e.get("provider") != "mapbox":
                fail(errors, f"{eid}: provider must be mapbox")
            if not e.get("provenance"):
                fail(errors, f"{eid}: missing provenance")
            pc = e.get("physicalCost") or {}
            if pc.get("distanceM") != e.get("distanceM"):
                fail(errors, f"{eid}: physicalCost.distanceM mismatch")
            if "haversine" in json.dumps(e).lower():
                fail(errors, f"{eid}: haversine must not appear as canonical cost")
        elif e.get("runtimeEligible"):
            fail(errors, f"{eid}: failed provider must not be runtime eligible")

        for forbidden in ("narrativeEdgeScore", "chronoWorth", "themes", "matchScore", "ArcState"):
            if forbidden in e:
                fail(errors, f"{eid}: thematic field {forbidden} forbidden on edges")

    stgo23 = sum(1 for e in runtime if "STGO_23" in (e["fromPoiId"], e["toPoiId"]))
    stgo33 = sum(1 for e in runtime if "STGO_33" in (e["fromPoiId"], e["toPoiId"]))
    stgo05 = sum(1 for e in runtime if "STGO_05" in (e["fromPoiId"], e["toPoiId"]))
    if stgo23:
        fail(errors, "STGO_23 must have zero runtime edges")
    if stgo33:
        fail(errors, "STGO_33 must have zero runtime edges")
    if stgo05:
        fail(errors, "STGO_05 must have zero runtime edges under partial policy")

    blob = json.dumps(data)
    if "pk.ey" in blob or "MAPBOX_ACCESS_TOKEN" in blob:
        fail(errors, "secret material in edge JSON")

    if not runtime:
        fail(errors, "runtime pedestrian graph is empty")

    if errors:
        print("GATE_1B3_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("GATE_1B3_VALIDATOR=PASS")
    print("runtime_edges", len(runtime))
    print("counts", json.dumps(data.get("counts")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
