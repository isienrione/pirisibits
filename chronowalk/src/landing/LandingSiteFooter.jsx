import { Link } from 'react-router-dom'
import ChronoWalkLogo from '../components/ui/ChronoWalkLogo.jsx'
import AnalyticsPreferencesControl from '../components/analytics/AnalyticsPreferencesControl.jsx'
import { LANDING_CONTENT } from './landingData.js'
import '../components/legal/legal.css'

const SUPPORT_EMAIL = 'support@chronowalk.com'

const LEGAL_LINKS = [
  { label: 'Terms', to: '/legal/terms' },
  { label: 'Privacy', to: '/legal/privacy' },
  { label: 'Refunds', to: '/legal/refund' },
  { label: 'Support', to: '/contact' },
]

function resolveFooterHref(href, landingPrefix) {
  if (!landingPrefix) return href
  if (href.startsWith('#')) return `${landingPrefix}${href}`
  return href
}

/**
 * Site footer - landing anchors + Legal cluster required for Paddle review.
 * @param {{ pricingHref?: string, landingPrefix?: string }} props
 *   pricingHref - `#pricing` on landing; `/landing#pricing` on standalone pages.
 *   landingPrefix - when set (e.g. `/landing`), section anchors point at the marketing page.
 */
export default function LandingSiteFooter({
  pricingHref = '#pricing',
  landingPrefix = '',
}) {
  const { tagline, nav, credit, accessHref, accessLinkLabel } = LANDING_CONTENT.footer
  const year = new Date().getFullYear()

  return (
    <footer className="cw-v2-footer">
      <div className="cw-v2-footer__inner">
        <div className="cw-v2-footer__brand-block">
          <ChronoWalkLogo
            className="cw-v2-footer__logo"
            width={220}
            variant="dark"
            layout="stacked"
          />
          <p className="cw-v2-footer__tagline">{tagline}</p>
          {accessHref ? (
            <p className="cw-v2-footer__access">
              <Link to={accessHref} className="cw-v2-footer__access-link">
                {accessLinkLabel ?? 'Already purchased? Enter access'}
              </Link>
            </p>
          ) : null}
          <p className="cw-v2-footer__support">
            Support:{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>
        </div>

        <nav className="cw-v2-footer__nav" aria-label="Footer">
          {nav.map((item) => (
            <a
              key={item.href}
              href={resolveFooterHref(item.href, landingPrefix)}
              className="cw-v2-footer__link"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="cw-v2-footer__legal">
        <nav className="cw-v2-footer__legal-nav" aria-label="Legal">
          <p className="cw-v2-footer__legal-nav-label">Legal</p>
          {LEGAL_LINKS.map((item, index) => (
            <span key={item.to} style={{ display: 'contents' }}>
              {index > 0 ? (
                <span className="cw-v2-footer__legal-sep" aria-hidden="true">
                  ·
                </span>
              ) : null}
              <Link to={item.to} className="cw-v2-footer__legal-link">
                {item.label}
              </Link>
            </span>
          ))}
          <span className="cw-v2-footer__legal-sep" aria-hidden="true">
            ·
          </span>
          <a href={pricingHref} className="cw-v2-footer__legal-link">
            Pricing
          </a>
        </nav>
        <div className="cw-v2-footer__privacy-choices">
          <AnalyticsPreferencesControl variant="footer" />
        </div>
        <p style={{ margin: '1.25rem 0 0' }}>
          © {year} ChronoWalk. {credit}
        </p>
      </div>
    </footer>
  )
}
