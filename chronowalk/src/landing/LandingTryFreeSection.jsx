import { LANDING_CONTENT } from './landingData.js'
import LandingLivePhoneMockup from './LandingLivePhoneMockup.jsx'

/**
 * Act II - free Pantheon preview.
 * One mockup, sharp offer framing, same preview handoff + analytics as other CTAs.
 */
export default function LandingTryFreeSection({ onPreview, onRoutes }) {
  const section = LANDING_CONTENT['try-free']
  const headingId = `${section.id}-heading`
  const scopeId = `${section.id}-scope`

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-try-free"
      aria-labelledby={headingId}
      aria-describedby={scopeId}
    >
      <div className="cw-v2-wrap">
        <div className="cw-v2-try-free__layout">
          <div className="cw-v2-try-free__copy">
            <header className="cw-v2-try-free__header">
              <p className="cw-v2-eyebrow">{section.eyebrow}</p>
              <h2 id={headingId} className="cw-v2-section__title cw-v2-try-free__title">
                {section.headline}
              </h2>
              <p className="cw-v2-section__lead cw-v2-try-free__body">{section.subheadline}</p>
            </header>

            <p id={scopeId} className="cw-v2-try-free__scope">
              <span className="cw-v2-try-free__scope-in">{section.included}</span>
              <span className="cw-v2-try-free__scope-out">{section.notIncluded}</span>
            </p>

            <div className="cw-v2-try-free__actions">
              {onPreview ? (
                <button
                  type="button"
                  className="cw-v2-btn cw-v2-btn--coral cw-v2-try-free__cta"
                  onClick={onPreview}
                >
                  {section.primaryCta}
                </button>
              ) : null}
              <a href="#pricing" className="cw-v2-btn cw-v2-btn--outline" onClick={() => onRoutes?.()}>
                {section.secondaryCta}
              </a>
            </div>

            <p className="cw-v2-try-free__trust">{section.trustLine}</p>
          </div>

          <figure className="cw-v2-try-free__visual" aria-label="ChronoWalk phone showing the Pantheon audio stop">
            <LandingLivePhoneMockup variant="preview" size="lg" />
            <figcaption className="cw-v2-try-free__caption">{section.card.meta}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
