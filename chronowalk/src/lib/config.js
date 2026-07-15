import { resolveLemonCheckoutBaseUrl } from './lemonSqueezy.js'

const ACCESS_KEY = 'cw_access'
const AB_KEY = 'cw_ab_variant'

const FALLBACK_CONFIG = {
  price: { cents: 1799, currency: 'USD' },
  /** Keep disabled so live price stays fixed at the full-bundle amount. */
  ab: { enabled: false, variants: [1799, 1799], split: 0.5 },
  review_url: 'https://www.google.com/maps',
  checkout_url: resolveLemonCheckoutBaseUrl('', import.meta.env.VITE_LEMON_CHECKOUT_URL),
}

let cachedConfig = null

function formatPrice(cents, currency = 'USD') {
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
      checkout_url: resolveLemonCheckoutBaseUrl(
        merged.checkout_url,
        import.meta.env.VITE_LEMON_CHECKOUT_URL,
      ),
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

export function formatConfigPrice(cents, currency = 'USD') {
  return formatPrice(cents, currency)
}

export function hasAccess() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(ACCESS_KEY) === 'true'
}

export function grantAccess() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACCESS_KEY, 'true')
}

export function revokeAccess() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ACCESS_KEY)
}

export { ACCESS_KEY, AB_KEY }
