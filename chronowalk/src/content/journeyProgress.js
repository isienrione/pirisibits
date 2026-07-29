import { getDistance } from '../utils/distance'
import { formatWalkedDistance } from '../utils/tourStats'
import { buildEffectiveSequence } from './optionalPromotion.js'

/**
 * @param {import('./manifest.schema.js').RomeTourManifest} manifest
 * @param {import('./manifest.schema.js').ManifestStop | null} currentStop
 */
export function getNextStop(manifest, currentStop) {
  if (!manifest || !currentStop) return null

  if (currentStop.nextStopId) {
    return manifest.stopsById[currentStop.nextStopId] ?? null
  }

  const nextIndex = currentStop.number
  return manifest.stops[nextIndex] ?? null
}

/**
 * @param {import('./manifest.schema.js').RomeTourManifest} manifest
 * @param {import('./manifest.schema.js').ManifestStop | null} currentStop
 */
export function isLastStop(manifest, currentStop) {
  if (!manifest || !currentStop) return false
  return getNextStop(manifest, currentStop) == null
}

function stopCoords(stop) {
  if (stop?.coords?.lat != null && stop?.coords?.lng != null) return stop.coords
  if (stop?.geofence?.lat != null && stop?.geofence?.lng != null) return stop.geofence
  return null
}

/**
 * @param {import('./manifest.schema.js').ManifestStop | null} fromStop
 * @param {import('./manifest.schema.js').ManifestStop | null} toStop
 */
export function estimateDistanceBetweenStops(fromStop, toStop) {
  const from = stopCoords(fromStop)
  const to = stopCoords(toStop)
  if (!from || !to) return null

  const meters = getDistance(from.lat, from.lng, to.lat, to.lng)

  if (!Number.isFinite(meters) || meters <= 0) return null
  return meters
}

/** Beyond this, GPS is almost certainly wrong or the traveller isn't on-site yet. */
export const MAX_PLAUSIBLE_WALK_DISTANCE_M = 12_000

export function sanitizeWalkDistanceM(meters) {
  if (meters == null || !Number.isFinite(meters) || meters < 0) return null
  if (meters > MAX_PLAUSIBLE_WALK_DISTANCE_M) return null
  return meters
}

export function formatDistanceToNext(meters) {
  if (meters == null) return null
  return formatWalkedDistance(meters)
}

/**
 * Walking time estimate using a brisk tourist pace (100 m/min ≈ 6 km/h).
 * For longer walks (brisk >= 8 min) where the leisurely pace (80 m/min) differs
 * by at least 2 minutes, returns a "brisk–leisure min walk" range so travellers
 * with different walking speeds both feel the estimate is accurate.
 */
export function formatWalkingTime(meters) {
  if (!meters || meters <= 0) return null
  const brisk = Math.max(1, Math.round(meters / 100))
  const leisure = Math.max(1, Math.round(meters / 80))
  if (brisk >= 8 && leisure - brisk >= 2) {
    return `${brisk}–${leisure} min walk`
  }
  return `${brisk} min walk`
}

/**
 * Rough journey progress along the effective sequence (0–100).
 */
export function resolveJourneyProgressPct(
  manifest,
  path,
  sequenceIndex,
  promotedOptionalIds = []
) {
  if (!manifest) return 0

  const sequence = buildEffectiveSequence(manifest, path, promotedOptionalIds)
  if (!sequence.length) return 0
  if (sequence.length === 1) return 100

  return Math.round(
    Math.min(100, Math.max(0, (sequenceIndex / (sequence.length - 1)) * 100))
  )
}

/**
 * @param {string[]} completedStopIds
 * @param {string} stopId
 */
export function markStopCompleted(completedStopIds, stopId) {
  if (!stopId) return [...(completedStopIds ?? [])]
  return [...new Set([...(completedStopIds ?? []), stopId])]
}

/**
 * @param {import('./manifest.schema.js').RomeTourManifest} manifest
 * @param {object} context
 * @param {import('./manifest.schema.js').ManifestStop | null} currentStop
 */
export function planContinueWalking(manifest, context, currentStop) {
  if (!manifest || !currentStop) {
    return { ok: false, reason: 'missing-stop' }
  }

  const completedStopIds = markStopCompleted(context.completedStopIds, currentStop.id)
  const nextStop = getNextStop(manifest, currentStop)

  if (!nextStop) {
    return {
      ok: true,
      isComplete: true,
      completedStopIds,
      nextStop: null,
      nextContext: {
        completedStopIds,
        currentStopId: currentStop.id,
        currentStopIndex: currentStop.number - 1,
        audioProgress: 0,
      },
    }
  }

  return {
    ok: true,
    isComplete: false,
    completedStopIds,
    nextStop,
    nextContext: {
      completedStopIds,
      currentStopId: nextStop.id,
      currentStopIndex: nextStop.number - 1,
      audioProgress: 0,
    },
  }
}
