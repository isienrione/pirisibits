import { buildCheckoutUrl } from '../lib/host.js'
import { buildPaddleCustomData } from '../lib/paddle.js'
import { ROME_TIERS } from './landingData.js'

const TIER_BY_ID = Object.fromEntries(ROME_TIERS.map((tier) => [tier.id, tier]))

/** Resolve checkout cents for a landing tier (complete tier may use live AB price). */
export function resolveLandingTierCents(tierId, liveCents) {
  const tier = TIER_BY_ID[tierId]
  if (!tier) return liveCents

  if (tierId === 'rome-complete' && liveCents) return liveCents
  return tier.priceCents ?? liveCents
}

/**
 * Build Paddle customData for a landing tier (preferred path).
 */
export function buildLandingTierCustomData(tierId, { host, abVariantCents } = {}) {
  const tierCents = resolveLandingTierCents(tierId, abVariantCents)
  return buildPaddleCustomData({
    host,
    abVariantCents: tierCents,
    productId: tierId,
  })
}

/**
 * @deprecated Lemon URL helper — prefer {@link buildLandingTierCustomData}.
 * Kept for archive tests that still exercise query-param metadata.
 */
export function buildLandingTierCheckoutUrl(baseUrl, tierId, { host, abVariantCents } = {}) {
  const tierCents = resolveLandingTierCents(tierId, abVariantCents)

  return buildCheckoutUrl(baseUrl, {
    host,
    abVariantCents: tierCents,
    productId: tierId,
  })
}
