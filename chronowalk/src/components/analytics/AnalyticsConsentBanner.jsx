import { Link } from 'react-router-dom'
import { useAnalyticsConsent } from './useAnalyticsConsent.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import './analyticsConsent.css'

/**
 * Global first-visit cookie notice. Shown only while preference is unknown.
 * Product analytics (PostHog) starts independently under legitimate interest.
 * Non-modal region so checkout CTAs remain usable.
 */
export default function AnalyticsConsentBanner() {
  const t = useT()
  const { isUnknown, accept, decline } = useAnalyticsConsent()

  if (!isUnknown) return null

  return (
    <div className="cw-analytics-consent" data-testid="analytics-consent-banner">
      <aside
        className="cw-analytics-consent__panel"
        role="region"
        aria-labelledby="cw-analytics-consent-title"
        aria-describedby="cw-analytics-consent-body"
      >
        <div className="cw-analytics-consent__copy">
          <h2 id="cw-analytics-consent-title" className="cw-analytics-consent__title">
            {t('analytics.banner.title')}
          </h2>
          <p id="cw-analytics-consent-body" className="cw-analytics-consent__body">
            {t('analytics.banner.body')}{' '}
            <Link to="/legal/privacy" className="cw-analytics-consent__link">
              {t('analytics.privacyPolicy')}
            </Link>
          </p>
        </div>
        <div className="cw-analytics-consent__actions">
          <button
            type="button"
            className="cw-analytics-consent__btn cw-analytics-consent__btn--accept"
            onClick={accept}
            data-testid="analytics-consent-accept"
          >
            {t('analytics.accept')}
          </button>
          <button
            type="button"
            className="cw-analytics-consent__btn cw-analytics-consent__btn--decline"
            onClick={decline}
            data-testid="analytics-consent-decline"
          >
            {t('analytics.reject')}
          </button>
        </div>
      </aside>
    </div>
  )
}
