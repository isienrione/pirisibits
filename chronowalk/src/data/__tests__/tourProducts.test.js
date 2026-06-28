import { describe, expect, it } from 'vitest'
import { formatUsd, getTourIdsForProduct, TOUR_PRODUCT_LIST, TOUR_PRODUCTS } from '../tourProducts'

describe('tourProducts', () => {
  it('names the two purchasable tours correctly', () => {
    expect(TOUR_PRODUCTS['roman-forum'].title).toBe('Roman Forum')
    expect(TOUR_PRODUCTS['heart-of-ancient-rome'].title).toBe('Heart of Ancient Rome')
    expect(TOUR_PRODUCTS['roman-forum'].stopIds).toHaveLength(8)
    expect(TOUR_PRODUCTS['heart-of-ancient-rome'].stopIds.length).toBeGreaterThan(8)
  })

  it('prices individual tours at $10 and bundle at $15', () => {
    expect(TOUR_PRODUCTS['roman-forum'].priceUsd).toBe(10)
    expect(TOUR_PRODUCTS['heart-of-ancient-rome'].priceUsd).toBe(10)
    expect(TOUR_PRODUCTS['rome-complete'].priceUsd).toBe(15)
    expect(TOUR_PRODUCTS['rome-complete'].savingsUsd).toBe(5)
  })

  it('expands bundle to both tour ids', () => {
    expect(getTourIdsForProduct('rome-complete').sort()).toEqual([
      'heart-of-ancient-rome',
      'roman-forum',
    ])
  })

  it('lists the bundle before individual tours', () => {
    expect(TOUR_PRODUCT_LIST[0].id).toBe('rome-complete')
    expect(TOUR_PRODUCT_LIST[1].id).toBe('roman-forum')
    expect(TOUR_PRODUCT_LIST[2].id).toBe('heart-of-ancient-rome')
  })

  it('formats whole-dollar prices', () => {
    expect(formatUsd(15)).toBe('$15')
  })
})
