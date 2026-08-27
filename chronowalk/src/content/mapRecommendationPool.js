/**
 * MAP recommendation-safe hero pool (Day 3B).
 *
 * Eligibility only — no ranking. Operates on canonical place IDs + unlock
 * filters + sequence viability. Never reads landing arrays or kebab tours.
 */

import { HERO_STOP_IDS } from '../i18n/audio/heroStopAudioMap.js'
import { JOURNEY_PACE } from '../data/romePacing.js'
import { findSequenceIndexForWaypoint, getTourWaypointIds } from './myTourPlan.js'
import { getWaypoint } from './manifest.js'
import { isStoryStop, isVisitStop } from './tourProductTruth.js'

const HERO_ID_SET = new Set(HERO_STOP_IDS)

/**
 * Day-1 hero inventory (21). Source: HERO_STOP_IDS — not landing stop arrays.
 * @returns {readonly string[]}
 */
export function getDay1HeroInventoryIds() {
  return HERO_STOP_IDS
}

function hasValidGeo(waypoint) {
  const geo = waypoint?.geofence
  return (
    geo &&
    typeof geo.lat === 'number' &&
    Number.isFinite(geo.lat) &&
    typeof geo.lng === 'number' &&
    Number.isFinite(geo.lng) &&
    typeof geo.radius_m === 'number' &&
    geo.radius_m > 0
  )
}

/**
 * Whether a place can enter the existing journey ritual on the active path
 * (sequence index resolvable → jumpToWaypoint can succeed).
 */
export function canEnterJourneyRitual(manifest, placeId, context = {}) {
  if (!manifest || !placeId) return false
  const path = context.path ?? manifest.journey?.default_path ?? 'a'
  const index = findSequenceIndexForWaypoint(
    manifest,
    placeId,
    path,
    context.promotedOptionalIds ?? [],
  )
  return index >= 0
}

/**
 * A hero is recommendation-safe when it is a canonical hero place, unlocked
 * for the active scope, geo-valid, narrated, not pause/rest, and enterable
 * on the active path's journey sequence.
 */
export function isRecommendationSafeHero(manifest, placeId, context = {}) {
  if (!manifest || !placeId) return false
  if (placeId === 'pause') return false
  if (!HERO_ID_SET.has(placeId)) return false

  const waypoint = getWaypoint(manifest, placeId)
  if (!waypoint) return false
  if (!isVisitStop(waypoint)) return false
  if (!isStoryStop(waypoint)) return false
  if (!hasValidGeo(waypoint)) return false

  // MAP attach sets role:'hero' for HERO_STOP_IDS; accept either.
  if (waypoint.role != null && waypoint.role !== 'hero') return false

  const unlocked = new Set(getTourWaypointIds(manifest, context))
  if (!unlocked.has(placeId)) return false

  if (!canEnterJourneyRitual(manifest, placeId, context)) return false

  return true
}

/**
 * Ordered recommendation-safe heroes for a journey context (path + pace).
 * Order follows the unlocked tour list (path ∩ unlock), not marketing arrays.
 */
export function getRecommendationSafeHeroIds(manifest, context = {}) {
  if (!manifest) return []
  const pace = context.pace ?? JOURNEY_PACE.HEROIC
  const path = context.path ?? manifest.journey?.default_path ?? 'a'
  const ctx = { ...context, pace, path }
  return getTourWaypointIds(manifest, ctx).filter((id) =>
    isRecommendationSafeHero(manifest, id, ctx),
  )
}
