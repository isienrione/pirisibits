/**
 * Gate 2C — diversify top provisional route candidates.
 */

import { DIVERSITY_CONFIG } from '@/src/engine/routes/route-config'
import { routeSimilarity } from '@/src/engine/routes/route-compare'
import type { RouteCandidateV01 } from '@/src/engine/routes/route-types'

/**
 * Select up to `k` meaningfully different routes from a scored pool.
 * First pick highest score; subsequent picks maximize score - diversityPenalty*similarity.
 */
export function selectDiverseRoutes(pool: RouteCandidateV01[], k = 3): RouteCandidateV01[] {
  if (pool.length <= k) {
    return pool.map((r, i) => ({ ...r, rank: i + 1 }))
  }
  const remaining = [...pool].sort(
    (a, b) =>
      b.provisionalRouteScore - a.provisionalRouteScore ||
      a.totalEstimatedMin - b.totalEstimatedMin ||
      a.routeId.localeCompare(b.routeId),
  )
  const selected: RouteCandidateV01[] = []
  while (selected.length < k && remaining.length) {
    let bestIdx = 0
    let bestVal = -Infinity
    for (let i = 0; i < remaining.length; i += 1) {
      const cand = remaining[i]!
      const maxSim = selected.length
        ? Math.max(...selected.map((s) => routeSimilarity(s, cand)))
        : 0
      if (selected.length && maxSim > DIVERSITY_CONFIG.maxPairwiseSimilarity && i > 0) {
        // soft skip very similar unless pool exhausted later
        continue
      }
      const val = cand.provisionalRouteScore - DIVERSITY_CONFIG.diversityPenaltyScale * 100 * maxSim
      if (val > bestVal) {
        bestVal = val
        bestIdx = i
      }
    }
    // if all skipped due to similarity, take next best score
    if (bestVal === -Infinity) bestIdx = 0
    selected.push(remaining.splice(bestIdx, 1)[0]!)
  }
  return selected.map((r, i) => ({ ...r, rank: i + 1 }))
}

export function pairwiseSimilarityMatrix(routes: RouteCandidateV01[]): Array<{ a: string; b: string; similarity: number }> {
  const out: Array<{ a: string; b: string; similarity: number }> = []
  for (let i = 0; i < routes.length; i += 1) {
    for (let j = i + 1; j < routes.length; j += 1) {
      out.push({
        a: routes[i]!.routeId,
        b: routes[j]!.routeId,
        similarity: routeSimilarity(routes[i]!, routes[j]!),
      })
    }
  }
  return out
}
