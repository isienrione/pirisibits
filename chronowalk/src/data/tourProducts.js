import { HEART_OF_ANCIENT_ROME_TOUR } from './heart-of-ancient-rome-tour'
import { ROMAN_FORUM_TOUR } from './roman-forum-tour'
import { CENTRAL_ROME_TOUR } from './central-rome-tour'
import { ROME_ANTICA_TOUR } from './rome-antica-tour'

/**
 * Individual walking tours and the complete Rome bundle.
 * Canonical USD scheme: Central $12 · Antica-class singles $12 · Full bundle $17.99.
 */
export const TOUR_PRODUCTS = {
  'rome-central': {
    id: 'rome-central',
    tourId: CENTRAL_ROME_TOUR.id,
    title: 'Roma Historica',
    tagline: "Trajan's Market + Pantheon + centro storico",
    description:
      "Trajan's Market and the walk around the Pantheon — Spanish Steps, Trevi, Navona, Campo, Argentina, and Castel Sant'Angelo. Outside the Colosseum archaeological park.",
    priceUsd: 12,
    priceCents: 1200,
    stopIds: CENTRAL_ROME_TOUR.stopIds,
    firstStopTitle: "Trajan's Market",
  },
  'rome-essential': {
    id: 'rome-essential',
    tourId: ROME_ANTICA_TOUR.id,
    title: 'Roma Antica',
    tagline: 'Colosseum, Forum, hills & Circus Maximus',
    description:
      'The ancient core — Colosseum, Palatine Hill terrace, Roman Forum, Capitoline Hill, and Circus Maximus — with place-tied stories and Threshold at each stop.',
    priceUsd: 12,
    priceCents: 1200,
    stopIds: ROME_ANTICA_TOUR.stopIds,
    firstStopTitle: 'Colosseum',
  },
  'roman-forum': {
    id: 'roman-forum',
    tourId: ROMAN_FORUM_TOUR.id,
    title: 'Roman Forum',
    tagline: 'Every stop in the Forum cluster',
    description:
      'Walk the Forum floor — Arch of Titus, Basilica of Maxentius, Via Sacra, Temple of Vesta, the Rostra, Temple of Saturn, Curia Julia, and Arch of Septimius Severus. All eight forum-cluster landmarks with matched before/after reveals.',
    priceUsd: 12,
    priceCents: 1200,
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
    priceUsd: 12,
    priceCents: 1200,
    stopIds: HEART_OF_ANCIENT_ROME_TOUR.stopIds,
    firstStopTitle: 'Colosseum',
  },
  'rome-complete': {
    id: 'rome-complete',
    title: 'Roma Eterna',
    tagline: 'Full bundle · at your own pace',
    description:
      'Unlock every ChronoWalk Rome route — archaeological core, centro storico, and the full city loop to the Appian Way.',
    priceUsd: 17.99,
    priceCents: 1799,
    savingsUsd: 6.01,
    badge: 'Best value',
    includesProductIds: ['roman-forum', 'heart-of-ancient-rome'],
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

/** Tour ids unlocked by purchasing a product (bundle expands to both tours). */
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
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
