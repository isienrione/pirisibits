/* AUTO-GENERATED from commerce/launchCatalog.json - do not edit.
 * fingerprint: df9cbf5cb2c525e6
 * Regenerate: node scripts/generate-commerce-consumers.mjs
 */
export const LAUNCH_CATALOG_FINGERPRINT = "df9cbf5cb2c525e6"
export const LAUNCH_CATALOG_CURRENCY = "EUR"
export const LAUNCH_CATALOG_TAX_CATEGORY = "standard"
export const LAUNCH_CATALOG_METADATA_KEY = "chronowalk_sku"
export const LAUNCH_CATALOG_PRODUCTS = Object.freeze([
  {
    "productId": "rome-central",
    "name": "Roma Historica",
    "paddleProductName": "ChronoWalk · Roma Historica",
    "description": "Central Rome walking tour - Trajan, Pantheon, centro storico.",
    "amountCents": 999,
    "contentProductId": "rome-central",
    "seatLimit": 1,
    "kind": "solo",
    "stopCount": 8,
    "clientEnvKey": "VITE_PADDLE_PRICE_ROME_CENTRAL",
    "serverEnvKey": "PADDLE_PRICE_ROME_CENTRAL"
  },
  {
    "productId": "rome-essential",
    "name": "Roma Antica",
    "paddleProductName": "ChronoWalk · Roma Antica",
    "description": "Ancient core - Colosseum, Forum, Palatine, Capitoline, Circus Maximus.",
    "amountCents": 999,
    "contentProductId": "rome-essential",
    "seatLimit": 1,
    "kind": "solo",
    "stopCount": 12,
    "clientEnvKey": "VITE_PADDLE_PRICE_ROME_ESSENTIAL",
    "serverEnvKey": "PADDLE_PRICE_ROME_ESSENTIAL"
  },
  {
    "productId": "rome-complete",
    "name": "Roma Eterna",
    "paddleProductName": "ChronoWalk · Roma Eterna",
    "description": "Full Rome bundle - every ChronoWalk Rome route in one walk.",
    "amountCents": 1499,
    "contentProductId": "rome-complete",
    "seatLimit": 1,
    "kind": "solo",
    "stopCount": 21,
    "clientEnvKey": "VITE_PADDLE_PRICE_ROME_COMPLETE",
    "serverEnvKey": "PADDLE_PRICE_ROME_COMPLETE"
  },
  {
    "productId": "rome-couple",
    "name": "Couple Bundle",
    "paddleProductName": "ChronoWalk · Couple Bundle",
    "description": "Two seats · Roma Eterna content for every seat.",
    "amountCents": 2500,
    "contentProductId": "rome-complete",
    "seatLimit": 2,
    "kind": "bundle",
    "stopCount": 21,
    "clientEnvKey": "VITE_PADDLE_PRICE_ROME_COUPLE",
    "serverEnvKey": "PADDLE_PRICE_ROME_COUPLE"
  },
  {
    "productId": "rome-family",
    "name": "Family Bundle",
    "paddleProductName": "ChronoWalk · Family Bundle",
    "description": "Up to four seats · Roma Eterna content for every seat.",
    "amountCents": 3500,
    "contentProductId": "rome-complete",
    "seatLimit": 4,
    "kind": "bundle",
    "stopCount": 21,
    "clientEnvKey": "VITE_PADDLE_PRICE_ROME_FAMILY",
    "serverEnvKey": "PADDLE_PRICE_ROME_FAMILY"
  }
])

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
