/**
 * Shared PurchaseService — selects Paddle (web) or StoreKit (native iOS).
 *
 * Production screens are not fully migrated in this PR; callers may adopt
 * this facade incrementally. openCheckout remains the live web path and is
 * guarded against native Paddle use.
 */

import { resolvePurchaseProvider, canInvokePaddleCheckout } from './purchaseProvider.js'
import { createWebPurchaseAdapter } from './webPurchaseAdapter.js'
import { createStoreKitPurchaseAdapter } from './storeKitPurchaseAdapter.js'
import {
  getStoreKitMapping,
  isApplePurchaseDeferred,
  isStoreKitMappingEnabled,
  listApplePurchasableMappings,
} from './storeKitProductMappings.js'
import { normalizeAppleTransaction } from './transactionNormalizer.js'
import { verifyAppleTransaction } from './serverVerification.js'
import { getSkuEntitlementShape } from '../commerce/commerceCatalog.js'

/**
 * @param {object} [options]
 */
export function createPurchaseService(options = {}) {
  const resolved =
    options.providerOverride != null
      ? {
          provider: options.providerOverride,
          reason: 'override',
          canUsePaddle: options.providerOverride === 'paddle',
          canUseStoreKit: options.providerOverride === 'storekit',
        }
      : resolvePurchaseProvider()

  const webAdapter = options.webAdapter ?? createWebPurchaseAdapter(options.webAdapterOptions)
  const storeKitAdapter =
    options.storeKitAdapter ?? createStoreKitPurchaseAdapter(options.storeKitAdapterOptions)

  function adapterFor(provider = resolved.provider) {
    if (provider === 'paddle') return webAdapter
    if (provider === 'storekit') return storeKitAdapter
    return null
  }

  return {
    getPurchaseProvider() {
      return resolvePurchaseProvider()
    },

    /**
     * @param {string} productId
     */
    canPurchaseProduct(productId) {
      const provider = resolvePurchaseProvider()
      if (!productId || !getSkuEntitlementShape(productId)) {
        return { ok: false, code: 'unknown_product', provider: provider.provider }
      }

      if (provider.provider === 'paddle') {
        return {
          ok: provider.canUsePaddle,
          code: provider.canUsePaddle ? null : 'paddle_unavailable',
          provider: 'paddle',
        }
      }

      if (provider.provider === 'storekit') {
        if (isApplePurchaseDeferred(productId)) {
          return { ok: false, code: 'apple_product_deferred', provider: 'storekit' }
        }
        const mapping = getStoreKitMapping(productId)
        if (!mapping) {
          return { ok: false, code: 'no_apple_mapping', provider: 'storekit' }
        }
        if (!provider.canUseStoreKit) {
          return { ok: false, code: 'storekit_unavailable', provider: 'storekit' }
        }
        if (
          !isStoreKitMappingEnabled(mapping) &&
          !options.storeKitAdapterOptions?.treatMappingsEnabled
        ) {
          return { ok: false, code: 'apple_product_disabled', provider: 'storekit' }
        }
        return { ok: true, code: null, provider: 'storekit', appleProductId: mapping.appleProductId }
      }

      return { ok: false, code: 'unsupported_platform', provider: 'none' }
    },

    async getAvailableProducts(productIds) {
      const provider = resolvePurchaseProvider()
      const adapter = adapterFor(provider.provider)
      if (!adapter) {
        return { ok: false, code: 'unsupported_platform', products: [] }
      }
      return adapter.getAvailableProducts(productIds)
    },

    async purchaseProduct(productId, purchaseOptions = {}) {
      const provider = resolvePurchaseProvider()
      if (provider.provider === 'storekit' && canInvokePaddleCheckout()) {
        // Defensive: should never happen given capability matrix.
        return { ok: false, code: 'invariant_paddle_on_native', serverVerified: false }
      }
      if (provider.provider === 'none') {
        return { ok: false, code: 'unsupported_platform', serverVerified: false }
      }
      const gate = this.canPurchaseProduct(productId)
      if (!gate.ok && provider.provider === 'storekit') {
        return { ...gate, serverVerified: false }
      }
      const adapter = adapterFor(provider.provider)
      return adapter.purchaseProduct(productId, purchaseOptions)
    },

    async restorePurchases(restoreOptions = {}) {
      const provider = resolvePurchaseProvider()
      const adapter = adapterFor(provider.provider)
      if (!adapter) {
        return {
          ok: false,
          code: 'unsupported_platform',
          entitlements: [],
          serverVerified: false,
        }
      }
      return adapter.restorePurchases(restoreOptions)
    },

    async refreshEntitlements(refreshOptions = {}) {
      const provider = resolvePurchaseProvider()
      const adapter = adapterFor(provider.provider)
      if (!adapter) {
        return { ok: false, code: 'unsupported_platform', entitlements: [], serverVerified: false }
      }
      return adapter.refreshEntitlements(refreshOptions)
    },

    normalizeAppleTransaction,
    verifyPurchaseResult(result) {
      if (!result || typeof result !== 'object') {
        return { ok: false, serverVerified: false, code: 'invalid_result' }
      }
      return {
        ok: Boolean(result.ok),
        serverVerified: result.serverVerified === true,
        localCandidate: result.localCandidate === true || result.serverVerified === false,
        code: result.code ?? null,
        entitlement: result.entitlement ?? null,
      }
    },
    verifyAppleTransaction,
    listApplePurchasableMappings,
    canInvokePaddleCheckout,
  }
}

let defaultService = null

export function getPurchaseService() {
  if (!defaultService) defaultService = createPurchaseService()
  return defaultService
}

/** @internal */
export function __resetPurchaseServiceForTests() {
  defaultService = null
}
