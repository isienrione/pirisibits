import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getDeviceId } from '../lib/deviceId.js'
import { readAccessEntitlement, readDeviceCredential } from '../lib/accessSession.js'
import { isBundleSku } from '../lib/launchSkus.js'
import {
  canResumeForAll,
  createBundleInvite,
  createWalkSession,
  claimFamilySeat,
  discoverActiveWalkSession,
  isLeader,
  joinWalkSession,
  refreshFamilyBundle,
  revokeBundleSeat,
  shouldAcceptRemoteSession,
  subscribeWalkSession,
  updateWalkSessionState,
} from '../lib/familyWalk.js'

const SESSION_CACHE_KEY = 'cw_active_walk_session_v1'

function readCachedSession() {
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCachedSession(session) {
  if (!session) {
    localStorage.removeItem(SESSION_CACHE_KEY)
    return
  }
  localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session))
}

/**
 * Family bundle membership + shared walk session controls.
 *
 * Bundles are purchase-minted only. This hook never creates a paid SKU or
 * lets the client choose seat_limit / content entitlement.
 *
 * Members discover organizer-created sessions via credential-authorized RPC
 * even when this device has no cached session id.
 */
export function useFamilyWalk() {
  const deviceId = useMemo(() => getDeviceId(), [])
  const [bundle, setBundle] = useState(null)
  const [session, setSession] = useState(() => readCachedSession())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  /** One-time invite secrets keyed by seat id — never logged / never analytics. */
  const [latestInvites, setLatestInvites] = useState({})
  const applyingRemoteRef = useRef(false)
  const lastUpdatedRef = useRef(session?.updatedAt ?? null)
  const sessionRef = useRef(session)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const markApplyingRemote = useCallback((active) => {
    applyingRemoteRef.current = Boolean(active)
  }, [])

  const isApplyingRemote = useCallback(() => applyingRemoteRef.current, [])

  const adoptSession = useCallback((next) => {
    if (!next?.id) return false
    const current = sessionRef.current
    if (!shouldAcceptRemoteSession(current, next)) return false
    if (next.updatedAt && next.updatedAt === lastUpdatedRef.current && next.id === current?.id) {
      return false
    }
    lastUpdatedRef.current = next.updatedAt ?? null
    setSession(next)
    return true
  }, [])

  useEffect(() => {
    let cancelled = false
    refreshFamilyBundle()
      .then(async (next) => {
        if (cancelled) return
        setBundle(next)
        // After boot / reload: discover an organizer session if we have bundle access.
        if (next || readDeviceCredential()) {
          const discovered = await discoverActiveWalkSession()
          if (!cancelled && discovered) adoptSession(discovered)
        }
      })
      .catch(() => {
        if (!cancelled) setBundle(null)
      })
    return () => {
      cancelled = true
    }
  }, [adoptSession])

  useEffect(() => {
    writeCachedSession(session)
  }, [session])

  const entitlement = readAccessEntitlement()
  const purchasedProductId = bundle?.purchasedProductId ?? entitlement?.purchasedProductId ?? null
  const hasBundleAccess = Boolean(
    bundle || (entitlement && isBundleSku(entitlement.purchasedProductId)),
  )

  useEffect(() => {
    if (!hasBundleAccess && !session?.id) return undefined
    // Poll known session, or discover when this device has no cached id yet.
    return subscribeWalkSession(
      session?.id ?? null,
      (next) => {
        if (!next) {
          if (sessionRef.current?.id) {
            lastUpdatedRef.current = null
            setSession(null)
            writeCachedSession(null)
          }
          return
        }
        adoptSession(next)
      },
      { discover: !session?.id && hasBundleAccess },
    )
  }, [session?.id, hasBundleAccess, adoptSession])

  const run = useCallback(async (fn) => {
    setBusy(true)
    setError(null)
    try {
      return await fn()
    } catch (err) {
      setError(err?.code || err?.message || 'unknown')
      throw err
    } finally {
      setBusy(false)
    }
  }, [])

  /** @deprecated Bundles are created by verified purchase only. */
  const setupBundle = useCallback(() => {
    const err = new Error('Bundles are created by a verified Couple/Family purchase only')
    err.code = 'retired'
    setError('retired')
    return Promise.reject(err)
  }, [])

  const redeemInvite = useCallback(
    (inviteCode, displayName) =>
      run(async () => {
        const next = await claimFamilySeat({ inviteCode, displayName })
        const refreshed = await refreshFamilyBundle()
        setBundle(refreshed ?? next)
        const discovered = await discoverActiveWalkSession()
        if (discovered) adoptSession(discovered)
        return refreshed ?? next
      }),
    [adoptSession, run],
  )

  const createInvite = useCallback(
    (seatId = null) =>
      run(async () => {
        const created = await createBundleInvite({ seatId })
        const refreshed = await refreshFamilyBundle()
        if (refreshed) setBundle(refreshed)
        if (created?.seatId && created?.invite) {
          setLatestInvites((prev) => ({ ...prev, [created.seatId]: created.invite }))
        }
        return created
      }),
    [run],
  )

  const revokeSeat = useCallback(
    (seatId) =>
      run(async () => {
        const result = await revokeBundleSeat({ seatId })
        setLatestInvites((prev) => {
          const next = { ...prev }
          delete next[seatId]
          return next
        })
        const refreshed = await refreshFamilyBundle()
        if (refreshed) setBundle(refreshed)
        return result
      }),
    [run],
  )

  const startSharedWalk = useCallback(
    (resumePolicy = 'leader') =>
      run(async () => {
        if (!bundle?.id && !bundle?.bundleId) throw new Error('no_bundle')
        const next = await createWalkSession({ resumePolicy })
        adoptSession(next)
        return next
      }),
    [adoptSession, bundle?.bundleId, bundle?.id, run],
  )

  const joinSharedWalk = useCallback(
    (joinCode) =>
      run(async () => {
        const next = await joinWalkSession({ joinCode })
        adoptSession(next)
        return next
      }),
    [adoptSession, run],
  )

  const leaveSharedWalk = useCallback(() => {
    setSession(null)
    lastUpdatedRef.current = null
    writeCachedSession(null)
  }, [])

  const patchSession = useCallback(
    async (patch) => {
      const current = sessionRef.current
      if (!current?.id) return null
      const next = await updateWalkSessionState(current.id, {
        ...patch,
        expectedUpdatedAt: current.updatedAt,
      })
      adoptSession(next)
      return next
    },
    [adoptSession],
  )

  const setSyncEnabled = useCallback(
    (enabled) => patchSession({ syncEnabled: Boolean(enabled) }),
    [patchSession],
  )

  const setResumePolicy = useCallback(
    (policy) => patchSession({ resumePolicy: policy === 'anyone' ? 'anyone' : 'leader' }),
    [patchSession],
  )

  const publishPause = useCallback(
    (positionSeconds) =>
      patchSession({
        event: 'pause',
        positionSeconds,
      }),
    [patchSession],
  )

  const publishResume = useCallback(
    async (positionSeconds) => {
      if (!canResumeForAll(sessionRef.current, deviceId)) {
        const err = new Error('resume_leader_only')
        err.code = 'resume_leader_only'
        throw err
      }
      return patchSession({
        event: 'resume',
        positionSeconds,
      })
    },
    [deviceId, patchSession],
  )

  const publishSeek = useCallback(
    (positionSeconds, chapterIndex) =>
      patchSession({
        event: 'seek',
        positionSeconds,
        chapterIndex,
      }),
    [patchSession],
  )

  const publishClock = useCallback(
    (clock) =>
      patchSession({
        event: 'clock',
        ...clock,
      }),
    [patchSession],
  )

  const refreshBundle = useCallback(
    () =>
      refreshFamilyBundle().then(async (next) => {
        setBundle(next)
        const discovered = await discoverActiveWalkSession()
        if (discovered) adoptSession(discovered)
        return next
      }),
    [adoptSession],
  )

  const refreshSharedSession = useCallback(async () => {
    const discovered = await discoverActiveWalkSession()
    if (discovered) {
      adoptSession(discovered)
      return discovered
    }
    return null
  }, [adoptSession])

  const isOrganizer = Boolean(bundle?.isOwner || bundle?.role === 'owner')
  const isMember = Boolean(
    bundle?.role === 'member' || (!bundle?.isOwner && entitlement?.role === 'member'),
  )

  const leader = isLeader(session, session?.mySeatId ?? deviceId)
  const syncOn = Boolean(session?.syncEnabled)
  const resumeAllowed = canResumeForAll(session, session?.mySeatId ?? deviceId)

  return {
    deviceId,
    bundle,
    session,
    busy,
    error,
    clearError: () => setError(null),
    isLeader: leader,
    syncEnabled: syncOn,
    resumePolicy: session?.resumePolicy ?? 'leader',
    canResumeForAll: resumeAllowed,
    hasBundleAccess,
    isOrganizer,
    isMember,
    purchasedProductId,
    latestInvites,
    setupBundle,
    createInvite,
    revokeSeat,
    redeemInvite,
    startSharedWalk,
    joinSharedWalk,
    leaveSharedWalk,
    setSyncEnabled,
    setResumePolicy,
    publishPause,
    publishResume,
    publishSeek,
    publishClock,
    markApplyingRemote,
    isApplyingRemote,
    refreshBundle,
    refreshSharedSession,
  }
}
