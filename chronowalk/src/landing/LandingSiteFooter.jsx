import { LANDING_CONTENT } from './landingData.js'

export default function LandingSiteFooter() {
  const { tagline, nav, credit } = LANDING_CONTENT.footer
  const year = new Date().getFullYear()

  return (
    <footer className="cw-v2-footer">
      <div className="cw-v2-footer__inner">
        <div className="cw-v2-footer__brand-block">
          <div className="cw-v2-footer__brand">
            <span className="cw-v2-header__mark" aria-hidden />
            <span className="cw-v2-footer__name">ChronoWalk</span>
          </div>
          <p className="cw-v2-footer__tagline">{tagline}</p>
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
