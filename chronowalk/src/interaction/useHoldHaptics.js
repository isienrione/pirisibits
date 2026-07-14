import { useCallback, useRef } from 'react'
import {
  HOLD_HAPTIC_CANCEL,
  HOLD_HAPTIC_SCHEDULE,
} from './pressHoldSpec.js'
import { HAPTIC_KIND, triggerHaptic } from '../utils/haptics.js'

const KIND_MAP = {
  holdPress: HAPTIC_KIND.HOLD_PRESS,
  holdMid: HAPTIC_KIND.HOLD_MID,
  holdUnlock: HAPTIC_KIND.HOLD_UNLOCK,
  holdCancel: HAPTIC_KIND.HOLD_CANCEL,
}

/**
 * Schedules signature hold haptics from a session clock (heldMs).
 * Call `tick(heldMs)` from the hold rAF / progress path; `cancel(heldMs)` on early release.
 */
export function useHoldHaptics() {
  const firedRef = useRef(new Set())

  const reset = useCallback(() => {
    firedRef.current = new Set()
  }, [])

  const tick = useCallback((heldMs) => {
    for (const beat of HOLD_HAPTIC_SCHEDULE) {
      if (heldMs < beat.at) continue
      if (firedRef.current.has(beat.beat)) continue
      firedRef.current.add(beat.beat)
      triggerHaptic(KIND_MAP[beat.kind] ?? HAPTIC_KIND.HOLD_PRESS)
    }
  }, [])

  const cancel = useCallback((heldMs) => {
    if (heldMs < HOLD_HAPTIC_CANCEL.minHeldMs) return
    if (firedRef.current.has('commit')) return
    triggerHaptic(KIND_MAP[HOLD_HAPTIC_CANCEL.kind] ?? HAPTIC_KIND.HOLD_CANCEL)
  }, [])

  return { reset, tick, cancel }
}
