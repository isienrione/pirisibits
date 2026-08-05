/**
 * Generic entitlement model and status helpers.
 * Provider-neutral — Paddle/Apple/OTAs normalize into this shape.
 */

/** @typedef {'paddle' | 'apple' | 'viator' | 'getyourguide' | 'manual' | 'legacy_access_token'} EntitlementSource */

/** @typedef {'active' | 'revoked' | 'refunded' | 'pending' | 'inactive'} EntitlementStatus */

export const ENTITLEMENT_SOURCES = Object.freeze([
  'paddle',
  'apple',
  'viator',
  'getyourguide',
  'manual',
  'legacy_access_token',
])

export const ENTITLEMENT_STATUSES = Object.freeze([
  'active',
  'revoked',
  'refunded',
  'pending',
  'inactive',
])

/**
 * @typedef {Object} CommerceEntitlement
 * @property {string} entitlementId
 * @property {string} subjectId
 * @property {string} productId Purchased SKU (e.g. rome-couple) — never collapsed to content id.
 * @property {string} [contentProductId] Content unlocked (e.g. rome-complete for bundles).
 * @property {string} [cityId]
 * @property {EntitlementSource} source
 * @property {string} [externalTransactionId]
 * @property {EntitlementStatus} status
 * @property {string} [grantedAt] ISO-8601
 * @property {string} [revokedAt] ISO-8601
 * @property {number} [seatLimit]
 * @property {string} [kind] solo | bundle
 * @property {Record<string, unknown>} [metadata]
 */

let entitlementSeq = 0

/**
 * @param {Partial<CommerceEntitlement> & { productId: string, source: string, subjectId?: string }} input
 * @returns {CommerceEntitlement}
 */
export function createEntitlement(input) {
  entitlementSeq += 1
  const status = input.status ?? (input.revokedAt ? 'revoked' : 'active')
  return {
    entitlementId: input.entitlementId ?? `ent_${input.source}_${entitlementSeq}`,
    subjectId: input.subjectId ?? 'anonymous',
    productId: input.productId,
    contentProductId: input.contentProductId ?? input.productId,
    cityId: input.cityId ?? null,
    source: /** @type {EntitlementSource} */ (input.source),
    externalTransactionId: input.externalTransactionId ?? null,
    status,
    grantedAt: input.grantedAt ?? new Date().toISOString(),
    revokedAt: input.revokedAt ?? null,
    seatLimit: input.seatLimit ?? 1,
    kind: input.kind ?? null,
    metadata: input.metadata ?? {},
  }
}

/**
 * Active entitlements grant access. Revoked / refunded / inactive do not.
 * Source channel does not change this rule.
 *
 * @param {CommerceEntitlement | null | undefined} entitlement
 * @returns {boolean}
 */
export function isEntitlementActive(entitlement) {
  if (!entitlement || typeof entitlement !== 'object') return false
  if (!entitlement.productId) return false
  if (entitlement.revokedAt) return false
  if (entitlement.status === 'revoked' || entitlement.status === 'refunded') return false
  if (entitlement.status === 'inactive' || entitlement.status === 'pending') return false
  if (entitlement.status && entitlement.status !== 'active') return false
  return true
}

/**
 * Deterministic identity for dedupe: prefer external transaction when present.
 *
 * @param {CommerceEntitlement} entitlement
 * @returns {string}
 */
export function entitlementDedupeKey(entitlement) {
  if (entitlement.externalTransactionId) {
    return `${entitlement.source}::txn::${entitlement.externalTransactionId}`
  }
  return `${entitlement.source}::id::${entitlement.entitlementId}`
}

/**
 * Prefer active over inactive; then later grantedAt; then stable entitlementId.
 *
 * @param {CommerceEntitlement} a
 * @param {CommerceEntitlement} b
 * @returns {CommerceEntitlement}
 */
export function preferEntitlement(a, b) {
  const aActive = isEntitlementActive(a)
  const bActive = isEntitlementActive(b)
  if (aActive !== bActive) return bActive ? b : a
  const aGranted = a.grantedAt ?? ''
  const bGranted = b.grantedAt ?? ''
  if (aGranted !== bGranted) return bGranted > aGranted ? b : a
  return a.entitlementId <= b.entitlementId ? a : b
}

/**
 * @param {CommerceEntitlement[]} entitlements
 * @returns {CommerceEntitlement[]}
 */
export function dedupeEntitlements(entitlements) {
  /** @type {Map<string, CommerceEntitlement>} */
  const map = new Map()
  for (const entitlement of entitlements ?? []) {
    if (!entitlement?.productId) continue
    const key = entitlementDedupeKey(entitlement)
    const existing = map.get(key)
    map.set(key, existing ? preferEntitlement(existing, entitlement) : entitlement)
  }
  return [...map.values()]
}

/**
 * Guard: domain contracts must not grow Rome-only booleans.
 *
 * @param {object} entitlement
 * @returns {boolean}
 */
export function hasForbiddenRomeAccessField(entitlement) {
  if (!entitlement || typeof entitlement !== 'object') return false
  return (
    Object.prototype.hasOwnProperty.call(entitlement, 'hasRomeAccess') ||
    Object.prototype.hasOwnProperty.call(entitlement, 'romeOnly') ||
    Object.prototype.hasOwnProperty.call(entitlement, 'romeAccess')
  )
}
