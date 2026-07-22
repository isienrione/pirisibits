import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getDeviceId } from '../lib/deviceId.js'
import { readAccessEntitlement } from '../lib/accessSession.js'
import { isBundleSku } from '../lib/launchSkus.js'
import {
  canResumeForAll,
  createBundleInvite,
  createWalkSession,
  claimFamilySeat,
  isLeader,
  joinWalkSession,
  refreshFamilyBundle,
  revokeBundleSeat,
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

  useEffect(() => {
    let cancelled = false
    refreshFamilyBundle()
      .then((next) => {
        if (!cancelled) setBundle(next)
      })
      .catch(() => {
        if (!cancelled) setBundle(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    writeCachedSession(session)
  }, [session])

  useEffect(() => {
    if (!session?.id) return undefined
    return subscribeWalkSession(session.id, (next) => {
      if (!next) return
      if (next.updatedAt && next.updatedAt === lastUpdatedRef.current) return
      lastUpdatedRef.current = next.updatedAt
      setSession(next)
    })
  }, [session?.id])

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
        return refreshed ?? next
      }),
    [run],
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
        lastUpdatedRef.current = next.updatedAt
        setSession(next)
        return next
      }),
    [bundle?.bundleId, bundle?.id, run],
  )

  const joinSharedWalk = useCallback(
    (joinCode) =>
      run(async () => {
        const next = await joinWalkSession({ joinCode })
        lastUpdatedRef.current = next.updatedAt
        setSession(next)
        return next
      }),
    [run],
  )

  const leaveSharedWalk = useCallback(() => {
    setSession(null)
    writeCachedSession(null)
  }, [])

  const patchSession = useCallback(
    async (patch) => {
      if (!session?.id) return null
      const next = await updateWalkSessionState(session.id, patch)
      lastUpdatedRef.current = next.updatedAt
      setSession(next)
      return next
    },
    [session],
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
      if (!canResumeForAll(session, deviceId)) {
        const err = new Error('resume_leader_only')
        err.code = 'resume_leader_only'
        throw err
      }
      return patchSession({
        event: 'resume',
        positionSeconds,
      })
    },
    [deviceId, patchSession, session],
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
      refreshFamilyBundle().then((next) => {
        setBundle(next)
        return next
      }),
    [],
  )

  const entitlement = readAccessEntitlement()
  const purchasedProductId = bundle?.purchasedProductId ?? entitlement?.purchasedProductId ?? null
  const hasBundleAccess = Boolean(
    bundle || (entitlement && isBundleSku(entitlement.purchasedProductId)),
  )
  const isOrganizer = Boolean(bundle?.isOwner || bundle?.role === 'owner')
  const isMember = Boolean(
    bundle?.role === 'member' || (!bundle?.isOwner && entitlement?.role === 'member'),
  )

  const leader = isLeader(session, deviceId)
  const syncOn = Boolean(session?.syncEnabled)
  const resumeAllowed = canResumeForAll(session, deviceId)

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
    applyingRemoteRef,
    refreshBundle,
  }
}
