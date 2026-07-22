/**
 * Pure fulfillment helpers for paddle-webhook (vitest + Deno).
 * Entitlement is derived only from server-configured price IDs.
 */

import {
  LAUNCH_CATALOG_BY_ID,
  LAUNCH_CATALOG_PRODUCTS,
  entitlementForCatalogSku,
} from './launchCatalog.gen.js'

export const SERVER_PRICE_ENV_KEYS = Object.freeze(
  Object.fromEntries(LAUNCH_CATALOG_PRODUCTS.map((p) => [p.productId, p.serverEnvKey])),
)

export function maskEmail(email) {
  const raw = String(email ?? '').toLowerCase()
  const at = raw.indexOf('@')
  if (at <= 0) return '[redacted-email]'
  return `${raw[0]}***@${raw.slice(at + 1, at + 2)}***`
}

/** Strict-enough buyer email check (never treat custom_data as authoritative). */
export function isValidEmail(email) {
  const raw = String(email ?? '').trim().toLowerCase()
  if (!raw || raw.length > 254) return false
  // Reject obvious placeholders / injection noise.
  if (raw.includes('\n') || raw.includes('\r') || raw.includes(' ')) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)
}

/**
 * Email candidates from a Paddle transaction payload (not custom_data).
 * Browser/custom fields are never included.
 */
export function paddlePayloadEmailCandidate(data) {
  const direct =
    data?.customer?.email ??
    data?.email ??
    null
  if (!direct || !isValidEmail(direct)) return null
  return String(direct).trim().toLowerCase()
}

/** Seat count for a paid bundle SKU (owner seat included). */
export function fixedSeatLimitForSku(productId) {
  const row = LAUNCH_CATALOG_BY_ID[productId]
  return row ? row.seatLimit : null
}

/** Whether an inbox RPC result indicates a duplicate event_id. */
export function isDuplicateWebhookInbox(result) {
  return Boolean(result && (result.duplicate === true || result.is_duplicate === true))
}

export function maskId(id) {
  const raw = String(id ?? '')
  if (raw.length <= 10) return `${raw.slice(0, 4)}…`
  return `${raw.slice(0, 8)}…${raw.slice(-4)}`
}

/**
 * Build price_id → entitlement map from env-like object.
 * Rejects missing or duplicate configured price IDs.
 */
export function buildServerPriceMap(env = {}) {
  const map = new Map()
  const seen = new Map()
  const missing = []
  for (const product of LAUNCH_CATALOG_PRODUCTS) {
    const raw = String(env[product.serverEnvKey] ?? '').trim()
    if (!raw) {
      missing.push(product.serverEnvKey)
      continue
    }
    if (seen.has(raw)) {
      return {
        ok: false,
        reason: 'duplicate_price_id',
        message: `Duplicate price id configured for ${seen.get(raw)} and ${product.productId}`,
      }
    }
    seen.set(raw, product.productId)
    map.set(raw, {
      productId: product.productId,
      contentProductId: product.contentProductId,
      seatLimit: product.seatLimit,
      kind: product.kind,
      amountCents: product.amountCents,
    })
  }
  if (missing.length) {
    return {
      ok: false,
      reason: 'missing_price_env',
      message: `Missing server price secrets: ${missing.join(', ')}`,
    }
  }
  return { ok: true, map }
}

export function readCustomData(data) {
  const raw = data?.custom_data ?? data?.customData ?? {}
  const custom = raw && typeof raw === 'object' ? raw : {}
  return {
    product_id: custom.product_id ? String(custom.product_id) : null,
    host: custom.host ? String(custom.host) : null,
    ab_variant: custom.ab_variant != null ? Number(custom.ab_variant) : null,
    consent_version: custom.consent_version ? String(custom.consent_version) : null,
  }
}

/**
 * Extract line items from a transaction.completed payload.
 * Prefer data.items; fall back to details.line_items.
 */
export function extractTransactionItems(data) {
  const items = Array.isArray(data?.items) ? data.items : []
  if (items.length) {
    return items.map((item) => ({
      priceId: item?.price?.id ?? item?.price_id ?? item?.priceId ?? null,
      quantity: Number(item?.quantity ?? 0),
      billingCycle: item?.price?.billing_cycle ?? item?.price?.billingCycle ?? null,
    }))
  }
  const lineItems = Array.isArray(data?.details?.line_items) ? data.details.line_items : []
  return lineItems.map((item) => ({
    priceId: item?.price_id ?? item?.price?.id ?? item?.priceId ?? null,
    quantity: Number(item?.quantity ?? 0),
    billingCycle: item?.price?.billing_cycle ?? item?.price?.billingCycle ?? null,
  }))
}

/**
 * Validate a completed transaction against the server price map.
 * Fail closed for unknown / multiple / qty≠1 / recurring items.
 */
export function resolveLaunchEntitlementFromTransaction(data, priceMap) {
  if (!data || typeof data !== 'object') {
    return { ok: false, reason: 'invalid_payload', operatorReview: true }
  }
  if (data.status !== 'completed') {
    return { ok: false, reason: 'not_completed', operatorReview: false }
  }

  const items = extractTransactionItems(data)
  if (items.length === 0) {
    return { ok: false, reason: 'no_items', operatorReview: true }
  }
  if (items.length !== 1) {
    return { ok: false, reason: 'multiple_items', operatorReview: true, itemCount: items.length }
  }

  const [item] = items
  if (!item.priceId) {
    return { ok: false, reason: 'missing_price_id', operatorReview: true }
  }
  if (item.quantity !== 1) {
    return { ok: false, reason: 'invalid_quantity', operatorReview: true, quantity: item.quantity }
  }
  if (item.billingCycle != null) {
    return { ok: false, reason: 'recurring_price', operatorReview: true }
  }

  const entitlement = priceMap.get(String(item.priceId))
  if (!entitlement) {
    return {
      ok: false,
      reason: 'unknown_price',
      operatorReview: true,
      priceId: String(item.priceId),
    }
  }

  const totals = data?.details?.totals ?? data?.totals ?? {}
  const amountCents = totals?.total != null ? Number(totals.total) : null
  const currencyCode = data?.currency_code ?? totals?.currency_code ?? null
  const custom = readCustomData(data)
  const attributionMismatch =
    custom.product_id && custom.product_id !== entitlement.productId
      ? {
          claimed: custom.product_id,
          derived: entitlement.productId,
        }
      : null

  return {
    ok: true,
    priceId: String(item.priceId),
    productId: entitlement.productId,
    contentProductId: entitlement.contentProductId,
    seatLimit: entitlement.seatLimit,
    kind: entitlement.kind,
    amountCents: Number.isFinite(amountCents) ? amountCents : null,
    currencyCode: currencyCode ? String(currencyCode) : null,
    custom,
    attributionMismatch,
  }
}

/** True when an older event must not overwrite a newer terminal purchase state. */
export function shouldIgnoreOutOfOrderEvent(incomingOccurredAt, storedOccurredAt) {
  if (!incomingOccurredAt || !storedOccurredAt) return false
  const incoming = Date.parse(incomingOccurredAt)
  const stored = Date.parse(storedOccurredAt)
  if (!Number.isFinite(incoming) || !Number.isFinite(stored)) return false
  return incoming < stored
}

export const TERMINAL_PURCHASE_STATUSES = Object.freeze(['refunded', 'disputed', 'revoked'])

export function isTerminalPurchaseStatus(status) {
  return TERMINAL_PURCHASE_STATUSES.includes(String(status ?? ''))
}

const REVERSAL_ACTIONS = new Set([
  'chargeback_reverse',
  'chargeback_warning_reverse',
  'credit_reverse',
])

const DISPUTE_ACTIONS = new Set(['chargeback', 'chargeback_warning'])

/**
 * Resolve launch business effect for a Paddle adjustment entity.
 * Does not restore access on reversals — operator must issue a fresh claim.
 *
 * @param {{ action?: string, status?: string, type?: string }} data
 */
export function resolveAdjustmentEffect(data = {}) {
  const action = String(data.action ?? '').toLowerCase()
  const status = String(data.status ?? '').toLowerCase()
  const type = String(data.type ?? '').toLowerCase()

  if (!action) {
    return {
      ok: false,
      effect: 'record_only',
      revoke: false,
      purchaseStatus: null,
      operatorReview: true,
      reason: 'missing_action',
    }
  }

  if (REVERSAL_ACTIONS.has(action)) {
    return {
      ok: true,
      effect: 'record_only',
      revoke: false,
      purchaseStatus: null,
      operatorReview: true,
      reason: 'reversal_requires_operator',
    }
  }

  if (DISPUTE_ACTIONS.has(action)) {
    return {
      ok: true,
      effect: 'dispute',
      revoke: true,
      purchaseStatus: 'disputed',
      operatorReview: false,
      reason: action,
    }
  }

  // Partial refund/credit: never auto-revoke the whole product.
  if (type === 'partial') {
    return {
      ok: true,
      effect: 'record_only',
      revoke: false,
      purchaseStatus: null,
      operatorReview: true,
      reason: 'partial_operator_review',
    }
  }

  if ((action === 'refund' || action === 'credit') && (type === 'full' || type === '')) {
    if (status === 'pending_approval' || status === 'pending') {
      return {
        ok: true,
        effect: 'record_only',
        revoke: false,
        purchaseStatus: null,
        operatorReview: false,
        reason: 'pending_keep_access',
      }
    }
    if (status === 'rejected') {
      return {
        ok: true,
        effect: 'record_only',
        revoke: false,
        purchaseStatus: null,
        operatorReview: false,
        reason: 'rejected_retain_active',
      }
    }
    if (status === 'approved') {
      return {
        ok: true,
        effect: 'refund',
        revoke: true,
        purchaseStatus: 'refunded',
        operatorReview: false,
        reason: action === 'credit' ? 'full_credit_approved' : 'full_refund_approved',
      }
    }
  }

  return {
    ok: true,
    effect: 'record_only',
    revoke: false,
    purchaseStatus: null,
    operatorReview: true,
    reason: 'unknown_adjustment',
  }
}

/**
 * Normalize adjustment payload fields from Paddle webhook data.
 */
export function readAdjustmentPayload(data = {}) {
  return {
    adjustmentId: data.id ? String(data.id) : null,
    transactionId: data.transaction_id ?? data.transactionId ?? null,
    action: data.action ?? null,
    status: data.status ?? null,
    type: data.type ?? null,
    reason: data.reason ?? null,
  }
}

export function catalogSkuOrNull(productId) {
  return LAUNCH_CATALOG_BY_ID[productId] ? productId : null
}

export { entitlementForCatalogSku, LAUNCH_CATALOG_PRODUCTS }
