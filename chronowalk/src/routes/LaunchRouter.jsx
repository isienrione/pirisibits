import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from '../pages/LandingPage.jsx'
import LegacyAppPage from '../pages/LegacyAppPage.jsx'
import TourSelectionPage from '../pages/TourSelectionPage.jsx'
import TourDetailPage from '../pages/TourDetailPage.jsx'
import PurchasePage from '../pages/PurchasePage.jsx'
import BeginJourneyPage from '../pages/BeginJourneyPage.jsx'
import ChooseExperiencePage from '../pages/ChooseExperiencePage.jsx'
import LocationPermissionPage from '../pages/LocationPermissionPage.jsx'
import OfflineDownloadPage from '../pages/OfflineDownloadPage.jsx'
import JourneyMapPage from '../pages/JourneyMapPage.jsx'
import WalkingDirectionsPage from '../pages/WalkingDirectionsPage.jsx'
import JourneyArrivalPage from '../pages/JourneyArrivalPage.jsx'
import LandmarkCardPage from '../pages/LandmarkCardPage.jsx'
import StoryAudioPage from '../pages/StoryAudioPage.jsx'
import StoryChaptersPage from '../pages/StoryChaptersPage.jsx'
import StoryTranscriptPage from '../pages/StoryTranscriptPage.jsx'
import ThresholdPage from '../pages/ThresholdPage.jsx'
import { ROUTES } from './paths.js'

export default function LaunchRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.home} element={<LandingPage />} />
        <Route path={ROUTES.legacy} element={<LegacyAppPage />} />
        <Route path={ROUTES.begin} element={<TourSelectionPage />} />
        <Route path={`${ROUTES.begin}/:destinationId/purchase`} element={<PurchasePage />} />
        <Route path={`${ROUTES.begin}/:destinationId/start`} element={<BeginJourneyPage />} />
        <Route path={`${ROUTES.begin}/:destinationId/experience`} element={<ChooseExperiencePage />} />
        <Route path={`${ROUTES.begin}/:destinationId/location`} element={<LocationPermissionPage />} />
        <Route path={`${ROUTES.begin}/:destinationId/download`} element={<OfflineDownloadPage />} />
        <Route path={`${ROUTES.begin}/:destinationId`} element={<TourDetailPage />} />
        <Route path={ROUTES.walkingDirections} element={<WalkingDirectionsPage />} />
        <Route path={ROUTES.arrival} element={<JourneyArrivalPage />} />
        <Route path={ROUTES.landmark} element={<LandmarkCardPage />} />
        <Route path={ROUTES.storyChapters} element={<StoryChaptersPage />} />
        <Route path={ROUTES.storyTranscript} element={<StoryTranscriptPage />} />
        <Route path={ROUTES.threshold} element={<ThresholdPage />} />
        <Route path={ROUTES.story} element={<StoryAudioPage />} />
        <Route path={ROUTES.journey} element={<JourneyMapPage />} />
        <Route path={ROUTES.complete} element={<Navigate to={ROUTES.legacy} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
