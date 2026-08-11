import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import OfferPriceDisplay from '../../landing/OfferPriceDisplay.jsx'
import { useT } from '../../i18n/I18nProvider.jsx'
import './legal.css'

function CheckoutConsentDialogPanel({
  tierLabel,
  priceLabel,
  basePriceLabel = null,
  offerLabel = null,
  saveLabel = null,
  launchOffer = false,
  busy,
  onConfirm,
  onCancel,
}) {
  const t = useT()
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onCancel?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [busy, onCancel])

  return (
    <div
      className="cw-consent-dialog"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel?.()
      }}
    >
      <div
        className="cw-consent-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-consent-title"
      >
        <p className="cw-consent-dialog__eyebrow">{t('checkout.consent.eyebrow')}</p>
        <h2 id="checkout-consent-title" className="cw-consent-dialog__title">
          {tierLabel
            ? t('checkout.consent.titleTier', { tier: tierLabel })
            : t('checkout.consent.title')}
        </h2>
        {priceLabel ? (
          <>
            <OfferPriceDisplay
              as="p"
              className="cw-consent-dialog__price"
              priceClassName="cw-consent-dialog__price-now"
              price={priceLabel}
              basePrice={basePriceLabel}
              offerLabel={offerLabel}
              saveLabel={saveLabel}
              launchOffer={launchOffer}
              onDark
            />
            <p className="cw-consent-dialog__tax">{t('consent.taxInclusive')}</p>
          </>
        ) : (
          <p className="cw-consent-dialog__tax">{t('consent.taxInclusive')}</p>
        )}
        <p className="cw-consent-dialog__body">
          {t('checkout.consent.body')}
        </p>

        <div className="cw-consent-dialog__actions">
          <button
            type="button"
            className="cw-consent-dialog__primary"
            disabled={busy}
            onClick={() => onConfirm?.()}
          >
            {busy ? t('checkout.consent.opening') : t('checkout.consent.continue')}
          </button>
          <button
            type="button"
            className="cw-consent-dialog__secondary"
            onClick={() => onCancel?.()}
            disabled={busy}
          >
            {t('action.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Confirm modal before Paddle checkout (no withdrawal-waiver checkbox -
 * that notice lives in the post-purchase access email + refund policy).
 * Portaled to document.body so landing overflow/stacking cannot hide it.
 */
export default function CheckoutConsentDialog({
  open,
  tierLabel = null,
  priceLabel = null,
  basePriceLabel = null,
  offerLabel = null,
  saveLabel = null,
  launchOffer = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <CheckoutConsentDialogPanel
      tierLabel={tierLabel}
      priceLabel={priceLabel}
      basePriceLabel={basePriceLabel}
      offerLabel={offerLabel}
      saveLabel={saveLabel}
      launchOffer={launchOffer}
      busy={busy}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
    document.body,
  )
}
