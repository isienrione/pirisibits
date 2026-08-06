/**
 * Explicit Apple App Store product mappings (disabled by default).
 *
 * Internal canonical IDs stay rome-central / rome-essential / rome-complete.
 * Couple and Family are deferred — App Review + seat design required.
 *
 * Prices are NEVER hard-coded here. StoreKit / App Store Connect supply
 * localized price strings at runtime.
 *
 * Local Xcode StoreKit testing: set `VITE_STOREKIT_MODE=local` in an untracked
 * `.env.local` (never commit). That enables only the three solo Rome mappings
 * via {@link isStoreKitMappingEnabled} without flipping production `enabled`.
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

/** Solo Rome SKUs allowed when `VITE_STOREKIT_MODE=local`. */
export const LOCAL_STOREKIT_SOLO_PRODUCT_IDS = Object.freeze([
  'rome-central',
  'rome-essential',
  'rome-complete',
])

const LOCAL_STOREKIT_SOLO_SET = new Set(LOCAL_STOREKIT_SOLO_PRODUCT_IDS)

/** Recommended App Store identifiers (create later in App Store Connect). */
export const APPLE_PRODUCT_IDS = Object.freeze({
  'rome-central': 'com.chronowalk.city.rome.historica',
  'rome-essential': 'com.chronowalk.city.rome.antica',
  'rome-complete': 'com.chronowalk.city.rome.eterna',
})

/**
 * Build-time StoreKit mode from Vite env.
 * @returns {'local' | 'default'}
 */
export function getStoreKitMode() {
  const raw = String(import.meta.env.VITE_STOREKIT_MODE ?? '')
    .trim()
    .toLowerCase()
  return raw === 'local' ? 'local' : 'default'
}

/**
 * True when the app was built with `VITE_STOREKIT_MODE=local`.
 * @returns {boolean}
 */
export function isStoreKitLocalMode() {
  return getStoreKitMode() === 'local'
}

/**
 * Effective Apple mapping enablement for listing / purchase gates.
 * Does not mutate mapping records — production `enabled` stays false until
 * App Store Connect is ready. Local mode unlocks only solo Rome SKUs.
 *
 * @param {StoreKitProductMapping | null | undefined} mapping
 * @returns {boolean}
 */
export function isStoreKitMappingEnabled(mapping) {
  if (!mapping) return false
  if (isApplePurchaseDeferred(mapping.productId)) return false
  if (mapping.enabled === true) return true
  if (isStoreKitLocalMode() && LOCAL_STOREKIT_SOLO_SET.has(mapping.productId)) {
    return true
  }
  return false
}

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
 * @param {{ includeDisabled?: boolean }} [options]
 * @returns {StoreKitProductMapping[]}
 */
export function listApplePurchasableMappings({ includeDisabled = true } = {}) {
  return STOREKIT_PRODUCT_MAPPINGS.filter((m) => {
    if (m.productId === 'rome-couple' || m.productId === 'rome-family') return false
    if (!includeDisabled && !isStoreKitMappingEnabled(m)) return false
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
