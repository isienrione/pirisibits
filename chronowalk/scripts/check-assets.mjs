#!/usr/bin/env node
/**
 * Fails CI when landing-referenced optimized assets exceed 400 KB.
 *
 * Usage: npm run check:assets
 */
import { statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicRoot = join(root, 'public')
const MAX_BYTES = 400 * 1024

function sizeKb(bytes) {
  return Math.round(bytes / 1024)
}

async function main() {
  const moduleUrl = pathToFileURL(join(root, 'src/landing/landingAssetCheckPaths.js')).href
  const { getLandingAssetCheckPaths } = await import(moduleUrl)
  const assetPaths = getLandingAssetCheckPaths()
  const violations = []

  for (const assetPath of assetPaths) {
    const diskPath = join(publicRoot, assetPath.replace(/^\//, ''))
    let size
    try {
      size = statSync(diskPath).size
    } catch {
      violations.push(`${assetPath}: missing on disk (${diskPath})`)
      continue
    }

    if (size > MAX_BYTES) {
      violations.push(`${assetPath}: ${sizeKb(size)} KB (max ${sizeKb(MAX_BYTES)} KB)`)
    }
  }

  if (violations.length) {
    console.error('Landing asset size violations:\n')
    for (const v of violations) {
      console.error(`  ${v}`)
    }
    console.error(`\n${violations.length} violation(s). Run npm run optimize:images`)
    process.exit(1)
  }

  console.log(`check:assets passed (${assetPaths.length} landing asset(s) ≤ 400 KB)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
