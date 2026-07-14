import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buildJournalTimeline,
  journalHeadline,
  pickJournalReflection,
  summarizeJournalProgress,
} from '../content/journalTimeline.js'
import { buildJourneyLetter } from '../content/journeyLetter.js'
import { JOURNEY_STATES } from '../state/journey.js'
import { useSettingsSheet } from './context/SettingsSheetContext.jsx'
import { useV2Journey, useTourManifest } from '../hooks/useV2Journey.js'
import { T, ACT_COLORS } from './tokens.js'
import {
  photoForWaypoint,
  thenPhotoForWaypoint,
  titleForWaypoint,
} from './lib/waypointPresentation.js'
import {
  memoryQuote,
  memoryStatusCaption,
  memoryWalkFootnote,
} from './lib/journalMemory.js'
import { getWaypoint } from '../content/manifest.js'
import E1JournalHome from './screens/E1JournalHome.jsx'

function actColorForNumeral(numeral) {
  return ACT_COLORS[numeral] ?? T.actI
}

function formatLetterFootnote(letter, distanceLabel) {
  const parts = []
  if (letter.stopCount > 0) {
    parts.push(letter.stopCount === 1 ? '1 stop' : `${letter.stopCount} stops`)
  }
  if (letter.walkedMeters >= 1000) {
    parts.push(`${(letter.walkedMeters / 1000).toFixed(1)} km`)
  } else if (distanceLabel) {
    parts.push(distanceLabel.replace(/^~/, 'about '))
  }
  return parts.length ? parts.join(' · ') : null
}

export default function RedesignJournalScreen({ embedded = true }) {
  const navigate = useNavigate()
  const { openSettings } = useSettingsSheet()
  const { state, context } = useV2Journey()
  const { manifest, loading, error } = useTourManifest()

  const timeline = useMemo(() => {
    if (!manifest) return []
    return buildJournalTimeline(manifest, {
      path: context.path,
      sequenceIndex: context.currentSequenceIndex,
      completedWaypointIds: context.completedWaypointIds,
    })
  }, [manifest, context.path, context.currentSequenceIndex, context.completedWaypointIds])

  const groups = useMemo(() => {
    if (!manifest) return []

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
              sigLine: memoryQuote(waypoint),
              status: entry.status,
              statusCaption: memoryStatusCaption(entry.status),
              photo: photoForWaypoint(waypoint),
              thenPhoto: thenPhotoForWaypoint(waypoint),
            }
          }),
      }))
      .filter((group) => group.cards.length > 0)
  }, [manifest, timeline])

  const progress = useMemo(() => summarizeJournalProgress(timeline), [timeline])

  const letterModel = useMemo(() => {
    if (!manifest) return null
    return buildJourneyLetter(manifest, context)
  }, [manifest, context])

  const epigraph = useMemo(() => {
    if (!manifest) return null
    return pickJournalReflection(manifest, progress.completed)
  }, [manifest, progress.completed])

  const walkFootnote = useMemo(
    () =>
      memoryWalkFootnote({
        completed: progress.completed,
        total: progress.total,
        distanceLabel: manifest?.product?.distanceLabel ?? null,
        walkedMeters: letterModel?.walkedMeters ?? 0,
      }),
    [progress, manifest, letterModel]
  )

  const letter = useMemo(() => {
    if (!letterModel) return null
    return {
      title: letterModel.title,
      excerpt: letterModel.body,
      footnote: formatLetterFootnote(letterModel, manifest?.product?.distanceLabel),
    }
  }, [letterModel, manifest])

  const headline = journalHeadline(progress)
  const subtitle =
    progress.completed > 0
      ? 'A book of the ground you covered'
      : 'Pages fill as you walk'
  const isEmpty = !manifest || groups.length === 0

  if (loading) {
    return (
      <E1JournalHome
        embedded={embedded}
        loading
        headline="Journal"
        subtitle="Gathering your pages…"
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
        subtitle={error?.message ?? 'Could not open your memory book.'}
        groups={[]}
        empty
        onStartWalk={() => navigate('/begin')}
      />
    )
  }

  return (
    <E1JournalHome
      embedded={embedded}
      headline={headline}
      subtitle={subtitle}
      epigraph={epigraph}
      walkFootnote={walkFootnote}
      letter={letter}
      groups={groups}
      empty={isEmpty}
      onStartWalk={() => navigate(state === JOURNEY_STATES.IDLE ? '/begin' : '/journey')}
      onCardClick={(waypointId) => navigate(`/journal/${waypointId}`)}
      onLetterClick={() => navigate('/letter')}
      onSettingsClick={openSettings}
    />
  )
}
