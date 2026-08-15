import { useCallback, useEffect, useState } from 'react'
import { getActiveLocale } from '../i18n/activeLocale.js'
import {
  PREFERENCES_CHANGED_EVENT,
  defaultAudioSpeedForLocale,
  readAudioSpeed,
  writeAudioSpeed,
} from '../utils/appPreferences.js'

const STORAGE_KEY = 'cw_app_prefs_v1'

export const SETTINGS_PLAYBACK_SPEEDS = [0.8, 1, 1.2, 1.5, 2]
export const TEXT_SIZE_OPTIONS = ['sm', 'md', 'lg']

const DEFAULT_PREFS = {
  backgroundPlay: true,
  wifiOnlyDownload: true,
  hapticFeedback: true,
  reduceMotion: false,
  playbackSpeed: 1.2,
  preferTranscript: false,
  textSize: 'md',
}

export function transcriptFontSizePx(textSize = 'md') {
  if (textSize === 'sm') return 14
  if (textSize === 'lg') return 18
  return 16
}

function normalizePlaybackSpeed(speed) {
  const numeric = Number(speed)
  return SETTINGS_PLAYBACK_SPEEDS.includes(numeric)
    ? numeric
    : defaultAudioSpeedForLocale(getActiveLocale())
}

function normalizeTextSize(textSize) {
  return TEXT_SIZE_OPTIONS.includes(textSize) ? textSize : 'md'
}

function readPrefs() {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFS }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const stored = raw ? JSON.parse(raw) : {}
    const audioSpeed = readAudioSpeed()
    const playbackSpeed = SETTINGS_PLAYBACK_SPEEDS.includes(audioSpeed)
      ? audioSpeed
      : normalizePlaybackSpeed(stored.playbackSpeed)

    return {
      ...DEFAULT_PREFS,
      ...stored,
      playbackSpeed,
      preferTranscript: Boolean(stored.preferTranscript),
      textSize: normalizeTextSize(stored.textSize),
    }
  } catch {
    return { ...DEFAULT_PREFS, playbackSpeed: readAudioSpeed() }
  }
}

function writePrefs(next) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function applyReduceMotionClass(enabled) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('cw-reduce-motion', enabled)
}

/**
 * User-facing preferences - stored locally, wired to features incrementally.
 */
export function useAppPreferences() {
  const [prefs, setPrefs] = useState(readPrefs)

  useEffect(() => {
    applyReduceMotionClass(prefs.reduceMotion)
  }, [prefs.reduceMotion])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const syncFromAudioSpeed = () => {
      setPrefs((current) => {
        const nextSpeed = readAudioSpeed()
        if (!SETTINGS_PLAYBACK_SPEEDS.includes(nextSpeed) || current.playbackSpeed === nextSpeed) {
          return current
        }
        return { ...current, playbackSpeed: nextSpeed }
      })
    }

    window.addEventListener(PREFERENCES_CHANGED_EVENT, syncFromAudioSpeed)
    return () => window.removeEventListener(PREFERENCES_CHANGED_EVENT, syncFromAudioSpeed)
  }, [])

  const setPref = useCallback((key, value) => {
    setPrefs((current) => {
      let nextValue = value
      if (key === 'playbackSpeed') {
        nextValue = normalizePlaybackSpeed(value)
        writeAudioSpeed(nextValue)
      }
      if (key === 'textSize') {
        nextValue = normalizeTextSize(value)
      }
      if (key === 'preferTranscript') {
        nextValue = Boolean(value)
      }

      const next = { ...current, [key]: nextValue }
      writePrefs(next)
      return next
    })
  }, [])

  return { prefs, setPref }
}

export function getAppPreferences() {
  return readPrefs()
}
