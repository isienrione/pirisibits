import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAnalyticsConsent } from './useAnalyticsConsent.js'
import './analyticsConsent.css'

function statusLabel(consent) {
  if (consent === 'accepted') return 'Analytics allowed'
  if (consent === 'declined') return 'Analytics off'
  return 'Not chosen yet'
}

/**
 * Footer / Settings control to view and change analytics consent.
 * @param {{ variant?: 'footer' | 'settings', className?: string }} props
 */
export default function AnalyticsPreferencesControl({ variant = 'footer', className = '' }) {
  const titleId = useId()
  const { consent, isAccepted, accept, decline } = useAnalyticsConsent()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const triggerLabel = variant === 'settings' ? 'Analytics preferences' : 'Privacy choices'

  return (
    <div className={`cw-analytics-prefs ${className}`.trim()} data-testid="analytics-preferences">
      <button
        type="button"
        className={
          variant === 'settings'
            ? 'cw-analytics-prefs__settings-trigger'
            : 'cw-analytics-prefs__footer-trigger'
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        data-testid="analytics-preferences-open"
      >
        <span className="cw-analytics-prefs__trigger-label">{triggerLabel}</span>
        <span className="cw-analytics-prefs__trigger-status">{statusLabel(consent)}</span>
      </button>

      {open ? (
        <div
          className="cw-analytics-prefs__overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <div
            className="cw-analytics-prefs__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-testid="analytics-preferences-dialog"
          >
            <h2 id={titleId} className="cw-analytics-prefs__title">
              {triggerLabel}
            </h2>
            <p className="cw-analytics-prefs__status">
              Current choice: <strong>{statusLabel(consent)}</strong>
            </p>
            <p className="cw-analytics-prefs__body">
              Optional analytics help us improve ChronoWalk. Essential access, offline downloads,
              and journey progress are never tied to this choice.{' '}
              <Link to="/legal/privacy" className="cw-analytics-consent__link" onClick={() => setOpen(false)}>
                Privacy Policy
              </Link>
            </p>
            <div className="cw-analytics-consent__actions">
              <button
                type="button"
                className="cw-analytics-consent__btn cw-analytics-consent__btn--accept"
                onClick={() => {
                  accept()
                  setOpen(false)
                }}
                data-testid="analytics-preferences-accept"
                disabled={isAccepted}
              >
                Allow analytics
              </button>
              <button
                type="button"
                className="cw-analytics-consent__btn cw-analytics-consent__btn--decline"
                onClick={() => {
                  decline()
                  setOpen(false)
                }}
                data-testid="analytics-preferences-decline"
                disabled={consent === 'declined'}
              >
                Turn analytics off
              </button>
              <button
                type="button"
                className="cw-analytics-prefs__close"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
