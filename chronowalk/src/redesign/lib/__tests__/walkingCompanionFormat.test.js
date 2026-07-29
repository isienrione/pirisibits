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

  it('prefers distance-based estimate over raw Mapbox duration', () => {
    const resolveWalkingDistanceCopy = () => ({
      primary: '335 m',
      secondary: '5 min walk',
      estimated: false,
      pending: false,
    })

    // directionsDistanceM provided → distance-based: 335/100 = 3.35 → 3 min
    const copy = resolveWalkChromeDistanceCopy({
      liveDistanceM: 400,
      directionsDistanceM: 335,
      directionsDurationSec: 240,
      resolveWalkingDistanceCopy,
    })

    expect(formatDistanceLine(copy)).toBe('335 m · 3 min')
  })

  it('falls back to blended Mapbox duration when distance is unavailable', () => {
    const resolveWalkingDistanceCopy = () => ({
      primary: '~400 m',
      secondary: null,
      estimated: true,
      pending: false,
    })

    // No directionsDistanceM → duration * 0.72: 300 * 0.72 = 216 s → 4 min
    const copy = resolveWalkChromeDistanceCopy({
      liveDistanceM: 400,
      directionsDistanceM: null,
      directionsDurationSec: 300,
      resolveWalkingDistanceCopy,
    })

    expect(formatDistanceLine(copy)).toBe('~400 m · 4 min')
  })

  it('formats remaining time in compact style', () => {
    expect(formatRemainingShort(88)).toBe('−1:28')
    expect(formatPlaybackClock(88)).toBe('1:28')
  })

  it('uses etaOverride for ride legs', () => {
    const resolveWalkingDistanceCopy = () => ({
      primary: '8.0 km',
      secondary: '80–100 min walk',
      estimated: true,
      pending: false,
    })
    const copy = resolveWalkChromeDistanceCopy({
      liveDistanceM: 8000,
      directionsDistanceM: 8000,
      etaOverride: 'estimated 30 min drive',
      resolveWalkingDistanceCopy,
    })
    expect(formatDistanceLine(copy)).toBe('estimated 30 min drive')
  })

  it('prefers stop estimate when directions look inflated by stale GPS', () => {
    const resolveWalkingDistanceCopy = (meters) => ({
      primary: meters != null ? `${Math.round(meters)} m` : '—',
      secondary: null,
      estimated: false,
      pending: false,
    })
    const copy = resolveWalkChromeDistanceCopy({
      liveDistanceM: 2200,
      estimatedDistanceM: 560,
      directionsDistanceM: 2200,
      resolveWalkingDistanceCopy,
    })
    expect(copy.primary).toBe('560 m')
  })
})
