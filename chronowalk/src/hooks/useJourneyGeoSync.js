import { useEffect } from 'react'
import { JOURNEY_STATE } from './useGeoLocation'
import { JOURNEY_STATES } from '../state/journeyState'
import { useJourney } from './useJourney'

const APPROACHING_THRESHOLD_M = 120

/**
 * Sync GPS arrival/transit with launch journey state machine.
 */
export function useJourneyGeoSync({ geoState, distance, enabled = true }) {
  const { state, setState } = useJourney()

  useEffect(() => {
    if (!enabled) return

    if (geoState === JOURNEY_STATE.ARRIVAL) {
      if (state === JOURNEY_STATES.WALKING || state === JOURNEY_STATES.APPROACHING) {
        setState(JOURNEY_STATES.ARRIVED)
      }
      return
    }

    if (geoState === JOURNEY_STATE.TRANSIT) {
      if (state === JOURNEY_STATES.WALKING && distance != null && distance <= APPROACHING_THRESHOLD_M) {
        setState(JOURNEY_STATES.APPROACHING)
      }
    }
  }, [distance, enabled, geoState, setState, state])
}

export default useJourneyGeoSync
