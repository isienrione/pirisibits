import { getTourIdsForProduct } from '../data/tourProducts'
import { isUnlockAllTours } from '../config/env'

const ENTITLEMENTS_KEY = 'chronowalk-owned-tours'
const PURCHASES_KEY = 'chronowalk-purchases'

const TOUR_ID_ALIASES = {
  'rome-forum-cluster': 'roman-forum',
  'rome-city': 'heart-of-ancient-rome',
}

const PRODUCT_ID_ALIASES = {
  'rome-forum-cluster': 'roman-forum',
  'rome-city': 'heart-of-ancient-rome',
}

const normalizeTourId = (tourId) => TOUR_ID_ALIASES[tourId] ?? tourId

const normalizeProductId = (productId) => PRODUCT_ID_ALIASES[productId] ?? productId

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
  if (!Array.isArray(stored)) return []
  return [...new Set(stored.filter(Boolean).map(normalizeTourId))]
}

export const readPurchasedProductIds = () => {
  const stored = readJson(PURCHASES_KEY, [])
  if (!Array.isArray(stored)) return []
  return [...new Set(stored.filter(Boolean).map(normalizeProductId))]
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

export const purchaseTourProduct = (productId) => {
  const normalizedProductId = normalizeProductId(productId)
  const tourIds = getTourIdsForProduct(normalizedProductId)
  if (!tourIds.length) return { ok: false, reason: 'unknown_product' }

  const owned = new Set(readOwnedTourIds() ?? [])
  for (const tourId of tourIds) {
    owned.add(tourId)
  }

  const purchases = new Set(readPurchasedProductIds())
  purchases.add(normalizedProductId)

  persistOwnedTourIds([...owned])
  persistPurchasedProductIds([...purchases])

  return { ok: true, tourIds: [...owned], productId: normalizedProductId }
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
