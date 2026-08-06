/**
 * Restore Purchases architecture for Apple / StoreKit.
 */

import { dedupeAppleEntitlements, normalizeAppleTransaction } from './transactionNormalizer.js'
import { grantEntitlement, getEntitlementsForSubject } from '../commerce/entitlementService.js'

/**
 * @param {object[]} transactions Raw StoreKit / plugin transactions
 * @param {{ subjectId?: string, updateLocalView?: boolean }} [options]
 * @returns {{
 *   ok: boolean,
 *   entitlements: import('../commerce/entitlementModel.js').CommerceEntitlement[],
 *   candidates: import('../commerce/entitlementModel.js').CommerceEntitlement[],
 *   serverVerified: false,
 *   preparedForVerification: object[],
 * }}
 */
export function processRestoredTransactions(transactions, options = {}) {
  const subjectId = options.subjectId ?? 'anonymous'
  const normalized = []
  for (const txn of transactions ?? []) {
    const entitlement = normalizeAppleTransaction(txn, { subjectId })
    if (entitlement) normalized.push(entitlement)
  }

  const candidates = dedupeAppleEntitlements(normalized)

  // Local view may show candidates for UX, but metadata marks them unverified.
  if (options.updateLocalView) {
    for (const entitlement of candidates) {
      grantEntitlement(subjectId, entitlement)
    }
  }

  const preparedForVerification = candidates.map((entitlement) => ({
    transactionId: entitlement.externalTransactionId,
    originalTransactionId: entitlement.metadata?.originalTransactionId ?? null,
    productId: entitlement.productId,
    appleProductId: entitlement.metadata?.appleProductId ?? null,
    appAccountToken: entitlement.metadata?.appAccountToken ?? null,
    subjectId: entitlement.subjectId,
    status: entitlement.status,
  }))

  return {
    ok: true,
    entitlements: options.updateLocalView ? getEntitlementsForSubject(subjectId) : candidates,
    candidates,
    serverVerified: false,
    preparedForVerification,
  }
}
