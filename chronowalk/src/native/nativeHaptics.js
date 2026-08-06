/**
 * Thin haptic helpers for native UI — uses existing utils/haptics.js.
 */

import { HAPTIC_KIND, triggerHaptic, isReducedMotionPreferred } from '../utils/haptics.js'

export function nativeTapHaptic() {
  triggerHaptic(HAPTIC_KIND.SOFT_TAP)
}

export function nativeSuccessHaptic() {
  triggerHaptic(HAPTIC_KIND.SUCCESS)
}

export function nativeWarningHaptic() {
  triggerHaptic(HAPTIC_KIND.WARNING)
}

export function nativeSelectionHaptic() {
  triggerHaptic(HAPTIC_KIND.SELECTION)
}

export { isReducedMotionPreferred }
