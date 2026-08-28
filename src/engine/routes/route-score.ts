/**
 * Gate 2C — provisional incremental route scoring (not final ArcQuality).
 */

import { computeArcSignals } from '@/src/engine/narrative/arc-signals'
import type { ArcState, NarrativeRelationType } from '@/src/engine/narrative/narrative-types'
import {
  COMPOSITION_BANDS,
  ROUTE_SCORE_WEIGHTS,
  ROUTE_SEARCH_CONFIG,
} from '@/src/engine/routes/route-config'
import type {
  PhysicalTransition,
  ProvisionalRouteScoreBreakdown,
  RouteIntent,
} from '@/src/engine/routes/route-types'

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function classifyStructure(tier: string | null, role: string | null): 'anchor' | 'pocket' | 'micro' | 'other' {
  const s = `${tier || ''} ${role || ''}`.toLowerCase()
  if (/anchor|canonical/.test(s)) return 'anchor'
  if (/micro/.test(s)) return 'micro'
  if (/pocket|thematic/.test(s)) return 'pocket'
  if (/micro/.test(s)) return 'micro'
  return 'other'
}

export type IncrementalScoreInput = {
  nodeUtility: number
  narrativeEdgeScore: number | null
  transition: PhysicalTransition | null
  remainingBudgetMin: number
  timeBudgetMin: number
  elapsedMin: number
  arcState: ArcState
  relationType: NarrativeRelationType | null
  toTier: string | null
  toRole: string | null
  recentTiers: Array<'anchor' | 'pocket' | 'micro' | 'other'>
  routeIntent: RouteIntent
  stepFreeWarning: boolean
}

export function scoreIncrementalExpansion(input: IncrementalScoreInput): {
  incremental: number
  parts: Record<string, number>
} {
  const w = ROUTE_SCORE_WEIGHTS
  const node = clamp01(input.nodeUtility / 100)
  const narrative = input.narrativeEdgeScore == null ? 0.35 : clamp01(input.narrativeEdgeScore / 100)

  const struct = classifyStructure(input.toTier, input.toRole)
  let composition = 0.55
  const last = input.recentTiers[input.recentTiers.length - 1]
  if (struct === 'anchor' && last === 'anchor') composition -= COMPOSITION_BANDS.consecutiveAnchorPenalty
  if (struct === 'micro' && last === 'micro') composition -= COMPOSITION_BANDS.consecutiveMicroPenalty
  if (input.routeIntent === 'DISCOVERY' && struct === 'micro') composition += 0.15
  if (input.routeIntent === 'ESSENTIALS' && struct === 'anchor') composition += 0.15
  composition = clamp01(composition)

  const signals = computeArcSignals(input.arcState)
  const arcSignal = clamp01(
    0.35 * signals.curiosityContinuity +
      0.25 * signals.themeDiversity +
      0.2 * signals.rhythmBalance +
      0.2 * (1 - signals.repetitionPenalty),
  )

  const dwellAndMove = input.transition?.durationMin ?? 0
  const timeFit = clamp01(1 - Math.max(0, dwellAndMove - input.remainingBudgetMin * 0.5) / Math.max(1, input.timeBudgetMin))
  const physical =
    input.transition == null
      ? 0.7
      : clamp01(1 - input.transition.durationMin / ROUTE_SEARCH_CONFIG.maxWalkChunkMin)

  let repetition = 0
  if (input.relationType && input.arcState.relationTypesRecentlyUsed.filter((r) => r === input.relationType).length >= 2) {
    repetition += COMPOSITION_BANDS.repeatedRelationPenalty
  }
  repetition += signals.repetitionPenalty * 0.5
  repetition = clamp01(repetition)

  const detour =
    input.transition && input.transition.durationMin > 20 && node < 0.45
      ? clamp01((input.transition.durationMin - 20) / 25)
      : 0

  const constraintRisk = input.stepFreeWarning ? 0.25 : 0

  const incremental =
    w.nodeUtility * node +
    w.narrative * narrative +
    w.composition * composition +
    w.arcSignal * arcSignal +
    w.timeFit * timeFit +
    w.physicalEfficiency * physical -
    w.repetitionPenalty * repetition -
    w.detourPenalty * detour -
    w.constraintRiskPenalty * constraintRisk

  return {
    incremental: round1(incremental * 100),
    parts: {
      node,
      narrative,
      composition,
      arcSignal,
      timeFit,
      physical,
      repetition,
      detour,
      constraintRisk,
    },
  }
}

export function scoreCompletedRoute(args: {
  stops: Array<{
    nodeUtility: number
    narrativeEdgeScore: number | null
    transitionTimeMin: number
    tier: string | null
    editorialRole: string | null
  }>
  totalEstimatedMin: number
  timeBudgetMin: number
  arcState: ArcState
  metroTransferCount: number
}): ProvisionalRouteScoreBreakdown {
  const w = ROUTE_SCORE_WEIGHTS
  const n = Math.max(1, args.stops.length)
  const nodeUtilityAvg = args.stops.reduce((s, x) => s + x.nodeUtility, 0) / n
  const narrativeVals = args.stops.map((x) => x.narrativeEdgeScore).filter((x): x is number => x != null)
  const narrativeAvg = narrativeVals.length ? narrativeVals.reduce((a, b) => a + b, 0) / narrativeVals.length : 40

  const counts = { anchor: 0, pocket: 0, micro: 0, other: 0 }
  for (const s of args.stops) counts[classifyStructure(s.tier, s.editorialRole)] += 1
  const ratios = {
    anchor: counts.anchor / n,
    pocket: counts.pocket / n,
    micro: counts.micro / n,
  }
  let compositionFit = 1
  if (n >= 3) {
    if (ratios.anchor < COMPOSITION_BANDS.anchorMin || ratios.anchor > COMPOSITION_BANDS.anchorMax) compositionFit -= 0.15
    if (ratios.pocket < COMPOSITION_BANDS.pocketMin || ratios.pocket > COMPOSITION_BANDS.pocketMax) compositionFit -= 0.1
    if (ratios.micro < COMPOSITION_BANDS.microMin || ratios.micro > COMPOSITION_BANDS.microMax) compositionFit -= 0.1
  }
  compositionFit = clamp01(compositionFit)

  const signals = computeArcSignals(args.arcState)
  const arcSignal = clamp01(
    0.3 * signals.openingStrength +
      0.3 * signals.developmentStrength +
      0.2 * signals.themeDiversity +
      0.2 * signals.rhythmBalance,
  )

  const over = Math.max(0, args.totalEstimatedMin - args.timeBudgetMin - ROUTE_SEARCH_CONFIG.timeToleranceMin)
  const utilization = args.totalEstimatedMin / Math.max(1, args.timeBudgetMin)
  // Prefer using most of the budget (≈75–100%); severe under-fill is a soft defect for V0.1 Lab routes.
  const underFill = utilization < 0.7 ? clamp01((0.7 - utilization) / 0.7) : 0
  const timeFit = clamp01(1 - over / Math.max(15, args.timeBudgetMin) - underFill * 0.85)

  const move = args.stops.reduce((s, x) => s + x.transitionTimeMin, 0)
  const physicalEfficiency = clamp01(1 - move / Math.max(args.totalEstimatedMin, 1))
  const repetitionPenalty = signals.repetitionPenalty
  const detourPenalty = clamp01(args.metroTransferCount * 0.05)
  const constraintRiskPenalty = clamp01(signals.unresolvedSetupPenalty * 0.3)

  const total = round1(
    clamp01(
      w.nodeUtility * (nodeUtilityAvg / 100) +
        w.narrative * (narrativeAvg / 100) +
        w.composition * compositionFit +
        w.arcSignal * arcSignal +
        w.timeFit * timeFit +
        w.physicalEfficiency * physicalEfficiency -
        w.repetitionPenalty * repetitionPenalty -
        w.detourPenalty * detourPenalty -
        w.constraintRiskPenalty * constraintRiskPenalty,
    ) * 100,
  )

  return {
    nodeUtilityAvg: round1(nodeUtilityAvg),
    narrativeAvg: round1(narrativeAvg),
    compositionFit: round1(compositionFit * 100),
    arcSignal: round1(arcSignal * 100),
    timeFit: round1(timeFit * 100),
    physicalEfficiency: round1(physicalEfficiency * 100),
    repetitionPenalty: round1(repetitionPenalty * 100),
    detourPenalty: round1(detourPenalty * 100),
    constraintRiskPenalty: round1(constraintRiskPenalty * 100),
    total,
  }
}
