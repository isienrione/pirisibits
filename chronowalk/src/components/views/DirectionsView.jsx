import { useEffect, useState } from 'react'
import { isDebugGeo } from '../../config/env'
import { env } from '../../config/env'
import { fetchWalkingDirections } from '../../services/fetchWalkingRoute'
import { estimateWalkMinutes } from '../../utils/tourStats'
import {
  buildGoogleMapsDirectionsUrl,
  isSameLocation,
} from '../../utils/walkingDirections'
import { BronzeButton, Button, GlassPanel, LoadingPanel, PageShell, SectionHeader, cn, ctaInCard } from '../ui'

function formatStepDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

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
        <GlassPanel className="mt-6 p-5 text-center">
          <p className="text-sm text-soft-slate">{error}</p>
          {mapsUrl ? (
            <Button className={cn(ctaInCard, 'mt-4')} fullWidth onClick={() => onOpenExternalMaps?.(mapsUrl)}>
              Open in Google Maps
            </Button>
          ) : null}
        </GlassPanel>
      ) : (
        <>
          <GlassPanel className="mt-6 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-bronze">
              {originLabel}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-deep-slate">
                {formatStepDistance(directions.distanceM)}
              </span>
              <span className="text-soft-slate">
                ~{estimateWalkMinutes(directions.distanceM)} min walk
              </span>
            </div>

            <ol className="mt-4 space-y-3">
              {directions.steps.map((step, index) => (
                <li
                  key={`${step.instruction}-${index}`}
                  className="flex gap-3 rounded-2xl border border-parchment/70 bg-ivory/80 px-3 py-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed text-deep-slate">{step.instruction}</p>
                    {step.distanceM > 0 ? (
                      <p className="mt-1 text-xs text-soft-slate">
                        {formatStepDistance(step.distanceM)}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </GlassPanel>

          <div className="mt-4 flex flex-col gap-3 pb-4">
            <BronzeButton fullWidth className={ctaInCard} onClick={onBack}>
              Back to map
            </BronzeButton>
            {mapsUrl ? (
              <Button
                variant="secondary"
                fullWidth
                className={ctaInCard}
                onClick={() => onOpenExternalMaps?.(mapsUrl)}
              >
                Open in Google Maps
              </Button>
            ) : null}
            <p className="text-center text-xs leading-relaxed text-soft-slate">
              Use Google Maps only if these directions fail or you need to leave the app.
            </p>
          </div>
        </>
      )}
    </PageShell>
  )
}

export default DirectionsView
