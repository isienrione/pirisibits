import { LANDING_CONTENT } from './landingData.js'

function formatStep(index) {
  return String(index + 1).padStart(2, '0')
}

export default function LandingHowItWorksSection() {
  const { id, headline, steps } = LANDING_CONTENT['how-it-works']

  return (
    <section id={id} className="cw-doc-section cw-doc-section--obsidian cw-doc-steps" aria-labelledby={`${id}-heading`}>
      <div className="cw-landing-wrap cw-doc-section__inner cw-doc-section__inner--theater">
        <h2 id={`${id}-heading`} className="cw-doc-steps__headline">
          {headline}
        </h2>
        <ol className="cw-doc-steps-grid">
          {steps.map((step, index) => (
            <li key={step.title} className="cw-doc-step">
              <span className="cw-doc-step__num" aria-hidden>
                {formatStep(index)}
              </span>
              <div className="cw-doc-step__copy">
                <h3 className="cw-doc-step__title">{step.title}</h3>
                <p className="cw-doc-step__body">{step.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
