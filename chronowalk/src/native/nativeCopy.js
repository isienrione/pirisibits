/**
 * Human-facing copy for native UI only.
 * Never mentions Paddle, webhooks, or engineering jargon.
 */

/**
 * @param {{ status?: string } | null | undefined} downloadStatus
 * @param {{ online?: boolean }} [opts]
 * @returns {{ label: string, tone: 'ready' | 'progress' | 'idle' | 'warning' }}
 */
export function getOfflineStatusPresentation(downloadStatus, opts = {}) {
  const online = opts.online !== false
  const status = downloadStatus?.status

  if (status === 'ready') {
    return { label: 'Ready offline', tone: 'ready' }
  }
  if (status === 'downloading' || status === 'queued' || status === 'verifying') {
    return { label: 'Downloading…', tone: 'progress' }
  }
  if (status === 'update_available') {
    return { label: 'Update available', tone: 'progress' }
  }
  if (status === 'failed') {
    return { label: 'Download paused — try again when online', tone: 'warning' }
  }
  if (!online) {
    return { label: 'Needs internet to download', tone: 'warning' }
  }
  return { label: 'Available on this device after download', tone: 'idle' }
}

/**
 * @param {{ ok?: boolean, candidates?: unknown[], entitlements?: unknown[], code?: string, message?: string } | null} result
 * @returns {{ kind: 'success' | 'empty' | 'error' | 'loading', title: string, detail: string }}
 */
export function getRestorePresentation(result) {
  if (!result) {
    return {
      kind: 'loading',
      title: 'Restoring…',
      detail: 'Checking purchases on this Apple ID.',
    }
  }
  if (result.ok) {
    if (result.localActivated) {
      return {
        kind: 'success',
        title: 'Purchases restored',
        detail: 'Local StoreKit test access is active on this device.',
      }
    }
    const count = result.candidates?.length ?? result.entitlements?.length ?? 0
    if (count > 0) {
      return {
        kind: 'success',
        title: 'Purchases found',
        detail:
          count === 1
            ? 'We found a purchase on this Apple ID. It will unlock once verified.'
            : `We found ${count} purchases on this Apple ID. They will unlock once verified.`,
      }
    }
    return {
      kind: 'empty',
      title: 'Nothing to restore',
      detail: 'No purchases were found for this Apple ID yet.',
    }
  }

  const code = result.code || ''
  if (code === 'storekit_unavailable' || code === 'storekit_capability_missing') {
    return {
      kind: 'error',
      title: 'Purchases unavailable',
      detail: 'In-App Purchase is not available on this device right now.',
    }
  }
  if (code === 'apple_product_disabled' || code === 'apple_verification_not_configured') {
    return {
      kind: 'error',
      title: 'Coming soon',
      detail: 'App Store purchases are not fully configured yet.',
    }
  }
  return {
    kind: 'error',
    title: 'Couldn’t restore',
    detail: 'Please try again when you have a connection.',
  }
}

/**
 * User-facing purchase gate messages — never mention Paddle.
 *
 * @param {string} [code]
 */
export function getPurchaseUnavailableMessage(code) {
  switch (code) {
    case 'apple_product_disabled':
      return 'Available after App Store configuration'
    case 'apple_product_deferred':
      return 'Not available on the App Store yet'
    case 'storekit_unavailable':
    case 'storekit_capability_missing':
      return 'In-App Purchase unavailable on this device'
    case 'storekit_request_timeout':
      return 'Checking purchase… If this takes too long, use Restore Purchases.'
    case 'purchase_in_flight':
      return 'Checking purchase…'
    case 'product_not_returned':
      return 'This product isn’t available from the App Store right now. Please try again.'
    case 'purchase_cancelled':
      return 'Purchase cancelled.'
    case 'storekit_purchase_failed':
      return 'Purchase couldn’t complete. Please try again.'
    case 'paddle_unavailable_on_native':
    case 'invariant_paddle_on_native':
      return 'Purchases happen through the App Store on iPhone'
    default:
      return 'Purchase unavailable right now'
  }
}

/** Product blurb hierarchy for native cards. */
export const NATIVE_PRODUCT_BLURBS = Object.freeze({
  'rome-complete': 'The complete Rome walk — flagship experience.',
  'rome-essential': 'Colosseum, Forum, hills, and Circus Maximus.',
  'rome-central': 'Trajan’s Market and the living city around the Pantheon.',
})

/**
 * @param {string} cityId
 * @returns {string}
 */
export function getNativeCityHeroSrc(cityId) {
  if (cityId === 'rome') return '/landing/hero-rome.webp'
  return '/landing/hero-rome.webp'
}

/**
 * @param {string} productId
 * @returns {string | null}
 */
export function getNativeProductAccent(productId) {
  if (productId === 'rome-complete') return 'flagship'
  if (productId === 'rome-essential') return 'essential'
  if (productId === 'rome-central') return 'central'
  return null
}
