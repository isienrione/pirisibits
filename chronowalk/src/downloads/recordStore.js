/**
 * In-memory / injectable persistence for download records.
 * Shared by web and native adapters; native additionally writes files.
 */

import {
  createDownloadRecord,
  downloadRecordHasNoSecrets,
  transitionDownloadRecord,
} from './downloadState.js'
import { downloadRegistryKey } from './downloadRegistry.js'

/**
 * @returns {{
 *   get: (key: string) => import('./downloadState.js').DownloadRecord | null,
 *   set: (key: string, record: import('./downloadState.js').DownloadRecord) => void,
 *   delete: (key: string) => void,
 *   list: () => import('./downloadState.js').DownloadRecord[],
 *   clear: () => void,
 * }}
 */
export function createMemoryRecordStore() {
  /** @type {Map<string, import('./downloadState.js').DownloadRecord>} */
  const map = new Map()
  return {
    get(key) {
      return map.get(key) ?? null
    },
    set(key, record) {
      if (!downloadRecordHasNoSecrets(record)) {
        throw new Error('Refusing to persist download record with secret fields')
      }
      map.set(key, createDownloadRecord(record))
    },
    delete(key) {
      map.delete(key)
    },
    list() {
      return [...map.values()].map((r) => createDownloadRecord(r))
    },
    clear() {
      map.clear()
    },
  }
}

/**
 * localStorage-backed store for web. Falls back to memory when unavailable.
 *
 * @param {string} [storageKey]
 */
export function createLocalStorageRecordStore(storageKey = 'cw_download_records_v1') {
  const memory = createMemoryRecordStore()

  function readAll() {
    try {
      if (typeof localStorage === 'undefined') return
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return
      for (const [key, value] of Object.entries(parsed)) {
        if (value && downloadRecordHasNoSecrets(value)) {
          memory.set(key, createDownloadRecord(value))
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
  }

  function writeAll() {
    try {
      if (typeof localStorage === 'undefined') return
      const obj = {}
      for (const record of memory.list()) {
        const key = downloadRegistryKey(record)
        obj[key] = record
      }
      localStorage.setItem(storageKey, JSON.stringify(obj))
    } catch {
      /* quota / private mode */
    }
  }

  readAll()

  return {
    get(key) {
      return memory.get(key)
    },
    set(key, record) {
      memory.set(key, record)
      writeAll()
    },
    delete(key) {
      memory.delete(key)
      writeAll()
    },
    list() {
      return memory.list()
    },
    clear() {
      memory.clear()
      writeAll()
    },
  }
}

/**
 * @param {import('./downloadState.js').DownloadRecord} record
 * @param {import('./downloadState.js').ProductDownloadStatus} next
 * @param {object} store
 * @param {Partial<import('./downloadState.js').DownloadRecord>} [patch]
 */
export function persistTransition(record, next, store, patch = {}) {
  const updated = transitionDownloadRecord(record, next, patch)
  store.set(downloadRegistryKey(updated), updated)
  return updated
}
