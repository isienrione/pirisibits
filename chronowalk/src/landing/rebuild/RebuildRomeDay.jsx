import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { REBUILD_ROME_DAY } from '../rebuildCopy.js'
import RomeDayAtlas from './RomeDayAtlas.jsx'
import RomeDayWalkPhone from './RomeDayWalkPhone.jsx'

function MomentIcon({ kind }) {
  switch (kind) {
    case 'colosseum':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <ellipse cx="20" cy="22" rx="14" ry="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <ellipse cx="20" cy="22" rx="8" ry="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 18v8M15 16.5v11M20 15.5v12M25 16.5v11M30 18v8" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      )
    case 'lunch':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="M8 28h24" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 28c0-8 4-14 8-14s8 6 8 14" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="20" cy="20" r="3" fill="currentColor" opacity="0.35" />
        </svg>
      )
    case 'museum':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="M6 30h28M8 30V16l12-8 12 8v14" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M14 30v-8h4v8M22 30v-8h4v8" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      )
    case 'coffee':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="M11 14h14v12a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V14z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M25 18h3a3.5 3.5 0 0 1 0 7h-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M15 10c1 1.5 1 3 0 4M19 10c1 1.5 1 3 0 4" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      )
    case 'pantheon':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="M7 30h26M9 30V22h22v8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 22C11 12 29 12 29 22" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="20" cy="18" r="1.4" fill="currentColor" />
        </svg>
      )
    case 'night':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path
            d="M24 10a10 10 0 1 0 6 18 12 12 0 1 1-6-18z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="14" r="1" fill="currentColor" opacity="0.55" />
          <circle cx="16" cy="11" r="0.7" fill="currentColor" opacity="0.45" />
        </svg>
      )
    default:
      return null
  }
}

/**
 * Section — Rome becomes one continuous story.
 * Narrative scroll: editorial atlas → flexible day → live navigation → GPS moments.
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

      {/* Part 1 — headline */}
      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        <header className="cw-rb-rome-day__intro">
          <h2 id="rome-day-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
          {copy.subhead ? <p className="cw-rb-lead">{copy.subhead}</p> : null}
        </header>
      </div>

      {/* Part 2 — master atlas */}
      <div className="cw-rb-wrap cw-rb-rome-day__atlas-wrap">
        <RomeDayAtlas highlights={copy.highlights} />
      </div>

      {/* Part 3 — flexible day timeline */}
      <div className="cw-rb-wrap">
        <div className="cw-rb-rome-day__timeline" aria-label="A flexible day with ChronoWalk">
          {copy.moments.map((moment, index) => (
            <div key={moment.id} className="cw-rb-rome-day__moment">
              <div className="cw-rb-rome-day__moment-icon" aria-hidden="true">
                <MomentIcon kind={moment.icon} />
              </div>
              <p className="cw-rb-rome-day__moment-label">{moment.label}</p>
              {index < copy.moments.length - 1 ? (
                <span className="cw-rb-rome-day__moment-arrow" aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </div>
        <p className="cw-rb-rome-day__resume">{copy.resume}</p>
      </div>

      {/* Part 4 — atlas morphs into real navigation */}
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
              <RomeDayAtlas
                highlights={copy.highlights}
                className="cw-rb-rome-day__atlas--mini"
                animate={false}
              />
            </div>
            <div className="cw-rb-rome-day__morph-phone">
              <RomeDayWalkPhone size="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Part 5 — live GPS moments */}
      <div className="cw-rb-wrap">
        <h3 className="cw-rb-rome-day__gps-heading">{copy.gpsHeadline}</h3>
        <div className="cw-rb-rome-day__gps-rail" role="list">
          {copy.gpsCards.map((card) => (
            <article key={card.id} className="cw-rb-rome-day__gps-card" role="listitem">
              <div className={`cw-rb-rome-day__gps-shot cw-rb-rome-day__gps-shot--${card.id}`}>
                {card.id === 'approach' ? (
                  <>
                    <p className="cw-rb-rome-day__gps-eyebrow">GPS</p>
                    <p className="cw-rb-rome-day__gps-shot-title">{card.shotTitle}</p>
                    <p className="cw-rb-rome-day__gps-shot-meta">{card.shotMeta}</p>
                    <span className="cw-rb-rome-day__gps-cta">{card.cta}</span>
                  </>
                ) : null}
                {card.id === 'threshold' ? (
                  <>
                    <div className="cw-rb-rome-day__gps-split">
                      <img src={card.nowSrc} alt="" decoding="async" />
                      <img src={card.thenSrc} alt="" decoding="async" />
                    </div>
                    <span className="cw-rb-rome-day__gps-hold">{card.cta}</span>
                  </>
                ) : null}
                {card.id === 'story' ? (
                  <>
                    <img className="cw-rb-rome-day__gps-story-img" src={card.shotSrc} alt="" decoding="async" />
                    <div className="cw-rb-rome-day__gps-story-scrim">
                      <p className="cw-rb-rome-day__gps-shot-title">{card.shotTitle}</p>
                      <p className="cw-rb-rome-day__gps-shot-meta">{card.shotMeta}</p>
                    </div>
                  </>
                ) : null}
              </div>
              <h4 className="cw-rb-rome-day__gps-card-title">{card.title}</h4>
              <p className="cw-rb-rome-day__gps-card-body">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
