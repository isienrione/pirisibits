import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolvePreviewUrl } from '../audio/audioUrl.js'
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
import { resolveLandingTierCents } from './landingCheckout.js'
import { openCheckout } from '../lib/checkout.js'
import { rememberPendingPurchaseTier } from '../lib/pendingPurchase.js'
import { primePreviewAudioForNavigation } from './previewAudioHandoff.js'
import { buildLandingProductSchema, LANDING_DOCUMENT } from './landingSeo.js'
import {
  LANDING_ANALYTICS_SECTIONS,
  trackLandingCheckoutOpen,
  trackLandingPricingCta,
  trackLandingPreviewCta,
  trackLandingRoutesCta,
  trackLandingView,
} from './landingAnalytics.js'
import { ensureLandingExpHero } from './landingExperiments.js'
import './ChronoWalkLanding.css'
import './ChronoWalkLanding.v2.css'

/**
 * Premium landing — editorial three-act architecture.
 * Act I Promise → Act II Experience → Act III Decision.
 * Baseline preserved in archive/v3-premium-baseline-2026-07-14/.
 */
export default function ChronoWalkLanding() {
  const navigate = useNavigate()
  const { cents } = useLandingPrice()

  useEffect(() => {
    ensureLandingExpHero()
    trackLandingView()
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

  const handlePreview = useCallback(
    (section = LANDING_ANALYTICS_SECTIONS.HERO) => {
      trackLandingPreviewCta(section)
      const url = resolvePreviewUrl(LANDING_PREVIEW_AUDIO_FILE)
      if (url) primePreviewAudioForNavigation(url)
      navigate('/preview')
    },
    [navigate],
  )

  const handleRoutes = useCallback((section) => {
    trackLandingRoutesCta(section)
  }, [])

  const handleBeginTier = useCallback(
    async (tierId) => {
      trackLandingPricingCta(tierId)
      rememberPendingPurchaseTier(tierId)

      const tierCents = resolveLandingTierCents(tierId, cents)
      trackLandingCheckoutOpen({ tierId, priceCents: tierCents })

      const result = await openCheckout({ tierId, source: 'landing' })
      if (!result.ok) {
        console.warn(
          '[ChronoWalk landing] Checkout unavailable — opening /purchase handoff.',
          tierId,
        )
        navigate(`/purchase?tier=${encodeURIComponent(tierId)}`)
      }
    },
    [cents, navigate],
  )

  const [actPromise, actExperience, actDecision] = LANDING_ACTS
  const productSchema = buildLandingProductSchema()

  return (
    <div className="cw-landing cw-landing--premium cw-landing--editorial">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <LandingSiteHeader onPreview={() => handlePreview(LANDING_ANALYTICS_SECTIONS.HEADER)} />
      <main>
        <LandingAct
          id={actPromise.id}
          label={actPromise.label}
          index={actPromise.index}
          name={actPromise.name}
        >
          <LandingHero
            onPreview={() => handlePreview(LANDING_ANALYTICS_SECTIONS.HERO)}
            onRoutes={() => handleRoutes(LANDING_ANALYTICS_SECTIONS.HERO)}
          />
          <LandingEmotionalInterludeSection />
          <LandingThresholdSection />
          <LandingEarlyCtaSection onPreview={() => handlePreview(LANDING_ANALYTICS_SECTIONS.EARLY_CTA)} />
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
          <LandingTryFreeSection
            onPreview={() => handlePreview(LANDING_ANALYTICS_SECTIONS.TRY_FREE)}
            onRoutes={() => handleRoutes(LANDING_ANALYTICS_SECTIONS.TRY_FREE)}
          />
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
          <LandingAfterRomeSection onRoutes={() => handleRoutes(LANDING_ANALYTICS_SECTIONS.AFTER_ROME)} />
          <LandingFaqSectionV2 />
          <div id="letter" className="cw-landing-deeplink-anchor" tabIndex={-1} aria-hidden="true" />
          <LandingFinalCtaSectionV2
            onPreview={() => handlePreview(LANDING_ANALYTICS_SECTIONS.FINAL_CTA)}
            onRoutes={() => handleRoutes(LANDING_ANALYTICS_SECTIONS.FINAL_CTA)}
          />
        </LandingAct>
      </main>
      <LandingSiteFooter />
    </div>
  )
}
