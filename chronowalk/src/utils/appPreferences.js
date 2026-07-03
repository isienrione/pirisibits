import { NAV_TABS } from '../components/navigation/navConfig.jsx'

const AUDIO_ENABLED_KEY = 'chronowalk-audio-enabled'
const DEBUG_MAP_KEY = 'chronowalk-debug-map'
const PLAYER_ICONS_KEY = 'chronowalk-player-icons'
const ACTIVE_TAB_KEY = 'cw_active_tab'

const VALID_V1_TABS = new Set(Object.values(NAV_TABS))

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

export const readActiveTab = (fallback = NAV_TABS.JOURNEY) => {
  if (typeof window === 'undefined') return fallback

  try {
    const stored = window.localStorage.getItem(ACTIVE_TAB_KEY)
    return VALID_V1_TABS.has(stored) ? stored : fallback
  } catch {
    return fallback
  }
}

export const writeActiveTab = (tab) => {
  if (typeof window === 'undefined') return
  if (!VALID_V1_TABS.has(tab)) return

  try {
    window.localStorage.setItem(ACTIVE_TAB_KEY, tab)
  } catch {
    // ignore quota / privacy errors
  }
}
