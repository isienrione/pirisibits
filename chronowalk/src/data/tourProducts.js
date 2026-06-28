import { HEART_OF_ANCIENT_ROME_TOUR } from './heart-of-ancient-rome-tour'
import { ROMAN_FORUM_TOUR } from './roman-forum-tour'

/** Individual walking tours and the complete Rome bundle. Prices in USD. */
export const TOUR_PRODUCTS = {
  'roman-forum': {
    id: 'roman-forum',
    tourId: ROMAN_FORUM_TOUR.id,
    title: 'Roman Forum',
    tagline: 'Eight ruins, one sacred valley',
    description:
      'Walk the Forum floor from the Arch of Titus to Septimius Severus with matched before/after reveals at every stop.',
    priceUsd: 10,
    priceCents: 1000,
    stopIds: ROMAN_FORUM_TOUR.stopIds,
    firstStopTitle: 'Arch of Titus',
  },
  'heart-of-ancient-rome': {
    id: 'heart-of-ancient-rome',
    tourId: HEART_OF_ANCIENT_ROME_TOUR.id,
    title: 'Heart of Ancient Rome',
    tagline: 'Colosseum, piazzas, fountains & the Tiber',
    description:
      'The grand city loop — Colosseum and Palatine through centro storico to Castel Sant\'Angelo, Circus Maximus, and the Appian Way.',
    priceUsd: 10,
    priceCents: 1000,
    stopIds: HEART_OF_ANCIENT_ROME_TOUR.stopIds,
    firstStopTitle: 'Colosseum',
  },
  'rome-complete': {
    id: 'rome-complete',
    title: 'Complete Rome',
    tagline: 'Roman Forum + Heart of Ancient Rome',
    description:
      'Unlock both ChronoWalk Rome experiences — the Forum cluster and the city-wide Heart of Ancient Rome tour.',
    priceUsd: 15,
    priceCents: 1500,
    savingsUsd: 5,
    badge: 'Best value',
    includesProductIds: ['roman-forum', 'heart-of-ancient-rome'],
  },
}

export const TOUR_PRODUCT_LIST = [
  TOUR_PRODUCTS['rome-complete'],
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
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    amount
  )
