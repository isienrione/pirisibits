import { LANDING_CONTENT } from './landingData.js'

/** Act I · early conversion band immediately under Threshold. */
export default function LandingEarlyCtaSection({ onPreview }) {
  const section = LANDING_CONTENT['early-cta']

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-early-cta cw-v2-early-cta--compact"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap cw-v2-wrap--narrow cw-v2-early-cta__inner">
        <h2 id={`${section.id}-heading`} className="cw-v2-sr-only">
          {section.headline || section.primaryCta}
        </h2>
        <div className="cw-v2-early-cta__actions">
          {onPreview ? (
            <button type="button" className="cw-v2-btn cw-v2-btn--outline cw-v2-early-cta__btn" onClick={onPreview}>
              {section.primaryCta}
            </button>
          ) : (
            <a href="#try-free" className="cw-v2-btn cw-v2-btn--outline cw-v2-early-cta__btn">
              {section.primaryCta}
            </a>
          )}
          {section.secondaryCta ? (
            <a href="#pricing" className="cw-v2-btn cw-v2-btn--outline">
              {section.secondaryCta}
            </a>
          ) : null}
        </div>
        {section.hint ? <p className="cw-v2-early-cta__hint">{section.hint}</p> : null}
      </div>
    </section>
  )
}
