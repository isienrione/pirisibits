import { useMemo } from 'react'
import { buildJourneyLetter } from '../../../content/journeyLetter.js'
import { useTourManifest } from '../../../hooks/useJourney.js'
import JourneyLetter from './JourneyLetter.jsx'

export default function JourneyCompleteLetter({
  tour,
  visitedCount,
  walkedMeters,
  startedAtMs,
  arrivedStopIds = [],
  path = 'a',
}) {
  const { manifest } = useTourManifest()

  const letter = useMemo(() => {
    if (!manifest) return null
    return buildJourneyLetter(manifest, {
      completedWaypointIds: arrivedStopIds,
      path,
    })
  }, [arrivedStopIds, manifest, path])

  const title = tour?.title ? `You walked ${tour.title}` : letter?.title ?? 'The path you walked'

  return (
    <JourneyLetter
      title={title}
      stopCount={visitedCount}
      walkedMeters={walkedMeters ?? letter?.walkedMeters ?? 0}
      startedAtMs={startedAtMs}
      closingLine={
        letter?.reflection ??
        'Rome keeps its echoes for those who walk slowly enough to hear them.'
      }
      stops={letter?.stops ?? []}
    />
  )
}
