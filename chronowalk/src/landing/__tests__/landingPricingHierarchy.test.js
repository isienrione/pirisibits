import { describe, expect, it } from 'vitest'
import { ROME_TIERS } from '../landingData.js'
import { getLandingTierStats } from '../landingTierStats.js'

describe('pricing card hierarchy content', () => {
  it('keeps product ids, prices, and checkout cents unchanged', () => {
    expect(ROME_TIERS.map((tier) => ({ id: tier.id, price: tier.price, cents: tier.priceCents }))).toEqual([
      { id: 'rome-central', price: '€9', cents: 900 },
      { id: 'rome-essential', price: '€12', cents: 1200 },
      { id: 'rome-complete', price: '€17', cents: 1700 },
    ])
  })

  it('uses consistent route names with best-for and outcome copy', () => {
    expect(ROME_TIERS.map((tier) => tier.name)).toEqual([
      'Roma Historica',
      'Roma Antica',
      'Roma Eterna',
    ])
    for (const tier of ROME_TIERS) {
      expect(tier.bestFor).toMatch(/Best for/i)
      expect(tier.outcome.length).toBeGreaterThan(20)
      expect(tier.expandLabel).toMatch(/stop/i)
    }
  })

  it('keeps Roma Eterna featured without invented conversion claims', () => {
    const eterna = ROME_TIERS.find((tier) => tier.id === 'rome-complete')
    expect(eterna.badge).toBe('Full city loop')
    expect(eterna.badge).not.toMatch(/%|popular|bestseller/i)
  })

  it('exposes stop counts for the simplified meta row', () => {
    for (const tier of ROME_TIERS) {
      const stats = getLandingTierStats(tier.id)
      expect(stats.stopCount).toBeGreaterThan(0)
      expect(stats.routeTimeLabel).toMatch(/^~/)
    }
  })
})
