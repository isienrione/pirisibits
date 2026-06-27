import { AudioScrubber } from './AudioScrubber'
import { AudioWaveform } from './AudioWaveform'
import { LargePlayButton } from './LargePlayButton'
import { formatAudioTime, formatRemainingTime } from '../../utils/audioFormat'
import { triggerHaptic, HAPTIC_KIND } from '../../utils/haptics'
import { Button, cn, focusRing } from '../ui'

function StopIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
    </svg>
  )
}

function ChevronIcon({ expanded, className }) {
  return (
    <svg
      className={cn('transition-transform duration-300', expanded && 'rotate-180', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArtworkBackdrop({ posterUrl, className }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      {posterUrl ? (
        <>
          <img
            src={posterUrl}
            alt=""
            className="h-full w-full scale-110 object-cover opacity-45 blur-2xl"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-slate/30 via-deep-slate/70 to-deep-slate/95" />
        </>
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-deep-slate via-deep-slate/90 to-terracotta/30" />
      )}
    </div>
  )
}

function SpeedControl({ playbackRate, onCycle, className }) {
  const label = Number.isInteger(playbackRate) ? `${playbackRate}x` : `${playbackRate}x`

  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic(HAPTIC_KIND.SELECTION)
        onCycle?.()
      }}
      aria-label={`Playback speed ${label}. Tap to change.`}
      className={cn(
        'inline-flex min-h-10 min-w-[3.25rem] items-center justify-center rounded-full border border-warm-white/20 bg-warm-white/10 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-warm-white transition hover:bg-warm-white/15',
        focusRing,
        className
      )}
    >
      {label}
    </button>
  )
}

function MiniPlayerRow({
  title,
  modeLabel,
  posterUrl,
  isPlaying,
  currentTime,
  duration,
  onToggle,
  onExpand,
  className,
}) {
  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div className={cn('flex items-center gap-3 px-3 py-2.5 text-warm-white', className)}>
      <button
        type="button"
        onClick={onExpand}
        className={cn('flex min-w-0 flex-1 items-center gap-3 text-left', focusRing)}
        aria-label="Expand audio player"
      >
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gold/35">
          {posterUrl ? (
            <img src={posterUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gold/15 text-gold">♪</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold">{modeLabel}</p>
          <p className="truncate text-sm font-semibold leading-tight">{title ?? 'Landmark story'}</p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-warm-white/15">
            <div
              className="h-full rounded-full bg-gold/90 transition-[width] duration-150 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-2">
        <p className="text-xs tabular-nums text-sand/85">{formatRemainingTime(currentTime, duration)}</p>
        <LargePlayButton isPlaying={isPlaying} onToggle={onToggle} size="sm" />
        <button
          type="button"
          onClick={onExpand}
          aria-label="Expand audio player"
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-full bg-warm-white/10 text-warm-white transition hover:bg-warm-white/15',
            focusRing
          )}
        >
          <ChevronIcon expanded={false} className="h-4 w-4 text-sand/80" />
        </button>
      </div>
    </div>
  )
}

function CollapsedPlayer({
  title,
  modeLabel,
  posterUrl,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  onToggle,
  onStop,
  onSeek,
  onCyclePlaybackRate,
  onExpand,
  onCollapse,
  onReopenCard,
  cardOpen,
  className,
}) {
  return (
    <div className={cn('px-3 py-3 text-warm-white', className)}>
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-gold/35">
          {posterUrl ? (
            <img src={posterUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gold/15 text-gold">♪</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold">{modeLabel}</p>
          <p className="truncate font-display text-base font-semibold leading-tight">{title}</p>
        </div>

        <LargePlayButton isPlaying={isPlaying} onToggle={onToggle} size="md" />
      </div>

      <div className="mt-3 space-y-2">
        <AudioScrubber currentTime={currentTime} duration={duration} onSeek={onSeek} compact />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SpeedControl playbackRate={playbackRate} onCycle={onCyclePlaybackRate} />
            <span className="text-xs tabular-nums text-sand/80">
              {formatAudioTime(currentTime)}
              <span className="text-sand/50"> · </span>
              {formatRemainingTime(currentTime, duration)}
            </span>
          </div>
          <div className="flex items-center gap-2">
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
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop audio"
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full bg-warm-white/10 text-warm-white transition hover:bg-warm-white/15',
                focusRing
              )}
            >
              <StopIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Expand audio player"
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full bg-warm-white/10 text-warm-white transition hover:bg-warm-white/15',
                focusRing
              )}
            >
              <ChevronIcon expanded={false} className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Collapse to mini player"
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full bg-warm-white/10 text-warm-white transition hover:bg-warm-white/15',
                focusRing
              )}
            >
              <ChevronIcon expanded className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExpandedPlayer({
  title,
  subtitle,
  modeLabel,
  posterUrl,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  onToggle,
  onStop,
  onSeek,
  onCyclePlaybackRate,
  onCollapse,
  animateOnPlay = false,
  className,
}) {
  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div className={cn('relative overflow-hidden rounded-3xl text-warm-white shadow-glass-lg', className)}>
      <ArtworkBackdrop posterUrl={posterUrl} />

      <div className="relative z-[1] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-eyebrow uppercase text-gold">{modeLabel}</p>
            <p className="mt-1 truncate font-display text-xl font-semibold leading-tight sm:text-2xl">
              {title}
            </p>
            {subtitle ? (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-sand/85">{subtitle}</p>
            ) : null}
          </div>
          {onCollapse ? (
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Collapse audio player"
              className={cn(
                'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warm-white/10 text-warm-white transition hover:bg-warm-white/15',
                focusRing
              )}
            >
              <ChevronIcon expanded className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mt-5 animate-fade-in-soft">
          <AudioWaveform progress={progress} seed={title?.length ?? 1} animated={isPlaying} />
        </div>

        <div className="mt-5 space-y-2">
          <AudioScrubber currentTime={currentTime} duration={duration} onSeek={onSeek} />
          <div className="flex items-center justify-between text-xs tabular-nums text-sand/85">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatRemainingTime(currentTime, duration)}</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-4 sm:gap-6">
          <SpeedControl playbackRate={playbackRate} onCycle={onCyclePlaybackRate} />
          <LargePlayButton
            isPlaying={isPlaying}
            onToggle={onToggle}
            size="lg"
            animateOnPlay={animateOnPlay}
          />
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop audio"
            className={cn(
              'inline-flex h-12 w-12 items-center justify-center rounded-full border border-warm-white/20 bg-warm-white/10 text-warm-white transition hover:bg-warm-white/15',
              focusRing
            )}
          >
            <StopIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AudioPlayer({
  layout = 'expanded',
  title,
  subtitle,
  modeLabel = 'Audio story',
  posterUrl,
  isPlaying,
  currentTime = 0,
  duration = 0,
  playbackRate = 1,
  onToggle,
  onStop,
  onSeek,
  onCyclePlaybackRate,
  onLayoutChange,
  onReopenCard,
  cardOpen = false,
  animateOnPlay = false,
  className,
}) {
  const handleToggleWithHaptic = () => {
    if (!isPlaying) {
      triggerHaptic(HAPTIC_KIND.AUDIO_PLAY)
    } else {
      triggerHaptic(HAPTIC_KIND.SOFT_TAP)
    }
    onToggle?.()
  }

  if (layout === 'mini') {
    return (
      <MiniPlayerRow
        title={title}
        modeLabel={modeLabel}
        posterUrl={posterUrl}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onToggle={handleToggleWithHaptic}
        onExpand={() => onLayoutChange?.('collapsed')}
        className={className}
      />
    )
  }

  if (layout === 'collapsed') {
    return (
      <CollapsedPlayer
        title={title}
        modeLabel={modeLabel}
        posterUrl={posterUrl}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        playbackRate={playbackRate}
        onToggle={handleToggleWithHaptic}
        onStop={onStop}
        onSeek={onSeek}
        onCyclePlaybackRate={onCyclePlaybackRate}
        onExpand={() => onLayoutChange?.('expanded')}
        onCollapse={() => onLayoutChange?.('mini')}
        onReopenCard={onReopenCard}
        cardOpen={cardOpen}
        className={className}
      />
    )
  }

  return (
    <ExpandedPlayer
      title={title}
      subtitle={subtitle}
      modeLabel={modeLabel}
      posterUrl={posterUrl}
      isPlaying={isPlaying}
      currentTime={currentTime}
      duration={duration}
      playbackRate={playbackRate}
      onToggle={handleToggleWithHaptic}
      onStop={onStop}
      onSeek={onSeek}
      onCyclePlaybackRate={onCyclePlaybackRate}
      onCollapse={() => onLayoutChange?.('collapsed')}
      animateOnPlay={animateOnPlay}
      className={className}
    />
  )
}

export default AudioPlayer
