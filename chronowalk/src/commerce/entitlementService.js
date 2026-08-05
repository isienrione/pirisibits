/**
 * Subject entitlement service (architecture / tests).
 *
 * In-memory only — production access continues via access.js + Supabase.
 * This module lets future multi-city / multi-provider code share one API.
 */

import {
  createEntitlement,
  dedupeEntitlements,
  isEntitlementActive,
} from './entitlementModel.js'
import { getProductsUnlockedByEntitlement } from './legacyPurchaseAdapter.js'

/** @type {Map<string, import('./entitlementModel.js').CommerceEntitlement[]>} */
const subjectStore = new Map()

/**
 * Clear all in-memory entitlements (tests).
 */
export function clearEntitlementStore() {
  subjectStore.clear()
}

/**
 * @param {string} subjectId
 * @returns {import('./entitlementModel.js').CommerceEntitlement[]}
 */
export function getEntitlementsForSubject(subjectId) {
  if (!subjectId) return []
  return [...(subjectStore.get(subjectId) ?? [])]
}

/**
 * Replace entitlements for a subject (normalized list).
 *
 * @param {string} subjectId
 * @param {import('./entitlementModel.js').CommerceEntitlement[]} entitlements
 */
export function setEntitlementsForSubject(subjectId, entitlements) {
  subjectStore.set(subjectId, dedupeEntitlements(entitlements ?? []))
}

/**
 * Grant / upsert an entitlement for a subject.
 *
 * @param {string} subjectId
 * @param {import('./entitlementModel.js').CommerceEntitlement} entitlement
 */
export function grantEntitlement(subjectId, entitlement) {
  const next = createEntitlement({ ...entitlement, subjectId })
  const merged = dedupeEntitlements([...(subjectStore.get(subjectId) ?? []), next])
  subjectStore.set(subjectId, merged)
  return next
}

/**
 * @param {string} subjectId
 * @param {string} productId
 * @returns {boolean}
 */
export function hasEntitlement(subjectId, productId) {
  if (!subjectId || !productId) return false
  return getEntitlementsForSubject(subjectId).some(
    (e) => isEntitlementActive(e) && e.productId === productId,
  )
}

/**
 * @param {string} subjectId
 * @returns {string[]}
 */
export function getEntitledProductIds(subjectId) {
  return [
    ...new Set(
      getEntitlementsForSubject(subjectId)
        .filter(isEntitlementActive)
        .map((e) => e.productId),
    ),
  ]
}

/**
 * Content product ids unlocked for a subject (bundles → rome-complete, etc.).
 *
 * @param {string} subjectId
 * @returns {string[]}
 */
export function getUnlockedContentProductIds(subjectId) {
  const unlocked = getEntitlementsForSubject(subjectId).flatMap((e) =>
    getProductsUnlockedByEntitlement(e),
  )
  return [...new Set(unlocked)]
}

export { isEntitlementActive, getProductsUnlockedByEntitlement }
