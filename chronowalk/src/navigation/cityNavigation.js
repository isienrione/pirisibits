/**
 * City-level navigation helpers.
 */

import { getPublishedCities, getCityById, getCityBySlug } from '../catalog/index.js'
import { createNavigationTarget, normalizeSlug } from './navigationRegistry.js'

/**
 * Re-export published cities for the platform → cities navigation surface.
 * @returns {ReturnType<typeof getPublishedCities>}
 */
export function listNavigableCities() {
  return getPublishedCities()
}

/**
 * Future public city hub path capability: `/{citySlug}`
 * Not wired into AppRouter yet.
 *
 * @param {string} cityId
 * @returns {import('./navigationRegistry.js').NavigationTarget | null}
 */
export function getCityRoute(cityId) {
  const city = getCityById(cityId)
  if (!city) return null
  const slug = normalizeSlug(city.slug ?? city.cityId)
  return createNavigationTarget({
    kind: 'city',
    cityId: city.cityId,
    pathname: `/${slug}`,
    isFuture: true,
  })
}

/**
 * @param {string} slug
 * @returns {ReturnType<typeof getCityBySlug> | null}
 */
export function resolveCitySlug(slug) {
  const normalized = normalizeSlug(slug)
  if (!normalized) return null
  return getCityBySlug(normalized) ?? getCityById(normalized)
}
