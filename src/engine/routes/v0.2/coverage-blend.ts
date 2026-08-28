/**
 * Shared coverage-aware blend: UNKNOWN ≠ 0.
 * Renormalize over known components and report coverage.
 */

import { coverageFromKnown, isKnown, round1, round2 } from '@/src/engine/scoring/v0.2/utils'

export type BlendTerm = {
  key: string
  value: number | null
  weight: number
}

export type BlendResult = {
  score: number | null
  coverage: number
  usedWeight: number
  totalWeight: number
  knownKeys: string[]
  unknownKeys: string[]
  renormalized: boolean
}

export function blendKnown(terms: BlendTerm[]): BlendResult {
  const knownKeys: string[] = []
  const unknownKeys: string[] = []
  let num = 0
  let usedWeight = 0
  let totalWeight = 0
  for (const t of terms) {
    totalWeight += t.weight
    if (!isKnown(t.value)) {
      unknownKeys.push(t.key)
      continue
    }
    knownKeys.push(t.key)
    num += t.value * t.weight
    usedWeight += t.weight
  }
  if (usedWeight <= 0) {
    return {
      score: null,
      coverage: 0,
      usedWeight: 0,
      totalWeight,
      knownKeys,
      unknownKeys,
      renormalized: false,
    }
  }
  return {
    score: round1(num / usedWeight),
    coverage: coverageFromKnown(knownKeys.length, terms.length),
    usedWeight: round2(usedWeight),
    totalWeight: round2(totalWeight),
    knownKeys,
    unknownKeys,
    renormalized: unknownKeys.length > 0,
  }
}

export function percentile(sortedAsc: number[], p: number): number | null {
  if (!sortedAsc.length) return null
  const idx = Math.max(0, Math.min(sortedAsc.length - 1, Math.floor((p / 100) * (sortedAsc.length - 1))))
  return sortedAsc[idx]!
}
