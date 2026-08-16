/**
 * Platform adapter contracts shared by browser/PWA and native shells.
 * Capability differences live behind these adapters; experience code stays shared.
 */

/**
 * @typedef {Object} AudioAdapter
 * @property {(src: string) => Promise<void>} load
 * @property {() => Promise<void>} play
 * @property {() => Promise<void>} pause
 * @property {(positionMs: number) => Promise<void>} [seek]
 * @property {() => Promise<number>} [getPositionMs]
 */

/**
 * @typedef {Object} LocationSample
 * @property {number} lat
 * @property {number} lng
 * @property {number} [accuracyM]
 * @property {number} [timestampMs]
 */

/**
 * @typedef {Object} LocationAdapter
 * @property {() => Promise<boolean>} requestPermission
 * @property {() => Promise<LocationSample | null>} getCurrentPosition
 * @property {(listener: (sample: LocationSample) => void) => () => void} [watchPosition]
 */

/**
 * @typedef {Object} StorageAdapter
 * @property {(key: string) => Promise<string | null>} getItem
 * @property {(key: string, value: string) => Promise<void>} setItem
 * @property {(key: string) => Promise<void>} removeItem
 */

/**
 * @typedef {Object} DeepLinkAdapter
 * @property {() => string | null} getInitialUrl
 * @property {(listener: (url: string) => void) => () => void} subscribe
 */

/**
 * @typedef {Object} LifecycleAdapter
 * @property {(listener: () => void) => () => void} onForeground
 * @property {(listener: () => void) => () => void} onBackground
 */

/**
 * Bundle of platform capabilities injected into shared experience code.
 *
 * @typedef {Object} PlatformServices
 * @property {import('../commerce/types.js').PurchaseAdapter} purchase
 * @property {import('../downloads/types.js').DownloadAdapter} downloads
 * @property {AudioAdapter} audio
 * @property {LocationAdapter} location
 * @property {StorageAdapter} storage
 * @property {DeepLinkAdapter} deepLink
 * @property {LifecycleAdapter} lifecycle
 */

export const AUDIO_ADAPTER_METHODS = Object.freeze(['load', 'play', 'pause'])

export const LOCATION_ADAPTER_METHODS = Object.freeze([
  'requestPermission',
  'getCurrentPosition',
])

export const STORAGE_ADAPTER_METHODS = Object.freeze([
  'getItem',
  'setItem',
  'removeItem',
])

export const DEEP_LINK_ADAPTER_METHODS = Object.freeze([
  'getInitialUrl',
  'subscribe',
])

export const LIFECYCLE_ADAPTER_METHODS = Object.freeze([
  'onForeground',
  'onBackground',
])

/** Top-level keys required on {@link PlatformServices}. */
export const PLATFORM_SERVICE_KEYS = Object.freeze([
  'purchase',
  'downloads',
  'audio',
  'location',
  'storage',
  'deepLink',
  'lifecycle',
])

/**
 * @param {AudioAdapter} adapter
 * @returns {adapter is AudioAdapter}
 */
export function isAudioAdapter(adapter) {
  return (
    !!adapter &&
    typeof adapter === 'object' &&
    typeof adapter.load === 'function' &&
    typeof adapter.play === 'function' &&
    typeof adapter.pause === 'function'
  )
}

/**
 * @param {LocationAdapter} adapter
 * @returns {adapter is LocationAdapter}
 */
export function isLocationAdapter(adapter) {
  return (
    !!adapter &&
    typeof adapter === 'object' &&
    typeof adapter.requestPermission === 'function' &&
    typeof adapter.getCurrentPosition === 'function'
  )
}

/**
 * @param {StorageAdapter} adapter
 * @returns {adapter is StorageAdapter}
 */
export function isStorageAdapter(adapter) {
  return (
    !!adapter &&
    typeof adapter === 'object' &&
    typeof adapter.getItem === 'function' &&
    typeof adapter.setItem === 'function' &&
    typeof adapter.removeItem === 'function'
  )
}

/**
 * @param {DeepLinkAdapter} adapter
 * @returns {adapter is DeepLinkAdapter}
 */
export function isDeepLinkAdapter(adapter) {
  return (
    !!adapter &&
    typeof adapter === 'object' &&
    typeof adapter.getInitialUrl === 'function' &&
    typeof adapter.subscribe === 'function'
  )
}

/**
 * @param {LifecycleAdapter} adapter
 * @returns {adapter is LifecycleAdapter}
 */
export function isLifecycleAdapter(adapter) {
  return (
    !!adapter &&
    typeof adapter === 'object' &&
    typeof adapter.onForeground === 'function' &&
    typeof adapter.onBackground === 'function'
  )
}

/**
 * @param {PlatformServices} services
 * @returns {services is PlatformServices}
 */
export function isPlatformServices(services) {
  if (!services || typeof services !== 'object') return false
  for (const key of PLATFORM_SERVICE_KEYS) {
    if (!(key in services)) return false
  }
  return (
    typeof services.purchase?.purchase === 'function' &&
    typeof services.purchase?.listEntitlements === 'function' &&
    typeof services.downloads?.enqueue === 'function' &&
    typeof services.downloads?.getStatus === 'function' &&
    typeof services.downloads?.getLocalPath === 'function' &&
    isAudioAdapter(services.audio) &&
    isLocationAdapter(services.location) &&
    isStorageAdapter(services.storage) &&
    isDeepLinkAdapter(services.deepLink) &&
    isLifecycleAdapter(services.lifecycle)
  )
}
