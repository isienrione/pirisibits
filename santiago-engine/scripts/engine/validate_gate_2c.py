#!/usr/bin/env python3
"""Gate 2C — Provisional route composer validator."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FLAGS = ROOT / "src/lib/city-graph/flags.ts"
REPORT = ROOT / "docs/engine/GATE_2C_ROUTE_COMPOSER_V0_1.md"
FIXTURES = ROOT / "src/data/santiago/routes/route-composer-fixtures.v0.1.json"
ROUTES_DIR = ROOT / "src/engine/routes"
NARRATIVE = ROOT / "src/data/santiago/narrative/santiago_launch30_narrative_graph.proposed.v0.1.json"
START = "b99ca18f74a9b3aa1e2d000d510f7b3f46e52fe4"

REQUIRED = [
    "route-types.ts",
    "route-request.ts",
    "route-composer.ts",
    "route-search.ts",
    "route-score.ts",
    "route-diversity.ts",
    "route-explain.ts",
    "route-compare.ts",
    "route-config.ts",
    "route-physical.ts",
]

PHYSICAL = [
    "src/data/santiago/santiago_physical_edges.v0.1.json",
    "src/data/santiago/santiago_pedestrian_adjacency.v0.2.json",
    "src/data/santiago/santiago_multimodal_graph.v0.3.json",
    "src/data/santiago/santiago_physical_graph_manifest.v0.1.json",
    "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json",
    "src/data/santiago/source/santiago_founder_extensions.v0.1.json",
    "src/data/santiago/narrative/santiago_launch30_narrative_graph.proposed.v0.1.json",
]


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def main() -> int:
    errors: list[str] = []
    for p in (FLAGS, REPORT, FIXTURES, ROUTES_DIR, NARRATIVE):
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")
    for name in REQUIRED:
        if not (ROUTES_DIR / name).exists():
            fail(errors, f"missing routes/{name}")
    if errors:
        print("GATE_2C_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    flags = FLAGS.read_text(encoding="utf-8")
    for line in [
        "EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY = true",
        "EDITORIAL_CALIBRATION_CURATOR_APPROVED = false",
        "ENGINE_USING_PROVISIONAL_EDITORIAL_CALIBRATION = true",
        "NARRATIVE_GRAPH_V0_1_PROPOSED_READY = true",
        "ROUTE_COMPOSER_V0_1_PROVISIONAL_READY = true",
        "PHYSICAL_ROUTE_GENERATION_ENABLED = false",
    ]:
        if line not in flags:
            fail(errors, f"flag drift: {line}")
    if "PHYSICAL_ROUTE_GENERATION_ENABLED = true" in flags:
        fail(errors, "production routing must remain disabled")

    fixtures = json.loads(FIXTURES.read_text(encoding="utf-8"))
    if fixtures.get("calibrationApproved") is not False:
        fail(errors, "fixtures must remain unapproved")
    if fixtures.get("physicalRouteGenerationEnabled") is not False:
        fail(errors, "fixtures must not enable production routing")
    rows = fixtures.get("fixtures") or []
    if len(rows) != 18:
        fail(errors, f"expected 18 fixtures, got {len(rows)}")
    if not fixtures.get("deterministicRepeatF2F18"):
        fail(errors, "F2/F18 determinism failed")

    for row in rows:
        if row.get("flags", {}).get("includesStgo104"):
            fail(errors, f"{row.get('id')} includes STGO_104")
        if row.get("flags", {}).get("includesL7"):
            fail(errors, f"{row.get('id')} includes L7")
        if row.get("flags", {}).get("overBudget"):
            fail(errors, f"{row.get('id')} over budget beyond tolerance")
        if row.get("id") in {"F1", "F2", "F3", "F15"} and row.get("candidatesReturned", 0) < 1:
            fail(errors, f"{row.get('id')} returned no candidates")

    f17 = next(r for r in rows if r["id"] == "F17")
    omits = {o["stgoId"]: o["reasonCode"] for o in f17.get("primaryOmissionReasons") or []}
    if omits.get("STGO_104") != "PHYSICAL_STATUS_PENDING":
        fail(errors, "F17 must omit STGO_104 as PHYSICAL_STATUS_PENDING")

    narr = json.loads(NARRATIVE.read_text(encoding="utf-8"))
    if narr.get("calibrationApproved") is not False:
        fail(errors, "narrative graph must remain unapproved")

    cockpit = ROOT / "docs/engine/gate-2a1-founder-calibration-cockpit.html"
    if not cockpit.exists() or "All 104" not in cockpit.read_text(encoding="utf-8", errors="ignore"):
        fail(errors, "curator 104 inventory regression")

    for rel in PHYSICAL:
        proc = subprocess.run(["git", "diff", "--quiet", START, "--", rel], cwd=ROOT, check=False)
        if proc.returncode != 0:
            fail(errors, f"immutable artifact changed since start: {rel}")

    composer = (ROUTES_DIR / "route-composer.ts").read_text(encoding="utf-8")
    if re.search(r"openai|anthropic|fetch\(", composer, re.I):
        fail(errors, "composer must not call runtime LLMs")
    if "optimizeItinerary" in composer:
        fail(errors, "must not use knapsack optimizeItinerary")

    for f in [FIXTURES, REPORT, ROUTES_DIR / "route-composer.ts"]:
        text = f.read_text(encoding="utf-8", errors="ignore")
        if "pk.ey" in text or re.search(r"MAPBOX_ACCESS_TOKEN=[A-Za-z0-9._-]+", text):
            fail(errors, f"secret in {f.relative_to(ROOT)}")

    if errors:
        print("GATE_2C_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("GATE_2C_VALIDATOR=PASS")
    print(json.dumps({"fixtures": 18, "deterministicRepeat": True, "start": START}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
