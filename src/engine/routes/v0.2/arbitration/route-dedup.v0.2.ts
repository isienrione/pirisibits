/**
 * Deduplicate near-duplicate lane candidates before presenting alternatives.
 */

import { edgeOverlap, orderedOverlap, stopOverlap } from '@/src/engine/routes/route-compare'
import { DEDUP_THRESHOLDS } from '@/src/engine/routes/v0.2/arbitration/arbitration-config.v0.2'
import type { ArbitratedCandidate, RouteCharacter } from '@/src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'
import { round2 } from '@/src/engine/scoring/v0.2/utils'

export type SimilarityBreakdown = {
  stopSet: number
  ordered: number
  edge: number
  character: number
  nearDuplicate: boolean
}

export function characterSimilarity(a: RouteCharacter, b: RouteCharacter): number {
  const keys: Array<keyof RouteCharacter> = [
    'essentiality',
    'discovery',
    'physicalEase',
    'narrativeDepth',
    'travelerMatch',
  ]
  let num = 0
  let den = 0
  for (const k of keys) {
    const av = a[k]
    const bv = b[k]
    if (av == null || bv == null) continue
    den += 1
    num += 1 - Math.min(1, Math.abs(av - bv) / 100)
  }
  return den === 0 ? 1 : round2(num / den)
}

export function candidateSimilarity(a: ArbitratedCandidate, b: ArbitratedCandidate): SimilarityBreakdown {
  const stopSet = stopOverlap(a.candidate.candidate, b.candidate.candidate)
  const ordered = orderedOverlap(a.candidate.candidate, b.candidate.candidate)
  const edge = edgeOverlap(a.candidate.candidate, b.candidate.candidate)
  const character = characterSimilarity(a.character, b.character)
  const nearDuplicate =
    stopSet >= DEDUP_THRESHOLDS.stopSet ||
    ordered >= DEDUP_THRESHOLDS.ordered ||
    edge >= DEDUP_THRESHOLDS.edge ||
    (character >= DEDUP_THRESHOLDS.character && stopSet >= DEDUP_THRESHOLDS.characterStopSetFloor)
  return { stopSet, ordered, edge, character, nearDuplicate }
}

export function deduplicateCandidates(ranked: ArbitratedCandidate[]): {
  unique: ArbitratedCandidate[]
  dropped: Array<{ routeId: string; duplicateOf: string; similarity: SimilarityBreakdown }>
} {
  const unique: ArbitratedCandidate[] = []
  const dropped: Array<{ routeId: string; duplicateOf: string; similarity: SimilarityBreakdown }> = []
  for (const cand of ranked) {
    let dupOf: { id: string; sim: SimilarityBreakdown } | null = null
    for (const keep of unique) {
      const sim = candidateSimilarity(keep, cand)
      if (sim.nearDuplicate) {
        dupOf = { id: keep.routeId, sim }
        break
      }
    }
    if (dupOf) {
      dropped.push({ routeId: cand.routeId, duplicateOf: dupOf.id, similarity: dupOf.sim })
    } else {
      unique.push(cand)
    }
  }
  return { unique, dropped }
}
