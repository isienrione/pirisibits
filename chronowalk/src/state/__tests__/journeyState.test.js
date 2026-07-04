import { beforeEach, describe, expect, it } from 'vitest'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  getJourneySnapshot,
  getJourneyStorageKey,
  hydrateJourney,
  readJourneyFromStorage,
  resetJourney,
  setJourneyState,
  subscribeJourney,
  updateJourneyContext,
} from '../journeyState'

describe('journeyState', () => {
  beforeEach(() => {
    window.localStorage.clear()
    hydrateJourney(defaultJourneySnapshot())
  })

  it('starts idle with default context', () => {
    const snapshot = getJourneySnapshot()
    expect(snapshot.state).toBe(JOURNEY_STATES.IDLE)
    expect(snapshot.context.currentStopId).toBeNull()
    expect(snapshot.context.completedStopIds).toEqual([])
    expect(snapshot.context.hasAccess).toBe(true)
  })

  it('persists state changes to localStorage', () => {
    setJourneyState(JOURNEY_STATES.WALKING)

    const stored = JSON.parse(window.localStorage.getItem(getJourneyStorageKey()))
    expect(stored.state).toBe(JOURNEY_STATES.WALKING)
  })

  it('restores from localStorage on read', () => {
    window.localStorage.setItem(
      getJourneyStorageKey(),
      JSON.stringify({
        state: JOURNEY_STATES.STORY,
        context: {
          currentStopId: 'pantheon',
          currentStopIndex: 2,
          completedStopIds: ['colosseum'],
          audioProgress: 0.75,
          hasAccess: true,
          lastUpdatedAt: '2026-07-04T00:00:00.000Z',
        },
      })
    )

    const restored = readJourneyFromStorage()
    expect(restored.state).toBe(JOURNEY_STATES.STORY)
    expect(restored.context.currentStopId).toBe('pantheon')
    expect(restored.context.completedStopIds).toEqual(['colosseum'])
    expect(restored.context.audioProgress).toBe(0.75)
  })

  it('updates context and stamps lastUpdatedAt', () => {
    updateJourneyContext({
      currentStopId: 'colosseum',
      currentStopIndex: 0,
      completedStopIds: [],
    })

    const snapshot = getJourneySnapshot()
    expect(snapshot.context.currentStopId).toBe('colosseum')
    expect(snapshot.context.lastUpdatedAt).toMatch(/^\d{4}-/)
  })

  it('clamps audioProgress between 0 and 1', () => {
    updateJourneyContext({ audioProgress: 2 })
    expect(getJourneySnapshot().context.audioProgress).toBe(1)

    updateJourneyContext({ audioProgress: -0.5 })
    expect(getJourneySnapshot().context.audioProgress).toBe(0)
  })

  it('notifies subscribers on transition', () => {
    let calls = 0
    const unsubscribe = subscribeJourney(() => {
      calls += 1
    })

    setJourneyState(JOURNEY_STATES.APPROACHING)
    resetJourney()
    unsubscribe()

    expect(calls).toBe(2)
  })

  it('reset returns to idle defaults', () => {
    setJourneyState(JOURNEY_STATES.THRESHOLD)
    updateJourneyContext({ currentStopId: 'forum', currentStopIndex: 3 })

    resetJourney()

    const snapshot = getJourneySnapshot()
    expect(snapshot.state).toBe(JOURNEY_STATES.IDLE)
    expect(snapshot.context.currentStopId).toBeNull()
    expect(snapshot.context.currentStopIndex).toBe(0)
  })
})
