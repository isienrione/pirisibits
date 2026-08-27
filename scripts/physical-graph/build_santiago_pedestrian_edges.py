#!/usr/bin/env python3
"""
Gate 1B.3 — Build verified Santiago launch pedestrian edge graph via Mapbox Directions.

Rules:
- MAPBOX_ACCESS_TOKEN from env / .env.local / .env only; never logged or persisted.
- Haversine used ONLY for sparse candidate pruning.
- Canonical walk distance/duration from Mapbox walking directions only.
- No thematic / narrative data used.
- PHYSICAL_ROUTE_GENERATION_ENABLED remains false in flags and output.
"""

from __future__ import annotations

import json
import math
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
EDGES_OUT = ROOT / "src/data/santiago/santiago_physical_edges.v0.1.json"
CANDIDATES_OUT = ROOT / "src/data/santiago/qa/santiago_physical_edge_candidates.v0.1.json"
CONSTANTS_TS = ROOT / "src/lib/city-graph/physical-edge-constants.ts"

SANTIAGO_BBOX = (-70.80, -33.60, -70.50, -33.35)
NEAREST_NEIGHBORS = 10
MAX_STRAIGHT_KM = 2.0
GREEN_MAX_MIN = 20
YELLOW_MAX_MIN = 35
ORANGE_MAX_MIN = 60
RATE_LIMIT_S = 0.35

QA_ROUTES = [
    ("STGO_01", "STGO_24", "Plaza de Armas → Lastarria"),
    ("STGO_03", "STGO_07", "La Moneda → Londres 38"),
    ("STGO_24", "STGO_29", "Lastarria → La Chascona"),
    ("STGO_34", "STGO_25", "La Vega → GAM"),
    ("STGO_11", "STGO_48", "Yungay → Museo de la Memoria"),
]

CENTRAL_QA_PAIRS = [
    ("STGO_01", "STGO_02"),
    ("STGO_01", "STGO_03"),
    ("STGO_03", "STGO_04"),
    ("STGO_06", "STGO_07"),
    ("STGO_24", "STGO_25"),
    ("STGO_24", "STGO_26"),
    ("STGO_29", "STGO_32"),
    ("STGO_34", "STGO_35"),
]


def load_env() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError as exc:
        raise SystemExit("python-dotenv required") from exc
    load_dotenv(ROOT / ".env.local", override=False)
    load_dotenv(ROOT / ".env", override=False)


def require_token() -> str:
    token = (os.environ.get("MAPBOX_ACCESS_TOKEN") or "").strip()
    if not token:
        raise SystemExit("MAPBOX_ACCESS_TOKEN missing")
    return token


def haversine_m(a: dict, b: dict) -> float:
    lat1, lon1, lat2, lon2 = map(math.radians, [a["lat"], a["lng"], b["lat"], b["lng"]])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    x = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 6371000 * 2 * math.asin(min(1.0, math.sqrt(x)))


def in_bbox(c: dict) -> bool:
    min_lon, min_lat, max_lon, max_lat = SANTIAGO_BBOX
    return min_lon <= c["lng"] <= max_lon and min_lat <= c["lat"] <= max_lat


def resolve_routing_endpoint(node: dict) -> dict[str, Any] | None:
    sid = node["stgoId"]

    if sid == "STGO_32":
        xp = node.get("experiencePointCoordinate")
        if xp:
            return {
                "stgoId": sid,
                "pointId": "funicular",
                "pointType": "experience_point",
                "coordinate": {"lat": xp["lat"], "lng": xp["lng"]},
                "coordinateSource": "curator_funicular_experience",
            }
        for ap in node.get("accessPoints") or []:
            if ap.get("id") == "funicular" and ap.get("coordinate"):
                c = ap["coordinate"]
                return {
                    "stgoId": sid,
                    "pointId": "funicular",
                    "pointType": "access",
                    "coordinate": {"lat": c["lat"], "lng": c["lng"]},
                    "coordinateSource": "curator_funicular_access",
                }

    xp = node.get("experiencePointCoordinate")
    if xp:
        return {
            "stgoId": sid,
            "pointId": "experience",
            "pointType": "experience_point",
            "coordinate": {"lat": xp["lat"], "lng": xp["lng"]},
            "coordinateSource": "curator_approved_experience",
        }

    poi = node.get("poiCoordinate")
    if poi:
        return {
            "stgoId": sid,
            "pointId": "poi",
            "pointType": "poi",
            "coordinate": {"lat": poi["lat"], "lng": poi["lng"]},
            "coordinateSource": "curator_approved_poi",
        }

    cand = node.get("providerCandidate") or {}
    if cand.get("lat") is not None and cand.get("lng") is not None:
        return {
            "stgoId": sid,
            "pointId": "provider_candidate",
            "pointType": "provider",
            "coordinate": {"lat": cand["lat"], "lng": cand["lng"]},
            "coordinateSource": "provider_derived",
        }
    return None


def classify_duration(duration_min: float) -> str:
    if duration_min <= GREEN_MAX_MIN:
        return "GREEN"
    if duration_min <= YELLOW_MAX_MIN:
        return "YELLOW"
    if duration_min <= ORANGE_MAX_MIN:
        return "ORANGE"
    return "RED"


def edge_id(from_pt: dict, to_pt: dict) -> str:
    return f"WALK|{from_pt['stgoId']}|{from_pt['pointId']}|{to_pt['stgoId']}|{to_pt['pointId']}"


def mapbox_walking(
    token: str, from_c: dict, to_c: dict
) -> tuple[str, dict[str, Any] | None, str | None]:
    coords = f"{from_c['lng']},{from_c['lat']};{to_c['lng']},{to_c['lat']}"
    params = urllib.parse.urlencode(
        {
            "access_token": token,
            "geometries": "geojson",
            "overview": "full",
            "steps": "false",
        }
    )
    url = f"https://api.mapbox.com/directions/v5/mapbox/walking/{coords}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "ChronoWalk-Gate1B3/0.1"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.load(resp)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")[:200]
        return "ERROR", None, f"HTTP {exc.code}: {body}"
    except urllib.error.URLError as exc:
        return "ERROR", None, str(exc.reason)

    routes = data.get("routes") or []
    if not routes:
        return "NO_ROUTE", None, data.get("code") or "NoRoute"
    route = routes[0]
    return "OK", route, data.get("uuid") or route.get("weight_name")


def generate_candidates(
    endpoints: dict[str, dict], eligible_ids: list[str]
) -> list[tuple[str, str, float]]:
    pairs: set[tuple[str, str]] = set()
    meta: dict[tuple[str, str], float] = {}

    for sid in eligible_ids:
        ep = endpoints[sid]
        c = ep["coordinate"]
        dists: list[tuple[float, str]] = []
        for other in eligible_ids:
            if other == sid:
                continue
            d = haversine_m(c, endpoints[other]["coordinate"])
            dists.append((d, other))
        dists.sort(key=lambda x: x[0])
        for d, other in dists[:NEAREST_NEIGHBORS]:
            pairs.add((sid, other))
            meta[(sid, other)] = d
        for d, other in dists:
            if d <= MAX_STRAIGHT_KM * 1000:
                pairs.add((sid, other))
                meta[(sid, other)] = d

    for a, b in CENTRAL_QA_PAIRS:
        if a in endpoints and b in endpoints:
            pairs.add((a, b))
            pairs.add((b, a))
            meta[(a, b)] = haversine_m(endpoints[a]["coordinate"], endpoints[b]["coordinate"])
            meta[(b, a)] = haversine_m(endpoints[b]["coordinate"], endpoints[a]["coordinate"])

    out = [(a, b, meta.get((a, b), 0.0)) for a, b in sorted(pairs)]
    return out


def build_physical_cost(distance_m: float, duration_s: float) -> dict:
    duration_min = round(duration_s / 60.0, 2)
    return {
        "distanceM": round(distance_m, 1),
        "durationS": round(duration_s, 1),
        "durationMin": duration_min,
        "baseProvider": "mapbox",
        "stepFree": None,
        "surfaceRoughness": None,
        "crossingFriction": None,
        "inclineFriction": None,
        "crowdFriction": None,
        "pleasantness": None,
    }


def graph_health(runtime_edges: list[dict], eligible_ids: list[str]) -> dict:
    out_adj: dict[str, list[str]] = defaultdict(list)
    in_adj: dict[str, list[str]] = defaultdict(list)
    for e in runtime_edges:
        out_adj[e["fromPoiId"]].append(e["toPoiId"])
        in_adj[e["toPoiId"]].append(e["fromPoiId"])

    isolated = [sid for sid in eligible_ids if not out_adj[sid] and not in_adj[sid]]
    out_deg = [len(out_adj[sid]) for sid in eligible_ids]
    in_deg = [len(in_adj[sid]) for sid in eligible_ids]

    # Connected components (undirected on runtime edges)
    parent = {sid: sid for sid in eligible_ids}

    def find(x: str) -> str:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: str, b: str) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    for e in runtime_edges:
        union(e["fromPoiId"], e["toPoiId"])
    components: dict[str, list[str]] = defaultdict(list)
    for sid in eligible_ids:
        components[find(sid)].append(sid)

    dists = [e["distanceM"] for e in runtime_edges]
    durs = [e["durationMin"] for e in runtime_edges]
    dists.sort()
    durs.sort()
    med_dist = dists[len(dists) // 2] if dists else 0
    med_dur = durs[len(durs) // 2] if durs else 0

    return {
        "eligibleNodes": len(eligible_ids),
        "nodesWithOutgoing": sum(1 for sid in eligible_ids if out_adj[sid]),
        "nodesWithIncoming": sum(1 for sid in eligible_ids if in_adj[sid]),
        "isolatedNodes": isolated,
        "averageOutDegree": round(sum(out_deg) / len(out_deg), 2) if out_deg else 0,
        "medianEdgeDistanceM": med_dist,
        "medianEdgeDurationMin": med_dur,
        "connectedComponentCount": len(components),
        "largestComponentSize": max(len(v) for v in components.values()) if components else 0,
    }


def shortest_path_qa(
    runtime_edges: list[dict], start: str, end: str
) -> dict[str, Any]:
    adj: dict[str, list[dict]] = defaultdict(list)
    for e in runtime_edges:
        adj[e["fromPoiId"]].append(e)

    dist = {start: 0.0}
    prev: dict[str, dict | None] = {start: None}
    visited: set[str] = set()
    pq = [start]

    while pq:
        pq.sort(key=lambda n: dist.get(n, float("inf")))
        node = pq.pop(0)
        if node in visited:
            continue
        visited.add(node)
        if node == end:
            break
        for e in adj.get(node, []):
            nd = dist[node] + e["durationMin"]
            if nd < dist.get(e["toPoiId"], float("inf")):
                dist[e["toPoiId"]] = nd
                prev[e["toPoiId"]] = e
                pq.append(e["toPoiId"])

    if end not in dist or end == start and start != end:
        return {"connected": False, "reason": "No runtime walking path within launch pedestrian graph"}

    legs: list[dict] = []
    cur = end
    while prev.get(cur):
        e = prev[cur]
        assert e is not None
        legs.append(
            {
                "from": e["fromPoiId"],
                "to": e["toPoiId"],
                "distanceM": e["distanceM"],
                "durationMin": e["durationMin"],
                "classification": e["physicalClassification"],
                "edgeId": e["edgeId"],
            }
        )
        cur = e["fromPoiId"]
    legs.reverse()
    return {
        "connected": True,
        "totalDurationMin": round(dist[end], 2),
        "totalDistanceM": round(sum(l["distanceM"] for l in legs), 1),
        "legCount": len(legs),
        "nodes": [start] + [l["to"] for l in legs],
        "legs": legs,
    }


def main() -> int:
    load_env()
    token = require_token()

    if not ENGINE.exists():
        print("FAIL: missing engine nodes")
        return 1

    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    nodes_by_id = {n["stgoId"]: n for n in engine["nodes"]}

    eligible = [
        n
        for n in engine["nodes"]
        if n.get("launchCorpus") and n.get("physicalRouteGenerationEligible") is True
        and n.get("launchPhysicalReadiness") == "READY_FOR_EDGE_GENERATION"
    ]
    eligible_ids = sorted(n["stgoId"] for n in eligible)

    excluded = []
    for n in engine["nodes"]:
        if not n.get("launchCorpus"):
            continue
        if n["stgoId"] in eligible_ids:
            continue
        reason = n.get("launchPhysicalReadiness") or "not edge-eligible"
        if n["stgoId"] == "STGO_05":
            reason = "PARTIAL_REVIEW_REQUIRED — excluded from runtime edge generation"
        excluded.append({"stgoId": n["stgoId"], "reason": reason})

    endpoints: dict[str, dict] = {}
    for n in eligible:
        ep = resolve_routing_endpoint(n)
        if not ep or not in_bbox(ep["coordinate"]):
            print(f"FAIL: no valid routing endpoint for {n['stgoId']}")
            return 1
        endpoints[n["stgoId"]] = ep

    candidates = generate_candidates(endpoints, eligible_ids)
    print(f"CANDIDATE_PAIRS={len(candidates)}")

    checked_at = datetime.now(timezone.utc).isoformat()
    all_edges: list[dict] = []
    candidate_records: list[dict] = []
    routing_ok = 0
    routing_fail = 0

    for i, (from_id, to_id, sl_m) in enumerate(candidates):
        from_pt = endpoints[from_id]
        to_pt = endpoints[to_id]
        eid = edge_id(from_pt, to_pt)
        rec: dict[str, Any] = {
            "fromStgoId": from_id,
            "toStgoId": to_id,
            "edgeId": eid,
            "candidateStraightLineM": round(sl_m, 1),
            "selfEdge": from_id == to_id,
        }

        if from_id == to_id:
            rec["routingStatus"] = "SKIPPED_SELF"
            candidate_records.append(rec)
            continue

        status, route, ref = mapbox_walking(token, from_pt["coordinate"], to_pt["coordinate"])
        time.sleep(RATE_LIMIT_S)

        if status != "OK" or not route:
            routing_fail += 1
            rec["routingStatus"] = status
            rec["failureReason"] = ref
            candidate_records.append(rec)
            fail_edge = {
                "edgeId": eid,
                "fromPoiId": from_id,
                "toPoiId": to_id,
                "fromPoint": from_pt,
                "toPoint": to_pt,
                "mode": "WALK",
                "distanceM": 0,
                "durationS": 0,
                "durationMin": 0,
                "physicalCost": None,
                "provider": "mapbox",
                "providerReference": ref,
                "geometry": None,
                "physicalClassification": "RED",
                "provenance": {
                    "provider": "mapbox",
                    "providerReference": ref,
                    "routingProfile": "mapbox/walking",
                    "routingStatus": status,
                    "checkedAt": checked_at,
                    "candidateStraightLineM": round(sl_m, 1),
                    "responseSummary": ref,
                },
                "curatorStatus": "PROVIDER_DERIVED",
                "runtimeEligible": False,
                "uncertaintyFlags": ["PROVIDER_FAILED"],
                "pruned": True,
                "pruneReason": ref or status,
            }
            all_edges.append(fail_edge)
            continue

        routing_ok += 1
        distance_m = float(route["distance"])
        duration_s = float(route["duration"])
        duration_min = round(duration_s / 60.0, 2)
        pclass = classify_duration(duration_min)
        runtime = pclass in {"GREEN", "YELLOW"} and distance_m > 0 and duration_s > 0
        prune_reason = None
        flags: list[str] = []
        if pclass == "RED":
            runtime = False
            prune_reason = f"duration>{ORANGE_MAX_MIN}min"
            flags.append("EXCESSIVE_WALK_DURATION")
        elif pclass == "ORANGE":
            runtime = False
            prune_reason = "ORANGE_high_burden_transition"
            flags.append("HIGH_BURDEN_TRANSITION")

        geom = route.get("geometry")
        geometry = None
        if geom and geom.get("type") == "LineString":
            geometry = {"type": "LineString", "coordinates": geom.get("coordinates") or []}

        edge = {
            "edgeId": eid,
            "fromPoiId": from_id,
            "toPoiId": to_id,
            "fromPoint": from_pt,
            "toPoint": to_pt,
            "mode": "WALK",
            "distanceM": round(distance_m, 1),
            "durationS": round(duration_s, 1),
            "durationMin": duration_min,
            "physicalCost": build_physical_cost(distance_m, duration_s),
            "provider": "mapbox",
            "providerReference": ref,
            "geometry": geometry,
            "physicalClassification": pclass,
            "provenance": {
                "provider": "mapbox",
                "providerReference": ref,
                "routingProfile": "mapbox/walking",
                "routingStatus": "OK",
                "checkedAt": checked_at,
                "candidateStraightLineM": round(sl_m, 1),
                "responseSummary": f"distance={distance_m:.0f}m duration={duration_s:.0f}s",
            },
            "curatorStatus": "PROVIDER_DERIVED",
            "runtimeEligible": runtime,
            "uncertaintyFlags": flags,
            "pruned": not runtime,
            "pruneReason": prune_reason,
        }
        all_edges.append(edge)
        rec["routingStatus"] = "OK"
        rec["distanceM"] = edge["distanceM"]
        rec["durationMin"] = duration_min
        rec["classification"] = pclass
        candidate_records.append(rec)

        if (i + 1) % 25 == 0:
            print(f"  routed {i + 1}/{len(candidates)} ok={routing_ok} fail={routing_fail}")

    runtime_edges = [e for e in all_edges if e.get("runtimeEligible")]
    health = graph_health(runtime_edges, eligible_ids)

    qa_results = []
    for start, end, label in QA_ROUTES:
        path = shortest_path_qa(runtime_edges, start, end)
        qa_results.append({"label": label, "from": start, "to": end, **path})

    central_checks = []
    for a, b in CENTRAL_QA_PAIRS:
        direct = next(
            (e for e in all_edges if e["fromPoiId"] == a and e["toPoiId"] == b and e["provenance"]["routingStatus"] == "OK"),
            None,
        )
        central_checks.append(
            {
                "pair": f"{a}→{b}",
                "directEdgeExists": direct is not None,
                "classification": direct.get("physicalClassification") if direct else None,
                "durationMin": direct.get("durationMin") if direct else None,
                "runtimeEligible": direct.get("runtimeEligible") if direct else False,
            }
        )

    class_counts = defaultdict(int)
    for e in all_edges:
        if e["provenance"]["routingStatus"] == "OK":
            class_counts[e["physicalClassification"]] += 1
    pruned_count = sum(1 for e in all_edges if e.get("pruned"))

    payload = {
        "schemaVersion": "santiago-physical-edges.v0.1",
        "cityId": "santiago",
        "gate": "1B.3",
        "mode": "WALK",
        "physicalRouteGenerationEnabled": False,
        "provider": "mapbox",
        "generatedAt": checked_at,
        "eligibleNodeCount": len(eligible_ids),
        "eligibleStgoIds": eligible_ids,
        "excludedStgoIds": excluded,
        "counts": {
            "candidateDirectedPairs": len(candidates),
            "mapboxRoutingSuccessful": routing_ok,
            "mapboxRoutingFailures": routing_fail,
            "canonicalEdgesTotal": len(all_edges),
            "runtimeWalkEdges": len(runtime_edges),
            "GREEN": class_counts["GREEN"],
            "YELLOW": class_counts["YELLOW"],
            "ORANGE": class_counts["ORANGE"],
            "RED": class_counts["RED"] + sum(1 for e in all_edges if e["provenance"]["routingStatus"] != "OK"),
            "prunedCandidates": pruned_count,
        },
        "graphHealth": {**health, "centralPairChecks": central_checks},
        "qaRoutes": qa_results,
        "referenceMatrixStatus": "REFERENCE_MATRIX_NOT_PRESENT",
        "referenceMatrixComparison": [],
        "edges": all_edges,
    }

    blob = json.dumps(payload)
    if "pk.ey" in blob or "MAPBOX_ACCESS_TOKEN" in blob:
        print("FAIL: secret leak in edge payload")
        return 1

    EDGES_OUT.parent.mkdir(parents=True, exist_ok=True)
    EDGES_OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    CANDIDATES_OUT.parent.mkdir(parents=True, exist_ok=True)
    CANDIDATES_OUT.write_text(
        json.dumps(
            {
                "schemaVersion": "santiago-physical-edge-candidates.v0.1",
                "gate": "1B.3",
                "note": "QA/debug candidate generation — not canonical truth",
                "generatedAt": checked_at,
                "records": candidate_records,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print("BUILD_PEDESTRIAN_EDGES=PASS")
    print("eligible", len(eligible_ids))
    print("candidates", len(candidates))
    print("routing_ok", routing_ok, "routing_fail", routing_fail)
    print("runtime_edges", len(runtime_edges))
    print("counts", json.dumps(payload["counts"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
