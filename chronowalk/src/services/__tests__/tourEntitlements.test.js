import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearTourEntitlements,
  ownsTour,
  purchaseTourProduct,
  readOwnedTourIds,
} from '../tourEntitlements'

describe('tourEntitlements', () => {
  beforeEach(() => {
    clearTourEntitlements()
    const store = {}
    window.localStorage = {
      getItem(key) {
        return store[key] ?? null
      },
      setItem(key, value) {
        store[key] = value
      },
      removeItem(key) {
        delete store[key]
      },
    }
  })

  it('unlocks forum cluster tour after single purchase', () => {
    const result = purchaseTourProduct('rome-forum-cluster')
    expect(result.ok).toBe(true)
    expect(readOwnedTourIds()).toEqual(['rome-forum-cluster'])
    expect(ownsTour('rome-forum-cluster')).toBe(true)
    expect(ownsTour('rome-city')).toBe(false)
  })

  it('unlocks both tours after bundle purchase', () => {
    purchaseTourProduct('rome-complete')
    expect(readOwnedTourIds().sort()).toEqual(['rome-city', 'rome-forum-cluster'])
    expect(ownsTour('rome-forum-cluster')).toBe(true)
    expect(ownsTour('rome-city')).toBe(true)
  })
})
