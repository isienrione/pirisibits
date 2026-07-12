import { describe, expect, it } from 'vitest'
import {
  formatDistanceLine,
  formatPlaybackClock,
  formatRemainingShort,
} from '../walkingCompanionFormat.js'

describe('walkingCompanionFormat', () => {
  it('formats distance with middle dot separator', () => {
    expect(
      formatDistanceLine({
        primary: '350 m',
        secondary: '5 min walk',
        estimated: false,
        pending: false,
      })
    ).toBe('350 m · 5 min')
  })

  it('formats remaining time in compact style', () => {
    expect(formatRemainingShort(88)).toBe('−1:28')
    expect(formatPlaybackClock(88)).toBe('1:28')
  })
})
