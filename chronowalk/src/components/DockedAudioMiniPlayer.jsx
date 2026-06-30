import { AUDIO_MODES } from '../audio/AudioOrchestrator'
import { useAudioPlaybackState } from '../hooks/useAudioPlaybackState'
import { MediaPlayerControls, cn, focusRing } from './ui'

function DockedAudioMiniPlayer({
  title,
  subtitle,
  posterUrl,
  onTogglePlayback,
  onStop,
  onExpand,
  trailing,
  className,
}) {
  const { isTourNarrationPlaying, currentMode } = useAudioPlaybackState()

  const modeLabel =
    currentMode === AUDIO_MODES.TRANSIT
      ? 'Walking narration'
      : currentMode === AUDIO_MODES.ARRIVAL
        ? 'Audio story'
        : 'Tour audio'

  const body = (
    <>
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gold/35 bg-obsidian">
        {posterUrl ? (
          <img src={posterUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gold">♪</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold">{modeLabel}</p>
        <p className="truncate text-sm font-semibold leading-tight">{title ?? 'Landmark story'}</p>
        {subtitle ? <p className="truncate text-xs text-parchment/75">{subtitle}</p> : null}
      </div>
    </>
  )

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-gold/20 bg-obsidian/96 text-ivory shadow-plaque-lg backdrop-blur-glass',
        className
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {onExpand ? (
          <button
            type="button"
            onClick={onExpand}
            aria-label={`Open full audio player for ${title ?? 'landmark story'}`}
            className={cn('flex min-w-0 flex-1 items-center gap-3 text-left', focusRing, 'rounded-xl')}
          >
            {body}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
        )}

        <MediaPlayerControls
          isPlaying={isTourNarrationPlaying}
          onToggle={onTogglePlayback}
          onStop={onStop}
          theme="dark"
        />
        {trailing}
      </div>
    </div>
  )
}

export default DockedAudioMiniPlayer
