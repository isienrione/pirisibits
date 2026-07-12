import { describe, expect, it, beforeEach } from 'vitest'
import {
  cardCopyForPhase,
  hasCompletedTourOnboarding,
  isOnFirstTourStop,
  clearTourOnboarding,
  markTourOnboardingComplete,
  resolveTourOnboardingCardPhase,
  shouldShowTourOnboarding,
  shouldShowTourRoutePreview,
  storyCardPhases,
  applyReplayOnboardingFromSearch,
} from '../tourOnboarding.js'
import { loadRomeManifest } from '../../content/manifest.js'
import { JOURNEY_PACE } from '../../data/romePacing.js'

describe('tourOnboarding', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('detects fresh first-tour travelers', () => {
    expect(hasCompletedTourOnboarding()).toBe(false)
    expect(shouldShowTourOnboarding({ completedWaypointIds: [] })).toBe(true)
    expect(shouldShowTourRoutePreview({ completedWaypointIds: [] })).toBe(true)
    expect(shouldShowTourOnboarding({ completedWaypointIds: ['w01'] })).toBe(false)
  })

  it('persists onboarding completion', () => {
    markTourOnboardingComplete()
    expect(hasCompletedTourOnboarding()).toBe(true)
    expect(shouldShowTourOnboarding({ completedWaypointIds: [] })).toBe(false)
  })

  it('clears onboarding for mobile replay links', () => {
    markTourOnboardingComplete()
    const result = applyReplayOnboardingFromSearch('?replayOnboarding=1&fresh=1')
    expect(result).toEqual({ replay: true, fresh: true })
    expect(hasCompletedTourOnboarding()).toBe(false)
  })

  it('limits first-stop onboarding to the opening waypoint', () => {
    const manifest = loadRomeManifest()
    const context = { completedWaypointIds: [], currentSequenceIndex: 0, pace: JOURNEY_PACE.CLASSIC, path: 'a' }
    expect(isOnFirstTourStop(context, { type: 'waypoint', id: 'w01' }, manifest)).toBe(true)
    expect(isOnFirstTourStop(context, { type: 'transit' }, manifest)).toBe(false)
    expect(
      isOnFirstTourStop(
        { completedWaypointIds: ['w01'], currentSequenceIndex: 1, pace: JOURNEY_PACE.CLASSIC, path: 'a' },
        { type: 'waypoint', id: 'w03' },
        manifest,
      ),
    ).toBe(false)
  })

  it('treats the first selected own-pace stop as the opening waypoint', () => {
    const manifest = loadRomeManifest()
    const ownContext = {
      completedWaypointIds: [],
      currentSequenceIndex: 4,
      pace: JOURNEY_PACE.OWN,
      path: 'a',
      customWaypointIds: ['w06', 'w07'],
    }

    expect(isOnFirstTourStop(ownContext, { type: 'waypoint', id: 'w06' }, manifest)).toBe(true)
    expect(isOnFirstTourStop(ownContext, { type: 'waypoint', id: 'w01' }, manifest)).toBe(false)
  })

  it('resolves card phases from journey state', () => {
    expect(
      resolveTourOnboardingCardPhase({ state: 'walking', stepType: 'waypoint' }),
    ).toBe('walk')
    expect(
      resolveTourOnboardingCardPhase({
        state: 'walking',
        stepType: 'waypoint',
        near: true,
      }),
    ).toBe('arrive')
    expect(
      resolveTourOnboardingCardPhase({ state: 'story', stepType: 'waypoint' }),
    ).toBe('listen')
    expect(
      resolveTourOnboardingCardPhase({
        state: 'story',
        stepType: 'waypoint',
        dismissedPhases: new Set(['listen']),
      }),
    ).toBe('transcript')
    expect(
      resolveTourOnboardingCardPhase({
        state: 'story',
        stepType: 'waypoint',
        hasReconstruction: true,
        dismissedPhases: new Set(['listen', 'transcript', 'continue']),
      }),
    ).toBe('reveal')
  })

  it('orders story cards with reveal last when available', () => {
    expect(storyCardPhases(false)).toEqual(['listen', 'transcript', 'continue'])
    expect(storyCardPhases(true)).toEqual(['listen', 'transcript', 'continue', 'reveal'])
  })

  it('returns card copy for each phase', () => {
    const walk = cardCopyForPhase('walk', 'The Colosseum')
    expect(walk.title).toMatch(/Colosseum/)
    expect(cardCopyForPhase('listen').title).toMatch(/pause/i)
    expect(cardCopyForPhase('transcript').title).toMatch(/script/i)
    expect(cardCopyForPhase('continue').title).toMatch(/next stop/i)
    expect(cardCopyForPhase('reveal').title).toMatch(/hold/i)
  })
})
