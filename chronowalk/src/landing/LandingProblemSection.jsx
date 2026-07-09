import { Seam } from '../redesign/ui/index.js'
import { viaSacraNow } from '../redesign/images.js'
import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingProblemSection() {
  const { id, headline, paragraphs } = LANDING_CONTENT.problem

  return (
    <LandingSection id={id} title={headline} variant="bone">
      <div className="cw-landing-problem">
        <div className="cw-landing-problem__copy">
          {paragraphs.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>
        <div className="cw-landing-problem__visual" aria-hidden>
          <img src={viaSacraNow} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <Seam />
        </div>
      </div>
    </LandingSection>
  )
}
