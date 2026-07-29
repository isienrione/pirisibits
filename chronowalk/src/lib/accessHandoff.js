/**
 * Bridge access into a Home Screen / standalone partition.
 *
 * Chrome iOS (and some Safari HS paths) do not share localStorage with the tab
 * that redeemed the ticket. We mirror credential + entitlement into:
 *  1) a first-party cookie (helps when cookie jars are shared)
 *  2) a short-lived `cw_h` query param on the current URL (captured by
 *     bookmark-style Add to Home Screen)
 *
 * On cold open, hydrate localStorage from URL or cookie before RequireAccess runs.
 */

import {
  DEVICE_CREDENTIAL_KEY,
  ACCESS_ENTITLEMENT_KEY,
  ACCESS_BOOL_KEY,
  readDeviceCredential,
  readAccessEntitlement,
  writeDeviceCredential,
  writeAccessEntitlement,
  hasValidLocalAccess,
  registerAccessHandoffHooks,
} from './accessSession.js'
import { getDeviceId } from './deviceId.js'

export const HANDOFF_QUERY_KEY = 'cw_h'
export const HANDOFF_COOKIE = 'cw_access_handoff_v1'
/** Keep handoff warm long enough to Add to Home Screen + first open. */
export const HANDOFF_TTL_MS = 7 * 24 * 60 * 60 * 1000

function toBase64Url(json) {
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value) {
  const padded = String(value).replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** @returns {{ c: string, e: object, d?: string, exp: number } | null} */
export function buildAccessHandoffPayload(now = Date.now()) {
  const credential = readDeviceCredential()
  const entitlement = readAccessEntitlement()
  if (!credential || !entitlement) return null
  return {
    c: credential,
    e: {
      purchasedProductId: entitlement.purchasedProductId,
      contentProductId: entitlement.contentProductId,
      seatLimit: entitlement.seatLimit,
      role: entitlement.role,
      bundleStatus: entitlement.bundleStatus,
      offlineLeaseExpiresAt: entitlement.offlineLeaseExpiresAt,
    },
    d: getDeviceId(),
    exp: now + HANDOFF_TTL_MS,
  }
}

export function encodeAccessHandoff(payload = buildAccessHandoffPayload()) {
  if (!payload?.c || !payload?.e) return null
  try {
    return toBase64Url(JSON.stringify(payload))
  } catch {
    return null
  }
}

/** @returns {{ c: string, e: object, d?: string, exp: number } | null} */
export function decodeAccessHandoff(token, now = Date.now()) {
  if (!token || typeof token !== 'string') return null
  try {
    const parsed = JSON.parse(fromBase64Url(token))
    if (!parsed?.c || !parsed?.e || typeof parsed.e !== 'object') return null
    if (!Number.isFinite(parsed.exp) || parsed.exp <= now) return null
    return parsed
  } catch {
    return null
  }
}

function writeCookie(name, value, maxAgeSec) {
  if (typeof document === 'undefined') return
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${secure}`
}

function readCookie(name) {
  if (typeof document === 'undefined') return null
  const parts = document.cookie ? document.cookie.split(';') : []
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split('=')
    if (rawKey === name) {
      try {
        return decodeURIComponent(rest.join('='))
      } catch {
        return rest.join('=')
      }
    }
  }
  return null
}

function clearCookie(name) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

/** Persist handoff cookie + optional URL rewrite for Add to Home Screen. */
export function syncAccessHandoff({ updateUrl = false } = {}) {
  if (typeof window === 'undefined') return null
  if (!hasValidLocalAccess()) return null

  const token = encodeAccessHandoff()
  if (!token) return null

  writeCookie(HANDOFF_COOKIE, token, Math.floor(HANDOFF_TTL_MS / 1000))

  if (updateUrl) {
    try {
      const url = new URL(window.location.href)
      // Prefer a resume surface so HS bookmarks land in the tour, not marketing.
      if (url.pathname === '/' || url.pathname === '/landing' || url.pathname === '/access') {
        url.pathname = '/begin'
      }
      url.searchParams.set(HANDOFF_QUERY_KEY, token)
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    } catch {
      /* ignore */
    }
  }

  return token
}

export function clearAccessHandoff() {
  clearCookie(HANDOFF_COOKIE)
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    if (url.searchParams.has(HANDOFF_QUERY_KEY)) {
      url.searchParams.delete(HANDOFF_QUERY_KEY)
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    }
  } catch {
    /* ignore */
  }
}

/**
 * Hydrate localStorage from `cw_h` query or handoff cookie.
 * @returns {boolean} true when access was restored into this partition
 */
export function consumeAccessHandoff(now = Date.now()) {
  if (typeof window === 'undefined') return false
  if (hasValidLocalAccess(now)) {
    // Still strip a spent query param so URLs stay clean.
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.has(HANDOFF_QUERY_KEY)) {
        url.searchParams.delete(HANDOFF_QUERY_KEY)
        window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
      }
    } catch {
      /* ignore */
    }
    return false
  }

  let token = null
  try {
    token = new URL(window.location.href).searchParams.get(HANDOFF_QUERY_KEY)
  } catch {
    token = null
  }
  if (!token) token = readCookie(HANDOFF_COOKIE)

  const payload = decodeAccessHandoff(token, now)
  if (!payload) return false

  writeDeviceCredential(payload.c)
  writeAccessEntitlement({
    ...payload.e,
    offlineLeaseExpiresAt: payload.e.offlineLeaseExpiresAt ?? payload.exp,
  })
  if (payload.d) {
    try {
      window.localStorage.setItem('cw_device_id', String(payload.d))
    } catch {
      /* ignore */
    }
  }

  // Refresh cookie + strip query for this partition.
  syncAccessHandoff({ updateUrl: false })
  try {
    const url = new URL(window.location.href)
    if (url.searchParams.has(HANDOFF_QUERY_KEY)) {
      url.searchParams.delete(HANDOFF_QUERY_KEY)
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    }
  } catch {
    /* ignore */
  }

  return true
}

/** Test helper — keys used by this module. */
export const __handoffTestKeys = {
  DEVICE_CREDENTIAL_KEY,
  ACCESS_ENTITLEMENT_KEY,
  ACCESS_BOOL_KEY,
  HANDOFF_QUERY_KEY,
  HANDOFF_COOKIE,
}

// Wire session writes to cookie mirroring without a circular dynamic import.
registerAccessHandoffHooks({
  sync: syncAccessHandoff,
  clear: clearAccessHandoff,
})
