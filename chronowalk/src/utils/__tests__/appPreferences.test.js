import { beforeEach, describe, expect, it } from 'vitest'
import {
  readActiveTab,
  readAudioEnabled,
  readDebugMapPreference,
  readPlayerIconsPref,
  writeActiveTab,
  writeAudioEnabled,
  writeDebugMapPreference,
  writePlayerIconsPref,
} from '../appPreferences'
import { NAV_TABS } from '../../components/navigation/navConfig'

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

  it('defaults active tab to journey when unset', () => {
    expect(readActiveTab()).toBe(NAV_TABS.JOURNEY)
  })

  it('persists active tab', () => {
    writeActiveTab(NAV_TABS.MAP)
    expect(readActiveTab()).toBe(NAV_TABS.MAP)
  })
})
