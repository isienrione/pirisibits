#!/usr/bin/env python3
"""Generate human-friendly Gate 1B.4 multimodal curator review HTML."""

from __future__ import annotations

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
ADJ = ROOT / "src/data/santiago/santiago_pedestrian_adjacency.v0.1.json"
STATIONS = ROOT / "src/data/santiago/transit/santiago_metro_stations.v0.1.json"
MULTI = ROOT / "src/data/santiago/santiago_multimodal_graph.v0.1.json"
OUT = ROOT / "docs/city-graph/gate-1b4-multimodal-review.html"


def esc(v) -> str:
    return html.escape("" if v is None else str(v))


def badge(label: str, tone: str) -> str:
    return f'<span class="badge {tone}">{esc(label)}</span>'


def main() -> int:
    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    adj = json.loads(ADJ.read_text(encoding="utf-8"))
    stations = json.loads(STATIONS.read_text(encoding="utf-8"))
    multi = json.loads(MULTI.read_text(encoding="utf-8"))
    names = {n["stgoId"]: n.get("displayName") or n["stgoId"] for n in engine["nodes"]}
    station_names = {s["stationId"]: s["canonicalName"] for s in stations["stations"]}
    station_lines = {s["stationId"]: s["lines"] for s in stations["stations"]}

    neighbors = {sid: [] for sid in adj["eligibleStgoIds"]}
    for e in adj["edges"]:
        neighbors[e["fromPoiId"]].append(e)

    access_by_poi = {}
    for e in multi.get("poiMetroAccessEdges") or []:
        if not str(e["from"]).startswith("STGO_"):
            continue
        access_by_poi.setdefault(e["stgoId"], []).append(e)

    unresolved = {u["stgoId"]: u["reason"] for u in multi.get("unresolvedLaunch") or []}
    launch_ids = engine.get("launchCorpusStgoIds") or []

    cards = ""
    for sid in launch_ids:
        node = next(n for n in engine["nodes"] if n["stgoId"] == sid)
        name = names[sid]
        if sid in unresolved:
            status = badge("BLOCKED", "red") + " " + badge("REVIEW", "yellow")
            body = f"<p class='warn'>{esc(unresolved[sid])}</p>"
        elif sid in adj["eligibleStgoIds"]:
            status = badge("READY", "green")
            neigh = neighbors.get(sid) or []
            neigh_html = "".join(
                f"<li>{esc(names.get(e['toPoiId'], e['toPoiId']))} — {esc(e['durationMin'])} min / {esc(e['distanceM'])} m ({esc(e['physicalClassification'])})</li>"
                for e in sorted(neigh, key=lambda x: x["durationMin"])[:8]
            )
            acc = access_by_poi.get(sid) or []
            acc_html = "".join(
                f"<li><b>{esc(station_names.get(a['stationId'], a['stationId']))}</b> "
                f"({esc(', '.join(station_lines.get(a['stationId'], [])))}) — "
                f"{esc(round(a['durationSeconds']/60,1))} min / {esc(a['distanceMeters'])} m · "
                f"{esc(a['accessRole'])} · Mapbox</li>"
                for a in acc
                if a["from"] == sid
            ) or "<li>No useful Metro access within policy threshold (UNKNOWN / not forced)</li>"
            body = f"""
              <p><b>Sparse walking neighbors</b></p><ul>{neigh_html or '<li>None</li>'}</ul>
              <p><b>Useful Metro station(s)</b></p><ul>{acc_html}</ul>
              <p><b>Unresolved fields:</b> Metro segment times · station accessibility · entrance pins</p>
            """
        else:
            status = badge("REVIEW", "yellow")
            body = "<p>Launch node not in edge-eligible set.</p>"

        cards += f"""
        <article class="card">
          <header>
            {status}
            <strong>{esc(name)}</strong>
            <code>{esc(sid)}</code>
          </header>
          {body}
        </article>"""

    qa = ""
    for r in multi.get("qaRoutes") or []:
        legs = "".join(
            f"<li>{esc(l['mode'])}: {esc(l['from'])} → {esc(l['to'])}"
            f"{(' · '+str(l['physicalDurationSeconds'])+'s') if l.get('physicalDurationSeconds') is not None else ' · observed time UNKNOWN'}"
            f"{(' · line '+str(l.get('lineId'))) if l.get('lineId') else ''}</li>"
            for l in r.get("legs") or []
        )
        ped = r.get("pedestrianOnlyAlternative") or {}
        qa += f"""
        <article class="card">
          <h3>{esc(r.get('label'))}</h3>
          <p>{badge(r.get('selectionReason') or '—', 'blue')} generalized cost={esc(r.get('generalizedCost'))}</p>
          <p>Modes: {esc(', '.join(r.get('modes') or []))} · Transfers: {esc(r.get('transfers'))} ·
             Metro lines: {esc(', '.join(r.get('metroLinesUsed') or []) or 'none')}</p>
          <p>Observed physical duration: {esc(r.get('physicalDurationSeconds') if r.get('physicalDurationSeconds') is not None else 'UNRESOLVED (contains engine-policy Metro hops)')}</p>
          <p>Unverified: {esc(', '.join(r.get('unverifiedComponents') or []) or 'none')}</p>
          <p>Walk-only alternative: {esc(ped.get('totalDurationSeconds'))}s / cost {esc(ped.get('generalizedCost'))}</p>
          <details><summary>Legs</summary><ul>{legs or '<li>None</li>'}</ul></details>
        </article>"""

    staging = multi.get("sanCristobalStaging") or {}
    stages = "".join(
        f"<li><code>{esc(s.get('id'))}</code> — {esc(s.get('status'))} {esc(s.get('note') or '')}</li>"
        for s in staging.get("stages") or []
    )

    counts = multi.get("counts") or {}
    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Gate 1B.4 — Multimodal Physical Graph Review</title>
<style>
body {{ margin:0; font-family: Georgia, "Iowan Old Style", serif; background: linear-gradient(180deg,#f4efe6,#ebe4d8); color:#1a1a1a; }}
header.top, section {{ max-width:1100px; margin:0 auto; padding:18px 20px; }}
.card {{ background:#fffdf8; border:1px solid #d8cfc0; border-radius:14px; padding:14px 16px; margin-bottom:12px; }}
.grid {{ display:grid; gap:12px; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); }}
.badge {{ display:inline-block; font-size:11px; letter-spacing:.04em; padding:2px 8px; border-radius:999px; margin-right:4px; }}
.badge.green {{ background:#d9f0e0; }}
.badge.yellow {{ background:#fff0c2; }}
.badge.red {{ background:#f7d6d6; }}
.badge.blue {{ background:#d9e6f7; }}
.warn {{ background:#fff3cd; padding:8px; border-radius:8px; }}
code {{ background:#f0ebe3; padding:1px 5px; border-radius:4px; font-size:12px; }}
ul {{ margin:6px 0 0 18px; }}
</style>
</head>
<body>
<header class="top">
  <h1>Gate 1B.4 — Santiago multimodal physical graph</h1>
  <p>Curator review. Traveler route generation remains disabled. Observed times and engine-policy costs are labeled separately.</p>
</header>
<section class="card">
  <h2>Summary</h2>
  <p>Dense provider WALK edges: {esc(counts.get('denseProviderWalkEdges'))} · Sparse operational: {esc(counts.get('sparseWalkEdges'))} · Reduction: {esc(counts.get('reductionPercent'))}%</p>
  <p>Metro stations: {esc(counts.get('metroStations'))} · Lines: {esc(counts.get('metroLines'))} · Interchanges: {esc(counts.get('interchangeStations'))}</p>
  <p>POI↔Metro access edges: {esc(counts.get('poiMetroAccessEdges'))} · Ride topology edges: {esc(counts.get('metroRideEdges'))} · Transfers: {esc(counts.get('metroTransferEdges'))}</p>
  <p>Rideshare/macro edges: {esc(counts.get('rideshareMacroEdges'))} · Inventory: {esc(counts.get('canonicalInventory'))} (Launch {esc(counts.get('launchCorpus'))} / Backlog {esc(counts.get('backlog'))})</p>
  <p>Contracts: ENGINE={esc((multi.get('contractRecovery') or {}).get('ENGINE_V0_1_IMPLEMENTATION_CONTRACT.md'))}; PHYSICAL_GRAPH={esc((multi.get('contractRecovery') or {}).get('PHYSICAL_GRAPH_V0.1_CONTRACT.md'))}</p>
  <p>Reference matrix: {esc(multi.get('referenceMatrixStatus'))} · Thematic/narrative used: {esc(multi.get('thematicNarrativeUsed'))}</p>
</section>
<section>
  <h2>San Cristóbal (STGO_32) staged structure</h2>
  <div class="card">
    <p>Routing endpoint: <code>{esc(staging.get('routingEndpoint'))}</code> — funicular base. Summit ascent unresolved.</p>
    <ul>{stages}</ul>
  </div>
</section>
<section>
  <h2>Launch POIs</h2>
  <div class="grid">{cards}</div>
</section>
<section>
  <h2>Multimodal QA routes</h2>
  {qa}
</section>
</body>
</html>"""
    OUT.write_text(doc, encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
