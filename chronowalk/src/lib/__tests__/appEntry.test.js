import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAppEntryComplete,
  getAppHomePath,
  isAppEntryComplete,
  markAppEntryComplete,
  packTitleForPurchasedTier,
} from '../appEntry.js'

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

  it('routes into setup until entry is complete', () => {
    expect(getAppHomePath({ resumable: false, entryComplete: false })).toBe('/setup')
    expect(getAppHomePath({ resumable: false, entryComplete: true })).toBe('/begin')
    expect(getAppHomePath({ resumable: true, entryComplete: false })).toBe('/begin')
  })
})
