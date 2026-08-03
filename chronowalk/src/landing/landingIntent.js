/**
 * Allowlisted Google Ads search-intent hero variants (`?intent=`).
 *
 * Safety:
 * - Only known keys; never inject raw query text into the DOM.
 * - Unknown / malformed / absent → `rome` (default).
 * - Canonical SEO stays on `/` without the intent param (see siteRoutes).
 */

import { LANDING_CTA, LANDING_CONTENT } from './landingData.js'
import {
  LANDING_CINEMATIC_INTERLUDE,
  LANDING_HERO,
  landingStillPlane,
} from './landingVisualAssets.js'

export const LANDING_INTENT_PARAM = 'intent'

/** @typedef {'rome' | 'colosseum' | 'pantheon' | 'forum' | 'self-guided'} LandingIntentId */

/** @type {readonly LandingIntentId[]} */
export const LANDING_INTENT_IDS = Object.freeze([
  'rome',
  'colosseum',
  'pantheon',
  'forum',
  'self-guided',
])

const INTENT_SET = new Set(LANDING_INTENT_IDS)

export const LANDING_INTENT_DEFAULT = /** @type {LandingIntentId} */ ('rome')

const UNLOCK_PRICED = LANDING_CTA.unlockRomePriced

/**
 * Fixed copy + image + CTA roles per allowlisted intent.
 * `ctaPriority: 'unlock'` → gold paid first; `'preview'` → free Pantheon first (pantheon only).
 *
 * @type {Readonly<Record<LandingIntentId, {
 *   id: LandingIntentId,
 *   eyebrow: string,
 *   headline: string,
 *   accentLine: string | null,
 *   subheadline: string,
 *   subheadlineHighlight: string | null,
 *   unlockCta: string,
 *   previewCta: string,
 *   previewCtaAriaLabel: string,
 *   ctaPriority: 'unlock' | 'preview',
 *   heroImage: ReturnType<typeof landingStillPlane> | typeof LANDING_HERO,
 * }>>}
 */
export const LANDING_INTENT_VARIANTS = Object.freeze({
  rome: Object.freeze({
    id: 'rome',
    eyebrow: 'Self-guided audio walking tour of Rome',
    headline: 'Ancient Rome, brought back to life as you walk.',
    accentLine: 'At your own pace.',
    // Keep the user-approved lead; do not swap for Ads keyword stuffing.
    subheadline:
      'Enjoy the Colosseum, Roman Forum, The Pantheon & 18 other stops • immersive audio • curated routes • visual ancient reconstructions',
    subheadlineHighlight: 'Colosseum, Roman Forum, The Pantheon & 18 other stops',
    unlockCta: UNLOCK_PRICED,
    previewCta: LANDING_CTA.tryPantheonFree,
    previewCtaAriaLabel: LANDING_CTA.tryPantheonFree,
    ctaPriority: 'unlock',
    heroImage: LANDING_HERO,
  }),
  colosseum: Object.freeze({
    id: 'colosseum',
    eyebrow: 'Colosseum audio experience + 20 more Rome stops',
    headline: 'See more than the Colosseum’s ruins.',
    accentLine: null,
    subheadline:
      'Hear the arena’s story where it happened, reveal Ancient Rome through interactive reconstructions, and continue through a complete 21-stop walking experience.',
    subheadlineHighlight: null,
    unlockCta: UNLOCK_PRICED,
    previewCta: LANDING_CTA.tryCompleteStopFree,
    previewCtaAriaLabel: LANDING_CTA.tryCompleteStopFree,
    ctaPriority: 'unlock',
    // Cinematic Colosseum arrival plane (not an admission ticket claim).
    heroImage: LANDING_CINEMATIC_INTERLUDE,
  }),
  pantheon: Object.freeze({
    id: 'pantheon',
    eyebrow: 'Try a complete Pantheon audio stop free',
    headline: 'Stand beneath the Pantheon—and understand what you are seeing.',
    accentLine: null,
    subheadline:
      'Start with the complete Pantheon experience at no cost, then continue across Rome with immersive audio, curated routes and 21 historic stops.',
    subheadlineHighlight: null,
    unlockCta: UNLOCK_PRICED,
    previewCta: LANDING_CTA.tryPantheonStopFree,
    previewCtaAriaLabel: LANDING_CTA.tryPantheonStopFree,
    ctaPriority: 'preview',
    heroImage: landingStillPlane('/landing/real-moment/pantheon.jpg', {
      alt: '',
      objectPosition: 'center 42%',
    }),
  }),
  forum: Object.freeze({
    id: 'forum',
    eyebrow: 'Roman Forum audio walk + Ancient Rome route',
    headline: 'Turn scattered ruins into the center of an empire.',
    accentLine: null,
    subheadline:
      'Follow the story through the Roman Forum and beyond with immersive audio, interactive reconstructions and a curated 21-stop walk through Rome.',
    subheadlineHighlight: null,
    unlockCta: UNLOCK_PRICED,
    previewCta: LANDING_CTA.tryPantheonFree,
    previewCtaAriaLabel: LANDING_CTA.tryPantheonFree,
    ctaPriority: 'unlock',
    heroImage: landingStillPlane('/landing/real-moment/forum.jpg', {
      alt: '',
      objectPosition: 'center 40%',
    }),
  }),
  'self-guided': Object.freeze({
    id: 'self-guided',
    eyebrow: 'A self-guided Rome walk that moves with you',
    headline: 'Start anywhere. Wander freely. Never lose your place.',
    accentLine: null,
    subheadline:
      'Explore 21 historic stops with immersive audio, flexible routes and interactive reconstructions—without joining a group or downloading an app.',
    subheadlineHighlight: null,
    unlockCta: UNLOCK_PRICED,
    previewCta: LANDING_CTA.tryPantheonFree,
    previewCtaAriaLabel: LANDING_CTA.tryPantheonFree,
    ctaPriority: 'unlock',
    heroImage: landingStillPlane('/landing/real-moment/street.jpg', {
      alt: '',
      objectPosition: 'center 45%',
    }),
  }),
})

/**
 * Normalize a raw query value to an allowlisted intent, or null.
 * @param {string | null | undefined} raw
 * @returns {LandingIntentId | null}
 */
export function normalizeLandingIntent(raw) {
  if (raw == null) return null
  let decoded = String(raw)
  try {
    decoded = decodeURIComponent(decoded.replace(/\+/g, ' '))
  } catch {
    return null
  }
  const v = decoded.trim().toLowerCase()
  if (!v || v.length > 32) return null
  // Reject anything that isn't a simple allowlisted token.
  if (!/^[a-z0-9-]+$/.test(v)) return null
  if (!INTENT_SET.has(/** @type {LandingIntentId} */ (v))) return null
  return /** @type {LandingIntentId} */ (v)
}

/**
 * Read `?intent=` from a search string (defaults to `window.location.search`).
 * @param {string | null | undefined} [search]
 * @returns {LandingIntentId}
 */
export function resolveLandingIntent(search) {
  if (typeof search !== 'string') {
    if (typeof window === 'undefined') return LANDING_INTENT_DEFAULT
    search = window.location.search
  }
  try {
    const raw = new URLSearchParams(search).get(LANDING_INTENT_PARAM)
    return normalizeLandingIntent(raw) ?? LANDING_INTENT_DEFAULT
  } catch {
    return LANDING_INTENT_DEFAULT
  }
}

/**
 * @param {LandingIntentId | null | undefined} intent
 */
export function getLandingIntentVariant(intent) {
  const id = intent && INTENT_SET.has(intent) ? intent : LANDING_INTENT_DEFAULT
  return LANDING_INTENT_VARIANTS[id] ?? LANDING_INTENT_VARIANTS[LANDING_INTENT_DEFAULT]
}

/**
 * Merge allowlisted intent onto the static hero (destinations stay centralized).
 * @param {LandingIntentId | null | undefined} intent
 */
export function resolveLandingIntentHero(intent) {
  const variant = getLandingIntentVariant(intent)
  const base = LANDING_CONTENT.hero
  return {
    ...base,
    intent: variant.id,
    eyebrow: variant.eyebrow,
    headline: variant.headline,
    accentLine: variant.accentLine,
    subheadline: variant.subheadline,
    subheadlineHighlight: variant.subheadlineHighlight,
    getAppCta: variant.unlockCta,
    getAppHref: base.getAppHref ?? '#pricing',
    primaryCta: variant.previewCta,
    primaryCtaAriaLabel: variant.previewCtaAriaLabel,
    primaryHref: base.primaryHref ?? '/preview',
    ctaPriority: variant.ctaPriority,
    heroImage: variant.heroImage,
    // Keep how-it-works tertiary off the hero.
    secondaryCta: null,
    secondaryHref: null,
    // Fallback labels for tests / legacy readers.
    unlockCta: variant.unlockCta,
    previewCta: variant.previewCta,
  }
}

/** @internal */
export function __landingIntentTestExports() {
  return { INTENT_SET, UNLOCK_PRICED, LANDING_CTA }
}
