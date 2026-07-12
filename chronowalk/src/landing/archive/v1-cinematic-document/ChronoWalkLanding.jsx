import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildCheckoutUrl, getHost } from '../lib/host.js'
import { track, TRACK_EVENTS } from '../lib/track.js'
import LandingHero from './LandingHero.jsx'
import LandingProblemSection from './LandingProblemSection.jsx'
import LandingPromiseSection from './LandingCorePromiseSection.jsx'
import LandingHowItWorksSection from './LandingHowItWorksSection.jsx'
import LandingThresholdDemo from './LandingThresholdDemo.jsx'
import LandingRomeJourneySection from './LandingRomeJourneySection.jsx'
import LandingFinalCtaSection from './LandingFinalCtaSection.jsx'
import LandingStickyCta from './LandingStickyCta.jsx'
import { useLandingPrice } from './useLandingPrice.js'
import './ChronoWalkLanding.css'

/**
 * Cinematic Document landing — standard block flow only.
 * Sections stack vertically; each uses .cw-landing-wrap for centered content.
 */
export default function ChronoWalkLanding() {
  const navigate = useNavigate()
  const { cents, checkoutUrl, label: priceLabel } = useLandingPrice()
  const [stickyVisible, setStickyVisible] = useState(false)

  useEffect(() => {
    track(TRACK_EVENTS.LANDING_VIEW, { source: 'landing' })
  }, [])

  useEffect(() => {
    const hero = document.getElementById('hero')
    if (!hero) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStickyVisible(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '0px 0px -1px 0px' },
    )

    observer.observe(hero)
    return () => observer.disconnect()
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
      console.warn(
        '[ChronoWalk landing] Checkout URL unavailable — using €17 fallback and /access route.',
      )
      navigate('/access')
      return
    }

    track(TRACK_EVENTS.CHECKOUT_OPEN, { price_cents: cents, source: 'landing' })
    window.location.assign(url)
  }, [cents, checkoutUrl, navigate])

  return (
    <main
      className={`cw-landing cw-landing--document${stickyVisible ? ' cw-landing--sticky-pad' : ''}`}
    >
      <LandingHero onBegin={handleBeginJourney} onPreview={handleTryFreeStory} />
      <LandingProblemSection />
      <LandingPromiseSection />
      <LandingHowItWorksSection />
      <LandingThresholdDemo />
      <LandingRomeJourneySection
        priceLabel={priceLabel}
        onBegin={handleBeginJourney}
        onPreview={handleTryFreeStory}
      />
      <LandingFinalCtaSection onBegin={handleBeginJourney} onPreview={handleTryFreeStory} />
      <LandingStickyCta
        visible={stickyVisible}
        priceLabel={priceLabel}
        onBegin={handleBeginJourney}
        onPreview={handleTryFreeStory}
      />
    </main>
  )
}
