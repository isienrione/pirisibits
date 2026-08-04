import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getWaypoint } from '../../content/manifest.js'
import { resolvePreviewUrl } from '../../audio/audioUrl.js'
import { useTourManifest } from '../../hooks/useV2Journey.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import {
  notePreviewAudioTime,
  trackPreviewPlayClick,
} from '../../lib/analytics.ts'
import { LANDING_PREVIEW_AUDIO_FILE } from '../landingData.js'
import {
  consumePreviewPlaybackIntent,
  getPreviewSessionAudio,
  primePreviewAudioForNavigation,
  retainPreviewPlaybackIntent,
  stopPreviewSessionAudio,
} from '../previewAudioHandoff.js'
import { reportAudioLoadFailure } from '../../lib/errorVisibility.js'

/**
 * Shared Pantheon free-preview audio + phase controller (exterior chapter w17_ch1).
 * Used by the embedded /free-pantheon demo; does not navigate.
 */
export function usePantheonPreviewController({ analyticsSource = 'free_pantheon' } = {}) {
  const { manifest, loading } = useTourManifest()
  const audioRef = useRef(null)
  const thresholdTrackedRef = useRef(false)
  const [phase, setPhase] = useState('story')
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [storyEnded, setStoryEnded] = useState(false)
  const [started, setStarted] = useState(false)

  const waypoint = useMemo(
    () => (manifest ? getWaypoint(manifest, 'w17') : null),
    [manifest],
  )

  const previewUrl = useMemo(
    () => resolvePreviewUrl(manifest?.system?.preview ?? LANDING_PREVIEW_AUDIO_FILE),
    [manifest],
  )

  const audioAvailable = !audioError && Boolean(previewUrl)

  const attachAudioListeners = useCallback((audio) => {
    if (!audio) return () => {}

    const onTime = () => {
      setCurrentTime(audio.currentTime)
      notePreviewAudioTime(audio.currentTime, audio.duration || duration, 'pantheon')
    }
    const onMeta = () => setDuration(audio.duration || 0)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => {
      setPlaying(false)
      setStoryEnded(true)
      notePreviewAudioTime(audio.duration || duration, audio.duration || duration, 'pantheon')
    }
    const onError = () => {
      setAudioError(true)
      reportAudioLoadFailure(audio.currentSrc || audio.src || null)
    }

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onMeta)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      setDuration(audio.duration || 0)
    }
    setCurrentTime(audio.currentTime)
    setPlaying(!audio.paused)
    if (audio.ended) setStoryEnded(true)

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onMeta)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [duration])

  useEffect(() => {
    if (!previewUrl || !started) return undefined

    const audio = getPreviewSessionAudio(previewUrl)
    if (!audio) return undefined

    audioRef.current = audio
    const detach = attachAudioListeners(audio)
    const fromGesture = consumePreviewPlaybackIntent()

    if ((fromGesture || audio.paused) && audio.play) {
      void Promise.resolve(audio.play()).catch(() => {})
    }

    return () => {
      detach()
      retainPreviewPlaybackIntent()
    }
  }, [attachAudioListeners, previewUrl, started])

  useEffect(
    () => () => {
      // Leaving the acquisition page: stop session audio.
      stopPreviewSessionAudio()
    },
    [],
  )

  const startExperience = useCallback(() => {
    if (!previewUrl) return false
    setStarted(true)
    setPhase('story')
    track(TRACK_EVENTS.PREVIEW_START, { source: analyticsSource })
    primePreviewAudioForNavigation(previewUrl)
    const audio = getPreviewSessionAudio(previewUrl)
    audioRef.current = audio
    if (audio?.play) void Promise.resolve(audio.play()).catch(() => {})
    return true
  }, [analyticsSource, previewUrl])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) {
      startExperience()
      return
    }
    if (playing) {
      audio.pause()
      return
    }
    trackPreviewPlayClick('pantheon')
    setStarted(true)
    if (audio.play) void Promise.resolve(audio.play()).catch(() => {})
  }, [playing, startExperience])

  const skipBack = useCallback(() => {
    const audio = audioRef.current
    if (audio) audio.currentTime = Math.max(0, audio.currentTime - 15)
  }, [])

  const skipForward = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15)
    }
  }, [])

  const seek = useCallback((seconds) => {
    const audio = audioRef.current
    if (audio) audio.currentTime = seconds
  }, [])

  const handleThresholdCross = useCallback(() => {
    if (thresholdTrackedRef.current) return
    thresholdTrackedRef.current = true
    track(TRACK_EVENTS.THRESHOLD_DEMO, { source: analyticsSource })
  }, [analyticsSource])

  const handleStoryComplete = useCallback(() => {
    setPhase('tour')
  }, [])

  const exitToPage = useCallback(() => {
    const audio = audioRef.current
    if (audio && !audio.paused) audio.pause()
    setPhase('story')
  }, [])

  return {
    loading,
    manifest,
    waypoint,
    phase,
    started,
    playing,
    audioAvailable,
    currentTime,
    duration,
    storyEnded,
    startExperience,
    togglePlay,
    skipBack,
    skipForward,
    seek,
    handleThresholdCross,
    handleStoryComplete,
    exitToPage,
    setPhase,
  }
}
