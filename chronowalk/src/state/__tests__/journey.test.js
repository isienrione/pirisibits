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
  shouldHideShellTabBar,
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
    expect(getJourneySnapshot().context.promotedOptionalIds).toEqual(['w04'])
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

  it('includes Palatine on classic path A by default', () => {
    const manifest = loadRomeManifest()
    beginJourney({ pace: 'classic', path: 'a' })
    const sequence = buildEffectiveSequence(manifest, 'a', ['w04'])

    expect(getJourneySnapshot().context.promotedOptionalIds).toEqual(['w04'])
    expect(sequence).toContain('w04')
  })

  it('places Circus Maximus View on Path B after Palatine, not after Capitoline', () => {
    const manifest = loadRomeManifest()
    const pathB = buildEffectiveSequence(manifest, 'b', [])
    expect(pathB.indexOf('enc_circus')).toBe(pathB.indexOf('w04') + 1)
    expect(pathB.slice(pathB.indexOf('w21'))).toEqual(['w21', 't22', 'w22'])

    beginJourney({ pace: 'classic', path: 'a' })
    transitionJourney(JOURNEY_STATES.WALKING, {
      completedWaypointIds: ['w01', 'w02', 'w03', 'w04', 'w06', 'w07', 'w08', 'w10', 'w11_12', 'w13'],
      pathLocked: true,
    })

    const next = completeWaypointAndAdvance('w13', manifest)
    expect(next.context.promotedOptionalIds ?? []).not.toContain('enc_circus')
    expect(buildEffectiveSequence(manifest, 'a', next.context.promotedOptionalIds ?? [])).not.toContain(
      'enc_circus'
    )
  })

  it('classic Path B completes at Capitoline instead of looping', () => {
    const manifest = loadRomeManifest()
    const seq = buildEffectiveSequence(manifest, 'b', [])
    const w13Index = seq.indexOf('w13')

    beginJourney({ pace: 'classic', path: 'b' })
    transitionJourney(JOURNEY_STATES.STORY, {
      path: 'b',
      pathLocked: true,
      currentSequenceIndex: w13Index,
      completedWaypointIds: [],
    })

    const first = completeWaypointAndAdvance('w13', manifest)
    expect(first.state).toBe(JOURNEY_STATES.COMPLETE)
    expect(first.context.promotedOptionalIds ?? []).not.toContain('enc_circus')

    // Re-fire continue while still indexed on Capitoline — must stay complete, not replay.
    transitionJourney(JOURNEY_STATES.STORY, {
      path: 'b',
      pathLocked: true,
      currentSequenceIndex: w13Index,
      completedWaypointIds: ['w13'],
    })
    const second = completeWaypointAndAdvance('w13', manifest)
    expect(second.state).toBe(JOURNEY_STATES.COMPLETE)
  })

  it('heroic Path B advances past Capitoline toward Via Appia (via t10)', () => {
    const manifest = loadRomeManifest()
    const seq = buildEffectiveSequence(manifest, 'b', [])
    const w13Index = seq.indexOf('w13')

    beginJourney({ pace: 'heroic', path: 'b' })
    transitionJourney(JOURNEY_STATES.STORY, {
      path: 'b',
      pathLocked: true,
      currentSequenceIndex: w13Index,
      completedWaypointIds: [],
    })

    const first = completeWaypointAndAdvance('w13', manifest)
    expect(first.state).toBe(JOURNEY_STATES.WALKING)
    expect(seq[first.context.currentSequenceIndex]).toBe('t10')

    // Stale second complete while still on w13 must advance, not loop the story.
    transitionJourney(JOURNEY_STATES.STORY, {
      path: 'b',
      pathLocked: true,
      currentSequenceIndex: w13Index,
      completedWaypointIds: ['w13'],
    })
    const second = completeWaypointAndAdvance('w13', manifest)
    expect(second.state).toBe(JOURNEY_STATES.WALKING)
    expect(seq[second.context.currentSequenceIndex]).toBe('t10')
    expect(seq.slice(seq.indexOf('w21'))).toEqual(['w21', 't22', 'w22'])
  })

  it('does not promote optional waypoints that have no insert steps on the path', () => {
    const manifest = loadRomeManifest()
    beginJourney({ pace: 'classic', path: 'b' })
    const before = getJourneySnapshot()
    const next = promoteOptionalWaypoint('enc_circus', manifest)
    expect(next).toEqual(before)
    expect(next.context.promotedOptionalIds ?? []).not.toContain('enc_circus')
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

  it('marks the journey complete after the final waypoint', () => {
    const manifest = loadRomeManifest()
    const seq = buildEffectiveSequence(manifest, 'a', [])
    const w22Index = seq.indexOf('w22')
    expect(w22Index).toBeGreaterThanOrEqual(0)

    beginJourney({ pace: 'heroic', path: 'a' })
    transitionJourney(JOURNEY_STATES.STORY, {
      currentSequenceIndex: w22Index,
      completedWaypointIds: seq.slice(0, w22Index).filter((id) => id.startsWith('w')),
    })

    completeWaypointAndAdvance('w22', manifest)

    const snapshot = getJourneySnapshot()
    expect(snapshot.state).toBe(JOURNEY_STATES.COMPLETE)
    expect(snapshot.context.completedWaypointIds).toContain('w22')
    expect(snapshot.context.currentSequenceIndex).toBe(w22Index)
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

  it('hides shell tab bar only during threshold reveal', () => {
    expect(shouldHideShellTabBar(false)).toBe(false)
    expect(shouldHideShellTabBar(true)).toBe(true)
  })
})
