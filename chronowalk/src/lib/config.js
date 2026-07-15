import {
  purchaseTourProduct,
  readPurchasedProductIds,
} from '../services/tourEntitlements.js'
import {
  clearPendingProductId,
  normalizeLandingProductId,
  readPendingProductId,
} from '../data/pendingPurchase.js'

const ACCESS_KEY = 'cw_access'
const AB_KEY = 'cw_ab_variant'
const DEFAULT_ACCESS_PRODUCT_ID = 'rome-complete'

const FALLBACK_CONFIG = {
  price: { cents: 1700, currency: 'EUR' },
  ab: { enabled: true, variants: [1400, 1900], split: 0.5 },
  review_url: 'https://www.google.com/maps',
  checkout_url: import.meta.env.VITE_LEMON_CHECKOUT_URL ?? '',
}

let cachedConfig = null

function formatPrice(cents, currency = 'EUR') {
  const amount = cents / 100
  if (currency === 'EUR') return `€${Number.isInteger(amount) ? amount : amount.toFixed(2)}`
  return `${currency} ${amount.toFixed(2)}`
}

function pickAbVariant(config) {
  if (typeof window === 'undefined') return config.price.cents

  const stored = window.localStorage.getItem(AB_KEY)
  if (stored) return Number(stored)

  if (!config.ab?.enabled) {
    window.localStorage.setItem(AB_KEY, String(config.price.cents))
    return config.price.cents
  }

  const variant =
    Math.random() < (config.ab.split ?? 0.5)
      ? config.ab.variants[0]
      : config.ab.variants[1]

  window.localStorage.setItem(AB_KEY, String(variant))
  return variant
}

export async function loadAppConfig() {
  if (cachedConfig) return cachedConfig

  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    cachedConfig = {
      ...FALLBACK_CONFIG,
      abVariantCents: pickAbVariant(FALLBACK_CONFIG),
    }
    return cachedConfig
  }

  try {
    const response = await fetch(
      `${url.replace(/\/$/, '')}/rest/v1/app_config?select=key,value`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      }
    )

    if (!response.ok) throw new Error('config fetch failed')

    const rows = await response.json()
    const merged = { ...FALLBACK_CONFIG }
    rows.forEach((row) => {
      merged[row.key] = row.value
    })

    cachedConfig = {
      ...merged,
      abVariantCents: pickAbVariant(merged),
    }
    return cachedConfig
  } catch {
    cachedConfig = {
      ...FALLBACK_CONFIG,
      abVariantCents: pickAbVariant(FALLBACK_CONFIG),
    }
    return cachedConfig
  }
}

export function getAbVariantCents() {
  if (cachedConfig?.abVariantCents) return cachedConfig.abVariantCents
  return pickAbVariant(FALLBACK_CONFIG)
}

export function formatConfigPrice(cents, currency = 'EUR') {
  return formatPrice(cents, currency)
}

export function hasAccess() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(ACCESS_KEY) === 'true'
}

/**
 * Unlock the app on this device.
 * Optional productId records which landing package was purchased (for /begin setup).
 * Falls back to a pending tier stashed at checkout, then existing purchases, then Complete.
 */
export function grantAccess(productId) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACCESS_KEY, 'true')

  const fromArg =
    typeof productId === 'string' && productId.trim()
      ? (normalizeLandingProductId(productId) ?? productId.trim())
      : null
  const pending = readPendingProductId()
  const existing = readPurchasedProductIds()
  const resolvedProductId =
    fromArg || pending || (existing.length ? null : DEFAULT_ACCESS_PRODUCT_ID)

  if (resolvedProductId) {
    // Replace when the traveler explicitly bought a tier so a smaller package
    // cannot be masked by a leftover complete default.
    const shouldReplace = Boolean(fromArg || pending || !existing.length)
    purchaseTourProduct(resolvedProductId, { replace: shouldReplace })
    clearPendingProductId()
  }
}

export function revokeAccess() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ACCESS_KEY)
  clearPendingProductId()
}

export { ACCESS_KEY, AB_KEY }
