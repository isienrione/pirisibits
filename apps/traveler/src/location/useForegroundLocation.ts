import { useEffect, useRef } from 'react'
import type { LocationSignal } from '@chronowalk/domain'
import { reduceLocationSignal } from './foregroundLocation'
import type { SystemSim } from '../state/types'

type LocationApi = {
  requestForegroundPermissionsAsync(): Promise<{ status: string }>
  watchPositionAsync(
    options: { accuracy: number },
    callback: (result: { coords: { latitude: number; longitude: number; accuracy: number | null } }) => void,
  ): Promise<{ remove(): void }>
  Accuracy: { Balanced: number }
}

export function useForegroundLocation(options: {
  enabled: boolean
  sim: SystemSim
  onSignal: (signal: LocationSignal) => void
  locationApi?: LocationApi | null
}) {
  const { enabled, sim, onSignal, locationApi } = options
  const onSignalRef = useRef(onSignal)
  onSignalRef.current = onSignal

  useEffect(() => {
    if (sim === 'planning' || sim === 'offline') {
      onSignalRef.current(reduceLocationSignal({ permission: 'planning', fix: null, sim }))
      return
    }
    if (sim === 'permission-denied') {
      onSignalRef.current(reduceLocationSignal({ permission: 'denied', fix: null, sim }))
      return
    }
    if (sim === 'gps-weak') {
      onSignalRef.current(
        reduceLocationSignal({
          permission: 'granted',
          fix: { lat: 41.8902, lng: 12.4922, accuracyM: 85 },
          sim,
        }),
      )
      return
    }
    if (!enabled) {
      onSignalRef.current(reduceLocationSignal({ permission: 'planning', fix: null, sim: 'planning' }))
      return
    }
    if (!locationApi) {
      onSignalRef.current({ status: 'error', message: 'Location module unavailable in this build.' })
      return
    }

    let removed = false
    let sub: { remove(): void } | null = null
    onSignalRef.current({ status: 'checking' })
    void (async () => {
      const permission = await locationApi.requestForegroundPermissionsAsync()
      if (removed) return
      if (permission.status !== 'granted') {
        onSignalRef.current({ status: 'denied' })
        return
      }
      onSignalRef.current({ status: 'granted-awaiting-fix' })
      sub = await locationApi.watchPositionAsync({ accuracy: locationApi.Accuracy.Balanced }, (result) => {
        onSignalRef.current(
          reduceLocationSignal({
            permission: 'granted',
            fix: {
              lat: result.coords.latitude,
              lng: result.coords.longitude,
              accuracyM: result.coords.accuracy ?? 999,
            },
            sim: 'off',
          }),
        )
      })
    })()

    return () => {
      removed = true
      sub?.remove()
    }
  }, [enabled, locationApi, sim])
}
