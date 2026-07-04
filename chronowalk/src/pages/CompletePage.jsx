import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDistance } from '../utils/distance'
import { formatElapsedDuration, formatWalkedDistance } from '../utils/tourStats'
import { loadRomeTourManifest } from '../content/romeTourManifest'
import { useJourney } from '../hooks/useJourney'
import { GoldButton, Button, MedallionBadge, cn, metaLabel } from '../components/ui'
import { ROUTES } from '../routes/paths'

function estimateJourneyDistanceMeters(stops, completedStopIds) {
  const completed = new Set(completedStopIds)
  if (completed.size < 2) return 0

  let total = 0
  for (let index = 1; index < stops.length; index += 1) {
    const from = stops[index - 1]
    const to = stops[index]
    if (!completed.has(from.id) || !completed.has(to.id)) continue

    total += getDistance(from.coords.lat, from.coords.lng, to.coords.lat, to.coords.lng)
  }

  return total
}

function StatColumn({ label, value }) {
  return (
    <div className="flex-1 text-center">
      <p className="font-display text-2xl font-semibold tabular-nums text-ivory">{value}</p>
      <p className={cn(metaLabel, 'mt-1.5 text-parchment/85')}>{label}</p>
    </div>
  )
}

export default function CompletePage() {
  const navigate = useNavigate()
  const { context, manifest: journeyManifest } = useJourney()
  const manifest = useMemo(
    () => journeyManifest ?? loadRomeTourManifest(),
    [journeyManifest]
  )

  const visitedCount = context.completedStopIds.length
  const totalStops = manifest.stops.length
  const walkedMeters = useMemo(
    () => estimateJourneyDistanceMeters(manifest.stops, context.completedStopIds),
    [context.completedStopIds, manifest.stops]
  )

  const startedAtMs = context.journeyStartedAt
    ? Date.parse(context.journeyStartedAt)
    : null
  const timeSpent = startedAtMs ? formatElapsedDuration(startedAtMs) : '—'

  return (
    <div className="relative flex min-h-dvh flex-col bg-obsidian px-6 pb-safe pt-safe text-ivory">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.2)_0%,transparent_62%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.12),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center py-10 text-center">
        <MedallionBadge size="xl" pulse className="shadow-gold-glow">
          <svg className="h-10 w-10 text-bronze" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          </svg>
        </MedallionBadge>

        <p className="mt-8 text-eyebrow uppercase tracking-[0.18em] text-gold">Journey complete</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ivory sm:text-[2.75rem]">
          You walked through Rome.
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-parchment/80">
          Every stop on this route — stories heard, streets walked, and ancient Rome brought
          back into view.
        </p>

        <div className="mt-10 flex w-full gap-4 border-y border-gold/20 py-6">
          <StatColumn
            label="Stops visited"
            value={`${visitedCount || totalStops}/${totalStops}`}
          />
          <StatColumn label="Approx. distance" value={formatWalkedDistance(walkedMeters)} />
          <StatColumn label="Time spent" value={timeSpent} />
        </div>

        <div className="mt-8 flex w-full flex-col gap-3">
          <GoldButton fullWidth showArrow onClick={() => navigate(ROUTES.stops)}>
            View your journey
          </GoldButton>
          <Button
            variant="outline-dark"
            size="lg"
            fullWidth
            onClick={() => navigate(ROUTES.journey)}
          >
            Return to map
          </Button>
        </div>
      </div>
    </div>
  )
}
