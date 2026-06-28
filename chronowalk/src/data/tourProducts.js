import { ROME_CITY_TOUR } from './rome-city-tour'
import { ROME_FORUM_CLUSTER_TOUR } from './rome-forum-cluster-tour'

/** Individual walking tours and the complete Rome bundle. Prices in USD. */
export const TOUR_PRODUCTS = {
  'rome-forum-cluster': {
    id: 'rome-forum-cluster',
    tourId: ROME_FORUM_CLUSTER_TOUR.id,
    title: 'Forum Cluster',
    tagline: 'Colosseum & the ancient forum ridge',
    description:
      'Walk from the Colosseum up to Capitoline Hill with matched before/after reveals at each stop.',
    priceUsd: 10,
    priceCents: 1000,
    stopIds: ROME_FORUM_CLUSTER_TOUR.stopIds,
    firstStopTitle: 'Colosseum',
  },
  'rome-city': {
    id: 'rome-city',
    tourId: ROME_CITY_TOUR.id,
    title: 'Rome City Loop',
    tagline: 'Pantheon, fountains, piazzas & the Tiber',
    description:
      'A centro storico circuit from the Pantheon to Castel Sant\'Angelo — Baroque squares and layered Roman history.',
    priceUsd: 10,
    priceCents: 1000,
    stopIds: ROME_CITY_TOUR.stopIds,
    firstStopTitle: 'Pantheon',
  },
  'rome-complete': {
    id: 'rome-complete',
    title: 'Complete Rome',
    tagline: 'Both walks — forum cluster + city loop',
    description:
      'Unlock the full ChronoWalk Rome experience: the Forum Cluster and the City Loop together.',
    priceUsd: 15,
    priceCents: 1500,
    savingsUsd: 5,
    badge: 'Best value',
    includesProductIds: ['rome-forum-cluster', 'rome-city'],
  },
}

export const TOUR_PRODUCT_LIST = [
  TOUR_PRODUCTS['rome-forum-cluster'],
  TOUR_PRODUCTS['rome-city'],
  TOUR_PRODUCTS['rome-complete'],
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
