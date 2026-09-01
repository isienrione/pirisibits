#!/usr/bin/env python3
"""Gate 2A.1R-ADD-01R — Bolsa + STGO_33 restore validator."""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
START = "1b0ef938e681eedcd95d57f449a411e4b972d2b0"
SOURCE = ROOT / "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json"
EXTENSIONS = ROOT / "src/data/santiago/source/santiago_founder_extensions.v0.1.json"
IDENTITY = ROOT / "src/data/santiago/curation/santiago_founder_identity_corrections.v0.1.json"
SEMANTIC = ROOT / "src/data/santiago/santiago_semantic_calibration.v0.1.json"
LAUNCH = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
CORPUS = ROOT / "src/data/santiago/santiago_launch_corpus.v0.1.json"
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
MEMBERSHIP = ROOT / "src/data/santiago/santiago_launch_runtime_membership.v0.1.json"
RATIONALES = ROOT / "src/data/santiago/curation/launch30_score_rationales.v0.1.json"
COCKPIT = ROOT / "docs/engine/gate-2a1-founder-calibration-cockpit.html"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"

PHYSICAL = [
    "src/data/santiago/santiago_physical_edges.v0.1.json",
    "src/data/santiago/santiago_pedestrian_adjacency.v0.2.json",
    "src/data/santiago/santiago_multimodal_graph.v0.3.json",
    "src/data/santiago/santiago_physical_graph_manifest.v0.1.json",
    "src/data/santiago/santiago_physical_edges_stgo05_extension.v0.1.json",
]

ACTIVE_EXPECTED = [
    "STGO_01", "STGO_02", "STGO_03", "STGO_04", "STGO_05", "STGO_06", "STGO_07",
    "STGO_10", "STGO_11", "STGO_16", "STGO_18", "STGO_19", "STGO_20", "STGO_21",
    "STGO_22", "STGO_24", "STGO_25", "STGO_26", "STGO_27", "STGO_28", "STGO_29",
    "STGO_30", "STGO_32", "STGO_33", "STGO_34", "STGO_35", "STGO_48", "STGO_91",
    "STGO_92", "STGO_104",
]


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def main() -> int:
    errors: list[str] = []
    for p in (SOURCE, EXTENSIONS, IDENTITY, SEMANTIC, LAUNCH, CORPUS, ENGINE, MEMBERSHIP, RATIONALES, COCKPIT, FLAGS):
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")
    if errors:
        print("GATE_2A1R_ADD_01R_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    if len(source.get("nodes") or []) != 103:
        fail(errors, "frozen seed != 103")
    # byte identity vs start
    proc = subprocess.run(["git", "diff", "--quiet", START, "--", str(SOURCE.relative_to(ROOT))], cwd=ROOT)
    if proc.returncode != 0:
        fail(errors, "frozen 103-node source mutated")

    for rel in PHYSICAL:
        proc = subprocess.run(["git", "diff", "--quiet", START, "--", rel], cwd=ROOT)
        if proc.returncode != 0:
            fail(errors, f"physical frozen artifact changed: {rel}")

    ext = json.loads(EXTENSIONS.read_text(encoding="utf-8"))
    if ext.get("baseSeedCount") != 103 or ext.get("extensionCount") != 1 or ext.get("currentCanonicalInventory") != 104:
        fail(errors, "extensions inventory counts wrong")
    if len(ext.get("extensions") or []) != 1 or ext["extensions"][0]["stgoId"] != "STGO_104":
        fail(errors, "STGO_104 extension missing/duplicated")

    e104 = ext["extensions"][0]
    poi = e104["poiCoordinate"]
    exp = e104["experiencePoint"]
    if poi["lat"] != -33.4423866 or poi["lng"] != -70.6517565:
        fail(errors, "STGO_104 poi coordinate mismatch")
    if exp["lat"] != -33.4421764 or exp["lng"] != -70.6517853:
        fail(errors, "STGO_104 experience coordinate mismatch")
    if exp.get("headingDegrees") != 155.14:
        fail(errors, "STGO_104 heading mismatch")
    if e104.get("entranceCoordinate") is not None or e104.get("entranceStatus") != "UNKNOWN":
        fail(errors, "STGO_104 entrance must remain UNKNOWN")

    corr = json.loads(IDENTITY.read_text(encoding="utf-8"))
    c33 = (corr.get("corrections") or [None])[0]
    if not c33 or c33.get("stgoId") != "STGO_33":
        fail(errors, "STGO_33 identity correction missing")
    if "Funicular" in (c33.get("newName") or ""):
        fail(errors, "STGO_33 newName still contains Funicular")

    sem = json.loads(SEMANTIC.read_text(encoding="utf-8"))
    if sem.get("recordCount") != 104 or len(sem.get("records") or []) != 104:
        fail(errors, "semantic inventory != 104")
    ids = [r["stgoId"] for r in sem["records"]]
    if ids.count("STGO_104") != 1 or ids.count("STGO_33") != 1:
        fail(errors, "STGO_33/104 must exist exactly once in semantic")

    s33 = next(r for r in sem["records"] if r["stgoId"] == "STGO_33")
    s104 = next(r for r in sem["records"] if r["stgoId"] == "STGO_104")
    s23 = next(r for r in sem["records"] if r["stgoId"] == "STGO_23")
    if "Funicular" in (s33.get("displayName") or "") or "Funicular" in (s33.get("canonicalName") or ""):
        fail(errors, "active STGO_33 name contains Funicular")
    if s33.get("thematicVector", {}).get("T6") != 0.9:
        fail(errors, "STGO_33 source calibration not preserved")
    if s33.get("launchRuntimeDisposition") != "ACTIVE_LAUNCH":
        fail(errors, "STGO_33 not ACTIVE_LAUNCH")
    if s23.get("launchCorpus") is not False:
        fail(errors, "STGO_23 must leave active launch corpus")
    for t, v in (s104.get("thematicVector") or {}).items():
        if v is not None:
            fail(errors, f"STGO_104 {t} must be UNKNOWN/null not {v}")
    for m, v in (s104.get("structuralMetrics") or {}).items():
        if v is not None:
            fail(errors, f"STGO_104 {m} must be UNKNOWN/null not {v}")
    if (s104.get("chronoWorth") or {}).get("status") != "UNAVAILABLE":
        fail(errors, "STGO_104 ChronoWorth must be UNAVAILABLE")

    launch = json.loads(LAUNCH.read_text(encoding="utf-8"))
    lids = [r["stgoId"] for r in launch["records"]]
    if len(lids) != 30:
        fail(errors, "launch count != 30")
    if sorted(lids, key=lambda s: int(s.split("_")[1])) != ACTIVE_EXPECTED:
        fail(errors, f"active launch ID list mismatch: {lids}")
    if "STGO_23" in lids:
        fail(errors, "STGO_23 must not be in active launch")
    if "STGO_104" not in lids or "STGO_33" not in lids:
        fail(errors, "STGO_33/104 must be in active launch")

    eng = json.loads(ENGINE.read_text(encoding="utf-8"))
    if eng.get("nodeCount") != 104 or len(eng.get("nodes") or []) != 104:
        fail(errors, "engine inventory != 104")
    if eng.get("launchCorpusCount") != 30:
        fail(errors, "engine launchCorpusCount != 30")
    if eng.get("physicalRouteGenerationEnabled") is not False:
        fail(errors, "routing must remain disabled")

    mem = json.loads(MEMBERSHIP.read_text(encoding="utf-8"))
    if "STGO_33" in (mem.get("runtimeExcludedIds") or []):
        fail(errors, "STGO_33 still runtime-excluded")
    if set(mem.get("runtimeExcludedIds") or []) != {"STGO_23"}:
        fail(errors, "runtimeExcludedIds must be exactly STGO_23")

    rats = json.loads(RATIONALES.read_text(encoding="utf-8"))
    if len(rats.get("records") or []) != 30:
        fail(errors, "rationale records != 30")
    r33 = next(r for r in rats["records"] if r["stgoId"] == "STGO_33")
    r104 = next(r for r in rats["records"] if r["stgoId"] == "STGO_104")
    if "Funicular" in r33["displayName"]:
        fail(errors, "rationale still uses Funicular name")
    if "No prior calibrated score exists" not in r104["fields"][0]["whyThisScore"]:
        fail(errors, "STGO_104 fake source rationale not allowed")

    html = COCKPIT.read_text(encoding="utf-8")
    if "STGO_104" not in html or "STGO_33" not in html:
        fail(errors, "cockpit missing STGO_33/104")
    if "NEW FOUNDER NODE" not in html or "FOUNDER SEMANTIC CORRECTION" not in html:
        fail(errors, "cockpit missing founder badges")
    if html.count('"stgoId": "STGO_') < 30 and '"stgoId":"STGO_' not in html.replace(" ", ""):
        # embedded JSON uses spaces
        pass
    m = re.search(r"const SOURCE = (\{.*?\});\nconst RATIONALES", html, re.S)
    if not m:
        fail(errors, "cockpit SOURCE embed missing")
    else:
        source_emb = json.loads(m.group(1))
        if len(source_emb.get("records") or []) != 30:
            fail(errors, "cockpit count != 30")
        emb_ids = [r["stgoId"] for r in source_emb["records"]]
        if "STGO_23" in emb_ids or "STGO_104" not in emb_ids or "STGO_33" not in emb_ids:
            fail(errors, "cockpit active set wrong")
        if source_emb.get("normalizationCorpus") != "SANTIAGO_LAUNCH30_V0_1":
            # may be on SOURCE payload
            if "SANTIAGO_LAUNCH30_V0_1" not in html:
                fail(errors, "normalization corpus missing")

    flags = FLAGS.read_text(encoding="utf-8")
    for line in [
        "PHYSICAL_ROUTE_GENERATION_ENABLED = false",
        "EDITORIAL_CALIBRATION_CURATOR_APPROVED = false",
        "EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY = true",
    ]:
        if line not in flags:
            fail(errors, f"flag drift: {line}")
    if "NarrativeEdgeScore" in html or "optimizeItinerary" in html:
        fail(errors, "Gate 2B started")

    for f in [COCKPIT, EXTENSIONS, IDENTITY, LAUNCH]:
        t = f.read_text(encoding="utf-8", errors="ignore")
        if "pk.ey" in t or re.search(r"MAPBOX_" + r"ACCESS_TOKEN=[^\n\"']+", t):
            fail(errors, f"secret in {f.relative_to(ROOT)}")

    if errors:
        print("GATE_2A1R_ADD_01R_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("GATE_2A1R_ADD_01R_VALIDATOR=PASS")
    print(
        json.dumps(
            {
                "frozenSeed": 103,
                "extensions": 1,
                "inventory": 104,
                "activeLaunch": ACTIVE_EXPECTED,
                "sourceSha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
