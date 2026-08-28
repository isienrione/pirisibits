/** @typedef {'softTap' | 'selection' | 'success' | 'warning' | 'arrivalPulse' | 'arrivalUnlock'} HapticKind */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { isNativeApp } from './nativePlatform'

export const HAPTIC_KIND = {
  SOFT_TAP: 'softTap',
  SELECTION: 'selection',
  SUCCESS: 'success',
  WARNING: 'warning',
  ARRIVAL_PULSE: 'arrivalPulse',
  ARRIVAL_UNLOCK: 'arrivalUnlock',
}

/** Millisecond vibration patterns for browsers without native haptics. */
const VIBRATION_PATTERNS = {
  softTap: [8],
  selection: [12],
  success: [16, 48, 16],
  warning: [28, 72, 28],
  arrivalPulse: [10],
  arrivalUnlock: [12, 36, 16, 52, 20],
}

/** Minimum gap between identical haptics to avoid buzzing. */
const COOLDOWN_MS = {
  softTap: 90,
  selection: 120,
  success: 450,
  warning: 800,
  arrivalPulse: 2500,
  arrivalUnlock: 1200,
}

const lastTriggeredAt = new Map()

export function isReducedMotionPreferred() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function canUseHaptics() {
  if (typeof window === 'undefined') return false
  if (isReducedMotionPreferred()) return false
  return Boolean(isNativeApp() || getCordovaTaptic() || navigator.vibrate)
}

function getCordovaTaptic() {
  return window.TapticEngine ?? window.plugins?.TapticEngine ?? null
}

async function runCapacitorHaptic(kind) {
  if (!isNativeApp()) return false

  try {
    switch (kind) {
      case HAPTIC_KIND.SOFT_TAP:
        await Haptics.impact({ style: ImpactStyle.Light })
        return true
      case HAPTIC_KIND.SELECTION:
        await Haptics.selectionChanged()
        return true
      case HAPTIC_KIND.SUCCESS:
        await Haptics.notification({ type: NotificationType.Success })
        return true
      case HAPTIC_KIND.WARNING:
        await Haptics.notification({ type: NotificationType.Warning })
        return true
      case HAPTIC_KIND.ARRIVAL_PULSE:
        await Haptics.impact({ style: ImpactStyle.Medium })
        return true
      case HAPTIC_KIND.ARRIVAL_UNLOCK:
        await Haptics.notification({ type: NotificationType.Success })
        await Haptics.impact({ style: ImpactStyle.Heavy })
        return true
      default:
        return false
    }
  } catch {
    return false
  }
}

function runCordovaHaptic(kind) {
  const taptic = getCordovaTaptic()
  if (!taptic?.notification) return false

  try {
    if (kind === HAPTIC_KIND.WARNING) {
      taptic.notification({ type: 'warning' })
      return true
    }
    if (kind === HAPTIC_KIND.SUCCESS || kind === HAPTIC_KIND.ARRIVAL_UNLOCK) {
      taptic.notification({ type: 'success' })
      return true
    }
    if (kind === HAPTIC_KIND.SELECTION && taptic.selection) {
      taptic.selection()
      return true
    }
    const style =
      kind === HAPTIC_KIND.SOFT_TAP
        ? 'light'
        : kind === HAPTIC_KIND.ARRIVAL_PULSE
          ? 'medium'
          : 'heavy'
    taptic.impact?.({ style })
    return true
  } catch {
    return false
  }
}

function runVibrationPattern(kind) {
  if (!navigator.vibrate) return false
  const pattern = VIBRATION_PATTERNS[kind]
  if (!pattern) return false

  try {
    return navigator.vibrate(pattern)
  } catch {
    return false
  }
}

/**
 * Fire a tasteful haptic. No-ops when reduced motion is enabled or hardware is unavailable.
 * @param {HapticKind} kind
 */
export function triggerHaptic(kind) {
  if (!canUseHaptics()) return false

  const now = Date.now()
  const cooldown = COOLDOWN_MS[kind] ?? 150
  const lastAt = lastTriggeredAt.get(kind) ?? 0
  if (now - lastAt < cooldown) return false

  lastTriggeredAt.set(kind, now)

  if (isNativeApp() || getCordovaTaptic()) {
    void (async () => {
      const usedNative = (await runCapacitorHaptic(kind)) || runCordovaHaptic(kind)
      if (!usedNative) runVibrationPattern(kind)
    })()
  } else {
    runVibrationPattern(kind)
  }

  return true
}

/** @internal Test helper */
export function resetHapticCooldowns() {
  lastTriggeredAt.clear()
}
