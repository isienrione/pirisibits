#!/usr/bin/env python3
"""Physical-data validator for Gate 1B.1 proposed Santiago nodes."""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROPOSED = ROOT / "src/data/santiago/santiago_physical_nodes.proposed.v0.1.json"
IDENTITY = ROOT / "src/data/santiago/santiago_physical_identity.v0.1.json"
LAUNCH = ROOT / "src/data/santiago/santiago_launch_corpus.v0.1.json"

SANTIAGO_BBOX = (-70.80, -33.60, -70.50, -33.35)
FORBIDDEN_APPROVAL = {"CURATOR_APPROVED", "AUTO_APPROVED"}


def fail(msg: str, errors: list[str]) -> None:
    errors.append(msg)


def main() -> int:
    errors: list[str] = []
    if not PROPOSED.exists():
        print("FAIL: proposed coordinate dataset missing:", PROPOSED)
        return 1

    proposed = json.loads(PROPOSED.read_text(encoding="utf-8"))
    identity = json.loads(IDENTITY.read_text(encoding="utf-8"))
    launch = json.loads(LAUNCH.read_text(encoding="utf-8"))

    if identity.get("nodeCount") != 103:
        fail(f"identity nodeCount != 103 ({identity.get('nodeCount')})", errors)
    if len(launch.get("ids") or []) != 30:
        fail(f"launch corpus != 30 ({len(launch.get('ids') or [])})", errors)
    if proposed.get("physicalRouteGenerationEnabled") is not False:
        fail("physicalRouteGenerationEnabled must be false", errors)
    if proposed.get("autoCuratorApproveFromMapbox") is not False:
        fail("autoCuratorApproveFromMapbox must be false", errors)

    nodes = proposed.get("nodes") or []
    if len(nodes) != 30:
        fail(f"proposed launch nodes != 30 ({len(nodes)})", errors)

    ids = [n.get("id") for n in nodes]
    if ids != launch.get("ids"):
        fail("proposed node order/ids diverge from locked launch corpus", errors)

    blob = json.dumps(proposed)
    if "MAPBOX_ACCESS_TOKEN" in blob or "pk." in blob and "mapbox.com" not in blob.lower():
        # crude token leak guard — Mapbox public tokens start with pk.
        if "pk.ey" in blob:
            fail("possible Mapbox token leaked into proposed JSON", errors)

    for n in nodes:
        status = n.get("selectionStatus")
        if status in FORBIDDEN_APPROVAL or n.get("curatorApproval") in FORBIDDEN_APPROVAL:
            fail(f"{n.get('id')}: CURATOR_APPROVED must not be auto-set", errors)
        if n.get("physicalState") == "CURATOR_APPROVED":
            fail(f"{n.get('id')}: physicalState CURATOR_APPROVED forbidden", errors)

        lat, lng = n.get("lat"), n.get("lng")
        if status in {"PROVIDER_SELECTED_HIGH_CONFIDENCE", "NEEDS_CURATOR_REVIEW"} and n.get("selectedCandidate"):
            if lat is None or lng is None:
                fail(f"{n.get('id')}: selected candidate missing lat/lng", errors)
            elif not (SANTIAGO_BBOX[1] <= lat <= SANTIAGO_BBOX[3] and SANTIAGO_BBOX[0] <= lng <= SANTIAGO_BBOX[2]):
                fail(f"{n.get('id')}: coordinate outside Santiago bbox", errors)
            # Must match provider exactly
            sel = n["selectedCandidate"]
            if sel.get("lat") != lat or sel.get("lng") != lng:
                fail(f"{n.get('id')}: lat/lng mutated away from provider candidate", errors)
            if not sel.get("providerId"):
                fail(f"{n.get('id')}: missing providerId", errors)
        if status == "NO_RESULT" and (lat is not None or lng is not None):
            fail(f"{n.get('id')}: NO_RESULT must not invent coordinates", errors)

        for c in n.get("candidates") or []:
            if c.get("lat") is not None and (isinstance(c["lat"], float) and math.isnan(c["lat"])):
                fail(f"{n.get('id')}: NaN candidate coordinate", errors)

        if not n.get("queryUsed"):
            fail(f"{n.get('id')}: missing queryUsed", errors)

    if errors:
        print("PHYSICAL_DATA_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("PHYSICAL_DATA_VALIDATOR=PASS")
    print("nodes", len(nodes))
    print("counts", json.dumps(proposed.get("counts")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
