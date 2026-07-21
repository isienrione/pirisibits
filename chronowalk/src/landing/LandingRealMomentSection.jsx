import { LANDING_CONTENT } from './landingData.js'
import { mediaUrl } from '../lib/mediaUrl.js'

const SCENARIO_IMAGES = {
  street: '/landing/real-moment/street.jpg',
  pantheon: '/landing/real-moment/pantheon.jpg',
  wander: '/landing/real-moment/wander.jpg',
  forum: '/landing/real-moment/forum.jpg',
}

/**
 * Act II — real-moment scenarios with place-tinted thumbnails (not persona cards).
 */
export default function LandingRealMomentSection() {
  const section = LANDING_CONTENT['real-moment']

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-real-moment"
      aria-labelledby={`${section.id}-heading`}
    >
      <div id="who-its-for" className="cw-landing-deeplink-anchor" tabIndex={-1} aria-hidden="true" />

      <div className="cw-v2-wrap cw-v2-wrap--narrow">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
        </header>

        <ul className="cw-v2-real-moment__list" aria-label="Real moments in Rome">
          {section.scenarios.map((scenario, index) => {
            const src = SCENARIO_IMAGES[scenario.imageKey]
            return (
              <li
                key={scenario.id ?? scenario.prompt}
                className="cw-v2-real-moment__item"
                style={scenario.accent ? { '--scenario-accent': scenario.accent } : undefined}
              >
                {index > 0 ? (
                  <span className="cw-v2-real-moment__seam" aria-hidden="true" />
                ) : null}
                <div className="cw-v2-real-moment__row">
                  {src ? (
                    <div className="cw-v2-real-moment__thumb" aria-hidden="true">
                      <img
                        src={mediaUrl(src)}
                        alt=""
                        width={120}
                        height={160}
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="cw-v2-real-moment__thumb-tint" />
                    </div>
                  ) : (
                    <span className="cw-v2-real-moment__swatch" aria-hidden="true" />
                  )}
                  <div className="cw-v2-real-moment__copy">
                    <p className="cw-v2-real-moment__prompt">{scenario.prompt}</p>
                    <div className="cw-v2-real-moment__lines">
                      {scenario.lines.map((line, lineIndex) => (
                        <p
                          key={line}
                          className={
                            lineIndex === 0
                              ? 'cw-v2-real-moment__line cw-v2-real-moment__line--lead'
                              : 'cw-v2-real-moment__line'
                          }
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
