import { Link } from 'react-router-dom'
import ChronoWalkLogo from '../components/ui/ChronoWalkLogo.jsx'
import AnalyticsPreferencesControl from '../components/analytics/AnalyticsPreferencesControl.jsx'
import { LANDING_CONTENT } from './landingData.js'
import { useT } from '../i18n/I18nProvider.jsx'
import '../components/legal/legal.css'

const SUPPORT_EMAIL = 'support@chronowalk.com'

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
  content = LANDING_CONTENT.footer,
}) {
  const t = useT()
  const { tagline, nav, credit, accessHref, accessLinkLabel } = content
  const legalLinks = [
    { label: t('landing.footer.home'), to: '/' },
    { label: t('landing.footer.contact'), to: '/contact' },
    { label: t('landing.footer.terms'), to: '/legal/terms' },
    { label: t('landing.footer.privacy'), to: '/legal/privacy' },
    { label: t('landing.footer.refund'), to: '/legal/refund' },
  ]
  const year = new Date().getFullYear()

  return (
    <footer id="support-legal" className="cw-v2-footer">
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
            {t('landing.footer.support')}:{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>
        </div>

        <nav className="cw-v2-footer__nav" aria-label={t('landing.footer.aria')}>
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
        <nav className="cw-v2-footer__legal-nav" aria-label={t('landing.footer.legalAria')}>
          <p className="cw-v2-footer__legal-nav-label">{t('landing.footer.legal')}</p>
          {legalLinks.map((item, index) => (
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
            {t('landing.footer.pricing')}
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
