import { useCallback, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LOCATION_STATUS, useGeoLocation } from '../hooks/useGeoLocation'
import { useJourneyGeoSync } from '../hooks/useJourneyGeoSync'
import { JOURNEY_STATES } from '../state/journeyState'
import { beginLaunchTour } from '../state/launchJourney'
import { useJourney } from '../hooks/useJourney'
import JourneyExplorerMap from '../components/journey/JourneyExplorerMap'
import JourneyBottomCard from '../components/journey/JourneyBottomCard'
import { metaLabel } from '../components/ui/styles'
import { ROUTES, arrivalPath } from '../routes/paths'

export default function JourneyMapPage() {
  const navigate = useNavigate()
  const { state, context, manifest, currentStop, nextStop, setState, states } = useJourney()

  const target = currentStop?.coords
  const { position, state: geoState, distance, locationStatus } = useGeoLocation({
    target,
    geofenceThresholdM: currentStop?.radiusM ?? 30,
  })

  useJourneyGeoSync({ geoState, distance, enabled: Boolean(currentStop) })

  useEffect(() => {
    if (state === JOURNEY_STATES.IDLE && manifest) {
      beginLaunchTour(manifest)
    }
  }, [manifest, state])

  useEffect(() => {
    if (state === JOURNEY_STATES.ARRIVED) {
      navigate(arrivalPath(), { replace: true })
    }
  }, [navigate, state])

  const handleSimulateArrival = useCallback(() => {
    setState(states.ARRIVED)
  }, [setState, states.ARRIVED])

  if (!currentStop && state === JOURNEY_STATES.IDLE) {
    return <Navigate to={ROUTES.begin} replace />
  }

  if (state === JOURNEY_STATES.ARRIVED) {
    return null
  }

  const userPos =
    locationStatus === LOCATION_STATUS.GRANTED && position?.lat != null
      ? { lat: position.lat, lng: position.lng }
      : null

  const completedCount = context.completedStopIds.length
  const totalStops = manifest?.stops.length ?? 0

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-ivory text-deep-slate paper-texture">
      <header className="px-6 pt-safe sm:px-8">
        <p className={metaLabel + ' text-bronze'}>Rome</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
            Journey map
          </h1>
          {totalStops ? (
            <p className="text-sm text-soft-slate">
              {completedCount} of {totalStops}
            </p>
          ) : null}
        </div>
      </header>

      <div className="flex flex-1 flex-col px-4 pb-44 pt-6 sm:px-6">
        <JourneyExplorerMap
          className="min-h-0 flex-1"
          manifest={manifest}
          currentStopId={context.currentStopId}
          completedStopIds={context.completedStopIds}
          nextStopId={nextStop?.id ?? null}
          userPos={userPos}
          journeyState={state}
        />
      </div>

      <JourneyBottomCard onSimulateArrival={handleSimulateArrival} />
    </div>
  )
}
