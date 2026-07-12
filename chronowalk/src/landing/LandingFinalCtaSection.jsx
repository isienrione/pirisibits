import { LANDING_CONTENT } from './landingData.js'

export default function LandingFinalCtaSection({ onBegin, onPreview }) {
  const { id, headline, primaryCta, secondaryCta, footer } = LANDING_CONTENT['final-cta']

  return (
    <section id={id} className="cw-doc-section cw-doc-section--obsidian cw-doc-final" aria-labelledby={`${id}-heading`}>
      <div className="cw-landing-wrap cw-doc-section__inner cw-doc-final__inner">
        <h2 id={`${id}-heading`} className="cw-doc-headline cw-doc-headline--light cw-doc-final__headline">
          {headline}
        </h2>

        <div className="cw-doc-actions cw-doc-actions--stack cw-doc-actions--center">
          <button type="button" className="cw-landing-btn cw-landing-btn--coral" onClick={onBegin}>
            {primaryCta}
          </button>
          <button type="button" className="cw-landing-btn cw-landing-btn--ghost" onClick={onPreview}>
            {secondaryCta}
          </button>
        </div>

        <footer className="cw-doc-footer">
          <p>{footer}</p>
        </footer>
      </div>
    </section>
  )
}
