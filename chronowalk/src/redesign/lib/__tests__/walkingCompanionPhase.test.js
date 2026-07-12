import { describe, expect, it } from 'vitest'
import { LOCATION_STATUS } from '../../../hooks/useGeoLocation.js'
import {
  isWithinApproachDistance,
  phaseLabel,
  resolveWalkingCompanionPhase,
  resolveWalkingDistanceCopy,
  shouldShowTransitMiniPlayer,
} from '../walkingCompanionPhase.js'

describe('walkingCompanionPhase', () => {
  it('resolves phases in priority order', () => {
    expect(resolveWalkingCompanionPhase({})).toBe('walking')
    expect(resolveWalkingCompanionPhase({ distanceM: 70 })).toBe('near')
    expect(resolveWalkingCompanionPhase({ showArrivedUI: true, distanceM: 70 })).toBe('arrived')
  })

  it('detects approach distance threshold', () => {
    expect(isWithinApproachDistance(79)).toBe(true)
    expect(isWithinApproachDistance(80)).toBe(true)
    expect(isWithinApproachDistance(81)).toBe(false)
  })

  it('returns phase labels', () => {
    expect(phaseLabel('walking')).toBeNull()
    expect(phaseLabel('near')).toBe('Almost there')
    expect(phaseLabel('arrived')).toBe('You have arrived')
  })

  it('shows mini player only during live transit narration', () => {
    expect(
      shouldShowTransitMiniPlayer({
        mode: 'transit',
        transcript: 'Listen on the way.',
        narrationPlaying: true,
      })
    ).toBe(true)
    expect(
      shouldShowTransitMiniPlayer({
        mode: 'transit',
        transcript: 'Listen on the way.',
      })
    ).toBe(false)
    expect(
      shouldShowTransitMiniPlayer({
        mode: 'transit',
        transcript: 'Listen on the way.',
        narrationPlaying: true,
        showArrivedUI: true,
      })
    ).toBe(false)
  })

  it('shows mini player for transit legs with narration until finished', () => {
    expect(
      shouldShowTransitMiniPlayer({
        mode: 'transit',
        transcript: 'Listen while Rome rolls past.',
        narrationPlaying: true,
      })
    ).toBe(true)
    expect(
      shouldShowTransitMiniPlayer({
        mode: 'waypoint',
        transcript: 'Listen while Rome rolls past.',
        narrationPlaying: true,
      })
    ).toBe(false)
    expect(
      shouldShowTransitMiniPlayer({
        mode: 'transit',
        transcript: '',
        narrationPlaying: true,
      })
    ).toBe(false)
  })

  it('shows gps help only when location is blocked', () => {
    const waiting = resolveWalkingDistanceCopy(null, null, LOCATION_STATUS.WAITING)
    expect(waiting.pending).toBe(true)
    expect(waiting.gpsBlocked).toBeUndefined()

    const denied = resolveWalkingDistanceCopy(null, null, LOCATION_STATUS.DENIED)
    expect(denied.gpsBlocked).toBe(true)
    expect(denied.primary).toBe('Distance unavailable')
  })
})
