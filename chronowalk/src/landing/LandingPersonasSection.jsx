import { LANDING_CONTENT } from './landingData.js'
import { LANDING_V2 } from './landingVisualAssets.js'
import LandingPicture from './LandingPicture.jsx'

export default function LandingPersonasSection() {
  const section = LANDING_CONTENT.personas

  return (
    <section id={section.id} className="cw-v2-section cw-v2-personas" aria-labelledby={`${section.id}-heading`}>
      <div className="cw-v2-wrap cw-v2-personas__grid">
        <div className="cw-v2-personas__intro">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
          <div className="cw-v2-personas__photo-wrap">
            <LandingPicture
              asset={LANDING_V2.lifestyleCouple}
              alt="A couple sharing earphones, looking up at a Roman monument at golden hour"
              className="cw-v2-personas__photo"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="cw-v2-personas__list">
          {section.items.map((persona) => (
            <article key={persona.tag} className="cw-v2-persona-card">
              <p className="cw-v2-persona-card__tag">{persona.tag}</p>
              <h3 className="cw-v2-persona-card__title">{persona.title}</h3>
              <p className="cw-v2-persona-card__body">{persona.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
