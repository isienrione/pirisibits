import { supabase, isSupabaseConfigured } from './supabase.js'
import { getDeviceId } from './deviceId.js'
import { localFamilyStore } from './familyLocalStore.js'
import { readDeviceCredential, writeDeviceCredential } from './accessSession.js'
import { applyPurchaseUnlock } from './pendingPurchase.js'

const MEMBERSHIP_KEY = 'cw_family_membership_v1'

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
  if (remote.ok && remote.data?.ok !== false) return remote.data
  throw rpcError(remote.error ?? new Error(remote.reason ?? 'invite_failed'))
}

export async function claimFamilySeat({ inviteCode, displayName = 'Walker' }) {
  const deviceBinding = getDeviceId()
  const remote = await tryRpc('redeem_bundle_invite', {
    p_invite: String(inviteCode).trim(),
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

export async function refreshFamilyBundle() {
  const credential = readDeviceCredential()
  if (!credential) return null
  const remote = await tryRpc('get_organizer_bundle_status', {
    p_credential: credential,
    p_device_binding: getDeviceId(),
  })
  if (remote.ok && remote.data?.ok !== false) {
    writeMembership(remote.data)
    return remote.data
  }
  if (!allowsLocalFamilyDevStore()) return null
  const local = localFamilyStore.getBundleForDevice(getDeviceId())
  if (local) writeMembership(local)
  return local
}

export function getCachedFamilyMembership() {
  return readMembership()
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
    throw rpcError(remote.error ?? new Error(remote.reason ?? 'session_failed'))
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
  if (remote.data?.reason === 'resume_leader_only') {
    throw rpcError(new Error('resume_leader_only'))
  }
  if (!allowsLocalFamilyDevStore()) {
    throw rpcError(remote.error ?? new Error(remote.reason ?? 'session_failed'))
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

export function subscribeWalkSession(sessionId, onUpdate) {
  // Direct anon Realtime on walk_sessions is disabled (credential bypass risk).
  // Poll via credential-authorized RPC instead.
  const poll = setInterval(async () => {
    const next = await getWalkSession(sessionId)
    if (next) onUpdate(next)
  }, 2500)

  if (allowsLocalFamilyDevStore()) {
    const localUnsub = localFamilyStore.subscribe(async () => {
      const next = await getWalkSession(sessionId)
      if (next) onUpdate(next)
    })
    return () => {
      clearInterval(poll)
      localUnsub()
    }
  }

  return () => clearInterval(poll)
}

export function isLeader(session, id = null) {
  if (!session) return false
  if (session.leaderSeatId) {
    return Boolean(id && session.leaderSeatId === id)
  }
  // Legacy local-store shape uses device ids
  return Boolean(session.leaderDeviceId && session.leaderDeviceId === (id ?? getDeviceId()))
}

export function canResumeForAll(session, id = null) {
  if (!session?.syncEnabled) return true
  if (session.resumePolicy === 'anyone') return true
  return isLeader(session, id)
}
