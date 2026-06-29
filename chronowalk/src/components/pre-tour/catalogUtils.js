import { getTourProduct, getTourIdsForProduct } from '../../data/tourProducts'

export function getProductStopCount(product) {
  if (!product) return 0
  if (product.includesProductIds?.length) {
    return product.includesProductIds.reduce(
      (total, childId) => total + (getTourProduct(childId)?.stopIds?.length ?? 0),
      0
    )
  }
  return product.stopIds?.length ?? 0
}

export function isTourUnlocked(tourId, ownedTourIds, ownsAllTours) {
  return ownsAllTours || ownedTourIds.includes(tourId)
}

export function isProductUnlocked(productId, ownedTourIds, ownsAllTours) {
  const tourIds = getTourIdsForProduct(productId)
  return tourIds.length > 0 && tourIds.every((tourId) => isTourUnlocked(tourId, ownedTourIds, ownsAllTours))
}

export function resolveTourIdForProduct(product) {
  if (!product) return null
  if (product.tourId) return product.tourId
  if (product.includesProductIds?.length) {
    const firstChild = getTourProduct(product.includesProductIds[0])
    return firstChild?.tourId ?? null
  }
  return null
}
