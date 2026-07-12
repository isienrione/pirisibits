import { useEffect, useState } from 'react'
import { isDebugGeo } from '../../config/env'
import { env } from '../../config/env'
import { fetchWalkingDirections } from '../../services/fetchWalkingRoute'
import { estimateWalkMinutes } from '../../utils/tourStats'
import {
  buildGoogleMapsDirectionsUrl,
  isSameLocation,
} from '../../utils/walkingDirections'
import { Button, LoadingPanel, PageShell, SectionHeader, cn, ctaInCard } from '../ui'
import { DirectionsStepList, formatStepDistance } from '../DirectionsStepList'

function DirectionsView({
  destination,
  origin,
  userPosition,
  locationStatus,
  onBack,
  onOpenExternalMaps,
}) {
  const [loading, setLoading] = useState(true)
  const [directions, setDirections] = useState(null)
  const [error, setError] = useState(null)

  const routingOrigin =
    origin?.lat != null && origin?.lng != null ? origin : userPosition
  const originTitle = origin?.title ?? null

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!destination?.lat || !destination?.lng) {
        setError('Destination is not available.')
        setLoading(false)
        return
      }

      if (!env.mapboxToken) {
        setError('Mapbox token is required for walking directions.')
        setLoading(false)
        return
      }

      if (routingOrigin?.lat == null || routingOrigin?.lng == null) {
        setError(
          'Enable location access so ChronoWalk can build directions from where you are standing.'
        )
        setLoading(false)
        return
      }

      if (isSameLocation(routingOrigin, destination)) {
        setError('You are already at this landmark. Head back to the map to explore the stop.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const result = await fetchWalkingDirections(routingOrigin, destination, env.mapboxToken)

      if (cancelled) return

      if (!result?.steps?.length) {
        setError('Could not load walking directions. Try again or open Google Maps.')
        setDirections(null)
      } else {
        setDirections(result)
      }

      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [destination, routingOrigin?.lat, routingOrigin?.lng])

  const title = destination?.title ?? 'Destination'
  const mapsUrl = buildGoogleMapsDirectionsUrl(routingOrigin, destination)
  const originLabel = originTitle
    ? `From ${originTitle}`
    : isDebugGeo()
      ? 'From your simulated position'
      : locationStatus === 'granted'
        ? 'From your current location'
        : 'From your last known location'

  return (
    <PageShell>
      <SectionHeader
        align="left"
        eyebrow="Walking guide"
        title={title}
        subtitle="Follow these steps in ChronoWalk. Keep the app open so your tour stays in sync."
      />

      {loading ? (
        <LoadingPanel label="Loading walking directions…" className="mt-6 min-h-[40vh]" />
      ) : error ? (
        <div className="bg-ink900 rounded-card mt-6 p-5 text-center">
          <p className="text-sm text-muted">{error}</p>
          {mapsUrl ? (
            <Button className={cn(ctaInCard, 'mt-4')} fullWidth onClick={() => onOpenExternalMaps?.(mapsUrl)}>
              Open in Google Maps
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="bg-ink900 rounded-card mt-6 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ember">
              {originLabel}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-ink900">
                {formatStepDistance(directions.distanceM)}
              </span>
              <span className="text-muted">
                ~{estimateWalkMinutes(directions.distanceM)} min walk
              </span>
            </div>

          <DirectionsStepList steps={directions.steps} className="mt-4" />
          </div>

          <div className="mt-4 flex flex-col gap-3 pb-4">
            <Button fullWidth className={ctaInCard} onClick={onBack}>
              Back to map
            </Button>
            {mapsUrl ? (
              <Button
                variant="quiet"
                fullWidth
                className={ctaInCard}
                onClick={() => onOpenExternalMaps?.(mapsUrl)}
              >
                Open in Google Maps
              </Button>
            ) : null}
            <p className="text-center text-xs leading-relaxed text-muted">
              Use Google Maps only if these directions fail or you need to leave the app.
            </p>
          </div>
        </>
      )}
    </PageShell>
  )
}

export default DirectionsView
