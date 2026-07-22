import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
export const MIGRATIONS_DIR = join(ROOT, 'supabase/migrations')
export const HARDENING_SQL = join(MIGRATIONS_DIR, '20260721_launch_commerce_hardening.sql')
export const VERIFY_SQL = join(MIGRATIONS_DIR, '20260721_launch_commerce_hardening_verify.sql')

export const DEFAULT_PG = {
  host: process.env.CW_MIG_PGHOST || '127.0.0.1',
  port: process.env.CW_MIG_PGPORT || '5432',
  user: process.env.CW_MIG_PGUSER || 'postgres',
}

export const EXPECTED_ENTITLEMENTS = {
  'rome-central': { content: 'rome-central', seats: 1 },
  'rome-essential': { content: 'rome-essential', seats: 1 },
  'rome-complete': { content: 'rome-complete', seats: 1 },
  'rome-couple': { content: 'rome-complete', seats: 2 },
  'rome-family': { content: 'rome-complete', seats: 4 },
}

/**
 * Detect PostgreSQL 42P10 anti-pattern:
 * UPDATE target alias referenced inside a FROM set-returning function call.
 */
export function findInvalidUpdateTargetFunctionRefs(sql, fileLabel = 'sql') {
  const findings = []
  const updateRe =
    /\bupdate\s+(?:only\s+)?(?<target>[\w."]+)\s+(?:as\s+)?(?<alias>\w+)\s+set\b/gi

  let match
  while ((match = updateRe.exec(sql)) !== null) {
    const alias = match.groups.alias
    const start = match.index
    let i = match.index + match[0].length
    let depth = 0
    let end = sql.length
    for (; i < sql.length; i += 1) {
      const ch = sql[i]
      if (ch === '(') depth += 1
      else if (ch === ')') depth = Math.max(0, depth - 1)
      else if (ch === ';' && depth === 0) {
        end = i
        break
      }
    }
    const stmt = sql.slice(start, end)
    const fromFunc = new RegExp(String.raw`\bfrom\s+[\w."]+\(\s*${alias}\s*\.`, 'i')
    if (fromFunc.test(stmt)) {
      findings.push({
        file: fileLabel,
        line: sql.slice(0, start).split('\n').length,
        alias,
        excerpt: stmt.replace(/\s+/g, ' ').trim().slice(0, 180),
      })
    }
  }
  return findings
}

export function listMigrationSqlFiles(migrationsDir = MIGRATIONS_DIR) {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => join(migrationsDir, name))
    .sort()
}

export function scanMigrationFiles(files = listMigrationSqlFiles()) {
  const findings = []
  for (const path of files) {
    const name = path.split(/[/\\]/).at(-1)
    findings.push(...findInvalidUpdateTargetFunctionRefs(readFileSync(path, 'utf8'), name))
  }
  return findings
}

export function verificationMigrationsRollBack(files = listMigrationSqlFiles()) {
  return files
    .filter((path) => /_verify\.sql$/i.test(path))
    .map((path) => {
      const sql = readFileSync(path, 'utf8')
      const name = path.split(/[/\\]/).at(-1)
      const hasBegin = /^\s*begin\s*;/im.test(sql)
      const hasRollback = /^\s*rollback\s*;/im.test(sql)
      return { name, hasBegin, hasRollback, ok: hasBegin && hasRollback }
    })
}

function psqlAvailable() {
  return spawnSync('which', ['psql'], { encoding: 'utf8' }).status === 0
}

export function assertLocalPsqlAvailable() {
  if (!psqlAvailable()) {
    throw new Error('psql is required for disposable local migration regression tests')
  }
}

function runPsql({ database, file, sql }) {
  const args = [
    '-v',
    'ON_ERROR_STOP=1',
    '-h',
    DEFAULT_PG.host,
    '-p',
    String(DEFAULT_PG.port),
    '-U',
    DEFAULT_PG.user,
    '-d',
    database,
  ]
  if (file) args.push('-f', file)
  return spawnSync('psql', args, {
    encoding: 'utf8',
    input: file ? undefined : sql,
    env: {
      ...process.env,
      PGPASSWORD: process.env.CW_MIG_PGPASSWORD || process.env.PGPASSWORD || '',
    },
  })
}

export function recreateDisposableDatabase(dbName) {
  assertLocalPsqlAvailable()
  if (!/^[a-z][a-z0-9_]*$/i.test(dbName)) {
    throw new Error(`refusing unsafe database name: ${dbName}`)
  }
  const drop = runPsql({
    database: 'postgres',
    sql: `
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${dbName}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS ${dbName};
CREATE DATABASE ${dbName};
`,
  })
  if (drop.status !== 0) {
    throw new Error(`failed to recreate ${dbName}: ${drop.stderr || drop.stdout}`)
  }
  // Model hosted Supabase: roles + pgcrypto living only in `extensions`
  // (not on the default public search_path).
  const bootstrap = runPsql({
    database: dbName,
    sql: `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pgcrypto;
CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
-- Keep session search_path free of extensions so unqualified digest()/hmac()
-- fail the same way they do on hosted Supabase SECURITY DEFINER RPCs.
SELECT set_config('search_path', 'public, pg_catalog', false);
`,
  })
  if (bootstrap.status !== 0) {
    throw new Error(`failed to bootstrap ${dbName}: ${bootstrap.stderr || bootstrap.stdout}`)
  }
}

export function dropDisposableDatabase(dbName) {
  if (!/^[a-z][a-z0-9_]*$/i.test(dbName)) return
  runPsql({
    database: 'postgres',
    sql: `
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${dbName}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS ${dbName};
`,
  })
}

export function applySqlFile(database, filePath) {
  if (!existsSync(filePath)) throw new Error(`missing SQL file: ${filePath}`)
  const result = runPsql({ database, file: filePath })
  if (result.status !== 0) {
    throw new Error(
      `psql failed applying ${filePath} to ${database}:\n${result.stderr || result.stdout}`,
    )
  }
  return result
}

export function applySql(database, sql) {
  const dir = mkdtempSync(join(tmpdir(), 'cw-mig-'))
  const file = join(dir, 'stmt.sql')
  try {
    writeFileSync(file, sql, 'utf8')
    return applySqlFile(database, file)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

export function queryTuples(database, sql) {
  const result = spawnSync(
    'psql',
    [
      '-v',
      'ON_ERROR_STOP=1',
      '-h',
      DEFAULT_PG.host,
      '-p',
      String(DEFAULT_PG.port),
      '-U',
      DEFAULT_PG.user,
      '-d',
      database,
      '-At',
      '-F',
      '|',
      '-c',
      sql,
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        PGPASSWORD: process.env.CW_MIG_PGPASSWORD || process.env.PGPASSWORD || '',
      },
    },
  )
  if (result.status !== 0) {
    throw new Error(`query failed: ${result.stderr || result.stdout}`)
  }
  return result.stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split('|'))
}

/** Minimal pre-hardening purchases table (pgcrypto already in extensions). */
export const LEGACY_PURCHASES_SCHEMA = `
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  order_id text not null,
  host text,
  ab_variant integer,
  product_id text,
  access_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);
`

const PGCRYPTO_CALLEES = ['digest', 'hmac', 'crypt', 'gen_salt', 'gen_random_bytes']

/**
 * Find unqualified pgcrypto calls in SQL whose resolution depends on search_path.
 * Allows `extensions.<fn>(...)` and skips comments.
 */
export function findUnqualifiedPgcryptoCalls(sql, fileLabel = 'sql') {
  const findings = []
  const lines = sql.split('\n')
  let inBlockComment = false
  for (let i = 0; i < lines.length; i += 1) {
    let line = lines[i]
    if (inBlockComment) {
      const end = line.indexOf('*/')
      if (end === -1) continue
      line = line.slice(end + 2)
      inBlockComment = false
    }
    while (line.includes('/*')) {
      const start = line.indexOf('/*')
      const end = line.indexOf('*/', start + 2)
      if (end === -1) {
        line = line.slice(0, start)
        inBlockComment = true
        break
      }
      line = `${line.slice(0, start)}${line.slice(end + 2)}`
    }
    const code = line.replace(/--.*$/, '')
    for (const fn of PGCRYPTO_CALLEES) {
      const re = new RegExp(String.raw`(^|[^.\w])${fn}\s*\(`, 'gi')
      if (re.test(code)) {
        findings.push({ file: fileLabel, line: i + 1, fn, excerpt: code.trim().slice(0, 160) })
      }
    }
  }
  return findings
}

export function scanMigrationsForUnqualifiedPgcrypto(files = listMigrationSqlFiles()) {
  const findings = []
  for (const path of files) {
    const name = path.split(/[/\\]/).at(-1)
    findings.push(...findUnqualifiedPgcryptoCalls(readFileSync(path, 'utf8'), name))
  }
  return findings
}

export function seedLegacyPurchasesSql() {
  const skuRows = Object.keys(EXPECTED_ENTITLEMENTS)
    .map((sku) => `('legacy@example.invalid', 'txn_LEGACY_${sku}', '${sku}')`)
    .join(',\n  ')
  return `
insert into public.purchases (email, order_id, product_id)
values
  ${skuRows};
`
}
