import { openDB } from 'idb'
import { downloadCapture } from './overlayCapture.js'

const DB_NAME = 'chronowalk-journal-memories'
const DB_VERSION = 1
const STORE = 'memories'

/** @type {import('idb').IDBPDatabase | null} */
let dbPromise = null
/** In-memory fallback when IndexedDB is unavailable (tests / private mode). */
const memoryMap = new Map()
let useMemory = false

/**
 * @typedef {Object} JournalMemoryRecord
 * @property {string} waypointId
 * @property {string} note
 * @property {string | null} noteUpdatedAt
 * @property {Blob | null} photoBlob
 * @property {string | null} photoMimeType
 * @property {string | null} photoUpdatedAt
 */

function emptyRecord(waypointId) {
  return {
    waypointId,
    note: '',
    noteUpdatedAt: null,
    photoBlob: null,
    photoMimeType: null,
    photoUpdatedAt: null,
  }
}

async function openJournalDb() {
  if (useMemory) return null
  if (typeof indexedDB === 'undefined') {
    useMemory = true
    return null
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'waypointId' })
        }
      },
    }).catch(() => {
      useMemory = true
      dbPromise = null
      return null
    })
  }
  return dbPromise
}

/**
 * @param {string} waypointId
 * @returns {Promise<JournalMemoryRecord>}
 */
export async function getJournalMemory(waypointId) {
  if (!waypointId) return emptyRecord('')
  const db = await openJournalDb()
  if (!db || useMemory) {
    return memoryMap.get(waypointId) ?? emptyRecord(waypointId)
  }
  const record = await db.get(STORE, waypointId)
  return record ?? emptyRecord(waypointId)
}

/**
 * @returns {Promise<JournalMemoryRecord[]>}
 */
export async function listJournalMemories() {
  const db = await openJournalDb()
  if (!db || useMemory) {
    return Array.from(memoryMap.values())
  }
  return db.getAll(STORE)
}

/**
 * @param {string} waypointId
 * @param {string} note
 * @returns {Promise<JournalMemoryRecord>}
 */
export async function saveJournalNote(waypointId, note) {
  if (!waypointId) throw new Error('waypointId required')
  const existing = await getJournalMemory(waypointId)
  const next = {
    ...existing,
    waypointId,
    note: String(note ?? '').trim(),
    noteUpdatedAt: new Date().toISOString(),
  }
  await putRecord(next)
  return next
}

/**
 * @param {string} waypointId
 * @param {Blob | File} blob
 * @param {{ saveToDevice?: boolean, stopLabel?: string }} [options]
 * @returns {Promise<{ record: JournalMemoryRecord, deviceSave: 'share' | 'download' | 'cancelled' | 'skipped' | 'error' }>}
 */
export async function saveJournalPhoto(waypointId, blob, options = {}) {
  if (!waypointId) throw new Error('waypointId required')
  if (!blob) throw new Error('photo blob required')

  const normalized = await normalizePhotoBlob(blob)
  const existing = await getJournalMemory(waypointId)
  const next = {
    ...existing,
    waypointId,
    photoBlob: normalized,
    photoMimeType: normalized.type || 'image/jpeg',
    photoUpdatedAt: new Date().toISOString(),
  }
  await putRecord(next)

  let deviceSave = 'skipped'
  if (options.saveToDevice !== false) {
    const slug = String(options.stopLabel || waypointId)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40)
    const ext = (normalized.type || '').includes('png') ? 'png' : 'jpg'
    deviceSave = await savePhotoToDevice(normalized, `chronowalk-${slug || 'stop'}.${ext}`)
  }

  return { record: next, deviceSave }
}

/**
 * @param {string} waypointId
 * @returns {Promise<JournalMemoryRecord>}
 */
export async function clearJournalPhoto(waypointId) {
  const existing = await getJournalMemory(waypointId)
  const next = {
    ...existing,
    waypointId,
    photoBlob: null,
    photoMimeType: null,
    photoUpdatedAt: null,
  }
  await putRecord(next)
  return next
}

/**
 * Persist a photo to the device gallery / Downloads when the platform allows it.
 * On iOS/Android, the share sheet is the reliable path to “Save Image”.
 * @param {Blob} blob
 * @param {string} filename
 * @returns {Promise<'share' | 'download' | 'cancelled' | 'error'>}
 */
export async function savePhotoToDevice(blob, filename) {
  const type = blob.type || 'image/jpeg'
  const file = new File([blob], filename, { type })

  try {
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: filename })
      return 'share'
    }
  } catch (error) {
    if (error?.name === 'AbortError') return 'cancelled'
  }

  try {
    downloadCapture(blob, filename)
    return 'download'
  } catch {
    return 'error'
  }
}

/**
 * Shrink oversized camera/library images so IndexedDB stays within quota.
 * @param {Blob | File} blob
 * @returns {Promise<Blob>}
 */
export async function normalizePhotoBlob(blob) {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return blob
  }

  try {
    const bitmap = await createImageBitmap(blob)
    const maxEdge = 1600
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    if (scale >= 0.98 && blob.size < 1_200_000) {
      bitmap.close?.()
      return blob
    }

    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      return blob
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const jpeg = await new Promise((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.86)
    })
    return jpeg instanceof Blob ? jpeg : blob
  } catch {
    return blob
  }
}

/**
 * @param {JournalMemoryRecord} record
 */
async function putRecord(record) {
  const db = await openJournalDb()
  if (!db || useMemory) {
    memoryMap.set(record.waypointId, record)
    return
  }
  await db.put(STORE, record)
}

/** Test helper: wipe memories and reset connection state. */
export async function resetJournalMemoryStorageForTests() {
  memoryMap.clear()
  useMemory = false
  if (dbPromise) {
    try {
      const db = await dbPromise
      db?.close?.()
    } catch {
      // ignore
    }
  }
  dbPromise = null
  if (typeof indexedDB !== 'undefined') {
    try {
      await new Promise((resolve) => {
        const req = indexedDB.deleteDatabase(DB_NAME)
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
        req.onblocked = () => resolve()
      })
    } catch {
      // ignore
    }
  }
}

export function forceJournalMemoryFallbackForTests() {
  useMemory = true
  dbPromise = null
}

export function getJournalMemoryDbName() {
  return DB_NAME
}
