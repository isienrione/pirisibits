import { LANDING_CONTENT } from '../landingData.js'

/**
 * Compact factual reassurance strip directly under the hero.
 * Noninteractive — no invented social proof.
 */
export default function LandingHeroReassurance() {
  const section = LANDING_CONTENT.heroReassurance
  const items = section?.items ?? []
  if (!items.length) return null

  return (
    <section
      id={section.id}
      className="cw-v4-reassure"
      aria-label="Why ChronoWalk is easy to start"
    >
      <div className="cw-v4-wrap">
        <ul className="cw-v4-reassure__list">
          {items.map((item) => (
            <li key={item.id} className="cw-v4-reassure__item">
              <span className="cw-v4-reassure__mark" aria-hidden="true" />
              <div className="cw-v4-reassure__copy">
                <p className="cw-v4-reassure__label">{item.label}</p>
                <p className="cw-v4-reassure__support">{item.support}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
