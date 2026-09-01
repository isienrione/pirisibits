#!/usr/bin/env python3
"""Generate Gate 1B.3 pedestrian edge QA HTML."""

from __future__ import annotations

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
EDGES = ROOT / "src/data/santiago/santiago_physical_edges.v0.1.json"
OUT = ROOT / "docs/city-graph/gate-1b3-edge-review.html"


def esc(v) -> str:
    return html.escape("" if v is None else str(v))


def main() -> int:
    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    data = json.loads(EDGES.read_text(encoding="utf-8"))
    names = {n["stgoId"]: n.get("displayName") or n["stgoId"] for n in engine["nodes"]}
    counts = data.get("counts") or {}
    health = data.get("graphHealth") or {}

    runtime = [e for e in data["edges"] if e.get("runtimeEligible")]
    orange = [e for e in data["edges"] if e.get("physicalClassification") == "ORANGE"]
    suspicious = [e for e in runtime if e.get("durationMin", 0) > 30]

    rows = ""
    for e in sorted(runtime, key=lambda x: (x["physicalClassification"], x["durationMin"]))[:120]:
        cls = e["physicalClassification"]
        rows += f"""<tr class="{esc(cls.lower())}">
          <td><code>{esc(e['fromPoiId'])}</code> {esc(names.get(e['fromPoiId'],''))}</td>
          <td><code>{esc(e['toPoiId'])}</code> {esc(names.get(e['toPoiId'],''))}</td>
          <td>{esc(cls)}</td>
          <td>{esc(e['distanceM'])}</td>
          <td>{esc(e['durationMin'])}</td>
          <td><code>{esc(e['fromPoint']['pointId'])}</code>→<code>{esc(e['toPoint']['pointId'])}</code></td>
          <td>{esc(e['providerReference'])}</td>
        </tr>"""

    orange_rows = ""
    for e in orange:
        orange_rows += f"<li>{esc(e['fromPoiId'])}→{esc(e['toPoiId'])}: {esc(e['durationMin'])} min — {esc(e.get('pruneReason'))}</li>"

    qa = ""
    for r in data.get("qaRoutes") or []:
        if r.get("connected"):
            qa += f"<li><b>{esc(r['label'])}</b>: {esc(r['totalDurationMin'])} min / {esc(r['totalDistanceM'])} m ({esc(r['legCount'])} legs)</li>"
        else:
            qa += f"<li><b>{esc(r['label'])}</b>: DISCONNECTED — {esc(r.get('reason'))}</li>"

    central = ""
    for c in health.get("centralPairChecks") or []:
        central += f"<li>{esc(c['pair'])}: {esc(c.get('classification'))} {esc(c.get('durationMin'))} min (runtime={esc(c.get('runtimeEligible'))})</li>"

    isolated = health.get("isolatedNodes") or []
    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Gate 1B.3 — Santiago Pedestrian Edge QA</title>
<style>
body {{ font-family: Georgia, serif; margin: 0; background: #f4efe6; color: #1a1a1a; }}
header, section {{ max-width: 1200px; margin: 0 auto; padding: 16px 20px; }}
.card {{ background: #fffdf8; border: 1px solid #d8cfc0; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; }}
table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
th, td {{ border-bottom: 1px solid #e8dfd3; padding: 6px 8px; text-align: left; }}
.green {{ background: #eef8f0; }}
.yellow {{ background: #fff8e8; }}
.orange {{ background: #fff0e0; }}
code {{ background: #f0ebe3; padding: 1px 4px; border-radius: 4px; font-size: 12px; }}
</style>
</head>
<body>
<header>
  <h1>Gate 1B.3 — Santiago launch pedestrian edge graph (QA)</h1>
  <p>Provider-derived Mapbox walking edges. Traveler route generation remains disabled.</p>
</header>
<section class="card">
  <h2>Summary</h2>
  <p>Eligible nodes: {esc(health.get('eligibleNodes'))} · Runtime edges: {esc(counts.get('runtimeWalkEdges'))} ·
     GREEN {esc(counts.get('GREEN'))} · YELLOW {esc(counts.get('YELLOW'))} · ORANGE {esc(counts.get('ORANGE'))} · pruned {esc(counts.get('prunedCandidates'))}</p>
  <p>Connected components: {esc(health.get('connectedComponentCount'))} · Isolated: {esc(', '.join(isolated) or 'none')} ·
     Median distance {esc(health.get('medianEdgeDistanceM'))} m · Median duration {esc(health.get('medianEdgeDurationMin'))} min</p>
  <p>Reference matrix: {esc(data.get('referenceMatrixStatus'))}</p>
</section>
<section class="card">
  <h2>QA shortest paths (runtime graph)</h2>
  <ul>{qa}</ul>
</section>
<section class="card">
  <h2>Central pair checks</h2>
  <ul>{central}</ul>
</section>
<section class="card">
  <h2>ORANGE / pruned edges</h2>
  <ul>{orange_rows or '<li>None</li>'}</ul>
</section>
<section class="card">
  <h2>Long runtime edges (&gt;30 min) — review</h2>
  <ul>{''.join(f'<li>{esc(e["fromPoiId"])}→{esc(e["toPoiId"])}: {esc(e["durationMin"])} min</li>' for e in suspicious) or '<li>None</li>'}</ul>
</section>
<section class="card">
  <h2>Sample runtime edges (first 120 by class/duration)</h2>
  <table>
    <thead><tr><th>From</th><th>To</th><th>Class</th><th>m</th><th>min</th><th>Points</th><th>Provider ref</th></tr></thead>
    <tbody>{rows}</tbody>
  </table>
</section>
</body>
</html>"""
    OUT.write_text(doc, encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
