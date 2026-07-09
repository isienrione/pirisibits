import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingCorePromiseSection() {
  const { id, headline, subcopy, cards } = LANDING_CONTENT['core-promise']

  return (
    <LandingSection id={id} title={headline} variant="bone">
      <p className="cw-landing-lead">{subcopy}</p>
      <div className="cw-landing-card-grid">
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
