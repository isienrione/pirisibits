/**
 * Local-only Xcode StoreKit entitlement activation.
 *
 * Unlocks Rome solo products on this simulator/device when
 * VITE_STOREKIT_MODE=local + native iOS. Never grants production access.
 */

import { isNativeIOS } from '../platform/runtime/index.js'
import { isEntitlementActive } from '../commerce/entitlementModel.js'
import { purchaseTourProduct } from '../services/tourEntitlements.js'
import { writePurchasedTier } from '../lib/pendingPurchase.js'
import { getAppHomePath } from '../lib/appEntry.js'
import {
  isStoreKitLocalMode,
  isApplePurchaseDeferred,
  LOCAL_STOREKIT_SOLO_PRODUCT_IDS,
} from './storeKitProductMappings.js'
import { isLocalAppleCandidate, isServerVerifiedEntitlement } from './transactionNormalizer.js'

export const LOCAL_STOREKIT_ENTITLEMENTS_KEY = 'cw_local_storekit_entitlements_v1'

const LOCAL_SOLO_SET = new Set(LOCAL_STOREKIT_SOLO_PRODUCT_IDS)

/**
 * True only for local Xcode StoreKit development on native iOS.
 * @returns {boolean}
 */
export function isLocalStoreKitEntitlementModeAllowed() {
  return isStoreKitLocalMode() && isNativeIOS()
}

/**
 * Concise local diagnostics (no receipts / tokens / PII).
 * @param {string} message
 * @param {Record<string, unknown>} [details]
 */
function logLocal(message, details) {
  if (!isStoreKitLocalMode()) return
  if (details && Object.keys(details).length > 0) {
    console.info(`[StoreKit local] ${message}`, details)
  } else {
    console.info(`[StoreKit local] ${message}`)
  }
}

/**
 * @param {import('../commerce/entitlementModel.js').CommerceEntitlement | null | undefined} entitlement
 * @returns {boolean}
 */
function isEligibleLocalSoloAppleEntitlement(entitlement) {
  if (!entitlement) return false
  if (entitlement.source !== 'apple') return false
  if (entitlement.status !== 'active') return false
  if (!isEntitlementActive(entitlement)) return false
  if (!LOCAL_SOLO_SET.has(entitlement.productId)) return false
  if (isApplePurchaseDeferred(entitlement.productId)) return false
  return true
}

/**
 * Whether a purchase/restore result may activate local test access.
 *
 * Accepts either:
 * - PurchaseService/adapter result `{ ok, localCandidate, entitlement, ... }`
 * - A normalized Apple entitlement candidate (restore path)
 *
 * @param {object | null | undefined} result
 * @returns {boolean}
 */
export function canActivateLocalStoreKitEntitlement(result) {
  if (!isLocalStoreKitEntitlementModeAllowed()) return false
  if (!result || typeof result !== 'object') return false

  // PurchaseService / StoreKit adapter result
  if ('localCandidate' in result || 'serverVerified' in result || 'entitlement' in result) {
    if (result.ok !== true) return false
    if (result.localCandidate !== true) return false
    if (result.serverVerified === true) return false
    if (result.provider && result.provider !== 'apple' && result.provider !== 'storekit') {
      return false
    }
    return isEligibleLocalSoloAppleEntitlement(result.entitlement)
  }

  // Restore candidate (normalized Apple entitlement)
  if (!isEligibleLocalSoloAppleEntitlement(result)) return false
  if (isServerVerifiedEntitlement(result)) return false
  return isLocalAppleCandidate(result)
}

/**
 * @returns {Array<{
 *   productId: string,
 *   contentProductId: string,
 *   appleProductId: string | null,
 *   transactionId: string | null,
 *   grantedAt: string,
 *   source: 'apple',
 *   verificationState: 'local_xcode_test',
 * }>}
 */
export function getLocalStoreKitEntitlements() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LOCAL_STOREKIT_ENTITLEMENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (row) =>
        row &&
        typeof row === 'object' &&
        typeof row.productId === 'string' &&
        row.source === 'apple' &&
        row.verificationState === 'local_xcode_test',
    )
  } catch {
    return []
  }
}

/**
 * @param {typeof getLocalStoreKitEntitlements extends () => infer R ? R : never} rows
 */
function writeLocalStoreKitEntitlements(rows) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCAL_STOREKIT_ENTITLEMENTS_KEY, JSON.stringify(rows))
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} productId
 * @returns {boolean}
 */
export function hasLocalStoreKitEntitlement(productId) {
  if (!productId) return false
  return getLocalStoreKitEntitlements().some(
    (row) => row.productId === productId || row.contentProductId === productId,
  )
}

/**
 * Active local StoreKit test access on this device (mode + native + stored rows).
 * @returns {boolean}
 */
export function hasActiveLocalStoreKitAccess() {
  if (!isLocalStoreKitEntitlementModeAllowed()) return false
  return getLocalStoreKitEntitlements().length > 0
}

/**
 * Persist a development-only local entitlement and unlock content mapping.
 *
 * @param {object} result Purchase result or entitlement candidate
 * @returns {{ ok: boolean, code?: string, record?: object, openPath?: string, productId?: string }}
 */
export function activateLocalStoreKitEntitlement(result) {
  if (!canActivateLocalStoreKitEntitlement(result)) {
    logLocal('local entitlement activation denied')
    return { ok: false, code: 'local_activation_denied' }
  }

  const entitlement = result.entitlement ?? result
  const transactionId = entitlement.externalTransactionId
    ? String(entitlement.externalTransactionId)
    : null

  const record = {
    productId: entitlement.productId,
    contentProductId: entitlement.contentProductId ?? entitlement.productId,
    appleProductId:
      typeof entitlement.metadata?.appleProductId === 'string'
        ? entitlement.metadata.appleProductId
        : null,
    transactionId,
    grantedAt: entitlement.grantedAt ?? new Date().toISOString(),
    source: /** @type {const} */ ('apple'),
    verificationState: /** @type {const} */ ('local_xcode_test'),
  }

  const existing = getLocalStoreKitEntitlements()
  const withoutDup = transactionId
    ? existing.filter((row) => row.transactionId !== transactionId)
    : existing.filter(
        (row) =>
          !(row.productId === record.productId && row.transactionId == null),
      )
  // Replace same productId with newest local grant (one active local grant per SKU).
  const withoutProduct = withoutDup.filter((row) => row.productId !== record.productId)
  writeLocalStoreKitEntitlements([...withoutProduct, record])

  writePurchasedTier(record.contentProductId)
  purchaseTourProduct(record.contentProductId)

  const openPath = getAppHomePath({ afterUnlock: true })
  logLocal('local entitlement activated', {
    productId: record.productId,
    contentProductId: record.contentProductId,
    hasTransactionId: Boolean(transactionId),
  })

  return {
    ok: true,
    record,
    openPath,
    productId: record.productId,
  }
}

/**
 * Activate every eligible restore candidate. Dedupes by transaction id.
 *
 * @param {object} restoreResult
 * @returns {{ ok: boolean, activated: number, openPath: string | null }}
 */
export function activateLocalStoreKitEntitlementsFromRestore(restoreResult) {
  if (!isLocalStoreKitEntitlementModeAllowed()) {
    return { ok: false, activated: 0, openPath: null }
  }
  if (!restoreResult?.ok) {
    return { ok: false, activated: 0, openPath: null }
  }
  const candidates = [
    ...(restoreResult.candidates ?? []),
    ...(restoreResult.entitlements ?? []),
  ]
  const seen = new Set()
  let activated = 0
  let openPath = null
  for (const candidate of candidates) {
    const key =
      (candidate?.externalTransactionId && String(candidate.externalTransactionId)) ||
      candidate?.entitlementId ||
      `${candidate?.productId}:${candidate?.grantedAt}`
    if (seen.has(key)) continue
    seen.add(key)
    if (!canActivateLocalStoreKitEntitlement(candidate)) continue
    const outcome = activateLocalStoreKitEntitlement(candidate)
    if (outcome.ok) {
      activated += 1
      openPath = outcome.openPath ?? openPath
    }
  }
  logLocal('local restore activation', { activated })
  return { ok: activated > 0, activated, openPath }
}

/**
 * Clear only the local StoreKit test entitlement store.
 */
export function clearLocalStoreKitEntitlements() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(LOCAL_STOREKIT_ENTITLEMENTS_KEY)
    logLocal('local StoreKit test access cleared')
  } catch {
    /* ignore */
  }
}

/**
 * Human CTA label for a purchased solo Rome product.
 * @param {string} productId
 * @returns {string}
 */
export function openTourLabelForProduct(productId) {
  switch (productId) {
    case 'rome-complete':
      return 'Open Roma Eterna'
    case 'rome-essential':
      return 'Open Roma Antica'
    case 'rome-central':
      return 'Open Roma Historica'
    default:
      return 'Open tour'
  }
}
