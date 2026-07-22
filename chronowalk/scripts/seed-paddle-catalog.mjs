/**
 * Seed ChronoWalk five-product one-time EUR catalog in Paddle.
 *
 * Dry-run by default. Never prints API keys. Do not run from Cursor agents —
 * operators run this locally with an explicit environment + --execute.
 *
 *   export PADDLE_API_KEY=pdl_sdbx_apikey_...
 *   export PADDLE_ENV=sandbox   # or production
 *   node scripts/seed-paddle-catalog.mjs
 *   node scripts/seed-paddle-catalog.mjs --execute --env=sandbox
 */

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Environment, Paddle } from '@paddle/paddle-node-sdk'
import {
  LAUNCH_CATALOG_METADATA_KEY,
  LAUNCH_CATALOG_PRODUCTS,
  LAUNCH_CATALOG_TAX_CATEGORY,
} from './lib/launchCatalog.gen.mjs'

export const STABLE_META_KEY = LAUNCH_CATALOG_METADATA_KEY

export function parseSeedArgs(argv = process.argv.slice(2)) {
  const execute = argv.includes('--execute')
  const envFlag = argv.find((a) => a.startsWith('--env='))
  const envFromFlag = envFlag ? envFlag.slice('--env='.length).toLowerCase() : null
  const envName = String(envFromFlag ?? process.env.PADDLE_ENV ?? 'sandbox').toLowerCase()
  const production = envName === 'production' || envName === 'live'
  return {
    execute,
    envName: production ? 'production' : 'sandbox',
    production,
  }
}

export function assertEnvironmentGuard({ execute, envName, envFlagPresent }) {
  if (!execute) return { ok: true }
  if (!envFlagPresent) {
    return {
      ok: false,
      reason: 'execute_requires_explicit_env',
      message: 'Refusing --execute without explicit --env=sandbox or --env=production',
    }
  }
  if (envName !== 'sandbox' && envName !== 'production') {
    return { ok: false, reason: 'invalid_env', message: `Unknown env ${envName}` }
  }
  return { ok: true }
}

export function catalogPlan(products = LAUNCH_CATALOG_PRODUCTS) {
  return products.map((p) => ({
    productId: p.productId,
    name: p.paddleProductName,
    description: p.description,
    amount: String(p.amountCents),
    amountCents: p.amountCents,
    contentProductId: p.contentProductId,
    seatLimit: p.seatLimit,
    kind: p.kind,
    clientEnvKey: p.clientEnvKey,
    serverEnvKey: p.serverEnvKey,
    customData: {
      [STABLE_META_KEY]: p.productId,
      chronowalk_tier: p.productId, // legacy alias for discovery
    },
  }))
}

export function indexExistingBySku(products = [], prices = []) {
  /** @type {Map<string, { products: any[], prices: any[] }>} */
  const bySku = new Map()
  for (const product of products) {
    const sku =
      product?.customData?.[STABLE_META_KEY] ??
      product?.custom_data?.[STABLE_META_KEY] ??
      product?.customData?.chronowalk_tier ??
      product?.custom_data?.chronowalk_tier
    if (!sku) continue
    const bucket = bySku.get(sku) ?? { products: [], prices: [] }
    bucket.products.push(product)
    bySku.set(sku, bucket)
  }
  for (const price of prices) {
    const sku =
      price?.customData?.[STABLE_META_KEY] ??
      price?.custom_data?.[STABLE_META_KEY] ??
      price?.customData?.chronowalk_tier ??
      price?.custom_data?.chronowalk_tier
    if (!sku) continue
    const bucket = bySku.get(sku) ?? { products: [], prices: [] }
    bucket.prices.push(price)
    bySku.set(sku, bucket)
  }
  return bySku
}

export function resolveSeedActions(plan, existingBySku) {
  const actions = []
  for (const item of plan) {
    const existing = existingBySku.get(item.productId) ?? { products: [], prices: [] }
    if (existing.products.length > 1 || existing.prices.length > 1) {
      return {
        ok: false,
        reason: 'ambiguous_duplicate',
        sku: item.productId,
        message: `Ambiguous duplicates for ${item.productId}: ${existing.products.length} products, ${existing.prices.length} prices`,
      }
    }
    const product = existing.products[0] ?? null
    const price = existing.prices[0] ?? null
    if (product && price) {
      const amount = price.unitPrice?.amount ?? price.unit_price?.amount
      const currency = price.unitPrice?.currencyCode ?? price.unit_price?.currency_code
      const billing = price.billingCycle ?? price.billing_cycle
      if (billing != null) {
        return {
          ok: false,
          reason: 'unexpected_recurring',
          sku: item.productId,
          message: `${item.productId} has a billing cycle; expected one-time`,
        }
      }
      actions.push({
        sku: item.productId,
        action: 'reuse',
        productId: product.id,
        priceId: price.id,
        amountMatch: String(amount) === item.amount && currency === 'EUR',
        clientEnvKey: item.clientEnvKey,
        serverEnvKey: item.serverEnvKey,
      })
      continue
    }
    if (product && !price) {
      actions.push({
        sku: item.productId,
        action: 'create_price',
        productId: product.id,
        item,
      })
      continue
    }
    if (!product && price) {
      return {
        ok: false,
        reason: 'orphaned_price',
        sku: item.productId,
        message: `Price exists without product for ${item.productId}`,
      }
    }
    actions.push({ sku: item.productId, action: 'create_both', item })
  }
  return { ok: true, actions }
}

export function formatEnvOutput(rows, envName) {
  const lines = [
    `VITE_PADDLE_ENV=${envName}`,
    '# VITE_PADDLE_CLIENT_TOKEN=test_...  # from Paddle → Authentication → Client-side tokens',
  ]
  for (const row of rows) {
    lines.push(`${row.clientEnvKey}=${row.priceId}`)
  }
  lines.push('# Server / Supabase Edge secrets:')
  for (const row of rows) {
    lines.push(`${row.serverEnvKey}=${row.priceId}`)
  }
  return lines.join('\n')
}

async function listAll(paddle, resource) {
  const out = []
  const collection = paddle[resource].list({ perPage: 50 })
  // SDK collection supports async iteration in recent versions; fall back to .next()
  if (collection?.[Symbol.asyncIterator]) {
    for await (const page of collection) {
      const rows = Array.isArray(page) ? page : page?.data ?? []
      out.push(...rows)
    }
    return out
  }
  let cursor = collection
  while (cursor) {
    const page = await cursor.next()
    const rows = Array.isArray(page) ? page : page?.data ?? []
    out.push(...rows)
    if (!cursor.hasMore || !cursor.hasMore()) break
  }
  return out
}

export async function planCatalogSeed({ paddle, execute = false }) {
  const plan = catalogPlan()
  let products = []
  let prices = []
  try {
    products = await listAll(paddle, 'products')
    prices = await listAll(paddle, 'prices')
  } catch (err) {
    return {
      ok: false,
      reason: 'list_failed',
      message: err instanceof Error ? err.message : String(err),
    }
  }
  const existingBySku = indexExistingBySku(products, prices)
  const resolved = resolveSeedActions(plan, existingBySku)
  if (!resolved.ok) return resolved

  return {
    ok: true,
    execute,
    actions: resolved.actions,
    plan,
  }
}

async function executeActions(paddle, actions) {
  const rows = []
  for (const action of actions) {
    if (action.action === 'reuse') {
      rows.push({
        productId: action.sku,
        paddleProductId: action.productId,
        priceId: action.priceId,
        clientEnvKey: action.clientEnvKey,
        serverEnvKey: action.serverEnvKey,
        reused: true,
      })
      continue
    }

    let productId = action.productId
    const item = action.item
    if (action.action === 'create_both') {
      const product = await paddle.products.create({
        name: item.name,
        taxCategory: LAUNCH_CATALOG_TAX_CATEGORY,
        description: item.description,
        customData: item.customData,
      })
      productId = product.id
    }

    const price = await paddle.prices.create({
      productId,
      description: `${item.name} · one-time EUR`,
      unitPrice: { amount: item.amount, currencyCode: 'EUR' },
      // one-time: omit billingCycle
      quantity: { minimum: 1, maximum: 1 },
      customData: item.customData,
    })

    rows.push({
      productId: item.productId,
      paddleProductId: productId,
      priceId: price.id,
      clientEnvKey: item.clientEnvKey,
      serverEnvKey: item.serverEnvKey,
      reused: false,
    })
  }
  return rows
}

async function main() {
  const argv = process.argv.slice(2)
  const parsed = parseSeedArgs(argv)
  const envFlagPresent = argv.some((a) => a.startsWith('--env='))
  const guard = assertEnvironmentGuard({
    execute: parsed.execute,
    envName: parsed.envName,
    envFlagPresent,
  })
  if (!guard.ok) {
    console.error(guard.message)
    process.exit(1)
  }

  const apiKey = process.env.PADDLE_API_KEY
  if (!apiKey) {
    console.error('Set PADDLE_API_KEY (never commit it).')
    process.exit(1)
  }
  // Never print the key
  void apiKey

  const paddle = new Paddle(apiKey, {
    environment: parsed.production ? Environment.production : Environment.sandbox,
  })

  const planned = await planCatalogSeed({ paddle, execute: parsed.execute })
  if (!planned.ok) {
    console.error(planned.message ?? planned.reason)
    process.exit(1)
  }

  console.log(`Paddle catalog seed (${parsed.envName}) — ${parsed.execute ? 'EXECUTE' : 'DRY-RUN'}`)
  console.log(`Plan: ${planned.actions.length} SKUs`)
  for (const action of planned.actions) {
    console.log(`  - ${action.sku}: ${action.action}${action.priceId ? ` (${action.priceId})` : ''}`)
  }

  if (!parsed.execute) {
    console.log('\nDry-run only. Re-run with --execute --env=sandbox|production to apply.')
    return
  }

  const rows = await executeActions(paddle, planned.actions)
  console.log('\nCatalog ready (no secrets printed):\n')
  console.log(formatEnvOutput(rows, parsed.envName))
  console.log('')
}

const thisFile = fileURLToPath(import.meta.url)
const invokedAs = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedAs && thisFile === invokedAs) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
