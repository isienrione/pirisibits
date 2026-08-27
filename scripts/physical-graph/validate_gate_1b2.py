#!/usr/bin/env python3
"""Gate 1B.2 physical-data + engine-node integrity validator."""

from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
LAUNCH = ROOT / "src/data/santiago/santiago_launch_corpus.v0.1.json"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"

EXPECTED_IDS = [f"STGO_{i:02d}" for i in range(1, 104)]
SYNTHETIC_NAME = re.compile(r"Cultural Node Sector|Sector\s+\d+|Generated POI|Placeholder", re.I)


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def main() -> int:
    errors: list[str] = []
    if not ENGINE.exists():
        print("PHYSICAL_DATA_VALIDATOR=FAIL missing engine nodes")
        return 1

    data = json.loads(ENGINE.read_text(encoding="utf-8"))
    launch = json.loads(LAUNCH.read_text(encoding="utf-8"))
    nodes = data.get("nodes") or []

    if data.get("nodeCount") != 103 or len(nodes) != 103:
        fail(errors, f"expected 103 nodes, got nodeCount={data.get('nodeCount')} len={len(nodes)}")
    ids = [n.get("stgoId") for n in nodes]
    if ids != EXPECTED_IDS:
        fail(errors, "IDs must be exactly STGO_01 … STGO_103 with no gaps/duplicates")
    if len(set(ids)) != 103:
        fail(errors, "duplicate canonical IDs")

    launch_nodes = [n for n in nodes if n.get("launchCorpus")]
    backlog = [n for n in nodes if not n.get("launchCorpus")]
    if len(launch_nodes) != 30:
        fail(errors, f"launch corpus size != 30 ({len(launch_nodes)})")
    if len(backlog) != 73:
        fail(errors, f"backlog size != 73 ({len(backlog)})")

    launch_slugs = [n["legacySlug"] for n in launch_nodes]
    if launch_slugs != launch.get("ids"):
        fail(errors, "launch legacySlug order diverges from locked launch corpus")

    for n in nodes:
        sid = n.get("stgoId")
        # legacy never primary key
        if n.get("legacySlug") == sid:
            fail(errors, f"{sid}: legacySlug equals canonical id")
        if SYNTHETIC_NAME.search(str(n.get("canonicalName") or "")) or SYNTHETIC_NAME.search(
            str(n.get("displayName") or "")
        ):
            fail(errors, f"{sid}: synthetic placeholder name")

        # provider must not mutate identity
        if n.get("identityStatus") == "RESOLVED" and not n.get("canonicalName"):
            fail(errors, f"{sid}: resolved identity missing name")
        if n.get("identityStatus") == "UNRESOLVED" and n.get("canonicalName") is not None:
            fail(errors, f"{sid}: unresolved identity must not invent canonicalName")

        # no auto curator approve
        if n.get("curatorApproval") is not None:
            fail(errors, f"{sid}: curatorApproval must remain null (never automatic)")
        if n.get("physicalVerificationState") == "CURATOR_APPROVED":
            fail(errors, f"{sid}: physicalVerificationState CURATOR_APPROVED forbidden without human gate")
        if n.get("providerClassification") == "AUTO_HIGH_CONFIDENCE":
            if n.get("physicalVerificationState") not in {"PROVIDER_DERIVED", "NEEDS_CURATOR_REVIEW"}:
                fail(errors, f"{sid}: high-confidence must stay PROVIDER_DERIVED (not curator)")

        poi = n.get("poiCoordinate")
        entrance = n.get("entranceCoordinate")
        xp = n.get("experiencePointCoordinate")
        # Distinctions: do not assume equality by copying
        if entrance is not None and poi is not None and entrance == poi:
            # Allowed only if separately curated — for Gate 1B.2 entrance must be null
            fail(errors, f"{sid}: entranceCoordinate must not be auto-copied from poiCoordinate")
        if xp is not None and poi is not None and xp == poi:
            fail(errors, f"{sid}: experiencePointCoordinate must not be auto-copied from poiCoordinate")
        if entrance is not None:
            fail(errors, f"{sid}: entranceCoordinate unexpectedly set (Gate 1B.2 keeps null)")
        if xp is not None:
            fail(errors, f"{sid}: experiencePointCoordinate unexpectedly set (Gate 1B.2 keeps null)")

        transit = n.get("nearestTransit") or {}
        if transit.get("status") != "UNRESOLVED":
            fail(errors, f"{sid}: transit must remain UNRESOLVED without trustworthy dataset")
        if transit.get("distanceMeters") is not None:
            fail(errors, f"{sid}: fabricated transit distance")

        # null physical values OK
        if poi is not None:
            lat, lng = poi.get("lat"), poi.get("lng")
            if lat is None or lng is None or (isinstance(lat, float) and math.isnan(lat)):
                fail(errors, f"{sid}: invalid poiCoordinate")
            cand = n.get("providerCandidate") or {}
            if cand.get("lat") != lat or cand.get("lng") != lng:
                fail(errors, f"{sid}: poiCoordinate mutated away from provider candidate")
            if not n.get("providerId"):
                fail(errors, f"{sid}: coordinate without providerId")

        # provenance
        prov = n.get("provenance") or {}
        if not prov.get("identity") or not prov.get("physical"):
            fail(errors, f"{sid}: provenance missing identity/physical blocks")
        if (prov.get("physical") or {}).get("curatorApproval") != "never-automatic":
            fail(errors, f"{sid}: provenance must record never-automatic curatorApproval")

        if n.get("physicalRouteGenerationEnabled") is not False:
            fail(errors, f"{sid}: physicalRouteGenerationEnabled must be false")

    if data.get("physicalRouteGenerationEnabled") is not False:
        fail(errors, "file-level physicalRouteGenerationEnabled must be false")
    if data.get("autoCuratorApproveFromMapbox") is not False:
        fail(errors, "autoCuratorApproveFromMapbox must be false")

    flags = FLAGS.read_text(encoding="utf-8")
    if "PHYSICAL_ROUTE_GENERATION_ENABLED = false" not in flags:
        fail(errors, "flags.ts route generation not disabled")

    blob = json.dumps(data)
    if "pk.ey" in blob or "MAPBOX_ACCESS_TOKEN" in blob:
        fail(errors, "possible secret in engine JSON")

    # Dense Centro POIs legitimately share ~0.01° cells; do not treat that as synthetic.
    # Arithmetic / copy-paste smells are covered by validate_synthetic_patterns.py
    # (identical coords ≥3, progression deltas, missing providerId).

    if errors:
        print("PHYSICAL_DATA_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("PHYSICAL_DATA_VALIDATOR=PASS")
    print("nodes", len(nodes))
    print("counts", json.dumps(data.get("counts")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
