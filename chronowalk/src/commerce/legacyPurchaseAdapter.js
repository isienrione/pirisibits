/**
 * Legacy purchase / access compatibility adapter.
 *
 * Normalizes current production record shapes into CommerceEntitlement.
 * Does NOT replace access.js, paddle webhooks, or Supabase checks.
 */

import {
  getSkuEntitlementShape,
  listCommerceProducts,
  resolveInternalProductId,
} from './commerceCatalog.js'
import {
  createEntitlement,
  dedupeEntitlements,
  isEntitlementActive,
} from './entitlementModel.js'
import {
  normalizeAccessTokenGrant,
  normalizeLegacyPurchase,
  normalizePaddlePurchase,
} from './purchaseAdapter.js'

/**
 * Products unlocked for walking / content by an entitlement.
 * Bundle SKUs stay distinct as productId; content unlocks via contentProductId.
 *
 * @param {import('./entitlementModel.js').CommerceEntitlement} entitlement
 * @returns {string[]}
 */
export function getProductsUnlockedByEntitlement(entitlement) {
  if (!isEntitlementActive(entitlement)) return []
  const contentId =
    entitlement.contentProductId ??
    getSkuEntitlementShape(entitlement.productId)?.contentProductId ??
    entitlement.productId
  return [...new Set([contentId].filter(Boolean))]
}

/**
 * Normalize any known legacy record into an entitlement (best-effort).
 *
 * @param {object} record
 * @param {{ subjectId?: string, priceMap?: Record<string, unknown> }} [options]
 * @returns {import('./entitlementModel.js').CommerceEntitlement | null}
 */
export function normalizeLegacyPurchaseRecord(record, options = {}) {
  if (!record || typeof record !== 'object') return null

  if (record.source === 'paddle' || record.priceId || record.items?.[0]?.price?.id) {
    return normalizePaddlePurchase(record, options)
  }

  if (
    record.purchasedProductId != null ||
    record.purchased_product_id != null ||
    record.validatedAt != null ||
    record.deviceCredential != null
  ) {
    return normalizeAccessTokenGrant(record, options)
  }

  return normalizeLegacyPurchase(record, options)
}

/**
 * Preserve couple/family as distinct purchased products with shared content.
 *
 * @returns {{ productId: string, contentProductId: string, seatLimit: number, kind: string }[]}
 */
export function listBundleProductShapes() {
  return listCommerceProducts()
    .filter((p) => p.kind === 'bundle')
    .map((p) => ({
      productId: p.productId,
      contentProductId: p.contentProductId,
      seatLimit: p.seatLimit,
      kind: p.kind,
    }))
}

/**
 * Build a synthetic entitlement from a localStorage-style purchased product id.
 *
 * @param {string} productId
 * @param {{ subjectId?: string }} [options]
 */
export function entitlementFromLocalPurchaseId(productId, options = {}) {
  return normalizeLegacyPurchase({ productId, source: 'manual' }, options)
}

/**
 * Merge and dedupe entitlement lists (e.g. paddle + access-token views).
 *
 * @param {...import('./entitlementModel.js').CommerceEntitlement[]} lists
 */
export function mergeEntitlementLists(...lists) {
  return dedupeEntitlements(lists.flat().filter(Boolean))
}

/**
 * Ensure a product id is a known launch SKU (after alias resolve).
 *
 * @param {string} productId
 */
export function isKnownCommerceProduct(productId) {
  return Boolean(resolveInternalProductId(productId))
}

export {
  normalizePaddlePurchase,
  normalizeLegacyPurchase,
  normalizeAccessTokenGrant,
  createEntitlement,
}
