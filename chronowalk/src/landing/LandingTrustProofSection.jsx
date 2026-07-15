import { LANDING_CONTENT } from './landingData.js'

/**
 * Act III — selected trust / proof.
 * Product differentiators and research posture only — no reviews, ratings, or invented metrics.
 */
export default function LandingTrustProofSection() {
  const section = LANDING_CONTENT.trust

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-section--raised cw-v2-trust"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
          {section.subheadline ? <p className="cw-v2-section__lead">{section.subheadline}</p> : null}
        </header>

        <ul className="cw-v2-trust__list">
          {section.items.map((item) => (
            <li key={item.title} className="cw-v2-trust__item">
              <h3 className="cw-v2-trust__title">{item.title}</h3>
              <p className="cw-v2-trust__body">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
