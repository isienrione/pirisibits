import { describe, expect, it } from 'vitest'
import {
  getSimulatedRomePosition,
  SIMULATED_ROME_ORIGIN,
  SIMULATED_ROME_TRACK,
} from '../romeLocationSimulation.js'

describe('romeLocationSimulation', () => {
  it('returns the fixed Colosseum-approach origin by default', () => {
    expect(getSimulatedRomePosition()).toEqual(SIMULATED_ROME_ORIGIN)
  })

  it('walks the short Via dei Fori Imperiali track when requested', () => {
    expect(getSimulatedRomePosition({ track: true, trackIndex: 0 })).toEqual(
      SIMULATED_ROME_TRACK[0],
    )
    expect(getSimulatedRomePosition({ track: true, trackIndex: 99 })).toEqual(
      SIMULATED_ROME_TRACK[SIMULATED_ROME_TRACK.length - 1],
    )
  })
})
