import { Suspense, useEffect, useMemo, useState } from 'react'
import { lazyWithRecovery } from '../../utils/lazyWithRecovery.js'
import {
  buildManifestTour,
  buildMapStopsFromManifest,
  resolveActiveMapLeg,
} from '../../content/mapStops.js'
import { hasCachedRomeMapTiles } from '../../audio/offlinePackage.js'
import { hydrateRomeMapTileCache } from '../../map/offlineMapTiles.js'
import { env, isDebugMap } from '../../config/env.js'
import { useNetworkStatus } from '../../hooks/useNetworkStatus.js'

/** Prefer cached Standard vector tiles when the radio is constrained. */
function useConstrainedNetwork() {
  const [constrained, setConstrained] = useState(false)
  useEffect(() => {
    const conn =
      typeof navigator !== 'undefined'
        ? navigator.connection || navigator.mozConnection || navigator.webkitConnection
        : null
    const update = () => {
      const type = conn?.effectiveType
      setConstrained(
        Boolean(conn?.saveData || type === '2g' || type === 'slow-2g'),
      )
    }
    update()
    conn?.addEventListener?.('change', update)
    return () => conn?.removeEventListener?.('change', update)
  }, [])
  return constrained
}

const TourMap = lazyWithRecovery(() => import('../TourMap.jsx'), 'map')

function InlineMapLoadingFallback() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--obsidian, #0B0B0D)',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--muted-warm, #706C65)',
        fontSize: 13,
      }}
    >
      Map loading…
    </div>
  )
}

/**
 * Minimal Mapbox embed for in-journey screens (transit).
 * Parent must provide a bounded height (flex: 1 or explicit px).
 */
export default function JourneyInlineMap({
  manifest,
  context,
  geo,
  directionsGeometry = null,
  directionsModeActive = false,
}) {
  const { isOffline } = useNetworkStatus()
  const constrainedNetwork = useConstrainedNetwork()
  // Prefer the cached vector style whenever signal is weak OR we already
  // persisted Rome map tiles — satellite tiles are not offline-cached.
  // When fully offline, TourMap skips Mapbox Standard and uses OfflineRouteMap.
  const preferOfflineStyle = isOffline || constrainedNetwork || hasCachedRomeMapTiles()
  const [offlineMapReady, setOfflineMapReady] = useState(!preferOfflineStyle || isOffline)

  useEffect(() => {
    if (!manifest || !env.mapboxToken) {
      setOfflineMapReady(true)
      return undefined
    }
    // Fully offline → OfflineRouteMap; no Cache→blob hydrate needed for Mapbox.
    if (isOffline) {
      setOfflineMapReady(true)
      return undefined
    }
    if (!preferOfflineStyle) {
      setOfflineMapReady(true)
      return undefined
    }
    let cancelled = false
    setOfflineMapReady(false)
    void hydrateRomeMapTileCache(manifest, { token: env.mapboxToken })
      .catch((error) => {
        if (!cancelled) console.warn('[map] tile cache hydrate failed', error)
      })
      .finally(() => {
        if (!cancelled) setOfflineMapReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [manifest, preferOfflineStyle, isOffline])

  const tour = useMemo(
    () => (manifest ? buildManifestTour(manifest, context.path) : null),
    [manifest, context.path]
  )

  const stops = useMemo(
    () =>
      manifest
        ? buildMapStopsFromManifest(manifest, {
            path: context.path,
            sequenceIndex: context.currentSequenceIndex,
            completedWaypointIds: context.completedWaypointIds,
            promotedOptionalIds: context.promotedOptionalIds,
          })
        : [],
    [
      manifest,
      context.path,
      context.currentSequenceIndex,
      context.completedWaypointIds,
      context.promotedOptionalIds,
    ]
  )

  const { activeTargetId, activeLeg, transitLegActive } = useMemo(
    () =>
      manifest
        ? resolveActiveMapLeg(
            manifest,
            context.path,
            context.currentSequenceIndex,
            context.promotedOptionalIds
          )
        : { activeTargetId: null, activeLeg: null, transitLegActive: false },
    [manifest, context.path, context.currentSequenceIndex, context.promotedOptionalIds]
  )

  const activeStop = stops.find((stop) => stop.id === activeTargetId) ?? null

  if (!tour || !stops.length) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--obsidian, #0B0B0D)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--muted-warm, #706C65)',
          fontSize: 13,
        }}
      >
        Map loading…
      </div>
    )
  }

  if (preferOfflineStyle && !offlineMapReady) {
    return <InlineMapLoadingFallback />
  }

  return (
    <Suspense fallback={<InlineMapLoadingFallback />}>
      <TourMap
      tour={tour}
      stops={stops}
      activeTargetId={activeTargetId}
      selectedStopId={activeTargetId}
      activeLeg={activeLeg}
      transitLegActive={transitLegActive}
      geofenceThresholdM={activeStop?.arrivalRadiusM ?? 40}
      userPos={geo.position}
      state={geo.state}
      distance={geo.distance}
      debugMapEnabled={isDebugMap()}
      minimalUI
      walkingCompanionUI
      fillContainer
      isOffline={isOffline}
      preferOfflineStyle={preferOfflineStyle}
      directionsGeometry={directionsGeometry}
      directionsModeActive={directionsModeActive}
      />
    </Suspense>
  )
}
