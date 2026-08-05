/**
 * Purchase normalizers — provider payloads → CommerceEntitlement.
 * Does not call Paddle, webhooks, or Supabase.
 */

import {
  getCityIdForProduct,
  getSkuEntitlementShape,
  resolveInternalProductId,
} from './commerceCatalog.js'
import { createEntitlement } from './entitlementModel.js'
import { resolveProductForProvider } from './providerMappings.js'

/**
 * @param {object} purchase
 * @param {{ priceMap?: Record<string, string | { productId: string, contentProductId?: string, seatLimit?: number, kind?: string }>, subjectId?: string }} [options]
 * @returns {import('./entitlementModel.js').CommerceEntitlement | null}
 */
export function normalizePaddlePurchase(purchase, options = {}) {
  if (!purchase || typeof purchase !== 'object') return null

  const priceId =
    purchase.priceId ??
    purchase.price_id ??
    purchase.items?.[0]?.price?.id ??
    purchase.data?.items?.[0]?.price?.id ??
    null

  let productId =
    purchase.productId ??
    purchase.product_id ??
    resolveProductForProvider('paddle', priceId, { priceMap: options.priceMap }) ??
    resolveProductForProvider('paddle', purchase.sku ?? '', { priceMap: options.priceMap })

  if (!productId && priceId && options.priceMap?.[priceId]) {
    const mapped = options.priceMap[priceId]
    productId = typeof mapped === 'string' ? mapped : mapped.productId
  }

  productId = resolveInternalProductId(productId) ?? productId
  const sku = getSkuEntitlementShape(productId)
  if (!sku) return null

  const priceMapped =
    priceId && options.priceMap?.[priceId] && typeof options.priceMap[priceId] === 'object'
      ? options.priceMap[priceId]
      : null

  const statusRaw = purchase.status ?? purchase.purchase_status
  let status = 'active'
  if (statusRaw === 'refunded' || statusRaw === 'revoked' || statusRaw === 'disputed') {
    status = statusRaw === 'disputed' ? 'revoked' : statusRaw
  }

  const externalTransactionId =
    purchase.externalTransactionId ??
    purchase.transactionId ??
    purchase.transaction_id ??
    purchase.id ??
    null

  return createEntitlement({
    subjectId: options.subjectId ?? purchase.subjectId ?? purchase.customerId ?? 'anonymous',
    productId: sku.productId,
    contentProductId:
      priceMapped?.contentProductId ?? sku.contentProductId ?? sku.productId,
    cityId: getCityIdForProduct(sku.productId),
    source: 'paddle',
    externalTransactionId,
    status,
    grantedAt: purchase.grantedAt ?? purchase.createdAt ?? purchase.billed_at ?? undefined,
    revokedAt: status === 'active' ? null : purchase.revokedAt ?? purchase.refundedAt ?? undefined,
    seatLimit: priceMapped?.seatLimit ?? sku.seatLimit,
    kind: priceMapped?.kind ?? sku.kind,
    metadata: {
      priceId,
      provider: 'paddle',
      ...(purchase.metadata ?? {}),
    },
  })
}

/**
 * Normalize a legacy local / purchases-table shaped record.
 *
 * @param {object | string} purchase
 * @param {{ subjectId?: string }} [options]
 * @returns {import('./entitlementModel.js').CommerceEntitlement | null}
 */
export function normalizeLegacyPurchase(purchase, options = {}) {
  const row = typeof purchase === 'string' ? { productId: purchase } : purchase
  if (!row || typeof row !== 'object') return null

  const productId = resolveInternalProductId(row.productId ?? row.product_id)
  const sku = getSkuEntitlementShape(productId)
  if (!sku) return null

  const statusRaw = row.status ?? row.purchase_status
  let status = 'active'
  if (statusRaw === 'refunded' || statusRaw === 'revoked') status = statusRaw
  if (row.revokedAt || row.revoked_at) status = 'revoked'

  return createEntitlement({
    entitlementId: row.entitlementId ?? row.id ?? undefined,
    subjectId: options.subjectId ?? row.subjectId ?? row.userId ?? row.email ?? 'anonymous',
    productId: sku.productId,
    contentProductId: row.contentProductId ?? row.content_product_id ?? sku.contentProductId,
    cityId: getCityIdForProduct(sku.productId),
    source: row.source && row.source !== 'paddle' ? row.source : 'manual',
    externalTransactionId: row.externalTransactionId ?? row.paddle_transaction_id ?? row.id ?? null,
    status,
    grantedAt: row.grantedAt ?? row.created_at ?? undefined,
    revokedAt: row.revokedAt ?? row.revoked_at ?? undefined,
    seatLimit: row.seatLimit ?? row.seat_limit ?? sku.seatLimit,
    kind: row.kind ?? sku.kind,
    metadata: { ...(row.metadata ?? {}), legacy: true },
  })
}

/**
 * Normalize an access-token / device entitlement grant (accessSession shape).
 *
 * @param {object} grant
 * @param {{ subjectId?: string }} [options]
 * @returns {import('./entitlementModel.js').CommerceEntitlement | null}
 */
export function normalizeAccessTokenGrant(grant, options = {}) {
  if (!grant || typeof grant !== 'object') return null

  const purchased =
    grant.purchasedProductId ??
    grant.purchased_product_id ??
    grant.productId ??
    grant.product_id
  const productId = resolveInternalProductId(purchased)
  const sku = getSkuEntitlementShape(productId)
  if (!sku) return null

  const contentProductId =
    grant.contentProductId ??
    grant.content_product_id ??
    sku.contentProductId

  return createEntitlement({
    entitlementId: grant.entitlementId ?? grant.tokenId ?? undefined,
    subjectId:
      options.subjectId ??
      grant.subjectId ??
      grant.deviceId ??
      grant.email ??
      'anonymous',
    productId: sku.productId,
    contentProductId,
    cityId: getCityIdForProduct(sku.productId),
    source: 'legacy_access_token',
    externalTransactionId: grant.externalTransactionId ?? grant.claimId ?? null,
    status: grant.status === 'revoked' ? 'revoked' : 'active',
    grantedAt: grant.grantedAt ?? grant.validatedAt ?? undefined,
    revokedAt: grant.revokedAt ?? null,
    seatLimit: grant.seatLimit ?? grant.seat_limit ?? sku.seatLimit,
    kind: sku.kind,
    metadata: {
      role: grant.role ?? null,
      bundleStatus: grant.bundleStatus ?? grant.bundle_status ?? null,
      offlineLeaseExpiresAt:
        grant.offlineLeaseExpiresAt ?? grant.offline_lease_expires_at ?? null,
    },
  })
}
