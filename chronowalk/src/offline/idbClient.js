import { openDB } from 'idb'
import {
  OFFLINE_DB_NAME,
  OFFLINE_DB_VERSION,
  STORES,
  upgradeOfflineDatabase,
} from './idbSchema'
import { createMemoryOfflineStore } from './memoryStore'

let dbPromise = null
let memoryStore = null
let usingMemoryFallback = false
let fallbackReason = null

export function isIndexedDbAvailable() {
  return typeof indexedDB !== 'undefined'
}

export function isUsingMemoryFallback() {
  return usingMemoryFallback
}

export function getOfflineStorageMode() {
  if (usingMemoryFallback) return 'memory'
  if (!isIndexedDbAvailable()) return 'unsupported'
  return 'indexeddb'
}

export function getOfflineStorageFallbackReason() {
  return fallbackReason
}

function wrapIdbDatabase(db) {
  return {
    kind: 'indexeddb',
    async get(storeName, key) {
      return db.get(storeName, key)
    },
    async getAll(storeName) {
      return db.getAll(storeName)
    },
    async getAllByIndex(storeName, indexName, value) {
      return db.getAllFromIndex(storeName, indexName, value)
    },
    async put(storeName, value) {
      return db.put(storeName, value)
    },
    async putMany(storeName, values) {
      const tx = db.transaction(storeName, 'readwrite')
      await Promise.all(values.map((value) => tx.store.put(value)))
      await tx.done
    },
    async delete(storeName, key) {
      return db.delete(storeName, key)
    },
    async deleteByIndex(storeName, indexName, value) {
      const matches = await db.getAllFromIndex(storeName, indexName, value)
      const tx = db.transaction(storeName, 'readwrite')
      await Promise.all(matches.map((record) => tx.store.delete(record.id ?? record.tourId)))
      await tx.done
      return matches.length
    },
    async clear(storeName) {
      return db.clear(storeName)
    },
  }
}

async function openIndexedDb() {
  return openDB(OFFLINE_DB_NAME, OFFLINE_DB_VERSION, {
    upgrade(db, oldVersion) {
      upgradeOfflineDatabase(db, oldVersion)
    },
  })
}

function activateMemoryFallback(reason) {
  usingMemoryFallback = true
  fallbackReason = reason
  if (!memoryStore) {
    memoryStore = createMemoryOfflineStore()
  }
  return memoryStore
}

export async function getOfflineStore() {
  if (!isIndexedDbAvailable()) {
    return activateMemoryFallback('indexeddb-unavailable')
  }

  if (usingMemoryFallback) {
    return memoryStore ?? activateMemoryFallback(fallbackReason)
  }

  if (!dbPromise) {
    dbPromise = openIndexedDb()
      .then((db) => wrapIdbDatabase(db))
      .catch((error) => {
        dbPromise = null
        return activateMemoryFallback(error?.message ?? 'indexeddb-open-failed')
      })
  }

  const store = await dbPromise
  if (store.kind === 'memory') {
    usingMemoryFallback = true
  }
  return store
}

export async function resetOfflineStoreForTests() {
  dbPromise = null
  usingMemoryFallback = false
  fallbackReason = null
  memoryStore = null
}
