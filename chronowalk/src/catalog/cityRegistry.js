/**
 * City registry — published cities only (never fixtures).
 */

import {
  listPackagedCityIds,
  loadPackagedCityPackage,
} from '../content/cityPackage/runtime.js'

/** @type {Map<string, import('../content/cityPackage/types.js').CityPackage> | null} */
let publishedCache = null

/**
 * Clear cached published packages (tests).
 */
export function clearCityRegistryCache() {
  publishedCache = null
}

/**
 * Test-only: inject published packages into the registry cache.
 * Used to prove onboarding a second city is data-driven.
 *
 * @param {import('../content/cityPackage/types.js').CityPackage[] | null} packages
 */
export function __setPublishedPackagesForTests(packages) {
  if (packages == null) {
    publishedCache = null
    return
  }
  publishedCache = new Map(packages.map((pkg) => [pkg.cityId, pkg]))
}

/**
 * Load published city packages. Fixtures and unpublished packages are excluded.
 * Data-driven: any package with `metadata.published === true` appears here.
 *
 * @returns {import('../content/cityPackage/types.js').CityPackage[]}
 */
export function loadPublishedCityPackages() {
  if (publishedCache) return [...publishedCache.values()]

  /** @type {Map<string, import('../content/cityPackage/types.js').CityPackage>} */
  const map = new Map()
  for (const cityId of listPackagedCityIds()) {
    const pkg = loadPackagedCityPackage(cityId)
    if (pkg.isFixture) continue
    if (pkg.metadata?.published !== true) continue
    map.set(pkg.cityId, pkg)
  }
  publishedCache = map
  return [...map.values()]
}

/**
 * @param {string} cityId
 * @returns {import('../content/cityPackage/types.js').CityPackage | null}
 */
export function getPublishedPackage(cityId) {
  if (!cityId) return null
  loadPublishedCityPackages()
  return publishedCache?.get(cityId) ?? null
}

/**
 * @param {import('../content/cityPackage/types.js').CityPackage} pkg
 */
export function toCityRecord(pkg) {
  const city = pkg.city
  return {
    cityId: city.cityId,
    name: city.name,
    slug: city.slug ?? city.cityId,
    defaultLocale: city.defaultLocale ?? 'en',
    accent: city.accent ?? null,
    priceFallbackCents: city.priceFallbackCents ?? null,
    currency: city.currency ?? null,
    packageVersion: pkg.metadata?.packageVersion ?? null,
    schemaVersions: pkg.schemaVersions,
  }
}

/**
 * @returns {ReturnType<typeof toCityRecord>[]}
 */
export function listPublishedCityRecords() {
  return loadPublishedCityPackages().map(toCityRecord)
}
