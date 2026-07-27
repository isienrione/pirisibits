import { describe, expect, it } from 'vitest'
import { LANDING_VERIFIED_REVIEWS, ROME_BUNDLES, ROME_TIERS } from '../landingData.js'
import {
  LANDING_PRODUCT,
  eternaUpgradeDeltaCents,
  eternaUpgradeDeltaLabel,
} from '../landingProduct.js'
import { LANDING_MODES, normalizeLandingSrc, resolveLandingHost, resolveLandingMode } from '../landingModes.js'
import {
  REBUILD_DIFFERENCE,
  REBUILD_FAQ,
  REBUILD_HERO,
  REBUILD_PRICING,
  REBUILD_THRESHOLD,
  REBUILD_WALK_TOGETHER,
} from '../rebuildCopy.js'

describe('landing rebuild architecture', () => {
  it('uses canonical catalog stop counts and prices', () => {
    expect(LANDING_PRODUCT.historica).toMatchObject({ stopCount: 8, priceCents: 999 })
    expect(LANDING_PRODUCT.antica).toMatchObject({ stopCount: 12, priceCents: 999 })
    expect(LANDING_PRODUCT.eterna).toMatchObject({ stopCount: 21, priceCents: 1499 })
    expect(LANDING_PRODUCT.couple).toMatchObject({ seatLimit: 2, priceCents: 2500 })
    expect(LANDING_PRODUCT.family).toMatchObject({ seatLimit: 4, priceCents: 3500 })
    expect(eternaUpgradeDeltaCents()).toBe(500)
    expect(eternaUpgradeDeltaLabel()).toMatch(/€5/)
  })

  it('keeps ROME_TIERS / bundles aligned with catalog-backed landing product', () => {
    expect(ROME_TIERS.map((t) => t.id)).toEqual([
      'rome-central',
      'rome-essential',
      'rome-complete',
    ])
    expect(ROME_BUNDLES.map((b) => b.id)).toEqual(['rome-couple', 'rome-family'])
    expect(ROME_TIERS.find((t) => t.id === 'rome-complete').bullets[0]).toMatch(/All 21 stops/)
  })

  it('paces CTAs like a film: curiosity → commitment → urgency', () => {
    expect(REBUILD_HERO.organic.headline).toMatch(/See what stood here/i)
    expect(REBUILD_HERO.organic.primaryCta).toMatch(/Pantheon/i)
    expect(REBUILD_HERO.organic.secondaryCta).toMatch(/complete Rome walk/i)
    expect(REBUILD_HERO.geo.primaryCta).toMatch(/Pantheon/i)
    expect(REBUILD_HERO.qr.support).toMatch(/Buy tonight/i)
    expect(REBUILD_PRICING.eternaCta).toMatch(/Unlock all 21/i)
    expect(LANDING_MODES.organic.primaryAction).toBe('preview')
    expect(LANDING_MODES.qr.primaryAction).toBe('preview')
  })

  it('keeps Threshold brand line with plain explanation', () => {
    expect(REBUILD_THRESHOLD.headline).toBe('The ruin becomes the room.')
    expect(REBUILD_THRESHOLD.methodology).toMatch(/uncertain|Evidence/i)
    expect(REBUILD_THRESHOLD.tapAlternative).toMatch(/Tap to reveal/i)
  })

  it('recommends Roma Eterna factually without popularity claims', () => {
    expect(REBUILD_PRICING.eternaLabel).toMatch(/complete Rome walk/i)
    expect(REBUILD_PRICING.eternaCta).toMatch(/€14\.99/)
    expect(REBUILD_PRICING.valueCompare).toMatch(/€5/)
    const joined = JSON.stringify(REBUILD_PRICING).toLowerCase()
    expect(joined).not.toMatch(/most popular|bestseller|★★★★★|5-star/)
  })

  it('explains Walk Together without perfect sync absolutes', () => {
    expect(REBUILD_WALK_TOGETHER.headline).toMatch(/Share the walk/i)
    expect(REBUILD_WALK_TOGETHER.syncNote.toLowerCase()).toMatch(/not guaranteed/)
    expect(JSON.stringify(REBUILD_WALK_TOGETHER).toLowerCase()).not.toMatch(
      /same word on every phone|millisecond|perfect audio/,
    )
  })

  it('ships honest differentiation and FAQ without fabricated reviews', () => {
    expect(REBUILD_DIFFERENCE.rows.length).toBeGreaterThanOrEqual(3)
    expect(REBUILD_FAQ.items.length).toBe(8)
    expect(LANDING_VERIFIED_REVIEWS).toEqual([])
    const banned = ['100% offline', 'no data needed', 'hollywood', 'most popular']
    const blob = `${JSON.stringify(REBUILD_FAQ)}${JSON.stringify(REBUILD_DIFFERENCE)}`.toLowerCase()
    for (const phrase of banned) {
      expect(blob).not.toContain(phrase)
    }
  })

  it('resolves source modes safely without injecting raw host text', () => {
    expect(normalizeLandingSrc('GEO')).toBe('geo')
    expect(normalizeLandingSrc('unknown')).toBe('organic')
    expect(resolveLandingHost('demo')?.id).toBe('demo')
    expect(resolveLandingHost('<script>alert(1)</script>')).toBeNull()
    const geo = resolveLandingMode(new URLSearchParams('src=geo'))
    expect(geo.mode.primaryAction).toBe('preview')
    expect(geo.mode.showPlanningNarrative).toBe(false)
    expect(LANDING_MODES.organic.showWalkTogether).toBe(true)
  })

  it('forbids stale stop counts in rebuild marketing copy', () => {
    const blob = JSON.stringify({
      hero: REBUILD_HERO,
      pricing: REBUILD_PRICING,
      together: REBUILD_WALK_TOGETHER,
      faq: REBUILD_FAQ,
    })
    expect(blob).not.toMatch(/\b18 stops\b|\b22 stops\b|\b22 places\b/)
    expect(blob).toMatch(/21/)
  })
})
