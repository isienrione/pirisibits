import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildJournalTimeline, journalHeadline, summarizeJournalProgress } from '../content/journalTimeline.js'
import { JOURNEY_STATES } from '../state/journey.js'
import { useSettingsSheet } from './context/SettingsSheetContext.jsx'
import { useV2Journey, useTourManifest } from '../hooks/useV2Journey.js'
import { T, ACT_COLORS } from './tokens.js'
import { photoForWaypoint, signatureLine, thenLoopForWaypoint, thenPhotoForWaypoint, hasJournalThenNow, titleForWaypoint } from './lib/waypointPresentation.js'
import { getWaypoint } from '../content/manifest.js'
import E1JournalHome from './screens/E1JournalHome.jsx'
import { useT } from '../i18n/I18nProvider.jsx'

function actColorForNumeral(numeral) {
  return ACT_COLORS[numeral] ?? T.actI
}

function statusLabel(status, t) {
  if (status === 'completed') return t('journal.visited')
  if (status === 'current') return t('journal.current')
  return t('journal.onRoute')
}

export default function RedesignJournalScreen({ embedded = true }) {
  const navigate = useNavigate()
  const t = useT()
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
              ts: statusLabel(entry.status, t),
              status: entry.status,
              photo: photoForWaypoint(waypoint),
              thenPhoto: thenPhotoForWaypoint(waypoint),
              thenLoop: thenLoopForWaypoint(waypoint),
              showThenNow: hasJournalThenNow(waypoint),
            }
          }),
      }))
      .filter((group) => group.cards.length > 0)
  }, [manifest, context.path, context.currentSequenceIndex, context.completedWaypointIds, t])

  const progress = useMemo(() => summarizeJournalProgress(buildJournalTimeline(manifest ?? { acts: [] }, context)), [manifest, context])
  const headline = journalHeadline(progress)
  const isEmpty = !manifest || groups.length === 0

  if (loading) {
    return (
      <E1JournalHome
        embedded={embedded}
        loading
        headline={t('journal.yourRome')}
        subtitle={t('journal.gathering')}
        groups={[]}
        empty={false}
      />
    )
  }

  if (error || !manifest) {
    return (
      <E1JournalHome
        embedded={embedded}
        headline={t('journal.unavailable')}
        subtitle={error?.message ?? t('journal.loadError')}
        groups={[]}
        empty
        onStartWalk={() => navigate('/begin')}
      />
    )
  }

  return (
    <E1JournalHome
      embedded={embedded}
      headline={t('journal.yourRome')}
      subtitle={headline}
      groups={groups}
      empty={isEmpty}
      onStartWalk={() => navigate(state === JOURNEY_STATES.IDLE ? '/begin' : '/journey')}
      onCardClick={(waypointId) => navigate(`/journal/${waypointId}`)}
      onLetterClick={() => navigate('/letter')}
      onAllStopsClick={() => navigate('/tour')}
      onSettingsClick={openSettings}
    />
  )
}
