#!/usr/bin/env python3
"""Gate 2B — Provisional Santiago Launch30 narrative graph validator."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GRAPH = ROOT / "src/data/santiago/narrative/santiago_launch30_narrative_graph.proposed.v0.1.json"
CORPUS = ROOT / "src/data/santiago/santiago_launch_corpus.v0.1.json"
LAUNCH = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"
REPORT = ROOT / "docs/engine/GATE_2B_NARRATIVE_GRAPH_V0_1.md"
START = "2aef38789f095929b5ae189075a924069cff9576"
ENGINE_NARR = ROOT / "src/engine/narrative"

PHYSICAL = [
    "src/data/santiago/santiago_physical_edges.v0.1.json",
    "src/data/santiago/santiago_pedestrian_adjacency.v0.2.json",
    "src/data/santiago/santiago_multimodal_graph.v0.3.json",
    "src/data/santiago/santiago_physical_graph_manifest.v0.1.json",
    "src/data/santiago/santiago_physical_edges_stgo05_extension.v0.1.json",
]
FROZEN = "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json"
EXTENSION = "src/data/santiago/source/santiago_founder_extensions.v0.1.json"


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def main() -> int:
    errors: list[str] = []
    for p in (GRAPH, CORPUS, LAUNCH, FLAGS, REPORT, ENGINE_NARR):
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")
    if errors:
        print("GATE_2B_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    graph = json.loads(GRAPH.read_text(encoding="utf-8"))
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    launch = json.loads(LAUNCH.read_text(encoding="utf-8"))
    flags = FLAGS.read_text(encoding="utf-8")
    launch_ids = set(corpus.get("ids") or corpus.get("stgoIds") or [])

    if graph.get("gate") != "2B":
        fail(errors, "gate must be 2B")
    if graph.get("calibrationStatus") != "PROVISIONAL":
        fail(errors, "calibrationStatus must be PROVISIONAL")
    if graph.get("calibrationApproved") is not False:
        fail(errors, "calibrationApproved must be false")
    if graph.get("engineUsingProvisionalEditorialCalibration") is not True:
        fail(errors, "engineUsingProvisionalEditorialCalibration must be true")
    if graph.get("physicalRouteGenerationEnabled") is not False:
        fail(errors, "physicalRouteGenerationEnabled must be false")
    if graph.get("sourceCheckpointSha") != START:
        fail(errors, "sourceCheckpointSha mismatch")

    if len(launch_ids) != 30 or len(launch.get("records") or []) != 30:
        fail(errors, "Launch30 membership drift")
    if "STGO_23" in launch_ids:
        fail(errors, "STGO_23 must not be in Launch30")
    if "STGO_33" not in launch_ids or "STGO_104" not in launch_ids:
        fail(errors, "STGO_33 and STGO_104 required in Launch30")

    nodes = graph.get("nodes") or []
    edges = graph.get("edges") or []
    if graph.get("nodeCount") != 30 or len(nodes) != 30:
        fail(errors, f"nodeCount want 30 got {graph.get('nodeCount')}/{len(nodes)}")
    node_ids = [n["stgoId"] for n in nodes]
    if set(node_ids) != launch_ids:
        fail(errors, "narrative nodes != launch corpus ids")
    if len(node_ids) != len(set(node_ids)):
        fail(errors, "duplicate narrative nodes")

    n33 = next(n for n in nodes if n["stgoId"] == "STGO_33")
    n104 = next(n for n in nodes if n["stgoId"] == "STGO_104")
    if "Funicular" in n33.get("displayName", ""):
        fail(errors, "STGO_33 active name must not include Funicular")
    if "Gárgola" not in n33.get("displayName", ""):
        fail(errors, "STGO_33 must keep Gárgola identity")
    if n104.get("thematicAvailability") != "UNKNOWN":
        fail(errors, "STGO_104 thematicAvailability must be UNKNOWN")
    if n104.get("physicalStatus") != "PHYSICAL_PENDING_EDGE_ENRICHMENT":
        fail(errors, "STGO_104 physical status drift")

    if not edges:
        fail(errors, "expected narrative edges")
    runtime = [e for e in edges if e.get("runtimeEligible")]
    pending = [e for e in edges if e.get("runtimeExclusionReason") == "NON_RUNTIME_PENDING_EDITORIAL_EVIDENCE"]
    if graph.get("runtimeEligibleEdgeCount") != len(runtime):
        fail(errors, "runtimeEligibleEdgeCount mismatch")
    if not runtime:
        fail(errors, "expected runtime-eligible edges")
    if not pending:
        fail(errors, "expected non-runtime pending-evidence causal edges")

    for e in runtime[:20]:
        exp = e.get("explainability") or {}
        for k in ("whyLinked", "whyThisRelationType", "positiveFactors", "negativeFactors", "confidence", "provenance", "scoreBreakdown"):
            if k not in exp:
                fail(errors, f"runtime edge missing explainability.{k}")
                break
        if e.get("narrativeDoesNotImplyPhysicalFeasibility") is not True:
            fail(errors, "narrativeDoesNotImplyPhysicalFeasibility must be true")

    e104 = [e for e in edges if e.get("from") == "STGO_104" or e.get("to") == "STGO_104"]
    if not e104:
        fail(errors, "STGO_104 must have identity/spatial narrative edges")
    for e in e104:
        lim = " ".join(e.get("semanticLimitations") or [])
        if "UNKNOWN" not in lim:
            fail(errors, "STGO_104 edges must declare UNKNOWN limitations")

    required_files = [
        "narrative-types.ts",
        "narrative-edge-score.ts",
        "arc-state.ts",
        "arc-signals.ts",
        "narrative-loader.ts",
        "narrative-constants.ts",
        "propose-narrative-edges.ts",
    ]
    for name in required_files:
        if not (ENGINE_NARR / name).exists():
            fail(errors, f"missing src/engine/narrative/{name}")

    for line in [
        "EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY = true",
        "EDITORIAL_CALIBRATION_CURATOR_APPROVED = false",
        "ENGINE_USING_PROVISIONAL_EDITORIAL_CALIBRATION = true",
        "PHYSICAL_ROUTE_GENERATION_ENABLED = false",
        "NARRATIVE_GRAPH_V0_1_PROPOSED_READY = true",
    ]:
        if line not in flags:
            fail(errors, f"flag drift: {line}")
    if "EDITORIAL_CALIBRATION_CURATOR_APPROVED = true" in flags:
        fail(errors, "curator-approved must remain false")

    score_src = (ENGINE_NARR / "narrative-edge-score.ts").read_text(encoding="utf-8")
    if re.search(r"openai|anthropic|fetch\(", score_src, re.I):
        fail(errors, "NarrativeEdgeScore must not call runtime LLMs")
    if "No runtime LLM" not in score_src:
        fail(errors, "NarrativeEdgeScore should document no runtime LLM")

    for rel in PHYSICAL + [FROZEN, EXTENSION]:
        proc = subprocess.run(["git", "diff", "--quiet", START, "--", rel], cwd=ROOT, check=False)
        if proc.returncode != 0:
            fail(errors, f"immutable artifact changed since start: {rel}")

    # Curator still present / 104 inventory
    cockpit = ROOT / "docs/engine/gate-2a1-founder-calibration-cockpit.html"
    if not cockpit.exists():
        fail(errors, "founder curator missing")
    html = cockpit.read_text(encoding="utf-8", errors="ignore")
    if "104" not in html and "All 104" not in html:
        fail(errors, "curator full inventory markers missing")

    for f in [GRAPH, REPORT, ENGINE_NARR / "narrative-edge-score.ts"]:
        text = f.read_text(encoding="utf-8", errors="ignore") if f.is_file() else ""
        if f.is_dir():
            continue
        if "pk.ey" in text or re.search(r"MAPBOX_ACCESS_TOKEN=[A-Za-z0-9._-]+", text):
            fail(errors, f"secret in {f.relative_to(ROOT)}")

    if "optimizeItinerary" in (ROOT / "src/engine/index.ts").read_text(encoding="utf-8"):
        fail(errors, "must not enable route composition API")

    if errors:
        print("GATE_2B_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    qa = graph.get("qa") or {}
    print("GATE_2B_VALIDATOR=PASS")
    print(
        json.dumps(
            {
                "nodes": 30,
                "edges": len(edges),
                "runtimeEligible": len(runtime),
                "pendingEvidence": len(pending),
                "avgOut": qa.get("averageOutgoingDegree"),
                "isolated": qa.get("isolatedNarrativeNodes"),
                "relationTypes": qa.get("relationTypeDistribution"),
                "confidence": qa.get("confidenceDistribution"),
                "provenance": qa.get("provenanceDistribution"),
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
