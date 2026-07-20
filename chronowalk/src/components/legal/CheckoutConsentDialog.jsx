import { useEffect, useId, useState } from 'react'
import ImmediateAccessConsent from './ImmediateAccessConsent.jsx'
import { TAX_INCLUSIVE_NOTE } from './immediateAccessConsent.js'
import './legal.css'

function CheckoutConsentDialogPanel({
  tierLabel,
  priceLabel,
  busy,
  onConfirm,
  onCancel,
}) {
  const [consented, setConsented] = useState(false)
  const consentId = useId()

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
          Access is granted immediately after payment. Confirm below to proceed to Paddle checkout.
        </p>

        <div style={{ marginTop: '1.15rem' }}>
          <ImmediateAccessConsent
            id={consentId}
            checked={consented}
            onChange={setConsented}
            dark
          />
        </div>

        <div className="cw-consent-dialog__actions">
          <button
            type="button"
            className="cw-consent-dialog__primary"
            disabled={!consented || busy}
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
 * Modal gate before Paddle checkout. Primary CTA stays disabled until consent is checked.
 * Remounts on each open so the checkbox never stays pre-checked.
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
