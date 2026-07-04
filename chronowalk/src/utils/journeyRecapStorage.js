const STORAGE_KEY = 'chronowalk:journey-recap'

/**
 * @typedef {Object} JourneyRecapPhoto
 * @property {string} stopId
 * @property {string} capturedAt
 */

/**
 * @typedef {Object} JourneyRecapAudio
 * @property {string} stopId
 * @property {string} listenedAt
 */

/**
 * @typedef {Object} JourneyRecapJournal
 * @property {string} stopId
 * @property {string} text
 * @property {string} recordedAt
 */

/**
 * @typedef {Object} JourneyRecap
 * @property {JourneyRecapPhoto[]} photos
 * @property {JourneyRecapAudio[]} audioListened
 * @property {JourneyRecapJournal[]} journal
 */

function emptyRecap() {
  return {
    photos: [],
    audioListened: [],
    journal: [],
  }
}

/**
 * @returns {JourneyRecap}
 */
export function readJourneyRecap() {
  if (typeof window === 'undefined') return emptyRecap()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyRecap()

    const parsed = JSON.parse(raw)
    return {
      photos: Array.isArray(parsed?.photos) ? parsed.photos : [],
      audioListened: Array.isArray(parsed?.audioListened) ? parsed.audioListened : [],
      journal: Array.isArray(parsed?.journal) ? parsed.journal : [],
    }
  } catch {
    return emptyRecap()
  }
}

/**
 * @param {JourneyRecap} recap
 */
function writeJourneyRecap(recap) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recap))
  } catch {
    // ignore quota / privacy errors
  }
}

/**
 * @param {string} stopId
 */
export function recordPhotoCapture(stopId) {
  if (!stopId) return

  const recap = readJourneyRecap()
  if (recap.photos.some((entry) => entry.stopId === stopId)) return

  recap.photos.push({
    stopId,
    capturedAt: new Date().toISOString(),
  })

  writeJourneyRecap(recap)
}

/**
 * @param {string} stopId
 */
export function recordAudioListened(stopId) {
  if (!stopId) return

  const recap = readJourneyRecap()
  if (recap.audioListened.some((entry) => entry.stopId === stopId)) return

  recap.audioListened.push({
    stopId,
    listenedAt: new Date().toISOString(),
  })

  writeJourneyRecap(recap)
}

/**
 * @param {string} stopId
 * @param {string} text
 */
export function recordJournalReflection(stopId, text) {
  if (!stopId || !text?.trim()) return

  const recap = readJourneyRecap()
  if (recap.journal.some((entry) => entry.stopId === stopId)) return

  recap.journal.push({
    stopId,
    text: text.trim(),
    recordedAt: new Date().toISOString(),
  })

  writeJourneyRecap(recap)
}

/**
 * @param {string} stopId
 * @param {JourneyRecap} [recap]
 */
export function hasPhotoCapture(stopId, recap = readJourneyRecap()) {
  return recap.photos.some((entry) => entry.stopId === stopId)
}

/**
 * @param {string} stopId
 * @param {JourneyRecap} [recap]
 */
export function hasAudioListened(stopId, recap = readJourneyRecap()) {
  return recap.audioListened.some((entry) => entry.stopId === stopId)
}

/**
 * @param {string} stopId
 * @param {JourneyRecap} [recap]
 */
export function hasJournalReflection(stopId, recap = readJourneyRecap()) {
  return recap.journal.some((entry) => entry.stopId === stopId)
}

export function getJourneyRecapStorageKey() {
  return STORAGE_KEY
}
