/**
 * Gate 2E.6 — Experience-Time VNext executable engine + EMT + time modes.
 */

import {
  computeEmtMovementWithGuardrails,
  recomputeRouteTimeFromSequence,
  EMT_MOVEMENT_EPSILON,
  type EmtMovementLegs,
} from '@/src/engine/routes/experience-time/vnext/emt-guardrails'
import { computeTwoChannelElapsed, WALKING_NARRATION_CAPACITY_POLICY } from '@/src/engine/routes/experience-time/vnext/place-experience-schema'
import type { ExperienceRecord } from '@/src/engine/vnext/place/types'
import type { EngineNodeRecord } from '@/src/engine/types'

export type TimeEvaluationMode = 'STRICT_EXPERIENCE_TIME' | 'LEGACY_COMPATIBILITY' | 'DIAGNOSTIC_UNKNOWN'

export type ExperienceTimeEvalResult = {
  experienceId: string
  mode: TimeEvaluationMode
  usable: boolean
  movementTime: number | null
  stationaryDwell: number | null
  requiredAccessOverhead: number | null
  walkCompatibleContent: number | null
  optionalExtensionTime: number | null
  coreRouteContributionMin: number | null
  timeEvidence: 'EXPERIENCE_TIME' | 'LEGACY_SCALAR_DWELL' | 'UNKNOWN'
  experienceTimeCalibrated: boolean
  disclosure: string[]
  unknowns: string[]
}

export function evaluateExperienceTime(args: {
  experience: ExperienceRecord
  node?: EngineNodeRecord | null
  mode: TimeEvaluationMode
}): ExperienceTimeEvalResult {
  const { experience, node, mode } = args
  const disclosure: string[] = []
  const unknowns: string[] = []
  const profile = experience.experienceTimeProfile

  if (mode === 'STRICT_EXPERIENCE_TIME') {
    if (profile.unknown || profile.stationaryDwellMin == null) {
      unknowns.push('stationaryDwellMin')
      return {
        experienceId: experience.experienceId,
        mode,
        usable: false,
        movementTime: null,
        stationaryDwell: null,
        requiredAccessOverhead: profile.requiredAccessOverheadMin,
        walkCompatibleContent: profile.walkCompatibleContentMin,
        optionalExtensionTime: profile.optionalExtensionTimeMin,
        coreRouteContributionMin: null,
        timeEvidence: 'UNKNOWN',
        experienceTimeCalibrated: false,
        disclosure: ['STRICT: UNKNOWN required time → unusable'],
        unknowns,
      }
    }
  }

  if (mode === 'DIAGNOSTIC_UNKNOWN') {
    unknowns.push('DIAGNOSTIC_UNKNOWN_NO_SUBSTITUTION')
    return {
      experienceId: experience.experienceId,
      mode,
      usable: true,
      movementTime: null,
      stationaryDwell: null,
      requiredAccessOverhead: null,
      walkCompatibleContent: null,
      optionalExtensionTime: null,
      coreRouteContributionMin: null,
      timeEvidence: 'UNKNOWN',
      experienceTimeCalibrated: false,
      disclosure: ['DIAGNOSTIC_UNKNOWN: propagating UNKNOWN without substitution'],
      unknowns,
    }
  }

  // LEGACY_COMPATIBILITY — use existing scalar visitTime.typical only through adapter path
  const legacyTypical =
    (node as { visitTimeTypical?: number | null } | null | undefined)?.visitTimeTypical ??
    (node as { visitDurationMinutes?: number | null } | null | undefined)?.visitDurationMinutes ??
    null
  const dwell =
    profile.stationaryDwellMin ??
    (legacyTypical != null && Number.isFinite(legacyTypical) ? Number(legacyTypical) : null)
  const access = profile.requiredAccessOverheadMin ?? 0
  if (profile.stationaryDwellMin == null && dwell != null) {
    disclosure.push('TIME MODEL: LEGACY COMPATIBILITY')
    disclosure.push('EXPERIENCE-TIME CALIBRATION PENDING')
    disclosure.push('timeEvidence=LEGACY_SCALAR_DWELL')
  }
  if (dwell == null) unknowns.push('stationaryDwellMin')

  const core =
    dwell == null
      ? null
      : computeTwoChannelElapsed({
          movementMin: 0,
          stationaryDwellMin: dwell,
          accessOverheadMin: access,
        }).elapsedMin

  return {
    experienceId: experience.experienceId,
    mode,
    usable: dwell != null,
    movementTime: null,
    stationaryDwell: dwell,
    requiredAccessOverhead: access,
    walkCompatibleContent: profile.walkCompatibleContentMin,
    optionalExtensionTime: profile.optionalExtensionTimeMin,
    coreRouteContributionMin: core,
    timeEvidence: profile.stationaryDwellMin != null ? 'EXPERIENCE_TIME' : dwell != null ? 'LEGACY_SCALAR_DWELL' : 'UNKNOWN',
    experienceTimeCalibrated: profile.stationaryDwellMin != null && !profile.unknown,
    disclosure,
    unknowns,
  }
}

/**
 * CORE_ROUTE_TIME = movement + stationaryDwell + required access overhead.
 * Authored content does NOT automatically add elapsed time.
 */
export function computeCoreRouteTime(parts: {
  movementTimesMin: number[]
  stationaryDwellsMin: number[]
  accessOverheadsMin: number[]
}): number {
  return recomputeRouteTimeFromSequence({
    movementLegsMin: parts.movementTimesMin,
    stationaryDwellsMin: parts.stationaryDwellsMin,
    accessOverheadsMin: parts.accessOverheadsMin,
  })
}

export type EffectiveMarginalTimeResult = {
  emt: number | null
  movementMarginal: number | null
  ok: boolean
  errors: string[]
  components: {
    movementAX: number
    movementXB: number
    movementAB: number
    stationaryDwellX: number
    accessOverheadX: number
  }
}

export function computeEffectiveMarginalTime(args: {
  legs: EmtMovementLegs
  expected: {
    routingSnapshotId: string
    modeAssumptions: string
    travelerPhysicalCoefficientsVersion: string
    evidenceVersion: string
  }
  stationaryDwellX: number
  accessOverheadX: number
}): EffectiveMarginalTimeResult {
  const g = computeEmtMovementWithGuardrails(args.legs, args.expected)
  const emt =
    g.emtMovement + Number(args.stationaryDwellX) + Number(args.accessOverheadX)
  return {
    emt: g.ok || g.emtMovement >= -EMT_MOVEMENT_EPSILON ? emt : null,
    movementMarginal: g.emtMovement,
    ok: g.ok,
    errors: g.errors,
    components: {
      movementAX: args.legs.movementAX,
      movementXB: args.legs.movementXB,
      movementAB: args.legs.movementAB,
      stationaryDwellX: args.stationaryDwellX,
      accessOverheadX: args.accessOverheadX,
    },
  }
}

export { WALKING_NARRATION_CAPACITY_POLICY, EMT_MOVEMENT_EPSILON, recomputeRouteTimeFromSequence }
