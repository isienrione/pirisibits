import posthog from 'posthog-js'
import { getHost } from './host'
import { getAbVariantCents } from './config'
import { peekLandingExpHero } from '../landing/landingExperiments.js'

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
  /** @deprecated prefer LANDING_PRICING_VIEW - kept for historical funnel queries */
  LANDING_SCROLL_PRODUCT: 'landing_scroll_product',
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
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: false,
        maskTextSelector: '[data-ph-mask]',
        recordCrossOriginIframes: false,
      },
      persistence: 'localStorage+cookie',
      loaded: (ph) => {
        ph.register({
          app_version: __APP_VERSION__ ?? 'unknown',
          is_pwa: window.matchMedia('(display-mode: standalone)').matches,
          is_ios: /iPad|iPhone|iPod/.test(navigator.userAgent),
          connection_type: navigator.connection?.effectiveType ?? 'unknown',
        })
      },
    })
    initialized = true

    if (new URLSearchParams(window.location.search).has('h')) {
      track(TRACK_EVENTS.QR_SCAN)
    }
  } catch {
    initialized = false
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

export function track(event, properties = {}) {
  if (!initialized) return false
  try {
    posthog.capture(event, baseProps(properties))
    return true
  } catch {
    return false
  }
}
