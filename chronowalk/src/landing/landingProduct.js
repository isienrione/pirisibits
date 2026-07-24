/**
 * Authoritative landing product facts — prefer commerce catalog + tier stats
 * over duplicated marketing strings.
 */
import catalog from '../../commerce/launchCatalog.json'
import { getLandingTierStats } from './landingTierStats.js'
import { getLandingMonuments } from './landingMonuments.js'

export function formatEurFromCents(cents) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: catalog.currency || 'EUR',
  }).format((Number(cents) || 0) / 100)
}

export function getCatalogProduct(productId) {
  return catalog.products.find((p) => p.productId === productId) ?? null
}

function soloOffer(productId) {
  const product = getCatalogProduct(productId)
  const stats = getLandingTierStats(productId)
  if (!product) return null
  return {
    id: product.productId,
    name: product.name,
    priceCents: product.amountCents,
    priceLabel: formatEurFromCents(product.amountCents),
    stopCount: product.stopCount ?? stats.stopCount,
    seatLimit: product.seatLimit,
    kind: product.kind,
    contentProductId: product.contentProductId,
  }
}

function bundleOffer(productId) {
  const product = getCatalogProduct(productId)
  if (!product) return null
  return {
    id: product.productId,
    name: product.name,
    priceCents: product.amountCents,
    priceLabel: formatEurFromCents(product.amountCents),
    seatLimit: product.seatLimit,
    stopCount: product.stopCount,
    contentProductId: product.contentProductId,
    kind: product.kind,
  }
}

export const LANDING_PRODUCT = Object.freeze({
  currency: catalog.currency || 'EUR',
  previewMinutes: 4,
  previewLabel: 'approximately 4 minutes',
  historica: soloOffer('rome-central'),
  antica: soloOffer('rome-essential'),
  eterna: soloOffer('rome-complete'),
  couple: bundleOffer('rome-couple'),
  family: bundleOffer('rome-family'),
})

/** € delta between Roma Eterna and one shorter solo route (Historica/Antica). */
export function eternaUpgradeDeltaCents() {
  const eterna = LANDING_PRODUCT.eterna?.priceCents ?? 0
  const short = LANDING_PRODUCT.historica?.priceCents ?? 0
  return Math.max(0, eterna - short)
}

export function eternaUpgradeDeltaLabel() {
  return formatEurFromCents(eternaUpgradeDeltaCents())
}

export function getCompleteStopTitles() {
  return getLandingMonuments().map((m) => m.title)
}

export function getFeaturedRouteStops() {
  const preferred = [
    'colosseum',
    'forum-via-sacra',
    'capitoline-hill',
    'pantheon',
    'appian-way',
  ]
  const all = getLandingMonuments()
  return preferred
    .map((id) => all.find((m) => m.id === id))
    .filter(Boolean)
}

export const CHECKOUT_REASSURANCE =
  'Secure checkout by Paddle · One-time payment · Access delivered by email'

export const TAX_NOTE = 'Taxes calculated at checkout'
