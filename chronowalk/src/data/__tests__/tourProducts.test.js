import { describe, expect, it } from 'vitest'
import { formatUsd, getTourIdsForProduct, TOUR_PRODUCT_LIST, TOUR_PRODUCTS } from '../tourProducts'

describe('tourProducts', () => {
  it('names the two purchasable tours correctly', () => {
    expect(TOUR_PRODUCTS['roman-forum'].title).toBe('Roman Forum')
    expect(TOUR_PRODUCTS['heart-of-ancient-rome'].title).toBe('Heart of Ancient Rome')
    expect(TOUR_PRODUCTS['roman-forum'].stopIds).toHaveLength(8)
    expect(TOUR_PRODUCTS['heart-of-ancient-rome'].stopIds.length).toBeGreaterThan(8)
  })

  it('prices single routes at $12 and the full bundle at $17.99', () => {
    expect(TOUR_PRODUCTS['rome-central'].priceUsd).toBe(12)
    expect(TOUR_PRODUCTS['roman-forum'].priceUsd).toBe(12)
    expect(TOUR_PRODUCTS['heart-of-ancient-rome'].priceUsd).toBe(12)
    expect(TOUR_PRODUCTS['rome-complete'].priceUsd).toBe(17.99)
    expect(TOUR_PRODUCTS['rome-complete'].priceCents).toBe(1799)
  })

  it('expands bundle to both tour ids', () => {
    expect(getTourIdsForProduct('rome-complete').sort()).toEqual([
      'heart-of-ancient-rome',
      'roman-forum',
    ])
  })

  it('defines central rome as the centro loop without the archaeological park', () => {
    expect(TOUR_PRODUCTS['rome-central'].priceCents).toBe(1200)
    expect(TOUR_PRODUCTS['rome-central'].stopIds).toEqual([
      'pantheon',
      'spanish-steps',
      'fontana-di-trevi',
      'piazza-navona',
      'campo-de-fiori',
      'largo-argentina',
      'castel-sant-angelo',
    ])
    expect(getTourIdsForProduct('rome-central')).toEqual(['central-rome'])
  })

  it('lists the bundle before individual tours', () => {
    expect(TOUR_PRODUCT_LIST[0].id).toBe('rome-complete')
    expect(TOUR_PRODUCT_LIST[1].id).toBe('rome-central')
    expect(TOUR_PRODUCT_LIST[2].id).toBe('roman-forum')
    expect(TOUR_PRODUCT_LIST[3].id).toBe('heart-of-ancient-rome')
  })

  it('formats whole-dollar and fractional USD prices', () => {
    expect(formatUsd(12)).toBe('$12')
    expect(formatUsd(17.99)).toBe('$17.99')
  })
})
