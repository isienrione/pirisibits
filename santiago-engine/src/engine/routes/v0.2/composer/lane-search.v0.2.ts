/**
 * Gate 2E.2E substrate — lane-specific beam search using V0.2 NextStopValue.
 * Reuses V0.1 physical graph, eligibility, and narrative edges. Does not modify V0.1 composer.
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
import type { EngineNodeRecord, NodeUtilityResult } from '@/src/engine/types'
import type { ThemeCode } from '@/src/lib/city-graph/types'
import { outgoingTransitions } from '@/src/engine/routes/route-physical'
import { explainInclusion, explainOmission } from '@/src/engine/routes/route-explain'
import { classifyStructure } from '@/src/engine/routes/route-score'
import type {
  OmittedNodeReason,
  PhysicalTransition,
  RouteCandidateV01,
  RouteInputVersions,
  RouteRequestV01,
  RouteStopV01,
} from '@/src/engine/routes/route-types'
import { hashRouteRequest } from '@/src/engine/routes/route-request'
import type { RouteStateContext } from '@/src/engine/scoring/v0.2/scoring-types'
import { RECENT_ROUTE_WINDOW } from '@/src/engine/scoring/v0.2/scoring-config'
import { clamp01, round1 } from '@/src/engine/scoring/v0.2/utils'
import type { ScoringSessionV02 } from '@/src/engine/routes/v0.2/composer/scoring-session.v0.2'
import type { LaneObjectiveWeights } from '@/src/engine/routes/v0.2/composer/composer-config.v0.2'
import { LANE_CONFIG_VERSION } from '@/src/engine/routes/v0.2/composer/composer-config.v0.2'
import type {
  ComposerLane,
  LaneCandidateV02,
  LaneStopScore,
  NextStopValueBreakdown,
} from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'
import {
  composerScoreFromStops,
  computeNextStopValue,
} from '@/src/engine/routes/v0.2/composer/next-stop-value.v0.2'
import { prepareSearchContext, type SearchContext } from '@/src/engine/routes/route-search'

function dwellMinutes(node: EngineNodeRecord): { min: number; provenance: string; assumption: boolean } {
  const typical = node.visitDurationMinutes ?? node.visitTimeTypical ?? null
  if (typical != null && Number.isFinite(typical)) {
    return { min: Number(typical), provenance: ASSUMPTION_VISIT_TIME_PROVENANCE, assumption: true }
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

function buildOmitted(ctx: SearchContext, used: Set<string>): OmittedNodeReason[] {
  const omitted: OmittedNodeReason[] = []
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
      }),
    )
  }
  return omitted.slice(0, 12)
}

function timeFitCompleted(elapsed: number, budget: number): number {
  const utilization = elapsed / Math.max(1, budget)
  const over = Math.max(0, elapsed - budget - ROUTE_SEARCH_CONFIG.timeToleranceMin)
  const underFill = utilization < 0.7 ? clamp01((0.7 - utilization) / 0.7) : 0
  return round1(clamp01(1 - over / Math.max(15, budget) - underFill * 0.85) * 100)
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
  stopScores: LaneStopScore[]
  routeThemes: ThemeCode[]
  anchorCount: number
  pocketCount: number
  microCount: number
}

function routeStateForExpansion(
  state: BeamState,
  prevId: string,
  transition: PhysicalTransition,
  narrScore: number | null,
): RouteStateContext {
  return {
    arcState: state.arc,
    routeSoFarStgoIds: state.path,
    routeThemes: state.routeThemes,
    anchorCount: state.anchorCount,
    pocketCount: state.pocketCount,
    microCount: state.microCount,
    recentStgoIds: state.path.slice(-RECENT_ROUTE_WINDOW),
    prevStgoId: prevId,
    narrativeEdgeScore: narrScore,
    transitionDistanceM: transition.distanceM,
    transitionDurationMin: transition.durationMin,
    transitionFeasible: true,
    geographicEvidenceAvailable: transition.distanceM != null,
    bearingReversal: null,
  }
}

function themesOf(utility: NodeUtilityResult): ThemeCode[] {
  return [...(utility.matchedThemes || [])]
}

export function searchLaneBestCandidate(args: {
  request: RouteRequestV01
  ctx: SearchContext
  session: ScoringSessionV02
  lane: ComposerLane | 'H1'
  weights: LaneObjectiveWeights
  composerModelVersion: string
}): LaneCandidateV02 | null {
  const { request, ctx, session, lane, weights, composerModelVersion } = args
  if (request.start.kind !== 'STGO_ID') return null
  const startId = request.start.stgoId
  const startNode = ctx.nodesById.get(startId)
  if (!startNode || !ctx.physicallyUsableIds.has(startId)) return null
  const startUtility = ctx.utilityById.get(startId)
  if (!startUtility) return null

  const startDwell = dwellMinutes(startNode)
  let startArc = createEmptyArcState()
  const startStruct = classifyStructure(startNode.tierNormalized || startNode.tier, startNode.editorialRole)
  startArc = {
    ...startArc,
    recentPOIs: [startId],
    routeStepIndex: 1,
    anchorCount: startStruct === 'anchor' ? 1 : 0,
    microRevealCount: startStruct === 'micro' ? 1 : 0,
    themesSeen: themesOf(startUtility),
    themesDominant: themesOf(startUtility).slice(0, 3),
  }

  const startBundle = session.evaluate({
    stgoId: startId,
    displayName: startNode.displayName || startId,
    traveler: request.traveler,
    routeIntent: request.routeIntent,
    routeState: {
      arcState: startArc,
      routeSoFarStgoIds: [],
      routeThemes: [],
      anchorCount: 0,
      pocketCount: 0,
      microCount: 0,
      recentStgoIds: [],
      routeIntent: request.routeIntent,
    },
  })
  if (!startBundle) return null
  const startNext = computeNextStopValue(startBundle, weights, null)

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
      pathScore: startNext.nextStopValue ?? 0,
      recentStructures: [startStruct],
      metroLineIds: [],
      metroTransfers: 0,
      warnings: startUtility.warnings.map((w) => w.message),
      assumptions: startDwell.assumption
        ? [`${startId} dwell=${startDwell.min}m provenance=${startDwell.provenance}`]
        : [],
      stopScores: [{ stgoId: startId, nextStop: startNext, bundle: startBundle }],
      routeThemes: themesOf(startUtility),
      anchorCount: startStruct === 'anchor' ? 1 : 0,
      pocketCount: startStruct === 'pocket' ? 1 : 0,
      microCount: startStruct === 'micro' ? 1 : 0,
    },
  ]

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

      const scored: Array<{ inc: number; state: BeamState }> = []
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

        const rs = routeStateForExpansion(state, fromId, t, narr?.score.total ?? null)
        rs.routeIntent = request.routeIntent
        const bundle = session.evaluate({
          stgoId: t.toStgoId,
          displayName: toNode.displayName || t.toStgoId,
          traveler: request.traveler,
          routeIntent: request.routeIntent,
          routeState: rs,
        })
        if (!bundle) continue
        const nextStop = computeNextStopValue(bundle, weights, t)
        if (nextStop.nextStopValue == null) continue

        const struct = classifyStructure(toNode.tierNormalized || toNode.tier, toNode.editorialRole)
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
            name: toNode.displayName || t.toStgoId,
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
          pathScore: state.pathScore + nextStop.nextStopValue,
          recentStructures: [...state.recentStructures, struct],
          metroLineIds: [...state.metroLineIds, ...t.metroLineIds],
          metroTransfers: state.metroTransfers + t.transferCount,
          warnings: [...state.warnings, ...util.warnings.map((w) => w.message)],
          assumptions: [
            ...state.assumptions,
            ...(dwell.assumption ? [`${t.toStgoId} dwell=${dwell.min}m provenance=${dwell.provenance}`] : []),
          ],
          stopScores: [...state.stopScores, { stgoId: t.toStgoId, nextStop, bundle }],
          routeThemes: [...state.routeThemes, ...themesOf(util)],
          anchorCount: state.anchorCount + (struct === 'anchor' ? 1 : 0),
          pocketCount: state.pocketCount + (struct === 'pocket' ? 1 : 0),
          microCount: state.microCount + (struct === 'micro' ? 1 : 0),
        }
        scored.push({ inc: nextStop.nextStopValue, state: newState })
      }

      scored.sort(
        (a, b) =>
          b.inc - a.inc ||
          a.state.elapsed - b.state.elapsed ||
          a.state.path.join().localeCompare(b.state.path.join()),
      )
      const keep = scored.slice(0, ROUTE_SEARCH_CONFIG.candidateExpansionLimit)
      if (!keep.length) {
        if (state.path.length >= ROUTE_SEARCH_CONFIG.minStops) completed.push(state)
      } else {
        nextBeam.push(...keep.map((x) => x.state))
      }
    }

    nextBeam.sort(
      (a, b) =>
        b.pathScore - a.pathScore || a.elapsed - b.elapsed || a.path.join().localeCompare(b.path.join()),
    )
    beam = nextBeam.slice(0, ROUTE_SEARCH_CONFIG.beamWidth)
    if (!beam.length) break
  }

  completed.push(...beam)
  const byPath = new Map<string, BeamState>()
  for (const s of completed) {
    if (s.path.length < ROUTE_SEARCH_CONFIG.minStops) continue
    if (s.elapsed > request.timeBudgetMin + ROUTE_SEARCH_CONFIG.timeToleranceMin) continue
    const key = s.path.join('>')
    const prev = byPath.get(key)
    if (!prev || s.pathScore > prev.pathScore) byPath.set(key, s)
  }

  const pool = [...byPath.values()]
    .map((s) => finalizeLaneCandidate(s, request, ctx, lane, weights, composerModelVersion))
    .sort(
      (a, b) =>
        b.composerScore - a.composerScore ||
        a.candidate.totalEstimatedMin - b.candidate.totalEstimatedMin ||
        a.candidate.routeId.localeCompare(b.candidate.routeId),
    )

  return pool[0] ?? null
}

function finalizeLaneCandidate(
  state: BeamState,
  request: RouteRequestV01,
  ctx: SearchContext,
  lane: ComposerLane | 'H1',
  weights: LaneObjectiveWeights,
  composerModelVersion: string,
): LaneCandidateV02 {
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

  const tf = timeFitCompleted(state.elapsed, request.timeBudgetMin)
  const composed = composerScoreFromStops(
    state.stopScores.map((s) => s.nextStop),
    tf,
  )
  const reqHash = hashRouteRequest(request)
  const used = new Set(state.path)
  const omitted = buildOmitted(ctx, used)
  const metroUsed = state.stops.some((s) => s.arrivalMode === 'METRO')
  const routeId = `v02_${lane}_${reqHash.slice(0, 8)}_${state.path.join('-')}`

  const candidate: RouteCandidateV01 = {
    routeId,
    rank: 1,
    status: state.path.length >= ROUTE_SEARCH_CONFIG.minStops ? 'OK' : 'PARTIAL',
    calibrationStatus: 'PROVISIONAL',
    calibrationApproved: false,
    engineUsingProvisionalEditorialCalibration: true,
    routeQualityStatus: 'PROVISIONAL_PRE_FOUNDER_CALIBRATION',
    physicalRouteGenerationEnabled: false,
    travelerSnapshot: request.traveler,
    requestSnapshot: request,
    requestHash: reqHash,
    inputVersions: inputVersions(),
    orderedStops: state.stops,
    totalEstimatedMin: round1(state.elapsed),
    dwellMin: round1(state.dwellTotal),
    movementMin: round1(state.moveTotal),
    timeBudgetMin: request.timeBudgetMin,
    budgetDeltaMin: round1(state.elapsed - request.timeBudgetMin),
    stopCount: state.path.length,
    anchorCount: state.anchorCount,
    thematicPocketCount: state.pocketCount,
    microRevealCount: state.microCount,
    dominantThemes,
    themeCoverage,
    physicalDistanceM: state.distanceM > 0 ? Math.round(state.distanceM) : null,
    metroUse: {
      used: metroUsed,
      lineIds: [...new Set(state.metroLineIds)].filter((l) => l !== 'L7'),
      transferCount: state.metroTransfers,
    },
    provisionalRouteScore: composed.score,
    scoreBreakdown: {
      nodeUtilityAvg: round1(
        state.stops.reduce((s, x) => s + x.nodeUtility, 0) / Math.max(1, state.stops.length),
      ),
      narrativeAvg: round1(
        (() => {
          const vals = state.stops.map((x) => x.narrativeEdgeScore).filter((x): x is number => x != null)
          return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 40
        })(),
      ),
      compositionFit: 0,
      arcSignal: 0,
      timeFit: tf,
      physicalEfficiency: round1(clamp01(1 - state.moveTotal / Math.max(state.elapsed, 1)) * 100),
      repetitionPenalty: 0,
      detourPenalty: 0,
      constraintRiskPenalty: 0,
      total: composed.score,
    },
    warnings: [...new Set(state.warnings)],
    assumptions: [...new Set(state.assumptions)],
    omittedHighUtilityNodes: omitted,
    tradeoffExplanation: `Lane ${lane} within-objective ComposerScore ${composed.score} (not a cross-lane utility).`,
  }

  return {
    originatingLane: lane,
    composerModelVersion,
    laneConfigVersion: LANE_CONFIG_VERSION,
    candidate,
    composerScore: composed.score,
    composerScoreIsCrossLaneUtility: false,
    stopScores: state.stopScores,
    objectiveWeights: weights,
    coverage: composed.coverage,
  }
}

export function prepareLaneSearchContext(
  launchNodes: EngineNodeRecord[],
  request: RouteRequestV01,
  root?: string,
): SearchContext {
  return prepareSearchContext(launchNodes, request, root)
}
