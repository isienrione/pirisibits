#!/usr/bin/env python3
"""Gate 2A.1R-UI — Founder Calibration Cockpit validator."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COCKPIT = ROOT / "docs/engine/gate-2a1-founder-calibration-cockpit.html"
OLD_HTML = ROOT / "docs/engine/gate-2a1-editorial-calibration.html"
LAUNCH = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
SEMANTIC = ROOT / "src/data/santiago/santiago_semantic_calibration.v0.1.json"
SOURCE = ROOT / "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"
GEN = ROOT / "scripts/engine/generate_gate_2a1_founder_cockpit.py"
START = "1b0ef938e681eedcd95d57f449a411e4b972d2b0"
PHYSICAL = [
    "src/data/santiago/santiago_physical_edges.v0.1.json",
    "src/data/santiago/santiago_pedestrian_adjacency.v0.2.json",
    "src/data/santiago/santiago_multimodal_graph.v0.3.json",
    "src/data/santiago/santiago_physical_graph_manifest.v0.1.json",
    "src/data/santiago/santiago_physical_edges_stgo05_extension.v0.1.json",
]
SEMANTIC_PATHS = [
    "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json",
]
# Membership/semantic/launch calibration are updated by Gate 2A.1R-ADD-01R; frozen seed remains immutable.


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def main() -> int:
    errors: list[str] = []
    for p in (COCKPIT, OLD_HTML, LAUNCH, SEMANTIC, SOURCE, FLAGS, GEN):
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")
    if errors:
        print("GATE_2A1R_UI_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    html = COCKPIT.read_text(encoding="utf-8")
    flags = FLAGS.read_text(encoding="utf-8")
    launch = json.loads(LAUNCH.read_text(encoding="utf-8"))

    m = re.search(r"const SOURCE = (\{.*?\});\nconst (?:RATIONALES|THEME_META)", html, re.S)
    if not m:
        fail(errors, "embedded SOURCE payload missing")
        print("GATE_2A1R_UI_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1
    source = json.loads(m.group(1))

    if len(source.get("records") or []) != 30:
        fail(errors, "cockpit must embed exactly 30 launch POIs")
    if source.get("normalizationCorpus") != "SANTIAGO_LAUNCH30_V0_1":
        fail(errors, "normalizationCorpus missing/incorrect")
    if source.get("sourceCheckpointSha") != START:
        fail(errors, "sourceCheckpointSha mismatch")

    by = {r["stgoId"]: r for r in launch["records"]}
    for r in source["records"]:
        o = by[r["stgoId"]]
        if r["thematicVector"] != o["thematicVector"]:
            fail(errors, f"{r['stgoId']}: thematicVector != Gate 2A.1R")
        if r["structuralMetrics"] != o["structuralMetrics"]:
            fail(errors, f"{r['stgoId']}: structuralMetrics != Gate 2A.1R")
        if r["tier"] != o["tier"]:
            fail(errors, f"{r['stgoId']}: tier != Gate 2A.1R")

    # Required UX/behavior markers
    required = [
        "STORAGE_KEY",
        "Save Draft",
        "Approve POI",
        "Reset POI to Source",
        "Reset field",
        "Export Founder Calibration",
        "launch30_founder_calibration.reviewed.v0.1.json",
        "INCOMPLETE_FOUNDER_REVIEW",
        "MODIFIED_AFTER_APPROVAL",
        "Taxonomy & Scoring Guide",
        "Taxonomy &amp; Scoring Guide",
        "guideBtn",
        "RAW",
        "RELATIVE",
        "FOUNDER_PRECALIBRATED",
        "FOUNDER_EDITED",
        "AI_PROPOSED_UNVERIFIED",
        "ORIGINAL → DRAFT",
        "orig-mark",
        "__CW_FOUNDER_COCKPIT__",
    ]
    for s in required:
        if s == "Taxonomy & Scoring Guide":
            if "Taxonomy & Scoring Guide" not in html and "Taxonomy &amp; Scoring Guide" not in html:
                fail(errors, "cockpit missing Taxonomy & Scoring Guide")
            continue
        if s == "Taxonomy &amp; Scoring Guide":
            continue
        if s not in html:
            fail(errors, f"cockpit missing required marker: {s}")
    if "Approve All" in html:
        fail(errors, "Approve All must not exist")

    for t in ["T1A", "T1B", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9"]:
        if f'"{t}"' not in html and f"'{t}'" not in html:
            fail(errors, f"missing theme {t}")
    for metric in ["anchor_density", "heritage_depth", "micro_reveal", "polish"]:
        if metric not in html:
            fail(errors, f"missing metric {metric}")
    for mode in ["M1", "M2", "M3", "M4", "M5"]:
        if mode not in html:
            fail(errors, f"missing mode {mode}")

    # Handbook arrays present with 10 themes / 4 metrics / 5 modes
    tm = re.search(r"const THEME_META = (\[.*?\]);\nconst METRIC_META", html, re.S)
    mm = re.search(r"const METRIC_META = (\[.*?\]);\nconst MODE_META", html, re.S)
    om = re.search(r"const MODE_META = (\[.*?\]);\nconst STORAGE_KEY", html, re.S)
    if not tm or len(json.loads(tm.group(1))) != 10:
        fail(errors, "THEME_META incomplete")
    if not mm or len(json.loads(mm.group(1))) != 4:
        fail(errors, "METRIC_META incomplete")
    if not om or len(json.loads(om.group(1))) != 5:
        fail(errors, "MODE_META incomplete")

    # Formula + live recalc markers
    if "0.35" not in html or "heritage_depth" not in html:
        fail(errors, "ChronoWorth formula missing")
    if "100 * raws" not in html and "100 * raws[r.stgoId] / maxRaw" not in html:
        if "100 * raws[r.stgoId] / maxRaw" not in html.replace(" ", ""):
            # check uncompressed
            if "/ maxRaw" not in html:
                fail(errors, "normalized ChronoWorth logic missing")

    # Flags unchanged
    for line in [
        "PHYSICAL_LAYER_V0_1_READY = true",
        "PHYSICAL_ROUTE_GENERATION_ENABLED = false",
        "NODE_UTILITY_V0_1_READY = true",
        "EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY = true",
        "EDITORIAL_CALIBRATION_CURATOR_APPROVED = false",
    ]:
        if line not in flags:
            fail(errors, f"flag drift: {line}")
    if "EDITORIAL_CALIBRATION_CURATOR_APPROVED = true" in flags:
        fail(errors, "global curator-approved must remain false")

    # Physical + semantic immutability vs start SHA
    for rel in PHYSICAL + SEMANTIC_PATHS:
        proc = subprocess.run(
            ["git", "diff", "--quiet", START, "--", rel],
            cwd=ROOT,
            check=False,
        )
        if proc.returncode != 0:
            fail(errors, f"immutable artifact changed since start: {rel}")

    # No narrative/route composition introduced by this gate
    if "NarrativeEdgeScore" in html or "optimizeItinerary" in html:
        fail(errors, "cockpit must not introduce narrative/route composition")

    # Secret scan (cockpit artifacts only — avoid false positives from validators' search strings)
    for f in [COCKPIT, GEN, ROOT / "docs/engine/GATE_2A1R_UI_FOUNDER_COCKPIT_REPORT.md"]:
        if not f.exists():
            continue
        text = f.read_text(encoding="utf-8", errors="ignore")
        if "pk.ey" in text or re.search(r"MAPBOX_ACCESS_TOKEN=[^\n\"']+", text):
            fail(errors, f"secret in {f.relative_to(ROOT)}")

    # Old QA HTML preserved
    if not OLD_HTML.exists():
        fail(errors, "historical QA HTML must remain")

    # No binary-0.7 / pois canonical dependency introduced in cockpit source payload
    blob = json.dumps(source)
    if "BINARY_THEME_EXPANSION" in blob or "pois.ts" in blob:
        fail(errors, "cockpit source payload must not introduce pois/binary fallbacks")

    if errors:
        print("GATE_2A1R_UI_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    cws = [(r["stgoId"], r["chronoWorthProposed"]) for r in source["records"] if r.get("chronoWorthProposed") is not None]
    top = max(cws, key=lambda x: x[1]) if cws else ("NONE", None)
    print("GATE_2A1R_UI_VALIDATOR=PASS")
    print(json.dumps({"launchPois": 30, "topChronoWorthProposed": {"id": top[0], "value": top[1]}}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
