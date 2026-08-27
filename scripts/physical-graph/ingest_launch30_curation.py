#!/usr/bin/env python3
"""Gate 1B.2A — ingest founder launch-30 human physical curation."""

from __future__ import annotations

import json
import math
import re
import sys
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[2]
MD = ROOT / "src/data/santiago/curation/CHRONOWALK_LAUNCH30_CURATOR_FEEDBACK_CLEANED.md"
RAW_OUT = ROOT / "src/data/santiago/curation/launch30_physical_review.raw.v0.1.json"
NORM_OUT = ROOT / "src/data/santiago/curation/launch30_physical_review.normalized.v0.1.json"
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
LAUNCH = ROOT / "src/data/santiago/santiago_launch_corpus.v0.1.json"

EXPECTED_LAUNCH = [
    "STGO_01", "STGO_02", "STGO_03", "STGO_04", "STGO_05", "STGO_06", "STGO_07",
    "STGO_10", "STGO_11", "STGO_16", "STGO_18", "STGO_19", "STGO_20", "STGO_21",
    "STGO_22", "STGO_23", "STGO_24", "STGO_25", "STGO_26", "STGO_27", "STGO_28",
    "STGO_29", "STGO_32", "STGO_33", "STGO_34", "STGO_35", "STGO_48", "STGO_91",
    "STGO_92", "STGO_30",
]
SANTIAGO_BBOX = (-70.80, -33.60, -70.50, -33.35)

RE_AT = re.compile(r"@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)")
RE_PAIR = re.compile(r"(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)")
RE_3D4D = re.compile(r"!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)")
RE_URL = re.compile(r"https?://[^\s\]|)]+|https://maps\.app\.goo\.gl/[^\s\]|)]+")
RE_STGO = re.compile(r"\*?\*?(STGO_\d{2})\*?\*?")


def haversine_m(a: dict, b: dict) -> float | None:
    if not a or not b:
        return None
    lat1, lon1, lat2, lon2 = map(math.radians, [a["lat"], a["lng"], b["lat"], b["lng"]])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    x = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 6371000 * 2 * math.asin(min(1.0, math.sqrt(x)))


def coord(lat: float, lng: float, *, source: str, role: str) -> dict:
    return {"lat": round(float(lat), 7), "lng": round(float(lng), 7), "source": source, "role": role}


def in_bbox(c: dict | None) -> bool:
    if not c:
        return False
    min_lon, min_lat, max_lon, max_lat = SANTIAGO_BBOX
    return min_lon <= c["lng"] <= max_lon and min_lat <= c["lat"] <= max_lat


def extract_urls(text: str) -> list[str]:
    urls = []
    for m in RE_URL.finditer(text or ""):
        u = m.group(0).rstrip(")")
        if u not in urls:
            urls.append(unquote(u))
    return urls


def place_coords_from_urls(urls: list[str]) -> list[dict]:
    out = []
    for u in urls:
        for lat, lng in RE_3D4D.findall(u):
            out.append(coord(float(lat), float(lng), source="google_maps_place", role="poi_candidate"))
    return out


def parse_table_rows(md: str) -> list[dict[str, Any]]:
    """Parse founder markdown table; tolerate multi-line cells."""
    start = md.find("| # | ID |")
    if start < 0:
        return []
    body = md[start:]
    row_re = re.compile(
        r"^\|\s*(\d+)\s*\|\s*\*?\*?(STGO_\d{2})\*?\*?\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*",
        re.MULTILINE,
    )
    matches = list(row_re.finditer(body))
    rows: list[dict[str, Any]] = []
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        chunk = body[m.end() : end].strip()
        # remainder: feedback | links | notes |
        parts = chunk.split("|")
        feedback = parts[0].strip() if parts else ""
        links = parts[1].strip() if len(parts) > 1 else ""
        notes = parts[2].strip() if len(parts) > 2 else ""
        rows.append(
            {
                "rowNumber": int(m.group(1)),
                "stgoId": m.group(2),
                "place": m.group(3).strip(),
                "poiVerdict": m.group(4).strip(),
                "feedbackText": feedback,
                "linksText": links,
                "notes": notes,
                "googleMapsUrls": extract_urls(links + " " + feedback),
            }
        )
    return rows


def labeled_points(feedback: str) -> list[dict]:
    points = []
    # Inline: "Funicular @lat,lng"
    for m in re.finditer(
        r"(?is)(Funicular|Acceso Carlos reed|Teleferico[^@\n]*?|Cerro Santa Lucia|Terraza Neptuno|Castillo H\w+)\s*@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)",
        feedback,
    ):
        points.append(
            {
                "label": m.group(1).strip(),
                "coordinate": coord(float(m.group(2)), float(m.group(3)), source="founder_at", role="labeled"),
            }
        )
    # Label on one line, @ on next line
    for m in re.finditer(
        r"(?is)(Terraza Neptuno|Castillo H\w+)\s*\n\s*@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)",
        feedback,
    ):
        if not any(p["label"].lower().startswith(m.group(1).strip().lower()[:8]) for p in points):
            points.append(
                {
                    "label": m.group(1).strip(),
                    "coordinate": coord(float(m.group(2)), float(m.group(3)), source="founder_at", role="labeled"),
                }
            )
    return points


def explicit_pairs(feedback: str) -> list[dict]:
    pairs = []
    for lat, lng in RE_PAIR.findall(feedback):
        c = coord(float(lat), float(lng), source="founder_text", role="explicit_pair")
        if c not in pairs:
            pairs.append(c)
    return pairs


def normalize_row(raw: dict) -> dict[str, Any]:
    stgo = raw["stgoId"]
    fb = raw["feedbackText"]
    urls = raw["googleMapsUrls"]
    place_coords = place_coords_from_urls(urls)
    at_coords = [coord(float(a), float(b), source="founder_street_view", role="experience_candidate") for a, b in RE_AT.findall(fb)]
    pair_coords = [
        coord(float(a), float(b), source="founder_text", role="text_pair")
        for a, b in RE_PAIR.findall(fb)
        if f"@{a},{b}" not in fb and f"@ {a},{b}" not in fb
    ]

    out: dict[str, Any] = {
        "stgoId": stgo,
        "founderPlaceName": raw["place"],
        "notes": raw["notes"],
        "googleMapsUrls": urls,
        "rawFeedbackText": fb,
        "physicalPoints": [],
        "accessPoints": [],
        "poiCoordinate": None,
        "experiencePointCoordinate": None,
        "entranceCoordinate": None,
        "launchPhysicalReadiness": "READY_FOR_EDGE_GENERATION",
        "physicalVerificationState": "CURATOR_APPROVED",
        "curatorApproval": "CURATOR_APPROVED",
        "curatorOverrideProvider": False,
        "overrideReason": None,
        "researchBlocker": None,
        "semanticWarning": None,
        "providerDiffMeters": None,
        "uiColor": "GREEN",
    }

    if stgo == "STGO_23":
        out.update(
            {
                "launchPhysicalReadiness": "UNRESOLVED_RESEARCH_REQUIRED",
                "physicalVerificationState": "UNRESOLVED",
                "curatorApproval": None,
                "researchBlocker": "Founder cannot identify POI concept; canonical Inca Tambo Canal Dip requires editorial research before physical promotion.",
                "uiColor": "RED",
            }
        )
        return out

    if stgo == "STGO_33":
        xp = at_coords[0] if at_coords else None
        poi = place_coords[-1] if place_coords else None
        out.update(
            {
                "launchPhysicalReadiness": "NEEDS_SEMANTIC_REVIEW",
                "physicalVerificationState": "NEEDS_CURATOR_REVIEW",
                "curatorApproval": None,
                "experiencePointCoordinate": xp,
                "poiCoordinate": None,
                "semanticWarning": raw["notes"] or "Founder notes Hotel Luciano K today; do not equate with Kulczewski Funicular Gargoyle concept.",
                "physicalPoints": [
                    {
                        "id": "founder_street_view",
                        "label": "Founder Street View (Hotel Luciano K)",
                        "role": "experience_candidate",
                        "coordinate": xp,
                        "provenance": "CURATOR_APPROVED",
                        "notes": raw["notes"],
                    }
                ],
                "uiColor": "RED",
            }
        )
        return out

    if stgo == "STGO_05":
        labeled = labeled_points(fb)
        terraza = next((p for p in labeled if "neptuno" in p["label"].lower()), None)
        castillo = next((p for p in labeled if "castillo" in p["label"].lower()), None)
        cerro_at = next((p for p in labeled if "cerro" in p["label"].lower()), None)
        cerro_place = place_coords[-1] if place_coords else None
        conflict = None
        if cerro_at and cerro_place:
            d = haversine_m(cerro_at["coordinate"], cerro_place)
            if d and d > 2000:
                conflict = {
                    "founderAtCoordinate": cerro_at["coordinate"],
                    "linkedPlaceCoordinate": cerro_place,
                    "distanceMeters": round(d, 1),
                    "resolution": "Use linked Google Maps place for POI; retain founder @ coordinate as conflicting evidence pending confirmation.",
                }
        poi = cerro_place
        points = []
        if poi:
            points.append({"id": "cerro_poi", "label": "Cerro Santa Lucía (linked place)", "role": "poi", "coordinate": poi, "provenance": "CURATOR_APPROVED"})
        if terraza:
            points.append({"id": "terraza_neptuno", "label": "Terraza Neptuno", "role": "experience_point", "coordinate": terraza["coordinate"], "provenance": "CURATOR_APPROVED"})
        if castillo:
            points.append({"id": "castillo_hidalgo", "label": "Castillo Hidalgo", "role": "experience_point", "coordinate": castillo["coordinate"], "provenance": "CURATOR_APPROVED"})
        xp = terraza["coordinate"] if terraza else (castillo["coordinate"] if castillo else None)
        out.update(
            {
                "poiCoordinate": poi,
                "experiencePointCoordinate": xp,
                "physicalPoints": points,
                "launchPhysicalReadiness": "PARTIAL_REVIEW_REQUIRED",
                "uiColor": "YELLOW",
                "overrideReason": "Cerro POI coordinate conflict flagged; sub-points preserved separately.",
                "coordinateConflict": conflict,
            }
        )
        return out

    if stgo == "STGO_32":
        labeled = labeled_points(fb)
        hill = place_coords[-1] if place_coords else None
        access = []
        for p in labeled:
            role = "access"
            lbl = p["label"].lower()
            if "funicular" in lbl:
                pid = "funicular"
            elif "carlos" in lbl:
                pid = "acceso_carlos_reed"
            else:
                pid = "teleferico_pedro_de_valdivia"
            access.append(
                {
                    "id": pid,
                    "label": p["label"],
                    "role": role,
                    "coordinate": p["coordinate"],
                    "provenance": "CURATOR_APPROVED",
                }
            )
        out.update(
            {
                "poiCoordinate": hill,
                "experiencePointCoordinate": access[0]["coordinate"] if access else None,
                "accessPoints": access,
                "physicalPoints": ([{"id": "hill_poi", "label": "Cerro San Cristóbal", "role": "poi", "coordinate": hill, "provenance": "CURATOR_APPROVED"}] if hill else []) + access,
            }
        )
        return out

    # Generic normalization
    poi = place_coords[-1] if place_coords else None
    xp = at_coords[0] if at_coords else None
    pairs = explicit_pairs(fb)
    if not xp and pairs:
        xp = pairs[0]
    if not poi and len(pairs) > 1:
        poi = pairs[1]

    if "official coordinates" in fb.lower() and at_coords:
        xp = at_coords[0]
        if place_coords:
            poi = place_coords[-1]
        elif len(at_coords) > 1:
            poi = at_coords[1]
    elif poi and xp and poi["lat"] == xp["lat"] and poi["lng"] == xp["lng"]:
        xp = None

    # Street-view-only rows: experience point; POI from maps place if available
    if xp and not poi and place_coords:
        poi = place_coords[-1]
    if xp and not poi and not place_coords and (at_coords or pairs):
        out["launchPhysicalReadiness"] = "PARTIAL_REVIEW_REQUIRED"
        out["uiColor"] = "YELLOW"
        # Experience-only still edge-eligible per gate policy
        if xp:
            out["launchPhysicalReadiness"] = "READY_FOR_EDGE_GENERATION"
            out["uiColor"] = "GREEN"
            out["physicalVerificationState"] = "CURATOR_APPROVED"
            out["curatorApproval"] = "CURATOR_APPROVED"

    # Area / corridor nodes — barrio/area POI from first place pin, plaza/experience from @
    if stgo in {"STGO_11", "STGO_24", "STGO_30", "STGO_91", "STGO_92"}:
        if place_coords and at_coords:
            poi = place_coords[0] if len(place_coords) > 1 else place_coords[-1]
            xp = at_coords[0]
            if (
                poi["lat"] == xp["lat"]
                and poi["lng"] == xp["lng"]
                and len(place_coords) > 1
            ):
                poi = place_coords[0]

    # Composite editorial nodes
    if stgo == "STGO_26":
        if place_coords:
            poi = place_coords[-1]
        if at_coords:
            xp = at_coords[0]

    # La Chascona: founder @ is map center zoom — treat as POI from place link
    if stgo == "STGO_29" and place_coords:
        poi = place_coords[-1]
        xp = at_coords[0] if at_coords else None

    out["poiCoordinate"] = poi
    out["experiencePointCoordinate"] = xp
    if poi:
        out["physicalPoints"].append({"id": "curator_poi", "label": raw["place"], "role": "poi", "coordinate": poi, "provenance": "CURATOR_APPROVED"})
    if xp and (not poi or xp["lat"] != poi["lat"] or xp["lng"] != poi["lng"]):
        out["physicalPoints"].append({"id": "curator_experience", "label": f"{raw['place']} observation", "role": "experience_point", "coordinate": xp, "provenance": "CURATOR_APPROVED"})

    if out["launchPhysicalReadiness"] == "READY_FOR_EDGE_GENERATION" and not poi and not xp:
        out["launchPhysicalReadiness"] = "PARTIAL_REVIEW_REQUIRED"
        out["uiColor"] = "YELLOW"

    return out


def apply_to_engine(engine: dict, normalized: list[dict]) -> dict:
    by_id = {n["stgoId"]: n for n in engine["nodes"]}
    norm_by = {n["stgoId"]: n for n in normalized}
    launch_set = set(EXPECTED_LAUNCH)

    for node in engine["nodes"]:
        sid = node["stgoId"]
        was_launch = node.get("launchCorpus")
        node["launchCorpus"] = sid in launch_set
        node["fieldPriority"] = "LAUNCH" if sid in launch_set else "BACKLOG"
        if sid not in launch_set:
            continue
        norm = norm_by[sid]
        provider_audit = {
            "providerCandidate": deepcopy(node.get("providerCandidate")),
            "providerClassification": node.get("providerClassification"),
            "poiCoordinate": deepcopy(node.get("poiCoordinate")),
            "capturedAt": datetime.now(timezone.utc).isoformat(),
        }
        node["providerAudit"] = provider_audit
        node["displayName"] = norm["founderPlaceName"]
        node["canonicalName"] = norm["founderPlaceName"]
        node["launchPhysicalReadiness"] = norm["launchPhysicalReadiness"]
        node["curatorCuration"] = {
            "gate": "1B.2A",
            "source": "CHRONOWALK_LAUNCH30_CURATOR_FEEDBACK_CLEANED.md",
            "founderPlaceName": norm["founderPlaceName"],
            "googleMapsUrls": norm["googleMapsUrls"],
            "notes": norm.get("notes"),
            "rawFeedbackText": norm["rawFeedbackText"],
            "semanticWarning": norm.get("semanticWarning"),
            "researchBlocker": norm.get("researchBlocker"),
            "coordinateConflict": norm.get("coordinateConflict"),
            "providerDiffMeters": None,
            "curatorOverrideProvider": False,
            "overrideReason": norm.get("overrideReason"),
            "uiColor": norm.get("uiColor"),
        }

        prev_poi = provider_audit.get("poiCoordinate")
        prov = node.get("providerCandidate") or {}
        new_poi = norm.get("poiCoordinate")
        if new_poi:
            node["poiCoordinate"] = {"lat": new_poi["lat"], "lng": new_poi["lng"]}
            node["physicalVerificationState"] = norm["physicalVerificationState"]
            node["curatorApproval"] = norm.get("curatorApproval")
            ref = None
            if prov.get("lat") is not None and prov.get("lng") is not None:
                ref = {"lat": prov["lat"], "lng": prov["lng"]}
            elif prev_poi:
                ref = prev_poi
            if ref:
                d = haversine_m(ref, new_poi)
                node["curatorCuration"]["providerDiffMeters"] = round(d, 1) if d is not None else None
                if d is not None and d > 25:
                    node["curatorCuration"]["curatorOverrideProvider"] = True
                    node["curatorCuration"]["overrideReason"] = (
                        node["curatorCuration"].get("overrideReason")
                        or "Curator POI materially differs from Mapbox provider candidate"
                    )
        else:
            node["poiCoordinate"] = None
            node["physicalVerificationState"] = norm["physicalVerificationState"]
            node["curatorApproval"] = norm.get("curatorApproval")

        node["experiencePointCoordinate"] = (
            {"lat": norm["experiencePointCoordinate"]["lat"], "lng": norm["experiencePointCoordinate"]["lng"]}
            if norm.get("experiencePointCoordinate")
            else None
        )
        node["entranceCoordinate"] = None
        node["physicalPoints"] = norm.get("physicalPoints") or []
        node["accessPoints"] = norm.get("accessPoints") or []
        node["provenance"]["physical"] = {
            **node.get("provenance", {}).get("physical", {}),
            "curatorApproval": "CURATOR_APPROVED" if norm.get("curatorApproval") else "never-automatic",
            "selectionStatus": norm["launchPhysicalReadiness"],
            "humanCurationGate": "1B.2A",
            "humanCurationSource": "founder-google-maps-review",
        }
        if sid == "STGO_23":
            node["identityMissingSource"] = norm["researchBlocker"]
            node["physicalRouteGenerationEligible"] = False
        elif sid == "STGO_33":
            node["physicalRouteGenerationEligible"] = False
        else:
            node["physicalRouteGenerationEligible"] = norm["launchPhysicalReadiness"] == "READY_FOR_EDGE_GENERATION"

    engine["gate"] = "1B.2A"
    engine["launchCorpusStgoIds"] = list(EXPECTED_LAUNCH)
    engine["launchCorpusCount"] = 30
    engine["backlogCount"] = 73
    engine["humanCurationPolicy"] = "Founder Google Maps / Street View review = CURATOR_APPROVED, not FIELD_VERIFIED."
    engine["counts"] = recount(engine["nodes"], launch_set)
    return engine


def recount(nodes: list[dict], launch_set: set[str]) -> dict:
    launch = [n for n in nodes if n["stgoId"] in launch_set]
    return {
        "launch": 30,
        "backlog": 73,
        "curatorApprovedPoi": sum(1 for n in launch if n.get("curatorApproval") == "CURATOR_APPROVED" and n.get("poiCoordinate")),
        "curatorApprovedExperience": sum(1 for n in launch if n.get("experiencePointCoordinate")),
        "accessPoints": sum(len(n.get("accessPoints") or []) for n in launch),
        "readyForEdgeGeneration": sum(1 for n in launch if n.get("launchPhysicalReadiness") == "READY_FOR_EDGE_GENERATION"),
        "partialReviewRequired": sum(1 for n in launch if n.get("launchPhysicalReadiness") == "PARTIAL_REVIEW_REQUIRED"),
        "blocked": sum(1 for n in launch if n.get("launchPhysicalReadiness") in {"UNRESOLVED_RESEARCH_REQUIRED", "NEEDS_SEMANTIC_REVIEW"}),
        "providerOverrides": sum(1 for n in launch if (n.get("curatorCuration") or {}).get("curatorOverrideProvider")),
        "backlogCuratorApproved": sum(1 for n in nodes if n["stgoId"] not in launch_set and n.get("curatorApproval") == "CURATOR_APPROVED"),
        "fieldVerified": sum(1 for n in nodes if n.get("physicalVerificationState") == "FIELD_VERIFIED"),
    }


def main() -> int:
    if not MD.exists():
        print(f"FAIL: missing curator input {MD}")
        return 1

    md = MD.read_text(encoding="utf-8")
    raw_rows = parse_table_rows(md)
    raw_ids = [r["stgoId"] for r in raw_rows]
    if len(raw_rows) != 30:
        print(f"FAIL: expected 30 curator records, got {len(raw_rows)}")
        return 1
    missing = sorted(set(EXPECTED_LAUNCH) - set(raw_ids))
    extra = sorted(set(raw_ids) - set(EXPECTED_LAUNCH))
    if missing or extra:
        print(f"FAIL: launch ID mismatch missing={missing} extra={extra}")
        return 1

    raw_payload = {
        "schemaVersion": "launch30-physical-review.raw.v0.1",
        "gate": "1B.2A",
        "sourceFile": str(MD.relative_to(ROOT)),
        "recordCount": 30,
        "expectedLaunchStgoIds": EXPECTED_LAUNCH,
        "records": raw_rows,
    }
    RAW_OUT.parent.mkdir(parents=True, exist_ok=True)
    RAW_OUT.write_text(json.dumps(raw_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    normalized = [normalize_row(r) for r in raw_rows]
    norm_payload = {
        "schemaVersion": "launch30-physical-review.normalized.v0.1",
        "gate": "1B.2A",
        "recordCount": 30,
        "records": normalized,
    }
    NORM_OUT.write_text(json.dumps(norm_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    engine = apply_to_engine(engine, normalized)
    blob = json.dumps(engine)
    if "pk.ey" in blob or "MAPBOX_ACCESS_TOKEN" in blob:
        print("FAIL: secret leak in engine payload")
        return 1
    ENGINE.write_text(json.dumps(engine, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    launch_payload = {
        "schemaVersion": "launch-corpus.v0.1",
        "cityId": "santiago",
        "gate": "1B.2A",
        "ids": EXPECTED_LAUNCH,
        "stgoIds": EXPECTED_LAUNCH,
        "count": 30,
        "note": "Founder-reviewed launch corpus keyed by canonical STGO IDs (Gate 1B.2A).",
    }
    LAUNCH.write_text(json.dumps(launch_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("INGEST_LAUNCH30=PASS")
    print("records", len(raw_rows))
    print("counts", json.dumps(engine["counts"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
