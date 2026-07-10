import { LANDING_CONTENT } from './landingData.js'

export default function LandingSiteHeader() {
  const { nav, cta } = LANDING_CONTENT.header

  return (
    <header className="cw-v2-header">
      <div className="cw-v2-header__inner">
        <a href="#top" className="cw-v2-header__brand">
          <span className="cw-v2-header__mark" aria-hidden />
          <span className="cw-v2-header__name">ChronoWalk</span>
        </a>

        <nav className="cw-v2-header__nav" aria-label="Primary">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="cw-v2-header__link">
              {item.label}
            </a>
          ))}
        </nav>

        <a href="#pricing" className="cw-v2-header__cta">
          {cta}
        </a>
      </div>
    </header>
  )
}
