import { AUDIO_MODES } from '../audio/AudioOrchestrator'
import { useAudioPlaybackState } from '../hooks/useAudioPlaybackState'
import { AudioLoadingIndicator, Button, FadeImage, GlassPanel, MediaPlayerControls, AudioIcon, cn, typeCaption, typeEyebrowGold, typeSectionTitleSm } from './ui'

function PersistentAudioBar({
  title,
  subtitle,
  posterUrl,
  placeholderUrl,
  cardOpen,
  onReopenCard,
  onTogglePlayback,
  onStop,
}) {
  const { isTourNarrationActive, isTourNarrationPlaying, isAudioBuffering, currentMode } =
    useAudioPlaybackState()

  if (!isTourNarrationActive) return null

  const modeLabel =
    currentMode === AUDIO_MODES.TRANSIT
      ? 'Walking narration'
      : currentMode === AUDIO_MODES.ARRIVAL
        ? 'Audio story'
        : 'Tour audio'

  return (
    <div className="pointer-events-auto w-full">
      <GlassPanel className="overflow-hidden rounded-2xl border-deep-slate/10 bg-deep-slate/96 text-warm-white shadow-glass-lg backdrop-blur-glass">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gold/35 bg-deep-slate">
            {posterUrl ? (
              <FadeImage
                src={posterUrl}
                placeholderSrc={placeholderUrl}
                className="h-full w-full"
                imgClassName="h-full w-full object-cover"
                skeletonClassName="rounded-full"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gold">
                <AudioIcon size="sm" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className={typeEyebrowGold}>
              {modeLabel}
            </p>
            <p className={cn('truncate', typeSectionTitleSm, 'text-warm-white')}>{title ?? 'Landmark story'}</p>
            {isAudioBuffering ? <AudioLoadingIndicator className="mt-1" label="Buffering…" /> : null}
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
      </GlassPanel>
    </div>
  )
}

export default PersistentAudioBar
