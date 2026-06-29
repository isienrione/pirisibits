import { BronzeButton, Button, cn, ctaInCard, metaLabel } from './ui'
import { MedallionBadge } from './ui/MedallionBadge'
import { formatElapsedDuration, formatWalkedDistance } from '../utils/tourStats'

function StatColumn({ label, value }) {
  return (
    <div className="flex-1 text-center">
      <p className="font-display text-2xl font-semibold tabular-nums text-ivory">{value}</p>
      <p className={cn(metaLabel, 'mt-1 text-parchment/80')}>{label}</p>
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
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-obsidian/85 px-4 backdrop-blur-sm">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.14)_0%,transparent_65%)]"
        aria-hidden="true"
      />

      <div className="pointer-events-auto relative max-w-md rounded-3xl border border-gold/25 bg-gradient-to-b from-[#2a2a2a] via-obsidian to-obsidian p-6 text-center shadow-plaque-lg">
        <MedallionBadge size="lg" pulse className="mx-auto">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          </svg>
        </MedallionBadge>

        <p className="mt-5 text-eyebrow uppercase text-gold">Journey complete</p>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-ivory">
          {tour?.title ?? 'Tour complete'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-parchment/85">
          You visited every stop on this route through{' '}
          <span className="font-display italic text-gold">ancient Rome</span>.
        </p>

        <div className="mt-6 flex gap-3 border-y border-gold/20 py-5">
          <StatColumn label="Stops visited" value={`${visitedCount}/${totalStops}`} />
          <StatColumn label="Distance walked" value={formatWalkedDistance(walkedMeters)} />
          <StatColumn label="Time spent" value={formatElapsedDuration(startedAtMs)} />
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <BronzeButton size="lg" fullWidth onClick={onViewSummary}>
            View summary
          </BronzeButton>
          <Button
            variant="secondary"
            fullWidth
            className={cn(ctaInCard, 'border-gold/30 bg-transparent text-ivory hover:bg-ivory/10')}
            onClick={onDismiss}
          >
            Return to map
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TourCompleteView
