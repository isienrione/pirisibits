import { LANDING_CONTENT } from './landingData.js'
import { LANDING_V2 } from './landingVisualAssets.js'
import LandingPhoneFrame from './LandingPhoneFrame.jsx'

const SCREEN_IMAGES = {
  map: LANDING_V2.screenMap,
  listening: LANDING_V2.screenListening,
  threshold: LANDING_V2.threshold,
}

export default function LandingExperienceSection() {
  const section = LANDING_CONTENT.experience

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-section--raised cw-v2-experience"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
          <p className="cw-v2-section__lead">{section.subheadline}</p>
        </header>

        <div className="cw-v2-experience__grid">
          {section.screens.map((screen) => (
            <article key={screen.title} className="cw-v2-experience__card">
              <LandingPhoneFrame label={screen.title}>
                <img
                  src={SCREEN_IMAGES[screen.imageKey]}
                  alt={screen.title}
                  className="cw-v2-experience__screen"
                  loading="lazy"
                />
              </LandingPhoneFrame>
              <h3 className="cw-v2-experience__title">{screen.title}</h3>
              <p className="cw-v2-experience__body">{screen.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
