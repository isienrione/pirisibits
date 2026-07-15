import { LANDING_CONTENT } from './landingData.js'
import { LANDING_ENDING } from './landingVisualAssets.js'
import { LandingResponsivePicture } from './LandingResponsivePicture.jsx'

/**
 * Act III — final cinematic CTA (Prompt 16).
 * Film-frame leave-taking: full-bleed Rome, dark veil, gold seam, quiet CTAs.
 * Primary → /preview (landing_cta_preview); secondary → #pricing.
 */
export default function LandingFinalCtaSectionV2({ onPreview }) {
  const section = LANDING_CONTENT['final-cta']
  const image = LANDING_ENDING
  const bodyLines = section.bodyLines ?? (section.body ? [section.body] : [])

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-ending"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-ending__seam" aria-hidden="true" />

      <div className="cw-v2-ending__stage">
        <div className="cw-v2-ending__media" aria-hidden={image.alt ? undefined : true}>
          <LandingResponsivePicture image={image} className="cw-v2-ending__img" loading="lazy" />
        </div>

        <div className="cw-v2-ending__veil" aria-hidden="true" />

        <div className="cw-v2-wrap cw-v2-wrap--narrow cw-v2-ending__copy">
          <h2 id={`${section.id}-heading`} className="cw-v2-ending__headline">
            {section.headline}
          </h2>

          <div className="cw-v2-ending__gold" aria-hidden="true" />

          {bodyLines.length > 0 ? (
            <div className="cw-v2-ending__body">
              {bodyLines.map((line) => (
                <p key={line} className="cw-v2-ending__body-line">
                  {line}
                </p>
              ))}
            </div>
          ) : null}

          <div className="cw-v2-ending__actions">
            {onPreview ? (
              <button
                type="button"
                className="cw-v2-btn cw-v2-btn--coral cw-v2-ending__cta"
                onClick={onPreview}
              >
                {section.primaryCta}
              </button>
            ) : null}
            <a href="#pricing" className="cw-v2-btn cw-v2-btn--outline cw-v2-ending__cta-secondary">
              {section.secondaryCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
