import { Link } from 'react-router-dom'
import { useAnalyticsConsent } from './useAnalyticsConsent.js'
import './analyticsConsent.css'

/**
 * Global first-visit cookie notice. Shown only while preference is unknown.
 * Product analytics (PostHog) starts independently under legitimate interest.
 * Non-modal region so checkout CTAs remain usable.
 */
export default function AnalyticsConsentBanner() {
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
            Cookies
          </h2>
          <p id="cw-analytics-consent-body" className="cw-analytics-consent__body">
            We use optional cookies to measure ads and improve how ChronoWalk reaches people who
            might enjoy it. Product analytics that keep the app working and improving run under
            legitimate interest and are not controlled here.{' '}
            <Link to="/legal/privacy" className="cw-analytics-consent__link">
              Privacy Policy
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
            Accept
          </button>
          <button
            type="button"
            className="cw-analytics-consent__btn cw-analytics-consent__btn--decline"
            onClick={decline}
            data-testid="analytics-consent-decline"
          >
            Reject
          </button>
        </div>
      </aside>
    </div>
  )
}
