#!/usr/bin/env python3
"""
Gate 2A.1R — Restore founder Santiago semantic calibration from
src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json

Canonical priority:
  CURATOR_APPROVED > FOUNDER_PRECALIBRATED > AI_PROPOSED > DERIVED > UNKNOWN

No src/data/pois.ts. No binary→0.7 where founder source exists.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json"
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
PREV_LAUNCH = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
OUT_SEMANTIC = ROOT / "src/data/santiago/santiago_semantic_calibration.v0.1.json"
OUT_LAUNCH = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
AUDIT = ROOT / "docs/engine/gate-2a1r-source-restoration.json"

THEME_CODES = ["T1A", "T1B", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9"]
THEME_LOWER = [c.lower() for c in THEME_CODES]
METRICS = ["anchor_density", "heritage_depth", "micro_reveal", "polish"]
FLAG_KEYS = [
    "daylight_only",
    "step_free",
    "curbside_hub",
    "exclude_for_m5",
    "is_sensitive_memory",
]
TAG_THRESHOLD = 0.45
TIERS = {"canonical_anchor", "thematic_pocket", "micro_reveal"}


def fail(msg: str) -> None:
    raise SystemExit(f"SOURCE_VALIDATION_FAIL: {msg}")


def validate_source(raw: dict) -> list[dict]:
    if raw.get("schema_version") != "SANTIAGO_ENGINE_DATASET_V0.1":
        fail(f"unexpected schema_version {raw.get('schema_version')}")
    nodes = raw.get("nodes")
    if not isinstance(nodes, list) or len(nodes) != 103:
        fail(f"expected 103 nodes, got {0 if not nodes else len(nodes)}")
    if int(raw.get("source_node_count") or 0) != 103:
        fail("source_node_count != 103")
    ids = []
    for n in nodes:
        pid = n.get("poi_id")
        if not isinstance(pid, str) or not pid.startswith("STGO_"):
            fail(f"bad poi_id {pid}")
        ids.append(pid)
        if n.get("tier") not in TIERS:
            fail(f"{pid}: bad tier {n.get('tier')}")
        sc = n.get("source_calibration") or {}
        sm = sc.get("structural_metrics") or {}
        vec = sc.get("vectors") or {}
        flags = sc.get("flags") or {}
        for m in METRICS:
            if m not in sm or not isinstance(sm[m], (int, float)):
                fail(f"{pid}: missing metric {m}")
            if not (0.0 <= float(sm[m]) <= 1.0):
                fail(f"{pid}: metric {m} out of range")
        for t in THEME_LOWER:
            if t not in vec or not isinstance(vec[t], (int, float)):
                fail(f"{pid}: missing vector {t}")
            if not (0.0 <= float(vec[t]) <= 1.0):
                fail(f"{pid}: vector {t} out of range")
        if not isinstance(flags, dict):
            fail(f"{pid}: flags missing")
        prov = n.get("provenance") or {}
        if not prov.get("source_fields_are_frozen_input"):
            fail(f"{pid}: provenance must mark source fields frozen")
        if not prov.get("derived_fields_are_ai_proposals"):
            fail(f"{pid}: provenance must mark derived fields as AI proposals")
    if len(set(ids)) != 103:
        fail("duplicate poi_id")
    expected = {f"STGO_{i:02d}" for i in range(1, 104)}
    if set(ids) != expected:
        fail(f"poi_id set mismatch missing={sorted(expected-set(ids))[:5]}")
    return nodes


def named_vector(vec: dict) -> dict[str, float]:
    return {code: float(vec[code.lower()]) for code in THEME_CODES}


def derive_tags(vector: dict[str, float]) -> list[str]:
    return [c for c in THEME_CODES if vector[c] >= TAG_THRESHOLD]


def chrono_worth(sm: dict) -> dict:
    heritage = float(sm["heritage_depth"])
    anchor = float(sm["anchor_density"])
    micro = float(sm["micro_reveal"])
    polish = float(sm["polish"])
    raw = 100.0 * (0.35 * heritage + 0.30 * anchor + 0.20 * micro + 0.15 * polish)
    value = int(round(max(0.0, min(100.0, raw))))
    return {
        "proposed": value,
        "approved": None,
        "effective": value,
        "provenance": "AI_PROPOSED_UNVERIFIED",
        "formula": "100*(0.35*heritage_depth + 0.30*anchor_density + 0.20*micro_reveal + 0.15*polish)",
        "contributions": {
            "heritage_depth": heritage,
            "anchor_density": anchor,
            "micro_reveal": micro,
            "polish": polish,
            "weights": {"heritage": 0.35, "anchor": 0.30, "micro": 0.20, "polish": 0.15},
        },
        "note": "Recomputed from FOUNDER_PRECALIBRATED structural_metrics; source ai_proposals.chronoworth is QA-only",
    }


def normalize_flags(sc: dict) -> dict:
    flags = sc.get("flags") or {}
    present = set(sc.get("source_present_flag_keys") or [])
    out = {}
    for key in FLAG_KEYS:
        if key in present:
            out[key] = {
                "value": bool(flags.get(key)),
                "status": "PRESENT",
                "provenance": "FOUNDER_PRECALIBRATED",
            }
        else:
            # Do not coerce absence → false
            out[key] = {
                "value": None,
                "status": "UNKNOWN",
                "provenance": "UNKNOWN_ABSENT_FROM_SOURCE_PRESENT_FLAG_KEYS",
                "sourceDictValueIgnored": flags.get(key),
            }
    return out


def propose_modes(sm: dict, flags: dict, visit_typical: int, vector: dict) -> dict:
    m1 = max(0.0, min(1.0, 1.2 - visit_typical / 35.0))
    step = flags["step_free"]
    if step["status"] == "PRESENT" and step["value"] is True:
        m2 = {"value": 0.85, "status": "KNOWN_STEP_FREE", "provenance": "FOUNDER_PRECALIBRATED:step_free"}
    elif step["status"] == "PRESENT" and step["value"] is False:
        m2 = {"value": 0.15, "status": "KNOWN_NOT_STEP_FREE", "provenance": "FOUNDER_PRECALIBRATED:step_free"}
    else:
        m2 = {"value": None, "status": "UNKNOWN", "provenance": "UNKNOWN_NOT_INFERRED"}

    m3 = 0.55
    if sm["anchor_density"] >= 0.7:
        m3 = 0.65
    if flags["is_sensitive_memory"]["value"] is True:
        m3 = 0.35

    daylight = flags["daylight_only"]
    if daylight["status"] == "PRESENT" and daylight["value"] is True:
        m4 = {"value": 0.1, "status": "DAYLIGHT_ONLY", "provenance": "FOUNDER_PRECALIBRATED:daylight_only"}
    else:
        m4 = {"value": 0.45, "status": "HOURS_REQUIRED_UNKNOWN", "provenance": "AI_PROPOSED_UNVERIFIED"}

    polish = float(sm["polish"])
    m5 = max(0.0, min(1.0, 0.35 + 0.55 * polish))
    excl = flags["exclude_for_m5"]
    if excl["status"] == "PRESENT" and excl["value"] is True:
        m5 = max(0.0, m5 - 0.35)
    if step["status"] == "PRESENT" and step["value"] is False:
        m5 = max(0.0, m5 - 0.2)

    return {
        "M1": {"value": round(m1, 3), "provenance": "AI_PROPOSED_FROM_VISIT_TIME"},
        "M2": m2,
        "M3": {"value": round(m3, 3), "provenance": "AI_PROPOSED_ROLE_HEURISTIC"},
        "M4": m4,
        "M5": {"value": round(m5, 3), "provenance": "AI_PROPOSED_FROM_POLISH_AND_FLAGS"},
    }


def operational(flags: dict) -> dict:
    daylight = flags["daylight_only"]
    if daylight["status"] == "PRESENT" and daylight["value"] is True:
        return {
            "classification": "DAYLIGHT_ONLY",
            "daylightOnly": True,
            "provenance": "FOUNDER_PRECALIBRATED",
        }
    if daylight["status"] == "PRESENT":
        return {
            "classification": "HOURS_REQUIRED_UNKNOWN",
            "daylightOnly": False,
            "provenance": "FOUNDER_PRECALIBRATED:daylight_only=false",
        }
    return {
        "classification": "HOURS_REQUIRED_UNKNOWN",
        "daylightOnly": None,
        "provenance": "UNKNOWN",
    }


def accessibility(flags: dict) -> dict:
    step = flags["step_free"]
    if step["status"] == "PRESENT" and step["value"] is True:
        return {"status": "KNOWN_STEP_FREE", "provenance": "FOUNDER_PRECALIBRATED:step_free"}
    if step["status"] == "PRESENT" and step["value"] is False:
        return {"status": "KNOWN_NOT_STEP_FREE", "provenance": "FOUNDER_PRECALIBRATED:step_free"}
    return {"status": "UNKNOWN", "provenance": "UNKNOWN"}


def sensitive_block(flags: dict) -> dict:
    sens = flags["is_sensitive_memory"]
    if sens["status"] == "PRESENT":
        return {
            "value": bool(sens["value"]),
            "status": "PRESENT",
            "provenance": "FOUNDER_PRECALIBRATED",
            "note": "Explicit flag only; not inferred from T1B",
        }
    return {
        "value": None,
        "status": "UNKNOWN",
        "provenance": "UNKNOWN_ABSENT_FROM_SOURCE_PRESENT_FLAG_KEYS",
        "note": "Absence is not false; eligibility treats only PRESENT+true as explicit sensitive",
    }


def default_visit(tier: str) -> dict:
    by_tier = {
        "canonical_anchor": (12, 18, 28),
        "thematic_pocket": (10, 15, 25),
        "micro_reveal": (6, 10, 16),
    }
    vmin, typical, vmax = by_tier.get(tier, (8, 12, 20))
    return {
        "min": vmin,
        "typical": typical,
        "max": vmax,
        "unit": "minutes",
        "includesTravelTime": False,
        "approved": None,
        "provenance": "AI_PROPOSED_UNVERIFIED_FROM_TIER_HEURISTIC",
        "source": "tier heuristic (no pois.ts)",
    }


def main() -> int:
    raw = json.loads(SOURCE.read_text(encoding="utf-8"))
    nodes = validate_source(raw)
    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    launch_ids = {n["stgoId"] for n in engine["nodes"] if n.get("launchCorpus")}
    engine_by_id = {n["stgoId"]: n for n in engine["nodes"]}

    prev_visits: dict[str, dict] = {}
    if PREV_LAUNCH.exists():
        prev = json.loads(PREV_LAUNCH.read_text(encoding="utf-8"))
        for r in prev.get("records") or []:
            # Preserve prior AI visit proposals (not pois-dependent at runtime)
            vt = r.get("visitTime") or {}
            if vt.get("typical") is not None:
                prev_visits[r["stgoId"]] = {
                    "min": vt["min"],
                    "typical": vt["typical"],
                    "max": vt["max"],
                    "unit": "minutes",
                    "includesTravelTime": False,
                    "approved": None,
                    "provenance": "AI_PROPOSED_UNVERIFIED_PRESERVED_FROM_GATE_2A1",
                    "source": "prior Gate 2A.1 AI proposal (not founder seed)",
                }

    semantic_records = []
    launch_records = []
    sensitive_list = []

    for n in sorted(nodes, key=lambda x: x["poi_id"]):
        sid = n["poi_id"]
        sc = n["source_calibration"]
        sm = {k: float(sc["structural_metrics"][k]) for k in METRICS}
        vector = named_vector(sc["vectors"])
        flags = normalize_flags(sc)
        tags = derive_tags(vector)
        cw = chrono_worth(sm)
        visit = prev_visits.get(sid) or default_visit(n["tier"])
        modes = propose_modes(sm, flags, int(visit["typical"]), vector)
        sens = sensitive_block(flags)
        if sens["status"] == "PRESENT" and sens["value"] is True:
            sensitive_list.append({"stgoId": sid, "name": n["name"]})

        eng = engine_by_id.get(sid) or {}
        base = {
            "stgoId": sid,
            "displayName": n["name"],
            "commune": n.get("commune"),
            "islandId": n.get("island_id"),
            "tier": n["tier"],
            "tierProvenance": "FOUNDER_PRECALIBRATED",
            "editorialRole": eng.get("editorialRole"),
            "thematicVector": vector,
            "thematicVectorProvenance": "FOUNDER_PRECALIBRATED",
            "structuralMetrics": sm,
            "structuralMetricsProvenance": "FOUNDER_PRECALIBRATED",
            "flags": flags,
            "derivedThemeTags": tags,
            "themeTagThreshold": TAG_THRESHOLD,
            "chronoWorth": cw,
            "visitTime": visit,
            "structuralSuitability": modes,
            "sensitiveMemory": sens,
            "accessibility": accessibility(flags),
            "operational": operational(flags),
            "sourceProvenance": {
                "priority": "FOUNDER_PRECALIBRATED",
                "dataset": "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json",
                "schemaVersion": raw.get("schema_version"),
                "source": (n.get("provenance") or {}).get("source"),
                "source_fields_are_frozen_input": True,
                "derived_fields_are_ai_proposals": True,
                "source_present_flag_keys": list(sc.get("source_present_flag_keys") or []),
            },
            "launchCorpus": sid in launch_ids,
            "launchRuntimeDisposition": eng.get("launchRuntimeDisposition"),
            "physicalRouteGenerationEligible": eng.get("physicalRouteGenerationEligible"),
            "qaCompare": {
                "sourceAiChronoWorth01": (n.get("ai_proposals") or {}).get("chronoworth"),
                "recomputedChronoWorth0_100": cw["proposed"],
            },
        }
        semantic_records.append(base)
        if sid in launch_ids:
            launch_records.append(
                {
                    **base,
                    "legacySlug": eng.get("legacySlug"),
                    "demoPoiIdMatched": None,
                    "sources": [
                        {
                            "type": "FOUNDER_PRECALIBRATED",
                            "dataset": "SANTIAGO_ENGINE_DATASET_V0.1.json",
                            "note": "Canonical continuous vectors + structural metrics + tier + flags",
                        }
                    ],
                }
            )

    assert len(semantic_records) == 103
    assert len(launch_records) == 30

    semantic_payload = {
        "schemaVersion": "santiago-semantic-calibration.v0.1",
        "gate": "2A.1R",
        "status": "FOUNDER_PRECALIBRATED_SEED_WITH_AI_PROPOSALS",
        "curatorApproved": False,
        "canonicalTaxonomy": THEME_CODES,
        "sourceDataset": "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json",
        "recordCount": 103,
        "provenancePriority": [
            "CURATOR_APPROVED",
            "FOUNDER_PRECALIBRATED",
            "AI_PROPOSED_UNVERIFIED",
            "DERIVED_CONVENIENCE",
            "UNKNOWN",
        ],
        "notes": [
            "thematicVector and structuralMetrics are FOUNDER_PRECALIBRATED.",
            "ChronoWorth and visitTime are AI_PROPOSED_UNVERIFIED.",
            "derivedThemeTags are DERIVED_CONVENIENCE (threshold 0.45).",
            "Flag absence (not in source_present_flag_keys) is UNKNOWN, not false.",
            "No src/data/pois.ts dependency. No binary→0.7 canonical fallback.",
        ],
        "chronoWorthFormula": {
            "expression": "100*(0.35*heritage_depth + 0.30*anchor_density + 0.20*micro_reveal + 0.15*polish)",
            "inputs": "FOUNDER_PRECALIBRATED structural_metrics",
            "forbiddenInputs": [
                "physicalCentrality",
                "edgeDegree",
                "metroProximity",
                "googlePopularity",
                "mapboxRelevance",
                "travelerInterests",
                "pois.ts",
                "binaryThemeExpansion",
            ],
        },
        "sensitiveMemorySourceList": sensitive_list,
        "records": semantic_records,
    }

    launch_payload = {
        "schemaVersion": "santiago-launch30-editorial-calibration.proposed.v0.1",
        "gate": "2A.1R",
        "status": "FOUNDER_SEED_PLUS_AI_PROPOSED_UNVERIFIED",
        "curatorApproved": False,
        "canonicalTaxonomy": THEME_CODES,
        "sourceDataset": "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json",
        "canonicalSemanticArtifact": "src/data/santiago/santiago_semantic_calibration.v0.1.json",
        "notes": [
            "Themes / structural metrics / tier / explicit flags: FOUNDER_PRECALIBRATED.",
            "ChronoWorth / visitTime / most M-mode values: AI_PROPOSED_UNVERIFIED.",
            "M2 accessibility uses FOUNDER_PRECALIBRATED step_free when PRESENT.",
            "No binary→0.7. No pois.ts canonical dependency.",
        ],
        "chronoWorthFormula": semantic_payload["chronoWorthFormula"],
        "recordCount": 30,
        "demoNameMatches": 0,
        "founderVectorRestored": 30,
        "binarySyntheticReplaced": 30,
        "records": sorted(launch_records, key=lambda r: r["stgoId"]),
    }

    OUT_SEMANTIC.parent.mkdir(parents=True, exist_ok=True)
    OUT_SEMANTIC.write_text(json.dumps(semantic_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_LAUNCH.write_text(json.dumps(launch_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    audit = {
        "gate": "2A.1R",
        "verdict": "SOURCE_VALIDATED_AND_RESTORED",
        "sourcePath": str(SOURCE.relative_to(ROOT)),
        "sourceNodeCount": 103,
        "semanticArtifact": str(OUT_SEMANTIC.relative_to(ROOT)),
        "launchArtifact": str(OUT_LAUNCH.relative_to(ROOT)),
        "sensitiveMemorySourceList": sensitive_list,
        "t2StrongLaunch": [
            {"stgoId": r["stgoId"], "t2": r["thematicVector"]["T2"]}
            for r in launch_records
            if r["thematicVector"]["T2"] >= 0.45
        ],
        "poisTsCanonicalDependency": 0,
        "binary07CanonicalFallback": 0,
    }
    AUDIT.write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    print("SOURCE_VALIDATION=PASS")
    print("Wrote", OUT_SEMANTIC.relative_to(ROOT))
    print("Wrote", OUT_LAUNCH.relative_to(ROOT))
    print("sensitive", [s["stgoId"] for s in sensitive_list])
    print("launch T2 strong", [x["stgoId"] for x in audit["t2StrongLaunch"]])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
