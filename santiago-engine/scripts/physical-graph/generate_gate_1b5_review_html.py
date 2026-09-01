#!/usr/bin/env python3
"""Human-friendly Gate 1B.5 physical-layer freeze review HTML."""

from __future__ import annotations

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MEMBERSHIP = ROOT / "src/data/santiago/santiago_launch_runtime_membership.v0.1.json"
ADJ = ROOT / "src/data/santiago/santiago_pedestrian_adjacency.v0.2.json"
MULTI = ROOT / "src/data/santiago/santiago_multimodal_graph.v0.3.json"
QA = ROOT / "src/data/santiago/qa/santiago_physical_layer_e2e_qa.v0.1.json"
MANIFEST = ROOT / "src/data/santiago/santiago_physical_graph_manifest.v0.1.json"
FRICTION = ROOT / "src/data/santiago/qa/santiago_physical_friction_audit.v0.1.json"
OUT = ROOT / "docs/city-graph/gate-1b5-physical-layer-review.html"


def esc(v) -> str:
    return html.escape("" if v is None else str(v))


def main() -> int:
    membership = json.loads(MEMBERSHIP.read_text(encoding="utf-8"))
    adj = json.loads(ADJ.read_text(encoding="utf-8"))
    multi = json.loads(MULTI.read_text(encoding="utf-8"))
    qa = json.loads(QA.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    friction = json.loads(FRICTION.read_text(encoding="utf-8"))

    disp_rows = "".join(
        f"<tr><td>{esc(d['stgoId'])}</td><td>{esc(d.get('displayName'))}</td>"
        f"<td><span class='badge'>{esc(d.get('disposition'))}</span></td>"
        f"<td>{esc((d.get('reason') or '')[:160])}</td></tr>"
        for d in membership.get("dispositions") or []
    )
    qa_cards = ""
    for r in qa.get("routes") or []:
        qa_cards += f"""
        <article class="card">
          <h3>{esc(r.get('label'))}</h3>
          <p><span class="badge blue">{esc(r.get('selectionReason'))}</span></p>
          <ul>
            <li>Modes: {esc(', '.join(r.get('modes') or []))}</li>
            <li>Walking physical: {esc(r.get('walkingPhysicalDurationSeconds'))}s</li>
            <li>Scheduled Metro: {esc(r.get('scheduledMetroRideDurationSeconds'))}s</li>
            <li>Generalized cost: {esc(r.get('generalizedCost'))}</li>
            <li>Lines: {esc(', '.join(r.get('metroLinesUsed') or []) or 'none')}</li>
          </ul>
        </article>"""

    flags = manifest.get("featureFlags") or {}
    health = adj.get("graphHealth") or {}
    lim = (manifest.get("knownLimitations") or {}).get("nonBlockingV01") or []

    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Gate 1B.5 — Physical Layer V0.1 Freeze</title>
<style>
body {{ margin:0; font-family: Georgia, serif; background:#f4efe6; color:#1a1a1a; }}
header, section {{ max-width:1100px; margin:0 auto; padding:16px 20px; }}
.card {{ background:#fffdf8; border:1px solid #d8cfc0; border-radius:12px; padding:14px 16px; margin-bottom:12px; }}
.badge {{ display:inline-block; font-size:11px; padding:2px 8px; border-radius:999px; background:#efe6d8; }}
.badge.blue {{ background:#d9e6f7; }}
.badge.green {{ background:#d9f0e0; }}
table {{ width:100%; border-collapse:collapse; font-size:14px; }}
td, th {{ border-bottom:1px solid #e8dfd3; padding:6px 8px; text-align:left; vertical-align:top; }}
</style>
</head>
<body>
<header>
  <h1>Gate 1B.5 — Santiago Physical Graph V0.1 Freeze</h1>
  <p>Launch runtime membership finalized. Traveler route generation remains disabled.
     <span class="badge green">PHYSICAL_LAYER_V0_1_READY={esc(flags.get('PHYSICAL_LAYER_V0_1_READY'))}</span>
     <span class="badge">PHYSICAL_ROUTE_GENERATION_ENABLED={esc(flags.get('PHYSICAL_ROUTE_GENERATION_ENABLED'))}</span>
  </p>
</header>
<section>
  <div class="card">
    <h2>Membership</h2>
    <ul>
      <li>RUNTIME_READY: {esc(membership.get('runtimeReadyCount'))}</li>
      <li>RUNTIME_STAGED: {esc(membership.get('runtimeStagedCount'))} (STGO_32)</li>
      <li>RUNTIME_EXCLUDED: {esc(membership.get('runtimeExcludedCount'))} (STGO_23, STGO_33)</li>
      <li>Routing-capable: {esc(len(membership.get('runtimeRoutingIds') or []))}</li>
    </ul>
  </div>
  <div class="card">
    <h2>Sparse adjacency v0.2</h2>
    <ul>
      <li>Sparse edges: {esc(adj.get('sparseOperationalEdgeCount'))}</li>
      <li>Components: {esc(health.get('connectedComponentCount'))}</li>
      <li>Directed strongly connected: {esc(health.get('directedStronglyConnected'))}</li>
      <li>Median out-degree: {esc(health.get('medianOutDegree'))}</li>
    </ul>
  </div>
  <div class="card">
    <h2>Friction honesty</h2>
    <p>Soft UNKNOWN fields: {esc(friction.get('softFrictionUnknownCount'))}. Hard UNKNOWN fields: {esc(friction.get('hardAccessibilityUnknownCount'))}. No fabricated accessibility.</p>
  </div>
</section>
<section>
  <h2>Dispositions</h2>
  <table>
    <thead><tr><th>STGO</th><th>Name</th><th>Disposition</th><th>Reason</th></tr></thead>
    <tbody>{disp_rows}</tbody>
  </table>
</section>
<section>
  <h2>E2E QA</h2>
  {qa_cards}
</section>
<section>
  <h2>Known non-blocking V0.1 limitations</h2>
  <ul>{''.join(f'<li>{esc(x)}</li>' for x in lim)}</ul>
</section>
</body>
</html>
"""
    OUT.write_text(doc, encoding="utf-8")
    print("Wrote", OUT.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
