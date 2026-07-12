import { LANDING_CONTENT } from './landingData.js'
import { LANDING_V2 } from './landingVisualAssets.js'

export default function LandingThresholdSection() {
  const section = LANDING_CONTENT.threshold

  return (
    <section id={section.id} className="cw-v2-section cw-v2-threshold" aria-labelledby={`${section.id}-heading`}>
      <div className="cw-v2-wrap cw-v2-threshold__grid">
        <div className="cw-v2-threshold__copy">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
          <p className="cw-v2-section__lead">{section.subheadline}</p>
          <ul className="cw-v2-bullet-list">
            {section.bullets.map((item) => (
              <li key={item} className="cw-v2-bullet-list__item">
                <span className="cw-v2-bullet-list__dot cw-v2-bullet-list__dot--coral" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="cw-v2-threshold__visual">
          <div className="cw-v2-threshold__frame">
            <img
              src={LANDING_V2.threshold}
              alt="A ruined Roman temple morphing into its vivid ancient reconstruction"
              className="cw-v2-threshold__image"
              loading="lazy"
            />
            <span className="cw-v2-threshold__hold">{section.holdLabel}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
