import { beforeEach, describe, expect, it } from 'vitest'
import { setActiveLocale } from '../../i18n/activeLocale.js'
import { LOCALES } from '../../i18n/locales.js'
import {
  cycleAudioSpeed,
  defaultAudioSpeedForLocale,
  readAudioEnabled,
  readAudioSpeed,
  readDebugMapPreference,
  readHapticsEnabled,
  readNotificationsEnabled,
  readPlayerIconsPref,
  syncAudioSpeedForLocaleChange,
  writeAudioEnabled,
  writeAudioSpeed,
  writeDebugMapPreference,
  writeHapticsEnabled,
  writeNotificationsEnabled,
  writePlayerIconsPref,
} from '../appPreferences'

describe('appPreferences', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActiveLocale(LOCALES.EN)
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

  it('defaults story playback speed to 1.2x in English', () => {
    setActiveLocale(LOCALES.EN)
    expect(defaultAudioSpeedForLocale(LOCALES.EN)).toBe(1.2)
    expect(readAudioSpeed()).toBe(1.2)
  })

  it('defaults story playback speed to 1x in Spanish', () => {
    setActiveLocale(LOCALES.ES)
    expect(defaultAudioSpeedForLocale(LOCALES.ES)).toBe(1)
    expect(readAudioSpeed()).toBe(1)
  })

  it('persists and cycles story playback speed', () => {
    writeAudioSpeed(1.5)
    expect(readAudioSpeed()).toBe(1.5)
    expect(cycleAudioSpeed(1.5)).toBe(2)
    expect(readAudioSpeed()).toBe(2)
  })

  it('moves default speed when locale flips and preference was unset', () => {
    setActiveLocale(LOCALES.EN)
    expect(readAudioSpeed()).toBe(1.2)

    setActiveLocale(LOCALES.ES)
    expect(syncAudioSpeedForLocaleChange(LOCALES.EN, LOCALES.ES)).toBe(1)
    expect(readAudioSpeed()).toBe(1)

    expect(syncAudioSpeedForLocaleChange(LOCALES.ES, LOCALES.EN)).toBe(1.2)
    expect(readAudioSpeed()).toBe(1.2)
  })

  it('keeps a custom speed across locale changes', () => {
    writeAudioSpeed(1.5)
    expect(syncAudioSpeedForLocaleChange(LOCALES.EN, LOCALES.ES)).toBe(1.5)
    expect(readAudioSpeed()).toBe(1.5)
  })

  it('persists notification and haptics preferences', () => {
    expect(readNotificationsEnabled()).toBe(true)
    expect(readHapticsEnabled()).toBe(true)

    writeNotificationsEnabled(false)
    writeHapticsEnabled(false)

    expect(readNotificationsEnabled()).toBe(false)
    expect(readHapticsEnabled()).toBe(false)
  })
})
