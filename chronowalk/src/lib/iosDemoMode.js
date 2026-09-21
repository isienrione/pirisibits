/**
 * App Store reviewer / remote demo mode (iOS only).
 * Simulates being at each stop so audio, reveal, and content work without GPS in Rome.
 */

import { IS_IOS } from './platform.js'
import { getTourWaypointIds } from '../content/myTourPlan.js'
import { getWaypoint } from '../content/manifest.js'
import { getDistance } from '../utils/distance.js'

export const IOS_DEMO_MODE_KEY = 'cw_ios_demo_mode'
export const IOS_DEMO_CHANGED = 'cw-ios-demo-changed'
/** Offer demo mode when the traveler is farther than this from any route stop. */
export const IOS_DEMO_FAR_FROM_ROUTE_M = 5000

function notify() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(IOS_DEMO_CHANGED))
}

export function isIosDemoMode() {
  if (!IS_IOS) return false
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(IOS_DEMO_MODE_KEY) === '1'
  } catch {
    return false
  }
}

export function enableIosDemoMode() {
  if (!IS_IOS || typeof window === 'undefined') return false
  try {
    window.sessionStorage.setItem(IOS_DEMO_MODE_KEY, '1')
  } catch {
    return false
  }
  notify()
  return true
}

export function disableIosDemoMode() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(IOS_DEMO_MODE_KEY)
  } catch {
    /* ignore */
  }
  notify()
}

/** Subscribe to demo-mode toggles. Returns unsubscribe. */
export function subscribeIosDemoMode(listener) {
  if (typeof window === 'undefined') return () => {}
  const handler = () => listener(isIosDemoMode())
  window.addEventListener(IOS_DEMO_CHANGED, handler)
  return () => window.removeEventListener(IOS_DEMO_CHANGED, handler)
}

/**
 * Minimum distance (m) from position to any tour waypoint geofence center.
 * @returns {number | null}
 */
export function distanceToNearestRouteStopM(manifest, context, position) {
  if (!manifest || !position) return null
  const ids = getTourWaypointIds(manifest, context)
  let best = Infinity
  for (const id of ids) {
    const waypoint = getWaypoint(manifest, id)
    if (!waypoint?.geofence) continue
    const dist = getDistance(
      position.lat,
      position.lng,
      waypoint.geofence.lat,
      waypoint.geofence.lng,
    )
    if (dist < best) best = dist
  }
  return Number.isFinite(best) ? best : null
}

/**
 * Whether to surface the "Preview the walk from anywhere" CTA.
 * Always on iOS first screen; also when GPS denied or >5 km from route.
 */
export function shouldOfferIosDemoPreview({
  locationDenied = false,
  distanceFromRouteM = null,
} = {}) {
  if (!IS_IOS) return false
  if (isIosDemoMode()) return true
  if (locationDenied) return true
  if (
    typeof distanceFromRouteM === 'number' &&
    distanceFromRouteM > IOS_DEMO_FAR_FROM_ROUTE_M
  ) {
    return true
  }
  // First-screen visibility for App Store reviewers (always available on iOS).
  return true
}

/** Ordered visit stop ids for demo stepping. */
export function getIosDemoStopIds(manifest, context) {
  if (!manifest) return []
  return getTourWaypointIds(manifest, context)
}

export function getIosDemoStopIndex(manifest, context, waypointId) {
  const ids = getIosDemoStopIds(manifest, context)
  return ids.indexOf(waypointId)
}
