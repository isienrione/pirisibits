import { LANDING_CONTENT } from './landingData.js'
import { getLandingRouteStats } from './landingRouteStats.js'
import { getLandingMonuments } from './landingMonuments.js'

export default function LandingMonumentsCarousel() {
  const section = LANDING_CONTENT.monuments
  const routeStats = getLandingRouteStats()
  const monuments = getLandingMonuments()

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-monuments"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {routeStats.monumentsHeadline}
          </h2>
          {section.subheadline ? <p className="cw-v2-section__lead">{section.subheadline}</p> : null}
        </header>

        <div className="cw-v2-monuments__track-wrap">
          <ul className="cw-v2-monuments__track" aria-label="Rome tour stops">
            {monuments.map((monument) => (
              <li key={monument.id} className="cw-v2-monuments__item">
                <article className="cw-v2-monuments__card">
                  <div className="cw-v2-monuments__photo-wrap">
                    <img
                      src={monument.photo}
                      alt={monument.title}
                      className="cw-v2-monuments__photo"
                      loading="lazy"
                    />
                  </div>
                  <p className="cw-v2-monuments__title">{monument.title}</p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
