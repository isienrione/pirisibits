/**
 * Traveler-facing distance guards.
 *
 * Ranker / layout may still inspect raw coordinates. UI copy must never
 * invent a walk from 0,0, malformed GPS, or a point outside the current city.
 */

import { getDistance } from '../utils/distance.js'

/** Generous historic-center + immediate outskirts box for Rome browsing. */
export const ROME_BOUNDS = Object.freeze({
  minLat: 41.82,
  maxLat: 41.98,
  minLng: 12.38,
  maxLng: 12.62,
})

/** Farther than this is not a "nearby" claim for a walking product in Rome. */
export const MAX_TRAVELER_DISTANCE_M = 15_000

export function isValidLatLng(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  if (lat === 0 && lng === 0) return false
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false
  return true
}

export function coordsOf(value) {
  if (!value || typeof value !== 'object') return null
  const lat = Number(value.lat)
  const lng = Number(value.lng)
  if (!isValidLatLng(lat, lng)) return null
  return { lat, lng }
}

export function isPlausibleRomePosition(value) {
  const coords = coordsOf(value)
  if (!coords) return false
  return (
    coords.lat >= ROME_BOUNDS.minLat &&
    coords.lat <= ROME_BOUNDS.maxLat &&
    coords.lng >= ROME_BOUNDS.minLng &&
    coords.lng <= ROME_BOUNDS.maxLng
  )
}

/**
 * Distance in meters suitable for traveler copy.
 * Returns null when either point is missing, 0,0, malformed, outside Rome,
 * or the result is implausible for walking the current city.
 */
export function travelerFacingDistanceM(from, to) {
  if (!isPlausibleRomePosition(from) || !isPlausibleRomePosition(to)) return null
  const a = coordsOf(from)
  const b = coordsOf(to)
  const distanceM = getDistance(a.lat, a.lng, b.lat, b.lng)
  if (!Number.isFinite(distanceM) || distanceM < 0 || distanceM > MAX_TRAVELER_DISTANCE_M) {
    return null
  }
  return distanceM
}

export function isDisplayableDistanceM(distanceM) {
  return Number.isFinite(distanceM) && distanceM >= 0 && distanceM <= MAX_TRAVELER_DISTANCE_M
}
