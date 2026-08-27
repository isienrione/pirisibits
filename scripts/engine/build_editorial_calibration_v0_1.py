#!/usr/bin/env python3
"""
Gate 2A.1 — Restore Santiago continuous semantic calibration (launch 30).

Findings:
- Continuous structural_metrics (anchor_density/heritage_depth/micro_reveal/polish)
  are NOT present anywhere in the repository (searched tree + history keywords).
- Gate 1B.2 build_santiago_engine_nodes.py collapsed themes to binary KIND_THEMES
  and set chronoWorth=null, modes=['M3'].
- src/data/pois.ts holds continuous demo vectors, but uses OLD encoding where
  T1≈civic (T1A) and T2≈memory (T1B), NOT culinary T2.
- legacySlug↔displayName was reordered by founder curation; matching must use
  display-name maps, not blind legacySlug.

This script produces AI_PROPOSED_UNVERIFIED calibration — not CURATOR_APPROVED.
"""

from __future__ import annotations

import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
POIS_TS = ROOT / "src/data/pois.ts"
OUT = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
AUDIT = ROOT / "docs/engine/gate-2a1-source-audit.json"

THEME_CODES = ["T1A", "T1B", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9"]
TAG_THRESHOLD = 0.45

# Display-name → demo pois.ts id (verified by human-readable titles, not broken slug order).
DISPLAY_TO_DEMO_POI = {
    "Plaza de Armas": "plaza-de-armas",
    "Catedral Metropolitana": "catedral",
    "Palacio de La Moneda": "la-moneda",
    "Morandé 80 (President's Door)": "morande-80",
    "Cerro Santa Lucía & Terraza Neptuno": "santa-lucia",
    "Londres 38 Memorial": "londres-38",
    "Barrio Lastarria Corridor": "lastarria",
    "GAM (Centro Gabriela Mistral)": "gam",
    "MNBA & Parque Forestal": "parque-forestal",
    "La Chascona (Neruda House)": "la-chascona",
    "Cerro San Cristóbal Funicular / Hill complex": "san-cristobal",
    "Museo de la Memoria y DDHH": "museo-memoria",
    "Barrio Yungay & Plaza Roto Chileno": "yungay",
    "Palacio Pereira": "palacio-pereira",
    "Bellavista Mural Corridors": "bellavista",
}

# Culinary / market / table sites for T2 restoration (content-heuristic proposals).
CULINARY_HINTS = {
    "STGO_20": 0.95,  # La Piojera
    "STGO_21": 0.9,  # Confitería Torres
    "STGO_28": 0.85,  # Bocanáriz & Chipe Libre
    "STGO_34": 0.95,  # La Vega Central
    "STGO_35": 0.9,  # Mercado Tirso de Molina
}

SENSITIVE_BY_STGO = {
    "STGO_04": True,  # Morandé 80
    "STGO_07": True,  # Londres 38
    "STGO_19": True,  # Seguro Obrero scars
    "STGO_48": True,  # Museo de la Memoria
}

VISIT_BY_ROLE = {
    "anchor": (12, 18, 28),
    "civic": (12, 20, 30),
    "museum": (20, 35, 50),
    "memory": (18, 30, 45),
    "pocket": (10, 14, 22),
    "plaza": (8, 12, 20),
    "architecture": (10, 15, 25),
    "culture": (12, 20, 35),
    "micro": (6, 10, 16),
}


def parse_pois_ts() -> dict[str, dict]:
    text = POIS_TS.read_text(encoding="utf-8")
    out: dict[str, dict] = {}
    for m in re.finditer(
        r"id:\s*'([^']+)'[\s\S]*?title:\s*'([^']+)'[\s\S]*?"
        r"kind:\s*'([^']+)'[\s\S]*?"
        r"thematicVector:\s*vectorFromTopics\((\{[^}]+\})\)[\s\S]*?"
        r"dwellMinutes:\s*(\d+)([\s\S]*?)(?=\n  \{\n    id:|\n\];)",
        text,
    ):
        pid, title, kind, topics_raw, dwell, rest = m.groups()
        topics = {}
        for km in re.finditer(r"(T\d+[A-B]?)\s*:\s*([0-9.]+)", topics_raw):
            topics[km.group(1)] = float(km.group(2))
        sensitive = "is_sensitive_memory_site: true" in rest or "sensitiveMemory: true" in rest
        step_free = None
        if "step_free_certified: true" in rest or "stepFree: true" in rest:
            step_free = True
        if "step_free_certified: false" in rest or "stepFree: false" in rest:
            step_free = False
        if "stairs: true" in rest and step_free is None:
            step_free = False
        daylight = "daylight_only: true" in rest or "daylightLock: true" in rest
        canonical_anchor = "canonical_anchor: true" in rest or kind == "anchor"
        out[pid] = {
            "title": title,
            "kind": kind,
            "topicsOld": topics,
            "dwellMinutes": int(dwell),
            "sensitiveMemory": sensitive,
            "stepFree": step_free,
            "daylightOnly": daylight,
            "canonicalAnchor": canonical_anchor,
        }
    return out


def empty_vector() -> dict[str, float]:
    return {c: 0.0 for c in THEME_CODES}


def remap_old_demo_vector(topics_old: dict[str, float]) -> dict[str, float]:
    """Map demo pois.ts encoding → canonical ThemeCode object.
    Old: T1=civic≈T1A, T2=memory≈T1B, T3…T9 same indices.
    Culinary T2 starts at 0 and is filled separately.
    """
    v = empty_vector()
    v["T1A"] = float(topics_old.get("T1", topics_old.get("T1A", 0.0)))
    v["T1B"] = float(topics_old.get("T2", topics_old.get("T1B", 0.0)))  # old T2 was memory
    v["T2"] = 0.0  # culinary restored separately
    for code in ["T3", "T4", "T5", "T6", "T7", "T8", "T9"]:
        v[code] = float(topics_old.get(code, 0.0))
    return v


def vector_from_binary_themes(themes: list[str]) -> dict[str, float]:
    v = empty_vector()
    for t in themes:
        if t in v:
            v[t] = max(v[t], 0.7)
    return v


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def derive_tags(vector: dict[str, float]) -> list[str]:
    return [c for c in THEME_CODES if vector[c] >= TAG_THRESHOLD]


def tier_from_role(role: str | None, demo: dict | None) -> str:
    if demo and demo.get("canonicalAnchor"):
        return "canonical_anchor"
    if role in {"anchor", "civic"}:
        return "canonical_anchor"
    if role in {"pocket", "museum", "memory", "plaza", "culture", "architecture"}:
        return "thematic_pocket"
    return "micro_reveal"


def anchor_score(role: str | None, tier: str) -> float:
    if tier == "canonical_anchor" or role == "anchor":
        return 1.0
    if role in {"civic", "museum", "memory"}:
        return 0.78
    if role in {"pocket", "plaza", "culture", "architecture"}:
        return 0.55
    return 0.35


def propose_chronoworth(vector: dict[str, float], role: str | None, tier: str) -> dict:
    """Documented formula — editorial proxies only (no physical centrality).

    ChronoWorthProposal =
      100 * (
        0.35 * heritage_depth_proxy
      + 0.30 * anchor_density_proxy
      + 0.20 * micro_reveal_proxy
      + 0.15 * polish_proxy
      )

    Proxies substitute for missing structural_metrics inventory.
    """
    heritage = max(vector["T1A"], vector["T1B"], vector["T9"] * 0.6)
    anchor = anchor_score(role, tier)
    if tier == "micro_reveal":
        micro = 0.85
    elif tier == "thematic_pocket":
        micro = 0.55
    else:
        micro = 0.25
    polish = max(vector["T3"], vector["T5"], vector["T9"], vector["T2"] * 0.5)
    contributions = {
        "heritage_depth_proxy": round(heritage, 4),
        "anchor_density_proxy": round(anchor, 4),
        "micro_reveal_proxy": round(micro, 4),
        "polish_proxy": round(polish, 4),
        "weights": {"heritage": 0.35, "anchor": 0.30, "micro": 0.20, "polish": 0.15},
    }
    raw = 100.0 * (0.35 * heritage + 0.30 * anchor + 0.20 * micro + 0.15 * polish)
    value = int(round(max(8.0, min(96.0, raw))))
    return {
        "proposed": value,
        "approved": None,
        "effective": value,
        "provenance": "AI_PROPOSED_UNVERIFIED",
        "formula": "0.35*heritage + 0.30*anchor + 0.20*micro_reveal + 0.15*polish",
        "contributions": contributions,
        "note": "structural_metrics inventory absent in repo; proxies from role/tier/vector",
    }


def propose_visit(role: str | None, dwell: int | None, culinary: bool) -> dict:
    base = VISIT_BY_ROLE.get(role or "micro", (8, 12, 20))
    if culinary:
        base = (12, 22, 40)
    if dwell is not None:
        typical = dwell
        vmin = max(5, int(round(dwell * 0.7)))
        vmax = int(round(dwell * 1.6))
        provenance = "AI_PROPOSED_UNVERIFIED_FROM_DEMO_DWELL"
        source = "src/data/pois.ts dwellMinutes (name-matched)"
    else:
        vmin, typical, vmax = base
        provenance = "AI_PROPOSED_UNVERIFIED_FROM_ROLE_HEURISTIC"
        source = "editorial role heuristic"
    return {
        "min": vmin,
        "typical": typical,
        "max": vmax,
        "unit": "minutes",
        "includesTravelTime": False,
        "approved": None,
        "provenance": provenance,
        "source": source,
    }


def propose_modes(
    vector: dict[str, float],
    visit: dict,
    demo: dict | None,
    role: str | None,
) -> dict:
    typical = visit["typical"]
    # M1 express: shorter visits → higher suitability
    m1 = clamp01(1.2 - typical / 35.0)
    # M2: NEVER infer from UNKNOWN
    if demo and demo.get("stepFree") is True:
        m2 = {"value": 0.85, "status": "KNOWN_STEP_FREE", "provenance": "DEMO_POI_MATCH"}
    elif demo and demo.get("stepFree") is False:
        m2 = {"value": 0.15, "status": "KNOWN_NOT_STEP_FREE", "provenance": "DEMO_POI_MATCH"}
    else:
        m2 = {"value": None, "status": "UNKNOWN", "provenance": "UNKNOWN_NOT_INFERRED"}
    # M3 family: soft heuristic — plazas/parks higher, sensitive memory lower later
    m3 = 0.55
    if role in {"plaza", "anchor"}:
        m3 = 0.7
    if role == "memory":
        m3 = 0.35
    if vector["T7"] > 0.5:
        m3 = max(m3, 0.6)
    # M4 night: daylight_only → low; else unknown-ish mid
    if demo and demo.get("daylightOnly"):
        m4 = {"value": 0.1, "status": "DAYLIGHT_ONLY", "provenance": "DEMO_POI_MATCH"}
    else:
        m4 = {"value": 0.45, "status": "HOURS_REQUIRED_UNKNOWN", "provenance": "AI_PROPOSED_UNVERIFIED"}
    # M5 comfort: polish-ish, penalize stairs if known
    m5 = clamp01(0.4 + 0.5 * max(vector["T9"], vector["T3"] * 0.5))
    if isinstance(m2, dict) and m2.get("status") == "KNOWN_NOT_STEP_FREE":
        m5 = clamp01(m5 - 0.25)
    return {
        "M1": {"value": round(m1, 3), "provenance": "AI_PROPOSED_FROM_VISIT_TIME"},
        "M2": m2,
        "M3": {"value": round(m3, 3), "provenance": "AI_PROPOSED_ROLE_HEURISTIC"},
        "M4": m4,
        "M5": {"value": round(m5, 3), "provenance": "AI_PROPOSED_POLISH_PROXY"},
    }


def operational_flags(demo: dict | None) -> dict:
    if demo and demo.get("daylightOnly"):
        return {
            "classification": "DAYLIGHT_ONLY",
            "daylightOnly": True,
            "provenance": "DEMO_POI_MATCH",
        }
    return {
        "classification": "HOURS_REQUIRED_UNKNOWN",
        "daylightOnly": None,
        "provenance": "UNKNOWN",
    }


def accessibility(demo: dict | None) -> dict:
    if demo and demo.get("stepFree") is True:
        return {"status": "KNOWN_STEP_FREE", "provenance": "DEMO_POI_MATCH"}
    if demo and demo.get("stepFree") is False:
        return {"status": "KNOWN_NOT_STEP_FREE", "provenance": "DEMO_POI_MATCH"}
    return {"status": "UNKNOWN", "provenance": "UNKNOWN"}


def main() -> int:
    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    pois = parse_pois_ts()
    launch = [n for n in engine["nodes"] if n.get("launchCorpus")]
    assert len(launch) == 30

    audit = {
        "gate": "2A.1",
        "structuralMetricsInventory": "NOT_FOUND_IN_REPOSITORY",
        "searchedFields": [
            "anchor_density",
            "heritage_depth",
            "micro_reveal",
            "polish",
            "exclude_for_m5",
            "curbside_hub",
        ],
        "binaryThemeSource": "scripts/physical-graph/build_santiago_engine_nodes.py KIND_THEMES",
        "continuousDemoSource": "src/data/pois.ts thematicVector (old T1/T2 encoding)",
        "legacySlugWarning": "Gate 1B.2A curation reassigned display names; do not use legacySlug alone",
        "demoPoiCountParsed": len(pois),
    }

    records = []
    matched = 0
    for n in sorted(launch, key=lambda x: x["stgoId"]):
        sid = n["stgoId"]
        name = n.get("displayName") or n.get("canonicalName") or ""
        demo_id = DISPLAY_TO_DEMO_POI.get(name)
        demo = pois.get(demo_id) if demo_id else None
        sources = []
        if demo:
            matched += 1
            vector = remap_old_demo_vector(demo["topicsOld"])
            sources.append(
                {
                    "type": "DEMO_POI_CONTINUOUS_REMAPPED",
                    "demoPoiId": demo_id,
                    "note": "Old T1→T1A, old T2→T1B; culinary T2 filled separately",
                }
            )
            dwell = demo["dwellMinutes"]
        else:
            vector = vector_from_binary_themes(list(n.get("themes") or []))
            sources.append(
                {
                    "type": "BINARY_THEME_EXPANSION",
                    "themes": n.get("themes"),
                    "note": "No name-matched demo POI; binary tags expanded to 0.7 strengths",
                }
            )
            dwell = None

        culinary = CULINARY_HINTS.get(sid)
        if culinary is not None:
            vector["T2"] = max(vector["T2"], culinary)
            sources.append({"type": "CULINARY_T2_CONTENT_HEURISTIC", "value": culinary})

        # Markets / food names soft boost
        lowered = name.lower()
        if any(k in lowered for k in ("vega", "mercado", "piojera", "confiter", "bocan", "chipe")):
            if vector["T2"] < 0.7:
                vector["T2"] = 0.75
                sources.append({"type": "CULINARY_NAME_HEURISTIC", "value": 0.75})

        for c in THEME_CODES:
            vector[c] = round(clamp01(vector[c]), 4)

        role = n.get("editorialRole")
        tier = tier_from_role(role, demo)
        chrono = propose_chronoworth(vector, role, tier)
        visit = propose_visit(role, dwell, vector["T2"] >= 0.7)
        modes = propose_modes(vector, visit, demo, role)
        sensitive = SENSITIVE_BY_STGO.get(sid)
        if sensitive is None and demo:
            sensitive = bool(demo.get("sensitiveMemory"))
            sens_prov = "DEMO_POI_MATCH" if sensitive else "ABSENT_IN_DEMO"
        elif sensitive is True:
            sens_prov = "CONTENT_HEURISTIC_AI_PROPOSED"
        else:
            sensitive = False
            sens_prov = "DEFAULT_FALSE_NO_EVIDENCE"

        tags = derive_tags(vector)
        records.append(
            {
                "stgoId": sid,
                "displayName": name,
                "legacySlug": n.get("legacySlug"),
                "demoPoiIdMatched": demo_id,
                "tier": tier,
                "editorialRole": role,
                "thematicVector": vector,
                "derivedThemeTags": tags,
                "themeTagThreshold": TAG_THRESHOLD,
                "chronoWorth": chrono,
                "visitTime": visit,
                "structuralSuitability": modes,
                "sensitiveMemory": {
                    "value": bool(sensitive),
                    "provenance": sens_prov,
                    "note": "Explicit flag only; not inferred from T1B alone at eligibility time",
                },
                "accessibility": accessibility(demo),
                "operational": operational_flags(demo),
                "sources": sources,
                "launchRuntimeDisposition": n.get("launchRuntimeDisposition"),
                "physicalRouteGenerationEligible": n.get("physicalRouteGenerationEligible"),
            }
        )

    payload = {
        "schemaVersion": "santiago-launch30-editorial-calibration.proposed.v0.1",
        "gate": "2A.1",
        "status": "AI_PROPOSED_UNVERIFIED",
        "curatorApproved": False,
        "canonicalTaxonomy": THEME_CODES,
        "notes": [
            "Continuous named thematicVector is canonical for NodeUtility.",
            "derivedThemeTags are convenience labels only.",
            "ChronoWorth proposed values are NOT CURATOR_APPROVED.",
            "Visit times exclude travel time.",
            "structural_metrics inventory was not recoverable from the repository.",
        ],
        "chronoWorthFormula": {
            "expression": "100*(0.35*heritage + 0.30*anchor + 0.20*micro + 0.15*polish)",
            "forbiddenInputs": [
                "physicalCentrality",
                "edgeDegree",
                "metroProximity",
                "googlePopularity",
                "mapboxRelevance",
                "travelerInterests",
            ],
        },
        "recordCount": len(records),
        "demoNameMatches": matched,
        "records": records,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    audit["launchDemoNameMatches"] = matched
    audit["output"] = str(OUT.relative_to(ROOT))
    AUDIT.write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    print("Wrote", OUT.relative_to(ROOT))
    print("demo matches", matched, "/30")
    print("T2>0 count", sum(1 for r in records if r["thematicVector"]["T2"] > 0))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
