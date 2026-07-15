import { LANDING_CONTENT } from './landingData.js'

/** Act I — short cinematic bridge between hero and Threshold. */
export default function LandingEmotionalInterludeSection() {
  const section = LANDING_CONTENT.interlude

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-interlude"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap cw-v2-wrap--narrow">
        <p className="cw-v2-eyebrow">{section.eyebrow}</p>
        <h2 id={`${section.id}-heading`} className="cw-v2-section__title cw-v2-interlude__title">
          {section.headline}
        </h2>
        {section.body ? <p className="cw-v2-section__lead cw-v2-interlude__body">{section.body}</p> : null}
      </div>
    </section>
  )
}
