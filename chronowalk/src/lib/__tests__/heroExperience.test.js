import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JOURNEY_PACE } from '../../data/romePacing.js'
import { loadRomeManifest, getStepIdAtIndex } from '../../content/manifest.js'
import { buildPlayableSequence } from '../../content/playableSequence.js'
import { grantTestAccess } from '../../test/grantTestAccess.js'
import { clearLocalAccessState } from '../accessSession.js'
import { canAccessHero } from '../contentAccess.js'
import { startHeroExperience } from '../heroExperience.js'
import { clearGuestSession, startNativeGuestExploration } from '../guestSession.js'
import { getJourneySnapshot, resetJourney } from '../../state/journey.js'
import * as paddle from '../paddle.js'

vi.spyOn(paddle, 'openPaddleCheckout')

describe('heroExperience + free Pantheon player', () => {
  const manifest = loadRomeManifest()

  beforeEach(() => {
    localStorage.clear()
    clearLocalAccessState()
    clearGuestSession()
    resetJourney()
    paddle.openPaddleCheckout.mockClear()
  })

  it('lets a guest start Pantheon into the canonical player without Paddle', () => {
    startNativeGuestExploration()
    expect(canAccessHero('w17')).toBe(true)

    const result = startHeroExperience('w17', { manifest })
    expect(result.ok).toBe(true)
    expect(result.path).toBe('/journey')
    expect(paddle.openPaddleCheckout).not.toHaveBeenCalled()

    const snap = getJourneySnapshot()
    expect(snap.context.pace).toBe(JOURNEY_PACE.OWN)
    expect(snap.context.customWaypointIds).toEqual(['w17', 'w23'])
    expect(getStepIdAtIndex(manifest, snap.context.path, 0, snap.context.promotedOptionalIds, snap.context)).toBe(
      'w17',
    )
    expect(getStepIdAtIndex(manifest, snap.context.path, 1, snap.context.promotedOptionalIds, snap.context)).toBe(
      'w23',
    )
    expect(getStepIdAtIndex(manifest, snap.context.path, 2, snap.context.promotedOptionalIds, snap.context)).toBeNull()
    const playable = buildPlayableSequence(
      manifest,
      snap.context.path,
      snap.context.promotedOptionalIds,
      snap.context,
    )
    expect(playable).toEqual(['w17', 'w23'])
    expect(playable).not.toContain('w01')
    expect(playable).not.toContain('t13')
  })

  it('does not let a guest start premium w01 and does not open Paddle', () => {
    startNativeGuestExploration()
    expect(canAccessHero('w01')).toBe(false)
    const result = startHeroExperience('w01', { manifest })
    expect(result).toMatchObject({ ok: false, reason: 'locked' })
    expect(paddle.openPaddleCheckout).not.toHaveBeenCalled()
    expect(getJourneySnapshot().state).toBe('idle')
  })

  it('lets an entitled traveler start a premium Hero on the linear journey', () => {
    grantTestAccess()
    expect(canAccessHero('w01')).toBe(true)
    const result = startHeroExperience('w01', { manifest })
    expect(result.ok).toBe(true)
    expect(getJourneySnapshot().state).toBe('walking')
    const snap = getJourneySnapshot()
    expect(
      getStepIdAtIndex(manifest, snap.context.path, snap.context.currentSequenceIndex, snap.context.promotedOptionalIds, snap.context),
    ).toBe('w01')
  })
})
