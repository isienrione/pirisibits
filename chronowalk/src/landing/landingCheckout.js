import { buildCheckoutUrl } from '../lib/host.js'
import { ROME_TIERS } from './landingData.js'

const TIER_BY_ID = Object.fromEntries(ROME_TIERS.map((tier) => [tier.id, tier]))

/** Resolve checkout cents for a landing tier (complete tier may use live AB price). */
export function resolveLandingTierCents(tierId, liveCents) {
  const tier = TIER_BY_ID[tierId]
  if (!tier) return liveCents

  if (tierId === 'rome-complete' && liveCents) return liveCents
  return tier.priceCents ?? liveCents
}

/** Build checkout URL with tier identity for Lemon Squeezy custom metadata. */
export function buildLandingTierCheckoutUrl(baseUrl, tierId, { host, abVariantCents } = {}) {
  const tierCents = resolveLandingTierCents(tierId, abVariantCents)

  return buildCheckoutUrl(baseUrl, {
    host,
    abVariantCents: tierCents,
    productId: tierId,
  })
}
