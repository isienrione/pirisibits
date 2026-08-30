/**
 * Gate 2E.4 — traveler × experience-mode interaction (architecture only).
 * No UI. No live LLM.
 */

import type { ExperienceTimeProfile, TravelerExperiencePreferences, VisitMode } from './types'

const INTERIOR_MODES: ReadonlySet<VisitMode> = new Set(['INTERIOR_CORE', 'OPTIONAL_INTERIOR', 'EXTENDED_VISIT'])

/**
 * Filter profiles by traveler preferences.
 * UNKNOWN ticket/hours flags do not auto-exclude (insufficient evidence).
 */
export function filterProfilesForTraveler(
  profiles: ExperienceTimeProfile[],
  prefs: TravelerExperiencePreferences,
): ExperienceTimeProfile[] {
  return profiles.filter((p) => {
    if (prefs.excludeTicketDependentInteriors === true) {
      if (INTERIOR_MODES.has(p.visitMode) && p.ticketDependent === true) {
        return false
      }
    }

    if (prefs.preferMuseumsInteriors === false) {
      if (p.visitMode === 'INTERIOR_CORE' || p.visitMode === 'OPTIONAL_INTERIOR') {
        return false
      }
    }

    if (prefs.preferSlowDeepExploration !== true && p.visitMode === 'EXTENDED_VISIT') {
      // Extended modes eligible only when slow/deep exploration requested.
      return false
    }

    if (prefs.includeOptionalExtensions !== true) {
      if (p.canBeOptionalExtension === true || p.stopRole === 'OPTIONAL_EXTENSION') {
        // Still return profile for reporting; caller decides inclusion in core budget.
        // Filtering here only removes ticket-ineligible / depth-ineligible modes.
      }
    }

    return true
  })
}

/**
 * Whether an experience counts toward CORE_ROUTE_TIME given traveler request.
 */
export function countsTowardCoreRoute(
  profile: ExperienceTimeProfile,
  prefs: TravelerExperiencePreferences,
): boolean {
  if (profile.stopRole === 'OPTIONAL_EXTENSION' || profile.canBeOptionalExtension === true) {
    return prefs.includeOptionalExtensions === true
  }
  if (profile.visitMode === 'OPTIONAL_INTERIOR') {
    return prefs.includeOptionalExtensions === true
  }
  // ENROUTE_DISCOVERY may still contribute dwell if stationary dwell > 0;
  // classification alone does not force zero — evaluator uses declared dwell.
  return true
}

/**
 * Dense urban cores: no commune-specific stop quotas.
 * Composer should eventually react to effective marginal time (lower in dense areas).
 */
export const DENSE_CORE_POLICY_V0_1 = {
  communeStopQuotas: false as const,
  mechanism: 'effective_marginal_time' as const,
  rationale:
    'Dense areas naturally support more experiences because marginal movement cost is lower; do not invent Centro=10 / Las Condes=6 quotas.',
} as const
