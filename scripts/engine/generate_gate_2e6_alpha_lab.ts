#!/usr/bin/env npx tsx
/**
 * Gate 2E.6 — generate Feature-Complete Alpha Route Lab panel (NON-CANONICAL).
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runFeatureCompleteAlpha } from '../../src/engine/vnext/pipeline/run-feature-complete-alpha'
import { ALPHA_BENCHMARKS, getBenchmark } from '../../src/engine/vnext/benchmarks/alpha-benchmarks'
import { summarizeFeatureCompleteStatus } from '../../src/engine/vnext/status/engine-feature-status'

const ROOT = resolve(__dirname, '../..')
const OUT = resolve(ROOT, 'docs/engine/gate-2e6-feature-complete-alpha-lab.html')

function main() {
  const demos = ['B01_FIRST_TIMER_BALANCED', 'B02_ORIGINS_COLONIAL', 'B12_EXPRESS_45']
    .map((id) => getBenchmark(id)!)
    .map((b) => {
      const run = runFeatureCompleteAlpha(b.request, { root: ROOT })
      return {
        id: b.id,
        label: b.label,
        coverage: b.coverage,
        coverageNote: b.coverageNote,
        timeEvaluationMode: run.timeEvaluationMode,
        timeDisclosure: run.timeDisclosure,
        recommendation: run.recommendation,
        arbitration: {
          winner: run.arbitrationCurrent.winner?.lane ?? null,
          score: run.arbitrationCurrent.winner?.score ?? null,
          confidence: run.arbitrationCurrent.confidence,
          margin: run.arbitrationCurrent.margin,
          experimentalWinner: run.arbitrationExperimental.winner?.lane ?? null,
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
          totalEstimatedMin: c.totalEstimatedMin,
          phase: c.arcState.phase,
          fingerprint: c.fingerprint,
        })),
        traceStages: run.trace.events.map((e) => ({ order: e.order, stage: e.stage, decision: e.decision })),
        eligibleCount: run.composition.eligibleExperienceIds.length,
        excludedCount: run.composition.excludedCount,
        runFingerprint: run.runFingerprint,
      }
    })

  const payload = {
    schemaVersion: 'feature-complete-alpha-lab.v0.1',
    status: 'NON_CANONICAL',
    ENGINE_FEATURE_COMPLETE_ALPHA: true,
    ENGINE_FEATURE_COMPLETE_ALPHA_CANONICAL: false,
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
:root{--ink:#1c1917;--muted:#78716c;--line:#e7e5e4;--bg:#fafaf9;--panel:#fff;--accent:#0f766e;--warn:#b45309}
*{box-sizing:border-box}body{margin:0;font-family:"Source Serif 4",Georgia,serif;color:var(--ink);background:linear-gradient(180deg,#f5f5f4,#e7e5e4);font-size:15px}
.banner{background:#7f1d1d;color:#fff;padding:.75rem 1.25rem;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px}
.wrap{max-width:1100px;margin:0 auto;padding:1rem 1.25rem 3rem}
h1{font-size:1.75rem;margin:.5rem 0}.sub{color:var(--muted);margin-bottom:1rem}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:1rem;margin:0 0 1rem}
h2{font-size:1.05rem;margin:0 0 .6rem;letter-spacing:.02em}
.steps{display:grid;gap:.35rem;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px}
.step{display:grid;grid-template-columns:2rem 1fr;gap:.5rem;padding:.45rem .5rem;border-bottom:1px solid var(--line)}
.step b{color:var(--accent)}
.mono{font-family:ui-monospace,monospace;font-size:12px;background:#f5f5f4;padding:.5rem;border-radius:4px;overflow:auto}
.pill{display:inline-block;font-size:11px;padding:.15rem .4rem;border:1px solid var(--line);border-radius:999px;margin-right:.25rem;font-family:ui-sans-serif,system-ui,sans-serif}
.warn{color:var(--warn)}
select{font:inherit;padding:.35rem .5rem;margin-bottom:.75rem}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
@media(max-width:800px){.grid{grid-template-columns:1fr}}
.arc{display:flex;gap:.35rem;flex-wrap:wrap;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px}
.arc span{background:#ecfdf5;border:1px solid #99f6e4;padding:.25rem .45rem;border-radius:4px}
</style>
</head>
<body>
<div class="banner"><strong>NON-CANONICAL</strong> · Gate 2E.6 Feature-Complete Alpha · DO NOT MERGE · Production routing disabled<br/>
<small>TIME MODEL: LEGACY COMPATIBILITY · EXPERIENCE-TIME CALIBRATION PENDING · LEGACY_EXPERIENCE_ADAPTER=true</small></div>
<div class="wrap">
  <h1>Feature-Complete Alpha Lab</h1>
  <p class="sub">Pipeline view for <code>?engine=FEATURE_COMPLETE_ALPHA</code>. Values are model outputs — not generated commentary.</p>
  <label class="pill">Benchmark</label>
  <select id="bench"></select>
  <div id="host"></div>
</div>
<script>
window.__ALPHA_LAB__ = ${JSON.stringify(payload)};
const data = window.__ALPHA_LAB__;
const sel = document.getElementById('bench');
data.demos.forEach(d => { const o=document.createElement('option'); o.value=d.id; o.textContent=d.id+' — '+d.label; sel.appendChild(o); });
function render(id){
  const d = data.demos.find(x => x.id === id) || data.demos[0];
  const stages = [
    ['1','WHO IS THIS TRAVELER?', d.id+' · '+d.label],
    ['2','WHAT IS POSSIBLE?', 'Eligible experiences: '+d.eligibleCount+' · Excluded: '+d.excludedCount],
    ['3','WHAT EXPERIENCES MATTER?', 'Legacy adapter Experiences · TM/IW/RoleFit via V0.2'],
    ['4','WHAT DOES THE STORY NEED NEXT?', 'ArcState phase progression (budget-fraction)'],
    ['5','WHICH ROUTES WERE BUILT?', (d.candidates||[]).map(c=>c.lane+': '+c.stgoIds.join('→')).join(' | ')],
    ['6','HOW GOOD IS EACH ARC?', 'Winner ArcQualityVNext='+(d.arc&&d.arc.normalizedScore)],
    ['7','WHY DID THIS ROUTE WIN?', (d.arbitration&&d.arbitration.winner)+' · conf '+(d.arbitration&&d.arbitration.confidence)+' · margin '+(d.arbitration&&d.arbitration.margin)],
    ['8','WHAT WOULD THE TRAVELER SEE?', (d.explanation&&d.explanation.routeWhy||[]).join(' · ')],
  ];
  const steps = (d.compositionSteps||[]).map(s =>
    '<div class="step"><b>'+s.stepIndex+'</b><div><div>'+s.phase+' · budget '+(100*s.budgetConsumedFrac).toFixed(0)+'% · chose <code>'+s.chosenExperienceId+'</code></div>'+
    '<div class="mono">opts: '+(s.candidatesConsidered||[]).slice(0,4).map(c=>c.experienceId+' base='+c.baseValue+' iav='+c.incrementalArcValue).join(' · ')+'</div></div></div>'
  ).join('');
  document.getElementById('host').innerHTML = \`
  <div class="panel"><h2>Disclosures</h2>
    <span class="pill">\${d.timeEvaluationMode}</span>
    <div class="warn">\${(d.timeDisclosure||[]).join(' · ')}</div>
    <div class="mono">route: \${(d.recommendation&&d.recommendation.stgoIds||[]).join(' → ')} · ~\${d.recommendation&&Math.round(d.recommendation.totalEstimatedMin)} min · fp \${d.runFingerprint}</div>
  </div>
  <div class="panel"><h2>Pipeline</h2><div class="steps">\${stages.map(([n,t,v])=>'<div class="step"><b>'+n+'</b><div><div><strong>'+t+'</strong></div><div class="mono">'+v+'</div></div></div>').join('')}</div></div>
  <div class="grid">
    <div class="panel"><h2>Live composition</h2>\${steps||'<div class="muted">No expansion steps</div>'}</div>
    <div class="panel"><h2>Narrative arc</h2>
      <div class="arc"><span>OPEN / ORIENT</span><span>DEVELOP / CONNECT</span><span>DEEPEN / REVEAL</span><span>LAND / RESOLVE</span></div>
      <div class="mono">\${JSON.stringify(d.arc&&d.arc.arcStateSummary,null,2)}</div>
      <div class="mono">\${(d.explanation&&d.explanation.narrativeArcSummary||[]).join('\\n')}</div>
    </div>
  </div>
  <div class="panel"><h2>Trace stages</h2><div class="mono">\${(d.traceStages||[]).map(e=>e.order+'. '+e.stage+' — '+e.decision).join('\\n')}</div></div>
  <div class="panel"><h2>Explanation</h2><div class="mono">\${JSON.stringify(d.explanation,null,2)}</div></div>\`;
}
sel.onchange = () => render(sel.value);
render(sel.value);
</script>
</body>
</html>`

  mkdirSync(resolve(ROOT, 'docs/engine'), { recursive: true })
  writeFileSync(OUT, html, 'utf8')
  writeFileSync(
    resolve(ROOT, 'src/data/santiago/qa/gate_2e6_feature_complete_alpha_lab.v0.1.json'),
    JSON.stringify(payload, null, 2) + '\n',
  )
  console.log(JSON.stringify({ ok: true, html: 'docs/engine/gate-2e6-feature-complete-alpha-lab.html', demos: demos.length }, null, 2))
}

main()
