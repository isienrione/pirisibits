#!/usr/bin/env python3
"""Gate 2A.1R-UI.2 — Expand founder curator to full Santiago inventory (105)."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COCKPIT = ROOT / "docs/engine/gate-2a1-founder-calibration-cockpit.html"
RATIONALES = ROOT / "src/data/santiago/curation/santiago_score_rationales.v0.1.json"
RATIONALES_L30 = ROOT / "src/data/santiago/curation/launch30_score_rationales.v0.1.json"
SEMANTIC = ROOT / "src/data/santiago/santiago_semantic_calibration.v0.1.json"
LAUNCH = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
CORPUS = ROOT / "src/data/santiago/santiago_launch_corpus.v0.1.json"
FROZEN = ROOT / "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json"
EXTENSIONS = ROOT / "src/data/santiago/source/santiago_founder_extensions.v0.1.json"
GEN = ROOT / "scripts/engine/generate_gate_2a1_founder_cockpit.py"
BUILDER = ROOT / "scripts/engine/build_santiago_score_rationales_v0_1.py"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"
START = "0e5903e46598365fcee3142c2f374a45e49ece77"

PHYSICAL = [
    "src/data/santiago/santiago_physical_edges.v0.1.json",
    "src/data/santiago/santiago_pedestrian_adjacency.v0.2.json",
    "src/data/santiago/santiago_multimodal_graph.v0.3.json",
    "src/data/santiago/santiago_physical_graph_manifest.v0.1.json",
    "src/data/santiago/santiago_physical_edges_stgo05_extension.v0.1.json",
]
FROZEN_REL = "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json"


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def main() -> int:
    errors: list[str] = []
    for p in (COCKPIT, RATIONALES, RATIONALES_L30, SEMANTIC, LAUNCH, CORPUS, FROZEN, EXTENSIONS, GEN, BUILDER, FLAGS):
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")
    if errors:
        print("GATE_2A1R_UI2_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    html = COCKPIT.read_text(encoding="utf-8")
    flags = FLAGS.read_text(encoding="utf-8")
    sem = json.loads(SEMANTIC.read_text(encoding="utf-8"))
    launch = json.loads(LAUNCH.read_text(encoding="utf-8"))
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    rationales = json.loads(RATIONALES.read_text(encoding="utf-8"))
    launch_ids = set(corpus.get("ids") or corpus.get("stgoIds") or [])

    if len(sem.get("records") or []) != 105 or sem.get("recordCount") != 105:
        fail(errors, "semantic inventory must be 105")
    if len(launch.get("records") or []) != 30:
        fail(errors, "launch editorial must remain 30")
    if len(launch_ids) != 30:
        fail(errors, "launch corpus must remain 30")
    if "STGO_104" not in launch_ids:
        fail(errors, "STGO_104 must be in Launch30")
    if "STGO_23" in launch_ids:
        fail(errors, "STGO_23 must not be in Launch30")

    m_src = re.search(r"const SOURCE = (\{.*?\});\nconst RATIONALES", html, re.S)
    m_rat = re.search(r"const RATIONALES = (\{.*?\});\nconst THEME_META", html, re.S)
    if not m_src:
        fail(errors, "embedded SOURCE missing")
        print("GATE_2A1R_UI2_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1
    source = json.loads(m_src.group(1))
    emb_rat = json.loads(m_rat.group(1)) if m_rat else None

    if source.get("gate") != "2A.1R-UI.2":
        fail(errors, "cockpit gate must be 2A.1R-UI.2")
    if source.get("sourceCheckpointSha") != START:
        fail(errors, "sourceCheckpointSha mismatch")
    if len(source.get("records") or []) != 105:
        fail(errors, f"cockpit records={len(source.get('records') or [])} want 105")
    if source.get("defaultCorpusFilter") != "LAUNCH30":
        fail(errors, "defaultCorpusFilter must be LAUNCH30")

    counts = source.get("inventoryCounts") or {}
    if counts.get("all") != 105 or counts.get("launch30") != 30 or counts.get("nonLaunch") != 75:
        fail(errors, f"inventoryCounts wrong: {counts}")
    if counts.get("originalSeed") != 103 or counts.get("founderExtensions") != 2:
        fail(errors, f"provenance counts wrong: {counts}")

    ids = [r["stgoId"] for r in source["records"]]
    if len(ids) != len(set(ids)):
        fail(errors, "duplicate STGO IDs in cockpit")
    if ids.count("STGO_104") != 1:
        fail(errors, "STGO_104 must appear exactly once")
    if ids.count("STGO_33") != 1:
        fail(errors, "STGO_33 must appear exactly once")
    if "STGO_23" not in ids:
        fail(errors, "STGO_23 must be in All inventory")

    by = {r["stgoId"]: r for r in source["records"]}
    launch_embedded = [r for r in source["records"] if r.get("launchCorpus")]
    non_launch = [r for r in source["records"] if not r.get("launchCorpus")]
    if len(launch_embedded) != 30:
        fail(errors, f"launchCorpus true count={len(launch_embedded)}")
    if len(non_launch) != 75:
        fail(errors, f"non-launch count={len(non_launch)}")
    if by["STGO_23"].get("launchCorpus"):
        fail(errors, "STGO_23 must not be launchCorpus")
    if not by["STGO_104"].get("launchCorpus"):
        fail(errors, "STGO_104 must be launchCorpus")
    if by["STGO_104"].get("inventoryProvenance") != "FOUNDER_EXTENSION":
        fail(errors, "STGO_104 provenance must be FOUNDER_EXTENSION")
    if by["STGO_33"].get("inventoryProvenance") != "ORIGINAL_103_SEED":
        fail(errors, "STGO_33 must remain ORIGINAL_103_SEED")
    if "Funicular" in str(by["STGO_33"].get("displayName") or ""):
        fail(errors, "STGO_33 displayName must not include Funicular")
    if "Gárgola" not in str(by["STGO_33"].get("displayName") or ""):
        fail(errors, "STGO_33 must keep Gárgola identity")

    # Seed values for launch nodes match editorial launch artifact
    launch_by = {r["stgoId"]: r for r in launch["records"]}
    for r in launch_embedded:
        o = launch_by[r["stgoId"]]
        if r["thematicVector"] != o["thematicVector"]:
            fail(errors, f"{r['stgoId']}: thematicVector drift vs launch editorial")
        if r["structuralMetrics"] != o["structuralMetrics"]:
            fail(errors, f"{r['stgoId']}: structuralMetrics drift vs launch editorial")

    # STGO_104 UNKNOWN semantics
    s104 = by["STGO_104"]
    if any(v is not None for v in (s104.get("thematicVector") or {}).values()):
        fail(errors, "STGO_104 thematic values must remain UNKNOWN/null")
    if any(v is not None for v in (s104.get("structuralMetrics") or {}).values()):
        fail(errors, "STGO_104 structural values must remain UNKNOWN/null")
    if s104.get("chronoWorthProposed") is not None:
        fail(errors, "STGO_104 ChronoWorth must be unavailable/null")

    # Rationales coverage
    if len(rationales.get("records") or []) != 105:
        fail(errors, "full rationales must cover 105")
    if emb_rat is None or len(emb_rat.get("records") or []) != 105:
        fail(errors, "embedded rationales must cover 105")
    l30r = json.loads(RATIONALES_L30.read_text(encoding="utf-8"))
    if len(l30r.get("records") or []) != 30:
        fail(errors, "launch30 rationales slice must remain 30")

    structured_fields = 0
    for rec in rationales["records"]:
        structured_fields += len(rec.get("fields") or [])
    if structured_fields < 1000:
        fail(errors, f"unexpectedly low rationale field coverage: {structured_fields}")

    markers = [
        "2A.1R-UI.2",
        "cw_founder_cockpit_santiago104_v0_1",
        "cw_founder_cockpit_launch30_v0_1",
        "migrateLegacyStore",
        "Launch 30",
        "Non-launch / Backlog",
        "All 105",
        "CURRENT LAUNCH PRIORITY",
        "FOUNDER EXTENSION",
        "ORIGINAL 103 SEED",
        "BACKLOG / NON-LAUNCH",
        "launch30_founder_calibration.reviewed.v0.1.json",
        "santiago_founder_calibration.reviewed.v0.1.json",
        "launchCalibrationComplete",
        "fullInventoryCalibrationComplete",
        "Relative — Launch30",
        "Relative — All Santiago",
        "Detailed rationale not yet generated for this non-launch node.",
        "Save Draft",
        "Approve POI",
        "Export Launch30",
        "Export Full Inventory",
        "__CW_FOUNDER_COCKPIT__",
    ]
    for s in markers:
        if s not in html:
            fail(errors, f"missing marker: {s}")
    if "Approve All" in html:
        fail(errors, "Approve All must not exist")
    if "EDITORIAL_CALIBRATION_CURATOR_APPROVED=true" in html:
        fail(errors, "must not set curator-approved true")

    for line in [
        "PHYSICAL_LAYER_V0_1_READY = true",
        "PHYSICAL_ROUTE_GENERATION_ENABLED = false",
        "NODE_UTILITY_V0_1_READY = true",
        "EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY = true",
        "EDITORIAL_CALIBRATION_CURATOR_APPROVED = false",
    ]:
        if line not in flags:
            fail(errors, f"flag drift: {line}")

    for rel in PHYSICAL + [FROZEN_REL]:
        proc = subprocess.run(
            ["git", "diff", "--quiet", START, "--", rel],
            cwd=ROOT,
            check=False,
        )
        if proc.returncode != 0:
            fail(errors, f"immutable artifact changed since start: {rel}")

    if "NarrativeEdgeScore" in html or "optimizeItinerary" in html:
        fail(errors, "must not start Gate 2B / route composition")

    for f in [COCKPIT, GEN, BUILDER, RATIONALES]:
        text = f.read_text(encoding="utf-8", errors="ignore")
        if "pk.ey" in text or re.search(r"MAPBOX_ACCESS_TOKEN=[^\n\"']+", text):
            fail(errors, f"secret in {f.relative_to(ROOT)}")

    if errors:
        print("GATE_2A1R_UI2_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("GATE_2A1R_UI2_VALIDATOR=PASS")
    print(
        json.dumps(
            {
                "all": 105,
                "launch30": 30,
                "nonLaunch": 75,
                "originalSeed": 103,
                "founderExtensions": 2,
                "rationaleRecords": len(rationales["records"]),
                "rationaleFields": structured_fields,
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
