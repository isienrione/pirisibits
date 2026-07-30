import { JOURNEY_PACE } from '../data/romePacing.js'
import { ROME_TIERS } from './landingData.js'

const TIER_BY_PACE = {
  [JOURNEY_PACE.HEROIC]: 'rome-complete',
  [JOURNEY_PACE.CLASSIC]: 'rome-essential',
  [JOURNEY_PACE.CENTRAL]: 'rome-central',
}

/**
 * Marketing pack art + stop labels for the begin-flow route preview.
 * Prefer the illustrated package posters (21 / 12 / 8) over the computed path
 * visit count, which under-counts combined / optional stops for Roma Eterna.
 */
export function getPackRoutePreview(pace) {
  const tierId = TIER_BY_PACE[pace]
  if (!tierId) return null
  const tier = ROME_TIERS.find((entry) => entry.id === tierId)
  if (!tier) return null

  const stopMatch = String(tier.stopsLabel ?? '').match(/(\d+)/)
  const marketingStopCount = stopMatch ? Number(stopMatch[1]) : null

  return {
    tierId: tier.id,
    name: tier.name,
    theme: tier.theme,
    cardImage: tier.cardImage,
    cardWidth: tier.cardWidth,
    cardHeight: tier.cardHeight,
    stopsLabel: tier.stopsLabel,
    marketingStopCount,
    tagline: tier.tagline,
  }
}
