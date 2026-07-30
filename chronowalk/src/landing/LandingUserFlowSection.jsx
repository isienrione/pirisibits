import { LANDING_CONTENT } from './landingData.js'
import LandingLivePhoneMockup from './LandingLivePhoneMockup.jsx'

/**
 * Act II · How it works as a sequential path (connected steps).
 * Realistic phone frames with product screens lead each step.
 */
export default function LandingUserFlowSection() {
  const section = LANDING_CONTENT['user-flow']
  const more = section.more
  const steps = section.steps ?? []

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-section--raised cw-v2-user-flow cw-v2-user-flow--essential cw-v2-user-flow--path"
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

        <ol className="cw-v2-user-flow__track" aria-label="Three steps to walk Rome">
          {steps.map((step, index) => (
            <li key={step.title} className="cw-v2-user-flow__step">
              {index > 0 ? (
                <span className="cw-v2-user-flow__path" aria-hidden="true">
                  <span className="cw-v2-user-flow__path-line" />
                </span>
              ) : null}
              <article className="cw-v2-user-flow__card">
                <div className="cw-v2-user-flow__node" aria-hidden="true">
                  <span className="cw-v2-user-flow__node-ring">{step.step}</span>
                </div>
                <div className="cw-v2-user-flow__device" aria-hidden="true">
                  <LandingLivePhoneMockup variant={step.mockup} size="xl" />
                </div>
                <h3 className="cw-v2-user-flow__title">{step.title}</h3>
                <p className="cw-v2-user-flow__body">{step.body}</p>
              </article>
            </li>
          ))}
        </ol>

        {more ? (
          <details className="cw-v2-user-flow__more">
            <summary className="cw-v2-user-flow__more-summary">{more.summary}</summary>
            <ul className="cw-v2-user-flow__more-list">
              {more.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {more.thresholdHref ? (
              <p className="cw-v2-user-flow__more-link">
                <a href={more.thresholdHref}>{more.thresholdLabel}</a>
              </p>
            ) : null}
          </details>
        ) : null}
      </div>
    </section>
  )
}
