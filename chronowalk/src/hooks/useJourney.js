import { useSyncExternalStore } from 'react'
import {
  JOURNEY_STATES,
  getJourneySnapshot,
  resetJourney,
  setJourneyState,
  subscribeJourney,
  updateJourneyContext,
} from '../state/journeyState'

export function useJourney() {
  const snapshot = useSyncExternalStore(subscribeJourney, getJourneySnapshot, getJourneySnapshot)

  return {
    state: snapshot.state,
    context: snapshot.context,
    states: JOURNEY_STATES,
    setState: setJourneyState,
    updateContext: updateJourneyContext,
    reset: resetJourney,
  }
}

export { JOURNEY_STATES }
