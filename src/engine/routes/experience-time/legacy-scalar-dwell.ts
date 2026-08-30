/**
 * Gate 2E.4 — LEGACY_SCALAR_DWELL adapter.
 * Preserves current calibration.visitTime.* behavior without inventing VisitMode.
 */

import type { LegacyScalarDwellAdapter } from './types'

export function adaptLegacyScalarDwell(input: {
  stgoId: string
  visitTimeTypical: number | null | undefined
  visitTimeMin?: number | null | undefined
  visitTimeMax?: number | null | undefined
}): LegacyScalarDwellAdapter {
  const typical =
    input.visitTimeTypical != null && Number.isFinite(input.visitTimeTypical)
      ? Number(input.visitTimeTypical)
      : null
  const min =
    input.visitTimeMin != null && Number.isFinite(input.visitTimeMin)
      ? Number(input.visitTimeMin)
      : null
  const max =
    input.visitTimeMax != null && Number.isFinite(input.visitTimeMax)
      ? Number(input.visitTimeMax)
      : null

  return {
    kind: 'LEGACY_SCALAR_DWELL',
    stgoId: input.stgoId,
    dwellTypical: typical,
    dwellMin: min,
    dwellMax: max,
    provenance: 'LEGACY_SCALAR_DWELL',
    sourceField: 'calibration.visitTime.typical',
    visitMode: 'UNKNOWN',
    experienceTimeStatus: 'LEGACY_ONLY',
  }
}
