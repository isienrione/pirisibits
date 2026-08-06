/**
 * StoreKit purchase adapter via @capgo/native-purchases (StoreKit 2).
 *
 * Plugin is loaded lazily so the web bundle never initializes billing.
 * Injectable `nativePurchases` supports Vitest without Xcode.
 */

import {
  getStoreKitMapping,
  listApplePurchasableMappings,
  isApplePurchaseDeferred,
  isStoreKitMappingEnabled,
  APPLE_PRODUCT_IDS,
} from './storeKitProductMappings.js'
import { normalizeAppleTransaction, isLocalAppleCandidate } from './transactionNormalizer.js'
import { processRestoredTransactions } from './restorePurchases.js'
import { canUseStoreKitPurchase } from '../platform/runtime/index.js'

export const STOREKIT_PLUGIN_ID = '@capgo/native-purchases'

/**
 * @typedef {Object} NativePurchasesBridge
 * @property {() => Promise<{ isBillingSupported: boolean } | boolean>} [isBillingSupported]
 * @property {(opts: { productIdentifiers: string[] }) => Promise<{ products?: object[] } | object[]>} [getProducts]
 * @property {(opts: object) => Promise<object>} [purchaseProduct]
 * @property {() => Promise<object[] | { purchases?: object[] }>} [restorePurchases]
 * @property {() => Promise<object[] | { purchases?: object[] }>} [getPurchases]
 */

/**
 * @param {object} [options]
 * @param {NativePurchasesBridge} [options.nativePurchases]
 * @param {() => boolean} [options.canUseStoreKit]
 * @param {boolean} [options.treatMappingsEnabled] Test override to enable disabled mappings
 */
export function createStoreKitPurchaseAdapter(options = {}) {
  const canUse =
    options.canUseStoreKit ?? (() => canUseStoreKitPurchase())
  /** @type {Promise<NativePurchasesBridge> | null} */
  let pluginPromise = null

  async function getPlugin() {
    if (options.nativePurchases) return options.nativePurchases
    if (!pluginPromise) {
      pluginPromise = import('@capgo/native-purchases')
        .then((mod) => mod.NativePurchases || mod.default || mod)
        .catch((err) => {
          const error = new Error('StoreKit plugin unavailable')
          error.code = 'storekit_plugin_missing'
          error.cause = err
          throw error
        })
    }
    return pluginPromise
  }

  function mappingEnabled(mapping) {
    if (!mapping) return false
    if (options.treatMappingsEnabled) {
      return !isApplePurchaseDeferred(mapping.productId)
    }
    return isStoreKitMappingEnabled(mapping)
  }

  return {
    kind: /** @type {const} */ ('storekit'),
    provider: /** @type {const} */ ('apple'),
    pluginId: STOREKIT_PLUGIN_ID,
    usesStoreKit2: true,

    async isAvailable() {
      if (!canUse()) return false
      try {
        const plugin = await getPlugin()
        if (typeof plugin.isBillingSupported === 'function') {
          const status = await plugin.isBillingSupported()
          if (typeof status === 'boolean') return status
          return Boolean(status?.isBillingSupported ?? status?.supported)
        }
        return true
      } catch {
        return false
      }
    },

    /**
     * @param {string[]} [productIds] Internal product ids
     */
    async getAvailableProducts(productIds) {
      if (!canUse()) {
        return { ok: false, code: 'storekit_unavailable', products: [] }
      }

      const mappings = listApplePurchasableMappings({ includeDisabled: true }).filter((m) => {
        if (productIds?.length) return productIds.includes(m.productId)
        return true
      })

      let pluginProducts = []
      try {
        const plugin = await getPlugin()
        if (typeof plugin.getProducts === 'function') {
          const appleIds = mappings.map((m) => m.appleProductId)
          const result = await plugin.getProducts({ productIdentifiers: appleIds })
          pluginProducts = Array.isArray(result) ? result : result?.products ?? []
        }
      } catch (err) {
        return {
          ok: false,
          code: err?.code || 'storekit_capability_missing',
          products: [],
          message: err?.message || 'StoreKit products unavailable',
        }
      }

      const byAppleId = new Map(
        pluginProducts.map((p) => [p.productIdentifier || p.identifier || p.productId, p]),
      )

      const products = mappings.map((mapping) => {
        const store = byAppleId.get(mapping.appleProductId)
        return {
          productId: mapping.productId,
          appleProductId: mapping.appleProductId,
          contentProductId: mapping.contentProductId,
          provider: 'apple',
          enabled: mappingEnabled(mapping),
          // Localized price MUST come from StoreKit when present — never replace with hard-coded catalog cents.
          localizedPriceString: store?.priceString || store?.localizedPrice || null,
          currencyCode: store?.currencyCode || null,
          title: store?.title || mapping.displayName || mapping.productId,
          priceSource: store ? 'storekit' : 'unavailable',
          amountCents: null,
        }
      })

      return { ok: true, products }
    },

    async purchaseProduct(productId, purchaseOptions = {}) {
      if (!canUse()) {
        return {
          ok: false,
          code: 'storekit_unavailable',
          provider: 'apple',
          serverVerified: false,
        }
      }

      if (isApplePurchaseDeferred(productId)) {
        return {
          ok: false,
          code: 'apple_product_deferred',
          provider: 'apple',
          serverVerified: false,
          message: getStoreKitMapping(productId)?.deferredReason || 'Deferred on Apple',
        }
      }

      const mapping = getStoreKitMapping(productId)
      if (!mapping || !APPLE_PRODUCT_IDS[productId]) {
        return {
          ok: false,
          code: 'unknown_product',
          provider: 'apple',
          serverVerified: false,
        }
      }

      if (!mappingEnabled(mapping)) {
        return {
          ok: false,
          code: 'apple_product_disabled',
          provider: 'apple',
          serverVerified: false,
          message:
            'Apple product mapping is disabled until App Store Connect products and Xcode StoreKit testing are configured.',
        }
      }

      try {
        const plugin = await getPlugin()
        if (typeof plugin.purchaseProduct !== 'function') {
          const err = new Error('StoreKit purchaseProduct missing')
          err.code = 'storekit_capability_missing'
          throw err
        }

        const raw = await plugin.purchaseProduct({
          productIdentifier: mapping.appleProductId,
          appAccountToken: purchaseOptions.appAccountToken,
        })

        const entitlement = normalizeAppleTransaction(
          {
            ...raw,
            productId: mapping.appleProductId,
            transactionId: raw?.transactionId || raw?.transactionIdentifier,
            originalTransactionId: raw?.originalTransactionId,
            jwsRepresentation: raw?.jwsRepresentation,
            appAccountToken: purchaseOptions.appAccountToken,
            purchaseDate: raw?.purchaseDate || raw?.transactionDate,
          },
          { subjectId: purchaseOptions.subjectId },
        )

        return {
          ok: Boolean(entitlement),
          code: entitlement ? null : 'normalize_failed',
          provider: 'apple',
          entitlement,
          // Explicit: local StoreKit success ≠ server-verified permanent access.
          serverVerified: false,
          localCandidate: entitlement ? isLocalAppleCandidate(entitlement) : false,
        }
      } catch (err) {
        return {
          ok: false,
          code: err?.code || 'storekit_purchase_failed',
          provider: 'apple',
          serverVerified: false,
          message: err?.message || 'StoreKit purchase failed',
        }
      }
    },

    async restorePurchases(restoreOptions = {}) {
      if (!canUse()) {
        return {
          ok: false,
          code: 'storekit_unavailable',
          provider: 'apple',
          entitlements: [],
          serverVerified: false,
        }
      }

      try {
        const plugin = await getPlugin()
        let raw = []
        if (typeof plugin.restorePurchases === 'function') {
          const result = await plugin.restorePurchases()
          raw = Array.isArray(result) ? result : result?.purchases || result?.transactions || []
        } else if (typeof plugin.getPurchases === 'function') {
          const result = await plugin.getPurchases()
          raw = Array.isArray(result) ? result : result?.purchases || []
        } else {
          const err = new Error('StoreKit restore unavailable')
          err.code = 'storekit_capability_missing'
          throw err
        }

        const processed = processRestoredTransactions(raw, {
          subjectId: restoreOptions.subjectId,
          updateLocalView: restoreOptions.updateLocalView === true,
        })

        return {
          ok: true,
          provider: 'apple',
          ...processed,
          serverVerified: false,
        }
      } catch (err) {
        return {
          ok: false,
          code: err?.code || 'storekit_restore_failed',
          provider: 'apple',
          entitlements: [],
          serverVerified: false,
          message: err?.message || 'Restore failed',
        }
      }
    },

    async refreshEntitlements(refreshOptions = {}) {
      return this.restorePurchases({ ...refreshOptions, updateLocalView: true })
    },
  }
}
