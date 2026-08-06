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
import { getPlatformName } from '../platform/runtime/index.js'

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
      const platform = getPlatformName()
      console.info('[CW TRACE] purchaseService.canPurchaseProduct', {
        productId,
        provider: provider.provider,
        platform,
        reason: provider.reason,
      })

      if (!productId || !getSkuEntitlementShape(productId)) {
        const gate = { ok: false, code: 'unknown_product', provider: provider.provider }
        console.info('[CW TRACE] purchaseService.canPurchaseProduct early return', gate)
        return gate
      }

      if (provider.provider === 'paddle') {
        const gate = {
          ok: provider.canUsePaddle,
          code: provider.canUsePaddle ? null : 'paddle_unavailable',
          provider: 'paddle',
        }
        console.info('[CW TRACE] purchaseService.canPurchaseProduct final gate', gate)
        return gate
      }

      if (provider.provider === 'storekit') {
        if (isApplePurchaseDeferred(productId)) {
          const gate = { ok: false, code: 'apple_product_deferred', provider: 'storekit' }
          console.info('[CW TRACE] purchaseService.canPurchaseProduct early return', gate)
          return gate
        }
        const mapping = getStoreKitMapping(productId)
        if (!mapping) {
          const gate = { ok: false, code: 'no_apple_mapping', provider: 'storekit' }
          console.info('[CW TRACE] purchaseService.canPurchaseProduct early return', gate)
          return gate
        }
        if (!provider.canUseStoreKit) {
          const gate = { ok: false, code: 'storekit_unavailable', provider: 'storekit' }
          console.info('[CW TRACE] purchaseService.canPurchaseProduct early return', gate)
          return gate
        }
        if (
          !isStoreKitMappingEnabled(mapping) &&
          !options.storeKitAdapterOptions?.treatMappingsEnabled
        ) {
          const gate = { ok: false, code: 'apple_product_disabled', provider: 'storekit' }
          console.info('[CW TRACE] purchaseService.canPurchaseProduct early return', gate)
          return gate
        }
        const gate = {
          ok: true,
          code: null,
          provider: 'storekit',
          appleProductId: mapping.appleProductId,
        }
        console.info('[CW TRACE] purchaseService.canPurchaseProduct final gate', {
          ok: gate.ok,
          code: gate.code,
          provider: gate.provider,
          appleProductId: gate.appleProductId,
        })
        return gate
      }

      const gate = { ok: false, code: 'unsupported_platform', provider: 'none' }
      console.info('[CW TRACE] purchaseService.canPurchaseProduct early return', gate)
      return gate
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
      console.info('[CW TRACE] purchaseService.purchaseProduct entered', {
        productId,
        provider: provider.provider,
        platform: getPlatformName(),
      })

      if (provider.provider === 'storekit' && canInvokePaddleCheckout()) {
        // Defensive: should never happen given capability matrix.
        const early = { ok: false, code: 'invariant_paddle_on_native', serverVerified: false }
        console.info('[CW TRACE] purchaseService.purchaseProduct early return', early)
        return early
      }
      if (provider.provider === 'none') {
        const early = { ok: false, code: 'unsupported_platform', serverVerified: false }
        console.info('[CW TRACE] purchaseService.purchaseProduct early return', early)
        return early
      }
      const gate = this.canPurchaseProduct(productId)
      console.info('[CW TRACE] purchaseService.purchaseProduct gate result', {
        productId,
        ok: gate?.ok,
        code: gate?.code ?? null,
        provider: gate?.provider ?? null,
      })
      if (!gate.ok && provider.provider === 'storekit') {
        const early = { ...gate, serverVerified: false }
        console.info('[CW TRACE] purchaseService.purchaseProduct early return', {
          ok: early.ok,
          code: early.code,
          provider: early.provider,
        })
        return early
      }
      const adapter = adapterFor(provider.provider)
      try {
        console.info('[CW TRACE] purchaseService before adapter.purchaseProduct', {
          productId,
          provider: provider.provider,
        })
        const result = await adapter.purchaseProduct(productId, purchaseOptions)
        console.info('[CW TRACE] purchaseService after adapter.purchaseProduct', {
          productId,
          ok: result?.ok,
          code: result?.code ?? null,
        })
        return result
      } catch (err) {
        console.error('[CW TRACE] purchaseService adapter.purchaseProduct caught', {
          productId,
          code: err?.code ?? null,
        })
        throw err
      }
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
