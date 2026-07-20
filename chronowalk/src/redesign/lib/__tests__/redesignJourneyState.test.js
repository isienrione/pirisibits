import { describe, expect, it } from 'vitest'
import { JOURNEY_STATES } from '../../../state/journey.js'
import {
  migratePersistedJourneyState,
  normalizeRedesignJourneyState,
} from '../redesignJourneyState.js'

describe('redesignJourneyState', () => {
  it('maps legacy threshold and arrived states to story', () => {
    expect(normalizeRedesignJourneyState(JOURNEY_STATES.THRESHOLD)).toBe(JOURNEY_STATES.STORY)
    expect(normalizeRedesignJourneyState(JOURNEY_STATES.ARRIVED)).toBe(JOURNEY_STATES.STORY)
    expect(normalizeRedesignJourneyState(JOURNEY_STATES.WALKING)).toBe(JOURNEY_STATES.WALKING)
  })

  it('migrates persisted threshold sessions on load', () => {
    expect(migratePersistedJourneyState(JOURNEY_STATES.THRESHOLD)).toBe(JOURNEY_STATES.STORY)
  })
})
