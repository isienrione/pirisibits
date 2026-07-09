import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingNoItinerarySection({ onScrollToProduct }) {
  const { id, headline, paragraphs, cta } = LANDING_CONTENT['no-perfect-itinerary']

  return (
    <LandingSection id={id} title={headline} variant="dark">
      {paragraphs.map((para) => (
        <p key={para.slice(0, 24)} className="cw-landing-lead">{para}</p>
      ))}
      <button type="button" className="cw-landing-btn cw-landing-btn--link-inline" onClick={onScrollToProduct}>
        {cta}
      </button>
    </LandingSection>
  )
}
