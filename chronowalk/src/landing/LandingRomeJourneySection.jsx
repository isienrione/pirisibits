import LandingRouteSchematic from './LandingRouteSchematic.jsx'
import { LANDING_CONTENT, ROME_JOURNEY_SECTION_ID } from './landingData.js'

export default function LandingRomeJourneySection({ priceLabel, onBegin, onPreview }) {
  const section = LANDING_CONTENT[ROME_JOURNEY_SECTION_ID]
  const bullets = section.highlightBullets ?? section.bullets

  return (
    <section
      id={section.id}
      className="cw-doc-section cw-doc-section--obsidian cw-doc-rome"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-landing-wrap cw-doc-section__inner cw-doc-section__inner--theater">
        <h2 id={`${section.id}-heading`} className="cw-doc-rome__headline">
          {section.headline}
        </h2>

        <article className="cw-doc-rome-artifact">
          <header className="cw-doc-rome-artifact__header">
            <p className="cw-doc-rome-artifact__eyebrow">{section.productTitle}</p>
          </header>

          <LandingRouteSchematic stops={section.routeStops} variant="artifact" />

          <ul className="cw-doc-rome-artifact__bullets">
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="cw-doc-rome-artifact__convert">
            <button
              type="button"
              className="cw-landing-btn cw-landing-btn--coral cw-landing-btn--glow cw-doc-rome-artifact__begin"
              onClick={onBegin}
            >
              {section.primaryCta}
            </button>
            <span className="cw-doc-rome-artifact__price">{priceLabel}</span>
          </div>

          <button type="button" className="cw-doc-rome-artifact__preview" onClick={onPreview}>
            {section.secondaryCta} →
          </button>
        </article>
      </div>
    </section>
  )
}
