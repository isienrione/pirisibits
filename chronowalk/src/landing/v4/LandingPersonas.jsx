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
 * Real-moment situations as a horizontal snap carousel —
 * large photography, one emotional beat, one CTA per slide.
 */
export default function LandingPersonas({
  onPreview,
  section = LANDING_CONTENT.personas,
}) {
  const items = section.items ?? []

  return (
    <section
      id={section.id}
      className="cw-v4-personas"
      aria-labelledby="cw-v4-personas-heading"
    >
      <div className="cw-v4-wrap">
        <header className="cw-v4-section-head">
          {section.eyebrow ? <p className="cw-v4-eyebrow">{section.eyebrow}</p> : null}
          <h2 id="cw-v4-personas-heading" className="cw-v4-section-title">
            {section.headline}
          </h2>
          {section.subheadline ? (
            <p className="cw-v4-section-lead">{section.subheadline}</p>
          ) : null}
        </header>
      </div>

      <div
        className="cw-v4-personas__scroller"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={section.headline || 'Real moments in Rome'}
      >
        <div className="cw-v4-personas__track">
          {items.map((item, index) => {
            const image =
              REAL_MOMENT[item.imageKey] ||
              LANDING_V2.lifestyleCouple ||
              REAL_MOMENT.pantheon
            const isPreview = Boolean(item.preview)

            return (
              <article
                key={item.id}
                className="cw-v4-persona-slide"
                aria-label={`${index + 1} of ${items.length}: ${item.headline}`}
              >
                <img
                  className="cw-v4-persona-slide__image"
                  src={image}
                  alt=""
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index === 0 ? 'high' : undefined}
                  draggable={false}
                />
                <div className="cw-v4-persona-slide__meta">
                  <p className="cw-v4-persona-slide__index">
                    {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                  </p>
                  <h3 className="cw-v4-persona-slide__title">{item.headline}</h3>
                  <p className="cw-v4-persona-slide__body">{item.body}</p>
                  {isPreview && onPreview ? (
                    <button
                      type="button"
                      className="cw-v4-persona-slide__cta"
                      onClick={onPreview}
                    >
                      {item.cta}
                    </button>
                  ) : (
                    <a href={item.href ?? '#pricing'} className="cw-v4-persona-slide__cta">
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
