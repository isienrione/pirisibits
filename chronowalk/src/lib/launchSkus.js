/**
 * Server-owned launch commerce matrix (mirrored in SQL).
 * product_id = purchased SKU; content_product_id = route entitlement.
 * Bundle SKUs unlock Roma Eterna content without duplicating the 21-stop list.
 */

export const LAUNCH_SKUS = Object.freeze({
  'rome-central': Object.freeze({
    productId: 'rome-central',
    contentProductId: 'rome-central',
    seatLimit: 1,
    stopCount: 8,
    label: 'Roma Historica',
  }),
  'rome-essential': Object.freeze({
    productId: 'rome-essential',
    contentProductId: 'rome-essential',
    seatLimit: 1,
    stopCount: 12,
    label: 'Roma Antica',
  }),
  'rome-complete': Object.freeze({
    productId: 'rome-complete',
    contentProductId: 'rome-complete',
    seatLimit: 1,
    stopCount: 21,
    label: 'Roma Eterna',
  }),
  'rome-couple': Object.freeze({
    productId: 'rome-couple',
    contentProductId: 'rome-complete',
    seatLimit: 2,
    stopCount: 21,
    label: 'Couple Bundle',
  }),
  'rome-family': Object.freeze({
    productId: 'rome-family',
    contentProductId: 'rome-complete',
    seatLimit: 4,
    stopCount: 21,
    label: 'Family Bundle',
  }),
})

export const LAUNCH_SKU_IDS = Object.freeze(Object.keys(LAUNCH_SKUS))

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
  const row = LAUNCH_SKUS[productId]
  if (!row) return null
  return {
    purchasedProductId: row.productId,
    contentProductId: row.contentProductId,
    seatLimit: row.seatLimit,
    stopCount: row.stopCount,
    label: row.label,
  }
}

export function isLaunchSku(productId) {
  return Boolean(LAUNCH_SKUS[productId])
}

export function isBundleSku(productId) {
  return productId === 'rome-couple' || productId === 'rome-family'
}
