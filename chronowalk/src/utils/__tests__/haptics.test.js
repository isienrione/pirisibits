import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  canUseHaptics,
  HAPTIC_KIND,
  isReducedMotionPreferred,
  resetHapticCooldowns,
  triggerHaptic,
} from '../haptics'

function mockMatchMedia(reducedMotion) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue({
      matches: reducedMotion,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  })
}

describe('haptics', () => {
  beforeEach(() => {
    resetHapticCooldowns()
    vi.restoreAllMocks()
  })

  it('skips haptics when reduced motion is preferred', () => {
    mockMatchMedia(true)

    expect(isReducedMotionPreferred()).toBe(true)
    expect(canUseHaptics()).toBe(false)
    expect(triggerHaptic(HAPTIC_KIND.SUCCESS)).toBe(false)
  })

  it('uses navigator.vibrate when reduced motion is off', () => {
    mockMatchMedia(false)
    const vibrate = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: vibrate,
    })

    expect(triggerHaptic(HAPTIC_KIND.SELECTION)).toBe(true)
    expect(vibrate).toHaveBeenCalledWith([12])
  })

  it('debounces repeated haptics of the same kind', () => {
    mockMatchMedia(false)
    const vibrate = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: vibrate,
    })

    expect(triggerHaptic(HAPTIC_KIND.SOFT_TAP)).toBe(true)
    expect(triggerHaptic(HAPTIC_KIND.SOFT_TAP)).toBe(false)
    expect(vibrate).toHaveBeenCalledTimes(1)
  })
})
