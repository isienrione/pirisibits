import { Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { env } from '../config/env.js'
import NetworkStatusBanner from '../components/NetworkStatusBanner.jsx'
import PwaUpdatePrompt from '../components/PwaUpdatePrompt.jsx'
import V2ErrorBoundary from '../components/V2ErrorBoundary.jsx'
import { ShellTabBar } from '../shell'
import { ThresholdChromeProvider, useThresholdChrome } from '../context/ThresholdChromeContext'
import { captureHostFromUrl } from '../lib/host'
import { initAnalytics, installPageLifecycleDiagnostics } from '../lib/track'
import AnalyticsConsentBanner from '../components/analytics/AnalyticsConsentBanner.jsx'
import { warnPaddleAtStartup } from '../lib/paddle.js'
import FlowEscapeButton from '../redesign/ui/FlowEscapeButton.jsx'
import { SettingsSheetProvider } from '../redesign/context/SettingsSheetContext.jsx'
import { FamilyWalkProvider } from '../redesign/context/FamilyWalkContext.jsx'
import { SharedWalkGuardProvider } from '../redesign/context/SharedWalkGuardContext.jsx'
import { useTourDebugBootstrap } from '../hooks/useTourDebugBootstrap.js'
import { useAccessRevalidation } from '../hooks/useAccessRevalidation.js'
import { useV2Journey } from '../hooks/useV2Journey.js'
import { isImmersiveJourneyState } from '../state/journey.js'
import { lazyWithRecovery } from '../utils/lazyWithRecovery.js'
import {
  clearBootPending,
  clearSkipSwOnce,
} from '../pwa/staleChunkRecovery.js'
import { JourneyThresholdLayer } from './pages/ThresholdPage'
import { NativePublicLandingRoute } from '../lib/nativeAppEntry.jsx'
import { RequireAccess } from '../lib/requireAccess.jsx'
import {
  LazyAccessConfirmedPage,
  LazyAccessPage,
  LazyInvitePage,
  LazyPurchaseFlowPage,
  LazyBeginPage,
  LazyCreditsPage,
  LazyJournalPage,
  LazyJourneyPage,
  LazyLandingPage,
  LazyLetterPage,
  LazyMapPage,
  LazyMemoryDetailPage,
  LazyNoTicketPage,
  LazyColosseumPreviewPage,
  LazyWaypointPreviewPage,
  LazyPreviewPage,
  LazySettingsPage,
  LazySetupPage,
  LazyWalkTogetherPage,
  LazyTourPage,
  LazyHomePage,
  LazyWelcomePage,
  LazyLegalTermsPage,
  LazyLegalPrivacyPage,
  LazyLegalRefundPage,
  LazyContactPage,
  LazyFreePantheonPage,
  LazyAncientRomePage,
  LazyHowItWorksPage,
} from './lazyRoutes.jsx'
import { DocumentSeo } from '../seo/useDocumentSeo.js'
import { I18nProvider } from '../i18n/I18nProvider.jsx'
import { useT } from '../i18n/I18nProvider.jsx'

function Paid({ children }) {
  return <RequireAccess>{children}</RequireAccess>
}

let LazyUxRegressionTester = null

if (import.meta.env.DEV) {
  LazyUxRegressionTester = lazyWithRecovery(
    () => import('../components/dev/UxRegressionTester.jsx'),
    'ux regression tester',
  )
}

// Apex chronowalk.com serves the public marketing homepage directly.
// Purchasers reach setup only via /access and post-purchase routes - not a
// silent gate on `/`. Legacy `/landing` permanently redirects to `/`.
// Native iOS never mounts the landing: `/` redirects at render time to
// `/home` or `/access` from the existing local entitlement session.
function PublicLandingRoute() {
  return (
    <NativePublicLandingRoute>
      <LazyLandingPage />
    </NativePublicLandingRoute>
  )
}

function TourDebugBootstrap() {
  useTourDebugBootstrap()
  return null
}

function AppChrome() {
  const { chromeHidden } = useThresholdChrome()
  const { state } = useV2Journey()

  // Hide app chrome during the threshold press-hold (chromeHidden) and during
  // every immersive journey moment, keeping both systems in agreement.
  if (chromeHidden || isImmersiveJourneyState(state)) return null

  return <NetworkStatusBanner />
}

/** Marketing / legal routes must not run journey hooks that can throw on corrupt progress. */
const JOURNEY_CHROME_PATHS = new Set([
  '/home',
  '/journey',
  '/tour',
  '/map',
  '/begin',
  '/setup',
  '/walk-together',
  '/journal',
  '/letter',
  '/settings',
  '/access/confirmed',
])

function JourneyChrome() {
  const { pathname } = useLocation()
  const onJourneyChrome =
    JOURNEY_CHROME_PATHS.has(pathname) ||
    pathname.startsWith('/journal/') ||
    pathname.startsWith('/preview/')

  if (!onJourneyChrome) return null

  return (
    <>
      <JourneyThresholdLayer />
      <FlowEscapeButton />
    </>
  )
}

function AppRoutes() {
  const t = useT()
  return (
    <V2ErrorBoundary title={t('error.boundary.title')}>
      <Routes>
        <Route path="/" element={<PublicLandingRoute />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/free-pantheon" element={<LazyFreePantheonPage />} />
        <Route path="/ancient-rome" element={<LazyAncientRomePage />} />
        <Route path="/how-it-works" element={<LazyHowItWorksPage />} />
        <Route path="/preview" element={<LazyPreviewPage />} />
        <Route path="/preview/colosseum" element={<LazyColosseumPreviewPage />} />
        <Route path="/preview/waypoint/:waypointId" element={<LazyWaypointPreviewPage />} />
        <Route path="/setup" element={<Paid><LazySetupPage /></Paid>} />
        <Route path="/access/confirmed" element={<Paid><LazyAccessConfirmedPage /></Paid>} />
        <Route path="/purchase" element={<LazyPurchaseFlowPage />} />
        <Route path="/checkout" element={<Navigate to="/purchase" replace />} />
        <Route path="/no-ticket" element={<LazyNoTicketPage />} />
        <Route path="/welcome" element={<LazyWelcomePage />} />
        <Route path="/begin" element={<Paid><LazyBeginPage /></Paid>} />
        <Route path="/home" element={<Paid><LazyHomePage /></Paid>} />
        <Route path="/tour" element={<Paid><LazyTourPage /></Paid>} />
        <Route path="/journey" element={<Paid><LazyJourneyPage /></Paid>} />
        <Route path="/map" element={<Paid><LazyMapPage /></Paid>} />
        <Route path="/stops" element={<Paid><Navigate to="/tour" replace /></Paid>} />
        <Route path="/journal" element={<Paid><LazyJournalPage /></Paid>} />
        <Route path="/journal/:waypointId" element={<Paid><LazyMemoryDetailPage /></Paid>} />
        <Route path="/letter" element={<Paid><LazyLetterPage /></Paid>} />
        <Route path="/settings" element={<Paid><LazySettingsPage /></Paid>} />
        <Route path="/walk-together" element={<Paid><LazyWalkTogetherPage /></Paid>} />
        <Route path="/credits" element={<LazyCreditsPage />} />
        <Route path="/access" element={<LazyAccessPage />} />
        <Route path="/invite" element={<LazyInvitePage />} />
        <Route path="/legal/terms" element={<LazyLegalTermsPage />} />
        <Route path="/legal/privacy" element={<LazyLegalPrivacyPage />} />
        <Route path="/legal/refund" element={<LazyLegalRefundPage />} />
        <Route path="/contact" element={<LazyContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <JourneyChrome />
      <ShellTabBar />
      <PwaUpdatePrompt />
      <TourDebugBootstrap />
      {import.meta.env.DEV && LazyUxRegressionTester ? (
        <Suspense fallback={null}>
          <LazyUxRegressionTester />
        </Suspense>
      ) : null}
      <AppChrome />
    </V2ErrorBoundary>
  )
}

function AccessRevalidationBootstrap() {
  useAccessRevalidation()
  return null
}

function AppRouter() {
  // Product analytics starts immediately (legitimate interest). Marketing cookies
  // remain behind AnalyticsConsentBanner / preferences.
  initAnalytics()

  useEffect(() => {
    captureHostFromUrl()
    initAnalytics()
    warnPaddleAtStartup()
    const cleanupLifecycle = installPageLifecycleDiagnostics()
    // Successful React mount - clear mid-boot sentinel / one-boot SW skip.
    // Do NOT clear cw-chunk-reload here: that guard stops recovery loops when
    // the homepage mounts then throws again (lazyWithRecovery clears it on success).
    clearBootPending()
    clearSkipSwOnce()
    // Drop one-shot cache-bust param from stale-shell recovery navigations.
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.has('cw_bust')) {
        url.searchParams.delete('cw_bust')
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
      }
    } catch {
      // ignore
    }
    return () => {
      cleanupLifecycle?.()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function restoreOfflineAudio() {
      const {
        readRomeOfflineStatus,
        OFFLINE_AUDIO_STATUS,
        isRomeAudioReadyOffline,
        hydrateRomeAudioCache,
      } = await import('../audio/offlinePackage.js')

      const status = readRomeOfflineStatus()
      if (status.status !== OFFLINE_AUDIO_STATUS.COMPLETE) return

      const { loadRomeManifest } = await import('../content/manifest.js')
      const manifest = loadRomeManifest()
      // Critical-only readiness - optional beds/inserts may be soft-skipped and
      // must not block hydrating arrival chimes + stories for offline playback.
      const ready = await isRomeAudioReadyOffline(manifest)
      if (cancelled || !ready) return

      await hydrateRomeAudioCache(manifest)

      // Hydrate whatever map tiles we have - partial caches still beat a black map.
      const { hydrateRomeMapTileCache } = await import('../map/offlineMapTiles.js')
      if (cancelled) return
      await hydrateRomeMapTileCache(manifest, { token: env.mapboxToken })
    }

    void restoreOfflineAudio()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <I18nProvider>
      <ThresholdChromeProvider>
        <BrowserRouter>
          <SettingsSheetProvider>
            <FamilyWalkProvider>
              <SharedWalkGuardProvider>
                <AccessRevalidationBootstrap />
                <DocumentSeo />
                <AppRoutes />
                <AnalyticsConsentBanner />
              </SharedWalkGuardProvider>
            </FamilyWalkProvider>
          </SettingsSheetProvider>
        </BrowserRouter>
      </ThresholdChromeProvider>
    </I18nProvider>
  )
}

export default AppRouter
