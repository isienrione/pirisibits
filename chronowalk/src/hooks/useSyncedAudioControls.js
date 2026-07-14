import { useCallback, useEffect, useRef } from 'react'
import { getDeviceId } from '../lib/deviceId.js'
import { useOptionalFamilyWalk } from '../redesign/context/FamilyWalkContext.jsx'

/**
 * Wraps an audio engine surface so play/pause/seek honor Family Walk sync.
 *
 * - Sync OFF → fully autonomous (no publish, ignore remote transport)
 * - Sync ON → anyone can pause-for-all; resume-for-all respects resumePolicy
 *
 * @param {object} audio — return value of useAudioEngine
 */
export function useSyncedAudioControls(audio) {
  const family = useOptionalFamilyWalk()
  const deviceId = getDeviceId()
  const lastAppliedRef = useRef(null)

  const syncOn = Boolean(family?.session && family.syncEnabled)
  const applyingRemoteRef = family?.applyingRemoteRef

  // Apply remote session transport when sync is on
  useEffect(() => {
    if (!family?.session || !syncOn || !audio) return

    const session = family.session
    const key = `${session.updatedAt}|${session.paused}|${session.playing}|${session.positionSeconds}|${session.chapterIndex}`
    if (key === lastAppliedRef.current) return

    // Ignore echoes of our own pause for a beat
    if (session.pauseSourceDeviceId === deviceId && session.paused) {
      lastAppliedRef.current = key
      return
    }

    lastAppliedRef.current = key
    if (applyingRemoteRef) applyingRemoteRef.current = true

    try {
      const localProgress = audio.progress?.currentTime ?? 0
      const target = Number(session.positionSeconds) || 0
      const drift = Math.abs(localProgress - target)

      if (typeof session.playbackRate === 'number' && session.playbackRate > 0) {
        if (Math.abs((audio.playbackRate ?? 1) - session.playbackRate) > 0.05) {
          audio.setPlaybackRate?.(session.playbackRate)
        }
      }

      if (typeof session.chapterIndex === 'number' && session.chapterIndex !== (audio.progress?.chapterIndex ?? 0)) {
        audio.jumpToChapter?.(session.chapterIndex)
      }

      if (drift > 1.25) {
        audio.seekNarration?.(target)
      }

      if (session.paused || !session.playing) {
        if (audio.narrationPlaying) audio.pauseNarration?.()
      } else if (session.playing) {
        if (!audio.narrationPlaying) audio.resumeNarration?.()
      }
    } finally {
      // Allow local UI events again shortly after remote apply
      window.setTimeout(() => {
        if (applyingRemoteRef) applyingRemoteRef.current = false
      }, 80)
    }
  }, [
    audio,
    applyingRemoteRef,
    deviceId,
    family?.session,
    syncOn,
    family?.session?.updatedAt,
    family?.session?.paused,
    family?.session?.playing,
    family?.session?.positionSeconds,
    family?.session?.chapterIndex,
    family?.session?.playbackRate,
    family?.session?.pauseSourceDeviceId,
  ])

  // Leader clock heartbeat while playing
  useEffect(() => {
    if (!family?.session || !syncOn || !family.isLeader || !audio?.narrationPlaying) return undefined
    const id = window.setInterval(() => {
      if (applyingRemoteRef?.current) return
      void family.publishClock({
        waypointId: null,
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
    applyingRemoteRef,
    family,
    family?.isLeader,
    family?.session,
    audio?.narrationPlaying,
    syncOn,
  ])

  const pauseForEveryone = useCallback(async () => {
    const position = audio?.progress?.currentTime ?? 0
    audio?.pauseNarration?.()
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
    audio?.resumeNarration?.()
    if (syncOn && family) {
      await family.publishResume(position)
    }
  }, [audio, family, syncOn])

  const toggleSyncedPlayback = useCallback(async () => {
    if (applyingRemoteRef?.current) return
    if (audio?.narrationPlaying) {
      await pauseForEveryone()
      return
    }
    await resumeForEveryone()
  }, [audio?.narrationPlaying, applyingRemoteRef, pauseForEveryone, resumeForEveryone])

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
    isLeader: Boolean(family?.isLeader),
    resumePolicy: family?.resumePolicy ?? 'leader',
    canResumeForAll: family ? family.canResumeForAll : true,
    joinCode: family?.session?.joinCode ?? null,
    pauseForEveryone,
    resumeForEveryone,
    toggleSyncedPlayback,
    seekSynced,
    family,
  }
}
