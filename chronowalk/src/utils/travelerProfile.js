const STORAGE_KEY = 'chronowalk:traveler-name'

/**
 * @returns {string}
 */
export function readTravelerName() {
  if (typeof window === 'undefined') return 'Traveler'

  try {
    const name = window.localStorage.getItem(STORAGE_KEY)?.trim()
    return name || 'Traveler'
  } catch {
    return 'Traveler'
  }
}

/**
 * @param {string | null | undefined} name
 */
export function writeTravelerName(name) {
  if (typeof window === 'undefined') return

  try {
    const trimmed = name?.trim()
    if (!trimmed) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }
    window.localStorage.setItem(STORAGE_KEY, trimmed)
  } catch {
    // ignore quota / privacy errors
  }
}

export function getTravelerNameStorageKey() {
  return STORAGE_KEY
}
