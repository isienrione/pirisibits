const AUDIO_ENABLED_KEY = 'chronowalk-audio-enabled'
const AUDIO_SPEED_KEY = 'chronowalk-audio-speed'
const DEBUG_MAP_KEY = 'chronowalk-debug-map'
const PLAYER_ICONS_KEY = 'chronowalk-player-icons'
const NOTIFICATIONS_KEY = 'chronowalk:notifications'
const HAPTICS_KEY = 'chronowalk:haptics-enabled'
const APP_PREFS_KEY = 'cw_app_prefs_v1'

export const STORY_PLAYBACK_SPEEDS = [0.8, 1, 1.2, 1.25, 1.5, 2]
export const PREFERENCES_CHANGED_EVENT = 'chronowalk:preferences-changed'

const readBool = (key, fallback = false) => {
  if (typeof window === 'undefined') return fallback
  try {
    return window.localStorage.getItem(key) === 'true'
  } catch {
    return fallback
  }
}

const writeBool = (key, value) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value ? 'true' : 'false')
  } catch {
    // ignore quota / privacy errors
  }
}

export const readAudioEnabled = () => {
  if (typeof window === 'undefined') return true
  const stored = window.localStorage.getItem(AUDIO_ENABLED_KEY)
  if (stored === null) return true
  return stored === 'true'
}

export const writeAudioEnabled = (enabled) => writeBool(AUDIO_ENABLED_KEY, enabled)

export const readAudioSpeed = () => {
  if (typeof window === 'undefined') return 1

  try {
    const speed = Number(window.localStorage.getItem(AUDIO_SPEED_KEY))
    return STORY_PLAYBACK_SPEEDS.includes(speed) ? speed : 1
  } catch {
    return 1
  }
}

export const writeAudioSpeed = (speed) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(AUDIO_SPEED_KEY, String(speed))
    window.dispatchEvent(new CustomEvent(PREFERENCES_CHANGED_EVENT))
  } catch {
    // ignore quota / privacy errors
  }
}

export const cycleAudioSpeed = (current = readAudioSpeed()) => {
  const index = STORY_PLAYBACK_SPEEDS.indexOf(current)
  const next = STORY_PLAYBACK_SPEEDS[(index + 1) % STORY_PLAYBACK_SPEEDS.length]
  writeAudioSpeed(next)
  return next
}

export const readDebugMapPreference = () => readBool(DEBUG_MAP_KEY, false)

export const writeDebugMapPreference = (enabled) => writeBool(DEBUG_MAP_KEY, enabled)

export const readPlayerIconsPref = () => readBool(PLAYER_ICONS_KEY, false)

export const writePlayerIconsPref = (enabled) => writeBool(PLAYER_ICONS_KEY, enabled)

export const readNotificationsEnabled = () => {
  if (typeof window === 'undefined') return true
  const stored = window.localStorage.getItem(NOTIFICATIONS_KEY)
  if (stored === null) return true
  return stored === 'true'
}

export const writeNotificationsEnabled = (enabled) => {
  writeBool(NOTIFICATIONS_KEY, enabled)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PREFERENCES_CHANGED_EVENT))
  }
}

export const readHapticsEnabled = () => {
  if (typeof window === 'undefined') return true
  const stored = window.localStorage.getItem(HAPTICS_KEY)
  if (stored === null) return true
  return stored === 'true'
}

export const writeHapticsEnabled = (enabled) => {
  writeBool(HAPTICS_KEY, enabled)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PREFERENCES_CHANGED_EVENT))
  }
}

export function formatPlaybackSpeed(speed) {
  return Number.isInteger(speed) ? `${speed}×` : `${speed}×`
}

/** Keep narration alive when the browser is backgrounded / screen locks (default on). */
export const readBackgroundPlay = () => {
  if (typeof window === 'undefined') return true
  try {
    const raw = window.localStorage.getItem(APP_PREFS_KEY)
    if (!raw) return true
    const stored = JSON.parse(raw)
    return stored.backgroundPlay !== false
  } catch {
    return true
  }
}
