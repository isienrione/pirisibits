import { useCallback, useEffect, useState } from 'react'
import {
  audioOrchestrator,
  AUDIO_PLAYBACK_STATE_EVENT,
  AUDIO_PROGRESS_EVENT,
} from '../audio/AudioOrchestrator'

export function useAudioProgress() {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)

  const applyProgress = useCallback((detail = {}) => {
    if (Number.isFinite(detail.currentTime)) {
      setCurrentTime(detail.currentTime)
    }
    if (Number.isFinite(detail.duration)) {
      setDuration(detail.duration)
    }
    if (Number.isFinite(detail.playbackRate)) {
      setPlaybackRate(detail.playbackRate)
    }
  }, [])

  const syncFromOrchestrator = useCallback(() => {
    applyProgress({
      currentTime: audioOrchestrator.getCurrentTime(),
      duration: audioOrchestrator.getDuration(),
      playbackRate: audioOrchestrator.getPlaybackRate(),
    })
  }, [applyProgress])

  useEffect(() => {
    const onProgress = (event) => applyProgress(event.detail)
    const onPlaybackState = () => syncFromOrchestrator()

    window.addEventListener(AUDIO_PROGRESS_EVENT, onProgress)
    window.addEventListener(AUDIO_PLAYBACK_STATE_EVENT, onPlaybackState)
    syncFromOrchestrator()

    return () => {
      window.removeEventListener(AUDIO_PROGRESS_EVENT, onProgress)
      window.removeEventListener(AUDIO_PLAYBACK_STATE_EVENT, onPlaybackState)
    }
  }, [applyProgress, syncFromOrchestrator])

  return {
    currentTime,
    duration,
    playbackRate,
    seekTo: (seconds) => audioOrchestrator.seekTo(seconds),
    skipBy: (delta) => audioOrchestrator.skipBy(delta),
    setPlaybackRate: (rate) => audioOrchestrator.setPlaybackRate(rate),
  }
}

export default useAudioProgress
