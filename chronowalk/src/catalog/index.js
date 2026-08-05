/**
 * ChronoWalk runtime catalog.
 *
 * Bridge between application code and generic city packages.
 * Production screens are not wired to this module yet.
 */

export {
  clearCatalogCache,
  getPublishedCities,
  getCityById,
  getCityBySlug,
  getProductsForCity,
  getProductById,
  getProductBySlug,
  getRoutesForProduct,
  getRouteById,
  getStopsForRoute,
  getStopById,
  resolveLegacyStopId,
  resolveLegacyRoute,
  resolveLegacyWaypoint,
  resolveLegacyProductId,
} from './catalogService.js'

export {
  ROME_CITY_ID,
  ROME_PACKAGE_PRODUCT_ID,
  ROME_PATH_ROUTE_IDS,
  LEGACY_STOP_ALIASES,
  LEGACY_PRODUCT_ALIASES,
  LEGACY_TOUR_ROUTE_ALIASES,
  getRomePackage,
  getRomeRuntimeManifest,
  getRomePreviewAudio,
  getRomePreviewStopId,
  getRomeOptionalStopIds,
  resolveLegacyProgressStopRef,
} from './legacyRomeAdapter.js'

export { clearCityRegistryCache, loadPublishedCityPackages } from './cityRegistry.js'
