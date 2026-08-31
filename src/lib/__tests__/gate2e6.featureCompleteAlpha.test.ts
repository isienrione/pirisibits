/**
 * Gate 2E.6 — Feature-Complete Alpha tests.
 */

import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import {
  ENGINE_FEATURE_COMPLETE_ALPHA,
  ENGINE_FEATURE_COMPLETE_ALPHA_CANONICAL,
  EXPERIENCE_GRAPH_VNEXT_READY,
  EXPERIENCE_TIME_VNEXT_READY,
  ARCSTATE_VNEXT_READY,
  COMPOSER_VNEXT_READY,
  ARCQUALITY_VNEXT_READY,
  ARBITRATION_VNEXT_READY,
  EXPLANATION_ENGINE_READY,
  LIVE_TRACE_READY,
  EXPERIENCE_TIME_PRODUCTION,
  PRODUCTION_ROUTE_GENERATION,
  PHYSICAL_ROUTE_GENERATION_ENABLED,
  ROUTE_ARBITRATION_V0_2_PRODUCTION,
  ROUTE_COMPOSER_V0_2_PRODUCTION,
  ARCQUALITY_V0_2_PRODUCTION,
} from '@/src/lib/city-graph/flags'
import {
  allBuildReady,
  summarizeFeatureCompleteStatus,
} from '@/src/engine/vnext/status/engine-feature-status'
import {
  adaptLaunchCorpusToExperienceGraph,
  legacyCoreExperienceId,
  LEGACY_EXPERIENCE_ADAPTER,
} from '@/src/engine/vnext/place/legacy-adapter'
import { loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'
import { buildFeasibleExperienceGraph } from '@/src/engine/vnext/feasibility/feasible-experience-graph'
import { normalizeRouteRequest } from '@/src/engine/routes/route-request'
import {
  evaluateExperienceTime,
  computeEffectiveMarginalTime,
  computeCoreRouteTime,
  EMT_MOVEMENT_EPSILON,
} from '@/src/engine/vnext/time/experience-time-engine'
import {
  advanceArcState,
  computeIncrementalArcValue,
  initialArcStateVNext,
  phaseFromBudgetFraction,
} from '@/src/engine/vnext/arc/arc-state-vnext'
import { assessRhythmWindow } from '@/src/engine/vnext/rhythm/rhythm-controller'
import { selectContentModules } from '@/src/engine/vnext/content/select-content-modules'
import { getPosturePolicyVNext, shadowComparePostureResponsibilities } from '@/src/engine/vnext/posture/posture-policy-vnext'
import { m2StepFreeFailClosed } from '@/src/engine/routes/experience-time/vnext/per-field-provenance'
import {
  runFeatureCompleteAlpha,
  assertDeterministicAlpha,
  assertTraceCompleteness,
} from '@/src/engine/vnext/pipeline/run-feature-complete-alpha'
import { ALPHA_BENCHMARKS, getBenchmark } from '@/src/engine/vnext/benchmarks/alpha-benchmarks'
import { experiencesViolateMutualExclusion } from '@/src/engine/routes/experience-time/vnext/place-experience-schema'
import type { ExperienceRecordV01 } from '@/src/engine/routes/experience-time/vnext/place-experience-schema'
import { normalizeTravelerRequestVNext } from '@/src/engine/vnext/scoring/traveler-facets'

const ROOT = resolve(__dirname, '../../..')

describe('Gate 2E.6 Feature-Complete Alpha', () => {
  it('flags: alpha true, canonical false, production false', () => {
    expect(ENGINE_FEATURE_COMPLETE_ALPHA).toBe(true)
    expect(ENGINE_FEATURE_COMPLETE_ALPHA_CANONICAL).toBe(false)
    expect(EXPERIENCE_GRAPH_VNEXT_READY).toBe(true)
    expect(EXPERIENCE_TIME_VNEXT_READY).toBe(true)
    expect(ARCSTATE_VNEXT_READY).toBe(true)
    expect(COMPOSER_VNEXT_READY).toBe(true)
    expect(ARCQUALITY_VNEXT_READY).toBe(true)
    expect(ARBITRATION_VNEXT_READY).toBe(true)
    expect(EXPLANATION_ENGINE_READY).toBe(true)
    expect(LIVE_TRACE_READY).toBe(true)
    expect(EXPERIENCE_TIME_PRODUCTION).toBe(false)
    expect(PRODUCTION_ROUTE_GENERATION).toBe(false)
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(ROUTE_ARBITRATION_V0_2_PRODUCTION).toBe(false)
    expect(ROUTE_COMPOSER_V0_2_PRODUCTION).toBe(false)
    expect(ARCQUALITY_V0_2_PRODUCTION).toBe(false)
  })

  it('19/19 BUILD READY', () => {
    expect(allBuildReady()).toBe(true)
    const s = summarizeFeatureCompleteStatus()
    expect(s.buildReadyCount).toBe(19)
    expect(s.ENGINE_FEATURE_COMPLETE_ALPHA_CANONICAL).toBe(false)
  })

  it('Place/Experience separation + legacy adapter', () => {
    expect(LEGACY_EXPERIENCE_ADAPTER).toBe(true)
    const nodes = loadLaunchNodes(ROOT)
    const adapted = adaptLaunchCorpusToExperienceGraph(nodes)
    expect(adapted.places.length).toBe(nodes.length)
    expect(adapted.experiences.every((e) => e.LEGACY_EXPERIENCE_ADAPTER)).toBe(true)
    expect(adapted.experiences[0]!.experienceId).toBe(legacyCoreExperienceId(adapted.experiences[0]!.sourceStgoId!))
    expect(adapted.experiences[0]!.visitMode).toBe('UNKNOWN')
    expect(adapted.experiences[0]!.experienceTimeProfile.unknown).toBe(true)
  })

  it('mutual exclusion + optional child override', () => {
    const base: ExperienceRecordV01 = {
      experienceId: 'e1',
      placeId: 'p1',
      corridorRef: null,
      visitMode: 'EXTERIOR_CORE',
      stopRole: 'REQUIRED_STOP',
      parentExperienceId: null,
      mutuallyExclusiveGroupId: 'place:p1',
      compatibilityOverride: false,
      openingConstraintsRef: null,
      ticketConstraintsRef: null,
      narrativeIdentity: null,
      provenance: 'UNKNOWN',
      contentTimeProfile: {
        authoredContentMin: null,
        walkCompatibleContentMin: null,
        requiredStopMin: null,
        stationaryDwellMin: null,
        accessOverheadMin: null,
        contentMayOverlapMovement: null,
      },
    }
    const child = {
      ...base,
      experienceId: 'e2',
      visitMode: 'OPTIONAL_INTERIOR' as const,
      stopRole: 'OPTIONAL_EXTENSION' as const,
      parentExperienceId: 'e1',
    }
    expect(experiencesViolateMutualExclusion([base, child]).ok).toBe(true)
    const core2 = { ...base, experienceId: 'e3', visitMode: 'INTERIOR_CORE' as const }
    expect(experiencesViolateMutualExclusion([base, core2]).ok).toBe(false)
  })

  it('UNKNOWN ExperienceTime + legacy compatibility disclosure', () => {
    const nodes = loadLaunchNodes(ROOT)
    const adapted = adaptLaunchCorpusToExperienceGraph(nodes)
    const exp = adapted.experiences.find((e) => e.sourceStgoId === 'STGO_01')!
    const node = nodes.find((n) => n.stgoId === 'STGO_01')!
    const strict = evaluateExperienceTime({ experience: exp, node, mode: 'STRICT_EXPERIENCE_TIME' })
    expect(strict.usable).toBe(false)
    const legacy = evaluateExperienceTime({ experience: exp, node, mode: 'LEGACY_COMPATIBILITY' })
    expect(legacy.usable).toBe(true)
    expect(legacy.timeEvidence).toBe('LEGACY_SCALAR_DWELL')
    expect(legacy.experienceTimeCalibrated).toBe(false)
    expect(legacy.disclosure.some((d) => d.includes('LEGACY'))).toBe(true)
    const diag = evaluateExperienceTime({ experience: exp, node, mode: 'DIAGNOSTIC_UNKNOWN' })
    expect(diag.timeEvidence).toBe('UNKNOWN')
    expect(diag.stationaryDwell).toBeNull()
  })

  it('EMT guardrails + route time recomputation', () => {
    const snap = {
      routingSnapshotId: 's1',
      modeAssumptions: 'WALK',
      travelerPhysicalCoefficientsVersion: 'v1',
      evidenceVersion: 'e1',
    }
    const ok = computeEffectiveMarginalTime({
      legs: { movementAX: 5, movementXB: 6, movementAB: 8, ...snap },
      expected: snap,
      stationaryDwellX: 12,
      accessOverheadX: 1,
    })
    expect(ok.ok).toBe(true)
    expect(ok.emt).toBe(5 + 6 - 8 + 12 + 1)
    const bad = computeEffectiveMarginalTime({
      legs: { movementAX: 1, movementXB: 1, movementAB: 10, ...snap },
      expected: snap,
      stationaryDwellX: 0,
      accessOverheadX: 0,
    })
    expect(bad.movementMarginal!).toBeLessThan(-EMT_MOVEMENT_EPSILON)
    expect(bad.ok).toBe(false)
    expect(computeCoreRouteTime({ movementTimesMin: [5, 7], stationaryDwellsMin: [10], accessOverheadsMin: [2] })).toBe(24)
  })

  it('M2 fail-closed', () => {
    expect(
      m2StepFreeFailClosed({
        stepFreeRequired: true,
        accessibilityProvenance: 'UNKNOWN',
        stepFreeKnown: null,
      }).pass,
    ).toBe(false)
  })

  it('ArcState phases / payoff / landing / repetition / rhythm', () => {
    expect(phaseFromBudgetFraction(0.1)).toBe('EARLY')
    expect(phaseFromBudgetFraction(0.4)).toBe('MIDDLE')
    expect(phaseFromBudgetFraction(0.7)).toBe('LATE')
    expect(phaseFromBudgetFraction(0.9)).toBe('LANDING')
    let s = initialArcStateVNext()
    const exp = {
      experienceId: 'x',
      placeId: 'p',
      corridorRef: null,
      displayName: 'X',
      visitMode: 'UNKNOWN' as const,
      stopRole: 'UNKNOWN' as const,
      structuralRoleFit: {},
      narrativeRoleCapabilities: ['ORIENT' as const, 'PAYOFF' as const, 'LAND' as const],
      experienceTimeProfile: {
        movementTimeMin: null,
        stationaryDwellMin: null,
        requiredAccessOverheadMin: null,
        walkCompatibleContentMin: null,
        optionalExtensionTimeMin: null,
        authoredContentMin: null,
        unknown: true,
        provenance: 'UNKNOWN' as const,
      },
      openingConstraints: {
        openingConstraintsRef: null,
        ticketConstraintsRef: null,
        stepFreeKnown: null,
        openingHoursKnown: null,
        unknownConstraints: [],
      },
      ticketConstraints: {
        openingConstraintsRef: null,
        ticketConstraintsRef: null,
        stepFreeKnown: null,
        openingHoursKnown: null,
        unknownConstraints: [],
      },
      optionalStatus: 'CORE_COMPATIBILITY' as const,
      parentExperienceId: null,
      mutualExclusionGroup: null,
      compatibilityOverride: false,
      contentModuleIds: [],
      provenance: { record: 'LEGACY_ADAPTER' as const, fields: {} as any, legacyAdapter: true },
      LEGACY_EXPERIENCE_ADAPTER: true,
      sourceStgoId: 'STGO_01',
    }
    s = advanceArcState({
      currentState: s,
      selectedExperience: exp,
      selectedNarrativeRelation: null,
      elapsedTimeMin: 100,
      timeBudgetMin: 120,
      themes: ['p'],
      opensQuestion: 'q1',
      isPayoff: true,
    })
    expect(s.orientationSatisfied).toBe(true)
    expect(s.payoffSatisfied).toBe(true)
    expect(s.openQuestions).toContain('q1')
    s = advanceArcState({
      currentState: s,
      selectedExperience: exp,
      selectedNarrativeRelation: null,
      elapsedTimeMin: 110,
      timeBudgetMin: 120,
      themes: ['p'],
      resolvesQuestion: 'q1',
    })
    expect(s.resolvedQuestions).toContain('q1')
    expect(s.repetitionLoad).toBeGreaterThan(0)
    expect(assessRhythmWindow({ experienceBeats: 7, requiredStops: 7, stationaryInterruptions: 7, narrationMinutes: null }).assessment).toBe('VERY_DENSE')
    const iav = computeIncrementalArcValue({
      currentArcState: s,
      candidateExperience: exp,
      narrativeEdgeAvailable: true,
      traveler: normalizeTravelerRequestVNext({ interests: ['historia'] }),
      remainingBudgetMin: 20,
      rhythmScore01: 0.5,
    })
    expect(iav.components.evidenceCoverage).toBeGreaterThan(0)
    expect(iav.calibrationRequired).toBe(true)
  })

  it('content module selection skips when missing', () => {
    const s = initialArcStateVNext()
    const r = selectContentModules({
      experienceId: 'missing',
      available: [],
      traveler: normalizeTravelerRequestVNext({ interests: ['historia'] }),
      arcState: s,
      timeContext: { remainingMin: 30, walkCompatibleCapacity: 'UNKNOWN' },
    })
    expect(r.reasons).toContain('NO_RELEVANT_MODULE')
  })

  it('posture policy maps 12 touchpoints into 2 responsibilities (shadow)', () => {
    const p = getPosturePolicyVNext()
    expect(p.legacyMapping).toHaveLength(12)
    expect(p.status).toBe('SHADOW_ONLY_NOT_CUT_OVER')
    const c = shadowComparePostureResponsibilities()
    expect(c.nodeAffinityCount + c.noveltyCount).toBe(12)
  })

  it('feasible experience graph excludes with reasons', () => {
    const nodes = loadLaunchNodes(ROOT)
    const adapted = adaptLaunchCorpusToExperienceGraph(nodes)
    const request = normalizeRouteRequest({
      traveler: { interests: ['historia'] },
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
    })
    const g = buildFeasibleExperienceGraph({
      traveler: request.traveler,
      request,
      places: adapted.places,
      experiences: adapted.experiences,
      nodesByStgoId: new Map(nodes.map((n) => [n.stgoId, n])),
    })
    expect(g.eligibleExperiences.length).toBeGreaterThan(5)
    expect(g.coverage).toBeGreaterThan(0)
  })

  it('B01–B12 benchmarks exist', () => {
    expect(ALPHA_BENCHMARKS).toHaveLength(12)
    expect(getBenchmark('B08_OUTDOOR_HIKING')?.coverage).toBe('DATA_COVERAGE_LIMITED')
  })

  it('B02 end-to-end FeatureRequest → recommendation + explanation + trace', () => {
    const b = getBenchmark('B02_ORIGINS_COLONIAL')!
    const run = runFeatureCompleteAlpha(b.request, { root: ROOT })
    expect(run.ENGINE_FEATURE_COMPLETE_ALPHA).toBe(true)
    expect(run.ENGINE_FEATURE_COMPLETE_ALPHA_CANONICAL).toBe(false)
    expect(run.LEGACY_EXPERIENCE_ADAPTER).toBe(true)
    expect(run.timeEvaluationMode).toBe('LEGACY_COMPATIBILITY')
    expect(run.recommendation).not.toBeNull()
    expect(run.recommendation!.stgoIds.length).toBeGreaterThanOrEqual(2)
    expect(run.explanation?.routeWhy.length).toBeGreaterThan(0)
    expect(run.explanation?.experiences.length).toBe(run.recommendation!.experienceIds.length)
    expect(run.arbitrationCurrent.discoveryFitAvailable).toBe(true)
    expect(run.arbitrationExperimental.calibrationRequired).toBe(true)
    expect(assertTraceCompleteness(run.trace).ok).toBe(true)
    expect(run.composition.h2Frozen).toBe(true)
  }, 60000)

  it('second-run determinism', () => {
    const b = getBenchmark('B01_FIRST_TIMER_BALANCED')!
    expect(assertDeterministicAlpha(b.request, ROOT)).toBe(true)
  }, 60000)
})
