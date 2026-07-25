import { REBUILD_ADAPTIVE } from '../rebuildCopy.js'

const SCREEN_SRC = {
  map: '/landing/phone-screens/walk-pantheon.jpg',
  listening: '/landing/phone-screens/listen-pantheon.jpg',
  journey: '/landing/phone-screens/journey.jpg',
}

/**
 * Adaptive walk — three cropped product moments (not full-height phone stacks).
 */
export default function RebuildAdaptiveWalk() {
  const copy = REBUILD_ADAPTIVE

  return (
    <section
      id="adaptive-walk"
      className="cw-rb-section cw-rb-adaptive cw-rb-surface--light"
      aria-labelledby="adaptive-walk-heading"
    >
      <div className="cw-rb-wrap">
        <header>
          <h2 id="adaptive-walk-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
          <p className="cw-rb-lead">{copy.promise}</p>
        </header>

        <ol className="cw-rb-adaptive__steps">
          {copy.steps.map((step, index) => {
            const src = SCREEN_SRC[step.screen] ?? SCREEN_SRC.journey
            return (
              <li key={step.title} className="cw-rb-adaptive__step">
                <div className="cw-rb-adaptive__copy">
                  <span className="cw-rb-adaptive__num" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="cw-rb-adaptive__step-title">{step.title}</h3>
                  <p className="cw-rb-adaptive__step-copy">{step.copy}</p>
                </div>
                <figure className={`cw-rb-adaptive__moment cw-rb-adaptive__moment--${step.screen}`}>
                  <img
                    src={src}
                    alt=""
                    width={720}
                    height={480}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              </li>
            )
          })}
        </ol>

        <p className="cw-rb-adaptive__note">{copy.locationNote}</p>
      </div>
    </section>
  )
}
