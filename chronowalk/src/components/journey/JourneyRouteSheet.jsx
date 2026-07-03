import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildMapStopsFromManifest } from '../../content/mapStops.js'
import { toStopRowModel } from '../../content/stopPresentation.js'
import { actAccentValue } from '../../design/actAccents.ts'
import { ROME_ACTS } from '../../data/romePacing.js'
import { useJourney, useTourManifest } from '../../hooks/useJourney.js'
import { SectionHeader } from '../ui'
import { ShellStopRow } from '../../shell'

function actProgress(act, completedWaypointIds) {
  const completed = new Set(completedWaypointIds)
  const heard = act.waypoints.filter((id) => completed.has(id)).length
  const total = act.waypoints.length

  return {
    heard,
    total,
    complete: heard >= total && total > 0,
  }
}

export default function JourneyRouteSheet({ onClose }) {
  const navigate = useNavigate()
  const { context } = useJourney()
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

  const actSummaries = useMemo(
    () =>
      ROME_ACTS.map((act) => ({
        act,
        progress: actProgress(act, context.completedWaypointIds),
      })),
    [context.completedWaypointIds]
  )

  const completedCount = context.completedWaypointIds.length

  if (loading) {
    return (
      <SectionHeader
        align="left"
        eyebrow="Route"
        title="Loading route…"
        subtitle="Gathering acts and stops."
      />
    )
  }

  if (error || !manifest) {
    return (
      <SectionHeader
        align="left"
        eyebrow="Route"
        title="Route unavailable"
        subtitle={error?.message ?? 'Tour manifest did not load.'}
      />
    )
  }

  return (
    <div className="pb-6">
      <SectionHeader
        align="left"
        id="journey-route-sheet-title"
        eyebrow="Route"
        title="Your Rome path"
        subtitle={`${completedCount} stops heard · ${rows.length} on the map`}
      />

      <div className="mt-6 space-y-3">
        {actSummaries.map(({ act, progress }) => (
          <div key={act.id} className="bg-ink900 rounded-card px-4 py-4">
            <p className="text-eyebrow uppercase" style={{ color: actAccentValue(act.id) }}>
              Act {act.numeral} · {act.title}
            </p>
            <p className="mt-2 text-sm text-muted">{act.promise}</p>
            <p className="mt-3 text-sm font-semibold text-ink900">
              {progress.complete
                ? 'Complete'
                : `${progress.heard} of ${progress.total} heard`}
            </p>
          </div>
        ))}
      </div>

      <SectionHeader
        align="left"
        eyebrow="Stops"
        title="All landmarks"
        subtitle="Tap a stop to return to your walk."
        className="mb-4 mt-8"
      />

      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id}>
            <ShellStopRow
              index={row.index}
              title={row.title}
              subtitle={row.subtitle}
              imageUrl={row.imageUrl}
              status={row.status}
              onPress={
                row.status === 'locked'
                  ? undefined
                  : () => {
                      onClose?.()
                      navigate('/journey')
                    }
              }
              disabled={row.status === 'locked'}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
