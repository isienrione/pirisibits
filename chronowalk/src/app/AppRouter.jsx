import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  hydrateRomeAudioCache,
  OFFLINE_AUDIO_STATUS,
  readRomeOfflineStatus,
  verifyRomeAudioPackage,
} from '../audio/offlinePackage.js'
import { hydrateRomeMapTileCache, verifyRomeMapTiles } from '../map/offlineMapTiles.js'
import { env } from '../config/env.js'
import ConsentBar from '../components/ConsentBar'
import JourneyDevPanel from '../components/dev/JourneyDevPanel'
import V2FieldTestPanel from '../components/dev/V2FieldTestPanel.jsx'
import NetworkStatusBanner from '../components/NetworkStatusBanner.jsx'
import PwaUpdatePrompt from '../components/PwaUpdatePrompt.jsx'
import V2ErrorBoundary from '../components/V2ErrorBoundary.jsx'
import { ShellTabBar } from '../shell'
import { ThresholdChromeProvider, useThresholdChrome } from '../context/ThresholdChromeContext'
import { loadRomeManifest } from '../content/manifest.js'
import { captureHostFromUrl } from '../lib/host'
import { initAnalytics } from '../lib/track'
import { JourneyThresholdLayer } from './pages/ThresholdPage'
import { AccessPage } from './pages/AccessPage'
import { BeginPage } from './pages/BeginPage'
import { JourneyPage } from './pages/PlaceholderPages'
import RedesignStopsPage from '../redesign/pages/RedesignStopsPage.jsx'
import RedesignLandingPage from '../redesign/RedesignLandingPage.jsx'
import RedesignJournalPage from '../redesign/pages/RedesignJournalPage.jsx'
import RedesignMapPage from '../redesign/pages/RedesignMapPage.jsx'
import RedesignTourPage from '../redesign/pages/RedesignTourPage.jsx'
import RedesignPreviewPage from '../redesign/pages/RedesignPreviewPage.jsx'
import RedesignWelcomePage from '../redesign/pages/RedesignWelcomePage.jsx'
import RedesignSetupPage from '../redesign/pages/RedesignSetupPage.jsx'
import RedesignAccessConfirmedPage from '../redesign/pages/RedesignAccessConfirmedPage.jsx'
import RedesignSettingsPage from '../redesign/pages/RedesignSettingsPage.jsx'
import RedesignCreditsPage from '../redesign/pages/RedesignCreditsPage.jsx'
import RedesignLetterPage from '../redesign/pages/RedesignLetterPage.jsx'
import RedesignMemoryDetailPage from '../redesign/pages/RedesignMemoryDetailPage.jsx'
import RedesignNoTicketPage from '../redesign/pages/RedesignNoTicketPage.jsx'
import FlowEscapeButton from '../redesign/ui/FlowEscapeButton.jsx'
import { useTourDebugBootstrap } from '../hooks/useTourDebugBootstrap.js'
import { hasAccess } from '../lib/config.js'
import { isResumableJourney } from '../state/journey.js'

function HomeRedirect() {
  if (hasAccess()) {
    // Returning travelers mid-journey are offered a resume; owners without a
    // real in-progress journey begin the cinematic onboarding at /welcome.
    return <Navigate to={isResumableJourney() ? '/begin' : '/welcome'} replace />
  }
  return <Navigate to="/landing" replace />
}

function TourDebugBootstrap() {
  useTourDebugBootstrap()
  return null
}

function AppChrome() {
  const { chromeHidden } = useThresholdChrome()

  if (chromeHidden) return null

  return (
    <>
      <ConsentBar />
      <NetworkStatusBanner />
      <JourneyDevPanel />
    </>
  )
}

function AppRoutes() {
  return (
    <V2ErrorBoundary title="Tour unavailable">
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/landing" element={<RedesignLandingPage />} />
        <Route path="/preview" element={<RedesignPreviewPage />} />
        <Route path="/setup" element={<RedesignSetupPage />} />
        <Route path="/access/confirmed" element={<RedesignAccessConfirmedPage />} />
        <Route path="/no-ticket" element={<RedesignNoTicketPage />} />
        <Route path="/welcome" element={<RedesignWelcomePage />} />
        <Route path="/begin" element={<BeginPage />} />
        <Route path="/tour" element={<RedesignTourPage />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/map" element={<RedesignMapPage />} />
        <Route path="/stops" element={<RedesignStopsPage />} />
        <Route path="/journal" element={<RedesignJournalPage />} />
        <Route path="/journal/:waypointId" element={<RedesignMemoryDetailPage />} />
        <Route path="/letter" element={<RedesignLetterPage />} />
        <Route path="/settings" element={<RedesignSettingsPage />} />
        <Route path="/credits" element={<RedesignCreditsPage />} />
        <Route path="/access" element={<AccessPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <JourneyThresholdLayer />
      <ShellTabBar />
      <FlowEscapeButton />
      <PwaUpdatePrompt />
      <TourDebugBootstrap />
      <V2FieldTestPanel />
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
      const status = readRomeOfflineStatus()
      if (status.status !== OFFLINE_AUDIO_STATUS.COMPLETE) return

      const manifest = loadRomeManifest()
      const verification = await verifyRomeAudioPackage(manifest)
      if (cancelled || !verification.valid) return

      await hydrateRomeAudioCache(manifest)

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
        <AppRoutes />
      </BrowserRouter>
    </ThresholdChromeProvider>
  )
}

export default AppRouter
