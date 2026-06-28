import { useCallback, useEffect, useState } from 'react'
import { getTourProduct } from '../data/tourProducts'
import {
  ownsAnyTour,
  ownsTour,
  purchaseTourProduct,
  readOwnedTourIds,
  readPurchasedProductIds,
} from '../services/tourEntitlements'

const ENTITLEMENTS_EVENT = 'chronowalk-entitlements-changed'

const notifyEntitlementsChanged = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ENTITLEMENTS_EVENT))
}

export function useTourEntitlements() {
  const [ownedTourIds, setOwnedTourIds] = useState(() => readOwnedTourIds())
  const [purchasedProductIds, setPurchasedProductIds] = useState(() => readPurchasedProductIds())

  const refresh = useCallback(() => {
    setOwnedTourIds(readOwnedTourIds())
    setPurchasedProductIds(readPurchasedProductIds())
  }, [])

  useEffect(() => {
    const onChange = () => refresh()
    window.addEventListener(ENTITLEMENTS_EVENT, onChange)
    return () => window.removeEventListener(ENTITLEMENTS_EVENT, onChange)
  }, [refresh])

  const purchaseProduct = useCallback(
    (productId) => {
      const result = purchaseTourProduct(productId)
      if (result.ok) {
        notifyEntitlementsChanged()
        refresh()
      }
      return result
    },
    [refresh]
  )

  const ownsProduct = useCallback(
    (productId) => {
      const product = getTourProduct(productId)
      if (!product) return false
      if (product.includesProductIds?.length) {
        return product.includesProductIds.every((childId) => purchasedProductIds.includes(childId))
          || purchasedProductIds.includes(productId)
      }
      return purchasedProductIds.includes(productId)
    },
    [purchasedProductIds]
  )

  return {
    ownedTourIds: ownedTourIds ?? [],
    purchasedProductIds,
    ownsAllTours: ownedTourIds === null,
    hasAnyTour: ownsAnyTour(ownedTourIds),
    ownsTour: (tourId) => ownsTour(tourId, ownedTourIds),
    ownsProduct,
    purchaseProduct,
    refresh,
  }
}
