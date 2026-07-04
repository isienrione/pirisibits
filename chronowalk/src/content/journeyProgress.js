import { getDistance } from '../utils/distance'
import { formatWalkedDistance } from '../utils/tourStats'

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

/**
 * @param {import('./manifest.schema.js').ManifestStop | null} fromStop
 * @param {import('./manifest.schema.js').ManifestStop | null} toStop
 */
export function estimateDistanceBetweenStops(fromStop, toStop) {
  if (!fromStop?.coords || !toStop?.coords) return null

  const meters = getDistance(
    fromStop.coords.lat,
    fromStop.coords.lng,
    toStop.coords.lat,
    toStop.coords.lng
  )

  if (!Number.isFinite(meters) || meters <= 0) return null
  return meters
}

export function formatDistanceToNext(meters) {
  if (meters == null) return null
  return formatWalkedDistance(meters)
}

/** Rough walking pace for launch estimates (~4.8 km/h). */
export function formatWalkingTime(meters) {
  if (!meters || meters <= 0) return null
  const minutes = Math.max(1, Math.round(meters / 80))
  return `${minutes} min walk`
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
