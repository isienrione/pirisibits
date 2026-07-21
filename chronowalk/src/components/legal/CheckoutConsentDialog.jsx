import { useEffect } from 'react'
import { TAX_INCLUSIVE_NOTE } from './immediateAccessConsent.js'
import './legal.css'

function CheckoutConsentDialogPanel({
  tierLabel,
  priceLabel,
  busy,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onCancel?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
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
        <p className="cw-consent-dialog__eyebrow">Secure checkout</p>
        <h2 id="checkout-consent-title" className="cw-consent-dialog__title">
          {tierLabel ? `Continue with ${tierLabel}` : 'Continue to checkout'}
        </h2>
        {priceLabel ? (
          <>
            <p className="cw-consent-dialog__price">{priceLabel}</p>
            <p className="cw-consent-dialog__tax">{TAX_INCLUSIVE_NOTE}</p>
          </>
        ) : (
          <p className="cw-consent-dialog__tax">{TAX_INCLUSIVE_NOTE}</p>
        )}
        <p className="cw-consent-dialog__body">
          You’ll go to Paddle’s secure checkout next. After payment, your access link
          arrives by email so you can start walking right away.
        </p>

        <div className="cw-consent-dialog__actions">
          <button
            type="button"
            className="cw-consent-dialog__primary"
            disabled={busy}
            onClick={() => onConfirm?.()}
          >
            {busy ? 'Opening checkout…' : 'Continue to secure checkout'}
          </button>
          <button
            type="button"
            className="cw-consent-dialog__secondary"
            onClick={() => onCancel?.()}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Confirm modal before Paddle checkout (no withdrawal-waiver checkbox —
 * that notice lives in the post-purchase access email + refund policy).
 */
export default function CheckoutConsentDialog({
  open,
  tierLabel = null,
  priceLabel = null,
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <CheckoutConsentDialogPanel
      tierLabel={tierLabel}
      priceLabel={priceLabel}
      busy={busy}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
