import { LANDING_CONTENT } from '../landingData.js'
import { LANDING_V2 } from '../landingVisualAssets.js'

const REAL_MOMENT = {
  street: '/landing/real-moment/street.jpg',
  pantheon: '/landing/real-moment/pantheon.jpg',
  wander: '/landing/real-moment/wander.jpg',
  forum: '/landing/real-moment/forum.jpg',
  /** Free centro storico landmark for the sold-out Colosseum situation. */
  trevi: '/waypoints/fontana-di-trevi/modern-poster.jpg',
}

/**
 * Situation-led personas — large photography, one emotional sentence, one CTA.
 */
export default function LandingPersonas({ onPreview }) {
  const section = LANDING_CONTENT.personas
  const items = section.items ?? []

  return (
    <section
      id={section.id}
      className="cw-v4-personas"
      aria-labelledby="cw-v4-personas-heading"
    >
      <div className="cw-v4-wrap">
        <header className="cw-v4-section-head">
          <p className="cw-v4-eyebrow">{section.eyebrow}</p>
          <h2 id="cw-v4-personas-heading" className="cw-v4-section-title">
            {section.headline}
          </h2>
          {section.subheadline ? (
            <p className="cw-v4-section-lead">{section.subheadline}</p>
          ) : null}
        </header>

        <div className="cw-v4-personas__grid">
          {items.map((item) => {
            const image =
              REAL_MOMENT[item.imageKey] ||
              LANDING_V2.lifestyleCouple ||
              REAL_MOMENT.pantheon
            const isPreview = Boolean(item.preview)

            return (
              <article key={item.id} className="cw-v4-persona">
                <div className="cw-v4-persona__media">
                  <img src={image} alt="" loading="lazy" decoding="async" />
                </div>
                <div className="cw-v4-persona__copy">
                  <h3 className="cw-v4-persona__title">{item.headline}</h3>
                  <p className="cw-v4-persona__body">{item.body}</p>
                  {isPreview && onPreview ? (
                    <button
                      type="button"
                      className="cw-v4-persona__cta"
                      onClick={onPreview}
                    >
                      {item.cta}
                    </button>
                  ) : (
                    <a href={item.href ?? '#pricing'} className="cw-v4-persona__cta">
                      {item.cta}
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
