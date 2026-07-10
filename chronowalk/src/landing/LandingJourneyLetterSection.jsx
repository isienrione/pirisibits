import { LANDING_CONTENT } from './landingData.js'

export default function LandingJourneyLetterSection() {
  const { id, eyebrow, headline, preview } = LANDING_CONTENT.letter

  return (
    <section id={id} className="cw-v2-section cw-v2-letter" aria-labelledby={`${id}-heading`}>
      <div className="cw-v2-wrap cw-v2-wrap--narrow">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{eyebrow}</p>
          <h2 id={`${id}-heading`} className="cw-v2-section__title">
            {headline}
          </h2>
        </header>

        <article className="cw-v2-letter-card" aria-label="Journey letter preview">
          <header className="cw-v2-letter-card__bar">
            <p>{preview.label}</p>
          </header>
          <div className="cw-v2-letter-card__body">
            <p className="cw-v2-letter-card__date">{preview.date}</p>
            <p className="cw-v2-letter-card__reflection">{preview.reflection}</p>
            <div className="cw-v2-letter-card__stats">
              {preview.stats.map((stat) => (
                <div key={stat.label} className="cw-v2-letter-card__stat">
                  <p className="cw-v2-letter-card__stat-value">{stat.value}</p>
                  <p className="cw-v2-letter-card__stat-label">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
