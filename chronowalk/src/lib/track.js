import posthog from 'posthog-js'
import { getHost } from './host'
import {
  markAnalyticsReady,
  track as analyticsTrack,
} from './analytics.ts'
import {
  captureAttribution,
  registerAttributionWithPosthog,
  getAttribution,
} from './attribution.ts'
import {
  initGoogleAds,
  updateGoogleAdsConsent,
} from './googleAds.js'

/** Marketing / advertising cookies only — does not gate product analytics. */
const MARKETING_CONSENT_KEY = 'cw_marketing_consent'
/** @deprecated legacy key; migrated once into MARKETING_CONSENT_KEY */
const LEGACY_ANALYTICS_CONSENT_KEY = 'cw_analytics_consent'

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
  THEN_NOW_DEMO_VIEWED: 'then_now_demo_viewed',
  THEN_NOW_DEMO_STARTED: 'then_now_demo_started',
  THEN_NOW_DEMO_COMPLETED: 'then_now_demo_completed',
  /** @deprecated prefer LANDING_PRICING_VIEW - kept for historical funnel queries */
  LANDING_SCROLL_PRODUCT: 'landing_scroll_product',
  PAGE_UNLOAD: 'page_unload',
  PAGE_RELOAD_DETECTED: 'page_reload_detected',
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

function readStoredMarketingConsent() {
  if (typeof window === 'undefined') return null
  const current = window.localStorage.getItem(MARKETING_CONSENT_KEY)
  if (current === ANALYTICS_CONSENT.ACCEPTED || current === ANALYTICS_CONSENT.DECLINED) {
    return current
  }
  const legacy = window.localStorage.getItem(LEGACY_ANALYTICS_CONSENT_KEY)
  if (legacy === ANALYTICS_CONSENT.ACCEPTED || legacy === ANALYTICS_CONSENT.DECLINED) {
    window.localStorage.setItem(MARKETING_CONSENT_KEY, legacy)
    return legacy
  }
  return null
}

/** True after PostHog has successfully initialized (product analytics — always-on). */
export function isAnalyticsReady() {
  return initialized
}

/**
 * Subscribe to marketing-consent changes (`accepted` | `declined`).
 * Does not control PostHog product analytics.
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
 * Initialize PostHog immediately (legitimate interest for product analytics).
 * Safe when the key is missing or PostHog throws / is blocked.
 */
export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return

  // Capture before any landing hash navigation can strip ?utm_* params.
  captureAttribution()

  // Google Ads base tag (async) — Consent Mode defaults already in index.html.
  // Not blocked by the marketing banner; ad_storage stays denied until consent.
  initGoogleAds({ marketingConsent: readStoredMarketingConsent() })

  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key) return

  try {
    posthog.init(key, {
      api_host: 'https://eu.i.posthog.com',
      person_profiles: 'always',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      rageclick: true,
      capture_exceptions: true,
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: false,
        maskTextSelector: '[data-ph-mask]',
        recordCrossOriginIframes: false,
        // Inline CSS + fonts at capture time so replay does not depend on
        // hashed /assets/* still existing, or on eu.posthog.com being allowed
        // to fetch Google Fonts. Without this, ChronoWalk replays render as
        // unstyled Times text inside a letterboxed phone frame.
        inlineStylesheet: true,
        collectFonts: true,
      },
      persistence: 'localStorage+cookie',
      loaded: (ph) => {
        ph.register({
          app_version: __APP_VERSION__ ?? 'unknown',
          is_pwa: window.matchMedia('(display-mode: standalone)').matches,
          is_ios: /iPad|iPhone|iPod/.test(navigator.userAgent),
          connection_type: navigator.connection?.effectiveType ?? 'unknown',
        })
        // First-touch UTMs / click ids — survive landing hash replaceState.
        captureAttribution()
        registerAttributionWithPosthog(getAttribution())
      },
    })
    // Expose the module singleton for DebugPanel / Playwright capture stubs.
    try {
      window.posthog = posthog
    } catch {
      /* ignore */
    }
    initialized = true
    markAnalyticsReady(true)

    if (new URLSearchParams(window.location.search).has('h')) {
      track(TRACK_EVENTS.QR_SCAN)
    }
  } catch {
    initialized = false
    markAnalyticsReady(false)
  }
}

/**
 * Persist marketing / advertising cookie preference only.
 * Never opts PostHog product analytics in or out.
 * @param {boolean} accepted
 */
export function setAnalyticsConsent(accepted) {
  if (typeof window === 'undefined') return

  const value = accepted ? ANALYTICS_CONSENT.ACCEPTED : ANALYTICS_CONSENT.DECLINED
  window.localStorage.setItem(MARKETING_CONSENT_KEY, value)
  window.localStorage.setItem(LEGACY_ANALYTICS_CONSENT_KEY, value)
  updateGoogleAdsConsent(Boolean(accepted))
  notifyConsentListeners(value)
}

/**
 * Marketing cookie preference (`accepted` | `declined` | null).
 * Product analytics is independent of this value.
 * @returns {'accepted' | 'declined' | null}
 */
export function getAnalyticsConsent() {
  return readStoredMarketingConsent()
}

/**
 * Legacy + funnel events — always routed through `analytics.ts` (sole capture site).
 * @param {string} event
 * @param {Record<string, unknown>} [properties]
 */
export function track(event, properties = {}) {
  if (!initialized) return false
  return analyticsTrack(event, { host: getHost(), ...properties })
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
 * Events no-op until PostHog is initialized via initAnalytics().
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
