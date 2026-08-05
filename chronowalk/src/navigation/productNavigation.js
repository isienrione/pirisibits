/**
 * Product-level navigation helpers.
 */

import {
  getProductById,
  getProductsForCity,
  getCityById,
} from '../catalog/index.js'
import { resolveInternalProductId } from '../commerce/index.js'
import { createNavigationTarget, normalizeSlug } from './navigationRegistry.js'
import { resolveCitySlug } from './cityNavigation.js'

/** Marketing path slug for the Rome package product (future URLs only). */
export const ROME_PRODUCT_PATH_SLUGS = Object.freeze({
  'rome-eternal': 'eterna',
  eterna: 'rome-eternal',
  'roma-eterna': 'rome-eternal',
})

/**
 * Future product path: `/{citySlug}/{productSlug}`
 *
 * @param {string} productId catalog or commerce product id
 * @returns {import('./navigationRegistry.js').NavigationTarget | null}
 */
export function getProductRoute(productId) {
  if (!productId) return null

  // Prefer catalog package product when commerce SKU aliases to it via city products.
  let product = getProductById(productId)
  if (!product) {
    const commerceResolved = resolveInternalProductId(productId)
    // Commerce SKUs map to Rome package product for navigation capability.
    if (commerceResolved) {
      product = getProductById('rome-eternal')
    }
  }
  if (!product) return null

  const city = getCityById(product.cityId)
  if (!city) return null

  const citySlug = normalizeSlug(city.slug ?? city.cityId)
  const productSlug =
    ROME_PRODUCT_PATH_SLUGS[product.productId] ??
    normalizeSlug(product.slug ?? product.productId)

  return createNavigationTarget({
    kind: 'product',
    cityId: product.cityId,
    productId: product.productId,
    pathname: `/${citySlug}/${productSlug}`,
    isFuture: true,
  })
}

/**
 * @param {string} cityRef city id or slug
 * @param {string} productSlug
 * @returns {{ cityId: string, productId: string } | null}
 */
export function resolveProductSlug(cityRef, productSlug) {
  const city = resolveCitySlug(cityRef) ?? getCityById(cityRef)
  if (!city) return null

  const slug = normalizeSlug(productSlug)
  if (!slug) return null

  const aliasedProductId = ROME_PRODUCT_PATH_SLUGS[slug]
  if (aliasedProductId) {
    const product = getProductById(aliasedProductId)
    if (product && product.cityId === city.cityId) {
      return { cityId: city.cityId, productId: product.productId }
    }
  }

  const products = getProductsForCity(city.cityId)
  const match = products.find(
    (p) =>
      normalizeSlug(p.slug ?? p.productId) === slug ||
      normalizeSlug(p.productId) === slug ||
      normalizeSlug(p.name) === slug,
  )
  if (!match) return null
  return { cityId: city.cityId, productId: match.productId }
}
