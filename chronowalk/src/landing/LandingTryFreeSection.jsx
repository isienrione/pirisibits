import { LANDING_CONTENT } from './landingData.js'
import LandingLivePhoneMockup from './LandingLivePhoneMockup.jsx'

export default function LandingTryFreeSection({ onPreview }) {
  const section = LANDING_CONTENT['try-free']

  return (
    <section id={section.id} className="cw-v2-section cw-v2-try-free" aria-labelledby={`${section.id}-heading`}>
      <div className="cw-v2-wrap cw-v2-wrap--narrow">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
          <p className="cw-v2-section__lead">{section.subheadline}</p>
        </header>

        <article className="cw-v2-try-free__card">
          <div className="cw-v2-try-free__visual">
            <LandingLivePhoneMockup variant="audio" />
          </div>
          <div className="cw-v2-try-free__copy">
            <h3 className="cw-v2-try-free__card-title">{section.card.title}</h3>
            <p className="cw-v2-try-free__card-meta">{section.card.meta}</p>
            <p className="cw-v2-try-free__card-body">{section.card.copy}</p>
            <div className="cw-v2-try-free__actions">
              {onPreview ? (
                <button type="button" className="cw-v2-btn cw-v2-btn--coral" onClick={onPreview}>
                  {section.primaryCta}
                </button>
              ) : null}
              <a href="#pricing" className="cw-v2-btn cw-v2-btn--outline">
                {section.secondaryCta}
              </a>
            </div>
            <p className="cw-v2-try-free__trust">{section.trustLine}</p>
          </div>
        </article>
      </div>
    </section>
  )
}
