import {
  FREE_PREVIEW,
  LANDING_ACTS,
  LANDING_CONTENT,
  LANDING_CTA,
  ROME_BUNDLES,
  ROME_TIERS,
  getUnlockAllStopsCta,
  hostBannerPrefix,
} from './landingData.js'
import { ES_LANDING } from '../i18n/content/es/landing.js'
import { LOCALES, normalizeLocale } from '../i18n/locales.js'
import {
  ANCIENT_ROME_COPY,
  ANCIENT_ROME_FEATURED_STOP_LABELS,
  HOW_IT_WORKS_COPY,
} from './acquisition/acquisitionCopy.js'
import { HERO_PACKAGE_CARD_IMAGE_ES } from './v4/heroSlideshowData.js'

function isObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function mergeArray(base, overlay) {
  if (!Array.isArray(overlay)) return base
  if (!Array.isArray(base)) return overlay

  const overlaysById = new Map(
    overlay.filter((item) => isObject(item) && item.id).map((item) => [item.id, item]),
  )

  return base.map((item, index) => {
    const match =
      isObject(item) && item.id
        ? overlaysById.get(item.id)
        : overlay[index]
    return match == null ? item : mergeLocalized(item, match)
  })
}

/** Merge display-copy overlays while retaining all base commerce/media fields. */
export function mergeLocalized(base, overlay) {
  if (overlay == null) return base
  if (Array.isArray(base) || Array.isArray(overlay)) return mergeArray(base, overlay)
  if (!isObject(base) || !isObject(overlay)) return overlay

  const next = { ...base }
  for (const [key, value] of Object.entries(overlay)) {
    next[key] = key in base ? mergeLocalized(base[key], value) : value
  }
  return next
}

/** Translate launch-offer CTA wording without changing the embedded amount. */
export function localizeLandingPriceCopy(value, locale) {
  if (normalizeLocale(locale) !== LOCALES.ES || typeof value !== 'string') return value
  return value
    .replace(/^Try a tour from /, 'Prueba un recorrido desde ')
    .replace(/^Try from /, 'Prueba desde ')
    .replace(/^Unlock from /, 'Desbloquea desde ')
    .replace(/^Unlock all 21 stops/, 'Desbloquea las 21 paradas')
    .replace(/^Get the tour$/, 'Obtén el recorrido')
    .replace(/^Get Tour$/, 'Recorrido')
}

/**
 * Launch-offer enrichment can replace a few translated fields. Reapply only
 * those labels after enrichment; numeric and price fields are left untouched.
 */
export function localizeLandingOffers(offers, locale) {
  if (normalizeLocale(locale) !== LOCALES.ES || !Array.isArray(offers)) return offers

  return offers.map((offer) => {
    if (!offer?.launchOffer) return offer
    const discount = String(offer.saveLabel ?? '').match(/€[\d.,]+/)?.[0]
    const savings = String(offer.savingsLine ?? '').match(/€[\d.,]+/)?.[0]
    const next = {
      ...offer,
      offerLabel: 'Oferta de lanzamiento',
      saveLabel: discount ? `Ahorra ${discount}` : offer.saveLabel,
    }

    if (offer.id === 'rome-complete') {
      next.featuredBullet = 'Precio introductorio para quienes empiezan pronto.'
    } else if (offer.id === 'rome-couple') {
      next.badge = 'Oferta de lanzamiento'
      next.perPerson = offer.priceCents
        ? `€${(offer.priceCents / 200).toFixed(2).replace(/\.00$/, '')} por persona`
        : offer.perPerson
      next.savingsLine = savings
        ? `Ahorra ${savings} frente a dos recorridos Roma Eterna individuales`
        : offer.savingsLine
    } else if (offer.id === 'rome-family') {
      next.badge = 'Oferta de lanzamiento'
      next.perPerson = offer.priceCents
        ? `€${(offer.priceCents / 400).toFixed(2).replace(/\.00$/, '')} por persona entre cuatro`
        : offer.perPerson
      next.savingsLine = savings
        ? `Ahorra ${savings} frente a cuatro recorridos Roma Eterna individuales`
        : offer.savingsLine
    }

    return next
  })
}

export function getLocalizedUnlockAllStopsCta(locale) {
  return localizeLandingPriceCopy(getUnlockAllStopsCta(), locale)
}

/**
 * English returns the original source objects. Spanish is a copy overlay, so
 * IDs, routes, media, prices, cents, and checkout metadata still come from EN.
 */
export function getLocalizedLanding(locale) {
  if (normalizeLocale(locale) !== LOCALES.ES) {
    return {
      hostBannerPrefix,
      LANDING_CTA,
      FREE_PREVIEW,
      ROME_TIERS,
      ROME_BUNDLES,
      LANDING_ACTS,
      LANDING_CONTENT,
      LANDING_INTENTS: null,
    }
  }

  const cta = mergeLocalized(LANDING_CTA, ES_LANDING.LANDING_CTA)
  cta.unlockRomePriced = localizeLandingPriceCopy(LANDING_CTA.unlockRomePriced, locale)
  cta.unlockRomePricedShort = localizeLandingPriceCopy(
    LANDING_CTA.unlockRomePricedShort,
    locale,
  )
  cta.getApp = localizeLandingPriceCopy(LANDING_CTA.getApp, locale)
  cta.getAppShort = localizeLandingPriceCopy(LANDING_CTA.getAppShort, locale)

  const freePreview = mergeLocalized(FREE_PREVIEW, ES_LANDING.FREE_PREVIEW)
  const tiers = mergeLocalized(ROME_TIERS, ES_LANDING.ROME_TIERS).map((tier) => {
    const cardImage = HERO_PACKAGE_CARD_IMAGE_ES[tier.id]
    if (!cardImage) return tier
    return { ...tier, cardImage }
  })
  const bundles = mergeLocalized(ROME_BUNDLES, ES_LANDING.ROME_BUNDLES)
  const acts = mergeLocalized(LANDING_ACTS, ES_LANDING.LANDING_ACTS)
  const content = mergeLocalized(LANDING_CONTENT, ES_LANDING.LANDING_CONTENT)

  content.hero = {
    ...content.hero,
    primaryCta: cta.tryPantheonFree,
    primaryCtaAriaLabel: cta.tryPantheonFree,
    getAppCta: cta.unlockRomePriced,
    getAppCtaShort: cta.unlockRomePricedShort,
    freeStoryMeta: freePreview.meta,
  }
  content.header = {
    ...content.header,
    cta: cta.getApp,
    ctaShort: cta.getAppShort,
  }
  content.pricing = {
    ...content.pricing,
    tiers,
    sharedExperience: {
      ...content.pricing.sharedExperience,
      bundles,
    },
  }

  return {
    hostBannerPrefix: ES_LANDING.hostBannerPrefix,
    LANDING_CTA: cta,
    FREE_PREVIEW: freePreview,
    ROME_TIERS: tiers,
    ROME_BUNDLES: bundles,
    LANDING_ACTS: acts,
    LANDING_CONTENT: content,
    LANDING_INTENTS: ES_LANDING.LANDING_INTENTS,
  }
}

export function getLocalizedAcquisition(locale) {
  if (normalizeLocale(locale) !== LOCALES.ES) {
    return {
      ANCIENT_ROME_COPY,
      ANCIENT_ROME_FEATURED_STOP_LABELS,
      HOW_IT_WORKS_COPY,
    }
  }

  const acquisition = ES_LANDING.ACQUISITION ?? {}
  return {
    ANCIENT_ROME_COPY: mergeLocalized(ANCIENT_ROME_COPY, acquisition.ancientRome),
    ANCIENT_ROME_FEATURED_STOP_LABELS:
      acquisition.featuredStops ?? ANCIENT_ROME_FEATURED_STOP_LABELS,
    HOW_IT_WORKS_COPY: mergeLocalized(HOW_IT_WORKS_COPY, acquisition.howItWorks),
  }
}
