/**
 * Normalize Apple / StoreKit transactions into CommerceEntitlement.
 * Local success is never treated as server-verified permanent access.
 */

import { createEntitlement, dedupeEntitlements, isEntitlementActive } from '../commerce/entitlementModel.js'
import { getSkuEntitlementShape, getCityIdForProduct } from '../commerce/commerceCatalog.js'
import {
  getStoreKitMapping,
  getStoreKitMappingByAppleId,
  resolveInternalProductIdFromApple,
} from './storeKitProductMappings.js'

/**
 * @typedef {Object} AppleTransactionLike
 * @property {string} [transactionId]
 * @property {string} [originalTransactionId]
 * @property {string} [productId] Apple product identifier
 * @property {string} [productIdentifier]
 * @property {string} [purchaseDate]
 * @property {string} [originalPurchaseDate]
 * @property {boolean} [revoked]
 * @property {string} [revocationDate]
 * @property {string} [refundedAt]
 * @property {string} [expirationDate]
 * @property {'purchased' | 'restored' | 'revoked' | 'refunded' | 'pending' | string} [status]
 * @property {string} [jwsRepresentation]
 * @property {string} [appAccountToken]
 * @property {Record<string, unknown>} [metadata]
 */

/**
 * @param {AppleTransactionLike} transaction
 * @param {{ subjectId?: string }} [options]
 * @returns {import('../commerce/entitlementModel.js').CommerceEntitlement | null}
 */
export function normalizeAppleTransaction(transaction, options = {}) {
  if (!transaction || typeof transaction !== 'object') return null

  const appleProductId =
    transaction.productId ||
    transaction.productIdentifier ||
    transaction.product_id ||
    null

  const mapping = appleProductId ? getStoreKitMappingByAppleId(appleProductId) : null
  const productId =
    mapping?.productId ??
    resolveInternalProductIdFromApple(appleProductId) ??
    null

  if (!productId) return null

  const sku = getSkuEntitlementShape(productId)
  if (!sku) return null

  const externalTransactionId =
    transaction.transactionId ||
    transaction.transaction_id ||
    transaction.id ||
    null

  const originalTransactionId =
    transaction.originalTransactionId ||
    transaction.original_transaction_id ||
    externalTransactionId

  const status = deriveAppleStatus(transaction)

  const entitlement = createEntitlement({
    entitlementId: externalTransactionId
      ? `ent_apple_${externalTransactionId}`
      : undefined,
    subjectId: options.subjectId ?? transaction.subjectId ?? 'anonymous',
    productId: sku.productId,
    contentProductId: mapping?.contentProductId ?? sku.contentProductId ?? sku.productId,
    cityId: getCityIdForProduct(sku.productId),
    source: 'apple',
    externalTransactionId: externalTransactionId ?? originalTransactionId,
    status,
    grantedAt:
      transaction.purchaseDate ||
      transaction.originalPurchaseDate ||
      transaction.grantedAt ||
      undefined,
    revokedAt:
      status === 'active'
        ? null
        : transaction.revocationDate ||
          transaction.refundedAt ||
          transaction.revokedAt ||
          new Date().toISOString(),
    seatLimit: sku.seatLimit,
    kind: sku.kind,
    metadata: {
      provider: 'apple',
      appleProductId,
      originalTransactionId,
      appAccountToken: transaction.appAccountToken ?? null,
      // Local StoreKit success is a candidate only — server must verify.
      serverVerified: false,
      verificationState: 'local_unverified',
      jwsPresent: Boolean(transaction.jwsRepresentation),
      ...(transaction.metadata ?? {}),
    },
  })

  return entitlement
}

/**
 * @param {AppleTransactionLike} transaction
 * @returns {import('../commerce/entitlementModel.js').EntitlementStatus}
 */
function deriveAppleStatus(transaction) {
  if (transaction.revoked === true || transaction.revocationDate) return 'revoked'
  if (transaction.refundedAt || transaction.status === 'refunded') return 'refunded'
  if (transaction.status === 'revoked') return 'revoked'
  if (transaction.status === 'pending') return 'pending'
  if (transaction.status === 'inactive') return 'inactive'
  // Do not treat a bare paid=true boolean as authoritative.
  if (transaction.paid === true && !transaction.transactionId && !transaction.productId) {
    return 'pending'
  }
  return 'active'
}

/**
 * Deduplicate Apple entitlement candidates by stable transaction identity.
 *
 * @param {import('../commerce/entitlementModel.js').CommerceEntitlement[]} entitlements
 */
export function dedupeAppleEntitlements(entitlements) {
  return dedupeEntitlements(entitlements ?? [])
}

/**
 * Local purchase / restore results are candidates — not server-authoritative grants.
 *
 * @param {import('../commerce/entitlementModel.js').CommerceEntitlement | null | undefined} entitlement
 * @returns {boolean}
 */
export function isServerVerifiedEntitlement(entitlement) {
  return Boolean(entitlement?.metadata?.serverVerified === true)
}

/**
 * @param {import('../commerce/entitlementModel.js').CommerceEntitlement | null | undefined} entitlement
 * @returns {boolean}
 */
export function isLocalAppleCandidate(entitlement) {
  return (
    entitlement?.source === 'apple' &&
    entitlement?.metadata?.verificationState === 'local_unverified' &&
    !isServerVerifiedEntitlement(entitlement)
  )
}

export { isEntitlementActive, getStoreKitMapping }
