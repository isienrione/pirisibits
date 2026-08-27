#!/usr/bin/env python3
"""Generate Gate 2A.1 founder-friendly editorial calibration Curator Studio HTML."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CAL = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
OUT = ROOT / "docs/engine/gate-2a1-editorial-calibration.html"

THEME_LABELS = {
    "T1A": "Civic, Military & Traditional Heritage",
    "T1B": "Memory, Human Rights & Grassroots",
    "T2": "Culinary Explorer & Gastronomy",
    "T3": "Urban Shutterbug & Aesthetics",
    "T4": "Subculture, Street Art & Indie",
    "T5": "Mindful, Green & Quiet Living",
    "T6": "Dark Lore, Forensics & Macabre",
    "T7": "Budget Hacker & Street Life",
    "T8": "Urban Ecology & Conscious Living",
    "T9": "Luxury Heritage & High Craft",
}
MODE_LABELS = {
    "M1": "Express / Time-Boxed",
    "M2": "Accessibility / Step-Free",
    "M3": "Family & Kid Quest",
    "M4": "Night Owl / Nocturnal",
    "M5": "High Comfort / Low Friction",
}


def main() -> int:
    cal = json.loads(CAL.read_text(encoding="utf-8"))
    payload = json.dumps(cal, ensure_ascii=False)
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ChronoWalk — Gate 2A.1 Editorial Calibration</title>
<style>
  :root {{
    --ink: #1c1917;
    --muted: #78716c;
    --paper: #faf7f2;
    --panel: #ffffff;
    --line: #e7e5e4;
    --accent: #0f766e;
    --warn: #b45309;
    --ai: #0369a1;
    --unknown: #a8a29e;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
    color: var(--ink);
    background:
      radial-gradient(ellipse at 10% 0%, #dbeafe 0%, transparent 45%),
      radial-gradient(ellipse at 90% 10%, #fef3c7 0%, transparent 40%),
      linear-gradient(180deg, #f8fafc 0%, var(--paper) 40%, #f5f5f4 100%);
    min-height: 100vh;
  }}
  header {{
    padding: 1.5rem 1.25rem 1rem;
    border-bottom: 1px solid var(--line);
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(8px);
    position: sticky; top: 0; z-index: 5;
  }}
  h1 {{ margin: 0; font-size: 1.55rem; letter-spacing: -0.02em; }}
  .sub {{ color: var(--muted); font-size: 0.95rem; margin-top: 0.35rem; }}
  .toolbar {{
    display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 0.9rem; align-items: center;
  }}
  button, select {{
    font: inherit; border: 1px solid var(--line); background: white;
    border-radius: 8px; padding: 0.45rem 0.8rem; cursor: pointer;
  }}
  button.primary {{ background: var(--accent); color: white; border-color: var(--accent); }}
  button.ghost {{ background: transparent; }}
  main {{
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 1rem;
    padding: 1rem 1.25rem 3rem;
    max-width: 1280px; margin: 0 auto;
  }}
  @media (max-width: 900px) {{
    main {{ grid-template-columns: 1fr; }}
  }}
  .list {{
    background: var(--panel); border: 1px solid var(--line); border-radius: 14px;
    overflow: hidden; max-height: calc(100vh - 140px); overflow-y: auto;
  }}
  .list button.item {{
    display: block; width: 100%; text-align: left; border: 0; border-bottom: 1px solid var(--line);
    border-radius: 0; padding: 0.75rem 0.9rem; background: white;
  }}
  .list button.item.active {{ background: #ecfdf5; }}
  .list .id {{ font-weight: 700; font-size: 0.85rem; }}
  .list .name {{ font-size: 0.92rem; }}
  .list .meta {{ color: var(--muted); font-size: 0.78rem; margin-top: 0.15rem; }}
  .card {{
    background: var(--panel); border: 1px solid var(--line); border-radius: 16px;
    padding: 1.1rem 1.2rem 1.4rem;
  }}
  .badge {{
    display: inline-block; font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase;
    padding: 0.18rem 0.45rem; border-radius: 999px; border: 1px solid var(--line);
    color: var(--muted); margin-right: 0.35rem;
  }}
  .badge.ai {{ color: var(--ai); border-color: #bae6fd; background: #f0f9ff; }}
  .badge.unknown {{ color: var(--unknown); }}
  .badge.curated {{ color: #166534; border-color: #bbf7d0; background: #f0fdf4; }}
  h2 {{ margin: 0 0 0.35rem; font-size: 1.45rem; }}
  h3 {{ margin: 1.25rem 0 0.5rem; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }}
  .row {{ display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }}
  @media (max-width: 700px) {{ .row {{ grid-template-columns: 1fr; }} }}
  .field {{
    border: 1px solid var(--line); border-radius: 12px; padding: 0.75rem 0.85rem; background: #fff;
  }}
  label {{ display: block; font-size: 0.8rem; color: var(--muted); margin-bottom: 0.35rem; }}
  input[type=range] {{ width: 100%; }}
  .anchors {{ display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem; }}
  .value {{ font-variant-numeric: tabular-nums; font-size: 0.9rem; }}
  .barwrap {{ margin: 0.45rem 0; }}
  .barlabel {{ display: flex; justify-content: space-between; font-size: 0.82rem; gap: 0.5rem; }}
  .bar {{ height: 8px; background: #f5f5f4; border-radius: 99px; overflow: hidden; margin-top: 0.25rem; }}
  .bar > i {{ display: block; height: 100%; background: var(--accent); border-radius: 99px; }}
  .explain {{ font-size: 0.88rem; color: var(--muted); line-height: 1.45; }}
  .grid5 {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.55rem; }}
  .mode {{ border: 1px dashed var(--line); border-radius: 10px; padding: 0.55rem 0.65rem; }}
  .mode strong {{ display: block; font-size: 0.85rem; }}
  .toast {{
    position: fixed; bottom: 1rem; right: 1rem; background: #134e4a; color: white;
    padding: 0.7rem 1rem; border-radius: 10px; display: none;
  }}
</style>
</head>
<body>
<header>
  <h1>ChronoWalk Curator Studio — Editorial Calibration</h1>
  <div class="sub">Gate 2A.1 · AI-proposed values for founder review · Export only (no fake persistence)</div>
  <div class="toolbar">
    <select id="poiSelect"></select>
    <button class="primary" id="exportBtn">Export decisions JSON</button>
    <button class="ghost" id="resetBtn">Reset local edits</button>
    <span class="badge ai">AI proposed</span>
    <span class="badge curated">Founder approved (you set)</span>
    <span class="badge unknown">Unknown</span>
  </div>
</header>
<main>
  <aside class="list" id="list"></aside>
  <section class="card" id="detail"></section>
</main>
<div class="toast" id="toast">Exported</div>
<script>
const THEME_LABELS = {json.dumps(THEME_LABELS)};
const MODE_LABELS = {json.dumps(MODE_LABELS)};
const SOURCE = {payload};
const STORAGE_KEY = 'cw_gate2a1_editorial_edits_v0_1';

function loadEdits() {{
  try {{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{{}}'); }} catch {{ return {{}}; }}
}}
function saveEdits(edits) {{
  localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
}}

let edits = loadEdits();
let currentId = SOURCE.records[0].stgoId;

function strengthLabel(v) {{
  if (v < 0.15) return 'Low';
  if (v < 0.45) return 'Some relevance';
  if (v < 0.75) return 'Strong';
  return 'Defining characteristic';
}}

function mergeRecord(r) {{
  const e = edits[r.stgoId] || {{}};
  return {{
    ...r,
    chronoWorth: {{
      ...r.chronoWorth,
      approved: e.chronoWorthApproved ?? r.chronoWorth.approved,
    }},
    visitTime: {{
      ...r.visitTime,
      approved: e.visitTimeApproved ?? r.visitTime.approved,
      min: e.visitMin ?? r.visitTime.min,
      typical: e.visitTypical ?? r.visitTime.typical,
      max: e.visitMax ?? r.visitTime.max,
    }},
    sensitiveMemory: {{
      ...r.sensitiveMemory,
      value: e.sensitiveMemory ?? r.sensitiveMemory.value,
    }},
    _decisionNotes: e.notes || '',
  }};
}}

function renderList() {{
  const list = document.getElementById('list');
  const sel = document.getElementById('poiSelect');
  list.innerHTML = '';
  sel.innerHTML = '';
  SOURCE.records.forEach(raw => {{
    const r = mergeRecord(raw);
    const b = document.createElement('button');
    b.className = 'item' + (r.stgoId === currentId ? ' active' : '');
    b.innerHTML = `<div class="id">${{r.stgoId}}</div><div class="name">${{r.displayName}}</div><div class="meta">${{r.tier}} · ${{r.editorialRole || '—'}} · CW ${{r.chronoWorth.approved ?? r.chronoWorth.proposed}}</div>`;
    b.onclick = () => {{ currentId = r.stgoId; render(); }};
    list.appendChild(b);
    const o = document.createElement('option');
    o.value = r.stgoId; o.textContent = `${{r.stgoId}} — ${{r.displayName}}`;
    if (r.stgoId === currentId) o.selected = true;
    sel.appendChild(o);
  }});
}}

function setEdit(stgoId, patch) {{
  edits[stgoId] = {{ ...(edits[stgoId] || {{}}), ...patch }};
  saveEdits(edits);
  render();
}}

function renderDetail() {{
  const raw = SOURCE.records.find(x => x.stgoId === currentId);
  const r = mergeRecord(raw);
  const cwApproved = r.chronoWorth.approved;
  const cwEff = cwApproved ?? r.chronoWorth.proposed;
  const contrib = r.chronoWorth.contributions || {{}};
  const themes = Object.keys(THEME_LABELS).map(code => {{
    const v = r.thematicVector[code] || 0;
    return `<div class="barwrap"><div class="barlabel"><span><b>${{code}}</b> ${{THEME_LABELS[code]}}</span><span class="value">${{v.toFixed(2)}} · ${{strengthLabel(v)}}</span></div><div class="bar"><i style="width:${{(v*100).toFixed(1)}}%"></i></div></div>`;
  }}).join('');
  const modes = Object.keys(MODE_LABELS).map(code => {{
    const m = r.structuralSuitability[code] || {{}};
    const status = m.status || (m.value == null ? 'UNKNOWN' : 'PROPOSED');
    const val = m.value == null ? '—' : Number(m.value).toFixed(2);
    return `<div class="mode"><strong>${{code}} · ${{MODE_LABELS[code]}}</strong><div class="value">${{val}}</div><div class="explain">${{status}}<br/>${{m.provenance || ''}}</div></div>`;
  }}).join('');

  document.getElementById('detail').innerHTML = `
    <div><span class="badge">${{r.tier}}</span><span class="badge">${{r.editorialRole || 'role unknown'}}</span><span class="badge ai">${{r.chronoWorth.provenance}}</span></div>
    <h2>${{r.displayName}}</h2>
    <div class="explain">${{r.stgoId}} · disposition ${{r.launchRuntimeDisposition || '—'}} · demo match ${{r.demoPoiIdMatched || 'none'}}</div>

    <h3>ChronoWorth</h3>
    <div class="row">
      <div class="field">
        <label>AI proposal (read-only)</label>
        <div class="value" style="font-size:1.4rem">${{r.chronoWorth.proposed}}</div>
        <div class="explain">${{r.chronoWorth.formula || ''}}</div>
        <div class="explain">heritage ${{contrib.heritage_depth_proxy}} · anchor ${{contrib.anchor_density_proxy}} · micro ${{contrib.micro_reveal_proxy}} · polish ${{contrib.polish_proxy}}</div>
      </div>
      <div class="field">
        <label>Founder-approved value (overrides proposal)</label>
        <input type="range" min="0" max="100" step="1" id="cwSlider" value="${{cwEff}}"/>
        <div class="anchors"><span>Low</span><span>Supporting</span><span>Strong</span><span>Defining</span></div>
        <div class="value">Effective: <b id="cwVal">${{cwEff}}</b> ${{cwApproved == null ? '<span class="badge ai">using AI proposal</span>' : '<span class="badge curated">founder approved</span>'}}</div>
        <div style="margin-top:0.5rem; display:flex; gap:0.4rem;">
          <button id="approveCw">Approve current</button>
          <button id="clearCw">Clear approval</button>
        </div>
      </div>
    </div>

    <h3>Themes (continuous canonical)</h3>
    ${{themes}}
    <div class="explain">Binary tags derived at threshold ${{r.themeTagThreshold}}: ${{(r.derivedThemeTags || []).join(', ') || 'none'}}</div>

    <h3>Modes M1–M5</h3>
    <div class="grid5">${{modes}}</div>

    <h3>Visit time (minutes, excludes travel)</h3>
    <div class="row">
      <div class="field"><label>Min</label><input type="number" id="vmin" value="${{r.visitTime.min}}"/></div>
      <div class="field"><label>Typical</label><input type="number" id="vtyp" value="${{r.visitTime.typical}}"/></div>
      <div class="field"><label>Max</label><input type="number" id="vmax" value="${{r.visitTime.max}}"/></div>
    </div>
    <div class="explain">${{r.visitTime.provenance}} · ${{r.visitTime.source || ''}}</div>

    <h3>Sensitive memory / Accessibility / Operational</h3>
    <div class="row">
      <div class="field">
        <label>Sensitive memory</label>
        <select id="sens">
          <option value="true" ${{r.sensitiveMemory.value ? 'selected' : ''}}>Yes — consent required</option>
          <option value="false" ${{!r.sensitiveMemory.value ? 'selected' : ''}}>No</option>
        </select>
        <div class="explain">${{r.sensitiveMemory.provenance}} · ${{r.sensitiveMemory.note || ''}}</div>
      </div>
      <div class="field">
        <label>Accessibility</label>
        <div class="value">${{r.accessibility.status}}</div>
        <div class="explain">${{r.accessibility.provenance}} · UNKNOWN is valid</div>
      </div>
      <div class="field">
        <label>Operational / daylight</label>
        <div class="value">${{r.operational.classification}}</div>
        <div class="explain">daylightOnly=${{String(r.operational.daylightOnly)}} · ${{r.operational.provenance}}</div>
      </div>
    </div>

    <h3>Founder notes</h3>
    <div class="field">
      <textarea id="notes" rows="3" style="width:100%;font:inherit;border:0;resize:vertical">${{r._decisionNotes}}</textarea>
    </div>
  `;

  const slider = document.getElementById('cwSlider');
  const cwVal = document.getElementById('cwVal');
  slider.oninput = () => {{ cwVal.textContent = slider.value; }};
  document.getElementById('approveCw').onclick = () => setEdit(r.stgoId, {{ chronoWorthApproved: Number(slider.value) }});
  document.getElementById('clearCw').onclick = () => setEdit(r.stgoId, {{ chronoWorthApproved: null }});
  ['vmin','vtyp','vmax'].forEach(id => {{
    document.getElementById(id).onchange = () => setEdit(r.stgoId, {{
      visitMin: Number(document.getElementById('vmin').value),
      visitTypical: Number(document.getElementById('vtyp').value),
      visitMax: Number(document.getElementById('vmax').value),
      visitTimeApproved: {{
        min: Number(document.getElementById('vmin').value),
        typical: Number(document.getElementById('vtyp').value),
        max: Number(document.getElementById('vmax').value),
      }},
    }});
  }});
  document.getElementById('sens').onchange = (ev) => setEdit(r.stgoId, {{ sensitiveMemory: ev.target.value === 'true' }});
  document.getElementById('notes').onchange = (ev) => setEdit(r.stgoId, {{ notes: ev.target.value }});
}}

function render() {{
  renderList();
  renderDetail();
}}

document.getElementById('poiSelect').onchange = (e) => {{ currentId = e.target.value; render(); }};
document.getElementById('resetBtn').onclick = () => {{ edits = {{}}; saveEdits(edits); render(); }};
document.getElementById('exportBtn').onclick = () => {{
  const decisions = {{
    schemaVersion: 'santiago-launch30-editorial-calibration.decisions.v0.1',
    gate: '2A.1',
    exportedAt: new Date().toISOString(),
    baseProposedFile: 'src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json',
    note: 'Founder export — ingest separately; not auto CURATOR_APPROVED until review pipeline absorbs this file.',
    decisions: SOURCE.records.map(raw => {{
      const r = mergeRecord(raw);
      return {{
        stgoId: r.stgoId,
        chronoWorthApproved: r.chronoWorth.approved,
        visitTimeApproved: r.visitTime.approved,
        visitTimeEdited: {{ min: r.visitTime.min, typical: r.visitTime.typical, max: r.visitTime.max }},
        sensitiveMemory: r.sensitiveMemory.value,
        notes: r._decisionNotes || null,
        thematicVectorCanonicalUnchanged: r.thematicVector,
        derivedThemeTags: r.derivedThemeTags,
      }};
    }}),
  }};
  const blob = new Blob([JSON.stringify(decisions, null, 2)], {{ type: 'application/json' }});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'launch30_editorial_calibration.decisions.v0.1.json';
  a.click();
  const t = document.getElementById('toast');
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 1600);
}};

render();
</script>
</body>
</html>
"""
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print("Wrote", OUT.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
