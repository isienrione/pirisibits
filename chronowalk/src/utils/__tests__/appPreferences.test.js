import { beforeEach, describe, expect, it } from 'vitest'
import {
  cyclePlaybackSpeed,
  readAudioEnabled,
  readDebugMapPreference,
  readPlaybackSpeed,
  readPlayerIconsPref,
  writeAudioEnabled,
  writeDebugMapPreference,
  writePlaybackSpeed,
  writePlayerIconsPref,
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

  it('persists and cycles playback speed', () => {
    expect(readPlaybackSpeed()).toBe(1)
    writePlaybackSpeed(1.25)
    expect(readPlaybackSpeed()).toBe(1.25)
    expect(cyclePlaybackSpeed(1.25)).toBe(1.5)
    expect(readPlaybackSpeed()).toBe(1.5)
  })
})
