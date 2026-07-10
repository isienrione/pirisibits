import { LANDING_CONTENT } from './landingData.js'

export default function LandingSiteHeader({ onPreview }) {
  const { nav, cta, ctaShort = 'Try free' } = LANDING_CONTENT.header

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

        {onPreview ? (
          <button type="button" className="cw-v2-header__cta" onClick={onPreview}>
            <span className="cw-v2-header__cta-label cw-v2-header__cta-label--long">{cta}</span>
            <span className="cw-v2-header__cta-label cw-v2-header__cta-label--short">{ctaShort}</span>
          </button>
        ) : (
          <a href="#try-free" className="cw-v2-header__cta">
            <span className="cw-v2-header__cta-label cw-v2-header__cta-label--long">{cta}</span>
            <span className="cw-v2-header__cta-label cw-v2-header__cta-label--short">{ctaShort}</span>
          </a>
        )}
      </div>
    </header>
  )
}
