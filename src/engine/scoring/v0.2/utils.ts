/**
 * Gate 2E.2A — shared V0.2 scoring utilities.
 */

import type { ScoreConfidence } from '@/src/engine/scoring/v0.2/scoring-types'

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function isKnown(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n)
}

export function coverageFromKnown(known: number, total: number): number {
  if (total <= 0) return 0
  return round2(known / total)
}

export function confidenceFromCoverage(coverage: number): ScoreConfidence {
  if (coverage >= 0.85) return 'HIGH'
  if (coverage >= 0.55) return 'MEDIUM'
  return 'LOW'
}

export function weightedMean(
  entries: Array<{ value: number | null; weight: number }>,
): { score: number | null; coverage: number } {
  let num = 0
  let den = 0
  let known = 0
  for (const e of entries) {
    if (!isKnown(e.value)) continue
    known += 1
    num += e.value * e.weight
    den += e.weight
  }
  if (den <= 0) return { score: null, coverage: 0 }
  // Inputs are on the [0, 100] score scale (not unit interval).
  return {
    score: round1(num / den),
    coverage: coverageFromKnown(known, entries.length),
  }
}

export function percentileRank(value: number, sortedValues: number[]): number | null {
  if (!sortedValues.length) return null
  const below = sortedValues.filter((v) => v < value).length
  const equal = sortedValues.filter((v) => v === value).length
  return round1(((below + equal * 0.5) / sortedValues.length) * 100)
}

export function rankValues(values: Array<{ id: string; score: number | null }>): Map<string, number> {
  const known = values.filter((v) => isKnown(v.score)).sort((a, b) => (b.score! - a.score!))
  const out = new Map<string, number>()
  known.forEach((v, i) => out.set(v.id, i + 1))
  return out
}

export function spearmanCorrelation(
  a: Map<string, number>,
  b: Map<string, number>,
): number | null {
  const ids = [...a.keys()].filter((id) => b.has(id))
  if (ids.length < 3) return null
  const diffs = ids.map((id) => a.get(id)! - b.get(id)!)
  const n = diffs.length
  const sumSq = diffs.reduce((s, d) => s + d * d, 0)
  return round2(1 - (6 * sumSq) / (n * (n * n - 1)))
}
