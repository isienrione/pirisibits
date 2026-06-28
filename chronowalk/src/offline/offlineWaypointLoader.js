import { isNavigatorOnline } from '../hooks/useNetworkStatus'
import { MEDIA_URL_KEYS } from '../services/waypointMerge'
import {
  fetchWaypointById,
  normalizeWaypoint,
  resolveAssetUrl,
} from '../services/waypointService'
import { isTourDownloaded, resolveOfflineMediaUrl } from './tourPackage'
import { getOfflineWaypointRecord } from './offlineStorage'

function offlineRecordToWaypoint(record) {
  if (!record) return null

  return {
    id: record.stopId,
    title: record.title,
    ...record.metadata,
  }
}

async function hydrateWaypointMedia(tourId, waypoint) {
  if (!tourId || !waypoint) return waypoint

  const downloaded = await isTourDownloaded(tourId)
  if (!downloaded) return waypoint

  const hydrated = { ...waypoint }

  await Promise.all(
    MEDIA_URL_KEYS.map(async (field) => {
      const url = hydrated[field]
      if (!url) return

      const offlineUrl = await resolveOfflineMediaUrl(tourId, waypoint.id, field, url)
      if (offlineUrl) hydrated[field] = offlineUrl
    })
  )

  return hydrated
}

async function loadOfflineWaypoint(tourId, stopId) {
  const record = await getOfflineWaypointRecord(tourId, stopId)
  if (!record) return null

  const waypoint = normalizeWaypoint(offlineRecordToWaypoint(record))
  return hydrateWaypointMedia(tourId, waypoint)
}

/**
 * Loads a waypoint for tour runtime, preferring downloaded content when offline.
 */
export async function fetchWaypointForTour(tourId, stopId) {
  const online = isNavigatorOnline()

  if (!online && tourId) {
    const offlineWaypoint = await loadOfflineWaypoint(tourId, stopId)
    if (offlineWaypoint) return offlineWaypoint
  }

  try {
    const waypoint = await fetchWaypointById(stopId)

    if (tourId) {
      return hydrateWaypointMedia(tourId, waypoint)
    }

    return waypoint
  } catch (error) {
    if (tourId) {
      const offlineWaypoint = await loadOfflineWaypoint(tourId, stopId)
      if (offlineWaypoint) return offlineWaypoint
    }

    throw error
  }
}

/**
 * Loads all tour stops, falling back to local seed or offline records when needed.
 */
export async function fetchTourWaypoints(tourId, stopIds) {
  const results = await Promise.all(
    stopIds.map(async (stopId) => {
      try {
        return await fetchWaypointForTour(tourId, stopId)
      } catch (error) {
        console.warn(`offlineWaypointLoader: failed to load ${stopId}.`, error)
        return null
      }
    })
  )

  return results.filter(Boolean)
}

export { hydrateWaypointMedia, resolveAssetUrl }
