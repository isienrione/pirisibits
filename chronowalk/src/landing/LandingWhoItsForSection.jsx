import { LANDING_CONTENT } from './landingData.js'
import { LANDING_V2 } from './landingVisualAssets.js'
import LandingPicture from './LandingPicture.jsx'

export default function LandingWhoItsForSection() {
  const section = LANDING_CONTENT['who-its-for']

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-section--raised cw-v2-who"
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

        <div className="cw-v2-who__banner">
          <LandingPicture
            asset={LANDING_V2.lifestyleCouple}
            alt="A couple sharing earphones, looking up at a Roman monument at golden hour"
            className="cw-v2-who__banner-photo"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="cw-v2-who__track-wrap">
          <ul className="cw-v2-who__track" aria-label="Who ChronoWalk is for">
            {section.items.map((item) => (
              <li key={item.tag} className="cw-v2-who__slide">
                <article className="cw-v2-who__card">
                  <p className="cw-v2-who__tag">{item.tag}</p>
                  <h3 className="cw-v2-who__title">{item.title}</h3>
                  <p className="cw-v2-who__body">{item.body}</p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
