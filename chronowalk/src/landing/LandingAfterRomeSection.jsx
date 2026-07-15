import { LANDING_CONTENT } from './landingData.js'
import { LANDING_AFTER_ROME } from './landingVisualAssets.js'

/**
 * Act III — After Rome (Prompt 14).
 * Cinematic memory beat before FAQ: purchase → memory, not stats or product UI.
 */
export default function LandingAfterRomeSection() {
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
          <picture>
            <source media="(min-width: 48rem)" srcSet={image.desktopSrc} width={image.desktopWidth} height={image.desktopHeight} />
            <img
              className="cw-v2-after-rome__img"
              src={image.mobileSrc}
              width={image.mobileWidth}
              height={image.mobileHeight}
              alt={image.alt || ''}
              loading="lazy"
              decoding="async"
              style={image.lqipSrc ? { backgroundImage: `url(${image.lqipSrc})`, backgroundSize: 'cover' } : undefined}
            />
          </picture>
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
              <a href={section.linkHref} className="cw-v2-after-rome__link">
                {section.linkLabel}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
