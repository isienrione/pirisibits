import { beforeEach, describe, expect, it } from 'vitest'
import {
  cycleAudioSpeed,
  readAudioEnabled,
  readAudioSpeed,
  readDebugMapPreference,
  readPlayerIconsPref,
  writeAudioEnabled,
  writeAudioSpeed,
  writeDebugMapPreference,
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

  it('defaults story playback speed to 1x', () => {
    expect(readAudioSpeed()).toBe(1)
  })

  it('persists and cycles story playback speed', () => {
    writeAudioSpeed(1.5)
    expect(readAudioSpeed()).toBe(1.5)
    expect(cycleAudioSpeed(1.5)).toBe(2)
    expect(readAudioSpeed()).toBe(2)
  })
})
