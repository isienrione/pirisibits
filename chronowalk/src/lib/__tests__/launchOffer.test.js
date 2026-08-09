import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __setLaunchOfferActiveForTests,
  applyLaunchOfferToOffer,
  formatEurFromCents,
  getEffectivePriceCents,
  getLaunchOfferBundleCopy,
  getLaunchOfferHeroUnlockCta,
  getLaunchOfferPricing,
  LAUNCH_OFFER_BY_SKU,
  LAUNCH_OFFER_LABEL,
  resolveLaunchDiscountId,
} from '../launchOffer.js'
import { LAUNCH_CATALOG_BY_ID } from '../generated/launchCatalog.gen.js'
import { ROME_BUNDLES, ROME_TIERS } from '../../landing/landingData.js'
import { buildLandingProductSchema } from '../../landing/landingSeo.js'

const DISCOUNT_ENV = {
  VITE_PADDLE_DISCOUNT_ROME_CENTRAL: 'dsc_central',
  VITE_PADDLE_DISCOUNT_ROME_ESSENTIAL: 'dsc_essential',
  VITE_PADDLE_DISCOUNT_ROME_COMPLETE: 'dsc_complete',
  VITE_PADDLE_DISCOUNT_ROME_COUPLE: 'dsc_couple',
  VITE_PADDLE_DISCOUNT_ROME_FAMILY: 'dsc_family',
}

describe('launchOffer', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    __setLaunchOfferActiveForTests(true)
    for (const [key, value] of Object.entries(DISCOUNT_ENV)) {
      vi.stubEnv(key, value)
    }
  })

  afterEach(() => {
    __setLaunchOfferActiveForTests(null)
    vi.unstubAllEnvs()
  })

  it('maps CENTRAL→Historica and ESSENTIAL→Antica (not by equal €9.99 base)', () => {
    expect(LAUNCH_CATALOG_BY_ID['rome-central'].name).toBe('Roma Historica')
    expect(LAUNCH_CATALOG_BY_ID['rome-essential'].name).toBe('Roma Antica')
    expect(LAUNCH_CATALOG_BY_ID['rome-central'].amountCents).toBe(999)
    expect(LAUNCH_CATALOG_BY_ID['rome-essential'].amountCents).toBe(999)
    expect(LAUNCH_OFFER_BY_SKU['rome-central'].promoCents).toBe(499)
    expect(LAUNCH_OFFER_BY_SKU['rome-essential'].promoCents).toBe(699)
    expect(LAUNCH_OFFER_BY_SKU['rome-central'].discountEnvKey).toContain('CENTRAL')
    expect(LAUNCH_OFFER_BY_SKU['rome-essential'].discountEnvKey).toContain('ESSENTIAL')
  })

  it('exposes base / promo / discountId for all five SKUs when active', () => {
    const expected = [
      ['rome-central', 999, 499, 500, 'dsc_central'],
      ['rome-essential', 999, 699, 300, 'dsc_essential'],
      ['rome-complete', 1499, 1000, 499, 'dsc_complete'],
      ['rome-couple', 2500, 1700, 800, 'dsc_couple'],
      ['rome-family', 3500, 2500, 1000, 'dsc_family'],
    ]
    for (const [sku, base, promo, discount, dsc] of expected) {
      const pricing = getLaunchOfferPricing(sku)
      expect(pricing).toMatchObject({
        active: true,
        baseCents: base,
        promoCents: promo,
        discountCents: discount,
        effectiveCents: promo,
        discountId: dsc,
        label: LAUNCH_OFFER_LABEL,
      })
      expect(resolveLaunchDiscountId(sku)).toBe(dsc)
      expect(getEffectivePriceCents(sku, base)).toBe(promo)
    }
  })

  it('falls back to baked-in live discount ids when env overrides are empty', () => {
    vi.unstubAllEnvs()
    for (const [sku, row] of Object.entries(LAUNCH_OFFER_BY_SKU)) {
      expect(row.discountId).toMatch(/^dsc_01/)
      expect(resolveLaunchDiscountId(sku, { env: {} })).toBe(row.discountId)
      expect(resolveLaunchDiscountId(sku)).toBe(row.discountId)
    }
  })

  it('formats whole euros without decimals', () => {
    expect(formatEurFromCents(1000)).toBe('€10')
    expect(formatEurFromCents(499)).toBe('€4.99')
    expect(formatEurFromCents(1700)).toBe('€17')
  })

  it('recalculates Couple/Family savings against promotional Eterna (€10)', () => {
    const couple = getLaunchOfferBundleCopy('rome-couple')
    expect(couple.badge).toBe(LAUNCH_OFFER_LABEL)
    expect(couple.perPerson).toBe('€8.50 per person')
    expect(couple.savingsLine).toBe('Save €3 vs two individual Roma Eterna walks')

    const family = getLaunchOfferBundleCopy('rome-family')
    expect(family.badge).toBe(LAUNCH_OFFER_LABEL)
    expect(family.perPerson).toBe('€6.25/person for four')
    expect(family.savingsLine).toBe('Save €15 vs four individual Roma Eterna walks')
  })

  it('keeps hero CTA on Eterna promo, not cheapest Historica', () => {
    expect(getLaunchOfferHeroUnlockCta()).toBe('Unlock all 21 stops · €10')
  })

  it('enriches landing offers for UI without mutating catalog bases', () => {
    const eterna = applyLaunchOfferToOffer(ROME_TIERS.find((t) => t.id === 'rome-complete'))
    expect(eterna.price).toBe('€10')
    expect(eterna.basePrice).toBe('€14.99')
    expect(eterna.launchOffer).toBe(true)
    expect(eterna.saveLabel).toBe('Save €4.99')
    expect(ROME_TIERS.find((t) => t.id === 'rome-complete').priceCents).toBe(1499)

    const couple = applyLaunchOfferToOffer(ROME_BUNDLES.find((b) => b.id === 'rome-couple'))
    expect(couple.price).toBe('€17')
    expect(couple.basePrice).toBe('€25')
    expect(couple.saveLabel).toBe('Save €8')
    expect(couple.savingsLine).toMatch(/Save €3/)
  })

  it('JSON-LD uses promotional Offer prices while active', () => {
    const schema = buildLandingProductSchema()
    const byName = Object.fromEntries(
      schema.itemListElement.map((row) => [row.item.name, row.item.offers.price]),
    )
    expect(byName['ChronoWalk Roma Historica']).toBe('4.99')
    expect(byName['ChronoWalk Roma Antica']).toBe('6.99')
    expect(byName['ChronoWalk Roma Eterna']).toBe('10.00')
  })

  it('disabling the kill switch restores base pricing everywhere', () => {
    __setLaunchOfferActiveForTests(false)

    expect(resolveLaunchDiscountId('rome-complete')).toBeNull()
    expect(getEffectivePriceCents('rome-complete', 1499)).toBe(1499)
    expect(getLaunchOfferHeroUnlockCta()).toBe('Unlock from €9.99')

    const eterna = applyLaunchOfferToOffer(ROME_TIERS.find((t) => t.id === 'rome-complete'))
    expect(eterna.launchOffer).toBe(false)
    expect(eterna.price).toBe('€14.99')
    expect(eterna.basePrice).toBeUndefined()

    const schema = buildLandingProductSchema()
    const eternaOffer = schema.itemListElement.find(
      (row) => row.item.name === 'ChronoWalk Roma Eterna',
    )
    expect(eternaOffer.item.offers.price).toBe('14.99')
  })

  it('does not alter catalog entitlement fields', () => {
    for (const sku of Object.keys(LAUNCH_OFFER_BY_SKU)) {
      const row = LAUNCH_CATALOG_BY_ID[sku]
      expect(row.contentProductId).toBeTruthy()
      expect(row.seatLimit).toBeGreaterThan(0)
      expect(row.amountCents).toBeGreaterThan(0)
    }
    expect(LAUNCH_CATALOG_BY_ID['rome-couple'].contentProductId).toBe('rome-complete')
    expect(LAUNCH_CATALOG_BY_ID['rome-couple'].seatLimit).toBe(2)
    expect(LAUNCH_CATALOG_BY_ID['rome-family'].seatLimit).toBe(4)
  })
})
