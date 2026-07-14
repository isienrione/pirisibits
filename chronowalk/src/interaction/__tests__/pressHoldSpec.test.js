import { describe, expect, it } from 'vitest'
import {
  HOLD_COMMIT_MS,
  HOLD_HAPTIC_SCHEDULE,
  HOLD_MS,
  HOLD_RELEASE_MS,
  easeHoldProgress,
  easeHoldRelease,
} from '../pressHoldSpec.js'

describe('pressHoldSpec', () => {
  it('keeps commit before full charge', () => {
    expect(HOLD_COMMIT_MS).toBeLessThan(HOLD_MS)
    expect(HOLD_RELEASE_MS).toBeGreaterThan(0)
  })

  it('schedules press, mid, and commit haptics in order', () => {
    const ats = HOLD_HAPTIC_SCHEDULE.map((b) => b.at)
    expect(ats).toEqual([...ats].sort((a, b) => a - b))
    expect(HOLD_HAPTIC_SCHEDULE[0].beat).toBe('press')
    expect(HOLD_HAPTIC_SCHEDULE.at(-1).beat).toBe('commit')
  })

  it('easing curves start at 0 and end at 1', () => {
    expect(easeHoldProgress(0)).toBeCloseTo(0, 3)
    expect(easeHoldProgress(1)).toBeCloseTo(1, 3)
    expect(easeHoldRelease(0)).toBeCloseTo(0, 3)
    expect(easeHoldRelease(1)).toBeCloseTo(1, 3)
  })

  it('progress ease is non-linear', () => {
    const mid = easeHoldProgress(0.5)
    expect(mid).not.toBeCloseTo(0.5, 2)
  })
})
