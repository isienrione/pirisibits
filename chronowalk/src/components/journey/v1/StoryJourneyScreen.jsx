import { useCallback } from 'react'
import { AUDIO_MODES, audioOrchestrator } from '../../../audio/AudioOrchestrator.js'
import { useAudioPlaybackState } from '../../../hooks/useAudioPlaybackState.js'
import { hasComparisonSliderMedia } from '../../../utils/sliderMedia.js'
import { getModernCoverUrl } from '../../../utils/sliderMedia.js'
import { HAPTIC_KIND, triggerHaptic } from '../../../utils/haptics.js'
import AudioPlayerPanel from '../../AudioPlayerPanel.jsx'
import { Button } from '../../ui'

export default function StoryJourneyScreen({
  waypoint,
  onEnterThreshold,
  onContinue,
}) {
  const { isArrivalAudioPlaying, needsResumeAudio } = useAudioPlaybackState()
  const posterUrl = waypoint ? getModernCoverUrl(waypoint) : null
  const hasThreshold = waypoint ? hasComparisonSliderMedia(waypoint) : false

  const handlePlayAudio = useCallback(async () => {
    if (!waypoint?.arrival_immersive_url) return

    try {
      await audioOrchestrator.transitionTo(
        AUDIO_MODES.ARRIVAL,
        {
          transit: waypoint.transit_narrative_url,
          arrival: waypoint.arrival_immersive_url,
          ambient: waypoint.ambient_url,
        },
        { force: true }
      )
      triggerHaptic(HAPTIC_KIND.SUCCESS)
    } catch (error) {
      console.error('Failed to play story audio:', error)
    }
  }, [waypoint])

  const handleToggle = useCallback(async () => {
    if (isArrivalAudioPlaying) {
      audioOrchestrator.pauseArrival()
      return
    }
    const resumed = await audioOrchestrator.resumeArrival?.()
    if (!resumed) {
      await handlePlayAudio()
    }
  }, [handlePlayAudio, isArrivalAudioPlaying])

  if (!waypoint) return null

  return (
    <div className="flex min-h-full w-full flex-col px-6 pb-10 pt-12">
      <p className="text-eyebrow uppercase text-ember">Story</p>
      <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-warmwhite">
        {waypoint.title}
      </h1>
      {waypoint.arrival_subtitle ? (
        <p className="mt-4 text-base leading-relaxed text-muted">{waypoint.arrival_subtitle}</p>
      ) : null}

      <div className="mt-8">
        <AudioPlayerPanel
          title={waypoint.title}
          subtitle={waypoint.arrival_subtitle}
          isPlaying={isArrivalAudioPlaying}
          posterUrl={posterUrl}
          onToggle={handleToggle}
          onStop={() => audioOrchestrator.stop()}
        />
        {needsResumeAudio ? (
          <p className="mt-3 text-xs text-muted">Audio interrupted — tap play to continue.</p>
        ) : null}
      </div>

      <div className="mt-auto space-y-3 pt-10">
        {hasThreshold ? (
          <Button fullWidth onClick={onEnterThreshold}>
            Step through the threshold
          </Button>
        ) : null}
        <Button variant="quiet" fullWidth onClick={onContinue}>
          Continue walking
        </Button>
      </div>
    </div>
  )
}
