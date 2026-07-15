import { LANDING_CONTENT } from './landingData.js'

/**
 * Act I — cinematic emotional interlude.
 * Breaks product rhythm between hero and Threshold: three lines, no CTA, no features.
 */
export default function LandingEmotionalInterludeSection() {
  const section = LANDING_CONTENT.interlude

  return (
    <section
      id={section.id}
      className="cw-v2-interlude"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap cw-v2-wrap--narrow cw-v2-interlude__inner">
        <h2 id={`${section.id}-heading`} className="cw-v2-interlude__verse">
          <span className="cw-v2-interlude__line cw-v2-interlude__line--loud">{section.line1}</span>
          <span className="cw-v2-interlude__line cw-v2-interlude__line--quiet">{section.line2}</span>
          <span className="cw-v2-interlude__seam" aria-hidden="true" />
          <span className="cw-v2-interlude__line cw-v2-interlude__line--turn">{section.line3}</span>
        </h2>
      </div>
    </section>
  )
}
