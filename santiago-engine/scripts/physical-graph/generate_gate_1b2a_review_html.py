#!/usr/bin/env python3
"""Generate Gate 1B.2A curator review HTML for founder-reviewed launch 30."""

from __future__ import annotations

import html
import json
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
NORM = ROOT / "src/data/santiago/curation/launch30_physical_review.normalized.v0.1.json"
OUT = ROOT / "docs/city-graph/gate-1b2a-curator-review.html"


def esc(v) -> str:
    return html.escape("" if v is None else str(v))


def maps_link(lat: float | None, lng: float | None, name: str) -> str:
    q = f"{lat},{lng}" if lat is not None and lng is not None else name
    return "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(q)


def osm_embed(lat: float, lng: float) -> str:
    d = 0.008
    bbox = f"{lng-d}%2C{lat-d}%2C{lng+d}%2C{lat+d}"
    marker = f"{lat}%2C{lng}"
    return (
        f"https://www.openstreetmap.org/export/embed.html?bbox={bbox}&layer=mapnik"
        f"&marker={marker}"
    )


def color_for(n: dict) -> str:
    c = (n.get("curatorCuration") or {}).get("uiColor") or "GRAY"
    return {"GREEN": "green", "YELLOW": "yellow", "RED": "red"}.get(c, "gray")


def card(n: dict) -> str:
    cc = n.get("curatorCuration") or {}
    tone = color_for(n)
    readiness = n.get("launchPhysicalReadiness") or "UNKNOWN"
    poi = n.get("poiCoordinate")
    xp = n.get("experiencePointCoordinate")
    provider = (n.get("providerAudit") or {}).get("providerCandidate") or n.get("providerCandidate") or {}
    name = n.get("displayName") or n.get("canonicalName") or "(unresolved)"
    diff = cc.get("providerDiffMeters")
    diff_txt = f"{diff:.0f} m" if isinstance(diff, (int, float)) else "—"

    map_block = ""
    pin = xp or poi
    if pin and pin.get("lat") is not None:
        lat, lng = float(pin["lat"]), float(pin["lng"])
        map_block = f'''
        <div class="mapwrap">
          <iframe title="map-{esc(n["stgoId"])}" loading="lazy" src="{osm_embed(lat, lng)}"></iframe>
          <p class="pins">Curator POI: {esc((poi or {}).get("lat"))}, {esc((poi or {}).get("lng"))} ·
             Experience: {esc((xp or {}).get("lat"))}, {esc((xp or {}).get("lng"))} ·
             Provider delta: {esc(diff_txt)}</p>
        </div>'''
    else:
        map_block = '<p class="pins">No curator pin to preview.</p>'

    points = ""
    for p in n.get("physicalPoints") or []:
        c = p.get("coordinate") or {}
        points += (
            f"<li><code>{esc(p.get('id'))}</code> {esc(p.get('role'))}: "
            f"{esc(c.get('lat'))}, {esc(c.get('lng'))} — {esc(p.get('label'))}</li>"
        )
    if not points:
        points = "<li>None</li>"

    access = ""
    for p in n.get("accessPoints") or []:
        c = p.get("coordinate") or {}
        access += f"<li><code>{esc(p.get('id'))}</code> {esc(c.get('lat'))}, {esc(c.get('lng'))}</li>"
    if not access:
        access = "<li>None</li>"

    urls = ""
    for u in cc.get("googleMapsUrls") or []:
        urls += f'<li><a href="{esc(u)}" target="_blank" rel="noopener">{esc(u[:80])}…</a></li>'
    if not urls:
        urls = "<li>None</li>"

    gmaps = maps_link(
        (poi or {}).get("lat"),
        (poi or {}).get("lng"),
        name if isinstance(name, str) else "Santiago Chile",
    )

    return f'''
    <article class="card {tone}" data-readiness="{esc(readiness)}" data-approved="{esc(n.get('curatorApproval') or 'none')}">
      <header>
        <span class="badge">{esc(readiness)}</span>
        <span class="badge launch">LAUNCH</span>
        <strong>{esc(name)}</strong>
        <code>{esc(n.get("stgoId"))}</code>
        <code class="slug">{esc(n.get("legacySlug"))}</code>
      </header>
      <p><b>Founder place:</b> {esc(cc.get("founderPlaceName"))}</p>
      <p><b>Curator approval:</b> {esc(n.get("curatorApproval") or "none")} ·
         <b>Verification:</b> {esc(n.get("physicalVerificationState"))}</p>
      <p><b>Provider (pre-ingest):</b> {esc(provider.get("placeName"))} · class={esc(n.get("providerClassification"))}</p>
      <p><b>Override provider:</b> {esc(cc.get("curatorOverrideProvider"))} · diff={esc(diff_txt)}</p>
      <p><b>Founder feedback:</b> {esc(cc.get("rawFeedbackText"))}</p>
      {"<p class='warn'><b>Semantic warning:</b> "+esc(cc.get('semanticWarning'))+"</p>" if cc.get("semanticWarning") else ""}
      {"<p class='warn'><b>Research blocker:</b> "+esc(cc.get('researchBlocker'))+"</p>" if cc.get("researchBlocker") else ""}
      {"<p class='warn'><b>Coordinate conflict:</b> "+esc(json.dumps(cc.get('coordinateConflict'), ensure_ascii=False))+"</p>" if cc.get("coordinateConflict") else ""}
      <p><a href="{gmaps}" target="_blank" rel="noopener">Open curator POI in Google Maps</a></p>
      {map_block}
      <details open><summary>Physical points</summary><ul>{points}</ul></details>
      <details><summary>Access points</summary><ul>{access}</ul></details>
      <details><summary>Founder Google Maps links</summary><ul>{urls}</ul></details>
      <p class="note">Read-only Gate 1B.2A ingest review. Human curation = CURATOR_APPROVED, not FIELD_VERIFIED.</p>
    </article>'''


def main() -> int:
    data = json.loads(ENGINE.read_text(encoding="utf-8"))
    norm = json.loads(NORM.read_text(encoding="utf-8"))
    launch_ids = data.get("launchCorpusStgoIds") or []
    by_id = {n["stgoId"]: n for n in data["nodes"]}
    launch_nodes = [by_id[sid] for sid in launch_ids if sid in by_id]
    counts = data.get("counts") or {}
    cards = "\n".join(card(n) for n in launch_nodes)
    doc = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Gate 1B.2A — Launch 30 Human Curation Review</title>
<style>
:root {{ --ink:#1a1a1a; --paper:#f7f3ec; --card:#fffdf8; --line:#d8cfc0; --green:#1f7a3f; --yellow:#a67c00; --red:#a11f1f; --gray:#555; }}
* {{ box-sizing:border-box; }}
body {{ margin:0; font-family:"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; background:
  radial-gradient(ellipse at 10% 0%, #e7efe8 0%, transparent 45%),
  linear-gradient(180deg, #f4efe6, #ebe4d8); color:var(--ink); }}
header.top {{ padding:28px 24px 8px; max-width:1200px; margin:0 auto; }}
h1 {{ font-size:clamp(1.6rem, 3vw, 2.2rem); margin:0 0 8px; }}
.summary, .filters {{ max-width:1200px; margin:12px auto; padding:14px 16px; background:var(--card); border:1px solid var(--line); border-radius:12px; }}
.filters {{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; position:sticky; top:0; z-index:5; }}
.filters button {{ font:inherit; border:1px solid var(--line); background:#fff; padding:8px 12px; border-radius:10px; cursor:pointer; }}
.filters button.active {{ background:#1b1b1b; color:#fff; }}
.grid {{ max-width:1200px; margin:0 auto 40px; padding:0 16px; display:grid; gap:14px; grid-template-columns:repeat(auto-fill,minmax(360px,1fr)); }}
.card {{ background:var(--card); border:1px solid var(--line); border-radius:14px; padding:14px 16px; display:flex; flex-direction:column; gap:6px; }}
.card.green {{ border-left:6px solid var(--green); }}
.card.yellow {{ border-left:6px solid var(--yellow); }}
.card.red {{ border-left:6px solid var(--red); }}
.card.gray {{ border-left:6px solid var(--gray); }}
.badge {{ display:inline-block; font-size:11px; padding:2px 8px; border-radius:999px; background:#eee; margin-right:4px; }}
.badge.launch {{ background:#dde8ff; }}
code {{ font-size:12px; background:#f0ebe3; padding:1px 5px; border-radius:4px; }}
.mapwrap iframe {{ width:100%; height:180px; border:1px solid var(--line); border-radius:10px; }}
.warn {{ background:#fff3cd; padding:8px; border-radius:8px; font-size:13px; }}
.note, .pins {{ font-size:12px; opacity:0.85; }}
.hidden {{ display:none !important; }}
</style>
</head>
<body>
<header class="top">
  <h1>Gate 1B.2A — Launch 30 founder human curation</h1>
  <p>Founder Google Maps / Street View review ingested as CURATOR_APPROVED (not FIELD_VERIFIED).
  POI ≠ entrance ≠ experience-point preserved. Physical route generation remains disabled.</p>
</header>
<section class="summary">
  <div>Launch 30 · Ready {counts.get("readyForEdgeGeneration",0)} · Partial {counts.get("partialReviewRequired",0)} · Blocked {counts.get("blocked",0)}</div>
  <div>Curator-approved POI {counts.get("curatorApprovedPoi",0)} · Experience points {counts.get("curatorApprovedExperience",0)} · Access points {counts.get("accessPoints",0)}</div>
  <div>Provider overrides {counts.get("providerOverrides",0)} · Backlog curator-approved {counts.get("backlogCuratorApproved",0)} · Field verified {counts.get("fieldVerified",0)}</div>
  <div>Normalized records: {norm.get("recordCount",0)} · Source: {esc(NORM.relative_to(ROOT))}</div>
</section>
<nav class="filters" aria-label="Filters">
  <strong>Filter:</strong>
  <button type="button" class="active" data-filter="ALL">ALL 30</button>
  <button type="button" data-filter="READY_FOR_EDGE_GENERATION">READY</button>
  <button type="button" data-filter="PARTIAL_REVIEW_REQUIRED">PARTIAL</button>
  <button type="button" data-filter="UNRESOLVED_RESEARCH_REQUIRED">UNRESOLVED</button>
  <button type="button" data-filter="NEEDS_SEMANTIC_REVIEW">SEMANTIC</button>
  <button type="button" data-filter="CURATOR_APPROVED">APPROVED</button>
</nav>
<section class="grid" id="grid">
{cards}
</section>
<script>
(function(){{
  const cards=[...document.querySelectorAll('.card')];
  function apply(filter){{
    cards.forEach(card=>{{
      let show=true;
      if(filter==='ALL') show=true;
      else if(filter==='CURATOR_APPROVED') show=card.dataset.approved==='CURATOR_APPROVED';
      else show=card.dataset.readiness===filter;
      card.classList.toggle('hidden', !show);
    }});
  }}
  document.querySelectorAll('.filters button').forEach(btn=>{{
    btn.addEventListener('click', ()=>{{
      document.querySelectorAll('.filters button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      apply(btn.dataset.filter);
    }});
  }});
}})();
</script>
</body>
</html>
'''
    OUT.write_text(doc, encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
