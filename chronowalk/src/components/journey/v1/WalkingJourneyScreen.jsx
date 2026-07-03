import { AUDIO_MODES, audioOrchestrator } from '../../../audio/AudioOrchestrator.js'
import { Button } from '../../ui'

function AmbientIndicator({ active }) {
  if (!active) return null

  return (
    <p className="text-eyebrow uppercase text-muted">
      <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ember" aria-hidden="true" />
      Ambient bed live
    </p>
  )
}

export default function WalkingJourneyScreen({
  targetTitle,
  directionLine,
  distance,
  ambientActive = false,
  onPause,
}) {
  const distanceLabel =
    distance != null ? `${Math.round(distance)} m away` : 'Finding your position…'

  return (
    <div className="flex min-h-full w-full flex-col px-6 pb-10 pt-16">
      <AmbientIndicator active={ambientActive} />

      <h1 className="mt-6 font-display text-4xl font-medium leading-tight text-warmwhite">
        {targetTitle ?? 'On the way'}
      </h1>

      <p className="mt-4 text-2xl tabular-nums text-ember">{distanceLabel}</p>

      {directionLine ? (
        <p className="mt-6 text-base leading-relaxed text-muted">{directionLine}</p>
      ) : null}

      <div className="mt-auto pt-16">
        <Button variant="quiet" fullWidth onClick={onPause}>
          Pause
        </Button>
      </div>
    </div>
  )
}

export function pauseWalkingAudio() {
  if (audioOrchestrator.currentMode === AUDIO_MODES.TRANSIT) {
    if (!audioOrchestrator.transitPlayer.paused) {
      audioOrchestrator.transitPlayer.pause()
      audioOrchestrator.emitPlaybackState?.()
    }
    return
  }

  if (!audioOrchestrator.ambientPlayer.paused) {
    audioOrchestrator.ambientPlayer.pause()
    audioOrchestrator.emitPlaybackState?.()
  }
}
