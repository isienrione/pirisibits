import { ROME_TIERS } from '../landing/landingData.js'
import {
  getDefaultPace,
  getPaceForProductId,
  getPaceOption,
  JOURNEY_PACE,
} from './romePacing.js'
import { readPurchasedProductIds } from '../services/tourEntitlements.js'
import { isUnlockAllTours } from '../config/env.js'

const LANDING_PRODUCT_ORDER = ['rome-complete', 'rome-essential', 'rome-central']

/**
 * Pick the strongest owned landing package for begin/setup.
 * Complete supersedes smaller tiers when both are present.
 */
export function resolvePurchasedProductId(purchasedProductIds = readPurchasedProductIds()) {
  if (isUnlockAllTours()) return 'rome-complete'

  const owned = new Set(purchasedProductIds ?? [])
  if (!owned.size) return 'rome-complete'

  for (const productId of LANDING_PRODUCT_ORDER) {
    if (owned.has(productId)) return productId
  }

  // Legacy catalog products → nearest landing package
  if (owned.has('roman-forum') && owned.has('heart-of-ancient-rome')) return 'rome-complete'
  if (owned.has('roman-forum') || owned.has('heart-of-ancient-rome')) return 'rome-essential'
  if (owned.has('central-rome') || owned.has('rome-central')) return 'rome-central'

  return 'rome-complete'
}

export function resolvePurchasedPace(purchasedProductIds = readPurchasedProductIds()) {
  return getPaceForProductId(resolvePurchasedProductId(purchasedProductIds))
}

export function getPurchasedPackageOption(purchasedProductIds = readPurchasedProductIds()) {
  const productId = resolvePurchasedProductId(purchasedProductIds)
  const paceOption = getPaceOption(getPaceForProductId(productId))
  const landingTier = ROME_TIERS.find((tier) => tier.id === productId)

  return {
    ...paceOption,
    productId,
    title: landingTier?.eyebrow ?? paceOption.title,
    description: landingTier?.description ?? paceOption.description,
    includedSummary:
      landingTier?.landmarkLine
      ?? landingTier?.includesLabel
      ?? paceOption.includedSummary,
  }
}

/** Pace used as the stop pool when customizing (never OWN). */
export function getEntitlementPoolPace(purchasedProductIds = readPurchasedProductIds()) {
  const pace = resolvePurchasedPace(purchasedProductIds)
  return pace === JOURNEY_PACE.OWN ? getDefaultPace() : pace
}
