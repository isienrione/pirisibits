import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import TourCompleteView from '../components/TourCompleteView'
import { loadRomeTourManifest } from '../content/romeTourManifest'
import { useJourney } from '../hooks/useJourney'
import { ROUTES } from '../routes/paths'

export default function CompletePage() {
  const navigate = useNavigate()
  const { context, manifest: journeyManifest } = useJourney()
  const manifest = useMemo(
    () => journeyManifest ?? loadRomeTourManifest(),
    [journeyManifest]
  )

  const visitedCount = context.completedStopIds.length
  const totalStops = manifest.stops.length

  return (
    <TourCompleteView
      tour={{
        title: manifest.title,
        stopIds: manifest.stopOrder,
      }}
      visitedCount={visitedCount || totalStops}
      walkedMeters={null}
      startedAtMs={Date.parse(context.lastUpdatedAt) || Date.now()}
      onViewSummary={() => navigate(ROUTES.legacy)}
      onDismiss={() => navigate(ROUTES.journey)}
    />
  )
}
