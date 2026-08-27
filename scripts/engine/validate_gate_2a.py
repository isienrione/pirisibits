#!/usr/bin/env python3
"""Gate 2A — node-utility / candidate-pool validator + launch data completeness audit."""

from __future__ import annotations

import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
MEMBERSHIP = ROOT / "src/data/santiago/santiago_launch_runtime_membership.v0.1.json"
MANIFEST = ROOT / "src/data/santiago/santiago_physical_graph_manifest.v0.1.json"
PROVIDER = ROOT / "src/data/santiago/santiago_physical_edges.v0.1.json"
FLAGS = ROOT / "src/lib/city-graph/flags.ts"
CONTRACT = ROOT / "docs/engine/ENGINE_V0_1_IMPLEMENTATION_CONTRACT.md"
AUDIT_OUT = ROOT / "docs/engine/gate-2a-data-completeness.json"
START_SHA = "a747c1112ccd96424af0de2126fc1ef27316fb8e"

PHYSICAL_PATHS = [
    "src/data/santiago/santiago_physical_edges.v0.1.json",
    "src/data/santiago/santiago_pedestrian_adjacency.v0.2.json",
    "src/data/santiago/santiago_multimodal_graph.v0.3.json",
    "src/data/santiago/santiago_physical_graph_manifest.v0.1.json",
    "src/data/santiago/santiago_physical_edges_stgo05_extension.v0.1.json",
    "src/data/santiago/santiago_launch_runtime_membership.v0.1.json",
]

THEME_CODES = {"T1A", "T1B", "T3", "T4", "T5", "T6", "T7", "T8", "T9"}


def fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def field_status(nodes: list[dict], pred) -> dict:
    complete = partial = missing = 0
    for n in nodes:
        s = pred(n)
        if s == "complete":
            complete += 1
        elif s == "partial":
            partial += 1
        else:
            missing += 1
    return {"complete": complete, "partial": partial, "missing": missing}


def main() -> int:
    errors: list[str] = []
    for p in (ENGINE, MEMBERSHIP, MANIFEST, PROVIDER, FLAGS, CONTRACT):
        if not p.exists():
            fail(errors, f"missing {p.relative_to(ROOT)}")
    if errors:
        print("GATE_2A_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    membership = json.loads(MEMBERSHIP.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    provider = json.loads(PROVIDER.read_text(encoding="utf-8"))
    flags = FLAGS.read_text(encoding="utf-8")

    if engine.get("nodeCount") != 103:
        fail(errors, "103 inventory broken")
    launch = [n for n in engine["nodes"] if n.get("launchCorpus")]
    backlog = [n for n in engine["nodes"] if not n.get("launchCorpus")]
    if len(launch) != 30 or len(backlog) != 73:
        fail(errors, "launch/backlog split broken")

    # Physical freeze immutability vs starting SHA
    for rel in PHYSICAL_PATHS:
        proc = subprocess.run(
            ["git", "diff", "--quiet", START_SHA, "--", rel],
            cwd=ROOT,
            check=False,
        )
        if proc.returncode != 0:
            fail(errors, f"physical artifact mutated since {START_SHA}: {rel}")

    if provider.get("counts", {}).get("runtimeWalkEdges") != 598:
        fail(errors, "provider runtime edges no longer 598")
    if manifest.get("featureFlags", {}).get("PHYSICAL_LAYER_V0_1_READY") is not True:
        fail(errors, "manifest PHYSICAL_LAYER_V0_1_READY not true")
    if manifest.get("featureFlags", {}).get("PHYSICAL_ROUTE_GENERATION_ENABLED") is not False:
        fail(errors, "manifest enables route generation")

    if "PHYSICAL_ROUTE_GENERATION_ENABLED = false" not in flags:
        fail(errors, "route generation not disabled")
    if "PHYSICAL_LAYER_V0_1_READY = true" not in flags:
        fail(errors, "PHYSICAL_LAYER_V0_1_READY not true")
    if "NODE_UTILITY_V0_1_READY = true" not in flags:
        fail(errors, "NODE_UTILITY_V0_1_READY not true")
    if "ROUTE_COMPOSER_READY = true" in flags:
        fail(errors, "ROUTE_COMPOSER_READY must not be true")

    # Taxonomy integrity on launch
    for n in launch:
        for t in n.get("themes") or []:
            if t not in THEME_CODES:
                fail(errors, f"{n['stgoId']}: illegal theme {t}")
            if t == "T2":
                fail(errors, f"{n['stgoId']}: culinary T2 must not appear without taxonomy decision")
        for m in n.get("modes") or []:
            if m not in {"M1", "M2", "M3", "M4", "M5"}:
                fail(errors, f"{n['stgoId']}: illegal mode {m}")

    if set(membership.get("runtimeExcludedIds") or []) != {"STGO_23", "STGO_33"}:
        fail(errors, "excluded membership drift")

    # Completeness audit (do not fill)
    audit = {
        "gate": "2A",
        "launchCount": 30,
        "fields": {
            "runtimePhysicalEligibility": field_status(
                launch,
                lambda n: "complete"
                if n.get("physicalRouteGenerationEligible") is True
                or str(n.get("launchRuntimeDisposition") or "").startswith("RUNTIME_EXCLUDED")
                else "missing",
            ),
            "chronoWorth": field_status(
                launch, lambda n: "complete" if n.get("chronoWorth") is not None else "missing"
            ),
            "themesT1A_T9": field_status(
                launch, lambda n: "complete" if n.get("themes") else "missing"
            ),
            "modesM1_M5": field_status(
                launch,
                lambda n: "complete"
                if len(n.get("modes") or []) >= 2
                else ("partial" if n.get("modes") else "missing"),
            ),
            "editorialRole": field_status(
                launch, lambda n: "complete" if n.get("editorialRole") else "missing"
            ),
            "essentialityProxy": field_status(
                launch,
                lambda n: "complete"
                if n.get("editorialRole") in {"anchor", "museum", "civic", "memory"}
                else ("partial" if n.get("editorialRole") else "missing"),
            ),
            "discoveryClassification": field_status(
                launch,
                lambda n: "partial"
                if n.get("editorialRole") in {"micro", "pocket", "anchor"}
                else ("complete" if n.get("editorialRole") else "missing"),
            ),
            "visitDuration": field_status(launch, lambda n: "missing"),
            "openingHours": field_status(launch, lambda n: "missing"),
            "accessibility": field_status(launch, lambda n: "missing"),
            "costBudget": field_status(launch, lambda n: "missing"),
            "provenance": field_status(
                launch, lambda n: "complete" if n.get("provenance") else "missing"
            ),
        },
        "themeHistogram": dict(Counter(t for n in launch for t in (n.get("themes") or []))),
        "modeHistogram": dict(Counter(m for n in launch for m in (n.get("modes") or []))),
        "roleHistogram": dict(Counter(n.get("editorialRole") or "null" for n in launch)),
        "deliberatelyNotFabricated": [
            "chronoWorth",
            "visitDuration",
            "openingHours",
            "accessibility",
            "culinary T2 tags",
            "NarrativeEdgeScore",
            "physical-centrality quality boost",
        ],
    }
    AUDIT_OUT.write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")

    # Secret scan on engine docs/source
    for p in [
        ROOT / "src/engine",
        ROOT / "docs/engine",
        ENGINE,
        MEMBERSHIP,
        MANIFEST,
    ]:
        if p.is_dir():
            files = list(p.rglob("*"))
        else:
            files = [p]
        for f in files:
            if not f.is_file():
                continue
            text = f.read_text(encoding="utf-8", errors="ignore")
            if "pk.ey" in text or "MAPBOX_ACCESS_TOKEN=" in text:
                fail(errors, f"secret material in {f.relative_to(ROOT)}")

    if errors:
        print("GATE_2A_VALIDATOR=FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print("GATE_2A_VALIDATOR=PASS")
    print("audit", json.dumps(audit["fields"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
