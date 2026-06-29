const AUDIO_ENABLED_KEY = 'chronowalk-audio-enabled'
const DEBUG_MAP_KEY = 'chronowalk-debug-map'
const PLAYER_ICONS_KEY = 'chronowalk-player-icons'
const ACQUISITION_SOURCE_KEY = 'chronowalk-acquisition-source'
const FIRST_ARRIVAL_TRACKED_KEY = 'chronowalk-first-arrival-tracked'

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

export const readAcquisitionSource = () => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(ACQUISITION_SOURCE_KEY)
  } catch {
    return null
  }
}

export const writeAcquisitionSource = (source) => {
  if (!source || typeof window === 'undefined') return
  try {
    if (window.localStorage.getItem(ACQUISITION_SOURCE_KEY)) return
    window.localStorage.setItem(ACQUISITION_SOURCE_KEY, source)
  } catch {
    // ignore quota / privacy errors
  }
}

/** Persist utm_source / via from the first landing URL. */
export const resolveAcquisitionSource = () => {
  if (typeof window === 'undefined') return null

  const existing = readAcquisitionSource()
  if (existing) return existing

  const params = new URLSearchParams(window.location.search)
  const source = params.get('utm_source') || params.get('via')
  if (!source) return null

  writeAcquisitionSource(source)
  return source
}

export const readFirstArrivalTracked = () => readBool(FIRST_ARRIVAL_TRACKED_KEY, false)

export const writeFirstArrivalTracked = (tracked) => writeBool(FIRST_ARRIVAL_TRACKED_KEY, tracked)
