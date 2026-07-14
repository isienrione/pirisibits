import { beforeEach, describe, expect, it } from 'vitest'
import { JOURNEY_PACE } from '../romePacing.js'
import {
  getPurchasedPackageOption,
  resolvePurchasedPace,
  resolvePurchasedProductId,
} from '../purchasedPackage.js'
import { clearTourEntitlements, purchaseTourProduct } from '../../services/tourEntitlements.js'

describe('purchasedPackage', () => {
  beforeEach(() => {
    clearTourEntitlements()
  })

  it('defaults to Rome Complete when nothing is stored', () => {
    expect(resolvePurchasedProductId([])).toBe('rome-complete')
    expect(resolvePurchasedPace([])).toBe(JOURNEY_PACE.HEROIC)
  })

  it('resolves Roma Antica / centro storico packages from purchases', () => {
    purchaseTourProduct('rome-essential')
    expect(resolvePurchasedProductId()).toBe('rome-essential')
    expect(resolvePurchasedPace()).toBe(JOURNEY_PACE.CLASSIC)
    expect(getPurchasedPackageOption().title).toBe('Roma Antica')

    clearTourEntitlements()
    purchaseTourProduct('rome-central')
    expect(resolvePurchasedProductId()).toBe('rome-central')
    expect(getPurchasedPackageOption().title).toBe('Roma Historica')
  })

  it('prefers complete when multiple packages are owned', () => {
    purchaseTourProduct('rome-central')
    purchaseTourProduct('rome-complete')
    expect(resolvePurchasedProductId()).toBe('rome-complete')
  })
})
