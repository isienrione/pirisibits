/**
 * Future App Store Server API verification boundary.
 *
 * This PR defines the contract only. No production verification endpoint
 * is deployed here. Do not grant server-authoritative permanent access
 * from local StoreKit success alone.
 */

/**
 * @typedef {'ok' | 'invalid' | 'revoked' | 'refunded' | 'duplicate' | 'not_configured' | 'network_error' | 'unauthorized'} AppleVerificationStatus
 */

/**
 * @typedef {Object} VerifyAppleTransactionRequest
 * @property {string} [signedTransaction] JWS from StoreKit 2 (jwsRepresentation)
 * @property {string} [transactionId]
 * @property {string} [originalTransactionId]
 * @property {string} productId Internal product id OR Apple product id (caller documents which)
 * @property {string} [appleProductId]
 * @property {string} [appAccountToken] Stable account link UUID
 * @property {string} [subjectId]
 * @property {string} [bundleId] Expected com.chronowalk.app
 * @property {string} [idempotencyKey] Client-supplied key; server must treat as idempotent
 */

/**
 * @typedef {Object} VerifyAppleTransactionResponse
 * @property {boolean} ok
 * @property {AppleVerificationStatus} status
 * @property {boolean} serverVerified
 * @property {import('../commerce/entitlementModel.js').CommerceEntitlement | null} [entitlement]
 * @property {string | null} [errorCode]
 * @property {string | null} [message]
 * @property {boolean} [idempotentReplay] True when an identical prior verification was returned
 */

export const APPLE_VERIFICATION_STATUSES = Object.freeze([
  'ok',
  'invalid',
  'revoked',
  'refunded',
  'duplicate',
  'not_configured',
  'network_error',
  'unauthorized',
])

/**
 * Idempotency: same (transactionId | signedTransaction hash | idempotencyKey)
 * must yield the same entitlement grant without double-charging seats.
 *
 * Revocation / refund: App Store Server Notifications V2 (REFUND, REVOKE,
 * DID_CHANGE_RENEWAL_STATUS, etc.) must set status revoked/refunded and
 * revokedAt — never leave a local_unverified active grant as authoritative.
 *
 * @param {VerifyAppleTransactionRequest} request
 * @returns {Promise<VerifyAppleTransactionResponse>}
 */
export async function verifyAppleTransaction(request) {
  if (!request || typeof request !== 'object') {
    return {
      ok: false,
      status: 'invalid',
      serverVerified: false,
      entitlement: null,
      errorCode: 'invalid_request',
      message: 'verifyAppleTransaction requires a request object',
    }
  }

  if (!request.signedTransaction && !request.transactionId) {
    return {
      ok: false,
      status: 'invalid',
      serverVerified: false,
      entitlement: null,
      errorCode: 'missing_transaction',
      message: 'signedTransaction or transactionId is required',
    }
  }

  // Intentionally not implemented in this PR — prevents accidental
  // "local success ⇒ permanent access" shortcuts.
  return {
    ok: false,
    status: 'not_configured',
    serverVerified: false,
    entitlement: null,
    errorCode: 'apple_verification_not_configured',
    message:
      'App Store Server API verification is not deployed. Local StoreKit results remain unverified candidates.',
    idempotentReplay: false,
  }
}

/**
 * Documented failure states for clients and future Edge Functions.
 */
export const APPLE_VERIFICATION_FAILURE_STATES = Object.freeze({
  invalid: 'JWS / transaction failed cryptographic or schema validation',
  revoked: 'Apple revoked the transaction (family share revoke, etc.)',
  refunded: 'Apple issued a refund; entitlement must be inactive',
  duplicate: 'Idempotent replay of an already-processed transaction',
  not_configured: 'Server verification endpoint / secrets not configured',
  network_error: 'Transient failure talking to App Store Server API',
  unauthorized: 'Caller not allowed to verify for this subject/app',
})
