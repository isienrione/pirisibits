import { AUDIO_MODES } from '../audio/AudioOrchestrator'
import { useAudioPlaybackState } from '../hooks/useAudioPlaybackState'
import { Button, GlassPanel, cn } from './ui'

function PersistentAudioBar({
  title,
  subtitle,
  posterUrl,
  cardOpen,
  onReopenCard,
  onTogglePlayback,
  onStop,
}) {
  const { isTourNarrationActive, isTourNarrationPlaying, currentMode } = useAudioPlaybackState()

  if (!isTourNarrationActive) return null

  const modeLabel =
    currentMode === AUDIO_MODES.TRANSIT
      ? 'Walking narration'
      : currentMode === AUDIO_MODES.ARRIVAL
        ? 'Audio story'
        : 'Tour audio'

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[44] px-4"
      style={{ bottom: 'max(5.75rem, calc(env(safe-area-inset-bottom) + 5.25rem))' }}
    >
      <GlassPanel className="pointer-events-auto overflow-hidden rounded-2xl border-deep-slate/10 bg-deep-slate text-warm-white shadow-glass-lg">
        <div className="flex items-center gap-3 p-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gold/35 bg-deep-slate">
            {posterUrl ? (
              <img src={posterUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gold">♪</div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-gold">
              {modeLabel}
            </p>
            <p className="truncate text-sm font-semibold">{title ?? 'Landmark story'}</p>
            {subtitle ? <p className="truncate text-xs text-sand/75">{subtitle}</p> : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              className="px-4"
              onClick={onTogglePlayback}
              aria-label={isTourNarrationPlaying ? 'Pause audio' : 'Play audio'}
            >
              {isTourNarrationPlaying ? 'Pause' : 'Play'}
            </Button>
            {!cardOpen && onReopenCard ? (
              <Button
                variant="secondary"
                size="sm"
                className="border-warm-white/20 bg-warm-white/10 px-3 text-warm-white hover:bg-warm-white/15"
                onClick={onReopenCard}
              >
                Open
              </Button>
            ) : null}
          </div>
        </div>

        {onStop ? (
          <div className="border-t border-warm-white/10 px-3 py-2">
            <button
              type="button"
              onClick={onStop}
              className={cn(
                'min-h-10 w-full rounded-xl text-xs font-semibold text-sand/80 transition hover:text-warm-white'
              )}
            >
              Stop audio
            </button>
          </div>
        ) : null}
      </GlassPanel>
    </div>
  )
}

export default PersistentAudioBar
