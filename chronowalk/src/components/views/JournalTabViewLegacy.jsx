import { getWaypointGeo } from '../../data/waypointGeo'
import { PageShell, SectionHeader } from '../ui'

export function JournalTabView({ tour, arrivedStopIds = [] }) {
  const stops = (tour?.stopIds ?? [])
    .filter((id) => arrivedStopIds.includes(id))
    .map((id) => getWaypointGeo(id)?.title ?? id)

  return (
    <PageShell>
      <SectionHeader
        align="left"
        eyebrow="Journal"
        title={stops.length ? 'What you heard' : 'Your journal awaits'}
        subtitle={
          stops.length
            ? `${stops.length} landmarks visited so far`
            : 'Stories and reflections gather here as you walk.'
        }
      />

      {stops.length ? (
        <ul className="mt-6 space-y-3">
          {stops.map((title) => (
            <li key={title} className="bg-ink900 rounded-card px-4 py-3 text-sm font-semibold text-ink900">
              {title}
            </li>
          ))}
        </ul>
      ) : null}
    </PageShell>
  )
}
