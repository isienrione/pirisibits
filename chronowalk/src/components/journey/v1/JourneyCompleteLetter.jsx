import { formatElapsedDuration, formatWalkedDistance } from '../../../utils/tourStats.js'

export default function JourneyCompleteLetter({
  tour,
  visitedCount,
  walkedMeters,
  startedAtMs,
}) {
  const totalStops = tour?.stopIds?.length ?? visitedCount

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-6 pb-12 pt-16">
      <p className="text-eyebrow uppercase text-ember">Your letter</p>
      <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-warmwhite">
        You walked {tour?.title ?? 'Rome'}
      </h1>
      <p className="mt-6 text-base leading-relaxed text-muted">
        Every stop left a trace — the crowd at the arena, the forum stones under your feet, the
        living city at dusk. This is the route you heard.
      </p>

      <div className="mt-10 space-y-4 border-y border-ink800 py-8 text-sm">
        <p>
          <span className="font-semibold text-warmwhite">{visitedCount}</span>
          <span className="text-muted"> of {totalStops} landmarks visited</span>
        </p>
        <p>
          <span className="font-semibold text-warmwhite">{formatWalkedDistance(walkedMeters)}</span>
          <span className="text-muted"> walked</span>
        </p>
        <p>
          <span className="font-semibold text-warmwhite">{formatElapsedDuration(startedAtMs)}</span>
          <span className="text-muted"> on the path</span>
        </p>
      </div>

      <p className="mt-auto pt-10 font-display text-xl italic leading-relaxed text-muted">
        Rome keeps its echoes for those who walk slowly enough to hear them.
      </p>
    </div>
  )
}
