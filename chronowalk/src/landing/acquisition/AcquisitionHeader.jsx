import { Link } from 'react-router-dom'
import ChronoWalkLogo from '../../components/ui/ChronoWalkLogo.jsx'
import { useT } from '../../i18n/I18nProvider.jsx'
import {
  LandingLanguageControl,
} from '../LandingLanguageSwitcher.jsx'

/**
 * Compact acquisition-page header: brand home + language + focused CTAs.
 */
export default function AcquisitionHeader({
  primaryCta = 'Get the full Rome tour',
  primaryCtaShort = null,
  primaryTo = '/#pricing',
  onPrimaryClick,
  showHowItWorks = true,
}) {
  const t = useT()
  const shortCta = primaryCtaShort || t('acquisition.header.primaryShort')

  return (
    <header className="cw-acq-header">
      <div className="cw-acq-header__inner">
        <Link to="/" className="cw-acq-header__brand" aria-label={t('landing.nav.homeAria')}>
          <ChronoWalkLogo size={32} variant="light" className="cw-acq-header__emblem" />
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

        <LandingLanguageControl className="cw-acq-header__language" />

        {onPrimaryClick ? (
          <button type="button" className="cw-acq-header__cta" onClick={onPrimaryClick}>
            <span className="cw-acq-header__cta-long">{primaryCta}</span>
            <span className="cw-acq-header__cta-short">{shortCta}</span>
          </button>
        ) : (
          <Link to={primaryTo} className="cw-acq-header__cta">
            <span className="cw-acq-header__cta-long">{primaryCta}</span>
            <span className="cw-acq-header__cta-short">{shortCta}</span>
          </Link>
        )}
      </div>
    </header>
  )
}
