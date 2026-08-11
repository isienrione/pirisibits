import { useEffect, useRef } from 'react'
import { LANDING_CONTENT } from '../landingData.js'
import { getLandingMonuments } from '../landingMonuments.js'
import {
  observeLandingSectionOnce,
  trackLandingRouteView,
} from '../landingAnalytics.js'

/**
 * Width of one monument set (first card → matching clone), including the flex gap.
 * `scrollWidth / 2` is wrong when the track has symmetric padding — the seam lands
 * on Colosseum (stop 0) and scroll-snap fights a half-gap error (blink / stutter).
 */
export function measureStopCarouselLoopWidth(scroller, stopCount) {
  if (!scroller || stopCount <= 0) return 0
  const cards = scroller.querySelectorAll('.cw-v4-stops__card')
  if (cards.length < stopCount * 2) return 0
  return cards[stopCount].offsetLeft - cards[0].offsetLeft
}

/**
 * Premium horizontal stop carousel - Apple TV artwork energy.
 * Infinite-feeling track via duplicated slides.
 */
export default function LandingStopCarousel({
  section = LANDING_CONTENT.monuments,
}) {
  const monuments = getLandingMonuments().filter((stop) => stop.featured || stop.photo)
  const track = [...monuments, ...monuments]
  const sectionRef = useRef(null)
  const scrollerRef = useRef(null)

  useEffect(() => observeLandingSectionOnce(sectionRef.current, () => trackLandingRouteView()), [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el || monuments.length === 0) return undefined

    let looping = false
    let rafId = 0

    const jumpBy = (delta) => {
      if (looping || !delta) return
      looping = true
      const previousSnap = el.style.scrollSnapType
      // Disable snap for the teleport so mandatory centering cannot re-fire scroll
      // and bounce across the Colosseum seam three times.
      el.style.scrollSnapType = 'none'
      el.scrollLeft += delta
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        el.style.scrollSnapType = previousSnap
        // Second frame: let layout settle before accepting another wrap.
        rafId = requestAnimationFrame(() => {
          looping = false
        })
      })
    }

    const onScroll = () => {
      if (looping) return
      const loopWidth = measureStopCarouselLoopWidth(el, monuments.length)
      if (loopWidth <= 0) return

      if (el.scrollLeft >= loopWidth) {
        jumpBy(-loopWidth)
      } else if (el.scrollLeft <= 0) {
        jumpBy(loopWidth)
      }
    }

    // Start mid–first copy so left swipe can loop without an immediate wrap.
    const loopWidth = measureStopCarouselLoopWidth(el, monuments.length)
    el.scrollLeft = loopWidth > 0 ? loopWidth / 2 : el.scrollWidth / 4

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(rafId)
      el.removeEventListener('scroll', onScroll)
      el.style.scrollSnapType = ''
    }
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
          {track.map((stop, index) => {
            const inFirstCopy = index < monuments.length
            // Eager-load the first set + the clone seam (Colosseum) so the wrap
            // never flashes an unloaded poster.
            const nearSeam =
              index === monuments.length ||
              index === monuments.length - 1 ||
              index === monuments.length + 1
            const eager = inFirstCopy || nearSeam

            return (
              <article
                key={`${stop.id}-${index}`}
                className="cw-v4-stops__card"
                aria-hidden={index >= monuments.length ? true : undefined}
              >
                <img
                  className="cw-v4-stops__image"
                  src={stop.photo}
                  alt=""
                  loading={eager ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index === 0 || index === monuments.length ? 'high' : undefined}
                />
                <div className="cw-v4-stops__meta">
                  <p className="cw-v4-stops__index">{String(stop.index).padStart(2, '0')}</p>
                  <h3 className="cw-v4-stops__name">{stop.title}</h3>
                  <p className="cw-v4-stops__sub">{stop.short}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
