import { track } from '../track.js'
import { distanceBucket, durationBucket } from './model.js'

export const ROUTE_TRACK_EVENTS = Object.freeze({
  ROUTE_PROPOSED: 'route_proposed',
  ROUTE_STARTED: 'route_started',
  ROUTE_ADJUSTED: 'route_adjusted',
  ROUTE_ITEM_STARTED: 'route_item_started',
  ROUTE_ITEM_COMPLETED: 'route_item_completed',
  ROUTE_ITEM_SKIPPED: 'route_item_skipped',
  ROUTE_ALTERNATIVE_VIEWED: 'route_alternative_viewed',
  ROUTE_ALTERNATIVE_SELECTED: 'route_alternative_selected',
  MYSTERY_DISCOVERY_OFFERED: 'mystery_discovery_offered',
  MYSTERY_DISCOVERY_ACCEPTED: 'mystery_discovery_accepted',
  MYSTERY_DISCOVERY_REVEALED_EARLY: 'mystery_discovery_revealed_early',
  ROUTE_PAUSED: 'route_paused',
  ROUTE_RESUMED: 'route_resumed',
  ROUTE_ENDED: 'route_ended',
  ROUTE_COMPLETED: 'route_completed',
})

const ALLOWED = new Set([
  'cityId',
  'routeId',
  'contentId',
  'contentType',
  'position',
  'reason',
  'durationBucket',
  'distanceBucket',
])

export function sanitizeRouteProps(properties = {}) {
  const out = {}
  for (const [key, value] of Object.entries(properties)) {
    if (!ALLOWED.has(key) || value == null || value === '') continue
    out[key] = value
  }
  return out
}

export function trackRoute(event, properties = {}) {
  const clean = sanitizeRouteProps(properties)
  if (Number.isFinite(properties.durationMin) && !clean.durationBucket) {
    clean.durationBucket = durationBucket(properties.durationMin)
  }
  if (Number.isFinite(properties.distanceM) && !clean.distanceBucket) {
    clean.distanceBucket = distanceBucket(properties.distanceM)
  }
  return track(event, clean)
}

export function trackMysteryOffered(properties = {}) {
  return trackRoute(ROUTE_TRACK_EVENTS.MYSTERY_DISCOVERY_OFFERED, properties)
}
