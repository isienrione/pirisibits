import { useEffect, useRef, useState } from 'react'
import { Headphones } from 'lucide-react'
import { LANDING_CONTENT } from '../landingData.js'
import { getLandingMonuments } from '../landingMonuments.js'
import {
  observeLandingSectionOnce,
  trackLandingRouteView,
} from '../landingAnalytics.js'
import { useT } from '../../i18n/I18nProvider.jsx'

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
 * Infinite-feeling track via duplicated slides. Tap a card to flip for stop copy.
 */
export default function LandingStopCarousel({
  section = LANDING_CONTENT.monuments,
}) {
  const t = useT()
  const monuments = getLandingMonuments().filter((stop) => stop.featured || stop.photo)
  const track = [...monuments, ...monuments]
  const sectionRef = useRef(null)
  const scrollerRef = useRef(null)
  const pointerRef = useRef({ x: 0, y: 0, moved: false })
  const [flippedId, setFlippedId] = useState(null)

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

  const onCardPointerDown = (event) => {
    pointerRef.current = {
      x: event.clientX,
      y: event.clientY,
      moved: false,
    }
  }

  const onCardPointerMove = (event) => {
    const start = pointerRef.current
    if (!start || start.moved) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.hypot(dx, dy) > 10) {
      pointerRef.current = { ...start, moved: true }
    }
  }

  const toggleFlip = (stopId) => {
    if (pointerRef.current.moved) return
    setFlippedId((current) => (current === stopId ? null : stopId))
  }

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
            const flipped = flippedId === stop.id
            const flipLabel = flipped
              ? t('landing.stops.hideDescription', { title: stop.title })
              : t('landing.stops.showDescription', { title: stop.title })

            return (
              <article
                key={`${stop.id}-${index}`}
                className={`cw-v4-stops__card${flipped ? ' is-flipped' : ''}`}
                aria-hidden={index >= monuments.length ? true : undefined}
              >
                <button
                  type="button"
                  className="cw-v4-stops__flipper"
                  aria-pressed={flipped}
                  aria-label={flipLabel}
                  tabIndex={index >= monuments.length ? -1 : 0}
                  onPointerDown={onCardPointerDown}
                  onPointerMove={onCardPointerMove}
                  onClick={() => toggleFlip(stop.id)}
                >
                  <div className="cw-v4-stops__face cw-v4-stops__face--front">
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
                      <p className="cw-v4-stops__tap-hint" aria-hidden="true">
                        {t('landing.stops.tapToFlip')}
                      </p>
                    </div>
                  </div>

                  <div className="cw-v4-stops__face cw-v4-stops__face--back">
                    <div className="cw-v4-stops__back-inner">
                      <p className="cw-v4-stops__index">{String(stop.index).padStart(2, '0')}</p>
                      <h3 className="cw-v4-stops__name cw-v4-stops__name--back">
                        <Headphones
                          className="cw-v4-stops__earphone"
                          size={22}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                        <span>{stop.title}</span>
                      </h3>
                      {(stop.duration || stop.admission) && (
                        <p className="cw-v4-stops__back-meta">
                          {[stop.duration, stop.admission].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <div className="cw-v4-stops__back-body">
                        {stop.description.split('\n\n').map((paragraph, i) => (
                          <p key={i} className="cw-v4-stops__back-p">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                      <span className="cw-v4-stops__tap-hint cw-v4-stops__tap-hint--back" aria-hidden="true">
                        {t('landing.stops.tapToFlipBack')}
                      </span>
                    </div>
                  </div>
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
