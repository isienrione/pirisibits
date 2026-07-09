import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  beginJourney,
  getJourneySnapshot,
  resetJourney,
  subscribeJourney,
  transitionJourney,
  setJourneyPath,
  promoteOptionalWaypoint,
  completeStoryAfterThreshold,
  completeWaypointAndAdvance,
  continueFromDayComplete,
  jumpToSequenceIndex,
  resumeJourney,
  prepareResumeCueIfNeeded,
  clearPendingResumeCue,
  JOURNEY_STATES,
} from '../journey'
import { loadRomeManifest } from '../../content/manifest.js'
import { buildEffectiveSequence } from '../../content/optionalPromotion.js'

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
    const t02Index = buildEffectiveSequence(manifest, 'a', ['w04']).indexOf('t02')
    beginJourney({ pace: 'classic', path: 'a' })
    transitionJourney(JOURNEY_STATES.WALKING, {
      currentSequenceIndex: 4,
      completedWaypointIds: ['w01', 'w02', 'w03'],
      pathLocked: true,
    })

    promoteOptionalWaypoint('w04', manifest)

    const snapshot = getJourneySnapshot()
    expect(snapshot.context.promotedOptionalIds).toEqual(['w04'])
    expect(snapshot.context.currentSequenceIndex).toBe(t02Index)
    expect(snapshot.state).toBe(JOURNEY_STATES.WALKING)
  })

  it('enters day complete after act IV on classic pace', () => {
    const manifest = loadRomeManifest()
    const w14Index = buildEffectiveSequence(manifest, 'a', []).indexOf('w14')
    expect(w14Index).toBeGreaterThanOrEqual(0)

    beginJourney({ pace: 'classic', path: 'a' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: w14Index })

    const next = completeWaypointAndAdvance('w14')
    expect(next.state).toBe(JOURNEY_STATES.DAY_COMPLETE)
    expect(next.context.completedWaypointIds).toContain('w14')
    expect(next.context.currentSequenceIndex).toBe(w14Index)
  })

  it('continues from day complete into act V transit', () => {
    const manifest = loadRomeManifest()
    const w14Index = buildEffectiveSequence(manifest, 'a', []).indexOf('w14')

    beginJourney({ pace: 'classic', path: 'a' })
    transitionJourney(JOURNEY_STATES.DAY_COMPLETE, {
      currentSequenceIndex: w14Index,
      completedWaypointIds: ['w14'],
    })

    const next = continueFromDayComplete()
    expect(next.state).toBe(JOURNEY_STATES.WALKING)
    expect(next.context.currentSequenceIndex).toBe(w14Index + 1)
  })

  it('advances past w14 without day break on heroic pace', () => {
    const manifest = loadRomeManifest()
    const w14Index = buildEffectiveSequence(manifest, 'a', []).indexOf('w14')

    beginJourney({ pace: 'heroic', path: 'a' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: w14Index })

    const next = completeWaypointAndAdvance('w14')
    expect(next.state).toBe(JOURNEY_STATES.WALKING)
    expect(next.context.currentSequenceIndex).toBe(w14Index + 1)
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

  it('does not double-advance when threshold completes an already-finished waypoint', () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.WALKING, {
      currentSequenceIndex: 1,
      completedWaypointIds: ['w01'],
    })

    const next = completeWaypointAndAdvance('w01')

    expect(next.state).toBe(JOURNEY_STATES.WALKING)
    expect(next.context.currentSequenceIndex).toBe(1)
  })

  it('queues a resume cue when continuing a saved journey', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-27T14:00:00Z'))

    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.WALKING, {
      currentSequenceIndex: 2,
      completedWaypointIds: ['w01'],
      lastActiveAt: new Date('2026-06-27T12:00:00Z').getTime(),
    })

    resumeJourney()

    expect(getJourneySnapshot().context.pendingResumeCue).toBe('same_day')
    vi.useRealTimers()
  })

  it('prepares resume cue after being away long enough', () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.WALKING, {
      currentSequenceIndex: 1,
      lastActiveAt: Date.now() - 10 * 60 * 1000,
    })

    prepareResumeCueIfNeeded()

    expect(getJourneySnapshot().context.pendingResumeCue).toMatch(/same_day|new_day/)
  })

  it('clears pending resume cue after playback', () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.WALKING, { pendingResumeCue: 'same_day' })

    clearPendingResumeCue()

    expect(getJourneySnapshot().context.pendingResumeCue).toBeNull()
  })

  it('jumps to a sequence index for field testing', () => {
    beginJourney({ pace: 'classic' })
    const next = jumpToSequenceIndex(12)
    expect(next.state).toBe(JOURNEY_STATES.WALKING)
    expect(next.context.currentSequenceIndex).toBe(12)
  })
})
