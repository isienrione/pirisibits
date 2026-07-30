import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAct, getWaypoint } from '../../content/manifest.js'
import { JOURNEY_STATES } from '../../state/journey.js'
import { useTourManifest, useV2Journey } from '../../hooks/useV2Journey.js'
import { useSharedWalkGuard } from '../context/SharedWalkGuardContext.jsx'
import {
  accentForWaypoint,
  honestyCaptionForWaypoint,
  photoForWaypoint,
  signatureLine,
  thenLabelForWaypoint,
  thenLoopForWaypoint,
  thenPhotoForWaypoint,
  titleForWaypoint,
} from '../lib/waypointPresentation.js'
import { chapterTitle } from '../../content/chapterMeta.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import E2MemoryDetail from '../screens/E2MemoryDetail.jsx'

export default function RedesignMemoryDetailPage() {
  const navigate = useNavigate()
  const { waypointId } = useParams()
  const { requestJumpToWaypoint } = useSharedWalkGuard()
  const { state, context } = useV2Journey()
  const { manifest, loading, error } = useTourManifest()

  const waypoint = useMemo(
    () => (manifest && waypointId ? getWaypoint(manifest, waypointId) : null),
    [manifest, waypointId],
  )

  const act = useMemo(() => {
    if (!manifest || !waypoint?.act) return null
    return getAct(manifest, waypoint.act)
  }, [manifest, waypoint?.act])

  const goToStopExperience = (targetState, storyView = null) => {
    if (!manifest || !waypointId) return
    void requestJumpToWaypoint(manifest, waypointId, context, state, {
      targetState,
      storyView,
    }).then((jumped) => {
      if (jumped) navigate('/journey')
    })
  }

  const handleWalkToStop = () => {
    goToStopExperience(null)
  }

  if (loading) {
    return (
      <RedesignRouteShell>
        <div className="redesign-app-shell" style={{ minHeight: '100dvh', background: '#FAF6EF' }} />
      </RedesignRouteShell>
    )
  }

  if (error || !waypoint) {
    return (
      <RedesignRouteShell>
        <div className="redesign-app-shell redesign-phone-frame" style={{ padding: 32 }}>
          <p>Stop not found.</p>
          <button type="button" onClick={() => navigate('/tour')}>Back to tour</button>
        </div>
      </RedesignRouteShell>
    )
  }

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell redesign-phone-frame">
        <E2MemoryDetail
          accent={accentForWaypoint(waypoint, manifest)}
          actLabel={act ? `ACT ${act.numeral} — ${act.title?.toUpperCase()}` : undefined}
          title={titleForWaypoint(waypoint)}
          nowPhoto={photoForWaypoint(waypoint)}
          thenPhoto={thenPhotoForWaypoint(waypoint)}
          thenLoop={thenLoopForWaypoint(waypoint)}
          thenLabel={thenLabelForWaypoint(waypoint)}
          honestyCaption={honestyCaptionForWaypoint(waypoint)}
          signatureLine={signatureLine(waypoint)}
          facts={waypoint.keyFacts ?? []}
          transcript={waypoint.transcript ?? waypoint.transcriptPreview}
          chapters={(waypoint.chapters ?? []).map((chapter, index) => ({
            n: index + 1,
            title: chapterTitle(chapter, `Chapter ${index + 1}`),
          }))}
          onBack={() => navigate('/journal')}
          onWalkToStop={handleWalkToStop}
          onStepThroughTime={() => goToStopExperience(JOURNEY_STATES.STORY, 'chapters')}
          onAudioOnly={() => goToStopExperience(JOURNEY_STATES.STORY, 'chapters')}
          onTranscript={() => goToStopExperience(JOURNEY_STATES.STORY, 'transcript')}
          onViewImages={() => goToStopExperience(JOURNEY_STATES.STORY, 'chapters')}
        />
      </div>
    </RedesignRouteShell>
  )
}
