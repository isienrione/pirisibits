import { useCallback, useEffect, useRef, useState } from 'react'

function clampProgress(value) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

/**
 * Lightweight story audio controller with persisted progress callbacks.
 */
export function useStoryAudio({ src, initialProgress = 0, onProgressChange }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio

    const onLoaded = () => {
      setDuration(audio.duration || 0)
      setReady(true)
      if (initialProgress > 0 && audio.duration) {
        audio.currentTime = clampProgress(initialProgress) * audio.duration
        setCurrentTime(audio.currentTime)
      }
    }

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      if (audio.duration > 0) {
        onProgressChange?.(clampProgress(audio.currentTime / audio.duration))
      }
    }

    const onEnded = () => setIsPlaying(false)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audioRef.current = null
    }
  }, [initialProgress, onProgressChange])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !src) return
    setReady(false)
    audio.src = src
    audio.load()
  }, [src])

  const toggle = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      try {
        await audio.play()
      } catch {
        setIsPlaying(false)
      }
    } else {
      audio.pause()
    }
  }, [])

  const seekBy = useCallback(
    (deltaSeconds) => {
      const audio = audioRef.current
      if (!audio || !Number.isFinite(audio.duration)) return

      const next = Math.min(audio.duration, Math.max(0, audio.currentTime + deltaSeconds))
      audio.currentTime = next
      setCurrentTime(next)
      onProgressChange?.(clampProgress(next / audio.duration))
    },
    [onProgressChange]
  )

  const seekToProgress = useCallback(
    (progress) => {
      const audio = audioRef.current
      if (!audio || !Number.isFinite(audio.duration)) return

      const next = clampProgress(progress) * audio.duration
      audio.currentTime = next
      setCurrentTime(next)
      onProgressChange?.(clampProgress(progress))
    },
    [onProgressChange]
  )

  const progress = duration > 0 ? clampProgress(currentTime / duration) : 0

  return {
    audioRef,
    ready,
    isPlaying,
    duration,
    currentTime,
    progress,
    toggle,
    seekBy,
    seekToProgress,
  }
}

export default useStoryAudio
