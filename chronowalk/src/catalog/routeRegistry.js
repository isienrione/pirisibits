/**
 * Route registry — routes from published city packages.
 */

import { getPublishedPackage, loadPublishedCityPackages } from './cityRegistry.js'

/**
 * @param {object} route
 */
export function toRouteRecord(route) {
  return {
    routeId: route.routeId,
    cityId: route.cityId,
    productId: route.productId ?? null,
    name: route.name,
    pathKey: route.pathKey ?? null,
    stops: (route.stops ?? []).map((ref) => ({
      stopId: ref.stopId,
      displayOrder: ref.displayOrder,
    })),
    sequence: route.sequence ? [...route.sequence] : null,
  }
}

/**
 * @param {string} productId
 * @returns {ReturnType<typeof toRouteRecord>[]}
 */
export function listRoutesForProduct(productId) {
  if (!productId) return []
  const routes = []
  for (const pkg of loadPublishedCityPackages()) {
    for (const route of pkg.routes ?? []) {
      if (route.productId === productId) routes.push(toRouteRecord(route))
    }
  }
  return routes
}

/**
 * @param {string} routeId
 * @returns {ReturnType<typeof toRouteRecord> | null}
 */
export function findRouteById(routeId) {
  if (!routeId) return null
  for (const pkg of loadPublishedCityPackages()) {
    const route = (pkg.routes ?? []).find((r) => r.routeId === routeId)
    if (route) return toRouteRecord(route)
  }
  return null
}

/**
 * @param {string} cityId
 * @returns {ReturnType<typeof toRouteRecord>[]}
 */
export function listRoutesForCity(cityId) {
  const pkg = getPublishedPackage(cityId)
  if (!pkg) return []
  return (pkg.routes ?? []).map(toRouteRecord)
}
