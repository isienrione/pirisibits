import { describe, expect, it } from 'vitest'
import { JOURNEY_STATE } from '../../hooks/useGeoLocation'
import {
  APPROACHING_DISTANCE_M,
  resolveV1JourneyPhase,
  V1_JOURNEY_PHASE,
} from '../v1JourneyPhase'

describe('resolveV1JourneyPhase', () => {
  it('returns complete when the tour is finished', () => {
    expect(
      resolveV1JourneyPhase({
        isTourComplete: true,
        geoState: JOURNEY_STATE.TRANSIT,
      })
    ).toBe(V1_JOURNEY_PHASE.COMPLETE)
  })

  it('returns before start until the journey begins', () => {
    expect(
      resolveV1JourneyPhase({
        isAwaitingFirstStop: true,
        journeyBegun: false,
        geoState: JOURNEY_STATE.TRANSIT,
      })
    ).toBe(V1_JOURNEY_PHASE.BEFORE_START)
  })

  it('returns walking after begin', () => {
    expect(
      resolveV1JourneyPhase({
        isAwaitingFirstStop: true,
        journeyBegun: true,
        geoState: JOURNEY_STATE.TRANSIT,
        distance: 200,
      })
    ).toBe(V1_JOURNEY_PHASE.WALKING)
  })

  it('returns approaching within 80m', () => {
    expect(
      resolveV1JourneyPhase({
        geoState: JOURNEY_STATE.TRANSIT,
        distance: APPROACHING_DISTANCE_M,
      })
    ).toBe(V1_JOURNEY_PHASE.APPROACHING)
  })

  it('returns story when a waypoint card is open', () => {
    expect(
      resolveV1JourneyPhase({
        geoState: JOURNEY_STATE.ARRIVAL,
        activeWaypoint: { id: 'w01' },
      })
    ).toBe(V1_JOURNEY_PHASE.STORY)
  })

  it('returns threshold when threshold mode is active', () => {
    expect(
      resolveV1JourneyPhase({
        geoState: JOURNEY_STATE.ARRIVAL,
        activeWaypoint: { id: 'w01' },
        thresholdActive: true,
      })
    ).toBe(V1_JOURNEY_PHASE.THRESHOLD)
  })
})
