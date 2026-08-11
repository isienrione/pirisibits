import { getEffectivePriceCents } from '../lib/launchOffer.js'
import { LOCALES, normalizeLocale } from '../i18n/locales.js'
import { ROME_TIERS } from './landingData.js'

/** Document title / description for the editorial landing (Prompt 20). */
export const LANDING_DOCUMENT = {
  title: 'ChronoWalk · Self-guided Rome walks',
  description:
    'Self-guided audio walks in Rome with place-tied narration and Then vs Now reconstructions. Get a free sneak peek at the Pantheon. One-time purchase, no subscription.',
}

export const LANDING_DOCUMENT_ES = {
  title: 'ChronoWalk · Recorridos autoguiados por Roma',
  description:
    'Recorridos autoguiados con audio por Roma, narración ligada al lugar y reconstrucciones Antes/Ahora. Prueba gratis el Panteón. Compra única, sin suscripción.',
}

export function getLandingDocument(locale) {
  return normalizeLocale(locale) === LOCALES.ES ? LANDING_DOCUMENT_ES : LANDING_DOCUMENT
}

/**
 * Accurate Product / Offer schema for Rome route packages.
 * Prices match the current purchasable amount (Launch Offer when active).
 * Does not invent ratings or stock scarcity.
 */
export function buildLandingProductSchema(tiers = ROME_TIERS, locale = LOCALES.EN) {
  const spanish = normalizeLocale(locale) === LOCALES.ES
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: spanish ? 'Recorridos de ChronoWalk por Roma' : 'ChronoWalk Rome routes',
    itemListElement: tiers.map((tier, index) => {
      const cents = getEffectivePriceCents(tier.id, tier.priceCents) ?? tier.priceCents
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: `ChronoWalk ${tier.name}`,
          description: tier.description || tier.outcome,
          category: spanish ? 'Recorrido autoguiado a pie' : 'Self-guided walking tour',
          brand: {
            '@type': 'Brand',
            name: 'ChronoWalk',
          },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'EUR',
            price: (cents / 100).toFixed(2),
            availability: 'https://schema.org/InStock',
          },
        },
      }
    }),
  }
}
