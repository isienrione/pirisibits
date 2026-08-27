#!/usr/bin/env python3
"""
Gate 2A.1R-UI — Generate Founder Calibration Cockpit.

Self-contained HTML/JS/CSS for Launch 30 curation.
Does NOT mutate canonical semantic/source artifacts.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAUNCH = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
SOURCE_DATASET = "src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json"
SEMANTIC = "src/data/santiago/santiago_semantic_calibration.v0.1.json"
CHECKPOINT = "aee3098b2f70c64799a896c51377b6da02dd9f90"
OUT = ROOT / "docs/engine/gate-2a1-founder-calibration-cockpit.html"

THEME_META = [
    ("T1A", "Civic, Military & Traditional Heritage",
     "Official civic narrative: palaces, plazas, institutions, ceremonial power, traditional heritage framing.",
     "Not grassroots memory activism, not culinary life, not nightlife subculture.",
     "Absent from the experience.", "Incidental civic cue.", "Meaningful civic layer.",
     "Strong defining civic character.", "Archetypal Santiago civic reference.",
     ["STGO_03 Palacio de La Moneda", "STGO_02 Catedral Metropolitana"],
     ["Scoring tourist fame alone", "Collapsing T1A with T1B memory"]),
    ("T1B", "Memory, Human Rights & Grassroots",
     "Sites of memory, human rights, political trauma, grassroots testimony, absence and archive.",
     "Not generic history, not civic ceremonial prestige, not dark-tourism sensationalism.",
     "No memory/human-rights charge.", "Soft historical allusion.", "Clear memory layer.",
     "Strong memorial experience.", "Reference-standard memory site.",
     ["STGO_07 Londres 38 Memorial", "STGO_48 Museo de la Memoria y DDHH"],
     ["Inferring sensitivity only from T1B", "Treating all history as T1B"]),
    ("T2", "Culinary Explorer & Gastronomy",
     "Food, markets, historic tables, wine/bar gastronomy as primary experiential content.",
     "Not merely a café adjacent to a monument, not luxury shopping alone.",
     "Irrelevant to food experience.", "Snack/incidental dining cue.", "Meaningful culinary stop.",
     "Strong gastronomic identity.", "Archetypal Santiago table/market.",
     ["STGO_34 La Vega Central", "STGO_28 Bocanáriz & Chipe Libre"],
     ["Scoring any restaurant nearby", "Confusing T2 with T7 street-life only"]),
    ("T3", "Urban Shutterbug & Aesthetics",
     "Photogenic form, vista, facade, compositional urban beauty.",
     "Not interior museum depth alone, not culinary, not memory testimony.",
     "No aesthetic pull.", "Mildly photogenic.", "Clear visual composition value.",
     "Strong aesthetic destination.", "Reference Santiago shutterbug stop.",
     ["STGO_01 Plaza de Armas", "STGO_05 Cerro Santa Lucía & Terraza Neptuno"],
     ["Equating Instagram popularity with T3 depth"]),
    ("T4", "Subculture, Street Art & Indie",
     "Murals, indie corridors, bohemian/artist textures, countercultural grain.",
     "Not official mural museums alone, not luxury craft polish.",
     "No indie/street-art charge.", "Sparse mural/indie cue.", "Meaningful subcultural fabric.",
     "Strong indie/street-art corridor.", "Archetypal Santiago indie texture.",
     ["STGO_30 Bellavista Mural Corridors", "STGO_29 La Chascona (Neruda House)"],
     ["Scoring any colorful wall as T4 max"]),
    ("T5", "Mindful, Green & Quiet Living",
     "Parks, green calm, restorative quiet, contemplative outdoor living.",
     "Not hard ecology activism alone (see T8), not nightlife.",
     "No green/quiet value.", "Brief park-like pause.", "Meaningful restorative green.",
     "Strong quiet/green experience.", "Reference Santiago mindful landscape.",
     ["STGO_26 MNBA & Parque Forestal", "STGO_32 Cerro San Cristóbal Funicular"],
     ["Confusing T5 calm with T8 ecology advocacy"]),
    ("T6", "Dark Lore, Forensics & Macabre",
     "Dark historical residue, forensic scars, uncanny/macabre narrative material.",
     "Not respectful memory sites as spectacle; distinguish from T1B consent framing.",
     "No dark-lore charge.", "Faint uncanny hint.", "Clear forensic/dark layer.",
     "Strong dark-lore material.", "Archetypal dark Santiago narrative node.",
     ["STGO_04 Morandé 80", "STGO_19 Seguro Obrero Bullet Scars"],
     ["Romanticizing trauma", "Using T6 to replace explicit sensitive-memory flags"]),
    ("T7", "Budget Hacker & Street Life",
     "Everyday street economy, popular markets, low-friction local life, affordable grain.",
     "Not curated luxury, not institutional museums.",
     "No street-life charge.", "Incidental popular cue.", "Meaningful street economy.",
     "Strong budget/street-life character.", "Archetypal Santiago popular street node.",
     ["STGO_20 La Piojera", "STGO_34 La Vega Central"],
     ["Equating cheapness with T7", "Ignoring experiential richness of markets"]),
    ("T8", "Urban Ecology & Conscious Living",
     "Ecological consciousness, urban nature systems, environmental stewardship narrative.",
     "Not mere greenery (T5), not luxury wellness branding.",
     "No ecology narrative.", "Weak eco cue.", "Meaningful ecological layer.",
     "Strong conscious-ecology experience.", "Reference ecology node when present.",
     ["STGO_23 Inca Tambo Canal Dip (when launch-eligible contextually)"],
     ["Scoring every park as T8"]),
    ("T9", "Luxury Heritage & High Craft",
     "High craft, refined heritage finish, luxury-table or artisanal excellence.",
     "Not mere wealth signaling, not polish-as-comfort (see polish metric).",
     "No luxury/craft charge.", "Light craft cue.", "Meaningful high-craft layer.",
     "Strong luxury-heritage character.", "Archetypal Santiago high-craft stop.",
     ["STGO_02 Catedral Metropolitana", "STGO_21 Confitería Torres (1879)"],
     ["Equating ticket price with T9", "Confusing polish with T9"]),
]

METRIC_META = [
    ("anchor_density", "ANCHOR DENSITY",
     "Essential-city recognition / canonical importance for ChronoWalk — not physical crowd density, not edge degree.",
     "Not Metro proximity, not Google popularity, not graph centrality.",
     "Peripheral / easily skippable.", "Recognizable but secondary.", "Solid city-essential candidate.",
     "Strong canonical stop.", "Must-not-miss Santiago anchor.",
     ["Overweighting tourist buses", "Confusing physical density with editorial anchor"]),
    ("heritage_depth", "HERITAGE DEPTH",
     "Depth of historically/culturally meaningful material available for ChronoWalk storytelling.",
     "Not facade beauty alone (T3), not length of Wikipedia page.",
     "Thin story surface.", "One clear anecdote.", "Layered historical material.",
     "Rich multi-period depth.", "Exceptional storytelling depth.",
     ["Scoring age alone", "Ignoring living cultural practice"]),
    ("micro_reveal", "MICRO REVEAL",
     "Hidden, easily missed, observation-dependent discovery potential.",
     "Not mega-landmarks, not brochure headlines.",
     "Nothing to discover on-site.", "One small missable detail.", "Clear reveal potential.",
     "Strong hidden-in-plain-sight material.", "Exemplary micro-reveal stop.",
     ["Punishing famous sites automatically", "Inventing secrets without evidence"]),
    ("polish", "POLISH",
     "Experiential finish, legibility, visitor readiness — without equating wealth/luxury with quality.",
     "Not T9 luxury, not accessibility (M2), not comfort friction alone (M5).",
     "Confusing / unfinished visit.", "Rough but usable.", "Clear and ready.",
     "Highly legible finished experience.", "Reference-standard readiness.",
     ["Scoring luxury price as polish", "Penalizing raw markets unfairly"]),
]

MODE_META = [
    ("M1", "Express / Time-Boxed",
     "Fits short budgets; low interaction complexity; can be experienced quickly without collapse of meaning.",
     "0=unsuitable for express · 50=possible with tradeoffs · 100=ideal express stop",
     "Prefer authored/proposed visit times; do not invent travel time into visit cost.",
     "UNKNOWN visit duration ⇒ soft/uncertain, not automatic fail.",
     ["Using physical walk time as visit time", "Forcing long museums into M1=1.0"]),
    ("M2", "Accessibility / Step-Free",
     "Compatibility with step-free / accessibility-sensitive travel.",
     "Evidence-based only. UNKNOWN must not become yes or no automatically.",
     "Require PRESENT evidence (FOUNDER step_free / field verification).",
     "UNKNOWN stays UNKNOWN — never coerce to 0 or 1.",
     ["Inferring stairs from hills alone", "Treating UNKNOWN as inaccessible"]),
    ("M3", "Family & Kid Quest",
     "Suitability for family/kid pacing, comprehension, and emotional safety.",
     "0=poor family fit · 50=mixed · 100=excellent family quest stop",
     "Use experience character; keep sensitive memory separate.",
     "Sensitive sites may be low M3 even if thematically rich.",
     ["Assuming plazas always family-perfect", "Ignoring emotional load"]),
    ("M4", "Night Owl / Nocturnal",
     "Viability after dark: lighting, opening posture, nocturnal atmosphere.",
     "Respect daylight_only and opening unknown states.",
     "daylight_only=true ⇒ low nocturnal suitability.",
     "Hours UNKNOWN ⇒ do not claim verified night access.",
     ["Assuming all plazas are night-safe", "Ignoring daylight_only flags"]),
    ("M5", "High Comfort / Low Friction",
     "Low physical/administrative friction for comfort-seeking travelers.",
     "May use polish + exclude_for_m5 evidence; not luxury snobbery.",
     "exclude_for_m5 present+true should depress M5.",
     "UNKNOWN friction remains visible; do not fabricate.",
     ["Equating luxury with comfort", "Hiding stairs behind high polish"]),
]


def slim_record(r: dict) -> dict:
    modes = {}
    for k, v in (r.get("structuralSuitability") or {}).items():
        modes[k] = {
            "value": v.get("value"),
            "status": v.get("status"),
            "provenance": v.get("provenance"),
        }
    flags = {}
    for k, v in (r.get("flags") or {}).items():
        flags[k] = {
            "value": v.get("value"),
            "status": v.get("status"),
            "provenance": v.get("provenance"),
        }
    return {
        "stgoId": r["stgoId"],
        "displayName": r["displayName"],
        "tier": r["tier"],
        "tierProvenance": r.get("tierProvenance"),
        "editorialRole": r.get("editorialRole"),
        "thematicVector": r["thematicVector"],
        "thematicVectorProvenance": r.get("thematicVectorProvenance"),
        "structuralMetrics": r["structuralMetrics"],
        "structuralMetricsProvenance": r.get("structuralMetricsProvenance"),
        "chronoWorthProposed": r["chronoWorth"]["proposed"],
        "chronoWorthProvenance": r["chronoWorth"]["provenance"],
        "visitTime": {
            "min": r["visitTime"]["min"],
            "typical": r["visitTime"]["typical"],
            "max": r["visitTime"]["max"],
            "provenance": r["visitTime"]["provenance"],
        },
        "modes": modes,
        "flags": flags,
        "sensitiveMemory": r.get("sensitiveMemory"),
        "accessibility": r.get("accessibility"),
        "operational": r.get("operational"),
        "launchRuntimeDisposition": r.get("launchRuntimeDisposition"),
    }


def main() -> int:
    cal = json.loads(LAUNCH.read_text(encoding="utf-8"))
    assert len(cal["records"]) == 30
    payload = {
        "schemaVersion": "santiago-launch30-founder-cockpit.source.v0.1",
        "gate": "2A.1R-UI",
        "sourceCheckpointSha": CHECKPOINT,
        "sourceDataset": SOURCE_DATASET,
        "canonicalSemanticArtifact": SEMANTIC,
        "launchCalibrationArtifact": str(LAUNCH.relative_to(ROOT)),
        "normalizationCorpus": "SANTIAGO_LAUNCH30_V0_1",
        "chronoWorthFormula": "100*(0.35*heritage_depth + 0.30*anchor_density + 0.20*micro_reveal + 0.15*polish)",
        "records": [slim_record(r) for r in sorted(cal["records"], key=lambda x: x["stgoId"])],
    }
    theme_json = json.dumps(THEME_META, ensure_ascii=False)
    metric_json = json.dumps(METRIC_META, ensure_ascii=False)
    mode_json = json.dumps(MODE_META, ensure_ascii=False)
    source_json = json.dumps(payload, ensure_ascii=False)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ChronoWalk — Founder Calibration Cockpit (Launch 30)</title>
<style>
:root {{
  --ink:#1c1917; --muted:#78716c; --line:#e7e5e4; --bg:#f7f4ef; --panel:#fff;
  --founder:#0f766e; --source:#0369a1; --ai:#b45309; --warn:#b91c1c; --ok:#166534;
  --track:#e7e5e4; --delta:#7c3aed;
}}
*{{box-sizing:border-box}}
body{{margin:0;font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;color:var(--ink);
background:radial-gradient(ellipse at 0% 0%,#dbeafe55,transparent 40%),radial-gradient(ellipse at 100% 0%,#fef3c755,transparent 35%),linear-gradient(180deg,#f8fafc,var(--bg));}}
header{{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.9);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);padding:.85rem 1rem}}
h1{{margin:0;font-size:1.35rem;letter-spacing:-.02em}}
.sub{{color:var(--muted);font-size:.9rem;margin-top:.2rem}}
.toolbar{{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.7rem;align-items:center}}
button,select,input[type=search],input[type=number],textarea{{font:inherit;border:1px solid var(--line);border-radius:8px;padding:.4rem .7rem;background:#fff}}
button{{cursor:pointer}}
button.primary{{background:var(--founder);color:#fff;border-color:var(--founder)}}
button.danger{{background:#fff;color:var(--warn);border-color:#fecaca}}
button.ghost{{background:transparent}}
.badge{{display:inline-block;font-size:.68rem;letter-spacing:.04em;text-transform:uppercase;padding:.15rem .4rem;border-radius:999px;border:1px solid var(--line);color:var(--muted);margin-right:.25rem}}
.badge.source{{color:var(--source);border-color:#bae6fd;background:#f0f9ff}}
.badge.founder{{color:var(--founder);border-color:#99f6e4;background:#f0fdfa}}
.badge.ai{{color:var(--ai);border-color:#fde68a;background:#fffbeb}}
.badge.ok{{color:var(--ok);border-color:#bbf7d0;background:#f0fdf4}}
.badge.warn{{color:var(--warn);border-color:#fecaca;background:#fef2f2}}
.badge.unknown{{color:#a8a29e}}
.layout{{display:grid;grid-template-columns:300px 1fr;gap:1rem;max-width:1400px;margin:0 auto;padding:1rem 1rem 3rem}}
@media(max-width:980px){{.layout{{grid-template-columns:1fr}}}}
.side,.main{{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden}}
.side{{max-height:calc(100vh - 130px);overflow:auto}}
.side .item{{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--line);border-radius:0;padding:.7rem .8rem;background:#fff}}
.side .item.active{{background:#ecfdf5}}
.side .item.dirty{{box-shadow:inset 3px 0 0 var(--delta)}}
.side .id{{font-weight:700;font-size:.8rem}}
.side .name{{font-size:.9rem}}
.side .meta{{color:var(--muted);font-size:.75rem}}
.main{{padding:1rem 1.1rem 1.4rem}}
.row{{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}}
@media(max-width:800px){{.row{{grid-template-columns:1fr}}}}
.field{{border:1px solid var(--line);border-radius:12px;padding:.7rem .8rem;background:#fff}}
.field.changed{{border-color:#c4b5fd;background:#faf5ff}}
h2{{margin:.2rem 0 .4rem;font-size:1.45rem}}
h3{{margin:1.1rem 0 .45rem;font-size:.82rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}}
.slider-wrap{{margin:.55rem 0 .8rem}}
.slider-head{{display:flex;justify-content:space-between;gap:.5rem;align-items:baseline;font-size:.9rem}}
.slider-track{{position:relative;height:28px;margin-top:.35rem}}
.slider-track input[type=range]{{width:100%;position:relative;z-index:2;background:transparent}}
.orig-mark{{position:absolute;top:4px;width:2px;height:20px;background:var(--source);z-index:1;transform:translateX(-1px)}}
.anchors{{display:flex;justify-content:space-between;font-size:.68rem;color:var(--muted)}}
.cmp{{font-size:.82rem;color:var(--muted);margin-top:.15rem}}
.cmp b.source{{color:var(--source)}}
.cmp b.founder{{color:var(--founder)}}
.cmp b.delta{{color:var(--delta)}}
.cwbox{{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}}
.cwbox .big{{font-size:1.5rem;font-variant-numeric:tabular-nums}}
table{{width:100%;border-collapse:collapse;font-size:.85rem}}
th,td{{border-bottom:1px solid var(--line);padding:.4rem .35rem;text-align:left}}
th{{cursor:pointer;color:var(--muted);font-weight:600}}
.toast{{position:fixed;right:1rem;bottom:1rem;background:#134e4a;color:#fff;padding:.7rem 1rem;border-radius:10px;display:none;z-index:50}}
.modal{{position:fixed;inset:0;background:rgba(28,25,23,.45);z-index:40;display:none;align-items:flex-start;justify-content:center;padding:2rem 1rem;overflow:auto}}
.modal.open{{display:flex}}
.modal .sheet{{background:#fff;border-radius:16px;max-width:920px;width:100%;padding:1.1rem 1.2rem 1.5rem;border:1px solid var(--line)}}
.guide-card{{border:1px solid var(--line);border-radius:12px;padding:.8rem;margin:.55rem 0}}
.unsaved{{color:var(--warn);font-weight:700}}
.statusline{{font-size:.85rem;color:var(--muted)}}
.resetf{{font-size:.75rem;padding:.15rem .4rem;margin-left:.35rem}}
</style>
</head>
<body>
<header>
  <h1>Founder Calibration Cockpit — Santiago Launch 30</h1>
  <div class="sub">Gate 2A.1R-UI · Immutable source snapshot + editable founder draft · localStorage persistence · export for Gate 2A.2 ingest</div>
  <div class="toolbar">
    <button id="prevBtn">← Prev</button>
    <button id="nextBtn">Next →</button>
    <input type="search" id="search" placeholder="Search POI…" style="min-width:160px"/>
    <select id="filter">
      <option value="ALL">ALL</option>
      <option value="UNREVIEWED">UNREVIEWED</option>
      <option value="MODIFIED">MODIFIED</option>
      <option value="APPROVED">APPROVED</option>
      <option value="NEEDS_RESEARCH">NEEDS RESEARCH</option>
    </select>
    <button class="primary" id="saveBtn">Save Draft</button>
    <button class="primary" id="approveBtn">Approve POI</button>
    <button class="danger" id="resetPoiBtn">Reset POI to Source</button>
    <button id="exportBtn">Export Founder Calibration</button>
    <button class="ghost" id="guideBtn">Taxonomy & Scoring Guide</button>
    <span class="statusline" id="progress"></span>
    <span class="statusline" id="saveStatus"></span>
  </div>
</header>
<div class="layout">
  <aside class="side" id="list"></aside>
  <section class="main">
    <div id="detail"></div>
    <h3>Overview table</h3>
    <div style="overflow:auto">
      <table id="overview"><thead></thead><tbody></tbody></table>
    </div>
  </section>
</div>
<div class="modal" id="guideModal"><div class="sheet" id="guideSheet"></div></div>
<div class="toast" id="toast"></div>
<script>
const SOURCE = {source_json};
const THEME_META = {theme_json};
const METRIC_META = {metric_json};
const MODE_META = {mode_json};
const STORAGE_KEY = 'cw_founder_cockpit_launch30_v0_1';
const THEMES = ['T1A','T1B','T2','T3','T4','T5','T6','T7','T8','T9'];
const METRICS = ['anchor_density','heritage_depth','micro_reveal','polish'];
const MODES = ['M1','M2','M3','M4','M5'];
const TIERS = ['canonical_anchor','thematic_pocket','micro_reveal'];

function deepClone(x){{ return JSON.parse(JSON.stringify(x)); }}
function clamp01(x){{ return Math.max(0, Math.min(1, Number(x)||0)); }}
function toUi(v){{ return Math.round(clamp01(v)*100); }}
function fromUi(v){{ return clamp01(Number(v)/100); }}
function round1(n){{ return Math.round(n*10)/10; }}
function round2(n){{ return Math.round(n*100)/100; }}

function rawChrono(m){{
  return 100*(0.35*clamp01(m.heritage_depth)+0.30*clamp01(m.anchor_density)+0.20*clamp01(m.micro_reveal)+0.15*clamp01(m.polish));
}}

function makeDraftFromSource(src){{
  const modes = {{}};
  MODES.forEach(k => {{
    const m = src.modes[k] || {{}};
    modes[k] = {{ value: m.value == null ? null : clamp01(m.value), status: m.status || null, evidence: m.status || 'UNKNOWN' }};
  }});
  return {{
    stgoId: src.stgoId,
    thematicVector: deepClone(src.thematicVector),
    structuralMetrics: deepClone(src.structuralMetrics),
    tier: src.tier,
    visitTimeMin: src.visitTime.min,
    visitTimeTypical: src.visitTime.typical,
    visitTimeMax: src.visitTime.max,
    modes,
    accessibilityState: src.accessibility?.status || 'UNKNOWN',
    operationalState: src.operational?.classification || 'HOURS_REQUIRED_UNKNOWN',
    needsResearch: false,
    founderNote: '',
    founderApproval: 'UNREVIEWED',
    approvedAt: null,
  }};
}}

function loadStore(){{
  try {{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  }} catch {{ return null; }}
}}

function defaultStore(){{
  const drafts = {{}};
  SOURCE.records.forEach(r => {{ drafts[r.stgoId] = makeDraftFromSource(r); }});
  return {{
    schemaVersion: 'santiago-launch30-founder-cockpit.draft.v0.1',
    sourceCheckpointSha: SOURCE.sourceCheckpointSha,
    normalizationCorpus: SOURCE.normalizationCorpus,
    lastSavedAt: null,
    dirty: false,
    drafts,
  }};
}}

let store = loadStore();
if (!store || store.sourceCheckpointSha !== SOURCE.sourceCheckpointSha || !store.drafts) {{
  store = defaultStore();
}} else {{
  // Ensure all 30 exist
  SOURCE.records.forEach(r => {{
    if (!store.drafts[r.stgoId]) store.drafts[r.stgoId] = makeDraftFromSource(r);
  }});
}}

let currentId = SOURCE.records[0].stgoId;
let sortKey = 'norm';
let sortDir = -1;
const sourceById = Object.fromEntries(SOURCE.records.map(r => [r.stgoId, r]));

function toast(msg){{
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.display='block';
  setTimeout(()=>t.style.display='none', 1600);
}}

function fieldChanged(srcVal, draftVal){{
  if (typeof srcVal === 'number' || typeof draftVal === 'number') {{
    return round2(Number(srcVal||0)) !== round2(Number(draftVal||0));
  }}
  return JSON.stringify(srcVal) !== JSON.stringify(draftVal);
}}

function changedFields(id){{
  const src = sourceById[id];
  const d = store.drafts[id];
  const out = [];
  THEMES.forEach(t => {{ if (fieldChanged(src.thematicVector[t], d.thematicVector[t])) out.push(t); }});
  METRICS.forEach(m => {{ if (fieldChanged(src.structuralMetrics[m], d.structuralMetrics[m])) out.push(m); }});
  if (fieldChanged(src.tier, d.tier)) out.push('tier');
  if (fieldChanged(src.visitTime.min, d.visitTimeMin)) out.push('visitTimeMin');
  if (fieldChanged(src.visitTime.typical, d.visitTimeTypical)) out.push('visitTimeTypical');
  if (fieldChanged(src.visitTime.max, d.visitTimeMax)) out.push('visitTimeMax');
  MODES.forEach(m => {{
    const sv = src.modes[m]?.value;
    const dv = d.modes[m]?.value;
    if (fieldChanged(sv, dv)) out.push(m);
  }});
  if (d.needsResearch) out.push('needsResearch');
  if ((d.founderNote||'') !== '') out.push('founderNote');
  return out;
}}

function corpusScores(){{
  const raws = {{}};
  let maxRaw = 0;
  SOURCE.records.forEach(r => {{
    const d = store.drafts[r.stgoId];
    const raw = rawChrono(d.structuralMetrics);
    raws[r.stgoId] = raw;
    if (raw > maxRaw) maxRaw = raw;
  }});
  const norms = {{}};
  SOURCE.records.forEach(r => {{
    norms[r.stgoId] = maxRaw > 0 ? (100 * raws[r.stgoId] / maxRaw) : 0;
  }});
  return {{ raws, norms, maxRaw }};
}}

function markDirty(){{
  store.dirty = true;
  const d = store.drafts[currentId];
  if (d.founderApproval === 'APPROVED') d.founderApproval = 'MODIFIED_AFTER_APPROVAL';
  render();
}}

function saveDraft(){{
  store.lastSavedAt = new Date().toISOString();
  store.dirty = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  render();
  toast('Draft saved');
}}

function approvePoi(){{
  const d = store.drafts[currentId];
  d.founderApproval = 'APPROVED';
  d.approvedAt = new Date().toISOString();
  store.lastSavedAt = d.approvedAt;
  store.dirty = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  render();
  toast('POI approved: '+currentId);
}}

function resetPoi(){{
  store.drafts[currentId] = makeDraftFromSource(sourceById[currentId]);
  markDirty();
  toast('POI reset to source');
}}

function resetField(kind, key){{
  const src = sourceById[currentId];
  const d = store.drafts[currentId];
  if (kind==='theme') d.thematicVector[key] = src.thematicVector[key];
  if (kind==='metric') d.structuralMetrics[key] = src.structuralMetrics[key];
  if (kind==='tier') d.tier = src.tier;
  if (kind==='visitMin') d.visitTimeMin = src.visitTime.min;
  if (kind==='mode') {{
    d.modes[key].value = src.modes[key]?.value == null ? null : clamp01(src.modes[key].value);
  }}
  markDirty();
}}

function filteredIds(){{
  const q = (document.getElementById('search').value||'').toLowerCase();
  const f = document.getElementById('filter').value;
  return SOURCE.records.filter(r => {{
    const d = store.drafts[r.stgoId];
    const ch = changedFields(r.stgoId);
    if (q && !(r.stgoId.toLowerCase().includes(q) || r.displayName.toLowerCase().includes(q))) return false;
    if (f==='UNREVIEWED' && d.founderApproval !== 'UNREVIEWED') return false;
    if (f==='MODIFIED' && !(ch.length>0 || d.founderApproval==='MODIFIED_AFTER_APPROVAL')) return false;
    if (f==='APPROVED' && d.founderApproval !== 'APPROVED') return false;
    if (f==='NEEDS_RESEARCH' && !d.needsResearch) return false;
    return true;
  }}).map(r => r.stgoId);
}}

function renderList(){{
  const list = document.getElementById('list');
  list.innerHTML = '';
  const {{norms}} = corpusScores();
  filteredIds().forEach(id => {{
    const r = sourceById[id];
    const d = store.drafts[id];
    const ch = changedFields(id);
    const b = document.createElement('button');
    b.className = 'item'+(id===currentId?' active':'')+(ch.length?' dirty':'');
    b.innerHTML = `<div class="id">${{id}}</div><div class="name">${{r.displayName}}</div>
      <div class="meta">${{d.tier}} · Rel ${{Math.round(norms[id])}} · ${{d.founderApproval}} · Δ${{ch.length}}</div>`;
    b.onclick = () => {{ currentId = id; render(); }};
    list.appendChild(b);
  }});
}}

function sliderHTML(label, kind, key, src01, draft01, provenanceBadge){{
  const s = toUi(src01), dr = toUi(draft01);
  const changed = s !== dr;
  const delta = dr - s;
  return `<div class="slider-wrap field ${{changed?'changed':''}}">
    <div class="slider-head"><span><b>${{label}}</b> ${{provenanceBadge||''}}</span>
      <span><input type="number" min="0" max="100" step="1" value="${{dr}}" data-kind="${{kind}}" data-key="${{key}}" class="numedit" style="width:4.2rem"/> / 100
      <button class="resetf" data-reset-kind="${{kind}}" data-reset-key="${{key}}">Reset field</button></span></div>
    <div class="slider-track">
      <div class="orig-mark" style="left:${{s}}%" title="SOURCE ${{s}}"></div>
      <input type="range" min="0" max="100" step="1" value="${{dr}}" data-kind="${{kind}}" data-key="${{key}}" class="rng"/>
    </div>
    <div class="anchors"><span>0 absent</span><span>25 weak</span><span>50 meaningful</span><span>75 strong</span><span>100 archetypal</span></div>
    <div class="cmp">SOURCE <b class="source">${{s}}</b> → FOUNDER <b class="founder">${{dr}}</b> · Δ <b class="delta">${{delta>=0?'+':''}}${{delta}}</b>${{changed?' · ORIGINAL → DRAFT':''}}</div>
  </div>`;
}}

function renderDetail(){{
  const src = sourceById[currentId];
  const d = store.drafts[currentId];
  const {{raws, norms, maxRaw}} = corpusScores();
  const raw = raws[currentId];
  const norm = norms[currentId];
  const ch = changedFields(currentId);
  const topId = Object.keys(raws).sort((a,b)=>raws[b]-raws[a])[0];

  let themes = THEMES.map(t => {{
    const meta = THEME_META.find(x => x[0]===t);
    const badge = `<span class="badge ${{fieldChanged(src.thematicVector[t], d.thematicVector[t])?'founder':'source'}}">${{fieldChanged(src.thematicVector[t], d.thematicVector[t])?'FOUNDER_EDITED':'FOUNDER_PRECALIBRATED'}}</span>`;
    return sliderHTML(`${{t}} · ${{meta?meta[1]:t}}`, 'theme', t, src.thematicVector[t], d.thematicVector[t], badge);
  }}).join('');

  let metrics = METRICS.map(m => {{
    const meta = METRIC_META.find(x => x[0]===m);
    const badge = `<span class="badge ${{fieldChanged(src.structuralMetrics[m], d.structuralMetrics[m])?'founder':'source'}}">${{fieldChanged(src.structuralMetrics[m], d.structuralMetrics[m])?'FOUNDER_EDITED':'FOUNDER_PRECALIBRATED'}}</span>`;
    return sliderHTML(meta?meta[1]:m, 'metric', m, src.structuralMetrics[m], d.structuralMetrics[m], badge);
  }}).join('');

  let modes = MODES.map(m => {{
    const meta = MODE_META.find(x => x[0]===m);
    const sv = src.modes[m]?.value;
    const dv = d.modes[m]?.value;
    const prov = src.modes[m]?.provenance || '';
    const isAi = /AI_PROPOSED/i.test(prov);
    const badge = `<span class="badge ${{fieldChanged(sv,dv)?'founder':(isAi?'ai':'source')}}">${{fieldChanged(sv,dv)?'FOUNDER_EDITED':(isAi?'AI_PROPOSED_UNVERIFIED':'FOUNDER_PRECALIBRATED')}}</span>`;
    if (dv == null && sv == null) {{
      return `<div class="field"><b>${{m}} · ${{meta?meta[1]:m}}</b> ${{badge}}<div class="cmp">UNKNOWN — no invented evidence</div>
        <label>Set draft 0–100 (optional)</label>
        <input type="number" min="0" max="100" class="numedit" data-kind="mode" data-key="${{m}}" value="" placeholder="UNKNOWN"/>
        <button class="resetf" data-reset-kind="mode" data-reset-key="${{m}}">Reset field</button></div>`;
    }}
    return sliderHTML(`${{m}} · ${{meta?meta[1]:m}}`, 'mode', m, sv ?? 0, dv ?? 0, badge) +
      (m==='M2' ? `<div class="cmp">Evidence: ${{d.modes.M2.evidence || src.modes.M2?.status || 'UNKNOWN'}} · UNKNOWN never auto-becomes yes/no</div>` : '');
  }}).join('');

  document.getElementById('detail').innerHTML = `
    <div>
      <span class="badge">${{d.tier}}</span>
      <span class="badge ${{d.founderApproval==='APPROVED'?'ok':(d.founderApproval==='MODIFIED_AFTER_APPROVAL'?'warn':'unknown')}}">${{d.founderApproval}}</span>
      ${{d.needsResearch?'<span class="badge warn">NEEDS_RESEARCH</span>':''}}
      <span class="badge">${{ch.length}} changed fields</span>
      <span class="badge source">SOURCE IMMUTABLE</span>
    </div>
    <h2>${{src.displayName}}</h2>
    <div class="statusline">${{src.stgoId}} · disposition ${{src.launchRuntimeDisposition||'—'}} · editorialRole ${{src.editorialRole||'—'}} · jump
      <select id="jump">${{SOURCE.records.map(r=>`<option value="${{r.stgoId}}" ${{r.stgoId===currentId?'selected':''}}>${{r.stgoId}} — ${{r.displayName}}</option>`).join('')}}</select>
    </div>

    <h3>ChronoWorth</h3>
    <div class="cwbox">
      <div class="field">
        <div class="badge ai">RAW (formula)</div>
        <div class="big">${{round1(raw)}} / 100</div>
        <div class="cmp">100×(0.35·heritage + 0.30·anchor + 0.20·micro + 0.15·polish)</div>
        <div class="cmp">Live from founder draft structural metrics</div>
      </div>
      <div class="field">
        <div class="badge founder">RELATIVE Santiago ChronoWorth</div>
        <div class="big">${{Math.round(norm)}} / 100</div>
        <div class="cmp">Corpus: <b>${{SOURCE.normalizationCorpus}}</b></div>
        <div class="cmp">max raw in Launch30 = ${{round1(maxRaw)}} (${{topId}}) ⇒ relative max 100</div>
        <div class="cmp">Not globally comparable across future cities</div>
      </div>
    </div>

    <h3>Themes T1A–T9 <span class="badge source">FOUNDER_PRECALIBRATED seed</span></h3>
    ${{themes}}

    <h3>Structural metrics</h3>
    ${{metrics}}

    <h3>Tier / visit / modes / operational</h3>
    <div class="row">
      <div class="field ${{fieldChanged(src.tier,d.tier)?'changed':''}}">
        <label>Tier</label>
        <select id="tierSel">${{TIERS.map(t=>`<option value="${{t}}" ${{t===d.tier?'selected':''}}>${{t}}</option>`).join('')}}</select>
        <button class="resetf" data-reset-kind="tier" data-reset-key="tier">Reset field</button>
        <div class="cmp">SOURCE <b class="source">${{src.tier}}</b> → FOUNDER <b class="founder">${{d.tier}}</b></div>
      </div>
      <div class="field ${{fieldChanged(src.visitTime.min,d.visitTimeMin)?'changed':''}}">
        <label>Visit time min / typical / max (minutes, no travel)</label>
        <div style="display:flex;gap:.4rem">
          <input type="number" id="vmin" value="${{d.visitTimeMin}}" style="width:5rem"/>
          <input type="number" id="vtyp" value="${{d.visitTimeTypical}}" style="width:5rem"/>
          <input type="number" id="vmax" value="${{d.visitTimeMax}}" style="width:5rem"/>
        </div>
        <div class="cmp"><span class="badge ai">AI_PROPOSED_UNVERIFIED seed</span> SOURCE min ${{src.visitTime.min}}</div>
      </div>
    </div>
    ${{modes}}
    <div class="row">
      <div class="field">
        <label>Accessibility evidence state</label>
        <select id="accState">
          ${{['KNOWN_STEP_FREE','KNOWN_NOT_STEP_FREE','UNKNOWN','NEEDS_RESEARCH'].map(s=>`<option ${{d.accessibilityState===s?'selected':''}}>${{s}}</option>`).join('')}}
        </select>
        <div class="cmp">Source: ${{src.accessibility?.status||'UNKNOWN'}} · ${{src.accessibility?.provenance||''}}</div>
      </div>
      <div class="field">
        <label>Operational / hours posture</label>
        <select id="opsState">
          ${{['DAYLIGHT_ONLY','HOURS_REQUIRED_UNKNOWN','EXTERIOR_ALWAYS_OBSERVABLE','KNOWN_RESTRICTION','NEEDS_RESEARCH'].map(s=>`<option ${{d.operationalState===s?'selected':''}}>${{s}}</option>`).join('')}}
        </select>
        <div class="cmp">Source: ${{src.operational?.classification||'UNKNOWN'}} · daylightOnly=${{String(src.operational?.daylightOnly)}}</div>
      </div>
      <div class="field">
        <label><input type="checkbox" id="needsResearch" ${{d.needsResearch?'checked':''}}/> Mark NEEDS RESEARCH</label>
        <div class="cmp">Flags (read-only source): ${{Object.entries(src.flags||{{}}).map(([k,v])=>k+':'+(v.status==='PRESENT'?String(v.value):'UNKNOWN')).join(' · ')}}</div>
        <div class="cmp">Sensitive memory source: ${{JSON.stringify(src.sensitiveMemory)}}</div>
      </div>
    </div>

    <h3>Founder editorial note</h3>
    <div class="field"><textarea id="note" rows="3" style="width:100%;border:0;resize:vertical" placeholder="Internal founder note (not traveler-facing)">${{d.founderNote||''}}</textarea></div>
  `;

  document.querySelectorAll('.rng').forEach(el => {{
    el.oninput = (e) => {{
      const kind = e.target.dataset.kind, key = e.target.dataset.key, val = fromUi(e.target.value);
      if (kind==='theme') store.drafts[currentId].thematicVector[key]=val;
      if (kind==='metric') store.drafts[currentId].structuralMetrics[key]=val;
      if (kind==='mode') store.drafts[currentId].modes[key].value=val;
      markDirty();
    }};
  }});
  document.querySelectorAll('.numedit').forEach(el => {{
    el.onchange = (e) => {{
      const kind = e.target.dataset.kind, key = e.target.dataset.key;
      if (e.target.value === '') {{
        if (kind==='mode') store.drafts[currentId].modes[key].value = null;
      }} else {{
        const val = fromUi(e.target.value);
        if (kind==='theme') store.drafts[currentId].thematicVector[key]=val;
        if (kind==='metric') store.drafts[currentId].structuralMetrics[key]=val;
        if (kind==='mode') store.drafts[currentId].modes[key].value=val;
      }}
      markDirty();
    }};
  }});
  document.querySelectorAll('[data-reset-kind]').forEach(el => {{
    el.onclick = () => resetField(el.dataset.resetKind, el.dataset.resetKey);
  }});
  document.getElementById('tierSel').onchange = (e) => {{ store.drafts[currentId].tier = e.target.value; markDirty(); }};
  document.getElementById('vmin').onchange = (e) => {{ store.drafts[currentId].visitTimeMin = Number(e.target.value); markDirty(); }};
  document.getElementById('vtyp').onchange = (e) => {{ store.drafts[currentId].visitTimeTypical = Number(e.target.value); markDirty(); }};
  document.getElementById('vmax').onchange = (e) => {{ store.drafts[currentId].visitTimeMax = Number(e.target.value); markDirty(); }};
  document.getElementById('accState').onchange = (e) => {{ store.drafts[currentId].accessibilityState = e.target.value; markDirty(); }};
  document.getElementById('opsState').onchange = (e) => {{ store.drafts[currentId].operationalState = e.target.value; markDirty(); }};
  document.getElementById('needsResearch').onchange = (e) => {{ store.drafts[currentId].needsResearch = e.target.checked; markDirty(); }};
  document.getElementById('note').onchange = (e) => {{ store.drafts[currentId].founderNote = e.target.value; markDirty(); }};
  document.getElementById('jump').onchange = (e) => {{ currentId = e.target.value; render(); }};
}}

function renderOverview(){{
  const {{raws, norms}} = corpusScores();
  let rows = SOURCE.records.map(r => {{
    const d = store.drafts[r.stgoId];
    const ch = changedFields(r.stgoId);
    return {{ id:r.stgoId, name:r.displayName, tier:d.tier, raw:raws[r.stgoId], norm:norms[r.stgoId], ch:ch.length, appr:d.founderApproval }};
  }});
  rows.sort((a,b) => {{
    const av = a[sortKey==='name'?'name':sortKey==='tier'?'tier':sortKey==='raw'?'raw':sortKey==='ch'?'ch':sortKey==='appr'?'appr':'norm'];
    const bv = b[sortKey==='name'?'name':sortKey==='tier'?'tier':sortKey==='raw'?'raw':sortKey==='ch'?'ch':sortKey==='appr'?'appr':'norm'];
    if (av<bv) return -1*sortDir; if (av>bv) return 1*sortDir; return a.id.localeCompare(b.id);
  }});
  const thead = document.querySelector('#overview thead');
  thead.innerHTML = `<tr>
    <th data-k="id">STGO</th><th data-k="name">Name</th><th data-k="tier">Tier</th>
    <th data-k="raw">Raw CW</th><th data-k="norm">Norm CW</th><th data-k="ch">Changed</th><th data-k="appr">Approval</th></tr>`;
  thead.querySelectorAll('th').forEach(th => th.onclick = () => {{
    const k = th.dataset.k; if (sortKey===k) sortDir*=-1; else {{ sortKey=k; sortDir = (k==='norm'||k==='raw'||k==='ch')?-1:1; }}
    renderOverview();
  }});
  const tb = document.querySelector('#overview tbody');
  tb.innerHTML = rows.map(r => `<tr style="cursor:pointer" data-id="${{r.id}}">
    <td>${{r.id}}</td><td>${{r.name}}</td><td>${{r.tier}}</td>
    <td>${{round1(r.raw)}}</td><td><b>${{Math.round(r.norm)}}</b></td><td>${{r.ch}}</td><td>${{r.appr}}</td></tr>`).join('');
  tb.querySelectorAll('tr').forEach(tr => tr.onclick = () => {{ currentId = tr.dataset.id; render(); }});
}}

function renderProgress(){{
  let approved=0, modified=0, unreviewed=0, needs=0, unchangedApproved=0;
  SOURCE.records.forEach(r => {{
    const d = store.drafts[r.stgoId];
    const ch = changedFields(r.stgoId);
    if (d.founderApproval==='APPROVED') {{
      approved++;
      if (ch.length===0) unchangedApproved++;
    }}
    if (ch.length>0 || d.founderApproval==='MODIFIED_AFTER_APPROVAL') modified++;
    if (d.founderApproval==='UNREVIEWED') unreviewed++;
    if (d.needsResearch) needs++;
  }});
  document.getElementById('progress').textContent = `${{approved}} / 30 approved · modified ${{modified}} · unreviewed ${{unreviewed}} · needs-research ${{needs}}`;
  const unsaved = store.dirty ? '<span class="unsaved">Unsaved changes</span>' : 'All changes saved locally';
  document.getElementById('saveStatus').innerHTML = `${{unsaved}} · Last saved: ${{store.lastSavedAt || 'never'}}`;
}}

function renderGuide(){{
  let themes = THEME_META.map(t => `<div class="guide-card"><h4>${{t[0]}} — ${{t[1]}}</h4>
    <p><b>Definition:</b> ${{t[2]}}</p><p><b>Not:</b> ${{t[3]}}</p>
    <p><b>Anchors:</b> 0 ${{t[4]}} · 25 ${{t[5]}} · 50 ${{t[6]}} · 75 ${{t[7]}} · 100 ${{t[8]}}</p>
    <p><b>Launch examples (corpus evidence):</b> ${{t[9].join('; ')}}</p>
    <p><b>Common mistakes:</b> ${{t[10].join('; ')}}</p></div>`).join('');
  let metrics = METRIC_META.map(t => `<div class="guide-card"><h4>${{t[1]}}</h4>
    <p><b>Definition:</b> ${{t[2]}}</p><p><b>Not:</b> ${{t[3]}}</p>
    <p><b>Anchors:</b> 0 ${{t[4]}} · 25 ${{t[5]}} · 50 ${{t[6]}} · 75 ${{t[7]}} · 100 ${{t[8]}}</p>
    <p><b>Mistakes:</b> ${{t[9].join('; ')}}</p></div>`).join('');
  let modes = MODE_META.map(t => `<div class="guide-card"><h4>${{t[0]}} — ${{t[1]}}</h4>
    <p>${{t[2]}}</p><p><b>Scale:</b> ${{t[3]}}</p><p><b>Evidence:</b> ${{t[4]}}</p>
    <p><b>UNKNOWN:</b> ${{t[5]}}</p><p><b>Errors:</b> ${{t[6].join('; ')}}</p></div>`).join('');
  document.getElementById('guideSheet').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h2 style="margin:0">Taxonomy & Scoring Guide</h2>
      <button id="closeGuide">Close</button>
    </div>
    <p class="cmp">Scale meaning: 0 absent · 25 weak/incidental · 50 meaningful · 75 strongly characteristic · 100 archetypal Santiago reference. Edits are preserved while this guide is open.</p>
    <h3>ChronoWorth</h3>
    <div class="guide-card">
      <p><b>Question:</b> Independent of a particular traveler, how strong is this as a ChronoWalk experience?</p>
      <p><b>Not:</b> popularity, Google rating, tourist fame alone, personal match, accessibility, proximity, or route fit.</p>
      <p><b>Raw formula:</b> ${{SOURCE.chronoWorthFormula}}</p>
      <p><b>Relative:</b> 100 × raw / max(raw over ${{SOURCE.normalizationCorpus}}). Launch30 maximum becomes 100; minimum is NOT forced to 0.</p>
      <p><b>Separate concepts:</b> YourMatch = traveler fit; NodeUtility = editorial + traveler fit + context; ChronoWorth ≠ Match.</p>
    </div>
    <h3>Themes T1A–T9</h3>${{themes}}
    <h3>Structural metrics</h3>${{metrics}}
    <h3>Modes M1–M5</h3>${{modes}}
  `;
  document.getElementById('closeGuide').onclick = () => document.getElementById('guideModal').classList.remove('open');
}}

function exportJson(){{
  const {{raws, norms, maxRaw}} = corpusScores();
  let approved=0, modified=0, unreviewed=0, needs=0, unchangedApproved=0;
  const pois = SOURCE.records.map(src => {{
    const d = store.drafts[src.stgoId];
    const ch = changedFields(src.stgoId);
    if (d.founderApproval==='APPROVED') {{ approved++; if (!ch.length) unchangedApproved++; }}
    if (ch.length || d.founderApproval==='MODIFIED_AFTER_APPROVAL') modified++;
    if (d.founderApproval==='UNREVIEWED') unreviewed++;
    if (d.needsResearch) needs++;
    return {{
      stgoId: src.stgoId,
      displayName: src.displayName,
      source: {{
        thematicVector: src.thematicVector,
        structuralMetrics: src.structuralMetrics,
        tier: src.tier,
        visitTime: src.visitTime,
        modes: src.modes,
        accessibility: src.accessibility,
        operational: src.operational,
        flags: src.flags,
        chronoWorthProposedAtGate2A1R: src.chronoWorthProposed,
      }},
      founderDraft: {{
        thematicVector: d.thematicVector,
        structuralMetrics: d.structuralMetrics,
        tier: d.tier,
        visitTime: {{ min:d.visitTimeMin, typical:d.visitTimeTypical, max:d.visitTimeMax }},
        modes: d.modes,
        accessibilityState: d.accessibilityState,
        operationalState: d.operationalState,
        needsResearch: d.needsResearch,
        founderNote: d.founderNote,
      }},
      changedFields: ch,
      founderApproval: d.founderApproval,
      approvedAt: d.approvedAt,
      chronoWorthRaw: round1(raws[src.stgoId]),
      chronoWorthNormalized: Math.round(norms[src.stgoId]),
      provenance: {{
        thematicVector: fieldChanged(src.thematicVector, d.thematicVector) ? 'FOUNDER_EDITED' : 'FOUNDER_PRECALIBRATED',
        structuralMetrics: fieldChanged(src.structuralMetrics, d.structuralMetrics) ? 'FOUNDER_EDITED' : 'FOUNDER_PRECALIBRATED',
        visitTime: 'AI_PROPOSED_UNVERIFIED_OR_FOUNDER_EDITED',
      }},
    }};
  }});
  const incomplete = approved < 30;
  const doc = {{
    schemaVersion: 'santiago-launch30-founder-calibration.reviewed.v0.1',
    gate: '2A.1R-UI',
    sourceCheckpointSha: SOURCE.sourceCheckpointSha,
    sourceDataset: SOURCE.sourceDataset,
    canonicalSemanticArtifact: SOURCE.canonicalSemanticArtifact,
    launchCalibrationArtifact: SOURCE.launchCalibrationArtifact,
    normalizationCorpus: SOURCE.normalizationCorpus,
    chronoWorthFormula: SOURCE.chronoWorthFormula,
    exportTimestamp: new Date().toISOString(),
    reviewStatus: incomplete ? 'INCOMPLETE_FOUNDER_REVIEW' : 'COMPLETE_FOUNDER_REVIEW',
    summary: {{
      approved: approved,
      approvedOf: 30,
      modified,
      unchangedApproved,
      unreviewed,
      needsResearch: needs,
      maxRawChronoWorth: round1(maxRaw),
    }},
    records: pois,
  }};
  const blob = new Blob([JSON.stringify(doc, null, 2)], {{type:'application/json'}});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'launch30_founder_calibration.reviewed.v0.1.json';
  a.click();
  toast(incomplete ? 'Exported INCOMPLETE FOUNDER REVIEW' : 'Exported complete review');
}}

function render(){{
  renderList();
  renderDetail();
  renderOverview();
  renderProgress();
}}

document.getElementById('saveBtn').onclick = saveDraft;
document.getElementById('approveBtn').onclick = approvePoi;
document.getElementById('resetPoiBtn').onclick = resetPoi;
document.getElementById('exportBtn').onclick = exportJson;
document.getElementById('guideBtn').onclick = () => {{ renderGuide(); document.getElementById('guideModal').classList.add('open'); }};
document.getElementById('prevBtn').onclick = () => {{
  const ids = SOURCE.records.map(r=>r.stgoId);
  const i = ids.indexOf(currentId);
  currentId = ids[(i-1+ids.length)%ids.length]; render();
}};
document.getElementById('nextBtn').onclick = () => {{
  const ids = SOURCE.records.map(r=>r.stgoId);
  const i = ids.indexOf(currentId);
  currentId = ids[(i+1)%ids.length]; render();
}};
document.getElementById('search').oninput = render;
document.getElementById('filter').onchange = render;
document.getElementById('guideModal').addEventListener('click', (e) => {{
  if (e.target.id==='guideModal') e.currentTarget.classList.remove('open');
}});

// Expose for validation hooks / manual QA in console
window.__CW_FOUNDER_COCKPIT__ = {{
  SOURCE, store, corpusScores, changedFields, rawChrono, makeDraftFromSource, STORAGE_KEY,
  saveDraft, approvePoi, resetPoi, resetField, exportJson,
}};

render();
</script>
</body>
</html>
"""
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print("Wrote", OUT.relative_to(ROOT))
    print("POIs", len(payload["records"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
