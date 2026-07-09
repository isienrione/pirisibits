import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingRescueSection() {
  const { id, headline, copy } = LANDING_CONTENT.rescue

  return (
    <LandingSection id={id} title={headline} variant="dark">
      <p className="cw-landing-lead">{copy}</p>
    </LandingSection>
  )
}
