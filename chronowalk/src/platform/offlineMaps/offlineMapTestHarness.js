/**
 * Gate for the DEV-only Offline Map Test harness.
 * Production builds must never render this panel.
 *
 * @param {{ DEV?: boolean } | undefined} env
 * @returns {boolean}
 */
export function shouldRenderOfflineMapTestPanel(env = import.meta.env) {
  return Boolean(env?.DEV)
}

/**
 * Format progress for the diagnostic UI.
 * @param {number | null | undefined} progress
 * @returns {string}
 */
export function formatOfflineMapProgress(progress) {
  if (typeof progress !== 'number' || !Number.isFinite(progress)) return '—'
  return `${Math.round(progress * 100)}%`
}

/**
 * Format resource counts for diagnostics.
 * @param {number | null | undefined} value
 * @returns {string}
 */
export function formatOfflineMapResourceCount(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return String(Math.floor(value))
}
