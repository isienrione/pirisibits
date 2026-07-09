import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildCheckoutUrl, getHost } from '../lib/host.js'
import { track, TRACK_EVENTS } from '../lib/track.js'
import {
  LANDING_PRICE_FALLBACK_LABEL,
  ROME_JOURNEY_SECTION_ID,
} from './landingData.js'
import { useLandingPrice } from './useLandingPrice.js'
import LandingHostBanner from './LandingHostBanner.jsx'
import LandingHero from './LandingHero.jsx'
import LandingProblemSection from './LandingProblemSection.jsx'
import LandingNoItinerarySection from './LandingNoItinerarySection.jsx'
import LandingCorePromiseSection from './LandingCorePromiseSection.jsx'
import LandingHowItWorksSection from './LandingHowItWorksSection.jsx'
import LandingThresholdDemo from './LandingThresholdDemo.jsx'
import LandingFreeStorySection from './LandingFreeStorySection.jsx'
import LandingRomeJourneySection from './LandingRomeJourneySection.jsx'
import LandingBetterThanSection from './LandingBetterThanSection.jsx'
import LandingWhatYouGetSection from './LandingWhatYouGetSection.jsx'
import LandingCredibilitySection from './LandingCredibilitySection.jsx'
import LandingJourneyLetterSection from './LandingJourneyLetterSection.jsx'
import LandingSocialProofSection from './LandingSocialProofSection.jsx'
import LandingFaqSection from './LandingFaqSection.jsx'
import LandingFinalCtaSection from './LandingFinalCtaSection.jsx'
import LandingStickyCta from './LandingStickyCta.jsx'
import './ChronoWalkLanding.css'

export default function ChronoWalkLanding() {
  const navigate = useNavigate()
  const { cents, checkoutUrl, label } = useLandingPrice()
  const priceLabel = label || LANDING_PRICE_FALLBACK_LABEL

  const heroRef = useRef(null)
  const finalCtaRef = useRef(null)
  const productScrolledRef = useRef(false)
  const [stickyVisible, setStickyVisible] = useState(false)
  const [padForSticky, setPadForSticky] = useState(false)

  useEffect(() => {
    track(TRACK_EVENTS.LANDING_VIEW, { source: 'landing' })
  }, [])

  const scrollToRomeJourney = useCallback(() => {
    document.getElementById(ROME_JOURNEY_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleTryFreeStory = useCallback(() => {
    track(TRACK_EVENTS.LANDING_CTA_PREVIEW, { source: 'landing' })
    navigate('/preview')
  }, [navigate])

  const handleBeginJourney = useCallback(() => {
    track(TRACK_EVENTS.LANDING_CTA_BEGIN, { source: 'landing' })

    const url = buildCheckoutUrl(checkoutUrl, {
      host: getHost(),
      abVariantCents: cents,
    })

    if (!url) {
      if (import.meta.env.DEV) {
        console.warn(
          '[ChronoWalk landing] Checkout URL unavailable — set VITE_LEMON_CHECKOUT_URL or configure Supabase checkout_url.',
        )
      }
      navigate('/access')
      return
    }

    track(TRACK_EVENTS.CHECKOUT_OPEN, { price_cents: cents, source: 'landing' })
    window.location.assign(url)
  }, [cents, checkoutUrl, navigate])

  useEffect(() => {
    const heroEl = heroRef.current
    const finalEl = finalCtaRef.current
    const productEl = document.getElementById(ROME_JOURNEY_SECTION_ID)

    if (!heroEl || !finalEl) return undefined

    let heroVisible = true
    let finalVisible = false

    const updateSticky = () => {
      const show = !heroVisible && !finalVisible
      setStickyVisible(show)
      setPadForSticky(show)
    }

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        heroVisible = entry.isIntersecting
        updateSticky()
      },
      { threshold: 0.12 },
    )

    const finalObserver = new IntersectionObserver(
      ([entry]) => {
        finalVisible = entry.isIntersecting
        updateSticky()
      },
      { threshold: 0.2 },
    )

    heroObserver.observe(heroEl)
    finalObserver.observe(finalEl)

    let productObserver
    if (productEl) {
      productObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !productScrolledRef.current) {
            productScrolledRef.current = true
            track(TRACK_EVENTS.LANDING_SCROLL_PRODUCT, { source: 'landing' })
          }
        },
        { threshold: 0.35 },
      )
      productObserver.observe(productEl)
    }

    return () => {
      heroObserver.disconnect()
      finalObserver.disconnect()
      productObserver?.disconnect()
    }
  }, [])

  return (
    <div className={`redesign-app-shell cw-landing${padForSticky ? ' cw-landing--sticky-pad' : ''}`}>
      <div ref={heroRef}>
        <LandingHero
          priceLabel={priceLabel}
          onBegin={handleBeginJourney}
          onPreview={handleTryFreeStory}
        />
      </div>

      <div className="cw-landing__body">
        <div className="cw-landing__host-wrap">
          <LandingHostBanner />
        </div>

        <LandingProblemSection />
        <LandingNoItinerarySection onScrollToProduct={scrollToRomeJourney} />
        <LandingCorePromiseSection />
        <LandingHowItWorksSection />
        <LandingThresholdDemo />
        <LandingFreeStorySection onPreview={handleTryFreeStory} onScrollToProduct={scrollToRomeJourney} />
        <LandingRomeJourneySection
          priceLabel={priceLabel}
          onBegin={handleBeginJourney}
          onPreview={handleTryFreeStory}
        />
        <LandingBetterThanSection />
        <LandingWhatYouGetSection priceLabel={priceLabel} />
        <LandingCredibilitySection />
        <LandingJourneyLetterSection />
        <LandingSocialProofSection />
        <LandingFaqSection />
        <div ref={finalCtaRef}>
          <LandingFinalCtaSection
            priceLabel={priceLabel}
            onBegin={handleBeginJourney}
            onPreview={handleTryFreeStory}
          />
        </div>
      </div>

      <LandingStickyCta
        visible={stickyVisible}
        priceLabel={priceLabel}
        onBegin={handleBeginJourney}
        onPreview={handleTryFreeStory}
      />
    </div>
  )
}
