import ChronoWalkLogo from '../redesign/ui/ChronoWalkLogo.jsx'
import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingJourneyLetterSection() {
  const { id, headline, copy, mockLetter } = LANDING_CONTENT['journey-letter']

  return (
    <LandingSection id={id} title={headline} variant="dark">
      <p className="cw-landing-lead">{copy}</p>
      <article className="cw-landing-letter-card">
        <div className="cw-landing-letter-card__glow" aria-hidden />
        <svg className="cw-landing-letter-card__seam" viewBox="0 0 200 120" aria-hidden preserveAspectRatio="none">
          <path
            d="M 8 96 C 40 88, 52 40, 88 56 S 120 72, 148 44 S 176 28, 192 18"
            fill="none"
          />
        </svg>
        <header className="cw-landing-letter-card__head">
          <ChronoWalkLogo size={18} />
          <span>{mockLetter.date}</span>
        </header>
        <p className="cw-landing-letter-card__reflection">{mockLetter.reflection}</p>
        <p className="cw-landing-letter-card__stats">{mockLetter.stats}</p>
      </article>
    </LandingSection>
  )
}
