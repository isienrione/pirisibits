import { LANDING_CONTENT } from './landingData.js'
import { LANDING_AFTER_ROME } from './landingVisualAssets.js'
import { LandingResponsivePicture } from './LandingResponsivePicture.jsx'

/**
 * Act III — After Rome (Prompt 14).
 * Cinematic memory beat before FAQ: purchase → memory, not stats or product UI.
 */
export default function LandingAfterRomeSection({ onRoutes }) {
  const section = LANDING_CONTENT['after-rome']
  const lines = section.headlineLines ?? [section.headline]
  const image = LANDING_AFTER_ROME

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-after-rome"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-after-rome__stage">
        <div className="cw-v2-after-rome__media" aria-hidden={image.alt ? undefined : true}>
          <LandingResponsivePicture image={image} className="cw-v2-after-rome__img" loading="lazy" />
        </div>

        <div className="cw-v2-after-rome__veil" aria-hidden="true" />

        <div className="cw-v2-wrap cw-v2-wrap--narrow cw-v2-after-rome__copy">
          <header className="cw-v2-after-rome__header">
            <p className="cw-v2-eyebrow cw-v2-after-rome__eyebrow">{section.eyebrow}</p>
            <h2 id={`${section.id}-heading`} className="cw-v2-after-rome__verse">
              {lines.map((line, index) => (
                <span
                  key={line}
                  className={
                    index === lines.length - 1
                      ? 'cw-v2-after-rome__line cw-v2-after-rome__line--memory'
                      : 'cw-v2-after-rome__line'
                  }
                >
                  {line}
                </span>
              ))}
            </h2>
          </header>

          {section.body ? <p className="cw-v2-after-rome__body">{section.body}</p> : null}

          {section.linkHref && section.linkLabel ? (
            <p className="cw-v2-after-rome__link-wrap">
              <a href={section.linkHref} className="cw-v2-after-rome__link" onClick={() => onRoutes?.()}>
                {section.linkLabel}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
