import { useCallback, useEffect, useMemo, useState } from 'react'
import { AUDIO_MODES, audioOrchestrator } from '../audio/AudioOrchestrator'
import { ARRIVAL_AUDIO_PREFETCH_RADIUS_M } from '../data/colosseum'
import { getDebugStopId, isDebugGeo, shouldResetTour } from '../config/env'
import { useGeoLocation, JOURNEY_STATE } from './useGeoLocation'
import { fetchTourById } from '../services/tourService'
import { getTourLeg, getTourLegs } from '../services/tourRegistry'
import { getWaypointGeo } from '../data/waypointGeo'
import {
  loadTourProgress,
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
export const useTourSession = ({ tour, singleWaypointId, hasInteracted }) => {
  const debugMode = isDebugGeo()
  const [progress, setProgress] = useState(() => buildInitialProgress(tour))
  const [waypointsById, setWaypointsById] = useState({})
  const [loading, setLoading] = useState(false)
  const [debugOverridePosition, setDebugOverridePosition] = useState(null)

  const isSingleStopMode = Boolean(singleWaypointId)

  const targetStopId = useMemo(() => {
    if (isSingleStopMode) return singleWaypointId
    return tour?.stopIds?.[progress.targetStopIndex] ?? null
  }, [isSingleStopMode, singleWaypointId, tour, progress.targetStopIndex])

  const targetGeo = useMemo(
    () => (targetStopId ? getWaypointGeo(targetStopId) : null),
    [targetStopId]
  )

  const activeLeg = useMemo(() => {
    if (isSingleStopMode || !tour || progress.targetStopIndex === 0) return null
    return getTourLeg(tour, progress.targetStopIndex - 1)
  }, [isSingleStopMode, tour, progress.targetStopIndex])

  const nextStopId = useMemo(() => {
    if (isSingleStopMode || !tour) return null
    return tour.stopIds[progress.targetStopIndex + 1] ?? null
  }, [isSingleStopMode, tour, progress.targetStopIndex])

  const debugPosition = debugOverridePosition ?? targetGeo?.debugPosition ?? null

  const { position, state, distance, locationStatus, retryLocation } = useGeoLocation({
    target: targetGeo?.landmark,
    debugPosition,
    geofenceThresholdM: targetGeo?.geofenceThresholdM ?? 30,
  })

  const currentWaypoint = targetStopId ? waypointsById[targetStopId] : null
  const nextWaypoint = nextStopId ? waypointsById[nextStopId] : null

  const hasArrivedAtTarget =
    Boolean(targetStopId) && progress.arrivedStopIds.includes(targetStopId)

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

    return tour.stopIds
      .map((stopId, index) => {
        const geo = getWaypointGeo(stopId)
        if (!geo) return null

        let status = 'upcoming'
        if (progress.arrivedStopIds.includes(stopId)) status = 'completed'
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
  }, [tour, targetGeo, targetStopId, progress.arrivedStopIds, state])

  useEffect(() => {
    if (!hasInteracted) return undefined

    const ids = isSingleStopMode
      ? [singleWaypointId]
      : tour?.stopIds ?? []

    if (!ids.length) return undefined

    let cancelled = false
    setLoading(true)

    Promise.all(ids.map((id) => fetchTourById(id)))
      .then((results) => {
        if (cancelled) return
        const map = {}
        results.forEach((waypoint) => {
          if (waypoint?.id) map[waypoint.id] = waypoint
        })
        setWaypointsById(map)
      })
      .catch((error) => console.error('useTourSession: failed to load waypoints.', error))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [hasInteracted, isSingleStopMode, singleWaypointId, tour])

  useEffect(() => {
    if (!tour?.id || isSingleStopMode) return
    saveTourProgress(tour.id, progress)
  }, [tour?.id, isSingleStopMode, progress])

  const markArrived = useCallback(() => {
    if (!targetStopId) return

    setProgress((current) => ({
      ...current,
      arrivedStopIds: [...new Set([...current.arrivedStopIds, targetStopId])],
      transitLegActive: false,
    }))
  }, [targetStopId])

  const beginTransitToNextStop = useCallback(async () => {
    if (isSingleStopMode || !tour || !nextStopId || !nextWaypoint) return false

    const nextIndex = progress.targetStopIndex + 1
    const nextGeo = getWaypointGeo(nextStopId)

    setProgress((current) => ({
      ...current,
      targetStopIndex: nextIndex,
      transitLegActive: true,
    }))

    if (debugMode && nextGeo?.debugPosition) {
      setDebugOverridePosition(nextGeo.debugPosition)
    }

    await audioOrchestrator.transitionTo(AUDIO_MODES.TRANSIT, {
      transit: nextWaypoint.transit_narrative_url,
      arrival: nextWaypoint.arrival_immersive_url,
      ambient: nextWaypoint.ambient_url,
    })

    return true
  }, [isSingleStopMode, tour, nextStopId, nextWaypoint, progress.targetStopIndex, debugMode])

  const startTourAmbient = useCallback(async () => {
    const firstWaypoint = isSingleStopMode
      ? waypointsById[singleWaypointId]
      : waypointsById[tour?.stopIds?.[0]]

    if (!firstWaypoint) return

    await audioOrchestrator.transitionTo(AUDIO_MODES.AMBIENT, {
      ambient: firstWaypoint.ambient_url,
      transit: firstWaypoint.transit_narrative_url,
      arrival: firstWaypoint.arrival_immersive_url,
    })
  }, [isSingleStopMode, singleWaypointId, tour, waypointsById])

  const isTourComplete = useMemo(() => {
    if (isSingleStopMode || !tour?.stopIds?.length) return false
    return tour.stopIds.every((id) => progress.arrivedStopIds.includes(id))
  }, [isSingleStopMode, tour?.stopIds, progress.arrivedStopIds])

  const isAwaitingFirstStop = useMemo(() => {
    if (isSingleStopMode || !tour?.stopIds?.length) return false
    return progress.arrivedStopIds.length === 0 && state !== JOURNEY_STATE.ARRIVAL
  }, [isSingleStopMode, tour?.stopIds?.length, progress.arrivedStopIds.length, state])

  const firstStopTitle = useMemo(() => {
    if (!tour?.stopIds?.[0]) return null
    return getWaypointGeo(tour.stopIds[0])?.title ?? null
  }, [tour?.stopIds])

  return {
    loading,
    isSingleStopMode,
    tour,
    progress,
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
