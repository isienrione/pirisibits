import { Link } from 'react-router-dom'
import ChronoWalkLogo from '../../components/ui/ChronoWalkLogo.jsx'
import { useT } from '../../i18n/I18nProvider.jsx'

/**
 * Compact acquisition-page header: brand home + focused CTAs, no hamburger.
 */
export default function AcquisitionHeader({
  primaryCta = 'Get the full Rome tour',
  primaryTo = '/#pricing',
  onPrimaryClick,
  showHowItWorks = true,
}) {
  const t = useT()
  return (
    <header className="cw-acq-header">
      <div className="cw-acq-header__inner">
        <Link to="/" className="cw-acq-header__brand" aria-label={t('landing.nav.homeAria')}>
          <ChronoWalkLogo size={32} variant="dark" className="cw-acq-header__emblem" />
          <span className="cw-acq-header__name">ChronoWalk</span>
        </Link>

        <nav className="cw-acq-header__nav" aria-label={t('acquisition.header.aria')}>
          <Link to="/#pricing" className="cw-acq-header__link">
            {t('acquisition.header.fullTour')}
          </Link>
          {showHowItWorks ? (
            <Link to="/how-it-works" className="cw-acq-header__link">
              {t('acquisition.header.howItWorks')}
            </Link>
          ) : null}
        </nav>

        {onPrimaryClick ? (
          <button type="button" className="cw-acq-header__cta" onClick={onPrimaryClick}>
            {primaryCta}
          </button>
        ) : (
          <Link to={primaryTo} className="cw-acq-header__cta">
            {primaryCta}
          </Link>
        )}
      </div>
    </header>
  )
}
