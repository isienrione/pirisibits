import { LANDING_CONTENT } from './landingData.js'
import LandingLivePhoneMockup from './LandingLivePhoneMockup.jsx'

/** Act II — three essential steps (copy-led; phones stay supporting). */
export default function LandingUserFlowSection() {
  const section = LANDING_CONTENT['user-flow']

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-section--raised cw-v2-user-flow cw-v2-user-flow--essential"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
          {section.subheadline ? (
            <p className="cw-v2-section__lead">{section.subheadline}</p>
          ) : null}
        </header>

        <ol className="cw-v2-user-flow__track">
          {section.steps.map((step) => (
            <li key={step.title} className="cw-v2-user-flow__step">
              <article className="cw-v2-user-flow__card">
                <div className="cw-v2-user-flow__device" aria-hidden="true">
                  <LandingLivePhoneMockup variant={step.mockup} compact />
                </div>
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
