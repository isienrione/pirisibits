/**
 * Product registry — products from published city packages.
 */

import { getPublishedPackage, loadPublishedCityPackages } from './cityRegistry.js'

/**
 * @param {object} product
 * @param {string} cityId
 */
export function toProductRecord(product, cityId) {
  return {
    productId: product.productId,
    cityId: product.cityId ?? cityId,
    name: product.name,
    slug: product.slug ?? product.productId,
    routeIds: [...(product.routeIds ?? [])],
    marketing: product.marketing ?? null,
  }
}

/**
 * @param {string} cityId
 * @returns {ReturnType<typeof toProductRecord>[]}
 */
export function listProductsForCity(cityId) {
  const pkg = getPublishedPackage(cityId)
  if (!pkg) return []
  return (pkg.products ?? []).map((p) => toProductRecord(p, pkg.cityId))
}

/**
 * @param {string} productId
 * @returns {ReturnType<typeof toProductRecord> | null}
 */
export function findProductById(productId) {
  if (!productId) return null
  for (const pkg of loadPublishedCityPackages()) {
    const product = (pkg.products ?? []).find((p) => p.productId === productId)
    if (product) return toProductRecord(product, pkg.cityId)
  }
  return null
}

/**
 * @param {string} slug
 * @returns {ReturnType<typeof toProductRecord> | null}
 */
export function findProductBySlug(slug) {
  if (!slug) return null
  const normalized = String(slug).trim().toLowerCase()
  for (const pkg of loadPublishedCityPackages()) {
    for (const product of pkg.products ?? []) {
      const productSlug = (product.slug ?? product.productId).toLowerCase()
      if (productSlug === normalized || product.productId.toLowerCase() === normalized) {
        return toProductRecord(product, pkg.cityId)
      }
    }
  }
  return null
}
