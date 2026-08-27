#!/usr/bin/env python3
"""Gate 1B.2A — human launch curation integrity validator."""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
RAW = ROOT / "src/data/santiago/curation/launch30_physical_review.raw.v0.1.json"
NORM = ROOT / "src/data/santiago/curation/launch30_physical_review.normalized.v0.1.json"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"

EXPECTED_LAUNCH = [
    "STGO_01", "STGO_02", "STGO_03", "STGO_04", "STGO_05", "STGO_06", "STGO_07",
    "STGO_10", "STGO_11", "STGO_16", "STGO_18", "STGO_19", "STGO_20", "STGO_21",
    "STGO_22", "STGO_23", "STGO_24", "STGO_25", "STGO_26", "STGO_27", "STGO_28",
    "STGO_29", "STGO_32", "STGO_33", "STGO_34", "STGO_35", "STGO_48", "STGO_91",
    "STGO_92", "STGO_30",
]
SANTIAGO_BBOX = (-70.80, -33.60, -70.50, -33.35)


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def in_bbox(lat: float, lng: float) -> bool:
    min_lon, min_lat, max_lon, max_lat = SANTIAGO_BBOX
    return min_lon <= lng <= max_lon and min_lat <= lat <= max_lat


def main() -> int:
    errors: list[str] = []
    for p in (ENGINE, RAW, NORM):
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")

    if errors:
        print("GATE_1B2A_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    raw = json.loads(RAW.read_text(encoding="utf-8"))
    norm = json.loads(NORM.read_text(encoding="utf-8"))
    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    nodes = engine["nodes"]
    launch_set = set(EXPECTED_LAUNCH)

    if raw.get("recordCount") != 30 or len(raw.get("records") or []) != 30:
        fail(errors, "raw curation record count != 30")
    if norm.get("recordCount") != 30 or len(norm.get("records") or []) != 30:
        fail(errors, "normalized curation record count != 30")
    if sorted(r["stgoId"] for r in raw["records"]) != sorted(EXPECTED_LAUNCH):
        fail(errors, "raw records missing expected launch STGO IDs")

    if engine.get("nodeCount") != 103 or len(nodes) != 103:
        fail(errors, "103-node master inventory broken")
    if engine.get("physicalRouteGenerationEnabled") is not False:
        fail(errors, "physicalRouteGenerationEnabled must be false")
    if "PHYSICAL_ROUTE_GENERATION_ENABLED = false" not in FLAGS.read_text(encoding="utf-8"):
        fail(errors, "flags.ts route generation not disabled")

    launch_nodes = [n for n in nodes if n.get("launchCorpus")]
    backlog = [n for n in nodes if not n.get("launchCorpus")]
    if len(launch_nodes) != 30 or len(backlog) != 73:
        fail(errors, f"launch/backlog split invalid ({len(launch_nodes)}/{len(backlog)})")
    if sorted(n["stgoId"] for n in launch_nodes) != sorted(EXPECTED_LAUNCH):
        fail(errors, "launch corpus STGO IDs mismatch")

    field_verified = [n["stgoId"] for n in nodes if n.get("physicalVerificationState") == "FIELD_VERIFIED"]
    if field_verified:
        fail(errors, f"FIELD_VERIFIED must not increase automatically: {field_verified}")

    stgo23 = next(n for n in nodes if n["stgoId"] == "STGO_23")
    if stgo23.get("launchPhysicalReadiness") != "UNRESOLVED_RESEARCH_REQUIRED":
        fail(errors, "STGO_23 must be UNRESOLVED_RESEARCH_REQUIRED")
    if stgo23.get("curatorApproval") is not None or stgo23.get("poiCoordinate") is not None:
        fail(errors, "STGO_23 must not have curator-approved coordinates")
    if stgo23.get("physicalRouteGenerationEligible") is not False:
        fail(errors, "STGO_23 must be edge-ineligible")

    stgo33 = next(n for n in nodes if n["stgoId"] == "STGO_33")
    if stgo33.get("launchPhysicalReadiness") != "NEEDS_SEMANTIC_REVIEW":
        fail(errors, "STGO_33 must be NEEDS_SEMANTIC_REVIEW")
    if stgo33.get("curatorApproval") is not None or stgo33.get("poiCoordinate") is not None:
        fail(errors, "STGO_33 must not have curator-approved POI")
    if not (stgo33.get("curatorCuration") or {}).get("semanticWarning"):
        fail(errors, "STGO_33 missing semantic warning")

    stgo32 = next(n for n in nodes if n["stgoId"] == "STGO_32")
    if len(stgo32.get("accessPoints") or []) < 3:
        fail(errors, "STGO_32 must preserve >=3 access points")
    access_ids = {p.get("id") for p in stgo32.get("accessPoints") or []}
    if not {"funicular", "acceso_carlos_reed", "teleferico_pedro_de_valdivia"}.issubset(access_ids):
        fail(errors, f"STGO_32 access point ids incomplete: {access_ids}")

    stgo05 = next(n for n in nodes if n["stgoId"] == "STGO_05")
    roles = {p.get("id") for p in stgo05.get("physicalPoints") or []}
    if not {"cerro_poi", "terraza_neptuno", "castillo_hidalgo"}.issubset(roles):
        fail(errors, f"STGO_05 must preserve cerro/terraza/castillo points: {roles}")
    if not stgo05.get("curatorCuration", {}).get("coordinateConflict"):
        fail(errors, "STGO_05 must retain coordinate conflict evidence")

    for n in backlog:
        if n.get("curatorApproval") == "CURATOR_APPROVED":
            fail(errors, f"backlog node {n['stgoId']} must not be curator-approved by launch ingest")
        if n.get("curatorCuration"):
            fail(errors, f"backlog node {n['stgoId']} must not carry launch curator curation block")

    for n in launch_nodes:
        sid = n["stgoId"]
        if not n.get("curatorCuration"):
            fail(errors, f"{sid}: missing curatorCuration block")
        if not n.get("providerAudit"):
            fail(errors, f"{sid}: provider audit history missing")
        if n.get("providerCandidate") is None and (n.get("providerAudit") or {}).get("providerCandidate") is None:
            # allowed if never geocoded, but launch nodes should have audit from pre-ingest
            pass
        # Distinct fields
        if n.get("entranceCoordinate") is not None:
            fail(errors, f"{sid}: entrance must remain unresolved unless explicitly evidenced")
        poi, xp = n.get("poiCoordinate"), n.get("experiencePointCoordinate")
        if poi and xp and poi == xp:
            fail(errors, f"{sid}: POI must not equal experience point unless separately evidenced")
        for c in [poi, xp]:
            if c and not in_bbox(c["lat"], c["lng"]):
                fail(errors, f"{sid}: coordinate outside Santiago bbox")
        if n.get("curatorApproval") == "CURATOR_APPROVED" and not n.get("curatorCuration"):
            fail(errors, f"{sid}: CURATOR_APPROVED without human evidence block")

    blob = json.dumps(engine)
    if "pk.ey" in blob or "MAPBOX_ACCESS_TOKEN" in blob:
        fail(errors, "secret material in engine JSON")

    if errors:
        print("GATE_1B2A_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("GATE_1B2A_VALIDATOR=PASS")
    print("counts", json.dumps(engine.get("counts")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
