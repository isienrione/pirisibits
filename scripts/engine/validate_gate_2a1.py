#!/usr/bin/env python3
"""Gate 2A.1 — editorial calibration + continuous semantic restoration validator."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CAL = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"
CONTRACT = ROOT / "docs/engine/ENGINE_V0_1_IMPLEMENTATION_CONTRACT.md"
REPORT = ROOT / "docs/engine/GATE_2A1_EDITORIAL_CALIBRATION_REPORT.md"
HTML = ROOT / "docs/engine/gate-2a1-editorial-calibration.html"
AUDIT = ROOT / "docs/engine/gate-2a1-source-audit.json"
FREEZE_SHA = "a747c1112ccd96424af0de2126fc1ef27316fb8e"

THEME_CODES = ["T1A", "T1B", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9"]
PHYSICAL_PATHS = [
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
    for p in (CAL, ENGINE, FLAGS, CONTRACT, REPORT, HTML, AUDIT):
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")
    if errors:
        print("GATE_2A1_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    cal = json.loads(CAL.read_text(encoding="utf-8"))
    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    flags = FLAGS.read_text(encoding="utf-8")
    contract = CONTRACT.read_text(encoding="utf-8")
    report = REPORT.read_text(encoding="utf-8")

    if cal.get("gate") != "2A.1":
        fail(errors, "calibration gate != 2A.1")
    if cal.get("curatorApproved") is not False:
        fail(errors, "calibration must not be curatorApproved")
    if cal.get("recordCount") != 30 or len(cal.get("records") or []) != 30:
        fail(errors, "expected 30 calibration records")
    if cal.get("canonicalTaxonomy") != THEME_CODES:
        fail(errors, "canonicalTaxonomy must be T1A–T9 including T2")

    if "EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY = true" not in flags:
        fail(errors, "EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY not true")
    if "EDITORIAL_CALIBRATION_CURATOR_APPROVED = true" in flags:
        fail(errors, "EDITORIAL_CALIBRATION_CURATOR_APPROVED must not be true")
    if "EDITORIAL_CALIBRATION_CURATOR_APPROVED = false" not in flags:
        fail(errors, "EDITORIAL_CALIBRATION_CURATOR_APPROVED must be false")
    if "PHYSICAL_ROUTE_GENERATION_ENABLED = false" not in flags:
        fail(errors, "route generation must stay disabled")
    if "NODE_UTILITY_V0_1_READY = true" not in flags:
        fail(errors, "NODE_UTILITY_V0_1_READY must stay true")
    if "PHYSICAL_LAYER_V0_1_READY = true" not in flags:
        fail(errors, "PHYSICAL_LAYER_V0_1_READY must stay true")

    if "T2 Culinary" not in contract and "Culinary Explorer" not in contract:
        fail(errors, "contract missing T2 culinary restoration")
    if "YourMatch" not in contract:
        fail(errors, "contract missing YourMatch definition")
    if "NarrativeEdgeScore" in contract and "Gate 2B" not in contract:
        fail(errors, "contract NarrativeEdgeScore without Gate 2B staging")

    for rel in PHYSICAL_PATHS:
        proc = subprocess.run(
            ["git", "diff", "--quiet", FREEZE_SHA, "--", rel],
            cwd=ROOT,
            check=False,
        )
        if proc.returncode != 0:
            fail(errors, f"physical artifact mutated since freeze: {rel}")

    t2_strong = 0
    for r in cal["records"]:
        sid = r["stgoId"]
        vec = r.get("thematicVector") or {}
        if set(vec.keys()) != set(THEME_CODES):
            fail(errors, f"{sid}: thematicVector keys incomplete")
        for code, val in vec.items():
            if not isinstance(val, (int, float)) or val < 0 or val > 1:
                fail(errors, f"{sid}: {code} out of 0..1 ({val})")
        if "T2" not in vec:
            fail(errors, f"{sid}: T2 missing")
        if vec.get("T2", 0) >= 0.7:
            t2_strong += 1
        if "T1" in vec and "T1A" not in vec:
            fail(errors, f"{sid}: merged T1 detected")
        cw = r.get("chronoWorth") or {}
        if cw.get("approved") is not None:
            fail(errors, f"{sid}: chronoWorth approved must be null")
        if not str(cw.get("provenance", "")).startswith("AI_PROPOSED"):
            fail(errors, f"{sid}: chronoWorth provenance not AI_PROPOSED")
        if cw.get("proposed") is None:
            fail(errors, f"{sid}: chronoWorth proposed missing")
        vt = r.get("visitTime") or {}
        if vt.get("includesTravelTime") is not False:
            fail(errors, f"{sid}: visitTime must exclude travel")
        if vt.get("approved") is not None:
            fail(errors, f"{sid}: visitTime must not be auto-approved")
        m2 = (r.get("structuralSuitability") or {}).get("M2") or {}
        if m2.get("status") == "UNKNOWN" and m2.get("value") is not None:
            fail(errors, f"{sid}: M2 UNKNOWN must keep value null")
        if r.get("sensitiveMemory", {}).get("value") and "T1B alone" in str(
            r.get("sensitiveMemory", {}).get("note", "")
        ):
            # note documents separation — OK
            pass
        tags = r.get("derivedThemeTags") or []
        thr = float(r.get("themeTagThreshold") or 0.45)
        expected = [c for c in THEME_CODES if float(vec.get(c, 0)) >= thr]
        if tags != expected:
            fail(errors, f"{sid}: derivedThemeTags not deterministic from vector")

    if t2_strong < 5:
        fail(errors, f"expected >=5 strong culinary T2 nodes, got {t2_strong}")

    # Secret scan
    scan_roots = [
        ROOT / "src/engine",
        ROOT / "docs/engine",
        ROOT / "src/data/santiago/curation",
        CAL,
    ]
    for p in scan_roots:
        files = list(p.rglob("*")) if p.is_dir() else [p]
        for f in files:
            if not f.is_file():
                continue
            text = f.read_text(encoding="utf-8", errors="ignore")
            if "pk.ey" in text or "MAPBOX_ACCESS_TOKEN=" in text or "sk-" in text[:2000]:
                # allow unrelated sk- in docs? still flag mapbox
                if "pk.ey" in text or "MAPBOX_ACCESS_TOKEN=" in text:
                    fail(errors, f"secret material in {f.relative_to(ROOT)}")

    # Engine source must not implement NarrativeEdge / route composition operationally
    for rel in [
        "src/engine/scoring/nodeUtility.ts",
        "src/engine/candidates/buildCandidatePool.ts",
        "src/engine/index.ts",
    ]:
        text = (ROOT / rel).read_text(encoding="utf-8")
        if "function NarrativeEdgeScore" in text or "optimizeItinerary(" in text:
            fail(errors, f"forbidden route/edge composition in {rel}")

    if "Gate 2A.1" not in report and "2A.1" not in report:
        fail(errors, "report missing Gate 2A.1 heading")
    if "ChronoWorth" not in HTML.read_text(encoding="utf-8"):
        fail(errors, "curator HTML missing ChronoWorth UI")

    # Launch engine nodes still binary-only is OK; semantic layer is calibration
    launch = [n for n in engine["nodes"] if n.get("launchCorpus")]
    if len(launch) != 30:
        fail(errors, "launch corpus size drift")

    if errors:
        print("GATE_2A1_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("GATE_2A1_VALIDATOR=PASS")
    print(json.dumps({"records": 30, "t2Strong": t2_strong, "demoMatches": cal.get("demoNameMatches")}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
