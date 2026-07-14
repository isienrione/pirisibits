import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { env } from '../config/env.js'
import ConsentBar from '../components/ConsentBar'
import NetworkStatusBanner from '../components/NetworkStatusBanner.jsx'
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
import { hasAccess } from '../lib/config.js'
import { isImmersiveJourneyState, isResumableJourney, JOURNEY_STATES } from '../state/journey.js'
import { lazyWithRecovery } from '../utils/lazyWithRecovery.js'

const JourneyThresholdLayer = lazyWithRecovery(
  () =>
    import('./pages/ThresholdPage.jsx').then((m) => ({
      default: m.JourneyThresholdLayer,
    })),
  'threshold',
)

const PwaUpdatePrompt = lazy(() => import('../components/PwaUpdatePrompt.jsx'))
import {
  LazyAccessConfirmedPage,
  LazyAccessPage,
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
  LazyStopsPage,
  LazyTourPage,
  LazyWelcomePage,
} from './lazyRoutes.jsx'

let LazyUxRegressionTester = null

if (import.meta.env.DEV) {
  LazyUxRegressionTester = lazyWithRecovery(
    () => import('../components/dev/UxRegressionTester.jsx'),
    'ux regression tester',
  )
}

function HomeRoute() {
  if (hasAccess()) {
    // Returning travelers mid-journey are offered a resume; owners without a
    // real in-progress journey start setup (install / offline prep).
    return <Navigate to={isResumableJourney() ? '/begin' : '/setup'} replace />
  }
  return <LazyLandingPage />
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

  return (
    <>
      <ConsentBar />
      <NetworkStatusBanner />
    </>
  )
}

function AppRoutes() {
  return (
    <V2ErrorBoundary title="Tour unavailable">
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/landing" element={<PublicLandingRoute />} />
        <Route path="/preview" element={<LazyPreviewPage />} />
        <Route path="/preview/colosseum" element={<LazyColosseumPreviewPage />} />
        <Route path="/preview/waypoint/:waypointId" element={<LazyWaypointPreviewPage />} />
        <Route path="/setup" element={<LazySetupPage />} />
        <Route path="/access/confirmed" element={<LazyAccessConfirmedPage />} />
        <Route path="/purchase" element={<LazyPurchaseFlowPage />} />
        <Route path="/checkout" element={<Navigate to="/purchase" replace />} />
        <Route path="/no-ticket" element={<LazyNoTicketPage />} />
        <Route path="/welcome" element={<LazyWelcomePage />} />
        <Route path="/begin" element={<LazyBeginPage />} />
        <Route path="/tour" element={<LazyTourPage />} />
        <Route path="/journey" element={<LazyJourneyPage />} />
        <Route path="/map" element={<LazyMapPage />} />
        <Route path="/stops" element={<LazyStopsPage />} />
        <Route path="/journal" element={<LazyJournalPage />} />
        <Route path="/journal/:waypointId" element={<LazyMemoryDetailPage />} />
        <Route path="/letter" element={<LazyLetterPage />} />
        <Route path="/settings" element={<LazySettingsPage />} />
        <Route path="/credits" element={<LazyCreditsPage />} />
        <Route path="/access" element={<LazyAccessPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Suspense fallback={null}>
        <JourneyThresholdLayer />
      </Suspense>
      <ShellTabBar />
      <FlowEscapeButton />
      <Suspense fallback={null}>
        <PwaUpdatePrompt />
      </Suspense>
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

function PrefetchThresholdWhenNear() {
  const { state } = useV2Journey()
  useEffect(() => {
    if (
      state === JOURNEY_STATES.ARRIVED ||
      state === JOURNEY_STATES.STORY ||
      state === JOURNEY_STATES.THRESHOLD ||
      state === JOURNEY_STATES.WALKING
    ) {
      void import('./pages/ThresholdPage.jsx')
    }
  }, [state])
  return null
}

function AppRouter() {
  useEffect(() => {
    captureHostFromUrl()
    initAnalytics()
  }, [])

  useEffect(() => {
    let cancelled = false
    let idleId = null
    let timeoutId = null

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

    const schedule = () => {
      void restoreOfflineAudio()
    }

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(schedule, { timeout: 4000 })
    } else {
      timeoutId = window.setTimeout(schedule, 1200)
    }

    return () => {
      cancelled = true
      if (idleId != null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId != null) window.clearTimeout(timeoutId)
    }
  }, [])

  return (
    <ThresholdChromeProvider>
      <BrowserRouter>
        <SettingsSheetProvider>
          <FamilyWalkProvider>
            <PrefetchThresholdWhenNear />
            <AppRoutes />
          </FamilyWalkProvider>
        </SettingsSheetProvider>
      </BrowserRouter>
    </ThresholdChromeProvider>
  )
}

export default AppRouter
