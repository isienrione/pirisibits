import { Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { env } from '../config/env.js'
import NetworkStatusBanner from '../components/NetworkStatusBanner.jsx'
import PwaUpdatePrompt from '../components/PwaUpdatePrompt.jsx'
import V2ErrorBoundary from '../components/V2ErrorBoundary.jsx'
import { ShellTabBar } from '../shell'
import { ThresholdChromeProvider, useThresholdChrome } from '../context/ThresholdChromeContext'
import { captureHostFromUrl } from '../lib/host'
import { initAnalytics } from '../lib/track'
import FlowEscapeButton from '../redesign/ui/FlowEscapeButton.jsx'
import { SettingsSheetProvider } from '../redesign/context/SettingsSheetContext.jsx'
import { FamilyWalkProvider } from '../redesign/context/FamilyWalkContext.jsx'
import { useTourDebugBootstrap } from '../hooks/useTourDebugBootstrap.js'
import { useV2Journey } from '../hooks/useV2Journey.js'
import { isImmersiveJourneyState } from '../state/journey.js'
import { lazyWithRecovery } from '../utils/lazyWithRecovery.js'
import { JourneyThresholdLayer } from './pages/ThresholdPage'
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
  LazyTourPage,
  LazyWelcomePage,
  LazyLegalTermsPage,
  LazyLegalPrivacyPage,
  LazyLegalRefundPage,
  LazyContactPage,
} from './lazyRoutes.jsx'

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

// Apex chronowalk.com must open the marketing site. Send `/` to `/landing`
// (same page) so owners with cw_access never get silently redirected to /setup.
function ApexHomeRedirect() {
  return <Navigate to="/landing" replace />
}

function PublicLandingRoute() {
  return <LazyLandingPage />
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

function AppRoutes() {
  return (
    <V2ErrorBoundary title="Tour unavailable">
      <Routes>
        <Route path="/" element={<ApexHomeRedirect />} />
        <Route path="/landing" element={<PublicLandingRoute />} />
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
        <Route path="/tour" element={<Paid><LazyTourPage /></Paid>} />
        <Route path="/journey" element={<Paid><LazyJourneyPage /></Paid>} />
        <Route path="/map" element={<Paid><LazyMapPage /></Paid>} />
        <Route path="/stops" element={<Paid><Navigate to="/tour" replace /></Paid>} />
        <Route path="/journal" element={<Paid><LazyJournalPage /></Paid>} />
        <Route path="/journal/:waypointId" element={<Paid><LazyMemoryDetailPage /></Paid>} />
        <Route path="/letter" element={<Paid><LazyLetterPage /></Paid>} />
        <Route path="/settings" element={<Paid><LazySettingsPage /></Paid>} />
        <Route path="/credits" element={<LazyCreditsPage />} />
        <Route path="/access" element={<LazyAccessPage />} />
        <Route path="/invite" element={<LazyInvitePage />} />
        <Route path="/legal/terms" element={<LazyLegalTermsPage />} />
        <Route path="/legal/privacy" element={<LazyLegalPrivacyPage />} />
        <Route path="/legal/refund" element={<LazyLegalRefundPage />} />
        <Route path="/contact" element={<LazyContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <JourneyThresholdLayer />
      <ShellTabBar />
      <FlowEscapeButton />
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

function AppRouter() {
  useEffect(() => {
    captureHostFromUrl()
    initAnalytics()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function restoreOfflineAudio() {
      const { readRomeOfflineStatus, OFFLINE_AUDIO_STATUS, verifyRomeAudioPackage, hydrateRomeAudioCache } =
        await import('../audio/offlinePackage.js')

      const status = readRomeOfflineStatus()
      if (status.status !== OFFLINE_AUDIO_STATUS.COMPLETE) return

      const { loadRomeManifest } = await import('../content/manifest.js')
      const manifest = loadRomeManifest()
      const verification = await verifyRomeAudioPackage(manifest)
      if (cancelled || !verification.valid) return

      await hydrateRomeAudioCache(manifest)

      const { verifyRomeMapTiles, hydrateRomeMapTileCache } = await import('../map/offlineMapTiles.js')
      const mapVerification = await verifyRomeMapTiles(manifest, { token: env.mapboxToken })
      if (cancelled || (!mapVerification.valid && !mapVerification.skipped)) return

      await hydrateRomeMapTileCache(manifest, { token: env.mapboxToken })
    }

    void restoreOfflineAudio()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <ThresholdChromeProvider>
      <BrowserRouter>
        <SettingsSheetProvider>
          <FamilyWalkProvider>
            <AppRoutes />
          </FamilyWalkProvider>
        </SettingsSheetProvider>
      </BrowserRouter>
    </ThresholdChromeProvider>
  )
}

export default AppRouter
