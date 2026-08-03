/**
 * Ring buffer of recent analytics events for the hidden DebugPanel.
 * Kept separate from PostHog so the panel can show local history even if capture fails.
 */

const MAX_EVENTS = 20

/** @type {{ name: string, ts: number, props: Record<string, unknown> }[]} */
const recentEvents = []

/** @type {Set<() => void>} */
const listeners = new Set()

const KEY_PROP_ALLOWLIST = [
  'stop_id',
  'tier',
  'pct',
  'route_slug',
  'cta_location',
  'error_name',
  'error_message',
  'event_type',
  'max_scroll_pct',
  'seconds_on_page',
  'message',
  'asset_type',
  'asset_url',
  'lcp_ms',
  'question_text',
  'deepest_funnel_step_reached',
  'longest_dwell_section',
  'transaction_id',
  'price_eur',
]

function pickKeyProps(props = {}) {
  /** @type {Record<string, unknown>} */
  const out = {}
  for (const key of KEY_PROP_ALLOWLIST) {
    if (props[key] !== undefined) out[key] = props[key]
  }
  return out
}

function notify() {
  for (const listener of listeners) {
    try {
      listener()
    } catch {
      /* panel subscribers must not break capture */
    }
  }
}

/**
 * Record a fired analytics event (call from `track()` after successful capture attempt).
 * @param {string} name
 * @param {Record<string, unknown>} [props]
 */
export function recordDebugEvent(name, props = {}) {
  recentEvents.push({
    name: String(name),
    ts: Date.now(),
    props: pickKeyProps(props),
  })
  while (recentEvents.length > MAX_EVENTS) recentEvents.shift()
  notify()
}

/** @returns {{ name: string, ts: number, props: Record<string, unknown> }[]} */
export function getRecentDebugEvents() {
  return recentEvents.slice()
}

/** @param {() => void} listener */
export function subscribeDebugEvents(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** @internal */
export function __resetDebugEventLogForTests() {
  recentEvents.length = 0
  listeners.clear()
}
