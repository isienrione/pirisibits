import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolvePreviewUrl } from '../audio/audioUrl.js'
import RebuildHeader from './rebuild/RebuildHeader.jsx'
import RebuildHero from './rebuild/RebuildHero.jsx'
import RebuildPromise from './rebuild/RebuildPromise.jsx'
import RebuildHearRome from './rebuild/RebuildHearRome.jsx'
import RebuildRomeDay from './rebuild/RebuildRomeDay.jsx'
import RebuildStreetBeat from './rebuild/RebuildStreetBeat.jsx'
import RebuildPantheonPreview from './rebuild/RebuildPantheonPreview.jsx'
import RebuildPricing from './rebuild/RebuildPricing.jsx'
import RebuildWalkTogether from './rebuild/RebuildWalkTogether.jsx'
import RebuildTrust from './rebuild/RebuildTrust.jsx'
import RebuildFaq from './rebuild/RebuildFaq.jsx'
import RebuildFinalCta from './rebuild/RebuildFinalCta.jsx'
import RebuildStickyBar from './rebuild/RebuildStickyBar.jsx'
import { scrollToLandingId } from './rebuild/scrollToId.js'
import './rebuild/rebuild.css'
import './rebuild/rebuild-phone.css'
import LandingSiteFooter from './LandingSiteFooter.jsx'
import CheckoutConsentDialog from '../components/legal/CheckoutConsentDialog.jsx'
import { LANDING_PREVIEW_AUDIO_FILE } from './landingData.js'
import { LANDING_PRODUCT } from './landingProduct.js'
import { REBUILD_HERO_SUPPORT_EXP } from './rebuildCopy.js'
import {
  persistLandingAttribution,
  readLandingModeFromWindow,
} from './landingModes.js'
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
  trackLandingStickyClick,
  trackLandingStickyImpression,
  trackLandingView,
} from './landingAnalytics.js'
import { ANALYTICS_CONSENT, subscribeAnalyticsConsent } from '../lib/track.js'
import { ensureLandingExpHero } from './landingExperiments.js'

/**
 * ChronoWalk landing v4 — product-first experience.
 * Hero phone → Promise (detail) → Hear Rome (hands) → One day map →
 * Street beat → Pantheon (monument) → Pricing → Couple/Family (travellers) →
 * Trust → FAQ → Final (drama).
 * Source modes (organic / geo / qr) change presentation only.
 */
export default function ChronoWalkLanding() {
  const navigate = useNavigate()
  const { cents } = useLandingPrice()
  const [{ src, mode, host }] = useState(() => readLandingModeFromWindow())
  const [pendingTierId, setPendingTierId] = useState(null)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [stickyVisible, setStickyVisible] = useState(false)
  const [stickySuppressed, setStickySuppressed] = useState(false)
  const [consentBlocking, setConsentBlocking] = useState(false)
  const [audioActive, setAudioActive] = useState(false)
  const [geoPreviewFirst, setGeoPreviewFirst] = useState(mode.primaryAction === 'preview')
  // Keep hero experiment assignment for analytics, but use the compact redesign support line.
  const [supportLine] = useState(() => {
    ensureLandingExpHero()
    return REBUILD_HERO_SUPPORT_EXP.a
  })

  const pendingTier = useMemo(
    () => (pendingTierId ? getTierById(pendingTierId) : null),
    [pendingTierId],
  )

  useEffect(() => {
    persistLandingAttribution({ src, hostId: host?.id ?? null })
    trackLandingView({
      landing_mode: mode.id,
      src,
      host_id: host?.id ?? null,
    })
    return subscribeAnalyticsConsent((value) => {
      if (value === ANALYTICS_CONSENT.ACCEPTED) {
        trackLandingView({
          landing_mode: mode.id,
          src,
          host_id: host?.id ?? null,
        })
      }
    })
  }, [host?.id, mode.id, src])

  useEffect(() => {
    const previousTitle = document.title
    document.title = LANDING_DOCUMENT.title
    const meta = document.querySelector('meta[name="description"]')
    const previousDescription = meta?.getAttribute('content') ?? null
    if (meta) meta.setAttribute('content', LANDING_DOCUMENT.description)
    const canonical = document.head.querySelector('link[rel="canonical"]')
    const previousCanonical = canonical?.getAttribute('href') ?? null
    if (canonical) canonical.setAttribute('href', 'https://chronowalk.com/landing')
    return () => {
      document.title = previousTitle
      if (meta && previousDescription != null) meta.setAttribute('content', previousDescription)
      if (canonical && previousCanonical != null) canonical.setAttribute('href', previousCanonical)
    }
  }, [])

  useEffect(() => {
    const cta = document.getElementById('hero-primary-cta')
    if (!cta || typeof IntersectionObserver !== 'function') return undefined
    const io = new IntersectionObserver(
      ([entry]) => {
        setStickyVisible(Boolean(entry) && !entry.isIntersecting)
      },
      { threshold: 0 },
    )
    io.observe(cta)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (typeof IntersectionObserver !== 'function') return undefined
    const nodes = Array.from(document.querySelectorAll('[data-rb-compete-cta="true"]'))
    if (!nodes.length) return undefined
    const visible = new Set()
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.22) {
            visible.add(entry.target)
          } else {
            visible.delete(entry.target)
          }
        }
        setStickySuppressed(visible.size > 0)
      },
      { threshold: [0, 0.22, 0.5] },
    )
    for (const node of nodes) io.observe(node)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (typeof MutationObserver !== 'function') return undefined
    const syncConsent = () => {
      setConsentBlocking(Boolean(document.querySelector('[data-testid="analytics-consent-banner"]')))
    }
    syncConsent()
    const mo = new MutationObserver(syncConsent)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])

  const stickyBlocked = stickySuppressed || audioActive || consentBlocking || Boolean(pendingTierId)

  useEffect(() => {
    if (stickyVisible && !stickyBlocked) {
      trackLandingStickyImpression({ landing_mode: mode.id, src })
    }
  }, [stickyVisible, stickyBlocked, mode.id, src])

  const openPreview = useCallback(
    (section = LANDING_ANALYTICS_SECTIONS.HERO) => {
      trackLandingPreviewCta(section, {
        landing_mode: mode.id,
        src,
        cta_location: section,
        cta_action: 'preview',
      })
      if (mode.id === 'geo') setGeoPreviewFirst(false)
      const url = resolvePreviewUrl(LANDING_PREVIEW_AUDIO_FILE)
      if (url) primePreviewAudioForNavigation(url)
      navigate('/preview')
    },
    [mode.id, navigate, src],
  )

  const handleBeginTier = useCallback(
    (tierId, section = LANDING_ANALYTICS_SECTIONS.PRICING) => {
      trackLandingPricingCta(tierId, {
        landing_mode: mode.id,
        src,
        cta_location: section,
        cta_action: 'purchase',
        sku: tierId,
      })
      rememberPendingPurchaseTier(tierId)
      setPendingTierId(tierId)
    },
    [mode.id, src],
  )

  const handleHeroPrimary = useCallback(() => {
    if (mode.primaryAction === 'preview') {
      openPreview(LANDING_ANALYTICS_SECTIONS.HERO)
      return
    }
    handleBeginTier(LANDING_PRODUCT.eterna.id, LANDING_ANALYTICS_SECTIONS.HERO)
  }, [handleBeginTier, mode.primaryAction, openPreview])

  const handleHeroSecondary = useCallback(() => {
    if (mode.primaryAction === 'preview') {
      scrollToLandingId('pricing')
      return
    }
    openPreview(LANDING_ANALYTICS_SECTIONS.HERO)
  }, [mode.primaryAction, openPreview])

  const handleConsentCancel = useCallback(() => {
    if (checkoutBusy) return
    setPendingTierId(null)
  }, [checkoutBusy])

  const handleConsentConfirm = useCallback(async () => {
    if (!pendingTierId) return
    setCheckoutBusy(true)

    const tierCents = resolveLandingTierCents(pendingTierId, cents)
    trackLandingCheckoutOpen({
      tierId: pendingTierId,
      priceCents: tierCents,
      landing_mode: mode.id,
      src,
      cta_location: 'checkout_dialog',
      sku: pendingTierId,
    })

    const result = await openCheckout({
      tierId: pendingTierId,
      source: 'landing',
    })
    if (!result.ok) {
      const tier = pendingTierId
      setPendingTierId(null)
      setCheckoutBusy(false)
      navigate(`/purchase?tier=${encodeURIComponent(tier)}`)
      return
    }

    setPendingTierId(null)
    setCheckoutBusy(false)
  }, [cents, mode.id, navigate, pendingTierId, src])

  const productSchema = buildLandingProductSchema()
  const sunlightClass = mode.sunlightContrast ? ' cw-rb--sunlight' : ''
  const stickyPad = stickyVisible && !stickyBlocked ? ' cw-rb--sticky-pad' : ''

  return (
    <div id="top" className={`cw-rb${sunlightClass}${stickyPad}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <RebuildHeader />
      <main>
        <RebuildHero
          mode={mode}
          host={host}
          supportLine={supportLine}
          onPrimary={handleHeroPrimary}
          onSecondary={handleHeroSecondary}
          onPlayingChange={setAudioActive}
        />
        <RebuildPromise />
        <RebuildHearRome onPlayingChange={setAudioActive} />
        {mode.showRoutePreview ? <RebuildRomeDay /> : null}
        <RebuildStreetBeat />
        <RebuildPantheonPreview
          onPreview={() => openPreview(LANDING_ANALYTICS_SECTIONS.TRY_FREE)}
        />
        {mode.showPlanningNarrative ? (
          <RebuildPricing onBeginTier={handleBeginTier} />
        ) : (
          <div id="pricing" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
        )}
        {mode.showWalkTogether ? (
          <RebuildWalkTogether onBeginTier={handleBeginTier} />
        ) : (
          <div id="walk-together" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
        )}
        <RebuildTrust />
        <RebuildFaq />
        <RebuildFinalCta
          onPrimary={() =>
            handleBeginTier(LANDING_PRODUCT.eterna.id, LANDING_ANALYTICS_SECTIONS.FINAL_CTA)
          }
          onSecondary={() => openPreview(LANDING_ANALYTICS_SECTIONS.FINAL_CTA)}
        />
        <div id="rome-journey" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
        <div id="letter" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
        <div id="situations" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
        <div id="threshold" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
        <div id="product-proof" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
        {!mode.showRoutePreview ? (
          <>
            <div id="rome-day" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
            <div id="flexible-journey" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
            <div id="route-proof" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
            <div id="adaptive-walk" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
          </>
        ) : null}
      </main>
      <LandingSiteFooter pricingHref="#pricing" landingPrefix="" compact />
      <RebuildStickyBar
        visible={stickyVisible}
        suppressed={stickyBlocked}
        mode={mode}
        previewFirst={geoPreviewFirst}
        onPurchase={() => {
          trackLandingStickyClick({
            landing_mode: mode.id,
            src,
            cta_action: 'purchase',
          })
          handleBeginTier(LANDING_PRODUCT.eterna.id, LANDING_ANALYTICS_SECTIONS.STICKY)
        }}
        onPreview={() => {
          trackLandingStickyClick({
            landing_mode: mode.id,
            src,
            cta_action: 'preview',
          })
          openPreview(LANDING_ANALYTICS_SECTIONS.STICKY)
        }}
      />
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
