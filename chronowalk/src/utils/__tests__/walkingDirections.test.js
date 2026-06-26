import { describe, expect, it } from 'vitest'
import {
  cleanInstruction,
  isSameLocation,
  normalizeWalkingSteps,
} from '../walkingDirections'

describe('walkingDirections', () => {
  it('cleans html from instructions', () => {
    expect(cleanInstruction('Turn <b>left</b> onto Via dei Fori Imperiali')).toBe(
      'Turn left onto Via dei Fori Imperiali'
    )
  })

  it('merges short continue steps', () => {
    const steps = normalizeWalkingSteps([
      { instruction: 'Head north', distanceM: 12, durationSec: 10, type: 'depart' },
      { instruction: 'Continue', distanceM: 8, durationSec: 6, type: 'continue' },
      { instruction: 'Turn right', distanceM: 40, durationSec: 30, type: 'turn' },
      { instruction: 'Arrive', distanceM: 0, durationSec: 0, type: 'arrive' },
    ])

    expect(steps.length).toBeLessThanOrEqual(4)
    expect(steps[0].distanceM).toBe(20)
  })

  it('detects when origin and destination are the same place', () => {
    const point = { lat: 41.89, lng: 12.49 }
    expect(isSameLocation(point, { lat: 41.8901, lng: 12.4901 })).toBe(true)
    expect(isSameLocation(point, { lat: 41.91, lng: 12.49 })).toBe(false)
  })
})
