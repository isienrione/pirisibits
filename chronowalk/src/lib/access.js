import { supabase, isSupabaseConfigured } from './supabase'
import { getDeviceId } from './deviceId.js'
import {
  clearLocalAccessState,
  hasValidLocalAccess,
  readDeviceCredential,
  writeAccessEntitlement,
  writeDeviceCredential,
} from './accessSession.js'
import { purchaseTourProduct } from '../services/tourEntitlements.js'

const PURCHASED_TIER_KEY = 'cw_purchased_tier_v1'

function writePurchasedTierLocal(tierId) {
  if (typeof window === 'undefined' || !tierId) return
  try {
    window.localStorage.setItem(PURCHASED_TIER_KEY, String(tierId))
  } catch {
    /* ignore */
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const DEV_TOKENS = new Set(['dev', 'local'])

/** @deprecated Use device credential keys in accessSession.js */
export const ACCESS_TOKEN_KEY = 'cw_access_token_v1'

function allowsDevAccessTokens() {
  // Explicit local/sandbox testing only - never treat arbitrary UUIDs as valid.
  return import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEV_ACCESS === 'true'
}

export function parseAccessToken(search = '') {
  return new URLSearchParams(search).get('token')?.trim() ?? ''
}

export function isAccessTokenFormat(token) {
  if (!token) return false
  if (allowsDevAccessTokens() && DEV_TOKENS.has(token.toLowerCase())) return true
  // Claims / credentials are high-entropy hex (≥128 bits). UUIDs may still appear
  // in legacy URLs but are no longer treated as auto-valid local staging tokens.
  if (UUID_RE.test(token)) return true
  return /^[a-f0-9]{32,}$/i.test(token)
}

function normalizeDeviceAccessPayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, reason: 'invalid' }
  }
  const ok = Boolean(data.ok)
  if (!ok) {
    return { ok: false, reason: data.reason ?? 'invalid' }
  }
  return {
    ok: true,
    purchasedProductId: data.purchased_product_id ?? data.purchasedProductId ?? null,
    contentProductId: data.content_product_id ?? data.contentProductId ?? null,
    seatLimit:
      data.seat_limit != null
        ? Number(data.seat_limit)
        : data.seatLimit != null
          ? Number(data.seatLimit)
          : null,
    role: data.role ?? null,
    bundleStatus: data.bundle_status ?? data.bundleStatus ?? null,
    offlineLeaseExpiresAt:
      data.offline_lease_expires_at ?? data.offlineLeaseExpiresAt ?? null,
    deviceCredential: data.device_credential ?? data.deviceCredential ?? null,
  }
}

function persistSuccessfulAccess(normalized, { credential } = {}) {
  const deviceCredential = credential || normalized.deviceCredential
  if (deviceCredential) writeDeviceCredential(deviceCredential)

  writeAccessEntitlement({
    purchasedProductId: normalized.purchasedProductId,
    contentProductId: normalized.contentProductId,
    seatLimit: normalized.seatLimit,
    role: normalized.role,
    bundleStatus: normalized.bundleStatus,
    offlineLeaseExpiresAt: normalized.offlineLeaseExpiresAt,
  })

  const tier = normalized.contentProductId || normalized.purchasedProductId
  if (tier) {
    writePurchasedTierLocal(tier)
    purchaseTourProduct(tier)
  }

  return {
    ok: true,
    source: 'supabase',
    productId: tier,
    purchasedProductId: normalized.purchasedProductId,
    contentProductId: normalized.contentProductId,
    seatLimit: normalized.seatLimit,
    role: normalized.role,
    bundleStatus: normalized.bundleStatus,
    deviceCredential,
  }
}

/**
 * Redeem a one-time purchase claim (email / URL token).
 * Returns a distinct device credential exactly once on success.
 */
export async function redeemPurchaseClaim(claim, deviceBinding = getDeviceId()) {
  if (!isAccessTokenFormat(claim)) {
    return { ok: false, reason: 'invalid_format' }
  }

  if (allowsDevAccessTokens() && DEV_TOKENS.has(claim.toLowerCase())) {
    writeDeviceCredential(`dev-credential-${claim.toLowerCase()}`)
    writeAccessEntitlement({
      purchasedProductId: 'rome-complete',
      contentProductId: 'rome-complete',
      seatLimit: 1,
      role: 'solo',
      bundleStatus: null,
    })
    writePurchasedTierLocal('rome-complete')
    return {
      ok: true,
      source: 'dev',
      productId: 'rome-complete',
      purchasedProductId: 'rome-complete',
      contentProductId: 'rome-complete',
      seatLimit: 1,
      role: 'solo',
      deviceCredential: `dev-credential-${claim.toLowerCase()}`,
    }
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, reason: 'not_configured' }
  }

  try {
    const { data, error } = await supabase.rpc('redeem_purchase_claim', {
      p_claim: claim,
      p_device_binding: deviceBinding ?? null,
    })
    if (error) throw error
    const normalized = normalizeDeviceAccessPayload(data)
    if (!normalized.ok || !normalized.deviceCredential) {
      return { ok: false, reason: normalized.reason ?? 'invalid' }
    }
    return persistSuccessfulAccess(normalized)
  } catch {
    return { ok: false, reason: 'network' }
  }
}

/**
 * Revalidate a stored device credential with the server.
 * Clears local access when the server reports invalid/revoked states.
 */
export async function validateDeviceAccess(
  credential = readDeviceCredential(),
  deviceBinding = getDeviceId(),
) {
  if (!credential) {
    return { ok: false, reason: 'missing_credential' }
  }

  if (
    allowsDevAccessTokens() &&
    (credential.startsWith('dev-credential-') || DEV_TOKENS.has(credential.toLowerCase()))
  ) {
    writeAccessEntitlement({
      purchasedProductId: 'rome-complete',
      contentProductId: 'rome-complete',
      seatLimit: 1,
      role: 'solo',
      bundleStatus: null,
    })
    return {
      ok: true,
      source: 'dev',
      productId: 'rome-complete',
      purchasedProductId: 'rome-complete',
      contentProductId: 'rome-complete',
      seatLimit: 1,
      role: 'solo',
    }
  }

  if (!isSupabaseConfigured()) {
    // Offline: honor bounded lease only.
    if (hasValidLocalAccess()) {
      const ent = await import('./accessSession.js').then((m) => m.readAccessEntitlement())
      return {
        ok: true,
        source: 'offline_lease',
        productId: ent?.contentProductId ?? ent?.purchasedProductId ?? null,
        purchasedProductId: ent?.purchasedProductId ?? null,
        contentProductId: ent?.contentProductId ?? null,
        seatLimit: ent?.seatLimit ?? null,
        role: ent?.role ?? null,
        bundleStatus: ent?.bundleStatus ?? null,
      }
    }
    return { ok: false, reason: 'not_configured' }
  }

  try {
    const { data, error } = await supabase.rpc('validate_device_access', {
      p_credential: credential,
      p_device_binding: deviceBinding ?? null,
    })
    if (error) throw error
    const normalized = normalizeDeviceAccessPayload(data)
    if (!normalized.ok) {
      clearLocalAccessState()
      return { ok: false, reason: normalized.reason ?? 'invalid' }
    }
    return persistSuccessfulAccess(normalized, { credential })
  } catch {
    if (hasValidLocalAccess()) {
      const { readAccessEntitlement } = await import('./accessSession.js')
      const ent = readAccessEntitlement()
      return {
        ok: true,
        source: 'offline_lease',
        productId: ent?.contentProductId ?? ent?.purchasedProductId ?? null,
        purchasedProductId: ent?.purchasedProductId ?? null,
        contentProductId: ent?.contentProductId ?? null,
        seatLimit: ent?.seatLimit ?? null,
        role: ent?.role ?? null,
        bundleStatus: ent?.bundleStatus ?? null,
      }
    }
    return { ok: false, reason: 'network' }
  }
}

/**
 * Validate a URL/manual token.
 * URL claims always hit redeem (one-time). Never trusts cw_access boolean alone.
 * Legacy get_purchase_for_token / validate_access_token paths are not used for grant.
 */
export async function validateAccessToken(token) {
  if (!isAccessTokenFormat(token)) {
    return { ok: false, reason: 'invalid_format' }
  }

  // One-time claim exchange (email / URL). Does not treat local staging UUID lists
  // as entitlement authority.
  return redeemPurchaseClaim(token)
}

/** @deprecated Prefer writeDeviceCredential - kept for older call sites. */
export function rememberAccessToken(token) {
  writeDeviceCredential(token)
}

/** @deprecated Prefer readDeviceCredential */
export function readAccessToken() {
  return readDeviceCredential()
}

/** @deprecated Prefer clearLocalAccessState */
export function clearAccessToken() {
  clearLocalAccessState()
}

export {
  hasValidLocalAccess,
  readDeviceCredential,
  writeDeviceCredential,
  clearLocalAccessState,
} from './accessSession.js'
