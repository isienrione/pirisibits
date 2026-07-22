import { describe, expect, it } from 'vitest'
import {
  assertEnvironmentGuard,
  catalogPlan,
  formatEnvOutput,
  indexExistingBySku,
  parseSeedArgs,
  resolveSeedActions,
  STABLE_META_KEY,
} from '../seed-paddle-catalog.mjs'
import { LAUNCH_CATALOG_PRODUCTS } from '../lib/launchCatalog.gen.mjs'

describe('seed-paddle-catalog', () => {
  it('plans exact five one-time EUR amounts', () => {
    const plan = catalogPlan()
    expect(plan).toHaveLength(5)
    expect(plan.map((p) => p.amountCents)).toEqual([999, 999, 1499, 2500, 3500])
    expect(plan.map((p) => p.productId)).toEqual([
      'rome-central',
      'rome-essential',
      'rome-complete',
      'rome-couple',
      'rome-family',
    ])
  })

  it('defaults to dry-run and parses explicit env', () => {
    expect(parseSeedArgs([])).toMatchObject({ execute: false, envName: 'sandbox' })
    expect(parseSeedArgs(['--execute', '--env=production'])).toMatchObject({
      execute: true,
      envName: 'production',
    })
  })

  it('requires explicit --env with --execute', () => {
    expect(
      assertEnvironmentGuard({ execute: true, envName: 'sandbox', envFlagPresent: false }).ok,
    ).toBe(false)
    expect(
      assertEnvironmentGuard({ execute: true, envName: 'sandbox', envFlagPresent: true }).ok,
    ).toBe(true)
  })

  it('reuses a complete existing catalog', () => {
    const plan = catalogPlan()
    const products = plan.map((p, i) => ({
      id: `pro_${i}`,
      customData: { [STABLE_META_KEY]: p.productId },
    }))
    const prices = plan.map((p, i) => ({
      id: `pri_${i}`,
      customData: { [STABLE_META_KEY]: p.productId },
      unitPrice: { amount: p.amount, currencyCode: 'EUR' },
      billingCycle: null,
    }))
    const indexed = indexExistingBySku(products, prices)
    const resolved = resolveSeedActions(plan, indexed)
    expect(resolved.ok).toBe(true)
    expect(resolved.actions.every((a) => a.action === 'reuse')).toBe(true)
  })

  it('creates missing prices for a partial catalog', () => {
    const plan = catalogPlan()
    const products = [
      { id: 'pro_0', customData: { [STABLE_META_KEY]: 'rome-central' } },
    ]
    const prices = []
    const resolved = resolveSeedActions(plan, indexExistingBySku(products, prices))
    expect(resolved.ok).toBe(true)
    expect(resolved.actions.find((a) => a.sku === 'rome-central')?.action).toBe('create_price')
    expect(resolved.actions.filter((a) => a.action === 'create_both')).toHaveLength(4)
  })

  it('stops on ambiguous duplicates', () => {
    const plan = catalogPlan()
    const products = [
      { id: 'pro_a', customData: { [STABLE_META_KEY]: 'rome-complete' } },
      { id: 'pro_b', customData: { [STABLE_META_KEY]: 'rome-complete' } },
    ]
    const resolved = resolveSeedActions(plan, indexExistingBySku(products, []))
    expect(resolved.ok).toBe(false)
    expect(resolved.reason).toBe('ambiguous_duplicate')
  })

  it('formats client and server env var names without secrets beyond price ids', () => {
    const text = formatEnvOutput(
      [
        {
          clientEnvKey: 'VITE_PADDLE_PRICE_ROME_CENTRAL',
          serverEnvKey: 'PADDLE_PRICE_ROME_CENTRAL',
          priceId: 'pri_example_central',
        },
      ],
      'sandbox',
    )
    expect(text).toContain('VITE_PADDLE_PRICE_ROME_CENTRAL=pri_example_central')
    expect(text).toContain('PADDLE_PRICE_ROME_CENTRAL=pri_example_central')
    expect(text).not.toMatch(/pdl_(live|sdbx)_apikey_/)
  })

  it('matches generated catalog consumer product count', () => {
    expect(LAUNCH_CATALOG_PRODUCTS).toHaveLength(5)
  })
})
