import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolvePreviewUrl } from '../audio/audioUrl.js'
import RebuildHeader from './rebuild/RebuildHeader.jsx'
import RebuildTrustStrip from './rebuild/RebuildTrustStrip.jsx'
import RebuildHero from './rebuild/RebuildHero.jsx'
import RebuildThreshold from './rebuild/RebuildThreshold.jsx'
import RebuildAudioProof from './rebuild/RebuildAudioProof.jsx'
import RebuildSituations from './rebuild/RebuildSituations.jsx'
import RebuildPricing from './rebuild/RebuildPricing.jsx'
import RebuildWalkTogether from './rebuild/RebuildWalkTogether.jsx'
import RebuildAdaptiveWalk from './rebuild/RebuildAdaptiveWalk.jsx'
import RebuildCuratedCertainty from './rebuild/RebuildCuratedCertainty.jsx'
import RebuildRouteProof from './rebuild/RebuildRouteProof.jsx'
import RebuildDifference from './rebuild/RebuildDifference.jsx'
import RebuildFaq from './rebuild/RebuildFaq.jsx'
import RebuildFinalCta from './rebuild/RebuildFinalCta.jsx'
import RebuildStickyBar from './rebuild/RebuildStickyBar.jsx'
import { scrollToLandingId } from './rebuild/scrollToId.js'
import './rebuild/rebuild.css'
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
 * ChronoWalk landing — product-led rebuild.
 * Source modes (organic / geo / qr) change presentation only.
 */
export default function ChronoWalkLanding() {
  const navigate = useNavigate()
  const { cents } = useLandingPrice()
  const [{ src, mode, host }] = useState(() => readLandingModeFromWindow())
  const [pendingTierId, setPendingTierId] = useState(null)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [stickyVisible, setStickyVisible] = useState(false)
  const [audioActive, setAudioActive] = useState(false)
  const [geoPreviewFirst, setGeoPreviewFirst] = useState(mode.primaryAction === 'preview')
  const [supportLine] = useState(() => {
    const exp = ensureLandingExpHero()
    return REBUILD_HERO_SUPPORT_EXP[exp] ?? REBUILD_HERO_SUPPORT_EXP.a
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
    const hero = document.getElementById('hero')
    if (!hero || typeof IntersectionObserver !== 'function') return undefined
    const io = new IntersectionObserver(
      ([entry]) => {
        const pastHero = Boolean(entry) && !entry.isIntersecting && entry.boundingClientRect.top < 0
        setStickyVisible(pastHero)
      },
      { threshold: 0 },
    )
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (stickyVisible) {
      trackLandingStickyImpression({ landing_mode: mode.id, src })
    }
  }, [stickyVisible, mode.id, src])

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

  const handleSituation = useCallback(
    (action) => {
      if (action === 'preview') {
        openPreview(LANDING_ANALYTICS_SECTIONS.SITUATIONS)
        return
      }
      if (action === 'pricing') {
        scrollToLandingId('pricing')
        return
      }
      if (action === 'adaptive') {
        scrollToLandingId('adaptive-walk')
        return
      }
      if (action === 'walk-together') {
        scrollToLandingId('walk-together')
      }
    },
    [openPreview],
  )

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

  return (
    <div id="top" className={`cw-rb${sunlightClass}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <RebuildHeader />
      <RebuildTrustStrip />
      <main>
        <RebuildHero
          mode={mode}
          host={host}
          supportLine={supportLine}
          onPrimary={handleHeroPrimary}
          onSecondary={handleHeroSecondary}
        />
        <RebuildThreshold />
        <RebuildAudioProof
          onPreview={() => openPreview(LANDING_ANALYTICS_SECTIONS.AUDIO)}
          onPlayingChange={setAudioActive}
        />
        {mode.showSituationSelector ? <RebuildSituations onAction={handleSituation} /> : null}
        <RebuildPricing onBeginTier={handleBeginTier} />
        {mode.showWalkTogether ? (
          <RebuildWalkTogether
            onBeginTier={(tierId) =>
              handleBeginTier(tierId, LANDING_ANALYTICS_SECTIONS.WALK_TOGETHER)
            }
          />
        ) : null}
        <RebuildAdaptiveWalk />
        {mode.showCuratedCertainty ? <RebuildCuratedCertainty /> : null}
        {mode.showRoutePreview ? <RebuildRouteProof /> : null}
        {mode.showDifferenceTable ? <RebuildDifference /> : null}
        <RebuildFaq />
        <RebuildFinalCta
          onPrimary={() => handleBeginTier(LANDING_PRODUCT.eterna.id, LANDING_ANALYTICS_SECTIONS.FINAL_CTA)}
          onSecondary={() => openPreview(LANDING_ANALYTICS_SECTIONS.FINAL_CTA)}
        />
        {/* Legacy deep-link anchors */}
        <div id="rome-journey" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
        <div id="try-free" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
        <div id="letter" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      </main>
      <LandingSiteFooter pricingHref="#pricing" landingPrefix="" />
      <RebuildStickyBar
        visible={stickyVisible}
        mode={mode}
        previewFirst={geoPreviewFirst}
        audioActive={audioActive}
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
