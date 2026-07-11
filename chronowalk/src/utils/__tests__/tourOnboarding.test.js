import { describe, expect, it, beforeEach } from 'vitest'
import {
  cardCopyForPhase,
  hasCompletedTourOnboarding,
  isOnFirstTourStop,
  markTourOnboardingComplete,
  resolveTourOnboardingCardPhase,
  shouldShowTourOnboarding,
} from '../tourOnboarding.js'

describe('tourOnboarding', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('detects fresh first-tour travelers', () => {
    expect(hasCompletedTourOnboarding()).toBe(false)
    expect(shouldShowTourOnboarding({ completedWaypointIds: [] })).toBe(true)
    expect(shouldShowTourOnboarding({ completedWaypointIds: ['w01'] })).toBe(false)
  })

  it('persists onboarding completion', () => {
    markTourOnboardingComplete()
    expect(hasCompletedTourOnboarding()).toBe(true)
    expect(shouldShowTourOnboarding({ completedWaypointIds: [] })).toBe(false)
  })

  it('limits first-stop onboarding to the opening waypoint', () => {
    const context = { completedWaypointIds: [], currentSequenceIndex: 0 }
    expect(isOnFirstTourStop(context, { type: 'waypoint' })).toBe(true)
    expect(isOnFirstTourStop(context, { type: 'transit' })).toBe(false)
    expect(isOnFirstTourStop({ completedWaypointIds: ['w01'], currentSequenceIndex: 1 }, { type: 'waypoint' })).toBe(
      false,
    )
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
      resolveTourOnboardingCardPhase({ state: 'approaching', stepType: 'waypoint' }),
    ).toBe('arrive')
    expect(
      resolveTourOnboardingCardPhase({ state: 'story', stepType: 'waypoint' }),
    ).toBe('listen')
    expect(
      resolveTourOnboardingCardPhase({
        state: 'story',
        stepType: 'waypoint',
        hasReconstruction: true,
      }),
    ).toBe('reveal')
  })

  it('returns card copy for each phase', () => {
    const walk = cardCopyForPhase('walk', 'The Colosseum')
    expect(walk.title).toMatch(/Colosseum/)
    expect(cardCopyForPhase('reveal').title).toMatch(/hold/i)
  })
})
