import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildJournalTimeline, journalHeadline, summarizeJournalProgress } from '../content/journalTimeline.js'
import { JOURNEY_STATES } from '../state/journey.js'
import { useSettingsSheet } from './context/SettingsSheetContext.jsx'
import { useV2Journey, useTourManifest } from '../hooks/useV2Journey.js'
import { T, ACT_COLORS } from './tokens.js'
import { photoForWaypoint, signatureLine, titleForWaypoint } from './lib/waypointPresentation.js'
import { getWaypoint } from '../content/manifest.js'
import E1JournalHome from './screens/E1JournalHome.jsx'

function actColorForNumeral(numeral) {
  return ACT_COLORS[numeral] ?? T.actI
}

function statusLabel(status) {
  if (status === 'completed') return 'Visited'
  if (status === 'current') return 'Current'
  return 'On route'
}

export default function RedesignJournalScreen({ embedded = true }) {
  const navigate = useNavigate()
  const { openSettings } = useSettingsSheet()
  const { state, context } = useV2Journey()
  const { manifest, loading, error } = useTourManifest()

  const groups = useMemo(() => {
    if (!manifest) return []
    const timeline = buildJournalTimeline(manifest, {
      path: context.path,
      sequenceIndex: context.currentSequenceIndex,
      completedWaypointIds: context.completedWaypointIds,
    })

    return timeline
      .map((act) => ({
        act: act.numeral,
        color: actColorForNumeral(act.numeral),
        name: act.title,
        cards: act.entries
          .filter((entry) => entry.onPath)
          .map((entry) => {
            const waypoint = getWaypoint(manifest, entry.id)
            return {
              id: entry.id,
              name: titleForWaypoint(waypoint),
              sigLine: signatureLine(waypoint),
              ts: statusLabel(entry.status),
              status: entry.status,
              photo: photoForWaypoint(waypoint),
            }
          }),
      }))
      .filter((group) => group.cards.length > 0)
  }, [manifest, context.path, context.currentSequenceIndex, context.completedWaypointIds])

  const progress = useMemo(() => summarizeJournalProgress(buildJournalTimeline(manifest ?? { acts: [] }, context)), [manifest, context])
  const headline = journalHeadline(progress)
  const isEmpty = !manifest || groups.length === 0

  if (loading) {
    return (
      <E1JournalHome
        embedded={embedded}
        loading
        headline="Your Rome"
        subtitle="Gathering your path…"
        groups={[]}
        empty={false}
      />
    )
  }

  if (error || !manifest) {
    return (
      <E1JournalHome
        embedded={embedded}
        headline="Journal unavailable"
        subtitle={error?.message ?? 'Could not load your memories.'}
        groups={[]}
        empty
        onStartWalk={() => navigate('/begin')}
      />
    )
  }

  return (
    <E1JournalHome
      embedded={embedded}
      headline="Your Rome"
      subtitle={headline}
      groups={groups}
      empty={isEmpty}
      onStartWalk={() => navigate(state === JOURNEY_STATES.IDLE ? '/begin' : '/journey')}
      onCardClick={(waypointId) => navigate(`/journal/${waypointId}`)}
      onLetterClick={() => navigate('/letter')}
      onAllStopsClick={() => navigate('/stops')}
      onSettingsClick={openSettings}
    />
  )
}
