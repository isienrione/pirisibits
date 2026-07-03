import { AUDIO_MODES } from '../audio/AudioOrchestrator'
import { useAudioPlaybackState } from '../hooks/useAudioPlaybackState'
import { Button, MediaPlayerControls, cn } from './ui'

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
    <div className="pointer-events-auto w-full">
      <div className="overflow-hidden rounded-2xl border border-ink800 bg-obsidian text-warmwhite shadow-card">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--ember)_35%,var(--obsidian))] bg-obsidian">
            {posterUrl ? (
              <img src={posterUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-ember">♪</div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ember">
              {modeLabel}
            </p>
            <p className="truncate text-sm font-semibold leading-tight">{title ?? 'Landmark story'}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <MediaPlayerControls
              isPlaying={isTourNarrationPlaying}
              onToggle={onTogglePlayback}
              onStop={onStop}
              theme="dark"
            />
            {!cardOpen && onReopenCard ? (
              <Button
                variant="quiet"
                size="sm"
                className="border-ink800 bg-[color-mix(in_srgb,var(--warm-white)_10%,var(--obsidian))] px-3 text-warmwhite hover:bg-[color-mix(in_srgb,var(--warm-white)_15%,var(--obsidian))]"
                onClick={onReopenCard}
              >
                Open
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersistentAudioBar
