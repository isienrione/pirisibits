import { LANDING_CONTENT } from '../landingData.js'
import { useT } from '../../i18n/I18nProvider.jsx'

/**
 * High-visibility access CTA for returning purchasers.
 */
export default function LandingAccessCta({ className = '' }) {
  const t = useT()
  const { accessHref } = LANDING_CONTENT.pricing
  if (!accessHref) return null

  return (
    <div className={`cw-v4-access-cta${className ? ` ${className}` : ''}`}>
      <p className="cw-v4-access-cta__eyebrow">{t('landing.access.eyebrow')}</p>
      <a href={accessHref} className="cw-v4-access-cta__button">
        {t('landing.access.open')}
      </a>
      <p className="cw-v4-access-cta__note">{t('landing.access.note')}</p>
    </div>
  )
}
