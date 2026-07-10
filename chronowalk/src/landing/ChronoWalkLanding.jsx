import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHost } from '../lib/host.js'
import { resolvePreviewUrl } from '../audio/audioUrl.js'
import { track, TRACK_EVENTS } from '../lib/track.js'
import LandingSiteHeader from './LandingSiteHeader.jsx'
import LandingHero from './LandingHero.jsx'
import LandingThresholdSection from './LandingThresholdSection.jsx'
import LandingExperienceSection from './LandingExperienceSection.jsx'
import LandingPersonasSection from './LandingPersonasSection.jsx'
import LandingComparisonSection from './LandingComparisonSection.jsx'
import LandingJourneyLetterSection from './LandingJourneyLetterSection.jsx'
import LandingRomeTiersSection from './LandingRomeTiersSection.jsx'
import LandingSiteFooter from './LandingSiteFooter.jsx'
import { useLandingPrice } from './useLandingPrice.js'
import { buildLandingTierCheckoutUrl, resolveLandingTierCents } from './landingCheckout.js'
import { LANDING_PREVIEW_AUDIO_FILE } from './landingData.js'
import { primePreviewAudioForNavigation } from './previewAudioHandoff.js'
import './ChronoWalkLanding.css'
import './ChronoWalkLanding.v2.css'

/**
 * Premium landing — block flow matching design reference.
 */
export default function ChronoWalkLanding() {
  const navigate = useNavigate()
  const { cents, checkoutUrl } = useLandingPrice()

  useEffect(() => {
    track(TRACK_EVENTS.LANDING_VIEW, { source: 'landing' })
  }, [])

  const handlePreview = useCallback(() => {
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

  return (
    <div className="cw-landing cw-landing--premium">
      <LandingSiteHeader />
      <main>
        <LandingHero onPreview={handlePreview} />
        <LandingThresholdSection />
        <LandingExperienceSection />
        <LandingPersonasSection />
        <LandingComparisonSection />
        <LandingJourneyLetterSection />
        <LandingRomeTiersSection onBeginTier={handleBeginTier} />
      </main>
      <LandingSiteFooter />
    </div>
  )
}
