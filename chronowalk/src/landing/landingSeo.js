import { ROME_TIERS } from './landingData.js'

/** Document title / description for the product-led landing. */
export const LANDING_DOCUMENT = {
  title: 'ChronoWalk Rome — Self-Guided Audio Walk with Then vs Now Reconstructions',
  description:
    'Explore 21 Rome landmarks with place-tied audio, interactive Then vs Now reconstructions and a flexible walk that remembers your progress. Opens in your browser.',
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