import { buildCheckoutUrl, getHost } from './host.js'
import { getAbVariantCents, loadAppConfig } from './config.js'
import { track, TRACK_EVENTS } from './track.js'
import {
  buildLandingTierCheckoutUrl,
  resolveLandingTierCents,
} from '../landing/landingCheckout.js'
import { ROME_TIERS } from '../landing/landingData.js'

const TIER_BY_ID = Object.fromEntries(ROME_TIERS.map((tier) => [tier.id, tier]))

/** True when a Lemon Squeezy checkout base URL is available (env or app_config). */
export function isCheckoutConfigured(checkoutUrl) {
  return Boolean(typeof checkoutUrl === 'string' && checkoutUrl.trim())
}

export function getTierById(tierId) {
  return TIER_BY_ID[tierId] ?? null
}

/**
 * Resolve the live checkout base URL (Supabase app_config wins over env fallback).
 */
export async function resolveCheckoutBaseUrl() {
  const config = await loadAppConfig()
  const fromConfig = typeof config?.checkout_url === 'string' ? config.checkout_url.trim() : ''
  if (fromConfig) return fromConfig
  const fromEnv = (import.meta.env.VITE_LEMON_CHECKOUT_URL ?? '').trim()
  return fromEnv || ''
}

/**
 * Build a Lemon Squeezy checkout URL for an optional Rome tier.
 * Returns null when checkout is not configured yet.
 */
export function buildTierCheckoutUrl(baseUrl, tierId, { host, abVariantCents } = {}) {
  if (!isCheckoutConfigured(baseUrl)) return null

  if (tierId && TIER_BY_ID[tierId]) {
    return buildLandingTierCheckoutUrl(baseUrl, tierId, { host, abVariantCents })
  }

  return buildCheckoutUrl(baseUrl, {
    host,
    abVariantCents,
    productId: tierId || undefined,
  })
}

/**
 * Open Lemon Squeezy checkout in this window.
 * @returns {{ ok: true, url: string } | { ok: false, reason: 'not_configured' }}
 */
export async function openCheckout({ tierId, source = 'app' } = {}) {
  const baseUrl = await resolveCheckoutBaseUrl()
  if (!isCheckoutConfigured(baseUrl)) {
    return { ok: false, reason: 'not_configured' }
  }

  const abVariantCents = getAbVariantCents()
  const url = buildTierCheckoutUrl(baseUrl, tierId, {
    host: getHost(),
    abVariantCents,
  })

  if (!url) {
    return { ok: false, reason: 'not_configured' }
  }

  const tierCents = tierId
    ? resolveLandingTierCents(tierId, abVariantCents)
    : abVariantCents

  track(TRACK_EVENTS.CHECKOUT_OPEN, {
    price_cents: tierCents,
    source,
    tier: tierId ?? null,
  })

  window.location.assign(url)
  return { ok: true, url }
}

/** Ordered buyer journey steps — used by UI and docs (placeholders until Lemon is live). */
export const TRANSACTION_STEPS = Object.freeze([
  {
    id: 'choose',
    title: 'Choose Rome',
    body: 'Pick Central, Ancient, or Complete on the landing page.',
  },
  {
    id: 'checkout',
    title: 'Pay securely',
    body: 'Lemon Squeezy opens for card payment. ChronoWalk never sees your card details.',
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
    body: 'Pace, acts, and first steps — then the walk.',
  },
])
