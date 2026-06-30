import { describe, expect, it } from 'vitest'
import { resolveWalkingStepProgress } from '../walkingStepProgress'

const sampleGeometry = {
  type: 'LineString',
  coordinates: [
    [12.49, 41.89],
    [12.491, 41.891],
    [12.492, 41.892],
    [12.493, 41.893],
  ],
}

const sampleSteps = [
  { instruction: 'Head north', distanceM: 80, type: 'depart' },
  { instruction: 'Turn right', distanceM: 60, type: 'turn' },
  { instruction: 'Arrive', distanceM: 40, type: 'arrive' },
]

describe('resolveWalkingStepProgress', () => {
  it('returns the first step when no user position is available', () => {
    const result = resolveWalkingStepProgress({
      steps: sampleSteps,
      geometry: sampleGeometry,
      totalDistanceM: 180,
    })

    expect(result.currentStepIndex).toBe(0)
    expect(result.routeProgress).toBe(0)
    expect(result.remainingDistanceM).toBe(180)
  })

  it('advances the step index as the user moves along the route', () => {
    const result = resolveWalkingStepProgress({
      userPos: { lat: 41.8925, lng: 12.4925 },
      steps: sampleSteps,
      geometry: sampleGeometry,
      totalDistanceM: 180,
    })

    expect(result.currentStepIndex).toBeGreaterThanOrEqual(1)
    expect(result.routeProgress).toBeGreaterThan(0)
    expect(result.remainingDistanceM).toBeLessThan(180)
  })

  it('clamps route progress between 0 and 1', () => {
    const result = resolveWalkingStepProgress({
      userPos: { lat: 41.893, lng: 12.493 },
      steps: sampleSteps,
      geometry: sampleGeometry,
      totalDistanceM: 180,
    })

    expect(result.routeProgress).toBeGreaterThanOrEqual(0)
    expect(result.routeProgress).toBeLessThanOrEqual(1)
  })
})
