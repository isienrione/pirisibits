import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LegacyAppPage from '../pages/LegacyAppPage.jsx'
import { ROUTES } from './paths.js'

export default function LaunchRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.home} element={<Navigate to={ROUTES.legacy} replace />} />
        <Route path={ROUTES.legacy} element={<LegacyAppPage />} />
        <Route path={ROUTES.begin} element={<Navigate to={ROUTES.legacy} replace />} />
        <Route path={ROUTES.journey} element={<Navigate to={ROUTES.legacy} replace />} />
        <Route path={ROUTES.complete} element={<Navigate to={ROUTES.legacy} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
