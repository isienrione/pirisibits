import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingSocialProofSection() {
  const { id, headline, quotes } = LANDING_CONTENT['social-proof']

  return (
    <LandingSection id={id} title={headline} variant="bone">
      <div className="cw-landing-quotes">
        {quotes.map((quote) => (
          <blockquote key={quote} className="cw-landing-quote">
            <p>“{quote}”</p>
          </blockquote>
        ))}
      </div>
    </LandingSection>
  )
}
