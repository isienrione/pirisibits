import { describe, expect, it, beforeEach } from 'vitest'
import {
  beginJourney,
  getJourneySnapshot,
  resetJourney,
  subscribeJourney,
  transitionJourney,
  JOURNEY_STATES,
} from '../journey'

describe('journey state machine', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
  })

  it('transitions between states', () => {
    transitionJourney(JOURNEY_STATES.WALKING)
    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.WALKING)
  })

  it('persists and rehydrates from localStorage', () => {
    beginJourney({ dayNumber: 1, waypointIndex: 2 })
    transitionJourney(JOURNEY_STATES.APPROACHING)

    const raw = localStorage.getItem('cw_journey_v1')
    expect(raw).toBeTruthy()

    const parsed = JSON.parse(raw)
    expect(parsed.state).toBe(JOURNEY_STATES.APPROACHING)
    expect(parsed.context.currentWaypointIndex).toBe(2)
  })

  it('notifies subscribers on transition', () => {
    const seen = []
    const unsubscribe = subscribeJourney((snapshot) => seen.push(snapshot.state))
    transitionJourney(JOURNEY_STATES.ARRIVED)
    unsubscribe()
    expect(seen).toContain(JOURNEY_STATES.ARRIVED)
  })
})
