const AUDIO_ENABLED_KEY = 'chronowalk-audio-enabled'
const DEBUG_MAP_KEY = 'chronowalk-debug-map'
const PLAYER_ICONS_KEY = 'chronowalk-player-icons'
const PLAYBACK_RATE_KEY = 'chronowalk-playback-rate'

export const PLAYBACK_RATES = [1, 1.25, 1.5, 1.75, 2]

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

export const readPlaybackRate = () => {
  if (typeof window === 'undefined') return 1
  try {
    const stored = window.localStorage.getItem(PLAYBACK_RATE_KEY)
    const parsed = stored ? Number.parseFloat(stored) : 1
    return PLAYBACK_RATES.includes(parsed) ? parsed : 1
  } catch {
    return 1
  }
}

export const writePlaybackRate = (rate) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PLAYBACK_RATE_KEY, String(rate))
  } catch {
    // ignore quota / privacy errors
  }
}
