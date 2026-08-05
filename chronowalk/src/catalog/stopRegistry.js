/**
 * Stop registry — stops from published city packages.
 */

import { getPublishedPackage, loadPublishedCityPackages } from './cityRegistry.js'
import { findRouteById } from './routeRegistry.js'

/**
 * @param {object} stop
 */
export function toStopRecord(stop) {
  return {
    stopId: stop.stopId,
    cityId: stop.cityId,
    name: stop.name ?? null,
    actId: stop.actId ?? null,
    zone: stop.zone ?? null,
    location: stop.location
      ? { lat: stop.location.lat, lng: stop.location.lng }
      : stop.geofence
        ? { lat: stop.geofence.lat, lng: stop.geofence.lng }
        : null,
    geofence: stop.geofence
      ? {
          lat: stop.geofence.lat,
          lng: stop.geofence.lng,
          radius_m: stop.geofence.radius_m,
        }
      : null,
    optionalOnPath: stop.optionalOnPath ?? null,
    scriptedRest: Boolean(stop.scriptedRest),
    display: stop.display ?? null,
  }
}

/**
 * @param {string} stopId
 * @param {string} [cityId]
 * @returns {ReturnType<typeof toStopRecord> | null}
 */
export function findStopById(stopId, cityId) {
  if (!stopId) return null
  if (cityId) {
    const pkg = getPublishedPackage(cityId)
    const stop = pkg?.stops?.find((s) => s.stopId === stopId)
    return stop ? toStopRecord(stop) : null
  }
  for (const pkg of loadPublishedCityPackages()) {
    const stop = (pkg.stops ?? []).find((s) => s.stopId === stopId)
    if (stop) return toStopRecord(stop)
  }
  return null
}

/**
 * Ordered stop records for a route (by displayOrder).
 *
 * @param {string} routeId
 * @returns {Array<ReturnType<typeof toStopRecord> & { displayOrder: number }>}
 */
export function listStopsForRoute(routeId) {
  const route = findRouteById(routeId)
  if (!route) return []

  const ordered = [...route.stops].sort((a, b) => a.displayOrder - b.displayOrder)
  /** @type {Array<ReturnType<typeof toStopRecord> & { displayOrder: number }>} */
  const out = []
  for (const ref of ordered) {
    const stop = findStopById(ref.stopId, route.cityId)
    if (!stop) continue
    out.push({ ...stop, displayOrder: ref.displayOrder })
  }
  return out
}

/**
 * @param {string} cityId
 * @returns {ReturnType<typeof toStopRecord>[]}
 */
export function listStopsForCity(cityId) {
  const pkg = getPublishedPackage(cityId)
  if (!pkg) return []
  return (pkg.stops ?? []).map(toStopRecord)
}
