/**
 * ChronoWalk Launch Offer — temporary promotional pricing layer.
 *
 * Canonical base prices and entitlements stay in commerce/launchCatalog.json.
 * This module only controls display pricing + Paddle discountId at checkout.
 *
 * Kill switch: set LAUNCH_OFFER_ACTIVE to false (or __setLaunchOfferActiveForTests(false)).
 */

import { LAUNCH_CATALOG_BY_ID } from './generated/launchCatalog.gen.js'

export const LAUNCH_OFFER_ID = 'launch_offer'
export const LAUNCH_OFFER_LABEL = 'Launch offer'
export const LAUNCH_OFFER_SUPPORTING = 'Introductory pricing for early walkers.'

/**
 * Master kill switch. When false:
 * - no discountId passed to Paddle
 * - no promotional / strike-through UI
 * - JSON-LD returns to base prices
 */
export const LAUNCH_OFFER_ACTIVE = true

/**
 * Promotional amounts per SKU (cents). Base amounts come from the catalog.
 *
 * `discountId` is the live Paddle catalog discount baked into the client.
 * Optional `VITE_PADDLE_DISCOUNT_*` env vars override these (Cloudflare / .env.local).
 *
 * Mapping (do not invert — both solo packs are €9.99 base):
 *   rome-central  = Roma Historica
 *   rome-essential = Roma Antica
 */
export const LAUNCH_OFFER_BY_SKU = Object.freeze({
  'rome-central': Object.freeze({
    promoCents: 499,
    discountCents: 500,
    discountId: 'dsc_01kzhm7jeghbrygas2faa33mfr',
    discountEnvKey: 'VITE_PADDLE_DISCOUNT_ROME_CENTRAL',
  }),
  'rome-essential': Object.freeze({
    promoCents: 699,
    discountCents: 300,
    discountId: 'dsc_01kzhm3jvfcsde2t57syqw8d60',
    discountEnvKey: 'VITE_PADDLE_DISCOUNT_ROME_ESSENTIAL',
  }),
  'rome-complete': Object.freeze({
    promoCents: 1000,
    discountCents: 499,
    discountId: 'dsc_01kzhm1a03hzjmskcx3w1g5c20',
    discountEnvKey: 'VITE_PADDLE_DISCOUNT_ROME_COMPLETE',
  }),
  'rome-couple': Object.freeze({
    promoCents: 1700,
    discountCents: 800,
    discountId: 'dsc_01kzhmaacq0xvpevgyfqxw37d0',
    discountEnvKey: 'VITE_PADDLE_DISCOUNT_ROME_COUPLE',
  }),
  'rome-family': Object.freeze({
    promoCents: 2500,
    discountCents: 1000,
    discountId: 'dsc_01kzhmbv727802sfj92tjr057r',
    discountEnvKey: 'VITE_PADDLE_DISCOUNT_ROME_FAMILY',
  }),
})

/** @type {boolean | null} */
let activeOverrideForTests = null

/** Test helper — pass null to clear. */
export function __setLaunchOfferActiveForTests(value) {
  activeOverrideForTests = value == null ? null : Boolean(value)
}

export function isLaunchOfferActive() {
  if (activeOverrideForTests != null) return activeOverrideForTests
  return LAUNCH_OFFER_ACTIVE === true
}

/** Format EUR cents for display (€10, €4.99). */
export function formatEurFromCents(cents) {
  const value = Number(cents)
  if (!Number.isFinite(value)) return '€-'
  const amount = value / 100
  return `€${Number.isInteger(amount) ? amount : amount.toFixed(2)}`
}

/**
 * Resolve Paddle discount id (dsc_…) for a SKU when the offer is active.
 * Prefers VITE_PADDLE_DISCOUNT_* when set; otherwise the baked-in catalog id.
 * @param {string | null | undefined} sku
 * @param {{ env?: Record<string, string | undefined> }} [options]
 */
export function resolveLaunchDiscountId(sku, options = {}) {
  if (!isLaunchOfferActive() || !sku) return null
  const row = LAUNCH_OFFER_BY_SKU[sku]
  if (!row) return null

  const bakedIn = String(row.discountId ?? '').trim() || null

  if (Object.prototype.hasOwnProperty.call(options, 'env')) {
    const bag = options.env && typeof options.env === 'object' ? options.env : {}
    return String(bag[row.discountEnvKey] ?? '').trim() || bakedIn
  }

  return String(import.meta.env[row.discountEnvKey] ?? '').trim() || bakedIn
}

/**
 * Full pricing snapshot for a SKU.
 * @param {string | null | undefined} sku
 * @param {{ env?: Record<string, string | undefined> }} [options]
 */
export function getLaunchOfferPricing(sku, options = {}) {
  if (!sku) return null
  const catalog = LAUNCH_CATALOG_BY_ID[sku]
  const promo = LAUNCH_OFFER_BY_SKU[sku]
  if (!catalog || !promo) return null

  const active = isLaunchOfferActive()
  const baseCents = catalog.amountCents
  const promoCents = promo.promoCents
  const discountCents = promo.discountCents
  const discountId = active ? resolveLaunchDiscountId(sku, options) : null

  return {
    sku,
    active,
    label: LAUNCH_OFFER_LABEL,
    supporting: LAUNCH_OFFER_SUPPORTING,
    promotion: LAUNCH_OFFER_ID,
    baseCents,
    promoCents,
    discountCents,
    effectiveCents: active ? promoCents : baseCents,
    baseLabel: formatEurFromCents(baseCents),
    promoLabel: formatEurFromCents(promoCents),
    effectiveLabel: formatEurFromCents(active ? promoCents : baseCents),
    discountId,
    discountEnvKey: promo.discountEnvKey,
  }
}

/** Effective checkout/display cents for a SKU (promo when active, else base). */
export function getEffectivePriceCents(sku, fallbackCents) {
  const pricing = getLaunchOfferPricing(sku)
  if (pricing?.active) return pricing.promoCents
  if (Number.isFinite(Number(fallbackCents))) return Number(fallbackCents)
  return pricing?.baseCents ?? null
}

/** Analytics extras for checkout-facing events. */
export function launchOfferAnalyticsProps(sku) {
  const pricing = getLaunchOfferPricing(sku)
  if (!pricing?.active) return {}
  return {
    promotion: LAUNCH_OFFER_ID,
    base_price_eur: pricing.baseCents / 100,
    discount_amount_eur: pricing.discountCents / 100,
    effective_price_eur: pricing.promoCents / 100,
  }
}

/**
 * Entry-price CTA during Launch Offer — anchors on the lowest walk (Historica €4.99).
 * When the offer is off, keep the prior “from €9.99” floor.
 */
export function getLaunchOfferHeroUnlockCta() {
  if (!isLaunchOfferActive()) return 'Unlock from €9.99'
  return 'Try a tour from €4.99'
}

/** Short mobile hero label. */
export function getLaunchOfferHeroUnlockShortCta() {
  if (!isLaunchOfferActive()) return 'Unlock from €9.99'
  return 'Try from €4.99'
}

/** Nav CTA with Launch Offer floor price. */
export function getLaunchOfferNavCta() {
  if (!isLaunchOfferActive()) return 'Get the tour'
  return 'Try a tour from €4.99'
}

/** Short nav CTA for tight headers. */
export function getLaunchOfferNavShortCta() {
  if (!isLaunchOfferActive()) return 'Get Tour'
  return 'Try from €4.99'
}

/**
 * Structured hero unlock price parts for scratched-base disclosure UI.
 * Null when Launch Offer is on — entry CTAs use plain “from €4.99” copy instead
 * of scratching the Eterna list price (which reads as €10, not the floor).
 */
export function getLaunchOfferHeroPriceParts() {
  return null
}

/**
 * Bundle savings against current individual Roma Eterna price.
 * During launch offer: Eterna = €10 → Couple saves €3, Family saves €15 at 4 seats.
 */
export function getLaunchOfferBundleCopy(sku) {
  const eterna = getEffectivePriceCents('rome-complete', 1499)
  const pricing = getLaunchOfferPricing(sku)
  if (!pricing) return null

  if (sku === 'rome-couple') {
    const vsTwo = eterna * 2 - pricing.effectiveCents
    return {
      badge: pricing.active ? LAUNCH_OFFER_LABEL : 'Save €4.98',
      perPerson: formatEurFromCents(Math.round(pricing.effectiveCents / 2)) + ' per person',
      savingsLine:
        vsTwo > 0
          ? `Save ${formatEurFromCents(vsTwo)} vs two individual Roma Eterna walks`
          : null,
    }
  }

  if (sku === 'rome-family') {
    const vsFour = eterna * 4 - pricing.effectiveCents
    const perFour = Math.round(pricing.effectiveCents / 4)
    return {
      badge: pricing.active ? LAUNCH_OFFER_LABEL : 'Save up to €24.96',
      perPerson: `${formatEurFromCents(perFour)}/person for four`,
      savingsLine:
        vsFour > 0
          ? `Save ${formatEurFromCents(vsFour)} vs four individual Roma Eterna walks`
          : null,
    }
  }

  return null
}

/**
 * Enrich a ROME_TIERS / ROME_BUNDLES offer for UI display.
 * Base catalog / landingData objects stay untouched.
 * @template {Record<string, any>} T
 * @param {T} offer
 * @returns {T}
 */
export function applyLaunchOfferToOffer(offer) {
  if (!offer?.id) return offer
  const pricing = getLaunchOfferPricing(offer.id)
  if (!pricing?.active) {
    return {
      ...offer,
      launchOffer: false,
      basePrice: undefined,
      basePriceCents: undefined,
      offerLabel: undefined,
      saveLabel: undefined,
    }
  }

  const bundleCopy = getLaunchOfferBundleCopy(offer.id)
  /** @type {Record<string, any>} */
  const next = {
    ...offer,
    launchOffer: true,
    priceCents: pricing.promoCents,
    price: pricing.promoLabel,
    basePrice: pricing.baseLabel,
    basePriceCents: pricing.baseCents,
    offerLabel: LAUNCH_OFFER_LABEL,
    saveLabel: `Save ${formatEurFromCents(pricing.discountCents)}`,
  }

  if (offer.id === 'rome-complete') {
    next.featuredBullet = LAUNCH_OFFER_SUPPORTING
  }

  if (bundleCopy) {
    if (bundleCopy.badge) next.badge = bundleCopy.badge
    if (bundleCopy.perPerson) next.perPerson = bundleCopy.perPerson
    if (bundleCopy.savingsLine) next.savingsLine = bundleCopy.savingsLine
  } else if (!offer.badge) {
    next.badge = LAUNCH_OFFER_LABEL
  }

  return /** @type {T} */ (next)
}

export function mapOffersWithLaunchOffer(offers) {
  if (!Array.isArray(offers)) return []
  return offers.map((offer) => applyLaunchOfferToOffer(offer))
}
