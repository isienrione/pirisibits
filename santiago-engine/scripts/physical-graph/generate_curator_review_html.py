#!/usr/bin/env python3
"""Generate Gate 1B.2 curator review HTML for all 103 Santiago engine nodes."""

from __future__ import annotations

import html
import json
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
OUT = ROOT / "docs/city-graph/gate-1b2-curator-review.html"


def esc(v) -> str:
    return html.escape("" if v is None else str(v))


def maps_link(name: str, cand: dict | None) -> str:
    q = name
    if cand and cand.get("lat") is not None:
        q = f"{cand['lat']},{cand['lng']}"
    return "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(q)


def osm_embed(lat: float, lng: float) -> str:
    d = 0.008
    bbox = f"{lng-d}%2C{lat-d}%2C{lng+d}%2C{lat+d}"
    marker = f"{lat}%2C{lng}"
    return (
        f"https://www.openstreetmap.org/export/embed.html?bbox={bbox}&layer=mapnik"
        f"&marker={marker}"
    )


def card(n: dict) -> str:
    cls = n.get("providerClassification") or "NO_RESULT"
    tone = {
        "AUTO_HIGH_CONFIDENCE": "green",
        "NEEDS_CURATOR_REVIEW": "yellow",
        "SUSPICIOUS": "red",
        "NO_RESULT": "gray",
    }.get(cls, "gray")
    launch = "LAUNCH" if n.get("launchCorpus") else "BACKLOG"
    cand = n.get("providerCandidate") or {}
    poi = n.get("poiCoordinate")
    lat = cand.get("lat") if cand else (poi or {}).get("lat")
    lng = cand.get("lng") if cand else (poi or {}).get("lng")
    name = n.get("displayName") or n.get("canonicalName") or "(identity unresolved)"
    gmaps = maps_link(name if isinstance(name, str) else "Santiago Chile", cand if cand else None)
    map_block = ""
    if lat is not None and lng is not None:
        map_block = f'''
        <div class="mapwrap">
          <iframe title="map-{esc(n["stgoId"])}" loading="lazy" src="{osm_embed(float(lat), float(lng))}"></iframe>
          <p class="pins">Provider pin: {esc(lat)}, {esc(lng)} · Approved pin: none</p>
        </div>'''
    else:
        map_block = '<p class="pins">No provider pin to preview.</p>'

    aliases = ", ".join(n.get("aliases") or []) or "—"
    alts = ""
    for c in n.get("candidates") or []:
        alts += (
            f"<li>{esc(c.get('placeName'))} — {esc(c.get('lat'))}, {esc(c.get('lng'))} "
            f"(rel={esc(c.get('relevance'))})</li>"
        )
    if not alts:
        alts = "<li>None</li>"

    return f'''
    <article class="card {tone}" data-launch="{launch}" data-class="{esc(cls)}" data-approved="no">
      <header>
        <span class="badge">{esc(cls)}</span>
        <span class="badge launch">{esc(launch)}</span>
        <strong>{esc(name)}</strong>
        <code>{esc(n.get("stgoId"))}</code>
        <code class="slug">{esc(n.get("legacySlug"))}</code>
      </header>
      <p><b>Aliases:</b> {esc(aliases)}</p>
      <p><b>Neighborhood:</b> {esc(n.get("neighborhood"))} · <b>Commune:</b> {esc(n.get("commune"))}</p>
      <p><b>Identity:</b> {esc(n.get("identityStatus"))}
        {" · " + esc(n.get("identityMissingSource")) if n.get("identityMissingSource") else ""}</p>
      <p><b>Provider candidate:</b> {esc(cand.get("placeName"))}</p>
      <p><b>Context / types:</b> {esc(", ".join(cand.get("placeType") or []))}</p>
      <p><b>Confidence:</b> {esc(cls)} · relevance={esc(cand.get("relevance"))}</p>
      <p><b>Review reason:</b> {esc(n.get("selectionReason"))}</p>
      <p><b>Provenance:</b> physical={esc((n.get("provenance") or {}).get("physical", {}).get("selectionStatus"))};
         curatorApproval=never-automatic; state={esc(n.get("physicalVerificationState"))}</p>
      <p><b>POI coordinate:</b> {esc((poi or {}).get("lat"))}, {esc((poi or {}).get("lng"))}</p>
      <p><b>Entrance coordinate:</b> unresolved (distinct from POI)</p>
      <p><b>Experience-point coordinate:</b> unresolved (distinct from POI / entrance)</p>
      <p><b>Query:</b> {esc(n.get("queryUsed") or n.get("geocodeQuery"))}</p>
      <p><a href="{gmaps}" target="_blank" rel="noopener">Open in Google Maps</a></p>
      {map_block}
      <div class="actions" role="group" aria-label="Curator actions">
        <button type="button" data-action="APPROVE_POI_PIN">APPROVE POI PIN</button>
        <button type="button" data-action="WRONG_PLACE">WRONG PLACE</button>
        <button type="button" data-action="SEARCH_AGAIN">SEARCH AGAIN</button>
        <button type="button" data-action="MANUAL_PIN_REQUIRED">MANUAL PIN REQUIRED</button>
        <button type="button" data-action="DEFER">DEFER</button>
        <button type="button" data-action="REJECT">REJECT</button>
      </div>
      <details class="manual">
        <summary>Secondary: manual latitude / longitude (optional)</summary>
        <label>Latitude <input type="number" step="any" name="lat" placeholder="-33.44" /></label>
        <label>Longitude <input type="number" step="any" name="lng" placeholder="-70.65" /></label>
        <p class="hint">Manual values are secondary. Prefer map actions. Values remain deterministic engine fields.</p>
      </details>
      <details><summary>Alternative candidates</summary><ul>{alts}</ul></details>
      <p class="note">Local action log only — does not write CURATOR_APPROVED into the engine JSON automatically.</p>
    </article>'''


def main() -> int:
    data = json.loads(ENGINE.read_text(encoding="utf-8"))
    nodes = data["nodes"]
    counts = data.get("counts") or {}
    cards = "\n".join(card(n) for n in nodes)
    doc = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Gate 1B.2 Curator Review — Santiago 103</title>
<style>
:root {{ --ink:#1a1a1a; --paper:#f7f3ec; --card:#fffdf8; --line:#d8cfc0; --green:#1f7a3f; --yellow:#a67c00; --red:#a11f1f; --gray:#555; }}
* {{ box-sizing:border-box; }}
body {{ margin:0; font-family:"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; background:
  radial-gradient(ellipse at 10% 0%, #e7efe8 0%, transparent 45%),
  radial-gradient(ellipse at 90% 10%, #efe6d8 0%, transparent 40%),
  linear-gradient(180deg, #f4efe6, #ebe4d8); color:var(--ink); }}
header.top {{ padding:28px 24px 8px; max-width:1200px; margin:0 auto; }}
h1 {{ font-size:clamp(1.6rem, 3vw, 2.2rem); margin:0 0 8px; letter-spacing:-0.02em; }}
.sub {{ opacity:0.85; max-width:60ch; }}
.summary, .filters {{ max-width:1200px; margin:12px auto; padding:14px 16px; background:var(--card); border:1px solid var(--line); border-radius:12px; }}
.filters {{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; position:sticky; top:0; z-index:5; backdrop-filter:blur(6px); }}
.filters button {{ font:inherit; border:1px solid var(--line); background:#fff; padding:8px 12px; border-radius:10px; cursor:pointer; }}
.filters button.active {{ background:#1b1b1b; color:#fff; border-color:#1b1b1b; }}
.grid {{ max-width:1200px; margin:0 auto 40px; padding:0 16px; display:grid; gap:14px; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); }}
.card {{ background:var(--card); border:1px solid var(--line); border-radius:14px; padding:14px 16px; display:flex; flex-direction:column; gap:6px; }}
.card.green {{ border-left:6px solid var(--green); }}
.card.yellow {{ border-left:6px solid var(--yellow); }}
.card.red {{ border-left:6px solid var(--red); }}
.card.gray {{ border-left:6px solid var(--gray); }}
.badge {{ display:inline-block; font-size:11px; letter-spacing:0.06em; padding:2px 8px; border-radius:999px; background:#eee; margin-right:4px; }}
.badge.launch {{ background:#dde8ff; }}
code {{ font-size:12px; background:#f0ebe3; padding:1px 5px; border-radius:4px; }}
.mapwrap iframe {{ width:100%; height:180px; border:1px solid var(--line); border-radius:10px; }}
.actions {{ display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }}
.actions button {{ font:inherit; font-size:12px; padding:7px 9px; border-radius:8px; border:1px solid var(--line); background:#fff; cursor:pointer; }}
.actions button[data-action="APPROVE_POI_PIN"] {{ background:#e5f5ea; }}
.actions button[data-action="REJECT"], .actions button[data-action="WRONG_PLACE"] {{ background:#f8e4e4; }}
.manual {{ margin-top:6px; font-size:13px; }}
.manual label {{ display:block; margin:4px 0; }}
.manual input {{ width:100%; padding:6px 8px; border:1px solid var(--line); border-radius:8px; }}
.hint, .note, .pins {{ font-size:12px; opacity:0.8; }}
.hidden {{ display:none !important; }}
#log {{ max-width:1200px; margin:0 auto 40px; padding:0 16px; font-size:13px; }}
</style>
</head>
<body>
<header class="top">
  <h1>Gate 1B.2 — Santiago curator review (103)</h1>
  <p class="sub">Human curation over frozen engine variables. Provider ≠ curator approval.
  POI coordinate ≠ entrance ≠ experience-point. Physical route generation disabled.</p>
</header>
<section class="summary">
  <div>FULL 103 — high {counts.get("AUTO_HIGH_CONFIDENCE",0)} · review {counts.get("NEEDS_CURATOR_REVIEW",0)} · suspicious {counts.get("SUSPICIOUS",0)} · no result {counts.get("NO_RESULT",0)}</div>
  <div>Identity resolved {counts.get("identityResolved",0)} / unresolved {counts.get("identityUnresolved",0)} · CURATOR_APPROVED {counts.get("CURATOR_APPROVED",0)}</div>
  <div>Entrance resolved {counts.get("entranceResolved",0)} · Experience-point resolved {counts.get("experiencePointResolved",0)} · Metro: unresolved</div>
</section>
<nav class="filters" aria-label="Filters">
  <strong>Filter:</strong>
  <button type="button" data-filter="ALL">ALL 103</button>
  <button type="button" class="active" data-filter="LAUNCH_ATTENTION">LAUNCH 30 needing attention</button>
  <button type="button" data-filter="LAUNCH">LAUNCH 30</button>
  <button type="button" data-filter="BACKLOG">BACKLOG 73</button>
  <button type="button" data-filter="NEEDS_CURATOR_REVIEW">NEEDS REVIEW</button>
  <button type="button" data-filter="SUSPICIOUS">SUSPICIOUS</button>
  <button type="button" data-filter="NO_RESULT">NO RESULT</button>
  <button type="button" data-filter="AUTO_HIGH_CONFIDENCE">HIGH CONFIDENCE</button>
  <button type="button" data-filter="APPROVED">APPROVED</button>
</nav>
<section class="grid" id="grid">
{cards}
</section>
<section id="log"><h2>Local action log</h2><ol id="loglist"></ol></section>
<script>
(function(){{
  const cards=[...document.querySelectorAll('.card')];
  const log=document.getElementById('loglist');
  function apply(filter){{
    cards.forEach(card=>{{
      const launch=card.dataset.launch;
      const cls=card.dataset.class;
      const approved=card.dataset.approved==='yes';
      let show=true;
      if(filter==='ALL') show=true;
      else if(filter==='LAUNCH') show=launch==='LAUNCH';
      else if(filter==='BACKLOG') show=launch==='BACKLOG';
      else if(filter==='LAUNCH_ATTENTION') show=launch==='LAUNCH' && cls!=='AUTO_HIGH_CONFIDENCE';
      else if(filter==='APPROVED') show=approved;
      else show=cls===filter;
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
  apply('LAUNCH_ATTENTION');
  document.querySelectorAll('.actions button').forEach(btn=>{{
    btn.addEventListener('click', ()=>{{
      const card=btn.closest('.card');
      const id=card.querySelector('code').textContent;
      const action=btn.dataset.action;
      if(action==='APPROVE_POI_PIN'){{ card.dataset.approved='yes'; }}
      const li=document.createElement('li');
      li.textContent=id+' → '+action+' (local only; engine JSON unchanged)';
      log.prepend(li);
    }});
  }});
}})();
</script>
</body>
</html>
'''
    OUT.write_text(doc, encoding="utf-8")
    # Also refresh 1B.1 path as successor pointer page? Keep 1B.1; write successor.
    print(f"Wrote {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
