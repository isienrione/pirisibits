import { afterAll, describe, expect, it } from 'vitest'
import {
  EXPECTED_ENTITLEMENTS,
  HARDENING_SQL,
  LEGACY_PURCHASES_SCHEMA,
  VERIFY_SQL,
  applySql,
  applySqlFile,
  assertLocalPsqlAvailable,
  dropDisposableDatabase,
  findInvalidUpdateTargetFunctionRefs,
  listMigrationSqlFiles,
  queryTuples,
  recreateDisposableDatabase,
  scanMigrationFiles,
  seedLegacyPurchasesSql,
  verificationMigrationsRollBack,
} from '../lib/launchCommerceMigrationHarness.mjs'

const FRESH_DB = 'cw_mig_fresh'
const LEGACY_DB = 'cw_mig_legacy'
const RERUN_DB = 'cw_mig_rerun'
const created = []

function track(dbName) {
  created.push(dbName)
  recreateDisposableDatabase(dbName)
  return dbName
}

afterAll(() => {
  for (const dbName of created) {
    try {
      dropDisposableDatabase(dbName)
    } catch {
      /* ignore cleanup failures */
    }
  }
})

describe('launch commerce migration SQL static guards', () => {
  it('rejects the historical 42P10 UPDATE-target function reference pattern', () => {
    const bad = `
update public.purchases p
set seat_limit = coalesce(p.seat_limit, coalesce(e.seat_limit, 1))
from public.launch_sku_entitlement(p.product_id) e
where p.seat_limit is null;
`
    const findings = findInvalidUpdateTargetFunctionRefs(bad, 'fixture.sql')
    expect(findings).toHaveLength(1)
    expect(findings[0].alias).toBe('p')
  })

  it('accepts the CTE + LATERAL backfill pattern', () => {
    const good = `
with entitlement_backfill as (
  select p.id as purchase_id, e.seat_limit
  from public.purchases p
  cross join lateral public.launch_sku_entitlement(p.product_id) e
)
update public.purchases p
set seat_limit = b.seat_limit
from entitlement_backfill b
where p.id = b.purchase_id;
`
    expect(findInvalidUpdateTargetFunctionRefs(good)).toEqual([])
  })

  it('finds no invalid UPDATE-target function refs in checked-in migrations', () => {
    expect(scanMigrationFiles(listMigrationSqlFiles())).toEqual([])
  })

  it('ensures every verification migration begins a transaction and rolls back', () => {
    const reports = verificationMigrationsRollBack()
    expect(reports.length).toBeGreaterThan(0)
    for (const report of reports) {
      expect(report, report.name).toMatchObject({ hasBegin: true, hasRollback: true, ok: true })
    }
  })
})

describe('launch commerce hardening migration on disposable local Postgres', () => {
  it('applies on a completely empty fresh database', () => {
    assertLocalPsqlAvailable()
    const db = track(FRESH_DB)
    expect(() => applySqlFile(db, HARDENING_SQL)).not.toThrow()
    const tables = queryTuples(
      db,
      `select count(*) from information_schema.tables
       where table_schema = 'public' and table_name = 'purchases'`,
    )
    expect(tables[0][0]).toBe('1')
  })

  it('backfills entitlements from a legacy purchases table and preserves non-null values', () => {
    assertLocalPsqlAvailable()
    const db = track(LEGACY_DB)
    applySql(db, LEGACY_PURCHASES_SCHEMA)
    applySql(db, seedLegacyPurchasesSql())

    // Simulate a row that already received partial entitlement values before backfill
    // by applying ADD COLUMN + explicit values, then running the full hardening script
    // (idempotent ADD COLUMN IF NOT EXISTS + WHERE-null backfill).
    applySql(
      db,
      `
alter table public.purchases add column if not exists content_product_id text;
alter table public.purchases add column if not exists seat_limit integer;
alter table public.purchases add column if not exists status text;
alter table public.purchases add column if not exists updated_at timestamptz;
alter table public.purchases add column if not exists fulfilled_at timestamptz;
insert into public.purchases (
  email, order_id, product_id, content_product_id, seat_limit, status, updated_at
) values (
  'keep@example.invalid',
  'txn_LEGACY_KEEP',
  'rome-couple',
  'rome-essential',
  3,
  'active',
  now()
);
`,
    )

    expect(() => applySqlFile(db, HARDENING_SQL)).not.toThrow()

    const rows = queryTuples(
      db,
      `select order_id, product_id, content_product_id, seat_limit::text, status
       from public.purchases
       where order_id like 'txn_LEGACY_%'
       order by order_id`,
    )
    const byOrder = Object.fromEntries(rows.map((r) => [r[0], r]))

    for (const [sku, expected] of Object.entries(EXPECTED_ENTITLEMENTS)) {
      const row = byOrder[`txn_LEGACY_${sku}`]
      expect(row, sku).toBeTruthy()
      expect(row[2]).toBe(expected.content)
      expect(Number(row[3])).toBe(expected.seats)
      expect(row[4]).toBe('active')
    }

    const keep = byOrder.txn_LEGACY_KEEP
    expect(keep[2]).toBe('rome-essential')
    expect(Number(keep[3])).toBe(3)
    expect(keep[4]).toBe('active')
  })

  it('is idempotent when re-applied on an already-hardened database', () => {
    assertLocalPsqlAvailable()
    const db = track(RERUN_DB)
    applySqlFile(db, HARDENING_SQL)
    applySql(
      db,
      `
insert into public.purchases (
  email, order_id, product_id, content_product_id, seat_limit, status, fulfilled_at
) values (
  'rerun@example.invalid',
  'txn_RERUN_COMPLETE',
  'rome-complete',
  'rome-complete',
  1,
  'active',
  now()
);
`,
    )
    expect(() => applySqlFile(db, HARDENING_SQL)).not.toThrow()
    const rows = queryTuples(
      db,
      `select content_product_id, seat_limit::text, status
       from public.purchases where order_id = 'txn_RERUN_COMPLETE'`,
    )
    expect(rows).toEqual([['rome-complete', '1', 'active']])
  })

  it('passes the exact hardening verify script and rolls back synthetic rows', () => {
    assertLocalPsqlAvailable()
    const db = track('cw_mig_verify_full')
    applySqlFile(db, HARDENING_SQL)
    const before = Number(
      queryTuples(db, `select count(*) from public.purchases`)[0][0],
    )
    expect(() => applySqlFile(db, VERIFY_SQL)).not.toThrow()
    const after = Number(
      queryTuples(db, `select count(*) from public.purchases`)[0][0],
    )
    expect(after).toBe(before)
  })
})
