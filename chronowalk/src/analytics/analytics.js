import { env } from '../config/env'
import { readAcquisitionSource, resolveAcquisitionSource } from '../utils/appPreferences'

const BATCH_MS = 2000

const queue = []
let flushTimer = null
let identified = {}
let sendImpl = defaultSend

function defaultSend(events) {
  const key = env.analyticsKey
  if (!key || !events.length) return

  const payload = {
    key,
    events,
  }

  if (import.meta.env.DEV) {
    console.debug('[analytics]', payload)
  }

  if (typeof window !== 'undefined' && window.posthog?.capture) {
    for (const { event, props } of events) {
      window.posthog.capture(event, props)
    }
    return
  }

  const body = JSON.stringify(payload)
  const endpoint = env.analyticsEndpoint || '/api/analytics'

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const sent = navigator.sendBeacon(endpoint, body)
    if (sent) return
  }

  void fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Analytics-Key': key,
    },
    body,
    keepalive: true,
  }).catch(() => {})
}

function baseProps() {
  const source = readAcquisitionSource()
  return {
    ...(source ? { source } : {}),
    ts: Date.now(),
  }
}

function flush() {
  if (!env.analyticsKey || queue.length === 0) return

  const events = queue.splice(0, queue.length)
  sendImpl(events)
}

function scheduleFlush() {
  if (flushTimer != null) return

  flushTimer = window.setTimeout(() => {
    flushTimer = null
    flush()
  }, BATCH_MS)
}

export function initAnalytics() {
  resolveAcquisitionSource()
}

export function identify(props = {}) {
  if (!env.analyticsKey) return

  identified = {
    ...identified,
    ...props,
  }
}

export function track(event, props = {}) {
  if (!env.analyticsKey) return

  queue.push({
    event,
    props: {
      ...baseProps(),
      ...identified,
      ...props,
    },
  })
  scheduleFlush()
}

/** @internal test helper */
export function flushAnalytics() {
  if (flushTimer != null) {
    window.clearTimeout(flushTimer)
    flushTimer = null
  }
  flush()
}

/** @internal test helper */
export function resetAnalyticsForTests() {
  if (flushTimer != null) {
    window.clearTimeout(flushTimer)
    flushTimer = null
  }
  queue.length = 0
  identified = {}
  sendImpl = defaultSend
}

/** @internal test helper */
export function setAnalyticsSender(sender) {
  sendImpl = typeof sender === 'function' ? sender : defaultSend
}
