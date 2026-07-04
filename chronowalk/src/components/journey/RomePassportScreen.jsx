import { cn } from '../ui'

function EmbossedStamp({ stamp }) {
  return (
    <article
      className="group flex flex-col items-center text-center"
      data-testid={`passport-stamp-${stamp.id}`}
      aria-label={`${stamp.title} stamp`}
    >
      <div
        className={cn(
          'relative flex h-[7.25rem] w-[7.25rem] items-center justify-center sm:h-[7.75rem] sm:w-[7.75rem]',
          'rounded-full border border-bronze/35 bg-gradient-to-br from-parchment/90 via-ivory to-parchment/70',
          'shadow-[inset_0_2px_3px_rgba(255,253,248,0.95),inset_0_-4px_8px_rgba(168,116,42,0.14),0_6px_18px_rgba(28,28,28,0.08)]',
          'transition duration-300 group-hover:shadow-[inset_0_2px_3px_rgba(255,253,248,0.95),inset_0_-4px_10px_rgba(168,116,42,0.18),0_8px_22px_rgba(28,28,28,0.1)]'
        )}
      >
        <div
          className="absolute inset-[0.45rem] rounded-full border border-dashed border-bronze/25"
          aria-hidden="true"
        />
        <div
          className="absolute inset-[0.9rem] rounded-full border border-bronze/15"
          aria-hidden="true"
        />

        <div className="relative px-3">
          <p
            className="font-display text-[0.72rem] font-semibold uppercase leading-tight tracking-[0.14em] text-bronze sm:text-xs"
            style={{ textShadow: '0 1px 0 rgba(255, 253, 248, 0.85)' }}
          >
            Rome
          </p>
          <p
            className="mt-1 font-display text-[0.95rem] font-semibold leading-tight text-deep-slate sm:text-base"
            style={{ textShadow: '0 1px 0 rgba(255, 253, 248, 0.7)' }}
          >
            {stamp.title}
          </p>
        </div>
      </div>

      <p className="mt-4 max-w-[8.5rem] font-display text-sm italic leading-snug text-soft-slate">
        {stamp.inscription}
      </p>
    </article>
  )
}

export default function RomePassportScreen({
  title,
  subtitle,
  holderName,
  edition,
  stamps = [],
  onBack,
  onExploreMore,
}) {
  return (
    <div
      className="min-h-dvh bg-ivory text-deep-slate paper-texture"
      data-testid="rome-passport-screen"
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 pb-safe pt-safe sm:px-8">
        <header>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 min-h-11 text-sm font-medium text-soft-slate transition hover:text-deep-slate"
          >
            Back to your timeline
          </button>

          <p className="mt-8 text-eyebrow uppercase text-bronze">Rome passport</p>
          <h1 className="mt-3 font-display text-[2rem] font-semibold leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-soft-slate sm:text-lg">
            {subtitle}
          </p>
        </header>

        <section
          className="mt-10 flex-1 pb-10"
          aria-label="Passport stamp collection"
        >
          <div
            className={cn(
              'relative overflow-hidden rounded-[2rem] border border-parchment/90',
              'bg-gradient-to-b from-parchment/55 via-ivory to-ivory shadow-plaque-lg'
            )}
          >
            <div className="absolute inset-0 paper-texture opacity-50" aria-hidden="true" />
            <div
              className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-bronze/10 to-transparent"
              aria-hidden="true"
            />

            <div className="relative grid gap-0 lg:grid-cols-2">
              <div className="border-b border-parchment/80 px-6 py-8 sm:px-8 lg:border-b-0 lg:border-r">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bronze/80">
                  Official keepsake
                </p>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-deep-slate">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-soft-slate">{edition}</p>

                <dl className="mt-10 space-y-5">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-soft-slate">
                      Bearer
                    </dt>
                    <dd className="mt-1 font-display text-2xl text-deep-slate">{holderName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-soft-slate">
                      Collection
                    </dt>
                    <dd className="mt-1 text-base leading-relaxed text-soft-slate">
                      Monument stamps earned by arriving on foot and standing still long enough for
                      Rome to leave its mark.
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="px-6 py-8 sm:px-8">
                {stamps.length ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bronze/80">
                      Your stamps
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
                      {stamps.map((stamp) => (
                        <EmbossedStamp key={stamp.id} stamp={stamp} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[14rem] flex-col items-center justify-center text-center">
                    <div
                      className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-parchment bg-ivory/70"
                      aria-hidden="true"
                    >
                      <span className="font-display text-sm uppercase tracking-[0.14em] text-soft-slate/70">
                        Rome
                      </span>
                    </div>
                    <p className="mt-6 max-w-xs text-base leading-relaxed text-soft-slate">
                      Your passport is ready. Each monument you arrive at will leave a stamp here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {onExploreMore ? (
          <footer className="pb-8">
            <button
              type="button"
              onClick={onExploreMore}
              className="text-sm font-medium tracking-[0.08em] text-bronze underline decoration-bronze/30 underline-offset-4 transition hover:text-bronze-dark"
            >
              Explore more
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  )
}
