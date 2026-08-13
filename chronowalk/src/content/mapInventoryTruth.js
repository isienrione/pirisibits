/**
 * MAP inventory honesty (Day 3B) — unlock vs marketing projections.
 *
 * Runtime unlock authority: TOUR_TIER_WAYPOINTS / getTourWaypointIds.
 * Marketing lists (landing kebab arrays, catalog stopCount) are projections.
 * Recommendation code must never derive eligibility from marketing lists.
 */

import { JOURNEY_PACE } from '../data/romePacing.js'
import { TOUR_TIER_WAYPOINTS } from '../data/tourTiers.js'

/**
 * Roma Historica (central) unlock visit IDs — authoritative for entitlements /
 * Near Me / recommendations. Includes Pantheon interior (w23) and Via Appia (w22).
 */
export const CENTRAL_UNLOCK_VISIT_IDS = Object.freeze([
  ...TOUR_TIER_WAYPOINTS[JOURNEY_PACE.CENTRAL],
])

/**
 * Marketing “8 centro stops” projection for Roma Historica.
 * - Pantheon exterior + interior (w17 + w23) collapse to one marketed place.
 * - Via Appia (w22) is unlocked as the encore act; marketing lists it as encore
 *   (not one of the eight centro places). Product actDots still include encore.
 *
 * This is an intentional public-place projection, not the unlock set.
 */
export const CENTRAL_MARKETING_CENTRO_PLACE_IDS = Object.freeze([
  'w14', // Trajan's Market
  'w15', // Spanish Steps
  'w16', // Trevi
  'w17', // Pantheon (markets as one place; runtime also unlocks w23 interior)
  'w18', // Navona
  'w19', // Campo
  'w20', // Largo Argentina
  'w21', // Castel Sant'Angelo
])

/** Encore place unlocked by central but outside the marketed “8 centro stops”. */
export const CENTRAL_ENCORE_PLACE_ID = 'w22'

/** Pantheon interior — unlocked with Historica, folded into marketed Pantheon. */
export const CENTRAL_PANTHEON_INTERIOR_ID = 'w23'

export function getCentralUnlockVisitIds() {
  return [...CENTRAL_UNLOCK_VISIT_IDS]
}

export function explainCentralMarketingProjection() {
  return {
    unlockVisitCount: CENTRAL_UNLOCK_VISIT_IDS.length,
    marketingCentroPlaceCount: CENTRAL_MARKETING_CENTRO_PLACE_IDS.length,
    pantheonInteriorFoldedIntoMarketing: CENTRAL_PANTHEON_INTERIOR_ID,
    encoreUnlockedButOutsideCentroEight: CENTRAL_ENCORE_PLACE_ID,
    recommendationAuthority: 'CENTRAL_UNLOCK_VISIT_IDS / TOUR_TIER_WAYPOINTS.central',
    marketingAuthority: 'landing arrays + catalog stopCount (projection only)',
  }
}

/**
 * Circus Maximus View (`enc_circus`) traversal policy after Day 3B.
 * - Path B: on-sequence after Palatine (w04), before Titus transit (t03).
 * - Path A: not on sequence (Path A skips the Palatine/Circus fork); still a
 *   catalog hero and classic-tier unlock member, but not recommendation-safe
 *   until the traveler is on Path B (or Path A is extended later).
 */
export const ENC_CIRCUS_TRAVERSAL = Object.freeze({
  placeId: 'enc_circus',
  pathA: false,
  pathB: true,
  afterPlaceId: 'w04',
  beforeTransitId: 't03',
})
