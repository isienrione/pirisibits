import { Button, GlassPanel, cn, ctaInCard, metaLabel } from './ui'
import { formatElapsedDuration, formatWalkedDistance } from '../utils/tourStats'

function StatColumn({ label, value }) {
  return (
    <div className="flex-1 text-center">
      <p className="font-display text-2xl font-semibold tabular-nums text-deep-slate">{value}</p>
      <p className={cn(metaLabel, 'mt-1 text-soft-slate')}>{label}</p>
    </div>
  )
}

function TourCompleteView({
  tour,
  visitedCount,
  walkedMeters,
  startedAtMs,
  onViewSummary,
  onDismiss,
}) {
  const totalStops = tour?.stopIds?.length ?? visitedCount

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-deep-slate/50 px-4 backdrop-blur-sm">
      <GlassPanel className="pointer-events-auto max-w-md rounded-3xl p-6 text-center shadow-glass-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/35 bg-gold/15">
          <svg className="h-7 w-7 text-gold" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="mt-4 text-eyebrow uppercase text-gold">Journey complete</p>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-deep-slate">
          {tour?.title ?? 'Tour complete'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-soft-slate">
          You visited every stop on this route through ancient Rome.
        </p>

        <div className="mt-6 flex gap-3 border-y border-limestone/60 py-5">
          <StatColumn label="Stops visited" value={`${visitedCount}/${totalStops}`} />
          <StatColumn label="Distance walked" value={formatWalkedDistance(walkedMeters)} />
          <StatColumn label="Time spent" value={formatElapsedDuration(startedAtMs)} />
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <Button size="lg" fullWidth onClick={onViewSummary}>
            View summary
          </Button>
          <Button variant="secondary" fullWidth className={ctaInCard} onClick={onDismiss}>
            Return to map
          </Button>
        </div>
      </GlassPanel>
    </div>
  )
}

export default TourCompleteView
