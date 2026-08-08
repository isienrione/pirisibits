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
import {
  CANONICAL_LEG_MISSING_COPY,
  getCanonicalWalkingLeg,
} from '../navigation/canonicalWalkingLegs.js'
import { getDistance } from '../utils/distance'
import { isSameLocation, pickBestWalkingDirections, scoreWalkingStepQuality } from '../utils/walkingDirections'
import { directionsLog } from '../platform/offlineMaps/nativeMapDiagnostics.js'

/** If GPS is farther than this from the previous stop, prefer stop→stop routing. */
const STALE_GPS_FROM_LEG_M = 350

export const ROUTE_UNAVAILABLE_COPY =
  'Walking route unavailable right now. You can still open the stop.'

function geometryFromLegCache(tourId, fromId, toId) {
  const coordinates = getLegRouteCoordinates(tourId, fromId, toId)
  if (!coordinates?.length) return null
  return { type: 'LineString', coordinates }
}

function seedSessionCacheFromLeg(tourId, fromId, toId, leg) {
  if (!tourId || !fromId || !toId || !leg?.steps?.length) return
  cacheLegDirections(tourId, fromId, toId, leg.steps)
  if (leg.geometry) cacheLegRoute(tourId, fromId, toId, leg.geometry)
}

/**
 * Load stop→stop directions.
 * Priority: session cache → packaged canonical Rome legs → Mapbox (when token present).
 */
export async function loadTourLegDirections(legFallback, accessToken, options = {}) {
  if (!legFallback?.tourId || !legFallback?.fromId || !legFallback?.toId) return null

  const { tourId, fromId, toId, from, to } = legFallback
  const cachedSteps = getLegWalkingSteps(tourId, fromId, toId)
  const cachedGeometry = geometryFromLegCache(tourId, fromId, toId)

  if (cachedSteps?.length && scoreWalkingStepQuality(cachedSteps) >= 6) {
    return {
      steps: cachedSteps,
      geometry: cachedGeometry,
      distanceM: cachedSteps.reduce((sum, step) => sum + (step.distanceM ?? 0), 0),
      durationSec: cachedSteps.reduce((sum, step) => sum + (step.durationSec ?? 0), 0),
      source: 'leg-cache',
    }
  }

  const canonical = getCanonicalWalkingLeg({ tourId, fromId, toId })
  if (canonical?.steps?.length) {
    seedSessionCacheFromLeg(tourId, fromId, toId, canonical)
    directionsLog('canonical leg hit', {
      fromId,
      toId,
      version: canonical.version,
      geometryKind: canonical.geometryKind,
      productDebt: canonical.productDebt,
    })
    return canonical
  }

  if (!from?.lat || from?.lng == null || !to?.lat || to?.lng == null || !accessToken) {
    return null
  }

  const result = await fetchWalkingDirections(from, to, accessToken, {
    destinationName: options.destinationName,
  })
  if (!result?.steps?.length) return null

  cacheLegDirections(tourId, fromId, toId, result.steps)
  if (result.geometry) {
    cacheLegRoute(tourId, fromId, toId, result.geometry)
  }

  return { ...result, source: 'leg-fetch' }
}

function pickBestDirections(adhocResult, legResult) {
  return pickBestWalkingDirections([adhocResult, legResult].filter(Boolean))
}

function missingTokenFallbackError(legFallback) {
  if (legFallback?.fromId && legFallback?.toId) {
    return CANONICAL_LEG_MISSING_COPY
  }
  return ROUTE_UNAVAILABLE_COPY
}

export function useWalkingDirections({
  origin,
  destination,
  enabled = true,
  legFallback = null,
  destinationName = null,
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

      directionsLog('provider', {
        provider: 'mapbox-directions-v5',
        hasToken: Boolean(env.mapboxToken),
        hasOrigin: Boolean(routingOrigin),
        hasDestination: Boolean(routingDestination),
        hasLegFallback: Boolean(legFallback?.fromId && legFallback?.toId),
      })

      // Session-cached tour legs / packaged canonical legs / ad-hoc cache work
      // without a Vite Mapbox token (common when only MBXAccessToken is set).
      if (!env.mapboxToken) {
        setLoading(true)
        setError(null)

        if (legFallback) {
          const cachedLeg = await loadTourLegDirections(legFallback, null, {
            destinationName,
          })
          if (cancelled) return
          if (cachedLeg?.steps?.length) {
            directionsLog('cache/canonical hit without token', {
              source: cachedLeg.source,
            })
            setDirections(cachedLeg)
            setError(null)
            setLoading(false)
            return
          }
        }

        if (routingOrigin && routingDestination) {
          const cachedAdhoc = getAdhocWalkingDirections(
            routingOrigin,
            routingDestination,
          )
          if (cachedAdhoc?.steps?.length) {
            directionsLog('cache hit without token', { source: 'adhoc-cache' })
            setDirections(cachedAdhoc)
            setError(null)
            setLoading(false)
            return
          }
        }

        directionsLog('normalized error code', { code: 'missing_token' })
        setDirections(null)
        setError(missingTokenFallbackError(legFallback))
        setLoading(false)
        return
      }

      const legPromise = legFallback
        ? loadTourLegDirections(legFallback, env.mapboxToken, { destinationName })
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
            'Location is unavailable — open the map for the destination, or enable location for live guidance.',
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

      // When the traveler has jumped ahead (I'm here / resume) but GPS is still
      // near an earlier stop, Mapbox GPS→destination inflates distance badly.
      // Prefer the planned stop→stop leg in that case.
      const legFrom = legFallback?.from
      const gpsFarFromLegStart =
        legFrom?.lat != null &&
        legFrom?.lng != null &&
        getDistance(routingOrigin.lat, routingOrigin.lng, legFrom.lat, legFrom.lng) >
          STALE_GPS_FROM_LEG_M

      if (gpsFarFromLegStart) {
        setLoading(true)
        setError(null)
        const legResult = await legPromise
        if (cancelled) return
        if (legResult?.steps?.length) {
          setDirections(legResult)
          setError(null)
        } else {
          setDirections(null)
          setError(ROUTE_UNAVAILABLE_COPY)
        }
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

      // Online preferred: live Mapbox GPS→destination, with stop→stop leg as backup.
      let adhocResult = null
      try {
        adhocResult = await fetchWalkingDirections(
          routingOrigin,
          routingDestination,
          env.mapboxToken,
          { destinationName },
        )
      } catch (fetchError) {
        directionsLog('adhoc fetch threw', {
          message:
            typeof fetchError?.message === 'string'
              ? fetchError.message.slice(0, 120)
              : 'unknown',
        })
        adhocResult = null
      }

      const legResult = await legPromise

      if (cancelled) return

      const best = pickBestDirections(adhocResult, legResult)

      if (!best?.steps?.length) {
        setDirections(null)
        setError(ROUTE_UNAVAILABLE_COPY)
      } else {
        if (best === adhocResult) {
          cacheAdhocWalkingDirections(routingOrigin, routingDestination, adhocResult)
        }
        directionsLog('route source selected', {
          source: best.source ?? (best === adhocResult ? 'adhoc-fetch' : legResult?.source),
        })
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
    destinationName,
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
