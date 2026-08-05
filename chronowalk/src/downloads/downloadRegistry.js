/**
 * Resolve commerce / marketing product ids to city-package download keys.
 * Couple and Family unlock Roma Eterna content without duplicate asset packages.
 */

import { getSkuEntitlementShape } from '../commerce/commerceCatalog.js'
import {
  LEGACY_PRODUCT_ALIASES,
  ROME_PACKAGE_PRODUCT_ID,
} from '../catalog/legacyRomeAdapter.js'
import {
  findProductById,
  listProductsForCity,
} from '../catalog/productRegistry.js'
import {
  getPublishedPackage,
  loadPublishedCityPackages,
} from '../catalog/cityRegistry.js'
import { listFixtureCityIds, loadCityPackage } from '../content/cityPackage/index.js'

/**
 * @typedef {Object} DownloadProductRef
 * @property {string} productId Package product id used as the download key.
 * @property {string} cityId
 * @property {string} [commerceProductId] Original commerce SKU when distinct.
 * @property {string} [contentProductId] Commerce content unlock id when known.
 * @property {boolean} isBundleAlias True when couple/family (or similar) map to shared content.
 */

/**
 * Map any known product reference to the city-package product that owns assets.
 *
 * @param {string} productRef
 * @returns {DownloadProductRef | null}
 */
export function resolveDownloadProduct(productRef) {
  if (!productRef || typeof productRef !== 'string') return null

  const commerce = getSkuEntitlementShape(productRef)
  const commerceProductId = commerce?.productId ?? null
  const contentProductId = commerce?.contentProductId ?? commerceProductId

  const aliasTarget =
    LEGACY_PRODUCT_ALIASES[productRef] ??
    (contentProductId ? LEGACY_PRODUCT_ALIASES[contentProductId] : null) ??
    (commerceProductId ? LEGACY_PRODUCT_ALIASES[commerceProductId] : null)

  const packageProductId = aliasTarget ?? productRef

  let product = findProductById(packageProductId)
  if (!product && packageProductId !== productRef) {
    product = findProductById(productRef)
  }

  // Allow unpublished fixtures in tests via direct package load.
  if (!product) {
    try {
      for (const pkg of [...loadPublishedCityPackages()]) {
        const match = (pkg.products ?? []).find((p) => p.productId === packageProductId)
        if (match) {
          product = { productId: match.productId, cityId: pkg.cityId }
          break
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (!product) {
    // Last resort: scan known alias city (rome) package product.
    if (packageProductId === ROME_PACKAGE_PRODUCT_ID) {
      const rome = getPublishedPackage('rome')
      const eternal = rome?.products?.find((p) => p.productId === ROME_PACKAGE_PRODUCT_ID)
      if (eternal) {
        product = { productId: eternal.productId, cityId: 'rome' }
      }
    }
  }

  // Unpublished fixtures — allow resolve for tests / offline tooling.
  if (!product) {
    try {
      for (const cityId of listFixtureCityIds()) {
        const pkg = loadCityPackage(cityId)
        const match = (pkg.products ?? []).find(
          (p) => p.productId === packageProductId || p.productId === productRef,
        )
        if (match) {
          product = { productId: match.productId, cityId: pkg.cityId }
          break
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (!product) return null

  const isBundleAlias =
    Boolean(commerceProductId) &&
    Boolean(contentProductId) &&
    commerceProductId !== contentProductId

  return {
    productId: product.productId,
    cityId: product.cityId,
    commerceProductId: commerceProductId ?? undefined,
    contentProductId: contentProductId ?? undefined,
    isBundleAlias,
  }
}

/**
 * @param {string} cityId
 * @param {{ includeFixtures?: boolean }} [options]
 * @returns {ReturnType<typeof listProductsForCity>}
 */
export function listDownloadableProducts(cityId, { includeFixtures = false } = {}) {
  if (includeFixtures) {
    try {
      const pkg = loadCityPackage(cityId)
      return (pkg.products ?? []).map((p) => ({
        productId: p.productId,
        cityId: p.cityId ?? cityId,
        name: p.name,
        slug: p.slug ?? p.productId,
        routeIds: [...(p.routeIds ?? [])],
        marketing: p.marketing ?? null,
      }))
    } catch {
      return []
    }
  }
  return listProductsForCity(cityId)
}

/**
 * Stable registry key for persisted download records.
 *
 * @param {{ productId: string, locale?: string }} input
 * @returns {string}
 */
export function downloadRegistryKey(input) {
  const locale = input.locale || 'en'
  return `${input.productId}::${locale}`
}
