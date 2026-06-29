import { beforeEach, describe, expect, it } from 'vitest'
import {
  readAudioEnabled,
  readDebugMapPreference,
  readPlayerIconsPref,
  readReviewPrompted,
  writeAudioEnabled,
  writeDebugMapPreference,
  writePlayerIconsPref,
  writeReviewPrompted,
} from '../appPreferences'

describe('appPreferences', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('defaults audio to enabled when unset', () => {
    expect(readAudioEnabled()).toBe(true)
  })

  it('persists audio preference', () => {
    writeAudioEnabled(false)
    expect(readAudioEnabled()).toBe(false)
    writeAudioEnabled(true)
    expect(readAudioEnabled()).toBe(true)
  })

  it('defaults debug map to disabled when unset', () => {
    expect(readDebugMapPreference()).toBe(false)
  })

  it('persists debug map preference', () => {
    writeDebugMapPreference(true)
    expect(readDebugMapPreference()).toBe(true)
    writeDebugMapPreference(false)
    expect(readDebugMapPreference()).toBe(false)
  })

  it('persists player icon preference', () => {
    expect(readPlayerIconsPref()).toBe(false)
    writePlayerIconsPref(true)
    expect(readPlayerIconsPref()).toBe(true)
  })

  it('defaults review prompt to not shown when unset', () => {
    expect(readReviewPrompted()).toBe(false)
  })

  it('persists review prompt preference', () => {
    writeReviewPrompted(true)
    expect(readReviewPrompted()).toBe(true)
    writeReviewPrompted(false)
    expect(readReviewPrompted()).toBe(false)
  })
})
