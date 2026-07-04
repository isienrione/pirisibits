import { useCallback } from 'react'
import { JOURNEY_STATES } from '../../state/journeyState'
import { useJourney } from '../../hooks/useJourney'
import { useStoryAudio } from '../../hooks/useStoryAudio'
import { Button, GoldButton, IconButton, cn } from '../ui'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function SkipIcon({ direction = 'back' }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {direction === 'back' ? (
        <>
          <path d="M10 8 6 12l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 12H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="m14 8 4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M6 12h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

/**
 * Full-screen story player with audio controls and threshold handoff.
 */
export default function StoryPlayer({ onStepThroughTime }) {
  const { state, currentStop, context, setState, states, updateContext } = useJourney()

  const handleProgress = useCallback(
    (progress) => {
      updateContext({ audioProgress: progress })
    },
    [updateContext]
  )

  const { isPlaying, duration, currentTime, progress, toggle, seekBy, seekToProgress } =
    useStoryAudio({
      src: currentStop?.audio,
      initialProgress: context.audioProgress ?? 0,
      onProgressChange: handleProgress,
    })

  const visible = state === JOURNEY_STATES.STORY && Boolean(currentStop)

  const handleStepThroughTime = useCallback(() => {
    setState(states.THRESHOLD)
    onStepThroughTime?.()
  }, [onStepThroughTime, setState, states.THRESHOLD])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[72] flex flex-col bg-obsidian text-ivory"
      data-testid="story-player"
    >
      <div className="relative min-h-0 flex-1">
        {currentStop.heroImage ? (
          <img
            src={currentStop.heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
        ) : null}
        <div
          className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-obsidian/20"
          aria-hidden="true"
        />
        <div className="relative flex h-full flex-col justify-end px-6 pb-8 pt-safe">
          <p className="text-eyebrow uppercase text-gold">Audio story</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight">
            {currentStop.title}
          </h1>
          {currentStop.subtitle ? (
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-parchment/85">
              {currentStop.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-gold/15 bg-gradient-to-b from-obsidian via-obsidian to-obsidian px-6 py-5 pb-launch-bottom">
        <div className="flex items-center justify-center gap-4">
          <IconButton
            label="Rewind 15 seconds"
            variant="ghost"
            className="text-ivory"
            onClick={() => seekBy(-15)}
          >
            <SkipIcon direction="back" />
          </IconButton>
          <button
            type="button"
            aria-label={isPlaying ? 'Pause story' : 'Play story'}
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full border border-gold/40',
              'bg-gradient-to-b from-gold via-gold to-gold-dark text-obsidian shadow-gold-glow'
            )}
            onClick={toggle}
          >
            {isPlaying ? (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg className="ml-1 h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.14v13.72L19 12 8 5.14Z" />
              </svg>
            )}
          </button>
          <IconButton
            label="Forward 15 seconds"
            variant="ghost"
            className="text-ivory"
            onClick={() => seekBy(15)}
          >
            <SkipIcon direction="forward" />
          </IconButton>
        </div>

        <div className="mt-4">
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            aria-label="Story progress"
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gold/20 accent-gold"
            onChange={(event) => seekToProgress(Number(event.target.value) / 1000)}
          />
          <div className="mt-1 flex justify-between text-sm tabular-nums text-parchment/80">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {currentStop.transcript ? (
          <a
            href={currentStop.transcript}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-sm text-gold underline-offset-2 hover:underline"
          >
            Read transcript
          </a>
        ) : null}

        <div className="mt-5 flex flex-col gap-3">
          <GoldButton fullWidth onClick={handleStepThroughTime}>
            Step through time
          </GoldButton>
          <Button
            variant="outline-dark"
            size="lg"
            fullWidth
            onClick={handleStepThroughTime}
          >
            Continue walking
          </Button>
        </div>
      </div>
    </div>
  )
}
