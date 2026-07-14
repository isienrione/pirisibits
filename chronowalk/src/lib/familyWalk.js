import { supabase, isSupabaseConfigured } from './supabase.js'
import { getDeviceId } from './deviceId.js'
import { localFamilyStore } from './familyLocalStore.js'
import { grantAccess } from './config.js'

const MEMBERSHIP_KEY = 'cw_family_membership_v1'

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
      bundleId: bundle.id,
      tier: bundle.tier,
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
              : 'unknown'
  const err = new Error(message)
  err.code = code
  return err
}

async function tryRpc(name, args) {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'not_configured' }
  const { data, error } = await supabase.rpc(name, args)
  if (error) return { ok: false, reason: 'rpc', error }
  return { ok: true, data }
}

export const FAMILY_TIERS = {
  couple: { id: 'couple', label: 'Couple', seats: 2, blurb: 'You + one walker' },
  family: { id: 'family', label: 'Family', seats: 4, blurb: 'Up to four walkers' },
}

export async function createFamilyBundle({ tier, ownerName = 'Leader', accessToken = null }) {
  const deviceId = getDeviceId()
  const remote = await tryRpc('create_family_bundle', {
    p_access_token: accessToken || '00000000-0000-4000-8000-000000000000',
    p_tier: tier,
    p_device_id: deviceId,
    p_owner_name: ownerName,
  })

  if (remote.ok && remote.data) {
    writeMembership(remote.data)
    grantAccess()
    return remote.data
  }

  // Local / DEV path — works without Supabase (and when token RPC rejects)
  const bundle = localFamilyStore.createBundle({ tier, deviceId, ownerName })
  writeMembership(bundle)
  grantAccess()
  return bundle
}

export async function claimFamilySeat({ inviteCode, displayName = 'Walker' }) {
  const deviceId = getDeviceId()
  const remote = await tryRpc('claim_family_seat', {
    p_invite_code: String(inviteCode).trim().toUpperCase(),
    p_device_id: deviceId,
    p_display_name: displayName,
  })

  if (remote.ok && remote.data) {
    writeMembership(remote.data)
    grantAccess()
    return remote.data
  }

  if (remote.reason === 'rpc' && remote.error) {
    // Prefer structured local failure only when not configured; if RPC failed for
    // a known business reason, rethrow.
    const msg = remote.error.message ?? ''
    if (
      msg.includes('invite_not_found') ||
      msg.includes('invite_already_claimed') ||
      msg.includes('invite_revoked')
    ) {
      throw rpcError(remote.error)
    }
  }

  try {
    const bundle = localFamilyStore.claimSeat({ inviteCode, deviceId, displayName })
    writeMembership(bundle)
    grantAccess()
    return bundle
  } catch (error) {
    throw rpcError(error)
  }
}

export async function refreshFamilyBundle() {
  const deviceId = getDeviceId()
  const remote = await tryRpc('get_bundle_for_device', { p_device_id: deviceId })
  if (remote.ok && remote.data) {
    writeMembership(remote.data)
    return remote.data
  }
  const local = localFamilyStore.getBundleForDevice(deviceId)
  if (local) writeMembership(local)
  return local
}

export function getCachedFamilyMembership() {
  return readMembership()
}

export async function createWalkSession({ bundleId, resumePolicy = 'leader' }) {
  const deviceId = getDeviceId()
  const remote = await tryRpc('create_walk_session', {
    p_bundle_id: bundleId,
    p_device_id: deviceId,
    p_resume_policy: resumePolicy,
  })
  if (remote.ok && remote.data) return remote.data

  return localFamilyStore.createWalkSession({ bundleId, deviceId, resumePolicy })
}

export async function joinWalkSession({ joinCode }) {
  const deviceId = getDeviceId()
  const remote = await tryRpc('join_walk_session', {
    p_join_code: String(joinCode).trim().toUpperCase(),
    p_device_id: deviceId,
  })
  if (remote.ok && remote.data) return remote.data
  if (remote.reason === 'rpc' && remote.error) {
    const msg = remote.error.message ?? ''
    if (msg.includes('session_not_found') || msg.includes('not_a_member')) {
      throw rpcError(remote.error)
    }
  }
  try {
    return localFamilyStore.joinWalkSession({ joinCode, deviceId })
  } catch (error) {
    throw rpcError(error)
  }
}

export async function getWalkSession(sessionId) {
  const remote = await tryRpc('get_walk_session', { p_session_id: sessionId })
  if (remote.ok && remote.data) return remote.data
  return localFamilyStore.getWalkSession(sessionId)
}

export async function updateWalkSessionState(sessionId, patch) {
  const deviceId = getDeviceId()
  const remote = await tryRpc('update_walk_session_state', {
    p_session_id: sessionId,
    p_device_id: deviceId,
    p_patch: patch,
  })
  if (remote.ok && remote.data) return remote.data
  if (remote.reason === 'rpc' && remote.error) {
    const msg = remote.error.message ?? ''
    if (msg.includes('resume_leader_only') || msg.includes('session_not_found')) {
      throw rpcError(remote.error)
    }
  }
  try {
    return localFamilyStore.updateWalkSessionState({ sessionId, deviceId, patch })
  } catch (error) {
    throw rpcError(error)
  }
}

export function subscribeWalkSession(sessionId, onUpdate) {
  if (isSupabaseConfigured() && supabase) {
    const channel = supabase
      .channel(`walk_session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'walk_sessions',
          filter: `id=eq.${sessionId}`,
        },
        async () => {
          const next = await getWalkSession(sessionId)
          if (next) onUpdate(next)
        },
      )
      .subscribe()

    const localUnsub = localFamilyStore.subscribe(async () => {
      const next = await getWalkSession(sessionId)
      if (next) onUpdate(next)
    })

    // Lightweight poll backup (Realtime may be delayed / disabled)
    const poll = setInterval(async () => {
      const next = await getWalkSession(sessionId)
      if (next) onUpdate(next)
    }, 2500)

    return () => {
      clearInterval(poll)
      localUnsub()
      void supabase.removeChannel(channel)
    }
  }

  return localFamilyStore.subscribe(async () => {
    const next = await getWalkSession(sessionId)
    if (next) onUpdate(next)
  })
}

export function isLeader(session, deviceId = getDeviceId()) {
  return Boolean(session && session.leaderDeviceId === deviceId)
}

export function canResumeForAll(session, deviceId = getDeviceId()) {
  if (!session?.syncEnabled) return true // autonomous
  if (session.resumePolicy === 'anyone') return true
  return isLeader(session, deviceId)
}
