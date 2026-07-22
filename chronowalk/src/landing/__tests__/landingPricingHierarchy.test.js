import { describe, expect, it } from 'vitest'
import { ROME_BUNDLES, ROME_TIERS } from '../landingData.js'
import { getLandingTierStats } from '../landingTierStats.js'

describe('pricing card hierarchy content', () => {
  it('keeps product ids, prices, and checkout cents unchanged', () => {
    expect(ROME_TIERS.map((tier) => ({ id: tier.id, price: tier.price, cents: tier.priceCents }))).toEqual([
      { id: 'rome-central', price: '€9.99', cents: 999 },
      { id: 'rome-essential', price: '€9.99', cents: 999 },
      { id: 'rome-complete', price: '€14.99', cents: 1499 },
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
    expect(eterna.bullets[0]).toMatch(/All 21 stops/)
  })

  it('names each purchase CTA after its package', () => {
    expect(ROME_TIERS.map((tier) => tier.primaryCta)).toEqual([
      'Choose Roma Historica',
      'Choose Roma Antica',
      'Choose Roma Eterna',
    ])
  })

  it('exposes stop counts for the simplified meta row', () => {
    expect(getLandingTierStats('rome-central').stopCount).toBe(8)
    expect(getLandingTierStats('rome-essential').stopCount).toBe(12)
    expect(getLandingTierStats('rome-complete').stopCount).toBe(21)
  })

  it('defines Couple and Family bundles without a group offer', () => {
    expect(ROME_BUNDLES.map((bundle) => bundle.id)).toEqual(['rome-couple', 'rome-family'])
    expect(ROME_BUNDLES.map((bundle) => bundle.primaryCta)).toEqual([
      'Choose Couple Bundle',
      'Choose Family Bundle',
    ])
    for (const bundle of ROME_BUNDLES) {
      expect(bundle.contentStops).toBe('All 21 stops')
      expect(bundle.contentTitle).toBe('Complete Roma Eterna')
      expect(bundle.contentLoop).toBe('Full city loop')
      expect(JSON.stringify(bundle)).not.toMatch(/group bundle/i)
      expect(bundle).not.toHaveProperty('seatLimit')
      expect(bundle).not.toHaveProperty('contentProductId')
    }
  })

  it('assigns five distinct package accent tokens in the landing CSS', async () => {
    const { readFile } = await import('node:fs/promises')
    const { join, dirname } = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    const here = dirname(fileURLToPath(import.meta.url))
    const css = await readFile(join(here, '../ChronoWalkLanding.v2.css'), 'utf8')

    const accents = {
      historica: css.match(/--v2-package-historica:\s*([^;]+);/)?.[1]?.trim(),
      antica: css.match(/--v2-package-antica:\s*([^;]+);/)?.[1]?.trim(),
      eterna: css.match(/--v2-package-eterna:\s*([^;]+);/)?.[1]?.trim(),
      couple: css.match(/--v2-package-couple:\s*([^;]+);/)?.[1]?.trim(),
      family: css.match(/--v2-package-family:\s*([^;]+);/)?.[1]?.trim(),
    }

    expect(accents).toEqual({
      historica: 'var(--v2-silver)',
      antica: 'var(--olive, #6b7a52)',
      eterna: 'var(--ember, #e8a13c)',
      couple: 'var(--act-arena, #e4552e)',
      family: 'var(--verdigris, var(--act-market, #4e9b8f))',
    })
    expect(new Set(Object.values(accents)).size).toBe(5)
  })
})
