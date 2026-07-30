/**
 * Paddle Billing commerce — ChronoWalk Rome packs (one-time prices).
 * Overlay checkout via @paddle/paddle-js; unlock still comes from the webhook.
 *
 * custom_data.product_id is attribution/debug only — it never authorizes access.
 * Entitlement is derived server-side from the paid Paddle price id.
 */

import { initializePaddle } from '@paddle/paddle-js'
import {
  LAUNCH_CATALOG_BY_ID,
  LAUNCH_CATALOG_PRODUCTS,
} from './generated/launchCatalog.gen.js'

/** Tier id → Vite env key for the Paddle price id (`pri_…`). */
export const PADDLE_PRICE_ENV_KEYS = Object.freeze(
  Object.fromEntries(LAUNCH_CATALOG_PRODUCTS.map((p) => [p.productId, p.clientEnvKey])),
)

export const CANONICAL_CHECKOUT_PRODUCT_IDS = Object.freeze(
  LAUNCH_CATALOG_PRODUCTS.map((p) => p.productId),
)

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

export function isCanonicalCheckoutProduct(productId) {
  return Boolean(productId && PADDLE_PRICE_ENV_KEYS[productId])
}

/**
 * Resolve a Paddle price id for a Rome tier.
 * Optional `fromConfig` map (from Supabase app_config.paddle_prices) wins over env
 * per key; missing keys still read ambient import.meta.env unless `env` is provided.
 *
 * When `options.env` is passed (including `{}`), that bag is the only ambient source —
 * never merge missing fields from import.meta.env. Used by hermetic tests.
 */
export function resolvePaddlePriceId(tierId, fromConfig, options = {}) {
  const id = tierId && PADDLE_PRICE_ENV_KEYS[tierId] ? tierId : DEFAULT_TIER
  const configMap =
    fromConfig && typeof fromConfig === 'object' && !Array.isArray(fromConfig)
      ? fromConfig
      : null
  const fromCfg = configMap?.[id]
  if (typeof fromCfg === 'string' && fromCfg.trim()) return fromCfg.trim()

  const envKey = PADDLE_PRICE_ENV_KEYS[id]
  if (!envKey) return null

  if (Object.prototype.hasOwnProperty.call(options, 'env')) {
    const bag = options.env && typeof options.env === 'object' ? options.env : {}
    return String(bag[envKey] ?? '').trim() || null
  }

  const fromEnv = String(import.meta.env[envKey] ?? '').trim()
  return fromEnv || null
}

/**
 * Production fail-closed check when bundle SKUs are offered publicly.
 * Bundles enabled + missing/duplicate public bundle price IDs → not ready.
 *
 * Pass `env` (including `{}`) to make ambient price lookup authoritative for the
 * call — missing keys are not filled from import.meta.env. Omit `env` for normal
 * runtime resolution from Vite env.
 */
export function assertPublicPriceConfig(options = {}) {
  const {
    environment = getPaddleEnvironment(),
    paddlePricesFromConfig,
    bundlesEnabled = true,
    env,
  } = options
  const resolveOpts = Object.prototype.hasOwnProperty.call(options, 'env')
    ? { env: env ?? {} }
    : {}

  const resolved = {}
  for (const productId of CANONICAL_CHECKOUT_PRODUCT_IDS) {
    resolved[productId] = resolvePaddlePriceId(productId, paddlePricesFromConfig, resolveOpts)
  }

  const duplicates = new Map()
  for (const [sku, priceId] of Object.entries(resolved)) {
    if (!priceId) continue
    if (duplicates.has(priceId)) {
      return {
        ok: false,
        reason: 'duplicate_public_price',
        message: `Price id for ${duplicates.get(priceId)} duplicates ${sku}`,
      }
    }
    duplicates.set(priceId, sku)
  }

  if (environment === 'production' && bundlesEnabled) {
    if (!resolved['rome-couple'] || !resolved['rome-family']) {
      return {
        ok: false,
        reason: 'missing_bundle_price',
        message: 'Production bundles require VITE_PADDLE_PRICE_ROME_COUPLE and _FAMILY',
      }
    }
  }

  return { ok: true, resolved }
}

/** True when client token + at least the default (or given) tier price id exist. */
export function isPaddleCheckoutReady(tierId, paddlePricesFromConfig) {
  if (!getPaddleClientToken()) return false
  const configCheck = assertPublicPriceConfig({
    paddlePricesFromConfig,
    bundlesEnabled: true,
  })
  if (!configCheck.ok && getPaddleEnvironment() === 'production') return false
  if (tierId && !isCanonicalCheckoutProduct(tierId)) return false
  return Boolean(resolvePaddlePriceId(tierId, paddlePricesFromConfig))
}

/**
 * Build Paddle `customData` (string values only).
 * product_id / host / experiment / consent are attribution only — not entitlement authority.
 */
export function buildPaddleCustomData({
  host,
  abVariantCents,
  productId,
  consentVersion,
} = {}) {
  /** @type {Record<string, string>} */
  const data = {}
  // Attribution/debug only — webhook ignores this for access.
  if (productId && isCanonicalCheckoutProduct(productId)) {
    data.product_id = String(productId)
  }
  if (host) data.host = String(host)
  if (abVariantCents != null && abVariantCents !== '') {
    data.ab_variant = String(abVariantCents)
  }
  if (consentVersion) data.consent_version = String(consentVersion)
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
 * Open Paddle overlay checkout for a canonical product (quantity always 1).
 * Buyer cannot choose content_product_id or seat_limit.
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
  return { ok: true, mode: 'overlay', priceId, quantity: 1 }
}

/** Test helper — reset singleton between vitest cases. */
export function __resetPaddleForTests() {
  paddleSingleton = undefined
  paddleInitPromise = null
}

export { LAUNCH_CATALOG_BY_ID, LAUNCH_CATALOG_PRODUCTS }
