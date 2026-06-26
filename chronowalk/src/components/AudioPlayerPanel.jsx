import { MediaPlayerControls, AudioLoadingIndicator, FadeImage, AudioIcon, cn, typeBodySmMuted, typeCaption, typeEyebrowGold, typeSectionTitleSm } from './ui'

function AudioPlayerPanel({
  title,
  subtitle,
  isPlaying,
  isLoading = false,
  onToggle,
  onStop,
  posterUrl,
  placeholderUrl,
  className,
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border border-limestone/40 bg-gradient-to-b from-deep-slate to-deep-slate/95 p-4 text-warm-white shadow-glass-lg',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-gold/40 bg-deep-slate shadow-inner">
          {posterUrl ? (
            <FadeImage
              src={posterUrl}
              placeholderSrc={placeholderUrl}
              className="h-full w-full"
              imgClassName="h-full w-full object-cover"
              skeletonClassName="rounded-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gold/15 text-gold">
              <AudioIcon size="lg" />
            </div>
          )}
          <span
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-gold/30 ring-offset-2 ring-offset-deep-slate"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className={typeEyebrowGold}>Audio story</p>
          <p className={cn('truncate', typeSectionTitleSm)}>{title}</p>
          {isLoading ? (
            <AudioLoadingIndicator className="mt-2" />
          ) : subtitle ? (
            <p className={cn(typeCaption, 'mt-2 line-clamp-2 text-sand/85')}>{subtitle}</p>
          ) : null}
        </div>

        <MediaPlayerControls
          isPlaying={isPlaying}
          onToggle={onToggle}
          onStop={onStop}
          theme="dark"
        />
      </div>
    </div>
  )
}

export default AudioPlayerPanel
