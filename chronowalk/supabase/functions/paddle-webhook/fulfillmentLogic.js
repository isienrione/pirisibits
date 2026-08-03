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

/** Whether an inbox RPC result indicates a duplicate event_id that must not reprocess. */
export function isDuplicateWebhookInbox(result) {
  if (!result) return false
  // Failed events reclaimed for retry are not duplicates.
  if (result.reclaim === true) return false
  return Boolean(result.duplicate === true || result.is_duplicate === true)
}

/**
 * Integer minor-unit amount as a canonical digit string (no floats).
 * Returns null when the value is missing or not a non-negative integer string/number.
 */
export function normalizeMinorUnitAmount(value) {
  if (value == null) return null
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value < 0) return null
    return String(value)
  }
  const raw = String(value).trim()
  if (!/^\d+$/.test(raw)) return null
  return raw.replace(/^0+(?=\d)/, '') || '0'
}

export function amountsEqualMinor(a, b) {
  const left = normalizeMinorUnitAmount(a)
  const right = normalizeMinorUnitAmount(b)
  return left != null && right != null && left === right
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
    ph_distinct_id: custom.ph_distinct_id ? String(custom.ph_distinct_id) : null,
    cta_location: custom.cta_location ? String(custom.cta_location) : null,
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

const NON_FULL_ITEM_TYPES = new Set(['partial', 'tax', 'proration'])

/**
 * Resolve launch business effect for a Paddle adjustment entity.
 * Does not restore access on reversals — operator must issue a fresh claim.
 *
 * For top-level `partial` adjustments, pass `coverage` from
 * `proveEffectiveFullRefundCoverage` after verifying Paddle transaction data.
 * Without proven coverage, access is retained and operator review is required.
 *
 * @param {{ action?: string, status?: string, type?: string }} data
 * @param {{ proven?: boolean, reason?: string } | null} [coverage]
 */
export function resolveAdjustmentEffect(data = {}, coverage = null) {
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
      needsCoverageCheck: false,
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
      needsCoverageCheck: false,
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
      needsCoverageCheck: false,
    }
  }

  if (action === 'refund' || action === 'credit') {
    if (status === 'pending_approval' || status === 'pending') {
      return {
        ok: true,
        effect: 'record_only',
        revoke: false,
        purchaseStatus: null,
        operatorReview: false,
        reason: 'pending_keep_access',
        needsCoverageCheck: false,
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
        needsCoverageCheck: false,
      }
    }
    if (status === 'approved') {
      if (type === 'full' || type === '') {
        return {
          ok: true,
          effect: 'refund',
          revoke: true,
          purchaseStatus: 'refunded',
          operatorReview: false,
          reason: action === 'credit' ? 'full_credit_approved' : 'full_refund_approved',
          needsCoverageCheck: false,
        }
      }
      if (type === 'partial') {
        if (coverage?.proven === true) {
          return {
            ok: true,
            effect: 'refund',
            revoke: true,
            purchaseStatus: 'refunded',
            operatorReview: false,
            reason: coverage.reason || 'effective_full_item_coverage',
            needsCoverageCheck: false,
          }
        }
        return {
          ok: true,
          effect: 'record_only',
          revoke: false,
          purchaseStatus: null,
          operatorReview: true,
          reason: coverage?.reason || 'partial_operator_review',
          needsCoverageCheck: coverage == null,
        }
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
    needsCoverageCheck: false,
  }
}

/**
 * Normalize adjustment payload fields from Paddle webhook / API data.
 * Preserves items + totals for effective-full coverage checks (integer strings).
 */
export function readAdjustmentPayload(data = {}) {
  const items = Array.isArray(data.items)
    ? data.items.map((item) => ({
        id: item?.id ? String(item.id) : null,
        itemId: item?.item_id ?? item?.itemId ?? null,
        type: item?.type ? String(item.type).toLowerCase() : null,
        amount: item?.amount != null ? String(item.amount) : null,
        totalsTotal:
          item?.totals?.total != null
            ? String(item.totals.total)
            : item?.totals?.grand_total != null
              ? String(item.totals.grand_total)
              : null,
      }))
    : []

  const totals = data.totals && typeof data.totals === 'object' ? data.totals : null
  return {
    adjustmentId: data.id ? String(data.id) : null,
    transactionId: data.transaction_id ?? data.transactionId ?? null,
    action: data.action ?? null,
    status: data.status ?? null,
    type: data.type ?? null,
    reason: data.reason ?? null,
    currencyCode: data.currency_code ?? data.currencyCode ?? totals?.currency_code ?? null,
    totalsTotal:
      totals?.total != null
        ? String(totals.total)
        : totals?.grand_total != null
          ? String(totals.grand_total)
          : null,
    items,
  }
}

/**
 * Extract original transaction line-item ids + grand total for coverage proofs.
 * Prefer details.line_items (canonical txnitm_ ids used by adjustments).
 */
export function readTransactionCoverageBasis(transaction = {}) {
  const lineItems = Array.isArray(transaction?.details?.line_items)
    ? transaction.details.line_items
    : []
  const ids = []
  for (const item of lineItems) {
    const id = item?.id ? String(item.id) : null
    if (!id) continue
    ids.push(id)
  }
  const totals = transaction?.details?.totals ?? transaction?.totals ?? null
  return {
    transactionId: transaction?.id ? String(transaction.id) : null,
    currencyCode:
      transaction?.currency_code ??
      transaction?.currencyCode ??
      totals?.currency_code ??
      null,
    grandTotal:
      totals?.grand_total != null
        ? String(totals.grand_total)
        : totals?.total != null
          ? String(totals.total)
          : null,
    lineItemIds: ids,
  }
}

/**
 * Prove a top-level partial adjustment is an effective full refund of the
 * original transaction. Fail closed unless every original line item is covered
 * by a type=full adjustment item and totals/currency match (integer minor units).
 *
 * @param {{ adjustment: ReturnType<typeof readAdjustmentPayload>, transaction: object }} args
 */
export function proveEffectiveFullRefundCoverage({ adjustment, transaction } = {}) {
  if (!adjustment || !transaction) {
    return { ok: false, proven: false, reason: 'missing_paddle_verification' }
  }

  const action = String(adjustment.action ?? '').toLowerCase()
  if (action !== 'refund' && action !== 'credit') {
    return { ok: false, proven: false, reason: 'partial_operator_review' }
  }
  if (String(adjustment.status ?? '').toLowerCase() !== 'approved') {
    return { ok: false, proven: false, reason: 'partial_operator_review' }
  }

  const basis = readTransactionCoverageBasis(transaction)
  if (!basis.lineItemIds.length) {
    return { ok: false, proven: false, reason: 'missing_paddle_verification' }
  }
  if (!basis.grandTotal || normalizeMinorUnitAmount(basis.grandTotal) == null) {
    return { ok: false, proven: false, reason: 'missing_paddle_verification' }
  }
  if (!adjustment.totalsTotal || normalizeMinorUnitAmount(adjustment.totalsTotal) == null) {
    return { ok: false, proven: false, reason: 'missing_paddle_verification' }
  }

  const adjCurrency = String(adjustment.currencyCode ?? '').toUpperCase()
  const txnCurrency = String(basis.currencyCode ?? '').toUpperCase()
  if (!adjCurrency || !txnCurrency || adjCurrency !== txnCurrency) {
    return { ok: false, proven: false, reason: 'currency_mismatch' }
  }

  if (!amountsEqualMinor(adjustment.totalsTotal, basis.grandTotal)) {
    return { ok: false, proven: false, reason: 'totals_mismatch' }
  }

  const items = Array.isArray(adjustment.items) ? adjustment.items : []
  if (!items.length) {
    return { ok: false, proven: false, reason: 'missing_paddle_verification' }
  }

  const covered = new Map()
  for (const item of items) {
    const itemType = String(item?.type ?? '').toLowerCase()
    if (!itemType || NON_FULL_ITEM_TYPES.has(itemType) || itemType !== 'full') {
      return { ok: false, proven: false, reason: 'non_full_item_type' }
    }
    const itemId = item?.itemId ? String(item.itemId) : null
    if (!itemId) {
      return { ok: false, proven: false, reason: 'missing_paddle_verification' }
    }
    if (covered.has(itemId)) {
      return { ok: false, proven: false, reason: 'duplicate_adjustment_item' }
    }
    covered.set(itemId, item)
  }

  for (const lineId of basis.lineItemIds) {
    if (!covered.has(lineId)) {
      return { ok: false, proven: false, reason: 'incomplete_item_coverage' }
    }
  }

  for (const itemId of covered.keys()) {
    if (!basis.lineItemIds.includes(itemId)) {
      return { ok: false, proven: false, reason: 'unknown_adjustment_item' }
    }
  }

  if (covered.size !== basis.lineItemIds.length) {
    return { ok: false, proven: false, reason: 'incomplete_item_coverage' }
  }

  return {
    ok: true,
    proven: true,
    reason: 'effective_full_item_coverage',
  }
}

export function catalogSkuOrNull(productId) {
  return LAUNCH_CATALOG_BY_ID[productId] ? productId : null
}

export { entitlementForCatalogSku, LAUNCH_CATALOG_PRODUCTS }
