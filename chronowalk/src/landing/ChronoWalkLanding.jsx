import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHost } from '../lib/host.js'
import { resolvePreviewUrl } from '../audio/audioUrl.js'
import { track, TRACK_EVENTS } from '../lib/track.js'
import LandingHero from './LandingHero.jsx'
import LandingProblemSection from './LandingProblemSection.jsx'
import LandingPromiseSection from './LandingCorePromiseSection.jsx'
import LandingComparisonSection from './LandingComparisonSection.jsx'
import LandingHowItWorksSection from './LandingHowItWorksSection.jsx'
import LandingLifestyleSection from './LandingLifestyleSection.jsx'
import LandingThresholdDemo from './LandingThresholdDemo.jsx'
import LandingRomeJourneySection from './LandingRomeJourneySection.jsx'
import LandingRomeTiersSection from './LandingRomeTiersSection.jsx'
import LandingFinalCtaSection from './LandingFinalCtaSection.jsx'
import LandingStickyCta from './LandingStickyCta.jsx'
import { useLandingPrice } from './useLandingPrice.js'
import { buildLandingTierCheckoutUrl, resolveLandingTierCents } from './landingCheckout.js'
import { LANDING_PREVIEW_AUDIO_FILE } from './landingData.js'
import { primePreviewAudioForNavigation } from './previewAudioHandoff.js'
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
    const url = resolvePreviewUrl(LANDING_PREVIEW_AUDIO_FILE)
    if (url) primePreviewAudioForNavigation(url)
    navigate('/preview')
  }, [navigate])

  const handleLivePantheon = useCallback(() => {
    track(TRACK_EVENTS.LANDING_CTA_PREVIEW, { source: 'landing', preview: 'pantheon' })
    const url = resolvePreviewUrl(LANDING_PREVIEW_AUDIO_FILE)
    if (url) primePreviewAudioForNavigation(url)
    navigate('/preview')
  }, [navigate])

  const handleBeginTier = useCallback(
    (tierId) => {
      track(TRACK_EVENTS.LANDING_CTA_BEGIN, { source: 'landing', tier: tierId })

      const tierCents = resolveLandingTierCents(tierId, cents)
      const url = buildLandingTierCheckoutUrl(checkoutUrl, tierId, {
        host: getHost(),
        abVariantCents: cents,
      })

      if (!url) {
        console.warn(
          '[ChronoWalk landing] Checkout URL unavailable — using tier fallback and /access route.',
          tierId,
        )
        navigate('/access')
        return
      }

      track(TRACK_EVENTS.CHECKOUT_OPEN, {
        price_cents: tierCents,
        source: 'landing',
        tier: tierId,
      })
      window.location.assign(url)
    },
    [cents, checkoutUrl, navigate],
  )

  const handleBeginJourney = useCallback(() => {
    handleBeginTier('rome-complete')
  }, [handleBeginTier])

  return (
    <main
      className={`cw-landing cw-landing--document${stickyVisible ? ' cw-landing--sticky-pad' : ''}`}
    >
      <LandingHero onBegin={handleBeginJourney} onLivePantheon={handleLivePantheon} />
      <LandingProblemSection />
      <LandingPromiseSection />
      <LandingComparisonSection />
      <LandingHowItWorksSection />
      <LandingLifestyleSection />
      <LandingThresholdDemo />
      <LandingRomeJourneySection
        priceLabel={priceLabel}
        onBegin={handleBeginJourney}
        onPreview={handleTryFreeStory}
      />
      <LandingRomeTiersSection onBeginTier={handleBeginTier} />
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
