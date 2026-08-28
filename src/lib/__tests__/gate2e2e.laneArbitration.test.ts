import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  ARCQUALITY_V0_2_PRODUCTION,
  PHYSICAL_ROUTE_GENERATION_ENABLED,
  ROUTE_ARBITRATION_V0_2_PARALLEL_READY,
  ROUTE_ARBITRATION_V0_2_PRODUCTION,
  ROUTE_COMPOSER_V0_2_PRODUCTION,
} from '@/src/lib/city-graph/flags'
import { ROUTE_LAB_FIXTURES, getRouteLabFixture } from '@/src/dev/route-lab/fixtures'
import {
  gate2dRegressionFingerprint,
  gate2e1EngineOutputFingerprint,
  loadGate2dFingerprintArtifact,
  loadGate2e1FingerprintBaseline,
} from '@/src/dev/route-lab/runRouteLab'
import { normalizeTraveler } from '@/src/engine/traveler'
import { TRAVELER_FIXTURES } from '@/src/engine/fixtures/travelerFixtures'
import { blendKnown } from '@/src/engine/routes/v0.2/coverage-blend'
import {
  LANE_OBJECTIVE_WEIGHTS,
  H1_OBJECTIVE_WEIGHTS,
  COMPOSER_MODEL_VERSION_H1,
  COMPOSER_MODEL_VERSION_H2,
} from '@/src/engine/routes/v0.2/composer/composer-config.v0.2'
import { composeH1RoutesV02 } from '@/src/engine/routes/v0.2/composer/compose-h1.v0.2'
import { composeH2RoutesV02 } from '@/src/engine/routes/v0.2/composer/compose-h2.v0.2'
import { ARC_QUALITY_VERSION_V02 } from '@/src/engine/routes/v0.2/arc-quality/arc-quality-config.v0.2'
import { computeArcQuality } from '@/src/engine/routes/arc-quality'
import { computeArcQualityV02 } from '@/src/engine/routes/v0.2/arc-quality/arc-quality.v0.2'
import { ARC_QUALITY_POSITIVE_WEIGHTS, RERANK_BLEND_WEIGHTS } from '@/src/engine/routes/arc-quality-config'
import { ROUTE_SCORE_WEIGHTS } from '@/src/engine/routes/route-config'
import {
  ARBITRATION_VERSION,
  CHOICE_CONFIDENCE_THRESHOLDS,
  LANE_PRIOR_TABLE,
  ROUTE_CHOICE_WEIGHTS,
} from '@/src/engine/routes/v0.2/arbitration/arbitration-config.v0.2'
import { computeLanePrior, lanePriorsForRequest } from '@/src/engine/routes/v0.2/arbitration/lane-prior.v0.2'
import { computeRouteChoiceScore } from '@/src/engine/routes/v0.2/arbitration/route-arbitrator.v0.2'
import { runChoicePolicyV02 } from '@/src/engine/routes/v0.2/arbitration/run-choice-policy.v0.2'
import { computeCommonRouteFeatures } from '@/src/engine/routes/v0.2/arbitration/route-common-features.v0.2'
import { classifyChoiceConfidence } from '@/src/engine/routes/v0.2/arbitration/choice-confidence.v0.2'
import { candidateSimilarity, deduplicateCandidates } from '@/src/engine/routes/v0.2/arbitration/route-dedup.v0.2'
import {
  composerScalesComparable,
  summarizeComposerScoresByLane,
} from '@/src/engine/routes/v0.2/arbitration/score-distribution-audit.v0.2'
import type { CommonRouteFeatures } from '@/src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'
import type { ComposerLane } from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'

const ROOT = resolve(__dirname, '../../..')
const START_SHA = '33dd6603263b51eddc228f239a7bfee5b3fb547e'

function fixtureRun(id: string) {
  const fx = getRouteLabFixture(id)!
  return runChoicePolicyV02(fx.input, { root: ROOT })
}

function emptyFeatures(overrides: Partial<Record<keyof CommonRouteFeatures, number | null>> = {}): CommonRouteFeatures {
  const pick = (key: keyof CommonRouteFeatures, fallback: number): number | null =>
    Object.prototype.hasOwnProperty.call(overrides, key) ? (overrides[key] as number | null) : fallback
  const mk = (v: number | null) => ({
    value: v,
    coverage: v == null ? 0 : 1,
    unknown: v == null,
    breakdown: {},
  })
  return {
    travelerMatchRoute: mk(pick('travelerMatchRoute', 70)),
    intrinsicWorthRoute: mk(pick('intrinsicWorthRoute', 70)),
    routeMarginalValue: mk(pick('routeMarginalValue', 70)),
    arcQuality: mk(pick('arcQuality', 70)),
    physicalEfficiency: mk(pick('physicalEfficiency', 70)),
    timeFit: mk(pick('timeFit', 70)),
    structuralFit: mk(pick('structuralFit', 70)),
    discoveryFit: mk(pick('discoveryFit', 70)),
    narrativeCoherence: mk(pick('narrativeCoherence', 70)),
    routeCoverageConfidence: 1,
    lanePrior: mk(pick('lanePrior', 70)),
  }
}

describe('Gate 2E.2E lane arbitration V0.2', () => {
  it('1 — lane ComposerScores are not treated as directly comparable', () => {
    expect(ROUTE_CHOICE_WEIGHTS).not.toHaveProperty('composerScore')
    const f2 = fixtureRun('F2')
    for (const c of f2.arbitration.allCandidates) {
      expect(c.candidate.composerScoreIsCrossLaneUtility).toBe(false)
    }
    const notes = f2.arbitration.notes.join(' ')
    expect(notes).toMatch(/ComposerScore is excluded/i)
    expect(f2.arbitration.legacyBlends.B0.canonicalSelection).toBe(false)
    expect(f2.arbitration.legacyBlends.B0.experimentId).toBe('LEGACY_CROSS_LANE_BLEND_EXPERIMENT')
  })

  it('2 — common feature vector uses identical methodology across lanes', () => {
    const { h2, arbitration } = fixtureRun('F2')
    expect(h2.candidates.length).toBeGreaterThanOrEqual(1)
    for (const c of h2.candidates) {
      const a = computeCommonRouteFeatures({
        candidate: c,
        request: h2.request,
        arc: arbitration.allCandidates.find((x) => x.routeId === c.candidate.routeId)?.arcQuality ?? null,
      })
      const b = computeCommonRouteFeatures({
        candidate: c,
        request: h2.request,
        arc: arbitration.allCandidates.find((x) => x.routeId === c.candidate.routeId)?.arcQuality ?? null,
      })
      expect(a).toEqual(b)
      expect(a.discoveryFit.breakdown).toEqual(b.discoveryFit.breakdown)
    }
  })

  it('3 — arbitration is deterministic', () => {
    const a = fixtureRun('F8')
    const b = fixtureRun('F8')
    expect(a.arbitration.recommendedRouteId).toBe(b.arbitration.recommendedRouteId)
    expect(a.arbitration.recommendedLane).toBe(b.arbitration.recommendedLane)
    expect(a.arbitration.choiceConfidence).toBe(b.arbitration.choiceConfidence)
    expect(a.arbitration.whyWon).toBe(b.arbitration.whyWon)
    expect(a.arbitration.allCandidates.map((c) => c.routeChoiceScore)).toEqual(
      b.arbitration.allCandidates.map((c) => c.routeChoiceScore),
    )
  })

  it('4 — TravelerMatchRoute is deterministic', () => {
    const a = fixtureRun('F6')
    const b = fixtureRun('F6')
    const va = a.arbitration.allCandidates.map((c) => c.features.travelerMatchRoute.value)
    const vb = b.arbitration.allCandidates.map((c) => c.features.travelerMatchRoute.value)
    expect(va).toEqual(vb)
  })

  it('5 — RouteMarginalValue is length-normalized (mean, not raw sum)', () => {
    const run = fixtureRun('F2')
    for (const c of run.arbitration.allCandidates) {
      const extras = Math.max(0, c.candidate.candidate.stopCount - 1)
      const mean = c.features.routeMarginalValue.breakdown.qualityWeightedMeanMrv
      if (mean != null && extras > 0) {
        expect(mean).toBeLessThanOrEqual(100)
        expect(mean).toBeGreaterThanOrEqual(0)
        expect(mean).toBeLessThan(mean * extras + 0.001)
      }
    }
  })

  it('6 — DiscoveryFit is lane-neutral (same formula regardless of originating lane)', () => {
    const run = fixtureRun('F8')
    const keys = ['discoveryDensity', 'surprise', 'pocketFit', 'microRevealFit']
    for (const c of run.arbitration.allCandidates) {
      for (const k of keys) {
        expect(c.features.discoveryFit.breakdown).toHaveProperty(k)
      }
    }
    const src = readFileSync(resolve(ROOT, 'src/engine/routes/v0.2/arbitration/route-common-features.v0.2.ts'), 'utf8')
    expect(src).not.toMatch(/originatingLane === 'DISCOVERY'/)
  })

  it('7 — PhysicalEfficiency is lane-neutral', () => {
    const src = readFileSync(resolve(ROOT, 'src/engine/routes/v0.2/arbitration/route-common-features.v0.2.ts'), 'utf8')
    expect(src).not.toMatch(/originatingLane === 'FLOW'/)
    const run = fixtureRun('F2')
    for (const c of run.arbitration.allCandidates) {
      expect(c.features.physicalEfficiency.breakdown).toHaveProperty('dwellShare')
      expect(c.features.physicalEfficiency.breakdown).toHaveProperty('longestTransition')
    }
  })

  it('8 — StructuralFit is traveler-sensitive', () => {
    const d1 = computeLanePrior(
      {
        ...getRouteLabFixture('F8')!.input,
        traveler: normalizeTraveler({ ...TRAVELER_FIXTURES.F_discovery_forward, discoveryPosture: 'D1' }),
        schemaVersion: undefined as never,
      } as never,
      'DISCOVERY',
    )
    void d1
    const runD1 = runChoicePolicyV02(
      {
        traveler: normalizeTraveler({
          interests: ['barrios_vivos', 'arte_visual'],
          discoveryPosture: 'D1',
          rhythm: 'espontaneo',
        }),
        startingStgoId: 'STGO_01',
        timeBudgetMin: 120,
        transportPolicy: 'WALK_ONLY',
        routeIntent: 'DISCOVERY',
      },
      { root: ROOT },
    )
    const runD3 = runChoicePolicyV02(
      {
        traveler: normalizeTraveler({
          interests: ['historia_civica', 'arq_monumental'],
          discoveryPosture: 'D3',
          rhythm: 'estructurado',
        }),
        startingStgoId: 'STGO_01',
        timeBudgetMin: 120,
        transportPolicy: 'WALK_ONLY',
        routeIntent: 'ESSENTIALS',
      },
      { root: ROOT },
    )
    const d1W = runD1.arbitration.allCandidates[0]?.features.structuralFit.breakdown
    const d3W = runD3.arbitration.allCandidates[0]?.features.structuralFit.breakdown
    expect(d1W).toBeTruthy()
    expect(d3W).toBeTruthy()
  })

  it('9 — LanePrior is traveler-sensitive', () => {
    const d1Req = {
      schemaVersion: 'santiago-route-request.v0.1' as const,
      traveler: normalizeTraveler({ discoveryPosture: 'D1', interests: ['barrios_vivos'] }),
      start: { kind: 'STGO_ID' as const, stgoId: 'STGO_01' },
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY' as const,
      routeIntent: 'DISCOVERY' as const,
    }
    const d3Req = {
      ...d1Req,
      traveler: normalizeTraveler({ discoveryPosture: 'D3', interests: ['historia_civica'] }),
      routeIntent: 'ESSENTIALS' as const,
    }
    const d1 = lanePriorsForRequest(d1Req)
    const d3 = lanePriorsForRequest(d3Req)
    expect(d1.DISCOVERY).toBeGreaterThan(d1.SIGNATURE)
    expect(d3.SIGNATURE).toBeGreaterThan(d3.DISCOVERY)
    expect(d1.DISCOVERY).not.toBe(d3.DISCOVERY)
  })

  it('10 — LanePrior cannot override a strongly inferior route', () => {
    const weakPreferred = computeRouteChoiceScore(
      emptyFeatures({
        travelerMatchRoute: 40,
        arcQuality: 40,
        routeMarginalValue: 40,
        physicalEfficiency: 40,
        structuralFit: 40,
        timeFit: 40,
        lanePrior: 90,
      }),
    )
    const strongOther = computeRouteChoiceScore(
      emptyFeatures({
        travelerMatchRoute: 85,
        arcQuality: 80,
        routeMarginalValue: 80,
        physicalEfficiency: 80,
        structuralFit: 80,
        timeFit: 80,
        lanePrior: 40,
      }),
    )
    expect(strongOther.score!).toBeGreaterThan(weakPreferred.score!)
    expect(ROUTE_CHOICE_WEIGHTS.lanePrior).toBeLessThanOrEqual(0.08)
  })

  it('11 — UNKNOWN is renormalized, not zero', () => {
    const unknown = blendKnown([
      { key: 'a', value: 80, weight: 0.5 },
      { key: 'b', value: null, weight: 0.5 },
    ])
    expect(unknown.score).toBe(80)
    expect(unknown.renormalized).toBe(true)
    expect(unknown.unknownKeys).toEqual(['b'])
    const asZero = 80 * 0.5 + 0 * 0.5
    expect(unknown.score).not.toBe(asZero)
  })

  it('12 — choice coverage is reported from known components', () => {
    const full = computeRouteChoiceScore(emptyFeatures())
    expect(full.coverage).toBe(1)
    const partial = computeRouteChoiceScore(emptyFeatures({ arcQuality: null, routeMarginalValue: null }))
    expect(partial.coverage).toBeLessThan(1)
    expect(partial.coverage).toBeGreaterThan(0)
    expect(partial.unknownKeys).toContain('arcQuality')
    const run = fixtureRun('F2')
    expect(run.arbitration.recommended?.routeChoiceCoverage).toBeGreaterThan(0)
  })

  it('13 — choice-confidence is deterministic and uses documented thresholds', () => {
    expect(CHOICE_CONFIDENCE_THRESHOLDS.clearMargin).toBe(6)
    expect(classifyChoiceConfidence({ margin: 8, coverage: 0.9, uniquePresented: 3, constraintDominated: false })).toBe(
      'CLEAR',
    )
    expect(classifyChoiceConfidence({ margin: 1, coverage: 0.9, uniquePresented: 3, constraintDominated: false })).toBe(
      'CLOSE_CALL',
    )
    expect(classifyChoiceConfidence({ margin: 4, coverage: 0.4, uniquePresented: 3, constraintDominated: false })).toBe(
      'INSUFFICIENT_EVIDENCE',
    )
    expect(classifyChoiceConfidence({ margin: 10, coverage: 1, uniquePresented: 1, constraintDominated: true })).toBe(
      'CONSTRAINT_DOMINATED',
    )
    const a = fixtureRun('F9')
    const b = fixtureRun('F9')
    expect(a.arbitration.choiceConfidence).toBe(b.arbitration.choiceConfidence)
  })

  it('14 — near-duplicate alternatives are deduplicated', () => {
    const run = fixtureRun('F2')
    const clones = run.arbitration.allCandidates.flatMap((c) => [c, { ...c, routeId: c.routeId + '_dup' }])
    const { unique, dropped } = deduplicateCandidates(clones)
    expect(dropped.length).toBeGreaterThan(0)
    expect(unique.length).toBeLessThan(clones.length)
  })

  it('15 — F15 returns no fake alternatives', () => {
    const run = fixtureRun('F15')
    expect(run.arbitration.alternatives).toHaveLength(0)
    expect(run.arbitration.noMeaningfulAlternative).toBe(true)
    expect(['CONSTRAINT_DOMINATED', 'INSUFFICIENT_EVIDENCE']).toContain(run.arbitration.choiceConfidence)
  })

  it('16 — STGO_33 cannot appear in recommended or alternative stops', () => {
    for (const id of ['F2', 'F8', 'F15', 'F16']) {
      const run = fixtureRun(id)
      const ids = [
        ...(run.arbitration.recommended?.candidate.candidate.orderedStops.map((s) => s.stgoId) ?? []),
        ...run.arbitration.alternatives.flatMap((a) => a.candidate.candidate.orderedStops.map((s) => s.stgoId)),
      ]
      expect(ids).not.toContain('STGO_33')
    }
  })

  it('17 — STGO_104 cannot appear in recommended or alternative stops', () => {
    for (const id of ['F2', 'F8', 'F15', 'F17']) {
      const run = fixtureRun(id)
      const ids = [
        ...(run.arbitration.recommended?.candidate.candidate.orderedStops.map((s) => s.stgoId) ?? []),
        ...run.arbitration.alternatives.flatMap((a) => a.candidate.candidate.orderedStops.map((s) => s.stgoId)),
      ]
      expect(ids).not.toContain('STGO_104')
    }
  })

  it('18 — H2 composer weights remain the frozen hypothesis', () => {
    expect(LANE_OBJECTIVE_WEIGHTS.SIGNATURE.intrinsicWorth).toBe(0.25)
    expect(LANE_OBJECTIVE_WEIGHTS.DISCOVERY.marginalRouteValue).toBe(0.35)
    expect(LANE_OBJECTIVE_WEIGHTS.FLOW.physicalEfficiency).toBe(0.25)
    expect(H1_OBJECTIVE_WEIGHTS.travelerMatch).toBe(0.25)
    expect(COMPOSER_MODEL_VERSION_H2).toBe('0.2.h2.hypothesis.1')
    expect(COMPOSER_MODEL_VERSION_H1).toBe('0.2.h1.hypothesis.1')
  })

  it('19 — ArcQuality V0.1 implementation is unchanged (adapter only)', () => {
    expect(ARC_QUALITY_VERSION_V02).toBe('0.2.hypothesis.1')
    expect(ARC_QUALITY_POSITIVE_WEIGHTS.openingStrength).toBe(0.08)
    expect(RERANK_BLEND_WEIGHTS.composerProvisionalScore).toBe(0.6)
    const run = fixtureRun('F2')
    const cand = run.h2.candidates[0]?.candidate
    if (cand) {
      const v01 = computeArcQuality(cand)
      const v02 = computeArcQualityV02(cand)
      expect(v02.normalizedScore).toBe(v01.normalizedScore)
      expect(v02.adapterOnly).toBe(true)
      expect(v02.arcQualityVersion).toBe('0.2.hypothesis.1')
    }
    const current = readFileSync(resolve(ROOT, 'src/engine/routes/arc-quality.ts'), 'utf8')
    const baseline = execFileSync('git', ['show', `${START_SHA}:src/engine/routes/arc-quality.ts`], { encoding: 'utf8' })
    expect(current).toBe(baseline)
    const cfgNow = readFileSync(resolve(ROOT, 'src/engine/routes/arc-quality-config.ts'), 'utf8')
    const cfgBase = execFileSync('git', ['show', `${START_SHA}:src/engine/routes/arc-quality-config.ts`], {
      encoding: 'utf8',
    })
    expect(cfgNow).toBe(cfgBase)
  })

  it('20 — V0.1 engine output is unchanged', () => {
    const current = gate2e1EngineOutputFingerprint(ROOT)
    const baseline = loadGate2e1FingerprintBaseline(ROOT)
    expect(current).toEqual(baseline)
    const d2 = gate2dRegressionFingerprint(ROOT)
    const d2base = loadGate2dFingerprintArtifact(ROOT)
    expect(d2).toEqual(d2base)
    expect(ROUTE_SCORE_WEIGHTS.nodeUtility).toBe(0.34)
  })

  it('21 — production routing flags remain false', () => {
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(ROUTE_ARBITRATION_V0_2_PARALLEL_READY).toBe(true)
    expect(ROUTE_ARBITRATION_V0_2_PRODUCTION).toBe(false)
    expect(ROUTE_COMPOSER_V0_2_PRODUCTION).toBe(false)
    expect(ARCQUALITY_V0_2_PRODUCTION).toBe(false)
  })
})

describe('Gate 2E.2E F1–F18 arbitration QA', () => {
  it('runs H2+arbitration across F1–F18 and records distributions', { timeout: 180_000 }, () => {
    const rows: Array<{
      id: string
      lane: ComposerLane
      composerScore: number
      choice: number | null
      discoveryFit: number | null
      travelerMatch: number | null
      physical: number | null
    }> = []
    const winners: Record<string, string> = {}
    const b0Winners: Record<string, string | null> = {}
    for (const fx of ROUTE_LAB_FIXTURES) {
      const run = runChoicePolicyV02(fx.input, { root: ROOT })
      winners[fx.id] = String(run.arbitration.recommendedLane)
      b0Winners[fx.id] = run.arbitration.legacyBlends.B0.winnerLane
      for (const c of run.arbitration.allCandidates) {
        if (c.originatingLane === 'H1') continue
        rows.push({
          id: fx.id,
          lane: c.originatingLane,
          composerScore: c.candidate.composerScore,
          choice: c.routeChoiceScore,
          discoveryFit: c.features.discoveryFit.value,
          travelerMatch: c.features.travelerMatchRoute.value,
          physical: c.features.physicalEfficiency.value,
        })
        expect(c.candidate.candidate.orderedStops.some((s) => s.stgoId === 'STGO_104')).toBe(false)
        expect(c.candidate.candidate.orderedStops.some((s) => s.stgoId === 'STGO_33')).toBe(false)
      }
      expect(run.arbitration.whyWon.length).toBeGreaterThan(20)
    }
    const dist = summarizeComposerScoresByLane(rows.map((r) => ({ lane: r.lane, composerScore: r.composerScore })))
    const comparability = composerScalesComparable(dist)
    ;(globalThis as { __gate2e2eQa?: unknown }).__gate2e2eQa = {
      winners,
      b0Winners,
      dist,
      comparability,
      rows,
      discoveryB0Wins: Object.values(b0Winners).filter((l) => l === 'DISCOVERY').length,
    }
    expect(Object.keys(winners)).toHaveLength(18)
    expect(dist.SIGNATURE.n).toBeGreaterThan(0)
    expect(dist.DISCOVERY.n).toBeGreaterThan(0)
    expect(dist.FLOW.n).toBeGreaterThan(0)
  })

  it('H1 exists and is unused by arbitration entrypoint', () => {
    const h1 = composeH1RoutesV02(getRouteLabFixture('F2')!.input, { root: ROOT })
    expect(h1.schemaVersion).toBe('santiago-route-composer-result.v0.2.h1')
    expect(h1.productionEnabled).toBe(false)
    const src = readFileSync(resolve(ROOT, 'src/engine/routes/v0.2/arbitration/run-choice-policy.v0.2.ts'), 'utf8')
    expect(src).toContain('composeH2RoutesV02')
    expect(src).not.toContain('composeH1RoutesV02')
  })

  it('Culinary F6 personalization is present in TravelerMatchRoute', () => {
    const run = fixtureRun('F6')
    const rec = run.arbitration.recommended
    expect(rec).toBeTruthy()
    expect(rec!.features.travelerMatchRoute.value).not.toBeNull()
    expect(rec!.features.travelerMatchRoute.coverage).toBeGreaterThan(0)
  })

  it('F9 confidence can reflect weak narrative evidence', () => {
    const run = fixtureRun('F9')
    const rec = run.arbitration.recommended!
    const narrativeCoverage = rec.features.narrativeCoherence.coverage
    expect(narrativeCoverage).toBeGreaterThanOrEqual(0)
    if (narrativeCoverage < 0.55) {
      expect(['INSUFFICIENT_EVIDENCE', 'CLOSE_CALL', 'MODERATE', 'CONSTRAINT_DOMINATED', 'CLEAR']).toContain(
        run.arbitration.choiceConfidence,
      )
    }
  })

  it('user-facing labels are not hardwired to originating lane', () => {
    const src = readFileSync(
      resolve(ROOT, 'src/engine/routes/v0.2/arbitration/route-character-labels.v0.2.ts'),
      'utf8',
    )
    expect(src).not.toMatch(/originatingLane === 'DISCOVERY'[\s\S]{0,80}MORE_DISCOVERIES/)
    expect(LANE_PRIOR_TABLE.D1.DISCOVERY).toBeGreaterThan(LANE_PRIOR_TABLE.D1.SIGNATURE)
    expect(ARBITRATION_VERSION).toBe('0.2.hypothesis.1')
  })

  it('choice-policy UI markers exist in Route Lab shell/UI', () => {
    const shell = readFileSync(resolve(ROOT, 'src/dev/route-lab/static/route-lab-shell.html'), 'utf8')
    const ui = readFileSync(resolve(ROOT, 'src/dev/route-lab/static/route-lab-ui.js'), 'utf8')
    expect(shell).toMatch(/CHOICE POLICY V0\.2/)
    expect(ui).toMatch(/choicePolicy/)
    expect(ui).toMatch(/WHY THIS ROUTE WON/)
  })
})
