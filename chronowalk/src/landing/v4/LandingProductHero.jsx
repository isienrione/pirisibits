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
  const [reviewsVisible, setReviewsVisible] = useState(true)

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
            <h1 id="cw-v4-hero-heading" className="cw-v4-hero__title">
              {section.headline}
            </h1>
            <HeroLead text={section.subheadline} highlight={section.subheadlineHighlight} />

            <div className="cw-v4-hero__actions">
              <a
                href={section.secondaryHref ?? '#pricing'}
                className="cw-v4-btn cw-v4-btn--purchase"
                tabIndex={interactive ? 0 : -1}
                onClick={(event) => {
                  if (!onChooseTour) return
                  event.preventDefault()
                  onChooseTour()
                }}
              >
                {section.secondaryCta}
              </a>

              <button
                type="button"
                className="cw-v4-btn cw-v4-btn--primary"
                onClick={() => onPreview?.(LANDING_ANALYTICS_SECTIONS.HERO)}
                tabIndex={interactive ? 0 : -1}
              >
                {section.primaryCta}
              </button>

              <button
                type="button"
                className="cw-v4-btn cw-v4-btn--ghost cw-v4-btn--getapp"
                onClick={() => onGetApp?.()}
                tabIndex={interactive ? 0 : -1}
              >
                {section.getAppCta}
              </button>
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
