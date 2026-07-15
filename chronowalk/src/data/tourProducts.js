import { HEART_OF_ANCIENT_ROME_TOUR } from './heart-of-ancient-rome-tour'
import { ROMAN_FORUM_TOUR } from './roman-forum-tour'
import { CENTRAL_ROME_TOUR } from './central-rome-tour'
import { JOURNEY_PACE } from './romePacing.js'

/**
 * Individual walking tours and landing Rome packages.
 * Checkout prices for the public site live in landingData (EUR).
 * Catalog PurchasePage may still read priceUsd for legacy flows.
 */
export const TOUR_PRODUCTS = {
  'rome-central': {
    id: 'rome-central',
    tourId: CENTRAL_ROME_TOUR.id,
    paceId: JOURNEY_PACE.CENTRAL,
    title: 'Roma Historica',
    tagline: 'The Pantheon + centro storico',
    description:
      'The Pantheon and the walk around it — Spanish Steps, Trevi, Navona, Campo, Argentina, and Castel Sant\'Angelo. Outside the Colosseum archaeological park.',
    priceUsd: 9,
    priceCents: 900,
    stopIds: CENTRAL_ROME_TOUR.stopIds,
    firstStopTitle: 'The Pantheon',
  },
  'rome-essential': {
    id: 'rome-essential',
    paceId: JOURNEY_PACE.CLASSIC,
    title: 'Roma Antica',
    tagline: 'Colosseum + Roman Forum',
    description:
      'The ancient core — Colosseum and Roman Forum — with the full ChronoWalk experience at each stop.',
    priceUsd: 12,
    priceCents: 1200,
    includesProductIds: ['roman-forum'],
    firstStopTitle: 'Colosseum',
  },
  'roman-forum': {
    id: 'roman-forum',
    tourId: ROMAN_FORUM_TOUR.id,
    title: 'Roman Forum',
    tagline: 'Every stop in the Forum cluster',
    description:
      'Walk the Forum floor — Arch of Titus, Basilica of Maxentius, Via Sacra, Temple of Vesta, the Rostra, Temple of Saturn, Curia Julia, and Arch of Septimius Severus. All eight forum-cluster landmarks with matched before/after reveals.',
    priceUsd: 10,
    priceCents: 1000,
    stopIds: ROMAN_FORUM_TOUR.stopIds,
    firstStopTitle: 'Arch of Titus',
  },
  'heart-of-ancient-rome': {
    id: 'heart-of-ancient-rome',
    tourId: HEART_OF_ANCIENT_ROME_TOUR.id,
    title: 'Heart of Ancient Rome',
    tagline: 'Colosseum, Capitoline & the city loop',
    description:
      'The grand city loop — Colosseum, Palatine Hill, Capitoline Hill, Trajan\'s Market, Pantheon, Trevi, Argentina, Campo de\' Fiori, Piazza Navona, Castel Sant\'Angelo, Circus Maximus, and the Appian Way.',
    priceUsd: 10,
    priceCents: 1000,
    stopIds: HEART_OF_ANCIENT_ROME_TOUR.stopIds,
    firstStopTitle: 'Colosseum',
  },
  'rome-complete': {
    id: 'rome-complete',
    paceId: JOURNEY_PACE.HEROIC,
    title: 'Roma Eterna',
    tagline: 'Full Rome — archaeological core + centro storico',
    description:
      'Unlock every ChronoWalk Rome route — archaeological core, centro storico, and the full city loop to the Appian Way.',
    priceUsd: 17,
    priceCents: 1700,
    savingsUsd: 4,
    badge: 'Most Popular',
    includesProductIds: ['rome-central', 'rome-essential', 'roman-forum', 'heart-of-ancient-rome'],
  },
}

export const TOUR_PRODUCT_LIST = [
  TOUR_PRODUCTS['rome-complete'],
  TOUR_PRODUCTS['rome-central'],
  TOUR_PRODUCTS['rome-essential'],
  TOUR_PRODUCTS['roman-forum'],
  TOUR_PRODUCTS['heart-of-ancient-rome'],
]

export const getTourProduct = (productId) => TOUR_PRODUCTS[productId] ?? null

/** Tour ids unlocked by purchasing a product (bundle expands to child tours). */
export const getTourIdsForProduct = (productId) => {
  const product = getTourProduct(productId)
  if (!product) return []

  if (product.includesProductIds?.length) {
    const tourIds = new Set()
    for (const childId of product.includesProductIds) {
      for (const tourId of getTourIdsForProduct(childId)) {
        tourIds.add(tourId)
      }
    }
    return [...tourIds]
  }

  return product.tourId ? [product.tourId] : []
}

export const formatUsd = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    amount
  )
