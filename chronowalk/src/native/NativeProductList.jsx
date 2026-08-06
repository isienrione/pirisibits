import { useCallback, useEffect, useState } from 'react'
import { PrimaryButton } from '../redesign/ui/PrimaryButton.jsx'
import { GhostButton } from '../redesign/ui/GhostButton.jsx'
import { T, F } from '../redesign/tokens.js'
import {
  getPurchaseService,
  canInvokePaddleCheckout,
} from '../purchases/index.js'
import { describeNativeProduct } from './nativeEntryRouting.js'
import './nativeEntry.css'

/**
 * Native product list for a published city.
 * Never invokes Paddle. StoreKit only when configured/enabled.
 *
 * @param {{
 *   products?: object[],
 *   cityName?: string,
 *   purchaseService?: ReturnType<typeof getPurchaseService>,
 *   onBack?: () => void,
 * }} [props]
 */
export function NativeProductList({
  products = [],
  cityName = 'Rome',
  purchaseService,
  onBack,
} = {}) {
  const purchases = purchaseService ?? getPurchaseService()
  const [messages, setMessages] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [priceLabels, setPriceLabels] = useState({})

  useEffect(() => {
    let cancelled = false
    async function loadPrices() {
      if (typeof purchases?.getAvailableProducts !== 'function') return
      try {
        const ids = products.map((p) => p.productId)
        const result = await purchases.getAvailableProducts(ids)
        if (cancelled || !result?.ok) return
        /** @type {Record<string, string>} */
        const next = {}
        for (const row of result.products ?? []) {
          if (row.localizedPriceString) {
            next[row.productId] = row.localizedPriceString
          }
        }
        setPriceLabels(next)
      } catch {
        /* leave prices unavailable */
      }
    }
    void loadPrices()
    return () => {
      cancelled = true
    }
  }, [products, purchases])

  const handlePurchase = useCallback(
    async (productId) => {
      setBusyId(productId)
      setMessages((prev) => ({ ...prev, [productId]: null }))

      // Hard safeguard — native must never open Paddle.
      if (canInvokePaddleCheckout()) {
        setMessages((prev) => ({
          ...prev,
          [productId]: 'Paddle checkout is not available in the iOS app.',
        }))
        setBusyId(null)
        return
      }

      const gate = purchases.canPurchaseProduct?.(productId) ?? { ok: false, code: 'unavailable' }
      if (!gate.ok) {
        const human =
          gate.code === 'apple_product_disabled'
            ? 'Apple In-App Purchase is not configured yet.'
            : gate.code === 'apple_product_deferred'
              ? 'This product is not available on the App Store yet.'
              : gate.code === 'storekit_unavailable'
                ? 'StoreKit is unavailable on this device.'
                : 'Purchase unavailable.'
        setMessages((prev) => ({ ...prev, [productId]: human }))
        setBusyId(null)
        return
      }

      try {
        const result = await purchases.purchaseProduct(productId)
        if (result?.ok) {
          setMessages((prev) => ({
            ...prev,
            [productId]:
              result.serverVerified
                ? 'Purchase complete.'
                : 'Purchase recorded locally. Server verification comes next.',
          }))
        } else {
          setMessages((prev) => ({
            ...prev,
            [productId]: result?.message || result?.code || 'Purchase failed.',
          }))
        }
      } catch (err) {
        setMessages((prev) => ({
          ...prev,
          [productId]: err?.message || 'Purchase failed.',
        }))
      } finally {
        setBusyId(null)
      }
    },
    [purchases],
  )

  return (
    <div className="cw-native-entry cw-native-products" data-testid="native-product-list">
      <header className="cw-native-entry__brand">
        <p className="cw-native-entry__eyebrow">{cityName}</p>
        <h1 className="cw-native-entry__title">Choose your walk</h1>
        <p className="cw-native-entry__body">
          Prices come from the App Store when In-App Purchase is configured.
        </p>
      </header>

      <ul className="cw-native-products__list">
        {products.map((product) => {
          const detail = describeNativeProduct(product.productId) ?? {
            productId: product.productId,
            name: product.name,
          }
          const price = priceLabels[product.productId]
          return (
            <li key={product.productId} className="cw-native-products__item">
              <div>
                <h2 className="cw-native-products__name">{detail.name}</h2>
                <p className="cw-native-products__price" data-testid={`native-price-${product.productId}`}>
                  {price || 'Price unavailable until App Store products are enabled'}
                </p>
              </div>
              <PrimaryButton
                onClick={() => handlePurchase(product.productId)}
                disabled={busyId === product.productId}
                data-testid={`native-buy-${product.productId}`}
              >
                {busyId === product.productId ? 'Working…' : 'Purchase'}
              </PrimaryButton>
              {messages[product.productId] ? (
                <p className="cw-native-entry__status" role="status">
                  {messages[product.productId]}
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>

      {onBack ? (
        <GhostButton onClick={onBack} data-testid="native-products-back">
          Back
        </GhostButton>
      ) : null}

      <style>{`
        .cw-native-entry__title, .cw-native-products__name { font-family: ${F.display}; color: ${T.warmWhite}; }
        .cw-native-entry__body, .cw-native-products__price, .cw-native-entry__eyebrow, .cw-native-entry__status {
          font-family: ${F.body};
        }
      `}</style>
    </div>
  )
}
