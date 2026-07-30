import { PACE_OPTIONS, JOURNEY_PACE } from '../data/romePacing.js'
import { purchaseTourProduct } from '../services/tourEntitlements.js'
import {
  writeAccessEntitlement,
  writeDeviceCredential,
} from './accessSession.js'

const PENDING_TIER_KEY = 'cw_pending_purchase_tier_v1'
const PURCHASED_TIER_KEY = 'cw_purchased_tier_v1'
/** @see DEPLOY_EDGE_BUST · keep pendingPurchase chunk hashing with edge busts */
void 'intro-open-2026-07-29'

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
    case 'rome-couple':
    case 'rome-family':
      return JOURNEY_PACE.HEROIC
    default:
      return null
  }
}

/**
 * True when the buyer unlocked Roma Eterna content · they may choose any route mode.
 * Single packs skip the mode picker and start their locked route.
 */
export function shouldShowPaceModePicker(tierId) {
  return (
    tierId === 'rome-complete' ||
    tierId === 'rome-couple' ||
    tierId === 'rome-family'
  )
}

/**
 * Pace options unlocked by a purchased product.
 * Bundle SKUs unlock Roma Eterna content (21 stops) without duplicating stop lists.
 */
export function getPaceOptionsForPurchasedTier(tierId) {
  if (!tierId) return PACE_OPTIONS

  switch (tierId) {
    case 'rome-central':
      return PACE_OPTIONS.filter((opt) => opt.id === JOURNEY_PACE.CENTRAL)
    case 'rome-essential':
      return PACE_OPTIONS.filter((opt) => opt.id === JOURNEY_PACE.CLASSIC)
    case 'rome-complete':
    case 'rome-couple':
    case 'rome-family':
      return PACE_OPTIONS
    default:
      return PACE_OPTIONS
  }
}

/**
 * After a successful claim redeem / device validation: persist credential + entitlement.
 * @param {{
 *   token?: string|null,
 *   productId?: string|null,
 *   purchasedProductId?: string|null,
 *   contentProductId?: string|null,
 *   seatLimit?: number|null,
 *   role?: string|null,
 *   bundleStatus?: string|null,
 *   offlineLeaseExpiresAt?: string|number|null,
 * }} opts
 */
export function applyPurchaseUnlock({
  token = null,
  productId = null,
  purchasedProductId = null,
  contentProductId = null,
  seatLimit = null,
  role = null,
  bundleStatus = null,
  offlineLeaseExpiresAt = null,
} = {}) {
  if (token) writeDeviceCredential(token)

  const purchased = purchasedProductId || productId
  const content = contentProductId || productId

  writeAccessEntitlement({
    purchasedProductId: purchased,
    contentProductId: content,
    seatLimit,
    role,
    bundleStatus,
    offlineLeaseExpiresAt,
  })

  if (content || purchased) {
    writePurchasedTier(content || purchased)
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
