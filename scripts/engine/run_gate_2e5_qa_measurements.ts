#!/usr/bin/env npx tsx
/**
 * Gate 2E.5-QA — measurement audits (NON-CANONICAL branch).
 * Diagnostics only: no production weight changes.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ROUTE_LAB_FIXTURES } from '../../src/dev/route-lab/fixtures'
import { loadLaunchNodes } from '../../src/engine/loadSantiagoNodes'
import { evaluateNodeEligibility } from '../../src/engine/eligibility/evaluateNodeEligibility'
import { evaluateNodeScoreV02 } from '../../src/engine/scoring/v0.2/evaluate-node-v02'
import { normalizeRouteRequest } from '../../src/engine/routes/route-request'
import { runChoicePolicyV02 } from '../../src/engine/routes/v0.2/arbitration/run-choice-policy.v0.2'
import { computeRouteChoiceScore } from '../../src/engine/routes/v0.2/arbitration/route-arbitrator.v0.2'
import { ROUTE_CHOICE_WEIGHTS } from '../../src/engine/routes/v0.2/arbitration/arbitration-config.v0.2'
import { blendKnown } from '../../src/engine/routes/v0.2/coverage-blend'
import { tryComputeArcQualityV02 } from '../../src/engine/routes/v0.2/arc-quality/arc-quality.v0.2'
import { computePhysicalEfficiencyVnext } from '../../src/engine/scoring/v0.2/physical-efficiency-vnext'
import { computeArcQualityVnextFromExisting } from '../../src/engine/routes/v0.2/arc-quality/vnext'
import { ROUTE_SEARCH_CONFIG } from '../../src/engine/routes/route-config'
import { pearson, round3, summarize } from '../../src/engine/qa/gate-2e5/stats'
import { POSTURE_TOUCHPOINT_COUNT, POSTURE_TOUCHPOINTS_V0_1 } from '../../src/engine/qa/gate-2e5/posture-touchpoints'
import type { CommonRouteFeatures } from '../../src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'
import type { ComposerLane } from '../../src/engine/routes/v0.2/composer/composer-types.v0.2'

const ROOT = resolve(__dirname, '../..')
const OUT_DIR = resolve(ROOT, 'src/data/santiago/qa')
const DOC_DIR = resolve(ROOT, 'docs/engine/reports')

const FEATURE_KEYS = [
  'travelerMatchRoute',
  'intrinsicWorthRoute',
  'routeMarginalValue',
  'arcQuality',
  'physicalEfficiency',
  'timeFit',
  'structuralFit',
  'discoveryFit',
  'narrativeCoherence',
] as const

type FeatureKey = (typeof FEATURE_KEYS)[number]

function featureValue(f: CommonRouteFeatures, key: FeatureKey): number | null {
  return f[key].value
}

/** Dominance on comparable known features: A dominates B if A >= B on all known shared dims and > on at least one. */
function dominates(
  a: CommonRouteFeatures,
  b: CommonRouteFeatures,
): boolean {
  let anyStrict = false
  let compared = 0
  for (const key of FEATURE_KEYS) {
    const av = featureValue(a, key)
    const bv = featureValue(b, key)
    if (av == null || bv == null) continue
    compared++
    if (av < bv - 1e-9) return false
    if (av > bv + 1e-9) anyStrict = true
  }
  return compared >= 3 && anyStrict
}

function choiceWithoutLanePrior(features: CommonRouteFeatures): {
  score: number | null
  coverage: number
} {
  const w = ROUTE_CHOICE_WEIGHTS
  const rest =
    w.travelerMatchRoute +
    w.arcQuality +
    w.routeMarginalValue +
    w.physicalEfficiency +
    w.structuralFit +
    w.timeFit
  const scale = 1 / rest
  const blended = blendKnown([
    { key: 'travelerMatchRoute', value: features.travelerMatchRoute.value, weight: w.travelerMatchRoute * scale },
    { key: 'arcQuality', value: features.arcQuality.value, weight: w.arcQuality * scale },
    { key: 'routeMarginalValue', value: features.routeMarginalValue.value, weight: w.routeMarginalValue * scale },
    { key: 'physicalEfficiency', value: features.physicalEfficiency.value, weight: w.physicalEfficiency * scale },
    { key: 'structuralFit', value: features.structuralFit.value, weight: w.structuralFit * scale },
    { key: 'timeFit', value: features.timeFit.value, weight: w.timeFit * scale },
  ])
  return { score: blended.score, coverage: blended.coverage }
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(DOC_DIR, { recursive: true })

  const launch = loadLaunchNodes(ROOT)
  const tmRows: unknown[] = []
  const discoveryRows: unknown[] = []
  const peValues: number[] = []
  const peVnextValues: number[] = []
  const arcComponentSeries: Record<string, number[]> = {}
  const lanePriorAblation: unknown[] = []
  const featurePool: Array<{ fixture: string; lane: ComposerLane; features: CommonRouteFeatures }> = []

  let discoveryDominated = 0
  let discoveryNonDominated = 0
  let discoveryDominatesOther = 0
  let discoveryInsufficient = 0

  for (const fx of ROUTE_LAB_FIXTURES) {
    const request = normalizeRouteRequest(fx.input)
    const traveler = request.traveler

    // --- TravelerMatch distribution across eligible Launch30 ---
    const tmScores: number[] = []
    const thematic: number[] = []
    const discovery: number[] = []
    const familiarity: number[] = []
    const structural: number[] = []
    const context: number[] = []

    for (const node of launch) {
      const elig = evaluateNodeEligibility(node, traveler, { launchCorpusOnly: true })
      if (!elig.eligible) continue
      const bundle = evaluateNodeScoreV02({
        stgoId: node.stgoId,
        displayName: node.displayName ?? node.stgoId,
        traveler,
        routeIntent: request.routeIntent,
      }, ROOT)
      const tm = bundle?.travelerMatch
      if (!tm || tm.score == null) continue
      tmScores.push(tm.score)
      if (tm.components.thematicAffinity != null) thematic.push(tm.components.thematicAffinity)
      if (tm.components.discoveryPostureAffinity != null) discovery.push(tm.components.discoveryPostureAffinity)
      if (tm.components.familiarityAffinity != null) familiarity.push(tm.components.familiarityAffinity)
      if (tm.components.structuralPreference != null) structural.push(tm.components.structuralPreference)
      if (tm.components.contextAffinity != null) context.push(tm.components.contextAffinity)
    }

    const tmDist = summarize(tmScores)
    const run = runChoicePolicyV02(fx.input, { root: ROOT })
    const rec = run.arbitration.allCandidates.find((c) => c.routeId === run.arbitration.recommendedRouteId)
    const selectedTm = rec?.features.travelerMatchRoute.value ?? null

    tmRows.push({
      fixture: fx.id,
      travelerFingerprint: {
        discoveryPosture: traveler.discoveryPosture ?? null,
        routeIntent: request.routeIntent,
        themes: traveler.themeWeights,
        expressPreference: traveler.expressPreference ?? false,
        stepFreeRequired: traveler.stepFreeRequired ?? false,
      },
      posture: traveler.discoveryPosture ?? null,
      profile: fx.label ?? fx.id,
      themeVectorSummary: Object.entries(traveler.themeWeights)
        .filter(([, v]) => (v ?? 0) > 0)
        .map(([k, v]) => `${k}:${v}`)
        .join(','),
      tm: tmDist,
      components: {
        thematicAffinity: summarize(thematic),
        discoveryPostureAffinity: summarize(discovery),
        familiarityAffinity: summarize(familiarity),
        structuralPreference: summarize(structural),
        contextAffinity: summarize(context),
      },
      selectedRouteTravelerMatchRoute: selectedTm,
      corpusMaxTm: tmDist.max,
      maxTmBelow60: (tmDist.max ?? 0) < 60,
      selectedMuchBelowCorpusMax:
        selectedTm != null && tmDist.max != null ? tmDist.max - selectedTm >= 15 : false,
      diagnosis:
        (tmDist.max ?? 0) < 60
          ? 'LOW_CORPUS_CEILING_OR_SCALE_COMPRESSION'
          : selectedTm != null && tmDist.max != null && tmDist.max - selectedTm >= 15
            ? 'DOWNSTREAM_ROUTE_SELECTION_GAP'
            : 'OK_OR_MODERATE',
    })

    // --- Discovery Pareto + PE + Arc components + LanePrior ablation ---
    const byLane = new Map<ComposerLane, (typeof run.arbitration.allCandidates)[0]>()
    for (const c of run.arbitration.allCandidates) {
      if (c.originatingLane === 'H1') continue
      byLane.set(c.originatingLane, c)
      featurePool.push({ fixture: fx.id, lane: c.originatingLane, features: c.features })
      const pe = c.features.physicalEfficiency.value
      if (pe != null) peValues.push(pe)

      const cand = c.candidate.candidate
      const transitions = cand.orderedStops.map((s) => s.transitionTimeMin).filter((t) => t > 0)
      const geoVals = c.candidate.stopScores.slice(1).map((s) => {
        const v = s.bundle.marginalRouteValue?.components.geographicProgression
        return v == null ? null : v
      })
      const geoKnown = geoVals.filter((v): v is number => v != null)
      const geoMean = geoKnown.length ? geoKnown.reduce((a, b) => a + b, 0) / geoKnown.length : null
      const peV = computePhysicalEfficiencyVnext({
        dwellMin: cand.dwellMin,
        totalEstimatedMin: cand.totalEstimatedMin,
        transitionTimesMin: transitions,
        maxWalkChunkMin: ROUTE_SEARCH_CONFIG.maxWalkChunkMin,
        backtrackingPenalty01: c.arcQuality?.penalties.backtrackingPenalty ?? null,
        geographicProgression01Mean: geoMean,
        metroTransferCount: cand.metroUse.transferCount,
      })
      peVnextValues.push(peV.score)

      if (c.arcQuality) {
        for (const [k, v] of Object.entries(c.arcQuality.components)) {
          if (typeof v === 'number' && Number.isFinite(v)) {
            ;(arcComponentSeries[k] ??= []).push(v)
          }
        }
        // shadow Vnext compute (not cut over)
        computeArcQualityVnextFromExisting(c.arcQuality)
      }
    }

    const disc = byLane.get('DISCOVERY')
    const sig = byLane.get('SIGNATURE')
    const flow = byLane.get('FLOW')
    let paretoClass: string = 'INSUFFICIENT_EVIDENCE'
    if (!disc) {
      discoveryInsufficient++
      paretoClass = 'INSUFFICIENT_EVIDENCE'
    } else {
      const others = [sig, flow].filter(Boolean) as NonNullable<typeof disc>[]
      const knownCount = FEATURE_KEYS.filter((k) => featureValue(disc.features, k) != null).length
      if (knownCount < 3 || others.length === 0) {
        discoveryInsufficient++
        paretoClass = 'INSUFFICIENT_EVIDENCE'
      } else {
        const dominatedByOther = others.some((o) => dominates(o.features, disc.features))
        const dominatesAny = others.some((o) => dominates(disc.features, o.features))
        if (dominatedByOther) {
          discoveryDominated++
          paretoClass = 'PARETO_DOMINATED'
        } else if (dominatesAny) {
          discoveryDominatesOther++
          paretoClass = 'DOMINATES_OTHER'
        } else {
          discoveryNonDominated++
          paretoClass = 'NON_DOMINATED'
        }
      }
    }

    const stronger: string[] = []
    const weaker: string[] = []
    if (disc && sig) {
      for (const key of FEATURE_KEYS) {
        const d = featureValue(disc.features, key)
        const s = featureValue(sig.features, key)
        if (d == null || s == null) continue
        if (d > s + 1e-6) stronger.push(key)
        if (d < s - 1e-6) weaker.push(key)
      }
    }

    discoveryRows.push({
      fixture: fx.id,
      paretoClass,
      discoveryChoice: disc?.routeChoiceScore ?? null,
      signatureChoice: sig?.routeChoiceScore ?? null,
      flowChoice: flow?.routeChoiceScore ?? null,
      strongerThanSignature: stronger,
      weakerThanSignature: weaker,
      features: disc
        ? Object.fromEntries(FEATURE_KEYS.map((k) => [k, featureValue(disc.features, k)]))
        : null,
    })

    // LanePrior ablation (diagnostic only)
    const scored = run.arbitration.allCandidates
      .filter((c) => c.originatingLane !== 'H1')
      .map((c) => {
        const asIs = c.routeChoiceScore
        const ablated = choiceWithoutLanePrior(c.features)
        return { lane: c.originatingLane, asIs, ablated: ablated.score, coverage: c.routeChoiceCoverage }
      })
      .filter((r) => r.asIs != null && r.ablated != null)
      .sort((a, b) => (b.asIs! - a.asIs!))

    const scoredAblated = [...scored].sort((a, b) => (b.ablated! - a.ablated!))
    const beforeWinner = scored[0]
    const afterWinner = scoredAblated[0]
    const beforeMargin =
      scored.length >= 2 && beforeWinner?.asIs != null && scored[1]?.asIs != null
        ? beforeWinner.asIs - scored[1].asIs
        : null
    const afterMargin =
      scoredAblated.length >= 2 && afterWinner?.ablated != null && scoredAblated[1]?.ablated != null
        ? afterWinner.ablated - scoredAblated[1].ablated
        : null

    lanePriorAblation.push({
      fixture: fx.id,
      winnerBefore: beforeWinner?.lane ?? null,
      winnerAfter: afterWinner?.lane ?? null,
      changed: beforeWinner?.lane !== afterWinner?.lane,
      scoreMarginBefore: beforeMargin,
      scoreMarginAfter: afterMargin,
      confidenceBefore: run.arbitration.choiceConfidence,
      closeCallBefore: run.arbitration.choiceConfidence === 'CLOSE_CALL',
    })
  }

  // Arc correlation matrix
  const keys = Object.keys(arcComponentSeries).sort()
  const corr: Record<string, Record<string, number | null>> = {}
  const highCorr: Array<{ a: string; b: string; rho: number }> = []
  for (const a of keys) {
    corr[a] = {}
    for (const b of keys) {
      const xs = arcComponentSeries[a]!
      const ys = arcComponentSeries[b]!
      const n = Math.min(xs.length, ys.length)
      const rho = pearson(xs.slice(0, n), ys.slice(0, n))
      corr[a]![b] = round3(rho)
      if (a < b && rho != null && Math.abs(rho) > 0.8) {
        highCorr.push({ a, b, rho })
      }
    }
  }

  const peSummary = summarize(peValues)
  const peVnextSummary = summarize(peVnextValues)
  const ablationChanges = (lanePriorAblation as Array<{ changed: boolean }>).filter((r) => r.changed).length

  const maxTmBelow60 = (tmRows as Array<{ fixture: string; maxTmBelow60: boolean }>)
    .filter((r) => r.maxTmBelow60)
    .map((r) => r.fixture)

  const featureObservedRanges: Record<string, ReturnType<typeof summarize>> = {}
  for (const key of [
    ...FEATURE_KEYS,
    'lanePrior',
    'intrinsicWorthRoute',
    'routeCoverageConfidence',
  ] as const) {
    const vals: number[] = []
    for (const row of featurePool) {
      if (key === 'lanePrior') {
        const v = row.features.lanePrior.value
        if (v != null) vals.push(v)
      } else if (key === 'routeCoverageConfidence') {
        // coverage is on individual features; use mean of known feature coverages as proxy
        const covs = FEATURE_KEYS.map((k) => row.features[k].coverage).filter((c) => Number.isFinite(c))
        if (covs.length) vals.push(covs.reduce((a, b) => a + b, 0) / covs.length)
      } else if (key in row.features) {
        const v = featureValue(row.features, key as FeatureKey)
        if (v != null) vals.push(v)
      }
    }
    featureObservedRanges[key] = summarize(vals)
  }

  const payload = {
    gate: '2E.5-QA',
    status: 'NON_CANONICAL',
    branch: 'cursor/gate-2e5-qa-measurement-d85a',
    featureObservedRanges,
    travelerMatch: tmRows,
    discoveryPareto: {
      rows: discoveryRows,
      dominated: discoveryDominated,
      nonDominated: discoveryNonDominated,
      dominatesOther: discoveryDominatesOther,
      insufficientEvidence: discoveryInsufficient,
      implication:
        discoveryDominated >= 14
          ? 'Discovery often Pareto-dominated on common features → 0/18 may be feature/objective design, not only generator'
          : discoveryNonDominated + discoveryDominatesOther >= 8
            ? 'Many Discovery candidates non-dominated → 0/18 more likely arbitration objective (missing DiscoveryFit weight / LanePrior)'
            : 'MIXED — see per-fixture rows',
    },
    lanePriorAblation: {
      rows: lanePriorAblation,
      winnerChanges: ablationChanges,
      note: 'Diagnostic only — LanePrior NOT deleted',
    },
    physicalEfficiency: {
      currentObserved: peSummary,
      formulaNote:
        'Current PE uses clamp01 on component terms then blendKnown; observed range should be ~[0,100] if clamps hold. Vnext is explicit bounded parallel.',
      unboundedBelowRejected: peSummary.negativeCount === 0,
      vnextObserved: peVnextSummary,
      vnextStatus: 'PARALLEL_ONLY_NOT_IN_ARBITRATION',
    },
    arcCorrelation: {
      matrix: corr,
      highAbsRho: highCorr,
      timeUtilizationVsTimeFitNote:
        'timeUtilization lives in ArcQuality positives while TimeFit is a separate RouteChoiceScore term — duplication risk confirmed architecturally; Arc Vnext removes timeUtilization weight.',
      arcVnextStatus: 'ARC_QUALITY_VNEXT_PARALLEL',
    },
    postureTouchpoints: {
      count: POSTURE_TOUCHPOINT_COUNT,
      paths: POSTURE_TOUCHPOINTS_V0_1,
    },
  }

  writeFileSync(resolve(OUT_DIR, 'gate_2e5_qa_measurements.v0.1.json'), JSON.stringify(payload, null, 2) + '\n')

  // CSV TM summary
  const csv = [
    'fixture,tm_min,tm_p10,tm_median,tm_mean,tm_p90,tm_max,tm_std,max_below_60,selected_tm_route,diagnosis',
    ...(tmRows as Array<any>).map(
      (r) =>
        [
          r.fixture,
          r.tm.min,
          r.tm.p10,
          r.tm.median,
          r.tm.mean,
          r.tm.p90,
          r.tm.max,
          r.tm.std,
          r.maxTmBelow60,
          r.selectedRouteTravelerMatchRoute,
          r.diagnosis,
        ].join(','),
    ),
  ].join('\n')
  writeFileSync(resolve(OUT_DIR, 'traveler_match_distribution_f1_f18.v0.1.csv'), csv + '\n')

  // Markdown reports
  writeFileSync(
    resolve(DOC_DIR, 'TRAVELER_MATCH_DISTRIBUTION_AUDIT_V0_1.md'),
    `# TravelerMatch Distribution Audit V0.1

**Gate:** 2E.5-QA · **Status:** NON-CANONICAL · **Formula unchanged**

## Summary

Fixtures with max TM < 60: ${maxTmBelow60.join(', ') || '(none)'}

Machine-readable: \`src/data/santiago/qa/gate_2e5_qa_measurements.v0.1.json\` and \`traveler_match_distribution_f1_f18.v0.1.csv\`

## Per-fixture TM

| Fixture | min | median | mean | max | std | selected TM route | diagnosis |
|---|---:|---:|---:|---:|---:|---:|---|
${(tmRows as Array<any>)
  .map(
    (r) =>
      `| ${r.fixture} | ${fmt(r.tm.min)} | ${fmt(r.tm.median)} | ${fmt(r.tm.mean)} | ${fmt(r.tm.max)} | ${fmt(r.tm.std)} | ${fmt(r.selectedRouteTravelerMatchRoute)} | ${r.diagnosis} |`,
  )
  .join('\n')}

## Component notes

TravelerMatch = coverage-aware blend of:

- ThematicMatch (0.50)
- DiscoveryMatch / discoveryPostureAffinity (0.20)
- FamiliarityMatch (0.10)
- StructuralMatch (0.10)
- ContextMatch (0.10)

Low TM may come from thematic scale compression, weak corpus fit, UNKNOWN coverage, or downstream route selection — see \`diagnosis\` column. **No formula change in this gate.**
`,
  )

  writeFileSync(
    resolve(DOC_DIR, 'DISCOVERY_PARETO_AUDIT_V0_1.md'),
    `# Discovery Pareto Audit V0.1

**Gate:** 2E.5-QA · **Status:** NON-CANONICAL · **RouteChoiceScore unchanged**

## Counts

| Class | N |
|---|---:|
| PARETO_DOMINATED | ${discoveryDominated} |
| NON_DOMINATED | ${discoveryNonDominated} |
| DOMINATES_OTHER | ${discoveryDominatesOther} |
| INSUFFICIENT_EVIDENCE | ${discoveryInsufficient} |

## Implication for 0/18 Discovery winners

${payload.discoveryPareto.implication}

Dominance rule: over comparable known features among TravelerMatchRoute, IntrinsicWorthRoute, RouteMarginalValue, ArcQuality, PhysicalEfficiency, TimeFit, StructuralFit, DiscoveryFit, NarrativeCoherence — A dominates B if A ≥ B on all compared known dims and > on ≥1, with ≥3 comparable dims.

## Per-fixture

| Fixture | class | stronger vs SIGNATURE | weaker vs SIGNATURE |
|---|---|---|---|
${(discoveryRows as Array<any>)
  .map(
    (r) =>
      `| ${r.fixture} | ${r.paretoClass} | ${(r.strongerThanSignature || []).join(', ') || '—'} | ${(r.weakerThanSignature || []).join(', ') || '—'} |`,
  )
  .join('\n')}
`,
  )

  writeFileSync(
    resolve(ROOT, 'docs/engine/POSTURE_TOUCHPOINT_AUDIT_V0_1.md'),
    `# Posture Touchpoint Audit V0.1

**Gate:** 2E.5-QA · **Do NOT consolidate posture yet**

## Touchpoint count

**${POSTURE_TOUCHPOINT_COUNT}**

## Code paths

| ID | Path | Function | Affects | Formula / multiplier | Purpose |
|---|---|---|---|---|---|
${POSTURE_TOUCHPOINTS_V0_1.map(
  (t) =>
    `| ${t.id} | \`${t.path}\` | \`${t.functionName}\` | ${t.affects} | ${t.formulaOrMultiplier} | ${t.behavioralPurpose} |`,
).join('\n')}
`,
  )

  writeFileSync(
    resolve(DOC_DIR, 'LANEPRIOR_ABLATION_DIAGNOSTIC_V0_1.md'),
    `# LanePrior Ablation — Diagnostic Only

**Gate:** 2E.5-QA · **LanePrior NOT deleted**

Winner changes when LanePrior contribution = 0 (weights renormalized): **${ablationChanges} / ${ROUTE_LAB_FIXTURES.length}**

| Fixture | before | after | changed | margin before | margin after | confidence | CLOSE_CALL? |
|---|---|---|---|---:|---:|---|---|
${(lanePriorAblation as Array<any>)
  .map(
    (r) =>
      `| ${r.fixture} | ${r.winnerBefore} | ${r.winnerAfter} | ${r.changed} | ${fmt(r.scoreMarginBefore)} | ${fmt(r.scoreMarginAfter)} | ${r.confidenceBefore} | ${r.closeCallBefore} |`,
  )
  .join('\n')}
`,
  )

  writeFileSync(
    resolve(DOC_DIR, 'PHYSICAL_EFFICIENCY_AUDIT_V0_1.md'),
    `# PhysicalEfficiency Correctness Audit V0.1

## Current formula

See \`computePhysicalEfficiency\` in \`route-common-features.v0.2.ts\`:
component terms use \`clamp01(...)*100\` then \`blendKnown\`. Metro burden also clamp01-based.

## Observed (F1–F18 candidates)

| stat | current | vnext parallel |
|---|---:|---:|
| n | ${peSummary.n} | ${peVnextSummary.n} |
| min | ${fmt(peSummary.min)} | ${fmt(peVnextSummary.min)} |
| max | ${fmt(peSummary.max)} | ${fmt(peVnextSummary.max)} |
| mean | ${fmt(peSummary.mean)} | ${fmt(peVnextSummary.mean)} |
| std | ${fmt(peSummary.std)} | ${fmt(peVnextSummary.std)} |
| negative | ${peSummary.negativeCount} | ${peVnextSummary.negativeCount} |
| >100 | ${peSummary.above100Count} | ${peVnextSummary.above100Count} |

**Unbounded below?** ${peSummary.negativeCount === 0 ? 'Not observed; clamps appear to keep outputs ≥ 0.' : 'YES — negatives observed.'}

**Vnext:** \`src/engine/scoring/v0.2/physical-efficiency-vnext/\` — bounded [0,100], PARALLEL ONLY, not in arbitration.
`,
  )

  writeFileSync(
    resolve(DOC_DIR, 'ARCQUALITY_CORRELATION_AUDIT_V0_1.md'),
    `# ArcQuality Double-Count / Correlation Audit V0.1

## High |ρ| > 0.80

${highCorr.length ? highCorr.map((h) => `- ${h.a} ↔ ${h.b}: ρ=${h.rho.toFixed(3)}`).join('\n') : '(none above 0.80 in this corpus sample)'}

## Time utilization duplication

**Confirmed architecturally: Y** — \`timeUtilization\` is an ArcQuality positive component while \`TimeFit\` is a separate RouteChoiceScore feature. Parallel Arc Vnext removes timeUtilization from positives (renormalized). Frozen runtime ArcQuality unchanged.

Status: \`ARC_QUALITY_VNEXT_PARALLEL\`

Full matrix: see JSON \`arcCorrelation.matrix\`.
`,
  )

  console.log(
    JSON.stringify(
      {
        ok: true,
        tmFixtures: tmRows.length,
        discoveryDominated,
        discoveryNonDominated,
        lanePriorWinnerChanges: ablationChanges,
        peNegatives: peSummary.negativeCount,
        highCorr: highCorr.length,
        postureTouchpoints: POSTURE_TOUCHPOINT_COUNT,
      },
      null,
      2,
    ),
  )
}

function fmt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return (Math.round(n * 10) / 10).toFixed(1)
}

main()
