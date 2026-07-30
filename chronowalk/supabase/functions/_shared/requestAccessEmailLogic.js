/**
 * Pure helpers for buyer self-serve access-email requests (vitest + Edge).
 */

export function normalizeBuyerEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

export function normalizeOrderId(orderId) {
  return String(orderId ?? '').trim()
}

/** Accept Paddle txn_… ids (case-sensitive prefix, tolerant trailing space). */
export function isPlausibleOrderId(orderId) {
  const raw = normalizeOrderId(orderId)
  return /^txn_[A-Za-z0-9]+$/.test(raw)
}

export function isPlausibleBuyerEmail(email) {
  const raw = normalizeBuyerEmail(email)
  if (!raw || raw.length > 254) return false
  if (raw.includes('\n') || raw.includes('\r') || raw.includes(' ')) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)
}

/**
 * Generic response — never reveal whether email/order matched.
 */
export function genericAccessEmailAck() {
  return {
    ok: true,
    message:
      'If that purchase email and Paddle order match our records, a fresh ChronoWalk access email is on its way. Check inbox and junk — Microsoft/Outlook sometimes files it under Other or Junk.',
  }
}

/**
 * Decide requeue vs restore from outbox + claim state.
 * @returns {'requeue_rotate'|'restore'|'noop'}
 */
export function decideAccessEmailAction({
  emailMatches = false,
  purchaseActive = false,
  hasCiphertext = false,
  hasActiveClaim = false,
} = {}) {
  if (!emailMatches) return 'noop'
  if (!purchaseActive && !hasCiphertext && !hasActiveClaim) {
    // Still try restore — operator_restore reactivates purchase.
    return 'restore'
  }
  if (hasCiphertext && hasActiveClaim) return 'requeue_rotate'
  if (hasCiphertext && !hasActiveClaim) return 'restore'
  return 'restore'
}
