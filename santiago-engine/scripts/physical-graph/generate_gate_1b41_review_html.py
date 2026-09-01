#!/usr/bin/env python3
"""Human-friendly Gate 1B.4.1 transit correction curator HTML."""

from __future__ import annotations

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
META = ROOT / "src/data/santiago/transit/santiago_gtfs_feed_provenance.v0.1.json"
LINES = ROOT / "src/data/santiago/transit/santiago_metro_lines.v0.2.json"
TIMES = ROOT / "src/data/santiago/transit/santiago_metro_scheduled_times.v0.1.json"
MULTI = ROOT / "src/data/santiago/santiago_multimodal_graph.v0.2.json"
RECON = ROOT / "src/data/santiago/qa/santiago_metro_osm_gtfs_reconciliation.v0.1.json"
FUTURE = ROOT / "src/data/santiago/qa/santiago_metro_future_non_operational.v0.1.json"
OUT = ROOT / "docs/city-graph/gate-1b41-transit-review.html"


def esc(v) -> str:
    return html.escape("" if v is None else str(v))


def main() -> int:
    meta = json.loads(META.read_text(encoding="utf-8"))
    lines = json.loads(LINES.read_text(encoding="utf-8"))
    times = json.loads(TIMES.read_text(encoding="utf-8"))
    multi = json.loads(MULTI.read_text(encoding="utf-8"))
    recon = json.loads(RECON.read_text(encoding="utf-8"))
    future = json.loads(FUTURE.read_text(encoding="utf-8"))
    counts = multi.get("counts") or {}

    line_rows = "".join(
        f"<tr><td>{esc(l['lineId'])}</td><td>{esc(l['canonicalName'])}</td><td>{esc(len(l['stationOrder']))}</td>"
        f"<td><span class='badge green'>OPERATIONAL</span></td></tr>"
        for l in lines["lines"]
    )
    future_rows = "".join(
        f"<li><b>{esc(l['lineId'])}</b> — {esc(l['status'])}: {esc(l['note'])}</li>" for l in future.get("lines") or []
    )
    qa = ""
    for r in multi.get("qaRoutes") or []:
        qa += f"""
        <article class="card">
          <h3>{esc(r.get('label'))}</h3>
          <p><span class="badge blue">{esc(r.get('selectionReason'))}</span></p>
          <ul>
            <li>Walking physical: {esc(r.get('walkingPhysicalDurationSeconds'))}s</li>
            <li>Scheduled Metro ride: {esc(r.get('scheduledMetroRideDurationSeconds'))}s</li>
            <li>Known total physical: {esc(r.get('knownTotalPhysicalDurationSeconds') if r.get('knownTotalPhysicalDurationSeconds') is not None else 'partial / transfer physical unresolved')}</li>
            <li>Wait + generalized penalties: {esc(r.get('estimatedWaitAndGeneralizedPenaltiesSeconds'))}s</li>
            <li>Generalized cost: {esc(r.get('generalizedCost'))}</li>
            <li>Lines: {esc(', '.join(r.get('metroLinesUsed') or []) or 'none')} · Transfers: {esc(r.get('transfers'))}</li>
            <li>Unverified: {esc(', '.join(r.get('unverifiedComponents') or []) or 'none')}</li>
          </ul>
        </article>"""

    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Gate 1B.4.1 — Official Transit Correction</title>
<style>
body {{ margin:0; font-family: Georgia, serif; background:#f4efe6; color:#1a1a1a; }}
header, section {{ max-width:1100px; margin:0 auto; padding:16px 20px; }}
.card {{ background:#fffdf8; border:1px solid #d8cfc0; border-radius:12px; padding:14px 16px; margin-bottom:12px; }}
.badge {{ display:inline-block; font-size:11px; padding:2px 8px; border-radius:999px; }}
.badge.green {{ background:#d9f0e0; }}
.badge.red {{ background:#f7d6d6; }}
.badge.blue {{ background:#d9e6f7; }}
table {{ width:100%; border-collapse:collapse; font-size:14px; }}
td, th {{ border-bottom:1px solid #e8dfd3; padding:6px 8px; text-align:left; }}
</style>
</head>
<body>
<header>
  <h1>Gate 1B.4.1 — Official 2026 DTPM GTFS transit correction</h1>
  <p>Canonical runtime Metro from official DTPM GTFS. OSM is supplemental QA only. Traveler routing remains disabled.</p>
</header>
<section class="card">
  <h2>Official feed</h2>
  <p>Source: <code>{esc(meta.get('sourceUrl'))}</code></p>
  <p>Version: <b>{esc(meta.get('feedVersion'))}</b> · Effective: {esc(meta.get('feedStartDate'))} → {esc(meta.get('feedEndDate'))}</p>
  <p>Agency: {esc(meta.get('agencyId'))} — {esc(meta.get('agencyName'))}</p>
  <p>Retrieved: {esc(meta.get('retrievedAt'))}</p>
</section>
<section class="card">
  <h2>Operational lines (runtime)</h2>
  <table><thead><tr><th>Line</th><th>Name</th><th>Stations</th><th>Status</th></tr></thead><tbody>{line_rows}</tbody></table>
</section>
<section class="card">
  <h2>Future / non-operational excluded</h2>
  <ul>{future_rows}</ul>
  <p><span class="badge red">L7 NOT IN RUNTIME</span></p>
</section>
<section class="card">
  <h2>Station reconciliation (OSM ↔ GTFS)</h2>
  <p>GTFS normalized stations: {esc(recon.get('gtfsNormalizedStationCount'))} · OSM stations: {esc(recon.get('osmStationCount'))}</p>
  <p>Matched: {esc(recon.get('matchedCount'))} · GTFS-only: {esc(recon.get('gtfsOnlyCount'))} · OSM-only: {esc(recon.get('osmOnlyCount'))} · Ambiguous: {esc(recon.get('ambiguousCount'))}</p>
</section>
<section class="card">
  <h2>GTFS timing coverage</h2>
  <p>Scheduled segments: {esc(times.get('segmentCount'))} · Ride edges with scheduled times: {esc(counts.get('scheduledTimingCoveragePercent'))}%</p>
  <p>Duration label: <code>SCHEDULED_GTFS_DURATION</code> (not realtime). Transfer physical walk: unresolved (engine-policy penalty only).</p>
  <p>POI↔Metro access retained: {esc(counts.get('poiMetroAccessRetained'))} · unresolved: {esc(counts.get('poiMetroAccessUnresolved'))}</p>
</section>
<section>
  <h2>QA routes</h2>
  {qa}
</section>
<section class="card">
  <h2>Remaining unknowns</h2>
  <ul>
    <li>Realtime Metro durations</li>
    <li>Physical interchange walking times</li>
    <li>Funicular ascent for STGO_32</li>
    <li>STGO_05 / STGO_23 / STGO_33 still unresolved</li>
  </ul>
</section>
</body>
</html>"""
    OUT.write_text(doc, encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
