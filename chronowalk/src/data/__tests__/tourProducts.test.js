import { describe, expect, it } from 'vitest'
import { formatUsd, getTourIdsForProduct, TOUR_PRODUCTS } from '../tourProducts'

describe('tourProducts', () => {
  it('prices individual tours at $10 and bundle at $15', () => {
    expect(TOUR_PRODUCTS['rome-forum-cluster'].priceUsd).toBe(10)
    expect(TOUR_PRODUCTS['rome-city'].priceUsd).toBe(10)
    expect(TOUR_PRODUCTS['rome-complete'].priceUsd).toBe(15)
    expect(TOUR_PRODUCTS['rome-complete'].savingsUsd).toBe(5)
  })

  it('expands bundle to both tour ids', () => {
    expect(getTourIdsForProduct('rome-complete').sort()).toEqual([
      'rome-city',
      'rome-forum-cluster',
    ])
  })

  it('formats whole-dollar prices', () => {
    expect(formatUsd(15)).toBe('$15')
  })
})
