#!/usr/bin/env node
/**
 * Generate audited client / Node / Edge representations of commerce/launchCatalog.json.
 * Run: node scripts/generate-commerce-consumers.mjs
 * Drift check: node scripts/generate-commerce-consumers.mjs --check
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SOURCE = join(ROOT, 'commerce/launchCatalog.json')

const TARGETS = [
  join(ROOT, 'src/lib/generated/launchCatalog.gen.js'),
  join(ROOT, 'scripts/lib/launchCatalog.gen.mjs'),
  join(ROOT, 'supabase/functions/paddle-webhook/launchCatalog.gen.js'),
]

function loadSource() {
  const raw = readFileSync(SOURCE, 'utf8')
  const catalog = JSON.parse(raw)
  if (!Array.isArray(catalog.products) || catalog.products.length !== 5) {
    throw new Error('launchCatalog.json must define exactly five products')
  }
  const ids = catalog.products.map((p) => p.productId)
  if (new Set(ids).size !== 5) throw new Error('duplicate productId in launchCatalog')
  for (const p of catalog.products) {
    if (!Number.isInteger(p.amountCents) || p.amountCents <= 0) {
      throw new Error(`invalid amountCents for ${p.productId}`)
    }
    if (!p.contentProductId || !p.seatLimit || !p.kind) {
      throw new Error(`incomplete product ${p.productId}`)
    }
    if (!p.clientEnvKey?.startsWith('VITE_PADDLE_PRICE_')) {
      throw new Error(`bad clientEnvKey for ${p.productId}`)
    }
    if (!p.serverEnvKey?.startsWith('PADDLE_PRICE_')) {
      throw new Error(`bad serverEnvKey for ${p.productId}`)
    }
  }
  const fingerprint = createHash('sha256').update(raw).digest('hex').slice(0, 16)
  return { catalog, fingerprint, raw }
}

function renderModule({ catalog, fingerprint }) {
  const products = catalog.products.map((p) => ({
    productId: p.productId,
    name: p.name,
    paddleProductName: p.paddleProductName,
    description: p.description,
    amountCents: p.amountCents,
    contentProductId: p.contentProductId,
    seatLimit: p.seatLimit,
    kind: p.kind,
    stopCount: p.stopCount,
    clientEnvKey: p.clientEnvKey,
    serverEnvKey: p.serverEnvKey,
  }))

  return `/* AUTO-GENERATED from commerce/launchCatalog.json · do not edit.
 * fingerprint: ${fingerprint}
 * Regenerate: node scripts/generate-commerce-consumers.mjs
 */
export const LAUNCH_CATALOG_FINGERPRINT = ${JSON.stringify(fingerprint)}
export const LAUNCH_CATALOG_CURRENCY = ${JSON.stringify(catalog.currency)}
export const LAUNCH_CATALOG_TAX_CATEGORY = ${JSON.stringify(catalog.taxCategory)}
export const LAUNCH_CATALOG_METADATA_KEY = ${JSON.stringify(catalog.metadataKey)}
export const LAUNCH_CATALOG_PRODUCTS = Object.freeze(${JSON.stringify(products, null, 2)})

export const LAUNCH_CATALOG_BY_ID = Object.freeze(
  Object.fromEntries(LAUNCH_CATALOG_PRODUCTS.map((p) => [p.productId, Object.freeze({ ...p })])),
)

export function entitlementForCatalogSku(productId) {
  const row = LAUNCH_CATALOG_BY_ID[productId]
  if (!row) return null
  return {
    productId: row.productId,
    contentProductId: row.contentProductId,
    seatLimit: row.seatLimit,
    kind: row.kind,
    stopCount: row.stopCount,
    name: row.name,
    amountCents: row.amountCents,
  }
}
`
}

function main() {
  const checkOnly = process.argv.includes('--check')
  const loaded = loadSource()
  const body = renderModule(loaded)

  let drifted = false
  for (const target of TARGETS) {
    mkdirSync(dirname(target), { recursive: true })
    let existing = null
    try {
      existing = readFileSync(target, 'utf8')
    } catch {
      existing = null
    }
    if (checkOnly) {
      if (existing !== body) {
        console.error(`commerce drift: ${target}`)
        drifted = true
      }
      continue
    }
    writeFileSync(target, body)
    console.log(`wrote ${target}`)
  }

  if (checkOnly) {
    if (drifted) {
      console.error('Run: node scripts/generate-commerce-consumers.mjs')
      process.exit(1)
    }
    console.log(`commerce consumers in sync (fingerprint ${loaded.fingerprint})`)
    return
  }
  console.log(`fingerprint ${loaded.fingerprint}`)
}

main()
