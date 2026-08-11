import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAnalyticsConsent } from './useAnalyticsConsent.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import './analyticsConsent.css'

function statusLabel(consent, t) {
  if (consent === 'accepted') return t('analytics.status.accepted')
  if (consent === 'declined') return t('analytics.status.declined')
  return t('analytics.status.unknown')
}

/**
 * Footer / Settings control to view and change optional cookie preference.
 * Product analytics is not gated by this control.
 * @param {{ variant?: 'footer' | 'settings', className?: string }} props
 */
export default function AnalyticsPreferencesControl({ variant = 'footer', className = '' }) {
  const t = useT()
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

  const triggerLabel =
    variant === 'settings'
      ? t('analytics.preferences.cookies')
      : t('analytics.preferences.privacy')
  const currentStatus = statusLabel(consent, t)

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
        <span className="cw-analytics-prefs__trigger-status">{currentStatus}</span>
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
              {t('analytics.preferences.current', { status: currentStatus })}
            </p>
            <p className="cw-analytics-prefs__body">
              {t('analytics.preferences.body')}{' '}
              <Link to="/legal/privacy" className="cw-analytics-consent__link" onClick={() => setOpen(false)}>
                {t('analytics.privacyPolicy')}
              </Link>
            </p>
            <div className="cw-analytics-consent__actions cw-analytics-consent__actions--prefs">
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
                {t('analytics.preferences.accept')}
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
                {t('analytics.preferences.reject')}
              </button>
              <button
                type="button"
                className="cw-analytics-prefs__close"
                onClick={() => setOpen(false)}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
