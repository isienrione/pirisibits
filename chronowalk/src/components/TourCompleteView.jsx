import { BronzeButton, Button, cn, ctaInCard, metaLabel } from './ui'
import { MedallionBadge } from './ui/MedallionBadge'
import { formatElapsedDuration, formatWalkedDistance } from '../utils/tourStats'

function StatColumn({ label, value }) {
  return (
    <div className="flex-1 text-center">
      <p className="font-display text-2xl font-semibold tabular-nums text-warm-white">{value}</p>
      <p className={cn(metaLabel, 'mt-1 text-muted-warm')}>{label}</p>
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
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-[color-mix(in_srgb,var(--obsidian)_85%,transparent)] px-4">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--ember-glow)_0%,transparent_65%)]"
        aria-hidden="true"
      />

      <div className="pointer-events-auto relative max-w-md rounded-[var(--r-card)] border border-[color-mix(in_srgb,var(--ember)_25%,var(--obsidian))] bg-obsidian p-6 text-center shadow-card">
        <MedallionBadge size="lg" className="mx-auto border-ember text-ember">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          </svg>
        </MedallionBadge>

        <p className="mt-5 text-eyebrow uppercase text-ember">Journey complete</p>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-warm-white">
          {tour?.title ?? 'Tour complete'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-warm">
          You visited every stop on this route through{' '}
          <span className="font-display italic text-ember">ancient Rome</span>.
        </p>

        <div className="mt-6 flex gap-3 border-y border-border-immersion py-5">
          <StatColumn label="Stops visited" value={`${visitedCount}/${totalStops}`} />
          <StatColumn label="Distance walked" value={formatWalkedDistance(walkedMeters)} />
          <StatColumn label="Time spent" value={formatElapsedDuration(startedAtMs)} />
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <BronzeButton size="lg" fullWidth onClick={onViewSummary}>
            View summary
          </BronzeButton>
          <Button
            variant="outline-dark"
            fullWidth
            className={cn(ctaInCard)}
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
