import { useCallback, useEffect, useMemo, useState } from 'react'
import { env } from '../config/env'
import { fetchWalkingDirections } from '../services/fetchWalkingRoute'
import {
  getAdhocWalkingDirections,
  cacheAdhocWalkingDirections,
  getLegRouteCoordinates,
  getLegWalkingSteps,
  cacheLegDirections,
  cacheLegRoute,
} from '../utils/routeGeometryCache'
import { isSameLocation } from '../utils/walkingDirections'

function geometryFromLegCache(tourId, fromId, toId) {
  const coordinates = getLegRouteCoordinates(tourId, fromId, toId)
  if (!coordinates?.length) return null
  return { type: 'LineString', coordinates }
}

/** Load precomputed tour-leg directions (stop → stop), with session cache + Mapbox fallback. */
export async function loadTourLegDirections(legFallback, accessToken) {
  if (!legFallback?.tourId || !legFallback?.fromId || !legFallback?.toId) return null

  const { tourId, fromId, toId, from, to } = legFallback
  const cachedSteps = getLegWalkingSteps(tourId, fromId, toId)
  const cachedGeometry = geometryFromLegCache(tourId, fromId, toId)

  if (cachedSteps?.length) {
    return {
      steps: cachedSteps,
      geometry: cachedGeometry,
      distanceM: cachedSteps.reduce((sum, step) => sum + (step.distanceM ?? 0), 0),
      durationSec: cachedSteps.reduce((sum, step) => sum + (step.durationSec ?? 0), 0),
      source: 'leg-cache',
    }
  }

  if (!from?.lat || from?.lng == null || !to?.lat || to?.lng == null || !accessToken) {
    return null
  }

  const result = await fetchWalkingDirections(from, to, accessToken)
  if (!result?.steps?.length) return null

  cacheLegDirections(tourId, fromId, toId, result.steps)
  if (result.geometry) {
    cacheLegRoute(tourId, fromId, toId, result.geometry)
  }

  return { ...result, source: 'leg-fetch' }
}

function pickBestDirections(adhocResult, legResult) {
  if (adhocResult?.steps?.length) return adhocResult
  if (legResult?.steps?.length) return legResult
  return null
}

export function useWalkingDirections({
  origin,
  destination,
  enabled = true,
  legFallback = null,
  reloadKey = 0,
}) {
  const [loading, setLoading] = useState(false)
  const [directions, setDirections] = useState(null)
  const [error, setError] = useState(null)
  const [retryNonce, setRetryNonce] = useState(0)

  const routingOrigin = useMemo(() => {
    if (origin?.lat == null || origin?.lng == null) return null
    return { lat: origin.lat, lng: origin.lng }
  }, [origin?.lat, origin?.lng])

  const routingDestination = useMemo(() => {
    if (destination?.lat == null || destination?.lng == null) return null
    return { lat: destination.lat, lng: destination.lng }
  }, [destination?.lat, destination?.lng])

  const retry = useCallback(() => {
    setRetryNonce((value) => value + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!enabled || !routingDestination) {
        setDirections(null)
        setError(null)
        setLoading(false)
        return
      }

      if (!env.mapboxToken) {
        setDirections(null)
        setError('Mapbox token is required for walking directions.')
        setLoading(false)
        return
      }

      const legPromise = legFallback
        ? loadTourLegDirections(legFallback, env.mapboxToken)
        : Promise.resolve(null)

      if (!routingOrigin) {
        setLoading(true)
        setError(null)

        const legResult = await legPromise
        if (cancelled) return

        if (legResult?.steps?.length) {
          setDirections(legResult)
          setError(null)
        } else {
          setDirections(null)
          setError(
            'Enable location access for live directions, or wait a moment while the route loads.',
          )
        }

        setLoading(false)
        return
      }

      if (isSameLocation(routingOrigin, routingDestination)) {
        setDirections(null)
        setError('You are already at this landmark.')
        setLoading(false)
        return
      }

      const cachedAdhoc = getAdhocWalkingDirections(routingOrigin, routingDestination)
      if (cachedAdhoc?.steps?.length) {
        setDirections(cachedAdhoc)
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const adhocPromise = fetchWalkingDirections(
        routingOrigin,
        routingDestination,
        env.mapboxToken,
      )

      const [adhocResult, legResult] = await Promise.all([adhocPromise, legPromise])

      if (cancelled) return

      const best = pickBestDirections(adhocResult, legResult)

      if (!best?.steps?.length) {
        setDirections(null)
        setError('Could not load walking directions. Try again or open Google Maps.')
      } else {
        if (best === adhocResult) {
          cacheAdhocWalkingDirections(routingOrigin, routingDestination, adhocResult)
        }
        setDirections(best)
        setError(null)
      }

      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [
    enabled,
    legFallback,
    reloadKey,
    retryNonce,
    routingDestination,
    routingOrigin,
  ])

  return {
    directions,
    loading,
    error,
    routingOrigin,
    routingDestination,
    retry,
  }
}
