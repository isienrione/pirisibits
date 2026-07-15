import { beforeEach, describe, expect, it } from 'vitest'
import { grantAccess, revokeAccess } from '../config.js'
import { stashPendingProductId, clearPendingProductId } from '../../data/pendingPurchase.js'
import {
  clearTourEntitlements,
  readPurchasedProductIds,
} from '../../services/tourEntitlements.js'

describe('grantAccess product scoping', () => {
  beforeEach(() => {
    revokeAccess()
    clearTourEntitlements()
    clearPendingProductId()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('records an explicit landing tier and replaces a prior complete default', () => {
    grantAccess('rome-complete')
    expect(readPurchasedProductIds()).toEqual(['rome-complete'])

    grantAccess('rome-central')
    expect(readPurchasedProductIds()).toEqual(['rome-central'])
  })

  it('uses a pending tier stashed from landing when product_id is omitted', () => {
    stashPendingProductId('rome-essential')
    grantAccess()
    expect(readPurchasedProductIds()).toEqual(['rome-essential'])
  })
})
