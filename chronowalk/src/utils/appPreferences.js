const AUDIO_ENABLED_KEY = 'chronowalk-audio-enabled'
const DEBUG_MAP_KEY = 'chronowalk-debug-map'
const PLAYER_ICONS_KEY = 'chronowalk-player-icons'
const AUDIO_SPEED_KEY = 'chronowalk-audio-speed'
const TEXT_SIZE_KEY = 'chronowalk-text-size'

export const PREFERENCES_CHANGED_EVENT = 'chronowalk:preferences-changed'

export const AUDIO_SPEED_OPTIONS = [0.75, 1, 1.25]

export const TEXT_SIZE_OPTIONS = {
  default: { label: 'Default', scalePercent: 100 },
  large: { label: 'Large', scalePercent: 112 },
}

const dispatchPreferencesChanged = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(PREFERENCES_CHANGED_EVENT))
}

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

export const readAudioSpeed = () => {
  if (typeof window === 'undefined') return 1
  try {
    const raw = window.localStorage.getItem(AUDIO_SPEED_KEY)
    const parsed = raw ? Number.parseFloat(raw) : 1
    return AUDIO_SPEED_OPTIONS.includes(parsed) ? parsed : 1
  } catch {
    return 1
  }
}

export const writeAudioSpeed = (speed) => {
  if (typeof window === 'undefined') return
  const normalized = AUDIO_SPEED_OPTIONS.includes(speed) ? speed : 1
  try {
    window.localStorage.setItem(AUDIO_SPEED_KEY, String(normalized))
    dispatchPreferencesChanged()
  } catch {
    // ignore quota / privacy errors
  }
}

export const readTextSize = () => {
  if (typeof window === 'undefined') return 'default'
  try {
    const raw = window.localStorage.getItem(TEXT_SIZE_KEY)
    return raw && raw in TEXT_SIZE_OPTIONS ? raw : 'default'
  } catch {
    return 'default'
  }
}

export const writeTextSize = (size) => {
  if (typeof window === 'undefined') return
  const normalized = size in TEXT_SIZE_OPTIONS ? size : 'default'
  try {
    window.localStorage.setItem(TEXT_SIZE_KEY, normalized)
    applyTextSizePreference(normalized)
    dispatchPreferencesChanged()
  } catch {
    // ignore quota / privacy errors
  }
}

export const applyTextSizePreference = (size = readTextSize()) => {
  if (typeof document === 'undefined') return
  const scale = TEXT_SIZE_OPTIONS[size]?.scalePercent ?? TEXT_SIZE_OPTIONS.default.scalePercent
  document.documentElement.style.fontSize = `${scale}%`
}
