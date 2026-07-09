import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingHowItWorksSection() {
  const { id, headline, steps } = LANDING_CONTENT['how-it-works']

  return (
    <LandingSection id={id} title={headline} variant="dark">
      <ol className="cw-landing-steps">
        {steps.map((step, index) => (
          <li key={step.title} className="cw-landing-steps__item">
            <span className="cw-landing-steps__num" aria-hidden>
              {index + 1}
            </span>
            <div>
              <h3 className="cw-landing-steps__title">{step.title}</h3>
              <p>{step.copy}</p>
            </div>
          </li>
        ))}
      </ol>
    </LandingSection>
  )
}
