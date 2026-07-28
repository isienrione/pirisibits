import { useEffect, useRef, useState } from 'react'
import { Expand } from 'lucide-react'
import { LANDING_CONTENT } from '../landingData.js'
import { LANDING_HERO } from '../landingVisualAssets.js'
import { LandingResponsivePicture } from '../LandingResponsivePicture.jsx'
import { LANDING_ANALYTICS_SECTIONS } from '../landingAnalytics.js'
import { HERO_SLIDESHOW_SLIDES } from './heroSlideshowData.js'
import { LandingZoomableImageViewer } from './LandingPackagePosterViewer.jsx'

const SLIDE_MS = 8000
const FADE_MS = 900

/** Approximate click targets over the Choose your walk marketing frame. */
const PACKAGE_HOTSPOTS = [
  {
    id: 'rome-complete',
    label: 'Roma Eterna package',
    style: { left: '7%', top: '24%', width: '28%', height: '34%' },
  },
  {
    id: 'rome-essential',
    label: 'Roma Antica package',
    style: { left: '36%', top: '24%', width: '28%', height: '34%' },
  },
  {
    id: 'rome-central',
    label: 'Roma Historica package',
    style: { left: '65%', top: '24%', width: '28%', height: '34%' },
  },
  {
    id: 'rome-couple',
    label: 'Couple package',
    style: { left: '7%', top: '60%', width: '42%', height: '18%' },
  },
  {
    id: 'rome-family',
    label: 'Family package',
    style: { left: '51%', top: '60%', width: '42%', height: '18%' },
  },
]

function HeroLead({ text, highlight }) {
  if (!highlight || !text.includes(highlight)) {
    return <p className="cw-v4-hero__lead">{text}</p>
  }
  const start = text.indexOf(highlight)
  const before = text.slice(0, start)
  const after = text.slice(start + highlight.length)
  return (
    <p className="cw-v4-hero__lead">
      {before}
      <mark className="cw-v4-hero__mark">{highlight}</mark>
      {after}
    </p>
  )
}

function scrollToPricingTarget(id) {
  const target =
    document.getElementById(id) ||
    document.getElementById(`pricing-name-${id}`) ||
    document.getElementById('pricing')
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  window.location.hash = id ? `#${id}` : '#pricing'
}

/**
 * Rome-sky hero with a mild fade slideshow of the exported marketing frames.
 * Slide 0 = current primary hero; secondary slides are portrait story frames.
 * Story frames open a fullscreen pinch-zoom viewer when enlarged.
 */
export default function LandingProductHero({ onPreview, onChooseTour, onGetApp }) {
  const section = LANDING_CONTENT.hero
  const storySlides = HERO_SLIDESHOW_SLIDES
  const total = 1 + storySlides.length
  const [index, setIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [paused, setPaused] = useState(false)
  const [viewerSlide, setViewerSlide] = useState(null)
  const touchStartX = useRef(null)
  const expandTriggerRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(Boolean(mq?.matches))
    sync()
    mq?.addEventListener?.('change', sync)
    return () => mq?.removeEventListener?.('change', sync)
  }, [])

  useEffect(() => {
    if (reducedMotion || paused || viewerSlide || total < 2) return undefined

    let timer = 0
    const tick = () => {
      if (document.hidden) {
        timer = window.setTimeout(tick, SLIDE_MS)
        return
      }
      setIndex((current) => (current + 1) % total)
    }
    timer = window.setTimeout(tick, SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [reducedMotion, paused, viewerSlide, total, index])

  const goTo = (next) => {
    setPaused(true)
    setIndex(((next % total) + total) % total)
  }

  const goPrev = () => goTo(index - 1)
  const goNext = () => goTo(index + 1)

  const openSlideViewer = (slide, triggerEl) => {
    setPaused(true)
    if (triggerEl) expandTriggerRef.current = triggerEl
    setViewerSlide(slide)
  }

  const interactive = index === 0

  return (
    <section
      id={section.id}
      className="cw-v4-hero"
      aria-labelledby="cw-v4-hero-heading"
      aria-roledescription="carousel"
      onTouchStart={(event) => {
        touchStartX.current = event.changedTouches?.[0]?.clientX ?? null
      }}
      onTouchEnd={(event) => {
        if (viewerSlide) return
        const start = touchStartX.current
        const end = event.changedTouches?.[0]?.clientX
        touchStartX.current = null
        if (start == null || end == null) return
        const delta = end - start
        if (Math.abs(delta) < 48) return
        if (delta > 0) goPrev()
        else goNext()
      }}
    >
      <div className="cw-v4-hero__stage" style={{ '--cw-hero-fade-ms': `${FADE_MS}ms` }}>
        <div className={`cw-v4-hero__slide-layer${index === 0 ? ' is-active' : ''}`}>
          <div className="cw-v4-hero__sky" aria-hidden>
            <LandingResponsivePicture
              image={LANDING_HERO}
              className="cw-v4-hero__photo"
              loading="eager"
              fetchPriority="high"
              sizes="100vw"
            />
            <div className="cw-v4-hero__clouds" />
            <div className="cw-v4-hero__veil" />
          </div>

          <div className="cw-v4-hero__copy">
            <h1 id="cw-v4-hero-heading" className="cw-v4-hero__title">
              {section.headline}
            </h1>
            <HeroLead text={section.subheadline} highlight={section.subheadlineHighlight} />

            <div className="cw-v4-hero__actions">
              <button
                type="button"
                className="cw-v4-btn cw-v4-btn--primary"
                onClick={() => onPreview?.(LANDING_ANALYTICS_SECTIONS.HERO)}
                tabIndex={interactive ? 0 : -1}
              >
                {section.primaryCta}
              </button>

              <a
                href={section.getAppHref ?? '#pricing'}
                className="cw-v4-btn cw-v4-btn--getapp"
                tabIndex={interactive ? 0 : -1}
                onClick={(event) => {
                  if (!onGetApp && !onChooseTour) return
                  event.preventDefault()
                  ;(onGetApp || onChooseTour)?.()
                }}
              >
                {section.getAppCta}
              </a>

              <a
                href={section.secondaryHref ?? '#how-it-works'}
                className="cw-v4-btn cw-v4-btn--purchase"
                tabIndex={interactive ? 0 : -1}
                onClick={(event) => {
                  const id = (section.secondaryHref ?? '#how-it-works').replace(/^#/, '')
                  const target =
                    document.getElementById('cw-v4-demo-heading') ||
                    (id ? document.getElementById(id) : null)
                  if (!target) return
                  event.preventDefault()
                  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                {section.secondaryCta}
              </a>
            </div>
          </div>
        </div>

        {storySlides.map((slide, slideIndex) => {
          const active = index === slideIndex + 1
          const isPackages = slide.id === 'choose-your-walk'
          return (
            <div
              key={slide.id}
              className={`cw-v4-hero__slide-layer cw-v4-hero__slide-layer--art${active ? ' is-active' : ''}`}
              aria-hidden={!active}
              inert={active ? undefined : true}
            >
              <div className={`cw-v4-hero__art-frame${isPackages ? ' cw-v4-hero__art-frame--hotspots' : ''}`}>
                {isPackages ? (
                  <div className="cw-v4-hero__art-shell">
                    <img
                      className="cw-v4-hero__art"
                      src={slide.src}
                      alt={slide.title}
                      width={slide.width}
                      height={slide.height}
                      decoding="async"
                      // Eager: inert/opacity-hidden slides skip native lazy-load on iOS.
                      loading="eager"
                      fetchPriority={active ? 'high' : 'low'}
                    />
                    <div className="cw-v4-hero__art-hotspots" aria-hidden={!active}>
                      {PACKAGE_HOTSPOTS.map((spot) => (
                        <a
                          key={spot.id}
                          href={`#${spot.id}`}
                          className="cw-v4-hero__hotspot"
                          style={spot.style}
                          aria-label={spot.label}
                          tabIndex={active ? 0 : -1}
                          onClick={(event) => {
                            event.preventDefault()
                            setPaused(true)
                            scrollToPricingTarget(spot.id)
                          }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="cw-v4-hero__art-enlarge"
                      tabIndex={active ? 0 : -1}
                      aria-label={`Enlarge ${slide.title}`}
                      onClick={(event) => openSlideViewer(slide, event.currentTarget)}
                    >
                      <Expand size={16} aria-hidden="true" />
                      <span>Enlarge</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="cw-v4-hero__art-hit"
                    tabIndex={active ? 0 : -1}
                    aria-label={`Enlarge ${slide.title}`}
                    onClick={(event) => openSlideViewer(slide, event.currentTarget)}
                  >
                    <img
                      className="cw-v4-hero__art"
                      src={slide.src}
                      alt=""
                      width={slide.width}
                      height={slide.height}
                      decoding="async"
                      loading="eager"
                      fetchPriority={active ? 'high' : 'low'}
                    />
                    <span className="cw-v4-hero__art-enlarge cw-v4-hero__art-enlarge--on-art">
                      <Expand size={16} aria-hidden="true" />
                      <span>Tap to enlarge</span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {total > 1 ? (
        <>
          <button
            type="button"
            className="cw-v4-hero__arrow cw-v4-hero__arrow--prev"
            aria-label="Previous slide"
            onClick={goPrev}
          >
            <span aria-hidden>‹</span>
          </button>
          <button
            type="button"
            className="cw-v4-hero__arrow cw-v4-hero__arrow--next"
            aria-label="Next slide"
            onClick={goNext}
          >
            <span aria-hidden>›</span>
          </button>
          <p className="cw-v4-hero__hint" aria-hidden>
            Explore what ChronoWalk includes
          </p>
          <div className="cw-v4-hero__dots" role="tablist" aria-label="Hero slides">
            {Array.from({ length: total }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={index === i}
                aria-label={i === 0 ? 'Main hero' : storySlides[i - 1]?.title || `Slide ${i + 1}`}
                className={`cw-v4-hero__dot${index === i ? ' is-active' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      ) : null}

      {viewerSlide ? (
        <LandingZoomableImageViewer
          key={viewerSlide.id}
          open
          title={viewerSlide.title}
          src={viewerSlide.src}
          alt={viewerSlide.title}
          accent="eterna"
          hint="Pinch or double-tap to zoom in on details that caught your eye. Drag to pan."
          onClose={() => setViewerSlide(null)}
          returnFocusRef={expandTriggerRef}
        />
      ) : null}
    </section>
  )
}
