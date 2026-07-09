import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingCredibilitySection() {
  const { id, headline, copy, trustMarkers } = LANDING_CONTENT.credibility

  return (
    <LandingSection id={id} title={headline} variant="bone">
      <p className="cw-landing-lead">{copy}</p>
      <ul className="cw-landing-trust-list">
        {trustMarkers.map((marker) => (
          <li key={marker}>{marker}</li>
        ))}
      </ul>
    </LandingSection>
  )
}
