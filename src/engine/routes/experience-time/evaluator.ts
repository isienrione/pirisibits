/**
 * Gate 2E.4 — parallel experience-time evaluator (NON-PRODUCTION).
 * Must not change composer output.
 */

import { countsTowardCoreRoute } from './traveler-interaction'
import type {
  EffectiveMarginalTimeInput,
  EffectiveMarginalTimeResult,
  ExperienceTimeProfile,
  ExperienceTimeStatus,
  ParallelRouteTimeEvaluation,
  RouteTimeBudgetBreakdown,
  TravelerExperiencePreferences,
} from './types'

function finiteOrNull(n: number | null | undefined): number | null {
  if (n == null || !Number.isFinite(n)) return null
  return Number(n)
}

/**
 * EffectiveMarginalTime(X between A,B) =
 *   movement(A,X) + movement(X,B) - movement(A,B)
 *   + experienceDwell(X)
 *   + accessOverhead(X)
 *   + other explicitly modeled time burden
 *
 * Do not substitute transition(A,X) + dwell(X) when inserting into an existing sequence.
 */
export function computeEffectiveMarginalTime(
  input: EffectiveMarginalTimeInput,
): EffectiveMarginalTimeResult {
  const ax = finiteOrNull(input.movementAX)
  const xb = finiteOrNull(input.movementXB)
  const ab = finiteOrNull(input.movementAB)
  const dwell = finiteOrNull(input.experienceDwellMin)
  const access = finiteOrNull(input.accessOverheadMin) ?? 0
  const other = finiteOrNull(input.otherModeledBurdenMin) ?? 0

  const unknownReasons: string[] = []
  if (ax == null) unknownReasons.push('movementAX')
  if (xb == null) unknownReasons.push('movementXB')
  if (ab == null) unknownReasons.push('movementAB')
  if (dwell == null) unknownReasons.push('experienceDwell')

  const marginalMovementMin =
    ax != null && xb != null && ab != null ? ax + xb - ab : null

  const effectiveMarginalTimeMin =
    marginalMovementMin != null && dwell != null
      ? marginalMovementMin + dwell + access + other
      : null

  return {
    marginalMovementMin,
    experienceDwellMin: dwell,
    accessOverheadMin: finiteOrNull(input.accessOverheadMin),
    otherModeledBurdenMin: finiteOrNull(input.otherModeledBurdenMin),
    effectiveMarginalTimeMin,
    formula:
      'movement(A,X)+movement(X,B)-movement(A,B)+experienceDwell(X)+accessOverhead(X)+other',
    unknownReasons,
  }
}

/**
 * Core route time = movement + core experience dwell + required access overhead.
 * Optional extension time is separate unless explicitly requested.
 */
export function computeRouteTimeBudget(input: {
  movementTimeMin: number | null
  coreExperienceTimeMin: number | null
  accessOverheadMin: number | null
  optionalExtensionTimeMin: number | null
  includeOptionalExtensions?: boolean
}): RouteTimeBudgetBreakdown {
  const movement = finiteOrNull(input.movementTimeMin)
  const core = finiteOrNull(input.coreExperienceTimeMin)
  const access = finiteOrNull(input.accessOverheadMin)
  const optional = finiteOrNull(input.optionalExtensionTimeMin)

  const unknownComponents: string[] = []
  if (movement == null) unknownComponents.push('movementTime')
  if (core == null) unknownComponents.push('coreExperienceTime')
  if (access == null) unknownComponents.push('accessOverhead')

  const coreRouteTimeMin =
    movement != null && core != null
      ? movement + core + (access ?? 0)
      : null

  const include = input.includeOptionalExtensions === true
  if (include && optional == null) unknownComponents.push('optionalExtensionTime')

  const totalWithRequestedExtensionsMin =
    coreRouteTimeMin != null && include
      ? optional != null
        ? coreRouteTimeMin + optional
        : null
      : coreRouteTimeMin

  return {
    movementTimeMin: movement,
    coreExperienceTimeMin: core,
    accessOverheadMin: access,
    optionalExtensionTimeMin: optional,
    coreRouteTimeMin,
    totalWithRequestedExtensionsMin,
    toleranceMin: 8,
    unknownComponents,
  }
}

/**
 * Parallel evaluator over explicit ExperienceTimeProfiles.
 * Profiles must be provided — this gate does not invent modes/dwells from POI data.
 */
export function evaluateParallelRouteTime(input: {
  movementTimeMin: number | null
  profiles: ExperienceTimeProfile[]
  prefs?: TravelerExperiencePreferences
}): ParallelRouteTimeEvaluation {
  const prefs = input.prefs ?? {}
  const unknownComponents: string[] = []
  if (finiteOrNull(input.movementTimeMin) == null) unknownComponents.push('movementTime')

  let coreDwell = 0
  let accessSum = 0
  let optionalSum = 0
  let coreKnown = true
  let optionalKnown = true

  const stops: ParallelRouteTimeEvaluation['stops'] = []

  for (const p of input.profiles) {
    const status: ExperienceTimeStatus =
      p.visitMode === 'UNKNOWN' || p.dwellTypical == null
        ? 'EXPERIENCE_TIME_UNKNOWN'
        : p.provenance === 'LEGACY_SCALAR_DWELL'
          ? 'LEGACY_ONLY'
          : 'CALIBRATED'

    if (p.visitMode === 'UNKNOWN') unknownComponents.push(`${p.stgoId}:visitMode`)
    if (p.dwellTypical == null) unknownComponents.push(`${p.stgoId}:dwellTypical`)

    const isOptional =
      p.stopRole === 'OPTIONAL_EXTENSION' ||
      p.canBeOptionalExtension === true ||
      p.visitMode === 'OPTIONAL_INTERIOR'
    const includedInSelectedBudget = countsTowardCoreRoute(p, prefs)
    const dwell = finiteOrNull(p.dwellTypical)
    const access = finiteOrNull(p.accessOverheadMin)

    if (isOptional) {
      // Optional extensions never inflate CORE_ROUTE_TIME; they stay in the extension bucket.
      if (dwell == null) optionalKnown = false
      else optionalSum += dwell
      if (access != null) optionalSum += access
    } else {
      if (dwell == null) coreKnown = false
      else coreDwell += dwell
      if (access != null) accessSum += access
    }

    stops.push({
      stgoId: p.stgoId,
      experienceId: p.experienceId,
      visitMode: p.visitMode,
      role: p.stopRole,
      dwellMin: dwell,
      accessOverheadMin: access,
      countedInCore: includedInSelectedBudget,
      status,
    })
  }

  const movement = finiteOrNull(input.movementTimeMin)
  const coreDwellMin = coreKnown ? coreDwell : null
  const optionalExtensionMin = optionalKnown ? optionalSum : null
  const accessOverheadMin = accessSum

  const coreRouteTimeMin =
    movement != null && coreDwellMin != null ? movement + coreDwellMin + accessOverheadMin : null

  const includeExt = prefs.includeOptionalExtensions === true
  const totalWithExtensionsMin =
    coreRouteTimeMin != null && includeExt && optionalExtensionMin != null
      ? coreRouteTimeMin + optionalExtensionMin
      : coreRouteTimeMin

  return {
    movementTimeMin: movement,
    coreDwellMin,
    accessOverheadMin,
    optionalExtensionMin,
    coreRouteTimeMin,
    totalWithExtensionsMin,
    stops,
    unknownComponents,
    productionComposerAffected: false,
  }
}

/**
 * Content / movement concurrency: routeElapsedTime ≠ Σ audio + Σ walking
 * when walk-compatible content is declared. Overlap must be explicit — no % invention.
 */
export function computeElapsedTimeAvoidingDoubleCount(input: {
  movementTimeMin: number | null
  stationaryDwellMin: number | null
  walkCompatibleContentMin: number | null
  contentMayOverlapMovement: boolean | null
}): { elapsedMin: number | null; unknownReasons: string[] } {
  const movement = finiteOrNull(input.movementTimeMin)
  const stationary = finiteOrNull(input.stationaryDwellMin)
  const walkCompat = finiteOrNull(input.walkCompatibleContentMin)
  const unknownReasons: string[] = []

  if (movement == null) unknownReasons.push('movementTime')
  if (stationary == null) unknownReasons.push('stationaryDwell')

  if (input.contentMayOverlapMovement == null) {
    // UNKNOWN overlap capability — cannot assume walk-compat overlaps movement.
    if (walkCompat != null && walkCompat > 0) unknownReasons.push('contentMayOverlapMovement')
    const elapsed =
      movement != null && stationary != null
        ? movement + stationary + (walkCompat ?? 0)
        : null
    return { elapsedMin: elapsed, unknownReasons }
  }

  if (input.contentMayOverlapMovement === true) {
    // Walk-compatible content overlaps movement — do not add walkCompat on top of movement.
    const elapsed =
      movement != null && stationary != null ? movement + stationary : null
    return { elapsedMin: elapsed, unknownReasons }
  }

  // Explicitly non-overlapping: all content adds.
  const elapsed =
    movement != null && stationary != null
      ? movement + stationary + (walkCompat ?? 0)
      : null
  return { elapsedMin: elapsed, unknownReasons }
}

/** Require provenance on calibrated (non-null) time values. */
export function assertCalibratedProvenance(profile: ExperienceTimeProfile): string[] {
  const errors: string[] = []
  const hasCalibrated =
    profile.dwellTypical != null ||
    profile.dwellMin != null ||
    profile.dwellMax != null ||
    profile.accessOverheadMin != null

  if (hasCalibrated && (profile.provenance == null || profile.provenance === 'UNKNOWN')) {
    errors.push('calibrated_time_requires_non_unknown_provenance')
  }
  if (profile.visitMode !== 'UNKNOWN' && profile.provenance === 'UNKNOWN') {
    errors.push('assigned_visit_mode_requires_provenance')
  }
  return errors
}
