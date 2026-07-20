import { getHost } from './host.js'
import { getAbVariantCents } from './config.js'
import { resolveLandingTierCents } from '../landing/landingCheckout.js'
import { track, TRACK_EVENTS } from './track.js'
import { rememberLocalPurchaseToken } from './access.js'
import { applyPurchaseUnlock } from './pendingPurchase.js'

const STAGING_KEY = 'cw_staging_purchase_v1'

/**
 * Staging checkout is available in local Vite or when VITE_ALLOW_DEV_ACCESS=true.
 * Never enable that flag on production chronowalk.com.
 */
export function isStagingCheckoutAllowed() {
  return import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEV_ACCESS === 'true'
}

function randomUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Simulate a successful Paddle purchase on this device:
 * mint a UUID token, persist it for /access validation, grant access, analytics.
 */
export function completeStagingPurchase({ tierId = null, source = 'staging_checkout' } = {}) {
  if (!isStagingCheckoutAllowed()) {
    return { ok: false, reason: 'not_allowed' }
  }

  const token = randomUuid()
  const abVariantCents = getAbVariantCents()
  const priceCents = tierId ? resolveLandingTierCents(tierId, abVariantCents) : abVariantCents
  const record = {
    token,
    tierId,
    priceCents,
    host: getHost(),
    createdAt: Date.now(),
    source,
  }

  try {
    window.localStorage.setItem(STAGING_KEY, JSON.stringify(record))
  } catch {
    /* ignore quota */
  }

  rememberLocalPurchaseToken(token, tierId)
  applyPurchaseUnlock({ token, productId: tierId })

  track(TRACK_EVENTS.CHECKOUT_OPEN, {
    price_cents: priceCents,
    source,
    tier: tierId,
    staging: true,
  })
  track(TRACK_EVENTS.PURCHASE, {
    source: 'staging',
    tier: tierId,
    price_cents: priceCents,
  })

  return {
    ok: true,
    token,
    redirectTo: `/access/confirmed?token=${encodeURIComponent(token)}&staging=1`,
  }
}

export function readLastStagingPurchase() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STAGING_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
