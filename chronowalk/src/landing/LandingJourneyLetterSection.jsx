import ChronoWalkLogo from '../redesign/ui/ChronoWalkLogo.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingJourneyLetterSection() {
  const { id, headline, copy, preview } = LANDING_CONTENT.letter

  return (
    <section id={id} className="cw-gallery-section cw-gallery-section--obsidian cw-gallery-letter" aria-labelledby={`${id}-heading`}>
      <div className="cw-landing-wrap cw-gallery-section__inner">
        <h2 id={`${id}-heading`} className="cw-gallery-section__title">
          {headline}
        </h2>
        <p className="cw-gallery-letter__lead">{copy}</p>

        <article className="cw-gallery-letter-card" aria-label="Journey letter preview">
          <div className="cw-gallery-letter-card__glow" aria-hidden />
          <header className="cw-gallery-letter-card__head">
            <ChronoWalkLogo size={16} />
            <time dateTime="2026-08-12">{preview.date}</time>
          </header>
          <blockquote className="cw-gallery-letter-card__reflection">
            <p>{preview.reflection}</p>
          </blockquote>
          <footer className="cw-gallery-letter-card__stats">{preview.stats}</footer>
        </article>
      </div>
    </section>
  )
}
