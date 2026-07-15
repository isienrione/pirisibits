import { LANDING_CONTENT } from './landingData.js'

/**
 * Act III — research posture only.
 * Phase 9: no feature bullets here (those live once under `#benefits`).
 */
export default function LandingTrustProofSection() {
  const section = LANDING_CONTENT.trust

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-section--raised cw-v2-trust"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap cw-v2-wrap--narrow">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
          {section.subheadline ? <p className="cw-v2-section__lead">{section.subheadline}</p> : null}
        </header>
      </div>
    </section>
  )
}
