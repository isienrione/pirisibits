import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyTextSizePreference,
  readAudioEnabled,
  readAudioSpeed,
  readDebugMapPreference,
  readPlayerIconsPref,
  readTextSize,
  writeAudioEnabled,
  writeAudioSpeed,
  writeDebugMapPreference,
  writePlayerIconsPref,
  writeTextSize,
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

  it('defaults audio speed to 1x when unset', () => {
    expect(readAudioSpeed()).toBe(1)
  })

  it('persists audio speed preference', () => {
    writeAudioSpeed(1.25)
    expect(readAudioSpeed()).toBe(1.25)
  })

  it('persists text size preference and applies scale', () => {
    writeTextSize('large')
    expect(readTextSize()).toBe('large')
    expect(document.documentElement.style.fontSize).toBe('112%')
    applyTextSizePreference('default')
    expect(document.documentElement.style.fontSize).toBe('100%')
  })
})
