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
    const result = purchaseTourProduct('roman-forum')
    expect(result.ok).toBe(true)
    expect(readOwnedTourIds()).toEqual(['roman-forum'])
    expect(ownsTour('roman-forum')).toBe(true)
    expect(ownsTour('heart-of-ancient-rome')).toBe(false)
  })

  it('migrates legacy tour ids from earlier builds', () => {
    window.localStorage.setItem(
      'chronowalk-owned-tours',
      JSON.stringify(['rome-forum-cluster', 'rome-city'])
    )
    expect(readOwnedTourIds().sort()).toEqual(['heart-of-ancient-rome', 'roman-forum'])
  })

  it('unlocks both tours after bundle purchase', () => {
    purchaseTourProduct('rome-complete')
    expect(readOwnedTourIds().sort()).toEqual(['heart-of-ancient-rome', 'roman-forum'])
    expect(ownsTour('roman-forum')).toBe(true)
    expect(ownsTour('heart-of-ancient-rome')).toBe(true)
  })
})
