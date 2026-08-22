import type { KeyValueStore } from './persistence'

export function createMemoryStore(seed: Record<string, string> = {}): KeyValueStore {
  const data = { ...seed }
  return {
    async getItem(key) {
      return data[key] ?? null
    },
    async setItem(key, value) {
      data[key] = value
    },
  }
}

export function nativeStore(): KeyValueStore | null {
  try {
    // Lazy require so unit tests do not load React Native storage.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-async-storage/async-storage')
    const AsyncStorage = mod.default ?? mod
    return {
      getItem: (key) => AsyncStorage.getItem(key),
      setItem: (key, value) => AsyncStorage.setItem(key, value),
    }
  } catch {
    return null
  }
}
