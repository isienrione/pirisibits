import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT, ROME_JOURNEY_SECTION_ID } from './landingData.js'

const ROUTE_POINTS = [
  { label: 'Colosseum', x: 18, y: 72, day: 1 },
  { label: 'Roman Forum', x: 34, y: 58, day: 1 },
  { label: 'Pantheon', x: 52, y: 42, day: 1 },
  { label: 'Trevi', x: 68, y: 52, day: 2 },
  { label: 'Spanish Steps', x: 82, y: 30, day: 2 },
]

function RouteArtifact() {
  const pathD = 'M 18 72 C 28 64, 30 50, 34 58 S 48 48, 52 42 S 62 48, 68 52 S 76 40, 82 30'

  return (
    <div className="cw-landing-route-artifact" aria-hidden>
      <div className="cw-landing-route-artifact__labels">
        <span>Day One</span>
        <span>Day Two</span>
      </div>
      <svg viewBox="0 0 100 80" className="cw-landing-route-artifact__svg" preserveAspectRatio="none">
        <path d={pathD} className="cw-landing-route-artifact__path" fill="none" />
        {ROUTE_POINTS.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="2.2" className="cw-landing-route-artifact__dot" />
          </g>
        ))}
      </svg>
      <ul className="cw-landing-route-artifact__legend">
        {ROUTE_POINTS.map((point) => (
          <li key={point.label}>{point.label}</li>
        ))}
      </ul>
    </div>
  )
}

export default function LandingRomeJourneySection({ priceLabel, onBegin, onPreview }) {
  const section = LANDING_CONTENT[ROME_JOURNEY_SECTION_ID]

  return (
    <LandingSection id={section.id} title={section.headline} variant="dark">
      <p className="cw-landing-lead">{section.subheadline}</p>
      <article className="cw-landing-product-card">
        <div className="cw-landing-product-card__header">
          <h3 className="cw-landing-product-card__title">{section.productTitle}</h3>
          <p className="cw-landing-product-card__price">{priceLabel}</p>
        </div>
        <RouteArtifact />
        <ul className="cw-landing-product-card__bullets">
          {section.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="cw-landing-actions">
          <button type="button" className="cw-landing-btn cw-landing-btn--coral" onClick={onBegin}>
            {section.primaryCta}
          </button>
          <button type="button" className="cw-landing-btn cw-landing-btn--ghost" onClick={onPreview}>
            {section.secondaryCta}
          </button>
        </div>
      </article>
    </LandingSection>
  )
}
