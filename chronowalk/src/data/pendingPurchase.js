/** Session stash for the landing package the traveler just chose (pre-checkout / access). */

const PENDING_PRODUCT_KEY = 'chronowalk-pending-product'

const LANDING_PRODUCT_IDS = new Set(['rome-central', 'rome-essential', 'rome-complete'])

export function normalizeLandingProductId(productId) {
  if (!productId || typeof productId !== 'string') return null
  const trimmed = productId.trim()
  if (LANDING_PRODUCT_IDS.has(trimmed)) return trimmed

  const aliases = {
    'roma-historica': 'rome-central',
    central: 'rome-central',
    'roma-antica': 'rome-essential',
    essential: 'rome-essential',
    ancient: 'rome-essential',
    'roma-eterna': 'rome-complete',
    complete: 'rome-complete',
  }
  return aliases[trimmed.toLowerCase()] ?? null
}

export function stashPendingProductId(productId) {
  if (typeof window === 'undefined') return null
  const normalized = normalizeLandingProductId(productId)
  if (!normalized) return null
  try {
    window.sessionStorage.setItem(PENDING_PRODUCT_KEY, normalized)
    window.localStorage.setItem(PENDING_PRODUCT_KEY, normalized)
  } catch {
    // ignore quota / privacy errors
  }
  return normalized
}

export function readPendingProductId() {
  if (typeof window === 'undefined') return null
  try {
    const fromSession = normalizeLandingProductId(window.sessionStorage.getItem(PENDING_PRODUCT_KEY))
    if (fromSession) return fromSession
    return normalizeLandingProductId(window.localStorage.getItem(PENDING_PRODUCT_KEY))
  } catch {
    return null
  }
}

export function clearPendingProductId() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(PENDING_PRODUCT_KEY)
    window.localStorage.removeItem(PENDING_PRODUCT_KEY)
  } catch {
    // ignore
  }
}
