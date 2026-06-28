import { getTourIdsForProduct } from '../data/tourProducts'
import { isUnlockAllTours } from '../config/env'

const ENTITLEMENTS_KEY = 'chronowalk-owned-tours'
const PURCHASES_KEY = 'chronowalk-purchases'

const readJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const writeJson = (key, value) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota / privacy errors
  }
}

export const readOwnedTourIds = () => {
  if (isUnlockAllTours()) {
    return null
  }
  const stored = readJson(ENTITLEMENTS_KEY, [])
  return Array.isArray(stored) ? stored.filter(Boolean) : []
}

export const readPurchasedProductIds = () => {
  const stored = readJson(PURCHASES_KEY, [])
  return Array.isArray(stored) ? stored.filter(Boolean) : []
}

const persistOwnedTourIds = (tourIds) => {
  writeJson(ENTITLEMENTS_KEY, [...new Set(tourIds)])
}

const persistPurchasedProductIds = (productIds) => {
  writeJson(PURCHASES_KEY, [...new Set(productIds)])
}

export const ownsTour = (tourId, ownedTourIds = readOwnedTourIds()) => {
  if (!tourId) return false
  if (ownedTourIds === null) return true
  return ownedTourIds.includes(tourId)
}

export const ownsAnyTour = (ownedTourIds = readOwnedTourIds()) => {
  if (ownedTourIds === null) return true
  return ownedTourIds.length > 0
}

/** Mock purchase — records product and unlocks associated tour ids. */
export const purchaseTourProduct = (productId) => {
  const tourIds = getTourIdsForProduct(productId)
  if (!tourIds.length) return { ok: false, reason: 'unknown_product' }

  const owned = new Set(readOwnedTourIds() ?? [])
  for (const tourId of tourIds) {
    owned.add(tourId)
  }

  const purchases = new Set(readPurchasedProductIds())
  purchases.add(productId)

  persistOwnedTourIds([...owned])
  persistPurchasedProductIds([...purchases])

  return { ok: true, tourIds: [...owned], productId }
}

export const clearTourEntitlements = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(ENTITLEMENTS_KEY)
    window.localStorage.removeItem(PURCHASES_KEY)
  } catch {
    // ignore
  }
}
