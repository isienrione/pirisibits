import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PHYSICAL_ROUTE_GENERATION_ENABLED,
  EDITORIAL_CALIBRATION_CURATOR_APPROVED,
  EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY,
  ENGINE_USING_PROVISIONAL_EDITORIAL_CALIBRATION,
  NARRATIVE_GRAPH_V0_1_PROPOSED_READY,
  ROUTE_COMPOSER_V0_1_PROVISIONAL_READY,
} from '@/src/lib/city-graph/flags'
import { composeProvisionalRoutes } from '@/src/engine/routes/route-composer'
import { hashRouteRequest, normalizeRouteRequest, serializeRouteRequest } from '@/src/engine/routes/route-request'
import {
  compositionDifference,
  edgeOverlap,
  orderedOverlap,
  routeSimilarity,
  scoreDifference,
  stopOverlap,
  themeCoverageDifference,
  timeDifference,
} from '@/src/engine/routes/route-compare'
import { ROUTE_SCORE_WEIGHTS, ROUTE_SEARCH_CONFIG, FORBIDDEN_METRO_LINES } from '@/src/engine/routes/route-config'
import { loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'
import { loadLaunch30NarrativeGraph } from '@/src/engine/narrative/narrative-loader'
import { TRAVELER_FIXTURES } from '@/src/engine/fixtures/travelerFixtures'
import { createEmptyArcState, applyNarrativeEdgeToArcState } from '@/src/engine/narrative/arc-state'
import { evaluateNodeEligibility } from '@/src/engine/eligibility/evaluateNodeEligibility'

const ROOT = resolve(__dirname, '../../..')

describe('Gate 2C provisional route composer', () => {
  const nodes = loadLaunchNodes(ROOT)

  it('keeps provisional flags and production routing disabled', () => {
    expect(EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY).toBe(true)
    expect(EDITORIAL_CALIBRATION_CURATOR_APPROVED).toBe(false)
    expect(ENGINE_USING_PROVISIONAL_EDITORIAL_CALIBRATION).toBe(true)
    expect(NARRATIVE_GRAPH_V0_1_PROPOSED_READY).toBe(true)
    expect(ROUTE_COMPOSER_V0_1_PROVISIONAL_READY).toBe(true)
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
  })

  it('Launch30 remains 30 and full inventory remains 105; narrative graph unchanged gate', () => {
    expect(nodes.filter((n) => n.launchCorpus)).toHaveLength(30)
    const semantic = JSON.parse(
      readFileSync(resolve(ROOT, 'src/data/santiago/santiago_semantic_calibration.v0.1.json'), 'utf8'),
    )
    expect(semantic.recordCount).toBe(105)
    const narr = loadLaunch30NarrativeGraph(ROOT)
    expect(narr.nodeCount).toBe(30)
    expect(narr.calibrationApproved).toBe(false)
  })

  it('hard eligibility runs before scoring and excludes physical-pending STGO_104', () => {
    const n104 = nodes.find((n) => n.stgoId === 'STGO_104')!
    const elig = evaluateNodeEligibility(n104, TRAVELER_FIXTURES.A_first_time_essentials, {
      launchCorpusOnly: true,
    })
    expect(elig.eligible).toBe(false)
    expect(elig.hardFailures.some((f) => f.code === 'PHYSICAL_INELIGIBLE')).toBe(true)

    const result = composeProvisionalRoutes(
      {
        traveler: TRAVELER_FIXTURES.A_first_time_essentials,
        startingStgoId: 'STGO_01',
        timeBudgetMin: 120,
        transportPolicy: 'WALK_ONLY',
        routeIntent: 'BALANCED',
      },
      { root: ROOT, nodes, candidateCount: 3 },
    )
    for (const c of result.candidates) {
      expect(c.orderedStops.some((s) => s.stgoId === 'STGO_104')).toBe(false)
      expect(c.calibrationStatus).toBe('PROVISIONAL')
      expect(c.calibrationApproved).toBe(false)
      expect(c.routeQualityStatus).toBe('PROVISIONAL_PRE_FOUNDER_CALIBRATION')
      expect(c.physicalRouteGenerationEnabled).toBe(false)
    }
    expect(result.diagnostics.editorialButPhysicalPending).toContain('STGO_104')
    expect(
      result.candidates[0]?.omittedHighUtilityNodes.some(
        (o) => o.stgoId === 'STGO_104' && o.reasonCode === 'PHYSICAL_STATUS_PENDING',
      ),
    ).toBe(true)
  })

  it('respects STGO_33 physical status and never invents L7', () => {
    const n33 = nodes.find((n) => n.stgoId === 'STGO_33')!
    expect(n33.physicalRouteGenerationEligible).toBe(false)
    const result = composeProvisionalRoutes(
      {
        traveler: TRAVELER_FIXTURES.A_first_time_essentials,
        startingStgoId: 'STGO_01',
        timeBudgetMin: 120,
        transportPolicy: 'WALK_METRO',
        routeIntent: 'BALANCED',
      },
      { root: ROOT, nodes, candidateCount: 3 },
    )
    for (const c of result.candidates) {
      expect(c.orderedStops.some((s) => s.stgoId === 'STGO_33')).toBe(false)
      expect(c.metroUse.lineIds.some((l) => FORBIDDEN_METRO_LINES.includes(l as 'L7'))).toBe(false)
    }
  })

  it('enforces time budget within tolerance and marks dwell assumptions', () => {
    const result = composeProvisionalRoutes(
      {
        traveler: TRAVELER_FIXTURES.A_first_time_essentials,
        startingStgoId: 'STGO_01',
        timeBudgetMin: 60,
        transportPolicy: 'WALK_ONLY',
        routeIntent: 'BALANCED',
      },
      { root: ROOT, nodes, candidateCount: 3 },
    )
    expect(result.candidates.length).toBeGreaterThan(0)
    for (const c of result.candidates) {
      expect(c.totalEstimatedMin).toBeLessThanOrEqual(60 + ROUTE_SEARCH_CONFIG.timeToleranceMin)
      expect(c.assumptions.length).toBeGreaterThan(0)
      expect(c.orderedStops.every((s) => s.inclusionExplanation.length > 20)).toBe(true)
    }
  })

  it('WALK_ONLY never uses Metro; WALK_METRO may use operational lines only', () => {
    const walk = composeProvisionalRoutes(
      {
        traveler: TRAVELER_FIXTURES.A_first_time_essentials,
        startingStgoId: 'STGO_01',
        timeBudgetMin: 120,
        transportPolicy: 'WALK_ONLY',
        routeIntent: 'BALANCED',
      },
      { root: ROOT, nodes, candidateCount: 2 },
    )
    expect(walk.candidates.every((c) => c.metroUse.used === false)).toBe(true)
    expect(walk.candidates.every((c) => c.orderedStops.every((s) => s.arrivalMode !== 'METRO'))).toBe(true)

    const metro = composeProvisionalRoutes(
      {
        traveler: TRAVELER_FIXTURES.A_first_time_essentials,
        startingStgoId: 'STGO_01',
        timeBudgetMin: 120,
        transportPolicy: 'WALK_METRO',
        routeIntent: 'BALANCED',
      },
      { root: ROOT, nodes, candidateCount: 3 },
    )
    for (const c of metro.candidates) {
      for (const line of c.metroUse.lineIds) {
        expect(['L1', 'L2', 'L3', 'L4', 'L4A', 'L5', 'L6']).toContain(line)
      }
    }
  })

  it('memory opt-in and UNKNOWN accessibility behavior', () => {
    const noMem = composeProvisionalRoutes(
      {
        traveler: TRAVELER_FIXTURES.B_civic_history,
        startingStgoId: 'STGO_01',
        timeBudgetMin: 120,
        transportPolicy: 'WALK_ONLY',
        memorySitesOptIn: false,
      },
      { root: ROOT, nodes, candidateCount: 2 },
    )
    for (const c of noMem.candidates) {
      for (const s of c.orderedStops) {
        const node = nodes.find((n) => n.stgoId === s.stgoId)!
        expect(Boolean(node.isSensitiveMemorySite || node.sensitiveMemory)).toBe(false)
      }
    }

    const step = composeProvisionalRoutes(
      {
        traveler: TRAVELER_FIXTURES.H_accessibility_sensitive,
        startingStgoId: 'STGO_01',
        timeBudgetMin: 90,
        transportPolicy: 'WALK_ONLY',
        stepFreeRequired: true,
      },
      { root: ROOT, nodes, candidateCount: 2 },
    )
    // UNKNOWN accessibility may warn but must not be treated as verified step-free hard-pass fabrication
    for (const c of step.candidates) {
      expect(c.calibrationApproved).toBe(false)
      for (const s of c.orderedStops) {
        const node = nodes.find((n) => n.stgoId === s.stgoId)!
        expect(node.stepFree).not.toBe(false)
      }
    }
  })

  it('NodeUtility and NarrativeEdgeScore contribute; ArcState branches are independent', () => {
    const result = composeProvisionalRoutes(
      {
        traveler: TRAVELER_FIXTURES.A_first_time_essentials,
        startingStgoId: 'STGO_01',
        timeBudgetMin: 120,
        transportPolicy: 'WALK_ONLY',
      },
      { root: ROOT, nodes, candidateCount: 3 },
    )
    const top = result.candidates[0]!
    expect(top.orderedStops.some((s) => s.nodeUtility > 0)).toBe(true)
    expect(top.scoreBreakdown.nodeUtilityAvg).toBeGreaterThan(0)
    // At least one non-start stop should carry narrative score when edges exist
    expect(top.orderedStops.slice(1).some((s) => s.narrativeEdgeScore != null || s.narrativeRelationFromPrevious != null)).toBe(true)

    let a = createEmptyArcState()
    let b = createEmptyArcState()
    const edge = {
      to: 'STGO_02',
      relationType: 'sets_up' as const,
      themesSupported: ['T1A' as const],
      antiRepetitionTags: ['x'],
      narrativeHooksSupported: ['h'],
      optionalQuestionOpened: 'q1',
      optionalQuestionResolved: null,
    }
    a = applyNarrativeEdgeToArcState(a, { edge })
    expect(a.questionsOpened).toContain('q1')
    expect(b.questionsOpened).toHaveLength(0)
  })

  it('candidate diversity, determinism, request hash, and comparison utilities', () => {
    const input = {
      traveler: TRAVELER_FIXTURES.A_first_time_essentials,
      startingStgoId: 'STGO_01' as const,
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY' as const,
      routeIntent: 'BALANCED' as const,
    }
    const a = composeProvisionalRoutes(input, { root: ROOT, nodes, candidateCount: 3 })
    const b = composeProvisionalRoutes(input, { root: ROOT, nodes, candidateCount: 3 })
    expect(a.requestHash).toBe(b.requestHash)
    expect(a.candidates.map((c) => c.orderedStops.map((s) => s.stgoId).join('>'))).toEqual(
      b.candidates.map((c) => c.orderedStops.map((s) => s.stgoId).join('>')),
    )
    expect(a.candidates.length).toBeGreaterThanOrEqual(2)
    if (a.candidates.length >= 2) {
      const sim = routeSimilarity(a.candidates[0]!, a.candidates[1]!)
      expect(sim).toBeLessThan(0.95)
      expect(stopOverlap(a.candidates[0]!, a.candidates[1]!)).toBeGreaterThanOrEqual(0)
      expect(orderedOverlap(a.candidates[0]!, a.candidates[1]!)).toBeGreaterThanOrEqual(0)
      expect(edgeOverlap(a.candidates[0]!, a.candidates[1]!)).toBeGreaterThanOrEqual(0)
      expect(typeof timeDifference(a.candidates[0]!, a.candidates[1]!)).toBe('number')
      expect(typeof scoreDifference(a.candidates[0]!, a.candidates[1]!)).toBe('number')
      expect(themeCoverageDifference(a.candidates[0]!, a.candidates[1]!)).toBeTruthy()
      expect(compositionDifference(a.candidates[0]!, a.candidates[1]!)).toBeTruthy()
    }
    const req = normalizeRouteRequest(input)
    expect(serializeRouteRequest(req)).toBe(serializeRouteRequest(normalizeRouteRequest(input)))
    expect(hashRouteRequest(req)).toHaveLength(24)
    expect(Object.keys(ROUTE_SCORE_WEIGHTS).length).toBeGreaterThanOrEqual(6)
  })

  it('physical infeasible transitions cannot enter routes; no LLM dependency in composer', () => {
    const result = composeProvisionalRoutes(
      {
        traveler: TRAVELER_FIXTURES.A_first_time_essentials,
        startingStgoId: 'STGO_01',
        timeBudgetMin: 120,
        transportPolicy: 'WALK_ONLY',
      },
      { root: ROOT, nodes, candidateCount: 1 },
    )
    const adj = JSON.parse(
      readFileSync(resolve(ROOT, 'src/data/santiago/santiago_pedestrian_adjacency.v0.2.json'), 'utf8'),
    )
    const walkPairs = new Set(
      (adj.edges || [])
        .filter((e: { runtimeEligible?: boolean }) => e.runtimeEligible)
        .map((e: { fromPoiId: string; toPoiId: string }) => `${e.fromPoiId}>${e.toPoiId}`),
    )
    const top = result.candidates[0]!
    for (let i = 1; i < top.orderedStops.length; i += 1) {
      const prev = top.orderedStops[i - 1]!
      const cur = top.orderedStops[i]!
      expect(cur.arrivalMode).toBe('WALK')
      expect(walkPairs.has(`${prev.stgoId}>${cur.stgoId}`)).toBe(true)
    }
    const src = readFileSync(resolve(ROOT, 'src/engine/routes/route-composer.ts'), 'utf8')
    expect(src).not.toMatch(/openai|anthropic|fetch\(/i)
  })
})
