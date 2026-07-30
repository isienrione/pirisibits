import { JOURNEY_PACE } from '../data/romePacing.js'
import { ROME_TIERS } from './landingData.js'

const TIER_BY_PACE = {
  [JOURNEY_PACE.HEROIC]: 'rome-complete',
  [JOURNEY_PACE.CLASSIC]: 'rome-essential',
  [JOURNEY_PACE.CENTRAL]: 'rome-central',
}

/** Begin/journey route preview art - marketing price/CTA strip cropped off. */
const ROUTE_PREVIEW_ART = {
  'rome-complete': {
    cardImage: '/landing/hero-slides/package-roma-eterna-route.png',
    cardWidth: 1024,
    cardHeight: 1244,
  },
  'rome-essential': {
    cardImage: '/landing/hero-slides/package-roma-antica-route.png',
    cardWidth: 1024,
    cardHeight: 1245,
  },
  'rome-central': {
    cardImage: '/landing/hero-slides/package-roma-historica-route.png',
    cardWidth: 941,
    cardHeight: 1223,
  },
}

/**
 * Marketing pack art + stop labels for the begin-flow route preview.
 * Prefer the illustrated package posters (21 / 12 / 8) over the computed path
 * visit count, which under-counts combined / optional stops for Roma Eterna.
 *
 * Uses cropped route-only posters (no price / Choose CTA) so travelers picture
 * the walk ahead without purchase chrome.
 */
export function getPackRoutePreview(pace) {
  const tierId = TIER_BY_PACE[pace]
  if (!tierId) return null
  const tier = ROME_TIERS.find((entry) => entry.id === tierId)
  if (!tier) return null

  const stopMatch = String(tier.stopsLabel ?? '').match(/(\d+)/)
  const marketingStopCount = stopMatch ? Number(stopMatch[1]) : null
  const routeArt = ROUTE_PREVIEW_ART[tier.id] ?? {
    cardImage: tier.cardImage,
    cardWidth: tier.cardWidth,
    cardHeight: tier.cardHeight,
  }

  return {
    tierId: tier.id,
    name: tier.name,
    theme: tier.theme,
    cardImage: routeArt.cardImage,
    cardWidth: routeArt.cardWidth,
    cardHeight: routeArt.cardHeight,
    stopsLabel: tier.stopsLabel,
    marketingStopCount,
    tagline: tier.tagline,
  }
}
