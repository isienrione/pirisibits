import { ProgressRing } from './journey/ProgressRing'
import { Button, GlassPanel, cn, ctaInCard, metaLabel } from './ui'
import { formatElapsedDuration, formatWalkedDistance } from '../utils/tourStats'

function MemoryStat({ label, value }) {
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
  mapStops = [],
  onViewSummary,
  onDismiss,
}) {
  const totalStops = tour?.stopIds?.length ?? visitedCount
  const completionPercent = totalStops > 0 ? Math.round((visitedCount / totalStops) * 100) : 100

  const visitedTitles = mapStops
    .filter((stop) => stop.status === 'completed')
    .map((stop) => stop.title)

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-deep-slate/50 px-4 backdrop-blur-sm">
      <GlassPanel className="pointer-events-auto max-w-md animate-journey-complete rounded-3xl p-6 text-center shadow-glass-lg">
        <div className="mx-auto flex justify-center">
          <ProgressRing
            value={completionPercent}
            size={104}
            strokeWidth={7}
            label="Complete"
            progressClassName="text-gold"
          />
        </div>

        <p className="mt-5 text-eyebrow uppercase text-gold">Journey complete</p>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-deep-slate">
          {tour?.title ?? 'Your walk through Rome'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-soft-slate">
          You walked the full route — {visitedCount} landmark{visitedCount === 1 ? '' : 's'} along
          the way, each one a chapter of the city&apos;s story.
        </p>

        {visitedTitles.length ? (
          <p className="mt-3 text-sm leading-relaxed text-deep-slate/85">
            {visitedTitles.slice(0, 4).join(' · ')}
            {visitedTitles.length > 4 ? ` · +${visitedTitles.length - 4} more` : ''}
          </p>
        ) : null}

        <div className="mt-6 flex gap-3 border-y border-limestone/60 py-5">
          <MemoryStat label="Visited" value={visitedCount} />
          <MemoryStat label="Distance" value={formatWalkedDistance(walkedMeters)} />
          <MemoryStat label="Time" value={formatElapsedDuration(startedAtMs)} />
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <Button size="lg" fullWidth onClick={onViewSummary}>
            View journey summary
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
