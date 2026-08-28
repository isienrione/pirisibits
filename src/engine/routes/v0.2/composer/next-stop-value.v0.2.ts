/**
 * Within-lane NextStopValue. Same formula for a given lane; lanes differ only by weights.
 * UNKNOWN terms are dropped and remaining weights renormalized.
 */

import { ROUTE_SEARCH_CONFIG } from '@/src/engine/routes/route-config'
import type { PhysicalTransition } from '@/src/engine/routes/route-types'
import type { NodeScoreBundleV02 } from '@/src/engine/scoring/v0.2/scoring-types'
import { clamp01, round1 } from '@/src/engine/scoring/v0.2/utils'
import { blendKnown } from '@/src/engine/routes/v0.2/coverage-blend'
import type { LaneObjectiveWeights } from '@/src/engine/routes/v0.2/composer/composer-config.v0.2'
import type { NextStopValueBreakdown } from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'

export function physicalEfficiencyFromTransition(
  transition: PhysicalTransition | null,
  maxWalkChunkMin = ROUTE_SEARCH_CONFIG.maxWalkChunkMin,
): number | null {
  if (transition == null) return 100
  if (transition.durationMin == null || !Number.isFinite(transition.durationMin)) return null
  return round1(clamp01(1 - transition.durationMin / Math.max(1, maxWalkChunkMin)) * 100)
}

export function computeNextStopValue(
  bundle: NodeScoreBundleV02,
  weights: LaneObjectiveWeights,
  transition: PhysicalTransition | null,
): NextStopValueBreakdown {
  const physicalEfficiency = physicalEfficiencyFromTransition(transition)
  const terms = [
    { key: 'intrinsicWorth', value: bundle.intrinsicWorth.raw, weight: weights.intrinsicWorth },
    { key: 'travelerMatch', value: bundle.travelerMatch.score, weight: weights.travelerMatch },
    { key: 'marginalRouteValue', value: bundle.marginalRouteValue?.score ?? null, weight: weights.marginalRouteValue },
    { key: 'transitionValue', value: bundle.transitionValue?.score ?? null, weight: weights.transitionValue },
    { key: 'physicalEfficiency', value: physicalEfficiency, weight: weights.physicalEfficiency },
  ]
  const blended = blendKnown(terms)
  return {
    intrinsicWorth: bundle.intrinsicWorth.raw,
    travelerMatch: bundle.travelerMatch.score,
    marginalRouteValue: bundle.marginalRouteValue?.score ?? null,
    transitionValue: bundle.transitionValue?.score ?? null,
    physicalEfficiency,
    nextStopValue: blended.score,
    coverage: blended.coverage,
    unknownKeys: blended.unknownKeys,
  }
}

export function composerScoreFromStops(
  nextStops: NextStopValueBreakdown[],
  timeFit: number | null,
): { score: number; coverage: number } {
  const known = nextStops.map((s) => s.nextStopValue).filter((v): v is number => v != null)
  const coverages = nextStops.map((s) => s.coverage)
  const meanCoverage =
    coverages.length > 0 ? coverages.reduce((a, b) => a + b, 0) / coverages.length : 0
  if (!known.length) return { score: 0, coverage: meanCoverage }
  const mean = known.reduce((a, b) => a + b, 0) / known.length
  const bonus = timeFit != null ? 0.08 * timeFit : 0
  return {
    score: round1(Math.max(0, Math.min(100, mean + bonus))),
    coverage: meanCoverage,
  }
}
