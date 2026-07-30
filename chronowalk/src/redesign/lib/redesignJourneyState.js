import { JOURNEY_STATES } from '../../state/journey.js'

/** Redesign uses inline threshold + C6 · never the legacy THRESHOLD screen. */
export function normalizeRedesignJourneyState(state) {
  if (state === JOURNEY_STATES.THRESHOLD || state === JOURNEY_STATES.ARRIVED) {
    return JOURNEY_STATES.STORY
  }
  return state
}

export function migratePersistedJourneyState(state) {
  return normalizeRedesignJourneyState(state)
}
