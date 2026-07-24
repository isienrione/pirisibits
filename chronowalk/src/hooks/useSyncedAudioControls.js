import { useCallback, useEffect, useRef, useState } from 'react'
import { useOptionalFamilyWalk } from '../redesign/context/FamilyWalkContext.jsx'

/**
 * Wraps an audio engine surface so play/pause/seek honor Family Walk sync.
 *
 * - Sync OFF → fully autonomous (no publish, ignore remote transport)
 * - Sync ON → anyone can pause-for-all; resume-for-all respects resumePolicy
 * - Remote resume may be blocked by mobile autoplay — surfaces pendingGroupResume
 *
 * Product truth: shared tour progress/session sync, not millisecond audio sync.
 *
 * @param {object} audio — return value of useAudioEngine
 * @param {{ currentWaypointId?: string|null, onRemoteWaypoint?: (id: string) => void }} [opts]
 */
export function useSyncedAudioControls(audio, opts = {}) {
  const { currentWaypointId = null, onRemoteWaypoint = null } = opts
  const family = useOptionalFamilyWalk()
  const lastAppliedRef = useRef(null)
  const lastWaypointRef = useRef(null)
  const localApplyingRef = useRef(false)
  const [pendingGroupResume, setPendingGroupResume] = useState(false)

  const syncOn = Boolean(family?.session && family.syncEnabled && !family.isWalkingIndependently)
  const isLeader = Boolean(family?.isLeader)
  const markApplyingRemote = family?.markApplyingRemote
  const isApplyingRemote = family?.isApplyingRemote

  const setApplying = useCallback(
    (active) => {
      localApplyingRef.current = Boolean(active)
      markApplyingRemote?.(active)
    },
    [markApplyingRemote],
  )

  // Apply remote session transport when sync is on
  useEffect(() => {
    if (!family?.session || !syncOn || !audio) return undefined

    const session = family.session
    const key = `${session.updatedAt}|${session.paused}|${session.playing}|${session.positionSeconds}|${session.chapterIndex}|${session.waypointId ?? ''}`
    if (key === lastAppliedRef.current) return undefined

    // Ignore echoes of our own pause (seat-id aware)
    if (
      session.pauseSourceSeatId &&
      session.mySeatId &&
      session.pauseSourceSeatId === session.mySeatId &&
      session.paused
    ) {
      lastAppliedRef.current = key
      return undefined
    }

    lastAppliedRef.current = key
    let cancelled = false
    setApplying(true)

    const apply = async () => {
      try {
        const localProgress = audio.progress?.currentTime ?? 0
        const target = Number(session.positionSeconds) || 0
        const drift = Math.abs(localProgress - target)

        if (typeof session.playbackRate === 'number' && session.playbackRate > 0) {
          if (Math.abs((audio.playbackRate ?? 1) - session.playbackRate) > 0.05) {
            audio.setPlaybackRate?.(session.playbackRate)
          }
        }

        if (
          typeof session.chapterIndex === 'number' &&
          session.chapterIndex !== (audio.progress?.chapterIndex ?? 0)
        ) {
          audio.jumpToChapter?.(session.chapterIndex)
        }

        if (drift > 1.25) {
          audio.seekNarration?.(target)
        }

        if (
          !isLeader &&
          session.waypointId &&
          session.waypointId !== lastWaypointRef.current &&
          typeof onRemoteWaypoint === 'function'
        ) {
          lastWaypointRef.current = session.waypointId
          onRemoteWaypoint(session.waypointId)
        }

        if (session.paused || !session.playing) {
          if (audio.narrationPlaying) audio.pauseNarration?.()
          if (!cancelled) setPendingGroupResume(false)
        } else if (session.playing) {
          if (!audio.narrationPlaying) {
            const ok = await Promise.resolve(audio.resumeNarration?.())
            if (!cancelled) {
              setPendingGroupResume(ok === false)
            }
          } else if (!cancelled) {
            setPendingGroupResume(false)
          }
        }
      } finally {
        window.setTimeout(() => {
          if (!cancelled) setApplying(false)
        }, 80)
      }
    }

    void apply()
    return () => {
      cancelled = true
    }
  }, [
    audio,
    family?.session,
    syncOn,
    isLeader,
    onRemoteWaypoint,
    setApplying,
    family?.session?.updatedAt,
    family?.session?.paused,
    family?.session?.playing,
    family?.session?.positionSeconds,
    family?.session?.chapterIndex,
    family?.session?.playbackRate,
    family?.session?.pauseSourceSeatId,
    family?.session?.mySeatId,
    family?.session?.waypointId,
  ])

  // Leader clock heartbeat while playing — includes current waypoint/stop.
  useEffect(() => {
    if (!family?.session || !syncOn || !family.isLeader || !audio?.narrationPlaying) return undefined
    const id = window.setInterval(() => {
      if (localApplyingRef.current || isApplyingRemote?.()) return
      void family.publishClock({
        waypointId: currentWaypointId ?? null,
        chapterIndex: audio.progress?.chapterIndex ?? 0,
        positionSeconds: audio.progress?.currentTime ?? 0,
        playbackRate: audio.playbackRate ?? 1,
        playing: true,
        paused: false,
      })
    }, 3000)
    return () => window.clearInterval(id)
  }, [
    audio,
    currentWaypointId,
    family,
    family?.isLeader,
    family?.session,
    audio?.narrationPlaying,
    syncOn,
    isApplyingRemote,
  ])

  // When leader changes stop while syncing, publish immediately.
  // Also runs when a brand-new session still has null waypointId so followers
  // inherit the group stop before Continue can race a fail-open guard.
  useEffect(() => {
    if (!family?.session || !syncOn || !family.isLeader || !currentWaypointId) return
    if (family.session.waypointId === currentWaypointId) return
    if (localApplyingRef.current || isApplyingRemote?.()) return
    void family.publishClock({
      waypointId: currentWaypointId,
      chapterIndex: audio?.progress?.chapterIndex ?? 0,
      positionSeconds: audio?.progress?.currentTime ?? 0,
      playbackRate: audio?.playbackRate ?? 1,
      playing: Boolean(audio?.narrationPlaying),
      paused: !audio?.narrationPlaying,
    })
  }, [
    audio?.narrationPlaying,
    audio?.playbackRate,
    audio?.progress?.chapterIndex,
    audio?.progress?.currentTime,
    currentWaypointId,
    family,
    family?.isLeader,
    family?.session,
    family?.session?.id,
    family?.session?.waypointId,
    syncOn,
    isApplyingRemote,
  ])

  const pauseForEveryone = useCallback(async () => {
    const position = audio?.progress?.currentTime ?? 0
    audio?.pauseNarration?.()
    setPendingGroupResume(false)
    if (syncOn && family) {
      try {
        await family.publishPause(position)
      } catch {
        /* local pause still applied */
      }
    }
  }, [audio, family, syncOn])

  const resumeForEveryone = useCallback(async () => {
    if (syncOn && family && !family.canResumeForAll) {
      const err = new Error('resume_leader_only')
      err.code = 'resume_leader_only'
      throw err
    }
    const position = audio?.progress?.currentTime ?? 0
    const ok = await Promise.resolve(audio?.resumeNarration?.())
    setPendingGroupResume(ok === false)
    if (syncOn && family) {
      await family.publishResume(position)
    }
  }, [audio, family, syncOn])

  /** Member gesture when remote resume was blocked by autoplay policy. */
  const resumeWithGroup = useCallback(async () => {
    const ok = await Promise.resolve(audio?.resumeNarration?.())
    if (ok !== false) setPendingGroupResume(false)
    return ok !== false
  }, [audio])

  const toggleSyncedPlayback = async () => {
    if (localApplyingRef.current || isApplyingRemote?.()) return
    if (audio?.narrationPlaying) {
      await pauseForEveryone()
      return
    }
    await resumeForEveryone()
  }

  const seekSynced = useCallback(
    async (seconds) => {
      audio?.seekNarration?.(seconds)
      if (syncOn && family) {
        await family.publishSeek(seconds, audio?.progress?.chapterIndex)
      }
    },
    [audio, family, syncOn],
  )

  return {
    syncEnabled: syncOn,
    isLeader,
    resumePolicy: family?.resumePolicy ?? 'leader',
    canResumeForAll: family ? family.canResumeForAll : true,
    joinCode: family?.session?.joinCode ?? null,
    pendingGroupResume,
    pauseForEveryone,
    resumeForEveryone,
    resumeWithGroup,
    toggleSyncedPlayback,
    seekSynced,
    family,
  }
}
