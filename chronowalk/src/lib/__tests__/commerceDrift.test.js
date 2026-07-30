import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LAUNCH_CATALOG_FINGERPRINT } from '../generated/launchCatalog.gen.js'
import { LAUNCH_CATALOG_FINGERPRINT as NODE_FP } from '../../../scripts/lib/launchCatalog.gen.mjs'
import { LAUNCH_CATALOG_FINGERPRINT as EDGE_FP } from '../../../supabase/functions/paddle-webhook/launchCatalog.gen.js'
import { PADDLE_PRICE_ENV_KEYS, assertPublicPriceConfig } from '../paddle.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')

const PADDLE_ENV_KEYS = [
  'VITE_PADDLE_CLIENT_TOKEN',
  'VITE_PADDLE_ENV',
  'VITE_PADDLE_PRICE_ROME_CENTRAL',
  'VITE_PADDLE_PRICE_ROME_ESSENTIAL',
  'VITE_PADDLE_PRICE_ROME_COMPLETE',
  'VITE_PADDLE_PRICE_ROME_COUPLE',
  'VITE_PADDLE_PRICE_ROME_FAMILY',
]

function stubPaddleEnvPopulated() {
  vi.stubEnv('VITE_PADDLE_CLIENT_TOKEN', 'test_client_token')
  vi.stubEnv('VITE_PADDLE_ENV', 'sandbox')
  vi.stubEnv('VITE_PADDLE_PRICE_ROME_CENTRAL', 'pri_central_live')
  vi.stubEnv('VITE_PADDLE_PRICE_ROME_ESSENTIAL', 'pri_essential_live')
  vi.stubEnv('VITE_PADDLE_PRICE_ROME_COMPLETE', 'pri_complete_live')
  vi.stubEnv('VITE_PADDLE_PRICE_ROME_COUPLE', 'pri_couple_live')
  vi.stubEnv('VITE_PADDLE_PRICE_ROME_FAMILY', 'pri_family_live')
}

describe('commerce catalog consumers', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('keeps generated fingerprints aligned with source JSON', () => {
    const raw = readFileSync(join(ROOT, 'commerce/launchCatalog.json'), 'utf8')
    const fingerprint = createHash('sha256').update(raw).digest('hex').slice(0, 16)
    expect(LAUNCH_CATALOG_FINGERPRINT).toBe(fingerprint)
    expect(NODE_FP).toBe(fingerprint)
    expect(EDGE_FP).toBe(fingerprint)
  })

  it('exposes five client price env keys including bundles', () => {
    expect(Object.keys(PADDLE_PRICE_ENV_KEYS).sort()).toEqual(
      [
        'rome-central',
        'rome-complete',
        'rome-couple',
        'rome-essential',
        'rome-family',
      ].sort(),
    )
    expect(PADDLE_PRICE_ENV_KEYS['rome-couple']).toBe('VITE_PADDLE_PRICE_ROME_COUPLE')
    expect(PADDLE_PRICE_ENV_KEYS['rome-family']).toBe('VITE_PADDLE_PRICE_ROME_FAMILY')
  })

  it('fails closed in production when bundle prices are missing or duplicated', () => {
    // Authoritative empty ambient bag — never fill from .env.local / import.meta.env.
    const missing = assertPublicPriceConfig({
      environment: 'production',
      bundlesEnabled: true,
      paddlePricesFromConfig: {
        'rome-central': 'pri_c',
        'rome-essential': 'pri_e',
        'rome-complete': 'pri_full',
      },
      env: {},
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
      env: {},
    })
    expect(dup.ok).toBe(false)
    expect(dup.reason).toBe('duplicate_public_price')
  })

  it('fail-closed checks stay hermetic when ambient Paddle env is fully populated', () => {
    stubPaddleEnvPopulated()
    for (const key of PADDLE_ENV_KEYS) {
      expect(String(import.meta.env[key] ?? '')).not.toBe('')
    }

    const missing = assertPublicPriceConfig({
      environment: 'production',
      bundlesEnabled: true,
      paddlePricesFromConfig: {
        'rome-central': 'pri_c',
        'rome-essential': 'pri_e',
        'rome-complete': 'pri_full',
      },
      env: {},
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
      env: {},
    })
    expect(dup.ok).toBe(false)
    expect(dup.reason).toBe('duplicate_public_price')
  })
})
