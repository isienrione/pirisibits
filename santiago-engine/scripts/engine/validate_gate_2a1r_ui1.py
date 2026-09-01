#!/usr/bin/env python3
"""Gate 2A.1R-UI.1 — Score rationale explainability validator."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COCKPIT = ROOT / "docs/engine/gate-2a1-founder-calibration-cockpit.html"
RATIONALES = ROOT / "src/data/santiago/curation/launch30_score_rationales.v0.1.json"
LAUNCH = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
BUILDER = ROOT / "scripts/engine/build_launch30_score_rationales_v0_1.py"
GEN = ROOT / "scripts/engine/generate_gate_2a1_founder_cockpit.py"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"
START = "0e5903e46598365fcee3142c2f374a45e49ece77"
ALLOWED_GATES = {"2A.1R-UI.1", "2A.1R-ADD-01R", "2A.1R-UI.2"}

REQUIRED_FIELDS = [
    "T1A",
    "T1B",
    "T2",
    "T3",
    "T4",
    "T5",
    "T6",
    "T7",
    "T8",
    "T9",
    "anchor_density",
    "heritage_depth",
    "micro_reveal",
    "polish",
    "tier",
    "visitTimeMin",
    "M1",
    "M2",
    "M3",
    "M4",
    "M5",
]

STRUCTURAL = ["anchor_density", "heritage_depth", "micro_reveal", "polish"]
THEMES = REQUIRED_FIELDS[:10]
MODES = ["M1", "M2", "M3", "M4", "M5"]

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


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def main() -> int:
    errors: list[str] = []
    for p in (COCKPIT, RATIONALES, LAUNCH, BUILDER, GEN, FLAGS):
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")
    if errors:
        print("GATE_2A1R_UI1_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    html = COCKPIT.read_text(encoding="utf-8")
    flags = FLAGS.read_text(encoding="utf-8")
    rationales = json.loads(RATIONALES.read_text(encoding="utf-8"))
    launch = json.loads(LAUNCH.read_text(encoding="utf-8"))

    if rationales.get("sourceCheckpointSha") not in {START, "1b0ef938e681eedcd95d57f449a411e4b972d2b0", "0e5903e46598365fcee3142c2f374a45e49ece77"}:
        fail(errors, "rationale artifact checkpoint mismatch")
    if len(rationales.get("records") or []) != 30:
        fail(errors, "rationale records must be 30")
    if rationales.get("gate") not in ALLOWED_GATES:
        fail(errors, f"unexpected launch30 rationales gate: {rationales.get('gate')}")

    conf_hist = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    coverage = {f: 0 for f in REQUIRED_FIELDS}
    launch_by = {r["stgoId"]: r for r in launch["records"]}

    for rec in rationales["records"]:
        sid = rec["stgoId"]
        if sid not in launch_by:
            fail(errors, f"unknown rationale POI {sid}")
            continue
        fields = {f["field"]: f for f in rec.get("fields") or []}
        for f in REQUIRED_FIELDS:
            if f not in fields:
                fail(errors, f"{sid}: missing rationale for {f}")
            else:
                coverage[f] += 1
                conf = fields[f].get("confidence")
                if conf not in conf_hist:
                    fail(errors, f"{sid}.{f}: invalid confidence {conf}")
                else:
                    conf_hist[conf] += 1
                if f == "visitTimeMin":
                    if sid == "STGO_104":
                        if "No prior calibrated score exists" not in str(fields[f].get("whyThisScore", "")):
                            fail(errors, "STGO_104 visitTime must state no prior calibrated score")
                    else:
                        if fields[f].get("rationaleClass") != "AI_PROPOSAL_RATIONALE":
                            fail(errors, f"{sid}.visitTimeMin must be AI_PROPOSAL_RATIONALE")
                        if "AI_PROPOSED_UNVERIFIED" not in str(fields[f].get("evidenceLimitations", "")) and "AI_PROPOSED_UNVERIFIED" not in str(
                            fields[f].get("provenance", "")
                        ):
                            fail(errors, f"{sid}.visitTimeMin must mark AI_PROPOSED_UNVERIFIED")
                for key in ("whyThisScore", "whyNotHigher", "whyNotLower", "confidence"):
                    if not fields[f].get(key):
                        fail(errors, f"{sid}.{f}: missing {key}")

        # ChronoWorth math exact vs launch structural metrics
        m = launch_by[sid]["structuralMetrics"]

        def js_round1(x: float) -> float:
            return float(int(x * 10 + 0.5)) / 10.0

        br = rec.get("chronoWorthBreakdown") or {}
        if any(m.get(k) is None for k in ("heritage_depth", "anchor_density", "micro_reveal", "polish")):
            if br.get("status") != "UNAVAILABLE" and br.get("raw") is not None:
                fail(errors, f"{sid}: ChronoWorth must be UNAVAILABLE when metrics UNKNOWN")
        else:
            expected = {
                "heritage_depth": js_round1(float(m["heritage_depth"]) * 35),
                "anchor_density": js_round1(float(m["anchor_density"]) * 30),
                "micro_reveal": js_round1(float(m["micro_reveal"]) * 20),
                "polish": js_round1(float(m["polish"]) * 15),
            }
            contrib = br.get("contributions") or {}
            for k, v in expected.items():
                if contrib.get(k) != v:
                    fail(errors, f"{sid}: ChronoWorth {k} contrib {contrib.get(k)} != {v}")
            raw_expected = js_round1(sum(expected.values()))
            if br.get("raw") != raw_expected:
                fail(errors, f"{sid}: ChronoWorth raw {br.get('raw')} != {raw_expected}")
        if not rec.get("thematicSummary"):
            fail(errors, f"{sid}: missing thematicSummary")
        if not rec.get("structuralSummary"):
            fail(errors, f"{sid}: missing structuralSummary")

    for f, n in coverage.items():
        if n != 30:
            fail(errors, f"coverage {f} = {n}/30")

    # Embedded cockpit payload
    m_src = re.search(r"const SOURCE = (\{.*?\});\nconst RATIONALES", html, re.S)
    m_rat = re.search(r"const RATIONALES = (\{.*?\});\nconst THEME_META", html, re.S)
    if not m_src:
        fail(errors, "embedded SOURCE missing (expected RATIONALES neighbor)")
    if not m_rat:
        fail(errors, "embedded RATIONALES missing")
    else:
        emb = json.loads(m_rat.group(1))
        if len(emb.get("records") or []) not in {30, 104}:
            fail(errors, "embedded rationales must cover 30 or 104 POIs")
        # Launch30 artifact remains the 30-slice; full embed may use santiago-score-rationales schema.
        if emb.get("recordCount") == 30 and emb.get("schemaVersion") != rationales.get("schemaVersion"):
            fail(errors, "embedded rationales schema mismatch vs artifact")

    if m_src:
        source = json.loads(m_src.group(1))
        if source.get("sourceCheckpointSha") != START:
            fail(errors, "cockpit sourceCheckpointSha mismatch")
        if source.get("gate") not in ALLOWED_GATES:
            fail(errors, "cockpit gate must be UI.1 / ADD-01R / UI.2")
        by = {r["stgoId"]: r for r in launch["records"]}
        for r in source["records"]:
            if not r.get("launchCorpus"):
                continue
            o = by[r["stgoId"]]
            if r["thematicVector"] != o["thematicVector"]:
                fail(errors, f"{r['stgoId']}: cockpit thematicVector drifted")
            if r["structuralMetrics"] != o["structuralMetrics"]:
                fail(errors, f"{r['stgoId']}: cockpit structuralMetrics drifted")

    markers = [
        "Why this score?",
        "liveChronoBreakdown",
        "Current thematic interpretation",
        "Current structural interpretation",
        "Weighted contribution breakdown",
        "founderChangeReasons",
        "proposalRationale",
        "evidenceLimitations",
        "exportField",
        "SOURCE RATIONALE",
        "AI_PROPOSED_UNVERIFIED",
        "Save Draft",
        "Approve POI",
        "MODIFIED_AFTER_APPROVAL",
        "localStorage",
    ]
    for s in markers:
        if s not in html:
            fail(errors, f"cockpit missing marker: {s}")
    if "Approve All" in html:
        fail(errors, "Approve All must not exist")

    # Flags / routing
    for line in [
        "PHYSICAL_LAYER_V0_1_READY = true",
        "PHYSICAL_ROUTE_GENERATION_ENABLED = false",
        "NODE_UTILITY_V0_1_READY = true",
        "EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY = true",
        "EDITORIAL_CALIBRATION_CURATOR_APPROVED = false",
    ]:
        if line not in flags:
            fail(errors, f"flag drift: {line}")

    for rel in PHYSICAL + SEMANTIC_PATHS:
        proc = subprocess.run(
            ["git", "diff", "--quiet", START, "--", rel],
            cwd=ROOT,
            check=False,
        )
        if proc.returncode != 0:
            fail(errors, f"immutable artifact changed since start: {rel}")

    if "NarrativeEdgeScore" in html or "optimizeItinerary" in html:
        fail(errors, "must not start Gate 2B / route composition")

    for f in [COCKPIT, RATIONALES, BUILDER, GEN]:
        text = f.read_text(encoding="utf-8", errors="ignore")
        if "pk.ey" in text or re.search(r"MAPBOX_" + r"ACCESS_TOKEN=[^\n\"']+", text):
            fail(errors, f"secret in {f.relative_to(ROOT)}")

    if errors:
        print("GATE_2A1R_UI1_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("GATE_2A1R_UI1_VALIDATOR=PASS")
    print(
        json.dumps(
            {
                "pois": 30,
                "themeCoverage": "100%",
                "structuralCoverage": "100%",
                "visitTimeCoverage": "100%",
                "modeCoverage": "100%",
                "confidenceHistogramRequiredFields": conf_hist,
                "artifactConfidenceHistogram": rationales.get("confidenceHistogram"),
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
