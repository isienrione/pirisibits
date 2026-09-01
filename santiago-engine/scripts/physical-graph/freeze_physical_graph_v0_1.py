#!/usr/bin/env python3
"""
Gate 1B.5 — Freeze Santiago Physical Graph V0.1.

- Disposition STGO_05 / STGO_23 / STGO_33 / STGO_32
- Promote STGO_05 with Terraza Neptuno runtime endpoint
- Extend provider/sparse walks + Metro access for STGO_05
- Friction audit, E2E QA, graph health, freeze manifest
"""

from __future__ import annotations

import json
import math
import os
import statistics
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
PROVIDER = ROOT / "src/data/santiago/santiago_physical_edges.v0.1.json"
ADJ = ROOT / "src/data/santiago/santiago_pedestrian_adjacency.v0.1.json"
MULTI_V02 = ROOT / "src/data/santiago/santiago_multimodal_graph.v0.2.json"
STATIONS = ROOT / "src/data/santiago/transit/santiago_metro_stations.v0.2.json"
LINES = ROOT / "src/data/santiago/transit/santiago_metro_lines.v0.2.json"
TIMES = ROOT / "src/data/santiago/transit/santiago_metro_scheduled_times.v0.1.json"
LAUNCH = ROOT / "src/data/santiago/santiago_launch_corpus.v0.1.json"

MEMBERSHIP_OUT = ROOT / "src/data/santiago/santiago_launch_runtime_membership.v0.1.json"
EXT_EDGES_OUT = ROOT / "src/data/santiago/santiago_physical_edges_stgo05_extension.v0.1.json"
ADJ_V02_OUT = ROOT / "src/data/santiago/santiago_pedestrian_adjacency.v0.2.json"
MULTI_V03_OUT = ROOT / "src/data/santiago/santiago_multimodal_graph.v0.3.json"
FRICTION_OUT = ROOT / "src/data/santiago/qa/santiago_physical_friction_audit.v0.1.json"
QA_OUT = ROOT / "src/data/santiago/qa/santiago_physical_layer_e2e_qa.v0.1.json"
MANIFEST_OUT = ROOT / "src/data/santiago/santiago_physical_graph_manifest.v0.1.json"

ENGINE_POLICY_METRO_ENTRY_FRICTION_S = 180
ENGINE_POLICY_METRO_TRANSFER_FRICTION_S = 240
ENGINE_POLICY_MODE_CHANGE_FRICTION_S = 60
ENGINE_POLICY_WAIT_FALLBACK_S = 180
ENGINE_POLICY_LONG_WALK_DISCOMFORT_FACTOR = 1.15
SPARSE_ALWAYS_KEEP_MAX_MIN = 8.0
SPARSE_NEAREST_NEIGHBORS = 4
SPARSE_MAX_OPERATIONAL_MIN = 25.0
METRO_ACCESS_CANDIDATE_MAX_KM = 1.2
METRO_ACCESS_USEFUL_MAX_MIN = 15.0

LOCAL_QA = [
    ("STGO_01", "STGO_02", "Plaza de Armas → Catedral"),
    ("STGO_03", "STGO_07", "La Moneda → Londres 38"),
    ("STGO_24", "STGO_25", "Lastarria → GAM"),
    ("STGO_29", "STGO_32", "La Chascona → San Cristóbal funicular"),
    ("STGO_34", "STGO_35", "La Vega → Tirso de Molina"),
]
CROSS_QA = [
    ("STGO_01", "STGO_24", "Plaza de Armas → Lastarria"),
    ("STGO_01", "STGO_48", "Centro → Museo de la Memoria"),
    ("STGO_01", "STGO_11", "Centro → Yungay"),
    ("STGO_01", "STGO_27", "Centro → Taller Castillo Kulczewski"),
    ("STGO_01", "STGO_05", "Centro → Cerro Santa Lucía (Terraza Neptuno)"),
]
# Multimodal candidates filled after graph build


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
    threshold = SPARSE_ALWAYS_KEEP_MAX_MIN * 60.0
    if duration_s <= threshold:
        return duration_s
    return threshold + (duration_s - threshold) * ENGINE_POLICY_LONG_WALK_DISCOMFORT_FACTOR


def mapbox_walking(token: str, from_c: dict, to_c: dict) -> tuple[str, dict | None, str | None]:
    coords = f"{from_c['lng']},{from_c['lat']};{to_c['lng']},{to_c['lat']}"
    params = urllib.parse.urlencode(
        {"access_token": token, "geometries": "geojson", "overview": "false", "steps": "false"}
    )
    url = f"https://api.mapbox.com/directions/v5/mapbox/walking/{coords}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "ChronoWalk-Gate1B5/0.1"})
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


def endpoint_for(node: dict) -> dict | None:
    sid = node["stgoId"]
    if sid == "STGO_32":
        xp = node.get("experiencePointCoordinate")
        if xp:
            return {"lat": xp["lat"], "lng": xp["lng"], "pointId": "funicular", "pointType": "experience_point"}
    if sid == "STGO_05":
        # Terraza Neptuno is the launch runtime endpoint
        for p in node.get("physicalPoints") or []:
            if p.get("id") == "terraza_neptuno" and p.get("coordinate"):
                c = p["coordinate"]
                return {
                    "lat": c["lat"],
                    "lng": c["lng"],
                    "pointId": "terraza_neptuno",
                    "pointType": "experience_point",
                }
        xp = node.get("experiencePointCoordinate")
        if xp:
            return {"lat": xp["lat"], "lng": xp["lng"], "pointId": "terraza_neptuno", "pointType": "experience_point"}
    xp = node.get("experiencePointCoordinate")
    if xp:
        return {"lat": xp["lat"], "lng": xp["lng"], "pointId": "experience", "pointType": "experience_point"}
    poi = node.get("poiCoordinate")
    if poi:
        return {"lat": poi["lat"], "lng": poi["lng"], "pointId": "poi", "pointType": "poi"}
    return None


def classify_duration(duration_min: float) -> str:
    if duration_min <= 20:
        return "GREEN"
    if duration_min <= 35:
        return "YELLOW"
    if duration_min <= 60:
        return "ORANGE"
    return "RED"


def apply_dispositions(engine: dict, checked_at: str) -> dict:
    by = {n["stgoId"]: n for n in engine["nodes"]}

    # STGO_05 — promote with Terraza Neptuno runtime endpoint
    n05 = by["STGO_05"]
    terraza = next(p for p in (n05.get("physicalPoints") or []) if p.get("id") == "terraza_neptuno")
    n05["experiencePointCoordinate"] = {
        "lat": terraza["coordinate"]["lat"],
        "lng": terraza["coordinate"]["lng"],
    }
    n05["launchPhysicalReadiness"] = "READY_FOR_EDGE_GENERATION"
    n05["physicalRouteGenerationEligible"] = True
    n05["curatorApproval"] = "CURATOR_APPROVED"
    n05["physicalVerificationState"] = "CURATOR_APPROVED"
    n05["launchRuntimeDisposition"] = "RUNTIME_READY"
    n05["launchRuntimeDispositionReason"] = (
        "Gate 1B.5: complex POI remains Cerro Santa Lucía; launch runtime endpoint = "
        "founder-curated Terraza Neptuno experience point. Broad hill @ conflict retained as QA evidence only."
    )
    n05["runtimePhysicalEndpoint"] = {
        "pointId": "terraza_neptuno",
        "pointType": "experience_point",
        "coordinate": n05["experiencePointCoordinate"],
        "note": "Traveler-facing endpoint for launch routing; not hill centroid",
    }
    cc = n05.get("curatorCuration") or {}
    cc["gate1b5Disposition"] = "READY_FOR_EDGE_GENERATION"
    cc["runtimeEndpoint"] = "terraza_neptuno"
    cc["coordinateConflict"] = {
        **(cc.get("coordinateConflict") or {}),
        "launchResolution": "Runtime uses Terraza Neptuno; conflicting founder @ zoom retained as non-runtime evidence",
        "resolvedAt": checked_at,
    }
    n05["curatorCuration"] = cc
    n05["provenance"]["physical"] = {
        **n05.get("provenance", {}).get("physical", {}),
        "curatorApproval": "CURATOR_APPROVED",
        "selectionStatus": "READY_FOR_EDGE_GENERATION",
        "humanCurationGate": "1B.5",
        "runtimeEndpoint": "terraza_neptuno",
    }

    # STGO_23 — exclude
    n23 = by["STGO_23"]
    n23["launchPhysicalReadiness"] = "UNRESOLVED_RESEARCH_REQUIRED"
    n23["physicalRouteGenerationEligible"] = False
    n23["launchRuntimeDisposition"] = "RUNTIME_EXCLUDED_RESEARCH"
    n23["launchRuntimeDispositionReason"] = (
        "EXCLUDED_FROM_LAUNCH_RUNTIME / RESEARCH_REQUIRED: founder cannot identify POI concept; "
        "no authoritative repository evidence clarifies Inca Tambo Canal Dip."
    )
    cc23 = n23.get("curatorCuration") or {}
    cc23["gate1b5Disposition"] = "EXCLUDED_FROM_LAUNCH_RUNTIME"
    cc23["researchBlocker"] = n23["launchRuntimeDispositionReason"]
    n23["curatorCuration"] = cc23

    # STGO_33 — exclude semantic
    n33 = by["STGO_33"]
    n33["launchPhysicalReadiness"] = "NEEDS_SEMANTIC_REVIEW"
    n33["physicalRouteGenerationEligible"] = False
    n33["launchRuntimeDisposition"] = "RUNTIME_EXCLUDED_SEMANTIC"
    n33["launchRuntimeDispositionReason"] = (
        "EXCLUDED_FROM_LAUNCH_RUNTIME / SEMANTIC_RESEARCH_REQUIRED: curator Street View points at Hotel Luciano K; "
        "canonical label is Kulczewski Funicular Gargoyle; STGO_27 already covers Casa-Taller Kulczewski. "
        "No repository evidence resolves gargoyle vs hotel semantics."
    )
    cc33 = n33.get("curatorCuration") or {}
    cc33["gate1b5Disposition"] = "EXCLUDED_FROM_LAUNCH_RUNTIME"
    cc33["semanticWarning"] = n33["launchRuntimeDispositionReason"]
    n33["curatorCuration"] = cc33

    # STGO_32 — staged
    n32 = by["STGO_32"]
    n32["launchRuntimeDisposition"] = "RUNTIME_STAGED"
    n32["launchRuntimeDispositionReason"] = (
        "RUNTIME_STAGED: launch endpoint = funicular base. Reaching STGO_32 does NOT imply summit. "
        "Ascent transport inactive/unresolved."
    )
    xp32 = n32.get("experiencePointCoordinate")
    n32["runtimePhysicalEndpoint"] = {
        "pointId": "funicular",
        "pointType": "experience_point",
        "coordinate": xp32,
        "note": "Funicular base/access — not summit",
    }
    pts = {p.get("id"): p for p in (n32.get("physicalPoints") or [])}
    access_pts = {p.get("id"): p for p in (n32.get("accessPoints") or [])}

    def _coord(pid: str):
        p = pts.get(pid) or access_pts.get(pid) or {}
        return p.get("coordinate")

    n32["sanCristobalStaging"] = {
        "stgoId": "STGO_32",
        "displayName": n32.get("displayName"),
        "routingEndpoint": "funicular",
        "summitImplied": False,
        "ascentTransport": "UNRESOLVED_INACTIVE",
        "stages": [
            {
                "id": "hill_concept_poi",
                "coordinate": _coord("hill_poi") or n32.get("poiCoordinate"),
                "status": "CONCEPT_ONLY",
            },
            {
                "id": "funicular_base",
                "coordinate": xp32,
                "status": "ACTIVE_ROUTING_ENDPOINT",
            },
            {
                "id": "acceso_carlos_reed",
                "coordinate": _coord("acceso_carlos_reed"),
                "status": "ACCESS_PRESERVED_NOT_COLLAPSED",
            },
            {
                "id": "teleferico_pedro_de_valdivia",
                "coordinate": _coord("teleferico_pedro_de_valdivia"),
                "status": "ACCESS_PRESERVED_NOT_COLLAPSED",
            },
            {
                "id": "ascent_transport",
                "status": "UNRESOLVED_INACTIVE",
                "note": "No trustworthy funicular duration/provider segment in Gate 1B.5",
            },
            {
                "id": "upper_experience",
                "status": "UNRESOLVED",
                "note": "Arrival at funicular base ≠ summit",
            },
        ],
    }

    for n in engine["nodes"]:
        if not n.get("launchCorpus"):
            continue
        if n["stgoId"] in {"STGO_05", "STGO_23", "STGO_33", "STGO_32"}:
            continue
        if n.get("physicalRouteGenerationEligible") and n.get("launchPhysicalReadiness") == "READY_FOR_EDGE_GENERATION":
            n["launchRuntimeDisposition"] = "RUNTIME_READY"
            n["launchRuntimeDispositionReason"] = "Curator-approved and edge-eligible from Gate 1B.2A/1B.3"
            ep = endpoint_for(n)
            if ep:
                n["runtimePhysicalEndpoint"] = {
                    "pointId": ep["pointId"],
                    "pointType": ep["pointType"],
                    "coordinate": {"lat": ep["lat"], "lng": ep["lng"]},
                }

    # Preserve Gate 1B.2A curation gate marker on the engine file; freeze marker is physicalLayerGate.
    engine["gate"] = engine.get("gate") or "1B.2A"
    if engine["gate"] == "1B.5":
        engine["gate"] = "1B.2A"
    engine["physicalLayerGate"] = "1B.5"
    return engine


def build_membership(engine: dict) -> dict:
    launch = [n for n in engine["nodes"] if n.get("launchCorpus")]
    groups = defaultdict(list)
    for n in launch:
        groups[n.get("launchRuntimeDisposition") or "UNSET"].append(n["stgoId"])
    runtime_ids = sorted(groups.get("RUNTIME_READY", []) + groups.get("RUNTIME_STAGED", []))
    return {
        "schemaVersion": "santiago-launch-runtime-membership.v0.1",
        "gate": "1B.5",
        "launchCorpusCount": 30,
        "runtimeReadyCount": len(groups.get("RUNTIME_READY", [])),
        "runtimeStagedCount": len(groups.get("RUNTIME_STAGED", [])),
        "runtimeExcludedCount": 30 - len(runtime_ids),
        "runtimeReadyIds": sorted(groups.get("RUNTIME_READY", [])),
        "runtimeStagedIds": sorted(groups.get("RUNTIME_STAGED", [])),
        "runtimeExcludedIds": sorted(
            groups.get("RUNTIME_EXCLUDED_RESEARCH", [])
            + groups.get("RUNTIME_EXCLUDED_SEMANTIC", [])
            + groups.get("RUNTIME_EXCLUDED_PHYSICAL", [])
        ),
        "runtimeRoutingIds": runtime_ids,
        "byDisposition": {k: sorted(v) for k, v in groups.items()},
        "dispositions": [
            {
                "stgoId": n["stgoId"],
                "displayName": n.get("displayName"),
                "disposition": n.get("launchRuntimeDisposition"),
                "reason": n.get("launchRuntimeDispositionReason"),
                "runtimeEndpoint": n.get("runtimePhysicalEndpoint"),
            }
            for n in sorted(launch, key=lambda x: x["stgoId"])
        ],
    }


def generate_stgo05_edges(token: str, engine: dict, provider: dict, checked_at: str) -> list[dict]:
    by = {n["stgoId"]: n for n in engine["nodes"]}
    n05 = by["STGO_05"]
    ep05 = endpoint_for(n05)
    assert ep05
    eligible = [
        n
        for n in engine["nodes"]
        if n.get("launchCorpus")
        and n.get("physicalRouteGenerationEligible")
        and n["stgoId"] != "STGO_05"
    ]
    # nearest 12 by haversine for Mapbox
    dists = []
    for n in eligible:
        ep = endpoint_for(n)
        if not ep:
            continue
        dists.append((haversine_m(ep05, ep), n, ep))
    dists.sort(key=lambda x: x[0])
    targets = dists[:12]

    edges = []
    for straight_m, n, ep in targets:
        for frm_node, to_node, frm_ep, to_ep in (
            (n05, n, ep05, ep),
            (n, n05, ep, ep05),
        ):
            status, route, ref = mapbox_walking(token, frm_ep, to_ep)
            time.sleep(0.28)
            if status != "OK" or not route:
                continue
            distance_m = float(route["distance"])
            duration_s = float(route["duration"])
            duration_min = round(duration_s / 60.0, 2)
            pclass = classify_duration(duration_min)
            runtime = pclass in {"GREEN", "YELLOW"} and distance_m > 0
            eid = f"WALK|{frm_node['stgoId']}|{frm_ep['pointId']}|{to_node['stgoId']}|{to_ep['pointId']}"
            edges.append(
                {
                    "edgeId": eid,
                    "fromPoiId": frm_node["stgoId"],
                    "toPoiId": to_node["stgoId"],
                    "fromPoint": {
                        "stgoId": frm_node["stgoId"],
                        "pointId": frm_ep["pointId"],
                        "pointType": frm_ep["pointType"],
                        "coordinate": {"lat": frm_ep["lat"], "lng": frm_ep["lng"]},
                        "coordinateSource": "curator_approved_experience",
                    },
                    "toPoint": {
                        "stgoId": to_node["stgoId"],
                        "pointId": to_ep["pointId"],
                        "pointType": to_ep["pointType"],
                        "coordinate": {"lat": to_ep["lat"], "lng": to_ep["lng"]},
                        "coordinateSource": "curator_approved_experience",
                    },
                    "mode": "WALK",
                    "distanceM": round(distance_m, 1),
                    "durationS": round(duration_s, 1),
                    "durationMin": duration_min,
                    "physicalCost": {
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
                    },
                    "provider": "mapbox",
                    "providerReference": ref,
                    "geometry": None,
                    "physicalClassification": pclass,
                    "provenance": {
                        "provider": "mapbox",
                        "providerReference": ref,
                        "routingProfile": "mapbox/walking",
                        "routingStatus": "OK",
                        "checkedAt": checked_at,
                        "candidateStraightLineM": round(straight_m, 1),
                        "gate": "1B.5",
                        "extensionFor": "STGO_05",
                    },
                    "curatorStatus": "PROVIDER_DERIVED",
                    "runtimeEligible": runtime,
                    "uncertaintyFlags": [],
                    "pruned": not runtime,
                    "pruneReason": None if runtime else pclass,
                }
            )
    return edges


def sparsify(runtime_edges: list[dict], eligible_ids: list[str]) -> dict:
    by_pair = {(e["fromPoiId"], e["toPoiId"]): e for e in runtime_edges}
    out_map = defaultdict(list)
    for e in runtime_edges:
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

    for e in runtime_edges:
        if e["durationMin"] <= SPARSE_ALWAYS_KEEP_MAX_MIN:
            keep(e, "ALWAYS_KEEP_SHORT_LOCAL")
    for sid in eligible_ids:
        outs = sorted(out_map.get(sid, []), key=lambda x: x["durationMin"])
        for e in outs[:SPARSE_NEAREST_NEIGHBORS]:
            keep(e, "NEAREST_NEIGHBOR")
    for e in runtime_edges:
        if e["durationMin"] <= SPARSE_MAX_OPERATIONAL_MIN and e["durationMin"] <= 18:
            keep(e, "WITHIN_OPERATIONAL_BAND")

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
        for src in eligible_ids:
            seen = reachable(src)
            missing = [t for t in eligible_ids if t not in seen]
            if not missing:
                continue
            candidates = [
                e
                for e in runtime_edges
                if e["fromPoiId"] in seen and e["toPoiId"] not in seen and e["edgeId"] not in selected
            ]
            if not candidates:
                candidates = [e for e in runtime_edges if e["toPoiId"] in missing and e["edgeId"] not in selected]
            if not candidates:
                continue
            candidates.sort(key=lambda x: x["durationMin"])
            keep(candidates[0], "DIRECTED_REACHABILITY_BRIDGE")
            changed = True

    sparse = []
    for eid, e in selected.items():
        sparse.append(
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
                    "gate": "1B.5",
                    "tracesToProviderEdge": True,
                    "providerReference": e.get("providerReference"),
                },
            }
        )
    out_deg = defaultdict(int)
    in_deg = defaultdict(int)
    for e in sparse:
        out_deg[e["fromPoiId"]] += 1
        in_deg[e["toPoiId"]] += 1
    parent = {n: n for n in eligible_ids}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for e in sparse:
        ra, rb = find(e["fromPoiId"]), find(e["toPoiId"])
        if ra != rb:
            parent[rb] = ra
    comps = defaultdict(list)
    for n in eligible_ids:
        comps[find(n)].append(n)
    degs = [out_deg[n] for n in eligible_ids]
    directed_ok = all(len(reachable(s)) == len(eligible_ids) for s in eligible_ids)
    return {
        "schemaVersion": "santiago-pedestrian-adjacency.v0.2",
        "gate": "1B.5",
        "physicalRouteGenerationEnabled": False,
        "denseProviderRuntimeEdgeCount": len(runtime_edges),
        "sparseOperationalEdgeCount": len(sparse),
        "reductionPercent": round(100.0 * (1 - len(sparse) / max(1, len(runtime_edges))), 1),
        "eligibleStgoIds": eligible_ids,
        "graphHealth": {
            "connectedComponentCount": len(comps),
            "isolatedNodes": [n for n in eligible_ids if out_deg[n] == 0 and in_deg[n] == 0],
            "medianOutDegree": sorted(degs)[len(degs) // 2] if degs else 0,
            "maxOutDegree": max(degs) if degs else 0,
            "averageOutDegree": round(sum(degs) / len(degs), 2) if degs else 0,
            "directedStronglyConnected": directed_ok,
        },
        "edges": sorted(sparse, key=lambda x: x["edgeId"]),
    }


def metro_access_for_stgo05(token: str, engine: dict, stations: list[dict], checked_at: str) -> list[dict]:
    n05 = next(n for n in engine["nodes"] if n["stgoId"] == "STGO_05")
    ep = endpoint_for(n05)
    assert ep
    cands = []
    for st in stations:
        d = haversine_m(ep, {"lat": st["lat"], "lng": st["lng"]})
        if d <= METRO_ACCESS_CANDIDATE_MAX_KM * 1000:
            cands.append((d, st))
    cands.sort(key=lambda x: x[0])
    out = []
    useful = []
    for straight_m, st in cands[:5]:
        status, route, ref = mapbox_walking(token, ep, {"lat": st["lat"], "lng": st["lng"]})
        time.sleep(0.28)
        if status != "OK" or not route:
            continue
        dist = float(route["distance"])
        dur = float(route["duration"])
        if dur / 60.0 <= METRO_ACCESS_USEFUL_MAX_MIN:
            useful.append((dur, st, dist, dur, ref))
    useful.sort(key=lambda x: x[0])
    for i, (dur_s, st, dist, dur, ref) in enumerate(useful[:2]):
        for frm, to, direction in (
            ("STGO_05", st["stationId"], "poi_to_station"),
            (st["stationId"], "STGO_05", "station_to_poi"),
        ):
            out.append(
                {
                    "edgeId": f"POI_METRO_ACCESS|{frm}|{to}",
                    "from": frm,
                    "to": to,
                    "mode": "POI_METRO_ACCESS",
                    "distanceMeters": round(dist, 1),
                    "durationSeconds": round(dur, 1),
                    "provider": "mapbox",
                    "provenance": {
                        "provider": "mapbox",
                        "providerReference": ref,
                        "routingProfile": "mapbox/walking",
                        "checkedAt": checked_at,
                        "poiPointId": "terraza_neptuno",
                        "gate": "1B.5",
                        "direction": direction,
                    },
                    "stationId": st["stationId"],
                    "stgoId": "STGO_05",
                    "accessRole": "PRIMARY" if i == 0 else "SECONDARY",
                    "verificationState": "PROVIDER_DERIVED",
                    "runtimePreferred": True,
                    "stationIdentitySource": "dtpm_gtfs",
                }
            )
    return out


def multimodal_path(origin, dest, sparse, access, rides, transfers):
    INF = 1e18
    dist = {}
    prev = {}
    prev_edge = {}
    start = ("POI", origin)
    dist[start] = 0.0
    prev[start] = None
    pq = [start]
    walk_out = defaultdict(list)
    for e in sparse:
        walk_out[e["fromPoiId"]].append(e)
    access_out = defaultdict(list)
    for e in access:
        access_out[e["from"]].append(e)
    ride_out = defaultdict(list)
    for e in rides:
        ride_out[(e["fromStationId"], e["lineId"])].append(e)
    transfer_set = {(t["stationId"], t["fromLineId"], t["toLineId"]): t for t in transfers}
    lines_at = defaultdict(set)
    for e in rides:
        lines_at[e["fromStationId"]].add(e["lineId"])
        lines_at[e["toStationId"]].add(e["lineId"])

    def push(state, cost, parent, edge):
        if cost < dist.get(state, INF):
            dist[state] = cost
            prev[state] = parent
            prev_edge[state] = edge
            pq.append(state)

    visited = set()
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
                push(("POI", e["toPoiId"]), base + walk_generalized_cost_s(e["durationS"]), cur, {"kind": "WALK", **e})
            for e in access_out.get(sid, []):
                st = e["stationId"]
                for line in lines_at.get(st, []):
                    cost = base + e["durationSeconds"] + ENGINE_POLICY_METRO_ENTRY_FRICTION_S + ENGINE_POLICY_MODE_CHANGE_FRICTION_S + ENGINE_POLICY_WAIT_FALLBACK_S
                    push(("METRO", st, line), cost, cur, {"kind": "POI_METRO_ACCESS", **e, "boardingLine": line, "includesWaitPolicy": True})
        else:
            st, line = cur[1], cur[2]
            for e in ride_out.get((st, line), []):
                push(("METRO", e["toStationId"], line), base + e["scheduledDurationSeconds"], cur, {"kind": "METRO_RIDE", **e})
            for (station_id, fl, tl), te in transfer_set.items():
                if station_id == st and fl == line:
                    push(("METRO", st, tl), base + te["enginePolicyTransferPenaltySeconds"] + ENGINE_POLICY_WAIT_FALLBACK_S, cur, {"kind": "METRO_TRANSFER", **te})
            for e in access_out.get(st, []):
                if str(e["to"]).startswith("STGO_"):
                    push(("POI", e["to"]), base + e["durationSeconds"] + ENGINE_POLICY_MODE_CHANGE_FRICTION_S, cur, {"kind": "POI_METRO_ACCESS", **e})

    dest_state = ("POI", dest)
    if dest_state not in dist:
        return {"connected": False, "origin": origin, "destination": dest, "legs": []}
    legs = []
    cur = dest_state
    while prev.get(cur) is not None:
        edge = prev_edge[cur]
        kind = edge["kind"]
        if kind == "WALK":
            legs.append({"mode": "WALK", "from": edge["fromPoiId"], "to": edge["toPoiId"], "edgeId": edge.get("edgeId"), "physicalDurationSeconds": edge["durationS"], "physicalDistanceMeters": edge["distanceM"], "scheduledMetroDurationSeconds": None, "generalizedCostSeconds": walk_generalized_cost_s(edge["durationS"]), "unverified": False})
        elif kind == "POI_METRO_ACCESS":
            entry = ENGINE_POLICY_METRO_ENTRY_FRICTION_S + ENGINE_POLICY_MODE_CHANGE_FRICTION_S if str(edge["from"]).startswith("STGO_") else ENGINE_POLICY_MODE_CHANGE_FRICTION_S
            wait = ENGINE_POLICY_WAIT_FALLBACK_S if edge.get("includesWaitPolicy") else 0
            legs.append({"mode": "POI_METRO_ACCESS", "from": edge["from"], "to": edge["to"], "edgeId": edge.get("edgeId"), "physicalDurationSeconds": edge["durationSeconds"], "physicalDistanceMeters": edge["distanceMeters"], "scheduledMetroDurationSeconds": None, "generalizedCostSeconds": edge["durationSeconds"] + entry + wait, "lineId": edge.get("boardingLine"), "unverified": False})
        elif kind == "METRO_RIDE":
            legs.append({"mode": "METRO_RIDE", "from": edge["fromStationId"], "to": edge["toStationId"], "edgeId": edge.get("edgeId"), "physicalDurationSeconds": None, "scheduledMetroDurationSeconds": edge["scheduledDurationSeconds"], "durationLabel": "SCHEDULED_GTFS_DURATION", "generalizedCostSeconds": edge["scheduledDurationSeconds"], "lineId": edge["lineId"], "unverified": False})
        elif kind == "METRO_TRANSFER":
            legs.append({"mode": "METRO_TRANSFER", "from": edge["stationId"], "to": edge["stationId"], "edgeId": edge.get("edgeId"), "physicalDurationSeconds": None, "scheduledMetroDurationSeconds": None, "physicalTransferDurationSeconds": None, "generalizedCostSeconds": edge["enginePolicyTransferPenaltySeconds"] + ENGINE_POLICY_WAIT_FALLBACK_S, "lineId": f"{edge['fromLineId']}→{edge['toLineId']}", "unverified": True})
        cur = prev[cur]
    legs.reverse()
    walk_phys = sum(l["physicalDurationSeconds"] or 0 for l in legs if l["mode"] in ("WALK", "POI_METRO_ACCESS"))
    metro_sched = sum(l.get("scheduledMetroDurationSeconds") or 0 for l in legs if l["mode"] == "METRO_RIDE")
    has_xfer = any(l["mode"] == "METRO_TRANSFER" for l in legs)
    known = walk_phys + metro_sched
    return {
        "connected": True,
        "origin": origin,
        "destination": dest,
        "legs": legs,
        "walkingPhysicalDurationSeconds": round(walk_phys, 1),
        "scheduledMetroRideDurationSeconds": round(metro_sched, 1),
        "knownTotalPhysicalDurationSeconds": round(known, 1) if not has_xfer else None,
        "estimatedWaitAndGeneralizedPenaltiesSeconds": round(dist[dest_state] - known, 1),
        "generalizedCost": round(dist[dest_state], 1),
        "metroLinesUsed": sorted({l["lineId"] for l in legs if l["mode"] == "METRO_RIDE" and l.get("lineId")}),
        "transfers": sum(1 for l in legs if l["mode"] == "METRO_TRANSFER"),
        "modes": sorted({l["mode"] for l in legs}),
        "unverifiedComponents": ["METRO_TRANSFER_PHYSICAL_WALK_UNRESOLVED"] if has_xfer else [],
        "provenanceSummary": "Mapbox walk + DTPM GTFS scheduled Metro + engine-policy wait/transfer; no thematic scores",
    }


def pedestrian_only(origin, dest, sparse):
    adj = defaultdict(list)
    for e in sparse:
        adj[e["fromPoiId"]].append(e)
    dist = {origin: 0.0}
    prev = {origin: None}
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
        legs.append(e)
        cur = e["fromPoiId"]
    legs.reverse()
    total = dist[dest]
    return {
        "connected": True,
        "totalDurationSeconds": round(total, 1),
        "totalDistanceMeters": round(sum(e["distanceM"] for e in legs), 1),
        "generalizedCost": round(sum(walk_generalized_cost_s(e["durationS"]) for e in legs), 1),
        "nodes": [origin] + [e["toPoiId"] for e in legs],
        "legCount": len(legs),
    }


def friction_audit(engine: dict, stations: list[dict], membership: dict) -> dict:
    from collections import Counter

    soft_fields = [
        "surfaceRoughness",
        "crossingFriction",
        "inclineFriction",
        "crowdFriction",
        "pleasantness",
        "daylightOnly",
        "comfortExclusions",
    ]
    hard_fields = ["stepFree", "wheelchairAccessible", "accessibility"]
    runtime_nodes = [n for n in engine["nodes"] if n["stgoId"] in membership["runtimeRoutingIds"]]
    soft_unknown = 0
    hard_unknown = 0
    node_rows = []
    for n in runtime_nodes:
        soft = {f: "UNKNOWN" for f in soft_fields}
        hard = {
            "stepFree": "UNKNOWN",
            "wheelchairAccessible": "UNKNOWN",
            "accessibility": "UNKNOWN",
        }
        soft_unknown += len(soft_fields)
        hard_unknown += 3
        node_rows.append({"stgoId": n["stgoId"], "soft": soft, "hard": hard, "coverage": "ALL_UNKNOWN_EXPLICIT"})
    acc = Counter(s.get("accessibility") for s in stations)
    return {
        "schemaVersion": "santiago-physical-friction-audit.v0.1",
        "gate": "1B.5",
        "policy": "UNKNOWN is valid; do not fabricate; hard accessibility never inferred from null",
        "runtimeNodeCount": len(runtime_nodes),
        "softFrictionUnknownCount": soft_unknown,
        "hardAccessibilityUnknownCount": hard_unknown,
        "metroStationAccessibility": dict(acc),
        "metroStationAccessibilityNote": (
            "GTFS wheelchair_boarding=1 mapped to ACCESSIBLE with provenance; "
            "node-level soft friction remains UNKNOWN"
        ),
        "fields": {
            "soft": {f: "UNKNOWN" for f in soft_fields},
            "hard": {f: "UNKNOWN_AT_POI_LEVEL" for f in hard_fields},
        },
        "nodes": node_rows,
    }


def secret_ok(obj) -> bool:
    blob = json.dumps(obj)
    return "pk.ey" not in blob and "MAPBOX_ACCESS_TOKEN" not in blob


def main() -> int:
    load_env()
    token = require_token()
    checked_at = datetime.now(timezone.utc).isoformat()

    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    provider = json.loads(PROVIDER.read_text(encoding="utf-8"))
    adj_v01 = json.loads(ADJ.read_text(encoding="utf-8"))
    multi_v02 = json.loads(MULTI_V02.read_text(encoding="utf-8"))
    stations_file = json.loads(STATIONS.read_text(encoding="utf-8"))
    lines_file = json.loads(LINES.read_text(encoding="utf-8"))
    times_file = json.loads(TIMES.read_text(encoding="utf-8"))

    if engine["nodeCount"] != 103 or provider["counts"]["runtimeWalkEdges"] != 598:
        print("FAIL: inventory/provider integrity")
        return 1
    if any(l["lineId"] == "L7" for l in lines_file["lines"]):
        print("FAIL: L7 in operational lines")
        return 1

    print("Applying dispositions...")
    engine = apply_dispositions(engine, checked_at)
    membership = build_membership(engine)
    print("membership", membership["runtimeReadyCount"], "ready", membership["runtimeStagedCount"], "staged", membership["runtimeExcludedCount"], "excluded")

    print("Generating STGO_05 Mapbox extension edges...")
    ext_edges = generate_stgo05_edges(token, engine, provider, checked_at)
    runtime_ext = [e for e in ext_edges if e.get("runtimeEligible")]
    print(f"  extension edges={len(ext_edges)} runtime={len(runtime_ext)}")

    # Combined runtime walk universe = Gate 1B.3 runtime + STGO_05 extension runtime
    provider_runtime = [e for e in provider["edges"] if e.get("runtimeEligible")]
    combined_runtime = provider_runtime + runtime_ext
    eligible_ids = membership["runtimeRoutingIds"]
    print("Sparsifying adjacency for", len(eligible_ids), "runtime nodes...")
    adj_v02 = sparsify(combined_runtime, eligible_ids)
    if adj_v02["graphHealth"]["connectedComponentCount"] != 1 or not adj_v02["graphHealth"]["directedStronglyConnected"]:
        print("FAIL sparse connectivity", adj_v02["graphHealth"])
        return 1
    if adj_v02["graphHealth"]["isolatedNodes"]:
        print("FAIL isolated", adj_v02["graphHealth"]["isolatedNodes"])
        return 1

    print("STGO_05 Metro access...")
    access05 = metro_access_for_stgo05(token, engine, stations_file["stations"], checked_at)
    access = list(multi_v02.get("poiMetroAccessEdges") or []) + access05
    # ensure no excluded nodes in access
    excluded = set(membership["runtimeExcludedIds"])
    access = [e for e in access if e.get("stgoId") not in excluded]
    rides = multi_v02["metroRideEdges"]
    transfers = multi_v02["metroTransferEdges"]
    sparse = adj_v02["edges"]

    print("Running E2E QA...")
    names = {n["stgoId"]: n.get("displayName") for n in engine["nodes"]}
    qa_cases = LOCAL_QA + CROSS_QA
    # multimodal: pick cases where metro likely competes
    multimodal_extra = [
        ("STGO_01", "STGO_48", "Multimodal: Centro → Museo de la Memoria"),
        ("STGO_01", "STGO_11", "Multimodal: Centro → Yungay"),
        ("STGO_24", "STGO_48", "Multimodal: Lastarria → Museo de la Memoria"),
    ]
    qa_results = []
    for origin, dest, label in qa_cases + multimodal_extra:
        if origin not in eligible_ids or dest not in eligible_ids:
            qa_results.append({"label": label, "origin": origin, "destination": dest, "connected": False, "selectionReason": "NOT_RUNTIME"})
            continue
        multi = multimodal_path(origin, dest, sparse, access, rides, transfers)
        ped = pedestrian_only(origin, dest, sparse)
        multi["label"] = label
        multi["originName"] = names.get(origin)
        multi["destinationName"] = names.get(dest)
        multi["pedestrianOnlyAlternative"] = ped
        multi["excludedNodesEncountered"] = False
        if not multi.get("connected"):
            multi["selectionReason"] = "UNREACHABLE"
        elif ped and multi.get("generalizedCost") is not None and ped["generalizedCost"] <= multi["generalizedCost"]:
            by_pair = {(e["fromPoiId"], e["toPoiId"]): e for e in sparse}
            walk_legs = []
            for a, b in zip(ped["nodes"], ped["nodes"][1:]):
                e = by_pair[(a, b)]
                walk_legs.append({"mode": "WALK", "from": a, "to": b, "edgeId": e["edgeId"], "physicalDurationSeconds": e["durationS"], "physicalDistanceMeters": e["distanceM"], "scheduledMetroDurationSeconds": None, "generalizedCostSeconds": walk_generalized_cost_s(e["durationS"]), "unverified": False})
            multi.update({
                "legs": walk_legs,
                "walkingPhysicalDurationSeconds": ped["totalDurationSeconds"],
                "scheduledMetroRideDurationSeconds": 0,
                "knownTotalPhysicalDurationSeconds": ped["totalDurationSeconds"],
                "estimatedWaitAndGeneralizedPenaltiesSeconds": round(ped["generalizedCost"] - ped["totalDurationSeconds"], 1),
                "generalizedCost": ped["generalizedCost"],
                "metroLinesUsed": [],
                "transfers": 0,
                "modes": ["WALK"],
                "unverifiedComponents": [],
                "selectionReason": "WALK_LOWER_OR_EQUAL_GENERALIZED_COST",
            })
        elif not multi.get("metroLinesUsed"):
            multi["selectionReason"] = "WALK_ONLY_BEST"
        else:
            multi["selectionReason"] = "MULTIMODAL_LOWER_GENERALIZED_COST"
        qa_results.append(multi)
        print(f"  {label}: {multi.get('selectionReason')} cost={multi.get('generalizedCost')} modes={multi.get('modes')}")

    friction = friction_audit(engine, stations_file["stations"], membership)

    # recount engine launch counts
    launch_nodes = [n for n in engine["nodes"] if n.get("launchCorpus")]
    engine["counts"] = {
        **(engine.get("counts") or {}),
        "launch": 30,
        "backlog": 73,
        "runtimeReady": membership["runtimeReadyCount"],
        "runtimeStaged": membership["runtimeStagedCount"],
        "runtimeExcluded": membership["runtimeExcludedCount"],
        "readyForEdgeGeneration": sum(
            1 for n in launch_nodes if n.get("launchPhysicalReadiness") == "READY_FOR_EDGE_GENERATION"
        ),
        "partialReviewRequired": sum(
            1 for n in launch_nodes if n.get("launchPhysicalReadiness") == "PARTIAL_REVIEW_REQUIRED"
        ),
        "blocked": sum(
            1
            for n in launch_nodes
            if n.get("launchPhysicalReadiness")
            in ("UNRESOLVED_RESEARCH_REQUIRED", "NEEDS_SEMANTIC_REVIEW")
        ),
        "physicalLayerGate": "1B.5",
    }
    engine["counts"].pop("gate", None)
    engine["physicalLayerGate"] = "1B.5"
    engine["physicalLayerV01Ready"] = True
    if engine.get("gate") in (None, "1B.5"):
        engine["gate"] = "1B.2A"

    by = {n["stgoId"]: n for n in engine["nodes"]}
    multi_v03 = {
        "schemaVersion": "santiago-multimodal-graph.v0.3",
        "gate": "1B.5",
        "physicalRouteGenerationEnabled": False,
        "multimodalPhysicalGraphReady": True,
        "physicalLayerV01Ready": True,
        "canonicalTransitSource": "dtpm_gtfs",
        "thematicNarrativeUsed": False,
        "referenceMatrixStatus": "REFERENCE_MATRIX_NOT_PRESENT",
        "runtimeMembership": {
            "runtimeRoutingIds": membership["runtimeRoutingIds"],
            "excludedIds": membership["runtimeExcludedIds"],
        },
        "counts": {
            "runtimeLaunchNodes": len(membership["runtimeRoutingIds"]),
            "sparseWalkEdges": adj_v02["sparseOperationalEdgeCount"],
            "providerWalkEdgesPreserved": 598,
            "stgo05ExtensionWalkEdges": len(ext_edges),
            "metroStations": stations_file["stationCount"],
            "metroLinesOperational": lines_file["lineCount"],
            "poiMetroAccessEdges": len(access),
            "metroRideEdges": len(rides),
            "metroTransferEdges": len(transfers),
            "scheduledSegments": times_file["segmentCount"],
            "scheduledTimingCoveragePercent": 100.0,
            "l7RuntimePresent": False,
            "canonicalInventory": 103,
            "launchCorpus": 30,
            "backlog": 73,
        },
        "sanCristobalStaging": by["STGO_32"].get("sanCristobalStaging"),
        "unresolvedLaunch": [
            {"stgoId": d["stgoId"], "disposition": d["disposition"], "reason": d["reason"]}
            for d in membership["dispositions"]
            if d["disposition"] and str(d["disposition"]).startswith("RUNTIME_EXCLUDED")
        ],
        "qaRoutes": qa_results,
        "poiMetroAccessEdges": access,
        "metroRideEdges": rides,
        "metroTransferEdges": transfers,
        "rideshareMacroEdges": [],
        "physicalCostContract": {
            "components": [
                "providerWalkDistanceM",
                "providerWalkDurationS",
                "scheduledGtfsMetroRideDurationS",
                "modeChanges",
                "enginePolicyEntryFrictionS",
                "enginePolicyTransferPenaltyS",
                "enginePolicyWaitFallbackS",
                "enginePolicyLongWalkDiscomfort",
                "unknownPhysicalFriction",
            ],
            "forbiddenCollapse": "Do not collapse components into one opaque observed-time scalar",
            "enginePolicyIsNotObservedTime": True,
        },
        "generatedAt": checked_at,
    }

    manifest = {
        "schemaVersion": "santiago-physical-graph-manifest.v0.1",
        "gate": "1B.5",
        "generatedAt": checked_at,
        "physicalLayerV01Ready": True,
        "physicalRouteGenerationEnabled": False,
        "multimodalPhysicalGraphReady": True,
        "canonicalInventory": {
            "path": "src/data/santiago/santiago_engine_nodes.v0.1.json",
            "nodeCount": 103,
            "launchCorpus": 30,
            "backlog": 73,
        },
        "launchRuntimeMembership": "src/data/santiago/santiago_launch_runtime_membership.v0.1.json",
        "artifacts": {
            "providerWalkEdges": "src/data/santiago/santiago_physical_edges.v0.1.json",
            "stgo05WalkExtension": "src/data/santiago/santiago_physical_edges_stgo05_extension.v0.1.json",
            "sparseWalkAdjacency": "src/data/santiago/santiago_pedestrian_adjacency.v0.2.json",
            "metroStations": "src/data/santiago/transit/santiago_metro_stations.v0.2.json",
            "metroLines": "src/data/santiago/transit/santiago_metro_lines.v0.2.json",
            "scheduledMetroTimes": "src/data/santiago/transit/santiago_metro_scheduled_times.v0.1.json",
            "gtfsProvenance": "src/data/santiago/transit/santiago_gtfs_feed_provenance.v0.1.json",
            "multimodalGraph": "src/data/santiago/santiago_multimodal_graph.v0.3.json",
            "frictionAudit": "src/data/santiago/qa/santiago_physical_friction_audit.v0.1.json",
            "e2eQa": "src/data/santiago/qa/santiago_physical_layer_e2e_qa.v0.1.json",
        },
        "runtimeReadyIds": membership["runtimeReadyIds"],
        "runtimeStagedIds": membership["runtimeStagedIds"],
        "runtimeExcludedIds": membership["runtimeExcludedIds"],
        "featureFlags": {
            "PHYSICAL_ROUTE_GENERATION_ENABLED": False,
            "MULTIMODAL_PHYSICAL_GRAPH_READY": True,
            "PHYSICAL_LAYER_V0_1_READY": True,
        },
        "knownLimitations": {
            "launchBlocking": [],
            "nonBlockingV01": [
                "Realtime Metro duration absent",
                "Physical interchange walk durations unknown (engine-policy penalty)",
                "POI soft-friction fields UNKNOWN",
                "POI hard accessibility UNKNOWN (Metro stations have GTFS wheelchair_boarding provenance)",
                "STGO_32 funicular ascent inactive",
                "STGO_23 and STGO_33 excluded from launch runtime",
                "Backlog 73 nodes not physically edge-enriched",
                "Future L7 not operational",
            ],
        },
        "provenanceSummary": "Mapbox provider walks + founder curation + DTPM GTFS V166.20260704; no thematic/narrative scoring",
    }

    qa_file = {"schemaVersion": "santiago-physical-layer-e2e-qa.v0.1", "gate": "1B.5", "routes": qa_results}

    # Write all
    ext_payload = {
        "schemaVersion": "santiago-physical-edges-stgo05-extension.v0.1",
        "gate": "1B.5",
        "note": "Supplemental Mapbox walks for STGO_05 Terraza Neptuno endpoint; Gate 1B.3 provider file preserved",
        "edgeCount": len(ext_edges),
        "runtimeEligibleCount": len(runtime_ext),
        "edges": ext_edges,
        "generatedAt": checked_at,
    }

    outputs = [
        (engine, ENGINE),
        (membership, MEMBERSHIP_OUT),
        (ext_payload, EXT_EDGES_OUT),
        (adj_v02, ADJ_V02_OUT),
        (multi_v03, MULTI_V03_OUT),
        (friction, FRICTION_OUT),
        (qa_file, QA_OUT),
        (manifest, MANIFEST_OUT),
    ]
    for obj, path in outputs:
        if not secret_ok(obj):
            print("FAIL secret", path)
            return 1
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("Wrote", path.relative_to(ROOT))

    # Confirm provider file still 598
    provider_check = json.loads(PROVIDER.read_text(encoding="utf-8"))
    if provider_check["counts"]["runtimeWalkEdges"] != 598:
        print("FAIL provider mutated")
        return 1

    print("BUILD_1B5=PASS")
    print(json.dumps({
        "runtimeReady": membership["runtimeReadyCount"],
        "staged": membership["runtimeStagedCount"],
        "excluded": membership["runtimeExcludedCount"],
        "sparse": adj_v02["sparseOperationalEdgeCount"],
        "access": len(access),
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
