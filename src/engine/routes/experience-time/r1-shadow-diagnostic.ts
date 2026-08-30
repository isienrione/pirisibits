/**
 * Gate 2E.4 — R1 shadow diagnostic (fixture only).
 * Does NOT invent VisitMode or dwell values.
 * Where experience-time data is unavailable → EXPERIENCE_TIME_UNKNOWN.
 */

import { adaptLegacyScalarDwell } from './legacy-scalar-dwell'
import { emptyCuratorExperienceTimeRecord } from './curator-schema'
import type { ExperienceTimeStatus } from './types'

/** R1 diagnostic POIs required by Gate 2E.4 §L */
export const R1_SHADOW_POIS = [
  { stgoId: 'STGO_01', label: 'Plaza de Armas' },
  { stgoId: 'STGO_02', label: 'Catedral Metropolitana' },
  { stgoId: 'STGO_16', label: 'Pasaje Matte' },
  { stgoId: 'STGO_22', label: 'Museo Precolombino' },
  { stgoId: 'STGO_19', label: 'Seguro Obrero' },
  { stgoId: 'STGO_18', label: 'Edificio Ariztía' },
  { stgoId: 'STGO_06', label: 'Barrio París-Londres' },
  { stgoId: 'STGO_92', label: 'Paseo Bandera' },
  { stgoId: 'STGO_03', label: 'La Moneda' },
] as const

export type R1ShadowPoiDiagnostic = {
  stgoId: string
  label: string
  experienceTimeStatus: ExperienceTimeStatus
  visitMode: 'UNKNOWN'
  onPath: null
  legacyScalarDwellTypical: number | null
  missingCalibration: string[]
  note: string
}

export function buildR1ShadowDiagnostic(legacyDwells: Record<string, number | null | undefined>): {
  gate: '2E.4'
  fixture: 'R1'
  productionComposerAffected: false
  pois: R1ShadowPoiDiagnostic[]
  summary: string
} {
  const requiredFields = emptyCuratorExperienceTimeRecord('TEMPLATE').fields
  const missingTemplate = Object.keys(requiredFields).filter((k) => k !== 'stgoId')

  const pois: R1ShadowPoiDiagnostic[] = R1_SHADOW_POIS.map((p) => {
    const legacy = adaptLegacyScalarDwell({
      stgoId: p.stgoId,
      visitTimeTypical: legacyDwells[p.stgoId] ?? null,
    })
    return {
      stgoId: p.stgoId,
      label: p.label,
      experienceTimeStatus: 'EXPERIENCE_TIME_UNKNOWN',
      visitMode: 'UNKNOWN',
      onPath: null,
      legacyScalarDwellTypical: legacy.dwellTypical,
      missingCalibration: [...missingTemplate],
      note:
        'No VisitMode or experience-time profile assigned in Gate 2E.4. Legacy scalar dwell is compatibility-only and is not an experience-time calibration.',
    }
  })

  return {
    gate: '2E.4',
    fixture: 'R1',
    productionComposerAffected: false,
    pois,
    summary:
      'R1 cannot be recomputed under Experience-Time Model V0.1 until curator-calibrated VisitMode, dwell bands, access overhead, ticket/hours flags, and on-path evidence exist for each listed POI. Legacy scalar dwell remains available via LEGACY_SCALAR_DWELL adapter only.',
  }
}
