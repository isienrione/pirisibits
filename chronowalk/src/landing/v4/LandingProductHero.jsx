import { useEffect, useState } from 'react'
import { LANDING_CONTENT, LANDING_HERO_REVIEWS } from '../landingData.js'
import { LANDING_HERO } from '../landingVisualAssets.js'
import { LandingResponsivePicture } from '../LandingResponsivePicture.jsx'
import { LANDING_ANALYTICS_SECTIONS } from '../landingAnalytics.js'
import { HERO_SLIDESHOW_SLIDES } from './heroSlideshowData.js'
import {
  getLandingReviewsVisible,
  syncLandingReviewFlagsFromUrl,
} from '../landingReviewsVisibility.js'

const SLIDE_MS = 7000
const FADE_MS = 900

function AppStoreGlyph() {
  return (
    <svg className="cw-v4-appstore__glyph" viewBox="0 0 16 16" aria-hidden width="16" height="16">
      <path
        fill="currentColor"
        d="M11.18 8.3c.02 2.13 1.87 2.84 1.89 2.85-.02.05-.3 1.01-.98 2-.59.86-1.2 1.71-2.16 1.73-.95.02-1.25-.56-2.34-.56-1.08 0-1.42.54-2.32.58-.93.04-1.64-.93-2.24-1.78C1.8 11.4.9 8.6 1.95 6.7c.52-.94 1.45-1.54 2.46-1.56.96-.02 1.87.65 2.34.65.46 0 1.55-.8 2.62-.68.45.02 1.7.18 2.5 1.36-.06.04-1.5.87-1.69 2.83ZM9.7 3.5c.5-.61.84-1.46.75-2.3-.72.03-1.6.48-2.12 1.09-.47.54-.88 1.4-.77 2.23.81.06 1.64-.41 2.14-1.02Z"
      />
    </svg>
  )
}

function StarRow({ rating = 4.9 }) {
  return (
    <span className="cw-v4-reviews__stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} aria-hidden>
          ★
        </span>
      ))}
      <span className="cw-v4-reviews__score">{rating.toFixed(1)}</span>
    </span>
  )
}

/**
 * Rome-sky hero with a mild fade slideshow of the exported marketing frames.
 * Slide 0 = current primary hero; secondary slides are the original PNGs.
 */
export default function LandingProductHero({ onPreview, onChooseTour, onGetApp }) {
  const section = LANDING_CONTENT.hero
  const reviews = LANDING_HERO_REVIEWS
  const storySlides = HERO_SLIDESHOW_SLIDES
  const total = 1 + storySlides.length
  const [index, setIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [reviewsVisible, setReviewsVisible] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(Boolean(mq?.matches))
    sync()
    mq?.addEventListener?.('change', sync)
    return () => mq?.removeEventListener?.('change', sync)
  }, [])

  useEffect(() => {
    syncLandingReviewFlagsFromUrl()
    setReviewsVisible(getLandingReviewsVisible())
    const onChange = (event) => {
      if (typeof event?.detail?.visible === 'boolean') {
        setReviewsVisible(event.detail.visible)
      } else {
        setReviewsVisible(getLandingReviewsVisible())
      }
    }
    window.addEventListener('cw-landing-reviews-change', onChange)
    return () => window.removeEventListener('cw-landing-reviews-change', onChange)
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
    }
    timer = window.setTimeout(tick, SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [reducedMotion, total])

  const interactive = index === 0

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
            {section.eyebrow ? <p className="cw-v4-hero__brand">{section.eyebrow}</p> : null}
            <h1 id="cw-v4-hero-heading" className="cw-v4-hero__title">
              {section.headline}
            </h1>
            <p className="cw-v4-hero__lead">{section.subheadline}</p>

            <div className="cw-v4-hero__actions">
              <button
                type="button"
                className="cw-v4-btn cw-v4-btn--appstore"
                onClick={() => onGetApp?.()}
                tabIndex={interactive ? 0 : -1}
              >
                <AppStoreGlyph />
                <span className="cw-v4-appstore__text">
                  <span className="cw-v4-appstore__eyebrow">Download on the</span>
                  <span className="cw-v4-appstore__title">{section.getAppCta}</span>
                </span>
              </button>

              <button
                type="button"
                className="cw-v4-btn cw-v4-btn--primary"
                onClick={() => onPreview?.(LANDING_ANALYTICS_SECTIONS.HERO)}
                tabIndex={interactive ? 0 : -1}
              >
                {section.primaryCta}
              </button>

              <a
                href={section.secondaryHref ?? '#pricing'}
                className="cw-v4-btn cw-v4-btn--secondary"
                tabIndex={interactive ? 0 : -1}
                onClick={(event) => {
                  if (!onChooseTour) return
                  event.preventDefault()
                  onChooseTour()
                }}
              >
                {section.secondaryCta}
              </a>
            </div>

            {reviewsVisible && reviews ? (
              <aside className="cw-v4-reviews" aria-label="Traveler reviews">
                <StarRow rating={reviews.rating} />
                <p className="cw-v4-reviews__quote">{reviews.quote}</p>
                {reviews.attribution ? (
                  <p className="cw-v4-reviews__attr">{reviews.attribution}</p>
                ) : null}
                <a href={reviews.seeMoreHref ?? '#trust'} className="cw-v4-reviews__more">
                  {reviews.seeMoreLabel ?? 'See more'}
                </a>
              </aside>
            ) : null}
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
