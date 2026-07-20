import { cn } from '../ui'

function BookmarkIcon({ filled = false, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      aria-hidden="true"
    >
      <path
        d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5V19l-6.5-4-6.5 4V6a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function StoryTranscriptReader({
  stopTitle,
  paragraphs,
  currentParagraphIndex,
  bookmarkedIds = [],
  loading = false,
  onToggleBookmark,
  onSelectParagraph,
  onBack,
}) {
  const bookmarkedParagraphs = paragraphs.filter((paragraph) =>
    bookmarkedIds.includes(paragraph.id)
  )

  return (
    <div className="min-h-dvh bg-obsidian text-ivory" data-testid="story-transcript-reader">
      <header className="px-8 pt-safe sm:px-12">
        <button
          type="button"
          onClick={onBack}
          className="mt-4 min-h-11 text-sm font-medium text-ivory/70 transition hover:text-ivory"
        >
          Back to player
        </button>
        <p className="mt-10 text-sm font-medium uppercase tracking-[0.2em] text-gold/85">
          Transcript
        </p>
        <h1 className="mt-3 font-display text-[2rem] font-semibold leading-tight sm:text-4xl">
          {stopTitle}
        </h1>
      </header>

      <div className="mx-auto max-w-2xl px-8 pb-safe pt-10 sm:px-12">
        {bookmarkedParagraphs.length ? (
          <section className="mb-12 border-b border-ivory/10 pb-10" aria-label="Bookmarks">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold/80">
              Bookmarks
            </p>
            <ul className="mt-4 space-y-3">
              {bookmarkedParagraphs.map((paragraph) => (
                <li key={`bookmark-${paragraph.id}`}>
                  <button
                    type="button"
                    className="w-full text-left text-sm leading-relaxed text-ivory/75 transition hover:text-ivory"
                    onClick={() => onSelectParagraph?.(paragraph)}
                  >
                    {paragraph.text}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {loading && !paragraphs.length ? (
          <p className="text-base text-ivory/60">Loading transcript…</p>
        ) : (
          <article className="space-y-10">
            {paragraphs.map((paragraph, index) => {
              const isCurrent = index === currentParagraphIndex
              const isBookmarked = bookmarkedIds.includes(paragraph.id)

              return (
                <div
                  key={paragraph.id}
                  className={cn(
                    'flex gap-4 scroll-mt-24 rounded-r-[1.25rem] border-l-2 pl-2 transition-colors',
                    isCurrent
                      ? 'border-gold bg-gold/[0.08] py-4 pr-3'
                      : 'border-transparent'
                  )}
                  data-paragraph-index={index}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  <button
                    type="button"
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark paragraph'}
                    aria-pressed={isBookmarked}
                    onClick={() => onToggleBookmark(paragraph.id)}
                    className={cn(
                      'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition',
                      isBookmarked
                        ? 'text-gold'
                        : 'text-ivory/35 hover:text-gold/80'
                    )}
                  >
                    <BookmarkIcon filled={isBookmarked} className="h-5 w-5" />
                  </button>

                  <p
                    className={cn(
                      'min-w-0 flex-1 font-display text-lg leading-[1.85] sm:text-xl sm:leading-[1.9]',
                      isCurrent ? 'text-ivory' : 'text-ivory/72'
                    )}
                  >
                    {paragraph.text}
                  </p>
                </div>
              )
            })}
          </article>
        )}
      </div>
    </div>
  )
}
