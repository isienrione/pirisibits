import { LANDING_CONTENT } from './landingData.js'

/** Act I — early conversion band after Threshold (preview + pricing). */
export default function LandingEarlyCtaSection({ onPreview }) {
  const section = LANDING_CONTENT['early-cta']

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-early-cta"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap cw-v2-wrap--narrow cw-v2-early-cta__inner">
        <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
          {section.headline}
        </h2>
        {section.subheadline ? <p className="cw-v2-section__lead">{section.subheadline}</p> : null}
        <div className="cw-v2-early-cta__actions">
          {onPreview ? (
            <button type="button" className="cw-v2-btn cw-v2-btn--coral" onClick={onPreview}>
              {section.primaryCta}
            </button>
          ) : (
            <a href="#try-free" className="cw-v2-btn cw-v2-btn--coral">
              {section.primaryCta}
            </a>
          )}
          <a href="#pricing" className="cw-v2-btn cw-v2-btn--outline">
            {section.secondaryCta}
          </a>
        </div>
        {section.hint ? <p className="cw-v2-early-cta__hint">{section.hint}</p> : null}
      </div>
    </section>
  )
}
