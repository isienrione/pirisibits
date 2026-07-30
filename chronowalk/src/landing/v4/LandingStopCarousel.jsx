import { useEffect, useRef } from 'react'
import { LANDING_CONTENT } from '../landingData.js'
import { getLandingMonuments } from '../landingMonuments.js'
import {
  observeLandingSectionOnce,
  trackLandingRouteView,
} from '../landingAnalytics.js'

/**
 * Premium horizontal stop carousel · Apple TV artwork energy.
 * Infinite-feeling track via duplicated slides.
 */
export default function LandingStopCarousel() {
  const section = LANDING_CONTENT.monuments
  const monuments = getLandingMonuments().filter((stop) => stop.featured || stop.photo)
  const track = [...monuments, ...monuments]
  const sectionRef = useRef(null)
  const scrollerRef = useRef(null)

  useEffect(() => observeLandingSectionOnce(sectionRef.current, () => trackLandingRouteView()), [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return undefined

    const onScroll = () => {
      const half = el.scrollWidth / 2
      if (el.scrollLeft >= half) {
        el.scrollLeft -= half
      } else if (el.scrollLeft <= 0) {
        el.scrollLeft += half
      }
    }

    // Start mid-track so left swipe also loops.
    el.scrollLeft = el.scrollWidth / 4
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [monuments.length])

  return (
    <section
      ref={sectionRef}
      id={section.id}
      className="cw-v4-stops"
      aria-labelledby="cw-v4-stops-heading"
    >
      <div className="cw-v4-wrap">
        <header className="cw-v4-section-head">
          <p className="cw-v4-eyebrow">{section.eyebrow}</p>
          <h2 id="cw-v4-stops-heading" className="cw-v4-section-title">
            {section.headline}
          </h2>
          {section.subheadline ? (
            <p className="cw-v4-section-lead">{section.subheadline}</p>
          ) : null}
        </header>
      </div>

      <div
        ref={scrollerRef}
        className="cw-v4-stops__scroller"
        tabIndex={0}
        aria-label={section.previewAriaLabel}
      >
        <div className="cw-v4-stops__track">
          {track.map((stop, index) => (
            <article
              key={`${stop.id}-${index}`}
              className="cw-v4-stops__card"
              aria-hidden={index >= monuments.length ? true : undefined}
            >
              <img
                className="cw-v4-stops__image"
                src={stop.photo}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <div className="cw-v4-stops__meta">
                <p className="cw-v4-stops__index">{String(stop.index).padStart(2, '0')}</p>
                <h3 className="cw-v4-stops__name">{stop.title}</h3>
                <p className="cw-v4-stops__sub">{stop.short}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
