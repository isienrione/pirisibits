import { cn } from '../ui'

function ChapterMarker({ status }) {
  return (
    <span
      className={cn(
        'relative z-10 mt-1.5 flex h-3.5 w-3.5 shrink-0 rounded-full border-2',
        status === 'current'
          ? 'border-gold bg-gold shadow-gold-glow'
          : status === 'complete'
            ? 'border-gold/50 bg-gold/25'
            : 'border-ivory/20 bg-obsidian'
      )}
      aria-hidden="true"
    />
  )
}

export default function StoryChaptersTimeline({
  stopTitle,
  chapters,
  currentChapterIndex,
  onSelectChapter,
  onBack,
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-obsidian text-ivory" data-testid="story-chapters-timeline">
      <header className="px-6 pt-safe sm:px-8">
        <button
          type="button"
          onClick={onBack}
          className="mt-4 min-h-11 text-sm font-medium text-ivory/70 transition hover:text-ivory"
        >
          Back to player
        </button>
        <p className="mt-8 text-sm font-medium uppercase tracking-[0.2em] text-gold/85">
          Story chapters
        </p>
        <h1 className="mt-3 font-display text-[2rem] font-semibold leading-tight sm:text-4xl">
          {stopTitle}
        </h1>
      </header>

      <div className="flex-1 px-6 pb-safe pt-10 sm:px-8">
        <ol className="relative mx-auto max-w-lg space-y-0">
          <div
            className="absolute bottom-4 left-[0.42rem] top-4 w-px bg-gradient-to-b from-gold/50 via-ivory/15 to-transparent"
            aria-hidden="true"
          />

          {chapters.map((chapter, index) => {
            const isCurrent = index === currentChapterIndex
            const isComplete = chapter.status === 'complete'
            const isUpcoming = chapter.status === 'upcoming'
            const canReplay = isComplete && !isCurrent

            return (
              <li key={chapter.id} className="relative flex gap-5 pb-10 last:pb-0">
                <ChapterMarker status={chapter.status} />

                <button
                  type="button"
                  onClick={() => onSelectChapter(chapter, index)}
                  className={cn(
                    'min-w-0 flex-1 rounded-[1.5rem] border px-5 py-4 text-left transition',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60',
                    isCurrent
                      ? 'border-gold/35 bg-gold/[0.08] shadow-gold-glow'
                      : isUpcoming
                        ? 'border-ivory/8 bg-transparent opacity-55'
                        : 'border-ivory/12 bg-ivory/[0.03] opacity-80 hover:border-gold/25 hover:opacity-100'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'text-xs font-semibold uppercase tracking-[0.16em]',
                          isCurrent ? 'text-gold' : 'text-ivory/45'
                        )}
                      >
                        Chapter {chapter.number}
                      </p>
                      <p
                        className={cn(
                          'mt-2 font-display text-xl font-semibold leading-snug sm:text-2xl',
                          isCurrent ? 'text-ivory' : 'text-ivory/75'
                        )}
                      >
                        {chapter.title}
                      </p>
                      <p
                        className={cn(
                          'mt-2 text-sm leading-relaxed sm:text-base',
                          isCurrent ? 'text-ivory/70' : 'text-ivory/45'
                        )}
                      >
                        {chapter.summary}
                      </p>
                    </div>

                    {canReplay ? (
                      <span className="shrink-0 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold/85">
                        Replay
                      </span>
                    ) : null}
                  </div>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
