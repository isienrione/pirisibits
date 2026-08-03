import posthog from 'posthog-js'
import { getHost } from './host'
import { getAbVariantCents } from './config'
import { peekLandingExpHero } from '../landing/landingExperiments.js'

const CONSENT_KEY = 'cw_analytics_consent'

export const ANALYTICS_CONSENT = Object.freeze({
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
})

let initialized = false

/** @type {Set<(value: string | null) => void>} */
const consentListeners = new Set()

export const TRACK_EVENTS = {
  QR_SCAN: 'qr_scan',
  PREVIEW_START: 'preview_start',
  PREVIEW_COMPLETE: 'preview_complete',
  THRESHOLD_DEMO: 'threshold_demo',
  CHECKOUT_OPEN: 'checkout_open',
  PURCHASE: 'purchase',
  JOURNEY_BEGIN: 'journey_begin',
  WAYPOINT_ARRIVED: 'waypoint_arrived',
  STORY_COMPLETE: 'story_complete',
  THRESHOLD_HOLD: 'threshold_hold',
  PAUSE: 'pause',
  RESUME: 'resume',
  GPS_FALLBACK_USED: 'gps_fallback_used',
  OFF_ROUTE: 'off_route',
  OBSERVATION: 'observation',
  OPTIONAL_WAYPOINT_PROMOTED: 'optional_waypoint_promoted',
  DAY_COMPLETE: 'day_complete',
  LETTER_VIEW: 'letter_view',
  LETTER_SAVE: 'letter_save',
  LETTER_SHARE: 'letter_share',
  REVIEW_CLICK: 'review_click',
  TRANSCRIPT_OPEN: 'transcript_open',
  LANDING_VIEW: 'landing_view',
  LANDING_CTA_BEGIN: 'landing_cta_begin',
  LANDING_CTA_PREVIEW: 'landing_cta_preview',
  LANDING_CTA_ROUTES: 'landing_cta_routes',
  LANDING_ROUTE_VIEW: 'landing_route_view',
  LANDING_ROUTE_EXPAND: 'landing_route_expand',
  LANDING_PRICING_VIEW: 'landing_pricing_view',
  LANDING_FAQ_OPEN: 'landing_faq_open',
  GUARANTEE_VIEW: 'guarantee_view',
  /** @deprecated prefer LANDING_PRICING_VIEW - kept for historical funnel queries */
  LANDING_SCROLL_PRODUCT: 'landing_scroll_product',
  PAGE_UNLOAD: 'page_unload',
  PAGE_RELOAD_DETECTED: 'page_reload_detected',
}

function baseProps(extra = {}) {
  const landingExpHero = peekLandingExpHero()
  return {
    host: getHost(),
    ab_variant: getAbVariantCents(),
    ...(landingExpHero ? { landing_exp_hero: landingExpHero } : {}),
    ...extra,
  }
}

function notifyConsentListeners(value) {
  for (const listener of consentListeners) {
    try {
      listener(value)
    } catch {
      // Consent UI must never break navigation / checkout.
    }
  }
}

/** True only after PostHog has successfully initialized under accepted consent. */
export function isAnalyticsReady() {
  return initialized
}

/**
 * Subscribe to consent changes (`accepted` | `declined`).
 * @param {(value: string) => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribeAnalyticsConsent(listener) {
  consentListeners.add(listener)
  return () => {
    consentListeners.delete(listener)
  }
}

/**
 * Opt-in only. Never initializes without explicit `accepted` consent.
 * Safe when the key is missing or PostHog throws / is blocked.
 */
export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return

  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key) return

  const consent = window.localStorage.getItem(CONSENT_KEY)
  if (consent !== ANALYTICS_CONSENT.ACCEPTED) return

  try {
    posthog.init(key, {
      api_host: 'https://eu.i.posthog.com',
      autocapture: false,
      // SPA: custom ChronoWalk events only - avoid automatic $pageview duplicates
      // on history changes; landing_view / journey events are explicit.
      capture_pageview: false,
      disable_session_recording: true,
      persistence: 'localStorage',
    })
    initialized = true

    if (new URLSearchParams(window.location.search).has('h')) {
      track(TRACK_EVENTS.QR_SCAN)
    }
  } catch {
    initialized = false
  }
}

export function setAnalyticsConsent(accepted) {
  if (typeof window === 'undefined') return

  const value = accepted ? ANALYTICS_CONSENT.ACCEPTED : ANALYTICS_CONSENT.DECLINED
  window.localStorage.setItem(CONSENT_KEY, value)

  if (!accepted) {
    if (initialized) {
      try {
        posthog.opt_out_capturing()
      } catch {
        // Ignore opt-out failures; local decline still blocks track().
      }
    }
    notifyConsentListeners(value)
    return
  }

  initAnalytics()
  if (initialized) {
    try {
      posthog.opt_in_capturing()
    } catch {
      // Capture stays gated by initialized + opt-in best-effort.
    }
  }
  notifyConsentListeners(value)
}

/**
 * @returns {'accepted' | 'declined' | null}
 */
export function getAnalyticsConsent() {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(CONSENT_KEY)
  if (value === ANALYTICS_CONSENT.ACCEPTED || value === ANALYTICS_CONSENT.DECLINED) {
    return value
  }
  return null
}

export function track(event, properties = {}) {
  if (!initialized) return false
  try {
    posthog.capture(event, baseProps(properties))
    return true
  } catch {
    return false
  }
}

let pageLifecycleInstalled = false
let pageLifecycleStartedAt =
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()

function readNavigationType() {
  try {
    const entry = performance.getEntriesByType?.('navigation')?.[0]
    return entry?.type ?? null
  } catch {
    return null
  }
}

function secondsOnPage() {
  const now =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now()
  return Math.max(0, Math.round((now - pageLifecycleStartedAt) / 1000))
}

/**
 * Fire unload / reload diagnostics for investigating unexpected full-page reloads
 * (e.g. mobile Safari mid-session). Safe to call multiple times; listeners install once.
 * Events no-op until PostHog is initialized (consent accepted).
 */
export function installPageLifecycleDiagnostics() {
  if (typeof window === 'undefined' || pageLifecycleInstalled) return () => {}
  pageLifecycleInstalled = true
  pageLifecycleStartedAt =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now()

  const navigationType = readNavigationType()
  if (navigationType === 'reload') {
    // Defer slightly so initAnalytics() in the same tick can finish first.
    window.setTimeout(() => {
      track(TRACK_EVENTS.PAGE_RELOAD_DETECTED, { navigation_type: navigationType })
    }, 0)
  }

  const fireUnload = (reasonHint) => {
    track(TRACK_EVENTS.PAGE_UNLOAD, {
      reason_hint: reasonHint,
      seconds_on_page: secondsOnPage(),
      navigation_type: readNavigationType(),
    })
  }

  const onBeforeUnload = () => fireUnload('beforeunload')
  const onPageHide = (event) =>
    fireUnload(event?.persisted ? 'pagehide_bfcache' : 'pagehide')

  window.addEventListener('beforeunload', onBeforeUnload)
  window.addEventListener('pagehide', onPageHide)

  return () => {
    window.removeEventListener('beforeunload', onBeforeUnload)
    window.removeEventListener('pagehide', onPageHide)
    pageLifecycleInstalled = false
  }
}

/** @internal */
export function __resetPageLifecycleDiagnosticsForTests() {
  pageLifecycleInstalled = false
  pageLifecycleStartedAt =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now()
}
