/**
 * Commerce catalog — launch SKUs from the generated Paddle catalog.
 *
 * Authoritative source: commerce/launchCatalog.json
 * Generated consumer: src/lib/generated/launchCatalog.gen.js
 * Do not hand-maintain Paddle price IDs here.
 */

import {
  LAUNCH_CATALOG_BY_ID,
  LAUNCH_CATALOG_CURRENCY,
  LAUNCH_CATALOG_FINGERPRINT,
  LAUNCH_CATALOG_METADATA_KEY,
  LAUNCH_CATALOG_PRODUCTS,
  entitlementForCatalogSku,
} from '../lib/generated/launchCatalog.gen.js'

/** Launch SKU ids currently sold via Paddle. */
export const LAUNCH_PRODUCT_IDS = Object.freeze(
  LAUNCH_CATALOG_PRODUCTS.map((p) => p.productId),
)

/**
 * Marketing / historical name aliases → launch productId.
 * These are NOT stored product ids — resolution only for the commerce layer.
 */
export const PRODUCT_NAME_ALIASES = Object.freeze({
  'rome-historica': 'rome-central',
  'roma-historica': 'rome-central',
  historica: 'rome-central',
  'rome-antica': 'rome-essential',
  'roma-antica': 'rome-essential',
  antica: 'rome-essential',
  'rome-eterna': 'rome-complete',
  'roma-eterna': 'rome-complete',
  eterna: 'rome-complete',
  // Catalog package product (cities/rome) maps to full-journey commerce SKU.
  'rome-eternal': 'rome-complete',
})

export function getLaunchCatalogFingerprint() {
  return LAUNCH_CATALOG_FINGERPRINT
}

export function getLaunchCatalogMetadataKey() {
  return LAUNCH_CATALOG_METADATA_KEY
}

export function getLaunchCatalogCurrency() {
  return LAUNCH_CATALOG_CURRENCY
}

/**
 * @returns {readonly object[]}
 */
export function listCommerceProducts() {
  return LAUNCH_CATALOG_PRODUCTS
}

/**
 * @param {string} productId
 * @returns {object | null}
 */
export function getCommerceProduct(productId) {
  if (!productId) return null
  return LAUNCH_CATALOG_BY_ID[productId] ?? null
}

/**
 * Resolve a launch SKU or known marketing alias to an internal productId.
 *
 * @param {string} productRef
 * @returns {string | null}
 */
export function resolveInternalProductId(productRef) {
  if (!productRef) return null
  if (LAUNCH_CATALOG_BY_ID[productRef]) return productRef
  const key = String(productRef).trim().toLowerCase()
  const aliased = PRODUCT_NAME_ALIASES[key]
  if (aliased && LAUNCH_CATALOG_BY_ID[aliased]) return aliased
  return null
}

/**
 * @param {string} productId
 * @returns {ReturnType<typeof entitlementForCatalogSku>}
 */
export function getSkuEntitlementShape(productId) {
  const resolved = resolveInternalProductId(productId) ?? productId
  return entitlementForCatalogSku(resolved)
}

/**
 * City id for a commerce product (Rome is the only published city today).
 *
 * @param {string} productId
 * @returns {string | null}
 */
export function getCityIdForProduct(productId) {
  const resolved = resolveInternalProductId(productId)
  if (!resolved) return null
  if (resolved.startsWith('rome-')) return 'rome'
  return null
}
