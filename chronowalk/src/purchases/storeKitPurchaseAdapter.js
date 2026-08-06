/**
 * StoreKit purchase adapter via @capgo/native-purchases (StoreKit 2).
 *
 * Lazy-loads NativePurchases + PURCHASE_TYPE together. Non-consumable Rome
 * products always use PURCHASE_TYPE.INAPP and quantity: 1 per Capgo docs.
 * Plugin is not initialized on web (gated by canUseStoreKit).
 */

import {
  getStoreKitMapping,
  listApplePurchasableMappings,
  isApplePurchaseDeferred,
  isStoreKitMappingEnabled,
  isStoreKitLocalMode,
  APPLE_PRODUCT_IDS,
} from './storeKitProductMappings.js'
import { normalizeAppleTransaction, isLocalAppleCandidate } from './transactionNormalizer.js'
import { processRestoredTransactions } from './restorePurchases.js'
import { canUseStoreKitPurchase } from '../platform/runtime/index.js'

export const STOREKIT_PLUGIN_ID = '@capgo/native-purchases'
export const STOREKIT_REQUEST_TIMEOUT_MS = 20_000

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * @param {unknown} token
 * @returns {string | undefined}
 */
function sanitizeAppAccountToken(token) {
  if (typeof token !== 'string') return undefined
  const trimmed = token.trim()
  if (!trimmed || !UUID_RE.test(trimmed)) return undefined
  return trimmed
}

/**
 * @param {string} message
 * @param {Record<string, unknown>} [details]
 */
function logStoreKitLocal(message, details) {
  if (!isStoreKitLocalMode()) return
  if (details && Object.keys(details).length > 0) {
    console.info(`[StoreKit local] ${message}`, details)
  } else {
    console.info(`[StoreKit local] ${message}`)
  }
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {{ timeoutMs?: number, label?: string }} [options]
 * @returns {Promise<T>}
 */
async function withStoreKitTimeout(promise, options = {}) {
  const timeoutMs = options.timeoutMs ?? STOREKIT_REQUEST_TIMEOUT_MS
  let timer
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const err = new Error(
            options.label
              ? `StoreKit ${options.label} timed out after ${timeoutMs}ms`
              : `StoreKit request timed out after ${timeoutMs}ms`,
          )
          err.code = 'storekit_request_timeout'
          reject(err)
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * @param {unknown} err
 * @returns {string}
 */
function classifyStoreKitPurchaseError(err) {
  const code = String(err?.code ?? '').toLowerCase()
  const message = String(err?.message ?? '').toLowerCase()
  if (code === 'storekit_request_timeout' || message.includes('timed out')) {
    return 'storekit_request_timeout'
  }
  if (
    code === 'product_not_returned' ||
    message.includes('product not found') ||
    message.includes('cannot find product')
  ) {
    return 'product_not_returned'
  }
  if (
    code.includes('cancel') ||
    message.includes('cancel') ||
    code === 'user_cancelled' ||
    code === 'purchase_cancelled'
  ) {
    return 'purchase_cancelled'
  }
  if (
    code === 'storekit_plugin_missing' ||
    code === 'storekit_capability_missing' ||
    code === 'storekit_unavailable'
  ) {
    return code
  }
  return 'storekit_purchase_failed'
}

/**
 * @param {object} [options]
 * @param {object} [options.nativePurchases]
 * @param {{ INAPP: string, SUBS?: string }} [options.purchaseType]
 * @param {() => Promise<object>} [options.loadPlugin]
 * @param {() => boolean} [options.canUseStoreKit]
 * @param {boolean} [options.treatMappingsEnabled]
 * @param {number} [options.requestTimeoutMs]
 */
export function createStoreKitPurchaseAdapter(options = {}) {
  const canUse =
    options.canUseStoreKit ?? (() => canUseStoreKitPurchase())
  const timeoutMs = options.requestTimeoutMs ?? STOREKIT_REQUEST_TIMEOUT_MS

  /** @type {Promise<{ NativePurchases: object, PURCHASE_TYPE: { INAPP: string, SUBS?: string } }> | null} */
  let pluginModulePromise = null

  /**
   * Lazy-load both NativePurchases and PURCHASE_TYPE from @capgo/native-purchases.
   * Never called on web because callers gate on canUse() first.
   */
  async function loadPluginModule() {
    if (pluginModulePromise) return pluginModulePromise

    pluginModulePromise = (async () => {
      if (options.nativePurchases) {
        return {
          NativePurchases: options.nativePurchases,
          PURCHASE_TYPE: options.purchaseType ?? { INAPP: 'inapp', SUBS: 'subs' },
        }
      }

      const load = options.loadPlugin ?? (() => import('@capgo/native-purchases'))
      try {
        const mod = await load()
        const NativePurchases =
          mod.NativePurchases || mod.default?.NativePurchases || mod.default
        const PURCHASE_TYPE = mod.PURCHASE_TYPE || mod.default?.PURCHASE_TYPE

        if (!NativePurchases || typeof NativePurchases !== 'object') {
          const error = new Error('StoreKit plugin unavailable')
          error.code = 'storekit_plugin_missing'
          throw error
        }
        if (!PURCHASE_TYPE || PURCHASE_TYPE.INAPP == null) {
          const error = new Error('StoreKit PURCHASE_TYPE unavailable')
          error.code = 'storekit_plugin_missing'
          throw error
        }

        return { NativePurchases, PURCHASE_TYPE }
      } catch (err) {
        if (err?.code === 'storekit_plugin_missing') throw err
        const error = new Error('StoreKit plugin unavailable')
        error.code = 'storekit_plugin_missing'
        error.cause = err
        throw error
      }
    })()

    return pluginModulePromise
  }

  function mappingEnabled(mapping) {
    if (!mapping) return false
    if (options.treatMappingsEnabled) {
      return !isApplePurchaseDeferred(mapping.productId)
    }
    return isStoreKitMappingEnabled(mapping)
  }

  if (isStoreKitLocalMode()) {
    logStoreKitLocal('StoreKit local mode active')
  }

  return {
    kind: /** @type {const} */ ('storekit'),
    provider: /** @type {const} */ ('apple'),
    pluginId: STOREKIT_PLUGIN_ID,
    usesStoreKit2: true,

    async isAvailable() {
      if (!canUse()) return false
      try {
        const { NativePurchases } = await loadPluginModule()
        if (typeof NativePurchases.isBillingSupported === 'function') {
          const status = await NativePurchases.isBillingSupported()
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
      console.info('[CW TRACE] storeKitAdapter.getAvailableProducts entered', {
        productIds: productIds ?? null,
      })
      if (!canUse()) {
        console.info('[CW TRACE] storeKitAdapter.getAvailableProducts early return', {
          code: 'storekit_unavailable',
        })
        return { ok: false, code: 'storekit_unavailable', products: [] }
      }

      const mappings = listApplePurchasableMappings({ includeDisabled: true }).filter((m) => {
        if (productIds?.length) return productIds.includes(m.productId)
        return true
      })

      let pluginProducts = []
      try {
        const { NativePurchases, PURCHASE_TYPE } = await loadPluginModule()
        console.info('[CW TRACE] storeKitAdapter.getAvailableProducts plugin loaded', {
          purchaseTypeInapp: PURCHASE_TYPE?.INAPP ?? null,
        })
        if (typeof NativePurchases.getProducts === 'function') {
          const appleIds = mappings.map((m) => m.appleProductId)
          console.info('[CW TRACE] storeKitAdapter.getAvailableProducts requested Apple IDs', {
            appleIds,
            productType: PURCHASE_TYPE.INAPP,
          })
          logStoreKitLocal('requested Apple product IDs', {
            appleIds,
            productType: PURCHASE_TYPE.INAPP,
          })

          // Documented Capgo StoreKit 2 API for one-time (non-consumable) products.
          const result = await withStoreKitTimeout(
            NativePurchases.getProducts({
              productIdentifiers: appleIds,
              productType: PURCHASE_TYPE.INAPP,
            }),
            { timeoutMs, label: 'getProducts' },
          )

          pluginProducts = Array.isArray(result) ? result : result?.products ?? []
          console.info('[CW TRACE] storeKitAdapter.getAvailableProducts products returned', {
            count: pluginProducts.length,
          })
          logStoreKitLocal('number of products returned', { count: pluginProducts.length })
        }
      } catch (err) {
        const code = classifyStoreKitPurchaseError(err)
        console.error('[CW TRACE] storeKitAdapter.getAvailableProducts caught', { code })
        logStoreKitLocal('controlled error code', { code, phase: 'getProducts' })
        return {
          ok: false,
          code:
            code === 'storekit_purchase_failed'
              ? err?.code || 'storekit_capability_missing'
              : code,
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
      console.info('[CW TRACE] storeKitAdapter.purchaseProduct entered', { productId })
      const canUseResult = canUse()
      console.info('[CW TRACE] storeKitAdapter.purchaseProduct canUse', {
        productId,
        canUse: canUseResult,
      })
      if (!canUseResult) {
        return {
          ok: false,
          code: 'storekit_unavailable',
          provider: 'apple',
          serverVerified: false,
        }
      }

      if (isApplePurchaseDeferred(productId)) {
        console.info('[CW TRACE] storeKitAdapter.purchaseProduct early return', {
          code: 'apple_product_deferred',
          productId,
        })
        return {
          ok: false,
          code: 'apple_product_deferred',
          provider: 'apple',
          serverVerified: false,
          message: getStoreKitMapping(productId)?.deferredReason || 'Deferred on Apple',
        }
      }

      const mapping = getStoreKitMapping(productId)
      console.info('[CW TRACE] storeKitAdapter.purchaseProduct mapping found', {
        productId,
        found: Boolean(mapping),
        appleProductId: mapping?.appleProductId ?? null,
      })
      if (!mapping || !APPLE_PRODUCT_IDS[productId]) {
        console.info('[CW TRACE] storeKitAdapter.purchaseProduct early return', {
          code: 'unknown_product',
          productId,
        })
        return {
          ok: false,
          code: 'unknown_product',
          provider: 'apple',
          serverVerified: false,
        }
      }

      const enabled = mappingEnabled(mapping)
      console.info('[CW TRACE] storeKitAdapter.purchaseProduct mapping enabled', {
        productId,
        enabled,
      })
      if (!enabled) {
        console.info('[CW TRACE] storeKitAdapter.purchaseProduct early return', {
          code: 'apple_product_disabled',
          productId,
        })
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
        const { NativePurchases, PURCHASE_TYPE } = await loadPluginModule()
        console.info('[CW TRACE] storeKitAdapter.purchaseProduct plugin module loaded', {
          productId,
          purchaseTypeInapp: PURCHASE_TYPE?.INAPP ?? null,
          hasPurchaseProduct: typeof NativePurchases.purchaseProduct === 'function',
        })
        if (typeof NativePurchases.purchaseProduct !== 'function') {
          const err = new Error('StoreKit purchaseProduct missing')
          err.code = 'storekit_capability_missing'
          throw err
        }

        /** @type {Record<string, unknown>} */
        const purchaseRequest = {
          productIdentifier: mapping.appleProductId,
          productType: PURCHASE_TYPE.INAPP,
          quantity: 1,
        }
        const appAccountToken = sanitizeAppAccountToken(purchaseOptions.appAccountToken)
        if (appAccountToken) {
          purchaseRequest.appAccountToken = appAccountToken
        }

        logStoreKitLocal('purchase started', {
          appleProductId: mapping.appleProductId,
          productType: purchaseRequest.productType,
          quantity: purchaseRequest.quantity,
          hasAppAccountToken: Boolean(appAccountToken),
        })

        console.info('[CW TRACE] storeKitAdapter before NativePurchases.purchaseProduct', {
          productId,
          appleProductId: mapping.appleProductId,
          productType: purchaseRequest.productType,
          quantity: purchaseRequest.quantity,
          hasAppAccountToken: Boolean(appAccountToken),
        })

        // Documented Capgo StoreKit 2 API for one-time (non-consumable) products.
        const raw = await withStoreKitTimeout(
          NativePurchases.purchaseProduct(purchaseRequest),
          { timeoutMs, label: 'purchaseProduct' },
        )

        console.info('[CW TRACE] storeKitAdapter after NativePurchases.purchaseProduct', {
          productId,
          hasResult: Boolean(raw),
        })

        const entitlement = normalizeAppleTransaction(
          {
            ...raw,
            productId: mapping.appleProductId,
            transactionId: raw?.transactionId || raw?.transactionIdentifier,
            originalTransactionId: raw?.originalTransactionId,
            jwsRepresentation: raw?.jwsRepresentation,
            appAccountToken,
            purchaseDate: raw?.purchaseDate || raw?.transactionDate,
          },
          { subjectId: purchaseOptions.subjectId },
        )

        logStoreKitLocal('purchase resolved', {
          ok: Boolean(entitlement),
          productId,
        })

        return {
          ok: Boolean(entitlement),
          code: entitlement ? null : 'normalize_failed',
          provider: 'apple',
          entitlement,
          serverVerified: false,
          localCandidate: entitlement ? isLocalAppleCandidate(entitlement) : false,
        }
      } catch (err) {
        const code = classifyStoreKitPurchaseError(err)
        if (code === 'storekit_request_timeout') {
          console.info('[CW TRACE] storeKitAdapter.purchaseProduct timeout', { productId, code })
        }
        console.error('[CW TRACE] storeKitAdapter.purchaseProduct caught', { productId, code })
        logStoreKitLocal('purchase failed', { code })
        logStoreKitLocal('controlled error code', { code, phase: 'purchaseProduct' })
        return {
          ok: false,
          code,
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
        const { NativePurchases } = await loadPluginModule()
        let raw = []
        if (typeof NativePurchases.restorePurchases === 'function') {
          const result = await withStoreKitTimeout(NativePurchases.restorePurchases(), {
            timeoutMs,
            label: 'restorePurchases',
          })
          raw = Array.isArray(result) ? result : result?.purchases || result?.transactions || []
        } else if (typeof NativePurchases.getPurchases === 'function') {
          const result = await withStoreKitTimeout(NativePurchases.getPurchases(), {
            timeoutMs,
            label: 'getPurchases',
          })
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
        const code = classifyStoreKitPurchaseError(err)
        return {
          ok: false,
          code:
            code === 'storekit_purchase_failed'
              ? err?.code || 'storekit_restore_failed'
              : code,
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
