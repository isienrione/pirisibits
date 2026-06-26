import { useCallback, useEffect, useState } from 'react'
import { isDebugGeo } from '../../config/env'
import { env } from '../../config/env'
import { fetchWalkingDirections } from '../../services/fetchWalkingRoute'
import { estimateWalkMinutes } from '../../utils/tourStats'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import {
  buildGoogleMapsDirectionsUrl,
  isSameLocation,
} from '../../utils/walkingDirections'
import {
  Button,
  EmptyState,
  GlassPanel,
  PageShell,
  RouteLoadingShimmer,
  SectionHeader,
  cn,
  ctaInCard,
} from '../ui'

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
  onRetryLocation,
}) {
  const online = useOnlineStatus()
  const [loading, setLoading] = useState(true)
  const [directions, setDirections] = useState(null)
  const [errorPreset, setErrorPreset] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const routingOrigin =
    origin?.lat != null && origin?.lng != null ? origin : userPosition
  const originTitle = origin?.title ?? null

  const loadDirections = useCallback(async (cancelledRef) => {
    if (!destination?.lat || !destination?.lng) {
      setErrorPreset('routeUnavailable')
      setLoading(false)
      return
    }

    if (!online) {
      setErrorPreset('noInternet')
      setLoading(false)
      return
    }

    if (!env.mapboxToken) {
      setErrorPreset('routeUnavailable')
      setLoading(false)
      return
    }

    if (routingOrigin?.lat == null || routingOrigin?.lng == null) {
      setErrorPreset('directionsNeedLocation')
      setLoading(false)
      return
    }

    if (isSameLocation(routingOrigin, destination)) {
      setErrorPreset('directionsAtDestination')
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorPreset(null)

    const result = await fetchWalkingDirections(routingOrigin, destination, env.mapboxToken)

    if (cancelledRef.current) return

    if (!result?.steps?.length) {
      setErrorPreset('directionsUnavailable')
      setDirections(null)
    } else {
      setDirections(result)
    }

    setLoading(false)
  }, [destination, online, routingOrigin?.lat, routingOrigin?.lng])

  useEffect(() => {
    const cancelledRef = { current: false }
    void loadDirections(cancelledRef)
    return () => {
      cancelledRef.current = true
    }
  }, [loadDirections, reloadKey])

  const title = destination?.title ?? 'Destination'
  const mapsUrl = buildGoogleMapsDirectionsUrl(routingOrigin, destination)
  const originLabel = originTitle
    ? `From ${originTitle}`
    : isDebugGeo()
      ? 'From your simulated position'
      : locationStatus === 'granted'
        ? 'From your current location'
        : 'From your last known location'

  const handleRetry = () => {
    if (errorPreset === 'directionsNeedLocation') {
      onRetryLocation?.()
      return
    }
    setReloadKey((key) => key + 1)
  }

  const handlePrimaryAction = () => {
    if (errorPreset === 'directionsAtDestination') {
      onBack?.()
      return
    }
    handleRetry()
  }

  return (
    <PageShell>
      <SectionHeader
        align="left"
        eyebrow="Walking guide"
        title={title}
        subtitle="Follow these steps in ChronoWalk. Keep the app open so your tour stays in sync."
      />

      {loading ? (
        <RouteLoadingShimmer className="mt-6 min-h-[40vh]" label="Loading walking directions…" />
      ) : errorPreset ? (
        <EmptyState
          preset={errorPreset}
          onAction={handlePrimaryAction}
          className="mt-6"
          secondaryActionLabel={mapsUrl ? 'Open in Google Maps' : null}
          onSecondaryAction={mapsUrl ? () => onOpenExternalMaps?.(mapsUrl) : undefined}
        />
      ) : (
        <>
          <GlassPanel className="mt-6 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-terracotta">
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
                  className="flex gap-3 rounded-2xl border border-limestone/60 bg-warm-white/80 px-3 py-3"
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
            <Button fullWidth className={ctaInCard} onClick={onBack}>
              Back to map
            </Button>
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
