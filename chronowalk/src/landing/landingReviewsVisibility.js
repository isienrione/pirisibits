/**
 * Landing hero reviews visibility (testing period).
 *
 * Reviews stay hidden by default.
 * Show with:
 *   ?landing_reviews=1
 *   localStorage cw_landing_reviews=1
 *
 * Dev tools (toggle UI) appear when:
 *   import.meta.env.DEV
 *   ?landing_dev=1
 *   localStorage cw_landing_dev=1
 */

export const LANDING_REVIEWS_KEY = 'cw_landing_reviews'
export const LANDING_REVIEWS_PARAM = 'landing_reviews'
export const LANDING_DEV_KEY = 'cw_landing_dev'
export const LANDING_DEV_PARAM = 'landing_dev'

function normalizeFlag(raw) {
  if (raw == null) return null
  const v = String(raw).trim().toLowerCase()
  if (v === '1' || v === 'true' || v === 'on' || v === 'yes') return true
  if (v === '0' || v === 'false' || v === 'off' || v === 'no') return false
  return null
}

function readStorage(key) {
  if (typeof window === 'undefined') return null
  try {
    return normalizeFlag(window.localStorage.getItem(key))
  } catch {
    return null
  }
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value ? '1' : '0')
  } catch {
    /* private mode */
  }
}

function readQuery(param) {
  if (typeof window === 'undefined') return null
  try {
    return normalizeFlag(new URLSearchParams(window.location.search).get(param))
  } catch {
    return null
  }
}

/** Whether the reviews capsule should render on the hero. Default: shown during testing. */
export function getLandingReviewsVisible() {
  const fromQuery = readQuery(LANDING_REVIEWS_PARAM)
  if (fromQuery != null) return fromQuery
  const stored = readStorage(LANDING_REVIEWS_KEY)
  if (stored != null) return stored
  return true
}

export function setLandingReviewsVisible(visible) {
  writeStorage(LANDING_REVIEWS_KEY, Boolean(visible))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('cw-landing-reviews-change', { detail: { visible: Boolean(visible) } }),
    )
  }
}

/** Dev tooling chrome for toggling reviews during the testing period. */
export function getLandingDevToolsVisible() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) return true
  const fromQuery = readQuery(LANDING_DEV_PARAM)
  if (fromQuery != null) return fromQuery
  const stored = readStorage(LANDING_DEV_KEY)
  if (stored != null) return stored
  return false
}

export function setLandingDevToolsVisible(visible) {
  writeStorage(LANDING_DEV_KEY, Boolean(visible))
}

/**
 * Apply URL overrides once on mount (sticky into localStorage when present).
 */
export function syncLandingReviewFlagsFromUrl() {
  const reviews = readQuery(LANDING_REVIEWS_PARAM)
  if (reviews != null) writeStorage(LANDING_REVIEWS_KEY, reviews)
  const dev = readQuery(LANDING_DEV_PARAM)
  if (dev != null) writeStorage(LANDING_DEV_KEY, dev)
}
