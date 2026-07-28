import { describe, expect, it } from 'vitest'
import { HERO_COVERAGE_STOPS, HERO_SLIDESHOW_SLIDES } from '../v4/heroSlideshowData.js'
import { ROME_TIERS } from '../landingData.js'
import { getLandingTierStats } from '../landingTierStats.js'

describe('heroSlideshowData', () => {
  it('uses product-true stop count (21, not 22)', () => {
    expect(HERO_COVERAGE_STOPS).toHaveLength(21)
    const coverage = HERO_SLIDESHOW_SLIDES.find((s) => s.id === 'coverage')
    expect(coverage.stops).toHaveLength(21)
    expect(coverage.subtitleParts.some((p) => p.text === '21' && p.gold)).toBe(true)
  })

  it('uses live EUR prices and stop counts for packages', () => {
    const packages = HERO_SLIDESHOW_SLIDES.find((s) => s.id === 'packages').packages
    const byId = Object.fromEntries(packages.map((p) => [p.id, p]))
    expect(byId['rome-complete'].price).toBe('€14.99')
    expect(byId['rome-essential'].price).toBe('€9.99')
    expect(byId['rome-central'].price).toBe('€9.99')
    expect(byId['rome-complete'].stops).toBe(21)
    expect(byId['rome-essential'].stops).toBe(12)
    expect(byId['rome-central'].stops).toBe(8)
    for (const tier of ROME_TIERS) {
      expect(byId[tier.id].duration).toBe(getLandingTierStats(tier.id).routeTimeLabel)
    }
  })

  it('keeps corrected Antica copy off the Appian Way claim', () => {
    const packages = HERO_SLIDESHOW_SLIDES.find((s) => s.id === 'packages').packages
    const antica = packages.find((p) => p.id === 'rome-essential')
    expect(antica.description).not.toMatch(/appian/i)
    expect(antica.description).toMatch(/colosseum/i)
  })
})
