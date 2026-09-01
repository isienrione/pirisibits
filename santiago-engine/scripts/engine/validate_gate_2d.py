#!/usr/bin/env python3
"""Gate 2D — ArcQuality + route reranker validator."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FLAGS = ROOT / "src/lib/city-graph/flags.ts"
REPORT = ROOT / "docs/engine/GATE_2D_ARCQUALITY_RERANKER_V0_1.md"
FIXTURES = ROOT / "src/data/santiago/routes/arc-reranker-fixtures.v0.1.json"
ROUTES_DIR = ROOT / "src/engine/routes"
NARRATIVE = ROOT / "src/data/santiago/narrative/santiago_launch30_narrative_graph.proposed.v0.1.json"
START = "aaa86de94ac5a43e204089ea65c6e77c524e8ba8"

REQUIRED = [
    "arc-quality-config.ts",
    "arc-quality.ts",
    "route-reranker.ts",
    "route-position-role.ts",
    "route-shape.ts",
    "route-quality-diagnostics.ts",
]

IMMUTABLE = [
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
        print("GATE_2D_VALIDATOR=FAIL")
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
        "ARC_QUALITY_V0_1_PROVISIONAL_READY = true",
        "PHYSICAL_ROUTE_GENERATION_ENABLED = false",
    ]:
        if line not in flags:
            fail(errors, f"flag drift: {line}")

    fixtures = json.loads(FIXTURES.read_text(encoding="utf-8"))
    if fixtures.get("arcQualityStatus") != "PROVISIONAL_V0_1":
        fail(errors, "fixtures must declare arcQualityStatus PROVISIONAL_V0_1")
    if fixtures.get("calibrationApproved") is not False:
        fail(errors, "fixtures must remain unapproved")
    rows = fixtures.get("fixtures") or []
    if len(rows) != 18:
        fail(errors, f"expected 18 fixtures, got {len(rows)}")
    if not fixtures.get("deterministicRepeatF2F18"):
        fail(errors, "F2/F18 rerank determinism failed")

    for row in rows:
        if row.get("flags", {}).get("includesStgo104"):
            fail(errors, f"{row.get('id')} includes STGO_104")
        if row.get("rejectedCount", 0) > 0:
            fail(errors, f"{row.get('id')} rejected valid candidates")

    f17 = next(r for r in rows if r["id"] == "F17")
    if f17.get("flags", {}).get("includesStgo104"):
        fail(errors, "F17 must not route STGO_104")

    narr = json.loads(NARRATIVE.read_text(encoding="utf-8"))
    if narr.get("calibrationApproved") is not False:
        fail(errors, "narrative graph must remain unapproved")

    for rel in IMMUTABLE:
        proc = subprocess.run(["git", "diff", "--quiet", START, "--", rel], cwd=ROOT, check=False)
        if proc.returncode != 0:
            fail(errors, f"immutable artifact changed since start: {rel}")

    reranker = (ROUTES_DIR / "route-reranker.ts").read_text(encoding="utf-8")
    arc = (ROUTES_DIR / "arc-quality.ts").read_text(encoding="utf-8")
    for src, name in [(reranker, "route-reranker"), (arc, "arc-quality")]:
        if re.search(r"openai|anthropic|fetch\(", src, re.I):
            fail(errors, f"{name} must not call runtime LLMs")

    for f in [FIXTURES, REPORT, ROUTES_DIR / "route-reranker.ts"]:
        text = f.read_text(encoding="utf-8", errors="ignore")
        if "pk.ey" in text or re.search(r"MAPBOX_ACCESS_TOKEN=[A-Za-z0-9._-]+", text):
            fail(errors, f"secret in {f.relative_to(ROOT)}")

    if errors:
        print("GATE_2D_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("GATE_2D_VALIDATOR=PASS")
    print(json.dumps({"fixtures": 18, "winnersChanged": fixtures.get("winnersChangedCount"), "start": START}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
