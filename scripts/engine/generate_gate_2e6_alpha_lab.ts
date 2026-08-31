#!/usr/bin/env npx tsx
/**
 * Gate 2E.6 / 2E.6F — generate Feature-Complete Alpha Lab + Founder Comparison (NON-CANONICAL).
 * Engine runs at generation time only — founder UI does not recompute routes.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runFeatureCompleteAlpha } from '../../src/engine/vnext/pipeline/run-feature-complete-alpha'
import { ALPHA_BENCHMARKS } from '../../src/engine/vnext/benchmarks/alpha-benchmarks'
import { summarizeFeatureCompleteStatus } from '../../src/engine/vnext/status/engine-feature-status'
import {
  engineRouteFromAlphaRun,
  travelerRequestFingerprint,
  FEATURE_COMPLETE_ALPHA_FREEZE_SHA,
} from '../../src/engine/review/founder-benchmark-review.v0.1'

const ROOT = resolve(__dirname, '../..')
const OUT = resolve(ROOT, 'docs/engine/gate-2e6-feature-complete-alpha-lab.html')

function buildDemo(b: (typeof ALPHA_BENCHMARKS)[0]) {
  const run = runFeatureCompleteAlpha(b.request, { root: ROOT })
  const engineRoute = engineRouteFromAlphaRun(run)
  return {
    id: b.id,
    label: b.label,
    coverage: b.coverage,
    coverageNote: b.coverageNote,
    travelerRequestFingerprint: run.composition.requestHash || travelerRequestFingerprint(b.request),
    timeEvaluationMode: run.timeEvaluationMode,
    timeDisclosure: run.timeDisclosure,
    recommendation: run.recommendation,
    engineRoute,
    arbitration: {
      winner: run.arbitrationCurrent.winner?.lane ?? null,
      score: run.arbitrationCurrent.winner?.score ?? null,
      confidence: run.arbitrationCurrent.confidence,
      margin: run.arbitrationCurrent.margin,
      experimentalWinner: run.arbitrationExperimental.winner?.lane ?? null,
      objective: run.arbitrationCurrent.objectiveUsed,
    },
    arc: run.arbitrationCurrent.winner?.arcQuality ?? null,
    explanation: run.explanation
      ? {
          routeWhy: run.explanation.routeWhy,
          narrativeArcSummary: run.explanation.narrativeArcSummary,
          timeSummary: run.explanation.timeSummary,
          limitations: run.explanation.limitations,
          experiences: run.explanation.experiences,
        }
      : null,
    compositionSteps: run.arbitrationCurrent.winner?.candidate.compositionSteps ?? [],
    candidates: run.composition.candidates.map((c) => ({
      lane: c.lane,
      stgoIds: c.stgoIds,
      experienceIds: c.experienceIds,
      totalEstimatedMin: c.totalEstimatedMin,
      phase: c.arcState.phase,
      fingerprint: c.fingerprint,
    })),
    traceStages: run.trace.events.map((e) => ({ order: e.order, stage: e.stage, decision: e.decision })),
    eligibleCount: run.composition.eligibleExperienceIds.length,
    excludedCount: run.composition.excludedCount,
    runFingerprint: run.runFingerprint,
    determinismKey: run.determinismKey,
  }
}

function main() {
  const demos = ALPHA_BENCHMARKS.map(buildDemo)

  const payload = {
    schemaVersion: 'feature-complete-alpha-lab.v0.2',
    status: 'NON_CANONICAL',
    frozenBaselineSha: FEATURE_COMPLETE_ALPHA_FREEZE_SHA,
    ENGINE_FEATURE_COMPLETE_ALPHA: true,
    ENGINE_FEATURE_COMPLETE_ALPHA_CANONICAL: false,
    founderComparisonEnabled: true,
    featureStatus: summarizeFeatureCompleteStatus(),
    benchmarks: ALPHA_BENCHMARKS.map((b) => ({ id: b.id, label: b.label, coverage: b.coverage })),
    demos,
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ChronoWalk — Feature-Complete Alpha Lab (NON-CANONICAL)</title>
<style>
:root{--ink:#1c1917;--muted:#78716c;--line:#e7e5e4;--bg:#fafaf9;--panel:#fff;--accent:#0f766e;--warn:#b45309;--human:#1d4ed8}
*{box-sizing:border-box}body{margin:0;font-family:"Source Serif 4",Georgia,serif;color:var(--ink);background:linear-gradient(180deg,#f5f5f4,#e7e5e4);font-size:15px}
.banner{background:#7f1d1d;color:#fff;padding:.75rem 1.25rem;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px}
.toolbar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin-bottom:.75rem;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px}
.toolbar button,.toolbar select{padding:.35rem .55rem;border:1px solid var(--line);border-radius:6px;background:#fff;cursor:pointer;font:inherit}
.toolbar button.primary{background:var(--accent);color:#fff;border-color:var(--accent)}
.wrap{max-width:1200px;margin:0 auto;padding:1rem 1.25rem 3rem}
h1{font-size:1.75rem;margin:.5rem 0}.sub{color:var(--muted);margin-bottom:1rem}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:1rem;margin:0 0 1rem}
h2{font-size:1.05rem;margin:0 0 .6rem;letter-spacing:.02em}
.steps{display:grid;gap:.35rem;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px}
.step{display:grid;grid-template-columns:2rem 1fr;gap:.5rem;padding:.45rem .5rem;border-bottom:1px solid var(--line)}
.step b{color:var(--accent)}
.mono{font-family:ui-monospace,monospace;font-size:12px;background:#f5f5f4;padding:.5rem;border-radius:4px;overflow:auto;white-space:pre-wrap}
.pill{display:inline-block;font-size:11px;padding:.15rem .4rem;border:1px solid var(--line);border-radius:999px;margin-right:.25rem;font-family:ui-sans-serif,system-ui,sans-serif}
.warn{color:var(--warn)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
@media(max-width:900px){.grid{grid-template-columns:1fr}}
.arc{display:flex;gap:.35rem;flex-wrap:wrap;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px}
.arc span{background:#ecfdf5;border:1px solid #99f6e4;padding:.25rem .45rem;border-radius:4px}
.side{border-left:3px solid var(--accent);padding-left:.5rem}
.side.human{border-color:var(--human)}
label.lbl{font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;color:var(--muted);display:block;margin:.35rem 0 .15rem}
textarea,input,select.inp{width:100%;font:inherit;padding:.35rem;border:1px solid var(--line);border-radius:6px}
textarea{min-height:72px;resize:vertical}
.diff-row{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:.35rem;margin-bottom:.35rem;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px}
.rubric{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.5rem;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px}
.hidden{display:none}
</style>
</head>
<body>
<div class="banner"><strong>NON-CANONICAL</strong> · Feature-Complete Alpha · frozen @ ${FEATURE_COMPLETE_ALPHA_FREEZE_SHA} · DO NOT MERGE<br/>
<small>TIME MODEL: LEGACY COMPATIBILITY · EXPERIENCE-TIME CALIBRATION PENDING · Founder ratings do not recompute engine</small></div>
<div class="wrap">
  <h1>Feature-Complete Alpha Lab</h1>
  <p class="sub"><code>?engine=FEATURE_COMPLETE_ALPHA</code> · <code>?mode=founder-comparison</code> · frozen engine snapshots B01–B12</p>
  <div class="toolbar">
    <label>Mode
      <select id="modeSel">
        <option value="pipeline">Pipeline view</option>
        <option value="founder-comparison">Founder comparison</option>
      </select>
    </label>
    <label>Benchmark
      <select id="bench"></select>
    </label>
    <button type="button" id="btnSave" class="primary">Save locally</button>
    <button type="button" id="btnExport">Export JSON</button>
    <button type="button" id="btnLoad">Load saved</button>
  </div>
  <div id="host"></div>
</div>
<script>
window.__ALPHA_LAB__ = ${JSON.stringify(payload)};
const data = window.__ALPHA_LAB__;
const LS_PREFIX = 'founder-benchmark-review:';
const CLASSIFICATIONS = ['DATA','EXPERIENCE_TIME','NARRATIVE_GRAPH','CONTENT_GAP','CALIBRATION','SEARCH','ARBITRATION','HUMAN_PREFERENCE','ENGINE_BETTER','UNKNOWN'];
const SEVERITIES = ['LOW','MEDIUM','HIGH','BLOCKER'];
const RUBRIC_KEYS = ['travelerFit','essentialCoverage','geographicFlow','narrativeArc','varietyRhythm','timeUse','opening','payoff','landing','sellable'];

const sel = document.getElementById('bench');
const modeSel = document.getElementById('modeSel');
data.demos.forEach(d => { const o=document.createElement('option'); o.value=d.id; o.textContent=d.id+' — '+d.label; sel.appendChild(o); });

function qp(name){ return new URLSearchParams(location.search).get(name); }
if (qp('engine')==='FEATURE_COMPLETE_ALPHA' && qp('mode')==='founder-comparison') modeSel.value='founder-comparison';

function parseHumanSeq(text){
  return text.split(/[\\n,→>]+/).map(s=>s.trim()).filter(Boolean).map(id=>({
    experienceId: id.includes('::')?id:(id+'::LEGACY_CORE'),
    assumedVisitMode:null,humanEstimatedTime:null,narrativeRole:null,inclusionReason:null,omissionNotes:null
  }));
}

function suggestDiffs(humanIds, engineIds){
  const out=[]; const max=Math.max(humanIds.length,engineIds.length);
  for(let i=0;i<max;i++){
    const h=humanIds[i]||null, e=engineIds[i]||null;
    if(h===e) continue;
    let cls='UNKNOWN';
    if(!h&&e) cls='HUMAN_PREFERENCE';
    else if(h&&!e) cls='SEARCH';
    else if(h&&e&&h.split('::')[0]===e.split('::')[0]) cls='EXPERIENCE_TIME';
    else cls='ARBITRATION';
    out.push({experienceId:h||e,position:i,humanChoice:h,engineChoice:e,classification:cls,severity:(!h||!e)?'MEDIUM':'LOW',founderNote:''});
  }
  const hSet=new Set(humanIds), eSet=new Set(engineIds);
  for(const id of hSet) if(!eSet.has(id)) out.push({experienceId:id,position:null,humanChoice:id,engineChoice:null,classification:'HUMAN_PREFERENCE',severity:'MEDIUM',founderNote:''});
  for(const id of eSet) if(!hSet.has(id)) out.push({experienceId:id,position:null,humanChoice:null,engineChoice:id,classification:'ENGINE_BETTER',severity:'LOW',founderNote:''});
  return out;
}

function collectReview(d){
  const humanText = document.getElementById('humanSeq').value;
  const humanRoute = { experienceSequence: parseHumanSeq(humanText) };
  const humanIds = humanRoute.experienceSequence.map(x=>x.experienceId);
  const engineIds = d.engineRoute.experienceSequence;
  let perDifference = suggestDiffs(humanIds, engineIds);
  const rows = document.querySelectorAll('.diff-row[data-idx]');
  rows.forEach(row=>{
    const idx = +row.dataset.idx;
    if(!perDifference[idx]) return;
    perDifference[idx].classification = row.querySelector('.cls').value;
    perDifference[idx].severity = row.querySelector('.sev').value;
    perDifference[idx].founderNote = row.querySelector('.note').value || null;
  });
  const routeRubric = {};
  RUBRIC_KEYS.forEach(k=>{
    const el = document.getElementById('rubric_'+k);
    routeRubric[k] = el && el.value!=='' ? Number(el.value) : null;
  });
  return {
    schemaVersion: 'founder-benchmark-review.v0.1',
    status: 'NON_CANONICAL',
    frozenBaselineSha: data.frozenBaselineSha,
    benchmarkId: d.id,
    travelerRequestFingerprint: d.travelerRequestFingerprint,
    recordedAtIso: new Date().toISOString(),
    humanRoute,
    engineRoute: d.engineRoute,
    perDifference,
    routeRubric,
    founderNotes: document.getElementById('founderNotes').value || null,
  };
}

function renderDiffs(d, saved){
  const humanText = document.getElementById('humanSeq').value;
  const humanIds = parseHumanSeq(humanText).map(x=>x.experienceId);
  const diffs = (saved&&saved.perDifference&&saved.perDifference.length)?saved.perDifference:suggestDiffs(humanIds, d.engineRoute.experienceSequence);
  const host = document.getElementById('diffHost');
  host.innerHTML = diffs.map((diff,i)=>\`
    <div class="diff-row" data-idx="\${i}">
      <div class="mono">\${diff.position??'—'} H:\${diff.humanChoice||'—'}<br/>E:\${diff.engineChoice||'—'}</div>
      <select class="cls inp">\${CLASSIFICATIONS.map(c=>\`<option \${diff.classification===c?'selected':''}>\${c}</option>\`).join('')}</select>
      <select class="sev inp">\${SEVERITIES.map(s=>\`<option \${diff.severity===s?'selected':''}>\${s}</option>\`).join('')}</select>
      <input class="note inp" placeholder="founder note" value="\${(diff.founderNote||'').replace(/"/g,'&quot;')}"/>
    </div>\`).join('');
}

function renderPipeline(d){
  const stages = [
    ['1','WHO IS THIS TRAVELER?', d.id+' · '+d.label],
    ['2','WHAT IS POSSIBLE?', 'Eligible: '+d.eligibleCount+' · Excluded: '+d.excludedCount],
    ['3','WHAT EXPERIENCES MATTER?', 'Legacy adapter · V0.2 scoring'],
    ['4','WHAT DOES THE STORY NEED NEXT?', 'ArcState budget-fraction phases'],
    ['5','WHICH ROUTES WERE BUILT?', (d.candidates||[]).map(c=>c.lane+': '+c.stgoIds.join('→')).join(' | ')],
    ['6','HOW GOOD IS EACH ARC?', 'ArcQualityVNext='+(d.arc&&d.arc.normalizedScore)],
    ['7','WHY DID THIS ROUTE WIN?', (d.arbitration&&d.arbitration.winner)+' · '+d.arbitration.confidence],
    ['8','WHAT WOULD THE TRAVELER SEE?', (d.explanation&&d.explanation.routeWhy||[]).join(' · ')],
  ];
  const steps = (d.compositionSteps||[]).map(s=>'<div class="step"><b>'+s.stepIndex+'</b><div><div>'+s.phase+' · '+Math.round(100*s.budgetConsumedFrac)+'% · <code>'+s.chosenExperienceId+'</code></div></div></div>').join('');
  document.getElementById('host').innerHTML = \`
  <div class="panel"><h2>Frozen disclosures</h2><span class="pill">\${d.timeEvaluationMode}</span><span class="pill">fp \${d.runFingerprint}</span>
    <div class="warn">\${(d.timeDisclosure||[]).join(' · ')}</div>
    <div class="mono">route: \${(d.recommendation&&d.recommendation.stgoIds||[]).join(' → ')} · ~\${Math.round(d.recommendation&&d.recommendation.totalEstimatedMin)} min</div></div>
  <div class="panel"><h2>Pipeline</h2><div class="steps">\${stages.map(([n,t,v])=>'<div class="step"><b>'+n+'</b><div><strong>'+t+'</strong><div class="mono">'+v+'</div></div></div>').join('')}</div></div>
  <div class="grid"><div class="panel"><h2>Live composition</h2>\${steps||'—'}</div>
  <div class="panel"><h2>Narrative arc</h2><div class="arc"><span>OPEN</span><span>DEVELOP</span><span>REVEAL</span><span>LAND</span></div>
  <div class="mono">\${JSON.stringify(d.arc&&d.arc.arcStateSummary,null,2)}</div></div></div>\`;
}

function renderFounder(d, saved){
  const eng = d.engineRoute;
  const engSeq = eng.experienceSequence.join('\\n');
  const humanDefault = saved && saved.humanRoute ? saved.humanRoute.experienceSequence.map(e=>e.experienceId).join('\\n') : '';
  document.getElementById('host').innerHTML = \`
  <div class="grid">
    <div class="panel side"><h2>Engine route (frozen)</h2>
      <div class="mono">run fp: \${eng.runFingerprint}\\ncandidate fp: \${eng.arbitrationResult.candidateFingerprint}\\nbaseline: \${eng.frozenBaselineSha}</div>
      <label class="lbl">Experience sequence</label><div class="mono">\${engSeq}</div>
      <label class="lbl">STGO IDs</label><div class="mono">\${eng.stgoIds.join(' → ')}</div>
      <label class="lbl">Estimated time</label><div class="mono">\${eng.estimatedTime} min</div>
      <label class="lbl">Arbitration</label><div class="mono">\${JSON.stringify(eng.arbitrationResult,null,2)}</div>
      <label class="lbl">Arc summary</label><div class="mono">\${JSON.stringify(eng.arcSummary,null,2)}</div>
    </div>
    <div class="panel side human"><h2>Human route (founder)</h2>
      <label class="lbl">Experience IDs / STGO IDs (one per line)</label>
      <textarea id="humanSeq" placeholder="STGO_01\\nSTGO_03::LEGACY_CORE">\${humanDefault}</textarea>
      <label class="lbl">Founder notes</label>
      <textarea id="founderNotes" placeholder="Overall calibration notes">\${saved&&saved.founderNotes||''}</textarea>
      <button type="button" id="btnRefreshDiff" style="margin-top:.5rem">Refresh differences</button>
    </div>
  </div>
  <div class="panel"><h2>Per-difference classification</h2>
    <div class="diff-row" style="font-weight:600"><div>Choices</div><div>Classification</div><div>Severity</div><div>Note</div></div>
    <div id="diffHost"></div>
  </div>
  <div class="panel"><h2>Route rubric (1–5, does not affect engine)</h2>
    <div class="rubric">\${RUBRIC_KEYS.map(k=>\`<label class="lbl">\${k}<input class="inp" id="rubric_\${k}" type="number" min="1" max="5" step="1" value="\${saved&&saved.routeRubric&&saved.routeRubric[k]!=null?saved.routeRubric[k]:''}"/></label>\`).join('')}</div>
  </div>\`;
  document.getElementById('humanSeq').addEventListener('input', ()=>renderDiffs(d));
  document.getElementById('btnRefreshDiff').onclick = ()=>renderDiffs(d);
  renderDiffs(d, saved);
}

function loadSaved(id){
  try { const raw = localStorage.getItem(LS_PREFIX+id); return raw?JSON.parse(raw):null; } catch(e){ return null; }
}

function render(){
  const d = data.demos.find(x=>x.id===sel.value)||data.demos[0];
  const saved = loadSaved(d.id);
  if(modeSel.value==='founder-comparison') renderFounder(d, saved);
  else renderPipeline(d);
}

sel.onchange = render;
modeSel.onchange = ()=>{
  const u = new URL(location.href);
  u.searchParams.set('engine','FEATURE_COMPLETE_ALPHA');
  if(modeSel.value==='founder-comparison') u.searchParams.set('mode','founder-comparison');
  else u.searchParams.delete('mode');
  history.replaceState({},'',u);
  render();
};
document.getElementById('btnSave').onclick = ()=>{
  const d = data.demos.find(x=>x.id===sel.value);
  localStorage.setItem(LS_PREFIX+d.id, JSON.stringify(collectReview(d)));
  alert('Saved locally for '+d.id);
};
document.getElementById('btnLoad').onclick = ()=>{ render(); alert('Loaded from local storage if present'); };
document.getElementById('btnExport').onclick = ()=>{
  const d = data.demos.find(x=>x.id===sel.value);
  const doc = collectReview(d);
  const blob = new Blob([JSON.stringify(doc,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = d.id+'_founder_benchmark_review.json';
  a.click();
};
render();
</script>
</body>
</html>`

  mkdirSync(resolve(ROOT, 'docs/engine'), { recursive: true })
  writeFileSync(OUT, html, 'utf8')
  writeFileSync(
    resolve(ROOT, 'src/data/santiago/qa/gate_2e6_feature_complete_alpha_lab.v0.1.json'),
    JSON.stringify(payload, null, 2) + '\n',
  )
  console.log(
    JSON.stringify(
      {
        ok: true,
        html: 'docs/engine/gate-2e6-feature-complete-alpha-lab.html',
        demos: demos.length,
        frozenBaselineSha: FEATURE_COMPLETE_ALPHA_FREEZE_SHA,
        b02RunFingerprint: demos.find((d) => d.id === 'B02_ORIGINS_COLONIAL')?.runFingerprint,
      },
      null,
      2,
    ),
  )
}

main()
