/**
 * Web purchase adapter — Paddle-compatible provider selection.
 *
 * Does not replace openCheckout / paddle.js. Production web callers continue
 * to use those paths. This adapter exposes the shared PurchaseService API.
 */

import { canUseWebCheckout } from '../platform/runtime/index.js'
import { getSkuEntitlementShape, listCommerceProducts } from '../commerce/commerceCatalog.js'

/**
 * @param {object} [options]
 * @param {(args: object) => Promise<object>} [options.openCheckoutImpl]
 */
export function createWebPurchaseAdapter(options = {}) {
  const openCheckoutImpl = options.openCheckoutImpl

  return {
    kind: /** @type {const} */ ('paddle'),
    provider: /** @type {const} */ ('paddle'),

    async isAvailable() {
      return canUseWebCheckout()
    },

    async getAvailableProducts(productIds) {
      if (!canUseWebCheckout()) {
        return { ok: false, code: 'paddle_unavailable', products: [] }
      }
      const ids =
        productIds?.length > 0
          ? productIds
          : listCommerceProducts().map((p) => p.productId)

      const products = ids
        .map((id) => {
          const sku = getSkuEntitlementShape(id)
          if (!sku) return null
          // Web prices come from Paddle / landing config — not hard-coded here
          // as StoreKit localized price replacements.
          return {
            productId: sku.productId,
            contentProductId: sku.contentProductId,
            provider: 'paddle',
            title: sku.productId,
            // amountCents from catalog is marketing fallback only for web UI;
            // checkout still uses Paddle price ids.
            priceSource: 'paddle_catalog_fallback',
            amountCents: sku.amountCents ?? null,
            localizedPriceString: null,
          }
        })
        .filter(Boolean)

      return { ok: true, products }
    },

    async purchaseProduct(productId, purchaseOptions = {}) {
      if (!canUseWebCheckout()) {
        return {
          ok: false,
          code: 'paddle_unavailable_on_native',
          provider: 'paddle',
          serverVerified: false,
        }
      }
      if (!getSkuEntitlementShape(productId)) {
        return { ok: false, code: 'unknown_product', provider: 'paddle', serverVerified: false }
      }
      if (!openCheckoutImpl) {
        return {
          ok: false,
          code: 'checkout_not_wired',
          provider: 'paddle',
          serverVerified: false,
          message:
            'Web PurchaseService defers to openCheckout; inject openCheckoutImpl or call openCheckout directly.',
        }
      }
      const result = await openCheckoutImpl({
        tierId: productId,
        source: purchaseOptions.source ?? 'purchase_service',
        email: purchaseOptions.email,
      })
      return {
        ok: Boolean(result?.ok),
        code: result?.ok ? null : result?.reason || 'checkout_failed',
        provider: 'paddle',
        serverVerified: false,
        checkout: result,
      }
    },

    async restorePurchases() {
      // Paddle restore is account/email based via existing access flows — not StoreKit.
      return {
        ok: false,
        code: 'use_web_access_restore',
        provider: 'paddle',
        entitlements: [],
        serverVerified: false,
        message: 'Web restore uses access-token / account recovery, not StoreKit restore.',
      }
    },

    async refreshEntitlements() {
      return { ok: true, provider: 'paddle', entitlements: [], serverVerified: false }
    },
  }
}
