import { LANDING_CONTENT } from './landingData.js'

/** Act II — one grounded place-and-moment narrative beat. */
export default function LandingRealMomentSection() {
  const section = LANDING_CONTENT['real-moment']

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-real-moment"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap cw-v2-wrap--narrow">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
        </header>
        <p className="cw-v2-section__lead">{section.body}</p>
        {section.aside ? <p className="cw-v2-real-moment__aside">{section.aside}</p> : null}
      </div>
    </section>
  )
}
