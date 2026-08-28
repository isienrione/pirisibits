import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadSemanticByStgoId } from '@/src/engine/loadCalibration'
import { normalizeTraveler } from '@/src/engine/traveler'
import { createEmptyArcState } from '@/src/engine/narrative/arc-state'
import { HUMAN_REVIEW_STORAGE_KEY } from '@/src/dev/route-lab/humanReview'
import {
  gate2dRegressionFingerprint,
  gate2e1EngineOutputFingerprint,
  loadGate2dFingerprintArtifact,
  loadGate2e1FingerprintBaseline,
} from '@/src/dev/route-lab/runRouteLab'
import { SCORING_MODEL_V0_2_PARALLEL_READY } from '@/src/lib/city-graph/flags'
import {
  computeIntrinsicWorth,
  computeIntrinsicWorthRaw,
  structuralInputs,
  buildIntrinsicWorthPercentiles,
  computeTravelerMatch,
  computeThematicAffinity,
  computeDiscoveryPostureAffinity,
  computeStructuralPreference,
  computeContextAffinity,
  computeRoleFit,
  computeBaseNodeValue,
  computeNewThemeValue,
  computeStructuralNovelty,
  computeDiscoveryValue,
  computeNarrativeProgression,
  computeQuestionPayoff,
  computeRoleNeedFit,
  computeRedundancy,
  computeGeographicProgression,
  computeMarginalRouteValue,
  computeTransitionValue,
  evaluateNodeScoreV02,
  buildTravelerMatchVariabilityReport,
  QA_PROFILES,
  type RouteStateContext,
  type NodeScoringContext,
} from '@/src/engine/scoring/v0.2'
import { editorialDimensionsByStgoId } from '@/src/engine/scoring/v0.2/editorial-dimensions'
import { INTRINSIC_WORTH_WEIGHTS } from '@/src/engine/scoring/v0.2/scoring-config'

const ROOT = resolve(__dirname, '../../..')

function baseCtx(stgoId: string, overrides: Partial<NodeScoringContext> = {}): NodeScoringContext {
  const semanticById = loadSemanticByStgoId(ROOT)
  const semantic = semanticById.get(stgoId)!
  return {
    stgoId,
    displayName: semantic.displayName ?? stgoId,
    traveler: normalizeTraveler({
      interests: ['historia_civica', 'arte_visual'],
      rhythm: 'equilibrado',
      timeBudgetMinutes: 120,
    }),
    routeIntent: 'BALANCED',
    familiarity: 'F1',
    ...overrides,
  }
}

function sampleRouteState(overrides: Partial<RouteStateContext> = {}): RouteStateContext {
  return {
    arcState: createEmptyArcState(),
    routeSoFarStgoIds: ['STGO_01'],
    routeThemes: ['T1A', 'T3'],
    anchorCount: 1,
    pocketCount: 0,
    microCount: 0,
    recentStgoIds: ['STGO_01'],
    routeIntent: 'BALANCED',
    prevStgoId: 'STGO_01',
    narrativeEdgeScore: 72,
    transitionDistanceM: 400,
    transitionDurationMin: 8,
    transitionFeasible: true,
    geographicEvidenceAvailable: true,
    bearingReversal: false,
    ...overrides,
  }
}

describe('Gate 2E.2A parallel scoring V0.2', () => {
  const semanticById = loadSemanticByStgoId(ROOT)
  const editorialById = editorialDimensionsByStgoId(ROOT)
  const allRecords = [...semanticById.values()]
  const launchIds = new Set(allRecords.filter((r) => r.launchCorpus).map((r) => r.stgoId))

  it('1 — IntrinsicWorth reproduces canonical formula', () => {
    const stgo01 = semanticById.get('STGO_01')!
    const inputs = structuralInputs(stgo01)
    const { raw, contributions } = computeIntrinsicWorthRaw(inputs)
    const expected =
      INTRINSIC_WORTH_WEIGHTS.heritageDepth * inputs.heritageDepth! * 100 +
      INTRINSIC_WORTH_WEIGHTS.anchorDensity * inputs.anchorDensity! * 100 +
      INTRINSIC_WORTH_WEIGHTS.microReveal * inputs.microReveal! * 100 +
      INTRINSIC_WORTH_WEIGHTS.polish * inputs.polish! * 100
    expect(raw).toBe(Math.round(expected * 10) / 10)
    expect(contributions.heritageDepth).toBe(Math.round(inputs.heritageDepth! * 35 * 10) / 10)
    expect(contributions.anchorDensity).toBe(Math.round(inputs.anchorDensity! * 30 * 10) / 10)
    const iw = computeIntrinsicWorth(stgo01, { allRecords, activeCorpusIds: launchIds })
    expect(iw.raw).toBe(raw)
    expect(iw.status).toBe('AVAILABLE')
    expect(iw.scoringModelVersion).toBe('0.2')
  })

  it('2 — UNKNOWN structural metrics → IntrinsicWorth UNAVAILABLE', () => {
    const stgo104 = semanticById.get('STGO_104')!
    const iw = computeIntrinsicWorth(stgo104, { allRecords, activeCorpusIds: launchIds })
    expect(iw.raw).toBeNull()
    expect(iw.status).toBe('UNAVAILABLE')
    expect(iw.explanation.status).toBe('UNAVAILABLE')
    expect(iw.explanation.plainLanguageExplanation).toContain('UNKNOWN')
  })

  it('3 — IntrinsicWorth percentile ranks are deterministic', () => {
    const stgo01 = semanticById.get('STGO_01')!
    const raw = computeIntrinsicWorth(stgo01, { allRecords, activeCorpusIds: launchIds }).raw
    const a = buildIntrinsicWorthPercentiles(allRecords, raw, launchIds)
    const b = buildIntrinsicWorthPercentiles(allRecords, raw, launchIds)
    expect(a.santiago).toBe(b.santiago)
    expect(a.activeCorpus).toBe(b.activeCorpus)
    expect(a.santiago).not.toBeNull()
  })

  it('4 — TravelerMatch is deterministic for fixed context', () => {
    const ctx = baseCtx('STGO_03')
    const a = evaluateNodeScoreV02(ctx, ROOT)!
    const b = evaluateNodeScoreV02(ctx, ROOT)!
    expect(a.travelerMatch.score).toBe(b.travelerMatch.score)
    expect(a.travelerMatch.components).toEqual(b.travelerMatch.components)
  })

  it('5 — thematic affinity responds to traveler theme weights', () => {
    const semantic = semanticById.get('STGO_01')!
    const civic = normalizeTraveler({ interests: ['historia_civica', 'arq_monumental'], rhythm: 'estructurado' })
    const culinary = normalizeTraveler({ interests: ['gastronomia'], rhythm: 'equilibrado' })
    const civicAff = computeThematicAffinity(civic, semantic)
    const foodAff = computeThematicAffinity(culinary, semantic)
    expect(civicAff.score).not.toBeNull()
    expect(foodAff.score).not.toBeNull()
    expect(civicAff.score!).not.toBe(foodAff.score!)
    expect(civicAff.matched.length).toBeGreaterThan(foodAff.matched.length)
  })

  it('6 — D1 discovery posture affinity uses flâneur dimension blend', () => {
    const semantic = semanticById.get('STGO_28')!
    const editorial = editorialById.get('STGO_28')
    const roleFit = computeRoleFit(semantic, editorial)
    const iw = computeIntrinsicWorth(semantic).raw
    const d1 = computeDiscoveryPostureAffinity('D1', editorial, roleFit, iw)
    expect(d1.score).not.toBeNull()
    expect(d1.coverage).toBeGreaterThan(0)
  })

  it('7 — D2 discovery posture affinity differs from D1', () => {
    const semantic = semanticById.get('STGO_28')!
    const editorial = editorialById.get('STGO_28')
    const roleFit = computeRoleFit(semantic, editorial)
    const iw = computeIntrinsicWorth(semantic).raw
    const d1 = computeDiscoveryPostureAffinity('D1', editorial, roleFit, iw)
    const d2 = computeDiscoveryPostureAffinity('D2', editorial, roleFit, iw)
    expect(d1.score).not.toBeNull()
    expect(d2.score).not.toBeNull()
    expect(d1.score).not.toBe(d2.score)
  })

  it('8 — D3 collector discovery posture affinity emphasizes essentiality/anchor', () => {
    const semantic = semanticById.get('STGO_01')!
    const editorial = editorialById.get('STGO_01')
    const roleFit = computeRoleFit(semantic, editorial)
    const iw = computeIntrinsicWorth(semantic).raw
    const d3 = computeDiscoveryPostureAffinity('D3', editorial, roleFit, iw)
    expect(d3.score).not.toBeNull()
    expect(roleFit.anchorFit).not.toBeNull()
    expect(d3.score!).toBeGreaterThan(50)
  })

  it('9 — M1 express traveler boosts structural preference and context affinity', () => {
    const semantic = semanticById.get('STGO_01')!
    const editorial = editorialById.get('STGO_01')
    const roleFit = computeRoleFit(semantic, editorial)
    const m1 = normalizeTraveler({
      interests: ['historia_civica'],
      rhythm: 'estructurado',
      expressPreference: true,
      mobilityArchetype: 'M1',
      timeBudgetMinutes: 45,
    })
    const balanced = normalizeTraveler({ interests: ['historia_civica'], rhythm: 'equilibrado', timeBudgetMinutes: 120 })
    const m1Struct = computeStructuralPreference(m1, roleFit, 'ESSENTIALS')
    const balStruct = computeStructuralPreference(balanced, roleFit, 'ESSENTIALS')
    expect(m1Struct.score!).toBeGreaterThan(balStruct.score!)
    const m1Ctx = computeContextAffinity(m1, semantic)
    expect(m1Ctx.score).not.toBeNull()
    expect(m1Ctx.score!).toBeGreaterThanOrEqual(50)
  })

  it('10 — RoleFit values are continuous in [0, 1]', () => {
    for (const id of ['STGO_01', 'STGO_28', 'STGO_33', 'STGO_92']) {
      const rf = computeRoleFit(semanticById.get(id)!, editorialById.get(id))
      for (const v of [rf.anchorFit, rf.pocketFit, rf.microRevealFit]) {
        if (v != null) {
          expect(v).toBeGreaterThanOrEqual(0)
          expect(v).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('11 — RoleFit propensities do not sum to 1', () => {
    const rf = computeRoleFit(semanticById.get('STGO_01')!, editorialById.get('STGO_01'))
    const sum = (rf.anchorFit ?? 0) + (rf.pocketFit ?? 0) + (rf.microRevealFit ?? 0)
    expect(sum).not.toBeCloseTo(1, 1)
  })

  it('12 — RoleFit identifies primary structural role for canonical anchor', () => {
    const rf = computeRoleFit(semanticById.get('STGO_01')!, editorialById.get('STGO_01'))
    expect(rf.primaryStructuralRole).toBe('anchor')
    expect(rf.anchorFit!).toBeGreaterThan(rf.pocketFit!)
    expect(rf.anchorFit!).toBeGreaterThan(rf.microRevealFit!)
  })

  it('13 — RoleFit detects ambiguity when top roles are within delta', () => {
    const ambiguous = computeRoleFit(
      {
        ...semanticById.get('STGO_28')!,
        tier: 'pocket',
        editorialRole: 'pocket',
      },
      editorialById.get('STGO_28'),
    )
    if (
      ambiguous.anchorFit != null &&
      ambiguous.pocketFit != null &&
      Math.abs(ambiguous.anchorFit - ambiguous.pocketFit) <= 0.12
    ) {
      expect(ambiguous.roleAmbiguity).toBe(true)
    } else {
      expect(typeof ambiguous.roleAmbiguity).toBe('boolean')
    }
  })

  it('14 — BaseNodeValue is deterministic', () => {
    const bundle = evaluateNodeScoreV02(baseCtx('STGO_05'), ROOT)!
    const again = evaluateNodeScoreV02(baseCtx('STGO_05'), ROOT)!
    expect(bundle.baseNodeValue.score).toBe(again.baseNodeValue.score)
    expect(bundle.baseNodeValue.components).toEqual(again.baseNodeValue.components)
  })

  it('15 — BaseNodeValue exposes weighted contribution breakdown', () => {
    const bundle = evaluateNodeScoreV02(baseCtx('STGO_05'), ROOT)!
    const bnv = bundle.baseNodeValue
    expect(bnv.weightedContributions.intrinsicWorth).not.toBeNull()
    expect(bnv.weightedContributions.travelerMatch).not.toBeNull()
    expect(bnv.explanation.plainLanguageExplanation).toContain('BaseNodeValue')
    const recomposed = computeBaseNodeValue({
      intrinsic: bundle.intrinsicWorth,
      travelerMatch: bundle.travelerMatch,
      roleFit: bundle.roleFit,
      routeIntent: 'BALANCED',
    })
    expect(recomposed.score).toBe(bnv.score)
  })

  it('16 — MarginalRouteValue newThemeValue rewards unseen themes', () => {
    const semantic = semanticById.get('STGO_06')!
    const novel = computeNewThemeValue(semantic, ['T2'])
    const redundant = computeNewThemeValue(semantic, ['T1A', 'T3', 'T6'])
    expect(novel).not.toBeNull()
    expect(redundant).not.toBeNull()
    expect(novel!).toBeGreaterThan(redundant!)
  })

  it('17 — MarginalRouteValue structuralNovelty responds to route composition', () => {
    const roleFit = computeRoleFit(semanticById.get('STGO_33')!, editorialById.get('STGO_33'))
    const emptyRoute = computeStructuralNovelty(roleFit, sampleRouteState({ routeSoFarStgoIds: [], recentStgoIds: [], anchorCount: 0 }))
    const anchorHeavy = computeStructuralNovelty(
      roleFit,
      sampleRouteState({ anchorCount: 4, routeSoFarStgoIds: ['STGO_01', 'STGO_03', 'STGO_18', 'STGO_02'], microCount: 0 }),
    )
    expect(emptyRoute).not.toBeNull()
    expect(anchorHeavy).not.toBeNull()
    if (roleFit.microRevealFit != null) {
      expect(anchorHeavy!).toBeGreaterThanOrEqual(roleFit.microRevealFit!)
    }
  })

  it('18 — MarginalRouteValue discoveryValue responds to traveler posture', () => {
    const editorial = editorialById.get('STGO_28')
    const d1 = normalizeTraveler({ interests: ['barrios_vivos'], discoveryPosture: 'D1', rhythm: 'equilibrado' })
    const d3 = normalizeTraveler({ interests: ['historia_civica'], discoveryPosture: 'D3', rhythm: 'estructurado' })
    const v1 = computeDiscoveryValue(editorial, d1)
    const v3 = computeDiscoveryValue(editorial, d3)
    expect(v1).not.toBeNull()
    expect(v3).not.toBeNull()
    expect(v1!).toBeGreaterThan(v3!)
  })

  it('19 — MarginalRouteValue narrativeProgression derives from arc state', () => {
    const low = computeNarrativeProgression(sampleRouteState())
    const high = computeNarrativeProgression(
      sampleRouteState({
        arcState: {
          ...createEmptyArcState(),
          emotionalIntensity: 0.9,
          revealCount: 4,
          recentPOIs: ['STGO_01', 'STGO_03'],
        },
      }),
    )
    expect(low).not.toBeNull()
    expect(high).not.toBeNull()
    expect(high!).toBeGreaterThan(low!)
  })

  it('20 — MarginalRouteValue questionPayoff rises with open questions', () => {
    const none = computeQuestionPayoff(sampleRouteState())
    const pending = computeQuestionPayoff(
      sampleRouteState({
        arcState: {
          ...createEmptyArcState(),
          questionsOpened: ['q1', 'q2'],
          questionsResolved: [],
        },
      }),
    )
    expect(none).not.toBeNull()
    expect(pending).not.toBeNull()
    expect(pending!).toBeGreaterThan(none!)
  })

  it('21 — MarginalRouteValue roleNeedFit explains anchor/pocket/micro needs', () => {
    const roleFit = computeRoleFit(semanticById.get('STGO_28')!, editorialById.get('STGO_28'))
    const traveler = normalizeTraveler({ interests: ['barrios_vivos'], discoveryPosture: 'D1', rhythm: 'equilibrado' })
    const fit = computeRoleNeedFit(roleFit, sampleRouteState({ anchorCount: 3, pocketCount: 0, microCount: 0 }), traveler)
    expect(fit.score).not.toBeNull()
    expect(fit.explanation).toMatch(/Role need/)
  })

  it('22 — MarginalRouteValue redundancy penalizes recent theme overlap', () => {
    const semantic = semanticById.get('STGO_01')!
    const low = computeRedundancy(semantic, sampleRouteState({ routeThemes: ['T2', 'T4'] }))
    const high = computeRedundancy(semantic, sampleRouteState({ routeThemes: ['T1A', 'T3', 'T1A', 'T3'] }))
    expect(low).not.toBeNull()
    expect(high).not.toBeNull()
    expect(high!).toBeGreaterThan(low!)
  })

  it('23 — GeographicProgression does not fabricate without evidence', () => {
    expect(computeGeographicProgression(sampleRouteState({ geographicEvidenceAvailable: false }))).toBeNull()
    expect(computeGeographicProgression(sampleRouteState({ geographicEvidenceAvailable: false, transitionDistanceM: 500 }))).toBeNull()
    expect(computeGeographicProgression(sampleRouteState({ geographicEvidenceAvailable: true, bearingReversal: false }))).toBe(0.75)
  })

  it('24 — infeasible physical transition yields TransitionValue INELIGIBLE', () => {
    const tv = computeTransitionValue(sampleRouteState({ transitionFeasible: false }))
    expect(tv.status).toBe('INELIGIBLE')
    expect(tv.score).toBeNull()
    expect(tv.explanation.plainLanguageExplanation).toContain('infeasible')
  })

  it('25 — score bundles expose coverage on all major layers', () => {
    const bundle = evaluateNodeScoreV02(
      {
        ...baseCtx('STGO_03'),
        routeState: sampleRouteState(),
      },
      ROOT,
    )!
    expect(bundle.intrinsicWorth.coverage).toBeGreaterThan(0)
    expect(bundle.travelerMatch.coverage).toBeGreaterThan(0)
    expect(bundle.roleFit.coverage).toBeGreaterThan(0)
    expect(bundle.baseNodeValue.coverage).toBeGreaterThan(0)
    expect(bundle.marginalRouteValue?.coverage).toBeGreaterThan(0)
  })

  it('26 — UNKNOWN inputs are not treated as zero in scoring layers', () => {
    const stgo104 = semanticById.get('STGO_104')!
    const partial = computeIntrinsicWorthRaw(structuralInputs(stgo104))
    expect(partial.raw).toBeNull()
    expect(partial.contributions.heritageDepth).toBeNull()
    expect(partial.contributions.polish).toBeNull()

    const bundle = evaluateNodeScoreV02(
      {
        stgoId: 'STGO_104',
        displayName: 'Bolsa',
        traveler: normalizeTraveler({ interests: ['historia_civica'], rhythm: 'estructurado' }),
      },
      ROOT,
    )!
    expect(bundle.intrinsicWorth.raw).toBeNull()
    expect(bundle.intrinsicWorth.raw).not.toBe(0)
    expect(bundle.travelerMatch.components.thematicAffinity).toBeNull()
    expect(bundle.travelerMatch.explanation.unknownFactors.length).toBeGreaterThan(0)
  })

  it('27 — standardized explanations are present on scored layers', () => {
    const bundle = evaluateNodeScoreV02(baseCtx('STGO_01'), ROOT)!
    expect(bundle.intrinsicWorth.explanation.plainLanguageExplanation.length).toBeGreaterThan(10)
    expect(bundle.travelerMatch.explanation.scoreName).toBe('TravelerMatch')
    expect(bundle.roleFit.explanation.plainLanguageExplanation).toContain('Primary role')
    expect(bundle.baseNodeValue.explanation.topPositiveFactors.length).toBeGreaterThanOrEqual(0)
  })

  it('28 — STGO_104 evaluates safely with UNAVAILABLE layers', () => {
    const bundle = evaluateNodeScoreV02(
      {
        stgoId: 'STGO_104',
        displayName: 'Bolsa',
        traveler: QA_PROFILES[0]!.traveler,
        routeState: sampleRouteState(),
      },
      ROOT,
    )!
    expect(bundle.stgoId).toBe('STGO_104')
    expect(bundle.intrinsicWorth.status).toBe('UNAVAILABLE')
    expect(bundle.parallelOnly).toBe(true)
    expect(bundle.banner).toContain('NOT USED FOR ROUTE SELECTION')
    expect(bundle.marginalRouteValue).not.toBeNull()
  })

  it('29 — STGO_33 exists in semantic and editorial dimension artifacts', () => {
    expect(semanticById.has('STGO_33')).toBe(true)
    expect(editorialById.has('STGO_33')).toBe(true)
    const bundle = evaluateNodeScoreV02(baseCtx('STGO_33'), ROOT)!
    expect(bundle.intrinsicWorth.raw).not.toBeNull()
    expect(bundle.roleFit.primaryStructuralRole).toBe('micro')
  })

  it('30 — editorial dimensions carry provenance metadata', () => {
    const bundle = evaluateNodeScoreV02(baseCtx('STGO_01'), ROOT)!
    const ess = bundle.editorialDimensions.essentiality
    expect(ess?.provenance).toBeTruthy()
    expect(ess?.confidence).toMatch(/HIGH|MEDIUM|LOW/)
    expect(ess?.derivationMethod).toBeTruthy()
    expect(ess?.rationale.length).toBeGreaterThan(10)
  })

  it('31 — curator override pattern uses stable localStorage key constant', () => {
    expect(HUMAN_REVIEW_STORAGE_KEY).toBe('cw_route_lab_human_review_v0_1')
    const ui = readFileSync(resolve(ROOT, 'src/dev/route-lab/static/route-lab-ui.js'), 'utf8')
    expect(ui).toContain(HUMAN_REVIEW_STORAGE_KEY)
    expect(SCORING_MODEL_V0_2_PARALLEL_READY).toBe(true)
    const bundle = evaluateNodeScoreV02(baseCtx('STGO_01'), ROOT)!
    expect(bundle.parallelOnly).toBe(true)
  })

  it('32 — V0.2 parallel scoring does not change V0.1 engine output fingerprint', () => {
    const current = gate2e1EngineOutputFingerprint(ROOT)
    const baseline = loadGate2e1FingerprintBaseline(ROOT)
    expect(baseline).toBeTruthy()
    expect(current).toEqual(baseline)
  })

  it('33 — F1–F18 regression fingerprints unchanged (Gate 2D + full)', () => {
    const d2 = gate2dRegressionFingerprint(ROOT)
    const d2base = loadGate2dFingerprintArtifact(ROOT)
    expect(d2base).toBeTruthy()
    expect(d2).toEqual(d2base)

    const full = gate2e1EngineOutputFingerprint(ROOT)
    const fullBase = loadGate2e1FingerprintBaseline(ROOT)
    expect(full).toEqual(fullBase)
  })
})

describe('Gate 2E.2A QA report summary (informational)', () => {
  it('captures variability metrics for gate summary', { timeout: 60_000 }, () => {
    const report = buildTravelerMatchVariabilityReport(ROOT)
    expect(report.meanTravelerMatchRangeLaunch30).toBeGreaterThan(0)
    expect(report.lowestVariability.length).toBe(5)
    expect(report.highestVariability.length).toBe(5)
    ;(globalThis as { __gate2e2aQa?: typeof report }).__gate2e2aQa = report
  })
})
