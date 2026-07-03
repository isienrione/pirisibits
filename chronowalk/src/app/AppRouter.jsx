import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ConsentBar from '../components/ConsentBar'
import JourneyDevPanel from '../components/dev/JourneyDevPanel'
import { ThresholdChromeProvider, useThresholdChrome } from '../context/ThresholdChromeContext'
import { captureHostFromUrl } from '../lib/host'
import { initAnalytics } from '../lib/track'
import { JourneyThresholdLayer, ThresholdDemoPage } from './pages/ThresholdPage'
import {
  AccessPage,
  BeginPage,
  JourneyPage,
  JournalPage,
  LandingPage,
  LetterPage,
  MapPage,
} from './pages/PlaceholderPages'
import { WelcomePage } from './pages/WelcomePage'

function AppChrome() {
  const { chromeHidden } = useThresholdChrome()

  if (chromeHidden) return null

  return (
    <>
      <ConsentBar />
      <JourneyDevPanel />
    </>
  )
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/begin" element={<BeginPage />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/letter" element={<LetterPage />} />
        <Route path="/access" element={<AccessPage />} />
        <Route path="/threshold-demo" element={<ThresholdDemoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <JourneyThresholdLayer />
      <AppChrome />
    </>
  )
}

function AppRouter() {
  useEffect(() => {
    captureHostFromUrl()
    initAnalytics()
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
