import { useCallback, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getLaunchOfflineTour } from '../content/launchOfflineDownload'
import { useJourney } from '../hooks/useJourney'
import { useOfflineDownload } from '../hooks/useOfflineDownload'
import { useStoryAudio } from '../hooks/useStoryAudio'
import { JOURNEY_STATES } from '../state/journeyState'
import StoryAudioPlayer from '../components/journey/StoryAudioPlayer'
import {
  cycleAudioSpeed,
  readAudioSpeed,
  PREFERENCES_CHANGED_EVENT,
} from '../utils/appPreferences'
import { ROUTES, arrivalPath, landmarkPath, storyChaptersPath, storyReflectionPath, storyTranscriptPath, thresholdPath } from '../routes/paths'

export default function StoryAudioPage() {
  const navigate = useNavigate()
  const { state, context, manifest, currentStop, updateContext } = useJourney()
  const [playbackSpeed, setPlaybackSpeed] = useState(() => readAudioSpeed())

  const offlineTour = getLaunchOfflineTour('rome')
  const { isDownloaded } = useOfflineDownload(offlineTour)

  const handleProgress = useCallback(
    (progress) => {
      updateContext({ audioProgress: progress })
    },
    [updateContext]
  )

  const handleStoryEnded = useCallback(() => {
    navigate(storyReflectionPath(), { replace: true })
  }, [navigate])

  const {
    isPlaying,
    duration,
    currentTime,
    progress,
    toggle,
    seekBy,
    seekToProgress,
  } = useStoryAudio({
    src: currentStop?.audio,
    initialProgress: context.audioProgress ?? 0,
    onProgressChange: handleProgress,
    onEnded: handleStoryEnded,
  })

  const handleCycleSpeed = useCallback(() => {
    const next = cycleAudioSpeed(playbackSpeed)
    setPlaybackSpeed(next)
    window.dispatchEvent(new CustomEvent(PREFERENCES_CHANGED_EVENT))
  }, [playbackSpeed])

  const handleBack = useCallback(() => {
    navigate(landmarkPath(), { replace: true })
  }, [navigate])

  const handleOpenChapters = useCallback(() => {
    navigate(storyChaptersPath(), { replace: true })
  }, [navigate])

  const handleOpenTranscript = useCallback(() => {
    navigate(storyTranscriptPath(), { replace: true })
  }, [navigate])

  if (state !== JOURNEY_STATES.STORY) {
    if (state === JOURNEY_STATES.ARRIVED) {
      return <Navigate to={arrivalPath()} replace />
    }
    if (state === JOURNEY_STATES.THRESHOLD) {
      return <Navigate to={thresholdPath()} replace />
    }
    if ([JOURNEY_STATES.WALKING, JOURNEY_STATES.APPROACHING].includes(state)) {
      return <Navigate to={ROUTES.journey} replace />
    }
    return <Navigate to={landmarkPath()} replace />
  }

  if (!currentStop || !manifest) {
    return <Navigate to={landmarkPath()} replace />
  }

  return (
    <StoryAudioPlayer
      stop={currentStop}
      chapterIndex={currentStop.number}
      chapterCount={manifest.stops.length}
      isOffline={isDownloaded}
      isPlaying={isPlaying}
      duration={duration}
      currentTime={currentTime}
      progress={progress}
      playbackSpeed={playbackSpeed}
      onTogglePlayback={toggle}
      onSeekBy={seekBy}
      onSeekToProgress={seekToProgress}
      onCycleSpeed={handleCycleSpeed}
      onBack={handleBack}
      onOpenChapters={handleOpenChapters}
      onOpenTranscript={handleOpenTranscript}
    />
  )
}
