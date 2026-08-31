/**
 * Gate 2E.6 — Rhythm / attention controller (executable diagnostics).
 */

export type RhythmAssessment = 'GOOD' | 'DENSE' | 'VERY_DENSE' | 'UNKNOWN'

export type RhythmWindowDiagnostic = {
  windowMin: 15
  experienceBeats: number
  requiredStops: number
  stationaryInterruptions: number
  narrationMinutes: number | null
  assessment: RhythmAssessment
  productionRejectionCaps: false
  note: string
}

export const RHYTHM_CONFIG_VNEXT = {
  version: 'rhythm.vnext.0.1.provisional',
  calibrationRequired: true as const,
  /** Provisional diagnostic thresholds only — NOT production rejection caps. */
  denseBeatsPer15: 4,
  veryDenseBeatsPer15: 6,
}

export function assessRhythmWindow(input: {
  experienceBeats: number
  requiredStops: number
  stationaryInterruptions: number
  narrationMinutes: number | null
}): RhythmWindowDiagnostic {
  let assessment: RhythmAssessment = 'GOOD'
  if (!Number.isFinite(input.experienceBeats)) assessment = 'UNKNOWN'
  else if (input.experienceBeats >= RHYTHM_CONFIG_VNEXT.veryDenseBeatsPer15) assessment = 'VERY_DENSE'
  else if (input.experienceBeats >= RHYTHM_CONFIG_VNEXT.denseBeatsPer15) assessment = 'DENSE'

  return {
    windowMin: 15,
    experienceBeats: input.experienceBeats,
    requiredStops: input.requiredStops,
    stationaryInterruptions: input.stationaryInterruptions,
    narrationMinutes: input.narrationMinutes,
    assessment,
    productionRejectionCaps: false,
    note: 'Provisional diagnostic only — no production rejection caps without evidence',
  }
}

export function rhythmScore01(assessment: RhythmAssessment): number {
  switch (assessment) {
    case 'GOOD':
      return 0.9
    case 'DENSE':
      return 0.55
    case 'VERY_DENSE':
      return 0.25
    default:
      return 0.5
  }
}
