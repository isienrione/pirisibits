import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHost } from '../lib/host.js'
import { resolvePreviewUrl } from '../audio/audioUrl.js'
import { track, TRACK_EVENTS } from '../lib/track.js'
import LandingSiteHeader from './LandingSiteHeader.jsx'
import LandingHero from './LandingHero.jsx'
import LandingUserFlowSection from './LandingUserFlowSection.jsx'
import LandingMonumentsCarousel from './LandingMonumentsCarousel.jsx'
import LandingBenefitsSection from './LandingBenefitsSection.jsx'
import LandingTryFreeSection from './LandingTryFreeSection.jsx'
import LandingThresholdSection from './LandingThresholdSection.jsx'
import LandingWhoItsForSection from './LandingWhoItsForSection.jsx'
import LandingRomeTiersSection from './LandingRomeTiersSection.jsx'
import LandingFaqSectionV2 from './LandingFaqSectionV2.jsx'
import LandingComparisonSection from './LandingComparisonSection.jsx'
import LandingFinalCtaSectionV2 from './LandingFinalCtaSectionV2.jsx'
import LandingSiteFooter from './LandingSiteFooter.jsx'
import { useLandingPrice } from './useLandingPrice.js'
import { buildLandingTierCheckoutUrl, resolveLandingTierCents } from './landingCheckout.js'
import { LANDING_PREVIEW_AUDIO_FILE } from './landingData.js'
import { primePreviewAudioForNavigation } from './previewAudioHandoff.js'
import './ChronoWalkLanding.css'
import './ChronoWalkLanding.v2.css'

/**
 * Premium landing v3 — clarity-first flow for cold visitors.
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
      <LandingSiteHeader onPreview={handlePreview} />
      <main>
        <LandingHero onPreview={handlePreview} />
        <LandingUserFlowSection />
        <LandingMonumentsCarousel />
        <LandingBenefitsSection />
        <LandingTryFreeSection onPreview={handlePreview} />
        <LandingThresholdSection />
        <LandingWhoItsForSection />
        <LandingRomeTiersSection onBeginTier={handleBeginTier} />
        <LandingFaqSectionV2 />
        <LandingComparisonSection />
        <LandingFinalCtaSectionV2 onPreview={handlePreview} />
      </main>
      <LandingSiteFooter />
    </div>
  )
}
