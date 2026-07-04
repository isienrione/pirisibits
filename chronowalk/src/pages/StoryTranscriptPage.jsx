import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useJourney } from '../hooks/useJourney'
import { useStoryAudio } from '../hooks/useStoryAudio'
import { useTranscriptDocument } from '../hooks/useTranscriptDocument'
import { JOURNEY_STATES } from '../state/journeyState'
import StoryTranscriptReader from '../components/journey/StoryTranscriptReader'
import { resolveCurrentParagraphIndex } from '../utils/transcriptContent'
import {
  readTranscriptBookmarks,
  toggleTranscriptBookmark,
} from '../utils/transcriptBookmarks'
import {
  ROUTES,
  arrivalPath,
  landmarkPath,
  storyPath,
  thresholdPath,
} from '../routes/paths'

export default function StoryTranscriptPage() {
  const navigate = useNavigate()
  const { state, context, currentStop, updateContext } = useJourney()
  const [bookmarks, setBookmarks] = useState(() =>
    readTranscriptBookmarks(currentStop?.id)
  )

  useEffect(() => {
    setBookmarks(readTranscriptBookmarks(currentStop?.id))
  }, [currentStop?.id])

  const { paragraphs, loading } = useTranscriptDocument(currentStop)

  const handleProgress = useCallback(
    (progress) => {
      updateContext({ audioProgress: progress })
    },
    [updateContext]
  )

  const { progress } = useStoryAudio({
    src: currentStop?.audio,
    initialProgress: context.audioProgress ?? 0,
    onProgressChange: handleProgress,
  })

  const currentParagraphIndex = useMemo(
    () => resolveCurrentParagraphIndex(paragraphs, progress),
    [paragraphs, progress]
  )

  const handleToggleBookmark = useCallback(
    (paragraphId) => {
      if (!currentStop?.id) return
      setBookmarks(toggleTranscriptBookmark(currentStop.id, paragraphId))
    },
    [currentStop?.id]
  )

  const handleSelectParagraph = useCallback(
    (paragraph) => {
      updateContext({ audioProgress: paragraph.startProgress })
      navigate(storyPath(), { replace: true })
    },
    [navigate, updateContext]
  )

  const handleBack = useCallback(() => {
    navigate(storyPath(), { replace: true })
  }, [navigate])

  if (state !== JOURNEY_STATES.STORY) {
    if (state === JOURNEY_STATES.ARRIVED) {
      return <Navigate to={arrivalPath()} replace />
    }
    if (state === JOURNEY_STATES.THRESHOLD) {
      return <Navigate to={thresholdPath()} replace />
    }
    if ([JOURNEY_STATES.WALKING, JOURNEY_STATES.APPROACHING].includes(state)) {
      return <Navigate to={ROUTES.journey} replace />
    }
    return <Navigate to={landmarkPath()} replace />
  }

  if (!currentStop) {
    return <Navigate to={landmarkPath()} replace />
  }

  return (
    <StoryTranscriptReader
      stopTitle={currentStop.shortTitle ?? currentStop.title}
      paragraphs={paragraphs}
      currentParagraphIndex={currentParagraphIndex}
      bookmarkedIds={bookmarks}
      loading={loading}
      onToggleBookmark={handleToggleBookmark}
      onSelectParagraph={handleSelectParagraph}
      onBack={handleBack}
    />
  )
}
