import { useCallback, useEffect, useMemo, useState } from 'react'
import { AUDIO_MODES, audioOrchestrator } from '../audio/AudioOrchestrator'
import { ARRIVAL_AUDIO_PREFETCH_RADIUS_M } from '../data/colosseum'
import { getDebugStopId, isDebugGeo, shouldResetTour } from '../config/env'
import { useGeoLocation, JOURNEY_STATE } from './useGeoLocation'
import { fetchTourWaypoints } from '../offline/offlineWaypointLoader'
import { getTourLeg, getTourLegs } from '../services/tourRegistry'
import { getWaypointGeo } from '../data/waypointGeo'
import {
  loadTourProgress,
  loadTourProgressAsync,
  resetTourProgress,
  saveTourProgress,
} from '../utils/tourProgressStorage'

const buildInitialProgress = (tour) => {
  if (!tour?.id) {
    return { targetStopIndex: 0, arrivedStopIds: [], transitLegActive: false }
  }

  const debugStopId = getDebugStopId()
  if (debugStopId) {
    const stopIndex = tour.stopIds.indexOf(debugStopId)
    if (stopIndex >= 0) {
      if (shouldResetTour()) resetTourProgress(tour.id)
      return {
        targetStopIndex: stopIndex,
        arrivedStopIds: tour.stopIds.slice(0, stopIndex),
        transitLegActive: false,
      }
    }
  }

  if (shouldResetTour()) {
    return resetTourProgress(tour.id)
  }

  return loadTourProgress(tour.id)
}

/**
 * Tour session: ordered stops, legs, geofence target, transit audio, progress persistence.
 */
export const useTourSession = ({
  tour,
  singleWaypointId,
  previewUnlockedStopIds = [],
  hasInteracted,
}) => {
  const debugMode = isDebugGeo()
  const [progress, setProgress] = useState(() => buildInitialProgress(tour))
  const [waypointsById, setWaypointsById] = useState({})
  const [loading, setLoading] = useState(false)
  const [debugOverridePosition, setDebugOverridePosition] = useState(null)

  const isSingleStopMode = Boolean(singleWaypointId)
  const isPreviewMode =
    !isSingleStopMode && Boolean(tour?.stopIds?.length) && previewUnlockedStopIds.length > 0

  const previewTargetStopId = isPreviewMode ? previewUnlockedStopIds[0] : null

  const effectiveProgress = useMemo(() => {
    if (!isPreviewMode || !tour?.stopIds?.length || !previewTargetStopId) return progress

    const previewIndex = tour.stopIds.indexOf(previewTargetStopId)
    return {
      targetStopIndex: previewIndex >= 0 ? previewIndex : 0,
      arrivedStopIds: [],
      transitLegActive: false,
    }
  }, [isPreviewMode, tour?.stopIds, previewTargetStopId, progress])

  const targetStopId = useMemo(() => {
    if (isSingleStopMode) return singleWaypointId
    if (isPreviewMode) return previewTargetStopId
    return tour?.stopIds?.[effectiveProgress.targetStopIndex] ?? null
  }, [
    isSingleStopMode,
    singleWaypointId,
    isPreviewMode,
    previewTargetStopId,
    tour,
    effectiveProgress.targetStopIndex,
  ])

  const targetGeo = useMemo(
    () => (targetStopId ? getWaypointGeo(targetStopId) : null),
    [targetStopId]
  )

  const activeLeg = useMemo(() => {
    if (isSingleStopMode || isPreviewMode || !tour || effectiveProgress.targetStopIndex === 0) {
      return null
    }
    return getTourLeg(tour, effectiveProgress.targetStopIndex - 1)
  }, [isSingleStopMode, isPreviewMode, tour, effectiveProgress.targetStopIndex])

  const nextStopId = useMemo(() => {
    if (isSingleStopMode || isPreviewMode || !tour) return null
    return tour.stopIds[effectiveProgress.targetStopIndex + 1] ?? null
  }, [isSingleStopMode, isPreviewMode, tour, effectiveProgress.targetStopIndex])

  const hasArrivedAtTarget =
    Boolean(targetStopId) && effectiveProgress.arrivedStopIds.includes(targetStopId)

  const debugPosition = useMemo(() => {
    if (debugOverridePosition) return debugOverridePosition
    if (effectiveProgress.transitLegActive) return null
    if (hasArrivedAtTarget && targetGeo?.debugPosition) return targetGeo.debugPosition
    return null
  }, [
    debugOverridePosition,
    effectiveProgress.transitLegActive,
    hasArrivedAtTarget,
    targetGeo?.debugPosition,
  ])

  const simulateAtTarget =
    debugMode &&
    hasArrivedAtTarget &&
    !effectiveProgress.transitLegActive &&
    !debugOverridePosition

  const { position, state, distance, locationStatus, retryLocation } = useGeoLocation({
    target: targetGeo?.landmark,
    debugPosition,
    simulateAtTarget,
    geofenceThresholdM: targetGeo?.geofenceThresholdM ?? 30,
  })

  const currentWaypoint = targetStopId ? waypointsById[targetStopId] : null
  const nextWaypoint = nextStopId ? waypointsById[nextStopId] : null

  const mapStops = useMemo(() => {
    if (!tour) {
      if (!targetGeo) return []
      return [
        {
          id: targetGeo.id,
          title: targetGeo.title,
          landmark: targetGeo.landmark,
          arrivalRadiusM: targetGeo.arrivalRadiusM,
          status: state === JOURNEY_STATE.ARRIVAL ? 'current' : 'upcoming',
        },
      ]
    }

    if (isPreviewMode) {
      const unlocked = new Set(previewUnlockedStopIds)
      return tour.stopIds
        .map((stopId, index) => {
          const geo = getWaypointGeo(stopId)
          if (!geo) return null

          return {
            id: stopId,
            title: geo.title,
            landmark: geo.landmark,
            arrivalRadiusM: geo.arrivalRadiusM,
            index,
            status: unlocked.has(stopId) ? 'current' : 'locked',
          }
        })
        .filter(Boolean)
    }

    return tour.stopIds
      .map((stopId, index) => {
        const geo = getWaypointGeo(stopId)
        if (!geo) return null

        let status = 'upcoming'
        if (effectiveProgress.arrivedStopIds.includes(stopId)) status = 'completed'
        else if (stopId === targetStopId) status = 'current'

        return {
          id: stopId,
          title: geo.title,
          landmark: geo.landmark,
          arrivalRadiusM: geo.arrivalRadiusM,
          index,
          status,
        }
      })
      .filter(Boolean)
  }, [
    tour,
    targetGeo,
    targetStopId,
    effectiveProgress.arrivedStopIds,
    state,
    isPreviewMode,
    previewUnlockedStopIds,
  ])

  useEffect(() => {
    if (!tour?.id || isSingleStopMode || isPreviewMode) return undefined

    let cancelled = false

    loadTourProgressAsync(tour.id).then((storedProgress) => {
      if (cancelled || shouldResetTour() || getDebugStopId()) return
      setProgress(storedProgress)
    })

    return () => {
      cancelled = true
    }
  }, [tour?.id, isSingleStopMode, isPreviewMode])

  useEffect(() => {
    if (!hasInteracted) return undefined

    const ids = isSingleStopMode
      ? [singleWaypointId]
      : isPreviewMode
        ? previewUnlockedStopIds
        : tour?.stopIds ?? []

    if (!ids.length) return undefined

    let cancelled = false
    setLoading(true)

    const loadWaypoints = async () => {
      try {
        const results = isSingleStopMode
          ? await fetchTourWaypoints(null, ids)
          : await fetchTourWaypoints(tour.id, ids)

        if (cancelled) return

        const map = {}
        results.forEach((waypoint) => {
          if (waypoint?.id) map[waypoint.id] = waypoint
        })
        setWaypointsById(map)
      } catch (error) {
        console.error('useTourSession: failed to load waypoints.', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadWaypoints()

    return () => {
      cancelled = true
    }
  }, [hasInteracted, isSingleStopMode, isPreviewMode, previewUnlockedStopIds, singleWaypointId, tour])

  useEffect(() => {
    if (!tour?.id || isSingleStopMode || isPreviewMode) return
    saveTourProgress(tour.id, progress)
  }, [tour?.id, isSingleStopMode, isPreviewMode, progress])

  const markArrived = useCallback(() => {
    if (!targetStopId || isPreviewMode) return

    setProgress((current) => ({
      ...current,
      arrivedStopIds: [...new Set([...current.arrivedStopIds, targetStopId])],
      transitLegActive: false,
    }))

    if (debugMode && targetGeo?.debugPosition) {
      setDebugOverridePosition(targetGeo.debugPosition)
    }
  }, [targetStopId, debugMode, targetGeo?.debugPosition, isPreviewMode])

  const beginTransitToNextStop = useCallback(async () => {
    if (isSingleStopMode || isPreviewMode || !tour || !nextStopId || !nextWaypoint) return false

    const departingStopId = targetStopId
    const departingGeo = getWaypointGeo(departingStopId)
    const nextIndex = effectiveProgress.targetStopIndex + 1

    setProgress((current) => ({
      ...current,
      targetStopIndex: nextIndex,
      transitLegActive: true,
    }))

    if (debugMode) {
      const origin =
        departingGeo?.debugPosition ?? departingGeo?.landmark ?? null
      if (origin?.lat != null && origin?.lng != null) {
        setDebugOverridePosition({ lat: origin.lat, lng: origin.lng })
      }
    }

    await audioOrchestrator.transitionTo(AUDIO_MODES.TRANSIT, {
      transit: nextWaypoint.transit_narrative_url,
      arrival: nextWaypoint.arrival_immersive_url,
      ambient: nextWaypoint.ambient_url,
    })

    return true
  }, [
    isSingleStopMode,
    tour,
    nextStopId,
    nextWaypoint,
    targetStopId,
    effectiveProgress.targetStopIndex,
    debugMode,
    isPreviewMode,
  ])

  const startTourAmbient = useCallback(async () => {
    if (isPreviewMode) return

    const firstWaypoint = isSingleStopMode
      ? waypointsById[singleWaypointId]
      : waypointsById[tour?.stopIds?.[0]]

    if (!firstWaypoint) return

    await audioOrchestrator.transitionTo(AUDIO_MODES.AMBIENT, {
      ambient: firstWaypoint.ambient_url,
      transit: firstWaypoint.transit_narrative_url,
      arrival: firstWaypoint.arrival_immersive_url,
    })
  }, [isPreviewMode, isSingleStopMode, singleWaypointId, tour, waypointsById])

  const isTourComplete = useMemo(() => {
    if (isSingleStopMode || isPreviewMode || !tour?.stopIds?.length) return false
    return tour.stopIds.every((id) => effectiveProgress.arrivedStopIds.includes(id))
  }, [isSingleStopMode, isPreviewMode, tour?.stopIds, effectiveProgress.arrivedStopIds])

  const isAwaitingFirstStop = useMemo(() => {
    if (isSingleStopMode || isPreviewMode || !tour?.stopIds?.length) return false
    return (
      effectiveProgress.arrivedStopIds.length === 0 && state !== JOURNEY_STATE.ARRIVAL
    )
  }, [
    isSingleStopMode,
    isPreviewMode,
    tour?.stopIds?.length,
    effectiveProgress.arrivedStopIds.length,
    state,
  ])

  const firstStopTitle = useMemo(() => {
    if (!tour?.stopIds?.[0]) return null
    return getWaypointGeo(tour.stopIds[0])?.title ?? null
  }, [tour?.stopIds])

  return {
    loading,
    isSingleStopMode,
    isPreviewMode,
    tour,
    progress: effectiveProgress,
    targetStopId,
    targetGeo,
    activeLeg,
    nextStopId,
    nextWaypoint,
    currentWaypoint,
    waypointsById,
    mapStops,
    position,
    state,
    distance,
    locationStatus,
    retryLocation,
    hasArrivedAtTarget,
    markArrived,
    beginTransitToNextStop,
    startTourAmbient,
    prefetchRadiusM: ARRIVAL_AUDIO_PREFETCH_RADIUS_M,
    tourLegs: tour ? getTourLegs(tour) : [],
    isTourComplete,
    isAwaitingFirstStop,
    firstStopTitle,
  }
}
