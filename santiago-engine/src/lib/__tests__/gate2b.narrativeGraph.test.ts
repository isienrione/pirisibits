import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PHYSICAL_ROUTE_GENERATION_ENABLED,
  EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY,
  EDITORIAL_CALIBRATION_CURATOR_APPROVED,
  ENGINE_USING_PROVISIONAL_EDITORIAL_CALIBRATION,
  NARRATIVE_GRAPH_V0_1_PROPOSED_READY,
  NODE_UTILITY_V0_1_READY,
} from '@/src/lib/city-graph/flags'
import {
  scoreNarrativeEdge,
  compareNarrativeScores,
  themeSimilarity,
} from '@/src/engine/narrative/narrative-edge-score'
import { NARRATIVE_EDGE_SCORE_WEIGHTS } from '@/src/engine/narrative/narrative-constants'
import {
  applyNarrativeEdgeToArcState,
  createEmptyArcState,
  prerequisitesSatisfied,
} from '@/src/engine/narrative/arc-state'
import { computeArcSignals } from '@/src/engine/narrative/arc-signals'
import {
  loadLaunch30NarrativeGraph,
  runtimeEligibleEdges,
} from '@/src/engine/narrative/narrative-loader'
import { loadEditorialCalibration } from '@/src/engine/loadCalibration'
import { loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'

const ROOT = resolve(__dirname, '../../..')
const GRAPH_PATH = resolve(
  ROOT,
  'src/data/santiago/narrative/santiago_launch30_narrative_graph.proposed.v0.1.json',
)

function baseNode(partial: {
  stgoId: string
  thematicVector?: Record<string, number | null>
  structuralMetrics?: {
    heritage_depth: number | null
    anchor_density: number | null
    micro_reveal: number | null
    polish: number | null
  }
  tier?: string
  thematicAvailability?: 'COMPLETE' | 'PARTIAL' | 'UNKNOWN'
  structuralAvailability?: 'COMPLETE' | 'PARTIAL' | 'UNKNOWN'
}) {
  return {
    stgoId: partial.stgoId,
    displayName: partial.stgoId,
    tier: partial.tier ?? 'thematic_pocket',
    editorialRole: 'pocket',
    thematicVector: partial.thematicVector ?? {
      T1A: 0.8,
      T1B: 0,
      T2: 0,
      T3: 0.4,
      T4: 0,
      T5: 0,
      T6: 0,
      T7: 0,
      T8: 0,
      T9: 0.2,
    },
    structuralMetrics: partial.structuralMetrics ?? {
      heritage_depth: 0.8,
      anchor_density: 0.7,
      micro_reveal: 0.2,
      polish: 0.6,
    },
    thematicAvailability: partial.thematicAvailability ?? 'COMPLETE',
    structuralAvailability: partial.structuralAvailability ?? 'COMPLETE',
  }
}

describe('Gate 2B provisional Santiago narrative graph', () => {
  const graph = loadLaunch30NarrativeGraph(ROOT)
  const launch = loadEditorialCalibration(ROOT)

  it('keeps provisional calibration flags and disables routing', () => {
    expect(EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY).toBe(true)
    expect(EDITORIAL_CALIBRATION_CURATOR_APPROVED).toBe(false)
    expect(ENGINE_USING_PROVISIONAL_EDITORIAL_CALIBRATION).toBe(true)
    expect(NARRATIVE_GRAPH_V0_1_PROPOSED_READY).toBe(true)
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(NODE_UTILITY_V0_1_READY).toBe(true)
    expect(graph.calibrationStatus).toBe('PROVISIONAL')
    expect(graph.calibrationApproved).toBe(false)
    expect(graph.engineUsingProvisionalEditorialCalibration).toBe(true)
    expect(graph.physicalRouteGenerationEnabled).toBe(false)
  })

  it('artifact has exactly Launch30 membership with STGO_33/104 and without STGO_23', () => {
    expect(graph.nodeCount).toBe(30)
    expect(graph.nodes).toHaveLength(30)
    const ids = graph.nodes.map((n) => n.stgoId)
    expect(ids).toContain('STGO_33')
    expect(ids).toContain('STGO_104')
    expect(ids).not.toContain('STGO_23')
    expect(new Set(ids).size).toBe(30)
    const corpus = JSON.parse(
      readFileSync(resolve(ROOT, 'src/data/santiago/santiago_launch_corpus.v0.1.json'), 'utf8'),
    )
    expect([...ids].sort()).toEqual([...(corpus.ids as string[])].sort())
  })

  it('preserves STGO_33 corrected identity and STGO_104 incomplete semantics', () => {
    const n33 = graph.nodes.find((n) => n.stgoId === 'STGO_33')!
    const n104 = graph.nodes.find((n) => n.stgoId === 'STGO_104')!
    expect(n33.displayName).toContain('Gárgola')
    expect(n33.displayName).not.toMatch(/Funicular/i)
    expect(n33.legacyAliasAuditOnly).toMatch(/Funicular|Kulczewski/i)
    expect(n104.thematicAvailability).toBe('UNKNOWN')
    expect(n104.structuralAvailability).toBe('UNKNOWN')
    expect(n104.physicalStatus).toBe('PHYSICAL_PENDING_EDGE_ENRICHMENT')
    expect(n104.inventoryProvenance).toBe('FOUNDER_EXTENSION')
    const edges104 = graph.edges.filter((e) => e.from === 'STGO_104' || e.to === 'STGO_104')
    expect(edges104.length).toBeGreaterThan(0)
    for (const e of edges104) {
      expect(e.semanticLimitations?.join(' ') || '').toMatch(/UNKNOWN/)
      expect(e.narrativeDoesNotImplyPhysicalFeasibility).toBe(true)
      if (e.from === 'STGO_104') {
        expect(e.physicalRouteGenerationEligibleFrom).not.toBe(true)
      }
      if (e.to === 'STGO_104') {
        expect(e.physicalRouteGenerationEligibleTo).not.toBe(true)
      }
    }
  })

  it('scores thematic continuation, contrast, reveal, relief, and repetition penalty', () => {
    const civic = baseNode({ stgoId: 'A' })
    const civic2 = baseNode({
      stgoId: 'B',
      thematicVector: {
        T1A: 0.75,
        T1B: 0,
        T2: 0,
        T3: 0.35,
        T4: 0,
        T5: 0,
        T6: 0,
        T7: 0,
        T8: 0,
        T9: 0.15,
      },
    })
    const echo = scoreNarrativeEdge(civic, civic2, {
      relationType: 'thematic_echo',
      spatialDistanceM: 300,
      prerequisites: [],
      prerequisitesSatisfied: true,
      unresolvedPrerequisites: [],
      repetitionTags: ['theme_T1A'],
      repetitionTagsSeen: [],
      recentRelationTypes: [],
    })
    expect(echo.components.semanticContinuity).toBeGreaterThan(0.5)
    expect(echo.total).toBeGreaterThan(40)

    const rough = baseNode({
      stgoId: 'C',
      structuralMetrics: {
        heritage_depth: 0.2,
        anchor_density: 0.2,
        micro_reveal: 0.8,
        polish: 0.15,
      },
      tier: 'micro_reveal',
    })
    const contrast = scoreNarrativeEdge(civic, rough, {
      relationType: 'contrast',
      spatialDistanceM: 400,
      prerequisites: [],
      prerequisitesSatisfied: true,
      unresolvedPrerequisites: [],
      repetitionTags: [],
      repetitionTagsSeen: [],
      recentRelationTypes: [],
    })
    expect(contrast.components.contrastSurprise).toBeGreaterThan(0.4)

    const reveal = scoreNarrativeEdge(civic, rough, {
      relationType: 'reveal',
      spatialDistanceM: 250,
      prerequisites: ['has_anchor'],
      prerequisitesSatisfied: true,
      unresolvedPrerequisites: [],
      repetitionTags: ['micro_reveal'],
      repetitionTagsSeen: [],
      recentRelationTypes: [],
    })
    expect(reveal.components.revealValue).toBeGreaterThan(0.5)

    const green = baseNode({
      stgoId: 'D',
      thematicVector: {
        T1A: 0.1,
        T1B: 0,
        T2: 0,
        T3: 0.2,
        T4: 0,
        T5: 0.85,
        T6: 0,
        T7: 0.4,
        T8: 0.2,
        T9: 0,
      },
      structuralMetrics: {
        heritage_depth: 0.3,
        anchor_density: 0.2,
        micro_reveal: 0.3,
        polish: 0.25,
      },
    })
    const relief = scoreNarrativeEdge(civic, green, {
      relationType: 'relief',
      spatialDistanceM: 500,
      prerequisites: [],
      prerequisitesSatisfied: true,
      unresolvedPrerequisites: [],
      repetitionTags: [],
      repetitionTagsSeen: [],
      recentRelationTypes: [],
    })
    expect(relief.components.reliefValue).toBeGreaterThan(0.4)

    const repeated = scoreNarrativeEdge(civic, civic2, {
      relationType: 'thematic_echo',
      spatialDistanceM: 300,
      prerequisites: [],
      prerequisitesSatisfied: true,
      unresolvedPrerequisites: [],
      repetitionTags: ['theme_T1A'],
      repetitionTagsSeen: ['theme_T1A', 'theme_T1A'],
      recentRelationTypes: ['thematic_echo', 'thematic_echo'],
    })
    expect(repeated.components.repetitionPenalty).toBeGreaterThan(0.3)
    expect(repeated.total).toBeLessThan(echo.total)
  })

  it('handles prerequisite satisfaction and unresolved prerequisites', () => {
    const a = baseNode({ stgoId: 'A' })
    const b = baseNode({ stgoId: 'B' })
    const ok = scoreNarrativeEdge(
      a,
      b,
      {
        relationType: 'deepens_context',
        spatialDistanceM: 200,
        prerequisites: ['theme:T1A'],
        prerequisitesSatisfied: true,
        unresolvedPrerequisites: [],
        repetitionTags: [],
        repetitionTagsSeen: [],
        recentRelationTypes: [],
      },
    )
    const bad = scoreNarrativeEdge(
      a,
      b,
      {
        relationType: 'deepens_context',
        spatialDistanceM: 200,
        prerequisites: ['theme:T1A'],
        prerequisitesSatisfied: false,
        unresolvedPrerequisites: ['theme:T1A'],
        repetitionTags: [],
        repetitionTagsSeen: [],
        recentRelationTypes: [],
      },
    )
    expect(ok.components.prerequisiteSatisfaction).toBe(1)
    expect(bad.components.prerequisiteSatisfaction).toBe(0)
    expect(bad.total).toBeLessThan(ok.total)
    expect(bad.negativeFactors.join(' ')).toMatch(/unresolved prerequisites/)
  })

  it('does not coerce UNKNOWN semantics to zero in similarity or scoring', () => {
    const known = baseNode({ stgoId: 'A' })
    const unknown = baseNode({
      stgoId: 'STGO_104',
      thematicVector: {
        T1A: null,
        T1B: null,
        T2: null,
        T3: null,
        T4: null,
        T5: null,
        T6: null,
        T7: null,
        T8: null,
        T9: null,
      },
      structuralMetrics: {
        heritage_depth: null,
        anchor_density: null,
        micro_reveal: null,
        polish: null,
      },
      thematicAvailability: 'UNKNOWN',
      structuralAvailability: 'UNKNOWN',
    })
    expect(themeSimilarity(known.thematicVector, unknown.thematicVector)).toBeNull()
    const scored = scoreNarrativeEdge(known, unknown, {
      relationType: 'material_transition',
      spatialDistanceM: 120,
      prerequisites: [],
      prerequisitesSatisfied: true,
      unresolvedPrerequisites: [],
      repetitionTags: ['unknown_semantics'],
      repetitionTagsSeen: [],
      recentRelationTypes: [],
    })
    expect(scored.components.semanticContinuity).toBeNull()
    expect(scored.unavailableComponents).toContain('semanticContinuity')
    expect(scored.negativeFactors.join(' ')).toMatch(/UNKNOWN/)
  })

  it('marks AI_PROPOSED_UNVERIFIED provenance on pending causal edges', () => {
    const causal = graph.edges.filter((e) => e.relationType === 'causal_followup')
    expect(causal.length).toBeGreaterThan(0)
    for (const e of causal) {
      expect(e.runtimeEligible).toBe(false)
      expect(e.runtimeExclusionReason).toBe('NON_RUNTIME_PENDING_EDITORIAL_EVIDENCE')
      expect(e.confidence).toBe('LOW')
    }
    expect(graph.qa.withheldUnsupportedCausalEdges).toBeGreaterThan(0)
    expect(graph.nonRuntimePendingEvidenceCount).toBeGreaterThan(0)
  })

  it('narrative desirability does not override physical ineligibility', () => {
    const nodes = loadLaunchNodes(ROOT)
    const n104 = nodes.find((n) => n.stgoId === 'STGO_104')!
    expect(n104.physicalRouteGenerationEligible).toBe(false)
    const edge = graph.edges.find((e) => e.from === 'STGO_104' || e.to === 'STGO_104')!
    expect(edge.score.total).toBeGreaterThan(0)
    expect(edge.narrativeDoesNotImplyPhysicalFeasibility).toBe(true)
    if (edge.from === 'STGO_104') expect(edge.physicalRouteGenerationEligibleFrom).not.toBe(true)
    if (edge.to === 'STGO_104') expect(edge.physicalRouteGenerationEligibleTo).not.toBe(true)
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
  })

  it('uses deterministic tie behavior and has no runtime LLM dependency', () => {
    const cmp = compareNarrativeScores(
      { total: 50, relationType: 'contrast', from: 'STGO_02', to: 'STGO_01' },
      { total: 50, relationType: 'contrast', from: 'STGO_01', to: 'STGO_02' },
    )
    expect(cmp).toBeGreaterThan(0) // STGO_01 before STGO_02 when totals equal after relation tie
    const a = scoreNarrativeEdge(baseNode({ stgoId: 'A' }), baseNode({ stgoId: 'B' }), {
      relationType: 'sets_up',
      spatialDistanceM: 200,
      prerequisites: [],
      prerequisitesSatisfied: true,
      unresolvedPrerequisites: [],
      repetitionTags: [],
      repetitionTagsSeen: [],
      recentRelationTypes: [],
    })
    const b = scoreNarrativeEdge(baseNode({ stgoId: 'A' }), baseNode({ stgoId: 'B' }), {
      relationType: 'sets_up',
      spatialDistanceM: 200,
      prerequisites: [],
      prerequisitesSatisfied: true,
      unresolvedPrerequisites: [],
      repetitionTags: [],
      repetitionTagsSeen: [],
      recentRelationTypes: [],
    })
    expect(a).toEqual(b)
    expect(Object.keys(NARRATIVE_EDGE_SCORE_WEIGHTS).length).toBe(9)
    const src = readFileSync(resolve(ROOT, 'src/engine/narrative/narrative-edge-score.ts'), 'utf8')
    expect(src).not.toMatch(/openai|anthropic|fetch\(/i)
    expect(src).toMatch(/No runtime LLM/)
  })

  it('ArcState transitions accumulate themes, questions, and repetition tags', () => {
    let state = createEmptyArcState()
    state = applyNarrativeEdgeToArcState(state, {
      edge: {
        to: 'STGO_01',
        relationType: 'sets_up',
        themesSupported: ['T1A'],
        antiRepetitionTags: ['setup_chain'],
        narrativeHooksSupported: ['setup_theme'],
        optionalQuestionOpened: 'what_else_in_T1A',
        optionalQuestionResolved: null,
      },
      toTier: 'canonical_anchor',
      toEditorialRole: 'anchor',
    })
    expect(state.themesSeen).toContain('T1A')
    expect(state.questionsOpened).toContain('what_else_in_T1A')
    expect(state.anchorCount).toBe(1)
    expect(state.repetitionTagsSeen).toContain('setup_chain')
    expect(state.routeStepIndex).toBe(1)

    const prereq = prerequisitesSatisfied(state, ['theme:T1A', 'theme:T5'])
    expect(prereq.satisfied).toBe(false)
    expect(prereq.unresolved).toEqual(['theme:T5'])

    state = applyNarrativeEdgeToArcState(state, {
      edge: {
        to: 'STGO_07',
        relationType: 'deepens_context',
        themesSupported: ['T1B'],
        antiRepetitionTags: ['theme_T1B'],
        narrativeHooksSupported: ['deepen_theme'],
        optionalQuestionOpened: null,
        optionalQuestionResolved: 'what_else_in_T1A',
      },
      toTier: 'thematic_pocket',
    })
    expect(state.questionsResolved).toContain('what_else_in_T1A')
    expect(state.questionsOpened).not.toContain('what_else_in_T1A')
    expect(state.lastRelationType).toBe('deepens_context')

    const signals = computeArcSignals(state)
    expect(signals.arcQualityComplete).toBe(false)
    expect(signals.themeDiversity).toBeGreaterThan(0)
    expect(signals.openingStrength).toBeGreaterThan(0)
  })

  it('runtime-eligible edges expose explainability and provisional metadata stays unapproved', () => {
    const runtime = runtimeEligibleEdges(graph)
    expect(runtime.length).toBe(graph.runtimeEligibleEdgeCount)
    expect(runtime.length).toBeGreaterThan(20)
    for (const e of runtime.slice(0, 15)) {
      expect(e.explainability.whyLinked.length).toBeGreaterThan(20)
      expect(e.explainability.whyThisRelationType.length).toBeGreaterThan(10)
      expect(e.explainability.scoreBreakdown.total).toBe(e.score.total)
      expect(e.explainability.provenance).toBeTruthy()
    }
    expect(graph.calibrationApproved).toBe(false)
    expect(EDITORIAL_CALIBRATION_CURATOR_APPROVED).toBe(false)
    // Prevent accidental promotion strings in artifact
    const raw = readFileSync(GRAPH_PATH, 'utf8')
    expect(raw).toContain('"calibrationApproved": false')
    expect(raw).not.toMatch(/"calibrationApproved": true/)
    expect(raw).toContain('"calibrationStatus": "PROVISIONAL"')
  })

  it('launch editorial values remain the semantic source for graph nodes', () => {
    const by = new Map(launch.records.map((r) => [r.stgoId, r]))
    for (const n of graph.nodes) {
      const src = by.get(n.stgoId)!
      expect(n.displayName).toBe(src.displayName)
      expect(src.launchCorpus).toBe(true)
    }
  })
})
