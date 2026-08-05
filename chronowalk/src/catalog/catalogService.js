/**
 * Runtime catalog service — facade over city package registries.
 *
 * Not wired into production screens yet. Live Rome continues to use
 * loadRomeManifest() → src/content/rome/manifest.json.
 */

import {
  clearCityRegistryCache,
  getPublishedPackage,
  listPublishedCityRecords,
  toCityRecord,
} from './cityRegistry.js'
import {
  findProductById,
  findProductBySlug,
  listProductsForCity,
} from './productRegistry.js'
import { findRouteById, listRoutesForProduct } from './routeRegistry.js'
import { findStopById, listStopsForRoute } from './stopRegistry.js'
import {
  resolveLegacyProductId,
  resolveLegacyRoute,
  resolveLegacyStopId,
  resolveLegacyWaypoint,
} from './legacyRomeAdapter.js'

export function clearCatalogCache() {
  clearCityRegistryCache()
}

/** @returns {ReturnType<typeof toCityRecord>[]} */
export function getPublishedCities() {
  return listPublishedCityRecords()
}

/**
 * @param {string} cityId
 * @returns {ReturnType<typeof toCityRecord> | null}
 */
export function getCityById(cityId) {
  const pkg = getPublishedPackage(cityId)
  return pkg ? toCityRecord(pkg) : null
}

/**
 * @param {string} slug
 * @returns {ReturnType<typeof toCityRecord> | null}
 */
export function getCityBySlug(slug) {
  if (!slug) return null
  const normalized = String(slug).trim().toLowerCase()
  return (
    getPublishedCities().find(
      (city) =>
        city.slug.toLowerCase() === normalized ||
        city.cityId.toLowerCase() === normalized,
    ) ?? null
  )
}

/**
 * @param {string} cityId
 */
export function getProductsForCity(cityId) {
  return listProductsForCity(cityId)
}

/**
 * @param {string} productId
 */
export function getProductById(productId) {
  return findProductById(productId)
}

/**
 * @param {string} slug
 */
export function getProductBySlug(slug) {
  return findProductBySlug(slug)
}

/**
 * @param {string} productId
 */
export function getRoutesForProduct(productId) {
  return listRoutesForProduct(productId)
}

/**
 * @param {string} routeId
 */
export function getRouteById(routeId) {
  return findRouteById(routeId)
}

/**
 * @param {string} routeId
 */
export function getStopsForRoute(routeId) {
  return listStopsForRoute(routeId)
}

/**
 * @param {string} stopId
 * @param {string} [cityId]
 */
export function getStopById(stopId, cityId) {
  return findStopById(stopId, cityId)
}

export {
  resolveLegacyStopId,
  resolveLegacyRoute,
  resolveLegacyWaypoint,
  resolveLegacyProductId,
}
