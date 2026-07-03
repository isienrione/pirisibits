import posthog from 'posthog-js'
import { getHost } from './host'
import { getAbVariantCents } from './config'

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
}

function baseProps(extra = {}) {
  return {
    host: getHost(),
    ab_variant: getAbVariantCents(),
    ...extra,
  }
}

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return

  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key) return

  const consent = window.localStorage.getItem(CONSENT_KEY)
  if (consent === 'declined') return

  posthog.init(key, {
    api_host: 'https://eu.i.posthog.com',
    autocapture: false,
    capture_pageview: true,
    persistence: consent === 'accepted' ? 'localStorage' : 'memory',
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
