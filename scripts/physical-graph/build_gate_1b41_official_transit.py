#!/usr/bin/env python3
"""
Gate 1B.4.1 — Align Santiago Metro layer to official DTPM GTFS 2026.

- Canonical runtime Metro = L1,L2,L3,L4,L4A,L5,L6 from DTPM GTFS
- L7 excluded as FUTURE_NON_OPERATIONAL (not in official 2026 feed)
- Scheduled segment times from GTFS stop_times (SCHEDULED_GTFS_DURATION)
- OSM retained as supplemental QA only
"""

from __future__ import annotations

import csv
import json
import math
import re
import statistics
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
PROVIDER = ROOT / "src/data/santiago/santiago_physical_edges.v0.1.json"
ADJ = ROOT / "src/data/santiago/santiago_pedestrian_adjacency.v0.1.json"
MULTI_V01 = ROOT / "src/data/santiago/santiago_multimodal_graph.v0.1.json"
OSM_STATIONS_V01 = ROOT / "src/data/santiago/transit/santiago_metro_stations.v0.1.json"

STATIONS_OUT = ROOT / "src/data/santiago/transit/santiago_metro_stations.v0.2.json"
LINES_OUT = ROOT / "src/data/santiago/transit/santiago_metro_lines.v0.2.json"
TIMES_OUT = ROOT / "src/data/santiago/transit/santiago_metro_scheduled_times.v0.1.json"
MULTI_OUT = ROOT / "src/data/santiago/santiago_multimodal_graph.v0.2.json"
FUTURE_OUT = ROOT / "src/data/santiago/qa/santiago_metro_future_non_operational.v0.1.json"
RECON_OUT = ROOT / "src/data/santiago/qa/santiago_metro_osm_gtfs_reconciliation.v0.1.json"
GTFS_META = ROOT / "src/data/santiago/transit/santiago_gtfs_feed_provenance.v0.1.json"

GTFS_ZIP_URL = "https://www.dtpm.cl/descargas/gtfs/GTFS_20260704.zip"
GTFS_ZIP_LOCAL = Path("/tmp/dtpm-gtfs/GTFS_20260704.zip")
GTFS_DIR = Path("/tmp/dtpm-gtfs/extracted")

OPERATIONAL_LINES = ["L1", "L2", "L3", "L4", "L4A", "L5", "L6"]
ENGINE_POLICY_METRO_ENTRY_FRICTION_S = 180
ENGINE_POLICY_METRO_TRANSFER_FRICTION_S = 240
ENGINE_POLICY_MODE_CHANGE_FRICTION_S = 60
ENGINE_POLICY_LONG_WALK_DISCOMFORT_FACTOR = 1.15
ENGINE_POLICY_WAIT_FALLBACK_S = 180  # half of typical ~6 min headway; ENGINE POLICY only
SPARSE_ALWAYS_KEEP_MAX_MIN = 8.0

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


def norm_name(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().strip()
    s = re.sub(r"\s+", " ", s)
    s = s.replace("estacion ", "").replace("estación ", "")
    return s


def haversine_m(a: dict, b: dict) -> float:
    lat1, lon1, lat2, lon2 = map(math.radians, [a["lat"], a["lng"], b["lat"], b["lng"]])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    x = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 6371000 * 2 * math.asin(min(1.0, math.sqrt(x)))


def parse_hhmmss(t: str) -> int | None:
    if not t:
        return None
    parts = t.strip().split(":")
    if len(parts) != 3:
        return None
    h, m, s = map(int, parts)
    return h * 3600 + m * 60 + s


def walk_generalized_cost_s(duration_s: float) -> float:
    threshold = SPARSE_ALWAYS_KEEP_MAX_MIN * 60.0
    if duration_s <= threshold:
        return duration_s
    return threshold + (duration_s - threshold) * ENGINE_POLICY_LONG_WALK_DISCOMFORT_FACTOR


def load_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def ensure_gtfs() -> dict:
    if not GTFS_DIR.exists() or not (GTFS_DIR / "feed_info.txt").exists():
        if not GTFS_ZIP_LOCAL.exists():
            raise SystemExit(f"Official GTFS zip missing at {GTFS_ZIP_LOCAL}. Download from {GTFS_ZIP_URL}")
        GTFS_DIR.mkdir(parents=True, exist_ok=True)
        with ZipFile(GTFS_ZIP_LOCAL) as zf:
            zf.extractall(GTFS_DIR)
    retrieved = Path("/tmp/dtpm-gtfs/retrieved_at.txt")
    retrieved_at = retrieved.read_text().strip() if retrieved.exists() else datetime.now(timezone.utc).isoformat()
    feed_info = load_csv(GTFS_DIR / "feed_info.txt")[0]
    agencies = load_csv(GTFS_DIR / "agency.txt")
    metro_agency = next(a for a in agencies if a["agency_id"] == "M")
    return {
        "sourceUrl": GTFS_ZIP_URL,
        "localZip": str(GTFS_ZIP_LOCAL),
        "retrievedAt": retrieved_at,
        "feedPublisherName": feed_info.get("feed_publisher_name"),
        "feedPublisherUrl": feed_info.get("feed_publisher_url"),
        "feedStartDate": feed_info.get("feed_start_date"),
        "feedEndDate": feed_info.get("feed_end_date"),
        "feedVersion": feed_info.get("feed_version"),
        "agencyId": metro_agency["agency_id"],
        "agencyName": metro_agency["agency_name"],
        "agencyUrl": metro_agency["agency_url"],
        "licenseNote": "Official DTPM GTFS published at dtpm.cl/noticias/gtfs-vigente",
        "operationalLinesPolicy": OPERATIONAL_LINES,
        "futureLinesExcluded": ["L7"],
    }


def build_stations_and_lines(meta: dict) -> tuple[list[dict], list[dict], dict]:
    stops = load_csv(GTFS_DIR / "stops.txt")
    routes = [r for r in load_csv(GTFS_DIR / "routes.txt") if r["agency_id"] == "M"]
    route_ids = {r["route_id"] for r in routes}
    unexpected = sorted(route_ids - set(OPERATIONAL_LINES))
    missing = sorted(set(OPERATIONAL_LINES) - route_ids)
    if unexpected:
        raise SystemExit(f"Unexpected Metro routes in GTFS: {unexpected}")
    if missing:
        raise SystemExit(f"Missing operational Metro routes in GTFS: {missing}")

    raw_metro_stops = [
        s
        for s in stops
        if s.get("location_type") in ("0", "1", "")
        and (
            s.get("location_type") == "1"
            or (s.get("parent_station") and True)
        )
    ]
    # Prefer: all stops that appear on metro trips OR parent stations used by metro
    trips = [t for t in load_csv(GTFS_DIR / "trips.txt") if t["route_id"] in OPERATIONAL_LINES]
    trip_ids = {t["trip_id"] for t in trips}
    trip_route = {t["trip_id"]: t["route_id"] for t in trips}
    trip_dir = {t["trip_id"]: t.get("direction_id") for t in trips}

    # stream stop_times for metro trips only
    stop_seq_by_trip: dict[str, list[tuple[int, str, int | None, int | None]]] = defaultdict(list)
    metro_stop_ids: set[str] = set()
    with (GTFS_DIR / "stop_times.txt").open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tid = row["trip_id"]
            if tid not in trip_ids:
                continue
            sid = row["stop_id"]
            metro_stop_ids.add(sid)
            seq = int(row["stop_sequence"])
            arr = parse_hhmmss(row.get("arrival_time") or "")
            dep = parse_hhmmss(row.get("departure_time") or row.get("arrival_time") or "")
            stop_seq_by_trip[tid].append((seq, sid, arr, dep))

    stops_by_id = {s["stop_id"]: s for s in stops}
    # Map each stop_id used in stop_times to parent station
    def parent_of(stop_id: str) -> str:
        s = stops_by_id.get(stop_id)
        if not s:
            return stop_id
        if s.get("location_type") == "1":
            return s["stop_id"]
        if s.get("parent_station"):
            return s["parent_station"]
        return s["stop_id"]

    parent_ids_used = {parent_of(sid) for sid in metro_stop_ids}
    parents = [stops_by_id[pid] for pid in sorted(parent_ids_used) if pid in stops_by_id]

    stations = []
    for p in parents:
        # lines inferred later
        stations.append(
            {
                "stationId": f"METRO_GTFS_{p['stop_id']}",
                "gtfsStopId": p["stop_id"],
                "canonicalName": p["stop_name"],
                "lat": float(p["stop_lat"]),
                "lng": float(p["stop_lon"]),
                "lines": [],
                "accessibility": "ACCESSIBLE" if p.get("wheelchair_boarding") == "1" else "UNKNOWN",
                "accessibilityProvenance": "gtfs.stops.wheelchair_boarding",
                "provenance": "dtpm_gtfs",
                "provenanceSource": meta["sourceUrl"],
                "feedVersion": meta["feedVersion"],
                "verificationState": "NETWORK_TOPOLOGY_VERIFIED",
                "runtimeOperational": True,
            }
        )
    station_by_gtfs = {s["gtfsStopId"]: s for s in stations}

    # Build line order from longest weekday-ish trips per route+direction
    lines_out = []
    ride_pairs: dict[tuple[str, str, str], list[int]] = defaultdict(list)  # (line, from, to) -> durations

    for route_id in OPERATIONAL_LINES:
        route = next(r for r in routes if r["route_id"] == route_id)
        # pick representative trip per direction: most unique parents
        best_order = None
        best_len = -1
        for tid, seq in stop_seq_by_trip.items():
            if trip_route[tid] != route_id:
                continue
            seq_sorted = sorted(seq, key=lambda x: x[0])
            order = []
            for _, sid, _, _ in seq_sorted:
                pid = parent_of(sid)
                if pid not in station_by_gtfs:
                    continue
                sid_canon = station_by_gtfs[pid]["stationId"]
                if not order or order[-1] != sid_canon:
                    order.append(sid_canon)
            if len(order) > best_len:
                best_len = len(order)
                best_order = order

        if not best_order:
            raise SystemExit(f"No stop sequence for {route_id}")

        for sid in best_order:
            st = next(s for s in stations if s["stationId"] == sid)
            if route_id not in st["lines"]:
                st["lines"].append(route_id)

        lines_out.append(
            {
                "lineId": route_id,
                "canonicalName": route.get("route_long_name") or f"Línea {route_id}",
                "gtfsRouteId": route_id,
                "colour": route.get("route_color") and f"#{route['route_color']}" if route.get("route_color") and not route["route_color"].startswith("#") else route.get("route_color"),
                "stationOrder": best_order,
                "topologyStatus": "NETWORK_TOPOLOGY_VERIFIED",
                "segmentTimingStatus": "SCHEDULED_GTFS_DURATION",
                "runtimeOperational": True,
                "provenance": "dtpm_gtfs",
                "provenanceSource": meta["sourceUrl"],
                "feedVersion": meta["feedVersion"],
            }
        )

        # Collect scheduled durations for adjacent pairs from all trips on this route
        for tid, seq in stop_seq_by_trip.items():
            if trip_route[tid] != route_id:
                continue
            seq_sorted = sorted(seq, key=lambda x: x[0])
            # collapse to parent sequence with times
            collapsed = []
            for _, sid, arr, dep in seq_sorted:
                pid = parent_of(sid)
                if pid not in station_by_gtfs:
                    continue
                canon = station_by_gtfs[pid]["stationId"]
                t = dep if dep is not None else arr
                if not collapsed or collapsed[-1][0] != canon:
                    collapsed.append((canon, t))
            for i in range(len(collapsed) - 1):
                a, ta = collapsed[i]
                b, tb = collapsed[i + 1]
                if ta is None or tb is None:
                    continue
                dur = tb - ta
                if dur <= 0 or dur > 1800:
                    continue
                ride_pairs[(route_id, a, b)].append(dur)

    for s in stations:
        s["lines"] = sorted(s["lines"])

    return stations, lines_out, ride_pairs


def build_scheduled_times(ride_pairs: dict, meta: dict) -> list[dict]:
    out = []
    for (line, a, b), samples in sorted(ride_pairs.items()):
        samples = sorted(samples)
        n = len(samples)
        out.append(
            {
                "segmentId": f"SCHEDULED|{line}|{a}|{b}",
                "lineId": line,
                "fromStationId": a,
                "toStationId": b,
                "durationLabel": "SCHEDULED_GTFS_DURATION",
                "notRealtime": True,
                "sampleCount": n,
                "medianScheduledDurationSeconds": int(statistics.median(samples)),
                "p25ScheduledDurationSeconds": samples[max(0, n // 4)],
                "p75ScheduledDurationSeconds": samples[min(n - 1, (3 * n) // 4)],
                "minScheduledDurationSeconds": samples[0],
                "maxScheduledDurationSeconds": samples[-1],
                "runtimeRepresentativeSeconds": int(statistics.median(samples)),
                "runtimeRepresentativePolicy": "median_scheduled_gtfs_stop_time_delta",
                "serviceContext": {
                    "feedVersion": meta["feedVersion"],
                    "feedStartDate": meta["feedStartDate"],
                    "feedEndDate": meta["feedEndDate"],
                    "agencyId": meta["agencyId"],
                },
                "provenance": {
                    "source": "dtpm_gtfs",
                    "sourceUrl": meta["sourceUrl"],
                    "derivedFrom": "stop_times.arrival/departure deltas on consecutive parent stations",
                },
            }
        )
    return out


def reconcile_osm(stations: list[dict]) -> dict:
    osm = json.loads(OSM_STATIONS_V01.read_text(encoding="utf-8"))["stations"]
    matched = []
    ambiguous = []
    gtfs_only = []
    used_osm = set()
    for st in stations:
        cands = []
        for o in osm:
            d = haversine_m({"lat": st["lat"], "lng": st["lng"]}, {"lat": o["lat"], "lng": o["lng"]})
            name_close = norm_name(st["canonicalName"]) == norm_name(o["canonicalName"])
            if d <= 250 or (name_close and d <= 600):
                score = d - (50 if name_close else 0)
                cands.append((score, d, o, name_close))
        cands.sort(key=lambda x: x[0])
        if not cands:
            gtfs_only.append(st["stationId"])
            continue
        if len(cands) > 1 and abs(cands[0][0] - cands[1][0]) < 30 and not cands[0][3]:
            ambiguous.append(
                {
                    "gtfsStationId": st["stationId"],
                    "gtfsName": st["canonicalName"],
                    "candidates": [
                        {"osmStationId": c[2]["stationId"], "osmName": c[2]["canonicalName"], "distanceM": round(c[1], 1)}
                        for c in cands[:3]
                    ],
                }
            )
            # still take best for mapping if name matches or clearly nearest
        best = cands[0][2]
        used_osm.add(best["stationId"])
        matched.append(
            {
                "gtfsStationId": st["stationId"],
                "gtfsName": st["canonicalName"],
                "osmStationId": best["stationId"],
                "osmName": best["canonicalName"],
                "distanceM": round(cands[0][1], 1),
                "nameExact": cands[0][3],
            }
        )
        st["osmStationIdRef"] = best["stationId"]
        st["osmMatchDistanceM"] = round(cands[0][1], 1)

    osm_only = [o["stationId"] for o in osm if o["stationId"] not in used_osm]
    return {
        "gate": "1B.4.1",
        "osmStationCount": len(osm),
        "gtfsNormalizedStationCount": len(stations),
        "matched": matched,
        "matchedCount": len(matched),
        "gtfsOnly": gtfs_only,
        "gtfsOnlyCount": len(gtfs_only),
        "osmOnly": osm_only,
        "osmOnlyCount": len(osm_only),
        "ambiguous": ambiguous,
        "ambiguousCount": len(ambiguous),
        "osmRole": "supplemental_qa_reference_only",
        "canonicalRuntimeSource": "dtpm_gtfs",
    }


def remap_access(multi_v01: dict, stations: list[dict], recon: dict) -> tuple[list[dict], list[dict]]:
    osm_to_gtfs = {m["osmStationId"]: m["gtfsStationId"] for m in recon["matched"]}
    station_ids = {s["stationId"] for s in stations}
    retained = []
    unresolved = []
    for e in multi_v01.get("poiMetroAccessEdges") or []:
        old = e["stationId"]
        new = osm_to_gtfs.get(old)
        if not new or new not in station_ids:
            unresolved.append(
                {
                    **e,
                    "runtimePreferred": False,
                    "verificationState": "REVIEW_REQUIRED",
                    "unresolvedReason": "OSM_STATION_NOT_RECONCILED_TO_GTFS",
                }
            )
            continue
        ne = dict(e)
        ne["stationId"] = new
        # rewrite from/to endpoints
        if str(ne["from"]).startswith("METRO_"):
            ne["from"] = new
        if str(ne["to"]).startswith("METRO_"):
            ne["to"] = new
        ne["edgeId"] = f"POI_METRO_ACCESS|{ne['from']}|{ne['to']}"
        ne["verificationState"] = "PROVIDER_DERIVED"
        ne["runtimePreferred"] = True
        ne["stationIdentitySource"] = "dtpm_gtfs"
        ne["reconciledFromOsmStationId"] = old
        retained.append(ne)
    return retained, unresolved


def build_rides_transfers(stations: list[dict], lines: list[dict], scheduled: list[dict]) -> tuple[list[dict], list[dict]]:
    sched_lookup = {(s["lineId"], s["fromStationId"], s["toStationId"]): s for s in scheduled}
    rides = []
    for line in lines:
        order = line["stationOrder"]
        for i in range(len(order) - 1):
            for a, b in ((order[i], order[i + 1]), (order[i + 1], order[i])):
                seg = sched_lookup.get((line["lineId"], a, b))
                if not seg:
                    # try reverse sample only — skip if no evidence
                    continue
                rides.append(
                    {
                        "edgeId": f"METRO_RIDE|{line['lineId']}|{a}|{b}",
                        "fromStationId": a,
                        "toStationId": b,
                        "lineId": line["lineId"],
                        "mode": "METRO_RIDE",
                        "observedDurationSeconds": None,
                        "scheduledDurationSeconds": seg["runtimeRepresentativeSeconds"],
                        "durationLabel": "SCHEDULED_GTFS_DURATION",
                        "topologyStatus": "NETWORK_TOPOLOGY_VERIFIED",
                        "segmentTimingStatus": "SCHEDULED_GTFS_DURATION",
                        "enginePolicyHopCostSeconds": None,
                        "runtimeOperational": True,
                        "provenance": {
                            "source": "dtpm_gtfs",
                            "scheduledSegmentId": seg["segmentId"],
                            "sampleCount": seg["sampleCount"],
                        },
                    }
                )
    transfers = []
    for st in stations:
        lines_here = st["lines"]
        for i, a in enumerate(lines_here):
            for b in lines_here[i + 1 :]:
                for fl, tl in ((a, b), (b, a)):
                    transfers.append(
                        {
                            "edgeId": f"METRO_TRANSFER|{st['stationId']}|{fl}|{tl}",
                            "stationId": st["stationId"],
                            "fromLineId": fl,
                            "toLineId": tl,
                            "mode": "METRO_TRANSFER",
                            "observedDurationSeconds": None,
                            "physicalTransferDurationSeconds": None,
                            "enginePolicyTransferPenaltySeconds": ENGINE_POLICY_METRO_TRANSFER_FRICTION_S,
                            "verificationState": "NETWORK_TOPOLOGY_VERIFIED",
                            "runtimeOperational": True,
                            "provenance": {
                                "source": "dtpm_gtfs",
                                "note": "Multi-line membership from operational GTFS topology; physical interchange walk unresolved",
                            },
                        }
                    )
    return rides, transfers


def multimodal_shortest_path(origin, dest, sparse_walk, access, rides, transfers, scheduled_lookup):
    INF = 1e18
    dist: dict[tuple, float] = {}
    prev: dict[tuple, tuple | None] = {}
    prev_edge: dict[tuple, dict] = {}
    start = ("POI", origin)
    dist[start] = 0.0
    prev[start] = None
    pq = [start]

    walk_out = defaultdict(list)
    for e in sparse_walk:
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
                    cost = (
                        base
                        + e["durationSeconds"]
                        + ENGINE_POLICY_METRO_ENTRY_FRICTION_S
                        + ENGINE_POLICY_MODE_CHANGE_FRICTION_S
                        + ENGINE_POLICY_WAIT_FALLBACK_S
                    )
                    push(("METRO", st, line), cost, cur, {"kind": "POI_METRO_ACCESS", **e, "boardingLine": line, "includesWaitPolicy": True})
        else:
            st, line = cur[1], cur[2]
            for e in ride_out.get((st, line), []):
                ride_s = e["scheduledDurationSeconds"]
                push(("METRO", e["toStationId"], line), base + ride_s, cur, {"kind": "METRO_RIDE", **e})
            for (station_id, fl, tl), te in transfer_set.items():
                if station_id == st and fl == line:
                    push(
                        ("METRO", st, tl),
                        base + te["enginePolicyTransferPenaltySeconds"] + ENGINE_POLICY_WAIT_FALLBACK_S,
                        cur,
                        {"kind": "METRO_TRANSFER", **te, "includesWaitPolicy": True},
                    )
            for e in access_out.get(st, []):
                if not str(e["to"]).startswith("STGO_"):
                    continue
                push(
                    ("POI", e["to"]),
                    base + e["durationSeconds"] + ENGINE_POLICY_MODE_CHANGE_FRICTION_S,
                    cur,
                    {"kind": "POI_METRO_ACCESS", **e},
                )

    dest_state = ("POI", dest)
    if dest_state not in dist:
        return {"connected": False, "origin": origin, "destination": dest, "legs": [], "selectionReason": "UNREACHABLE"}

    legs = []
    cur = dest_state
    while prev.get(cur) is not None:
        edge = prev_edge[cur]
        kind = edge["kind"]
        if kind == "WALK":
            legs.append(
                {
                    "mode": "WALK",
                    "from": edge["fromPoiId"],
                    "to": edge["toPoiId"],
                    "edgeId": edge.get("edgeId"),
                    "physicalDurationSeconds": edge["durationS"],
                    "physicalDistanceMeters": edge["distanceM"],
                    "scheduledMetroDurationSeconds": None,
                    "generalizedCostSeconds": walk_generalized_cost_s(edge["durationS"]),
                    "unverified": False,
                }
            )
        elif kind == "POI_METRO_ACCESS":
            entry = ENGINE_POLICY_METRO_ENTRY_FRICTION_S + ENGINE_POLICY_MODE_CHANGE_FRICTION_S if str(edge["from"]).startswith("STGO_") else ENGINE_POLICY_MODE_CHANGE_FRICTION_S
            wait = ENGINE_POLICY_WAIT_FALLBACK_S if edge.get("includesWaitPolicy") else 0
            legs.append(
                {
                    "mode": "POI_METRO_ACCESS",
                    "from": edge["from"],
                    "to": edge["to"],
                    "edgeId": edge.get("edgeId"),
                    "physicalDurationSeconds": edge["durationSeconds"],
                    "physicalDistanceMeters": edge["distanceMeters"],
                    "scheduledMetroDurationSeconds": None,
                    "generalizedCostSeconds": edge["durationSeconds"] + entry + wait,
                    "enginePolicyWaitSeconds": wait or None,
                    "enginePolicyEntryFrictionSeconds": entry if str(edge["from"]).startswith("STGO_") else None,
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
                    "scheduledMetroDurationSeconds": edge["scheduledDurationSeconds"],
                    "durationLabel": "SCHEDULED_GTFS_DURATION",
                    "physicalDistanceMeters": None,
                    "generalizedCostSeconds": edge["scheduledDurationSeconds"],
                    "lineId": edge["lineId"],
                    "unverified": False,
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
                    "scheduledMetroDurationSeconds": None,
                    "physicalTransferDurationSeconds": None,
                    "generalizedCostSeconds": edge["enginePolicyTransferPenaltySeconds"] + ENGINE_POLICY_WAIT_FALLBACK_S,
                    "enginePolicyTransferPenaltySeconds": edge["enginePolicyTransferPenaltySeconds"],
                    "enginePolicyWaitSeconds": ENGINE_POLICY_WAIT_FALLBACK_S,
                    "lineId": f"{edge['fromLineId']}→{edge['toLineId']}",
                    "unverified": True,
                }
            )
        cur = prev[cur]
    legs.reverse()

    walk_phys = sum(l["physicalDurationSeconds"] or 0 for l in legs if l["mode"] in ("WALK", "POI_METRO_ACCESS"))
    metro_sched = sum(l.get("scheduledMetroDurationSeconds") or 0 for l in legs if l["mode"] == "METRO_RIDE")
    has_unresolved_transfer_phys = any(l["mode"] == "METRO_TRANSFER" for l in legs)
    # known total physical = walk + scheduled metro; transfer physical null so exclude from "fully known"
    known_total = walk_phys + metro_sched
    fully_known = not has_unresolved_transfer_phys

    return {
        "connected": True,
        "origin": origin,
        "destination": dest,
        "legs": legs,
        "walkingPhysicalDurationSeconds": round(walk_phys, 1),
        "scheduledMetroRideDurationSeconds": round(metro_sched, 1),
        "knownTotalPhysicalDurationSeconds": round(known_total, 1) if fully_known else None,
        "knownPhysicalComponentsSeconds": {
            "walking": round(walk_phys, 1),
            "scheduledMetroRide": round(metro_sched, 1),
            "transferPhysical": None if has_unresolved_transfer_phys else 0,
        },
        "estimatedWaitAndGeneralizedPenaltiesSeconds": round(dist[dest_state] - known_total, 1),
        "generalizedCost": round(dist[dest_state], 1),
        "modeChanges": sum(1 for i in range(1, len(legs)) if legs[i]["mode"] != legs[i - 1]["mode"]),
        "metroLinesUsed": sorted({l["lineId"] for l in legs if l["mode"] == "METRO_RIDE" and l.get("lineId")}),
        "transfers": sum(1 for l in legs if l["mode"] == "METRO_TRANSFER"),
        "unverifiedComponents": ["METRO_TRANSFER_PHYSICAL_WALK_UNRESOLVED"] if has_unresolved_transfer_phys else [],
        "modes": sorted({l["mode"] for l in legs}),
        "provenanceSummary": "Sparse Mapbox WALK + DTPM GTFS Metro topology/scheduled times + Mapbox POI access; wait/transfer frictions are ENGINE POLICY",
    }


def pedestrian_only_path(origin, dest, sparse_walk):
    adj = defaultdict(list)
    for e in sparse_walk:
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
        "legCount": len(legs),
        "nodes": [origin] + [e["toPoiId"] for e in legs],
    }


def secret_ok(obj) -> bool:
    blob = json.dumps(obj)
    return "pk.ey" not in blob and "MAPBOX_ACCESS_TOKEN" not in blob


def main() -> int:
    checked_at = datetime.now(timezone.utc).isoformat()
    meta = ensure_gtfs()
    print("GTFS", meta["feedVersion"], meta["feedStartDate"], "→", meta["feedEndDate"])

    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    provider = json.loads(PROVIDER.read_text(encoding="utf-8"))
    adj = json.loads(ADJ.read_text(encoding="utf-8"))
    multi_v01 = json.loads(MULTI_V01.read_text(encoding="utf-8"))

    if engine["nodeCount"] != 103:
        print("FAIL inventory")
        return 1
    if provider["counts"]["runtimeWalkEdges"] != 598:
        print("FAIL provider edges mutated")
        return 1

    print("Building GTFS stations/lines/times...")
    stations, lines, ride_pairs = build_stations_and_lines(meta)
    scheduled = build_scheduled_times(ride_pairs, meta)
    print(f"  stations={len(stations)} lines={len(lines)} scheduled_segments={len(scheduled)}")

    # Fail hard if any L7
    if any(l["lineId"] == "L7" for l in lines) or any("L7" in s["lines"] for s in stations):
        print("FAIL: L7 present in operational runtime set")
        return 1

    recon = reconcile_osm(stations)
    print(f"  recon matched={recon['matchedCount']} gtfsOnly={recon['gtfsOnlyCount']} osmOnly={recon['osmOnlyCount']} amb={recon['ambiguousCount']}")

    access, access_unresolved = remap_access(multi_v01, stations, recon)
    print(f"  access retained={len(access)} unresolved={len(access_unresolved)}")

    rides, transfers = build_rides_transfers(stations, lines, scheduled)
    print(f"  rides={len(rides)} transfers={len(transfers)}")

    # Future non-operational artifact
    future = {
        "gate": "1B.4.1",
        "lines": [
            {
                "lineId": "L7",
                "status": "FUTURE_NON_OPERATIONAL",
                "runtimeEligible": False,
                "note": "Line 7 is not present as an operational Metro route in official DTPM GTFS V166.20260704 (valid from 2026-07-04). Excluded from 2026 runtime graph.",
                "previousOsmPresence": "Gate 1B.4 OSM import included unresolved L7 relation",
            }
        ],
    }

    sparse = adj["edges"]
    names = {n["stgoId"]: n.get("displayName") for n in engine["nodes"]}
    eligible = set(provider["eligibleStgoIds"])
    sched_lookup = {(s["lineId"], s["fromStationId"], s["toStationId"]): s for s in scheduled}

    qa = []
    for origin, dest, label in QA_ROUTES:
        if origin not in eligible or dest not in eligible:
            qa.append({"label": label, "origin": origin, "destination": dest, "connected": False, "selectionReason": "NOT_ELIGIBLE"})
            continue
        multi = multimodal_shortest_path(origin, dest, sparse, access, rides, transfers, sched_lookup)
        ped = pedestrian_only_path(origin, dest, sparse)
        multi["label"] = label
        multi["originName"] = names.get(origin)
        multi["destinationName"] = names.get(dest)
        multi["pedestrianOnlyAlternative"] = ped
        if not multi.get("connected"):
            multi["selectionReason"] = "UNREACHABLE"
        elif ped and multi.get("generalizedCost") is not None and ped["generalizedCost"] < multi["generalizedCost"]:
            # prefer walk
            by_pair = {(e["fromPoiId"], e["toPoiId"]): e for e in sparse}
            walk_legs = []
            for a, b in zip(ped["nodes"], ped["nodes"][1:]):
                e = by_pair[(a, b)]
                walk_legs.append(
                    {
                        "mode": "WALK",
                        "from": a,
                        "to": b,
                        "edgeId": e["edgeId"],
                        "physicalDurationSeconds": e["durationS"],
                        "physicalDistanceMeters": e["distanceM"],
                        "scheduledMetroDurationSeconds": None,
                        "generalizedCostSeconds": walk_generalized_cost_s(e["durationS"]),
                        "unverified": False,
                    }
                )
            multi.update(
                {
                    "legs": walk_legs,
                    "walkingPhysicalDurationSeconds": ped["totalDurationSeconds"],
                    "scheduledMetroRideDurationSeconds": 0,
                    "knownTotalPhysicalDurationSeconds": ped["totalDurationSeconds"],
                    "knownPhysicalComponentsSeconds": {"walking": ped["totalDurationSeconds"], "scheduledMetroRide": 0, "transferPhysical": 0},
                    "estimatedWaitAndGeneralizedPenaltiesSeconds": round(ped["generalizedCost"] - ped["totalDurationSeconds"], 1),
                    "generalizedCost": ped["generalizedCost"],
                    "modeChanges": 0,
                    "metroLinesUsed": [],
                    "transfers": 0,
                    "unverifiedComponents": [],
                    "modes": ["WALK"],
                    "selectionReason": "WALK_LOWER_GENERALIZED_COST",
                }
            )
        elif not multi.get("metroLinesUsed"):
            multi["selectionReason"] = "WALK_ONLY_BEST"
        else:
            multi["selectionReason"] = "MULTIMODAL_LOWER_GENERALIZED_COST"
        qa.append(multi)
        print(f"  QA {label}: {multi.get('selectionReason')} cost={multi.get('generalizedCost')} phys={multi.get('knownTotalPhysicalDurationSeconds')} metro={multi.get('scheduledMetroRideDurationSeconds')}")

    timing_coverage = round(100.0 * len(scheduled) / max(1, len(rides)), 1) if rides else 0
    # rides are directed; scheduled segments count should match rides ideally
    rides_with_time = sum(1 for r in rides if r.get("scheduledDurationSeconds") is not None)
    coverage = round(100.0 * rides_with_time / max(1, len(rides)), 1)

    stgo32 = next(n for n in engine["nodes"] if n["stgoId"] == "STGO_32")
    staging = multi_v01.get("sanCristobalStaging") or {
        "stgoId": "STGO_32",
        "routingEndpoint": "funicular",
        "displayName": stgo32.get("displayName"),
    }

    multi_payload = {
        "schemaVersion": "santiago-multimodal-graph.v0.2",
        "gate": "1B.4.1",
        "physicalRouteGenerationEnabled": False,
        "multimodalPhysicalGraphReady": True,
        "canonicalTransitSource": "dtpm_gtfs",
        "gtfsProvenance": meta,
        "osmRole": "supplemental_qa_reference_only",
        "thematicNarrativeUsed": False,
        "referenceMatrixStatus": "REFERENCE_MATRIX_NOT_PRESENT",
        "counts": {
            "denseProviderWalkEdges": 598,
            "sparseWalkEdges": adj["sparseOperationalEdgeCount"],
            "metroStations": len(stations),
            "metroLinesOperational": len(lines),
            "metroRideEdges": len(rides),
            "metroTransferEdges": len(transfers),
            "scheduledSegments": len(scheduled),
            "scheduledTimingCoveragePercent": coverage,
            "poiMetroAccessRetained": len(access),
            "poiMetroAccessUnresolved": len(access_unresolved),
            "rideshareMacroEdges": 0,
            "canonicalInventory": 103,
            "launchCorpus": 30,
            "backlog": 73,
            "l7RuntimePresent": False,
        },
        "sanCristobalStaging": staging,
        "unresolvedLaunch": multi_v01.get("unresolvedLaunch"),
        "qaRoutes": qa,
        "poiMetroAccessEdges": access,
        "poiMetroAccessUnresolved": access_unresolved,
        "metroRideEdges": rides,
        "metroTransferEdges": transfers,
        "rideshareMacroEdges": [],
        "enginePolicyConstants": {
            "METRO_ENTRY_FRICTION_S": ENGINE_POLICY_METRO_ENTRY_FRICTION_S,
            "METRO_TRANSFER_FRICTION_S": ENGINE_POLICY_METRO_TRANSFER_FRICTION_S,
            "MODE_CHANGE_FRICTION_S": ENGINE_POLICY_MODE_CHANGE_FRICTION_S,
            "WAIT_FALLBACK_S": ENGINE_POLICY_WAIT_FALLBACK_S,
            "LONG_WALK_DISCOMFORT_FACTOR": ENGINE_POLICY_LONG_WALK_DISCOMFORT_FACTOR,
            "note": "ENGINE POLICY only — never labeled as scheduled or observed physical duration",
        },
        "transitTimingCoverage": {
            "scheduledMetroSegmentTimes": len(scheduled),
            "observedRealtimeSegmentTimes": 0,
            "observedTransferPhysicalTimes": 0,
            "transferPhysicalCoverage": 0,
            "unresolved": ["METRO_TRANSFER_PHYSICAL_WALK", "REALTIME_DURATION", "FUNICULAR_ASCENT"],
        },
        "generatedAt": checked_at,
    }

    stations_file = {
        "schemaVersion": "santiago-metro-stations.v0.2",
        "gate": "1B.4.1",
        "provenance": "dtpm_gtfs",
        "provenanceSource": meta["sourceUrl"],
        "feedVersion": meta["feedVersion"],
        "stationCount": len(stations),
        "runtimeOperationalLines": OPERATIONAL_LINES,
        "stations": stations,
    }
    lines_file = {
        "schemaVersion": "santiago-metro-lines.v0.2",
        "gate": "1B.4.1",
        "provenance": "dtpm_gtfs",
        "provenanceSource": meta["sourceUrl"],
        "feedVersion": meta["feedVersion"],
        "lineCount": len(lines),
        "runtimeOperationalLines": OPERATIONAL_LINES,
        "lines": lines,
    }
    times_file = {
        "schemaVersion": "santiago-metro-scheduled-times.v0.1",
        "gate": "1B.4.1",
        "durationLabel": "SCHEDULED_GTFS_DURATION",
        "notRealtime": True,
        "runtimeRepresentativePolicy": "median_scheduled_gtfs_stop_time_delta",
        "provenance": meta,
        "segmentCount": len(scheduled),
        "segments": scheduled,
    }

    for obj, path in (
        (meta, GTFS_META),
        (stations_file, STATIONS_OUT),
        (lines_file, LINES_OUT),
        (times_file, TIMES_OUT),
        (multi_payload, MULTI_OUT),
        (future, FUTURE_OUT),
        (recon, RECON_OUT),
    ):
        if not secret_ok(obj):
            print("FAIL secret", path)
            return 1
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("Wrote", path.relative_to(ROOT))

    print("BUILD_1B41=PASS")
    print(json.dumps(multi_payload["counts"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
