import { useEffect, useRef } from 'react'
import { LOCATION_STATUS } from './useGeoLocation'
import { triggerHaptic, HAPTIC_KIND } from '../utils/haptics'

/** Warning haptics when GPS permission or signal becomes unavailable. */
export function useLocationHaptics(locationStatus) {
  const previousStatusRef = useRef(null)

  useEffect(() => {
    const previous = previousStatusRef.current
    previousStatusRef.current = locationStatus

    if (previous == null) return

    if (
      locationStatus === LOCATION_STATUS.DENIED ||
      locationStatus === LOCATION_STATUS.UNAVAILABLE
    ) {
      if (previous !== locationStatus) {
        triggerHaptic(HAPTIC_KIND.WARNING)
      }
    }
  }, [locationStatus])
}

/** Success haptic when a boolean celebration state becomes true. */
export function useCelebrationHaptic(active) {
  const wasActiveRef = useRef(false)

  useEffect(() => {
    if (active && !wasActiveRef.current) {
      triggerHaptic(HAPTIC_KIND.SUCCESS)
    }
    wasActiveRef.current = active
  }, [active])
}

/** Soft tap when a panel/card becomes open. */
export function useOpenHaptic(open) {
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      triggerHaptic(HAPTIC_KIND.SOFT_TAP)
    }
    wasOpenRef.current = open
  }, [open])
}
