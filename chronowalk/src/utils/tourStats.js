import { getDistance } from './distance'
import { getWaypointGeo } from '../data/waypointGeo'

/** Rough straight-line distance across completed tour legs (meters). */
export function estimateWalkedDistanceMeters(tour, arrivedStopIds = []) {
  if (!tour?.stopIds?.length || arrivedStopIds.length < 2) return 0

  let total = 0
  for (let index = 1; index < tour.stopIds.length; index += 1) {
    const fromId = tour.stopIds[index - 1]
    const toId = tour.stopIds[index]
    if (!arrivedStopIds.includes(fromId) || !arrivedStopIds.includes(toId)) continue

    const from = getWaypointGeo(fromId)?.landmark
    const to = getWaypointGeo(toId)?.landmark
    if (from && to) {
      total += getDistance(from.lat, from.lng, to.lat, to.lng)
    }
  }

  return total
}

export function formatWalkedDistance(meters) {
  if (!meters || meters < 1) return '—'
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function formatElapsedDuration(startedAtMs) {
  if (!startedAtMs) return '—'
  const minutes = Math.max(1, Math.round((Date.now() - startedAtMs) / 60000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

export function estimateWalkMinutes(distanceMeters) {
  if (distanceMeters == null || Number.isNaN(distanceMeters)) return null
  return Math.max(1, Math.ceil(distanceMeters / 80))
}
