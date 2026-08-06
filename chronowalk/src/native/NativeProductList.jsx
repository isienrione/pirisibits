import { useCallback, useEffect, useState } from 'react'
import {
  getPurchaseService,
  canInvokePaddleCheckout,
} from '../purchases/index.js'
import { describeNativeProduct } from './nativeEntryRouting.js'
import {
  getNativeProductAccent,
  getPurchaseUnavailableMessage,
  NATIVE_PRODUCT_BLURBS,
} from './nativeCopy.js'
import { NativeButton } from './NativeButton.jsx'
import { nativeSuccessHaptic, nativeWarningHaptic, isReducedMotionPreferred } from './nativeHaptics.js'
import './nativeEntry.css'

/**
 * Polished native product list — StoreKit only, never Paddle.
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
  const reducedMotion = isReducedMotionPreferred()

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

      if (canInvokePaddleCheckout()) {
        setMessages((prev) => ({
          ...prev,
          [productId]: getPurchaseUnavailableMessage('paddle_unavailable_on_native'),
        }))
        nativeWarningHaptic()
        setBusyId(null)
        return
      }

      const gate = purchases.canPurchaseProduct?.(productId) ?? { ok: false, code: 'unavailable' }
      if (!gate.ok) {
        setMessages((prev) => ({
          ...prev,
          [productId]: getPurchaseUnavailableMessage(gate.code),
        }))
        nativeWarningHaptic()
        setBusyId(null)
        return
      }

      try {
        const result = await purchases.purchaseProduct(productId)
        if (result?.ok) {
          nativeSuccessHaptic()
          setMessages((prev) => ({
            ...prev,
            [productId]: result.serverVerified
              ? 'Purchase complete.'
              : 'Purchase received. Unlock finalizes after verification.',
          }))
        } else {
          nativeWarningHaptic()
          setMessages((prev) => ({
            ...prev,
            [productId]: getPurchaseUnavailableMessage(result?.code) || 'Purchase couldn’t complete.',
          }))
        }
      } catch {
        nativeWarningHaptic()
        setMessages((prev) => ({
          ...prev,
          [productId]: 'Purchase couldn’t complete.',
        }))
      } finally {
        setBusyId(null)
      }
    },
    [purchases],
  )

  return (
    <div
      className={`cw-native-shell cw-native-products ${reducedMotion ? 'cw-native-shell--reduced' : 'cw-native-shell--motion'}`}
      data-testid="native-product-list"
    >
      <div className="cw-native-shell__panel">
        <header className="cw-native-products__header">
          <p className="cw-native-eyebrow">{cityName}</p>
          <h1 className="cw-native-title">Choose your walk</h1>
          <p className="cw-native-lede">
            Flagship and focused routes for the same city — priced by the App Store.
          </p>
        </header>

        <ul className="cw-native-products__list" aria-label={`${cityName} walks`}>
          {products.map((product) => {
            const detail = describeNativeProduct(product.productId) ?? {
              productId: product.productId,
              name: product.name,
            }
            const accent = getNativeProductAccent(product.productId)
            const price = priceLabels[product.productId]
            const flagship = accent === 'flagship'
            return (
              <li
                key={product.productId}
                className={`cw-native-products__item${flagship ? ' cw-native-products__item--flagship' : ''}`}
                data-testid={`native-product-card-${product.productId}`}
              >
                {flagship ? (
                  <span className="cw-native-products__badge" aria-label="Recommended">
                    Recommended
                  </span>
                ) : null}
                <div>
                  <h2 className="cw-native-products__name">{detail.name}</h2>
                  <p className="cw-native-products__blurb">
                    {NATIVE_PRODUCT_BLURBS[product.productId] || 'A ChronoWalk city route.'}
                  </p>
                  <p
                    className={`cw-native-products__price${price ? '' : ' cw-native-products__price--pending'}`}
                    data-testid={`native-price-${product.productId}`}
                  >
                    {price || 'Available after App Store configuration'}
                  </p>
                </div>
                <NativeButton
                  variant={flagship ? 'terracotta' : 'secondary'}
                  disabled={busyId === product.productId}
                  testId={`native-buy-${product.productId}`}
                  aria-label={flagship ? `Get ${detail.name}` : `Purchase ${detail.name}`}
                  onClick={() => handlePurchase(product.productId)}
                >
                  {busyId === product.productId ? 'Working…' : flagship ? 'Get Roma Eterna' : 'Purchase'}
                </NativeButton>
                {messages[product.productId] ? (
                  <p className="cw-native-status__detail" role="status" aria-live="polite">
                    {messages[product.productId]}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>

        {onBack ? (
          <NativeButton
            variant="ghost"
            testId="native-products-back"
            aria-label="Back to city home"
            onClick={onBack}
          >
            Back
          </NativeButton>
        ) : null}
      </div>
    </div>
  )
}
