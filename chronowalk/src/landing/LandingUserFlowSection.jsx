import { LANDING_CONTENT } from './landingData.js'
import LandingLivePhoneMockup from './LandingLivePhoneMockup.jsx'

export default function LandingUserFlowSection() {
  const section = LANDING_CONTENT['user-flow']

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-section--raised cw-v2-user-flow"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
          <p className="cw-v2-section__lead">{section.subheadline}</p>
        </header>

        <ol className="cw-v2-user-flow__track">
          {section.steps.map((step, index) => (
            <li key={step.title} className="cw-v2-user-flow__step">
              {index > 0 ? (
                <span className="cw-v2-user-flow__connector" aria-hidden>
                  →
                </span>
              ) : null}
              <article className="cw-v2-user-flow__card">
                <LandingLivePhoneMockup variant={step.mockup} compact />
                <span className="cw-v2-user-flow__step-num">{step.step}</span>
                <h3 className="cw-v2-user-flow__title">{step.title}</h3>
                <p className="cw-v2-user-flow__body">{step.body}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
