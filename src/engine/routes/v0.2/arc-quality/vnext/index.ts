/**
 * Gate 2E.5-QA — ArcQuality Vnext (PARALLEL ONLY).
 * timeUtilization removed from positive components to avoid double-count with TimeFit.
 * NOT cut into production/arbitration.
 */

import type { ArcQualityComponents, ArcQualityPenalties, ArcQualityResult } from '@/src/engine/routes/arc-quality'
import {
  ARC_QUALITY_POSITIVE_WEIGHTS,
  ARC_QUALITY_PENALTY_WEIGHTS,
} from '@/src/engine/routes/arc-quality-config'

export const ARC_QUALITY_VNEXT_PARALLEL = true as const
export const ARC_QUALITY_VNEXT_VERSION = '0.2.arc.vnext.1' as const
export const ARC_QUALITY_VNEXT_STATUS = 'PARALLEL_ONLY_NOT_IN_RUNTIME' as const

/** Positive weights with timeUtilization removed; remaining weights renormalized. */
export function arcQualityVnextPositiveWeights(): Record<keyof ArcQualityComponents, number> {
  const base: Record<keyof ArcQualityComponents, number> = { ...ARC_QUALITY_POSITIVE_WEIGHTS }
  const removed = base.timeUtilization
  const restSum = (Object.entries(base) as Array<[keyof ArcQualityComponents, number]>)
    .filter(([k]) => k !== 'timeUtilization')
    .reduce((a, [, w]) => a + w, 0)
  const out: Record<keyof ArcQualityComponents, number> = { ...base, timeUtilization: 0 }
  if (restSum <= 0) return out
  for (const key of Object.keys(out) as Array<keyof ArcQualityComponents>) {
    if (key === 'timeUtilization') continue
    out[key] = (base[key] / restSum) * (restSum + removed)
  }
  return out
}

export type ArcQualityVnextResult = {
  version: typeof ARC_QUALITY_VNEXT_VERSION
  status: typeof ARC_QUALITY_VNEXT_STATUS
  timeUtilizationRemoved: true
  rawScore: number
  normalizedScore: number
  components: ArcQualityComponents
  penalties: ArcQualityPenalties
  note: string
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

/**
 * Recompute ArcQuality from an existing ArcQualityResult with timeUtilization weight = 0
 * (renormalized). Does not mutate frozen runtime ArcQuality.
 */
export function computeArcQualityVnextFromExisting(arc: ArcQualityResult): ArcQualityVnextResult {
  const posW = arcQualityVnextPositiveWeights()
  let raw = 0
  for (const key of Object.keys(posW) as Array<keyof ArcQualityComponents>) {
    raw += posW[key] * (arc.components[key] ?? 0)
  }
  for (const key of Object.keys(ARC_QUALITY_PENALTY_WEIGHTS) as Array<keyof ArcQualityPenalties>) {
    raw -= ARC_QUALITY_PENALTY_WEIGHTS[key] * (arc.penalties[key] ?? 0)
  }
  return {
    version: ARC_QUALITY_VNEXT_VERSION,
    status: ARC_QUALITY_VNEXT_STATUS,
    timeUtilizationRemoved: true,
    rawScore: raw,
    normalizedScore: clamp01(raw) * 100,
    components: arc.components,
    penalties: arc.penalties,
    note:
      'PARALLEL ONLY — timeUtilization removed from ArcQuality positives to avoid double-count with arbitration TimeFit. Frozen runtime ArcQuality unchanged.',
  }
}
