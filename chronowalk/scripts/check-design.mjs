#!/usr/bin/env node
/**
 * DESIGN LAW linter — fails CI on forbidden palette / surface patterns.
 *
 * Usage: npm run check:design
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const SRC_ROOT = join(__dirname, '../src')

/** Approved 6-digit hex (from design/tokens.css). Case-insensitive. */
const APPROVED_HEX = new Set([
  '0B0B0D',
  '1A1A1F',
  'FAF6EF',
  'E9E2D5',
  '8B8638',
  '6B7A52',
  '16130F',
  '211C15',
  '26221B',
  'F7F1E6',
  'F5EFE3',
  '756C5C',
  'B9AF9C',
  'E8A13C',
  'C97F1E',
  '2A1206',
  'E4552E',
  '7C9A5C',
  '4E9B8F',
  'B14A6E',
  '4E7D9B',
  '8A6FB5',
  'B23413',
  '55703A',
  '8F5E10',
  '2F6E63',
  '963A5B',
  '3A607A',
  '6A4F96',
  'D488A4',
])

/** Banned legacy hex — must never appear outside token definition files. */
const BANNED_HEX = new Set([
  'D4AF37',
  'EDE3CF',
  'F7F3EC',
])

/** Files that may contain token definitions or law documentation. */
const SKIP_FILES = new Set([
  'design/tokens.css',
  'styles/tokens.css',
])

const FORBIDDEN_SUBSTRINGS = [
  'ivory',
  'parchment',
  'limestone',
  '#EDE3CF',
  '#F7F3EC',
  'gold-glow',
  'glass',
  'medallion',
  'bg-white',
  'bg-gray',
]

/** Tailwind slate palette — not translate-* utilities. */
const SLATE_COLOR = /(?:^|[\s"'`(,/])[\w-]*(?:deep-slate|soft-slate|slate-\d)/

const JSX_EXT = /\.(jsx|tsx)$/
const SCAN_EXT = /\.(jsx|tsx|js|ts|css)$/
const TOKENS_FILE = /\/tokens[^/]*\.(js|ts)$/
const HEX_IN_LINE = /#([0-9a-fA-F]{6})\b/g
const T_ALPHA_SUFFIX = /\$\{T\.\w+\}[0-9a-fA-F]{2}/

/** Paths using the launch-flow explorer palette (ivory/bronze) until migrated to DESIGN_LAW. */
const SKIP_PREFIXES = [
  'pages/',
  'components/journey/',
  'components/ui/',
  'design/tokens.js',
]

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const rel = relative(SRC_ROOT, full)
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules') continue
      walk(full, files)
    } else if (SCAN_EXT.test(entry)) {
      files.push({ full, rel })
    }
  }
  return files
}

function shouldSkip(rel) {
  if (SKIP_FILES.has(rel)) return true
  return SKIP_PREFIXES.some((prefix) => rel.startsWith(prefix) || rel === prefix)
}

function stripComments(line) {
  return line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
}

function checkForbiddenSubstrings(rel, line, lineNo, violations) {
  if (shouldSkip(rel)) return
  if (TOKENS_FILE.test(`/${rel}`)) return

  const content = stripComments(line)
  for (const needle of FORBIDDEN_SUBSTRINGS) {
    if (content.includes(needle)) {
      violations.push(`${rel}:${lineNo}: forbidden "${needle}"`)
    }
  }
  if (SLATE_COLOR.test(content)) {
    violations.push(`${rel}:${lineNo}: forbidden slate palette`)
  }
}

function checkJsxHex(rel, line, lineNo, violations) {
  if (!JSX_EXT.test(rel)) return
  if (shouldSkip(rel)) return

  const hasClassOrStyle = /\bclassName\s*=/.test(line) || /\bstyle\s*=/.test(line)
  if (!hasClassOrStyle) return

  const hexMatches = line.matchAll(HEX_IN_LINE)
  for (const match of hexMatches) {
    const hex = match[1].toUpperCase()
    if (BANNED_HEX.has(hex)) {
      violations.push(`${rel}:${lineNo}: banned hex #${hex} in className/style`)
    } else if (!APPROVED_HEX.has(hex)) {
      violations.push(`${rel}:${lineNo}: unapproved hex #${hex} in className/style`)
    }
  }
}

function checkTemplateLiteralStyles(rel, line, lineNo, violations) {
  if (shouldSkip(rel)) return
  if (!/style\s*=/.test(line) && !/className\s*=/.test(line)) return

  const content = stripComments(line)
  if (T_ALPHA_SUFFIX.test(content)) {
    violations.push(
      `${rel}:${lineNo}: invalid T.* hex alpha suffix — use withAlpha(T.token, 'XX') from redesign/tokens.js`,
    )
  }

  if (!/[`]/.test(content)) return

  const hexMatches = content.matchAll(HEX_IN_LINE)
  for (const match of hexMatches) {
    const hex = match[1].toUpperCase()
    if (BANNED_HEX.has(hex)) {
      violations.push(`${rel}:${lineNo}: banned hex #${hex} in template literal style`)
    }
  }
}

function checkTokensFile(rel, line, lineNo, violations) {
  if (!TOKENS_FILE.test(`/${rel}`)) return

  const content = stripComments(line)
  if (!content.includes('#')) return

  if (rel === 'redesign/tokens.js' && /#([0-9a-fA-F]{6})\b/.test(content)) {
    violations.push(`${rel}:${lineNo}: hex literal in redesign/tokens.js — use var(--token) only`)
    return
  }

  const hexMatches = content.matchAll(HEX_IN_LINE)
  for (const match of hexMatches) {
    const hex = match[1].toUpperCase()
    if (BANNED_HEX.has(hex)) {
      violations.push(`${rel}:${lineNo}: banned hex #${hex} in tokens file`)
    }
  }
}

function main() {
  const violations = []

  for (const { rel } of walk(SRC_ROOT)) {
    const lines = readFileSync(join(SRC_ROOT, rel), 'utf8').split('\n')
    lines.forEach((line, index) => {
      const lineNo = index + 1
      checkForbiddenSubstrings(rel, line, lineNo, violations)
      checkJsxHex(rel, line, lineNo, violations)
      checkTemplateLiteralStyles(rel, line, lineNo, violations)
      checkTokensFile(rel, line, lineNo, violations)
    })
  }

  if (violations.length) {
    console.error('DESIGN LAW violations:\n')
    for (const v of violations) {
      console.error(v)
    }
    console.error(`\n${violations.length} violation(s). See DESIGN_LAW.md`)
    process.exit(1)
  }

  console.log('check:design passed')
}

main()
