#!/usr/bin/env python3
"""Gate 2E — Santiago Route Lab validator."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FLAGS = ROOT / "src/lib/city-graph/flags.ts"
REPORT = ROOT / "docs/engine/GATE_2E_ROUTE_LAB_V0_1.md"
HTML = ROOT / "docs/engine/gate-2e-route-lab.html"
UI_JS = ROOT / "docs/engine/route-lab-ui.v0.1.js"
DEV_DIR = ROOT / "src/dev/route-lab"
COCKPIT = ROOT / "docs/engine/gate-2a1-founder-calibration-cockpit.html"
START = "0842d5c9a2e6f871f7f2e6a063aebd99a48bacf1"

IMMUTABLE = [
    "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json",
    "src/data/santiago/source/santiago_founder_extensions.v0.1.json",
    "src/data/santiago/narrative/santiago_launch30_narrative_graph.proposed.v0.1.json",
    "src/data/santiago/santiago_pedestrian_adjacency.v0.2.json",
    "src/data/santiago/santiago_multimodal_graph.v0.3.json",
]

ENGINE_WEIGHT_FILES = [
    "src/engine/scoring/constants.ts",
    "src/engine/narrative/narrative-constants.ts",
    "src/engine/routes/route-config.ts",
    "src/engine/routes/arc-quality-config.ts",
]


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def main() -> int:
    errors: list[str] = []
    for p in (FLAGS, REPORT, HTML, UI_JS, DEV_DIR, COCKPIT):
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")

    flags = FLAGS.read_text(encoding="utf-8") if FLAGS.exists() else ""
    for line in [
        "ROUTE_LAB_V0_1_READY = true",
        "ARC_QUALITY_V0_1_PROVISIONAL_READY = true",
        "EDITORIAL_CALIBRATION_CURATOR_APPROVED = false",
        "PHYSICAL_ROUTE_GENERATION_ENABLED = false",
    ]:
        if line not in flags:
            fail(errors, f"flag drift: {line}")

    html = HTML.read_text(encoding="utf-8", errors="ignore") if HTML.exists() else ""
    if "PROVISIONAL ENGINE OUTPUT" not in html:
        fail(errors, "provisional banner missing")
    if "__ROUTE_LAB_DATA__" not in html:
        fail(errors, "embedded route lab payload missing — run gate:2e:build")

    if HTML.exists() and UI_JS.exists():
        payload_match = re.search(r"window\.__ROUTE_LAB_DATA__ = (\{.*?\});", html, re.S)
        if not payload_match:
            fail(errors, "could not parse embedded payload")
        else:
            try:
                data = json.loads(payload_match.group(1))
                fixtures = data.get("fixtures") or []
                results = data.get("results") or {}
                if len(fixtures) != 18:
                    fail(errors, f"expected 18 fixtures, got {len(fixtures)}")
                if data.get("defaultFixtureId") != "F2":
                    fail(errors, "default fixture must be F2")
                if len(results) != 18:
                    fail(errors, f"expected 18 embedded results, got {len(results)}")
            except json.JSONDecodeError as e:
                fail(errors, f"invalid embedded JSON: {e}")

    cockpit = COCKPIT.read_text(encoding="utf-8", errors="ignore")
    if "stgoId" not in cockpit or "URLSearchParams" not in cockpit:
        fail(errors, "curator cockpit missing stgoId deep link")

    for rel in IMMUTABLE:
        proc = subprocess.run(["git", "diff", "--quiet", START, "--", rel], cwd=ROOT, check=False)
        if proc.returncode != 0:
            fail(errors, f"immutable artifact changed: {rel}")

    for wf in ENGINE_WEIGHT_FILES:
        proc = subprocess.run(["git", "diff", "--quiet", START, "--", wf], cwd=ROOT, check=False)
        if proc.returncode != 0:
            fail(errors, f"scoring config must not change in Gate 2E: {wf}")

    if errors:
        print("GATE_2E_ROUTE_LAB_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("GATE_2E_ROUTE_LAB_VALIDATOR=PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
