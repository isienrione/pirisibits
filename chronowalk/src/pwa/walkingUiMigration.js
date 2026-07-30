import { WALKING_UI_REVISION } from '../content/walkingUiRevision.js'
import { clearAllCaches, unregisterAllServiceWorkers } from './pwaCacheUtils.js'
import { fetchWithTimeout } from './fetchWithTimeout.js'

export const WALKING_UI_RELOAD_GUARD = 'cw-walking-ui-reload'
export const WALKING_UI_STORAGE_KEY = 'cw-walking-ui-rev'

/** @param {string} [source] */
export function parseWalkingUiRevisionFromHtml(source) {
  if (!source) return null
  const match = source.match(
    /<meta[^>]+name=["']cw-walking-ui-rev["'][^>]+content=["'](\d+)["']/i,
  )
  return match ? Number(match[1]) : null
}

/** Read required revision from the bundled walking UI manifest. */
export function readRequiredWalkingUiRevision() {
  return WALKING_UI_REVISION
}

/**
 * Fetch the revision the server is currently shipping (index.html or json fallback).
 * @returns {Promise<number | null>}
 */
export async function fetchDeployedWalkingUiRevision() {
  if (typeof fetch === 'undefined') return null

  try {
    const jsonRes = await fetchWithTimeout(`/walking-ui-revision.json?_=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    })
    if (jsonRes?.ok) {
      const payload = await jsonRes.json()
      if (typeof payload?.revision === 'number') return payload.revision
    }
  } catch {
    // fall through to index.html
  }

  try {
    const htmlRes = await fetchWithTimeout(`/?_=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    })
    if (!htmlRes?.ok) return null
    return parseWalkingUiRevisionFromHtml(await htmlRes.text())
  } catch {
    return null
  }
}

/**
 * @param {number} bundledRevision
 * @param {number | null | undefined} deployedRevision
 */
export function shouldMigrateWalkingUi(bundledRevision, deployedRevision) {
  if (deployedRevision == null || Number.isNaN(deployedRevision)) return false
  return deployedRevision > bundledRevision
}

/**
 * Legacy compass walking screen markers · present only in pre-companion bundles.
 */
export function isLegacyWalkingDom() {
  if (typeof document === 'undefined') return false
  return Boolean(
    document.querySelector('.cw-walking-dark') ||
      document.querySelector('[data-testid="walking-compass"]'),
  )
}

export function isCompanionWalkingDom() {
  if (typeof document === 'undefined') return false
  return Boolean(document.querySelector('.cw-walking-companion'))
}

/**
 * Wipe caches and reload once when the network says a newer walking UI shipped
 * than the JS bundle currently running (stale PWA chunk after deploy).
 *
 * @param {number} bundledRevision
 * @returns {Promise<boolean>} true when reload was started
 */
export async function ensureWalkingUiFresh(bundledRevision) {
  if (typeof window === 'undefined') return false

  const guard = sessionStorage.getItem(WALKING_UI_RELOAD_GUARD)
  if (guard) {
    sessionStorage.removeItem(WALKING_UI_RELOAD_GUARD)
    return false
  }

  const deployedRevision = await fetchDeployedWalkingUiRevision()
  if (!shouldMigrateWalkingUi(bundledRevision, deployedRevision)) return false

  sessionStorage.setItem(WALKING_UI_RELOAD_GUARD, '1')
  await clearAllCaches()
  await unregisterAllServiceWorkers()
  localStorage.setItem(WALKING_UI_STORAGE_KEY, String(deployedRevision))
  window.location.reload()
  return true
}

/**
 * If redesign walking state renders the legacy compass layout, force one refresh.
 *
 * @param {number} bundledRevision
 * @returns {Promise<boolean>}
 */
export async function recoverLegacyWalkingDom(bundledRevision) {
  if (typeof window === 'undefined') return false
  if (!isLegacyWalkingDom() || isCompanionWalkingDom()) return false

  const guard = sessionStorage.getItem(WALKING_UI_RELOAD_GUARD)
  if (guard) {
    sessionStorage.removeItem(WALKING_UI_RELOAD_GUARD)
    return false
  }

  sessionStorage.setItem(WALKING_UI_RELOAD_GUARD, '1')
  await clearAllCaches()
  await unregisterAllServiceWorkers()
  localStorage.setItem(WALKING_UI_STORAGE_KEY, String(bundledRevision))
  window.location.reload()
  return true
}
