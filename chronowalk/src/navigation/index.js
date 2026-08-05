/**
 * ChronoWalk generic navigation layer (architecture bridge).
 *
 * Does not rewrite AppRouter. Legacy public URLs stay authoritative for customers.
 * Future /{city}/… shapes are capability-only until a later PR wires them.
 */

export {
  NAVIGATION_KINDS,
  createNavigationTarget,
  parsePathOrUrl,
  normalizePathname,
  normalizeSlug,
} from './navigationRegistry.js'

export {
  listNavigableCities,
  getCityRoute,
  resolveCitySlug,
} from './cityNavigation.js'

export {
  ROME_PRODUCT_PATH_SLUGS,
  getProductRoute,
  resolveProductSlug,
} from './productNavigation.js'

export {
  getJourneyRoute,
  resolveRouteSlug,
  getLegacyPublicJourneyRoute,
} from './routeNavigation.js'

export {
  resolveLegacyRomeRoute,
  listLegacyRomePathnames,
} from './legacyRomeRoutes.js'

export {
  resolveDeepLink,
  getPlatformNavigationTree,
  isLegacyPublicPath,
} from './deepLinks.js'

/** Platform → published cities (from runtime catalog). */
export { getPublishedCities } from '../catalog/index.js'
