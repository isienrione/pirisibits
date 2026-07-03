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
  '16130F',
  '211C15',
  '26221B',
  'F7F1E6',
  'F5EFE3',
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
  '#D4AF37',
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

function stripComments(line) {
  return line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
}

function checkForbiddenSubstrings(rel, line, lineNo, violations) {
  if (SKIP_FILES.has(rel)) return

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
  if (SKIP_FILES.has(rel)) return

  const hasClassOrStyle = /\bclassName\s*=/.test(line) || /\bstyle\s*=/.test(line)
  if (!hasClassOrStyle) return

  const hexMatches = line.matchAll(/#([0-9a-fA-F]{6})\b/g)
  for (const match of hexMatches) {
    const hex = match[1].toUpperCase()
    if (!APPROVED_HEX.has(hex)) {
      violations.push(`${rel}:${lineNo}: unapproved hex #${hex} in className/style`)
    }
  }
}

function main() {
  const violations = []

  for (const { full, rel } of walk(SRC_ROOT)) {
    const lines = readFileSync(full, 'utf8').split('\n')
    lines.forEach((line, index) => {
      const lineNo = index + 1
      checkForbiddenSubstrings(rel, line, lineNo, violations)
      checkJsxHex(rel, line, lineNo, violations)
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
