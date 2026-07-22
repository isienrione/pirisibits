#!/usr/bin/env node
/**
 * Tracked-data safety gate — fail CI if real customer / credential material
 * appears in git-tracked files.
 *
 * Usage: npm run check:sensitive-data
 *
 * Scans `git ls-files` (never walks node_modules / dist).
 */
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const EXAMPLE_ACCESS_TOKEN = '00000000-0000-4000-8000-000000000000'

/** Public support / product addresses that may appear in tracked docs and UI. */
export const ALLOWED_SUPPORT_EMAILS = new Set([
  'support@chronowalk.com',
  'hello@chronowalk.com',
  'access@chronowalk.com',
  'hello@chronowalk.app',
])

const UUID_RE =
  '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

const ACCESS_TOKEN_URL_RE = new RegExp(`/access\\?token=(${UUID_RE})`, 'gi')
const SQL_ACCESS_TOKEN_UUID_RE = new RegExp(
  `'(${UUID_RE})'\\s*::\\s*uuid`,
  'gi',
)
const EMAIL_RE =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

/** Real-looking secret material (placeholders with `...` / short stubs are ignored). */
const PADDLE_API_KEY_RE = /\bpdl_(?:live|sdbx)_apikey_[A-Za-z0-9]{16,}\b/g
const RESEND_API_KEY_RE = /\bre_[A-Za-z0-9]{20,}\b/g
const SUPABASE_JWT_RE =
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g

const SKIP_PATH_RE = /(?:^|\/)(?:node_modules|dist|dist-ssr)(?:\/|$)/

function isBinaryPath(filePath) {
  return /\.(png|jpe?g|gif|webp|avif|ico|mp3|mp4|webm|woff2?|ttf|eot|pdf|zip|gz)$/i.test(
    filePath,
  )
}

export function isAllowedEmail(email) {
  const normalized = String(email).trim().toLowerCase()
  if (!normalized) return false
  if (ALLOWED_SUPPORT_EMAILS.has(normalized)) return true
  if (normalized.endsWith('@example.invalid')) return true
  return false
}

export function isSqlOrRecoveryFixture(filePath) {
  const lower = filePath.replace(/\\/g, '/').toLowerCase()
  if (lower.endsWith('.sql')) return true
  return /(?:^|\/)(?:recover|backfill|incident)[^/]*$/i.test(lower)
}

function lineNumberAt(content, index) {
  let line = 1
  for (let i = 0; i < index && i < content.length; i += 1) {
    if (content[i] === '\n') line += 1
  }
  return line
}

function pushFinding(findings, filePath, content, index, rule, detail) {
  findings.push({
    file: filePath,
    line: lineNumberAt(content, index),
    rule,
    detail,
  })
}

/**
 * Scan a single file's text content. Returns findings (empty = clean).
 * @param {string} filePath
 * @param {string} content
 */
export function scanContent(filePath, content) {
  const findings = []
  if (content == null || content === '') return findings

  for (const match of content.matchAll(ACCESS_TOKEN_URL_RE)) {
    const token = match[1]
    if (token.toLowerCase() === EXAMPLE_ACCESS_TOKEN) continue
    pushFinding(
      findings,
      filePath,
      content,
      match.index ?? 0,
      'access_token_url',
      'Bearer unlock URL with a concrete UUID token',
    )
  }

  if (filePath.toLowerCase().endsWith('.sql')) {
    for (const match of content.matchAll(SQL_ACCESS_TOKEN_UUID_RE)) {
      const token = match[1]
      if (token.toLowerCase() === EXAMPLE_ACCESS_TOKEN) continue
      // Only flag when the file discusses access tokens / purchases unlocks.
      if (!/access_token/i.test(content)) continue
      pushFinding(
        findings,
        filePath,
        content,
        match.index ?? 0,
        'sql_access_token_uuid',
        'Hard-coded UUID literal used as access_token',
      )
    }
  }

  for (const match of content.matchAll(PADDLE_API_KEY_RE)) {
    pushFinding(
      findings,
      filePath,
      content,
      match.index ?? 0,
      'paddle_api_key',
      'Paddle API key material',
    )
  }

  for (const match of content.matchAll(RESEND_API_KEY_RE)) {
    pushFinding(
      findings,
      filePath,
      content,
      match.index ?? 0,
      'resend_api_key',
      'Resend API key material',
    )
  }

  for (const match of content.matchAll(SUPABASE_JWT_RE)) {
    pushFinding(
      findings,
      filePath,
      content,
      match.index ?? 0,
      'supabase_jwt',
      'Supabase-style JWT / service-role key material',
    )
  }

  if (isSqlOrRecoveryFixture(filePath)) {
    for (const match of content.matchAll(EMAIL_RE)) {
      const email = match[0]
      if (isAllowedEmail(email)) continue
      pushFinding(
        findings,
        filePath,
        content,
        match.index ?? 0,
        'customer_email',
        'Non-example customer email in SQL/recovery fixture',
      )
    }
  }

  return findings
}

export function listTrackedFiles(gitRoot = process.cwd()) {
  const out = execSync('git ls-files -z', {
    cwd: gitRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  return out
    .split('\0')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !SKIP_PATH_RE.test(p))
    .filter((p) => !isBinaryPath(p))
}

export function resolveGitRoot(cwd = process.cwd()) {
  return execSync('git rev-parse --show-toplevel', {
    cwd,
    encoding: 'utf8',
  }).trim()
}

/**
 * @param {{ gitRoot?: string, files?: string[] }} [opts]
 * @returns {{ findings: Array<{file:string,line:number,rule:string,detail:string}>, scanned: number }}
 */
export function runSensitiveDataCheck(opts = {}) {
  const gitRoot = opts.gitRoot ?? resolveGitRoot()
  const files = opts.files ?? listTrackedFiles(gitRoot)
  const findings = []
  let scanned = 0

  for (const rel of files) {
    if (SKIP_PATH_RE.test(rel) || isBinaryPath(rel)) continue
    const full = join(gitRoot, rel)
    let content
    try {
      content = readFileSync(full, 'utf8')
    } catch {
      continue
    }
    scanned += 1
    findings.push(...scanContent(rel, content))
  }

  return { findings, scanned }
}

function main() {
  const { findings, scanned } = runSensitiveDataCheck()
  if (findings.length === 0) {
    console.log(`check:sensitive-data OK (${scanned} tracked text files scanned)`)
    process.exit(0)
  }

  console.error(`check:sensitive-data FAILED (${findings.length} finding(s)):`)
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line} [${f.rule}] ${f.detail}`)
  }
  process.exit(1)
}

const thisFile = fileURLToPath(import.meta.url)
const invokedAs = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedAs && thisFile === invokedAs) {
  main()
}
