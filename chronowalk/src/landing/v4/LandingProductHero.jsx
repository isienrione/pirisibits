import { useEffect, useState } from 'react'
import { LANDING_CONTENT } from '../landingData.js'
import { LANDING_HERO } from '../landingVisualAssets.js'
import { LandingResponsivePicture } from '../LandingResponsivePicture.jsx'
import { LANDING_ANALYTICS_SECTIONS } from '../landingAnalytics.js'
import { HERO_SLIDESHOW_SLIDES } from './heroSlideshowData.js'

const SLIDE_MS = 7000
const FADE_MS = 900

/**
 * Rome-sky hero with a mild fade slideshow of the exported marketing frames.
 * Slide 0 = current primary hero; secondary slides are the original PNGs.
 */
export default function LandingProductHero({ onPreview }) {
  const section = LANDING_CONTENT.hero
  const storySlides = HERO_SLIDESHOW_SLIDES
  const total = 1 + storySlides.length
  const [index, setIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(Boolean(mq?.matches))
    sync()
    mq?.addEventListener?.('change', sync)
    return () => mq?.removeEventListener?.('change', sync)
  }, [])

  useEffect(() => {
    if (reducedMotion || total < 2) return undefined

    let timer = 0
    const tick = () => {
      if (document.hidden) {
        timer = window.setTimeout(tick, SLIDE_MS)
        return
      }
      setIndex((current) => (current + 1) % total)
      timer = window.setTimeout(tick, SLIDE_MS)
    }
    timer = window.setTimeout(tick, SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [reducedMotion, total])

  return (
    <section
      id={section.id}
      className="cw-v4-hero"
      aria-labelledby="cw-v4-hero-heading"
      aria-roledescription="carousel"
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
            <p className="cw-v4-hero__brand">{section.eyebrow}</p>
            <h1 id="cw-v4-hero-heading" className="cw-v4-hero__title">
              {section.headline}
            </h1>
            <p className="cw-v4-hero__lead">{section.subheadline}</p>
            {section.accentLine ? <p className="cw-v4-hero__accent">{section.accentLine}</p> : null}

            <div className="cw-v4-hero__actions">
              <button
                type="button"
                className="cw-v4-btn cw-v4-btn--primary"
                onClick={() => onPreview?.(LANDING_ANALYTICS_SECTIONS.HERO)}
                tabIndex={index === 0 ? 0 : -1}
              >
                {section.primaryCta}
              </button>
            </div>

            {section.trustLine ? <p className="cw-v4-hero__trust">{section.trustLine}</p> : null}
          </div>
        </div>

        {storySlides.map((slide, slideIndex) => {
          const active = index === slideIndex + 1
          return (
            <div
              key={slide.id}
              className={`cw-v4-hero__slide-layer cw-v4-hero__slide-layer--art${active ? ' is-active' : ''}`}
              aria-hidden={!active}
              inert={active ? undefined : true}
            >
              <img
                className="cw-v4-hero__art"
                src={slide.src}
                alt={slide.title}
                decoding="async"
                loading={slideIndex < 2 ? 'eager' : 'lazy'}
              />
            </div>
          )
        })}
      </div>

      {!reducedMotion && total > 1 ? (
        <div className="cw-v4-hero__dots" role="tablist" aria-label="Hero slides">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={index === i}
              aria-label={i === 0 ? 'Main hero' : storySlides[i - 1]?.title || `Slide ${i + 1}`}
              className={`cw-v4-hero__dot${index === i ? ' is-active' : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
