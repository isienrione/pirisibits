/**
 * Provider ↔ internal product mappings.
 *
 * Paddle: launch catalog is authoritative for SKU matrix + env key names.
 * Actual pri_* values live in env / app_config — never duplicated here.
 *
 * Apple / OTA: disabled placeholders only.
 */

import {
  getCommerceProduct,
  getLaunchCatalogCurrency,
  getLaunchCatalogMetadataKey,
  listCommerceProducts,
  resolveInternalProductId,
} from './commerceCatalog.js'

export const COMMERCE_PROVIDERS = Object.freeze([
  'paddle',
  'apple',
  'viator',
  'getyourguide',
  'manual',
])

/**
 * @typedef {Object} ProviderMapping
 * @property {string} productId
 * @property {string} provider
 * @property {string | null} externalProductId
 * @property {string | null} [externalPriceId]
 * @property {string | null} [clientPriceEnvKey]
 * @property {string | null} [serverPriceEnvKey]
 * @property {string} environment
 * @property {boolean} enabled
 * @property {number} [amountCents]
 * @property {string} [currency]
 */

/**
 * @param {string} productId
 * @param {string} provider
 * @returns {ProviderMapping | null}
 */
export function getProviderMapping(productId, provider) {
  const resolved = resolveInternalProductId(productId)
  const row = resolved ? getCommerceProduct(resolved) : null
  if (!row) return null

  if (provider === 'paddle') {
    return {
      productId: row.productId,
      provider: 'paddle',
      // Paddle Product id (pro_*) is not in the launch catalog; prices are env-mapped.
      externalProductId: row.productId,
      externalPriceId: null,
      clientPriceEnvKey: row.clientEnvKey,
      serverPriceEnvKey: row.serverEnvKey,
      environment: 'env_configured',
      enabled: true,
      amountCents: row.amountCents,
      currency: getLaunchCatalogCurrency(),
      metadataKey: getLaunchCatalogMetadataKey(),
    }
  }

  if (provider === 'apple') {
    return {
      productId: row.productId,
      provider: 'apple',
      externalProductId: null,
      externalPriceId: null,
      environment: 'placeholder',
      enabled: false,
      amountCents: row.amountCents,
      currency: getLaunchCatalogCurrency(),
    }
  }

  if (provider === 'viator' || provider === 'getyourguide') {
    return {
      productId: row.productId,
      provider,
      externalProductId: null,
      externalPriceId: null,
      environment: 'placeholder',
      enabled: false,
    }
  }

  if (provider === 'manual') {
    return {
      productId: row.productId,
      provider: 'manual',
      externalProductId: row.productId,
      externalPriceId: null,
      environment: 'internal',
      enabled: true,
    }
  }

  return null
}

/**
 * Resolve an external provider id to an internal productId.
 *
 * For Paddle:
 * - externalId may be the chronowalk SKU (productId)
 * - or a pri_* price id when `priceMap` is supplied (server-style)
 *
 * @param {string} provider
 * @param {string} externalId
 * @param {{ priceMap?: Record<string, string | { productId: string }> }} [options]
 * @returns {string | null}
 */
export function resolveProductForProvider(provider, externalId, options = {}) {
  if (!provider || !externalId) return null

  if (provider === 'paddle') {
    const asSku = resolveInternalProductId(externalId)
    if (asSku) return asSku

    const mapped = options.priceMap?.[externalId]
    if (typeof mapped === 'string') return resolveInternalProductId(mapped) ?? mapped
    if (mapped?.productId) {
      return resolveInternalProductId(mapped.productId) ?? mapped.productId
    }
    return null
  }

  if (provider === 'apple' || provider === 'viator' || provider === 'getyourguide') {
    // Placeholders — no runtime resolution until StoreKit / OTA integrations ship.
    return null
  }

  if (provider === 'manual') {
    return resolveInternalProductId(externalId)
  }

  return null
}

/**
 * All enabled provider mappings for the launch catalog (Paddle + manual).
 * Apple/OTA placeholders are omitted from the enabled list.
 *
 * @returns {ProviderMapping[]}
 */
export function listEnabledProviderMappings() {
  /** @type {ProviderMapping[]} */
  const out = []
  for (const product of listCommerceProducts()) {
    const paddle = getProviderMapping(product.productId, 'paddle')
    if (paddle?.enabled) out.push(paddle)
  }
  return out
}

/**
 * Future Apple mapping stub — disabled, not used at runtime.
 *
 * @param {string} productId
 * @param {string} appleProductId
 * @returns {ProviderMapping}
 */
export function createDisabledAppleMapping(productId, appleProductId) {
  const resolved = resolveInternalProductId(productId) ?? productId
  return {
    productId: resolved,
    provider: 'apple',
    externalProductId: appleProductId,
    externalPriceId: null,
    environment: 'placeholder',
    enabled: false,
  }
}
