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
import { shouldUseNativeTransitMap } from '../../platform/offlineMaps/nativeTransitMap.js'
import { nativeMapLog } from '../../platform/offlineMaps/nativeMapDiagnostics.js'
import { getPlatformName } from '../../platform/runtime/platformRuntime.js'
import NativeTransitMapPane from './NativeTransitMapPane.jsx'

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
 * On native iOS, uses Mapbox Maps SDK via the offline-maps plugin (not GL JS).
 */
export default function JourneyInlineMap({
  manifest,
  context,
  geo,
  directionsGeometry = null,
  directionsModeActive = false,
}) {
  const useNative = shouldUseNativeTransitMap()
  useEffect(() => {
    nativeMapLog('shouldUseNativeTransitMap', {
      value: useNative,
      platform: getPlatformName(),
    })
  }, [useNative])
  const { isOffline } = useNetworkStatus()
  const constrainedNetwork = useConstrainedNetwork()
  // Prefer the cached Standard vector style whenever signal is weak OR we
  // already persisted Rome map tiles - satellite tiles are not offline-cached.
  const preferOfflineStyle = isOffline || constrainedNetwork || hasCachedRomeMapTiles()
  const [offlineMapReady, setOfflineMapReady] = useState(!preferOfflineStyle)

  useEffect(() => {
    if (useNative) return undefined
    if (!manifest || !env.mapboxToken) {
      setOfflineMapReady(true)
      return undefined
    }
    // Wait for Cache API → blob hydration before mounting Mapbox, otherwise the
    // first paint races an empty tile map and stays grey offline.
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
  }, [manifest, preferOfflineStyle, useNative])

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

  const legOrigin = useMemo(() => {
    if (!activeLeg?.fromId || !manifest) return null
    const from = stops.find((stop) => stop.id === activeLeg.fromId)
    const lat = from?.landmark?.lat ?? from?.lat
    const lng = from?.landmark?.lng ?? from?.lng
    if (lat == null || lng == null) return null
    return { lat, lng, id: from.id }
  }, [activeLeg, manifest, stops])

  const legDestination = useMemo(() => {
    const lat = activeStop?.landmark?.lat ?? activeStop?.lat
    const lng = activeStop?.landmark?.lng ?? activeStop?.lng
    if (lat == null || lng == null) return null
    return { lat, lng, id: activeStop.id }
  }, [activeStop])

  if (useNative) {
    return (
      <NativeTransitMapPane
        manifest={manifest}
        context={context}
        geo={geo}
        directionsGeometry={directionsGeometry}
        directionsModeActive={directionsModeActive}
        cityId="rome"
        origin={legOrigin}
        destination={legDestination}
        activeStopId={activeTargetId}
        destinationStopId={activeTargetId}
      />
    )
  }

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
