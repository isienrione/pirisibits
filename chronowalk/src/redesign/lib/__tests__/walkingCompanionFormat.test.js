import { describe, expect, it } from 'vitest'
import {
  formatDistanceLine,
  formatPlaybackClock,
  formatRemainingShort,
  resolveWalkChromeDistanceCopy,
} from '../walkingCompanionFormat.js'

describe('walkingCompanionFormat', () => {
  it('formats distance with middle dot separator', () => {
    expect(
      formatDistanceLine({
        primary: '335 m',
        secondary: '4 min walk',
        estimated: false,
        pending: false,
      }),
    ).toBe('335 m · 4 min')
  })

  it('prefers Directions duration for chrome ETA', () => {
    const resolveWalkingDistanceCopy = () => ({
      primary: '335 m',
      secondary: '5 min walk',
      estimated: false,
      pending: false,
    })

    const copy = resolveWalkChromeDistanceCopy({
      liveDistanceM: 400,
      directionsDistanceM: 335,
      directionsDurationSec: 240,
      resolveWalkingDistanceCopy,
    })

    expect(formatDistanceLine(copy)).toBe('335 m · 4 min')
  })

  it('formats remaining time in compact style', () => {
    expect(formatRemainingShort(88)).toBe('−1:28')
    expect(formatPlaybackClock(88)).toBe('1:28')
  })
})
