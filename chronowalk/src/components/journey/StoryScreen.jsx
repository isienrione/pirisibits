import { JourneyLayout, JourneyPrimaryButton, JourneySecondaryButton } from './JourneyLayout.jsx'

export default function StoryScreen({
  waypointName,
  narrationPlaying,
  hasReconstruction,
  onOpenThreshold,
  onStoryComplete,
  busy = false,
}) {
  return (
    <JourneyLayout
      eyebrow="Story"
      title={waypointName}
      subtitle={narrationPlaying ? 'Listen…' : 'Story complete'}
    >
      {hasReconstruction ? (
        <JourneyPrimaryButton onClick={onOpenThreshold} disabled={busy || narrationPlaying}>
          Step through the threshold
        </JourneyPrimaryButton>
      ) : (
        <JourneyPrimaryButton onClick={onStoryComplete} disabled={busy || narrationPlaying}>
          Continue walking
        </JourneyPrimaryButton>
      )}

      {hasReconstruction && !narrationPlaying ? (
        <JourneySecondaryButton onClick={onStoryComplete} disabled={busy}>
          Skip threshold for now
        </JourneySecondaryButton>
      ) : null}
    </JourneyLayout>
  )
}
