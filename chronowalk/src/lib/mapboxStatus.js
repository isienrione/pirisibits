/**
 * Shared Mapbox init status for the DebugPanel (and future health checks).
 * TourMap + errorVisibility update this; the panel reads it.
 */

/** @typedef {'idle' | 'loading' | 'ready' | 'failed' | 'no_token'} MapboxInitStatus */

/** @type {MapboxInitStatus} */
let status = 'idle'
/** @type {string | null} */
let detail = null

/** @type {Set<() => void>} */
const listeners = new Set()

function notify() {
  for (const listener of listeners) {
    try {
      listener()
    } catch {
      /* ignore */
    }
  }
}

/**
 * @param {MapboxInitStatus} next
 * @param {string | null} [nextDetail]
 */
export function setMapboxInitStatus(next, nextDetail = null) {
  status = next
  detail = nextDetail
  notify()
}

export function getMapboxInitStatus() {
  return { status, detail }
}

/** @param {() => void} listener */
export function subscribeMapboxInitStatus(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** @internal */
export function __resetMapboxInitStatusForTests() {
  status = 'idle'
  detail = null
  listeners.clear()
}
