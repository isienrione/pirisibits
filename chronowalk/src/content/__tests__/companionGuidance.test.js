import { describe, expect, it } from 'vitest'
import { LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import { JOURNEY_STATES } from '../../state/journey.js'
import {
  COMPANION_MODES,
  companionCopy,
  isCompanionTrackingState,
  movedEnough,
  resolveCompanionMode,
  resolveOffRouteThresholdM,
} from '../companionGuidance.js'

describe('companionGuidance', () => {
  it('flags off-route when far from the target', () => {
    expect(resolveOffRouteThresholdM(40)).toBe(400)
    expect(
      resolveCompanionMode({
        distance: 500,
        geofenceRadiusM: 40,
        locationStatus: LOCATION_STATUS.GRANTED,
        stationaryMs: 0,
      })
    ).toBe(COMPANION_MODES.OFF_ROUTE)
  })

  it('enters observation after staying still long enough', () => {
    expect(
      resolveCompanionMode({
        distance: 180,
        geofenceRadiusM: 40,
        locationStatus: LOCATION_STATUS.GRANTED,
        stationaryMs: 95_000,
      })
    ).toBe(COMPANION_MODES.OBSERVING)
  })

  it('prioritizes off-route over observation', () => {
    expect(
      resolveCompanionMode({
        distance: 500,
        geofenceRadiusM: 40,
        locationStatus: LOCATION_STATUS.GRANTED,
        stationaryMs: 120_000,
      })
    ).toBe(COMPANION_MODES.OFF_ROUTE)
  })

  it('does not flag off-route while Rome location simulation is active', () => {
    expect(
      resolveCompanionMode({
        distance: 1500,
        geofenceRadiusM: 40,
        locationStatus: LOCATION_STATUS.GRANTED,
        stationaryMs: 0,
        suppressOffRoute: true,
      })
    ).toBe(COMPANION_MODES.NORMAL)
  })

  it('detects meaningful movement for stationary tracking', () => {
    const origin = { lat: 41.89, lng: 12.49 }
    expect(movedEnough(origin, { lat: 41.89, lng: 12.49 })).toBe(false)
    expect(movedEnough(origin, { lat: 41.891, lng: 12.49 })).toBe(true)
  })

  it('returns companion copy for off-route and observation', () => {
    expect(companionCopy(COMPANION_MODES.OFF_ROUTE, { targetTitle: 'The Forum' })?.title).toMatch(
      /farther from the path/i
    )
    expect(companionCopy(COMPANION_MODES.OBSERVING)?.eyebrow).toBe('Observation')
    expect(companionCopy(COMPANION_MODES.NORMAL)).toBeNull()
  })

  it('tracks companion on walking and approaching states', () => {
    expect(isCompanionTrackingState(JOURNEY_STATES.WALKING)).toBe(true)
    expect(isCompanionTrackingState(JOURNEY_STATES.APPROACHING)).toBe(true)
    expect(isCompanionTrackingState(JOURNEY_STATES.STORY)).toBe(false)
  })
})
