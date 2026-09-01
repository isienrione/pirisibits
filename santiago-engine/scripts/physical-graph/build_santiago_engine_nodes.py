#!/usr/bin/env python3
"""
Gate 1B.2 — Build canonical Santiago engine inventory (STGO_01 … STGO_103).

Authority:
- Gate 1B.1 identity corpus for the 103 curated POI concepts
- src/data/pois.ts for product titles / legacy content mapping
- Launch corpus lock for the priority 30

Rules:
- Do NOT invent identities or coordinates.
- Valparaíso / remote-ref identities stay UNRESOLVED for Santiago.
- Truncated names are repaired only from trustworthy in-repo sources.
- Legacy slugs are never canonical primary keys.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
IDENTITY = ROOT / "src/data/santiago/santiago_physical_identity.v0.1.json"
LAUNCH = ROOT / "src/data/santiago/santiago_launch_corpus.v0.1.json"
POIS_TS = ROOT / "src/data/pois.ts"

# Trustworthy display-name repairs from product + seed (never invent new POIs).
CANONICAL_NAME_OVERRIDES = {
    "catedral": "Catedral Metropolitana",
    "mercado-central": "Mercado Central",
    "gam": "Centro Cultural Gabriela Mistral (GAM)",
    "la-chascona": "La Chascona",
    "museo-memoria": "Museo de la Memoria y los Derechos Humanos",
    "san-francisco": "Iglesia de San Francisco",
}

# Theme hints from kind / neighborhood — editorial taxonomy only, not geography.
KIND_THEMES = {
    "anchor": ["T1A", "T3"],
    "civic": ["T1A", "T3"],
    "memory": ["T1B", "T9"],
    "museum": ["T5", "T3"],
    "plaza": ["T1A", "T8"],
    "barrio": ["T8", "T9"],
    "nature": ["T7"],
    "viewpoint": ["T7"],
    "market": ["T6", "T8"],
    "culture": ["T5", "T8"],
    "architecture": ["T3", "T4"],
    "pocket": ["T1B", "T8"],
    "micro": ["T4", "T8"],
    "remote-ref": [],
}


def parse_pois_ts() -> dict[str, dict]:
    text = POIS_TS.read_text(encoding="utf-8")
    blocks = re.findall(
        r"id:\s*'([^']+)'[\s\S]*?title:\s*'([^']+)'[\s\S]*?neighborhood:\s*'([^']+)'",
        text,
    )
    out: dict[str, dict] = {}
    for pid, title, neighborhood in blocks:
        # First occurrence wins (POIStop objects come before other noise).
        if pid not in out:
            out[pid] = {"title": title, "neighborhood": neighborhood}
    return out


def stgo_id(n: int) -> str:
    return f"STGO_{n:02d}"


def identity_unresolved(node: dict) -> tuple[bool, str | None]:
    nb = str(node.get("neighborhood") or "")
    kind = str(node.get("kind") or "")
    name = str(node.get("name") or "")
    if nb.endswith("-ref") or nb == "remote-ref" or kind == "remote-ref":
        return True, f"Non-Santiago / reference identity ({nb or kind}); no trustworthy Santiago POI source in repo"
    if "Cultural Node Sector" in name or re.search(r"Sector\s+\d+", name):
        return True, "Synthetic placeholder name pattern"
    if not name.strip():
        return True, "Missing canonical name in identity corpus"
    return False, None


def repair_name(slug: str, raw_name: str, pois: dict[str, dict]) -> str:
    if slug in CANONICAL_NAME_OVERRIDES:
        return CANONICAL_NAME_OVERRIDES[slug]
    if slug in pois:
        return pois[slug]["title"]
    # Trim dangling prepositions from truncated seed titles without inventing words.
    cleaned = raw_name.strip()
    cleaned = re.sub(r"\s+de\s*$", "", cleaned)
    return cleaned


def build() -> dict:
    identity = json.loads(IDENTITY.read_text(encoding="utf-8"))
    launch = json.loads(LAUNCH.read_text(encoding="utf-8"))
    pois = parse_pois_ts()
    launch_ids: list[str] = list(launch["ids"])
    assert len(launch_ids) == 30

    by_slug = {n["id"]: n for n in identity["nodes"]}
    ordered_slugs: list[str] = []
    for lid in launch_ids:
        ordered_slugs.append(lid)
    for n in identity["nodes"]:
        if n["id"] not in ordered_slugs:
            ordered_slugs.append(n["id"])
    assert len(ordered_slugs) == 103, len(ordered_slugs)

    nodes = []
    for idx, slug in enumerate(ordered_slugs, start=1):
        base = by_slug[slug]
        unresolved, missing = identity_unresolved(base)
        name = None if unresolved else repair_name(slug, base["name"], pois)
        display = name
        aliases: list[str] = []
        if slug in pois and name and pois[slug]["title"] != name:
            aliases.append(pois[slug]["title"])
        if base.get("name") and base["name"] != name and not unresolved:
            aliases.append(base["name"])

        launch_flag = slug in launch_ids
        product = pois.get(slug)
        if unresolved:
            legacy_status = "unresolved"
            legacy_content_id = None
        elif product:
            legacy_status = "resolved"
            legacy_content_id = slug
        elif launch_flag:
            # Known launch identity without product content object yet.
            legacy_status = "proposed"
            legacy_content_id = None
        else:
            legacy_status = "proposed"
            legacy_content_id = None

        themes = list(KIND_THEMES.get(base.get("kind") or "micro", ["T8"]))
        modes = ["M3"]  # default mobility placeholder — not a geographic claim

        node = {
            "stgoId": stgo_id(idx),
            "legacySlug": slug,
            "canonicalName": name,
            "displayName": display,
            "aliases": sorted(set(a for a in aliases if a)),
            "commune": None,  # unknown until curator / trustworthy gazetteer
            "neighborhood": None if unresolved else base.get("neighborhood"),
            "identityStatus": "UNRESOLVED" if unresolved else "RESOLVED",
            "identityMissingSource": missing,
            "themes": themes,
            "modes": modes,
            "editorialRole": base.get("kind"),
            "tier": "launch" if launch_flag else "expansion",
            "chronoWorth": None,
            "poiCoordinate": None,
            "entranceCoordinate": None,
            "experiencePointCoordinate": None,
            "nearestTransit": {
                "stationName": None,
                "line": None,
                "distanceMeters": None,
                "status": "UNRESOLVED",
            },
            "geographicIsland": None,
            "physicalVerificationState": "IDENTITY_ONLY",
            "legacyContentId": legacy_content_id,
            "legacyMappingStatus": legacy_status,
            "provenance": {
                "identity": {
                    "status": "UNRESOLVED" if unresolved else "RESOLVED",
                    "sources": (
                        ["gate-1b1-identity-seed"]
                        + (["src/data/pois.ts"] if product else [])
                    ),
                    "missingSource": missing,
                },
                "physical": {
                    "provider": None,
                    "coordinatePolicy": "mapbox-only-no-arithmetic-fallback",
                    "curatorApproval": "never-automatic",
                    "selectionStatus": "PENDING_GEOCODE",
                },
                "editorial": {
                    "source": "src/data/pois.ts" if product else "gate-1b1-identity-seed",
                    "status": "present" if product else "partial",
                },
            },
            "launchCorpus": launch_flag,
            "fieldPriority": "LAUNCH" if launch_flag else "BACKLOG",
            "verificationPriority": idx if launch_flag else 100 + idx,
            "geocodeQuery": None if unresolved else base.get("geocodeQuery"),
            "queryUsed": None,
            "providerClassification": "PENDING_GEOCODE",
            "providerCandidate": None,
            "candidates": [],
            "selectionReason": None,
            "providerId": None,
            "curatorApproval": None,
            "physicalRouteGenerationEnabled": False,
            # Internal enrich helpers (stripped from public contract checks via keep)
            "_kind": base.get("kind"),
        }
        nodes.append(node)

    launch_stgo = [n["stgoId"] for n in nodes if n["launchCorpus"]]
    assert len(launch_stgo) == 30
    assert len([n for n in nodes if not n["launchCorpus"]]) == 73

    payload = {
        "schemaVersion": "santiago-engine-nodes.v0.1",
        "cityId": "santiago",
        "gate": "1B.2",
        "nodeCount": 103,
        "launchCorpusCount": 30,
        "backlogCount": 73,
        "physicalRouteGenerationEnabled": False,
        "autoCuratorApproveFromMapbox": False,
        "coordinatePolicy": "Provider candidates only. Never fabricate. Never auto CURATOR_APPROVED.",
        "experiencePointPolicy": "Experience-point coordinates are distinct from POI and entrance; unresolved until curated.",
        "transitPolicy": "Metro enrichment deferred — no arithmetic estimates.",
        "launchCorpusStgoIds": launch_stgo,
        "nodes": nodes,
        "counts": {
            "identityResolved": sum(1 for n in nodes if n["identityStatus"] == "RESOLVED"),
            "identityUnresolved": sum(1 for n in nodes if n["identityStatus"] == "UNRESOLVED"),
            "launch": 30,
            "backlog": 73,
            "legacyResolved": sum(1 for n in nodes if n["legacyMappingStatus"] == "resolved"),
            "legacyProposed": sum(1 for n in nodes if n["legacyMappingStatus"] == "proposed"),
            "legacyUnresolved": sum(1 for n in nodes if n["legacyMappingStatus"] == "unresolved"),
        },
    }
    return payload


def main() -> int:
    payload = build()
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)}")
    print("counts", json.dumps(payload["counts"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
