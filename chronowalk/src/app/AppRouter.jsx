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
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/begin" element={<BeginPage />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/stops" element={<StopsPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/letter" element={<LetterPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/access" element={<AccessPage />} />
        <Route path="/threshold-demo" element={<ThresholdDemoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <JourneyThresholdLayer />
      <ShellTabBar />
      <PwaUpdatePrompt />
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
