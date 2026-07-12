import { useCallback, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getStoryChapters } from '../content/launchStoryChapters'
import { useJourney } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journeyState'
import StoryChaptersTimeline from '../components/journey/StoryChaptersTimeline'
import { getChapterStatuses } from '../utils/storyChapterProgress'
import { ROUTES, arrivalPath, landmarkPath, storyPath, thresholdPath } from '../routes/paths'

export default function StoryChaptersPage() {
  const navigate = useNavigate()
  const { state, context, currentStop, updateContext } = useJourney()

  const chapters = useMemo(() => getStoryChapters(currentStop), [currentStop])
  const chapterStatuses = useMemo(
    () => getChapterStatuses(chapters, context.audioProgress ?? 0),
    [chapters, context.audioProgress]
  )

  const currentChapterIndex = chapterStatuses.findIndex((chapter) => chapter.status === 'current')

  const handleSelectChapter = useCallback(
    (chapter) => {
      updateContext({ audioProgress: chapter.startProgress })
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
    <StoryChaptersTimeline
      stopTitle={currentStop.shortTitle ?? currentStop.title}
      chapters={chapterStatuses}
      currentChapterIndex={currentChapterIndex}
      onSelectChapter={handleSelectChapter}
      onBack={handleBack}
    />
  )
}
