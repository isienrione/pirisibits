/**
 * In-flight StoreKit purchase sessions.
 *
 * Prevents Buy from re-arming while a native purchase sheet may still resolve
 * after the JS request timeout. Sessions are process-local (not cross-device).
 */

export const PURCHASE_SESSION_STATUS = Object.freeze({
  IN_FLIGHT: 'in_flight',
  CHECKING: 'checking',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
})

/** Absolute ceiling so a hung StoreKit sheet cannot lock Buy forever. */
export const PURCHASE_SESSION_MAX_MS = 120_000

/** @type {Map<string, {
 *   productId: string,
 *   status: string,
 *   startedAt: number,
 *   result: object | null,
 *   waiters: Array<(result: object | null) => void>,
 * }>} */
const sessions = new Map()

/**
 * @param {string} productId
 * @returns {boolean}
 */
export function isPurchaseSessionBlocking(productId) {
  const session = sessions.get(productId)
  if (!session) return false
  if (
    session.status === PURCHASE_SESSION_STATUS.SUCCEEDED ||
    session.status === PURCHASE_SESSION_STATUS.FAILED ||
    session.status === PURCHASE_SESSION_STATUS.CANCELLED
  ) {
    return false
  }
  if (Date.now() - session.startedAt > PURCHASE_SESSION_MAX_MS) {
    releasePurchaseSession(productId, {
      ok: false,
      code: 'storekit_request_timeout',
      purchasePending: false,
      message: 'Purchase check timed out. Use Restore Purchases if you completed payment.',
    })
    return false
  }
  return true
}

/**
 * @param {string} productId
 */
export function beginPurchaseSession(productId) {
  if (!productId) return null
  const existing = sessions.get(productId)
  if (existing && isPurchaseSessionBlocking(productId)) {
    return existing
  }
  const session = {
    productId,
    status: PURCHASE_SESSION_STATUS.IN_FLIGHT,
    startedAt: Date.now(),
    result: null,
    waiters: [],
  }
  sessions.set(productId, session)
  return session
}

/**
 * @param {string} productId
 */
export function markPurchaseSessionChecking(productId) {
  const session = sessions.get(productId)
  if (!session) return null
  if (
    session.status === PURCHASE_SESSION_STATUS.IN_FLIGHT ||
    session.status === PURCHASE_SESSION_STATUS.CHECKING
  ) {
    session.status = PURCHASE_SESSION_STATUS.CHECKING
  }
  return session
}

/**
 * @param {string} productId
 * @param {object} result
 */
export function completePurchaseSession(productId, result) {
  const session = sessions.get(productId)
  if (!session) return result

  const code = String(result?.code ?? '').toLowerCase()
  if (result?.ok) {
    session.status = PURCHASE_SESSION_STATUS.SUCCEEDED
  } else if (code.includes('cancel')) {
    session.status = PURCHASE_SESSION_STATUS.CANCELLED
  } else {
    session.status = PURCHASE_SESSION_STATUS.FAILED
  }
  session.result = result ?? null

  const waiters = session.waiters.splice(0, session.waiters.length)
  for (const resolve of waiters) resolve(session.result)

  // Keep succeeded briefly so UI can observe; failed/cancelled release immediately.
  if (session.status !== PURCHASE_SESSION_STATUS.SUCCEEDED) {
    sessions.delete(productId)
  }
  return result
}

/**
 * @param {string} productId
 * @param {object | null} [result]
 */
export function releasePurchaseSession(productId, result = null) {
  const session = sessions.get(productId)
  if (!session) return
  session.status = PURCHASE_SESSION_STATUS.FAILED
  session.result = result
  const waiters = session.waiters.splice(0, session.waiters.length)
  for (const resolve of waiters) resolve(result)
  sessions.delete(productId)
}

/**
 * @param {string} productId
 */
export function getPurchaseSession(productId) {
  return sessions.get(productId) ?? null
}

/**
 * Await late native resolution after a JS timeout (or return current result).
 * @param {string} productId
 * @param {{ timeoutMs?: number }} [options]
 */
export function awaitPurchaseSession(productId, options = {}) {
  const session = sessions.get(productId)
  if (!session) return Promise.resolve(null)
  if (
    session.status === PURCHASE_SESSION_STATUS.SUCCEEDED ||
    session.status === PURCHASE_SESSION_STATUS.FAILED ||
    session.status === PURCHASE_SESSION_STATUS.CANCELLED
  ) {
    return Promise.resolve(session.result)
  }

  const timeoutMs = options.timeoutMs ?? PURCHASE_SESSION_MAX_MS
  const remaining = Math.max(0, timeoutMs - (Date.now() - session.startedAt))

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      releasePurchaseSession(productId, {
        ok: false,
        code: 'storekit_request_timeout',
        purchasePending: false,
      })
      resolve(null)
    }, remaining)

    session.waiters.push((result) => {
      clearTimeout(timer)
      resolve(result)
    })
  })
}

/** @internal */
export function __resetPurchaseSessionsForTests() {
  sessions.clear()
}
