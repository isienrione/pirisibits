import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'cw_app_prefs_v1'

const DEFAULT_PREFS = {
  backgroundPlay: true,
  wifiOnlyDownload: true,
  hapticFeedback: true,
  reduceMotion: false,
  playbackSpeed: 1,
}

function readPrefs() {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFS }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PREFS }
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
 * User-facing preferences — stored locally, wired to features incrementally.
 * UI can bind toggles here without coupling to audio/map implementations.
 */
export function useAppPreferences() {
  const [prefs, setPrefs] = useState(readPrefs)

  useEffect(() => {
    applyReduceMotionClass(prefs.reduceMotion)
  }, [prefs.reduceMotion])

  const setPref = useCallback((key, value) => {
    setPrefs((current) => {
      const next = { ...current, [key]: value }
      writePrefs(next)
      return next
    })
  }, [])

  return { prefs, setPref }
}

export function getAppPreferences() {
  return readPrefs()
}
