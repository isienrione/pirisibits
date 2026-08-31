/**
 * Gate 2E.6 — Deterministic multi-route Composer VNext (H2 frozen).
 */

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'
import { hashRouteRequest, normalizeRouteRequest, type RouteRequestInput } from '@/src/engine/routes/route-request'
import type { RouteRequestV01 } from '@/src/engine/routes/route-types'
import { evaluateNodeScoreV02 } from '@/src/engine/scoring/v0.2/evaluate-node-v02'
import { ROUTE_SEARCH_CONFIG } from '@/src/engine/routes/route-config'
import { loadPhysicalGraphIndex, outgoingTransitions } from '@/src/engine/routes/route-physical'
import { adaptLaunchCorpusToExperienceGraph } from '@/src/engine/vnext/place/legacy-adapter'
import { buildFeasibleExperienceGraph } from '@/src/engine/vnext/feasibility/feasible-experience-graph'
import {
  advanceArcState,
  computeIncrementalArcValue,
  initialArcStateVNext,
  type ArcStateVNext,
} from '@/src/engine/vnext/arc/arc-state-vnext'
import { assessRhythmWindow, rhythmScore01 } from '@/src/engine/vnext/rhythm/rhythm-controller'
import { evaluateExperienceTime, type TimeEvaluationMode } from '@/src/engine/vnext/time/experience-time-engine'
import type { ExperienceRecord } from '@/src/engine/vnext/place/types'
import type { EngineNodeRecord } from '@/src/engine/types'
import type { LiveTrace } from '@/src/engine/vnext/trace/live-trace'
import { appendTraceEvent, createLiveTrace } from '@/src/engine/vnext/trace/live-trace'

export type ComposerLaneVNext = 'SIGNATURE' | 'DISCOVERY' | 'FLOW'

export type CompositionStepRecord = {
  stepIndex: number
  phase: string
  budgetConsumedFrac: number
  remainingMin: number
  currentSequence: string[]
  candidatesConsidered: Array<{
    experienceId: string
    baseValue: number | null
    mrv: number | null
    transitionValue: number | null
    incrementalArcValue: number
    effectiveMarginalTime: number | null
    reason: string
  }>
  chosenExperienceId: string
  rhythmAssessment: string
  arcStateAfter: Pick<
    ArcStateVNext,
    'phase' | 'orientationSatisfied' | 'payoffSatisfied' | 'landingSatisfied' | 'repetitionLoad'
  >
}

export type VNextRouteCandidate = {
  lane: ComposerLaneVNext
  experienceIds: string[]
  stgoIds: string[]
  arcState: ArcStateVNext
  compositionSteps: CompositionStepRecord[]
  timeEvidenceMode: TimeEvaluationMode
  timeDisclosure: string[]
  totalEstimatedMin: number
  dwellMin: number
  movementMin: number
  fingerprint: string
}

export type ComposeVNextResult = {
  schemaVersion: 'santiago-composer-vnext.0.1'
  parallelOnly: true
  h2Frozen: true
  request: RouteRequestV01
  requestHash: string
  timeEvaluationMode: TimeEvaluationMode
  LEGACY_EXPERIENCE_ADAPTER: true
  candidates: VNextRouteCandidate[]
  feasibleCoverage: number
  excludedCount: number
  eligibleExperienceIds: string[]
  excluded: Array<{ experienceId: string; constraint: string; reason: string }>
  trace: LiveTrace
}

const ROOT_DEFAULT = resolve(__dirname, '../../../..')

const LANE_BLEND: Record<ComposerLaneVNext, { base: number; iav: number; mrv: number; transition: number }> = {
  SIGNATURE: { base: 0.45, iav: 0.2, mrv: 0.2, transition: 0.15 },
  DISCOVERY: { base: 0.25, iav: 0.3, mrv: 0.35, transition: 0.1 },
  FLOW: { base: 0.3, iav: 0.25, mrv: 0.15, transition: 0.3 },
}

function haversineMin(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000
  const toR = (d: number) => (d * Math.PI) / 180
  const dLat = toR(b.lat - a.lat)
  const dLng = toR(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2
  return (2 * R * Math.asin(Math.min(1, Math.sqrt(h)))) / 80
}

function asRequest(input: RouteRequestInput | RouteRequestV01): RouteRequestV01 {
  return (input as RouteRequestV01).schemaVersion === 'santiago-route-request.v0.1'
    ? (input as RouteRequestV01)
    : normalizeRouteRequest(input as RouteRequestInput)
}

function startId(request: RouteRequestV01): string | null {
  if (request.start.kind === 'STGO_ID') return request.start.stgoId
  return request.traveler.startingStgoId
}

function loadCoordsByStgoId(root: string): Map<string, { lat: number; lng: number }> {
  const raw = JSON.parse(
    readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
  )
  const map = new Map<string, { lat: number; lng: number }>()
  for (const n of raw.nodes ?? []) {
    const c = n.poiCoordinate ?? n.experiencePointCoordinate
    if (c?.lat != null && c?.lng != null) map.set(n.stgoId, { lat: c.lat, lng: c.lng })
  }
  return map
}

export function composeRoutesVNext(
  input: RouteRequestInput | RouteRequestV01,
  opts?: {
    root?: string
    nodes?: EngineNodeRecord[]
    timeMode?: TimeEvaluationMode
    maxStops?: number
  },
): ComposeVNextResult {
  const root = opts?.root ?? ROOT_DEFAULT
  const request = asRequest(input)
  const timeMode = opts?.timeMode ?? 'LEGACY_COMPATIBILITY'
  const nodes = opts?.nodes ?? loadLaunchNodes(root)
  const nodesById = new Map(nodes.map((n) => [n.stgoId, n]))
  const adapted = adaptLaunchCorpusToExperienceGraph(nodes)
  const feasible = buildFeasibleExperienceGraph({
    traveler: request.traveler,
    request,
    places: adapted.places,
    experiences: adapted.experiences,
    nodesByStgoId: nodesById,
  })
  const physIndex = loadPhysicalGraphIndex(root)
  const coordsById = loadCoordsByStgoId(root)
  const eligibleTargets = new Set(feasible.eligibleExperiences.map((e) => e.sourceStgoId!).filter(Boolean))

  const trace = createLiveTrace()
  appendTraceEvent(trace, {
    stage: 'TRAVELER_MODEL',
    decision: 'normalized',
    reasonComponents: {
      posture: request.traveler.discoveryPosture,
      budget: request.timeBudgetMin,
      intent: request.routeIntent,
    },
    unknowns: [],
    provenance: 'normalizeRouteRequest',
  })
  appendTraceEvent(trace, {
    stage: 'CONTEXT',
    decision: 'context_ready',
    reasonComponents: { transportPolicy: request.transportPolicy, start: startId(request) },
    unknowns: startId(request) ? [] : ['START_UNSUPPORTED'],
    provenance: 'RouteRequestV01',
  })
  appendTraceEvent(trace, {
    stage: 'HARD_FEASIBILITY',
    decision: 'feasible_graph_built',
    reasonComponents: {
      eligible: feasible.eligibleExperiences.length,
      excluded: feasible.excludedExperiences.length,
      coverage: feasible.coverage,
    },
    unknowns: feasible.unknownConstraints.slice(0, 20),
    provenance: 'buildFeasibleExperienceGraph',
  })

  const start = startId(request)
  const candidates: VNextRouteCandidate[] = []
  const empty = (): ComposeVNextResult => ({
    schemaVersion: 'santiago-composer-vnext.0.1',
    parallelOnly: true,
    h2Frozen: true,
    request,
    requestHash: hashRouteRequest(request),
    timeEvaluationMode: timeMode,
    LEGACY_EXPERIENCE_ADAPTER: true,
    candidates: [],
    feasibleCoverage: feasible.coverage,
    excludedCount: feasible.excludedExperiences.length,
    eligibleExperienceIds: feasible.eligibleExperiences.map((e) => e.experienceId),
    excluded: feasible.excludedExperiences.map((e) => ({
      experienceId: e.experienceId,
      constraint: e.constraint,
      reason: e.reason,
    })),
    trace,
  })
  if (!start) return empty()

  const eligibleByStgo = new Map<string, ExperienceRecord>()
  for (const e of feasible.eligibleExperiences) {
    if (e.sourceStgoId) eligibleByStgo.set(e.sourceStgoId, e)
  }

  appendTraceEvent(trace, {
    stage: 'EXPERIENCE_VALUE',
    decision: 'scoring_session_ready',
    reasonComponents: { eligibleStgo: eligibleByStgo.size },
    unknowns: [],
    provenance: 'evaluateNodeScoreV02',
  })

  for (const lane of ['SIGNATURE', 'DISCOVERY', 'FLOW'] as ComposerLaneVNext[]) {
    const built = searchLaneVNext({
      lane,
      request,
      start,
      eligibleByStgo,
      nodesById,
      root,
      timeMode,
      maxStops: opts?.maxStops ?? 8,
      weights: LANE_BLEND[lane],
      physIndex,
      eligibleTargets,
      coordsById,
      trace,
    })
    if (built) candidates.push(built)
  }

  appendTraceEvent(trace, {
    stage: 'CANDIDATE_COMPLETE',
    decision: `candidates=${candidates.length}`,
    reasonComponents: Object.fromEntries(candidates.map((c) => [c.lane, c.stgoIds.join('→')])),
    unknowns: [],
    provenance: 'composeRoutesVNext',
  })

  return {
    schemaVersion: 'santiago-composer-vnext.0.1',
    parallelOnly: true,
    h2Frozen: true,
    request,
    requestHash: hashRouteRequest(request),
    timeEvaluationMode: timeMode,
    LEGACY_EXPERIENCE_ADAPTER: true,
    candidates,
    feasibleCoverage: feasible.coverage,
    excludedCount: feasible.excludedExperiences.length,
    eligibleExperienceIds: feasible.eligibleExperiences.map((e) => e.experienceId),
    excluded: feasible.excludedExperiences.map((e) => ({
      experienceId: e.experienceId,
      constraint: e.constraint,
      reason: e.reason,
    })),
    trace,
  }
}

function searchLaneVNext(args: {
  lane: ComposerLaneVNext
  request: RouteRequestV01
  start: string
  eligibleByStgo: Map<string, ExperienceRecord>
  nodesById: Map<string, EngineNodeRecord>
  root: string
  timeMode: TimeEvaluationMode
  maxStops: number
  weights: { base: number; iav: number; mrv: number; transition: number }
  physIndex: ReturnType<typeof loadPhysicalGraphIndex>
  eligibleTargets: Set<string>
  coordsById: Map<string, { lat: number; lng: number }>
  trace: LiveTrace
}): VNextRouteCandidate | null {
  const startExp = args.eligibleByStgo.get(args.start)
  if (!startExp) return null

  let arc = initialArcStateVNext(null)
  const steps: CompositionStepRecord[] = []
  const sequence: string[] = [args.start]
  const experienceIds: string[] = [startExp.experienceId]
  const disclosures: string[] = []
  let elapsed = 0
  const dwells: number[] = []
  const moves: number[] = []

  const startTime = evaluateExperienceTime({
    experience: startExp,
    node: args.nodesById.get(args.start),
    mode: args.timeMode,
  })
  disclosures.push(...startTime.disclosure)
  const startDwell = startTime.stationaryDwell ?? 12
  dwells.push(startDwell)
  elapsed += startDwell
  arc = advanceArcState({
    currentState: arc,
    selectedExperience: startExp,
    selectedNarrativeRelation: null,
    elapsedTimeMin: elapsed,
    timeBudgetMin: args.request.timeBudgetMin,
    themes: [args.start],
  })

  const usedPlaces = new Set([startExp.placeId ?? args.start])

  while (sequence.length < args.maxStops) {
    const remaining = args.request.timeBudgetMin + ROUTE_SEARCH_CONFIG.timeToleranceMin - elapsed
    if (remaining < 8) break

    const last = sequence[sequence.length - 1]!
    const lastNode = args.nodesById.get(last)
    const lastCoord = args.coordsById.get(last) ?? null
    const phys = lastNode
      ? outgoingTransitions(
          args.physIndex,
          lastNode.stgoId,
          args.request.transportPolicy === 'WALK_METRO' ? 'WALK_METRO' : 'WALK_ONLY',
          args.eligibleTargets,
        )
      : []
    const physDur = new Map(phys.map((t) => [t.toStgoId, t.durationMin]))

    type Cand = {
      id: string
      exp: ExperienceRecord
      score: number
      move: number
      dwell: number
      base: number | null
      mrv: number | null
      tv: number | null
      iav: number
      emt: number | null
    }
    const scored: Cand[] = []

    const rhythm = assessRhythmWindow({
      experienceBeats: Math.min(arc.recentExperienceBeats, 8),
      requiredStops: arc.recentRequiredStops,
      stationaryInterruptions: arc.recentStationaryStops,
      narrationMinutes: arc.narrationLoad || null,
    })

    for (const [stgoId, exp] of args.eligibleByStgo) {
      if (sequence.includes(stgoId)) continue
      if (exp.placeId && usedPlaces.has(exp.placeId) && !exp.compatibilityOverride) continue

      const node = args.nodesById.get(stgoId)
      if (!node) continue
      const coord = args.coordsById.get(stgoId) ?? null
      if (!lastCoord || !coord) continue

      const move = physDur.get(stgoId) ?? haversineMin(lastCoord, coord)
      const tEval = evaluateExperienceTime({ experience: exp, node, mode: args.timeMode })
      if (!tEval.usable || tEval.stationaryDwell == null) continue
      const dwell = tEval.stationaryDwell
      if (elapsed + move + dwell > args.request.timeBudgetMin + ROUTE_SEARCH_CONFIG.timeToleranceMin) continue

      const bundle = evaluateNodeScoreV02(
        {
          stgoId,
          displayName: exp.displayName,
          traveler: args.request.traveler,
          routeIntent: args.request.routeIntent,
          routeState: {
            arcState: {
              themesSeen: [],
              themesDominant: [],
              questionsOpened: arc.openQuestions,
              questionsResolved: arc.resolvedQuestions,
              relationTypesRecentlyUsed: [],
              emotionalIntensity: arc.narrativeIntensity,
              revealCount: arc.strongestRevealUsed ? 1 : 0,
              anchorCount: 0,
              microRevealCount: 0,
              lastNarrativeHook: null,
              recentPOIs: sequence.slice(-3),
              repetitionTagsSeen: [],
              lastRelationType: null,
              routeStepIndex: sequence.length,
            },
            routeSoFarStgoIds: sequence as any,
            routeThemes: [] as any,
            anchorCount: 0,
            pocketCount: 0,
            microCount: 0,
            recentStgoIds: sequence.slice(-3) as any,
            routeIntent: args.request.routeIntent,
            prevStgoId: last,
            transitionDurationMin: move,
            transitionFeasible: physDur.has(stgoId),
            geographicEvidenceAvailable: true,
          },
        },
        args.root,
      )
      const base = bundle?.baseNodeValue?.score ?? null
      const mrv = bundle?.marginalRouteValue?.score ?? null
      const tv = bundle?.transitionValue?.score ?? null
      const iav = computeIncrementalArcValue({
        currentArcState: arc,
        candidateExperience: exp,
        narrativeEdgeAvailable: false,
        traveler: args.request.traveler,
        remainingBudgetMin: remaining,
        rhythmScore01: rhythmScore01(rhythm.assessment),
      })
      const emt = move + dwell
      const w = args.weights
      const score =
        w.base * ((base ?? 50) / 100) +
        w.iav * iav.aggregate +
        w.mrv * ((mrv ?? 50) / 100) +
        w.transition * ((tv ?? 50) / 100) -
        0.05 * (emt / Math.max(1, remaining))

      scored.push({ id: stgoId, exp, score, move, dwell, base, mrv, tv, iav: iav.aggregate, emt })
    }

    scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    const best = scored[0]
    if (!best) break

    sequence.push(best.id)
    experienceIds.push(best.exp.experienceId)
    if (best.exp.placeId) usedPlaces.add(best.exp.placeId)
    moves.push(best.move)
    dwells.push(best.dwell)
    elapsed += best.move + best.dwell
    disclosures.push(
      ...evaluateExperienceTime({
        experience: best.exp,
        node: args.nodesById.get(best.id),
        mode: args.timeMode,
      }).disclosure,
    )

    arc = advanceArcState({
      currentState: arc,
      selectedExperience: best.exp,
      selectedNarrativeRelation: null,
      elapsedTimeMin: elapsed,
      timeBudgetMin: args.request.timeBudgetMin,
      themes: [best.id],
    })

    appendTraceEvent(args.trace, {
      stage: 'ROUTE_EXPANSION',
      decision: `chose ${best.exp.experienceId}`,
      topAlternatives: scored.slice(1, 4).map((c) => c.exp.experienceId),
      reasonComponents: {
        lane: args.lane,
        score: best.score,
        base: best.base,
        iav: best.iav,
        emt: best.emt,
      },
      unknowns: [],
      provenance: 'searchLaneVNext',
      stateAfter: { sequence: [...sequence], phase: arc.phase },
    })
    appendTraceEvent(args.trace, {
      stage: 'ARCSTATE_UPDATE',
      decision: arc.phase,
      reasonComponents: {
        frac: arc.fractionOfBudgetConsumed,
        orientation: arc.orientationSatisfied,
        payoff: arc.payoffSatisfied,
      },
      unknowns: [],
      provenance: 'advanceArcState',
    })
    appendTraceEvent(args.trace, {
      stage: 'TIME_UPDATE',
      decision: args.timeMode,
      reasonComponents: { elapsed, dwell: best.dwell, move: best.move },
      unknowns: startTime.unknowns,
      provenance: 'evaluateExperienceTime',
    })

    steps.push({
      stepIndex: sequence.length - 1,
      phase: arc.phase,
      budgetConsumedFrac: arc.fractionOfBudgetConsumed,
      remainingMin: Math.max(0, args.request.timeBudgetMin - elapsed),
      currentSequence: [...sequence],
      candidatesConsidered: scored.slice(0, 8).map((c) => ({
        experienceId: c.exp.experienceId,
        baseValue: c.base,
        mrv: c.mrv,
        transitionValue: c.tv,
        incrementalArcValue: c.iav,
        effectiveMarginalTime: c.emt,
        reason: `lane=${args.lane}`,
      })),
      chosenExperienceId: best.exp.experienceId,
      rhythmAssessment: rhythm.assessment,
      arcStateAfter: {
        phase: arc.phase,
        orientationSatisfied: arc.orientationSatisfied,
        payoffSatisfied: arc.payoffSatisfied,
        landingSatisfied: arc.landingSatisfied,
        repetitionLoad: arc.repetitionLoad,
      },
    })
  }

  const fingerprint = createHash('sha256')
    .update(JSON.stringify({ lane: args.lane, sequence, elapsed: Math.round(elapsed * 10) / 10 }))
    .digest('hex')
    .slice(0, 16)

  return {
    lane: args.lane,
    experienceIds,
    stgoIds: sequence,
    arcState: arc,
    compositionSteps: steps,
    timeEvidenceMode: args.timeMode,
    timeDisclosure: [...new Set(disclosures)],
    totalEstimatedMin: elapsed,
    dwellMin: dwells.reduce((a, b) => a + b, 0),
    movementMin: moves.reduce((a, b) => a + b, 0),
    fingerprint,
  }
}
