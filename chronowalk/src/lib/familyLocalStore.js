/**
 * Local in-memory + localStorage family/walk store for DEV and when Supabase
 * RPCs are unavailable. Mirrors the SQL surface enough for UI + unit tests.
 * Multi-tab uses BroadcastChannel when available.
 */

const BUNDLE_KEY = 'cw_family_bundle_v1'
const SESSION_KEY = 'cw_walk_session_v1'
const CHANNEL = 'cw-family-walk'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  try {
    const bc = new BroadcastChannel(CHANNEL)
    bc.postMessage({ type: 'store', key, value })
    bc.close()
  } catch {
    /* ignore */
  }
}

function randomCode(len = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function serializeBundle(bundle, deviceId) {
  const mySeat = bundle.seats.find((s) => s.claimedDeviceId === deviceId) ?? null
  return {
    id: bundle.id,
    tier: bundle.tier,
    seatLimit: bundle.seatLimit,
    ownerDeviceId: bundle.ownerDeviceId,
    isOwner: bundle.ownerDeviceId === deviceId,
    mySeat: mySeat
      ? {
          id: mySeat.id,
          label: mySeat.label,
          status: mySeat.status,
          isOwner: mySeat.claimedDeviceId === bundle.ownerDeviceId,
        }
      : null,
    seats: bundle.seats.map((s) => ({
      id: s.id,
      label: s.label,
      inviteCode: s.inviteCode,
      status: s.status,
      claimedDeviceId: s.claimedDeviceId,
      claimedDisplayName: s.claimedDisplayName,
      claimedAt: s.claimedAt,
    })),
  }
}

function serializeSession(session, deviceId = null) {
  const independent = Array.isArray(session.independentDeviceIds)
    ? session.independentDeviceIds
    : []
  return {
    id: session.id,
    bundleId: session.bundleId,
    joinCode: session.joinCode,
    leaderDeviceId: session.leaderDeviceId,
    leaderSeatId: session.leaderSeatId ?? null,
    mySeatId: session.mySeatId ?? null,
    syncEnabled: session.syncEnabled,
    resumePolicy: session.resumePolicy,
    waypointId: session.waypointId,
    chapterIndex: session.chapterIndex,
    positionSeconds: session.positionSeconds,
    playbackRate: session.playbackRate,
    playing: session.playing,
    paused: session.paused,
    pauseSourceDeviceId: session.pauseSourceDeviceId,
    pauseSourceSeatId: session.pauseSourceSeatId ?? null,
    updatedAt: session.updatedAt,
    expiresAt: session.expiresAt,
    status: session.status ?? 'active',
    syncParticipation:
      deviceId && independent.includes(deviceId) ? 'independent' : 'synced',
  }
}

export const localFamilyStore = {
  createBundle({ tier, deviceId, ownerName = 'Leader' }) {
    const seatLimit = tier === 'couple' ? 2 : 4
    const seats = []
    seats.push({
      id: uid(),
      label: ownerName || 'Leader',
      inviteCode: randomCode(6),
      status: 'claimed',
      claimedDeviceId: deviceId,
      claimedDisplayName: ownerName || 'Leader',
      claimedAt: new Date().toISOString(),
    })
    for (let i = 2; i <= seatLimit; i += 1) {
      seats.push({
        id: uid(),
        label: tier === 'couple' ? 'Partner' : `Walker ${i}`,
        inviteCode: randomCode(6),
        status: 'open',
        claimedDeviceId: null,
        claimedDisplayName: null,
        claimedAt: null,
      })
    }
    const bundle = {
      id: uid(),
      tier,
      seatLimit,
      ownerDeviceId: deviceId,
      seats,
    }
    writeJson(BUNDLE_KEY, bundle)
    return serializeBundle(bundle, deviceId)
  },

  getBundleForDevice(deviceId) {
    const bundle = readJson(BUNDLE_KEY, null)
    if (!bundle) return null
    const mine = bundle.seats.some((s) => s.claimedDeviceId === deviceId && s.status === 'claimed')
    if (!mine) return null
    return serializeBundle(bundle, deviceId)
  },

  claimSeat({ inviteCode, deviceId, displayName = 'Walker' }) {
    const bundle = readJson(BUNDLE_KEY, null)
    if (!bundle) {
      const err = new Error('invite_not_found')
      err.code = 'invite_not_found'
      throw err
    }
    const seat = bundle.seats.find((s) => s.inviteCode.toUpperCase() === String(inviteCode).trim().toUpperCase())
    if (!seat) {
      const err = new Error('invite_not_found')
      err.code = 'invite_not_found'
      throw err
    }
    if (seat.status === 'revoked') {
      const err = new Error('invite_revoked')
      err.code = 'invite_revoked'
      throw err
    }
    if (seat.status === 'claimed' && seat.claimedDeviceId !== deviceId) {
      const err = new Error('invite_already_claimed')
      err.code = 'invite_already_claimed'
      throw err
    }
    seat.status = 'claimed'
    seat.claimedDeviceId = deviceId
    seat.claimedDisplayName = displayName || seat.label
    seat.claimedAt = seat.claimedAt ?? new Date().toISOString()
    writeJson(BUNDLE_KEY, bundle)
    return serializeBundle(bundle, deviceId)
  },

  createWalkSession({ bundleId, deviceId, resumePolicy = 'leader' }) {
    const bundle = readJson(BUNDLE_KEY, null)
    if (!bundle || bundle.id !== bundleId) {
      const err = new Error('not_a_member')
      err.code = 'not_a_member'
      throw err
    }
    const mine = bundle.seats.some((s) => s.claimedDeviceId === deviceId && s.status === 'claimed')
    if (!mine) {
      const err = new Error('not_a_member')
      err.code = 'not_a_member'
      throw err
    }
    const now = Date.now()
    const session = {
      id: uid(),
      bundleId,
      joinCode: randomCode(5),
      leaderDeviceId: deviceId,
      syncEnabled: true,
      resumePolicy: resumePolicy === 'anyone' ? 'anyone' : 'leader',
      waypointId: null,
      chapterIndex: 0,
      positionSeconds: 0,
      playbackRate: 1,
      playing: false,
      paused: true,
      pauseSourceDeviceId: null,
      independentDeviceIds: [],
      updatedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 18 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    }
    writeJson(SESSION_KEY, session)
    return serializeSession(session, deviceId)
  },

  joinWalkSession({ joinCode, deviceId }) {
    const session = readJson(SESSION_KEY, null)
    if (!session || session.joinCode.toUpperCase() !== String(joinCode).trim().toUpperCase()) {
      const err = new Error('session_not_found')
      err.code = 'session_not_found'
      throw err
    }
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      const err = new Error('session_not_found')
      err.code = 'session_not_found'
      throw err
    }
    const bundle = readJson(BUNDLE_KEY, null)
    if (!bundle || bundle.id !== session.bundleId) {
      const err = new Error('not_a_member')
      err.code = 'not_a_member'
      throw err
    }
    const mine = bundle.seats.some((s) => s.claimedDeviceId === deviceId && s.status === 'claimed')
    if (!mine) {
      const err = new Error('not_a_member')
      err.code = 'not_a_member'
      throw err
    }
    return serializeSession(session, deviceId)
  },

  getWalkSession(sessionId, deviceId = null) {
    const session = readJson(SESSION_KEY, null)
    if (!session || session.id !== sessionId) return null
    return serializeSession(session, deviceId)
  },

  getActiveWalkSessionForBundle(bundleId, deviceId = null) {
    const session = readJson(SESSION_KEY, null)
    if (!session || session.bundleId !== bundleId) return null
    if (new Date(session.expiresAt).getTime() <= Date.now()) return null
    return serializeSession(session, deviceId)
  },

  detachWalkSession({ deviceId }) {
    const session = readJson(SESSION_KEY, null)
    if (!session) {
      const err = new Error('no_active_session')
      err.code = 'no_active_session'
      throw err
    }
    const bundle = readJson(BUNDLE_KEY, null)
    const mine = bundle?.seats.some((s) => s.claimedDeviceId === deviceId && s.status === 'claimed')
    if (!mine) {
      const err = new Error('not_a_member')
      err.code = 'not_a_member'
      throw err
    }
    if (session.leaderDeviceId === deviceId) {
      const err = new Error('leader_cannot_detach')
      err.code = 'leader_cannot_detach'
      throw err
    }
    const independent = Array.isArray(session.independentDeviceIds)
      ? session.independentDeviceIds
      : []
    if (!independent.includes(deviceId)) {
      session.independentDeviceIds = [...independent, deviceId]
      session.updatedAt = new Date().toISOString()
      writeJson(SESSION_KEY, session)
    }
    return serializeSession(session, deviceId)
  },

  rejoinWalkSession({ deviceId }) {
    const session = readJson(SESSION_KEY, null)
    if (!session) {
      const err = new Error('no_active_session')
      err.code = 'no_active_session'
      throw err
    }
    const bundle = readJson(BUNDLE_KEY, null)
    const mine = bundle?.seats.some((s) => s.claimedDeviceId === deviceId && s.status === 'claimed')
    if (!mine) {
      const err = new Error('not_a_member')
      err.code = 'not_a_member'
      throw err
    }
    session.independentDeviceIds = (session.independentDeviceIds || []).filter((id) => id !== deviceId)
    session.updatedAt = new Date().toISOString()
    writeJson(SESSION_KEY, session)
    return serializeSession(session, deviceId)
  },

  updateWalkSessionState({ sessionId, deviceId, patch }) {
    const session = readJson(SESSION_KEY, null)
    if (!session || session.id !== sessionId) {
      const err = new Error('session_not_found')
      err.code = 'session_not_found'
      throw err
    }
    const bundle = readJson(BUNDLE_KEY, null)
    const mine = bundle?.seats.some((s) => s.claimedDeviceId === deviceId && s.status === 'claimed')
    if (!mine) {
      const err = new Error('not_a_member')
      err.code = 'not_a_member'
      throw err
    }

    const isLeader = session.leaderDeviceId === deviceId

    if (Object.prototype.hasOwnProperty.call(patch, 'syncEnabled')) {
      session.syncEnabled = Boolean(patch.syncEnabled)
    }
    if (patch.resumePolicy) {
      session.resumePolicy = patch.resumePolicy === 'anyone' ? 'anyone' : 'leader'
    }

    if (patch.event) {
      if (!session.syncEnabled && ['pause', 'resume', 'seek', 'rate', 'clock'].includes(patch.event)) {
        // sync off - ignore transport
      } else {
        switch (patch.event) {
          case 'pause':
            session.playing = false
            session.paused = true
            session.pauseSourceDeviceId = deviceId
            if (typeof patch.positionSeconds === 'number') session.positionSeconds = patch.positionSeconds
            break
          case 'resume':
            if (session.resumePolicy === 'leader' && !isLeader) {
              const err = new Error('resume_leader_only')
              err.code = 'resume_leader_only'
              throw err
            }
            session.playing = true
            session.paused = false
            session.pauseSourceDeviceId = null
            if (typeof patch.positionSeconds === 'number') session.positionSeconds = patch.positionSeconds
            break
          case 'seek':
            if (typeof patch.positionSeconds === 'number') session.positionSeconds = patch.positionSeconds
            if (typeof patch.chapterIndex === 'number') session.chapterIndex = patch.chapterIndex
            break
          case 'rate':
            if (typeof patch.playbackRate === 'number') session.playbackRate = patch.playbackRate
            break
          case 'clock':
            if (isLeader) {
              if (patch.waypointId != null) session.waypointId = patch.waypointId
              if (typeof patch.chapterIndex === 'number') session.chapterIndex = patch.chapterIndex
              if (typeof patch.positionSeconds === 'number') session.positionSeconds = patch.positionSeconds
              if (typeof patch.playbackRate === 'number') session.playbackRate = patch.playbackRate
              if (typeof patch.playing === 'boolean') session.playing = patch.playing
              if (typeof patch.paused === 'boolean') session.paused = patch.paused
            }
            break
          default:
            break
        }
      }
    }

    if (patch.waypointId != null && isLeader) {
      session.waypointId = patch.waypointId
    }

    session.updatedAt = new Date().toISOString()
    writeJson(SESSION_KEY, session)
    return serializeSession(session, deviceId)
  },

  /** Subscribe to local session mutations (BroadcastChannel + storage). */
  subscribe(onChange) {
    const handler = (event) => {
      if (event?.data?.key === SESSION_KEY || event?.key === SESSION_KEY) onChange()
    }
    let bc = null
    try {
      bc = new BroadcastChannel(CHANNEL)
      bc.onmessage = handler
    } catch {
      /* ignore */
    }
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('storage', handler)
      try {
        bc?.close()
      } catch {
        /* ignore */
      }
    }
  },

  /** Test helper */
  _reset() {
    localStorage.removeItem(BUNDLE_KEY)
    localStorage.removeItem(SESSION_KEY)
  },
}
