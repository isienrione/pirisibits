/**
 * Route / journey navigation helpers.
 */

import {
  getRouteById,
  getProductById,
  getCityById,
  resolveLegacyRoute,
} from '../catalog/index.js'
import { createNavigationTarget, normalizeSlug } from './navigationRegistry.js'
import { resolveProductSlug, ROME_PRODUCT_PATH_SLUGS } from './productNavigation.js'

/**
 * Future journey path: `/{citySlug}/{productSlug}/journey`
 * Optional route segment for a specific path: `.../journey/{routeSlug}`
 *
 * @param {string} routeId
 * @returns {import('./navigationRegistry.js').NavigationTarget | null}
 */
export function getJourneyRoute(routeId) {
  const resolvedId = resolveLegacyRoute(routeId) ?? routeId
  const route = getRouteById(resolvedId)
  if (!route) return null

  const product = route.productId ? getProductById(route.productId) : null
  const city = getCityById(route.cityId)
  if (!city) return null

  const citySlug = normalizeSlug(city.slug ?? city.cityId)
  const productSlug = product
    ? ROME_PRODUCT_PATH_SLUGS[product.productId] ??
      normalizeSlug(product.slug ?? product.productId)
    : 'tour'

  const pathKeySlug = route.pathKey ? `path-${route.pathKey}` : normalizeSlug(route.routeId)

  return createNavigationTarget({
    kind: 'journey',
    cityId: route.cityId,
    productId: route.productId,
    routeId: route.routeId,
    pathname: `/${citySlug}/${productSlug}/journey`,
    isFuture: true,
    query: route.pathKey ? { path: route.pathKey } : {},
    legacyPath: `/${citySlug}/${productSlug}/journey/${pathKeySlug}`,
  })
}

/**
 * @param {string} productRef city/product context — productId or "city/product" slug pair via resolveProductSlug
 * @param {string} routeSlug path key (a|b), routeId, or path-a style
 * @returns {{ productId: string, routeId: string } | null}
 */
export function resolveRouteSlug(productRef, routeSlug) {
  if (!productRef || !routeSlug) return null

  let productId = productRef
  if (productRef.includes('/')) {
    const [cityPart, productPart] = productRef.split('/')
    const resolved = resolveProductSlug(cityPart, productPart)
    if (!resolved) return null
    productId = resolved.productId
  } else if (!getProductById(productRef)) {
    const asRome = resolveProductSlug('rome', productRef)
    if (asRome) productId = asRome.productId
  }

  const product = getProductById(productId)
  if (!product) return null

  const slug = normalizeSlug(routeSlug)
  const legacyRouteId = resolveLegacyRoute(slug)
  if (legacyRouteId && product.routeIds?.includes(legacyRouteId)) {
    return { productId: product.productId, routeId: legacyRouteId }
  }

  for (const routeId of product.routeIds ?? []) {
    const route = getRouteById(routeId)
    if (!route) continue
    if (route.routeId === routeSlug) return { productId: product.productId, routeId }
    if (route.pathKey && (slug === route.pathKey || slug === `path-${route.pathKey}`)) {
      return { productId: product.productId, routeId: route.routeId }
    }
    if (normalizeSlug(route.name) === slug) {
      return { productId: product.productId, routeId: route.routeId }
    }
  }

  return null
}

/**
 * Current public journey path (legacy Rome).
 * @returns {import('./navigationRegistry.js').NavigationTarget}
 */
export function getLegacyPublicJourneyRoute() {
  const future = getJourneyRoute('rome-eternal-main')
  return createNavigationTarget({
    kind: 'journey',
    cityId: 'rome',
    productId: 'rome-eternal',
    routeId: 'rome-eternal-main',
    pathname: '/journey',
    isLegacy: true,
    isFuture: false,
    legacyPath: future?.pathname ?? '/rome/eterna/journey',
  })
}
