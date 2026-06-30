import { useEffect, useMemo, useState } from 'react'
import { env } from '../config/env'
import { fetchWalkingDirections } from '../services/fetchWalkingRoute'
import {
  getAdhocWalkingDirections,
  cacheAdhocWalkingDirections,
} from '../utils/routeGeometryCache'
import { isSameLocation } from '../utils/walkingDirections'

export function useWalkingDirections({ origin, destination, enabled = true }) {
  const [loading, setLoading] = useState(false)
  const [directions, setDirections] = useState(null)
  const [error, setError] = useState(null)

  const routingOrigin = useMemo(() => {
    if (origin?.lat == null || origin?.lng == null) return null
    return { lat: origin.lat, lng: origin.lng }
  }, [origin?.lat, origin?.lng])

  const routingDestination = useMemo(() => {
    if (destination?.lat == null || destination?.lng == null) return null
    return { lat: destination.lat, lng: destination.lng }
  }, [destination?.lat, destination?.lng])

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

      if (!routingOrigin) {
        setDirections(null)
        setError(
          'Enable location access so ChronoWalk can build directions from where you are standing.'
        )
        setLoading(false)
        return
      }

      if (isSameLocation(routingOrigin, routingDestination)) {
        setDirections(null)
        setError('You are already at this landmark.')
        setLoading(false)
        return
      }

      const cached = getAdhocWalkingDirections(routingOrigin, routingDestination)
      if (cached?.steps?.length) {
        setDirections(cached)
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const result = await fetchWalkingDirections(
        routingOrigin,
        routingDestination,
        env.mapboxToken
      )

      if (cancelled) return

      if (!result?.steps?.length) {
        setDirections(null)
        setError('Could not load walking directions. Try again or open Google Maps.')
      } else {
        cacheAdhocWalkingDirections(routingOrigin, routingDestination, result)
        setDirections(result)
        setError(null)
      }

      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [enabled, routingDestination, routingOrigin])

  return {
    directions,
    loading,
    error,
    routingOrigin,
    routingDestination,
  }
}
