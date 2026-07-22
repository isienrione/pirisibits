import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LAUNCH_CATALOG_FINGERPRINT } from '../generated/launchCatalog.gen.js'
import { LAUNCH_CATALOG_FINGERPRINT as NODE_FP } from '../../../scripts/lib/launchCatalog.gen.mjs'
import { LAUNCH_CATALOG_FINGERPRINT as EDGE_FP } from '../../../supabase/functions/paddle-webhook/launchCatalog.gen.js'
import { PADDLE_PRICE_ENV_KEYS, assertPublicPriceConfig } from '../paddle.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('commerce catalog consumers', () => {
  it('keeps generated fingerprints aligned with source JSON', () => {
    const raw = readFileSync(join(ROOT, 'commerce/launchCatalog.json'), 'utf8')
    const fingerprint = createHash('sha256').update(raw).digest('hex').slice(0, 16)
    expect(LAUNCH_CATALOG_FINGERPRINT).toBe(fingerprint)
    expect(NODE_FP).toBe(fingerprint)
    expect(EDGE_FP).toBe(fingerprint)
  })

  it('exposes five client price env keys including bundles', () => {
    expect(Object.keys(PADDLE_PRICE_ENV_KEYS).sort()).toEqual([
      'rome-central',
      'rome-complete',
      'rome-couple',
      'rome-essential',
      'rome-family',
    ].sort())
    expect(PADDLE_PRICE_ENV_KEYS['rome-couple']).toBe('VITE_PADDLE_PRICE_ROME_COUPLE')
    expect(PADDLE_PRICE_ENV_KEYS['rome-family']).toBe('VITE_PADDLE_PRICE_ROME_FAMILY')
  })

  it('fails closed in production when bundle prices are missing or duplicated', () => {
    viStubMissingBundles()
    const missing = assertPublicPriceConfig({
      environment: 'production',
      bundlesEnabled: true,
      paddlePricesFromConfig: {
        'rome-central': 'pri_c',
        'rome-essential': 'pri_e',
        'rome-complete': 'pri_full',
      },
    })
    expect(missing.ok).toBe(false)
    expect(missing.reason).toBe('missing_bundle_price')

    const dup = assertPublicPriceConfig({
      environment: 'production',
      bundlesEnabled: true,
      paddlePricesFromConfig: {
        'rome-central': 'pri_c',
        'rome-essential': 'pri_e',
        'rome-complete': 'pri_full',
        'rome-couple': 'pri_full',
        'rome-family': 'pri_family',
      },
    })
    expect(dup.ok).toBe(false)
    expect(dup.reason).toBe('duplicate_public_price')
  })
})

function viStubMissingBundles() {
  // assertPublicPriceConfig reads import.meta.env only when fromConfig omitted;
  // tests pass paddlePricesFromConfig explicitly.
}
