import posthog from 'posthog-js'
import { getHost } from './host'
import { getAbVariantCents } from './config'
import { peekLandingExpHero } from '../landing/landingExperiments.js'

const CONSENT_KEY = 'cw_analytics_consent'

let initialized = false

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
  /** @deprecated prefer LANDING_PRICING_VIEW — kept for historical funnel queries */
  LANDING_SCROLL_PRODUCT: 'landing_scroll_product',
  ACCESS_ERROR: 'access_error',
  OFFLINE_DOWNLOAD_START: 'offline_download_start',
  OFFLINE_DOWNLOAD_COMPLETE: 'offline_download_complete',
  OFFLINE_DOWNLOAD_ERROR: 'offline_download_error',
  OFFLINE_DOWNLOAD_REMOVED: 'offline_download_removed',
  INVITE_REDEEMED: 'invite_redeemed',
  INVITE_ERROR: 'invite_error',
  JOURNEY_COMPLETE_VIEWED: 'journey_complete_viewed',
  SETUP_COMPLETE: 'setup_complete',
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

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return

  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key) return

  // Opt-in only — travelers authorize on /setup after purchase (no landing banner).
  const consent = window.localStorage.getItem(CONSENT_KEY)
  if (consent !== 'accepted') return

  posthog.init(key, {
    api_host: 'https://eu.i.posthog.com',
    autocapture: false,
    capture_pageview: true,
    persistence: 'localStorage',
  })

  initialized = true

  if (new URLSearchParams(window.location.search).has('h')) {
    track(TRACK_EVENTS.QR_SCAN)
  }
}

export function setAnalyticsConsent(accepted) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONSENT_KEY, accepted ? 'accepted' : 'declined')

  if (!accepted && initialized) {
    posthog.opt_out_capturing()
  } else if (accepted) {
    initAnalytics()
    if (initialized) posthog.opt_in_capturing()
  }
}

export function getAnalyticsConsent() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(CONSENT_KEY)
}

export function track(event, properties = {}) {
  if (!initialized) return
  posthog.capture(event, baseProps(properties))
}

/**
 * Identify the current device as a purchaser.
 * Call after a successful purchase or access redemption.
 * @param {string} deviceId
 * @param {{ tier?: string | null, role?: string | null }} personProps
 */
export function identifyPurchaser(deviceId, { tier = null, role = null } = {}) {
  if (!initialized || !deviceId) return
  posthog.identify(deviceId, {
    ...(tier ? { purchased_tier: tier } : {}),
    ...(role ? { role } : {}),
  })
}
