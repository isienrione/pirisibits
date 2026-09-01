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
  ARC_QUALITY_V0_1_PROVISIONAL_READY,
} from '@/src/lib/city-graph/flags'
import { composeProvisionalRoutes } from '@/src/engine/routes/route-composer'
import {
  computeArcQuality,
  tryComputeArcQuality,
  validateRouteCandidateForArcQuality,
} from '@/src/engine/routes/arc-quality'
import {
  ARC_QUALITY_POSITIVE_WEIGHTS,
  ARC_QUALITY_PENALTY_WEIGHTS,
  RERANK_BLEND_WEIGHTS,
} from '@/src/engine/routes/arc-quality-config'
import {
  rerankRouteCandidates,
  composeAndRerankProvisionalRoutes,
} from '@/src/engine/routes/route-reranker'
import { inferRoutePositionRoles } from '@/src/engine/routes/route-position-role'
import { summarizeRouteShape } from '@/src/engine/routes/route-shape'
import { computeRouteQualityDiagnostics } from '@/src/engine/routes/route-quality-diagnostics'
import { loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'
import { TRAVELER_FIXTURES } from '@/src/engine/fixtures/travelerFixtures'
import { createEmptyArcState, applyNarrativeEdgeToArcState } from '@/src/engine/narrative/arc-state'
import type { RouteCandidateV01 } from '@/src/engine/routes/route-types'

const ROOT = resolve(__dirname, '../../..')

describe('Gate 2D ArcQuality + route reranker', () => {
  const nodes = loadLaunchNodes(ROOT)

  const baseInput = {
    traveler: TRAVELER_FIXTURES.A_first_time_essentials,
    startingStgoId: 'STGO_01' as const,
    timeBudgetMin: 120,
    transportPolicy: 'WALK_ONLY' as const,
    routeIntent: 'BALANCED' as const,
  }

  function composeCandidates(k = 3) {
    return composeProvisionalRoutes(baseInput, { root: ROOT, nodes, candidateCount: k }).candidates
  }

  it('keeps provisional flags including ARC_QUALITY_V0_1', () => {
    expect(EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY).toBe(true)
    expect(EDITORIAL_CALIBRATION_CURATOR_APPROVED).toBe(false)
    expect(ENGINE_USING_PROVISIONAL_EDITORIAL_CALIBRATION).toBe(true)
    expect(NARRATIVE_GRAPH_V0_1_PROPOSED_READY).toBe(true)
    expect(ROUTE_COMPOSER_V0_1_PROVISIONAL_READY).toBe(true)
    expect(ARC_QUALITY_V0_1_PROVISIONAL_READY).toBe(true)
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
  })

  it('centralizes arc and rerank weights', () => {
    const posSum = Object.values(ARC_QUALITY_POSITIVE_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(posSum).toBeCloseTo(1, 5)
    expect(RERANK_BLEND_WEIGHTS.composerProvisionalScore).toBeGreaterThanOrEqual(0.55)
    expect(RERANK_BLEND_WEIGHTS.composerProvisionalScore).toBeLessThanOrEqual(0.65)
    expect(RERANK_BLEND_WEIGHTS.arcQuality).toBeGreaterThanOrEqual(0.35)
    expect(Object.keys(ARC_QUALITY_PENALTY_WEIGHTS).length).toBeGreaterThanOrEqual(8)
  })

  it('computes deterministic ArcQuality for valid candidates', () => {
    const candidates = composeCandidates(3)
    const a = computeArcQuality(candidates[0]!)
    const b = computeArcQuality(candidates[0]!)
    expect(a.normalizedScore).toBe(b.normalizedScore)
    expect(a.arcQualityStatus).toBe('PROVISIONAL_V0_1')
    expect(a.calibrationApproved).toBe(false)
    expect(a.components.openingStrength).toBeGreaterThan(0)
    expect(a.components.developmentStrength).toBeGreaterThan(0)
  })

  it('reranks deterministically and preserves composer rank metadata', () => {
    const candidates = composeCandidates(3)
    const r1 = rerankRouteCandidates(candidates)
    const r2 = rerankRouteCandidates(candidates)
    expect(r1.rerankedCandidates.map((x) => x.candidate.routeId)).toEqual(
      r2.rerankedCandidates.map((x) => x.candidate.routeId),
    )
    for (const r of r1.rerankedCandidates) {
      expect(r.originalComposerRank).toBeGreaterThan(0)
      expect(r.rerankedRank).toBeGreaterThan(0)
      expect(r.rankChange).toBe(r.originalComposerRank - r.rerankedRank)
      expect(r.rerankExplanation.whyThisRouteRankedHere.length).toBeGreaterThan(20)
      expect(r.rerankExplanation.rankChangeReason.length).toBeGreaterThan(10)
    }
    expect(r1.arcQualityStatus).toBe('PROVISIONAL_V0_1')
    expect(r1.physicalRouteGenerationEnabled).toBe(false)
  })

  it('rejects invalid physical route explicitly', () => {
    const candidates = composeCandidates(1)
    const bad: RouteCandidateV01 = {
      ...candidates[0]!,
      status: 'INFEASIBLE',
      orderedStops: candidates[0]!.orderedStops.slice(0, 1),
      stopCount: 1,
    }
    const v = validateRouteCandidateForArcQuality(bad)
    expect(v.valid).toBe(false)
    if (!v.valid) expect(v.reasons.length).toBeGreaterThan(0)
    const tried = tryComputeArcQuality(bad)
    expect(tried.ok).toBe(false)
  })

  it('STGO_104 cannot appear in arc-valid routes', () => {
    const candidates = composeCandidates(3)
    for (const c of candidates) {
      expect(c.orderedStops.some((s) => s.stgoId === 'STGO_104')).toBe(false)
      const arc = computeArcQuality(c)
      expect(arc.arcQualityStatus).toBe('PROVISIONAL_V0_1')
    }
    const poison: RouteCandidateV01 = {
      ...candidates[0]!,
      orderedStops: [...candidates[0]!.orderedStops, { ...candidates[0]!.orderedStops[0]!, stgoId: 'STGO_104' }],
      stopCount: candidates[0]!.stopCount + 1,
    }
    expect(validateRouteCandidateForArcQuality(poison).valid).toBe(false)
  })

  it('STGO_33 not resurrected by reranker', () => {
    const result = composeAndRerankProvisionalRoutes(
      { ...baseInput, transportPolicy: 'WALK_METRO' },
      { root: ROOT, nodes, candidateCount: 3 },
    )
    for (const r of result.reranked.rerankedCandidates) {
      expect(r.candidate.orderedStops.some((s) => s.stgoId === 'STGO_33')).toBe(false)
    }
  })

  it('rewards development and penalizes weak patterns via arc components', () => {
    const candidates = composeCandidates(3)
    const scores = candidates.map((c) => computeArcQuality(c))
    expect(scores.some((s) => s.components.developmentStrength > 0.3)).toBe(true)
    expect(scores.every((s) => s.penalties.repetitionPenalty >= 0)).toBe(true)
  })

  it('question resolution uses authored metadata only', () => {
    let arc = createEmptyArcState()
    arc = applyNarrativeEdgeToArcState(arc, {
      edge: {
        to: 'STGO_02',
        relationType: 'sets_up',
        themesSupported: ['T1A'],
        antiRepetitionTags: [],
        narrativeHooksSupported: [],
        optionalQuestionOpened: 'q-test',
        optionalQuestionResolved: null,
      },
    })
    arc = applyNarrativeEdgeToArcState(arc, {
      edge: {
        to: 'STGO_03',
        relationType: 'resolves_question',
        themesSupported: ['T1A'],
        antiRepetitionTags: [],
        narrativeHooksSupported: [],
        optionalQuestionOpened: null,
        optionalQuestionResolved: 'q-test',
      },
    })
    const candidates = composeCandidates(1)
    const c = candidates[0]!
    const last = c.orderedStops[c.orderedStops.length - 1]!
    const patched = {
      ...c,
      orderedStops: c.orderedStops.map((s, i) =>
        i === c.orderedStops.length - 1 ? { ...s, arcStateAfter: arc } : s,
      ),
    }
    const result = computeArcQuality(patched)
    expect(result.components.questionResolution).toBeGreaterThan(0.5)
  })

  it('traveler thematic intent and D1/M1 modifiers apply', () => {
    const thematic = composeAndRerankProvisionalRoutes(
      {
        traveler: TRAVELER_FIXTURES.B_civic_history,
        startingStgoId: 'STGO_01',
        timeBudgetMin: 120,
        transportPolicy: 'WALK_ONLY',
        routeIntent: 'THEMATIC',
        preferredThemes: ['T1A'],
      },
      { root: ROOT, nodes, candidateCount: 2 },
    )
    expect(
      thematic.reranked.rerankedCandidates[0]?.arcQuality.travelerModifiersApplied.some((m) =>
        m.includes('thematicIntent'),
      ),
    ).toBe(true)

    const express = composeAndRerankProvisionalRoutes(
      {
        traveler: TRAVELER_FIXTURES.G_express_time_boxed,
        startingStgoId: 'STGO_01',
        timeBudgetMin: 120,
        transportPolicy: 'WALK_ONLY',
        routeIntent: 'ESSENTIALS',
      },
      { root: ROOT, nodes, candidateCount: 2 },
    )
    expect(
      express.reranked.rerankedCandidates[0]?.arcQuality.travelerModifiersApplied.some((m) => m.includes('M1')),
    ).toBe(true)
  })

  it('position roles and shape tags are deterministic', () => {
    const candidates = composeCandidates(1)
    const c = candidates[0]!
    const roles1 = inferRoutePositionRoles(c.orderedStops)
    const roles2 = inferRoutePositionRoles(c.orderedStops)
    expect(roles1).toEqual(roles2)
    expect(roles1[0]?.role).toBe('OPENER')
    expect(roles1[roles1.length - 1]?.role).toBe('LANDING')

    const shape1 = summarizeRouteShape(c.orderedStops, roles1, c.dominantThemes)
    const shape2 = summarizeRouteShape(c.orderedStops, roles1, c.dominantThemes)
    expect(shape1.tags).toEqual(shape2.tags)
    expect(shape1.tags.length).toBeGreaterThan(0)
  })

  it('diagnostics include severity and explanation', () => {
    const candidates = composeCandidates(1)
    const arc = computeArcQuality(candidates[0]!)
    const diags = computeRouteQualityDiagnostics(candidates[0]!, arc)
    expect(diags.length).toBeGreaterThanOrEqual(10)
    for (const d of diags) {
      expect(['NONE', 'MILD', 'MODERATE', 'SEVERE']).toContain(d.severity)
      expect(d.explanation.length).toBeGreaterThan(5)
    }
  })

  it('does not mutate input candidates', () => {
    const candidates = composeCandidates(3)
    const before = JSON.stringify(candidates.map((c) => ({ id: c.routeId, rank: c.rank })))
    rerankRouteCandidates(candidates)
    expect(JSON.stringify(candidates.map((c) => ({ id: c.routeId, rank: c.rank })))).toBe(before)
  })

  it('fixture matrix F1-F18 deterministic and no STGO_104', () => {
    const fixtures = JSON.parse(
      readFileSync(resolve(ROOT, 'src/data/santiago/routes/arc-reranker-fixtures.v0.1.json'), 'utf8'),
    )
    expect(fixtures.fixtures).toHaveLength(18)
    expect(fixtures.deterministicRepeatF2F18).toBe(true)
    expect(fixtures.arcQualityStatus).toBe('PROVISIONAL_V0_1')
    for (const row of fixtures.fixtures) {
      expect(row.flags.includesStgo104).toBe(false)
      expect(row.rejectedCount).toBe(0)
    }
  })

  it('no runtime LLM dependency in arc/reranker modules', () => {
    const arcSrc = readFileSync(resolve(ROOT, 'src/engine/routes/arc-quality.ts'), 'utf8')
    const rerankSrc = readFileSync(resolve(ROOT, 'src/engine/routes/route-reranker.ts'), 'utf8')
    expect(arcSrc).not.toMatch(/openai|anthropic|fetch\(/i)
    expect(rerankSrc).not.toMatch(/openai|anthropic|fetch\(/i)
  })

  it('same request produces same rerank via composeAndRerank', () => {
    const a = composeAndRerankProvisionalRoutes(baseInput, { root: ROOT, nodes, candidateCount: 3 })
    const b = composeAndRerankProvisionalRoutes(baseInput, { root: ROOT, nodes, candidateCount: 3 })
    expect(a.reranked.rerankedCandidates.map((r) => r.candidate.routeId)).toEqual(
      b.reranked.rerankedCandidates.map((r) => r.candidate.routeId),
    )
  })
})
