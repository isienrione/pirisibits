import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from '../pages/LandingPage.jsx'
import LegacyAppPage from '../pages/LegacyAppPage.jsx'
import TourSelectionPage from '../pages/TourSelectionPage.jsx'
import TourDetailPage from '../pages/TourDetailPage.jsx'
import PurchasePage from '../pages/PurchasePage.jsx'
import { ROUTES } from './paths.js'

export default function LaunchRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.home} element={<LandingPage />} />
        <Route path={ROUTES.legacy} element={<LegacyAppPage />} />
        <Route path={ROUTES.begin} element={<TourSelectionPage />} />
        <Route path={`${ROUTES.begin}/:destinationId/purchase`} element={<PurchasePage />} />
        <Route path={`${ROUTES.begin}/:destinationId`} element={<TourDetailPage />} />
        <Route path={ROUTES.journey} element={<Navigate to={ROUTES.legacy} replace />} />
        <Route path={ROUTES.complete} element={<Navigate to={ROUTES.legacy} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
