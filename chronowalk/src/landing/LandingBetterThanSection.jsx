import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingBetterThanSection() {
  const { id, headline, cards } = LANDING_CONTENT['better-than']

  return (
    <LandingSection id={id} title={headline} variant="bone">
      <div className="cw-landing-card-grid cw-landing-card-grid--quad">
        {cards.map((card) => (
          <article key={card.title} className="cw-landing-editorial-card">
            <h3 className="cw-landing-editorial-card__title">{card.title}</h3>
            <p>{card.copy}</p>
          </article>
        ))}
      </div>
    </LandingSection>
  )
}
