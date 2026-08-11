import { useEffect, useMemo, useRef, useState } from 'react'
import { Expand } from 'lucide-react'
import { LANDING_CONTENT, ROME_TIERS } from '../landingData.js'
import { LANDING_HERO } from '../landingVisualAssets.js'
import { LandingResponsivePicture } from '../LandingResponsivePicture.jsx'
import { LANDING_ANALYTICS_SECTIONS } from '../landingAnalytics.js'
import OfferPriceDisplay, { LaunchOfferUnlockCtaLabel } from '../OfferPriceDisplay.jsx'
import {
  getLaunchOfferHeroPriceParts,
  mapOffersWithLaunchOffer,
} from '../../lib/launchOffer.js'
import { trackCtaClick } from '../../lib/analytics.ts'
import { HERO_SLIDESHOW_SLIDES } from './heroSlideshowData.js'
import { LandingZoomableImageViewer } from './LandingPackagePosterViewer.jsx'
import { preloadLandingImages, retryImageOnError } from './preloadLandingImages.js'
import { installSafariPageZoomBlock } from '../../utils/safariPageZoom.js'
import { useI18n } from '../../i18n/I18nProvider.jsx'
import { localizeLandingOffers } from '../getLocalizedLanding.js'

/** Crossfade duration for deliberate slide changes (respects prefers-reduced-motion in CSS). */
const FADE_MS = 400
const SWIPE_THRESHOLD_PX = 48

/** Approximate click targets over the Choose your walk marketing frame. */
const PACKAGE_HOTSPOTS = [
  {
    id: 'rome-complete',
    style: { left: '7%', top: '24%', width: '28%', height: '34%' },
  },
  {
    id: 'rome-essential',
    style: { left: '36%', top: '24%', width: '28%', height: '34%' },
  },
  {
    id: 'rome-central',
    style: { left: '65%', top: '24%', width: '28%', height: '34%' },
  },
  {
    id: 'rome-couple',
    style: { left: '7%', top: '60%', width: '42%', height: '18%' },
  },
  {
    id: 'rome-family',
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

const WALK_PACKAGE_IDS = new Set(['rome-complete', 'rome-essential', 'rome-central'])
const BUNDLE_PACKAGE_IDS = new Set(['rome-couple', 'rome-family'])

/**
 * Scroll to a stable section start (not mid-card), then sync hash so mobile
 * route tabs / deep links select the right package.
 */
function scrollToPricingTarget(id) {
  const scrollId = BUNDLE_PACKAGE_IDS.has(id)
    ? 'shared-experience'
    : WALK_PACKAGE_IDS.has(id)
      ? 'pricing'
      : id || 'pricing'

  if (id && typeof window !== 'undefined') {
    const next = `#${id}`
    if (window.location.hash !== next) {
      window.history.replaceState(null, '', next)
      window.dispatchEvent(new Event('hashchange'))
    }
  }

  const target =
    document.getElementById(scrollId) ||
    document.getElementById('pricing')

  if (!target) {
    window.location.hash = id ? `#${id}` : '#pricing'
    return
  }

  // Let hash listeners update the mobile tab before measuring scroll.
  window.requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

/**
 * Manual hero gallery: Rome-sky + marketing frames.
 * Advances only via swipe, prev/next, dots, or focused keyboard arrows — never on a timer.
 *
 * Optional `hero` is a resolved intent overlay from `resolveLandingIntentHero`.
 */
export default function LandingProductHero({
  hero,
  onPreview,
  onChooseTour,
  onGetApp,
  onContinueWalk,
  tiers = ROME_TIERS,
}) {
  const { locale, t } = useI18n()
  const section = hero ?? LANDING_CONTENT.hero
  const heroImage = section.heroImage ?? LANDING_HERO
  const previewFirst = section.ctaPriority === 'preview'
  const storySlides = HERO_SLIDESHOW_SLIDES
  const total = 1 + storySlides.length
  const [index, setIndex] = useState(0)
  const [viewerSlide, setViewerSlide] = useState(null)
  const touchStartX = useRef(null)
  const expandTriggerRef = useRef(null)
  const heroRef = useRef(null)
  const offerTiersById = useMemo(() => {
    const mapped = localizeLandingOffers(mapOffersWithLaunchOffer(tiers), locale)
    return Object.fromEntries(mapped.map((tier) => [tier.id, tier]))
  }, [locale, tiers])

  // Warm pricing posters only — do not preload every hero story frame at LCP.
  useEffect(() => {
    preloadLandingImages(tiers.map((tier) => tier.cardImage))
  }, [tiers])

  // Safari: keep pinch/double-tap from locking the whole page on hero art.
  useEffect(() => installSafariPageZoomBlock(heroRef.current), [])

  // Prefetch only the adjacent story frame after the visitor moves off slide 0.
  useEffect(() => {
    if (index < 1) return undefined
    const neighbors = [storySlides[index - 1], storySlides[index], storySlides[index + 1]]
      .filter(Boolean)
      .map((slide) => slide.src)
    preloadLandingImages(neighbors)
    return undefined
  }, [index, storySlides])

  const goTo = (next) => {
    setIndex(((next % total) + total) % total)
  }

  const goPrev = () => goTo(index - 1)
  const goNext = () => goTo(index + 1)

  const openSlideViewer = (slide, triggerEl) => {
    if (triggerEl) expandTriggerRef.current = triggerEl
    setViewerSlide(slide)
  }

  const onHeroKeyDown = (event) => {
    if (viewerSlide || total < 2) return
    const tag = event.target?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable) {
      return
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goPrev()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      goNext()
    }
  }

  const interactive = index === 0

  return (
    <section
      ref={heroRef}
      id={section.id}
      className="cw-v4-hero"
      aria-labelledby="cw-v4-hero-heading"
      aria-roledescription="carousel"
      aria-label={t('landing.hero.galleryAria')}
      tabIndex={0}
      onKeyDown={onHeroKeyDown}
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
        if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return
        if (delta > 0) goPrev()
        else goNext()
      }}
    >
      <div className="cw-v4-hero__stage" style={{ '--cw-hero-fade-ms': `${FADE_MS}ms` }}>
        <div className={`cw-v4-hero__slide-layer${index === 0 ? ' is-active' : ''}`}>
          <div className="cw-v4-hero__sky" aria-hidden>
            <LandingResponsivePicture
              image={heroImage}
              className="cw-v4-hero__photo"
              loading="eager"
              fetchPriority="high"
              sizes="100vw"
            />
            <div className="cw-v4-hero__clouds" />
            <div className="cw-v4-hero__veil" />
          </div>

          <div className="cw-v4-hero__copy">
            {section.eyebrow ? (
              <p className="cw-v4-hero__eyebrow">{section.eyebrow}</p>
            ) : null}
            <h1 id="cw-v4-hero-heading" className="cw-v4-hero__title">
              {section.headline}
            </h1>
            {section.accentLine ? (
              <p className="cw-v4-hero__accent">{section.accentLine}</p>
            ) : null}
            <HeroLead text={section.subheadline} highlight={section.subheadlineHighlight} />

            <div className="cw-v4-hero__actions cw-v4-hero__actions--pair">
              {(() => {
                const offerParts = getLaunchOfferHeroPriceParts()
                const unlockCta = (
                  <a
                    key="unlock"
                    href={section.getAppHref ?? '#pricing'}
                    className={`cw-v4-btn cw-v4-btn--getapp${offerParts ? ' cw-v4-btn--getapp-offer' : ''}`}
                    aria-label={section.getAppCta}
                    tabIndex={interactive ? 0 : -1}
                    onClick={(event) => {
                      if (!onGetApp && !onChooseTour) return
                      event.preventDefault()
                      ;(onGetApp || onChooseTour)?.()
                    }}
                  >
                    {/* Single visible label tree — CSS toggles full vs short, never both. */}
                    <span className="cw-v4-btn-label cw-v4-btn-label--full" aria-hidden="true">
                      {offerParts ? (
                        <LaunchOfferUnlockCtaLabel fallback={section.getAppCta} onDark />
                      ) : (
                        section.getAppCta
                      )}
                    </span>
                    <span className="cw-v4-btn-label cw-v4-btn-label--short" aria-hidden="true">
                      {offerParts ? (
                        <LaunchOfferUnlockCtaLabel
                          fallback={section.getAppCtaShort ?? section.getAppCta}
                          short
                          onDark
                        />
                      ) : (
                        section.getAppCtaShort ?? section.getAppCta
                      )}
                    </span>
                  </a>
                )

                // First visit: free Pantheon. Returning walker: Continue.
                // Unlock always stays as the other pill in the horizontal pair.
                const freeOrContinue = onContinueWalk ? (
                  <button
                    key="continue"
                    type="button"
                    className="cw-v4-btn cw-v4-btn--primary"
                    aria-label={t('landing.hero.continueAria')}
                    onClick={onContinueWalk}
                    tabIndex={interactive ? 0 : -1}
                  >
                    <span className="cw-v4-btn-label cw-v4-btn-label--full" aria-hidden="true">
                      {t('landing.hero.continue')}
                    </span>
                    <span className="cw-v4-btn-label cw-v4-btn-label--short" aria-hidden="true">
                      {t('landing.hero.continueShort')}
                    </span>
                  </button>
                ) : (
                  <button
                    key="preview"
                    type="button"
                    className="cw-v4-btn cw-v4-btn--primary"
                    aria-label={section.primaryCtaAriaLabel || section.primaryCta}
                    onClick={() => onPreview?.(LANDING_ANALYTICS_SECTIONS.HERO)}
                    tabIndex={interactive ? 0 : -1}
                  >
                    <span className="cw-v4-btn-label cw-v4-btn-label--full" aria-hidden="true">
                      {section.primaryCta}
                    </span>
                    <span className="cw-v4-btn-label cw-v4-btn-label--short" aria-hidden="true">
                      {t('landing.hero.tryPantheonShort')}
                    </span>
                  </button>
                )

                // Default: Unlock | Free/Continue. Pantheon intent: Free first.
                return previewFirst ? (
                  <>
                    {freeOrContinue}
                    {unlockCta}
                  </>
                ) : (
                  <>
                    {unlockCta}
                    {freeOrContinue}
                  </>
                )
              })()}

              {section.trustLine ? (
                <p className="cw-v4-hero__trust">{section.trustLine}</p>
              ) : null}

              {section.secondaryCta && section.secondaryHref ? (
                <a
                  href={section.secondaryHref}
                  className="cw-v4-btn cw-v4-btn--purchase"
                  tabIndex={interactive ? 0 : -1}
                  onClick={(event) => {
                    const id = section.secondaryHref.replace(/^#/, '')
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
              ) : null}
            </div>
          </div>
        </div>

        {storySlides.map((slide, slideIndex) => {
          const active = index === slideIndex + 1
          const isPackages = slide.id === 'choose-your-walk'
          const offerTier = slide.pricingTarget ? offerTiersById[slide.pricingTarget] : null
          const packageHotspots = isPackages
            ? PACKAGE_HOTSPOTS
            : slide.pricingTarget
              ? [
                  {
                    id: slide.pricingTarget,
                    label: offerTier
                      ? `${offerTier.name} · ${
                          offerTier.launchOffer
                            ? `${offerTier.basePrice} · ${offerTier.price}`
                            : offerTier.price
                        }`
                      : slide.title,
                    // Cover painted price + Buy on the package poster.
                    style: { left: '5%', top: '68%', width: '90%', height: '24%' },
                  },
                ]
              : null
          const hasHotspots = Boolean(packageHotspots?.length)
          const themeClass = offerTier?.theme ? ` cw-v4-pkg--${offerTier.theme}` : ''
          return (
            <div
              key={slide.id}
              className={`cw-v4-hero__slide-layer cw-v4-hero__slide-layer--art${active ? ' is-active' : ''}`}
              aria-hidden={!active}
            >
              <div className={`cw-v4-hero__art-frame${hasHotspots ? ' cw-v4-hero__art-frame--hotspots' : ''}`}>
                {hasHotspots ? (
                  <div className={`cw-v4-hero__art-shell${themeClass}`}>
                    <img
                      className="cw-v4-hero__art"
                      src={slide.src}
                      alt=""
                      width={slide.width}
                      height={slide.height}
                      decoding="async"
                      loading={active ? 'eager' : 'lazy'}
                      fetchPriority={active ? 'high' : 'low'}
                      onError={retryImageOnError}
                    />
                    {offerTier?.launchOffer ? (
                      <div
                        className="cw-v4-pkg__offer-panel cw-v4-hero__pkg-offer"
                        data-testid={`cw-hero-pkg-offer-${offerTier.id}`}
                        aria-hidden="true"
                      >
                        <div className="cw-v4-pkg__offer-panel-buy">
                          <OfferPriceDisplay
                            className="cw-v4-pkg__offer-panel-price"
                            price={offerTier.price}
                            basePrice={offerTier.basePrice}
                            offerLabel={offerTier.offerLabel}
                            saveLabel={offerTier.saveLabel}
                            note={offerTier.priceNote}
                            noteClassName="cw-v4-pkg__offer-panel-note"
                            launchOffer
                          />
                        </div>
                        <span className="cw-v4-pkg__offer-panel-cta">
                          <span className="cw-v4-pkg__offer-panel-cta-label">{offerTier.primaryCta}</span>
                          <span className="cw-v4-pkg__offer-panel-cta-arrow" aria-hidden="true">
                            →
                          </span>
                        </span>
                      </div>
                    ) : null}
                    <div className="cw-v4-hero__art-hotspots" aria-hidden={!active}>
                      {packageHotspots.map((spot) => (
                        <a
                          key={spot.id}
                          href={`#${spot.id}`}
                          className="cw-v4-hero__hotspot"
                          style={spot.style}
                          aria-label={spot.label ?? offerTiersById[spot.id]?.name ?? spot.id}
                          tabIndex={active ? 0 : -1}
                          onClick={(event) => {
                            event.preventDefault()
                            trackCtaClick({ tier: spot.id, ctaLocation: 'route_card' })
                            scrollToPricingTarget(spot.id)
                          }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="cw-v4-hero__art-enlarge"
                      tabIndex={active ? 0 : -1}
                      aria-label={t('landing.hero.enlargeNamed', { title: slide.title })}
                      onClick={(event) => openSlideViewer(slide, event.currentTarget)}
                    >
                      <Expand size={16} aria-hidden="true" />
                      <span>{t('landing.hero.enlarge')}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="cw-v4-hero__art-hit"
                    tabIndex={active ? 0 : -1}
                    aria-label={t('landing.hero.enlargeNamed', { title: slide.title })}
                    onClick={(event) => openSlideViewer(slide, event.currentTarget)}
                  >
                    <img
                      className="cw-v4-hero__art"
                      src={slide.src}
                      alt=""
                      width={slide.width}
                      height={slide.height}
                      decoding="async"
                      loading={active ? 'eager' : 'lazy'}
                      fetchPriority={active ? 'high' : 'low'}
                      onError={retryImageOnError}
                    />
                    <span className="cw-v4-hero__art-enlarge cw-v4-hero__art-enlarge--on-art">
                      <Expand size={16} aria-hidden="true" />
                      <span>{t('landing.hero.tapToEnlarge')}</span>
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
            aria-label={t('landing.hero.previousImage')}
            onClick={goPrev}
          >
            <span aria-hidden>‹</span>
          </button>
          <button
            type="button"
            className="cw-v4-hero__arrow cw-v4-hero__arrow--next"
            aria-label={t('landing.hero.nextImage')}
            onClick={goNext}
          >
            <span aria-hidden>›</span>
          </button>
          <div className="cw-v4-hero__dots" role="tablist" aria-label={t('landing.hero.imagesAria')}>
            {Array.from({ length: total }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={index === i}
                aria-label={
                  i === 0
                    ? t('landing.hero.mainImage')
                    : storySlides[i - 1]?.title ||
                      t('landing.hero.imageNumber', { number: i + 1 })
                }
                className={`cw-v4-hero__dot${index === i ? ' is-active' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      ) : null}

      {viewerSlide ? (
        <LandingZoomableImageViewer
          open
          src={viewerSlide.src}
          title={viewerSlide.title}
          width={viewerSlide.width}
          height={viewerSlide.height}
          accent={offerTiersById[viewerSlide.pricingTarget]?.theme ?? 'eterna'}
          action={(() => {
            const tier = viewerSlide.pricingTarget
              ? offerTiersById[viewerSlide.pricingTarget]
              : null
            if (!tier) return null
            return {
              name: tier.name,
              price: tier.price,
              basePrice: tier.basePrice,
              offerLabel: tier.offerLabel,
              saveLabel: tier.saveLabel,
              launchOffer: tier.launchOffer,
              ctaLabel: tier.primaryCta,
              onCta: () => {
                trackCtaClick({ tier: tier.id, ctaLocation: 'route_card' })
                setViewerSlide(null)
                scrollToPricingTarget(tier.id)
              },
            }
          })()}
          onClose={() => {
            setViewerSlide(null)
            const trigger = expandTriggerRef.current
            expandTriggerRef.current = null
            window.requestAnimationFrame(() => trigger?.focus?.())
          }}
        />
      ) : null}
    </section>
  )
}
