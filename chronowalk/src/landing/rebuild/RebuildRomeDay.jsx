import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { ProductShotScreen } from '../LandingPhoneScreens.jsx'
import { REBUILD_ROME_DAY } from '../rebuildCopy.js'
import RomeDayAtlas from './RomeDayAtlas.jsx'
import RomeDayWalkPhone from './RomeDayWalkPhone.jsx'

const GPS_SHOTS = {
  walk: {
    src: '/landing/phone-screens/walk-pantheon.jpg',
    label: 'ChronoWalk walking navigation',
  },
  listen: {
    src: '/landing/phone-screens/listen-pantheon.jpg',
    label: 'ChronoWalk Pantheon threshold and audio',
  },
  journey: {
    src: '/landing/phone-screens/journey.jpg',
    label: 'ChronoWalk route overview',
  },
}

/**
 * Section — Rome becomes one continuous story.
 * Real basemap route + real product screenshots only.
 */
export default function RebuildRomeDay() {
  const copy = REBUILD_ROME_DAY
  const morphRef = useRef(null)
  const reducedMotion = useReducedMotion()
  const [morphStage, setMorphStage] = useState(0)

  useEffect(() => {
    const node = morphRef.current
    if (!node || typeof IntersectionObserver !== 'function') return undefined

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        const ratio = entry.intersectionRatio
        if (ratio > 0.55) setMorphStage(2)
        else if (ratio > 0.22) setMorphStage(1)
        else if (entry.isIntersecting) setMorphStage(0)
      },
      { threshold: [0, 0.22, 0.4, 0.55, 0.75] },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-rome-day cw-rb-surface--light"
      aria-labelledby="rome-day-heading"
    >
      <div id="flexible-journey" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div id="route-proof" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div id="adaptive-walk" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />

      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        <header className="cw-rb-rome-day__intro">
          <h2 id="rome-day-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
          {copy.subhead ? <p className="cw-rb-lead">{copy.subhead}</p> : null}
        </header>
      </div>

      <div className="cw-rb-wrap cw-rb-rome-day__atlas-wrap">
        <RomeDayAtlas />
      </div>

      <div className="cw-rb-wrap">
        <div className="cw-rb-rome-day__timeline" aria-label="A flexible day with ChronoWalk">
          {copy.moments.map((moment, index) => (
            <div key={moment.id} className="cw-rb-rome-day__moment">
              <p className="cw-rb-rome-day__moment-label">{moment.label}</p>
              {index < copy.moments.length - 1 ? (
                <span className="cw-rb-rome-day__moment-arrow" aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </div>
        <p className="cw-rb-rome-day__resume">{copy.resume}</p>
      </div>

      <div
        ref={morphRef}
        className={`cw-rb-rome-day__morph${reducedMotion ? ' is-static' : ''} is-stage-${morphStage}`}
      >
        <div className="cw-rb-wrap cw-rb-rome-day__morph-inner">
          <header className="cw-rb-rome-day__morph-intro">
            <h3 className="cw-rb-rome-day__morph-title">{copy.appHeadline}</h3>
            <p className="cw-rb-lead">{copy.appBody}</p>
          </header>

          <div className="cw-rb-rome-day__morph-stage">
            <div className="cw-rb-rome-day__morph-atlas" aria-hidden={morphStage >= 2}>
              <RomeDayAtlas className="cw-rb-rome-day__atlas--mini" animate={false} />
            </div>
            <div className="cw-rb-rome-day__morph-phone">
              <RomeDayWalkPhone size="lg" />
            </div>
          </div>
        </div>
      </div>

      <div className="cw-rb-wrap">
        <h3 className="cw-rb-rome-day__gps-heading">{copy.gpsHeadline}</h3>
        <div className="cw-rb-rome-day__gps-rail" role="list">
          {copy.gpsCards.map((card) => {
            const shot = GPS_SHOTS[card.shot] ?? GPS_SHOTS.walk
            return (
              <article key={card.id} className="cw-rb-rome-day__gps-card" role="listitem">
                <div className="cw-rb-rome-day__gps-phone">
                  <ProductShotScreen src={shot.src} label={shot.label} size="md" />
                </div>
                <h4 className="cw-rb-rome-day__gps-card-title">{card.title}</h4>
                <p className="cw-rb-rome-day__gps-card-body">{card.body}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
