import { describe, expect, it, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { JOURNEY_STATE } from '../useGeoLocation'
import { useJourneyGeoSync } from '../useJourneyGeoSync'
import { JOURNEY_STATES, defaultJourneySnapshot, getJourneySnapshot, hydrateJourney } from '../../state/journeyState'

describe('useJourneyGeoSync', () => {
  beforeEach(() => {
    hydrateJourney({
      ...defaultJourneySnapshot(),
      state: JOURNEY_STATES.WALKING,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })
  })

  it('enters approaching when within threshold during transit', () => {
    renderHook(() =>
      useJourneyGeoSync({
        geoState: JOURNEY_STATE.TRANSIT,
        distance: 90,
        enabled: true,
      })
    )

    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.APPROACHING)
  })

  it('enters arrived when GPS reports arrival', () => {
    hydrateJourney({
      ...defaultJourneySnapshot(),
      state: JOURNEY_STATES.APPROACHING,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })

    renderHook(() =>
      useJourneyGeoSync({
        geoState: JOURNEY_STATE.ARRIVAL,
        distance: 12,
        enabled: true,
      })
    )

    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.ARRIVED)
  })
})
