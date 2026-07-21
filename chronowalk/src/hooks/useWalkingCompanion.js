import { useEffect, useRef, useState } from 'react'
import { LOCATION_STATUS } from './useGeoLocation.js'
import { movedEnough, resolveCompanionMode } from '../content/companionGuidance.js'
import { isSimulateRome } from '../config/env.js'

export function useWalkingCompanion({
  position,
  distance,
  geofenceRadiusM = 40,
  locationStatus,
  enabled = true,
  suppressOffRoute = isSimulateRome(),
}) {
  const [stationaryMs, setStationaryMs] = useState(0)
  const anchorRef = useRef({ position: null, since: Date.now() })

  useEffect(() => {
    if (!enabled || locationStatus !== LOCATION_STATUS.GRANTED) {
      setStationaryMs(0)
      anchorRef.current = { position: null, since: Date.now() }
      return undefined
    }

    const lat = position?.lat
    const lng = position?.lng
    if (lat == null || lng == null) return undefined

    const anchor = anchorRef.current
    if (!anchor.position || movedEnough(anchor.position, { lat, lng })) {
      anchorRef.current = { position: { lat, lng }, since: Date.now() }
      setStationaryMs(0)
    }

    const updateStationary = () => {
      setStationaryMs(Date.now() - anchorRef.current.since)
    }

    updateStationary()
    const intervalId = window.setInterval(updateStationary, 5000)
    return () => window.clearInterval(intervalId)
  }, [enabled, locationStatus, position?.lat, position?.lng])

  const mode = resolveCompanionMode({
    distance,
    geofenceRadiusM,
    locationStatus,
    stationaryMs,
    suppressOffRoute,
  })

  return { mode, stationaryMs }
}
