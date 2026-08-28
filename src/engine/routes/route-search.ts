/**
 * Gate 2C — constrained beam search over Launch30 physical + narrative graph.
 */

import {
  ASSUMPTION_VISIT_TIME_PROVENANCE,
  DEFAULT_DWELL_FALLBACK_MIN,
  ROUTE_COMPOSER_SOURCE_CHECKPOINT,
  ROUTE_SEARCH_CONFIG,
} from '@/src/engine/routes/route-config'
import {
  applyNarrativeEdgeToArcState,
  createEmptyArcState,
} from '@/src/engine/narrative/arc-state'
import type { ArcState, NarrativeEdge, NarrativeRelationType } from '@/src/engine/narrative/narrative-types'
import { loadLaunch30NarrativeGraph } from '@/src/engine/narrative/narrative-loader'
import { evaluateNodeEligibility } from '@/src/engine/eligibility/evaluateNodeEligibility'
import { scoreNodeUtility } from '@/src/engine/scoring/nodeUtility'
import type { EngineNodeRecord, NodeUtilityResult } from '@/src/engine/types'
import type { ThemeCode } from '@/src/lib/city-graph/types'
import {
  loadPhysicalGraphIndex,
  outgoingTransitions,
  type PhysicalGraphIndex,
} from '@/src/engine/routes/route-physical'
import { explainInclusion, explainOmission, explainTradeoff } from '@/src/engine/routes/route-explain'
import { classifyStructure, scoreCompletedRoute, scoreIncrementalExpansion } from '@/src/engine/routes/route-score'
import type {
  EligibilityGateNote,
  OmittedNodeReason,
  PhysicalTransition,
  RouteCandidateV01,
  RouteInputVersions,
  RouteRequestV01,
  RouteStopV01,
} from '@/src/engine/routes/route-types'
import { hashRouteRequest } from '@/src/engine/routes/route-request'

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function dwellMinutes(node: EngineNodeRecord): { min: number; provenance: string; assumption: boolean } {
  const typical = node.visitDurationMinutes ?? node.visitTimeTypical ?? null
  if (typical != null && Number.isFinite(typical)) {
    return {
      min: Number(typical),
      provenance: node.chronoWorthProvenance?.includes('AI')
        ? ASSUMPTION_VISIT_TIME_PROVENANCE
        : ASSUMPTION_VISIT_TIME_PROVENANCE,
      assumption: true,
    }
  }
  return { min: DEFAULT_DWELL_FALLBACK_MIN, provenance: 'DEFAULT_FALLBACK_NOT_OBSERVED', assumption: true }
}

function bestNarrativeEdge(
  edgesByFrom: Map<string, NarrativeEdge[]>,
  fromId: string,
  toId: string,
): NarrativeEdge | null {
  const list = (edgesByFrom.get(fromId) || []).filter((e) => e.to === toId && e.runtimeEligible)
  if (!list.length) return null
  return [...list].sort((a, b) => b.score.total - a.score.total || a.relationType.localeCompare(b.relationType))[0]!
}

type BeamState = {
  path: string[]
  elapsed: number
  dwellTotal: number
  moveTotal: number
  distanceM: number
  arc: ArcState
  stops: RouteStopV01[]
  pathScore: number
  recentStructures: Array<'anchor' | 'pocket' | 'micro' | 'other'>
  metroLineIds: string[]
  metroTransfers: number
  warnings: string[]
  assumptions: string[]
}

function inputVersions(): RouteInputVersions {
  return {
    gate: '2C',
    sourceCheckpointSha: ROUTE_COMPOSER_SOURCE_CHECKPOINT,
    launchCorpusArtifact: 'src/data/santiago/santiago_launch_corpus.v0.1.json',
    editorialCalibrationArtifact:
      'src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json',
    narrativeGraphArtifact: 'src/data/santiago/narrative/santiago_launch30_narrative_graph.proposed.v0.1.json',
    pedestrianAdjacencyArtifact: 'src/data/santiago/santiago_pedestrian_adjacency.v0.2.json',
    multimodalGraphArtifact: 'src/data/santiago/santiago_multimodal_graph.v0.3.json',
    engineNodesArtifact: 'src/data/santiago/santiago_engine_nodes.v0.1.json',
    narrativeGraphCalibrationStatus: 'PROVISIONAL',
    curatorApproved: false,
  }
}

export type SearchContext = {
  nodesById: Map<string, EngineNodeRecord>
  utilityById: Map<string, NodeUtilityResult>
  eligibilityNotes: EligibilityGateNote[]
  physical: PhysicalGraphIndex
  narrativeByFrom: Map<string, NarrativeEdge[]>
  physicallyUsableIds: Set<string>
  editorialButPhysicalPending: string[]
}

export function prepareSearchContext(
  launchNodes: EngineNodeRecord[],
  request: RouteRequestV01,
  root?: string,
): SearchContext {
  const physical = loadPhysicalGraphIndex(root)
  const narrative = loadLaunch30NarrativeGraph(root)
  const narrativeByFrom = new Map<string, NarrativeEdge[]>()
  for (const e of narrative.edges) {
    const list = narrativeByFrom.get(e.from) || []
    list.push(e)
    narrativeByFrom.set(e.from, list)
  }

  const traveler = request.traveler
  const context = {
    launchCorpusOnly: true,
    remainingTimeBudgetMinutes: request.timeBudgetMin,
    now: request.nightContext ? new Date('2026-01-15T22:00:00-03:00') : new Date('2026-01-15T11:00:00-03:00'),
  }

  const nodesById = new Map(launchNodes.map((n) => [n.stgoId, n]))
  const utilityById = new Map<string, NodeUtilityResult>()
  const eligibilityNotes: EligibilityGateNote[] = []
  const physicallyUsableIds = new Set<string>()
  const editorialButPhysicalPending: string[] = []

  for (const node of launchNodes) {
    const eligibility = evaluateNodeEligibility(node, traveler, context)
    const utility = scoreNodeUtility(node, traveler, context)
    utilityById.set(node.stgoId, utility)

    const physicalPending =
      node.stgoId === 'STGO_104' ||
      String(node.launchPhysicalReadiness || '').includes('PENDING') ||
      node.physicalRouteGenerationEligible === false

    const physicallyUsable =
      eligibility.eligible &&
      node.physicalRouteGenerationEligible === true &&
      physical.physicallyEligibleIds.has(node.stgoId)

    if (physicallyUsable) physicallyUsableIds.add(node.stgoId)

    if (
      !eligibility.hardFailures.some((f) => f.code === 'RUNTIME_EXCLUDED' || f.code === 'NOT_LAUNCH_CORPUS') &&
      physicalPending &&
      node.launchCorpus
    ) {
      // Editorial interest but not physically routable
      if (node.physicalRouteGenerationEligible === false) {
        editorialButPhysicalPending.push(node.stgoId)
      }
    }

    eligibilityNotes.push({
      stgoId: node.stgoId,
      eligibility,
      utility,
      physicallyUsable,
      editorialButPhysicalPending: editorialButPhysicalPending.includes(node.stgoId),
    })
  }

  return {
    nodesById,
    utilityById,
    eligibilityNotes,
    physical,
    narrativeByFrom,
    physicallyUsableIds,
    editorialButPhysicalPending: [...new Set(editorialButPhysicalPending)],
  }
}

function buildOmitted(
  ctx: SearchContext,
  used: Set<string>,
  request: RouteRequestV01,
): OmittedNodeReason[] {
  const omitted: OmittedNodeReason[] = []
  // Always surface physical-pending Launch nodes first when not used.
  for (const sid of ['STGO_104', 'STGO_33']) {
    if (used.has(sid)) continue
    const node = ctx.nodesById.get(sid)
    if (!node) continue
    const note = ctx.eligibilityNotes.find((n) => n.stgoId === sid)
    omitted.push(
      explainOmission({
        stgoId: sid,
        displayName: node.displayName,
        nodeUtility: note?.utility?.utility ?? null,
        reasonCode: sid === 'STGO_104' ? 'PHYSICAL_STATUS_PENDING' : 'PHYSICAL_INELIGIBLE',
        detail:
          sid === 'STGO_104'
            ? 'Diagnostic: ELIGIBLE_EDITORIALLY_BUT_PHYSICAL_PENDING.'
            : 'Physical status pending regression / not runtime-ready.',
      }),
    )
  }
  const ranked = [...ctx.eligibilityNotes].sort(
    (a, b) => (b.utility?.utility ?? 0) - (a.utility?.utility ?? 0) || a.stgoId.localeCompare(b.stgoId),
  )
  for (const note of ranked) {
    if (used.has(note.stgoId)) continue
    if (omitted.some((o) => o.stgoId === note.stgoId)) continue
    const node = ctx.nodesById.get(note.stgoId)!
    const util = note.utility?.utility ?? null
    if (util != null && util < 25) continue
    const fail = note.eligibility.hardFailures[0]
    if (fail?.code === 'PHYSICAL_INELIGIBLE') {
      omitted.push(explainOmission({ stgoId: note.stgoId, displayName: node.displayName, nodeUtility: util, reasonCode: 'PHYSICAL_INELIGIBLE' }))
      continue
    }
    if (fail?.code === 'EXPLICIT_SENSITIVE_MEMORY_WITHOUT_OPT_IN') {
      omitted.push(explainOmission({ stgoId: note.stgoId, displayName: node.displayName, nodeUtility: util, reasonCode: 'SENSITIVE_MEMORY_OPT_IN_MISSING' }))
      continue
    }
    if (fail?.code === 'EXPLICIT_ACCESSIBILITY_INCOMPATIBLE') {
      omitted.push(explainOmission({ stgoId: note.stgoId, displayName: node.displayName, nodeUtility: util, reasonCode: 'ACCESSIBILITY_CONSTRAINT' }))
      continue
    }
    if (fail) {
      omitted.push(explainOmission({ stgoId: note.stgoId, displayName: node.displayName, nodeUtility: util, reasonCode: 'HARD_ELIGIBILITY', detail: fail.message }))
      continue
    }
    if (!note.physicallyUsable) {
      omitted.push(explainOmission({ stgoId: note.stgoId, displayName: node.displayName, nodeUtility: util, reasonCode: 'NO_FEASIBLE_TRANSITION' }))
      continue
    }
    if (util != null && util >= 40) {
      omitted.push(explainOmission({ stgoId: note.stgoId, displayName: node.displayName, nodeUtility: util, reasonCode: 'NOT_EXPANDED_IN_BEAM' }))
    }
  }
  void request
  return omitted.slice(0, 12)
}

function finalizeCandidate(
  state: BeamState,
  request: RouteRequestV01,
  ctx: SearchContext,
  routeHashSeed: string,
  rankHint: number,
): RouteCandidateV01 {
  const themes = new Map<ThemeCode, number>()
  for (const id of state.path) {
    const u = ctx.utilityById.get(id)
    for (const t of u?.matchedThemes || []) themes.set(t, (themes.get(t) || 0) + 1)
  }
  const themeCoverage = [...themes.keys()].sort()
  const dominantThemes = [...themes.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([t]) => t)

  let anchorCount = 0
  let thematicPocketCount = 0
  let microRevealCount = 0
  for (const s of state.stops) {
    const k = classifyStructure(s.tier, s.editorialRole)
    if (k === 'anchor') anchorCount += 1
    if (k === 'pocket') thematicPocketCount += 1
    if (k === 'micro') microRevealCount += 1
  }

  const breakdown = scoreCompletedRoute({
    stops: state.stops.map((s) => ({
      nodeUtility: s.nodeUtility,
      narrativeEdgeScore: s.narrativeEdgeScore,
      transitionTimeMin: s.transitionTimeMin,
      tier: s.tier,
      editorialRole: s.editorialRole,
    })),
    totalEstimatedMin: state.elapsed,
    timeBudgetMin: request.timeBudgetMin,
    arcState: state.arc,
    metroTransferCount: state.metroTransfers,
  })

  const used = new Set(state.path)
  const omitted = buildOmitted(ctx, used, request)
  const metroUsed = state.stops.some((s) => s.arrivalMode === 'METRO')
  const routeId = `prov_${routeHashSeed}_${state.path.join('-')}_${Math.round(breakdown.total * 10)}`

  return {
    routeId,
    rank: rankHint,
    status: state.path.length >= ROUTE_SEARCH_CONFIG.minStops ? 'OK' : 'PARTIAL',
    calibrationStatus: 'PROVISIONAL',
    calibrationApproved: false,
    engineUsingProvisionalEditorialCalibration: true,
    routeQualityStatus: 'PROVISIONAL_PRE_FOUNDER_CALIBRATION',
    physicalRouteGenerationEnabled: false,
    travelerSnapshot: request.traveler,
    requestSnapshot: request,
    requestHash: hashRouteRequest(request),
    inputVersions: inputVersions(),
    orderedStops: state.stops,
    totalEstimatedMin: round1(state.elapsed),
    dwellMin: round1(state.dwellTotal),
    movementMin: round1(state.moveTotal),
    timeBudgetMin: request.timeBudgetMin,
    budgetDeltaMin: round1(state.elapsed - request.timeBudgetMin),
    stopCount: state.path.length,
    anchorCount,
    thematicPocketCount,
    microRevealCount,
    dominantThemes,
    themeCoverage,
    physicalDistanceM: state.distanceM > 0 ? Math.round(state.distanceM) : null,
    metroUse: {
      used: metroUsed,
      lineIds: [...new Set(state.metroLineIds)].filter((l) => l !== 'L7'),
      transferCount: state.metroTransfers,
    },
    provisionalRouteScore: breakdown.total,
    scoreBreakdown: breakdown,
    warnings: [...new Set(state.warnings)],
    assumptions: [...new Set(state.assumptions)],
    omittedHighUtilityNodes: omitted,
    tradeoffExplanation: explainTradeoff({
      rank: rankHint,
      intent: request.routeIntent,
      score: breakdown.total,
      stopCount: state.path.length,
      metroUsed,
    }),
  }
}

function makeStop(args: {
  node: EngineNodeRecord
  utility: NodeUtilityResult
  sequenceIndex: number
  transition: PhysicalTransition | null
  dwell: { min: number; provenance: string; assumption: boolean }
  cumulative: number
  relation: NarrativeRelationType | null
  narrativeScore: number | null
  narrativeEdgeId: string | null
  arcAfter: ArcState
  explanation: string
}): RouteStopV01 {
  return {
    stgoId: args.node.stgoId,
    name: args.node.displayName || args.node.stgoId,
    sequenceIndex: args.sequenceIndex,
    tier: args.node.tierNormalized || args.node.tier,
    editorialRole: args.node.editorialRole,
    nodeUtility: args.utility.utility,
    nodeUtilityBreakdown: args.utility.components,
    yourMatch: args.utility.yourMatch,
    arrivalMode: args.transition?.mode || 'START',
    transition: args.transition,
    transitionTimeMin: args.transition?.durationMin ?? 0,
    estimatedDwellMin: args.dwell.min,
    dwellProvenance: args.dwell.provenance,
    cumulativeTimeMin: round1(args.cumulative),
    narrativeRelationFromPrevious: args.relation,
    narrativeEdgeScore: args.narrativeScore,
    narrativeEdgeId: args.narrativeEdgeId,
    arcStateAfter: args.arcAfter,
    inclusionExplanation: args.explanation,
    eligibilityWarnings: args.utility.warnings.map((w) => w.code),
  }
}

/**
 * Constrained beam search. Returns unscored-rank pool for diversity selection.
 */
export function runRouteBeamSearch(
  request: RouteRequestV01,
  launchNodes: EngineNodeRecord[],
  root?: string,
): {
  pool: RouteCandidateV01[]
  diagnostics: {
    eligibleCandidateCount: number
    physicallyUsableCandidateCount: number
    editorialButPhysicalPending: string[]
    beamStatesExpanded: number
    beamStatesPruned: number
  }
} {
  if (request.start.kind !== 'STGO_ID') {
    return {
      pool: [],
      diagnostics: {
        eligibleCandidateCount: 0,
        physicallyUsableCandidateCount: 0,
        editorialButPhysicalPending: [],
        beamStatesExpanded: 0,
        beamStatesPruned: 0,
      },
    }
  }

  const ctx = prepareSearchContext(launchNodes, request, root)
  const startId = request.start.stgoId
  const startNode = ctx.nodesById.get(startId)
  if (!startNode || !ctx.physicallyUsableIds.has(startId)) {
    return {
      pool: [],
      diagnostics: {
        eligibleCandidateCount: ctx.eligibilityNotes.filter((n) => n.eligibility.eligible).length,
        physicallyUsableCandidateCount: ctx.physicallyUsableIds.size,
        editorialButPhysicalPending: ctx.editorialButPhysicalPending,
        beamStatesExpanded: 0,
        beamStatesPruned: 0,
      },
    }
  }

  const startUtility = ctx.utilityById.get(startId)!
  const startDwell = dwellMinutes(startNode)
  let startArc = createEmptyArcState()
  // Seed arc with start visit (no edge)
  startArc = {
    ...startArc,
    recentPOIs: [startId],
    routeStepIndex: 1,
    anchorCount: classifyStructure(startNode.tierNormalized || startNode.tier, startNode.editorialRole) === 'anchor' ? 1 : 0,
    microRevealCount: classifyStructure(startNode.tierNormalized || startNode.tier, startNode.editorialRole) === 'micro' ? 1 : 0,
    themesSeen: [...(startUtility.matchedThemes || [])],
    themesDominant: [...(startUtility.matchedThemes || [])].slice(0, 3),
  }

  const startStop = makeStop({
    node: startNode,
    utility: startUtility,
    sequenceIndex: 0,
    transition: null,
    dwell: startDwell,
    cumulative: startDwell.min,
    relation: null,
    narrativeScore: null,
    narrativeEdgeId: null,
    arcAfter: startArc,
    explanation: explainInclusion({
      name: startNode.displayName || startId,
      matchedThemes: startUtility.matchedThemes,
      nodeUtility: startUtility.utility,
      relationType: null,
      tier: startNode.tierNormalized || startNode.tier,
      role: startNode.editorialRole,
      recentStructures: [],
      remainingBudgetMin: request.timeBudgetMin - startDwell.min,
      transition: null,
      isStart: true,
    }),
  })

  let beam: BeamState[] = [
    {
      path: [startId],
      elapsed: startDwell.min,
      dwellTotal: startDwell.min,
      moveTotal: 0,
      distanceM: 0,
      arc: startArc,
      stops: [startStop],
      pathScore: startUtility.utility,
      recentStructures: [classifyStructure(startNode.tierNormalized || startNode.tier, startNode.editorialRole)],
      metroLineIds: [],
      metroTransfers: 0,
      warnings: [
        ...startUtility.warnings.map((w) => w.message),
        ...(startDwell.assumption ? [`Visit/dwell time for ${startId} is provisional (${startDwell.provenance})`] : []),
      ],
      assumptions: startDwell.assumption ? [`${startId} dwell=${startDwell.min}m provenance=${startDwell.provenance}`] : [],
    },
  ]

  let expanded = 0
  let pruned = 0
  const completed: BeamState[] = []
  const maxStops = Math.min(
    ROUTE_SEARCH_CONFIG.maxStops,
    request.desiredStopCount && request.desiredStopCount > 0 ? request.desiredStopCount : ROUTE_SEARCH_CONFIG.maxStops,
  )

  for (let depth = 1; depth < maxStops; depth += 1) {
    const nextBeam: BeamState[] = []
    for (const state of beam) {
      const remaining = request.timeBudgetMin + ROUTE_SEARCH_CONFIG.timeToleranceMin - state.elapsed
      if (remaining < 8) {
        completed.push(state)
        continue
      }
      const fromId = state.path[state.path.length - 1]!
      const transitions = outgoingTransitions(
        ctx.physical,
        fromId,
        request.transportPolicy,
        ctx.physicallyUsableIds,
      )
        .filter((t) => !state.path.includes(t.toStgoId))
        .slice(0, ROUTE_SEARCH_CONFIG.candidateExpansionLimit * 2)

      const scored: Array<{ t: PhysicalTransition; inc: number; state: BeamState }> = []
      for (const t of transitions) {
        if (t.metroLineIds.includes('L7')) continue
        const toNode = ctx.nodesById.get(t.toStgoId)
        if (!toNode) continue
        const util = ctx.utilityById.get(t.toStgoId)
        if (!util || !util.eligible) continue
        const dwell = dwellMinutes(toNode)
        const add = t.durationMin + dwell.min
        if (state.elapsed + add > request.timeBudgetMin + ROUTE_SEARCH_CONFIG.timeToleranceMin) continue

        const narr = bestNarrativeEdge(ctx.narrativeByFrom, fromId, t.toStgoId)
        const relation = narr?.relationType ?? null
        let nextArc = state.arc
        if (narr) {
          nextArc = applyNarrativeEdgeToArcState(state.arc, {
            edge: narr,
            toTier: toNode.tierNormalized || toNode.tier,
            toEditorialRole: toNode.editorialRole,
          })
        } else {
          nextArc = {
            ...state.arc,
            recentPOIs: [...state.arc.recentPOIs, t.toStgoId].slice(-5),
            routeStepIndex: state.arc.routeStepIndex + 1,
            lastRelationType: null,
          }
        }

        const inc = scoreIncrementalExpansion({
          nodeUtility: util.utility,
          narrativeEdgeScore: narr?.score.total ?? null,
          transition: t,
          remainingBudgetMin: remaining - add,
          timeBudgetMin: request.timeBudgetMin,
          elapsedMin: state.elapsed,
          arcState: nextArc,
          relationType: relation,
          toTier: toNode.tierNormalized || toNode.tier,
          toRole: toNode.editorialRole,
          recentTiers: state.recentStructures,
          routeIntent: request.routeIntent,
          stepFreeWarning: util.warnings.some((w) => w.code === 'ACCESSIBILITY_UNKNOWN'),
        })

        const preferredBoost =
          request.preferredThemes?.some((th) => (util.matchedThemes || []).includes(th)) ? 4 : 0
        const avoidPenalty =
          request.avoidThemes?.some((th) => (util.matchedThemes || []).includes(th)) ? 8 : 0
        // Encourage filling budget when plenty of time remains.
        const fillBoost = remaining > request.timeBudgetMin * 0.45 ? 3 : 0

        const stop = makeStop({
          node: toNode,
          utility: util,
          sequenceIndex: state.stops.length,
          transition: t,
          dwell,
          cumulative: state.elapsed + add,
          relation,
          narrativeScore: narr?.score.total ?? null,
          narrativeEdgeId: narr?.edgeId ?? null,
          arcAfter: nextArc,
          explanation: explainInclusion({
            name: toNode.displayName || toNode.stgoId,
            matchedThemes: util.matchedThemes,
            nodeUtility: util.utility,
            relationType: relation,
            tier: toNode.tierNormalized || toNode.tier,
            role: toNode.editorialRole,
            recentStructures: state.recentStructures,
            remainingBudgetMin: remaining - add,
            transition: t,
            isStart: false,
          }),
        })

        const newState: BeamState = {
          path: [...state.path, t.toStgoId],
          elapsed: round1(state.elapsed + add),
          dwellTotal: round1(state.dwellTotal + dwell.min),
          moveTotal: round1(state.moveTotal + t.durationMin),
          distanceM: state.distanceM + (t.distanceM || 0),
          arc: nextArc,
          stops: [...state.stops, stop],
          pathScore: state.pathScore + inc.incremental + preferredBoost - avoidPenalty + fillBoost,
          recentStructures: [
            ...state.recentStructures,
            classifyStructure(toNode.tierNormalized || toNode.tier, toNode.editorialRole),
          ],
          metroLineIds: [...state.metroLineIds, ...t.metroLineIds],
          metroTransfers: state.metroTransfers + t.transferCount,
          warnings: [
            ...state.warnings,
            ...util.warnings.map((w) => w.message),
            ...(dwell.assumption ? [`Visit/dwell time for ${t.toStgoId} is provisional (${dwell.provenance})`] : []),
          ],
          assumptions: [
            ...state.assumptions,
            ...(dwell.assumption ? [`${t.toStgoId} dwell=${dwell.min}m provenance=${dwell.provenance}`] : []),
          ],
        }
        scored.push({ t, inc: inc.incremental + preferredBoost - avoidPenalty + fillBoost, state: newState })
        expanded += 1
      }

      scored.sort(
        (a, b) =>
          b.inc - a.inc ||
          a.state.elapsed - b.state.elapsed ||
          a.state.path.join().localeCompare(b.state.path.join()),
      )
      const keep = scored.slice(0, ROUTE_SEARCH_CONFIG.candidateExpansionLimit)
      pruned += Math.max(0, scored.length - keep.length)
      if (keep.length === 0) {
        if (state.path.length >= ROUTE_SEARCH_CONFIG.minStops) completed.push(state)
      } else {
        nextBeam.push(...keep.map((x) => x.state))
      }
    }

    nextBeam.sort(
      (a, b) =>
        b.pathScore - a.pathScore || a.elapsed - b.elapsed || a.path.join().localeCompare(b.path.join()),
    )
    const before = nextBeam.length
    beam = nextBeam.slice(0, ROUTE_SEARCH_CONFIG.beamWidth)
    pruned += Math.max(0, before - beam.length)
    if (!beam.length) break
  }

  completed.push(...beam)
  // Deduplicate by path
  const byPath = new Map<string, BeamState>()
  for (const s of completed) {
    if (s.path.length < ROUTE_SEARCH_CONFIG.minStops) continue
    if (s.elapsed > request.timeBudgetMin + ROUTE_SEARCH_CONFIG.timeToleranceMin) continue
    const key = s.path.join('>')
    const prev = byPath.get(key)
    if (!prev || s.pathScore > prev.pathScore) byPath.set(key, s)
  }

  const reqHash = hashRouteRequest(request)
  const pool = [...byPath.values()]
    .map((s, i) => finalizeCandidate(s, request, ctx, reqHash.slice(0, 8), i + 1))
    .sort(
      (a, b) =>
        b.provisionalRouteScore - a.provisionalRouteScore ||
        a.totalEstimatedMin - b.totalEstimatedMin ||
        a.routeId.localeCompare(b.routeId),
    )

  return {
    pool,
    diagnostics: {
      eligibleCandidateCount: ctx.eligibilityNotes.filter((n) => n.eligibility.eligible).length,
      physicallyUsableCandidateCount: ctx.physicallyUsableIds.size,
      editorialButPhysicalPending: ctx.editorialButPhysicalPending,
      beamStatesExpanded: expanded,
      beamStatesPruned: pruned,
    },
  }
}
