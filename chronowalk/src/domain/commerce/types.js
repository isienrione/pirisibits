/**
 * Commerce domain contracts — entitlements and purchase results.
 * Purchase channels (Paddle, Apple, OTAs) normalize into Entitlement.
 */

/**
 * @typedef {Object} Entitlement
 * @property {string} productId Product granted by this entitlement.
 * @property {string} [cityId] Optional owning city for scoped catalogs.
 * @property {string} source Purchase channel ("paddle" | "apple" | "ota" | string).
 * @property {string} [grantedAt] ISO-8601 timestamp when granted.
 * @property {boolean} [active] Whether the entitlement currently grants access.
 * @property {string} [externalId] Upstream transaction / receipt id when known.
 */

/**
 * @typedef {Object} PurchaseResult
 * @property {boolean} ok Whether the purchase attempt succeeded.
 * @property {Entitlement} [entitlement] Normalized entitlement on success.
 * @property {string} [source] Purchase channel that produced the result.
 * @property {string} [error] Stable error code or message on failure.
 */

/**
 * Adapter that turns a store-specific purchase into domain entitlements.
 *
 * @typedef {Object} PurchaseAdapter
 * @property {(productId: string) => Promise<PurchaseResult>} purchase
 * @property {() => Promise<Entitlement[]>} listEntitlements
 * @property {() => Promise<PurchaseResult>} [restore]
 */

/** Method names required on {@link PurchaseAdapter}. */
export const PURCHASE_ADAPTER_METHODS = Object.freeze([
  'purchase',
  'listEntitlements',
])

/**
 * @param {Entitlement} entitlement
 * @returns {entitlement is Entitlement}
 */
export function isEntitlement(entitlement) {
  return (
    !!entitlement &&
    typeof entitlement === 'object' &&
    typeof entitlement.productId === 'string' &&
    entitlement.productId.length > 0 &&
    typeof entitlement.source === 'string' &&
    entitlement.source.length > 0
  )
}

/**
 * @param {PurchaseResult} result
 * @returns {result is PurchaseResult}
 */
export function isPurchaseResult(result) {
  if (!result || typeof result !== 'object' || typeof result.ok !== 'boolean') {
    return false
  }
  if (result.entitlement != null && !isEntitlement(result.entitlement)) {
    return false
  }
  return true
}

/**
 * @param {PurchaseAdapter} adapter
 * @returns {adapter is PurchaseAdapter}
 */
export function isPurchaseAdapter(adapter) {
  return (
    !!adapter &&
    typeof adapter === 'object' &&
    typeof adapter.purchase === 'function' &&
    typeof adapter.listEntitlements === 'function'
  )
}
