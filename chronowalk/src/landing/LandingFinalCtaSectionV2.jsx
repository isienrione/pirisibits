import { LANDING_CONTENT } from './landingData.js'

export default function LandingFinalCtaSectionV2({ onPreview }) {
  const section = LANDING_CONTENT['final-cta']

  return (
    <section id={section.id} className="cw-v2-section cw-v2-final-cta" aria-labelledby={`${section.id}-heading`}>
      <div className="cw-v2-wrap cw-v2-wrap--narrow cw-v2-final-cta__inner">
        <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
          {section.headline}
        </h2>
        <div className="cw-v2-final-cta__actions">
          {onPreview ? (
            <button type="button" className="cw-v2-btn cw-v2-btn--coral" onClick={onPreview}>
              {section.primaryCta}
            </button>
          ) : null}
          <a href="#pricing" className="cw-v2-btn cw-v2-btn--outline">
            {section.secondaryCta}
          </a>
        </div>
        <p className="cw-v2-final-cta__footer">{section.footer}</p>
      </div>
    </section>
  )
}
