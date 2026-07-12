import { useEffect, useState } from 'react'
import { getDebugGeoPlacement, isDebugGeo } from '../config/env.js'
import { DEV_TOOLS_CHANGED, readDevSimulateGps } from '../components/dev/devTools.js'

/** Offset north so debug geo can mimic walking vs arrival. */
export function offsetDebugPosition(target, radiusM = 40, placement = 'arrived') {
  if (!target?.lat || !target?.lng) return null

  if (placement === 'arrived') {
    return { lat: target.lat, lng: target.lng }
  }

  const meters =
    placement === 'approaching' ? Math.max(radiusM * 1.6, 55) : Math.max(radiusM * 3, 120)
  const latOffset = meters / 111_111

  return { lat: target.lat + latOffset, lng: target.lng }
}

export function useJourneyGeoDebugOptions(target, { geofenceRadiusM = 40 } = {}) {
  const debugGeo = isDebugGeo()
  const [devSimulateGps, setDevSimulateGps] = useState(false)

  useEffect(() => {
    const sync = () => setDevSimulateGps(readDevSimulateGps())
    sync()
    window.addEventListener(DEV_TOOLS_CHANGED, sync)
    return () => window.removeEventListener(DEV_TOOLS_CHANGED, sync)
  }, [])

  const placement = debugGeo ? getDebugGeoPlacement() : 'arrived'
  const simulateAtTarget = (debugGeo && placement === 'arrived') || devSimulateGps
  const debugPosition =
    debugGeo && target
      ? offsetDebugPosition(target, geofenceRadiusM, placement)
      : null

  return {
    debugGeo,
    debugMode: debugGeo,
    simulateAtTarget,
    debugPosition,
    placement,
    devSimulateGps,
  }
}
