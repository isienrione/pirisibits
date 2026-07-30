import { buildCheckoutUrl } from '../lib/host.js'
import { buildPaddleCustomData } from '../lib/paddle.js'
import { ROME_BUNDLES, ROME_TIERS } from './landingData.js'

const OFFER_BY_ID = Object.fromEntries(
  [...ROME_TIERS, ...ROME_BUNDLES].map((offer) => [offer.id, offer]),
)

/** Resolve checkout cents for a landing offer (complete tier may use live AB price). */
export function resolveLandingTierCents(tierId, liveCents) {
  const offer = OFFER_BY_ID[tierId]
  if (!offer) return liveCents

  if (tierId === 'rome-complete' && liveCents) return liveCents
  return offer.priceCents ?? liveCents
}

/**
 * Build Paddle customData for a landing offer (preferred path).
 * Attribution only · does not send seat_limit or content_product_id.
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
 * @deprecated Lemon URL helper · prefer {@link buildLandingTierCustomData}.
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
