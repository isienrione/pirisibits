import { PACE_OPTIONS, JOURNEY_PACE } from '../data/romePacing.js'
import { purchaseTourProduct } from '../services/tourEntitlements.js'
import { grantAccess } from './config.js'
import { rememberAccessToken } from './access.js'

const PENDING_TIER_KEY = 'cw_pending_purchase_tier_v1'
const PURCHASED_TIER_KEY = 'cw_purchased_tier_v1'

/** Remember which Rome pack the traveler chose before checkout completes. */
export function rememberPendingPurchaseTier(tierId) {
  if (typeof window === 'undefined') return
  if (!tierId) {
    window.sessionStorage.removeItem(PENDING_TIER_KEY)
    return
  }
  window.sessionStorage.setItem(PENDING_TIER_KEY, String(tierId))
}

export function readPendingPurchaseTier() {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(PENDING_TIER_KEY)
}

export function writePurchasedTier(tierId) {
  if (typeof window === 'undefined' || !tierId) return
  try {
    window.localStorage.setItem(PURCHASED_TIER_KEY, String(tierId))
  } catch {
    /* ignore */
  }
}

/** Promote session pending tier into durable purchased tier, then clear pending. */
export function clearPendingPurchaseTier() {
  if (typeof window === 'undefined') return
  const pending = readPendingPurchaseTier()
  if (pending) writePurchasedTier(pending)
  window.sessionStorage.removeItem(PENDING_TIER_KEY)
}

export function dismissPendingPurchaseTier() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(PENDING_TIER_KEY)
}

export function readPurchasedTier() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(PURCHASED_TIER_KEY)
  } catch {
    return null
  }
}

/** Map landing product ids → begin-flow pace ids. */
export function paceIdForPurchaseTier(tierId) {
  switch (tierId) {
    case 'rome-central':
      return JOURNEY_PACE.CENTRAL
    case 'rome-essential':
      return JOURNEY_PACE.CLASSIC
    case 'rome-complete':
      return JOURNEY_PACE.HEROIC
    default:
      return null
  }
}

/**
 * Pace options unlocked by a purchased product.
 * Single packs lock to their route; Roma Eterna unlocks full + own-pace.
 */
export function getPaceOptionsForPurchasedTier(tierId) {
  if (!tierId) return PACE_OPTIONS

  switch (tierId) {
    case 'rome-central':
      return PACE_OPTIONS.filter((opt) => opt.id === JOURNEY_PACE.CENTRAL)
    case 'rome-essential':
      return PACE_OPTIONS.filter((opt) => opt.id === JOURNEY_PACE.CLASSIC)
    case 'rome-complete':
      return PACE_OPTIONS.filter(
        (opt) => opt.id === JOURNEY_PACE.HEROIC || opt.id === JOURNEY_PACE.OWN,
      )
    default:
      return PACE_OPTIONS
  }
}

/**
 * After a valid purchase token: grant access, remember token + tier, unlock tours.
 * @param {{ token?: string|null, productId?: string|null }} opts
 */
export function applyPurchaseUnlock({ token = null, productId = null } = {}) {
  grantAccess()

  if (token) rememberAccessToken(token)

  if (productId) {
    writePurchasedTier(productId)
    dismissPendingPurchaseTier()
  } else {
    clearPendingPurchaseTier()
  }

  const tier = readPurchasedTier()
  if (tier) {
    purchaseTourProduct(tier)
  }

  return { ok: true, tier }
}
