import { STORES } from './idbSchema'

export function createMemoryOfflineStore() {
  const tables = Object.fromEntries(Object.values(STORES).map((name) => [name, new Map()]))

  return {
  kind: 'memory',
  async get(storeName, key) {
    return tables[storeName]?.get(key) ?? undefined
  },
  async getAll(storeName) {
    return Array.from(tables[storeName]?.values() ?? [])
  },
  async getAllByIndex(storeName, indexName, value) {
    return (await this.getAll(storeName)).filter((record) => record?.[indexName] === value)
  },
  async put(storeName, value) {
    const keyPath = storeName === STORES.TOURS || storeName === STORES.USER_PROGRESS || storeName === STORES.TOUR_PACKAGES
      ? 'tourId'
      : 'id'
    const key = value?.[keyPath]
    if (key == null) throw new Error(`Missing key for ${storeName}`)
    tables[storeName].set(key, value)
    return value
  },
  async putMany(storeName, values) {
    for (const value of values) {
      await this.put(storeName, value)
    }
  },
  async delete(storeName, key) {
    tables[storeName]?.delete(key)
  },
  async deleteByIndex(storeName, indexName, value) {
    const matches = await this.getAllByIndex(storeName, indexName, value)
    for (const record of matches) {
      const key = record.id ?? record.tourId
      if (key != null) tables[storeName].delete(key)
    }
    return matches.length
  },
  async clear(storeName) {
    tables[storeName]?.clear()
  },
  }
}
