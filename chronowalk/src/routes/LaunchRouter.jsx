import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { LoadingPanel } from '../components/ui'
import JourneyDevPanel from '../components/dev/JourneyDevPanel.jsx'
import { registerAppNavigate } from './navigation'
import { ROUTES } from './paths'

const LandingPage = lazy(() => import('../pages/LandingPage.jsx'))
const BeginJourneyPage = lazy(() => import('../pages/BeginJourneyPage.jsx'))
const JourneyMapPage = lazy(() => import('../pages/JourneyMapPage.jsx'))
const CompletePage = lazy(() => import('../pages/CompletePage.jsx'))
const StopsPage = lazy(() => import('../pages/StopsPage.jsx'))
const SettingsPage = lazy(() => import('../pages/SettingsPage.jsx'))
const LegacyAppPage = lazy(() => import('../pages/LegacyAppPage.jsx'))

function NavigationBridge() {
  const navigate = useNavigate()

  useEffect(() => {
    registerAppNavigate(navigate)
    return () => registerAppNavigate(null)
  }, [navigate])

  return null
}

function RouteFallback() {
  return <LoadingPanel label="Loading…" fullScreen className="bg-obsidian text-ivory" />
}

export default function LaunchRouter() {
  return (
    <BrowserRouter>
      <NavigationBridge />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path={ROUTES.landing} element={<LandingPage />} />
          <Route path={ROUTES.begin} element={<BeginJourneyPage />} />
          <Route path={ROUTES.journey} element={<JourneyMapPage />} />
          <Route path={ROUTES.complete} element={<CompletePage />} />
          <Route path={ROUTES.legacy} element={<LegacyAppPage />} />
          <Route path={ROUTES.map} element={<Navigate to={ROUTES.journey} replace />} />
          <Route path={ROUTES.stops} element={<StopsPage />} />
          <Route path={ROUTES.settings} element={<SettingsPage />} />
          <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
        </Routes>
      </Suspense>
      {import.meta.env.DEV ? <JourneyDevPanel /> : null}
    </BrowserRouter>
  )
}
