import { isPaddleCheckoutReady } from './paddle.js'
import {
  clearLocalAccessState,
  hasValidLocalAccess,
  writeAccessEntitlement,
} from './accessSession.js'

const ACCESS_KEY = 'cw_access'
const AB_KEY = 'cw_ab_variant'

const FALLBACK_CONFIG = {
  price: { cents: 1499, currency: 'EUR' },
  /** Keep disabled so live price stays fixed at the full-bundle amount. */
  ab: { enabled: false, variants: [1499, 1499], split: 0.5 },
  review_url: 'https://www.google.com/maps',
  /** Legacy Lemon field - unused by Paddle overlay; kept for older rows. */
  checkout_url: '',
  /** Optional map of tier id → Paddle price id (`pri_…`), overrides env. */
  paddle_prices: {},
}

let cachedConfig = null

function formatPrice(cents, currency = 'EUR') {
  const amount = cents / 100
  if (currency === 'EUR') {
    return `€${Number.isInteger(amount) ? amount : amount.toFixed(2)}`
  }
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }
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
      checkout_ready: isPaddleCheckoutReady(undefined, FALLBACK_CONFIG.paddle_prices),
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
      checkout_url:
        typeof merged.checkout_url === 'string' ? merged.checkout_url : '',
      paddle_prices:
        merged.paddle_prices && typeof merged.paddle_prices === 'object'
          ? merged.paddle_prices
          : {},
      checkout_ready: isPaddleCheckoutReady(undefined, merged.paddle_prices),
      abVariantCents: pickAbVariant(merged),
    }
    return cachedConfig
  } catch {
    cachedConfig = {
      ...FALLBACK_CONFIG,
      checkout_ready: isPaddleCheckoutReady(undefined, FALLBACK_CONFIG.paddle_prices),
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

/**
 * Local gate for paid routes: requires a stored device credential and a
 * non-expired offline lease / entitlement - never a bare cw_access boolean.
 */
export function hasAccess() {
  return hasValidLocalAccess()
}

/** @deprecated Prefer applyPurchaseUnlock / redeemPurchaseClaim persistence. */
export function grantAccess() {
  if (typeof window === 'undefined') return
  // Compatibility for DEV presets only - still requires an entitlement write.
  writeAccessEntitlement({
    purchasedProductId: 'rome-complete',
    contentProductId: 'rome-complete',
    seatLimit: 1,
    role: 'solo',
    bundleStatus: null,
  })
  try {
    if (!window.localStorage.getItem('cw_device_credential_v1')) {
      window.localStorage.setItem('cw_device_credential_v1', 'dev-credential-local')
    }
  } catch {
    /* ignore */
  }
}

export function revokeAccess() {
  clearLocalAccessState()
}

export { ACCESS_KEY, AB_KEY }
