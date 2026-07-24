/**
 * Landing conversion analytics.
 * Provider remains PostHog via `track()` — consent, init, and base props unchanged.
 *
 * Never send emails, names, payment details, or free-text answers.
 */

import { isAnalyticsReady, track, TRACK_EVENTS } from '../lib/track.js'
import { ensureLandingExpHero, peekLandingExpHero } from './landingExperiments.js'
import { peekLandingAttribution } from './landingModes.js'

/** Allowed section ids for CTA context (keep short + stable). */
export const LANDING_ANALYTICS_SECTIONS = Object.freeze({
  HERO: 'hero',
  HEADER: 'header',
  EARLY_CTA: 'early-cta',
  THRESHOLD: 'threshold',
  AUDIO: 'audio',
  SITUATIONS: 'situations',
  MONUMENTS: 'monuments',
  TRY_FREE: 'try-free',
  PRICING: 'pricing',
  WALK_TOGETHER: 'walk-together',
  FAQ: 'faq',
  FINAL_CTA: 'final-cta',
  STICKY: 'sticky',
  AFTER_ROME: 'after-rome',
})

const onceFlags = {
  view: false,
  routeView: false,
  pricingView: false,
  stickyImpression: false,
}

function landingProps(extra = {}) {
  const exp = peekLandingExpHero() ?? ensureLandingExpHero()
  const attribution = peekLandingAttribution()
  return {
    source: 'landing',
    landing_exp_hero: exp,
    ...(attribution?.src ? { src: attribution.src } : {}),
    ...(attribution?.host_id ? { host_id: attribution.host_id } : {}),
    ...extra,
  }
}

/** @internal test helper */
export function resetLandingAnalyticsForTests() {
  onceFlags.view = false
  onceFlags.routeView = false
  onceFlags.pricingView = false
  onceFlags.stickyImpression = false
}

export function trackLandingView(extra = {}) {
  if (onceFlags.view) return false
  // Do not consume the once-flag before consent — otherwise accepting later
  // would permanently skip the first landing_view.
  if (!isAnalyticsReady()) return false
  onceFlags.view = true
  track(TRACK_EVENTS.LANDING_VIEW, landingProps(extra))
  return true
}

/**
 * Free preview CTA → /preview (also leads to preview_start on the preview page).
 * @param {string} section
 * @param {Record<string, unknown>} [extra]
 */
export function trackLandingPreviewCta(section, extra = {}) {
  track(
    TRACK_EVENTS.LANDING_CTA_PREVIEW,
    landingProps({
      section,
      preview: 'pantheon',
      cta: 'preview',
      cta_location: section,
      cta_action: 'preview',
      ...extra,
    }),
  )
}

/**
 * Secondary “Explore Rome routes” / pricing-nav CTAs (hash scroll, not checkout).
 * @param {string} section
 */
export function trackLandingRoutesCta(section) {
  track(
    TRACK_EVENTS.LANDING_CTA_ROUTES,
    landingProps({
      section,
      cta: 'routes',
      target: 'pricing',
      cta_location: section,
      cta_action: 'routes',
    }),
  )
}

/** Threshold interaction started (hold or Reveal fallback). */
export function trackLandingThresholdStart({ via = 'hold' } = {}) {
  track(
    TRACK_EVENTS.THRESHOLD_DEMO,
    landingProps({
      section: LANDING_ANALYTICS_SECTIONS.THRESHOLD,
      action: 'start',
      via,
      waypoint_id: 'landing-colosseum',
      threshold_engaged: true,
    }),
  )
}

/** Threshold reveal reached full (hold complete or latch). */
export function trackLandingThresholdComplete({ via = 'hold', duration_ms } = {}) {
  track(
    TRACK_EVENTS.THRESHOLD_DEMO,
    landingProps({
      section: LANDING_ANALYTICS_SECTIONS.THRESHOLD,
      action: 'complete',
      via,
      waypoint_id: 'landing-colosseum',
      threshold_engaged: true,
    }),
  )
  track(
    TRACK_EVENTS.THRESHOLD_HOLD,
    landingProps({
      section: LANDING_ANALYTICS_SECTIONS.THRESHOLD,
      action: 'complete',
      via,
      waypoint_id: 'landing-colosseum',
      ...(typeof duration_ms === 'number' ? { duration_ms: Math.round(duration_ms) } : {}),
    }),
  )
}

/** Hold cancelled before full reveal. */
export function trackLandingThresholdCancelled({ duration_ms, via = 'hold' } = {}) {
  track(
    TRACK_EVENTS.THRESHOLD_HOLD,
    landingProps({
      section: LANDING_ANALYTICS_SECTIONS.THRESHOLD,
      action: 'cancelled',
      via,
      waypoint_id: 'landing-colosseum',
      duration_ms: Math.round(duration_ms ?? 0),
    }),
  )
}

/** Continuous route section entered viewport (once). */
export function trackLandingRouteView() {
  if (onceFlags.routeView) return false
  onceFlags.routeView = true
  track(
    TRACK_EVENTS.LANDING_ROUTE_VIEW,
    landingProps({
      section: LANDING_ANALYTICS_SECTIONS.MONUMENTS,
    }),
  )
  return true
}

/** User expands the full stop list. */
export function trackLandingRouteExpand({ expanded }) {
  track(
    TRACK_EVENTS.LANDING_ROUTE_EXPAND,
    landingProps({
      section: LANDING_ANALYTICS_SECTIONS.MONUMENTS,
      expanded: Boolean(expanded),
    }),
  )
}

/** Pricing section entered viewport (once) — route/product consideration. */
export function trackLandingPricingView() {
  if (onceFlags.pricingView) return false
  onceFlags.pricingView = true
  track(
    TRACK_EVENTS.LANDING_PRICING_VIEW,
    landingProps({
      section: LANDING_ANALYTICS_SECTIONS.PRICING,
      pricing_viewed: true,
    }),
  )
  return true
}

/**
 * Pricing card purchase CTA — product intent before checkout handoff.
 * @param {string} tierId
 * @param {Record<string, unknown>} [extra]
 */
export function trackLandingPricingCta(tierId, extra = {}) {
  track(
    TRACK_EVENTS.LANDING_CTA_BEGIN,
    landingProps({
      section: extra.cta_location || LANDING_ANALYTICS_SECTIONS.PRICING,
      tier: tierId,
      sku: tierId,
      cta: 'begin',
      cta_action: 'purchase',
      ...extra,
    }),
  )
}

/**
 * Checkout URL assigned / navigation started.
 * @param {{ tierId: string, priceCents: number } & Record<string, unknown>} opts
 */
export function trackLandingCheckoutOpen({ tierId, priceCents, ...extra } = {}) {
  track(
    TRACK_EVENTS.CHECKOUT_OPEN,
    landingProps({
      section: extra.cta_location || LANDING_ANALYTICS_SECTIONS.PRICING,
      tier: tierId,
      sku: tierId,
      price_cents: priceCents,
      cta_action: 'checkout',
      ...extra,
    }),
  )
}

/**
 * FAQ accordion opened (not on close).
 * @param {{ questionId: string, groupId?: string }} opts
 */
export function trackLandingFaqOpen({ questionId, groupId }) {
  track(
    TRACK_EVENTS.LANDING_FAQ_OPEN,
    landingProps({
      section: LANDING_ANALYTICS_SECTIONS.FAQ,
      question_id: questionId,
      ...(groupId ? { group_id: groupId } : {}),
    }),
  )
}

export function trackLandingStickyImpression(extra = {}) {
  if (onceFlags.stickyImpression) return false
  if (!isAnalyticsReady()) return false
  onceFlags.stickyImpression = true
  track(
    TRACK_EVENTS.LANDING_CTA_BEGIN,
    landingProps({
      section: LANDING_ANALYTICS_SECTIONS.STICKY,
      cta_location: 'sticky',
      cta_action: 'impression',
      ...extra,
    }),
  )
  return true
}

export function trackLandingStickyClick(extra = {}) {
  track(
    TRACK_EVENTS.LANDING_CTA_BEGIN,
    landingProps({
      section: LANDING_ANALYTICS_SECTIONS.STICKY,
      cta_location: 'sticky',
      ...extra,
    }),
  )
}

/**
 * Observe a section once when ≥ ratio visible.
 * @returns {() => void} disconnect
 */
export function observeLandingSectionOnce(element, onVisible, { threshold = 0.35 } = {}) {
  if (!element || typeof IntersectionObserver !== 'function') return () => {}

  let done = false
  const io = new IntersectionObserver(
    ([entry]) => {
      if (done || !entry?.isIntersecting) return
      done = true
      io.disconnect()
      onVisible()
    },
    { threshold },
  )
  io.observe(element)
  return () => io.disconnect()
}
