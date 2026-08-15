import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAppEntryComplete,
  getActiveWalkPath,
  getAppHomePath,
  isAppEntryComplete,
  markAppEntryComplete,
  packTitleForPurchasedTier,
} from '../appEntry.js'
import { JOURNEY_STATES } from '../../state/journey.js'

describe('appEntry', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('tracks whether the traveler crossed into the app', () => {
    expect(isAppEntryComplete()).toBe(false)
    markAppEntryComplete()
    expect(isAppEntryComplete()).toBe(true)
    clearAppEntryComplete()
    expect(isAppEntryComplete()).toBe(false)
  })

  it('names purchased packs', () => {
    expect(packTitleForPurchasedTier('rome-essential')).toBe('Roma Antica')
    expect(packTitleForPurchasedTier('rome-central')).toBe('Roma Historica')
    expect(packTitleForPurchasedTier('rome-complete')).toBe('Roma Eterna')
  })

  it('routes into setup until entry is complete, then Home', () => {
    expect(getAppHomePath({ resumable: false, entryComplete: false })).toBe('/setup')
    expect(getAppHomePath({ resumable: false, entryComplete: true })).toBe('/home')
    expect(getAppHomePath({ resumable: true, entryComplete: false })).toBe('/home')
    expect(getAppHomePath({ resumable: true, entryComplete: true })).toBe('/home')
  })

  it('forces App Entry setup after a fresh unlock', () => {
    markAppEntryComplete()
    expect(getAppHomePath({ afterUnlock: true, entryComplete: true, resumable: true })).toBe(
      '/setup',
    )
    expect(isAppEntryComplete()).toBe(false)
  })

  it('returns /journey for an active walk so the current stop is preserved', () => {
    expect(
      getActiveWalkPath({
        journeySnapshot: { state: JOURNEY_STATES.STORY },
        entryComplete: true,
      }),
    ).toBe('/journey')
    expect(
      getActiveWalkPath({
        journeySnapshot: { state: JOURNEY_STATES.WALKING },
        entryComplete: true,
      }),
    ).toBe('/journey')
  })

  it('falls back to app home when the journey is idle or complete', () => {
    expect(
      getActiveWalkPath({
        journeySnapshot: { state: JOURNEY_STATES.IDLE },
        entryComplete: true,
      }),
    ).toBe('/home')
    expect(
      getActiveWalkPath({
        journeySnapshot: { state: JOURNEY_STATES.COMPLETE },
        entryComplete: false,
      }),
    ).toBe('/setup')
  })
})
