import { LANDING_CONTENT } from './landingData.js'

/**
 * Act III — Why ChronoWalk (Phase 12).
 * Promise-led distinctions — no competitor matrix, no named rivals.
 */
export default function LandingWhyChronoWalkSection() {
  const section = LANDING_CONTENT.why

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-section--raised cw-v2-why"
      aria-labelledby={`${section.id}-heading`}
    >
      {/* Legacy hash from the retired comparison matrix */}
      <div id="compare" className="cw-landing-deeplink-anchor" tabIndex={-1} aria-hidden="true" />

      <div className="cw-v2-wrap cw-v2-wrap--narrow">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title cw-v2-why__title">
            {section.headline}
          </h2>
        </header>

        <ul className="cw-v2-why__list" aria-label="Why ChronoWalk">
          {section.points.map((point, index) => (
            <li key={point} className="cw-v2-why__item">
              {index > 0 ? <span className="cw-v2-why__seam" aria-hidden="true" /> : null}
              <p className="cw-v2-why__point">{point}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
