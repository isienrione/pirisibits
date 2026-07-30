import { useEffect, useState } from 'react'
import {
  getDebugGeoPlacement,
  isDebugGeo,
  isSimulateRome,
  isSimulateRomeTrack,
} from '../config/env.js'
import { DEV_TOOLS_CHANGED, readDevSimulateGps } from '../components/dev/devTools.js'
import {
  getSimulatedRomePosition,
  SIMULATED_ROME_ORIGIN,
} from '../dev/romeLocationSimulation.js'

/** Offset north so debug geo can mimic walking vs arrival. */
export function offsetDebugPosition(target, radiusM = 40, placement = 'arrived') {
  if (placement === 'rome') {
    return { ...SIMULATED_ROME_ORIGIN }
  }

  if (!target?.lat || !target?.lng) return null

  if (placement === 'arrived') {
    return { lat: target.lat, lng: target.lng }
  }

  const meters =
    placement === 'approaching' ? Math.max(radiusM * 1.6, 55) : Math.max(radiusM * 3, 120)
  const latOffset = meters / 111_111

  return { lat: target.lat + latOffset, lng: target.lng }
}

/**
 * When ?simulate=rome-track is active, advance along the short Rome track
 * so routing + off-route QA can be exercised without real GPS.
 */
function useSimulatedRomeTrackPosition(enabled) {
  const [trackIndex, setTrackIndex] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setTrackIndex(0)
      return undefined
    }

    const timer = window.setInterval(() => {
      setTrackIndex((current) => current + 1)
    }, 4000)

    return () => window.clearInterval(timer)
  }, [enabled])

  if (!enabled) return null
  return getSimulatedRomePosition({ track: true, trackIndex })
}

export function useJourneyGeoDebugOptions(target, { geofenceRadiusM = 40 } = {}) {
  const debugGeo = isDebugGeo()
  const simulateRome = isSimulateRome()
  const simulateRomeTrack = isSimulateRomeTrack()
  const trackPosition = useSimulatedRomeTrackPosition(simulateRomeTrack)
  const [devSimulateGps, setDevSimulateGps] = useState(false)

  useEffect(() => {
    const sync = () => setDevSimulateGps(readDevSimulateGps())
    sync()
    window.addEventListener(DEV_TOOLS_CHANGED, sync)
    return () => window.removeEventListener(DEV_TOOLS_CHANGED, sync)
  }, [])

  const placement = debugGeo ? getDebugGeoPlacement() : 'arrived'

  // Rome simulation must never pin GPS to the active stop · that collapses
  // walking routes into "already at this landmark" and blocks Directions QA.
  const simulateAtTarget =
    !simulateRome && ((debugGeo && placement === 'arrived') || devSimulateGps)

  let debugPosition = null
  if (simulateRomeTrack && trackPosition) {
    debugPosition = trackPosition
  } else if (simulateRome) {
    debugPosition = { ...SIMULATED_ROME_ORIGIN }
  } else if (debugGeo && target) {
    debugPosition = offsetDebugPosition(target, geofenceRadiusM, placement)
  }

  return {
    debugGeo,
    debugMode: debugGeo || simulateRome,
    simulateAtTarget,
    debugPosition,
    placement: simulateRome ? 'rome' : placement,
    simulatedRome: simulateRome,
    devSimulateGps,
  }
}
