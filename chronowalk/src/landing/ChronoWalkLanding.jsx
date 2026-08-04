import { useCallback, useEffect, useLayoutEffect, useMemo, useState, Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolvePreviewUrl } from '../audio/audioUrl.js'
import LandingAct from './LandingAct.jsx'
import LandingIntroNav from './v4/LandingIntroNav.jsx'
import LandingProductHero from './v4/LandingProductHero.jsx'
import LandingHeroReassurance from './v4/LandingHeroReassurance.jsx'
import LandingThenNowProof from './v4/LandingThenNowProof.jsx'
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
import { INCLUDE_DEBUG_PANEL } from '../components/debug/includeDebugPanel.js'
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
import {
  centsToPriceEur,
  installLandingPageListeners,
  trackCtaClick,
  trackTierCardClick,
} from '../lib/analytics.ts'
import { ensureLandingExpHero } from './landingExperiments.js'
import {
  resolveLandingIntent,
  resolveLandingIntentHero,
} from './landingIntent.js'
import { hasValidLocalAccess } from '../lib/accessSession.js'
import { getActiveWalkPath } from '../lib/appEntry.js'
import LandingErrorBoundary from './LandingErrorBoundary.jsx'
import './ChronoWalkLanding.css'
import './ChronoWalkLanding.v2.css'
import './ChronoWalkLanding.v4.css'

const DebugPanelHost = INCLUDE_DEBUG_PANEL
  ? lazy(() => import('../components/debug/DebugPanelHost.jsx'))
  : null

/**
 * ChronoWalk Landing V4 - Apple-style product presentation.
 * Sticky phone is the protagonist. Commerce / FAQ / SEO handlers preserved.
 */
export default function ChronoWalkLanding() {
  return (
    <LandingErrorBoundary>
      <ChronoWalkLandingInner />
    </LandingErrorBoundary>
  )
}

function ChronoWalkLandingInner() {
  const navigate = useNavigate()
  const { cents } = useLandingPrice()
  const [pendingTierId, setPendingTierId] = useState(null)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const hasAccess = useMemo(() => hasValidLocalAccess(), [])
  const landingIntent = useMemo(() => resolveLandingIntent(), [])
  const intentHero = useMemo(
    () => resolveLandingIntentHero(landingIntent),
    [landingIntent],
  )
  const pendingTier = useMemo(
    () => (pendingTierId ? getTierById(pendingTierId) : null),
    [pendingTierId],
  )

  useEffect(() => {
    ensureLandingExpHero()
    trackLandingView()
    return installLandingPageListeners()
  }, [])

  /**
   * SPA navigations from acquisition pages keep the previous scroll offset.
   * Without a deep-link hash, always open on the hero. With a hash, scroll to it
   * after mount (React Router does not reliably do this across routes).
   */
  useLayoutEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash) {
      window.scrollTo(0, 0)
      return undefined
    }

    let frame = 0
    let attempts = 0
    const scrollToHash = () => {
      const target = document.getElementById(hash)
      if (target) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' })
        return
      }
      attempts += 1
      if (attempts < 12) frame = window.requestAnimationFrame(scrollToHash)
    }
    frame = window.requestAnimationFrame(scrollToHash)
    return () => window.cancelAnimationFrame(frame)
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

  const handleBeginTier = useCallback(
    (tierId) => {
      const priceEur = centsToPriceEur(resolveLandingTierCents(tierId, cents))
      trackTierCardClick(tierId, priceEur)
      trackCtaClick({ tier: tierId, priceEur, ctaLocation: 'pricing' })
      trackLandingPricingCta(tierId)
      rememberPendingPurchaseTier(tierId)
      setPendingTierId(tierId)
    },
    [cents],
  )

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
    trackCtaClick({ ctaLocation: 'footer' })
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

  /** Hero paid unlock CTA — pricing, not the get-app section. */
  const handleHeroUnlock = useCallback(() => {
    trackCtaClick({ ctaLocation: 'hero' })
    const target = document.getElementById('pricing')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    window.location.hash = 'pricing'
  }, [])

  const handleStickyGetApp = useCallback(() => {
    trackCtaClick({ ctaLocation: 'sticky_bar' })
    handleGetApp()
  }, [handleGetApp])

  const [actOpen, actWalk, actChoose] = LANDING_ACTS
  const productSchema = buildLandingProductSchema()

  return (
    <div className="cw-landing cw-landing--premium cw-landing--v4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <LandingIntroNav onGetApp={handleStickyGetApp} />
      <main>
        <LandingAct
          id={actOpen.id}
          label={actOpen.label}
          index={actOpen.index}
          name={actOpen.name}
        >
          <LandingProductHero
            hero={intentHero}
            onPreview={() => handlePreview(LANDING_ANALYTICS_SECTIONS.HERO)}
            onChooseTour={handleChooseTour}
            onGetApp={handleHeroUnlock}
            onContinueWalk={hasAccess ? handleContinueWalk : undefined}
          />
          <LandingHeroReassurance onPreview={handlePreview} />
          <LandingThenNowProof />
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
      {DebugPanelHost ? (
        <Suspense fallback={null}>
          <DebugPanelHost />
        </Suspense>
      ) : null}
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
