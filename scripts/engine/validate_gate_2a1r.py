#!/usr/bin/env python3
"""Gate 2A.1R — founder semantic source restoration validator."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json"
SEMANTIC = ROOT / "src/data/santiago/santiago_semantic_calibration.v0.1.json"
LAUNCH = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"
HTML = ROOT / "docs/engine/gate-2a1-editorial-calibration.html"
REPORT = ROOT / "docs/engine/GATE_2A1R_SOURCE_RESTORATION_REPORT.md"
FREEZE_SHA = "a747c1112ccd96424af0de2126fc1ef27316fb8e"
THEME = ["T1A", "T1B", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9"]
METRICS = ["anchor_density", "heritage_depth", "micro_reveal", "polish"]
PHYSICAL = [
    "src/data/santiago/santiago_physical_edges.v0.1.json",
    "src/data/santiago/santiago_pedestrian_adjacency.v0.2.json",
    "src/data/santiago/santiago_multimodal_graph.v0.3.json",
    "src/data/santiago/santiago_physical_graph_manifest.v0.1.json",
    "src/data/santiago/santiago_physical_edges_stgo05_extension.v0.1.json",
    "src/data/santiago/santiago_launch_runtime_membership.v0.1.json",
]


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def main() -> int:
    errors: list[str] = []
    for p in (SOURCE, SEMANTIC, LAUNCH, FLAGS, HTML, REPORT):
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")
    if errors:
        print("GATE_2A1R_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    semantic = json.loads(SEMANTIC.read_text(encoding="utf-8"))
    launch = json.loads(LAUNCH.read_text(encoding="utf-8"))
    flags = FLAGS.read_text(encoding="utf-8")
    html = HTML.read_text(encoding="utf-8")

    if len(source.get("nodes") or []) != 103:
        fail(errors, "source node count != 103")
    if semantic.get("recordCount") != 103 or len(semantic.get("records") or []) != 103:
        fail(errors, "semantic artifact != 103")
    if launch.get("recordCount") != 30 or len(launch.get("records") or []) != 30:
        fail(errors, "launch artifact != 30")
    if launch.get("demoNameMatches", 1) != 0:
        fail(errors, "demoNameMatches must be 0")
    if launch.get("binarySyntheticReplaced") != 30:
        fail(errors, "binarySyntheticReplaced must be 30")
    if "EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY = true" not in flags:
        fail(errors, "PROPOSED_READY not true")
    if "EDITORIAL_CALIBRATION_CURATOR_APPROVED = true" in flags.replace(
        "EDITORIAL_CALIBRATION_CURATOR_APPROVED = false", ""
    ):
        fail(errors, "CURATOR_APPROVED must be false")
    if "PHYSICAL_ROUTE_GENERATION_ENABLED = false" not in flags:
        fail(errors, "route generation must stay false")

    src_by = {n["poi_id"]: n for n in source["nodes"]}
    for r in semantic["records"]:
        sid = r["stgoId"]
        src = src_by[sid]
        sm = src["source_calibration"]["structural_metrics"]
        vec = src["source_calibration"]["vectors"]
        if r.get("structuralMetrics") != sm:
            fail(errors, f"{sid}: structural metrics drift")
        for code in THEME:
            if float(r["thematicVector"][code]) != float(vec[code.lower()]):
                fail(errors, f"{sid}: vector {code} drift")
        if r.get("thematicVectorProvenance") != "FOUNDER_PRECALIBRATED":
            fail(errors, f"{sid}: vector provenance")
        if r.get("tier") != src.get("tier"):
            fail(errors, f"{sid}: tier drift")
        cw = r["chronoWorth"]
        expected = int(
            round(
                100
                * (
                    0.35 * sm["heritage_depth"]
                    + 0.30 * sm["anchor_density"]
                    + 0.20 * sm["micro_reveal"]
                    + 0.15 * sm["polish"]
                )
            )
        )
        if cw.get("proposed") != expected:
            fail(errors, f"{sid}: ChronoWorth not from metrics ({cw.get('proposed')} != {expected})")
        if cw.get("approved") is not None:
            fail(errors, f"{sid}: ChronoWorth must not be approved")
        if "AI_PROPOSED" not in str(cw.get("provenance")):
            fail(errors, f"{sid}: ChronoWorth provenance")

    # No binary/pois canonical scoring dependency (notes/forbiddenInputs may mention the ban)
    for r in launch["records"]:
        if r.get("demoPoiIdMatched") not in (None,):
            fail(errors, f"{r['stgoId']}: demoPoiIdMatched must be null")
        if r.get("thematicVectorProvenance") != "FOUNDER_PRECALIBRATED":
            fail(errors, f"{r['stgoId']}: vector not founder")
        for src in r.get("sources") or []:
            if src.get("type") in {"BINARY_THEME_EXPANSION", "DEMO_POI_CONTINUOUS_REMAPPED", "CULINARY_T2_CONTENT_HEURISTIC"}:
                fail(errors, f"{r['stgoId']}: forbidden synthetic source type {src.get('type')}")
    for r in semantic["records"]:
        if r.get("thematicVectorProvenance") != "FOUNDER_PRECALIBRATED":
            fail(errors, f"semantic {r['stgoId']}: vector not founder")
        if "BINARY_THEME_EXPANSION" in json.dumps(r.get("sources") or []):
            fail(errors, f"semantic {r['stgoId']}: binary expansion")

    if "FOUNDER" not in html:
        fail(errors, "HTML missing FOUNDER badge language")

    for rel in PHYSICAL:
        proc = subprocess.run(
            ["git", "diff", "--quiet", FREEZE_SHA, "--", rel],
            cwd=ROOT,
            check=False,
        )
        if proc.returncode != 0:
            fail(errors, f"physical mutated: {rel}")

    # secret scan
    for folder in [ROOT / "src/engine", ROOT / "docs/engine", ROOT / "src/data/santiago"]:
        for f in folder.rglob("*"):
            if not f.is_file():
                continue
            if f.suffix not in {".ts", ".tsx", ".json", ".md", ".html", ".py"}:
                continue
            t = f.read_text(encoding="utf-8", errors="ignore")
            if "pk.ey" in t or "MAPBOX_ACCESS_TOKEN=" in t:
                fail(errors, f"secret in {f.relative_to(ROOT)}")

    for rel in [
        "src/engine/scoring/nodeUtility.ts",
        "src/engine/candidates/buildCandidatePool.ts",
    ]:
        t = (ROOT / rel).read_text(encoding="utf-8")
        if "function NarrativeEdgeScore" in t or "optimizeItinerary(" in t:
            fail(errors, f"forbidden composition in {rel}")

    if errors:
        print("GATE_2A1R_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1
    print("GATE_2A1R_VALIDATOR=PASS")
    print(
        json.dumps(
            {
                "source": 103,
                "semantic": 103,
                "launch": 30,
                "sensitive": [s["stgoId"] for s in semantic.get("sensitiveMemorySourceList") or []],
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
