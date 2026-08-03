import { Link } from 'react-router-dom'
import ChronoWalkLogo from '../../components/ui/ChronoWalkLogo.jsx'

/**
 * Compact acquisition-page header — brand home + focused CTAs, no hamburger.
 */
export default function AcquisitionHeader({
  primaryCta = 'Get the full Rome tour',
  primaryTo = '/#pricing',
  onPrimaryClick,
  showHowItWorks = true,
}) {
  return (
    <header className="cw-acq-header">
      <div className="cw-acq-header__inner">
        <Link to="/" className="cw-acq-header__brand" aria-label="ChronoWalk home">
          <ChronoWalkLogo size={32} variant="dark" className="cw-acq-header__emblem" />
          <span className="cw-acq-header__name">ChronoWalk</span>
        </Link>

        <nav className="cw-acq-header__nav" aria-label="Acquisition">
          <Link to="/#pricing" className="cw-acq-header__link">
            Full Rome tour
          </Link>
          {showHowItWorks ? (
            <Link to="/how-it-works" className="cw-acq-header__link">
              How it works
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
