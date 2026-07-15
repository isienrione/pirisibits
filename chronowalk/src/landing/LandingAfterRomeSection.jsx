import { LANDING_CONTENT } from './landingData.js'

/**
 * Act III — After Rome (journey letter / memory beat).
 * No invented distances, counts, or percentages — reflection copy only.
 */
export default function LandingAfterRomeSection() {
  const section = LANDING_CONTENT['after-rome']

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-after-rome"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap cw-v2-wrap--narrow">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
        </header>

        <article className="cw-v2-letter-card" aria-label={section.previewLabel}>
          <header className="cw-v2-letter-card__bar">
            <p>{section.previewLabel}</p>
          </header>
          <div className="cw-v2-letter-card__body">
            <p className="cw-v2-letter-card__reflection">{section.reflection}</p>
            {section.closing ? <p className="cw-v2-after-rome__closing">{section.closing}</p> : null}
          </div>
        </article>
      </div>
    </section>
  )
}
