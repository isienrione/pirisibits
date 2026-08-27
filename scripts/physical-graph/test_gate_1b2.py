#!/usr/bin/env python3
"""Gate 1B.2 Python assertions for Santiago canonical inventory."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
LAUNCH = ROOT / "src/data/santiago/santiago_launch_corpus.v0.1.json"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"


def main() -> int:
    data = json.loads(ENGINE.read_text(encoding="utf-8"))
    launch = json.loads(LAUNCH.read_text(encoding="utf-8"))
    nodes = data["nodes"]
    assert data["nodeCount"] == 103
    assert len(nodes) == 103
    assert [n["stgoId"] for n in nodes] == [f"STGO_{i:02d}" for i in range(1, 104)]
    assert len({n["stgoId"] for n in nodes}) == 103
    assert sum(1 for n in nodes if n["launchCorpus"]) == 30
    assert sum(1 for n in nodes if not n["launchCorpus"]) == 73
    assert [n["legacySlug"] for n in nodes if n["launchCorpus"]] == launch["ids"]

    for n in nodes:
        assert n["legacySlug"] != n["stgoId"]
        assert n.get("curatorApproval") is None
        assert n.get("physicalVerificationState") != "CURATOR_APPROVED"
        assert n.get("entranceCoordinate") is None
        assert n.get("experiencePointCoordinate") is None
        assert (n.get("nearestTransit") or {}).get("status") == "UNRESOLVED"
        assert n.get("physicalRouteGenerationEnabled") is False
        assert "pk.ey" not in json.dumps(n)
        if n.get("poiCoordinate") is not None:
            assert n.get("providerId")
            cand = n["providerCandidate"]
            assert cand["lat"] == n["poiCoordinate"]["lat"]
            assert cand["lng"] == n["poiCoordinate"]["lng"]
        # provider cannot mutate identity keys
        assert re.fullmatch(r"STGO_(?:0[1-9]|[1-9]\d|10[0-3])", n["stgoId"])

    assert data["physicalRouteGenerationEnabled"] is False
    assert data["autoCuratorApproveFromMapbox"] is False
    flags = FLAGS.read_text(encoding="utf-8")
    assert "PHYSICAL_ROUTE_GENERATION_ENABLED = false" in flags
    assert "AUTO_CURATOR_APPROVE_FROM_MAPBOX = false" in flags

    # No synthetic placeholder names
    for n in nodes:
        name = f"{n.get('canonicalName') or ''} {n.get('displayName') or ''}"
        assert "Cultural Node Sector" not in name
        assert not re.search(r"Sector\s+\d+", name)

    print("GATE_1B2_PYTHON_TESTS=PASS")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print("GATE_1B2_PYTHON_TESTS=FAIL", exc)
        raise SystemExit(1) from exc
