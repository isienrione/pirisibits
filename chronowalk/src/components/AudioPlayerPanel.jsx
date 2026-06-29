import { MediaPlayerControls, cn } from './ui'

function AudioPlayerPanel({
  title,
  subtitle,
  isPlaying,
  onToggle,
  onStop,
  posterUrl,
  className,
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-b from-obsidian via-[#252525] to-obsidian p-4 text-ivory shadow-plaque-lg',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.08),transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-gold/45 bg-obsidian shadow-bronze-cta">
          {posterUrl ? (
            <img src={posterUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gold/10 text-gold">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3a9 9 0 1 0 9 9"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </div>
          )}
          <span
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-gold/25 ring-offset-2 ring-offset-obsidian"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-eyebrow uppercase text-gold">Audio story</p>
          <p className="truncate font-display text-lg font-semibold leading-tight text-ivory">{title}</p>
          {subtitle ? <p className="mt-1 line-clamp-2 text-xs text-parchment/80">{subtitle}</p> : null}
        </div>

        <MediaPlayerControls
          isPlaying={isPlaying}
          onToggle={onToggle}
          onStop={onStop}
          theme="dark"
        />
      </div>

      <div className="relative mt-4 flex h-1 items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 24 }, (_, index) => (
          <span
            key={index}
            className={cn(
              'h-full flex-1 rounded-full bg-gold/20',
              isPlaying && index % 3 === 0 && 'bg-gold/50'
            )}
            style={{ minHeight: `${4 + (index % 5) * 2}px`, alignSelf: 'center' }}
          />
        ))}
      </div>
    </div>
  )
}

export default AudioPlayerPanel
