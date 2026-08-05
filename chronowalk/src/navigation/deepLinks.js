/**
 * Generic deep-link resolver.
 * Parses legacy public URLs and future city/product URL capability shapes.
 * Does not modify browser routing.
 */

import { getPublishedCities, getRoutesForProduct } from '../catalog/index.js'
import { createNavigationTarget, normalizePathname, normalizeSlug, parsePathOrUrl } from './navigationRegistry.js'
import { getCityRoute, resolveCitySlug } from './cityNavigation.js'
import { getProductRoute, resolveProductSlug } from './productNavigation.js'
import { getJourneyRoute, resolveRouteSlug } from './routeNavigation.js'
import { resolveLegacyRomeRoute } from './legacyRomeRoutes.js'

/**
 * @param {string} productId
 */
function defaultRouteIdForProduct(productId) {
  const routes = getRoutesForProduct(productId)
  const main = routes.find((r) => r.pathKey === 'a') ?? routes[0]
  return main?.routeId ?? null
}

/**
 * @param {string} pathOrUrl
 * @returns {import('./navigationRegistry.js').NavigationTarget}
 */
export function resolveDeepLink(url) {
  const { pathname, query } = parsePathOrUrl(url)
  const path = normalizePathname(pathname)

  // 1) Legacy Rome public URLs win (current customer experience).
  const legacy = resolveLegacyRomeRoute(url)
  if (legacy) return legacy

  // 2) Future capability: /{city}
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 1) {
    const city = resolveCitySlug(segments[0])
    if (city) {
      const target = getCityRoute(city.cityId)
      return { ...target, query, isFuture: true }
    }
    // Unpublished / unknown city slug (e.g. athens before publish)
    return createNavigationTarget({
      kind: 'city',
      cityId: normalizeSlug(segments[0]),
      pathname: path,
      query,
      isFuture: true,
      known: false,
    })
  }

  // 3) Future: /{city}/{product}
  if (segments.length === 2) {
    const resolved = resolveProductSlug(segments[0], segments[1])
    if (resolved) {
      const target = getProductRoute(resolved.productId)
      return { ...target, query, isFuture: true }
    }
    return createNavigationTarget({
      kind: 'unknown',
      pathname: path,
      query,
      isFuture: true,
      known: false,
    })
  }

  // 4) Future: /{city}/{product}/journey[/{routeSlug}]
  if (segments.length >= 3 && segments[2] === 'journey') {
    const resolvedProduct = resolveProductSlug(segments[0], segments[1])
    if (!resolvedProduct) {
      return createNavigationTarget({
        kind: 'unknown',
        pathname: path,
        query,
        isFuture: true,
        known: false,
      })
    }

    if (segments.length === 3) {
      const routeId = defaultRouteIdForProduct(resolvedProduct.productId)
      const target = routeId ? getJourneyRoute(routeId) : null
      if (!target) {
        return createNavigationTarget({
          kind: 'journey',
          cityId: resolvedProduct.cityId,
          productId: resolvedProduct.productId,
          pathname: path,
          query,
          isFuture: true,
        })
      }
      return {
        ...target,
        pathname: path,
        query: { ...target.query, ...query },
        isFuture: true,
      }
    }

    const routeResolved = resolveRouteSlug(
      `${resolvedProduct.cityId}/${segments[1]}`,
      segments[3],
    )
    if (routeResolved) {
      const target = getJourneyRoute(routeResolved.routeId)
      return {
        ...(target ??
          createNavigationTarget({
            kind: 'journey',
            cityId: resolvedProduct.cityId,
            productId: resolvedProduct.productId,
            routeId: routeResolved.routeId,
            pathname: path,
            isFuture: true,
          })),
        pathname: path,
        query: { ...(target?.query ?? {}), ...query },
        isFuture: true,
      }
    }

    return createNavigationTarget({
      kind: 'unknown',
      cityId: resolvedProduct.cityId,
      productId: resolvedProduct.productId,
      pathname: path,
      query,
      isFuture: true,
      known: false,
    })
  }

  // 5) Future stop deep link capability: /{city}/stop/{stopId}
  if (segments.length === 3 && segments[1] === 'stop') {
    const city = resolveCitySlug(segments[0])
    return createNavigationTarget({
      kind: 'preview',
      cityId: city?.cityId ?? normalizeSlug(segments[0]),
      stopId: segments[2],
      pathname: path,
      query,
      isFuture: true,
      known: Boolean(city),
    })
  }

  return createNavigationTarget({
    kind: 'unknown',
    pathname: path,
    query,
    known: false,
  })
}

/**
 * Platform root navigation summary for published cities.
 */
export function getPlatformNavigationTree() {
  return {
    kind: 'platform',
    cities: getPublishedCities().map((city) => {
      const cityRoute = getCityRoute(city.cityId)
      return {
        cityId: city.cityId,
        slug: city.slug,
        route: cityRoute,
      }
    }),
  }
}

/**
 * Convenience: whether a path is a currently public legacy URL.
 * @param {string} pathOrUrl
 */
export function isLegacyPublicPath(pathOrUrl) {
  const target = resolveLegacyRomeRoute(pathOrUrl)
  return Boolean(target?.isLegacy && target.known !== false)
}
