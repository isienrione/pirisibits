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
import { JourneyThresholdLayer, ThresholdDemoPage } from './pages/ThresholdPage'
import { AccessPage } from './pages/AccessPage'
import { BeginPage } from './pages/BeginPage'
import { LandingPage } from './pages/LandingPage'
import { WelcomePage } from './pages/WelcomePage'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { CreditsPage } from './pages/CreditsPage.jsx'
import { JourneyPage, JournalPage, LetterPage, MapPage } from './pages/PlaceholderPages'
import { StopsPage } from './pages/StopsPage.jsx'
import RedesignStopsPage from '../redesign/pages/RedesignStopsPage.jsx'
import FigmaPrototypeApp from '../redesign/FigmaPrototypeApp.jsx'
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
import { useTourDebugBootstrap } from '../hooks/useTourDebugBootstrap.js'

const useFigmaRedesign = import.meta.env.VITE_FIGMA_REDESIGN !== 'false'

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
        <Route path="/" element={<Navigate to={useFigmaRedesign ? '/landing' : '/welcome'} replace />} />
        <Route path="/landing" element={useFigmaRedesign ? <RedesignLandingPage /> : <LandingPage />} />
        <Route path="/prototype" element={<FigmaPrototypeApp />} />
        <Route path="/preview" element={useFigmaRedesign ? <RedesignPreviewPage /> : <Navigate to="/landing" replace />} />
        <Route path="/setup" element={useFigmaRedesign ? <RedesignSetupPage /> : <Navigate to="/begin" replace />} />
        <Route path="/access/confirmed" element={useFigmaRedesign ? <RedesignAccessConfirmedPage /> : <Navigate to="/begin" replace />} />
        <Route path="/no-ticket" element={useFigmaRedesign ? <RedesignNoTicketPage /> : <Navigate to="/journey" replace />} />
        <Route path="/welcome" element={useFigmaRedesign ? <RedesignWelcomePage /> : <WelcomePage />} />
        <Route path="/begin" element={<BeginPage />} />
        <Route path="/tour" element={useFigmaRedesign ? <RedesignTourPage /> : <Navigate to="/journey" replace />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/map" element={useFigmaRedesign ? <RedesignMapPage /> : <MapPage />} />
        <Route path="/stops" element={useFigmaRedesign ? <RedesignStopsPage /> : <StopsPage />} />
        <Route path="/journal" element={useFigmaRedesign ? <RedesignJournalPage /> : <JournalPage />} />
        <Route path="/journal/:waypointId" element={useFigmaRedesign ? <RedesignMemoryDetailPage /> : <Navigate to="/journal" replace />} />
        <Route path="/letter" element={useFigmaRedesign ? <RedesignLetterPage /> : <LetterPage />} />
        <Route path="/settings" element={useFigmaRedesign ? <RedesignSettingsPage /> : <SettingsPage />} />
        <Route path="/credits" element={useFigmaRedesign ? <RedesignCreditsPage /> : <CreditsPage />} />
        <Route path="/access" element={<AccessPage />} />
        <Route path="/threshold-demo" element={<ThresholdDemoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <JourneyThresholdLayer />
      <ShellTabBar />
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
