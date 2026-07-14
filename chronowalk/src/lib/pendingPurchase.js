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

export function clearPendingPurchaseTier() {
  if (typeof window === 'undefined') return
  const pending = readPendingPurchaseTier()
  if (pending) {
    try {
      window.localStorage.setItem(PURCHASED_TIER_KEY, pending)
    } catch {
      /* ignore */
    }
  }
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
      return 'central'
    case 'rome-essential':
      return 'classic'
    case 'rome-complete':
      return 'heroic'
    default:
      return null
  }
}
