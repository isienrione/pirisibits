#!/usr/bin/env python3
"""Gate 1B.1 Python assertions (identity + proposed geocode contract)."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    identity = json.loads((ROOT / "src/data/santiago/santiago_physical_identity.v0.1.json").read_text())
    launch = json.loads((ROOT / "src/data/santiago/santiago_launch_corpus.v0.1.json").read_text())
    proposed_path = ROOT / "src/data/santiago/santiago_physical_nodes.proposed.v0.1.json"
    assert identity["nodeCount"] == 103
    assert len(identity["nodes"]) == 103
    assert launch["count"] == 30
    assert len(launch["ids"]) == 30
    assert set(launch["ids"]).issubset({n["id"] for n in identity["nodes"]})
    for n in identity["nodes"]:
        assert n["lat"] is None and n["lng"] is None
        assert n["physicalState"] == "IDENTITY_ONLY"

    assert proposed_path.exists(), "proposed geocode file missing — run enrich script"
    proposed = json.loads(proposed_path.read_text())
    assert proposed["launchNodeCount"] == 30
    assert proposed["physicalRouteGenerationEnabled"] is False
    assert proposed["autoCuratorApproveFromMapbox"] is False
    for n in proposed["nodes"]:
        assert n.get("selectionStatus") != "CURATOR_APPROVED"
        assert n.get("curatorApproval") in (None, "pending", False)
        assert "pk.ey" not in json.dumps(n)

    # flags.ts contract
    flags = (ROOT / "src/lib/city-graph/flags.ts").read_text()
    assert "PHYSICAL_ROUTE_GENERATION_ENABLED = false" in flags
    assert "AUTO_CURATOR_APPROVE_FROM_MAPBOX = false" in flags

    # dotenv load order present in enrich script
    enrich = (ROOT / "scripts/physical-graph/enrich_santiago_physical_graph.py").read_text()
    assert "load_dotenv(ROOT / \".env.local\"" in enrich
    assert "load_dotenv(ROOT / \".env\"" in enrich
    assert "override=False" in enrich

    print("GATE_1B1_PYTHON_TESTS=PASS")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print("GATE_1B1_PYTHON_TESTS=FAIL", exc)
        raise SystemExit(1) from exc
