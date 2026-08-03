/**
 * Aggregate live diagnostics for the DebugPanel + clipboard dump.
 */
import posthog from 'posthog-js'
import { getAbVariantCents } from './config.js'
import { getAttribution } from './attribution.ts'
import { getRecentDebugEvents } from './debugEventLog.js'
import { getMapboxInitStatus } from './mapboxStatus.js'
import { getPaddleLoadStatus } from './paddle.js'
import {
  getEngagementDebugSnapshot,
  getPostHogCheckoutIdentity,
  isProductAnalyticsReady,
} from './analytics.ts'
import { isAnalyticsReady } from './track.js'

function isStandalonePwa() {
  if (typeof window === 'undefined') return false
  try {
    return Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches)
  } catch {
    return false
  }
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

async function readServiceWorkerState() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return 'unsupported'
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) return 'no_registration'
    if (reg.installing) return `installing:${reg.installing.state}`
    if (reg.waiting) return `waiting:${reg.waiting.state}`
    if (reg.active) return `active:${reg.active.state}`
    return 'registered'
  } catch (err) {
    return `error:${err?.message || 'unknown'}`
  }
}

function readPostHogCaptureEnabled() {
  try {
    if (!isAnalyticsReady() || !isProductAnalyticsReady()) return false
    // posthog-js exposes config.has_opted_out_capturing when privacy controls apply.
    if (typeof posthog.has_opted_out_capturing === 'function' && posthog.has_opted_out_capturing()) {
      return false
    }
    return true
  } catch {
    return isProductAnalyticsReady()
  }
}

/**
 * @returns {Promise<Record<string, unknown>>}
 */
export async function collectDebugSnapshot() {
  const identity = getPostHogCheckoutIdentity()
  const engagement = getEngagementDebugSnapshot()
  const mapbox = getMapboxInitStatus()
  const sw = await readServiceWorkerState()

  return {
    collected_at: new Date().toISOString(),
    posthog: {
      distinct_id: identity.ph_distinct_id,
      session_id: identity.ph_session_id,
      capture_enabled: readPostHogCaptureEnabled(),
      analytics_ready: isProductAnalyticsReady(),
      track_initialized: isAnalyticsReady(),
    },
    attribution: getAttribution(),
    ab_variant: getAbVariantCents(),
    engagement: {
      scroll_depth_pct: engagement.scroll_depth_pct,
      seconds_on_page: engagement.seconds_on_page,
      is_pwa: isStandalonePwa(),
      is_ios: isIosDevice(),
    },
    service_worker: sw,
    paddle: getPaddleLoadStatus(),
    mapbox: mapbox,
    recent_events: getRecentDebugEvents(),
  }
}
