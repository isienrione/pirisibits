import { supabase, isSupabaseConfigured } from './supabase.js'
import { getDeviceId } from './deviceId.js'
import { localFamilyStore } from './familyLocalStore.js'
import {
  readAccessEntitlement,
  readDeviceCredential,
  writeAccessEntitlement,
  writeDeviceCredential,
} from './accessSession.js'
import { applyPurchaseUnlock } from './pendingPurchase.js'
import { isBundleSku } from './launchSkus.js'

const MEMBERSHIP_KEY = 'cw_family_membership_v1'

/** Public site origin for invite deep links — never hardcode a wrong host. */
export function getPublicSiteOrigin() {
  if (typeof window === 'undefined') {
    return String(import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/$/, '')
  }
  const configured = String(import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/$/, '')
  return configured || window.location.origin
}

/**
 * Canonical bundle-invite form (matches DB `_cw_normalize_bundle_invite`).
 * Existing secrets are lowercase hex — trim + lowercase only.
 */
export function normalizeBundleInviteCode(inviteCode) {
  return String(inviteCode ?? '').trim().toLowerCase()
}

/** Build `/invite?code=` share URL from the configured site origin. */
export function buildInviteShareUrl(inviteCode) {
  const code = normalizeBundleInviteCode(inviteCode)
  if (!code) return null
  const origin = getPublicSiteOrigin()
  if (!origin) return null
  return `${origin}/invite?code=${encodeURIComponent(code)}`
}

export function bundleMetaForProductId(productId) {
  if (productId === 'rome-couple') {
    return {
      productId: 'rome-couple',
      label: 'Couple Bundle',
      seatLimit: 2,
      contentProductId: 'rome-complete',
      stopCount: 21,
    }
  }
  if (productId === 'rome-family') {
    return {
      productId: 'rome-family',
      label: 'Family Bundle',
      seatLimit: 4,
      contentProductId: 'rome-complete',
      stopCount: 21,
    }
  }
  return null
}

function normalizeBundleView(raw, { isOwner = false } = {}) {
  if (!raw || typeof raw !== 'object') return null
  const purchasedProductId = raw.purchased_product_id ?? raw.purchasedProductId ?? raw.tier ?? null
  const contentProductId = raw.content_product_id ?? raw.contentProductId ?? 'rome-complete'
  const seatLimit = Number(raw.seat_limit ?? raw.seatLimit ?? 0) || null
  const role = raw.role ?? (isOwner ? 'owner' : null)
  const seats = Array.isArray(raw.seats)
    ? raw.seats.map((seat) => ({
        id: seat.id,
        label: seat.label ?? null,
        role: seat.role ?? null,
        status: seat.status ?? null,
        claimedAt: seat.claimedAt ?? seat.claimed_at ?? null,
        // Invite secrets are one-time; never invent codes from status refresh.
        inviteCode: seat.inviteCode ?? null,
      }))
    : null

  return {
    ok: true,
    id: raw.bundleId ?? raw.bundle_id ?? raw.id ?? null,
    bundleId: raw.bundleId ?? raw.bundle_id ?? raw.id ?? null,
    purchasedProductId,
    contentProductId,
    seatLimit,
    role,
    isOwner: role === 'owner' || Boolean(isOwner || raw.isOwner),
    bundleStatus: raw.bundle_status ?? raw.bundleStatus ?? null,
    seats,
    // Legacy alias used by older UI — maps from server product id only.
    tier:
      purchasedProductId === 'rome-couple'
        ? 'couple'
        : purchasedProductId === 'rome-family'
          ? 'family'
          : raw.tier ?? null,
  }
}

function memberViewFromAccess(access) {
  const purchasedProductId = access?.purchased_product_id ?? access?.purchasedProductId ?? null
  if (!isBundleSku(purchasedProductId)) return null
  return normalizeBundleView(
    {
      purchased_product_id: purchasedProductId,
      content_product_id: access.content_product_id ?? access.contentProductId ?? 'rome-complete',
      seat_limit: access.seat_limit ?? access.seatLimit,
      role: access.role ?? 'member',
      bundle_status: access.bundle_status ?? access.bundleStatus ?? 'active',
      seats: null,
    },
    { isOwner: access.role === 'owner' },
  )
}

function allowsLocalFamilyDevStore() {
  // Local store may exercise UI in DEV only — never grants production access.
  return import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEV_ACCESS === 'true'
}

function readMembership() {
  try {
    const raw = localStorage.getItem(MEMBERSHIP_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeMembership(bundle) {
  if (!bundle) {
    localStorage.removeItem(MEMBERSHIP_KEY)
    return
  }
  localStorage.setItem(
    MEMBERSHIP_KEY,
    JSON.stringify({
      bundleId: bundle.id ?? bundle.bundleId,
      tier: bundle.tier ?? bundle.purchased_product_id,
      cachedAt: Date.now(),
    }),
  )
}

function rpcError(error) {
  const message = error?.message ?? String(error)
  const code = message.includes('resume_leader_only')
    ? 'resume_leader_only'
    : message.includes('invite_already_claimed')
      ? 'invite_already_claimed'
      : message.includes('invite_not_found')
        ? 'invite_not_found'
        : message.includes('not_a_member')
          ? 'not_a_member'
          : message.includes('not_owner')
            ? 'not_owner'
            : message.includes('no_seat')
              ? 'no_seat'
              : message.includes('missing_credential')
                ? 'missing_credential'
                : message.includes('session_not_found')
                  ? 'session_not_found'
                  : message.includes('token_not_found')
                    ? 'token_not_found'
                    : message.includes('retired')
                      ? 'retired'
                      : 'unknown'
  const err = new Error(message)
  err.code = code
  return err
}

async function tryRpc(name, args) {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'not_configured' }
  const { data, error } = await supabase.rpc(name, args)
  if (error) return { ok: false, reason: 'rpc', error }
  if (data && typeof data === 'object' && data.ok === false) {
    return { ok: false, reason: data.reason ?? 'rejected', data }
  }
  return { ok: true, data }
}

export const FAMILY_TIERS = {
  couple: { id: 'couple', label: 'Couple', seats: 2, blurb: 'You + one walker', productId: 'rome-couple' },
  family: { id: 'family', label: 'Family', seats: 4, blurb: 'Up to four walkers', productId: 'rome-family' },
}

/**
 * Bundles are created only by the verified webhook/service role for paid
 * rome-couple / rome-family purchases. Client cannot choose a tier to mint access.
 */
export async function createFamilyBundle() {
  const err = new Error('Bundles are created by a verified Couple/Family purchase only')
  err.code = 'retired'
  throw err
}

export async function createBundleInvite({ seatId = null } = {}) {
  const credential = readDeviceCredential()
  if (!credential) {
    const err = new Error('missing_credential')
    err.code = 'missing_credential'
    throw err
  }
  const remote = await tryRpc('create_bundle_invite', {
    p_credential: credential,
    p_seat_id: seatId,
    p_device_binding: getDeviceId(),
  })
  if (remote.ok && remote.data?.ok === false) {
    const err = new Error(remote.data.reason ?? 'invite_failed')
    err.code = remote.data.reason ?? 'invite_failed'
    throw err
  }
  if (remote.ok && remote.data?.invite) {
    return {
      ok: true,
      invite: remote.data.invite,
      seatId: remote.data.seat_id ?? remote.data.seatId ?? seatId,
      expiresAt: remote.data.expires_at ?? remote.data.expiresAt ?? null,
    }
  }
  throw rpcError(remote.error ?? new Error(remote.reason ?? 'invite_failed'))
}

export async function revokeBundleSeat({ seatId }) {
  const credential = readDeviceCredential()
  if (!credential) {
    const err = new Error('missing_credential')
    err.code = 'missing_credential'
    throw err
  }
  if (!seatId) {
    const err = new Error('invalid')
    err.code = 'invalid'
    throw err
  }
  const remote = await tryRpc('revoke_bundle_seat', {
    p_credential: credential,
    p_seat_id: seatId,
    p_device_binding: getDeviceId(),
  })
  if (remote.ok && remote.data?.ok === false) {
    const err = new Error(remote.data.reason ?? 'revoke_failed')
    err.code = remote.data.reason ?? 'revoke_failed'
    throw err
  }
  if (remote.ok && remote.data?.ok !== false) return remote.data
  throw rpcError(remote.error ?? new Error(remote.reason ?? 'revoke_failed'))
}

export async function claimFamilySeat({ inviteCode, displayName = 'Walker' }) {
  const deviceBinding = getDeviceId()
  const remote = await tryRpc('redeem_bundle_invite', {
    // Client normalize is defense in depth; DB remains authoritative.
    p_invite: normalizeBundleInviteCode(inviteCode),
    p_device_binding: deviceBinding,
    p_display_name: displayName,
  })

  if (remote.ok && remote.data?.device_credential) {
    writeDeviceCredential(remote.data.device_credential)
    applyPurchaseUnlock({
      purchasedProductId: remote.data.purchased_product_id,
      contentProductId: remote.data.content_product_id,
      seatLimit: remote.data.seat_limit,
      role: remote.data.role,
      bundleStatus: remote.data.bundle_status,
      offlineLeaseExpiresAt: remote.data.offline_lease_expires_at,
    })
    writeMembership({
      id: remote.data.bundleId,
      purchased_product_id: remote.data.purchased_product_id,
    })
    return remote.data
  }

  if (remote.reason === 'rpc' && remote.error) {
    throw rpcError(remote.error)
  }

  // No production local-store fallback may claim a seat or grantAccess.
  if (!allowsLocalFamilyDevStore()) {
    const err = new Error(remote.reason ?? 'invite_not_found')
    err.code = remote.reason ?? 'invite_not_found'
    throw err
  }

  try {
    const bundle = localFamilyStore.claimSeat({
      inviteCode,
      deviceId: deviceBinding,
      displayName,
    })
    writeMembership(bundle)
    return bundle
  } catch (error) {
    throw rpcError(error)
  }
}

/**
 * Refresh shared-bundle view from the server.
 * Organizers get seat inventory; members get entitlement-only view.
 * Solo purchases and invalid credentials fail closed (null).
 * Never falls back to the local family store outside DEV.
 */
export async function refreshFamilyBundle() {
  const credential = readDeviceCredential()
  if (!credential) return null

  const remote = await tryRpc('get_organizer_bundle_status', {
    p_credential: credential,
    p_device_binding: getDeviceId(),
  })
  if (remote.ok && remote.data?.ok !== false) {
    const view = normalizeBundleView(remote.data, { isOwner: true })
    writeMembership(view)
    writeAccessEntitlement({
      purchasedProductId: view.purchasedProductId,
      contentProductId: view.contentProductId,
      seatLimit: view.seatLimit,
      role: 'owner',
      bundleStatus: view.bundleStatus,
    })
    return view
  }

  if (remote.ok && remote.data?.reason === 'not_owner') {
    const access = await tryRpc('validate_device_access', {
      p_credential: credential,
      p_device_binding: getDeviceId(),
    })
    if (access.ok && access.data?.ok !== false) {
      writeAccessEntitlement({
        purchasedProductId: access.data.purchased_product_id,
        contentProductId: access.data.content_product_id,
        seatLimit: access.data.seat_limit,
        role: access.data.role,
        bundleStatus: access.data.bundle_status,
        offlineLeaseExpiresAt: access.data.offline_lease_expires_at,
      })
      const memberView = memberViewFromAccess(access.data)
      if (memberView) writeMembership(memberView)
      return memberView
    }
    return null
  }

  if (remote.ok && (remote.data?.reason === 'invalid' || remote.reason === 'rejected')) {
    return null
  }

  // Network / not configured: use cached entitlement for members only; never mint seats.
  const entitlement = readAccessEntitlement()
  if (entitlement && isBundleSku(entitlement.purchasedProductId)) {
    return memberViewFromAccess(entitlement)
  }

  if (!allowsLocalFamilyDevStore()) return null
  const local = localFamilyStore.getBundleForDevice(getDeviceId())
  if (local) {
    writeMembership(local)
    return normalizeBundleView(local, { isOwner: Boolean(local.isOwner) })
  }
  return null
}

export function getCachedFamilyMembership() {
  return readMembership()
}

export async function discoverActiveWalkSession() {
  const credential = readDeviceCredential()
  if (!credential) return null
  const remote = await tryRpc('get_active_walk_session_for_credential', {
    p_credential: credential,
    p_device_binding: getDeviceId(),
  })
  if (remote.ok && remote.data?.id) {
    return remote.data
  }
  if (
    remote.reason === 'no_active_session' ||
    remote.reason === 'not_a_member' ||
    remote.reason === 'invalid' ||
    remote.data?.reason === 'no_active_session' ||
    remote.data?.reason === 'not_a_member' ||
    remote.data?.reason === 'invalid'
  ) {
    return null
  }
  if (!allowsLocalFamilyDevStore()) return null
  const membership = readMembership()
  if (!membership?.bundleId) return null
  return localFamilyStore.getActiveWalkSessionForBundle?.(membership.bundleId) ?? null
}

export async function createWalkSession({ resumePolicy = 'leader' } = {}) {
  const credential = readDeviceCredential()
  if (!credential) {
    const err = new Error('missing_credential')
    err.code = 'missing_credential'
    throw err
  }
  const remote = await tryRpc('create_walk_session_for_credential', {
    p_credential: credential,
    p_resume_policy: resumePolicy,
    p_device_binding: getDeviceId(),
  })
  if (remote.ok && remote.data?.ok !== false) return remote.data

  if (!allowsLocalFamilyDevStore()) {
    throw rpcError(
      remote.error ?? new Error(remote.data?.reason ?? remote.reason ?? 'session_failed'),
    )
  }
  const membership = readMembership()
  return localFamilyStore.createWalkSession({
    bundleId: membership?.bundleId,
    deviceId: getDeviceId(),
    resumePolicy,
  })
}

export async function joinWalkSession({ joinCode }) {
  // Join by code is retired without seat credential; members already have seat access.
  void joinCode
  const err = new Error('Join with a seat invite instead of a public walk code')
  err.code = 'retired'
  throw err
}

export async function getWalkSession(sessionId) {
  const credential = readDeviceCredential()
  if (!credential) return null
  const remote = await tryRpc('get_walk_session_for_credential', {
    p_credential: credential,
    p_session_id: sessionId,
    p_device_binding: getDeviceId(),
  })
  if (remote.ok && remote.data?.ok !== false) return remote.data
  if (!allowsLocalFamilyDevStore()) return null
  return localFamilyStore.getWalkSession(sessionId)
}

export async function updateWalkSessionState(sessionId, patch) {
  const credential = readDeviceCredential()
  if (!credential) {
    const err = new Error('missing_credential')
    err.code = 'missing_credential'
    throw err
  }
  const remote = await tryRpc('update_walk_session_for_credential', {
    p_credential: credential,
    p_session_id: sessionId,
    p_patch: patch,
    p_device_binding: getDeviceId(),
  })
  if (remote.ok && remote.data?.ok !== false) return remote.data
  if (remote.reason === 'stale_update' && remote.data?.id) {
    // Server kept newer state — return it so the client converges.
    return { ...remote.data, ok: true }
  }
  if (remote.data?.reason === 'stale_update' && remote.data?.id) {
    return { ...remote.data, ok: true }
  }
  if (remote.reason === 'resume_leader_only' || remote.data?.reason === 'resume_leader_only') {
    throw rpcError(new Error('resume_leader_only'))
  }
  if (!allowsLocalFamilyDevStore()) {
    throw rpcError(
      remote.error ?? new Error(remote.data?.reason ?? remote.reason ?? 'session_failed'),
    )
  }
  try {
    return localFamilyStore.updateWalkSessionState({
      sessionId,
      deviceId: getDeviceId(),
      patch,
    })
  } catch (error) {
    throw rpcError(error)
  }
}

/**
 * Poll an existing session, or discover one when the device has no cached id.
 * Cleans up on unmount / stop.
 */
export function subscribeWalkSession(sessionId, onUpdate, { discover = false } = {}) {
  let stopped = false
  const tick = async () => {
    if (stopped) return
    let next = null
    if (sessionId) {
      next = await getWalkSession(sessionId)
      if (!stopped) onUpdate(next)
      return
    }
    if (discover) {
      next = await discoverActiveWalkSession()
      if (!stopped && next) onUpdate(next)
    }
  }

  void tick()
  const poll = setInterval(() => {
    void tick()
  }, 2500)

  if (allowsLocalFamilyDevStore()) {
    const localUnsub = localFamilyStore.subscribe(() => {
      void tick()
    })
    return () => {
      stopped = true
      clearInterval(poll)
      localUnsub()
    }
  }

  return () => {
    stopped = true
    clearInterval(poll)
  }
}

export function isLeader(session, id = null) {
  if (!session) return false
  // Server payloads include mySeatId — prefer seat comparison (authoritative).
  if (session.leaderSeatId && session.mySeatId) {
    return session.leaderSeatId === session.mySeatId
  }
  if (session.leaderSeatId) {
    return Boolean(id && session.leaderSeatId === id)
  }
  // Legacy local-store shape uses device ids
  return Boolean(session.leaderDeviceId && session.leaderDeviceId === (id ?? getDeviceId()))
}

/**
 * Accept a polled/remote session only when it is the same generation or newer.
 * Prevents out-of-order responses from overwriting fresher local state.
 */
export function shouldAcceptRemoteSession(localSession, remoteSession) {
  if (!remoteSession?.id) return false
  if (localSession?.id && remoteSession.id !== localSession.id) {
    // Different session id — accept (organizer restarted).
    return true
  }
  if (!localSession?.updatedAt || !remoteSession.updatedAt) return true
  const localTs = Date.parse(localSession.updatedAt)
  const remoteTs = Date.parse(remoteSession.updatedAt)
  if (!Number.isFinite(localTs) || !Number.isFinite(remoteTs)) return true
  return remoteTs >= localTs
}

export function canResumeForAll(session, id = null) {
  if (!session?.syncEnabled) return true
  if (session.resumePolicy === 'anyone') return true
  return isLeader(session, id)
}
