import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolvePreviewUrl } from '../audio/audioUrl.js'
import LandingAct from './LandingAct.jsx'
import LandingIntroNav from './v4/LandingIntroNav.jsx'
import LandingProductHero from './v4/LandingProductHero.jsx'
import LandingGetAppSection from './v4/LandingGetAppSection.jsx'
import LandingProductDemo from './v4/LandingProductDemo.jsx'
import LandingStopCarousel from './v4/LandingStopCarousel.jsx'
import LandingPersonas from './v4/LandingPersonas.jsx'
import LandingRomeTiersSection from './LandingRomeTiersSection.jsx'
import LandingFaqSectionV2 from './LandingFaqSectionV2.jsx'
import LandingReviewsDevToggle from './v4/LandingReviewsDevToggle.jsx'
import LandingSiteFooter from './LandingSiteFooter.jsx'
import CheckoutConsentDialog from '../components/legal/CheckoutConsentDialog.jsx'
import V2ErrorBoundary from '../components/V2ErrorBoundary.jsx'
import { ROME_JOURNEY_SECTION_ID, LANDING_ACTS, LANDING_PREVIEW_AUDIO_FILE } from './landingData.js'
import { useLandingPrice } from './useLandingPrice.js'
import { resolveLandingTierCents } from './landingCheckout.js'
import { getTierById, openCheckout } from '../lib/checkout.js'
import { rememberPendingPurchaseTier } from '../lib/pendingPurchase.js'
import { primePreviewAudioForNavigation } from './previewAudioHandoff.js'
import { buildLandingProductSchema, LANDING_DOCUMENT } from './landingSeo.js'
import {
  LANDING_ANALYTICS_SECTIONS,
  trackLandingCheckoutOpen,
  trackLandingPricingCta,
  trackLandingPreviewCta,
  trackLandingView,
} from './landingAnalytics.js'
import { ANALYTICS_CONSENT, subscribeAnalyticsConsent } from '../lib/track.js'
import { ensureLandingExpHero } from './landingExperiments.js'
import { hasValidLocalAccess } from '../lib/accessSession.js'
import { getActiveWalkPath } from '../lib/appEntry.js'
import './ChronoWalkLanding.css'
import './ChronoWalkLanding.v2.css'
import './ChronoWalkLanding.v4.css'

/**
 * ChronoWalk Landing V4 - Apple-style product presentation.
 * Sticky phone is the protagonist. Commerce / FAQ / SEO handlers preserved.
 */
export default function ChronoWalkLanding() {
  const navigate = useNavigate()
  const { cents } = useLandingPrice()
  const [pendingTierId, setPendingTierId] = useState(null)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const hasAccess = useMemo(() => hasValidLocalAccess(), [])
  const pendingTier = useMemo(
    () => (pendingTierId ? getTierById(pendingTierId) : null),
    [pendingTierId],
  )

  useEffect(() => {
    ensureLandingExpHero()
    trackLandingView()
    return subscribeAnalyticsConsent((value) => {
      if (value === ANALYTICS_CONSENT.ACCEPTED) {
        trackLandingView()
      }
    })
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

  const handleContinueWalk = useCallback(() => {
    navigate(getActiveWalkPath())
  }, [navigate])

  const handleBeginTier = useCallback((tierId) => {
    trackLandingPricingCta(tierId)
    rememberPendingPurchaseTier(tierId)
    setPendingTierId(tierId)
  }, [])

  const handleConsentCancel = useCallback(() => {
    if (checkoutBusy) return
    setPendingTierId(null)
  }, [checkoutBusy])

  const handleConsentConfirm = useCallback(async () => {
    if (!pendingTierId) return
    setCheckoutBusy(true)

    const tierCents = resolveLandingTierCents(pendingTierId, cents)
    trackLandingCheckoutOpen({ tierId: pendingTierId, priceCents: tierCents })

    const result = await openCheckout({ tierId: pendingTierId, source: 'landing' })
    if (!result.ok) {
      console.warn(
        '[ChronoWalk landing] Checkout unavailable: opening /purchase handoff.',
        pendingTierId,
      )
      const tier = pendingTierId
      setPendingTierId(null)
      setCheckoutBusy(false)
      navigate(`/purchase?tier=${encodeURIComponent(tier)}`)
      return
    }

    setPendingTierId(null)
    setCheckoutBusy(false)
  }, [cents, navigate, pendingTierId])

  const handleChooseTour = useCallback(() => {
    const target = document.getElementById('pricing')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    window.location.hash = 'pricing'
  }, [])

  const handleGetApp = useCallback(() => {
    const target = document.getElementById('get-app')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    window.location.hash = 'get-app'
  }, [])

  const [actOpen, actWalk, actChoose] = LANDING_ACTS
  const productSchema = buildLandingProductSchema()

  return (
    <div className="cw-landing cw-landing--premium cw-landing--v4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <LandingIntroNav onGetApp={handleGetApp} />
      <main>
        <LandingAct
          id={actOpen.id}
          label={actOpen.label}
          index={actOpen.index}
          name={actOpen.name}
        >
          <LandingProductHero
            onPreview={() => handlePreview(LANDING_ANALYTICS_SECTIONS.HERO)}
            onChooseTour={handleChooseTour}
            onGetApp={handleGetApp}
            onContinueWalk={hasAccess ? handleContinueWalk : undefined}
          />
        </LandingAct>

        <LandingAct
          id={actWalk.id}
          label={actWalk.label}
          index={actWalk.index}
          name={actWalk.name}
        >
          <LandingStopCarousel />
          <LandingPersonas
            onPreview={() => handlePreview(LANDING_ANALYTICS_SECTIONS.TRY_FREE)}
          />
          <V2ErrorBoundary
            title="Demo unavailable"
            message="The product demo could not load on this device. The rest of ChronoWalk still works - scroll for tours and pricing."
            autoRecoverOnAnyError={false}
            onRetry={() => window.location.assign('/rome/reset-shell?force=1')}
          >
            <LandingProductDemo />
          </V2ErrorBoundary>
        </LandingAct>

        <LandingAct
          id={actChoose.id}
          label={actChoose.label}
          index={actChoose.index}
          name={actChoose.name}
        >
          <LandingRomeTiersSection onBeginTier={handleBeginTier} />
          {/* Deep-link / SEO: pricing section is canonical; keep #rome-journey resolving. */}
          <div
            id={ROME_JOURNEY_SECTION_ID}
            className="cw-landing-deeplink-anchor"
            tabIndex={-1}
            aria-hidden="true"
          />
          {/* Legacy anchors preserved for existing hashes / SEO. */}
          <div id="threshold" className="cw-landing-deeplink-anchor" tabIndex={-1} aria-hidden="true" />
          <div id="benefits" className="cw-landing-deeplink-anchor" tabIndex={-1} aria-hidden="true" />
          <div id="try-free" className="cw-landing-deeplink-anchor" tabIndex={-1} aria-hidden="true" />
          <div id="compare" className="cw-landing-deeplink-anchor" tabIndex={-1} aria-hidden="true" />
          <div id="letter" className="cw-landing-deeplink-anchor" tabIndex={-1} aria-hidden="true" />
          {/* Get App, then FAQ (questions + trust checklist continuation). */}
          <LandingGetAppSection onChooseTour={handleChooseTour} />
          <LandingFaqSectionV2 />
        </LandingAct>
      </main>
      <LandingSiteFooter />
      <LandingReviewsDevToggle />
      <CheckoutConsentDialog
        open={Boolean(pendingTierId)}
        tierLabel={pendingTier?.name ?? pendingTier?.eyebrow ?? null}
        priceLabel={pendingTier?.price ?? null}
        busy={checkoutBusy}
        onConfirm={handleConsentConfirm}
        onCancel={handleConsentCancel}
      />
    </div>
  )
}
