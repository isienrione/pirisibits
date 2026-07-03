import { describe, expect, it, beforeEach } from 'vitest'
import {
  beginJourney,
  getJourneySnapshot,
  resetJourney,
  subscribeJourney,
  transitionJourney,
  setJourneyPath,
  promoteOptionalWaypoint,
  completeStoryAfterThreshold,
  JOURNEY_STATES,
} from '../journey'
import { loadRomeManifest } from '../../content/manifest.js'

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
    beginJourney({ pace: 'classic', waypointIndex: 2 })
    transitionJourney(JOURNEY_STATES.APPROACHING, { currentSequenceIndex: 4 })

    const raw = localStorage.getItem('cw_journey_v1')
    expect(raw).toBeTruthy()

    const parsed = JSON.parse(raw)
    expect(parsed.state).toBe(JOURNEY_STATES.APPROACHING)
    expect(parsed.context.currentSequenceIndex).toBe(4)
  })

  it('locks path at the act II fork', () => {
    setJourneyPath('b')
    expect(getJourneySnapshot().context.path).toBe('b')
    expect(getJourneySnapshot().context.pathLocked).toBe(true)
  })

  it('notifies subscribers on transition', () => {
    const seen = []
    const unsubscribe = subscribeJourney((snapshot) => seen.push(snapshot.state))
    transitionJourney(JOURNEY_STATES.ARRIVED)
    unsubscribe()
    expect(seen).toContain(JOURNEY_STATES.ARRIVED)
  })

  it('promotes optional w04 on path A and rewinds sequence to t02', () => {
    const manifest = loadRomeManifest()
    beginJourney({ pace: 'classic', path: 'a' })
    transitionJourney(JOURNEY_STATES.WALKING, {
      currentSequenceIndex: 4,
      completedWaypointIds: ['w01', 'w02', 'w03'],
      pathLocked: true,
    })

    promoteOptionalWaypoint('w04', manifest)

    const snapshot = getJourneySnapshot()
    expect(snapshot.context.promotedOptionalIds).toEqual(['w04'])
    expect(snapshot.context.currentSequenceIndex).toBe(4)
    expect(snapshot.state).toBe(JOURNEY_STATES.WALKING)
  })

  it('completes story and advances after threshold dismiss', () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.THRESHOLD, { currentSequenceIndex: 0 })

    completeStoryAfterThreshold('w01')

    const snapshot = getJourneySnapshot()
    expect(snapshot.state).toBe(JOURNEY_STATES.WALKING)
    expect(snapshot.context.completedWaypointIds).toContain('w01')
    expect(snapshot.context.currentSequenceIndex).toBe(1)
  })
})
