#!/usr/bin/env python3
"""
Gate 1B.2 — Provider enrichment for the FULL 103-node Santiago engine inventory.

Rules:
- MAPBOX_ACCESS_TOKEN from env / .env.local / .env only.
- NEVER print, commit, or write the token into JSON/reports.
- Provider hits are candidates only — never CURATOR_APPROVED.
- Do not auto-fill entrance or experience-point coordinates.
- Do not invent Metro distances.
- Identity-unresolved nodes are not geocoded (NO_RESULT / skipped).
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"

# Reuse Gate 1B.1 ranking helpers by importing sibling module pieces inline
# (keep this file self-contained for cloud agents).

SANTIAGO_BBOX = (-70.80, -33.60, -70.50, -33.35)
SANTIAGO_PROXIMITY = "-70.6505,-33.4378"
PREFERRED_COMMUNES = (
    "santiago,",
    "recoleta,",
    "providencia,",
    "ñuñoa,",
    "nunoa,",
    "quinta normal,",
    "peñalolén,",
    "penalolen,",
    "estación central,",
    "estacion central,",
    "independencia,",
    "las condes,",
    "vitacura,",
    "maipú,",  # allowed only when identity is actually Maipú
)


def load_env() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "python-dotenv is required. Install scripts/physical-graph/requirements.txt"
        ) from exc
    load_dotenv(ROOT / ".env.local", override=False)
    load_dotenv(ROOT / ".env", override=False)


def require_token() -> str:
    token = (os.environ.get("MAPBOX_ACCESS_TOKEN") or "").strip()
    if not token:
        raise SystemExit(
            "MAPBOX_ACCESS_TOKEN missing. Set it in the environment or repo-root "
            ".env.local / .env (gitignored)."
        )
    return token


def in_santiago_bbox(lon: float, lat: float) -> bool:
    min_lon, min_lat, max_lon, max_lat = SANTIAGO_BBOX
    return min_lon <= lon <= max_lon and min_lat <= lat <= max_lat


def candidate_rank(c: dict, *, node_name: str = "") -> tuple:
    place = (c.get("placeName") or "").lower()
    pref = any(p in place for p in PREFERRED_COMMUNES[:12])  # exclude maipú default prefer
    penal = any(
        p in place
        for p in (
            "maipú,",
            "maipu,",
            "la florida,",
            "cerrillos,",
            "quilicura,",
            "renca,",
            "cerro navia,",
            "puente alto,",
            "macul,",
            "san miguel,",
        )
    )
    poi = 1 if "poi" in (c.get("placeType") or []) else 0
    # Prefer address/poi text over pure road / city collapses when names overlap.
    roadish = 1 if any(t in (c.get("placeType") or []) for t in ("address",)) else 0
    locality = 1 if any(t in (c.get("placeType") or []) for t in ("locality", "neighborhood", "place")) else 0
    rel = float(c.get("relevance") or 0)
    overlap = name_overlap(node_name, c.get("placeName") or "")
    # higher is better
    return (0 if penal else 1, round(overlap, 2), poi, roadish, pref, 0 if locality else 1, rel)


def mapbox_forward(query: str, token: str, *, limit: int = 5) -> dict:
    encoded = urllib.parse.quote(query)
    params = urllib.parse.urlencode(
        {
            "access_token": token,
            "limit": str(limit),
            "language": "es",
            "country": "CL",
            "proximity": SANTIAGO_PROXIMITY,
            "bbox": ",".join(str(x) for x in SANTIAGO_BBOX),
        }
    )
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{encoded}.json?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "ChronoWalk-Gate1B2/0.1"})
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")[:300]
        raise RuntimeError(f"Mapbox HTTP {exc.code}: {body}") from exc


def feature_to_candidate(feat: dict) -> dict:
    center = feat.get("center") or [None, None]
    lon, lat = center[0], center[1]
    place_name = feat.get("place_name") or ""
    return {
        "provider": "mapbox",
        "providerId": feat.get("id"),
        "placeName": place_name,
        "text": feat.get("text"),
        "relevance": feat.get("relevance"),
        "accuracy": (feat.get("properties") or {}).get("accuracy"),
        "category": (feat.get("properties") or {}).get("category"),
        "lng": lon,
        "lat": lat,
        "inSantiagoBbox": bool(lon is not None and lat is not None and in_santiago_bbox(lon, lat)),
        "placeType": feat.get("place_type") or [],
        "looksPenalizedCommune": any(
            p in place_name.lower()
            for p in (
                "maipú,",
                "maipu,",
                "la florida,",
                "cerrillos,",
                "quilicura,",
                "renca,",
                "cerro navia,",
                "puente alto,",
            )
        ),
    }


def name_overlap(node_name: str, place_name: str) -> float:
    def toks(s: str) -> set[str]:
        raw = "".join(ch.lower() if ch.isalnum() else " " for ch in (s or ""))
        stop = {
            "de",
            "del",
            "la",
            "las",
            "los",
            "el",
            "y",
            "san",
            "santa",
            "chile",
            "santiago",
            "region",
            "metropolitana",
            "barrio",
            "pasaje",
            "avenida",
            "calle",
            "centro",
            "cultural",
        }
        return {t for t in raw.split() if len(t) > 2 and t not in stop}

    a, b = toks(node_name), toks(place_name)
    if not a or not b:
        return 0.0
    return len(a & b) / len(a)


def to_classification(status: str) -> str:
    return {
        "PROVIDER_SELECTED_HIGH_CONFIDENCE": "AUTO_HIGH_CONFIDENCE",
        "NEEDS_CURATOR_REVIEW": "NEEDS_CURATOR_REVIEW",
        "SUSPICIOUS_OUT_OF_BBOX": "SUSPICIOUS",
        "NO_RESULT": "NO_RESULT",
    }.get(status, status)


def choose_status(node: dict, candidates: list[dict]) -> tuple[str, dict | None, str]:
    viable = [c for c in candidates if c.get("inSantiagoBbox") and c.get("lat") is not None]
    if not candidates:
        return "NO_RESULT", None, "Mapbox returned no features"
    if not viable:
        return "SUSPICIOUS_OUT_OF_BBOX", None, "All candidates outside Santiago bbox"

    name = node.get("canonicalName") or node.get("displayName") or ""
    ranked = sorted(viable, key=lambda c: candidate_rank(c, node_name=name), reverse=True)
    top = ranked[0]
    rel = float(top.get("relevance") or 0)
    kind = node.get("_kind") or node.get("editorialRole") or ""
    place = (top.get("placeName") or "").lower()
    overlap = name_overlap(name, top.get("placeName") or "")
    nb = str(node.get("neighborhood") or "")
    remoteish = nb.endswith("ref") or "remote" in nb

    if top.get("looksPenalizedCommune") and "maipú" not in nb.lower() and "maipu" not in nb.lower():
        return "SUSPICIOUS_OUT_OF_BBOX", top, "Top ranked hit is a known false-friend commune collision"

    if overlap < 0.2 and rel < 0.95:
        return "SUSPICIOUS_OUT_OF_BBOX", top, f"Low name overlap ({overlap:.2f}) with provider place_name"

    # Street/avenue hits that ignore the institution name stay suspicious even if relevance is high.
    if overlap < 0.25 and any(t in (top.get("placeType") or []) for t in ("address", "street", "road")):
        return "SUSPICIOUS_OUT_OF_BBOX", top, f"Street/address hit with low name overlap ({overlap:.2f})"

    if remoteish:
        return "NEEDS_CURATOR_REVIEW", top, "Remote/reference identity — curator must confirm"

    if len(ranked) >= 2:
        second = ranked[1]
        if candidate_rank(second, node_name=name)[:5] == candidate_rank(top, node_name=name)[:5] and abs(
            float(second.get("relevance") or 0) - rel
        ) < 0.05:
            if not second.get("looksPenalizedCommune"):
                return "NEEDS_CURATOR_REVIEW", top, "Ambiguous: multiple near-equal Mapbox candidates"

    if kind in {"micro", "memory"} and not (
        rel >= 0.95
        and overlap >= 0.5
        and "poi" in (top.get("placeType") or [])
        and any(p in place for p in PREFERRED_COMMUNES[:12])
    ):
        return "NEEDS_CURATOR_REVIEW", top, f"kind={kind} requires curator confirmation (overlap={overlap:.2f})"

    preferred = any(p in place for p in PREFERRED_COMMUNES[:12])
    if preferred and overlap >= 0.45 and rel >= 0.85 and (
        "poi" in (top.get("placeType") or [])
        or kind in {"anchor", "civic", "museum", "plaza", "viewpoint", "nature", "architecture", "culture", "market", "barrio"}
    ):
        return (
            "PROVIDER_SELECTED_HIGH_CONFIDENCE",
            top,
            f"High-confidence provider selection relevance={rel:.3f} overlap={overlap:.2f}",
        )

    if preferred and (overlap >= 0.3 or rel >= 0.75):
        return "NEEDS_CURATOR_REVIEW", top, f"Plausible hit (relevance={rel:.3f}, overlap={overlap:.2f}) — curator review"

    return "NEEDS_CURATOR_REVIEW", top, f"Provider hit needs curator review (relevance={rel:.3f}, overlap={overlap:.2f})"


def enrich_node(node: dict, token: str) -> dict:
    # Never mutate identity fields from provider.
    identity_name = node.get("canonicalName")
    identity_slug = node.get("legacySlug")
    stgo = node.get("stgoId")

    if node.get("identityStatus") == "UNRESOLVED" or not node.get("geocodeQuery"):
        node.update(
            {
                "queryUsed": None,
                "candidates": [],
                "providerCandidate": None,
                "providerClassification": "NO_RESULT",
                "selectionReason": "Identity unresolved or missing geocode query — enrichment skipped",
                "physicalVerificationState": "UNRESOLVED",
                "poiCoordinate": None,
                "entranceCoordinate": None,
                "experiencePointCoordinate": None,
                "providerId": None,
                "curatorApproval": None,
            }
        )
        node["provenance"]["physical"] = {
            "provider": None,
            "coordinatePolicy": "mapbox-only-no-arithmetic-fallback",
            "curatorApproval": "never-automatic",
            "selectionStatus": "NO_RESULT",
        }
        assert node["canonicalName"] == identity_name
        assert node["legacySlug"] == identity_slug
        assert node["stgoId"] == stgo
        return node

    query = node["geocodeQuery"]
    try:
        raw = mapbox_forward(query, token, limit=5)
        candidates = [feature_to_candidate(f) for f in (raw.get("features") or [])]
    except Exception as exc:
        node.update(
            {
                "queryUsed": query,
                "candidates": [],
                "providerCandidate": None,
                "providerClassification": "NO_RESULT",
                "selectionReason": f"Mapbox request failed: {type(exc).__name__}",
                "physicalVerificationState": "NO_RESULT",
                "poiCoordinate": None,
                "providerId": None,
                "curatorApproval": None,
            }
        )
        node["provenance"]["physical"]["selectionStatus"] = "NO_RESULT"
        node["provenance"]["physical"]["provider"] = "mapbox"
        return node

    status, selected, reason = choose_status(node, candidates)
    promote = bool(selected) and status in {
        "PROVIDER_SELECTED_HIGH_CONFIDENCE",
        "NEEDS_CURATOR_REVIEW",
    }
    place = ((selected or {}).get("placeName") or "").lower()
    city_only = selected and (
        selected.get("placeType") == ["place"] or place.startswith("santiago, región")
    )
    if city_only and status == "NEEDS_CURATOR_REVIEW":
        status = "SUSPICIOUS_OUT_OF_BBOX"
        reason = "Collapsed to city-level Santiago centroid — not a POI coordinate"
        promote = False

    classification = to_classification(status)
    physical_state = {
        "AUTO_HIGH_CONFIDENCE": "PROVIDER_DERIVED",
        "NEEDS_CURATOR_REVIEW": "NEEDS_CURATOR_REVIEW",
        "SUSPICIOUS": "SUSPICIOUS",
        "NO_RESULT": "NO_RESULT",
    }[classification]

    node.update(
        {
            "queryUsed": query,
            "candidates": candidates,
            "providerCandidate": selected,
            "providerClassification": classification,
            "selectionReason": reason,
            "physicalVerificationState": physical_state,
            # Promote POI candidate only — never entrance / experience-point.
            "poiCoordinate": (
                {"lat": selected["lat"], "lng": selected["lng"]}
                if promote and selected and selected.get("lat") is not None
                else None
            ),
            "entranceCoordinate": None,
            "experiencePointCoordinate": None,
            "providerId": selected.get("providerId") if selected else None,
            "curatorApproval": None,
        }
    )
    node["provenance"]["physical"] = {
        "provider": "mapbox",
        "coordinatePolicy": "mapbox-only-no-arithmetic-fallback",
        "curatorApproval": "never-automatic",
        "selectionStatus": classification,
    }

    # Identity immutability guard
    assert node["stgoId"] == stgo
    assert node["legacySlug"] == identity_slug
    assert node["canonicalName"] == identity_name
    assert node["curatorApproval"] is None
    assert node["entranceCoordinate"] is None
    assert node["experiencePointCoordinate"] is None
    return node


def demote_coordinate_collisions(nodes: list[dict]) -> int:
    """If ≥3 nodes share an identical promoted POI pin, demote all to SUSPICIOUS.

    Typical failure: Mapbox collapses many 'Plaza *' queries onto one generic plaza.
    Returns number of nodes demoted.
    """
    from collections import defaultdict

    buckets: dict[tuple[float, float], list[dict]] = defaultdict(list)
    for n in nodes:
        poi = n.get("poiCoordinate")
        if not poi or poi.get("lat") is None:
            continue
        key = (round(float(poi["lat"]), 5), round(float(poi["lng"]), 5))
        buckets[key].append(n)

    demoted = 0
    for key, group in buckets.items():
        if len(group) < 3:
            continue
        for n in group:
            n["providerClassification"] = "SUSPICIOUS"
            n["physicalVerificationState"] = "SUSPICIOUS"
            n["selectionReason"] = (
                f"Shared identical provider pin {key} across {len(group)} nodes — "
                "likely city/plaza collapse; curator must disambiguate"
            )
            n["poiCoordinate"] = None
            # Keep providerCandidate for curator review context
            n["provenance"]["physical"]["selectionStatus"] = "SUSPICIOUS"
            demoted += 1
    return demoted


def recount(nodes: list[dict]) -> dict:
    def c(cls: str) -> int:
        return sum(1 for n in nodes if n.get("providerClassification") == cls)

    return {
        "identityResolved": sum(1 for n in nodes if n["identityStatus"] == "RESOLVED"),
        "identityUnresolved": sum(1 for n in nodes if n["identityStatus"] == "UNRESOLVED"),
        "launch": sum(1 for n in nodes if n["launchCorpus"]),
        "backlog": sum(1 for n in nodes if not n["launchCorpus"]),
        "AUTO_HIGH_CONFIDENCE": c("AUTO_HIGH_CONFIDENCE"),
        "NEEDS_CURATOR_REVIEW": c("NEEDS_CURATOR_REVIEW"),
        "SUSPICIOUS": c("SUSPICIOUS"),
        "NO_RESULT": c("NO_RESULT"),
        "CURATOR_APPROVED": sum(1 for n in nodes if n.get("curatorApproval") is not None or n.get("physicalVerificationState") == "CURATOR_APPROVED"),
        "entranceResolved": sum(1 for n in nodes if n.get("entranceCoordinate") is not None),
        "experiencePointResolved": sum(1 for n in nodes if n.get("experiencePointCoordinate") is not None),
        "legacyResolved": sum(1 for n in nodes if n["legacyMappingStatus"] == "resolved"),
        "legacyProposed": sum(1 for n in nodes if n["legacyMappingStatus"] == "proposed"),
        "legacyUnresolved": sum(1 for n in nodes if n["legacyMappingStatus"] == "unresolved"),
    }


def strip_internal(nodes: list[dict]) -> None:
    for n in nodes:
        n.pop("_kind", None)


def main(argv: list[str]) -> int:
    if "--token-check" in argv:
        load_env()
        present = bool((os.environ.get("MAPBOX_ACCESS_TOKEN") or "").strip())
        print(f"TOKEN_PRESENT={'true' if present else 'false'}")
        return 0 if present else 2

    if not ENGINE.exists():
        raise SystemExit(f"Missing {ENGINE} — run build_santiago_engine_nodes.py first")

    load_env()
    token = require_token()
    print("TOKEN_PRESENT=true")

    data = json.loads(ENGINE.read_text(encoding="utf-8"))
    nodes = data["nodes"]
    assert len(nodes) == 103

    for i, node in enumerate(nodes, start=1):
        enrich_node(node, token)
        if i % 10 == 0:
            print(f"enriched {i}/103")
        time.sleep(0.30)

    demoted = demote_coordinate_collisions(nodes)
    print(f"collision_demotions={demoted}")
    strip_internal(nodes)
    data["gate"] = "1B.2"
    data["physicalRouteGenerationEnabled"] = False
    data["autoCuratorApproveFromMapbox"] = False
    data["counts"] = recount(nodes)
    # Secret scan before write
    blob = json.dumps(data)
    if "pk.ey" in blob or "MAPBOX_ACCESS_TOKEN" in blob:
        raise SystemExit("Refusing to write: possible token leak in payload")

    ENGINE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {ENGINE.relative_to(ROOT)}")
    print("counts", json.dumps(data["counts"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
