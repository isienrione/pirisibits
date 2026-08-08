import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPurchaseService,
  canInvokePaddleCheckout,
  activateLocalStoreKitEntitlement,
  openTourLabelForProduct,
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
 * Apply a purchase result to local UI state (success → Open Tour, else message).
 */
function applyPurchaseResult({
  productId,
  result,
  setMessages,
  setOpenActions,
}) {
  if (result?.ok) {
    nativeSuccessHaptic()
    const activation = activateLocalStoreKitEntitlement(result)
    if (activation.ok) {
      setMessages((prev) => ({
        ...prev,
        [productId]: 'Purchase complete for local testing.',
      }))
      setOpenActions((prev) => ({
        ...prev,
        [productId]: {
          path: activation.openPath || '/setup',
          label: openTourLabelForProduct(activation.productId || productId),
        },
      }))
      return
    }
    setMessages((prev) => ({
      ...prev,
      [productId]: result.serverVerified
        ? 'Purchase complete.'
        : 'Purchase received. Unlock finalizes after verification.',
    }))
    return
  }

  nativeWarningHaptic()
  setMessages((prev) => ({
    ...prev,
    [productId]:
      getPurchaseUnavailableMessage(result?.code) || 'Purchase couldn’t complete.',
  }))
}

/**
 * Polished native product list — StoreKit only, never Paddle.
 */
export function NativeProductList({
  products = [],
  cityName = 'Rome',
  purchaseService,
  onBack,
} = {}) {
  const navigate = useNavigate()
  const purchases = purchaseService ?? getPurchaseService()
  const [messages, setMessages] = useState({})
  const [busyId, setBusyId] = useState(null)
  /** Product ids waiting on a late native StoreKit settlement after JS timeout. */
  const [checkingId, setCheckingId] = useState(null)
  const [priceLabels, setPriceLabels] = useState({})
  /** @type {[Record<string, { path: string, label: string }>, Function]} */
  const [openActions, setOpenActions] = useState({})
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
      if (busyId || checkingId) return

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

        if (
          !result?.ok &&
          result?.purchasePending &&
          (result.code === 'storekit_request_timeout' || result.code === 'purchase_in_flight')
        ) {
          // Keep Buy disabled; native sheet may still complete.
          setBusyId(null)
          setCheckingId(productId)
          setMessages((prev) => ({
            ...prev,
            [productId]: 'Checking purchase…',
          }))

          let late = null
          if (typeof purchases.awaitPendingPurchase === 'function') {
            late = await purchases.awaitPendingPurchase(productId)
          } else if (typeof purchases.refreshEntitlements === 'function') {
            await purchases.refreshEntitlements({ updateLocalView: true })
          }

          setCheckingId(null)
          if (late?.ok) {
            applyPurchaseResult({
              productId,
              result: late,
              setMessages,
              setOpenActions,
            })
          } else if (late) {
            applyPurchaseResult({
              productId,
              result: late,
              setMessages,
              setOpenActions,
            })
          } else {
            setMessages((prev) => ({
              ...prev,
              [productId]:
                'Still confirming with the App Store. If you completed payment, use Restore Purchases.',
            }))
          }
          return
        }

        applyPurchaseResult({
          productId,
          result,
          setMessages,
          setOpenActions,
        })
      } catch {
        nativeWarningHaptic()
        setMessages((prev) => ({
          ...prev,
          [productId]: 'Purchase couldn’t complete.',
        }))
      } finally {
        setBusyId((current) => (current === productId ? null : current))
      }
    },
    [purchases, busyId, checkingId],
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
            const openAction = openActions[product.productId]
            const isBusy = busyId === product.productId
            const isChecking = checkingId === product.productId
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
                {openAction ? (
                  <NativeButton
                    variant={flagship ? 'terracotta' : 'secondary'}
                    testId={`native-open-tour-${product.productId}`}
                    aria-label={openAction.label}
                    onClick={() => navigate(openAction.path)}
                  >
                    {openAction.label}
                  </NativeButton>
                ) : (
                  <NativeButton
                    variant={flagship ? 'terracotta' : 'secondary'}
                    disabled={Boolean(busyId || checkingId)}
                    testId={`native-buy-${product.productId}`}
                    aria-label={flagship ? `Get ${detail.name}` : `Purchase ${detail.name}`}
                    onClick={() => handlePurchase(product.productId)}
                  >
                    {isChecking
                      ? 'Checking…'
                      : isBusy
                        ? 'Working…'
                        : flagship
                          ? 'Get Roma Eterna'
                          : 'Purchase'}
                  </NativeButton>
                )}
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
