import { useCallback, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LOCATION_STATUS, useGeoLocation } from '../hooks/useGeoLocation'
import { useWalkingDirections } from '../hooks/useWalkingDirections'
import { useJourney } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journeyState'
import WalkingDirectionsGuide from '../components/journey/WalkingDirectionsGuide'
import { resolveWalkingStepProgress } from '../utils/walkingStepProgress'
import { buildGoogleMapsDirectionsUrl } from '../utils/walkingDirections'
import { ROUTES, arrivalPath } from '../routes/paths'

export default function WalkingDirectionsPage() {
  const navigate = useNavigate()
  const { state, currentStop, nextStop } = useJourney()

  const destination = nextStop ?? currentStop
  const destinationCoords = nextStop?.coords ?? null
  const canGuide = Boolean(
    destinationCoords &&
      [JOURNEY_STATES.WALKING, JOURNEY_STATES.APPROACHING].includes(state)
  )

  const { position, locationStatus } = useGeoLocation({
    target: currentStop?.coords,
    geofenceThresholdM: currentStop?.radiusM ?? 30,
  })

  const userPos = useMemo(() => {
    if (locationStatus !== LOCATION_STATUS.GRANTED || position?.lat == null) return null
    return { lat: position.lat, lng: position.lng }
  }, [locationStatus, position?.lat, position?.lng])

  const { directions, loading, error, routingOrigin, routingDestination } = useWalkingDirections({
    origin: userPos,
    destination: destinationCoords,
    enabled: canGuide,
  })

  const { currentStepIndex } = useMemo(
    () =>
      resolveWalkingStepProgress({
        userPos,
        steps: directions?.steps ?? [],
        geometry: directions?.geometry,
        totalDistanceM: directions?.distanceM ?? 0,
      }),
    [directions, userPos]
  )

  const mapsUrl = buildGoogleMapsDirectionsUrl(routingOrigin, routingDestination)

  const handleDismiss = useCallback(() => {
    navigate(ROUTES.journey, { replace: true })
  }, [navigate])

  const handleOpenExternalMaps = useCallback((url) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  if (!canGuide) {
    return (
      <Navigate
        to={state === JOURNEY_STATES.ARRIVED ? arrivalPath() : ROUTES.journey}
        replace
      />
    )
  }

  return (
    <WalkingDirectionsGuide
      destinationTitle={destination?.shortTitle ?? destination?.title}
      directions={directions}
      loading={loading}
      error={error}
      currentStepIndex={currentStepIndex}
      onDismiss={handleDismiss}
      onOpenExternalMaps={handleOpenExternalMaps}
      mapsUrl={mapsUrl}
    />
  )
}
