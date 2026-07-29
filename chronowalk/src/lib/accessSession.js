/**
 * Device credential + server-derived entitlement session.
 * Protected routes require a stored credential and an active entitlement
 * (online validation or bounded offline lease ≤ 48h).
 */

import { OFFLINE_LEASE_MS } from './launchSkus.js'

export const DEVICE_CREDENTIAL_KEY = 'cw_device_credential_v1'
export const ACCESS_ENTITLEMENT_KEY = 'cw_access_entitlement_v1'

function mirrorHandoff() {
  // Lazy import avoids circular init with accessHandoff ↔ accessSession.
  try {
    void import('./accessHandoff.js').then((m) => m.syncAccessHandoff({ updateUrl: false }))
  } catch {
    /* ignore */
  }
}
/** @deprecated Prefer DEVICE_CREDENTIAL_KEY — kept for migration reads. */
export const LEGACY_ACCESS_TOKEN_KEY = 'cw_access_token_v1'
export const ACCESS_BOOL_KEY = 'cw_access'

/**
 * @typedef {{
 *   purchasedProductId: string | null,
 *   contentProductId: string | null,
 *   seatLimit: number | null,
 *   role: string | null,
 *   bundleStatus: string | null,
 *   validatedAt: number,
 *   offlineLeaseExpiresAt: number,
 * }} AccessEntitlement
 */

export function readDeviceCredential() {
  if (typeof window === 'undefined') return null
  try {
    return (
      window.localStorage.getItem(DEVICE_CREDENTIAL_KEY) ||
      window.localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY) ||
      null
    )
  } catch {
    return null
  }
}

export function writeDeviceCredential(credential) {
  if (typeof window === 'undefined' || !credential) return
  try {
    window.localStorage.setItem(DEVICE_CREDENTIAL_KEY, String(credential))
    // Stop treating legacy bearer key as authoritative.
    window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
    mirrorHandoff()
  } catch {
    /* ignore */
  }
}

export function clearDeviceCredential() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(DEVICE_CREDENTIAL_KEY)
    window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

/** @returns {AccessEntitlement | null} */
export function readAccessEntitlement() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(ACCESS_ENTITLEMENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      purchasedProductId: parsed.purchasedProductId ?? parsed.purchased_product_id ?? null,
      contentProductId: parsed.contentProductId ?? parsed.content_product_id ?? null,
      seatLimit:
        parsed.seatLimit != null
          ? Number(parsed.seatLimit)
          : parsed.seat_limit != null
            ? Number(parsed.seat_limit)
            : null,
      role: parsed.role ?? null,
      bundleStatus: parsed.bundleStatus ?? parsed.bundle_status ?? null,
      validatedAt: Number(parsed.validatedAt) || 0,
      offlineLeaseExpiresAt: Number(parsed.offlineLeaseExpiresAt) || 0,
    }
  } catch {
    return null
  }
}

/** @param {Partial<AccessEntitlement> & { offlineLeaseExpiresAt?: string|number|Date }} payload */
export function writeAccessEntitlement(payload) {
  if (typeof window === 'undefined' || !payload) return
  const validatedAt = Date.now()
  let leaseMs = validatedAt + OFFLINE_LEASE_MS
  if (payload.offlineLeaseExpiresAt) {
    const parsed = new Date(payload.offlineLeaseExpiresAt).getTime()
    if (Number.isFinite(parsed)) {
      leaseMs = Math.min(parsed, validatedAt + OFFLINE_LEASE_MS)
    }
  }
  const next = {
    purchasedProductId: payload.purchasedProductId ?? null,
    contentProductId: payload.contentProductId ?? null,
    seatLimit: payload.seatLimit ?? null,
    role: payload.role ?? null,
    bundleStatus: payload.bundleStatus ?? null,
    validatedAt,
    offlineLeaseExpiresAt: leaseMs,
  }
  try {
    window.localStorage.setItem(ACCESS_ENTITLEMENT_KEY, JSON.stringify(next))
    window.localStorage.setItem(ACCESS_BOOL_KEY, 'true')
    mirrorHandoff()
  } catch {
    /* ignore */
  }
}

export function clearAccessEntitlement() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(ACCESS_ENTITLEMENT_KEY)
    window.localStorage.removeItem(ACCESS_BOOL_KEY)
  } catch {
    /* ignore */
  }
}

export function clearLocalAccessState() {
  clearDeviceCredential()
  clearAccessEntitlement()
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem('cw_purchased_tier_v1')
    window.localStorage.removeItem('cw_family_membership_v1')
    window.localStorage.removeItem('cw_family_bundle_v1')
    window.localStorage.removeItem('cw_walk_session_v1')
    window.localStorage.removeItem('cw_active_walk_session_v1')
    void import('./accessHandoff.js').then((m) => m.clearAccessHandoff())
  } catch {
    /* ignore */
  }
}

/** True when credential + entitlement exist and offline lease has not expired. */
export function hasValidLocalAccess(now = Date.now()) {
  const credential = readDeviceCredential()
  const entitlement = readAccessEntitlement()
  if (!credential || !entitlement) return false
  if (!entitlement.offlineLeaseExpiresAt || entitlement.offlineLeaseExpiresAt <= now) {
    return false
  }
  return true
}

export function offlineLeaseRemainingMs(now = Date.now()) {
  const entitlement = readAccessEntitlement()
  if (!entitlement?.offlineLeaseExpiresAt) return 0
  return Math.max(0, entitlement.offlineLeaseExpiresAt - now)
}
