import { describe, expect, it } from 'vitest'
import {
  EXAMPLE_ACCESS_TOKEN,
  isAllowedEmail,
  isSqlOrRecoveryFixture,
  scanContent,
} from '../check-no-sensitive-data.mjs'

/** Build patterns at runtime so this test file stays clean under git ls-files. */
function syntheticUuid(parts = ['11111111', '2222', '4333', '8444', '555555555555']) {
  return parts.join('-')
}

describe('check-no-sensitive-data', () => {
  it('allows support addresses and example.invalid fixtures', () => {
    expect(isAllowedEmail('support@chronowalk.com')).toBe(true)
    expect(isAllowedEmail('hello@chronowalk.com')).toBe(true)
    expect(isAllowedEmail('access@chronowalk.com')).toBe(true)
    expect(isAllowedEmail('buyer@example.invalid')).toBe(true)
    expect(isAllowedEmail(['buyer', 'example.com'].join('@'))).toBe(false)
    expect(isAllowedEmail(['person', 'gmail.com'].join('@'))).toBe(false)
  })

  it('treats .sql and recovery paths as fixtures', () => {
    expect(isSqlOrRecoveryFixture('chronowalk/scripts/foo.sql')).toBe(true)
    expect(isSqlOrRecoveryFixture('scripts/recover-stuck-purchases.example.sql')).toBe(
      true,
    )
    expect(isSqlOrRecoveryFixture('src/lib/access.js')).toBe(false)
  })

  it('passes synthetic safe fixtures', () => {
    const sql = `
insert into public.purchases (email, order_id, product_id, access_token)
values (
  'buyer@example.invalid',
  'txn_EXAMPLE',
  'rome-complete',
  '${EXAMPLE_ACCESS_TOKEN}'::uuid
);
-- dynamic link construction is fine (no concrete UUID)
select ('https://chronowalk.com/access?token=' || access_token::text) as unlock_link;
`
    expect(scanContent('scripts/safe.example.sql', sql)).toEqual([])

    const docs = [
      'Unlock via /access?token=<uuid> or /access?token=…',
      'PADDLE_API_KEY=pdl_live_apikey_...',
      'RESEND_API_KEY=re_...',
      'Contact support@chronowalk.com',
    ].join('\n')
    expect(scanContent('docs/PADDLE_SETUP.md', docs)).toEqual([])
  })

  it('fails on /access?token= followed by a non-example UUID', () => {
    const dirty = `open https://chronowalk.com/access?token=${syntheticUuid()}`
    const findings = scanContent('notes.md', dirty)
    expect(findings.some((f) => f.rule === 'access_token_url')).toBe(true)
  })

  it('allows the synthetic example UUID in access URLs', () => {
    const safe = `https://chronowalk.com/access?token=${EXAMPLE_ACCESS_TOKEN}`
    expect(scanContent('notes.md', safe)).toEqual([])
  })

  it('fails on hard-coded SQL access_token UUIDs that are not the example', () => {
    const sql = `
insert into public.purchases (email, order_id, product_id, access_token)
values ('buyer@example.invalid', 'txn_EXAMPLE', 'rome-complete',
  '${syntheticUuid()}'::uuid);
`
    const findings = scanContent('scripts/recover.sql', sql)
    expect(findings.some((f) => f.rule === 'sql_access_token_uuid')).toBe(true)
  })

  it('fails on non-example customer emails in SQL fixtures', () => {
    const email = ['person', 'gmail.com'].join('@')
    const sql = `insert into public.paddle_customers (customer_id, email)
values ('ctm_EXAMPLE', '${email}');`
    const findings = scanContent('scripts/backfill.sql', sql)
    expect(findings.some((f) => f.rule === 'customer_email')).toBe(true)
  })

  it('fails on Paddle / Resend / Supabase secret-key formats', () => {
    const secrets = [
      'PADDLE_API_KEY=' + 'pdl_live_apikey_' + 'ABCDEFghijklmnop1234',
      'RESEND_API_KEY=' + 're_' + 'AbCdEfGhIjKlMnOpQrStUvWx',
      'SUPABASE_SERVICE_ROLE_KEY=' +
        [
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          'eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9',
          'signaturepartgoeshere0001',
        ].join('.'),
    ].join('\n')
    const findings = scanContent('.env.leaked', secrets)
    expect(findings.map((f) => f.rule).sort()).toEqual([
      'paddle_api_key',
      'resend_api_key',
      'supabase_jwt',
    ])
  })
})
