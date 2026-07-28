import { useEffect, useState } from 'react'
import { LANDING_CONTENT } from '../landingData.js'
import { LANDING_HERO } from '../landingVisualAssets.js'
import { LandingResponsivePicture } from '../LandingResponsivePicture.jsx'
import { LANDING_ANALYTICS_SECTIONS } from '../landingAnalytics.js'
import { HERO_SLIDESHOW_SLIDES } from './heroSlideshowData.js'

const SLIDE_MS = 7000
const FADE_MS = 900

function bgUrl(background) {
  if (!background) return ''
  if (typeof background === 'string') return background
  return background.desktopSrc || background.mobileSrc || ''
}

function BrandMark() {
  return (
    <p className="cw-v4-hero-slide__brand">
      <img src="/brand/emblem-light.png" alt="" width={28} height={28} decoding="async" />
      <span>CHRONOWALK</span>
    </p>
  )
}

function FeatureChip({ title, body }) {
  return (
    <li className="cw-v4-hero-slide__chip">
      <span className="cw-v4-hero-slide__chip-mark" aria-hidden />
      <span>
        <strong>{title}</strong>
        <span>{body}</span>
      </span>
    </li>
  )
}

function PhoneFrame({ src, alt }) {
  return (
    <div className="cw-v4-hero-slide__phone" aria-hidden={alt ? undefined : true}>
      <div className="cw-v4-hero-slide__phone-bezel">
        <img src={src} alt={alt || ''} decoding="async" />
      </div>
    </div>
  )
}

function SlideBackdrop({ background, children }) {
  const isPlane = background && typeof background === 'object' && background.desktopSrc
  return (
    <div className="cw-v4-hero-slide__backdrop" aria-hidden>
      {isPlane ? (
        <LandingResponsivePicture image={background} className="cw-v4-hero-slide__photo" sizes="100vw" />
      ) : (
        <img className="cw-v4-hero-slide__photo" src={bgUrl(background)} alt="" decoding="async" />
      )}
      <div className="cw-v4-hero-slide__veil" />
      {children}
    </div>
  )
}

function StorySlide({ slide }) {
  if (slide.layout === 'split-threshold') {
    return (
      <div className="cw-v4-hero-slide cw-v4-hero-slide--split">
        <SlideBackdrop background={slide.background} />
        <div className="cw-v4-hero-slide__content cw-v4-hero-slide__content--center">
          <BrandMark />
          <h2 className="cw-v4-hero-slide__title">{slide.title}</h2>
          <p className="cw-v4-hero-slide__subtitle">{slide.subtitle}</p>
          <div className="cw-v4-hero-slide__split-frame" aria-hidden>
            <img src={slide.nowSrc} alt="" decoding="async" />
            <img src={slide.thenSrc} alt="" decoding="async" />
            <span className="cw-v4-hero-slide__seam" />
          </div>
          <ul className="cw-v4-hero-slide__chips cw-v4-hero-slide__chips--bar">
            {slide.features.map((f) => (
              <FeatureChip key={f.title} {...f} />
            ))}
          </ul>
        </div>
      </div>
    )
  }

  if (slide.layout === 'copy-phone') {
    return (
      <div className="cw-v4-hero-slide cw-v4-hero-slide--copy-phone">
        <SlideBackdrop background={slide.background} />
        <div className="cw-v4-hero-slide__content cw-v4-hero-slide__content--split">
          <div className="cw-v4-hero-slide__copy">
            <BrandMark />
            <h2 className="cw-v4-hero-slide__title">{slide.title}</h2>
            <p className="cw-v4-hero-slide__subtitle">{slide.subtitle}</p>
            <ul
              className={`cw-v4-hero-slide__chips${slide.featuresStacked ? ' cw-v4-hero-slide__chips--stack' : ''}`}
            >
              {slide.features.map((f) => (
                <FeatureChip key={f.title} {...f} />
              ))}
            </ul>
            {slide.footer ? <p className="cw-v4-hero-slide__footer">{slide.footer}</p> : null}
          </div>
          <PhoneFrame src={slide.phoneSrc} alt={slide.phoneAlt} />
        </div>
      </div>
    )
  }

  if (slide.layout === 'evidence') {
    return (
      <div className="cw-v4-hero-slide cw-v4-hero-slide--evidence">
        <SlideBackdrop background={slide.background} />
        <div className="cw-v4-hero-slide__content">
          <BrandMark />
          <h2 className="cw-v4-hero-slide__title">{slide.title}</h2>
          <p className="cw-v4-hero-slide__subtitle">{slide.subtitle}</p>
          <ul className="cw-v4-hero-slide__cards">
            {slide.features.map((f) => (
              <li key={f.title} className="cw-v4-hero-slide__card">
                <span className="cw-v4-hero-slide__chip-mark" aria-hidden />
                <strong>{f.title}</strong>
                <p>{f.body}</p>
              </li>
            ))}
          </ul>
          <p className="cw-v4-hero-slide__banner">{slide.banner}</p>
        </div>
      </div>
    )
  }

  if (slide.layout === 'coverage') {
    const mid = Math.ceil(slide.stops.length / 2)
    const left = slide.stops.slice(0, mid)
    const right = slide.stops.slice(mid)
    return (
      <div className="cw-v4-hero-slide cw-v4-hero-slide--coverage">
        <SlideBackdrop background={slide.background} />
        <div className="cw-v4-hero-slide__content cw-v4-hero-slide__content--center">
          <BrandMark />
          <h2 className="cw-v4-hero-slide__title">{slide.title}</h2>
          <p className="cw-v4-hero-slide__subtitle">
            {slide.subtitleParts.map((part) =>
              part.gold ? (
                <span key={part.text} className="cw-v4-hero-slide__gold">
                  {part.text}
                </span>
              ) : (
                <span key={part.text}>{part.text}</span>
              ),
            )}
          </p>
          <div className="cw-v4-hero-slide__coverage-panel">
            <ol className="cw-v4-hero-slide__stop-list">
              {left.map((name, i) => (
                <li key={name}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  {name}
                </li>
              ))}
            </ol>
            <ol className="cw-v4-hero-slide__stop-list" start={mid + 1}>
              {right.map((name, i) => (
                <li key={name}>
                  <span>{String(mid + i + 1).padStart(2, '0')}</span>
                  {name}
                </li>
              ))}
            </ol>
            <div className="cw-v4-hero-slide__coverage-callout">
              <BrandMark />
              <p className="cw-v4-hero-slide__gold">{slide.calloutTitle}</p>
              <p>{slide.calloutBody}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (slide.layout === 'packages') {
    return (
      <div className="cw-v4-hero-slide cw-v4-hero-slide--packages">
        <SlideBackdrop background={slide.background} />
        <div className="cw-v4-hero-slide__content cw-v4-hero-slide__content--center">
          <BrandMark />
          <h2 className="cw-v4-hero-slide__title">{slide.title}</h2>
          <p className="cw-v4-hero-slide__subtitle">{slide.subtitle}</p>
          <div className="cw-v4-hero-slide__package-grid">
            {slide.packages.map((pkg) => (
              <article key={pkg.id} className="cw-v4-hero-slide__package">
                <h3>{pkg.name}</h3>
                <p className="cw-v4-hero-slide__package-desc">{pkg.description}</p>
                <p className="cw-v4-hero-slide__package-price">
                  {pkg.price} <span>{pkg.priceNote}</span>
                </p>
                <img src={pkg.image} alt="" decoding="async" />
                <dl>
                  <div>
                    <dt>Est. duration</dt>
                    <dd>{pkg.duration}</dd>
                  </div>
                  <div>
                    <dt>Key stops</dt>
                    <dd>{pkg.stops}</dd>
                  </div>
                </dl>
                <a className="cw-v4-btn cw-v4-btn--primary" href="#pricing">
                  {pkg.cta}
                </a>
              </article>
            ))}
          </div>
          <ul className="cw-v4-hero-slide__chips cw-v4-hero-slide__chips--bar">
            {slide.features.map((f) => (
              <FeatureChip key={f.title} {...f} />
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return null
}

/**
 * Rome-sky hero with a mild fade slideshow.
 * Slide 0 = current primary hero; secondary slides rotate after it.
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
              className={`cw-v4-hero__slide-layer${active ? ' is-active' : ''}`}
              aria-hidden={!active}
              inert={active ? undefined : true}
            >
              <StorySlide slide={slide} />
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
