#!/usr/bin/env python3
"""
Gate 1B.4 — Santiago multimodal physical graph builder.

Preserves Gate 1B.3 provider WALK edges.
Creates sparse operational adjacency, OSM-backed Metro topology,
Mapbox-backed POI↔Metro access, and multimodal QA routes.

Rules:
- Never invent coordinates or observed transit times.
- ENGINE POLICY frictions ≠ observed travel time.
- No thematic/narrative scoring.
- PHYSICAL_ROUTE_GENERATION_ENABLED remains false.
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
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
PROVIDER_EDGES = ROOT / "src/data/santiago/santiago_physical_edges.v0.1.json"
ADJ_OUT = ROOT / "src/data/santiago/santiago_pedestrian_adjacency.v0.1.json"
STATIONS_OUT = ROOT / "src/data/santiago/transit/santiago_metro_stations.v0.1.json"
LINES_OUT = ROOT / "src/data/santiago/transit/santiago_metro_lines.v0.1.json"
MULTI_OUT = ROOT / "src/data/santiago/santiago_multimodal_graph.v0.1.json"
ACCESS_QA = ROOT / "src/data/santiago/qa/santiago_poi_metro_access_candidates.v0.1.json"
OSM_CACHE = Path("/tmp/metro-osm/stations.json")

# Sparse adjacency
SPARSE_ALWAYS_KEEP_MAX_MIN = 8.0
SPARSE_NEAREST_NEIGHBORS = 4
SPARSE_REDUNDANT_DIRECT_MIN = 18.0
SPARSE_MAX_OPERATIONAL_MIN = 25.0

# Metro access
METRO_ACCESS_CANDIDATE_MAX_KM = 1.2
METRO_ACCESS_USEFUL_MAX_MIN = 15.0
METRO_ACCESS_MAX_PER_POI = 2

# Engine policy (NOT observed time)
ENGINE_POLICY_METRO_ENTRY_FRICTION_S = 180
ENGINE_POLICY_METRO_TRANSFER_FRICTION_S = 240
ENGINE_POLICY_MODE_CHANGE_FRICTION_S = 60
ENGINE_POLICY_LONG_WALK_DISCOMFORT_FACTOR = 1.15
ENGINE_POLICY_METRO_HOP_FALLBACK_S = 120

PRIMARY_LINE_RELATIONS = {
    "L1": 444963,
    "L2": 3636603,
    "L3": 2193874,
    "L4": 444961,
    "L4A": 444982,
    "L5": 444964,
    "L6": 444976,
    "L7": 15789478,
}

QA_ROUTES = [
    ("STGO_01", "STGO_24", "Plaza de Armas → Lastarria"),
    ("STGO_03", "STGO_07", "La Moneda → Londres 38"),
    ("STGO_24", "STGO_29", "Lastarria → La Chascona"),
    ("STGO_34", "STGO_25", "La Vega → GAM"),
    ("STGO_11", "STGO_48", "Yungay → Museo de la Memoria"),
    ("STGO_01", "STGO_48", "Centro → Museo de la Memoria"),
    ("STGO_01", "STGO_11", "Centro → Yungay"),
    ("STGO_01", "STGO_27", "Centro → Plaza Ñuñoa"),
]


def load_env() -> None:
    from dotenv import load_dotenv

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


def walk_generalized_cost_s(duration_s: float) -> float:
    """Observed walk duration plus ENGINE POLICY long-walk discomfort only."""
    threshold = SPARSE_ALWAYS_KEEP_MAX_MIN * 60.0
    if duration_s <= threshold:
        return duration_s
    excess = duration_s - threshold
    return threshold + excess * ENGINE_POLICY_LONG_WALK_DISCOMFORT_FACTOR


def mapbox_walking(token: str, from_c: dict, to_c: dict) -> tuple[str, dict | None, str | None]:
    coords = f"{from_c['lng']},{from_c['lat']};{to_c['lng']},{to_c['lat']}"
    params = urllib.parse.urlencode(
        {"access_token": token, "geometries": "geojson", "overview": "false", "steps": "false"}
    )
    url = f"https://api.mapbox.com/directions/v5/mapbox/walking/{coords}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "ChronoWalk-Gate1B4/0.1"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.load(resp)
    except urllib.error.HTTPError as exc:
        return "ERROR", None, f"HTTP {exc.code}"
    except urllib.error.URLError as exc:
        return "ERROR", None, str(exc.reason)
    routes = data.get("routes") or []
    if not routes:
        return "NO_ROUTE", None, data.get("code")
    route = routes[0]
    return "OK", route, data.get("uuid") or route.get("weight_name")


def ensure_osm_cache() -> dict:
    if OSM_CACHE.exists():
        return json.loads(OSM_CACHE.read_text(encoding="utf-8"))
    query = """
[out:json][timeout:90];
(
  node["railway"="station"]["station"="subway"](-33.65,-70.85,-33.30,-70.45);
  node["public_transport"="station"]["station"="subway"](-33.65,-70.85,-33.30,-70.45);
  relation["network"="Metro de Santiago"]["route"="subway"](-33.65,-70.85,-33.30,-70.45);
);
out body;
>;
out body;
"""
    data = urllib.parse.urlencode({"data": query}).encode()
    req = urllib.request.Request(
        "https://overpass-api.de/api/interpreter",
        data=data,
        headers={"User-Agent": "ChronoWalk-Gate1B4/0.1"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        payload = json.load(resp)
    OSM_CACHE.parent.mkdir(parents=True, exist_ok=True)
    OSM_CACHE.write_text(json.dumps(payload), encoding="utf-8")
    return payload


def build_metro_reference(osm: dict, checked_at: str) -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    nodes = {e["id"]: e for e in osm["elements"] if e["type"] == "node"}
    named = [
        n
        for n in nodes.values()
        if (n.get("tags") or {}).get("name")
        and (n["tags"].get("station") == "subway" or n["tags"].get("railway") == "station")
    ]
    stations: dict[str, dict] = {}
    lines_out: list[dict] = []
    ride_edges: list[dict] = []
    transfer_edges: list[dict] = []

    provenance_source = (
        "OpenStreetMap Overpass API — network=Metro de Santiago route=subway relations "
        "+ railway=station station=subway nodes (ODbL). Coordinates from OSM nodes; "
        "segment travel times unresolved."
    )

    for ref, rid in PRIMARY_LINE_RELATIONS.items():
        rel = next((e for e in osm["elements"] if e["type"] == "relation" and e["id"] == rid), None)
        if not rel:
            lines_out.append(
                {
                    "lineId": ref,
                    "canonicalName": f"Línea {ref}",
                    "colour": None,
                    "osmRelationId": rid,
                    "stationOrder": [],
                    "topologyStatus": "UNRESOLVED",
                    "segmentTimingStatus": "SEGMENT_TIME_UNRESOLVED",
                    "provenance": "openstreetmap",
                    "provenanceSource": provenance_source,
                }
            )
            continue
        ordered: list[str] = []
        for m in rel.get("members") or []:
            if m.get("type") != "node" or m.get("role") != "stop":
                continue
            sn = nodes.get(m["ref"])
            if not sn or "lat" not in sn:
                continue
            best = None
            best_d = 1e9
            for st in named:
                d = haversine_m(
                    {"lat": sn["lat"], "lng": sn["lon"]},
                    {"lat": st["lat"], "lng": st["lon"]},
                )
                if d < best_d:
                    best_d = d
                    best = st
            if best is None or best_d > 200:
                continue
            sid = f"METRO_OSM_{best['id']}"
            if sid not in stations:
                stations[sid] = {
                    "stationId": sid,
                    "canonicalName": best["tags"]["name"],
                    "lat": best["lat"],
                    "lng": best["lon"],
                    "lines": [],
                    "accessibility": "UNKNOWN",
                    "provenance": "openstreetmap",
                    "provenanceSource": provenance_source,
                    "osmNodeId": best["id"],
                    "verificationState": "NETWORK_TOPOLOGY_VERIFIED",
                }
            if ref not in stations[sid]["lines"]:
                stations[sid]["lines"].append(ref)
            if not ordered or ordered[-1] != sid:
                ordered.append(sid)

        topology = "NETWORK_TOPOLOGY_VERIFIED" if ordered else "UNRESOLVED"
        lines_out.append(
            {
                "lineId": ref,
                "canonicalName": (rel.get("tags") or {}).get("name") or f"Línea {ref}",
                "colour": (rel.get("tags") or {}).get("colour"),
                "osmRelationId": rid,
                "stationOrder": ordered,
                "topologyStatus": topology,
                "segmentTimingStatus": "SEGMENT_TIME_UNRESOLVED",
                "provenance": "openstreetmap",
                "provenanceSource": provenance_source,
            }
        )
        for i in range(len(ordered) - 1):
            a, b = ordered[i], ordered[i + 1]
            for frm, to in ((a, b), (b, a)):
                ride_edges.append(
                    {
                        "edgeId": f"METRO_RIDE|{ref}|{frm}|{to}",
                        "fromStationId": frm,
                        "toStationId": to,
                        "lineId": ref,
                        "mode": "METRO_RIDE",
                        "observedDurationSeconds": None,
                        "topologyStatus": "NETWORK_TOPOLOGY_VERIFIED",
                        "segmentTimingStatus": "SEGMENT_TIME_UNRESOLVED",
                        "enginePolicyHopCostSeconds": ENGINE_POLICY_METRO_HOP_FALLBACK_S,
                        "provenance": {
                            "source": "openstreetmap",
                            "relationId": rid,
                            "checkedAt": checked_at,
                            "note": "Consecutive stations on verified line order; segment time unresolved",
                        },
                    }
                )

    # Deduplicate ride edges by id
    ride_by_id = {e["edgeId"]: e for e in ride_edges}
    ride_edges = list(ride_by_id.values())

    for st in stations.values():
        lines = sorted(st["lines"])
        for i, a in enumerate(lines):
            for b in lines[i + 1 :]:
                for fl, tl in ((a, b), (b, a)):
                    transfer_edges.append(
                        {
                            "edgeId": f"METRO_TRANSFER|{st['stationId']}|{fl}|{tl}",
                            "stationId": st["stationId"],
                            "fromLineId": fl,
                            "toLineId": tl,
                            "mode": "METRO_TRANSFER",
                            "observedDurationSeconds": None,
                            "enginePolicyTransferPenaltySeconds": ENGINE_POLICY_METRO_TRANSFER_FRICTION_S,
                            "provenance": {
                                "source": "openstreetmap",
                                "note": "Verified multi-line station membership; observed interchange walk unresolved",
                                "checkedAt": checked_at,
                            },
                            "verificationState": "NETWORK_TOPOLOGY_VERIFIED",
                        }
                    )

    return list(stations.values()), lines_out, ride_edges, transfer_edges


def connected_components(node_ids: list[str], edges: list[dict], from_key: str, to_key: str) -> list[list[str]]:
    parent = {n: n for n in node_ids}

    def find(x: str) -> str:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: str, b: str) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    for e in edges:
        if e[from_key] in parent and e[to_key] in parent:
            union(e[from_key], e[to_key])
    comps: dict[str, list[str]] = defaultdict(list)
    for n in node_ids:
        comps[find(n)].append(n)
    return list(comps.values())


def sparsify_edges(provider: dict) -> dict:
    eligible = list(provider["eligibleStgoIds"])
    runtime = [e for e in provider["edges"] if e.get("runtimeEligible")]
    dense = len(runtime)
    by_pair = {(e["fromPoiId"], e["toPoiId"]): e for e in runtime}

    out_map: dict[str, list[dict]] = defaultdict(list)
    for e in runtime:
        out_map[e["fromPoiId"]].append(e)

    selected: dict[str, dict] = {}
    reasons: dict[str, str] = {}

    def keep(e: dict, reason: str) -> None:
        selected[e["edgeId"]] = e
        reasons.setdefault(e["edgeId"], reason)
        rev = by_pair.get((e["toPoiId"], e["fromPoiId"]))
        if rev is not None:
            selected[rev["edgeId"]] = rev
            reasons.setdefault(rev["edgeId"], reason + "_REVERSE")

    for e in runtime:
        if e["durationMin"] <= SPARSE_ALWAYS_KEEP_MAX_MIN:
            keep(e, "ALWAYS_KEEP_SHORT_LOCAL")

    for sid in eligible:
        outs = sorted(out_map.get(sid, []), key=lambda x: x["durationMin"])
        for e in outs[:SPARSE_NEAREST_NEIGHBORS]:
            keep(e, "NEAREST_NEIGHBOR")

    for e in runtime:
        if e["durationMin"] <= SPARSE_MAX_OPERATIONAL_MIN and e["durationMin"] <= SPARSE_REDUNDANT_DIRECT_MIN:
            keep(e, "WITHIN_OPERATIONAL_BAND")

    def undirected_comps(sel: dict[str, dict]) -> list[list[str]]:
        return connected_components(eligible, list(sel.values()), "fromPoiId", "toPoiId")

    remaining = sorted(runtime, key=lambda x: x["durationMin"])
    while len(undirected_comps(selected)) > 1:
        comps = undirected_comps(selected)
        added = False
        for e in remaining:
            if e["edgeId"] in selected:
                continue
            ca = next(c for c in comps if e["fromPoiId"] in c)
            cb = next(c for c in comps if e["toPoiId"] in c)
            if ca is not cb:
                keep(e, "CONNECTIVITY_BRIDGE")
                added = True
                break
        if not added:
            break

    # Directed reachability repair: ensure every eligible node can reach every other.
    def reachable(src: str) -> set[str]:
        adj = defaultdict(list)
        for e in selected.values():
            adj[e["fromPoiId"]].append(e["toPoiId"])
        seen = {src}
        stack = [src]
        while stack:
            n = stack.pop()
            for nxt in adj[n]:
                if nxt not in seen:
                    seen.add(nxt)
                    stack.append(nxt)
        return seen

    changed = True
    while changed:
        changed = False
        for src in eligible:
            seen = reachable(src)
            missing = [t for t in eligible if t not in seen]
            if not missing:
                continue
            # add cheapest provider edge from reachable set into a missing node (or toward it)
            candidates = [
                e
                for e in runtime
                if e["fromPoiId"] in seen and e["toPoiId"] not in seen and e["edgeId"] not in selected
            ]
            if not candidates:
                # try any edge into missing from anywhere already selected path-wise
                candidates = [
                    e
                    for e in runtime
                    if e["toPoiId"] in missing and e["edgeId"] not in selected
                ]
            if not candidates:
                continue
            candidates.sort(key=lambda x: x["durationMin"])
            keep(candidates[0], "DIRECTED_REACHABILITY_BRIDGE")
            changed = True

    sparse_edges = []
    for eid, e in selected.items():
        sparse_edges.append(
            {
                "edgeId": f"SPARSE|{eid}",
                "fromPoiId": e["fromPoiId"],
                "toPoiId": e["toPoiId"],
                "mode": "WALK",
                "distanceM": e["distanceM"],
                "durationS": e["durationS"],
                "durationMin": e["durationMin"],
                "physicalClassification": e["physicalClassification"],
                "providerEdgeId": eid,
                "provider": "mapbox",
                "runtimeEligible": True,
                "sparsificationReason": reasons[eid],
                "provenance": {
                    "gate": "1B.4",
                    "tracesToGate1B3ProviderEdge": True,
                    "providerReference": e.get("providerReference"),
                },
            }
        )

    out_deg = defaultdict(int)
    in_deg = defaultdict(int)
    for e in sparse_edges:
        out_deg[e["fromPoiId"]] += 1
        in_deg[e["toPoiId"]] += 1
    comps = undirected_comps(selected)
    isolated = [n for n in eligible if out_deg[n] == 0 and in_deg[n] == 0]
    directed_ok = all(len(reachable(s)) == len(eligible) for s in eligible)
    degs = [out_deg[n] for n in eligible]
    degs_sorted = sorted(degs)
    med = degs_sorted[len(degs_sorted) // 2] if degs_sorted else 0
    reduction = round(100.0 * (1 - len(sparse_edges) / dense), 1) if dense else 0

    return {
        "schemaVersion": "santiago-pedestrian-adjacency.v0.1",
        "gate": "1B.4",
        "physicalRouteGenerationEnabled": False,
        "denseProviderRuntimeEdgeCount": dense,
        "sparseOperationalEdgeCount": len(sparse_edges),
        "reductionPercent": reduction,
        "eligibleStgoIds": eligible,
        "graphHealth": {
            "connectedComponentCount": len(comps),
            "isolatedNodes": isolated,
            "medianOutDegree": med,
            "maxOutDegree": max(degs) if degs else 0,
            "averageOutDegree": round(sum(degs) / len(degs), 2) if degs else 0,
            "directedStronglyConnected": directed_ok,
        },
        "edges": sorted(sparse_edges, key=lambda x: x["edgeId"]),
    }


def resolve_poi_endpoint(node: dict) -> dict | None:
    if node["stgoId"] == "STGO_32":
        xp = node.get("experiencePointCoordinate")
        if xp:
            return {"lat": xp["lat"], "lng": xp["lng"], "pointId": "funicular"}
    xp = node.get("experiencePointCoordinate")
    if xp:
        return {"lat": xp["lat"], "lng": xp["lng"], "pointId": "experience"}
    poi = node.get("poiCoordinate")
    if poi:
        return {"lat": poi["lat"], "lng": poi["lng"], "pointId": "poi"}
    return None


def build_poi_metro_access(
    token: str,
    engine_nodes: list[dict],
    eligible: list[str],
    stations: list[dict],
    checked_at: str,
) -> tuple[list[dict], list[dict]]:
    by_id = {n["stgoId"]: n for n in engine_nodes}
    runtime: list[dict] = []
    qa_candidates: list[dict] = []

    for sid in eligible:
        node = by_id[sid]
        ep = resolve_poi_endpoint(node)
        if not ep:
            continue
        cands = []
        for st in stations:
            d = haversine_m(ep, {"lat": st["lat"], "lng": st["lng"]})
            if d <= METRO_ACCESS_CANDIDATE_MAX_KM * 1000:
                cands.append((d, st))
        cands.sort(key=lambda x: x[0])
        cands = cands[:5]  # prune Mapbox calls
        routed = []
        for straight_m, st in cands:
            status, route, ref = mapbox_walking(token, ep, {"lat": st["lat"], "lng": st["lng"]})
            time.sleep(0.25)
            rec = {
                "stgoId": sid,
                "stationId": st["stationId"],
                "stationName": st["canonicalName"],
                "straightLineM": round(straight_m, 1),
                "routingStatus": status,
            }
            if status != "OK" or not route:
                qa_candidates.append(rec)
                continue
            dist = float(route["distance"])
            dur = float(route["duration"])
            useful = dur / 60.0 <= METRO_ACCESS_USEFUL_MAX_MIN
            rec.update({"distanceMeters": round(dist, 1), "durationSeconds": round(dur, 1), "useful": useful})
            routed.append((dur, useful, st, dist, dur, ref))
            qa_candidates.append(rec)

        routed.sort(key=lambda x: x[0])
        useful_routed = [r for r in routed if r[1]][:METRO_ACCESS_MAX_PER_POI]
        if not useful_routed and routed:
            # still keep nearest as QA only
            pass
        for i, (dur_s, useful, st, dist, dur, ref) in enumerate(useful_routed):
            runtime.append(
                {
                    "edgeId": f"POI_METRO_ACCESS|{sid}|{st['stationId']}",
                    "from": sid,
                    "to": st["stationId"],
                    "mode": "POI_METRO_ACCESS",
                    "distanceMeters": round(dist, 1),
                    "durationSeconds": round(dur, 1),
                    "provider": "mapbox",
                    "provenance": {
                        "provider": "mapbox",
                        "providerReference": ref,
                        "routingProfile": "mapbox/walking",
                        "checkedAt": checked_at,
                        "poiPointId": ep["pointId"],
                    },
                    "stationId": st["stationId"],
                    "stgoId": sid,
                    "accessRole": "PRIMARY" if i == 0 else "SECONDARY",
                    "verificationState": "PROVIDER_DERIVED",
                    "runtimePreferred": True,
                }
            )
            # reverse station → POI (same provider walk, directed model)
            runtime.append(
                {
                    "edgeId": f"POI_METRO_ACCESS|{st['stationId']}|{sid}",
                    "from": st["stationId"],
                    "to": sid,
                    "mode": "POI_METRO_ACCESS",
                    "distanceMeters": round(dist, 1),
                    "durationSeconds": round(dur, 1),
                    "provider": "mapbox",
                    "provenance": {
                        "provider": "mapbox",
                        "providerReference": ref,
                        "routingProfile": "mapbox/walking",
                        "checkedAt": checked_at,
                        "poiPointId": ep["pointId"],
                        "direction": "station_to_poi_mirrored_provider_walk",
                    },
                    "stationId": st["stationId"],
                    "stgoId": sid,
                    "accessRole": "PRIMARY" if i == 0 else "SECONDARY",
                    "verificationState": "PROVIDER_DERIVED",
                    "runtimePreferred": True,
                }
            )
    return runtime, qa_candidates


def build_graph_index(
    sparse_walk: list[dict],
    access: list[dict],
    rides: list[dict],
    transfers: list[dict],
) -> dict[str, list[tuple[float, dict, str]]]:
    """adjacency: node -> list of (generalized_cost_s, edge, kind)"""
    adj: dict[str, list[tuple[float, dict, str]]] = defaultdict(list)

    for e in sparse_walk:
        cost = walk_generalized_cost_s(e["durationS"])
        adj[e["fromPoiId"]].append((cost, e, "WALK"))

    for e in access:
        cost = e["durationSeconds"] + ENGINE_POLICY_METRO_ENTRY_FRICTION_S + ENGINE_POLICY_MODE_CHANGE_FRICTION_S
        # Entry friction only when entering metro from POI (from is STGO)
        if str(e["from"]).startswith("STGO_"):
            cost = e["durationSeconds"] + ENGINE_POLICY_METRO_ENTRY_FRICTION_S + ENGINE_POLICY_MODE_CHANGE_FRICTION_S
        else:
            cost = e["durationSeconds"] + ENGINE_POLICY_MODE_CHANGE_FRICTION_S
        adj[e["from"]].append((cost, e, "POI_METRO_ACCESS"))

    for e in rides:
        # generalized hop cost only — observed null
        adj[e["fromStationId"]].append((e["enginePolicyHopCostSeconds"], e, "METRO_RIDE"))

    # Transfers are at a station between lines — model as staying at station with penalty
    # Represent transfer nodes as station|line
    # Simpler approach: when arriving via line A, can depart via line B with transfer penalty
    # Encode ride edges as station nodes; transfer adds self-loop cost keyed by last line in path state.
    # For Dijkstra with line state, use node key f"{station}|{line}" for metro, STGO for POI.

    return adj


def multimodal_shortest_path(
    origin: str,
    dest: str,
    sparse_walk: list[dict],
    access: list[dict],
    rides: list[dict],
    transfers: list[dict],
) -> dict:
    """
    State: ('POI', stgoId) or ('METRO', stationId, lineId)
    """
    transfer_set = {(t["stationId"], t["fromLineId"], t["toLineId"]): t for t in transfers}
    stations_on_line: dict[str, set[str]] = defaultdict(set)
    for e in rides:
        stations_on_line[e["lineId"]].add(e["fromStationId"])
        stations_on_line[e["lineId"]].add(e["toStationId"])

    # Build adjacency on state keys (hashable tuples)
    INF = 1e18
    dist: dict[tuple, float] = {}
    prev: dict[tuple, tuple | None] = {}
    prev_edge: dict[tuple, dict] = {}

    start: tuple = ("POI", origin)
    dist[start] = 0.0
    prev[start] = None
    pq = [start]

    def push(state: tuple, cost: float, parent: tuple, edge: dict) -> None:
        if cost < dist.get(state, INF):
            dist[state] = cost
            prev[state] = parent
            prev_edge[state] = edge
            pq.append(state)

    # Index helpers
    walk_out = defaultdict(list)
    for e in sparse_walk:
        walk_out[e["fromPoiId"]].append(e)
    access_out = defaultdict(list)
    for e in access:
        access_out[e["from"]].append(e)
    ride_out = defaultdict(list)
    for e in rides:
        ride_out[(e["fromStationId"], e["lineId"])].append(e)

    visited: set[tuple] = set()
    while pq:
        pq.sort(key=lambda s: dist.get(s, INF))
        cur = pq.pop(0)
        if cur in visited:
            continue
        visited.add(cur)
        base = dist[cur]

        if cur[0] == "POI":
            sid = cur[1]
            for e in walk_out.get(sid, []):
                cost = base + walk_generalized_cost_s(e["durationS"])
                push(("POI", e["toPoiId"]), cost, cur, {"kind": "WALK", **e})
            for e in access_out.get(sid, []):
                st = e["stationId"]
                # board any line at station
                for line in stations_on_line:
                    if st not in stations_on_line[line]:
                        continue
                    # find lines for station from rides
                    pass
                # Use station's lines from ride edges
                lines_here = {ee["lineId"] for ee in rides if ee["fromStationId"] == st or ee["toStationId"] == st}
                for line in lines_here:
                    cost = base + e["durationSeconds"] + ENGINE_POLICY_METRO_ENTRY_FRICTION_S + ENGINE_POLICY_MODE_CHANGE_FRICTION_S
                    push(
                        ("METRO", st, line),
                        cost,
                        cur,
                        {"kind": "POI_METRO_ACCESS", **e, "boardingLine": line},
                    )

        elif cur[0] == "METRO":
            st, line = cur[1], cur[2]
            # ride along line
            for e in ride_out.get((st, line), []):
                cost = base + e["enginePolicyHopCostSeconds"]
                push(("METRO", e["toStationId"], line), cost, cur, {"kind": "METRO_RIDE", **e})
            # transfer to other line at same station
            for (station_id, fl, tl), te in transfer_set.items():
                if station_id == st and fl == line:
                    cost = base + te["enginePolicyTransferPenaltySeconds"]
                    push(("METRO", st, tl), cost, cur, {"kind": "METRO_TRANSFER", **te})
            # exit to POI
            for e in access_out.get(st, []):
                if not str(e["to"]).startswith("STGO_"):
                    continue
                cost = base + e["durationSeconds"] + ENGINE_POLICY_MODE_CHANGE_FRICTION_S
                push(("POI", e["to"]), cost, cur, {"kind": "POI_METRO_ACCESS", **e})

    # Best destination POI state
    dest_state = ("POI", dest)
    if dest_state not in dist:
        return {
            "origin": origin,
            "destination": dest,
            "legs": [],
            "physicalDurationSeconds": None,
            "physicalDistanceMeters": None,
            "generalizedCost": None,
            "modeChanges": 0,
            "metroLinesUsed": [],
            "transfers": 0,
            "unverifiedComponents": ["NO_PATH"],
            "provenanceSummary": "No multimodal path found",
            "pedestrianOnlyAlternative": None,
            "selectionReason": "UNREACHABLE",
            "connected": False,
        }

    # Reconstruct
    legs = []
    cur = dest_state
    while prev.get(cur) is not None:
        edge = prev_edge[cur]
        kind = edge["kind"]
        parent = prev[cur]
        unverified = kind in ("METRO_RIDE", "METRO_TRANSFER")
        if kind == "WALK":
            legs.append(
                {
                    "mode": "WALK",
                    "from": edge["fromPoiId"],
                    "to": edge["toPoiId"],
                    "edgeId": edge.get("edgeId"),
                    "physicalDurationSeconds": edge["durationS"],
                    "physicalDistanceMeters": edge["distanceM"],
                    "generalizedCostSeconds": walk_generalized_cost_s(edge["durationS"]),
                    "unverified": False,
                }
            )
        elif kind == "POI_METRO_ACCESS":
            legs.append(
                {
                    "mode": "POI_METRO_ACCESS",
                    "from": edge["from"],
                    "to": edge["to"],
                    "edgeId": edge.get("edgeId"),
                    "physicalDurationSeconds": edge["durationSeconds"],
                    "physicalDistanceMeters": edge["distanceMeters"],
                    "generalizedCostSeconds": edge["durationSeconds"]
                    + (
                        ENGINE_POLICY_METRO_ENTRY_FRICTION_S + ENGINE_POLICY_MODE_CHANGE_FRICTION_S
                        if str(edge["from"]).startswith("STGO_")
                        else ENGINE_POLICY_MODE_CHANGE_FRICTION_S
                    ),
                    "lineId": edge.get("boardingLine"),
                    "unverified": False,
                }
            )
        elif kind == "METRO_RIDE":
            legs.append(
                {
                    "mode": "METRO_RIDE",
                    "from": edge["fromStationId"],
                    "to": edge["toStationId"],
                    "edgeId": edge.get("edgeId"),
                    "physicalDurationSeconds": None,
                    "physicalDistanceMeters": None,
                    "generalizedCostSeconds": edge["enginePolicyHopCostSeconds"],
                    "lineId": edge["lineId"],
                    "unverified": True,
                }
            )
        elif kind == "METRO_TRANSFER":
            legs.append(
                {
                    "mode": "METRO_TRANSFER",
                    "from": edge["stationId"],
                    "to": edge["stationId"],
                    "edgeId": edge.get("edgeId"),
                    "physicalDurationSeconds": None,
                    "physicalDistanceMeters": None,
                    "generalizedCostSeconds": edge["enginePolicyTransferPenaltySeconds"],
                    "lineId": f"{edge['fromLineId']}→{edge['toLineId']}",
                    "unverified": True,
                }
            )
        cur = parent
    legs.reverse()

    phys_durs = [l["physicalDurationSeconds"] for l in legs if l["physicalDurationSeconds"] is not None]
    phys_dists = [l["physicalDistanceMeters"] for l in legs if l["physicalDistanceMeters"] is not None]
    has_unverified = any(l["unverified"] for l in legs)
    total_phys = round(sum(phys_durs), 1) if phys_durs and not has_unverified else (None if has_unverified else round(sum(phys_durs), 1))
    # If any unverified, do not claim total observed duration
    if has_unverified:
        total_phys = None
    total_dist = round(sum(phys_dists), 1) if phys_dists else None
    lines_used = sorted({l["lineId"] for l in legs if l["mode"] == "METRO_RIDE" and l.get("lineId")})
    transfers = sum(1 for l in legs if l["mode"] == "METRO_TRANSFER")
    modes = [l["mode"] for l in legs]
    mode_changes = sum(1 for i in range(1, len(modes)) if modes[i] != modes[i - 1])
    unverified = []
    if any(l["mode"] == "METRO_RIDE" for l in legs):
        unverified.append("METRO_SEGMENT_TIME_UNRESOLVED")
    if transfers:
        unverified.append("METRO_TRANSFER_OBSERVED_TIME_UNRESOLVED")

    return {
        "origin": origin,
        "destination": dest,
        "legs": legs,
        "physicalDurationSeconds": total_phys,
        "physicalDistanceMeters": total_dist,
        "generalizedCost": round(dist[dest_state], 1),
        "modeChanges": mode_changes,
        "metroLinesUsed": lines_used,
        "transfers": transfers,
        "unverifiedComponents": unverified,
        "provenanceSummary": "Sparse WALK (Mapbox) + OSM Metro topology + Mapbox POI access; Metro hop/transfer costs are ENGINE POLICY",
        "connected": True,
        "modes": sorted(set(modes)),
    }


def pedestrian_only_path(origin: str, dest: str, sparse_walk: list[dict]) -> dict | None:
    adj = defaultdict(list)
    for e in sparse_walk:
        adj[e["fromPoiId"]].append(e)
    dist = {origin: 0.0}
    prev: dict[str, dict | None] = {origin: None}
    pq = [origin]
    while pq:
        pq.sort(key=lambda n: dist.get(n, 1e18))
        n = pq.pop(0)
        if n == dest:
            break
        for e in adj.get(n, []):
            nd = dist[n] + e["durationS"]
            if nd < dist.get(e["toPoiId"], 1e18):
                dist[e["toPoiId"]] = nd
                prev[e["toPoiId"]] = e
                pq.append(e["toPoiId"])
    if dest not in dist:
        return None
    legs = []
    cur = dest
    while prev.get(cur):
        e = prev[cur]
        assert e
        legs.append(e)
        cur = e["fromPoiId"]
    legs.reverse()
    return {
        "connected": True,
        "totalDurationSeconds": round(dist[dest], 1),
        "totalDistanceMeters": round(sum(e["distanceM"] for e in legs), 1),
        "legCount": len(legs),
        "nodes": [origin] + [e["toPoiId"] for e in legs],
        "generalizedCost": round(walk_generalized_cost_s(dist[dest]), 1)
        if len(legs) == 1
        else round(sum(walk_generalized_cost_s(e["durationS"]) for e in legs), 1),
    }


def secret_ok(obj: Any) -> bool:
    blob = json.dumps(obj)
    return "pk.ey" not in blob and "MAPBOX_ACCESS_TOKEN" not in blob


def main() -> int:
    load_env()
    token = require_token()
    checked_at = datetime.now(timezone.utc).isoformat()

    if not PROVIDER_EDGES.exists() or not ENGINE.exists():
        print("FAIL: missing Gate 1B.3 provider edges or engine nodes")
        return 1

    provider = json.loads(PROVIDER_EDGES.read_text(encoding="utf-8"))
    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    if provider.get("counts", {}).get("runtimeWalkEdges") != 598:
        print("WARN: unexpected Gate 1B.3 runtime edge count", provider.get("counts"))

    # Preserve provider file untouched — only read
    print("Building sparse adjacency...")
    adj = sparsify_edges(provider)
    if adj["graphHealth"]["connectedComponentCount"] != 1 or adj["graphHealth"]["isolatedNodes"]:
        print("FAIL: sparse graph connectivity broken", adj["graphHealth"])
        return 1
    if not adj["graphHealth"].get("directedStronglyConnected"):
        print("FAIL: sparse graph not directed-reachable among eligible nodes", adj["graphHealth"])
        return 1
    if adj["sparseOperationalEdgeCount"] >= adj["denseProviderRuntimeEdgeCount"]:
        print("FAIL: sparsification did not reduce edges")
        return 1

    print("Importing Metro reference from OSM...")
    osm = ensure_osm_cache()
    stations, lines, rides, transfers = build_metro_reference(osm, checked_at)
    print(f"  stations={len(stations)} lines={len(lines)} rides={len(rides)} transfers={len(transfers)}")

    print("Building POI↔Metro access (Mapbox)...")
    access, access_qa = build_poi_metro_access(
        token, engine["nodes"], provider["eligibleStgoIds"], stations, checked_at
    )
    print(f"  access_edges={len(access)} qa_candidates={len(access_qa)}")

    # Multimodal QA
    print("Running multimodal QA routes...")
    qa_results = []
    sparse_edges = adj["edges"]
    names = {n["stgoId"]: n.get("displayName") for n in engine["nodes"]}
    for origin, dest, label in QA_ROUTES:
        if origin not in provider["eligibleStgoIds"] or dest not in provider["eligibleStgoIds"]:
            qa_results.append(
                {
                    "label": label,
                    "origin": origin,
                    "destination": dest,
                    "connected": False,
                    "selectionReason": "ORIGIN_OR_DEST_NOT_EDGE_ELIGIBLE",
                    "legs": [],
                    "physicalDurationSeconds": None,
                    "physicalDistanceMeters": None,
                    "generalizedCost": None,
                    "modeChanges": 0,
                    "metroLinesUsed": [],
                    "transfers": 0,
                    "unverifiedComponents": ["NOT_ELIGIBLE"],
                    "provenanceSummary": "",
                    "pedestrianOnlyAlternative": None,
                }
            )
            continue
        multi = multimodal_shortest_path(origin, dest, sparse_edges, access, rides, transfers)
        ped = pedestrian_only_path(origin, dest, sparse_edges)
        multi["label"] = label
        multi["originName"] = names.get(origin)
        multi["destinationName"] = names.get(dest)
        multi["pedestrianOnlyAlternative"] = ped
        # selection reason
        if not multi.get("connected"):
            multi["selectionReason"] = "UNREACHABLE"
        elif ped and multi.get("generalizedCost") is not None and ped["generalizedCost"] <= multi["generalizedCost"]:
            # if multimodal equals walk-only path essentially
            if not multi.get("metroLinesUsed"):
                multi["selectionReason"] = "WALK_LOWER_OR_EQUAL_GENERALIZED_COST"
            else:
                multi["selectionReason"] = "MULTIMODAL_SELECTED"
        elif not multi.get("metroLinesUsed"):
            multi["selectionReason"] = "WALK_ONLY_BEST"
        else:
            multi["selectionReason"] = "MULTIMODAL_LOWER_GENERALIZED_COST"
        # If walk-only is better, prefer reporting walk path as selected
        if ped and multi.get("generalizedCost") is not None and ped["generalizedCost"] < multi["generalizedCost"]:
            # rebuild as walk-only selected
            walk_legs = []
            # reconstruct from ped nodes
            node_path = ped["nodes"]
            by_pair = {(e["fromPoiId"], e["toPoiId"]): e for e in sparse_edges}
            for a, b in zip(node_path, node_path[1:]):
                e = by_pair[(a, b)]
                walk_legs.append(
                    {
                        "mode": "WALK",
                        "from": a,
                        "to": b,
                        "edgeId": e["edgeId"],
                        "physicalDurationSeconds": e["durationS"],
                        "physicalDistanceMeters": e["distanceM"],
                        "generalizedCostSeconds": walk_generalized_cost_s(e["durationS"]),
                        "unverified": False,
                    }
                )
            multi = {
                **multi,
                "legs": walk_legs,
                "physicalDurationSeconds": ped["totalDurationSeconds"],
                "physicalDistanceMeters": ped["totalDistanceMeters"],
                "generalizedCost": ped["generalizedCost"],
                "modeChanges": 0,
                "metroLinesUsed": [],
                "transfers": 0,
                "unverifiedComponents": [],
                "selectionReason": "WALK_LOWER_GENERALIZED_COST",
                "modes": ["WALK"],
                "pedestrianOnlyAlternative": ped,
            }
        qa_results.append(multi)
        print(f"  {label}: {multi.get('selectionReason')} cost={multi.get('generalizedCost')} modes={multi.get('modes')}")

    # STGO_32 staging
    stgo32 = next(n for n in engine["nodes"] if n["stgoId"] == "STGO_32")
    staging = {
        "stgoId": "STGO_32",
        "displayName": stgo32.get("displayName"),
        "routingEndpoint": "funicular",
        "stages": [
            {"id": "hill_concept_poi", "coordinate": stgo32.get("poiCoordinate"), "status": "CONCEPT_ONLY"},
            {"id": "funicular_base", "coordinate": stgo32.get("experiencePointCoordinate"), "status": "ACTIVE_ROUTING_ENDPOINT"},
            {
                "id": "acceso_carlos_reed",
                "coordinate": next((p.get("coordinate") for p in (stgo32.get("accessPoints") or []) if p.get("id") == "acceso_carlos_reed"), None),
                "status": "ACCESS_PRESERVED_NOT_COLLAPSED",
            },
            {
                "id": "teleferico_pedro_de_valdivia",
                "coordinate": next((p.get("coordinate") for p in (stgo32.get("accessPoints") or []) if p.get("id") == "teleferico_pedro_de_valdivia"), None),
                "status": "ACCESS_PRESERVED_NOT_COLLAPSED",
            },
            {"id": "ascent_transport", "status": "UNRESOLVED_INACTIVE", "note": "No trustworthy funicular duration/provider segment in Gate 1B.4"},
            {"id": "upper_experience", "status": "UNRESOLVED", "note": "Arrival at funicular base ≠ summit"},
        ],
    }

    unresolved = [
        {"stgoId": "STGO_05", "reason": "PARTIAL_REVIEW_REQUIRED — excluded; curation unchanged"},
        {"stgoId": "STGO_23", "reason": "UNRESOLVED_RESEARCH_REQUIRED — excluded"},
        {"stgoId": "STGO_33", "reason": "NEEDS_SEMANTIC_REVIEW — excluded"},
    ]

    interchanges = [s for s in stations if len(s["lines"]) > 1]
    verified_lines = [l for l in lines if l["topologyStatus"] == "NETWORK_TOPOLOGY_VERIFIED"]

    multi_payload = {
        "schemaVersion": "santiago-multimodal-graph.v0.1",
        "gate": "1B.4",
        "physicalRouteGenerationEnabled": False,
        "multimodalPhysicalGraphReady": True,
        "contractRecovery": {
            "ENGINE_V0_1_IMPLEMENTATION_CONTRACT.md": "CONTRACT_NOT_RECOVERABLE",
            "PHYSICAL_GRAPH_V0.1_CONTRACT.md": "CONTRACT_NOT_RECOVERABLE",
        },
        "referenceMatrixStatus": "REFERENCE_MATRIX_NOT_PRESENT",
        "thematicNarrativeUsed": False,
        "counts": {
            "denseProviderWalkEdges": adj["denseProviderRuntimeEdgeCount"],
            "sparseWalkEdges": adj["sparseOperationalEdgeCount"],
            "reductionPercent": adj["reductionPercent"],
            "metroStations": len(stations),
            "metroLines": len(lines),
            "metroLinesTopologyVerified": len(verified_lines),
            "interchangeStations": len(interchanges),
            "poiMetroAccessEdges": len(access),
            "metroRideEdges": len(rides),
            "metroTransferEdges": len(transfers),
            "rideshareMacroEdges": 0,
            "canonicalInventory": 103,
            "launchCorpus": 30,
            "backlog": 73,
            "edgeEligibleLaunch": len(provider["eligibleStgoIds"]),
        },
        "sanCristobalStaging": staging,
        "unresolvedLaunch": unresolved,
        "qaRoutes": qa_results,
        "poiMetroAccessEdges": access,
        "metroRideEdges": rides,
        "metroTransferEdges": transfers,
        "rideshareMacroEdges": [],
        "enginePolicyConstants": {
            "METRO_ENTRY_FRICTION_S": ENGINE_POLICY_METRO_ENTRY_FRICTION_S,
            "METRO_TRANSFER_FRICTION_S": ENGINE_POLICY_METRO_TRANSFER_FRICTION_S,
            "MODE_CHANGE_FRICTION_S": ENGINE_POLICY_MODE_CHANGE_FRICTION_S,
            "LONG_WALK_DISCOMFORT_FACTOR": ENGINE_POLICY_LONG_WALK_DISCOMFORT_FACTOR,
            "METRO_HOP_FALLBACK_S": ENGINE_POLICY_METRO_HOP_FALLBACK_S,
            "note": "ENGINE POLICY only — never labeled as observed travel time",
        },
        "transitTimingCoverage": {
            "observedMetroSegmentTimes": 0,
            "observedTransferTimes": 0,
            "unresolved": [
                "METRO_SEGMENT_DURATION",
                "METRO_TRANSFER_WALK_DURATION",
                "FUNICULAR_ASCENT_DURATION",
                "STATION_ACCESSIBILITY",
            ],
        },
        "generatedAt": checked_at,
    }

    stations_file = {
        "schemaVersion": "santiago-metro-stations.v0.1",
        "gate": "1B.4",
        "provenance": "openstreetmap",
        "provenanceSource": stations[0]["provenanceSource"] if stations else "openstreetmap",
        "stationCount": len(stations),
        "stations": sorted(stations, key=lambda s: s["stationId"]),
    }
    lines_file = {
        "schemaVersion": "santiago-metro-lines.v0.1",
        "gate": "1B.4",
        "provenance": "openstreetmap",
        "provenanceSource": lines[0]["provenanceSource"] if lines else "openstreetmap",
        "lineCount": len(lines),
        "lines": lines,
    }

    for obj, path in (
        (adj, ADJ_OUT),
        (stations_file, STATIONS_OUT),
        (lines_file, LINES_OUT),
        (multi_payload, MULTI_OUT),
        (
            {
                "schemaVersion": "santiago-poi-metro-access-candidates.v0.1",
                "gate": "1B.4",
                "note": "QA candidates — not competing source of truth",
                "records": access_qa,
            },
            ACCESS_QA,
        ),
    ):
        if not secret_ok(obj):
            print(f"FAIL: secret leak in {path}")
            return 1
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {path.relative_to(ROOT)}")

    # Confirm provider edges unchanged
    provider_after = json.loads(PROVIDER_EDGES.read_text(encoding="utf-8"))
    if provider_after["counts"]["runtimeWalkEdges"] != provider["counts"]["runtimeWalkEdges"]:
        print("FAIL: Gate 1B.3 provider edges mutated")
        return 1
    if engine["nodeCount"] != 103:
        print("FAIL: inventory corrupted")
        return 1

    print("BUILD_MULTIMODAL_GRAPH=PASS")
    print(json.dumps(multi_payload["counts"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
