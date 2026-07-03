import { useMemo } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { buildMapStopsFromManifest } from '../../content/mapStops.js'
import { toStopRowModel } from '../../content/stopPresentation.js'
import { JOURNEY_STATES } from '../../state/journey.js'
import { useJourney, useTourManifest } from '../../hooks/useJourney.js'
import { PageShell, SectionHeader } from '../ui'
import { ShellStopRow } from '../../shell'

export default function StopsScreen() {
  const navigate = useNavigate()
  const { state, context } = useJourney()
  const { manifest, loading, error } = useTourManifest()

  const rows = useMemo(() => {
    if (!manifest) return []

    const stops = buildMapStopsFromManifest(manifest, {
      path: context.path,
      sequenceIndex: context.currentSequenceIndex,
      completedWaypointIds: context.completedWaypointIds,
      promotedOptionalIds: context.promotedOptionalIds,
    })

    return stops.map((stop, index) => toStopRowModel(manifest, stop, index))
  }, [
    manifest,
    context.path,
    context.completedWaypointIds,
    context.currentSequenceIndex,
    context.promotedOptionalIds,
  ])

  if (state === JOURNEY_STATES.IDLE) {
    return <Navigate to="/begin" replace />
  }

  if (loading) {
    return (
      <PageShell>
        <SectionHeader align="left" title="All Stops" subtitle="Loading route…" />
      </PageShell>
    )
  }

  if (error || !manifest) {
    return (
      <PageShell>
        <SectionHeader
          align="left"
          title="All Stops"
          subtitle={error?.message ?? 'Tour unavailable'}
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <SectionHeader
        align="left"
        title="All Stops"
        subtitle={`${rows.length} stops in this tour`}
      />

      <ul className="mt-6 space-y-3">
        {rows.map((row) => (
          <li key={row.id}>
            <ShellStopRow
              index={row.index}
              title={row.title}
              subtitle={row.subtitle}
              imageUrl={row.imageUrl}
              status={row.status}
              onPress={row.status === 'locked' ? undefined : () => navigate('/journey')}
              disabled={row.status === 'locked'}
            />
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-3">
        <Link
          to="/journey"
          className="block rounded-full bg-ember px-5 py-3.5 text-center text-sm font-semibold text-bone"
        >
          Return to walk
        </Link>
        <Link
          to="/map"
          className="block text-center text-sm font-semibold text-ember"
        >
          Open map
        </Link>
      </div>
    </PageShell>
  )
}
