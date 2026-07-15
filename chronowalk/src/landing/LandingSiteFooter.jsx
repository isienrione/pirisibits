import { Link } from 'react-router-dom'
import ChronoWalkLogo from '../components/ui/ChronoWalkLogo.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingSiteFooter() {
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
        </div>

        <nav className="cw-v2-footer__nav" aria-label="Footer">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="cw-v2-footer__link">
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="cw-v2-footer__legal">
        © {year} ChronoWalk. {credit}
      </div>
    </footer>
  )
}
