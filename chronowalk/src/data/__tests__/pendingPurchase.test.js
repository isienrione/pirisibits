import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearPendingProductId,
  normalizeLandingProductId,
  readPendingProductId,
  stashPendingProductId,
} from '../pendingPurchase.js'

describe('pendingPurchase', () => {
  beforeEach(() => {
    clearPendingProductId()
  })

  it('normalizes landing tier ids and aliases', () => {
    expect(normalizeLandingProductId('rome-central')).toBe('rome-central')
    expect(normalizeLandingProductId('roma-historica')).toBe('rome-central')
    expect(normalizeLandingProductId('rome-essential')).toBe('rome-essential')
    expect(normalizeLandingProductId('unknown')).toBeNull()
  })

  it('stashes and reads the pending product across session/local storage', () => {
    expect(stashPendingProductId('rome-central')).toBe('rome-central')
    expect(readPendingProductId()).toBe('rome-central')
    clearPendingProductId()
    expect(readPendingProductId()).toBeNull()
  })
})
