import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingCredibilitySection() {
  const { id, headline, copy } = LANDING_CONTENT.credibility

  return (
    <LandingSection id={id} title={headline} variant="bone">
      <p className="cw-landing-lead">{copy}</p>
    </LandingSection>
  )
}
