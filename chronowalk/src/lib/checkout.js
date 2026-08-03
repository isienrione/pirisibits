import { getHost } from './host.js'
import { getAbVariantCents, loadAppConfig } from './config.js'
import { track, TRACK_EVENTS } from './track.js'
import { trackCheckoutError } from './analytics.ts'
import { resolveLandingTierCents } from '../landing/landingCheckout.js'
import { ROME_BUNDLES, ROME_TIERS } from '../landing/landingData.js'
import {
  assertPublicPriceConfig,
  beginCheckoutAnalytics,
  buildPaddleCustomData,
  isCanonicalCheckoutProduct,
  isPaddleCheckoutReady,
  openPaddleCheckout,
  resolveCheckoutMode,
  resolvePaddlePriceId,
} from './paddle.js'

const TIER_BY_ID = Object.fromEntries(
  [...ROME_TIERS, ...ROME_BUNDLES].map((offer) => [offer.id, offer]),
)

/**
 * True when Paddle is ready (client token + price id).
 * Accepts an optional boolean for callers that already resolved readiness,
 * or ignores legacy URL strings (always false for empty).
 */
export function isCheckoutConfigured(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return false
  return isPaddleCheckoutReady()
}

export function getTierById(tierId) {
  return TIER_BY_ID[tierId] ?? null
}

/**
 * Resolve whether checkout can open (loads app_config for optional paddle_prices).
 * @returns {Promise<boolean>}
 */
export async function resolveCheckoutReady() {
  const config = await loadAppConfig()
  return isPaddleCheckoutReady(undefined, config?.paddle_prices)
}

/** @deprecated Prefer resolveCheckoutReady - Lemon URL resolution removed. */
export async function resolveCheckoutBaseUrl() {
  const ready = await resolveCheckoutReady()
  return ready ? 'paddle' : ''
}

/** @deprecated Lemon URL picker - no-op for Paddle (returns empty). */
export function pickCheckoutBaseUrl() {
  return ''
}

/**
 * @deprecated Lemon URL builder - Paddle uses price ids + customData.
 * Kept so older tests / call sites fail soft instead of throwing.
 */
export function buildTierCheckoutUrl() {
  return null
}

/**
 * Open Paddle checkout - overlay by default.
 * @returns {Promise<
 *   | { ok: true, mode: 'overlay' | 'hosted', priceId: string }
 *   | { ok: false, reason: 'not_configured' | string }
 * >}
 */
export async function openCheckout({ tierId, source = 'app', mode, email, consentVersion } = {}) {
  const config = await loadAppConfig()

  if (tierId && !isCanonicalCheckoutProduct(tierId)) {
    return { ok: false, reason: 'invalid_product' }
  }

  const priceConfig = assertPublicPriceConfig({
    paddlePricesFromConfig: config?.paddle_prices,
    bundlesEnabled: true,
  })
  if (!priceConfig.ok) {
    return { ok: false, reason: priceConfig.reason }
  }

  const priceId = resolvePaddlePriceId(tierId, config?.paddle_prices)

  if (!isPaddleCheckoutReady(tierId, config?.paddle_prices) || !priceId) {
    return { ok: false, reason: 'not_configured' }
  }

  const abVariantCents = getAbVariantCents()
  const tierCents = tierId
    ? resolveLandingTierCents(tierId, abVariantCents)
    : abVariantCents

  track(TRACK_EVENTS.CHECKOUT_OPEN, {
    price_cents: tierCents,
    source,
    tier: tierId ?? null,
  })

  if (tierId) {
    beginCheckoutAnalytics({ tier: tierId, priceCents: tierCents })
  }

  // custom_data is attribution only - webhook derives entitlement from price.id.
  const customData = buildPaddleCustomData({
    host: getHost(),
    abVariantCents: tierCents,
    productId: tierId || undefined,
    consentVersion,
  })

  const preferredMode = mode ?? resolveCheckoutMode()
  // Overlay is the supported path; "hosted" still opens Paddle overlay
  // (Paddle Billing does not use Lemon-style buy URLs).
  void preferredMode

  const result = await openPaddleCheckout({
    priceId,
    customData,
    email,
    tierId: tierId || null,
  })
  if (!result.ok && tierId) {
    trackCheckoutError({
      tier: tierId,
      errorMessage: String(result.reason || 'checkout_failed'),
    })
  }
  return result
}

/** Ordered buyer journey steps - used by UI and docs. */
export const TRANSACTION_STEPS = Object.freeze([
  {
    id: 'choose',
    title: 'Choose Rome',
    body: 'Pick a Rome pack or Couple/Family bundle on the landing page.',
  },
  {
    id: 'checkout',
    title: 'Pay securely',
    body: 'Paddle opens for card payment. ChronoWalk never sees your card details.',
  },
  {
    id: 'confirm',
    title: 'Confirmation email',
    body: 'You receive an email with a personal access link for this purchase.',
  },
  {
    id: 'unlock',
    title: 'Unlock on your phone',
    body: 'Open the link (or paste the token at /access). This device keeps Rome unlocked.',
  },
  {
    id: 'setup',
    title: 'Begin setup',
    body: 'Pace, acts, and first steps - then the walk.',
  },
])
