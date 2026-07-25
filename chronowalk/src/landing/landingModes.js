/**
 * Source-aware landing presentation modes.
 * Query params change marketing presentation only — never prices or entitlements.
 */

export const LANDING_MODE_IDS = Object.freeze({
  ORGANIC: 'organic',
  GEO: 'geo',
  QR: 'qr',
})

/** Safe host directory — never render raw query-string host text. */
export const LANDING_KNOWN_HOSTS = Object.freeze({
  demo: { id: 'demo', label: 'your host' },
  boutique: { id: 'boutique', label: 'your boutique stay' },
})

export const LANDING_MODES = Object.freeze({
  organic: {
    id: LANDING_MODE_IDS.ORGANIC,
    primaryAction: 'purchase',
    compact: false,
    showPlanningNarrative: true,
    // Survey-style situation cards hurt conversion — keep off in the film landing.
    showSituationSelector: false,
    showCuratedCertainty: false,
    showRoutePreview: true,
    showDifferenceTable: false,
    showWalkTogether: true,
    sunlightContrast: false,
    showHostContext: false,
    emphasizeTomorrow: false,
  },
  geo: {
    id: LANDING_MODE_IDS.GEO,
    primaryAction: 'preview',
    compact: true,
    showPlanningNarrative: false,
    showSituationSelector: false,
    showCuratedCertainty: false,
    showRoutePreview: false,
    showDifferenceTable: false,
    showWalkTogether: false,
    sunlightContrast: true,
    showHostContext: false,
    emphasizeTomorrow: false,
  },
  qr: {
    id: LANDING_MODE_IDS.QR,
    primaryAction: 'purchase',
    compact: false,
    showPlanningNarrative: true,
    showSituationSelector: false,
    showCuratedCertainty: false,
    showRoutePreview: true,
    showDifferenceTable: false,
    showWalkTogether: true,
    sunlightContrast: false,
    showHostContext: true,
    emphasizeTomorrow: true,
  },
})

const ATTR_STORAGE_KEY = 'cw_landing_attribution'

/**
 * @param {string | null | undefined} raw
 * @returns {'organic' | 'geo' | 'qr'}
 */
export function normalizeLandingSrc(raw) {
  const value = String(raw || '')
    .trim()
    .toLowerCase()
  if (value === 'geo') return LANDING_MODE_IDS.GEO
  if (value === 'qr') return LANDING_MODE_IDS.QR
  return LANDING_MODE_IDS.ORGANIC
}

/**
 * @param {string | null | undefined} raw
 * @returns {{ id: string, label: string } | null}
 */
export function resolveLandingHost(raw) {
  if (raw == null || raw === '') return null
  const key = String(raw).trim().toLowerCase()
  return LANDING_KNOWN_HOSTS[key] ?? null
}

/**
 * @param {URLSearchParams | { get: (k: string) => string | null }} params
 */
export function resolveLandingMode(params) {
  const src = normalizeLandingSrc(params?.get?.('src'))
  const host = resolveLandingHost(params?.get?.('host'))
  const mode = { ...LANDING_MODES[src] }
  if (src !== LANDING_MODE_IDS.QR) {
    mode.showHostContext = false
  }
  return {
    src,
    mode,
    host: mode.showHostContext ? host : null,
  }
}

export function readLandingModeFromWindow() {
  if (typeof window === 'undefined') {
    return {
      src: LANDING_MODE_IDS.ORGANIC,
      mode: LANDING_MODES.organic,
      host: null,
    }
  }
  try {
    return resolveLandingMode(new URLSearchParams(window.location.search))
  } catch {
    return {
      src: LANDING_MODE_IDS.ORGANIC,
      mode: LANDING_MODES.organic,
      host: null,
    }
  }
}

export function persistLandingAttribution({ src, hostId }) {
  if (typeof window === 'undefined') return
  try {
    const payload = {
      src: normalizeLandingSrc(src),
      host_id: hostId || null,
      at: Date.now(),
    }
    window.sessionStorage.setItem(ATTR_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* private mode */
  }
}

export function peekLandingAttribution() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(ATTR_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      src: normalizeLandingSrc(parsed?.src),
      host_id: typeof parsed?.host_id === 'string' ? parsed.host_id : null,
    }
  } catch {
    return null
  }
}
