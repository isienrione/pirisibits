/**
 * Explicit Apple App Store product mappings (disabled by default).
 *
 * Internal canonical IDs stay rome-central / rome-essential / rome-complete.
 * Couple and Family are deferred — App Review + seat design required.
 *
 * Prices are NEVER hard-coded here. StoreKit / App Store Connect supply
 * localized price strings at runtime.
 */

/** @typedef {'non_consumable' | 'consumable' | 'auto_renewable' | 'non_renewing'} AppleProductType */

/**
 * @typedef {Object} StoreKitProductMapping
 * @property {string} productId Internal ChronoWalk SKU.
 * @property {string} appleProductId App Store product identifier.
 * @property {string} contentProductId Content unlocked after purchase.
 * @property {'sandbox' | 'production' | 'unconfigured'} environment
 * @property {boolean} enabled Must stay false until App Store Connect + Xcode are ready.
 * @property {AppleProductType} productType
 * @property {string} [deferredReason] Present when intentionally not offered on Apple.
 * @property {string} [displayName]
 */

/** Recommended App Store identifiers (create later in App Store Connect). */
export const APPLE_PRODUCT_IDS = Object.freeze({
  'rome-central': 'com.chronowalk.city.rome.historica',
  'rome-essential': 'com.chronowalk.city.rome.antica',
  'rome-complete': 'com.chronowalk.city.rome.eterna',
})

/** @type {readonly StoreKitProductMapping[]} */
export const STOREKIT_PRODUCT_MAPPINGS = Object.freeze([
  {
    productId: 'rome-central',
    appleProductId: APPLE_PRODUCT_IDS['rome-central'],
    contentProductId: 'rome-central',
    environment: 'unconfigured',
    enabled: false,
    productType: 'non_consumable',
    displayName: 'Roma Historica',
  },
  {
    productId: 'rome-essential',
    appleProductId: APPLE_PRODUCT_IDS['rome-essential'],
    contentProductId: 'rome-essential',
    environment: 'unconfigured',
    enabled: false,
    productType: 'non_consumable',
    displayName: 'Roma Antica',
  },
  {
    productId: 'rome-complete',
    appleProductId: APPLE_PRODUCT_IDS['rome-complete'],
    contentProductId: 'rome-complete',
    environment: 'unconfigured',
    enabled: false,
    productType: 'non_consumable',
    displayName: 'Roma Eterna',
  },
  {
    productId: 'rome-couple',
    appleProductId: 'com.chronowalk.city.rome.couple',
    contentProductId: 'rome-complete',
    environment: 'unconfigured',
    enabled: false,
    productType: 'non_consumable',
    deferredReason:
      'Couple Bundle deferred — App Review multi-seat / Family Sharing design required.',
    displayName: 'Couple Bundle',
  },
  {
    productId: 'rome-family',
    appleProductId: 'com.chronowalk.city.rome.family',
    contentProductId: 'rome-complete',
    environment: 'unconfigured',
    enabled: false,
    productType: 'non_consumable',
    deferredReason:
      'Family Bundle deferred — App Review multi-seat / Family Sharing design required.',
    displayName: 'Family Bundle',
  },
])

/**
 * @param {string} productId Internal SKU
 * @returns {StoreKitProductMapping | null}
 */
export function getStoreKitMapping(productId) {
  if (!productId) return null
  return STOREKIT_PRODUCT_MAPPINGS.find((m) => m.productId === productId) ?? null
}

/**
 * @param {string} appleProductId
 * @returns {StoreKitProductMapping | null}
 */
export function getStoreKitMappingByAppleId(appleProductId) {
  if (!appleProductId) return null
  return STOREKIT_PRODUCT_MAPPINGS.find((m) => m.appleProductId === appleProductId) ?? null
}

/**
 * Solo Rome products that may be enabled for Apple once App Store Connect is ready.
 * Couple/Family are never considered purchasable on Apple in this PR.
 *
 * @returns {StoreKitProductMapping[]}
 */
export function listApplePurchasableMappings({ includeDisabled = true } = {}) {
  return STOREKIT_PRODUCT_MAPPINGS.filter((m) => {
    if (m.productId === 'rome-couple' || m.productId === 'rome-family') return false
    if (!includeDisabled && !m.enabled) return false
    return true
  })
}

/**
 * @param {string} productId
 * @returns {boolean}
 */
export function isApplePurchaseDeferred(productId) {
  const mapping = getStoreKitMapping(productId)
  return Boolean(mapping?.deferredReason) || productId === 'rome-couple' || productId === 'rome-family'
}

/**
 * Resolve Apple product id → internal productId (purchases layer only).
 * Commerce providerMappings intentionally still return null for apple until
 * server-side Apple resolution is wired.
 *
 * @param {string} appleProductId
 * @returns {string | null}
 */
export function resolveInternalProductIdFromApple(appleProductId) {
  return getStoreKitMappingByAppleId(appleProductId)?.productId ?? null
}
