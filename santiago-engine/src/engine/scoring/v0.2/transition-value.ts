/**
 * Gate 2E.2A — TransitionValue V0.2 adapter (does not replace NarrativeEdgeScore).
 */

import type { RouteStateContext, TransitionValueResult } from '@/src/engine/scoring/v0.2/scoring-types'
import { TRANSITION_VALUE_WEIGHTS } from '@/src/engine/scoring/v0.2/scoring-config'
import { buildExplanation } from '@/src/engine/scoring/v0.2/explain-score'
import { clamp01, isKnown, round1, weightedMean } from '@/src/engine/scoring/v0.2/utils'

export function computeTransitionValue(routeState: RouteStateContext): TransitionValueResult {
  if (routeState.transitionFeasible === false) {
    return {
      score: null,
      status: 'INELIGIBLE',
      coverage: 0,
      confidence: 'LOW',
      components: {
        narrativeContribution: null,
        physicalTransitionQuality: null,
        spatialLegibility: null,
        prerequisiteSatisfaction: null,
        transitionBurden: null,
      },
      explanation: buildExplanation({
        scoreName: 'TransitionValue',
        score: null,
        status: 'INELIGIBLE',
        coverage: 0,
        plain: 'Physical transition infeasible — TransitionValue not computed.',
      }),
    }
  }

  const narrativeContribution = isKnown(routeState.narrativeEdgeScore)
    ? clamp01(routeState.narrativeEdgeScore! / 100)
    : null
  const physicalTransitionQuality =
    routeState.geographicEvidenceAvailable === false
      ? null
      : isKnown(routeState.transitionDistanceM)
        ? clamp01(1 - Math.min(1, routeState.transitionDistanceM! / 1200))
        : 0.5
  const spatialLegibility =
    routeState.bearingReversal === true ? 0.35 : routeState.bearingReversal === false ? 0.8 : null
  const prerequisiteSatisfaction = routeState.arcState.questionsOpened.length
    ? clamp01(routeState.arcState.questionsResolved.length / routeState.arcState.questionsOpened.length)
    : 0.5
  const burden = isKnown(routeState.transitionDurationMin)
    ? clamp01(routeState.transitionDurationMin! / 30)
    : null

  const components = {
    narrativeContribution: narrativeContribution != null ? round1(narrativeContribution * 100) : null,
    physicalTransitionQuality:
      physicalTransitionQuality != null ? round1(physicalTransitionQuality * 100) : null,
    spatialLegibility: spatialLegibility != null ? round1(spatialLegibility * 100) : null,
    prerequisiteSatisfaction: round1(prerequisiteSatisfaction * 100),
    transitionBurden: burden != null ? round1(burden * 100) : null,
  }

  const pos = weightedMean([
    { value: components.narrativeContribution, weight: TRANSITION_VALUE_WEIGHTS.narrative },
    { value: components.physicalTransitionQuality, weight: TRANSITION_VALUE_WEIGHTS.physicalQuality },
    { value: components.spatialLegibility, weight: TRANSITION_VALUE_WEIGHTS.spatialLegibility },
    { value: components.prerequisiteSatisfaction, weight: TRANSITION_VALUE_WEIGHTS.prerequisite },
  ])
  const burdenPenalty = isKnown(components.transitionBurden)
    ? components.transitionBurden! * TRANSITION_VALUE_WEIGHTS.burden
    : 0
  const score = pos.score != null ? round1(Math.max(0, pos.score - burdenPenalty)) : null

  const explanation = buildExplanation({
    scoreName: 'TransitionValue',
    score,
    coverage: pos.coverage,
    plain: `TransitionValue ${score ?? 'UNAVAILABLE'} — narrative ${components.narrativeContribution ?? '—'}, physical ${components.physicalTransitionQuality ?? '—'}, burden −${round1(burdenPenalty)}.`,
  })

  return {
    score,
    status: score == null ? 'UNAVAILABLE' : 'AVAILABLE',
    coverage: pos.coverage,
    confidence: explanation.confidence,
    components,
    explanation,
  }
}
