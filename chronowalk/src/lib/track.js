import { getHost } from './host'
import { getAbVariantCents } from './config'

const CONSENT_KEY = 'cw_analytics_consent'

let initialized = false
let posthogModulePromise = null

const TRACK_EVENTS = {
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
  LANDING_SCROLL_PRODUCT: 'landing_scroll_product',
}

export { TRACK_EVENTS }

function baseProps(extra = {}) {
  return {
    host: getHost(),
    ab_variant: getAbVariantCents(),
    ...extra,
  }
}

function loadPosthog() {
  if (!posthogModulePromise) {
    posthogModulePromise = import('posthog-js').then((mod) => mod.default ?? mod)
  }
  return posthogModulePromise
}

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return

  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key) return

  const consent = window.localStorage.getItem(CONSENT_KEY)
  if (consent === 'declined') return

  const start = () => {
    void loadPosthog().then((ph) => {
      if (initialized) return
      const consentNow = window.localStorage.getItem(CONSENT_KEY)
      if (consentNow === 'declined') return

      ph.init(key, {
        api_host: 'https://eu.i.posthog.com',
        autocapture: false,
        capture_pageview: true,
        persistence: consentNow === 'accepted' ? 'localStorage' : 'memory',
      })

      initialized = true

      if (new URLSearchParams(window.location.search).has('h')) {
        track(TRACK_EVENTS.QR_SCAN)
      }
    })
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(start, { timeout: 2500 })
  } else {
    window.setTimeout(start, 1)
  }
}

export function setAnalyticsConsent(accepted) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONSENT_KEY, accepted ? 'accepted' : 'declined')

  if (!accepted && initialized) {
    void loadPosthog().then((ph) => ph.opt_out_capturing())
  } else if (accepted) {
    initAnalytics()
    void loadPosthog().then((ph) => {
      if (initialized) ph.opt_in_capturing()
    })
  }
}

export function getAnalyticsConsent() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(CONSENT_KEY)
}

export function track(event, properties = {}) {
  if (!initialized) return
  void loadPosthog().then((ph) => {
    ph.capture(event, baseProps(properties))
  })
}
