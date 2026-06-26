import { EmptyState, cn, metaLabel } from './ui'
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
      <EmptyState
        preset="tourCompleted"
        title={tour?.title ?? 'Tour complete'}
        onAction={onViewSummary}
        onSecondaryAction={onDismiss}
        className="pointer-events-auto max-w-md shadow-glass-lg"
      >
        <div className="mt-6 flex gap-3 border-y border-limestone/60 py-5">
          <StatColumn label="Stops visited" value={`${visitedCount}/${totalStops}`} />
          <StatColumn label="Distance walked" value={formatWalkedDistance(walkedMeters)} />
          <StatColumn label="Time spent" value={formatElapsedDuration(startedAtMs)} />
        </div>
      </EmptyState>
    </div>
  )
}

export default TourCompleteView
