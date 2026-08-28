#!/usr/bin/env python3
"""Gate 2E.1 — validate Route Lab geographic QA upgrade."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
errors: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)


def main() -> int:
    flags = (ROOT / "src/lib/city-graph/flags.ts").read_text()
    if "ROUTE_LAB_GEOGRAPHIC_QA_READY = true" not in flags:
        fail("ROUTE_LAB_GEOGRAPHIC_QA_READY flag missing or false")
    if "PHYSICAL_ROUTE_GENERATION_ENABLED = false" not in flags:
        fail("PHYSICAL_ROUTE_GENERATION_ENABLED must remain false")

    html = (ROOT / "docs/engine/gate-2e-route-lab.html").read_text()
    if "route-lab-map.v0.1.js" not in html:
        fail("map module script missing from generated HTML")
    if "FIT SELECTED ROUTE" not in html:
        fail("FIT SELECTED ROUTE control missing")
    if "santiago-route-lab-embed.v0.2" not in html:
        fail("embed schema v0.2 missing — run gate:2e:build")
    if re.search(r"pk\.eyJ", html):
        fail("Mapbox token leaked into generated HTML")

    map_js = (ROOT / "docs/engine/route-lab-map.v0.1.js").read_text()
    if "/api/config" not in map_js:
        fail("map module must fetch token via /api/config")
    if re.search(r"pk\.eyJ", map_js):
        fail("Mapbox token leaked into map JS")

    serve = (ROOT / "scripts/engine/serve_route_lab_v0_1.ts").read_text()
    if "/api/config" not in serve:
        fail("serve script missing /api/config endpoint")

    fp_path = ROOT / "src/data/santiago/routes/gate-2e1-engine-fingerprint.v0.1.json"
    if not fp_path.exists():
        fail("engine fingerprint baseline missing")
    else:
        fp = json.loads(fp_path.read_text())
        if len(fp.get("fingerprints", {})) != 18:
            fail(f"expected 18 fingerprints, got {len(fp.get('fingerprints', {}))}")

    human = (ROOT / "src/dev/route-lab/humanReview.ts").read_text()
    if "cw_route_lab_human_review_v0_1" not in human:
        fail("human review storage key missing")

    if errors:
        print("GATE_2E1_ROUTE_LAB_GEO_VALIDATOR=FAIL")
        for e in errors:
            print(f"  - {e}")
        return 1

    print("GATE_2E1_ROUTE_LAB_GEO_VALIDATOR=PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
