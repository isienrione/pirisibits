import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
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
import V2ErrorBoundary from '../components/V2ErrorBoundary.jsx'
import { ShellTabBar } from '../shell'
import { JourneyCompanionProvider } from '../context/JourneyCompanionContext.jsx'
import { ThresholdChromeProvider, useThresholdChrome } from '../context/ThresholdChromeContext'
import { loadRomeManifest } from '../content/manifest.js'
import { captureHostFromUrl } from '../lib/host'
import { initAnalytics } from '../lib/track'
import { readPersistedShellTab, persistShellTab } from '../shell/tabPersistence.js'
import { SHELL_COMPANION_PATHS } from '../shell/config.js'
import { useJourney } from '../hooks/useJourney.js'
import { JOURNEY_STATES } from '../state/journey.js'
import { JourneyThresholdLayer, ThresholdDemoPage } from './pages/ThresholdPage'
import { AccessPage } from './pages/AccessPage'
import { BeginPage } from './pages/BeginPage'
import { LandingPage } from './pages/LandingPage'
import { WelcomePage } from './pages/WelcomePage'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { CreditsPage } from './pages/CreditsPage.jsx'
import { JourneyPage, JournalPage, LetterPage, MapPage } from './pages/PlaceholderPages'

function LegacyStopsRedirect() {
  return <Navigate to="/journey?sheet=route" replace />
}

function LegacySettingsRedirect() {
  return <Navigate to="/journey?sheet=settings" replace />
}

function HostLandingRedirect() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const hostCode = new URLSearchParams(location.search).get('h')
    if (!hostCode) return

    captureHostFromUrl(location.search)

    if (location.pathname !== '/journey') {
      navigate('/journey', { replace: true })
    }
  }, [location.pathname, location.search, navigate])

  return null
}

function ShellTabPersistence() {
  const location = useLocation()

  useEffect(() => {
    persistShellTab(location.pathname)
  }, [location.pathname])

  return null
}

function RestoreCompanionTab() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = useJourney()

  useEffect(() => {
    if (state === JOURNEY_STATES.IDLE) return
    if (SHELL_COMPANION_PATHS.includes(location.pathname)) return
    if (location.pathname !== '/begin' && location.pathname !== '/welcome') return

    const target = readPersistedShellTab('/journey')
    if (target !== location.pathname) {
      navigate(target, { replace: true })
    }
  }, [location.pathname, navigate, state])

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
    <JourneyCompanionProvider>
      <V2ErrorBoundary title="Tour unavailable">
        <HostLandingRedirect />
        <ShellTabPersistence />
        <RestoreCompanionTab />
        <Routes>
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/begin" element={<BeginPage />} />
          <Route path="/journey" element={<JourneyPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/stops" element={<LegacyStopsRedirect />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/letter" element={<LetterPage />} />
          <Route path="/settings" element={<LegacySettingsRedirect />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="/access" element={<AccessPage />} />
          <Route path="/threshold-demo" element={<ThresholdDemoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <JourneyThresholdLayer />
        <ShellTabBar />
        <AppChrome />
      </V2ErrorBoundary>
    </JourneyCompanionProvider>
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
