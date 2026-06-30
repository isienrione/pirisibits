const AUDIO_ENABLED_KEY = 'chronowalk-audio-enabled'
const DEBUG_MAP_KEY = 'chronowalk-debug-map'
const PLAYER_ICONS_KEY = 'chronowalk-player-icons'

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

export const readDebugMapPreference = () => readBool(DEBUG_MAP_KEY, false)

export const writeDebugMapPreference = (enabled) => writeBool(DEBUG_MAP_KEY, enabled)

export const readPlayerIconsPref = () => readBool(PLAYER_ICONS_KEY, false)

export const writePlayerIconsPref = (enabled) => writeBool(PLAYER_ICONS_KEY, enabled)

const PLAYBACK_SPEED_KEY = 'chronowalk-playback-speed'

export const PLAYBACK_SPEED_OPTIONS = [0.75, 1, 1.25, 1.5]

export const readPlaybackSpeed = () => {
  if (typeof window === 'undefined') return 1
  try {
    const stored = window.localStorage.getItem(PLAYBACK_SPEED_KEY)
    if (stored == null) return 1
    const value = Number.parseFloat(stored)
    return PLAYBACK_SPEED_OPTIONS.includes(value) ? value : 1
  } catch {
    return 1
  }
}

export const writePlaybackSpeed = (speed) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PLAYBACK_SPEED_KEY, String(speed))
  } catch {
    // ignore quota / privacy errors
  }
}

export const cyclePlaybackSpeed = (current = readPlaybackSpeed()) => {
  const index = PLAYBACK_SPEED_OPTIONS.indexOf(current)
  const next = PLAYBACK_SPEED_OPTIONS[(index + 1) % PLAYBACK_SPEED_OPTIONS.length]
  writePlaybackSpeed(next)
  return next
}
