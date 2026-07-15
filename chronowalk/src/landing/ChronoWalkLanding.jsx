import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHost } from '../lib/host.js'
import { resolvePreviewUrl } from '../audio/audioUrl.js'
import { track, TRACK_EVENTS } from '../lib/track.js'
import LandingAct from './LandingAct.jsx'
import LandingSiteHeader from './LandingSiteHeader.jsx'
import LandingHero from './LandingHero.jsx'
import LandingEmotionalInterludeSection from './LandingEmotionalInterludeSection.jsx'
import LandingThresholdSection from './LandingThresholdSection.jsx'
import LandingEarlyCtaSection from './LandingEarlyCtaSection.jsx'
import LandingUserFlowSection from './LandingUserFlowSection.jsx'
import LandingRealMomentSection from './LandingRealMomentSection.jsx'
import LandingMonumentsCarousel from './LandingMonumentsCarousel.jsx'
import LandingBenefitsSection from './LandingBenefitsSection.jsx'
import LandingTryFreeSection from './LandingTryFreeSection.jsx'
import LandingRomeTiersSection from './LandingRomeTiersSection.jsx'
import LandingWhyChronoWalkSection from './LandingWhyChronoWalkSection.jsx'
import LandingTrustProofSection from './LandingTrustProofSection.jsx'
import LandingFaqSectionV2 from './LandingFaqSectionV2.jsx'
import LandingAfterRomeSection from './LandingAfterRomeSection.jsx'
import LandingFinalCtaSectionV2 from './LandingFinalCtaSectionV2.jsx'
import LandingSiteFooter from './LandingSiteFooter.jsx'
import { ROME_JOURNEY_SECTION_ID, LANDING_ACTS, LANDING_PREVIEW_AUDIO_FILE } from './landingData.js'
import { useLandingPrice } from './useLandingPrice.js'
import { buildLandingTierCheckoutUrl, resolveLandingTierCents } from './landingCheckout.js'
import { primePreviewAudioForNavigation } from './previewAudioHandoff.js'
import {
  buildLandingProductSchema,
  LANDING_DOCUMENT,
  trackLandingViewOnce,
} from './landingSeo.js'
import './ChronoWalkLanding.css'
import './ChronoWalkLanding.v2.css'

/**
 * Premium landing — editorial three-act architecture.
 * Act I Promise → Act II Experience → Act III Decision.
 * Baseline preserved in archive/v3-premium-baseline-2026-07-14/.
 */
export default function ChronoWalkLanding() {
  const navigate = useNavigate()
  const { cents, checkoutUrl } = useLandingPrice()

  useEffect(() => {
    trackLandingViewOnce(track, TRACK_EVENTS.LANDING_VIEW, { source: 'landing' })
  }, [])

  useEffect(() => {
    const previousTitle = document.title
    document.title = LANDING_DOCUMENT.title
    const meta = document.querySelector('meta[name="description"]')
    const previousDescription = meta?.getAttribute('content') ?? null
    if (meta) meta.setAttribute('content', LANDING_DOCUMENT.description)
    return () => {
      document.title = previousTitle
      if (meta && previousDescription != null) meta.setAttribute('content', previousDescription)
    }
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

  const [actPromise, actExperience, actDecision] = LANDING_ACTS
  const productSchema = buildLandingProductSchema()

  return (
    <div className="cw-landing cw-landing--premium cw-landing--editorial">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <LandingSiteHeader onPreview={handlePreview} />
      <main>
        <LandingAct
          id={actPromise.id}
          label={actPromise.label}
          index={actPromise.index}
          name={actPromise.name}
        >
          <LandingHero onPreview={handlePreview} />
          <LandingEmotionalInterludeSection />
          <LandingThresholdSection />
          <LandingEarlyCtaSection onPreview={handlePreview} />
        </LandingAct>

        <LandingAct
          id={actExperience.id}
          label={actExperience.label}
          index={actExperience.index}
          name={actExperience.name}
          transition
        >
          <LandingUserFlowSection />
          <LandingRealMomentSection />
          <LandingMonumentsCarousel />
          <LandingBenefitsSection />
          <LandingTryFreeSection onPreview={handlePreview} />
        </LandingAct>

        <LandingAct
          id={actDecision.id}
          label={actDecision.label}
          index={actDecision.index}
          name={actDecision.name}
          transition
        >
          <LandingRomeTiersSection onBeginTier={handleBeginTier} />
          {/* Deep-link / SEO: pricing section is canonical; keep #rome-journey resolving. */}
          <div id={ROME_JOURNEY_SECTION_ID} className="cw-landing-deeplink-anchor" tabIndex={-1} aria-hidden="true" />
          <LandingWhyChronoWalkSection />
          <LandingTrustProofSection />
          <LandingAfterRomeSection />
          <LandingFaqSectionV2 />
          <div id="letter" className="cw-landing-deeplink-anchor" tabIndex={-1} aria-hidden="true" />
          <LandingFinalCtaSectionV2 onPreview={handlePreview} />
        </LandingAct>
      </main>
      <LandingSiteFooter />
    </div>
  )
}
