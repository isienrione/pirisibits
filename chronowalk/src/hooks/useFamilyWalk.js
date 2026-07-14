import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getDeviceId } from '../lib/deviceId.js'
import {
  canResumeForAll,
  createFamilyBundle,
  createWalkSession,
  claimFamilySeat,
  isLeader,
  joinWalkSession,
  refreshFamilyBundle,
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
 * Toggles:
 * - syncEnabled: when off, each phone is fully autonomous mid-tour
 * - resumePolicy: 'leader' (only leader resumes for all) | 'anyone'
 * Anyone may always request a shared pause while sync is on.
 */
export function useFamilyWalk() {
  const deviceId = useMemo(() => getDeviceId(), [])
  const [bundle, setBundle] = useState(null)
  const [session, setSession] = useState(() => readCachedSession())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
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

  const setupBundle = useCallback(
    (tier, ownerName) =>
      run(async () => {
        const next = await createFamilyBundle({ tier, ownerName })
        setBundle(next)
        return next
      }),
    [run],
  )

  const redeemInvite = useCallback(
    (inviteCode, displayName) =>
      run(async () => {
        const next = await claimFamilySeat({ inviteCode, displayName })
        setBundle(next)
        return next
      }),
    [run],
  )

  const startSharedWalk = useCallback(
    (resumePolicy = 'leader') =>
      run(async () => {
        if (!bundle?.id) throw new Error('no_bundle')
        const next = await createWalkSession({ bundleId: bundle.id, resumePolicy })
        lastUpdatedRef.current = next.updatedAt
        setSession(next)
        return next
      }),
    [bundle?.id, run],
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
    [session?.id],
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

  const leader = isLeader(session, deviceId)
  const syncOn = Boolean(session?.syncEnabled)
  const resumeAllowed = canResumeForAll(session, deviceId)

  const clearError = useCallback(() => setError(null), [])
  const refreshBundle = useCallback(
    () =>
      refreshFamilyBundle().then((next) => {
        setBundle(next)
        return next
      }),
    [],
  )

  return useMemo(
    () => ({
      deviceId,
      bundle,
      session,
      busy,
      error,
      clearError,
      isLeader: leader,
      syncEnabled: syncOn,
      resumePolicy: session?.resumePolicy ?? 'leader',
      canResumeForAll: resumeAllowed,
      setupBundle,
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
    }),
    [
      applyingRemoteRef,
      bundle,
      busy,
      clearError,
      deviceId,
      error,
      joinSharedWalk,
      leader,
      leaveSharedWalk,
      publishClock,
      publishPause,
      publishResume,
      publishSeek,
      redeemInvite,
      refreshBundle,
      resumeAllowed,
      session,
      setResumePolicy,
      setSyncEnabled,
      setupBundle,
      startSharedWalk,
      syncOn,
    ],
  )
}
