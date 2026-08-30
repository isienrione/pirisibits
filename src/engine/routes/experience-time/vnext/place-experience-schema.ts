/**
 * Gate 2E.5-QA — Place / Experience / ContentModule schema (PARALLEL ONLY).
 * Do NOT migrate Launch30 records. Do NOT populate real ExperienceTimes.
 */

import type {
  ExperienceStopRole,
  ExperienceTimeProvenance,
  VisitMode,
} from '@/src/engine/routes/experience-time/types'

export const EXPERIENCE_PLACE_MODEL_VERSION = '0.1.place-experience.parallel' as const

/** Physical locus — geometry and accessibility facts. */
export type PlaceRecordV01 = {
  placeId: string
  stgoId: string | null
  coordinates: { lat: number; lng: number } | null
  coordinateProvenance: ExperienceTimeProvenance | 'UNKNOWN'
  snapPoints: Array<{ id: string; lat: number; lng: number; role: string }>
  accessibilityFacts: Record<string, unknown>
  physicalFacts: Record<string, unknown>
  routable: boolean
  notes?: string | null
}

/** Experience at a place or corridor — visit mode + time profile identity. */
export type ExperienceRecordV01 = {
  experienceId: string
  placeId: string | null
  corridorRef: string | null
  visitMode: VisitMode
  stopRole: ExperienceStopRole
  parentExperienceId: string | null
  mutuallyExclusiveGroupId: string | null
  /** Explicit override allowing multiple experiences from same place in one core route. */
  compatibilityOverride: boolean
  openingConstraintsRef: string | null
  ticketConstraintsRef: string | null
  narrativeIdentity: string | null
  provenance: ExperienceTimeProvenance
  /** Two-channel content/time profile capability (values remain null until curated). */
  contentTimeProfile: ContentTimeProfileV01
}

export type ContentTimeProfileV01 = {
  authoredContentMin: number | null
  walkCompatibleContentMin: number | null
  requiredStopMin: number | null
  stationaryDwellMin: number | null
  accessOverheadMin: number | null
  contentMayOverlapMovement: boolean | null
}

/** Authored narration / content module. */
export type ContentModuleV01 = {
  contentModuleId: string
  experienceId: string
  authoredNarrationRef: string | null
  narrativeHookVariants: string[]
  familiarityVariants: string[]
  timeSignatureRef: string | null
  provenance: ExperienceTimeProvenance
}

/**
 * Mutual exclusion: by default only one experience per mutuallyExclusiveGroupId
 * (or per placeId when group unset) may enter the core route.
 */
export function experiencesViolateMutualExclusion(
  selected: ExperienceRecordV01[],
): { ok: boolean; violations: string[] } {
  const violations: string[] = []
  const byGroup = new Map<string, ExperienceRecordV01[]>()
  for (const e of selected) {
    if (e.compatibilityOverride) continue
    if (e.stopRole === 'OPTIONAL_EXTENSION') continue
    const key = e.mutuallyExclusiveGroupId ?? (e.placeId ? `place:${e.placeId}` : null)
    if (!key) continue
    const arr = byGroup.get(key) ?? []
    arr.push(e)
    byGroup.set(key, arr)
  }
  for (const [key, arr] of byGroup) {
    if (arr.length > 1) {
      violations.push(
        `${key}: ${arr.map((e) => e.experienceId).join(', ')} — only one mutually-exclusive Experience allowed in core route unless compatibilityOverride`,
      )
    }
  }
  return { ok: violations.length === 0, violations }
}

/** Walking narration capacity — UNKNOWN until field-calibrated; no invented %. */
export type WalkingNarrationCapacityPolicy = 'UNKNOWN' | 'CONFIG_REQUIRED'

export const WALKING_NARRATION_CAPACITY_POLICY: WalkingNarrationCapacityPolicy = 'UNKNOWN'

/**
 * Two-channel elapsed time:
 * elapsed = movement + stationary dwell + required access overhead
 * Authored content does NOT automatically add elapsed time.
 */
export function computeTwoChannelElapsed(input: {
  movementMin: number | null
  stationaryDwellMin: number | null
  accessOverheadMin: number | null
}): { elapsedMin: number | null; unknown: string[] } {
  const unknown: string[] = []
  if (input.movementMin == null) unknown.push('movementMin')
  if (input.stationaryDwellMin == null) unknown.push('stationaryDwellMin')
  if (unknown.length) return { elapsedMin: null, unknown }
  return {
    elapsedMin:
      Number(input.movementMin) +
      Number(input.stationaryDwellMin) +
      Number(input.accessOverheadMin ?? 0),
    unknown,
  }
}

/** Budget-fraction progression phases — thresholds NOT assigned yet. */
export type BudgetProgressionPhase = 'EARLY' | 'MIDDLE' | 'LATE' | 'LANDING' | 'UNKNOWN'

export type BudgetProgressionContractV01 = {
  basis: 'fractionOfBudgetConsumed'
  phases: BudgetProgressionPhase[]
  thresholdsAssigned: false
  reasonStepOrdinalInvalid:
    'Step ordinal becomes invalid when Experience durations vary greatly; progression must use budget fraction.'
}

export const BUDGET_PROGRESSION_CONTRACT_V01: BudgetProgressionContractV01 = {
  basis: 'fractionOfBudgetConsumed',
  phases: ['EARLY', 'MIDDLE', 'LATE', 'LANDING'],
  thresholdsAssigned: false,
  reasonStepOrdinalInvalid:
    'Step ordinal becomes invalid when Experience durations vary greatly; progression must use budget fraction.',
}

/** Rhythm / attention state capability (no final caps). */
export type RhythmAttentionStateV01 = {
  stationaryStopsInRollingWindow: number | null
  experienceBeatsInRollingWindow: number | null
  consecutiveRequiredStops: number | null
  narrationLoadMin: number | null
  timeSinceLastLowAttentionSegmentMin: number | null
  windowMin: 15
}

export function emptyRhythmAttentionState(): RhythmAttentionStateV01 {
  return {
    stationaryStopsInRollingWindow: null,
    experienceBeatsInRollingWindow: null,
    consecutiveRequiredStops: null,
    narrationLoadMin: null,
    timeSinceLastLowAttentionSegmentMin: null,
    windowMin: 15,
  }
}

/** Diagnostic counters per 15 minutes — capability only. */
export type RhythmWindowDiagnostic = {
  windowMin: 15
  stopsPer15Min: number | null
  requiredStopsPer15Min: number | null
  narrationMinutesPer15Min: number | null
  note: 'No arbitrary max-8-stops rule. Caps not assigned.'
}

/** Arrival-time state reservation for opening-hours feasibility. */
export type ArrivalTimeStateV01 = {
  routeStartTimeIso: string | null
  arrivalTimeByExperienceId: Record<string, string | null>
  openingHoursEvaluatedAtArrival: boolean
  fabricatedOpeningHours: false
}
