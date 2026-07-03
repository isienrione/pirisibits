import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ConsentBar from '../components/ConsentBar'
import JourneyDevPanel from '../components/dev/JourneyDevPanel'
import { captureHostFromUrl } from '../lib/host'
import { initAnalytics } from '../lib/track'
import {
  AccessPage,
  BeginPage,
  JourneyPage,
  JournalPage,
  LandingPage,
  LetterPage,
  MapPage,
  WelcomePage,
} from './pages/PlaceholderPages'

function AppRouter() {
  useEffect(() => {
    captureHostFromUrl()
    initAnalytics()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/begin" element={<BeginPage />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/letter" element={<LetterPage />} />
        <Route path="/access" element={<AccessPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ConsentBar />
      <JourneyDevPanel />
    </BrowserRouter>
  )
}

export default AppRouter
