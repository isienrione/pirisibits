#!/usr/bin/env python3
"""
Gate 1B.1 — Mapbox geocoding for the Santiago launch corpus only.

Rules:
- Load MAPBOX_ACCESS_TOKEN from shell env, else .env.local, else .env via python-dotenv.
- NEVER print the token.
- NEVER write the token into generated JSON.
- No arithmetic / centroid / fake Metro / fake island coordinate fallbacks.
- Mapbox hits are never CURATOR_APPROVED.
- Micro-reveals default to NEEDS_CURATOR_REVIEW unless exceptionally unambiguous.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load_env() -> None:
    """Prefer existing shell env; otherwise load .env.local then .env."""
    try:
        from dotenv import load_dotenv
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "python-dotenv is required. Install scripts/physical-graph/requirements.txt"
        ) from exc

    # Do not override an already-exported token.
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


def token_present() -> bool:
    load_env()
    return bool((os.environ.get("MAPBOX_ACCESS_TOKEN") or "").strip())


SANTIAGO_BBOX = (-70.80, -33.60, -70.50, -33.35)  # metro-ish, still excludes far outliers
SANTIAGO_PROXIMITY = "-70.6505,-33.4378"
# Communes we commonly want for launch identities
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
)
# Street-name collision communes that frequently false-match Centro queries
PENALIZED_COMMUNES = (
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
    "independencia," ,  # only when clearly wrong — keep soft
)


def in_santiago_bbox(lon: float, lat: float) -> bool:
    min_lon, min_lat, max_lon, max_lat = SANTIAGO_BBOX
    return min_lon <= lon <= max_lon and min_lat <= lat <= max_lat


def candidate_rank(c: dict) -> tuple:
    place = (c.get("placeName") or "").lower()
    pref = any(p in place for p in PREFERRED_COMMUNES)
    penal = any(p in place for p in ("maipú,", "maipu,", "la florida,", "cerrillos,", "quilicura,", "renca,", "cerro navia,", "puente alto,", "macul,", "san miguel,"))
    poi = 1 if "poi" in (c.get("placeType") or []) else 0
    locality = 1 if any(t in (c.get("placeType") or []) for t in ("locality", "neighborhood", "place")) else 0
    rel = float(c.get("relevance") or 0)
    # higher is better; sort key negated later
    return (0 if penal else 1, poi, pref, locality, rel)


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
    req = urllib.request.Request(url, headers={"User-Agent": "ChronoWalk-Gate1B1/0.1"})
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
            for p in ("maipú,", "maipu,", "la florida,", "cerrillos,", "quilicura,", "renca,", "cerro navia,", "puente alto,")
        ),
    }


def name_overlap(node_name: str, place_name: str) -> float:
    def toks(s: str) -> set[str]:
        raw = "".join(ch.lower() if ch.isalnum() else " " for ch in (s or ""))
        stop = {"de", "del", "la", "las", "los", "el", "y", "san", "santa", "chile", "santiago", "region", "metropolitana", "barrio", "pasaje", "avenida", "calle"}
        return {t for t in raw.split() if len(t) > 2 and t not in stop}

    a, b = toks(node_name), toks(place_name)
    if not a or not b:
        return 0.0
    return len(a & b) / len(a)


def choose_status(node: dict, candidates: list[dict]) -> tuple[str, dict | None, str]:
    """Return (selectionStatus, selected|None, reason). Never CURATOR_APPROVED."""
    viable = [c for c in candidates if c.get("inSantiagoBbox") and c.get("lat") is not None]
    if not candidates:
        return "NO_RESULT", None, "Mapbox returned no features"
    if not viable:
        return "SUSPICIOUS_OUT_OF_BBOX", None, "All candidates outside Santiago bbox"

    ranked = sorted(viable, key=candidate_rank, reverse=True)
    top = ranked[0]
    rel = float(top.get("relevance") or 0)
    kind = node.get("kind") or ""
    place = (top.get("placeName") or "").lower()
    overlap = name_overlap(node.get("name") or "", top.get("placeName") or "")
    remoteish = str(node.get("neighborhood") or "").endswith("ref") or "remote" in str(node.get("neighborhood") or "")

    if top.get("looksPenalizedCommune"):
        return "SUSPICIOUS_OUT_OF_BBOX", top, "Top ranked hit is a known false-friend commune collision"

    if overlap < 0.2 and rel < 0.95:
        return "SUSPICIOUS_OUT_OF_BBOX", top, f"Low name overlap ({overlap:.2f}) with provider place_name"

    if remoteish:
        return "NEEDS_CURATOR_REVIEW", top, "Remote/reference identity — curator must confirm"

    # Ambiguity among similarly ranked preferred candidates
    if len(ranked) >= 2:
        second = ranked[1]
        if candidate_rank(second)[:4] == candidate_rank(top)[:4] and abs(float(second.get("relevance") or 0) - rel) < 0.05:
            if not second.get("looksPenalizedCommune"):
                return "NEEDS_CURATOR_REVIEW", top, "Ambiguous: multiple near-equal Mapbox candidates"

    # Micro / memory default to curator review unless exceptionally clear POI
    if kind in {"micro", "memory"} and not (
        rel >= 0.95 and overlap >= 0.5 and "poi" in (top.get("placeType") or []) and any(p in place for p in PREFERRED_COMMUNES)
    ):
        return "NEEDS_CURATOR_REVIEW", top, f"kind={kind} requires curator confirmation (overlap={overlap:.2f})"

    preferred = any(p in place for p in PREFERRED_COMMUNES)
    if preferred and overlap >= 0.45 and rel >= 0.85 and (
        "poi" in (top.get("placeType") or []) or kind in {"anchor", "civic", "museum", "plaza", "viewpoint"}
    ):
        return (
            "PROVIDER_SELECTED_HIGH_CONFIDENCE",
            top,
            f"High-confidence provider selection relevance={rel:.3f} overlap={overlap:.2f}",
        )

    if preferred and (overlap >= 0.3 or rel >= 0.75):
        return "NEEDS_CURATOR_REVIEW", top, f"Plausible hit (relevance={rel:.3f}, overlap={overlap:.2f}) — curator review"

    return "NEEDS_CURATOR_REVIEW", top, f"Provider hit needs curator review (relevance={rel:.3f}, overlap={overlap:.2f})"


def enrich_launch(token: str) -> dict:
    identity_path = ROOT / "src/data/santiago/santiago_physical_identity.v0.1.json"
    launch_path = ROOT / "src/data/santiago/santiago_launch_corpus.v0.1.json"
    identity = json.loads(identity_path.read_text(encoding="utf-8"))
    launch = json.loads(launch_path.read_text(encoding="utf-8"))
    launch_ids = list(launch["ids"])
    assert len(launch_ids) == 30, launch_ids

    by_id = {n["id"]: n for n in identity["nodes"]}
    enriched_nodes = []
    for nid in launch_ids:
        base = dict(by_id[nid])
        query = base["geocodeQuery"]
        try:
            raw = mapbox_forward(query, token, limit=5)
        except Exception as exc:
            base.update(
                {
                    "queryUsed": query,
                    "candidates": [],
                    "selectedCandidate": None,
                    "selectionStatus": "NO_RESULT",
                    "selectionReason": f"Mapbox request failed: {type(exc).__name__}",
                    "coordinateStatus": "UNRESOLVED",
                    "physicalState": "NEEDS_CURATOR_REVIEW",
                    "lat": None,
                    "lng": None,
                    "provider": "mapbox",
                    "providerId": None,
                }
            )
            enriched_nodes.append(base)
            time.sleep(0.25)
            continue

        candidates = [feature_to_candidate(f) for f in (raw.get("features") or [])]
        # Drop empty / null-coordinate noise but keep for review if present
        status, selected, reason = choose_status(base, candidates)
        # Do not promote suspicious / city-centroid collapses to node lat/lng.
        promote = bool(selected) and status in {
            "PROVIDER_SELECTED_HIGH_CONFIDENCE",
            "NEEDS_CURATOR_REVIEW",
        }
        place = ((selected or {}).get("placeName") or "").lower()
        city_only = selected and (selected.get("placeType") == ["place"] or place.startswith("santiago, región"))
        if city_only and status == "NEEDS_CURATOR_REVIEW":
            status = "SUSPICIOUS_OUT_OF_BBOX"
            reason = "Collapsed to city-level Santiago centroid — not a POI coordinate"
            promote = False
        base.update(
            {
                "queryUsed": query,
                "candidates": candidates,
                "selectedCandidate": selected,
                "selectionStatus": status,
                "selectionReason": reason,
                "coordinateStatus": "PROVIDER_COORDINATE" if promote else "UNRESOLVED",
                "physicalState": status if status != "PROVIDER_SELECTED_HIGH_CONFIDENCE" else "PROVIDER_SELECTED",
                "lat": selected["lat"] if promote and selected else None,
                "lng": selected["lng"] if promote and selected else None,
                "provider": "mapbox",
                "providerId": selected.get("providerId") if selected else None,
                "relevance": selected.get("relevance") if selected else None,
                # Hard rule: never auto curator-approve
                "curatorApproval": None,
                "physicalStateNote": "Mapbox selection is not CURATOR_APPROVED",
            }
        )
        enriched_nodes.append(base)
        time.sleep(0.35)

    # Preserve full identity list but only launch nodes carry geocode payloads
    proposed = {
        "schemaVersion": "physical-nodes.proposed.v0.1",
        "cityId": "santiago",
        "gate": "1B.1",
        "generatedBy": "enrich_santiago_physical_graph.py",
        "physicalRouteGenerationEnabled": False,
        "autoCuratorApproveFromMapbox": False,
        "launchCorpusIds": launch_ids,
        "identityNodeCount": identity["nodeCount"],
        "launchNodeCount": len(enriched_nodes),
        "coordinatePolicy": "Mapbox provider coordinates only. No arithmetic fallback.",
        "nodes": enriched_nodes,
        "counts": {
            "PROVIDER_SELECTED_HIGH_CONFIDENCE": sum(
                1 for n in enriched_nodes if n["selectionStatus"] == "PROVIDER_SELECTED_HIGH_CONFIDENCE"
            ),
            "NEEDS_CURATOR_REVIEW": sum(
                1 for n in enriched_nodes if n["selectionStatus"] == "NEEDS_CURATOR_REVIEW"
            ),
            "NO_RESULT": sum(1 for n in enriched_nodes if n["selectionStatus"] == "NO_RESULT"),
            "SUSPICIOUS_OUT_OF_BBOX": sum(
                1 for n in enriched_nodes if n["selectionStatus"] == "SUSPICIOUS_OUT_OF_BBOX"
            ),
        },
    }
    return proposed


def main(argv: list[str]) -> int:
    if "--token-check" in argv:
        present = token_present()
        print(f"TOKEN_PRESENT={'true' if present else 'false'}")
        return 0 if present else 2

    load_env()
    token = require_token()
    # Presence only — never print token
    print("TOKEN_PRESENT=true")
    proposed = enrich_launch(token)
    out = ROOT / "src/data/santiago/santiago_physical_nodes.proposed.v0.1.json"
    out.write_text(json.dumps(proposed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {out.relative_to(ROOT)}")
    print("counts", json.dumps(proposed["counts"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
