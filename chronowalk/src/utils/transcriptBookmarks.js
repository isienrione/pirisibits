const STORAGE_KEY = 'chronowalk:transcript-bookmarks'

function readStore() {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore quota / privacy errors
  }
}

/**
 * @param {string} stopId
 * @returns {string[]}
 */
export function readTranscriptBookmarks(stopId) {
  if (!stopId) return []
  const store = readStore()
  const bookmarks = store[stopId]
  return Array.isArray(bookmarks) ? bookmarks : []
}

/**
 * @param {string} stopId
 * @param {string} paragraphId
 * @returns {string[]}
 */
export function toggleTranscriptBookmark(stopId, paragraphId) {
  if (!stopId || !paragraphId) return []

  const store = readStore()
  const current = new Set(readTranscriptBookmarks(stopId))

  if (current.has(paragraphId)) {
    current.delete(paragraphId)
  } else {
    current.add(paragraphId)
  }

  const next = [...current]
  store[stopId] = next
  writeStore(store)
  return next
}

export function getTranscriptBookmarkStorageKey() {
  return STORAGE_KEY
}
