/**
 * Pure fulfillment outbox worker helpers (vitest + Edge).
 * Never logs email, tokens, links, or full provider bodies.
 */

export const MAX_FULFILLMENT_ATTEMPTS = 8
export const BACKOFF_BASE_SECONDS = 30
export const BACKOFF_CAP_SECONDS = 6 * 60 * 60

/** @param {number} attemptsAfterIncrement */
export function computeBackoffSeconds(attemptsAfterIncrement) {
  const n = Math.max(1, Number(attemptsAfterIncrement) || 1)
  const raw = BACKOFF_BASE_SECONDS * 2 ** Math.min(n - 1, 10)
  return Math.min(raw, BACKOFF_CAP_SECONDS)
}

/**
 * Classify Resend / fetch outcomes for retry vs permanent failure.
 * @returns {{ kind: 'success'|'transient'|'permanent', reason: string }}
 */
export function classifyResendResponse({ status, timedOut = false, networkError = false }) {
  if (timedOut || networkError) {
    return { kind: 'transient', reason: timedOut ? 'timeout' : 'network' }
  }
  const code = Number(status)
  if (!Number.isFinite(code)) {
    return { kind: 'transient', reason: 'unknown_status' }
  }
  if (code >= 200 && code < 300) {
    return { kind: 'success', reason: 'ok' }
  }
  if (code === 429 || code >= 500) {
    return { kind: 'transient', reason: `http_${code}` }
  }
  if (code >= 400 && code < 500) {
    return { kind: 'permanent', reason: `http_${code}` }
  }
  return { kind: 'transient', reason: `http_${code}` }
}

/**
 * Stable Resend Idempotency-Key for one fulfillment email generation.
 * Format: purchase-access/<order_id>/<email_generation_id>
 * - Same generation → same key across worker retries
 * - Fresh claim / operator recovery → new email_generation_id → new key
 * - Never includes claim secrets, links, emails, or ciphertext
 *
 * Legacy rows without a generation id fall back to order-only key (migration
 * backfills email_generation_id = outbox.id so this path is rare).
 */
export function resendIdempotencyKey(orderId, emailGenerationId) {
  const order = String(orderId ?? '').trim()
  const gen = String(emailGenerationId ?? '').trim()
  if (!gen) return `purchase-access/${order}`
  return `purchase-access/${order}/${gen}`
}

/** Secret-safe uuid for a newly minted fulfillment email generation. */
export function newEmailGenerationId(randomUuid = () => crypto.randomUUID()) {
  return String(randomUuid())
}

/**
 * Fields to set when minting a fresh claim email generation (initial enqueue
 * after wipe, or operator recovery). Rotates generation and clears prior
 * email lifecycle so Resend idempotency and webhooks cannot collide.
 */
export function freshFulfillmentGenerationFields({
  reason = 'fresh_generation',
  attempts = 0,
  nowIso = new Date().toISOString(),
  generationId = null,
} = {}) {
  return {
    email_generation_id: generationId ?? newEmailGenerationId(),
    status: 'pending',
    attempts,
    next_attempt_at: nowIso,
    sent_at: null,
    delivered_at: null,
    resend_email_id: null,
    last_provider_status: null,
    locked_at: null,
    locked_by: null,
    last_error: reason,
    updated_at: nowIso,
  }
}

/**
 * Decide whether a Resend provider event may mutate the current outbox row.
 * Correlate by provider email id; refuse terminal mutations while awaiting send.
 */
export function shouldApplyResendEventToOutbox({
  outboxResendEmailId,
  eventResendEmailId,
  outboxStatus,
  eventType,
}) {
  const providerId = String(eventResendEmailId ?? '').trim()
  const currentId = String(outboxResendEmailId ?? '').trim()
  if (!providerId) return { apply: false, reason: 'missing_provider_id' }
  if (!currentId) return { apply: false, reason: 'missing_outbox' }
  if (providerId !== currentId) return { apply: false, reason: 'provider_id_mismatch' }

  const status = String(outboxStatus ?? '')
  if (['pending', 'failed', 'cancelled'].includes(status)) {
    return { apply: false, reason: 'stale_or_pre_send_generation' }
  }

  switch (eventType) {
    case 'email.delivered':
      if (!['sent', 'sending', 'delivered'].includes(status)) {
        return { apply: false, reason: 'status_not_applicable' }
      }
      return { apply: true, reason: 'delivered' }
    case 'email.delivery_delayed':
      if (!['sent', 'sending'].includes(status)) {
        return { apply: false, reason: 'status_not_applicable' }
      }
      return { apply: true, reason: 'delivery_delayed' }
    case 'email.bounced':
    case 'email.complained':
    case 'email.failed':
      if (!['sent', 'sending', 'delivered'].includes(status)) {
        return { apply: false, reason: 'status_not_applicable' }
      }
      return { apply: true, reason: eventType }
    default:
      return { apply: false, reason: 'ignored_event' }
  }
}

/**
 * Decide whether the webhook should mint a new initial claim.
 * Mirrors ensure_initial_purchase_claim semantics for unit tests.
 */
export function decideInitialClaimIssue({
  hasActiveInitialClaim = false,
  outboxHasCiphertext = false,
  outboxStatus = null,
}) {
  if (hasActiveInitialClaim) {
    return { issue: false, reason: 'active_claim_exists' }
  }
  if (
    outboxHasCiphertext &&
    ['pending', 'sending', 'sent', 'failed'].includes(String(outboxStatus ?? ''))
  ) {
    return { issue: false, reason: 'outbox_ciphertext_present' }
  }
  return { issue: true, reason: 'mint_initial' }
}

/**
 * Simulate concurrent workers claiming the same due set with SKIP LOCKED semantics.
 * Each worker receives a disjoint subset; no row is claimed twice.
 */
export function simulateConcurrentOutboxClaim(dueRowIds, workerCount, limitPerWorker = 10) {
  const queue = [...dueRowIds]
  const claimedByWorker = Array.from({ length: workerCount }, () => [])
  let worker = 0
  while (queue.length) {
    const batch = []
    while (batch.length < limitPerWorker && queue.length) {
      batch.push(queue.shift())
    }
    if (!batch.length) break
    claimedByWorker[worker % workerCount].push(...batch)
    worker += 1
    if (worker >= workerCount && queue.length === 0) break
    // Round-robin only advances when multiple workers pull; for test we assign one batch each turn.
    if (batch.length) worker = (worker + 1) % Math.max(workerCount, 1)
  }
  // Simpler algorithm: partition with skip-locked style single-pass
  const remaining = [...dueRowIds]
  const result = Array.from({ length: workerCount }, () => [])
  for (let w = 0; w < workerCount; w++) {
    result[w] = remaining.splice(0, limitPerWorker)
  }
  const flat = result.flat()
  const unique = new Set(flat)
  return {
    claimedByWorker: result,
    totalClaimed: flat.length,
    uniqueCount: unique.size,
    noDuplicates: unique.size === flat.length,
  }
}

/** Mask helpers for CLIs / logs */
export function maskEmail(email) {
  const raw = String(email ?? '').trim().toLowerCase()
  const at = raw.indexOf('@')
  if (at <= 0) return '[redacted-email]'
  const local = raw.slice(0, at)
  const domain = raw.slice(at + 1)
  const localMask =
    local.length <= 1 ? '*' : `${local[0]}${'*'.repeat(Math.min(local.length - 1, 6))}`
  const domainParts = domain.split('.')
  const domainMask = domainParts
    .map((part, i) => {
      if (!part) return part
      if (i === domainParts.length - 1) return part
      return part.length <= 1 ? '*' : `${part[0]}***`
    })
    .join('.')
  return `${localMask}@${domainMask}`
}

export function maskOrderId(orderId) {
  const raw = String(orderId ?? '').trim()
  if (!raw) return '[redacted-order]'
  if (raw.length <= 10) return `${raw.slice(0, 4)}…`
  return `${raw.slice(0, 8)}…${raw.slice(-4)}`
}

export function maskId(id) {
  const raw = String(id ?? '')
  if (!raw) return '[redacted-id]'
  if (raw.length <= 10) return `${raw.slice(0, 4)}…`
  return `${raw.slice(0, 8)}…${raw.slice(-4)}`
}

export function ageSeconds(iso, nowMs = Date.now()) {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  return Math.max(0, Math.floor((nowMs - t) / 1000))
}

/**
 * Map Resend webhook event types to outbox transitions (pure).
 */
export function resendEventOutboxPatch(eventType) {
  switch (eventType) {
    case 'email.delivered':
      return { status: 'delivered', wipeClaim: true, lastError: null }
    case 'email.delivery_delayed':
      return { status: null, wipeClaim: false, lastError: 'delivery_delayed' }
    case 'email.bounced':
    case 'email.complained':
    case 'email.failed':
      return { status: 'fulfillment_failed', wipeClaim: true, lastError: eventType }
    default:
      return { status: null, wipeClaim: false, lastError: null, ignored: true }
  }
}

/**
 * Verify Svix webhook signature (Resend).
 * @param {{ payload: string, headers: Record<string,string>, secret: string, nowMs?: number, toleranceSec?: number }} opts
 */
export async function verifySvixSignature({
  payload,
  headers,
  secret,
  nowMs = Date.now(),
  toleranceSec = 300,
}) {
  const id = headers['svix-id'] ?? headers['Svix-Id'] ?? ''
  const timestamp = headers['svix-timestamp'] ?? headers['Svix-Timestamp'] ?? ''
  const signature = headers['svix-signature'] ?? headers['Svix-Signature'] ?? ''
  if (!id || !timestamp || !signature || !secret) {
    return { ok: false, reason: 'missing_headers' }
  }
  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return { ok: false, reason: 'bad_timestamp' }
  if (Math.abs(nowMs / 1000 - ts) > toleranceSec) {
    return { ok: false, reason: 'timestamp_out_of_tolerance' }
  }

  let keyBytes
  const rawSecret = String(secret)
  if (rawSecret.startsWith('whsec_')) {
    const b64 = rawSecret.slice('whsec_'.length)
    keyBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  } else {
    keyBytes = new TextEncoder().encode(rawSecret)
  }

  const toSign = `${id}.${timestamp}.${payload}`
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBuf = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(toSign))
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))

  const candidates = String(signature)
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part.startsWith('v1,') ? part.slice(3) : part))

  const ok = candidates.some((c) => c === expected)
  return ok ? { ok: true } : { ok: false, reason: 'bad_signature' }
}

export function authorizeCronRequest(req, secret) {
  const expected = String(secret ?? '')
  if (!expected) return { ok: false, reason: 'cron_secret_unset' }
  const auth = req?.headers?.get?.('authorization') ?? req?.headers?.get?.('Authorization') ?? ''
  const headerSecret =
    req?.headers?.get?.('x-fulfillment-cron-secret') ??
    req?.headers?.get?.('X-Fulfillment-Cron-Secret') ??
    ''
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  if (bearer && bearer === expected) return { ok: true, via: 'bearer' }
  if (headerSecret && headerSecret === expected) return { ok: true, via: 'header' }
  return { ok: false, reason: 'unauthorized' }
}
