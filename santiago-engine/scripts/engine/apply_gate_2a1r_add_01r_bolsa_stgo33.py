#!/usr/bin/env python3
"""
Gate 2A.1R-ADD-01R — Add STGO_104 (Bolsa) + restore STGO_33.

Does NOT mutate frozen SANTIAGO_ENGINE_DATASET_V0.1.json (103-node seed).
Does NOT fabricate STGO_104 semantic scores (UNKNOWN, never coerced to 0).
Does NOT alter frozen physical edge/adjacency/multimodal artifacts.
Does NOT enable traveler routing.
"""

from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKPOINT = "1b0ef938e681eedcd95d57f449a411e4b972d2b0"

SOURCE_FROZEN = ROOT / "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json"
EXTENSIONS = ROOT / "src/data/santiago/source/santiago_founder_extensions.v0.1.json"
IDENTITY_CORR = ROOT / "src/data/santiago/curation/santiago_founder_identity_corrections.v0.1.json"
SEMANTIC = ROOT / "src/data/santiago/santiago_semantic_calibration.v0.1.json"
LAUNCH = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
CORPUS = ROOT / "src/data/santiago/santiago_launch_corpus.v0.1.json"
MEMBERSHIP = ROOT / "src/data/santiago/santiago_launch_runtime_membership.v0.1.json"
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
AUDIT = ROOT / "docs/engine/gate-2a1r-add-01r-bolsa-stgo33.json"

PHYSICAL_FROZEN = [
    "src/data/santiago/santiago_physical_edges.v0.1.json",
    "src/data/santiago/santiago_pedestrian_adjacency.v0.2.json",
    "src/data/santiago/santiago_multimodal_graph.v0.3.json",
    "src/data/santiago/santiago_physical_graph_manifest.v0.1.json",
    "src/data/santiago/santiago_physical_edges_stgo05_extension.v0.1.json",
]

OLD_33_NAME = "Kulczewski Funicular Gargoyle"
NEW_33_NAME = "Gárgola de Luciano K"
LEGACY_33_ALIAS = "Kulczewski Funicular Gargoyle"

THEMES = ["T1A", "T1B", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9"]
METRICS = ["anchor_density", "heritage_depth", "micro_reveal", "polish"]
MODES = ["M1", "M2", "M3", "M4", "M5"]
FLAG_KEYS = ["daylight_only", "step_free", "curbside_hub", "exclude_for_m5", "is_sensitive_memory"]

# Active launch/review corpus = prior Launch30 minus STGO_23 plus STGO_104
PRIOR_LAUNCH = [
    "STGO_01", "STGO_02", "STGO_03", "STGO_04", "STGO_05", "STGO_06", "STGO_07",
    "STGO_10", "STGO_11", "STGO_16", "STGO_18", "STGO_19", "STGO_20", "STGO_21",
    "STGO_22", "STGO_23", "STGO_24", "STGO_25", "STGO_26", "STGO_27", "STGO_28",
    "STGO_29", "STGO_32", "STGO_33", "STGO_34", "STGO_35", "STGO_48", "STGO_91",
    "STGO_92", "STGO_30",
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def unknown_flag(key: str) -> dict:
    return {
        "value": None,
        "status": "UNKNOWN",
        "provenance": "UNKNOWN_NO_FOUNDER_CALIBRATION_YET",
    }


def build_stgo_104_semantic() -> dict:
    return {
        "stgoId": "STGO_104",
        "displayName": "Edificio de la Bolsa de Comercio de Santiago",
        "shortName": "Bolsa de Comercio de Santiago",
        "canonicalName": "Edificio de la Bolsa de Comercio de Santiago",
        "commune": None,
        "islandId": None,
        "city": "Santiago",
        "country": "Chile",
        "tier": None,
        "tierProvenance": "UNKNOWN",
        "editorialRole": None,
        "thematicVector": {t: None for t in THEMES},
        "thematicVectorProvenance": "UNKNOWN",
        "structuralMetrics": {m: None for m in METRICS},
        "structuralMetricsProvenance": "UNKNOWN",
        "flags": {k: unknown_flag(k) for k in FLAG_KEYS},
        "derivedThemeTags": [],
        "themeTagThreshold": 0.45,
        "chronoWorth": {
            "proposed": None,
            "approved": None,
            "effective": None,
            "status": "UNAVAILABLE",
            "provenance": "UNAVAILABLE_UNTIL_FOUNDER_STRUCTURAL_METRICS",
            "formula": "100*(0.35*heritage_depth + 0.30*anchor_density + 0.20*micro_reveal + 0.15*polish)",
            "note": "ChronoWorth unavailable until founder supplies all four structural metrics. UNKNOWN must not become 0.",
        },
        "visitTime": {
            "min": None,
            "typical": None,
            "max": None,
            "unit": "minutes",
            "includesTravelTime": False,
            "approved": None,
            "provenance": "UNKNOWN",
            "source": "no AI proposal — founder-added node requires curation",
        },
        "structuralSuitability": {
            m: {
                "value": None,
                "status": "UNKNOWN",
                "provenance": "UNKNOWN",
            }
            for m in MODES
        },
        "sensitiveMemory": {
            "value": None,
            "status": "UNKNOWN",
            "provenance": "UNKNOWN",
            "note": "Absence is not false; no sensitive-memory claim invented for STGO_104.",
        },
        "accessibility": {
            "status": "UNKNOWN",
            "provenance": "UNKNOWN",
        },
        "operational": {
            "classification": "UNKNOWN",
            "daylightOnly": None,
            "openingHours": None,
            "provenance": "UNKNOWN",
        },
        "coordinates": {
            "poiCoordinate": {
                "lat": -33.4423866,
                "lng": -70.6517565,
                "provenance": "FOUNDER_SUPPLIED_GOOGLE_MAPS",
            },
            "experiencePoint": {
                "lat": -33.4421764,
                "lng": -70.6517853,
                "headingDegrees": 155.14,
                "provenance": "FOUNDER_SUPPLIED",
            },
            "entranceCoordinate": None,
            "entranceStatus": "UNKNOWN",
            "note": "poi_coordinate ≠ entrance/access ≠ experience_point; entrance not inferred.",
        },
        "sourceProvenance": {
            "priority": "FOUNDER_ADDED_POST_SEED",
            "dataset": "src/data/santiago/source/santiago_founder_extensions.v0.1.json",
            "baseSeedDataset": "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json",
            "schemaVersion": "santiago-founder-extensions.v0.1",
            "source": "Founder-added after frozen SANTIAGO_ENGINE_DATASET_V0.1 103-node seed.",
            "source_fields_are_frozen_input": False,
            "requiresFounderCalibrationBeforeApproval": True,
        },
        "launchCorpus": True,
        "launchRuntimeDisposition": "ACTIVE_LAUNCH",
        "physicalStatus": "PHYSICAL_PENDING_EDGE_ENRICHMENT",
        "physicalRouteGenerationEligible": False,
        "founderNodeBadges": [
            "NEW_FOUNDER_NODE",
            "NOT_IN_ORIGINAL_103_NODE_SEED",
        ],
        "qaCompare": None,
        "legacySlug": None,
        "demoPoiIdMatched": None,
        "sources": [
            "src/data/santiago/source/santiago_founder_extensions.v0.1.json"
        ],
    }


def build_extensions_doc(source_sha: str) -> dict:
    return {
        "schemaVersion": "santiago-founder-extensions.v0.1",
        "gate": "2A.1R-ADD-01R",
        "sourceCheckpointSha": CHECKPOINT,
        "baseSeedDataset": "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json",
        "baseSeedCount": 103,
        "baseSeedSha256": source_sha,
        "extensionCount": 1,
        "currentCanonicalInventory": 104,
        "notes": [
            "Extensions sit beside the frozen 103-node seed; the seed bytes must remain identical.",
            "STGO_104 semantics are UNKNOWN until founder calibration — never coerce UNKNOWN to 0.",
        ],
        "extensions": [
            {
                "stgoId": "STGO_104",
                "canonicalName": "Edificio de la Bolsa de Comercio de Santiago",
                "shortName": "Bolsa de Comercio de Santiago",
                "city": "Santiago",
                "country": "Chile",
                "provenance": "FOUNDER_ADDED_POST_SEED",
                "sourceNote": "Founder-added after frozen SANTIAGO_ENGINE_DATASET_V0.1 103-node seed.",
                "poiCoordinate": {
                    "lat": -33.4423866,
                    "lng": -70.6517565,
                    "provenance": "FOUNDER_SUPPLIED_GOOGLE_MAPS",
                },
                "experiencePoint": {
                    "lat": -33.4421764,
                    "lng": -70.6517853,
                    "headingDegrees": 155.14,
                    "provenance": "FOUNDER_SUPPLIED",
                },
                "entranceCoordinate": None,
                "entranceStatus": "UNKNOWN",
                "physicalStatus": "PHYSICAL_PENDING_EDGE_ENRICHMENT",
                "semanticStatus": "REQUIRES_FOUNDER_CALIBRATION",
                "launchMembership": "ACTIVE_LAUNCH",
            }
        ],
    }


def build_identity_corrections() -> dict:
    return {
        "schemaVersion": "santiago-founder-identity-corrections.v0.1",
        "gate": "2A.1R-ADD-01R",
        "sourceCheckpointSha": CHECKPOINT,
        "notes": [
            "STGO_33 remains a single canonical node from the frozen 103-node seed.",
            "Correction is naming/status — not a wholesale reset of founder semantic calibration.",
            "Luciano K / hotel association is contextual/fun-fact material, not an exclusion reason.",
        ],
        "corrections": [
            {
                "stgoId": "STGO_33",
                "oldName": OLD_33_NAME,
                "newName": NEW_33_NAME,
                "legacyAlias": {
                    "alias": LEGACY_33_ALIAS,
                    "status": "deprecated_alias",
                },
                "reason": (
                    "Founder clarification: the experience is valid; 'Funicular' was the misleading "
                    "element in the prior canonical name. Luciano K / hotel association is contextual "
                    "fun-fact content, not a reason to exclude the POI."
                ),
                "founderInstruction": (
                    "Restore STGO_33 to active launch. Rename away from Funicular. Preserve source "
                    "semantic calibration. Do not fabricate coordinates."
                ),
                "statusChange": {
                    "from": "RUNTIME_EXCLUDED_SEMANTIC",
                    "toLaunchEditorial": "ACTIVE_LAUNCH",
                    "toPhysical": "PHYSICAL_ELIGIBLE_PENDING_REGRESSION",
                },
                "provenance": "FOUNDER_SEMANTIC_CORRECTION",
                "preserveSourceCalibration": True,
            }
        ],
    }


def active_launch_ids() -> list[str]:
    ids = [i for i in PRIOR_LAUNCH if i != "STGO_23"]
    if "STGO_104" not in ids:
        ids.append("STGO_104")
    # stable sort by numeric suffix
    def key(s: str) -> int:
        return int(s.split("_")[1])

    return sorted(set(ids), key=key)


def patch_stgo_33_record(rec: dict) -> dict:
    out = deepcopy(rec)
    out["displayName"] = NEW_33_NAME
    if "canonicalName" in out or True:
        out["canonicalName"] = NEW_33_NAME
    out["launchRuntimeDisposition"] = "ACTIVE_LAUNCH"
    out["physicalStatus"] = "PHYSICAL_ELIGIBLE_PENDING_REGRESSION"
    out["physicalRouteGenerationEligible"] = False
    out["founderNodeBadges"] = [
        "FOUNDER_SEMANTIC_CORRECTION",
        "LEGACY_NAME_DEPRECATED",
    ]
    aliases = list(out.get("aliases") or [])
    if LEGACY_33_ALIAS not in aliases:
        aliases.append(LEGACY_33_ALIAS)
    out["aliases"] = aliases
    out["legacyAlias"] = {
        "alias": LEGACY_33_ALIAS,
        "status": "deprecated_alias",
    }
    # Preserve thematic/structural calibration — do not reset.
    out["identityCorrection"] = {
        "gate": "2A.1R-ADD-01R",
        "oldName": OLD_33_NAME,
        "newName": NEW_33_NAME,
        "provenance": "FOUNDER_SEMANTIC_CORRECTION",
    }
    return out


def write_json(path: Path, doc: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def update_semantic(active: list[str]) -> dict:
    sem = json.loads(SEMANTIC.read_text(encoding="utf-8"))
    assert sem["recordCount"] == 103
    records = []
    seen_33 = False
    for rec in sem["records"]:
        if rec["stgoId"] == "STGO_33":
            records.append(patch_stgo_33_record(rec))
            seen_33 = True
        else:
            # STGO_23 remains in canonical inventory as research/excluded, not active launch
            if rec["stgoId"] == "STGO_23":
                r = deepcopy(rec)
                r["launchCorpus"] = False
                r["launchRuntimeDisposition"] = "RUNTIME_EXCLUDED_RESEARCH"
                records.append(r)
            else:
                r = deepcopy(rec)
                r["launchCorpus"] = r["stgoId"] in active
                records.append(r)
    assert seen_33
    records.append(build_stgo_104_semantic())
    records.sort(key=lambda r: int(r["stgoId"].split("_")[1]))
    sem["records"] = records
    sem["recordCount"] = 104
    sem["gate"] = "2A.1R-ADD-01R"
    sem["canonicalInventory"] = {
        "frozenSeedCount": 103,
        "extensionCount": 1,
        "total": 104,
        "activeLaunchCount": 30,
        "baseSeedDataset": "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json",
        "extensionsArtifact": "src/data/santiago/source/santiago_founder_extensions.v0.1.json",
    }
    sem["notes"] = list(sem.get("notes") or []) + [
        "Gate 2A.1R-ADD-01R: STGO_104 founder extension + STGO_33 identity restore.",
        "Frozen 103-node seed remains byte-identical; STGO_104 lives in founder_extensions.",
        "UNKNOWN scores must not be coerced to zero.",
    ]
    write_json(SEMANTIC, sem)
    return sem


def update_launch(sem: dict, active: list[str]) -> dict:
    by = {r["stgoId"]: r for r in sem["records"]}
    records = []
    for sid in active:
        rec = deepcopy(by[sid])
        rec["launchCorpus"] = True
        if sid == "STGO_104":
            rec["launchRuntimeDisposition"] = "ACTIVE_LAUNCH"
        elif sid == "STGO_33":
            rec["launchRuntimeDisposition"] = "ACTIVE_LAUNCH"
        records.append(rec)
    assert len(records) == 30
    assert "STGO_23" not in {r["stgoId"] for r in records}
    assert "STGO_33" in {r["stgoId"] for r in records}
    assert "STGO_104" in {r["stgoId"] for r in records}

    launch = {
        "schemaVersion": "santiago-launch30-editorial-calibration.proposed.v0.1",
        "gate": "2A.1R-ADD-01R",
        "status": "FOUNDER_SEED_PLUS_EXTENSION_PLUS_AI_PROPOSED_UNVERIFIED",
        "curatorApproved": False,
        "canonicalTaxonomy": THEMES,
        "sourceDataset": "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json",
        "founderExtensionsArtifact": "src/data/santiago/source/santiago_founder_extensions.v0.1.json",
        "identityCorrectionsArtifact": "src/data/santiago/curation/santiago_founder_identity_corrections.v0.1.json",
        "canonicalSemanticArtifact": "src/data/santiago/santiago_semantic_calibration.v0.1.json",
        "normalizationCorpus": "SANTIAGO_LAUNCH30_V0_1",
        "notes": [
            "Active launch/review corpus remains exactly 30 (STGO_23 removed from active set; STGO_104 added).",
            "STGO_33 restored with corrected identity; founder source calibration preserved.",
            "STGO_104 founder-added; semantic UNKNOWNs require founder calibration before approval.",
            "ChronoWorth / visitTime / most M-mode values remain AI_PROPOSED_UNVERIFIED where previously proposed.",
            "STGO_104 ChronoWorth UNAVAILABLE until all four structural metrics are founder-supplied.",
        ],
        "chronoWorthFormula": {
            "expression": "100*(0.35*heritage_depth + 0.30*anchor_density + 0.20*micro_reveal + 0.15*polish)",
            "inputs": "FOUNDER_PRECALIBRATED structural_metrics (or founder-supplied for STGO_104)",
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
        "recordCount": 30,
        "activeLaunchIds": active,
        "records": records,
    }
    write_json(LAUNCH, launch)
    return launch


def update_corpus(active: list[str]) -> None:
    doc = {
        "schemaVersion": "launch-corpus.v0.1",
        "cityId": "santiago",
        "gate": "2A.1R-ADD-01R",
        "ids": active,
        "stgoIds": active,
        "count": 30,
        "note": (
            "Active Launch30 after Gate 2A.1R-ADD-01R: STGO_23 research/excluded removed from active "
            "corpus; STGO_33 restored; STGO_104 founder-added."
        ),
        "removedFromActiveLaunch": ["STGO_23"],
        "addedToActiveLaunch": ["STGO_104"],
    }
    write_json(CORPUS, doc)


def update_membership(active: list[str], engine_by: dict) -> None:
    mem = json.loads(MEMBERSHIP.read_text(encoding="utf-8"))
    # Rebuild membership reflecting editorial ACTIVE_LAUNCH for 33/104 but not routing-ready.
    ready = [
        sid
        for sid in active
        if sid not in {"STGO_32", "STGO_33", "STGO_104"}
    ]
    # STGO_32 remains staged if still in active set
    staged = ["STGO_32"] if "STGO_32" in active else []
    # Editorial-active but not routing-ready
    pending = []
    if "STGO_33" in active:
        pending.append("STGO_33")
    if "STGO_104" in active:
        pending.append("STGO_104")

    dispositions = []
    for sid in active:
        name = engine_by.get(sid, {}).get("displayName") or (
            NEW_33_NAME if sid == "STGO_33" else (
                "Edificio de la Bolsa de Comercio de Santiago" if sid == "STGO_104" else sid
            )
        )
        if sid == "STGO_32":
            dispositions.append({
                "stgoId": sid,
                "displayName": name,
                "disposition": "RUNTIME_STAGED",
                "reason": "Preserved Gate 1B.5 staging for Cerro San Cristóbal funicular base endpoint.",
                "runtimeEndpoint": None,
                "launchEditorialStatus": "ACTIVE_LAUNCH",
            })
        elif sid == "STGO_33":
            dispositions.append({
                "stgoId": sid,
                "displayName": NEW_33_NAME,
                "disposition": "ACTIVE_LAUNCH",
                "physicalStatus": "PHYSICAL_ELIGIBLE_PENDING_REGRESSION",
                "reason": (
                    "Gate 2A.1R-ADD-01R founder semantic correction: restored to active launch. "
                    "Legacy name 'Kulczewski Funicular Gargoyle' deprecated. Existing experience-point "
                    "evidence preserved; physical route eligibility pending regression. Routing remains disabled."
                ),
                "runtimeEndpoint": None,
                "launchEditorialStatus": "ACTIVE_LAUNCH",
            })
        elif sid == "STGO_104":
            dispositions.append({
                "stgoId": sid,
                "displayName": "Edificio de la Bolsa de Comercio de Santiago",
                "disposition": "ACTIVE_LAUNCH",
                "physicalStatus": "PHYSICAL_PENDING_EDGE_ENRICHMENT",
                "reason": (
                    "Founder-added Launch30 node. Semantic UNKNOWNs require founder calibration. "
                    "Physical edges not yet enriched. Routing remains disabled."
                ),
                "runtimeEndpoint": None,
                "launchEditorialStatus": "ACTIVE_LAUNCH",
            })
        else:
            dispositions.append({
                "stgoId": sid,
                "displayName": name,
                "disposition": "RUNTIME_READY",
                "reason": "Preserved prior Gate 1B.5 RUNTIME_READY editorial/physical readiness.",
                "runtimeEndpoint": None,
                "launchEditorialStatus": "ACTIVE_LAUNCH",
            })

    # STGO_23 remains research-excluded outside active launch corpus
    dispositions.append({
        "stgoId": "STGO_23",
        "displayName": engine_by.get("STGO_23", {}).get("displayName") or "Inca Tambo Canal Dip (Puente/Stgo)",
        "disposition": "RUNTIME_EXCLUDED_RESEARCH",
        "reason": (
            "Remains research/excluded and removed from active Launch30 review corpus "
            "(Gate 2A.1R-ADD-01R). Not deleted from canonical inventory."
        ),
        "runtimeEndpoint": None,
        "launchEditorialStatus": "EXCLUDED_FROM_ACTIVE_LAUNCH",
    })

    mem.update({
        "schemaVersion": "santiago-launch-runtime-membership.v0.1",
        "gate": "2A.1R-ADD-01R",
        "launchCorpusCount": 30,
        "runtimeReadyCount": len(ready),
        "runtimeStagedCount": len(staged),
        "runtimeExcludedCount": 1,
        "activeLaunchPendingPhysicalCount": len(pending),
        "runtimeReadyIds": ready,
        "runtimeStagedIds": staged,
        "runtimeExcludedIds": ["STGO_23"],
        "activeLaunchPendingPhysicalIds": pending,
        # Routing still disabled globally; routing id list stays prior-ready+staged only (no 33/104)
        "runtimeRoutingIds": sorted(ready + staged, key=lambda s: int(s.split("_")[1])),
        "byDisposition": {
            "RUNTIME_READY": ready,
            "RUNTIME_STAGED": staged,
            "ACTIVE_LAUNCH": pending,
            "RUNTIME_EXCLUDED_RESEARCH": ["STGO_23"],
        },
        "dispositions": dispositions,
        "notes": [
            "Gate 2A.1R-ADD-01R updates editorial membership only.",
            "Frozen physical edge/adjacency/multimodal artifacts are unchanged.",
            "PHYSICAL_ROUTE_GENERATION_ENABLED remains false.",
            "STGO_33/STGO_104 require a later narrow physical-extension gate for edges.",
        ],
    })
    write_json(MEMBERSHIP, mem)


def update_engine(active: list[str]) -> dict:
    eng = json.loads(ENGINE.read_text(encoding="utf-8"))
    nodes = []
    for n in eng["nodes"]:
        node = deepcopy(n)
        sid = node["stgoId"]
        if sid == "STGO_33":
            node["canonicalName"] = NEW_33_NAME
            node["displayName"] = NEW_33_NAME
            aliases = list(node.get("aliases") or [])
            if LEGACY_33_ALIAS not in aliases:
                aliases.append(LEGACY_33_ALIAS)
            node["aliases"] = aliases
            node["launchCorpus"] = True
            node["fieldPriority"] = "LAUNCH"
            node["launchRuntimeDisposition"] = "ACTIVE_LAUNCH"
            node["launchRuntimeDispositionReason"] = (
                "Gate 2A.1R-ADD-01R founder semantic correction; legacy Funicular name deprecated."
            )
            node["launchPhysicalReadiness"] = "PHYSICAL_ELIGIBLE_PENDING_REGRESSION"
            node["physicalRouteGenerationEligible"] = False
            node["physicalRouteGenerationEnabled"] = False
            # Preserve existing experiencePointCoordinate; do not invent poi/entrance.
            if node.get("curatorCuration"):
                cc = deepcopy(node["curatorCuration"])
                cc["founderPlaceName"] = NEW_33_NAME
                cc["legacyAlias"] = {"alias": LEGACY_33_ALIAS, "status": "deprecated_alias"}
                cc["semanticWarning"] = (
                    "Founder correction: experience valid; prior Funicular naming deprecated. "
                    "Luciano K hotel association is contextual/fun-fact, not an exclusion reason."
                )
                cc["identityCorrectionGate"] = "2A.1R-ADD-01R"
                node["curatorCuration"] = cc
        elif sid == "STGO_23":
            node["launchCorpus"] = False
            node["fieldPriority"] = "BACKLOG"
            node["launchRuntimeDisposition"] = "RUNTIME_EXCLUDED_RESEARCH"
            node["physicalRouteGenerationEligible"] = False
            node["physicalRouteGenerationEnabled"] = False
        else:
            node["launchCorpus"] = sid in active
            node["fieldPriority"] = "LAUNCH" if sid in active else "BACKLOG"
            node["physicalRouteGenerationEnabled"] = False
        nodes.append(node)

    # Add STGO_104 engine identity (no fabricated edges)
    nodes.append({
        "stgoId": "STGO_104",
        "legacySlug": "bolsa-de-comercio-de-santiago",
        "canonicalName": "Edificio de la Bolsa de Comercio de Santiago",
        "displayName": "Edificio de la Bolsa de Comercio de Santiago",
        "aliases": ["Bolsa de Comercio de Santiago"],
        "commune": None,
        "neighborhood": None,
        "identityStatus": "RESOLVED",
        "identityMissingSource": None,
        "themes": [],
        "modes": [],
        "editorialRole": None,
        "tier": None,
        "chronoWorth": None,
        "poiCoordinate": {"lat": -33.4423866, "lng": -70.6517565},
        "entranceCoordinate": None,
        "experiencePointCoordinate": {"lat": -33.4421764, "lng": -70.6517853},
        "experienceHeadingDegrees": 155.14,
        "nearestTransit": {
            "stationName": None,
            "line": None,
            "distanceMeters": None,
            "status": "UNRESOLVED",
        },
        "geographicIsland": None,
        "physicalVerificationState": "NEEDS_CURATOR_REVIEW",
        "legacyContentId": None,
        "legacyMappingStatus": "founder_extension",
        "provenance": {
            "identity": {
                "status": "RESOLVED",
                "sources": ["santiago_founder_extensions.v0.1"],
                "missingSource": None,
            },
            "physical": {
                "provider": None,
                "coordinatePolicy": "founder-supplied-google-maps-poi-and-experience-point",
                "curatorApproval": "never-automatic",
                "selectionStatus": "PHYSICAL_PENDING_EDGE_ENRICHMENT",
                "humanCurationGate": "2A.1R-ADD-01R",
                "humanCurationSource": "founder-google-maps",
            },
            "editorial": {
                "source": "santiago_founder_extensions.v0.1",
                "status": "absent",
            },
        },
        "launchCorpus": True,
        "fieldPriority": "LAUNCH",
        "verificationPriority": 104,
        "geocodeQuery": "Edificio de la Bolsa de Comercio de Santiago Chile",
        "queryUsed": None,
        "providerClassification": "FOUNDER_SUPPLIED",
        "providerCandidate": None,
        "candidates": [],
        "selectionReason": "FOUNDER_SUPPLIED_GOOGLE_MAPS",
        "providerId": None,
        "curatorApproval": None,
        "physicalRouteGenerationEnabled": False,
        "providerAudit": None,
        "launchPhysicalReadiness": "PHYSICAL_PENDING_EDGE_ENRICHMENT",
        "curatorCuration": {
            "gate": "2A.1R-ADD-01R",
            "source": "santiago_founder_extensions.v0.1.json",
            "founderPlaceName": "Edificio de la Bolsa de Comercio de Santiago",
            "shortName": "Bolsa de Comercio de Santiago",
            "poiCoordinate": {"lat": -33.4423866, "lng": -70.6517565},
            "experiencePoint": {"lat": -33.4421764, "lng": -70.6517853, "headingDegrees": 155.14},
            "entranceCoordinate": None,
            "notes": "NEW FOUNDER NODE — NOT IN ORIGINAL 103-NODE SEED",
        },
        "physicalPoints": [
            {
                "id": "poi",
                "role": "poi_coordinate",
                "coordinate": {"lat": -33.4423866, "lng": -70.6517565},
                "provenance": "FOUNDER_SUPPLIED_GOOGLE_MAPS",
            },
            {
                "id": "experience",
                "role": "experience_point",
                "coordinate": {"lat": -33.4421764, "lng": -70.6517853},
                "headingDegrees": 155.14,
                "provenance": "FOUNDER_SUPPLIED",
            },
        ],
        "accessPoints": [],
        "physicalRouteGenerationEligible": False,
        "launchRuntimeDisposition": "ACTIVE_LAUNCH",
        "launchRuntimeDispositionReason": "Founder-added active launch node pending semantic calibration and edge enrichment.",
        "runtimePhysicalEndpoint": None,
        "founderExtension": True,
    })

    nodes.sort(key=lambda n: int(n["stgoId"].split("_")[1]))
    eng["nodes"] = nodes
    eng["nodeCount"] = 104
    eng["launchCorpusCount"] = 30
    eng["backlogCount"] = 104 - 30
    eng["launchCorpusStgoIds"] = active
    eng["gate"] = "2A.1R-ADD-01R"
    eng["physicalRouteGenerationEnabled"] = False
    eng["canonicalInventory"] = {
        "frozenSeedCount": 103,
        "extensionCount": 1,
        "total": 104,
    }
    eng["counts"] = {
        **(eng.get("counts") or {}),
        "nodes": 104,
        "launchCorpus": 30,
        "backlog": 74,
        "founderExtensions": 1,
    }
    write_json(ENGINE, eng)
    return eng


def main() -> int:
    source_sha = sha256(SOURCE_FROZEN)
    # byte-identity marker for audit
    source = json.loads(SOURCE_FROZEN.read_text(encoding="utf-8"))
    assert len(source["nodes"]) == 103

    physical_hashes = {rel: sha256(ROOT / rel) for rel in PHYSICAL_FROZEN}

    active = active_launch_ids()
    assert len(active) == 30
    assert "STGO_23" not in active
    assert "STGO_33" in active
    assert "STGO_104" in active

    write_json(EXTENSIONS, build_extensions_doc(source_sha))
    write_json(IDENTITY_CORR, build_identity_corrections())

    eng = update_engine(active)
    engine_by = {n["stgoId"]: n for n in eng["nodes"]}
    sem = update_semantic(active)
    launch = update_launch(sem, active)
    update_corpus(active)
    update_membership(active, engine_by)

    # Verify frozen source + physical edges unchanged
    assert sha256(SOURCE_FROZEN) == source_sha
    for rel, h in physical_hashes.items():
        assert sha256(ROOT / rel) == h, f"physical drift: {rel}"

    audit = {
        "gate": "2A.1R-ADD-01R",
        "sourceCheckpointSha": CHECKPOINT,
        "frozenSeedCount": 103,
        "frozenSeedSha256": source_sha,
        "extensionCount": 1,
        "canonicalInventory": 104,
        "activeLaunchCount": 30,
        "activeLaunchIds": active,
        "stgo104": {
            "canonicalName": "Edificio de la Bolsa de Comercio de Santiago",
            "poiCoordinate": {"lat": -33.4423866, "lng": -70.6517565},
            "experiencePoint": {"lat": -33.4421764, "lng": -70.6517853},
            "headingDegrees": 155.14,
            "entrance": "UNKNOWN",
            "semantic": "UNKNOWN",
            "chronoWorth": "UNAVAILABLE",
            "physicalStatus": "PHYSICAL_PENDING_EDGE_ENRICHMENT",
        },
        "stgo33": {
            "oldName": OLD_33_NAME,
            "newName": NEW_33_NAME,
            "legacyAlias": LEGACY_33_ALIAS,
            "launchEditorialStatus": "ACTIVE_LAUNCH",
            "physicalStatus": "PHYSICAL_ELIGIBLE_PENDING_REGRESSION",
            "sourceCalibrationPreserved": True,
        },
        "stgo23": {
            "launchEditorialStatus": "EXCLUDED_FROM_ACTIVE_LAUNCH",
            "disposition": "RUNTIME_EXCLUDED_RESEARCH",
        },
        "physicalFrozenHashes": physical_hashes,
        "artifacts": {
            "extensions": str(EXTENSIONS.relative_to(ROOT)),
            "identityCorrections": str(IDENTITY_CORR.relative_to(ROOT)),
            "semantic": str(SEMANTIC.relative_to(ROOT)),
            "launch": str(LAUNCH.relative_to(ROOT)),
            "corpus": str(CORPUS.relative_to(ROOT)),
            "membership": str(MEMBERSHIP.relative_to(ROOT)),
            "engine": str(ENGINE.relative_to(ROOT)),
        },
    }
    write_json(AUDIT, audit)
    print("GATE_2A1R_ADD_01R_APPLY=PASS")
    print(json.dumps({"activeLaunchIds": active, "inventory": 104}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
