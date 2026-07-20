/**
 * Seed ChronoWalk Rome one-time products + prices in Paddle sandbox (or live).
 *
 * Prerequisites:
 *   export PADDLE_API_KEY=pdl_sdbx_apikey_...   # Developer tools → Authentication
 *   export PADDLE_ENV=sandbox                  # or production
 *
 * Run:
 *   node scripts/seed-paddle-catalog.mjs
 *
 * Paste the printed VITE_PADDLE_PRICE_* values into .env.local / Cloudflare Pages.
 */

import { Environment, Paddle } from '@paddle/paddle-node-sdk'

const apiKey = process.env.PADDLE_API_KEY
if (!apiKey) {
  console.error('Set PADDLE_API_KEY (sandbox or live API key from Paddle → Authentication).')
  process.exit(1)
}

const envName = String(process.env.PADDLE_ENV ?? 'sandbox').toLowerCase()
const environment =
  envName === 'production' || envName === 'live'
    ? Environment.production
    : Environment.sandbox

const paddle = new Paddle(apiKey, { environment })

const CATALOG = [
  {
    tierId: 'rome-central',
    name: 'ChronoWalk · Roma Historica',
    description: 'Central Rome walking tour — Trajan, Pantheon, centro storico.',
    amount: '999',
    envKey: 'VITE_PADDLE_PRICE_ROME_CENTRAL',
  },
  {
    tierId: 'rome-essential',
    name: 'ChronoWalk · Roma Antica',
    description: 'Ancient core — Colosseum, Forum, Palatine, Capitoline, Circus Maximus.',
    amount: '999',
    envKey: 'VITE_PADDLE_PRICE_ROME_ESSENTIAL',
  },
  {
    tierId: 'rome-complete',
    name: 'ChronoWalk · Roma Eterna',
    description: 'Full Rome bundle — Historica + Antica in one walk.',
    amount: '1499',
    envKey: 'VITE_PADDLE_PRICE_ROME_COMPLETE',
  },
]

async function seed() {
  const results = []

  for (const item of CATALOG) {
    const product = await paddle.products.create({
      name: item.name,
      taxCategory: 'standard',
      description: item.description,
      customData: { chronowalk_tier: item.tierId },
    })

    const price = await paddle.prices.create({
      productId: product.id,
      description: `${item.name} · one-time EUR`,
      unitPrice: { amount: item.amount, currencyCode: 'EUR' },
      // one-time: omit billingCycle
      customData: { chronowalk_tier: item.tierId },
    })

    results.push({
      tierId: item.tierId,
      productId: product.id,
      priceId: price.id,
      envKey: item.envKey,
      amountEur: (Number(item.amount) / 100).toFixed(2),
    })
  }

  console.log('\nCreated Paddle catalog:\n')
  console.log(JSON.stringify(results, null, 2))
  console.log('\nAdd to .env.local / Cloudflare Pages:\n')
  console.log(`VITE_PADDLE_ENV=${environment === Environment.production ? 'production' : 'sandbox'}`)
  console.log('VITE_PADDLE_CLIENT_TOKEN=test_...   # from Paddle → Authentication → Client-side tokens')
  for (const row of results) {
    console.log(`${row.envKey}=${row.priceId}`)
  }
  console.log('')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
