/**
 * Diagnostic audit of lane ComposerScore distributions.
 * Used to show why direct cross-lane comparison is invalid.
 */

import { round1, round2 } from '@/src/engine/scoring/v0.2/utils'
import type { ComposerLane } from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'
import type { CommonRouteFeatures } from '@/src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'

export type NumericSummary = {
  n: number
  mean: number | null
  median: number | null
  stdev: number | null
  min: number | null
  max: number | null
}

function summary(values: number[]): NumericSummary {
  if (!values.length) return { n: 0, mean: null, median: null, stdev: null, min: null, max: null }
  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
  return {
    n: values.length,
    mean: round1(mean),
    median: round1(median),
    stdev: round2(Math.sqrt(variance)),
    min: round1(sorted[0]!),
    max: round1(sorted[sorted.length - 1]!),
  }
}

export function summarizeComposerScoresByLane(
  rows: Array<{ lane: ComposerLane; composerScore: number }>,
): Record<ComposerLane, NumericSummary> {
  const lanes: ComposerLane[] = ['SIGNATURE', 'DISCOVERY', 'FLOW']
  const out = {} as Record<ComposerLane, NumericSummary>
  for (const lane of lanes) {
    out[lane] = summary(rows.filter((r) => r.lane === lane).map((r) => r.composerScore))
  }
  return out
}

export function summarizeFeatureByLane(
  rows: Array<{ lane: ComposerLane; features: CommonRouteFeatures }>,
  key: keyof CommonRouteFeatures,
): Record<ComposerLane, NumericSummary> {
  const lanes: ComposerLane[] = ['SIGNATURE', 'DISCOVERY', 'FLOW']
  const out = {} as Record<ComposerLane, NumericSummary>
  for (const lane of lanes) {
    const vals = rows
      .filter((r) => r.lane === lane)
      .map((r) => {
        const f = r.features[key]
        if (typeof f === 'number') return f
        return f && typeof f === 'object' && 'value' in f ? f.value : null
      })
      .filter((v): v is number => v != null)
    out[lane] = summary(vals)
  }
  return out
}

export function composerScalesComparable(
  dist: Record<ComposerLane, NumericSummary>,
): { comparable: boolean; reason: string } {
  const means = (['SIGNATURE', 'DISCOVERY', 'FLOW'] as ComposerLane[])
    .map((l) => dist[l].mean)
    .filter((m): m is number => m != null)
  if (means.length < 3) return { comparable: false, reason: 'Incomplete lane samples' }
  const spread = Math.max(...means) - Math.min(...means)
  if (spread >= 4) {
    return {
      comparable: false,
      reason: `Lane mean ComposerScores differ by ${round1(spread)} points; objectives are different surfaces.`,
    }
  }
  return { comparable: true, reason: 'Lane means are close; still not theoretically commensurate.' }
}
