/**
 * Paddle Billing commerce — ChronoWalk Rome packs (one-time prices).
 * Overlay checkout via @paddle/paddle-js; unlock still comes from the webhook.
 */

import { initializePaddle } from '@paddle/paddle-js'

/** Tier id → Vite env key for the Paddle price id (`pri_…`). */
export const PADDLE_PRICE_ENV_KEYS = Object.freeze({
  'rome-central': 'VITE_PADDLE_PRICE_ROME_CENTRAL',
  'rome-essential': 'VITE_PADDLE_PRICE_ROME_ESSENTIAL',
  'rome-complete': 'VITE_PADDLE_PRICE_ROME_COMPLETE',
})

const DEFAULT_TIER = 'rome-complete'

/** @type {import('@paddle/paddle-js').Paddle | null | undefined} */
let paddleSingleton
/** @type {Promise<import('@paddle/paddle-js').Paddle | null> | null} */
let paddleInitPromise = null

export function getPaddleClientToken() {
  const token = String(import.meta.env.VITE_PADDLE_CLIENT_TOKEN ?? '').trim()
  return token || null
}

/** @returns {'sandbox' | 'production'} */
export function getPaddleEnvironment() {
  const raw = String(import.meta.env.VITE_PADDLE_ENV ?? 'sandbox')
    .trim()
    .toLowerCase()
  return raw === 'production' || raw === 'live' ? 'production' : 'sandbox'
}

export function resolveCheckoutMode() {
  const mode = String(import.meta.env.VITE_PADDLE_CHECKOUT_MODE ?? 'overlay')
    .trim()
    .toLowerCase()
  return mode === 'hosted' ? 'hosted' : 'overlay'
}

/**
 * Resolve a Paddle price id for a Rome tier.
 * Optional `fromConfig` map (from Supabase app_config.paddle_prices) wins over env.
 */
export function resolvePaddlePriceId(tierId, fromConfig) {
  const id = tierId && PADDLE_PRICE_ENV_KEYS[tierId] ? tierId : DEFAULT_TIER
  const configMap =
    fromConfig && typeof fromConfig === 'object' && !Array.isArray(fromConfig)
      ? fromConfig
      : null
  const fromCfg = configMap?.[id]
  if (typeof fromCfg === 'string' && fromCfg.trim()) return fromCfg.trim()

  const envKey = PADDLE_PRICE_ENV_KEYS[id]
  const fromEnv = envKey ? String(import.meta.env[envKey] ?? '').trim() : ''
  return fromEnv || null
}

/** True when client token + at least the default (or given) tier price id exist. */
export function isPaddleCheckoutReady(tierId, paddlePricesFromConfig) {
  if (!getPaddleClientToken()) return false
  return Boolean(resolvePaddlePriceId(tierId, paddlePricesFromConfig))
}

/** Build Paddle `customData` (string values only). */
export function buildPaddleCustomData({ host, abVariantCents, productId } = {}) {
  /** @type {Record<string, string>} */
  const data = {}
  if (productId) data.product_id = String(productId)
  if (host) data.host = String(host)
  if (abVariantCents != null && abVariantCents !== '') {
    data.ab_variant = String(abVariantCents)
  }
  return data
}

function successUrl() {
  if (typeof window === 'undefined') return undefined
  const base = String(import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/$/, '')
  const origin = base || window.location.origin
  return `${origin}/access/confirmed`
}

/**
 * Initialize Paddle.js once (SPA-safe).
 * @returns {Promise<import('@paddle/paddle-js').Paddle | null>}
 */
export function ensurePaddle() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (paddleSingleton) return Promise.resolve(paddleSingleton)
  if (paddleInitPromise) return paddleInitPromise

  const token = getPaddleClientToken()
  if (!token) return Promise.resolve(null)

  paddleInitPromise = initializePaddle({
    token,
    environment: getPaddleEnvironment(),
  })
    .then((instance) => {
      paddleSingleton = instance ?? null
      return paddleSingleton
    })
    .catch((err) => {
      console.error('[paddle] initialize failed', err)
      paddleInitPromise = null
      return null
    })

  return paddleInitPromise
}

/**
 * Open Paddle overlay checkout for a price id.
 * @returns {Promise<{ ok: true, mode: 'overlay', priceId: string } | { ok: false, reason: string }>}
 */
export async function openPaddleCheckout({
  priceId,
  customData,
  email,
} = {}) {
  if (!priceId) return { ok: false, reason: 'missing_price_id' }

  const paddle = await ensurePaddle()
  if (!paddle?.Checkout?.open) {
    return { ok: false, reason: 'script_unavailable' }
  }

  /** @type {import('@paddle/paddle-js').CheckoutOpenOptions} */
  const options = {
    items: [{ priceId, quantity: 1 }],
    settings: {
      displayMode: 'overlay',
      variant: 'one-page',
      successUrl: successUrl(),
      allowLogout: true,
    },
  }

  if (customData && Object.keys(customData).length > 0) {
    options.customData = customData
  }
  if (email) {
    options.customer = { email }
  }

  paddle.Checkout.open(options)
  return { ok: true, mode: 'overlay', priceId }
}

/** Test helper — reset singleton between vitest cases. */
export function __resetPaddleForTests() {
  paddleSingleton = undefined
  paddleInitPromise = null
}
