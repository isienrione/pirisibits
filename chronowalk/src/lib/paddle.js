/**
 * Paddle Billing commerce - ChronoWalk Rome packs (one-time prices).
 * Overlay checkout via @paddle/paddle-js; unlock still comes from the webhook.
 *
 * custom_data is attribution/debug only - it never authorizes access.
 * Entitlement is derived server-side from the paid Paddle price id.
 *
 * Loading: npm package `@paddle/paddle-js` dynamically injects
 * https://cdn.paddle.com/paddle/v2/paddle.js (no async/defer attrs; browser
 * loads dynamically-inserted classic scripts asynchronously).
 */

import { initializePaddle } from '@paddle/paddle-js'
import {
  LAUNCH_CATALOG_BY_ID,
  LAUNCH_CATALOG_PRODUCTS,
} from './generated/launchCatalog.gen.js'
import { getAbVariantCents } from './config.js'
import {
  centsToPriceEur,
  getLastCtaLocation,
  getPostHogCheckoutIdentity,
  trackCheckoutClosed,
  trackCheckoutCompleted,
  trackCheckoutCustomerCreated,
  trackCheckoutError,
  trackCheckoutItemsUpdated,
  trackCheckoutOpenFailed,
  trackCheckoutOpened,
  trackCheckoutPaymentFailed,
  trackPaddleScriptFailed,
} from './analytics.ts'
import { attributionToProps, captureAttribution, getAttribution } from './attribution.ts'

/** Tier id → Vite env key for the Paddle price id (`pri_…`). */
export const PADDLE_PRICE_ENV_KEYS = Object.freeze(
  Object.fromEntries(LAUNCH_CATALOG_PRODUCTS.map((p) => [p.productId, p.clientEnvKey])),
)

export const CANONICAL_CHECKOUT_PRODUCT_IDS = Object.freeze(
  LAUNCH_CATALOG_PRODUCTS.map((p) => p.productId),
)

const DEFAULT_TIER = 'rome-complete'
const SUPPORT_EMAIL = 'support@chronowalk.com'
const FALLBACK_ROOT_ID = 'cw-checkout-fallback'

/** @type {import('@paddle/paddle-js').Paddle | null | undefined} */
let paddleSingleton
/** @type {Promise<import('@paddle/paddle-js').Paddle | null> | null} */
let paddleInitPromise = null
let paddleStartupWarned = false

/** @type {{ tier: string, priceEur?: number, openedAt: number, completed: boolean } | null} */
let activeCheckout = null

/**
 * Remember the open checkout so Paddle eventCallback can emit funnel events.
 * Does not fire `checkout_opened` — that maps from Paddle `checkout.loaded`.
 * @param {{ tier: string, priceCents?: number | null }} opts
 */
export function beginCheckoutAnalytics({ tier, priceCents } = {}) {
  if (!tier) return
  activeCheckout = {
    tier,
    priceEur: centsToPriceEur(priceCents),
    openedAt: Date.now(),
    completed: false,
  }
}

function handlePaddleCheckoutEvent(event) {
  const name = event?.name
  if (!name) return

  const tier = activeCheckout?.tier
  const priceEur = activeCheckout?.priceEur

  if (name === 'checkout.loaded') {
    if (tier) {
      trackCheckoutOpened({ tier, priceEur })
    }
    return
  }

  if (name === 'checkout.completed') {
    if (activeCheckout) activeCheckout.completed = true
    const transactionId =
      event?.data?.transaction_id ||
      event?.data?.id ||
      event?.data?.transaction?.id ||
      undefined
    const email =
      event?.data?.customer?.email ||
      event?.data?.email ||
      null
    const currency =
      event?.data?.currency_code ||
      event?.data?.currencyCode ||
      event?.data?.totals?.currency_code ||
      'EUR'
    if (tier) {
      trackCheckoutCompleted({
        tier,
        priceEur,
        transactionId: transactionId ? String(transactionId) : undefined,
        currency: currency ? String(currency) : 'EUR',
        email: email ? String(email) : null,
      })
    }
    return
  }

  if (name === 'checkout.closed') {
    if (activeCheckout && !activeCheckout.completed && tier) {
      trackCheckoutClosed({
        tier,
        secondsInCheckout: (Date.now() - activeCheckout.openedAt) / 1000,
      })
    }
    activeCheckout = null
    return
  }

  if (name === 'checkout.payment.failed') {
    const message =
      event?.error?.detail ||
      event?.data?.error ||
      event?.error?.message ||
      'payment_failed'
    trackCheckoutPaymentFailed({
      tier,
      errorMessage: String(message),
    })
    return
  }

  if (name === 'checkout.error' || name === 'checkout.failed') {
    const message =
      event?.error?.detail ||
      event?.data?.error ||
      event?.error?.message ||
      name
    trackCheckoutError({
      tier,
      errorMessage: String(message),
    })
    return
  }

  if (name === 'checkout.customer.created') {
    trackCheckoutCustomerCreated({ tier })
    return
  }

  if (name === 'checkout.items.updated') {
    trackCheckoutItemsUpdated({ tier })
  }
}

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
 * When `options.env` is passed (including `{}`), that bag is the only ambient source -
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
 * call - missing keys are not filled from import.meta.env. Omit `env` for normal
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

function setCustomString(data, key, value) {
  if (value == null) return
  const text = String(value).trim()
  if (!text) return
  data[key] = text
}

/**
 * Build Paddle `customData` (string values only).
 * product_id / host / experiment / consent / PostHog / UTM are attribution only.
 */
export function buildPaddleCustomData({
  host,
  abVariantCents,
  productId,
  consentVersion,
  ctaLocation,
} = {}) {
  /** @type {Record<string, string>} */
  const data = {}
  // Attribution/debug only - webhook ignores this for access.
  if (productId && isCanonicalCheckoutProduct(productId)) {
    data.product_id = String(productId)
  }
  setCustomString(data, 'host', host)
  const ab = abVariantCents != null && abVariantCents !== '' ? abVariantCents : getAbVariantCents()
  setCustomString(data, 'ab_variant', ab)
  setCustomString(data, 'consent_version', consentVersion)

  const identity = getPostHogCheckoutIdentity()
  setCustomString(data, 'ph_distinct_id', identity.ph_distinct_id)
  setCustomString(data, 'ph_session_id', identity.ph_session_id)

  captureAttribution()
  const attrProps = attributionToProps(getAttribution())
  for (const [key, value] of Object.entries(attrProps)) {
    // Paddle customData is string-only; skip numeric captured_at.
    if (typeof value === 'string') setCustomString(data, key, value)
  }

  setCustomString(data, 'cta_location', ctaLocation ?? getLastCtaLocation())

  return data
}

function successUrl() {
  if (typeof window === 'undefined') return undefined
  const base = String(import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/$/, '')
  const origin = base || window.location.origin
  return `${origin}/access/confirmed`
}

/**
 * Visible mailto fallback when checkout cannot open — never silent.
 * @param {{ tier?: string | null, errorMessage?: string }} opts
 */
export function showCheckoutUnavailableFallback({ tier = null, errorMessage = '' } = {}) {
  if (typeof document === 'undefined') return

  document.getElementById(FALLBACK_ROOT_ID)?.remove()

  const subject = encodeURIComponent(
    tier ? `ChronoWalk checkout help (${tier})` : 'ChronoWalk checkout help',
  )
  const body = encodeURIComponent(
    [
      'Hi ChronoWalk,',
      '',
      'Checkout did not open on my device.',
      tier ? `Tier: ${tier}` : null,
      errorMessage ? `Error: ${errorMessage}` : null,
      `Page: ${typeof window !== 'undefined' ? window.location.href : ''}`,
      '',
      'Thanks,',
    ]
      .filter(Boolean)
      .join('\n'),
  )
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`

  const root = document.createElement('div')
  root.id = FALLBACK_ROOT_ID
  root.setAttribute('role', 'alertdialog')
  root.setAttribute('aria-modal', 'true')
  root.setAttribute('aria-labelledby', 'cw-checkout-fallback-title')
  root.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:10000',
    'display:grid',
    'place-items:center',
    'padding:1rem',
    'background:rgba(11,11,13,0.55)',
  ].join(';')

  root.innerHTML = `
    <div style="width:min(100%,26rem);padding:1.25rem 1.35rem;border-radius:16px;background:#faf6ef;color:#1a1a1f;font-family:system-ui,sans-serif;box-shadow:0 16px 48px rgba(0,0,0,0.28)">
      <h2 id="cw-checkout-fallback-title" style="margin:0 0 0.55rem;font-size:1.2rem;font-weight:650">Checkout could not open</h2>
      <p style="margin:0 0 0.85rem;font-size:0.95rem;line-height:1.5">
        Something went wrong starting secure checkout. Email us and we will help you finish your purchase.
      </p>
      <a href="${mailto}" style="display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0.65rem 1rem;border-radius:999px;background:#e8a13c;color:#2a1206;font-weight:700;text-decoration:none">
        Email ${SUPPORT_EMAIL}
      </a>
      <button type="button" data-cw-fallback-close style="display:block;width:100%;margin-top:0.75rem;min-height:44px;border:0;background:transparent;color:rgba(26,26,31,0.7);font:inherit;cursor:pointer">
        Close
      </button>
    </div>
  `

  const close = () => root.remove()
  root.addEventListener('click', (event) => {
    if (event.target === root) close()
  })
  root.querySelector('[data-cw-fallback-close]')?.addEventListener('click', close)
  document.body.appendChild(root)
}

/**
 * Warn once at startup when the Paddle client token is missing, and fire analytics.
 * Safe to call before or after PostHog init (events no-op until ready).
 */
export function warnPaddleAtStartup() {
  if (typeof window === 'undefined' || paddleStartupWarned) return
  paddleStartupWarned = true

  if (!getPaddleClientToken()) {
    console.warn(
      '[paddle] VITE_PADDLE_CLIENT_TOKEN is missing — checkout overlay cannot start.',
    )
    trackPaddleScriptFailed({ reason: 'missing_client_token' })
  }
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
  if (!token) {
    console.warn(
      '[paddle] Cannot initialize — VITE_PADDLE_CLIENT_TOKEN is missing.',
    )
    trackPaddleScriptFailed({ reason: 'missing_client_token' })
    return Promise.resolve(null)
  }

  paddleInitPromise = initializePaddle({
    token,
    environment: getPaddleEnvironment(),
    eventCallback: handlePaddleCheckoutEvent,
  })
    .then((instance) => {
      paddleSingleton = instance ?? null
      if (!paddleSingleton?.Checkout?.open) {
        console.warn('[paddle] Paddle.js loaded but Checkout.open is unavailable.')
        trackPaddleScriptFailed({ reason: 'checkout_api_unavailable' })
      }
      return paddleSingleton
    })
    .catch((err) => {
      console.error('[paddle] initialize / script load failed', err)
      console.warn('[paddle] Paddle.js failed to load — checkout will not open.')
      trackPaddleScriptFailed({
        reason: err?.message ? String(err.message) : 'initialize_failed',
      })
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
  tierId = null,
} = {}) {
  if (!priceId) {
    const message = 'missing_price_id'
    trackCheckoutOpenFailed({ tier: tierId || undefined, errorMessage: message })
    showCheckoutUnavailableFallback({ tier: tierId, errorMessage: message })
    return { ok: false, reason: message, fallbackShown: true }
  }

  const paddle = await ensurePaddle()
  if (!paddle?.Checkout?.open) {
    const message = 'script_unavailable'
    trackCheckoutOpenFailed({ tier: tierId || undefined, errorMessage: message })
    showCheckoutUnavailableFallback({ tier: tierId, errorMessage: message })
    return { ok: false, reason: message, fallbackShown: true }
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

  try {
    paddle.Checkout.open(options)
    return { ok: true, mode: 'overlay', priceId, quantity: 1 }
  } catch (err) {
    const message = err?.message ? String(err.message) : 'checkout_open_threw'
    console.error('[paddle] Checkout.open threw', err)
    trackCheckoutOpenFailed({ tier: tierId || undefined, errorMessage: message })
    showCheckoutUnavailableFallback({ tier: tierId, errorMessage: message })
    return { ok: false, reason: 'open_threw', fallbackShown: true, errorMessage: message }
  }
}

/** Test helper - reset singleton between vitest cases. */
export function __resetPaddleForTests() {
  paddleSingleton = undefined
  paddleInitPromise = null
  activeCheckout = null
  paddleStartupWarned = false
  if (typeof document !== 'undefined') {
    document.getElementById(FALLBACK_ROOT_ID)?.remove()
  }
}

/**
 * Coarse Paddle.js load status for diagnostics.
 * @returns {'loaded' | 'loading' | 'missing_token' | 'not_loaded' | 'unavailable'}
 */
export function getPaddleLoadStatus() {
  if (typeof window === 'undefined') return 'not_loaded'
  if (paddleSingleton?.Checkout?.open) return 'loaded'
  if (paddleSingleton) return 'unavailable'
  if (paddleInitPromise) return 'loading'
  if (!getPaddleClientToken()) return 'missing_token'
  return 'not_loaded'
}

export { LAUNCH_CATALOG_BY_ID, LAUNCH_CATALOG_PRODUCTS }
