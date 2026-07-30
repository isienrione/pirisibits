/**
 * Launch commerce matrix - generated from commerce/launchCatalog.json.
 * product_id = purchased SKU; content_product_id = route entitlement.
 */

import {
  LAUNCH_CATALOG_BY_ID,
  LAUNCH_CATALOG_PRODUCTS,
  entitlementForCatalogSku,
} from './generated/launchCatalog.gen.js'

export const LAUNCH_SKUS = Object.freeze(
  Object.fromEntries(
    LAUNCH_CATALOG_PRODUCTS.map((p) => [
      p.productId,
      Object.freeze({
        productId: p.productId,
        contentProductId: p.contentProductId,
        seatLimit: p.seatLimit,
        stopCount: p.stopCount,
        label: p.name,
        kind: p.kind,
        amountCents: p.amountCents,
      }),
    ]),
  ),
)

export const LAUNCH_SKU_IDS = Object.freeze(LAUNCH_CATALOG_PRODUCTS.map((p) => p.productId))

export const PURCHASE_STATUSES = Object.freeze([
  'pending_fulfillment',
  'active',
  'refunded',
  'disputed',
  'revoked',
  'fulfillment_failed',
])

/** Bounded offline lease after last successful online validation. */
export const OFFLINE_LEASE_MS = 48 * 60 * 60 * 1000

export function entitlementForSku(productId) {
  const row = entitlementForCatalogSku(productId)
  if (!row) return null
  return {
    purchasedProductId: row.productId,
    contentProductId: row.contentProductId,
    seatLimit: row.seatLimit,
    stopCount: row.stopCount,
    label: row.name,
  }
}

export function isLaunchSku(productId) {
  return Boolean(LAUNCH_CATALOG_BY_ID[productId])
}

export function isBundleSku(productId) {
  return LAUNCH_CATALOG_BY_ID[productId]?.kind === 'bundle'
}
