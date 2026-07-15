import { ROME_TIERS } from './landingData.js'

/** Document title / description for the editorial landing (Prompt 20). */
export const LANDING_DOCUMENT = {
  title: 'ChronoWalk · Self-guided Rome walks',
  description:
    'Self-guided Rome walks with place-tied narration and Threshold reconstructions. Try one Pantheon stop free — one-time purchase, no subscription.',
}

/**
 * Accurate Product / Offer schema for Rome route packages.
 * Prices match ROME_TIERS; does not invent ratings or stock scarcity.
 */
export function buildLandingProductSchema(tiers = ROME_TIERS) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'ChronoWalk Rome routes',
    itemListElement: tiers.map((tier, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: `ChronoWalk ${tier.name}`,
        description: tier.description || tier.outcome,
        category: 'Self-guided walking tour',
        brand: {
          '@type': 'Brand',
          name: 'ChronoWalk',
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'EUR',
          price: (tier.priceCents / 100).toFixed(2),
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  }
}

let landingViewTracked = false

/** Fire landing_view once per SPA session to avoid StrictMode / remount duplicates. */
export function trackLandingViewOnce(track, eventName, properties) {
  if (landingViewTracked) return false
  landingViewTracked = true
  track(eventName, properties)
  return true
}

/** @internal test helper */
export function resetLandingViewTrackingForTests() {
  landingViewTracked = false
}
